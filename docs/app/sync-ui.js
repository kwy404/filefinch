// Folder sync between two connected devices.
//   A (starts)                         B (answers)
//   scan folder, sync-request   ->     picks the matching folder, scans it
//                               <-     sync-ready (manifest)
//   diff against the stored base, conflicts decided by the person
//   sync-plan (B's view)        ->     person approves
//                               <-     sync-approve
//   sends its files, sync-pull  ->     sends the requested files
//   both delete what the plan says, A stores the new base and sends it in sync-done.

import { $, bytes, el, showDialog, toast } from './ui.js';
import { t } from './i18n.js';
import { dbAll, dbGet, dbPut } from './db.js';
import { randomId } from './lib/bytes.js';
import { Sha256 } from './lib/sha256.js';
import { safePath } from './lib/paths.js';
import { diffManifests, flipBase, flipPlan, nextBase, planSummary, resolveConflicts } from './lib/sync.js';
import { walkDirectory } from './files.js';
import { canPickFolder, dirFor, folderSinks } from './sinks.js';

let app;
let session = null; // the sync in progress, on either side
let chosen = null; // { id, name, handle } picked in the Sync tab

export function initSync(context) {
  app = context;
  const supported = canPickFolder();
  $('#sync-unsupported').hidden = supported;
  $('#sync-setup').hidden = !supported;
  $('#sync-pick').addEventListener('click', () => pickFolder());
  $('#sync-start').addEventListener('click', () => start());
  $('#sync-cancel').addEventListener('click', () => cancel('canceled'));
  $('#sync-apply').addEventListener('click', () => apply());
  app.engine.autoAccept = async (tr) => autoAccept(tr);
  app.syncProgress = (tr) => progress(tr);
  renderRecent();
}

export function syncSupported() {
  return canPickFolder();
}

// ---- folders ----

async function rememberFolder(handle) {
  const all = await dbAll('folders').catch(() => []);
  for (const rec of all) {
    try {
      if (await rec.handle.isSameEntry(handle)) {
        rec.used = Date.now();
        rec.handle = handle;
        await dbPut('folders', rec);
        return rec;
      }
    } catch {}
  }
  const rec = { id: randomId(9), name: handle.name, handle, used: Date.now() };
  await dbPut('folders', rec).catch(() => {});
  return rec;
}

async function ensurePermission(handle) {
  const opts = { mode: 'readwrite' };
  if ((await handle.queryPermission?.(opts)) === 'granted') return true;
  return (await handle.requestPermission?.(opts)) === 'granted';
}

async function pickFolder() {
  try {
    const handle = await showDirectoryPicker({ id: 'filefinch-sync', mode: 'readwrite' });
    useFolder(await rememberFolder(handle));
  } catch (err) {
    if (err?.name !== 'AbortError') toast(t('toast.error', { error: err.message }), 'danger');
  }
}

function useFolder(rec) {
  chosen = rec;
  $('#sync-folder').textContent = rec.name;
  $('#sync-folder').removeAttribute('data-i18n');
  $('#sync-start').disabled = false;
}

async function renderRecent() {
  const box = $('#sync-recent');
  const all = (await dbAll('folders').catch(() => [])).sort((a, b) => b.used - a.used).slice(0, 6);
  box.replaceChildren();
  if (!all.length) return;
  box.append(el('p.text-sm.text-muted-foreground', { text: t('sync.recent') }));
  const wrap = el('div.flex.flex-wrap.gap-2');
  for (const rec of all) {
    wrap.append(
      el('button.chip.chip-outline', {
        type: 'button',
        text: rec.name,
        onclick: async () => {
          if (await ensurePermission(rec.handle)) useFolder(rec);
          else toast(t('sync.permission'), 'warning');
        },
      }),
    );
  }
  box.append(wrap);
}

// ---- manifests ----

async function hashFile(file, onBytes) {
  const h = new Sha256();
  const reader = file.stream().getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    h.update(value);
    onBytes(value.length);
  }
  return h.hex();
}

/** Lists a folder with SHA-256 hashes, reusing cached hashes for files that did not change. */
async function manifest(rec, report) {
  const files = await walkDirectory(rec.handle, '', [], (n) => report(t('sync.scanning', { count: n, size: '...' }), 0));
  const total = files.reduce((s, f) => s + f.size, 0);
  let doneBytes = 0;
  const entries = [];
  for (const f of files) {
    const key = `${rec.id}|${f.path}`;
    const cached = await dbGet('hashes', key).catch(() => null);
    let hash;
    if (cached && cached.size === f.size && cached.mtime === f.mtime) {
      hash = cached.hash;
      doneBytes += f.size;
    } else {
      hash = await hashFile(f.file, (n) => {
        doneBytes += n;
        report(t('sync.scanning', { count: files.length, size: bytes(total) }), total ? doneBytes / total : 1);
      });
      await dbPut('hashes', { size: f.size, mtime: f.mtime, hash }, key).catch(() => {});
    }
    report(t('sync.scanning', { count: files.length, size: bytes(total) }), total ? doneBytes / total : 1);
    entries.push({ path: f.path, size: f.size, mtime: f.mtime, hash });
  }
  return { entries, files: new Map(files.map((f) => [f.path, f])) };
}

function status(text, value) {
  $('#sync-progress').hidden = false;
  $('#sync-status').textContent = text;
  const bar = $('#sync-bar');
  if (value === undefined || value === null) bar.removeAttribute('value');
  else bar.value = value;
}

const baseKey = (peerDevice, folderId, remoteLabel) => `${peerDevice}|${folderId}|${remoteLabel}`;

// ---- side A ----

async function start() {
  if (session) return toast(t('sync.busy'), 'warning');
  if (!app.isConnected()) return toast(t('sync.connect'), 'warning');
  if (!chosen || !(await ensurePermission(chosen.handle))) return toast(t('sync.permission'), 'warning');
  const mode = $('#sync-mode').value;
  session = {
    role: 'a',
    id: randomId(9),
    folder: chosen,
    mode,
    policy: $('#sync-conflict').value,
    deletions: $('#sync-deletions').checked,
    peer: app.peer,
  };
  $('#sync-plan').hidden = true;
  $('#sync-start').disabled = true;
  try {
    const local = await manifest(chosen, status);
    if (!session) return;
    session.local = local;
    status(t('sync.waiting'));
    app.send({ t: 'sync-request', sync: session.id, label: chosen.name, mode });
  } catch (err) {
    fail(err);
  }
}

async function onReady(m) {
  if (!session || session.role !== 'a' || m.sync !== session.id) return;
  status(t('sync.comparing'));
  session.remote = m.entries.map((e) => ({ ...e, path: safePath(e.path) }));
  session.remoteLabel = String(m.label ?? '');
  session.key = baseKey(session.peer.device, session.folder.id, session.remoteLabel);
  session.base = (await dbGet('bases', session.key).catch(() => null)) ?? {};
  const label = `${new Date().toISOString().slice(0, 10)} ${session.peer.name || 'device'}`;
  session.plan = diffManifests(session.local.entries, session.remote, session.base, {
    mode: session.mode,
    deletions: session.deletions,
    conflict: session.policy === 'ask' ? 'ask' : session.policy,
    label,
    localPaths: session.local.entries.map((e) => e.path),
    remotePaths: session.remote.map((e) => e.path),
  });
  session.label = label;
  showPlan();
}

function showPlan() {
  const plan = session.plan;
  const s = planSummary(plan);
  $('#sync-progress').hidden = true;
  $('#sync-plan').hidden = false;
  const stat = (title, value) => el('div.stat', {}, el('p.stat-title', { text: title }), el('p.stat-value', { text: String(value) }));
  $('#sync-plan-stats').replaceChildren(stat(t('sync.stat.send'), s.push), stat(t('sync.stat.get'), s.pull), stat(t('sync.stat.delete'), s.deletes), stat(t('sync.stat.conflicts'), s.conflicts), stat(t('sync.stat.same'), s.unchanged));
  const box = $('#sync-conflicts');
  box.replaceChildren();
  session.choices = {};
  for (const c of plan.conflicts) {
    const id = `c-${randomId(4)}`;
    const select = el('select.select.select-sm', { id }, ...['both', 'local', 'remote', 'newer', 'skip'].map((v) => el('option', { value: v, text: t(`sync.choice.${v}`) })));
    select.addEventListener('change', () => (session.choices[c.path] = select.value));
    session.choices[c.path] = 'both';
    box.append(el('div.ff-conflict', {}, el('div', {}, el('p.ff-file-name.font-medium', { text: c.path }), el('p.text-sm.text-muted-foreground', { text: t(`sync.c.${c.reason}`) })), el('label.sr-only', { for: id, text: c.path }), select));
  }
  const list = $('#sync-plan-list');
  list.replaceChildren();
  const add = (kind, text) => list.children.length < 500 && list.append(el('li', {}, el('span.badge.badge-sm', { text: t(`sync.item.${kind}`) }), ' ', el('span', { text })));
  for (const i of plan.push) add('push', i.as === i.path ? i.path : `${i.path} → ${i.as}`);
  for (const i of plan.pull) add('pull', i.as === i.path ? i.path : `${i.path} → ${i.as}`);
  for (const p of plan.deleteLocal) add('deleteLocal', p);
  for (const p of plan.deleteRemote) add('deleteRemote', p);
  const nothing = !s.push && !s.pull && !s.deletes && !s.conflicts;
  if (nothing) list.append(el('li', { text: t('sync.nothing') }));
  $('#sync-apply').textContent = t('sync.apply');
}

async function apply() {
  if (!session || session.role !== 'a' || !session.plan) return;
  session.final = resolveConflicts(session.plan, session.choices, {
    label: session.label,
    localPaths: session.local.entries.map((e) => e.path),
    remotePaths: session.remote.map((e) => e.path),
  });
  // Conflicts left unchosen are skipped this time.
  session.final.skipped = [...(session.final.skipped ?? []), ...session.final.conflicts.map((c) => c.path)];
  $('#sync-plan').hidden = true;
  status(t('sync.waiting'));
  app.send({ t: 'sync-plan', sync: session.id, plan: wirePlan(flipPlan(session.final)) });
}

const wirePlan = (p) => ({ push: p.push, pull: p.pull, deleteLocal: p.deleteLocal, deleteRemote: p.deleteRemote });

async function onApprove(m) {
  if (!session || session.role !== 'a' || m.sync !== session.id) return;
  if (!m.ok) {
    toast(t('sync.declined'), 'warning');
    return reset();
  }
  const plan = session.final;
  session.approved = true;
  session.failed = new Set();
  session.waitingFor = (plan.push.length ? 1 : 0) + (plan.pull.length ? 1 : 0);
  session.total = plan.push.length + plan.pull.length;
  session.doneCount = 0;
  await deleteLocal(session.folder.handle, plan.deleteLocal);
  if (plan.pull.length) app.send({ t: 'sync-pull', sync: session.id, items: plan.pull });
  if (plan.push.length) sendItems(plan.push);
  if (!session.waitingFor) finishA();
  else status(t('sync.running', { done: 0, total: session.total }), 0);
}

function sendItems(items) {
  const files = items
    .map((i) => {
      const f = session.local?.files.get(i.path) ?? session.files?.get(i.path);
      return f ? { blob: f.file, path: i.as, mtime: f.mtime } : null;
    })
    .filter(Boolean);
  if (!files.length) {
    session.waitingFor--;
    return;
  }
  app.sendFiles(files, { kind: 'sync', sync: session.id, label: `${session.folder.name} (sync)` });
}

async function finishA() {
  const s = session;
  const base = nextBase(s.local.entries, s.remote, s.final, s.base, s.failed);
  await dbPut('bases', base, s.key).catch(() => {});
  app.send({ t: 'sync-done', sync: s.id, base: flipBase(base) });
  done(s);
}

// ---- side B ----

async function onRequest(m) {
  if (session) {
    app.send({ t: 'sync-cancel', sync: m.sync, reason: 'busy' });
    return;
  }
  if (!canPickFolder()) {
    app.send({ t: 'sync-cancel', sync: m.sync, reason: 'unsupported' });
    return;
  }
  const peer = app.peer;
  const dialog = $('#sync-dialog');
  $('#sync-dialog-title').textContent = t('sync.request.title', { name: peer.name });
  const modeText = t({ 'two-way': 'sync.mode.two', push: 'sync.mode.pull', pull: 'sync.mode.push' }[m.mode]);
  $('#sync-dialog-text').textContent = t('sync.request.text', { name: peer.name, label: m.label, mode: modeText.toLowerCase() });
  $('#sync-dialog-list').replaceChildren();
  $('#sync-dialog-yes').textContent = t('sync.request.pick');
  $('#sync-dialog-no').onclick = () => dialog.close('no');
  let rec = null;
  const picked = new Promise((resolve) => {
    $('#sync-form').onsubmit = async (e) => {
      e.preventDefault();
      try {
        const handle = await showDirectoryPicker({ id: 'filefinch-sync', mode: 'readwrite' });
        rec = await rememberFolder(handle);
      } catch {}
      dialog.close(rec ? 'ok' : 'no');
      resolve();
    };
    showDialog(dialog).then(resolve);
  });
  await picked;
  if (!rec) {
    app.send({ t: 'sync-cancel', sync: m.sync, reason: 'declined' });
    return;
  }
  session = { role: 'b', id: m.sync, folder: rec, peer, remoteLabel: m.label, mode: m.mode };
  useFolder(rec);
  app.go('sync');
  try {
    const local = await manifest(rec, status);
    session.local = local;
    session.files = local.files;
    status(t('sync.waiting'));
    app.send({ t: 'sync-ready', sync: session.id, label: rec.name, entries: local.entries });
  } catch (err) {
    fail(err);
  }
}

async function onPlan(m) {
  if (!session || session.role !== 'b' || m.sync !== session.id) return;
  const plan = {
    push: m.plan.push.map((i) => ({ path: safePath(i.path), as: safePath(i.as) })),
    pull: m.plan.pull.map((i) => ({ path: safePath(i.path), as: safePath(i.as) })),
    deleteLocal: m.plan.deleteLocal.map(safePath),
    deleteRemote: m.plan.deleteRemote.map(safePath),
  };
  const dialog = $('#sync-dialog');
  $('#sync-dialog-title').textContent = t('sync.approve.title');
  $('#sync-dialog-text').textContent = t('sync.approve.text', { name: session.peer.name, label: session.remoteLabel, folder: session.folder.name });
  const list = $('#sync-dialog-list');
  list.replaceChildren(
    el('li', { text: `${t('sync.stat.get')}: ${plan.pull.length}` }),
    el('li', { text: `${t('sync.stat.send')}: ${plan.push.length}` }),
    el('li', { text: `${t('sync.stat.delete')}: ${plan.deleteLocal.length}` }),
  );
  for (const p of plan.deleteLocal.slice(0, 20)) list.append(el('li.text-danger.text-sm', { text: `${t('sync.item.deleteLocal')}: ${p}` }));
  $('#sync-dialog-yes').textContent = t('sync.approve.ok');
  $('#sync-dialog-no').onclick = () => dialog.close('no');
  $('#sync-form').onsubmit = (e) => {
    e.preventDefault();
    dialog.close('ok');
  };
  const answer = await showDialog(dialog);
  if (!session) return;
  if (answer !== 'ok') {
    app.send({ t: 'sync-approve', sync: session.id, ok: false });
    return reset();
  }
  session.plan = plan;
  session.failed = new Set();
  session.approved = true;
  session.total = plan.push.length + plan.pull.length;
  session.doneCount = 0;
  await deleteLocal(session.folder.handle, plan.deleteLocal);
  app.send({ t: 'sync-approve', sync: session.id, ok: true });
  status(t('sync.running', { done: 0, total: session.total }), 0);
}

function onPull(m) {
  if (!session || session.role !== 'b' || m.sync !== session.id || !session.approved) return;
  // Only files the approved plan says to send.
  const allowed = new Set(session.plan.push.map((i) => `${i.path}\u0000${i.as}`));
  const items = m.items.map((i) => ({ path: safePath(i.path), as: safePath(i.as) })).filter((i) => allowed.has(`${i.path}\u0000${i.as}`));
  if (items.length) sendItems(items);
}

async function onDone(m) {
  if (!session || session.role !== 'b' || m.sync !== session.id) return;
  const key = baseKey(session.peer.device, session.folder.id, session.remoteLabel);
  if (m.base && typeof m.base === 'object') await dbPut('bases', m.base, key).catch(() => {});
  done(session);
}

// ---- shared ----

/** Incoming sync files are accepted without a prompt only for the sync the person approved. */
function autoAccept(tr) {
  if (tr.kind !== 'sync' || !session?.approved || tr.sync !== session.id) return null;
  const expected = new Set((session.role === 'a' ? session.final.pull : session.plan.pull).map((i) => i.as));
  const keys = tr.files.filter((f) => expected.has(f.path)).map((f) => f.key);
  tr.peerName = session.peer.name;
  return { keys, sinkFor: folderSinks(session.folder.handle, { overwrite: true }) };
}

function progress(tr) {
  if (!session?.approved || tr.sync !== session.id) return;
  const finished = ['done', 'failed', 'canceled', 'declined'].includes(tr.state);
  const doneFiles = [...app.engine.outgoing.values(), ...app.engine.incoming.values()]
    .filter((x) => x.sync === session.id)
    .reduce((n, x) => n + x.files.filter((f) => f.state === 'done' || f.state === 'failed').length, 0);
  status(t('sync.running', { done: doneFiles, total: session.total }), session.total ? doneFiles / session.total : 1);
  if (!finished || tr.syncCounted) return;
  tr.syncCounted = true;
  for (const f of tr.files) if (f.state !== 'done') session.failed?.add(f.path);
  session.doneCount += tr.files.filter((f) => f.state === 'done').length;
  if (session.role === 'a') {
    session.waitingFor--;
    if (session.waitingFor <= 0) finishA();
  }
}

async function deleteLocal(root, paths) {
  for (const p of paths) {
    const parts = p.split('/');
    try {
      const dir = await dirFor(root, parts.slice(0, -1));
      await dir.removeEntry(parts[parts.length - 1]);
    } catch {}
  }
}

function done(s) {
  const plan = s.role === 'a' ? s.final : s.plan;
  const failed = s.failed?.size ?? 0;
  const msg = failed
    ? t('sync.done.failed', { failed })
    : t('sync.done', { sent: plan.push.length, got: plan.pull.length, deleted: plan.deleteLocal.length + plan.deleteRemote.length });
  status(msg, 1);
  toast(msg, failed ? 'warning' : 'success');
  reset(false);
}

function fail(err) {
  toast(t('toast.error', { error: err.message }), 'danger');
  if (session) app.send({ t: 'sync-cancel', sync: session.id, reason: String(err.message).slice(0, 200) });
  reset();
}

function cancel(reason) {
  if (session) app.send({ t: 'sync-cancel', sync: session.id, reason });
  reset();
}

function reset(hideProgress = true) {
  session = null;
  $('#sync-plan').hidden = true;
  if (hideProgress) $('#sync-progress').hidden = true;
  $('#sync-start').disabled = !chosen;
  renderRecent();
}

/** Messages for the sync protocol, routed here by main.js. */
export function onSyncMessage(m) {
  switch (m.t) {
    case 'sync-request':
      return onRequest(m);
    case 'sync-ready':
      return onReady(m);
    case 'sync-plan':
      return onPlan(m);
    case 'sync-approve':
      return onApprove(m);
    case 'sync-pull':
      return onPull(m);
    case 'sync-done':
      return onDone(m);
    case 'sync-cancel':
      if (session && m.sync === session.id) {
        const reason = m.reason === 'declined' ? null : m.reason;
        toast(reason ? t('sync.canceled', { reason }) : t('sync.declined'), 'warning');
        reset();
      }
      return undefined;
    default:
      return undefined;
  }
}

/** The connection dropped: a sync cannot continue half way, it is run again later. */
export function syncConnectionLost() {
  if (session) reset();
}

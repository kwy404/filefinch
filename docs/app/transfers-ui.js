// The Send and Received tabs: picking and dropping files, the queues with per file and overall
// progress, speed and time left, pause, resume and cancel, and the accept dialog for offers.

import { $, button, bytes, duration, el, fileIconName, icon, showDialog, speed, toast } from './ui.js';
import { t } from './i18n.js';
import { SpeedMeter } from './lib/format.js';
import { transferProgress } from './lib/transfer.js';
import { batchLabel, filesFromDrop, filesFromInput } from './files.js';
import { MEMORY_LIMIT, canPickFolder, canSaveFile, canStreamDownloads, downloadStream, folderSinks, fsaFileSink, memorySink, saveFile, zipDownload } from './sinks.js';
import { librarySink, libraryFile } from './library.js';
import { canPreview, openPreview } from './preview.js';
import { recordTransfer } from './history.js';
import { settings } from './settings.js';
import { addToLibrary } from './library.js';
import { celebrate } from './motion.js';

const MAX_ROWS = 300;
const cards = new Map();
const meters = new Map();
let app;
let renderQueued = false;
const dirty = new Set();

export function initTransfers(context) {
  app = context;
  const { engine } = app;

  $('#pick-files').addEventListener('change', (e) => {
    pick(filesFromInput(e.target));
    e.target.value = '';
  });
  $('#pick-folder').addEventListener('change', (e) => {
    pick(filesFromInput(e.target));
    e.target.value = '';
  });
  const zone = $('#dropzone');
  const page = document.body;
  let depth = 0;
  page.addEventListener('dragenter', (e) => {
    if (![...(e.dataTransfer?.types ?? [])].includes('Files')) return;
    depth++;
    zone.classList.add('ff-drag');
  });
  page.addEventListener('dragleave', () => {
    depth = Math.max(0, depth - 1);
    if (!depth) zone.classList.remove('ff-drag');
  });
  page.addEventListener('dragover', (e) => {
    if ([...(e.dataTransfer?.types ?? [])].includes('Files')) e.preventDefault();
  });
  page.addEventListener('drop', async (e) => {
    if (![...(e.dataTransfer?.types ?? [])].includes('Files')) return;
    e.preventDefault();
    depth = 0;
    zone.classList.remove('ff-drag');
    const pending = filesFromDrop(e.dataTransfer);
    app.go('send');
    toast(t('send.reading'), 'info', 1500);
    try {
      pick(await pending);
    } catch (err) {
      toast(t('toast.error', { error: err.message }), 'danger');
    }
  });

  engine.on('update', (tr) => queueRender(tr));
  engine.on('progress', (tr) => queueRender(tr));
  engine.on('offer', (tr) => offerQueue(tr));
  engine.on('file', ({ t: tr, f }) => onFileDone(tr, f));
  engine.on('finished', (tr) => onFinished(tr));
}

export function pick(files) {
  if (!files.length) {
    toast(t('send.nothing'), 'warning');
    return null;
  }
  return sendFiles(files);
}

export function sendFiles(files, meta = {}) {
  const label = meta.label ?? batchLabel(files, (n) => t('tr.files', { count: n }));
  const tr = app.engine.send(
    files.map((f) => ({ blob: f.blob, path: f.path, mtime: f.mtime, type: f.blob.type })),
    { label, ...meta },
  );
  tr.peerName = app.peer?.name ?? '';
  app.go('send');
  return tr;
}

// ---- rendering ----

function queueRender(tr) {
  if (tr.kind === 'sync') app.syncProgress?.(tr);
  dirty.add(tr);
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    for (const x of dirty) render(x);
    dirty.clear();
    renderOverall();
  });
}

function meter(tr) {
  let m = meters.get(tr.id);
  if (!m) {
    m = new SpeedMeter();
    meters.set(tr.id, m);
  }
  return m;
}

function stateText(tr) {
  switch (tr.state) {
    case 'active':
      if (tr.paused) return t(tr.pausedBy === 'peer' ? 'state.paused.peer' : 'state.paused.me');
      return t(tr.dir === 'out' ? 'state.active.out' : 'state.active.in');
    case 'failed':
      return t('state.failed', { count: tr.failed, total: tr.files.filter((f) => f.state !== 'skipped').length });
    case 'canceled':
      return t(`state.canceled.${tr.canceledBy ?? 'me'}`);
    default:
      return t(`state.${tr.state}`);
  }
}

const BADGE = { done: 'badge-success', failed: 'badge-danger', canceled: 'badge-neutral', declined: 'badge-neutral', interrupted: 'badge-warning', active: 'badge-primary', offered: 'badge-info', pending: 'badge-warning', waiting: 'badge-info' };

function buildCard(tr) {
  const list = tr.dir === 'out' ? $('#send-list') : $('#received-list');
  const head = el(
    'div.ff-tr-head',
    {},
    el('span.ff-tr-icon', {}, icon(tr.kind === 'sync' ? 'sync' : tr.files.length > 1 ? 'folder' : fileIconName(tr.files[0].name, tr.files[0].type))),
    el('div.ff-tr-title', {}, el('p.ff-tr-label', { text: tr.label }), el('p.ff-tr-meta.text-sm.text-muted-foreground')),
    el('span.badge.ff-tr-state'),
  );
  const bar = el('progress.progress.progress-sm.ff-tr-bar', { max: 1, value: 0 });
  const stats = el('p.ff-tr-stats.text-sm.text-muted-foreground', { 'aria-live': 'off' });
  const actions = el('div.ff-tr-actions');
  const files = el('details.ff-tr-files', {}, el('summary', { text: t('tr.showfiles') }), el('ul.ff-file-list'));
  const note = el('p.ff-tr-note.text-sm', { hidden: true });
  const card = el('article.card.ff-card.ff-tr', { dataset: { id: tr.id } }, el('div.card-body', {}, head, bar, stats, note, actions, files));
  list.prepend(card);
  const entry = { card, head, bar, stats, actions, files, note, rows: new Map(), lastActions: '' };
  cards.set(`${tr.dir}:${tr.id}`, entry);
  files.addEventListener('toggle', () => files.open && render(tr));
  return entry;
}

function render(tr) {
  const key = `${tr.dir}:${tr.id}`;
  const entry = cards.get(key) ?? buildCard(tr);
  const { done, total } = transferProgress(tr);
  const m = meter(tr);
  if (tr.state === 'active' && !tr.paused) {
    tr.startedAt ??= Date.now();
    m.add(done);
  } else m.reset();
  const count = tr.files.length;
  entry.head.querySelector('.ff-tr-meta').textContent = [count === 1 ? t('tr.file') : t('tr.files', { count }), bytes(total), tr.peerName ? t(tr.dir === 'out' ? 'tr.to' : 'tr.from', { name: tr.peerName }) : ''].filter(Boolean).join(' · ');
  const badge = entry.head.querySelector('.ff-tr-state');
  badge.className = `badge ff-tr-state ${BADGE[tr.state] ?? 'badge-neutral'}`;
  badge.textContent = stateText(tr);
  entry.bar.value = total ? done / total : tr.state === 'done' ? 1 : 0;
  entry.bar.className = `progress progress-sm ff-tr-bar ${tr.state === 'done' ? 'progress-success' : tr.state === 'failed' ? 'progress-danger' : tr.paused || tr.state === 'interrupted' ? 'progress-warning' : ''}`;
  entry.bar.textContent = `${Math.round((entry.bar.value || 0) * 100)}%`;
  const v = m.speed;
  const parts = [t('tr.of', { done: bytes(done), total: bytes(total) })];
  if (tr.state === 'active' && !tr.paused && v > 0) parts.push(t('tr.speed', { speed: speed(v), eta: duration(m.eta(total - done)) }));
  if (tr.state === 'done' && tr.finished && tr.startedAt) parts.push(speed(total / Math.max(0.001, (tr.finished - tr.startedAt) / 1000)));
  entry.stats.textContent = parts.join(' · ');
  if (tr.note) {
    entry.note.hidden = false;
    entry.note.textContent = tr.note;
  }
  renderActions(tr, entry);
  if (tr.dir === 'out' && tr.state === 'active' && !tr.liftedOff) {
    tr.liftedOff = true;
    celebrate.sent(entry.card);
  }
  if (entry.files.open || tr.files.length === 1) renderFiles(tr, entry);
  entry.files.hidden = tr.files.length === 1;
  updateEmpty();
}

function renderActions(tr, entry) {
  const sig = `${tr.state}|${tr.paused}|${tr.pausedBy}`;
  if (sig === entry.lastActions) return;
  entry.lastActions = sig;
  const { engine } = app;
  const a = [];
  const open = ['waiting', 'offered', 'active', 'interrupted', 'pending'].includes(tr.state);
  if (tr.state === 'active' || tr.state === 'interrupted') {
    if (tr.paused) a.push(button(t('tr.resume'), 'play', () => engine.resume(tr.id), 'btn-soft btn-sm'));
    else a.push(button(t('tr.pause'), 'pause', () => engine.pause(tr.id), 'btn-ghost btn-sm'));
  }
  if (open && tr.state !== 'pending') a.push(button(t('tr.cancel'), 'x', () => engine.cancel(tr.id), 'btn-ghost btn-sm'));
  if (!open) {
    a.push(
      button(t('tr.dismiss'), 'x', () => {
        entry.card.remove();
        cards.delete(`${tr.dir}:${tr.id}`);
        meters.delete(tr.id);
        engine.outgoing.delete(tr.id);
        engine.incoming.delete(tr.id);
        updateEmpty();
        renderOverall();
      }, 'btn-ghost btn-sm'),
    );
  }
  entry.actions.replaceChildren(...a);
}

function renderFiles(tr, entry) {
  const ul = tr.files.length === 1 ? null : entry.files.querySelector('ul');
  const target = ul ?? entry.note.parentElement;
  const rows = tr.files.slice(0, MAX_ROWS);
  for (const f of rows) {
    let row = entry.rows.get(f.key);
    if (!row) {
      const bar = el('progress.progress.progress-xs', { max: 1, value: 0 });
      const state = el('span.ff-file-state.text-xs');
      const acts = el('span.ff-file-acts');
      const li = el(tr.files.length === 1 ? 'div.ff-file.ff-file-single' : 'li.ff-file', {}, icon(fileIconName(f.name, f.type)), el('span.ff-file-name', { text: f.path, title: f.path }), el('span.ff-file-size.text-xs.text-muted-foreground', { text: bytes(f.size) }), state, bar, acts);
      if (ul) ul.append(li);
      else target.insertBefore(li, entry.actions);
      row = { li, bar, state, acts, sig: '' };
      entry.rows.set(f.key, row);
    }
    const done = tr.dir === 'out' ? (f.state === 'done' ? f.size : f.acked) : f.written;
    row.bar.value = f.size ? done / f.size : f.state === 'done' ? 1 : 0;
    row.state.textContent = t(`file.${f.state}`);
    row.state.className = `ff-file-state text-xs ${f.state === 'done' ? 'text-success' : f.state === 'failed' ? 'text-danger' : 'text-muted-foreground'}`;
    if (f.error) row.li.title = f.error;
    const sig = `${f.state}|${f.saved?.kind ?? ''}`;
    if (sig !== row.sig) {
      row.sig = sig;
      row.acts.replaceChildren(...fileActions(tr, f));
    }
  }
  if (ul && tr.files.length > MAX_ROWS && !ul.querySelector('.ff-more')) ul.append(el('li.ff-more.text-sm.text-muted-foreground', { text: t('tr.more', { count: tr.files.length - MAX_ROWS }) }));
}

function fileActions(tr, f) {
  if (tr.dir !== 'in' || f.state !== 'done' || !f.saved?.getFile) return [];
  const out = [];
  if (canPreview(f.name, f.type)) out.push(button('', 'eye', () => openPreview(f.name, f.type, f.saved.getFile), 'btn-ghost btn-xs btn-square', { 'aria-label': `${t('tr.preview')}: ${f.name}`, title: t('tr.preview') }));
  if (f.saved.kind === 'memory' || f.saved.kind === 'library') {
    out.push(
      button('', 'save', async () => {
        try {
          if (await saveFile(await f.saved.getFile(), f.name)) toast(t('toast.saved', { name: f.name }), 'success');
        } catch (err) {
          toast(t('toast.error', { error: err.message }), 'danger');
        }
      }, 'btn-ghost btn-xs btn-square', { 'aria-label': `${t('tr.save')}: ${f.name}`, title: t('tr.save') }),
    );
  }
  if (f.saved.kind === 'memory') {
    out.push(
      button('', 'library', async () => {
        try {
          await addToLibrary(await f.saved.getFile(), { name: f.name, path: f.path, from: tr.peerName });
          toast(t('toast.library', { name: f.name }), 'success');
          app.refreshLibrary?.();
        } catch (err) {
          toast(t('toast.error', { error: err.message }), 'danger');
        }
      }, 'btn-ghost btn-xs btn-square', { 'aria-label': `${t('tr.keep')}: ${f.name}`, title: t('tr.keep') }),
    );
  }
  return out;
}

function renderOverall() {
  const active = [...app.engine.outgoing.values()].filter((x) => ['offered', 'active', 'interrupted'].includes(x.state));
  const box = $('#send-overall');
  box.hidden = active.length < 2;
  let done = 0;
  let total = 0;
  for (const x of active) {
    const p = transferProgress(x);
    done += p.done;
    total += p.total;
  }
  const v = active.reduce((s, x) => s + (meters.get(x.id)?.speed ?? 0), 0);
  $('#send-overall-bar').value = total ? done / total : 0;
  $('#send-overall-text').textContent = [t('tr.of', { done: bytes(done), total: bytes(total) }), v > 0 ? t('tr.speed', { speed: speed(v), eta: duration((total - done) / v) }) : ''].filter(Boolean).join(' · ');
  const sendCount = active.length;
  const recvCount = [...app.engine.incoming.values()].filter((x) => ['pending', 'active', 'interrupted'].includes(x.state)).length;
  for (const [id, n] of [['#count-send', sendCount], ['#count-received', recvCount]]) {
    const c = $(id);
    c.hidden = !n;
    c.textContent = n;
  }
}

function updateEmpty() {
  $('#send-empty').hidden = !!$('#send-list').children.length;
  $('#received-empty').hidden = !!$('#received-list').children.length;
}

// ---- receiving ----

const offers = [];
let offerOpen = false;

function offerQueue(tr) {
  tr.peerName = app.peer?.name ?? '';
  queueRender(tr);
  toast(t('toast.offer', { name: tr.peerName || '?' }), 'info');
  offers.push(tr);
  if (!offerOpen) nextOffer();
}

async function nextOffer() {
  const tr = offers.shift();
  if (!tr) return;
  if (tr.state !== 'pending') return nextOffer();
  offerOpen = true;
  try {
    await askOffer(tr);
  } finally {
    offerOpen = false;
    nextOffer();
  }
}

async function destinations(tr) {
  const single = tr.files.length === 1;
  const total = transferProgress(tr).total;
  const list = [];
  if (single && canSaveFile()) list.push('file');
  if (canPickFolder()) list.push('folder');
  if (await canStreamDownloads()) list.push('download');
  list.push('library');
  if (total <= MEMORY_LIMIT) list.push('memory');
  return list;
}

async function askOffer(tr) {
  const dialog = $('#offer-dialog');
  const total = transferProgress(tr).total;
  $('#offer-title').textContent = t('offer.title', { name: tr.peerName || '?' });
  $('#offer-summary').textContent = tr.files.length === 1 ? t('offer.summary1', { size: bytes(total) }) : t('offer.summary', { count: tr.files.length, size: bytes(total) });
  const box = $('#offer-files');
  box.replaceChildren();
  const checks = [];
  const selectable = tr.files.length > 1 && tr.files.length <= MAX_ROWS;
  if (selectable) {
    const all = el('input.checkbox.checkbox-sm', { type: 'checkbox', checked: true });
    all.addEventListener('change', () => {
      for (const c of checks) c.checked = all.checked;
      updateAccept();
    });
    box.append(el('label.ff-offer-row.ff-offer-all', {}, all, el('span', { text: t('offer.all') })));
  }
  for (const f of tr.files.slice(0, MAX_ROWS)) {
    const row = el('label.ff-offer-row', {}, icon(fileIconName(f.name, f.type)), el('span.ff-offer-name', { text: f.path, title: f.path }), el('span.text-xs.text-muted-foreground', { text: bytes(f.size) }));
    if (selectable) {
      const c = el('input.checkbox.checkbox-sm', { type: 'checkbox', checked: true, dataset: { key: f.key } });
      c.addEventListener('change', updateAccept);
      checks.push(c);
      row.prepend(c);
    }
    box.append(row);
  }
  if (tr.files.length > MAX_ROWS) box.append(el('p.text-sm.text-muted-foreground', { text: t('tr.more', { count: tr.files.length - MAX_ROWS }) }));

  const dests = await destinations(tr);
  const preferred = settings.destination === 'library' ? 'library' : settings.destination === 'download' && dests.includes('download') ? 'download' : dests[0];
  const destBox = $('#offer-dests');
  destBox.replaceChildren(
    ...dests.map((d) =>
      el(
        'label.radio-card.ff-dest-card',
        {},
        el('input.radio', { type: 'radio', name: 'offer-dest', value: d, checked: d === preferred }),
        el('span.grid.gap-1', {}, el('span.font-medium', { text: t(`dest.${d}`) }), el('span.text-sm.text-muted-foreground', { text: t(`dest.${d}.d`) })),
      ),
    ),
  );
  const acceptBtn = $('#offer-accept');
  function updateAccept() {
    const n = selectable ? checks.filter((c) => c.checked).length : tr.files.length;
    acceptBtn.disabled = n === 0;
    acceptBtn.textContent = selectable && n !== tr.files.length ? t('offer.acceptn', { count: n }) : t('offer.accept');
  }
  updateAccept();
  $('#offer-decline').onclick = () => dialog.close('decline');
  // Cancel with Escape counts as decline too.
  const result = await new Promise((resolve) => {
    $('#offer-form').onsubmit = async (e) => {
      e.preventDefault();
      const dest = destBox.querySelector('input:checked')?.value;
      const keys = selectable ? checks.filter((c) => c.checked).map((c) => Number(c.dataset.key)) : undefined;
      // Pickers need the click's user activation, so they run before the dialog closes.
      const plan = await buildPlan(tr, dest, keys);
      dialog.close(plan ? 'accept' : 'decline');
      resolve(plan);
    };
    showDialog(dialog).then((v) => v !== 'accept' && resolve(null));
  });
  if (tr.state !== 'pending') return; // canceled by the sender meanwhile
  if (!result) {
    app.engine.decline(tr.id);
    return;
  }
  app.engine.accept(tr.id, result);
  app.go('received');
}

async function buildPlan(tr, dest, keys) {
  const chosen = keys ? tr.files.filter((f) => keys.includes(f.key)) : tr.files;
  if (!chosen.length) return null;
  const from = tr.peerName;
  let sinkFor;
  try {
    if (dest === 'file') {
      const handle = await showSaveFilePicker({ suggestedName: chosen[0].name });
      sinkFor = async (f) => track(f, await fsaFileSink(handle), 'file');
    } else if (dest === 'folder') {
      const root = await showDirectoryPicker({ id: 'filefinch-receive', mode: 'readwrite' });
      const make = folderSinks(root);
      sinkFor = async (f) => track(f, await make(f), 'folder');
    } else if (dest === 'download') {
      if (chosen.length === 1) {
        const stream = await downloadStream(chosen[0].name, chosen[0].size);
        sinkFor = async (f) => track(f, stream, 'download');
      } else {
        const zipName = `${tr.label.replace(/[\\/:*?"<>|]/g, '_') || 'filefinch'}.zip`;
        const zip = await zipDownload(zipName, chosen);
        tr.zip = zip;
        tr.note = t('tr.zipnote', { name: zipName });
        sinkFor = async (f) => track(f, await zip.sinkFor(f), 'download');
      }
    } else if (dest === 'library') {
      sinkFor = async (f) => track(f, await librarySink({ name: f.name, path: f.path, type: f.type, mtime: f.mtime, from }), 'library');
    } else {
      sinkFor = async (f) => track(f, memorySink(f.type), 'memory');
    }
  } catch (err) {
    if (err?.name === 'AbortError') toast(t('dest.canceled'), 'warning');
    else toast(t('toast.error', { error: err.message }), 'danger');
    return null;
  }
  tr.dest = dest;
  return { keys: chosen.map((f) => f.key), sinkFor };
}

/** Wraps a sink so the file record knows where it went and the library gets the hash. */
function track(f, sink, kind) {
  return {
    write: (d) => sink.write(d),
    abort: (r) => sink.abort(r),
    close: async () => {
      sink.setHash?.(f.hash);
      await sink.close();
      f.saved = {
        kind,
        getFile: kind === 'library' ? () => libraryFile(sink.id) : sink.file ? () => sink.file() : null,
      };
    },
  };
}

function onFileDone(tr, f) {
  if (tr.dir === 'in' && f.state === 'failed' && f.integrity) toast(t('toast.integrity', { name: f.name }), 'danger', 9000);
  queueRender(tr);
}

async function onFinished(tr) {
  tr.finished ??= Date.now();
  if (tr.zip) await tr.zip.finish(tr.state === 'done' || tr.state === 'failed').catch(() => {});
  if (tr.dir === 'in' && tr.dest) {
    const key = { download: 'tr.saved.download', folder: 'tr.saved.folder', file: 'tr.saved.file', library: 'tr.saved.library', memory: 'tr.saved.memory' }[tr.dest];
    if (!tr.note && tr.state !== 'canceled') tr.note = t(key);
  }
  if (tr.kind !== 'sync') {
    if (tr.state === 'done' && tr.dir === 'in') requestAnimationFrame(() => celebrate.received(cards.get(`in:${tr.id}`)?.card));
    if (tr.state === 'done') toast(t(tr.dir === 'out' ? 'toast.sent' : 'toast.received', { label: tr.label }), 'success');
    if (tr.dest === 'library') app.refreshLibrary?.();
  }
  if (!['declined'].includes(tr.state) || tr.dir === 'out') await recordTransfer(tr, tr.peerName || app.peer?.name);
  app.refreshHistory?.();
  queueRender(tr);
}

export function refreshAll() {
  for (const tr of [...app.engine.outgoing.values(), ...app.engine.incoming.values()]) {
    const entry = cards.get(`${tr.dir}:${tr.id}`);
    if (entry) {
      entry.lastActions = '';
      for (const row of entry.rows.values()) row.sig = '';
      entry.files.querySelector('summary').textContent = t('tr.showfiles');
    }
    queueRender(tr);
  }
}

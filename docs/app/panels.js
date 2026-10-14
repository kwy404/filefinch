// The Library and History tabs and the Settings dialog.

import { $, button, bytes, dateTime, el, fileIconName, icon, showDialog, speed, toast } from './ui.js';
import { t, getLang } from './i18n.js';
import { addToLibrary, libraryFile, listLibrary, removeFromLibrary, storageEstimate } from './library.js';
import { clearHistory, listHistory } from './history.js';
import { canPreview, openPreview } from './preview.js';
import { saveFile } from './sinks.js';
import { DEFAULT_STUN, iceConfig, save, settings, validIceUrl } from './settings.js';
import { testTurn } from './connection.js';

let app;

export function initPanels(context) {
  app = context;
  app.refreshLibrary = refreshLibrary;
  app.refreshHistory = refreshHistory;
  $('#library-add').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    try {
      for (const f of files) await addToLibrary(f, { name: f.name, path: f.name, from: '' });
      toast(t('library.added', { count: files.length }), 'success');
    } catch (err) {
      toast(t('toast.error', { error: err.message }), 'danger');
    }
    refreshLibrary();
  });
  $('#library-persist').addEventListener('click', async () => {
    await navigator.storage?.persist?.();
    refreshLibrary();
  });
  const clear = async () => {
    await clearHistory();
    refreshHistory();
  };
  $('#history-clear').addEventListener('click', clear);
  $('#clear-history-2').addEventListener('click', clear);
  $('#clear-library').addEventListener('click', async () => {
    if (!confirm(t('library.confirmall'))) return;
    for (const item of await listLibrary()) await removeFromLibrary(item.id);
    refreshLibrary();
  });
  $('#settings-btn').addEventListener('click', () => openSettings());
  $('#turn-add').addEventListener('click', () => addTurnRow({}));
  refreshLibrary();
  refreshHistory();
}

// ---- library ----

export async function refreshLibrary() {
  const list = $('#library-list');
  let items = [];
  try {
    items = await listLibrary();
  } catch (err) {
    list.replaceChildren(el('p.text-danger', { text: err.message }));
    return;
  }
  list.replaceChildren(
    ...items.map((item) => {
      const getFile = () => libraryFile(item.id);
      const acts = el('div.ff-lib-actions');
      if (canPreview(item.name, item.type)) acts.append(button(t('tr.preview'), 'eye', () => openPreview(item.name, item.type, getFile)));
      acts.append(
        button(t('tr.save'), 'save', async () => {
          try {
            if (await saveFile(await getFile(), item.name)) toast(t('toast.saved', { name: item.name }), 'success');
          } catch (err) {
            toast(t('toast.error', { error: err.message }), 'danger');
          }
        }),
        button(t('library.send'), 'send', async () => {
          const file = await getFile();
          app.sendFiles([{ blob: file, path: item.path?.split('/').pop() || item.name, mtime: item.mtime }]);
        }),
        button('', 'trash', async () => {
          if (!confirm(t('library.confirm', { name: item.name }))) return;
          await removeFromLibrary(item.id);
          refreshLibrary();
        }, 'btn-ghost btn-sm btn-square', { 'aria-label': `${t('library.delete')}: ${item.name}`, title: t('library.delete') }),
      );
      const meta = [bytes(item.size), dateTime(item.added), item.from ? t('library.from', { name: item.from }) : ''].filter(Boolean).join(' · ');
      return el(
        'article.card.ff-card.ff-lib',
        {},
        el('div.card-body', {}, el('div.ff-tr-head', {}, el('span.ff-tr-icon', {}, icon(fileIconName(item.name, item.type))), el('div.ff-tr-title', {}, el('p.ff-tr-label', { text: item.name }), el('p.text-sm.text-muted-foreground', { text: meta }))), acts),
      );
    }),
  );
  $('#library-empty').hidden = items.length > 0;
  const est = await storageEstimate();
  $('#library-usage').textContent = est ? `${t('library.usage', { used: bytes(est.usage), quota: bytes(est.quota) })}${est.persisted ? `. ${t('library.persisted')}` : ''}` : '';
  $('#library-persist').hidden = !navigator.storage?.persist || !!est?.persisted;
}

// ---- history ----

export async function refreshHistory() {
  const rows = await listHistory();
  const body = $('#history-body');
  body.replaceChildren(
    ...rows.map((r) => {
      const result = r.state === 'done' ? t('history.r.done') : r.state === 'failed' ? t('history.r.failed', { count: r.failed }) : r.state === 'declined' ? t('history.r.declined') : t('history.r.canceled');
      const what = el('td', {}, el('span.ff-hist-dir', {}, icon(r.dir === 'out' ? 'send' : 'inbox'), el('span.sr-only', { text: t(r.dir === 'out' ? 'history.sent' : 'history.received') })), el('span', { text: ` ${r.label}${r.kind === 'sync' ? ` (${t('history.sync')})` : ''}` }));
      return el(
        'tr',
        {},
        el('td', { text: dateTime(r.finished) }),
        what,
        el('td', { text: r.peer || '-' }),
        el('td', { text: `${bytes(r.bytes)} · ${r.files}` }),
        el('td', { text: r.speed ? speed(r.speed) : '-' }),
        el('td', {}, el(`span.badge.${r.state === 'done' ? 'badge-success' : r.state === 'failed' ? 'badge-danger' : 'badge-neutral'}`, { text: result })),
      );
    }),
  );
  $('#history-empty').hidden = rows.length > 0;
  $('#history-wrap').hidden = rows.length === 0;
}

// ---- settings ----

function addTurnRow(entry) {
  const tpl = $('#tpl-turn').content.cloneNode(true);
  const row = tpl.querySelector('.ff-turn');
  const uid = Math.random().toString(36).slice(2, 8);
  for (const input of row.querySelectorAll('input')) {
    input.id = `turn-${input.name}-${uid}`;
    input.previousElementSibling.setAttribute('for', input.id);
    input.value = entry[input.name] ?? '';
  }
  for (const n of row.querySelectorAll('[data-i18n]')) n.textContent = t(n.dataset.i18n);
  row.querySelector('[data-turn="remove"]').setAttribute('aria-label', t('remove'));
  row.querySelector('[data-turn="remove"]').addEventListener('click', () => row.remove());
  row.querySelector('[data-turn="test"]').addEventListener('click', async () => {
    const out = row.querySelector('[data-turn="result"]');
    const server = readTurn(row);
    if (!server.urls.split(/[\s,]+/).every(validIceUrl) || !/^turns?:/i.test(server.urls)) {
      out.className = 'text-sm text-danger';
      out.textContent = t('settings.turn.invalid');
      return;
    }
    out.className = 'text-sm text-muted-foreground';
    out.textContent = t('settings.turn.testing');
    const cfg = iceConfig({ stun: [], turn: [server], relayOnly: true });
    const res = await testTurn(cfg.iceServers[0]);
    out.className = `text-sm ${res.ok ? 'text-success' : 'text-danger'}`;
    out.textContent = res.ok ? t('settings.turn.ok', { ms: res.ms }) : t('settings.turn.bad', { error: res.error ?? '' });
  });
  $('#turn-list').append(row);
}

const readTurn = (row) => ({
  urls: row.querySelector('[name="urls"]').value.trim(),
  username: row.querySelector('[name="username"]').value.trim(),
  credential: row.querySelector('[name="credential"]').value,
});

export async function openSettings(focusIce = false) {
  const dialog = $('#settings-dialog');
  $('#set-name').value = settings.name;
  $('#set-dest').value = settings.destination;
  $('#set-lang').value = getLang();
  $('#set-theme').value = app.getTheme();
  $('#set-stun').value = settings.stun.join('\n');
  $('#set-relayonly').checked = settings.relayOnly;
  $('#set-sound').checked = settings.sound;
  $('#set-mode').value = settings.connectMode;
  $('#turn-list').replaceChildren();
  for (const entry of settings.turn) addTurnRow(entry);
  $('#settings-close').onclick = () => dialog.close('');
  $('#settings-cancel').onclick = () => dialog.close('');
  $('#settings-form').onsubmit = (e) => {
    e.preventDefault();
    dialog.close('save');
  };
  if (focusIce) setTimeout(() => $('#ice-section').scrollIntoView({ block: 'start' }), 50);
  const result = await showDialog(dialog);
  if (result !== 'save') return;
  settings.name = $('#set-name').value.trim().slice(0, 40) || settings.name;
  settings.destination = $('#set-dest').value;
  const lines = $('#set-stun').value.split(/\s+/).map((s) => s.trim()).filter(Boolean);
  const bad = lines.filter((l) => !/^stuns?:/i.test(l) || !validIceUrl(l));
  settings.stun = lines.filter((l) => !bad.includes(l));
  if (!lines.length) settings.stun = [...DEFAULT_STUN];
  settings.turn = [...$('#turn-list').querySelectorAll('.ff-turn')].map(readTurn).filter((x) => x.urls);
  settings.relayOnly = $('#set-relayonly').checked;
  settings.sound = $('#set-sound').checked;
  const modeChanged = settings.connectMode !== $('#set-mode').value;
  settings.connectMode = $('#set-mode').value;
  save();
  if (modeChanged) app.connectModeChanged?.();
  $('#device-name').value = settings.name;
  if ($('#set-lang').value !== getLang()) app.setLanguage($('#set-lang').value);
  app.setTheme($('#set-theme').value);
  toast(t('settings.saved'), 'success');
  if (bad.length) toast(t('settings.badstun', { list: bad.join(', ') }), 'warning');
}

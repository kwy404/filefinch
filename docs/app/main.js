// filefinch app entry: navigation, theme and language, the invite and reply flow, the hello
// handshake (device id, passphrase check) and the glue between the connection and the engine.

import { applyI18n, getLang, setLang, t } from './i18n.js';
import { $, $$, bytes, copyText, showDialog, toast } from './ui.js';
import { settings, save, iceConfig } from './settings.js';
import { Connection, signalChannel } from './connection.js';
import { TransferEngine } from './lib/transfer.js';
import { PassphraseLayer, makeKeyCheck, verifyKeyCheck } from './lib/crypto.js';
import { decodeSignal, findSignal, signalLink } from './lib/invite.js';
import { decodeControl } from './lib/protocol.js';
import { encodeQr, qrSvg } from './lib/qr.js';
import { fromBase64Url, randomId, toBase64Url } from './lib/bytes.js';
import { PROTOCOL_VERSION } from './lib/version.js';
import { initTransfers, refreshAll, sendFiles } from './transfers-ui.js';
import { initSync, onSyncMessage, syncConnectionLost } from './sync-ui.js';
import { initPanels, openSettings, refreshHistory, refreshLibrary } from './panels.js';
import { canScan, scanSignal } from './scan.js';

const VIEWS = ['connect', 'send', 'received', 'sync', 'library', 'history'];
const engine = new TransferEngine({ onMessage: (m) => onMessage(m) });

let conn = null;
let layer = null;
let helloDone = false;
let preHello = [];
let lastPeerDevice = null;
let connectPanel = 'start';

const app = {
  engine,
  peer: null,
  go,
  send: (m) => engine.sendControl(m),
  sendFiles: (files, meta) => sendFiles(files, meta),
  isConnected: () => helloDone && conn?.state === 'open',
  getTheme,
  setTheme,
  setLanguage,
};

// ---- navigation ----

function go(view, focus = false) {
  if (!VIEWS.includes(view)) view = 'connect';
  for (const v of VIEWS) $(`#view-${v}`).hidden = v !== view;
  for (const b of $$('.ff-tab')) {
    if (b.dataset.go === view) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
  try {
    sessionStorage.setItem('filefinch:view', view);
  } catch {}
  if (focus) $(`#h-${view}`)?.focus({ preventScroll: false });
}

// ---- theme and language ----

function getTheme() {
  try {
    let v = localStorage.getItem('voodoo:theme');
    if (v && v.startsWith('"')) v = JSON.parse(v);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function setTheme(mode) {
  const root = document.documentElement;
  try {
    if (mode === 'system') localStorage.removeItem('voodoo:theme');
    else localStorage.setItem('voodoo:theme', JSON.stringify(mode));
  } catch {}
  if (mode === 'light' || mode === 'dark') {
    root.setAttribute('data-theme', mode);
    root.style.colorScheme = mode;
  } else {
    root.removeAttribute('data-theme');
    root.style.colorScheme = '';
  }
  $('#theme-icon').setAttribute('href', mode === 'light' ? '#i-sun' : mode === 'dark' ? '#i-moon' : '#i-auto');
  $('#theme-btn').setAttribute('aria-label', t('theme.label', { mode: t(`theme.${mode}`) }));
  $('#theme-btn').title = t('theme.label', { mode: t(`theme.${mode}`) });
}

function setLanguage(lang) {
  setLang(lang);
  $('#lang-code').textContent = getLang().toUpperCase();
  $('#lang-btn').setAttribute('aria-label', t('lang.switch'));
  setTheme(getTheme());
  renderPill();
  renderStatus();
  refreshAll();
  refreshHistory();
  refreshLibrary();
  if (conn?.peerName && connectPanel === 'reply') $('#reply-title').textContent = t('reply.title', { name: conn.peerName });
}

// ---- connect panels ----

const PANELS = { start: '#connect-start', invite: '#connect-invite', reply: '#connect-reply', busy: '#connect-busy', failed: '#connect-failed', status: '#connect-status', lost: '#connect-lost' };

function showPanel(name, text) {
  connectPanel = name;
  for (const [k, sel] of Object.entries(PANELS)) $(sel).hidden = k !== name;
  if (name === 'busy') $('#busy-text').textContent = text ?? '';
  renderPill();
}

function renderPill() {
  const dot = $('#conn-dot');
  const text = $('#conn-text');
  let cls = 'status-offline';
  let label = t('pill.offline');
  if (app.isConnected()) {
    cls = conn.unstable ? 'status-away' : 'status-online';
    label = conn.unstable ? t('pill.unstable') : t('pill.connected', { name: app.peer?.name ?? '' });
  } else if (conn && ['connecting', 'open'].includes(conn.state)) {
    cls = 'status-away';
    label = t('pill.connecting');
  } else if (connectPanel === 'lost') {
    cls = 'status-busy';
    label = t('pill.lost');
  }
  dot.className = `status ${cls}`;
  text.textContent = label;
  $('#send-offline').hidden = app.isConnected();
}

function errorText(err) {
  const code = err?.code;
  if (code === 'kind') return t(err.message.includes('reply code') ? 'err.kind-i' : 'err.kind-r');
  if (code && t(`err.${code}`) !== `err.${code}`) return t(`err.${code}`);
  if (/already used/.test(err?.message)) return t('err.used');
  return err?.message || String(err);
}

function supported() {
  if (!('RTCPeerConnection' in globalThis)) {
    showFailure(t('err.webrtc'));
    return false;
  }
  if (!globalThis.crypto?.subtle) {
    showFailure(t('err.secure'));
    return false;
  }
  return true;
}

function showFailure(text, title = t('fail.title')) {
  $('#fail-title').textContent = title;
  $('#fail-text').textContent = text;
  showPanel('failed');
  go('connect');
}

function resetConnection() {
  helloDone = false;
  preHello = [];
  if (conn) {
    const old = conn;
    conn = null;
    old.close();
  }
  engine.detach();
  app.peer = null;
  renderPill();
}

function makeConnection() {
  const c = new Connection({ config: iceConfig(), name: settings.name });
  c.on('state', ({ state, detail }) => onConnState(c, state, detail));
  c.on('text', (text) => onText(text));
  c.on('binary', (data) => onBinary(data));
  c.on('stats', () => renderStatus());
  c.on('unstable', (v) => {
    c.unstable = v;
    renderPill();
  });
  conn = c;
  return c;
}

function saveName() {
  const name = $('#device-name').value.trim().slice(0, 40);
  if (name && name !== settings.name) {
    settings.name = name;
    save();
  }
}

function renderShare(kind, link) {
  const qr = encodeQr(link, { ecl: 'M' });
  const box = $(kind === 'invite' ? '#invite-qr' : '#reply-qr');
  box.innerHTML = qrSvg(qr, { margin: 3 });
  box.dataset.version = qr.version;
  $(kind === 'invite' ? '#invite-link' : '#reply-link').value = link;
}

async function startHost() {
  if (!supported()) return;
  const usePass = $('#use-pass').checked;
  const pass = $('#pass-input').value;
  if (usePass && pass.length < 4) {
    toast(t('connect.pass.short'), 'warning');
    $('#pass-input').focus();
    return;
  }
  saveName();
  resetConnection();
  showPanel('busy', t(usePass ? 'busy.key' : 'busy.host'));
  try {
    layer = usePass ? await PassphraseLayer.create(pass) : null;
    $('#busy-text').textContent = t('busy.host');
    const c = makeConnection();
    const code = await c.host(layer ? { lock: true, salt: toBase64Url(layer.salt), iterations: layer.iterations } : {});
    if (conn !== c) return;
    renderShare('invite', signalLink(location.href, 'i', code));
    $('#invite-lock').hidden = !layer;
    $('#reply-input').value = '';
    showPanel('invite');
  } catch (err) {
    if (err?.message !== 'closed') showFailure(errorText(err));
  }
}

async function askPassphrase() {
  const dialog = $('#pass-dialog');
  $('#pass-prompt').value = '';
  $('#pass-cancel').onclick = () => dialog.close('');
  $('#pass-form').onsubmit = (e) => {
    e.preventDefault();
    if ($('#pass-prompt').value) dialog.close('ok');
  };
  const r = await showDialog(dialog);
  return r === 'ok' ? $('#pass-prompt').value : null;
}

async function startJoin(text) {
  if (!supported()) return;
  const sig = findSignal(text);
  if (!sig) {
    toast(t('connect.join.empty'), 'warning');
    return;
  }
  if (sig.kind === 'r') {
    if (conn?.role === 'host' && conn.state === 'waiting-reply') return submitReply(text);
    showFailure(t('err.kind-i'));
    return;
  }
  let invite;
  try {
    invite = await decodeSignal(sig.code);
  } catch (err) {
    showFailure(errorText(err));
    return;
  }
  if (invite.kind === 'r') {
    if (conn?.role === 'host' && conn.state === 'waiting-reply') return submitReply(text);
    showFailure(t('err.kind-i'));
    return;
  }
  saveName();
  resetConnection();
  go('connect');
  try {
    if (invite.lock) {
      const pass = await askPassphrase();
      if (!pass) return showPanel('start');
      const iterations = invite.iterations ?? 600000;
      if (iterations < 100000 || iterations > 5000000 || !invite.salt) throw new Error(t('err.damaged'));
      showPanel('busy', t('busy.key'));
      layer = await PassphraseLayer.create(pass, fromBase64Url(invite.salt), iterations);
    } else {
      layer = null;
    }
    showPanel('busy', t('busy.join'));
    const c = makeConnection();
    const code = await c.join(invite);
    if (conn !== c) return;
    renderShare('reply', signalLink(location.href, 'r', code));
    $('#reply-title').textContent = t('reply.title', { name: invite.name || '?' });
    showPanel('reply');
  } catch (err) {
    if (err?.message !== 'closed') showFailure(errorText(err));
  }
}

async function submitReply(text) {
  const sig = findSignal(text);
  if (!sig) {
    toast(t('invite.reply.empty'), 'warning');
    return;
  }
  if (sig.kind === 'i') {
    toast(t('err.kind-r'), 'danger');
    return;
  }
  if (!conn || conn.role !== 'host') return;
  try {
    await conn.applyReply(sig.code);
    showPanel('busy', t('busy.connect', { name: conn.peerName || '?' }));
  } catch (err) {
    toast(errorText(err), 'danger', 8000);
  }
}

// ---- connection events and the hello handshake ----

async function onConnState(c, state, detail) {
  if (c !== conn) return;
  if (state === 'connecting' && c.role === 'host') showPanel('busy', t('busy.connect', { name: c.peerName || '?' }));
  if (state === 'open') {
    const hello = { t: 'hello', name: settings.name, device: settings.deviceId, v: PROTOCOL_VERSION };
    if (layer) hello.check = await makeKeyCheck(layer.key);
    try {
      c.dc.send(JSON.stringify(hello));
    } catch {}
  }
  if (state === 'failed') {
    engine.detach();
    showFailure(t(`fail.${detail}`));
  }
  if (state === 'lost') {
    helloDone = false;
    engine.detach();
    syncConnectionLost();
    showPanel('lost');
    go('connect');
    toast(t('toast.lost'), 'warning');
  }
  if (state === 'closed') {
    helloDone = false;
    engine.detach();
  }
  renderPill();
}

function onText(text) {
  if (helloDone) return engine.handleText(text);
  let m = null;
  try {
    m = decodeControl(text);
  } catch {}
  if (m?.t === 'hello') handleHello(m);
  else preHello.push(text);
}

function onBinary(data) {
  if (helloDone) engine.handleBinary(data);
  else preHello.push(data);
}

async function handleHello(m) {
  const c = conn;
  if (layer) {
    if (!m.check || !(await verifyKeyCheck(layer.key, m.check))) {
      resetConnection();
      showFailure(t(m.check ? 'err.passmismatch' : 'err.passmissing'));
      return;
    }
  } else if (m.check) {
    resetConnection();
    showFailure(t('err.passmissing'));
    return;
  }
  if (c !== conn) return;
  app.peer = { name: m.name || c.peerName || '?', device: m.device };
  const same = lastPeerDevice === m.device;
  const hadInterrupted = [...engine.outgoing.values(), ...engine.incoming.values()].some((x) => x.state === 'interrupted');
  if (!same && hadInterrupted) {
    engine.dropInterrupted();
    toast(t('toast.other-device'), 'warning');
  }
  lastPeerDevice = m.device;
  engine.layer = layer;
  for (const tr of engine.outgoing.values()) if (tr.state === 'waiting') tr.peerName = app.peer.name;
  engine.attach(c.link(), { resume: true });
  helloDone = true;
  const queued = preHello;
  preHello = [];
  for (const item of queued) {
    if (typeof item === 'string') engine.handleText(item);
    else engine.handleBinary(item);
  }
  showPanel('status');
  renderStatus();
  toast(t(same && hadInterrupted ? 'toast.resumed' : 'toast.connected', { name: app.peer.name }), 'success', 7000);
}

function onMessage(m) {
  if (m.t === 'bye') {
    resetConnection();
    showPanel('start');
    toast(t('toast.bye'), 'info');
    return;
  }
  if (m.t.startsWith('sync-')) onSyncMessage(m);
}

function renderStatus() {
  if (!app.isConnected()) return;
  $('#peer-title').textContent = t('status.title', { name: app.peer?.name ?? '' });
  $('#peer-fp').textContent = conn.fingerprint ?? '';
  $('#sec-pass-text').textContent = t(layer ? 'status.pass.on' : 'status.pass.off');
  $('#sec-pass').classList.toggle('ff-muted', !layer);
  const r = conn.route;
  $('#peer-route').textContent = r ? `${t(`route.${r.kind}`)}${r.protocol ? ` (${r.protocol.toUpperCase()})` : ''}` : t('route.unknown');
  $('#sec-relay').hidden = r?.kind !== 'relay';
  $('#stat-rtt').textContent = Number.isFinite(r?.rtt) ? `${Math.round(r.rtt * 1000)} ms` : '-';
  $('#stat-sent').textContent = bytes(r?.sent ?? 0);
  $('#stat-recv').textContent = bytes(r?.received ?? 0);
}

// ---- reply links opened in another tab ----

const channel = signalChannel();
if (channel) {
  channel.addEventListener('message', ({ data }) => {
    if (data?.type !== 'reply' || !conn || conn.role !== 'host' || conn.state !== 'waiting-reply') return;
    if (data.sid && data.sid !== conn.sid) return;
    channel.postMessage({ type: 'ack', id: data.id });
    submitReply(`#r=${data.code}`);
  });
}

async function deliverReply(code) {
  let sid = '';
  try {
    sid = (await decodeSignal(code, 'r')).sid;
  } catch (err) {
    showFailure(errorText(err));
    return;
  }
  const id = randomId(6);
  const acked = await new Promise((resolve) => {
    if (!channel) return resolve(false);
    const timer = setTimeout(() => resolve(false), 1500);
    const onAck = ({ data }) => {
      if (data?.type === 'ack' && data.id === id) {
        clearTimeout(timer);
        channel.removeEventListener('message', onAck);
        resolve(true);
      }
    };
    channel.addEventListener('message', onAck);
    channel.postMessage({ type: 'reply', id, sid, code });
  });
  if (acked) showFailure(t('reply.delivered'), t('status.connected'));
  else showFailure(t('reply.orphan'));
  $('#connect-failed .alert').className = `alert ${acked ? 'alert-success' : 'alert-info'}`;
}

// ---- boot ----

function bind() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-go], [data-action]');
    if (!target) return;
    if (target.dataset.go) go(target.dataset.go, target.classList.contains('ff-tab'));
    const action = target.dataset.action;
    if (action === 'cancel-connect' || action === 'restart-connect') {
      resetConnection();
      $('#connect-failed .alert').className = 'alert alert-danger';
      showPanel('start');
    }
    if (action === 'open-ice') openSettings(true);
  });
  $('#device-name').value = settings.name;
  $('#device-name').addEventListener('change', saveName);
  $('#use-pass').addEventListener('change', (e) => {
    $('#pass-field').hidden = !e.target.checked;
    if (e.target.checked) $('#pass-input').focus();
  });
  $('#host-btn').addEventListener('click', startHost);
  $('#join-btn').addEventListener('click', () => startJoin($('#join-input').value));
  $('#reply-btn').addEventListener('click', () => submitReply($('#reply-input').value));
  $('#reply-input').addEventListener('paste', () => setTimeout(() => findSignal($('#reply-input').value)?.kind === 'r' && submitReply($('#reply-input').value), 0));
  $('#join-input').addEventListener('paste', () => setTimeout(() => findSignal($('#join-input').value)?.kind === 'i' && startJoin($('#join-input').value), 0));
  $('#invite-copy').addEventListener('click', (e) => copyText($('#invite-link').value, e.currentTarget));
  $('#reply-copy').addEventListener('click', (e) => copyText($('#reply-link').value, e.currentTarget));
  if (navigator.share) {
    for (const kind of ['invite', 'reply']) {
      const btn = $(`#${kind}-share`);
      btn.hidden = false;
      btn.addEventListener('click', () => navigator.share({ title: 'filefinch', url: $(`#${kind}-link`).value }).catch(() => {}));
    }
  }
  $('#disconnect-btn').addEventListener('click', () => {
    resetConnection();
    showPanel('start');
  });
  $('#lang-btn').addEventListener('click', () => setLanguage(getLang() === 'pt' ? 'en' : 'pt'));
  $('#theme-btn').addEventListener('click', () => {
    const order = ['system', 'light', 'dark'];
    setTheme(order[(order.indexOf(getTheme()) + 1) % 3]);
  });
  canScan().then((ok) => {
    if (!ok) return;
    $('#join-scan').hidden = false;
    $('#reply-scan').hidden = false;
    $('#join-scan').addEventListener('click', async () => {
      const sig = await scanSignal();
      if (sig) startJoin(`#${sig.kind ?? 'i'}=${sig.code}`);
    });
    $('#reply-scan').addEventListener('click', async () => {
      const sig = await scanSignal();
      if (sig) submitReply(`#${sig.kind ?? 'r'}=${sig.code}`);
    });
  });
  window.addEventListener('beforeunload', (e) => {
    const busy = [...engine.outgoing.values(), ...engine.incoming.values()].some((x) => ['active', 'offered', 'interrupted'].includes(x.state));
    if (busy) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  window.addEventListener('hashchange', () => handleHash());
}

function handleHash() {
  const sig = findSignal(location.hash);
  if (!sig) return;
  history.replaceState(null, '', location.pathname + location.search);
  go('connect');
  if (sig.kind === 'i') {
    $('#join-input').value = '';
    startJoin(`#i=${sig.code}`);
  } else if (sig.kind === 'r') {
    if (conn?.role === 'host' && conn.state === 'waiting-reply') submitReply(`#r=${sig.code}`);
    else deliverReply(sig.code);
  }
}

function boot() {
  applyI18n(document);
  bind();
  initTransfers(app);
  initSync(app);
  initPanels(app);
  setLanguage(getLang());
  let view = 'connect';
  try {
    view = sessionStorage.getItem('filefinch:view') || 'connect';
  } catch {}
  go(view);
  showPanel('start');
  handleHash();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  engine.on('error', (err) => console.warn('filefinch:', err.message));
  // A handle for debugging from the console and for the end to end test.
  window.filefinch = { app, engine, settings, version: PROTOCOL_VERSION, connection: () => conn };
}

boot();

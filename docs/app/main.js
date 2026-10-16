// filefinch app entry: navigation, theme and language, pairing with six words (through public
// relays) or with a link (no third party), known devices that meet again with only the
// confirmation words, the hello handshake (device id, passphrase check), the confirmation
// words, files dropped before pairing, and the glue between the connection and the engine.

import { applyI18n, getLang, setLang, t } from './i18n.js';
import { $, $$, bytes, button, copyText, dateTime, el, icon, showDialog, toast } from './ui.js';
import { settings, save, iceConfig } from './settings.js';
import { Connection, signalChannel } from './connection.js';
import { TransferEngine } from './lib/transfer.js';
import { PassphraseLayer, makeKeyCheck, sdpFingerprint, verifyKeyCheck } from './lib/crypto.js';
import { confirmWords, resolvePhrase, wordsFromLink, wordsLink } from './lib/words.js';
import { CODE_LIFETIME_MS, CodeCreator, CodeJoiner } from './pairing.js';
import { forgetDevice, knownRole, newPairSecret, rememberDevice } from './lib/known.js';
import { deriveKnownRendezvous } from './lib/rendezvous.js';
import { clipsConnectionLost, flushClips, initClips, onClipMessage, waitingClips } from './clips-ui.js';
import { wordInputs } from './word-inputs.js';
import { celebrate } from './motion.js';
import { decodeSignal, findSignal, signalLink } from './lib/invite.js';
import { decodeControl } from './lib/protocol.js';
import { encodeQr, qrSvg } from './lib/qr.js';
import { fromBase64Url, randomId, toBase64Url } from './lib/bytes.js';
import { PROTOCOL_VERSION } from './lib/version.js';
import { initTransfers, refreshAll, sendFiles, updateEmpty } from './transfers-ui.js';
import { initSync, onSyncMessage, syncConnectionLost } from './sync-ui.js';
import { initPanels, openSettings, refreshHistory, refreshLibrary } from './panels.js';
import { canScan, scanSignal } from './scan.js';
import { initSeason, renderSeason } from './season.js';
import { attachMenu, initContextMenu } from './contextmenu.js';

const VIEWS = ['connect', 'send', 'received', 'sync', 'library', 'history'];
const engine = new TransferEngine({ onMessage: (m) => onMessage(m) });

let conn = null;
let layer = null;
let helloDone = false;
let preHello = [];
let lastPeerDevice = null;
let connectPanel = 'start';
let codeSide = null; // CodeCreator or CodeJoiner while meeting on the relays
let pairing = null; // { role: 'creator' | 'joiner', nonce, expected, confirmed, attempts }
let helloSeen = null;
let countdown = null;
let joinInputs = null;
let confirmInputs = null;
let retryKnown = null; // the known device to try again from the failure screen
let forgotten = null; // the entry just forgotten on the status screen, so the switch can undo it
let renaming = null; // the known device whose name is being edited

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
  canPairForFiles: () => !app.isConnected() && !conn && !codeSide && ['start', 'link', 'failed'].includes(connectPanel),
  pairingInProgress: () => !app.isConnected() && (!!codeSide || (!!conn && conn.state !== 'lost')),
  pairForFiles,
  pendingChanged: () => renderPending(),
  receivedChanged: () => updateEmpty(),
};

// ---- navigation ----

function go(view, focus = false) {
  if (!VIEWS.includes(view)) view = 'connect';
  for (const v of VIEWS) $(`#view-${v}`).hidden = v !== view;
  for (const b of $$('.ff-tab')) {
    if (b.dataset.go === view) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
  $('#more-btn').classList.toggle('is-active', ['sync', 'library', 'history'].includes(view));
  setMore(false);
  try {
    sessionStorage.setItem('filefinch:view', view);
  } catch {}
  if (focus) $(`#h-${view}`)?.focus({ preventScroll: false });
}

/** On small screens Sync, Library and History sit behind More in the bottom bar. */
function setMore(on) {
  $('#ff-tabs').classList.toggle('is-more', on);
  $('#more-btn').setAttribute('aria-expanded', String(on));
}

function bindMore() {
  const more = $('#more-btn');
  more.addEventListener('click', () => setMore(more.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('#ff-tabs-more, #more-btn')) setMore(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && more.getAttribute('aria-expanded') === 'true') {
      setMore(false);
      more.focus();
    }
  });
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
  renderSeason();
  refreshAll();
  refreshHistory();
  refreshLibrary();
  if (conn?.peerName && connectPanel === 'reply') $('#reply-title').textContent = t('reply.title', { name: conn.peerName });
}

// ---- connect panels ----

const PANELS = {
  start: '#connect-start',
  link: '#connect-link',
  code: '#connect-code',
  known: '#connect-known',
  'confirm-show': '#connect-confirm-show',
  'confirm-type': '#connect-confirm-type',
  invite: '#connect-invite',
  reply: '#connect-reply',
  busy: '#connect-busy',
  failed: '#connect-failed',
  status: '#connect-status',
  lost: '#connect-lost',
};

function showPanel(name, text) {
  connectPanel = name;
  for (const [k, sel] of Object.entries(PANELS)) $(sel).hidden = k !== name;
  if (name === 'busy') $('#busy-text').textContent = text ?? '';
  const choosing = name === 'start' || name === 'link';
  $('#connect-foot').hidden = !choosing;
  $('#mode-link').hidden = name !== 'start';
  $('#mode-words').hidden = name !== 'link';
  $('#known-box').hidden = name !== 'start' || !settings.known.length;
  renderPending();
  renderPill();
}

// ---- files dropped or picked before pairing ----

/** Starts pairing for files queued while no device is connected: the code shows right away. */
function pairForFiles() {
  go('connect');
  if (connectPanel === 'link') startHost();
  else startCode();
}

/** "3 files (12 MB) ready" on the pairing screens, so it is clear they will go by themselves. */
function renderPending() {
  const waiting = [...engine.outgoing.values()].filter((x) => x.state === 'waiting');
  const files = waiting.reduce((n, x) => n + x.files.length, 0);
  const size = waiting.reduce((n, x) => n + x.files.reduce((a, f) => a + f.size, 0), 0);
  const texts = waitingClips();
  const parts = [];
  if (files) parts.push(t(files === 1 ? 'pending.file' : 'pending.files', { count: files, size: bytes(size) }));
  if (texts) parts.push(t(texts === 1 ? 'pending.text' : 'pending.texts', { count: texts }));
  const text = parts.length ? t('pending.ready', { what: parts.join(t('pending.and')) }) : '';
  for (const node of $$('.ff-pending')) {
    node.hidden = !text;
    node.querySelector('.ff-pending-text').textContent = text;
  }
}

// ---- known devices ----

function saveKnown(list) {
  settings.known = list;
  save();
  renderKnown();
}

/** The name shown for a known device: the one given here with Rename, or the one it sent. */
const knownName = (e) => settings.aliases[e.device] || e.name;

function renderKnown() {
  const list = $('#known-list');
  list.replaceChildren(
    ...settings.known.map((e) => {
      const name = knownName(e);
      if (renaming === e.device) return renameRow(e);
      const item = el(
        'li.ff-known-item',
        { dataset: { device: e.device } },
        el(
          'button.ff-known-btn',
          { type: 'button', dataset: { device: e.device }, onclick: () => startKnown(e.device) },
          el('span.ff-known-icon', {}, icon('devices')),
          el('span.ff-known-name', {}, el('span.font-medium', { text: name }), el('span.text-sm.text-muted-foreground', { text: e.seen ? t('known.seen', { when: dateTime(e.seen) }) : '' })),
          el('span.ff-known-go', {}, el('span', { text: t('known.connect') }), icon('plug')),
        ),
        button('', 'x', () => forgetKnown(e.device), 'btn-ghost btn-sm btn-square ff-known-forget', { 'aria-label': t('known.forget', { name }), title: t('known.forget', { name }) }),
      );
      attachMenu(item, () => [
        { label: t('known.connect'), icon: 'plug', run: () => startKnown(e.device) },
        { label: t('known.rename'), icon: 'text', run: () => startRename(e.device) },
        '-',
        { label: t('known.forget', { name }), icon: 'trash', danger: true, run: () => forgetKnown(e.device) },
      ]);
      return item;
    }),
  );
  if (connectPanel === 'start') $('#known-box').hidden = !settings.known.length;
}

function startRename(device) {
  renaming = device;
  renderKnown();
  const input = $('#known-rename');
  input?.focus();
  input?.select();
}

/** The inline editor that replaces a known device's row while it is renamed. */
function renameRow(e) {
  const input = el('input.input.input-sm.ff-known-input', { id: 'known-rename', value: knownName(e), maxlength: 40, autocomplete: 'off', 'aria-label': t('known.rename.label', { name: e.name }) });
  const done = (keep) => {
    if (renaming !== e.device) return;
    renaming = null;
    if (keep) {
      const value = input.value.trim().slice(0, 40);
      if (value && value !== e.name) settings.aliases[e.device] = value;
      else delete settings.aliases[e.device];
      save();
    }
    renderKnown();
    $(`#known-list .ff-known-item[data-device="${e.device}"] .ff-known-btn`)?.focus();
  };
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      done(true);
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      ev.stopPropagation();
      done(false);
    }
  });
  return el(
    'li.ff-known-item.ff-known-editing',
    { dataset: { device: e.device } },
    el('span.ff-known-icon', {}, icon('devices')),
    input,
    button(t('save'), 'check', () => done(true), 'btn-primary btn-sm', { id: 'known-rename-save' }),
    button('', 'x', () => done(false), 'btn-ghost btn-sm btn-square', { 'aria-label': t('cancel'), title: t('cancel') }),
  );
}

function forgetKnown(device) {
  const entry = settings.known.find((e) => e.device === device);
  if (!entry) return;
  const name = knownName(entry);
  delete settings.aliases[device];
  saveKnown(forgetDevice(settings.known, device));
  toast(t('known.forgotten', { name }), 'info');
}

/** Both devices tap each other: the one with the smaller id shows the offer, the other knocks. */
function startKnown(device) {
  const entry = settings.known.find((e) => e.device === device);
  if (!entry) return;
  let role;
  try {
    role = knownRole(settings.deviceId, entry.device);
  } catch (err) {
    return showFailure(err.message);
  }
  if (role === 'creator') startCode(entry);
  else startWordsJoin(null, entry);
}

function showKnownWait(entry) {
  $('#known-wait-title').textContent = t('known.wait.title', { name: knownName(entry) });
  $('#known-wait-text').textContent = t('known.wait.text', { name: knownName(entry), me: settings.name });
  $('#known-relays').textContent = '';
  showPanel('known');
}

/** After the words matched: keep the new pair secret, or refresh the name of a known device. */
function rememberPeer() {
  forgotten = null;
  const device = app.peer?.device;
  if (!pairing?.confirmed || !device) return;
  const known = settings.known.some((e) => e.device === device);
  if (pairing.key) saveKnown(rememberDevice(settings.known, { device, name: app.peer.name, key: pairing.key }));
  else if (known) saveKnown(rememberDevice(settings.known, { device, name: app.peer.name }));
}

function renderRemember() {
  const box = $('#remember-box');
  const device = app.peer?.device;
  const known = !!device && settings.known.some((e) => e.device === device);
  box.hidden = !app.isConnected() || !pairing?.confirmed || (!known && forgotten?.device !== device);
  if (box.hidden) return;
  $('#remember').checked = known;
  $('#remember-text').textContent = t('known.remember', { name: app.peer.name });
}

function toggleRemember(on) {
  const device = app.peer?.device;
  if (!device) return;
  if (on && forgotten?.device === device) {
    saveKnown(rememberDevice(settings.known, { ...forgotten, name: app.peer.name, seen: Date.now() }));
    forgotten = null;
  } else if (!on) {
    forgotten = settings.known.find((e) => e.device === device) ?? forgotten;
    saveKnown(forgetDevice(settings.known, device));
  }
  renderRemember();
}

function renderPill() {
  const dot = $('#conn-dot');
  const text = $('#conn-text');
  let cls = 'status-offline';
  let label = t('pill.offline');
  if (app.isConnected()) {
    cls = conn.unstable ? 'status-away' : 'status-online';
    label = conn.unstable ? t('pill.unstable') : t('pill.connected', { name: app.peer?.name ?? '' });
  } else if (conn?.state === 'open' && pairing && !pairing.confirmed) {
    cls = 'status-away';
    label = t('pill.confirm');
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

function showFailure(text, title = t('fail.title'), known = null) {
  $('#fail-title').textContent = title;
  $('#fail-text').textContent = text;
  retryKnown = known?.device ?? null;
  $('#fail-known').hidden = !retryKnown;
  if (known) $('#fail-known-text').textContent = t('known.retry', { name: knownName(known) });
  showPanel('failed');
  go('connect');
}

/** Nobody answered on a known device's topic: say what to do on the other device. */
function showKnownFailure(known) {
  const name = knownName(known);
  showFailure(t('known.nopeer', { name, me: settings.name }), t('known.nopeer.title', { name }), known);
}

function stopRelays() {
  codeSide?.stop();
  codeSide = null;
  clearInterval(countdown);
  countdown = null;
}

function resetConnection() {
  stopRelays();
  pairing = null;
  helloSeen = null;
  helloDone = false;
  preHello = [];
  if (conn) {
    const old = conn;
    conn = null;
    old.close();
  }
  engine.detach();
  clipsConnectionLost();
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

// ---- pairing with six words ----

async function passphraseLayerFromForm() {
  const usePass = $('#use-pass').checked;
  const pass = $('#pass-input').value;
  if (usePass && pass.length < 4) {
    toast(t('connect.pass.short'), 'warning');
    $('#pass-input').focus();
    return false;
  }
  if (!usePass) return null;
  showPanel('busy', t('busy.key'));
  return PassphraseLayer.create(pass);
}

function renderWords(list, words) {
  list.replaceChildren(...words.map((w, i) => el('li.ff-word', {}, el('span.ff-word-i', { text: String(i + 1) }), el('span.ff-word-w', { text: w }))));
}

function renderRelays(status) {
  const text = t('pair.code.relays', { n: status.connected.length, total: status.total });
  $('#code-relays').textContent = text;
  $('#known-relays').textContent = text;
}

/**
 * Shows a QR code and six words, and waits on the public relays for the other device.
 * With a known device entry there are no words: it waits on the topic of that pair's secret.
 */
async function startCode(known = null) {
  if (!supported()) return;
  saveName();
  resetConnection();
  go('connect');
  let pass;
  try {
    pass = await passphraseLayerFromForm();
  } catch (err) {
    return showFailure(errorText(err));
  }
  if (pass === false) return;
  layer = pass;
  showPanel('busy', t(known ? 'known.busy' : 'pair.busy.code', { name: known ? knownName(known) : '' }));
  let rv = null;
  try {
    rv = known ? await deriveKnownRendezvous(known.key) : null;
  } catch (err) {
    return showFailure(errorText(err));
  }
  const c = makeConnection();
  const nonce = randomId(12);
  const offerReady = c.prepareOffer().then((sdp) => ({
    sdp,
    name: settings.name,
    sid: c.sid,
    nonce,
    ...(layer ? { lock: 1, salt: toBase64Url(layer.salt), iterations: layer.iterations } : {}),
  }));
  offerReady.catch(() => {});
  const creator = new CodeCreator(offerReady, { rv });
  codeSide = creator;
  pairing = { role: 'creator', nonce, known: known?.device ?? null };
  creator.on('status', renderRelays);
  creator.on('expired', () => {
    if (codeSide !== creator) return;
    resetConnection();
    if (known) showKnownFailure(known);
    else showFailure(t('pair.expired'), t('pair.expired.title'));
  });
  creator.on('answer', async (msg) => {
    if (codeSide !== creator || typeof msg.sdp !== 'string') return;
    try {
      await c.applyAnswer({ sdp: msg.sdp, name: String(msg.name ?? '').slice(0, 40), sid: msg.sid });
      showPanel('busy', t('busy.connect', { name: c.peerName || '?' }));
    } catch (err) {
      showFailure(errorText(err));
    }
  });
  try {
    const words = await creator.start();
    if (codeSide !== creator) return;
    if (known) {
      showKnownWait(known);
      renderRelays(creator.hub.status());
      return;
    }
    const link = wordsLink(location.href, words);
    const qr = encodeQr(link, { ecl: 'M' });
    const box = $('#code-qr');
    box.innerHTML = qrSvg(qr, { margin: 3 });
    box.dataset.version = qr.version;
    box.dataset.link = link;
    renderWords($('#code-words'), words);
    $('#code-words').dataset.words = words.join(' ');
    renderRelays(creator.hub.status());
    const tick = () => {
      const left = Math.max(0, creator.expires - Date.now());
      const m = Math.floor(left / 60000);
      const sec = Math.floor((left % 60000) / 1000);
      const el2 = $('#code-countdown');
      el2.textContent = `${m}:${String(sec).padStart(2, '0')}`;
      el2.classList.toggle('is-low', left < 60000);
      el2.style.setProperty('--left', String(left / CODE_LIFETIME_MS));
    };
    tick();
    countdown = setInterval(tick, 1000);
    showPanel('code');
  } catch (err) {
    if (codeSide !== creator) return;
    resetConnection();
    showFailure(t('pair.norelay', { error: err.message }), t('pair.norelay.title'));
  }
}

/**
 * Joins with six words typed in, pasted, or carried by a scanned pairing link. With a known
 * device entry instead, it knocks on that pair's topic for as long as a code would last.
 */
async function startWordsJoin(input, known = null) {
  if (!supported()) return;
  let words = null;
  if (!known) {
    const res = resolvePhrase(input);
    if (!res.ok) {
      toast(t('pair.words.incomplete'), 'warning');
      return;
    }
    words = res.words;
    // Pressing Connect right after the last word already started the same join.
    if (codeSide instanceof CodeJoiner && codeSide.phrase === words.join(' ')) return;
  }
  saveName();
  resetConnection();
  go('connect');
  if (known) showKnownWait(known);
  else showPanel('busy', t('pair.busy.find'));
  const joiner = new CodeJoiner();
  joiner.phrase = words?.join(' ') ?? null;
  codeSide = joiner;
  joiner.on('status', (st) => {
    if (known) renderRelays(st);
    else if (connectPanel === 'busy' && st.connected.length) $('#busy-text').textContent = t('pair.busy.knock', { n: st.connected.length });
  });
  joiner.on('timeout', () => {
    if (codeSide !== joiner) return;
    resetConnection();
    if (known) showKnownFailure(known);
    else showFailure(t('pair.nopeer'), t('pair.nopeer.title'));
  });
  joiner.on('offer', async (msg) => {
    if (codeSide !== joiner) return;
    if (typeof msg.sdp !== 'string' || typeof msg.nonce !== 'string' || typeof msg.sid !== 'string') return;
    try {
      if (msg.lock) {
        const pass = await askPassphrase();
        if (!pass) {
          resetConnection();
          return showPanel('start');
        }
        const iterations = Number(msg.iterations) || 600000;
        if (iterations < 100000 || iterations > 5000000 || typeof msg.salt !== 'string') throw new Error(t('err.damaged'));
        showPanel('busy', t('busy.key'));
        layer = await PassphraseLayer.create(pass, fromBase64Url(msg.salt), iterations);
      } else {
        layer = null;
      }
      showPanel('busy', t('busy.join'));
      const c = makeConnection();
      pairing = { role: 'joiner', nonce: msg.nonce.slice(0, 64), known: known?.device ?? null };
      const name = String(msg.name ?? '').slice(0, 40);
      const sdp = await c.answerOffer({ sdp: msg.sdp, sid: msg.sid.slice(0, 32), name });
      if (codeSide !== joiner) return;
      joiner.sendAnswer({ sdp, name: settings.name, sid: msg.sid });
      showPanel('busy', t('busy.connect', { name: name || '?' }));
    } catch (err) {
      if (err?.message !== 'closed') showFailure(errorText(err));
    }
  });
  try {
    if (known) await joiner.start({ rv: await deriveKnownRendezvous(known.key) }, { timeout: CODE_LIFETIME_MS });
    else await joiner.start(words);
  } catch (err) {
    if (codeSide !== joiner) return;
    resetConnection();
    showFailure(t('pair.norelay', { error: err.message }), t('pair.norelay.title'));
  }
}

/** After the channel opens: the joiner shows confirmation words, the creator types them. */
function beginConfirm() {
  const local = sdpFingerprint(conn.pc?.localDescription?.sdp);
  const remote = sdpFingerprint(conn.pc?.remoteDescription?.sdp);
  pairing.expected = confirmWords(local, remote, pairing.nonce);
  pairing.attempts = 0;
  for (const id of ['#confirm-fp-show', '#confirm-fp-type']) $(id).textContent = conn.fingerprint ?? '';
  if (pairing.role === 'joiner') {
    renderWords($('#confirm-words'), pairing.expected);
    $('#confirm-words').dataset.words = pairing.expected.join(' ');
    showPanel('confirm-show');
  } else {
    confirmInputs.reset();
    $('#confirm-error').hidden = true;
    $('#confirm-type-title').textContent = t('confirm.type.title.named', { name: app.peer?.name || '?' });
    showPanel('confirm-type');
    setTimeout(() => confirmInputs.focus(), 50);
  }
  go('connect');
}

function confirmTyped() {
  if (!pairing || pairing.role !== 'creator' || pairing.confirmed || !conn?.dc) return;
  const res = confirmInputs.values();
  const box = $('#confirm-error');
  if (!res.ok) {
    box.hidden = false;
    $('#confirm-error-text').textContent = t('confirm.incomplete');
    return;
  }
  if (res.words.join(' ') === pairing.expected.join(' ')) {
    pairing.confirmed = true;
    // A first pairing gives the two devices a fresh secret to meet again with; a known device
    // keeps the one it has.
    pairing.key = pairing.known ? null : newPairSecret();
    try {
      conn.dc.send(JSON.stringify({ t: 'pair', ok: true, ...(pairing.key ? { key: pairing.key } : {}) }));
    } catch {}
    finishAttach();
    return;
  }
  pairing.attempts++;
  confirmInputs.setError();
  if (pairing.attempts >= 3) {
    try {
      conn.dc.send(JSON.stringify({ t: 'pair', ok: false }));
    } catch {}
    resetConnection();
    showFailure(t('confirm.rejected'), t('confirm.rejected.title'));
    return;
  }
  box.hidden = false;
  $('#confirm-error-text').textContent = t('confirm.wrong', { left: 3 - pairing.attempts });
}

function handlePair(m) {
  if (!pairing || pairing.role !== 'joiner' || pairing.confirmed) return;
  if (m.ok) {
    pairing.confirmed = true;
    pairing.key = pairing.known ? null : (m.key ?? null);
    finishAttach();
  } else {
    resetConnection();
    showFailure(t('confirm.rejected.peer'), t('confirm.rejected.title'));
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
    const result = await conn.applyReply(sig.code);
    if (result === 'duplicate') {
      toast(t('reply.duplicate'), 'info');
      return;
    }
    if (result === 'applied') showPanel('busy', t('busy.connect', { name: conn.peerName || '?' }));
  } catch (err) {
    toast(errorText(err), 'danger', 8000);
  }
}

// ---- connection events and the hello handshake ----

async function onConnState(c, state, detail) {
  if (c !== conn) return;
  if (state === 'connecting' && c.role === 'host') showPanel('busy', t('busy.connect', { name: c.peerName || '?' }));
  if (state === 'open') {
    stopRelays();
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
    clipsConnectionLost();
    showPanel('lost');
    go('connect');
    toast(t('toast.lost'), 'warning');
  }
  if (state === 'closed') {
    helloDone = false;
    engine.detach();
    clipsConnectionLost();
  }
  renderPill();
}

function onText(text) {
  if (helloDone) return engine.handleText(text);
  let m = null;
  try {
    m = decodeControl(text);
  } catch {}
  if (m?.t === 'hello' && !helloSeen) handleHello(m);
  else if (m?.t === 'pair') handlePair(m);
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
  if (pairing?.known && m.device !== pairing.known) {
    resetConnection();
    showFailure(t('known.wrong'));
    return;
  }
  helloSeen = m;
  app.peer = { name: m.name || c.peerName || '?', device: m.device };
  // Words pairing: nothing moves until the confirmation words match.
  if (pairing && !pairing.confirmed) {
    beginConfirm();
    renderPill();
    return;
  }
  finishAttach();
}

function finishAttach() {
  const c = conn;
  const m = helloSeen;
  if (!c || !m || helloDone) return;
  const same = lastPeerDevice === m.device;
  const hadInterrupted = [...engine.outgoing.values(), ...engine.incoming.values()].some((x) => x.state === 'interrupted');
  if (!same && hadInterrupted) {
    engine.dropInterrupted();
    toast(t('toast.other-device'), 'warning');
  }
  lastPeerDevice = m.device;
  engine.layer = layer;
  // Files picked or dropped before this connection: show them going out on the Send tab.
  const filesFirst = [...engine.outgoing.values()].some((x) => x.state === 'waiting');
  for (const tr of engine.outgoing.values()) if (tr.state === 'waiting') tr.peerName = app.peer.name;
  engine.attach(c.link(), { resume: true });
  helloDone = true;
  const queued = preHello;
  preHello = [];
  for (const item of queued) {
    if (typeof item === 'string') engine.handleText(item);
    else engine.handleBinary(item);
  }
  rememberPeer();
  showPanel('status');
  renderStatus();
  go(filesFirst ? 'send' : 'connect');
  celebrate.connected($('#connect-status .ff-link-anim'));
  toast(t(same && hadInterrupted ? 'toast.resumed' : pairing?.confirmed ? 'toast.paired' : 'toast.connected', { name: app.peer.name }), 'success', 7000);
  flushClips();
}

function onMessage(m) {
  if (m.t === 'bye') {
    resetConnection();
    showPanel('start');
    toast(t('toast.bye'), 'info');
    return;
  }
  if (m.t.startsWith('sync-')) onSyncMessage(m);
  if (m.t === 'clip' || m.t === 'clip-ok') onClipMessage(m);
}

function renderStatus() {
  if (!app.isConnected()) return;
  $('#peer-title').textContent = t('status.title', { name: app.peer?.name ?? '' });
  $('#peer-fp').textContent = conn.fingerprint ?? '';
  const paired = !!pairing?.confirmed;
  $('#paired-note').hidden = !paired;
  if (paired !== $('#fp-box').dataset.paired) {
    $('#fp-box').open = !paired;
    $('#fp-box').dataset.paired = paired;
  }
  renderRemember();
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
    if (data?.type !== 'reply' || !conn || conn.role !== 'host') return;
    // A reply for this invite is taken even when it already arrived another way: applying it
    // again is a harmless duplicate, and the other tab learns it was delivered.
    if (!['waiting-reply', 'connecting', 'open'].includes(conn.state)) return;
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
    if (action === 'new-code') startCode();
    if (action === 'retry-known' && retryKnown) startKnown(retryKnown);
  });
  $('#device-name').value = settings.name;
  $('#device-name').addEventListener('change', saveName);
  $('#use-pass').addEventListener('change', (e) => {
    $('#pass-field').hidden = !e.target.checked;
    if (e.target.checked) $('#pass-input').focus();
  });
  $('#host-btn').addEventListener('click', startHost);
  $('#code-btn').addEventListener('click', () => startCode());
  $('#code-new').addEventListener('click', () => startCode());
  $('#remember').addEventListener('change', (e) => toggleRemember(e.target.checked));
  $('#code-copy').addEventListener('click', (e) => copyText($('#code-words').dataset.words ?? '', e.currentTarget));
  joinInputs = wordInputs($('#join-words'), { idPrefix: 'join-word', auto: true, onReady: (words) => startWordsJoin(words) });
  confirmInputs = wordInputs($('#confirm-inputs'), { idPrefix: 'confirm-word', onReady: () => confirmTyped() });
  $('#words-join-btn').addEventListener('click', () => startWordsJoin(joinInputs.inputs.map((x) => x.value)));
  $('#confirm-btn').addEventListener('click', confirmTyped);
  // The advanced no relay mode: an invite QR code each way, or codes pasted by hand.
  $('#mode-link').addEventListener('click', () => showPanel('link'));
  $('#mode-words').addEventListener('click', () => showPanel('start'));
  $('#join-btn').addEventListener('click', () => startJoin($('#join-input').value));
  $('#reply-btn').addEventListener('click', () => submitReply($('#reply-input').value));
  $('#reply-input').addEventListener('paste', () => setTimeout(() => findSignal($('#reply-input').value)?.kind === 'r' && submitReply($('#reply-input').value), 0));
  $('#join-input').addEventListener('paste', () => setTimeout(() => findSignal($('#join-input').value)?.kind === 'i' && startJoin($('#join-input').value), 0));
  $('#invite-copy').addEventListener('click', (e) => copyText($('#invite-link').value, e.currentTarget));
  $('#reply-copy').addEventListener('click', (e) => copyText($('#reply-link').value, e.currentTarget));
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
    $('#words-scan').hidden = false;
    $('#words-scan').addEventListener('click', async () => {
      const sig = await scanSignal();
      if (sig?.kind === 'w') startWordsJoin(sig.words);
      else if (sig) startJoin(`#${sig.kind ?? 'i'}=${sig.code}`);
    });
    $('#join-scan').addEventListener('click', async () => {
      const sig = await scanSignal();
      if (sig?.kind === 'w') startWordsJoin(sig.words);
      else if (sig) startJoin(`#${sig.kind ?? 'i'}=${sig.code}`);
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
  const words = wordsFromLink(location.hash);
  if (words) {
    // A scanned pairing code: join with its words, nothing to type.
    history.replaceState(null, '', location.pathname + location.search);
    go('connect');
    startWordsJoin(words);
    return;
  }
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
  bindMore();
  initContextMenu();
  initTransfers(app);
  initSync(app);
  initPanels(app);
  initClips(app);
  initSeason();
  renderKnown();
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
  engine.on('update', () => renderPending());
  // A handle for debugging from the console and for the end to end test.
  window.filefinch = { app, engine, settings, version: PROTOCOL_VERSION, connection: () => conn, pairing: () => pairing };
}

boot();

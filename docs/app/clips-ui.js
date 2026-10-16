// Text and links between devices, like a shared clipboard: a box on the Send tab, and the texts
// that arrived on the Received tab with Copy and Open buttons. Texts typed before a device
// connects wait and go out as soon as one does. Kept in this tab only, never stored.

import { $, button, copyText, el, icon, toast } from './ui.js';
import { t, locale } from './i18n.js';
import { clipLink, clipPreview, makeClip, readClip } from './lib/clip.js';
import { celebrate } from './motion.js';
import { attachMenu } from './contextmenu.js';

const MAX_KEPT = 50;
const outgoing = []; // { id, text, state: 'waiting' | 'sent' | 'delivered', card }
const incoming = []; // { id, text, from, at, card }
const seen = new Set();
let app;

const time = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });

export function initClips(context) {
  app = context;
  const input = $('#clip-input');
  $('#clip-send').addEventListener('click', () => sendClip(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendClip(input.value);
    }
  });
  input.addEventListener('input', () => renderCounter());
  if (navigator.clipboard?.readText) {
    const paste = $('#clip-paste');
    paste.hidden = false;
    paste.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (!text.trim()) return toast(t('clip.paste.empty'), 'info');
        input.value = text;
        renderCounter();
        input.focus();
      } catch {
        toast(t('clip.paste.denied'), 'info');
        input.focus();
      }
    });
  }
  // Ctrl+V on the Send tab outside a text box: pasted files are sent, pasted text lands in the box.
  document.addEventListener('paste', (e) => {
    if ($('#view-send').hidden || e.target.closest?.('input, textarea, [contenteditable]')) return;
    const files = [...(e.clipboardData?.files ?? [])];
    if (files.length) {
      e.preventDefault();
      app.sendFiles(files.map((f) => ({ blob: f, path: f.name || 'pasted', mtime: f.lastModified })));
      return;
    }
    const text = e.clipboardData?.getData('text') ?? '';
    if (text.trim()) {
      e.preventDefault();
      input.value = text;
      renderCounter();
      input.focus();
    }
  });
  renderCounter();
}

function renderCounter() {
  const n = $('#clip-input').value.length;
  $('#clip-send').disabled = !$('#clip-input').value.trim();
  $('#clip-count').textContent = n > 2000 ? t('clip.count', { n: n.toLocaleString(locale()) }) : '';
}

/** Texts waiting for a connection, for the "ready to send" note while pairing. */
export const waitingClips = () => outgoing.filter((c) => c.state === 'waiting').length;

export async function sendClip(text) {
  if (!String(text ?? '').trim()) {
    toast(t('clip.empty'), 'warning');
    $('#clip-input').focus();
    return null;
  }
  let message;
  try {
    message = await makeClip(text, null); // validates; sealed again at send time if needed
  } catch (err) {
    toast(err instanceof RangeError ? t('clip.toolong') : t('clip.empty'), 'warning');
    return null;
  }
  const clip = { id: message.id, text: message.text, state: 'waiting', card: null };
  outgoing.unshift(clip);
  if (outgoing.length > MAX_KEPT) outgoing.pop()?.card?.remove();
  $('#clip-input').value = '';
  renderCounter();
  renderOut(clip);
  if (app.isConnected()) await deliver(clip);
  else toast(t('clip.queued'), 'info');
  app.pendingChanged?.();
  return clip;
}

async function deliver(clip) {
  try {
    const message = await makeClip(clip.text, app.engine.layer, clip.id);
    if (!app.send(message)) return;
    clip.state = 'sent';
    renderOut(clip);
    celebrate.sent(clip.card);
  } catch (err) {
    toast(t('toast.error', { error: err.message }), 'danger');
  }
}

/** A device connected: texts that were waiting, or sent but never confirmed, go out now. */
export async function flushClips() {
  for (const clip of [...outgoing].reverse()) if (clip.state !== 'delivered') await deliver(clip);
  app.pendingChanged?.();
}

/** The connection dropped: texts not confirmed yet are sent again on the next connection. */
export function clipsConnectionLost() {
  for (const clip of outgoing) {
    if (clip.state === 'sent') {
      clip.state = 'waiting';
      renderOut(clip);
    }
  }
}

export async function onClipMessage(m) {
  if (m.t === 'clip-ok') {
    const clip = outgoing.find((c) => c.id === m.id);
    if (clip && clip.state !== 'delivered') {
      clip.state = 'delivered';
      renderOut(clip);
    }
    return;
  }
  if (m.t !== 'clip') return;
  // A text sent again after a dropped connection is confirmed but shown only once.
  if (seen.has(m.id)) return app.send({ t: 'clip-ok', id: m.id });
  let text;
  try {
    text = await readClip(m, app.engine.layer);
  } catch (err) {
    toast(t('clip.unreadable', { error: err.message }), 'danger', 8000);
    return;
  }
  seen.add(m.id);
  app.send({ t: 'clip-ok', id: m.id });
  const clip = { id: m.id, text, from: app.peer?.name ?? '?', at: Date.now(), card: null };
  incoming.unshift(clip);
  if (incoming.length > MAX_KEPT) incoming.pop()?.card?.remove();
  renderIn(clip);
  app.receivedChanged?.();
  toast(t(clipLink(text) ? 'clip.got.link' : 'clip.got', { name: clip.from, preview: clipPreview(text, 60) }), 'success');
  celebrate.received(clip.card);
}

function textBlock(text) {
  const link = clipLink(text);
  if (link) return el('a.link.ff-clip-text.ff-clip-link', { href: link, target: '_blank', rel: 'noopener noreferrer', text });
  return el('p.ff-clip-text', { text });
}

function renderIn(clip) {
  const link = clipLink(clip.text);
  const actions = el(
    'div.ff-clip-actions',
    {},
    button(t('copy'), 'copy', (e) => copyText(clip.text, e.currentTarget), 'btn-soft btn-sm'),
    link ? el('a.btn.btn-ghost.btn-sm', { href: link, target: '_blank', rel: 'noopener noreferrer' }, icon('link'), el('span', { text: t('clip.open') })) : null,
    button('', 'x', () => removeIn(clip), 'btn-ghost btn-sm btn-square', { 'aria-label': t('remove'), title: t('remove') }),
  );
  clip.card = el(
    'article.card.ff-card.ff-clip.ff-clip-in',
    { dataset: { id: clip.id } },
    el('div.card-body', {}, el('div.ff-clip-head', {}, el('span.ff-tr-icon', {}, icon(link ? 'link' : 'text')), el('p.ff-clip-meta.text-sm.text-muted-foreground', { text: t('clip.from', { name: clip.from, time: time(clip.at) }) })), textBlock(clip.text), actions),
  );
  $('#clips-in').prepend(clip.card);
  attachMenu(clip.card, () => [
    { label: t('copy'), icon: 'copy', run: () => copied(clip.text) },
    link && { label: t('clip.open'), icon: 'link', run: () => window.open(link, '_blank', 'noopener,noreferrer') },
    '-',
    { label: t('remove'), icon: 'trash', danger: true, run: () => removeIn(clip) },
  ]);
}

function removeIn(clip) {
  const i = incoming.indexOf(clip);
  if (i >= 0) incoming.splice(i, 1);
  clip.card.remove();
  app.receivedChanged?.();
}

async function copied(text) {
  await copyText(text);
  toast(t('menu.copied'), 'success', 1800);
}

function renderOut(clip) {
  const state = { waiting: t('clip.state.waiting'), sent: t('clip.state.sent'), delivered: t('clip.state.delivered') }[clip.state];
  const badge = el(`span.badge.${clip.state === 'delivered' ? 'badge-success' : clip.state === 'sent' ? 'badge-info' : 'badge-warning'}`, {}, clip.state === 'delivered' ? icon('check') : null, el('span', { text: state }));
  const body = el('div.ff-clip-row', {}, el('span.ff-tr-icon', {}, icon(clipLink(clip.text) ? 'link' : 'text')), el('p.ff-clip-preview', { text: clipPreview(clip.text, 120), title: clip.text.slice(0, 500) }), badge);
  if (clip.card) clip.card.replaceChildren(body);
  else {
    clip.card = el('li.ff-clip.ff-clip-out', { dataset: { id: clip.id, state: clip.state } }, body);
    $('#clips-out').prepend(clip.card);
    const link = clipLink(clip.text);
    attachMenu(clip.card, () => [{ label: t('copy'), icon: 'copy', run: () => copied(clip.text) }, link && { label: t('clip.open'), icon: 'link', run: () => window.open(link, '_blank', 'noopener,noreferrer') }]);
  }
  clip.card.dataset.state = clip.state;
  $('#clips-out').hidden = !outgoing.length;
}

/** Text from the other device, for the empty state check. */
export const receivedClips = () => incoming.length;

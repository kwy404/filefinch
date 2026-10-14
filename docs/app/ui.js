// Small DOM helpers shared by the app modules. Text from the other device is always set with
// textContent, never as HTML.

import { formatBytes, formatDuration, formatSpeed } from './lib/format.js';
import { locale, t } from './i18n.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** el('button.btn.btn-sm', { type: 'button', onclick }, 'text', child) */
export function el(spec, props = {}, ...children) {
  const [tag, ...classes] = spec.split('.');
  const node = document.createElement(tag || 'div');
  if (classes.length) node.className = classes.join(' ');
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'text') node.textContent = v;
    else if (k in node && typeof v !== 'string') node[k] = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) node.append(c instanceof Node ? c : String(c));
  return node;
}

export function icon(name, cls = '') {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', `ic ${cls}`.trim());
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

export function button(label, iconName, onclick, cls = 'btn-ghost btn-sm', extra = {}) {
  return el(`button.btn.${cls.split(' ').join('.')}`, { type: 'button', onclick, ...extra }, iconName ? icon(iconName) : null, label ? el('span', { text: label }) : null);
}

export const bytes = (n) => formatBytes(n, locale());
export const speed = (n) => formatSpeed(n, locale());
export const duration = (s) => formatDuration(s);
export const dateTime = (ms) => new Date(ms).toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' });

export function toast(message, kind = 'info', ms = 5000) {
  const box = $('#toasts');
  const item = el(`div.alert.alert-${kind}.ff-toast`, { role: kind === 'danger' ? 'alert' : 'status' }, icon(kind === 'success' ? 'check' : kind === 'danger' || kind === 'warning' ? 'alert' : 'info', 'alert-icon'), el('div.alert-content', {}, el('p.alert-description', { text: message })));
  const close = el('button.btn.btn-ghost.btn-xs.btn-square', { type: 'button', 'aria-label': t('close'), onclick: () => item.remove() }, icon('x'));
  item.append(close);
  box.append(item);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => item.remove(), ms);
}

export async function copyText(text, buttonEl) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = el('textarea.ff-offscreen', { value: text, readonly: true });
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  if (buttonEl) {
    const span = buttonEl.querySelector('span');
    const old = span?.textContent;
    if (span) span.textContent = t('copied');
    setTimeout(() => span && (span.textContent = old), 1500);
  }
}

/** Opens a dialog and resolves with its returnValue when it closes. */
export function showDialog(dialog) {
  return new Promise((resolve) => {
    const onClose = () => {
      dialog.removeEventListener('close', onClose);
      resolve(dialog.returnValue);
    };
    dialog.returnValue = '';
    dialog.addEventListener('close', onClose);
    dialog.showModal();
  });
}

export function fileIconName(name, type = '') {
  const kind = previewKind(name, type);
  return kind === 'image' ? 'image' : kind === 'video' ? 'video' : kind === 'audio' ? 'audio' : kind === 'text' || kind === 'pdf' ? 'text' : 'file';
}

const EXT = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'svg', 'ico'],
  video: ['mp4', 'webm', 'mov', 'm4v', 'ogv'],
  audio: ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'weba'],
  pdf: ['pdf'],
  text: ['txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'log', 'xml', 'yml', 'yaml', 'ini', 'toml', 'cfg', 'conf', 'js', 'mjs', 'ts', 'tsx', 'jsx', 'css', 'scss', 'html', 'htm', 'py', 'rb', 'java', 'kt', 'c', 'h', 'cpp', 'hpp', 'cs', 'go', 'rs', 'php', 'sh', 'bat', 'ps1', 'sql', 'srt', 'vtt', 'env', 'gitignore'],
};

/** image | video | audio | pdf | text | null, from the extension first, then the MIME type. */
export function previewKind(name, type = '') {
  const ext = String(name).split('.').pop().toLowerCase();
  for (const [kind, list] of Object.entries(EXT)) if (list.includes(ext)) return kind;
  if (/^image\/(png|jpeg|gif|webp|avif|bmp)$/.test(type)) return 'image';
  if (/^video\//.test(type)) return 'video';
  if (/^audio\//.test(type)) return 'audio';
  if (type === 'application/pdf') return 'pdf';
  if (/^text\//.test(type) || type === 'application/json') return 'text';
  return null;
}

/** The MIME type a preview uses: always our own choice, never text/html. */
export function safeType(kind, name) {
  const ext = String(name).split('.').pop().toLowerCase();
  if (kind === 'image') return ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : `image/${ext === 'ico' ? 'x-icon' : ext}`;
  if (kind === 'video') return ext === 'mov' ? 'video/quicktime' : ext === 'ogv' ? 'video/ogg' : ext === 'm4v' ? 'video/mp4' : `video/${ext}`;
  if (kind === 'audio') return { mp3: 'audio/mpeg', m4a: 'audio/mp4', oga: 'audio/ogg', weba: 'audio/webm' }[ext] ?? `audio/${ext}`;
  if (kind === 'pdf') return 'application/pdf';
  return 'text/plain';
}

// One context menu for the whole app. A right click, a long press on a touch screen, or the
// Menu key (or Shift+F10) on a focused item opens it; the item decides what the menu holds
// through attachMenu(). It is a real menu for assistive technology (role menu and menuitem):
// arrow keys move, Home and End jump, a letter jumps to the next item starting with it, Enter
// or Space picks, Escape and Tab close and give focus back. It flips at the edges so it always
// stays inside the viewport.

import { el, icon } from './ui.js';

const builders = new WeakMap();
const LONG_PRESS_MS = 520;
const MARGIN = 8;
let open = null; // { node, items, opener, at }
let press = null; // { timer, x, y, target }
let swallowClickUntil = 0;
let keyOpenedAt = 0;

/**
 * Gives an element a context menu. build() runs every time the menu opens and returns a list of
 * items: { label, icon, run, danger, disabled } or '-' for a separator. Falsy entries are skipped.
 */
export function attachMenu(target, build) {
  builders.set(target, build);
  target.dataset.menu = '';
  target.setAttribute('aria-keyshortcuts', 'Shift+F10');
  if (!target.matches('button, a[href], input, select, textarea, [tabindex]')) target.tabIndex = 0;
}

const ownerOf = (node) => {
  for (let n = node instanceof Element ? node : node?.parentElement; n; n = n.parentElement) if (builders.has(n)) return n;
  return null;
};

const nativeWanted = (node) => !!node?.closest?.('input, textarea, select, [contenteditable="true"]');

export const menuOpen = () => !!open;

export function closeMenu({ restore = false } = {}) {
  if (!open) return;
  const { node, opener } = open;
  open = null;
  opener.classList.remove('is-menu-open');
  node.remove();
  if (restore && opener.isConnected) opener.focus({ preventScroll: true });
}

function place(node, x, y) {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  node.style.maxHeight = `${vh - MARGIN * 2}px`;
  const { width: w, height: h } = node.getBoundingClientRect();
  let left = x + w + MARGIN > vw ? x - w : x;
  let top = y + h + MARGIN > vh ? y - h : y;
  left = Math.min(Math.max(MARGIN, left), vw - w - MARGIN);
  top = Math.min(Math.max(MARGIN, top), vh - h - MARGIN);
  node.style.left = `${Math.round(left)}px`;
  node.style.top = `${Math.round(top)}px`;
  node.dataset.side = top < y ? 'top' : 'bottom';
}

const enabled = () => open?.items.filter((b) => b.getAttribute('aria-disabled') !== 'true') ?? [];

function move(to) {
  const list = enabled();
  if (!list.length) return;
  const i = list.indexOf(document.activeElement);
  let next;
  if (to === 'first') next = 0;
  else if (to === 'last') next = list.length - 1;
  else if (i < 0) next = to > 0 ? 0 : list.length - 1;
  else next = (i + to + list.length) % list.length;
  list[next].focus({ preventScroll: true });
}

function onMenuKey(e) {
  if (e.key === 'ArrowDown') move(1);
  else if (e.key === 'ArrowUp') move(-1);
  else if (e.key === 'Home' || e.key === 'PageUp') move('first');
  else if (e.key === 'End' || e.key === 'PageDown') move('last');
  else if (e.key === 'Escape') closeMenu({ restore: true });
  else if (e.key === 'Tab') closeMenu({ restore: true });
  else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const list = enabled();
    const start = list.indexOf(document.activeElement);
    const k = e.key.toLowerCase();
    for (let s = 1; s <= list.length; s++) {
      const b = list[(start + s) % list.length];
      if (b.textContent.trim().toLowerCase().startsWith(k)) {
        b.focus({ preventScroll: true });
        break;
      }
    }
  } else return;
  e.preventDefault();
  e.stopPropagation();
}

/** Opens the menu of target at a point. keyboard focuses the first item. */
export function openMenu(target, { x, y, keyboard = false } = {}) {
  const build = builders.get(target);
  const entries = (build?.() ?? []).filter(Boolean);
  while (entries[0] === '-') entries.shift();
  while (entries.at(-1) === '-') entries.pop();
  if (!entries.length) return false;
  closeMenu();
  const node = el('div.ff-menu', { role: 'menu', tabindex: '-1', 'aria-orientation': 'vertical' });
  const items = [];
  let lastSep = true;
  for (const entry of entries) {
    if (entry === '-') {
      if (!lastSep) node.append(el('div.ff-menu-sep', { role: 'separator' }));
      lastSep = true;
      continue;
    }
    lastSep = false;
    const item = el(`button.ff-menu-item${entry.danger ? '.is-danger' : ''}`, { type: 'button', role: 'menuitem', tabindex: '-1' }, entry.icon ? icon(entry.icon) : el('span.ff-menu-pad'), el('span', { text: entry.label }));
    if (entry.disabled) item.setAttribute('aria-disabled', 'true');
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (entry.disabled) return;
      closeMenu({ restore: true });
      Promise.resolve()
        .then(() => entry.run?.())
        .catch((err) => console.warn('filefinch menu:', err?.message ?? err));
    });
    item.addEventListener('pointermove', () => item !== document.activeElement && entry.disabled !== true && item.focus({ preventScroll: true }));
    items.push(item);
    node.append(item);
  }
  const label = target.getAttribute('aria-label') || target.querySelector('.ff-tr-label, .ff-known-name .font-medium, .ff-clip-text, .ff-clip-preview, .ff-file-name')?.textContent || '';
  if (label) node.setAttribute('aria-label', label.trim().slice(0, 80));
  node.addEventListener('keydown', onMenuKey);
  node.addEventListener('contextmenu', (e) => e.preventDefault());
  node.style.left = '0px';
  node.style.top = '0px';
  document.body.append(node);
  if (x === undefined || y === undefined) {
    const r = target.getBoundingClientRect();
    x = r.left + Math.min(24, r.width / 2);
    y = r.top + Math.min(r.height, 44);
  }
  place(node, x, y);
  open = { node, items, opener: target, at: Date.now() };
  target.classList.add('is-menu-open');
  if (keyboard) move('first');
  else node.focus({ preventScroll: true });
  return true;
}

function onContextMenu(e) {
  if (open?.node.contains(e.target)) return e.preventDefault();
  const target = ownerOf(e.target);
  if (!target || nativeWanted(e.target)) {
    closeMenu();
    return;
  }
  e.preventDefault();
  // The Menu key and a long press also fire this event; the menu is already open for them.
  if (Date.now() - keyOpenedAt < 600 || (open?.opener === target && Date.now() - open.at < 800)) return;
  const fromKeyboard = e.button !== 2 && e.clientX === 0 && e.clientY === 0;
  if (fromKeyboard) openMenu(target, { keyboard: true });
  else openMenu(target, { x: e.clientX, y: e.clientY });
}

function onKey(e) {
  if (!(e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) return;
  const target = ownerOf(document.activeElement);
  if (!target || nativeWanted(document.activeElement)) return;
  e.preventDefault();
  keyOpenedAt = Date.now();
  openMenu(target, { keyboard: true });
}

function cancelPress() {
  if (!press) return;
  clearTimeout(press.timer);
  press.target.classList.remove('is-pressing');
  press = null;
}

function onPointerDown(e) {
  if (open && !open.node.contains(e.target)) closeMenu();
  if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
  const target = ownerOf(e.target);
  if (!target || nativeWanted(e.target)) return;
  cancelPress();
  const x = e.clientX;
  const y = e.clientY;
  target.classList.add('is-pressing');
  press = {
    x,
    y,
    target,
    timer: setTimeout(() => {
      cancelPress();
      if (openMenu(target, { x, y })) {
        swallowClickUntil = Date.now() + 700;
        navigator.vibrate?.(8);
      }
    }, LONG_PRESS_MS),
  };
}

function onPointerMove(e) {
  if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) cancelPress();
}

export function initContextMenu() {
  document.addEventListener('contextmenu', onContextMenu);
  document.addEventListener('keydown', onKey);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('pointermove', onPointerMove, { passive: true });
  for (const type of ['pointerup', 'pointercancel']) document.addEventListener(type, cancelPress, true);
  document.addEventListener(
    'click',
    (e) => {
      if (Date.now() < swallowClickUntil && !open?.node.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );
  // Scrolling the page or resizing it closes the menu (not right after it opened: focusing it
  // can nudge the page).
  const dismiss = () => open && Date.now() - open.at > 150 && closeMenu();
  window.addEventListener('resize', dismiss);
  document.addEventListener('scroll', (e) => !open?.node.contains(e.target) && dismiss(), true);
  document.addEventListener('focusin', (e) => open && !open.node.contains(e.target) && closeMenu());
}

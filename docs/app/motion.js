// Small moments that make transfers feel alive: a link drawn between the two devices when they
// connect, a card lifting off with a trail when it is sent, and a burst of parcels and feathers,
// a check, an optional chirp and a short vibration when files arrive. Everything is skipped
// under prefers-reduced-motion, and the sound is off unless turned on in Settings.

import { settings } from './settings.js';

const reduced = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const SVG = 'http://www.w3.org/2000/svg';
const PARCEL = 'M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9M7.5 5.2l9 4.6';
const FEATHER = 'M20 4C11 4 5 10 4 20c3-6 7-9 12-11-4 3-7 6-9 11 8-2 13-8 13-16z';

function particle(path, color, size) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('ff-particle');
  svg.style.width = `${size}px`;
  svg.style.height = `${size}px`;
  svg.style.color = color;
  const p = document.createElementNS(SVG, 'path');
  p.setAttribute('d', path);
  svg.append(p);
  return svg;
}

function layer() {
  let box = document.getElementById('ff-motion');
  if (!box) {
    box = document.createElement('div');
    box.id = 'ff-motion';
    box.className = 'ff-motion';
    box.setAttribute('aria-hidden', 'true');
    document.body.append(box);
  }
  return box;
}

const center = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
};

const visible = (el) => {
  if (!el || !el.isConnected) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
};

/** A burst of parcels and feathers from a point. */
function burst(x, y, count = 18) {
  const box = layer();
  const colors = ['var(--primary)', '#ff7a45', '#ffae3d', '#4c86f5', 'var(--success)'];
  for (let i = 0; i < count; i++) {
    const feather = i % 3 === 0;
    const el = particle(feather ? FEATHER : PARCEL, colors[i % colors.length], feather ? 16 : 14 + (i % 3) * 3);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    box.append(el);
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 60 + Math.random() * 90;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 30;
    const spin = (Math.random() - 0.5) * 540;
    el.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.3) rotate(0deg)', opacity: 0 },
        { transform: `translate(calc(-50% + ${dx * 0.6}px), calc(-50% + ${dy * 0.6}px)) scale(1) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + (feather ? 70 : 40)}px)) scale(0.8) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' },
    ).onfinish = () => el.remove();
  }
}

/** A short two note chirp made with WebAudio, only when the person turned sounds on. */
function chirp() {
  if (!settings.sound) return;
  try {
    const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [
      [2600, 3400, 0],
      [3000, 4200, 0.11],
    ].forEach(([from, to, at]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(from, now + at);
      osc.frequency.exponentialRampToValueAtTime(to, now + at + 0.08);
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.12, now + at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.12);
    });
    setTimeout(() => ctx.close(), 600);
  } catch {}
}

/** A parcel that flies from one element to another, leaving a light trail. */
function fly(from, to, { trail = true, path = PARCEL, size = 22 } = {}) {
  const a = center(from);
  const b = center(to);
  const box = layer();
  const el = particle(path, 'var(--primary)', size);
  el.classList.add('ff-flyer');
  el.style.left = `${a.x}px`;
  el.style.top = `${a.y}px`;
  box.append(el);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lift = -Math.min(120, Math.abs(dx) * 0.25 + 40);
  const frames = [
    { transform: 'translate(-50%, -50%) scale(0.6)', opacity: 0 },
    { transform: `translate(calc(-50% + ${dx * 0.15}px), calc(-50% + ${dy * 0.15 + lift}px)) scale(1.15)`, opacity: 1, offset: 0.25 },
    { transform: `translate(calc(-50% + ${dx * 0.7}px), calc(-50% + ${dy * 0.7 + lift * 0.6}px)) scale(0.9)`, opacity: 1, offset: 0.7 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.35)`, opacity: 0 },
  ];
  const anim = el.animate(frames, { duration: 950, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' });
  anim.onfinish = () => el.remove();
  if (trail) {
    for (let i = 1; i <= 5; i++) {
      const dot = document.createElement('span');
      dot.className = 'ff-trail';
      dot.style.left = `${a.x}px`;
      dot.style.top = `${a.y}px`;
      box.append(dot);
      dot.animate(
        frames.map((f) => ({ ...f, opacity: f.opacity * (0.5 - i * 0.08) })),
        { duration: 950, delay: i * 45, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' },
      ).onfinish = () => dot.remove();
    }
  }
  return anim.finished.catch(() => {});
}

function pulse(el, cls = 'ff-pulse-once') {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 1200);
}

export const celebrate = {
  /** Draws the link between the two device icons on the status screen. */
  connected(anim) {
    if (!anim) return;
    anim.classList.remove('is-linking');
    void anim.offsetWidth;
    anim.classList.add('is-linking');
  },

  /** A transfer starts: its card lifts off toward the other device in the header. */
  sent(card) {
    if (reduced() || !visible(card)) return;
    pulse(card, 'ff-liftoff');
    const target = document.getElementById('conn-pill');
    if (target) fly(card.querySelector('.ff-tr-icon') ?? card, target).then(() => pulse(target));
  },

  /** Files arrived and passed the SHA-256 check. */
  received(card) {
    try {
      navigator.vibrate?.([18, 50, 30]);
    } catch {}
    chirp();
    if (!card) return;
    card.classList.add('ff-arrived');
    setTimeout(() => card.classList.remove('ff-arrived'), 1600);
    if (reduced()) return;
    const tab = document.querySelector('.ff-tab[data-go="received"]');
    if (visible(card)) {
      const icon = card.querySelector('.ff-tr-icon') ?? card;
      const c = center(icon);
      burst(c.x, c.y);
    } else if (tab) {
      const from = document.querySelector('.ff-top') ?? document.body;
      fly(from, tab, { trail: true }).then(() => pulse(tab));
      const c = center(tab);
      burst(c.x, c.y, 10);
    }
  },
};

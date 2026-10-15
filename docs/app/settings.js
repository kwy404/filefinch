// Settings stored in this browser only (localStorage). The passphrase is never stored. Known
// devices keep the secret each pair agreed on, so anyone with access to this browser profile
// could use it; forgetting a device removes it.

import { randomId } from './lib/bytes.js';
import { loadKnown } from './lib/known.js';

export const DEFAULT_STUN = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
  'stun:stun4.l.google.com:19302',
];

const KEY = 'filefinch:settings';

function guessName() {
  const ua = navigator.userAgent || '';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/CrOS/.test(ua)) return 'Chromebook';
  if (/Linux/.test(ua)) return 'Linux PC';
  return 'My device';
}

function load() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch {}
  const s = {
    name: typeof saved.name === 'string' && saved.name.trim() ? saved.name.slice(0, 40) : guessName(),
    deviceId: typeof saved.deviceId === 'string' && /^[A-Za-z0-9_-]{8,40}$/.test(saved.deviceId) ? saved.deviceId : randomId(12),
    stun: Array.isArray(saved.stun) ? saved.stun.filter((u) => typeof u === 'string') : [...DEFAULT_STUN],
    turn: Array.isArray(saved.turn) ? saved.turn.filter((t) => t && typeof t.urls === 'string') : [],
    relayOnly: saved.relayOnly === true,
    destination: ['ask', 'download', 'library'].includes(saved.destination) ? saved.destination : 'ask',
    sound: saved.sound === true,
    known: loadKnown(saved.known),
  };
  return s;
}

export const settings = load();
save();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {}
}

/** The RTCPeerConnection configuration from the saved STUN and TURN servers. */
export function iceConfig(overrides = {}) {
  const iceServers = [];
  const stun = (overrides.stun ?? settings.stun).filter(Boolean);
  if (stun.length) iceServers.push({ urls: stun });
  for (const t of overrides.turn ?? settings.turn) {
    if (!t.urls) continue;
    iceServers.push({ urls: t.urls.split(/[\s,]+/).filter(Boolean), username: t.username || undefined, credential: t.credential || undefined });
  }
  return { iceServers, iceTransportPolicy: (overrides.relayOnly ?? settings.relayOnly) ? 'relay' : 'all' };
}

/** Checks that a TURN or STUN URL looks right before trying it. */
export function validIceUrl(url) {
  return /^(stun|stuns|turn|turns):[^\s]+$/i.test(url.trim());
}

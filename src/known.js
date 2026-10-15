// Known devices: two devices that were paired with six words and confirmed can remember each
// other. After the confirmation words match, the device that showed the code sends a fresh
// random secret over the confirmed channel; both keep it in this browser only. Next time both
// tap each other in "Your devices": they meet on the relays with a topic and key derived from
// that secret, so there are no pairing words to type, only the confirmation words.

import { randomBytes, toBase64Url } from './bytes.js';

export const MAX_KNOWN = 20;
const ID = /^[A-Za-z0-9_-]{8,40}$/;
const SECRET = /^[A-Za-z0-9_-]{43,86}$/;

/** A new 32 byte secret for a pair of devices, as base64url. */
export const newPairSecret = (random = randomBytes) => toBase64Url(random(32));

/** True for a well formed secret (at least 32 bytes of base64url). */
export const validSecret = (s) => typeof s === 'string' && SECRET.test(s);

/**
 * Which side shows the offer when two known devices meet: the one with the smaller device id.
 * Both devices compute the same answer, so nobody has to choose.
 */
export function knownRole(myDevice, peerDevice) {
  if (!ID.test(String(myDevice)) || !ID.test(String(peerDevice))) throw new Error('Not a device id');
  if (myDevice === peerDevice) throw new Error('Both devices have the same id');
  return myDevice < peerDevice ? 'creator' : 'joiner';
}

function clean(entry) {
  if (!entry || typeof entry !== 'object') return null;
  if (!ID.test(String(entry.device)) || !validSecret(entry.key)) return null;
  const name = typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim().slice(0, 40) : '?';
  const seen = Number.isSafeInteger(entry.seen) && entry.seen > 0 ? entry.seen : 0;
  return { device: entry.device, name, key: entry.key, seen };
}

/** The saved list, with anything malformed dropped and duplicates merged (newest wins). */
export function loadKnown(list) {
  if (!Array.isArray(list)) return [];
  const byDevice = new Map();
  for (const raw of list) {
    const e = clean(raw);
    if (!e) continue;
    const prev = byDevice.get(e.device);
    if (!prev || e.seen >= prev.seen) byDevice.set(e.device, e);
  }
  return sortKnown([...byDevice.values()]).slice(0, MAX_KNOWN);
}

/** Most recently seen first. */
export const sortKnown = (list) => [...list].sort((a, b) => b.seen - a.seen || a.name.localeCompare(b.name));

/**
 * Adds or updates a device. A missing key keeps the one already saved (a reconnect does not
 * change the secret). Returns the new list; the oldest entries go past MAX_KNOWN.
 */
export function rememberDevice(list, { device, name, key, seen = Date.now() }) {
  const prev = list.find((e) => e.device === device);
  const entry = clean({ device, name: name || prev?.name, key: key ?? prev?.key, seen });
  if (!entry) throw new Error('Cannot remember a device without an id and a secret');
  return sortKnown([entry, ...list.filter((e) => e.device !== device)]).slice(0, MAX_KNOWN);
}

/** The list without that device. */
export const forgetDevice = (list, device) => list.filter((e) => e.device !== device);

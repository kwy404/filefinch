// Generated from src/crypto.js by scripts/build-app.mjs. Edit the source, not this copy.
// Optional passphrase layer on top of the DTLS encryption WebRTC always uses, plus the short
// connection fingerprint both people can compare to detect a swapped invite.
//
// Passphrase: PBKDF2-SHA256 (600,000 iterations, random 16 byte salt) derives an AES-GCM 256 key.
// Every chunk gets a fresh random 12 byte IV and is bound to its file and offset with
// additional authenticated data, so chunks cannot be reordered, replayed into another file or edited.

import { concatBytes, fromBase64Url, randomBytes, toBase64Url, utf8 } from './bytes.js';
import { Sha256 } from './sha256.js';

export const PBKDF2_ITERATIONS = 600000;
export const IV_BYTES = 12;
export const TAG_BYTES = 16;
const CHECK_TEXT = 'filefinch passphrase check v1';

const subtle = () => {
  const s = globalThis.crypto?.subtle;
  if (!s) throw new Error('WebCrypto is not available. Open filefinch over https or localhost.');
  return s;
};

/** Derives the AES-GCM key from a passphrase and salt. */
export async function deriveKey(passphrase, salt, iterations = PBKDF2_ITERATIONS) {
  const text = String(passphrase ?? '').normalize('NFC');
  if (!text) throw new Error('Empty passphrase');
  const base = await subtle().importKey('raw', utf8(text), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Additional data that ties a chunk to its file key and byte offset. */
export function chunkAad(fileKey, offset) {
  const aad = new Uint8Array(12);
  const view = new DataView(aad.buffer);
  view.setUint32(0, fileKey);
  view.setUint32(4, Math.floor(offset / 0x100000000));
  view.setUint32(8, offset >>> 0);
  return aad;
}

/** Returns IV followed by ciphertext and tag. */
export async function encryptChunk(key, plain, aad) {
  const iv = randomBytes(IV_BYTES);
  const ct = await subtle().encrypt({ name: 'AES-GCM', iv, additionalData: aad }, key, plain);
  return concatBytes([iv, new Uint8Array(ct)]);
}

/** Reverses encryptChunk. Throws when the key is wrong or the data was changed. */
export async function decryptChunk(key, sealed, aad) {
  if (sealed.length < IV_BYTES + TAG_BYTES) throw new Error('Encrypted chunk too short');
  const iv = sealed.subarray(0, IV_BYTES);
  const body = sealed.subarray(IV_BYTES);
  try {
    return new Uint8Array(await subtle().decrypt({ name: 'AES-GCM', iv, additionalData: aad }, key, body));
  } catch {
    throw new Error('Could not decrypt: the passphrases do not match or the data was changed');
  }
}

/** A sealed known value the other side opens to confirm both passphrases match. */
export async function makeKeyCheck(key) {
  return toBase64Url(await encryptChunk(key, utf8(CHECK_TEXT), utf8('check')));
}

export async function verifyKeyCheck(key, check) {
  try {
    const plain = await decryptChunk(key, fromBase64Url(check), utf8('check'));
    return new TextDecoder().decode(plain) === CHECK_TEXT;
  } catch {
    return false;
  }
}

/** Everything the passphrase layer needs on one side of a connection. */
export class PassphraseLayer {
  static async create(passphrase, salt = randomBytes(16), iterations = PBKDF2_ITERATIONS) {
    const layer = new PassphraseLayer();
    layer.salt = salt;
    layer.iterations = iterations;
    layer.key = await deriveKey(passphrase, salt, iterations);
    return layer;
  }
  seal(plain, fileKey, offset) {
    return encryptChunk(this.key, plain, chunkAad(fileKey, offset));
  }
  open(sealed, fileKey, offset) {
    return decryptChunk(this.key, sealed, chunkAad(fileKey, offset));
  }
}

/** The DTLS certificate fingerprint (hex, no separators) from an SDP blob. */
export function sdpFingerprint(sdp) {
  const m = /a=fingerprint:(\S+) ([0-9A-Fa-f:]+)/.exec(sdp || '');
  if (!m) return null;
  return `${m[1].toLowerCase()} ${m[2].replace(/:/g, '').toLowerCase()}`;
}

/**
 * Twelve digits both devices show. They come from both DTLS certificate fingerprints, so if
 * someone swapped the invite or the reply on the way, the two screens show different numbers.
 */
export function connectionFingerprint(localSdp, remoteSdp) {
  const a = sdpFingerprint(localSdp);
  const b = sdpFingerprint(remoteSdp);
  if (!a || !b) return null;
  const digest = new Sha256().update(utf8([a, b].sort().join('|'))).digest();
  let n = 0n;
  for (let i = 0; i < 8; i++) n = (n << 8n) | BigInt(digest[i]);
  const digits = (n % 1000000000000n).toString().padStart(12, '0');
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
}

// Generated from src/clip.js by scripts/build-app.mjs. Edit the source, not this copy.
// Text and links sent between devices, like a shared clipboard. A clip is one control message
// on the data channel, which DTLS already encrypts. With a passphrase it is also sealed with
// the passphrase key, bound to its id, the same way file chunks are.
//   { t: 'clip', id, text }      or      { t: 'clip', id, sealed }   (base64url IV + ciphertext)
// The receiver answers { t: 'clip-ok', id } so the sender can show it arrived.

import { fromBase64Url, fromUtf8, randomId, toBase64Url, utf8 } from './bytes.js';
import { decryptChunk, encryptChunk } from './crypto.js';
import { MAX_CLIP_CHARS } from './protocol.js';

export { MAX_CLIP_CHARS };

const aad = (id) => utf8(`filefinch clip v1|${id}`);

/** Line endings made consistent and the text checked for size. */
export function cleanClip(text) {
  const s = String(text ?? '').replace(/\r\n?/g, '\n');
  if (!s.trim()) throw new Error('Nothing to send');
  if (s.length > MAX_CLIP_CHARS) throw new RangeError(`Text is longer than ${MAX_CLIP_CHARS} characters`);
  return s;
}

/** The control message for a clip. layer is a PassphraseLayer or null. */
export async function makeClip(text, layer = null, id = randomId()) {
  const s = cleanClip(text);
  if (!layer) return { t: 'clip', id, text: s };
  return { t: 'clip', id, sealed: toBase64Url(await encryptChunk(layer.key, utf8(s), aad(id))) };
}

/**
 * The text of a received clip. Throws when it is sealed and there is no layer or the wrong one,
 * when it is plain but a passphrase is in use (the other side should have sealed it), or when
 * it is empty or too long.
 */
export async function readClip(message, layer = null) {
  let text;
  if (typeof message.sealed === 'string') {
    if (!layer) throw new Error('This text is sealed with a passphrase');
    text = fromUtf8(await decryptChunk(layer.key, fromBase64Url(message.sealed), aad(message.id)));
  } else {
    if (layer) throw new Error('This text was not sealed with the passphrase');
    text = message.text;
  }
  return cleanClip(text);
}

/**
 * The link when the whole clip is one web address (http or https only), else null. Other
 * schemes such as javascript: or data: are never treated as links.
 */
export function clipLink(text) {
  const s = String(text ?? '').trim();
  if (!s || /\s/.test(s) || s.length > 4096) return null;
  const candidate = /^www\./i.test(s) ? `https://${s}` : s;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
}

/** A short one line preview for toasts and history: first line, at most max characters. */
export function clipPreview(text, max = 80) {
  const line = String(text ?? '').trim().split('\n')[0].trim();
  return line.length > max ? `${line.slice(0, max - 3)}...` : line;
}

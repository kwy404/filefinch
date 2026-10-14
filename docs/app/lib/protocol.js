// Generated from src/protocol.js by scripts/build-app.mjs. Edit the source, not this copy.
// Wire format on the data channel.
// Control messages are JSON text. File data is binary:
//   byte 0      frame type (1 = chunk)
//   bytes 1-4   file key (uint32, big endian), unique per connection
//   bytes 5-12  byte offset of the chunk in the file (uint64, big endian)
//   bytes 13-   payload (plain, or IV + ciphertext + tag with a passphrase)
// Every message from the other device is validated before use: it is another person's
// browser, so nothing in it is trusted beyond its shape.

export const FRAME_CHUNK = 1;
export const HEADER_BYTES = 13;
export const CHUNK_SIZE = 64 * 1024;
export const MAX_FILES_PER_OFFER = 100000;
export const MAX_CONTROL_BYTES = 16 * 1024 * 1024;

export function encodeChunk(fileKey, offset, payload) {
  const out = new Uint8Array(HEADER_BYTES + payload.length);
  const view = new DataView(out.buffer);
  view.setUint8(0, FRAME_CHUNK);
  view.setUint32(1, fileKey);
  view.setUint32(5, Math.floor(offset / 0x100000000));
  view.setUint32(9, offset >>> 0);
  out.set(payload, HEADER_BYTES);
  return out;
}

export function decodeChunk(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.length < HEADER_BYTES) throw new ProtocolError('Chunk frame too short');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint8(0) !== FRAME_CHUNK) throw new ProtocolError('Unknown frame type');
  const high = view.getUint32(5);
  if (high > 0x1fffff) throw new ProtocolError('Offset out of range');
  return {
    key: view.getUint32(1),
    offset: high * 0x100000000 + view.getUint32(9),
    payload: bytes.subarray(HEADER_BYTES),
  };
}

export class ProtocolError extends Error {}

const isStr = (v, max = 4096) => typeof v === 'string' && v.length <= max;
const isId = (v) => typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v);
const isUint = (v) => Number.isSafeInteger(v) && v >= 0;
const isKey = (v) => Number.isInteger(v) && v >= 0 && v <= 0xffffffff;
const isHash = (v) => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);

function fileEntry(f) {
  return (
    f &&
    typeof f === 'object' &&
    isKey(f.key) &&
    isStr(f.path, 4096) &&
    f.path.length > 0 &&
    isUint(f.size) &&
    (f.type === undefined || isStr(f.type, 200)) &&
    (f.mtime === undefined || isUint(f.mtime))
  );
}

function manifestEntry(e) {
  return e && typeof e === 'object' && isStr(e.path, 4096) && isUint(e.size) && isUint(e.mtime) && (e.hash === null || isHash(e.hash));
}

const copyItem = (i) => i && typeof i === 'object' && isStr(i.path, 4096) && isStr(i.as, 4096);
const pathList = (a) => Array.isArray(a) && a.length <= MAX_FILES_PER_OFFER && a.every((p) => isStr(p, 4096));

function syncPlan(p) {
  return (
    p &&
    typeof p === 'object' &&
    Array.isArray(p.push) &&
    p.push.every(copyItem) &&
    Array.isArray(p.pull) &&
    p.pull.every(copyItem) &&
    pathList(p.deleteLocal) &&
    pathList(p.deleteRemote) &&
    p.push.length + p.pull.length <= MAX_FILES_PER_OFFER
  );
}

const SCHEMAS = {
  hello: (m) => isStr(m.name, 80) && isId(m.device) && isUint(m.v) && (m.check === undefined || isStr(m.check, 400)),
  offer: (m) =>
    isId(m.id) &&
    Array.isArray(m.files) &&
    m.files.length > 0 &&
    m.files.length <= MAX_FILES_PER_OFFER &&
    m.files.every(fileEntry) &&
    (m.kind === 'send' || m.kind === 'sync') &&
    (m.sync === undefined || isId(m.sync)) &&
    (m.label === undefined || isStr(m.label, 300)),
  accept: (m) => isId(m.id) && Array.isArray(m.keys) && m.keys.every(isKey) && (m.offsets === undefined || (typeof m.offsets === 'object' && Object.values(m.offsets).every(isUint))),
  decline: (m) => isId(m.id) && (m.reason === undefined || isStr(m.reason, 300)),
  start: (m) => isId(m.id) && isKey(m.key) && isUint(m.offset),
  end: (m) => isId(m.id) && isKey(m.key) && isUint(m.size) && isHash(m.hash),
  ack: (m) => isKey(m.key) && isUint(m.offset),
  done: (m) => isId(m.id) && isKey(m.key) && typeof m.ok === 'boolean' && (m.reason === undefined || isStr(m.reason, 300)),
  skip: (m) => isId(m.id) && isKey(m.key) && (m.reason === undefined || isStr(m.reason, 300)),
  frag: (m) => isUint(m.i) && isUint(m.n) && m.n > 0 && m.n <= 400 && m.i < m.n && isStr(m.d, 60000),
  pause: (m) => isId(m.id),
  resume: (m) => isId(m.id),
  cancel: (m) => isId(m.id) && (m.reason === undefined || isStr(m.reason, 300)),
  'sync-request': (m) => isId(m.sync) && isStr(m.label, 300) && (m.mode === 'two-way' || m.mode === 'push' || m.mode === 'pull'),
  'sync-ready': (m) => isId(m.sync) && (m.label === undefined || isStr(m.label, 300)) && Array.isArray(m.entries) && m.entries.length <= MAX_FILES_PER_OFFER && m.entries.every(manifestEntry),
  'sync-plan': (m) => isId(m.sync) && syncPlan(m.plan),
  'sync-approve': (m) => isId(m.sync) && typeof m.ok === 'boolean',
  'sync-pull': (m) => isId(m.sync) && Array.isArray(m.items) && m.items.every((i) => i && isStr(i.path, 4096) && isStr(i.as, 4096)),
  'sync-delete': (m) => isId(m.sync) && Array.isArray(m.paths) && m.paths.every((p) => isStr(p, 4096)),
  'sync-done': (m) => isId(m.sync) && (m.base === undefined || typeof m.base === 'object'),
  'sync-cancel': (m) => isId(m.sync) && (m.reason === undefined || isStr(m.reason, 300)),
  pair: (m) => typeof m.ok === 'boolean',
  ping: () => true,
  bye: () => true,
};

export const MESSAGE_TYPES = Object.keys(SCHEMAS);

export function encodeControl(message) {
  if (!SCHEMAS[message?.t]) throw new ProtocolError(`Unknown message type ${message?.t}`);
  return JSON.stringify(message);
}

/** Parses and validates a control message. Throws ProtocolError for anything malformed. */
export function decodeControl(text) {
  if (typeof text !== 'string' || text.length > MAX_CONTROL_BYTES) throw new ProtocolError('Control message too large');
  let m;
  try {
    m = JSON.parse(text);
  } catch {
    throw new ProtocolError('Control message is not JSON');
  }
  if (!m || typeof m !== 'object' || Array.isArray(m)) throw new ProtocolError('Control message is not an object');
  const check = SCHEMAS[m.t];
  if (!check) throw new ProtocolError(`Unknown message type ${String(m.t).slice(0, 40)}`);
  if (!check(m)) throw new ProtocolError(`Malformed ${m.t} message`);
  return m;
}

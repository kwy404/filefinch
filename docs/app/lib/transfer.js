// Generated from src/transfer.js by scripts/build-app.mjs. Edit the source, not this copy.
// The transfer engine: offers, acceptance, chunked sending with backpressure, acknowledgements,
// pause, resume, cancel, hashing and resuming after a dropped connection. It knows nothing about
// WebRTC or the DOM: it talks to a `link` and writes to `sinks`, so it runs the same in tests.
//
// link: {
//   sendText(string), sendBinary(Uint8Array),
//   bufferedAmount(): number,
//   drained(): Promise<void>  resolves when the send buffer is low again (or the link closes)
// }
// sink: { write(Uint8Array): Promise, close(): Promise, abort(reason): Promise }

import { randomId } from './bytes.js';
import { ChunkReader } from './chunker.js';
import { CHUNK_SIZE, ProtocolError, decodeChunk, decodeControl, encodeChunk, encodeControl } from './protocol.js';
import { safePath } from './paths.js';
import { Sha256 } from './sha256.js';

export class Emitter {
  constructor() {
    this.listeners = new Map();
  }
  on(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
    return () => this.listeners.get(type)?.delete(fn);
  }
  emit(type, detail) {
    for (const fn of this.listeners.get(type) ?? []) {
      try {
        fn(detail);
      } catch (err) {
        if (type !== 'error') this.emit('error', err);
      }
    }
  }
}

export const DEFAULTS = {
  chunkSize: CHUNK_SIZE,
  windowBytes: 16 * 1024 * 1024, // unacknowledged bytes in flight
  ackEvery: 1024 * 1024,
  highWater: 4 * 1024 * 1024, // pause sending above this bufferedAmount
  readAhead: 8,
  fragmentChars: 48000,
};

const FINAL = new Set(['done', 'failed', 'skipped']);
const ACTIVE = new Set(['offered', 'active']);

const fileName = (path) => path.split('/').pop();

/** Bytes confirmed so far: acknowledged when sending, written when receiving. */
export function transferProgress(t) {
  let done = 0;
  let total = 0;
  for (const f of t.files) {
    if (f.state === 'skipped') continue;
    total += f.size;
    done += t.dir === 'out' ? (f.state === 'done' ? f.size : f.acked) : f.written;
  }
  return { done, total };
}

export async function hashPrefix(blob, length, chunkSize = 1024 * 1024) {
  const h = new Sha256();
  for (let o = 0; o < length; o += chunkSize) {
    h.update(new Uint8Array(await blob.slice(o, Math.min(length, o + chunkSize)).arrayBuffer()));
  }
  return h;
}

export class TransferEngine extends Emitter {
  constructor(options = {}) {
    super();
    this.opts = { ...DEFAULTS, ...options };
    this.link = null;
    this.layer = null; // PassphraseLayer or null
    this.outgoing = new Map();
    this.incoming = new Map();
    this.keysOut = new Map();
    this.keysIn = new Map();
    this.nextKey = (Math.random() * 0x7fffffff) >>> 0;
    this.wakers = new Set();
    this.pumping = false;
    this.fragments = null;
    this.autoAccept = options.autoAccept ?? null;
    this.onMessage = options.onMessage ?? null;
  }

  // ---- link management ----

  /** Connects the engine to an open link. With resume, interrupted transfers continue. */
  attach(link, { resume = true } = {}) {
    this.link = link;
    this.fragments = null;
    for (const t of this.outgoing.values()) {
      if (t.state === 'waiting' || (resume && (t.state === 'interrupted' || t.state === 'offered'))) this.offer(t);
    }
    this.wake();
  }

  /** The link dropped: running transfers become interrupted and keep their state for later. */
  detach() {
    this.link = null;
    this.fragments = null;
    for (const t of [...this.outgoing.values(), ...this.incoming.values()]) {
      if (ACTIVE.has(t.state)) {
        t.state = 'interrupted';
        for (const f of t.files) if (f.state === 'sending' || f.state === 'verifying') f.state = 'queued';
        this.emit('update', t);
      }
    }
    this.wake();
  }

  sendControl(message) {
    const link = this.link;
    if (!link) return false;
    const text = encodeControl(message);
    const size = this.opts.fragmentChars;
    if (text.length <= size) {
      link.sendText(text);
      return true;
    }
    const n = Math.ceil(text.length / size);
    if (n > 400) throw new ProtocolError('Message too large to send');
    for (let i = 0; i < n; i++) link.sendText(JSON.stringify({ t: 'frag', i, n, d: text.slice(i * size, (i + 1) * size) }));
    return true;
  }

  wake() {
    const list = [...this.wakers];
    this.wakers.clear();
    for (const fn of list) fn();
  }

  async waitFor(predicate) {
    while (!predicate()) await new Promise((resolve) => this.wakers.add(resolve));
  }

  // ---- incoming data from the link ----

  handleText(text) {
    let m;
    try {
      m = decodeControl(text);
      if (m.t === 'frag') {
        if (m.i === 0) this.fragments = { n: m.n, parts: [] };
        if (!this.fragments || this.fragments.n !== m.n || this.fragments.parts.length !== m.i) {
          this.fragments = null;
          throw new ProtocolError('Fragments arrived out of order');
        }
        this.fragments.parts.push(m.d);
        if (this.fragments.parts.length < m.n) return;
        const whole = this.fragments.parts.join('');
        this.fragments = null;
        m = decodeControl(whole);
      }
    } catch (err) {
      this.emit('error', err);
      return;
    }
    this.dispatch(m);
  }

  handleBinary(data) {
    let frame;
    try {
      frame = decodeChunk(data);
    } catch (err) {
      this.emit('error', err);
      return;
    }
    const entry = this.keysIn.get(frame.key);
    if (!entry) return; // a late chunk for a transfer that was canceled
    const { t, f } = entry;
    f.pending = (f.pending ?? 0) + 1;
    f.chain = f.chain
      .then(() => this.writeChunk(t, f, frame.offset, frame.payload))
      .catch((err) => this.failIncoming(t, f, err))
      .then(() => {
        f.pending--;
        this.maybeAck(f);
      });
  }

  /**
   * Acknowledges written bytes every `ackEvery` bytes, at the end of a file, and whenever the
   * write queue runs empty, so a sender with a smaller window than ackEvery never stalls.
   */
  maybeAck(f) {
    if (f.state !== 'receiving' || f.written === f.lastAck) return;
    if (f.written - f.lastAck >= this.opts.ackEvery || f.written === f.size || f.pending === 0) {
      f.lastAck = f.written;
      this.sendControl({ t: 'ack', key: f.key, offset: f.written });
    }
  }

  dispatch(m) {
    switch (m.t) {
      case 'offer':
        return this.onOffer(m);
      case 'accept':
        return this.onAccept(m);
      case 'decline':
        return this.onDecline(m);
      case 'start':
        return this.onStart(m);
      case 'end':
        return this.onEnd(m);
      case 'skip':
        return this.onSkip(m);
      case 'ack':
        return this.onAck(m);
      case 'done':
        return this.onDone(m);
      case 'pause':
        return this.onPause(m);
      case 'resume':
        return this.onResume(m);
      case 'cancel':
        return this.onCancel(m);
      default:
        return this.onMessage?.(m);
    }
  }

  // ---- sending ----

  /**
   * Queues files for the other device. files: [{ blob, path, type, mtime }].
   * meta: { kind: 'send' | 'sync', sync, label }. Returns the transfer object.
   */
  send(files, meta = {}) {
    if (!files.length) throw new Error('Nothing to send');
    const t = {
      id: randomId(),
      dir: 'out',
      kind: meta.kind ?? 'send',
      sync: meta.sync,
      label: meta.label ?? (files.length === 1 ? fileName(files[0].path) : `${files.length} files`),
      state: 'waiting',
      paused: false,
      pausedBy: null,
      created: Date.now(),
      error: null,
      files: files.map((f) => ({
        key: this.nextKey++ >>> 0,
        path: f.path,
        name: fileName(f.path),
        size: f.blob.size,
        type: f.type ?? f.blob.type ?? '',
        mtime: Math.max(0, Math.round(f.mtime ?? f.blob.lastModified ?? 0)),
        blob: f.blob,
        state: 'queued',
        sent: 0,
        acked: 0,
        resumeFrom: 0,
        hash: null,
        error: null,
        snapshots: new Map(),
      })),
    };
    for (const f of t.files) this.keysOut.set(f.key, { t, f });
    this.outgoing.set(t.id, t);
    if (this.link) this.offer(t);
    this.emit('update', t);
    return t;
  }

  offer(t) {
    const files = t.files.filter((f) => !FINAL.has(f.state));
    if (!files.length) return this.finish(t);
    t.state = 'offered';
    this.sendControl({
      t: 'offer',
      id: t.id,
      kind: t.kind,
      ...(t.sync ? { sync: t.sync } : {}),
      label: t.label,
      files: files.map((f) => ({ key: f.key, path: f.path, size: f.size, type: f.type, mtime: f.mtime })),
    });
    this.emit('update', t);
  }

  onAccept(m) {
    const t = this.outgoing.get(m.id);
    if (!t || (t.state !== 'offered' && t.state !== 'interrupted')) return;
    const keys = new Set(m.keys);
    for (const f of t.files) {
      if (FINAL.has(f.state)) continue;
      if (!keys.has(f.key)) {
        f.state = 'skipped';
        continue;
      }
      const from = m.offsets?.[f.key] ?? 0;
      f.resumeFrom = Math.min(f.size, from);
      f.acked = f.resumeFrom;
      f.state = 'queued';
    }
    t.state = 'active';
    this.emit('update', t);
    if (t.files.every((f) => FINAL.has(f.state))) return this.finish(t);
    this.pump();
  }

  onDecline(m) {
    const t = this.outgoing.get(m.id);
    if (!t || FINAL.has(t.state)) return;
    t.state = 'declined';
    t.error = m.reason ?? null;
    this.release(t);
    this.emit('update', t);
    this.emit('finished', t);
  }

  nextJob() {
    for (const t of this.outgoing.values()) {
      if (t.state !== 'active' || t.paused) continue;
      const f = t.files.find((x) => x.state === 'queued');
      if (f) return { t, f };
    }
    return null;
  }

  async pump() {
    if (this.pumping) return;
    this.pumping = true;
    try {
      for (let job = this.nextJob(); job && this.link; job = this.nextJob()) await this.sendFile(job.t, job.f);
    } finally {
      this.pumping = false;
    }
  }

  async sendFile(t, f) {
    const link = this.link;
    const { chunkSize, windowBytes, highWater, readAhead } = this.opts;
    const alive = () => this.link === link && t.state === 'active' && f.state === 'sending';
    f.state = 'sending';
    f.error = null;
    const offset = f.resumeFrom;
    let hasher;
    const snap = f.snapshots.get(offset);
    if (snap) hasher = Sha256.restore(snap);
    else if (offset === 0) hasher = new Sha256();
    else {
      this.emit('update', t);
      try {
        hasher = await hashPrefix(f.blob, offset);
      } catch (err) {
        return this.failOutgoing(t, f, err);
      }
      if (!alive()) return;
    }
    f.snapshots = new Map([[offset, hasher.save()]]);
    f.sent = offset;
    f.acked = offset;
    this.sendControl({ t: 'start', id: t.id, key: f.key, offset });
    this.emit('update', t);

    const reader = new ChunkReader(f.blob, { from: offset, chunkSize, readAhead });
    try {
      while (alive()) {
        if (t.paused) {
          await this.waitFor(() => !t.paused || !alive());
          continue;
        }
        if (f.sent - f.acked >= windowBytes) {
          await this.waitFor(() => f.sent - f.acked < windowBytes || t.paused || !alive());
          continue;
        }
        if (link.bufferedAmount() > highWater) {
          await Promise.race([link.drained(), new Promise((r) => this.wakers.add(r))]);
          continue;
        }
        const chunk = await reader.next();
        if (!chunk) break;
        if (!alive()) return;
        hasher.update(chunk.data);
        const payload = this.layer ? await this.layer.seal(chunk.data, f.key, chunk.offset) : chunk.data;
        if (!alive()) return;
        link.sendBinary(encodeChunk(f.key, chunk.offset, payload));
        f.sent = chunk.offset + chunk.data.length;
        f.snapshots.set(f.sent, hasher.save());
        this.emit('progress', t);
      }
      if (!alive()) return;
      if (f.sent !== f.size) throw new Error('The file changed size while it was being sent');
      f.hash = hasher.hex();
      f.state = 'verifying';
      this.sendControl({ t: 'end', id: t.id, key: f.key, size: f.size, hash: f.hash });
      this.emit('update', t);
    } catch (err) {
      if (this.link === link) this.failOutgoing(t, f, err);
    } finally {
      reader.close();
    }
  }

  failOutgoing(t, f, err) {
    f.state = 'failed';
    f.error = err?.message ?? String(err);
    this.sendControl({ t: 'skip', id: t.id, key: f.key, reason: f.error.slice(0, 300) });
    this.emit('update', t);
    this.maybeFinish(t);
  }

  onAck(m) {
    const entry = this.keysOut.get(m.key);
    if (!entry) return;
    const { t, f } = entry;
    if (m.offset > f.acked && m.offset <= f.size) {
      f.acked = m.offset;
      for (const k of f.snapshots.keys()) if (k < f.acked) f.snapshots.delete(k);
    }
    this.emit('progress', t);
    this.wake();
  }

  onDone(m) {
    const entry = this.keysOut.get(m.key);
    if (!entry || entry.t.id !== m.id) return;
    const { t, f } = entry;
    if (FINAL.has(f.state)) return;
    f.state = m.ok ? 'done' : 'failed';
    f.error = m.ok ? null : m.reason ?? 'The other device could not save this file';
    if (m.ok) f.acked = f.size;
    f.snapshots = new Map();
    this.emit('file', { t, f });
    this.emit('update', t);
    this.wake();
    this.maybeFinish(t);
  }

  // ---- receiving ----

  async onOffer(m) {
    const existing = this.incoming.get(m.id);
    if (existing) return this.resumeIncoming(existing, m);
    for (const f of m.files) {
      if (this.keysIn.has(f.key)) {
        this.sendControl({ t: 'decline', id: m.id, reason: 'Duplicate file key' });
        return;
      }
    }
    const t = {
      id: m.id,
      dir: 'in',
      kind: m.kind,
      sync: m.sync,
      label: String(m.label ?? '').slice(0, 300),
      state: 'pending',
      paused: false,
      pausedBy: null,
      created: Date.now(),
      error: null,
      sinkFor: null,
      files: m.files.map((f) => {
        const path = safePath(f.path);
        return {
          key: f.key,
          path,
          name: fileName(path),
          size: f.size,
          type: /^[\w.+-]+\/[\w.+-]+$/.test(f.type ?? '') ? f.type : '',
          mtime: f.mtime ?? 0,
          state: 'pending',
          written: 0,
          lastAck: 0,
          hasher: null,
          hash: null,
          sink: null,
          error: null,
          chain: Promise.resolve(),
        };
      }),
    };
    for (const f of t.files) this.keysIn.set(f.key, { t, f });
    this.incoming.set(t.id, t);
    if (this.autoAccept) {
      const plan = await this.autoAccept(t);
      if (plan) return this.accept(t.id, plan);
    }
    this.emit('offer', t);
    this.emit('update', t);
  }

  async resumeIncoming(t, m) {
    if (t.state === 'pending') return; // still waiting for the person to answer
    if (t.state !== 'interrupted' && t.state !== 'active') {
      this.sendControl({ t: 'decline', id: t.id, reason: 'This transfer was already closed' });
      return;
    }
    await Promise.all(t.files.map((f) => f.chain.catch(() => {})));
    const offered = new Set(m.files.map((f) => f.key));
    const keys = [];
    const offsets = {};
    for (const f of t.files) {
      if (!offered.has(f.key) || f.state === 'skipped' || f.state === 'failed') continue;
      keys.push(f.key);
      offsets[f.key] = f.state === 'done' ? f.size : f.written;
    }
    t.state = 'active';
    t.resumed = (t.resumed ?? 0) + 1;
    this.sendControl({ t: 'accept', id: t.id, keys, offsets });
    this.emit('update', t);
  }

  /**
   * Accepts an incoming offer. plan: { keys (optional subset), sinkFor(file) => Promise<sink> }.
   * sinkFor is called once per file when its data starts.
   */
  accept(id, plan) {
    const t = this.incoming.get(id);
    if (!t || t.state !== 'pending') return;
    const keys = new Set(plan.keys ?? t.files.map((f) => f.key));
    t.sinkFor = plan.sinkFor;
    t.state = 'active';
    for (const f of t.files) f.state = keys.has(f.key) ? 'waiting' : 'skipped';
    this.sendControl({ t: 'accept', id, keys: [...keys] });
    this.emit('update', t);
    this.maybeFinish(t);
  }

  decline(id, reason) {
    const t = this.incoming.get(id);
    if (!t || t.state !== 'pending') return;
    t.state = 'declined';
    this.sendControl({ t: 'decline', id, ...(reason ? { reason } : {}) });
    this.release(t);
    this.emit('update', t);
    this.emit('finished', t);
  }

  onStart(m) {
    const entry = this.keysIn.get(m.key);
    if (!entry || entry.t.id !== m.id) return;
    const { t, f } = entry;
    f.chain = f.chain
      .then(async () => {
        if (FINAL.has(f.state) || t.state === 'canceled') return;
        if (m.offset !== f.written) throw new ProtocolError(`Resume offset mismatch (${m.offset} vs ${f.written})`);
        if (!f.sink) f.sink = await t.sinkFor(f);
        if (!f.hasher) f.hasher = new Sha256();
        f.state = 'receiving';
        this.emit('update', t);
      })
      .catch((err) => this.failIncoming(t, f, err));
  }

  async writeChunk(t, f, offset, payload) {
    if (f.state !== 'receiving' || t.state === 'canceled') return;
    if (offset !== f.written) throw new ProtocolError('Data arrived out of order');
    const data = this.layer ? await this.layer.open(payload, f.key, offset) : payload;
    if (f.written + data.length > f.size) throw new ProtocolError('More data than the announced file size');
    f.hasher.update(data);
    await f.sink.write(data);
    f.written += data.length;
    this.emit('progress', t);
  }

  onEnd(m) {
    const entry = this.keysIn.get(m.key);
    if (!entry || entry.t.id !== m.id) return;
    const { t, f } = entry;
    f.chain = f.chain
      .then(async () => {
        if (f.state === 'done') {
          this.sendControl({ t: 'done', id: t.id, key: f.key, ok: true });
          return;
        }
        if (f.state !== 'receiving') return;
        f.hash = f.hasher.hex();
        if (f.written !== m.size || f.size !== m.size) throw new IntegrityError(`Size mismatch: received ${f.written} of ${m.size} bytes`);
        if (f.hash !== m.hash) throw new IntegrityError('The SHA-256 checksum does not match. The file was damaged on the way and was not kept.');
        await f.sink.close();
        f.state = 'done';
        f.verified = true;
        this.sendControl({ t: 'done', id: t.id, key: f.key, ok: true });
        this.emit('file', { t, f });
        this.emit('update', t);
        this.maybeFinish(t);
      })
      .catch((err) => this.failIncoming(t, f, err));
  }

  onSkip(m) {
    const entry = this.keysIn.get(m.key);
    if (!entry || entry.t.id !== m.id) return;
    const { t, f } = entry;
    f.chain = f.chain.then(() => this.failIncoming(t, f, new Error(m.reason ?? 'The sender could not read this file'), false));
  }

  async failIncoming(t, f, err, notify = true) {
    if (FINAL.has(f.state)) return;
    f.state = 'failed';
    f.error = err?.message ?? String(err);
    f.integrity = err instanceof IntegrityError;
    try {
      await f.sink?.abort(f.error);
    } catch {}
    if (notify) this.sendControl({ t: 'done', id: t.id, key: f.key, ok: false, reason: f.error.slice(0, 300) });
    this.emit('file', { t, f });
    this.emit('update', t);
    this.maybeFinish(t);
  }

  // ---- shared controls ----

  get(id) {
    return this.outgoing.get(id) ?? this.incoming.get(id) ?? null;
  }

  pause(id) {
    const t = this.get(id);
    if (!t || t.paused || FINAL.has(t.state) || t.state === 'canceled') return;
    t.paused = true;
    t.pausedBy = 'me';
    this.sendControl({ t: 'pause', id });
    this.wake();
    this.emit('update', t);
  }

  resume(id) {
    const t = this.get(id);
    if (!t || !t.paused) return;
    t.paused = false;
    t.pausedBy = null;
    this.sendControl({ t: 'resume', id });
    this.wake();
    this.emit('update', t);
    this.pump();
  }

  cancel(id, reason) {
    const t = this.get(id);
    if (!t || ['done', 'canceled', 'declined', 'failed'].includes(t.state)) return;
    this.sendControl({ t: 'cancel', id, ...(reason ? { reason } : {}) });
    this.closeCanceled(t, 'me', reason);
  }

  onPause(m) {
    const t = this.get(m.id);
    if (!t || t.paused) return;
    t.paused = true;
    t.pausedBy = 'peer';
    this.wake();
    this.emit('update', t);
  }

  onResume(m) {
    const t = this.get(m.id);
    if (!t || !t.paused) return;
    t.paused = false;
    t.pausedBy = null;
    this.wake();
    this.emit('update', t);
    this.pump();
  }

  onCancel(m) {
    const t = this.get(m.id);
    if (!t || ['done', 'canceled', 'declined'].includes(t.state)) return;
    this.closeCanceled(t, 'peer', m.reason);
  }

  closeCanceled(t, by, reason) {
    t.state = 'canceled';
    t.canceledBy = by;
    t.error = reason ?? null;
    for (const f of t.files) {
      if (FINAL.has(f.state)) continue;
      if (t.dir === 'in') {
        f.chain = f.chain.then(async () => {
          try {
            await f.sink?.abort('canceled');
          } catch {}
        });
      }
      f.state = 'skipped';
      f.canceled = true;
    }
    this.release(t);
    this.wake();
    this.emit('update', t);
    this.emit('finished', t);
  }

  maybeFinish(t) {
    if (t.state !== 'active' && t.state !== 'interrupted') return;
    if (t.files.every((f) => FINAL.has(f.state))) this.finish(t);
  }

  finish(t) {
    const failed = t.files.filter((f) => f.state === 'failed').length;
    t.state = failed === 0 ? 'done' : 'failed';
    t.failed = failed;
    t.finished = Date.now();
    this.release(t);
    this.emit('update', t);
    this.emit('finished', t);
  }

  /** Frees file keys, blobs and hash state once a transfer is closed. Records stay for history. */
  release(t) {
    for (const f of t.files) {
      if (t.dir === 'out') {
        this.keysOut.delete(f.key);
        f.snapshots = new Map();
      } else {
        this.keysIn.delete(f.key);
        f.hasher = null;
      }
    }
  }

  /** Removes closed transfers from memory. */
  clearFinished() {
    for (const map of [this.outgoing, this.incoming]) {
      for (const [id, t] of map) if (['done', 'failed', 'canceled', 'declined'].includes(t.state)) map.delete(id);
    }
  }

  /** Forgets interrupted transfers, for when a different device connects. */
  dropInterrupted(reason = 'The connection was lost') {
    for (const t of [...this.outgoing.values(), ...this.incoming.values()]) {
      if (t.state === 'interrupted') this.closeCanceled(t, 'lost', reason);
    }
  }
}

export class IntegrityError extends Error {}

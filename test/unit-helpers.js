// Test doubles: an in-memory link pair that behaves like an ordered data channel with a send
// buffer, and sinks that collect what the engine writes.
import { TransferEngine } from '../src/transfer.js';

export function makeLinkPair({ lowWater = 256 * 1024 } = {}) {
  const sides = [];
  for (let i = 0; i < 2; i++) {
    sides.push({ queue: [], buffered: 0, dead: false, drainWaiters: [], peer: null, engine: null, sentBinary: 0 });
  }
  sides[0].peer = sides[1];
  sides[1].peer = sides[0];
  const deliver = (from) => {
    setTimeout(() => {
      if (from.dead) return;
      const item = from.queue.shift();
      if (!item) return;
      from.buffered -= item.size;
      if (from.buffered <= lowWater) {
        const w = from.drainWaiters;
        from.drainWaiters = [];
        w.forEach((r) => r());
      }
      const target = from.peer.engine;
      if (typeof item.data === 'string') target.handleText(item.data);
      else target.handleBinary(item.data);
    }, 0);
  };
  const link = (side) => ({
    sendText(text) {
      if (side.dead) throw new Error('closed');
      side.queue.push({ data: text, size: text.length });
      side.buffered += text.length;
      deliver(side);
    },
    sendBinary(bytes) {
      if (side.dead) throw new Error('closed');
      const copy = bytes.slice();
      side.queue.push({ data: copy, size: copy.length });
      side.buffered += copy.length;
      side.sentBinary += copy.length;
      deliver(side);
    },
    bufferedAmount: () => side.buffered,
    drained: () => (side.buffered <= lowWater || side.dead ? Promise.resolve() : new Promise((r) => side.drainWaiters.push(r))),
  });
  return {
    sides,
    connect(a, b) {
      sides[0].engine = a;
      sides[1].engine = b;
      a.attach(link(sides[0]));
      b.attach(link(sides[1]));
    },
    /** Simulates a dropped connection: everything in flight is lost. */
    cut() {
      for (const s of sides) {
        s.dead = true;
        s.queue = [];
        s.buffered = 0;
        s.drainWaiters.forEach((r) => r());
      }
      sides[0].engine.detach();
      sides[1].engine.detach();
    },
  };
}

export function memorySink() {
  const sink = {
    parts: [],
    closed: false,
    aborted: null,
    async write(data) {
      sink.parts.push(data.slice());
    },
    async close() {
      sink.closed = true;
    },
    async abort(reason) {
      sink.aborted = reason ?? 'aborted';
    },
    bytes() {
      const n = sink.parts.reduce((a, p) => a + p.length, 0);
      const out = new Uint8Array(n);
      let o = 0;
      for (const p of sink.parts) {
        out.set(p, o);
        o += p.length;
      }
      return out;
    },
  };
  return sink;
}

export function randomData(size, seed = 1) {
  const out = new Uint8Array(size);
  let s = seed >>> 0;
  for (let i = 0; i < size; i++) {
    s = (s * 1103515245 + 12345) >>> 0;
    out[i] = s >>> 24;
  }
  return out;
}

export function engines(options = {}) {
  return [new TransferEngine(options), new TransferEngine(options)];
}

export const until = async (predicate, ms = 10000) => {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > ms) throw new Error('Timed out waiting for condition');
    await new Promise((r) => setTimeout(r, 2));
  }
};

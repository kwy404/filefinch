import { describe, expect, it } from 'vitest';
import { ChunkReader, alignOffset, chunkCount, chunkRanges } from '../src/chunker.js';
import { formatBytes, formatDuration, formatSpeed, SpeedMeter } from '../src/format.js';
import { CHUNK_SIZE, HEADER_BYTES, MESSAGE_TYPES, ProtocolError, decodeChunk, decodeControl, encodeChunk, encodeControl } from '../src/protocol.js';
import { randomData } from './unit-helpers.js';

describe('binary chunk frames', () => {
  it('uses 64 KB chunks', () => {
    expect(CHUNK_SIZE).toBe(65536);
  });

  it('round trips key, offset and payload, including offsets past 4 GB', () => {
    const payload = randomData(1000, 1);
    for (const offset of [0, 65536, 2 ** 32 + 7, 2 ** 45]) {
      const frame = encodeChunk(0xfeedbeef, offset, payload);
      expect(frame.length).toBe(HEADER_BYTES + payload.length);
      const back = decodeChunk(frame.buffer);
      expect(back.key).toBe(0xfeedbeef);
      expect(back.offset).toBe(offset);
      expect(back.payload).toEqual(payload);
    }
  });

  it('decodes from a view into a larger buffer', () => {
    const frame = encodeChunk(1, 2, Uint8Array.of(9, 9));
    const big = new Uint8Array(frame.length + 10);
    big.set(frame, 5);
    expect(decodeChunk(big.subarray(5, 5 + frame.length)).payload).toEqual(Uint8Array.of(9, 9));
  });

  it('rejects short frames, unknown types and absurd offsets', () => {
    expect(() => decodeChunk(new Uint8Array(5))).toThrow(ProtocolError);
    const bad = encodeChunk(1, 0, new Uint8Array(1));
    bad[0] = 9;
    expect(() => decodeChunk(bad)).toThrow(/frame type/);
    const huge = encodeChunk(1, 0, new Uint8Array(1));
    huge[5] = 0xff;
    expect(() => decodeChunk(huge)).toThrow(/Offset/);
  });
});

describe('control messages', () => {
  const offer = {
    t: 'offer',
    id: 'abc_DEF-1',
    kind: 'send',
    label: 'Photos',
    files: [{ key: 1, path: 'Photos/a.jpg', size: 10, type: 'image/jpeg', mtime: 1 }],
  };

  it('round trips every message the app sends', () => {
    const samples = [
      { t: 'hello', name: 'Laptop', device: 'dev1', v: 1, check: 'abc' },
      offer,
      { t: 'accept', id: 'x', keys: [1, 2], offsets: { 1: 65536 } },
      { t: 'decline', id: 'x', reason: 'no' },
      { t: 'start', id: 'x', key: 1, offset: 0 },
      { t: 'end', id: 'x', key: 1, size: 10, hash: 'a'.repeat(64) },
      { t: 'skip', id: 'x', key: 1, reason: 'gone' },
      { t: 'ack', key: 1, offset: 10 },
      { t: 'done', id: 'x', key: 1, ok: true },
      { t: 'pause', id: 'x' },
      { t: 'resume', id: 'x' },
      { t: 'cancel', id: 'x' },
      { t: 'frag', i: 0, n: 2, d: 'abc' },
      { t: 'sync-request', sync: 's1', label: 'Docs', mode: 'two-way' },
      { t: 'sync-ready', sync: 's1', label: 'Docs', entries: [{ path: 'a.txt', size: 1, mtime: 2, hash: 'b'.repeat(64) }] },
      { t: 'sync-plan', sync: 's1', plan: { push: [{ path: 'a', as: 'a' }], pull: [], deleteLocal: [], deleteRemote: ['b'] } },
      { t: 'sync-approve', sync: 's1', ok: true },
      { t: 'sync-pull', sync: 's1', items: [{ path: 'a.txt', as: 'a.txt' }] },
      { t: 'sync-delete', sync: 's1', paths: ['old.txt'] },
      { t: 'sync-done', sync: 's1', base: {} },
      { t: 'sync-cancel', sync: 's1' },
      { t: 'pair', ok: true },
      { t: 'ping' },
      { t: 'bye' },
    ];
    for (const m of samples) expect(decodeControl(encodeControl(m))).toEqual(m);
    expect(new Set(samples.map((m) => m.t))).toEqual(new Set(MESSAGE_TYPES));
  });

  it('rejects malformed or hostile messages', () => {
    const bad = [
      'not json',
      '[]',
      '"text"',
      JSON.stringify({ t: 'unknown' }),
      JSON.stringify({ ...offer, id: '../../x' }),
      JSON.stringify({ ...offer, files: [] }),
      JSON.stringify({ ...offer, kind: 'other' }),
      JSON.stringify({ ...offer, files: [{ key: -1, path: 'a', size: 1 }] }),
      JSON.stringify({ ...offer, files: [{ key: 1, path: '', size: 1 }] }),
      JSON.stringify({ ...offer, files: [{ key: 1, path: 'a', size: 1.5 }] }),
      JSON.stringify({ ...offer, files: [{ key: 1, path: 'a', size: 1, type: { evil: true } }] }),
      JSON.stringify({ t: 'end', id: 'x', key: 1, size: 1, hash: 'nothex' }),
      JSON.stringify({ t: 'ack', key: 1, offset: -5 }),
      JSON.stringify({ t: 'done', id: 'x', key: 1, ok: 'yes' }),
      JSON.stringify({ t: 'frag', i: 3, n: 2, d: '' }),
      JSON.stringify({ t: 'sync-request', sync: 's', label: 'x', mode: 'delete-everything' }),
      JSON.stringify({ t: 'sync-ready', sync: 's', entries: [{ path: 'a', size: 1, mtime: 1, hash: 'x' }] }),
      JSON.stringify({ t: 'hello', name: 'x'.repeat(200), device: 'd', v: 1 }),
      JSON.stringify({ t: 'sync-plan', sync: 's', plan: { push: [{ path: 1 }], pull: [], deleteLocal: [], deleteRemote: [] } }),
      JSON.stringify({ t: 'sync-plan', sync: 's', plan: { push: [], pull: [], deleteLocal: 'all' } }),
    ];
    for (const text of bad) expect(() => decodeControl(text), text).toThrow(ProtocolError);
    expect(() => encodeControl({ t: 'nope' })).toThrow(ProtocolError);
    expect(() => decodeControl(123)).toThrow(ProtocolError);
  });
});

describe('chunking', () => {
  it('splits a size into 64 KB ranges from any offset', () => {
    expect(chunkRanges(0)).toEqual([]);
    expect(chunkRanges(10)).toEqual([[0, 10]]);
    expect(chunkRanges(65536 * 2 + 1)).toEqual([
      [0, 65536],
      [65536, 131072],
      [131072, 131073],
    ]);
    expect(chunkRanges(200000, 131072)).toEqual([[131072, 196608], [196608, 200000]]);
    expect(chunkCount(65537)).toBe(2);
    expect(alignOffset(70000)).toBe(65536);
    expect(alignOffset(-3)).toBe(0);
  });

  it('reads a blob with file.slice in order, with read ahead, without copying it whole', async () => {
    const data = randomData(300000, 5);
    const blob = new Blob([data]);
    let slices = 0;
    const spy = { size: blob.size, slice: (a, b) => (slices++, blob.slice(a, b)) };
    const reader = new ChunkReader(spy, { chunkSize: 65536, readAhead: 3 });
    expect(slices).toBe(3);
    const got = [];
    for (let c = await reader.next(); c; c = await reader.next()) got.push(c);
    expect(got.map((c) => c.offset)).toEqual([0, 65536, 131072, 196608, 262144]);
    expect(got.every((c, i) => c.data.length === (i < 4 ? 65536 : 300000 - 262144))).toBe(true);
    expect(Buffer.concat(got.map((c) => c.data))).toEqual(Buffer.from(data));
    expect(slices).toBe(5);
  });

  it('starts from a resume offset and stops on close', async () => {
    const blob = new Blob([randomData(200000, 6)]);
    const reader = new ChunkReader(blob, { from: 131072 });
    expect((await reader.next()).offset).toBe(131072);
    reader.close();
    expect(await reader.next()).toBeNull();
  });

  it('turns read errors into a readable message', async () => {
    const reader = new ChunkReader({ size: 10, slice: () => ({ arrayBuffer: () => Promise.reject(Object.assign(new Error('x'), { name: 'NotReadableError' })) }) });
    await expect(reader.next()).rejects.toThrow(/NotReadableError.*moved, changed or deleted/);
  });
});

describe('formatting and speed', () => {
  it('formats sizes, speeds and durations', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1023, 'en')).toBe('1,023 B');
    expect(formatBytes(1536, 'en')).toBe('1.5 KB');
    expect(formatBytes(300 * 1024 * 1024, 'en')).toBe('300 MB');
    expect(formatBytes(1.25 * 1024 ** 3, 'pt-BR')).toBe('1,25 GB');
    expect(formatBytes(-1)).toBe('0 B');
    expect(formatSpeed(2 * 1024 * 1024, 'en')).toBe('2 MB/s');
    expect(formatDuration(42)).toBe('42 s');
    expect(formatDuration(185)).toBe('3 min 05 s');
    expect(formatDuration(7800)).toBe('2 h 10 min');
    expect(formatDuration(Infinity)).toBe('');
  });

  it('measures speed over a sliding window and estimates time left', () => {
    let now = 0;
    const m = new SpeedMeter(4000, () => now);
    expect(m.speed).toBe(0);
    m.add(0);
    now = 100;
    m.add(1000);
    expect(m.speed).toBe(0); // too little data
    for (let i = 2; i <= 10; i++) {
      now = i * 1000;
      m.add(i * 1_000_000);
    }
    expect(m.speed).toBeCloseTo(1_000_000, -3);
    expect(m.eta(5_000_000)).toBeCloseTo(5, 0);
    m.reset();
    expect(m.eta(10)).toBe(Infinity);
  });
});

import { describe, expect, it } from 'vitest';
import { PassphraseLayer } from '../src/crypto.js';
import { sha256Hex } from '../src/sha256.js';
import { TransferEngine, transferProgress } from '../src/transfer.js';
import { engines, makeLinkPair, memorySink, randomData, until } from './unit-helpers.js';

const small = { chunkSize: 1024, windowBytes: 16 * 1024, ackEvery: 4096, highWater: 8 * 1024 };

function setup(options = small) {
  const [a, b] = engines(options);
  const pair = makeLinkPair({ lowWater: 2048 });
  pair.connect(a, b);
  const sinks = new Map();
  const offers = [];
  b.on('offer', (t) => offers.push(t));
  const acceptAll = (t) =>
    b.accept(t.id, {
      sinkFor: async (f) => {
        const s = memorySink();
        sinks.set(f.path, s);
        return s;
      },
    });
  return { a, b, pair, sinks, offers, acceptAll };
}

describe('TransferEngine', () => {
  it('sends several files with progress, hashes and acknowledgements', async () => {
    const { a, b, sinks, offers, acceptAll } = setup();
    const files = [
      { path: 'Photos/a.jpg', data: randomData(10000, 1) },
      { path: 'Photos/sub/b.bin', data: randomData(1024 * 7, 2) },
      { path: 'empty.txt', data: new Uint8Array(0) },
    ];
    const t = a.send(files.map((f) => ({ blob: new Blob([f.data]), path: f.path, mtime: 1700000000000 })), { label: 'Photos' });
    let progressEvents = 0;
    a.on('progress', () => progressEvents++);
    await until(() => offers.length === 1);
    const incoming = offers[0];
    expect(incoming.label).toBe('Photos');
    expect(incoming.files.map((f) => f.path)).toEqual(['Photos/a.jpg', 'Photos/sub/b.bin', 'empty.txt']);
    expect(incoming.files[0].mtime).toBe(1700000000000);
    acceptAll(incoming);
    await until(() => t.state === 'done' && incoming.state === 'done');
    for (const f of files) {
      const sink = sinks.get(f.path);
      expect(sink.closed).toBe(true);
      expect(sink.bytes()).toEqual(f.data);
    }
    for (const f of incoming.files) expect(f.verified).toBe(true);
    expect(t.files[0].hash).toBe(sha256Hex(files[0].data));
    expect(incoming.files[1].hash).toBe(sha256Hex(files[1].data));
    expect(transferProgress(t)).toEqual({ done: 17168, total: 17168 });
    expect(transferProgress(incoming)).toEqual({ done: 17168, total: 17168 });
    expect(progressEvents).toBeGreaterThan(5);
    expect(a.keysOut.size).toBe(0);
    expect(b.keysIn.size).toBe(0);
  });

  it('never has more than the window in flight', async () => {
    const { a, pair, offers, acceptAll } = setup({ ...small, windowBytes: 4096, highWater: 1e9 });
    let maxInFlight = 0;
    const t = a.send([{ blob: new Blob([randomData(64 * 1024)]), path: 'x.bin' }]);
    a.on('progress', () => {
      const f = t.files[0];
      maxInFlight = Math.max(maxInFlight, f.sent - f.acked);
    });
    await until(() => offers.length === 1);
    acceptAll(offers[0]);
    await until(() => t.state === 'done');
    expect(maxInFlight).toBeLessThanOrEqual(4096);
    expect(pair.sides[0].sentBinary).toBeGreaterThan(64 * 1024);
  });

  it('respects the send buffer high water mark', async () => {
    const { a, pair, offers, acceptAll } = setup({ ...small, windowBytes: 1e9, highWater: 3000 });
    let maxBuffered = 0;
    const t = a.send([{ blob: new Blob([randomData(50 * 1024)]), path: 'x.bin' }]);
    a.on('progress', () => (maxBuffered = Math.max(maxBuffered, pair.sides[0].buffered)));
    await until(() => offers.length === 1);
    acceptAll(offers[0]);
    await until(() => t.state === 'done');
    expect(maxBuffered).toBeLessThanOrEqual(3000 + 1024 + 13);
  });

  it('lets the receiver pick a subset and decline', async () => {
    const { a, b, sinks, offers } = setup();
    const t = a.send([
      { blob: new Blob([randomData(3000, 3)]), path: 'keep.bin' },
      { blob: new Blob([randomData(3000, 4)]), path: 'skip.bin' },
    ]);
    await until(() => offers.length === 1);
    const keep = offers[0].files[0].key;
    b.accept(t.id, { keys: [keep], sinkFor: async (f) => sinks.set(f.path, memorySink()).get(f.path) });
    await until(() => t.state === 'done');
    expect(t.files.map((f) => f.state)).toEqual(['done', 'skipped']);
    expect([...sinks.keys()]).toEqual(['keep.bin']);

    const t2 = a.send([{ blob: new Blob([randomData(10)]), path: 'no.bin' }]);
    await until(() => offers.length === 2);
    b.decline(t2.id, 'Not now');
    await until(() => t2.state === 'declined');
    expect(t2.error).toBe('Not now');
  });

  it('pauses and resumes from either side', async () => {
    const { a, b, offers, acceptAll } = setup({ ...small, windowBytes: 2048 });
    const data = randomData(40 * 1024, 5);
    const t = a.send([{ blob: new Blob([data]), path: 'p.bin' }]);
    await until(() => offers.length === 1);
    const inc = offers[0];
    acceptAll(inc);
    await until(() => inc.files[0].written > 4096);
    b.pause(t.id);
    await until(() => t.paused && t.pausedBy === 'peer');
    await new Promise((r) => setTimeout(r, 30));
    const frozen = inc.files[0].written;
    await new Promise((r) => setTimeout(r, 30));
    expect(inc.files[0].written - frozen).toBeLessThanOrEqual(2048);
    expect(inc.files[0].written).toBeLessThan(data.length);
    a.resume(t.id);
    await until(() => t.state === 'done' && inc.state === 'done');
    expect(inc.paused).toBe(false);

    const t2 = a.send([{ blob: new Blob([data]), path: 'q.bin' }]);
    await until(() => offers.length === 2);
    acceptAll(offers[1]);
    a.pause(t2.id);
    await until(() => offers[1].paused && offers[1].pausedBy === 'peer');
    b.resume(t2.id);
    await until(() => t2.state === 'done');
  });

  it('cancels from the sender and from the receiver, discarding partial data', async () => {
    const { a, b, sinks, offers, acceptAll } = setup({ ...small, windowBytes: 2048 });
    const t = a.send([{ blob: new Blob([randomData(64 * 1024)]), path: 'c.bin' }]);
    await until(() => offers.length === 1);
    acceptAll(offers[0]);
    await until(() => offers[0].files[0].written > 2048);
    a.cancel(t.id, 'Changed my mind');
    await until(() => offers[0].state === 'canceled');
    expect(offers[0].error).toBe('Changed my mind');
    await until(() => sinks.get('c.bin').aborted === 'canceled');
    expect(sinks.get('c.bin').closed).toBe(false);

    const t2 = a.send([{ blob: new Blob([randomData(64 * 1024)]), path: 'd.bin' }]);
    await until(() => offers.length === 2);
    acceptAll(offers[1]);
    await until(() => offers[1].files[0].written > 2048);
    b.cancel(t2.id);
    await until(() => t2.state === 'canceled');
    expect(t2.canceledBy).toBe('peer');
  });

  it('resumes after a dropped connection from the confirmed offset with a correct hash', async () => {
    const { a, b, pair, sinks, offers, acceptAll } = setup({ ...small, windowBytes: 8192 });
    const data = randomData(200 * 1024, 9);
    const other = randomData(5000, 10);
    const t = a.send([
      { blob: new Blob([data]), path: 'big.bin' },
      { blob: new Blob([other]), path: 'after.bin' },
    ]);
    await until(() => offers.length === 1);
    const inc = offers[0];
    acceptAll(inc);
    await until(() => inc.files[0].written > 60 * 1024);
    pair.cut();
    expect(t.state).toBe('interrupted');
    expect(inc.state).toBe('interrupted');
    const writtenAtCut = inc.files[0].written;
    await new Promise((r) => setTimeout(r, 20));
    const before = pair.sides[0].sentBinary;

    const pair2 = makeLinkPair({ lowWater: 2048 });
    pair2.connect(a, b);
    await until(() => t.state === 'done' && inc.state === 'done');
    expect(offers.length).toBe(1); // no second prompt
    expect(inc.resumed).toBe(1);
    const sink = sinks.get('big.bin');
    expect(sink.bytes()).toEqual(data);
    expect(inc.files[0].hash).toBe(sha256Hex(data));
    expect(sinks.get('after.bin').bytes()).toEqual(other);
    // Only the part after the confirmed offset was sent again.
    const resent = pair2.sides[0].sentBinary;
    expect(resent).toBeLessThan(data.length - writtenAtCut + other.length + 20 * 1024);
    expect(before).toBeGreaterThan(0);
  });

  it('resumes when the sender has to re-hash the prefix', async () => {
    const { a, b, pair, sinks, offers, acceptAll } = setup({ ...small, windowBytes: 8192 });
    const data = randomData(100 * 1024, 11);
    const t = a.send([{ blob: new Blob([data]), path: 'r.bin' }]);
    await until(() => offers.length === 1);
    acceptAll(offers[0]);
    await until(() => offers[0].files[0].written > 30 * 1024);
    pair.cut();
    t.files[0].snapshots = new Map(); // forget saved hash states
    makeLinkPair({ lowWater: 2048 }).connect(a, b);
    await until(() => t.state === 'done');
    expect(sinks.get('r.bin').bytes()).toEqual(data);
    expect(offers[0].files[0].verified).toBe(true);
  });

  it('sends queued transfers once a link is attached', async () => {
    const [a, b] = engines(small);
    const t = a.send([{ blob: new Blob([randomData(100)]), path: 'later.txt' }]);
    expect(t.state).toBe('waiting');
    const offers = [];
    b.on('offer', (x) => offers.push(x));
    makeLinkPair().connect(a, b);
    await until(() => offers.length === 1);
    b.accept(t.id, { sinkFor: async () => memorySink() });
    await until(() => t.state === 'done');
  });

  it('encrypts every chunk with the passphrase layer and rejects a wrong passphrase', async () => {
    const salt = new Uint8Array(16).fill(7);
    const { a, b, pair, sinks, offers, acceptAll } = setup();
    a.layer = await PassphraseLayer.create('correct horse', salt, 1000);
    b.layer = await PassphraseLayer.create('correct horse', salt, 1000);
    const data = randomData(20000, 12);
    const t = a.send([{ blob: new Blob([data]), path: 'secret.bin' }]);
    await until(() => offers.length === 1);
    acceptAll(offers[0]);
    await until(() => t.state === 'done');
    expect(sinks.get('secret.bin').bytes()).toEqual(data);
    // ciphertext overhead: 28 bytes per 1024 byte chunk plus headers
    expect(pair.sides[0].sentBinary).toBe(data.length + Math.ceil(data.length / 1024) * (28 + 13));

    b.layer = await PassphraseLayer.create('wrong', salt, 1000);
    const t2 = a.send([{ blob: new Blob([data]), path: 'secret2.bin' }]);
    await until(() => offers.length === 2);
    acceptAll(offers[1]);
    await until(() => t2.state === 'failed');
    expect(t2.files[0].error).toMatch(/passphrases do not match/);
    expect(sinks.get('secret2.bin').aborted).toBeTruthy();
  });

  it('detects corrupted data with the SHA-256 check and does not keep the file', async () => {
    const { a, b, pair, sinks, offers, acceptAll } = setup();
    const data = randomData(9000, 13);
    // Flip one byte of the third chunk on the wire.
    const sendBinary = pair.sides[0];
    const original = b.handleBinary.bind(b);
    let n = 0;
    b.handleBinary = (bytes) => {
      if (++n === 3) bytes[20] ^= 0xff;
      original(bytes);
    };
    const t = a.send([{ blob: new Blob([data]), path: 'bad.bin' }]);
    await until(() => offers.length === 1);
    acceptAll(offers[0]);
    await until(() => t.state === 'failed');
    expect(sendBinary.sentBinary).toBeGreaterThan(0);
    expect(offers[0].files[0].integrity).toBe(true);
    expect(t.files[0].error).toMatch(/checksum/);
    expect(sinks.get('bad.bin').closed).toBe(false);
    expect(sinks.get('bad.bin').aborted).toBeTruthy();
  });

  it('reports a file that cannot be read and continues with the rest', async () => {
    const { a, offers, acceptAll, sinks } = setup();
    const broken = new Blob([randomData(5000)]);
    broken.slice = () => ({ arrayBuffer: () => Promise.reject(Object.assign(new Error('gone'), { name: 'NotFoundError' })) });
    const t = a.send([
      { blob: broken, path: 'gone.bin' },
      { blob: new Blob([randomData(3000)]), path: 'fine.bin' },
    ]);
    await until(() => offers.length === 1);
    acceptAll(offers[0]);
    await until(() => t.state === 'failed');
    expect(t.files[0].state).toBe('failed');
    expect(t.files[0].error).toMatch(/NotFoundError/);
    expect(t.files[1].state).toBe('done');
    expect(sinks.get('fine.bin').closed).toBe(true);
    expect(offers[0].files[0].state).toBe('failed');
  });

  it('fragments large control messages such as big folder offers', async () => {
    const { a, offers, acceptAll } = setup({ ...small, fragmentChars: 500 });
    const files = Array.from({ length: 300 }, (_, i) => ({ blob: new Blob([randomData(10, i)]), path: `many/file-${i}.txt` }));
    const t = a.send(files);
    await until(() => offers.length === 1);
    expect(offers[0].files.length).toBe(300);
    acceptAll(offers[0]);
    await until(() => t.state === 'done', 20000);
  });

  it('sanitizes paths from the other device', async () => {
    const { a, offers } = setup();
    a.send([{ blob: new Blob(['x']), path: '../../etc/passwd' }, { blob: new Blob(['y']), path: 'C:\\Windows\\con.txt' }]);
    await until(() => offers.length === 1);
    expect(offers[0].files.map((f) => f.path)).toEqual(['etc/passwd', 'C_/Windows/_con.txt']);
  });

  it('auto accepts offers the app approved in advance, such as a sync batch', async () => {
    const [a, b] = [new TransferEngine(small), new TransferEngine({ ...small, autoAccept: async (t) => (t.kind === 'sync' ? { sinkFor: async () => memorySink() } : null) })];
    makeLinkPair().connect(a, b);
    const prompts = [];
    b.on('offer', (t) => prompts.push(t));
    const t = a.send([{ blob: new Blob(['sync me']), path: 'doc.txt' }], { kind: 'sync', sync: 'abc' });
    await until(() => t.state === 'done');
    expect(prompts.length).toBe(0);
    const t2 = a.send([{ blob: new Blob(['ask me']), path: 'doc2.txt' }]);
    await until(() => prompts.length === 1);
    expect(t2.state).toBe('offered');
  });

  it('passes unknown message types to onMessage and ignores malformed ones', async () => {
    const seen = [];
    const errors = [];
    const e = new TransferEngine({ onMessage: (m) => seen.push(m.t) });
    e.on('error', (err) => errors.push(err.message));
    e.handleText(JSON.stringify({ t: 'ping' }));
    e.handleText('{not json');
    e.handleText(JSON.stringify({ t: 'offer', id: 'x', files: [] }));
    e.handleText(JSON.stringify({ t: 'nope' }));
    e.handleBinary(new Uint8Array(3));
    expect(seen).toEqual(['ping']);
    expect(errors.length).toBe(4);
  });
});

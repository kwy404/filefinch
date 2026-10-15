import { describe, expect, it } from 'vitest';
import { MAX_KNOWN, forgetDevice, knownRole, loadKnown, newPairSecret, rememberDevice, validSecret } from '../src/known.js';
import { deriveKnownRendezvous, deriveRendezvous, openMessage, sealMessage } from '../src/rendezvous.js';

const A = 'deviceAAAA01';
const B = 'deviceBBBB02';

describe('known device secrets', () => {
  it('makes a fresh 32 byte base64url secret each time', () => {
    const a = newPairSecret();
    const b = newPairSecret();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
    expect(validSecret(a)).toBe(true);
    expect(validSecret('short')).toBe(false);
    expect(validSecret(`${a.slice(0, 42)}!`)).toBe(false);
    expect(validSecret(null)).toBe(false);
  });

  it('picks opposite roles on the two devices, without asking anyone', () => {
    expect(knownRole(A, B)).toBe('creator');
    expect(knownRole(B, A)).toBe('joiner');
    expect(() => knownRole(A, A)).toThrow(/same id/);
    expect(() => knownRole('bad id!', B)).toThrow(/device id/);
  });
});

describe('known device list', () => {
  const key = newPairSecret();

  it('remembers, updates and forgets devices, newest first', () => {
    let list = rememberDevice([], { device: A, name: 'Laptop', key, seen: 100 });
    list = rememberDevice(list, { device: B, name: 'Phone', key: newPairSecret(), seen: 200 });
    expect(list.map((e) => e.name)).toEqual(['Phone', 'Laptop']);
    // A reconnect without a new key keeps the saved secret and refreshes the name and time.
    list = rememberDevice(list, { device: A, name: 'Work laptop', seen: 300 });
    expect(list[0]).toEqual({ device: A, name: 'Work laptop', key, seen: 300 });
    expect(list).toHaveLength(2);
    list = forgetDevice(list, A);
    expect(list.map((e) => e.device)).toEqual([B]);
  });

  it('refuses an entry with no secret', () => {
    expect(() => rememberDevice([], { device: A, name: 'Laptop' })).toThrow(/secret/);
  });

  it('keeps at most MAX_KNOWN devices, dropping the oldest', () => {
    let list = [];
    for (let i = 0; i < MAX_KNOWN + 5; i++) list = rememberDevice(list, { device: `device${String(i).padStart(6, '0')}`, name: `D${i}`, key, seen: 1000 + i });
    expect(list).toHaveLength(MAX_KNOWN);
    expect(list[0].name).toBe(`D${MAX_KNOWN + 4}`);
    expect(list.some((e) => e.name === 'D0')).toBe(false);
  });

  it('cleans what comes back from storage', () => {
    const list = loadKnown([
      { device: A, name: '  Laptop  ', key, seen: 5 },
      { device: A, name: 'Laptop (new)', key, seen: 9 },
      { device: 'x', name: 'too short', key, seen: 1 },
      { device: B, name: 'No key' },
      { device: B, name: '', key, seen: 'soon' },
      null,
      'junk',
    ]);
    expect(list).toEqual([
      { device: A, name: 'Laptop (new)', key, seen: 9 },
      { device: B, name: '?', key, seen: 0 },
    ]);
    expect(loadKnown('nope')).toEqual([]);
    expect(loadKnown(undefined)).toEqual([]);
  });
});

describe('known device rendezvous', () => {
  it('gives both devices the same topic and key from the shared secret', async () => {
    const secret = newPairSecret();
    const a = await deriveKnownRendezvous(secret);
    const b = await deriveKnownRendezvous(secret);
    expect(a.topic).toBe(b.topic);
    expect(a.topic).toMatch(/^filefinch\/v1\/[A-Za-z0-9_-]{22}$/);
    const sealed = await sealMessage(a, { k: 'join' });
    expect((await openMessage(b, sealed)).k).toBe('join');
  });

  it('keeps other pairs and word codes out', async () => {
    const a = await deriveKnownRendezvous(newPairSecret());
    const other = await deriveKnownRendezvous(newPairSecret());
    const words = await deriveRendezvous(['abandon', 'ability', 'able', 'about', 'above', 'absent'], 1000);
    expect(other.topic).not.toBe(a.topic);
    expect(words.topic).not.toBe(a.topic);
    const sealed = await sealMessage(a, { k: 'offer', sdp: 'v=0' });
    await expect(openMessage({ ...other, topic: a.topic }, sealed)).rejects.toThrow(/Could not open/);
  });

  it('refuses a secret that is too short', async () => {
    await expect(deriveKnownRendezvous('abc')).rejects.toThrow(/16 bytes/);
  });
});

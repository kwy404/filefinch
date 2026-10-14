import { describe, expect, it } from 'vitest';
import { utf8 } from '../src/bytes.js';
import {
  PBKDF2_ITERATIONS,
  PassphraseLayer,
  chunkAad,
  connectionFingerprint,
  decryptChunk,
  deriveKey,
  encryptChunk,
  makeKeyCheck,
  sdpFingerprint,
  verifyKeyCheck,
} from '../src/crypto.js';

const salt = Uint8Array.from({ length: 16 }, (_, i) => i);
const FAST = 1000;

describe('passphrase layer', () => {
  it('uses a strong default iteration count', () => {
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600000);
  });

  it('derives the same key from the same passphrase and salt', async () => {
    const k1 = await deriveKey('river stone', salt, FAST);
    const k2 = await deriveKey('river stone', salt, FAST);
    const sealed = await encryptChunk(k1, utf8('hello'), chunkAad(1, 0));
    expect(new TextDecoder().decode(await decryptChunk(k2, sealed, chunkAad(1, 0)))).toBe('hello');
  });

  it('normalizes the passphrase so the same text typed on two keyboards matches', async () => {
    const composed = 'caf\u00e9';
    const decomposed = 'cafe\u0301';
    const k1 = await deriveKey(composed, salt, FAST);
    const k2 = await deriveKey(decomposed, salt, FAST);
    expect(await verifyKeyCheck(k2, await makeKeyCheck(k1))).toBe(true);
  });

  it('rejects an empty passphrase', async () => {
    await expect(deriveKey('', salt, FAST)).rejects.toThrow(/Empty/);
  });

  it('uses a fresh IV per chunk and adds 28 bytes', async () => {
    const key = await deriveKey('pw', salt, FAST);
    const a = await encryptChunk(key, new Uint8Array(1000), chunkAad(1, 0));
    const b = await encryptChunk(key, new Uint8Array(1000), chunkAad(1, 0));
    expect(a.length).toBe(1028);
    expect(Buffer.from(a.subarray(0, 12)).equals(Buffer.from(b.subarray(0, 12)))).toBe(false);
  });

  it('fails on a wrong key, a moved chunk or edited ciphertext', async () => {
    const key = await deriveKey('right', salt, FAST);
    const wrong = await deriveKey('wrong', salt, FAST);
    const sealed = await encryptChunk(key, utf8('data'), chunkAad(5, 65536));
    await expect(decryptChunk(wrong, sealed, chunkAad(5, 65536))).rejects.toThrow(/passphrases do not match/);
    await expect(decryptChunk(key, sealed, chunkAad(5, 0))).rejects.toThrow();
    await expect(decryptChunk(key, sealed, chunkAad(6, 65536))).rejects.toThrow();
    const edited = sealed.slice();
    edited[14] ^= 1;
    await expect(decryptChunk(key, edited, chunkAad(5, 65536))).rejects.toThrow();
    await expect(decryptChunk(key, new Uint8Array(10), chunkAad(5, 65536))).rejects.toThrow(/too short/);
  });

  it('encodes large offsets in the additional data', () => {
    const aad = chunkAad(0xffffffff, 2 ** 40 + 5);
    expect(Array.from(aad)).toEqual([255, 255, 255, 255, 0, 0, 1, 0, 0, 0, 0, 5]);
  });

  it('checks that both sides typed the same passphrase', async () => {
    const a = await PassphraseLayer.create('same', salt, FAST);
    const b = await PassphraseLayer.create('same', salt, FAST);
    const c = await PassphraseLayer.create('other', salt, FAST);
    const check = await makeKeyCheck(a.key);
    expect(await verifyKeyCheck(b.key, check)).toBe(true);
    expect(await verifyKeyCheck(c.key, check)).toBe(false);
    expect(await verifyKeyCheck(b.key, 'garbage!')).toBe(false);
    const sealed = await a.seal(utf8('chunk'), 3, 128);
    expect(new TextDecoder().decode(await b.open(sealed, 3, 128))).toBe('chunk');
    await expect(c.open(sealed, 3, 128)).rejects.toThrow();
  });

  it('creates a random salt by default', async () => {
    const a = await PassphraseLayer.create('x', undefined, FAST);
    expect(a.salt.length).toBe(16);
    expect(a.iterations).toBe(FAST);
  });
});

describe('connection fingerprint', () => {
  const sdpA = 'v=0\r\na=fingerprint:sha-256 AA:BB:CC:DD\r\n';
  const sdpB = 'v=0\r\na=fingerprint:sha-256 11:22:33:44\r\n';

  it('reads the DTLS fingerprint', () => {
    expect(sdpFingerprint(sdpA)).toBe('sha-256 aabbccdd');
    expect(sdpFingerprint('v=0')).toBeNull();
  });

  it('is the same on both devices and changes when a certificate changes', () => {
    const one = connectionFingerprint(sdpA, sdpB);
    expect(one).toMatch(/^\d{4} \d{4} \d{4}$/);
    expect(connectionFingerprint(sdpB, sdpA)).toBe(one);
    expect(connectionFingerprint(sdpA, sdpB.replace('44', '45'))).not.toBe(one);
    expect(connectionFingerprint(sdpA, 'nothing')).toBeNull();
  });
});

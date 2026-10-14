import { describe, expect, it } from 'vitest';
import { toBase64Url, utf8 } from '../src/bytes.js';
import { connectionFingerprint } from '../src/crypto.js';
import { decodeSignal, deflate, encodeSignal, expandCandidate, findSignal, inflate, packSdp, shortCandidate, signalLink, trimCandidate, unpackSdp } from '../src/invite.js';
import { encodeQr } from '../src/qr.js';
import { chromeAnswer, chromeOffer, firefoxOffer, mediaOffer } from './unit-sdp-fixtures.js';

const lines = (sdp) => sdp.split('\r\n').filter(Boolean);
const essentials = (sdp) =>
  lines(sdp)
    .filter((l) => /^a=(ice-ufrag|ice-pwd|fingerprint|setup|mid|sctp-port|max-message-size):/.test(l))
    .sort();

describe('compact SDP', () => {
  it('keeps every field a data channel needs', () => {
    const packed = packSdp(chromeOffer);
    expect(packed.raw).toBeUndefined();
    expect(packed.u).toBe('vDXJ');
    expect(packed.s).toBe(0);
    expect(packed.c.length).toBe(4);
    const rebuilt = unpackSdp(packed);
    expect(essentials(rebuilt)).toEqual(essentials(chromeOffer));
    expect(rebuilt).toContain('m=application 9 UDP/DTLS/SCTP webrtc-datachannel');
    expect(rebuilt.endsWith('\r\n')).toBe(true);
    expect(connectionFingerprint(rebuilt, chromeAnswer)).toBe(connectionFingerprint(chromeOffer, chromeAnswer));
  });

  it('keeps relay, tcp and srflx candidate details and drops optional extensions', () => {
    expect(trimCandidate('1 1 udp 41885439 198.51.100.4 50000 typ relay raddr 203.0.113.7 rport 34722 generation 0 network-cost 999')).toBe(
      '1 1 udp 41885439 198.51.100.4 50000 typ relay raddr 203.0.113.7 rport 34722',
    );
    expect(shortCandidate('3 1 tcp 1518280447 192.168.1.20 9 typ host tcptype active generation 0 network-id 1')).toBe('th 192.168.1.20 9 ~active');
    expect(shortCandidate('1 1 udp 1677729535 203.0.113.7 34722 typ srflx raddr 0.0.0.0 rport 0 generation 0')).toBe('us 203.0.113.7 34722');
    expect(shortCandidate('1 2 udp 1 a 1 typ host')).toBeNull(); // a second component is not compactable
    expect(shortCandidate('1 1 sctp 1 a 1 typ host')).toBeNull();
    const rebuilt = unpackSdp(packSdp(chromeOffer));
    const cands = lines(rebuilt).filter((l) => l.startsWith('a=candidate:'));
    expect(cands).toEqual([
      expect.stringMatching(/^a=candidate:1 1 udp \d+ f6d683c0-d87c-48eb-a476-1401e419ad05\.local 59398 typ host$/),
      expect.stringMatching(/^a=candidate:2 1 udp \d+ 203\.0\.113\.7 34722 typ srflx raddr 0\.0\.0\.0 rport 0$/),
      expect.stringMatching(/^a=candidate:3 1 tcp \d+ 192\.168\.1\.20 9 typ host tcptype active$/),
      expect.stringMatching(/^a=candidate:4 1 udp \d+ 198\.51\.100\.4 50000 typ relay raddr 203\.0\.113\.7 rport 34722$/),
    ]);
    // Rebuilt priorities keep the preference order: host, then server reflexive, then relay.
    const pr = cands.map((c) => Number(c.split(' ')[3]));
    expect(pr[0]).toBeGreaterThan(pr[1]);
    expect(pr[1]).toBeGreaterThan(pr[3]);
    expect(Math.max(...pr)).toBeLessThan(2 ** 31);
    expect(() => expandCandidate('xz a 1', 0)).toThrow();
  });

  it('handles the answer role and a non default message size', () => {
    const ans = unpackSdp(packSdp(chromeAnswer));
    expect(ans).toContain('a=setup:active');
    const ff = packSdp(firefoxOffer);
    expect(ff.x).toBe(1073741823);
    expect(unpackSdp(ff)).toContain('a=max-message-size:1073741823');
    expect(essentials(unpackSdp(ff))).toEqual(essentials(firefoxOffer));
  });

  it('falls back to the full SDP for anything unusual', () => {
    expect(packSdp(mediaOffer)).toEqual({ raw: mediaOffer });
    const noFp = chromeOffer.replace(/a=fingerprint:.*\r\n/, '');
    expect(packSdp(noFp)).toEqual({ raw: noFp });
    expect(unpackSdp({ raw: 'v=0\r\n' })).toBe('v=0\r\n');
  });
});

describe('invite and reply codes', () => {
  it('round trips an invite and a reply', async () => {
    const code = await encodeSignal('i', { sdp: chromeOffer, name: 'Laptop', sid: 'abc123', lock: true, salt: 'c2FsdA', iterations: 600000 });
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    const back = await decodeSignal(code, 'i');
    expect(back).toMatchObject({ kind: 'i', name: 'Laptop', sid: 'abc123', lock: true, salt: 'c2FsdA', iterations: 600000 });
    expect(essentials(back.sdp)).toEqual(essentials(chromeOffer));
    const reply = await decodeSignal(await encodeSignal('r', { sdp: chromeAnswer, name: 'Phone', sid: 'abc123' }));
    expect(reply).toMatchObject({ kind: 'r', name: 'Phone', lock: false, salt: null });
  });

  it('stays small enough for a QR code that a phone scans from a screen', async () => {
    const code = await encodeSignal('i', { sdp: chromeOffer, name: 'Desktop', sid: 'abcdefghijkl' });
    expect(code.length).toBeLessThan(420);
    const link = signalLink('https://kwy404.github.io/filefinch/app/', 'i', code);
    const qr = encodeQr(link, { ecl: 'M' });
    expect(qr.version).toBeLessThanOrEqual(15);
    const full = await encodeSignal('i', { sdp: mediaOffer, name: 'x', sid: 'y' });
    expect(full.length).toBeGreaterThan(code.length);
  });

  it('explains damaged, wrong kind and wrong version codes', async () => {
    await expect(decodeSignal('not a code!!')).rejects.toThrow(/damaged/);
    await expect(decodeSignal(toBase64Url(await deflate(utf8('{"v":1}'))))).rejects.toThrow(/damaged/);
    const invite = await encodeSignal('i', { sdp: chromeOffer, name: 'A', sid: 's' });
    await expect(decodeSignal(invite, 'r')).rejects.toMatchObject({ code: 'kind' });
    const reply = await encodeSignal('r', { sdp: chromeAnswer, name: 'B', sid: 's' });
    await expect(decodeSignal(reply, 'i')).rejects.toThrow(/device that created the invite/);
    const future = toBase64Url(await deflate(utf8(JSON.stringify({ v: 99, k: 'i', d: { raw: 'v=0' } }))));
    await expect(decodeSignal(future)).rejects.toMatchObject({ code: 'version' });
    await expect(decodeSignal(invite.slice(0, 40))).rejects.toThrow();
    await expect(() => encodeSignal('x', { sdp: '' })).rejects.toThrow();
  });

  it('caps names and ids that arrive in a code', async () => {
    const code = await encodeSignal('i', { sdp: chromeOffer, name: 'n'.repeat(100), sid: 's' });
    expect((await decodeSignal(code)).name.length).toBe(40);
  });

  it('finds the code in whatever a person pastes', () => {
    const code = 'A'.repeat(30);
    expect(findSignal(`https://kwy404.github.io/filefinch/app/#i=${code}`)).toEqual({ kind: 'i', code });
    expect(findSignal(`Open this: https://x.dev/app/#r=${code} thanks`)).toEqual({ kind: 'r', code });
    expect(findSignal(`  ${code.slice(0, 15)}\n${code.slice(15)} `)).toEqual({ kind: null, code });
    expect(findSignal('hello')).toBeNull();
    expect(findSignal('')).toBeNull();
    expect(signalLink('https://a.dev/app/#old', 'r', 'xyz')).toBe('https://a.dev/app/#r=xyz');
  });

  it('compresses with deflate-raw', async () => {
    const data = utf8('filefinch '.repeat(100));
    const packed = await deflate(data);
    expect(packed.length).toBeLessThan(60);
    expect(await inflate(packed)).toEqual(data);
  });
});

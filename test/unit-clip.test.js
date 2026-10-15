import { describe, expect, it } from 'vitest';
import { MAX_CLIP_CHARS, cleanClip, clipLink, clipPreview, makeClip, readClip } from '../src/clip.js';
import { PassphraseLayer } from '../src/crypto.js';
import { decodeControl, encodeControl } from '../src/protocol.js';

const FAST = 1000;

describe('text clips', () => {
  it('sends plain text as is, with line endings made consistent', async () => {
    const m = await makeClip('first line\r\nsecond\rthird', null, 'clip1');
    expect(m).toEqual({ t: 'clip', id: 'clip1', text: 'first line\nsecond\nthird' });
    const back = decodeControl(encodeControl(m));
    expect(await readClip(back)).toBe('first line\nsecond\nthird');
  });

  it('refuses empty and oversized text', async () => {
    await expect(makeClip('   \n ')).rejects.toThrow(/Nothing/);
    expect(() => cleanClip('x'.repeat(MAX_CLIP_CHARS + 1))).toThrow(RangeError);
    expect(cleanClip('x'.repeat(MAX_CLIP_CHARS))).toHaveLength(MAX_CLIP_CHARS);
  });

  it('seals the text with the passphrase and opens it on the other side', async () => {
    const a = await PassphraseLayer.create('correct horse', undefined, FAST);
    const b = await PassphraseLayer.create('correct horse', a.salt, FAST);
    const text = 'Wi-Fi password: café à noite';
    const m = await makeClip(text, a, 'clip2');
    expect(m.text).toBeUndefined();
    expect(m.sealed).not.toContain('noite');
    expect(await readClip(decodeControl(encodeControl(m)), b)).toBe(text);
  });

  it('does not open with the wrong passphrase, another id, or no passphrase', async () => {
    const a = await PassphraseLayer.create('correct horse', undefined, FAST);
    const wrong = await PassphraseLayer.create('wrong horse', a.salt, FAST);
    const m = await makeClip('secret', a, 'clip3');
    await expect(readClip(m, wrong)).rejects.toThrow(/decrypt/);
    await expect(readClip({ ...m, id: 'clip4' }, a)).rejects.toThrow(/decrypt/);
    await expect(readClip(m, null)).rejects.toThrow(/sealed/);
    // With a passphrase in use, plain text from the other side is refused.
    await expect(readClip({ t: 'clip', id: 'x', text: 'hi' }, a)).rejects.toThrow(/not sealed/);
  });

  it('a long clip still fits through the control message fragments', async () => {
    const m = await makeClip('é'.repeat(MAX_CLIP_CHARS), await PassphraseLayer.create('pass', undefined, FAST), 'big');
    expect(() => decodeControl(encodeControl(m))).not.toThrow();
  });
});

describe('links in clips', () => {
  it('recognizes a single web address', () => {
    expect(clipLink('https://example.com/a?b=1#c')).toBe('https://example.com/a?b=1#c');
    expect(clipLink('  http://192.168.0.10:8080/  ')).toBe('http://192.168.0.10:8080/');
    expect(clipLink('www.example.com/page')).toBe('https://www.example.com/page');
  });

  it('never treats other schemes or prose as a link', () => {
    for (const text of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'file:///etc/passwd', 'see https://example.com', 'example.com', '', 'ftp://example.com']) {
      expect(clipLink(text), text).toBeNull();
    }
  });

  it('makes a short one line preview', () => {
    expect(clipPreview('  hello\nworld')).toBe('hello');
    expect(clipPreview('x'.repeat(100), 10)).toBe('xxxxxxx...');
  });
});

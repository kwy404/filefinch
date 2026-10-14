import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Crc32, ZipWriter, crc32, dosDateTime, zipSize } from '../src/zip.js';
import { randomData } from './unit-helpers.js';

function findPython() {
  for (const cmd of ['python3', 'python']) {
    try {
      execFileSync(cmd, ['-c', 'import zipfile'], { stdio: 'ignore' });
      return cmd;
    } catch {}
  }
  return null;
}
const python = findPython();

async function build(entries, chunk = 1000) {
  const parts = [];
  const zip = new ZipWriter(async (b) => parts.push(b.slice()));
  for (const { path, data, mtime } of entries) {
    await zip.begin(path, data.length, mtime);
    for (let o = 0; o < data.length; o += chunk) await zip.write(data.subarray(o, o + chunk));
    await zip.end();
  }
  await zip.finish();
  return Buffer.concat(parts);
}

/** A small reader for the central directory, independent of the writer. */
function readZip(buf) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = [];
  for (let i = 0; i < count; i++) {
    expect(buf.readUInt32LE(p)).toBe(0x02014b50);
    const crc = buf.readUInt32LE(p + 16);
    const size = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const offset = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    const localNameLen = buf.readUInt16LE(offset + 26);
    const localExtra = buf.readUInt16LE(offset + 28);
    const start = offset + 30 + localNameLen + localExtra;
    out.push({ name, crc, data: buf.subarray(start, start + size) });
    p += 46 + nameLen + extraLen;
  }
  return out;
}

describe('CRC-32', () => {
  it('matches the standard check value and works incrementally', () => {
    expect(crc32(Buffer.from('123456789'))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array(0))).toBe(0);
    const data = randomData(10000, 2);
    const c = new Crc32();
    for (let o = 0; o < data.length; o += 333) c.update(data.subarray(o, o + 333));
    expect(c.digest()).toBe(crc32(data));
  });
});

describe('ZipWriter', () => {
  const entries = [
    { path: 'Photos/beach.jpg', data: randomData(5000, 1), mtime: Date.UTC(2026, 9, 14, 12, 0, 0) },
    { path: 'Photos/empty.txt', data: new Uint8Array(0), mtime: 0 },
    { path: 'Notas/caf\u00e9 \u00e0 tarde.md', data: Buffer.from('# Notas\n'), mtime: Date.now() },
  ];

  it('writes stored entries with data descriptors and a central directory', async () => {
    const buf = await build(entries);
    const read = readZip(buf);
    expect(read.map((r) => r.name)).toEqual(entries.map((e) => e.path));
    for (let i = 0; i < entries.length; i++) {
      expect(Buffer.from(read[i].data).equals(Buffer.from(entries[i].data))).toBe(true);
      expect(read[i].crc).toBe(crc32(entries[i].data));
    }
    expect(buf.length).toBe(zipSize(entries.map((e) => ({ path: e.path, size: e.data.length }))));
  });

  it.skipIf(!python)('opens and verifies in an independent zip reader', async () => {
    const buf = await build(entries);
    const dir = mkdtempSync(join(tmpdir(), 'ffzip-'));
    try {
      const file = join(dir, 'x.zip');
      writeFileSync(file, buf);
      const script = 'import sys,zipfile,hashlib\nz=zipfile.ZipFile(sys.argv[1])\nassert z.testzip() is None\nfor i in z.infolist(): print(i.filename, i.file_size, hashlib.sha256(z.read(i)).hexdigest()[:8])';
      const out = execFileSync(python, ['-c', script, file], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
      const lines = out.trim().split(/\r?\n/);
      expect(lines.length).toBe(3);
      expect(lines[0]).toMatch(/^Photos\/beach\.jpg 5000 /);
      expect(lines[2]).toContain('caf\u00e9 \u00e0 tarde.md 8');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('enforces one open entry at a time', async () => {
    const zip = new ZipWriter(async () => {});
    await expect(zip.write(new Uint8Array(1))).rejects.toThrow();
    await expect(zip.end()).rejects.toThrow();
    await zip.begin('a', 1, 0);
    await expect(zip.begin('b', 1, 0)).rejects.toThrow();
    await expect(zip.finish()).rejects.toThrow();
    await zip.write(new Uint8Array(1));
    await zip.end();
    await zip.finish();
    await expect(zip.begin('c', 1, 0)).rejects.toThrow();
  });

  it('writes ZIP64 records past the classic limits', async () => {
    // Count past 65535 entries is the cheap way to need ZIP64 in a test.
    const many = Array.from({ length: 65536 }, (_, i) => ({ path: `f${i}`, data: new Uint8Array(0), mtime: 0 }));
    const buf = await build(many);
    expect(buf.indexOf(Buffer.from([0x50, 0x4b, 0x06, 0x06]))).toBeGreaterThan(0);
    expect(buf.indexOf(Buffer.from([0x50, 0x4b, 0x06, 0x07]))).toBeGreaterThan(0);
    const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    expect(buf.readUInt16LE(eocd + 10)).toBe(0xffff);
    expect(buf.length).toBe(zipSize(many.map((e) => ({ path: e.path, size: 0 }))));
  }, 60000);

  it('encodes DOS dates and clamps dates before 1980', () => {
    const { date, time } = dosDateTime(new Date(2026, 9, 14, 13, 45, 31).getTime());
    expect(date).toBe(((2026 - 1980) << 9) | (10 << 5) | 14);
    expect(time).toBe((13 << 11) | (45 << 5) | 15);
    expect(dosDateTime(new Date(1970, 0, 1).getTime() + 1).date >> 9).toBe(0);
  });
});

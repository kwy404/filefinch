// Generated from src/zip.js by scripts/build-app.mjs. Edit the source, not this copy.
// A streaming ZIP writer (stored, no compression) for browsers without a folder picker:
// a received folder is written as one .zip download as the bytes arrive, so nothing has to fit
// in memory. CRC-32 is computed on the fly, sizes go in data descriptors, and ZIP64 records are
// used when a file, the archive or the entry count passes the classic ZIP limits.

import { utf8 } from './bytes.js';

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

export class Crc32 {
  constructor() {
    this.crc = 0xffffffff;
  }
  update(data) {
    let c = this.crc;
    for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
    this.crc = c;
    return this;
  }
  digest() {
    return (this.crc ^ 0xffffffff) >>> 0;
  }
}

export const crc32 = (data) => new Crc32().update(data).digest();

const MAX32 = 0xffffffff;

export function dosDateTime(ms) {
  const d = new Date(Number.isFinite(ms) && ms > 0 ? ms : Date.now());
  const year = Math.min(2107, Math.max(1980, d.getFullYear()));
  return {
    date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
  };
}

class Out {
  constructor(size) {
    this.buf = new Uint8Array(size);
    this.view = new DataView(this.buf.buffer);
    this.o = 0;
  }
  u16(v) {
    this.view.setUint16(this.o, v, true);
    this.o += 2;
  }
  u32(v) {
    this.view.setUint32(this.o, v >>> 0, true);
    this.o += 4;
  }
  u64(v) {
    this.view.setUint32(this.o, v >>> 0, true);
    this.view.setUint32(this.o + 4, Math.floor(v / 0x100000000), true);
    this.o += 8;
  }
  bytes(b) {
    this.buf.set(b, this.o);
    this.o += b.length;
  }
}

export class ZipWriter {
  /** write(Uint8Array) must return a promise that resolves once the bytes are accepted. */
  constructor(write) {
    this.sink = write;
    this.offset = 0;
    this.entries = [];
    this.current = null;
    this.finished = false;
  }

  async emit(bytes) {
    this.offset += bytes.length;
    await this.sink(bytes);
  }

  /** Starts a file. Entries are written one after another; call end() before the next. */
  async begin(path, size, mtime) {
    if (this.current) throw new Error('Previous zip entry is still open');
    if (this.finished) throw new Error('Zip already finished');
    const name = utf8(path);
    const zip64 = size >= MAX32;
    const { date, time } = dosDateTime(mtime);
    const extraLen = zip64 ? 20 : 0;
    const h = new Out(30 + name.length + extraLen);
    h.u32(0x04034b50);
    h.u16(zip64 ? 45 : 20);
    h.u16(0x0808); // data descriptor follows, UTF-8 names
    h.u16(0); // stored
    h.u16(time);
    h.u16(date);
    h.u32(0);
    h.u32(zip64 ? MAX32 : 0);
    h.u32(zip64 ? MAX32 : 0);
    h.u16(name.length);
    h.u16(extraLen);
    h.bytes(name);
    if (zip64) {
      h.u16(0x0001);
      h.u16(16);
      h.u64(0);
      h.u64(0);
    }
    this.current = { name, size, zip64, date, time, crc: new Crc32(), written: 0, headerOffset: this.offset };
    await this.emit(h.buf);
  }

  async write(data) {
    const e = this.current;
    if (!e) throw new Error('No open zip entry');
    e.crc.update(data);
    e.written += data.length;
    await this.emit(data);
  }

  async end() {
    const e = this.current;
    if (!e) throw new Error('No open zip entry');
    e.crcValue = e.crc.digest();
    e.zip64 = e.zip64 || e.written >= MAX32;
    const d = new Out(e.zip64 ? 24 : 16);
    d.u32(0x08074b50);
    d.u32(e.crcValue);
    if (e.zip64) {
      d.u64(e.written);
      d.u64(e.written);
    } else {
      d.u32(e.written);
      d.u32(e.written);
    }
    this.current = null;
    this.entries.push(e);
    await this.emit(d.buf);
  }

  /** Writes the central directory. The archive is complete afterwards. */
  async finish() {
    if (this.current) throw new Error('A zip entry is still open');
    const cdStart = this.offset;
    for (const e of this.entries) {
      const bigSize = e.written >= MAX32;
      const bigOffset = e.headerOffset >= MAX32;
      const extraLen = bigSize || bigOffset ? 4 + (bigSize ? 16 : 0) + (bigOffset ? 8 : 0) : 0;
      const c = new Out(46 + e.name.length + extraLen);
      c.u32(0x02014b50);
      c.u16(45);
      c.u16(e.zip64 || bigOffset ? 45 : 20);
      c.u16(0x0808);
      c.u16(0);
      c.u16(e.time);
      c.u16(e.date);
      c.u32(e.crcValue);
      c.u32(bigSize ? MAX32 : e.written);
      c.u32(bigSize ? MAX32 : e.written);
      c.u16(e.name.length);
      c.u16(extraLen);
      c.u16(0);
      c.u16(0);
      c.u16(0);
      c.u32(0);
      c.u32(bigOffset ? MAX32 : e.headerOffset);
      c.bytes(e.name);
      if (extraLen) {
        c.u16(0x0001);
        c.u16(extraLen - 4);
        if (bigSize) {
          c.u64(e.written);
          c.u64(e.written);
        }
        if (bigOffset) c.u64(e.headerOffset);
      }
      await this.emit(c.buf);
    }
    const cdSize = this.offset - cdStart;
    const count = this.entries.length;
    const needs64 = count >= 0xffff || cdSize >= MAX32 || cdStart >= MAX32;
    if (needs64) {
      const z = new Out(56 + 20);
      const recordOffset = this.offset;
      z.u32(0x06064b50);
      z.u64(44);
      z.u16(45);
      z.u16(45);
      z.u32(0);
      z.u32(0);
      z.u64(count);
      z.u64(count);
      z.u64(cdSize);
      z.u64(cdStart);
      z.u32(0x07064b50);
      z.u32(0);
      z.u64(recordOffset);
      z.u32(1);
      await this.emit(z.buf);
    }
    const end = new Out(22);
    end.u32(0x06054b50);
    end.u16(0);
    end.u16(0);
    end.u16(needs64 ? 0xffff : count);
    end.u16(needs64 ? 0xffff : count);
    end.u32(needs64 ? MAX32 : cdSize);
    end.u32(needs64 ? MAX32 : cdStart);
    end.u16(0);
    await this.emit(end.buf);
    this.finished = true;
  }
}

/** Total archive size for known entries, so a download can show real progress. */
export function zipSize(entries) {
  let total = 0;
  for (const { path, size } of entries) {
    const n = utf8(path).length;
    const zip64 = size >= MAX32;
    total += 30 + n + (zip64 ? 20 : 0) + size + (zip64 ? 24 : 16);
  }
  let offset = 0;
  let cd = 0;
  for (const { path, size } of entries) {
    const n = utf8(path).length;
    const bigSize = size >= MAX32;
    const bigOffset = offset >= MAX32;
    cd += 46 + n + (bigSize || bigOffset ? 4 + (bigSize ? 16 : 0) + (bigOffset ? 8 : 0) : 0);
    offset += 30 + n + (bigSize ? 20 : 0) + size + (bigSize ? 24 : 16);
  }
  const needs64 = entries.length >= 0xffff || cd >= MAX32 || total >= MAX32;
  return total + cd + (needs64 ? 76 : 0) + 22;
}

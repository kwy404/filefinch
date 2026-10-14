// Reads a File or Blob as fixed size chunks with file.slice, a few chunks ahead of the sender,
// so the disk read overlaps the network send and the file is never loaded into memory whole.

import { CHUNK_SIZE } from './protocol.js';

/** Byte ranges [start, end) covering `size` from `from`, `chunkSize` at a time. */
export function chunkRanges(size, from = 0, chunkSize = CHUNK_SIZE) {
  const out = [];
  for (let o = Math.max(0, from); o < size; o += chunkSize) out.push([o, Math.min(size, o + chunkSize)]);
  return out;
}

export const chunkCount = (size, chunkSize = CHUNK_SIZE) => Math.ceil(size / chunkSize);

/** Rounds an offset down to a chunk boundary, which is where a resumed transfer restarts. */
export const alignOffset = (offset, chunkSize = CHUNK_SIZE) => Math.floor(Math.max(0, offset) / chunkSize) * chunkSize;

export class ChunkReader {
  constructor(blob, { from = 0, chunkSize = CHUNK_SIZE, readAhead = 8 } = {}) {
    this.blob = blob;
    this.chunkSize = chunkSize;
    this.readAhead = Math.max(1, readAhead);
    this.next0 = from;
    this.queue = [];
    this.fill();
  }

  fill() {
    while (this.queue.length < this.readAhead && this.next0 < this.blob.size) {
      const offset = this.next0;
      const end = Math.min(this.blob.size, offset + this.chunkSize);
      this.next0 = end;
      const p = this.blob
        .slice(offset, end)
        .arrayBuffer()
        .then((buf) => ({ offset, data: new Uint8Array(buf) }));
      p.catch(() => {}); // surfaced by next()
      this.queue.push(p);
    }
  }

  /** The next chunk as { offset, data }, or null at the end. */
  async next() {
    if (!this.queue.length) return null;
    const p = this.queue.shift();
    this.fill();
    try {
      return await p;
    } catch (err) {
      throw new Error(`Could not read the file (${err?.name || 'error'}). It may have been moved, changed or deleted.`);
    }
  }

  /** Drops pending reads, for pause or cancel. */
  close() {
    this.queue = [];
    this.next0 = this.blob.size;
  }
}

// The local library: files you chose to keep inside filefinch, to preview, save later or send
// again. Data goes to the Origin Private File System when the browser can write it there, and to
// IndexedDB in 4 MB blobs otherwise. The index lives in IndexedDB. Nothing leaves this browser.

import { dbAll, dbDelete, dbGet, dbPut } from './db.js';
import { randomId } from './lib/bytes.js';

const PART = 4 * 1024 * 1024;

async function opfsDir() {
  if (!navigator.storage?.getDirectory) return null;
  try {
    const root = await navigator.storage.getDirectory();
    const dir = await root.getDirectoryHandle('library', { create: true });
    const probe = await dir.getFileHandle('.probe', { create: true });
    if (typeof probe.createWritable !== 'function') return null;
    return dir;
  } catch {
    return null;
  }
}

let dirPromise = null;
const libraryDir = () => (dirPromise ??= opfsDir());

export async function backend() {
  return (await libraryDir()) ? 'opfs' : 'idb';
}

/** A sink that writes one incoming file into the library. meta: { name, path, type, mtime, from }. */
export async function librarySink(meta) {
  const id = randomId(12);
  const record = {
    id,
    name: meta.name,
    path: meta.path,
    type: meta.type || '',
    size: 0,
    mtime: meta.mtime || Date.now(),
    added: Date.now(),
    from: meta.from || '',
    hash: null,
  };
  const dir = await libraryDir();
  if (dir) {
    const handle = await dir.getFileHandle(id, { create: true });
    const writable = await handle.createWritable();
    record.backend = 'opfs';
    return {
      kind: 'library',
      id,
      write: async (data) => {
        record.size += data.length;
        await writable.write(data);
      },
      close: async () => {
        await writable.close();
        await dbPut('library', record);
      },
      abort: async () => {
        try {
          await writable.abort();
        } catch {}
        try {
          await dir.removeEntry(id);
        } catch {}
      },
      setHash: (hash) => (record.hash = hash),
      file: () => libraryFile(id),
    };
  }
  record.backend = 'idb';
  let buffer = [];
  let buffered = 0;
  let n = 0;
  const flush = async () => {
    if (!buffered) return;
    await dbPut('chunks', { id, n: n++, blob: new Blob(buffer) });
    buffer = [];
    buffered = 0;
  };
  return {
    kind: 'library',
    id,
    write: async (data) => {
      buffer.push(data.slice());
      buffered += data.length;
      record.size += data.length;
      if (buffered >= PART) await flush();
    },
    close: async () => {
      await flush();
      record.parts = n;
      await dbPut('library', record);
    },
    abort: async () => {
      for (let i = 0; i < n; i++) await dbDelete('chunks', [id, i]);
    },
    setHash: (hash) => (record.hash = hash),
    file: () => libraryFile(id),
  };
}

/** Stores a File or Blob the person picked locally. */
export async function addToLibrary(blob, meta) {
  const sink = await librarySink({ name: meta.name, path: meta.path || meta.name, type: blob.type, mtime: blob.lastModified, from: meta.from });
  try {
    for (let o = 0; o < blob.size; o += PART) await sink.write(new Uint8Array(await blob.slice(o, o + PART).arrayBuffer()));
    await sink.close();
  } catch (err) {
    await sink.abort();
    throw err;
  }
  return sink.id;
}

export async function listLibrary() {
  const items = await dbAll('library');
  return items.sort((a, b) => b.added - a.added);
}

/** The stored data as a File, read lazily from disk. */
export async function libraryFile(id) {
  const rec = await dbGet('library', id);
  if (!rec) throw new Error('This file is no longer in the library.');
  if (rec.backend === 'opfs') {
    const dir = await libraryDir();
    const file = await (await dir.getFileHandle(id)).getFile();
    return new File([file], rec.name, { type: rec.type, lastModified: rec.mtime });
  }
  const parts = [];
  for (let i = 0; i < (rec.parts ?? 0); i++) parts.push((await dbGet('chunks', [id, i])).blob);
  return new File(parts, rec.name, { type: rec.type, lastModified: rec.mtime });
}

export async function removeFromLibrary(id) {
  const rec = await dbGet('library', id);
  if (!rec) return;
  if (rec.backend === 'opfs') {
    const dir = await libraryDir();
    try {
      await dir?.removeEntry(id);
    } catch {}
  } else {
    for (let i = 0; i < (rec.parts ?? 0); i++) await dbDelete('chunks', [id, i]);
  }
  await dbDelete('library', id);
}

export async function libraryRecord(id) {
  return dbGet('library', id);
}

export async function storageEstimate() {
  try {
    const est = await navigator.storage.estimate();
    const persisted = (await navigator.storage.persisted?.()) ?? false;
    return { usage: est.usage ?? 0, quota: est.quota ?? 0, persisted };
  } catch {
    return null;
  }
}

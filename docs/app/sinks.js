// Where received bytes go. Every sink has write(bytes), close() and abort(reason), and each one
// streams: data is written as it arrives and only small files are ever held in memory.
//   fsa       File System Access: a file or folder you picked, written in place
//   download  a streamed download through the service worker (one file, or a folder as .zip)
//   memory    a Blob in memory, only for small files when nothing else is available
//   library   the local library (see library.js)

import { randomId } from './lib/bytes.js';
import { ZipWriter, zipSize } from './lib/zip.js';
import { splitExt } from './lib/paths.js';

export const MEMORY_LIMIT = 64 * 1024 * 1024;

export const canSaveFile = () => typeof globalThis.showSaveFilePicker === 'function';
export const canPickFolder = () => typeof globalThis.showDirectoryPicker === 'function';

// ---- File System Access ----

export async function fsaFileSink(handle) {
  const writable = await handle.createWritable();
  return {
    kind: 'fsa',
    write: (data) => writable.write(data),
    close: () => writable.close(),
    abort: async () => {
      try {
        await writable.abort();
      } catch {}
    },
    file: () => handle.getFile(),
  };
}

async function exists(dir, name) {
  try {
    await dir.getFileHandle(name);
    return true;
  } catch {
    return false;
  }
}

/** Opens (or creates) the folder for a relative path inside a picked directory. */
export async function dirFor(root, segments) {
  let dir = root;
  for (const seg of segments) dir = await dir.getDirectoryHandle(seg, { create: true });
  return dir;
}

/** Returns sinkFor(file) writing each file at its relative path. Existing files are kept unless overwrite. */
export function folderSinks(root, { overwrite = false } = {}) {
  return async (f) => {
    const parts = f.path.split('/');
    const dir = await dirFor(root, parts.slice(0, -1));
    let name = parts[parts.length - 1];
    if (!overwrite && (await exists(dir, name))) {
      const { base, ext } = splitExt(name);
      let i = 1;
      while (await exists(dir, `${base} (${i})${ext}`)) i++;
      name = `${base} (${i})${ext}`;
    }
    const sink = await fsaFileSink(await dir.getFileHandle(name, { create: true }));
    sink.savedAs = [...parts.slice(0, -1), name].join('/');
    return sink;
  };
}

// ---- service worker downloads ----

let keepAlive = null;
let openDownloads = 0;

async function worker() {
  if (!('serviceWorker' in navigator)) throw new Error('no-sw');
  const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((_, rej) => setTimeout(() => rej(new Error('no-sw')), 4000))]);
  if (!reg.active) throw new Error('no-sw');
  return reg;
}

export async function canStreamDownloads() {
  try {
    await worker();
    return true;
  } catch {
    return false;
  }
}

/** A download that streams through the service worker as bytes arrive. */
export async function downloadStream(name, size) {
  const reg = await worker();
  const id = randomId(12);
  const channel = new MessageChannel();
  const port = channel.port1;
  let limit = 0; // chunks the worker has room for, counted from the start
  let sent = 0;
  let waiting = null;
  let canceled = false;
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('The service worker did not answer.')), 5000);
    port.onmessage = ({ data }) => {
      if (data.type === 'ready') {
        clearTimeout(timer);
        resolve();
      } else if (data.type === 'pull') {
        limit = Math.max(limit, data.enqueued + Math.max(1, data.desired));
        waiting?.();
      } else if (data.type === 'cancel') {
        canceled = true;
        waiting?.();
      }
    };
  });
  reg.active.postMessage({ type: 'ff-download', id, name, size }, [channel.port2]);
  await ready;

  const frame = document.createElement('iframe');
  frame.hidden = true;
  frame.title = 'download';
  frame.src = `dl/${id}/${encodeURIComponent(name)}`;
  document.body.append(frame);
  openDownloads++;
  keepAlive ??= setInterval(() => reg.active?.postMessage({ type: 'ff-ping' }), 10000);
  const finish = () => {
    openDownloads--;
    if (!openDownloads) {
      clearInterval(keepAlive);
      keepAlive = null;
    }
    setTimeout(() => frame.remove(), 30000);
  };

  return {
    kind: 'download',
    async write(data) {
      while (sent >= limit && !canceled) await new Promise((r) => (waiting = r));
      waiting = null;
      if (canceled) throw new Error('The download was canceled in the browser.');
      sent++;
      const copy = data.slice();
      port.postMessage({ type: 'chunk', buffer: copy.buffer }, [copy.buffer]);
    },
    async close() {
      port.postMessage({ type: 'end' });
      finish();
    },
    async abort() {
      port.postMessage({ type: 'abort' });
      finish();
    },
  };
}

/**
 * Several files streamed into one .zip download. Returns { sinkFor, finish } where finish()
 * writes the zip directory once the transfer is over.
 */
export async function zipDownload(name, files) {
  const total = zipSize(files.map((f) => ({ path: f.path, size: f.size })));
  const stream = await downloadStream(name, total);
  const zip = new ZipWriter((bytes) => stream.write(bytes));
  let queue = Promise.resolve();
  const run = (fn) => (queue = queue.then(fn));
  let finished = false;
  return {
    sinkFor: async (f) => {
      await run(() => zip.begin(f.path, f.size, f.mtime));
      return {
        kind: 'zip',
        write: (data) => run(() => zip.write(data)),
        close: () => run(() => zip.end()),
        abort: () =>
          run(async () => {
            // Bytes already in the archive cannot be taken back; close the entry so the zip stays valid.
            if (zip.current) {
              const pad = f.size - zip.current.written;
              for (let left = pad; left > 0; left -= 65536) await zip.write(new Uint8Array(Math.min(65536, left)));
              await zip.end();
            }
          }),
      };
    },
    finish: async (ok = true) => {
      if (finished) return;
      finished = true;
      await run(async () => {
        if (!ok && zip.entries.length === 0) return stream.abort();
        if (zip.current) await zip.end();
        await zip.finish();
        await stream.close();
      });
    },
  };
}

// ---- memory ----

export function memorySink(type) {
  const parts = [];
  let size = 0;
  const sink = {
    kind: 'memory',
    blob: null,
    async write(data) {
      size += data.length;
      if (size > MEMORY_LIMIT) throw new Error('This browser cannot stream to disk, and the file is too big to hold in memory. Use Chrome, Edge or Firefox on a computer, or keep it in the library.');
      parts.push(data.slice());
    },
    async close() {
      sink.blob = new Blob(parts, { type: type || 'application/octet-stream' });
      parts.length = 0;
    },
    async abort() {
      parts.length = 0;
    },
    file: async () => sink.blob,
  };
  return sink;
}

/** Saves a Blob or File the classic way, with a temporary link. */
export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/** Saves a File: with a save dialog when available, streamed, so big files never fill memory. */
export async function saveFile(file, name) {
  if (canSaveFile()) {
    let handle;
    try {
      handle = await showSaveFilePicker({ suggestedName: name });
    } catch (err) {
      if (err?.name === 'AbortError') return false;
      throw err;
    }
    const writable = await handle.createWritable();
    await file.stream().pipeTo(writable);
    return true;
  }
  if (file.size > 32 * 1024 * 1024 && (await canStreamDownloads())) {
    const sink = await downloadStream(name, file.size);
    const reader = file.stream().getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      await sink.write(value);
    }
    await sink.close();
    return true;
  }
  saveBlob(file, name);
  return true;
}

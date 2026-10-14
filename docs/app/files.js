// Collects files with their relative paths from a file input, a folder input, drag and drop
// (folders included) or a directory handle. Only File objects are kept: data is read later in
// chunks while it is sent.

const IGNORED = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini', '.localized']);
export const ignoredName = (name) => IGNORED.has(name) || name.endsWith('.crswap') || name.startsWith('._');

/** Files from an <input type=file>, with webkitRelativePath kept for folders. */
export function filesFromInput(input) {
  return [...(input.files ?? [])]
    .filter((f) => !ignoredName(f.name))
    .map((f) => ({ blob: f, path: f.webkitRelativePath || f.name, mtime: f.lastModified }));
}

function readEntries(reader) {
  return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
}

function entryFile(entry) {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

async function walkEntry(entry, prefix, out) {
  if (entry.isFile) {
    if (ignoredName(entry.name)) return;
    const file = await entryFile(entry);
    out.push({ blob: file, path: prefix + entry.name, mtime: file.lastModified });
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    for (;;) {
      const batch = await readEntries(reader);
      if (!batch.length) break;
      for (const child of batch) await walkEntry(child, `${prefix}${entry.name}/`, out);
    }
  }
}

/** Files and folders dropped on the page. Must be called synchronously inside the drop event. */
export function filesFromDrop(dataTransfer) {
  const entries = [];
  const loose = [];
  for (const item of dataTransfer.items ?? []) {
    if (item.kind !== 'file') continue;
    const entry = item.webkitGetAsEntry?.();
    if (entry) entries.push(entry);
    else {
      const f = item.getAsFile();
      if (f) loose.push(f);
    }
  }
  if (!entries.length && !loose.length) for (const f of dataTransfer.files ?? []) loose.push(f);
  return (async () => {
    const out = loose.map((f) => ({ blob: f, path: f.name, mtime: f.lastModified }));
    for (const entry of entries) await walkEntry(entry, '', out);
    return out;
  })();
}

/** Every file under a directory handle as { handle, path, size, mtime, file }. */
export async function walkDirectory(dir, prefix = '', out = [], onProgress) {
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === 'file') {
      if (ignoredName(name)) continue;
      const file = await handle.getFile();
      out.push({ handle, path: prefix + name, size: file.size, mtime: file.lastModified, file });
      onProgress?.(out.length);
    } else if (handle.kind === 'directory') {
      await walkDirectory(handle, `${prefix}${name}/`, out, onProgress);
    }
  }
  return out;
}

/** A label for a batch: the folder name, the file name, or "N files". */
export function batchLabel(files, many) {
  if (files.length === 1) return files[0].path.split('/').pop();
  const roots = new Set(files.map((f) => f.path.split('/')[0]));
  if (roots.size === 1 && files[0].path.includes('/')) return [...roots][0];
  return many(files.length);
}

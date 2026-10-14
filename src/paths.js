// File paths that arrive from the other device are treated as untrusted. They are reduced to
// safe relative segments before anything is written, so a peer cannot climb out of the folder
// you picked, write device names Windows refuses, or hide control characters in a name.

const RESERVED = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;

export function sanitizeSegment(segment) {
  let s = String(segment)
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, '')
    .replace(/[. ]+$/, '')
    .trim();
  if (s === '' || s === '.' || s === '..') return '';
  if (RESERVED.test(s)) s = `_${s}`;
  if (s.length > 200) {
    const { base, ext } = splitExt(s);
    s = base.slice(0, 200 - ext.length) + ext;
  }
  return s;
}

/** Safe relative path segments, never empty, never escaping the target folder. */
export function sanitizePath(path) {
  const parts = String(path)
    .split(/[/\\]+/)
    .filter((p) => p !== '' && p !== '.' && p !== '..')
    .map(sanitizeSegment)
    .filter(Boolean)
    .slice(-32);
  return parts.length ? parts : ['file'];
}

export const joinPath = (segments) => segments.join('/');
export const safePath = (path) => joinPath(sanitizePath(path));

export function splitExt(name) {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1 || name.length - dot > 12) return { base: name, ext: '' };
  return { base: name.slice(0, dot), ext: name.slice(dot) };
}

/** "photo.jpg" becomes "photo (1).jpg", "photo (2).jpg" and so on until `taken` says no. */
export function uniqueName(name, taken) {
  if (!taken(name)) return name;
  const { base, ext } = splitExt(name);
  for (let i = 1; i < 10000; i++) {
    const next = `${base} (${i})${ext}`;
    if (!taken(next)) return next;
  }
  return `${base} (${Date.now()})${ext}`;
}

/** The name a conflicting copy gets: "notes (conflict 2026-10-14 laptop).txt". */
export function conflictPath(path, label) {
  const segments = path.split('/');
  const name = segments.pop();
  const { base, ext } = splitExt(name);
  const clean = sanitizeSegment(label).slice(0, 60);
  segments.push(`${base} (conflict ${clean})${ext}`);
  return segments.join('/');
}

/** The top folder shared by every path, or '' when they do not share one. */
export function commonRoot(paths) {
  if (!paths.length) return '';
  const first = paths[0].split('/');
  if (first.length < 2) return '';
  const root = first[0];
  return paths.every((p) => p.startsWith(`${root}/`)) ? root : '';
}

// The service worker precaches every file of the app, so the app starts offline.
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const app = fileURLToPath(new URL('../docs/app/', import.meta.url));

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
}

describe('app precache', () => {
  const sw = readFileSync(join(app, 'sw.js'), 'utf8');
  const list = JSON.parse(/const PRECACHE = (\[[\s\S]*?\]);/.exec(sw)[1].replace(/'/g, '"'));

  it('lists every app file except the worker itself', () => {
    const files = walk(app)
      .map((f) => relative(app, f).split(sep).join('/'))
      .filter((f) => f !== 'sw.js');
    expect(files.filter((f) => !list.includes(f))).toEqual([]);
    expect(list).toContain('library.js');
    expect(list).toContain('lib/zip.js');
  });

  it('lists the shared special dates script and only files that exist', () => {
    expect(list).toContain('../assets/site/seasons.js');
    const missing = list.filter((f) => f !== './').filter((f) => {
      try {
        readFileSync(join(app, f));
        return false;
      } catch {
        return true;
      }
    });
    expect(missing).toEqual([]);
  });
});

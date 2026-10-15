// Copies the shared modules in src/ into docs/app/lib/ so GitHub Pages can serve them,
// and refreshes the precache list and cache version inside docs/app/sw.js.
// Usage: node scripts/build-app.mjs [--check]
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'src');
const app = join(root, 'docs', 'app');
const lib = join(app, 'lib');
const check = process.argv.includes('--check');
const header = (name) => `// Generated from src/${name} by scripts/build-app.mjs. Edit the source, not this copy.\n`;

const outputs = new Map();
for (const name of readdirSync(src).filter((f) => f.endsWith('.js')).sort()) {
  outputs.set(join(lib, name), header(name) + readFileSync(join(src, name), 'utf8'));
}

// Precache list for the service worker: every app file except the worker itself.
function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const swPath = join(app, 'sw.js');
if (existsSync(swPath)) {
  const files = new Map();
  for (const file of walk(app)) {
    // lib/ is added from the outputs below. The separator matters: library.js starts with "lib" too.
    if (file === swPath || file.startsWith(lib + sep)) continue;
    files.set(file, readFileSync(file));
  }
  for (const [file, text] of outputs) files.set(file, Buffer.from(text));
  // Site files the app uses too: the special dates script and Finn in costume, so the start
  // screen looks the same offline. Their content is in the hash, so a change refreshes the cache.
  const assets = join(root, 'docs', 'assets');
  const shared = [join(assets, 'site', 'seasons.js')];
  for (const dir of existsSync(join(assets, 'seasons')) ? readdirSync(join(assets, 'seasons')).sort() : []) {
    for (const name of ['finn.svg', 'finn-dark.svg']) shared.push(join(assets, 'seasons', dir, name));
  }
  for (const file of shared) if (existsSync(file)) files.set(file, readFileSync(file));
  const list = [...files.keys()].map((f) => relative(app, f).split(sep).join('/')).sort();
  const hash = createHash('sha256');
  for (const name of list) hash.update(name).update(files.get(join(app, name)) ?? '');
  const version = hash.digest('hex').slice(0, 12);
  const block = `// precache:start\nconst CACHE_VERSION = '${version}';\nconst PRECACHE = ${JSON.stringify(['./', ...list], null, 2).replace(/"/g, "'")};\n// precache:end`;
  const sw = readFileSync(swPath, 'utf8').replace(/\/\/ precache:start[\s\S]*?\/\/ precache:end/, block);
  outputs.set(swPath, sw);
}

let stale = 0;
for (const [file, text] of outputs) {
  const current = existsSync(file) ? readFileSync(file, 'utf8') : null;
  if (current === text) continue;
  if (check) {
    console.error(`Out of date: ${relative(root, file)}`);
    stale++;
  } else {
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, text);
  }
}
if (check && stale) {
  console.error('Run npm run build:app and commit the result.');
  process.exit(1);
}
console.log(check ? 'App build is up to date.' : `App build written (${outputs.size} files checked).`);

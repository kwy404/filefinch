// Browser check of the filefinch site: serves docs/ on a local port, opens
// every page in a headless Edge or Chrome, fails on console errors or broken
// internal links, and saves screenshots of the key pages at several sizes in
// light and dark to tmp/qa/.
// Usage: node test/site-qa.mjs [--shots] [--only=path]
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const docs = join(root, 'docs');
const shots = process.argv.includes('--shots');
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
const BASE = '/filefinch/';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain' };

function resolveFile(urlPath) {
  if (!urlPath.startsWith(BASE)) return null;
  let p = decodeURIComponent(urlPath.slice(BASE.length).split('?')[0].split('#')[0]);
  p = normalize(p).replace(/^(\.\.[/\\])+/, '');
  let f = join(docs, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  return existsSync(f) ? f : null;
}

const server = createServer((req, res) => {
  const f = resolveFile(req.url);
  if (!f) {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(readFileSync(join(docs, '404.html')));
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const exe = [process.env.FILEFINCH_BROWSER, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((c) => existsSync(c));
const browser = await chromium.launch({ executablePath: exe, headless: true });

const sitemap = readFileSync(join(docs, 'sitemap.xml'), 'utf8');
const pages = [...sitemap.matchAll(/<loc>https:\/\/kwy404\.github\.io\/filefinch\/([^<]*)<\/loc>/g)].map((m) => m[1]).filter((p) => !p.startsWith('app/'));
pages.push('404.html');
const queue = only ? [only] : pages;

const problems = [];
const checked = new Map();
async function checkUrl(url, from) {
  if (checked.has(url)) return;
  const path = new URL(url).pathname;
  const ok = !!resolveFile(path);
  checked.set(url, ok);
  if (!ok) problems.push(`broken link ${path} on ${from}`);
}

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
for (const p of queue) {
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => {
    if (r.url().startsWith(origin)) errors.push(`request failed ${r.url()}`);
  });
  const res = await page.goto(`${origin}${BASE}${p}`, { waitUntil: 'networkidle' });
  if (p !== '404.html' && res.status() !== 200) problems.push(`${p}: status ${res.status()}`);
  await page.waitForTimeout(400);
  const links = await page.$$eval('a[href], img[src], link[href], script[src]', (els) => els.map((e) => e.href || e.src).filter(Boolean));
  for (const l of links) if (l.startsWith(origin)) await checkUrl(l.split('#')[0], p);
  const hashes = await page.$$eval('a[href^="#"]', (els) => els.map((e) => e.getAttribute('href')).filter((h) => h.length > 1));
  for (const h of hashes) if (!(await page.$(`[id="${h.slice(1)}"]`))) problems.push(`${p}: missing anchor ${h}`);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (wide) problems.push(`${p}: horizontal scroll at 1440`);
  for (const e of errors) problems.push(`${p}: console ${e}`);
  await page.close();
}

if (shots) {
  const out = join(root, 'tmp', 'qa');
  mkdirSync(out, { recursive: true });
  const sizes = [[320, 720], [375, 812], [768, 1024], [1440, 900], [1860, 930], [2560, 1300]];
  const targets = only ? [only] : ['', 'guides/', 'guides/send-large-files-without-limits/', 'pt/guias/', '404.html'];
  for (const scheme of ['light', 'dark']) {
    for (const [w, h] of sizes) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, deviceScaleFactor: 1 });
      for (const t of targets) {
        const page = await ctx.newPage();
        await page.goto(`${origin}${BASE}${t}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(600);
        const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        if (wide) problems.push(`${t || 'home'}: horizontal scroll at ${w}px ${scheme}`);
        const name = `${(t || 'home').replace(/[/.]+/g, '-').replace(/-$/, '')}-${w}-${scheme}.png`;
        await page.screenshot({ path: join(out, name), fullPage: !process.argv.includes('--fold') });
        await page.close();
      }
      await ctx.close();
    }
  }
}

await browser.close();
server.close();
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`site QA: ${queue.length} pages, ${checked.size} internal URLs, no console errors, no broken links`);

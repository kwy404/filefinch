// Takes the product screenshots used on the home page from the real app:
// two browser contexts (two "devices") connect with an invite link, send a
// large generated file, pause it, sync a folder and fill the library. Every
// screen is saved in light and dark to docs/assets/shots/.
// The pairing screen with six words needs internet to reach the public
// relays; if they do not answer, that screenshot is skipped.
// Usage: node scripts/site/shots.mjs
import { createReadStream, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('../..', import.meta.url));
const docs = join(root, 'docs');
const out = join(docs, 'assets', 'shots');
const work = join(tmpdir(), `filefinch-shots-${process.pid}`);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

function serve() {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!path.startsWith('/filefinch/')) {
      res.writeHead(404);
      return res.end();
    }
    let f = join(docs, normalize(path.slice('/filefinch/'.length)).replace(/^(\.\.[/\\])+/, ''));
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
    if (!existsSync(f)) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(f).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

const exe = [process.env.FILEFINCH_BROWSER, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((p) => existsSync(p));

const WINDOW = { width: 1100, height: 700 };
const PHONE = { width: 390, height: 844 };

let SCHEME = 'light';

/** Saves the page at the given size in the current color scheme. */
async function snap(page, name, size) {
  const before = page.viewportSize();
  await page.evaluate(() => document.querySelectorAll('#toasts > *').forEach((t) => t.remove()));
  await page.setViewportSize(size);
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(out, `${name}-${SCHEME}.png`) });
  await page.setViewportSize(before);
  console.log(`shot ${name} ${SCHEME}`);
}

const stubPickers = () => {
  window.showDirectoryPicker = async () => {
    const r = await navigator.storage.getDirectory();
    return r.getDirectoryHandle(window.shotPickDir || 'shots-received', { create: true });
  };
};

const seedFolder = async ({ dir, files }) => {
  const r = await (await navigator.storage.getDirectory()).getDirectoryHandle(dir, { create: true });
  for (const [path, text] of Object.entries(files)) {
    const parts = path.split('/');
    let d = r;
    for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p, { create: true });
    const w = await (await d.getFileHandle(parts.at(-1), { create: true })).createWritable();
    await w.write(text);
    await w.close();
  }
};

async function connect(pageA, pageB, ctxA) {
  await pageA.click('[data-go="connect"]');
  if (await pageA.locator('#mode-link').isVisible()) await pageA.click('#mode-link');
  await pageA.click('#host-btn');
  await pageA.locator('#connect-invite').waitFor({ state: 'visible', timeout: 30000 });
  await pageB.goto(await pageA.inputValue('#invite-link'));
  await pageB.locator('#connect-reply').waitFor({ state: 'visible', timeout: 30000 });
  const helper = await ctxA.newPage();
  await helper.goto(await pageB.inputValue('#reply-link'));
  await helper.waitForTimeout(800);
  await helper.close();
  await pageA.locator('#connect-status').waitFor({ state: 'visible', timeout: 40000 });
  await pageB.locator('#connect-status').waitFor({ state: 'visible', timeout: 40000 });
}

async function main(scheme) {
  SCHEME = scheme;
  if (!exe) throw new Error('No Chrome or Edge found; set FILEFINCH_BROWSER');
  mkdirSync(out, { recursive: true });
  mkdirSync(work, { recursive: true });
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}/filefinch/app/`;
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const opts = { acceptDownloads: true, locale: 'en-US', viewport: WINDOW, deviceScaleFactor: 2, reducedMotion: 'reduce', colorScheme: scheme };
  const ctxA = await browser.newContext(opts);
  const ctxB = await browser.newContext(opts);
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();
  for (const p of [pageA, pageB]) await p.addInitScript(stubPickers);
  await pageA.goto(base);
  await pageB.goto(base);
  await pageA.evaluate(() => navigator.serviceWorker.ready);
  await pageB.evaluate(() => navigator.serviceWorker.ready);
  await pageA.evaluate(() => {
    window.filefinch.settings.name = 'Studio laptop';
    window.filefinch.saveSettings?.();
  });
  await pageB.evaluate(() => {
    window.filefinch.settings.name = 'Phone';
  });

  try {
    // 1. The pairing screen (QR code and six words), then the confirmation words on the phone.
    let paired = false;
    try {
      await pageA.click('#code-btn');
      await pageA.waitForFunction(() => document.querySelectorAll('#code-words li').length === 6, null, { timeout: 45000 });
      await pageA.waitForTimeout(900);
      await snap(pageA, 'connect', WINDOW);
      const link = await pageA.getAttribute('#code-qr', 'data-link');
      await pageB.setViewportSize(PHONE);
      await pageB.goto(link);
      await pageB.locator('#connect-confirm-show').waitFor({ state: 'visible', timeout: 60000 });
      await pageA.locator('#connect-confirm-type').waitFor({ state: 'visible', timeout: 30000 });
      await pageB.waitForTimeout(900);
      await snap(pageB, 'confirm', PHONE);
      await pageB.setViewportSize(WINDOW);
      const confirm = await pageB.$eval('#confirm-words', (el) => (el.dataset.words || '').split(' ').filter(Boolean));
      for (let i = 0; i < 6; i++) await pageA.fill(`#confirm-word-${i}`, confirm[i]);
      await pageA.click('#confirm-btn');
      await pageA.locator('#connect-status').waitFor({ state: 'visible', timeout: 20000 });
      await pageB.locator('#connect-status').waitFor({ state: 'visible', timeout: 20000 });
      paired = true;
    } catch (err) {
      console.warn(`six word pairing skipped: ${err.message.split(String.fromCharCode(10))[0]}`);
      await pageA.goto(base);
      await pageB.goto(base);
    }

    // 2. Without the relays, connect with an invite link instead.
    if (!paired) await connect(pageA, pageB, ctxA);

    // 3. A big file in flight, then paused for the resume shot.
    const big = join(work, 'Holiday-4K.mov');
    writeFileSync(big, randomBytes(64 * 1024 * 1024));
    const bigger = join(work, 'Holiday-4K-full.mov');
    const parts = [];
    for (let i = 0; i < 10; i++) parts.push(big);
    // 640 MB without holding it all in memory: reuse the same random block.
    const ws = (await import('node:fs')).createWriteStream(bigger);
    for (const p of parts) {
      await new Promise((r, j) => createReadStream(p).on('end', r).on('error', j).pipe(ws, { end: false }));
    }
    await new Promise((r) => ws.end(r));
    await pageA.click('[data-go="send"]');
    await pageA.setInputFiles('#pick-files', bigger);
    await pageB.locator('#offer-dialog').waitFor({ state: 'visible', timeout: 30000 });
    await pageB.check('#offer-dests input[value="download"]');
    await pageB.click('#offer-accept');
    await pageA.waitForFunction(() => {
      const tr = [...window.filefinch.engine.outgoing.values()][0];
      return tr && tr.files[0].sent > tr.files[0].size * 0.38;
    }, null, { polling: 30, timeout: 120000 });
    await pageA.evaluate(() => {
      const tr = [...window.filefinch.engine.outgoing.values()][0];
      window.filefinch.engine.pause(tr.id);
    });
    await pageA.waitForTimeout(500);
    await snap(pageA, 'resume', PHONE);
    await pageA.evaluate(() => {
      const tr = [...window.filefinch.engine.outgoing.values()][0];
      window.filefinch.engine.resume(tr.id);
    });
    await pageB.click('[data-go="received"]');
    await pageB.waitForFunction(() => {
      const tr = [...window.filefinch.engine.incoming.values()][0];
      return tr && tr.files[0].written > tr.files[0].size * 0.55;
    }, null, { polling: 30, timeout: 120000 });
    await pageB.screenshot({ path: join(work, 'tmp.png') });
    await snap(pageB, 'transfer', WINDOW);
    await pageB.waitForFunction(() => [...window.filefinch.engine.incoming.values()][0].state === 'done', null, { timeout: 300000 });

    // 4. The sync plan, reviewed before anything is written.
    await pageA.evaluate(seedFolder, { dir: 'sync-a', files: { 'Report.docx': 'a'.repeat(4000), 'photos/beach.jpg': 'b'.repeat(90000), 'photos/sunset.jpg': 'c'.repeat(70000), 'notes.md': 'notes from the laptop', 'budget.xlsx': 'd'.repeat(12000) } });
    await pageB.evaluate(seedFolder, { dir: 'sync-b', files: { 'notes.md': 'notes from the phone', 'scan.pdf': 'e'.repeat(30000), 'photos/beach.jpg': 'b'.repeat(90000) } });
    await pageA.click('[data-go="sync"]');
    await pageA.evaluate(() => (window.shotPickDir = 'sync-a'));
    await pageB.evaluate(() => (window.shotPickDir = 'sync-b'));
    await pageA.click('#sync-pick');
    await pageA.locator('#sync-start:not([disabled])').waitFor();
    await pageA.click('#sync-start');
    await pageB.locator('#sync-dialog').waitFor({ state: 'visible', timeout: 30000 });
    await pageB.click('#sync-dialog-yes');
    await pageA.locator('#sync-plan').waitFor({ state: 'visible', timeout: 60000 });
    await pageA.waitForTimeout(400);
    await snap(pageA, 'sync', WINDOW);

    // 5. The library with a few kept files.
    const lib = [join(docs, 'og.png'), join(root, 'assets', 'social-preview.png'), join(docs, 'assets', 'og', 'sync-folders-between-computers-without-cloud.png'), join(docs, 'assets', 'og', 'send-a-whole-folder.png')].filter((f) => existsSync(f));
    const note = join(work, 'Packing list.txt');
    writeFileSync(note, 'Packing list\n- charger\n- passport\n- camera\n');
    await pageB.click('[data-go="library"]');
    await pageB.setInputFiles('#library-add', [...lib, note]);
    await pageB.waitForFunction((n) => document.querySelectorAll('#library-list > *').length >= n, lib.length + 1, { timeout: 30000 });
    await pageB.waitForTimeout(600);
    await snap(pageB, 'library', WINDOW);
  } finally {
    await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 5000))]);
    server.close();
    rmSync(work, { recursive: true, force: true });
  }
}

(async () => {
  for (const scheme of ['light', 'dark']) await main(scheme);
})().then(() => process.exit(0), (err) => {
  console.error(err);
  process.exit(1);
});

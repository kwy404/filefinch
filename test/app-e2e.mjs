// End to end test of the real app in a real browser: two separate browser contexts (two
// "devices") connect through the advanced no relay invite and reply flow, send a large
// generated file and a nested folder, verify SHA-256 hashes on disk, send text and links both
// ways (sealed with the passphrase too, and queued while offline), then drop the connection
// mid transfer, reconnect with a passphrase and resume from the confirmed offset.
//
// Usage: node test/app-e2e.mjs
// Env: FILEFINCH_BROWSER (path to Chrome or Edge), FILEFINCH_E2E_MB (size of the big file, default 300)

import { createHash, randomBytes } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { startServer } from '../scripts/serve.mjs';

const MB = 1024 * 1024;
const BIG_MB = Number(process.env.FILEFINCH_E2E_MB || 300);
const RESUME_MB = Math.min(96, Math.max(24, Math.round(BIG_MB / 3)));
const root = fileURLToPath(new URL('..', import.meta.url));
const work = join(root, '.e2e');

function findBrowser() {
  const candidates = [
    process.env.FILEFINCH_BROWSER,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  return candidates.find((p) => p && existsSync(p));
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

async function writeRandom(path, bytes) {
  const hash = createHash('sha256');
  const out = createWriteStream(path);
  for (let left = bytes; left > 0; ) {
    const n = Math.min(4 * MB, left);
    const chunk = randomBytes(n);
    hash.update(chunk);
    if (!out.write(chunk)) await new Promise((r) => out.once('drain', r));
    left -= n;
  }
  await new Promise((r) => out.end(r));
  return hash.digest('hex');
}

function hashFile(path) {
  return new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(path)
      .on('data', (d) => h.update(d))
      .on('end', () => resolve(h.digest('hex')))
      .on('error', reject);
  });
}

async function makeFixtures() {
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  const big = join(work, `big-${BIG_MB}mb.bin`);
  const bigHash = await writeRandom(big, BIG_MB * MB);
  const resume = join(work, `resume-${RESUME_MB}mb.bin`);
  const resumeHash = await writeRandom(resume, RESUME_MB * MB);
  const folder = join(work, 'Trip photos');
  const files = {
    'beach.jpg': randomBytes(700 * 1024),
    'notes.txt': Buffer.from('Packing list\n- charger\n- passport\n'),
    'empty.log': Buffer.alloc(0),
    'raw/IMG_0001.dng': randomBytes(3 * MB + 17),
    'raw/IMG_0002.dng': randomBytes(65536),
    'raw/deep/nested/cafe\u0301 \u00e0 noite.md': Buffer.from('# Caf\u00e9\n'),
    'videos/clip.mp4': randomBytes(5 * MB),
  };
  const hashes = {};
  for (const [rel, data] of Object.entries(files)) {
    const full = join(folder, ...rel.split('/'));
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, data);
    hashes[`Trip photos/${rel.normalize('NFC')}`] = createHash('sha256').update(data).digest('hex');
  }
  return { big, bigHash, resume, resumeHash, folder, hashes };
}

/** Points the folder picker at a folder in the private file system, so a test can "choose" one. */
const stubPickers = () => {
  window.showDirectoryPicker = async () => {
    const root = await navigator.storage.getDirectory();
    return root.getDirectoryHandle(window.e2ePickDir || 'e2e-received', { create: true });
  };
};

/** Writes files into a folder of the private file system. */
const seedFolder = async ({ dir, files }) => {
  const root = await (await navigator.storage.getDirectory()).getDirectoryHandle(dir, { create: true });
  for (const [path, text] of Object.entries(files)) {
    const parts = path.split('/');
    let d = root;
    for (const p of parts.slice(0, -1)) d = await d.getDirectoryHandle(p, { create: true });
    const w = await (await d.getFileHandle(parts.at(-1), { create: true })).createWritable();
    await w.write(text);
    await w.close();
  }
};

/** Reads every file in a private file system folder as text. */
const readFolder = async (dir) => {
  const root = await (await navigator.storage.getDirectory()).getDirectoryHandle(dir);
  const out = {};
  async function walk(d, prefix) {
    for await (const [name, h] of d.entries()) {
      if (h.kind === 'directory') await walk(h, `${prefix}${name}/`);
      else out[prefix + name] = await (await h.getFile()).text();
    }
  }
  await walk(root, '');
  return out;
};

async function runSync(pageA, pageB) {
  await pageA.click('[data-go="sync"]');
  await pageA.evaluate(() => (window.e2ePickDir = 'sync-a'));
  await pageB.evaluate(() => (window.e2ePickDir = 'sync-b'));
  await pageA.click('#sync-pick');
  await pageA.locator('#sync-start:not([disabled])').waitFor();
  await pageA.click('#sync-start');
  await pageB.locator('#sync-dialog').waitFor({ state: 'visible', timeout: 30000 });
  await pageB.click('#sync-dialog-yes');
  await pageA.locator('#sync-plan').waitFor({ state: 'visible', timeout: 60000 });
  const stats = await pageA.$$eval('#sync-plan-stats .stat', (els) => els.map((e) => Number(e.querySelector('.stat-value').textContent)));
  await pageA.click('#sync-apply');
  await pageB.locator('#sync-dialog').waitFor({ state: 'visible', timeout: 30000 });
  await pageB.click('#sync-dialog-yes');
  await pageA.waitForFunction(() => /finished|conclu/i.test(document.querySelector('#sync-status').textContent), null, { timeout: 120000 });
  await pageB.waitForFunction(() => /finished|conclu/i.test(document.querySelector('#sync-status').textContent), null, { timeout: 120000 });
  return { send: stats[0], receive: stats[1], deletes: stats[2], conflicts: stats[3], same: stats[4] };
}

/** Opens the advanced no relay mode, which sits under Options on the start screen. */
async function openNoRelay(page) {
  if (await page.locator('#connect-link').isVisible()) return;
  if (!(await page.locator('#mode-link').isVisible())) await page.click('.ff-options summary');
  await page.click('#mode-link');
  await page.locator('#connect-link').waitFor({ state: 'visible' });
}

async function connect(pageA, pageB, ctxA, { passphrase, race = false } = {}) {
  await pageA.click('[data-go="connect"]');
  if (await pageA.locator('#connect-lost').isVisible()) await pageA.click('#connect-lost [data-action="restart-connect"]');
  if (await pageA.locator('#connect-failed').isVisible()) await pageA.click('#connect-failed [data-action="restart-connect"]');
  // This test covers the advanced no relay mode; app-e2e-words.mjs covers pairing words.
  await openNoRelay(pageA);
  if (passphrase) {
    if (!(await pageA.locator('#use-pass').isVisible())) await pageA.click('.ff-options summary');
    await pageA.check('#use-pass');
    await pageA.fill('#pass-input', passphrase);
  }
  const started = Date.now();
  await pageA.click('#host-btn');
  await pageA.locator('#connect-invite').waitFor({ state: 'visible', timeout: 30000 });
  const invite = await pageA.inputValue('#invite-link');
  const qrVersion = await pageA.getAttribute('#invite-qr', 'data-version');
  // The guest opens the invite link, as if it arrived by messenger.
  await pageB.goto(invite);
  if (passphrase) {
    await pageB.locator('#pass-dialog').waitFor({ state: 'visible' });
    await pageB.fill('#pass-prompt', passphrase);
    await pageB.click('#pass-form button[type="submit"]');
  }
  await pageB.locator('#connect-reply').waitFor({ state: 'visible', timeout: 30000 });
  const reply = await pageB.inputValue('#reply-link');
  // The reply link is opened on the host device in a new tab and handed to the waiting tab.
  // The paste happens before that tab opens: a background tab may not paint, and Playwright
  // waits for paints before it types.
  if (race) await pageA.fill('#reply-input', reply);
  const helper = await ctxA.newPage();
  if (race) {
    // The same reply arrives twice at once: pasted by hand and handed over from another tab.
    await Promise.all([pageA.evaluate(() => document.querySelector('#reply-btn').click()), helper.goto(reply)]);
  } else await helper.goto(reply);
  await helper.locator('#connect-failed').waitFor({ state: 'visible' });
  const delivered = await helper.textContent('#fail-text');
  await helper.close();
  await pageA.locator('#connect-status').waitFor({ state: 'visible', timeout: 40000 });
  await pageB.locator('#connect-status').waitFor({ state: 'visible', timeout: 40000 });
  await pageA.waitForFunction(() => document.querySelector('#peer-fp').textContent.trim().length > 0, null, { timeout: 10000 });
  await pageB.waitForFunction(() => document.querySelector('#peer-fp').textContent.trim().length > 0, null, { timeout: 10000 });
  const fpA = (await pageA.textContent('#peer-fp')).trim();
  const fpB = (await pageB.textContent('#peer-fp')).trim();
  return { invite, reply, qrVersion: Number(qrVersion), delivered, fpA, fpB, ms: Date.now() - started };
}

/** Sends a text from one page and waits until it shows on the other and is marked delivered. */
async function sendText(from, to, text, { connected = true } = {}) {
  await from.click('[data-go="send"]');
  await from.fill('#clip-input', text);
  await from.press('#clip-input', 'Control+Enter');
  const waiting = await from.$eval('#clips-out li', (li) => li.dataset.state);
  if (!connected) return waiting;
  await to.waitForFunction((t) => [...document.querySelectorAll('#clips-in .ff-clip-text')].some((e) => e.textContent === t), text, { timeout: 30000 });
  await from.waitForFunction(() => document.querySelector('#clips-out li')?.dataset.state === 'delivered', null, { timeout: 30000 });
  return 'delivered';
}

async function acceptOffer(page, dest) {
  await page.locator('#offer-dialog').waitFor({ state: 'visible', timeout: 30000 });
  await page.check(`#offer-dests input[value="${dest}"]`);
  await page.click('#offer-accept');
}

async function waitTransfer(page, dir, label, timeout) {
  return page.waitForFunction(
    ({ dir, label }) => {
      const map = dir === 'in' ? window.filefinch.engine.incoming : window.filefinch.engine.outgoing;
      const tr = [...map.values()].find((x) => x.label === label);
      return tr && ['done', 'failed', 'canceled'].includes(tr.state) ? { state: tr.state, files: tr.files.map((f) => ({ path: f.path, state: f.state, hash: f.hash, verified: !!f.verified, error: f.error })) } : null;
    },
    { dir, label },
    { timeout, polling: 250 },
  ).then((h) => h.jsonValue());
}

async function main() {
  const exe = findBrowser();
  if (!exe) {
    console.log('No Chrome or Edge found; set FILEFINCH_BROWSER.');
    process.exit(1);
  }
  console.log(`Browser: ${exe}`);
  const fx = await makeFixtures();
  const server = await startServer(0);
  const base = `http://localhost:${server.address().port}/filefinch/app/`;
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const opts = { acceptDownloads: true, locale: 'en-US', viewport: { width: 1280, height: 860 } };
  const ctxA = await browser.newContext(opts);
  const ctxB = await browser.newContext(opts);
  const errors = [];
  const watch = (page, who) => {
    page.on('pageerror', (e) => errors.push(`${who} pageerror: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${who} console: ${m.text()}`));
  };
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();
  watch(pageA, 'A');
  watch(pageB, 'B');
  await pageA.addInitScript(stubPickers);
  await pageB.addInitScript(stubPickers);
  await pageA.goto(base);
  await pageB.goto(base);
  // Wait for the service workers so downloads can stream.
  await pageA.evaluate(() => navigator.serviceWorker.ready);
  await pageB.evaluate(() => navigator.serviceWorker.ready);

  try {
    // 0. A connection that cannot work says why in plain words and offers the relay setting.
    await pageA.evaluate(() => (window.filefinch.settings.relayOnly = true));
    await openNoRelay(pageA);
    await pageA.click('#host-btn');
    await pageA.locator('#connect-invite').waitFor({ state: 'visible', timeout: 30000 });
    await pageB.goto(await pageA.inputValue('#invite-link'));
    await pageB.locator('#connect-reply').waitFor({ state: 'visible', timeout: 30000 });
    await pageA.fill('#reply-input', await pageB.inputValue('#reply-link'));
    await pageA.click('#reply-btn');
    await pageA.locator('#connect-failed').waitFor({ state: 'visible', timeout: 60000 });
    const failText = await pageA.textContent('#fail-text');
    const turnButton = await pageA.locator('#connect-failed [data-action="open-ice"]').isVisible();
    check('an impossible connection is explained', /Relay only is on/.test(failText) && turnButton, failText.trim().slice(0, 80));
    await pageA.evaluate(() => (window.filefinch.settings.relayOnly = false));

    // 1. Connect through the invite flow.
    const c = await connect(pageA, pageB, ctxA, { race: true });
    check('invite and reply connect two browser contexts, even with the reply applied twice at once', true, `${c.ms} ms, invite QR version ${c.qrVersion}`);
    check('reply link opened in another tab reaches the waiting tab', /delivered/i.test(c.delivered), c.delivered.trim());
    check('both sides show the same fingerprint', c.fpA === c.fpB && /^\d{4} \d{4} \d{4}$/.test(c.fpA), `${c.fpA} / ${c.fpB}`);
    check('invite link is short', c.invite.length < 700, `${c.invite.length} characters`);

    // Text and links, like a shared clipboard: a link arrives ready to open, a note ready to copy.
    const link = 'https://example.com/trip?day=2#map';
    await sendText(pageA, pageB, link);
    const linkCard = await pageB.$eval('#clips-in .ff-clip', (card) => ({ href: card.querySelector('a.ff-clip-text')?.getAttribute('href'), rel: card.querySelector('a.ff-clip-text')?.rel, open: !!card.querySelector('a.btn') }));
    check('a link sent as text arrives as a safe link with Copy and Open', linkCard.href === link && /noopener/.test(linkCard.rel) && linkCard.open, JSON.stringify(linkCard));
    const note = 'Gate 14\nSeat 22A\ncaf\u00e9 at 9';
    await sendText(pageB, pageA, note);
    check('a multi line note goes the other way and is marked delivered', true);
    const unsafe = await pageA.evaluate(() => window.filefinch.app.send({ t: 'clip', id: 'evil1', text: 'javascript:alert(1)' }));
    await pageB.waitForFunction(() => document.querySelector('#clips-in .ff-clip[data-id="evil1"]'), null, { timeout: 10000 });
    const unsafeLink = await pageB.$eval('#clips-in .ff-clip[data-id="evil1"]', (card) => !!card.querySelector('a'));
    check('a javascript: text never becomes a link', unsafe && !unsafeLink);

    // The ceiling: raw 64 KB messages on the same data channel with no app logic, for comparison.
    const RAW_MB = 16;
    const rawDone = pageB.evaluate(
      (mb) =>
        new Promise((resolve) => {
          const dc = window.filefinch.connection().dc;
          let got = 0;
          let t0 = 0;
          dc.addEventListener('message', (m) => {
            if (typeof m.data === 'string') return;
            t0 ||= performance.now();
            got += m.data.byteLength;
            if (got >= mb * 1048576) resolve(mb / ((performance.now() - t0) / 1000));
          });
        }),
      RAW_MB,
    );
    await pageA.evaluate(async (mb) => {
      const dc = window.filefinch.connection().dc;
      const frame = new Uint8Array(65536 + 13);
      frame[0] = 1;
      frame.fill(255, 1, 5); // a file key nobody uses, so the engine ignores these frames
      for (let sent = 0; sent < mb * 1048576; sent += 65536) {
        if (dc.bufferedAmount > 4 << 20) await new Promise((r) => dc.addEventListener('bufferedamountlow', r, { once: true }));
        dc.send(frame);
      }
    }, RAW_MB);
    const rawSpeed = await rawDone;
    check('raw data channel ceiling measured', rawSpeed > 0, `${rawSpeed.toFixed(1)} MB/s`);

    // 2. A large generated file, streamed to the Downloads folder through the service worker.
    const bigName = fx.big.split(/[\\/]/).pop();
    const downloadPromise = pageB.waitForEvent('download', { timeout: 60000 });
    const t0 = Date.now();
    await pageA.click('[data-go="send"]');
    await pageA.setInputFiles('#pick-files', fx.big);
    await acceptOffer(pageB, 'download');
    const download = await downloadPromise;
    const recv = await waitTransfer(pageB, 'in', bigName, 15 * 60000);
    const seconds = (Date.now() - t0) / 1000;
    const sent = await waitTransfer(pageA, 'out', bigName, 60000);
    const savedPath = await download.path();
    const diskHash = await hashFile(savedPath);
    const speedMBs = BIG_MB / seconds;
    check(`${BIG_MB} MB file transferred`, recv.state === 'done' && sent.state === 'done', `${seconds.toFixed(1)} s, ${speedMBs.toFixed(1)} MB/s`);
    check('receiver verified the SHA-256 against the sender', recv.files[0].verified && recv.files[0].hash === fx.bigHash);
    check('file on disk matches the original byte for byte', diskHash === fx.bigHash, diskHash.slice(0, 16));
    check('download kept its file name', download.suggestedFilename() === bigName, download.suggestedFilename());

    // 3. A nested folder, written into a picked folder with the File System Access API.
    await pageA.setInputFiles('#pick-folder', fx.folder);
    await acceptOffer(pageB, 'folder');
    const folderRecv = await waitTransfer(pageB, 'in', 'Trip photos', 120000);
    check('folder transferred with every file verified', folderRecv.state === 'done' && folderRecv.files.every((f) => f.verified), `${folderRecv.files.length} files`);
    const onDisk = await pageB.evaluate(async () => {
      const { Sha256 } = await import('./lib/sha256.js');
      const root = await (await navigator.storage.getDirectory()).getDirectoryHandle('e2e-received');
      const out = {};
      async function walk(dir, prefix) {
        for await (const [name, h] of dir.entries()) {
          if (h.kind === 'directory') await walk(h, `${prefix}${name}/`);
          else {
            const file = await h.getFile();
            out[`${prefix}${name}`] = new Sha256().update(new Uint8Array(await file.arrayBuffer())).hex();
          }
        }
      }
      await walk(root, '');
      return out;
    });
    const expected = Object.keys(fx.hashes).sort();
    check('folder structure kept', JSON.stringify(Object.keys(onDisk).sort()) === JSON.stringify(expected), Object.keys(onDisk).length + ' files');
    check('folder file hashes match', expected.every((k) => onDisk[k] === fx.hashes[k]));

    // 4. Resume after a dropped connection, reconnecting with a passphrase layer.
    const resumeName = fx.resume.split(/[\\/]/).pop();
    await pageA.click('[data-go="send"]');
    await pageA.setInputFiles('#pick-files', fx.resume);
    await acceptOffer(pageB, 'library');
    await pageB.waitForFunction(
      (name) => {
        const tr = [...window.filefinch.engine.incoming.values()].find((x) => x.label === name);
        return tr && tr.files[0].written > tr.files[0].size / 3;
      },
      resumeName,
      { polling: 50, timeout: 120000 },
    );
    await pageA.evaluate(() => window.filefinch.connection().dc.close());
    await pageA.locator('#connect-lost').waitFor({ state: 'visible', timeout: 20000 });
    await pageB.locator('#connect-lost').waitFor({ state: 'visible', timeout: 20000 });
    const writtenAtDrop = await pageB.evaluate((name) => [...window.filefinch.engine.incoming.values()].find((x) => x.label === name).files[0].written, resumeName);
    check('dropped connection is detected on both sides', true, `${(writtenAtDrop / MB).toFixed(1)} MB written before the drop`);
    const offlineText = 'Typed while the connection was down';
    check('a text typed while disconnected waits', (await sendText(pageA, pageB, offlineText, { connected: false })) === 'waiting');
    const c2 = await connect(pageA, pageB, ctxA, { passphrase: 'correct horse battery' });
    check('reconnected with a passphrase layer', c2.fpA === c2.fpB);
    await pageB.waitForFunction((t) => [...document.querySelectorAll('#clips-in .ff-clip-text')].some((e) => e.textContent === t), offlineText, { timeout: 30000 });
    check('the waiting text goes out by itself on the new connection, sealed with the passphrase', true);
    await sendText(pageB, pageA, 'Sealed with the passphrase');
    const plainRefused = await pageA.evaluate(() => window.filefinch.app.send({ t: 'clip', id: 'plain1', text: 'not sealed' }));
    await pageB.waitForFunction(() => [...document.querySelectorAll('#toasts .alert-danger')].some((e) => /could not be read/.test(e.textContent)), null, { timeout: 10000 });
    check('with a passphrase, an unsealed text is refused', plainRefused && !(await pageB.$('#clips-in .ff-clip[data-id="plain1"]')));
    const resumed = await waitTransfer(pageB, 'in', resumeName, 5 * 60000);
    const resumeInfo = await pageB.evaluate((name) => {
      const tr = [...window.filefinch.engine.incoming.values()].find((x) => x.label === name);
      return { resumed: tr.resumed ?? 0 };
    }, resumeName);
    check('transfer resumed without a second prompt and verified', resumed.state === 'done' && resumed.files[0].verified && resumed.files[0].hash === fx.resumeHash && resumeInfo.resumed === 1);
    const libHash = await pageB.evaluate(async (name) => {
      const { Sha256 } = await import('./lib/sha256.js');
      const { listLibrary, libraryFile } = await import('./library.js');
      const item = (await listLibrary()).find((x) => x.name === name);
      const file = await libraryFile(item.id);
      const h = new Sha256();
      const reader = file.stream().getReader();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        h.update(value);
      }
      return { hash: h.hex(), stored: item.hash, backend: item.backend };
    }, resumeName);
    check('resumed file in the library matches the original', libHash.hash === fx.resumeHash && libHash.stored === fx.resumeHash, libHash.backend);

    // 5. Folder sync: only changes move, an edit on both sides becomes a kept conflict copy.
    await pageA.evaluate(seedFolder, { dir: 'sync-a', files: { 'a.txt': 'alpha', 'docs/b.txt': 'bravo', 'shared.txt': 'same', 'plan.md': 'plan from A' } });
    await pageB.evaluate(seedFolder, { dir: 'sync-b', files: { 'c.txt': 'charlie', 'shared.txt': 'same', 'plan.md': 'plan from B' } });
    const first = await runSync(pageA, pageB);
    check('sync plan: 2 to send, 1 to receive, 1 conflict, 1 unchanged', first.send === 2 && first.receive === 1 && first.conflicts === 1 && first.same === 1, JSON.stringify(first));
    const folderA = await pageA.evaluate(readFolder, 'sync-a');
    const folderB = await pageB.evaluate(readFolder, 'sync-b');
    const copyName = Object.keys(folderA).find((k) => k.startsWith('plan (conflict'));
    check(
      'both folders hold every file after sync, conflict kept as a copy',
      folderA['c.txt'] === 'charlie' && folderB['a.txt'] === 'alpha' && folderB['docs/b.txt'] === 'bravo' && folderA['plan.md'] === 'plan from A' && folderB['plan.md'] === 'plan from B' && !!copyName && folderA[copyName] === 'plan from B' && folderB[copyName] === 'plan from A',
      copyName,
    );
    await pageA.evaluate(seedFolder, { dir: 'sync-a', files: { 'a.txt': 'alpha, edited on A' } });
    const second = await runSync(pageA, pageB);
    const folderB2 = await pageB.evaluate(readFolder, 'sync-b');
    check('second sync sends only the edited file', second.send === 1 && second.receive === 0 && second.conflicts === 0 && folderB2['a.txt'] === 'alpha, edited on A', JSON.stringify(second));

    // 6. History and console.
    await pageB.click('[data-go="history"]');
    const rows = await pageB.locator('#history-body tr').count();
    check('history lists the transfers', rows >= 3, `${rows} rows`);
    check('no console errors in either browser', errors.length === 0, errors.slice(0, 5).join(' | '));

    // 7. Offline: after the first visit the app shell comes from the service worker cache.
    await ctxB.setOffline(true);
    await pageB.reload();
    const offline = await pageB
      .locator('.ff-brand')
      .waitFor({ timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    const styled = await pageB.evaluate(() => getComputedStyle(document.querySelector('.btn')).borderRadius !== '0px');
    check('app loads offline with its styles', offline && styled);
    await ctxB.setOffline(false);
    writeFileSync(join(work, 'result.json'), JSON.stringify({ browser: exe, bigMB: BIG_MB, seconds, speedMBs, rawSpeed, results }, null, 2));
  } catch (err) {
    check('end to end run', false, err.stack || err.message);
    await pageA.screenshot({ path: join(work, 'fail-A.png') }).catch(() => {});
    await pageB.screenshot({ path: join(work, 'fail-B.png') }).catch(() => {});
    if (errors.length) console.log(errors.join('\n'));
  } finally {
    await browser.close();
    server.close();
    if (!process.env.FILEFINCH_E2E_KEEP) for (const f of ['big', 'resume']) rmSync(fx[f], { force: true });
  }
}

main();

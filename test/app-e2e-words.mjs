// End to end test of pairing with six words through the real public MQTT brokers.
//   1. A (the PC) shows a QR code and six words. B (the phone) opens the QR link, as a camera
//      scan would, and joins through the encrypted relay handshake with nothing typed.
//   2. B shows six confirmation words. Wrong words typed on A are rejected and nothing can be
//      sent; the right words connect, and a file goes from A to B with its hash checked.
//   3. The reverse: B shows a code, A types B's words (prefixes, one typo), A shows the
//      confirmation words and B types them. Then a file goes from B to A.
// Needs network access to the public brokers. If none answers, the test says so and fails.
//
// Usage: node test/app-e2e-words.mjs
// Env: FILEFINCH_BROWSER, FILEFINCH_URL (test a published build, for example
//      https://kwy404.github.io/filefinch/app/)

import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { startServer } from '../scripts/serve.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const work = join(root, '.e2e');

function findBrowser() {
  return [
    process.env.FILEFINCH_BROWSER,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].find((p) => p && existsSync(p));
}

function check(name, ok, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
  return ok;
}

const words = (page, sel) => page.$eval(sel, (el) => (el.dataset.words || '').split(' ').filter(Boolean));

async function typeWords(page, prefix, list) {
  for (let i = 0; i < 6; i++) await page.fill(`#${prefix}-${i}`, list[i]);
}

async function sendAndCheck(from, to, name, size) {
  const data = randomBytes(size);
  const path = join(work, name);
  writeFileSync(path, data);
  const hash = createHash('sha256').update(data).digest('hex');
  await from.click('[data-go="send"]');
  await from.setInputFiles('#pick-files', path);
  await to.locator('#offer-dialog').waitFor({ state: 'visible', timeout: 30000 });
  await to.check('#offer-dests input[value="memory"]');
  await to.click('#offer-accept');
  const got = await to
    .waitForFunction(
      (label) => {
        const tr = [...window.filefinch.engine.incoming.values()].find((x) => x.label === label);
        return tr && ['done', 'failed'].includes(tr.state) ? { state: tr.state, hash: tr.files[0].hash, verified: !!tr.files[0].verified } : null;
      },
      name,
      { timeout: 120000, polling: 200 },
    )
    .then((h) => h.jsonValue());
  return got.state === 'done' && got.verified && got.hash === hash;
}

async function main() {
  const exe = findBrowser();
  if (!exe) {
    console.log('No Chrome or Edge found; set FILEFINCH_BROWSER.');
    process.exit(1);
  }
  mkdirSync(work, { recursive: true });
  let server = null;
  let base = process.env.FILEFINCH_URL;
  if (!base) {
    server = await startServer(0);
    base = `http://localhost:${server.address().port}/filefinch/app/`;
  }
  console.log(`App: ${base}`);
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const opts = { locale: 'en-US', viewport: { width: 1280, height: 860 } };
  const ctxA = await browser.newContext(opts);
  const ctxB = await browser.newContext({ ...opts, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  const pages = [];
  const open = async (ctx, who) => {
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(`${who} pageerror: ${e.message}`));
    p.on('console', (m) => m.type() === 'error' && errors.push(`${who} console: ${m.text()}`));
    pages.push(p);
    return p;
  };
  const A = await open(ctxA, 'A');
  const B = await open(ctxB, 'B');
  try {
    await A.goto(base);
    await B.goto(base);

    // 1. A shows the code: a small QR with the words link, and the six words.
    let t0 = Date.now();
    await A.click('#code-btn');
    const shown = await Promise.race([
      A.locator('#connect-code').waitFor({ state: 'visible', timeout: 45000 }).then(() => 'code'),
      A.locator('#connect-failed').waitFor({ state: 'visible', timeout: 45000 }).then(() => 'failed'),
    ]);
    if (shown === 'failed') {
      check('reach the public relays', false, (await A.textContent('#fail-text')).trim());
      return;
    }
    const codeWords = await words(A, '#code-words');
    const link = await A.getAttribute('#code-qr', 'data-link');
    const version = Number(await A.getAttribute('#code-qr', 'data-version'));
    const relays = (await A.textContent('#code-relays')).trim();
    check('A shows six words and a small QR code', codeWords.length === 6 && version <= 6 && link.includes(`#w=${codeWords.join('-')}`), `QR version ${version}, ${relays}`);

    // B "scans": it opens the link from the QR code. Nothing is typed on B.
    await B.goto(link);
    await B.locator('#connect-confirm-show').waitFor({ state: 'visible', timeout: 60000 });
    await A.locator('#connect-confirm-type').waitFor({ state: 'visible', timeout: 30000 });
    const handshakeMs = Date.now() - t0;
    const confirm = await words(B, '#confirm-words');
    check('B joined through the encrypted relay handshake and shows confirmation words', confirm.length === 6, `${handshakeMs} ms from code to channel`);

    // Wrong words are rejected, and A accepts nothing while it waits.
    const wrong = [...confirm];
    wrong[2] = wrong[2] === 'abandon' ? 'ability' : 'abandon';
    await typeWords(A, 'confirm-word', wrong);
    await A.click('#confirm-btn');
    await A.locator('#confirm-error').waitFor({ state: 'visible' });
    const locked = await A.evaluate(() => ({ connected: window.filefinch.app.isConnected(), link: !!window.filefinch.engine.link }));
    const lockedB = await B.evaluate(() => ({ connected: window.filefinch.app.isConnected(), link: !!window.filefinch.engine.link }));
    check('wrong confirmation words are rejected and no transfer is possible', !locked.connected && !locked.link && !lockedB.link, (await A.textContent('#confirm-error-text')).trim());

    // The right words, typed as four letter prefixes, connect both sides.
    await typeWords(A, 'confirm-word', confirm.map((w) => w.slice(0, 4)));
    await A.click('#confirm-btn');
    await A.locator('#connect-status').waitFor({ state: 'visible', timeout: 15000 });
    await B.locator('#connect-status').waitFor({ state: 'visible', timeout: 15000 });
    const paired = await A.isVisible('#paired-note');
    check('the right words pair the devices', paired && (await B.isVisible('#paired-note')));
    check('a file goes from the PC to the phone, hash verified', await sendAndCheck(A, B, 'words-a-to-b.bin', 3 * 1024 * 1024 + 7));

    // 2. The reverse: the phone shows a code and the PC types it.
    await B.click('[data-go="connect"]');
    await B.click('#disconnect-btn');
    await A.click('[data-go="connect"]');
    await A.locator('#connect-start').waitFor({ state: 'visible', timeout: 15000 });
    t0 = Date.now();
    await B.click('#code-btn');
    await B.locator('#connect-code').waitFor({ state: 'visible', timeout: 45000 });
    const phoneWords = await words(B, '#code-words');
    const typed = phoneWords.map((w, i) => (i === 1 && w.length > 5 ? w.slice(0, 4) + w[5] + w[4] + w.slice(6) : w.slice(0, 4)));
    await typeWords(A, 'join-word', typed);
    if (await A.isVisible('#words-join-btn')) await A.click('#words-join-btn'); // the last full word may have started it
    await A.locator('#connect-confirm-show').waitFor({ state: 'visible', timeout: 60000 });
    await B.locator('#connect-confirm-type').waitFor({ state: 'visible', timeout: 30000 });
    const confirm2 = await words(A, '#confirm-words');
    check('the PC joined by typing the phone code (prefixes and a typo)', confirm2.length === 6, `${Date.now() - t0} ms`);
    // The phone pastes the whole phrase into the first box.
    await B.focus('#confirm-word-0');
    await B.evaluate((text) => {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      document.querySelector('#confirm-word-0').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    }, confirm2.join(' '));
    await B.click('#confirm-btn');
    await B.locator('#connect-status').waitFor({ state: 'visible', timeout: 15000 });
    await A.locator('#connect-status').waitFor({ state: 'visible', timeout: 15000 });
    check('pasting the confirmation phrase pairs the devices the other way', true);
    check('a file goes from the phone to the PC, hash verified', await sendAndCheck(B, A, 'words-b-to-a.bin', 1024 * 1024));

    // 3. The code cannot be used twice.
    const C = await open(await browser.newContext(opts), 'C');
    await C.goto(base);
    await C.goto(link);
    const reused = await Promise.race([
      C.locator('#connect-confirm-show').waitFor({ state: 'visible', timeout: 50000 }).then(() => 'joined'),
      C.locator('#connect-failed').waitFor({ state: 'visible', timeout: 50000 }).then(() => 'refused'),
    ]).catch(() => 'timeout');
    check('a used code does not let a third device in', reused !== 'joined', reused);

    check('no console errors', errors.length === 0, errors.slice(0, 4).join(' | '));
  } catch (err) {
    check('words pairing run', false, err.stack || err.message);
    for (const [i, p] of pages.entries()) await p.screenshot({ path: join(work, `words-fail-${i}.png`) }).catch(() => {});
    if (errors.length) console.log(errors.join('\n'));
  } finally {
    await browser.close();
    server?.close();
  }
}

main();

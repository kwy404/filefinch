// Generates the filefinch art: README assets (mascot, head, favicon,
// banners, icons, illustrations) in assets/, the site copies in
// docs/assets/art/ and docs/assets/icons/, and renders PNG images with a
// local Edge or Chrome in headless mode.
// Usage: node scripts/site/build-art.mjs [--png]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PAL } from './art/palette.mjs';
import { faviconSVG, headSVG, mascotSVG } from './art/finn.mjs';
import { bannerSVG, socialSVG } from './art/banner.mjs';
import { ICONS, iconSVG } from './art/icons.mjs';
import { ART, artSVG } from './art/art.mjs';
import { bird } from './art/kit.mjs';
import { LIT, litSVG } from './art/lit.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const write = (p, s) => {
  const f = join(root, p);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, typeof s === 'string' ? `${s.trim()}\n` : s);
};

/** Small flying finch with a parcel, used by the hero animation. */
export function flyerSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-38 -38 76 66" width="64" height="56">${bird(PAL.light, 0, 0, 1, { carry: 'parcel' })}</svg>`;
}

/** Simple app icon (PNG source) for the README and manifest consumers. */
export function appIconSVG(size = 512) {
  return faviconSVG().replace('width="64" height="64"', `width="${size}" height="${size}"`);
}

export function buildArt() {
  write('assets/mascot.svg', mascotSVG('light'));
  write('assets/mascot-dark.svg', mascotSVG('dark'));
  write('assets/mascot-head.svg', headSVG('light'));
  write('assets/mascot-head-dark.svg', headSVG('dark'));
  write('assets/favicon.svg', faviconSVG());
  write('assets/banner.svg', bannerSVG('light'));
  write('assets/banner-dark.svg', bannerSVG('dark'));
  for (const n of Object.keys(ICONS)) {
    write(`assets/icons/light/${n}.svg`, iconSVG(n, 'light'));
    write(`assets/icons/dark/${n}.svg`, iconSVG(n, 'dark'));
    write(`docs/assets/icons/light/${n}.svg`, iconSVG(n, 'light'));
    write(`docs/assets/icons/dark/${n}.svg`, iconSVG(n, 'dark'));
  }
  for (const n of Object.keys(ART)) {
    write(`assets/illustrations/${n}.svg`, artSVG(n, 'light'));
    write(`assets/illustrations/${n}-dark.svg`, artSVG(n, 'dark'));
    write(`docs/assets/art/${n}.svg`, artSVG(n, 'light'));
    write(`docs/assets/art/${n}-dark.svg`, artSVG(n, 'dark'));
  }
  for (const n of Object.keys(LIT)) {
    write(`docs/assets/lit/${n}.svg`, litSVG(n, 'dark'));
    write(`docs/assets/lit/${n}-light.svg`, litSVG(n, 'light'));
    write(`assets/illustrations/lit/${n}.svg`, litSVG(n, 'dark'));
    write(`assets/illustrations/lit/${n}-light.svg`, litSVG(n, 'light'));
  }
  write('docs/favicon.svg', faviconSVG());
  write('docs/assets/art/finn.svg', mascotSVG('light'));
  write('docs/assets/art/finn-dark.svg', mascotSVG('dark'));
  write('docs/assets/art/finn-head.svg', headSVG('light'));
  write('docs/assets/art/finn-head-dark.svg', headSVG('dark'));
  write('docs/assets/art/flyer.svg', flyerSVG());
  return [...Object.keys(ART), ...Object.keys(LIT)];
}

function findBrowser() {
  const candidates = [
    process.env.FILEFINCH_BROWSER,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/microsoft-edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  return candidates.find((c) => existsSync(c));
}

/** Renders SVG strings to PNG files with one headless browser through playwright-core. */
async function renderWithPlaywright(browserPath, jobs) {
  let chromium;
  try {
    ({ chromium } = await import('playwright-core'));
  } catch {
    return false;
  }
  const browser = await chromium.launch({ executablePath: browserPath, headless: true });
  try {
    const page = await browser.newPage();
    for (const job of jobs) {
      await page.setViewportSize({ width: job.width, height: job.height });
      await page.setContent(`<!doctype html><html><body style="margin:0;overflow:hidden">${job.svg}</body></html>`);
      const out = join(root, job.out);
      mkdirSync(dirname(out), { recursive: true });
      await page.screenshot({ path: out, clip: { x: 0, y: 0, width: job.width, height: job.height } });
    }
  } finally {
    await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 3000))]);
  }
  return true;
}

/** Renders SVG strings to PNG files with a headless browser. */
export async function renderPng(jobs) {
  const browser = findBrowser();
  if (!browser) {
    console.warn('build-art: no Edge or Chrome found, PNG images skipped');
    return false;
  }
  if (await renderWithPlaywright(browser, jobs)) return true;
  const tmp = join(tmpdir(), `filefinch-png-${process.pid}`);
  mkdirSync(tmp, { recursive: true });
  for (const [i, job] of jobs.entries()) {
    const html = join(tmp, `job-${i}.html`);
    writeFileSync(join(tmp, `job-${i}.svg`), job.svg);
    writeFileSync(html, `<!doctype html><html><body style="margin:0;overflow:hidden"><img src="job-${i}.svg" width="${job.width}" height="${job.height}" style="display:block"></body></html>`);
    const out = join(root, job.out);
    mkdirSync(dirname(out), { recursive: true });
    execFileSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${join(tmp, 'profile')}`, `--window-size=${job.width},${job.height}`, `--screenshot=${out}`, pathToFileURL(html).href], { stdio: 'ignore', timeout: 60000 });
  }
  rmSync(tmp, { recursive: true, force: true });
  return true;
}

export const baseImages = () => [
  { svg: socialSVG(1280, 640), width: 1280, height: 640, out: 'assets/social-preview.png' },
  { svg: socialSVG(1200, 630), width: 1200, height: 630, out: 'docs/og.png' },
];

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arts = buildArt();
  if (process.argv.includes('--png')) await renderPng(baseImages());
  console.log(`build-art: ${arts.length} illustrations, ${Object.keys(ICONS).length} icons, mascot, favicon and banners written`);
}

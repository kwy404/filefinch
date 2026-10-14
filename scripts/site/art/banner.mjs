// Banners, the social preview and the Open Graph cards. Text uses the
// system UI font stack; every card is drawn on the open sky.
import { PAL, FONT } from './palette.mjs';
import { placeFinn, placeHead } from './finn.mjs';
import { ART } from './art.mjs';
import { bird, label, noCloud, sky, trail } from './kit.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Approximate width of bold UI text, for layout. */
export function measure(str, size) {
  let w = 0;
  for (const ch of str) {
    if ('il.,:;|!\''.includes(ch)) w += 0.28;
    else if ('fjrt()'.includes(ch)) w += 0.38;
    else if ('mwMW'.includes(ch)) w += 0.88;
    else if (ch === ' ') w += 0.27;
    else if (/[A-Z0-9]/.test(ch)) w += 0.66;
    else w += 0.57;
  }
  return w * size;
}

export function wrap(str, size, maxWidth) {
  const words = str.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (measure(next, size) > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

function wordmark(p, x, y, size) {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="800" letter-spacing="${-size * 0.03}" fill="${p.ink}">file<tspan fill="${p.coral}">finch</tspan></text>`;
}

function chips(p, x, y, list, size = 18) {
  let s = '';
  let cx = x;
  for (const c of list) {
    const w = measure(c, size) + size * 1.6;
    s += `<rect x="${cx}" y="${y}" width="${w}" height="${size * 2}" rx="${size}" fill="${p.card}" stroke="${p.line}" stroke-width="2"/>`;
    s += `<circle cx="${cx + size * 0.75}" cy="${y + size}" r="${size * 0.22}" fill="${p.mint}"/>`;
    s += label(esc(c), cx + size * 1.1, y + size * 1.35, size, p.ink2, { weight: 700 });
    cx += w + size * 0.6;
  }
  return s;
}

export function bannerSVG(theme = 'light') {
  const p = PAL[theme];
  const W = 1280, H = 400;
  let s = sky(p, W, H, { theme, sunX: 1180, sunY: 70, hillY: 350 });
  s += placeFinn(theme, 40, 40, 330);
  s += wordmark(p, 400, 170, 104);
  s += label('Send files and whole folders straight between your devices.', 404, 222, 27, p.ink2, { weight: 600 });
  s += label('No cloud, no account, no upload, end to end encrypted.', 404, 258, 27, p.ink2, { weight: 600 });
  s += chips(p, 404, 290, ['Serverless', 'No size limit', 'Folders', 'Resume', 'QR invite'], 17);
  s += trail(p, 'M960 350 C1030 320 1110 290 1230 250', { op: 0.8 });
  s += bird(p, 1000, 330, 0.8, { carry: 'file' }) + bird(p, 1090, 305, 0.9, { carry: 'parcel', wing: 'down' }) + bird(p, 1180, 282, 0.8, { carry: 'file' });
  s += noCloud(p, 1040, 100, 0.55);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t"><title id="t">filefinch: send files and whole folders straight between your devices, no cloud, no account, end to end encrypted</title>${s}</svg>`;
}

/** Social card (1280 by 640 for GitHub, 1200 by 630 for Open Graph). */
export function socialSVG(W, H, theme = 'light') {
  const p = PAL[theme];
  let s = sky(p, W, H, { theme, sunX: W - 120, sunY: 100, hillY: H * 0.86 });
  s += placeFinn(theme, W * 0.04, H * 0.2, H * 0.68);
  const x = W * 0.42;
  s += wordmark(p, x, H * 0.36, H * 0.19);
  s += label('Files fly straight between', x + 4, H * 0.48, H * 0.055, p.ink2, { weight: 650 });
  s += label('your own devices.', x + 4, H * 0.55, H * 0.055, p.ink2, { weight: 650 });
  s += label('No cloud. No account. No size limit.', x + 4, H * 0.64, H * 0.04, p.soft, { weight: 600 });
  s += chips(p, x + 4, H * 0.7, ['Peer to peer', 'Encrypted', 'Folders', 'Free'], H * 0.03);
  s += trail(p, `M${W * 0.36} ${H * 0.2} C${W * 0.5} ${H * 0.05} ${W * 0.7} ${H * 0.06} ${W * 0.82} ${H * 0.16}`, { op: 0.8 });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s}</svg>`;
}

/** Open Graph card for a page or guide. */
export function cardSVG({ title, kicker, art, theme = 'light' }) {
  const W = 1200, H = 630;
  const p = PAL[theme];
  let s = sky(p, W, H, { theme, sunX: 1110, sunY: 70, hills: false });
  s += `<rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="34" fill="${p.card}" opacity=".72"/>`;
  s += label(esc(kicker.toUpperCase()), 90, 120, 24, p.coral, { weight: 800, ls: 3 });
  let size = 62;
  let lines = wrap(title, size, 560);
  if (lines.length > 4) {
    size = 50;
    lines = wrap(title, size, 560);
  }
  lines.forEach((ln, i) => {
    s += label(esc(ln), 90, 200 + i * size * 1.18, size, p.ink, { weight: 800 });
  });
  if (art && ART[art]) {
    s += `<g transform="translate(680 150) scale(.72)"><clipPath id="cc"><rect width="640" height="400" rx="36"/></clipPath><g clip-path="url(#cc)">${ART[art].draw(p, theme)}</g></g>`;
  }
  s += placeHead(theme, 90, 470, 92);
  s += wordmark(p, 200, 540, 52);
  s += label('kwy404.github.io/filefinch', 470, 538, 22, p.soft, { weight: 600 });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s}</svg>`;
}

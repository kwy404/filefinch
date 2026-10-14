// Drawing kit for the filefinch illustrations: the open sky, devices,
// parcels, flying finches, trails and small badges. Every function returns
// SVG markup for a palette from palette.mjs.
import { FONT } from './palette.mjs';

let uid = 0;
export const id = (p) => `${p}${(++uid).toString(36)}`;

/** Open sky with a sun (or moon and stars) and soft hills. No clouds. */
export function sky(p, W, H, { hills = true, sunX = W * 0.82, sunY = H * 0.2, theme = 'light', hillY = H * 0.8 } = {}) {
  const g = id('sky');
  const glow = id('glow');
  let s = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky3}"/><stop offset=".62" stop-color="${p.sky}"/><stop offset="1" stop-color="${p.horizon}"/></linearGradient><radialGradient id="${glow}"><stop offset="0" stop-color="${p.sunGlow}" stop-opacity=".95"/><stop offset="1" stop-color="${p.sunGlow}" stop-opacity="0"/></radialGradient></defs>`;
  s += `<rect width="${W}" height="${H}" fill="url(#${g})"/>`;
  s += `<circle cx="${sunX}" cy="${sunY}" r="${H * 0.2}" fill="url(#${glow})"/>`;
  if (theme === 'dark') {
    s += `<circle cx="${sunX}" cy="${sunY}" r="${H * 0.06}" fill="${p.sun}"/><circle cx="${sunX + H * 0.03}" cy="${sunY - H * 0.02}" r="${H * 0.055}" fill="${p.sky3}"/>`;
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 26; i++) {
      const x = rnd() * W, y = rnd() * H * 0.55, r = 0.8 + rnd() * 1.6;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#FFFFFF" opacity="${(0.35 + rnd() * 0.5).toFixed(2)}"/>`;
    }
  } else {
    s += `<circle cx="${sunX}" cy="${sunY}" r="${H * 0.065}" fill="${p.sun}"/>`;
  }
  // air streaks instead of clouds
  s += `<path d="M${W * 0.08} ${H * 0.18}h${W * 0.1}M${W * 0.12} ${H * 0.23}h${W * 0.06}M${W * 0.56} ${H * 0.12}h${W * 0.08}" stroke="${p.card}" stroke-width="4" stroke-linecap="round" opacity=".7"/>`;
  if (hills) {
    s += `<path d="M0 ${hillY} C${W * 0.2} ${hillY - H * 0.08} ${W * 0.38} ${hillY - H * 0.02} ${W * 0.55} ${hillY + H * 0.03} C${W * 0.72} ${hillY + H * 0.07} ${W * 0.86} ${hillY - H * 0.06} ${W} ${hillY - H * 0.03} V${H} H0 Z" fill="${p.hill}"/>`;
    s += `<path d="M0 ${hillY + H * 0.1} C${W * 0.25} ${hillY + H * 0.04} ${W * 0.5} ${hillY + H * 0.12} ${W * 0.7} ${hillY + H * 0.09} C${W * 0.85} ${hillY + H * 0.07} ${W * 0.95} ${hillY + H * 0.1} ${W} ${hillY + H * 0.12} V${H} H0 Z" fill="${p.hill2}"/>`;
  }
  return s;
}

/** Plain rounded panel background used by smaller cards. */
export function panel(p, W, H) {
  const g = id('pn');
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky2}"/><stop offset="1" stop-color="${p.sky}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${g})"/>`;
}

const shadow = (p, cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.12}" fill="${p.shadow}"/>`;

/** A phone. style 'round' or 'island' gives two neutral designs. */
export function phone(p, x, y, w, { screen = '', style = 'round', tilt = 0, shade = true } = {}) {
  const h = w * 2.02;
  const r = w * 0.17;
  const bez = w * 0.06;
  const sw = w - bez * 2, sh = h - bez * 2;
  const cut = style === 'island'
    ? `<rect x="${w / 2 - w * 0.16}" y="${bez + w * 0.05}" width="${w * 0.32}" height="${w * 0.08}" rx="${w * 0.04}" fill="${p.navy2}"/>`
    : `<circle cx="${w / 2}" cy="${bez + w * 0.08}" r="${w * 0.035}" fill="${p.navy2}"/>`;
  const clip = id('ph');
  return `${shade ? shadow(p, x + w / 2, y + h + 8, w * 0.62) : ''}<g transform="translate(${x} ${y}) rotate(${tilt} ${w / 2} ${h / 2})">
<defs><clipPath id="${clip}"><rect x="${bez}" y="${bez}" width="${sw}" height="${sh}" rx="${r - bez}"/></clipPath></defs>
<rect width="${w}" height="${h}" rx="${r}" fill="${p.ink}"/>
<rect x="${bez}" y="${bez}" width="${sw}" height="${sh}" rx="${r - bez}" fill="${p.card}"/>
<g clip-path="url(#${clip})"><g transform="translate(${bez} ${bez})">${typeof screen === 'function' ? screen(sw, sh) : screen}</g></g>
${cut}
</g>`;
}

/** A laptop with an open lid. */
export function laptop(p, x, y, w, { screen = '' } = {}) {
  const sh = w * 0.62;
  const bez = w * 0.035;
  const clip = id('lp');
  return `${shadow(p, x + w / 2, y + sh + w * 0.08, w * 0.6)}<g transform="translate(${x} ${y})">
<defs><clipPath id="${clip}"><rect x="${bez}" y="${bez}" width="${w - bez * 2}" height="${sh - bez * 2}" rx="${w * 0.015}"/></clipPath></defs>
<rect width="${w}" height="${sh}" rx="${w * 0.035}" fill="${p.ink}"/>
<rect x="${bez}" y="${bez}" width="${w - bez * 2}" height="${sh - bez * 2}" rx="${w * 0.015}" fill="${p.card}"/>
<g clip-path="url(#${clip})"><g transform="translate(${bez} ${bez})">${typeof screen === 'function' ? screen(w - bez * 2, sh - bez * 2) : screen}</g></g>
<path d="M${-w * 0.08} ${sh + w * 0.005} H${w * 1.08} L${w * 1.03} ${sh + w * 0.055} H${-w * 0.03} Z" fill="${p.ink2}"/>
<rect x="${w * 0.42}" y="${sh + w * 0.005}" width="${w * 0.16}" height="${w * 0.016}" rx="${w * 0.008}" fill="${p.soft}"/>
</g>`;
}

/** A desktop monitor on a stand. */
export function desktop(p, x, y, w, { screen = '' } = {}) {
  const sh = w * 0.6;
  const bez = w * 0.03;
  const clip = id('dk');
  return `${shadow(p, x + w / 2, y + sh + w * 0.2, w * 0.4)}<g transform="translate(${x} ${y})">
<defs><clipPath id="${clip}"><rect x="${bez}" y="${bez}" width="${w - bez * 2}" height="${sh - bez * 2}" rx="${w * 0.012}"/></clipPath></defs>
<path d="M${w * 0.43} ${sh} L${w * 0.4} ${sh + w * 0.17} H${w * 0.6} L${w * 0.57} ${sh} Z" fill="${p.ink2}"/>
<rect x="${w * 0.3}" y="${sh + w * 0.16}" width="${w * 0.4}" height="${w * 0.03}" rx="${w * 0.015}" fill="${p.ink}"/>
<rect width="${w}" height="${sh}" rx="${w * 0.03}" fill="${p.ink}"/>
<rect x="${bez}" y="${bez}" width="${w - bez * 2}" height="${sh - bez * 2}" rx="${w * 0.012}" fill="${p.card}"/>
<g clip-path="url(#${clip})"><g transform="translate(${bez} ${bez})">${typeof screen === 'function' ? screen(w - bez * 2, sh - bez * 2) : screen}</g></g>
</g>`;
}

/** A tablet in landscape. */
export function tablet(p, x, y, w, { screen = '' } = {}) {
  const h = w * 0.7;
  const bez = w * 0.04;
  const clip = id('tb');
  return `${shadow(p, x + w / 2, y + h + 8, w * 0.5)}<g transform="translate(${x} ${y})">
<defs><clipPath id="${clip}"><rect x="${bez}" y="${bez}" width="${w - bez * 2}" height="${h - bez * 2}" rx="${w * 0.03}"/></clipPath></defs>
<rect width="${w}" height="${h}" rx="${w * 0.06}" fill="${p.ink}"/>
<rect x="${bez}" y="${bez}" width="${w - bez * 2}" height="${h - bez * 2}" rx="${w * 0.03}" fill="${p.card}"/>
<g clip-path="url(#${clip})"><g transform="translate(${bez} ${bez})">${typeof screen === 'function' ? screen(w - bez * 2, h - bez * 2) : screen}</g></g>
</g>`;
}

/** A kraft parcel with string, centered at x,y. */
export function parcel(p, x, y, s = 1, { rot = 0, seal = false } = {}) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
<path d="M-22 -10 L0 -20 L22 -10 L0 0 Z" fill="${p.kraft}"/>
<path d="M-22 -10 L0 0 V24 L-22 14 Z" fill="${p.kraft}"/>
<path d="M22 -10 L0 0 V24 L22 14 Z" fill="${p.kraft2}"/>
<path d="M-11 -15 L11 -5 V19 M11 -15 L-11 -5 V19" fill="none" stroke="${p.string}" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>
${seal ? `<circle cx="-11" cy="6" r="6" fill="${p.mint}"/><path d="M-14 6 l2.2 2.2 4-4.4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
</g>`;
}

/** A small file sheet with a colored band, centered at x,y. */
export function fileSheet(p, x, y, s = 1, { color = p.blue, rot = 0, label = '' } = {}) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
<path d="M-16 -22 H8 L18 -12 V22 H-16 Z" fill="${p.card}" stroke="${p.ink}" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M8 -22 V-12 H18" fill="${p.sky2}" stroke="${p.ink}" stroke-width="2.4" stroke-linejoin="round"/>
<rect x="-11" y="-6" width="24" height="9" rx="2" fill="${color}"/>
<path d="M-11 9 H11 M-11 15 H4" stroke="${p.line}" stroke-width="2.4" stroke-linecap="round"/>
${label ? `<text x="1.5" y="1.5" text-anchor="middle" font-family="${FONT}" font-size="7" font-weight="800" fill="#fff">${label}</text>` : ''}
</g>`;
}

/** A folder shape centered at x,y. */
export function folder(p, x, y, s = 1, { rot = 0 } = {}) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
<path d="M-34 -22 a5 5 0 0 1 5 -5 h18 l7 8 h37 a5 5 0 0 1 5 5 v40 a5 5 0 0 1 -5 5 h-62 a5 5 0 0 1 -5 -5 Z" fill="${p.sun}" stroke="${p.ink}" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M-34 -10 h68" stroke="${p.ink}" stroke-width="2.6"/>
<path d="M-34 -10 h68 v24 a5 5 0 0 1 -5 5 h-58 a5 5 0 0 1 -5 -5 Z" fill="#FFD866" opacity=".6"/>
</g>`;
}

/** A small flying finch, facing right, centered at x,y. With a parcel if asked. */
export function bird(p, x, y, s = 1, { flip = false, carry = null, wing = 'up', color = p.coral } = {}) {
  const wingPath = wing === 'up'
    ? 'M-4 -4 C-10 -24 4 -34 16 -32 C10 -22 8 -12 6 -2 Z'
    : 'M-6 -2 C-14 10 -4 18 8 18 C6 10 6 4 6 -2 Z';
  const carryG = carry === 'parcel' ? parcel(p, 2, 24, 0.42) : carry === 'file' ? fileSheet(p, 2, 26, 0.45, { color: p.blue }) : carry === 'folder' ? folder(p, 2, 26, 0.32) : '';
  const strings = carry ? `<path d="M-2 10 L-2 18 M6 10 L6 18" stroke="${p.ink}" stroke-width="1.6" stroke-linecap="round"/>` : '';
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
${strings}${carryG}
<path d="M-18 2 L-32 -6 L-28 4 L-34 10 Z" fill="${p.coral2}"/>
<ellipse cx="0" cy="2" rx="19" ry="13" fill="${color}"/>
<circle cx="13" cy="-6" r="10" fill="${color}"/>
<path d="M2 6 C8 14 18 12 20 2 C16 8 8 8 2 6 Z" fill="${p.cream}"/>
<path d="M22 -9 L31 -5 L22 -1 Z" fill="${p.beak}"/>
<circle cx="16" cy="-8" r="2.4" fill="${p.ink === '#EAF1FF' ? '#0B1530' : p.ink}"/>
<path d="${wingPath}" fill="${p.coral2}"/>
</g>`;
}

/** Dashed flight trail along a path. */
export function trail(p, d, { color = p.trail, width = 3, dash = '2 9', op = 1 } = {}) {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dash}" stroke-linecap="round" opacity="${op}"/>`;
}

/** Padlock badge centered at x,y. */
export function lock(p, x, y, s = 1, { color = p.mint } = {}) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
<circle r="26" fill="${p.card}" stroke="${p.ink}" stroke-width="2.6"/>
<path d="M-8 -3 v-6 a8 8 0 0 1 16 0 v6" fill="none" stroke="${p.ink}" stroke-width="3" stroke-linecap="round"/>
<rect x="-12" y="-4" width="24" height="18" rx="4" fill="${color}" stroke="${p.ink}" stroke-width="2.6"/>
<circle cx="0" cy="4" r="2.6" fill="${p.ink}"/>
</g>`;
}

/** Check badge centered at x,y. */
export function check(p, x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><circle r="14" fill="${p.mint}" stroke="${p.card}" stroke-width="3"/><path d="M-6 0 l4 4 8-9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

/** A crossed out cloud: there is no cloud in the middle. */
export function noCloud(p, x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" opacity=".9">
<path d="M-30 14 a14 14 0 0 1 -2 -28 a20 20 0 0 1 38 -6 a15 15 0 0 1 22 20 a12 12 0 0 1 -4 14 Z" fill="none" stroke="${p.soft}" stroke-width="3" stroke-dasharray="6 6" stroke-linejoin="round"/>
<path d="M-34 -28 L38 22" stroke="${p.coral}" stroke-width="5" stroke-linecap="round"/>
</g>`;
}

/** A deterministic QR like pattern with the three finder squares. */
export function qr(p, x, y, size, { seed = 3, color = p.ink, bg = p.card } = {}) {
  const n = 21;
  const c = size / n;
  let st = seed;
  const rnd = () => ((st = (st * 1103515245 + 12345) % 2147483648) / 2147483648);
  let s = `<g transform="translate(${x} ${y})"><rect x="${-c}" y="${-c}" width="${size + 2 * c}" height="${size + 2 * c}" rx="${c}" fill="${bg}"/>`;
  const finder = (fx, fy) => `<rect x="${fx * c + c * 0.5}" y="${fy * c + c * 0.5}" width="${6 * c}" height="${6 * c}" rx="${c * 0.8}" fill="none" stroke="${color}" stroke-width="${c}"/><rect x="${(fx + 2) * c}" y="${(fy + 2) * c}" width="${3 * c}" height="${3 * c}" rx="${c * 0.4}" fill="${color}"/>`;
  const inFinder = (i, j) => (i < 8 && j < 8) || (i > n - 9 && j < 8) || (i < 8 && j > n - 9);
  let d = '';
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    if (inFinder(i, j)) continue;
    if (rnd() < 0.48) d += `M${(i * c).toFixed(2)} ${(j * c).toFixed(2)}h${c.toFixed(2)}v${c.toFixed(2)}h${(-c).toFixed(2)}Z`;
  }
  s += `<path d="${d}" fill="${color}"/>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</g>`;
  return s;
}

/** Text helper with the house font. */
export function label(str, x, y, size, fill, { weight = 700, anchor = 'start', ls = 0 } = {}) {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${ls ? ` letter-spacing="${ls}"` : ''}>${str}</text>`;
}

/** A progress bar. */
export function progress(p, x, y, w, frac, { color = p.blue, h = 8 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${p.line}"/><rect x="${x}" y="${y}" width="${w * frac}" height="${h}" rx="${h / 2}" fill="${color}"/>`;
}

/** A chat bubble with lines, pointing down left. */
export function bubble(p, x, y, w, h, { fill = p.card, lines = 2, tail = 'left', accent = p.blue } = {}) {
  const t = tail === 'left' ? `M${x + 16} ${y + h} l-6 14 l18 -14 Z` : `M${x + w - 16} ${y + h} l6 14 l-18 -14 Z`;
  let s = `<path d="${t}" fill="${fill}" stroke="${p.ink}" stroke-width="2.4" stroke-linejoin="round"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${p.ink}" stroke-width="2.4"/><path d="${t.replace(/ Z$/, '')}" fill="${fill}" stroke="none"/>`;
  for (let i = 0; i < lines; i++) s += `<rect x="${x + 12}" y="${y + 12 + i * 12}" width="${(w - 24) * (i === lines - 1 ? 0.6 : 1)}" height="6" rx="3" fill="${i === 0 ? accent : p.line}"/>`;
  return s;
}

/** A plain app screen: header bar, rows of files with bars. */
export function appScreen(p, w, h, { rows = 3, title = true, done = 0, accent = p.blue, mode = 'list' } = {}) {
  let s = `<rect width="${w}" height="${h}" fill="${p.card2}"/>`;
  if (title) s += `<rect width="${w}" height="${h * 0.14}" fill="${accent}"/><circle cx="${h * 0.07}" cy="${h * 0.07}" r="${h * 0.03}" fill="#fff" opacity=".9"/><rect x="${h * 0.13}" y="${h * 0.055}" width="${w * 0.3}" height="${h * 0.03}" rx="${h * 0.015}" fill="#fff" opacity=".85"/>`;
  if (mode === 'grid') {
    const cols = 3, gap = w * 0.04, cw = (w - gap * (cols + 1)) / cols;
    const colors = [p.coral, p.blue, p.mint, p.sun, p.blue2, p.coral2];
    for (let i = 0; i < 6; i++) {
      const cx = gap + (i % cols) * (cw + gap), cy = h * 0.2 + Math.floor(i / cols) * (cw + gap);
      s += `<rect x="${cx}" y="${cy}" width="${cw}" height="${cw}" rx="${cw * 0.12}" fill="${colors[i]}" opacity=".85"/><path d="M${cx + cw * 0.15} ${cy + cw * 0.8} l${cw * 0.25} -${cw * 0.3} l${cw * 0.18} ${cw * 0.18} l${cw * 0.12} -${cw * 0.1} l${cw * 0.15} ${cw * 0.22} Z" fill="#fff" opacity=".8"/>`;
    }
    return s;
  }
  const top = title ? h * 0.2 : h * 0.08;
  const rh = Math.min(h * 0.16, (h - top - h * 0.05) / rows);
  for (let i = 0; i < rows; i++) {
    const y = top + i * rh;
    const colors = [p.coral, p.blue, p.mint, p.sun];
    s += `<rect x="${w * 0.07}" y="${y}" width="${rh * 0.62}" height="${rh * 0.7}" rx="${rh * 0.12}" fill="${colors[i % 4]}"/>`;
    s += `<rect x="${w * 0.07 + rh * 0.85}" y="${y + rh * 0.08}" width="${w * 0.45}" height="${rh * 0.16}" rx="${rh * 0.08}" fill="${p.ink2}" opacity=".7"/>`;
    s += progress(p, w * 0.07 + rh * 0.85, y + rh * 0.42, w * 0.72 - rh * 0.85, i < done ? 1 : i === done ? 0.55 : 0.12, { color: i < done ? p.mint : accent, h: rh * 0.14 });
  }
  return s;
}

/** Wrap content into a complete SVG document. */
export function svgDoc(W, H, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t"><title id="t">${title}</title>${body}</svg>`;
}

/** A numbered word tile, like one word of a recovery phrase. */
export function wordChip(p, x, y, w, n, word, { h = w * 0.34, accent = p.blue, size = h * 0.42 } = {}) {
  return `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="${h * 0.3}" fill="${p.card}" stroke="${p.line}" stroke-width="2"/><rect x="${h * 0.16}" y="${h * 0.16}" width="${h * 0.68}" height="${h * 0.68}" rx="${h * 0.2}" fill="${accent}"/><text x="${h * 0.5}" y="${h * 0.5 + size * 0.36}" text-anchor="middle" font-family="${FONT}" font-size="${size * 0.9}" font-weight="800" fill="#fff">${n}</text><text x="${h * 1.02}" y="${h * 0.5 + size * 0.36}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${p.ink}">${word}</text></g>`;
}

/** A sealed envelope with a small lock, centered at x,y. */
export function envelope(p, x, y, s = 1, { rot = 0 } = {}) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><rect x="-24" y="-16" width="48" height="32" rx="5" fill="${p.card}" stroke="${p.ink}" stroke-width="2.4"/><path d="M-24 -14 L0 4 L24 -14" fill="none" stroke="${p.ink}" stroke-width="2.4" stroke-linejoin="round"/><circle cx="14" cy="10" r="9" fill="${p.mint}" stroke="${p.card}" stroke-width="2"/><path d="M10.5 9 v-2 a3.5 3.5 0 0 1 7 0 v2" fill="none" stroke="#fff" stroke-width="1.8"/><rect x="9.5" y="9" width="9" height="6.5" rx="1.5" fill="#fff"/></g>`;
}

// The "lit" illustrations of the filefinch site: objects drawn with light
// trails on a hairline grid, with layered glows, in the same spirit as a
// lit product shot. Every piece has a dark version (light on a night sky)
// and a light version (ink and color on paper). Backgrounds are transparent
// so cards and panels can show their own glow through.

const W = 640;
const H = 400;

export const LIT_THEME = {
  dark: { line: '#EDEDF0', soft: 'rgba(237,237,240,.14)', faint: 'rgba(237,237,240,.06)', blue: '#B4B8C4', blue2: '#8D8D98', coral: '#FF7A45', sun: '#FFB27A', mint: '#3ECF8E', core: '#FFFFFF', glow: 1, panel: 'rgba(18,18,22,.8)', panelLine: 'rgba(255,255,255,.12)', text: '#EDEDF0', sub: '#8D8D98' },
  light: { line: '#10244A', soft: 'rgba(16,36,74,.16)', faint: 'rgba(16,36,74,.07)', blue: '#2F6FED', blue2: '#5B93FF', coral: '#FF6A2B', sun: '#F5A623', mint: '#14A77A', core: '#10244A', glow: 0.45, panel: 'rgba(255,255,255,.86)', panelLine: 'rgba(16,36,74,.14)', text: '#10244A', sub: '#51658A' },
};

let n = 0;
const uid = (p) => `${p}${(++n).toString(36)}`;

function defs(t, id) {
  return `<defs>
<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.blue}"/><stop offset=".55" stop-color="${t.blue2}"/><stop offset="1" stop-color="${t.coral}"/></linearGradient>
<linearGradient id="${id}fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.blue}" stop-opacity="0"/><stop offset="1" stop-color="${t.blue}" stop-opacity=".9"/></linearGradient>
<linearGradient id="${id}fadeC" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.coral}" stop-opacity="0"/><stop offset="1" stop-color="${t.coral}" stop-opacity=".95"/></linearGradient>
<radialGradient id="${id}r"><stop offset="0" stop-color="${t.blue}" stop-opacity="${t.glow === 1 ? 0.55 : 0.2}"/><stop offset="1" stop-color="${t.blue}" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}rc"><stop offset="0" stop-color="${t.coral}" stop-opacity="${t.glow === 1 ? 0.5 : 0.22}"/><stop offset="1" stop-color="${t.coral}" stop-opacity="0"/></radialGradient>
<filter id="${id}b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="${id}b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>
</defs>`;
}

/** Draws a path as light: wide blur, soft halo and a crisp core. */
function glow(t, id, d, color, { w = 2.4, fill = 'none', core = true, op = 1 } = {}) {
  const g = t.glow;
  return `<g opacity="${op}"><path d="${d}" fill="${fill === 'none' ? 'none' : fill}" stroke="${color}" stroke-width="${w * 5}" stroke-linecap="round" stroke-linejoin="round" opacity="${0.5 * g}" filter="url(#${id}b)"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w * 2}" stroke-linecap="round" stroke-linejoin="round" opacity="${0.55 * g}" filter="url(#${id}b2)"/><path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>${core && t.glow === 1 ? `<path d="${d}" fill="none" stroke="${t.core}" stroke-width="${w * 0.35}" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>` : ''}</g>`;
}

/** Hairline grid that fades out toward the edges. */
function grid(t, id, { step = 40, cx = W / 2, cy = H / 2, r = 300 } = {}) {
  let d = '';
  for (let x = step / 2; x < W; x += step) d += `M${x} 0V${H}`;
  for (let y = step / 2; y < H; y += step) d += `M0 ${y}H${W}`;
  return `<defs><radialGradient id="${id}m" cx="${cx / W}" cy="${cy / H}" r="${r / W}" gradientUnits="objectBoundingBox"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="${id}mk"><rect width="${W}" height="${H}" fill="url(#${id}m)"/></mask></defs><path d="${d}" stroke="${t.faint}" stroke-width="1" mask="url(#${id}mk)"/>`;
}

const halo = (id, x, y, r, c = 'r') => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id}${c})"/>`;

/** A glowing isometric parcel centered at x,y. */
function litParcel(t, id, x, y, s = 1) {
  const P = (px, py) => `${x + px * s} ${y + py * s}`;
  const top = `M${P(-40, -18)} L${P(0, -38)} L${P(40, -18)} L${P(0, 2)} Z`;
  const left = `M${P(-40, -18)} L${P(0, 2)} L${P(0, 46)} L${P(-40, 26)} Z`;
  const right = `M${P(40, -18)} L${P(0, 2)} L${P(0, 46)} L${P(40, 26)} Z`;
  const string = `M${P(-20, -28)} L${P(20, -8)} L${P(20, 36)} M${P(20, -28)} L${P(-20, -8)} L${P(-20, 36)}`;
  return halo(id, x, y, 110 * s, 'rc')
    + `<path d="${top}" fill="${t.coral}" opacity=".2"/><path d="${left}" fill="${t.coral}" opacity=".1"/><path d="${right}" fill="${t.sun}" opacity=".14"/>`
    + glow(t, id, `${top}${left}${right}`, t.coral, { w: 2.2 })
    + glow(t, id, string, t.sun, { w: 1.6, op: 0.9 });
}

/** A finch in flight made of light trails. Box about 520 by 360. */
export function litFinch(t, id, ox = 0, oy = 0, s = 1) {
  const T = (d) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, a, b) => `${(ox + a * s).toFixed(1)} ${(oy + b * s).toFixed(1)}`);
  let out = '';
  // speed trails behind the bird
  for (let i = 0; i < 7; i++) {
    const y = 150 + i * 16;
    out += `<path d="${T(`M${-60 + i * 14} ${y + 30} C60 ${y + 16} 150 ${y - 4} ${232 + i * 6} ${y - 10}`)}" fill="none" stroke="url(#${id}fade)" stroke-width="${1.2 + (i % 3) * 0.5}" stroke-linecap="round" opacity="${0.35 + (i % 2) * 0.3}"/>`;
  }
  // wing feathers sweeping up and back
  const feathers = [];
  for (let k = 0; k < 6; k++) feathers.push(`M${352 - k * 10} ${176 + k * 3} C${318 - k * 8} ${118 - k * 2} ${282 - k * 10} ${80 + k * 2} ${232 - k * 16} ${42 + k * 12}`);
  out += glow(t, id, T(feathers.join('')), t.blue, { w: 1.7, op: 0.95 });
  // body, head and tail
  const body = 'M446 176 C440 150 416 134 390 140 C364 146 346 166 330 184 C300 214 262 232 222 238 L170 246 M222 238 L156 282 M226 236 C268 252 330 250 372 226 C404 210 430 200 446 176';
  out += glow(t, id, T(body), `url(#${id}g)`, { w: 2.6 });
  // beak and eye
  out += glow(t, id, T('M446 166 L474 176 L446 186'), t.sun, { w: 2.2 });
  out += `<circle cx="${ox + 418 * s}" cy="${oy + 162 * s}" r="${4.5 * s}" fill="${t.line}"/>`;
  // near wing, folded over the body
  out += glow(t, id, T('M372 190 C346 176 300 180 268 206 C306 214 344 210 372 190 Z'), t.coral, { w: 1.8, op: 0.9 });
  // strings to the parcel
  out += glow(t, id, T('M352 236 L340 286 M378 222 L372 282'), t.line, { w: 1, op: 0.6, core: false });
  out += litParcel(t, id, ox + 356 * s, oy + 316 * s, 0.9 * s);
  return out;
}

const panel = (t, x, y, w, h, r = 16) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${t.panel}" stroke="${t.panelLine}"/>`;
const txt = (t, s, x, y, size, { c = t.text, w = 700, a = 'start', mono = false } = {}) => `<text x="${x}" y="${y}" font-family="${mono ? 'ui-monospace, Consolas, monospace' : "'Segoe UI', Helvetica, Arial, sans-serif"}" font-size="${size}" font-weight="${w}" fill="${c}" text-anchor="${a}">${s}</text>`;

function deviceOutline(t, id, kind, x, y, s = 1, color = t.blue) {
  const R = (px, py, w, h, r) => `M${x + (px + r) * s} ${y + py * s}H${x + (px + w - r) * s}A${r * s} ${r * s} 0 0 1 ${x + (px + w) * s} ${y + (py + r) * s}V${y + (py + h - r) * s}A${r * s} ${r * s} 0 0 1 ${x + (px + w - r) * s} ${y + (py + h) * s}H${x + (px + r) * s}A${r * s} ${r * s} 0 0 1 ${x + px * s} ${y + (py + h - r) * s}V${y + (py + r) * s}A${r * s} ${r * s} 0 0 1 ${x + (px + r) * s} ${y + py * s}Z`;
  if (kind === 'phone') return glow(t, id, R(0, 0, 60, 120, 12) + `M${x + 24 * s} ${y + 9 * s}H${x + 36 * s}`, color, { w: 2 });
  if (kind === 'laptop') return glow(t, id, R(10, 0, 140, 90, 8) + `M${x} ${y + 98 * s}H${x + 160 * s}L${x + 152 * s} ${y + 106 * s}H${x + 8 * s}Z`, color, { w: 2 });
  return glow(t, id, R(0, 0, 170, 106, 8) + `M${x + 70 * s} ${y + 106 * s}L${x + 64 * s} ${y + 134 * s}H${x + 106 * s}L${x + 100 * s} ${y + 106 * s}M${x + 54 * s} ${y + 134 * s}H${x + 116 * s}`, color, { w: 2 });
}

const WORDS = ['maple', 'harbor', 'orbit', 'canyon', 'river', 'meadow'];

export const LIT = {
  'lit-finch': {
    title: 'A finch in flight drawn with light trails, carrying a glowing parcel',
    draw: (t, id) => grid(t, id) + halo(id, 360, 200, 240) + litFinch(t, id, 40, 10, 1),
  },
  'lit-parcel': {
    title: 'A glowing paper parcel tied with string, floating above a hairline grid',
    draw: (t, id) => grid(t, id) + glow(t, id, 'M120 300 C220 270 420 270 520 300', t.blue, { w: 1.4, op: 0.6 }) + litParcel(t, id, 320, 190, 2.1),
  },
  'words-orbit': {
    title: 'Six numbered words orbiting a padlock: the six word handshake',
    draw: (t, id) => {
      let s = grid(t, id) + halo(id, 320, 200, 200);
      s += glow(t, id, 'M320 200m-150 0a150 80 0 1 0 300 0a150 80 0 1 0 -300 0', t.blue, { w: 1.2, op: 0.7, core: false });
      s += glow(t, id, 'M300 196v-14a20 20 0 0 1 40 0v14M292 196h56v42h-56Z', t.mint, { w: 2.6 });
      WORDS.forEach((w, i) => {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const x = 320 + Math.cos(a) * 200 - 56, y = 200 + Math.sin(a) * 120 - 17;
        s += panel(t, x, y, 112, 34, 17) + `<circle cx="${x + 17}" cy="${y + 17}" r="11" fill="${i % 2 ? t.coral : t.blue}"/>` + txt(t, i + 1, x + 17, y + 22, 13, { c: '#fff', w: 800, a: 'middle' }) + txt(t, w, x + 36, y + 22.5, 15);
      });
      return s;
    },
  },
  'qr-beam': {
    title: 'A QR code lit by a scanning beam of light',
    draw: (t, id) => {
      let s = grid(t, id) + halo(id, 320, 200, 190);
      const x0 = 230, y0 = 110, c = 180 / 21;
      let seed = 5;
      const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
      let d = '';
      const fin = (i, j) => (i < 7 && j < 7) || (i > 13 && j < 7) || (i < 7 && j > 13);
      for (let j = 0; j < 21; j++) for (let i = 0; i < 21; i++) if (!fin(i, j) && rnd() < 0.46) d += `M${x0 + i * c + 1} ${y0 + j * c + 1}h${c - 2}v${c - 2}h${-(c - 2)}Z`;
      s += `<path d="${d}" fill="${t.line}" opacity=".85"/>`;
      for (const [i, j] of [[0, 0], [14, 0], [0, 14]]) s += glow(t, id, `M${x0 + i * c + 3} ${y0 + j * c + 3}h${7 * c - 6}v${7 * c - 6}h${-(7 * c - 6)}ZM${x0 + (i + 2) * c} ${y0 + (j + 2) * c}h${3 * c}v${3 * c}h${-3 * c}Z`, t.blue, { w: 2 });
      s += `<rect x="200" y="196" width="240" height="6" fill="${t.mint}" opacity=".9" filter="url(#${id}b2)"/><rect x="200" y="150" width="240" height="50" fill="url(#${id}r)" opacity=".5"/>`;
      s += glow(t, id, 'M200 120v-24h24M440 120v-24h-24M200 280v24h24M440 280v24h-24', t.mint, { w: 3 });
      return s;
    },
  },
  'stream-disk': {
    title: 'File chunks streaming in a line straight onto a disk, never piling up in memory',
    draw: (t, id) => {
      let s = grid(t, id) + halo(id, 470, 220, 170);
      for (let i = 0; i < 9; i++) {
        const x = 70 + i * 38, y = 190 + Math.sin(i * 0.8) * 8;
        s += `<rect x="${x}" y="${y}" width="26" height="20" rx="4" fill="${i % 3 === 2 ? t.coral : t.blue}" opacity="${0.25 + i * 0.08}"/>`;
      }
      s += glow(t, id, 'M60 200 C200 200 300 200 400 210', `url(#${id}g)`, { w: 1.4, op: 0.8 });
      s += glow(t, id, 'M410 170 a70 26 0 0 0 140 0 a70 26 0 0 0 -140 0 v84 a70 26 0 0 0 140 0 v-84 M410 212 a70 26 0 0 0 140 0', t.blue, { w: 2.2 });
      s += txt(t, 'chunk 64 KiB', 130, 160, 14, { c: t.sub, w: 600, mono: true }) + txt(t, 'write', 480, 300, 14, { c: t.sub, w: 600, a: 'middle', mono: true });
      return s;
    },
  },
  'resume-arc': {
    title: 'A flight path broken by a dropped connection that picks up again from the last confirmed chunk',
    draw: (t, id) => {
      let s = grid(t, id) + halo(id, 320, 200, 200);
      s += glow(t, id, 'M80 300 C160 140 240 110 300 140', t.blue, { w: 2.6 });
      s += `<path d="M300 140 C320 150 336 160 350 166" stroke="${t.soft}" stroke-width="3" stroke-dasharray="3 8" fill="none" stroke-linecap="round"/>`;
      s += glow(t, id, 'M350 166 C430 196 500 150 560 90', t.mint, { w: 2.6 });
      s += glow(t, id, 'M340 120a26 26 0 1 1 -8 -18M332 88v14h-14', t.coral, { w: 2.8 });
      s += panel(t, 120, 318, 400, 46, 23) + `<rect x="144" y="337" width="352" height="8" rx="4" fill="${t.soft}"/><rect x="144" y="337" width="226" height="8" rx="4" fill="${t.blue}"/>` + txt(t, '64%', 504, 346, 13, { c: t.sub, a: 'end', w: 700 });
      return s;
    },
  },
  'folder-tree': {
    title: 'A folder tree drawn with light, each branch ending in a file',
    draw: (t, id) => {
      let s = grid(t, id) + halo(id, 220, 200, 180);
      s += glow(t, id, 'M120 120h40l12 14h72v70h-124Z', t.sun, { w: 2.4 });
      const leaves = [[360, 90], [360, 150], [440, 200], [440, 250], [360, 300], [520, 300]];
      s += glow(t, id, 'M244 170 H300 M300 90 V300 M300 90 H340 M300 150 H340 M300 225 H380 M380 200 V250 M380 200 H420 M380 250 H420 M300 300 H340 M440 300 H500', t.blue, { w: 1.6, op: 0.8, core: false });
      leaves.forEach(([x, y], i) => {
        s += glow(t, id, `M${x - 14} ${y - 18}h20l8 8v28h-28Z`, i % 2 ? t.coral : t.mint, { w: 1.8 });
      });
      return s;
    },
  },
  'sync-loop': {
    title: 'Two folders kept in step by two loops of light carrying only what changed',
    draw: (t, id) => {
      let s = grid(t, id) + halo(id, 320, 200, 210);
      s += glow(t, id, 'M120 170h40l10 12h60v76h-110Z', t.blue, { w: 2.4 }) + glow(t, id, 'M410 170h40l10 12h60v76h-110Z', t.blue, { w: 2.4 });
      s += glow(t, id, 'M250 170 C290 110 350 110 390 170 M378 154 l12 16 l-20 2', t.coral, { w: 2.6 });
      s += glow(t, id, 'M390 270 C350 330 290 330 250 270 M262 286 l-12 -16 l20 -2', t.mint, { w: 2.6 });
      s += panel(t, 270, 196, 100, 34, 17) + txt(t, '3 changed', 320, 218, 14, { c: t.text, a: 'middle' });
      return s;
    },
  },
  'fingerprint-lit': {
    title: 'A fingerprint drawn with rings of light and a short matching code below it',
    draw: (t, id) => {
      let s = grid(t, id) + halo(id, 320, 170, 180);
      const rings = [];
      for (let k = 0; k < 6; k++) {
        const r = 18 + k * 16;
        rings.push(`M${320 - r} ${176 + k * 4} C${320 - r} ${176 - r * 1.25} ${320 + r} ${176 - r * 1.25} ${320 + r} ${176 + k * 6}`);
      }
      s += glow(t, id, rings.join(''), `url(#${id}g)`, { w: 2.4 });
      s += panel(t, 190, 300, 260, 50, 25) + txt(t, '4188 2276 8949', 320, 333, 22, { a: 'middle', w: 800, mono: true });
      return s;
    },
  },
  'relay-lit': {
    title: 'A relay node passing sealed envelopes it cannot open between two devices',
    draw: (t, id) => {
      let s = grid(t, id) + halo(id, 320, 150, 170, 'rc');
      s += deviceOutline(t, id, 'phone', 70, 200, 1) + deviceOutline(t, id, 'laptop', 420, 220, 1);
      s += glow(t, id, 'M306 230 L314 120 H326 L334 230 Z M290 230 H350', t.coral, { w: 2 });
      s += glow(t, id, 'M296 100 a30 30 0 0 1 48 0 M284 86 a46 46 0 0 1 72 0', t.coral, { w: 2 });
      s += `<path d="M140 220 C190 130 250 110 300 120 M340 120 C400 110 460 150 500 214" fill="none" stroke="${t.soft}" stroke-width="2" stroke-dasharray="3 8"/>`;
      for (const [x, y] of [[214, 140], [420, 140]]) s += glow(t, id, `M${x - 20} ${y - 13}h40v26h-40ZM${x - 20} ${y - 13}l20 15 20 -15`, t.mint, { w: 1.8 });
      return s;
    },
  },
  'library-lit': {
    title: 'A stack of received files kept in a local library on your own device',
    draw: (t, id) => {
      let s = grid(t, id) + halo(id, 320, 210, 200);
      const colors = [t.blue, t.coral, t.mint, t.sun];
      for (let i = 3; i >= 0; i--) {
        const x = 200 + i * 26, y = 110 + i * 34;
        s += panel(t, x, y, 220, 120, 14) + glow(t, id, `M${x + 18} ${y + 22}h28v34h-28Z`, colors[i], { w: 1.8 }) + `<rect x="${x + 60}" y="${y + 26}" width="120" height="8" rx="4" fill="${t.soft}"/><rect x="${x + 60}" y="${y + 44}" width="80" height="8" rx="4" fill="${t.faint}"/>`;
      }
      return s;
    },
  },
  'preview-lit': {
    title: 'Media frames for a photo, a video with a play button and a waveform, previewed before saving',
    draw: (t, id) => {
      let s = grid(t, id) + halo(id, 320, 200, 210);
      s += panel(t, 90, 110, 150, 110) + glow(t, id, 'M108 200 l36 -44 26 26 16 -14 36 32Z', t.blue, { w: 2 }) + `<circle cx="210" cy="140" r="9" fill="${t.sun}"/>`;
      s += panel(t, 250, 80, 170, 130) + glow(t, id, 'M318 120 l36 25 -36 25Z', t.coral, { w: 2.6 });
      s += panel(t, 430, 120, 140, 100);
      let wave = 'M446 170';
      for (let i = 0; i < 18; i++) wave += ` L${452 + i * 6} ${170 + Math.sin(i * 1.3) * (8 + (i % 5) * 4)}`;
      s += glow(t, id, wave, t.mint, { w: 1.6 });
      s += panel(t, 180, 250, 280, 80) + `<rect x="200" y="272" width="200" height="8" rx="4" fill="${t.soft}"/><rect x="200" y="292" width="150" height="8" rx="4" fill="${t.faint}"/><rect x="200" y="312" width="180" height="8" rx="4" fill="${t.faint}"/>`;
      return s;
    },
  },
  'device-trio': {
    title: 'A phone, a laptop and a desktop joined by arcs of light',
    draw: (t, id) => {
      let s = grid(t, id) + halo(id, 320, 210, 230);
      s += deviceOutline(t, id, 'phone', 70, 190, 1, t.blue) + deviceOutline(t, id, 'laptop', 240, 210, 1, t.mint) + deviceOutline(t, id, 'desktop', 440, 150, 0.9, t.coral);
      s += glow(t, id, 'M132 210 C180 120 250 120 290 200 M410 240 C430 170 460 150 500 150 M120 320 C250 380 420 380 520 290', `url(#${id}g)`, { w: 1.6, op: 0.85 });
      return s;
    },
  },
  'offline-mesh': {
    title: 'Devices on one local network connecting with no internet, a crossed out globe above them',
    draw: (t, id) => {
      let s = grid(t, id) + halo(id, 320, 230, 200);
      s += glow(t, id, 'M320 70m-34 0a34 34 0 1 0 68 0a34 34 0 1 0 -68 0M286 70h68M320 36c-14 14 -14 54 0 68M320 36c14 14 14 54 0 68', t.sub, { w: 1.6, op: 0.7, core: false });
      s += glow(t, id, 'M282 30 L358 110', t.coral, { w: 2.6 });
      const nodes = [[180, 250], [320, 200], [460, 250], [250, 330], [390, 330]];
      let links = '';
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) links += `M${nodes[i][0]} ${nodes[i][1]}L${nodes[j][0]} ${nodes[j][1]}`;
      s += glow(t, id, links, t.blue, { w: 1, op: 0.55, core: false });
      nodes.forEach(([x, y], i) => { s += glow(t, id, `M${x} ${y}m-14 0a14 14 0 1 0 28 0a14 14 0 1 0 -28 0`, i === 1 ? t.mint : t.blue, { w: 2, fill: t.panel }); });
      return s;
    },
  },
  'any-size': {
    title: 'A very large file shown as a tall stack of light chunks with no ceiling above it',
    draw: (t, id) => {
      let s = grid(t, id) + halo(id, 320, 260, 220);
      for (let i = 0; i < 9; i++) {
        const w = 220 - i * 6, y = 330 - i * 30;
        s += `<rect x="${320 - w / 2}" y="${y}" width="${w}" height="20" rx="6" fill="${i % 4 === 3 ? t.coral : t.blue}" opacity="${0.18 + i * 0.07}"/>`;
      }
      s += glow(t, id, 'M210 60 H430', t.soft, { w: 1.4, core: false, op: 0.6 }) + `<path d="M320 64 V40 M310 50 L320 40 L330 50" stroke="${t.coral}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      s += txt(t, 'no size limit set by filefinch', 320, 30, 14, { c: t.sub, a: 'middle', w: 600 });
      return s;
    },
  },
};

export function litSVG(name, theme = 'dark', { w = W, h = H } = {}) {
  const t = LIT_THEME[theme];
  const id = uid('l');
  const a = LIT[name];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${w}" height="${h}" role="img" aria-labelledby="${id}t"><title id="${id}t">${a.title}</title>${defs(t, id)}${a.draw(t, id)}</svg>`;
}

/** Theme made of CSS custom properties, for SVG inlined in the page. */
const VAR_THEME = { line: 'var(--lx-line)', soft: 'var(--lx-soft)', faint: 'var(--lx-faint)', blue: 'var(--lx-blue)', blue2: 'var(--lx-blue2)', coral: 'var(--lx-coral)', sun: 'var(--lx-sun)', mint: 'var(--lx-mint)', core: 'var(--lx-core)', glow: 1, panel: 'var(--lx-panel)', panelLine: 'var(--lx-panel-line)', text: 'var(--lx-text)', sub: 'var(--lx-sub)' };

/**
 * The hero object: a finch in flight made of light, split in layers that
 * move at different depths with the pointer (data-depth on each group).
 */
export function heroObjectSVG() {
  const t = VAR_THEME;
  const id = 'hx';
  const layers = [];
  const T = (d) => d;
  let trails = '';
  for (let i = 0; i < 9; i++) {
    const y = 140 + i * 15;
    trails += `<path class="hx-trail" style="--i:${i}" d="M${-120 + i * 12} ${y + 40} C40 ${y + 22} 150 ${y - 2} ${236 + i * 6} ${y - 8}" fill="none" stroke="url(#${id}fade)" stroke-width="${1.1 + (i % 3) * 0.55}" stroke-linecap="round" opacity="${0.35 + (i % 2) * 0.35}"/>`;
  }
  layers.push(`<g class="hx-l" data-depth="0.25">${trails}</g>`);
  const feathers = [];
  for (let k = 0; k < 7; k++) feathers.push(`M${352 - k * 10} ${176 + k * 3} C${318 - k * 8} ${118 - k * 2} ${282 - k * 10} ${78 + k * 2} ${236 - k * 17} ${36 + k * 12}`);
  layers.push(`<g class="hx-l hx-wing" data-depth="0.55">${glow(t, id, T(feathers.join('')), t.blue, { w: 1.7 })}</g>`);
  const body = 'M446 176 C440 150 416 134 390 140 C364 146 346 166 330 184 C300 214 262 232 222 238 L166 246 M222 238 L150 284 M226 236 C268 252 330 250 372 226 C404 210 430 200 446 176';
  layers.push(`<g class="hx-l" data-depth="0.8">${glow(t, id, body, `url(#${id}g)`, { w: 2.8 })}${glow(t, id, 'M446 166 L476 176 L446 186', t.sun, { w: 2.2 })}<circle cx="418" cy="162" r="4.8" fill="${t.line}"/>${glow(t, id, 'M372 190 C346 176 300 180 268 206 C306 214 344 210 372 190 Z', t.coral, { w: 1.8 })}${glow(t, id, 'M352 236 L340 286 M378 222 L372 282', t.line, { w: 1, op: 0.55, core: false })}</g>`);
  layers.push(`<g class="hx-l hx-parcel" data-depth="1.2">${litParcel(t, id, 356, 318, 0.95)}</g>`);
  return `<svg class="hx-svg" viewBox="-40 0 600 420" role="img" aria-labelledby="hx-t"><title id="hx-t">A finch in flight drawn with light trails, carrying a glowing parcel</title>${defs(t, id)}<circle cx="330" cy="220" r="230" fill="url(#${id}r)"/>${layers.join('')}</svg>`;
}

/** A small glowing parcel or feather for the received burst. */
export function burstSymbols() {
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="b-parcel" viewBox="-12 -12 24 24"><path d="M-9 -4 L0 -9 L9 -4 L0 1 Z" fill="#FFC86B"/><path d="M-9 -4 L0 1 V10 L-9 5 Z" fill="#FF9B66"/><path d="M9 -4 L0 1 V10 L9 5 Z" fill="#E8743B"/><path d="M-4.5 -6.5 L4.5 -1.5 V8" stroke="#7A4B22" stroke-width="1.2" fill="none"/></symbol><symbol id="b-feather" viewBox="-12 -12 24 24"><path d="M-8 9 C-6 0 0 -8 9 -10 C8 -2 2 6 -8 9 Z" fill="#FF7A45"/><path d="M-8 9 L5 -6" stroke="#FFF3DF" stroke-width="1" fill="none"/></symbol><symbol id="b-spark" viewBox="-12 -12 24 24"><path d="M0 -9 L2 -2 L9 0 L2 2 L0 9 L-2 2 L-9 0 L-2 -2 Z" fill="#7AB8FF"/></symbol></svg>`;
}

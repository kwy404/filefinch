// Seasonal art for filefinch: Finn in a costume for each special date, three
// seasonal icons in the house icon style, and a wide hero accent. Light and
// dark versions. Written to assets/seasons/<id>/ and docs/assets/seasons/<id>/
// by build-art.mjs. Every shape is drawn here by hand.
import { PAL } from './palette.mjs';
import { finnSticker } from './finn.mjs';
import { ICON_THEME } from './icons.mjs';

export const SEASON_IDS = ['newyear', 'carnival', 'easter', 'valentine', 'junina', 'halloween', 'christmas'];

/** Muted seasonal colors per theme: a, b and c accents plus a deep tone. */
export const SEASON_PAL = {
  newyear: { light: ['#C9971C', '#2F6FED', '#D9654A', '#10244A'], dark: ['#F2C96B', '#8FB6FF', '#FF9B7A', '#EAF1FF'] },
  carnival: { light: ['#8A4FD8', '#E0A21B', '#1E9E8A', '#4A2A86'], dark: ['#B48CFF', '#FFD06B', '#5BE0C8', '#E6DAFF'] },
  easter: { light: ['#5C9EE6', '#E68AA8', '#79B85A', '#6B4A2A'], dark: ['#9CC8FF', '#FFB3C7', '#A8DE8A', '#E8C9A0'] },
  valentine: { light: ['#D9466B', '#F08AA4', '#B8325A', '#7A1F3D'], dark: ['#FF7C9C', '#FFB3C6', '#FF9BB6', '#FFD9E3'] },
  junina: { light: ['#D9732B', '#E0B23C', '#2F8F6B', '#7A4B22'], dark: ['#FF9F5A', '#FFD06B', '#5FD6A6', '#F2C894'] },
  halloween: { light: ['#E07A1F', '#6A3FA0', '#2E7D5B', '#2A1B3F'], dark: ['#FF9F45', '#B48CFF', '#6FD6A0', '#E8DDF7'] },
  christmas: { light: ['#C8384A', '#2E8A5E', '#D9A62B', '#1E3A5F'], dark: ['#FF7A88', '#5FD39A', '#FFD06B', '#EAF4FF'] },
};

/** A shape with Finn's sticker rim behind it. */
const rimmed = (p, d, fill, w = 14, extra = '') => `<path d="${d}" fill="${p.rim}" stroke="${p.rim}" stroke-width="${w}" stroke-linejoin="round"/><path d="${d}" fill="${fill}"${extra}/>`;
const heart = (x, y, s) => `M${x} ${y + s * 0.35} C${x} ${y} ${x - s * 0.5} ${y - s * 0.2} ${x - s * 0.5} ${y + s * 0.15} C${x - s * 0.5} ${y + s * 0.45} ${x - s * 0.15} ${y + s * 0.7} ${x} ${y + s * 0.85} C${x + s * 0.15} ${y + s * 0.7} ${x + s * 0.5} ${y + s * 0.45} ${x + s * 0.5} ${y + s * 0.15} C${x + s * 0.5} ${y - s * 0.2} ${x} ${y} ${x} ${y + s * 0.35} Z`;
const burst = (x, y, r, color, n = 10, w = 4) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  const r0 = r * 0.35;
  return `<path d="M${(x + Math.cos(a) * r0).toFixed(1)} ${(y + Math.sin(a) * r0).toFixed(1)} L${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/><circle cx="${(x + Math.cos(a) * (r + 7)).toFixed(1)}" cy="${(y + Math.sin(a) * (r + 7)).toFixed(1)}" r="${(w * 0.6).toFixed(1)}" fill="${color}"/>`;
}).join('');

/** The costume layers drawn over Finn, in his 400 box. Returns [behind, front]. */
function costume(id, theme) {
  const p = PAL[theme];
  const [a, b, c, deep] = SEASON_PAL[id][theme];
  const dark = theme === 'dark';
  switch (id) {
    case 'newyear': return [
      `<g opacity=".9">${burst(78, 92, 46, a, 12, 5)}${burst(352, 58, 30, b, 10, 4)}${burst(40, 200, 22, c, 8, 3.5)}</g>`,
      `${rimmed(p, 'M190 78 L238 -14 L270 70 Z', a)}<path d="M200 60 L247 4 M214 72 L254 22 M232 72 L262 44" stroke="${dark ? '#14244D' : '#FFFFFF'}" stroke-width="7" stroke-linecap="round" opacity=".85"/><circle cx="238" cy="-16" r="13" fill="${p.rim}"/><circle cx="238" cy="-16" r="9" fill="${c}"/>`,
    ];
    case 'carnival': {
      const conf = [[60, 80, a, 20], [110, 40, b, -30], [330, 30, c, 40], [370, 110, a, -15], [40, 170, c, 60], [350, 210, b, 10], [70, 330, a, -40]]
        .map(([x, y, col, r]) => `<rect x="${x - 7}" y="${y - 4}" width="14" height="8" rx="2" fill="${col}" transform="rotate(${r} ${x} ${y})"/>`).join('');
      return [
        `${conf}<path d="M20 120 C60 100 80 150 120 128 C150 112 160 150 190 136" fill="none" stroke="${b}" stroke-width="5" stroke-linecap="round" opacity=".8"/>`,
        `${rimmed(p, 'M226 150 C242 132 282 132 300 146 C306 168 294 184 272 180 C264 170 254 170 246 180 C226 184 218 168 226 150 Z', a)}
<path d="M226 150 C242 132 282 132 300 146" fill="none" stroke="${b}" stroke-width="5" stroke-linecap="round"/>
<circle cx="258" cy="158" r="14" fill="${dark ? '#0B0B0E' : p.ink}"/><circle cx="263" cy="153" r="4.5" fill="#FFFFFF"/>
<path d="M300 146 C318 120 330 96 326 70 C340 96 336 124 304 152 Z" fill="${c}" stroke="${p.rim}" stroke-width="5" stroke-linejoin="round"/>
<path d="M302 150 C330 132 352 120 364 98 C366 124 344 142 306 156 Z" fill="${b}" stroke="${p.rim}" stroke-width="5" stroke-linejoin="round"/>`,
      ];
    }
    case 'easter': {
      const egg = (x, y, col, rot) => `<g transform="rotate(${rot} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="17" ry="22" fill="${col}" stroke="${p.rim}" stroke-width="5"/><path d="M${x - 15} ${y} l7 -6 l8 6 l8 -6 l7 6" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linejoin="round" opacity=".9"/></g>`;
      return [
        '',
        `<path d="M236 282 C236 226 330 226 330 282" fill="none" stroke="${p.rim}" stroke-width="16" stroke-linecap="round"/><path d="M236 282 C236 226 330 226 330 282" fill="none" stroke="${deep}" stroke-width="7" stroke-linecap="round"/>
${egg(258, 270, a, -12)}${egg(290, 264, b, 6)}${egg(316, 276, c, 16)}
${rimmed(p, 'M222 280 L344 280 L330 338 C328 346 322 350 314 350 L252 350 C244 350 238 346 236 338 Z', dark ? '#B4793A' : '#D9A066')}
<path d="M228 298 H340 M234 318 H334 M258 282 V348 M284 282 V350 M310 282 V348" stroke="${dark ? '#7A4B22' : '#A86F36'}" stroke-width="3.5" opacity=".75"/>`,
      ];
    }
    case 'valentine': return [
      `<path d="M128 262 C110 200 120 150 92 112" fill="none" stroke="${p.soft}" stroke-width="3.5" stroke-linecap="round"/>
${rimmed(p, heart(90, 26, 120), a, 12)}<path d="M62 50 C58 64 62 76 70 84" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".7"/>
<path d="${heart(350, 70, 34)}" fill="${b}"/><path d="${heart(372, 150, 22)}" fill="${c}" opacity=".8"/>`,
      `<ellipse cx="270" cy="186" rx="15" ry="9" fill="${b}" opacity=".9"/>`,
    ];
    case 'junina': {
      const flame = `<path d="M346 344 C320 330 322 300 340 280 C340 300 352 304 354 290 C360 270 352 256 362 240 C374 268 392 290 388 316 C386 336 370 346 346 344 Z" fill="${a}"/><path d="M352 342 C338 334 340 316 350 306 C352 318 360 318 362 308 C372 320 378 334 368 342 Z" fill="${b}"/>`;
      return [
        `<g>${flame}<path d="M318 352 L392 336 M322 336 L394 354" stroke="${dark ? '#B4793A' : '#8A5A2B'}" stroke-width="11" stroke-linecap="round"/></g>`,
        `${rimmed(p, 'M120 124 C150 102 290 96 326 116 C320 134 140 144 120 124 Z', dark ? '#D9B060' : '#E8C26A')}
${rimmed(p, 'M164 118 C164 74 188 50 224 50 C262 50 284 76 284 114 C246 108 202 110 164 118 Z', dark ? '#E8C47A' : '#F2D27C')}
<path d="M166 108 C204 98 248 96 284 104" fill="none" stroke="${a}" stroke-width="9"/>
<path d="M190 70 L202 66 M214 58 L226 56 M244 60 L256 64 M200 88 L212 86 M236 82 L250 84" stroke="${dark ? '#B4793A' : '#C99A44'}" stroke-width="3.5" stroke-linecap="round"/>
<rect x="250" y="72" width="16" height="14" rx="2" fill="${c}" transform="rotate(8 258 79)"/>`,
      ];
    }
    case 'halloween': {
      const pumpkin = `<g><ellipse cx="342" cy="324" rx="40" ry="32" fill="${p.rim}"/><ellipse cx="324" cy="326" rx="20" ry="28" fill="${a}"/><ellipse cx="360" cy="326" rx="20" ry="28" fill="${a}"/><ellipse cx="342" cy="326" rx="20" ry="30" fill="${dark ? '#FFB062' : '#F09234'}"/>
<path d="M340 296 C338 286 342 280 350 276" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
<path d="M326 316 l8 -9 l7 9 Z M346 316 l8 -9 l7 9 Z M324 334 C334 344 352 344 362 334 L356 340 L350 334 L344 341 L338 334 L332 340 Z" fill="${deep === '#E8DDF7' ? '#2A1B3F' : deep}"/></g>`;
      return [
        pumpkin,
        `${rimmed(p, 'M114 120 C150 100 296 94 330 112 C320 132 136 140 114 120 Z', b)}
${rimmed(p, 'M164 116 C186 80 208 44 222 -4 C236 4 250 18 258 30 C246 34 248 46 262 50 C272 74 280 94 290 112 C248 106 204 108 164 116 Z', b)}
<path d="M168 104 C208 96 250 94 288 100" fill="none" stroke="${a}" stroke-width="10"/>
<rect x="216" y="92" width="18" height="16" rx="2" fill="none" stroke="${dark ? '#FFD06B' : '#E0A21B'}" stroke-width="4"/>`,
      ];
    }
    case 'christmas': {
      const flakes = [[60, 70, 7], [120, 30, 5], [350, 40, 8], [380, 150, 5], [40, 210, 6], [366, 250, 4], [90, 130, 4]]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${dark ? '#EAF4FF' : '#A9C9F0'}" opacity=".9"/>`).join('');
      return [
        flakes,
        `${rimmed(p, 'M148 222 C188 240 252 240 294 220 L300 244 C256 266 186 266 142 246 Z', a)}
<path d="M164 232 L160 254 M190 238 L188 260 M218 240 L218 262 M246 238 L248 260 M272 232 L276 254" stroke="#FFFFFF" stroke-width="5" opacity=".8"/>
${rimmed(p, 'M170 246 L156 312 L186 316 L194 252 Z', a)}<path d="M160 300 L186 304" stroke="#FFFFFF" stroke-width="5" opacity=".8"/>
<path d="M150 122 C170 100 196 92 222 92 C252 92 280 98 300 114 C304 124 296 128 288 124 C268 118 248 116 222 116 C196 116 172 122 158 130 C148 134 144 128 150 122 Z" fill="#FFFFFF" opacity="${dark ? '.92' : '1'}"/>
<path d="M200 60 C210 52 236 50 246 60" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>`,
      ];
    }
    default: return ['', ''];
  }
}

/** Finn in costume, standalone file. */
export function seasonFinnSVG(id, theme = 'light') {
  const [behind, front] = costume(id, theme);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -40 420 420" width="420" height="420" role="img" aria-labelledby="t">
<title id="t">Finn the finch courier dressed for ${TITLES[id]}</title>
${behind}
${finnSticker(theme)}
${front}
</svg>`;
}

const TITLES = { newyear: 'the New Year', carnival: 'Carnival', easter: 'Easter', valentine: "Valentine's Day", junina: 'midsummer', halloween: 'Halloween', christmas: 'Christmas' };

// ---------- Icons, 48 box, same tokens as icons.mjs ----------

export const SEASON_ICONS = {
  newyear: {
    firework: '<circle cx="24" cy="24" r="4" fill="A" stroke="none"/><path d="M24 5v8M24 35v8M5 24h8M35 24h8M11 11l5.5 5.5M31.5 31.5L37 37M11 37l5.5-5.5M31.5 16.5L37 11" stroke="L"/><circle cx="38" cy="6" r="2" fill="B" stroke="none"/><circle cx="8" cy="42" r="2" fill="B" stroke="none"/>',
    clock: '<circle cx="24" cy="25" r="17" fill="F" stroke="L"/><path d="M24 25V13M24 25l2-11" stroke="A"/><path d="M24 9.5v2M24 38.5v2M8.5 25h2M37.5 25h2" stroke="L"/><circle cx="24" cy="25" r="2" fill="L" stroke="none"/>',
    glass: '<path d="M15 5h18l-2 15a7 7 0 0 1-14 0Z" fill="F" stroke="L"/><path d="M24 27v12M16 42h16" stroke="L"/><circle cx="21" cy="14" r="1.6" fill="A" stroke="none"/><circle cx="27" cy="11" r="1.6" fill="A" stroke="none"/><circle cx="25" cy="17" r="1.6" fill="B" stroke="none"/>',
  },
  carnival: {
    mask: '<path d="M5 18c6-5 32-5 38 0 1 9-4 16-12 15-3-3-11-3-14 0-8 1-13-6-12-15Z" fill="F" stroke="L"/><ellipse cx="16" cy="22" rx="4" ry="3" fill="W" stroke="L"/><ellipse cx="32" cy="22" rx="4" ry="3" fill="W" stroke="L"/><path d="M5 18c-1 6 0 14-2 20M43 18c3-5 4-10 2-14" stroke="A"/>',
    confetti: '<rect x="8" y="8" width="8" height="5" rx="1.5" fill="A" stroke="none" transform="rotate(20 12 10)"/><rect x="30" y="6" width="8" height="5" rx="1.5" fill="B" stroke="none" transform="rotate(-25 34 8)"/><rect x="20" y="22" width="8" height="5" rx="1.5" fill="M" stroke="none" transform="rotate(40 24 24)"/><path d="M6 36c6-6 10 4 16-2s10 4 20-4" stroke="L"/><circle cx="38" cy="22" r="2" fill="A" stroke="none"/><circle cx="10" cy="24" r="2" fill="B" stroke="none"/>',
    drum: '<ellipse cx="24" cy="17" rx="16" ry="6" fill="W" stroke="L"/><path d="M8 17v15c0 3 7 6 16 6s16-3 16-6V17" fill="F" stroke="L"/><path d="M8 22l8 14M24 23v15M40 22l-8 14" stroke="A"/><path d="M30 4l-6 12M40 6l-10 10" stroke="L"/>',
  },
  easter: {
    egg: '<path d="M24 5c8 0 15 13 15 23a15 15 0 0 1-30 0C9 18 16 5 24 5Z" fill="F" stroke="L"/><path d="M10 25l5-4 5 4 4-4 5 4 5-4 5 4" stroke="A"/><circle cx="18" cy="33" r="2" fill="B" stroke="none"/><circle cx="30" cy="33" r="2" fill="B" stroke="none"/>',
    basket: '<path d="M10 22c0-12 28-12 28 0" stroke="L"/><ellipse cx="18" cy="20" rx="5" ry="6" fill="A" stroke="L"/><ellipse cx="29" cy="20" rx="5" ry="6" fill="B" stroke="L"/><path d="M5 22h38l-4 17a3 3 0 0 1-3 2H12a3 3 0 0 1-3-2Z" fill="F" stroke="L"/><path d="M8 30h32M19 22v19M29 22v19" stroke="L"/>',
    tulip: '<path d="M24 44V22" stroke="M"/><path d="M24 34c-5-1-9-5-10-10 5 1 9 4 10 10ZM24 38c5-1 9-5 10-10-5 1-9 4-10 10Z" fill="M" stroke="M"/><path d="M15 8l5 5 4-8 4 8 5-5v9a9 9 0 0 1-18 0Z" fill="A" stroke="L"/>',
  },
  valentine: {
    heart: '<path d="M24 41S6 30 6 17a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 13-18 24-18 24Z" fill="F" stroke="L"/><path d="M13 15a4 4 0 0 1 4-3" stroke="A"/>',
    letter: '<rect x="5" y="11" width="38" height="27" rx="3" fill="W" stroke="L"/><path d="M5 13l19 14 19-14" stroke="L"/><path d="M24 36s-7-4-7-9a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 5-7 9-7 9Z" fill="A" stroke="none"/>',
    balloon: '<path d="M24 31S9 22 9 12a7.5 7.5 0 0 1 15-2.5A7.5 7.5 0 0 1 39 12c0 10-15 19-15 19Z" fill="F" stroke="L"/><path d="M24 31l-2 3h4Z" fill="L" stroke="L"/><path d="M24 34c-3 4 3 6 0 10" stroke="A"/>',
  },
  junina: {
    bonfire: '<path d="M24 6c6 7 11 12 11 20a11 11 0 0 1-22 0c0-5 3-8 5-11 1 4 3 5 4 5 0-6 0-10 2-14Z" fill="F" stroke="L"/><path d="M24 34c-3 0-5-2-5-5 0-2 2-4 3-6 1 2 2 3 3 3 1-1 1-3 1-4 2 2 3 5 3 7 0 3-2 5-5 5Z" fill="A" stroke="none"/><path d="M8 42l32-6M8 36l32 6" stroke="L"/>',
    flags: '<path d="M3 9c14 7 28 7 42 0" stroke="L"/><path d="M8 11l3 13 5-11Z" fill="A" stroke="L"/><path d="M19 14l2 13 5-13Z" fill="B" stroke="L"/><path d="M30 14l1 13 5-12Z" fill="M" stroke="L"/><path d="M39 12l-1 12 5-13" fill="F" stroke="L"/><path d="M6 33c12 5 24 5 36 0" stroke="L"/><path d="M14 35l3 9 4-8Z" fill="B" stroke="L"/><path d="M27 36l3 9 4-9Z" fill="A" stroke="L"/>',
    corn: '<path d="M24 5c6 0 9 9 9 19s-4 15-9 15-9-5-9-15 3-19 9-19Z" fill="F" stroke="L"/><path d="M19 14h10M17 21h14M17 28h14M24 6v32" stroke="A"/><path d="M15 26c-6 4-8 10-7 17 5-2 11-6 14-8M33 26c6 4 8 10 7 17-5-2-11-6-14-8" fill="M" stroke="L"/>',
  },
  halloween: {
    pumpkin: '<path d="M24 12c-2-4-1-7 3-8" stroke="M"/><ellipse cx="16" cy="28" rx="10" ry="13" fill="F" stroke="L"/><ellipse cx="32" cy="28" rx="10" ry="13" fill="F" stroke="L"/><ellipse cx="24" cy="28" rx="9" ry="14" fill="F" stroke="L"/><path d="M17 24l3-4 3 4ZM25 24l3-4 3 4Z" fill="A" stroke="none"/><path d="M17 33c4 4 10 4 14 0" stroke="A"/>',
    bat: '<path d="M24 18c-3 0-4 3-4 5-3-5-9-7-16-5 4 2 5 5 5 8 3-2 6-2 8 1 1-2 4-3 7-1 3-2 6-1 7 1 2-3 5-3 8-1 0-3 1-6 5-8-7-2-13 0-16 5 0-2-1-5-4-5Z" fill="F" stroke="L"/><path d="M21 15l1 4M27 15l-1 4" stroke="L"/><circle cx="22.5" cy="22" r="1.2" fill="A" stroke="none"/><circle cx="25.5" cy="22" r="1.2" fill="A" stroke="none"/>',
    ghost: '<path d="M10 42V20a14 14 0 0 1 28 0v22l-5-4-5 4-4-4-4 4-5-4Z" fill="W" stroke="L"/><circle cx="19" cy="21" r="2.4" fill="L" stroke="none"/><circle cx="29" cy="21" r="2.4" fill="L" stroke="none"/><path d="M21 29c2 2 4 2 6 0" stroke="A"/>',
  },
  christmas: {
    tree: '<path d="M24 6l9 12h-5l8 10h-5l8 10H9l8-10h-5l8-10h-5Z" fill="F" stroke="L"/><path d="M21 38v5h6v-5" stroke="L"/><circle cx="20" cy="24" r="1.8" fill="A" stroke="none"/><circle cx="28" cy="31" r="1.8" fill="B" stroke="none"/><path d="M24 2l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.4-2.5 1.4.5-2.8-2-2 2.8-.4Z" fill="A" stroke="none"/>',
    snowflake: '<path d="M24 5v38M7.5 14.5l33 19M7.5 33.5l33-19" stroke="B"/><path d="M19 8l5 4 5-4M19 40l5-4 5 4M8 21l6-1 1-6M40 27l-6 1-1 6M8 27l6 1 1 6M40 21l-6-1-1-6" stroke="L"/><circle cx="24" cy="24" r="3" fill="A" stroke="none"/>',
    gift: '<rect x="7" y="18" width="34" height="24" rx="3" fill="F" stroke="L"/><rect x="5" y="12" width="38" height="8" rx="2" fill="W" stroke="L"/><path d="M24 12v30" stroke="A"/><path d="M24 12c-3-6-11-7-11-2 0 3 6 2 11 2ZM24 12c3-6 11-7 11-2 0 3-6 2-11 2Z" fill="A" stroke="L"/>',
  },
};

const paint = (src, theme) => {
  const t = ICON_THEME[theme];
  return src.replace(/(fill|stroke)="([LFABWM])"/g, (_, k, v) => `${k}="${t[v]}"`);
};

export function seasonIconSVG(id, name, theme = 'light', size = 48) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${paint(SEASON_ICONS[id][name], theme)}</svg>`;
}

// ---------- Hero accents, 1200 by 220, drawn across the top of the hero ----------

function accentBody(id, theme) {
  const [a, b, c, deep] = SEASON_PAL[id][theme];
  const dark = theme === 'dark';
  const line = dark ? 'rgba(234,241,255,.35)' : 'rgba(16,36,74,.28)';
  const sag = (x1, x2, y, d) => `M${x1} ${y} Q${(x1 + x2) / 2} ${y + d} ${x2} ${y}`;
  const along = (x1, x2, y, d, t) => [x1 + (x2 - x1) * t, y + 2 * d * t * (1 - t)];
  switch (id) {
    case 'newyear': return `${burst(980, 80, 54, a, 14, 3)}${burst(1110, 140, 34, b, 10, 2.6)}${burst(860, 40, 24, c, 8, 2.4)}${burst(160, 60, 30, b, 10, 2.4)}<g fill="${a}">${[[700, 30], [760, 110], [1040, 190], [300, 40], [80, 150]].map(([x, y]) => `<path d="M${x} ${y - 7}l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/>`).join('')}</g>`;
    case 'carnival': {
      const cols = [a, b, c];
      let s = '';
      for (let i = 0; i < 46; i++) {
        const x = (i * 263) % 1200, y = 14 + ((i * 97) % 180), r = (i * 47) % 180;
        s += `<rect x="${x}" y="${y}" width="${10 + (i % 3) * 3}" height="6" rx="1.5" fill="${cols[i % 3]}" opacity="${0.55 + (i % 4) * 0.1}" transform="rotate(${r} ${x} ${y})"/>`;
      }
      return `${s}<path d="M640 0 C660 40 610 60 640 100 C665 132 625 150 646 190" fill="none" stroke="${a}" stroke-width="4" stroke-linecap="round" opacity=".7"/><path d="M1020 0 C1000 36 1050 60 1024 96 C1004 124 1044 146 1030 176" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" opacity=".7"/>`;
    }
    case 'easter': {
      const egg = (x, y, col, r) => `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="15" ry="20" fill="${col}"/><path d="M${x - 13} ${y} l6 -5 l7 5 l7 -5 l6 5" fill="none" stroke="${dark ? '#0B0B0E' : '#FFFFFF'}" stroke-width="2.6" opacity=".55"/></g>`;
      const flower = (x, y, col) => `<g>${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="${x}" cy="${y - 8}" rx="5" ry="8" fill="${col}" transform="rotate(${r} ${x} ${y})"/>`).join('')}<circle cx="${x}" cy="${y}" r="4.5" fill="${b === col ? a : b}"/></g>`;
      return `<path d="M760 200 C860 186 1000 192 1200 182" fill="none" stroke="${c}" stroke-width="3" opacity=".6"/>${egg(840, 172, a, -14)}${egg(900, 168, b, 8)}${egg(1090, 160, c, -6)}${flower(960, 150, b)}${flower(1150, 120, a)}${flower(780, 120, c)}${flower(120, 60, b)}`;
    }
    case 'valentine': return [[880, 60, 46, a, 1], [1010, 120, 30, b, 0.8], [1120, 40, 38, c, 0.7], [760, 150, 22, b, 0.6], [180, 50, 26, a, 0.5], [320, 140, 16, b, 0.5]]
      .map(([x, y, s, col, o]) => `<path d="${heart(x, y - s / 2, s)}" fill="none" stroke="${col}" stroke-width="3" opacity="${o}"/>`).join('');
    case 'junina': {
      const cols = [a, b, c, deep];
      let s = '';
      for (const [x1, x2, y, d, n] of [[0, 620, 10, 70, 11], [580, 1200, 10, 80, 11]]) {
        s += `<path d="${sag(x1, x2, y, d)}" fill="none" stroke="${line}" stroke-width="2"/>`;
        for (let i = 1; i < n; i++) {
          const [x, yy] = along(x1, x2, y, d, i / n);
          s += `<path d="M${(x - 15).toFixed(1)} ${yy.toFixed(1)} L${(x + 15).toFixed(1)} ${yy.toFixed(1)} L${(x + 9).toFixed(1)} ${(yy + 34).toFixed(1)} L${x.toFixed(1)} ${(yy + 26).toFixed(1)} L${(x - 9).toFixed(1)} ${(yy + 34).toFixed(1)} Z" fill="${cols[i % 4]}" opacity=".85"/>`;
        }
      }
      return s;
    }
    case 'halloween': {
      const bat = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0c-3 0-4 3-4 5-3-5-9-7-16-5 4 2 5 5 5 8 3-2 6-2 8 1 1-2 4-3 7-1 3-2 6-1 7 1 2-3 5-3 8-1 0-3 1-6 5-8-7-2-13 0-16 5 0-2-1-5-4-5Z" fill="${deep === '#E8DDF7' ? '#B48CFF' : deep}" opacity=".75"/>`;
      return `<circle cx="1080" cy="80" r="44" fill="${a}" opacity=".35"/><circle cx="1098" cy="70" r="40" fill="${dark ? '#050913' : '#F7F9FD'}" opacity=".9"/>
${bat(900, 60, 1.6)}${bat(980, 140, 1.1)}${bat(780, 100, 0.9)}${bat(200, 70, 1)}
<g fill="none" stroke="${line}" stroke-width="1.6"><path d="M0 0 L140 0 M0 0 L120 70 M0 0 L60 130 M0 0 L0 150"/><path d="M40 0 Q34 22 34 20 Q22 34 18 39 Q4 38 0 40"/><path d="M80 0 Q70 36 68 40 Q48 64 36 78 Q12 76 0 80"/><path d="M118 0 Q104 52 102 60 Q72 96 52 116 Q20 114 0 118"/></g>`;
    }
    case 'christmas': {
      let s = '';
      const cols = [a, b, c];
      for (const [x1, x2, y, d, n] of [[0, 620, 6, 60, 12], [580, 1200, 6, 70, 12]]) {
        s += `<path d="${sag(x1, x2, y, d)}" fill="none" stroke="${line}" stroke-width="2"/>`;
        for (let i = 1; i < n; i++) {
          const [x, yy] = along(x1, x2, y, d, i / n);
          const col = cols[i % 3];
          s += `<rect x="${(x - 3).toFixed(1)}" y="${(yy - 2).toFixed(1)}" width="6" height="6" rx="1" fill="${line}"/><ellipse cx="${x.toFixed(1)}" cy="${(yy + 11).toFixed(1)}" rx="6" ry="9" fill="${col}"/><circle cx="${x.toFixed(1)}" cy="${(yy + 11).toFixed(1)}" r="16" fill="${col}" opacity="${dark ? 0.16 : 0.1}"/>`;
        }
      }
      const flake = (x, y, r) => `<g stroke="${dark ? '#EAF4FF' : '#8FB6E8'}" stroke-width="2" stroke-linecap="round" opacity=".7"><path d="M${x} ${y - r}V${y + r}M${x - r * 0.87} ${y - r / 2}L${x + r * 0.87} ${y + r / 2}M${x - r * 0.87} ${y + r / 2}L${x + r * 0.87} ${y - r / 2}"/></g>`;
      return s + flake(1000, 150, 12) + flake(760, 170, 8) + flake(1140, 120, 9) + flake(240, 150, 9);
    }
    default: return '';
  }
}

export function seasonAccentSVG(id, theme = 'light') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 220" width="1200" height="220" aria-hidden="true">${accentBody(id, theme)}</svg>`;
}

/** Every seasonal file: [path inside the season folder, svg]. */
export function seasonFiles(id) {
  const out = [];
  for (const theme of ['light', 'dark']) {
    const sfx = theme === 'dark' ? '-dark' : '';
    out.push([`finn${sfx}.svg`, seasonFinnSVG(id, theme)]);
    out.push([`accent${sfx}.svg`, seasonAccentSVG(id, theme)]);
    for (const n of Object.keys(SEASON_ICONS[id])) out.push([`icon-${n}${sfx}.svg`, seasonIconSVG(id, n, theme)]);
  }
  return out;
}

// Finn, the filefinch mascot: a small finch courier with a cap, a messenger
// bag and a tiny parcel, drawn as a flat vector sticker. Every shape is
// written by hand in a 400 by 400 box. The sticker rim is the silhouette
// drawn underneath with a wide stroke, so it follows every outline.
import { PAL } from './palette.mjs';

// Outer shapes, shared by the silhouette and the colored layer.
const S = {
  tail: 'M132 238 C108 244 74 252 46 262 C60 270 72 274 84 276 C66 286 52 298 42 312 C80 310 116 298 140 284 Z',
  body: 'M200 167 C258 167 298 206 298 256 C298 306 256 343 200 343 C144 343 102 306 102 256 C102 206 142 167 200 167 Z',
  head: 'M222 70 C268 70 304 106 304 152 C304 198 268 234 222 234 C176 234 140 198 140 152 C140 106 176 70 222 70 Z',
  cap: 'M146 134 C140 92 176 60 222 60 C266 60 300 88 300 126 C276 120 250 118 222 118 C196 118 170 124 146 134 Z',
  visor: 'M282 112 C306 106 334 112 350 126 C334 136 306 138 282 132 Z',
  beak: 'M296 150 C318 150 338 160 346 172 C336 184 316 188 296 184 Z',
  bag: 'M86 268 C86 261 91 256 98 256 L160 256 C167 256 172 261 172 268 L172 320 C172 327 167 332 160 332 L98 332 C91 332 86 327 86 320 Z',
  parcel: 'M238 262 L298 252 L314 300 L254 312 Z',
  parcelTop: 'M238 262 L298 252 L308 240 L250 248 Z',
  feetL: 'M172 336 L172 356',
  feetR: 'M222 336 L222 356',
};

function feet(p, color, w) {
  const foot = (x) => `<path d="M${x} 334 L${x} 354 M${x - 11} 360 L${x} 354 L${x + 13} 360 M${x} 354 L${x + 2} 362" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return foot(174) + foot(222);
}

/** The silhouette (for the rim and the shadow). */
function silhouette(fill, stroke, width) {
  const shapes = [S.tail, S.body, S.head, S.cap, S.visor, S.beak, S.bag, S.parcel, S.parcelTop].map((d) => `<path d="${d}"/>`).join('');
  return `<g fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round">${shapes}</g>${feet(null, stroke, width + 7)}`;
}

/** Finn's colored layers, without rim. */
export function finnBody(theme = 'light', { wink = false } = {}) {
  const p = PAL[theme];
  const dark = theme === 'dark';
  const out = [];
  // legs behind the body
  out.push(feet(p, p.beak, 7));
  // tail
  out.push(`<path d="${S.tail}" fill="${p.coral2}"/>`);
  out.push(`<path d="M120 252 C96 258 72 264 56 266 M118 270 C96 282 76 292 60 302" fill="none" stroke="${p.navy2}" stroke-width="5" stroke-linecap="round" opacity=".35"/>`);
  // body and belly
  out.push(`<path d="${S.body}" fill="${p.coral}"/>`);
  out.push(`<path d="M236 196 C276 202 294 236 290 270 C286 308 258 334 226 336 C198 330 186 300 188 266 C190 230 206 200 236 196 Z" fill="${p.cream}"/>`);
  // messenger strap across the chest
  out.push(`<path d="M150 266 L270 196" stroke="${p.navy}" stroke-width="16" stroke-linecap="round"/>`);
  out.push(`<path d="M150 266 L270 196" stroke="${p.sun}" stroke-width="3" stroke-dasharray="6 7" stroke-linecap="round" opacity=".9"/>`);
  // bag
  out.push(`<path d="${S.bag}" fill="${p.navy}"/>`);
  out.push(`<path d="M86 268 C86 261 91 256 98 256 L160 256 C167 256 172 261 172 268 L172 290 C150 300 108 300 86 290 Z" fill="${p.navy2}"/>`);
  out.push(`<rect x="122" y="288" width="14" height="14" rx="3" fill="${p.sun}"/>`);
  // paper plane emblem on the flap
  out.push(`<path d="M110 270 L148 262 L134 284 L128 276 Z" fill="${p.card === '#FFFFFF' ? '#FFFFFF' : p.ink}" opacity=".95"/><path d="M128 276 L148 262" stroke="${p.navy2}" stroke-width="2"/>`);
  // wing reaching forward to hold the parcel
  out.push(`<path d="M160 214 C200 198 246 216 262 254 C272 278 266 298 252 304 C226 300 196 292 172 280 C144 266 136 234 160 214 Z" fill="${p.coral2}"/>`);
  out.push(`<path d="M172 236 C196 236 218 248 232 266 M168 254 C190 258 208 268 222 282" fill="none" stroke="${p.coral}" stroke-width="5" stroke-linecap="round" opacity=".8"/>`);
  // parcel
  out.push(`<path d="${S.parcelTop}" fill="${p.kraft}"/>`);
  out.push(`<path d="M298 252 L308 240 L324 288 L314 300 Z" fill="${p.kraft2}"/>`);
  out.push(`<path d="${S.parcel}" fill="${p.kraft}"/>`);
  out.push(`<path d="M268 257 L284 306 M246 287 L306 276 M268 257 L279 245" fill="none" stroke="${p.string}" stroke-width="4" stroke-linecap="round"/>`);
  out.push(`<path d="M276 282 C268 270 258 274 262 282 C266 288 274 286 276 282 Z M276 282 C284 270 296 274 292 282 C288 288 280 286 276 282 Z" fill="none" stroke="${p.string}" stroke-width="3"/>`);
  // wing tip over the parcel edge
  out.push(`<path d="M244 268 C258 264 268 276 264 290 C258 300 246 300 238 292 C234 282 236 272 244 268 Z" fill="${p.coral2}"/>`);
  // head
  out.push(`<path d="${S.head}" fill="${p.coral}"/>`);
  out.push(`<path d="M256 190 C276 196 292 190 300 176 C298 204 282 224 256 232 C238 226 236 200 256 190 Z" fill="${p.cream}"/>`);
  // cap
  out.push(`<path d="${S.visor}" fill="${p.navy2}"/>`);
  out.push(`<path d="${S.cap}" fill="${p.navy}"/>`);
  out.push(`<path d="M148 126 C170 116 196 110 222 110 C252 110 278 114 300 120" fill="none" stroke="${p.sun}" stroke-width="7" stroke-linecap="round"/>`);
  out.push(`<path d="M206 78 C214 66 232 66 240 78" fill="none" stroke="${p.navy2}" stroke-width="5" stroke-linecap="round"/>`);
  out.push(`<circle cx="222" cy="62" r="7" fill="${p.navy2}"/>`);
  // beak
  out.push(`<path d="${S.beak}" fill="${p.beak}"/>`);
  out.push(`<path d="M298 168 C316 168 332 170 344 172" fill="none" stroke="${dark ? '#B86F12' : '#D9861C'}" stroke-width="3" stroke-linecap="round"/>`);
  // eye and cheek
  if (wink) out.push(`<path d="M246 160 C252 152 264 152 270 160" fill="none" stroke="${dark ? '#0B0B0E' : p.ink}" stroke-width="5" stroke-linecap="round"/>`);
  else out.push(`<circle cx="258" cy="158" r="13" fill="${dark ? '#0B0B0E' : p.ink}"/><circle cx="263" cy="153" r="4.5" fill="#FFFFFF"/><circle cx="254" cy="163" r="2" fill="#FFFFFF" opacity=".7"/>`);
  out.push(`<ellipse cx="270" cy="186" rx="13" ry="8" fill="#FF8F7A" opacity=".75"/>`);
  return out.join('');
}

/** Finn with the sticker rim and soft shadow, in his 400 box. */
export function finnSticker(theme = 'light', opts = {}) {
  const p = PAL[theme];
  return `<g>
<ellipse cx="200" cy="372" rx="118" ry="12" fill="${p.shadow}"/>
<g transform="translate(5 7)" opacity=".55">${silhouette(p.shadow, p.shadow, 18)}</g>
${silhouette(p.rim, p.rim, 18)}
${finnBody(theme, opts)}
</g>`;
}

export function mascotSVG(theme = 'light') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 30 360 360" width="360" height="360" role="img" aria-labelledby="t">
<title id="t">Finn, the filefinch mascot: a small finch courier with a cap, a messenger bag and a tiny parcel</title>
${finnSticker(theme)}
</svg>`;
}

/** Head only: cap, eye and beak. */
export function headInner(theme = 'light', { rim = true } = {}) {
  const p = PAL[theme];
  const dark = theme === 'dark';
  const shapes = [S.head, S.cap, S.visor, S.beak];
  const sil = rim ? `<g fill="${p.rim}" stroke="${p.rim}" stroke-width="16" stroke-linejoin="round">${shapes.map((d) => `<path d="${d}"/>`).join('')}</g>` : '';
  return `${sil}
<path d="${S.head}" fill="${p.coral}"/>
<path d="M256 190 C276 196 292 190 300 176 C298 204 282 224 256 232 C238 226 236 200 256 190 Z" fill="${p.cream}"/>
<path d="${S.visor}" fill="${p.navy2}"/>
<path d="${S.cap}" fill="${p.navy}"/>
<path d="M148 126 C170 116 196 110 222 110 C252 110 278 114 300 120" fill="none" stroke="${p.sun}" stroke-width="7" stroke-linecap="round"/>
<circle cx="222" cy="62" r="7" fill="${p.navy2}"/>
<path d="${S.beak}" fill="${p.beak}"/>
<path d="M298 168 C316 168 332 170 344 172" fill="none" stroke="${dark ? '#B86F12' : '#D9861C'}" stroke-width="3" stroke-linecap="round"/>
<circle cx="258" cy="158" r="13" fill="${dark ? '#0B0B0E' : p.ink}"/><circle cx="263" cy="153" r="4.5" fill="#FFFFFF"/>
<ellipse cx="270" cy="186" rx="13" ry="8" fill="#FF8F7A" opacity=".75"/>`;
}

export function headSVG(theme = 'light') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="126 44 236 204" width="236" height="204" role="img" aria-labelledby="t">
<title id="t">Finn the finch courier, head with his cap</title>
${headInner(theme)}
</svg>`;
}

/** Finn's head, cap and beak for the app icon, at a given placement. */
function iconHead(transform) {
  const p = PAL.light;
  const d = PAL.dark;
  return `<g transform="${transform}">
<path d="${S.head}" fill="${p.coral}"/>
<path d="M256 190 C276 196 292 190 300 176 C298 204 282 224 256 232 C238 226 236 200 256 190 Z" fill="${p.cream}"/>
<path d="${S.visor}" fill="#26262D"/>
<path d="${S.cap}" fill="#34343D"/>
<path d="M150 126 C170 116 196 110 222 110 C252 110 278 114 298 120" fill="none" stroke="${p.sun}" stroke-width="12" stroke-linecap="round"/>
<path d="${S.beak}" fill="${p.beak}"/>
<circle cx="258" cy="158" r="17" fill="${d.sky}"/><circle cx="264" cy="152" r="6" fill="#FFFFFF"/>
</g>`;
}

/** Favicon and app icon: Finn's head on a near black tile with a hairline edge and a coral glow. */
export function faviconSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
<defs><clipPath id="ff-tile"><rect width="64" height="64" rx="15"/></clipPath><radialGradient id="ff-glow" cx=".62" cy=".62" r=".6"><stop offset="0" stop-color="#FF7A45" stop-opacity=".38"/><stop offset="1" stop-color="#FF7A45" stop-opacity="0"/></radialGradient><linearGradient id="ff-edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".22"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".05"/></linearGradient></defs>
<g clip-path="url(#ff-tile)">
<rect width="64" height="64" fill="#0E0E11"/>
<rect width="64" height="64" fill="url(#ff-glow)"/>
${iconHead('translate(-23 -6) scale(.23)')}
</g>
<rect x=".5" y=".5" width="63" height="63" rx="14.5" fill="none" stroke="url(#ff-edge)"/>
</svg>`;
}

/** The maskable app icon: the same head inside the safe zone of a full bleed tile. */
export function maskableSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
<defs><radialGradient id="ff-glow" cx=".58" cy=".6" r=".55"><stop offset="0" stop-color="#FF7A45" stop-opacity=".34"/><stop offset="1" stop-color="#FF7A45" stop-opacity="0"/></radialGradient></defs>
<rect width="64" height="64" fill="#0E0E11"/>
<rect width="64" height="64" fill="url(#ff-glow)"/>
${iconHead('translate(-11.5 1.6) scale(.19)')}
</svg>`;
}

/** Placement helper: Finn sticker scaled into another drawing. */
export function placeFinn(theme, x, y, size, { flip = false, wink = false } = {}) {
  const s = size / 360;
  const t = flip ? `translate(${x + size} ${y}) scale(${-s} ${s}) translate(-20 -30)` : `translate(${x} ${y}) scale(${s}) translate(-20 -30)`;
  return `<g transform="${t}">${finnSticker(theme, { wink })}</g>`;
}

export function placeHead(theme, x, y, size, { flip = false, rim = true } = {}) {
  const s = size / 236;
  const t = flip ? `translate(${x + size} ${y}) scale(${-s} ${s}) translate(-126 -44)` : `translate(${x} ${y}) scale(${s}) translate(-126 -44)`;
  return `<g transform="${t}">${headInner(theme, { rim })}</g>`;
}

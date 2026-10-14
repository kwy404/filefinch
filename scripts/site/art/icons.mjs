// The filefinch icon set: 48 pixel duotone icons with a soft sky fill, an
// ink line and a coral accent. Tokens L (line), F (fill), A (accent),
// B (blue) and W (paper) are swapped for each theme.

export const ICON_THEME = {
  light: { L: '#10244A', F: '#D4EBFF', A: '#FF7A45', B: '#2F6FED', W: '#FFFFFF', M: '#22B98A' },
  dark: { L: '#EAF1FF', F: '#22407E', A: '#FF8A5B', B: '#8FB6FF', W: '#14244D', M: '#4BE0B0' },
};

const sheet = (fold = true) => `<path d="M13 5h15l9 9v27a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="W" stroke="L"/>${fold ? '<path d="M28 5v9h9" fill="F" stroke="L"/>' : ''}`;

export const ICONS = {
  file: `${sheet()}<path d="M17 24h14M17 30h14M17 36h9" stroke="B"/>`,
  image: `${sheet()}<path d="M15 37l6-8 5 5 3-3 4 6Z" fill="F" stroke="L"/><circle cx="20" cy="22" r="3" fill="A" stroke="none"/>`,
  video: `<rect x="5" y="11" width="38" height="26" rx="5" fill="W" stroke="L"/><path d="M20 18v12l10-6Z" fill="A" stroke="L"/><path d="M5 17h4M5 31h4M39 17h4M39 31h4" stroke="B"/>`,
  audio: `${sheet()}<path d="M21 36V21l10-3v14" stroke="L"/><circle cx="18.5" cy="36" r="3" fill="A" stroke="L"/><circle cx="28.5" cy="32" r="3" fill="A" stroke="L"/>`,
  archive: `${sheet()}<path d="M22 8v4M20 12h4M22 14v4M20 18h4M22 20v4" stroke="B"/><rect x="18.5" y="26" width="7" height="9" rx="2" fill="A" stroke="L"/>`,
  document: `${sheet()}<rect x="15" y="21" width="18" height="8" rx="2" fill="A" stroke="none"/><path d="M17 34h14M17 38h9" stroke="B"/>`,
  code: `${sheet()}<path d="M20 25l-4 5 4 5M28 25l4 5-4 5" stroke="B"/><path d="M25 23l-3 14" stroke="A"/>`,
  folder: `<path d="M5 13a3 3 0 0 1 3-3h10l4 5h18a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z" fill="F" stroke="L"/><path d="M5 20h38" stroke="L"/><path d="M30 28h8" stroke="A"/>`,
  'folder-flock': `<path d="M4 18a3 3 0 0 1 3-3h8l3 4h13a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z" fill="F" stroke="L"/><path d="M33 10l5-3-1 5M40 16l5-2-2 5M38 25l5 0-3 4" fill="A" stroke="A"/>`,
  link: `<path d="M21 27a6 6 0 0 0 9 1l6-6a6.4 6.4 0 0 0-9-9l-2 2" stroke="L"/><path d="M27 21a6 6 0 0 0-9-1l-6 6a6.4 6.4 0 0 0 9 9l2-2" stroke="A"/>`,
  qr: `<rect x="6" y="6" width="14" height="14" rx="3" fill="F" stroke="L"/><rect x="28" y="6" width="14" height="14" rx="3" fill="F" stroke="L"/><rect x="6" y="28" width="14" height="14" rx="3" fill="F" stroke="L"/><rect x="11" y="11" width="4" height="4" fill="L" stroke="none"/><rect x="33" y="11" width="4" height="4" fill="L" stroke="none"/><rect x="11" y="33" width="4" height="4" fill="L" stroke="none"/><path d="M28 28h5v5M38 28h4M28 38h4v4M37 34h5v8h-5" stroke="A"/>`,
  lock: `<rect x="9" y="21" width="30" height="21" rx="5" fill="F" stroke="L"/><path d="M16 21v-6a8 8 0 0 1 16 0v6" stroke="L"/><circle cx="24" cy="30" r="3" fill="A" stroke="none"/><path d="M24 32v4" stroke="A"/>`,
  fingerprint: `<path d="M14 18a12 12 0 0 1 20 0M11 26c0-3 1-5 2-7M37 26v3M19 40c-2-3-3-7-3-12a8 8 0 0 1 16 0v2M24 28v4c0 4 2 8 4 10M28 40c-1-2-1-4-1-6" stroke="L"/><path d="M20 28a4 4 0 0 1 8 0" stroke="A"/>`,
  resume: `<path d="M38 24a14 14 0 1 1-4-10" stroke="L"/><path d="M35 6v8h-8" stroke="L"/><path d="M20 17v14l11-7Z" fill="A" stroke="A"/>`,
  sync: `<path d="M9 22a15 15 0 0 1 27-7M39 26a15 15 0 0 1-27 7" stroke="L"/><path d="M37 7v8h-8M11 41v-8h8" stroke="A"/>`,
  phone: `<rect x="14" y="4" width="20" height="40" rx="5" fill="F" stroke="L"/><path d="M21 9h6" stroke="L"/><circle cx="24" cy="38" r="1.6" fill="L" stroke="none"/><path d="M19 19h10M19 25h7" stroke="A"/>`,
  laptop: `<rect x="9" y="9" width="30" height="21" rx="3" fill="F" stroke="L"/><path d="M4 35h40l-3 5H7Z" fill="W" stroke="L"/><path d="M15 16h12M15 22h8" stroke="A"/>`,
  desktop: `<rect x="5" y="7" width="38" height="26" rx="3" fill="F" stroke="L"/><path d="M19 41h10M24 33v8" stroke="L"/><path d="M11 14h14M11 20h9" stroke="A"/>`,
  tablet: `<rect x="8" y="5" width="32" height="38" rx="5" fill="F" stroke="L"/><circle cx="24" cy="38" r="1.6" fill="L" stroke="none"/><path d="M14 13h20M14 19h13" stroke="A"/>`,
  offline: `<path d="M8 19a23 23 0 0 1 32 0M13 25a15 15 0 0 1 22 0M18 31a8 8 0 0 1 12 0" stroke="L"/><circle cx="24" cy="37" r="2.4" fill="L" stroke="none"/><path d="M7 7l34 34" stroke="A"/>`,
  wifi: `<path d="M6 18a26 26 0 0 1 36 0M12 25a17 17 0 0 1 24 0M18 32a8.5 8.5 0 0 1 12 0" stroke="L"/><circle cx="24" cy="38" r="3" fill="A" stroke="none"/>`,
  shield: `<path d="M24 4l16 6v12c0 10-7 18-16 22C15 40 8 32 8 22V10Z" fill="F" stroke="L"/><path d="M17 24l5 5 9-10" stroke="A"/>`,
  key: `<circle cx="16" cy="30" r="9" fill="F" stroke="L"/><circle cx="16" cy="30" r="3" fill="A" stroke="none"/><path d="M23 23l17-17M33 13l5 5M28 18l4 4" stroke="L"/>`,
  relay: `<rect x="17" y="17" width="14" height="14" rx="3" fill="F" stroke="L"/><path d="M4 24h9M35 24h9" stroke="L"/><path d="M10 20l4 4-4 4M38 20l4 4-4 4" stroke="L"/><path d="M21 24h6" stroke="A"/>`,
  direct: `<circle cx="9" cy="24" r="5" fill="F" stroke="L"/><circle cx="39" cy="24" r="5" fill="F" stroke="L"/><path d="M14 24h20" stroke="A" stroke-dasharray="3 4"/><path d="M22 18l8 6-8 6" stroke="L"/>`,
  'no-cloud': `<path d="M14 36a8 8 0 0 1-1-16 11 11 0 0 1 21-3 8 8 0 0 1 2 19Z" fill="F" stroke="L"/><path d="M8 8l32 32" stroke="A"/>`,
  infinity: `<path d="M24 24c-4-5-7-8-11-8a8 8 0 0 0 0 16c4 0 7-3 11-8Zm0 0c4 5 7 8 11 8a8 8 0 0 0 0-16c-4 0-7 3-11 8Z" fill="F" stroke="L"/><circle cx="24" cy="24" r="2.5" fill="A" stroke="none"/>`,
  'no-account': `<circle cx="24" cy="17" r="8" fill="F" stroke="L"/><path d="M9 41a15 15 0 0 1 30 0" fill="F" stroke="L"/><path d="M8 8l32 32" stroke="A"/>`,
  preview: `<path d="M3 24s8-13 21-13 21 13 21 13-8 13-21 13S3 24 3 24Z" fill="F" stroke="L"/><circle cx="24" cy="24" r="6" fill="W" stroke="L"/><circle cx="24" cy="24" r="2.5" fill="A" stroke="none"/>`,
  library: `<rect x="6" y="8" width="8" height="32" rx="2" fill="F" stroke="L"/><rect x="16" y="8" width="8" height="32" rx="2" fill="W" stroke="L"/><path d="M27 11l7-2 7 30-7 2Z" fill="F" stroke="L"/><path d="M8 16h4M18 16h4" stroke="A"/>`,
  download: `<path d="M24 6v24M15 21l9 9 9-9" stroke="L"/><path d="M8 34v4a3 3 0 0 0 3 3h26a3 3 0 0 0 3-3v-4" stroke="A"/>`,
  camera: `<path d="M6 16a3 3 0 0 1 3-3h6l3-5h12l3 5h6a3 3 0 0 1 3 3v21a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z" fill="F" stroke="L"/><circle cx="24" cy="26" r="7" fill="W" stroke="L"/><circle cx="24" cy="26" r="2.5" fill="A" stroke="none"/>`,
  clipboard: `<rect x="9" y="8" width="30" height="35" rx="4" fill="F" stroke="L"/><rect x="17" y="4" width="14" height="8" rx="2" fill="W" stroke="L"/><path d="M16 22h16M16 29h16M16 36h9" stroke="A"/>`,
  bolt: `<path d="M27 4L10 27h12l-3 17 19-24H26Z" fill="F" stroke="L"/><path d="M24 15l-4 6" stroke="A"/>`,
  globe: `<circle cx="24" cy="24" r="18" fill="F" stroke="L"/><path d="M6 24h36M24 6c-6 6-6 30 0 36M24 6c6 6 6 30 0 36" stroke="L"/><circle cx="34" cy="14" r="3" fill="A" stroke="none"/>`,
  warning: `<path d="M24 5l20 35H4Z" fill="F" stroke="L"/><path d="M24 18v10" stroke="A"/><circle cx="24" cy="34" r="2" fill="A" stroke="none"/>`,
  check: `<circle cx="24" cy="24" r="18" fill="F" stroke="L"/><path d="M15 24l6 6 12-13" stroke="A"/>`,
  parcel: `<path d="M8 15l16-8 16 8v19l-16 8-16-8Z" fill="F" stroke="L"/><path d="M8 15l16 8 16-8M24 23v19" stroke="L"/><path d="M16 11l16 8v6" stroke="A"/>`,
  finch: `<path d="M12 27l-8-6 1 11Z" fill="A" stroke="L"/><path d="M34 21l9 3-9 4Z" fill="W" stroke="L"/><path d="M10 28c0-9 7-16 15-16 6 0 10 4 10 10 0 10-7 17-15 17-6 0-10-5-10-11Z" fill="A" stroke="L"/><path d="M14 25c6-1 12 2 14 9-7 1-12-2-14-9Z" fill="W" stroke="L"/><circle cx="28" cy="20" r="2.2" fill="L" stroke="none"/><path d="M19 39l-1 4M24 39l1 4" stroke="L"/>`,
  settings: `<circle cx="24" cy="24" r="6" fill="W" stroke="L"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M10 38l4-4M34 14l4-4" stroke="L"/><circle cx="24" cy="24" r="12" fill="none" stroke="A"/>`,
  install: `<rect x="12" y="4" width="24" height="40" rx="5" fill="F" stroke="L"/><path d="M24 14v14M18 22l6 6 6-6" stroke="A"/><path d="M20 38h8" stroke="L"/>`,
  'same-wifi': `<rect x="4" y="26" width="14" height="16" rx="3" fill="F" stroke="L"/><rect x="30" y="26" width="14" height="16" rx="3" fill="F" stroke="L"/><path d="M14 14a14 14 0 0 1 20 0M18 19a8 8 0 0 1 12 0" stroke="L"/><circle cx="24" cy="23" r="2.4" fill="A" stroke="none"/>`,
};

/** Standalone icon file. */
export function iconSVG(name, theme = 'light', size = 48) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${paint(ICONS[name], theme)}</svg>`;
}

/** Icon markup placed inside another drawing. */
export function iconAt(name, theme, x, y, size = 48) {
  return `<g transform="translate(${x} ${y}) scale(${size / 48})" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${paint(ICONS[name], theme)}</g>`;
}

function paint(src, theme) {
  const t = ICON_THEME[theme];
  return src.replace(/(fill|stroke)="([LFABWM])"/g, (_, a, k) => `${a}="${t[k]}"`);
}

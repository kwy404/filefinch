// Original monochrome marks for the platforms filefinch runs on. They are
// drawn for this site (no vendor logos): a window, a desktop with a dock,
// a terminal, two phones with different camera cutouts and a slim laptop.
// They use currentColor so the strip can tint them.

const P = {
  windows: ['Windows', '<rect x="5" y="7" width="38" height="34" rx="4"/><path d="M5 15h38M24 15v26M5 28h38"/><circle cx="10" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="14" cy="11" r="1" fill="currentColor" stroke="none"/>'],
  macos: ['macOS', '<rect x="5" y="7" width="38" height="27" rx="4"/><path d="M19 41h10M24 34v7"/><rect x="14" y="27" width="20" height="3.5" rx="1.75" fill="currentColor" stroke="none" opacity=".55"/>'],
  linux: ['Linux', '<rect x="5" y="9" width="38" height="30" rx="4"/><path d="M12 19l6 5-6 5M22 31h10"/>'],
  android: ['Android', '<rect x="13" y="4" width="22" height="40" rx="5"/><circle cx="24" cy="9.5" r="1.6" fill="currentColor" stroke="none"/><path d="M20 39h8"/>'],
  iphone: ['iPhone', '<rect x="13" y="4" width="22" height="40" rx="6"/><rect x="19.5" y="7.5" width="9" height="3" rx="1.5" fill="currentColor" stroke="none"/>'],
  chromeos: ['ChromeOS', '<rect x="9" y="10" width="30" height="21" rx="2.5"/><path d="M4 35h40l-2 4H6Z"/><circle cx="24" cy="20.5" r="4.5"/>'],
};

export const PLATFORMS = Object.keys(P);

export function platformMark(name) {
  const [label, body] = P[name];
  return `<li class="plat"><svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg><span>${label}</span></li>`;
}

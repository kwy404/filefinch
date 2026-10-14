// The filefinch illustrations, 640 by 400, each in a light (day sky) and a
// dark (night sky) version. They show files flying straight between devices,
// never through a cloud.
import { PAL } from './palette.mjs';
import { placeFinn, placeHead } from './finn.mjs';
import {
  appScreen, bird, envelope, wordChip, bubble, check, desktop, fileSheet, folder, label, laptop, lock, noCloud, panel, parcel,
  phone, progress, qr, sky, svgDoc, tablet, trail,
} from './kit.mjs';

const W = 640;
const H = 400;

export const ART = {
  'direct-flight': {
    title: 'A phone and a laptop on two hills with Finn the finch flying a parcel straight between them across an open sky with no cloud',
    draw: (p, t) => sky(p, W, H, { theme: t }) + phone(p, 70, 170, 74, { screen: (w, h) => appScreen(p, w, h, { rows: 3, done: 1 }) })
      + laptop(p, 430, 196, 170, { screen: (w, h) => appScreen(p, w, h, { rows: 3, done: 2, accent: p.mint }) })
      + trail(p, "M150 190 C230 90 360 80 440 180") + noCloud(p, 420, 70, 0.7)
      + placeFinn(t, 226, 40, 160),
  },
  'folder-flock': {
    title: 'A folder opening and its files flying out as a flock of small finches in formation, each carrying one file',
    draw: (p, t) => sky(p, W, H, { theme: t, sunX: 560, sunY: 70 }) + folder(p, 120, 300, 1.6, { rot: -6 })
      + trail(p, 'M150 260 C230 200 300 150 420 110', { op: 0.7 })
      + [[210, 230, 0.9], [270, 190, 0.95], [330, 150, 1], [400, 120, 1.05], [300, 240, 0.85], [370, 200, 0.95], [440, 170, 1], [500, 140, 1.05]].map(([x, y, s], i) => bird(p, x, y, s, { carry: 'file', wing: i % 2 ? 'down' : 'up' })).join('')
      + desktop(p, 470, 210, 140, { screen: (w, h) => appScreen(p, w, h, { rows: 3, done: 3, accent: p.mint }) }),
  },
  'lock-line': {
    title: 'Two devices joined by one direct dashed line with a padlock in the middle, the connection is encrypted end to end',
    draw: (p, t) => panel(p, W, H) + `<circle cx="320" cy="200" r="150" fill="${p.card}" opacity=".5"/>`
      + phone(p, 70, 110, 84, { screen: (w, h) => appScreen(p, w, h, { rows: 3, done: 1 }) })
      + laptop(p, 420, 140, 170, { screen: (w, h) => appScreen(p, w, h, { rows: 3, done: 1, accent: p.mint }) })
      + `<path d="M166 200 H410" stroke="${p.ink}" stroke-width="4" stroke-dasharray="10 9" stroke-linecap="round"/>`
      + parcel(p, 220, 196, 0.8, { seal: true }) + parcel(p, 360, 196, 0.8, { seal: true }) + lock(p, 290, 200, 1.3)
      + label('DTLS', 290, 260, 18, p.ink2, { anchor: 'middle', weight: 800, ls: 2 }) + (t === 'dark' ? '' : ''),
  },
  'invite-qr': {
    title: 'A laptop shows an invite QR code and a link while a phone scans it with its camera',
    draw: (p) => panel(p, W, H) + laptop(p, 70, 90, 280, {
      screen: (w, h) => `<rect width="${w}" height="${h}" fill="${p.card2}"/>${qr(p, w * 0.08, h * 0.16, h * 0.62, { seed: 11 })}<rect x="${w * 0.55}" y="${h * 0.2}" width="${w * 0.36}" height="${h * 0.08}" rx="${h * 0.04}" fill="${p.ink2}" opacity=".75"/><rect x="${w * 0.55}" y="${h * 0.36}" width="${w * 0.36}" height="${h * 0.14}" rx="${h * 0.07}" fill="${p.sky2}" stroke="${p.blue}" stroke-width="2"/><rect x="${w * 0.58}" y="${h * 0.41}" width="${w * 0.24}" height="${h * 0.04}" rx="${h * 0.02}" fill="${p.blue}"/><rect x="${w * 0.55}" y="${h * 0.58}" width="${w * 0.3}" height="${h * 0.12}" rx="${h * 0.06}" fill="${p.blue}"/>`,
    }) + phone(p, 430, 120, 100, {
      tilt: -8,
      screen: (w, h) => `<rect width="${w}" height="${h}" fill="${p.ink2}"/>${qr(p, w * 0.2, h * 0.3, w * 0.6, { seed: 11, color: p.ink, bg: '#FFFFFF' })}<path d="M${w * 0.12} ${h * 0.26} v-${h * 0.05} h${w * 0.12} M${w * 0.76} ${h * 0.21} h${w * 0.12} v${h * 0.05} M${w * 0.12} ${h * 0.62} v${h * 0.05} h${w * 0.12} M${w * 0.76} ${h * 0.67} h${w * 0.12} v-${h * 0.05}" fill="none" stroke="${p.mint}" stroke-width="4" stroke-linecap="round"/><circle cx="${w / 2}" cy="${h * 0.86}" r="${w * 0.1}" fill="#fff"/>`,
    }) + trail(p, 'M360 160 C390 150 410 160 430 170', { color: p.mint, dash: '2 7' }),
  },
  'six-words': {
    title: 'A laptop shows six numbered words and a phone types the same six words to connect the two devices',
    draw: (p, t) => {
      const words = ['maple', 'harbor', 'orbit', 'canyon', 'river', 'meadow'];
      const grid = (w, h, filled) => `<rect width="${w}" height="${h}" fill="${p.card2}"/>` + words.map((wd, i) => wordChip(p, w * 0.06 + (i % 2) * w * 0.46, h * 0.12 + Math.floor(i / 2) * h * 0.28, w * 0.42, i + 1, i < filled ? wd : '', { h: h * 0.21 })).join('');
      return panel(p, W, H) + `<circle cx="320" cy="200" r="160" fill="${p.card}" opacity=".45"/>`
        + laptop(p, 60, 90, 290, { screen: (w, h) => grid(w, h, 6) })
        + phone(p, 440, 70, 120, { screen: (w, h) => grid(w, h, 4) + `<rect x="${w * 0.52}" y="${h * 0.12 + 2 * h * 0.28 + h * 0.04}" width="2.5" height="${h * 0.13}" fill="${p.blue}"/>` })
        + trail(p, 'M360 150 C390 110 420 110 440 130', { color: p.coral, dash: '2 8' }) + (t ? '' : '');
    },
  },
  'word-handshake': {
    title: 'The six word handshake travels sealed through a public relay that cannot read it, then the files fly straight between the two devices',
    draw: (p, t) => sky(p, W, H, { theme: t })
      + phone(p, 70, 170, 74, { screen: (w, h) => appScreen(p, w, h, { rows: 3, done: 1 }) })
      + laptop(p, 430, 196, 170, { screen: (w, h) => appScreen(p, w, h, { rows: 3, done: 2, accent: p.mint }) })
      + `<g transform="translate(320 0)"><path d="M-16 150 L-5 60 H5 L16 150 Z" fill="${p.navy}"/><circle cy="52" r="9" fill="${p.coral}"/><path d="M-20 40 a26 26 0 0 1 40 0" fill="none" stroke="${p.coral}" stroke-width="4" stroke-linecap="round"/></g>`
      + trail(p, 'M150 180 C190 90 260 50 300 60', { color: p.soft, dash: '2 7' }) + trail(p, 'M340 60 C390 50 450 110 490 190', { color: p.soft, dash: '2 7' })
      + envelope(p, 220, 92, 0.9, { rot: -12 }) + envelope(p, 420, 92, 0.9, { rot: 12 })
      + trail(p, 'M150 250 C250 300 390 300 450 260', { color: p.coral, width: 4, dash: '1 0' })
      + bird(p, 300, 288, 1, { carry: 'parcel', wing: 'down' }),
  },
  'reply-code': {
    title: 'The guest phone sends a short reply code back through any messenger and the host laptop pastes it to finish the connection',
    draw: (p) => panel(p, W, H) + phone(p, 80, 100, 96, { style: 'island', screen: (w, h) => appScreen(p, w, h, { rows: 2, done: 0, accent: p.coral }) })
      + laptop(p, 400, 150, 190, { screen: (w, h) => appScreen(p, w, h, { rows: 3, done: 0 }) })
      + bubble(p, 210, 90, 150, 56, { accent: p.coral, lines: 2 }) + bubble(p, 270, 170, 130, 50, { tail: 'right', accent: p.mint, lines: 2, fill: p.sky2 })
      + trail(p, 'M190 260 C260 330 380 320 430 260', { color: p.coral, dash: '2 8' }) + trail(p, 'M440 140 C420 90 330 60 240 80', { color: p.blue, dash: '2 8' })
      + check(p, 590, 150, 1.2),
  },
  'resume-flight': {
    title: 'A transfer that lost its connection picks up again from the last confirmed piece instead of starting over',
    draw: (p, t) => sky(p, W, H, { theme: t, hills: false })
      + trail(p, 'M60 250 C150 160 220 160 280 200', { color: p.blue, dash: '1 0', width: 6 })
      + trail(p, 'M280 200 C300 214 320 222 344 222', { color: p.soft, dash: '3 8', width: 4 })
      + trail(p, 'M344 222 C420 222 500 150 590 110', { color: p.mint, dash: '1 0', width: 6 })
      + `<g transform="translate(312 160)"><circle r="30" fill="${p.card}" stroke="${p.ink}" stroke-width="2.6"/><path d="M14 -4 a14 14 0 1 1 -5 -11" fill="none" stroke="${p.coral}" stroke-width="4" stroke-linecap="round"/><path d="M10 -22 v8 h-8" fill="none" stroke="${p.coral}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`
      + bird(p, 560, 108, 1.4, { carry: 'parcel' })
      + `<g transform="translate(70 300)"><rect width="500" height="58" rx="16" fill="${p.card}" stroke="${p.line}" stroke-width="2"/>${progress(p, 20, 34, 460, 0.64, { color: p.blue, h: 10 })}<rect x="20" y="14" width="140" height="9" rx="4.5" fill="${p.ink2}" opacity=".7"/><rect x="380" y="14" width="100" height="9" rx="4.5" fill="${p.mint}"/></g>`,
  },
  'same-wifi': {
    title: 'A phone, a laptop and a tablet in one home under the same Wi-Fi signal, sending files across the room',
    draw: (p) => panel(p, W, H) + `<path d="M120 360 V170 L320 50 L520 170 V360 Z" fill="${p.card}" stroke="${p.line}" stroke-width="3" stroke-linejoin="round"/>`
      + `<g fill="none" stroke="${p.blue}" stroke-width="7" stroke-linecap="round"><path d="M270 130 a70 70 0 0 1 100 0"/><path d="M290 152 a40 40 0 0 1 60 0"/></g><circle cx="320" cy="172" r="8" fill="${p.coral}"/>`
      + phone(p, 160, 220, 56, { screen: (w, h) => appScreen(p, w, h, { rows: 3, done: 1 }) })
      + laptop(p, 250, 250, 140, { screen: (w, h) => appScreen(p, w, h, { rows: 2, done: 1, accent: p.mint }) })
      + tablet(p, 420, 250, 90, { screen: (w, h) => appScreen(p, w, h, { mode: 'grid', title: false }) })
      + trail(p, 'M220 230 C250 200 290 210 300 240', { color: p.coral }) + trail(p, 'M390 250 C410 230 440 230 460 246', { color: p.coral })
      + `<path d="M60 360 H580" stroke="${p.hill2}" stroke-width="6" stroke-linecap="round"/>`,
  },
  'relay-tower': {
    title: 'Two devices behind strict network walls reach each other through a relay tower that only forwards sealed, encrypted parcels',
    draw: (p) => panel(p, W, H)
      + `<g fill="${p.line}" stroke="${p.soft}" stroke-width="2">${[0, 1, 2, 3, 4].map((i) => `<rect x="150" y="${130 + i * 36}" width="34" height="32" rx="3"/><rect x="456" y="${130 + i * 36}" width="34" height="32" rx="3"/>`).join('')}</g>`
      + phone(p, 60, 170, 70, { screen: (w, h) => appScreen(p, w, h, { rows: 3, done: 1 }) })
      + laptop(p, 510, 220, 110, { screen: (w, h) => appScreen(p, w, h, { rows: 2, done: 1, accent: p.mint }) })
      + `<g transform="translate(320 0)"><path d="M-30 330 L-8 120 H8 L30 330 Z" fill="${p.navy}"/><path d="M-22 260 H22 M-17 200 H17 M-12 150 H12" stroke="${p.sky2}" stroke-width="4"/><circle cy="108" r="14" fill="${p.coral}"/><path d="M-30 90 a40 40 0 0 1 60 0 M-46 76 a62 62 0 0 1 92 0" fill="none" stroke="${p.coral}" stroke-width="5" stroke-linecap="round"/></g>`
      + trail(p, 'M140 200 C190 80 260 90 300 110', { color: p.blue }) + trail(p, 'M340 110 C390 90 470 110 520 210', { color: p.blue })
      + parcel(p, 214, 104, 0.7, { seal: true, rot: -14 }) + parcel(p, 430, 112, 0.7, { seal: true, rot: 12 })
      + `<path d="M0 352 H640" stroke="${p.hill2}" stroke-width="8"/>`,
  },
  'local-library': {
    title: 'Finn sorting received files on a shelf: photos, videos, documents and folders kept in a library on your own device',
    draw: (p, t) => panel(p, W, H)
      + [90, 190, 290].map((y) => `<rect x="80" y="${y + 70}" width="380" height="12" rx="4" fill="${p.kraft2}"/>`).join('')
      + fileSheet(p, 120, 135, 1.2, { color: p.coral }) + fileSheet(p, 170, 135, 1.2, { color: p.blue, rot: 4 }) + folder(p, 250, 140, 0.9) + parcel(p, 330, 140, 1.2) + fileSheet(p, 400, 135, 1.2, { color: p.mint, rot: -5 })
      + folder(p, 140, 240, 0.9) + fileSheet(p, 220, 235, 1.2, { color: p.sun }) + fileSheet(p, 270, 235, 1.2, { color: p.coral, rot: 6 }) + parcel(p, 360, 240, 1.2, { seal: true })
      + fileSheet(p, 120, 335, 1.2, { color: p.blue }) + parcel(p, 210, 340, 1.1) + folder(p, 300, 340, 0.9)
      + placeFinn(t, 440, 150, 190, { flip: true }),
  },
  'sync-twins': {
    title: 'Two folders on two computers kept in step: circular arrows carry only the changed files between them',
    draw: (p, t) => sky(p, W, H, { theme: t, hills: false })
      + desktop(p, 50, 120, 200, { screen: (w, h) => appScreen(p, w, h, { rows: 3, done: 3, accent: p.mint }) })
      + laptop(p, 410, 150, 190, { screen: (w, h) => appScreen(p, w, h, { rows: 3, done: 3, accent: p.mint }) })
      + `<g fill="none" stroke-width="7" stroke-linecap="round"><path d="M270 150 C300 110 350 110 380 150" stroke="${p.blue}"/><path d="M380 250 C350 290 300 290 270 250" stroke="${p.coral}"/></g><path d="M384 130 l-2 24 -22 -6 Z" fill="${p.blue}"/><path d="M266 270 l2 -24 22 6 Z" fill="${p.coral}"/>`
      + fileSheet(p, 325, 200, 1, { color: p.sun }) + check(p, 230, 130, 1) + check(p, 590, 160, 1),
  },
  'phone-to-pc': {
    title: 'Photos and videos flying from a phone straight to a desktop computer without a cable',
    draw: (p, t) => sky(p, W, H, { theme: t })
      + phone(p, 70, 150, 86, { screen: (w, h) => appScreen(p, w, h, { mode: 'grid' }) })
      + desktop(p, 380, 120, 220, { screen: (w, h) => appScreen(p, w, h, { mode: 'grid', title: true }) })
      + trail(p, 'M170 190 C230 100 320 90 390 150')
      + bird(p, 230, 130, 0.9, { carry: 'file' }) + bird(p, 300, 104, 1, { carry: 'file', wing: 'down' }) + bird(p, 356, 126, 0.9, { carry: 'file' })
      ,
  },
  'android-iphone': {
    title: 'Two different phones, one with a round camera hole and one with a pill shaped cutout, trading parcels through the browser',
    draw: (p, t) => sky(p, W, H, { theme: t })
      + phone(p, 110, 110, 100, { style: 'round', tilt: -6, screen: (w, h) => appScreen(p, w, h, { rows: 3, done: 1, accent: p.mint }) })
      + phone(p, 430, 110, 100, { style: 'island', tilt: 6, screen: (w, h) => appScreen(p, w, h, { rows: 3, done: 1 }) })
      + trail(p, 'M220 170 C280 110 360 110 420 170', { color: p.coral }) + trail(p, 'M420 260 C360 320 280 320 220 260', { color: p.blue })
      + bird(p, 320, 118, 1.1, { carry: 'parcel' }) + bird(p, 320, 300, 1.1, { carry: 'parcel', flip: true, wing: 'down' }),
  },
  'big-file': {
    title: 'A flock of finches carrying one very large film reel together, there is no size limit on what you send',
    draw: (p, t) => sky(p, W, H, { theme: t, sunX: 560, sunY: 80 })
      + `<g transform="translate(320 270)"><circle r="78" fill="${p.ink2}"/><circle r="70" fill="${p.navy}"/>${[0, 60, 120, 180, 240, 300].map((a) => `<circle cx="${Math.cos((a * Math.PI) / 180) * 40}" cy="${Math.sin((a * Math.PI) / 180) * 40}" r="15" fill="${p.sky2}"/>`).join('')}<circle r="10" fill="${p.coral}"/><path d="M70 30 C120 50 170 40 210 20" fill="none" stroke="${p.ink2}" stroke-width="16" stroke-linecap="round"/></g>`
      + [[220, 140], [290, 110], [360, 110], [430, 140]].map(([x, y], i) => `<path d="M${x} ${y + 14} L320 ${210}" stroke="${p.ink}" stroke-width="1.6" opacity=".6"/>${bird(p, x, y, 1.1, { wing: i % 2 ? 'down' : 'up' })}`).join('')
      + label('50 GB', 540, 250, 30, p.coral, { anchor: 'middle', weight: 900 }),
  },
  'fingerprint-match': {
    title: 'Both screens show the same short connection fingerprint so you can confirm nobody sits in the middle',
    draw: (p) => panel(p, W, H)
      + phone(p, 90, 90, 104, { screen: (w, h) => `<rect width="${w}" height="${h}" fill="${p.card2}"/><rect x="${w * 0.1}" y="${h * 0.38}" width="${w * 0.8}" height="${h * 0.2}" rx="10" fill="${p.sky2}" stroke="${p.blue}" stroke-width="2"/>${label('4188 2276', w / 2, h * 0.5, 13, p.ink, { anchor: 'middle', weight: 800, ls: 1 })}` })
      + laptop(p, 360, 130, 210, { screen: (w, h) => `<rect width="${w}" height="${h}" fill="${p.card2}"/><rect x="${w * 0.2}" y="${h * 0.32}" width="${w * 0.6}" height="${h * 0.3}" rx="10" fill="${p.sky2}" stroke="${p.blue}" stroke-width="2"/>${label('4188 2276 8949', w / 2, h * 0.53, 17, p.ink, { anchor: 'middle', weight: 800, ls: 2 })}` })
      + `<path d="M210 200 H350" stroke="${p.mint}" stroke-width="4" stroke-dasharray="8 8" stroke-linecap="round"/>` + check(p, 280, 200, 1.5),
  },
  'cloud-vs-direct': {
    title: 'Comparison: on the left a file goes up to a cloud and waits before coming down, on the right it flies straight across',
    draw: (p, t) => sky(p, W, H, { theme: t, hills: false })
      + `<path d="M320 30 V370" stroke="${p.line}" stroke-width="3" stroke-dasharray="4 8"/>`
      + `<g transform="translate(160 90)"><path d="M-46 20 a20 20 0 0 1 -2 -40 a30 30 0 0 1 56 -8 a22 22 0 0 1 32 28 a17 17 0 0 1 -6 20 Z" fill="${p.card}" stroke="${p.soft}" stroke-width="3"/></g>`
      + phone(p, 40, 250, 48, { shade: false, screen: (w, h) => appScreen(p, w, h, { rows: 2 }) }) + laptop(p, 200, 280, 90, { screen: (w, h) => appScreen(p, w, h, { rows: 2 }) })
      + trail(p, 'M70 240 C70 160 100 130 130 120', { color: p.soft }) + trail(p, 'M200 120 C230 140 250 200 250 270', { color: p.soft })
      + label('upload, wait, download', 160, 380, 15, p.soft, { anchor: 'middle', weight: 700 })
      + phone(p, 370, 250, 48, { shade: false, screen: (w, h) => appScreen(p, w, h, { rows: 2, done: 1 }) }) + laptop(p, 520, 280, 90, { screen: (w, h) => appScreen(p, w, h, { rows: 2, done: 1, accent: p.mint }) })
      + trail(p, 'M420 270 C460 200 520 210 560 270', { color: p.coral }) + bird(p, 490, 210, 1, { carry: 'parcel' })
      + label('one direct hop', 480, 380, 15, p.ink2, { anchor: 'middle', weight: 800 }),
  },
  'strict-nat': {
    title: 'Two houses with high walls and closed gates, a dotted path between them fails until a relay is added',
    draw: (p, t) => sky(p, W, H, { theme: t })
      + [[70, 'L'], [430, 'R']].map(([x]) => `<g transform="translate(${x} 160)"><path d="M0 150 V60 L70 10 L140 60 V150 Z" fill="${p.card}" stroke="${p.ink}" stroke-width="2.6" stroke-linejoin="round"/><rect x="52" y="90" width="36" height="60" rx="4" fill="${p.navy}"/><rect x="18" y="74" width="26" height="22" rx="3" fill="${p.sky2}" stroke="${p.ink}" stroke-width="2"/><rect x="96" y="74" width="26" height="22" rx="3" fill="${p.sky2}" stroke="${p.ink}" stroke-width="2"/></g>`).join('')
      + `<g fill="${p.kraft2}">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${222 + i * 12}" y="240" width="8" height="70" rx="3"/><rect x="${352 + i * 12}" y="240" width="8" height="70" rx="3"/>`).join('')}</g>`
      + trail(p, 'M240 230 C280 180 360 180 400 230', { color: p.coral, dash: '3 9' })
      + `<g transform="translate(320 196)"><circle r="18" fill="${p.card}" stroke="${p.coral}" stroke-width="3"/><path d="M-7 -7 L7 7 M7 -7 L-7 7" stroke="${p.coral}" stroke-width="3.4" stroke-linecap="round"/></g>`
      + placeHead(t, 280, 60, 80),
  },
  'offline-app': {
    title: 'filefinch installed on a phone home screen keeps working with no internet once loaded, ready for a local network',
    draw: (p) => panel(p, W, H)
      + phone(p, 250, 40, 140, {
        screen: (w, h) => `<rect width="${w}" height="${h}" fill="${p.sky3}"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<rect x="${w * 0.1 + (i % 3) * w * 0.3}" y="${h * 0.12 + Math.floor(i / 3) * w * 0.3}" width="${w * 0.2}" height="${w * 0.2}" rx="${w * 0.05}" fill="${i === 4 ? '#2F6FED' : p.card}" opacity="${i === 4 ? 1 : 0.7}"/>`).join('')}`,
      })
      + placeHead('light', 309, 120, 22, { rim: false })
      + `<g transform="translate(140 110)"><circle r="40" fill="${p.card}" stroke="${p.ink}" stroke-width="2.6"/><path d="M-20 -4 a30 30 0 0 1 40 0 M-12 6 a18 18 0 0 1 24 0" fill="none" stroke="${p.soft}" stroke-width="4" stroke-linecap="round"/><path d="M-22 -22 L22 22" stroke="${p.coral}" stroke-width="4" stroke-linecap="round"/></g>`
      + `<g transform="translate(500 120)"><circle r="40" fill="${p.card}" stroke="${p.ink}" stroke-width="2.6"/><path d="M-14 0 l9 9 18 -20" fill="none" stroke="${p.mint}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  },
  'preview-gallery': {
    title: 'Received photos and a video shown as previews before you save them, with a play button and image thumbnails',
    draw: (p, t) => panel(p, W, H)
      + tablet(p, 120, 70, 400, {
        screen: (w, h) => {
          const colors = [p.coral, p.blue, p.mint, p.sun, p.blue2, p.coral2];
          let s = `<rect width="${w}" height="${h}" fill="${p.card2}"/>`;
          for (let i = 0; i < 6; i++) {
            const x = 18 + (i % 3) * ((w - 36) / 3), y = 18 + Math.floor(i / 3) * ((h - 36) / 2);
            const cw = (w - 36) / 3 - 12, ch = (h - 36) / 2 - 12;
            s += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="10" fill="${colors[i]}" opacity=".8"/><path d="M${x + 12} ${y + ch - 12} l${cw * 0.3} -${ch * 0.4} l${cw * 0.2} ${ch * 0.2} l${cw * 0.12} -${ch * 0.1} l${cw * 0.24} ${ch * 0.3} Z" fill="#fff" opacity=".85"/>`;
            if (i === 1) s += `<circle cx="${x + cw / 2}" cy="${y + ch / 2}" r="22" fill="#fff"/><path d="M${x + cw / 2 - 7} ${y + ch / 2 - 11} l18 11 -18 11 Z" fill="${p.blue}"/>`;
          }
          return s;
        },
      }) + placeHead(t, 470, 250, 110),
  },
};

export function artSVG(name, theme = 'light') {
  const a = ART[name];
  return svgDoc(W, H, a.draw(PAL[theme], theme), a.title);
}

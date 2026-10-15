// The filefinch landing page, "direct flight": a short hero with a looping
// animation of a PC and a phone pairing and sending files, a platform strip,
// a step by step "how it works" that plays the same devices one step at a
// time, story sections with product visuals and motion, feature cards, a
// comparison, honest limits, the FAQ and a big closing call to action.
// Every claim here must match the app in docs/app/.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SITE, REPO, AUTHOR, UPDATED, VERSION, esc } from './layout.mjs';
import { art, card } from './guides.mjs';
import { burstSymbols } from './art/lit.mjs';
import { PLATFORMS, platformMark } from './art/platforms.mjs';

export const HOME = {
  title: 'filefinch: send files and folders straight between your devices, free and private',
  description: 'Send files and folders straight from one of your devices to another in the browser. Pair with six words or a QR code. No account and no upload.',
};

/** Icon pair that follows the page theme. */
export const icon = (R, name, size = 40) => `<span class="fi" aria-hidden="true"><img class="art-l" src="${R}assets/icons/light/${name}.svg" width="${size}" height="${size}" alt=""><img class="art-d" src="${R}assets/icons/dark/${name}.svg" width="${size}" height="${size}" alt=""></span>`;

/** Lit illustration pair (dark and light files). */
const lit = (R, name, alt, cls = '') => `<span class="art lit ${cls}"><img class="art-l" src="${R}assets/lit/${name}-light.svg" width="640" height="400" alt="${esc(alt)}" loading="lazy" decoding="async"><img class="art-d" src="${R}assets/lit/${name}.svg" width="640" height="400" alt="" aria-hidden="true" loading="lazy" decoding="async"></span>`;

export const WORDS = ['maple', 'harbor', 'orbit', 'canyon', 'river', 'meadow'];

const PROMISES = [
  ['no-cloud', 'No server of ours', 'Nothing of ours stores, sees or relays your files.'],
  ['no-account', 'No account', 'Nothing to sign up for, nothing to log in to.'],
  ['direct', 'No upload', 'Files go device to device, never to a storage service.'],
  ['lock', 'End to end encrypted', 'Every connection is encrypted with DTLS by the browser.'],
  ['infinity', 'No size limit', 'filefinch sets no cap. Your disk is the only limit.'],
];

const FEATURES = [
  ['key', 'blue', 'Six words to connect', 'Type six simple words on the other device. The handshake travels encrypted through public relays that cannot read it.'],
  ['clipboard', 'sun', 'Text and links', 'Send a note or a link to your other device, like a shared clipboard. Texts typed while offline go out on the next connection.'],
  ['desktop', 'coral', 'Known devices', 'Paired once? Next time pick the device and type only the confirmation words. Forget it whenever you like.'],
  ['qr', 'mint', 'No relay option', 'For networks that block the relays, an advanced option connects by scanning a QR code each way, or by pasting the codes.'],
  ['folder-flock', 'sun', 'Whole folders', 'The tree arrives intact. Incoming paths are sanitized, so nothing lands outside the folder you pick.'],
  ['resume', 'coral', 'Resume after a drop', 'Reconnect and the transfer continues from the last confirmed chunk instead of starting over.'],
  ['sync', 'blue', 'Two way sync', 'Two way, push or pull. You review the plan of changes before anything is written.'],
  ['shield', 'mint', 'SHA-256 checked', 'Every file is hashed while it streams and verified by the receiver before it is marked done.'],
  ['fingerprint', 'coral', 'Confirm with six words', 'After pairing, type the six words shown on the other screen. A device that only saw your code gets different ones.'],
  ['lock', 'sun', 'Optional passphrase', 'PBKDF2 with 600,000 rounds to an AES-GCM key on each device. Every chunk is sealed again.'],
  ['preview', 'blue', 'Safe previews', 'Photos, video, audio, PDF and text, drawn so a received page or script never runs.'],
  ['library', 'mint', 'Local library', 'Keep received files in this browser on your own device, to save or send again later.'],
  ['install', 'sun', 'Installable, offline', 'Install it as an app. Once loaded, it opens without internet.'],
  ['relay', 'coral', 'Help on strict networks', 'When a direct route is blocked, filefinch explains why and lets you add your own TURN relay.'],
];

const FAQ = [
  ['Is filefinch really free?', 'Yes. It is free and open source under the MIT license. There are no plans, no ads, no account and no tracking. Since there is no server of ours carrying your files, there is nothing to pay for.'],
  ['How do the 6 words work?', 'The first device shows six words from a list of 2048 simple English words, plus a QR code that holds the same words. Type them on the other device: the first four letters of each word are enough. The short handshake the two browsers need to find each other travels encrypted through public relays that cannot read it. The code works once and expires in 10 minutes. Once the devices meet, one shows six new confirmation words to type on the other, so a device that only saw your code cannot join. Your files then go straight from device to device.'],
  ['Do my files go through a server?', 'No. Files travel over a direct WebRTC connection between your two browsers. The 6 word handshake passes through public relays as ciphertext, and when both networks block direct routes a TURN relay can forward the encrypted traffic. No server of ours is ever involved.'],
  ['What if a network blocks the relays?', 'Open Options and choose Connect with no relays (advanced). Each device shows a QR code: scan one each way, or copy and paste the codes. Nothing passes through a relay. Like every mode, the browsers still ask a public STUN server for their public address.'],
  ['Is there a file size limit?', 'filefinch sets none. Files are read and sent in 64 KiB chunks and written to disk as they arrive, so a 50 GB video works like a photo. The real limits are free space on the receiving device and both devices staying connected.'],
  ['Do both devices need to be online at the same time?', 'Yes. There is no storage in the middle, so the sender and the receiver must both have filefinch open while the files fly. If one closes the tab, the transfer can resume when you reconnect.'],
  ['Can I send a whole folder?', 'Yes. Pick or drop a folder and filefinch sends every file with its relative path. In browsers with folder access the tree is written straight into a folder you pick; elsewhere the folder arrives as one streamed .zip download.'],
  ['Does it work between Android and iPhone, or Windows and Mac?', 'Yes. filefinch runs in the browser, so any pair of modern browsers can connect: Android to iPhone, Windows to Mac, phone to PC or laptop to laptop.'],
  ['What happens if the connection fails?', 'Usually one network is very strict (symmetric NAT or a corporate firewall). filefinch detects the failed connection, explains it in plain words and offers the TURN setting. Trying another network, like a phone hotspot, often works too.'],
  ['Does filefinch work without internet?', 'Once loaded or installed, the app opens offline, and the advanced no relay option can connect two devices on the same local network. Pairing with 6 words needs internet to reach the public relays.'],
];

const COMPARE = [
  ['Where your files go', 'Uploaded to a storage service, then downloaded', 'Straight from one device to the other'],
  ['Waiting time', 'Upload first, then the download can start', 'The receiver gets data as soon as it is sent'],
  ['Account', 'Usually needed, at least for large files', 'None'],
  ['Size limits', 'Set by the plan you are on', 'None set by filefinch'],
  ['Copies left online', 'Until you delete them or they expire', 'None, nothing is stored online'],
  ['Who can read the files', 'The service can, unless it offers client side encryption', 'Only the two devices (DTLS, plus an optional passphrase)'],
  ['Both devices online', 'Not needed, the receiver can download later', 'Needed while the files fly'],
  ['Works without internet', 'No', 'Yes, with the no relay option on the same local network'],
];

const LIMITS = [
  ['Both devices must be online', 'There is no mailbox in the middle. Keep filefinch open on both devices until the transfer finishes. If one side drops, resume picks it up later.'],
  ['Strict networks can block a direct route', 'When both devices sit behind strict NAT (common on some mobile carriers and office networks), a direct connection may be impossible. filefinch says so and offers a TURN relay setting. A relay forwards only encrypted packets.'],
  ['The 6 words need a public relay to answer', 'The word handshake travels through public MQTT relays. If none answers, the advanced no relay option still works.'],
  ['Speed follows the slower side', 'A direct connection is as fast as the slower of the two links. On the same Wi-Fi that is usually far faster than any upload; across the internet it depends on the upload speed of the sender.'],
  ['Phones sleep', 'Mobile browsers may pause a tab in the background. Keep the screen on for long transfers, or let resume continue when you come back.'],
];

const SCENES = [
  { id: 'phone-pc', tab: 'Phone to PC', art: 'phone-to-pc', alt: 'Photos and videos flying from a phone straight to a desktop computer', title: 'Photos from your phone to your PC, no cable', steps: ['Open filefinch on the PC. Six words and a QR code appear side by side.', 'Type the six words on the phone, or scan the QR code with its camera.', 'Type the confirmation words, then pick the photos and videos.'], note: 'Videos arrive in their original quality and size. Nothing is recompressed.' },
  { id: 'pc-pc', tab: 'PC to PC', art: 'sync-twins', alt: 'Two computers keeping one folder in step', title: 'A whole project from one computer to another', steps: ['Open filefinch on both computers and type the six words on one of them.', 'Drop a folder, or choose Sync to keep a folder in step.', 'Review the plan of changes and let the files fly. Next time only what changed is sent.'], note: 'On the same Wi-Fi or cable network the files stay inside your home or office.' },
  { id: 'android-iphone', tab: 'Android to iPhone', art: 'android-iphone', alt: 'Two different phones trading parcels through the browser', title: 'Android to iPhone, and back', steps: ['Open filefinch in the browser on both phones. No app store needed.', 'Type the six words, or scan the QR code with the other phone.', 'Pick files on either side. Both phones can send and receive over one connection.'], note: 'Keep the screen on while big files fly, since phones may pause background tabs.' },
];

const check = '<svg class="ic" aria-hidden="true"><use href="#i-check"/></svg>';
const list = (items) => `<ul class="st-list">${items.map(([b, t]) => `<li>${check}<span><strong>${b}</strong> ${t}</span></li>`).join('')}</ul>`;

/** A product screenshot pair (light and dark) in a window or phone frame. */
function shotFrame(R, shots, name, alt, kind = 'window') {
  if (!shots.has(`${name}-light`) || !shots.has(`${name}-dark`)) return '';
  const [w, h] = kind === 'phone' ? [780, 1688] : [2200, 1400];
  const img = `<img class="art-l" src="${R}assets/shots/${name}-light.png" width="${w}" height="${h}" alt="${esc(alt)}" loading="lazy" decoding="async"><img class="art-d" src="${R}assets/shots/${name}-dark.png" width="${w}" height="${h}" alt="" aria-hidden="true" loading="lazy" decoding="async">`;
  if (kind === 'phone') return `<figure class="pf"><span class="art">${img}</span></figure>`;
  return `<figure class="wf"><div class="wf-bar" aria-hidden="true"><i></i><i></i><i></i><span>kwy404.github.io/filefinch/app/</span></div><span class="art">${img}</span></figure>`;
}

/** The real QR code of the app URL as one path, for the PC screen in the animations. */
function qrPath(qr) {
  const n = qr.size;
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules[y * n + x]) d += `M${x + 2} ${y + 2}h1v1h-1z`;
  return `<svg class="dqr" viewBox="0 0 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect width="${n + 4}" height="${n + 4}" rx="1.5" fill="#fff"/><path fill="#10244A" d="${d}"/></svg>`;
}

/** Words typed to confirm the pairing in the animations (all from the BIP39 list). */
const CONFIRM = ['pilot', 'tiger', 'velvet', 'lemon', 'island', 'rocket'];
const DUO_FILES = [['beach.jpg', '4.2 MB', 'c0'], ['birthday.mp4', '1.3 GB', 'c1'], ['notes.pdf', '820 KB', 'c2']];

/**
 * A PC and a phone side by side, drawn in HTML so it stays sharp and light.
 * The step in data-step picks what each screen shows: open, code, type,
 * confirm, send or done. The hero loops through the steps, the "how it works"
 * stepper sets them one at a time. Purely visual: aria-hidden, with the story
 * told in text next to it.
 */
function duo(step, cls, qr) {
  const chips = (words, attr = '') => words.map((w, i) => `<li style="--i:${i}"${attr}><b>${i + 1}</b><span>${w}</span></li>`).join('');
  const typed = (words) => words.map((w, i) => `<li style="--i:${i}"><b>${i + 1}</b><span><span class="dt">${w.slice(0, 4)}</span><span class="dr">${w.slice(4)}</span></span></li>`).join('');
  const rows = DUO_FILES.map(([n, size, c], i) => `<li style="--i:${i}"><i class="${c}"></i><span class="dw-l"><b>${n}</b><em><s></s></em></span><span class="dw-s">${size}</span><svg class="ic dw-ok"><use href="#i-check"/></svg></li>`).join('');
  const thumbs = DUO_FILES.map(([n, , c], i) => `<li style="--i:${i}"><i class="${c}"></i><span>${n}</span></li>`).join('');
  return `<div class="duo ${cls}" data-duo data-step="${step}" aria-hidden="true">
  <div class="duo-pc">
    <div class="duo-mon">
      <div class="duo-bar"><i></i><i></i><i></i><span>filefinch</span></div>
      <div class="duo-scr">
        <div class="scn s-open"><span class="duo-logo"><svg class="ic"><use href="#i-send"/></svg></span><p class="scn-t">Pair a device</p><span class="duo-btn">Show pairing code</span></div>
        <div class="scn s-code"><p class="scn-t">Scan the code or type these 6 words</p><div class="dcode">${qrPath(qr)}<ol class="dwords">${chips(WORDS)}</ol></div></div>
        <div class="scn s-confirm"><p class="scn-t">Now type these on your phone</p><ol class="dwords dwords-c">${chips(CONFIRM)}</ol></div>
        <div class="scn s-recv"><p class="scn-t"><span class="t-recv">Receiving 3 files</span><span class="t-done">3 files received</span></p><ul class="drows">${rows}</ul><p class="scn-ok"><svg class="ic"><use href="#i-check"/></svg>SHA-256 checked</p></div>
      </div>
    </div>
    <div class="duo-stand"></div>
  </div>
  <div class="duo-link"><span class="beam"></span><span class="duo-badge b-match"><svg class="ic"><use href="#i-check"/></svg>Words match</span><span class="duo-badge b-direct"><svg class="ic"><use href="#i-lock"/></svg>Direct, encrypted</span></div>
  <div class="duo-phone">
    <div class="ph-scr">
      <div class="scn s-open"><p class="scn-t">Have a pairing code?</p><ol class="dwords dwords-ph dwords-empty">${chips(['', '', '', '', '', ''])}</ol></div>
      <div class="scn s-type"><p class="scn-t">Type the 6 words</p><ol class="dwords dwords-ph dwords-typed">${typed(WORDS)}</ol></div>
      <div class="scn s-confirm"><p class="scn-t">Confirm with the words on the PC</p><ol class="dwords dwords-ph dwords-typed dwords-fast">${typed(CONFIRM)}</ol></div>
      <div class="scn s-send"><p class="scn-t"><span class="t-recv">Sending</span><span class="t-done">Sent</span></p><ul class="dthumbs">${thumbs}</ul></div>
    </div>
  </div>
  <div class="duo-fly">${DUO_FILES.map(([, , c], i) => `<span class="fx" style="--i:${i}"><span class="fy"><i class="${c}"></i></span></span>`).join('')}</div>
  <div class="duo-burst"></div>
</div>`;
}

function hero(R, qr) {
  return `<section class="hx" aria-labelledby="hero-h" data-hero>
  <div class="hx-bg" aria-hidden="true"><span class="hx-grid"></span><span class="hx-glow g1"></span><span class="hx-glow g2"></span><span class="hx-spot"></span></div>
  <div class="hx-in">
    <div class="hx-copy">
      <a class="pill" href="#features"><span class="pill-new">New</span>Send text and links too<svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg></a>
      <h1 id="hero-h">Send files <span class="grad">straight to your own devices.</span></h1>
      <p class="lede">Open filefinch on two devices, type six words, then drop your files. They fly from one device to the other, any size, end to end encrypted. No account, no upload.</p>
      <div class="hx-cta">
        <a class="btn btn-lg btn-solid" href="${R}app/"><svg class="ic" aria-hidden="true"><use href="#i-send"/></svg>Start sending</a>
        <a class="btn btn-lg btn-line" href="#how">See how it works</a>
      </div>
      <ul class="promise">${PROMISES.filter(([k]) => k !== 'no-cloud').map(([, t]) => `<li>${check}<span>${t}</span></li>`).join('')}</ul>
    </div>
    <div class="hx-side">
      ${duo('done', 'duo-loop', qr)}
      <p class="sr-only">Animation: a computer shows six words, a phone types them, both confirm with six more words, then three files fly from the phone to the computer and arrive checked.</p>
    </div>
  </div>
</section>`;
}

const HOW = [
  ['open', 'Open filefinch on both devices', 'Any modern browser on a phone, tablet or computer. Nothing to install, no account.', 3200],
  ['code', 'Show the pairing code', 'On one device, press Show pairing code, or just drop your files. Six simple words and a QR code appear.', 3200],
  ['type', 'Type the words on the other', 'Or scan the QR code with your phone. The first 4 letters of each word are enough.', 3600],
  ['confirm', 'Confirm it is your device', 'One screen shows six new words to type on the other. A device that only saw your code cannot match them.', 3600],
  ['send', 'Drop files, they fly direct', 'Pick files or a whole folder. They go straight to the other device, encrypted and checked.', 5200],
];

function howSteps(R, qr) {
  return `<section id="how" class="sec how-sec" aria-labelledby="how-h">
  <header class="sec-head"><p class="kicker">How it works</p><h2 id="how-h">Five steps. About a minute.</h2><p class="lede">No account, no upload. Press a step to see it, or let it play.</p></header>
  <div class="hiw" data-hiw>
    <ol class="hiw-steps">${HOW.map(([id, t, d, ms], i) => `<li><button type="button" class="hiw-step" data-go="${id}" style="--dur:${ms}ms"${i ? '' : ' aria-current="step"'}><span class="hiw-n">${i + 1}</span><span class="hiw-tx"><b>${t}</b><span>${d}</span></span><span class="hiw-bar" aria-hidden="true"><s></s></span></button></li>`).join('')}</ol>
    <div class="hiw-stage">
      ${duo('open', 'duo-big', qr)}
      <p class="hiw-cap" aria-hidden="true"><b>1</b><span>${HOW[0][1]}</span></p>
      <div class="hiw-tools"><button type="button" class="btn btn-sm btn-line hiw-play" data-play hidden><svg class="ic i-pause" aria-hidden="true"><use href="#i-pause"/></svg><svg class="ic i-play" aria-hidden="true"><use href="#i-play"/></svg><span>Pause</span></button><a class="btn btn-sm btn-solid" href="${R}app/"><svg class="ic" aria-hidden="true"><use href="#i-send"/></svg>Try it now</a></div>
    </div>
  </div>
  <p class="hiw-note"><span class="dot dot-m"></span>Network blocks the relays? Under Options, Connect with no relays (advanced) scans a QR code each way instead.</p>
</section>`;
}

function stories(R, { shots }) {
  const story = (id, kicker, h, p, items, visual, flip = false, extra = '') => `<section class="st${flip ? ' st-flip' : ''}" id="${id}" aria-labelledby="${id}-h">
  <div class="st-in">
    <div class="st-copy"><p class="kicker">${kicker}</p><h2 id="${id}-h">${h}</h2><p class="lede">${p}</p>${list(items)}${extra}</div>
    <div class="st-vis" data-reveal>${visual}</div>
  </div>
</section>`;
  const streamVis = `<div class="vis-stack">${shotFrame(R, shots, 'transfer', 'A large transfer in progress with speed, time left and the hash check', 'window')}<div class="stats"><div><b data-count="64">64</b><span>KiB per chunk</span></div><div><b data-count="256">256</b><span>bit SHA hash per file</span></div><div><b>No</b><span>size limit set by filefinch</span></div></div></div>`;
  const resumeVis = `<div class="vis-duo"><div class="knit" data-knit><svg viewBox="0 0 600 200" aria-hidden="true"><path class="kn-a" d="M30 150 C130 40 230 40 300 100"/><path class="kn-b" d="M300 100 C370 160 470 160 570 50"/><circle class="kn-spark" cx="300" cy="100" r="7"/></svg><span class="kn-cut">Connection lost</span><span class="kn-resume"><svg class="ic" aria-hidden="true"><use href="#i-play"/></svg>Resumed from 64%</span></div>${shotFrame(R, shots, 'resume', 'A transfer in the app with pause and resume controls', 'phone')}</div>`;
  const folderVis = `<div class="vis-stack"><div class="unfold" data-unfold aria-hidden="true"><span class="uf-folder"><svg viewBox="0 0 48 48"><path d="M5 13a3 3 0 0 1 3-3h10l4 5h18a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z"/></svg><b>Project</b></span>${['index.html', 'photos/', 'notes.md', 'video.mp4', 'data.csv', 'logo.svg'].map((f, i) => `<span class="uf-file" style="--i:${i}"><i class="c${i % 4}"></i>${f}</span>`).join('')}</div>${shotFrame(R, shots, 'sync', 'The sync plan listing the files that will be copied, updated or kept', 'window')}</div>`;
  const privacyVis = `<div class="vis-duo">${lit(R, 'fingerprint-lit', 'A fingerprint of light and a short matching code')}${shotFrame(R, shots, 'confirm', 'A phone showing the six confirmation words to type on the other device', 'phone')}</div>`;
  const libraryVis = `<div class="vis-stack vis-glow">${lit(R, 'preview-lit', 'Previews of a photo, a video and audio before saving', 'vis-bg')}${shotFrame(R, shots, 'library', 'The local library with received photos, a video and documents', 'window')}</div>`;
  const honest = `<div class="honest-note"><p><strong>The honest part.</strong> The 6 word handshake travels through public MQTT relays, which see that two devices exchange a few small encrypted messages, never what they say. Your files never touch them. When both networks block every direct route, a TURN relay you configure can forward the encrypted traffic. To find a route, each browser asks a public STUN server for its public address, which sees your IP address like any website. With the advanced no relay option, nothing relays the handshake at all.</p></div>`;
  return [
    story('stream', 'Any size', 'Any size. Never held in memory.', 'Files are read in small chunks and written to disk as they arrive, so a 50 GB video flies the same way as a photo.', [
      ['Small 64 KiB pieces,', 'read only a few ahead of the network.'],
      ['Written straight to disk,', 'into a folder you pick or as a streamed download.'],
      ['SHA-256 while streaming.', 'The receiver checks every file before marking it done.'],
    ], streamVis),
    story('resume', 'Resilient', 'Pause, resume, survive a drop.', 'Wi-Fi blinks, a phone sleeps, a laptop lid closes. Reconnect and the transfer continues from the last confirmed chunk.', [
      ['Resume from the last chunk', 'instead of starting over.'],
      ['Pause and cancel', 'from either side.'],
      ['Plain words when it fails.', 'filefinch explains strict networks and offers the TURN setting.'],
    ], resumeVis, true),
    story('folders', 'Folders', 'Whole folders. Two way sync.', 'Drop a folder and its tree flies as a flock. Or keep a folder in step between two computers, sending only what changed.', [
      ['The tree arrives intact,', 'with sanitized paths that never escape the folder you pick.'],
      ['Two way, push or pull.', 'Review the plan of changes before anything is written.'],
      ['Conflicts are kept,', 'never silently overwritten.'],
    ], folderVis),
    story('privacy', 'Private by design', 'Your files take the direct line.', 'filefinch is a web page that connects two browsers to each other. After that, it steps out of the way.', [
      ['No server of ours', 'ever sees your files or messages.'],
      ['DTLS on every connection,', 'with keys created inside the two browsers.'],
      ['Confirm with six words.', 'No file moves until the words typed on one screen match the other.'],
      ['Add a passphrase', 'for a second AES-GCM layer. It never travels.'],
    ], privacyVis, true, honest),
    story('library', 'Library and previews', 'See it before you keep it.', 'Preview photos, video, audio, PDF and text right in the browser, and keep what you want in a local library on your own device.', [
      ['Safe previews.', 'Received pages and scripts are shown, never run.'],
      ['A library in this browser,', 'to save or send again later.'],
      ['Nothing online.', 'Clear it whenever you like.'],
    ], libraryVis),
  ].join('\n');
}

export function homeBody(R, { guides, qr, shots = new Set() }) {
  const en = guides.filter((g) => g.meta.lang === 'en');
  const pick = ['transfer-files-from-phone-to-pc-without-cable', 'send-a-whole-folder', 'sync-folders-between-computers-without-cloud', 'is-webrtc-file-sharing-safe'];
  const featured = pick.map((s) => en.find((g) => g.meta.slug === s)).filter(Boolean);
  return `${burstSymbols()}
${hero(R, qr)}

<section class="strip" aria-label="Runs on every platform">
  <p class="strip-k">Runs in the browser on</p>
  <ul class="plats">${PLATFORMS.map(platformMark).join('')}</ul>
  <p class="browsers">Chrome <span>/</span> Edge <span>/</span> Firefox <span>/</span> Safari <span>/</span> Brave <span>/</span> Opera</p>
</section>

${howSteps(R, qr)}

${stories(R, { shots })}

<section id="features" class="sec" aria-labelledby="features-h">
  <header class="sec-head"><p class="kicker">Features</p><h2 id="features-h">Everything a parcel needs on the way</h2><p class="lede">Built for real files: big videos, deep folders, flaky Wi-Fi and phones that fall asleep.</p></header>
  <div class="feat-grid">${FEATURES.map(([ic, c, t, d]) => `<article class="feat glow-card" style="--gc:var(--lx-${c})">${icon(R, ic, 40)}<h3>${t}</h3><p>${d}</p></article>`).join('')}</div>
  <div class="numbers">
    <div><b data-count="0">0</b><span>servers of ours</span></div>
    <div><b data-count="0">0</b><span>accounts to create</span></div>
    <div><b data-count="600000">600,000</b><span>PBKDF2 rounds for a passphrase</span></div>
    <div><b data-count="2048">2,048</b><span>words in the handshake list</span></div>
  </div>
</section>

<section id="devices" class="sec sec-tint" aria-labelledby="devices-h" v-data="{ tab: 'phone-pc' }">
  <header class="sec-head"><p class="kicker">Device scenarios</p><h2 id="devices-h">Any device to any device</h2><p class="lede">filefinch runs in the browser, so the pair can be anything with a modern browser.</p></header>
  <div class="tabs" role="tablist" aria-label="Device scenarios">${SCENES.map((s, i) => `<button type="button" role="tab" id="tab-${s.id}" aria-controls="panel-${s.id}" :aria-selected="tab === '${s.id}' ? 'true' : 'false'" aria-selected="${i === 0}" :tabindex="tab === '${s.id}' ? '0' : '-1'" tabindex="${i === 0 ? 0 : -1}" @click="tab = '${s.id}'" @keydown.right="tab = '${SCENES[(i + 1) % 3].id}'; $el.nextElementSibling && $el.nextElementSibling.focus()" @keydown.left="tab = '${SCENES[(i + 2) % 3].id}'; $el.previousElementSibling && $el.previousElementSibling.focus()">${s.tab}</button>`).join('')}</div>
  ${SCENES.map((s, i) => `<div class="scene" role="tabpanel" id="panel-${s.id}" aria-labelledby="tab-${s.id}" v-show="tab === '${s.id}'"${i ? ' style="display:none"' : ''}>
    <figure>${art(R, s.art, s.alt)}</figure>
    <div><h3>${s.title}</h3><ol class="scene-steps">${s.steps.map((t) => `<li>${t}</li>`).join('')}</ol><p class="scene-note">${s.note}</p><a class="btn btn-solid" href="${R}app/">Start sending</a></div>
  </div>`).join('\n  ')}
</section>

<section id="compare" class="sec" aria-labelledby="compare-h">
  <div class="split split-rev">
    <figure class="split-art">${art(R, 'cloud-vs-direct', 'On the left a file goes up to a cloud and down again, on the right it flies straight across')}</figure>
    <div><p class="kicker">Two approaches</p><h2 id="compare-h">Cloud upload or direct flight?</h2><p class="lede">Both are useful. Uploading to storage is great when the receiver is offline. A direct transfer is better when you want the file on your other device now, privately and without limits.</p></div>
  </div>
  <div class="table-wrap"><table class="vs-table"><caption class="sr-only">Cloud upload compared with a direct transfer</caption><thead><tr><th scope="col"></th><th scope="col">Upload to cloud storage</th><th scope="col">Direct with filefinch</th></tr></thead><tbody>${COMPARE.map(([a, b, c]) => `<tr><th scope="row">${a}</th><td>${b}</td><td>${c}</td></tr>`).join('')}</tbody></table></div>
</section>

<section id="limits" class="sec sec-tint" aria-labelledby="limits-h">
  <div class="split">
    <div><p class="kicker">Limits, honestly</p><h2 id="limits-h">What a direct flight needs</h2><p class="lede">No middle storage means a few rules of the air. Here they are, before you find out the hard way.</p>
      <dl class="limits">${LIMITS.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>
    </div>
    <figure class="split-art">${art(R, 'strict-nat', 'Two houses with high walls where the direct path fails until a relay is added')}</figure>
  </div>
</section>

<section id="faq" class="sec" aria-labelledby="faq-h">
  <header class="sec-head"><p class="kicker">FAQ</p><h2 id="faq-h">Questions people ask</h2></header>
  <div class="faq faq-home">${FAQ.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
</section>

<section class="sec" aria-labelledby="guides-h">
  <header class="sec-head"><p class="kicker">Guides</p><h2 id="guides-h">Guides</h2><p class="lede">Short guides to the main things filefinch does.</p></header>
  <div class="cards">${featured.map((g) => card(R, g)).join('')}</div>
  <p class="more-link"><a class="btn btn-line" href="${R}guides/">All guides<svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg></a></p>
</section>

<section class="close" aria-labelledby="final-h">
  <div class="close-in">
    <div class="close-bg" aria-hidden="true"><span class="hx-grid"></span><span class="hx-glow g1"></span><span class="hx-glow g2"></span></div>
    ${lit(R, 'lit-finch', 'A finch of light carrying a parcel', 'close-art')}
    <h2 id="final-h">Your files, on a <span class="grad">direct flight.</span></h2>
    <p>Open filefinch on two devices and send your first file in under a minute. Free, open source, no account.</p>
    <p class="hx-cta"><a class="btn btn-lg btn-solid" href="${R}app/"><svg class="ic" aria-hidden="true"><use href="#i-send"/></svg>Start sending</a><a class="btn btn-lg btn-line" href="${REPO}" rel="noopener"><svg class="ic" aria-hidden="true"><use href="#i-github"/></svg>Source on GitHub</a></p>
    <span class="art close-finn"><img class="art-l" src="${R}assets/art/finn.svg" width="120" height="120" alt="Finn the finch courier" loading="lazy"><img class="art-d" src="${R}assets/art/finn-dark.svg" width="120" height="120" alt="" aria-hidden="true" loading="lazy"></span>
  </div>
</section>`;
}

/** Which product screenshots exist on disk. */
export function availableShots(docs) {
  const out = new Set();
  for (const n of ['connect', 'confirm', 'transfer', 'resume', 'sync', 'library']) {
    for (const th of ['light', 'dark']) if (existsSync(join(docs, 'assets', 'shots', `${n}-${th}.png`))) out.add(`${n}-${th}`);
  }
  return out;
}

export function homeJsonLd() {
  return [
    {
      '@type': 'WebApplication',
      '@id': `${SITE}#app`,
      name: 'filefinch',
      url: SITE,
      applicationCategory: 'UtilitiesApplication',
      applicationSubCategory: 'Peer to peer file transfer',
      operatingSystem: 'Any device with a modern web browser',
      browserRequirements: 'Requires WebRTC and JavaScript',
      softwareVersion: VERSION,
      dateModified: UPDATED,
      description: HOME.description,
      image: `${SITE}og.png`,
      screenshot: `${SITE}og.png`,
      isAccessibleForFree: true,
      license: 'https://opensource.org/licenses/MIT',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: FEATURES.map(([, , t]) => t).concat(PROMISES.map(([, t]) => t)),
      author: { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.github, sameAs: [AUTHOR.github, AUTHOR.linkedin] },
      codeRepository: REPO,
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE}#faq`,
      mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}#site`,
      name: 'filefinch',
      url: SITE,
      inLanguage: ['en', 'pt-BR'],
    },
  ];
}

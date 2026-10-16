// The filefinch landing page: a confident centered hero over a real product
// shot of the app (taken by shots.mjs), the platforms it runs on, five steps,
// a bento of features with more product shots, privacy and the honest part,
// device scenarios, a comparison, honest limits, the FAQ, guides and a
// closing call to action with Finn. The site is dark only.
// Every claim here must match the app in docs/app/.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SITE, REPO, AUTHOR, UPDATED, VERSION, esc } from './layout.mjs';
import { art, card } from './guides.mjs';
import { PLATFORMS, platformMark } from './art/platforms.mjs';

export const HOME = {
  title: 'filefinch: send files and folders straight between your devices, free and private',
  description: 'Send files and folders straight from one of your devices to another in the browser. Pair with six words or a QR code. No account and no upload.',
};

/** Icon pair that follows the page theme. */
export const icon = (R, name, size = 40) => `<span class="fi" aria-hidden="true"><img src="${R}assets/icons/dark/${name}.svg" width="${size}" height="${size}" alt=""></span>`;

/** Lit illustration (the dark version: the site is dark). */
const lit = (R, name, alt, cls = '') => `<span class="art lit ${cls}"><img src="${R}assets/lit/${name}.svg" width="640" height="400" alt="${esc(alt)}" loading="lazy" decoding="async"></span>`;

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

const HOW = [
  ['Open filefinch on both devices', 'Any modern browser on a phone, tablet or computer. Nothing to install, no account.'],
  ['Show the pairing code', 'On one device, press Show pairing code, or just drop your files. Six simple words and a QR code appear.'],
  ['Type the words on the other', 'Or scan the QR code with your phone. The first 4 letters of each word are enough.'],
  ['Confirm it is your device', 'One screen shows six new words to type on the other. A device that only saw your code cannot match them.'],
  ['Drop files, they fly direct', 'Pick files or a whole folder. They go straight to the other device, encrypted and checked.'],
];

const check = '<svg class="ic" aria-hidden="true"><use href="#i-check"/></svg>';
const arrow = '<svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg>';

/** A product screenshot from the real app (docs/assets/shots/, taken by shots.mjs). */
function shot(R, shots, name, alt, { eager = false } = {}) {
  if (!shots.has(name)) return '';
  const [w, h] = SHOT_SIZE[name] ?? [2200, 1400];
  const load = eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"';
  return `<img src="${R}assets/shots/${name}.png" width="${w}" height="${h}" alt="${esc(alt)}" ${load}>`;
}

/** The app in a browser window, with an optional phone in front of it. */
function windowFrame(R, shots, name, alt, opts = {}) {
  const img = shot(R, shots, name, alt, opts);
  if (!img) return '';
  return `<figure class="win"><div class="win-bar" aria-hidden="true"><span class="win-dots"><i></i><i></i><i></i></span><span class="win-url"><svg class="ic"><use href="#i-lock"/></svg>kwy404.github.io/filefinch/app/</span></div><div class="win-body">${img}</div></figure>`;
}

function phoneFrame(R, shots, name, alt, opts = {}) {
  const img = shot(R, shots, name, alt, opts);
  return img ? `<figure class="phone"><div class="phone-body">${img}</div></figure>` : '';
}

function hero(R, shots) {
  const main = shots.has('connect') ? ['connect', 'The filefinch app showing a QR code and six pairing words, waiting for the other device'] : ['transfer', 'The filefinch app receiving a large file, with progress, speed and the hash check'];
  return `<section class="hero" aria-labelledby="hero-h" data-hero>
  <div class="hero-bg" aria-hidden="true" data-season-fx data-season-slot="accent"><span class="hero-grid"></span><span class="hero-glow"></span><span class="hero-spot"></span></div>
  <div class="hero-in">
    <a class="pill" href="#features"><span class="pill-new">New</span>Send text and links too${arrow}</a>
    <h1 id="hero-h">Send files straight to <span class="nowrap">your own devices.</span></h1>
    <p class="lede">Open filefinch on two devices, type six words, then drop your files. They fly from one device to the other, any size, end to end encrypted. No account, no upload.</p>
    <div class="hero-cta">
      <a class="btn btn-lg btn-primary" href="${R}app/"><svg class="ic" aria-hidden="true"><use href="#i-send"/></svg>Start sending</a>
      <a class="btn btn-lg btn-outline" href="#how">See how it works</a>
    </div>
    <ul class="promise">${PROMISES.filter(([k]) => k !== 'no-cloud').map(([, t]) => `<li>${check}<span>${t}</span></li>`).join('')}</ul>
  </div>
  <div class="hero-shot">
    <div class="hero-stage">
      ${windowFrame(R, shots, main[0], main[1], { eager: true })}
      ${phoneFrame(R, shots, 'confirm', 'A phone showing the six confirmation words to type on the other device')}
      <span class="perch" data-season-slot="finn"><img class="perch-finn" src="${R}assets/art/finn-dark.svg" width="360" height="360" alt="Finn, the filefinch mascot, perched on the app window"></span>
    </div>
  </div>
</section>`;
}

function how() {
  return `<section id="how" class="sec" aria-labelledby="how-h">
  <header class="sec-head"><p class="kicker">How it works</p><h2 id="how-h">Five steps. About a minute.</h2><p class="lede">No account, no upload. Two browsers find each other, check that they are yours, and talk directly.</p></header>
  <ol class="steps-row">${HOW.map(([t, d], i) => `<li><span class="hstep-n">${String(i + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
  <p class="note"><span class="dot"></span>Network blocks the relays? Under Options, Connect with no relays (advanced) scans a QR code each way instead.</p>
</section>`;
}

function features(R, shots) {
  const tile = (cls, kicker, h, p, visual) => `<article class="tile ${cls}" data-reveal><div class="tile-copy"><p class="kicker">${kicker}</p><h3>${h}</h3><p>${p}</p></div><div class="tile-vis">${visual}</div></article>`;
  const fallback = (name, alt) => lit(R, name, alt);
  return `<section id="features" class="sec" aria-labelledby="features-h">
  <header class="sec-head"><p class="kicker">Features</p><h2 id="features-h">Everything a parcel needs on the way</h2><p class="lede">Built for real files: big videos, deep folders, flaky Wi-Fi and phones that fall asleep.</p></header>
  <div class="bento">
    ${tile('tile-wide', 'Any size', 'Any size. Never held in memory.', 'Files are read in small chunks and written to disk as they arrive, so a 50 GB video flies the same way as a photo. Every file is checked with SHA-256 before it is marked done.', shot(R, shots, 'transfer', 'A large transfer in progress with speed, time left and the hash check') || fallback('any-size', 'A large file streaming in small pieces'))}
    ${tile('tile-phone', 'Resilient', 'Pause, resume, survive a drop.', 'Wi-Fi blinks, a phone sleeps, a laptop lid closes. Reconnect and the transfer continues from the last confirmed chunk.', phoneFrame(R, shots, 'resume', 'A transfer in the app with pause and resume controls') || fallback('lit-parcel', 'A parcel of light'))}
    ${tile('tile-half', 'Folders', 'Whole folders. Two way sync.', 'Drop a folder and its tree arrives intact. Or keep a folder in step between two computers: review the plan of changes before anything is written.', shot(R, shots, 'sync', 'The sync plan listing the files that will be copied, updated or kept') || fallback('folder-tree', 'A folder tree'))}
    ${tile('tile-half', 'Library and previews', 'See it before you keep it.', 'Preview photos, video, audio, PDF and text right in the browser, and keep what you want in a local library on your own device.', shot(R, shots, 'library', 'The local library with received photos, a video and documents') || fallback('preview-lit', 'Previews of a photo, a video and audio before saving'))}
  </div>
  <ul class="feat-list">${FEATURES.map(([ic, , t, d]) => `<li><img src="${R}assets/icons/dark/${ic}.svg" width="28" height="28" alt="" loading="lazy"><div><h3>${t}</h3><p>${d}</p></div></li>`).join('')}</ul>
</section>`;
}

function privacy(R) {
  const items = [
    ['No server of ours', 'ever sees your files or messages.'],
    ['DTLS on every connection,', 'with keys created inside the two browsers.'],
    ['Confirm with six words.', 'No file moves until the words typed on one screen match the other.'],
    ['Add a passphrase', 'for a second AES-GCM layer. It never travels.'],
  ];
  return `<section id="privacy" class="sec" aria-labelledby="privacy-h">
  <div class="privacy">
    <div class="privacy-copy">
      <p class="kicker">Private by design</p>
      <h2 id="privacy-h">Your files take the direct line.</h2>
      <p class="lede">filefinch is a web page that connects two browsers to each other. After that, it steps out of the way.</p>
      <ul class="ticks">${items.map(([b, t]) => `<li>${check}<span><strong>${b}</strong> ${t}</span></li>`).join('')}</ul>
    </div>
    <figure class="privacy-art">${lit(R, 'fingerprint-lit', 'A fingerprint of light and a short matching code')}</figure>
  </div>
  <div class="honest"><p><strong>The honest part.</strong> The 6 word handshake travels through public MQTT relays, which see that two devices exchange a few small encrypted messages, never what they say. Your files never touch them. When both networks block every direct route, a TURN relay you configure can forward the encrypted traffic. To find a route, each browser asks a public STUN server for its public address, which sees your IP address like any website. With the advanced no relay option, nothing relays the handshake at all.</p></div>
  <dl class="numbers">
    <div><dt>servers of ours</dt><dd data-count="0">0</dd></div>
    <div><dt>accounts to create</dt><dd data-count="0">0</dd></div>
    <div><dt>PBKDF2 rounds for a passphrase</dt><dd data-count="600000">600,000</dd></div>
    <div><dt>words in the handshake list</dt><dd data-count="2048">2,048</dd></div>
  </dl>
</section>`;
}

function devices(R) {
  return `<section id="devices" class="sec" aria-labelledby="devices-h" v-data="{ tab: 'phone-pc' }">
  <header class="sec-head"><p class="kicker">Device scenarios</p><h2 id="devices-h">Any device to any device</h2><p class="lede">filefinch runs in the browser, so the pair can be anything with a modern browser.</p></header>
  <div class="tabs" role="tablist" aria-label="Device scenarios">${SCENES.map((s, i) => `<button type="button" role="tab" id="tab-${s.id}" aria-controls="panel-${s.id}" :aria-selected="tab === '${s.id}' ? 'true' : 'false'" aria-selected="${i === 0}" :tabindex="tab === '${s.id}' ? '0' : '-1'" tabindex="${i === 0 ? 0 : -1}" @click="tab = '${s.id}'" @keydown.right="tab = '${SCENES[(i + 1) % 3].id}'; $el.nextElementSibling && $el.nextElementSibling.focus()" @keydown.left="tab = '${SCENES[(i + 2) % 3].id}'; $el.previousElementSibling && $el.previousElementSibling.focus()">${s.tab}</button>`).join('')}</div>
  ${SCENES.map((s, i) => `<div class="scene" role="tabpanel" id="panel-${s.id}" aria-labelledby="tab-${s.id}" v-show="tab === '${s.id}'"${i ? ' style="display:none"' : ''}>
    <figure>${art(R, s.art, s.alt)}</figure>
    <div class="scene-copy"><h3>${s.title}</h3><ol class="scene-steps">${s.steps.map((t) => `<li>${t}</li>`).join('')}</ol><p class="scene-note">${s.note}</p><a class="btn btn-primary" href="${R}app/">Start sending</a></div>
  </div>`).join('\n  ')}
</section>`;
}

function compare() {
  return `<section id="compare" class="sec" aria-labelledby="compare-h">
  <header class="sec-head"><p class="kicker">Two approaches</p><h2 id="compare-h">Cloud upload or direct flight?</h2><p class="lede">Both are useful. Uploading to storage is great when the receiver is offline. A direct transfer is better when you want the file on your other device now, privately and without limits.</p></header>
  <div class="table-wrap"><table class="vs-table"><caption class="sr-only">Cloud upload compared with a direct transfer</caption><thead><tr><th scope="col"></th><th scope="col">Upload to cloud storage</th><th scope="col">Direct with filefinch</th></tr></thead><tbody>${COMPARE.map(([a, b, c]) => `<tr><th scope="row">${a}</th><td>${b}</td><td>${c}</td></tr>`).join('')}</tbody></table></div>
</section>`;
}

function limits() {
  return `<section id="limits" class="sec" aria-labelledby="limits-h">
  <header class="sec-head"><p class="kicker">Limits, honestly</p><h2 id="limits-h">What a direct flight needs</h2><p class="lede">No middle storage means a few rules of the air. Here they are, before you find out the hard way.</p></header>
  <dl class="limits">${LIMITS.map(([t, d], i) => `<div><span class="limit-n">${String(i + 1).padStart(2, '0')}</span><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl>
</section>`;
}

export function homeBody(R, { guides, shots = new Set() }) {
  const en = guides.filter((g) => g.meta.lang === 'en');
  const pick = ['transfer-files-from-phone-to-pc-without-cable', 'send-a-whole-folder', 'sync-folders-between-computers-without-cloud', 'is-webrtc-file-sharing-safe'];
  const featured = pick.map((s) => en.find((g) => g.meta.slug === s)).filter(Boolean);
  return `${hero(R, shots)}

<section class="strip" aria-label="Runs on every platform">
  <p class="strip-k">Runs in the browser on</p>
  <ul class="plats">${PLATFORMS.map(platformMark).join('')}</ul>
  <p class="browsers">Chrome <span>/</span> Edge <span>/</span> Firefox <span>/</span> Safari <span>/</span> Brave <span>/</span> Opera</p>
</section>

${how()}

${features(R, shots)}

${privacy(R)}

${devices(R)}

${compare()}

${limits()}

<section id="faq" class="sec" aria-labelledby="faq-h">
  <header class="sec-head"><p class="kicker">FAQ</p><h2 id="faq-h">Questions people ask</h2></header>
  <div class="faq faq-home">${FAQ.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
</section>

<section class="sec" aria-labelledby="guides-h">
  <header class="sec-head sec-head-row"><div><p class="kicker">Guides</p><h2 id="guides-h">Guides</h2><p class="lede">Short guides to the main things filefinch does.</p></div><a class="btn btn-outline" href="${R}guides/">All guides${arrow}</a></header>
  <div class="cards">${featured.map((g) => card(R, g)).join('')}</div>
</section>

<section class="close" aria-labelledby="final-h">
  <div class="close-bg" aria-hidden="true"><span class="hero-grid"></span><span class="hero-glow"></span></div>
  <div class="close-in">
    <span class="art close-finn"><img src="${R}assets/art/finn-dark.svg" width="360" height="360" alt="Finn the finch courier" loading="lazy" data-season-finn></span>
    <h2 id="final-h">Your files, on a direct flight.</h2>
    <p>Open filefinch on two devices and send your first file in under a minute. Free, open source, no account.</p>
    <p class="hero-cta"><a class="btn btn-lg btn-primary" href="${R}app/"><svg class="ic" aria-hidden="true"><use href="#i-send"/></svg>Start sending</a><a class="btn btn-lg btn-outline" href="${REPO}" rel="noopener"><svg class="ic" aria-hidden="true"><use href="#i-github"/></svg>Source on GitHub</a></p>
  </div>
</section>`;
}

const SHOT_SIZE = { connect: [2200, 1400], transfer: [2200, 1400], sync: [2200, 1400], library: [2200, 1400], resume: [780, 1688], confirm: [780, 1688] };

/** Which product screenshots exist on disk (dark only: the site is dark). */
export function availableShots(docs) {
  const out = new Set();
  for (const n of Object.keys(SHOT_SIZE)) if (existsSync(join(docs, 'assets', 'shots', `${n}.png`))) out.add(n);
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

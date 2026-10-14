// The filefinch landing page, "direct flight": files fly straight between
// your own devices. Every claim here must match the app in docs/app/.
import { SITE, REPO, AUTHOR, UPDATED, VERSION, esc } from './layout.mjs';
import { art, card } from './guides.mjs';

export const HOME = {
  title: 'filefinch: send files and folders straight between your devices, free and private',
  description: 'Send files and whole folders of any size from one device to another with a link or QR code. Peer to peer: no server, no account, no upload, encrypted.',
};

/** Icon pair that follows the page theme. */
export const icon = (R, name, size = 40) => `<span class="fi" aria-hidden="true"><img class="art-l" src="${R}assets/icons/light/${name}.svg" width="${size}" height="${size}" alt=""><img class="art-d" src="${R}assets/icons/dark/${name}.svg" width="${size}" height="${size}" alt=""></span>`;

const PROMISES = [
  ['no-cloud', '100% serverless', 'No server of ours ever touches your files or messages.'],
  ['no-account', 'No account', 'Nothing to sign up for, nothing to log in to.'],
  ['direct', 'No upload', 'Files go device to device, never to a storage service.'],
  ['lock', 'End to end encrypted', 'Every connection is encrypted with DTLS by the browser.'],
  ['infinity', 'No size limit', 'filefinch sets no cap. Your disk is the only limit.'],
];

const FEATURES = [
  ['folder-flock', 'Whole folders', 'Drop a folder and its tree arrives intact: subfolders, names and all. Paths are checked so nothing can be written outside the folder you choose.'],
  ['resume', 'Resume after a drop', 'If Wi-Fi blinks or a tab sleeps, reconnect and the transfer continues from the last confirmed piece instead of starting over.'],
  ['preview', 'Previews', 'See photos, videos, audio, PDF and text right in the browser. Previews are drawn safely, so a received page or script never runs.'],
  ['sync', 'Folder sync', 'Keep a folder in step between two computers: two way, push or pull. You review the plan of changes before anything is written.'],
  ['library', 'Local library', 'Keep received files in a library inside filefinch, stored in this browser on your own device, to preview, save or send again later. Nothing is kept online.'],
  ['qr', 'Invite link and QR code', 'One link or one QR code to connect, one short reply to finish. Scan with the camera or paste, whatever is easier.'],
  ['fingerprint', 'Connection fingerprint', 'Both screens show the same short code. Compare it and you know nobody swapped the invite in the middle.'],
  ['key', 'Optional passphrase', 'Add a passphrase and every chunk is sealed again with AES-GCM, with a key derived on each device. Nothing about it travels in the invite.'],
  ['shield', 'Integrity check', 'Every file is hashed with SHA-256 while it streams, and the receiver checks the result before marking it done.'],
  ['install', 'Installable, works offline', 'Install it as an app. Once loaded, the app itself works without internet, so two devices on the same local network can still connect.'],
  ['relay', 'Help with strict networks', 'When a direct route is impossible, filefinch says so in plain words and lets you add your own TURN relay in Settings.'],
  ['globe', 'Any modern browser', 'Windows, macOS, Linux, Android and iPhone. No app store, no install required, nothing to update.'],
];

const FAQ = [
  ['Is filefinch really free?', 'Yes. It is free and open source under the MIT license. There are no plans, no ads, no account and no tracking. Since there is no server of ours carrying your files, there is nothing to pay for.'],
  ['Do my files go through a server?', 'No. Files travel over a direct WebRTC connection between your two browsers. The only exception is a TURN relay, used only when both networks block direct connections. A relay forwards encrypted packets it cannot read, and filefinch tells you when one is in use.'],
  ['Is there a file size limit?', 'filefinch sets none. Files are read and sent in small chunks, so a 50 GB video works the same way as a photo. The real limits are free space on the receiving device and how long both devices stay connected.'],
  ['Do both devices need to be online at the same time?', 'Yes. There is no storage in the middle, so the sender and the receiver must both have filefinch open while the files fly. If one closes the tab, the transfer pauses and can resume when you reconnect.'],
  ['How do I connect two devices without an account?', 'Open filefinch on the first device and create an invite. Open the invite link or scan its QR code on the second device. It shows a short reply code; send it back by any messenger or scan it, and the devices connect directly.'],
  ['Can I send a whole folder?', 'Yes. Pick or drop a folder and filefinch sends every file with its relative path. In browsers with folder access the tree is written straight into a folder you pick; elsewhere the folder arrives as one streamed .zip download.'],
  ['Does it work between Android and iPhone, or Windows and Mac?', 'Yes. filefinch runs in the browser, so any pair of modern browsers can connect: Android to iPhone, Windows to Mac, phone to PC or laptop to laptop.'],
  ['What happens if the connection fails?', 'Usually one network is very strict (symmetric NAT or a corporate firewall). filefinch detects the failed connection, explains it in plain words and offers the TURN setting. Trying another network, like a phone hotspot, often works too.'],
  ['Can someone else join my transfer?', 'An invite works for one connection. Treat the link like a key: send it only to your own device or to the person you are sending to. Comparing the connection fingerprint on both screens confirms you are talking to the right device.'],
  ['Does filefinch work without internet?', 'Once the app is loaded or installed it works offline. Two devices on the same local network can still connect through the invite and reply codes, because they find each other on the local network.'],
];

const SCENES = [
  {
    id: 'phone-pc',
    tab: 'Phone to PC',
    art: 'phone-to-pc',
    alt: 'Photos and videos flying from a phone straight to a desktop computer',
    title: 'Photos from your phone to your PC, no cable',
    steps: ['Open filefinch on the PC and create an invite. A QR code appears.', 'Scan it with the phone camera, or open the link if you sent it to yourself.', 'Show the reply code to the PC camera or paste it, then pick the photos and videos.'],
    note: 'Videos arrive in their original quality and size. Nothing is recompressed.',
  },
  {
    id: 'pc-pc',
    tab: 'PC to PC',
    art: 'sync-twins',
    alt: 'Two computers keeping one folder in step with circular arrows between them',
    title: 'A whole project from one computer to another',
    steps: ['Create an invite on one computer and paste the link on the other, through any chat you trust.', 'Send the reply code back, then drop a folder or choose Sync.', 'Review the plan of changes and let the files fly. Next time only what changed is sent.'],
    note: 'On the same Wi-Fi or cable network the transfer stays inside your home or office.',
  },
  {
    id: 'android-iphone',
    tab: 'Android to iPhone',
    art: 'android-iphone',
    alt: 'Two different phones trading parcels through the browser',
    title: 'Android to iPhone, and back',
    steps: ['Open filefinch in the browser on both phones. No app store needed.', 'Scan the invite QR code with the other phone, then scan its reply code back.', 'Pick files on either side. Both phones can send and receive over the same connection.'],
    note: 'Keep the screen on while big files fly, since phones may pause background tabs.',
  },
];

const COMPARE = [
  ['Where your files go', 'Uploaded to a storage service, then downloaded', 'Straight from one device to the other'],
  ['Waiting time', 'Upload first, then the download can start', 'The receiver gets data as soon as it is sent'],
  ['Account', 'Usually needed, at least for large files', 'None'],
  ['Size limits', 'Set by the plan you are on', 'None set by filefinch'],
  ['Copies left online', 'Until a link expires or you delete them', 'None, nothing is stored online'],
  ['Who can read the files', 'The service can, unless it offers client side encryption', 'Only the two devices (DTLS, plus an optional passphrase)'],
  ['Both devices online', 'Not needed, the receiver can download later', 'Needed while the files fly'],
  ['Works without internet', 'No', 'Yes, on the same local network once the app is loaded'],
];

const LIMITS = [
  ['Both devices must be online', 'There is no mailbox in the middle. Keep filefinch open on both devices until the transfer finishes. If one side drops, resume picks it up later.'],
  ['Strict networks can block a direct route', 'When both devices sit behind strict NAT (common on some mobile carriers and office networks), a direct connection may be impossible. filefinch says so and offers a TURN relay setting. A relay forwards only encrypted packets.'],
  ['Speed follows the slower side', 'A direct connection is as fast as the slower of the two links. On the same Wi-Fi that is usually far faster than any upload, across the internet it depends on the upload speed of the sender.'],
  ['Phones sleep', 'Mobile browsers may pause a tab in the background. Keep the screen on for long transfers, or let resume continue when you come back.'],
  ['Saving huge files depends on the browser', 'Browsers with folder access write straight to disk. Others save through a streamed download, and a folder arrives as a .zip. Only small files are ever held in memory.'],
];

/** The live flow in the hero: four steps of a real connection. */
function flight(R, qrMarkup, link) {
  const steps = [
    ['Create an invite', 'A link and a QR code on the first device'],
    ['Send the reply', 'The second device answers with a short code'],
    ['Compare the fingerprint', 'Both screens show the same code'],
    ['Files fly direct', 'Device to device, encrypted'],
  ];
  return `<div class="flight" v-data="{ step: 1, playing: true }" v-init="playing = !REDUCED_MOTION; setInterval(() => { if (playing) step = step % 4 + 1 }, 3600)">
  <div class="flight-stage" :data-step="step" data-step="1" aria-live="polite">
    <div class="dev dev-laptop" aria-hidden="true">
      <div class="dev-screen">
        <div class="scr scr-1"><p class="scr-k">Invite ready</p><div class="scr-qr">${qrMarkup}</div><p class="scr-link"><svg class="ic"><use href="#i-link"/></svg><span>${esc(link)}</span></p><span class="scr-btn">Copy invite link</span></div>
        <div class="scr scr-2"><p class="scr-k">Waiting for the reply</p><p class="scr-field">#r=Kp3vQ8tZ2mY...</p><span class="scr-btn scr-btn-ok"><svg class="ic"><use href="#i-check"/></svg>Reply received</span></div>
        <div class="scr scr-3"><p class="scr-k">Connected directly</p><p class="scr-fp">7F2A&nbsp;91C4</p><p class="scr-sub"><svg class="ic"><use href="#i-lock"/></svg>Encrypted with DTLS</p></div>
        <div class="scr scr-4"><p class="scr-k">Sending 3 files</p>
          <div class="row"><span class="dot dot-a"></span><span class="nm">Holiday.mov</span><span class="bar"><i class="b1"></i></span></div>
          <div class="row"><span class="dot dot-b"></span><span class="nm">Photos/</span><span class="bar"><i class="b2"></i></span></div>
          <div class="row"><span class="dot dot-c"></span><span class="nm">Thesis.pdf</span><span class="bar"><i class="b3"></i></span></div>
        </div>
      </div>
      <div class="dev-base"></div>
    </div>
    <div class="lane" aria-hidden="true">
      <svg class="lane-trail" viewBox="0 0 200 120" preserveAspectRatio="none"><path d="M4 92 C60 4 140 4 196 92"/></svg>
      <span class="lane-item lane-qr">${'<i></i>'.repeat(3)}</span>
      <span class="lane-item lane-reply">#r=</span>
      <span class="lane-item lane-fp"><svg class="ic"><use href="#i-lock"/></svg></span>
      <img class="lane-item lane-finch lf-1" src="${R}assets/art/flyer.svg" width="64" height="56" alt="">
      <img class="lane-item lane-finch lf-2" src="${R}assets/art/flyer.svg" width="64" height="56" alt="">
      <img class="lane-item lane-finch lf-3" src="${R}assets/art/flyer.svg" width="64" height="56" alt="">
    </div>
    <div class="dev dev-phone" aria-hidden="true">
      <div class="dev-screen">
        <div class="scr scr-1"><p class="scr-k">Scan the invite</p><div class="scan"><span class="scan-c"></span><span class="scan-line"></span></div></div>
        <div class="scr scr-2"><p class="scr-k">Send this back</p><p class="scr-code">#r=Kp3v Q8tZ 2mY</p><span class="scr-btn">Share reply</span></div>
        <div class="scr scr-3"><p class="scr-k">Connected</p><p class="scr-fp">7F2A&nbsp;91C4</p><p class="scr-sub scr-sub-ok"><svg class="ic"><use href="#i-check"/></svg>Codes match</p></div>
        <div class="scr scr-4"><p class="scr-k">Receiving</p><div class="pv"><i></i><i></i><i></i><i></i></div></div>
      </div>
    </div>
  </div>
  <p class="sr-only" v-text="'Step ' + step + ' of 4'"></p>
  <div class="flight-ctl">
    <ol class="flight-steps">${steps.map(([t, d], i) => `<li><button type="button" :class="step === ${i + 1} ? 'is-on' : ''" :aria-pressed="step === ${i + 1} ? 'true' : 'false'" aria-pressed="${i === 0}" @click="step = ${i + 1}; playing = false"><span class="fs-n">${i + 1}</span><span class="fs-t">${t}</span><span class="fs-d">${d}</span></button></li>`).join('')}</ol>
    <button type="button" class="flight-play icon-btn" @click="playing = !playing" :aria-label="playing ? 'Pause the demo' : 'Play the demo'" aria-label="Pause the demo"><svg class="ic" v-show="playing" aria-hidden="true"><use href="#i-pause"/></svg><svg class="ic" v-show="!playing" style="display:none" aria-hidden="true"><use href="#i-play"/></svg></button>
  </div>
</div>`;
}

export function homeBody(R, { guides, qrMarkup, link }) {
  const en = guides.filter((g) => g.meta.lang === 'en');
  const pick = ['send-large-files-without-limits', 'transfer-files-from-phone-to-pc-without-cable', 'airdrop-for-windows-and-android', 'send-a-whole-folder', 'is-webrtc-file-sharing-safe', 'peer-to-peer-file-transfer-explained'];
  const featured = pick.map((s) => en.find((g) => g.meta.slug === s)).filter(Boolean);
  return `<section class="hero" aria-labelledby="hero-h">
  <div class="hero-sky" aria-hidden="true"><span class="sun"></span><span class="streak s1"></span><span class="streak s2"></span><span class="streak s3"></span></div>
  <div class="hero-in">
    <div class="hero-copy">
      <p class="kicker">Direct flight file transfer</p>
      <h1 id="hero-h">Send files straight to your own devices. <span>No cloud in between.</span></h1>
      <p class="lede">Like a personal drive between your phone and your computers, without the drive. Share an invite link or QR code and files and whole folders of any size fly from one device to the other, end to end encrypted.</p>
      <div class="hero-cta">
        <a class="btn btn-primary btn-lg cta-main" href="${R}app/"><svg class="ic" aria-hidden="true"><use href="#i-send"/></svg>Start sending</a>
        <a class="btn btn-outline btn-lg" href="#how">See how it works</a>
      </div>
      <ul class="promise">${PROMISES.map(([ic, t]) => `<li>${icon(R, ic, 22)}<span>${t}</span></li>`).join('')}</ul>
    </div>
    <div class="hero-demo">${flight(R, qrMarkup, link)}</div>
  </div>
</section>

<section class="band promises" aria-label="What filefinch promises">
  <ul class="promise-grid">${PROMISES.map(([ic, t, d]) => `<li>${icon(R, ic, 44)}<h2>${t}</h2><p>${d}</p></li>`).join('')}</ul>
</section>

<section id="how" class="sec" aria-labelledby="how-h">
  <header class="sec-head"><p class="kicker">How it works</p><h2 id="how-h">Three steps, one round trip</h2><p class="lede">There is no signaling server. The invite itself carries everything the second device needs to reach the first, compressed into a link and a QR code.</p></header>
  <ol class="how">
    <li><figure>${art(R, 'invite-qr', 'A laptop shows an invite QR code and a link while a phone scans it')}</figure><span class="how-n">1</span><h3>Create an invite</h3><p>Open filefinch on the first device and tap <strong>Create invite</strong>. You get a link and a QR code. Scan it with the other device, or send the link to yourself through any messenger.</p></li>
    <li><figure>${art(R, 'reply-code', 'The guest phone sends a short reply code back through any messenger')}</figure><span class="how-n">2</span><h3>Send the reply back</h3><p>The second device answers with a short reply code, also as a link or QR code. Paste it or scan it on the first device. That single round trip connects them, and you can paste by hand if a camera is not handy.</p></li>
    <li><figure>${art(R, 'direct-flight', 'Finn the finch flying a parcel straight between a phone and a laptop')}</figure><span class="how-n">3</span><h3>Files fly direct</h3><p>Both screens show the same short fingerprint. Compare it, then drop files or a folder. They stream straight to the other device, in either direction, with progress, previews and resume.</p></li>
  </ol>
</section>

<section id="privacy" class="sec sec-tint" aria-labelledby="privacy-h">
  <div class="split">
    <div>
      <p class="kicker">Why it is private</p>
      <h2 id="privacy-h">Your files take the direct line</h2>
      <p class="lede">Explained simply: filefinch is a web page that connects two browsers to each other. After that, it steps out of the way.</p>
      <ul class="checks">
        <li><strong>No server of ours ever sees your files or messages.</strong> There is no filefinch server at all: the site is static pages, and the connection is browser to browser.</li>
        <li><strong>WebRTC encrypts every connection end to end with DTLS.</strong> The keys are created inside the two browsers for each connection and never leave them.</li>
        <li><strong>Compare the fingerprint.</strong> Both devices show a short code derived from the two connection certificates. If they match, nobody swapped the invite on the way.</li>
        <li><strong>Add a passphrase for an extra layer.</strong> PBKDF2 with 600,000 rounds turns it into an AES-GCM key on each device, and every chunk is sealed again. The passphrase never travels.</li>
        <li><strong>No account, nothing stored online.</strong> No sign up, no analytics, no tracking. What you keep stays on your device.</li>
      </ul>
    </div>
    <figure class="split-art">${art(R, 'lock-line', 'Two devices joined by one direct line with a padlock in the middle')}</figure>
  </div>
  <div class="honest">
    <figure>${art(R, 'relay-tower', 'A relay tower that forwards sealed parcels between two devices behind strict network walls')}</figure>
    <div>
      <h3>The honest part: relays and addresses</h3>
      <p>Some networks block every direct route. Then a <strong>TURN relay</strong> can forward the traffic between the two devices. A relay only passes along encrypted packets and cannot read them, but it does see that two addresses are talking and how much data flows. filefinch tells you when a relay is in use, and you can add your own TURN server in Settings so only a relay you trust is used.</p>
      <p>To find a route, each browser asks a public <strong>STUN</strong> server for its public address. That server sees your IP address, as every website you visit does, and nothing else. The invite link contains the network addresses of the device that created it, so share it only with your own device or with the person you are sending to.</p>
      <p>No software can promise it is impossible to attack. What filefinch can promise is a short list of things that never happen: no upload to us, no account, no copy left online.</p>
    </div>
  </div>
</section>

<section id="features" class="sec" aria-labelledby="features-h">
  <header class="sec-head"><p class="kicker">Features</p><h2 id="features-h">Everything a parcel needs on the way</h2><p class="lede">Built for real files: big videos, deep folders, flaky Wi-Fi and phones that fall asleep.</p></header>
  <div class="feat-grid">${FEATURES.map(([ic, t, d]) => `<article class="feat">${icon(R, ic, 44)}<h3>${t}</h3><p>${d}</p></article>`).join('')}</div>
  <div class="feat-art">
    <figure>${art(R, 'folder-flock', 'A folder whose files fly out as a flock of small finches')}<figcaption>A folder flies as a flock: every file keeps its place in the tree.</figcaption></figure>
    <figure>${art(R, 'resume-flight', 'A transfer that lost its connection picks up again where it stopped')}<figcaption>Lost the connection? Reconnect and the transfer continues where it stopped.</figcaption></figure>
    <figure>${art(R, 'local-library', 'Finn sorting received files on a shelf on your own device')}<figcaption>The local library keeps the files you choose on your device, not online.</figcaption></figure>
  </div>
</section>

<section id="devices" class="sec sec-tint" aria-labelledby="devices-h" v-data="{ tab: 'phone-pc' }">
  <header class="sec-head"><p class="kicker">Device scenarios</p><h2 id="devices-h">Any device to any device</h2><p class="lede">filefinch runs in the browser, so the pair can be anything with a modern browser.</p></header>
  <div class="tabs" role="tablist" aria-label="Device scenarios">${SCENES.map((s, i) => `<button type="button" role="tab" id="tab-${s.id}" aria-controls="panel-${s.id}" :aria-selected="tab === '${s.id}' ? 'true' : 'false'" aria-selected="${i === 0}" :tabindex="tab === '${s.id}' ? '0' : '-1'" tabindex="${i === 0 ? 0 : -1}" @click="tab = '${s.id}'" @keydown.right="tab = '${SCENES[(i + 1) % 3].id}'; $el.nextElementSibling && $el.nextElementSibling.focus()" @keydown.left="tab = '${SCENES[(i + 2) % 3].id}'; $el.previousElementSibling && $el.previousElementSibling.focus()">${s.tab}</button>`).join('')}</div>
  ${SCENES.map((s, i) => `<div class="scene" role="tabpanel" id="panel-${s.id}" aria-labelledby="tab-${s.id}" v-show="tab === '${s.id}'"${i ? ' style="display:none"' : ''}>
    <figure>${art(R, s.art, s.alt)}</figure>
    <div><h3>${s.title}</h3><ol class="scene-steps">${s.steps.map((t) => `<li>${t}</li>`).join('')}</ol><p class="scene-note">${s.note}</p><a class="btn btn-primary" href="${R}app/">Start sending</a></div>
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
  <header class="sec-head"><p class="kicker">Guides</p><h2 id="guides-h">The flight manual</h2><p class="lede">Practical guides for moving files between your own devices.</p></header>
  <div class="cards">${featured.map((g) => card(R, g)).join('')}</div>
  <p class="more-link"><a class="btn btn-outline" href="${R}guides/">All guides<svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg></a></p>
</section>

<section class="final" aria-labelledby="final-h">
  <div class="final-in">
    <span class="art final-finn"><img class="art-l" src="${R}assets/art/finn.svg" width="220" height="220" alt="Finn the finch courier ready with a parcel" loading="lazy"><img class="art-d" src="${R}assets/art/finn-dark.svg" width="220" height="220" alt="" aria-hidden="true" loading="lazy"></span>
    <div><h2 id="final-h">Your files, on a direct flight</h2><p>Open filefinch on two devices and send your first file in under a minute. Free, open source, no account.</p><p class="hero-cta"><a class="btn btn-primary btn-lg cta-main" href="${R}app/"><svg class="ic" aria-hidden="true"><use href="#i-send"/></svg>Start sending</a><a class="btn btn-outline btn-lg" href="${REPO}" rel="noopener"><svg class="ic" aria-hidden="true"><use href="#i-github"/></svg>Source on GitHub</a></p></div>
  </div>
</section>`;
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
      featureList: FEATURES.map(([, t]) => t).concat(PROMISES.map(([, t]) => t)),
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

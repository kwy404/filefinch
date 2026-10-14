<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/filefinch@main/assets/mascot-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/filefinch@main/assets/mascot.svg" width="168" alt="Finn, the filefinch mascot: a small finch courier with a cap, a messenger bag and a tiny parcel">
  </picture>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/filefinch@main/assets/banner-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/filefinch@main/assets/banner.svg" width="820" alt="filefinch banner: send files and whole folders straight between your devices, no cloud, no account, no upload, end to end encrypted">
  </picture>
</p>

<h1 align="center">filefinch: send files and folders directly between your devices, free and private</h1>

<p align="center">
  <a href="https://github.com/kwy404/filefinch/actions/workflows/ci.yml"><img src="https://github.com/kwy404/filefinch/actions/workflows/ci.yml/badge.svg" alt="CI status of filefinch"></a>
  <a href="https://github.com/kwy404/filefinch/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-2f6fed" alt="MIT license"></a>
  <a href="https://kwy404.github.io/filefinch/app/"><img src="https://img.shields.io/badge/open-the%20app-ff7a45" alt="Open the filefinch app in your browser"></a>
  <img src="https://img.shields.io/badge/server%20of%20ours-none-22b98a" alt="No server of ours: peer to peer in the browser">
  <img src="https://img.shields.io/badge/account-none-22b98a" alt="No account needed">
  <img src="https://img.shields.io/badge/size%20limit-none-22b98a" alt="No size limit set by filefinch">
</p>

<p align="center">
  <a href="https://kwy404.github.io/filefinch/app/"><strong>Start sending</strong></a> &middot;
  <a href="https://kwy404.github.io/filefinch/">Website</a> &middot;
  <a href="https://kwy404.github.io/filefinch/guides/">Guides</a> &middot;
  <a href="https://github.com/kwy404/filefinch/blob/main/SECURITY.md">Security</a> &middot;
  <a href="https://github.com/kwy404/filefinch/blob/main/i18n/README.pt-BR.md">Leia em Português (pt-BR)</a>
</p>

**filefinch is a free peer to peer file transfer web app with no server of ours.** It works like a personal drive between your own phone and computers, without the drive in the middle: open it on two devices, type 6 words or scan a QR code, and send files and whole folders of any size straight from one device to the other. There is no account and no upload; the 6-word handshake travels encrypted through public relays that cannot read it, and your files go device to device, end to end encrypted by the browser.

## Contents

- [Why filefinch](#why-filefinch)
- [Quick start](#quick-start)
- [Features](#features)
- [How it works](#how-it-works)
- [Privacy and security](#privacy-and-security)
- [Limits, honestly](#limits-honestly)
- [Cloud upload or direct transfer?](#cloud-upload-or-direct-transfer)
- [FAQ](#faq)
- [Guides](#guides)
- [Run it locally](#run-it-locally)
- [Project layout](#project-layout)
- [More from kwy404](#more-from-kwy404)
- [Author](#author)
- [License](#license)

## Why filefinch

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/filefinch@main/assets/illustrations/direct-flight-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/filefinch@main/assets/illustrations/direct-flight.svg" width="560" alt="Finn the finch flying a parcel straight between a phone and a laptop across an open sky with no cloud">
  </picture>
</p>

Moving a file to your own other device usually means uploading it somewhere first. filefinch takes the direct flight instead:

- **No server of ours.** The site is static pages on GitHub Pages. No server of ours ever sees your files or messages.
- **No account.** Nothing to sign up for, nothing to log in to, no analytics and no tracking.
- **No upload.** Files go device to device over WebRTC, never to a storage service.
- **End to end encrypted.** WebRTC encrypts every connection with DTLS. An optional passphrase adds a second layer.
- **No size limit.** filefinch sets no cap. Files stream in small chunks, so the free space on the receiving device is the real limit.

## Quick start

1. Open [kwy404.github.io/filefinch/app/](https://kwy404.github.io/filefinch/app/) on the first device and tap **Show pairing code**. A QR code and 6 words appear side by side.
2. On the second device, type the 6 words (the first four letters of each are enough), or scan the QR code with the phone camera.
3. Both screens show the same short fingerprint. Compare it, then drop files or a folder. They fly straight across.

Prefer zero third parties? Choose **Use a link or QR instead**: the invite link carries the handshake itself and the other device answers with a short reply code. That mode also works offline on a local network once the app is loaded, and you can install filefinch as an app from the browser menu.

## Features

| | |
|---|---|
| **6 words or a QR code** | Type 6 words from a list of 2048, or scan the QR code next to them. The code works once and expires in 10 minutes. |
| **Zero third parties mode** | An invite link (or its QR code) carries the whole handshake, answered by one short reply. No relay at all. |
| **Whole folders** | The folder tree is rebuilt on the other side (or arrives as one .zip where the browser has no folder access). Incoming paths are sanitized so nothing can be written outside the folder you pick. |
| **Resume** | If the connection drops, reconnect and the transfer continues from the last confirmed chunk. |
| **Folder sync** | Two way, push or pull between two devices. You review the plan of changes before anything is written. |
| **Previews** | Images, video, audio, PDF and text, drawn safely so received pages or scripts never run. |
| **Local library** | Keep received files inside filefinch, stored in this browser, to preview, save or send again later. Nothing is kept online. |
| **Integrity check** | Every file is hashed with SHA-256 while it streams and verified by the receiver. |
| **Connection fingerprint** | A short code from both connection certificates, shown on both screens, to spot a swapped invite. |
| **Optional passphrase** | PBKDF2 (600,000 rounds) derives an AES-GCM key on each device and every chunk is sealed again. |
| **Strict network help** | When a direct route fails, filefinch explains why in plain words and lets you add your own TURN relay in Settings. |
| **Installable PWA** | Manifest and service worker. Works offline once loaded. |
| **Any browser, any device** | Windows, macOS, Linux, Android, iPhone and iPad. Android to iPhone works too. |

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/filefinch@main/assets/illustrations/folder-flock-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/filefinch@main/assets/illustrations/folder-flock.svg" width="560" alt="A folder whose files fly out as a flock of small finches, each carrying one file">
  </picture>
</p>

## How it works

Two browsers need to swap a WebRTC offer and answer before they can talk directly. filefinch has no server of its own for that, so it offers two ways:

**6 words (the default).** The first device shows 6 words from the BIP39 list and a QR code that holds the same words. Both devices derive a topic and a key from the words, meet on several public MQTT brokers and swap the offer and answer sealed with that key. The 6-word handshake travels encrypted through public relays that cannot read it; they only carry a random looking topic and ciphertext. The code works once, expires after 10 minutes, and both sides leave the brokers as soon as the connection opens. Your files never touch them: they go device to device.

**Zero third parties (invite link).** No relay carries anything:

1. The first device creates a WebRTC offer and waits until ICE gathering is complete (no trickle). The offer is reduced to the fields a data channel needs, compressed with `CompressionStream('deflate-raw')` and written as base64url into the link hash (`#i=...`) and into a QR code drawn by filefinch's own encoder.
2. The second device opens the link, builds its answer the same way and shows it as a short reply code (`#r=...`), also as a link or QR code.
3. The first device reads the reply. One round trip, and the browsers connect directly. Users never see JSON, and manual paste always works as a fallback.

To find a route, the browsers use Google's public STUN servers (`stun.l.google.com:19302` and `stun1` to `stun4`). Google offers no public TURN server, so when both devices sit behind strict NAT, a TURN relay is needed. You can add your own TURN servers in Settings; they are stored only on your device.

## Privacy and security

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://cdn.jsdelivr.net/gh/kwy404/filefinch@main/assets/illustrations/lock-line-dark.svg">
    <img src="https://cdn.jsdelivr.net/gh/kwy404/filefinch@main/assets/illustrations/lock-line.svg" width="560" alt="Two devices joined by one direct line with a padlock in the middle">
  </picture>
</p>

- No server of ours ever sees your files or messages. There is no filefinch server at all.
- The 6-word handshake travels encrypted through public MQTT relays that cannot read it. They see that two devices exchange a few small sealed messages, never the content, and never your files. With an invite link, no relay is involved.
- WebRTC encrypts every connection end to end with DTLS. The keys are made inside the two browsers.
- A TURN relay, when one is used, only forwards encrypted packets and cannot read them. It can see the two IP addresses and how much data flows.
- No account and nothing stored online. Received files stay on your device.
- The optional passphrase layer uses PBKDF2-SHA256 with 600,000 iterations to derive an AES-GCM 256 bit key on each device. Each chunk gets a fresh IV and is bound to its file and offset.
- Both screens show a short connection fingerprint. If they match, nobody swapped the invite or the reply on the way.

Honest notes: the STUN server sees your IP address, as any website does. The invite link contains the network addresses of the device that made it, so share it only with your own device or the person you are sending to. No software can promise it is impossible to attack; see [SECURITY.md](https://github.com/kwy404/filefinch/blob/main/SECURITY.md) for the threat model and how to report a problem.

## Limits, honestly

- **Both devices must be online** with filefinch open while the files fly. There is no mailbox in the middle.
- **Strict NAT on both sides** (some mobile carriers, corporate firewalls) can block a direct route. filefinch detects it and offers the TURN setting.
- **Speed follows the slower link.** Across the internet that is usually the sender's upload speed. On the same Wi-Fi the traffic stays local.
- **Phones may pause background tabs.** Keep the screen on for long transfers, or let resume pick it up.
- **Saving very large files depends on the browser.** Browsers with folder access write straight to disk; others save through a streamed download, and a folder arrives as a .zip.

## Cloud upload or direct transfer?

| | Upload to cloud storage | Direct with filefinch |
|---|---|---|
| Where files go | To a storage service, then down again | Straight to the other device |
| Account | Usually needed | None |
| Size limits | Set by the plan | None set by filefinch |
| Copies left online | Until the link expires or you delete them | None |
| Receiver offline | Works, downloads later | Both must be online |
| Without internet | No | Yes, on the same local network once loaded |

Both approaches are useful. A cloud upload is the right tool when the receiver is offline; filefinch is for getting a file onto your other device now, privately.

## FAQ

**How do I send large files without limits for free?** Open filefinch on both devices, connect with the 6 words or the QR code and drop the files. filefinch sets no size limit and streams files in chunks.

**How do I transfer files from my phone to my PC without a cable?** Open filefinch on the PC and show the pairing code, scan its QR code with the phone (or type the 6 words), then pick the photos and videos. They arrive in original quality.

**Is there an AirDrop for Windows and Android?** filefinch works in any modern browser, so it can send between Windows, Android, iPhone, Mac and Linux. It is independent and not affiliated with Apple, Google or Microsoft.

**Is WebRTC file sharing safe?** WebRTC encrypts every connection with DTLS. Compare the fingerprint on both screens to rule out a swapped invite, and add a passphrase for an extra layer.

**Can I send a whole folder?** Yes. The folder structure is rebuilt on the other side, and folder sync can keep two copies in step.

**Does it work without internet?** Once the app is loaded, the invite link mode works offline and two devices on the same local network can connect. The 6 word mode needs internet to reach the public relays.

## Guides

- [Send large files without limits](https://kwy404.github.io/filefinch/guides/send-large-files-without-limits/)
- [Transfer files from phone to PC without a cable](https://kwy404.github.io/filefinch/guides/transfer-files-from-phone-to-pc-without-cable/)
- [A free, private alternative to cloud transfer](https://kwy404.github.io/filefinch/guides/free-private-alternative-to-cloud-transfer/)
- [Send a whole folder](https://kwy404.github.io/filefinch/guides/send-a-whole-folder/)
- [Share files without uploading](https://kwy404.github.io/filefinch/guides/share-files-without-uploading/)
- [AirDrop for Windows and Android](https://kwy404.github.io/filefinch/guides/airdrop-for-windows-and-android/)
- [Send video in original quality](https://kwy404.github.io/filefinch/guides/send-video-in-original-quality/)
- [Peer to peer file transfer explained](https://kwy404.github.io/filefinch/guides/peer-to-peer-file-transfer-explained/)
- [Is WebRTC file sharing safe?](https://kwy404.github.io/filefinch/guides/is-webrtc-file-sharing-safe/)
- [Transfer files on the same Wi-Fi](https://kwy404.github.io/filefinch/guides/transfer-files-on-the-same-wifi/)
- [Sync folders between computers without a cloud](https://kwy404.github.io/filefinch/guides/sync-folders-between-computers-without-cloud/)
- Em português: [arquivos grandes sem limite](https://kwy404.github.io/filefinch/pt/guias/enviar-arquivos-grandes-sem-limite/), [do celular para o PC sem cabo](https://kwy404.github.io/filefinch/pt/guias/transferir-arquivos-do-celular-para-o-pc-sem-cabo/), [AirDrop para Windows e Android](https://kwy404.github.io/filefinch/pt/guias/airdrop-para-windows-e-android/)

## Run it locally

filefinch is static files, so any static server works. With Node 18 or newer:

```bash
git clone https://github.com/kwy404/filefinch.git
cd filefinch
npm ci
npm run build:app                  # copies src/ into docs/app/lib/ and refreshes the service worker
node scripts/site/build-site.mjs   # builds the landing page, guides, sitemap and art
npm run serve                      # serves docs/ locally
npm test                           # unit and site tests
npm run test:e2e                   # two browsers connect and transfer for real
```

WebRTC and the service worker need `localhost` or HTTPS. To test across two real devices, serve over HTTPS or use the published site.

## Project layout

| Path | What it holds |
|---|---|
| [`src/`](https://github.com/kwy404/filefinch/blob/main/src) | Shared modules: the 6 word rendezvous and invite signaling, QR encoder, crypto, protocol, chunking, SHA-256, paths |
| [`docs/app/`](https://github.com/kwy404/filefinch/blob/main/docs/app) | The app served on GitHub Pages, with its manifest and service worker |
| [`docs/`](https://github.com/kwy404/filefinch/blob/main/docs) | Landing page, guides, sitemap, robots and the 404 page |
| [`scripts/site/`](https://github.com/kwy404/filefinch/blob/main/scripts/site) | Site builder, guide sources and the art generators (mascot, icons, illustrations) |
| [`assets/`](https://github.com/kwy404/filefinch/blob/main/assets) | Mascot, banners, icon set and illustrations, light and dark |
| [`test/`](https://github.com/kwy404/filefinch/blob/main/test) | Unit tests, site tests and the two browser connection test |

## More from kwy404

- [Monsoon](https://kwy404.github.io/monsoon/): utility-first CSS with no build step
- [Voodoo.js](https://kwy404.github.io/Voodoo.js/): reactive HTML attributes
- [howlden](https://kwy404.github.io/howlden/): serverless peer to peer voice and chat rooms
- [breakhound](https://kwy404.github.io/breakhound/): finds bugs in any JavaScript library
- [vueleap](https://kwy404.github.io/vueleap/): migrate Vue 2 to Vue 3
- [graphemely](https://kwy404.github.io/graphemely/): emoji safe string utilities
- [numberparrot](https://kwy404.github.io/numberparrot/): parse localized numbers
- [edgegoat](https://kwy404.github.io/edgegoat/): edge case test inputs
- [cookieowl](https://kwy404.github.io/cookieowl/): cookie consent for LGPD and GDPR
- [installkite](https://kwy404.github.io/installkite/): make any site an installable PWA
- [a11ymedic](https://kwy404.github.io/a11ymedic/): accessibility checker with fixes
- [fontsketch](https://kwy404.github.io/fontsketch/): turn your handwriting into a font
- [kastor](https://kwy404.github.io/kastor/): TypeScript ORM for almost every database

## Author

Created by **Alexandre Kohler** ([GitHub](https://github.com/kwy404) and [LinkedIn](https://www.linkedin.com/in/alexandre-silva-173687256/)).

## License

[MIT](https://github.com/kwy404/filefinch/blob/main/LICENSE). AirDrop is a trademark of Apple Inc. filefinch is an independent project and is not affiliated with Apple, Google or Microsoft.

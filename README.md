<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/kwy404/filefinch/54913341b0dae51546e67d4cc69f8b70f5221e53/assets/banner-dark.svg">
    <img src="https://raw.githubusercontent.com/kwy404/filefinch/54913341b0dae51546e67d4cc69f8b70f5221e53/assets/banner.svg" width="820" alt="filefinch banner: Finn the finch carrying files straight between two devices">
  </picture>
</p>

<h1 align="center">filefinch</h1>

<p align="center">
  <a href="https://github.com/kwy404/filefinch/actions/workflows/ci.yml"><img src="https://github.com/kwy404/filefinch/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="https://github.com/kwy404/filefinch/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-2f6fed" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://kwy404.github.io/filefinch/app/"><strong>Open the app</strong></a> &middot;
  <a href="https://kwy404.github.io/filefinch/">Website</a> &middot;
  <a href="https://kwy404.github.io/filefinch/guides/">Guides</a> &middot;
  <a href="https://github.com/kwy404/filefinch/blob/main/SECURITY.md">Security</a> &middot;
  <a href="https://github.com/kwy404/filefinch/blob/main/i18n/README.pt-BR.md">Português</a>
</p>

filefinch sends files, folders and short texts between your own devices, straight from one browser to the other. Open it on two devices, pair them with six words or a QR code, and drop your files. There is no account, no upload and no server of ours in between.

## Quick start

1. Open [the app](https://kwy404.github.io/filefinch/app/) on the first device and press **Show pairing code**, or simply drop the files you want to send: the code appears right away.
2. On the second device, type the six words (the first four letters of each are enough) or scan the QR code.
3. One screen shows six confirmation words. Type them on the other device. Once they match, the files go across.

Devices you have paired before are remembered, so next time you pick the device and only type the confirmation words.

## Features

- **Pair with six words or a QR code.** The code works once and expires in 10 minutes.
- **Confirmation words.** A device that only saw your code cannot match them, so no file goes to a stranger.
- **Known devices.** Reconnect to a device you paired before without new pairing words. Forget it at any time.
- **Text and links.** Send a note or a link between your devices, like a shared clipboard.
- **Any size, whole folders.** Files stream in 64 KiB chunks straight to disk, folders keep their tree, and every file is checked with SHA-256.
- **Resume.** If the connection drops, the transfer continues from the last confirmed chunk.
- **Folder sync.** Two way, push or pull, with a plan of changes you approve first.
- **Previews and a local library.** Look at photos, video, audio, PDF and text before saving.
- **Optional passphrase.** A second AES-GCM layer on top of the browser encryption.
- **Installable and offline.** Once loaded, invite links work on a local network without internet.

## How it works

Two browsers need to exchange a small WebRTC offer and answer before they can talk directly.

- **Six words (default).** Both devices turn the words into a topic and a key, meet on a few public MQTT relays and swap the offer and answer sealed with that key. The relays only see random names and ciphertext, and both devices leave them as soon as they connect.
- **Invite link (zero third parties).** The link or its QR code carries the whole offer, and the other device answers with a short reply code. No relay is used.

After that, files go device to device over a WebRTC data channel encrypted with DTLS. To find a route, the browsers ask a public STUN server for their public address. If both networks block direct routes, you can add your own TURN relay in Settings; it only forwards encrypted packets.

## Limits

- Both devices must be online with filefinch open while files are sent.
- Very strict networks can block a direct route. filefinch says so and offers the TURN setting.
- Speed follows the slower of the two connections.
- Phones may pause background tabs, so keep the screen on for long transfers.

See [SECURITY.md](https://github.com/kwy404/filefinch/blob/main/SECURITY.md) for the threat model and how to report a problem.

## Guides

- [Send files from your phone to a computer](https://kwy404.github.io/filefinch/guides/transfer-files-from-phone-to-pc-without-cable/)
- [Send a whole folder](https://kwy404.github.io/filefinch/guides/send-a-whole-folder/)
- [Keep a folder in sync between two computers](https://kwy404.github.io/filefinch/guides/sync-folders-between-computers-without-cloud/)
- [What a filefinch transfer protects](https://kwy404.github.io/filefinch/guides/is-webrtc-file-sharing-safe/)

## Run it locally

filefinch is static files. With Node 18 or newer:

```bash
git clone https://github.com/kwy404/filefinch.git
cd filefinch
npm ci
npm run build:app     # copies src/ into docs/app/lib/
npm run build:site    # builds the website in docs/
npm run serve         # serves docs/ locally
npm test              # unit and site tests
npm run test:e2e      # two browsers connect and transfer for real
```

WebRTC and the service worker need `localhost` or HTTPS.

| Path | What it holds |
|---|---|
| `src/` | Shared modules: pairing, invite links, QR encoder, crypto, protocol, chunking, SHA-256 |
| `docs/app/` | The app, with its manifest and service worker |
| `docs/` | Website, guides, sitemap and the 404 page |
| `scripts/site/` | Website builder, guide sources and art generators |
| `test/` | Unit tests, site tests and the browser connection tests |

## More from kwy404

[Monsoon](https://kwy404.github.io/monsoon/), [Voodoo.js](https://kwy404.github.io/Voodoo.js/), [howlden](https://kwy404.github.io/howlden/), [breakhound](https://kwy404.github.io/breakhound/), [vueleap](https://kwy404.github.io/vueleap/), [graphemely](https://kwy404.github.io/graphemely/), [numberparrot](https://kwy404.github.io/numberparrot/), [edgegoat](https://kwy404.github.io/edgegoat/), [cookieowl](https://kwy404.github.io/cookieowl/), [installkite](https://kwy404.github.io/installkite/), [a11ymedic](https://kwy404.github.io/a11ymedic/), [fontsketch](https://kwy404.github.io/fontsketch/) and [kastor](https://kwy404.github.io/kastor/).

## Author and license

Made by **Alexandre Kohler** ([GitHub](https://github.com/kwy404) and [LinkedIn](https://www.linkedin.com/in/alexandre-silva-173687256/)). Released under the [MIT license](https://github.com/kwy404/filefinch/blob/main/LICENSE).

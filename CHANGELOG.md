# Changelog

All notable changes to filefinch are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Files first: pick or drop files on the start screen and the pairing code appears right away. The files are counted under the code and go by themselves once the devices are confirmed, and the sender moves to the Send tab to watch them leave.
- Text and links between devices, like a shared clipboard: a box on the Send tab (Ctrl + Enter sends, a Paste button where the browser allows it), and the texts that arrived on the Received tab with Copy and, for a single http or https address, Open. Each text is marked Waiting, Sent or Delivered; texts typed while disconnected go out on the next connection, and with a passphrase they are sealed with it like file chunks. Ctrl + V on the Send tab sends pasted files or puts pasted text in the box.
- Special dates in the app: on the same dates as the website, a thin two color line under the header and Finn in costume on the start screen, with a Turn off button. Turning it off on the site or in the app keeps it off on both until next year. The script and Finn's costumes are kept for offline use.
- Known devices: after the confirmation words match, the two devices agree on a fresh random secret over the confirmed channel and remember each other (a switch on the status screen turns it off). Next time each taps the other under "Your devices": they meet on the relays with a topic and key derived from that secret, so there are no pairing words to type, only the confirmation words. Devices can be forgotten at any time.

### Changed

- Invites are a QR code and six words only: the app shows no invite address, copy link or share link button. The QR code still carries the words for a phone camera.
- The link mode left Settings and the start screen. It stays as "Connect with no relays (advanced)" under Options: one device shows a QR code, the other answers with its own, and either can be scanned or its code pasted.

### Fixed

- The passphrase prompt showed its text keys instead of its title and explanation.
- The installed app could not start offline: one of its scripts (library.js) was left out of the offline cache.

## [0.2.0] - 2026-10-14

### Added

- Pairing with 6 words (BIP39 list) or the QR code beside them: both devices derive a topic and a key from the words and swap the WebRTC offer and answer, sealed, through several public MQTT relays that cannot read it. The code works once and expires in 10 minutes; the first four letters of each word are enough.
- Confirmation words: the device that joins shows six words derived from both connection certificates and a nonce, and they must be typed on the first device before any file moves. Three wrong tries close the connection. The 12 digit fingerprint stays under details.
- The phone can scan a small QR code of the words and join without typing; pairing works in both directions.
- Animations for connecting, sending and receiving, with vibration on phones and an optional sound. All motion is off under reduced motion.
- Redesigned website: the lit "direct flight" landing page with a finch made of light, a scroll driven file flight, product screenshots and fifteen new illustrations.

### Fixed

- A reply that arrives twice in link mode (pasted and handed over from another tab) is now ignored with a friendly note instead of an error.
- Pairing word tiles fit the longest words at every screen width.

## [0.1.0] - 2026-10-14

First public release.

### Added

- Zero third parties mode: an invite link and QR code (`#i=...`) with the complete WebRTC offer compressed with deflate-raw, answered by a short reply code (`#r=...`). One round trip, camera scanning where `BarcodeDetector` exists, paste everywhere.
- QR code encoder written from the standard: byte mode, versions 1 to 40, error correction levels L, M, Q and H, and all eight masks.
- Direct transfers of files and whole folders over a WebRTC data channel, in both directions, with progress, speed and time left.
- Resume from the last confirmed chunk after a dropped connection.
- SHA-256 integrity check of every file, hashed while it streams.
- Optional passphrase layer: PBKDF2-SHA256 (600,000 iterations) to an AES-GCM 256 bit key, every chunk sealed with its own IV and bound to its file and offset.
- Short connection fingerprint shown on both devices.
- Folder sync between two devices (two way, push or pull) with a reviewed plan of changes.
- Previews of images, video, audio, PDF and text, and a local library stored in the browser.
- Streaming destinations: a picked folder through the File System Access API, a streamed download through the service worker (folders as .zip), or the local library.
- Plain language explanation when a connection fails, and settings for your own STUN and TURN servers, stored locally.
- Installable PWA that works offline once loaded.
- Website with a landing page, eleven English guides, three Portuguese guides, sitemap, robots, Open Graph images and a 404 page.
- Finn the finch courier mascot, an original icon set and illustrations in light and dark.

[0.2.0]: https://github.com/kwy404/filefinch/releases/tag/v0.2.0
[0.1.0]: https://github.com/kwy404/filefinch/releases/tag/v0.1.0

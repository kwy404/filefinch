# Changelog

All notable changes to filefinch are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

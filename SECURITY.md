# Security policy

filefinch moves files directly between two browsers. This page explains what it protects, what it does not, and how to report a problem.

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x | Yes |

The published app at https://kwy404.github.io/filefinch/app/ always runs the latest version.

## How filefinch protects a transfer

- **No server of ours.** The site is static files on GitHub Pages. There is no filefinch backend that could store, read or log your files or messages.
- **Sealed 6 word handshake.** With the default 6 word pairing, both devices derive a topic and a key from the words and exchange the WebRTC offer and answer through public MQTT relays, sealed with that key. The relays carry only a random looking topic and ciphertext. A code works once and expires after 10 minutes, and the connection fingerprint still lets you confirm the right device. With the Zero third parties mode (an invite link), no relay is involved.
- **DTLS on every connection.** WebRTC encrypts every data channel end to end with DTLS. The keys are generated inside the two browsers for each connection.
- **Connection fingerprint.** Both devices show a short code derived from the DTLS certificate fingerprints of both sides. If the codes match, the invite and the reply were not swapped by someone in the middle.
- **Optional passphrase.** PBKDF2-SHA256 with 600,000 iterations and a random salt derives an AES-GCM 256 bit key on each device. Every chunk is sealed again with a fresh 12 byte IV and authenticated together with its file and offset, so chunks cannot be reordered, replayed into another file or modified. The passphrase is never stored and never sent.
- **Integrity.** Every file is hashed with SHA-256 while it streams and the receiver checks the hash.
- **Untrusted input.** Messages from the other device are validated before use, incoming paths are sanitized so nothing can be written outside the chosen folder, text is shown with `textContent`, and previews are rendered so received HTML or scripts never run.

## What filefinch does not protect against

- **IP addresses.** To find a route, each browser asks a public STUN server (Google's) for its public address, so that server sees your IP address. The invite link contains the network addresses of the device that created it. Share invites only with your own device or the person you are sending to.
- **The public MQTT relays.** They are run by third parties. They can see the IP addresses that connect to them, the timing and the size of the few sealed handshake messages, but not their content, and never your files. If you prefer that nobody relays the handshake, use an invite link.
- **Relays.** When both devices are behind strict NAT, a TURN relay may forward the traffic. It only sees encrypted packets, but it does see both IP addresses, timing and the amount of data. Use a relay you trust; you can configure your own in Settings.
- **A compromised device or browser.** Malware, a malicious browser extension or someone with access to an unlocked device can read files before they are encrypted or after they arrive.
- **Skipping the fingerprint check.** If an attacker can replace both the invite and the reply in transit and nobody compares the fingerprint, the connection could be intercepted. Compare the code, or use a passphrase shared by another channel.
- **The person you send to.** Once a file arrives, the receiver has a copy.

No software can promise it is impossible to attack. These are the limits as we understand them today.

## Reporting a vulnerability

Please report security problems privately through GitHub's private vulnerability reporting on https://github.com/kwy404/filefinch/security/advisories/new. Include the steps to reproduce, the browsers involved and the impact you expect.

You can expect a first reply within a week. Please give us a reasonable time to fix the problem before you publish details. We are happy to credit you in the changelog.

---
slug: free-private-alternative-to-cloud-transfer
lang: en
title: A Free, Private Alternative to Cloud File Transfer | filefinch
description: A free, private alternative to cloud transfer. Send files straight between two browsers with WebRTC encryption, no upload, no account and no tracking.
h1: A free and private alternative to cloud file transfer
keyword: private alternative to cloud transfer
art: cloud-vs-direct
alt: A file going up to a cloud and down again next to a file flying straight across
time: PT5M
howto: How to send a file directly instead of through the cloud
steps:
  - name: Open filefinch on both devices
    text: Open the filefinch app in a browser on the sending and receiving devices. There is no account to create.
  - name: Show the pairing code
    text: On one device, tap Show pairing code. The screen shows 6 words and a QR code that holds the same words.
  - name: Enter the 6 words on the other device
    text: Type the 6 words in the Have a pairing code? box or scan the QR code. For zero third parties in the setup, use an invite link and send the short reply code back instead.
  - name: Verify and optionally add a passphrase
    text: Type the 6 confirmation words shown on the second device into the first one. With an invite link, check that both screens show the same 12 digit fingerprint instead. For extra protection, both people can type the same passphrase.
  - name: Send the files
    text: Pick the files and send. They travel directly between the two browsers and are checked with SHA-256 on arrival.
faq:
  - q: Is filefinch really free?
    a: Yes. filefinch is free and open source under the MIT license. It is a static site, there is no paid tier, and there is no server of ours storing your files that would need paying for.
  - q: Does filefinch upload my files anywhere?
    a: No. Your files go device to device over a WebRTC data channel. The 6-word handshake passes through public relays, but only as sealed connection details, never files. If a strict network forces a TURN relay, it forwards encrypted packets it cannot read and does not store files.
  - q: Who can see that I am sending a file?
    a: The public STUN servers see your IP address, never files, and a TURN relay, if used, can see the two IP addresses and how much data flows. With 6 words, public MQTT brokers briefly carry random looking topic names and ciphertext, and like any server they see the address that connects. The Zero third parties link mode skips those brokers, and filefinch itself has no analytics or tracking.
  - q: When should I still use a cloud link instead?
    a: When the receiver cannot be online at the same time as you, when you share one file with many people, or when you need the file stored long term. A direct transfer needs both devices online together.
  - q: Do I need an account or an email address?
    a: No. There is no sign up, no login and no email. You open the app, connect two devices with 6 words, a QR code or an invite link, and send.
related: [share-files-without-uploading, is-webrtc-file-sharing-safe, peer-to-peer-file-transfer-explained, send-large-files-without-limits]
---
Cloud storage links are a convenient way to share files, and for many situations they are the right choice. But they always involve a copy of your file sitting on someone else's server, an account somewhere, and usually limits on size or how long a link lives. If all you want is to move a file from one place to another, there is a simpler and more private route: send it directly.

filefinch is a free, open source web app that does this. It connects two browsers to each other and streams the file across, with no upload step, no account and no tracking. This guide explains how it compares to a cloud transfer, what privacy it really gives you, and where its honest limits are.

## Cloud transfer and direct transfer, side by side

A cloud transfer has two legs. The file travels up from your device to a server, gets stored there, and then the other person downloads it. A direct transfer has one leg: the file leaves your device and arrives on theirs.

| Question | Cloud link | filefinch direct transfer |
|---|---|---|
| Copy stored on a server | Yes, until deleted | No |
| Account needed | Usually | No |
| Receiver must be online at the same time | No | Yes |
| Size limits | Set by the plan | None set by filefinch |
| Encryption in transit | Yes | Yes, DTLS between the two browsers |
| Good for many recipients | Yes | No, it connects two devices |
| Cost | Free tiers and paid plans | Free and open source |

Neither approach is better at everything. The table is meant to help you pick, not to declare a winner.

## What "private" means here

Privacy claims are easy to make and hard to check, so here is exactly what happens when you use filefinch:

- **No account, no analytics, no tracking.** The site is static and hosted on GitHub Pages. There is no backend of ours collecting data.
- **No file storage in the middle.** Files go over a WebRTC data channel from browser to browser.
- **Encryption in transit.** WebRTC always encrypts with DTLS. The keys are generated in the two browsers for each connection.
- **A way to check the connection.** After a 6 word pairing, the device that joined shows 6 confirmation words, and you type them on the other device. They are derived from both encryption certificates and a session nonce, so a device that joined with a code someone saw over your shoulder gets different words. In the invite link mode, both devices show a short fingerprint (12 digits) derived from both certificates instead. If the codes match, nobody slipped into the middle while the devices were being introduced.
- **An optional passphrase layer.** If both people type the same passphrase, each chunk is sealed again with AES-GCM using a 256 bit key derived through PBKDF2-SHA256 with 600,000 iterations. Every chunk gets a fresh random IV and is bound to its file and position, so chunks cannot be reordered, swapped into another file or edited. The passphrase itself never travels.

What filefinch does not do is make you anonymous. To find a direct path, each browser asks a public STUN server (Google's public servers are used) for its own public address. That server sees your IP address, never your files. If you pair with 6 words, the handshake also passes briefly through public relays run by third parties, as described below. The [privacy section](home:#privacy) on the home page lays this out too.

## How the two devices find each other

Before two browsers can talk directly, they need a short introduction: each has to learn the other's network addresses and session details. filefinch offers two ways to do that, and neither one uses a server of ours.

### The default: pair with 6 words

1. On the first device, tap Show pairing code. The screen shows 6 words and a QR code side by side.
2. On the second device, type the 6 words in the "Have a pairing code?" box or scan the QR code. The QR code holds the same words, so both routes use the same handshake.
3. The two browsers connect directly, and both leave the relays as soon as the connection opens.
4. The second device shows 6 new confirmation words. Type them on the first device. No file moves until they match, and three wrong tries close the connection.

The words come from the BIP39 English list of 2048 words. The first four letters of each are enough, single typos are fixed and autocomplete helps. Both devices derive a topic name and a key from the words, then meet on several public MQTT brokers, run by third parties rather than by filefinch, to swap their sealed offer and answer. The 6-word handshake travels encrypted through public relays that cannot read it; the brokers only carry random looking topic names and ciphertext. The code works once and expires after 10 minutes, and your files go device to device without ever touching those relays. The [connect section](home:#connect) on the home page shows this flow.

### Zero third parties: an invite link and a reply

If you want no outside service in the handshake at all, choose "Prefer zero third parties? Use a link or QR instead" and create an invite.

1. The first device writes its full connection offer, compressed, into an invite link and a QR code.
2. The second device opens the link or scans the code and produces a short reply, also as a link or QR code.
3. The reply goes back by any channel you like: a messenger, an email, or the first device's camera.

That single round trip is enough, and no relay carries it. Once connected, compare the 12 digit fingerprint on both screens. This mode also works fully offline on a local network once the app is loaded. Because the invite contains the network addresses of the device that made it, share it only with your own device or the person you are sending to, and use each invite for one connection.

| Question | 6 words (default) | Zero third parties link |
|---|---|---|
| What you share | 6 words or a QR code | An invite link, then a reply code |
| Who carries the handshake | Public relays, sealed with a key from the words | You, through any channel you choose |
| Needs internet | Yes | No, on a local network once loaded |
| Where your files go | Device to device | Device to device |

The [peer to peer explainer](guide:peer-to-peer-file-transfer-explained) goes into more depth.

## When a relay is involved

Sometimes a direct path is impossible. Both devices may be behind strict NAT, a mobile carrier may use carrier grade NAT, or a corporate firewall may block peer connections. In those cases a TURN relay can forward the traffic.

A relay only forwards encrypted packets, so it cannot read your files. It can, however, see the two IP addresses and how much data flows. filefinch detects when a connection fails, explains why in plain words, and offers a Settings option to add your own TURN servers, stored locally on your device.

## Other things you get for free

Skipping the cloud does not mean giving up features:

- **No file size limit set by filefinch.** Practical limits are disk space and staying online. See [sending large files without limits](guide:send-large-files-without-limits).
- **Resume after a drop.** Reconnect and the transfer continues from the last confirmed point.
- **Integrity check.** Every file is hashed with SHA-256 while streaming and verified on arrival.
- **Whole folders.** The folder structure is rebuilt on the other side.
- **Previews.** Images, video, audio and text can be previewed before saving.
- **Works offline once loaded.** It installs as a web app, and with the invite link mode two devices on the same network can connect without internet.

## When filefinch is not the right tool

A cloud transfer is genuinely better in some cases, and it is worth being clear about them:

- **The receiver is not available right now.** filefinch has no mailbox. If they will download it later, upload it to a cloud service.
- **You share with a group.** One link that many people open is easier than many separate direct connections.
- **You need storage, not transport.** Backups and archives belong somewhere that keeps them.
- **Both networks block direct connections and you have no relay.** In that rare case, a cloud link will get the file through.

For moving files between your own devices, or to one person who can stay online with you, a direct transfer is free, private by design and has fewer limits. Open [filefinch](app:) and see how it feels to send without uploading.

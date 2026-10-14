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
  - name: Share the invite
    text: Create an invite on one device and share the link or QR code with your other device or the person receiving.
  - name: Return the reply code
    text: The receiver gets a short reply code and sends it back through any messenger, or shows it to the first device's camera.
  - name: Verify and optionally add a passphrase
    text: Check that both screens show the same connection fingerprint. For extra protection, both people can type the same passphrase.
  - name: Send the files
    text: Pick the files and send. They travel directly between the two browsers and are checked with SHA-256 on arrival.
faq:
  - q: Is filefinch really free?
    a: Yes. filefinch is free and open source under the MIT license. It is a static site, there is no paid tier, and there is no server of ours storing your files that would need paying for.
  - q: Does filefinch upload my files anywhere?
    a: No. Files go over a WebRTC data channel from one browser to the other. If a strict network forces a TURN relay, that relay forwards encrypted packets it cannot read, but it does not store files.
  - q: Who can see that I am sending a file?
    a: The public STUN servers used to find each device's address see your IP address, never files. A relay, if one is used, can see the two IP addresses and how much data flows. filefinch itself has no analytics or tracking.
  - q: When should I still use a cloud link instead?
    a: When the receiver cannot be online at the same time as you, when you share one file with many people, or when you need the file stored long term. A direct transfer needs both devices online together.
  - q: Do I need an account or an email address?
    a: No. There is no sign up, no login and no email. You open the app, connect two devices with a link or QR code, and send.
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
- **A way to check the connection.** Both devices show a short fingerprint derived from both encryption certificates. If the codes match, nobody swapped the invite or reply to sit in the middle.
- **An optional passphrase layer.** If both people type the same passphrase, each chunk is sealed again with AES-GCM using a 256 bit key derived through PBKDF2-SHA256 with 600,000 iterations. Every chunk gets a fresh random IV and is bound to its file and position, so chunks cannot be reordered, swapped into another file or edited. The passphrase itself never travels.

What filefinch does not do is make you anonymous. To find a direct path, each browser asks a public STUN server (Google's public servers are used) for its own public address. That server sees your IP address, never your files. The [privacy section](home:#privacy) on the home page lays this out too.

## How the connection is made without a server of ours

Most direct transfer tools need a signaling server to introduce the two devices. filefinch avoids that by putting the introduction into the link itself.

1. The first device creates an invite. Its full connection offer is compressed and written into a link and a QR code.
2. The second device opens the link or scans the code and produces a short reply, also as a link or QR code.
3. The reply goes back by any channel you like: a messenger, an email, or the first device's camera.

That single round trip is enough. Because the invite contains the network addresses of the device that made it, share it only with your own device or the person you are sending to, and use each invite for one connection. The [peer to peer explainer](guide:peer-to-peer-file-transfer-explained) goes into more depth.

## When a relay is involved

Sometimes a direct path is impossible. Both devices may be behind strict NAT, a mobile carrier may use carrier grade NAT, or a corporate firewall may block peer connections. In those cases a TURN relay can forward the traffic.

A relay only forwards encrypted packets, so it cannot read your files. It can, however, see the two IP addresses and how much data flows. filefinch detects when a connection fails, explains why in plain words, and offers a Settings option to add your own TURN servers, stored locally on your device. A free public relay may be included when one is available, but that cannot be promised.

## Other things you get for free

Skipping the cloud does not mean giving up features:

- **No file size limit set by filefinch.** Practical limits are disk space and staying online. See [sending large files without limits](guide:send-large-files-without-limits).
- **Resume after a drop.** Reconnect and the transfer continues from the last confirmed point.
- **Integrity check.** Every file is hashed with SHA-256 while streaming and verified on arrival.
- **Whole folders.** The folder structure is rebuilt on the other side.
- **Previews.** Images, video, audio and text can be previewed before saving.
- **Works offline once loaded.** It installs as a web app, and two devices on the same network can connect without internet.

## When filefinch is not the right tool

A cloud transfer is genuinely better in some cases, and it is worth being clear about them:

- **The receiver is not available right now.** filefinch has no mailbox. If they will download it later, upload it to a cloud service.
- **You share with a group.** One link that many people open is easier than many separate direct connections.
- **You need storage, not transport.** Backups and archives belong somewhere that keeps them.
- **Both networks block direct connections and you have no relay.** In that rare case, a cloud link will get the file through.

For moving files between your own devices, or to one person who can stay online with you, a direct transfer is free, private by design and has fewer limits. Open [filefinch](app:) and see how it feels to send without uploading.

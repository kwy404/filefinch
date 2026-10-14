---
slug: is-webrtc-file-sharing-safe
lang: en
title: Is WebRTC File Sharing Safe? An Honest Security Guide | filefinch
description: Is WebRTC file sharing safe? How DTLS encryption, fingerprints, TURN relays, STUN and invite links really work, plus what a browser app cannot protect.
h1: Is WebRTC file sharing safe? What it protects and what it does not
keyword: is webrtc file sharing safe
art: fingerprint-match
alt: Both screens show the same short connection fingerprint
time: PT6M
howto: How to make a filefinch transfer as safe as possible
steps:
  - name: Share the invite privately
    text: Send the invite link or QR code only to your own device or to the one person receiving the files, through a channel you trust.
  - name: Compare the connection fingerprint
    text: Once connected, check that both screens show the same short fingerprint code. If they differ, disconnect and start over.
  - name: Add a passphrase for sensitive files
    text: Agree on a passphrase in person or by phone, and have both people type it in filefinch before sending.
  - name: Check the result
    text: Let the transfer finish so the receiver can verify the SHA-256 hash of every file.
  - name: Close the session when done
    text: Close filefinch on both devices and create a fresh invite for the next transfer instead of reusing an old link.
faq:
  - q: Is WebRTC encrypted?
    a: Yes. WebRTC data channels are always encrypted with DTLS, and browsers do not let a web page turn that off. The keys are created in the two browsers for each connection.
  - q: Can a TURN server read my files?
    a: No. A TURN relay only forwards packets that are already encrypted between the two browsers. It can see both IP addresses, the timing and roughly how much data moved, but not the content.
  - q: Does WebRTC leak my IP address?
    a: To build a direct connection, each device has to learn the other device's network address, and the STUN server sees your public IP. That is how peer to peer works. Share invites only with people you would give your address to.
  - q: What does the connection fingerprint protect against?
    a: It protects against someone swapping the invite or the reply code on the way, which is a man in the middle attack. If both screens show the same code, the two browsers are talking directly to each other.
  - q: Is filefinch safe on a computer with malware?
    a: No browser app can fully protect you if one of the devices is compromised. Malware on either end can read files before they are encrypted or after they are decrypted. Keep both devices updated and trusted.
related: [peer-to-peer-file-transfer-explained, share-files-without-uploading, free-private-alternative-to-cloud-transfer, transfer-files-on-the-same-wifi]
---
Short answer: WebRTC file sharing is safe for most everyday needs, as long as you understand what the encryption covers and handle the invite link with a little care. Every WebRTC data channel is encrypted, nobody in the middle can read the bytes, and the files never sit on a server. That still leaves a few honest caveats about IP addresses, relays and the devices themselves.

This guide walks through each layer that filefinch uses, explains the trade offs in plain words, and ends with the things no browser based tool can protect you from. No promises of perfect security here, just how it actually works.

## What happens when two browsers connect

filefinch has no signaling server and no backend of its own. The first device creates an invite, which is the full WebRTC offer, compressed and packed into a link and a QR code. The second device opens that link or scans the code, then shows a short reply code that goes back to the first device. After that single round trip, the two browsers talk directly over a WebRTC data channel.

That design has a nice side effect for privacy: there is no account, no upload, no copy of your files on anyone else's machine, and no analytics watching what you send. If you want the full picture of the handshake, read [peer to peer file transfer explained](guide:peer-to-peer-file-transfer-explained).

## Encryption in transit: DTLS

WebRTC always encrypts data channels with DTLS, the datagram version of the TLS protocol that protects HTTPS pages. A web page cannot switch it off. Each browser generates its own key material for every connection, so there is no shared master key sitting somewhere that could unlock past transfers.

In practice this means:

- Someone on the same public Wi-Fi who captures your traffic sees encrypted packets, not files.
- Your internet provider sees that encrypted traffic is flowing, but not what it contains.
- A relay server in the path, if one is used, forwards ciphertext it cannot open.

The details are standardized in IETF documents such as [RFC 8827](https://www.rfc-editor.org/rfc/rfc8827) on WebRTC security architecture, if you want the formal version.

## The connection fingerprint and man in the middle attacks

Encryption only helps if you are encrypting to the right person. The weak spot in any manual pairing scheme is the exchange of the invite and the reply. If someone could intercept that exchange and swap in their own invite, each side would happily set up an encrypted channel with the attacker, who could then pass the data along while reading it. That is a man in the middle.

filefinch adds a check for this. Each session description contains a DTLS certificate fingerprint, and filefinch derives a short code from both of them. Both devices display that code after connecting.

> If the two screens show the same fingerprint, nobody swapped the invite or the reply on the way. If they differ, disconnect and start again with a fresh invite.

Comparing takes a few seconds when both devices are in front of you. For a remote friend, read the code to each other on a phone call. This is the single most useful habit for sensitive transfers.

## Network addresses, STUN and TURN

A direct connection needs each side to know where to find the other. Two helpers make that possible, and each one sees a little metadata.

### STUN and what your IP address reveals

To find a direct path through home routers, filefinch asks public STUN servers from Google what your public address looks like from the outside. The STUN server learns your IP address at that moment. It never sees your files, file names or anything else from the transfer.

The invite link itself also carries network addresses, called ICE candidates, for the device that created it. That is unavoidable for a direct connection: the other side has to know where to reach you. So treat an invite the way you would treat your home address:

- Share it only with your own device or the specific person receiving files.
- Do not post invites in public chats, forums or social media.
- Use a fresh invite for each connection. An invite is meant for one connection.

If hiding your IP address from the other person is a hard requirement, a direct peer to peer tool is simply not the right fit for that situation.

### TURN relays: when traffic goes through a middle server

Sometimes both devices sit behind strict NAT, such as symmetric NAT, carrier grade NAT on some mobile networks, or a locked down corporate firewall. A direct path may then be impossible, and the connection fails. filefinch detects this, explains it in plain words, and lets you add your own TURN servers in Settings. Those settings stay on your device. When a free public relay happens to be available, it may be included too, but there is no guarantee one always is.

A TURN relay forwards the encrypted DTLS packets between the two browsers. Here is what it can and cannot see:

| A TURN relay can see | A TURN relay cannot see |
|---|---|
| Both IP addresses | File contents |
| When the transfer happens | File names and folder paths |
| Roughly how much data moved | Your passphrase, if you use one |

If you run your own TURN server, you control that metadata too.

## The passphrase layer for sensitive files

DTLS already encrypts everything. The optional passphrase adds a second, independent seal that you control. Both people type the same passphrase, and each device derives an AES-GCM 256 bit key from it using PBKDF2-SHA256 with 600,000 iterations and a random 16 byte salt. The passphrase itself never travels over the connection.

Every 64 KiB chunk is then sealed again with a fresh random 12 byte IV and bound to its file and offset as additional authenticated data. That means a chunk cannot be reordered, swapped into another file or edited without the receiver noticing. On top of that, every file is hashed with SHA-256 while it streams, and the receiver checks the hash at the end.

Pick a passphrase that is long and not reused elsewhere, and share it through a different channel than the invite, ideally out loud. A passphrase sent in the same chat as the invite adds much less.

## What a browser app cannot protect you from

Honesty matters more than marketing here. filefinch, like any browser based tool, cannot defend against:

- **A compromised device.** Malware, a malicious browser extension or someone with access to either computer can read files before encryption or after decryption.
- **Sending to the wrong person.** If you hand the invite to someone you should not trust, encryption faithfully delivers your files to them.
- **What the receiver does next.** Once saved, a file is out of your hands.
- **Metadata visible to the network.** Your provider, the STUN server and any relay can see that a connection happened and roughly how big it was.
- **A tampered copy of the app.** Only open filefinch from its real address, and keep your browser updated so the WebRTC and crypto code inside it gets security fixes.

Received files are kept in your browser storage on your own device so you can preview them later. On a shared computer, clear that local library when you are done.

## When filefinch is not the right tool

If the receiver cannot be online at the same time, if you need to hide your IP address from the other side, or if your organization requires audited enterprise file transfer with logging, a different tool fits better. For the many ordinary cases, such as moving photos to your laptop or sending a large video to a friend, a direct encrypted transfer is a solid choice.

## A short safety checklist

1. Share invites privately and only once.
2. Compare the fingerprint on both screens.
3. Use a passphrase for anything sensitive, shared by voice.
4. Keep browsers and operating systems updated.
5. Clear the local library on shared devices.

Ready to try it? Open [filefinch](app:) on two devices, or read more about [privacy on the home page](home:#privacy).

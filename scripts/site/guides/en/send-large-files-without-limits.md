---
slug: send-large-files-without-limits
lang: en
pair: enviar-arquivos-grandes-sem-limite
title: Send Large Files Without Limits, Free and Directly | filefinch
description: How to send large files without limits, for free, straight from one browser to another. No upload, no account, no size cap set by filefinch, with resume.
h1: How to send large files without limits, straight from device to device
keyword: send large files without limits
art: big-file
alt: A flock of finches carrying one very large film reel together
time: PT5M
howto: How to send a large file with filefinch
steps:
  - name: Open filefinch on both devices
    text: Open the filefinch app in a modern browser on the sending device and on the receiving device. No account or install is needed.
  - name: Create an invite on the sender
    text: On the first device, create an invite. filefinch shows it as a link and as a QR code.
  - name: Join from the receiver
    text: Open the link or scan the QR code on the second device, then send the short reply code back by any messenger or show it to the first device's camera.
  - name: Compare the fingerprint
    text: Check that both screens show the same short connection code. If they match, the connection is between your two devices and nobody in the middle.
  - name: Pick the file and send
    text: Choose the large file on the sender. It streams in small chunks, and the receiver checks a SHA-256 hash when it finishes.
  - name: Keep both devices awake
    text: Leave both devices online with filefinch open until the transfer completes. If the connection drops, reconnect and it resumes.
faq:
  - q: Is there a file size limit in filefinch?
    a: filefinch does not set one. The practical limits are free disk space on the receiving device, both devices staying online, and how the receiving browser saves files.
  - q: What happens if the connection drops in the middle of a big transfer?
    a: Reconnect the two devices and the transfer continues from the last confirmed point instead of starting over. You lose at most a small piece that was in flight.
  - q: Does the receiver need to be online at the same time?
    a: Yes. filefinch sends directly between two open browsers, so there is no mailbox in the middle. If the other person cannot be online with you, a cloud upload is the better tool.
  - q: How fast is it to send a 50 GB file?
    a: It depends on the slower of the two connections, usually the sender's upload speed over the internet. On the same Wi-Fi or wired network the traffic stays local and is often much faster than uploading.
  - q: Do I need to install anything to send large files?
    a: No. filefinch runs in Chrome, Edge, Firefox and Safari. You can install it as an app if you like, but it works from a normal browser tab.
related: [share-files-without-uploading, send-video-in-original-quality, transfer-files-on-the-same-wifi, peer-to-peer-file-transfer-explained]
---
To send a large file without a size limit, skip the upload step entirely: connect the two devices directly and stream the file from one browser to the other. filefinch does exactly that. It is free, open source and runs in the browser, and it does not cap the size of what you send. The real limits are the free space on the receiving disk and keeping both devices online until the last byte arrives.

This guide explains how the direct approach works, how to set it up in a few minutes, what affects speed, and when a different tool is a better fit.

## Why most ways of sending big files hit a wall

Almost every common method has a ceiling somewhere. Email attachments are usually limited to a few dozen megabytes. Messaging apps compress video or refuse files above a certain size. Cloud storage links work for larger files, but the file first has to travel all the way up to a server, then all the way down again, and free plans tend to cap either the file size, the total storage or how long the link stays alive.

A direct transfer removes the middle step. Instead of upload, wait, then download, the bytes leave one device and land on the other in a single pass. There is no server holding a copy, so there is no server quota to fit inside.

## How filefinch sends a file of any size

filefinch uses WebRTC, the same browser technology behind video calls, to open a data channel between your two devices. Once that channel is open, the file flows across it like this:

1. The sender reads the file in **64 KiB chunks** with the browser's file slicing, so even a file larger than the device's memory never has to be loaded whole.
2. Each chunk goes over the encrypted data channel. WebRTC always encrypts with DTLS, and the keys are generated in the two browsers for that connection.
3. While the file streams, the sender computes a **SHA-256 hash** incrementally. The receiver computes its own and compares them at the end, so you know the copy is identical.
4. The receiver writes the data to disk as it arrives instead of holding everything in memory.

Because nothing is buffered in full on either side, a 2 GB video and a 200 GB disk image take the same path. The bigger one just takes longer.

## Setting up the connection

There is no account and no signaling server of ours in the middle. The setup is one round trip:

1. Open [filefinch](app:) on the device that has the file and create an invite. It appears as a link and as a QR code.
2. On the receiving device, open that link or scan the QR code with the camera.
3. The receiver gets a short reply code, also as a link or QR code. Send it back through any messenger you like, or simply hold it up to the first device's camera.
4. The two browsers connect directly.

If camera scanning is not available in your browser, copying and pasting the codes always works.

> Before sending anything sensitive, look at the short connection fingerprint on both screens. If both show the same code, nobody swapped the invite or reply on the way.

For extra protection you can add a passphrase that both people type. Each chunk is then sealed again with AES-GCM using a key derived from that passphrase, and the passphrase itself never travels over the network. The [privacy section](home:#privacy) covers this in more detail.

## Where the practical limits really are

filefinch does not impose a cap, but physics and browsers still do. Plan around these:

| Limit | What it means for you |
|---|---|
| Free disk space | The receiving device needs room for the whole file. Check before you start a very large transfer. |
| Both devices online | The sender and receiver must stay connected with filefinch open. There is no copy waiting anywhere else. |
| How the browser saves | Desktop Chromium browsers can write straight into a folder you choose. Other browsers save through a streamed download handled by a service worker. |
| Connection speed | The slower side sets the pace, which is usually the sender's upload speed over the internet. |
| Sleeping devices | Mobile browsers may pause background tabs, so keep the screen on during long transfers. |

None of these depend on a plan or a subscription. A bigger disk and a steady connection are all you need for a bigger file.

## Resume instead of starting over

Long transfers are where interruptions hurt the most. A router restart or a laptop lid closing at 90 percent is frustrating when the only option is to begin again.

filefinch keeps track of how much the receiver has confirmed. If the connection drops, reconnect the two devices and the transfer continues from the last confirmed offset, rounded to a chunk boundary. In practice you lose only the small piece that was in flight. The final hash check still covers the whole file, so a resumed transfer is verified exactly like an uninterrupted one.

## Getting the best speed

Speed is not a fixed number, and you should be wary of anyone quoting one without knowing your network. A few things make a real difference:

- **Use the same network when you can.** If both devices are on the same Wi-Fi or wired network, the traffic stays local and is often much faster than any upload. The guide to [transferring files on the same Wi-Fi](guide:transfer-files-on-the-same-wifi) goes deeper.
- **Prefer a cable or a strong signal on the sender.** Upload speed is usually the bottleneck across the internet.
- **Close heavy background uploads.** Cloud backups and game updates compete for the same bandwidth.
- **Keep both screens on.** A phone that dims and pauses the tab slows things down or stops them.

Once the app has loaded, two devices on the same local network can even connect with no internet at all, because the invite contains their local network addresses.

## Video and large media keep their quality

People often look for a way to send big files because they want to share video without it being shrunk. filefinch sends files byte for byte. There is no recompression, no resizing and no metadata stripping, so the receiver gets exactly the original. The receiver can also preview images, video, audio and text in the browser before saving. See [sending video in original quality](guide:send-video-in-original-quality) for tips specific to cameras and phones.

## When filefinch is not the right tool

Being honest about trade-offs saves you time:

- **The receiver cannot be online with you.** filefinch has no mailbox. If someone needs to download the file tomorrow while you are asleep, a cloud link is the better choice.
- **You want to share with many people at once.** A direct transfer is between two devices. For wide distribution, hosting the file somewhere is simpler.
- **Both sides are behind very strict networks.** Some mobile carriers and corporate firewalls block direct connections. filefinch detects this, explains it and lets you add your own TURN relay in Settings, but a relay may not always be available for free.
- **You need a long term backup.** filefinch moves files. It is not a storage service.

For everything else, especially moving huge files between your own devices or to someone who can stay online with you, a direct transfer is usually the simplest path with the fewest limits. Open [filefinch](app:) on both devices and try it with your next big file.

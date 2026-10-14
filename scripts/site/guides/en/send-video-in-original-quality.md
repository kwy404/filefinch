---
slug: send-video-in-original-quality
lang: en
title: Send Video in Original Quality, Without Compression | filefinch
description: Send video in original quality, byte for byte. Learn why messaging apps often compress video and how to share full resolution clips with any device for free.
h1: How to send video in original quality, without compression
keyword: send video in original quality
art: preview-gallery
alt: Received photos and a video shown as previews on a tablet
time: PT3M
howto: How to send a video in original quality with filefinch
steps:
  - name: Open filefinch on both devices
    text: Open the web app in a modern browser on the device with the video and on the receiving device.
  - name: Pair with 6 words
    text: On the device with the video, tap Show pairing code. On the other device, type the 6 words or scan the QR code next to them.
  - name: Or use an invite link
    text: If you prefer zero third parties, create an invite link instead, open it on the other device and send the short reply code back.
  - name: Confirm the 6 words
    text: The receiving device shows 6 new confirmation words. Type them on the device with the video. With an invite link, check that both screens show the same 12 digit fingerprint instead.
  - name: Send the original video
    text: Choose the video files. They go device to device, byte for byte, and are checked with SHA-256 when they arrive.
faq:
  - q: Why does my video look worse after sending it in a messaging app?
    a: Many messaging apps compress video by default to save data and storage, which lowers the resolution or bitrate. Some apps offer a higher quality option or a way to send the clip as a file. To keep the exact original, use a method that copies the file without re-encoding it.
  - q: How can I send a video without losing quality?
    a: Send the original file instead of a re-encoded version. A USB cable, a cloud storage link or a direct browser transfer with filefinch all keep the original. filefinch sends the video byte for byte between two devices that are online at the same time.
  - q: Does the video pass through a server when I use filefinch?
    a: No. To connect, the 6-word handshake travels encrypted through public relays that cannot read it, and then the video goes device to device. If you prefer zero third parties, an invite link carries the handshake instead, so no relay passes it along.
  - q: Does filefinch keep video metadata?
    a: Yes. Files are sent byte for byte, so the recording date, location and camera details stored in the file stay as they were.
  - q: How do I know the video arrived unchanged?
    a: filefinch hashes each file with SHA-256 while it streams, and the receiver checks the hash at the end. You can also compare the file size, resolution and metadata with the original.
  - q: Is there a size limit for sending videos?
    a: filefinch does not set one. The practical limits are free space on the receiving device and both devices staying online during the transfer. Interrupted transfers can resume from the last confirmed point.
related: [send-large-files-without-limits, transfer-files-from-phone-to-pc-without-cable, airdrop-for-windows-and-android, transfer-files-on-the-same-wifi]
---
You record a sharp clip in high resolution, send it to a friend, and what arrives looks soft, blocky in the dark scenes, or noticeably smaller than the original. Nothing went wrong. Many messaging apps compress videos by default, and for everyday chat that is often a sensible choice. When you need the original file, though, for editing, archiving or pulling still frames, you need a way to send video in original quality.

This guide explains why compression happens, how to tell whether your video was changed, which options keep the file intact, and how to send the exact original from one device to another with filefinch, a free browser app that transfers files directly between devices.

## Why messaging apps compress video

Video files are large. A few minutes of high resolution footage from a modern phone can take hundreds of megabytes, sometimes more. Messaging services handle enormous numbers of messages, and many people watch on mobile data with limited plans. Re-encoding a video at a lower bitrate or resolution makes it faster to send, cheaper to store and quicker to play on a small screen.

So compression is a trade off, not a flaw. A smaller file that arrives in seconds is exactly right for a funny moment shared in a group chat. It is the wrong trade off when the video is the work itself: wedding footage, a client project, drone shots you plan to edit, or family videos you want to archive at full quality.

Typical changes during compression can include:

- Lower resolution, for example a 4K clip reduced to a smaller size
- Lower bitrate, which shows up as blur, banding and blocky shadows
- A lower frame rate in some cases
- A different codec or container format
- Removed or altered metadata such as the recording date, location or camera details

Exactly what happens depends on the app, its settings and its current version. Some apps offer a higher quality setting or a way to send the clip as a document or file, which usually keeps more of the original. Check the app's own help pages for the options it offers today.

## How to check whether your video was compressed

Compare the received file with the original:

1. **File size.** If the received file is much smaller, it was almost certainly re-encoded.
2. **Resolution and frame rate.** Most file information panels and video players show both.
3. **Metadata.** Look for the original recording date and the camera details.
4. **A checksum.** For certainty, compare a SHA-256 hash of both files. Matching hashes mean the files are identical byte for byte.

If any of these differ, you are not looking at the original.

## Options that keep the original

| Method | Keeps the original | Good to know |
|---|---|---|
| USB cable | Yes | Needs the right cable and sometimes drivers |
| Cloud storage link | Usually | Upload first, the receiver downloads later |
| Email attachment | Yes, if it fits | Attachment size limits are often too small for video |
| Messaging app, file or document mode | Often | Depends on the app and its size limits |
| Bluetooth | Yes | Slow for large videos |
| Direct browser transfer with filefinch | Yes | Both devices online at the same time |

## Sending the original with filefinch

filefinch sends files byte for byte. There is no recompression step anywhere, and metadata is kept as is. The video is read in small chunks on the sender's device and streamed straight to the receiving browser over an encrypted WebRTC connection. Each file is hashed with SHA-256 while it streams, and the receiver checks the hash at the end, so the copy you get matches the original.

1. Open [filefinch](app:) on the device with the video and on the receiving device.
2. On the device with the video, tap **Show pairing code**. You will see 6 words and a QR code side by side.
3. On the receiving device, type the 6 words or scan the QR code. The first four letters of each word are enough, and autocomplete helps.
4. The receiving device shows 6 new confirmation words. Type them on the device with the video. No file moves until they match.
5. Pick the video files and send. You can send several clips at once, or a whole folder.

To connect, the 6-word handshake travels encrypted through public relays that cannot read it. Those relays are run by third parties, not by filefinch, and they only help the two devices find each other. The code works once, expires after 10 minutes, and both devices leave the relays as soon as the connection opens. Your files go device to device, and the video itself never passes through a relay of that kind.

### Prefer zero third parties?

You can skip the relays entirely. Choose "Prefer zero third parties? Use a link or QR instead", create an invite, and open the link or scan its QR code on the other device. That device shows a short reply code, which you send back through any messenger or show to the first device's camera. The link itself carries the handshake. Once connected, compare the 12 digit connection fingerprint on both screens. This mode also works offline between two devices on the same local network once the app is loaded, which is handy in a studio or on location with no internet.

On the receiving side you can preview videos, photos and audio in the browser before saving them, which is a quick way to confirm you got the right clip. Received files also stay in a local library on that device, so you can save or clear them later.

## Long and large videos

Video is where file size gets serious. A few things help:

- **No size cap from us.** filefinch does not set a file size limit. The receiver needs enough free disk space, and both devices must stay online.
- **Saving.** Desktop Chromium browsers such as Chrome and Edge can write directly into a folder you pick. Other browsers save through a streamed download, so the whole video does not have to fit in memory.
- **Resume.** If the connection drops, reconnect and the transfer continues from the last confirmed point instead of starting over.
- **Same network.** If both devices are on the same Wi-Fi or wired network, the traffic stays local and is often much faster than uploading across the internet.
- **Keep the screen on.** Mobile browsers may pause background tabs, which can stall a long transfer.

For more on very big files, see [send large files without limits](guide:send-large-files-without-limits).

## Common situations

### From phone to editing computer

Shoot on the phone, edit on the PC or Mac. Sending the original clips straight to the computer gives your editor the full resolution and the original frame rate. The [phone to PC guide](guide:transfer-files-from-phone-to-pc-without-cable) covers this route in detail.

### Between an iPhone and an Android phone

Both phones have a browser, so the same steps work regardless of brand. The [guide for Windows and Android users looking for AirDrop](guide:airdrop-for-windows-and-android) explains the cross platform options.

### Sharing with a client or collaborator

If they can be online at the same time, a direct transfer gives them the exact file you exported. Read the 6 words to them over the phone, or send them by message, and they can connect from wherever they are. Agree on a short passphrase too if you want an extra layer of encryption on top of the standard WebRTC encryption.

## When filefinch is not the right tool

Direct transfer needs both devices online at the same time with filefinch open. If your client is in another time zone and will download tomorrow, a cloud storage link is the better tool. If you only want to share a quick clip for fun and the other person will watch it on a phone, the messaging app's compressed version may be all anyone needs. And if many people need to download the same video over several days, use a hosting or cloud service built for that.

Some strict networks also block direct connections. filefinch explains when this happens and lets you add your own TURN relay in Settings. And if no public relay answers the 6 word pairing, an invite link still connects the two devices.

## Summary

Compression is a reasonable default for chat, and a problem when the video itself matters. To send video in original quality, use a method that copies the file without re-encoding it, then verify the result with the file size, the metadata or a checksum. filefinch does this directly between two browsers, free and without an account. Open [the app](app:) and try it with your next clip.

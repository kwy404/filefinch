---
slug: transfer-files-on-the-same-wifi
lang: en
title: Transfer Files on the Same Wi-Fi Between Any Devices | filefinch
description: Transfer files on the same Wi-Fi between phone, laptop and tablet, free in the browser. Traffic stays on your local network and works even without internet.
h1: How to transfer files on the same Wi-Fi between any devices
keyword: transfer files on the same wifi
art: same-wifi
alt: A phone, a laptop and a tablet under one Wi-Fi signal sending files across the room
time: PT3M
howto: How to transfer files over the same Wi-Fi with filefinch
steps:
  - name: Connect both devices to the same network
    text: Join the same Wi-Fi network on both devices, or plug the computer into the same router with a cable.
  - name: Open filefinch on both devices
    text: Load filefinch in a modern browser on each device. Installing it as an app lets it start even when the internet is down.
  - name: Show the pairing code
    text: On the first device, tap Show pairing code. A QR code and 6 words appear side by side.
  - name: Type the 6 words or scan the QR code
    text: On the second device, type the words in the Have a pairing code box or scan the QR code. With no internet, use the Zero third parties link mode instead.
  - name: Pick files and send
    text: Choose files or a whole folder on either side. They travel across your local network and the receiver checks every file when it finishes.
faq:
  - q: Can I transfer files over Wi-Fi without internet?
    a: Yes, with the Zero third parties link mode, once filefinch has been loaded on both devices. The default 6 word pairing needs internet to reach its public relays, but the invite link and reply code work on a local network with no internet at all.
  - q: Is transferring files over the same Wi-Fi faster?
    a: Often, yes. The traffic stays inside your home or office network instead of going out to the internet and back, so it is not limited by your upload speed. Actual speed depends on your router, signal and devices.
  - q: Do my files go through the internet when I pair with 6 words?
    a: No. Only the short handshake goes out, sealed, through public relays that cannot read it. Once the devices connect, your files go device to device across the local network.
  - q: Why can my devices not see each other on public Wi-Fi?
    a: Many public and guest networks isolate connected devices from each other for safety. In that case a direct local path is blocked. Try your own network, a phone hotspot, or let the connection go through the internet instead.
  - q: Do I need to install an app on my phone?
    a: No. filefinch runs in the browser on Android, iPhone, iPad and computers. You can optionally add it to your home screen so it opens like an app and works offline.
  - q: Can I send files from Android to iPhone on the same Wi-Fi?
    a: Yes. Any pair works, including Android to iPhone, Windows to Mac and phone to PC, as long as both have a modern browser.
related: [transfer-files-from-phone-to-pc-without-cable, airdrop-for-windows-and-android, send-a-whole-folder, peer-to-peer-file-transfer-explained]
---
When two devices share one Wi-Fi network, sending a file to the gadget across the room should not require uploading it to a server on another continent first. With filefinch, a phone, laptop or tablet on the same network can connect directly in the browser, and the bytes stay inside your home or office.

It is free, open source and needs no account. It also mixes brands freely: Android to iPhone, Windows to Mac, a tablet to a Linux desktop. This guide covers how it works on a local network, how to pair with or without internet, how to get the most speed out of it and what to do when devices refuse to see each other.

## Why the same Wi-Fi is the best case for a transfer

Most ways of sharing files go through the internet even when both devices sit on the same desk. A cloud link means uploading every byte to a server and then downloading it again. Your upload speed is usually the slowest part of a home connection, so that round trip can take far longer than it should.

On a local network, filefinch builds a WebRTC connection between the two browsers. Whichever way you pair, the connection details include each device's local network addresses, so the browsers find each other inside the network and the data never leaves the router. In practice that is often much faster than an upload, and it keeps working when your internet connection is slow or metered.

## Step by step: pair with 6 words

The default way to connect is a pairing code made of 6 words, with a QR code next to them.

1. Join the same Wi-Fi on both devices. A computer plugged into the same router with a cable counts too.
2. Open [filefinch](app:) in a modern browser (Chrome, Edge, Firefox or Safari) on both devices.
3. On the first device, tap Show pairing code. A QR code and 6 words appear side by side.
4. On the second device, type the 6 words in the Have a pairing code box, or scan the QR code with the camera. The first four letters of each word are enough, and autocomplete helps.
5. Once connected, the second device shows 6 new confirmation words. Type them on the first device. When they match, choose files on either side.

For this step only, the 6-word handshake travels encrypted through public relays that cannot read it, so the devices need internet for a moment. After that, your files go device to device across your own network. The code works once and expires after 10 minutes.

The connection works in both directions, so you can send photos from the phone to the laptop and a document back without reconnecting.

### Zero third parties: the invite link

Prefer that no relay is involved, or have no internet at all? Use the link mode instead. Tap the option to use a link or QR, then Create invite. The second device scans the invite QR code or opens the link, and shows a short reply code. Show that reply to the first device's camera, or copy and paste it. One round trip and you are connected. Then check that both screens show the same 12 digit fingerprint. Where camera scanning is not supported, pasting the code always works.

## Transferring files with no internet at all

filefinch is a progressive web app with a service worker. After the first visit, the app is stored in the browser and can open offline. Two devices on the same network can then connect using only their local addresses, with the Zero third parties link mode.

The 6 word mode is the one exception here: it needs internet to reach the public relays for the handshake. If the line is down, or no relay answers, switch to the link mode and everything else works the same.

This is handy in a few situations:

- A cabin, boat or venue with a router but no internet line
- A phone hotspot used just to link two devices together
- An office network where outside traffic is restricted
- Travel, when mobile data is expensive and the hotel Wi-Fi is unreliable

> Load filefinch once on each device while you still have internet, and optionally install it to the home screen. After that it is ready for offline use in the link mode.

## Getting good speed on a local network

Speed on a local network depends on the hardware more than on filefinch. A few habits help:

- **Stay close to the router.** Wi-Fi speed drops through walls and distance.
- **Prefer the faster band.** If your router offers 5 GHz or newer bands, connecting both devices there typically helps compared with 2.4 GHz.
- **Use a cable for the computer.** A wired desktop removes one wireless hop.
- **Keep the phone screen on.** Mobile browsers may pause background tabs, which stalls a long transfer.
- **Avoid other heavy traffic.** Big downloads or streaming on the same network share the airtime.

Files are read in 64 KiB chunks and streamed, so even a very large video does not need to fit in memory. If Wi-Fi drops for a moment, reconnect and the transfer resumes from the last confirmed point instead of starting over.

## When devices cannot connect on the same Wi-Fi

Sometimes two devices on what looks like the same network still fail to connect directly. Common reasons:

| Situation | What is going on | What to try |
|---|---|---|
| Hotel, cafe or airport Wi-Fi | Client isolation keeps devices apart | Use a phone hotspot or let the connection go over the internet |
| Guest network on your router | Guest mode often blocks device to device traffic | Connect both to the main network |
| One device on mobile data | They are not on the same network after all | Turn Wi-Fi on for both |
| VPN active on one device | Traffic is routed elsewhere | Pause the VPN for the local transfer |
| No relay answers the 6 words | No internet, or the network blocks the relays | Use the Zero third parties link mode |

If a direct path is impossible, filefinch explains the failure in plain words and you can add your own TURN relay in Settings. A relay only forwards encrypted packets, but traffic then leaves your network, so local speed is lost.

## Is it safe on a shared network?

The data channel is always encrypted with DTLS, so other people on the same Wi-Fi see encrypted packets, not your files. Matching confirmation words after a 6 word pairing, or the same 12 digit fingerprint on both screens in the link mode, confirm nobody swapped the connection details during pairing. For sensitive files you can add a passphrase that both people type, which seals every chunk again with AES-GCM. The full explanation, including what the pairing relays can and cannot see, is in [is WebRTC file sharing safe](guide:is-webrtc-file-sharing-safe).

Keep in mind that the pairing details contain your device's network addresses, so show the 6 words or share an invite only with your own device or the person receiving the files.

## Sending folders and keeping originals

You are not limited to single files. Pick a whole folder and its structure is rebuilt on the other side, with file names cleaned up so they are valid on the receiving system. Photos and videos travel byte for byte, so there is no recompression and the original quality and metadata stay intact. See [send a whole folder](guide:send-a-whole-folder) for the details, or [transfer files from phone to PC without a cable](guide:transfer-files-from-phone-to-pc-without-cable) for a phone focused walkthrough.

## When filefinch is not the right tool

filefinch needs both devices online at the same time with the app open. If you want files to appear on a device that is switched off, a cloud folder is a better fit. If you need a permanent shared drive that every device mounts all day, a network share or a home server suits that job. And on a network that blocks device to device traffic with no workaround, a USB stick may simply be quicker.

For the everyday case of moving photos, videos and documents between your own gadgets in the same room, a direct local transfer is hard to beat. Open [filefinch](app:) on two devices and try it.

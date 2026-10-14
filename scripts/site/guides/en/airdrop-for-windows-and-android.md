---
slug: airdrop-for-windows-and-android
lang: en
pair: airdrop-para-windows-e-android
title: AirDrop for Windows and Android, a Free Browser Alternative | filefinch
description: Looking for AirDrop for Windows and Android? AirDrop is Apple only, but you can send files between any phone and PC in the browser, free and with no account.
h1: AirDrop for Windows and Android, and a way that works on every device
keyword: airdrop for windows and android
art: android-iphone
alt: Two different phones trading parcels through the browser
time: PT3M
howto: How to send files between Windows, Android and Apple devices with filefinch
steps:
  - name: Open filefinch on both devices
    text: Open the web app in any modern browser on the Windows PC, Android phone, iPhone or Mac. No install or account is needed.
  - name: Show the pairing code
    text: On the first device, tap Show pairing code. It shows 6 words and a QR code that holds the same words.
  - name: Type the words or scan the code
    text: On the second device, type the 6 words or scan the QR code with the camera. The first four letters of each word are enough.
  - name: Or use an invite link
    text: If you prefer zero third parties, create an invite link instead, open it on the second device and send the short reply code back.
  - name: Confirm the words and send
    text: The second device shows 6 new confirmation words. Type them on the first device, then choose your files and send. With an invite link, check that both screens show the same 12 digit fingerprint instead.
faq:
  - q: Is there an AirDrop for Windows or Android?
    a: No. AirDrop is an Apple feature that works between Apple devices such as iPhone, iPad and Mac. To send files between Windows, Android and Apple devices, you can use a browser based tool such as filefinch, which works in any modern browser.
  - q: How do I send files from iPhone to Android without installing an app?
    a: Open filefinch in Safari on the iPhone and in a browser on the Android phone. Tap Show pairing code on one, type the 6 words or scan the QR code on the other, then choose your files. There is nothing to install and no account.
  - q: Is filefinch made by Apple or Google?
    a: No. filefinch is an independent, free and open source project. It is not made by, affiliated with or endorsed by Apple, Google or Microsoft.
  - q: Does sending through the browser reduce photo or video quality?
    a: Not with filefinch. Files are sent byte for byte, so photos and videos arrive in their original quality with their metadata intact.
  - q: Do both devices need to be on the same Wi-Fi?
    a: No. They can connect across the internet. On the same Wi-Fi the traffic stays local and is often faster, and once the app is loaded, two devices on the same network can connect even without internet access by using an invite link.
related: [transfer-files-from-phone-to-pc-without-cable, transfer-files-on-the-same-wifi, is-webrtc-file-sharing-safe, send-video-in-original-quality]
---
If you have searched for AirDrop for Windows or AirDrop for Android, you have probably noticed that the answer is not a simple download. AirDrop is a feature Apple builds into its own devices, and it is designed to work between Apple products such as iPhone, iPad and Mac. There is no official AirDrop for Windows PCs or Android phones.

The good news is that what people actually want, a few taps to move a photo or a file to a device nearby, is possible across brands. This guide covers the built in options each platform offers, where they stop, and how a browser based approach with filefinch connects any mix of devices. filefinch is an independent open source project. It is not made by, affiliated with or endorsed by Apple or Google.

## Why AirDrop does not work on Windows or Android

AirDrop is part of Apple's operating systems and is available on Apple devices. That is a product decision by Apple, not a setting you can change on a Windows PC or an Android phone. Apps in other stores that use a similar name are not Apple's AirDrop, so read carefully before you install anything that claims to be.

So the useful question is not how to install AirDrop on Windows, but what the easiest way is to send files between your particular mix of devices. The answer depends on which devices are involved.

## Built in options on each platform

Every major platform ships some way to share with devices nearby. They are worth knowing, because when both devices support the same option, it can be very convenient.

| Devices | Built in option | Good to know |
|---|---|---|
| iPhone, iPad, Mac | AirDrop | Works between Apple devices |
| Android to Android | Quick Share (formerly Nearby Share) | Available on many Android phones |
| Android and Windows PC | Quick Share on Windows | Needs an app on the PC |
| Windows to Windows | Nearby sharing | Part of recent Windows versions |
| Many devices | Bluetooth | Pairing needed, slow for large files |
| Phone and computer | USB cable | Reliable, needs the right cable |

Feature names, supported devices and requirements change over time, so check each manufacturer's own help pages for current details.

The tricky part is the mixed case. An iPhone and an Android phone, or an iPhone and a Windows PC, often do not share a common built in method. People then tend to email files to themselves, use a messaging app or create a cloud storage link. Those approaches work, but they add an upload, and some messaging apps compress photos and videos along the way.

## The browser based approach

A web browser is the one app that every phone, tablet and computer already has. Modern browsers also support WebRTC, an open web standard that lets two browsers open a direct, encrypted connection to each other. filefinch uses it to move files from one device to another without any server in the middle storing them.

What that means in practice:

- It works in Chrome, Edge, Firefox and Safari on Windows, macOS, Linux, Android, iPhone and iPad.
- Any pair can connect: Android to iPhone, Windows to Mac, phone to PC.
- There is no account and no sign up. You can install it from the browser as an app if you like, and once loaded it works offline.
- Files are sent byte for byte, so photos and videos keep their original quality.
- Either device can send to the other over the same connection.

## How to send files between any two devices

1. Open [filefinch](app:) in the browser on both devices.
2. On the first device, tap **Show pairing code**. It shows 6 words and a QR code side by side.
3. On the second device, type the 6 words into the "Have a pairing code?" box, or scan the QR code with the camera. The QR code holds the same words, so either route works.
4. Once connected, the second device shows 6 new confirmation words. Type them on the first device. They prove the second screen is really yours, and no file moves until they match. Then choose your files and send.

Typing the words is easier than it sounds. They come from a list of 2048 simple English words, the first four letters of each are enough, a single typo gets fixed, and autocomplete suggests words as you go. A code works once and expires after 10 minutes.

So how do two phones from different brands find each other from 6 words? Both devices turn the words into a meeting point and a key. The 6-word handshake travels encrypted through public relays that cannot read it, run by third parties rather than by filefinch, and both devices leave the relays as soon as they are connected. After that, your files go device to device. There is no server of ours anywhere in the path.

### The Zero third parties option

If you prefer that no relay carries even the handshake, choose "Prefer zero third parties? Use a link or QR instead" and create an invite. The invite link, or its QR code, carries the whole handshake. Open it on the second device, then send the short reply code back through any messenger or show it to the first device's camera. Camera scanning uses the browser's barcode detection where it is available, and pasting the code by hand always works. Once connected, compare the 12 digit connection fingerprint on both screens.

> If both devices are on the same Wi-Fi, the transfer stays on your local network and is often much faster than going through the internet. Once the app has been loaded, two devices on the same network can even connect with no internet at all by using an invite link, since the 6 words need internet to reach the relays.

## Common combinations

### Android phone to Windows PC

Open filefinch in the PC browser, tap Show pairing code, and scan the QR code with the Android phone or type the 6 words on it. Then send photos, videos or documents from the phone. In desktop Chromium browsers such as Chrome and Edge, received files can be written straight into a folder you pick. The [phone to PC guide](guide:transfer-files-from-phone-to-pc-without-cable) walks through this route in more detail.

### iPhone to Android

Open filefinch in Safari on the iPhone and in Chrome or another browser on the Android phone. Either side can show the pairing code. This is the pairing where built in options usually do not overlap, so the browser makes a handy common ground.

### iPhone or Android to a Mac or Linux computer

The steps are the same. Large files and whole folders work too, and the folder tree is rebuilt on the receiving side.

### Two phones of the same brand

Built in options often work well here. filefinch can still help if you also want to send to a computer, move a whole folder, or keep a copy of received files in the app's local library to preview and save later.

## Privacy and safety

WebRTC always encrypts its data channels with DTLS, and the keys are generated in the two browsers for that one connection. filefinch has no accounts, no analytics and no tracking, and no server of ours stores your files. The public relays used for the 6 word pairing only carry the encrypted handshake, never your files. After a 6 word pairing, the confirmation words prove that the device that joined is yours, not someone who saw the code, and three wrong tries close the connection. In the invite link mode, the 12 digit fingerprint shown on both screens lets you confirm that nobody tampered with the handshake on the way. For extra protection, both people can type the same passphrase, which adds a second layer of AES-GCM encryption to every chunk.

If you use the invite link mode, keep in mind that the link contains the network addresses of the device that created it. Share it only with your own device or the person receiving the files. Read more in [is WebRTC file sharing safe](guide:is-webrtc-file-sharing-safe).

## When filefinch is not the right tool

- If both devices are Apple devices, AirDrop is already built in and is usually the quickest choice.
- If both devices support the same built in nearby sharing feature, using it can save a step.
- If the receiver is not online right now, a cloud upload or an email lets the file wait for them. filefinch needs both devices online at the same time with the app open.
- On phones, keep the screen on during long transfers, because mobile browsers may pause background tabs.
- If no public relay answers the 6 word pairing, switch to an invite link.
- Some strict networks block direct connections. filefinch tells you when that happens and lets you add your own TURN relay in Settings.

## Summary

AirDrop is an Apple feature for Apple devices. When your devices share a built in option, use it. When they do not, for example an Android phone and an iPhone or a Windows PC and an iPhone, open a browser on both, type 6 words, and connect them directly. Try it now in [the app](app:), or see which [devices are supported](home:#devices).

AirDrop is a trademark of Apple Inc. Other product names belong to their respective owners. filefinch is an independent project and is not affiliated with Apple, Google or Microsoft.

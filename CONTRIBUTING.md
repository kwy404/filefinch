# Contributing to filefinch

Thanks for helping Finn carry files. filefinch is a static web app with no backend, so most changes touch either the shared modules in `src/`, the app in `docs/app/`, or the website builder in `scripts/site/`.

## Setup

You need Node 18 or newer and a Chromium based browser (Chrome or Edge) for the browser tests.

```bash
git clone https://github.com/kwy404/filefinch.git
cd filefinch
npm ci
npm run build:app
npm run serve
```

Open the printed local address. WebRTC, the camera and the service worker need `localhost` or HTTPS.

## Where things live

- `src/` holds the shared modules: signaling (`invite.js`), the QR encoder, crypto, the wire protocol, chunking, hashing, paths and sync. They are copied into `docs/app/lib/` by `npm run build:app`. Edit `src/`, never the copies.
- `docs/app/` is the app itself: HTML, modules, the manifest and the service worker.
- `scripts/site/` builds everything else in `docs/`: the landing page (`home.mjs`), the page shell (`layout.mjs`), the guides (`guides/en/*.md` and `guides/pt/*.md`) and the art generators in `scripts/site/art/`.
- `assets/` holds the README art. It is generated; change the generators, then run `node scripts/site/build-art.mjs`.

## Checks

Run these before opening a pull request. CI runs the same steps.

```bash
npm run lint
npm run check:rules
npm run check:app
npm test
npm run test:e2e                     # two real browser contexts connect and transfer
node scripts/site/build-site.mjs     # rebuilds the site and fails on broken guide links, short guides or duplicates
node test/site-qa.mjs                # opens every page in a headless browser: console errors and broken links
```

## House rules

- No backend, no accounts, no analytics, no tracking. Everything runs in the browser.
- Security copy must stay true. Do not claim more than the code does.
- Plain ASCII punctuation: no en or em dash characters and no emoji in any file. Use escapes in test data if needed.
- Data from the other device is untrusted: validate its shape, sanitize paths, and set text with `textContent`.
- Keep the site responsive from 320 px to 2560 px, keyboard friendly, with visible focus, good contrast and reduced motion respected.

## Guides

Each guide is a Markdown file with front matter (title, description, steps, FAQ, related guides). English guides need at least 800 words. Link other guides with `guide:slug`, the app with `app:` and home sections with `home:#section`. The builder checks links, length, titles and descriptions.

## Commits and pull requests

Small, focused pull requests are easiest to review. Describe what changed and how you tested it, including the browsers you tried.

## Reporting security problems

Please do not open a public issue for a vulnerability. See [SECURITY.md](https://github.com/kwy404/filefinch/blob/main/SECURITY.md).

// filefinch service worker: keeps the app available offline and turns received data into
// streamed downloads, so a large file goes to disk as it arrives instead of filling memory.

// precache:start
const CACHE_VERSION = '3b13d2e58454';
const PRECACHE = [
  './',
  '../assets/seasons/carnival/finn-dark.svg',
  '../assets/seasons/carnival/finn.svg',
  '../assets/seasons/christmas/finn-dark.svg',
  '../assets/seasons/christmas/finn.svg',
  '../assets/seasons/easter/finn-dark.svg',
  '../assets/seasons/easter/finn.svg',
  '../assets/seasons/halloween/finn-dark.svg',
  '../assets/seasons/halloween/finn.svg',
  '../assets/seasons/junina/finn-dark.svg',
  '../assets/seasons/junina/finn.svg',
  '../assets/seasons/newyear/finn-dark.svg',
  '../assets/seasons/newyear/finn.svg',
  '../assets/seasons/valentine/finn-dark.svg',
  '../assets/seasons/valentine/finn.svg',
  '../assets/site/seasons.js',
  'app.css',
  'clips-ui.js',
  'connection.js',
  'db.js',
  'files.js',
  'history.js',
  'i18n.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon.svg',
  'icons/maskable-512.png',
  'icons/maskable.svg',
  'index.html',
  'lib/bytes.js',
  'lib/chunker.js',
  'lib/clip.js',
  'lib/crypto.js',
  'lib/format.js',
  'lib/ice.js',
  'lib/invite.js',
  'lib/known.js',
  'lib/mqtt.js',
  'lib/paths.js',
  'lib/protocol.js',
  'lib/qr.js',
  'lib/relay.js',
  'lib/rendezvous.js',
  'lib/sha256.js',
  'lib/sync.js',
  'lib/transfer.js',
  'lib/version.js',
  'lib/wordlist.js',
  'lib/words.js',
  'lib/zip.js',
  'library.js',
  'main.js',
  'manifest.webmanifest',
  'motion.js',
  'pairing.js',
  'panels.js',
  'preview.js',
  'scan.js',
  'season.js',
  'settings.js',
  'sinks.js',
  'sync-ui.js',
  'theme.js',
  'transfers-ui.js',
  'ui.js',
  'word-inputs.js'
];
// precache:end

const CACHE = `filefinch-${CACHE_VERSION}`;
const EXTERNAL = ['https://cdn.jsdelivr.net/npm/monsooncss@0.2.0/dist/monsoon.min.css'];
const downloads = new Map();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.all([cache.addAll(PRECACHE), ...EXTERNAL.map((u) => cache.add(new Request(u, { mode: 'cors' })).catch(() => {}))]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('filefinch-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'ff-download' && event.ports[0]) createDownload(msg, event.ports[0]);
  // ff-ping only exists to keep this worker awake while a download is streaming.
});

function createDownload({ id, name, size }, port) {
  let controller;
  let pending = null;
  let enqueued = 0;
  // Flow control: every pull tells the page how many chunks were enqueued so far and how many
  // more fit in the queue, so the page keeps the queue full without ever overfilling it.
  const stream = new ReadableStream(
    {
      start(c) {
        controller = c;
      },
      pull() {
        port.postMessage({ type: 'pull', enqueued, desired: controller.desiredSize });
        return new Promise((resolve) => (pending = resolve));
      },
      cancel() {
        port.postMessage({ type: 'cancel' });
        downloads.delete(id);
      },
    },
    new CountQueuingStrategy({ highWaterMark: 64 }),
  );
  port.onmessage = ({ data }) => {
    if (data.type === 'chunk') {
      controller.enqueue(new Uint8Array(data.buffer));
      enqueued++;
      pending?.();
      pending = null;
    } else if (data.type === 'end') {
      controller.close();
      downloads.delete(id);
    } else if (data.type === 'abort') {
      controller.error(new Error('canceled'));
      downloads.delete(id);
    }
  };
  downloads.set(id, { stream, name: String(name || 'download'), size: Number.isSafeInteger(size) ? size : null });
  setTimeout(() => {
    // A download nobody opened within a minute is dropped.
    const d = downloads.get(id);
    if (d && !d.used) downloads.delete(id);
  }, 60000);
  port.postMessage({ type: 'ready' });
}

function disposition(name) {
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const m = /\/dl\/([A-Za-z0-9_-]+)\//.exec(url.pathname);
  if (m && url.origin === self.location.origin) {
    const d = downloads.get(m[1]);
    if (!d) {
      event.respondWith(new Response('This download has expired.', { status: 404 }));
      return;
    }
    d.used = true;
    const headers = {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': disposition(d.name),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    };
    if (d.size !== null) headers['Content-Length'] = String(d.size);
    event.respondWith(new Response(d.stream, { headers }));
    return;
  }
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) {
    if (EXTERNAL.includes(url.href)) event.respondWith(caches.match(url.href).then((hit) => hit || fetch(event.request)));
    return;
  }
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(event.request).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy));
          }
          return res;
        }),
    ),
  );
});

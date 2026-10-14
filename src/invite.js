// Serverless signaling. The host's complete offer (ICE gathering finished, no trickle) is reduced
// to the few fields a data channel needs, compressed with deflate-raw and written as base64url
// into an invite link (#i=...). The guest answers with a reply code (#r=...) the same way.
// Anything that does not fit the compact form travels as the full SDP, still compressed.

import { fromBase64Url, fromUtf8, toBase64Url, utf8 } from './bytes.js';
import { PROTOCOL_VERSION } from './version.js';

const SETUP = ['actpass', 'active', 'passive'];

/** Reduces a data channel SDP to its essentials, or returns { raw } when it has anything else. */
export function packSdp(sdp) {
  const lines = String(sdp).split(/\r?\n/).filter(Boolean);
  const media = lines.filter((l) => l.startsWith('m='));
  const get = (prefix) => {
    const line = lines.find((l) => l.startsWith(prefix));
    return line ? line.slice(prefix.length) : null;
  };
  const fp = /^sha-256 ([0-9A-Fa-f:]{95})$/.exec(get('a=fingerprint:') || '');
  const setup = SETUP.indexOf(get('a=setup:'));
  const compactable =
    media.length === 1 &&
    /^m=application \d+ UDP\/DTLS\/SCTP webrtc-datachannel$/.test(media[0]) &&
    fp &&
    setup >= 0 &&
    get('a=ice-ufrag:') &&
    get('a=ice-pwd:') &&
    get('a=sctp-port:');
  if (!compactable) return { raw: sdp };
  const candidates = lines.filter((l) => l.startsWith('a=candidate:')).map((l) => shortCandidate(l.slice('a=candidate:'.length)));
  if (candidates.some((c) => c === null)) return { raw: sdp };
  const out = {
    u: get('a=ice-ufrag:'),
    p: get('a=ice-pwd:'),
    f: toBase64Url(Uint8Array.from(fp[1].split(':').map((h) => parseInt(h, 16)))),
    s: setup,
    m: get('a=mid:') ?? '0',
    c: [...new Set(candidates)],
  };
  const port = Number(get('a=sctp-port:'));
  if (port !== 5000) out.o = port;
  const max = get('a=max-message-size:');
  if (max && Number(max) !== 262144) out.x = Number(max);
  return out;
}

/** Drops optional candidate extensions (generation, ufrag, network-id, network-cost). */
export function trimCandidate(text) {
  const parts = text.trim().split(/\s+/);
  const keep = parts.slice(0, 8); // foundation component protocol priority address port typ type
  for (let i = 8; i + 1 < parts.length; i += 2) {
    if (parts[i] === 'raddr' || parts[i] === 'rport' || parts[i] === 'tcptype') keep.push(parts[i], parts[i + 1]);
  }
  return keep.join(' ');
}

const TYPES = { host: 'h', srflx: 's', prflx: 'p', relay: 'r' };
const TYPE_NAMES = { h: 'host', s: 'srflx', p: 'prflx', r: 'relay' };
const TYPE_PREF = { host: 126, prflx: 110, srflx: 100, relay: 2 };

/**
 * Shortens a candidate to "<u|t><h|s|p|r> address port [raddr rport] [tcptype]". Foundation and
 * priority are rebuilt on the other side from the type and the order, which keeps the same
 * preference between candidates while saving about 20 characters each.
 */
export function shortCandidate(text) {
  const p = trimCandidate(text).split(' ');
  if (p.length < 8 || p[1] !== '1' || p[6] !== 'typ' || !TYPES[p[7]]) return null;
  const proto = p[2].toLowerCase();
  if (proto !== 'udp' && proto !== 'tcp') return null;
  const out = [`${proto[0]}${TYPES[p[7]]}`, p[4], p[5]];
  const extra = {};
  for (let i = 8; i + 1 < p.length; i += 2) extra[p[i]] = p[i + 1];
  if (extra.raddr && extra.raddr !== '0.0.0.0' && extra.raddr !== '::') out.push(extra.raddr, extra.rport ?? '0');
  if (extra.tcptype) out.push(`~${extra.tcptype}`);
  return out.join(' ');
}

export function expandCandidate(short, index) {
  const [head, address, port, ...rest] = short.split(' ');
  const proto = head[0] === 't' ? 'tcp' : 'udp';
  const type = TYPE_NAMES[head[1]];
  if (!type || !address || !/^\d+$/.test(port)) throw new Error('Bad candidate');
  const typePref = Math.max(0, TYPE_PREF[type] - (proto === 'tcp' ? 36 : 0));
  const priority = typePref * 2 ** 24 + (65535 - Math.min(index, 65535)) * 256 + 255;
  let line = `${index + 1} 1 ${proto} ${priority} ${address} ${port} typ ${type}`;
  const tcptype = rest.find((r) => r.startsWith('~'));
  const raddr = rest.filter((r) => !r.startsWith('~'));
  if (raddr.length === 2) line += ` raddr ${raddr[0]} rport ${raddr[1]}`;
  else if (type !== 'host') line += ' raddr 0.0.0.0 rport 0';
  if (tcptype) line += ` tcptype ${tcptype.slice(1)}`;
  return line;
}

/** Rebuilds a valid SDP from packSdp output. */
export function unpackSdp(packed) {
  if (typeof packed.raw === 'string') return packed.raw;
  const hex = Array.from(fromBase64Url(packed.f), (b) => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
  const mid = packed.m ?? '0';
  const sessionId = Array.from(fromBase64Url(packed.f).subarray(0, 6)).reduce((n, b) => n * 256 + b, 0) + 1;
  const lines = [
    'v=0',
    `o=- ${sessionId} 2 IN IP4 127.0.0.1`,
    's=-',
    't=0 0',
    `a=group:BUNDLE ${mid}`,
    'a=msid-semantic: WMS',
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
    'c=IN IP4 0.0.0.0',
    ...packed.c.map((c, i) => `a=candidate:${expandCandidate(c, i)}`),
    'a=end-of-candidates',
    `a=ice-ufrag:${packed.u}`,
    `a=ice-pwd:${packed.p}`,
    `a=fingerprint:sha-256 ${hex}`,
    `a=setup:${SETUP[packed.s] ?? 'actpass'}`,
    `a=mid:${mid}`,
    `a=sctp-port:${packed.o ?? 5000}`,
    `a=max-message-size:${packed.x ?? 262144}`,
  ];
  return lines.join('\r\n') + '\r\n';
}

async function pipeThrough(bytes, stream) {
  const blob = new Blob([bytes]);
  const out = await new Response(blob.stream().pipeThrough(stream)).arrayBuffer();
  return new Uint8Array(out);
}

export const deflate = (bytes) => pipeThrough(bytes, new CompressionStream('deflate-raw'));
export const inflate = (bytes) => pipeThrough(bytes, new DecompressionStream('deflate-raw'));

/**
 * Encodes an invite ('i') or a reply ('r').
 * fields: { sdp, name, sid, lock (passphrase needed), salt (base64url) }
 */
export async function encodeSignal(kind, fields) {
  if (kind !== 'i' && kind !== 'r') throw new Error('Unknown signal kind');
  const body = { v: PROTOCOL_VERSION, k: kind, d: packSdp(fields.sdp), n: String(fields.name ?? '').slice(0, 40), s: fields.sid };
  if (fields.lock) body.l = 1;
  if (fields.salt) body.t = fields.salt;
  if (fields.iterations) body.r = fields.iterations;
  return toBase64Url(await deflate(utf8(JSON.stringify(body))));
}

/** Decodes a code made by encodeSignal. Throws a readable error for anything else. */
export async function decodeSignal(code, expectKind) {
  let body;
  try {
    body = JSON.parse(fromUtf8(await inflate(fromBase64Url(code))));
  } catch {
    throw new SignalError('damaged', 'This code is incomplete or damaged. Copy the whole link or code again.');
  }
  if (!body || typeof body !== 'object' || !body.d || (body.k !== 'i' && body.k !== 'r')) {
    throw new SignalError('damaged', 'This code is incomplete or damaged. Copy the whole link or code again.');
  }
  if (body.v !== PROTOCOL_VERSION) {
    throw new SignalError('version', 'This code comes from a different version of filefinch. Reload both pages and try again.');
  }
  if (expectKind && body.k !== expectKind) {
    throw new SignalError(
      'kind',
      expectKind === 'r'
        ? 'This is an invite, not a reply. Open it on the other device instead.'
        : 'This is a reply code. Paste it on the device that created the invite.',
    );
  }
  let sdp;
  try {
    sdp = unpackSdp(body.d);
  } catch {
    throw new SignalError('damaged', 'This code is incomplete or damaged. Copy the whole link or code again.');
  }
  return {
    kind: body.k,
    sdp,
    name: typeof body.n === 'string' ? body.n.slice(0, 40) : '',
    sid: typeof body.s === 'string' ? body.s.slice(0, 32) : '',
    lock: body.l === 1,
    salt: typeof body.t === 'string' ? body.t : null,
    iterations: Number.isInteger(body.r) ? body.r : null,
  };
}

export class SignalError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * Finds an invite or reply in anything a person might paste: a full link, a link with text
 * around it, or the bare code. Returns { kind, code } or null.
 */
export function findSignal(text) {
  const s = String(text ?? '').trim();
  const m = /[#&?]([ir])=([A-Za-z0-9_\-+/=]+)/.exec(s);
  if (m) return { kind: m[1], code: m[2] };
  const bare = s.replace(/\s+/g, '');
  if (/^[A-Za-z0-9_-]{24,}$/.test(bare)) return { kind: null, code: bare };
  return null;
}

/** Builds the shareable link for a code relative to the app URL. */
export function signalLink(appUrl, kind, code) {
  const base = String(appUrl).split('#')[0];
  return `${base}#${kind}=${code}`;
}

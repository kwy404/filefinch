// One WebRTC connection to your other device, set up with an invite and a reply code instead of a
// signaling server. Also: gathering with a timeout, plain language failure analysis, route and
// round trip stats, and a link adapter for the transfer engine.

import { Emitter } from './lib/transfer.js';
import { connectionFingerprint } from './lib/crypto.js';
import { decodeSignal, encodeSignal } from './lib/invite.js';
import { randomId } from './lib/bytes.js';
import { diagnose } from './lib/ice.js';

const GATHER_TIMEOUT_MS = 7000;
const CONNECT_TIMEOUT_MS = 30000;
const DISCONNECT_GRACE_MS = 10000;
const LOW_WATER = 1024 * 1024;

export function waitForGathering(pc, timeout = GATHER_TIMEOUT_MS) {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') return resolve(true);
    const timer = setTimeout(() => finish(false), timeout);
    const check = () => pc.iceGatheringState === 'complete' && finish(true);
    function finish(complete) {
      clearTimeout(timer);
      pc.removeEventListener('icegatheringstatechange', check);
      resolve(complete);
    }
    pc.addEventListener('icegatheringstatechange', check);
  });
}

export class Connection extends Emitter {
  constructor({ config, name }) {
    super();
    this.config = config;
    this.name = name;
    this.state = 'idle';
    this.role = null;
    this.sid = null;
    this.pc = null;
    this.dc = null;
    this.peerName = '';
    this.fingerprint = null;
    this.route = null;
    this.timers = [];
  }

  setState(state, detail) {
    this.state = state;
    this.emit('state', { state, detail });
  }

  createPeer() {
    const pc = new RTCPeerConnection(this.config);
    this.pc = pc;
    pc.addEventListener('connectionstatechange', () => this.onPcState());
    return pc;
  }

  /** Host side: creates the offer and waits for ICE gathering. Returns the full SDP. */
  async prepareOffer() {
    this.role = 'host';
    this.sid ??= randomId(9);
    this.setState('gathering');
    const pc = this.createPeer();
    this.attachChannel(pc.createDataChannel('filefinch', { ordered: true }));
    await pc.setLocalDescription(await pc.createOffer());
    await waitForGathering(pc);
    if (this.state === 'closed') throw new Error('closed');
    this.setState('waiting-reply');
    return pc.localDescription.sdp;
  }

  /** Host side, link mode: returns the invite code. extra: { lock, salt, iterations } for a passphrase. */
  async host(extra = {}) {
    const sdp = await this.prepareOffer();
    return encodeSignal('i', { sdp, name: this.name, sid: this.sid, ...extra });
  }

  /** Guest side: answers an offer { sdp, sid, name } and returns the answer SDP. */
  async answerOffer(invite) {
    this.role = 'guest';
    this.sid = invite.sid;
    this.peerName = invite.name;
    this.setState('gathering');
    const pc = this.createPeer();
    pc.addEventListener('datachannel', (e) => this.attachChannel(e.channel));
    try {
      await pc.setRemoteDescription({ type: 'offer', sdp: invite.sdp });
    } catch (err) {
      throw new Error(`This invite could not be read by this browser (${err.name}).`);
    }
    await pc.setLocalDescription(await pc.createAnswer());
    await waitForGathering(pc);
    if (this.state === 'closed') throw new Error('closed');
    this.setState('connecting');
    this.startConnectTimer();
    return pc.localDescription.sdp;
  }

  /** Guest side, link mode: takes a decoded invite, returns the reply code. */
  async join(invite) {
    const sdp = await this.answerOffer(invite);
    return encodeSignal('r', { sdp, name: this.name, sid: this.sid });
  }

  /** Host side, link mode: applies the reply code from the other device. */
  async applyReply(code) {
    return this.applyAnswer(await decodeSignal(code, 'r'));
  }

  /** Host side: applies an answer { sdp, name, sid }. */
  async applyAnswer(reply) {
    if (reply.sid && reply.sid !== this.sid) {
      const err = new Error('This reply belongs to a different invite. Make sure the other device opened the newest invite.');
      err.code = 'sid';
      throw err;
    }
    if (this.pc?.signalingState !== 'have-local-offer') throw new Error('This invite was already used. Create a new one.');
    this.peerName = reply.name;
    this.setState('connecting');
    await this.pc.setRemoteDescription({ type: 'answer', sdp: reply.sdp });
    this.startConnectTimer();
  }

  startConnectTimer() {
    this.timers.push(
      setTimeout(() => {
        if (this.state === 'connecting') this.fail();
      }, CONNECT_TIMEOUT_MS),
    );
  }

  attachChannel(dc) {
    this.dc = dc;
    dc.binaryType = 'arraybuffer';
    dc.bufferedAmountLowThreshold = LOW_WATER;
    dc.addEventListener('open', () => {
      this.fingerprint = connectionFingerprint(this.pc.localDescription?.sdp, this.pc.remoteDescription?.sdp);
      this.setState('open');
      this.pollStats();
    });
    dc.addEventListener('message', (e) => {
      if (typeof e.data === 'string') this.emit('text', e.data);
      else this.emit('binary', new Uint8Array(e.data));
    });
    dc.addEventListener('close', () => this.lost());
    dc.addEventListener('error', (e) => {
      const msg = e?.error?.message || '';
      if (this.state === 'open') this.emit('channel-error', msg);
    });
  }

  onPcState() {
    const s = this.pc?.connectionState;
    if (s === 'failed') {
      if (this.state === 'open') this.lost();
      else this.fail();
    } else if (s === 'disconnected' && this.state === 'open') {
      this.emit('unstable', true);
      this.timers.push(
        setTimeout(() => {
          if (this.pc?.connectionState === 'disconnected') this.lost();
        }, DISCONNECT_GRACE_MS),
      );
    } else if (s === 'connected' && this.state === 'open') {
      this.emit('unstable', false);
    }
  }

  fail() {
    if (this.state === 'failed' || this.state === 'closed') return;
    const reason = diagnose(this.pc?.localDescription?.sdp, this.pc?.remoteDescription?.sdp, this.config);
    this.cleanup();
    this.setState('failed', reason);
  }

  lost() {
    if (this.state !== 'open') return;
    this.cleanup();
    this.setState('lost');
  }

  close() {
    if (this.state === 'closed') return;
    try {
      if (this.dc?.readyState === 'open') this.dc.send(JSON.stringify({ t: 'bye' }));
    } catch {}
    this.cleanup();
    this.setState('closed');
  }

  cleanup() {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    clearInterval(this.statsTimer);
    const dc = this.dc;
    const pc = this.pc;
    this.dc = null;
    this.pc = null;
    try {
      dc?.close();
    } catch {}
    try {
      pc?.close();
    } catch {}
  }

  /** The adapter the transfer engine sends through. */
  link() {
    const dc = this.dc;
    // After the channel closes, sends are dropped quietly: the close event follows and the
    // engine marks transfers as interrupted, so nothing is mistaken for a failed file.
    const send = (data) => {
      if (dc.readyState === 'open') dc.send(data);
    };
    return {
      sendText: send,
      sendBinary: send,
      bufferedAmount: () => (dc.readyState === 'open' ? dc.bufferedAmount : 0),
      drained: () =>
        new Promise((resolve) => {
          if (dc.readyState !== 'open' || dc.bufferedAmount <= dc.bufferedAmountLowThreshold) return resolve();
          const done = () => {
            dc.removeEventListener('bufferedamountlow', done);
            dc.removeEventListener('close', done);
            resolve();
          };
          dc.addEventListener('bufferedamountlow', done);
          dc.addEventListener('close', done);
        }),
    };
  }

  pollStats() {
    const run = async () => {
      if (!this.pc) return;
      try {
        const stats = await this.pc.getStats();
        let pair = null;
        const byId = new Map();
        stats.forEach((r) => byId.set(r.id, r));
        stats.forEach((r) => {
          if (r.type === 'transport' && r.selectedCandidatePairId) pair = byId.get(r.selectedCandidatePairId);
        });
        if (!pair) stats.forEach((r) => r.type === 'candidate-pair' && r.nominated && r.state === 'succeeded' && (pair = r));
        if (!pair) return;
        const local = byId.get(pair.localCandidateId);
        const remote = byId.get(pair.remoteCandidateId);
        const types = [local?.candidateType, remote?.candidateType];
        const kind = types.includes('relay') ? 'relay' : types.every((t) => t === 'host') ? 'local' : 'internet';
        this.route = {
          kind,
          protocol: local?.protocol,
          rtt: pair.currentRoundTripTime,
          sent: pair.bytesSent,
          received: pair.bytesReceived,
        };
        this.emit('stats', this.route);
      } catch {}
    };
    run();
    this.statsTimer = setInterval(run, 2000);
  }
}

/**
 * Asks one TURN server for a relay address. Resolves { ok, ms, error }.
 * A relay candidate proves the server answered and accepted the username and credential.
 */
export async function testTurn(server, timeout = 9000) {
  const started = performance.now();
  const pc = new RTCPeerConnection({ iceServers: [server], iceTransportPolicy: 'relay' });
  const errors = [];
  let ok = false;
  pc.addEventListener('icecandidateerror', (e) => errors.push(`${e.errorCode} ${e.errorText || ''}`.trim()));
  const found = new Promise((resolve) => {
    pc.addEventListener('icecandidate', (e) => {
      if (e.candidate && / typ relay /.test(e.candidate.candidate)) {
        ok = true;
        resolve();
      }
    });
  });
  pc.createDataChannel('probe');
  await pc.setLocalDescription(await pc.createOffer());
  await Promise.race([found, waitForGathering(pc, timeout)]);
  pc.close();
  return { ok, ms: Math.round(performance.now() - started), error: ok ? null : errors[0] || null };
}

/**
 * Reply links opened in another tab on the host device are handed to the waiting tab with a
 * BroadcastChannel, so the person never has to copy the code by hand.
 */
export const signalChannel = () => ('BroadcastChannel' in globalThis ? new BroadcastChannel('filefinch-signal') : null);

// The six word handshake. Both devices derive a topic and a key from the words, meet on public
// MQTT brokers (several at once) and swap the WebRTC offer and answer, sealed with that key.
//   creator: shows the words, waits for a "join", sends its offer to the first device that joins
//   joiner:  knocks with "join" until the offer arrives, then sends its answer
// The code expires after 10 minutes, works once, and both sides leave the brokers as soon as
// the connection opens.

import { Emitter } from './lib/transfer.js';
import { randomId } from './lib/bytes.js';
import { generateWords } from './lib/words.js';
import { RelayHub } from './lib/relay.js';
import { ReplayGuard, deriveRendezvous, openMessage, sealMessage } from './lib/rendezvous.js';

export const CODE_LIFETIME_MS = 10 * 60 * 1000;
const KNOCK_EVERY_MS = 1500;
const JOIN_TIMEOUT_MS = 45000;
const ANSWER_REPEATS = 12;

class Side extends Emitter {
  constructor() {
    super();
    this.id = randomId(9);
    this.guard = new ReplayGuard();
    this.hub = null;
    this.timers = [];
    this.stopped = false;
  }

  async open(words) {
    this.words = words;
    this.rv = await deriveRendezvous(words);
    if (this.stopped) throw new Error('stopped');
    this.hub = new RelayHub(this.rv.topic);
    this.hub.on('status', (s) => this.emit('status', s));
    this.hub.on('message', ({ payload }) => this.receive(payload));
    await this.hub.start();
    if (this.stopped) throw new Error('stopped');
    this.emit('status', this.hub.status());
  }

  async receive(payload) {
    let msg;
    try {
      msg = await openMessage(this.rv, payload);
    } catch {
      return; // not for us, or not readable: relays and strangers can only send noise
    }
    if (this.stopped || msg.f === this.id || !this.guard.accept(msg)) return;
    this.handle(msg);
  }

  async publish(body) {
    if (this.stopped || !this.hub) return 0;
    return this.hub.publish(await sealMessage(this.rv, { ...body, f: this.id }));
  }

  every(ms, fn) {
    const t = setInterval(fn, ms);
    this.timers.push(() => clearInterval(t));
    fn();
  }

  after(ms, fn) {
    const t = setTimeout(fn, ms);
    this.timers.push(() => clearTimeout(t));
  }

  /** Leaves every broker and stops all timers. */
  stop() {
    this.stopped = true;
    for (const off of this.timers) off();
    this.timers = [];
    this.hub?.close();
  }
}

/** The device that shows the code. offerReady resolves with the offer fields to send. */
export class CodeCreator extends Side {
  constructor(offerReady) {
    super();
    this.offerReady = offerReady;
    this.guest = null;
    this.answered = false;
  }

  async start() {
    const words = generateWords();
    this.expires = Date.now() + CODE_LIFETIME_MS;
    this.after(CODE_LIFETIME_MS, () => {
      this.stop();
      this.emit('expired');
    });
    await this.open(words);
    return words;
  }

  async handle(msg) {
    if (msg.k === 'join') {
      // Single use: the first device that joins gets the offer, everyone else is ignored.
      this.guest ??= msg.f;
      if (msg.f !== this.guest || this.answered) return;
      const offer = await this.offerReady;
      await this.publish({ k: 'offer', to: this.guest, ...offer });
    } else if (msg.k === 'answer' && msg.f === this.guest && msg.to === this.id && !this.answered) {
      this.answered = true;
      this.emit('answer', msg);
    }
  }
}

/** The device that typed or scanned the code. */
export class CodeJoiner extends Side {
  async start(words) {
    await this.open(words);
    this.after(JOIN_TIMEOUT_MS, () => {
      if (!this.host) this.emit('timeout');
    });
    this.every(KNOCK_EVERY_MS, () => !this.host && this.publish({ k: 'join' }));
  }

  handle(msg) {
    if (msg.k !== 'offer' || msg.to !== this.id || this.host) return;
    this.host = msg.f;
    this.emit('offer', msg);
  }

  /** Sends the answer a few times, since the relays deliver at most once and may drop it. */
  sendAnswer(answer) {
    let n = 0;
    this.every(KNOCK_EVERY_MS, () => n++ < ANSWER_REPEATS && this.publish({ k: 'answer', to: this.host, ...answer }));
  }
}

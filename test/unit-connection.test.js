import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { chromeAnswer, chromeOffer } from './unit-sdp-fixtures.js';

/** Just enough of RTCPeerConnection to follow the signaling states, with a slow setRemoteDescription. */
class FakePeer extends EventTarget {
  constructor() {
    super();
    this.signalingState = 'stable';
    this.iceGatheringState = 'complete';
    this.applied = 0;
  }
  createDataChannel() {
    const dc = new EventTarget();
    dc.readyState = 'connecting';
    return dc;
  }
  async createOffer() {
    return { type: 'offer', sdp: chromeOffer };
  }
  async setLocalDescription(desc) {
    this.localDescription = desc;
    this.signalingState = 'have-local-offer';
  }
  async setRemoteDescription(desc) {
    await new Promise((r) => setTimeout(r, 20));
    if (this.signalingState !== 'have-local-offer') throw new DOMException('Called in wrong state: stable', 'InvalidStateError');
    this.remoteDescription = desc;
    this.signalingState = 'stable';
    this.applied++;
  }
  close() {}
}

let Connection;
beforeEach(async () => {
  globalThis.RTCPeerConnection = FakePeer;
  ({ Connection } = await import('../docs/app/connection.js'));
});
afterEach(() => {
  delete globalThis.RTCPeerConnection;
});

async function hostReady() {
  const c = new Connection({ config: { iceServers: [] }, name: 'PC' });
  await c.prepareOffer();
  return c;
}

describe('applying an answer', () => {
  it('ignores the same answer arriving twice at once (tab handoff plus a paste, or a double click)', async () => {
    const c = await hostReady();
    const reply = { sdp: chromeAnswer, name: 'Phone', sid: c.sid };
    const results = await Promise.all([c.applyAnswer(reply), c.applyAnswer(reply), c.applyAnswer(reply)]);
    expect(results.sort()).toEqual(['applied', 'duplicate', 'duplicate']);
    expect(c.pc.applied).toBe(1);
    expect(c.state).toBe('connecting');
    // And again later, once the connection is already stable.
    expect(await c.applyAnswer(reply)).toBe('duplicate');
    c.close();
  });

  it('refuses a different answer for an invite that is already connecting', async () => {
    const c = await hostReady();
    await c.applyAnswer({ sdp: chromeAnswer, name: 'Phone', sid: c.sid });
    await expect(c.applyAnswer({ sdp: `${chromeAnswer}a=x\r\n`, name: 'Other', sid: c.sid })).rejects.toMatchObject({ code: 'used' });
    expect(c.pc.applied).toBe(1);
    c.close();
  });

  it('refuses a reply for another invite', async () => {
    const c = await hostReady();
    await expect(c.applyAnswer({ sdp: chromeAnswer, name: 'Phone', sid: 'other' })).rejects.toMatchObject({ code: 'sid' });
    c.close();
  });

  it('lets a corrected answer through after the browser rejected the first one', async () => {
    const c = await hostReady();
    const real = c.pc.setRemoteDescription.bind(c.pc);
    let first = true;
    c.pc.setRemoteDescription = async (d) => {
      if (first) {
        first = false;
        throw new DOMException('Bad answer', 'OperationError');
      }
      return real(d);
    };
    await expect(c.applyAnswer({ sdp: 'broken', name: 'Phone', sid: c.sid })).rejects.toThrow('Bad answer');
    expect(await c.applyAnswer({ sdp: chromeAnswer, name: 'Phone', sid: c.sid })).toBe('applied');
    c.close();
  });
});

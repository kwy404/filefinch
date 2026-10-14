import { describe, expect, it } from 'vitest';
import { candidateTypes, diagnose } from '../src/ice.js';
import { chromeAnswer, chromeOffer } from './unit-sdp-fixtures.js';

const hostOnly = chromeOffer
  .split('\r\n')
  .filter((l) => !/typ (srflx|relay)/.test(l))
  .join('\r\n');
const noRelay = chromeOffer
  .split('\r\n')
  .filter((l) => !/typ relay/.test(l))
  .join('\r\n');
const stun = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }], iceTransportPolicy: 'all' };
const turn = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }, { urls: ['turn:turn.example.com:3478'], username: 'u', credential: 'c' }], iceTransportPolicy: 'all' };

describe('ICE failure diagnosis', () => {
  it('counts candidate types', () => {
    expect(candidateTypes(chromeOffer)).toEqual({ host: 2, srflx: 1, relay: 1, prflx: 0 });
    expect(candidateTypes(chromeAnswer)).toEqual({ host: 1, srflx: 1, relay: 0, prflx: 0 });
    expect(candidateTypes('')).toEqual({ host: 0, srflx: 0, relay: 0, prflx: 0 });
  });

  it('explains each failure in a way the person can act on', () => {
    expect(diagnose(noRelay, chromeAnswer, stun)).toBe('strict-nat');
    expect(diagnose(hostOnly, chromeAnswer, stun)).toBe('stun-blocked');
    expect(diagnose(noRelay, hostOnly, stun)).toBe('peer-stun-blocked');
    expect(diagnose(noRelay, chromeAnswer, turn)).toBe('turn-unreachable');
    expect(diagnose(hostOnly, chromeAnswer, { ...turn, iceTransportPolicy: 'relay' })).toBe('relay-unreachable');
    expect(diagnose(chromeOffer, chromeAnswer, turn)).toBe('relay-failed');
  });
});

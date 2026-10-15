// Date logic of the special date themes in docs/assets/site/seasons.js:
// Easter, every window boundary, the pt-BR variants and the overrides.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

let S;
beforeAll(async () => {
  await import('../docs/assets/site/seasons.js');
  S = globalThis.FFSeasons;
});
afterEach(() => vi.unstubAllGlobals());

const d = (y, m, day) => new Date(y, m - 1, day, 12);
const iso = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

describe('seasons', () => {
  it('computes Easter Sunday for 2024 to 2030', () => {
    const known = { 2024: '2024-03-31', 2025: '2025-04-20', 2026: '2026-04-05', 2027: '2027-03-28', 2028: '2028-04-16', 2029: '2029-04-01', 2030: '2030-04-21' };
    for (const [y, want] of Object.entries(known)) expect(iso(S.easter(Number(y)))).toBe(want);
  });

  it('opens and closes every fixed window on the right day', () => {
    const cases = [
      [d(2026, 12, 29), null], [d(2026, 12, 30), 'newyear'], [d(2026, 12, 31), 'newyear'], [d(2027, 1, 2), 'newyear'], [d(2027, 1, 3), null],
      [d(2026, 12, 17), null], [d(2026, 12, 18), 'christmas'], [d(2026, 12, 26), 'christmas'], [d(2026, 12, 27), null],
      [d(2026, 10, 23), null], [d(2026, 10, 24), 'halloween'], [d(2026, 10, 31), 'halloween'], [d(2026, 11, 1), null],
      [d(2026, 6, 12), null], [d(2026, 6, 13), 'junina'], [d(2026, 6, 29), 'junina'], [d(2026, 6, 30), null],
      [d(2027, 2, 13), null], [d(2027, 2, 14), 'valentine'], [d(2027, 2, 15), null],
    ];
    for (const [date, want] of cases) expect(S.seasonFor(date, 'en-US'), iso(date)).toBe(want);
  });

  it('runs Carnival from the Saturday before Ash Wednesday through Ash Wednesday', () => {
    // 2025: Easter April 20, Ash Wednesday March 5, Carnival Saturday March 1.
    expect(S.seasonFor(d(2025, 2, 28), 'en')).toBe(null);
    expect(S.seasonFor(d(2025, 3, 1), 'en')).toBe('carnival');
    expect(S.seasonFor(d(2025, 3, 4), 'en')).toBe('carnival');
    expect(S.seasonFor(d(2025, 3, 5), 'en')).toBe('carnival');
    expect(S.seasonFor(d(2025, 3, 6), 'en')).toBe(null);
    // 2027: Easter March 28, Ash Wednesday February 10.
    expect(S.seasonFor(d(2027, 2, 6), 'en')).toBe('carnival');
    expect(S.seasonFor(d(2027, 2, 10), 'en')).toBe('carnival');
    expect(S.seasonFor(d(2027, 2, 11), 'en')).toBe(null);
  });

  it('runs Easter from Good Friday to Easter Sunday', () => {
    expect(S.seasonFor(d(2026, 4, 2), 'en')).toBe(null);
    expect(S.seasonFor(d(2026, 4, 3), 'en')).toBe('easter');
    expect(S.seasonFor(d(2026, 4, 5), 'en')).toBe('easter');
    expect(S.seasonFor(d(2026, 4, 6), 'en')).toBe(null);
  });

  it('adds the Brazilian Valentine on June 12 and prefers Carnival on February 14 for pt-BR', () => {
    expect(S.seasonFor(d(2026, 6, 12), 'pt-BR')).toBe('valentine');
    expect(S.seasonFor(d(2026, 6, 12), 'en-US')).toBe(null);
    expect(S.seasonFor(d(2026, 6, 12), 'pt-PT')).toBe(null);
    // 2026: Carnival runs February 14 to 18.
    expect(S.seasonFor(d(2026, 2, 14), 'en-US')).toBe('valentine');
    expect(S.seasonFor(d(2026, 2, 14), 'pt-BR')).toBe('carnival');
    expect(S.seasonFor(d(2027, 2, 14), 'pt-BR')).toBe('valentine');
  });

  it('names the June theme Festa Junina for pt-BR visitors and Midsummer for others', () => {
    expect(S.label('junina', 'en', 'pt-BR')).toBe('Festa Junina');
    expect(S.label('junina', 'en', 'en-US')).toBe('Midsummer');
    expect(S.label('christmas', 'pt-BR', 'pt-BR')).toBe('Natal');
    expect(S.label('halloween', 'en', 'en')).toBe('Halloween');
  });

  it('lets ?season= force a theme or turn it off', () => {
    const date = d(2026, 10, 30);
    expect(S.active({ date, lang: 'en', search: '' })).toBe('halloween');
    expect(S.active({ date, lang: 'en', search: '?season=christmas' })).toBe('christmas');
    expect(S.active({ date: d(2026, 3, 10), lang: 'en', search: '?x=1&season=easter' })).toBe('easter');
    expect(S.active({ date, lang: 'en', search: '?season=off' })).toBe(null);
    expect(S.active({ date, lang: 'en', search: '?season=nope' })).toBe(null);
  });

  it('keeps a dismissed season off for the rest of its year only', () => {
    const store = new Map();
    vi.stubGlobal('localStorage', { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) });
    const date = d(2026, 10, 30);
    S.setOff('halloween', date);
    expect(S.active({ date, lang: 'en', search: '' })).toBe(null);
    expect(S.active({ date, lang: 'en', search: '?season=halloween' })).toBe('halloween');
    expect(S.active({ date: d(2027, 10, 30), lang: 'en', search: '' })).toBe('halloween');
    // New Year spans two calendar years and counts as the year that starts.
    S.setOff('newyear', d(2026, 12, 31));
    expect(S.active({ date: d(2027, 1, 1), lang: 'en', search: '' })).toBe(null);
  });

  it('stays small and dependency free', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../docs/assets/site/seasons.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/\bimport\b|\brequire\(/);
    const code = src.replace(/^\s*\/\/.*$/gm, '').replace(/\s+/g, ' ');
    expect(code.length).toBeLessThan(4200);
  });
});

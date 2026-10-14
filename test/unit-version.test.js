import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APP_VERSION, PROTOCOL_VERSION } from '../src/version.js';

describe('version', () => {
  it('matches package.json', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(APP_VERSION).toBe(pkg.version);
    expect(PROTOCOL_VERSION).toBeGreaterThan(0);
  });
});

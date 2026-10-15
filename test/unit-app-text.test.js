// The app's interface text: every key the HTML and the scripts use exists in English, and
// Portuguese has exactly the same keys, so no button ever shows a raw key.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { messages } from '../docs/app/i18n.js';

const app = fileURLToPath(new URL('../docs/app/', import.meta.url));
const html = readFileSync(join(app, 'index.html'), 'utf8');
const scripts = readdirSync(app)
  .filter((f) => f.endsWith('.js') && f !== 'i18n.js')
  .map((f) => readFileSync(join(app, f), 'utf8'))
  .join('\n');

describe('app text', () => {
  it('has the same keys in English and Portuguese', () => {
    const en = Object.keys(messages.en).sort();
    const pt = Object.keys(messages.pt).sort();
    expect(pt.filter((k) => !en.includes(k))).toEqual([]);
    expect(en.filter((k) => !pt.includes(k))).toEqual([]);
  });

  it('knows every key used in the page', () => {
    const keys = new Set();
    for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) keys.add(m[1]);
    for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) for (const pair of m[1].split(',')) keys.add(pair.split(':')[1].trim());
    expect([...keys].filter((k) => !(k in messages.en))).toEqual([]);
  });

  it('knows every literal key the scripts pass to t()', () => {
    const keys = new Set();
    for (const m of scripts.matchAll(/\bt\(\s*'([a-z][\w.-]*)'/g)) keys.add(m[1]);
    // Keys chosen with a condition, such as t(n === 1 ? 'pending.file' : 'pending.files').
    for (const m of scripts.matchAll(/\bt\([^()]*?\?\s*'([a-z][\w.-]*)'\s*:\s*'([a-z][\w.-]*)'/g)) keys.add(m[1]).add(m[2]);
    expect(keys.size).toBeGreaterThan(100);
    expect([...keys].filter((k) => !(k in messages.en))).toEqual([]);
  });

  it('fills placeholders and keeps unknown ones visible', async () => {
    const { t } = await import('../docs/app/i18n.js');
    expect(t('known.wait.title', { name: 'Phone' })).toBe('Waiting for Phone...');
    expect(t('pending.ready', {})).toContain('{what}');
  });
});

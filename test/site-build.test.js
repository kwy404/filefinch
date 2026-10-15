// Checks the built website in docs/ without a browser: every page in the
// sitemap exists with its SEO tags, structured data parses, hreflang pairs
// point at each other, internal links resolve and the guides are long enough.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));
const docs = join(root, 'docs');
const SITE = 'https://kwy404.github.io/filefinch/';

const sitemap = readFileSync(join(docs, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const sitePages = urls.filter((u) => !u.startsWith(`${SITE}app/`)).map((u) => u.slice(SITE.length));
const fileFor = (p) => join(docs, p.endsWith('/') || p === '' ? `${p}index.html` : p);
const html = (p) => readFileSync(fileFor(p), 'utf8');

function resolveLink(fromPage, href) {
  const base = new URL(fromPage, SITE);
  const u = new URL(href, base);
  if (!u.href.startsWith(SITE)) return null;
  let rel = decodeURIComponent(u.pathname.slice('/filefinch/'.length));
  let f = join(docs, rel);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  return f;
}

describe('site build', () => {
  it('lists the home page, the app, both guide indexes and a few focused guides', () => {
    expect(urls).toContain(SITE);
    expect(urls).toContain(`${SITE}app/`);
    expect(urls).toContain(`${SITE}guides/`);
    expect(urls).toContain(`${SITE}pt/guias/`);
    const en = urls.filter((u) => /\/guides\/[^/]+\/$/.test(u));
    const pt = urls.filter((u) => /\/guias\/[^/]+\/$/.test(u));
    expect(en.length).toBeGreaterThanOrEqual(1);
    expect(en.length).toBeLessThanOrEqual(4);
    expect(pt.length).toBeGreaterThanOrEqual(1);
    expect(pt.length).toBeLessThanOrEqual(2);
  });

  it('has no keyword fields or keyword meta tags', () => {
    for (const p of sitePages) {
      const h = html(p);
      expect(h, p).not.toContain('<meta name="keywords"');
      expect(h, p).not.toContain('"keywords"');
    }
  });

  it('has robots.txt pointing at the sitemap and a noindex 404 page', () => {
    expect(readFileSync(join(docs, 'robots.txt'), 'utf8')).toContain(`Sitemap: ${SITE}sitemap.xml`);
    expect(readFileSync(join(docs, '404.html'), 'utf8')).toContain('<meta name="robots" content="noindex">');
  });

  for (const p of sitePages) {
    it(`page ${p || 'home'} has its SEO tags and valid structured data`, () => {
      const h = html(p);
      expect(h).toMatch(/<title>[^<]{10,}<\/title>/);
      expect(h).toContain(`<link rel="canonical" href="${SITE}${p}">`);
      const desc = /<meta name="description" content="([^"]+)"/.exec(h)[1];
      expect(desc.length).toBeGreaterThan(70);
      expect(desc.length).toBeLessThanOrEqual(170);
      const og = /<meta property="og:image" content="([^"]+)"/.exec(h)[1];
      expect(og.startsWith(SITE)).toBe(true);
      const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(h);
      expect(ld).not.toBeNull();
      expect(() => JSON.parse(ld[1])).not.toThrow();
      expect(h).toContain('rel="me noopener"');
      expect(h).toContain('kwy404.github.io/monsoon/');
      expect(h).toContain('kwy404.github.io/Voodoo.js/');
      expect(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`).test(h)).toBe(false);
    });
  }

  it('declares the home page as a free WebApplication with an FAQ', () => {
    const graph = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html(''))[1])['@graph'];
    const app = graph.find((n) => n['@type'] === 'WebApplication');
    expect(app.offers.price).toBe('0');
    expect(graph.some((n) => n['@type'] === 'FAQPage' && n.mainEntity.length >= 5)).toBe(true);
  });

  it('links translated guides through hreflang, both ways', () => {
    const pt = sitePages.filter((p) => p.startsWith('pt/guias/') && p !== 'pt/guias/');
    let paired = 0;
    for (const p of pt) {
      const m = /<link rel="alternate" hreflang="en" href="([^"]+)">/.exec(html(p));
      if (!m) continue;
      paired++;
      const en = m[1];
      const back = /<link rel="alternate" hreflang="pt-BR" href="([^"]+)">/.exec(html(en.slice(SITE.length)))[1];
      expect(back).toBe(SITE + p);
    }
    expect(paired).toBeGreaterThanOrEqual(1);
  });

  it('has no broken internal links or images', () => {
    const broken = [];
    for (const p of [...sitePages, '404.html']) {
      if (p === '404.html') continue;
      const h = html(p);
      for (const m of h.matchAll(/\b(?:href|src)="([^"#][^"]*)"/g)) {
        const target = m[1];
        if (/^(mailto:|data:)/.test(target)) continue;
        if (/^https?:/.test(target) && !target.startsWith(SITE)) continue;
        if (target.startsWith(`${SITE}app/`) || /(^|\/)app\/$/.test(target)) continue;
        const f = resolveLink(p, target);
        if (f && !existsSync(f)) broken.push(`${p || 'home'} -> ${target}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('ships guides of at least 800 words in English and 700 in Portuguese', () => {
    for (const lang of ['en', 'pt']) {
      const dir = join(root, 'scripts', 'site', 'guides', lang);
      for (const f of readdirSync(dir)) {
        const body = readFileSync(join(dir, f), 'utf8').split(/\n---\n/).slice(1).join('\n');
        const words = body.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
        expect(words, `${lang}/${f}`).toBeGreaterThanOrEqual(lang === 'en' ? 800 : 700);
      }
    }
    expect(readdirSync(join(root, 'scripts', 'site', 'guides', 'en')).length).toBeLessThanOrEqual(4);
    expect(readdirSync(join(root, 'scripts', 'site', 'guides', 'pt')).length).toBeLessThanOrEqual(2);
  });

  it('ships the mascot, favicon, banners and paired light and dark icons', () => {
    for (const f of ['mascot.svg', 'mascot-dark.svg', 'mascot-head.svg', 'favicon.svg', 'banner.svg', 'banner-dark.svg', 'social-preview.png']) expect(existsSync(join(root, 'assets', f)), f).toBe(true);
    const light = readdirSync(join(root, 'assets', 'icons', 'light'));
    expect(light.length).toBeGreaterThanOrEqual(30);
    expect(readdirSync(join(root, 'assets', 'icons', 'dark')).sort()).toEqual(light.sort());
    expect(readdirSync(join(root, 'assets', 'illustrations')).filter((f) => !f.endsWith('-dark.svg')).length).toBeGreaterThanOrEqual(10);
  });
});

// Builds the filefinch site in docs/ (the app in docs/app/ is built by
// scripts/build-app.mjs):
//   docs/index.html                     landing page with the live flow
//   docs/guides/, docs/pt/guias/        guides from scripts/site/guides/
//   docs/404.html, sitemap.xml, robots.txt, .nojekyll
//   docs/assets/art/, docs/assets/icons/ illustrations and icons
//   docs/og.png, docs/assets/og/*.png   Open Graph images (with --png)
// Code samples are highlighted at build time with Shiki (light-plus and
// dark-plus) in a VS Code style frame.
// Usage: node scripts/site/build-site.mjs [--png]
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { encodeQr, qrPath } from '../../src/qr.js';
import { baseImages, buildArt, renderPng } from './build-art.mjs';
import { cardSVG } from './art/banner.mjs';
import { HOME, homeBody, homeJsonLd } from './home.mjs';
import { GUIDE_BASE, guideBody, guideJsonLd, guidePath, indexBody, indexJsonLd } from './guides.mjs';
import { SITE, UPDATED, esc, page, rel } from './layout.mjs';
import { frontMatter, render } from './md.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const docs = join(root, 'docs');
const png = process.argv.includes('--png');
const draft = process.argv.includes('--draft');
const problems = [];

// ---------- Shiki ----------

async function loadShiki() {
  const require = createRequire(import.meta.url);
  try {
    require.resolve('shiki');
    return await import('shiki');
  } catch {
    const sibling = join(root, '..', 'graphemely', 'node_modules', 'shiki', 'dist', 'index.mjs');
    if (existsSync(sibling)) return import(pathToFileURL(sibling).href);
  }
  return null;
}
const shiki = await loadShiki();
const highlighter = shiki ? await shiki.createHighlighter({ themes: ['light-plus', 'dark-plus'], langs: ['html', 'js', 'json', 'bash', 'text'] }) : null;
const FILE_ICONS = { html: ['#e34c26', '<>'], js: ['#c9a400', 'JS'], json: ['#8a6d00', '{}'], bash: ['#3f8f4f', '$_'], text: ['#6a66a8', 'Aa'] };
const TITLES = { html: 'index.html', js: 'script.js', json: 'settings.json', bash: 'Terminal', text: 'notes.txt' };
let codeId = 0;
function frame(code, lang = 'text') {
  const l = FILE_ICONS[lang] ? lang : lang === 'sh' || lang === 'shell' ? 'bash' : 'text';
  if (!highlighter) throw new Error('shiki is needed to build code samples: install it or keep graphemely next to this repo');
  const html = highlighter.codeToHtml(code, { lang: l, themes: { light: 'light-plus', dark: 'dark-plus' }, defaultColor: false });
  const inner = /<code>([\s\S]*)<\/code>/.exec(html)[1];
  const id = `code-${++codeId}`;
  const [color, label] = FILE_ICONS[l];
  return `<figure class="frame"><div class="frame-bar"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="frame-tab"><svg class="file-ic" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect width="16" height="16" rx="3" fill="${color}"/><text x="8" y="11" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="6.4" font-weight="700" fill="#fff">${esc(label)}</text></svg><span>${TITLES[l]}</span></span><button type="button" class="frame-copy" v-copy-from="#${id}" aria-label="Copy ${TITLES[l]}"><svg class="ic" aria-hidden="true"><use href="#i-copy"/></svg><span>Copy</span></button></div><pre class="shiki" tabindex="0" v-pre><code id="${id}">${inner}</code></pre></figure>`;
}

// ---------- Art ----------

buildArt();

// ---------- Guides ----------

const guides = [];
for (const lang of ['en', 'pt']) {
  const dir = join(root, 'scripts', 'site', 'guides', lang);
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md')).sort()) {
    const { meta, body } = frontMatter(readFileSync(join(dir, f), 'utf8'));
    if (`${meta.slug}.md` !== f) throw new Error(`${lang}/${f}: slug ${meta.slug} does not match`);
    guides.push({ meta, body });
  }
}
const ORDER = ['send-large-files-without-limits', 'transfer-files-from-phone-to-pc-without-cable', 'free-private-alternative-to-cloud-transfer', 'send-a-whole-folder', 'share-files-without-uploading', 'airdrop-for-windows-and-android', 'send-video-in-original-quality', 'peer-to-peer-file-transfer-explained', 'is-webrtc-file-sharing-safe', 'transfer-files-on-the-same-wifi', 'sync-folders-between-computers-without-cloud', 'enviar-arquivos-grandes-sem-limite', 'transferir-arquivos-do-celular-para-o-pc-sem-cabo', 'airdrop-para-windows-e-android'];
const rank = (g) => (ORDER.includes(g.meta.slug) ? ORDER.indexOf(g.meta.slug) : ORDER.length);
guides.sort((a, b) => rank(a) - rank(b));
for (const g of guides) {
  if (g.meta.pair) {
    g.pair = guides.find((x) => x.meta.slug === g.meta.pair && x.meta.lang !== g.meta.lang);
    if (!g.pair) problems.push(`${g.meta.slug}: pair ${g.meta.pair} not found`);
  }
}
const hl = (lang) => (lang === 'pt' ? 'pt-BR' : 'en');
const altFor = (g) => {
  const a = { [hl(g.meta.lang)]: SITE + guidePath(g.meta.lang, g.meta.slug) };
  if (g.pair) a[hl(g.pair.meta.lang)] = SITE + guidePath(g.pair.meta.lang, g.pair.meta.slug);
  a['x-default'] = a.en || a['pt-BR'];
  return a;
};

// ---------- Pages ----------

const out = {};
const APP_URL = `${SITE}app/`;
const qr = encodeQr(APP_URL, { ecl: 'M' });
const qrMarkup = `<svg viewBox="0 0 ${qr.size + 4} ${qr.size + 4}" shape-rendering="crispEdges" aria-hidden="true"><rect width="${qr.size + 4}" height="${qr.size + 4}" fill="#fff"/><path fill="#10244A" d="${qrPath(qr, 2)}"/></svg>`;

for (const g of guides) {
  const lang = g.meta.lang;
  const path = guidePath(lang, g.meta.slug);
  const R = rel(path);
  const link = (h) => {
    if (h.startsWith('guide:')) {
      const slug = h.slice(6);
      if (!guides.find((x) => x.meta.slug === slug && x.meta.lang === lang)) problems.push(`${lang}/${g.meta.slug}: broken guide link ${slug}`);
      return { href: R + guidePath(lang, slug) };
    }
    if (h === 'app:') return { href: `${R}app/` };
    if (h.startsWith('home:')) return { href: `${R}${h.slice(5)}` };
    return { href: h, external: /^https?:/.test(h) };
  };
  Object.assign(g, render(g.body, { link, frame }));
  g.link = link;
}

out['index.html'] = page(
  {
    lang: 'en', path: '', title: HOME.title, description: HOME.description, jsonld: homeJsonLd(), bodyClass: 'home',
    alternates: { en: SITE, 'x-default': SITE },
    ogAlt: 'filefinch: Finn the finch courier flying files straight between your own devices, no cloud in between',
  },
  homeBody('', { guides, qrMarkup, link: `${APP_URL}#i=7VfLbtswEPwVQueEBu6ZWwM` }),
);

for (const g of guides) {
  const lang = g.meta.lang;
  const path = guidePath(lang, g.meta.slug);
  const R = rel(path);
  out[`${path}index.html`] = page(
    {
      lang, path, nav: 'guides', ogType: 'article', title: g.meta.title, description: g.meta.description, jsonld: guideJsonLd(g),
      alternates: altFor(g), langHref: g.pair ? guidePath(g.pair.meta.lang, g.pair.meta.slug) : undefined,
      ogImage: `${SITE}assets/og/${g.meta.slug}.png`, ogAlt: g.meta.alt, bodyClass: 'guide',
    },
    guideBody(g, guides, R, { link: g.link }),
  );
}

for (const lang of ['en', 'pt']) {
  const path = GUIDE_BASE[lang];
  const en = lang === 'en';
  out[`${path}index.html`] = page(
    {
      lang, path, nav: 'guides',
      title: en ? 'Guides: send large files, folders and photos directly between devices | filefinch' : 'Guias: enviar arquivos grandes direto entre aparelhos | filefinch',
      description: en ? 'Free guides to moving files between your own devices without a cloud: large files, whole folders, phone to PC, same Wi-Fi, AirDrop alternatives and WebRTC safety.' : 'Guias grátis para mover arquivos entre os seus aparelhos sem nuvem: arquivos grandes sem limite, do celular para o PC sem cabo e alternativas ao AirDrop.',
      jsonld: indexJsonLd(lang, guides), alternates: { en: `${SITE}guides/`, 'pt-BR': `${SITE}pt/guias/`, 'x-default': `${SITE}guides/` }, langHref: en ? 'pt/guias/' : 'guides/',
      ogImage: `${SITE}assets/og/guides-${lang}.png`,
    },
    indexBody(lang, guides, rel(path)),
  );
}

const rootLinks = (html) => html.replace(/\b(href|src)="(?![a-z]+:|#|\/)([^"]*)"/g, (_, a, v) => `${a}="/filefinch/${v.replace(/^(\.\.?\/)+/, '')}"`);
out['404.html'] = rootLinks(page(
  { lang: 'en', path: '', title: 'Page not found | filefinch', description: 'This page flew off course. Head back to filefinch to send files straight between your own devices.', noindex: true },
  `<section class="notfound"><span class="art nf-art"><img class="art-l" src="assets/art/strict-nat.svg" width="640" height="400" alt="Finn looking for a path between two houses"><img class="art-d" src="assets/art/strict-nat-dark.svg" width="640" height="400" alt="" aria-hidden="true"></span><div><p class="kicker">404</p><h1>This parcel lost its way</h1><p class="lede">The page you asked for is not here. The link may be old, or a letter got lost on the way.</p><p class="hero-cta"><a class="btn btn-primary" href="./">Back to the home page</a><a class="btn btn-outline" href="guides/">Browse the guides</a><a class="btn btn-ghost" href="app/">Open the app</a></p></div></section>`,
));

// ---------- Sitemap and robots ----------

const urls = [
  { loc: '', pr: '1.0' },
  { loc: 'app/', pr: '0.9' },
  { loc: 'guides/', alt: { en: 'guides/', 'pt-BR': 'pt/guias/' }, pr: '0.9' },
  { loc: 'pt/guias/', alt: { en: 'guides/', 'pt-BR': 'pt/guias/' }, pr: '0.8' },
  ...guides.map((g) => {
    const a = altFor(g);
    return { loc: guidePath(g.meta.lang, g.meta.slug), alt: g.pair ? Object.fromEntries(Object.entries(a).filter(([k]) => k !== 'x-default').map(([k, v]) => [k, v.slice(SITE.length)])) : null, pr: '0.8' };
  }),
];
out['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((u) => `  <url><loc>${SITE}${u.loc}</loc><lastmod>${UPDATED}</lastmod><priority>${u.pr}</priority>${u.alt ? Object.entries(u.alt).map(([l, p]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${p}"/>`).join('') : ''}</url>`).join('\n')}
</urlset>
`;
out['robots.txt'] = `User-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: ${SITE}sitemap.xml\n`;
out['.nojekyll'] = '';

// ---------- Checks ----------

const dash = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);
const titles = new Set();
const descs = new Set();
for (const [name, content] of Object.entries(out)) {
  if (dash.test(content)) problems.push(`${name}: contains an en or em dash`);
  if (/\p{Extended_Pictographic}/u.test(content.replace(/[©®™]/g, ''))) problems.push(`${name}: contains an emoji`);
  if (!name.endsWith('.html')) continue;
  const text = content.replace(/<(script|style|pre|code|svg|template)\b[\s\S]*?<\/\1>/g, '').replace(/<[a-z!/](?:[^>"']|"[^"]*"|'[^']*')*>/gi, '');
  const brace = /.{0,40}[{}].{0,40}/.exec(text);
  if (brace) problems.push(`${name}: braces outside code would be read by Voodoo: ${brace[0]}`);
  const title = /<title>([^<]*)<\/title>/.exec(content)[1];
  if (titles.has(title)) problems.push(`${name}: duplicate title ${title}`);
  titles.add(title);
  const desc = /<meta name="description" content="([^"]*)"/.exec(content)[1];
  if (descs.has(desc)) problems.push(`${name}: duplicate description`);
  descs.add(desc);
  if (desc.length > 170) problems.push(`${name}: description is ${desc.length} characters`);
}
for (const g of guides) {
  const min = g.meta.lang === 'en' ? 800 : 700;
  if (g.words < min) problems.push(`${g.meta.lang}/${g.meta.slug}: only ${g.words} words`);
  for (const slug of g.meta.related || []) if (!guides.find((x) => x.meta.slug === slug && x.meta.lang === g.meta.lang)) problems.push(`${g.meta.lang}/${g.meta.slug}: related guide ${slug} is missing`);
}
if (problems.length) {
  console.error(problems.join('\n'));
  if (!draft) process.exit(1);
}

for (const [name, content] of Object.entries(out)) {
  mkdirSync(dirname(join(docs, name)), { recursive: true });
  writeFileSync(join(docs, name), content);
}

if (png) {
  await renderPng([
    ...baseImages(),
    { svg: cardSVG({ title: 'Guides to sending files directly between your devices', kicker: 'filefinch guides', art: 'folder-flock' }), width: 1200, height: 630, out: 'docs/assets/og/guides-en.png' },
    { svg: cardSVG({ title: 'Guias para enviar arquivos direto entre aparelhos', kicker: 'guias do filefinch', art: 'phone-to-pc' }), width: 1200, height: 630, out: 'docs/assets/og/guides-pt.png' },
    ...guides.map((g) => ({ svg: cardSVG({ title: g.meta.h1, kicker: g.meta.lang === 'pt' ? 'Guia do filefinch' : 'filefinch guide', art: g.meta.art }), width: 1200, height: 630, out: `docs/assets/og/${g.meta.slug}.png` })),
  ]);
}

console.log(`build-site: ${Object.keys(out).filter((n) => n.endsWith('.html')).length} pages, ${guides.length} guides (${guides.map((g) => `${g.meta.slug} ${g.words}`).join(', ')})`);

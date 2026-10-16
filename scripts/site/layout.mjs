// Page shell of the filefinch site: head, top bar, footer, icon sprite and
// the strings shared by the English and Portuguese pages.
import { readFileSync } from 'node:fs';

export const SITE = 'https://kwy404.github.io/filefinch/';
export const REPO = 'https://github.com/kwy404/filefinch';
export const VERSION = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version;
export const UPDATED = '2026-10-14';
export const MONSOON = 'https://cdn.jsdelivr.net/npm/monsooncss@0.2.0/dist/monsoon.min.css';
export const VOODOO = 'https://cdn.jsdelivr.net/npm/voodoojs@1.0.0/dist/voodoo.full.min.js';
export const AUTHOR = { name: 'Alexandre Kohler', github: 'https://github.com/kwy404', linkedin: 'https://www.linkedin.com/in/alexandre-silva-173687256/' };

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const MORE = [
  ['Monsoon', 'https://kwy404.github.io/monsoon/', 'CSS framework with no build step', 'framework CSS sem build'],
  ['Voodoo.js', 'https://kwy404.github.io/Voodoo.js/', 'reactive HTML attributes', 'atributos HTML reativos'],
  ['howlden', 'https://kwy404.github.io/howlden/', 'serverless peer to peer voice and chat rooms', 'salas de voz e chat P2P sem servidor'],
  ['breakhound', 'https://kwy404.github.io/breakhound/', 'finds bugs in any JS library', 'acha bugs em qualquer biblioteca JS'],
  ['vueleap', 'https://kwy404.github.io/vueleap/', 'migrate Vue 2 to Vue 3', 'migra Vue 2 para Vue 3'],
  ['graphemely', 'https://kwy404.github.io/graphemely/', 'emoji safe string utilities', 'strings seguras com emoji'],
  ['numberparrot', 'https://kwy404.github.io/numberparrot/', 'parse localized numbers', 'converte números localizados'],
  ['edgegoat', 'https://kwy404.github.io/edgegoat/', 'edge case test inputs', 'casos extremos para testes'],
  ['cookieowl', 'https://kwy404.github.io/cookieowl/', 'cookie consent for LGPD and GDPR', 'consentimento de cookies LGPD e GDPR'],
  ['installkite', 'https://kwy404.github.io/installkite/', 'make any site an installable PWA', 'transforma qualquer site em PWA'],
  ['a11ymedic', 'https://kwy404.github.io/a11ymedic/', 'accessibility checker with fixes', 'verificador de acessibilidade'],
  ['fontsketch', 'https://kwy404.github.io/fontsketch/', 'turn your handwriting into a font', 'transforma sua letra em fonte'],
  ['kastor', 'https://kwy404.github.io/kastor/', 'TypeScript ORM for almost every database', 'ORM TypeScript para quase todo banco'],
];

export const STR = {
  en: {
    skip: 'Skip to content',
    nav: [['how', 'How it works', '#how'], ['privacy', 'Privacy', '#privacy'], ['features', 'Features', '#features'], ['faq', 'FAQ', '#faq'], ['guides', 'Guides', 'guides/']],
    cta: 'Start sending',
    menu: 'Menu',
    langLabel: 'Guias em português',
    langShort: 'PT',
    footBlurb: 'Send files and whole folders straight between your own devices. Peer to peer in the browser: no server of ours, no account, nothing stored online.',
    product: 'filefinch',
    guides: 'Guides',
    more: 'More from kwy404',
    made: 'Made by',
    and: 'and',
    builtMonsoon: 'Built with',
    builtVoodoo: 'Interactive parts built with',
    license: 'MIT License. Free and open source, no tracking.',
    links: [['Open the app', 'app/'], ['How it works', '#how'], ['All guides', 'guides/'], ['Source on GitHub', REPO], ['Security policy', `${REPO}/blob/main/SECURITY.md`], ['Changelog', `${REPO}/blob/main/CHANGELOG.md`]],
    guideLinks: [['Phone to computer', 'guides/transfer-files-from-phone-to-pc-without-cable/'], ['Send a whole folder', 'guides/send-a-whole-folder/'], ['Keep a folder in sync', 'guides/sync-folders-between-computers-without-cloud/'], ['Security', 'guides/is-webrtc-file-sharing-safe/']],
  },
  pt: {
    skip: 'Pular para o conteúdo',
    nav: [['how', 'Como funciona', '#how'], ['privacy', 'Privacidade', '#privacy'], ['features', 'Recursos', '#features'], ['faq', 'Perguntas', '#faq'], ['guides', 'Guias', 'pt/guias/']],
    cta: 'Começar a enviar',
    menu: 'Menu',
    langLabel: 'English',
    langShort: 'EN',
    footBlurb: 'Envie arquivos e pastas inteiras direto entre os seus aparelhos. Ponto a ponto no navegador: nenhum servidor nosso, sem conta, nada guardado online.',
    product: 'filefinch',
    guides: 'Guias em português',
    more: 'Mais de kwy404',
    made: 'Feito por',
    and: 'e',
    builtMonsoon: 'Feito com',
    builtVoodoo: 'Partes interativas feitas com',
    license: 'Licença MIT. Grátis, código aberto e sem rastreamento.',
    links: [['Abrir o app', 'app/'], ['Como funciona', '#how'], ['Todos os guias', 'pt/guias/'], ['Código no GitHub', REPO], ['Política de segurança', `${REPO}/blob/main/SECURITY.md`], ['Changelog', `${REPO}/blob/main/CHANGELOG.md`]],
    guideLinks: [['Do celular para o computador', 'pt/guias/transferir-arquivos-do-celular-para-o-pc-sem-cabo/'], ['Enviar arquivos grandes', 'pt/guias/enviar-arquivos-grandes-sem-limite/']],
  },
};

const ic = (id, path) => `<symbol id="i-${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</symbol>`;
export const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${[
  ic('github', '<path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>'),
  ic('menu', '<path d="M4 7h16M4 12h16M4 17h16"/>'),
  ic('copy', '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>'),
  ic('check', '<path d="m5 12 5 5L20 7"/>'),
  ic('arrow', '<path d="M5 12h14M13 6l6 6-6 6"/>'),
  ic('send', '<path d="M4 12 20 4l-4 16-4-6Z"/><path d="m12 14 8-10"/>'),
  ic('globe', '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3 3-3 15 0 18M12 3c3 3 3 15 0 18"/>'),
  ic('play', '<path d="m7 4 13 8-13 8Z"/>'),
  ic('pause', '<path d="M8 5v14M16 5v14"/>'),
  ic('lock', '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  ic('link', '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>'),
  ic('external', '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  ic('plus', '<path d="M12 5v14M5 12h14"/>'),
  ic('close', '<path d="M6 6l12 12M18 6 6 18"/>'),
].join('')}</svg>`;

/** Relative prefix from a page path (like 'guides/x/') to the site root. */
export const rel = (path) => '../'.repeat((path.match(/\//g) || []).length);

/**
 * @param {object} o
 * @param {'en'|'pt'} o.lang
 * @param {string} o.path page path relative to the site root ('' for home)
 * @param {string} o.title
 * @param {string} o.description
 * @param {object[]} [o.jsonld]
 * @param {string} [o.ogImage] absolute URL
 * @param {string} [o.ogAlt]
 * @param {string} [o.ogType]
 * @param {Record<string,string>} [o.alternates] hreflang to absolute URL
 * @param {string} [o.nav] active nav id
 * @param {boolean} [o.noindex]
 * @param {string} [o.head] extra head markup
 * @param {string} [o.bodyClass]
 * @param {string} [o.langHref] relative URL of the page in the other language
 * @param {string} body
 */
export function page(o, body) {
  const s = STR[o.lang];
  const R = rel(o.path);
  const url = SITE + o.path;
  const og = o.ogImage || `${SITE}og.png`;
  const alts = o.alternates || {};
  const htmlLang = o.lang === 'pt' ? 'pt-BR' : 'en';
  const href = (h) => (/^(https?:|mailto:)/.test(h) ? h : h.startsWith('#') ? (o.path === '' && !o.noindex ? h : `${R || './'}${h}`) : R + h);
  const isHome = o.path === '' && !o.noindex;
  const navHref = (h) => (h.startsWith('#') ? (isHome ? h : `${R || './'}${h}`) : R + h);
  const otherLang = R + (o.langHref ?? (o.lang === 'pt' ? '' : 'pt/guias/'));
  return `<!doctype html>
<html lang="${htmlLang}" data-theme="dark" style="color-scheme: dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<script src="${R}assets/site/seasons.js"></script>
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
${o.noindex ? '<meta name="robots" content="noindex">\n' : ''}<link rel="canonical" href="${url}">
${Object.entries(alts).map(([l, u]) => `<link rel="alternate" hreflang="${l}" href="${u}">`).join('\n')}
<meta name="author" content="${AUTHOR.name}">
<meta name="theme-color" content="#09090B">
<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:site_name" content="filefinch">
<meta property="og:locale" content="${o.lang === 'pt' ? 'pt_BR' : 'en_US'}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(o.ogAlt || 'filefinch: Finn the finch courier flying files straight between your own devices, no cloud in between')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.description)}">
<meta name="twitter:image" content="${og}">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="${MONSOON}">
<link rel="stylesheet" href="${R}assets/site/site.css">
<script src="${VOODOO}" data-manual defer></script>
<script type="module" src="${R}assets/site/site.js"></script>
<script type="module" src="${R}assets/site/season-fx.js"></script>
${o.head || ''}${(o.jsonld || []).length ? `<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': o.jsonld }, null, 1)}\n</script>` : ''}
</head>
<body class="${o.bodyClass || ''}">
${SPRITE}
<a class="skip" href="#main">${s.skip}</a>
<header class="topbar" v-data="{ open: false }" @keydown.escape="open = false">
  <div class="topbar-in">
    <a class="brand" href="${R}" aria-label="filefinch home"><img src="${R}favicon.svg" width="28" height="28" alt=""><span class="brand-word">filefinch</span></a>
    <nav id="topnav" class="topnav" :class="open ? 'is-open' : ''" aria-label="Main">
      ${s.nav.map(([nid, label, h]) => `<a href="${navHref(h)}"${o.nav === nid ? ' aria-current="page"' : ''}>${label}</a>`).join('\n      ')}
      <a class="topnav-cta btn btn-primary btn-sm" href="${R}app/"><svg class="ic" aria-hidden="true"><use href="#i-send"/></svg>${s.cta}</a>
    </nav>
    <div class="topbar-tools">
      <a class="icon-btn lang-btn" href="${otherLang}" hreflang="${o.lang === 'pt' ? 'en' : 'pt-BR'}" lang="${o.lang === 'pt' ? 'en' : 'pt-BR'}" title="${s.langLabel}" aria-label="${s.langLabel}"><svg class="ic" aria-hidden="true"><use href="#i-globe"/></svg><span>${s.langShort}</span></a>
      <a class="icon-btn" href="${REPO}" rel="noopener" aria-label="filefinch on GitHub"><svg class="ic" aria-hidden="true"><use href="#i-github"/></svg></a>
      <button type="button" class="icon-btn nav-btn" aria-controls="topnav" :aria-expanded="open ? 'true' : 'false'" aria-expanded="false" @click="open = !open" aria-label="${s.menu}"><svg class="ic" aria-hidden="true"><use href="#i-menu"/></svg></button>
    </div>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <div class="foot-in">
    <div class="foot-brand">
      <a class="brand" href="${R}"><img src="${R}favicon.svg" width="28" height="28" alt=""><span class="brand-word">filefinch</span></a>
      <p>${s.footBlurb}</p>
      <p class="foot-made">${s.made} <strong>${AUTHOR.name}</strong> (<a href="${AUTHOR.github}" rel="me noopener">GitHub</a> ${s.and} <a href="${AUTHOR.linkedin}" rel="me noopener">LinkedIn</a>).</p>
      <p class="foot-built">${s.builtMonsoon} <a href="https://kwy404.github.io/monsoon/" rel="noopener">Monsoon</a>. ${s.builtVoodoo} <a href="https://kwy404.github.io/Voodoo.js/" rel="noopener">Voodoo.js</a>.</p>
    </div>
    <div>
      <h2 class="foot-h">${s.product}</h2>
      <ul class="foot-list">${s.links.map(([t, h]) => `<li><a href="${href(h)}"${/^https/.test(h) ? ' rel="noopener"' : ''}>${t}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h2 class="foot-h">${s.guides}</h2>
      <ul class="foot-list">${s.guideLinks.map(([t, h]) => `<li><a href="${R}${h}">${t}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h2 class="foot-h">${s.more}</h2>
      <ul class="foot-list foot-more">${MORE.map(([n, u, en, pt]) => `<li><a href="${u}" rel="noopener">${n}</a><small>${o.lang === 'pt' ? pt : en}</small></li>`).join('')}</ul>
    </div>
  </div>
  <p class="foot-legal">${s.license} <span>filefinch ${VERSION}</span></p>
</footer>
</body>
</html>
`;
}

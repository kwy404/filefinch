// Shared behavior of the filefinch site, built with Voodoo.js
// (https://kwy404.github.io/Voodoo.js/). Voodoo is loaded with data-manual:
// this module adds a few helpers and then calls V.start(). Pages declare
// their behavior in HTML: v-data, v-init, @click, :class, v-show, v-text,
// v-copy-from and v-theme-toggle.

function boot() {
  const V = window.V;
  if (!V) return;
  // The hero demo plays by itself unless the visitor asked for less motion.
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (V.config?.globals) V.config.globals.REDUCED_MOTION = reduced;
  V.start();
}

// Copy buttons: a short confirmation on the button itself.
document.addEventListener('click', (e) => {
  const btn = e.target.closest?.('.frame-copy');
  if (!btn) return;
  const label = btn.querySelector('span');
  if (!label) return;
  const before = label.textContent;
  label.textContent = document.documentElement.lang === 'pt-BR' ? 'Copiado' : 'Copied';
  setTimeout(() => {
    label.textContent = before;
  }, 1400);
});

// Close the mobile menu after following an in-page link.
document.addEventListener('click', (e) => {
  const a = e.target.closest?.('.topnav a');
  if (!a) return;
  const nav = document.getElementById('topnav');
  if (nav?.classList.contains('is-open')) document.querySelector('.nav-btn')?.click();
});

// Voodoo is a deferred classic script and this module runs after it, but
// wait for it anyway in case the CDN is slow.
if (window.V) boot();
else window.addEventListener('load', boot, { once: true });

// Motion for the filefinch home page, in small vanilla JavaScript: a faint
// light that follows the pointer over the hero, the product shots rising in
// as they scroll into view, and the numbers counting up. Under
// prefers-reduced-motion nothing moves and everything shows its final state.

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function hero() {
  const hx = document.querySelector('[data-hero]');
  if (!hx || reduced || !finePointer) return;
  hx.addEventListener('pointermove', (e) => {
    const r = hx.getBoundingClientRect();
    hx.style.setProperty('--mx', `${e.clientX - r.left}px`);
    hx.style.setProperty('--my', `${e.clientY - r.top}px`);
    hx.classList.add('is-pointer');
  }, { passive: true });
  hx.addEventListener('pointerleave', () => hx.classList.remove('is-pointer'));
}

function countUp(el) {
  const end = Number(el.dataset.count);
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  if (reduced || !end) {
    el.textContent = fmt(end);
    return;
  }
  const t0 = performance.now();
  const dur = 1400;
  const frame = (now) => {
    const t = clamp((now - t0) / dur);
    el.textContent = fmt(end * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(frame);
  };
  el.textContent = '0';
  requestAnimationFrame(frame);
}

function reveals() {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      e.target.classList.add('is-in');
      if (e.target.matches('[data-count]')) countUp(e.target);
    }
  }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-reveal], [data-count]').forEach((el) => io.observe(el));
}

hero();
reveals();

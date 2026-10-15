// Seasonal decoration of the filefinch site, on top of seasons.js: a small
// chip with an off switch, Finn in costume, the hero accent, and one light
// particle canvas in the hero. Nothing runs when no season is active. The
// canvas stops when the page is hidden or the hero is off screen, and is not
// created at all under prefers-reduced-motion. Everything is aria-hidden
// except the chip.

const S = window.FFSeasons;
const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const base = new URL('../seasons/', import.meta.url);
const ICON = { newyear: 'firework', carnival: 'mask', easter: 'egg', valentine: 'heart', junina: 'bonfire', halloween: 'pumpkin', christmas: 'snowflake' };
const isDark = () => root.dataset.theme === 'dark' || (root.dataset.theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
// Particle colors for the dark and the light theme.
const COLORS = {
  newyear: [['#F2C96B', '#8FB6FF', '#FF9B7A'], ['#C9971C', '#2F6FED', '#D9654A']],
  carnival: [['#B48CFF', '#FFD06B', '#5BE0C8', '#FF9B7A'], ['#8A4FD8', '#E0A21B', '#1E9E8A', '#D9654A']],
  easter: [['#FFD3E0', '#FFF4FA', '#CDE7FF'], ['#F2A9BF', '#A9CBF0', '#B8DFA0']],
  valentine: [['#FF7C9C', '#FFB3C6'], ['#D9466B', '#F08AA4']],
  junina: [['#FF9F5A', '#FFD06B'], ['#E07A1F', '#E0A21B']],
  halloween: [['#E07A1F', '#C4642A', '#8E5B2A'], ['#E07A1F', '#C4642A', '#A8742F']],
  christmas: [['#FFFFFF', '#DCEBFF'], ['#9DBDE6', '#B8CFEE']],
};
const cleanups = [];

const pair = (id, name, cls, alt = '') => `<img class="art-l ${cls}" src="${base}${id}/${name}.svg" alt="${alt}" decoding="async"><img class="art-d ${cls}" src="${base}${id}/${name}-dark.svg" alt="" aria-hidden="true" decoding="async">`;

function chip(id) {
  const pt = /^pt/i.test(root.lang);
  const name = S.label(id, root.lang);
  const el = document.createElement('div');
  el.className = 'season-chip';
  el.innerHTML = `<span class="art" aria-hidden="true">${pair(id, `icon-${ICON[id]}`, 'season-chip-ic')}</span><span class="season-chip-t"></span><button type="button" class="season-chip-x"><svg class="ic" aria-hidden="true"><use href="#i-close"/></svg><span></span></button>`;
  el.querySelector('.season-chip-t').textContent = pt ? `Modo ${name}` : `${name} mode`;
  const btn = el.querySelector('button');
  btn.querySelector('span').textContent = pt ? 'Desligar' : 'Turn off';
  btn.setAttribute('aria-label', pt ? `Desligar o modo ${name}` : `Turn off ${name} mode`);
  btn.addEventListener('click', () => S.off());
  document.body.append(el);
  cleanups.push(() => el.remove());
}

function decorate(id) {
  for (const slot of document.querySelectorAll('[data-season-slot="accent"]')) {
    const el = document.createElement('span');
    el.className = 'art season-accent';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = pair(id, 'accent', '');
    slot.append(el);
    cleanups.push(() => el.remove());
  }
  for (const slot of document.querySelectorAll('[data-season-slot="finn"]')) {
    const el = document.createElement('span');
    el.className = 'art season-finn';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = pair(id, 'finn', '');
    slot.append(el);
    cleanups.push(() => el.remove());
  }
  // Finn in the closing card and on the 404 page wears the costume too.
  for (const img of document.querySelectorAll('img[data-season-finn]')) {
    const before = img.getAttribute('src');
    img.src = `${base}${id}/finn${img.classList.contains('art-d') ? '-dark' : ''}.svg`;
    cleanups.push(() => img.setAttribute('src', before));
  }
}

// ---------- Particles: one canvas, a few dozen shapes ----------

function particles(id, host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'season-fx';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let colors = COLORS[id][isDark() ? 0 : 1];
  const rnd = (a, b) => a + Math.random() * (b - a);
  let W = 0, H = 0, raf = 0, last = 0, seen = false, list = [], bursts = 0;
  const rising = id === 'junina' || id === 'valentine';
  const count = id === 'newyear' ? 0 : id === 'christmas' ? 60 : 34;

  const make = (fresh) => ({
    x: rnd(0, W), y: fresh ? rnd(0, H) : rising ? H + 10 : -12,
    vx: rnd(-12, 12), vy: rising ? rnd(-28, -14) : rnd(14, id === 'christmas' ? 34 : 42),
    r: id === 'christmas' ? rnd(1.2, 3.2) : rnd(3, 6), a: rnd(0, 6.3), va: rnd(-2, 2),
    c: colors[Math.floor(Math.random() * colors.length)], o: rnd(0.35, 0.8), life: 1,
    bat: id === 'halloween' && Math.random() < 0.12,
  });
  const resize = () => {
    colors = COLORS[id][isDark() ? 0 : 1];
    const r = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!list.length) list = Array.from({ length: count }, () => make(true));
  };

  const heart = (r) => {
    ctx.beginPath();
    ctx.moveTo(0, r * 0.35);
    ctx.bezierCurveTo(0, 0, -r, -r * 0.2, -r, r * 0.3);
    ctx.bezierCurveTo(-r, r * 0.8, -r * 0.2, r * 1.1, 0, r * 1.5);
    ctx.bezierCurveTo(r * 0.2, r * 1.1, r, r * 0.8, r, r * 0.3);
    ctx.bezierCurveTo(r, -r * 0.2, 0, 0, 0, r * 0.35);
    ctx.fill();
  };
  const bat = (r, flap) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-r * 1.4, -r * (0.4 + flap), -r * 2.6, r * 0.1);
    ctx.quadraticCurveTo(-r * 1.4, r * 0.1, 0, r * 0.6);
    ctx.quadraticCurveTo(r * 1.4, r * 0.1, r * 2.6, r * 0.1);
    ctx.quadraticCurveTo(r * 1.4, -r * (0.4 + flap), 0, 0);
    ctx.fill();
  };

  const draw = (p) => {
    ctx.save();
    ctx.globalAlpha = p.o * p.life;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.a);
    ctx.fillStyle = p.c;
    if (id === 'christmas' || id === 'junina') {
      ctx.beginPath();
      ctx.arc(0, 0, id === 'junina' ? p.r * 0.45 : p.r, 0, 6.3);
      ctx.fill();
    } else if (id === 'carnival') ctx.fillRect(-p.r, -p.r * 0.35, p.r * 2, p.r * 0.7);
    else if (id === 'valentine') heart(p.r * 0.8);
    else if (p.bat) {
      ctx.rotate(-p.a);
      ctx.fillStyle = isDark() ? '#B48CFF' : '#4A3A66';
      bat(p.r * 1.3, Math.sin(p.a * 6) * 0.5);
    } else {
      // leaves and petals: a soft ellipse
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r * 1.3, p.r * 0.6, 0, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();
  };

  const firework = () => {
    const x = rnd(W * 0.15, W * 0.95), y = rnd(H * 0.08, H * 0.5);
    const c = colors[bursts++ % colors.length];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * 6.283, v = rnd(40, 90);
      list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 1.8, a: 0, va: 0, c, o: 0.9, life: 1, fade: rnd(0.5, 0.8), spark: true });
    }
  };

  const tick = (now) => {
    raf = 0;
    if (!seen || document.hidden) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    ctx.clearRect(0, 0, W, H);
    if (id === 'newyear' && Math.random() < dt * 0.7) firework();
    const t = now / 1000;
    list = list.filter((p) => {
      if (p.spark) {
        p.vy += 30 * dt;
        p.vx *= 0.985;
        p.life -= dt * p.fade;
      } else {
        p.vx += Math.sin(t + p.a) * 6 * dt;
        p.a += p.va * dt;
        if (p.bat) p.vx = 70;
      }
      p.x += p.vx * dt;
      p.y += (p.bat ? Math.sin(t * 2 + p.r) * 12 : p.vy) * dt;
      if (p.life <= 0) return false;
      if (!p.spark && (p.y > H + 16 || p.y < -20 || p.x < -30 || p.x > W + 30)) Object.assign(p, make(false), p.bat ? { x: -20, y: rnd(10, H * 0.5) } : {});
      draw(p);
      return true;
    });
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (!raf && seen && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  };
  const io = new IntersectionObserver(([e]) => {
    seen = e.isIntersecting;
    start();
  });
  io.observe(host);
  const onVis = () => start();
  document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(() => resize());
  ro.observe(host);
  resize();
  cleanups.push(() => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    canvas.remove();
  });
}

function mount() {
  const id = root.getAttribute('data-season');
  if (!S || !id) return;
  chip(id);
  decorate(id);
  if (!reduced) for (const host of document.querySelectorAll('[data-season-fx]')) particles(id, host);
}

document.addEventListener('seasonchange', () => {
  while (cleanups.length) cleanups.pop()();
});
mount();

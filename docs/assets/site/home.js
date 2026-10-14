// Motion for the filefinch home page, in small vanilla JavaScript:
// pointer parallax and light on the hero object, a scroll driven flight of a
// file card from the laptop to the phone with a trail, sparks and a
// "Received" burst, and section reveals (six words typing in, the QR code
// assembling, a cut line that re-knits, a folder unfolding, numbers counting
// up, cards that glow under the pointer). Everything is skipped or reduced
// to its final state under prefers-reduced-motion.

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ramp = (p, a, b) => clamp((p - a) / (b - a));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---------- Hero: parallax layers and a light that follows the pointer ----------

function hero() {
  const hx = document.querySelector('[data-hero]');
  if (!hx || reduced || !finePointer) return;
  const layers = [...hx.querySelectorAll('.hx-l')].map((el) => ({ el, d: Number(el.dataset.depth) || 0 }));
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const tick = () => {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    for (const { el, d } of layers) el.style.transform = `translate(${(cx * d * 18).toFixed(2)}px, ${(cy * d * 14).toFixed(2)}px)`;
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(tick) : 0;
  };
  hx.addEventListener('pointermove', (e) => {
    const r = hx.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    hx.style.setProperty('--mx', `${e.clientX - r.left}px`);
    hx.style.setProperty('--my', `${e.clientY - r.top}px`);
    hx.classList.add('is-pointer');
    if (!raf) raf = requestAnimationFrame(tick);
  });
  hx.addEventListener('pointerleave', () => {
    tx = 0;
    ty = 0;
    hx.classList.remove('is-pointer');
    if (!raf) raf = requestAnimationFrame(tick);
  });
}

// ---------- Cards that glow where the pointer is ----------

function glowCards() {
  if (!finePointer) return;
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.glow-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--gx', `${e.clientX - r.left}px`);
    card.style.setProperty('--gy', `${e.clientY - r.top}px`);
  }, { passive: true });
}

// ---------- Reveals ----------

function typeWords(list) {
  const items = [...list.querySelectorAll('.ww')];
  if (reduced) {
    for (const w of items) w.closest('.wchip').classList.add('is-typed');
    return;
  }
  for (const w of items) w.textContent = '';
  let i = 0;
  const next = () => {
    if (i >= items.length) return;
    const el = items[i];
    const word = el.dataset.word || '';
    let k = 0;
    el.classList.add('is-caret');
    const step = () => {
      el.textContent = word.slice(0, ++k);
      if (k < word.length) setTimeout(step, 55 + Math.random() * 45);
      else {
        el.classList.remove('is-caret');
        el.closest('.wchip').classList.add('is-typed');
        i++;
        setTimeout(next, 160);
      }
    };
    setTimeout(step, 120);
  };
  next();
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
      const el = e.target;
      io.unobserve(el);
      el.classList.add('is-in');
      if (el.matches('[data-connect]')) {
        const list = el.querySelector('[data-type]');
        if (list) typeWords(list);
      }
      if (el.matches('[data-knit]') && !reduced) el.classList.add('is-play');
      if (el.matches('[data-count]')) countUp(el);
    }
  }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal], [data-connect], [data-knit], [data-unfold], [data-count]').forEach((el) => io.observe(el));
}

// ---------- Scroll driven flight ----------

function flight() {
  const stage = document.querySelector('[data-fly]');
  if (!stage) return;
  const section = stage.closest('.fly');
  const card = stage.querySelector('.fcard');
  const laptop = stage.querySelector('.fd-laptop');
  const phone = stage.querySelector('.fd-phone');
  const desktop = stage.querySelector('.fd-desktop');
  const svg = stage.querySelector('.fly-svg');
  const [base, side, glowPath, trail] = ['.fly-base', '.fly-side', '.fly-glow', '.fly-trail'].map((s) => svg.querySelector(s));
  const pct = stage.querySelector('.ring-pct');
  const speed = stage.querySelector('.fc-speed');
  const hashT = stage.querySelector('.fc-hash-t');
  const recv = stage.querySelector('.fd-recv');
  const sparks = stage.querySelector('.sparks');
  const burstBox = stage.querySelector('.burst');
  let geo = null;
  let fired = false;
  let lastSpark = 0;
  let visible = false;
  let raf = 0;

  const rel = (el) => {
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
  };

  function layout() {
    const s = stage.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${s.width} ${s.height}`);
    const l = rel(laptop), p = rel(phone), d = rel(desktop);
    const A = { x: l.x + l.w * 0.5, y: l.y + l.h * 0.45 };
    const B = { x: p.x + p.w * 0.5, y: p.y + p.h * 0.42 };
    const dx = B.x - A.x;
    let d1;
    if (s.height > s.width) {
      // Portrait stage: the laptop sits above the phone, so bow out to the right.
      d1 = `M${A.x} ${A.y} C${A.x + s.width * 0.55} ${A.y - s.height * 0.08} ${B.x + s.width * 0.05} ${B.y - s.height * 0.32} ${B.x} ${B.y}`;
    } else {
      const top = Math.min(A.y, B.y) - s.height * 0.42;
      d1 = `M${A.x} ${A.y} C${A.x + dx * 0.2} ${top} ${B.x - dx * 0.2} ${top} ${B.x} ${B.y}`;
    }
    for (const el of [base, glowPath, trail]) el.setAttribute('d', d1);
    side.setAttribute('d', `M${l.x + l.w * 0.82} ${l.y + l.h} Q${d.x + d.w * 0.2} ${l.y + l.h + s.height * 0.08} ${d.x + d.w * 0.5} ${d.y}`);
    const len = trail.getTotalLength();
    for (const el of [glowPath, trail]) el.style.strokeDasharray = `${len} ${len}`;
    geo = { A, B, len, cw: card.offsetWidth, ch: card.offsetHeight, sw: s.width, sh: s.height };
  }

  function burst() {
    if (reduced) return;
    const { B } = geo;
    const kinds = ['b-parcel', 'b-feather', 'b-spark'];
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      const r = 60 + Math.random() * 120;
      const el = document.createElement('span');
      el.className = 'bit';
      el.style.left = `${B.x}px`;
      el.style.top = `${B.y}px`;
      el.style.setProperty('--bx', `${Math.cos(a) * r}px`);
      el.style.setProperty('--by', `${Math.sin(a) * r}px`);
      el.style.setProperty('--br', `${(Math.random() - 0.5) * 540}deg`);
      el.style.animationDelay = `${Math.random() * 120}ms`;
      el.innerHTML = `<svg width="22" height="22" aria-hidden="true"><use href="#${kinds[i % 3]}"/></svg>`;
      burstBox.append(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }
  }

  function spark(x, y) {
    if (sparks.childElementCount > 40) return;
    const el = document.createElement('span');
    el.className = 'spark';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty('--sx', `${(Math.random() - 0.5) * 50}px`);
    el.style.setProperty('--sy', `${Math.random() * 40 + 6}px`);
    sparks.append(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  function render(p) {
    if (!geo) layout();
    const { A, len, cw, ch } = geo;
    const lift = ease(ramp(p, 0.04, 0.16));
    const t = ease(ramp(p, 0.16, 0.74));
    const land = ease(ramp(p, 0.72, 0.84));
    const prog = ramp(p, 0.1, 0.84);
    let x, y, rot = 0;
    if (t <= 0) {
      x = A.x;
      y = A.y - lift * 26;
    } else {
      const pt = trail.getPointAtLength(len * t);
      const pt2 = trail.getPointAtLength(Math.min(len, len * t + 2));
      x = pt.x;
      y = pt.y;
      rot = (Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180) / Math.PI * 0.12 * (1 - land);
    }
    const scale = (1 + lift * 0.06) * (1 - land * 0.5);
    const half = (cw * scale) / 2 + 6;
    const cxp = clamp(x, half, geo.sw - half);
    card.style.setProperty('--fx', `${(cxp - cw / 2).toFixed(1)}px`);
    card.style.setProperty('--fy', `${(y - ch / 2).toFixed(1)}px`);
    card.style.setProperty('--fs', scale.toFixed(3));
    card.style.setProperty('--fr', `${rot.toFixed(2)}deg`);
    card.style.opacity = String(1 - ramp(p, 0.84, 0.9));
    card.style.setProperty('--prog', prog.toFixed(3));
    for (const el of [glowPath, trail]) el.style.strokeDashoffset = String(len * (1 - t));
    stage.style.setProperty('--ring', prog.toFixed(3));
    pct.textContent = `${Math.round(prog * 100)}%`;
    const flying = prog > 0 && prog < 1;
    speed.textContent = flying ? `${(86 + Math.sin(p * 60) * 9 + Math.sin(p * 23) * 5).toFixed(1)} MB/s` : prog >= 1 ? '3.8 GB done' : '0.0 MB/s';
    const hashed = p > 0.86;
    stage.classList.toggle('is-hashed', hashed);
    hashT.textContent = hashed ? 'SHA-256 ok' : 'hashing';
    const done = p > 0.9;
    stage.classList.toggle('is-done', done);
    recv.textContent = done ? 'Received' : 'Receiving';
    if (done && !fired) {
      fired = true;
      burst();
    }
    if (p < 0.6) fired = false;
    const now = performance.now();
    if (!reduced && t > 0 && t < 1 && now - lastSpark > 45) {
      lastSpark = now;
      spark(x, y + ch * scale * 0.2);
    }
  }

  function progress() {
    const r = section.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span) : 1;
  }

  let last = -1;
  function loop() {
    raf = 0;
    if (!visible) return;
    const p = progress();
    if (Math.abs(p - last) > 0.0005) {
      last = p;
      render(p);
    }
    raf = requestAnimationFrame(loop);
  }

  if (reduced) {
    layout();
    render(1);
    window.addEventListener('resize', () => {
      layout();
      render(1);
    });
    return;
  }
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(loop);
  });
  io.observe(section);
  window.addEventListener('resize', () => {
    layout();
    last = -1;
  });
  layout();
  render(progress());
}

hero();
glowCards();
reveals();
flight();

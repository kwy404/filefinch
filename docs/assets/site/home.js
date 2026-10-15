// Motion for the filefinch home page, in small vanilla JavaScript: a light
// that follows the pointer on the hero, the looping PC and phone animation
// next to the headline, the "how it works" stepper that plays the same
// devices one step at a time, and section reveals (a cut line that re-knits,
// a folder unfolding, numbers counting up, cards that glow under the
// pointer). The animations only change a data-step attribute and CSS does
// the rest with transforms and opacity. Under prefers-reduced-motion nothing
// plays by itself and every scene shows its final state.

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

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
      if (el.matches('[data-knit]') && !reduced) el.classList.add('is-play');
      if (el.matches('[data-count]')) countUp(el);
    }
  }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal], [data-knit], [data-unfold], [data-count]').forEach((el) => io.observe(el));
}

// ---------- PC and phone animation ----------

/** A small burst of parcels, feathers and sparks over the PC screen. */
function burst(duo) {
  if (reduced) return;
  const box = duo.querySelector('.duo-burst');
  if (!box || box.childElementCount) return;
  const w = duo.clientWidth;
  const kinds = ['b-parcel', 'b-feather', 'b-spark'];
  for (let i = 0; i < 16; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
    const r = w * (0.07 + Math.random() * 0.12);
    const el = document.createElement('span');
    el.className = 'bit';
    el.style.left = '31%';
    el.style.top = '40%';
    el.style.setProperty('--bx', `${(Math.cos(a) * r).toFixed(1)}px`);
    el.style.setProperty('--by', `${(Math.sin(a) * r).toFixed(1)}px`);
    el.style.setProperty('--br', `${((Math.random() - 0.5) * 540).toFixed(0)}deg`);
    el.style.animationDelay = `${Math.round(Math.random() * 120)}ms`;
    el.innerHTML = `<svg aria-hidden="true"><use href="#${kinds[i % 3]}"/></svg>`;
    box.append(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }
}

/** Runs fn(true) while el is on screen and the tab is visible, fn(false) otherwise. */
function whenSeen(el, fn) {
  let seen = false;
  let on = false;
  const update = () => {
    const next = seen && !document.hidden;
    if (next !== on) {
      on = next;
      fn(on);
    }
  };
  new IntersectionObserver(([e]) => {
    seen = e.isIntersecting;
    update();
  }, { threshold: 0.2 }).observe(el);
  document.addEventListener('visibilitychange', update);
}

/** The hero: pair, confirm, send, receive, again. Starts from the finished frame. */
function heroLoop() {
  const duo = document.querySelector('.duo-loop');
  if (!duo || reduced) return;
  const SEQ = [['code', 2400], ['type', 3300], ['confirm', 2900], ['send', 2900], ['done', 2800]];
  let i = -1;
  let timer = 0;
  const next = () => {
    i = (i + 1) % SEQ.length;
    const [step, ms] = SEQ[i];
    duo.dataset.step = step;
    if (step === 'done') burst(duo);
    timer = setTimeout(next, ms);
  };
  whenSeen(duo, (on) => {
    duo.classList.toggle('is-paused', !on);
    clearTimeout(timer);
    if (on) timer = setTimeout(next, i < 0 ? 1400 : 600);
  });
}

/** "How it works": press a step to see it, or let the steps play in order. */
function stepper() {
  const root = document.querySelector('[data-hiw]');
  if (!root) return;
  const duo = root.querySelector('[data-duo]');
  const steps = [...root.querySelectorAll('.hiw-step')];
  const btn = root.querySelector('[data-play]');
  const label = btn?.querySelector('span');
  let i = 0;
  let playing = !reduced;
  let seen = false;
  let timer = 0;
  let sub = 0;

  const show = (n) => {
    i = n;
    clearTimeout(sub);
    steps.forEach((b, k) => (k === n ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
    const step = steps[n].dataset.go;
    duo.dataset.step = step;
    if (step === 'send') {
      sub = setTimeout(() => {
        duo.dataset.step = 'done';
        burst(duo);
      }, reduced ? 0 : 3000);
    }
  };
  const schedule = () => {
    clearTimeout(timer);
    const on = playing && seen;
    root.classList.toggle('is-playing', on);
    duo.classList.toggle('is-paused', !seen);
    if (!on) return;
    timer = setTimeout(() => {
      show((i + 1) % steps.length);
      schedule();
    }, parseInt(steps[i].style.getPropertyValue('--dur'), 10) || 3500);
  };
  const setPlaying = (v) => {
    playing = v;
    if (btn) {
      btn.classList.toggle('is-paused', !v);
      label.textContent = v ? 'Pause' : 'Play';
    }
    schedule();
  };

  steps.forEach((b, k) => b.addEventListener('click', () => {
    show(k);
    setPlaying(false);
  }));
  if (btn) {
    btn.hidden = false;
    btn.addEventListener('click', () => {
      if (!playing && i === steps.length - 1) show(0);
      setPlaying(!playing);
    });
  }
  whenSeen(root, (on) => {
    seen = on;
    schedule();
  });
  setPlaying(playing);
}

hero();
glowCards();
reveals();
heroLoop();
stepper();

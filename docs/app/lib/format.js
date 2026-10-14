// Generated from src/format.js by scripts/build-app.mjs. Edit the source, not this copy.
// Human readable sizes, speeds and times, plus a smoothed speed meter for progress and ETA.

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

/** 1536 becomes "1.5 KB". Uses 1024 steps, like file managers on most systems. */
export function formatBytes(n, locale) {
  if (!Number.isFinite(n) || n < 0) return '0 B';
  let i = 0;
  let v = n;
  while (v >= 1024 && i < UNITS.length - 1) {
    v /= 1024;
    i++;
  }
  const digits = i === 0 || v >= 100 ? 0 : v >= 10 ? 1 : 2;
  return `${v.toLocaleString(locale, { maximumFractionDigits: digits, minimumFractionDigits: 0 })} ${UNITS[i]}`;
}

export const formatSpeed = (bytesPerSecond, locale) => `${formatBytes(bytesPerSecond, locale)}/s`;

/** Seconds as "45 s", "3 min 05 s" or "2 h 10 min". */
export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  const s = Math.round(seconds);
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
  return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')} min`;
}

/**
 * Speed from a sliding window of samples, so a short stall does not swing the ETA wildly.
 * Call add(totalBytesSoFar) whenever progress changes.
 */
export class SpeedMeter {
  constructor(windowMs = 4000, now = () => Date.now()) {
    this.windowMs = windowMs;
    this.now = now;
    this.samples = [];
  }
  reset() {
    this.samples = [];
  }
  add(total) {
    const t = this.now();
    this.samples.push([t, total]);
    while (this.samples.length > 2 && t - this.samples[0][0] > this.windowMs) this.samples.shift();
  }
  /** Bytes per second, 0 until there is enough data. */
  get speed() {
    if (this.samples.length < 2) return 0;
    const [t0, b0] = this.samples[0];
    const [t1, b1] = this.samples[this.samples.length - 1];
    if (t1 - t0 < 250) return 0;
    return Math.max(0, ((b1 - b0) * 1000) / (t1 - t0));
  }
  /** Seconds left for `remaining` bytes, or Infinity when unknown. */
  eta(remaining) {
    const v = this.speed;
    return v > 0 ? remaining / v : Infinity;
  }
}

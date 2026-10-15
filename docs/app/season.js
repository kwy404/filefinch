// Special dates in the app: ../assets/site/seasons.js (shared with the website) runs in the head
// and sets data-season on <html>. This module shows Finn in costume on the start screen and a
// "Turn off" button. Turning it off uses the same localStorage key as the site, so it stays off
// on both until next year, and a change made in another tab applies here too.

import { $, button, el } from './ui.js';
import { getLang, t } from './i18n.js';

const seasons = () => globalThis.FFSeasons ?? null;
const PREFIX = 'filefinch:season-off:';

export function initSeason() {
  renderSeason();
  document.addEventListener('seasonchange', renderSeason);
  window.addEventListener('storage', (e) => {
    if (e.key === null || e.key.startsWith(PREFIX)) {
      seasons()?.apply();
      renderSeason();
    }
  });
}

/** Draws or clears Finn and the note for the current season. Called again on a language change. */
export function renderSeason() {
  const slot = $('#season-finn');
  const note = $('#season-note');
  const id = document.documentElement.getAttribute('data-season');
  const S = seasons();
  if (!id || !S || !S.IDS.includes(id)) {
    slot.hidden = true;
    note.hidden = true;
    slot.replaceChildren();
    note.replaceChildren();
    return;
  }
  const name = S.label(id, getLang());
  const alt = t('season.finn', { name });
  const base = `../assets/seasons/${id}/`;
  if (slot.dataset.season !== id) {
    slot.replaceChildren(
      el('img.ff-season-light', { src: `${base}finn.svg`, alt, width: 420, height: 420, decoding: 'async' }),
      el('img.ff-season-dark', { src: `${base}finn-dark.svg`, alt, width: 420, height: 420, decoding: 'async' }),
    );
    slot.dataset.season = id;
  } else for (const img of slot.querySelectorAll('img')) img.alt = alt;
  note.replaceChildren(el('span', { text: t('season.note', { name }) }), button(t('season.off'), 'x', () => S.off(), 'btn-ghost btn-xs', { 'aria-label': t('season.off.label', { name }) }));
  slot.hidden = false;
  note.hidden = false;
}

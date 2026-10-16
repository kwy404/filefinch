// Six word inputs with autocomplete from the BIP39 list, paste of a whole phrase into any box,
// first four letters accepted, single typos fixed, and a clear state per word.

import { el } from './ui.js';
import { t } from './i18n.js';
import { WORDLIST } from './lib/wordlist.js';
import { WORD_COUNT, normalizeWord, resolvePhrase, resolveWord, splitPhrase, suggestWords } from './lib/words.js';

let listMade = false;

function ensureDatalist() {
  if (listMade) return;
  listMade = true;
  const list = el('datalist', { id: 'bip39-words' });
  list.append(...WORDLIST.map((w) => el('option', { value: w })));
  document.body.append(list);
}

/**
 * Builds the inputs inside container. onReady(words) runs when all six resolve and the person
 * presses Enter or finishes the last word. Returns { values, reset, focus, setError }.
 */
export function wordInputs(container, { idPrefix, onReady, onChange, auto = false } = {}) {
  ensureDatalist();
  const inputs = [];
  const hints = [];
  const grid = el('div.ff-words-input');
  for (let i = 0; i < WORD_COUNT; i++) {
    const id = `${idPrefix}-${i}`;
    const input = el('input.input.ff-word-field', {
      id,
      type: 'text',
      list: 'bip39-words',
      autocomplete: 'off',
      autocapitalize: 'none',
      spellcheck: 'false',
      enterkeyhint: i === WORD_COUNT - 1 ? 'go' : 'next',
      'aria-describedby': `${id}-hint`,
    });
    const hint = el('span.ff-word-hint', { id: `${id}-hint`, 'aria-live': 'polite' });
    const label = el('label.ff-word-label', { for: id }, el('span.ff-word-n', { text: String(i + 1) }), el('span.sr-only', { text: t('words.n', { n: i + 1 }) }));
    grid.append(el('div.ff-word-cell', {}, label, input, hint));
    inputs.push(input);
    hints.push(hint);

    input.addEventListener('paste', (e) => {
      if (spread(i, e.clipboardData?.getData('text') ?? '')) e.preventDefault();
    });
    input.addEventListener('input', (e) => {
      // Phone keyboards often insert clipboard text without a paste event.
      if (/[^A-Za-zÀ-ɏ]/.test(input.value.trim()) && spread(i, input.value)) return;
      update();
      if (e.inputType && !e.inputType.startsWith('insert')) return;
      // Move on when a whole word is in the box (typed or picked from the list) and no longer
      // word starts with it. Otherwise Space, Enter or Tab moves on.
      const raw = normalizeWord(input.value);
      const r = resolveWord(raw);
      if (!r || r.how !== 'exact' || (raw.length < 4 && suggestWords(raw, 2).length !== 1)) return;
      if (i < WORD_COUNT - 1) inputs[i + 1].focus();
      else if (auto) maybeReady(true);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (i < WORD_COUNT - 1) inputs[i + 1].focus();
        maybeReady(true);
      } else if (e.key === ' ' && input.value.trim() && i < WORD_COUNT - 1) {
        e.preventDefault();
        inputs[i + 1].focus();
      } else if (e.key === 'Backspace' && !input.value && i > 0) {
        inputs[i - 1].focus();
      }
    });
    input.addEventListener('blur', () => {
      const r = resolveWord(input.value);
      if (r && r.how !== 'exact') input.value = r.word;
      update();
    });
  }
  container.replaceChildren(grid);

  // Puts a pasted phrase, invite text or link into the boxes, one word per box, starting at
  // the first box for a whole phrase. Returns false when the text holds a single word.
  function spread(i, text) {
    let parts = splitPhrase(text);
    if (parts.length < 2) return false;
    if (parts.length > WORD_COUNT) {
      const known = parts.filter((p) => resolveWord(p)?.how === 'exact');
      if (known.length >= WORD_COUNT) parts = known.slice(-WORD_COUNT);
    }
    const start = parts.length >= WORD_COUNT ? 0 : i;
    inputs[i].value = '';
    parts.slice(0, WORD_COUNT - start).forEach((p, k) => (inputs[start + k].value = p));
    update();
    (inputs.find((x) => !resolveWord(x.value)) ?? inputs[WORD_COUNT - 1]).focus();
    if (auto) maybeReady(true);
    return true;
  }

  function update() {
    let ok = 0;
    inputs.forEach((input, i) => {
      const raw = input.value.trim();
      const r = resolveWord(raw);
      const cell = input.parentElement;
      cell.classList.toggle('is-ok', !!r);
      cell.classList.toggle('is-bad', !!raw && !r && raw.length >= 3);
      hints[i].textContent = r && r.how !== 'exact' ? r.word : raw && !r && raw.length >= 3 ? t('words.unknown') : '';
      if (r) ok++;
    });
    grid.classList.remove('is-wrong');
    onChange?.(ok);
    return ok;
  }

  function maybeReady(force = false) {
    const res = resolvePhrase(inputs.map((x) => x.value));
    if (res.ok && (force || document.activeElement === inputs[WORD_COUNT - 1] || !inputs.includes(document.activeElement))) onReady?.(res.words);
    return res;
  }

  return {
    inputs,
    values: () => resolvePhrase(inputs.map((x) => x.value)),
    fill(words) {
      words.slice(0, WORD_COUNT).forEach((w, i) => (inputs[i].value = w));
      update();
    },
    reset() {
      for (const x of inputs) x.value = '';
      update();
    },
    focus: () => inputs[0].focus(),
    setError() {
      grid.classList.add('is-wrong');
    },
  };
}

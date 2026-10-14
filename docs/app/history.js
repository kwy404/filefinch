// Past transfers, kept in IndexedDB in this browser. Only names, sizes and results: no contents.

import { dbAll, dbClear, dbPut } from './db.js';
import { transferProgress } from './lib/transfer.js';

const MAX = 500;

export async function recordTransfer(t, peerName) {
  const { total } = transferProgress(t);
  const started = t.startedAt ?? t.created;
  const finished = t.finished ?? Date.now();
  const seconds = Math.max(0.001, (finished - started) / 1000);
  const entry = {
    id: `${t.dir}-${t.id}`,
    dir: t.dir,
    kind: t.kind,
    label: t.label,
    peer: peerName || '',
    files: t.files.filter((f) => f.state !== 'skipped').length,
    bytes: total,
    state: t.state === 'failed' ? 'failed' : t.state,
    failed: t.failed ?? 0,
    started,
    finished,
    speed: t.state === 'done' ? total / seconds : 0,
  };
  try {
    await dbPut('history', entry);
    const all = await dbAll('history');
    if (all.length > MAX) {
      const { dbDelete } = await import('./db.js');
      for (const old of all.sort((a, b) => a.finished - b.finished).slice(0, all.length - MAX)) await dbDelete('history', old.id);
    }
  } catch {}
  return entry;
}

export async function listHistory() {
  try {
    return (await dbAll('history')).sort((a, b) => b.finished - a.finished);
  } catch {
    return [];
  }
}

export const clearHistory = () => dbClear('history');

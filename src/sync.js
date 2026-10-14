// Folder sync between two of your devices. Each side lists its folder as a manifest of
// { path, size, mtime, hash }. A three way comparison against the state recorded after the last
// sync (the base) tells which side changed what, so only changed files move and edits made on
// both sides become conflicts instead of silent overwrites.

import { conflictPath } from './paths.js';

export const MODES = ['two-way', 'push', 'pull'];
export const CHOICES = ['local', 'remote', 'both', 'newer', 'skip'];

const toMap = (entries) => {
  const map = new Map();
  for (const e of entries ?? []) map.set(e.path, e);
  return map;
};

const hashOf = (e) => (e ? e.hash ?? `${e.size}:${e.mtime}` : undefined);

/**
 * local, remote: manifest arrays. base: { [path]: { local, remote } } hashes from the last sync.
 * options: { mode: 'two-way' | 'push' | 'pull', deletions: boolean, conflict: 'ask' | choice, label }
 * Returns a plan: { push, pull, deleteLocal, deleteRemote, conflicts, unchanged, kept }.
 * push and pull items are { path, as }: the file at `path` is copied to `as` on the other side.
 */
export function diffManifests(local, remote, base = {}, options = {}) {
  const { mode = 'two-way', deletions = false, conflict = 'ask' } = options;
  if (!MODES.includes(mode)) throw new Error(`Unknown sync mode ${mode}`);
  const L = toMap(local);
  const R = toMap(remote);
  const plan = { push: [], pull: [], deleteLocal: [], deleteRemote: [], conflicts: [], unchanged: 0, kept: [] };
  const paths = [...new Set([...L.keys(), ...R.keys()])].sort();

  for (const path of paths) {
    const l = L.get(path);
    const r = R.get(path);
    const b = base[path];
    if (l && r && hashOf(l) === hashOf(r)) {
      plan.unchanged++;
      continue;
    }
    if (mode === 'push') {
      if (l) plan.push.push({ path, as: path });
      else if (deletions) plan.deleteRemote.push(path);
      else plan.kept.push({ path, side: 'remote' });
      continue;
    }
    if (mode === 'pull') {
      if (r) plan.pull.push({ path, as: path });
      else if (deletions) plan.deleteLocal.push(path);
      else plan.kept.push({ path, side: 'local' });
      continue;
    }
    const lChanged = hashOf(l) !== b?.local;
    const rChanged = hashOf(r) !== b?.remote;
    if (!lChanged && !rChanged) {
      plan.unchanged++;
      continue;
    }
    if (lChanged && !rChanged) {
      if (l) plan.push.push({ path, as: path });
      else if (deletions) plan.deleteRemote.push(path);
      else plan.kept.push({ path, side: 'remote' });
      continue;
    }
    if (rChanged && !lChanged) {
      if (r) plan.pull.push({ path, as: path });
      else if (deletions) plan.deleteLocal.push(path);
      else plan.kept.push({ path, side: 'local' });
      continue;
    }
    if (!l && !r) continue;
    const reason = !b ? 'both-new' : !l ? 'deleted-here' : !r ? 'deleted-there' : 'both-changed';
    plan.conflicts.push({ path, local: l ?? null, remote: r ?? null, reason });
  }

  if (conflict !== 'ask') {
    const choices = Object.fromEntries(plan.conflicts.map((c) => [c.path, conflict]));
    return resolveConflicts(plan, choices, options);
  }
  return plan;
}

/**
 * Applies a choice to each conflict: 'local' (this device wins), 'remote' (the other device
 * wins), 'both' (keep both, the other version arrives as a conflict copy), 'newer' (latest
 * modification time wins) or 'skip'. Conflicts without a choice stay in plan.conflicts.
 */
export function resolveConflicts(plan, choices, options = {}) {
  const label = options.label ?? new Date().toISOString().slice(0, 10);
  const taken = new Set([...plan.push.map((p) => p.as), ...plan.pull.map((p) => p.as)]);
  for (const list of [options.localPaths, options.remotePaths]) for (const p of list ?? []) taken.add(p);
  const out = { ...plan, push: [...plan.push], pull: [...plan.pull], deleteLocal: [...plan.deleteLocal], deleteRemote: [...plan.deleteRemote], conflicts: [], skipped: [...(plan.skipped ?? [])] };
  for (const c of plan.conflicts) {
    let choice = choices[c.path];
    if (!choice) {
      out.conflicts.push(c);
      continue;
    }
    if (!CHOICES.includes(choice)) throw new Error(`Unknown conflict choice ${choice}`);
    if (choice === 'newer') {
      const lt = c.local?.mtime ?? -1;
      const rt = c.remote?.mtime ?? -1;
      choice = rt > lt ? 'remote' : 'local';
    }
    if (choice === 'skip') {
      out.skipped.push(c.path);
    } else if (choice === 'local') {
      if (c.local) out.push.push({ path: c.path, as: c.path });
      else out.deleteRemote.push(c.path);
    } else if (choice === 'remote') {
      if (c.remote) out.pull.push({ path: c.path, as: c.path });
      else out.deleteLocal.push(c.path);
    } else {
      // keep both
      if (c.local && c.remote) {
        let copy = conflictPath(c.path, label);
        for (let i = 2; taken.has(copy); i++) copy = conflictPath(c.path, `${label} ${i}`);
        taken.add(copy);
        out.push.push({ path: c.path, as: copy });
        out.pull.push({ path: c.path, as: copy });
      } else if (c.local) {
        out.push.push({ path: c.path, as: c.path });
      } else if (c.remote) {
        out.pull.push({ path: c.path, as: c.path });
      }
    }
  }
  return out;
}

/** Counts for a summary line. */
export function planSummary(plan) {
  return {
    push: plan.push.length,
    pull: plan.pull.length,
    deletes: plan.deleteLocal.length + plan.deleteRemote.length,
    conflicts: plan.conflicts.length,
    unchanged: plan.unchanged,
    kept: (plan.kept ?? []).length,
  };
}

/**
 * The base to store after a sync: the state both folders are now in. Paths whose transfer failed
 * keep their previous base entry so the next sync tries them again.
 */
export function nextBase(local, remote, plan, previous = {}, failed = new Set()) {
  const L = new Map([...toMap(local)].map(([p, e]) => [p, hashOf(e)]));
  const R = new Map([...toMap(remote)].map(([p, e]) => [p, hashOf(e)]));
  const srcL = new Map(L);
  const srcR = new Map(R);
  for (const { path, as } of plan.push) if (!failed.has(as)) R.set(as, srcL.get(path));
  for (const { path, as } of plan.pull) if (!failed.has(as)) L.set(as, srcR.get(path));
  for (const p of plan.deleteLocal) if (!failed.has(p)) L.delete(p);
  for (const p of plan.deleteRemote) if (!failed.has(p)) R.delete(p);
  const base = {};
  for (const p of new Set([...L.keys(), ...R.keys()])) {
    if (failed.has(p) || (plan.conflicts ?? []).some((c) => c.path === p)) {
      if (previous[p]) base[p] = previous[p];
      continue;
    }
    base[p] = { local: L.get(p), remote: R.get(p) };
  }
  return base;
}

/** The same base seen from the other device. */
export function flipBase(base) {
  const out = {};
  for (const [p, v] of Object.entries(base ?? {})) out[p] = { local: v.remote, remote: v.local };
  return out;
}

/** The plan as the other device sees it: pushes become pulls and local becomes remote. */
export function flipPlan(plan) {
  return {
    push: plan.pull.map((x) => ({ ...x })),
    pull: plan.push.map((x) => ({ ...x })),
    deleteLocal: [...plan.deleteRemote],
    deleteRemote: [...plan.deleteLocal],
    conflicts: plan.conflicts.map((c) => ({ ...c, local: c.remote, remote: c.local })),
    unchanged: plan.unchanged,
    kept: (plan.kept ?? []).map((k) => ({ ...k, side: k.side === 'local' ? 'remote' : 'local' })),
    skipped: [...(plan.skipped ?? [])],
  };
}

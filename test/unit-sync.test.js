import { describe, expect, it } from 'vitest';
import { commonRoot, conflictPath, sanitizePath, safePath, splitExt, uniqueName } from '../src/paths.js';
import { diffManifests, flipBase, flipPlan, nextBase, planSummary, resolveConflicts } from '../src/sync.js';

const e = (path, hash, mtime = 1000, size = 10) => ({ path, size, mtime, hash: hash.padEnd(64, '0') });
const h = (x) => x.padEnd(64, '0');

describe('diffManifests', () => {
  it('first sync: copies what only one side has and flags different files with the same name', () => {
    const local = [e('a.txt', 'a1'), e('both.txt', 'b1'), e('same.txt', 's1')];
    const remote = [e('r.txt', 'r1'), e('both.txt', 'b2'), e('same.txt', 's1')];
    const plan = diffManifests(local, remote);
    expect(plan.push).toEqual([{ path: 'a.txt', as: 'a.txt' }]);
    expect(plan.pull).toEqual([{ path: 'r.txt', as: 'r.txt' }]);
    expect(plan.unchanged).toBe(1);
    expect(plan.conflicts.map((c) => [c.path, c.reason])).toEqual([['both.txt', 'both-new']]);
  });

  it('sends only what changed since the last sync', () => {
    const base = {
      'a.txt': { local: h('a1'), remote: h('a1') },
      'b.txt': { local: h('b1'), remote: h('b1') },
      'c.txt': { local: h('c1'), remote: h('c1') },
    };
    const local = [e('a.txt', 'a2'), e('b.txt', 'b1'), e('c.txt', 'c1')];
    const remote = [e('a.txt', 'a1'), e('b.txt', 'b2'), e('c.txt', 'c1')];
    const plan = diffManifests(local, remote, base);
    expect(plan.push).toEqual([{ path: 'a.txt', as: 'a.txt' }]);
    expect(plan.pull).toEqual([{ path: 'b.txt', as: 'b.txt' }]);
    expect(plan.conflicts).toEqual([]);
    expect(plan.unchanged).toBe(1);
  });

  it('detects edits on both sides and edit against delete', () => {
    const base = {
      'x.txt': { local: h('x1'), remote: h('x1') },
      'y.txt': { local: h('y1'), remote: h('y1') },
      'z.txt': { local: h('z1'), remote: h('z1') },
    };
    const local = [e('x.txt', 'x2'), e('z.txt', 'z2')];
    const remote = [e('x.txt', 'x3'), e('y.txt', 'y2')];
    const plan = diffManifests(local, remote, base);
    expect(plan.conflicts.map((c) => [c.path, c.reason])).toEqual([
      ['x.txt', 'both-changed'],
      ['y.txt', 'deleted-here'],
      ['z.txt', 'deleted-there'],
    ]);
  });

  it('treats both sides making the same change as unchanged', () => {
    const base = { 'x.txt': { local: h('x1'), remote: h('x1') } };
    expect(diffManifests([e('x.txt', 'x2')], [e('x.txt', 'x2')], base).unchanged).toBe(1);
  });

  it('propagates deletions only when asked to', () => {
    const base = { 'gone.txt': { local: h('g'), remote: h('g') }, 'rgone.txt': { local: h('r'), remote: h('r') } };
    const local = [e('rgone.txt', 'r')];
    const remote = [e('gone.txt', 'g')];
    const keep = diffManifests(local, remote, base);
    expect(keep.deleteRemote).toEqual([]);
    expect(keep.deleteLocal).toEqual([]);
    expect(keep.kept).toEqual([
      { path: 'gone.txt', side: 'remote' },
      { path: 'rgone.txt', side: 'local' },
    ]);
    const mirror = diffManifests(local, remote, base, { deletions: true });
    expect(mirror.deleteRemote).toEqual(['gone.txt']);
    expect(mirror.deleteLocal).toEqual(['rgone.txt']);
    // A file both sides deleted needs nothing.
    expect(diffManifests([], [], { 'old.txt': { local: h('o'), remote: h('o') } })).toMatchObject({ push: [], pull: [], conflicts: [] });
  });

  it('push and pull modes make one side a mirror of the other', () => {
    const local = [e('a.txt', 'a1'), e('same.txt', 's')];
    const remote = [e('b.txt', 'b1'), e('same.txt', 's')];
    expect(diffManifests(local, remote, {}, { mode: 'push' })).toMatchObject({ push: [{ path: 'a.txt', as: 'a.txt' }], pull: [], kept: [{ path: 'b.txt', side: 'remote' }] });
    expect(diffManifests(local, remote, {}, { mode: 'push', deletions: true }).deleteRemote).toEqual(['b.txt']);
    expect(diffManifests(local, remote, {}, { mode: 'pull' })).toMatchObject({ pull: [{ path: 'b.txt', as: 'b.txt' }], push: [] });
    expect(diffManifests(local, remote, {}, { mode: 'pull', deletions: true }).deleteLocal).toEqual(['a.txt']);
    expect(() => diffManifests([], [], {}, { mode: 'sideways' })).toThrow();
  });

  it('falls back to size and time when a hash is missing', () => {
    const local = [{ path: 'a', size: 1, mtime: 5, hash: null }];
    const remote = [{ path: 'a', size: 1, mtime: 5, hash: null }];
    expect(diffManifests(local, remote).unchanged).toBe(1);
  });
});

describe('conflict resolution', () => {
  const base = { 'x.txt': { local: h('x1'), remote: h('x1') }, 'y.txt': { local: h('y1'), remote: h('y1') } };
  const local = [e('x.txt', 'x2', 5000), { ...e('notes/y.txt', 'n'), path: 'notes/y.txt' }];
  const remote = [e('x.txt', 'x3', 9000), e('y.txt', 'y2')];

  it('keeps the plan open when asked, then applies choices', () => {
    const plan = diffManifests(local, remote, base);
    expect(plan.conflicts.length).toBe(2);
    const resolved = resolveConflicts(plan, { 'x.txt': 'local' });
    expect(resolved.push).toContainEqual({ path: 'x.txt', as: 'x.txt' });
    expect(resolved.conflicts.map((c) => c.path)).toEqual(['y.txt']);
  });

  it('newer picks the latest modification time', () => {
    const plan = diffManifests(local, remote, base, { conflict: 'newer' });
    expect(plan.pull).toContainEqual({ path: 'x.txt', as: 'x.txt' });
    expect(plan.pull).toContainEqual({ path: 'y.txt', as: 'y.txt' });
    expect(plan.conflicts).toEqual([]);
  });

  it('keep both swaps the versions as conflict copies so no edit is lost', () => {
    const plan = diffManifests(local, remote, base, { conflict: 'both', label: '2026-10-14' });
    expect(plan.push).toContainEqual({ path: 'x.txt', as: 'x (conflict 2026-10-14).txt' });
    expect(plan.pull).toContainEqual({ path: 'x.txt', as: 'x (conflict 2026-10-14).txt' });
    // edit against delete: the edited file is restored on the side that deleted it
    expect(plan.pull).toContainEqual({ path: 'y.txt', as: 'y.txt' });
  });

  it('avoids reusing a conflict copy name that already exists', () => {
    const plan = diffManifests([e('x.txt', 'a')], [e('x.txt', 'b')], {}, { conflict: 'both', label: 'L', localPaths: ['x (conflict L).txt'] });
    expect(plan.push[0].as).toBe('x (conflict L 2).txt');
  });

  it('remote and skip choices, and unknown choices', () => {
    const plan = diffManifests(local, remote, base);
    const r = resolveConflicts(plan, { 'x.txt': 'remote', 'y.txt': 'skip' });
    expect(r.pull).toContainEqual({ path: 'x.txt', as: 'x.txt' });
    expect(r.skipped).toEqual(['y.txt']);
    const del = resolveConflicts(diffManifests([], [e('z', 'z2')], { z: { local: h('z1'), remote: h('z1') } }), { z: 'local' });
    expect(del.deleteRemote).toEqual(['z']);
    expect(() => resolveConflicts(plan, { 'x.txt': 'magic' })).toThrow();
  });
});

describe('sync base', () => {
  it('records the state after a sync so the next comparison is clean', () => {
    const local = [e('a.txt', 'a1'), e('both.txt', 'b1', 1)];
    const remote = [e('r.txt', 'r1'), e('both.txt', 'b2', 2)];
    const plan = diffManifests(local, remote, {}, { conflict: 'both', label: 'L' });
    const base = nextBase(local, remote, plan);
    // Simulate the folders after the sync ran.
    const local2 = [e('a.txt', 'a1'), e('both.txt', 'b1', 1), e('r.txt', 'r1'), e('both (conflict L).txt', 'b2')];
    const remote2 = [e('r.txt', 'r1'), e('both.txt', 'b2', 2), e('a.txt', 'a1'), e('both (conflict L).txt', 'b1')];
    const again = diffManifests(local2, remote2, base);
    expect(again).toMatchObject({ push: [], pull: [], conflicts: [], deleteLocal: [], deleteRemote: [] });
    // The other device sees the same base mirrored.
    const theirs = diffManifests(remote2, local2, flipBase(base));
    expect(theirs).toMatchObject({ push: [], pull: [], conflicts: [] });
  });

  it('keeps the old base for failed copies so they are tried again', () => {
    const prev = { 'a.txt': { local: h('a0'), remote: h('a0') } };
    const local = [e('a.txt', 'a1')];
    const remote = [e('a.txt', 'a0')];
    const plan = diffManifests(local, remote, prev);
    const base = nextBase(local, remote, plan, prev, new Set(['a.txt']));
    expect(base['a.txt']).toEqual(prev['a.txt']);
    expect(diffManifests(local, remote, base).push).toEqual([{ path: 'a.txt', as: 'a.txt' }]);
  });

  it('applies deletions to the base', () => {
    const prev = { 'old.txt': { local: h('o'), remote: h('o') } };
    const plan = diffManifests([], [e('old.txt', 'o')], prev, { deletions: true });
    const base = nextBase([], [e('old.txt', 'o')], plan, prev);
    expect(base['old.txt']).toBeUndefined();
  });

  it('flips a plan for the other device and summarizes it', () => {
    const plan = diffManifests([e('a', 'a')], [e('b', 'b'), e('c', 'c')], {});
    const flipped = flipPlan(plan);
    expect(flipped.push).toEqual(plan.pull);
    expect(flipped.pull).toEqual(plan.push);
    expect(planSummary(plan)).toEqual({ push: 1, pull: 2, deletes: 0, conflicts: 0, unchanged: 0, kept: 0 });
  });
});

describe('paths from the other device', () => {
  it('cannot escape the target folder', () => {
    expect(sanitizePath('../../etc/passwd')).toEqual(['etc', 'passwd']);
    expect(sanitizePath('/abs/./x/../y')).toEqual(['abs', 'x', 'y']);
    expect(sanitizePath('a\\b\\c.txt')).toEqual(['a', 'b', 'c.txt']);
    expect(sanitizePath('')).toEqual(['file']);
    expect(sanitizePath('../..')).toEqual(['file']);
  });

  it('cleans names Windows, macOS and Linux all accept', () => {
    expect(safePath('C:\\con\\aux.txt')).toBe('C_/_con/_aux.txt');
    expect(safePath('what?.txt')).toBe('what_.txt');
    expect(safePath('trailing. ')).toBe('trailing');
    expect(safePath('bell\u0007name\u202e.txt')).toBe('bellname.txt');
    expect(safePath('x'.repeat(300) + '.txt').length).toBe(200);
    expect(safePath('cafe\u0301.txt')).toBe('caf\u00e9.txt');
  });

  it('builds unique names, extensions and conflict names', () => {
    const taken = new Set(['a.txt', 'a (1).txt']);
    expect(uniqueName('a.txt', (n) => taken.has(n))).toBe('a (2).txt');
    expect(uniqueName('b.txt', (n) => taken.has(n))).toBe('b.txt');
    expect(splitExt('archive.tar.gz')).toEqual({ base: 'archive.tar', ext: '.gz' });
    expect(splitExt('.bashrc')).toEqual({ base: '.bashrc', ext: '' });
    expect(splitExt('noext')).toEqual({ base: 'noext', ext: '' });
    expect(conflictPath('docs/plan.md', '2026-10-14 phone')).toBe('docs/plan (conflict 2026-10-14 phone).md');
    expect(commonRoot(['Photos/a.jpg', 'Photos/b/c.jpg'])).toBe('Photos');
    expect(commonRoot(['Photos/a.jpg', 'b.jpg'])).toBe('');
    expect(commonRoot([])).toBe('');
  });
});

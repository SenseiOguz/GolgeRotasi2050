import { expect, test, vi } from 'vitest';
import { LEVELS, getLevel } from '../../src/core/levels';
import { createLevelManager, LevelManager, PROGRESS_KEY, type StorageLike } from '../../src/core/levelManager';

const template = getLevel('yogun-mahalle') ?? LEVELS[0];
const levels = ['1', '2', '3', '4'].map(id => ({ ...template, id }));
class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}
test('first run and lookup API are safe and snapshots are independent', () => {
  const manager = new LevelManager(levels);
  expect(levels.map(l => manager.isUnlocked(l.id))).toEqual([true, false, false, false]);
  expect(manager.index('2')).toBe(1);
  expect(manager.index('missing')).toBe(-1);
  expect(manager.nextId('missing')).toBeNull();
  expect(manager.nextId('4')).toBeNull();
  expect(manager.record('1')).toBeNull();
  manager.levels()[0].id = 'changed';
  expect(manager.index('1')).toBe(0);
  expect(new LevelManager([]).levels()).toEqual([]);
});
test('success unlocks the full chain and pending unlock is consumed once across reloads', () => {
  const storage = new MemoryStorage();
  let manager = new LevelManager(levels, storage);
  expect(manager.recordResult('2', true, 3, 5).newlyUnlocked).toBeNull();
  expect(manager.recordResult('1', false, 0, 996).newlyUnlocked).toBeNull();
  expect(manager.isCompleted('1')).toBe(false);
  for (let i = 0; i < levels.length; i++) {
    const id = levels[i].id, next = levels[i + 1]?.id ?? null;
    expect(manager.recordResult(id, true, 2, 700).newlyUnlocked).toBe(next);
    manager = new LevelManager(levels, storage);
    expect(manager.consumePendingUnlock()).toBe(next);
    expect(new LevelManager(levels, storage).consumePendingUnlock()).toBeNull();
    expect(manager.isCompleted(id)).toBe(true);
  }
  expect(levels.every(l => manager.isUnlocked(l.id))).toBe(true);
});
test('replay keeps independent best stars and lowest successful load', () => {
  const storage = new MemoryStorage(), manager = new LevelManager(levels, storage);
  manager.recordResult('1', true, 3, 702);
  expect(manager.recordResult('1', true, 1, 710).newlyUnlocked).toBeNull();
  manager.recordResult('1', true, 2, 690);
  manager.recordResult('1', false, 0, 600);
  const record = manager.record('1')!;
  expect(record).toEqual({ stars: 3, bestLoad: 690 });
  record.bestLoad = 0;
  expect(new LevelManager(levels, storage).record('1')?.bestLoad).toBe(690);
  manager.setLastPlayed('2');
  expect(JSON.parse(storage.getItem(PROGRESS_KEY)!).lastPlayed).toBe('2');
  manager.setLastPlayed('4');
  expect(JSON.parse(storage.getItem(PROGRESS_KEY)!).lastPlayed).toBe('2');
  manager.reset();
  expect(manager.isUnlocked('2')).toBe(false);
  expect(manager.record('1')).toBeNull();
  expect(manager.consumePendingUnlock()).toBeNull();
});
test.each(['{', 'null', '{}', '{"version":0}', '{"version":1,"unlocked":["4"],"completed":{},"pendingUnlock":null,"lastPlayed":null}',
  '{"version":1,"unlocked":["1"],"completed":{"1":{"stars":9,"bestLoad":2}},"pendingUnlock":null,"lastPlayed":null}'])('corrupt or old progress resets safely: %s', raw => {
  const storage = new MemoryStorage(); storage.setItem(PROGRESS_KEY, raw);
  const manager = new LevelManager(levels, storage);
  expect(levels.map(l => manager.isUnlocked(l.id))).toEqual([true, false, false, false]);
});
test('unavailable storage never prevents in-memory play', () => {
  const storage: StorageLike = { getItem() { throw Error('denied'); }, setItem() { throw Error('quota'); } };
  const manager = new LevelManager(levels, storage);
  expect(() => { manager.recordResult('1', true, 3, 700); manager.consumePendingUnlock(); manager.reset(); }).not.toThrow();
  vi.stubGlobal('localStorage', storage);
  expect(() => createLevelManager()).not.toThrow();
  vi.unstubAllGlobals();
});

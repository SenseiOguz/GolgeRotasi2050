import { LEVELS } from './levels';
import type { LevelData } from './types';

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem?(k: string): void;
}
export interface LevelRecord { stars: 0 | 1 | 2 | 3; bestLoad: number }
export interface ProgressData {
  version: 1;
  unlocked: string[];
  completed: Record<string, LevelRecord>;
  pendingUnlock: string | null;
  lastPlayed: string | null;
}
export const PROGRESS_KEY = 'golge-rotasi-progress-v1';

export class LevelManager {
  private data: ProgressData;
  private readonly catalog: LevelData[];

  constructor(levels: LevelData[], private readonly storage?: StorageLike) {
    this.catalog = structuredClone(levels);
    this.data = this.fresh();
    try {
      const raw = storage?.getItem(PROGRESS_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (this.valid(parsed)) this.data = structuredClone(parsed);
      }
    } catch { /* Missing, blocked or corrupt storage uses fresh in-memory progress. */ }
  }

  private fresh(): ProgressData {
    return { version: 1, unlocked: this.catalog.length ? [this.catalog[0].id] : [],
      completed: {}, pendingUnlock: null, lastPlayed: null };
  }

  private valid(value: unknown): value is ProgressData {
    if (!value || typeof value !== 'object') return false;
    const p = value as ProgressData;
    const known = (id: unknown): id is string => typeof id === 'string' && this.index(id) >= 0;
    if (p.version !== 1 || !Array.isArray(p.unlocked) || !p.unlocked.every(known)
      || new Set(p.unlocked).size !== p.unlocked.length
      || !p.completed || typeof p.completed !== 'object' || Array.isArray(p.completed)
      || !(p.pendingUnlock === null || known(p.pendingUnlock))
      || !(p.lastPlayed === null || known(p.lastPlayed))) return false;
    // Only a contiguous prefix may be unlocked, with each predecessor completed.
    if (p.unlocked.length !== this.catalog.filter((_, i) => i < p.unlocked.length).length
      || (this.catalog.length > 0 && p.unlocked.length === 0)) return false;
    for (let i = 0; i < p.unlocked.length; i++) {
      if (p.unlocked[i] !== this.catalog[i].id || (i > 0 && !Object.hasOwn(p.completed, this.catalog[i - 1].id))) return false;
    }
    for (const [id, record] of Object.entries(p.completed)) {
      if (!known(id) || !p.unlocked.includes(id) || !record || typeof record !== 'object'
        || ![0, 1, 2, 3].includes(record.stars) || !Number.isFinite(record.bestLoad) || record.bestLoad < 0) return false;
    }
    return (p.pendingUnlock === null || p.unlocked.includes(p.pendingUnlock))
      && (p.lastPlayed === null || p.unlocked.includes(p.lastPlayed));
  }

  private save(): void {
    try { this.storage?.setItem(PROGRESS_KEY, JSON.stringify(this.data)); } catch { /* Retain in-memory progress. */ }
  }

  levels(): LevelData[] { return structuredClone(this.catalog); }
  index(id: string): number { return this.catalog.findIndex(level => level.id === id); }
  isUnlocked(id: string): boolean { return this.data.unlocked.includes(id); }
  isCompleted(id: string): boolean { return Object.hasOwn(this.data.completed, id); }
  record(id: string): LevelRecord | null {
    return this.isCompleted(id) ? { ...this.data.completed[id] } : null;
  }
  nextId(id: string): string | null {
    const index = this.index(id);
    return index >= 0 ? this.catalog[index + 1]?.id ?? null : null;
  }
  recordResult(id: string, success: boolean, stars: 0 | 1 | 2 | 3, totalLoad: number): { newlyUnlocked: string | null } {
    if (!this.isUnlocked(id) || !Number.isFinite(totalLoad) || totalLoad < 0 || ![0, 1, 2, 3].includes(stars)) return { newlyUnlocked: null };
    this.data.lastPlayed = id;
    let newlyUnlocked: string | null = null;
    if (success) {
      const previous = this.record(id);
      this.data.completed[id] = { stars: Math.max(previous?.stars ?? 0, stars) as LevelRecord['stars'],
        bestLoad: Math.min(previous?.bestLoad ?? Infinity, totalLoad) };
      const next = this.nextId(id);
      if (next && !this.isUnlocked(next)) {
        this.data.unlocked.push(next);
        this.data.pendingUnlock = newlyUnlocked = next;
      }
    }
    this.save();
    return { newlyUnlocked };
  }
  consumePendingUnlock(): string | null {
    const pending = this.data.pendingUnlock;
    this.data.pendingUnlock = null;
    this.save();
    return pending;
  }
  setLastPlayed(id: string): void {
    if (this.isUnlocked(id)) { this.data.lastPlayed = id; this.save(); }
  }
  reset(): void { this.data = this.fresh(); this.save(); }
}

export function createLevelManager(): LevelManager {
  let storage: StorageLike | undefined;
  try { storage = globalThis.localStorage; } catch { /* localStorage may be denied. */ }
  return new LevelManager(LEVELS, storage);
}

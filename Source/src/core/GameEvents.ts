import Phaser from 'phaser';
import type { LevelData, RunResult, RunStep, Tile, ToolId } from './types';

/** Frozen T00 event names; later contract changes belong to T04. */
export const GameEvent = {
  TOOL_SELECTED: 'TOOL_SELECTED',
  TILE_CLICKED: 'TILE_CLICKED',
  TOOL_PLACED: 'TOOL_PLACED',
  PLACEMENT_REJECTED: 'PLACEMENT_REJECTED',
  BUDGET_CHANGED: 'BUDGET_CHANGED',
  HEAT_UPDATED: 'HEAT_UPDATED',
  HEATMAP_TOGGLED: 'HEATMAP_TOGGLED',
  SIM_START_REQUESTED: 'SIM_START_REQUESTED',
  SIM_STARTED: 'SIM_STARTED',
  SIM_STEP: 'SIM_STEP',
  SIM_FINISHED: 'SIM_FINISHED',
  RETRY_REQUESTED: 'RETRY_REQUESTED',
  NEXT_LEVEL_REQUESTED: 'NEXT_LEVEL_REQUESTED',
  MAP_REQUESTED: 'MAP_REQUESTED',
  UNDO_REQUESTED: 'UNDO_REQUESTED',
  MUTE_TOGGLED: 'MUTE_TOGGLED',
  LEVEL_LOADED: 'LEVEL_LOADED',
} as const;

/** Signal-only events have no payload. Matrices use [y][x]. */
export interface GameEventPayloadMap {
  TOOL_SELECTED: { toolId: ToolId | null };
  TILE_CLICKED: { x: number; y: number };
  TOOL_PLACED: { x: number; y: number; toolId: ToolId; budgetLeft: number };
  PLACEMENT_REJECTED: { x: number; y: number; reason: 'invalid_tile' | 'no_budget' | 'occupied' | 'no_tool' | 'blocked' | 'limit' };
  BUDGET_CHANGED: { budgetLeft: number; budget: number };
  HEAT_UPDATED: { tiles: Tile[][] };
  /** UI -> Game; keyboard H uses the same toggle contract. */
  HEATMAP_TOGGLED: { visible: boolean };
  SIM_START_REQUESTED: undefined;
  SIM_STARTED: undefined;
  SIM_STEP: { step: RunStep };
  SIM_FINISHED: { result: RunResult };
  RETRY_REQUESTED: undefined;
  NEXT_LEVEL_REQUESTED: undefined;
  MAP_REQUESTED: undefined;
  UNDO_REQUESTED: undefined;
  MUTE_TOGGLED: { muted: boolean };
  LEVEL_LOADED: { level: LevelData };
}

type EventName = keyof GameEventPayloadMap;
type EventArgs<K extends EventName> = GameEventPayloadMap[K] extends undefined
  ? [] : [payload: GameEventPayloadMap[K]];
export type EventListener<K extends EventName> = (...args: EventArgs<K>) => void;

export const gameEvents = new Phaser.Events.EventEmitter();

export function emitEvent<K extends EventName>(event: K, ...args: EventArgs<K>): void {
  gameEvents.emit(event, ...args);
}

/** Remove scene subscriptions on shutdown using the same listener and context. */
export function onEvent<K extends EventName>(event: K, listener: EventListener<K>, context?: unknown): void {
  gameEvents.on(event, listener, context);
}

export function offEvent<K extends EventName>(event: K, listener: EventListener<K>, context?: unknown): void {
  gameEvents.off(event, listener, context);
}

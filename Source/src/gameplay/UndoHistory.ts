import type { GameState } from '../core/types';
/** Retain immutable core snapshots; selection and sound preferences are not undone. */
export class UndoHistory {
  private states: GameState[] = [];
  push(state: GameState): void { this.states.push(state); }
  pop(current: GameState): GameState {
    if (current.phase !== 'planning') return current;
    const previous = this.states.pop();
    return previous ? { ...previous, selectedTool: current.selectedTool, muted: current.muted } : current;
  }
  clear(): void { this.states = []; }
}

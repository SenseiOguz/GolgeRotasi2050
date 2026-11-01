/** Shared contracts: frozen after T00; changes belong to integrator T04. */
export type TileType = 'road' | 'building' | 'park' | 'water' | 'start' | 'goal';
export type ToolId = 'tree' | 'canopy' | 'coolRoof';

/** A grid cell and its heat before/after cooling. */
export interface Tile {
  x: number;
  y: number;
  type: TileType;
  baseHeat: number; // 0–100
  heat: number; // Current after cooling
  placed?: ToolId;
}
/** Available cooling intervention. */
export interface Tool {
  id: ToolId;
  name: string; // Turkish: Ağaç, Gölgelik, Serin Çatı
  cost: number;
  coolingCenter: number;
  coolingNeighbor: number;
  allowedOn: TileType[];
  description: string;
}
/** Static level input; matrices are indexed [y][x]. */
export interface LevelData {
  id: string;
  name: string;
  cols: number;
  rows: number;
  tiles: TileType[][];
  baseHeat: number[][];
  route: { x: number; y: number }[];
  budget: number;
  heatThreshold: number; // Maximum cumulative heat load the courier tolerates
  tools: ToolId[];
  eduCardIds?: string[];
  difficulty?: 1 | 2 | 3 | 4;
  subtitle?: string;
  objectives?: string[];
  deliveries?: { x: number; y: number }[];
  blockedCells?: { x: number; y: number }[];
  heatWave?: { fromStep: number; toStep: number; bonus: number };
  toolLimits?: Partial<Record<ToolId, number>>;
  stars?: { margin2: number; margin3: number; savings: number; eff2: number; eff3: number };
}
/** One courier route sample. */
export interface RunStep {
  index: number;
  x: number;
  y: number;
  heat: number;
  cumulativeLoad: number;
}
/** Completed simulation summary. */
export interface RunResult {
  success: boolean;
  totalLoad: number;
  peakHeat: number;
  threshold: number;
  steps: RunStep[];
  budgetSpent: number;
  budgetLeft: number;
}
/** Mutable state shared by gameplay and UI. */
export interface GameState {
  level: LevelData;
  tiles: Tile[][];
  budgetLeft: number;
  selectedTool: ToolId | null;
  phase: 'planning' | 'simulating' | 'result';
  muted: boolean;
}

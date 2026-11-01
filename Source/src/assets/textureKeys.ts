import type { TileType, ToolId } from '../core/types';
export const TEXTURE_KEYS = { road: 'tile-road', building: 'tile-building', park: 'tile-park', water: 'tile-water', start: 'tile-start', goal: 'tile-goal', tree: 'tool-tree', canopy: 'tool-canopy', coolRoof: 'tool-cool-roof', courier: 'courier', panel: 'ui-panel' } as const;
export const TILE_TEXTURES: Record<TileType, string> = { road: TEXTURE_KEYS.road, building: TEXTURE_KEYS.building, park: TEXTURE_KEYS.park, water: TEXTURE_KEYS.water, start: TEXTURE_KEYS.start, goal: TEXTURE_KEYS.goal };
export const TOOL_TEXTURES: Record<ToolId, string> = { tree: TEXTURE_KEYS.tree, canopy: TEXTURE_KEYS.canopy, coolRoof: TEXTURE_KEYS.coolRoof };

export const GRID_LAYOUT = { x: 32, y: 120, width: 800, height: 480, tileSize: 80, cols: 10, rows: 6 } as const;
export const UI_LAYOUT = { width: 1280, height: 720, sidebarX: 856, sidebarWidth: 392 } as const;

export function tileCenter(x: number, y: number): { x: number; y: number } {
  return { x: GRID_LAYOUT.x + (x + 0.5) * GRID_LAYOUT.tileSize, y: GRID_LAYOUT.y + (y + 0.5) * GRID_LAYOUT.tileSize };
}
export function gridCell(x: number, y: number): { x: number; y: number } | undefined {
  const col = Math.floor((x - GRID_LAYOUT.x) / GRID_LAYOUT.tileSize);
  const row = Math.floor((y - GRID_LAYOUT.y) / GRID_LAYOUT.tileSize);
  return col >= 0 && col < GRID_LAYOUT.cols && row >= 0 && row < GRID_LAYOUT.rows ? { x: col, y: row } : undefined;
}

/** Master palette: Art Bible 4.6. */
export const MASTER_PALETTE = ["#0B1320","#101C2C","#1B3044","#2A4559","#3D5F73","#4A5560","#66717A","#8C959B","#B7BEC0","#ECF4F6","#12382F","#1E5A47","#2E7D5B","#43C6A5","#7FE0B8","#C6F2D8","#5C2A2E","#A23E3A","#F87852","#F4A259","#F0C35C","#FFE6A3","#3D2E35","#6B4A3A","#9C7856","#C9A57A","#1F4E79","#2F7FA8","#6EC6E6","#D9E8E4","#B05FA0","#E86A92"] as const;
export const PALETTE_RGB = MASTER_PALETTE.map(color => Number.parseInt(color.slice(1), 16));
export function isPaletteColor(color: number): boolean { return PALETTE_RGB.includes(color); }
export function paletteHex(color: number): string { return '#' + color.toString(16).padStart(6, '0').toUpperCase(); }

/// <reference types="vite/client" />
import { TEXTURE_KEYS } from './textureKeys';
import { PIXEL_FILE_ALIASES, PIXEL_KEYS } from './pixelKeys';
// TODO: enable only after pixel UI/text regression approval.
export const PIXEL_GLOBAL = false;
export const PIXEL_AREAS = ['world', 'ui', 'map'] as const;
export type PixelArea = typeof PIXEL_AREAS[number];
export interface PixelAssetRecord {
 key: string; file: string; nativeSize: { width: number; height: number };
 frames: number; anchor: { x: number; y: number }; frameWidth?: number; frameHeight?: number;
}
export interface PixelAsset extends Partial<PixelAssetRecord> { key: string; url: string; file: string }
export interface PixelAreaManifest { assets: PixelAssetRecord[] }
const knownKeys = new Set<string>([...Object.values(TEXTURE_KEYS), ...Object.values(PIXEL_KEYS)]);
export const normalizePixelPath = (path: string): string => path.replaceAll('\\', '/').replace(/^.*?pixel\//, '');
export function createPixelRegistry(urls: Record<string, string>, manifests: PixelAreaManifest[] = []): PixelAsset[] {
 const records = new Map(manifests.flatMap(m => m.assets).map(r => [normalizePixelPath(r.file), r]));
 const used = new Set<string>();
 return Object.entries(urls).sort(([a], [b]) => a.localeCompare(b)).flatMap(([file, url]) => {
  const record = records.get(normalizePixelPath(file));
  const basename = file.split('/').pop()!.replace(/\.png$/, '').replaceAll('_', '-');
  const key = record?.key ?? PIXEL_FILE_ALIASES[basename] ?? basename;
  if (!knownKeys.has(key) || used.has(key)) return [];
  used.add(key);
  return [{ ...record, key, url, file }];
 });
}
export function isClassicMode(search: string): boolean { return new URLSearchParams(search).get('classic') === '1'; }
const urls = import.meta.glob<string>('./pixel/**/*.png', { eager: true, query: '?url', import: 'default' });
const manifests = import.meta.glob<PixelAreaManifest>('../../art/*/manifest.json', { eager: true, import: 'default' });
export const PIXEL_ASSETS = createPixelRegistry(urls, Object.values(manifests));

/** Optional map layout: no hard import, so absent ART-MAP files remain safe. */
export type PixelMapLayout = Record<string, unknown>;
export function resolveMapLayout(layouts: Record<string, PixelMapLayout>): PixelMapLayout | undefined {
 return layouts['./pixel/map/map-layout.json'];
}
const mapLayouts = import.meta.glob<PixelMapLayout>('./pixel/map/map-layout.json', { eager: true, import: 'default' });
export const MAP_LAYOUT = resolveMapLayout(mapLayouts);

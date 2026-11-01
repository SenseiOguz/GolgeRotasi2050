import { onEvent } from '../core/GameEvents';
import { playCue } from '../audio/soundDesign';
import type { Sound } from '../audio/soundDesign';
import { CityAmbience } from '../audio/CityAmbience';
const storageKey = 'golge-rotasi-muted', volumeKey = 'golge-rotasi-volume';
const ambienceKey = 'golge-rotasi-ambience-enabled', ambienceVolumeKey = 'golge-rotasi-ambience-volume';
function read(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function save(key: string, value: string): void { try { localStorage.setItem(key, value); } catch { /* Optional persistence. */ } }
const clamp = (value: number): number => Math.min(1, Math.max(0, value));
function readLevel(key: string, fallback: number): number { const value = read(key); return value !== null && value.trim() !== '' && Number.isFinite(Number(value)) ? clamp(Number(value)) : fallback; }
let muted = read(storageKey) === 'true', volume = readLevel(volumeKey, 1);
let ambienceEnabled = read(ambienceKey) !== 'false', ambienceVolume = readLevel(ambienceVolumeKey, .25);
let heatRatio = 1, unlocked = false, lastHover = -Infinity;
let context: AudioContext | undefined, output: GainNode | undefined, ambience: CityAmbience | undefined;
const activeGains = new Set<GainNode>();
function applyVolume(): void { try { if (output && context) output.gain.setValueAtTime(muted ? 0 : volume, context.currentTime); } catch { /* Silent fallback. */ } }
function ensureAudio(): boolean {
  if (!unlocked || muted || volume === 0) return false;
  try {
    context ??= new AudioContext(); void context.resume().catch(() => undefined);
    if (!output) { const gain = context.createGain(); gain.connect(context.destination); output = gain; }
    applyVolume(); return true;
  } catch { return false; }
}
function syncAmbience(): void {
  const hidden = typeof document !== 'undefined' && document.hidden;
  if (!ambienceEnabled || ambienceVolume === 0 || muted || volume === 0 || !unlocked || hidden) { ambience?.stop(); ambience = undefined; return; }
  if (!ensureAudio()) return;
  if (ambience) ambience.update(ambienceVolume, heatRatio);
  else { const loop = new CityAmbience(context!, output!, ambienceVolume, heatRatio); if (loop.start()) ambience = loop; }
}
function unlock(): void { if (unlocked) return; unlocked = true; syncAmbience(); }
export const sfx = {
  get muted(): boolean { return muted; },
  get volume(): number { return volume; },
  get ambienceEnabled(): boolean { return ambienceEnabled; },
  get ambienceVolume(): number { return ambienceVolume; },
  get heatRatio(): number { return heatRatio; },
  unlock,
  setVolume(value: number): void { if (Number.isNaN(value)) return; volume = clamp(value); applyVolume(); save(volumeKey, String(volume)); syncAmbience(); },
  setAmbienceEnabled(value: boolean): void { ambienceEnabled = value; save(ambienceKey, String(value)); syncAmbience(); },
  setAmbienceVolume(value: number): void { if (Number.isNaN(value)) return; ambienceVolume = clamp(value); save(ambienceVolumeKey, String(ambienceVolume)); syncAmbience(); },
  setHeatRatio(value: number): void { if (!Number.isFinite(value)) return; heatRatio = Math.max(0, Math.min(2, value)); ambience?.update(ambienceVolume, heatRatio); },
  play(sound: Sound): void {
    if (!ensureAudio()) return;
    if (sound === 'hover') { if (context!.currentTime - lastHover < .08) return; lastHover = context!.currentTime; }
    try { playCue(context!, output!, sound, activeGains); } catch { /* Silent fallback on browsers without WebAudio. */ }
  },
};
// One application-lifetime listener, never reinstalled by scene restarts.
onEvent('MUTE_TOGGLED', ({ muted: value }) => {
  muted = value; applyVolume();
  try { if (value && context) for (const gain of activeGains) { gain.gain.cancelScheduledValues(context.currentTime); gain.gain.setTargetAtTime(0, context.currentTime, .005); } } catch { /* Silent fallback. */ }
  save(storageKey, String(value)); syncAmbience();
});
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', unlock, { once: true, capture: true });
  document.addEventListener('keydown', unlock, { once: true, capture: true });
  document.addEventListener('touchstart', unlock, { once: true, capture: true });
  document.addEventListener('visibilitychange', syncAmbience);
}

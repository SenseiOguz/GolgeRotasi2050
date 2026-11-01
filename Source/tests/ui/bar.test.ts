import { expect, test, vi } from 'vitest';
vi.mock('phaser', () => ({ default: { GameObjects: { Container: class { constructor(public scene: unknown) {} add() {} } } } }));
vi.mock('../../src/ui/pixel', () => ({ pixelMode: () => false }));
vi.mock('../../src/ui/theme', () => ({ COLORS: { cool: 1, edge: 2, text: 3, hot: 4, warn: 5 }, text: () => ({ value: '', setText(value: string) { this.value = value; } }) }));
import { Bar } from '../../src/ui/Bar';
test('authoritative finish immediately replaces an in-flight 232 display with 210', () => {
  const rectangle = () => ({ width: 0, setOrigin() { return this; }, setFillStyle() {} });
  const tweens = { killTweensOf: vi.fn(), add: vi.fn() };
  const scene = { add: { existing() {}, rectangle }, tweens };
  const bar = new Bar(scene as never, 0, 0, 300);
  bar.updateValue(232, 270); // Previous planning or step tween is still in flight.
  const tween = tweens.add.mock.calls[0][0] as { targets: { value: number }; onUpdate: () => void };
  tween.targets.value = 232; tween.onUpdate();
  bar.updateValue(210, 270, true); // SIM_FINISHED never waits for another tween tick.
  const label = (bar as unknown as { label: { value: string } }).label;
  expect(label.value).toBe('210 / 270 eşik');
  expect(tweens.killTweensOf).toHaveBeenCalledTimes(2);
  expect(tweens.add).toHaveBeenCalledTimes(1);
});

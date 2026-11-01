import type Phaser from 'phaser';
import type { RunResult, RunStep } from '../core/types';
import { tileCenter } from '../ui/layout';
/** Plays every core sample, including start and goal, without recomputing scores. */
export class Simulation {
  private cancelled = false;
  private movement?: Phaser.Tweens.Tween;
  constructor(private scene: Phaser.Scene) {}
  cancel(): void { this.cancelled = true; this.movement?.remove(); this.movement = undefined; }
  play(courier: Phaser.GameObjects.Container, result: RunResult, onStep: (step: RunStep) => void, onFinish: () => void, motion?: { move(dx: number, dy: number): void; update(progress: number): void; idle(): void }): void {
    const advance = (index: number): void => {
      if (this.cancelled) return;
      const step = result.steps[index];
      if (!step) { onFinish(); return; }
      const originY = courier.y;
      const destination = tileCenter(step.x, step.y);
      motion?.move(destination.x - courier.x, destination.y - courier.y);
      const heading = courier.getByName?.('heading') as Phaser.GameObjects.Graphics | undefined;
      if (heading && (destination.x !== courier.x || destination.y !== courier.y)) {
        heading.rotation = Math.atan2(destination.y - courier.y, destination.x - courier.x);
      }
      this.movement = this.scene.tweens.add({ targets: courier, ...tileCenter(step.x, step.y), duration: 300, onUpdate: (tween: Phaser.Tweens.Tween) => {
        courier.y = originY + (destination.y - originY) * (0.5 - Math.cos(tween.progress * Math.PI) / 2) - Math.sin(tween.progress * Math.PI * 2) * 2;
        motion?.update(tween.progress);
      }, ease: 'Sine.easeInOut', onComplete: () => {
        if (this.cancelled) return;
        courier.x = destination.x;
        courier.y = destination.y;
        this.movement = undefined;
        motion?.idle();
        onStep(step);
        advance(index + 1);
      } });
    };
    advance(0);
  }
}

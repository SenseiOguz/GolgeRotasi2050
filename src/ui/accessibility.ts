import Phaser from 'phaser';
import { pixelMode } from './pixel';

/** Native semantic targets over the canvas, sharing the visible control's action. */
export function accessibleTarget(
  scene: Phaser.Scene, owner: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject,
  element: HTMLElement, bounds: { x: number; y: number; width: number; height: number },
  update?: () => void,
): HTMLElement {
  element.classList.add('canvas-target');
  // Phaser listens for mouseup on window; a native click must invoke the action once.
  for (const event of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend']) {
    element.addEventListener(event, input => input.stopPropagation());
  }
  document.body.append(element);
  const sync = (): void => {
    const canvas = scene.game.canvas.getBoundingClientRect();
    const matrix = owner.getWorldTransformMatrix();
    const position = matrix.transformPoint(bounds.x, bounds.y);
    const pixel = pixelMode(scene);
    const sx = canvas.width / scene.scale.gameSize.width;
    const sy = canvas.height / scene.scale.gameSize.height;
    let depth = 0;
    let visible = scene.sys.isActive();
    let current: Phaser.GameObjects.GameObject | null = owner;
    while (current) {
      const object = current as Phaser.GameObjects.Container;
      visible &&= object.visible !== false;
      depth = Math.max(depth, object.depth ?? 0);
      current = current.parentContainer;
    }
    Object.assign(element.style, {
      left: `${canvas.left + position.x * sx}px`, top: `${canvas.top + position.y * sy}px`,
      width: `${bounds.width * matrix.scaleX * sx}px`, height: `${bounds.height * matrix.scaleY * sy}px`,
      display: visible ? 'block' : 'none',
      zIndex: String((scene.sys.settings.key === 'UIScene' ? 200 : 100) + depth * 10 + (element.tagName === 'BUTTON' ? 1 : 0)),
    });
    if (pixel) {
      const modalOpen = scene.children.list.some(child => child instanceof Phaser.GameObjects.Container && child.depth >= 100 && child.active);
      element.inert = modalOpen && depth < 100;
    }
    update?.();
  };
  const dispose = (): void => {
    element.onblur = null;
    element.onfocus = null;
    element.onpointerleave = null;
    element.remove(); scene.events.off(Phaser.Scenes.Events.POST_UPDATE, sync);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, dispose);
    owner.off(Phaser.GameObjects.Events.DESTROY, dispose);
  };
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, sync);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, dispose);
  owner.once(Phaser.GameObjects.Events.DESTROY, dispose);
  sync();
  return element;
}

export function accessibleText(scene: Phaser.Scene, owner: Phaser.GameObjects.Text): void {
  const element = document.createElement('span');
  element.className = 'canvas-reading';
  document.body.append(element);
  const sync = (): void => { if (element.textContent !== owner.text) element.textContent = owner.text; };
  const dispose = (): void => {
    element.remove(); scene.events.off(Phaser.Scenes.Events.POST_UPDATE, sync);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, dispose);
    owner.off(Phaser.GameObjects.Events.DESTROY, dispose);
  };
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, sync);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, dispose);
  owner.once(Phaser.GameObjects.Events.DESTROY, dispose);
  sync();
}

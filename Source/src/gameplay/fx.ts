import Phaser from 'phaser';
export function ripple(scene: Phaser.Scene, x: number, y: number, reverse = false): void {
  const ring = scene.add.circle(x, y, 12).setStrokeStyle(2, 0x43c6a5).setDepth(5);
  ring.setScale(reverse ? 4 : 1);
  scene.tweens.add({ targets: ring, scale: reverse ? 1 : 4, alpha: 0, duration: 550, ease: 'Sine.easeOut', onComplete: () => ring.destroy() });
}
export function floatingHeat(scene: Phaser.Scene, x: number, y: number, heat: number): void {
  const color = heat >= 80 ? '#F87852' : heat >= 50 ? '#F0C35C' : '#43C6A5';
  const text = scene.add.text(x + 16, y - 22, `+${heat}`, { fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color, backgroundColor: '#101C2C', padding: { x: 5, y: 3 } }).setOrigin(0.5).setDepth(8);
  scene.tweens.add({ targets: text, y: y - 52, alpha: 0, duration: 650, onComplete: () => text.destroy() });
  const trail = scene.add.circle(x, y + 12, 13, Phaser.Display.Color.HexStringToColor(color).color, 0.3).setDepth(2);
  scene.tweens.add({ targets: trail, scale: 1.8, alpha: 0, duration: 700, onComplete: () => trail.destroy() });
}
export function finishEffect(scene: Phaser.Scene, x: number, y: number, success: boolean, pixel = false): void {
  if (!success) {
    const badge = scene.add.text(x, y - 38, '!', { color: '#F87852', fontSize: '28px', fontStyle: 'bold', backgroundColor: '#101C2C', padding: { x: 9, y: 2 } }).setOrigin(0.5).setDepth(8);
    scene.tweens.add({ targets: badge, alpha: 0.45, duration: 550, yoyo: true, repeat: -1 });
    return;
  }
  ripple(scene, x, y);
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    const spark = pixel ? particle(scene, x, y, 0x43c6a5) : scene.add.circle(x, y, 3, 0x43c6a5).setDepth(8);
    if (!spark) continue;
    scene.tweens.add({ targets: spark, x: x + Math.cos(angle) * 55, y: y + Math.sin(angle) * 55, alpha: 0, duration: 650, onComplete: () => spark.destroy() });
  }
}

const activeParticles = new WeakMap<Phaser.Scene,number>();
export function cappedEffect<T extends Phaser.GameObjects.GameObject>(scene: Phaser.Scene, create: () => T): T | undefined {
  const count = activeParticles.get(scene) ?? 0;
  if (count >= 150) return;
  activeParticles.set(scene,count+1);
  const point=create();
  point.once(Phaser.GameObjects.Events.DESTROY,()=>activeParticles.set(scene,Math.max(0,(activeParticles.get(scene) ?? 1)-1)));
  return point;
}
export function particle(scene: Phaser.Scene, x: number, y: number, color: number): Phaser.GameObjects.Rectangle | undefined {
  return cappedEffect(scene,()=>scene.add.rectangle(x,y,4,4,color).setDepth(8));
}
export function stepFeedback(scene: Phaser.Scene, x: number, y: number, heat: number): void {
  if (heat >= 50 && heat < 80) return;
  const color = heat >= 80 ? 0xf87852 : 0x43c6a5;
  for(let i=0;i<4;i++) {
    const point=particle(scene,x+(i-1.5)*10,y+12,color);
    if (point) scene.tweens.add({targets:point,y:y-12-i*3,alpha:0,duration:420,onComplete:()=>point.destroy()});
  }
}

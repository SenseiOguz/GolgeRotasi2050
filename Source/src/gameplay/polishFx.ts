import type Phaser from 'phaser';
import { availablePixel } from './BuildingVisual';
import { cappedEffect } from './fx';
import { reducedMotion } from '../ui/pixel';

export function deliveryFlight(scene: Phaser.Scene, x: number, y: number, targetX: number, targetY: number): void {
  if (reducedMotion()) return;
  const key=availablePixel(scene,'icon-delivery');
  const parcel=cappedEffect(scene,()=>key
    ? scene.add.image(x,y-16,key).setDisplaySize(48,48)
    : scene.add.rectangle(x,y-16,14,12,0xf0c35c).setStrokeStyle(2,0x101c2c));
  if (!parcel) return;
  parcel.setName('delivery-flight').setDepth(8);
  scene.tweens.add({targets:parcel,y:y-40,duration:160,ease:'Sine.easeOut',onComplete:()=>{
    scene.tweens.add({targets:parcel,x:targetX,y:targetY,scaleX:.35,scaleY:.35,alpha:0,duration:620,ease:'Cubic.easeIn',onComplete:()=>parcel.destroy()});
  }});
}

export function heatWaveCue(scene: Phaser.Scene, x: number, y: number): void {
  if (reducedMotion()) return;
  const key=availablePixel(scene,'icon-heatwave');
  if (key) {
    const icon=cappedEffect(scene,()=>scene.add.image(x-22,y-32,key).setDisplaySize(48,48).setDepth(7.5).setAlpha(.7).setName('heatwave-icon'));
    if (icon) scene.tweens.add({targets:icon,y:y-42,alpha:0,duration:420,onComplete:()=>icon.destroy()});
  }
  const edge=cappedEffect(scene,()=>scene.add.graphics().setDepth(7).setName('heatwave-edge'));
  if (!edge) return;
  const {width,height}=scene.scale;
  // Three faint outer rings: at most 12px inset, clear of board and HUD text.
  for (let i=0;i<3;i++) {
    const inset=i*4;
    edge.fillStyle(0xf87852,.04-i*.01);
    edge.fillRect(inset,inset,width-inset*2,4);
    edge.fillRect(inset,height-inset-4,width-inset*2,4);
    edge.fillRect(inset,inset+4,4,height-inset*2-8);
    edge.fillRect(width-inset-4,inset+4,4,height-inset*2-8);
  }
  scene.tweens.add({targets:edge,alpha:0,duration:480,onComplete:()=>edge.destroy()});
}

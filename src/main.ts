import Phaser from 'phaser';
import { PALETTE } from './core/constants';
import { BootScene } from './scenes/BootScene';
import { LevelMapScene } from './scenes/LevelMapScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { PreloadScene } from './scenes/PreloadScene';
import './style.css';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game',
  backgroundColor: PALETTE.BG,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [PreloadScene, BootScene, MenuScene, LevelMapScene, GameScene, UIScene],
});

import Phaser from 'phaser';
import type { LevelData, RunResult, Tile } from '../core/types';
import { heatToColor } from '../core/rules';
import { EDU_CARDS } from '../core/eduCards';
import { TOOLS } from '../core/tools';
import { frame, icon, reducedMotion } from './pixel';
import { text } from './theme';
import { Button } from './Button';
import { Modal } from './Modal';
import type { ResultSummary } from './resultData';
import { failureHint } from './resultData';
import { starDisplay } from './starDisplay';
import { addStars } from './Stars';

export function pixelResult(scene: Phaser.Scene, level: LevelData, result: RunResult, summary: ResultSummary, actions: { retry: () => void; map: () => void; next?: () => void }): Modal {
  const modal = new Modal(scene, '');
  const success = result.success, color = success ? '#1E5A47' : '#A23E3A';
  const add = (object: Phaser.GameObjects.GameObject): void => { modal.add(object); };
  add(icon(scene, 300, 138, success ? 'icon-result-success' : 'icon-result-fail', 64));
  add(text(scene, 348, 107, success ? 'Görev tamamlandı' : 'Biraz daha gölge gerekli', 30, 520).setFontStyle('bold'));
  add(text(scene, 348, 150, success ? 'Kurye güvenle ulaştı.' : 'Yeni bir yerleşimle rotayı serinletebilirsin.', 17, 520));
  if (success) {
    const courierKey = scene.textures.exists('courier-deliver') ? 'courier-deliver' : 'courier';
    if (scene.textures.exists(courierKey)) add(scene.add.sprite(904, 136, courierKey, 0).setDisplaySize(64, 64));
    if (scene.textures.exists('bldg-hospital')) add(scene.add.image(982, 132, 'bldg-hospital').setDisplaySize(64, 90));
    addStars(scene, modal, starDisplay(level, result, summary.initialLoad));
  }
  const labelY = success ? 184 : 192, valueY = success ? 208 : 214;
  add(text(scene, 284, labelY, 'BAŞLANGIÇ ISI YÜKÜ', 18).setFontStyle('bold'));
  add(text(scene, 284, valueY, String(summary.initialLoad), 30));
  add(text(scene, 510, labelY, 'SON ISI YÜKÜ', 18).setFontStyle('bold'));
  const count = text(scene, 510, valueY, String(result.totalLoad), 30).setColor(color); add(count);
  add(text(scene, 606, valueY + 14, '/ ' + result.threshold + ' eşik', 18));
  add(text(scene, 996, labelY, 'KALAN BÜTÇE', 18).setFontStyle('bold').setOrigin(1, 0));
  add(icon(scene, 858, valueY + 16, 'icon-budget', 32));
  add(text(scene, 996, valueY, String(result.budgetLeft), 30).setOrigin(1, 0).setColor(color));
  add(text(scene, 996, success ? 247 : 251, 'Harcanan: ' + result.budgetSpent, 16).setOrigin(1, 0));
  const improvement = summary.initialLoad - result.totalLoad;
  add(text(scene, 284, success ? 246 : 270, success ? `Isı yükü ${improvement} azaldı · Hedef sağlandı.` : `Rota ısı yükü ${result.totalLoad}, eşik ${result.threshold} · ${result.totalLoad - result.threshold} fazla.`, 18, success ? 500 : 712).setColor(color));

  const heatMap = (x: number, title: string, tiles: Tile[][], highlight: boolean): void => {
    const cell = success ? 12 : 14, top = success ? 296 : 328;
    add(text(scene, x, success ? 276 : 304, title, 14));
    add(frame(scene, x - 4, top - 4, level.cols * cell + 8, level.rows * cell + 8, 'ui-tool-card'));
    for (const row of tiles) for (const tile of row) {
      add(scene.add.rectangle(x + tile.x * cell, top + tile.y * cell, cell - 1, cell - 1, heatToColor(tile.heat)).setOrigin(0));
      if (level.route.some(p => p.x === tile.x && p.y === tile.y)) add(scene.add.rectangle(x + tile.x * cell + 4, top + tile.y * cell + 4, success ? 3 : 5, success ? 3 : 5, 0x1b3044).setOrigin(0));
      if (highlight && summary.hottest.some(p => p.x === tile.x && p.y === tile.y)) add(scene.add.rectangle(x + tile.x * cell, top + tile.y * cell, cell - 1, cell - 1).setOrigin(0).setFillStyle(0, 0).setStrokeStyle(2, 0xa23e3a));
    }
  };
  heatMap(284, 'ÖNCE · ' + summary.initialLoad, summary.initialTiles, false);
  heatMap(464, 'SONRA · ' + summary.finalLoad, summary.finalTiles, !success);
  const legendY = success ? 378 : 416;
  add(text(scene, 284, legendY, 'Serin', 12)); add(text(scene, 604, legendY, 'Sıcak', 12).setOrigin(1, 0));
  for (let i = 0; i < 6; i++) add(scene.add.rectangle(336 + i * 30, legendY + 1, 30, 10, heatToColor(i * 20)).setOrigin(0));

  if (success) {
    add(text(scene, 648, 276, 'UYGULANAN MÜDAHALELER', 14));
    (['tree', 'canopy', 'coolRoof'] as const).forEach((tool, i) => {
      add(icon(scene, 664, 310 + i * 30, 'icon-' + (tool === 'coolRoof' ? 'cool-roof' : tool), 32));
      add(text(scene, 690, 300 + i * 30, TOOLS[tool].name + ': ' + summary.counts[tool], 18));
    });
  } else {
    add(text(scene, 648, 304, 'EN SICAK 3 ROTA NOKTASI', 14).setColor(color));
    summary.hottest.forEach((step, i) => add(text(scene, 648, 332 + i * 30, `${step.index + 1}. adım · (${step.x + 1}, ${step.y + 1}) · ${step.heat} ısı`, 16)));
  }
  const card = EDU_CARDS.find(card => level.eduCardIds?.includes(card.id)) ?? EDU_CARDS[0];
  add(frame(scene, 274, success ? 508 : 444, 732, success ? 66 : 88));
  add(text(scene, 288, success ? 516 : 452, success ? 'KENT İÇİN BİR FİKİR · ' + card.title : failureHint(level, summary), success ? 14 : 16, 704).setColor(color));
  add(text(scene, 288, success ? 538 : 478, card.body, success ? 13 : 15, 700));
  const buttonY = success ? 600 : 575;
  add(new Button(scene, actions.next ? 410 : 505, buttonY, actions.next ? 220 : 270, 'Yeniden Dene', actions.retry, true));
  add(new Button(scene, actions.next ? 640 : 790, buttonY, actions.next ? 200 : 270, 'Harita', actions.map));
  if (actions.next) add(new Button(scene, 870, buttonY, 220, 'Sonraki Bölüm', actions.next));
  if (success && !reducedMotion()) {
    for (let i = 0; i < 10; i++) {
      const leaf = icon(scene, 912, 152, i % 2 ? 'icon-leaf' : 'icon-star-full', 12); add(leaf);
      scene.tweens.add({ targets: leaf, x: 880 + (i % 5) * 26, y: 102 + Math.floor(i / 5) * 80, alpha: 0, angle: i * 28, duration: 1000 + i * 40, onComplete: () => { if (leaf.active) leaf.destroy(); } });
    }
  }
  return modal;
}

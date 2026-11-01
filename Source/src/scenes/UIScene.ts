import Phaser from 'phaser';
import { SCENE_KEYS } from '../core/constants';
import { emitEvent, onEvent, offEvent } from '../core/GameEvents';
import type { EventListener, GameEventPayloadMap } from '../core/GameEvents';
import type { LevelData, RunResult, ToolId } from '../core/types';
import { TOOLS } from '../core/tools';
import { LEVELS } from '../core/levels';
import { EDU_CARDS } from '../core/eduCards';
import { heatToColor } from '../core/rules';
import { Button } from '../ui/Button';
import { ToolCard } from '../ui/ToolCard';
import { Modal } from '../ui/Modal';
import { Bar } from '../ui/Bar';
import { Toast } from '../ui/Toast';
import { COLORS, panel, text } from '../ui/theme';
import { pixelMode, frame, icon } from '../ui/pixel';
import { showPixelHelp } from '../ui/pixelModals';
import { sfx } from '../assets/sfx';
import { ResultTracker } from '../ui/resultData';
import { pixelResult } from '../ui/ResultPanel';
import { createLevelManager } from '../core/levelManager';
import { nextPlayable, toolCounts, mechanicStatus, planningLoad } from '../ui/levelHUD';
import { LevelBriefing } from '../ui/LevelBriefing';
import { LevelIntro } from '../ui/LevelIntro';
export class UIScene extends Phaser.Scene {
  private briefing?: LevelBriefing;
  private intro?: LevelIntro;
  private mechanics!: Phaser.GameObjects.Text;
  private counts: Record<ToolId, number> = { tree: 0, canopy: 0, coolRoof: 0 };
  private resultTracker = new ResultTracker();
  private heatmapVisible = true;
  private heatmapButton?: Button;
  private soundIcon?: Phaser.GameObjects.Image;
  private helpModal?: Modal;
  private level?: LevelData;
  private budgetLeft = 0;
  private budgetDisplay = { value: 0 };
  private levelChip!: Phaser.GameObjects.Text;
  private returning = false;
  private selected: ToolId | null = null;
  private planning = false;
  private cards: ToolCard[] = [];
  private resultModal?: Modal;
  private budgetLabel!: Phaser.GameObjects.Text;
  private levelLabel!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private heatBar!: Bar;
  private start!: Button;
  private undo!: Button;
  private toast!: Toast;
  constructor() { super(SCENE_KEYS.UI); }
  create(): void {
    this.returning = false; this.cameras.main.resetFX(); this.cameras.main.fadeIn(280, 16, 28, 44);
    this.scene.get(SCENE_KEYS.GAME).cameras.main.fadeIn(280, 16, 28, 44);
    this.level = undefined; this.selected = null; this.cards = []; this.planning = false; this.resultModal = undefined;
    let mute: Button;
    if (pixelMode(this)) mute = this.createPixelHUD();
    else {
    panel(this, 32, 24, 275, 76); text(this, 50, 34, 'BÜTÇE', 14).setColor('#43C6A5'); this.budgetLabel = text(this, 50, 56, '— / —', 26);
    panel(this, 323, 24, 398, 76); text(this, 341, 33, 'ROTA ISI YÜKÜ', 14).setColor('#F0C35C'); this.heatBar = new Bar(this, 341, 52, 360);
    panel(this, 737, 24, 511, 76); this.levelChip = text(this, 754, 31, 'Bölüm 1', 17).setColor('#43C6A5'); this.levelLabel = text(this, 754, 78, 'Bölüm bekleniyor…', 14, 240);
    text(this, 856, 120, 'KENTİ SERİNLET', 22).setFontStyle('bold'); text(this, 856, 151, 'Bir araç seç, uygun hücreye yerleştir.', 16);
    this.start = new Button(this, 1052, 518, 392, 'Simülasyonu Başlat', () => emitEvent('SIM_START_REQUESTED'), true).setEnabled(false);
    this.undo = new Button(this, 950, 574, 188, 'Geri Al', () => emitEvent('UNDO_REQUESTED')).setEnabled(false);
    mute = new Button(this, 1154, 574, 188, sfx.muted ? 'Sesi Aç' : 'Sessize Al', () => emitEvent('MUTE_TOGGLED', { muted: !sfx.muted }));
    text(this, 856, 619, 'ISI HARİTASI', 13).setAlpha(.7);
    for (let i = 0; i < 100; i++) this.add.rectangle(856 + i * 3.92, 644, 4, 9, heatToColor(i * 100 / 99)).setOrigin(0);
    text(this, 856, 665, 'Serin', 14); text(this, 1248, 665, 'Sıcak', 14).setOrigin(1, 0);
    this.hint = text(this, 32, 619, 'Gözlemle → Yerleştir → Simüle et → Yeniden düşün', 18, 800);
    text(this, 32, 690, 'Eğitsel modeldir; bilimsel bir tahmin değildir.', 13).setAlpha(.65);
    }
    this.mechanics = text(this, 48, 106, '', 16, 780).setColor('#F0C35C').setBackgroundColor('#101C2C');
    this.toast = new Toast(this);
    const cleanups: (() => void)[] = [];
    const listen = <K extends keyof GameEventPayloadMap>(event: K, handler: EventListener<K>): void => { onEvent(event, handler); cleanups.push(() => offEvent(event, handler)); };
    listen('LEVEL_LOADED', ({ level }) => this.loadLevel(level));
    listen('TOOL_SELECTED', ({ toolId }) => { if (this.planning) { this.selected = toolId; this.refresh(); } });
    listen('BUDGET_CHANGED', ({ budgetLeft, budget }) => { this.updateBudget(budgetLeft, budget); this.refresh(); });
    listen('TOOL_PLACED', ({ x, y, toolId, budgetLeft }) => { this.resultTracker.placed(x, y, toolId); this.updateBudget(budgetLeft, this.level?.budget ?? 0); this.refresh(); sfx.play(toolId); });
    listen('PLACEMENT_REJECTED', ({ reason }) => { const reasons: Record<GameEventPayloadMap['PLACEMENT_REJECTED']['reason'], string> = { invalid_tile: 'Geçersiz hücre: bu araç burada kullanılamaz.', no_budget: 'Bütçe yetersiz. Daha uygun bir araç seç.', occupied: 'Hücre dolu. Başka bir hücre seç.', no_tool: 'Önce araç seç.', blocked: 'İnşaat alanı - burada yerleştirme yapılamaz', limit: 'Bu araç için bölüm limiti doldu' }; this.toast.show(reasons[reason], reason === 'no_budget' ? 'error' : 'warning'); sfx.play('reject'); });
    listen('HEAT_UPDATED', ({ tiles }) => { this.counts = toolCounts(tiles); this.refresh(); this.resultTracker.heatUpdated(tiles); if (this.level) { const load = planningLoad(this.level, tiles); sfx.setHeatRatio(this.level.heatThreshold > 0 ? load / this.level.heatThreshold : 0); if (this.planning) this.heatBar.updateValue(load, this.level.heatThreshold); } });
    listen('SIM_STARTED', () => { this.intro?.destroy(); this.intro = undefined; this.briefing?.destroy(); this.briefing = undefined; this.toast.hide(); this.planning = false; this.heatBar.updateValue(0, this.level?.heatThreshold ?? 0); this.hint.setText('Kurye yolda… Isı yükü adım adım birikiyor.'); this.refresh(); });
    listen('SIM_STEP', ({ step }) => { if (this.level) this.mechanics.setText(mechanicStatus(this.level, step)); this.heatBar.updateValue(step.cumulativeLoad, this.level?.heatThreshold ?? 0, true); sfx.play('step'); });
    listen('SIM_FINISHED', ({ result }) => { this.planning = false; this.heatBar.updateValue(result.totalLoad, result.threshold, true); this.refresh(); this.showResult(result); sfx.play(result.success ? 'win' : 'lose'); });
    listen('MUTE_TOGGLED', ({ muted }) => { mute.setLabel(muted ? 'Sesi Aç' : 'Sessize Al'); this.soundIcon?.setTexture(muted ? 'icon-sound-off' : 'icon-sound-on'); });
    listen('HEATMAP_TOGGLED', ({ visible }) => { this.heatmapVisible = visible; this.heatmapButton?.setLabel('Isı haritası: ' + (visible ? 'AÇIK' : 'KAPALI')); this.heatmapButton?.setAlpha(visible ? 1 : .6); });
    this.input.keyboard?.on('keydown-ESC', () => { this.briefing?.destroy(); this.briefing = undefined; this.helpModal?.close(); this.helpModal = undefined; });
    this.events.once('shutdown', () => { cleanups.forEach(clean => clean()); this.input.keyboard?.removeAllListeners(); });
  }
  private createPixelHUD(): Button {
    this.game.canvas.style.imageRendering = 'pixelated';
    this.helpModal = undefined; this.heatmapVisible = true;
    frame(this, 32, 24, 275, 76);
    icon(this, 72, 64, 'icon-budget', 48);
    text(this, 104, 31, 'BÜTÇE', 20).setFontStyle('bold').setColor('#1E5A47');
    this.budgetLabel = text(this, 104, 56, '— / —', 28);
    frame(this, 323, 24, 398, 76);
    icon(this, 354, 62, 'icon-thermometer', 42);
    text(this, 386, 33, 'ROTA ISI YÜKÜ', 14).setColor('#A23E3A');
    this.heatBar = new Bar(this, 386, 50, 312);
    frame(this, 737, 24, 511, 76);
    this.levelChip = text(this, 804, 39, 'Bölüm 1', 20).setFontStyle('bold').setOrigin(.5, 0);
    this.levelLabel = text(this, 754, 69, 'Bölüm bekleniyor…', 18, 244);
    const iconButton = (x: number, title: string, key: string, action: () => void): Button => {
      const button = new Button(this, x, 62, 50, title, action);
      button.label.setVisible(false); button.add(icon(this, 0, 0, key, 38)); return button;
    };
    this.heatmapButton = iconButton(1030, 'Isı haritası: AÇIK', 'icon-heatmap', () => emitEvent('HEATMAP_TOGGLED', { visible: !this.heatmapVisible }));
    const sound = iconButton(1090, 'Ses', sfx.muted ? 'icon-sound-off' : 'icon-sound-on', () => emitEvent('MUTE_TOGGLED', { muted: !sfx.muted }));
    this.soundIcon = sound.list.find(item => item instanceof Phaser.GameObjects.Image) as Phaser.GameObjects.Image;
    iconButton(1150, 'Yardım', 'icon-help', () => { if (!this.helpModal?.active && !this.resultModal?.active) this.helpModal = showPixelHelp(this, () => { this.helpModal = undefined; }); });
    iconButton(1210, 'Menü', 'icon-menu', () => this.returnToMenu());
    frame(this, 856, 116, 392, 60);
    text(this, 872, 130, 'KENTİ SERİNLET', 22).setFontStyle('bold');
    text(this, 872, 154, 'Bir araç seç, uygun hücreye yerleştir.', 14);
    this.start = new Button(this, 1052, 518, 392, 'Simülasyonu Başlat', () => emitEvent('SIM_START_REQUESTED'), true).setEnabled(false);
    this.undo = new Button(this, 950, 574, 188, 'Geri Al', () => emitEvent('UNDO_REQUESTED')).setEnabled(false);
    const mute = new Button(this, 1154, 574, 188, sfx.muted ? 'Sesi Aç' : 'Sessize Al', () => emitEvent('MUTE_TOGGLED', { muted: !sfx.muted }));
    frame(this, 856, 610, 392, 80);
    text(this, 872, 621, 'ISI HARİTASI (H)', 14);
    for (let i = 0; i < 6; i++) this.add.rectangle(872 + i * 60, 644, 60, 12, heatToColor(i * 20)).setOrigin(0);
    text(this, 872, 666, 'Serin', 14); text(this, 1232, 666, 'Sıcak', 14).setOrigin(1, 0);
    frame(this, 32, 614, 800, 52);
    this.hint = text(this, 48, 629, 'Gözlemle · Yerleştir · Simüle et · Yeniden düşün', 20, 768);
    frame(this, 24, 682, 680, 30);
    text(this, 40, 689, 'Eğitsel modeldir; bilimsel bir tahmin değildir.', 14);
    return mute;
  }
  private loadLevel(level: LevelData): void {
    this.resultTracker.reset(level);
    this.counts = { tree: 0, canopy: 0, coolRoof: 0 };
    const retry = this.level?.id === level.id;
    this.intro?.destroy(); this.intro = undefined;
    this.briefing?.destroy();
    this.briefing = undefined;
    const revealObjectives = (): void => {
      if (this.planning && this.level?.id === level.id) this.briefing = new LevelBriefing(this, level, LEVELS[0]?.id === level.id);
    };
    if (!retry) this.intro = new LevelIntro(this, level, LEVELS.findIndex(item => item.id === level.id), revealObjectives);
    this.mechanics.setText(mechanicStatus(level));
    this.toast.hide();
    this.resultModal?.destroy(); this.resultModal = undefined; this.level = level; this.budgetLeft = level.budget; this.selected = null; this.planning = true;
    this.cards.forEach(card => card.destroy()); this.cards = [];
    const levelIndex = LEVELS.findIndex(item => item.id === level.id);
    this.levelChip.setPosition(754, 31).setOrigin(0).setFontSize(17).setWordWrapWidth(240).setText(`Bölüm ${levelIndex + 1} · ${level.name}`);
    this.budgetDisplay.value = level.budget; this.tweens.killTweensOf(this.budgetDisplay); this.budgetLabel.setColor(pixelMode(this) ? '#1B3044' : '#ECF4F6');
    this.levelLabel.setPosition(754, 78).setFontSize(14).setText('Zorluk ' + '●'.repeat(level.difficulty ?? Math.min(4, levelIndex + 1)) + '○'.repeat(4 - (level.difficulty ?? Math.min(4, levelIndex + 1)))); this.budgetLabel.setText(`${level.budget} / ${level.budget}${pixelMode(this) ? '' : ' ₺'}`); this.heatBar.updateValue(planningLoad(level), level.heatThreshold);
    this.hint.setText('Bir araç seç ve haritada uygun bir hücreye yerleştir.');
    level.tools.forEach((id, index) => this.cards.push(new ToolCard(this, 856, 184 + index * 102, TOOLS[id], () => emitEvent('TOOL_SELECTED', { toolId: id }))));
    this.refresh();
    if (retry) revealObjectives();
  }
  private refresh(): void { this.cards.forEach(card => card.refresh(this.budgetLeft, card.tool.id === this.selected, this.planning, this.level?.toolLimits?.[card.tool.id] === undefined ? undefined : Math.max(0, this.level.toolLimits[card.tool.id]! - this.counts[card.tool.id]))); this.start.setEnabled(this.planning); this.undo.setEnabled(this.planning && !!this.level && this.budgetLeft < this.level.budget); }
  private updateBudget(value: number, total: number): void {
    if (value === this.budgetLeft) return;
    const spending = value < this.budgetLeft; this.budgetLeft = value;
    this.tweens.killTweensOf(this.budgetDisplay);
    this.budgetLabel.setColor(spending ? '#F87852' : '#43C6A5');
    this.tweens.add({ targets: this.budgetDisplay, value, duration: 350, ease: 'Cubic.Out', onUpdate: () => this.budgetLabel.setText(Math.round(this.budgetDisplay.value) + ' / ' + total + (pixelMode(this) ? '' : ' ₺')), onComplete: () => this.budgetLabel.setColor(pixelMode(this) ? '#1B3044' : '#ECF4F6') });
  }
  private showResult(result: RunResult): void {
    this.resultModal?.destroy();
    const summary = this.resultTracker.summary(result);
    const hasNext = !!this.level && !!nextPlayable(createLevelManager(), this.level.id, result.success);
    if (pixelMode(this) && this.level && summary) {
      const retry = (): void => { if (this.returning) return; this.resultModal?.destroy(); this.resultModal = undefined; emitEvent('RETRY_REQUESTED'); };
      const next = (): void => { if (this.returning) return; this.resultModal?.destroy(); this.resultModal = undefined; emitEvent('NEXT_LEVEL_REQUESTED'); };
      this.resultModal = pixelResult(this, this.level, result, summary, { retry, map: () => this.requestMap(), next: hasNext ? next : undefined });
      return;
    }
    const modal = new Modal(this, ''); this.resultModal = modal;
    const color = pixelMode(this) ? (result.success ? 0x1e5a47 : 0xa23e3a) : result.success ? COLORS.cool : COLORS.hot;
    if (pixelMode(this)) modal.add(icon(this, 810, 261, 'icon-budget', 38));
    const medallion = this.add.circle(329, 143, 27, color, .16); modal.add(medallion);
    const resultIcon = this.add.graphics().lineStyle(4, color);
    if (result.success) { resultIcon.lineBetween(316, 143, 325, 152); resultIcon.lineBetween(325, 152, 342, 133); }
    else { resultIcon.strokeTriangle(329, 123, 309, 158, 349, 158); resultIcon.lineBetween(329, 135, 329, 146); resultIcon.fillStyle(color).fillCircle(329, 152, 2); }
    modal.add(resultIcon);
    const resultKey = result.success ? 'icon-result-success' : 'icon-result-fail';
    if (pixelMode(this) && this.textures.exists(resultKey)) { medallion.setVisible(false); resultIcon.setVisible(false); modal.add(icon(this, 316, 144, resultKey, 96)); }
    modal.add(text(this, 374, 118, result.success ? 'Teslimat tamamlandı!' : 'Biraz daha gölge gerekli', 30, 610).setFontStyle('bold'));
    modal.add(text(this, 374, 159, result.success ? 'Daha serin bir kent için iyi bir adım.' : 'Yeni bir yerleşimle rotayı serinletebilirsin.', 18, 610).setAlpha(.8));
    modal.add(text(this, 300, 218, 'TOPLAM ISI YÜKÜ', 13).setAlpha(.7));
    const load = text(this, 300, 240, '0', 38).setFontStyle('bold').setColor(pixelMode(this) ? (result.success ? '#1E5A47' : '#A23E3A') : (result.success ? '#43C6A5' : '#F87852')); modal.add(load);
    modal.add(text(this, 422, 256, '/ ' + result.threshold + ' eşik', 19).setAlpha(.75));
    modal.add(text(this, 980, 224, 'HARCANAN BÜTÇE', 13).setOrigin(1, 0).setAlpha(.7));
    modal.add(text(this, 980, 249, result.budgetSpent + (pixelMode(this) ? '' : ' ₺'), 27).setOrigin(1, 0));
    const width = 680, maximum = result.threshold * 1.4;
    const fill = this.add.rectangle(300, 302, 0, 10, color).setOrigin(0);
    modal.add([this.add.rectangle(300, 302, width, 10, COLORS.edge).setOrigin(0), fill, this.add.rectangle(300 + width / 1.4, 307, 2, 20, COLORS.text)]);
    const counter = { value: 0 };
    this.tweens.add({ targets: counter, value: result.totalLoad, duration: 850, ease: 'Cubic.Out', onUpdate: () => { if (load.active) { load.setText(String(Math.round(counter.value))); fill.width = width * Math.min(1, counter.value / maximum); } } });
    modal.add(text(this, 300, 329, result.success ? 'Hedef sağlandı · Isı yükü bölüm eşiğini aşmıyor.' : 'İpucu: Rotanın en sıcak noktalarına gölge ver.', 17, 680).setColor(pixelMode(this) ? (result.success ? '#1E5A47' : '#A23E3A') : (result.success ? '#43C6A5' : '#F0C35C')));
    modal.add(pixelMode(this) ? frame(this, 300, 374, 680, 135) : panel(this, 300, 374, 680, 135).setFillStyle(COLORS.bg));
    modal.add(text(this, 320, 388, 'KENT İÇİN BİR FİKİR', 12).setColor(pixelMode(this) ? '#1E5A47' : '#43C6A5'));
    const card = EDU_CARDS.find(card => this.level?.eduCardIds?.includes(card.id)) ?? EDU_CARDS[0];
    if (card) { modal.add(text(this, 320, 412, card.title, 21).setFontStyle('bold')); modal.add(text(this, 320, 444, card.body, 17, 636)); }
    modal.add(new Button(this, hasNext ? 410 : 505, 563, hasNext ? 220 : 270, 'Yeniden Dene', () => { if (this.returning) return; modal.destroy(); this.resultModal = undefined; emitEvent('RETRY_REQUESTED'); }, true));
    modal.add(new Button(this, hasNext ? 640 : 790, 563, hasNext ? 200 : 270, 'Harita', () => this.requestMap()));
    if (hasNext) modal.add(new Button(this, 870, 563, 220, 'Sonraki Bölüm', () => { if (this.returning) return; modal.destroy(); this.resultModal = undefined; emitEvent('NEXT_LEVEL_REQUESTED'); }));
  }
  private requestMap(): void {
    if (this.returning) return;
    this.resultModal?.destroy(); this.resultModal = undefined; emitEvent('MAP_REQUESTED');
  }
  private returnToMenu(): void {
    if (this.returning) return; this.returning = true;
    this.scene.get(SCENE_KEYS.GAME).cameras.main.fadeOut(220, 16, 28, 44);
    this.cameras.main.fadeOut(220, 16, 28, 44);
    this.time.delayedCall(230, () => { this.scene.stop(SCENE_KEYS.GAME); this.scene.start(SCENE_KEYS.MENU); });
  }
}

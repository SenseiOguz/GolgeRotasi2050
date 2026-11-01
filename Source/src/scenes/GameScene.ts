import Phaser from 'phaser';
import { CityDecor } from '../gameplay/CityDecor';
import { BuildingVisual, availablePixel } from '../gameplay/BuildingVisual';
import { worldDepth, nextHeatmapVisibility } from '../gameplay/visuals';
import { CourierVisual } from '../gameplay/CourierVisual';
import { HeatGround } from '../gameplay/HeatGround';
import { SCENE_KEYS } from '../core/constants';
import { GameEvent, emitEvent, onEvent, offEvent } from '../core/GameEvents';
import type { EventListener, GameEventPayloadMap } from '../core/GameEvents';
import { LEVELS, getLevel } from '../core/levels';
import { canPlace, computeRun, createState, heatToColor, placeTool } from '../core/rules';
import type { GameState } from '../core/types';
import { GRID_LAYOUT, gridCell, tileCenter } from '../ui/layout';
import { renderToken, renderWorldObject } from '../gameplay/renderAdapter';
import { Simulation } from '../gameplay/Simulation';
import { UndoHistory } from '../gameplay/UndoHistory';
import { accessibleTarget } from '../ui/accessibility';
import { affectedArea, heatAlpha, projectedReduction } from '../gameplay/preview';
import { ripple, floatingHeat, finishEffect, stepFeedback } from '../gameplay/fx';
import { sfx } from '../assets/sfx';
import { createLevelManager } from '../core/levelManager';
import { computeStars } from '../core/score';
import { LevelAtmosphere } from '../gameplay/LevelAtmosphere';
import { deliveryFlight, heatWaveCue } from '../gameplay/polishFx';
import { reducedMotion } from '../ui/pixel';

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private cityDecor?: CityDecor;
  private buildings = new Map<string, BuildingVisual>();
  private pixel = false;
  private heatmap = { visible: true };
  private get heatVisible(): boolean { return this.heatmap.visible; }
  private grounds = new Map<string, HeatGround>();
  private history = new UndoHistory();
  private overlays: Phaser.GameObjects.Rectangle[][] = [];
  private tokens = new Map<string, Phaser.GameObjects.Container>();
  private heatTweens = new Map<Phaser.GameObjects.Rectangle, Phaser.Tweens.Tween>();
  private hover!: Phaser.GameObjects.Graphics;
  private previewText!: Phaser.GameObjects.Text;
  private hovered?: { x: number; y: number };
  private courierVisual?: CourierVisual;
  private progress?: Phaser.GameObjects.Graphics;
  private progressMarker?: Phaser.GameObjects.Arc;
  private courier!: Phaser.GameObjects.Container;
  private simulation?: Simulation;
  private cleanups: (() => void)[] = [];
  private deliveries = new Map<string, Phaser.GameObjects.Text>();
  private delivered = 0;
  private resultRecorded = false;
  private atmosphere?: LevelAtmosphere;
  constructor() { super(SCENE_KEYS.GAME); }

  create(data: { levelId?: string } = {}): void {
    this.state = createState(getLevel(data.levelId ?? '') ?? LEVELS[0]);
    this.state.muted = sfx.muted;
    createLevelManager().setLastPlayed(this.state.level.id);
    this.resultRecorded = false;
    this.deliveries.clear();
    this.delivered = 0;
    this.scene.stop(SCENE_KEYS.MENU);
    this.cameras.main.setBackgroundColor(0x101c2c);
    this.history.clear();
    this.overlays = [];
    this.tokens.clear();
    this.heatTweens.clear();
    this.cleanups = [];
    this.simulation = undefined;
    this.courierVisual = undefined;
    this.progress = undefined;
    this.progressMarker = undefined;
    this.hovered = undefined;
    this.pixel = Boolean((this.registry.get('pixelTextureKeys') as string[] | undefined)?.length);
    this.heatmap = { visible: true };
    this.grounds.clear();
    this.buildings.clear();
    this.cityDecor = undefined;
    this.atmosphere = undefined;
    this.drawGrid();
    if (this.pixel) this.cityDecor = new CityDecor(this, this.state);
    if (this.pixel) this.atmosphere = new LevelAtmosphere(this,this.state);
    this.bind(GameEvent.HEATMAP_TOGGLED, ({ visible }) => {
      const next = nextHeatmapVisibility(this.heatmap,visible);
      if (next === this.heatmap) return;
      this.heatmap = next;
      if (this.pixel) this.refresh();
    });
    this.bind(GameEvent.TOOL_SELECTED, ({ toolId }) => {
      if (this.state.phase === 'planning') this.state = { ...this.state, selectedTool: toolId };
      this.updateHover(this.input.activePointer);
    });
    this.bind(GameEvent.SIM_START_REQUESTED, () => this.startRun());
    this.bind(GameEvent.UNDO_REQUESTED, () => {
      const previous = this.history.pop(this.state);
      if (previous !== this.state) {
        const removed = this.state.tiles.flat().find(tile => tile.placed && !previous.tiles[tile.y][tile.x].placed);
        if (removed) { const p = tileCenter(removed.x, removed.y); ripple(this, p.x, p.y, true); }
        this.state = previous;
        this.refresh();
        this.publishState();
      }
    });
    this.bind(GameEvent.RETRY_REQUESTED, () => this.scene.restart({ levelId: this.state.level.id }));
    this.bind(GameEvent.NEXT_LEVEL_REQUESTED, () => {
      const manager = createLevelManager();
      const next = manager.nextId(this.state.level.id);
      if (this.state.phase === 'result' && next && manager.isUnlocked(next)) this.scene.restart({ levelId: next });
    });
    this.bind(GameEvent.MAP_REQUESTED, () => {
      this.simulation?.cancel();
      this.scene.stop(SCENE_KEYS.UI);
      const mapKey = (SCENE_KEYS as Record<string, string>).MAP;
      this.scene.start(mapKey && this.scene.manager.keys[mapKey] ? mapKey : SCENE_KEYS.MENU);
    });
    this.bind(GameEvent.MUTE_TOGGLED, ({ muted }) => { this.state = { ...this.state, muted }; });
    this.input.on('pointermove', this.updateHover, this);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.keyboard?.on('keydown', this.onKey, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.simulation?.cancel();
      this.tweens.killAll();
      this.time.removeAllEvents();
      this.cleanups.forEach(cleanup => cleanup());
      this.cleanups = [];
      this.heatTweens.clear();
      this.tokens.clear();
      this.history.clear();
      this.input.off('pointermove', this.updateHover, this);
      this.input.off('pointerdown', this.onPointerDown, this);
      this.input.keyboard?.off('keydown', this.onKey, this);
    });
    const ui = this.scene.get(SCENE_KEYS.UI);
    const ready = () => this.time.delayedCall(0, () => {
      emitEvent(GameEvent.LEVEL_LOADED, { level: this.state.level });
      emitEvent(GameEvent.HEATMAP_TOGGLED, { visible: this.heatVisible });
      this.publishState();
    });
    if (this.scene.isActive(SCENE_KEYS.UI)) ready();
    else {
      ui.events.once(Phaser.Scenes.Events.CREATE, ready);
      this.cleanups.push(() => ui.events.off(Phaser.Scenes.Events.CREATE, ready));
      this.scene.launch(SCENE_KEYS.UI);
    }
  }

  private bind<K extends keyof GameEventPayloadMap>(event: K, listener: EventListener<K>): void {
    onEvent(event, listener);
    this.cleanups.push(() => offEvent(event, listener));
  }
  private drawGrid(): void {
    for (const row of this.state.tiles) {
      const overlays: Phaser.GameObjects.Rectangle[] = [];
      for (const tile of row) {
        const p = tileCenter(tile.x, tile.y);
        const ground = renderToken(this, tile.type, p.x, p.y, GRID_LAYOUT.tileSize - 4);
        if (this.pixel) {
          const visual = new HeatGround(this, ground);
          this.grounds.set(`${tile.x},${tile.y}`, visual);
          visual.update(tile, this.heatVisible, this.state);
        }
        const blocked = this.state.level.blockedCells?.some(cell => cell.x === tile.x && cell.y === tile.y);
        if (this.pixel && !blocked && ['building','start','goal'].includes(tile.type)) {
          const visual = new BuildingVisual(this,p.x,p.y, this.state.level.difficulty === 3 || (this.state.level.difficulty === 4 && tile.x % 3 === 0));
          this.buildings.set(tile.x + ',' + tile.y, visual);
          const replacement = tile.type === 'building' ? availablePixel(this,'bldg-' + 'a-hot') : availablePixel(this,tile.type === 'start' ? 'bldg-depot' : 'bldg-hospital');
          if (replacement) {
            ground.list.forEach(child => (child as Phaser.GameObjects.Image).setVisible(false));
            const lot = availablePixel(this,'tile-lot');
            if (lot) ground.add(this.add.image(0,0,lot).setDisplaySize(80,80));
            else if (tile.type !== 'building') ground.add(this.add.image(0,0,'tile-' + tile.type).setDisplaySize(80,80));
            else ground.add(this.add.rectangle(0,0,80,80,0x66717a));
          }
          visual.update(tile);
        }
        const native = document.createElement('button');
        const names = { building: 'Bina', park: 'Park', road: 'Yol', water: 'Su', start: 'Başlangıç', goal: 'Sağlık merkezi' };
        native.textContent = `Hücre ${tile.x},${tile.y} — ${names[tile.type]}`;
        native.onclick = () => this.placeAt(tile.x, tile.y);
        native.onpointerenter = native.onfocus = () => this.showPreview(tile.x, tile.y);
        native.onpointerleave = native.onblur = () => { this.hovered = undefined; this.hover.clear(); this.previewText.setVisible(false); this.cityDecor?.update(this.state); };
        accessibleTarget(this, ground, native, { x: -38, y: -38, width: 76, height: 76 }, () => { native.disabled = this.state.phase !== 'planning'; });
        overlays.push(this.add.rectangle(p.x, p.y, 76, 76, heatToColor(tile.heat), heatAlpha(tile.heat)).setStrokeStyle(2, heatToColor(tile.heat), 0.75).setVisible(!this.pixel));
      }
      this.overlays.push(overlays);
    }
    const route = this.add.graphics().setDepth(this.pixel ? 4 : 1);
    const cells = this.state.level.route;
    cells.forEach((cell, i) => {
      const p = tileCenter(cell.x, cell.y);
      route.fillStyle(0xecf4f6, 0.055).fillRoundedRect(p.x - 35, p.y - 35, 70, 70, 8);
      if (i === cells.length - 1) return;
      const next = tileCenter(cells[i + 1].x, cells[i + 1].y);
      route.lineStyle(12, 0x101c2c, 0.3).lineBetween(p.x, p.y, next.x, next.y);
      route.lineStyle(3, 0xecf4f6, 0.75).lineBetween(p.x, p.y, next.x, next.y);
      const dx = (next.x - p.x) / 80, dy = (next.y - p.y) / 80;
      const x = (p.x + next.x) / 2, y = (p.y + next.y) / 2;
      route.lineStyle(2, 0xecf4f6, 0.9);
      route.lineBetween(x - dx * 5 - dy * 5, y - dy * 5 + dx * 5, x + dx * 3, y + dy * 3);
      route.lineBetween(x - dx * 5 + dy * 5, y - dy * 5 - dx * 5, x + dx * 3, y + dy * 3);
      if (!reducedMotion()) {
        const shimmer = this.add.rectangle(p.x, p.y - 29, 34, 2, 0xf87852).setDepth(2);
        this.tweens.add({ targets: shimmer, alpha: 0.15, scaleX: 0.6, duration: 1100 + i * 35, yoyo: true, repeat: -1 });
        const sync = () => shimmer.setVisible(this.state.tiles[cell.y][cell.x].heat >= 85 && (!this.pixel || this.heatVisible));
        this.events.on(Phaser.Scenes.Events.POST_UPDATE, sync);
        this.cleanups.push(() => this.events.off(Phaser.Scenes.Events.POST_UPDATE, sync));
      }
    });
    for (const cell of [cells[0], cells[cells.length - 1]]) {
      const p = tileCenter(cell.x, cell.y);
      const marker = this.add.circle(p.x, p.y, 26).setStrokeStyle(2, cell === cells[0] ? 0x43c6a5 : 0xf0c35c, 0.8).setDepth(2);
      if (!reducedMotion()) this.tweens.add({ targets: marker, scale: 1.1, alpha: 0.45, duration: 1400, yoyo: true, repeat: -1 });
    }
    for (const cell of this.state.level.blockedCells ?? []) {
      const p = tileCenter(cell.x, cell.y);
      const key = this.pixel ? availablePixel(this, 'tile-construction') : undefined;
      if (key) this.add.image(p.x, p.y, key).setDisplaySize(80,80).setDepth(.25);
      else {
        const hatch = this.add.graphics().setDepth(4.3);
        hatch.fillStyle(0x101c2c,.65).fillRect(p.x-36,p.y-36,72,72);
        hatch.lineStyle(3,0xf0c35c,.8);
        for (let offset=-60;offset<=60;offset+=16) {
          const from=Math.max(-34,offset-34), to=Math.min(34,offset+34);
          hatch.lineBetween(p.x+from,p.y+offset-from,p.x+to,p.y+offset-to);
        }
      }
      const cone = this.pixel ? availablePixel(this,'decor-cone') : undefined;
      // Native x2, bottom at +34, shadow at (+6,+4); all bounds stay inside the cell.
      if (cone) renderWorldObject(this,cone,'road',p.x+8,p.y-6).setDepth(worldDepth(p.y+34));
    }
    for (const cell of this.state.level.deliveries ?? []) {
      const p=tileCenter(cell.x,cell.y);
      const marker=this.add.text(p.x+20,p.y-25,'◆',{fontSize:'18px',color:'#F0C35C',backgroundColor:'#101C2C'}).setOrigin(.5).setDepth(5);
      this.deliveries.set(`${cell.x},${cell.y}`,marker);
    }
    this.hover = this.add.graphics().setDepth(5);
    this.previewText = this.add.text(0, 0, '', { fontSize: '16px', fontFamily: 'Arial', color: '#ECF4F6', backgroundColor: '#101C2C', padding: { x: 7, y: 4 } }).setDepth(7).setVisible(false);
    const start = tileCenter(this.state.level.route[0].x, this.state.level.route[0].y);
    this.courier = renderToken(this, 'courier', start.x, start.y, 48).setDepth(6).setVisible(false);
    if (this.pixel) {
      this.courierVisual = new CourierVisual(this,this.courier);
      this.progress = this.add.graphics().setDepth(4.1);
      this.progressMarker = this.add.circle(start.x,start.y,5,0x43c6a5).setDepth(4.2).setVisible(false);
    }
  }
  private refresh(placed?: { x: number; y: number }): void {
    this.cityDecor?.update(this.state);
    for (const [key, token] of this.tokens) {
      const [x, y] = key.split(',').map(Number);
      if (this.state.tiles[y][x].placed) continue;
      this.tokens.delete(key);
      this.tweens.killTweensOf(token);
      this.tweens.add({ targets: token, alpha: 0, scale: 0.7, duration: 180, onComplete: () => token.destroy() });
    }
    for (const row of this.state.tiles) for (const tile of row) {
      if (this.pixel) this.grounds.get(`${tile.x},${tile.y}`)?.update(tile, this.heatVisible, this.state);
      if (this.pixel) this.buildings.get(tile.x + ',' + tile.y)?.update(tile, placed?.x === tile.x && placed.y === tile.y);
      const overlay = this.overlays[tile.y][tile.x];
      this.tweens.killTweensOf(overlay);
      this.heatTweens.get(overlay)?.remove();
      const from = Phaser.Display.Color.IntegerToColor(overlay.fillColor);
      const to = Phaser.Display.Color.IntegerToColor(heatToColor(tile.heat));
      this.tweens.add({ targets: overlay, fillAlpha: heatAlpha(tile.heat), duration: 350 });
      this.heatTweens.set(overlay, this.tweens.addCounter({ from: 0, to: 100, duration: 350, onUpdate: tween => {
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, tween.getValue() ?? 100);
        overlay.setFillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), overlay.fillAlpha).setStrokeStyle(2, heatToColor(tile.heat), 0.75);
      } }));
      if (tile.placed && !(this.pixel && tile.placed === 'coolRoof') && !this.tokens.has(`${tile.x},${tile.y}`)) {
        const p = tileCenter(tile.x, tile.y);
        const key = this.pixel ? availablePixel(this, tile.placed === 'tree' ? 'tool-tree' : 'tool-canopy') : undefined;
        const token = (key ? renderWorldObject(this,key,tile.placed,p.x,p.y) : renderToken(this,tile.placed,p.x,p.y,36)).setDepth(this.pixel ? worldDepth(p.y) : 3);
        this.tokens.set(`${tile.x},${tile.y}`, token);
        if (placed?.x === tile.x && placed.y === tile.y) {
          ripple(this, p.x, p.y);
          token.setScale(0.2);
          this.tweens.add({ targets: token, scale: 1, duration: 400, ease: 'Back.easeOut' });
        }
      }
    }
    this.updateHover(this.input.activePointer);
  }
  private showPreview(x: number, y: number): void {
    this.hovered = { x, y };
    this.hover.clear();
    this.previewText.setVisible(false);
    const tool = this.state.selectedTool;
    const preview = tool && this.state.phase === 'planning' ? affectedArea(this.state,x,y,tool) : [];
    this.cityDecor?.update(this.state,preview);
    if (!tool || this.state.phase !== 'planning') return;
    const valid = canPlace(this.state, x, y, tool).ok;
    const color = valid ? 0x43c6a5 : 0xf87852;
    for (const cell of preview) {
      const p = tileCenter(cell.x, cell.y);
      this.hover.fillStyle(color, 0.1).fillRoundedRect(p.x - 36, p.y - 36, 72, 72, 6);
      this.hover.lineStyle(3, color, 0.95).strokeRoundedRect(p.x - 36, p.y - 36, 72, 72, 6);
    }
    const p = tileCenter(x, y);
    if (!valid) {
      this.hover.lineStyle(3, color).lineBetween(p.x - 7, p.y - 7, p.x + 7, p.y + 7);
      this.hover.lineBetween(p.x + 7, p.y - 7, p.x - 7, p.y + 7);
    } else {
      this.previewText.setText('\u2212' + projectedReduction(this.state, x, y, tool) + ' rota \u0131s\u0131 y\u00fck\u00fc').setPosition(Math.min(p.x - 32, 650), Math.max(122, p.y - 38)).setVisible(true);
    }
  }
  private updateHover(pointer: Phaser.Input.Pointer): void {
    const cell = this.hovered ?? gridCell(pointer.x, pointer.y);
    if (cell) this.showPreview(cell.x, cell.y);
    else { this.hover.clear(); this.previewText.setVisible(false); this.cityDecor?.update(this.state); }
  }
  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const cell = gridCell(pointer.x, pointer.y);
    if (cell) this.placeAt(cell.x, cell.y);
  }
  private placeAt(x: number, y: number): void {
    if (this.state.phase !== 'planning') return;
    const cell = { x, y };
    const { state, result } = placeTool(this.state, cell.x, cell.y, this.state.selectedTool);
    if (!result.ok) { emitEvent(GameEvent.PLACEMENT_REJECTED, { ...cell, reason: result.reason }); return; }
    this.history.push(this.state);
    this.state = state;
    this.refresh(cell);
    emitEvent(GameEvent.TOOL_PLACED, { ...cell, toolId: state.selectedTool!, budgetLeft: state.budgetLeft });
    this.publishState();
  }
  private publishState(): void {
    emitEvent(GameEvent.BUDGET_CHANGED, { budgetLeft: this.state.budgetLeft, budget: this.state.level.budget });
    emitEvent(GameEvent.HEAT_UPDATED, { tiles: this.state.tiles });
  }
  private startRun(): void {
    if (this.state.phase !== 'planning') return;
    this.state = { ...this.state, phase: 'simulating' };
    this.hover.clear();
    this.previewText.setVisible(false);
    this.cityDecor?.update(this.state);
    const result = computeRun(this.state);
    const wave = this.state.level.heatWave;
    if (wave) {
      const banner=this.add.text(432,125,'Isı dalgası: turuncu rota adımlarına dikkat!',{fontSize:'16px',color:'#F0C35C',backgroundColor:'#101C2C',padding:{x:8,y:4}}).setOrigin(.5,0).setDepth(9);
      if (reducedMotion()) this.time.delayedCall(2200,()=>banner.destroy());
      else this.tweens.add({targets:banner,alpha:0,delay:1800,duration:400,onComplete:()=>banner.destroy()});
    }
    this.courier.setVisible(true);
    emitEvent(GameEvent.SIM_STARTED);
    this.simulation = new Simulation(this);
    this.simulation.play(this.courier, result, step => {
      emitEvent(GameEvent.SIM_STEP, { step });
      const center = tileCenter(step.x, step.y);
      floatingHeat(this, center.x, center.y, step.heat);
      if (wave && step.index >= wave.fromStep && step.index <= wave.toStep && !reducedMotion()) {
        this.atmosphere?.heatStep(center.x,center.y,step.heat);
        if (this.pixel) heatWaveCue(this,center.x,center.y);
        const haze=this.add.rectangle(center.x,center.y,76,76,0xf87852,.35).setDepth(4.5);
        this.tweens.add({targets:haze,alpha:0,duration:550,onComplete:()=>haze.destroy()});
      }
      const delivery=this.deliveries.get(`${step.x},${step.y}`);
      if (delivery) {
        this.deliveries.delete(`${step.x},${step.y}`);
        this.delivered++;
        if (this.pixel) {
          delivery.setText('✓').setColor('#43C6A5');
          deliveryFlight(this,center.x,center.y,110,116);
        } else {
          delivery.setText('Teslim edildi').setColor('#43C6A5');
          this.tweens.add({targets:delivery,y:delivery.y-24,alpha:0,duration:700,onComplete:()=>delivery.destroy()});
        }
      }
      if (this.pixel) {
        stepFeedback(this,center.x,center.y,step.heat);
        if (step.index > 0) {
          const previous = tileCenter(result.steps[step.index-1].x,result.steps[step.index-1].y);
          this.progress?.lineStyle(4,0x43c6a5,.9).lineBetween(previous.x,previous.y,center.x,center.y);
        }
      }
      if (!this.pixel && step.heat >= 80) {
        const p = tileCenter(step.x, step.y);
        const flash = this.add.rectangle(p.x, p.y, 76, 76, 0xf87852, 0.65).setDepth(4);
        this.tweens.add({ targets: flash, alpha: 0, duration: 250, onComplete: () => flash.destroy() });
      }
    }, () => {
      const goal = result.steps[result.steps.length - 1];
      const p = tileCenter(goal.x, goal.y);
      this.courierVisual?.deliver();
      finishEffect(this, p.x, p.y, result.success, this.pixel);
      this.time.delayedCall(550, () => {
        this.state = { ...this.state, phase: 'result' };
        if (!this.resultRecorded) {
          this.resultRecorded = true;
          const baseline = computeRun(createState(this.state.level)).totalLoad;
          const stars = computeStars(this.state.level,result,baseline).stars;
          createLevelManager().recordResult(this.state.level.id,result.success,stars,result.totalLoad);
        }
        emitEvent(GameEvent.SIM_FINISHED, { result });
      });
    }, this.pixel ? {
      move: (dx, dy) => this.courierVisual?.move(dx, dy),
      update: progress => {
        this.courierVisual?.update(progress);
        this.progressMarker?.setPosition(this.courier.x, this.courier.y).setVisible(true);
      },
      idle: () => this.courierVisual?.idle(),
    } : undefined);
  }
  private onKey(event: KeyboardEvent): void {
    if (event.repeat) return;
    const tool = this.state.level.tools[Number(event.key) - 1];
    if (tool) emitEvent(GameEvent.TOOL_SELECTED, { toolId: tool });
    if (event.code === 'Space') { event.preventDefault(); emitEvent(GameEvent.SIM_START_REQUESTED); }
    if (event.key.toLowerCase() === 'h') emitEvent(GameEvent.HEATMAP_TOGGLED, { visible: !this.heatVisible });
    if (event.key.toLowerCase() === 'z') emitEvent(GameEvent.UNDO_REQUESTED);
  }
}

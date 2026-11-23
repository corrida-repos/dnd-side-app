import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { JourneyStage, State } from './types';
import { arrivalNote, intoTheUnknown, trueDistance } from '../rules/uncharted';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.settings.coldNights = false;
  s.settings.navigation = false;
  s.settings.encounters = false;
  s.characters = [newCharacter({ name: 'Mapper', wisMod: 3, level: 5, rationsLb: 10, waterPints: 4, waterCapacityPints: 8 })];
  s.characters[0].inventory.push({ id: 'ct', name: "Cartographer's Tools", qty: 1, weight: 6, source: 'manual', valueGp: 15, container: null, ammo: null });
  s.place.waterSource = true;
  s.place.settlement = false;
  s.minutes = 7 * 60;
  s.watchPlan = { count: 4, slots: [[], [], [], []] };
  s.log = [];
  patch(s);
  return s;
}

const stage = (patch: Partial<JourneyStage> = {}): JourneyStage => ({ id: 'j', name: 'Monastery Road', miles: 24, terrain: 'grassland', onRoute: false, goodRoad: false, difficult: false, milesDone: 0, done: false, notes: '', uncharted: true, ...patch });

describe('uncharted land (rules)', () => {
  it('turns a guess into a real distance on 1d6', () => {
    expect(trueDistance(24, 1)).toBe(18);
    expect(trueDistance(24, 3)).toBe(24);
    expect(trueDistance(24, 5)).toBe(30);
    expect(trueDistance(24, 6)).toBe(36);
    expect(trueDistance(1, 1)).toBe(1);
  });

  it('describes the arrival and the land ahead in words', () => {
    expect(arrivalNote(24, 18)).toContain('closer than anyone thought');
    expect(arrivalNote(24, 36)).toContain('much further');
    expect(intoTheUnknown('forest', 7)).toMatch(/trees|woods/);
  });
});

describe('uncharted journey stages', () => {
  it('rolls the real distance secretly, warns when overdue and reveals it on arrival', () => {
    const s = fresh((d) => d.journey.push(stage()));
    const n = E.runStage(s, ctx(0.999), 'j', { pace: 'normal', foragerIds: [], navigatorId: null }, true);
    expect(n.journey[0]).toMatchObject({ trueMiles: 36, milesDone: 36, done: true, overdueNoted: true });
    const text = n.log.map((l) => l.text).join('\n');
    expect(text).toContain('guesses it');
    expect(text).toContain('no sign of their destination');
    expect(text).toContain('much further than anyone thought');
  });

  it('charts the way on arrival, and the map then shows the real distance', () => {
    const s = fresh((d) => d.journey.push(stage()));
    const n = E.runStage(s, ctx(0.999), 'j', { pace: 'normal', foragerIds: [], navigatorId: null, mapperId: s.characters[0].id }, true);
    expect(n.characters[0].inventory.some((i) => i.name === 'Map of Monastery Road')).toBe(true);
    const back = { ...n, journey: [stage({ id: 'k' })], log: [] };
    const again = E.runStage(back, ctx(0.999), 'k', { pace: 'normal', foragerIds: [], navigatorId: null }, true);
    expect(again.journey[0].trueMiles).toBe(24);
    expect(again.log.some((l) => l.text.includes('Map of Monastery Road shows the way'))).toBe(true);
  });

  it("can't chart at a Fast pace, and the rule switched off treats the miles as known", () => {
    const s = fresh((d) => d.journey.push(stage()));
    const fast = E.runStage(s, ctx(0.999), 'j', { pace: 'fast', foragerIds: [], navigatorId: null, mapperId: s.characters[0].id }, true);
    expect(fast.characters[0].inventory.some((i) => i.name.startsWith('Map of'))).toBe(false);
    const off = fresh((d) => ((d.settings.unchartedLand = false), d.journey.push(stage())));
    const n = E.runStage(off, ctx(0.999), 'j', { pace: 'normal', foragerIds: [], navigatorId: null }, true);
    expect(n.journey[0]).toMatchObject({ milesDone: 24, done: true });
    expect(n.journey[0].trueMiles).toBeUndefined();
  });

  it('uses a map of the stage to navigate while travelling it', () => {
    const s = fresh((d) => {
      d.settings.navigation = true;
      d.characters[0].survival = 0;
      d.characters[0].inventory.push({ id: 'm', name: 'Map of Monastery Road', qty: 1, weight: 0, source: 'manual', valueGp: 1, container: null, ammo: null });
      d.journey.push(stage({ terrain: 'forest' }));
    });
    const n = E.runStage(s, ctx(0.5), 'j', { pace: 'normal', foragerIds: [], navigatorId: s.characters[0].id }, false);
    expect(n.log.some((l) => l.text.includes('using the Map of Monastery Road'))).toBe(true);
    expect(n.travel.stageName).toBeUndefined();
  });
});

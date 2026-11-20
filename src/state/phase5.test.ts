import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { clampPace, maxPaceFor, TERRAIN } from '../rules/terrain';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const HIGH = ctx(0.999);
const LOW = ctx(0);

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'A', needsFood: false, needsWater: false, survival: 2, wisMod: 1, gp: 100 })];
  s.minutes = 8 * 60;
  s.log = [];
  patch(s);
  return s;
}

describe('travel terrain', () => {
  it('limits pace by terrain, one step faster on a good road', () => {
    expect(maxPaceFor('mountain', false)).toBe('slow');
    expect(maxPaceFor('mountain', true)).toBe('normal');
    expect(maxPaceFor('grassland', true)).toBe('fast');
    expect(clampPace('fast', 'swamp', false)).toBe('slow');
    const s = fresh((d) => ((d.place.terrain = 'swamp'), (d.place.goodRoad = false)));
    const n = E.travel(s, ctx(), { hours: 2, pace: 'fast', difficult: false, foragerIds: [] });
    expect(n.travel.milesToday).toBe(4);
    expect(n.log.some((l) => l.text.includes('only allows a slow pace'))).toBe(true);
  });

  it('uses the terrain DCs for navigation and foraging, with food for each day of the trip', () => {
    expect(TERRAIN.coastal.navigationDC).toBe(5);
    const s = fresh((d) => ((d.place.terrain = 'grassland'), (d.place.onRoute = false)));
    expect(E.currentNavigationDC(s).dc).toBe(5);
    s.place.onRoute = true;
    expect(E.currentNavigationDC(s).dc).toBeNull();
    s.stores = { foodLb: 0, waterGal: 0, foodRawLb: 0, waterUnsafeGal: 0 };
    s.settings.rawFoodRisk = false;
    s.settings.wildNeedsPurifying = false;
    const trip = E.travel(s, HIGH, { hours: 16, pace: 'normal', difficult: false, foragerIds: [s.characters[0].id] });
    expect(trip.stores.foodLb).toBe(14); // (6 + 1) per day for 2 days
  });
});

describe('2024 hazards', () => {
  it('only gives heat Disadvantage for heavy clothing under the 2014 rule', () => {
    const s = fresh((d) => {
      d.minutes = 12 * 60;
      d.weather = { ...d.weather, high: 115, low: 112 };
      d.place.waterSource = false;
      d.stores.waterGal = 0;
      d.characters[0] = newCharacter({ name: 'Robed', heavyGarb: true, waterPints: 0, needsFood: false, needsWater: false });
      d.settings.autoRollSaves = false;
    });
    expect(E.advance(s, ctx(), 60).pending[0].mode).toBe('normal');
    s.settings.heavyClothing2014 = true;
    expect(E.advance(s, ctx(), 60).pending[0].mode).toBe('disadvantage');
  });

  it('spares creatures adapted to icy water, and suffocation Exhaustion clears on breathing again', () => {
    const s = fresh((d) => ((d.characters[0].conScore = 10), (d.characters[0].coldWaterAdapted = true)));
    expect(E.frigidWater(s, LOW, s.characters[0].id, 15).characters[0].exhaustion).toBe(0);
    const air = fresh();
    const choke = E.suffocate(air, ctx(), air.characters[0].id, 2);
    expect(choke.characters[0].exhaustionCauses).toEqual(['suffocation', 'suffocation']);
    expect(E.breatheAgain(choke, ctx(), air.characters[0].id).characters[0].exhaustion).toBe(0);
  });
});

describe('crafting, lifestyle and feed', () => {
  it('counts only one helper unless the DM allows more', () => {
    const s = fresh((d) => {
      d.characters.push(newCharacter({ name: 'B' }), newCharacter({ name: 'C' }));
      d.projects = [{ id: 'p', name: 'Plate', kind: 'nonmagical', charIds: d.characters.map((c) => c.id), daysRequired: 10, daysDone: 0, costGp: 750, notes: '', done: false }];
    });
    expect(E.workOnProjects(s, ctx(), ['p']).projects[0].daysDone).toBe(2);
    s.settings.extraCraftHelpers = true;
    expect(E.workOnProjects(s, ctx(), ['p']).projects[0].daysDone).toBe(3);
  });

  it('can charge lifestyle weekly instead of daily', () => {
    const s = fresh((d) => {
      d.place.settlement = true;
      d.settings.lifestylePeriod = 'week';
      d.characters[0].lifestyle = 'modest';
      d.dayIndex = 6;
      d.minutes = 23 * 60;
    });
    expect(E.advance(s, ctx(), 60).characters[0].gp).toBe(93);
    s.dayIndex = 3;
    expect(E.advance(s, ctx(), 60).characters[0].gp).toBe(100);
  });

  it('weighs mount feed at 10 lb per day', () => {
    const s = fresh((d) => d.characters.push(newCharacter({ name: 'Horse', kind: 'mount', size: 'Large', rationsLb: 8, waterPints: 0, waterCapacityPints: 0, gp: 0 })));
    expect(E.carriedLoad(s, s.characters[1]).food).toBe(20);
  });
});

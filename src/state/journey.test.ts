import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.settings.coldNights = false;
  s.characters = [newCharacter({ name: 'A', rationsLb: 10, waterPints: 4, waterCapacityPints: 8 })];
  s.place.waterSource = true;
  s.place.settlement = false;
  s.minutes = 7 * 60;
  s.watchPlan = { count: 4, slots: [[], [], [], []] };
  s.log = [];
  patch(s);
  return s;
}

describe('journeys', () => {
  it('runs a multi-day stage, camping each night', () => {
    const s = fresh((d) => d.journey.push({ id: 'j', name: 'To Sharn', miles: 48, terrain: 'grassland', onRoute: true, goodRoad: true, difficult: false, milesDone: 0, done: false, notes: '' }));
    const n = E.runStage(s, ctx(), 'j', { pace: 'normal', foragerIds: [], navigatorId: null }, true);
    expect(n.journey[0]).toMatchObject({ milesDone: 48, done: true });
    expect(n.dayIndex).toBe(s.dayIndex + 1);
    expect(n.characters[0].exhaustion).toBe(0);
  });

  it('gallops once until the mounts rest, and sails at a vessel’s speed with no forced march', () => {
    const s = fresh((d) => d.characters.push(newCharacter({ name: 'Horse', kind: 'mount', size: 'Large', tasks: [] })));
    const g = E.travel(s, ctx(), { hours: 2, pace: 'normal', difficult: false, foragerIds: [], gallop: true });
    expect(g.travel.milesToday).toBe(9);
    expect(E.travel(g, ctx(), { hours: 1, pace: 'normal', difficult: false, foragerIds: [], gallop: true }).travel.milesToday).toBe(12);
    const calm = E.createStash(fresh(), ctx(), 'Sea Wolf', 'vehicle', '', 200000, 2);
    expect(E.travel(calm, ctx(), { hours: 4, pace: 'normal', difficult: false, foragerIds: [], vesselId: calm.stashes[0].id }).travel.milesToday).toBe(0);
    const ship = E.createStash(fresh((d) => (d.weather.wind = 'light')), ctx(), 'Sea Wolf', 'vehicle', '', 200000, 2);
    const sailed = E.travel(ship, ctx(), { hours: 24, pace: 'normal', difficult: false, foragerIds: [], vesselId: ship.stashes[0].id });
    expect(sailed.travel.milesToday).toBe(48);
    expect(sailed.characters[0].exhaustionCauses).not.toContain('march');
    const strong = E.createStash(fresh((d) => (d.weather.wind = 'strong')), ctx(), 'Sea Wolf', 'vehicle', '', 200000, 2);
    expect(E.travel(strong, ctx(), { hours: 2, pace: 'normal', difficult: false, foragerIds: [], vesselId: strong.stashes[0].id, againstWind: true }).travel.milesToday).toBe(2);
  });
});

describe('class features on a Short Rest', () => {
  it('Ranger Tireless removes Exhaustion, and Bards from level 5 regain Bardic Inspiration', () => {
    const s = fresh((d) => {
      d.characters = [
        newCharacter({ name: 'R', className: 'Ranger', level: 10, exhaustion: 2, exhaustionCauses: ['march', 'march'] }),
        newCharacter({ name: 'B', className: 'Bard', level: 5, resources: [{ id: 'bi', name: 'Bardic Inspiration', max: 3, current: 0, recharge: 'long' }] }),
      ];
    });
    const n = E.shortRest(s, ctx());
    expect(n.characters[0].exhaustion).toBe(1);
    expect(n.characters[1].resources[0].current).toBe(3);
  });

  it('forces a Slow pace when someone is down to half Speed, and flying ignores terrain limits', () => {
    const s = fresh((d) => {
      d.place.terrain = 'mountain';
      d.characters.push(newCharacter({ name: 'Tired', exhaustion: 3, exhaustionCauses: ['march', 'march', 'march'] }));
    });
    expect(E.slowTravelers(s)).toEqual(['Tired']);
    expect(E.travel(s, ctx(), { hours: 1, pace: 'fast', difficult: false, foragerIds: [] }).travel.milesToday).toBe(2);
    const fly = fresh((d) => (d.place.terrain = 'mountain'));
    expect(E.travel(fly, ctx(), { hours: 1, pace: 'fast', difficult: true, foragerIds: [], flying: true }).travel.milesToday).toBe(4);
  });
});

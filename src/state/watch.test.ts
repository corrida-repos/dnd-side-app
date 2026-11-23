import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { autoAssign, slotTimes, watchSight } from '../rules/watch';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.settings.coldNights = false;
  s.characters = [
    newCharacter({ name: 'Human', passivePerception: 12, needsFood: false, needsWater: false, exhaustion: 1, exhaustionCauses: ['other'] }),
    newCharacter({ name: 'Elf', passivePerception: 14, darkvision: 60, trance: true, needsFood: false, needsWater: false, exhaustion: 1, exhaustionCauses: ['other'] }),
  ];
  s.minutes = 22 * 60;
  s.fire = { lit: false, fuelHours: 0, sheltered: false };
  s.settings.moonOffset = -s.dayIndex; // a new moon: no moonlight
  s.log = [];
  patch(s);
  return s;
}

describe('watch rules', () => {
  it('splits the night and shares watches out', () => {
    expect(slotTimes(22 * 60, 4).map((t) => t.from / 60)).toEqual([22, 24, 26, 28]);
    expect(autoAssign(['a', 'b', 'c'], 4, 1)).toEqual([['a'], ['b'], ['c'], ['a']]);
    expect(autoAssign(['a', 'b', 'c'], 2, 2)).toEqual([['a', 'b'], ['c', 'a']]);
  });

  it('judges sight by light and darkvision', () => {
    expect(watchSight('Night', false, 0, false)).toMatchObject({ penalty: -5, blind: true });
    expect(watchSight('Night', false, 60, false)).toMatchObject({ penalty: -5, blind: false });
    expect(watchSight('Night', true, 0, false)).toMatchObject({ penalty: 0, blind: false });
    expect(watchSight('Dusk', false, 0, false).penalty).toBe(-5);
    expect(watchSight('Day', false, 0, false).penalty).toBe(0);
    expect(watchSight('Dusk', false, 60, false).penalty).toBe(0); // Darkvision: Dim Light as Bright
    expect(watchSight('Night', false, 0, false, { fullMoon: true })).toMatchObject({ penalty: -5, blind: false });
    expect(watchSight('Night', true, 0, false, { obscured: 'heavy rain' }).penalty).toBe(-5);
  });
});

describe('night watch plan', () => {
  it('shows times, passive Perception by light, and the load per watcher', () => {
    const s = fresh((d) => (d.watchPlan = { count: 4, slots: [[d.characters[0].id], [d.characters[1].id], [d.characters[1].id], [d.characters[0].id]] }));
    const plan = E.planWatches(s);
    expect(plan.map((p) => p.from)).toEqual([1320, 1440, 1560, 1680]);
    expect(plan[0].watchers[0]).toMatchObject({ passive: 7, sight: { blind: true } }); // hearing only: never better than Darkvision
    expect(plan[1].watchers[0]).toMatchObject({ passive: 9, sight: { blind: false } });
    const lit = fresh((d) => {
      d.watchPlan = { count: 4, slots: [[d.characters[0].id], [], [], []] };
      d.fire = { lit: true, fuelHours: 3, sheltered: false };
    });
    expect(E.planWatches(lit)[0].watchers[0].sight.blind).toBe(false);
    expect(E.watchLoad(s)).toEqual({ [s.characters[0].id]: 240, [s.characters[1].id]: 240 });
  });

  it('denies Long Rest benefits to anyone who watches too long, but Trance allows 4 hours', () => {
    const s = fresh((d) => (d.watchPlan = { count: 4, slots: [[d.characters[0].id], [d.characters[1].id], [d.characters[1].id], [d.characters[0].id]] }));
    const n = E.longRest(s, ctx(), false);
    expect(n.characters.map((c) => c.exhaustion)).toEqual([1, 0]); // the human watched 4 h, the elf trances
    expect(n.log.some((l) => l.text.includes('Human spent 4 h on watch'))).toBe(true);
    const fair = fresh((d) => (d.watchPlan = { count: 4, slots: [[d.characters[0].id], [d.characters[1].id], [d.characters[1].id], [d.characters[1].id]] }));
    expect(E.longRest(fair, ctx(), false).characters.map((c) => c.exhaustion)).toEqual([0, 1]); // elf watched 6 h
  });

  it('starts a new game with the watches shared out', () => {
    const s = createDefaultState(() => 0);
    expect(s.watchPlan.slots.flat()).toHaveLength(3); // three people, 2 hours each: the last watch stays open rather than cost someone their rest
  });
});

describe('sharing watches fairly', () => {
  it('never gives anyone more than they can stand, leaving a watch empty instead', () => {
    expect(autoAssign(['a', 'b', 'c'], 4, 1, { a: 1, b: 1, c: 1 })).toEqual([['a'], ['b'], ['c'], []]);
    expect(autoAssign(['a', 'b', 'c'], 4, 1, { a: 1, b: 1, c: 2 })).toEqual([['a'], ['b'], ['c'], ['c']]);
    const s = createDefaultState(() => 0);
    const load = E.watchLoad(s);
    expect(Math.max(...Object.values(load))).toBeLessThanOrEqual(120);
  });
});

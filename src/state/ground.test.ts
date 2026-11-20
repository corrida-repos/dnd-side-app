import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import { groundDifficulty } from '../rules/ground';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
function trip() {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.settings.coldNights = false;
  s.characters = [newCharacter({ name: 'A', needsFood: false, needsWater: false, hp: 30, maxHp: 30 }), newCharacter({ name: 'B', needsFood: false, needsWater: false, hp: 30, maxHp: 30 })];
  s.minutes = 7 * 60;
  return s;
}

describe('ground and obstacles', () => {
  it('snow builds up over cold snowy days until travel is Difficult Terrain', () => {
    expect(groundDifficulty({ snowIn: 12, mudDays: 0 }, true)).toMatch(/snow/);
    expect(groundDifficulty({ snowIn: 0, mudDays: 2 }, true)).toBeNull();
    expect(groundDifficulty({ snowIn: 0, mudDays: 2 }, false)).toBe('deep mud');
    const s = trip();
    s.place.ground = { snowIn: 12, mudDays: 0 };
    s.place.terrain = 'grassland';
    expect(E.travel(s, ctx(), { hours: 2, pace: 'normal', difficult: false, foragerIds: [] }).travel.milesToday).toBe(3);
  });

  it('a failed group check against a forest fire burns everyone', () => {
    let s = trip();
    s.journey = [{ id: 'j', name: 'Woods', miles: 10, terrain: 'forest', onRoute: true, goodRoad: false, difficult: false, milesDone: 0, done: false, notes: '' }];
    s = E.addObstacle(s, ctx(), 'j', { name: 'Forest fire', check: 'Wisdom (Survival)', dc: 15, group: true, consequence: 'damage', amount: '4d10' });
    s = E.resolveObstacle(s, ctx(0.1), 'j', s.journey[0].obstacles![0].id, 0, null);
    expect(s.journey[0].obstacles![0].resolved).toBe('failed');
    expect(s.characters.every((c) => c.hp < 30)).toBe(true);
  });
});

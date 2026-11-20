import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const LOW = ctx(0); // d20 = 1, d4 = 1
const HIGH = ctx(0.999); // d20 = 20, d4 = 4
const MID = ctx(0.5); // d20 = 11

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'Hero', maxHp: 20, hp: 5, needsFood: false, needsWater: false }), newCharacter({ name: 'Medic', wisMod: 3, needsFood: false, needsWater: false })];
  s.minutes = 10 * 60;
  s.log = [];
  patch(s);
  return s;
}
const hero = (s: State) => s.characters[0];

describe('dropping to 0 HP', () => {
  it('falls unconscious and dying, or dies outright from massive damage', () => {
    const s = fresh();
    expect(hero(E.changeHp(s, ctx(), hero(s).id, -10))).toMatchObject({ hp: 0, dying: true, diedAt: null });
    expect(hero(E.changeHp(s, ctx(), hero(s).id, -25)).diedAt).not.toBeNull();
  });

  it('becomes stable after three successes and wakes with 1 HP after 1d4 hours', () => {
    let t = fresh();
    const id = hero(t).id;
    t = E.changeHp(t, ctx(), id, -10);
    for (let i = 0; i < 3; i++) t = E.deathSave(t, MID, id);
    expect(hero(t)).toMatchObject({ dying: false, stable: true, hp: 0 });
    expect(hero(t).wakesAt).toBe(E.absNow(t) + 3 * 60); // d4 at rng 0.5 rolls 3
    expect(hero(E.advance(t, ctx(), 2 * 60)).hp).toBe(0);
    const awake = E.advance(t, ctx(), 3 * 60);
    expect(hero(awake)).toMatchObject({ hp: 1, stable: false, wakesAt: null });
    expect(awake.log.some((l) => l.text.includes('regains consciousness with 1 HP'))).toBe(true);
  });

  it('dies after three failures; a 1 counts twice; a 20 brings them back', () => {
    let s = fresh();
    const id = hero(s).id;
    s = E.changeHp(s, ctx(), id, -10);
    const twice = E.deathSave(s, LOW, id);
    expect(hero(twice).deathFailures).toBe(2);
    expect(hero(E.deathSave(twice, LOW, id)).diedAt).not.toBeNull();
    expect(hero(E.deathSave(s, HIGH, id))).toMatchObject({ hp: 1, dying: false });
  });

  it('stabilizes with a Medicine check or a Healer’s Kit, and healing wakes them', () => {
    let s = fresh();
    const id = hero(s).id;
    const medic = s.characters[1].id;
    s = E.changeHp(s, ctx(), id, -10);
    expect(hero(E.stabilize(s, LOW, id, medic, 'medicine')).dying).toBe(true); // 1 + 3 < 10
    expect(hero(E.stabilize(s, MID, id, medic, 'medicine')).stable).toBe(true); // 11 + 3
    expect(hero(E.stabilize(s, LOW, id, medic, 'sure')).stable).toBe(true);
    expect(hero(E.changeHp(s, ctx(), id, 4))).toMatchObject({ hp: 4, dying: false, stable: false });
  });

  it('turns a stable character back to dying when they take damage', () => {
    let s = fresh();
    const id = hero(s).id;
    s = E.stabilize(E.changeHp(s, ctx(), id, -10), LOW, id, null, 'sure');
    const hit = E.changeHp(s, ctx(), id, -3);
    expect(hero(hit)).toMatchObject({ stable: false, dying: true, deathFailures: 1, wakesAt: null });
  });
});

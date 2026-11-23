import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
function camp() {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.settings.encounters = false;
  s.fire.lit = true;
  s.fire.fuelHours = 24;
  s.stores = { foodLb: 20, waterGal: 10, foodRawLb: 0, waterUnsafeGal: 0 };
  s.characters = [newCharacter({ name: 'Cook', wisMod: 2, level: 5, survival: 4, cooksUtensils: true, stress: 3, rationsLb: 0, inventory: [] }), newCharacter({ name: 'Ada', stress: 2, rationsLb: 0, inventory: [] })];
  return s;
}

describe('cooking payoffs', () => {
  it('a tasty meal eases Stress for everyone who ate', () => {
    let s = camp();
    s = E.cookMeal(s, ctx(0.25), s.characters[0].id); // 6 + 5 = 11: tasty, not a feast
    expect(s.characters.map((c) => c.stress)).toEqual([2, 1]);
    expect(s.characters[1].tempHp).toBe(0);
  });

  it('a feast also gives Temporary HP', () => {
    let s = camp();
    s = E.cookMeal(s, ctx(0.99), s.characters[0].id);
    // Wisdom +2 and Proficiency Bonus +3.
    expect(s.characters.map((c) => c.tempHp)).toEqual([5, 5]);
  });

  it('a failed cook check gives nothing extra', () => {
    let s = camp();
    s.characters[0].wisMod = -5;
    s.characters[0].cooksUtensils = false;
    s = E.cookMeal(s, ctx(0.01), s.characters[0].id);
    expect(s.characters.map((c) => c.stress)).toEqual([3, 2]);
  });

  it('smoking meat turns the stores into Rations, raw meat first', () => {
    let s = camp();
    s.stores.foodRawLb = 12;
    s = E.cureRations(s, ctx(0.5), s.characters[0].id);
    const r = s.characters[0].inventory.find((i) => i.name === 'Rations');
    expect(r?.qty).toBe(10);
    expect(s.stores.foodRawLb).toBe(0);
    expect(s.stores.foodLb).toBe(2);
  });

  it('a botched smoking yields half', () => {
    let s = camp();
    s.characters[0].survival = -5;
    s.characters[0].cooksUtensils = false;
    s = E.cureRations(s, ctx(0.01), s.characters[0].id);
    expect(s.characters[0].inventory.find((i) => i.name === 'Rations')?.qty).toBe(3);
  });
});

import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
function one() {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'Ada', conSave: 0, hp: 30, maxHp: 30, needsFood: false, needsWater: false, inventory: [{ id: 'p', name: 'Poison: Malice', qty: 1, weight: 0, source: 'manual', container: null, ammo: null }] })];
  return s;
}

describe('poisons', () => {
  it('Malice poisons and blinds on a failed save, using up the dose', () => {
    let s = one();
    s = E.exposePoison(s, ctx(0.1), s.characters[0].id, 'Malice', s.characters[0].id);
    expect(s.characters[0].inventory).toHaveLength(0);
    expect(s.effects.some((e) => e.name === 'Poisoned (Malice), Blinded')).toBe(true);
  });

  it('Serpent Venom deals half damage on a success', () => {
    let s = one();
    s = E.exposePoison(s, ctx(0.99), s.characters[0].id, 'Serpent Venom', null);
    expect(s.characters[0].hp).toBe(30 - 9);
  });

  it('Midnight Tears waits until midnight', () => {
    let s = one();
    s.minutes = 20 * 60;
    s = E.exposePoison(s, ctx(0.1), s.characters[0].id, 'Midnight Tears', null);
    expect(s.characters[0].hp).toBe(30);
    s = E.advance(s, ctx(0.1), 5 * 60);
    expect(s.characters[0].hp).toBeLessThan(30);
    expect(s.characters[0].poisonTimers).toHaveLength(0);
  });
});

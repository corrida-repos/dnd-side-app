import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
function party() {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.characters = [
    newCharacter({ name: 'Cleric', className: 'Cleric', level: 9, needsFood: false, needsWater: false, spells: [{ name: 'Revivify', level: 3, prepared: true, alwaysPrepared: false }, { name: 'Raise Dead', level: 5, prepared: true, alwaysPrepared: false }], inventory: [{ id: 'd', name: 'Diamond', qty: 2, weight: 0, source: 'manual', valueGp: 300, container: null, ammo: null }] }),
    newCharacter({ name: 'Fallen', hp: 0, maxHp: 20, needsFood: false, needsWater: false }),
  ];
  return s;
}

describe('costly components and spells on a target', () => {
  it('Revivify within a minute uses a 300 GP diamond and returns the fallen with 1 HP', () => {
    let s = party();
    s.characters[1].diedAt = E.absNow(s);
    s = E.castSpell(s, ctx(), s.characters[0].id, 'Revivify', 'slot', s.characters[1].id);
    expect(s.characters[1].diedAt).toBeNull();
    expect(s.characters[1].hp).toBe(1);
    expect(s.characters[0].inventory[0].qty).toBe(1);
  });

  it('Raise Dead without a 500 GP diamond fails; with one it revives with a −4 penalty that eases on Long Rests', () => {
    let s = party();
    s.characters[1].diedAt = E.absNow(s) - 3 * 24 * 60;
    s.characters[0].inventory[0].qty = 1;
    s = E.castSpell(s, ctx(), s.characters[0].id, 'Raise Dead', 'slot', s.characters[1].id);
    expect(s.characters[1].diedAt).not.toBeNull();
    s.characters[0].inventory.push({ id: 'big', name: 'Diamond (large)', qty: 1, weight: 0, source: 'manual', valueGp: 500, container: null, ammo: null });
    s = E.castSpell(s, ctx(), s.characters[0].id, 'Raise Dead', 'slot', s.characters[1].id);
    expect(s.characters[1].revivalPenalty).toBe(4);
    s.minutes = 22 * 60;
    s = E.longRest(s, ctx(), true);
    expect(s.characters[1].revivalPenalty).toBe(3);
  });

  it('a hired Lesser Restoration ends Poisoned', () => {
    let s = party();
    s = E.exposePoison(s, ctx(0.05), s.characters[0].id, 'Malice', null);
    expect(s.effects.some((e) => e.name.startsWith('Poisoned'))).toBe(true);
    s = E.spellOnTarget(s, ctx(), 'Lesser Restoration', s.characters[0].id);
    expect(s.effects.some((e) => e.name.startsWith('Poisoned'))).toBe(false);
  });
});

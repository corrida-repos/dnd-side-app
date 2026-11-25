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

describe('persistent spell bookkeeping', () => {
  function casters() {
    const s = createDefaultState(() => 0);
    s.settings.encounters = false;
    s.settings.sleepDeprivation = false;
    s.characters = [
      newCharacter({
        name: 'Caster', hp: 4, maxHp: 20,
        spells: [{ name: 'Goodberry', level: 1 }, { name: 'Prayer of Healing', level: 2 }, { name: 'Aid', level: 2 }]
          .map((spell) => ({ ...spell, prepared: true, alwaysPrepared: false })),
      }),
      newCharacter({ name: 'Ally', hp: 4, maxHp: 20 }),
      newCharacter({ name: 'Bystander', hp: 4, maxHp: 20 }),
    ];
    return { s, caster: s.characters[0].id, ally: s.characters[1].id };
  }

  it('Goodberry feeds another creature and each batch vanishes on its own clock', () => {
    const { s, caster, ally } = casters();
    let next = E.castSpell(s, ctx(), caster, 'Goodberry', 'slot');
    const first = next.characters[0].inventory[0];
    next = E.eatGoodberry(next, ctx(), caster, first.id, ally);
    expect(next.characters[0].inventory[0].qty).toBe(9);
    expect(next.characters[1].hp).toBe(5);
    expect(next.characters[1].ateLbToday).toBeGreaterThan(0);
    next = E.advance(next, ctx(), 60);
    next = E.castSpell(next, ctx(), caster, 'Goodberry', 'slot');
    next = E.advance(next, ctx(), 23 * 60);
    expect(next.characters[0].inventory.map((i) => i.qty)).toEqual([10]);
  });

  it('Prayer of Healing takes ten minutes, heals selected targets and locks each out until a Long Rest', () => {
    const { s, caster, ally } = casters();
    let next = E.castSpell(s, ctx(), caster, 'Prayer of Healing', 'slot', null, null, [caster, ally]);
    expect(E.absNow(next) - E.absNow(s)).toBe(10);
    expect(next.characters.map((c) => c.hp)).toEqual([14, 14, 4]);
    expect(next.characters.map((c) => !!c.prayerOfHealingUsed)).toEqual([true, true, false]);
    const denied = E.castSpell(next, ctx(), caster, 'Prayer of Healing', 'slot', null, null, [ally]);
    expect(E.absNow(denied)).toBe(E.absNow(next));
    next = E.longRest(next, ctx(), true);
    expect(next.characters[1].prayerOfHealingUsed).toBe(false);
  });

  it('Aid can spend a chosen higher-level slot while a lower slot remains available', () => {
    const { s, caster, ally } = casters();
    s.characters[0].resources = [
      { id: 'low', name: 'Spell slots (level 2)', current: 1, max: 1, recharge: 'long' },
      { id: 'high', name: 'Spell slots (level 3)', current: 1, max: 1, recharge: 'long' },
    ];
    const next = E.castSpell(s, ctx(), caster, 'Aid', 'slot', null, null, [ally], 3);
    expect(next.characters[0].resources.map((r) => r.current)).toEqual([1, 0]);
    expect(next.characters[1].maxHp).toBe(30);
  });

  it('Aid uses the strongest active bonus and restores HP values after the last effect ends', () => {
    const { s, caster, ally } = casters();
    let next = E.castSpell(s, ctx(), caster, 'Aid', 'slot', null, null, [caster, ally]);
    expect(next.characters.map((c) => [c.hp, c.maxHp])).toEqual([[9, 25], [9, 25], [4, 20]]);
    next = E.castSpell(next, ctx(), caster, 'Aid', 'slot', null, null, [ally]);
    expect(next.characters[1].maxHp).toBe(25);
    next = E.endEffect(next, ctx(), next.effects.find((e) => e.aidHp)!.id);
    expect(next.characters.map((c) => c.maxHp)).toEqual([20, 25, 20]);
    next = E.advance(next, ctx(), 8 * 60);
    expect(next.characters[1].maxHp).toBe(20);
    expect(next.effects.some((e) => e.aidHp)).toBe(false);
  });
});

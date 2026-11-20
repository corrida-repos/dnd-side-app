import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { parse5eToolsItems, parse5eToolsRecipes, parse5eToolsRewards, parse5eToolsSpellClasses } from '../rules/hazards';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const LOW = ctx(0);
const HIGH = ctx(0.999);

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'A', level: 5, maxHp: 30, hp: 30, needsFood: false, needsWater: false, gp: 5000 })];
  s.minutes = 9 * 60;
  s.log = [];
  patch(s);
  return s;
}

describe('hazards', () => {
  it('rolls a save, applying damage on a failure and half on a success when allowed', () => {
    const s = fresh();
    const id = s.characters[0].id;
    expect(E.hazardSave(s, LOW, id, 'rockslide', 0).characters[0].hp).toBe(28); // 2 × d10 rolling 1
    expect(E.hazardSave(s, HIGH, id, 'rockslide', 0).characters[0].hp).toBe(20); // half of 20
    expect(E.hazardSave(s, HIGH, id, 'razorvine', 0).characters[0].hp).toBe(30); // no damage on a success
  });

  it('wears down swimmers in deep water unless they have a Swim Speed, and tests thin ice', () => {
    const s = fresh();
    const id = s.characters[0].id;
    expect(E.deepWater(s, LOW, id, 2).characters[0].exhaustionCauses).toEqual(['deepWater', 'deepWater']);
    s.characters[0].swimSpeed = true;
    expect(E.deepWater(s, LOW, id, 2).characters[0].exhaustion).toBe(0);
    expect(E.thinIce(s, LOW, 100).log[0].text).toContain('gives way'); // holds 30 lb
    expect(E.thinIce(s, HIGH, 100).log[0].text).toContain('It holds'); // holds 300 lb
  });
});

describe('walls and gifts', () => {
  it('builds defensive walls at 250 GP and 10 days a square', () => {
    let s = fresh();
    s = E.foundBastion(s, ctx(), s.characters[0].id, 'Keep');
    s = E.buildWalls(s, ctx(), s.bastions[0].id, 4);
    expect(s.bastions[0].facilities.at(-1)!.building).toMatchObject({ daysLeft: 40, costGp: 1000 });
    expect(s.characters[0].gp).toBe(4000);
  });

  it('grants gifts and curses as lasting effects, and a Charm with limited uses', () => {
    let s = fresh();
    const id = s.characters[0].id;
    s = E.grantGift(s, ctx(), id, 'Charm', 'Heroism', 1, '');
    s = E.grantGift(s, ctx(), id, 'Curse', 'the Restless Dead', 0, 'Undead sense you');
    expect(s.effects.map((e) => [e.name, e.kind, e.endsAt])).toEqual([
      ['Charm: Heroism', 'gift', null],
      ['Curse: the Restless Dead', 'curse', null],
    ]);
    expect(s.characters[0].resources[0]).toMatchObject({ name: 'Charm: Heroism', max: 1, recharge: 'manual' });
  });
});

describe('5etools libraries', () => {
  it('reads magic items, spell class lists, gifts and recipes', () => {
    expect(parse5eToolsItems({ item: [{ name: 'Wand of Web', rarity: 'uncommon', reqAttune: 'by a spellcaster', charges: 7, recharge: 'dawn', rechargeAmount: '{@dice 1d6 + 1}', weight: 1 }, { name: 'Rope', rarity: 'none' }] })).toEqual([
      { name: 'Wand of Web', rarity: 'uncommon', attunement: true, charges: 7, regain: '1d6+1', regainAt: 'dawn', weight: 1 },
    ]);
    expect(parse5eToolsSpellClasses({ xphb: { 'fire bolt': { class: { XPHB: { Sorcerer: true, Wizard: true } } } } })).toEqual({ 'fire bolt': ['Sorcerer', 'Wizard'] });
    expect(parse5eToolsRewards({ reward: [{ name: 'Charm of Heroism', type: 'Charm' }] })).toEqual([{ name: 'Charm of Heroism', type: 'Charm' }]);
    expect(parse5eToolsRecipes({ recipe: [{ name: 'Elven Bread' }, { name: 'Elven Bread' }] })).toEqual(['Elven Bread']);
  });
});

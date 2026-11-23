import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import { CHORE_FINDS, poisonYield, trophyFor } from '../rules/chorePayoffs';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
function one(survival = 5) {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.settings.encounters = false;
  s.characters = [newCharacter({ name: 'Ada', survival, conSave: 0, hp: 30, maxHp: 30, needsFood: false, needsWater: false, inventory: [] })];
  return s;
}

describe('rewarding chores', () => {
  it('a harvested wyvern dose is real Wyvern Poison, priced and usable', () => {
    let s = one();
    s = E.harvestPoison(s, ctx(0.99), s.characters[0].id, 5, 'Wyvern', true);
    const dose = s.characters[0].inventory.find((i) => i.name === 'Poison: Wyvern Poison');
    expect(dose?.valueGp).toBe(1200);
  });

  it('other venom works as Basic Poison worth 100 GP, or a plain dose with the switch off', () => {
    expect(poisonYield('Giant Spider', true)).toMatchObject({ valueGp: 100 });
    expect(poisonYield('Giant Spider', true).name).toContain('Basic Poison');
    expect(poisonYield('Giant Spider', false)).toMatchObject({ name: 'Poison dose (Giant Spider)', valueGp: 0 });
    expect(poisonYield('Giant Venomous Snake', false).name).toBe('Poison: Serpent Venom');
  });

  it('a clean butchering job keeps a trophy worth selling', () => {
    let s = one();
    s = E.butcher(s, ctx(0.99), { creature: { name: 'Owlbear', size: 'Large', type: 'monstrosity', cr: '3' }, count: 1, butcherId: s.characters[0].id });
    const t = s.characters[0].inventory.find((i) => i.name === 'Trophy (Owlbear)');
    expect(t?.valueGp).toBe(30);
    s = E.sellItem(s, ctx(), s.characters[0].id, t!.id, 1);
    expect(s.characters[0].gp).toBeGreaterThan(0);
  });

  it('a botched butchering job or a small kill leaves no trophy', () => {
    let s = one(-5);
    s = E.butcher(s, ctx(0.01), { creature: { name: 'Owlbear', size: 'Large', type: 'monstrosity', cr: '3' }, count: 1, butcherId: s.characters[0].id });
    expect(s.characters[0].inventory).toHaveLength(0);
    expect(trophyFor({ name: 'Rabbit', size: 'Tiny', type: 'beast' })).toBeNull();
    expect(trophyFor({ name: 'Zombie', size: 'Medium', type: 'undead' })).toBeNull();
  });

  it('a natural 20 on foraging turns up a find; an ordinary success does not', () => {
    const s0 = one();
    const plain = E.forage(s0, ctx(0.6), s0.characters[0].id);
    expect(plain.log.some((l) => l.text.includes('comes across'))).toBe(false);
    const s1 = one();
    const lucky = E.forage(s1, ctx(0.99), s1.characters[0].id);
    expect(lucky.log.some((l) => l.text.includes('comes across') && l.text.includes(CHORE_FINDS.forage[7].text))).toBe(true);
  });

  it('finds can be switched off', () => {
    const s = one();
    s.settings.choreFinds = false;
    const r = E.gatherWood(s, ctx(0.99), s.characters[0].id);
    expect(r.log.some((l) => l.text.includes('comes across'))).toBe(false);
  });

  it('a lucky firewood find lands where it belongs', () => {
    const s = one();
    const before = s.fire.fuelHours;
    const r = E.gatherWood(s, ctx(0.99), s.characters[0].id);
    // rng 0.99 picks the last entry: tinder fungus, one more hour of fuel on top of the 1d6 + 2.
    expect(r.fire.fuelHours - before).toBe(6 + 2 + 1);
  });
});

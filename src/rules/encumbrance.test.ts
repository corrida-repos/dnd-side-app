import { describe, expect, it } from 'vitest';
import { carryingCapacity, estimateWeight, loadLevel, parseInventory, parseInventoryLine } from './encumbrance';
import * as E from '../state/engine';
import { createDefaultState, newCharacter } from '../state/defaults';

describe('estimating weights', () => {
  it('looks items up in the PHB list, including plurals and descriptions', () => {
    expect(estimateWeight('Longsword')).toEqual({ weight: 3, source: 'book' });
    expect(estimateWeight('Torches')).toEqual({ weight: 1, source: 'book' });
    expect(estimateWeight('Plate Armor')).toEqual({ weight: 65, source: 'book' });
    expect(estimateWeight('+1 Longsword').weight).toBe(3);
    expect(estimateWeight('Rope, hempen (50 feet)').weight).toBe(5);
  });

  it('guesses sensibly for things not in the list', () => {
    expect(estimateWeight('Cloak of Elvenkind')).toMatchObject({ weight: 1 });
    expect(estimateWeight('Ring of Feather Falling')).toMatchObject({ weight: 0, source: 'guess' });
    expect(estimateWeight('Potion of Fire Breath')).toMatchObject({ weight: 0.5 });
    expect(estimateWeight('Mysterious Doodad')).toEqual({ weight: 1, source: 'guess' });
  });

  it('reads pasted lines with counts, weights and prices', () => {
    expect(parseInventoryLine('2 Torches')).toMatchObject({ name: 'Torches', qty: 2, weight: 1 });
    expect(parseInventoryLine('Dagger x3')).toMatchObject({ name: 'Dagger', qty: 3 });
    expect(parseInventoryLine('Javelin (4)')).toMatchObject({ name: 'Javelin', qty: 4 });
    expect(parseInventoryLine('Backpack\t5 lb.\t1\t2 GP')).toMatchObject({ name: 'Backpack', qty: 1, weight: 5, source: 'pasted' });
    expect(parseInventoryLine('Weird Idol 12 lb')).toMatchObject({ weight: 12, source: 'pasted' });
    expect(parseInventory('Name\n\nRations x5\nBedroll')).toHaveLength(2);
  });
});

describe('carried load', () => {
  it('uses Strength × 15 and the 2024 over-capacity rule, with the optional variant', () => {
    expect(carryingCapacity(10, 'Medium')).toBe(150);
    expect(carryingCapacity(10, 'Large')).toBe(300);
    expect(loadLevel(140, 150, 10, false)).toBe('light');
    expect(loadLevel(160, 150, 10, false)).toBe('over');
    expect(loadLevel(60, 150, 10, true)).toBe('encumbered');
    expect(loadLevel(110, 150, 10, true)).toBe('heavy');
  });

  it('adds gear, food, water, coins and magic items without counting things twice', () => {
    const s = createDefaultState(() => 0);
    const c = newCharacter({ strScore: 10, rationsLb: 5, waterPints: 4, waterCapacityPints: 4, gp: 50, items: [{ id: 'i', name: 'Cloak of Protection', requiresAttunement: true, attuned: false, identified: true, charges: null, maxCharges: null, regain: 'all', regainAt: 'never', awaySince: null, notes: '' }] });
    s.characters = [c];
    const after = E.addInventory(s, { rng: () => 0.5 }, c.id, 'Plate Armor\n2 Torches');
    const load = E.carriedLoad(after, after.characters[0]);
    expect(load).toMatchObject({ gear: 67, food: 10, water: 5, coins: 1, magic: 1, total: 84, capacity: 150, level: 'encumbered' });
    const dup = E.addInventory(after, { rng: () => 0.5 }, c.id, 'Cloak of Protection');
    expect(E.carriedLoad(dup, dup.characters[0]).magic).toBe(0);
  });
});

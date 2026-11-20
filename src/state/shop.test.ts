import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import { priceOf, saleRate } from '../rules/shop';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

describe('shop and loot', () => {
  it('knows PHB prices and the selling rule', () => {
    expect(priceOf('Longsword')).toBe(15);
    expect(saleRate('Longsword')).toBe(0.5);
    expect(saleRate('Ruby')).toBe(1);
  });

  it('buys into the inventory, sells at half, and splits loot to the copper', () => {
    let s = createDefaultState(() => 0);
    s.characters = [newCharacter({ name: 'A', gp: 50 }), newCharacter({ name: 'B', gp: 0 }), newCharacter({ name: 'C', gp: 0 })];
    const a = s.characters[0].id;
    s = E.buyItem(s, ctx(), a, 'Longsword', 1, 15, 0.1);
    expect(s.characters[0].gp).toBe(36.5);
    const sword = s.characters[0].inventory.find((i) => i.name === 'Longsword')!;
    s = E.sellItem(s, ctx(), a, sword.id, 1);
    expect(s.characters[0].gp).toBe(44);
    s = E.splitLoot(s, ctx(), 10, s.characters.map((c) => c.id), 'a chest');
    expect(s.characters.map((c) => c.gp)).toEqual([47.34, 3.33, 3.33]);
  });
});

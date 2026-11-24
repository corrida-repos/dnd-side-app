import { describe, expect, it } from 'vitest';
import { RARITY_LABEL, type Rarity } from '../rules/crafting';
import { rollBastionTreasure, rollTreasure, TREASURE_THEMES } from '../rules/treasure';
import { createDefaultState } from './defaults';
import { claimTreasure, previewTreasure } from './engine';

const ctx = { rng: () => 0.999 };

describe('DMG treasure', () => {
  it('can roll every percentile result in every magic table', () => {
    for (const theme of TREASURE_THEMES) {
      for (const rarity of Object.keys(RARITY_LABEL) as Rarity[]) {
        for (let percentile = 1; percentile <= 100; percentile++) {
          const [item] = rollTreasure({ kind: 'magic', theme, rarity }, () => (percentile - 0.5) / 100).items;
          expect(item.name).not.toBe('');
          expect(item.valueGp).toBeGreaterThan(0);
        }
      }
    }
  });

  it('keeps individual platinum and applies a confirmed preview once', () => {
    const state = createDefaultState(() => 0);
    const character = state.characters[0];
    const draft = previewTreasure(state, ctx, { kind: 'individual', cr: 17 });
    expect(draft.treasurePreview?.coins.pp).toBe(1600);
    expect(draft.characters[0].purse).toEqual(character.purse);
    const id = draft.treasurePreview!.id;
    const claimed = claimTreasure(draft, ctx, id, `c:${character.id}`);
    expect(claimed.characters[0].purse.pp).toBe(character.purse.pp + 1600);
    expect(claimed.characters[0].gp).toBe(character.gp + 16000);
    expect(claimTreasure(claimed, ctx, id, `c:${character.id}`)).toEqual(claimed);
  });

  it('keeps the rolled hoard value when splitting it into trade bars and coin', () => {
    const hoard = rollTreasure({ kind: 'hoard', cr: 0, theme: 'Armaments', rarity: 'common', monetary: 'bar', unitValue: 250 }, ctx.rng);
    expect(hoard.coins.gp).toBe(50);
    expect(hoard.items[0]).toMatchObject({ kind: 'bar', valueGp: 250, qty: 3, weight: 5 });
    expect(hoard.items.slice(1)).toHaveLength(3);
  });

  it('resolves Bastion event brackets into named items', () => {
    expect(rollBastionTreasure(() => 0)).toMatchObject({ kind: 'art', name: 'Silver ewer', valueGp: 25 });
    expect(rollBastionTreasure(ctx.rng)).toMatchObject({ kind: 'magic', rarity: 'rare' });
  });
});

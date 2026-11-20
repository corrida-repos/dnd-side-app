import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const item = (id: string, name: string, qty = 1) => ({ id, name, qty, weight: 0.5, source: 'manual' as const, container: null, ammo: null });

describe('mixed potions, renown and lifestyle', () => {
  it('mixing two healing potions that work normally heals twice, using both up', () => {
    let s = createDefaultState(() => 0);
    s.characters = [newCharacter({ name: 'A', hp: 1, maxHp: 40, inventory: [item('a', 'Potion of Healing', 2)] })];
    // rng 0.5: d100 = 51 → both work normally; 2d4+2 = 8 each
    s = E.mixInventoryPotions(s, ctx(), s.characters[0].id, 'a', 'a');
    expect(s.characters[0].hp).toBe(17);
    expect(s.characters[0].inventory).toHaveLength(0);
  });

  it('missions add renown, and level-based renown follows a character', () => {
    let s = createDefaultState(() => 0);
    s.characters = [newCharacter({ name: 'A', level: 6, needsFood: false, needsWater: false })];
    s.factions = [{ id: 'f', name: 'Harpers', renown: 0, notes: '', levelOf: null }];
    s = E.factionMission(s, ctx(), 'f');
    expect(s.factions[0].renown).toBe(1);
    s.factions[0].levelOf = s.characters[0].id;
    s.minutes = 22 * 60;
    s = E.longRest(s, ctx(), true);
    expect(s.factions[0].renown).toBe(6);
  });

  it('squalid living in town can expose a character to Sewer Plague at the week’s end', () => {
    let s = createDefaultState(() => 0);
    s.settings.sleepDeprivation = false;
    s.place.settlement = true;
    s.characters = [newCharacter({ name: 'A', gp: 100, lifestyle: 'squalid', conSave: -10 })];
    s.dayIndex = 6;
    s.minutes = 23 * 60;
    s = E.advance(s, ctx(0.01), 120);
    expect(s.characters[0].contagions.some((x) => x.kind === 'sewer')).toBe(true);
  });
});

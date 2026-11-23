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

  it('squalid and wretched living mean drinking city water every day, which counts toward Sewer Plague', () => {
    const day = (lifestyle: 'squalid' | 'wretched' | 'poor', after = 3, renown = 0) => {
      let s = createDefaultState(() => 0);
      s.settings.sleepDeprivation = false;
      s.settings.sewerPlagueAfter = after;
      s.place.settlement = true;
      s.factions = renown ? [{ id: 'f', name: 'Harpers', renown, notes: '', levelOf: null }] : [];
      s.characters = [newCharacter({ name: 'A', gp: 100, lifestyle, conSave: -10 })];
      s.dayIndex = 2;
      s.minutes = 23 * 60;
      return E.advance(s, ctx(0.01), 120);
    };
    const s = day('squalid');
    expect(s.characters[0].sick).toBe(true);
    expect(s.characters[0].waterborneIllnesses).toBe(1);
    expect(s.log.some((l) => l.text.includes('DC 12') && l.text.includes('tenement cistern'))).toBe(true);
    expect(s.characters[0].contagions.some((x) => x.kind === 'sewer')).toBe(false);
    expect(day('wretched').log.some((l) => l.text.includes('DC 14'))).toBe(true);
    expect(day('wretched', 3, 3).characters[0].sick).toBe(false);
    expect(day('poor').characters[0].sick).toBe(false);
    expect(day('squalid', 1).characters[0].contagions.some((x) => x.kind === 'sewer')).toBe(true);
  });

  it('Sewer Plague only threatens after repeated illness from unpurified water', () => {
    let s = createDefaultState(() => 0);
    s.settings.sleepDeprivation = false;
    s.characters = [newCharacter({ name: 'A', conSave: -10, needsWater: true })];
    s.stores.waterGal = 0;
    s.stores.waterUnsafeGal = 20;
    const id = s.characters[0].id;
    const bout = () => {
      s = E.drink(s, ctx(0.01), id, 1, 'stores');
      s.characters[0].sick = false; // as if a Long Rest passed
    };
    s = E.drink(s, ctx(0.01), id, 1, 'stores');
    s = E.drink(s, ctx(0.01), id, 1, 'stores'); // already Sick: doesn't count again
    expect(s.characters[0].waterborneIllnesses).toBe(1);
    s.characters[0].sick = false; // as if a Long Rest passed
    bout();
    expect(s.characters[0].waterborneIllnesses).toBe(2);
    expect(s.characters[0].contagions).toHaveLength(0);
    bout();
    expect(s.characters[0].contagions.some((x) => x.kind === 'sewer')).toBe(true);
    expect(s.characters[0].waterborneIllnesses).toBe(0);
    s.settings.sewerPlagueAfter = 0;
    s.characters[0].contagions = [];
    for (let i = 0; i < 5; i++) bout();
    expect(s.characters[0].contagions).toHaveLength(0);
  });
});

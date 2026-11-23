import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { InventoryItem, MagicItem, Project, State } from './types';
import { resolveActivity } from '../rules/downtimeOutcomes';
import { saleRate } from '../rules/shop';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const item = (name: string, extra: Partial<InventoryItem> = {}): InventoryItem => ({ id: name, name, qty: 1, weight: 0, source: 'manual', container: null, ammo: null, ...extra });
const project = (p: Partial<Project>): Project => ({ id: 'p', name: 'Job', kind: 'activity', charIds: [], daysRequired: 5, daysDone: 0, costGp: 0, notes: '', done: true, awaitingOutcome: true, ...p });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.settings.encounters = false;
  s.characters = [newCharacter({ name: 'Ada', gp: 0, needsFood: false, needsWater: false, inventory: [] })];
  s.log = [];
  patch(s);
  return s;
}

describe('payoffs for work and study', () => {
  it('pelts, furs, trophies, Rations and route maps sell at full value', () => {
    for (const n of ['Small pelt', 'Fine fur (fox or marten)', 'Trophy (Owlbear)', 'Rations', 'Map of the High Pass', 'Rare mushrooms']) expect(saleRate(n)).toBe(1);
    expect(saleRate('Longsword')).toBe(0.5);
  });

  it("a crafter's own work sells at full price, and doesn't merge with bought stock", () => {
    let s = fresh((d) => (d.characters[0].inventory = [item('Shovel', { valueGp: 2 }), item('Shovel (made)', { valueGp: 2, crafted: true })]));
    s = E.sellItem(s, ctx(), s.characters[0].id, 'Shovel (made)', 1);
    expect(s.characters[0].gp).toBe(2);
    s = E.sellItem(s, ctx(), s.characters[0].id, 'Shovel', 1);
    expect(s.characters[0].gp).toBe(3);
  });

  it('performing in town pays by the total, with supper and a room on a good night', () => {
    let s = fresh((d) => (d.place.settlement = true));
    s = E.perform(s, ctx(0.99), s.characters[0].id, 3); // 20 + 3 = 23: 4d6 GP
    expect(s.characters[0].gp).toBe(24);
    expect(s.characters[0].lodging?.tier).toBe('comfortable');
    expect(s.characters[0].ateLbToday).toBeGreaterThan(0);
    const wild = E.perform(fresh(), ctx(0.99), fresh().characters[0].id, 3);
    expect(wild.characters[0].gp).toBe(0);
  });

  it('a fair copy of a route map is worth money', () => {
    let s = fresh((d) => (d.characters[0].inventory = [item("Cartographer's Tools"), item('Paper', { qty: 2 }), item('Map of the High Pass', { valueGp: 25 })]));
    s = E.copyMap(s, ctx(0.99), s.characters[0].id, 'Map of the High Pass', 4);
    const maps = s.characters[0].inventory.filter((i) => i.name === 'Map of the High Pass').reduce((a, i) => a + i.qty, 0);
    expect(maps).toBe(2);
    expect(s.characters[0].inventory.find((i) => i.name === 'Paper')?.qty).toBe(1);
  });

  it('copying a Book turns 50 sheets into a 25 GP Book sold at full price', () => {
    let s = fresh((d) => (d.characters[0].inventory = [item('Paper', { qty: 50 }), item('Ink', { uses: 500 }), item('Ink Pen')]));
    s = E.copyBook(s, ctx(), s.characters[0].id, 'A Bestiary of the North');
    const book = s.characters[0].inventory.find((i) => i.name.startsWith('Book (copy of'))!;
    expect(book).toMatchObject({ valueGp: 25, crafted: true });
    s = E.sellItem(s, ctx(), s.characters[0].id, book.id, 1);
    expect(s.characters[0].gp).toBe(25);
  });

  it('working a trade pays 1 GP more for each point above 10', () => {
    const r = resolveActivity('Working a trade', { bonuses: [5] }, () => 0.5); // 11 + 5 = 16
    expect(r.text).toContain('plus 6 GP');
  });

  it('research always finds lore, grants insights, a scholar, and identifies a matching item', () => {
    const unknown: MagicItem = { id: 'm', name: 'Cloak of Elvenkind', partyName: 'Grey Cloak', requiresAttunement: true, attuned: false, identified: false, charges: null, maxCharges: null, regain: 'all', regainAt: 'never', awaySince: null, notes: '', magicKnown: false, clues: [], findings: [] };
    let s = fresh((d) => {
      d.characters[0].items = [unknown];
      d.projects = [project({ name: 'Research: grey cloak', charIds: [d.characters[0].id] })];
    });
    s = E.resolveActivityProject(s, ctx(0.99), 'p', { bonuses: [5], gp: 50 });
    const insight = s.effects.find((e) => e.name.startsWith('Research insight: grey cloak'))!;
    expect(insight.name).toMatch(/×4$/); // 20 + 5 = 25: Xanathar's 3 pieces, +1 by table rule
    expect(s.characters[0].items[0].identified).toBe(true);
    expect((s.contacts ?? []).some((c) => c.role === 'Sage')).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { Project } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const project = (p: Partial<Project>): Project => ({ id: 'p', name: 'Job', kind: 'activity', charIds: [], daysRequired: 1, daysDone: 0, costGp: 0, notes: '', done: false, ...p });

describe('downtime activity outcomes', () => {
  it('training grants the proficiency when it finishes', () => {
    let s = createDefaultState(() => 0);
    s.characters = [newCharacter({ name: 'A', needsFood: false, needsWater: false })];
    s.projects = [project({ name: 'Training: Elvish', learn: 'Elvish', charIds: [s.characters[0].id] })];
    s = E.workOnProjects(s, ctx(), ['p']);
    expect(s.characters[0].trainedProficiencies).toEqual(['Elvish']);
  });

  it('pit fighting pays by wins, and gambling with no wins costs the stake and a debt', () => {
    let s = createDefaultState(() => 0);
    s.characters = [newCharacter({ name: 'A', gp: 100, needsFood: false, needsWater: false })];
    s.projects = [project({ name: 'Pit fighting', charIds: [s.characters[0].id] })];
    s = E.workOnProjects(s, ctx(), ['p']);
    expect(s.projects[0].awaitingOutcome).toBe(true);
    s = E.resolveActivityProject(s, ctx(0.99), 'p', { bonuses: [5, 5, 5] });
    expect(s.characters[0].gp).toBe(300);
    s.projects = [project({ id: 'g', name: 'Gambling', charIds: [s.characters[0].id], done: true, awaitingOutcome: true })];
    s = E.resolveActivityProject(s, ctx(0.01), 'g', { bonuses: [0, 0, 0], gp: 50 });
    expect(s.characters[0].gp).toBe(250);
    expect(s.debts[0]).toMatchObject({ creditor: 'The gambling house', kind: 'criminal', owed: 50 });
  });
});

describe('downtime activities, fully played out', () => {
  it('each participant rolls their own, and carousing upper-class company costs per week', () => {
    let s = createDefaultState(() => 0);
    s.characters = [newCharacter({ name: 'A', gp: 1000, needsFood: false, needsWater: false }), newCharacter({ name: 'B', gp: 1000, needsFood: false, needsWater: false })];
    const [a, b] = s.characters.map((c) => c.id);
    s.projects = [project({ name: 'Carousing', charIds: [a, b], daysRequired: 10, costGp: 20, done: true, awaitingOutcome: true })];
    s = E.resolveActivityProject(s, ctx(0.5), 'p', { bonuses: [3], circle: 'upper' });
    expect(s.projects[0].awaitingOutcome).toBe(true);
    // Two weeks at 250 GP, less A's 10 GP share of the project cost.
    expect(s.characters[0].gp).toBe(510);
    s = E.resolveActivityProject(s, ctx(0.5), 'p', { bonuses: [3], circle: 'lower' });
    expect(s.projects[0].awaitingOutcome).toBe(false);
    expect(s.characters[1].gp).toBe(990);
  });

  it('a week of carousing takes five days however many carouse', () => {
    let s = createDefaultState(() => 0);
    s.characters = [newCharacter({ name: 'A', needsFood: false, needsWater: false }), newCharacter({ name: 'B', needsFood: false, needsWater: false })];
    s.projects = [project({ name: 'Carousing', charIds: s.characters.map((c) => c.id), daysRequired: 5 })];
    s = E.workOnProjects(s, ctx(), ['p']);
    expect(s.projects[0].daysDone).toBe(1);
  });

  it('buying a magic item: the search is rolled, then the offer is taken', () => {
    let s = createDefaultState(() => 0);
    s.characters = [newCharacter({ name: 'A', gp: 1000, needsFood: false, needsWater: false })];
    const a = s.characters[0].id;
    s.projects = [project({ kind: 'buyMagic', name: 'Buy Potion of Speed', itemName: 'Potion of Speed', rarity: 'uncommon', consumable: true, charIds: [a], daysRequired: 5, daysDone: 4 })];
    s = E.workOnProjects(s, ctx(), ['p']);
    expect(s.projects[0].awaitingOutcome).toBe(true);
    s = E.resolveDealProject(s, ctx(0.5), 'p', { bonus: 3 });
    expect(s.characters[0].gp).toBe(900);
    expect(s.projects[0].offers?.[0].gp).toBe(300);
    s = E.answerDeal(s, ctx(), 'p', 0);
    expect(s.characters[0].gp).toBe(600);
    expect(s.characters[0].items.map((i) => i.name)).toContain('Potion of Speed');
  });

  it('selling a magic item hands it over when an offer is taken', () => {
    let s = createDefaultState(() => 0);
    s.characters = [newCharacter({ name: 'A', gp: 100, needsFood: false, needsWater: false })];
    const c = s.characters[0];
    c.items.push({ id: 'i', name: 'Cloak of Elvenkind', requiresAttunement: true, attuned: false, identified: true, charges: null, maxCharges: null, regain: 'all', regainAt: 'never', awaySince: null, notes: '', magicKnown: true, clues: [], findings: [] });
    s.projects = [project({ kind: 'sellMagic', name: 'Sell cloak', itemName: 'Cloak of Elvenkind', rarity: 'uncommon', charIds: [c.id], done: true, awaitingOutcome: true, daysRequired: 5 })];
    s = E.resolveDealProject(s, ctx(0.95), 'p', { bonus: 5, offerBonus: 0 });
    expect(s.projects[0].offers?.length).toBeGreaterThan(0);
    s = E.answerDeal(s, ctx(0.5), 'p', 0);
    expect(s.characters[0].items).toEqual([]);
    expect(s.characters[0].gp).toBeGreaterThan(75);
  });
});

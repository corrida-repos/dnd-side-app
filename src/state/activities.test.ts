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

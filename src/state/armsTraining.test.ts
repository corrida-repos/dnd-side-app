import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter, uid } from './defaults';
import type { Project, State } from './types';
import { armsFromProficiencies, armsModifier, armsWeeks, canTrainArms, holdsArms } from '../rules/armsTraining';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function fresh(): State {
  const s = createDefaultState(() => 0);
  Object.assign(s.settings, { encounters: false, foodAndWater: false, extremeWeather: false, sleepDeprivation: false, lifestyleRisks: false });
  s.characters = [newCharacter({ name: 'Ada', gp: 1000, tasks: [] })];
  s.log = [];
  return s;
}

const course = (s: State, p: Partial<Project>): Project => ({ id: uid(), name: 'Arms training', kind: 'activity', charIds: [s.characters[0].id], daysRequired: 50, daysDone: 0, costGp: 250, notes: '', done: false, ...p });

describe('arms training rules (table rule)', () => {
  it('follows the feat order: Light before Medium before Heavy, Simple before all Martial', () => {
    expect(canTrainArms([], 'Medium armor').ok).toBe(false);
    expect(canTrainArms(['Light armor'], 'Medium armor').ok).toBe(true);
    expect(canTrainArms(['Light armor'], 'Heavy armor').reason).toMatch(/Medium armor training first/);
    expect(canTrainArms([], 'Martial weapons').ok).toBe(false);
    expect(canTrainArms([], 'One martial weapon', 'Longsword').ok).toBe(true);
    expect(canTrainArms([], 'One martial weapon').ok).toBe(false);
  });

  it('knows what a broader training already covers', () => {
    expect(holdsArms(['Heavy armor'], 'Light armor')).toBe(true);
    expect(holdsArms(['Martial weapons'], 'One martial weapon', 'Rapier')).toBe(true);
    expect(holdsArms(['Martial weapons'], 'Simple weapons')).toBe(true);
    expect(canTrainArms(['Light armor'], 'Light armor').ok).toBe(false);
  });

  it('Strength or Dexterity shortens it, never under half', () => {
    expect(armsModifier('Heavy armor', { str: 16, dex: 8 })).toBe(3);
    expect(armsModifier('Medium armor', { str: 8, dex: 14 })).toBe(2);
    expect(armsWeeks('Light armor', 3)).toBe(7);
    expect(armsWeeks('Light armor', 9)).toBe(5);
    expect(armsWeeks('Martial weapons', -1)).toBe(21);
    expect(armsWeeks('Shields', 5)).toBe(3);
  });

  it('reads D&D Beyond proficiency names', () => {
    expect(armsFromProficiencies(['Light Armor', 'Shields', 'Simple Weapons', 'longsword', 'Stealth'], ['Longsword', 'Rapier'])).toEqual(['Light armor', 'Shields', 'Simple weapons', 'Longsword']);
  });
});

describe('arms training in downtime', () => {
  it('records the training when the course ends and tells the player what changed', () => {
    let s = fresh();
    s.characters[0].armsProfs = ['Light armor'];
    s = E.startProject(s, ctx(), course(s, { name: 'Arms training: Medium armor', armsKind: 'Medium armor', daysRequired: 3 }));
    const pid = s.projects[0].id;
    for (let i = 0; i < 3; i++) s = E.workOnProjects(s, ctx(), [pid]);
    expect(s.projects[0].done).toBe(true);
    expect(s.characters[0].armsProfs).toEqual(['Light armor', 'Medium armor']);
    expect(s.log.some((l) => /Medium armor training/.test(l.text) && /mail/.test(l.text))).toBe(true);
  });

  it('a single weapon is recorded by name', () => {
    let s = fresh();
    s = E.startProject(s, ctx(), course(s, { name: 'Arms training: One martial weapon: Rapier', armsKind: 'One martial weapon', learn: 'Rapier', daysRequired: 1 }));
    s = E.workOnProjects(s, ctx(), [s.projects[0].id]);
    expect(s.characters[0].armsProfs).toEqual(['Rapier']);
  });

  it("won't start a course the trainee isn't ready for", () => {
    let s = fresh();
    s = E.startProject(s, ctx(), course(s, { name: 'Arms training: Heavy armor', armsKind: 'Heavy armor' }));
    expect(s.projects).toHaveLength(0);
    expect(s.characters[0].gp).toBe(1000);
    expect(s.log.at(-1)?.text).toMatch(/needs Medium armor training first/);
  });
});

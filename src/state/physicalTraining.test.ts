import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import { parseDdbCharacter } from '../rules/ddb';

const ctx: E.Ctx = { rng: () => 0.5 };

function setup(character = {}) {
  const s = createDefaultState(() => 0);
  s.characters = [newCharacter({ needsFood: false, needsWater: false, ...character })];
  return s;
}

describe('physical training in downtime', () => {
  it('takes 50 free solo workdays at score 10 and writes the Strength increase once', () => {
    let s = setup();
    const id = s.characters[0].id;
    s = E.startPhysicalTraining(s, ctx, id, 'str', false);
    const [p] = s.projects;
    expect(p).toMatchObject({ daysRequired: 50, costGp: 0 });
    s = E.startPhysicalTraining(s, ctx, id, 'con', false);
    expect(s.projects).toHaveLength(1);
    s = E.workOnProjects(s, ctx, [p.id]);
    expect(s.projects[0].daysDone).toBe(1);
    expect(s.characters[0].strScore).toBe(10);
    s.projects[0].daysDone = 49;
    s = E.recordPhysicalTrainingDay(s, ctx, p.id);
    s = E.recordPhysicalTrainingDay(s, ctx, p.id);
    expect(s.projects[0]).toMatchObject({ done: true, daysDone: 50 });
    expect(s.characters[0]).toMatchObject({ strScore: 11, abilities: { str: 11 }, gp: 25 });
  });

  it('charges the optional trainer and updates Constitution-derived stats on completion', () => {
    let s = setup({ conScore: 15, level: 4, conSave: 4, maxHp: 35, hp: 25, gp: 500 });
    s = E.startPhysicalTraining(s, ctx, s.characters[0].id, 'con', true);
    expect(s.projects[0]).toMatchObject({ daysRequired: 40, costGp: 200 });
    expect(s.characters[0].gp).toBe(300);
    s.projects[0].daysDone = 39;
    s = E.workOnProjects(s, ctx, [s.projects[0].id]);
    expect(s.characters[0]).toMatchObject({ conScore: 16, abilities: { con: 16 }, conSave: 5, maxHp: 39, hp: 25 });
  });

  it('requires a recorded Dexterity score, pauses for unavailable trainees, and stops at 20', () => {
    let s = setup();
    const id = s.characters[0].id;
    expect(E.startPhysicalTraining(s, ctx, id, 'dex', false).projects).toHaveLength(0);
    s.characters[0].abilities = { dex: 19 };
    s = E.startPhysicalTraining(s, ctx, id, 'dex', false);
    s.projects[0].daysDone = s.projects[0].daysRequired - 1;
    const p = s.projects[0].id;
    s.characters[0].hp = 0;
    s = E.recordPhysicalTrainingDay(s, ctx, p);
    expect(s.projects[0].done).toBe(false);
    s.characters[0].hp = 1;
    s = E.downtimeDay(s, ctx, [p]);
    expect(s.characters[0].abilities?.dex).toBe(20);
    expect(E.startPhysicalTraining(s, ctx, id, 'dex', true).projects).toHaveLength(1);
  });

  it('keeps a completed gain when stats are re-synced from D&D Beyond without counting it twice', () => {
    let s = setup({ name: 'A', conScore: 13 });
    const id = s.characters[0].id;
    s = E.startPhysicalTraining(s, ctx, id, 'con', false);
    s.projects[0].daysDone = s.projects[0].daysRequired - 1;
    s = E.recordPhysicalTrainingDay(s, ctx, s.projects[0].id);
    const parts = { stats: true, inventory: false, spells: false, resources: false, conditions: false };
    for (const value of [13, 14, 16]) {
      const imp = parseDdbCharacter({ name: 'A', baseHitPoints: 10, stats: [{ id: 3, value }] });
      s = E.importDdb(s, ctx, imp, parts);
      const delta = value === 13 ? 1 : 0;
      expect(s.characters[0]).toMatchObject({ conScore: Math.max(value, 14), conSave: imp.conSave + delta, maxHp: imp.maxHp + imp.level * delta });
    }
  });
});

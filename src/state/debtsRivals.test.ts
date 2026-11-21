import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
function town() {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.settings.lifestyleRisks = false;
  s.place.settlement = true;
  s.characters = [newCharacter({ name: 'A', gp: 0, lifestyle: 'wretched', hp: 30, maxHp: 30, needsFood: false, needsWater: false, inventory: [{ id: 'i', name: 'Longsword', qty: 1, weight: 3, source: 'manual', valueGp: 15, container: null, ammo: null }] })];
  return s;
}

describe('debts', () => {
  it('a lawful debt accrues interest, then bailiffs seize coin and goods, then prison', () => {
    let s = town();
    s = E.borrow(s, ctx(), s.characters[0].id, 'Bank', 'lawful', 100, 0.02, 7);
    expect(s.characters[0].gp).toBe(100);
    s.characters[0].gp = 0;
    s.characters[0].purse = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
    s = E.advance(s, ctx(), 40 * 24 * 60);
    const d = s.debts[0];
    expect(d.steps).toContain('Seizure');
    expect(s.characters[0].inventory).toHaveLength(0);
    expect(d.imprisoned).toBe(true);
  });

  it('a criminal debt sends enforcers and can be cut by doing a job', () => {
    let s = town();
    s = E.addDebt(s, ctx(), s.characters[0].id, 'Loan shark', 'criminal', 200);
    s = E.advance(s, ctx(), 29 * 24 * 60);
    expect(s.debts[0].steps).toEqual(expect.arrayContaining(['Threats', 'Enforcers', 'Forced service']));
    expect(s.characters[0].hp).toBeLessThan(30);
    const owed = s.debts[0].owed;
    s = E.serveCreditor(s, ctx(), s.debts[0].id);
    expect(s.debts[0].owed).toBeCloseTo(owed * 0.75);
  });

  it('a negative purse becomes a debt at the end of the day', () => {
    let s = town();
    s.characters[0].gp = -5;
    s.minutes = 23 * 60;
    s = E.advance(s, ctx(), 120);
    expect(s.characters[0].gp).toBe(0);
    expect(s.debts[0].owed).toBe(5);
  });
});

describe('rivals', () => {
  it('a rival advances when downtime finishes and pressure builds', () => {
    let s = town();
    s = E.addRival(s, ctx(), 'Magistrate Orvane', '');
    s.projects = [{ id: 'p', name: 'Research', kind: 'activity', charIds: [s.characters[0].id], daysRequired: 1, daysDone: 0, costGp: 0, notes: '', done: false }];
    s = E.workOnProjects(s, ctx(), ['p']);
    s = E.resolveActivityProject(s, ctx(), 'p', { bonuses: [0], gp: 50 });
    expect(s.rivals[0].pressure).toBeGreaterThanOrEqual(1);
    expect(s.log.some((l) => l.text.startsWith('Rival: Magistrate Orvane'))).toBe(true);
  });
});

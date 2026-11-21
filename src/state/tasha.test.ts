import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
function town() {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.settings.lifestyleRisks = false;
  s.place.settlement = true;
  s.characters = [newCharacter({ name: 'A', gp: 10, lifestyle: 'modest', needsFood: false, needsWater: false })];
  return s;
}

describe("Tasha's group patrons and regions", () => {
  it('an academy pays 1 GP a day and members get Group Assistance', () => {
    let s = town();
    s = E.setPatron(s, ctx(), 'academy', 'The Lyceum');
    expect(s.characters[0].resources.some((r) => r.name === 'Group Assistance')).toBe(true);
    s.minutes = 23 * 60;
    s = E.advance(s, ctx(), 120);
    expect(s.characters[0].gp).toBe(10);
  });

  it('an ancient being houses the party at a modest lifestyle for free', () => {
    let s = town();
    s = E.setPatron(s, ctx(), 'ancient', 'The Wyrm');
    s.minutes = 23 * 60;
    s = E.advance(s, ctx(), 120);
    expect(s.characters[0].gp).toBe(10);
    expect(E.patronLifestyleCost(s, 'comfortable')).toBe(2);
  });

  it('an infested region can forbid rest, and a Far Realm loop loses hours', () => {
    let s = town();
    s = E.setRegion(s, ctx(), 'infested');
    s = E.rollRegionEffect(s, ctx(0.08), 'test');
    s.minutes = 22 * 60;
    const before = s.dayIndex;
    s = E.longRest(s, ctx(), true);
    expect(s.dayIndex).toBe(before);
    s = E.setRegion(s, ctx(), 'farRealm');
    const t = E.absNow(s);
    s = E.rollRegionEffect(s, ctx(0.7), 'test');
    expect(E.absNow(s) - t).toBeGreaterThan(60);
  });
});

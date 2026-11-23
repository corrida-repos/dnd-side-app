import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter, uid } from './defaults';
import type { State } from './types';
import { rollLandIncome, sameCommunity } from '../rules/prestige';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  Object.assign(s.settings, { encounters: false, foodAndWater: false, extremeWeather: false, sleepDeprivation: false, lifestyleRisks: false });
  s.characters = [newCharacter({ name: 'Ada', gp: 1000, tasks: [] }), newCharacter({ name: 'Bo', gp: 1000, tasks: [] })];
  s.place = { ...s.place, settlement: false, name: 'The road' };
  s.log = [];
  patch(s);
  return s;
}

const days = (s: State, n: number, v = 0.5): State => {
  for (let i = 0; i < n; i++) s = E.advance(s, ctx(v), 24 * 60);
  return s;
};

describe('fortifications (2024 DMG)', () => {
  it('charges the Maintenance Costs table each day once the grantor stops paying', () => {
    let s = fresh();
    const [a] = s.characters;
    s = E.grantMark(s, ctx(), { kind: 'fortification', name: 'Thornwatch', holderIds: [a.id], grantor: 'the Queen', fort: 'keep', sponsorMonths: 0 });
    s = days(s, 1);
    expect(s.characters[0].gp).toBe(900);
    expect(s.log.some((l) => /upkeep on Thornwatch/.test(l.text))).toBe(true);
  });

  it('costs nothing while the grantor pays', () => {
    let s = fresh();
    s = E.grantMark(s, ctx(), { kind: 'fortification', name: 'Thornwatch', holderIds: [s.characters[0].id], grantor: '', fort: 'castle', sponsorMonths: 1 });
    s = days(s, 2);
    expect(s.characters[0].gp).toBe(1000);
  });

  it('table rule: 30 days unpaid costs a point of trust', () => {
    let s = fresh((d) => (d.characters[0].gp = 0, d.characters[0].purse = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }));
    s = E.grantMark(s, ctx(), { kind: 'fortification', name: 'Watchtower', holderIds: [s.characters[0].id], grantor: '', fort: 'outpost' });
    s = days(s, 30);
    expect(s.marks[0].trust).toBe(2);
  });

  it('can become the holder’s Bastion, which ends the upkeep', () => {
    let s = fresh();
    s = E.grantMark(s, ctx(), { kind: 'fortification', name: 'Thornwatch', holderIds: [s.characters[0].id], grantor: '', fort: 'keep' });
    s = E.fortToBastion(s, ctx(), s.marks[0].id);
    expect(s.bastions.at(-1)?.name).toBe('Thornwatch');
    s = days(s, 1);
    expect(s.characters[0].gp).toBe(1000);
  });
});

describe('parcels of land (table rule)', () => {
  it('rolls rents each month', () => {
    expect(rollLandIncome('farmland', () => 0.5)).toBe(40);
    expect(rollLandIncome('wild', () => 0.5)).toBe(0);
    let s = fresh();
    s = E.grantMark(s, ctx(), { kind: 'land', name: 'Fenwick', holderIds: [s.characters[0].id], grantor: '', land: 'farmland' });
    s = days(s, 30);
    expect(s.characters[0].gp).toBe(1040);
    expect(s.marks[0].trouble).toBeNull();
  });

  it('trouble left for a month costs trust and that month’s income', () => {
    let s = fresh();
    s = E.grantMark(s, ctx(), { kind: 'land', name: 'Fenwick', holderIds: [s.characters[0].id], grantor: '', land: 'farmland' });
    s = days(s, 29);
    s = days(s, 1, 0); // 1s: income 10 GP, and trouble
    expect(s.characters[0].gp).toBe(1010);
    expect(s.marks[0].trouble).not.toBeNull();
    s = days(s, 30);
    expect(s.marks[0].trust).toBe(2);
    expect(s.characters[0].gp).toBe(1010);
    s = E.resolveLandTrouble(s, ctx(), s.marks[0].id);
    expect(s.marks[0].trouble).toBeNull();
  });

  it('does nothing monthly with the table rule off', () => {
    let s = fresh((d) => (d.settings.prestigeRules = false));
    s = E.grantMark(s, ctx(), { kind: 'land', name: 'Fenwick', holderIds: [s.characters[0].id], grantor: '', land: 'village' });
    s = days(s, 30, 0);
    expect(s.characters[0].gp).toBe(1000);
    expect(s.marks[0].trouble).toBeNull();
  });
});

describe('special rights', () => {
  it('free room and board in the named community, up to Comfortable', () => {
    expect(sameCommunity('Greywater', 'Greywater (docks)')).toBe(true);
    expect(sameCommunity('', 'Greywater')).toBe(false);
    let s = fresh((d) => {
      d.place = { ...d.place, settlement: true, name: 'Greywater' };
      d.characters[0].lifestyle = 'comfortable';
      d.characters[1].lifestyle = 'wealthy';
    });
    s = E.grantMark(s, ctx(), { kind: 'rights', name: 'Freedom of Greywater', holderIds: s.characters.map((c) => c.id), grantor: '', right: 'lodging', community: 'Greywater' });
    s = days(s, 1);
    expect(s.characters[0].gp).toBe(1000);
    expect(s.characters[1].gp).toBe(998); // Wealthy 4 GP − Comfortable 2 GP
  });

  it('sworn soldiers join as unpaid guards and leave when the right expires', () => {
    let s = fresh();
    s = E.grantMark(s, ctx(), { kind: 'rights', name: 'Escort', holderIds: [s.characters[0].id], grantor: '', right: 'soldiers', soldiers: 3, days: 5 });
    expect(s.hirelings.filter((h) => h.role === 'guard' && h.wageGp === 0)).toHaveLength(3);
    s = days(s, 5);
    expect(s.marks[0].revoked).toBeTruthy();
    expect(s.hirelings).toHaveLength(0);
  });

  it('a lawful prize pays the crown its share', () => {
    let s = fresh();
    s = E.grantMark(s, ctx(), { kind: 'rights', name: 'Letter of marque', holderIds: s.characters.map((c) => c.id), grantor: 'the King', right: 'marque' });
    s = E.claimPrize(s, ctx(), s.marks[0].id, 1000);
    expect(s.characters.map((c) => c.gp)).toEqual([1450, 1450]);
  });
});

describe('titles (table rule)', () => {
  it('cost trust while the holder lives below the rank, and stripping takes the lands too', () => {
    let s = fresh((d) => (d.characters[0].lifestyle = 'poor'));
    s = E.grantMark(s, ctx(), { kind: 'title', name: 'Earl of Stormriver', holderIds: [s.characters[0].id], grantor: 'the Queen', rank: 'count', withLand: 'village' });
    expect(s.marks).toHaveLength(2);
    const title = s.marks.find((m) => m.kind === 'title')!;
    s = days(s, 30);
    expect(s.marks.find((m) => m.id === title.id)!.trust).toBe(2);
    s = E.revokeMark(s, ctx(), title.id, 'treason');
    expect(s.marks.every((m) => m.revoked)).toBe(true);
  });

  it('three slips and the title is gone', () => {
    let s = fresh();
    s = E.grantMark(s, ctx(), { kind: 'title', name: 'Sir Ada', holderIds: [s.characters[0].id], grantor: '', rank: 'knight' });
    for (let i = 0; i < 3; i++) s = E.adjustMarkTrust(s, ctx(), s.marks[0].id, -1, 'brawling at court');
    expect(s.marks[0].revoked?.why).toMatch(/brawling/);
  });
});

describe('special training (2024 DMG)', () => {
  it('takes 30 days with the trainer for each trainee and records the proficiency', () => {
    let s = fresh();
    const ids = s.characters.map((c) => c.id);
    s = E.startProject(s, ctx(), { id: uid(), name: 'Special training: Stealth', kind: 'activity', charIds: ids, daysRequired: 30, daysDone: 0, costGp: 0, notes: '', done: false, learn: 'Stealth', learnKind: 'skill' });
    const pid = s.projects[0].id;
    for (let i = 0; i < 29; i++) s = E.workOnProjects(s, ctx(), [pid]);
    expect(s.projects[0].done).toBe(false);
    s = E.workOnProjects(s, ctx(), [pid]);
    expect(s.projects[0].done).toBe(true);
    for (const c of s.characters) expect(c.skillProfs).toContain('Stealth');
  });
});

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
      d.townMode = 'downtime';
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

describe('faction renown (2024 DMG) and its ties to marks', () => {
  const withFaction = (renown = 5) =>
    fresh((d) => {
      d.factions = [
        { id: 'f', name: 'Order of the Gauntlet', renown, notes: '' },
        { id: 'g', name: 'Harpers', renown, notes: '' },
      ];
    });

  it('missions are worth +1 to +4', () => {
    let s = withFaction(0);
    s = E.factionMission(s, ctx(), 'f', 1);
    s = E.factionMission(s, ctx(), 'f');
    s = E.factionMission(s, ctx(), 'f', 4);
    expect(s.factions[0].renown).toBe(7);
  });

  it('level-based renown follows the DMG table', async () => {
    const { levelRenown } = await import('../rules/prestige');
    expect([1, 2, 3, 4, 5, 10, 11, 16, 17, 20].map(levelRenown)).toEqual([1, 1, 3, 3, 10, 10, 25, 25, 50, 50]);
  });

  it('group involvement: 10 × renown days raise it by 1, and needs renown 1+', () => {
    let s = withFaction(2);
    s = E.factionInvolvement(s, ctx(), 'f', 19);
    expect(s.factions[0].renown).toBe(2);
    s = E.factionInvolvement(s, ctx(), 'f', 1);
    expect(s.factions[0].renown).toBe(3);
    expect(s.factions[0].involvementDays).toBe(0);
    const zero = E.factionInvolvement(withFaction(0), ctx(), 'f', 10);
    expect(zero.factions[0].renown).toBe(0);
  });

  it('a faction-granted mark: loyal service raises renown, offenses against the faction cost trust', () => {
    let s = withFaction();
    s = E.grantMark(s, ctx(), { kind: 'title', name: 'Knight of the Gauntlet', holderIds: [s.characters[0].id], grantor: '', rank: 'knight', factionId: 'f' });
    expect(s.marks[0].grantor).toBe('Order of the Gauntlet');
    s = E.adjustMarkTrust(s, ctx(), s.marks[0].id, -1, 'brawl');
    s = E.adjustMarkTrust(s, ctx(), s.marks[0].id, 1, 'held the bridge');
    expect(s.factions[0].renown).toBe(6);
    s = E.changeRenown(s, ctx(), 'g', -1, 'insulted a Harper');
    expect(s.marks[0].trust).toBe(3);
    s = E.changeRenown(s, ctx(), 'f', -1, 'deserted a muster');
    expect(s.marks[0].trust).toBe(2);
    expect(s.factions[0].renown).toBe(5);
  });

  it('a mark taken back for disloyalty costs 2 renown; an expired right costs nothing', () => {
    let s = withFaction();
    s = E.grantMark(s, ctx(), { kind: 'fortification', name: 'Bridgekeep', holderIds: [s.characters[0].id], grantor: '', fort: 'keep', sponsorMonths: 3, factionId: 'f' });
    s = E.grantMark(s, ctx(), { kind: 'rights', name: 'Lodging', holderIds: [s.characters[0].id], grantor: '', right: 'lodging', community: 'Elturel', days: 2, factionId: 'f' });
    s = days(s, 2);
    expect(s.factions[0].renown).toBe(5);
    s = E.revokeMark(s, ctx(), s.marks[0].id, 'treachery');
    expect(s.factions[0].renown).toBe(3);
  });

  it('table rule: a faction or ruler refuses titles and fortifications below the renown it expects', () => {
    let s = withFaction(5);
    s.settings.prestigeRenownMin = true;
    const a = s.characters[0].id;
    s = E.grantMark(s, ctx(), { kind: 'title', name: 'Baron', holderIds: [a], grantor: '', rank: 'lord', factionId: 'f' });
    expect(s.marks).toHaveLength(0);
    expect(s.log.at(-1)?.text).toMatch(/will not grant Baron yet: that takes renown 25/);
    s = E.grantMark(s, ctx(), { kind: 'land', name: 'Fenwick', holderIds: [a], grantor: '', land: 'farmland', factionId: 'f' });
    s = E.grantMark(s, ctx(), { kind: 'title', name: 'Sir Ada', holderIds: [a], grantor: '', rank: 'knight', factionId: 'f' });
    expect(s.marks.map((m) => m.name)).toEqual(['Fenwick']);
    s = E.factionMission(s, ctx(), 'f', 4);
    s = E.factionMission(s, ctx(), 'f', 1);
    s = E.grantMark(s, ctx(), { kind: 'title', name: 'Sir Ada', holderIds: [a], grantor: '', rank: 'knight', factionId: 'f' });
    expect(s.marks).toHaveLength(2);
    // A new ruler starts at renown 0: no fortification, and no faction created by the refused grant.
    s = E.grantMark(s, ctx(), { kind: 'fortification', name: 'Keep', holderIds: [a], grantor: 'King Boranel', fort: 'keep', rulerAsFaction: true });
    expect(s.marks).toHaveLength(2);
    expect(s.factions.some((f) => f.name === 'King Boranel')).toBe(false);
    // A one-off reward, not tied to a faction, is never refused.
    s = E.grantMark(s, ctx(), { kind: 'fortification', name: 'Keep', holderIds: [a], grantor: 'King Boranel', fort: 'keep' });
    expect(s.marks).toHaveLength(3);
  });
});

describe('free room and board, day to day in town', () => {
  it('covers inn rooms and meals up to Comfortable in the named community', () => {
    let s = fresh((d) => (d.place = { ...d.place, settlement: true, name: 'Greywater' }));
    const [a, b] = s.characters;
    s = E.grantMark(s, ctx(), { kind: 'rights', name: 'Freedom of Greywater', holderIds: [a.id], grantor: '', right: 'lodging', community: 'Greywater' });
    s = E.rentRooms(s, ctx(), [a.id, b.id], 'comfortable', 1);
    s = E.buyMeals(s, ctx(), [a.id], 'wealthy', 1);
    expect(s.characters[0].gp).toBeCloseTo(999.9); // only the Wealthy meal's extra 1 SP
    expect(s.characters[1].gp).toBeCloseTo(999.2);
  });
});

describe('a ruler tracked as a faction', () => {
  it('creates the ruler’s faction once and reuses it for later grants', () => {
    let s = fresh();
    const a = s.characters[0].id;
    s = E.grantMark(s, ctx(), { kind: 'title', name: 'Sir Ada', holderIds: [a], grantor: 'Queen Yolande', rank: 'knight', rulerAsFaction: true });
    s = E.grantMark(s, ctx(), { kind: 'land', name: 'Fenwick', holderIds: [a], grantor: 'queen yolande', land: 'farmland', rulerAsFaction: true });
    expect(s.factions).toHaveLength(1);
    expect(s.factions[0]).toMatchObject({ name: 'Queen Yolande', renown: 0 });
    expect(s.marks.every((m) => m.factionId === s.factions[0].id)).toBe(true);
    s = E.changeRenown(s, ctx(), s.factions[0].id, 1, 'gave the queen a gift');
    s = E.changeRenown(s, ctx(), s.factions[0].id, -1, 'insulted the queen at court');
    expect(s.marks.every((m) => m.trust === 2)).toBe(true);
  });

  it('links existing marks from the same grantor afterwards', () => {
    let s = fresh();
    const a = s.characters[0].id;
    s = E.grantMark(s, ctx(), { kind: 'title', name: 'Earl', holderIds: [a], grantor: 'King Boranel', rank: 'count', withLand: 'village' });
    s = E.grantMark(s, ctx(), { kind: 'title', name: 'Sir', holderIds: [a], grantor: 'Someone else', rank: 'knight' });
    expect(s.factions).toHaveLength(0);
    s = E.markRulerAsFaction(s, ctx(), s.marks.find((m) => m.name === 'Earl')!.id);
    expect(s.factions.map((f) => f.name)).toEqual(['King Boranel']);
    expect(s.marks.filter((m) => m.factionId).map((m) => m.name).sort()).toEqual(['Earl', 'Lands of Earl']);
  });
});

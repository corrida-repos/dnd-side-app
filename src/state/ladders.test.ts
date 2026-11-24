import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { LADDERS, ladderMissing, socialTier } from '../rules/ladders';
import { rollBusiness } from '../rules/business';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  Object.assign(s.settings, { encounters: false, foodAndWater: false, extremeWeather: false, sleepDeprivation: false, lifestyleRisks: false, coldNights: false, prestigeRules: false });
  s.characters = [newCharacter({ name: 'Ada', className: 'Fighter', level: 5, gp: 1000, tasks: [], lifestyle: 'wretched' })];
  s.place = { ...s.place, settlement: true, name: 'Greyhawk' };
  s.log = [];
  patch(s);
  return s;
}

const days = (s: State, n: number): State => {
  for (let i = 0; i < n; i++) s = E.advance(s, ctx(), 24 * 60);
  return s;
};

const atCourt = (patch: (s: State) => void = () => {}): State => {
  let s = fresh(patch);
  s = E.trackInstitution(s, ctx(), 'Court of Queen Maren');
  s = E.joinLadder(s, ctx(), s.characters[0].id, 'court', s.factions[0].id);
  return s;
};

describe('the ladders share one shape', () => {
  it('ranks sit on the renown and level steps on every path', () => {
    for (const l of Object.values(LADDERS)) {
      expect(l.rungs.slice(2).map((r) => r.renown)).toEqual([3, 10, 25, 50]);
      expect(l.rungs.slice(2).map((r) => r.level)).toEqual([3, 5, 11, 17]);
    }
    expect(socialTier(3)).toBe('Gentry');
    expect(ladderMissing('guild', 3, { renown: 10, level: 5, daysInRank: 90, hasTool: false, businesses: 0, wealth: 0 })).toEqual(['proficiency with the guild’s tool', '1 business of their own (has 0)']);
  });
});

describe('noble path', () => {
  it('joining makes them a member, and petitions climb to Knight with a title and a knight’s fee', () => {
    let s = atCourt();
    const id = s.characters[0].id;
    expect(s.factions[0].renown).toBe(1);
    expect(E.ladderPos(s.characters[0], 'court')?.rank).toBe(1);
    s.factions[0].renown = 3;
    s = days(s, 30);
    s = E.petitionLadder(s, ctx(0.5), id, 'court', 2); // 11 + 2 vs DC 12
    expect(E.ladderPos(s.characters[0], 'court')?.rank).toBe(2);
    s.factions[0].renown = 10;
    for (let m = 0; m < 3; m++) s = days(E.ladderDuty(s, ctx(), id, 'court', 1), 29);
    expect(E.ladderBlocked(s, s.characters[0], 'court')).toEqual([]);
    s = E.petitionLadder(s, ctx(0.5), id, 'court', 2); // 11 + 2 vs 15: fails
    expect(E.ladderPos(s.characters[0], 'court')?.rank).toBe(2);
    expect(E.ladderBlocked(s, s.characters[0], 'court').join()).toMatch(/new petition in 30/);
    s = days(s, 30);
    s = E.petitionLadder(s, ctx(0.5), id, 'court', 4);
    const pos = E.ladderPos(s.characters[0], 'court')!;
    expect(pos.rank).toBe(3);
    const title = s.marks.find((m) => m.id === pos.titleId)!;
    expect(title).toMatchObject({ kind: 'title', rank: 'knight' });
    expect(s.marks.find((m) => m.kind === 'land' && m.titleId === title.id)?.land).toBe('farmland');
  });

  it('Lord is petitioned at DC 20, Duke only awarded, and the title grows in place with new lands', () => {
    let s = atCourt((d) => (d.characters[0].level = 20));
    const id = s.characters[0].id;
    s = E.awardLadder(s, ctx(), id, 'court', 3, 'knighted on the field at Greyford');
    s.factions[0].renown = 50;
    for (let m = 0; m < 6; m++) s = days(E.ladderDuty(s, ctx(), id, 'court', 2), 29);
    expect(E.ladderBlocked(s, s.characters[0], 'court')).toEqual([]);
    s = E.petitionLadder(s, ctx(0.9), id, 'court', 3); // 19 + 3 vs DC 20
    const pos = E.ladderPos(s.characters[0], 'court')!;
    expect(pos.rank).toBe(4);
    const titles = s.marks.filter((m) => m.kind === 'title' && !m.revoked);
    expect(titles).toHaveLength(1);
    expect(titles[0]).toMatchObject({ rank: 'lord', id: pos.titleId });
    expect(s.marks.filter((m) => m.kind === 'land' && !m.revoked).map((m) => m.land).sort()).toEqual(['farmland', 'village']);
    expect(E.ladderBlocked(s, s.characters[0], 'court').join()).toMatch(/Duke is only ever granted/);
  });

  it('titles pay fees and tolls each month the duties are kept', () => {
    let s = atCourt((d) => (d.characters[0].level = 20));
    const id = s.characters[0].id;
    s = E.awardLadder(s, ctx(), id, 'court', 5, '');
    const gp = s.characters[0].gp;
    s = days(E.ladderDuty(s, ctx(), id, 'court', 7), 23);
    expect(s.log.some((l) => /fees and tolls of a duke: 90 GP/.test(l.text))).toBe(true);
    expect(s.characters[0].gp).toBeGreaterThanOrEqual(gp + 90);
  });

  it('days away from any settlement pause the month’s duties', () => {
    let s = atCourt();
    const id = s.characters[0].id;
    s = E.awardLadder(s, ctx(), id, 'court', 3, '');
    s.place = { ...s.place, settlement: false, name: 'The Barrier Peaks' };
    s = days(s, 120);
    expect(E.ladderPos(s.characters[0], 'court')).toMatchObject({ rank: 3, strikes: 0 });
  });

  it('a title taken back drops them to Esquire; neglected duties cost a rank and its lands', () => {
    let s = atCourt((d) => (d.characters[0].level = 20));
    const id = s.characters[0].id;
    s = E.awardLadder(s, ctx(), id, 'court', 4, '');
    s = days(s, 90);
    expect(E.ladderPos(s.characters[0], 'court')?.rank).toBe(3);
    expect(s.marks.find((m) => m.land === 'village')?.revoked).toBeTruthy();
    expect(s.marks.find((m) => m.id === E.ladderPos(s.characters[0], 'court')!.titleId)?.rank).toBe('knight');
    s = E.revokeMark(s, ctx(), E.ladderPos(s.characters[0], 'court')!.titleId!, 'treason');
    s = days(s, 1);
    expect(E.ladderPos(s.characters[0], 'court')?.rank).toBe(2);
  });
});

describe('bourgeois path', () => {
  const inGuild = (patch: (s: State) => void = () => {}): State => {
    let s = fresh(patch);
    s = E.trackInstitution(s, ctx(), "Smiths' Guild of Greyhawk");
    s = E.joinLadder(s, ctx(), s.characters[0].id, 'guild', s.factions[0].id, "Smith's Tools");
    return s;
  };

  it('Master needs the tool and a business of their own', () => {
    let s = inGuild((d) => (d.characters[0].toolProfs = ["Smith's Tools"]));
    const id = s.characters[0].id;
    s = E.awardLadder(s, ctx(), id, 'guild', 2, '');
    s.factions[0].renown = 10;
    s = days(s, 90);
    expect(E.ladderBlocked(s, s.characters[0], 'guild')).toEqual(['1 business of their own (has 0)']);
    s.businesses.push({ id: 'b', name: 'The Anvil', ownerId: id, gpPerDay: 2, daysWorked: 0, debts: 0, unpaidGp: 0, netGp: 0, lastResult: '', notes: '' });
    s = E.petitionLadder(s, ctx(0.9), id, 'guild', 3);
    expect(E.ladderPos(s.characters[0], 'guild')?.rank).toBe(3);
  });

  it('wealth for standing counts the businesses a character owns, not just gold on hand', () => {
    let s = inGuild();
    const id = s.characters[0].id;
    s.characters[0].gp = 1000;
    s.businesses.push({ id: 'b', name: 'Inn of the Silver Stag', ownerId: id, gpPerDay: 5, daysWorked: 0, debts: 0, unpaidGp: 0, netGp: 0, lastResult: '', notes: '', valueGp: 6000 });
    s.businesses.push({ id: 'c', name: 'Small shop', ownerId: id, gpPerDay: 2, daysWorked: 0, debts: 0, unpaidGp: 0, netGp: 0, lastResult: '', notes: '' });
    expect(E.ladderWealth(s, s.characters[0])).toBe(1000 + 6000 + 1000);
    expect(E.ladderStanding(s, s.characters[0], 'guild').wealth).toBeGreaterThanOrEqual(5000);
  });

  it('a building finished by the owner is worth what it cost', () => {
    let s = inGuild();
    const id = s.characters[0].id;
    s.characters[0].gp = 5000;
    s = E.addBusiness(s, ctx(), 'The Anvil', id, 2, { what: 'Workshop or smithy', costGp: 1500, days: 1, landGp: 100 });
    expect(s.businesses[0].valueGp).toBe(100);
  });

  it('a guild master’s businesses roll better, and the civic branch has its own titles', () => {
    expect(rollBusiness(() => 0.3, 10, 2, 0, 5).total - rollBusiness(() => 0.3, 10, 2, 0, 0).total).toBe(5);
    let s = inGuild();
    const id = s.characters[0].id;
    s = E.awardLadder(s, ctx(), id, 'guild', 3, 'an honorary mastership');
    s.businesses.push({ id: 'b', name: 'The Anvil', ownerId: id, gpPerDay: 2, daysWorked: 10, debts: 0, unpaidGp: 0, netGp: 0, lastResult: '', notes: '' });
    s = E.settleBusiness(s, ctx(), 'b');
    expect(s.log.find((l) => /The Anvil: d100/.test(l.text))?.text).toMatch(/\+ 5 \(Master/);
    s = E.setCivic(s, ctx(), id, true);
    s = E.awardLadder(s, ctx(), id, 'guild', 5, 'acclaimed by the council');
    expect(s.log[0].text).toMatch(/Lord mayor/);
    expect(E.socialRank(s.characters[0])).toMatchObject({ rank: 5, tier: 'Grandee', from: 'Lord mayor' });
  });
});

describe('the clerical path can be awarded too', () => {
  it('names a character to an office directly', () => {
    let s = fresh();
    s = E.setDevotion(s, ctx(), s.characters[0].id, { deity: 'Pelor' });
    s = E.awardOffice(s, ctx(), s.characters[0].id, 4, 'chosen by omen');
    expect(s.characters[0].devotion?.office?.rank).toBe(4);
    expect(E.socialRank(s.characters[0]).tier).toBe('Magnate');
  });
});

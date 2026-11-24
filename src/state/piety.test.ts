import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { Project, State } from './types';
import { divineTie, pietyRank, startingPiety, cappedGain } from '../rules/piety';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const project = (p: Partial<Project>): Project => ({ id: 'p', name: 'Job', kind: 'activity', charIds: [], daysRequired: 5, daysDone: 0, costGp: 0, notes: '', done: false, ...p });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  Object.assign(s.settings, { encounters: false, foodAndWater: false, extremeWeather: false, sleepDeprivation: false, lifestyleRisks: false, coldNights: false });
  s.characters = [newCharacter({ name: 'Ada', className: 'Cleric', level: 4, gp: 1000, tasks: [] }), newCharacter({ name: 'Bo', className: 'Rogue', gp: 1000, tasks: [] })];
  s.place = { ...s.place, settlement: false, name: 'The road' };
  s.log = [];
  patch(s);
  return s;
}

const days = (s: State, n: number): State => {
  for (let i = 0; i < n; i++) s = E.advance(s, ctx(), 24 * 60);
  return s;
};

const devoted = (patch: (s: State) => void = () => {}): State => {
  let s = fresh(patch);
  s = E.setDevotion(s, ctx(), s.characters[0].id, { deity: 'Lathander', ideals: 'dawn, renewal' });
  return s;
};

describe('piety rules', () => {
  it('ranks follow the renown steps, with Estranged below 0', () => {
    expect([-1, 0, 2, 3, 10, 25, 50].map((n) => pietyRank(n).id)).toEqual(['estranged', 'faithful', 'faithful', 'devoted', 'favored', 'exalted', 'chosen']);
  });

  it('knows divine classes, subclasses and acolytes', () => {
    const base = { subclass: '', feats: [], features: [], notes: '' };
    expect(divineTie({ ...base, className: 'Cleric' })).toBe('cleric');
    expect(divineTie({ ...base, className: 'Paladin' })).toBe('paladin');
    expect(divineTie({ ...base, className: 'Warlock', subclass: 'Celestial Patron' })).toBe('patron');
    expect(divineTie({ ...base, className: 'Warlock', subclass: 'Archfey Patron' })).toBeNull();
    expect(divineTie({ ...base, className: 'Fighter', features: ['Acolyte'] })).toBe('acolyte');
    expect(divineTie({ ...base, className: 'Rogue', feats: ['Magic Initiate (Cleric)'] })).toBe('other');
    expect(startingPiety('cleric')).toBe(3);
    expect(startingPiety(null)).toBe(0);
    expect(cappedGain(9, 3, 10)).toBe(1);
    expect(cappedGain(12, 3, 10)).toBe(0);
  });
});

describe('piety in play', () => {
  it('a Cleric starts Devoted, everyone else Faithful', () => {
    let s = devoted();
    s = E.setDevotion(s, ctx(), s.characters[1].id, { deity: 'Tymora' });
    expect(s.characters[0].devotion?.piety).toBe(3);
    expect(s.characters[1].devotion?.piety).toBe(0);
  });

  it('deeds raise and lower it, logging what the character feels and new ranks', () => {
    let s = devoted();
    const id = s.characters[0].id;
    s = E.pietyDeed(s, ctx(), id, 4, 'recovered the Dawnstone');
    s = E.pietyDeed(s, ctx(), id, 3, 'drove the undead from Fenwick');
    expect(s.characters[0].devotion).toMatchObject({ piety: 10, best: 10 });
    expect(s.log[0].text).toMatch(/now Favored/);
    expect(s.log[0].sense).toBeTruthy();
    s = E.pietyDeed(s, ctx(), id, -5, 'struck down a priest');
    s = E.pietyDeed(s, ctx(), id, -6, 'served a rival god');
    expect(s.characters[0].devotion?.piety).toBe(-1);
    expect(s.log[0].text).toMatch(/Lathander turns away/);
    expect(s.statusLog[0].kind).toBe('estranged');
  });

  it('atonement brings an estranged character back to 0', () => {
    let s = devoted();
    const id = s.characters[0].id;
    s = E.pietyDeed(s, ctx(), id, -5, 'a grave sin');
    s = E.atone(s, ctx(), id, 'a pilgrimage barefoot to the Morninglord’s shrine');
    expect(s.characters[0].devotion?.piety).toBe(0);
  });

  it('a costly offering costs 25 GP per level, adds +1 up to 3, and only once a month', () => {
    let s = devoted((d) => (d.characters[0].level = 2));
    const id = s.characters[0].id;
    s = E.pietyDeed(s, ctx(), id, -2, 'skipped the rites');
    s = E.makeOffering(s, ctx(), id);
    expect(s.characters[0].gp).toBe(950);
    expect(s.characters[0].devotion?.piety).toBe(2);
    expect(E.offeringBlocked(s, s.characters[0])).toMatch(/once each 30 days/);
    s = E.makeOffering(s, ctx(), id);
    expect(s.characters[0].gp).toBe(950);
    s = days(s, 30);
    s = E.makeOffering(s, ctx(), id);
    s = days(s, 30);
    s = E.makeOffering(s, ctx(), id);
    expect(s.characters[0].devotion?.piety).toBe(3);
    expect(s.characters[0].gp).toBe(850);
  });

  it('Religious Service downtime adds +1 a week up to 10', () => {
    let s = devoted();
    s.projects = [project({ name: 'Religious service', charIds: [s.characters[0].id], done: true, awaitingOutcome: true })];
    s = E.resolveActivityProject(s, ctx(0.99), 'p', { bonuses: [5], weeks: 2 });
    expect(s.characters[0].devotion?.piety).toBe(5);
    s.characters[0].devotion!.piety = 9;
    s.projects = [project({ id: 'q', name: 'Religious service', charIds: [s.characters[0].id], done: true, awaitingOutcome: true })];
    s = E.resolveActivityProject(s, ctx(0.99), 'q', { bonuses: [5], weeks: 3 });
    expect(s.characters[0].devotion?.piety).toBe(10);
  });

  it('60 days of neglect costs 1, never below 0; switched off, nothing drifts', () => {
    let s = devoted();
    s = days(s, 59);
    expect(s.characters[0].devotion?.piety).toBe(3);
    s = days(s, 1);
    expect(s.characters[0].devotion?.piety).toBe(2);
    s.characters[0].devotion!.piety = 0;
    s = days(s, 60);
    expect(s.characters[0].devotion?.piety).toBe(0);
    let off = devoted((d) => (d.settings.piety = false));
    off = days(off, 120);
    expect(off.characters[0].devotion?.piety).toBe(3);
  });

  it('a missed tithe costs piety; a paid one counts as devotion', () => {
    let s = devoted((d) => (d.characters[0].gp = 0, d.characters[0].purse = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }));
    s = E.addDue(s, ctx(), { kind: 'tithe', label: '', payerId: s.characters[0].id, gp: 10, period: 'month', firstInDays: 1, collector: 'the Temple of Dawn', notes: '' });
    s = days(s, 1);
    expect(s.characters[0].devotion?.piety).toBe(2);
  });
});

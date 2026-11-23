import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { Lifestyle } from '../rules/money';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const ALL = ctx(0.001); // every 1-in-N chance comes up
const NONE = ctx(0.999);

function town(lifestyle: Lifestyle, extra: Parameters<typeof newCharacter>[0] = {}) {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.settings.encounters = false;
  s.place.settlement = true;
  s.townMode = 'downtime';
  s.place.shelter = 'building';
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.characters = [newCharacter({ name: 'Rook', gp: 100, lifestyle, conSave: -10, hp: 30, maxHp: 30, ...extra })];
  s.log = [];
  return s;
}
const said = (s: ReturnType<typeof town>, t: string) => s.log.some((l) => l.text.includes(t));
/** Runs to the end of the seventh day, when the weekly rolls happen. */
const endOfWeek = (s: ReturnType<typeof town>, c: E.Ctx) => {
  s.dayIndex = 6;
  s.minutes = 23 * 60;
  return E.advance(s, c, 120);
};

describe('Squalid and Wretched living (table rules)', () => {
  it('the Wretched sleep rough: exposed to the weather in town, unless Renown 3+ finds them shelter', () => {
    const s = town('wretched');
    const party = E.exposure(s, 'rest');
    expect(party.cold).toBe(false);
    expect(E.personalExposure(s, s.characters[0], 'rest', party).cold).toBe(true);
    s.factions = [{ id: 'f', name: 'Harpers', renown: 3, notes: '', levelOf: null }];
    expect(E.personalExposure(s, s.characters[0], 'rest', party).cold).toBe(false);
    expect(E.personalExposure(town('squalid'), town('squalid').characters[0], 'rest', party).cold).toBe(false);
  });

  it('a Squalid week can bring theft, spoiled food, a rat bite, vermin, Cackle Fever, a shakedown and fire', () => {
    const s = endOfWeek(town('squalid', { rationsLb: 5 }), ALL);
    const c = s.characters[0];
    expect(said(s, 'gone-off stew')).toBe(true);
    expect(said(s, 'a rat has bitten them')).toBe(true);
    expect(said(s, 'tonic from a hawker')).toBe(true);
    expect(c.contagions.some((x) => x.kind === 'cackle')).toBe(true);
    expect(said(s, 'protection money')).toBe(true);
    expect(said(s, 'Fire!')).toBe(true);
    expect(c.hp).toBeLessThan(30);
    const calm = endOfWeek(town('squalid'), NONE);
    expect(calm.characters[0].contagions).toHaveLength(0);
    expect(calm.characters[0].hp).toBe(30);
  });

  it('a gnome is immune to Cackle Fever from the flophouse', () => {
    const s = endOfWeek(town('squalid', { species: 'Rock Gnome' }), ALL);
    expect(s.characters[0].contagions.some((x) => x.kind === 'cackle')).toBe(false);
  });

  it('a Wretched week adds Stress, a broken night and trouble with the watch', () => {
    const s = endOfWeek(town('wretched'), ALL);
    const c = s.characters[0];
    expect(c.stress).toBeGreaterThan(0);
    expect(c.restless).toBe(true);
    expect(said(s, 'roughed up')).toBe(true);
    expect(said(s, 'rousts') || said(s, 'fines') || said(s, 'locks')).toBe(true);
  });

  it('a broken night means the next Long Rest removes no Exhaustion', () => {
    let s = town('modest', { exhaustion: 2, exhaustionCauses: ['other', 'other'], restless: true });
    s.minutes = 22 * 60;
    s = E.longRest(s, ctx(), true);
    expect(s.characters[0].exhaustion).toBe(2);
    expect(s.characters[0].restless).toBe(false);
  });

  it('city water that fails badly can carry Sight Rot', () => {
    let s = town('squalid');
    s.dayIndex = 2;
    s.minutes = 23 * 60;
    s = E.advance(s, ALL, 120);
    expect(s.characters[0].contagions.some((x) => x.kind === 'sightRot')).toBe(true);
    let ok = town('squalid', { conSave: 10 });
    ok.dayIndex = 2;
    ok.minutes = 23 * 60;
    ok = E.advance(ok, ctx(0.3), 120); // 7 + 10 passes DC 12
    expect(ok.characters[0].contagions).toHaveLength(0);
  });

  it('a cheap potion bought while living rough may be tainted', () => {
    let s = town('squalid');
    s = E.buyItem(s, ALL, s.characters[0].id, 'Potion of Healing', 1, 50, 0);
    expect(s.characters[0].inventory.find((i) => i.name === 'Potion of Healing')?.tainted).toBe(true);
    let m = town('modest');
    m = E.buyItem(m, ALL, m.characters[0].id, 'Potion of Healing', 1, 50, 0);
    expect(m.characters[0].inventory.find((i) => i.name === 'Potion of Healing')?.tainted).toBeUndefined();
  });

  it('after a month of low living, respectable folk shun them until they live better', () => {
    let s = town('squalid', { conSave: 30 });
    s.characters[0].lowLifeDays = 29;
    s.minutes = 23 * 60;
    s = E.advance(s, NONE, 120);
    expect(s.effects.some((e) => e.name === 'Shunned by respectable folk')).toBe(true);
    s.characters[0].lifestyle = 'poor';
    s.minutes = 23 * 60;
    s = E.advance(s, NONE, 120);
    expect(s.effects.some((e) => e.name === 'Shunned by respectable folk')).toBe(false);
  });
});

describe('day-to-day play in town: no lifestyle expenses (2024 PHB)', () => {
  const active = (extra: Parameters<typeof newCharacter>[0] = {}) => {
    const s = town('modest', { needsFood: true, needsWater: true, ...extra });
    s.townMode = 'active';
    return s;
  };

  it('charges no lifestyle and provides no meals; rooms and meals are bought at PHB prices', () => {
    let s = active();
    const id = s.characters[0].id;
    s = E.rentRooms(s, ctx(), [id], 'modest', 2);
    expect(s.characters[0].gp).toBeCloseTo(99);
    s = E.buyMeals(s, ctx(), [id], 'modest', 3);
    expect(s.characters[0].gp).toBeCloseTo(98.7);
    expect(s.characters[0].ateLbToday).toBeGreaterThanOrEqual(1);
    s.minutes = 23 * 60;
    s = E.advance(s, NONE, 120);
    expect(said(s, 'Modest living')).toBe(false);
    expect(s.characters[0].gp).toBeCloseTo(98.7);
  });

  it('a rented room keeps the weather out; without one a character sleeps rough', () => {
    let s = active();
    const party = E.exposure(s, 'rest');
    expect(E.personalExposure(s, s.characters[0], 'rest', party).cold).toBe(true);
    s = E.rentRooms(s, ctx(), [s.characters[0].id], 'poor', 1);
    expect(E.personalExposure(s, s.characters[0], 'rest', party).cold).toBe(false);
    expect(E.livingOf(s, s.characters[0])).toBe('poor');
  });

  it('a squalid room brings the cistern water; sleeping rough day to day means drinking your own', () => {
    let s = active();
    s = E.rentRooms(s, ctx(), [s.characters[0].id], 'squalid', 3);
    s.dayIndex = 2;
    s.minutes = 23 * 60;
    s = E.advance(s, NONE, 120);
    expect(said(s, 'tenement cistern')).toBe(true);
    let r = active();
    r.dayIndex = 2;
    r.minutes = 23 * 60;
    r = E.advance(r, NONE, 120);
    expect(r.log.some((l) => l.text.includes('gutter water'))).toBe(false);
  });

  it('working on a downtime project switches to downtime; leaving town switches back', () => {
    let s = active();
    s.projects = [{ id: 'p', name: 'Rope', kind: 'nonmagical', charIds: [s.characters[0].id], daysRequired: 3, daysDone: 0, costGp: 0, notes: '', done: false }];
    s = E.workOnProjects(s, ctx(), ['p']);
    expect(s.townMode).toBe('downtime');
    s = E.travel(s, ctx(0), { hours: 1, pace: 'normal', difficult: false, foragerIds: [] });
    expect(s.townMode).toBe('active');
  });
});

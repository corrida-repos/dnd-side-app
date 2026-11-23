import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const go = { pace: 'normal' as const, difficult: false, foragerIds: [] as string[] };

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.settings.coldNights = false;
  s.settings.encounters = false;
  s.characters = [
    newCharacter({ name: 'A', survival: 1, darkvision: 60, needsFood: false, needsWater: false, tasks: [] }),
    newCharacter({ name: 'B', survival: 5, darkvision: 60, needsFood: false, needsWater: false, tasks: [] }),
  ];
  s.place = { ...s.place, terrain: 'grassland', onRoute: true, goodRoad: false, settlement: false, waterSource: true };
  s.minutes = 8 * 60;
  s.log = [];
  patch(s);
  return s;
}

describe('table rules for edge cases', () => {
  it('rolls a dying character’s death saves before time moves on', () => {
    const s = fresh((d) => Object.assign(d.characters[0], { hp: 0, dying: true }));
    const n = E.advance(s, ctx(), 60);
    expect(n.characters[0]).toMatchObject({ dying: false, stable: true });
    s.settings.deathSavesResolve = false;
    expect(E.advance(s, ctx(), 60).characters[0].dying).toBe(true);
  });

  it('slows the party to carry an Unconscious companion unless a mount is spare', () => {
    const s = fresh((d) => Object.assign(d.characters[0], { hp: 0, stable: true, wakesAt: 99999999 }));
    expect(E.travel(s, ctx(), { ...go, hours: 1 }).travel.milesToday).toBe(2);
    s.characters.push(newCharacter({ name: 'Mule', kind: 'mount', size: 'Large', needsFood: false, needsWater: false, tasks: [] }));
    s.characters.push(newCharacter({ name: 'Pony', kind: 'mount', size: 'Large', needsFood: false, needsWater: false, tasks: [] }));
    expect(E.travel(s, ctx(), { ...go, hours: 1 }).travel.milesToday).toBe(3);
  });

  it('falls back to the best Survival when nobody can navigate off-road', () => {
    const s = fresh((d) => Object.assign(d.place, { terrain: 'forest', onRoute: false }));
    const n = E.travel(s, ctx(), { ...go, hours: 1, navigatorId: null });
    expect(n.log.some((l) => l.text.includes('B (best Survival) finds the way'))).toBe(true);
    s.settings.fallbackNavigator = false;
    expect(E.travel(s, ctx(), { ...go, hours: 1, navigatorId: null }).log.some((l) => l.text.includes('navigates'))).toBe(false);
  });

  it('slows night travel without light when someone lacks Darkvision', () => {
    const s = fresh((d) => {
      d.minutes = 23 * 60;
      d.characters[0].darkvision = 0;
    });
    expect(E.travel(s, ctx(), { ...go, hours: 1 }).travel.milesToday).toBe(2);
    // A torch in the pack isn't enough: it has to be lit.
    const packed = E.addInventory(s, ctx(), s.characters[0].id, 'Torch');
    expect(E.travel(packed, ctx(), { ...go, hours: 1 }).travel.milesToday).toBe(2);
    const lit = E.addEffect(s, ctx(), { preset: { name: 'Torch', kind: 'light', minutes: 60 }, minutes: 60, targetIds: [], casterId: null });
    expect(E.travel(lit, ctx(), { ...go, hours: 1 }).travel.milesToday).toBe(3);
  });

  it('can blow a ship off course in a storm', () => {
    const base = fresh((d) => Object.assign(d.weather, { wind: 'strong', precip: 'heavy' }));
    const s = E.createStash(base, ctx(), 'Sea Wolf', 'vehicle', '', 200000, 2);
    const opts = { ...go, hours: 10, vesselId: s.stashes[0].id };
    expect(E.travel(s, ctx(0), opts).travel.milesToday).toBe(10);
    expect(E.travel(s, ctx(0.99), opts).travel.milesToday).toBe(20);
  });

  it('feeds hirelings from the camp stores outside town', () => {
    const s = fresh((d) => {
      d.minutes = 23 * 60;
      d.stores = { foodLb: 1.5, waterGal: 5, foodRawLb: 0, waterUnsafeGal: 0 };
      d.hirelings = [
        { id: 'g', name: 'Tam', role: 'guide', bonus: 2, passivePerception: 12, skilled: true, wageGp: 0, payer: 'party', active: true },
        { id: 'p', name: 'Wil', role: 'porter', bonus: 0, passivePerception: 10, skilled: false, wageGp: 0, payer: 'party', active: true },
      ];
    });
    const n = E.advance(s, ctx(), 60);
    expect(n.stores).toMatchObject({ foodLb: 0, waterGal: 3 });
    expect(n.log.some((l) => l.text.includes('0.5 lb of food short'))).toBe(true);
  });

  it('drops a character in debt to a cheaper lifestyle', () => {
    const s = fresh((d) => {
      d.place.settlement = true;
      d.townMode = "downtime";
      d.minutes = 23 * 60;
      Object.assign(d.characters[0], { lifestyle: 'modest', gp: 0, purse: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 } });
    });
    expect(E.advance(s, ctx(), 60).characters[0].lifestyle).toBe('poor');
  });

  it('scales foraging to the hours spent on the road', () => {
    const s = fresh((d) => {
      d.settings.rawFoodRisk = false;
      d.stores = { foodLb: 0, waterGal: 0, foodRawLb: 0, waterUnsafeGal: 0 };
      d.characters[1].wisMod = 4;
    });
    // d6 rolls 4, +4 Wisdom = 8 lb for a full day; a 2-hour leg finds a quarter of that.
    expect(E.travel(s, ctx(), { ...go, hours: 2, foragerIds: [s.characters[1].id] }).stores.foodLb).toBe(2);
  });
});

describe('working on projects while marching (table rule)', () => {
  const withProject = (walkable: boolean) =>
    fresh((s) => {
      s.settings.forcedMarch = false;
      const item = walkable ? 'Quarterstaff' : 'Plate Armor';
      s.projects = [{ id: 'p', name: item, kind: 'nonmagical', charIds: [s.characters[0].id], daysRequired: 3, daysDone: 0, costGp: 1, notes: '', done: false, product: { name: item, qty: 1 } }];
    });

  it('counts marching hours at half rate toward hand-held projects', () => {
    const s = E.travel(withProject(true), ctx(), { ...go, hours: 8 });
    expect(s.projects[0].daysDone).toBe(0);
    expect(s.projects[0].marchWorkHours).toBe(4);
    const t = E.travel(s, ctx(), { ...go, hours: 8 });
    expect(t.projects[0].daysDone).toBe(1);
    expect(t.projects[0].marchWorkHours).toBe(0);
  });

  it('skips projects that need a workbench, crafters who navigate or forage, and the switch when off', () => {
    expect(E.travel(withProject(false), ctx(), { ...go, hours: 8 }).projects[0].marchWorkHours ?? 0).toBe(0);
    const s = withProject(true);
    expect(E.travel(s, ctx(), { ...go, hours: 8, navigatorId: s.characters[0].id }).projects[0].marchWorkHours ?? 0).toBe(0);
    expect(E.travel(s, ctx(), { ...go, hours: 8, foragerIds: [s.characters[0].id] }).projects[0].marchWorkHours ?? 0).toBe(0);
    s.settings.workWhileMarching = false;
    expect(E.travel(s, ctx(), { ...go, hours: 8 }).projects[0].marchWorkHours ?? 0).toBe(0);
  });

  it('finishes the project on the road', () => {
    const s = withProject(true);
    s.projects[0].daysDone = 2;
    s.projects[0].marchWorkHours = 6;
    const t = E.travel(s, ctx(), { ...go, hours: 4 });
    expect(t.projects[0].done).toBe(true);
  });

  it('lets writers scribe on the march only while they keep their concentration', () => {
    const scroll = (rng: number, spell = false) => {
      const s = fresh((st) => {
        st.settings.forcedMarch = false;
        st.projects = [{ id: 'p', name: 'Spell Scroll', kind: 'scroll', charIds: [st.characters[0].id], daysRequired: 3, daysDone: 0, costGp: 1, notes: '', done: false }];
        if (spell) st.effects = [{ id: 'e', name: 'Detect Magic', kind: 'other', targetIds: [st.characters[0].id], casterId: st.characters[0].id, concentration: true, shelter: false, startedAt: 0, endsAt: null, notes: '' }];
      });
      return E.travel(s, ctx(rng), { ...go, pace: 'slow', hours: 4 });
    };
    expect(scroll(0.9).projects[0].marchWorkHours).toBe(2);
    const fumbled = scroll(0);
    expect(fumbled.projects[0].marchWorkHours ?? 0).toBe(0);
    expect(fumbled.log.some((l) => /loses concentration on Spell Scroll/.test(l.text))).toBe(true);
    expect(scroll(0.9, true).projects[0].marchWorkHours ?? 0).toBe(0);
  });

  it('keeps writing a one-person job, at the desk and on the march', () => {
    const s = fresh((st) => {
      st.settings.forcedMarch = false;
      st.settings.extraCraftHelpers = true;
      st.projects = [{ id: 'p', name: 'Copy Fireball', kind: 'spellcopy', charIds: st.characters.map((c) => c.id), daysRequired: 6, daysDone: 0, costGp: 1, notes: '', done: false }];
    });
    expect(E.marchWorkers(s, s.projects[0], null, [], 'slow')).toHaveLength(1);
    expect(E.travel(s, ctx(0.9), { ...go, pace: 'slow', hours: 4 }).projects[0].marchWorkHours).toBe(2);
    expect(E.workOnProjects(s, ctx(), ['p']).projects[0].daysDone).toBe(1);
  });

  it('only lets writers write at a slow pace', () => {
    const s = fresh((st) => {
      st.settings.forcedMarch = false;
      st.projects = [{ id: 'p', name: 'Spell Scroll', kind: 'scroll', charIds: [st.characters[0].id], daysRequired: 3, daysDone: 0, costGp: 1, notes: '', done: false }];
    });
    const t = E.travel(s, ctx(0.9), { ...go, hours: 4 });
    expect(t.projects[0].marchWorkHours ?? 0).toBe(0);
    expect(t.log.some((l) => /needs a slow pace/.test(l.text))).toBe(true);
  });

  it('stops hand work at a fast pace', () => {
    const s = fresh((st) => {
      st.settings.forcedMarch = false;
      st.projects = [{ id: 'p', name: 'Quarterstaff', kind: 'nonmagical', charIds: [st.characters[0].id], daysRequired: 3, daysDone: 0, costGp: 1, notes: '', done: false, product: { name: 'Quarterstaff', qty: 1 } }];
    });
    const t = E.travel(s, ctx(), { ...go, pace: 'fast', hours: 4 });
    expect(t.projects[0].marchWorkHours ?? 0).toBe(0);
    expect(t.log.some((l) => /hand work on the march needs a normal or slow pace/.test(l.text))).toBe(true);
    expect(E.travel(s, ctx(), { ...go, pace: 'slow', hours: 4 }).projects[0].marchWorkHours).toBe(2);
  });
});

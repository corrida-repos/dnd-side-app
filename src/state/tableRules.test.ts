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

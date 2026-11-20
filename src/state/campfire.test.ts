import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { fireKeepsWarm, fireLighting } from '../rules/campfire';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function camp(tempF: number, patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: tempF, low: tempF, wind: 'none', precip: 'none' };
  s.place = { ...s.place, shelter: 'none', settlement: false };
  s.settings.sleepDeprivation = false;
  s.settings.autoRollSaves = false;
  s.characters = [newCharacter({ id: 'a', name: 'Ash', survival: 3, needsFood: false, needsWater: false })];
  s.fire = { lit: false, fuelHours: 6, sheltered: false };
  s.log = [];
  patch(s);
  return s;
}

describe('lighting a campfire', () => {
  it('gets harder with damp fuel and foul weather, and is impossible on an open pit in a storm', () => {
    const w = camp(50).weather;
    expect(fireLighting(w, 50, false, false)).toEqual({ possible: true, dc: 10, why: [] });
    expect(fireLighting({ ...w, precip: 'light' }, 50, false, false).dc).toBe(15);
    expect(fireLighting({ ...w, precip: 'heavy' }, 50, false, false).possible).toBe(false);
    expect(fireLighting({ ...w, precip: 'heavy' }, 50, true, false).dc).toBe(20);
    expect(fireLighting({ ...w, wind: 'strong' }, 50, false, true).dc).toBe(10);
  });

  it('rolls Wisdom (Survival) and spends the time either way', () => {
    const fail = E.lightFire(camp(50), ctx(0), 'a', 'tinderbox');
    expect(fail.fire.lit).toBe(false);
    expect(fail.minutes - camp(50).minutes).toBe(1);
    expect(fail.log.at(-1)!.text).toMatch(/can't get the fire to catch/);
    const ok = E.lightFire(camp(50), ctx(0.99), 'a', 'tinderbox');
    expect(ok.fire.lit).toBe(true);
  });

  it('takes 10 minutes and DC +5 without a Tinderbox', () => {
    const s = E.lightFire(camp(50), ctx(0.99), 'a', 'friction');
    expect(s.minutes - camp(50).minutes).toBe(10);
    expect(s.log.at(-1)!.text).toMatch(/DC 15/);
  });

  it('lights at once with Prestidigitation, and always with the check turned off', () => {
    const caster = camp(50, (s) => (s.characters[0].spells = [{ name: 'Prestidigitation', level: 0, prepared: true, alwaysPrepared: false }]));
    expect(E.lightFire(caster, ctx(0), 'a', 'spell').fire.lit).toBe(true);
    expect(E.lightFire(camp(50, (s) => (s.settings.fireLightingCheck = false)), ctx(0), 'a', 'tinderbox').fire.lit).toBe(true);
  });
});

describe('warmth', () => {
  it('protects only down to the limit, 10°F lower in a sheltered pit', () => {
    expect(fireKeepsWarm(-15, -20, false)).toBe(true);
    expect(fireKeepsWarm(-25, -20, false)).toBe(false);
    expect(fireKeepsWarm(-25, -20, true)).toBe(true);
  });

  it('keeps the camp out of extreme cold while the temperature allows', () => {
    const mild = camp(-10, (s) => (s.fire.lit = true));
    expect(E.exposure(mild, 'camp').cold).toBe(false);
    expect(E.exposure(mild, 'travel').cold).toBe(true);
    const bitter = camp(-30, (s) => (s.fire.lit = true));
    const exp = E.exposure(bitter, 'camp');
    expect(exp.cold).toBe(true);
    expect(exp.reason).toMatch(/Too cold for the campfire/);
  });

  it('asks for cold saves by the fire only when it is too cold for it', () => {
    const mild = E.advance(camp(-10, (s) => (s.fire.lit = true)), ctx(), 60, 'camp');
    expect(mild.pending.filter((p) => p.kind === 'cold')).toHaveLength(0);
    const bitter = E.advance(camp(-30, (s) => (s.fire.lit = true)), ctx(), 60, 'camp');
    expect(bitter.pending.filter((p) => p.kind === 'cold')).toHaveLength(1);
  });
});

describe('cooking over the fire', () => {
  it('cooks all the raw food into safe stores', () => {
    const s = E.cookRawFood(
      camp(50, (d) => {
        d.fire.lit = true;
        d.stores = { ...d.stores, foodLb: 2, foodRawLb: 5 };
      }),
      ctx(),
    );
    expect(s.stores.foodRawLb).toBe(0);
    expect(s.stores.foodLb).toBe(7);
  });

  it('needs a lit fire', () => {
    const s = E.cookRawFood(camp(50, (d) => (d.stores = { ...d.stores, foodRawLb: 5 })), ctx());
    expect(s.stores.foodRawLb).toBe(5);
  });
});

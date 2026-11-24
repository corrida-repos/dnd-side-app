import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { getState, importState, undo } from './store';
import { MECHANICS, TIERS, closestTier, matchTier, tierPreset } from '../rules/detailTiers';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.encounters = false;
  s.characters = [newCharacter({ name: 'A', tasks: [] })];
  s.place = { ...s.place, terrain: 'forest', onRoute: false, goodRoad: false, settlement: false, waterSource: true };
  s.minutes = 8 * 60;
  s.log = [];
  patch(s);
  return s;
}

describe('levels of detail', () => {
  it('ranks every rule once, and each tier includes everything below it', () => {
    expect(new Set(MECHANICS.map((m) => m.key)).size).toBe(MECHANICS.length);
    for (const t of TIERS.slice(1)) {
      const lower = tierPreset((t.id - 1) as 1 | 2 | 3 | 4);
      const here = tierPreset(t.id);
      for (const m of MECHANICS) if (lower[m.key]) expect(here[m.key]).toBe(true);
    }
  });

  it('keeps injuries, madness and gear wear for Brutal, the hardest tier', () => {
    for (const key of ['lingeringInjuries', 'madness', 'gearWear'] as const) {
      expect(MECHANICS.find((m) => m.key === key)?.tier).toBe(5);
      expect(tierPreset(4)[key]).toBe(false);
      expect(tierPreset(5)[key]).toBe(true);
    }
    expect(createDefaultState(() => 0).settings).toMatchObject({ lingeringInjuries: false, madness: false, gearWear: false });
    expect(matchTier(E.setDetailTier(fresh(), ctx(), 5).settings)).toBe(5);
  });

  it('starts new games at Gritty and recognises hand-made mixes', () => {
    const s = createDefaultState(() => 0);
    expect(matchTier(s.settings)).toBe(3);
    s.settings.weatherDamage = true;
    expect(matchTier(s.settings)).toBeNull();
    expect(closestTier(s.settings)).toEqual({ tier: 3, differences: 1 });
  });

  it('sets every tiered switch, preserves campaign selections, and logs it', () => {
    const s = fresh((d) => {
      d.settings.coldGear2014 = true;
      d.settings.encounterBooks = ['XMM'];
      d.settings.extraCraftHelpers = true;
    });
    const light = E.setDetailTier(s, ctx(), 1);
    expect(matchTier(light.settings)).toBe(1);
    expect(light.settings).toMatchObject({ foodAndWater: false, encounters: false, deathSavesResolve: false, coldGear2014: false, circleMagic: true, facilityBooks: ['FRHoF', 'EFA'], encounterBooks: ['XMM'], extraCraftHelpers: true });
    expect(light.log.at(-1)?.text).toMatch(/Light/);
    expect(matchTier(E.setDetailTier(light, ctx(), 4).settings)).toBe(4);
  });

  it('includes 5.5e player options in Light, with 5.5e requirements starting at Standard', () => {
    const light = E.setDetailTier(fresh(), ctx(), 1);
    expect(light.settings).toMatchObject({
      circleMagic: true,
      foodAndWater: false,
      extremeWeather: false,
      forcedMarch: false,
      navigation: false,
      encumbrance: false,
      chargeCosts: false,
      trackComponents: false,
      trackGearUse: false,
      stabling: false,
      encounters: false,
      coinWeight: false,
      tentSpace: false,
    });
    const s = E.setDetailTier(light, ctx(), 2);
    expect(s.settings).toMatchObject({
      coinWeight: true,
      tentSpace: true,
      circleMagic: true,
      armsTraining: false,
      sidekicks: false,
      taming: false,
      deathSavesResolve: false,
      fireWarmsCamp: false,
      batchCrafting: false,
      fallbackNavigator: false,
      workWhileMarching: false,
      coldGear2014: false,
      heavyClothing2014: false,
      climateAdjustedPrecip: false,
    });
    expect(tierPreset(3)).toMatchObject({ coinWeight: true, tentSpace: true, circleMagic: true, armsTraining: true, sidekicks: true, taming: true });
    expect(tierPreset(4)).toMatchObject({ coldGear2014: true, heavyClothing2014: true, climateAdjustedPrecip: true });
  });

  it('enables all supported 5.5e Bastion books at every tier and recognises custom selections', () => {
    for (const { id } of TIERS) expect(tierPreset(id).facilityBooks).toEqual(['FRHoF', 'EFA']);
    const s = fresh();
    const withBastion = E.foundBastion(s, ctx(), s.characters[0].id, 'Keep');
    const withForge = E.addFacility(withBastion, ctx(), withBastion.bastions[0].id, {
      kind: 'special',
      name: 'Construct Forge',
      size: 'roomy',
      alreadyBuilt: true,
    });
    expect(withForge.bastions[0].facilities.some((facility) => facility.name === 'Construct Forge')).toBe(true);
    const light = E.setDetailTier(withForge, ctx(), 1);
    expect(light.bastions).toEqual(withForge.bastions);
    expect(matchTier(light.settings)).toBe(1);

    light.settings.facilityBooks = ['FRHoF'];
    expect(matchTier(light.settings)).toBeNull();
    expect(closestTier(light.settings)).toEqual({ tier: 1, differences: 1 });
    expect(E.setDetailTier(light, ctx(), 1).settings.facilityBooks).toEqual(['FRHoF', 'EFA']);
  });

  it('upgrades saves using the previous Light preset and preserves custom selections', () => {
    const oldLight = E.setDetailTier(fresh(), ctx(), 1);
    oldLight.version = 2;
    oldLight.settings.circleMagic = false;
    oldLight.settings.facilityBooks = [];

    expect(importState(oldLight)).toBe(true);
    try {
      expect(matchTier(getState().settings)).toBe(1);
    } finally {
      undo();
    }

    oldLight.settings.facilityBooks = ['EFA'];
    expect(importState(oldLight)).toBe(true);
    try {
      expect(getState().settings).toMatchObject({ circleMagic: false, facilityBooks: ['EFA'] });
    } finally {
      undo();
    }
  });

  it('Light: no hunger, thirst, cold saves, forced march or getting lost', () => {
    const s = E.setDetailTier(fresh(), ctx(), 1);
    s.weather = { ...s.weather, high: -10, low: -20 };
    const day = E.advance(s, ctx(0), 24 * 60);
    expect(day.characters[0].exhaustion).toBe(0);
    expect(day.pending).toHaveLength(0);
    const trip = E.travel(s, ctx(0), { pace: 'normal', difficult: false, foragerIds: [], hours: 12 });
    expect(trip.travel.lost).toBe(false);
    expect(trip.characters[0].exhaustion).toBe(0);
  });

  it('Standard: the same day without food or water costs Exhaustion', () => {
    const s = E.setDetailTier(fresh(), ctx(), 2);
    const day = E.advance(s, ctx(0), 24 * 60);
    expect(day.characters[0].exhaustion).toBeGreaterThan(0);
  });

  it('carrying capacity and the 5 × / 10 × Strength thresholds can be switched off', () => {
    const s = fresh();
    const c = s.characters[0];
    c.strScore = 10;
    c.inventory.push({ id: 'rock', name: 'Rock', qty: 1, weight: 120, source: 'manual' } as (typeof c.inventory)[number]);
    expect(E.carriedLoad(s, c).level).toBe('heavy');
    s.settings.variantEncumbrance = false;
    expect(E.carriedLoad(s, c).level).toBe('light');
    s.settings.variantEncumbrance = true;
    s.settings.encumbrance = false;
    expect(E.carriedLoad(s, c).level).toBe('light');
  });
});

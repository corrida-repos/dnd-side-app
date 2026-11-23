import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { illumination, sightFor, weatherObscures } from '../rules/sight';
import { MOON_CYCLE } from '../rules/longterm';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const NO_DV = { darkvision: 0, seesInDark: false };
const DV = { darkvision: 60, seesInDark: false };
const light = (s: State, name: string, kind: 'light' | 'spell' = 'light', targetIds: string[] = [], casterId: string | null = null) =>
  E.addEffect(s, ctx(), { preset: { name, kind, minutes: 60 }, minutes: 60, targetIds, casterId });

/** Night on open grassland under a new moon, one human (no Darkvision) and one elf (Darkvision 60 ft). */
function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.settings.coldNights = false;
  s.settings.encounters = false;
  s.settings.navigation = false;
  s.settings.moonOffset = -s.dayIndex;
  s.characters = [
    newCharacter({ name: 'Human', passivePerception: 12, needsFood: false, needsWater: false }),
    newCharacter({ name: 'Elf', passivePerception: 14, darkvision: 60, needsFood: false, needsWater: false }),
  ];
  s.minutes = 23 * 60;
  s.fire = { lit: false, fuelHours: 0, sheltered: false };
  s.log = [];
  patch(s);
  return s;
}

describe('vision and light (2024 PHB)', () => {
  it('lets Darkvision see Dim Light as Bright and Darkness as Dim', () => {
    expect(sightFor('dim', 'twilight', DV, null)).toMatchObject({ penalty: 0, mode: 'normal' });
    expect(sightFor('dark', 'night', DV, null)).toMatchObject({ penalty: -5, blind: false, mode: 'disadvantage' });
    expect(sightFor('dark', 'night', NO_DV, null)).toMatchObject({ penalty: -5, blind: true });
    expect(sightFor('dark', 'night', { darkvision: 0, seesInDark: true }, null)).toMatchObject({ penalty: 0, blind: false });
  });

  it("doesn't let Darkvision or a light see through heavy rain, and doesn't stack Disadvantage", () => {
    expect(sightFor('bright', 'a light source', NO_DV, 'heavy rain')).toMatchObject({ penalty: -5, mode: 'disadvantage' });
    expect(sightFor('dark', 'night', DV, 'heavy rain').penalty).toBe(-5);
    expect(weatherObscures({ precip: 'heavy', wind: 'none', sandy: false, snow: true, indoors: false })).toContain('snow');
    expect(weatherObscures({ precip: 'heavy', wind: 'none', sandy: false, snow: false, indoors: true })).toBeNull();
    expect(weatherObscures({ precip: 'none', wind: 'strong', sandy: true, snow: false, indoors: false })).toBe('a sandstorm');
  });

  it('gives a full moon Dim Light, and a light source Bright Light', () => {
    expect(illumination({ phase: 'Night', underground: false, lit: false, fullMoon: true }).level).toBe('dim');
    expect(illumination({ phase: 'Night', underground: true, lit: false, fullMoon: true }).level).toBe('dark');
    expect(illumination({ phase: 'Night', underground: true, lit: true, fullMoon: false }).level).toBe('bright');
  });
});

describe('Darkvision from spells and items', () => {
  it('counts an active Darkvision spell, Goggles of Night and Devil’s Sight', () => {
    const s = fresh();
    const [human, elf] = s.characters;
    expect(E.visionOf(s, human).darkvision).toBe(0);
    const spell = light(s, 'Darkvision', 'spell', [human.id], elf.id);
    expect(E.visionOf(spell, spell.characters[0]).darkvision).toBe(150);
    expect(E.sightNow(spell, spell.characters[0], 'camp').blind).toBe(false);
    const goggles = fresh((d) => {
      d.characters[0].inventory.push({ id: 'g', name: 'Goggles of Night', qty: 1, weight: 0, source: 'manual', container: null, ammo: null });
      d.characters[1].inventory.push({ id: 'g2', name: 'Goggles of Night', qty: 1, weight: 0, source: 'manual', container: null, ammo: null });
    });
    expect(E.visionOf(goggles, goggles.characters[0]).darkvision).toBe(60);
    expect(E.visionOf(goggles, goggles.characters[1]).darkvision).toBe(120);
    const warlock = fresh((d) => (d.characters[0].features = ["Devil's Sight"]));
    expect(E.sightNow(warlock, warlock.characters[0], 'camp')).toMatchObject({ penalty: 0, blind: false });
  });
});

describe('sight in play', () => {
  it('slows night travel only without a lit light, Darkvision or moonlight', () => {
    const slowed = (s: State) => E.travel(s, ctx(), { pace: 'normal', hours: 1, difficult: false, foragerIds: [] }).log.some((l) => l.text.includes('picks its way forward'));
    expect(slowed(fresh())).toBe(true);
    // An unlit torch in the pack doesn't light the way.
    expect(slowed(fresh((d) => d.characters[0].inventory.push({ id: 't', name: 'Torch', qty: 1, weight: 1, source: 'manual', container: null, ammo: null })))).toBe(true);
    const lit = light(fresh(), 'Torch');
    expect(slowed(lit)).toBe(false);
    const candle = light(fresh(), 'Candle');
    expect(slowed(candle)).toBe(true);
    expect(slowed(fresh((d) => (d.settings.moonOffset = MOON_CYCLE / 2 - d.dayIndex)))).toBe(false);
    expect(slowed(fresh((d) => (d.characters = [d.characters[1]])))).toBe(false);
  });

  it('fails a search in the dark without sight, and gives Disadvantage in the rain', () => {
    const said = (s: State, what: 'search' | 'track', text: string) => E.searchCheck(s, ctx(), s.characters[0].id, what, 0).log.some((l) => l.text.includes(text));
    expect(said(fresh(), 'search', 'nothing to see')).toBe(true);
    expect(said(fresh(), 'track', 'nothing to see')).toBe(true);
    const day = fresh((d) => (d.minutes = 12 * 60));
    const rain = fresh((d) => {
      d.minutes = 12 * 60;
      d.weather = { ...d.weather, precip: 'heavy' };
    });
    expect(said(day, 'search', 'Disadvantage')).toBe(false);
    expect(said(rain, 'search', 'Disadvantage')).toBe(true);
    expect(said(rain, 'track', 'Disadvantage')).toBe(false); // obscurement hinders Perception, not Survival
  });

  it('uses sight in the surprise check', () => {
    // Elf (passive 14, Darkvision: −5 in Darkness) and Human (12, hearing only: −5). Best is the elf at 9.
    const s = fresh();
    expect(E.sightNow(s, s.characters[1], 'camp').penalty).toBe(-5);
    const lit = fresh((d) => (d.fire = { lit: true, fuelHours: 3, sheltered: false }));
    expect(E.sightNow(lit, lit.characters[0], 'camp')).toMatchObject({ penalty: 0, blind: false });
    expect(E.sightNow(lit, lit.characters[0], 'travel').blind).toBe(true); // the campfire doesn't travel with you
  });
});

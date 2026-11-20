import { describe, expect, it } from 'vitest';
import { rollWeather, temperatureAt, windFromRoll, precipFromRoll, precipKind, fireThreat } from './weather';
import { CALENDARS, dateFromIndex, indexFromDate, yearLength, formatDate } from './calendar';
import { nonmagicalCrafting, magicItemCrafting, calendarDays, SCROLL_CRAFTING } from './crafting';
import { parse5eToolsSpells, preparedLimit, PREPARED_TABLE } from './spells';
import { exhaustionSummary, proficiencyBonus } from './survival';
import { newCharacter } from '../state/defaults';

/** rng that returns values producing the given die faces for a d-sided die sequence. */
export const seq = (vals: number[]) => {
  let i = 0;
  return () => vals[i++ % vals.length];
};
/** value in [0,1) that makes die(sides) return face */
export const face = (f: number, sides: number) => (f - 0.5) / sides;

describe('weather tables', () => {
  it('maps the wind and precipitation d20 bands', () => {
    expect([1, 12, 13, 17, 18, 20].map(windFromRoll)).toEqual(['none', 'none', 'light', 'light', 'strong', 'strong']);
    expect([12, 13, 18].map(precipFromRoll)).toEqual(['none', 'light', 'heavy']);
  });

  it('rolls colder by 1d4×10 on 15–17 and warmer on 18–20', () => {
    const cold = rollWeather({ dayIndex: 0, season: 'summer', climate: 'temperate', altitudeFt: 0, climateAdjustedPrecip: false }, seq([face(16, 20), face(3, 4), face(1, 20), face(1, 20)]));
    expect(cold.tempShift).toBe(-30);
    expect(cold.high).toBe(82 - 30);
    const warm = rollWeather({ dayIndex: 0, season: 'summer', climate: 'temperate', altitudeFt: 0, climateAdjustedPrecip: false }, seq([face(19, 20), face(2, 4), face(18, 20), face(20, 20)]));
    expect(warm.tempShift).toBe(20);
    expect(warm.wind).toBe('strong');
    expect(warm.precip).toBe('heavy');
    const normal = rollWeather({ dayIndex: 0, season: 'winter', climate: 'temperate', altitudeFt: 2000, climateAdjustedPrecip: false }, seq([face(5, 20), face(1, 20), face(1, 20)]));
    expect(normal.tempShift).toBe(0);
    expect(normal.altitudeAdj).toBe(-7);
  });

  it('keeps the Underdark free of wind and rain', () => {
    const w = rollWeather({ dayIndex: 0, season: 'summer', climate: 'underdark', altitudeFt: 0, climateAdjustedPrecip: true }, seq([face(20, 20), face(4, 4), face(20, 20), face(20, 20)]));
    expect(w.wind).toBe('none');
    expect(w.precip).toBe('none');
    expect(w.tempShift).toBe(0);
  });

  it('peaks at 15:00 and bottoms out at 05:00', () => {
    const w = rollWeather({ dayIndex: 0, season: 'summer', climate: 'temperate', altitudeFt: 0, climateAdjustedPrecip: false }, seq([face(1, 20)]));
    expect(temperatureAt(w, 15 * 60)).toBe(w.high);
    expect(temperatureAt(w, 5 * 60)).toBe(w.low);
    const t3 = temperatureAt(w, 3 * 60);
    expect(t3).toBeGreaterThanOrEqual(w.low);
    expect(t3).toBeLessThan(temperatureAt(w, 21 * 60));
  });

  it('knows snow from rain and what puts out a fire', () => {
    expect(precipKind(20)).toBe('snow');
    expect(precipKind(34)).toBe('sleet');
    expect(precipKind(50)).toBe('rain');
    const w = rollWeather({ dayIndex: 0, season: 'summer', climate: 'temperate', altitudeFt: 0, climateAdjustedPrecip: false }, seq([face(1, 20), face(1, 20), face(20, 20)]));
    expect(fireThreat(w, 60)).toBe('heavy rain');
    expect(fireThreat(w, 10)).toBeNull();
  });
});

describe('calendar', () => {
  it('has 365 days in Harptos and round-trips dates', () => {
    const c = CALENDARS.harptos;
    expect(yearLength(c)).toBe(365);
    const idx = indexFromDate(c, 1492, 1493, 6, 15);
    const d = dateFromIndex(c, 1492, idx);
    expect([d.year, d.month.name, d.day]).toEqual([1493, 'Mirtul', 15]);
    expect(formatDate(c, 1492, indexFromDate(c, 1492, 1492, 1, 1))).toBe('Midwinter, 1492 DR');
  });
});

describe('crafting', () => {
  it('crafts nonmagical items at 10 GP per day for half price', () => {
    expect(nonmagicalCrafting(50)).toEqual({ days: 5, gp: 25 });
    expect(nonmagicalCrafting(15)).toEqual({ days: 2, gp: 7 }); // half the price, rounded down
  });
  it('halves consumable magic items and splits time between crafters', () => {
    expect(magicItemCrafting('rare', false)).toEqual({ days: 50, gp: 2000 });
    expect(magicItemCrafting('uncommon', true)).toEqual({ days: 5, gp: 100 });
    expect(calendarDays(10, 3)).toBe(4);
    expect(SCROLL_CRAFTING[3]).toEqual({ level: 3, days: 5, gp: 150 });
  });
});

describe('spells', () => {
  it('reads the prepared limit from the class table, with overrides', () => {
    expect(preparedLimit(newCharacter({ className: 'Wizard', level: 5 }))).toBe(9);
    expect(preparedLimit(newCharacter({ className: 'Paladin', level: 1 }))).toBe(2);
    expect(preparedLimit(newCharacter({ className: 'Fighter', level: 5 }))).toBeNull();
    expect(preparedLimit(newCharacter({ className: 'Cleric', level: 5, preparedOverride: 12 }))).toBe(12);
    for (const t of Object.values(PREPARED_TABLE)) expect(t).toHaveLength(20);
  });

  it('parses 5etools spell JSON without keeping text', () => {
    const parsed = parse5eToolsSpells({
      spell: [
        { name: 'Shield', level: 1, school: 'A', source: 'XPHB', entries: ['long text'] },
        { name: 'Detect Magic', level: 1, school: 'D', source: 'XPHB', meta: { ritual: true }, duration: [{ type: 'timed', concentration: true }] },
        { name: 'Shield', level: 1, school: 'A', source: 'XPHB' },
        { name: 'Bad' },
      ],
    });
    expect(parsed.map((s) => s.name)).toEqual(['Detect Magic', 'Shield']);
    expect(parsed[0]).toMatchObject({ school: 'Divination', ritual: true, concentration: true });
    expect(JSON.stringify(parsed)).not.toContain('long text');
  });
});

describe('survival helpers', () => {
  it('describes 2024 exhaustion and proficiency', () => {
    expect(exhaustionSummary(3)).toBe('−6 to D20 Tests, Speed −15 ft');
    expect(exhaustionSummary(6)).toBe('Dead');
    expect([1, 4, 5, 9, 13, 17].map(proficiencyBonus)).toEqual([2, 2, 3, 4, 5, 6]);
  });
});

import { GEAR_CATALOG } from './crafting';
import { specialSlots, rollBastionEvent } from './bastion';

describe('gear and bastion tables', () => {
  it('crafts common gear at 10 GP per workday', () => {
    const t = (n: string) => nonmagicalCrafting(GEAR_CATALOG.find((g) => g.name === n)!.gp);
    expect(t('Plate Armor')).toEqual({ days: 150, gp: 750 });
    expect(t('Chain Mail')).toEqual({ days: 8, gp: 37 });
    expect(t('Longsword')).toEqual({ days: 2, gp: 7 });
    expect(calendarDays(t('Plate Armor').days, 3)).toBe(50);
    expect(calendarDays(t('Plate Armor').days, 3, false)).toBe(75); // normally only one helper
  });
  it('grants special facility slots by level and covers the whole d100', () => {
    expect([4, 5, 8, 9, 13, 17, 20].map(specialSlots)).toEqual([0, 2, 2, 4, 5, 6, 6]);
    for (let r = 0; r < 100; r++) expect(rollBastionEvent(() => r / 100).event).toBeTruthy();
  });
});

import { weatherDamageAffinities } from './weather';

describe('Eberron calendar', () => {
  it('has 12 months of 28 days and built-in holidays', () => {
    const c = CALENDARS.galifar;
    expect(yearLength(c)).toBe(336);
    expect(formatDate(c, 998, indexFromDate(c, 998, 998, 1, 20))).toBe('20 Olarune, 998 YK');
    expect(c.holidays?.find((h) => h.name === 'Long Shadows')).toMatchObject({ monthIndex: 11, day: 26, days: 3 });
    expect(c.months[0].moon).toBe('Zarantyr');
  });
});

describe('weather and damage (table rule)', () => {
  const base = rollWeather({ dayIndex: 0, season: 'summer', climate: 'temperate', altitudeFt: 0, climateAdjustedPrecip: false }, seq([face(1, 20)]));
  const aff = (patch: Partial<typeof base>, tempNow: number, minutes: number, sheltered = false) =>
    weatherDamageAffinities({ weather: { ...base, ...patch }, tempNow, minutes, sheltered }).map((a) => `${a.type}${a.dir > 0 ? '+' : '-'}`);

  it('favors lightning and thunder in a storm and hinders fire', () => {
    expect(aff({ precip: 'heavy', wind: 'strong' }, 60, 12 * 60)).toEqual(['Lightning+', 'Thunder+', 'Fire-']);
  });
  it('favors cold in snow and extreme cold, fire in extreme heat', () => {
    expect(aff({ precip: 'heavy', wind: 'none' }, -5, 2 * 60)).toEqual(['Cold+', 'Necrotic+', 'Fire-']);
    expect(aff({ precip: 'none', wind: 'none' }, 105, 14 * 60)).toEqual(['Fire+', 'Radiant+', 'Cold-']);
  });
  it('does nothing under shelter, and the Underdark has its own pull', () => {
    expect(aff({ precip: 'heavy', wind: 'strong' }, 60, 12 * 60, true)).toEqual([]);
    expect(aff({ climate: 'underdark' }, 55, 12 * 60)).toEqual(['Necrotic+', 'Radiant-']);
  });
});

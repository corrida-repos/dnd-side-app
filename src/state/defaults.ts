import type { Character, State, Task } from './types';
import { CALENDARS, indexFromDate } from '../rules/calendar';
import { rollWeather } from '../rules/weather';
import { isCaster } from '../rules/spells';
import type { Rng } from '../rules/dice';

export const SAVE_VERSION = 1;

export const uid = (): string => Math.random().toString(36).slice(2, 10);

export function defaultTasks(isSpellcaster: boolean): Task[] {
  const t: Task[] = [
    { id: uid(), label: 'Eat and drink', done: false, daily: true },
    { id: uid(), label: 'Check gear, ammunition and attunement', done: false, daily: true },
  ];
  if (isSpellcaster) t.unshift({ id: uid(), label: 'Prepare spells', done: false, daily: true });
  return t;
}

export function newCharacter(partial: Partial<Character> = {}): Character {
  const className = partial.className ?? 'Fighter';
  return {
    id: uid(),
    name: 'New adventurer',
    className,
    level: 1,
    size: 'Medium',
    conSave: 0,
    wisMod: 0,
    survival: 0,
    exhaustion: 0,
    coldResist: 'none',
    fireResist: 'none',
    coldWeatherGear: false,
    bedroll: true,
    blanket: false,
    nightChill: null,
    heavyGarb: false,
    armorKind: 'none',
    armorName: '',
    armorWorn: false,
    hasShield: false,
    shieldWorn: false,
    waterUnsafe: false,
    poisonedUntil: null,
    sick: false,
    needsFood: true,
    needsWater: true,
    rationsLb: 5,
    waterPints: 4,
    waterCapacityPints: 4,
    ateLbToday: 0,
    drankPintsToday: 0,
    daysWithoutFood: 0,
    malnourished: false,
    dehydrated: false,
    heatHours: 0,
    chef: false,
    cooksUtensils: false,
    treats: 0,
    spells: [],
    preparedOverride: null,
    prepOpen: true, // open for initial setup; afterwards it follows the class rules
    swapsLeft: 0,
    tasks: defaultTasks(isCaster(className)),
    notes: '',
    ...partial,
  };
}

export function createDefaultState(rng: Rng): State {
  const calendar = structuredClone(CALENDARS.harptos);
  const startYear = 1492;
  const dayIndex = indexFromDate(calendar, startYear, 1492, 4, 1); // 1 Tarsakh
  const place = {
    name: 'Trade road outside town',
    climate: 'temperate' as const,
    terrain: 'Forest road',
    altitudeFt: 500,
    shelter: 'none' as const,
    forage: 'abundant' as const,
    waterSource: true,
    waterQuality: 'questionable' as const,
  };
  const weather = rollWeather({ dayIndex, season: 'spring', climate: place.climate, altitudeFt: place.altitudeFt, climateAdjustedPrecip: false }, rng);
  return {
    version: SAVE_VERSION,
    calendar,
    startYear,
    dayIndex,
    minutes: 7 * 60,
    place,
    weather,
    weatherHistory: [weather],
    fire: { lit: false, fuelHours: 4, sheltered: false },
    stores: { foodLb: 4, waterGal: 2, foodRawLb: 0, waterUnsafeGal: 0 },
    characters: [
      newCharacter({ name: 'Brother Aldous', className: 'Cleric', level: 3, conSave: 2, wisMod: 3, survival: 3, armorKind: 'heavy', armorName: 'Chain Mail', armorWorn: true, hasShield: true, shieldWorn: true, cooksUtensils: true, tasks: defaultTasks(true) }),
      newCharacter({ name: 'Pip Tallowmere', className: 'Wizard', level: 3, size: 'Small', conSave: 1, wisMod: 1, survival: 1, bedroll: false, blanket: true, tasks: defaultTasks(true) }),
      newCharacter({ name: 'Rook', className: 'Ranger', level: 3, conSave: 2, wisMod: 2, survival: 4, armorKind: 'light', armorName: 'Studded Leather', armorWorn: true, tasks: defaultTasks(true) }),
    ],
    pending: [],
    projects: [],
    log: [],
    travel: { pace: 'normal', hoursToday: 0, milesToday: 0 },
    lastLongRestEnd: null,
    settings: { autoRollSaves: true, climateAdjustedPrecip: false, fireWarmsCamp: true, doubleWaterInHeat: false, wildNeedsPurifying: true, sleepInArmorPenalty: false, rawFoodRisk: true, rawFoodDC: 10, coldNights: true, coldNightF: 32 },
    spellLibrary: [],
    bastions: [],
  };
}

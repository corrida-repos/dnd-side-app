import type { Character, State, Task } from './types';
import { CALENDARS, indexFromDate } from '../rules/calendar';
import { rollWeather } from '../rules/weather';
import { isCaster } from '../rules/spells';
import { HIT_DIE } from '../rules/upkeep';
import { autoAssign, watchCapacity } from '../rules/watch';
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
  const level = partial.level ?? 1;
  const hitDie = HIT_DIE[className];
  const maxHp = partial.maxHp ?? hitDie + 2 + (level - 1) * (hitDie / 2 + 2);
  return {
    id: uid(),
    kind: 'pc',
    name: 'New adventurer',
    gp: 25,
    lifestyle: 'modest',
    speed: 30,
    className,
    level: 1,
    size: 'Medium',
    conSave: 0,
    conScore: 14,
    hp: maxHp,
    maxHp,
    tempHp: 0,
    hitDie,
    hitDiceSpent: 0,
    passivePerception: 10,
    darkvision: 0,
    trance: false,
    items: [],
    resources: [],
    restFocus: null,
    renown: 0,
    fear: 0,
    stress: 0,
    dying: false,
    stable: false,
    deathSuccesses: 0,
    deathFailures: 0,
    wakesAt: null,
    diedAt: null,
    reposeMinutes: 0,
    divinationCasts: {},
    wisMod: 0,
    survival: 0,
    exhaustion: 0,
    exhaustionCauses: [],
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
  const calendar = structuredClone(CALENDARS.galifar);
  const startYear = 998;
  const dayIndex = indexFromDate(calendar, startYear, 998, 2, 1); // 1 Therendor, early spring
  const place = {
    name: 'Trade road outside town',
    climate: 'temperate' as const,
    terrain: 'Forest road',
    altitudeFt: 500,
    shelter: 'none' as const,
    forage: 'abundant' as const,
    waterSource: true,
    waterQuality: 'questionable' as const,
    settlement: false,
    navigation: 'road' as const,
  };
  const weather = rollWeather({ dayIndex, season: 'spring', climate: place.climate, altitudeFt: place.altitudeFt, climateAdjustedPrecip: false }, rng);
  const state: State = {
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
      newCharacter({ name: 'Rook', className: 'Ranger', level: 3, conSave: 2, wisMod: 2, survival: 4, passivePerception: 14, darkvision: 60, armorKind: 'light', armorName: 'Studded Leather', armorWorn: true, tasks: defaultTasks(true) }),
    ],
    pending: [],
    projects: [],
    log: [],
    travel: { pace: 'normal', hoursToday: 0, milesToday: 0, lost: false, lostRecheckIn: 0, milesOffCourse: 0, navigatorId: null },
    lastLongRestEnd: null,
    trackingStart: dayIndex * 1440 + 7 * 60,
    settings: { autoRollSaves: true, climateAdjustedPrecip: false, fireWarmsCamp: true, doubleWaterInHeat: false, wildNeedsPurifying: true, sleepInArmorPenalty: false, rawFoodRisk: true, rawFoodDC: 10, coldNights: true, coldNightF: 32, sleepDeprivation: true, encounterOn: 0, exploreEncounterOn: 0, chargeCosts: true, moonOffset: 0, stressPerLongRest: 1, fearPerLongRest: 1, weatherDamage: true, noTimepiece: false, poorVisibilityNav: true },
    spellLibrary: [],
    bastions: [],
    watchOrder: [],
    watchPlan: { count: 4, slots: [[], [], [], []] },
    effects: [],
    hirelings: [],
    rituals: [],
    factions: [],
    holidays: [],
    materials: [],
    bestiary: [],
  };
  const ids = state.characters.map((c) => c.id);
  state.watchPlan = { count: 4, slots: autoAssign(ids, 4, 1, Object.fromEntries(state.characters.map((c) => [c.id, watchCapacity(4, c.trance)]))) };
  return state;
}

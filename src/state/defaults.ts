import { BRELAND, SHARN_START, type BrelishLocality } from '../rules/eberron';
import { newBuilding, type Town } from '../rules/settlements';
import { FACILITY_BOOKS } from '../rules/bastion';
import type { Character, State, Task } from './types';
import { CALENDARS, indexFromDate } from '../rules/calendar';
import { rollWeather } from '../rules/weather';
import { isCaster } from '../rules/spells';
import { HIT_DIE } from '../rules/upkeep';
import { autoAssign, watchCapacity } from '../rules/watch';
import { coinsFor } from '../rules/coins';
import type { Rng } from '../rules/dice';

export const SAVE_VERSION = 3;

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
    gp: partial.gp ?? 25,
    purse: partial.purse ?? coinsFor(partial.gp ?? 25),
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
    inventory: [],
    strScore: 10,
    carryCapacity: null,
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
    coldWaterAdapted: false,
    swimSpeed: false,
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
    sickFrom: '',
    contagions: [],
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
    species: '',
    subclass: '',
    feats: [],
    features: [],
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
    altitudeFt: 500,
    shelter: 'none' as const,
    terrain: 'forest' as const,
    onRoute: true,
    goodRoad: true,
    waterSource: true,
    waterQuality: 'questionable' as const,
    settlement: false,
    danger: 'low' as const,
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
    travel: { pace: 'normal', hoursToday: 0, milesToday: 0, lost: false, lostRecheckIn: 0, milesOffCourse: 0, navigatorId: null, gallopUsed: false },
    lastLongRestEnd: null,
    trackingStart: dayIndex * 1440 + 7 * 60,
    settings: { autoRollSaves: true, climateAdjustedPrecip: false, fireWarmsCamp: true, fireColdLimitF: -20, fireLightingCheck: true, doubleWaterInHeat: false, wildNeedsPurifying: true, sleepInArmorPenalty: false, rawFoodRisk: true, rawFoodDC: 10, sewerPlagueAfter: 3, sightRotOdds: 6, coldNights: true, coldNightF: 32, sleepDeprivation: true, encounterOn: 0, exploreEncounterOn: 0, chargeCosts: true, moonOffset: 0, stressPerLongRest: 1, fearPerLongRest: 1, weatherDamage: false, variantEncumbrance: true, encumbrance: true, foodAndWater: true, extremeWeather: true, forcedMarch: true, navigation: true, coldGear2014: false, heavyClothing2014: false, extraCraftHelpers: false, lifestylePeriod: 'day', coinWeight: true, moneychangerFee: 0, noTimepiece: false, poorVisibilityNav: true, runningBusiness: true, encounters: true, roadAmbushes: true, srdEncounters: true, trackComponents: true, appraiseCrafts: true, appraiseByEye: true, appraiseOneTry: false, appraiseTime: false, appraiseMisjudge: false, improvised: true, sidekicks: true, downtimeOutcomes: true, armsTraining: true, lifestyleRisks: true, prestigeRules: true, prestigeRenownMin: false, encounterBooks: ['XMM', 'MPMM', 'FRAiF'], facilityBooks: [...FACILITY_BOOKS], regionDailyRoll: true, deathSavesResolve: true, carryDowned: true, fallbackNavigator: true, hirelingsEat: true, nightTravelSlow: true, stormsAtSea: true, debtDropsLifestyle: true, trackGearUse: true, stabling: true, townOpeningHours: true, tentSpace: true, batchCrafting: true, taming: true, unchartedLand: true, workWhileMarching: true, lingeringInjuries: false, madness: false, gearWear: false, duesAndTaxes: true, notoriety: true, contactsFade: true, newsTravels: true, circleMagic: true, piety: true, pathsToPower: true },
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
    statusLog: [],
    stashes: [],
    journey: [],
    itemLibrary: [],
    spellClasses: {},
    giftLibrary: [],
    recipeNames: [],
    dispatches: [],
    businesses: [],
    marks: [],
    rivals: [],
    debts: [],
    dues: [],
    notoriety: [],
    contacts: [],
    letters: [],
    news: [],
    encounterClock: 0,
    exploreTurns: 0,
    encounterExclude: [],
    encounterSourcesOff: [],
    restStart: null,
  };
  const ids = state.characters.map((c) => c.id);
  state.watchPlan = { count: 4, slots: autoAssign(ids, 4, 1, Object.fromEntries(state.characters.map((c) => [c.id, watchCapacity(4, c.trance)]))) };
  return state;
}

/** A new Brelish campaign starts with its wards, providers and residents already recorded. */
export function createEberronState(rng: () => number, start = { locality: SHARN_START, year: 998, month: 0, day: 1 }): State {
  const s = createDefaultState(rng);
  s.setting = 'eberron';
  s.calendar = CALENDARS.galifar;
  s.startYear = start.year;
  s.dayIndex = indexFromDate(s.calendar, s.startYear, start.year, start.month, start.day);
  s.characters = [];
  s.towns = (Object.entries(BRELAND) as [BrelishLocality, (typeof BRELAND)[BrelishLocality]][]).map(([, profile]): Town => {
    const taken = new Set<string>();
    return {
      name: profile.name,
      size: profile.size,
      water: profile.water,
      trait: profile.district,
      fame: '',
      leader: profile.authority,
      calamity: null,
      buildings: profile.providers.map(([type, name]) => ({ ...newBuilding(type, rng, taken, profile.size), name })),
    };
  });
  s.place = brelishPlace(start.locality);
  s.trackingStart = s.dayIndex * 1440 + s.minutes;
  s.weather = rollWeather({ dayIndex: s.dayIndex, season: s.calendar.months[start.month].season, climate: s.place.climate, altitudeFt: s.place.altitudeFt, climateAdjustedPrecip: false }, rng);
  s.weatherHistory = [s.weather];
  return s;
}

export function brelishPlace(locality: BrelishLocality): State['place'] {
  return {
    name: BRELAND[locality].name, climate: 'temperate', altitudeFt: 0, terrain: 'urban',
    settlement: true, shelter: 'none', onRoute: true, goodRoad: true,
    waterSource: true, waterQuality: 'clean', danger: 'low',
  };
}

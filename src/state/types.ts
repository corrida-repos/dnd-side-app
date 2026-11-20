import type { ClimateId, Weather } from '../rules/weather';
import type { Calendar } from '../rules/calendar';
import type { ProjectKind } from '../rules/crafting';
import type { FacilitySize, Order } from '../rules/bastion';

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export type Size = 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan';
export type Resist = 'none' | 'resistance' | 'immunity';
export type CasterClass = 'Bard' | 'Cleric' | 'Druid' | 'Paladin' | 'Ranger' | 'Sorcerer' | 'Warlock' | 'Wizard';
export type ClassName = CasterClass | 'Barbarian' | 'Fighter' | 'Monk' | 'Rogue' | 'Other';
export type Shelter = 'none' | 'tent' | 'building' | 'cave';
export type Abundance = 'abundant' | 'limited' | 'scarce';
export type Pace = 'fast' | 'normal' | 'slow';
export type Activity = 'camp' | 'rest' | 'travel' | 'work';
export type Tone = 'info' | 'warn' | 'bad' | 'good';
/** What caused each Exhaustion level. */
export type ExhaustionCause = 'malnutrition' | 'dehydration' | 'cold' | 'heat' | 'march' | 'coldNight' | 'sleep' | 'other';
export type ArmorKind = 'none' | 'light' | 'medium' | 'heavy';
export type WaterQuality = 'clean' | 'questionable';

export interface SpellRef {
  name: string;
  level: number;
  school?: string;
  source?: string;
  ritual?: boolean;
  concentration?: boolean;
}

export interface CharacterSpell extends SpellRef {
  prepared: boolean;
  alwaysPrepared: boolean;
}

export interface Task {
  id: string;
  label: string;
  done: boolean;
  /** Daily tasks reset after each Long Rest. */
  daily: boolean;
}

export interface Character {
  id: string;
  name: string;
  className: ClassName;
  level: number;
  size: Size;
  conSave: number;
  wisMod: number;
  survival: number;
  exhaustion: number;
  /** One cause per Exhaustion level, oldest first. Kept in step with `exhaustion`. */
  exhaustionCauses: ExhaustionCause[];
  coldResist: Resist;
  fireResist: Resist;
  coldWeatherGear: boolean;
  /** PHB: while in a Bedroll you automatically succeed on saves against extreme cold. */
  bedroll: boolean;
  /** PHB: while wrapped in a Blanket you have Advantage on saves against extreme cold. */
  blanket: boolean;
  /** Coldest temperature felt while sleeping without warm cover during the current Long Rest. */
  nightChill: number | null;
  /** Heavy clothing (armor is tracked separately): Disadvantage on extreme heat saves. */
  heavyGarb: boolean;
  armorKind: ArmorKind;
  armorName: string;
  armorWorn: boolean;
  hasShield: boolean;
  shieldWorn: boolean;
  /** Waterskin was filled from a source that hasn't been purified. */
  waterUnsafe: boolean;
  /** Absolute minute when the Poisoned condition from tainted water ends. */
  poisonedUntil: number | null;
  /** Sick from eating raw food: Poisoned until the creature finishes a Long Rest. */
  sick: boolean;
  needsFood: boolean;
  needsWater: boolean;
  rationsLb: number;
  waterPints: number;
  waterCapacityPints: number;
  ateLbToday: number;
  drankPintsToday: number;
  daysWithoutFood: number;
  /** Exhaustion from malnutrition can't be removed until the creature eats a full day's food. */
  malnourished: boolean;
  /** Exhaustion from dehydration can't be removed until the creature drinks a full day's water. */
  dehydrated: boolean;
  heatHours: number;
  chef: boolean;
  cooksUtensils: boolean;
  treats: number;
  spells: CharacterSpell[];
  preparedOverride: number | null;
  /** Free changes to prepared spells are allowed right now (after a Long Rest for Clerics, Druids and Wizards). */
  prepOpen: boolean;
  /** Single replacements left (Paladin and Ranger after a Long Rest). */
  swapsLeft: number;
  tasks: Task[];
  notes: string;
}

export interface Place {
  name: string;
  climate: ClimateId;
  terrain: string;
  altitudeFt: number;
  shelter: Shelter;
  forage: Abundance;
  waterSource: boolean;
  waterQuality: WaterQuality;
}

export interface Fire {
  lit: boolean;
  fuelHours: number;
  /** A fire pit with a windbreak and roof, so wind and heavy rain don't put it out. */
  sheltered: boolean;
}

export interface Stores {
  foodLb: number;
  waterGal: number;
  /** Raw foraged or hunted food: cook it or purify it before eating. */
  foodRawLb: number;
  waterUnsafeGal: number;
}

export type SaveKind = 'cold' | 'heat' | 'march' | 'malnutrition' | 'tainted' | 'raw' | 'chill' | 'sleep';

export interface PendingSave {
  id: string;
  charId: string;
  kind: SaveKind;
  dc: number;
  mode: 'normal' | 'advantage' | 'disadvantage';
  reason: string;
  stamp: string;
}

export interface Project {
  id: string;
  name: string;
  kind: ProjectKind;
  charIds: string[];
  daysRequired: number;
  daysDone: number;
  costGp: number;
  notes: string;
  done: boolean;
}

export interface Construction {
  what: string;
  daysLeft: number;
  totalDays: number;
  costGp: number;
  /** Size the facility becomes when the work is done. */
  toSize: FacilitySize;
}

export interface Facility {
  id: string;
  name: string;
  kind: 'basic' | 'special';
  size: FacilitySize;
  order: Order;
  /** What the current order is for, e.g. "Craft: Longsword". */
  orderNote: string;
  /** Unfinished work. A facility that's still being built can't take orders. */
  building: Construction | null;
  built: boolean;
}

export interface Bastion {
  id: string;
  name: string;
  ownerId: string;
  facilities: Facility[];
  /** Day index when the last Bastion turn was resolved (or the Bastion was founded). */
  lastTurnDay: number;
  turns: number;
  lastEvent: string;
  goldSpent: number;
  notes: string;
}

export interface LogEntry {
  id: string;
  stamp: string;
  text: string;
  tone: Tone;
}

export interface Settings {
  autoRollSaves: boolean;
  climateAdjustedPrecip: boolean;
  /** Table rule: a lit campfire keeps a camp from being exposed to extreme cold. */
  fireWarmsCamp: boolean;
  /** Optional older rule: double water on days of 100 °F or hotter. */
  doubleWaterInHeat: boolean;
  /** Table rule: foraged food and water from questionable sources must be purified, or risk being Poisoned. */
  wildNeedsPurifying: boolean;
  /** Optional rule (Xanathar's Guide): sleeping in Medium or Heavy armor spoils the Long Rest. */
  sleepInArmorPenalty: boolean;
  /** Table rule: eating raw food calls for a Con save, or the creature is Sick (Poisoned until a Long Rest). */
  rawFoodRisk: boolean;
  rawFoodDC: number;
  /** Table rule: sleeping out at or below coldNightF without warm cover risks Exhaustion. */
  coldNights: boolean;
  coldNightF: number;
  /** Optional rule (Xanathar's Guide): each 24 hours without a Long Rest, DC 10 Con save (+5 per further day) or 1 Exhaustion. */
  sleepDeprivation: boolean;
}

export interface Travel {
  pace: Pace;
  /** Hours counted toward the forced march limit since the last Long Rest. */
  hoursToday: number;
  milesToday: number;
}

export interface State {
  version: number;
  calendar: Calendar;
  startYear: number;
  dayIndex: number;
  minutes: number;
  place: Place;
  weather: Weather;
  weatherHistory: Weather[];
  fire: Fire;
  stores: Stores;
  characters: Character[];
  pending: PendingSave[];
  projects: Project[];
  log: LogEntry[];
  travel: Travel;
  lastLongRestEnd: number | null;
  /** When tracking began, used as the start of the party's waking time until the first Long Rest. */
  trackingStart: number;
  settings: Settings;
  spellLibrary: SpellRef[];
  bastions: Bastion[];
}

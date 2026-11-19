import type { ClimateId, Weather } from '../rules/weather';
import type { Calendar } from '../rules/calendar';
import type { ProjectKind } from '../rules/crafting';

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
  coldResist: Resist;
  fireResist: Resist;
  coldWeatherGear: boolean;
  /** Medium or Heavy armor, or heavy clothing: Disadvantage on extreme heat saves. */
  heavyGarb: boolean;
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
}

export type SaveKind = 'cold' | 'heat' | 'march' | 'malnutrition';

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
  settings: Settings;
  spellLibrary: SpellRef[];
}

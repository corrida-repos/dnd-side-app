import type { ClimateId, Weather } from '../rules/weather';
import type { Calendar } from '../rules/calendar';
import type { ProjectKind } from '../rules/crafting';
import type { FacilitySize, Order } from '../rules/bastion';
import type { Recharge } from '../rules/upkeep';
import type { EffectKind } from '../rules/effects';
import type { Lifestyle } from '../rules/money';
import type { Rarity } from '../rules/crafting';
import type { Creature } from '../rules/hunting';
import type { NavTerrain } from '../rules/navigation';

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
export type ExhaustionCause = 'malnutrition' | 'dehydration' | 'cold' | 'heat' | 'march' | 'coldNight' | 'sleep' | 'frigid' | 'other';
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

export interface MagicItem {
  id: string;
  name: string;
  requiresAttunement: boolean;
  attuned: boolean;
  identified: boolean;
  charges: number | null;
  maxCharges: number | null;
  /** Dice expression for charges regained, e.g. "1d6+1", or "all". */
  regain: string;
  regainAt: 'dawn' | 'longRest' | 'shortRest' | 'never';
  /** Absolute minute the item was left more than 100 ft away, or null while it's with its owner. */
  awaySince: number | null;
  notes: string;
}

export interface Resource {
  id: string;
  name: string;
  max: number;
  current: number;
  recharge: Recharge;
}

export interface RestFocus {
  itemId: string;
  action: 'attune' | 'identify' | 'unattune';
}

export interface ActiveEffect {
  id: string;
  name: string;
  kind: EffectKind;
  /** Who it's on, or carried by. Empty means the whole party or the area. */
  targetIds: string[];
  casterId: string | null;
  concentration: boolean;
  shelter: boolean;
  startedAt: number;
  /** Absolute minute it ends, or null if it lasts until ended. */
  endsAt: number | null;
  notes: string;
}

export interface Material {
  id: string;
  name: string;
  qty: number;
  unit: string;
  /** Value of one unit in GP, counted toward a project's cost when used. */
  valueGp: number;
}

export interface MaterialUse {
  materialId: string;
  name: string;
  qty: number;
  valueGp: number;
}

export interface Ritual {
  id: string;
  spell: string;
  place: string;
  casterId: string | null;
  requiredDays: number;
  streak: number;
  lastCastDay: number | null;
  permanent: boolean;
}

export interface Faction {
  id: string;
  name: string;
  renown: number;
  notes: string;
}

export interface Holiday {
  id: string;
  name: string;
  monthIndex: number;
  day: number;
}

export interface Character {
  id: string;
  /** Mounts and animals use the same survival rules but skip spells, tasks and watches. */
  kind: 'pc' | 'mount';
  name: string;
  gp: number;
  lifestyle: Lifestyle;
  /** Mount speed in feet (mounts only). */
  speed: number;
  className: ClassName;
  level: number;
  size: Size;
  conSave: number;
  conScore: number;
  hp: number;
  maxHp: number;
  tempHp: number;
  hitDie: number;
  hitDiceSpent: number;
  passivePerception: number;
  items: MagicItem[];
  resources: Resource[];
  /** Personal renown, fear and stress trackers. */
  renown: number;
  fear: number;
  stress: number;
  /** Absolute minute of death, or null while alive. */
  diedAt: number | null;
  /** Minutes spent dead under Gentle Repose, which don't count toward resurrection limits. */
  reposeMinutes: number;
  /** Divination castings since the last Long Rest, by spell name. */
  divinationCasts: Record<string, number>;
  /** What the character focuses on during the next rest: attuning, identifying or ending attunement. */
  restFocus: RestFocus | null;
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
  /** In a town or city: lifestyle expenses are charged and cover meals. */
  settlement: boolean;
  /** How hard it is to find the way here. */
  navigation: NavTerrain;
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

export type SaveKind = 'cold' | 'heat' | 'march' | 'malnutrition' | 'tainted' | 'raw' | 'chill' | 'sleep' | 'frigid';

export interface PendingSave {
  id: string;
  charId: string;
  kind: SaveKind;
  dc: number;
  mode: 'normal' | 'advantage' | 'disadvantage';
  reason: string;
  stamp: string;
}

export interface Hireling {
  id: string;
  name: string;
  skilled: boolean;
  wageGp: number;
  /** Who pays: a character's id, or "party" to split between the adventurers. */
  payer: string;
  active: boolean;
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
  /** For buying or selling magic items: the rarity and the price the deal is struck at. */
  rarity?: Rarity;
  dealGp?: number;
  /** Materials taken from the stash when the project started. */
  materialsUsed?: MaterialUse[];
  /** For copying a spell: its name and level, and whose spellbook gets it. */
  spell?: { name: string; level: number };
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
  /** Random encounter check per watch: an encounter on a d20 roll of this or higher. 0 turns it off. */
  encounterOn: number;
  /** Random encounter check per 10-minute exploration turn (d20 at or above). 0 turns it off. */
  exploreEncounterOn: number;
  /** Charge crafting, construction, lifestyle and wages to characters' gold. */
  chargeCosts: boolean;
  /** Shifts the moon cycle so its phases match your campaign. */
  moonOffset: number;
  /** Stress points removed by each Long Rest (0 turns it off). */
  stressPerLongRest: number;
  /** Fear points removed by each Long Rest (0 turns it off). */
  fearPerLongRest: number;
  /** Table rule: weather favors or hinders certain damage types (+1 or -1 per damage die). */
  weatherDamage: boolean;
  /** Nobody has a timepiece: show the time as nature's cues instead of a clock. */
  noTimepiece: boolean;
  /** Table rule: heavy precipitation and darkness each add +5 to the navigation DC. */
  poorVisibilityNav: boolean;
}

export interface Travel {
  pace: Pace;
  /** Hours counted toward the forced march limit since the last Long Rest. */
  hoursToday: number;
  milesToday: number;
  /** The party has strayed off course without realising it. */
  lost: boolean;
  /** Travel hours left before the navigator can try to get their bearings again. */
  lostRecheckIn: number;
  milesOffCourse: number;
  navigatorId: string | null;
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
  /** Order of characters taking 2-hour watches during a Long Rest. */
  watchOrder: string[];
  effects: ActiveEffect[];
  hirelings: Hireling[];
  rituals: Ritual[];
  factions: Faction[];
  holidays: Holiday[];
  materials: Material[];
  /** Creatures imported from a bestiary file, for hunting. */
  bestiary: Creature[];
}

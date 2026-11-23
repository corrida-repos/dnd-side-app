import type { Danger } from '../rules/encounters';
import type { ClimateId, Weather } from '../rules/weather';
import type { Calendar } from '../rules/calendar';
import type { ProjectKind } from '../rules/crafting';
import type { FacilitySize, Order } from '../rules/bastion';
import type { Recharge } from '../rules/upkeep';
import type { EffectKind } from '../rules/effects';
import type { Lifestyle } from '../rules/money';
import type { Rarity } from '../rules/crafting';
import type { Creature } from '../rules/hunting';
import type { TerrainType } from '../rules/terrain';
import type { ItemRef } from '../rules/hazards';
import type { CommMethod } from '../rules/comms';
import type { ContagionKind } from '../rules/contagion';
import type { CreditorKind } from '../rules/debts';
import type { PatronKind } from '../rules/patrons';
import type { RegionKind } from '../rules/regions';
import type { HirelingRole } from '../rules/hirelings';
import type { ClueKind, StudyMethod } from '../rules/identify';
import type { WeightSource } from '../rules/encumbrance';
import type { FortType, LandKind, MarkKind, RightKind, TitleRank, TrainingKind } from '../rules/prestige';
import type { Purse } from '../rules/coins';
import type { InjuryKind } from '../rules/injuries';
import type { MadnessTier } from '../rules/madness';
import type { DueKind, DuePeriod } from '../rules/dues';
import type { NewsRoute } from '../rules/letters';

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
export type ExhaustionCause = 'malnutrition' | 'dehydration' | 'cold' | 'heat' | 'march' | 'coldNight' | 'sleep' | 'frigid' | 'suffocation' | 'deepWater' | 'contagion' | 'other';
export type ArmorKind = 'none' | 'light' | 'medium' | 'heavy';
export type WaterQuality = 'clean' | 'questionable';

export interface SpellRef {
  name: string;
  level: number;
  school?: string;
  source?: string;
  ritual?: boolean;
  concentration?: boolean;
  /** Casting time as written, e.g. "1 action" or "10 minutes". */
  castTime?: string;
  /** Casting time in minutes (0 for an action, bonus action or reaction). */
  castMinutes?: number;
  /** Duration in minutes; null for instantaneous. */
  durationMinutes?: number | null;
  /** Lasts until dispelled. */
  permanent?: boolean;
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
  /** What the party calls it before they know what it is, e.g. "silver ring with a blue stone". */
  partyName?: string;
  rarity?: Rarity | '';
  /** School of magic, as Detect Magic would reveal it. */
  school?: string;
  /** Detect Magic (or similar) has shown it's magical. */
  magicKnown?: boolean;
  /** What the item does, each fact known or still hidden. */
  clues?: ItemClue[];
  /** How the party learned each thing. */
  findings?: ItemFinding[];
}

export interface ItemClue {
  id: string;
  kind: ClueKind;
  text: string;
  known: boolean;
}

export interface ItemFinding {
  id: string;
  stamp: string;
  method: StudyMethod;
  text: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  /** Weight of one, in pounds. */
  weight: number;
  source: WeightSource;
  /** Value of one in GP, if known (gems, art, trade goods, or a price in the pasted text). */
  valueGp?: number;
  /** The party doesn't know its value yet; valueGp, if set, is the DM's secret true value. Appraising reveals it. */
  valueHidden?: boolean;
  /** A misjudged appraisal: what the party wrongly believes one is worth (optional table rule). */
  valueBelieved?: number;
  /** Torn, cracked or broken: needs mending (Mending, Weaver's Tools for cloth, or improvised sewing). */
  damaged?: boolean;
  /** Who has already tried and failed to appraise it since the last rest (optional table rule). */
  appraiseTried?: string[];
  /** The inventory item this is packed inside, if any. */
  containerId?: string | null;
  /** Set when this item is itself a container. */
  container?: { capacityLb: number | null; weightless: boolean; note?: string } | null;
  /** Ammunition: tracks how many were fired since the last recovery. */
  ammo?: { spent: number } | null;
  /** Uses left in the item being used now (a Healer's Kit has ten); unopened ones in the stack are full. */
  uses?: number;
  /** Caltrops or Ball Bearings spread on the ground: 10 minutes to gather up, lost if the party moves on. */
  scattered?: boolean;
  /** DM secret: a cheap potion bought while living rough is tainted (table rule): drinking it risks Cackle Fever. */
  tainted?: boolean;
  /** Wear from hard use (table rule): at 3 the item is damaged. */
  wear?: number;
}

export interface Stash {
  id: string;
  name: string;
  kind: 'stash' | 'vehicle' | 'bank';
  /** Vessel speed in mph (ships and airships), if this vehicle sails. */
  speedMph?: number;
  /** Where it is in the world. */
  location: string;
  capacityLb: number | null;
  items: InventoryItem[];
  purse: Purse;
  notes: string;
  /** Hull wear from storms and long voyages (table rule), and whether the vessel is damaged (half speed). */
  hullWear?: number;
  hullDamaged?: boolean;
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
  /** Circle Magic's Distribute: every caster who holds this Concentration; the effect lasts while any of them does. */
  concentrationIds?: string[];
  shelter: boolean;
  startedAt: number;
  /** Absolute minute it ends, or null if it lasts until ended. */
  endsAt: number | null;
  notes: string;
  /** A Lamp or Lantern put out with Oil left: minutes of burning left when it's relit (2024 PHB Oil). */
  pausedLeft?: number;
  /** A Hooded Lantern with its hood lowered: Dim Light in a 5-foot radius. */
  dimmed?: boolean;
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
  /** Level-based renown: follows this character's level (DMG option). */
  levelOf?: string | null;
  /** Group involvement: downtime days spent on minor tasks for the group toward the next point (DMG). */
  involvementDays?: number;
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
  /** Total wealth in GP (negative when in debt). Kept in step with `purse`. */
  gp: number;
  /** Coins actually carried, by denomination. */
  purse: Purse;
  lifestyle: Lifestyle;
  /** Lifestyle run up in town but not yet paid (weekly or monthly billing). */
  lifestyleOwed?: number;
  /** Mount speed in feet (mounts only). */
  speed: number;
  className: ClassName;
  level: number;
  /** Species and lineage as written, e.g. "Wood Elf" or "Dragonborn (Silver)". */
  species: string;
  /** Subclass name, e.g. "Thief" or "Circle of the Land". */
  subclass: string;
  /** Feats by name, e.g. "Ritual Caster". */
  feats: string[];
  /** Other chosen features: Eldritch Invocations, Fighting Style, Metamagic and the like. */
  features: string[];
  size: Size;
  conSave: number;
  conScore: number;
  hp: number;
  maxHp: number;
  tempHp: number;
  hitDie: number;
  hitDiceSpent: number;
  passivePerception: number;
  /** Darkvision range in feet (0 = none). */
  darkvision: number;
  /** Trances instead of sleeping: a Long Rest needs only 4 hours of rest, so they can watch for 4. */
  trance: boolean;
  items: MagicItem[];
  /** Everyday gear, usually pasted from D&D Beyond; weights are estimated. */
  inventory: InventoryItem[];
  strScore: number;
  /** Fixed carrying capacity (mounts); null means Strength × size. */
  carryCapacity: number | null;
  resources: Resource[];
  /** D&D Beyond character id, when imported, so a later import updates this character. */
  ddbId?: number;
  /** When it was last synced from D&D Beyond. */
  ddbSyncedAt?: string;
  /** Personal renown, fear and stress trackers. */
  renown: number;
  fear: number;
  stress: number;
  /** At 0 HP and making death saves. */
  dying: boolean;
  /** At 0 HP but stable: no more death saves, and wakes with 1 HP at `wakesAt`. */
  stable: boolean;
  deathSuccesses: number;
  deathFailures: number;
  /** Absolute minute a stable character regains 1 HP (1d4 hours after stabilizing). */
  wakesAt: number | null;
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
  /** Naturally adapted to icy water: automatic success against frigid water. */
  coldWaterAdapted: boolean;
  /** Has a Swim Speed: unaffected by deep water. */
  swimSpeed: boolean;
  /** PHB: while in a Bedroll you automatically succeed on saves against extreme cold. */
  bedroll: boolean;
  /** PHB: while wrapped in a Blanket you have Advantage on saves against extreme cold. */
  blanket: boolean;
  /** A makeshift bed of boughs or leaves at this camp (table rule): counts as a Blanket until the party moves on. */
  bedding?: boolean;
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
  /** Sick from raw food or unpurified water: Poisoned until the creature finishes a Long Rest. */
  sick: boolean;
  /** What made them Sick: 'raw food', 'unpurified water' or both. */
  sickFrom?: string;
  /** Absolute minute an Antitoxin's Advantage on saves against poison runs out (PHB: 1 hour). */
  antitoxinUntil?: number | null;
  /** A room rented for day-to-day play in town: its quality, and the absolute minute it must be vacated. */
  lodging?: { tier: 'squalid' | 'poor' | 'modest' | 'comfortable' | 'wealthy' | 'aristocratic'; until: number } | null;
  /** A bad night on the street or in a flophouse (table rule): the next Long Rest removes no Exhaustion. */
  restless?: boolean;
  /** Days spent living Squalid or Wretched in a settlement in a row (table rule: after 30, respectable folk shun them). */
  lowLifeDays?: number;
  /** Bouts of illness from bad water since the last Sewer Plague check (table rule). */
  waterborneIllnesses?: number;
  /** Magical contagions (2024 DMG): Cackle Fever, Sewer Plague, Sight Rot. */
  contagions: Contagion[];
  /** Languages and tools learned through downtime training. */
  trainedProficiencies?: string[];
  /** Tool proficiencies (2024 PHB tool names); undefined until recorded or imported. */
  toolProfs?: string[];
  /** Skill proficiencies; undefined until recorded or imported. */
  skillProfs?: string[];
  /** Ability scores, when known (D&D Beyond import or typed in). */
  abilities?: Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>;
  /** Mounts: how it moves, for the saddle it needs. */
  movement?: 'land' | 'fly' | 'swim';
  /** Mounts: the saddle it wears (2024 PHB Tack). */
  saddle?: 'none' | 'riding' | 'military' | 'exotic';
  /** A creature the party tamed from the wild (table rule), and what it has been trained to do. */
  tamed?: { tamerId: string; trained: ('mount' | 'commands')[] };
  /** −4 to D20 Tests after Raise Dead or Resurrection, easing by 1 each Long Rest. */
  revivalPenalty?: number;
  /** Remove Curse was cast: attunement to cursed items can be ended. */
  curseBroken?: boolean;
  /** Poisons that act later: Midnight Tears at midnight, Pale Tincture every 24 hours. */
  poisonTimers?: { id: string; name: string; nextAt: number; successes: number }[];
  /** Advantage on saves against contagions until this minute (after recuperating). */
  recuperatedUntil?: number;
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
  /** Lingering injuries (2014 DMG optional rule, table rule here). */
  injuries?: Injury[];
  /** Madness (2014 DMG optional rule, table rule here). */
  madness?: Madness[];
  /** Year of birth on the campaign calendar, and the birthday. */
  birthYear?: number | null;
  birthday?: { monthIndex: number; day: number } | null;
  /** Years added (or removed, if negative) by magic. */
  magicYears?: number;
  /** Ages only a year per ten (Archdruid) since this calendar year. */
  slowAgingSince?: number | null;
  /** Lifespan in years, overriding the species default. */
  lifespanOverride?: number | null;
  /** Potions of Longevity drunk so far (each later one may backfire). */
  longevityPotions?: number;
  /** Gold earned since the last tithe was paid (for tithes that take a share). */
  earnedGp?: number;
}

export interface Injury {
  id: string;
  kind: InjuryKind;
  /** Absolute minute it happened, and how. */
  at: number;
  why: string;
  /** Days of rest so far (internal injury, broken ribs). */
  restDays: number;
  /** Successful Medicine checks so far, and the day of the last attempt (festering wound). */
  medicine: number;
  lastTreatedDay?: number;
  /** HP maximum lost to a festering wound, given back when it heals. */
  hpLost: number;
}

export interface Madness {
  id: string;
  tier: MadnessTier;
  effect: string;
  at: number;
  /** Absolute minute it ends, or null until cured (indefinite). */
  endsAt: number | null;
  /** Calm Emotions holds it off until this minute. */
  suppressedUntil?: number;
  why: string;
}

export interface Place {
  name: string;
  climate: ClimateId;
  altitudeFt: number;
  shelter: Shelter;
  /** DMG terrain type: sets maximum pace, foraging, navigation and search DCs. */
  terrain: TerrainType;
  /** Following a road, river, coast or landmark: no navigation check. */
  onRoute: boolean;
  /** A good road raises the maximum pace by one step. */
  goodRoad: boolean;
  /** Older free-text description of the terrain. */
  terrainNote?: string;
  waterSource: boolean;
  waterQuality: WaterQuality;
  /** In a town or city: lifestyle expenses are charged and cover meals. */
  settlement: boolean;
  /** How dangerous the area is: sets how often to check for random encounters and how tough they are. */
  danger: Danger;
  /** A supernatural region (Tasha's), if this place is one. */
  region?: RegionKind | null;
  /** Snow on the ground and days of mud (table rule). */
  ground?: { snowIn: number; mudDays: number };
  /** An alarm line around the camp (table rule): a Bell wakes everyone; pots and cans only if the intruder isn't careful. */
  alarm?: boolean | 'pots';
  /** Hunting Traps (or snares) set on game trails here, checked when the party breaks camp. */
  trapsSet?: { charId: string; qty: number; setAt: number; snare?: boolean }[];
  /** Lean-tos built here (table rule): each sleeps two, like a Tent. */
  leanTos?: number;
  /** Holes dug here with a Shovel (or by hand): fire pit, latrine, snow cave and the like. */
  dug?: string[];
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

export type SaveKind = 'cold' | 'heat' | 'march' | 'malnutrition' | 'tainted' | 'raw' | 'chill' | 'sleep' | 'frigid' | 'deepWater';

export interface PendingSave {
  id: string;
  charId: string;
  kind: SaveKind;
  dc: number;
  mode: 'normal' | 'advantage' | 'disadvantage';
  reason: string;
  stamp: string;
  /** City water (table rule): failing may also carry Sight Rot. */
  city?: boolean;
}

export interface Hireling {
  id: string;
  name: string;
  role: HirelingRole;
  /** Bonus to the skill or tool their job uses. */
  bonus: number;
  passivePerception: number;
  skilled: boolean;
  wageGp: number;
  /** Who pays: a character's id, or "party" to split between the adventurers. */
  payer: string;
  active: boolean;
  /** Absolute minute a messenger gets back from an errand. */
  busyUntil?: number;
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
  /** What the project produces, added to the first crafter's inventory when it's done. */
  product?: { name: string; qty: number; magic?: boolean; valueGp?: number };
  /** For copying a spell: its name and level, and whose spellbook gets it. */
  spell?: { name: string; level: number };
  /** Training: the language or tool learned. */
  learn?: string;
  /** Special training (2024 DMG Marks of Prestige): what `learn` is, so it lands in the right proficiency list. */
  learnKind?: TrainingKind;
  /** A finished activity waiting for its checks, and what came of it. */
  awaitingOutcome?: boolean;
  outcome?: string;
  /** Participants whose activity checks have been rolled (each rolls their own, Xanathar's). */
  resolvedFor?: string[];
  /** Buying or selling a magic item: a consumable (half price, and easier to find), and the item's name. */
  consumable?: boolean;
  itemName?: string;
  /** Offers waiting for an answer once a seller or buyer is found. */
  offers?: { label: string; gp: number; shady?: boolean }[];
  /** Skilled hirelings with the right tools assisting the work, paid 2 GP each per workday. */
  hiredArtisans?: number;
  /** Hours of work done on the march toward the next workday (8 hours make one). */
  marchWorkHours?: number;
}

export interface Construction {
  what: string;
  daysLeft: number;
  totalDays: number;
  costGp: number;
  /** Size the facility becomes when the work is done. */
  toSize: FacilitySize;
  /** Extra paid crews and party members helping (table rule). */
  extraCrews?: number;
  helpers?: { charId: string; skilled: boolean }[];
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
  /** Orders written while the owner is away, not yet sent. */
  draftOrder?: Order;
  draftNote?: string;
  /** The chosen order option and its details (2024 DMG facility options). */
  plan?: OrderPlan;
  draftPlan?: OrderPlan;
  /** Work in progress from an earlier order; results arrive when it finishes. */
  work?: FacilityWork | null;
  /** Can't take orders for this many more Bastion turns (attack damage, lost hirelings). */
  shutTurns?: number;
  /** Garden: one type for a Roomy garden, two for a Vast one, each with its chosen product. */
  gardens?: { type: string; product: string }[];
  /** Museum: the owner has studied the treasure for 7 days, so the next Long Rest here grants its Charm. */
  studied?: boolean;
  /** Guildhall guild, Training Area trainer, Pub beverage, Museum treasure origin. */
  guild?: string;
  trainer?: string;
  pubSpecial?: string;
}

export interface OrderPlan {
  option: string;
  text?: string;
  gp?: number;
  choice?: string;
  rarity?: string;
  people?: { charId: string; bonus: number }[];
}

export interface FacilityWork {
  option: string;
  label: string;
  daysLeft: number;
  plan: OrderPlan;
}

export type BastionDecision =
  | { kind: 'bribe'; gp: number; facilityId: string | null }
  | { kind: 'opportunity' }
  | { kind: 'aid' };

export interface BastionGuest {
  id: string;
  kind: 'renown' | 'sanctuary' | 'mercenary' | 'monster' | 'spellcaster' | 'refugees';
  label: string;
  /** Day index when they leave (none: until sent away). */
  untilDay?: number;
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  /** Daily maintenance cost in GP. */
  gpPerDay: number;
  /** Downtime days spent running it since the last roll (only 30 count). */
  daysWorked: number;
  /** A rival sabotaged it: −10 on the next roll. */
  sabotaged?: boolean;
  /** Unpaid costs: each gives −10 to later rolls until paid. */
  debts: number;
  unpaidGp: number;
  /** Lifetime profit minus what the owner paid in. */
  netGp: number;
  lastResult: string;
  notes: string;
  /** Still being built: it can't be run until finished. */
  building?: { what: string; costGp: number; totalDays: number; daysDone: number };
  /** The owner is on site overseeing construction (otherwise it goes at a third of the speed). */
  overseeing?: boolean;
  /** Extra paid crews speeding up construction (table rule). */
  extraCrews?: number;
  /** Characters working on site; skilled ones have carpenter's or mason's tools. */
  helpers?: { charId: string; skilled: boolean }[];
}

export interface Contagion {
  id: string;
  kind: ContagionKind;
  infectedAt: number;
  /** When symptoms start. */
  onsetAt: number;
  onset: boolean;
  /** Cackle Fever: successful Long Rest saves so far (three end it). */
  successes: number;
  /** Sight Rot: ointment keeps it suppressed until this minute, and the total hours suppressed so far. */
  suppressedUntil?: number;
  suppressedHours?: number;
}

export interface Debt {
  id: string;
  debtorId: string;
  creditor: string;
  kind: CreditorKind;
  principal: number;
  owed: number;
  /** Weekly interest as a fraction (0.1 = 10%). */
  rate: number;
  startedDay: number;
  dueDay: number;
  /** Escalation steps already taken. */
  steps: string[];
  /** In debtors' prison, working it off. */
  imprisoned?: boolean;
}

/** A Mark of Prestige (2024 DMG): a fortification, parcel of land, special rights or a title. */
export interface Mark {
  id: string;
  kind: MarkKind;
  name: string;
  holderIds: string[];
  /** Who granted it: a monarch, a council, an archfey. */
  grantor: string;
  grantedDay: number;
  /** The grantor's trust (table rule): 3 down to 0, when the mark is taken back. */
  trust: number;
  notes: string;
  /** Taken back, stripped or expired. */
  revoked?: { day: number; why: string };
  /** Fortification: its type, the day the grantor stops paying upkeep, and days in a row it went unpaid. */
  fort?: FortType;
  sponsoredUntilDay?: number;
  neglectDays?: number;
  /** Became the holder's Bastion. */
  bastionId?: string;
  /** Land: what it is, and trouble waiting to be dealt with. */
  land?: LandKind;
  trouble?: { text: string; sinceDay: number } | null;
  /** Land granted with a title: the title's id. */
  titleId?: string;
  /** A faction in the tracker that granted it: loyal service raises renown, disloyalty costs it, and offenses against the faction cost trust. */
  factionId?: string;
  /** Special rights: which, where, until when (none: for life), and the sworn soldiers. */
  right?: RightKind;
  community?: string;
  untilDay?: number | null;
  soldiers?: number;
  hirelingIds?: string[];
  /** Title: its rank, who inherits it, and the land that came with it. */
  rank?: TitleRank;
  heir?: string;
  landId?: string;
}

export interface Rival {
  id: string;
  name: string;
  /** Who they are (idea), what they want, and what they can bring to bear. */
  idea: string;
  goal: string;
  assets: string;
  /** Plans the DM has written; each downtime advances one (otherwise a generic move). */
  plans: string[];
  /** Grows each time the rival acts; thresholds call for direct action. */
  pressure: number;
  active: boolean;
}

export interface Dispatch {
  id: string;
  bastionId: string;
  /** Orders travelling to the Bastion, or a report travelling back to the owner. */
  direction: 'orders' | 'report';
  method: CommMethod;
  sentAt: number;
  arrivesAt: number;
  costGp: number;
  delivered: boolean;
  /** Orders being carried: Bastion-wide Maintain, or each facility's order. */
  maintain?: boolean;
  orders?: { facilityId: string; order: Order; note: string; plan?: OrderPlan }[];
  report?: string;
  hirelingId?: string;
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
  /** The Maintain order covers the whole Bastion and blocks other orders. */
  maintain: boolean;
  /** How far the owner is from the Bastion, in miles. 0 means they're there and can give orders in person. */
  distanceMiles: number;
  /** Maintain order being drafted while away. */
  draftMaintain?: boolean;
  /** New orders reached the Bastion since its last turn. */
  ordersArrived: boolean;
  /** How the Bastion sends its turn reports to an absent owner. */
  reportMethod: CommMethod;
  /** Consecutive turns with no orders from the owner (2024 DMG: as many as the owner's level and the hirelings leave). */
  neglectedTurns?: number;
  /** The hirelings have abandoned it (neglect or divestiture). */
  abandoned?: boolean;
  /** Bastion Defenders housed in Barracks (Menagerie creatures are listed separately). */
  defenders?: number;
  menagerie?: { name: string; size: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge'; defends: boolean; origin?: 'menagerie' | 'construct' | 'grove' }[];
  /** Red Wizard Necropolis: Undead Bastion Defenders, and the days destroyed ones come back. */
  undead?: number;
  undeadReturning?: number[];
  armoryStocked?: boolean;
  lieutenants?: number;
  army?: { guards: number; horses: number } | null;
  guests?: BastionGuest[];
  /** Meditation Chamber: roll the next event twice. */
  innerPeace?: boolean;
  /** Demiplane runes and Sanctum rites last until these day indexes. */
  demiplaneUntilDay?: number;
  rites?: { charId: string; untilDay: number } | null;
  /** A choice the owner must make for the last event. */
  decision?: BastionDecision | null;
  /** Research findings and other reports, newest first. */
  reports?: string[];
  notes: string;
}

export interface LogEntry {
  id: string;
  stamp: string;
  text: string;
  tone: Tone;
  /** Characters this entry is about. */
  charIds?: string[];
  /** A change to someone's condition: kept in the status log too. */
  status?: boolean;
  /** What the character notices, for the players. */
  sense?: string;
}

export interface StatusEntry {
  id: string;
  stamp: string;
  /** Absolute minute it happened. */
  at: number;
  charId: string;
  kind: string;
  text: string;
  sense: string;
  tone: Tone;
}

export interface Settings {
  /** Optional rule (Forgotten Realms: Heroes of Faerûn): Circle Magic for spells with a casting time of 1 minute or longer. */
  circleMagic: boolean;
  autoRollSaves: boolean;
  climateAdjustedPrecip: boolean;
  /** Table rule: a lit campfire keeps a camp from being exposed to extreme cold. */
  fireWarmsCamp: boolean;
  /** Table rule: the campfire protects from the cold only down to this temperature (°F); a sheltered pit 10 °F lower. */
  fireColdLimitF: number;
  /** Table rule: lighting a campfire takes a Wisdom (Survival) check instead of always working. */
  fireLightingCheck: boolean;
  /** Optional older rule: double water on days of 100 °F or hotter. */
  doubleWaterInHeat: boolean;
  /** Table rule: foraged food and water from questionable sources must be purified, or risk being Poisoned. */
  wildNeedsPurifying: boolean;
  /** Optional rule (Xanathar's Guide): sleeping in Medium or Heavy armor spoils the Long Rest. */
  sleepInArmorPenalty: boolean;
  /** Table rule: eating raw food calls for a Con save, or the creature is Sick (Poisoned until a Long Rest). */
  rawFoodRisk: boolean;
  rawFoodDC: number;
  /** Table rule: water-borne illnesses before the next one brings a save against Sewer Plague (0 = never from water). */
  sewerPlagueAfter: number;
  /** Table rule: each new bout of sickness from city water carries Sight Rot on a 1 in this many (0 = never). */
  sightRotOdds: number;
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
  /** Table rule: Encumbered over 5 × Strength and Heavily Encumbered over 10 × Strength. */
  variantEncumbrance: boolean;
  /** 2024 PHB carrying capacity: going over it slows the party. Off, weight is shown but has no effect. */
  encumbrance: boolean;
  /** 2024 DMG: dehydration and malnutrition are checked at midnight. */
  foodAndWater: boolean;
  /** 2024 DMG: hourly Constitution saves in extreme cold and extreme heat. */
  extremeWeather: boolean;
  /** 2024 PHB: a Con save each hour of travel past 8 hours. */
  forcedMarch: boolean;
  /** 2024 DMG: the navigator's Wisdom (Survival) check to avoid getting lost off the road. */
  navigation: boolean;
  /** 2014 rule: cold weather gear means an automatic success against extreme cold. */
  coldGear2014: boolean;
  /** 2014 rule: heavy clothing gives Disadvantage on extreme heat saves. */
  heavyClothing2014: boolean;
  /** Allow more than one helper on a crafting project (the DM can). */
  extraCraftHelpers: boolean;
  /** How often lifestyle is paid: every day, or at the end of each week or month for the days spent in town. */
  lifestylePeriod: 'day' | 'week' | 'month';
  /** Count coins toward carried weight (50 coins per pound, treating gold as coins). */
  coinWeight: boolean;
  /** Table rule: a moneychanger's fee, in percent, for swapping coins. */
  moneychangerFee: number;
  /** Nobody has a timepiece: show the time as nature's cues instead of a clock. */
  noTimepiece: boolean;
  /** Table rule: heavy precipitation and darkness each add +5 to the navigation DC. */
  poorVisibilityNav: boolean;
  /** Roll the supernatural region's table once each dawn while there (table rule). */
  regionDailyRoll: boolean;
  /** Which 2025 setting books' Bastion facilities to offer. */
  facilityBooks: ('FRHoF' | 'EFA')[];
  /** Table rule: weekly risks and attention from lifestyle in town. */
  lifestyleRisks: boolean;
  /** Table rule: Marks of Prestige carry obligations (land income and trouble, title upkeep, unpaid fortifications) and can be revoked. */
  prestigeRules: boolean;
  /** Optional table rule: a faction (or ruler tracked as one) refuses to grant a title or fortification below a minimum renown. */
  prestigeRenownMin: boolean;
  /** Optional Xanathar's rules resolve downtime activities with checks and tables. */
  downtimeOutcomes: boolean;
  /** Costly Material components must be in the caster's inventory and are used up (2024 PHB). */
  trackComponents: boolean;
  /** Table rule: Jeweler's Tools also cover jewelry and precious metals; Intelligence (History) values art objects at DC 15. */
  appraiseCrafts: boolean;
  /** Table rule: anyone can try to judge a valuable's worth by eye, Intelligence (Investigation or History) at DC 20. */
  appraiseByEye: boolean;
  /** Table rule: someone who fails to appraise an item can't try it again until after a rest. */
  appraiseOneTry: boolean;
  /** Table rule: a careful appraisal takes 10 minutes. */
  appraiseTime: boolean;
  /** Optional table rule: failing an appraisal by 5 or more gives a confident wrong value, and appraisal rolls are secret. */
  appraiseMisjudge: boolean;
  /** Table rule: without the right tool, try anyway at DC +5, taking twice as long where time matters. */
  improvised: boolean;
  /** Optional 2014 DMG rule: running a business as a downtime activity. */
  runningBusiness: boolean;
  /** Roll random encounter checks automatically by the location's danger while travelling, camping, resting and exploring. */
  encounters: boolean;
  /** Use the built-in SRD 5.2 creatures for random encounter tables (imported bestiaries are always used). */
  srdEncounters: boolean;
  /** Built-in creatures from other books (5etools source codes) used in the random encounter tables. */
  encounterBooks: string[];
  /** Table rule: when time moves on, anyone still dying rolls their remaining death saves at once. */
  deathSavesResolve: boolean;
  /** Table rule: carrying an Unconscious companion without a spare mount forces a Slow pace. */
  carryDowned: boolean;
  /** Table rule: with no navigator able to act, the conscious character with the best Survival finds the way. */
  fallbackNavigator: boolean;
  /** Table rule: hirelings eat and drink from the camp stores outside settlements (1 lb food, 1 gal water a day each). */
  hirelingsEat: boolean;
  /** Table rule: travelling at night without light, when someone lacks Darkvision, goes at a Slow pace. */
  nightTravelSlow: boolean;
  /** Table rule: sailing through a storm calls for a DC 15 Wisdom (Survival) check, or half the distance is lost off course. */
  stormsAtSea: boolean;
  /** Table rule: a character in debt who can't pay drops to a cheaper lifestyle. */
  debtDropsLifestyle: boolean;
  /** 2024 PHB: lighting a Torch, Candle, Lamp or Lantern uses up a Torch, Candle or flask of Oil, and Healer's Kits run out of uses. */
  trackGearUse: boolean;
  /** 2024 PHB: mounts in a settlement are stabled and fed for 5 SP and 5 CP a day. */
  stabling: boolean;
  /** 2024 PHB: a Tent sleeps two; anyone without a place in one sleeps in the open. */
  tentSpace: boolean;
  /** Table rule: a batch of cheap crafted items counts as one item worth their total price. */
  batchCrafting: boolean;
  /** Table rule: taming a wild Beast or Monstrosity of low Intelligence with daily Animal Handling sessions. */
  taming: boolean;
  /** Table rule: crafters who are only marching keep working on hand-held projects, at half rate. */
  workWhileMarching: boolean;
  /** Table rule: uncharted journey stages have a guessed distance, and a mapper can chart them on the way. */
  unchartedLand: boolean;
  /** Optional 2014 DMG rule: lingering injuries from dropping to 0 HP, failing a death save by 5 or more, or a critical hit. */
  lingeringInjuries: boolean;
  /** Optional 2014 DMG rule: madness (short-term, long-term, indefinite), applied when the DM calls for it. */
  madness: boolean;
  /** Table rule: hard travel, rain and salt water wear gear down until it is damaged; storms wear ships. */
  gearWear: boolean;
  /** Table rule: taxes, tithes, rent and dues are charged when they fall due, and unpaid ones become debts. */
  duesAndTaxes: boolean;
  /** Table rule: crimes raise heat in a place, the watch may recognise the party there, and heat cools with time. */
  notoriety: boolean;
  /** Table rule: Friendly contacts cool when neglected, and favors need a wait between them. */
  contactsFade: boolean;
  /** Table rule: news of distant events reaches the party only as fast as word travels. */
  newsTravels: boolean;
}

/** A wild creature someone is trying to tame or train (table rule). */
export interface TameTarget {
  id: string;
  /** What the party calls it. */
  name: string;
  /** The kind of creature, e.g. "Wolf" or "Griffon". */
  creature: string;
  type: string;
  size: Size;
  int: number;
  cr: string;
  speed: number;
  movement: 'land' | 'fly' | 'swim';
  tamerId: string;
  /** wary: the approach failed and it is waiting; bonding: daily sessions; tamed: it has joined the party. */
  stage: 'wary' | 'bonding' | 'tamed';
  trust: number;
  needed: number;
  /** Failed sessions in a row. */
  fails: number;
  lastSessionDay: number | null;
  /** The day the approach succeeded. */
  startedDay: number;
  /** Absolute minute after which a failed approach can be tried again. */
  retryAt: number | null;
  /** The party member it became once tamed. */
  mountId?: string;
  training?: { kind: 'mount' | 'commands'; progress: number; needed: number };
  trained: ('mount' | 'commands')[];
  /** Raised from an egg or newborn rather than tamed from the wild. */
  raised?: boolean;
}

export interface Travel {
  pace: Pace;
  /** The navigator uses Navigator's Tools with Survival: Advantage (2024 PHB skill-and-tool rule). */
  navTools?: boolean;
  /** Zhentarim reconnaissance: Advantage on Survival to forage and navigate until the journey ends. */
  reconAdvantage?: boolean;
  /** A Long Rest at a Zhentarim Travel Station raises the maximum pace one step until the next Long Rest elsewhere. */
  paceBoost?: boolean;
  /** Hours counted toward the forced march limit since the last Long Rest. */
  hoursToday: number;
  milesToday: number;
  /** The party has strayed off course without realising it. */
  lost: boolean;
  /** Travel hours left before the navigator can try to get their bearings again. */
  lostRecheckIn: number;
  milesOffCourse: number;
  navigatorId: string | null;
  /** Who forages as the party travels, kept from one leg to the next. */
  foragerIds?: string[];
  /** Mounts can gallop (double distance for 1 hour) until they get a Short or Long Rest. */
  gallopUsed: boolean;
  /** The journey stage being run, so a map of it counts while travelling it. */
  stageName?: string;
  /** Hours of hard travel toward the next point of gear wear (table rule). */
  wearHours?: number;
}

export interface JourneyStage {
  id: string;
  name: string;
  miles: number;
  terrain: TerrainType;
  onRoute: boolean;
  goodRoad: boolean;
  difficult: boolean;
  milesDone: number;
  done: boolean;
  notes: string;
  /** Obstacles on this stage (2024 DMG journey stage challenges). */
  obstacles?: Obstacle[];
  /** Table rule: land nobody in the party knows. `miles` is then only the party's guess. */
  uncharted?: boolean;
  /** The real distance of an uncharted stage, rolled when the party sets out and learned on arrival. */
  trueMiles?: number;
  /** The party has already gone the guessed distance without arriving (noted once). */
  overdueNoted?: boolean;
}

export interface Obstacle {
  id: string;
  name: string;
  check: string;
  dc: number;
  group: boolean;
  consequence: 'delay' | 'exhaustion' | 'damage' | 'condition';
  amount: string;
  condition?: string;
  minutes?: number;
  resolved?: 'passed' | 'failed';
}

/** A tax, tithe, rent or dues that falls due regularly (table rule). */
export interface Due {
  id: string;
  kind: DueKind;
  label: string;
  /** Who pays: a character's id, or "party" to split it. */
  payerId: string;
  /** Fixed amount per period, or a share of gold earned (tithes). */
  gp: number;
  share?: number;
  period: DuePeriod;
  /** Day index it next falls due. */
  nextDay: number;
  collector: string;
  /** Payments missed in a row. */
  missed: number;
  active: boolean;
  notes: string;
}

/** The party's standing with the law in one place (table rule). */
export interface Notoriety {
  id: string;
  place: string;
  heat: number;
  bountyGp: number;
  /** Characters the law is after (empty: the whole party). */
  charIds: string[];
  lastCrimeDay: number;
  /** Day heat last cooled. */
  lastDecayDay: number;
  crimes: string[];
  /** The party goes about in disguise here. */
  disguised?: boolean;
}

/** Someone the party knows. */
export interface Contact {
  id: string;
  name: string;
  role: string;
  place: string;
  /** Miles from where the party usually is, for letters. */
  distanceMiles: number;
  /** −3 to +3; the attitude follows from it. */
  bond: number;
  /** Party members who know them (empty: everyone). */
  knownBy: string[];
  /** Day the party last saw or heard from them. */
  lastHeardDay: number;
  /** Favors they owe the party, and the party owes them. */
  owesParty: number;
  partyOwes: number;
  /** No more favors until this day (table rule). */
  cooldownUntilDay?: number;
  notes: string;
}

/** A letter on its way to or from someone. */
export interface Letter {
  id: string;
  direction: 'out' | 'in';
  contactId: string | null;
  correspondent: string;
  /** The party member writing or receiving. */
  charId: string;
  method: CommMethod;
  miles: number;
  sentAt: number;
  arrivesAt: number;
  costGp: number;
  text: string;
  delivered: boolean;
  /** Outgoing: the recipient will write back. */
  expectsReply?: boolean;
}

/** News of something that happened far away, travelling toward the party. */
export interface NewsItem {
  id: string;
  text: string;
  place: string;
  miles: number;
  route: NewsRoute;
  happenedAt: number;
  arrivesAt: number;
  delivered: boolean;
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
  /** Older rotation list, kept so earlier saves still load. */
  watchOrder: string[];
  /** Night watch plan: how many watches the Long Rest is split into, and who stands each one. */
  watchPlan: { count: number; slots: string[][] };
  effects: ActiveEffect[];
  /**
   * How the party lives in a settlement. Downtime: lifestyle expenses cover lodging and meals (2024 PHB). Day to day:
   * no lifestyle charge; they buy meals and rent rooms as they go. Undefined means day to day.
   */
  townMode?: 'downtime' | 'active';
  hirelings: Hireling[];
  rituals: Ritual[];
  factions: Faction[];
  holidays: Holiday[];
  materials: Material[];
  /** Creatures imported from a bestiary file, for hunting. */
  bestiary: Creature[];
  /** Wild creatures being tamed or trained (table rule). */
  taming?: TameTarget[];
  /** Every status change in the game, per character (kept much longer than the Chronicle). */
  statusLog: StatusEntry[];
  /** Stashes, bank vaults and vehicles holding the party's things. */
  stashes: Stash[];
  journey: JourneyStage[];
  /** Optional 5etools libraries the user loaded: magic items, spell class lists, supernatural gifts and recipe names. */
  itemLibrary: ItemRef[];
  spellClasses: Record<string, string[]>;
  giftLibrary: { name: string; type: string }[];
  recipeNames: string[];
  /** Messages travelling to and from distant Bastions. */
  dispatches: Dispatch[];
  /** The party's group patron (Tasha's). */
  patron?: { kind: PatronKind; name: string; joinedDay: number; luxuryYear: number | null; luxuryUntilDay?: number } | null;
  /** Money owed to creditors (table rule). */
  debts: Debt[];
  /** Rivals working against the party during downtime (Xanathar's). */
  rivals: Rival[];
  /** A rival's bribed officials make the next crime harder (+5 DC). */
  rivalHeat?: boolean;
  /** Businesses the characters own (optional Running a Business rule). */
  businesses: Business[];
  /** Marks of Prestige: fortifications, land, special rights and titles (2024 DMG). */
  marks: Mark[];
  /** Minutes of overland time since the last automatic random encounter check. */
  encounterClock: number;
  /** Exploration turns since the last automatic wandering monster check. */
  exploreTurns: number;
  /** Creatures left out of the random encounter tables. */
  encounterExclude: string[];
  /** Imported books (5etools source codes) left out of the random encounter tables. */
  encounterSourcesOff: string[];
  /** When the current Long Rest began (absolute minute), so encounters know who is on watch. */
  restStart: number | null;
  /** Taxes, tithes, rent and dues (table rule). */
  dues?: Due[];
  /** Heat with the law, by place (table rule). */
  notoriety?: Notoriety[];
  /** People the party knows. */
  contacts?: Contact[];
  /** Letters on their way, and recent ones. */
  letters?: Letter[];
  /** News travelling toward the party, and recent news. */
  news?: NewsItem[];
}

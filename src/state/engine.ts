import type { LadderPos, TameTarget, ActiveEffect, Activity, CharacterSpell, InventoryItem, LogEntry, Ritual, Stash, Bastion, Business, Character, FacilityWork, Obstacle, Rival, Debt, Mark, Faction, ExhaustionCause, Facility, JourneyStage, MagicItem, Pace, PendingSave, Project, SaveKind, Size, State, Tone } from './types';
import { BASIC_BUILD, BASTION_TURN_DAYS, defaultSize, ENLARGE, rollBastionEvent, SIZE_LABEL, SPECIAL_FACILITIES, type FacilitySize } from '../rules/bastion';
import { d20, die, combineModes, rollDice, rollExpr, signed, type Rng, type RollMode } from '../rules/dice';
import { dateFromIndex, formatClock, formatDate, formatDuration, lightAt, sunriseMinutes } from '../rules/calendar';
import { EFFECT_PRESETS, EXPLORATION_TURN_MINUTES, LIGHT_WARNING_MINUTES, type EffectPreset } from '../rules/effects';
import { divinationFailChance, moonPhase, SPELLBOOK_REPLACE } from '../rules/longterm';
import { illumination, passiveMod, sightFor, weatherObscures, type Vision } from '../rules/sight';
import { LOST_RECHECK_DIE, navigationDC } from '../rules/navigation';
import { CHART_DC, OVERDUE_NOTE, arrivalNote, intoTheUnknown, trueDistance } from '../rules/uncharted';
import { TERRAIN, clampPace } from '../rules/terrain';
import { readSky, SKY_DC } from '../rules/skyclock';
import { MESSENGER_GP_PER_MILE } from '../rules/hirelings';
import { COMMS, commCost, commDelay, type CommMethod } from '../rules/comms';
import { CONTAGIONS, RECUPERATE_DAYS, RECUPERATE_DC, SIGHT_ROT_CURE_HOURS, type ContagionKind } from '../rules/contagion';
import { neglectLimit } from '../rules/bastion';
import { MARCH_WRITING_DC, marchWork } from '../rules/marchWork';
import { isSoloWork, RARITY_LABEL, magicItemCrafting, nonmagicalCrafting, SCROLL_CRAFTING, type Rarity } from '../rules/crafting';
import { ALL_IS_WELL, BARRACK_ROOM, BASTION_CHARMS, CONSTRUCTS, CREATURE_ROOM, GROVE_ROOM, GROVE_UNITS, MUSEUM_ORIGINS, NECROPOLIS_ROOM, EVENT_PREFERENCE, FACILITY_OPTIONS, GARDEN_PRODUCTS, GUILDS, MENAGERIE_CREATURES, MENAGERIE_ROOM, SHIPS, TRAINERS, TREASURE_TABLE, facilityHirelings, stableMarkup, storehouseLimit, storehouseMarkup, type GardenType } from '../rules/bastionOrders';
import { knownValue, misjudged, priceOf, saleRate, sameStack, valueSecret, valueUnknown } from '../rules/shop';
import { APPRAISE_MINUTES, JEWELER_TOOLS, appraiseCheck, misjudgedValue, valuableKind, type AppraiseMethod } from '../rules/appraise';
import { groundDifficulty, meltInches, mudAfter, snowfallInches } from '../rules/ground';
import { activityOf, bondCap, COMPLICATIONS, resolveActivity, resolveBuying, resolveSelling, weeksIn, type ActivityOpts, type Complication, type MagicLevel } from '../rules/downtimeOutcomes';
import { GROUP_ASSISTANCE, PATRONS, type PatronKind } from '../rules/patrons';
import { REGIONS, regionBand, type RegionKind } from '../rules/regions';
import { CREDITOR_LABEL, DUE_DAYS, ESCALATION, LENIENT_GP, PRISON_LABOR_GP_PER_WEEK, SERVICE_CREDIT, WEEKLY_INTEREST, type CreditorKind, type Escalation } from '../rules/debts';
import { RIVAL_ESCALATION, RIVAL_IDEAS, RIVAL_MOVES } from '../rules/rivals';
import { componentFor, REVIVAL_LIMIT, TARGET_SPELLS, type CostlyComponent } from '../rules/components';
import { POISONS, poisonByName, poisonItemName, type PoisonInfo } from '../rules/poisons';
import { POISON_HARVEST_DC, POTION_MISCIBILITY } from '../rules/potions';
import { ALCHEMIST, ALCHEMIST_FIRE_DC, IMPROVISED_DC, IMPROVISED_COOK_DC, IMPROVISED_HARVEST_DC, IMPROVISED_OINTMENT_DC, IMPROVISED_TESTS, IMPROVISED_TIME, TEST_KIND_LABEL, TOOL_TESTS, type TestKind, NAVIGATOR, STARGAZE_DC, IMPROVISED_STARGAZE_DC, STARGAZE_MINUTES, CARTOGRAPHER, MAP_DC, IMPROVISED_MAP_DC, MAP_MINUTES, mapName, isMapOf, MAP_BONUS, WEAVER, CLOTH, MEND_DC, IMPROVISED_MEND_DC, MEND_MINUTES, DECIPHER_DC, DECIPHER_MINUTES } from '../rules/tools';
import { businessValue, AWAY_PROGRESS, BUILD_SPELLS, BUSINESS_DEBT_PENALTY, BUSINESS_MAX_DAYS, BUSINESS_TABLE_BONUS, CREW_COST_SHARE, MAX_EXTRA_CREWS, buildPace, rollBusiness } from '../rules/business';
import { HAZARDS, type GiftType, type HazardId } from '../rules/hazards';
import { ARCANA_DC, STUDY_MINUTES, type StudyMethod } from '../rules/identify';
import { FEED_LB_PER_DAY, MOUNT_CAPACITY, carryingCapacity, COINS_PER_LB, estimateWeight, loadLevel, parseInventory, RATION_WEIGHT, type LoadLevel } from '../rules/encumbrance';
import { bigEnoughToRide, canBeSidekick, canTame, currentDC, dayOutcome, missedDays, NO_AIDS, resultGain, sessionAttitude, sessionResult, tameCheck, tameDC, TRUST_PER_DAY_MAX, TAME_MAX_FAILS, TAME_RETRY_MINUTES, TAME_SESSION_MINUTES, trainingNeeded, TRAINING_LABEL, trustCue, trustNeeded, type TameAids, type TamerFacts, type TameTraining } from '../rules/taming';
import { BUTCHER_DC, BUTCHER_MINUTES, isEdible, MEAT_LB, STRANGE_TYPES, yieldsHide, type Creature } from '../rules/hunting';
import { CURE_DC, CURE_LB_PER_RATION, CURE_MAX_LB, CURE_MINUTES, curedRations, FEAST_FEAR_RELIEF, FEAST_STRESS_RELIEF, feastTempHp, HEARTY_SAVES, isFeast, MEAL_BUFF_MINUTES, MEAL_STRESS_RELIEF, tastyTempHp, WARM_SAVES } from '../rules/cooking';
import { featuresAt, hpForLevel, HIT_DIE_BY_SIZE, NEEDS_LANGUAGE, SIDEKICK_CLASS_LABEL, SIDEKICK_MAX_CR, sidekickLevelFor, sidekickResources, type SidekickClass, type SidekickRole } from '../rules/sidekicks';
import { PORTER_LB, SAILOR_BONUS, SAILOR_MAX, CATCH_UP_WARMS_EVERY_DAYS, LABORER_FUEL_DICE, RECUPERATE_EXHAUSTION, RECUPERATE_STRESS, BOOK_GP, BOOK_PAGES, COPY_MAP_DC, COPY_MAP_MINUTES, PERFORM_MINUTES, performTake, RESEARCH_IDENTIFY_AT, RESEARCH_LEAD_AT, ROUTE_MAP_GP, AMMO_SEARCH_DC, ammoRecovered, CAROUSING_STRESS_PER_WEEK, DIG_FIND_ON, FINE_FUR, FINE_FUR_ODDS, FORECAST_MARGIN, forageBonusDice, HIDE_GP, isExceptional, KEPT_GEAR_MINUTES, KEPT_GEAR_NOTE, poisonYield, REINFORCE_MARGIN, rollFind, SERVICE_FEAR_PER_WEEK, SERVICE_STRESS_PER_WEEK, SMALL_PELT, trophyFor, WATCH_CATCH_DC, WATCH_CATCH_DICE, type Chore } from '../rules/chorePayoffs';
import { addCoins, COIN_GP, coinCount, coinsFor, emptyPurse, exchange, fmtPurse, purseValue, spend, type Denom, type Purse } from '../rules/coins';
import { detectContainer } from '../rules/containers';
import { FIRE_DAMAGE, RAT_BITE_DAMAGE, RELAXATION_NEEDS, SHAKEDOWN_DAMAGE, SHAKEDOWN_GP, SHAKEDOWN_RIVAL_ODDS, SHUNNED_AFTER_DAYS, SPOILED_FOOD_DC, TAINTED_POTION_ODDS, WATCH_FINE, WATCH_JAIL_DAYS, WEEKLY_ODDS, WRETCHED_STRESS, isLowLife } from '../rules/lowLife';
import { BOILING_POT, CHARCOAL_WORDS, FRICTION_LIGHT_MINUTES, HIDE_WATERSKIN, LEAN_TO, BEDDING, MAKESHIFT_DC, MAKESHIFT_TORCH, POTS, POT_ALARM_DC, SNARE, SNARE_LINE, TINDERBOX, VINE_CORD, isBareback, leanToDC, ABILITY_LABEL, INK, INK_PAGES, PAPER, PERFUME, PERFUME_MINUTES, SIGNAL_WHISTLE, carriesTool, liquidCapacity, toolNamed, SPYGLASS, ALARM_LINE, ALARM_MINUTES, BELL, DIG_BY_HAND, DIG_LABEL, GATHER_MINUTES, HUNTING_TRAP, SCATTERABLE, SHOVEL, SHOVEL_MINUTES, STABLING_GP_PER_DAY, TENT, TENT_SLEEPS, TRAP_CATCH_ON, TRAP_MEAT_DICE, TRAP_SAVE_DC, needsExoticSaddle, type DigKind, MAGNIFYING_GLASS, hasSkill, proficientWith, abilityScore, PACKS, RATIONS, WATERSKIN, WATERSKIN_PINTS, packNamed, FUEL_LABEL, FUEL_MATCH, HEALERS_KIT, HEALERS_KIT_USES, OIL_MINUTES, VESSEL_MATCH, fuelFor, isHooded, isOilLight } from '../rules/gear';
import type { DdbImport } from '../rules/ddb';
import { INN_STAY_GP, MEAL_GP, MEALS_PER_DAY, FEED_GP_PER_DAY, HIRELING_WAGE, magicItemValue, fmtGp, LIFESTYLE_GP, LIFESTYLE_LABEL, type MountPreset, type Lifestyle } from '../rules/money';
import { STABLE_WAKE_DIE, STABILIZE_DC } from '../rules/upkeep';
import { ARMS_COURSES, armsCue, armsEntry, canTrainArms } from '../rules/armsTraining';
import { FORT_NEGLECT_DAYS, FORT_UPKEEP, LAND, LODGING_CAP, MARK_LABEL, PRIZE_CROWN_SHARE, RIGHTS, TITLE_RANK, TRUST_LABEL, TRUST_MAX, lifestyleBelow, lowerLifestyle, monthDue, rollLandIncome, rollLandTrouble, sameCommunity, TRAINING_KIND_LABEL, levelRenown, renownMinimum } from '../rules/prestige';
import { RITUAL_EXTRA_MINUTES as RITUAL_TAG_MINUTES, spellInfo } from '../rules/rituals';
import { circleBeginsText, circleBrokenText, circleEligible, circleEndsText, circleOption, CIRCLE_RANGE_FT, helperProblem, optionProblem, prolongMinutes, slotNeedText, spellCircle, supplantDiscount, type CircleOptionId, type HelperSlot } from '../rules/circle';
import { maxWatchMinutes, slotTimes, watchMinutes, watchSight, type Sight } from '../rules/watch';
import { abilityMod, ATTUNE_AWAY_MINUTES, IDENTIFY_MINUTES, MAX_ATTUNED, RITUAL_EXTRA_MINUTES } from '../rules/upkeep';
import { COOK_RAW_MINUTES, DEFAULT_FIRE_COLD_LIMIT_F, FIRE_LIGHT_DC, FIRE_METHODS, FIRE_SPELLS, fireColdLimit, fireKeepsWarm, fireLighting, type FireMethod } from '../rules/campfire';
import { applyTier, tierName, TIERS, type TierId } from '../rules/detailTiers';
import { fireThreat, precipKind, rollWeather, temperatureAt, CLIMATES, weatherDamageAffinities, type Affinity } from '../rules/weather';
import {
  exhaustionSummary,
  foodNeedLb,
  FOOD_LB_PER_DAY,
  PACES,
  PINTS_PER_GALLON,
  proficiencyBonus,
  waterNeedPints,
  fmtLb,
  fmtWater,
  heatDisadvantage,
  causesOf,
  isLocked,
  EXHAUSTION_CAUSE_LABEL,
  wearsBulkyArmor,
  armorTime,
  ARMOR_LABEL,
  PURIFY_SPELL,
  TAINTED_DC,
  CITY_WATER_DC,
  BOIL_MINUTES,
} from '../rules/survival';
import { isCaster, PREP_RULE, preparedCount, preparedLimit } from '../rules/spells';
import { newCharacter, uid } from './defaults';
import { sense, type SenseKey } from '../rules/senses';
import * as Piety from '../rules/piety';
import * as Priest from '../rules/priesthood';
import * as Ladder from '../rules/ladders';
import { buildTable, checkModifiers, DANGER, DIFFICULTY_LABEL, firstSign, rollOnTable, SRD_POOL, BOOK_POOL, type CheckConditions, type Danger, type EncounterCreature, type EncounterTable, type Party } from '../rules/encounters';
import type { TerrainType } from '../rules/terrain';
import { FESTERING_MEDICINE_DC, INJURIES, INJURY_MEDICINE_SUCCESSES, INJURY_REST_DAYS, INJURY_SPELLS, healsInjury, injuryFor, type InjuryKind } from '../rules/injuries';
import { MADNESS, MADNESS_SAVE_DC, MADNESS_SPELLS, MADNESS_THRESHOLD, madnessEffect, type MadnessTier } from '../rules/madness';
import { MAGIC_AGING, SLOW_AGING_FACTOR, STAGE_LABEL, STAGE_SENSE, ageStage, bodyAge, lifespanFor, longevityBackfire } from '../rules/aging';
import { HULL_LIMIT, DAMAGED_HULL_SPEED, MAINTAIN_MINUTES, REPAIR_DC, REPAIR_MINUTES, REPAIR_TOOL, WEAR_HOURS, WEAR_LIMIT, hullRepair, materialOf, repairCost, wearCauses } from '../rules/wear';
import { DUE_PRESETS, GUILD_EXPULSION, PERIOD_DAYS, dueAmount, type DueKind, type DuePeriod } from '../rules/dues';
import { BRIBE_GP_PER_HEAT, CRIMES, HEAT_DECAY_PER_WEEK, RECOGNISE_ON, heatLevel, jailDaysFor, samePlace, type CrimeSeverity } from '../rules/notoriety';
import { BOND_MAX, FAVOR_COOLDOWN_DAYS, NEGLECT_DAYS, attitudeOf, clampBond, favorDC } from '../rules/contacts';
import { REPLY_DIE, newsDelay, type NewsRoute } from '../rules/letters';
import { arrivalLine, buildingType, generateTown, newBuilding, rollCalamity, rollFame, rollKeeper, rollLeader, rollRuler, rollTrait, sortBuildings, type Town } from '../rules/settlements';
import { npcLine, rollNpc, type Npc } from '../rules/npcs';
import type { Settlement } from '../rules/services';

export interface Ctx {
  rng: Rng;
}

const LOG_MAX = 600;
export const MIN_PER_DAY = 1440;

export const absNow = (s: State): number => s.dayIndex * MIN_PER_DAY + s.minutes;
export const stamp = (s: State): string => `${formatDate(s.calendar, s.startYear, s.dayIndex)} · ${formatClock(s.minutes)}`;
export const seasonOf = (s: State) => dateFromIndex(s.calendar, s.startYear, s.dayIndex).month.season;
export const tempNow = (s: State): number => temperatureAt(s.weather, s.minutes % MIN_PER_DAY);
export const charById = (s: State, id: string): Character | undefined => s.characters.find((c) => c.id === id);
export const alive = (c: Character) => c.exhaustion < 6 && c.diedAt == null;

export function log(s: State, text: string, tone: Tone = 'info', extra?: Pick<LogEntry, 'charIds' | 'status' | 'sense'>): void {
  s.log.unshift({ id: uid(), stamp: stamp(s), text, tone, ...extra });
  if (s.log.length > LOG_MAX) s.log.length = LOG_MAX;
}

const STATUS_MAX = 5000;

/** Something the characters notice (with or without a specific character): logged with a sensory description. */
export function noticed(s: State, kind: SenseKey, chars: Character[], text: string, tone: Tone = 'info'): void {
  // Same line for everyone affected at the same moment, so the party can be described together.
  const feel = sense(kind, absNow(s) + kind.length * 7);
  log(s, text, tone, { charIds: chars.map((c) => c.id), status: chars.length > 0, sense: feel });
  for (const c of chars) {
    s.statusLog.unshift({ id: uid(), stamp: stamp(s), at: absNow(s), charId: c.id, kind, text, sense: feel, tone });
  }
  if (s.statusLog.length > STATUS_MAX) s.statusLog.length = STATUS_MAX;
}

/** Logs a change to one character's condition, with what they notice, in both the Chronicle and the status log. */
export function status(s: State, c: Character, kind: SenseKey, text: string, tone: Tone = 'info'): void {
  noticed(s, kind, [c], text, tone);
}

const CAUSE_SENSE: Record<ExhaustionCause, SenseKey> = {
  malnutrition: 'malnutrition',
  dehydration: 'dehydration',
  cold: 'cold',
  heat: 'heat',
  march: 'march',
  coldNight: 'coldNight',
  sleep: 'sleep',
  frigid: 'frigid',
  suffocation: 'frigid',
  deepWater: 'frigid',
  contagion: 'contagionOnset',
  other: 'sleep',
};

const adventurers = (s: State) => s.characters.filter((c) => c.kind !== 'mount' && alive(c));

/** Pays from a character's coins (making change); anything they can't cover becomes debt. */
export function spendWealth(c: Character, gp: number): void {
  const { purse } = spend(c.purse, gp);
  c.purse = purse;
  c.gp = Math.round((c.gp - gp) * 100) / 100;
}

/** Adds money as coins, paying off any debt first. */
export function gainWealth(c: Character, gp: number): void {
  const debt = Math.max(0, purseValue(c.purse) - c.gp);
  const toPurse = Math.max(0, gp - debt);
  c.purse = addCoins(c.purse, coinsFor(toPurse));
  c.gp = Math.round((c.gp + gp) * 100) / 100;
  if (gp > 0) c.earnedGp = Math.round(((c.earnedGp ?? 0) + gp) * 100) / 100;
}

/** Charges gold to one or more characters, split evenly. Does nothing when charging costs is switched off. */
export function payGold(s: State, payerIds: string[], amount: number, what: string): void {
  if (!s.settings.chargeCosts || amount <= 0) return;
  let payers = payerIds.map((id) => charById(s, id)).filter((c): c is Character => !!c && c.kind !== 'mount');
  if (!payers.length) payers = adventurers(s).filter((c) => !c.sidekick);
  if (!payers.length) payers = adventurers(s);
  if (!payers.length) return;
  const share = Math.round((amount / payers.length) * 100) / 100;
  for (const c of payers) spendWealth(c, share);
  const broke = payers.filter((c) => c.gp < 0).map((c) => c.name);
  log(
    s,
    `${payers.map((c) => c.name).join(', ')} pay${payers.length > 1 ? '' : 's'} ${fmtGp(amount)}${payers.length > 1 ? ` (${fmtGp(share)} each)` : ''} for ${what}.${broke.length ? ` ${broke.join(', ')} ${broke.length > 1 ? 'are' : 'is'} now in debt.` : ''}`,
    broke.length ? 'warn' : 'info',
  );
}

/** Pays for a service (fares, tolls, spellcasting), split among the payers. */
export const payForService = act((d, _ctx, payerIds: string[], gp: number, what: string) => {
  payGold(d, payerIds, Math.round(gp * 100) / 100, what);
});

export function receiveGold(s: State, payeeIds: string[], amount: number, what: string): void {
  if (!s.settings.chargeCosts || amount <= 0) return;
  let payees = payeeIds.map((id) => charById(s, id)).filter((c): c is Character => !!c && c.kind !== 'mount');
  if (!payees.length) payees = adventurers(s).filter((c) => !c.sidekick);
  if (!payees.length) payees = adventurers(s);
  const share = Math.round((amount / payees.length) * 100) / 100;
  for (const c of payees) gainWealth(c, share);
  log(s, `${payees.map((c) => c.name).join(', ')} receive ${fmtGp(amount)} for ${what}.`, 'good');
}

/** Wraps a mutating action so callers always get a fresh state object. */
function act<A extends unknown[]>(fn: (d: State, ctx: Ctx, ...args: A) => void) {
  return (s: State, ctx: Ctx, ...args: A): State => {
    const d = structuredClone(s);
    ensureWeather(d, ctx);
    fn(d, ctx, ...args);
    return d;
  };
}

// ---------------------------------------------------------------- weather

export function ensureWeather(s: State, ctx: Ctx): void {
  if (s.weather && s.weather.dayIndex === s.dayIndex) return;
  newWeather(s, ctx);
}

function newWeather(s: State, ctx: Ctx): void {
  // Yesterday's weather leaves its mark on the ground (table rule).
  if (s.weather && s.weather.dayIndex < s.dayIndex && !CLIMATES[s.weather.climate].noWeather) {
    const g = s.place.ground ?? { snowIn: 0, mudDays: 0 };
    const before = groundDifficulty(g, s.place.goodRoad);
    g.snowIn = Math.max(0, g.snowIn + snowfallInches(s.weather) - meltInches(s.weather));
    g.mudDays = mudAfter(g.mudDays, s.weather);
    s.place.ground = g;
    const after = groundDifficulty(g, s.place.goodRoad);
    if (after && !before) noticed(s, 'groundHeavy', [], `The ground has turned to ${after}: travel off well-kept roads counts as Difficult Terrain.`, 'warn');
    if (before && !after) noticed(s, 'groundClear', [], 'The ground firms up again; travel is back to normal.', 'good');
  }
  const told = s.forecast && s.forecast.dayIndex === s.dayIndex && s.forecast.climate === s.place.climate ? s.forecast : null;
  s.forecast = null;
  s.weather =
    told ??
    rollWeather(
      { dayIndex: s.dayIndex, season: seasonOf(s), climate: s.place.climate, altitudeFt: s.place.altitudeFt, climateAdjustedPrecip: s.settings.climateAdjustedPrecip },
      ctx.rng,
    );
  s.weatherHistory = [s.weather, ...s.weatherHistory.filter((w) => w.dayIndex !== s.dayIndex)].slice(0, 30);
  const w = s.weather;
  if (!CLIMATES[w.climate].noWeather) {
    log(s, `Weather: high ${w.high}°F, low ${w.low}°F, ${w.wind === 'none' ? 'no' : w.wind} wind, ${w.precip === 'none' ? 'no' : w.precip} precipitation.`);
  }
}

export const rerollWeather = act((d, ctx) => {
  newWeather(d, ctx);
});

// ---------------------------------------------------------------- exposure

export interface Exposure {
  cold: boolean;
  heat: boolean;
  reason: string;
}

/** Is a burning campfire keeping the camp warm at this temperature (table rule)? */
export function campfireWarms(s: State, tempF: number = tempNow(s)): boolean {
  return s.fire.lit && s.settings.fireWarmsCamp && fireKeepsWarm(tempF, s.settings.fireColdLimitF ?? DEFAULT_FIRE_COLD_LIMIT_F, s.fire.sheltered);
}

export function exposure(s: State, activity: Activity, tempF: number = tempNow(s)): Exposure {
  const magicShelter = activity !== 'travel' && s.effects.find((e) => e.shelter);
  if (magicShelter) return { cold: false, heat: false, reason: `Inside ${magicShelter.name}` };
  const indoors = s.place.shelter === 'building' || s.place.shelter === 'cave';
  if (activity !== 'travel' && indoors) return { cold: false, heat: false, reason: s.place.shelter === 'cave' ? 'Sheltered in a cave' : 'Indoors' };
  if (activity !== 'travel' && campfireWarms(s, tempF)) return { cold: false, heat: true, reason: 'Warmed by the campfire' };
  if (activity !== 'travel' && s.fire.lit && s.settings.fireWarmsCamp)
    return { cold: true, heat: true, reason: `Too cold for the campfire to help (it protects down to ${fireColdLimit(s.settings.fireColdLimitF ?? DEFAULT_FIRE_COLD_LIMIT_F, s.fire.sheltered)}°F)` };
  return { cold: true, heat: true, reason: activity === 'travel' ? 'On the road' : s.place.shelter === 'tent' ? 'In a tent (still exposed to temperature)' : 'In the open' };
}

/** Whether the party is in downtime in a settlement, where lifestyle expenses cover lodging and meals. */
export const inDowntime = (s: State): boolean => s.place.settlement && s.townMode === 'downtime';

/** A rented room still valid right now. */
export const hasRoom = (s: State, c: Character): boolean => !!c.lodging && c.lodging.until > absNow(s);

/**
 * The standard of living that sets a character's risks in town: their lifestyle during downtime; in day-to-day play,
 * the quality of the room they rented, or Wretched (sleeping rough) without one.
 */
export function livingOf(s: State, c: Character): Lifestyle {
  if (inDowntime(s)) return c.lifestyle;
  return hasRoom(s, c) ? c.lodging!.tier : 'wretched';
}

/** Sleeping rough in town (table rule): Wretched characters face the weather as if camping, unless Renown 3+ finds them shelter. */
export function sleepsRough(s: State, c: Character): boolean {
  return s.settings.lifestyleRisks && s.place.settlement && c.kind !== 'mount' && livingOf(s, c) === 'wretched' && bestRenown(s) < 3;
}

/** Squalid lodgings are drafty (table rule): a cold night still bites without a Blanket or Bedroll. */
function draftyLodgings(s: State, c: Character): boolean {
  return s.settings.lifestyleRisks && s.place.settlement && c.kind !== 'mount' && livingOf(s, c) === 'squalid';
}

/** One character's exposure: the party's, unless they're sleeping rough on the street. */
export function personalExposure(s: State, c: Character, activity: Activity, partyExp: Exposure): Exposure {
  if (s.place.settlement && !inDowntime(s) && hasRoom(s, c) && activity !== 'travel') return { cold: false, heat: false, reason: 'In a rented room' };
  if (!sleepsRough(s, c) || s.effects.some((e) => e.shelter && activity !== 'travel')) return partyExp;
  return { cold: true, heat: true, reason: 'Sleeping rough on the street' };
}

/** Anything that means an automatic success against extreme cold. A Bedroll only counts while resting in it. */
export function coldProtection(c: Character, activity: Activity = 'camp', gearCounts = false): string | null {
  if (c.coldResist === 'immunity') return 'Cold Immunity';
  if (c.coldResist === 'resistance') return 'Cold Resistance';
  if (c.coldWeatherGear && gearCounts) return 'Cold weather gear (2014 rule)';
  if (c.bedroll && activity === 'rest') return 'Bedroll';
  return null;
}

/** Warm cover for a cold night: automatic protection, or a Blanket. */
export const hasWarmCover = (c: Character): boolean => !!coldProtection(c, 'rest', true) || c.blanket || !!c.bedding;

export function hasDrinkableWater(s: State, c: Character, activity: Activity): boolean {
  return c.waterPints > 0 || s.place.waterSource || (activity !== 'travel' && s.stores.waterGal + s.stores.waterUnsafeGal > 0);
}

export function heatProtection(c: Character, hasWater: boolean): string | null {
  if (c.fireResist === 'immunity') return 'Fire Immunity';
  if (c.fireResist === 'resistance') return 'Fire Resistance';
  if (hasWater) return 'Has drinkable water';
  return null;
}

// ---------------------------------------------------------------- saves & exhaustion

const CAUSE_OF_SAVE: Partial<Record<SaveKind, ExhaustionCause>> = { cold: 'cold', heat: 'heat', march: 'march', malnutrition: 'malnutrition', chill: 'coldNight', sleep: 'sleep', frigid: 'frigid', deepWater: 'deepWater' };
const SUFFOCATION_NOTE = 'gone once they can breathe again';

export function gainExhaustion(s: State, c: Character, n: number, why: string, cause: ExhaustionCause = 'other'): void {
  if (!alive(c)) return;
  const causes = causesOf(c);
  const add = Math.min(n, 6 - c.exhaustion);
  for (let i = 0; i < add; i++) causes.push(cause);
  c.exhaustion = Math.min(6, c.exhaustion + add);
  c.exhaustionCauses = causes;
  status(s, c, CAUSE_SENSE[cause], `${c.name} gains ${n} Exhaustion level${n > 1 ? 's' : ''} from ${EXHAUSTION_CAUSE_LABEL[cause]} (${why}). Now level ${c.exhaustion}: ${exhaustionSummary(c.exhaustion)}.`, 'bad');
  if (c.exhaustion >= 6) {
    c.diedAt = absNow(s);
    status(s, c, 'death', `${c.name} dies of exhaustion.`, 'bad');
  }
}

/** Removes the newest level that isn't locked by malnutrition or dehydration. Returns its cause, or null if none could go. */
export function recoverExhaustion(c: Character): ExhaustionCause | null {
  const causes = causesOf(c);
  for (let i = causes.length - 1; i >= 0; i--) {
    if (isLocked(c, causes[i])) continue;
    const [gone] = causes.splice(i, 1);
    c.exhaustionCauses = causes;
    c.exhaustion = causes.length;
    return gone;
  }
  return null;
}

function applySaveResult(s: State, ctx: Ctx, c: Character, p: Omit<PendingSave, 'id' | 'stamp'>, passed: boolean, detail: string): void {
  log(s, `${c.name}: Constitution save, DC ${p.dc}, against ${p.reason}. ${detail}${passed ? 'Success.' : 'Failure.'}`, passed ? 'good' : 'warn');
  if (!passed) {
    if (p.kind === 'tainted' || p.kind === 'raw') {
      const from = p.kind === 'raw' ? 'raw food' : 'unpurified water';
      const was = c.sick;
      c.sickFrom = was && c.sickFrom && c.sickFrom !== from ? 'raw food and unpurified water' : was && c.sickFrom ? c.sickFrom : from;
      c.sick = true;
      status(
        s,
        c,
        p.kind === 'raw' ? 'foodPoisoning' : 'waterIllness',
        was
          ? `${c.name} feels worse from ${p.reason}, already Sick: still Poisoned until they finish a Long Rest.`
          : `${c.name} is Sick from ${p.reason}: Poisoned (Disadvantage on attack rolls and ability checks) until they finish a Long Rest.`,
        'bad',
      );
      // Only a new bout counts: drinking more while already Sick doesn't.
      if (p.kind === 'tainted' && !was) {
        waterborneIllness(s, ctx, c);
        if (p.city) cityWaterSightRot(s, ctx, c);
      }
      return;
    }
    if (p.kind === 'malnutrition') c.malnourished = true;
    gainExhaustion(s, c, 1, p.reason, CAUSE_OF_SAVE[p.kind]);
  }
}

export function rollSave(c: Character, dc: number, mode: RollMode, rng: Rng) {
  const r = d20(mode, rng);
  const mod = c.conSave - 2 * c.exhaustion;
  const total = r.value + mod;
  const modeTxt = mode === 'normal' ? '' : ` (${mode === 'advantage' ? 'Advantage' : 'Disadvantage'})`;
  const exhTxt = c.exhaustion ? `, including −${2 * c.exhaustion} from Exhaustion` : '';
  return { passed: total >= dc, total, detail: `Rolled ${r.rolls.join('/')}${modeTxt} ${signed(mod)}${exhTxt} = ${total}. ` };
}

/** Is an Antitoxin giving this creature Advantage on saves to avoid or end the Poisoned condition? */
export const antitoxinActive = (s: State, c: Character): boolean => c.antitoxinUntil != null && c.antitoxinUntil > absNow(s);

/** Advantage from Antitoxin on saves against poison, which is what raw food, dirty water and poisons call for. */
const poisonSaveMode = (s: State, c: Character, mode: RollMode = 'normal'): RollMode => (antitoxinActive(s, c) ? combineModes(mode, 'advantage') : mode);

function requestSave(s: State, ctx: Ctx, c: Character, kind: SaveKind, dc: number, mode: RollMode, reason: string, city = false): void {
  if ((kind === 'raw' || kind === 'tainted') && antitoxinActive(s, c)) {
    mode = poisonSaveMode(s, c, mode);
    reason = `${reason}, with Antitoxin`;
  }
  // Table rule: a hot meal in the belly helps against the cold, and a good one against a hard march.
  const meal = c.mealBuff && c.mealBuff.until > absNow(s) ? c.mealBuff : null;
  if (meal && ((WARM_SAVES as readonly string[]).includes(kind) || (meal.hearty && (HEARTY_SAVES as readonly string[]).includes(kind)))) {
    mode = combineModes(mode, 'advantage');
    reason = `${reason}, warmed by a hot meal`;
  }
  const spec = { charId: c.id, kind, dc, mode, reason, ...(city ? { city: true } : {}) };
  if (s.settings.autoRollSaves) {
    const r = rollSave(c, dc, mode, ctx.rng);
    applySaveResult(s, ctx, c, spec, r.passed, r.detail);
  } else {
    s.pending.push({ ...spec, id: uid(), stamp: stamp(s) });
  }
}

export const resolvePending = act((d, ctx, id: string, outcome: 'roll' | 'pass' | 'fail') => {
  const p = d.pending.find((x) => x.id === id);
  if (!p) return;
  d.pending = d.pending.filter((x) => x.id !== id);
  const c = charById(d, p.charId);
  if (!c) return;
  if (outcome === 'roll') {
    const r = rollSave(c, p.dc, p.mode, ctx.rng);
    applySaveResult(d, ctx, c, p, r.passed, r.detail);
  } else applySaveResult(d, ctx, c, p, outcome === 'pass', 'Entered by hand. ');
});

// ---------------------------------------------------------------- the clock

function tickHour(s: State, ctx: Ctx, activity: Activity): void {
  const temp = temperatureAt(s.weather, (s.minutes - 30 + MIN_PER_DAY) % MIN_PER_DAY);

  if (s.fire.lit) {
    s.fire.fuelHours = Math.max(0, s.fire.fuelHours - 1);
    const threat = fireThreat(s.weather, temp);
    const indoors = s.place.shelter === 'building' || s.place.shelter === 'cave';
    if (threat && !s.fire.sheltered && !indoors) {
      s.fire.lit = false;
      noticed(s, 'fireOut', [], `The ${threat} puts out the campfire.`, 'warn');
    } else if (s.fire.fuelHours <= 0) {
      s.fire.lit = false;
      noticed(s, 'fireOut', [], 'The campfire burns down to embers and goes out.', 'warn');
    }
  }

  const partyExp = exposure(s, activity, temp);
  for (const c of s.characters) {
    if (!alive(c)) continue;
    const exp = personalExposure(s, c, activity, partyExp);
    if (s.settings.extremeWeather && exp.cold && temp <= 0 && !coldProtection(c, activity, s.settings.coldGear2014)) {
      const wrapped = (c.blanket || !!c.bedding) && activity === 'rest';
      requestSave(s, ctx, c, 'cold', 10, wrapped ? 'advantage' : 'normal', `extreme cold (${temp}°F)${wrapped ? (c.blanket ? ', wrapped in a Blanket' : ', on a bed of boughs') : ''}`);
    } else if (activity === 'rest' && (exp.cold || draftyLodgings(s, c)) && s.settings.coldNights && temp <= s.settings.coldNightF && !hasWarmCover(c)) {
      c.nightChill = c.nightChill == null ? temp : Math.min(c.nightChill, temp);
    }
    if (s.settings.extremeWeather && exp.heat && temp >= 100) {
      if (!heatProtection(c, hasDrinkableWater(s, c, activity))) {
        c.heatHours += 1;
        requestSave(s, ctx, c, 'heat', 4 + c.heatHours, heatDisadvantage(c, s.settings.heavyClothing2014) ? 'disadvantage' : 'normal', `extreme heat (${temp}°F), hour ${c.heatHours}`);
      } else c.heatHours = 0;
    } else c.heatHours = 0;
  }
}

function dailyCosts(s: State): void {
  if (s.place.settlement && !inDowntime(s)) {
    // Day to day in town: no lifestyle expenses (2024 PHB). Meals and rooms are bought as they go.
    for (const c of adventurers(s)) {
      if (c.lifestyleOwed) settleLifestyle(s, c, 'downtime lodgings and meals');
      if (c.lodging && c.lodging.until <= absNow(s)) c.lodging = null;
    }
  }
  if (inDowntime(s)) {
    const fed: string[] = [];
    for (const c of adventurers(s)) {
      if (c.lifestyle !== 'wretched' || Math.max(0, ...s.factions.map((f) => f.renown)) >= 3) {
        c.ateLbToday = Math.max(c.ateLbToday, foodNeedLb(c));
        c.drankPintsToday = Math.max(c.drankPintsToday, waterNeedPints(c, false, false));
        fed.push(c.name);
      }
      const cost = freeLodging(s, c) ? Math.max(0, patronLifestyleCost(s, c.lifestyle) - patronLifestyleCost(s, lowerLifestyle(c.lifestyle, LODGING_CAP))) : patronLifestyleCost(s, c.lifestyle);
      const next = dateFromIndex(s.calendar, s.startYear, s.dayIndex + 1);
      const period = s.settings.lifestylePeriod;
      if (period === 'day') payGold(s, [c.id], cost, `a day of ${LIFESTYLE_LABEL[c.lifestyle]} living`);
      else {
        // Weekly or monthly bills cover only the days actually spent in town.
        c.lifestyleOwed = (c.lifestyleOwed ?? 0) + cost;
        const due = period === 'week' ? (s.dayIndex + 1) % 7 === 0 : next.day === 1;
        if (due) settleLifestyle(s, c, `the ${period}'s ${LIFESTYLE_LABEL[c.lifestyle]} living`);
      }
      if (s.settings.debtDropsLifestyle && s.settings.chargeCosts && c.gp < 0 && c.lifestyle !== 'wretched') {
        const tiers = Object.keys(LIFESTYLE_GP) as Lifestyle[];
        const lower = tiers[tiers.indexOf(c.lifestyle) - 1];
        status(s, c, 'lifestyleDrops', `${c.name} can't pay their way and moves to cheaper lodgings: ${LIFESTYLE_LABEL[lower]} living from now on (table rule).`, 'warn');
        c.lifestyle = lower;
      }
    }
    if (fed.length) log(s, `Town living covers meals and lodging for ${fed.join(', ')}.`);
    if (s.settings.stabling) stableMounts(s);
  } else if (!s.place.settlement) {
    for (const c of adventurers(s)) if (c.lifestyleOwed) settleLifestyle(s, c, 'lodgings and meals on leaving town');
    if (s.settings.hirelingsEat && s.settings.foodAndWater) hirelingsEat(s);
  }
  if (s.place.settlement && s.settings.stabling && !inDowntime(s)) stableMounts(s);
  for (const h of s.hirelings) {
    if (h.active && h.wageGp > 0) payGold(s, h.payer === 'party' ? [] : [h.payer], h.wageGp, `${h.name}'s daily wage`);
  }
  // Table rule: a hired sidekick's pay goes into their own purse; they pay their own way from it.
  for (const k of s.characters) {
    if (!k.sidekick || !alive(k) || k.sidekick.wageGp <= 0 || !s.settings.chargeCosts) continue;
    payGold(s, k.sidekick.payerId === 'party' ? [] : [k.sidekick.payerId], k.sidekick.wageGp, `${k.name}'s pay as a co-adventurer`);
    gainWealth(k, k.sidekick.wageGp);
  }
}

/** Stables and feeds the mounts in a settlement (2024 PHB: Stabling 5 SP, Feed 5 CP a day). */
function stableMounts(s: State): void {
  const stabled = s.characters.filter((m) => m.kind === 'mount' && alive(m));
  for (const m of stabled) {
    m.ateLbToday = Math.max(m.ateLbToday, foodNeedLb(m));
    m.drankPintsToday = Math.max(m.drankPintsToday, waterNeedPints(m, false, false));
  }
  if (stabled.length) payGold(s, [], Math.round(stabled.length * (STABLING_GP_PER_DAY + FEED_GP_PER_DAY) * 100) / 100, `stabling and feed for ${stabled.map((m) => m.name).join(', ')}`);
}

/** Switches between downtime (lifestyle covers lodging and meals) and day-to-day play (buy them as you go). */
function setTownModeMut(s: State, mode: 'downtime' | 'active', why = ''): void {
  if ((s.townMode ?? 'active') === mode) return;
  s.townMode = mode;
  if (mode === 'active') for (const c of adventurers(s)) if (c.lifestyleOwed) settleLifestyle(s, c, 'downtime lodgings and meals');
  log(
    s,
    mode === 'downtime'
      ? `${why}Downtime in ${s.place.name || 'town'}: each character's lifestyle now covers lodging, meals and upkeep (2024 PHB).`
      : `${why}Day-to-day play: no lifestyle expenses. Buy meals and rent rooms as you go, or live off rations.`,
  );
}

export const setTownMode = act((d, _ctx, mode: 'downtime' | 'active') => setTownModeMut(d, mode));

/** Free room and board (special rights) covers rooms and meals up to Comfortable in its community; above that only the difference is paid. */
function freeBoardPrice(s: State, c: Character, table: Record<Exclude<Lifestyle, 'wretched'>, number>, tier: Exclude<Lifestyle, 'wretched'>): number {
  if (!freeLodging(s, c)) return table[tier];
  return Math.max(0, table[tier] - table[lowerLifestyle(tier, LODGING_CAP) as Exclude<Lifestyle, 'wretched'>]);
}

/** Rents rooms at an inn (2024 PHB Inn Stay per Day). A room keeps the weather out and sets the quality of town life. */
export const rentRooms = act((d, _ctx, charIds: string[], tier: Exclude<Lifestyle, 'wretched'>, nights: number) => {
  const who = charIds.map((id) => charById(d, id)).filter((c): c is Character => !!c && c.kind !== 'mount');
  const n = Math.max(1, Math.round(nights));
  if (!who.length || !d.place.settlement) return;
  const now = absNow(d);
  // A night's stay runs to midday after the last night.
  const checkout = (d.dayIndex + n) * MIN_PER_DAY + 12 * 60;
  for (const c of who) {
    payGold(d, [c.id], Math.round(freeBoardPrice(d, c, INN_STAY_GP, tier) * n * 100) / 100, `${n} night${n > 1 ? 's' : ''} at a ${LIFESTYLE_LABEL[tier].toLowerCase()} inn`);
    c.lodging = { tier, until: Math.max(now + 60, checkout) };
  }
  log(d, `${who.map((c) => c.name).join(', ')} take${who.length > 1 ? '' : 's'} ${LIFESTYLE_LABEL[tier].toLowerCase()} rooms for ${n} night${n > 1 ? 's' : ''}.`, 'good');
});

/** Buys meals at an inn or tavern (2024 PHB Meal prices). Three meals make a day's food and drink. */
export const buyMeals = act((d, _ctx, charIds: string[], tier: Exclude<Lifestyle, 'wretched'>, meals: number) => {
  const who = charIds.map((id) => charById(d, id)).filter((c): c is Character => !!c && c.kind !== 'mount');
  const n = Math.max(1, Math.round(meals));
  if (!who.length || !d.place.settlement) return;
  for (const c of who) {
    payGold(d, [c.id], Math.round(freeBoardPrice(d, c, MEAL_GP, tier) * n * 100) / 100, `${n} ${LIFESTYLE_LABEL[tier].toLowerCase()} meal${n > 1 ? 's' : ''}`);
    c.ateLbToday = round2(c.ateLbToday + (foodNeedLb(c) * n) / MEALS_PER_DAY);
    c.drankPintsToday = round2(c.drankPintsToday + (waterNeedPints(c, false, false) * n) / MEALS_PER_DAY);
  }
  log(d, `${who.map((c) => c.name).join(', ')} ${who.length > 1 ? 'eat' : 'eats'} ${n === MEALS_PER_DAY ? "a day's" : n} ${LIFESTYLE_LABEL[tier].toLowerCase()} meal${n > 1 ? 's' : ''}, food and drink included.`);
});

function settleLifestyle(s: State, c: Character, what: string): void {
  const owed = Math.round((c.lifestyleOwed ?? 0) * 100) / 100;
  c.lifestyleOwed = 0;
  payGold(s, [c.id], owed, what);
}

/** Table rule: hirelings on the road eat and drink a Medium creature's share from the camp stores. */
function hirelingsEat(s: State): void {
  const now = absNow(s);
  const fed = s.hirelings.filter((h) => h.active && !(h.busyUntil && h.busyUntil > now));
  if (!fed.length) return;
  const food = Math.min(fed.length, s.stores.foodLb);
  const water = Math.min(fed.length, s.stores.waterGal);
  s.stores.foodLb = Math.round((s.stores.foodLb - food) * 100) / 100;
  s.stores.waterGal = Math.round((s.stores.waterGal - water) * 100) / 100;
  const short = [food < fed.length && `${+(fed.length - food).toFixed(1)} lb of food`, water < fed.length && `${+(fed.length - water).toFixed(1)} gal of water`].filter(Boolean);
  log(
    s,
    `The hirelings (${fed.map((h) => h.name).join(', ')}) eat and drink from the camp stores: ${+food.toFixed(1)} lb of food and ${+water.toFixed(1)} gal of water.${short.length ? ` The stores come up ${short.join(' and ')} short, and the hirelings grumble.` : ''}`,
    short.length ? 'warn' : 'info',
  );
}

function endOfDay(s: State, ctx: Ctx): void {
  dailyCosts(s);
  patronDaily(s);
  lifestyleRisks(s, ctx);
  cityWater(s, ctx);
  duesDaily(s);
  purseDebts(s);
  if ((s.dayIndex + 1) % 7 === 0) debtsWeekly(s, ctx);
  festeringWounds(s);
  notorietyDaily(s, ctx);
  pietyDaily(s);
  laddersDaily(s);
  contactsDaily(s);
  groomTheMounts(s);
  checkRituals(s);
  const hotDay = s.weather.high >= 100;
  for (const c of s.characters) {
    if (!alive(c) || !s.settings.foodAndWater) {
      c.ateLbToday = 0;
      c.drankPintsToday = 0;
      continue;
    }
    if (c.needsWater) {
      const need = waterNeedPints(c, hotDay, s.settings.doubleWaterInHeat);
      if (c.drankPintsToday < need / 2) {
        c.dehydrated = true;
        gainExhaustion(s, c, 1, `drank ${fmtWater(c.drankPintsToday)} of ${fmtWater(need)}`, 'dehydration');
      } else if (c.drankPintsToday >= need && c.dehydrated) {
        c.dehydrated = false;
        status(s, c, 'rehydrated', `${c.name} is fully rehydrated, so dehydration Exhaustion can be removed again.`, 'good');
      }
    }
    if (c.needsFood) {
      const need = foodNeedLb(c);
      if (c.ateLbToday <= 0) {
        c.daysWithoutFood += 1;
        if (c.daysWithoutFood >= 5) {
          c.malnourished = true;
          gainExhaustion(s, c, 1, `day ${c.daysWithoutFood} without food`, 'malnutrition');
        } else status(s, c, c.daysWithoutFood >= 3 ? 'starving' : 'hungry', `${c.name} ate nothing today (${c.daysWithoutFood} day${c.daysWithoutFood > 1 ? 's' : ''} without food).`, 'warn');
      } else {
        c.daysWithoutFood = 0;
        if (c.ateLbToday < need / 2) {
          requestSave(s, ctx, c, 'malnutrition', 10, 'normal', `malnutrition: ate ${fmtLb(c.ateLbToday)} of ${fmtLb(need)}`);
        } else if (c.ateLbToday >= need && c.malnourished) {
          c.malnourished = false;
          status(s, c, 'fed', `${c.name} ate a full day's food, so malnutrition Exhaustion can be removed again.`, 'good');
        }
      }
    }
    c.ateLbToday = 0;
    c.drankPintsToday = 0;
  }
  s.dayIndex += 1;
  s.minutes = 0;
  progressBastions(s);
  bastionDaily(s);
  progressBusinesses(s);
  prestigeDaily(s, ctx);
  log(s, `A new day begins: ${formatDate(s.calendar, s.startYear, s.dayIndex)}.`);
  birthdays(s);
  newWeather(s, ctx);
}

// ---------------------------------------------------------------- items and resources

/** Regains an item's charges from its expression ("1d6+1", "all", "2"). */
function regainCharges(s: State, ctx: Ctx, owner: Character, it: MagicItem, when: string): void {
  if (it.maxCharges == null || it.charges == null || it.charges >= it.maxCharges) return;
  const before = it.charges;
  const amt = it.regain.trim().toLowerCase() === 'all' ? it.maxCharges : rollExpr(it.regain, ctx.rng);
  if (amt == null) return;
  it.charges = Math.min(it.maxCharges, it.charges + Math.max(0, amt));
  log(s, `${owner.name}'s ${it.name} regains ${it.charges - before} charge(s) ${when} (${it.charges}/${it.maxCharges}).`, 'good');
}

function atDawn(s: State, ctx: Ctx): void {
  const refilled: string[] = [];
  for (const c of s.characters) {
    for (const it of c.items) if (it.regainAt === 'dawn') regainCharges(s, ctx, c, it, 'at dawn');
    for (const r of c.resources) {
      if (r.recharge === 'dawn' && r.current < r.max) {
        r.current = r.max;
        refilled.push(`${c.name}: ${r.name}`);
      }
    }
  }
  if (refilled.length) log(s, `Dawn breaks. Recovered: ${refilled.join(', ')}.`, 'good');
  contagionsAtDawn(s, ctx);
  if (s.place.region && s.settings.regionDailyRoll) regionRoll(s, ctx, 'a new day in the region');
}

function checkItemsLeftBehind(s: State): void {
  const now = absNow(s);
  for (const c of s.characters) {
    for (const it of c.items) {
      if (it.attuned && it.awaySince != null && now - it.awaySince >= ATTUNE_AWAY_MINUTES) {
        it.attuned = false;
        status(s, c, 'attunementEnds', `${c.name}'s attunement to ${it.name} ends: it has been more than 100 feet away for 24 hours.`, 'warn');
      }
    }
  }
}

/** Refills resources and item charges after a rest. */
function restoreAfterRest(s: State, ctx: Ctx, c: Character, kind: 'short' | 'long'): string[] {
  const got: string[] = [];
  for (const r of c.resources) {
    const before = r.current;
    if (kind === 'long' && r.recharge !== 'manual' && r.recharge !== 'dawn') r.current = r.max;
    else if (kind === 'short' && (r.recharge === 'short' || (c.className === 'Bard' && c.level >= 5 && /bardic inspiration/i.test(r.name)))) r.current = r.max; // Font of Inspiration
    else if (kind === 'short' && r.recharge === 'shortOne') r.current = Math.min(r.max, r.current + 1);
    if (r.current > before) got.push(`${r.name} ${r.current}/${r.max}`);
  }
  for (const it of c.items) {
    if ((kind === 'long' && (it.regainAt === 'longRest' || it.regainAt === 'shortRest')) || (kind === 'short' && it.regainAt === 'shortRest')) {
      regainCharges(s, ctx, c, it, `after the ${kind === 'long' ? 'Long' : 'Short'} Rest`);
    }
  }
  return got;
}

/** Attuning, identifying or ending attunement takes a rest spent focused on the item. */
function applyRestFocus(s: State, c: Character): void {
  const f = c.restFocus;
  c.restFocus = null;
  if (!f) return;
  const it = c.items.find((x) => x.id === f.itemId);
  if (!it) return;
  if (f.action === 'identify') {
    revealAll(s, it, 'identify');
    log(s, `${c.name} spends the rest focused on the ${it.name} and learns its properties${it.requiresAttunement ? ', including that it needs attunement' : ''}.`, 'good');
  } else if (f.action === 'unattune') {
    const cursed = (it.clues ?? []).some((x) => x.kind === 'curse');
    if (cursed && !c.curseBroken) {
      log(s, `${c.name} focuses on the ${it.name} all rest but can't let go of it: a curse binds the attunement. Remove Curse (or similar) must be cast first.`, 'warn');
    } else {
      it.attuned = false;
      if (cursed) c.curseBroken = false;
      status(s, c, 'attunementEnds', `${c.name} ends their attunement to the ${it.name}.`);
    }
  } else {
    const count = c.items.filter((x) => x.attuned).length;
    if (count >= MAX_ATTUNED) log(s, `${c.name} can't attune to the ${it.name}: already attuned to ${MAX_ATTUNED} items.`, 'warn');
    else if (it.awaySince != null) log(s, `${c.name} can't attune to the ${it.name}: it has to be in hand.`, 'warn');
    else {
      it.attuned = true;
      revealAll(s, it, 'attune');
      const curses = (it.clues ?? []).filter((x) => x.kind === 'curse' && !x.known);
      for (const x of curses) x.known = true;
      if (curses.length) {
        addFinding(s, it, 'attune', `Attuning reveals a curse: ${curses.map((x) => x.text).join('; ')}.`);
        log(s, `As ${c.name} attunes to the ${it.name}, a curse makes itself known: ${curses.map((x) => x.text).join('; ')}.`, 'bad');
      }
      status(s, c, 'attuned', `${c.name} attunes to the ${it.name} (${count + 1}/${MAX_ATTUNED}).`, 'good');
    }
  }
}

/** Is the camp lit for the whole of a watch ending `endsIn` minutes from now? */
function campLitFor(s: State, endsIn: number): boolean {
  if (s.place.shelter === 'building') return true;
  if (s.fire.lit && s.fire.fuelHours * 60 >= endsIn) return true;
  const now = absNow(s);
  return s.effects.some((e) => e.kind === 'light' && e.pausedLeft == null && (e.endsAt == null || e.endsAt >= now + endsIn));
}

/** Darkvision right now: the character's own, an active Darkvision spell on them (150 ft), Goggles of Night (60 ft, or +60), and Devil's Sight. */
export function visionOf(s: State, c: Character): Vision {
  const now = absNow(s);
  let ft = c.darkvision || 0;
  const spell = s.effects.some(
    (e) => /^darkvision\b/i.test(e.name) && (e.endsAt == null || e.endsAt > now) && (e.targetIds.length ? e.targetIds : e.casterId ? [e.casterId] : []).includes(c.id),
  );
  if (spell) ft = Math.max(ft, 150);
  const names = [...(c.items ?? []).map((i) => i.name), ...(c.inventory ?? []).map((i) => i.name)];
  if (names.some((n) => /goggles of night/i.test(n))) ft = Math.max(ft, c.darkvision > 0 ? c.darkvision + 60 : 60);
  return { darkvision: ft, seesInDark: (c.features ?? []).some((f) => /devil'?s sight/i.test(f)) };
}

/** A full moon in a clear sky gives Dim Light outdoors at night (2024 PHB). */
function fullMoonOut(s: State): boolean {
  return s.weather.precip === 'none' && moonPhase(s.dayIndex, s.settings.moonOffset).name === 'Full moon';
}

/** Heavy rain or snow, or a sandstorm, obscuring the open air right now; null under a roof or underground. */
function obscuredNow(s: State, indoors: boolean): string | null {
  const clim = CLIMATES[s.weather.climate];
  return weatherObscures({ precip: s.weather.precip, wind: s.weather.wind, sandy: !!clim.sandy, snow: precipKind(tempNow(s)) === 'snow', indoors: indoors || !!clim.noWeather });
}

/** Is there light right now? At camp a burning fire or a roof counts; on the move only carried lights do, and a candle is too small to travel by. */
function lightNow(s: State, where: 'camp' | 'travel' | 'explore'): boolean {
  const now = absNow(s);
  if (where === 'camp' && (s.fire.lit || s.place.shelter === 'building')) return true;
  return s.effects.some((e) => e.kind === 'light' && e.pausedLeft == null && (e.endsAt == null || e.endsAt > now) && (where !== 'travel' || !/candle/i.test(e.name)));
}

/** What a character can see right now, by the light, the weather and their senses. */
export function sightNow(s: State, c: Character, where: 'camp' | 'travel' | 'explore'): Sight {
  const underground = isUnderground(s);
  const indoors = where === 'camp' && (s.place.shelter === 'building' || s.place.shelter === 'cave');
  const light = illumination({ phase: lightAt(s.minutes % MIN_PER_DAY, seasonOf(s)).phase, underground, lit: lightNow(s, where), fullMoon: !underground && fullMoonOut(s) });
  return sightFor(light.level, light.why, visionOf(s, c), underground ? null : obscuredNow(s, indoors));
}

export interface WatchSlotInfo {
  from: number;
  to: number;
  watchers: { c: Character; sight: Sight; passive: number }[];
}

/** The watch plan as it would play out if the Long Rest started now. */
export function planWatches(s: State): WatchSlotInfo[] {
  const start = s.minutes % MIN_PER_DAY;
  const underground = isUnderground(s);
  const season = seasonOf(s);
  const fullMoon = !underground && fullMoonOut(s);
  const obscured = underground ? null : obscuredNow(s, s.place.shelter === 'building' || s.place.shelter === 'cave');
  return slotTimes(start, s.watchPlan.count).map((t, i) => {
    const mid = ((t.from + t.to) / 2) % MIN_PER_DAY;
    const phase = lightAt(mid, season).phase;
    const lit = campLitFor(s, t.to - start);
    const ids = s.watchPlan.slots[i] ?? [];
    const watchers = ids
      .map((id) => actorById(s, id))
      .filter((c): c is Character => !!c && alive(c))
      .map((c) => {
        const sight = watchSight(phase, lit, visionOf(s, c), underground, { fullMoon, obscured });
        return { c, sight, passive: c.passivePerception + sight.penalty };
      });
    return { from: t.from, to: t.to, watchers };
  });
}

/** Minutes each character spends on watch under the current plan. */
export function watchLoad(s: State): Record<string, number> {
  const len = watchMinutes(s.watchPlan.count);
  const load: Record<string, number> = {};
  for (const slot of s.watchPlan.slots.slice(0, s.watchPlan.count)) for (const id of slot) load[id] = (load[id] ?? 0) + len;
  return load;
}

/** Night watch: who stands each watch, what they can see, and an optional random encounter check per watch. */
function standWatches(s: State, ctx: Ctx): Record<string, number> {
  const plan = planWatches(s);
  if (!plan.some((p) => p.watchers.length)) return {};
  const lines: string[] = [];
  plan.forEach((p, i) => {
    const when = `${formatClock(p.from % MIN_PER_DAY)}–${formatClock(p.to % MIN_PER_DAY)}`;
    if (!p.watchers.length) {
      lines.push(`${when}: nobody`);
      return;
    }
    const best = Math.max(...p.watchers.map((w) => w.passive));
    const who = p.watchers.map((w) => `${w.c.name} (passive Perception ${w.passive}${w.sight.blind ? ', hearing only' : w.sight.penalty ? ', dim' : ''})`).join(' and ');
    let note = `${when}: ${who}`;
    if (!s.settings.encounters && s.settings.encounterOn > 0) {
      const r = die(20, ctx.rng);
      if (r >= s.settings.encounterOn) {
        note += ': encounter!';
        log(s, `Random encounter during watch ${i + 1} (${when}), with ${p.watchers.map((w) => w.c.name).join(' and ')} on watch, best passive Perception ${best}. d20 = ${r}. If it interrupts the rest, decide whether the Long Rest still counts.`, 'warn');
      }
    } else if (!p.watchers.length) note += ' (unwatched)';
    // Table rule: a quiet watch at a wild camp, the watcher works a line or a snare at the edge of the firelight.
    if (!s.place.settlement && s.place.shelter !== 'building' && !note.includes('encounter')) {
      const w = [...p.watchers].sort((a, b) => b.c.survival - a.c.survival)[0];
      const r = d20('normal', ctx.rng);
      if (r.value + w.c.survival - 2 * w.c.exhaustion >= WATCH_CATCH_DC) {
        const lb = rollExpr(WATCH_CATCH_DICE, ctx.rng) ?? 1;
        const raw = s.settings.rawFoodRisk;
        if (raw) s.stores.foodRawLb = round2(s.stores.foodRawLb + lb);
        else s.stores.foodLb = round2(s.stores.foodLb + lb);
        note += `, and ${w.c.name} brings in ${lb} lb of ${s.place.waterSource ? 'fish from a night line' : 'small game from a snare'}`;
      }
    }
    lines.push(note);
  });
  log(s, `Night watches: ${lines.join('; ')}.`);
  return watchLoad(s);
}

/** Each time the party passes another full 24 hours awake, everyone saves against sleep deprivation. */
function checkSleepDeprivation(s: State, ctx: Ctx, before: number): void {
  const start = s.lastLongRestEnd ?? s.trackingStart;
  const prevDays = Math.floor((before - start) / MIN_PER_DAY);
  const days = Math.floor((absNow(s) - start) / MIN_PER_DAY);
  for (let day = prevDays + 1; day <= days; day++) {
    if (day < 1) continue;
    const dc = sleepDeprivationDC(day);
    log(s, `The party has gone ${day * 24} hours without a Long Rest.`, 'warn');
    for (const c of s.characters) {
      if (alive(c)) requestSave(s, ctx, c, 'sleep', dc, 'normal', `sleep deprivation (${day * 24} hours without a Long Rest)`);
    }
  }
}

function expireConditions(s: State): void {
  const now = absNow(s);
  for (const c of s.characters) {
    for (const m of c.madness ?? []) {
      if (m.endsAt != null && now >= m.endsAt) endMadness(s, c, m.id, 'it runs its course');
    }
    if (c.poisonedUntil != null && now >= c.poisonedUntil) {
      c.poisonedUntil = null;
      status(s, c, 'waterIllnessEnds', `${c.name} is no longer Poisoned.`, 'good');
    }
    if (c.stable && c.wakesAt != null && now >= c.wakesAt && c.diedAt == null) {
      c.stable = false;
      c.wakesAt = null;
      c.hp = Math.max(1, c.hp);
      status(s, c, 'wakesFromStable', `${c.name} stirs and regains consciousness with 1 HP.`, 'good');
    }
  }
}

/** Moves the clock forward, firing the hourly and end-of-day checks along the way. */
// ---------------------------------------------------------------- sidekicks (optional rule, Tasha's Cauldron)

/** The adventurers whose levels set a sidekick's: player characters who aren't sidekicks themselves. */
const levelSetters = (s: State): Character[] => s.characters.filter((c) => c.kind === 'pc' && !c.sidekick);

/** Applies one sidekick level: a Hit Die rolled for HP, the class features of that level, and its resources. */
function gainSidekickLevel(s: State, ctx: Ctx, c: Character, quiet = false): string {
  const k = c.sidekick!;
  c.level += 1;
  const roll = die(c.hitDie, ctx.rng);
  const hp = hpForLevel(roll, abilityMod(c.conScore));
  c.maxHp += hp;
  c.hp += hp;
  const feats = featuresAt(k.cls, c.level);
  for (const f of feats) c.features = [...c.features.filter((x) => x !== `${f.name} (level ${c.level})`), `${f.name} (level ${c.level}): ${f.text}`];
  for (const r of sidekickResources(k.cls, c.level)) {
    const have = c.resources.find((x) => x.name === r.name);
    if (have) {
      have.current += Math.max(0, r.max - have.max);
      have.max = r.max;
    } else c.resources.push({ id: uid(), name: r.name, max: r.max, current: r.max, recharge: r.recharge });
  }
  const line = `level ${c.level}: +${hp} HP (d${c.hitDie} ${roll} ${signed(abilityMod(c.conScore))}), proficiency +${proficiencyBonus(c.level)}${feats.length ? `; ${feats.map((f) => f.name).join(', ')}` : ''}`;
  if (!quiet) status(s, c, 'renownUp', `${c.name} has grown with the party and reaches ${SIDEKICK_CLASS_LABEL[k.cls]} ${line} (Tasha's).`, 'good');
  return line;
}

/** Tasha's: whenever the party's average level goes up, each sidekick gains a level. */
function levelSidekicks(s: State, ctx: Ctx): void {
  if (!s.settings.sidekicks) return;
  const target = sidekickLevelFor(levelSetters(s).map((c) => c.level));
  for (const c of s.characters) {
    if (!c.sidekick || !alive(c)) continue;
    let guard = 0;
    while (c.level < target && guard++ < 20) gainSidekickLevel(s, ctx, c);
  }
}

export interface SidekickOpts {
  name: string;
  creature: string;
  cr: string;
  size: Size;
  /** The stat block's Hit Points and Constitution score, and whether it speaks a language. */
  baseHp: number;
  conScore: number;
  passivePerception: number;
  darkvision: number;
  speaks: boolean;
  cls: SidekickClass;
  role: SidekickRole | null;
  /** Table rule: daily pay (0 for a friend who joins for nothing) and who pays it. */
  wageGp: number;
  payerId: string;
}

const crNum = (cr: string): number => {
  const [a, b] = cr.split('/').map(Number);
  return b ? a / b : a;
};

/** Why a creature can't take this sidekick class, or null if it can. */
export function sidekickBlocked(cr: string, cls: SidekickClass, speaks: boolean): string | null {
  if (!(crNum(cr) <= SIDEKICK_MAX_CR)) return `a sidekick's stat block must be CR 1/2 or lower (this is CR ${cr})`;
  if (NEEDS_LANGUAGE[cls] && !speaks) return `the ${SIDEKICK_CLASS_LABEL[cls]} class needs a creature that speaks a language`;
  return null;
}

/** Brings a creature into the party as a sidekick at the party's average level (Tasha's), hired for pay or as a friend. */
export const hireSidekick = act((d, ctx, o: SidekickOpts) => {
  if (!d.settings.sidekicks) return void log(d, 'Sidekicks are switched off in Settings.', 'warn');
  const why = sidekickBlocked(o.cr, o.cls, o.speaks);
  if (why) return void log(d, `${o.name || o.creature} can't join as a sidekick: ${why}.`, 'warn');
  const c = newCharacter({
    name: o.name.trim() || o.creature,
    className: 'Other',
    level: 0,
    species: o.creature,
    subclass: `${SIDEKICK_CLASS_LABEL[o.cls]} sidekick${o.role ? ` (${o.role})` : ''}`,
    size: o.size,
    hitDie: HIT_DIE_BY_SIZE[o.size],
    conScore: o.conScore,
    hp: Math.max(1, o.baseHp),
    maxHp: Math.max(1, o.baseHp),
    passivePerception: o.passivePerception,
    darkvision: o.darkvision,
    gp: 0,
    features: [],
    resources: [],
    tasks: [],
  });
  c.sidekick = { cls: o.cls, role: o.role, creature: o.creature, cr: o.cr, wageGp: Math.max(0, o.wageGp), payerId: o.payerId || 'party', since: absNow(d) };
  const target = sidekickLevelFor(levelSetters(d).map((x) => x.level));
  const lines: string[] = [];
  while (c.level < target) lines.push(gainSidekickLevel(d, ctx, c, true));
  d.characters.push(c);
  const pay = c.sidekick.wageGp > 0 ? ` They're paid ${fmtGp(c.sidekick.wageGp)} a day into their own purse (table rule), and pay their own way from it.` : ' They join as a friend, for a share of the road rather than pay.';
  log(d, `${c.name} (${o.creature}, CR ${o.cr}) joins the party as a ${SIDEKICK_CLASS_LABEL[o.cls]} sidekick at level ${c.level}, the party's average (Tasha's): ${c.maxHp} HP. ${lines.length ? `Levels: ${lines.join('; ')}.` : ''}${pay}`, 'good');
});

/** Gives an existing companion, such as a tamed creature, a sidekick class (Tasha's), at the party's average level. */
export const makeSidekick = act((d, ctx, charId: string, cls: SidekickClass, role: SidekickRole | null, cr: string, speaks: boolean) => {
  const c = charById(d, charId);
  if (!c || c.sidekick || !d.settings.sidekicks) return;
  const why = sidekickBlocked(cr, cls, speaks);
  if (why) return void log(d, `${c.name} can't become a sidekick: ${why}.`, 'warn');
  c.sidekick = { cls, role, creature: c.species || c.name, cr, wageGp: 0, payerId: 'party', since: absNow(d) };
  c.level = 0;
  c.hitDie = HIT_DIE_BY_SIZE[c.size];
  c.subclass = `${SIDEKICK_CLASS_LABEL[cls]} sidekick${role ? ` (${role})` : ''}`;
  const target = sidekickLevelFor(levelSetters(d).map((x) => x.level));
  const lines: string[] = [];
  while (c.level < target) lines.push(gainSidekickLevel(d, ctx, c, true));
  log(d, `${c.name} has earned a place beside the party: a ${SIDEKICK_CLASS_LABEL[cls]} sidekick at level ${c.level} (Tasha's). ${lines.join('; ')}.`, 'good');
});

/** A sidekick leaves the party, taking what they carry. */
export const dismissSidekick = act((d, _ctx, charId: string) => {
  const c = charById(d, charId);
  if (!c?.sidekick) return;
  d.characters = d.characters.filter((x) => x.id !== charId);
  log(d, `${c.name} parts ways with the party${c.sidekick.wageGp ? ', paid up and taking their gear' : ''}.`);
});

/**
 * Table rule: each active porter carries a load of their own (a stash with the party on the Storage tab). A porter
 * who is let go leaves their load behind where they were dismissed, still the party's.
 */
export function syncPorters(s: State): void {
  for (const h of s.hirelings) {
    if (h.role !== 'porter') continue;
    const st = s.stashes.find((x) => x.porterId === h.id);
    if (h.active && !st) s.stashes.push({ id: uid(), name: `${h.name}'s load (porter)`, kind: 'stash', location: 'With the party', capacityLb: PORTER_LB, items: [], purse: emptyPurse(), notes: `Carried by ${h.name}, a hired porter (table rule: up to ${PORTER_LB} lb).`, porterId: h.id });
    else if (h.active && st && st.location !== 'With the party') st.location = 'With the party';
    else if (!h.active && st && st.location === 'With the party') st.location = s.place.name || 'Where the porter was let go';
  }
}

export function advanceMut(s: State, ctx: Ctx, minutes: number, activity: Activity, opts: { exploring?: boolean } = {}): void {
  syncPorters(s);
  levelSidekicks(s, ctx);
  let remaining = Math.max(0, Math.round(minutes));
  if (remaining > 0 && s.settings.deathSavesResolve) resolveDying(s, ctx);
  while (remaining > 0) {
    const toNextHour = 60 - (s.minutes % 60);
    const step = Math.min(remaining, toNextHour);
    const before = absNow(s);
    s.minutes += step;
    remaining -= step;
    expireConditions(s);
    if (s.lastLongRestEnd != null) {
      const ready = s.lastLongRestEnd + LONG_REST_COOLDOWN;
      if (before < ready && absNow(s) >= ready) log(s, 'A Long Rest is possible again: 24 hours have passed since the last one began.', 'good');
    }
    if (s.settings.sleepDeprivation && activity !== 'rest') checkSleepDeprivation(s, ctx, before);
    const dawn = s.dayIndex * MIN_PER_DAY + sunriseMinutes(seasonOf(s));
    if (before < dawn && absNow(s) >= dawn) atDawn(s, ctx);
    checkItemsLeftBehind(s);
    tickEffects(s, before);
    deliverDispatches(s);
    deliverLetters(s, ctx);
    deliverNews(s);
    tickContagions(s);
    tickPoisons(s, ctx);
    if (s.minutes % 60 === 0) tickHour(s, ctx, activity);
    if (s.minutes >= MIN_PER_DAY) endOfDay(s, ctx);
    if (s.settings.encounters && activity !== 'work' && !opts.exploring) overlandEncounterClock(s, ctx, step, activity);
  }
}

/** Sets every tiered rule switch to match a level of detail (Light, Standard, Gritty or Hardcore). */
export const setDetailTier = act((d, _ctx, tier: TierId) => {
  applyTier(d.settings, tier);
  log(d, `Level of detail set to ${tierName(tier)}: ${TIERS.find((t) => t.id === tier)!.tagline}`);
});

export const advance = act((d, ctx, minutes: number, activity: Activity = 'camp') => advanceMut(d, ctx, minutes, activity));

/** Advances to the next time the clock reads hh:mm. */
export const advanceTo = act((d, ctx, targetMinutes: number, activity: Activity = 'camp') => {
  let delta = (targetMinutes - d.minutes + MIN_PER_DAY) % MIN_PER_DAY;
  if (delta === 0) delta = MIN_PER_DAY;
  advanceMut(d, ctx, delta, activity);
});

// ---------------------------------------------------------------- rests

/**
 * Only one Long Rest per 24 hours. A Long Rest lasts 8 hours, so the next one may start
 * 16 hours after the last one ended (24 hours after it started).
 */
export const LONG_REST_COOLDOWN = 16 * 60;
/** Table rule: Con save after a cold night spent without warm cover. */
export const COLD_NIGHT_DC = 10;

/** Minutes the party has been awake: since the last Long Rest ended, or since tracking began. */
export function minutesAwake(s: State): number {
  return absNow(s) - (s.lastLongRestEnd ?? s.trackingStart);
}

/** DC of the next sleep deprivation save: 10 for the first 24 hours, +5 for each further 24 hours. */
export const sleepDeprivationDC = (day: number): number => 10 + 5 * (day - 1);

/** Minutes until the next sleep deprivation save, and its DC. */
export function nextSleepCheck(s: State): { inMinutes: number; dc: number } {
  const awake = minutesAwake(s);
  const day = Math.floor(awake / MIN_PER_DAY) + 1;
  return { inMinutes: day * MIN_PER_DAY - awake, dc: sleepDeprivationDC(day) };
}

/** Minutes since the last Long Rest ended, or null if none has been tracked yet. */
export function minutesSinceLongRest(s: State): number | null {
  return s.lastLongRestEnd == null ? null : absNow(s) - s.lastLongRestEnd;
}

/** Minutes until a Long Rest may start. 0 means you can rest now. */
export function minutesUntilLongRest(s: State): number {
  const since = minutesSinceLongRest(s);
  return since == null ? 0 : Math.max(0, LONG_REST_COOLDOWN - since);
}

export function canLongRest(s: State): { ok: boolean; reason?: string } {
  const wait = minutesUntilLongRest(s);
  if (wait > 0) return { ok: false, reason: `Only one Long Rest per 24 hours. Available in ${formatDuration(wait)}.` };
  return { ok: true };
}

export const shortRest = act((d, ctx) => {
  log(d, 'The party takes a Short Rest (1 hour). Everyone can spend Hit Point Dice.', 'info');
  advanceMut(d, ctx, 60, 'rest');
  finishShortRest(d, ctx);
  for (const c of d.characters) {
    if (c.chef && alive(c)) {
      const pb = proficiencyBonus(c.level);
      log(d, `${c.name}'s Chef cooking: up to ${4 + pb} creatures who spend Hit Point Dice this rest regain an extra 1d8 HP.`, 'good');
    }
  }
});

export const longRest = act((d, ctx, force = false) => {
  if (regionForbidsRest(d)) return void log(d, 'The region won’t allow rest right now (Infested: a swarming migration).', 'warn');
  const check = canLongRest(d);
  if (!check.ok && !force) {
    log(d, check.reason ?? 'Cannot Long Rest yet.', 'warn');
    return;
  }
  log(d, 'The party settles in for a Long Rest (8 hours: at least 6 asleep, no more than 2 of light activity).');
  const outside = tentShortfall(d);
  if (outside.length) noticed(d, 'coldNight', outside, `Not enough tent space (a Tent sleeps two): ${outside.map((c) => c.name).join(', ')} sleep${outside.length > 1 ? '' : 's'} in the open tonight.`, 'warn');
  clearAppraiseTries(d);
  laborersMakeCamp(d, ctx);
  const watched = standWatches(d, ctx);
  d.restStart = absNow(d);
  advanceMut(d, ctx, 8 * 60, 'rest');
  d.restStart = null;
  completeLongRest(d, ctx, watched);
});

/** Table rule: hired laborers at a wild camp gather firewood and dig a sheltered fire pit before the party beds down. */
function laborersMakeCamp(d: State, ctx: Ctx): void {
  if (d.place.settlement || d.place.shelter === 'building') return;
  const now = absNow(d);
  const crew = d.hirelings.filter((h) => h.active && h.role === 'laborer' && !(h.busyUntil && h.busyUntil > now));
  if (!crew.length) return;
  let fuel = 0;
  for (let i = 0; i < crew.length; i++) fuel += rollExpr(LABORER_FUEL_DICE, ctx.rng) ?? 5;
  d.fire.fuelHours += fuel;
  const pit = !d.fire.sheltered && !CLIMATES[d.weather.climate].noWeather;
  if (pit) {
    d.fire.sheltered = true;
    d.place.dug = [...(d.place.dug ?? []).filter((x) => x !== DIG_LABEL.firePit.label), DIG_LABEL.firePit.label];
  }
  log(d, `${crew.map((h) => h.name).join(', ')} make${crew.length > 1 ? '' : 's'} camp: ${fuel} hours of firewood stacked${pit ? ' and a sheltered fire pit dug' : ''} (table rule: laborers' work).`, 'good');
}

/** Everything that happens when a Long Rest finishes. */
function completeLongRest(d: State, ctx: Ctx, watched: Record<string, number>): void {
  injuryRestDay(d, d.travel.hoursToday === 0);
  d.lastLongRestEnd = absNow(d);
  d.travel.gallopUsed = false;
  d.travel.hoursToday = 0;
  d.travel.milesToday = 0;
  for (const c of d.characters) {
    if (!alive(c)) continue;
    const onWatch = watched[c.id] ?? 0;
    if (onWatch > maxWatchMinutes(c.trance)) {
      log(d, `${c.name} spent ${formatDuration(onWatch)} on watch, more than the ${formatDuration(maxWatchMinutes(c.trance))} a Long Rest allows, so they get no Long Rest benefits.`, 'warn');
      continue;
    }
    const armorSpoiled = d.settings.sleepInArmorPenalty && wearsBulkyArmor(c);
    if (armorSpoiled) {
      log(d, `${c.name} slept in ${c.armorKind} armor: only a quarter of spent Hit Point Dice come back, and no Exhaustion is removed (optional rule).`, 'warn');
    } else if (c.armorKind !== 'none' && !c.armorWorn) {
      log(d, `${c.name} wakes with their armor off. Putting it on takes ${armorTime(c, 'don')} min.`);
    }
    const restless = sewerWeakened(c);
    if (restless) status(d, c, 'contagionWorse', `${c.name} has Sewer Plague: this Long Rest restores no HP and removes no Exhaustion.`, 'warn');
    const brokenNight = !!c.restless;
    if (brokenNight) {
      c.restless = false;
      if (c.exhaustion > 0) status(d, c, 'exhaustionStuck', `${c.name} slept badly, woken again and again, and wakes no less tired: no Exhaustion removed this time (table rule).`, 'warn');
    }
    if (c.exhaustion > 0 && !armorSpoiled && !restless && !brokenNight) {
      const gone = recoverExhaustion(c);
      if (gone) {
        status(d, c, 'exhaustionEases', `${c.name} recovers 1 Exhaustion level (${EXHAUSTION_CAUSE_LABEL[gone]}). Now level ${c.exhaustion}.`, 'good');
      } else {
        const why = [c.malnourished && 'Malnutrition (needs a full day of food)', c.dehydrated && 'Dehydration (needs a full day of water)'].filter(Boolean).join(' and ');
        status(d, c, 'exhaustionStuck', `${c.name} can't shed Exhaustion yet: every level left comes from ${why}.`, 'warn');
      }
    }
    if (c.sick) {
      c.sick = false;
      c.sickFrom = '';
      status(d, c, 'foodPoisoningEnds', `${c.name} sleeps off the sickness and is no longer Poisoned.`, 'good');
    }
    for (const t of c.tasks) if (t.daily) t.done = false;
    c.divinationCasts = {};
    if (d.settings.stressPerLongRest > 0 && c.stress > 0) {
      const before = c.stress;
      c.stress = Math.max(0, c.stress - d.settings.stressPerLongRest);
      status(d, c, 'stressDown', `${c.name}'s Stress eases from ${before} to ${c.stress}.`, 'good');
    }
    if (d.settings.fearPerLongRest > 0 && c.fear > 0) {
      const before = c.fear;
      c.fear = Math.max(0, c.fear - d.settings.fearPerLongRest);
      status(d, c, 'fearDown', `${c.name}'s Fear eases from ${before} to ${c.fear}.`, 'good');
    }
    applyRestFocus(d, c);
    if (c.hp <= 0) {
      log(d, `${c.name} started the rest at 0 HP, so it doesn't restore HP or Hit Point Dice.`, 'warn');
    } else if (restless) {
      const regained = c.hitDiceSpent;
      c.hitDiceSpent = Math.max(0, c.hitDiceSpent - regained);
    } else {
      c.hp = c.maxHp;
      c.tempHp = 0;
      const regained = armorSpoiled ? Math.max(1, Math.floor(c.level / 4)) : c.hitDiceSpent;
      c.hitDiceSpent = Math.max(0, c.hitDiceSpent - regained);
    }
    if (c.revivalPenalty) {
      c.revivalPenalty -= 1;
      log(d, c.revivalPenalty ? `${c.name}'s return from death weighs less: −${c.revivalPenalty} to D20 Tests.` : `${c.name} has fully recovered from returning to life.`, 'good');
    }
    cackleSaveAfterRest(d, ctx, c);
    const got = restoreAfterRest(d, ctx, c, 'long');
    if (got.length) log(d, `${c.name} recovers: ${got.join(', ')}.`, 'good');
    if (isCaster(c.className)) {
      const rule = PREP_RULE[c.className];
      c.prepOpen = rule === 'longRestAll';
      c.swapsLeft = rule === 'longRestOne' ? 1 : 0;
    }
    if (c.chef) {
      c.treats = proficiencyBonus(c.level);
      log(d, `${c.name} bakes ${c.treats} Chef treats. Eating one is a Bonus Action and grants Temporary HP equal to their Proficiency Bonus.`, 'good');
    }
  }
  log(d, 'Long Rest complete: HP and all spent Hit Point Dice are restored, and morning tasks reset.', 'good');
  bastionLongRest(d);
  syncLevelRenown(d);
  // A cold night is judged on waking, after the rest's normal recovery.
  for (const c of d.characters) {
    if (c.nightChill != null && alive(c)) {
      requestSave(d, ctx, c, 'chill', COLD_NIGHT_DC, 'normal', `a cold night (down to ${c.nightChill}°F) without a bedroll or blanket`);
    }
    c.nightChill = null;
  }
}

// ---------------------------------------------------------------- interrupting rests and waking up

export type InterruptReason = 'combat' | 'spell' | 'damage' | 'exertion' | 'disturbance';

export const INTERRUPT_LABEL: Record<InterruptReason, string> = {
  combat: 'Combat (roll Initiative)',
  spell: 'Someone casts a spell other than a cantrip',
  damage: 'Someone takes damage',
  exertion: '1 hour of walking or other exertion',
  disturbance: 'A noise or disturbance, no fighting (back to sleep)',
};

export interface InterruptOpts {
  kind: 'long' | 'short';
  /** Minutes rested before the interruption. */
  after: number;
  reason: InterruptReason;
  /** How loud it is: loud wakes everyone, quiet is a passive Perception check for sleepers. */
  noise: 'loud' | 'quiet';
  /** DC for sleepers to notice a quiet threat (e.g. the intruder's Stealth). */
  dc: number;
  /** Resume the Long Rest afterwards (1 extra hour per interruption). */
  resume: boolean;
}

/** Who is awake when a rest is interrupted: the watch, anyone the noise wakes, and the rest get shaken awake. */
function wakeTheCamp(d: State, minutesIn: number, noise: 'loud' | 'quiet', dc: number): void {
  if (noise === 'quiet' && d.place.alarm === true) {
    noticed(d, 'wokenByNoise', [], 'The Bell on the alarm line jangles: something has crossed it (table rule).', 'warn');
    noise = 'loud';
  } else if (noise === 'quiet' && d.place.alarm === 'pots') {
    if (dc < POT_ALARM_DC) {
      noticed(d, 'wokenByNoise', [], 'Pots clatter on the alarm line: something has stumbled into it (table rule).', 'warn');
      noise = 'loud';
    } else log(d, `Whatever it is steps over the line of pots without a sound (Stealth DC ${dc} against ${POT_ALARM_DC}, table rule).`);
  }
  const len = watchMinutes(d.watchPlan.count);
  const slot = Math.min(d.watchPlan.count - 1, Math.floor(minutesIn / len));
  const onWatch = new Set(d.watchPlan.slots[slot] ?? []);
  const sleepers = d.characters.filter((c) => alive(c) && c.kind !== 'mount' && !c.dying && !c.stable && !onWatch.has(c.id));
  const watchers = d.characters.filter((c) => onWatch.has(c.id));
  const watchHirelings = d.hirelings.filter((h) => onWatch.has(`h:${h.id}`)).map((h) => h.name);
  const awake = [...watchers.map((c) => c.name), ...watchHirelings];
  if (awake.length) log(d, `On watch and awake: ${awake.join(', ')}.`);
  const stillAsleep: Character[] = [];
  for (const c of sleepers) {
    const passive = c.passivePerception - 5;
    if (noise === 'loud') status(d, c, 'wokenByNoise', `${c.name} wakes at the commotion.`);
    else if (passive >= dc) status(d, c, 'wokenByNoise', `${c.name} stirs awake (passive Perception ${passive} while asleep, against DC ${dc}).`);
    else stillAsleep.push(c);
  }
  for (const c of stillAsleep) {
    if (awake.length || sleepers.length > stillAsleep.length) status(d, c, 'shakenAwake', `${c.name} sleeps through it (passive Perception ${c.passivePerception - 5} while asleep, against DC ${dc}) until someone uses an action to shake them awake.`);
    else status(d, c, 'sleepsThrough', `${c.name} sleeps on, unaware (passive Perception ${c.passivePerception - 5} while asleep, against DC ${dc}). Nobody is awake to raise the alarm.`, 'warn');
  }
  const down = d.characters.filter((c) => c.dying || c.stable);
  if (down.length) log(d, `${down.map((c) => c.name).join(', ')} ${down.length > 1 ? 'are' : 'is'} unconscious from wounds and can't be shaken awake.`, 'warn');
}

/** A rest that gets interrupted partway, using the 2024 rules for what still counts. */
export const interruptedRest = act((d, ctx, o: InterruptOpts) => {
  if (o.kind === 'long') {
    const check = canLongRest(d);
    if (!check.ok) {
      log(d, check.reason ?? 'Cannot Long Rest yet.', 'warn');
      return;
    }
  }
  const total = o.kind === 'long' ? 8 * 60 : 60;
  const after = Math.max(0, Math.min(total - 1, Math.round(o.after)));
  log(d, `The party settles in for a ${o.kind === 'long' ? 'Long' : 'Short'} Rest.`);
  const watched = o.kind === 'long' ? standWatches(d, ctx) : {};
  if (o.kind === 'long') d.restStart = absNow(d);
  // The interruption is the encounter, so no automatic checks while it plays out.
  const auto = d.settings.encounters;
  d.settings.encounters = false;
  advanceMut(d, ctx, after, 'rest');
  d.settings.encounters = auto;
  d.restStart = null;
  log(d, `${formatDuration(Math.max(1, after))} in, the rest is interrupted: ${INTERRUPT_LABEL[o.reason]}.`, 'warn');
  if (o.kind === 'long') wakeTheCamp(d, after, o.reason === 'disturbance' ? o.noise : 'loud', o.dc);
  if (o.reason === 'exertion') advanceMut(d, ctx, 60, 'camp');
  if (o.reason === 'disturbance') {
    log(d, 'Nothing comes of it, and the party settles back down. A disturbance like this doesn’t break the rest.');
    advanceMut(d, ctx, total - after, 'rest');
    if (o.kind === 'long') completeLongRest(d, ctx, watched);
    else finishShortRest(d, ctx);
    return;
  }
  const all = d.characters.filter((c) => alive(c));
  for (const c of all) status(d, c, 'restInterrupted', `${c.name}'s ${o.kind === 'long' ? 'Long' : 'Short'} Rest is interrupted.`, 'warn');
  if (o.kind === 'short') {
    log(d, 'An interrupted Short Rest gives no benefits.', 'warn');
    return;
  }
  if (o.resume) {
    const left = total - after + 60;
    log(d, `Once things settle, the party resumes the Long Rest. It needs ${formatDuration(left)} more (1 extra hour for the interruption).`);
    advanceMut(d, ctx, left, 'rest');
    completeLongRest(d, ctx, watched);
    return;
  }
  if (after >= 60) {
    log(d, 'The Long Rest is abandoned, but the party had rested at least 1 hour, so they get the benefits of a Short Rest.', 'warn');
    finishShortRest(d, ctx);
  } else {
    log(d, 'The Long Rest is abandoned less than an hour in, so it gives no benefits.', 'warn');
  }
});

/** Short Rest benefits: resources, rest focus (attuning, identifying), Chef. Requires at least 1 HP. */
function finishShortRest(d: State, ctx: Ctx): void {
  d.travel.gallopUsed = false;
  clearAppraiseTries(d);
  for (const c of d.characters) {
    if (!alive(c)) continue;
    if (c.hp <= 0) {
      log(d, `${c.name} is at 0 HP, so they get no Short Rest benefits.`, 'warn');
      continue;
    }
    applyRestFocus(d, c);
    const got = restoreAfterRest(d, ctx, c, 'short');
    if (got.length) log(d, `${c.name} recovers: ${got.join(', ')}.`, 'good');
    // Ranger Tireless (level 10): a Short Rest removes 1 Exhaustion level.
    if (c.className === 'Ranger' && c.level >= 10 && c.exhaustion > 0) {
      const gone = recoverExhaustion(c);
      if (gone) status(d, c, 'exhaustionEases', `${c.name}'s Tireless feature removes 1 Exhaustion level (${EXHAUSTION_CAUSE_LABEL[gone]}).`, 'good');
    }
  }
}

// ---------------------------------------------------------------- travel

export interface TravelOpts {
  hours: number;
  pace: Pace;
  difficult: boolean;
  foragerIds: string[];
  /** Who finds the way when the party leaves the road. */
  navigatorId?: string | null;
  /** Mounted party gallops: double distance for the first hour. */
  gallop?: boolean;
  /** Sailing or flying aboard a vessel from the Storage tab: its speed, no pace, no forced march. */
  vesselId?: string | null;
  /** Everyone flies (or ignores Difficult Terrain): Fast pace allowed whatever the terrain (2024 DMG). */
  flying?: boolean;
  /** Sailing into a strong wind (half speed), or downstream on a river (+3 mph for keelboats and rowboats). */
  againstWind?: boolean;
  downstream?: boolean;
  /** Journey stages only: who charts an uncharted stage on the way (table rule). */
  mapperId?: string | null;
}

/** Table rule: Unconscious companions who must be carried because there aren't enough spare mounts for them. */
export function carriedDowned(s: State): string[] {
  if (!s.settings.carryDowned) return [];
  const down = s.characters.filter((c) => c.kind !== 'mount' && c.diedAt == null && (c.dying || c.stable));
  if (!down.length) return [];
  const up = (c: Character) => alive(c) && !c.dying && !c.stable;
  const spare = s.characters.filter((c) => c.kind === 'mount' && up(c)).length - s.characters.filter((c) => c.kind !== 'mount' && up(c)).length;
  return spare >= down.length ? [] : down.map((c) => c.name);
}

/** The chosen navigator if they can act; otherwise (table rule) whoever conscious has the best Survival. */
function activeNavigator(s: State, navId: string | null | undefined): Character | undefined {
  const chosen = navId ? actorById(s, navId) : undefined;
  if (chosen && alive(chosen) && !chosen.dying && !chosen.stable) return chosen;
  if (!s.settings.fallbackNavigator) return undefined;
  const best = s.characters
    .filter((c) => c.kind === 'pc' && alive(c) && !c.dying && !c.stable)
    .sort((a, b) => b.survival - 2 * b.exhaustion - (a.survival - 2 * a.exhaustion))[0];
  if (best && currentNavigationDC(s).dc != null) {
    log(s, `${chosen ? `${chosen.name} can't navigate, so` : 'Nobody is set to navigate, so'} ${best.name} (best Survival) finds the way (table rule).`);
  }
  return best;
}

/**
 * Table rule: someone in the party can't see where they're going: Darkness (night without a full moon, or underground),
 * no lit Torch, Lamp, Lantern or light spell (a Candle is too small), and no Darkvision or Devil's Sight.
 * Carrying an unlit torch doesn't count: light one on the Effects & Ailments tab, and it burns down as you go.
 */
function travelsBlind(s: State): boolean {
  if (!s.settings.nightTravelSlow) return false;
  const walkers = s.characters.filter((c) => c.kind !== 'mount' && alive(c) && !c.dying && !c.stable);
  return walkers.some((c) => sightNow(s, c, 'travel').blind);
}

/** Travelers slowed to half Speed or less, which forces a Slow pace (2024 DMG "Slower Travelers"). */
export function slowTravelers(s: State): string[] {
  return s.characters
    .filter((c) => alive(c) && !c.dying && !c.stable)
    .filter((c) => {
      const base = c.speed || 30;
      const lvl = carriedLoad(s, c).level;
      const loadPenalty = lvl === 'over' ? base : lvl === 'heavy' && c.kind !== 'mount' ? 20 : 0;
      const exhaustion = 5 * c.exhaustion;
      return base - loadPenalty - exhaustion <= base / 2;
    })
    .map((c) => c.name);
}

/** Speed of a vessel today: no sail in a dead calm, half into a strong wind, plus the current downstream. */
export function vesselSpeed(s: State, v: Stash, o: { againstWind?: boolean; downstream?: boolean }): { mph: number; note: string } {
  const base = v.speedMph ?? 1;
  const name = v.name.toLowerCase();
  const oared = /keelboat|rowboat|galley|longship/.test(name);
  const magic = /airship/.test(name);
  if (!magic && s.weather.wind === 'none' && !oared) return { mph: 0, note: 'Dead calm: a ship that relies on sails can’t move and must be rowed or towed' };
  let mph = base;
  const notes: string[] = [];
  if (!magic && s.weather.wind === 'none') notes.push('dead calm, so the crew rows');
  if (o.againstWind && s.weather.wind === 'strong' && !magic) {
    mph /= 2;
    notes.push('half speed into a strong wind');
  }
  if (o.downstream && /keelboat|rowboat/.test(name)) {
    mph += 3;
    notes.push('+3 mph with the current');
  }
  if (s.settings.gearWear && v.hullDamaged) {
    mph *= DAMAGED_HULL_SPEED;
    notes.push('half speed with a damaged hull (table rule)');
  }
  return { mph: Math.round(mph * 10) / 10, note: notes.join('; ') };
}

/** The navigation DC right now, or null when following a road, river or coast. */
export function currentNavigationDC(s: State): { dc: number | null; reasons: string[] } {
  if (!s.settings.navigation) return { dc: null, reasons: ['getting lost is switched off'] };
  const dark = lightAt(s.minutes % MIN_PER_DAY, seasonOf(s)).phase === 'Night' || !!CLIMATES[s.weather.climate].noWeather;
  return navigationDC(s.place.onRoute ? null : TERRAIN[s.place.terrain].navigationDC, { heavyPrecip: s.weather.precip === 'heavy', dark, poorVisibilityRule: s.settings.poorVisibilityNav });
}

/** The navigator's Wisdom (Survival) check. Slow pace gives Advantage, Fast pace Disadvantage. */
function navigate(s: State, ctx: Ctx, nav: Character, pace: Pace): boolean | null {
  const { dc, reasons } = currentNavigationDC(s);
  if (dc == null) return null;
  // Advantage needs proficiency with the tools and in Survival (taken as given when the sheet doesn't record them).
  const tools = !!s.travel.navTools && nav.inventory.some((i) => NAVIGATOR.test(i.name)) && proficientWith(nav, "Navigator's Tools") !== false && hasSkill(nav, 'Survival') !== false;
  const map = mapHereName(s);
  let mode = combineModes(combineModes(pace === 'slow' ? 'advantage' : 'normal', pace === 'fast' ? 'disadvantage' : 'normal'), s.travel.reconAdvantage ? 'advantage' : 'normal');
  // 2024 PHB: proficiency in a skill and a tool that both apply gives Advantage. An accurate Map of the place gives +5.
  if (tools) mode = combineModes(mode, 'advantage');
  const r = d20(mode, ctx.rng);
  const mod = nav.survival - 2 * nav.exhaustion + (map ? MAP_BONUS : 0);
  const ok = r.value + mod >= dc;
  const aids = [...(tools ? ["with Navigator's Tools"] : []), ...(map ? [`using the ${map}`] : [])];
  log(s, `${nav.name} navigates${aids.length ? ` ${aids.join(' and ')}` : ''}: Wisdom (Survival) ${r.rolls.join('/')} ${signed(mod)} = ${r.value + mod} against DC ${dc} (${reasons.join(', ')}). ${ok ? 'On course.' : 'The party strays off course without realising it.'}`, ok ? 'good' : 'warn');
  return ok;
}

export const travel = act((d, ctx, o: TravelOpts) => travelMut(d, ctx, o));

function travelMut(d: State, ctx: Ctx, o: TravelOpts): number {
  breakCamp(d, ctx);
  if (d.townMode === 'downtime') setTownModeMut(d, 'active', 'Downtime is over. ');
  for (const c of d.characters) if (c.lodging) c.lodging = null;
  const vessel = o.vesselId ? d.stashes.find((x) => x.id === o.vesselId && x.speedMph) : undefined;
  if (vessel) return sail(d, ctx, vessel, o);
  if (o.flying && o.difficult) o = { ...o, difficult: false };
  const ground = groundDifficulty(d.place.ground, d.place.goodRoad);
  if (ground && !o.flying && !o.difficult) {
    log(d, `With ${ground} underfoot, the going counts as Difficult Terrain (half speed).`, 'warn');
    o = { ...o, difficult: true };
  }
  const carried = carriedDowned(d);
  if (carried.length && o.pace !== 'slow') {
    log(d, `The party carries ${carried.join(' and ')}, Unconscious, with no spare mount to bear them, so it travels at a Slow pace (table rule).`, 'warn');
    o = { ...o, pace: 'slow' };
  }
  const slow = slowTravelers(d);
  const allowed = slow.length ? 'slow' : o.flying ? o.pace : clampPace(o.pace, d.place.terrain, d.place.goodRoad || !!d.travel.paceBoost);
  if (slow.length && o.pace !== 'slow') {
    log(d, `${slow.join(', ')} ${slow.length > 1 ? 'are' : 'is'} down to half Speed or less (load or Exhaustion), so the party must travel at a Slow pace.`, 'warn');
    o = { ...o, pace: 'slow' };
  } else if (allowed !== o.pace) {
    log(d, `${TERRAIN[d.place.terrain].label} terrain${d.place.goodRoad ? ', even with a good road,' : ''} only allows a ${allowed} pace.`, 'warn');
    o = { ...o, pace: allowed };
  }
  d.travel.pace = o.pace;
  if (d.fire.lit) {
    d.fire.lit = false;
    log(d, 'The party puts out the campfire and breaks camp.');
  }
  const p = PACES[o.pace];
  const altitude = d.place.altitudeFt >= 10000;
  let miles = 0;
  let offCourse = 0;
  log(d, `The party sets out at a ${o.pace} pace for ${o.hours} hour(s)${o.difficult ? ' over Difficult Terrain' : ''}. ${p.note}.`);
  const navId = o.navigatorId === undefined ? d.travel.navigatorId : o.navigatorId;
  d.travel.navigatorId = navId ?? null;
  d.travel.foragerIds = o.foragerIds.filter((id) => charById(d, id));
  const nav = activeNavigator(d, navId);
  if (nav && !d.travel.lost && navigate(d, ctx, nav, o.pace) === false) {
    d.travel.lost = true;
    d.travel.lostRecheckIn = die(LOST_RECHECK_DIE, ctx.rng);
  }
  const mounts = d.characters.filter((c) => c.kind === 'mount' && alive(c)).length;
  const riders = d.characters.filter((c) => c.kind !== 'mount' && alive(c)).length;
  let gallop = !!o.gallop;
  const bareback = d.characters.filter((m) => m.kind === 'mount' && alive(m) && isBareback(m));
  if (gallop && bareback.length) {
    log(d, `${bareback.map((m) => m.name).join(', ')} ${bareback.length > 1 ? 'have' : 'has'} no saddle, so the party can't gallop (table rule).`, 'warn');
    gallop = false;
  }
  if (gallop && (mounts < riders || d.travel.gallopUsed)) {
    log(d, mounts < riders ? 'Not everyone has a mount, so the party can’t gallop.' : 'The mounts need a Short or Long Rest before they can gallop again.', 'warn');
    gallop = false;
  }
  let darkWarned = false;
  for (let i = 0; i < o.hours; i++) {
    const blind = o.pace !== 'slow' && travelsBlind(d);
    if (blind && !darkWarned) {
      darkWarned = true;
      log(d, 'Darkness falls and not everyone can see in it. With no lit Torch, Lantern or light spell (light one on the Effects & Ailments tab), the party picks its way forward at a Slow pace (table rule).', 'warn');
    }
    advanceMut(d, ctx, 60, 'travel');
    d.travel.hoursToday += altitude ? 2 : 1;
    const burst = gallop && i === 0 ? 2 : 1;
    if (burst === 2) {
      d.travel.gallopUsed = true;
      log(d, 'The mounts gallop for an hour, covering twice the distance.');
    }
    const step = (blind ? PACES.slow.mph : p.mph) * (o.difficult ? 0.5 : 1) * burst;
    miles += step;
    if (d.travel.lost) {
      offCourse += step;
      d.travel.lostRecheckIn -= 1;
      if (d.travel.lostRecheckIn <= 0 && nav) {
        if (navigate(d, ctx, nav, o.pace) !== false) {
          d.travel.lost = false;
          log(d, `${nav.name} realises the party has gone astray and finds the way again, ${+(d.travel.milesOffCourse + offCourse).toFixed(1)} miles off course.`, 'good');
          d.travel.milesOffCourse = 0;
          offCourse = 0;
        } else d.travel.lostRecheckIn = die(LOST_RECHECK_DIE, ctx.rng);
      }
    }
    if (d.settings.forcedMarch && d.travel.hoursToday > 8) {
      const dc = 10 + (d.travel.hoursToday - 8);
      for (const c of d.characters) {
        if (alive(c)) requestSave(d, ctx, c, 'march', dc, 'normal', `a forced march (hour ${d.travel.hoursToday})`);
      }
    }
  }
  d.travel.milesToday += miles;
  if (d.travel.lost) d.travel.milesOffCourse += offCourse;
  if (offCourse > 0 && d.travel.lost) log(d, `${+offCourse.toFixed(1)} of those miles went the wrong way. The party is still lost.`, 'warn');
  wearFromTravel(d, o.hours, false);
  log(d, `Covered ${+miles.toFixed(1)} miles. That makes ${+d.travel.milesToday.toFixed(1)} miles and ${d.travel.hoursToday} travel hour(s) since the last Long Rest.`);
  workOnTheMarch(d, ctx, o.hours, d.travel.navigatorId, o.foragerIds, o.pace);
  // One foraging roll per 8 hours on the road, with a shorter leg finding a share of a day's food.
  for (const id of o.foragerIds) {
    const c = charById(d, id);
    if (c) for (let h = o.hours; h > 0; h -= 8) doForage(d, ctx, c, o.pace, Math.min(8, h) / 8);
  }
  return d.travel.lost ? 0 : miles;
}

/** Table rule: the check to hold a ship's course through a storm. */
export const STORM_AT_SEA_DC = 15;

/** Travel aboard a vessel: its own speed, no travel pace, and no forced march (the crew works in shifts). */
function sail(d: State, ctx: Ctx, v: Stash, o: TravelOpts): number {
  const { mph, note } = vesselSpeed(d, v, o);
  if (mph <= 0) {
    log(d, `The ${v.name} goes nowhere: ${note}.`, 'warn');
    return 0;
  }
  log(d, `Aboard the ${v.name}, the party travels for ${o.hours} hour(s) at ${mph} mph${note ? ` (${note})` : ''}.`);
  advanceMut(d, ctx, o.hours * 60, 'camp');
  let miles = Math.round(mph * o.hours * 10) / 10;
  if (d.settings.stormsAtSea && d.weather.wind === 'strong' && d.weather.precip === 'heavy' && !/airship/i.test(v.name)) {
    const helm = activeNavigator(d, d.travel.navigatorId);
    const r = d20('normal', ctx.rng);
    // Table rule: a trained crew helps hold her: +2 for each hired sailor, up to +10.
    const crew = Math.min(SAILOR_MAX, SAILOR_BONUS * d.hirelings.filter((h) => h.active && h.role === 'sailor').length);
    const total = r.value + (helm ? helm.survival - 2 * helm.exhaustion : 0) + crew;
    if (total >= STORM_AT_SEA_DC) {
      log(d, `A storm lashes the ${v.name}. ${helm?.name ?? 'The crew'} keeps her on course: Wisdom (Survival) ${total} against DC ${STORM_AT_SEA_DC}${crew ? ` (+${crew} from the hired sailors)` : ''}.`, 'good');
    } else {
      miles = Math.round(miles * 5) / 10;
      log(d, `A storm lashes the ${v.name} and drives her off course: Wisdom (Survival) ${total} against DC ${STORM_AT_SEA_DC}. Only half the distance counts (table rule).`, 'warn');
    }
  }
  d.travel.milesToday += miles;
  log(d, `The ${v.name} covers ${miles} miles.`);
  wearFromTravel(d, o.hours, true);
  hullWear(d, v, o.hours, d.weather.wind === 'strong' && d.weather.precip === 'heavy');
  return miles;
}

/** Search or track: Wisdom (Perception) or Wisdom (Survival) against the terrain's search DC. */
export const searchCheck = act((d, ctx, charId: string, what: 'search' | 'track', bonus: number) => {
  const c = actorById(d, charId);
  if (!c) return;
  const dc = TERRAIN[d.place.terrain].searchDC;
  // 2024 PHB: in Darkness without Darkvision you're Blinded and fail checks that need sight. Dim Light, heavy rain
  // or snow and a sandstorm give Disadvantage on Wisdom (Perception), but not on Survival.
  const sight = sightNow(d, c, 'explore');
  const doing = what === 'track' ? 'looks for tracks' : 'searches';
  if (sight.blind) return void log(d, `${c.name} ${doing}, but in the dark without a light or Darkvision there is nothing to see: the check fails (${sight.note}).`, 'warn');
  const mode = what === 'search' ? sight.mode : 'normal';
  const r = d20(mode, ctx.rng);
  const total = r.value + bonus - 2 * c.exhaustion;
  const hindered = mode === 'disadvantage' ? `, Disadvantage: ${sight.note}` : '';
  log(d, `${c.name} ${doing}: ${what === 'track' ? 'Wisdom (Survival)' : 'Wisdom (Perception)'} ${r.rolls.join('/')} ${signed(bonus - 2 * c.exhaustion)} = ${total} against DC ${dc} (${TERRAIN[d.place.terrain].label}${hindered}). ${total >= dc ? 'Found!' : 'Nothing.'}`, total >= dc ? 'good' : 'warn');
  if (total < dc) return;
  // Table rules: a fresh trail leads to game, and a sharp-eyed search turns up something nobody hid on purpose.
  if (what === 'track') {
    d.travel.reconAdvantage = true;
    log(d, `${c.name} reads the trail: where the animals water, feed and bed down. Advantage on the next foraging check (table rule).`, 'good');
  }
  const me = charById(d, charId);
  if (what === 'search' && me && isExceptional(r.value, total, dc)) grantFind(d, ctx, me, 'search');
});

/** Runs a planned journey stage day by day: travel up to 8 hours, then (optionally) eat, drink and Long Rest overnight. */
export const runStage = act((d, ctx, stageId: string, o: Omit<TravelOpts, 'hours' | 'difficult'>, camp: boolean) => {
  // Look the stage up afresh each day: resting swaps in a new copy of the state.
  const stage = () => d.journey.find((x) => x.id === stageId);
  const first = stage();
  if (!first || first.done) return;
  Object.assign(d.place, { terrain: first.terrain, onRoute: first.onRoute, goodRoad: first.goodRoad });
  const uncharted = d.settings.unchartedLand && !!first.uncharted;
  if (uncharted && first.trueMiles == null) {
    if (partyHasMapOf(d, first.name)) {
      first.trueMiles = first.miles;
      log(d, `The party's ${mapName(first.name)} shows the way: ${first.miles} miles.`);
    } else {
      const roll = die(6, ctx.rng);
      first.trueMiles = trueDistance(first.miles, roll);
      log(d, `${intoTheUnknown(first.terrain, roll)} The party guesses it's about ${first.miles} miles (table rule: the real distance is rolled secretly).`);
    }
  }
  const target = (st: JourneyStage) => (uncharted ? (st.trueMiles ?? st.miles) : st.miles);
  d.travel.stageName = first.name;
  log(d, `Journey stage: ${first.name} (${uncharted && first.trueMiles !== first.miles ? 'about ' : ''}${Math.max(0, first.miles - first.milesDone)} miles to go, ${TERRAIN[first.terrain].label}).`);
  let fastDays = false;
  for (let day = 0; day < 60 && stage()!.milesDone < target(stage()!); day++) {
    const st = stage()!;
    const vessel = o.vesselId ? d.stashes.find((x) => x.id === o.vesselId && x.speedMph) : undefined;
    const pace = clampPace(o.pace, st.terrain, st.goodRoad || !!d.travel.paceBoost);
    const pending = (st.obstacles ?? []).filter((x) => !x.resolved);
    if (pending.length && day === 0) log(d, `This stage has ${pending.length} unresolved obstacle(s): ${pending.map((x) => x.name).join(', ')}. Resolve them on the Journey card.`, 'warn');
    const mph = vessel ? Math.max(0.1, vesselSpeed(d, vessel, o).mph) : PACES[pace].mph * (st.difficult || groundDifficulty(d.place.ground, st.goodRoad) ? 0.5 : 1);
    const hours = Math.max(1, Math.min(vessel ? 24 : 8, Math.ceil((target(st) - st.milesDone) / mph)));
    if (pace === 'fast' && !vessel) fastDays = true;
    const covered = travelMut(d, ctx, { ...o, pace, hours, difficult: st.difficult });
    st.milesDone = Math.min(target(st), Math.round((st.milesDone + covered) * 10) / 10);
    if (uncharted && !st.overdueNoted && st.milesDone >= st.miles && st.milesDone < target(st)) {
      st.overdueNoted = true;
      log(d, OVERDUE_NOTE, 'warn');
    }
    if (st.milesDone >= target(st) || !camp) break;
    const eaten = partyEat(d, ctx, 'topup');
    Object.assign(d, partyDrink(eaten, ctx, 'topup'));
    if (d.minutes % MIN_PER_DAY < 22 * 60) advanceMut(d, ctx, 22 * 60 - (d.minutes % MIN_PER_DAY), 'camp');
    Object.assign(d, longRest(d, ctx, false));
    if (d.minutes % MIN_PER_DAY < 7 * 60) advanceMut(d, ctx, 7 * 60 - (d.minutes % MIN_PER_DAY), 'camp');
  }
  const done = stage()!;
  delete d.travel.stageName;
  if (done.milesDone >= target(done)) {
    done.done = true;
    log(d, `Stage complete: ${done.name}.`, 'good');
    if (uncharted) {
      if (done.trueMiles !== done.miles || !partyHasMapOf(d, done.name)) log(d, arrivalNote(done.miles, target(done)));
      chartStage(d, ctx, done, o.mapperId ?? null, fastDays);
    }
    if (d.travel.reconAdvantage && d.journey.every((x) => x.done)) {
      d.travel.reconAdvantage = false;
      log(d, 'The journey is over; the Zhentarim reconnaissance no longer helps.');
    }
  }
});

/**
 * Charting an uncharted stage on arrival (table rule): the mapper's Wisdom check with Cartographer's Tools (2024 PHB, DC 15).
 * A Fast pace leaves no time to take bearings. Success gives a Map of the stage: +5 to find the way there (2024 PHB Map).
 */
function chartStage(d: State, ctx: Ctx, st: JourneyStage, mapperId: string | null, fast: boolean): void {
  if (!mapperId || partyHasMapOf(d, st.name)) return;
  const c = charById(d, mapperId);
  if (!c || !alive(c)) return;
  if (!c.inventory.some((i) => CARTOGRAPHER.test(i.name))) return void log(d, `${c.name} has no Cartographer's Tools, so nobody charts the way.`, 'warn');
  if (fast) return void log(d, `At a Fast pace ${c.name} had no time to take bearings, so the way isn't charted.`, 'warn');
  const mod = c.wisMod + (proficientWith(c, "Cartographer's Tools") === false ? 0 : proficiencyBonus(c.level)) - 2 * c.exhaustion;
  const r = d20('normal', ctx.rng);
  const roll = `Wisdom with Cartographer's Tools ${r.value} ${signed(mod)} = ${r.value + mod} against DC ${CHART_DC}`;
  if (r.value + mod < CHART_DC) return void log(d, `${c.name} tries to turn the notes from the road into a map (${roll}), but there are too many gaps to steer by.`, 'warn');
  const name = mapName(st.name);
  c.inventory.push({ id: uid(), name, qty: 1, weight: 0, source: 'manual', valueGp: ROUTE_MAP_GP, container: null, ammo: null });
  log(d, `${c.name} charts the way (${roll}) and draws a ${name}. Finding the way here next time gets +5 (2024 PHB Map).`, 'good');
}

// ---------------------------------------------------------------- foraging, fire, food

/** Forage for `days` days' worth of searching (a fraction for a short leg of travel). */
function doForage(s: State, ctx: Ctx, c: Character, pace: Pace | null, days = 1): void {
  if (!alive(c)) return;
  const dc = TERRAIN[s.place.terrain].forageDC;
  const mode = combineModes(combineModes(pace === 'slow' ? 'advantage' : 'normal', pace === 'fast' ? 'disadvantage' : 'normal'), s.travel.reconAdvantage ? 'advantage' : 'normal');
  const r = d20(mode, ctx.rng);
  const total = r.value + c.survival - 2 * c.exhaustion;
  if (total >= dc) {
    // Food and water found per day of the journey stage.
    // Table rule: a skilled forager finds more, another 1d6 lb for each full 5 points over the DC.
    const extra = forageBonusDice(total, dc);
    const food = Math.round(Math.max(0, die(6, ctx.rng) + c.wisMod + (extra ? rollDice(extra, 6, ctx.rng) : 0)) * days);
    const water = Math.round(Math.max(0, die(6, ctx.rng) + c.wisMod) * days);
    const rawFood = s.settings.rawFoodRisk;
    const dirtyWater = s.settings.wildNeedsPurifying;
    if (rawFood) s.stores.foodRawLb += food;
    else s.stores.foodLb += food;
    if (dirtyWater) s.stores.waterUnsafeGal += water;
    else s.stores.waterGal += water;
    const notes = [rawFood && 'the food is raw and should be cooked', dirtyWater && 'the water needs purifying'].filter(Boolean).join(', and ');
    log(
      s,
      `${c.name} forages: Wisdom (Survival) ${r.rolls.join('/')} ${signed(c.survival - 2 * c.exhaustion)} = ${total} against DC ${dc}. Finds ${food} lb of food and ${water} gal of water${notes ? `: ${notes}` : ' for the camp stores'}.`,
      'good',
    );
    if (isExceptional(r.value, total, dc)) grantFind(s, ctx, c, 'forage');
  } else {
    log(s, `${c.name} forages: Wisdom (Survival) ${r.rolls.join('/')} ${signed(c.survival - 2 * c.exhaustion)} = ${total} against DC ${dc}. Finds nothing.`, 'warn');
  }
}

export const forage = act((d, ctx, charId: string) => {
  const c = charById(d, charId);
  if (!c) return;
  advanceMut(d, ctx, 60, 'camp');
  doForage(d, ctx, c, null);
});

/** The party members who could light the fire with a spell, and the spell each would use. */
export function fireSpellCasters(s: State): { c: Character; spell: string }[] {
  const out: { c: Character; spell: string }[] = [];
  for (const c of s.characters) {
    if (c.kind !== 'pc' || !alive(c)) continue;
    const sp = FIRE_SPELLS.find((n) => c.spells.some((x) => x.name.toLowerCase() === n.toLowerCase()));
    if (sp) out.push({ c, spell: sp });
  }
  return out;
}

/** Sunlight bright enough to focus through a Magnifying Glass: daytime, outdoors, no rain or snow falling. */
export function sunBright(s: State): boolean {
  if (CLIMATES[s.weather.climate].noWeather || s.place.shelter === 'building' || s.place.shelter === 'cave') return false;
  const phase = lightAt(s.minutes % MIN_PER_DAY, seasonOf(s)).phase;
  return phase === 'Day' && s.weather.precip === 'none';
}

/** Does anyone in the party carry a Tinderbox? Null when nobody has an inventory recorded, so it can't be told. */
/** Whether anyone carries Cook's Utensils; null when nobody's inventory is listed. */
export function partyHasCooksUtensils(s: State): boolean | null {
  const pcs = s.characters.filter((c) => c.kind === 'pc');
  if (!pcs.some((c) => c.inventory.length)) return null;
  return pcs.some((c) => c.inventory.some((i) => /cook'?s utensils/i.test(i.name)));
}

export function partyHasTinderbox(s: State): boolean | null {
  const pcs = s.characters.filter((c) => c.kind === 'pc');
  if (!pcs.some((c) => c.inventory.length)) return null;
  return pcs.some((c) => c.inventory.some((i) => /tinderbox/i.test(i.name)));
}

/**
 * Light the campfire. With the lighting check on (table rule), someone makes a Wisdom (Survival) check: DC 10, +5 when
 * the fuel is damp, +5 in strong wind or heavy rain (only possible in a sheltered pit), and +5 without a Tinderbox. Each
 * try takes 1 minute with a Tinderbox or 10 without. A spell that lights fires works at once.
 */
export const lightFire = act((d, ctx, lighterId?: string, method: FireMethod = 'tinderbox', intBonus: number = 0) => {
  if (d.fire.lit) return;
  if (d.fire.fuelHours <= 0) {
    log(d, 'There is no fuel to light a fire. Gather wood first.', 'warn');
    return;
  }
  const indoors = d.place.shelter === 'building' || d.place.shelter === 'cave';
  const how = fireLighting(d.weather, tempNow(d), d.fire.sheltered, indoors);
  if (!how.possible) {
    log(d, `The ${how.why[0]}.`, 'warn');
    return;
  }
  const lighter = lighterId ? actorById(d, lighterId) : undefined;
  if (method === 'spell') {
    const caster = fireSpellCasters(d).find((x) => x.c.id === lighterId) ?? fireSpellCasters(d)[0];
    if (!caster) {
      log(d, 'Nobody knows a spell that lights a campfire (Prestidigitation, Druidcraft or Fire Bolt).', 'warn');
      return;
    }
    d.fire.lit = true;
    log(d, `${caster.c.name} casts ${caster.spell}, and the campfire catches at once.`, 'good');
    return;
  }
  const m = FIRE_METHODS[method];
  if (method === 'magnifier') {
    const user = lighter && lighter.inventory.some((i) => MAGNIFYING_GLASS.test(i.name)) ? lighter : carrierOf(d, [], MAGNIFYING_GLASS)?.c;
    if (!user) return void log(d, 'Nobody carries a Magnifying Glass.', 'warn');
    if (!sunBright(d)) return void log(d, 'A Magnifying Glass needs light as bright as sunlight to start a fire: a clear day, outdoors.', 'warn');
    advanceMut(d, ctx, m.minutes, 'camp');
    d.fire.lit = true;
    return void log(d, `${user.name} angles a Magnifying Glass at the tinder until a curl of smoke rises and the kindling catches (${m.minutes} min).`, 'good');
  }
  if (method === 'alchemist') {
    if (!lighter) return;
    if (!lighter.inventory.some((i) => ALCHEMIST.test(i.name))) return void log(d, `${lighter.name} has no Alchemist's Supplies.`, 'warn');
    advanceMut(d, ctx, m.minutes, 'camp');
    // The tool's DC 15 always applies (2024 PHB); the weather adds to it only under the lighting-check table rule.
    const extra = d.settings.fireLightingCheck ? how.dc - FIRE_LIGHT_DC : 0;
    const dc = ALCHEMIST_FIRE_DC + extra;
    const r = d20('normal', ctx.rng);
    const total = r.value + intBonus - 2 * lighter.exhaustion;
    const roll = `Intelligence with Alchemist's Supplies ${r.value} ${signed(intBonus - 2 * lighter.exhaustion)} = ${total} against DC ${dc}${extra ? ` (${how.why.join(', ')})` : ''}`;
    if (total >= dc) {
      d.fire.lit = true;
      return void log(d, `${lighter.name} sprinkles a reagent on the kindling and it flares alight: ${roll}.`, 'good');
    }
    return void log(d, `${lighter.name}'s reagent fizzles and smokes without catching: ${roll}. ${m.minutes} min spent; try again.`, 'warn');
  }
  advanceMut(d, ctx, m.minutes, 'camp');
  if (!d.settings.fireLightingCheck || !lighter) {
    d.fire.lit = true;
    log(d, `${lighter ? `${lighter.name} lights` : 'You light'} a campfire (${m.label.toLowerCase()}, ${m.minutes} min).`, 'good');
    return;
  }
  const dc = how.dc + m.dcMod;
  const bonus = lighter.survival - 2 * lighter.exhaustion;
  const r = d20('normal', ctx.rng);
  const total = r.value + bonus;
  const reasons = [...how.why, ...(m.dcMod ? [`no Tinderbox (+${m.dcMod})`] : [])];
  const roll = `Wisdom (Survival) ${r.value} ${signed(bonus)} = ${total} against DC ${dc}${reasons.length ? ` (${reasons.join(', ')})` : ''}`;
  if (total >= dc) {
    d.fire.lit = true;
    log(d, `${lighter.name} gets the campfire going after ${m.minutes} min: ${roll}.`, 'good');
  } else {
    log(d, `${lighter.name} can't get the fire to catch: ${roll}. ${m.minutes} min spent; try again.`, 'warn');
  }
});

/** Cook all the raw food in the camp stores over the fire, so it's safe to eat later (table rule). */
export const cookRawFood = act((d, ctx) => {
  if (!d.fire.lit) {
    log(d, 'You need a lit fire to cook.', 'warn');
    return;
  }
  const raw = d.stores.foodRawLb;
  if (raw <= 0) {
    log(d, 'There is no raw food to cook.');
    return;
  }
  advanceMut(d, ctx, COOK_RAW_MINUTES, 'camp');
  d.stores.foodLb = round2(d.stores.foodLb + raw);
  d.stores.foodRawLb = 0;
  log(d, `The party cooks ${fmtLb(round2(raw))} of raw food over the campfire (${COOK_RAW_MINUTES} min, table rule). It goes into the camp stores, safe to eat.`, 'good');
});

export const douseFire = act((d) => {
  if (!d.fire.lit) return;
  d.fire.lit = false;
  log(d, 'The campfire is put out.');
});

export const gatherWood = act((d, ctx, charId: string) => {
  const c = charById(d, charId);
  if (!c) return;
  advanceMut(d, ctx, 60, 'camp');
  const dc = TERRAIN[d.place.terrain].forageDC;
  const r = d20('normal', ctx.rng);
  const total = r.value + c.survival - 2 * c.exhaustion;
  const hours = total >= dc ? die(6, ctx.rng) + 2 : 1;
  d.fire.fuelHours += hours;
  log(d, `${c.name} gathers firewood for an hour: Survival ${total} against DC ${dc}. Adds ${hours} hour(s) of fuel (table rule).`, total >= dc ? 'good' : 'warn');
  if (isExceptional(r.value, total, dc)) grantFind(d, ctx, c, 'wood');
});

/**
 * Table rule: an exceptional result on a camp chore turns up something worth having. The find lands
 * where it belongs: coins in the purse, valuables in the pack, materials in the crafting stash, food in the stores.
 */
function grantFind(d: State, ctx: Ctx, c: Character, chore: Chore): void {
  const f = rollFind(chore, ctx.rng);
  const r = f.reward;
  const n = (dice: string) => Math.max(1, rollExpr(dice, ctx.rng) ?? 1);
  let got = '';
  switch (r.kind) {
    case 'coins': {
      const q = n(r.dice);
      gainWealth(c, q * (r.unit === 'gp' ? 1 : r.unit === 'sp' ? 0.1 : 0.01));
      got = `${q} ${r.unit.toUpperCase()}, now in ${c.name}'s purse`;
      break;
    }
    case 'item':
      c.inventory.push({ id: uid(), name: r.name, qty: 1, weight: r.weight, source: 'manual', valueGp: r.valueGp, ...(r.hidden ? { valueHidden: true } : {}), container: null, ammo: null });
      got = `${r.name} goes into ${c.name}'s pack${r.hidden ? ' (appraise it to learn its worth)' : ` (worth ${fmtGp(r.valueGp)})`}`;
      break;
    case 'material': {
      const q = n(r.dice);
      const m = d.materials.find((x) => x.name === r.name);
      if (m) m.qty += q;
      else d.materials.push({ id: uid(), name: r.name, qty: q, unit: r.unit, valueGp: r.valueGp });
      got = `${q} ${r.unit}${q > 1 ? 's' : ''} of ${r.name.toLowerCase()} for the crafting stash (${fmtGp(q * r.valueGp)} toward a project)`;
      break;
    }
    case 'food': {
      const q = n(r.dice);
      const raw = r.raw && d.settings.rawFoodRisk;
      if (raw) d.stores.foodRawLb = round2(d.stores.foodRawLb + q);
      else d.stores.foodLb = round2(d.stores.foodLb + q);
      got = `${q} lb more food for the stores${raw ? ' (raw)' : ''}`;
      break;
    }
    case 'fuel': {
      const q = n(r.dice);
      d.fire.fuelHours += q;
      got = `${q} more hour${q > 1 ? 's' : ''} of fuel`;
      break;
    }
  }
  log(d, `${c.name} comes across ${f.text}: ${got} (table rule).`, 'good');
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** 'cook' uses up foraged food first, because cooking it makes it safe. */
type FoodSource = 'rations' | 'stores' | 'auto' | 'cook';
type WaterSource = 'personal' | 'stores' | 'auto';

/** How much was eaten, and how much of it came from unpurified supplies. */
interface Taken {
  amount: number;
  unsafe: number;
}

function takeFood(s: State, c: Character, lb: number, source: FoodSource): Taken {
  let left = lb;
  let unsafe = 0;
  const pull = (have: number, set: (v: number) => void) => {
    const t = Math.min(left, have);
    set(round2(have - t));
    left = round2(left - t);
    return t;
  };
  const safeStores = () => pull(s.stores.foodLb, (v) => (s.stores.foodLb = v));
  const rations = () => pull(c.rationsLb, (v) => (c.rationsLb = v));
  const unsafeStores = () => (unsafe += pull(s.stores.foodRawLb, (v) => (s.stores.foodRawLb = v)));
  if (source === 'stores') (safeStores(), unsafeStores());
  else if (source === 'cook') (unsafeStores(), safeStores(), rations());
  else if (source === 'rations') rations();
  else (safeStores(), rations(), unsafeStores());
  const amount = round2(lb - left);
  c.ateLbToday = round2(c.ateLbToday + amount);
  return { amount, unsafe: round2(unsafe) };
}

/** Water straight from the place's source is tainted when it's questionable and purifying is required. */
const sourceIsUnsafe = (s: State) => s.place.waterQuality === 'questionable' && s.settings.wildNeedsPurifying;

function takeWater(s: State, c: Character, pints: number, source: WaterSource): Taken {
  let left = pints;
  let unsafe = 0;
  const pull = (havePints: number, set: (pintsLeft: number) => void) => {
    const t = Math.min(left, havePints);
    set(havePints - t);
    left = round2(left - t);
    return t;
  };
  const safeStores = () => pull(s.stores.waterGal * PINTS_PER_GALLON, (p) => (s.stores.waterGal = round2(p / PINTS_PER_GALLON)));
  const unsafeStores = () => (unsafe += pull(s.stores.waterUnsafeGal * PINTS_PER_GALLON, (p) => (s.stores.waterUnsafeGal = round2(p / PINTS_PER_GALLON))));
  const personal = () => {
    const t = pull(c.waterPints, (p) => (c.waterPints = round2(p)));
    if (c.waterUnsafe) unsafe += t;
  };
  if (source === 'personal') personal();
  else if (source === 'stores') (safeStores(), unsafeStores());
  else {
    if (s.place.waterSource && !sourceIsUnsafe(s)) left = 0; // drinking straight from a clean stream
    safeStores();
    if (!c.waterUnsafe) personal();
    if (left > 0 && s.place.waterSource) {
      unsafe += left; // risk the questionable stream before tainted stores or skins
      left = 0;
    }
    unsafeStores();
    personal();
  }
  const amount = round2(pints - left);
  c.drankPintsToday = round2(c.drankPintsToday + amount);
  return { amount, unsafe: round2(unsafe) };
}

/**
 * Table rules. Raw food: Con save (DC from Settings) or Sick, which means Poisoned until a Long Rest.
 * Unpurified water: DC 10 Con save or Sick in the same way.
 */
function riskTainted(s: State, ctx: Ctx, c: Character, unsafe: number, what: 'food' | 'water'): void {
  if (unsafe <= 0) return;
  if (what === 'food') {
    if (s.settings.rawFoodRisk) requestSave(s, ctx, c, 'raw', s.settings.rawFoodDC, 'normal', `eating ${fmtLb(unsafe)} of raw food`);
  } else if (s.settings.wildNeedsPurifying) {
    requestSave(s, ctx, c, 'tainted', TAINTED_DC, 'normal', 'unpurified water');
  }
}

export const eat = act((d, ctx, charId: string, lb: number, source: 'rations' | 'stores') => {
  const c = charById(d, charId);
  if (!c) return;
  const got = takeFood(d, c, lb, source);
  log(
    d,
    got.amount > 0
      ? `${c.name} eats ${fmtLb(got.amount)} from ${source === 'rations' ? 'their rations' : 'the camp stores'}${got.unsafe ? ` (${fmtLb(got.unsafe)} of it raw)` : ''}.`
      : `${c.name} has nothing to eat from ${source}.`,
    got.amount > 0 ? 'info' : 'warn',
  );
  riskTainted(d, ctx, c, got.unsafe, 'food');
});

export const drink = act((d, ctx, charId: string, pints: number, source: 'personal' | 'stores') => {
  const c = charById(d, charId);
  if (!c) return;
  const got = takeWater(d, c, pints, source);
  log(d, got.amount > 0 ? `${c.name} drinks ${fmtWater(got.amount)}${got.unsafe ? ' of unpurified water' : ''}.` : `${c.name} has nothing to drink.`, got.amount > 0 ? 'info' : 'warn');
  riskTainted(d, ctx, c, got.unsafe, 'water');
});

export type Portion = 'meal' | 'day' | 'topup';

function portionFood(c: Character, portion: Portion): number {
  const need = foodNeedLb(c);
  if (portion === 'meal') return need / 2;
  if (portion === 'day') return need;
  return Math.max(0, need - c.ateLbToday);
}

export const partyEat = act((d, ctx, portion: Portion) => {
  const notes: string[] = [];
  const risky: [Character, number][] = [];
  for (const c of d.characters) {
    if (!alive(c) || !c.needsFood) continue;
    const want = portionFood(c, portion);
    if (want <= 0) continue;
    const got = takeFood(d, c, want, 'auto');
    notes.push(`${c.name} ${fmtLb(got.amount)}${got.amount < want ? ' (short)' : ''}${got.unsafe ? ' (some raw)' : ''}`);
    if (got.unsafe) risky.push([c, got.unsafe]);
  }
  log(d, notes.length ? `The party eats (camp stores first, then rations): ${notes.join(', ')}.` : 'Nobody needs to eat right now.', notes.some((n) => n.includes('short')) ? 'warn' : 'info');
  for (const [c, u] of risky) riskTainted(d, ctx, c, u, 'food');
});

export const partyDrink = act((d, ctx, portion: Portion) => {
  const hot = d.weather.high >= 100;
  const notes: string[] = [];
  const risky: [Character, number][] = [];
  for (const c of d.characters) {
    if (!alive(c) || !c.needsWater) continue;
    const need = waterNeedPints(c, hot, d.settings.doubleWaterInHeat);
    const want = portion === 'meal' ? need / 2 : portion === 'day' ? need : Math.max(0, need - c.drankPintsToday);
    if (want <= 0) continue;
    const got = takeWater(d, c, want, 'auto');
    notes.push(`${c.name} ${fmtWater(got.amount)}${got.amount < want ? ' (short)' : ''}${got.unsafe ? ' (unpurified)' : ''}`);
    if (got.unsafe) risky.push([c, got.unsafe]);
  }
  log(d, notes.length ? `The party drinks${d.place.waterSource ? ' from the nearby water source' : ''}: ${notes.join(', ')}.` : 'Nobody needs to drink right now.', notes.some((n) => n.includes('short')) ? 'warn' : 'info');
  for (const [c, u] of risky) riskTainted(d, ctx, c, u, 'water');
});

export const refillWater = act((d) => {
  if (!d.place.waterSource) {
    log(d, 'There is no water source here.', 'warn');
    return;
  }
  const unsafe = sourceIsUnsafe(d);
  for (const c of d.characters) {
    if (c.waterPints < c.waterCapacityPints) {
      // Topping up a clean skin with questionable water taints the whole skin.
      if (unsafe) c.waterUnsafe = true;
      c.waterPints = c.waterCapacityPints;
    }
  }
  log(d, unsafe ? 'Everyone refills their waterskins. The water is questionable, so purify it before drinking.' : 'Everyone refills their waterskins with clean water.', unsafe ? 'warn' : 'good');
});

export const fillBarrel = act((d, _ctx, gallons: number) => {
  if (!d.place.waterSource) return;
  if (sourceIsUnsafe(d)) d.stores.waterUnsafeGal = round2(d.stores.waterUnsafeGal + gallons);
  else d.stores.waterGal = round2(d.stores.waterGal + gallons);
  log(d, `Filled ${gallons} gal of ${sourceIsUnsafe(d) ? 'unpurified' : 'clean'} water into the camp stores.`);
});

export const cookMeal = act((d, ctx, cookId: string | null) => {
  if (!d.fire.lit) {
    log(d, 'You need a lit fire to cook a hot meal.', 'warn');
    return;
  }
  const cook = cookId ? actorById(d, cookId) : undefined;
  advanceMut(d, ctx, 60, 'camp');
  const eaters: string[] = [];
  const ate: Character[] = [];
  let cookedUnsafe = 0;
  for (const c of d.characters) {
    if (!alive(c) || !c.needsFood) continue;
    const got = takeFood(d, c, foodNeedLb(c) / 2, 'cook');
    cookedUnsafe += got.unsafe;
    if (got.amount > 0) (eaters.push(c.name), ate.push(c));
  }
  let flavor = '';
  let tasty = false;
  let feast = false;
  let pb = 2;
  const hiredCook = !!cookId?.startsWith('h:');
  if (cook && (cook.cooksUtensils || hiredCook || partyHasCooksUtensils(d) !== false)) {
    // 2024 PHB Cook's Utensils: improve food's flavor, Wisdom DC 10, plus Proficiency Bonus if proficient. A hired cook brings utensils and their own bonus.
    const bonus = hiredCook ? cook.wisMod : cook.wisMod + (cook.cooksUtensils ? proficiencyBonus(cook.level) : 0) - 2 * cook.exhaustion;
    const r = d20('normal', ctx.rng);
    const ok = r.value + bonus >= 10;
    tasty = ok;
    pb = hiredCook ? 2 : proficiencyBonus(cook.level);
    feast = ok && isFeast(r.value, r.value + bonus, 10);
    flavor = ` ${cook.name} cooks: Wisdom with Cook's Utensils ${r.value} ${signed(bonus)} = ${r.value + bonus} against DC 10, ${feast ? 'a feast to remember' : ok ? 'a delicious meal' : 'edible, at least'}.`;
  } else if (cook && d.settings.improvised) {
    // Table rule: no utensils, so a pot, a spit and Wisdom (Survival) at DC +5.
    const bonus = cook.survival - 2 * cook.exhaustion;
    const r = d20('normal', ctx.rng);
    const ok = r.value + bonus >= IMPROVISED_COOK_DC;
    tasty = ok;
    pb = proficiencyBonus(cook.level);
    feast = ok && isFeast(r.value, r.value + bonus, IMPROVISED_COOK_DC);
    flavor = ` ${cook.name} cooks without proper utensils: Wisdom (Survival) ${r.value} ${signed(bonus)} = ${r.value + bonus} against DC ${IMPROVISED_COOK_DC}, ${feast ? 'a spit-roast feast against all odds' : ok ? 'surprisingly tasty' : 'edible, at least'}.`;
  } else if (cook) {
    flavor = ` ${cook.name} has no Cook's Utensils: plain fare, filling but nothing more.`;
  }
  const dish = d.recipeNames.length ? ` On the menu: ${d.recipeNames[absNow(d) % d.recipeNames.length]}.` : '';
  const purified = cookedUnsafe > 0 ? ` Cooking makes the ${fmtLb(round2(cookedUnsafe))} of raw food safe to eat.` : '';
  log(d, eaters.length ? `A hot meal at the campfire for ${eaters.join(', ')} (half a day's food each).${dish}${purified}${flavor}` : `Nothing to cook: the stores and rations are empty.${flavor}`, eaters.length ? 'good' : 'warn');
  // Table rule: a good meal is worth the hour. Any hot meal warms against the cold for 8 hours; a tasty one also
  // fortifies for a hard march, eases Stress and gives Temporary HP; a feast does more.
  const until = absNow(d) + MEAL_BUFF_MINUTES;
  const temp = feast ? feastTempHp(cook!.level ?? 1, cook!.wisMod, pb) : tasty ? tastyTempHp(pb) : 0;
  const relief = feast ? FEAST_STRESS_RELIEF : tasty ? MEAL_STRESS_RELIEF : 0;
  for (const c of ate) {
    c.mealBuff = { until: Math.max(until, c.mealBuff?.until ?? 0), hearty: tasty || (!!c.mealBuff?.hearty && c.mealBuff.until > absNow(d)) };
    if (c.kind === 'mount') continue;
    if (relief && c.stress > 0) {
      const by = Math.min(c.stress, relief);
      c.stress -= by;
      status(d, c, 'stressDown', `${c.name} lingers over the meal and feels the day's tension ease (Stress −${by}, now ${c.stress}; table rule).`, 'good');
    }
    if (feast && c.fear > 0) {
      const by = Math.min(c.fear, FEAST_FEAR_RELIEF);
      c.fear -= by;
      status(d, c, 'fearDown', `${c.name} laughs with the others around the fire, and the dread loosens its hold (Fear −${by}, now ${c.fear}; table rule).`, 'good');
    }
    if (temp && c.tempHp < temp) c.tempHp = temp;
  }
  if (!ate.length) return;
  const perks = [`warm against the cold for 8 hours (Advantage on saves against extreme cold and cold nights)`, tasty && 'fortified for the road (Advantage on forced-march saves)', temp && `${temp} Temporary HP`].filter(Boolean);
  log(d, `${feast ? 'A feast to remember' : tasty ? 'A good hot meal' : 'Hot food'}: everyone who ate is ${perks.join(', ')} (table rule).`, 'good');
});

/**
 * Table rule: smoking and drying meat from the camp stores into trail Rations over a lit fire. 4 hours, Wisdom (Survival)
 * or Wisdom with Cook's Utensils at DC 10; 3 lb of meat makes a day of Rations (half on a failure). Up to 30 lb a batch.
 * Rations keep, weigh less, and sell for 5 SP a day.
 */
export const cureRations = act((d, ctx, curerId: string) => {
  const c = charById(d, curerId);
  if (!c || !alive(c)) return;
  if (!d.fire.lit) return void log(d, 'Smoking meat needs a lit fire.', 'warn');
  const have = round2(d.stores.foodRawLb + d.stores.foodLb);
  if (have < CURE_LB_PER_RATION) return void log(d, `There isn't enough meat in the stores to smoke (it takes ${CURE_LB_PER_RATION} lb for a day of Rations).`, 'warn');
  const lb = Math.min(have, CURE_MAX_LB);
  advanceMut(d, ctx, CURE_MINUTES, 'camp');
  const me = charById(d, curerId)!;
  const utensils = me.cooksUtensils ? me.wisMod + proficiencyBonus(me.level) : -Infinity;
  const bonus = Math.max(me.survival, utensils) - 2 * me.exhaustion;
  const r = d20('normal', ctx.rng);
  const ok = r.value + bonus >= CURE_DC;
  const used = Math.floor(lb / CURE_LB_PER_RATION) * CURE_LB_PER_RATION;
  // Raw meat goes on the racks first: smoking it makes it safe.
  const fromRaw = Math.min(d.stores.foodRawLb, used);
  d.stores.foodRawLb = round2(d.stores.foodRawLb - fromRaw);
  d.stores.foodLb = round2(d.stores.foodLb - (used - fromRaw));
  const days = curedRations(used, ok);
  if (days) addLine(d, me, 'Rations', days, {}, null, false);
  const roll = `${utensils > me.survival ? "Wisdom with Cook's Utensils" : 'Wisdom (Survival)'} ${r.value} ${signed(bonus)} = ${r.value + bonus} against DC ${CURE_DC}`;
  log(
    d,
    ok
      ? `${me.name} smokes ${used} lb of meat over the fire for 4 hours (${roll}): ${days} day${days === 1 ? '' : 's'} of Rations, dry and keeping, worth 5 SP each (table rule).`
      : `${me.name} smokes ${used} lb of meat (${roll}), but the fire runs hot and cold: half scorches or stays wet, and only ${days} day${days === 1 ? '' : 's'} of Rations come off the racks (table rule).`,
    ok ? 'good' : 'warn',
  );
});

// ---------------------------------------------------------------- purification

export function canCastPurify(c: Character, mode: 'ritual' | 'slot'): { ok: boolean; reason: string } {
  const sp = c.spells.find((x) => x.name.toLowerCase() === PURIFY_SPELL.toLowerCase());
  if (!sp) return { ok: false, reason: `${c.name} doesn't know ${PURIFY_SPELL}.` };
  const prepared = sp.prepared || sp.alwaysPrepared;
  if (mode === 'slot') return prepared ? { ok: true, reason: '' } : { ok: false, reason: `${c.name} doesn't have it prepared.` };
  // Wizards can cast rituals straight from their spellbook; others need the spell prepared.
  if (prepared || c.className === 'Wizard') return { ok: true, reason: '' };
  return { ok: false, reason: `${c.name} needs it prepared to cast it as a ritual.` };
}

function purifyAll(s: State): string {
  const food = s.stores.foodRawLb;
  const water = s.stores.waterUnsafeGal;
  const skins = s.characters.filter((c) => c.waterUnsafe).length;
  s.stores.foodLb = round2(s.stores.foodLb + food);
  s.stores.waterGal = round2(s.stores.waterGal + water);
  s.stores.foodRawLb = 0;
  s.stores.waterUnsafeGal = 0;
  for (const c of s.characters) c.waterUnsafe = false;
  const parts = [food && fmtLb(food) + ' of raw food', water && `${water} gal of stored water`, skins && `${skins} waterskin${skins > 1 ? 's' : ''}`].filter(Boolean);
  return parts.length ? parts.join(', ') : 'nothing that needed it';
}

/** Purify Food and Drink: removes poison and rot from nonmagical food and drink in a 5-foot-radius Sphere. */
export const purifySpell = act((d, ctx, casterId: string | null, mode: 'ritual' | 'slot') => {
  const c = casterId ? charById(d, casterId) : undefined;
  if (c) {
    const check = canCastPurify(c, mode);
    if (!check.ok) {
      log(d, check.reason, 'warn');
      return;
    }
  }
  if (mode === 'ritual') advanceMut(d, ctx, 10, 'camp');
  const who = c ? `${c.name} casts` : 'Using a scroll or other source, the party casts';
  log(d, `${who} ${PURIFY_SPELL}${mode === 'ritual' ? ' as a ritual (10 minutes, no spell slot)' : ' with a level 1 spell slot (an action)'}. Purified: ${purifyAll(d)}.`, 'good');
});

/** Whether the party has a pot to boil water in; null when nobody's inventory is listed. */
export function partyHasPot(s: State): boolean | null {
  if (!inventoriesKept(s)) return null;
  return s.characters.some((c) => c.inventory.some((i) => BOILING_POT.test(i.name)));
}

export const boilWater = act((d, ctx) => {
  if (!d.fire.lit) {
    log(d, 'You need a lit fire to boil water.', 'warn');
    return;
  }
  const allWater = d.stores.waterUnsafeGal;
  const dirtySkins = d.characters.filter((c) => c.waterUnsafe);
  if (!allWater && !dirtySkins.length) {
    log(d, 'There is no unpurified water to boil.');
    return;
  }
  // Table rule: no pot means hot stones dropped in a hide or wooden bowl: twice as long, half as much water each time.
  const stones = partyHasPot(d) === false;
  if (stones && !d.settings.improvised) return void log(d, 'There is no pot to boil water in, and improvised attempts are off.', 'warn');
  const water = stones ? round2(allWater / 2) : allWater;
  const skins = stones ? dirtySkins.slice(0, Math.ceil(dirtySkins.length / 2)) : dirtySkins;
  const minutes = BOIL_MINUTES * (stones ? 2 : 1);
  advanceMut(d, ctx, minutes, 'camp');
  d.stores.waterGal = round2(d.stores.waterGal + water);
  d.stores.waterUnsafeGal = round2(d.stores.waterUnsafeGal - water);
  for (const c of skins) {
    const me = charById(d, c.id);
    if (me) me.waterUnsafe = false;
  }
  const what = `${water ? `${water} gal of stores` : ''}${water && skins.length ? ' and ' : ''}${skins.length ? `${skins.length} waterskin(s)` : ''}`;
  log(
    d,
    stones
      ? `With no pot, the party drops fire-heated stones into a hide and a hollowed log until the water seethes (${minutes} minutes, table rule): ${what} now safe to drink. Half is left to do.`
      : `The party boils water over the campfire (${minutes} minutes, table rule): ${what} now safe to drink.`,
    'good',
  );
});

// ---------------------------------------------------------------- armor

export const setArmor = act((d, ctx, charId: string, action: 'don' | 'doff') => {
  const c = charById(d, charId);
  if (!c || c.armorKind === 'none') return;
  if ((action === 'don') === c.armorWorn) return;
  const mins = armorTime(c, action);
  advanceMut(d, ctx, mins, 'camp');
  c.armorWorn = action === 'don';
  if (c.hasShield) c.shieldWorn = c.armorWorn;
  const name = c.armorName || ARMOR_LABEL[c.armorKind].toLowerCase();
  log(d, `${c.name} ${action === 'don' ? 'puts on' : 'takes off'} their ${name}${c.hasShield ? ' and shield' : ''} (${mins} min).`);
});

/** Everyone dons or doffs at the same time, so the clock moves by the slowest person. */
export const partyArmor = act((d, ctx, action: 'don' | 'doff') => {
  const who = d.characters.filter((c) => alive(c) && c.armorKind !== 'none' && c.armorWorn !== (action === 'don'));
  if (!who.length) return;
  const mins = Math.max(...who.map((c) => armorTime(c, action)));
  advanceMut(d, ctx, mins, 'camp');
  for (const c of who) {
    c.armorWorn = action === 'don';
    if (c.hasShield) c.shieldWorn = c.armorWorn;
  }
  log(d, `${action === 'don' ? 'The party suits up' : 'The party takes off their armor'} (${mins} min): ${who.map((c) => c.name).join(', ')}.`);
});

export const eatTreat = act((d, _ctx, charId: string) => {
  const c = charById(d, charId);
  if (!c || c.treats <= 0) return;
  c.treats -= 1;
  log(d, `${c.name} hands out a Chef treat (Bonus Action to eat: ${proficiencyBonus(c.level)} Temporary HP).`, 'good');
});

// ---------------------------------------------------------------- spells

export const togglePrepared = act((d, _ctx, charId: string, spellName: string, setup: boolean) => {
  const c = charById(d, charId);
  const sp = c?.spells.find((x) => x.name === spellName);
  if (!c || !sp || sp.alwaysPrepared) return;
  if (!setup && !c.prepOpen) {
    log(d, `${c.name} can't change prepared spells right now.`, 'warn');
    return;
  }
  sp.prepared = !sp.prepared;
});

export const replaceSpell = act((d, _ctx, charId: string, dropName: string, addName: string) => {
  const c = charById(d, charId);
  if (!c || c.swapsLeft <= 0) return;
  const drop = c.spells.find((x) => x.name === dropName && x.prepared && !x.alwaysPrepared);
  const add = c.spells.find((x) => x.name === addName && !x.prepared);
  if (!drop || !add) return;
  drop.prepared = false;
  add.prepared = true;
  c.swapsLeft -= 1;
  log(d, `${c.name} swaps ${drop.name} for ${add.name}.`, 'good');
});

export const finishPreparation = act((d, _ctx, charId: string) => {
  const c = charById(d, charId);
  if (!c) return;
  c.prepOpen = false;
  c.swapsLeft = 0;
  const limit = preparedLimit(c);
  const prepared = c.spells.filter((x) => x.prepared && x.level > 0).map((x) => x.name);
  const task = c.tasks.find((t) => /prepare spells/i.test(t.label));
  if (task) task.done = true;
  log(d, `${c.name} finishes preparing spells (${preparedCount(c)}${limit != null ? `/${limit}` : ''}): ${prepared.join(', ') || 'none'}.`, 'good');
});

// ---------------------------------------------------------------- downtime

export const workOnProjects = act((d, ctx, projectIds: string[]) => {
  const projects = d.projects.filter((p) => projectIds.includes(p.id) && !p.done);
  if (!projects.length) return;
  if (d.place.settlement) setTownModeMut(d, 'downtime', 'The party settles in to work. ');
  advanceMut(d, ctx, 8 * 60, 'work');
  for (const p of projects) progress(d, p, ctx);
});

/** Table rule: marching hours count at half rate toward a hand-held project. */
export const MARCH_WORK_RATE = 0.5;
/** Hours of work in a workday (2024 PHB: crafting progresses in 8-hour days). */
export const WORKDAY_HOURS = 8;

/** Table rule: hand work goes on at a normal or slow pace, writing only at a slow one; language practice at any pace. */
export const marchPaceOk = (p: Project, pace: Pace): boolean => {
  const w = marchWork(p);
  return w.concentration ? pace === 'slow' : w.talk ? true : pace !== 'fast';
};

/** Who could work a hand-held project while walking: conscious and doing nothing but marching. */
export function marchWorkers(s: State, p: Project, navigatorId: string | null | undefined, foragerIds: string[], pace: Pace = s.travel.pace): Character[] {
  const writing = !!marchWork(p).concentration;
  // Table rule: no work in the hands at a fast pace, and writing only at a slow one, where the pen stays on the line.
  if (!marchPaceOk(p, pace)) return [];
  const who = p.charIds
    .map((id) => charById(s, id))
    .filter((c): c is Character => !!c && c.kind === 'pc' && alive(c) && !c.dying && !c.stable && c.hp > 0 && c.id !== navigatorId && !foragerIds.includes(c.id) && !(writing && holdsConcentration(s, c)));
  // Writing is a one-person job (table rule): the first free writer holds the pen.
  return isSoloWork(p.kind) ? who.slice(0, 1) : who;
}

/** Who holds an effect's Concentration: its caster, or every caster in a circle that used Distribute. */
export function concentrators(e: ActiveEffect): string[] {
  return e.concentrationIds?.length ? e.concentrationIds : e.casterId ? [e.casterId] : [];
}

/** Concentrating on a spell right now. */
export function holdsConcentration(s: State, c: Character): boolean {
  const now = absNow(s);
  return s.effects.some((e) => e.concentration && concentrators(e).includes(c.id) && (e.endsAt == null || e.endsAt > now));
}

/** Table rule: crafters who are only marching keep working on projects they can carry in their hands, at half rate. */
function workOnTheMarch(s: State, ctx: Ctx, hours: number, navigatorId: string | null | undefined, foragerIds: string[], pace: Pace): void {
  if (!s.settings.workWhileMarching || hours <= 0) return;
  for (const p of s.projects.filter((x) => marchWork(x).ok && !x.done && !x.awaitingOutcome)) {
    const able = marchWorkers(s, p, navigatorId, foragerIds, pace);
    if (!able.length) {
      if (!marchPaceOk(p, pace) && marchWorkers(s, p, navigatorId, foragerIds, 'slow').length)
        log(s, `No work on ${p.name} at a ${pace} pace: ${marchWork(p).concentration ? 'writing on the march needs a slow pace' : 'hand work on the march needs a normal or slow pace'} (table rule).`);
      continue;
    }
    // Writing on the march: each writer keeps their concentration with a Constitution save, or the leg's lines are spoiled.
    let who = able;
    if (marchWork(p).concentration) {
      const lost: string[] = [];
      who = able.filter((c) => {
        const r = d20('normal', ctx.rng);
        const total = r.value + c.conSave - 2 * c.exhaustion;
        if (total >= MARCH_WRITING_DC) return true;
        lost.push(`${c.name} (Constitution save ${total} against DC ${MARCH_WRITING_DC})`);
        return false;
      });
      if (lost.length) log(s, `${lost.join(', ')} lose${lost.length > 1 ? '' : 's'} concentration on ${p.name} while marching: a jolt, a stumble, a word misplaced, and the leg's work is spoiled (table rule).`, 'warn');
      if (!who.length) continue;
    }
    // Same helper limit as a day at the workbench; training is time with the trainer, so trainees don't add up.
    const workers = p.learnKind || p.armsKind || isSoloWork(p.kind) ? 1 : s.settings.extraCraftHelpers ? who.length : Math.min(2, who.length);
    const got = hours * MARCH_WORK_RATE * workers;
    let bank = (p.marchWorkHours ?? 0) + got;
    const days = Math.min(p.daysRequired - p.daysDone, Math.floor(bank / WORKDAY_HOURS));
    bank -= days * WORKDAY_HOURS;
    p.daysDone += days;
    p.marchWorkHours = p.daysDone >= p.daysRequired ? 0 : Math.round(bank * 100) / 100;
    log(
      s,
      `${who.map((c) => c.name).join(' and ')} work${who.length > 1 ? '' : 's'} on ${p.name} while marching: ${+got.toFixed(2)} hour(s) of work at half rate (table rule). ${p.daysDone}/${p.daysRequired} workdays${p.marchWorkHours ? ` and ${p.marchWorkHours} h toward the next` : ''}.`,
    );
    if (p.daysDone >= p.daysRequired) progressFinish(s, p, ctx);
  }
}

/** Project kinds that are hands-on work hired artisans can help with. */
export const ARTISAN_KINDS: Project['kind'][] = ['nonmagical', 'potion'];

function progress(s: State, p: Project, ctx?: Ctx): void {
  const hired = ARTISAN_KINDS.includes(p.kind) ? (p.hiredArtisans ?? 0) : 0;
  const crafters =
    p.charIds.filter((id) => {
      const c = charById(s, id);
      return c && alive(c);
    }).length + hired;
  if (hired > 0) payGold(s, p.charIds, hired * HIRELING_WAGE.skilled, `${hired} hired artisan${hired > 1 ? 's' : ''} on ${p.name}`);
  // Normally only one other character can help (the DM can allow more). Training is time with the trainer: trainees don't speed each other up.
  // Activities are each participant's own week (carousing together doesn't make the week shorter).
  const amount = p.learnKind || p.armsKind || isSoloWork(p.kind) || (p.kind === 'activity' && activityOf(p.name)) ? 1 : Math.max(1, s.settings.extraCraftHelpers ? crafters : Math.min(2, crafters));
  p.daysDone = Math.min(p.daysRequired, p.daysDone + amount);
  if (p.daysDone >= p.daysRequired) progressFinish(s, p, ctx);
  else log(s, `A day's work on ${p.name}: ${p.daysDone}/${p.daysRequired} workdays.`);
}

function progressFinish(s: State, p: Project, ctx?: Ctx): void {
  {
    p.done = true;
    log(s, `Downtime project complete: ${p.name}.`, 'good');
    const act = p.kind === 'activity' && !p.learnKind && !p.armsKind ? activityOf(p.name) : null;
    if (p.learnKind) finishSpecialTraining(s, p);
    else if (p.armsKind) finishArmsTraining(s, p, ctx);
    else if (act && s.settings.downtimeOutcomes) {
      if (act === 'Training') {
        const learn = (p.learn || p.name.split(':')[1] || '').trim();
        for (const id of p.charIds) {
          const c = charById(s, id);
          if (!c || !learn) continue;
          c.trainedProficiencies = [...new Set([...(c.trainedProficiencies ?? []), learn])];
          log(s, `${c.name} has learned ${learn} and is now proficient.`, 'good');
        }
        if (ctx && Math.floor(p.daysRequired / 50) > 0 && die(10, ctx.rng) === 1) {
          const comp = COMPLICATIONS.Training[die(COMPLICATIONS.Training.length, ctx.rng) - 1];
          const c = charById(s, p.charIds[0]);
          if (c) applyComplication(s, ctx, c, comp);
        }
        if (!learn) log(s, `${p.name} is done. Name the language or tool on the character sheet.`);
      } else if (act === 'Relaxation') {
        for (const id of p.charIds) {
          const c = charById(s, id);
          if (!c) continue;
          // Xanathar's: relaxation needs at least a Modest lifestyle.
          if (s.settings.lifestyleRisks && !RELAXATION_NEEDS.includes(c.lifestyle)) {
            log(s, `${c.name} can't truly relax living ${LIFESTYLE_LABEL[c.lifestyle].toLowerCase()}: no benefit from the week (Xanathar's needs a Modest lifestyle or better).`, 'warn');
            continue;
          }
          c.recuperatedUntil = absNow(s) + 7 * MIN_PER_DAY;
          // Table rule: a real week off clears the mind.
          easeMind(s, c, c.stress, c.fear, 'comes back from the quiet week rested to the bone, the old knots in the chest gone');
        }
        log(s, `${p.name}: a quiet week. Advantage on saves against lingering diseases and poisons for the next 7 days, and one effect that blocks healing can end.`, 'good');
      } else {
        p.awaitingOutcome = true;
        log(s, `${p.name} is done. Roll its checks on the Downtime tab.`);
      }
    } else if (p.kind === 'activity' && p.notes) log(s, `${p.name} is done. Make the check: ${p.notes}. The DM decides the outcome.`);
    const trade = p.kind === 'buyMagic' || p.kind === 'sellMagic';
    if (trade && s.settings.downtimeOutcomes) {
      p.awaitingOutcome = true;
      log(s, `${p.name}: the search is over. Roll it on the Downtime tab.`);
      return;
    }
    deliverProduct(s, p);
    if (p.kind === 'buyMagic' && p.dealGp) payGold(s, p.charIds, p.dealGp, p.name);
    if (p.kind === 'sellMagic' && p.dealGp) receiveGold(s, p.charIds, p.dealGp, p.name);
    if (p.kind === 'spellcopy' && p.spell) {
      const wiz = charById(s, p.charIds[0]);
      if (wiz && !wiz.spells.some((x) => x.name.toLowerCase() === p.spell!.name.toLowerCase())) {
        wiz.spells.push({ name: p.spell.name, level: p.spell.level, prepared: false, alwaysPrepared: false });
        log(s, `${p.spell.name} is now in ${wiz.name}'s spellbook.`, 'good');
      }
    }
  }
  if (ctx && !p.awaitingOutcome) rivalAdvances(s, ctx);
}

/**
 * Fabricate (2024 PHB, level 4, 10 minutes): turns raw materials into a finished nonmagical object at once.
 * Skilled work like weapons and armor needs the caster to be proficient with the artisan's tools.
 */
export const fabricateProject = act((d, ctx, projectId: string, casterId: string) => {
  const p = d.projects.find((x) => x.id === projectId);
  const caster = charById(d, casterId);
  if (!p || p.done || p.kind !== 'nonmagical' || !caster || !alive(caster)) return;
  if (!caster.spells.some((x) => x.name.toLowerCase() === 'fabricate')) {
    log(d, `${caster.name} doesn't know Fabricate.`, 'warn');
    return;
  }
  if (!useSlot(d, caster, 4, 'Fabricate')) return;
  advanceMut(d, ctx, 10, 'work');
  const np = d.projects.find((x) => x.id === projectId)!;
  log(d, `${caster.name} casts Fabricate, and the raw materials reshape into ${np.name} in ten minutes.`, 'good');
  np.daysDone = np.daysRequired;
  np.hiredArtisans = 0;
  progressFinish(d, np, ctx);
});

/** One full downtime day: work 8 hours, eat and drink, then Long Rest from 23:00. */
export const downtimeDay = act((d, ctx, projectIds: string[]) => {
  const projects = d.projects.filter((p) => projectIds.includes(p.id) && !p.done);
  advanceMut(d, ctx, 8 * 60, 'work');
  for (const p of projects) progress(d, p, ctx);
  const eatAll = partyEat(d, ctx, 'topup');
  const drinkAll = partyDrink(eatAll, ctx, 'topup');
  Object.assign(d, drinkAll);
  if (d.minutes < 23 * 60) advanceMut(d, ctx, 23 * 60 - d.minutes, 'camp');
  const rested = longRest(d, ctx, false);
  Object.assign(d, rested);
});

// ---------------------------------------------------------------- potions and poison

/** 2024 DMG Potion Miscibility: roll when two potions are mixed (again for each extra potion). */
export const mixPotions = act((d, ctx, what: string) => {
  const roll = die(100, ctx.rng);
  const r = POTION_MISCIBILITY.find((x) => roll <= x.upTo)!;
  log(d, `Mixing ${what || 'potions'}: d100 = ${roll}. ${r.text}`, roll <= 25 ? 'bad' : roll >= 91 ? 'good' : 'info');
});

/** 2024 DMG: harvest one dose from a dead or Incapacitated venomous creature. 1d6 minutes, DC 20 Int (Nature) with a Poisoner's Kit. */
export const harvestPoison = act((d, ctx, charId: string, bonus: number, creature: string, hasKit: boolean = true) => {
  const c = charById(d, charId);
  if (!c || !alive(c)) return;
  if (!hasKit && !d.settings.improvised) return void log(d, `${c.name} needs a Poisoner's Kit to harvest poison.`, 'warn');
  // Table rule: without the kit, a knife and a vial at DC +5 and twice the time.
  const dc = hasKit ? POISON_HARVEST_DC : IMPROVISED_HARVEST_DC;
  const mins = die(6, ctx.rng) * (hasKit ? 1 : IMPROVISED_TIME);
  const tool = hasKit ? "with a Poisoner's Kit" : 'with only a knife and a vial';
  advanceMut(d, ctx, mins, 'camp');
  const r = d20('normal', ctx.rng);
  const total = r.value + bonus - 2 * c.exhaustion;
  const name = creature || 'the creature';
  const me = charById(d, charId)!;
  if (total >= dc) {
    const y = poisonYield(creature);
    const have = me.inventory.find((i) => i.name === y.name && !i.containerId);
    if (have) have.qty += 1;
    else me.inventory.push({ id: uid(), name: y.name, qty: 1, weight: 0, source: 'manual', valueGp: y.valueGp, container: null, ammo: null });
    log(d, `${me.name} works over ${name} for ${mins} min ${tool}: Int (Nature) ${r.value} ${signed(bonus - 2 * c.exhaustion)} = ${total} vs DC ${dc}. One dose harvested; nothing more can be taken from it. ${y.note}${y.valueGp ? ` A buyer would pay ${fmtGp(y.valueGp / 2)} for it.` : ''}`, 'good');
  } else if (total <= dc - 5) {
    log(d, `${me.name} botches the harvest from ${name} ${tool} (${total} vs DC ${dc}, failed by 5 or more) and is exposed to its poison. Apply the creature's poison effect.`, 'bad');
  } else {
    log(d, `${me.name} spends ${mins} min on ${name} ${tool} but can't extract any poison (${total} vs DC ${dc}).`, 'warn');
  }
});

/**
 * Testing food, drink, an object, a container or a plant. The DM says whether it's tainted; the tester learns it
 * only on a success. Tool checks are the 2024 PHB Utilize entries; without a tool, an improvised check at DC +5 (table rule).
 * Advantage when also proficient in a skill that applies (2024 PHB).
 */
export const testSubstance = act((d, ctx, testerId: string, kind: TestKind, method: string, bonus: number, tainted: boolean, what: string, advantage: boolean = false) => {
  const c = actorById(d, testerId);
  if (!c) return;
  const thing = what.trim() || ({ food: 'the food', drink: 'the drink', object: 'it', container: 'the container', plant: 'the plant' } as const)[kind];
  const tool = TOOL_TESTS.find((t) => t.id === method && t.kinds.includes(kind));
  if (!tool && !d.settings.improvised) return void log(d, `Without the right tool, ${c.name} can't test ${thing} (improvised attempts are off in Settings).`, 'warn');
  if (tool && !c.inventory.some((i) => tool.match.test(i.name))) return void log(d, `${c.name} has no ${tool.tool}.`, 'warn');
  const imp = IMPROVISED_TESTS[kind];
  const dc = tool ? tool.dc : imp.dc;
  const r = d20(advantage && tool ? 'advantage' : 'normal', ctx.rng);
  const total = r.value + bonus - 2 * c.exhaustion;
  const check = tool ? `${tool.ability} with ${tool.tool}` : imp.check;
  const roll = `${check} ${r.rolls.join('/')} ${signed(bonus - 2 * c.exhaustion)} = ${total} against DC ${dc}`;
  const verb = tool ? `tests ${thing} with ${tool.tool}` : `${imp.how} ${thing}`;
  if (total < dc) return void log(d, `${c.name} ${verb} (${roll}) and can't tell either way.`, 'warn');
  const found: Record<TestKind, [string, string]> = {
    food: ['catches a sour, wrong note: it has spoiled or been tampered with', 'finds nothing wrong: it is safe to eat'],
    drink: ['notices a faint bitterness that shouldn’t be there: it has been poisoned', 'finds nothing wrong: it is safe to drink'],
    object: ['spots a telltale residue: it has been poisoned', 'finds no trace of poison'],
    container: ['can tell it recently held something foul or poisonous', 'can tell it held nothing harmful in the past day'],
    plant: ['recognizes it: poisonous, not to be eaten', 'recognizes it: safe to eat'],
  };
  log(d, `${c.name} ${verb} (${roll}) and ${found[kind][tainted ? 0 : 1]}.`, tainted ? 'bad' : 'good');
});
export { TEST_KIND_LABEL };

// ---------------------------------------------------------------- mixed potions, lifestyle risks, renown

const HEALING_DICE: [RegExp, string][] = [
  [/supreme healing/i, '10d4+20'],
  [/superior healing/i, '8d4+8'],
  [/greater healing/i, '4d4+4'],
  [/healing/i, '2d4+2'],
];

/** Drinks one potion's effect with a multiplier on its numbers and duration (or makes it permanent). */
function drinkPotion(s: State, ctx: Ctx, c: Character, name: string, factor: number | 'permanent'): void {
  const heal = HEALING_DICE.find(([re]) => re.test(name));
  if (heal) {
    const amt = rollExpr(heal[1], ctx.rng) ?? 0;
    if (factor === 'permanent') {
      c.maxHp += amt;
      log(s, `${name} works permanently: ${c.name}'s HP maximum rises by ${amt}.`, 'good');
      return;
    }
    Object.assign(s, changeHp(s, ctx, c.id, Math.max(1, Math.floor(amt * factor))));
    return;
  }
  const preset = EFFECT_PRESETS.find((p) => p.kind === 'potion' && p.name.toLowerCase() === name.toLowerCase());
  const base = preset?.minutes ?? 60;
  s.effects.push({ id: uid(), name, kind: 'potion', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(s), endsAt: factor === 'permanent' ? null : absNow(s) + Math.max(1, Math.round(base * factor)), notes: factor === 'permanent' ? 'Permanent, from mixed potions.' : factor === 1 ? '' : `Numbers and duration ×${factor} from mixed potions.` });
}

/** Mixes (or drinks together) two potions from the inventory and applies the 2024 DMG Potion Miscibility result. */
export const mixInventoryPotions = act((d, ctx, charId: string, itemA: string, itemB: string) => {
  const c = charById(d, charId);
  const a = c?.inventory.find((i) => i.id === itemA);
  const b = c?.inventory.find((i) => i.id === itemB && (i.id !== itemA || i.qty > 1));
  if (!c || !a || !b) return;
  const names = [a.name, b.name];
  for (const it of [a, b]) it.qty -= 1;
  c.inventory = c.inventory.filter((i) => i.qty > 0);
  const roll = die(100, ctx.rng);
  const r = POTION_MISCIBILITY.find((x) => roll <= x.upTo)!;
  log(d, `${c.name} mixes ${names[0]} and ${names[1]}: d100 = ${roll}. ${r.text}`, roll <= 25 ? 'bad' : roll >= 91 ? 'good' : 'info');
  const pick = () => names[die(2, ctx.rng) - 1];
  if (roll === 1) return dealDamage(d, ctx, c.id, rollExpr('4d10', ctx.rng) ?? 22);
  if (roll <= 8) return void Object.assign(d, exposePoison(d, ctx, c.id, "Assassin's Blood", null));
  if (roll <= 15) return;
  if (roll <= 25) return drinkPotion(d, ctx, charById(d, charId)!, pick(), 1);
  if (roll <= 35) return names.forEach((n) => drinkPotion(d, ctx, charById(d, charId)!, n, 0.5));
  if (roll <= 90) return names.forEach((n) => drinkPotion(d, ctx, charById(d, charId)!, n, 1));
  if (roll <= 99) {
    const doubled = pick();
    return names.forEach((n) => drinkPotion(d, ctx, charById(d, charId)!, n, n === doubled ? 2 : 1));
  }
  drinkPotion(d, ctx, charById(d, charId)!, pick(), 'permanent');
});

/** Highest faction renown a character's party holds (factions are party-wide in this tracker). */
const bestRenown = (s: State): number => Math.max(0, ...s.factions.map((f) => f.renown));

/**
 * Table rule (the 2024 PHB says lifestyles have no inherent consequences, but describes the risks):
 * once a week in town, the poor risk theft and disease and the rich draw attention. Renown 3+ means
 * shelter in need, which spares Wretched characters the street.
 */
function lifestyleRisks(s: State, ctx: Ctx): void {
  if (!s.settings.lifestyleRisks || !s.place.settlement) return;
  trackLowLife(s);
  if ((s.dayIndex + 1) % 7 !== 0) return;
  const chance = (n: number) => die(n, ctx.rng) === 1;
  const hurt = (id: string, n: number) => Object.assign(s, changeHp(s, ctx, id, -n));
  for (const id of adventurers(s).map((c) => c.id)) {
    const me = () => charById(s, id)!;
    const c = me();
    const steal = (dice: string) => {
      const who = me();
      // Half the time the thief takes something from the pack instead of the purse.
      const loose = who.inventory.filter((i) => i.qty > 0 && !i.container && !i.scattered && (i.valueGp ?? 0) > 0);
      if (loose.length && (who.gp <= 0 || die(2, ctx.rng) === 1)) {
        const it = loose[die(loose.length, ctx.rng) - 1];
        useUpOne(who, it);
        return void status(s, who, 'robbed', `${who.name} finds their ${it.name} gone, taken while they slept or looked away (table rule).`, 'warn');
      }
      const gp = Math.min(who.gp, rollExpr(dice, ctx.rng) ?? 1);
      if (gp <= 0) return;
      spendWealth(who, gp);
      log(s, `${who.name} notices their purse is lighter: ${fmtGp(gp)} gone, lifted while living ${LIFESTYLE_LABEL[livingOf(s, who)].toLowerCase()} (table rule).`, 'warn');
    };
    switch (livingOf(s, c)) {
      case 'wretched': {
        if (bestRenown(s) >= 3) break;
        const o = WEEKLY_ODDS.wretched;
        if (chance(o.theft)) steal('1d6');
        if (chance(o.roughedUp)) {
          status(s, me(), 'hurt', `${me().name} is roughed up sleeping rough on the street (table rule).`, 'warn');
          hurt(id, die(4, ctx.rng));
        }
        if (chance(o.ratBite)) ratBite(s, ctx, id);
        if (chance(o.vermin)) vermin(s, ctx, me());
        if (chance(o.cackle)) crowdFever(s, ctx, me(), 'a feverish stranger who laughed all night in the doorway beside them');
        if (chance(o.watch)) townWatch(s, ctx, me());
        if (chance(o.brokenNight)) {
          me().restless = true;
          status(s, me(), 'shakenAwake', `${me().name} is kicked awake, rained on and moved along all week: their next Long Rest removes no Exhaustion (table rule).`, 'warn');
        }
        const w = me();
        w.stress += WRETCHED_STRESS;
        status(s, w, 'stressUp', `A week on the street grinds ${w.name} down: Stress ${w.stress} (table rule).`, 'warn');
        break;
      }
      case 'squalid': {
        const o = WEEKLY_ODDS.squalid;
        if (chance(o.theft)) steal('1d6');
        if (chance(o.spoiledFood) && s.settings.rawFoodRisk) requestSave(s, ctx, me(), 'raw', SPOILED_FOOD_DC, 'normal', 'a bowl of gone-off stew from the boarding house');
        if (chance(o.ratBite)) ratBite(s, ctx, id);
        if (chance(o.vermin)) vermin(s, ctx, me());
        if (chance(o.cackle)) crowdFever(s, ctx, me(), 'a cheap tonic from a hawker in the boarding house');
        if (chance(o.shakedown)) shakedown(s, ctx, id);
        if (chance(o.fire)) tenementFire(s, ctx, id);
        break;
      }
      case 'poor':
        if (chance(6) && die(2, ctx.rng) === 1) steal('1d4');
        break;
      case 'aristocratic': {
        const r = die(6, ctx.rng);
        if (r === 1) steal('2d10');
        else if (r === 2) log(s, `Word of ${c.name}'s wealth spreads: someone seeks their patronage, a loan or a favor (table rule).`, 'info');
        else if (r === 3) log(s, `${c.name} receives an invitation from someone who wants to be seen with them (table rule).`, 'info');
        break;
      }
      case 'wealthy':
        if (chance(6)) log(s, `A petitioner approaches ${c.name}, having heard they can afford to help (table rule).`, 'info');
        break;
    }
  }
}

/** A rat bite in the night (table rule): 1 Piercing damage, and it counts toward Sewer Plague (the DMG names rats as carriers). */
function ratBite(s: State, ctx: Ctx, id: string): void {
  const c = charById(s, id)!;
  status(s, c, 'hurt', `${c.name} wakes to a sharp pain: a rat has bitten them in the night (table rule).`, 'warn');
  Object.assign(s, changeHp(s, ctx, id, -RAT_BITE_DAMAGE));
  const me = charById(s, id)!;
  if (s.settings.wildNeedsPurifying) waterborneIllness(s, ctx, me);
}

/** Rats and damp (table rule): a day of Rations eaten, or a piece of gear chewed or rotted. */
function vermin(s: State, ctx: Ctx, c: Character): void {
  const day = foodNeedLb(c);
  if (c.rationsLb >= day && die(2, ctx.rng) === 1) {
    c.rationsLb = round2(c.rationsLb - day);
    return void status(s, c, 'robbed', `Rats have chewed into ${c.name}'s pack: a day's Rations gone (table rule).`, 'warn');
  }
  const sound = c.inventory.filter((i) => !i.damaged && !i.scattered && i.qty > 0 && (CLOTH.test(i.name) || /pack|bag|sack|book|paper|parchment|rations?|boots|leather/i.test(i.name)));
  if (!sound.length) return;
  const it = sound[die(sound.length, ctx.rng) - 1];
  if (it.qty > 1) {
    it.qty -= 1;
    c.inventory.push({ ...it, id: uid(), qty: 1, damaged: true });
  } else it.damaged = true;
  status(s, c, 'robbed', `Damp and gnawing teeth have got at ${c.name}'s ${it.name}: it's damaged (table rule; mend it on the Characters tab (HP & gear)).`, 'warn');
}

/** Cackle Fever from a crowded flophouse or a cheap tainted elixir (table rule; the 2024 DMG names both). Gnomes are immune. */
function crowdFever(s: State, ctx: Ctx, c: Character, how: string): void {
  if (/gnome/i.test(c.species)) return;
  status(s, c, 'contagionOnset', `${c.name} has been close to ${how}.`, 'warn');
  exposeContagionMut(s, ctx, c.id, 'cackle', true);
}

/** A gang comes for protection money (table rule): pay up, or take a beating that may make an enemy. */
function shakedown(s: State, ctx: Ctx, id: string): void {
  const c = charById(s, id)!;
  const ask = rollExpr(SHAKEDOWN_GP, ctx.rng) ?? 3;
  if (c.gp >= ask) {
    spendWealth(c, ask);
    return void log(s, `Local toughs lean on ${c.name} for protection money: ${fmtGp(ask)} paid to be left alone (table rule).`, 'warn');
  }
  status(s, c, 'hurt', `Local toughs want ${fmtGp(ask)} in protection money ${c.name} doesn't have, so they take it out of their hide (table rule).`, 'bad');
  Object.assign(s, changeHp(s, ctx, id, -(rollExpr(SHAKEDOWN_DAMAGE, ctx.rng) ?? 3)));
  if (die(SHAKEDOWN_RIVAL_ODDS, ctx.rng) === 1 && !s.rivals.some((r) => r.name === 'The tenement gang')) {
    s.rivals.push({ id: uid(), name: 'The tenement gang', idea: 'A street gang running protection in the slums', goal: `Make an example of ${c.name}`, assets: 'Toughs, lookouts, a fence', plans: [], pressure: 1, active: true });
    log(s, 'The gang won’t forget the defiance: they become a Rival (table rule).', 'warn');
  }
}

/** The town watch moves the homeless on (table rule): a lost night, a fine, or a few days in the cells. */
function townWatch(s: State, ctx: Ctx, c: Character): void {
  const r = die(3, ctx.rng);
  if (r === 1) {
    c.restless = true;
    return void status(s, c, 'shakenAwake', `The watch rousts ${c.name} from a doorway in the small hours and moves them on: their next Long Rest removes no Exhaustion (table rule).`, 'warn');
  }
  if (r === 2) {
    const gp = Math.min(Math.max(0, c.gp), rollExpr(WATCH_FINE, ctx.rng) ?? 2);
    if (gp > 0) spendWealth(c, gp);
    return void log(s, `The watch fines ${c.name} ${fmtGp(gp)} for vagrancy (table rule).`, 'warn');
  }
  const days = rollExpr(WATCH_JAIL_DAYS, ctx.rng) ?? 2;
  s.effects.push({ id: uid(), name: 'In jail', kind: 'other', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(s), endsAt: absNow(s) + days * MIN_PER_DAY, notes: 'Locked up for vagrancy.' });
  status(s, c, 'jailed', `The watch locks ${c.name} up for vagrancy: ${days} day${days > 1 ? 's' : ''} in the cells (table rule).`, 'bad');
}

/** A fire in the tenement (table rule, rare): 2d6 Fire damage and maybe some belongings lost. */
function tenementFire(s: State, ctx: Ctx, id: string): void {
  const c = charById(s, id)!;
  noticed(s, 'hurt', [c], `Fire! Smoke pours up the stairwell of ${c.name}'s boarding house, and they get out through the flames (table rule).`, 'bad');
  Object.assign(s, changeHp(s, ctx, id, -(rollExpr(FIRE_DAMAGE, ctx.rng) ?? 7)));
  const me = charById(s, id)!;
  const left = me.inventory.filter((i) => i.qty > 0 && !i.scattered);
  if (left.length && die(2, ctx.rng) === 1) {
    const it = left[die(left.length, ctx.rng) - 1];
    me.inventory = me.inventory.filter((x) => x.id !== it.id);
    log(s, `${me.name}'s ${it.qty > 1 ? `${it.qty} × ` : ''}${it.name} burned with the room.`, 'warn');
  }
}

/** Counts days of low living in town; after 30, respectable folk shun the character until they live better (table rule). */
function trackLowLife(s: State): void {
  for (const c of adventurers(s)) {
    const life = livingOf(s, c);
    const low = isLowLife(life) && !(life === 'wretched' && bestRenown(s) >= 3);
    const shunned = s.effects.find((e) => e.name === 'Shunned by respectable folk' && e.targetIds.includes(c.id));
    if (!low) {
      c.lowLifeDays = 0;
      if (shunned) {
        s.effects = s.effects.filter((e) => e !== shunned);
        log(s, `Living better again, ${c.name} is no longer shunned by respectable folk.`, 'good');
      }
      continue;
    }
    c.lowLifeDays = (c.lowLifeDays ?? 0) + 1;
    if (c.lowLifeDays >= SHUNNED_AFTER_DAYS && !shunned) {
      s.effects.push({ id: uid(), name: 'Shunned by respectable folk', kind: 'other', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(s), endsAt: null, notes: 'Disadvantage on Charisma checks with the upper classes, and respectable factions may think less of them. Ends when they live Poor or better.' });
      status(s, c, 'lifestyleDrops', `After a month living ${LIFESTYLE_LABEL[life].toLowerCase()}, ${c.name} looks and smells it: respectable folk cross the street (table rule: Disadvantage on Charisma checks with the upper classes).`, 'warn');
    }
  }
}

/** Renown perks the DMG names at each threshold, announced when a score crosses it. */
function renownMilestone(before: number, after: number): string {
  if (before < 50 && after >= 50) return ' The faction would raise a small army, find a Rare magic item or lend a spellcaster for the party.';
  if (before < 10 && after >= 10) return ' Potions, scrolls, favors and backup are now within reach.';
  if (before < 3 && after >= 3) return ' Members now treat the party as respected (Friendly, shelter in need).';
  return '';
}

/** DMG: +1 for advancing the group's interests, +2 for a mission it assigned or that directly benefits it, +3 or +4 for a hugely significant quest. */
export const MISSION_RENOWN: { gain: number; label: string }[] = [
  { gain: 1, label: 'Advanced its interests' },
  { gain: 2, label: 'Assigned or directly helpful mission' },
  { gain: 3, label: 'Hugely significant quest' },
  { gain: 4, label: 'Hugely significant quest (exceptional)' },
];

export const factionMission = act((d, _ctx, factionId: string, gain?: number) => {
  const f = d.factions.find((x) => x.id === factionId);
  if (!f) return;
  const before = f.renown;
  f.renown += Math.max(1, Math.min(4, Math.round(gain ?? 2)));
  log(d, `${MISSION_RENOWN.find((m) => m.gain === f.renown - before)?.label ?? 'Work'} for ${f.name}: renown ${before} → ${f.renown}.${renownMilestone(before, f.renown)}`, 'good');
});

/**
 * Lowers a faction's renown (never below 0). A serious offense against the group (table rule, with
 * prestigeRules on) also costs 1 trust on each Mark of Prestige that faction granted.
 */
export function loseRenown(s: State, f: Faction, amount: number, why: string, serious: boolean): void {
  const before = f.renown;
  f.renown = Math.max(0, f.renown - amount);
  if (f.renown !== before) log(s, `Renown with ${f.name} drops ${before} → ${f.renown}: ${why}.`, 'warn');
  if (!serious || !s.settings.prestigeRules) return;
  for (const m of s.marks) if (m.factionId === f.id && activeMark(m)) loseTrust(s, m, `${f.name} hears of it (${why})`);
}

function gainRenown(s: State, f: Faction, amount: number, why: string): void {
  const before = f.renown;
  f.renown += amount;
  log(s, `Renown with ${f.name} rises ${before} → ${f.renown}: ${why}.${renownMilestone(before, f.renown)}`, 'good');
}

/** The + and − buttons on a faction. A loss marked serious is an offense against the group. */
export const changeRenown = act((d, _ctx, factionId: string, delta: number, why: string, serious?: boolean) => {
  const f = d.factions.find((x) => x.id === factionId);
  if (!f || !delta) return;
  if (delta > 0) gainRenown(d, f, delta, why || 'the DM awards it');
  else loseRenown(d, f, -delta, why || 'a serious offense against the group', serious ?? true);
});

/** DMG group involvement: with Renown 1+, 10 × current renown days of minor tasks and socializing raise it by 1. */
export const involvementDaysNeeded = (f: Faction): number => Math.max(10, 10 * f.renown);

export const factionInvolvement = act((d, ctx, factionId: string, days: number) => {
  for (let i = 0; i < Math.max(1, Math.round(days)); i++) {
    const f0 = d.factions.find((x) => x.id === factionId);
    if (!f0 || f0.renown < 1) return;
    Object.assign(d, downtimeDay(d, ctx, []));
    const f = d.factions.find((x) => x.id === factionId)!;
    f.involvementDays = (f.involvementDays ?? 0) + 1;
    if (f.involvementDays >= involvementDaysNeeded(f)) {
      f.involvementDays = 0;
      gainRenown(d, f, 1, 'days of minor tasks and time among its members');
    }
  }
  const f = d.factions.find((x) => x.id === factionId);
  if (f && f.renown >= 1) log(d, `Time spent with ${f.name}: ${f.involvementDays ?? 0}/${involvementDaysNeeded(f)} days toward the next point of renown.`);
});

/** Level-based renown (DMG option): a faction tied to a character keeps renown at least the table's value for their level. */
function syncLevelRenown(s: State): void {
  for (const f of s.factions) {
    if (!f.levelOf) continue;
    const c = charById(s, f.levelOf);
    const r = c ? levelRenown(c.level) : 0;
    if (c && r > f.renown) {
      log(s, `${f.name} renown rises with ${c.name}'s level (level ${c.level}): ${f.renown} → ${r}.${renownMilestone(f.renown, r)}`, 'good');
      f.renown = r;
    }
  }
}

/** Faction supply at Renown 10+: Common or Uncommon potions and scrolls at their 2024 DMG value (consumables half). */
export const factionSupply = act((d, _ctx, charId: string, name: string, rarity: 'common' | 'uncommon') => {
  const c = charById(d, charId);
  if (!c || bestRenown(d) < 10) return;
  const gp = rarity === 'common' ? 50 : 200;
  if (c.gp < gp) return void log(d, `${c.name} can't afford ${name} (${gp} GP).`, 'warn');
  spendWealth(c, gp);
  c.inventory.push({ id: uid(), name, qty: 1, weight: 0.5, source: 'manual', valueGp: gp, container: null, ammo: null });
  log(d, `${c.name} gets ${name} through faction contacts for ${gp} GP.`, 'good');
});

// ---------------------------------------------------------------- journey obstacles

export const addObstacle = act((d, _ctx, stageId: string, preset: Omit<Obstacle, 'id'>) => {
  const st = d.journey.find((x) => x.id === stageId);
  if (!st) return;
  st.obstacles = [...(st.obstacles ?? []), { id: uid(), ...preset }];
});

/** Tries to get past an obstacle: one leader's check, or a group check where half or more must succeed (2024 PHB). */
export const resolveObstacle = act((d, ctx, stageId: string, obstacleId: string, bonus: number, leaderId: string | null) => {
  const st = d.journey.find((x) => x.id === stageId);
  const ob = st?.obstacles?.find((x) => x.id === obstacleId);
  if (!st || !ob || ob.resolved) return;
  const travelers = d.characters.filter((c) => alive(c) && !c.dying && !c.stable);
  const rollers = ob.group ? travelers : travelers.filter((c) => c.id === leaderId).slice(0, 1);
  if (!rollers.length) return;
  const results = rollers.map((c) => {
    const r = d20('normal', ctx.rng).value + bonus - 2 * c.exhaustion;
    return { c, r, ok: r >= ob.dc };
  });
  const passed = ob.group ? results.filter((x) => x.ok).length * 2 >= results.length : results[0].ok;
  ob.resolved = passed ? 'passed' : 'failed';
  log(d, `${ob.name}: ${ob.check} DC ${ob.dc}${ob.group ? ' (group check)' : ''}. ${results.map((x) => `${x.c.name} ${x.r}`).join(', ')}. ${passed ? 'They get past it.' : 'They fail.'}`, passed ? 'good' : 'bad');
  if (passed) return;
  switch (ob.consequence) {
    case 'delay': {
      const hours = Number(ob.amount) || 4;
      log(d, `The obstacle costs ${hours} hour(s).`, 'warn');
      advanceMut(d, ctx, hours * 60, 'camp');
      return;
    }
    case 'exhaustion':
      for (const c of travelers) {
        const n = rollExpr(ob.amount, ctx.rng) ?? 1;
        gainExhaustion(d, c, n, ob.name, /blizzard|snow|ice/i.test(ob.name) ? 'cold' : 'march');
      }
      return;
    case 'damage':
      for (const c of travelers) Object.assign(d, changeHp(d, ctx, c.id, -(rollExpr(ob.amount, ctx.rng) ?? 0)));
      return;
    case 'condition':
      for (const c of travelers)
        d.effects.push({ id: uid(), name: `${ob.condition ?? 'Condition'} (${ob.name})`, kind: 'other', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(d), endsAt: ob.minutes ? absNow(d) + ob.minutes : null, notes: ob.minutes ? '' : 'Lasts until removed by magic.' });
      log(d, `Everyone is ${ob.condition ?? 'affected'}${ob.minutes ? ` for ${formatDuration(ob.minutes)}` : ' until magic removes it'}.`, 'bad');
  }
});

// ---------------------------------------------------------------- downtime activity outcomes

/** Rolls a finished activity's checks (optional Xanathar's rules) and applies the gold, contacts, favors, jail time and complications. */
export const resolveActivityProject = act((d, ctx, projectId: string, o: ActivityOpts, charId?: string) => {
  const p = d.projects.find((x) => x.id === projectId);
  const id = p ? activityOf(p.name) : null;
  const done = p?.resolvedFor ?? [];
  const who = charId ?? p?.charIds.find((x) => !done.includes(x));
  const c = p && who ? charById(d, who) : undefined;
  if (!p || !id || !c || done.includes(c.id)) return;
  const heat = id === 'Crime' && d.rivalHeat;
  if (heat) d.rivalHeat = false;
  const weeks = o.weeks ?? weeksIn(p.daysRequired);
  const r = resolveActivity(id, { ...o, weeks, lazyWeeks: c.workLazyWeeks ?? 0, ...(heat ? { dc: Math.min(25, (o.dc ?? 10) + 5) } : {}) }, ctx.rng);
  if (id === 'Working a trade') c.workLazyWeeks = r.lazyWeeks || undefined;
  // Xanathar's: unspecified allied contacts and unused temple favors are capped at 1 + Charisma modifier (minimum 1).
  const cha = abilityScore(c, 'cha');
  const cap = bondCap(cha == null ? 0 : abilityMod(cha));
  for (const [re, what] of [[/^Allied contact/, 'allied contacts'], [/^Temple favor/, 'unused temple favors']] as const) {
    const held = (c.notes ?? '').split('\n').filter((l) => re.test(l)).length;
    const fresh = r.notes.filter((n) => re.test(n));
    const room = Math.max(0, cap - held);
    if (fresh.length > room) {
      let drop = fresh.length - room;
      r.notes = r.notes.filter((n) => !(re.test(n) && drop-- > 0));
      log(d, `${c.name} can hold only ${cap} ${what} at a time (1 + Charisma modifier): ${fresh.length - room} more go${fresh.length - room === 1 ? 'es' : ''} to waste.`, 'warn');
    }
  }
  if (heat) log(d, 'Bribed officials are watching: the job is harder (+5 DC).', 'warn');
  p.resolvedFor = [...done, c.id];
  const alive = p.charIds.filter((x) => charById(d, x));
  p.awaitingOutcome = alive.some((x) => !p.resolvedFor!.includes(x));
  const line = `${p.charIds.length > 1 ? `${c.name}: ` : ''}${r.text}`;
  p.outcome = p.outcome && p.charIds.length > 1 ? `${p.outcome} · ${line}` : line;
  log(d, `${c.name}'s ${p.name}: ${r.text}.`, r.gp < 0 || r.jailDays ? 'bad' : r.gp > 0 || r.notes.length ? 'good' : 'info');
  // Weekly costs (company kept, research money) beyond what the project already charged, shared out per participant.
  const covered = p.costGp / Math.max(1, p.charIds.length);
  const extra = Math.round(Math.max(0, (r.spent ?? 0) - covered) * 100) / 100;
  if (extra > 0) payGold(d, [c.id], extra, `${p.name} (${weeks} week${weeks > 1 ? 's' : ''})`);
  if (r.gp > 0) gainWealth(c, r.gp);
  if (r.gp < 0) spendWealth(c, -r.gp);
  if (r.debt) addDebtMut(d, c.id, 'The gambling house', 'criminal', r.debt);
  if (r.notes.length) c.notes = [c.notes, ...r.notes.map((n) => `${n} (${stamp(d)})`)].filter(Boolean).join('\n');
  if (r.lifestyle && id === 'Working a trade') log(d, `${c.name}'s work covers a ${LIFESTYLE_LABEL[r.lifestyle].toLowerCase()} lifestyle while it lasts.`);
  if (r.jailDays) d.effects.push({ id: uid(), name: 'In jail', kind: 'other', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(d), endsAt: absNow(d) + r.jailDays * MIN_PER_DAY, notes: 'Serving time for a crime.' });
  if (r.jailDays && id === 'Crime' && d.settings.notoriety) addHeatMut(d, d.place.name, 'serious', [c.id], 'caught at a crime');
  for (const n of r.notes) {
    const m = /^(Allied|Hostile) contact/.exec(n);
    if (m) addContactMut(d, { name: `New ${m[1].toLowerCase()} contact (${p.name})`, role: 'Other', place: d.place.name, bond: m[1] === 'Allied' ? 1 : -1, knownBy: [c.id], notes: n });
  }
  if (id === 'Research' && r.lore) researchPayoff(d, c, p, r.lore, r.best ?? 0);
  // Table rule: good company and worship ease the mind, week by week.
  const wks = r.jailDays ? 1 : weeks;
  if (id === 'Carousing') easeMind(d, c, CAROUSING_STRESS_PER_WEEK * wks, 0, 'feels lighter after nights of drink, song and laughter');
  if (id === 'Religious service') easeMind(d, c, SERVICE_STRESS_PER_WEEK * wks, SERVICE_FEAR_PER_WEEK * wks, 'finds a steadiness in the hymns and quiet ritual');
  if (id === 'Religious service' && d.settings.piety) templeServicePiety(d, c, wks);
  for (const comp of r.complications ?? (r.complication ? [r.complication] : [])) applyComplication(d, ctx, c, comp);
  rivalAdvances(d, ctx);
});

export interface DealOpts {
  /** Charisma (Persuasion). */
  bonus: number;
  advantage?: boolean;
  /** Buying: total gold spent on the search (100 GP minimum; each 100 beyond the first adds +1). */
  gp?: number;
  /** Buying: optional campaign magic level (−10 low, +10 high). */
  magic?: MagicLevel;
}

/** Rolls a finished magic item search (Xanathar's): pays the search money and lays out any offers to accept or turn down. */
export const resolveDealProject = act((d, ctx, projectId: string, o: DealOpts) => {
  const p = d.projects.find((x) => x.id === projectId);
  const c = p ? charById(d, p.charIds[0]) : undefined;
  if (!p || !c || (p.kind !== 'buyMagic' && p.kind !== 'sellMagic')) return;
  const weeks = weeksIn(p.daysRequired);
  const rarity = p.rarity ?? 'uncommon';
  const consumable = !!p.consumable;
  const r =
    p.kind === 'buyMagic'
      ? resolveBuying({ bonus: o.bonus, weeks, gp: o.gp, rarity, consumable, advantage: o.advantage, magic: o.magic }, ctx.rng)
      : resolveSelling({ bonus: o.bonus, weeks, rarity, consumable, advantage: o.advantage }, ctx.rng);
  p.awaitingOutcome = false;
  p.outcome = r.text;
  payGold(d, p.charIds, r.spent, `${p.kind === 'buyMagic' ? 'searching for a seller' : 'spreading word of the sale'} (${p.name})`);
  log(d, `${c.name}'s ${p.name}: ${r.text}.`, r.offers.length ? 'good' : 'warn');
  for (const comp of r.complications) applyComplication(d, ctx, c, comp);
  if (r.offers.length) p.offers = r.offers;
  else log(d, 'No deal. Start a new search to try again.');
  rivalAdvances(d, ctx);
});

/** Takes one of a search's offers (by index), or turns them all down (null). */
export const answerDeal = act((d, _ctx, projectId: string, index: number | null) => {
  const p = d.projects.find((x) => x.id === projectId);
  if (!p?.offers?.length) return;
  const offer = index == null ? null : p.offers[index];
  p.offers = undefined;
  if (!offer) {
    p.outcome = `${p.outcome ?? ''} · turned down`;
    log(d, `${p.name}: the offer is turned down.`);
    return;
  }
  p.dealGp = offer.gp;
  p.outcome = `${p.outcome ?? ''} · ${p.kind === 'buyMagic' ? 'bought' : 'sold'} for ${fmtGp(offer.gp)}`;
  if (p.kind === 'buyMagic') {
    payGold(d, p.charIds, offer.gp, p.name);
    if (!p.product) p.product = { name: p.itemName?.trim() || `${p.rarity ? RARITY_LABEL[p.rarity] : 'Magic'} magic item`, qty: 1, magic: true };
    deliverProduct(d, p);
  } else {
    receiveGold(d, p.charIds, offer.gp, p.name);
    const name = p.itemName?.trim().toLowerCase();
    for (const id of p.charIds) {
      const c = charById(d, id);
      const i = name && c ? c.items.findIndex((x) => x.name.toLowerCase() === name) : -1;
      if (c && i >= 0) {
        c.items.splice(i, 1);
        log(d, `${c.name} hands over the ${p.itemName}.`);
        break;
      }
    }
  }
});

/** A complication's text, its rival (if any) and its mechanical effects. */
function applyComplication(d: State, ctx: Ctx, c: Character, comp: Complication): void {
  const rival = comp.rival ? pickRival(d, ctx) : undefined;
  log(d, `Complication for ${c.name}: ${comp.text}${rival ? ` (${rival.name} is behind it)` : ''}.`, 'warn');
  if (rival) rival.pressure += 1;
  if (comp.loseGp) {
    const [n, m] = comp.loseGp.split('*');
    const amt = Math.min(Math.max(0, c.gp), (rollExpr(n, ctx.rng) ?? Number(n)) * Number(m ?? 1));
    if (amt > 0) spendWealth(c, amt);
    log(d, `${c.name} is out ${fmtGp(amt)}.`, 'warn');
  }
  if (comp.debt) {
    const amt = (rollExpr(comp.debt.split('*')[0], ctx.rng) ?? 1) * Number(comp.debt.split('*')[1] ?? 1);
    addDebtMut(d, c.id, 'A noble whose debts you took on', 'noble', amt);
  }
  if (comp.jailDays) d.effects.push({ id: uid(), name: 'In jail', kind: 'other', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(d), endsAt: absNow(d) + comp.jailDays * MIN_PER_DAY, notes: comp.text });
}

function pickRival(d: State, ctx: Ctx): Rival | undefined {
  const act = d.rivals.filter((r) => r.active);
  return act.length ? act[die(act.length, ctx.rng) - 1] : undefined;
}

/** Xanathar's: each time downtime is resolved, a rival advances one of its plans (effects are table rules). */
function rivalAdvances(d: State, ctx: Ctx): void {
  const rival = pickRival(d, ctx);
  if (!rival) return;
  rival.pressure += 1;
  const own = rival.plans.filter((p) => p.trim());
  if (own.length && die(2, ctx.rng) === 1) {
    log(d, `Rival: ${rival.name} advances a plan: ${own[die(own.length, ctx.rng) - 1]}.`, 'warn');
  } else {
    const move = RIVAL_MOVES[die(RIVAL_MOVES.length, ctx.rng) - 1];
    log(d, `Rival: ${rival.name} ${move.text}.`, 'warn');
    switch (move.effect) {
      case 'rumor': {
        const f = d.factions.filter((x) => x.renown > 0);
        if (f.length) {
          const t = f[die(f.length, ctx.rng) - 1];
          loseRenown(d, t, 1, `${rival.name}'s rumors`, true);
        }
        break;
      }
      case 'sabotage': {
        const biz = d.businesses.filter((b) => !b.building);
        if (biz.length) {
          biz[die(biz.length, ctx.rng) - 1].sabotaged = true;
          log(d, `${biz[0].name}'s next roll takes −10 from the sabotage.`, 'warn');
        } else {
          const fac = d.bastions.flatMap((b) => b.facilities.filter((f) => f.kind === 'special' && f.built));
          if (fac.length) {
            fac[die(fac.length, ctx.rng) - 1].shutTurns = 1;
            log(d, 'A Bastion facility is put out of action for a turn.', 'warn');
          }
        }
        break;
      }
      case 'bribe':
        d.rivalHeat = true;
        log(d, 'The next crime the party attempts is +5 DC.', 'warn');
        break;
      case 'thugs': {
        const pcs = adventurers(d);
        if (pcs.length) {
          const v = pcs[die(pcs.length, ctx.rng) - 1];
          const gp = Math.min(v.gp, die(10, ctx.rng) * 5);
          if (gp > 0) spendWealth(v, gp);
          log(d, `${v.name} is roughed up and loses ${fmtGp(gp)}.`, 'warn');
        }
        break;
      }
      case 'legal': {
        const pcs = adventurers(d);
        if (pcs.length) addDebtMut(d, pcs[0].id, 'The magistrate (a fine)', 'lawful', die(6, ctx.rng) * 10, 0);
        break;
      }
    }
  }
  const esc = RIVAL_ESCALATION[rival.pressure];
  if (esc) log(d, `${rival.name} ${esc}.`, 'bad');
}

export const addRival = act((d, ctx, name: string, idea: string) => {
  const i = idea || RIVAL_IDEAS[die(RIVAL_IDEAS.length, ctx.rng) - 1];
  d.rivals.push({ id: uid(), name: name || i.split(' ').slice(1, 3).join(' '), idea: i, goal: '', assets: '', plans: [], pressure: 0, active: true });
  log(d, `A rival emerges: ${name || i}.`, 'warn');
});

export const advanceRival = act((d, ctx) => rivalAdvances(d, ctx));

// ---------------------------------------------------------------- group patrons and supernatural regions (Tasha's)

export const setPatron = act((d, _ctx, kind: PatronKind | null, name: string) => {
  if (!kind) {
    if (d.patron) log(d, `The party parts ways with ${d.patron.name}.`);
    d.patron = null;
    for (const c of d.characters) c.resources = c.resources.filter((r) => r.name !== GROUP_ASSISTANCE);
    return;
  }
  d.patron = { kind, name: name || PATRONS[kind].label, joinedDay: d.dayIndex, luxuryYear: null };
  for (const c of adventurers(d)) {
    if (!c.resources.some((r) => r.name === GROUP_ASSISTANCE)) c.resources.push({ id: uid(), name: GROUP_ASSISTANCE, max: 1, current: 1, recharge: 'long' });
  }
  log(d, `The party now serves ${d.patron.name} (${PATRONS[kind].label}). Each member can grant an ally Advantage once per Long Rest (Group Assistance).`, 'good');
});

/** Daily: patron salary. Lodging discounts are applied where lifestyle is charged. */
function patronDaily(s: State): void {
  const p = s.patron;
  if (!p) return;
  const info = PATRONS[p.kind];
  if (info.salaryGp) {
    const pcs = adventurers(s);
    for (const c of pcs) gainWealth(c, info.salaryGp);
    if (pcs.length) log(s, `${p.name} pays each member ${fmtGp(info.salaryGp)}.`);
  }
}

/** What a day of this lifestyle costs under the patron's lodging perks. */
export function patronLifestyleCost(s: State, lifestyle: Lifestyle): number {
  const base = LIFESTYLE_GP[lifestyle];
  const p = s.patron;
  if (!p) return base;
  const info = PATRONS[p.kind];
  if (p.luxuryUntilDay != null && s.dayIndex < p.luxuryUntilDay) return 0;
  const order: Lifestyle[] = ['wretched', 'squalid', 'poor', 'modest', 'comfortable', 'wealthy', 'aristocratic'];
  if (info.freeLifestyle && order.indexOf(lifestyle) <= order.indexOf(info.freeLifestyle)) return 0;
  if (info.comfortableAt != null && lifestyle === 'comfortable') return info.comfortableAt;
  return base;
}

/** Aristocrat: up to two weeks a year of aristocratic hospitality for free. */
export const patronLuxury = act((d, _ctx) => {
  const p = d.patron;
  if (!p || !PATRONS[p.kind].luxuryWeeks) return;
  const year = Math.floor(d.dayIndex / 365);
  if (p.luxuryYear === year) return void log(d, `${p.name}'s hospitality has already been enjoyed this year.`, 'warn');
  p.luxuryYear = year;
  p.luxuryUntilDay = d.dayIndex + 14;
  log(d, `${p.name} hosts the party in luxury for two weeks: lifestyle costs nothing until then.`, 'good');
});

/** Criminal syndicate: an assignment's client fee, of which the party gets 85%. */
export const patronAssignment = act((d, _ctx, feeGp: number) => {
  const p = d.patron;
  if (!p) return;
  const share = PATRONS[p.kind].assignmentShare ?? 1;
  const pcs = adventurers(d);
  const each = Math.round(((feeGp * share) / Math.max(1, pcs.length)) * 100) / 100;
  for (const c of pcs) gainWealth(c, each);
  log(d, `${p.name} pays out for the assignment: ${fmtGp(feeGp * share)}${share < 1 ? ` (${Math.round(share * 100)}% of the ${fmtGp(feeGp)} fee)` : ''}, ${fmtGp(each)} each.`, 'good');
});

/** Ancient being: a Common magic item from the patron's network for 2d4 × 10 GP (half for consumables). */
export const patronCommonItem = act((d, ctx, charId: string, name: string, consumable: boolean) => {
  const c = charById(d, charId);
  if (!c || d.patron?.kind !== 'ancient') return;
  const gp = (rollDice(2, 4, ctx.rng) * 10) / (consumable ? 2 : 1);
  if (c.gp < gp) return void log(d, `${c.name} can't afford ${name} (${fmtGp(gp)}).`, 'warn');
  spendWealth(c, gp);
  c.inventory.push({ id: uid(), name, qty: 1, weight: 1, source: 'manual', valueGp: gp, container: null, ammo: null });
  log(d, `${c.name} obtains ${name} through ${d.patron.name}'s network for ${fmtGp(gp)}.`, 'good');
});

export const setRegion = act((d, _ctx, kind: RegionKind | null) => {
  d.place.region = kind;
  log(d, kind ? `${d.place.name} is a supernatural region: ${REGIONS[kind].name}.` : `${d.place.name} is no longer treated as a supernatural region.`);
});

/** Rolls the region's effect table and applies the effects that run over time. */
export const rollRegionEffect = act((d, ctx, why: string) => regionRoll(d, ctx, why));

function regionRoll(d: State, ctx: Ctx, why: string): void {
  const kind = d.place.region;
  if (!kind) return;
  const info = REGIONS[kind];
  const roll = die(100, ctx.rng);
  const band = regionBand(kind, roll);
  const pcs = d.characters.filter((c) => alive(c));
  const one = pcs.length ? pcs[die(pcs.length, ctx.rng) - 1] : undefined;
  const targets = band.target === 'one' && one ? [one] : band.target === 'all' ? pcs : [];
  log(d, `${info.name} (${why}): d100 = ${roll}. ${band.label}${targets.length === 1 ? ` (${targets[0].name})` : ''}. See Tasha's for the full effect.`, 'warn');
  if (band.minutes) d.effects.push({ id: uid(), name: `${info.name}: ${band.label}`, kind: 'other', targetIds: targets.map((c) => c.id), casterId: null, concentration: false, shelter: false, startedAt: absNow(d), endsAt: absNow(d) + band.minutes, notes: band.auto === 'noRest' ? 'No Short or Long Rest is possible.' : band.auto === 'restSave' ? 'Resting requires a save or gives no benefit.' : '' });
  switch (band.auto) {
    case 'heal3d6':
      for (const c of pcs.filter((x) => x.diedAt == null)) Object.assign(d, changeHp(d, ctx, c.id, rollDice(3, 6, ctx.rng)));
      break;
    case 'lostHours': {
      const hours = rollDice(2, 10, ctx.rng);
      log(d, `The party walks in circles: ${hours} hours pass with no progress.`, 'bad');
      advanceMut(d, ctx, hours * 60, 'travel');
      break;
    }
    case 'hourlyExhaustion': {
      const hours = die(6, ctx.rng);
      for (let h = 0; h < hours; h++) for (const c of d.characters.filter((x) => alive(x))) if (!rollSave(c, 10, 'normal', ctx.rng).passed) gainExhaustion(d, c, 1, 'biting swarms', 'other');
      log(d, `The swarms last ${hours} hour(s).`, 'warn');
      break;
    }
    case 'storm':
      d.weather = { ...d.weather, precip: 'heavy', wind: 'strong', edited: true };
      log(d, 'A violent thunderstorm settles over the region and won’t lift until the party leaves.', 'warn');
      break;
    case 'sightRot':
      if (one) Object.assign(d, exposeContagion(d, ctx, one.id, 'sightRot', true));
      break;
    case 'coldDay':
      log(d, 'Extreme cold grips the region for a day: Con saves each hour without protection (DMG).', 'warn');
      break;
  }
}

/** True if a region effect forbids resting right now. */
function regionForbidsRest(s: State): boolean {
  const now = absNow(s);
  return s.effects.some((e) => e.notes === 'No Short or Long Rest is possible.' && (e.endsAt == null || e.endsAt > now));
}

// ---------------------------------------------------------------- debts (table rule)

function addDebtMut(d: State, debtorId: string, creditor: string, kind: CreditorKind, amount: number, rate: number = WEEKLY_INTEREST[kind], dueInDays: number = DUE_DAYS[kind]): Debt | undefined {
  if (amount <= 0) return;
  const c = charById(d, debtorId);
  const same = d.debts.find((x) => x.debtorId === debtorId && x.creditor === creditor && x.owed > 0);
  if (same) {
    same.owed = Math.round((same.owed + amount) * 100) / 100;
    same.principal += amount;
    log(d, `${c?.name ?? 'Someone'} now owes ${creditor} ${fmtGp(same.owed)}.`, 'warn');
    return same;
  }
  const debt: Debt = { id: uid(), debtorId, creditor, kind, principal: amount, owed: amount, rate, startedDay: d.dayIndex, dueDay: d.dayIndex + dueInDays, steps: [] };
  d.debts.push(debt);
  log(d, `${c?.name ?? 'Someone'} owes ${creditor} ${fmtGp(amount)}${rate ? ` at ${Math.round(rate * 100)}% a week` : ''}, due in ${dueInDays} days.`, 'warn');
  return debt;
}

/** Borrows money: the coin arrives now and the debt starts. */
export const borrow = act((d, _ctx, debtorId: string, creditor: string, kind: CreditorKind, amount: number, rate: number, dueInDays: number) => {
  const c = charById(d, debtorId);
  if (!c || amount <= 0) return;
  gainWealth(c, amount);
  addDebtMut(d, debtorId, creditor || CREDITOR_LABEL[kind].split(' (')[0], kind, amount, rate, dueInDays);
});

export const addDebt = act((d, _ctx, debtorId: string, creditor: string, kind: CreditorKind, amount: number) => void addDebtMut(d, debtorId, creditor, kind, amount));

export const payDebt = act((d, _ctx, debtId: string, amount: number) => {
  const debt = d.debts.find((x) => x.id === debtId);
  const c = debt ? charById(d, debt.debtorId) : undefined;
  if (!debt || !c) return;
  const pay = Math.min(debt.owed, amount, Math.max(0, c.gp));
  if (pay <= 0) return void log(d, `${c.name} has nothing to pay with.`, 'warn');
  spendWealth(c, pay);
  debt.owed = Math.round((debt.owed - pay) * 100) / 100;
  log(d, `${c.name} pays ${debt.creditor} ${fmtGp(pay)}. ${debt.owed > 0 ? `${fmtGp(debt.owed)} still owed.` : 'The debt is cleared.'}`, 'good');
  if (debt.owed <= 0) settleDebt(d, debt);
});

function settleDebt(d: State, debt: Debt): void {
  if (debt.imprisoned) {
    d.effects = d.effects.filter((e) => !(e.name === "In debtors' prison" && e.targetIds.includes(debt.debtorId)));
    log(d, `${charById(d, debt.debtorId)?.name} walks free of debtors' prison.`, 'good');
  }
  d.debts = d.debts.filter((x) => x.id !== debt.id);
}

/** Forced service for a criminal creditor: an unpaid job that cuts the debt. */
export const serveCreditor = act((d, ctx, debtId: string) => {
  const debt = d.debts.find((x) => x.id === debtId);
  if (!debt) return;
  const cut = Math.round(debt.owed * SERVICE_CREDIT * 100) / 100;
  debt.owed = Math.round((debt.owed - cut) * 100) / 100;
  debt.dueDay = d.dayIndex + 7;
  debt.steps = debt.steps.filter((x) => x !== 'Forced service');
  log(d, `${charById(d, debt.debtorId)?.name} does a job for ${debt.creditor}: ${fmtGp(cut)} comes off the debt, and they get another week. The job itself is the DM's to play out.`, 'warn');
  if (die(4, ctx.rng) === 1) log(d, 'Word of the job gets around: the watch is interested.', 'warn');
  if (debt.owed <= 0) settleDebt(d, debt);
});

/** Weekly: interest, and escalation for overdue debts. Prisoners work off their debt. */
function debtsWeekly(d: State, ctx: Ctx): void {
  for (const debt of [...d.debts]) {
    const c = charById(d, debt.debtorId);
    if (!c) continue;
    if (debt.rate > 0) debt.owed = Math.round(debt.owed * (1 + debt.rate) * 100) / 100;
    if (debt.imprisoned) {
      debt.owed = Math.round(Math.max(0, debt.owed - PRISON_LABOR_GP_PER_WEEK) * 100) / 100;
      if (debt.owed <= 0) settleDebt(d, debt);
      continue;
    }
    if (d.dayIndex < debt.dueDay) continue;
    const weeks = Math.floor((d.dayIndex - debt.dueDay) / 7) + 1;
    const small = debt.owed < LENIENT_GP;
    for (const step of ESCALATION[debt.kind]) {
      if (weeks < step.week || debt.steps.includes(step.label)) continue;
      if (small && step.action !== 'warn') continue;
      debt.steps.push(step.label);
      log(d, `${debt.creditor} (${fmtGp(debt.owed)} owed by ${c.name}, ${weeks} week(s) overdue): ${step.text}.`, step.action === 'warn' ? 'warn' : 'bad');
      collect(d, ctx, debt, c, step);
      if (!d.debts.includes(debt)) break;
    }
  }
}

function collect(d: State, ctx: Ctx, debt: Debt, c: Character, step: Escalation): void {
  const take = (gp: number) => {
    const amt = Math.min(gp, Math.max(0, c.gp), debt.owed);
    if (amt > 0) {
      spendWealth(c, amt);
      debt.owed = Math.round((debt.owed - amt) * 100) / 100;
    }
    return amt;
  };
  switch (step.action) {
    case 'seize': {
      let got = take(debt.owed);
      // Then goods, at half value, most valuable first.
      for (const it of [...c.inventory].sort((a, b) => (b.valueGp ?? 0) - (a.valueGp ?? 0))) {
        if (debt.owed <= 0) break;
        const v = (it.valueGp ?? priceOf(it.name) ?? 0) * 0.5;
        if (v <= 0) continue;
        while (it.qty > 0 && debt.owed > 0) {
          it.qty -= 1;
          debt.owed = Math.round(Math.max(0, debt.owed - v) * 100) / 100;
          got += v;
          log(d, `Seized from ${c.name}: ${it.name} (credited ${fmtGp(v)}).`, 'bad');
        }
      }
      c.inventory = c.inventory.filter((i) => i.qty > 0);
      log(d, `Collection takes ${fmtGp(got)} in coin and goods. ${debt.owed > 0 ? `${fmtGp(debt.owed)} remains.` : 'The debt is settled.'}`, 'bad');
      break;
    }
    case 'prison':
      if (!d.place.settlement) {
        log(d, `${c.name} is out of reach of the courts for now; they'll be arrested on returning to town.`, 'warn');
        debt.steps = debt.steps.filter((x) => x !== step.label);
        break;
      }
      debt.imprisoned = true;
      d.effects.push({ id: uid(), name: "In debtors' prison", kind: 'other', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(d), endsAt: null, notes: `Works off ${fmtGp(PRISON_LABOR_GP_PER_WEEK)} a week; free when the debt is paid.` });
      break;
    case 'beating': {
      const got = take(rollDice(2, 10, ctx.rng) * 5);
      Object.assign(d, changeHp(d, ctx, c.id, -rollDice(2, 6, ctx.rng)));
      log(d, `The enforcers take ${fmtGp(got)} and leave ${c.name} bruised.`, 'bad');
      break;
    }
    case 'service':
      log(d, `${c.name} can do the job for ${debt.creditor} (Debts card) to cut a quarter off the debt, or refuse and face worse.`, 'warn');
      break;
    case 'violence': {
      Object.assign(d, changeHp(d, ctx, c.id, -rollDice(4, 6, ctx.rng)));
      if (!d.rivals.some((r) => r.name === debt.creditor)) d.rivals.push({ id: uid(), name: debt.creditor, idea: 'A creditor making an example of the party', goal: `Collect ${fmtGp(debt.owed)} or make an example`, assets: 'Enforcers, informants', plans: [], pressure: 3, active: true });
      break;
    }
    case 'renown':
      // Every faction hears of it; only the creditor's own faction counts it as an offense against the group.
      for (const f of d.factions) loseRenown(d, f, 1, `${debt.creditor} spreads word of ${c.name}'s unpaid debt`, nameMatches(f.name, debt.creditor));
      break;
    case 'quest':
      log(d, `${debt.creditor} will forgive the debt for a quest or labor in its service; the DM sets the task.`, 'warn');
      break;
  }
  if (debt.owed <= 0) settleDebt(d, debt);
}

/** Running a negative purse turns into a lawful debt at the end of the day. */
function purseDebts(d: State): void {
  for (const c of d.characters) {
    if (c.gp < -0.001) {
      const amt = Math.round(-c.gp * 100) / 100;
      gainWealth(c, amt);
      addDebtMut(d, c.id, d.place.settlement ? `Creditors in ${d.place.name}` : 'Unpaid bills', 'lawful', amt);
    }
  }
}

// ---------------------------------------------------------------- shop and loot

/** Buys equipment at its PHB price (less any discount) and adds it to the buyer's inventory. */
export const buyItem = act((d, _ctx: Ctx, charId: string, name: string, qty: number, unitGp: number, discount: number) => {
  const c = charById(d, charId);
  if (!c || qty < 1) return;
  const cost = Math.round(unitGp * qty * (1 - discount) * 100) / 100;
  if (c.gp < cost) return void log(d, `${c.name} can't afford ${qty} × ${name} (${fmtGp(cost)}; has ${fmtGp(c.gp)}).`, 'warn');
  spendWealth(c, cost);
  // Table rule: buying potions on the cheap while living Squalid or Wretched, one in six comes from a backstreet hawker and is tainted.
  const tainted = d.settings.lifestyleRisks && d.place.settlement && isLowLife(livingOf(d, c)) && /potion|elixir|tonic/i.test(name) && die(TAINTED_POTION_ODDS, _ctx.rng) === 1;
  const notes = tainted ? [] : stowItem(d, c, name, qty, packNamed(name) ? {} : { valueGp: unitGp }, true);
  if (tainted) {
    c.inventory.push({ id: uid(), name, qty, weight: estimateWeight(name).weight, source: 'book', valueGp: unitGp, container: null, ammo: null, tainted: true });
    log(d, `DM only: the ${name} ${c.name} bought from a backstreet hawker is tainted. Whoever drinks it makes a DC 10 Con save against Cackle Fever (Effects & Ailments tab, Expose).`, 'warn');
  }
  log(d, `${c.name} buys ${qty} × ${name} for ${fmtGp(cost)}${discount ? ` (${Math.round(discount * 100)}% off)` : ''}.${notes.length ? ` ${notes.join(' ')}` : ''}`, 'good');
});

/** Sells from the inventory: half price for equipment, full value for gems, art and trade goods (2024 PHB). */
export const sellItem = act((d, _ctx, charId: string, itemId: string, qty: number) => {
  const c = charById(d, charId);
  const it = c?.inventory.find((i) => i.id === itemId);
  if (!c || !it) return;
  const n = Math.max(1, Math.min(it.qty, Math.round(qty)));
  const unit = it.valueGp ?? priceOf(it.name);
  if (unit == null) return void log(d, `Nobody will name a price for the ${it.name} until its value is known. Set a value on the item first.`, 'warn');
  const named = valueUnknown(it)
    ? ` The buyer looks it over and values it at ${fmtGp(unit)} each.`
    : misjudged(it) && it.valueBelieved !== unit
      ? ` The buyer values it at ${fmtGp(unit)} each, not the ${fmtGp(it.valueBelieved!)} the party thought.`
      : '';
  // Table rule: a crafter sells their own new work as its maker, at full price.
  const base = it.crafted ? 1 : saleRate(it.name);
  const bonus = d.patron && base < 1 ? (PATRONS[d.patron.kind].saleBonus ?? 0) : 0;
  const rate = base * (1 + bonus);
  const gp = Math.round(unit * n * rate * 100) / 100;
  it.qty -= n;
  c.inventory = c.inventory.filter((i) => i.qty > 0);
  gainWealth(c, gp);
  log(d, `${c.name} sells ${n} × ${it.name} for ${fmtGp(gp)} (${rate === 1 ? 'full value' : 'half price'}).${named}`, 'good');
});

/**
 * Sells raw materials from the crafting stash (hides, pelts, herbs, wood) as trade goods: full value (table rule,
 * following the 2024 PHB's trade goods), split among the party.
 */
export const sellMaterial = act((d, _ctx, materialId: string, qty: number) => {
  const m = d.materials.find((x) => x.id === materialId);
  if (!m || m.qty <= 0) return;
  const n = Math.min(m.qty, Math.max(0, qty));
  if (!n) return;
  m.qty = round2(m.qty - n);
  d.materials = d.materials.filter((x) => x.qty > 0);
  const gp = round2(n * m.valueGp);
  log(d, `Sold ${n} ${m.unit}${n > 1 ? 's' : ''} of ${m.name} to a tanner, trader or crafter for ${fmtGp(gp)} (full value: trade goods).`, 'good');
  if (!d.settings.chargeCosts) return;
  receiveGold(d, [], gp, m.name);
});

/** Splits coin among the party evenly; leftover copper goes to the first named. */
export const splitLoot = act((d, _ctx, gp: number, charIds: string[], what: string) => {
  const people = charIds.map((id) => charById(d, id)).filter((c): c is Character => !!c);
  if (!people.length || gp <= 0) return;
  const cp = Math.round(gp * 100);
  const each = Math.floor(cp / people.length);
  const rest = cp - each * people.length;
  people.forEach((c, i) => gainWealth(c, (each + (i === 0 ? rest : 0)) / 100));
  log(d, `${what || 'Treasure'} worth ${fmtGp(gp)} is split ${people.length} ways: ${fmtGp(each / 100)} each${rest ? ` (${people[0].name} keeps the odd ${rest} CP)` : ''}.`, 'good');
});

// ---------------------------------------------------------------- costly components and spell effects

/** True value of matching component items a character carries. The spell cares what they're worth, not what the caster knows. */
export function componentValue(c: Character, comp: CostlyComponent): number {
  return c.inventory.filter((i) => i.name.toLowerCase().includes(comp.match)).reduce((a, i) => a + (i.valueGp ?? 0) * i.qty, 0);
}

/** Value of matching component items as the party knows it, leaving out any of unknown value. */
export function componentKnownValue(c: Character, comp: CostlyComponent): number {
  return c.inventory.filter((i) => i.name.toLowerCase().includes(comp.match)).reduce((a, i) => a + (knownValue(i) ?? 0) * i.qty, 0);
}

/** Matching component items whose value the party doesn't know yet. */
export const componentUnknown = (c: Character, comp: CostlyComponent): InventoryItem[] => c.inventory.filter((i) => i.name.toLowerCase().includes(comp.match) && valueUnknown(i));

/**
 * Checks and spends a spell's costly component. Returns false (and logs why) if it's missing.
 * `discount` lowers the minimum cost (Circle Magic's Supplant); `checkOnly` checks without spending anything.
 */
function useComponent(s: State, c: Character, spell: string, opts: { discount?: number; checkOnly?: boolean } = {}): boolean {
  const found = componentFor(spell);
  if (!found || !s.settings.trackComponents) return true;
  const comp = opts.discount ? { ...found, gp: Math.max(0, found.gp - opts.discount), what: `${found.what}, ${opts.discount} GP less with Supplant` } : found;
  if (comp.gp <= 0) return true;
  const talisman = c.inventory.find((i) => /^reliquary talisman$/i.test(i.name));
  if (componentValue(c, comp) < comp.gp) {
    if (talisman && comp.gp <= 1000) {
      if (opts.checkOnly) return true;
      talisman.name = 'Reliquary talisman (spent)';
      log(s, `${c.name} uses the Reliquary talisman in place of ${comp.what}. It must go back to the Reliquary to recharge.`, 'good');
      return true;
    }
    const matches = c.inventory.filter((i) => i.name.toLowerCase().includes(comp.match));
    const blank = matches.find((i) => i.valueGp == null);
    log(s, blank
      ? `${c.name} needs ${comp.what} to cast ${spell}. Nobody knows what the ${blank.name} is worth yet: appraise it or set its value.`
      : matches.length
        ? `${c.name} reaches for the ${matches[0].name} to cast ${spell}, but the magic doesn't take: it isn't worth enough (needs ${comp.what}).`
        : `${c.name} needs ${comp.what} to cast ${spell} and doesn't carry it. Add it to the inventory with its value (e.g. "Diamond (300 GP)").`, 'warn');
    return false;
  }
  const guessed = c.inventory.filter((i) => i.name.toLowerCase().includes(comp.match) && valueSecret(i));
  if (!comp.consumed || opts.checkOnly) return true;
  let left = comp.gp;
  for (const it of c.inventory.filter((i) => i.name.toLowerCase().includes(comp.match)).sort((a, b) => (a.valueGp ?? 0) - (b.valueGp ?? 0))) {
    while (left > 0 && it.qty > 0) {
      const v = it.valueGp ?? 0;
      if (v <= left || it.qty === 1) {
        left -= v;
        it.qty -= 1;
      } else {
        // Dust and powders: take only what's needed from one piece.
        it.valueGp = v - left;
        left = 0;
      }
    }
    if (left <= 0) break;
  }
  c.inventory = c.inventory.filter((i) => i.qty > 0);
  log(s, `${spell} consumes ${comp.what}.${guessed.length && componentKnownValue(c, comp) < comp.gp ? ` The ${guessed[0].name} of unknown value was worth enough after all.` : ''}`);
  return true;
}

/** Applies a spell's lasting effect to a character (restoration, curses, healing, revival). */
function applySpellTo(s: State, ctx: Ctx, spell: string, targetId: string): void {
  const t = charById(s, targetId);
  if (!t) return;
  const endPoison = () => {
    t.sick = false;
    t.sickFrom = '';
    t.poisonedUntil = null;
    t.poisonTimers = [];
    s.effects = s.effects.filter((e) => !(e.name.startsWith('Poisoned') && e.targetIds.includes(t.id)));
  };
  const endSightRot = () => {
    const x = (t.contagions ?? []).find((k) => k.kind === 'sightRot');
    if (x) endContagion(s, t, x.id, spell);
  };
  healInjuriesBySpell(s, t, spell);
  madnessBySpell(s, t, spell);
  switch (spell) {
    case 'Lesser Restoration': {
      const poisoned = t.sick || t.poisonedUntil != null || (t.poisonTimers ?? []).length > 0 || s.effects.some((e) => e.name.startsWith('Poisoned') && e.targetIds.includes(t.id));
      if (poisoned) {
        endPoison();
        return void log(s, `${spell} ends the Poisoned condition on ${t.name}.`, 'good');
      }
      if ((t.contagions ?? []).some((k) => k.kind === 'sightRot')) return endSightRot();
      return void log(s, `${spell} finds nothing to cure on ${t.name}.`);
    }
    case 'Greater Restoration': {
      if (t.exhaustion > 0) {
        const causes = causesOf(t);
        causes.pop();
        t.exhaustionCauses = causes;
        t.exhaustion = causes.length;
        return void status(s, t, 'exhaustionEases', `${spell} lifts 1 Exhaustion level from ${t.name}. Now level ${t.exhaustion}.`, 'good');
      }
      const curse = s.effects.find((e) => e.kind === 'curse' && e.targetIds.includes(t.id));
      if (curse) {
        s.effects = s.effects.filter((e) => e.id !== curse.id);
        return void log(s, `${spell} ends ${curse.name} on ${t.name}.`, 'good');
      }
      return void log(s, `${spell} finds nothing to restore on ${t.name}.`);
    }
    case 'Remove Curse': {
      const curses = s.effects.filter((e) => e.kind === 'curse' && e.targetIds.includes(t.id));
      s.effects = s.effects.filter((e) => !curses.includes(e));
      t.curseBroken = true;
      return void log(s, `${spell}: ${curses.length ? `${curses.map((e) => e.name).join(', ')} end${curses.length > 1 ? '' : 's'}` : 'no curse effects'} on ${t.name}. Attunement to a cursed item can now be ended.`, 'good');
    }
    case 'Heal':
      endPoison();
      endSightRot();
      if (t.diedAt == null) Object.assign(s, changeHp(s, ctx, t.id, 70));
      return void log(s, `${spell} restores up to 70 HP to ${t.name} and ends Blinded, Deafened and Poisoned.`, 'good');
  }
  const limit = REVIVAL_LIMIT[spell];
  if (limit == null) return;
  const dead = deadFor(s, t);
  if (dead == null) return void log(s, `${t.name} isn't dead.`, 'warn');
  if (dead > limit) return void log(s, `${spell} fails: ${t.name} has been dead ${formatDuration(dead)}, longer than ${formatDuration(limit)}.`, 'bad');
  Object.assign(t, { diedAt: null, reposeMinutes: 0, dying: false, stable: false, deathSuccesses: 0, deathFailures: 0, wakesAt: null });
  if (t.exhaustion >= 6) {
    t.exhaustion = 0;
    t.exhaustionCauses = [];
  }
  const full = spell === 'Reincarnate' || spell === 'Resurrection' || spell === 'True Resurrection';
  t.hp = full ? t.maxHp : 1;
  if (spell === 'Raise Dead' || spell === 'Resurrection') t.revivalPenalty = 4;
  status(s, t, 'revived', `${spell} returns ${t.name} to life with ${full ? 'all' : '1'} HP${t.revivalPenalty ? '. −4 to D20 Tests, easing by 1 with each Long Rest' : ''}${spell === 'Reincarnate' ? '. They wake in a new body (roll the species)' : ''}.`, 'good');
}

/** A spell cast on a target from outside the party (a temple, a hired caster) or by the party. */
export const spellOnTarget = act((d, ctx, spell: string, targetId: string) => applySpellTo(d, ctx, spell, targetId));

// ---------------------------------------------------------------- poisons

function dealDamage(d: State, ctx: Ctx, charId: string, amount: number): void {
  if (amount > 0) Object.assign(d, changeHp(d, ctx, charId, -amount));
}

function poisonEffect(s: State, c: Character, p: PoisonInfo, minutes: number, extra?: string): void {
  s.effects.push({ id: uid(), name: `Poisoned (${p.name})${extra ? `, ${extra}` : ''}`, kind: 'other', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(s), endsAt: absNow(s) + minutes, notes: p.effect });
}

/** A creature is exposed to a dose of poison: roll its save and apply what happens (2024 DMG). */
export const exposePoison = act((d, ctx, charId: string, poisonName: string, fromCharId: string | null) => {
  const p = poisonByName(poisonName);
  const c0 = charById(d, charId);
  if (!p || !c0 || !alive(c0)) return;
  if (fromCharId) {
    const holder = charById(d, fromCharId);
    const dose = holder?.inventory.find((i) => poisonByName(i.name)?.name === p.name && i.qty > 0);
    if (!holder || !dose) return void log(d, `No dose of ${p.name} to use.`, 'warn');
    dose.qty -= 1;
    holder.inventory = holder.inventory.filter((i) => i.qty > 0);
  }
  if (p.dc == null) return void log(d, `${p.name}: ${p.effect}`, 'info');
  if (p.name === 'Midnight Tears') {
    c0.poisonTimers = [...(c0.poisonTimers ?? []), { id: uid(), name: p.name, nextAt: (d.dayIndex + 1) * MIN_PER_DAY, successes: 0 }];
    return void log(d, `${c0.name} has ingested Midnight Tears. Nothing happens until midnight, unless something ends the Poisoned condition first. The player doesn't know.`, 'warn');
  }
  const r = rollSave(c0, p.dc, poisonSaveMode(d, c0), ctx.rng);
  const total = Number(/= (-?\d+)\./.exec(r.detail)?.[1] ?? 0);
  log(d, `${c0.name} is exposed to ${p.name} (${p.type}): DC ${p.dc} Con save. ${r.detail}${r.passed ? 'Success.' : 'Failure.'}`, r.passed ? 'good' : 'bad');
  const dmg = p.damage ? (rollExpr(p.damage, ctx.rng) ?? 0) : 0;
  if (p.name === 'Burnt Othur Fumes') {
    if (r.passed) return;
    let total2 = dmg;
    let ok = 0;
    let rounds = 0;
    const c = charById(d, charId)!;
    while (ok < 3 && rounds < 20) {
      rounds += 1;
      const again = rollSave(c, p.dc, 'normal', ctx.rng);
      if (again.passed) ok += 1;
      else total2 += die(6, ctx.rng);
    }
    log(d, `The fumes linger for ${rounds} rounds until ${c.name} makes three saves.`, 'warn');
    return dealDamage(d, ctx, charId, total2);
  }
  if (p.name === 'Carrion Crawler Mucus') {
    if (r.passed) return;
    let rounds = 1;
    const c = charById(d, charId)!;
    while (rounds < 10 && !rollSave(c, p.dc, 'normal', ctx.rng).passed) rounds += 1;
    poisonEffect(d, c, p, rounds >= 10 ? 1 : Math.max(1, Math.ceil(rounds / 10)), 'Paralyzed');
    return void log(d, `${c.name} is Poisoned and Paralyzed for ${rounds >= 10 ? 'the full minute' : `${rounds} round(s)`}.`, 'bad');
  }
  if (p.damage) dealDamage(d, ctx, charId, r.passed ? (p.halfOnSave ? Math.floor(dmg / 2) : 0) : dmg);
  const c = charById(d, charId)!;
  if (r.passed) return;
  if (p.name === 'Pale Tincture') {
    c.poisonTimers = [...(c.poisonTimers ?? []), { id: uid(), name: p.name, nextAt: absNow(d) + MIN_PER_DAY, successes: 0 }];
    poisonEffect(d, c, p, 8 * MIN_PER_DAY);
    return;
  }
  const minutes = p.poisonedHoursDice ? (rollExpr(p.poisonedHoursDice, ctx.rng) ?? 4) * 60 : (p.poisonedMinutes ?? 0);
  if (!minutes) return;
  const extra = p.alsoCondition && (!p.extraOnFailBy5 || total <= p.dc - 5) ? p.alsoCondition : undefined;
  poisonEffect(d, c, p, minutes, extra);
  log(d, `${c.name} is Poisoned${extra ? ` and ${extra}` : ''} for ${formatDuration(minutes)}.`, 'bad');
});

/** Midnight Tears and Pale Tincture keep acting on their own schedule. */
function tickPoisons(s: State, ctx: Ctx): void {
  const now = absNow(s);
  for (const c of s.characters) {
    for (const t of [...(c.poisonTimers ?? [])]) {
      if (now < t.nextAt || !alive(c)) continue;
      const p = poisonByName(t.name)!;
      const r = rollSave(c, p.dc!, poisonSaveMode(s, c), ctx.rng);
      if (t.name === 'Midnight Tears') {
        c.poisonTimers = c.poisonTimers!.filter((x) => x.id !== t.id);
        const dmg = rollExpr('9d6', ctx.rng) ?? 31;
        log(s, `Midnight strikes, and the Midnight Tears in ${c.name} take hold: DC 17 Con save. ${r.detail}${r.passed ? 'Half damage.' : 'Failure.'}`, 'bad');
        Object.assign(s, changeHp(s, ctx, c.id, -(r.passed ? Math.floor(dmg / 2) : dmg)));
        continue;
      }
      // Pale Tincture: a save every 24 hours; seven successes end it.
      t.nextAt = now + MIN_PER_DAY;
      if (r.passed) t.successes += 1;
      log(s, `${c.name} fights the Pale Tincture: DC 16 Con save. ${r.detail}${r.passed ? `Success (${t.successes}/7).` : 'Failure: 1d6 Poison damage that can’t be healed while Poisoned.'}`, r.passed ? 'good' : 'bad');
      if (!r.passed) Object.assign(s, changeHp(s, ctx, c.id, -die(6, ctx.rng)));
      const me = charById(s, c.id)!;
      if (t.successes >= 7) {
        me.poisonTimers = (me.poisonTimers ?? []).filter((x) => x.id !== t.id);
        s.effects = s.effects.filter((e) => !(e.name.startsWith('Poisoned (Pale Tincture)') && e.targetIds.includes(c.id)));
        log(s, `${c.name} is free of the Pale Tincture.`, 'good');
      } else {
        const eff = s.effects.find((e) => e.name.startsWith('Poisoned (Pale Tincture)') && e.targetIds.includes(c.id));
        if (eff) eff.endsAt = now + 8 * MIN_PER_DAY;
      }
    }
  }
}

/**
 * Drink a vial of Antitoxin (PHB, a Bonus Action): Advantage on saves to avoid or end the Poisoned condition for 1 hour.
 * It cures nothing: someone already Sick or Poisoned stays that way, and only new or repeated saves benefit.
 */
export const drinkAntitoxin = act((d, _ctx, charId: string) => {
  const c = charById(d, charId);
  if (!c || !alive(c)) return;
  const vial = c.inventory.find((i) => /antitoxin/i.test(i.name) && i.qty > 0);
  if (vial) {
    vial.qty -= 1;
    c.inventory = c.inventory.filter((i) => i.qty > 0);
  }
  c.antitoxinUntil = absNow(d) + 60;
  const still = [c.sick && 'Sick', (c.poisonTimers ?? []).length > 0 || d.effects.some((e) => e.name.startsWith('Poisoned') && e.targetIds.includes(c.id)) ? 'Poisoned' : ''].filter(Boolean);
  log(
    d,
    `${c.name} drinks a vial of Antitoxin${vial ? '' : ' (not from a tracked inventory)'}: Advantage on saves to avoid or end the Poisoned condition for 1 hour, raw food and unpurified water included.${still.length ? ` It doesn't cure what ${c.name} already has: still ${still.join(' and ')}.` : ''}`,
    'good',
  );
});

/** Magic that ends the Poisoned condition (Lesser Restoration, Lay on Hands and the like) ends these too. Antitoxin doesn't. */
export const curePoison = act((d, _ctx, charId: string) => {
  const c = charById(d, charId);
  if (!c) return;
  c.poisonTimers = [];
  c.poisonedUntil = null;
  c.sick = false;
  c.sickFrom = '';
  d.effects = d.effects.filter((e) => !(e.name.startsWith('Poisoned') && e.targetIds.includes(c.id)));
  log(d, `${c.name} is no longer Poisoned; any lingering poison or sickness is neutralized.`, 'good');
});

// ---------------------------------------------------------------- contagions

const contagionMode = (s: State, c: Character): RollMode => (c.recuperatedUntil && c.recuperatedUntil > absNow(s) ? 'advantage' : 'normal');

function sewerWeakened(c: Character): boolean {
  return c.exhaustion > 0 && (c.contagions ?? []).some((x) => x.kind === 'sewer' && x.onset);
}

/** Removes a contagion and the Exhaustion it caused (Cackle Fever's fever lasts until the contagion ends). */
function endContagion(s: State, c: Character, id: string, why: string): void {
  const x = c.contagions.find((k) => k.id === id);
  if (!x) return;
  c.contagions = c.contagions.filter((k) => k.id !== id);
  if (x.kind === 'cackle') {
    const causes = causesOf(c);
    const i = causes.lastIndexOf('contagion');
    if (i >= 0) {
      causes.splice(i, 1);
      c.exhaustionCauses = causes;
      c.exhaustion = causes.length;
    }
  }
  status(s, c, 'contagionEnds', `${c.name} is free of ${CONTAGIONS[x.kind].name} (${why}).${x.kind === 'cackle' ? ' Immune to it for a year.' : ''}`, 'good');
}

/** Exposure to a contagion: optionally roll the save to resist, otherwise infect. */
export const exposeContagion = act((d, ctx, charId: string, kind: ContagionKind, rollToResist: boolean) => exposeContagionMut(d, ctx, charId, kind, rollToResist));

/**
 * Table rule: Sewer Plague doesn't strike out of nowhere. Each bout of illness from bad water wears a character down,
 * and after enough of them (Settings, default 3) their next exposure is a DC 11 Con save against Sewer Plague.
 * The count starts again after that save, whatever its result.
 */
function waterborneIllness(s: State, ctx: Ctx, c: Character): void {
  const after = s.settings.sewerPlagueAfter ?? 3;
  if (after <= 0) return;
  c.waterborneIllnesses = (c.waterborneIllnesses ?? 0) + 1;
  if (c.waterborneIllnesses < after) return;
  c.waterborneIllnesses = 0;
  if (c.contagions.some((x) => x.kind === 'sewer')) return;
  noticed(s, 'contagionWorse', [c], `Bout after bout of foul water has worn ${c.name} down (${after} water-borne illnesses, table rule): their gut cramps and their joints ache in a way that feels like more than a passing sickness.`, 'bad');
  exposeContagionMut(s, ctx, c.id, 'sewer', true);
}

/**
 * Table rule: city water is more dangerous than a wild stream. Each day in a settlement, anyone living Squalid (DC 12) or
 * Wretched (DC 14) drinks from public wells and gutters: a Con save or Sick, which counts toward Sewer Plague.
 * Renown 3+ with a faction means shelter in need, which spares the Wretched the gutters.
 */
function cityWater(s: State, ctx: Ctx): void {
  if (!s.settings.lifestyleRisks || !s.settings.wildNeedsPurifying || !s.place.settlement) return;
  for (const c of adventurers(s)) {
    const life = livingOf(s, c);
    if (life !== 'squalid' && life !== 'wretched') continue;
    if (life === 'wretched' && bestRenown(s) >= 3) continue;
    // Day to day, someone sleeping rough drinks from their own waterskin; only a squalid inn serves cistern water.
    if (life === 'wretched' && !inDowntime(s)) continue;
    const dc = CITY_WATER_DC[life]!;
    const reason = life === 'wretched' ? 'gutter water and the dregs of public wells' : 'foul water from a tenement cistern';
    requestSave(s, ctx, c, 'tainted', dc, 'normal', reason, true);
  }
}

/**
 * Table rule: city water can also carry Sight Rot (the 2024 DMG names tainted water), less often than it leads to
 * Sewer Plague. Each new bout of sickness from it is a 1 in 6 chance (Settings) of a DC 15 Con save against Sight Rot.
 */
function cityWaterSightRot(s: State, ctx: Ctx, c: Character): void {
  const odds = s.settings.sightRotOdds ?? 6;
  if (odds <= 0 || c.contagions.some((x) => x.kind === 'sightRot') || die(odds, ctx.rng) !== 1) return;
  status(s, c, 'contagionOnset', `The water ${c.name} drank carried something worse: their eyes start to itch and water (table rule).`, 'bad');
  exposeContagionMut(s, ctx, c.id, 'sightRot', true);
}

function exposeContagionMut(d: State, ctx: Ctx, charId: string, kind: ContagionKind, rollToResist: boolean): void {
  const c = charById(d, charId);
  if (!c || !alive(c)) return;
  const info = CONTAGIONS[kind];
  if (c.contagions.some((x) => x.kind === kind)) {
    log(d, `${c.name} already has ${info.name}.`);
    return;
  }
  if (rollToResist) {
    const r = rollSave(c, info.catchDC, contagionMode(d, c), ctx.rng);
    log(d, `${c.name} resists ${info.name}: DC ${info.catchDC} Con save. ${r.detail}${r.passed ? 'Resisted.' : 'Infected.'}`, r.passed ? 'good' : 'bad');
    if (r.passed) return;
  }
  const now = absNow(d);
  const onsetAt = info.incubates ? now + die(4, ctx.rng) * MIN_PER_DAY : now;
  c.contagions.push({ id: uid(), kind, infectedAt: now, onsetAt, onset: false, successes: 0 });
  if (info.incubates) log(d, `${c.name} carries ${info.name}. Symptoms start in ${formatDuration(onsetAt - now)} (1d4 days); the player doesn't know yet.`, 'warn');
  tickContagions(d);
}

/** Starts symptoms when incubation ends, and counts Sight Rot ointment time. */
function tickContagions(s: State): void {
  const now = absNow(s);
  for (const c of s.characters) {
    for (const x of c.contagions ?? []) {
      if (!x.onset && now >= x.onsetAt) {
        x.onset = true;
        if (x.kind === 'sightRot') status(s, c, 'blinded', `${c.name} has Sight Rot and is Blinded until it ends.`, 'bad');
        else gainExhaustion(s, c, 1, CONTAGIONS[x.kind].name, 'contagion');
      }
      if (x.kind === 'sightRot' && x.suppressedUntil && now >= x.suppressedUntil) {
        // A dose has run its full 24 hours.
        x.suppressedUntil = undefined;
        x.suppressedHours = (x.suppressedHours ?? 0) + 24;
        if (x.suppressedHours >= SIGHT_ROT_CURE_HOURS) endContagion(s, c, x.id, '72 hours of ointment');
        else status(s, c, 'blinded', `The ointment wears off and ${c.name}'s Sight Rot returns: Blinded (${x.suppressedHours}/72 hours treated).`, 'warn');
      }
    }
  }
}

/** Sewer Plague: a save at dawn each day, worsening or easing by one Exhaustion level. */
function contagionsAtDawn(s: State, ctx: Ctx): void {
  for (const c of s.characters) {
    if (!alive(c)) continue;
    for (const x of [...(c.contagions ?? [])]) {
      if (x.kind !== 'sewer' || !x.onset) continue;
      const r = rollSave(c, CONTAGIONS.sewer.fightDC, contagionMode(s, c), ctx.rng);
      if (!r.passed) {
        log(s, `${c.name} fights Sewer Plague at dawn: DC 11 Con save. ${r.detail}Failed.`, 'bad');
        gainExhaustion(s, c, 1, 'Sewer Plague worsens', 'contagion');
        continue;
      }
      log(s, `${c.name} fights Sewer Plague at dawn: DC 11 Con save. ${r.detail}Success.`, 'good');
      const causes = causesOf(c);
      const i = causes.lastIndexOf('contagion');
      causes.splice(i >= 0 ? i : causes.length - 1, 1);
      c.exhaustionCauses = causes;
      c.exhaustion = causes.length;
      if (c.exhaustion === 0) endContagion(s, c, x.id, 'Exhaustion back to 0');
      else status(s, c, 'contagionEases', `${c.name}'s Sewer Plague eases: Exhaustion level ${c.exhaustion}.`, 'good');
    }
  }
}

/** Cackle Fever: a save at the end of each Long Rest; three successes end it. */
function cackleSaveAfterRest(s: State, ctx: Ctx, c: Character): void {
  for (const x of [...(c.contagions ?? [])]) {
    if (x.kind !== 'cackle' || !x.onset) continue;
    const r = rollSave(c, CONTAGIONS.cackle.fightDC, contagionMode(s, c), ctx.rng);
    if (r.passed) x.successes += 1;
    log(s, `${c.name} fights Cackle Fever: DC 13 Con save. ${r.detail}${r.passed ? `Success (${x.successes}/3).` : 'Failed.'}`, r.passed ? 'good' : 'warn');
    if (x.successes >= 3) endContagion(s, c, x.id, 'three successful saves');
  }
}

/** Herbalism Kit ointment (1 hour to make): suppresses Sight Rot for 24 hours. */
export const applySightRotOintment = act((d, ctx, charId: string, makerId: string, hasKit: boolean = true, bonus: number = 0) => {
  const c = charById(d, charId);
  const maker = charById(d, makerId);
  const x = c?.contagions.find((k) => k.kind === 'sightRot');
  if (!c || !x || !maker) return;
  if (!hasKit) {
    if (!d.settings.improvised) return void log(d, `${maker.name} needs an Herbalism Kit to make the ointment.`, 'warn');
    // Table rule: foraged herbs and a mortar of stones, twice the time and an Intelligence (Nature or Medicine) check.
    advanceMut(d, ctx, 60 * IMPROVISED_TIME, 'camp');
    const r = d20('normal', ctx.rng);
    const total = r.value + bonus - 2 * maker.exhaustion;
    const roll = `Intelligence (Nature or Medicine) ${r.value} ${signed(bonus - 2 * maker.exhaustion)} = ${total} against DC ${IMPROVISED_OINTMENT_DC}`;
    if (total < IMPROVISED_OINTMENT_DC) return void log(d, `${maker.name} spends two hours grinding foraged herbs without an Herbalism Kit, but the paste is useless (${roll}).`, 'warn');
    log(d, `${maker.name} grinds foraged herbs into a rough paste without an Herbalism Kit (${roll}).`);
  } else advanceMut(d, ctx, 60, 'camp');
  const nx = charById(d, charId)!.contagions.find((k) => k.id === x.id);
  if (!nx) return;
  const now = absNow(d);
  // Reapplying early: credit the hours the last dose has already covered.
  if (nx.suppressedUntil) nx.suppressedHours = (nx.suppressedHours ?? 0) + Math.floor((now - (nx.suppressedUntil - 24 * 60)) / 60);
  nx.suppressedUntil = now + 24 * 60;
  log(d, `${maker.name} ${hasKit ? 'spends an hour with an Herbalism Kit and applies' : 'applies'} the ointment to ${c.name}'s eyes. Sight returns for 24 hours (${nx.suppressedHours ?? 0}/72 hours treated so far).`, 'good');
});

/** Magic or the DM ends a contagion (Heal or Lesser Restoration for Sight Rot). */
export const cureContagion = act((d, _ctx, charId: string, contagionId: string, how: string) => {
  const c = charById(d, charId);
  if (c) endContagion(d, c, contagionId, how);
});

/** DMG: 3 days of recuperation, then a DC 15 Con save for Advantage on contagion saves for 24 hours. */
export const recuperate = act((d, ctx, charId: string) => {
  for (let i = 0; i < RECUPERATE_DAYS; i++) Object.assign(d, downtimeDay(d, ctx, []));
  const c = charById(d, charId);
  if (!c || !alive(c)) return;
  const r = rollSave(c, RECUPERATE_DC, 'normal', ctx.rng);
  log(d, `${c.name} spends ${RECUPERATE_DAYS} days recuperating, then makes a DC ${RECUPERATE_DC} Con save. ${r.detail}${r.passed ? 'Advantage on saves against contagions for the next 24 hours.' : 'No benefit this time.'}`, r.passed ? 'good' : 'warn');
  if (!r.passed) return;
  c.recuperatedUntil = absNow(d) + 24 * 60;
  // Table rule: three days of real rest also lift a level of Exhaustion and ease the mind.
  let lifted = 0;
  for (let i = 0; i < RECUPERATE_EXHAUSTION; i++) if (recoverExhaustion(c)) lifted++;
  if (lifted) status(d, c, 'exhaustionEases', `${c.name} gets up from three days of rest stronger: ${lifted} Exhaustion level${lifted > 1 ? 's' : ''} lifted, now ${c.exhaustion} (table rule).`, 'good');
  easeMind(d, c, RECUPERATE_STRESS, 0, 'feels the days of rest settle the nerves');
});

// ---------------------------------------------------------------- businesses

export const addBusiness = act((d, _ctx, name: string, ownerId: string, gpPerDay: number, build?: { what: string; costGp: number; days: number; landGp: number }) => {
  const b: Business = { id: uid(), name: name || 'Business', ownerId, gpPerDay: Math.max(0, gpPerDay), daysWorked: 0, debts: 0, unpaidGp: 0, netGp: 0, lastResult: '', notes: '' };
  if (build) {
    b.building = { what: build.what, costGp: build.costGp, totalDays: Math.max(1, Math.round(build.days)), daysDone: 0 };
    b.overseeing = true;
    const total = build.costGp + build.landGp;
    b.valueGp = build.landGp;
    if (build.landGp > 0) log(d, `${b.name}: land bought for ${fmtGp(build.landGp)}.`);
    payGold(d, [ownerId], total, `building ${b.name} (${build.what})`);
    b.netGp -= total;
    log(d, `Construction of ${b.name} begins: ${build.what}, ${b.building.totalDays} days with the owner overseeing.`);
  }
  d.businesses.push(b);
});

/** Spends the lowest spell slot of at least this level. Characters who don't track slots can always cast. */
function useSlot(s: State, caster: Character, level: number, what: string): boolean {
  const lvl = (name: string) => Number(/level (\d)/i.exec(name)?.[1] ?? 0);
  const slot = caster.resources
    .filter((r) => /(spell|pact) slots \(level (\d)\)/i.test(r.name) && lvl(r.name) >= level && r.current > 0)
    .sort((x, y) => lvl(x.name) - lvl(y.name))[0];
  if (caster.resources.some((r) => /slots/i.test(r.name)) && !slot) {
    log(s, `${caster.name} has no spell slot of level ${level} or higher left for ${what}.`, 'warn');
    return false;
  }
  if (slot) slot.current -= 1;
  return true;
}

/** Something being built that crews, helpers and spells can speed up: a business or a Bastion facility. */
export type BuildRef = { kind: 'business'; id: string } | { kind: 'facility'; bastionId: string; facilityId: string };

interface BuildJob {
  label: string;
  what: string;
  ownerId: string;
  costGp: number;
  totalDays: number;
  doneDays: number;
  crews: number;
  helpers: { charId: string; skilled: boolean }[];
  /** Business construction slows to a third while the owner is away; Bastion hirelings build regardless (2024 DMG). */
  awayPenalty: boolean;
  setDone: (n: number) => void;
  setCrews: (n: number) => void;
  setHelpers: (h: { charId: string; skilled: boolean }[]) => void;
  finish: () => void;
}

export function buildJob(s: State, ref: BuildRef): BuildJob | null {
  if (ref.kind === 'business') {
    const b = s.businesses.find((x) => x.id === ref.id);
    if (!b?.building) return null;
    const w = b.building;
    return {
      label: b.name,
      what: w.what,
      ownerId: b.ownerId,
      costGp: w.costGp,
      totalDays: w.totalDays,
      doneDays: w.daysDone,
      crews: b.extraCrews ?? 0,
      helpers: b.helpers ?? [],
      awayPenalty: !b.overseeing,
      setDone: (n) => void (w.daysDone = Math.round(Math.min(w.totalDays, n) * 1000) / 1000),
      setCrews: (n) => void (b.extraCrews = n),
      setHelpers: (h) => void (b.helpers = h),
      finish: () => {
        log(s, `${b.name} is built and open for business (${w.what}).`, 'good');
        b.valueGp = (b.valueGp ?? 0) + w.costGp;
        b.building = undefined;
        b.extraCrews = 0;
        b.helpers = [];
      },
    };
  }
  const bas = s.bastions.find((x) => x.id === ref.bastionId);
  const f = bas?.facilities.find((x) => x.id === ref.facilityId);
  if (!bas || !f?.building) return null;
  const w = f.building;
  return {
    label: `${bas.name}: ${f.name}`,
    what: w.what,
    ownerId: bas.ownerId,
    costGp: w.costGp,
    totalDays: w.totalDays,
    doneDays: w.totalDays - w.daysLeft,
    crews: w.extraCrews ?? 0,
    helpers: w.helpers ?? [],
    awayPenalty: false,
    setDone: (n) => void (w.daysLeft = Math.round(Math.max(0, w.totalDays - n) * 1000) / 1000),
    setCrews: (n) => void (w.extraCrews = n),
    setHelpers: (h) => void (w.helpers = h),
    finish: () => {
      log(s, `${bas.name}: ${w.what} is finished.`, 'good');
      f.size = w.toSize;
      f.built = true;
      f.building = null;
    },
  };
}

/** Daily pace of a construction job, counting crews, helpers and the away penalty. */
export function jobPace(s: State, job: BuildJob): number {
  if (job.awayPenalty) return buildPace(job.crews, 0, 0) * AWAY_PROGRESS;
  const helpers = job.helpers.filter((h) => {
    const c = charById(s, h.charId);
    return c && alive(c);
  });
  return buildPace(job.crews, helpers.filter((h) => h.skilled).length, helpers.filter((h) => !h.skilled).length);
}

export function businessPace(s: State, b: Business): number {
  const job = buildJob(s, { kind: 'business', id: b.id });
  return job ? jobPace(s, job) : 1;
}

/** Days left at the current pace for any construction job. */
export function jobDaysLeft(s: State, ref: BuildRef): number {
  const job = buildJob(s, ref);
  if (!job) return 0;
  return Math.ceil(Math.round(((job.totalDays - job.doneDays) / jobPace(s, job)) * 1000) / 1000);
}

/** Moves a job forward by a number of workdays and finishes it if done. */
function advanceJob(job: BuildJob, days: number): void {
  job.setDone(job.doneDays + days);
  if (job.doneDays + days >= job.totalDays - 1e-6) job.finish();
}

/** Hires extra crews for the rest of the work: each costs half the construction price for the share still left. */
export const hireBuildCrews = act((d, _ctx, ref: BuildRef, crews: number) => {
  const job = buildJob(d, ref);
  if (!job) return;
  const want = Math.max(0, Math.min(MAX_EXTRA_CREWS, Math.round(crews)));
  const added = want - job.crews;
  job.setCrews(want);
  if (added <= 0) {
    if (added < 0) log(d, `${job.label}: extra crews let go; ${want} remain.`);
    return;
  }
  const left = 1 - job.doneDays / job.totalDays;
  const cost = Math.round(job.costGp * CREW_COST_SHARE * left * added);
  payGold(d, [job.ownerId], cost, `${added} extra building crew${added > 1 ? 's' : ''} for ${job.label}`);
  if (ref.kind === 'business') d.businesses.find((x) => x.id === ref.id)!.netGp -= cost;
  else d.bastions.find((x) => x.id === ref.bastionId)!.goldSpent += cost;
  log(d, `${job.label}: ${want} extra crew${want > 1 ? 's' : ''} on site. About ${jobDaysLeft(d, ref)} days of work left.`);
});

/** A caster uses a construction spell on the site: that much work is done at once. */
export const castBuildSpell = act((d, ctx, ref: BuildRef, casterId: string, spellName: string) => {
  const sp = BUILD_SPELLS.find((x) => x.name === spellName);
  const caster = charById(d, casterId);
  if (!buildJob(d, ref) || !sp || !caster || !alive(caster)) return;
  if (!caster.spells.some((x) => x.name.toLowerCase() === sp.name.toLowerCase())) {
    log(d, `${caster.name} doesn't know ${sp.name}.`, 'warn');
    return;
  }
  if (!useSlot(d, caster, sp.level, sp.name)) return;
  advanceMut(d, ctx, sp.name === 'Move Earth' ? 120 : 10, 'work');
  const job = buildJob(d, ref);
  if (!job) return;
  log(d, `${caster.name} casts ${sp.name} on the ${job.what}, saving about ${sp.days} day${sp.days > 1 ? 's' : ''} of work (${Math.floor(Math.min(job.totalDays, job.doneDays + sp.days))}/${job.totalDays}).`, 'good');
  advanceJob(job, sp.days);
});

/** Each midnight: construction advances a day if the owner oversees it, a third of a day if not. */
function progressBusinesses(s: State): void {
  for (const b of s.businesses) {
    if (!b.building) continue;
    const job = buildJob(s, { kind: 'business', id: b.id })!;
    advanceJob(job, jobPace(s, job));
  }
}

/** Days left on construction at the current pace. */
export function buildDaysLeft(s: State, b: Business): number {
  return jobDaysLeft(s, { kind: 'business', id: b.id });
}

/** The owner spends whole downtime days minding the business (work, meals, then a Long Rest). */
export const runBusiness = act((d, ctx, businessId: string, days: number) => {
  for (let i = 0; i < Math.max(1, Math.round(days)); i++) {
    const b = d.businesses.find((x) => x.id === businessId);
    const owner = b && charById(d, b.ownerId);
    if (!b || !owner || !alive(owner) || b.building) return;
    Object.assign(d, downtimeDay(d, ctx, []));
    const nb = d.businesses.find((x) => x.id === businessId)!;
    nb.daysWorked += 1;
    log(d, `${owner.name} spends the day running ${nb.name} (${nb.daysWorked} day${nb.daysWorked > 1 ? 's' : ''}${nb.daysWorked > BUSINESS_MAX_DAYS ? `, only ${BUSINESS_MAX_DAYS} count` : ''}).`);
  }
});

/** Rolls on the Running a Business table for the days spent, then pays or collects. */
export const settleBusiness = act((d, ctx, businessId: string) => {
  const b = d.businesses.find((x) => x.id === businessId);
  if (!b || b.daysWorked < 1 || b.building) return;
  const owner = charById(d, b.ownerId);
  const days = Math.min(BUSINESS_MAX_DAYS, b.daysWorked);
  const guild = owner ? guildBusinessBonus(d, owner) : null;
  const r = rollBusiness(ctx.rng, days, b.gpPerDay, b.debts + (b.sabotaged ? 1 : 0), guild?.bonus ?? 0);
  if (b.sabotaged) {
    log(d, `${b.name} suffers from a rival's sabotage: −10 on this roll.`, 'warn');
    b.sabotaged = false;
  }
  const penalty = b.debts ? ` − ${b.debts * BUSINESS_DEBT_PENALTY} for unpaid debts` : '';
  log(d, `${b.name}: d100 ${r.roll} + ${days} days + ${BUSINESS_TABLE_BONUS} (a well-run business, table rule)${guild ? ` + ${guild.bonus} (${guild.title}, the guild behind them)` : ''}${penalty} = ${r.total}. ${r.text}.`, r.payGp > 0 ? 'warn' : r.profitGp > 0 ? 'good' : 'info');
  b.lastResult = `${r.text} (${r.total})`;
  b.daysWorked = 0;
  if (r.payGp > 0) {
    if (owner && owner.gp >= r.payGp) {
      payGold(d, [owner.id], r.payGp, `${b.name}'s maintenance`);
      b.netGp -= r.payGp;
    } else {
      b.debts += 1;
      b.unpaidGp = Math.round((b.unpaidGp + r.payGp) * 100) / 100;
      log(d, `${owner?.name ?? 'The owner'} can't cover ${fmtGp(r.payGp)}, so ${b.name} begins to fail: −${BUSINESS_DEBT_PENALTY} to future rolls until the debt is paid.`, 'bad');
    }
  }
  if (r.profitGp > 0 && owner) {
    receiveGold(d, [owner.id], r.profitGp, `profit from ${b.name}`);
    b.netGp += r.profitGp;
  }
});

export const payBusinessDebts = act((d, _ctx, businessId: string) => {
  const b = d.businesses.find((x) => x.id === businessId);
  if (!b || !b.unpaidGp) return;
  payGold(d, [b.ownerId], b.unpaidGp, `${b.name}'s debts`);
  b.netGp -= b.unpaidGp;
  log(d, `${b.name}'s debts are settled; its rolls are no longer penalized.`, 'good');
  b.debts = 0;
  b.unpaidGp = 0;
});

// ---------------------------------------------------------------- bastions

export function turnsDue(s: State, b: Bastion): number {
  return Math.floor((s.dayIndex - b.lastTurnDay) / BASTION_TURN_DAYS);
}

export function daysToNextTurn(s: State, b: Bastion): number {
  const since = s.dayIndex - b.lastTurnDay;
  return BASTION_TURN_DAYS - (since % BASTION_TURN_DAYS);
}

/** Runs at each midnight: hirelings keep building whether or not the owner is home. */
function progressBastions(s: State): void {
  for (const b of s.bastions) {
    for (const f of b.facilities) {
      if (!f.building) continue;
      const job = buildJob(s, { kind: 'facility', bastionId: b.id, facilityId: f.id })!;
      advanceJob(job, jobPace(s, job));
    }
    if ((s.dayIndex - b.lastTurnDay) % BASTION_TURN_DAYS === 0 && s.dayIndex > b.lastTurnDay) {
      log(s, `${b.name}: a Bastion turn is due. Give your special facilities their orders.`, 'warn');
    }
  }
}

export const foundBastion = act((d, _ctx, ownerId: string, name: string) => {
  const owner = charById(d, ownerId);
  if (!owner) return;
  const free = (fname: string, size: FacilitySize): Facility => ({ id: uid(), name: fname, kind: 'basic', size, order: 'Maintain', orderNote: '', building: null, built: true });
  // A new Bastion comes with two free basic facilities: one Cramped, one Roomy (swap them for others if you like).
  d.bastions.push({ id: uid(), name: name || `${owner.name}'s Bastion`, ownerId, facilities: [free('Bedroom', 'cramped'), free('Dining Room', 'roomy')], lastTurnDay: d.dayIndex, turns: 0, lastEvent: '', goldSpent: 0, notes: '', maintain: false, distanceMiles: 0, ordersArrived: false, reportMethod: 'courier' });
  log(d, `${owner.name} founds a Bastion: ${name || `${owner.name}'s Bastion`}.`, 'good');
});

export interface NewFacility {
  kind: 'basic' | 'special';
  name: string;
  size: FacilitySize;
  /** Already standing (a starting facility, or built before you started tracking). */
  alreadyBuilt: boolean;
}

export const addFacility = act((d, _ctx, bastionId: string, nf: NewFacility) => {
  const b = d.bastions.find((x) => x.id === bastionId);
  if (!b) return;
  const special = SPECIAL_FACILITIES.find((x) => x.name === nf.name);
  const f: Facility = {
    id: uid(),
    name: nf.name,
    kind: nf.kind,
    size: nf.kind === 'special' && !nf.size ? defaultSize(nf.name) : nf.size,
    order: special && nf.kind === 'special' ? special.order : 'Maintain',
    orderNote: '',
    building: null,
    built: true,
  };
  // Special facilities come with character levels at no cost. Basic facilities are paid for and built.
  if (nf.kind === 'basic' && !nf.alreadyBuilt) {
    const cost = BASIC_BUILD[nf.size];
    f.built = false;
    f.building = { what: `${SIZE_LABEL[nf.size]} ${nf.name}`, daysLeft: cost.days, totalDays: cost.days, costGp: cost.gp, toSize: nf.size };
    b.goldSpent += cost.gp;
    payGold(d, [b.ownerId], cost.gp, `building a ${SIZE_LABEL[nf.size].toLowerCase()} ${nf.name}`);
    log(d, `${b.name}: construction starts on a ${SIZE_LABEL[nf.size].toLowerCase()} ${nf.name} (${cost.gp.toLocaleString()} GP, ${cost.days} days).`);
  } else {
    log(d, `${b.name}: adds ${nf.kind === 'special' ? 'the special facility' : 'a'} ${nf.name}.`);
  }
  b.facilities.push(f);
});

export const enlargeFacility = act((d, _ctx, bastionId: string, facilityId: string) => {
  const b = d.bastions.find((x) => x.id === bastionId);
  const f = b?.facilities.find((x) => x.id === facilityId);
  if (!b || !f || f.building) return;
  const step = ENLARGE[f.size];
  if (!step) return;
  f.building = { what: `Enlarging the ${f.name} to ${SIZE_LABEL[step.to]}`, daysLeft: step.days, totalDays: step.days, costGp: step.gp, toSize: step.to };
  b.goldSpent += step.gp;
  payGold(d, [b.ownerId], step.gp, `enlarging the ${f.name}`);
  log(d, `${b.name}: work starts enlarging the ${f.name} to ${SIZE_LABEL[step.to].toLowerCase()} (${step.gp.toLocaleString()} GP, ${step.days} days).`);
});

/** Resolves one Bastion turn: logs each order, and rolls a Bastion event if every special facility was told to Maintain. */
// ---- Bastion orders, defenders and events (2024 DMG chapter 8)

/** The Bastion's own storage, where finished goods wait until claimed. */
export function bastionStash(s: State, b: Bastion): Stash {
  let st = s.stashes.find((x) => x.id === `bastion-${b.id}`);
  if (!st) {
    st = { id: `bastion-${b.id}`, name: `${b.name} stores`, kind: 'stash', location: b.name, capacityLb: null, items: [], purse: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }, notes: 'Goods made, harvested or found by the Bastion.' };
    s.stashes.push(st);
  }
  return st;
}

function stashAdd(s: State, b: Bastion, name: string, qty: number, valueGp?: number): void {
  const st = bastionStash(s, b);
  const same = st.items.find((i) => i.name === name);
  if (same) same.qty += qty;
  else {
    const est = estimateWeight(name);
    st.items.push({ id: uid(), name, qty, weight: est.weight, source: est.source, valueGp, container: null, ammo: null });
  }
}

export function bastionDefenders(b: Bastion): number {
  return (b.defenders ?? 0) + (b.undead ?? 0) + (b.menagerie ?? []).filter((m) => m.defends).length + (b.guests ?? []).filter((g) => g.kind === 'mercenary').length;
}

export function barrackRoom(b: Bastion): number {
  return b.facilities.filter((f) => f.name === 'Barrack' && f.built).reduce((a, f) => a + (BARRACK_ROOM[f.size] ?? 12), 0);
}

/** Removes defenders: Barrack soldiers first, then mercenary guests, then Menagerie creatures. */
function loseDefenders(s: State, b: Bastion, n: number, why: string): number {
  let left = n;
  const fromBarrack = Math.min(left, b.defenders ?? 0);
  b.defenders = (b.defenders ?? 0) - fromBarrack;
  left -= fromBarrack;
  const fromUndead = Math.min(left, b.undead ?? 0);
  if (fromUndead) {
    b.undead = (b.undead ?? 0) - fromUndead;
    b.undeadReturning = [...(b.undeadReturning ?? []), ...Array.from({ length: fromUndead }, () => s.dayIndex + 14)];
    left -= fromUndead;
  }
  while (left > 0 && (b.guests ?? []).some((g) => g.kind === 'mercenary')) {
    const i = b.guests!.findIndex((g) => g.kind === 'mercenary');
    b.guests!.splice(i, 1);
    left -= 1;
  }
  while (left > 0 && (b.menagerie ?? []).some((m) => m.defends)) {
    const i = b.menagerie!.findIndex((m) => m.defends);
    log(s, `${b.name}: the ${b.menagerie![i].name} from the Menagerie is killed.`, 'bad');
    b.menagerie!.splice(i, 1);
    left -= 1;
  }
  const lost = n - left;
  if (lost) log(s, `${b.name} loses ${lost} Bastion Defender${lost > 1 ? 's' : ''} (${why}). ${bastionDefenders(b)} remain.`, 'bad');
  return lost;
}

const ownerLevel = (s: State, b: Bastion): number => charById(s, b.ownerId)?.level ?? 5;
const rarityKey = (r?: string): { rarity: Rarity; consumable: boolean } => ({ rarity: /uncommon/i.test(r ?? '') ? 'uncommon' : 'common', consumable: /consumable/i.test(r ?? '') });

/** Starts the work for a facility's chosen option: checks it, pays for it and sets how long it takes. */
function startWork(s: State, ctx: Ctx, b: Bastion, f: Facility): FacilityWork | null {
  const opts = FACILITY_OPTIONS[f.name] ?? [];
  const plan = f.plan ?? { option: opts[0]?.id ?? '' };
  const opt = opts.find((x) => x.id === plan.option) ?? opts[0];
  if (!opt) return null;
  const lvl = ownerLevel(s, b);
  if (opt.minLevel && lvl < opt.minLevel) {
    log(s, `${b.name}: ${opt.label} needs the owner to be level ${opt.minLevel}+. The ${f.name} idles this turn.`, 'warn');
    return null;
  }
  const hire = facilityHirelings(f.name, f.size);
  const pay = (gp: number, what: string) => {
    if (gp > 0) {
      payGold(s, [b.ownerId], gp, `${b.name}: ${what}`);
      b.goldSpent += gp;
    }
  };
  let days = BASTION_TURN_DAYS;
  const label = `${opt.label}${plan.text ? `: ${plan.text}` : plan.choice ? `: ${plan.choice}` : ''}`;
  switch (`${f.name}/${opt.id}`) {
    case 'Arcane Study/book':
      pay(10, 'a blank book');
      break;
    case 'Arcane Study/magic':
    case 'Sacristy/relic':
    case 'Smithy/magic':
    case 'Workshop/magic':
    case "Artificer's Forge/magic": {
      const { rarity, consumable } = rarityKey(plan.rarity);
      const c = magicItemCrafting(rarity, consumable);
      days = Math.ceil(c.days / hire);
      pay(c.gp, `crafting ${plan.text || 'a magic item'}`);
      break;
    }
    case 'Laboratory/alchemy':
    case 'Smithy/gear':
    case 'Workshop/gear': {
      const c = nonmagicalCrafting(plan.gp ?? 10);
      days = Math.ceil(c.days / hire);
      pay(c.gp, `materials for ${plan.text || 'an item'}`);
      break;
    }
    case 'Laboratory/poison': {
      const p = poisonByName(plan.choice ?? 'Torpor');
      pay(Math.floor((p?.gp ?? 0) / 2), `ingredients for ${p?.name ?? 'poison'}`);
      break;
    }
    case 'Armory/stock': {
      const gp = (100 + 100 * bastionDefenders(b)) / (b.facilities.some((x) => x.name === 'Smithy' && x.built) ? 2 : 1);
      pay(gp, 'stocking the Armory');
      break;
    }
    case 'Barrack/recruit':
      if ((b.defenders ?? 0) >= barrackRoom(b)) {
        log(s, `${b.name}: the Barracks are full (${barrackRoom(b)}), so the Recruit order can't be given.`, 'warn');
        return null;
      }
      break;
    case 'Menagerie/creature': {
      const c = MENAGERIE_CREATURES.find((x) => (plan.choice ?? '').startsWith(x.name)) ?? MENAGERIE_CREATURES[0];
      const used = (b.menagerie ?? []).filter((m) => (m.origin ?? 'menagerie') === 'menagerie').reduce((a, m) => a + (CREATURE_ROOM[m.size as keyof typeof CREATURE_ROOM] ?? 1), 0);
      if (used + CREATURE_ROOM[c.size] > MENAGERIE_ROOM) {
        log(s, `${b.name}: the Menagerie has no room for a ${c.size} creature.`, 'warn');
        return null;
      }
      pay(c.gp, `buying a ${c.name}`);
      break;
    }
    case 'Sacristy/holy':
      pay(Math.min(500, Math.floor((plan.gp ?? 0) / 100) * 100), 'empowering Holy Water');
      break;
    case 'Scriptorium/replica': {
      const st = bastionStash(s, b);
      const blank = st.items.find((i) => /book \(blank\)|blank book/i.test(i.name) && i.qty > 0);
      if (!blank) {
        log(s, `${b.name}: the Scriptorium needs a blank book in the Bastion's stores (the Arcane Study can make one).`, 'warn');
        return null;
      }
      blank.qty -= 1;
      st.items = st.items.filter((i) => i.qty > 0);
      break;
    }
    case 'Scriptorium/scroll': {
      const lv = Math.max(0, Math.min(3, Number(/(\d)/.exec(plan.text ?? '')?.[1] ?? 1)));
      const c = SCROLL_CRAFTING.find((x) => x.level === lv)!;
      days = Math.max(BASTION_TURN_DAYS, c.days);
      pay(c.gp, `scribing a level ${lv} scroll`);
      break;
    }
    case 'Scriptorium/paperwork':
      pay(Math.min(50, Math.max(1, Math.round(plan.gp ?? 50))), 'paperwork');
      break;
    case 'Stable/buy':
      pay(plan.gp ?? 0, 'buying animals');
      break;
    case 'Storehouse/buy': {
      const cap = storehouseLimit(lvl);
      const gp = Math.min(cap, plan.gp ?? 0);
      if ((plan.gp ?? 0) > cap) log(s, `${b.name}: the Storehouse can procure at most ${cap} GP of goods at level ${lvl}.`, 'warn');
      pay(gp, 'procuring goods');
      plan.gp = gp;
      break;
    }
    case 'Storehouse/sell': {
      const st = bastionStash(s, b);
      const stock = st.items.filter((i) => /^trade goods/i.test(i.name)).reduce((a, i) => a + (i.valueGp ?? 0) * i.qty, 0);
      if (stock <= 0) {
        log(s, `${b.name}: the Storehouse has no goods to sell. Procure some first.`, 'warn');
        return null;
      }
      plan.gp = Math.min(stock, plan.gp ?? stock);
      break;
    }
    case 'Theater/production':
    case "Lords' Alliance Noble Residence/noble":
      days = 14;
      break;
    case 'Order of the Gauntlet Tournament Field/tournament':
      days = 14;
      pay(2000, 'tournament prizes');
      break;
    case 'Construct Forge/construct': {
      const c = CONSTRUCTS.find((x) => (plan.choice ?? '').startsWith(x.name)) ?? CONSTRUCTS[0];
      days = c.days;
      pay(c.gp, `building a ${c.name}`);
      break;
    }
    case 'Red Wizard Necropolis/undead':
      if ((b.undead ?? 0) + (b.undeadReturning ?? []).length >= NECROPOLIS_ROOM) {
        log(s, `${b.name}: the Necropolis is full (${NECROPOLIS_ROOM}).`, 'warn');
        return null;
      }
      break;
    case 'Kundarak Vault/buy': {
      const cap = lvl >= 13 ? 5000 : 2000;
      const gp = Math.min(cap, plan.gp ?? 0);
      pay(gp, 'goods for the Kundarak Vault');
      plan.gp = gp;
      break;
    }
    case 'Kundarak Vault/sell': {
      const st = bastionStash(s, b);
      const stock = st.items.filter((i) => /^trade goods/i.test(i.name)).reduce((a, i) => a + (i.valueGp ?? 0) * i.qty, 0);
      if (stock <= 0) {
        log(s, `${b.name}: the vault holds no goods to sell.`, 'warn');
        return null;
      }
      plan.gp = Math.min(stock, plan.gp ?? stock);
      break;
    }
    case 'War Room/soldiers':
      if (b.army) {
        log(s, `${b.name}: an army is already in the field; disband it before mustering another.`, 'warn');
        return null;
      }
      if (!(b.lieutenants ?? 0)) {
        log(s, `${b.name}: the War Room needs at least one lieutenant to muster soldiers.`, 'warn');
        return null;
      }
      break;
    case 'War Room/lieutenant':
      if ((b.lieutenants ?? 0) >= 10) {
        log(s, `${b.name} already has ten lieutenants.`, 'warn');
        return null;
      }
      break;
    case 'Guildhall/assignment': {
      const guild = f.guild ?? GUILDS[0];
      if (guild === "Shipbuilders' Guild") {
        const ship = SHIPS.find((x) => (plan.text ?? '').toLowerCase().includes(x.name.toLowerCase())) ?? SHIPS[0];
        pay(ship.gp, `building a ${ship.name}`);
        days = Math.max(1, Math.ceil(ship.gp / 1000));
      } else if (guild === "Masons' Guild") {
        days = Math.max(1, Number(/(\d+)/.exec(plan.text ?? '')?.[1] ?? 7));
      } else if (guild === "Adventurers' Guild" || guild === "Thieves' Guild") {
        days = die(6, ctx.rng) + 1;
      }
      break;
    }
  }
  return { option: opt.id, label, daysLeft: days, plan: { ...plan } };
}

/** Applies the results of finished work. */
function finishWork(s: State, ctx: Ctx, b: Bastion, f: Facility, w: FacilityWork): void {
  const lvl = ownerLevel(s, b);
  const owner = charById(s, b.ownerId);
  const p = w.plan;
  const done = (text: string, tone: Tone = 'good') => {
    log(s, `${b.name}, ${f.name}: ${text}`, tone);
    b.reports = [`Turn ${b.turns}, ${f.name}: ${text}`, ...(b.reports ?? [])].slice(0, 40);
  };
  const today = s.dayIndex;
  switch (`${f.name}/${w.option}`) {
    case 'Arcane Study/focus':
      stashAdd(s, b, 'Arcane focus', 1, 10);
      return done('an Arcane Focus is ready in the Bastion stores.');
    case 'Arcane Study/book':
      stashAdd(s, b, 'Book (blank)', 1, 25);
      return done('a blank book is ready.');
    case 'Arcane Study/magic':
    case 'Sacristy/relic':
    case 'Smithy/magic':
    case 'Workshop/magic':
    case "Artificer's Forge/magic":
      stashAdd(s, b, p.text || `${p.rarity ?? 'Common'} magic item`, 1);
      return done(`${p.text || 'the magic item'} is finished.`);
    case 'Laboratory/alchemy':
    case 'Smithy/gear':
    case 'Workshop/gear':
      stashAdd(s, b, p.text || 'Crafted item', 1, p.gp);
      return done(`${p.text || 'the item'} is finished.`);
    case 'Laboratory/poison':
    case 'Greenhouse/poison': {
      const po = poisonByName(p.choice ?? '') ?? POISONS[0];
      stashAdd(s, b, poisonItemName(po), 1, po.gp);
      return done(`a vial of ${po.name} is ready.`);
    }
    case 'Greenhouse/herbs':
      stashAdd(s, b, 'Potion of Greater Healing', 1, 150);
      return done('a Potion of Greater Healing is brewed from the herbs.');
    case 'Garden/harvest': {
      const gardens = f.gardens?.length ? f.gardens : [{ type: 'Food', product: 'rations' }];
      const count = f.size === 'vast' ? 2 : 1;
      const got: string[] = [];
      for (const g of gardens.slice(0, count)) {
        const prods = GARDEN_PRODUCTS[(g.type as GardenType) in GARDEN_PRODUCTS ? (g.type as GardenType) : 'Food'];
        const prod = prods.find((x) => x.id === g.product) ?? prods[0];
        for (const it of prod.items) stashAdd(s, b, it.name, it.qty, it.valueGp);
        got.push(prod.label.toLowerCase());
      }
      return done(`the harvest is in: ${got.join(' and ')}.`);
    }
    case 'Reliquary/talisman':
      stashAdd(s, b, 'Reliquary talisman', 1);
      return done('the talisman is prepared. It replaces one spell’s Material components worth up to 1,000 GP, then must come back to recharge.');
    case 'Sacristy/holy': {
      const extra = Math.min(5, Math.floor((p.gp ?? 0) / 100));
      stashAdd(s, b, extra ? `Holy Water (+${extra}d8)` : 'Holy Water', 1, 25 + extra * 100);
      return done(`a flask of Holy Water${extra ? ` dealing an extra ${extra}d8` : ''} is blessed.`);
    }
    case 'Sanctuary/focus':
      stashAdd(s, b, p.choice?.startsWith('Holy') ? 'Holy symbol' : 'Druidic focus', 1, 5);
      return done(`a ${p.choice ?? 'sacred focus'} is crafted.`);
    case 'Scriptorium/replica':
      stashAdd(s, b, `Book: ${p.text || 'copy'}`, 1, 25);
      return done(`a copy of ${p.text || 'the book'} is made.`);
    case 'Scriptorium/scroll': {
      const lv = Math.max(0, Math.min(3, Number(/(\d)/.exec(p.text ?? '')?.[1] ?? 1)));
      const name = (p.text ?? 'Spell').split(',')[0].trim();
      stashAdd(s, b, `Spell Scroll (${name}, level ${lv})`, 1);
      return done(`a Spell Scroll of ${name} is scribed.`);
    }
    case 'Scriptorium/paperwork':
      return done(`${Math.min(50, Math.round(p.gp ?? 50))} copies are printed and distributed within 50 miles${p.text ? `: ${p.text}` : ''}.`);
    case 'Armory/stock':
      b.armoryStocked = true;
      return done('the Armory is stocked. Defender-loss rolls use d8s until an event uses it up.');
    case 'Barrack/recruit': {
      const room = barrackRoom(b) - (b.defenders ?? 0);
      const n = Math.max(0, Math.min(4, room));
      b.defenders = (b.defenders ?? 0) + n;
      return done(`${n} Bastion Defender${n === 1 ? '' : 's'} recruited (${bastionDefenders(b)} in all).`);
    }
    case 'Menagerie/creature': {
      const c = MENAGERIE_CREATURES.find((x) => (p.choice ?? '').startsWith(x.name)) ?? MENAGERIE_CREATURES[0];
      b.menagerie = [...(b.menagerie ?? []), { name: c.name, size: c.size, defends: true }];
      return done(`a ${c.name} joins the Menagerie and counts as a Bastion Defender.`);
    }
    case 'Gaming Hall/gamble': {
      const r = die(100, ctx.rng);
      const dice = r <= 50 ? 1 : r <= 85 ? 2 : r <= 95 ? 4 : 10;
      const gp = rollDice(dice, 6, ctx.rng) * 10;
      receiveGold(s, [b.ownerId], gp, `${b.name}'s gambling hall`);
      return done(`the gambling den closes its week. d100 = ${r}: your share is ${dice}d6 × 10 = ${gp} GP.`);
    }
    case 'Stable/buy':
      stashAdd(s, b, `Mounts bought (${p.text || `${p.gp ?? 0} GP worth`})`, 1, p.gp);
      return done(`the animals are bought and stabled. Add them on the Town & Money tab when they join the party.`);
    case 'Stable/sell': {
      const gp = Math.round((p.gp ?? 0) * (1 + stableMarkup(lvl)));
      receiveGold(s, [b.ownerId], gp, `animals sold by ${b.name}'s Stable`);
      return done(`the animals sell for ${gp} GP (${Math.round(stableMarkup(lvl) * 100)}% over standard).`);
    }
    case 'Storehouse/buy':
      stashAdd(s, b, 'Trade goods', 1, p.gp ?? 0);
      return done(`${p.gp ?? 0} GP of goods are procured and stored.`);
    case 'Storehouse/sell': {
      const st = bastionStash(s, b);
      let left = p.gp ?? 0;
      for (const it of st.items.filter((i) => /^trade goods/i.test(i.name))) {
        const v = (it.valueGp ?? 0) * it.qty;
        const take = Math.min(v, left);
        left -= take;
        it.valueGp = it.qty ? (v - take) / it.qty : 0;
      }
      st.items = st.items.filter((i) => !/^trade goods/i.test(i.name) || (i.valueGp ?? 0) > 0);
      const sold = (p.gp ?? 0) - left;
      const gp = Math.round(sold * (1 + storehouseMarkup(lvl)));
      receiveGold(s, [b.ownerId], gp, `goods sold by ${b.name}'s Storehouse`);
      return done(`${sold} GP of goods sell for ${gp} GP (${Math.round(storehouseMarkup(lvl) * 100)}% profit).`);
    }
    case 'Library/research':
    case 'Trophy Room/lore':
      return done(`research on "${p.text || 'the topic'}" is complete: up to three accurate facts you didn't know. Ask the DM for them.`);
    case 'Archive/lore':
    case 'Cult of the Dragon Archive/lore':
    case 'Museum/lore':
      return done(`the archivist has found what Legend Lore would reveal about "${p.text || 'the topic'}". Ask the DM.`);
    case 'Pub/spies':
      return done(`the spies report on events within 10 miles${p.text ? ` and on ${p.text}'s whereabouts over the last 7 days (if within 50 miles and not hidden by magic)` : ''}. Ask the DM.`);
    case 'Inquisitive Agency/investigate':
      return done(`the agency's file on ${p.text || 'the person'} is ready: where they stay, what they spend, whom they meet and where they showed papers, for the last 7 days and the next 7 within 10 miles. Ask the DM.`);
    case "Lords' Alliance Noble Residence/noble": {
      const r = die(6, ctx.rng);
      if (r % 2) return done(`no noble accepts the invitation (die ${r}).`, 'info');
      return done(`a noble${p.text ? ` from ${p.text}` : ''} visits (die ${r}) and gossips: the location of any familiar creature within 50 miles of their city, and where it was for the past 7 days. Ask the DM.`);
    }
    case 'Zhentarim Travel Station/recon':
      s.travel.reconAdvantage = true;
      return done(`reconnaissance${p.text ? ` for ${p.text}` : ''} is in: Advantage on Wisdom (Survival) checks to forage and navigate for the next journey.`);
    case 'Amethyst Dragon Den/psionic':
      if (owner) s.effects.push({ id: uid(), name: 'Psionic Defenses (Resistance to Psychic damage)', kind: 'gift', targetIds: [owner.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(s), endsAt: absNow(s) + 7 * MIN_PER_DAY, notes: 'From training in the Amethyst Dragon Den.' });
      return done(`${owner?.name ?? 'The owner'} completes psionic training: Resistance to Psychic damage for 7 days.`);
    case 'Harper Hideout/harper': {
      const r = die(6, ctx.rng);
      if (r % 2) return done(`no Harper needs the hideout this week (die ${r}).`, 'info');
      const names: string[] = [];
      for (const pp of p.people ?? []) {
        const c = charById(s, pp.charId);
        if (!c) continue;
        names.push(c.name);
        s.effects.push({ id: uid(), name: 'Harper training: proficiency in Deception, Investigation or Performance', kind: 'gift', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(s), endsAt: absNow(s) + 7 * MIN_PER_DAY, notes: 'Choose one skill.' });
      }
      return done(`a Harper stays the week (die ${r})${names.length ? `; ${names.join(', ')} gain a skill proficiency for 7 days` : ''}.`);
    }
    case 'Red Wizard Necropolis/undead': {
      const n = Math.max(0, Math.min(4, NECROPOLIS_ROOM - (b.undead ?? 0) - (b.undeadReturning ?? []).length));
      b.undead = (b.undead ?? 0) + n;
      return done(`${n} Undead Bastion Defender${n === 1 ? '' : 's'} rise in the crypts (${bastionDefenders(b)} defenders in all).`);
    }
    case 'Emerald Enclave Grove/nature': {
      const r = die(6, ctx.rng);
      const pick = p.choice ?? 'Satyr (Medium)';
      const size = (/\((\w+)\)/.exec(pick)?.[1] ?? 'Medium') as 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge';
      const used = (b.menagerie ?? []).filter((m) => m.origin === 'grove').reduce((a, m) => a + (GROVE_UNITS[m.size] ?? 1), 0);
      if (r % 2) return done(`the ${pick.split(' (')[0]} declines the invitation (die ${r}).`, 'info');
      if (used + (GROVE_UNITS[size] ?? 1) > GROVE_ROOM) return done(`the grove has no room for a ${size} creature.`, 'warn');
      b.menagerie = [...(b.menagerie ?? []), { name: pick.split(' (')[0], size, defends: true, origin: 'grove' }];
      return done(`a ${pick.split(' (')[0]} moves into the grove (die ${r}) and counts as a Bastion Defender.`);
    }
    case 'Construct Forge/construct': {
      const c = CONSTRUCTS.find((x) => (p.choice ?? '').startsWith(x.name)) ?? CONSTRUCTS[0];
      b.menagerie = [...(b.menagerie ?? []), { name: c.name, size: 'Medium', defends: true, origin: 'construct' }];
      return done(`a ${c.name} is complete and joins the Bastion Defenders.`);
    }
    case 'Order of the Gauntlet Tournament Field/tournament': {
      let f2 = s.factions.find((x) => /gauntlet/i.test(x.name));
      if (!f2) {
        f2 = { id: uid(), name: 'Order of the Gauntlet', renown: 0, notes: '' };
        s.factions.push(f2);
      }
      f2.renown += 1;
      return done(`the tournament draws contestants from the region. Renown with the Order of the Gauntlet rises to ${f2.renown}.`);
    }
    case 'Dragonmark Outpost/favor':
      return done('the house agent calls in a favor your house Renown allows, without counting against your favors. You can do this again once your house Renown rises.');
    case 'Manifest Zone/charm':
      if (owner) grantCharm(s, owner, `Manifest Charm of ${p.choice ?? 'the linked plane'}`, 1, null, 'Lasts until used. See Eberron: Forge of the Artificer for its effect.');
      return done(`the rites end: ${owner?.name ?? 'the owner'} gains a Manifest Charm of ${p.choice ?? 'the linked plane'}.`);
    case "Navigator's Helm/travel":
    case 'Lyrandar Helm/travel':
    case 'Orien Helm/travel': {
      const mph = f.name === 'Orien Helm' ? 30 : Math.max(0.5, p.gp ?? 2);
      return done(`the mobile Bastion travels up to ${Math.round(mph * 8 * 7)} miles this turn (${mph} mph, 8 hours a day) toward ${p.text || 'its destination'}, stopping early on arrival.`);
    }
    case 'Kundarak Vault/buy':
      stashAdd(s, b, 'Trade goods', 1, p.gp ?? 0);
      return done(`${p.gp ?? 0} GP of goods are stored in the vault, reachable from any Kundarak bank.`);
    case 'Kundarak Vault/sell': {
      const st = bastionStash(s, b);
      let left = p.gp ?? 0;
      for (const it of st.items.filter((i) => /^trade goods/i.test(i.name))) {
        const v = (it.valueGp ?? 0) * it.qty;
        const take = Math.min(v, left);
        left -= take;
        it.valueGp = it.qty ? (v - take) / it.qty : 0;
      }
      st.items = st.items.filter((i) => !/^trade goods/i.test(i.name) || (i.valueGp ?? 0) > 0);
      const sold = (p.gp ?? 0) - left;
      const gp = Math.round(sold * (1 + stableMarkup(lvl)));
      receiveGold(s, [b.ownerId], gp, `goods sold from ${b.name}'s Kundarak Vault`);
      return done(`${sold} GP of goods sell for ${gp} GP.`);
    }
    case 'Trophy Room/trinket': {
      const r = die(6, ctx.rng);
      if (r % 2 === 0) {
        stashAdd(s, b, 'Common magic item (Implements table)', 1);
        return done(`the search turns up a Common magic item (die ${r}). Roll on the Implements - Common table for what it is.`);
      }
      return done(`the search finds nothing useful (die ${r}).`, 'info');
    }
    case 'Meditation Chamber/peace':
      b.innerPeace = true;
      return done('the hirelings find inner peace: the next Bastion event is rolled twice.');
    case 'Demiplane/resilience':
      b.demiplaneUntilDay = today + 7;
      return done('runes glow on the Demiplane walls for 7 days: a Long Rest there grants Temporary HP equal to five times your level.');
    case 'Observatory/discovery': {
      const r = die(6, ctx.rng);
      if (r % 2 === 0 || !owner) return done(`seven nights under the stars reveal nothing (die ${r}).`, 'info');
      const charm = ['Charm of Darkvision', 'Charm of Heroism', 'Charm of Vitality'][die(3, ctx.rng) - 1];
      grantCharm(s, owner, charm, charm === 'Charm of Darkvision' ? 3 : 1, null, charm === 'Charm of Darkvision' ? 'Cast Darkvision; vanishes after three uses.' : `Magic action: the benefit of a Potion of ${charm.split(' ').pop()}; then it vanishes.`);
      return done(`an unknown power answers (die ${r}): ${owner.name} gains a ${charm}.`);
    }
    case 'Sanctum/rites': {
      const who = p.people?.[0]?.charId ?? b.ownerId;
      b.rites = { charId: who, untilDay: today + 7 };
      return done(`daily rites for ${charById(s, who)?.name ?? 'the beneficiary'}: Temporary HP equal to ${lvl} after each Long Rest for 7 days.`);
    }
    case 'Training Area/training': {
      const t = TRAINERS.find((x) => x.name === f.trainer) ?? TRAINERS[0];
      const names: string[] = [];
      for (const pp of p.people ?? []) {
        const c = charById(s, pp.charId);
        if (!c) continue;
        names.push(c.name);
        s.effects.push({ id: uid(), name: `Training: ${t.name}`, kind: 'gift', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(s), endsAt: absNow(s) + 7 * MIN_PER_DAY, notes: t.benefit });
      }
      return done(names.length ? `${names.join(', ')} finish the ${t.name}'s training: ${t.benefit} (7 days).` : 'nobody trained this week.', names.length ? 'good' : 'info');
    }
    case 'Theater/production': {
      const people = p.people ?? [];
      let ok = 0;
      const rolls: string[] = [];
      for (const pp of people) {
        const r = d20('normal', ctx.rng);
        const total = r.value + pp.bonus;
        if (total >= 15) ok += 1;
        rolls.push(`${charById(s, pp.charId)?.name ?? '?'} ${total}`);
      }
      const dieSize = lvl >= 17 ? 10 : lvl >= 13 ? 8 : 6;
      if (people.length && ok > people.length - ok) {
        for (const pp of people) {
          const c = charById(s, pp.charId);
          if (!c) continue;
          c.resources = c.resources.filter((r) => !/^Theater die/.test(r.name));
          c.resources.push({ id: uid(), name: `Theater die (d${dieSize})`, max: 1, current: 1, recharge: 'manual' });
        }
        return done(`opening night! Performance checks (DC 15): ${rolls.join(', ')}. Every contributor gains a Theater die (d${dieSize}) to add to one D20 Test.`);
      }
      return done(`the production falls flat. Performance checks (DC 15): ${rolls.join(', ') || 'nobody contributed'}.`, 'info');
    }
    case 'Teleportation Circle/invite': {
      const r = die(6, ctx.rng);
      if (r % 2) return done(`the invited spellcaster declines (die ${r}).`, 'info');
      b.guests = [...(b.guests ?? []), { id: uid(), kind: 'spellcaster', label: `Visiting spellcaster: casts one Wizard spell of level ${lvl >= 17 ? 8 : 4} or lower for you (you pay costly components)`, untilDay: today + 14 }];
      return done(`a Friendly spellcaster arrives through the circle (die ${r}) and stays 14 days or until they cast a spell for you.`);
    }
    case 'War Room/lieutenant':
      b.lieutenants = Math.min(10, (b.lieutenants ?? 0) + 1);
      return done(`a new lieutenant joins (${b.lieutenants} in all).`);
    case 'War Room/soldiers': {
      const mounted = /mounted/i.test(p.choice ?? '');
      const per = mounted ? 20 : 100;
      const n = (b.lieutenants ?? 0) * per;
      b.army = { guards: n, horses: mounted ? n : 0 };
      return done(`${b.lieutenants} lieutenant(s) muster ${n} Guards${mounted ? ' on Riding Horses' : ''}. Feeding them costs ${n * (mounted ? 2 : 1)} GP a day.`);
    }
    case 'Guildhall/assignment': {
      const guild = f.guild ?? GUILDS[0];
      if (guild === "Bakers' Guild") {
        receiveGold(s, [b.ownerId], 500, `${b.name}'s bakers`);
        return done('the bakers deliver for a prestigious event and are paid 500 GP (or take a favor instead, by arrangement with the DM).');
      }
      if (guild === "Brewers' Guild") {
        stashAdd(s, b, 'Barrel of ale (40 gallons)', 50, 10);
        return done('fifty 40-gallon barrels of ale (10 GP each) arrive.');
      }
      if (guild === "Masons' Guild") {
        const sq = Math.max(1, Number(/(\d+)/.exec(p.text ?? '')?.[1] ?? 7));
        b.facilities.push({ id: uid(), name: `Defensive walls (${sq} squares)`, kind: 'basic', size: 'cramped', order: 'Maintain', orderNote: '', built: true, building: null });
        return done(`the masons raise ${sq} squares of defensive wall at no cost.`);
      }
      if (guild === "Shipbuilders' Guild") {
        const ship = SHIPS.find((x) => (p.text ?? '').toLowerCase().includes(x.name.toLowerCase())) ?? SHIPS[0];
        s.stashes.push({ id: uid(), name: ship.name, kind: 'vehicle', speedMph: ship.mph, location: b.name, capacityLb: null, items: [], purse: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }, notes: `Built by ${b.name}'s shipbuilders.` });
        return done(`the shipbuilders launch a ${ship.name}. It's on the Storage tab.`);
      }
      if (guild === "Thieves' Guild") return done(`the thieves deliver ${p.text || 'the object'} to the Bastion. The DM decides whether anyone comes looking for it.`, 'warn');
      return done(`the adventurers return: ${p.text || 'the beast'} has been dealt with${b.facilities.some((x) => x.name === 'Trophy Room') ? ' (a trophy can go in the Trophy Room)' : ''}.`);
    }
  }
  done(`${w.label} is complete.`);
}

function grantCharm(s: State, c: Character, name: string, uses: number, endsAt: number | null, notes: string): void {
  if (s.effects.some((e) => e.name === name && e.targetIds.includes(c.id))) return;
  s.effects.push({ id: uid(), name, kind: 'gift', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(s), endsAt, notes });
  c.resources.push({ id: uid(), name, max: uses, current: uses, recharge: 'manual' });
}

/** Rolls and applies a Bastion event. */
function bastionEvent(s: State, ctx: Ctx, b: Bastion, excludeOpportunity = false): void {
  const roll1 = rollBastionEvent(ctx.rng);
  let e = roll1;
  if (b.innerPeace) {
    const roll2 = rollBastionEvent(ctx.rng);
    e = EVENT_PREFERENCE.indexOf(roll2.event) < EVENT_PREFERENCE.indexOf(roll1.event) ? roll2 : roll1;
    log(s, `${b.name}: the Meditation Chamber's calm lets the event be rolled twice (${roll1.event}, ${roll2.event}); keeping ${e.event}.`);
    b.innerPeace = false;
  }
  while (excludeOpportunity && e.event === 'Extraordinary Opportunity') e = rollBastionEvent(ctx.rng);
  b.lastEvent = `Turn ${b.turns}: ${e.event} (d100 = ${e.roll})`;
  const say = (text: string, tone: Tone = 'info') => {
    log(s, `${b.name}, Bastion event (d100 = ${e.roll}): ${e.event}. ${text}`, tone);
    b.reports = [`Turn ${b.turns}, event: ${e.event}. ${text}`, ...(b.reports ?? [])].slice(0, 40);
  };
  const special = b.facilities.filter((f) => f.kind === 'special' && f.built);
  const randomFacility = () => special[die(Math.max(1, special.length), ctx.rng) - 1];
  switch (e.event) {
    case 'All Is Well':
      return say(ALL_IS_WELL[die(8, ctx.rng) - 1]);
    case 'Attack': {
      const monster = (b.guests ?? []).find((g) => g.kind === 'monster');
      b.guests = (b.guests ?? []).filter((g) => g.kind !== 'spellcaster' && g.kind !== 'refugees');
      if (monster) {
        b.guests = b.guests.filter((g) => g.id !== monster.id);
        return say(`A hostile force attacks and is beaten off. Your monstrous guest defends the Bastion, so no defenders are lost, and then it departs.`, 'warn');
      }
      const sides = b.armoryStocked ? 8 : 6;
      const knight = b.facilities.some((x) => x.name === 'Order of the Gauntlet Tournament Field' && x.built);
      const rolls = Array.from({ length: knight ? 5 : 6 }, () => die(sides, ctx.rng));
      const ones = rolls.filter((r) => r === 1).length;
      const had = bastionDefenders(b);
      if (b.armoryStocked) b.armoryStocked = false;
      if (had === 0) {
        const f = randomFacility();
        if (f) f.shutTurns = 1;
        return say(`A hostile force attacks and is beaten off, but with no defenders the ${f?.name ?? 'Bastion'} is damaged and shut down for the next turn (repaired free after).`, 'bad');
      }
      say(`A hostile force attacks and is defeated. ${rolls.length}d${sides}: ${rolls.join(', ')}${sides === 8 ? ' (stocked Armory, now used up)' : ''}${knight ? ' (one die fewer thanks to the resident knight)' : ''}.`, ones ? 'bad' : 'warn');
      loseDefenders(s, b, ones, 'the attack');
      return;
    }
    case 'Criminal Hireling': {
      const gp = die(6, ctx.rng) * 100;
      const f = randomFacility();
      b.decision = { kind: 'bribe', gp, facilityId: f?.id ?? null };
      return say(`Officials arrive with a warrant for a hireling${f ? ` from the ${f.name}` : ''}. Pay a ${gp} GP bribe to keep them, or let them be taken (the facility then idles a turn).`, 'warn');
    }
    case 'Extraordinary Opportunity':
      b.decision = { kind: 'opportunity' };
      return say('A chance to host a festival, fund a spellcaster’s research or appease a noble. Pay 500 GP to seize it (and roll another event), or decline.', 'info');
    case 'Friendly Visitors': {
      const gp = die(6, ctx.rng) * 100;
      const f = randomFacility();
      receiveGold(s, [b.ownerId], gp, `visitors using ${b.name}'s ${f?.name ?? 'facilities'}`);
      return say(`Visitors pay ${gp} GP for brief use of the ${f?.name ?? 'Bastion'}.`, 'good');
    }
    case 'Guest': {
      const r = die(4, ctx.rng);
      if (r === 1) {
        b.guests = [...(b.guests ?? []), { id: uid(), kind: 'renown', label: 'Renowned guest (leaves a letter of recommendation)', untilDay: s.dayIndex + 7 }];
        return say('A guest of great renown stays 7 days and will leave a letter of recommendation.', 'good');
      }
      if (r === 2) {
        const gp = die(6, ctx.rng) * 100;
        b.guests = [...(b.guests ?? []), { id: uid(), kind: 'sanctuary', label: `Guest in sanctuary (gift of ${gp} GP on leaving)`, untilDay: s.dayIndex + 7 }];
        receiveGold(s, [b.ownerId], gp, `a grateful guest at ${b.name}`);
        return say(`A guest seeks sanctuary for 7 days and offers a gift of ${gp} GP.`, 'good');
      }
      if (r === 3) {
        b.guests = [...(b.guests ?? []), { id: uid(), kind: 'mercenary', label: 'Mercenary guest (counts as a Bastion Defender)' }];
        return say('A mercenary arrives and serves as an extra Bastion Defender until sent away or killed.', 'good');
      }
      b.guests = [...(b.guests ?? []), { id: uid(), kind: 'monster', label: 'Friendly monster guest (defends once, then leaves)' }];
      return say('A Friendly monster comes to stay. If the Bastion is attacked it defends, no defenders are lost, and then it leaves.', 'good');
    }
    case 'Lost Hirelings': {
      const f = randomFacility();
      if (f) f.shutTurns = 1;
      return say(`The ${f?.name ?? 'facility'} loses its hirelings and can't be used next turn; they're replaced free after that.`, 'warn');
    }
    case 'Magical Discovery':
      stashAdd(s, b, 'Uncommon Potion or Scroll (your choice)', 1);
      return say('The hirelings discover or accidentally create an Uncommon potion or scroll of your choice. It waits in the Bastion stores.', 'good');
    case 'Refugees': {
      const n = rollDice(2, 4, ctx.rng);
      const gp = die(6, ctx.rng) * 100;
      b.guests = [...(b.guests ?? []).filter((g) => g.kind !== 'refugees'), { id: uid(), kind: 'refugees', label: `${n} refugees (stay until rehomed or the Bastion is attacked)` }];
      receiveGold(s, [b.ownerId], gp, `refugees sheltering at ${b.name}`);
      return say(`${n} refugees seek shelter and pay ${gp} GP for your protection.`, 'good');
    }
    case 'Request for Aid':
      b.decision = { kind: 'aid' };
      return say(`A local leader asks for help. Send Bastion Defenders (1d6 each; 10+ solves it for a 1d6 × 100 GP reward, less halves the reward and costs a defender), or refuse.`);
    case 'Treasure': {
      const r = die(100, ctx.rng);
      const t = TREASURE_TABLE.find((x) => r <= x.upTo)!;
      stashAdd(s, b, t.what, 1, t.valueGp);
      return say(`d100 = ${r}: ${t.what}. ${t.valueGp ? '' : 'Roll on the matching magic item table. '}It waits in the Bastion stores.`, 'good');
    }
  }
  say('See the DMG.');
}

/** The owner answers an event's choice. */
export const resolveBastionDecision = act((d, ctx, bastionId: string, accept: boolean, defendersSent: number = 0) => {
  const b = d.bastions.find((x) => x.id === bastionId);
  const dec = b?.decision;
  if (!b || !dec) return;
  b.decision = null;
  if (dec.kind === 'bribe') {
    if (accept) {
      payGold(d, [b.ownerId], dec.gp, `a bribe to keep a hireling at ${b.name}`);
      log(d, `${b.name}: the bribe is paid and the hireling stays.`, 'good');
    } else {
      const f = b.facilities.find((x) => x.id === dec.facilityId);
      if (f && facilityHirelings(f.name, f.size) <= 1) f.shutTurns = 1;
      log(d, `${b.name}: the hireling is arrested${f && facilityHirelings(f.name, f.size) <= 1 ? `, and the ${f.name} idles next turn until a replacement arrives` : ''}.`, 'warn');
    }
  } else if (dec.kind === 'opportunity') {
    if (!accept) return void log(d, `${b.name} declines the opportunity.`);
    payGold(d, [b.ownerId], 500, `${b.name}'s extraordinary opportunity`);
    log(d, `${b.name} seizes the opportunity, and the attention brings another event.`, 'good');
    bastionEvent(d, ctx, b, true);
  } else if (dec.kind === 'aid') {
    const n = Math.min(bastionDefenders(b), Math.max(0, Math.round(defendersSent)));
    if (!accept || n === 0) return void log(d, `${b.name} sends no help.`);
    const rolls = Array.from({ length: n }, () => die(6, ctx.rng));
    const total = rolls.reduce((a, x) => a + x, 0);
    const reward = die(6, ctx.rng) * 100;
    if (total >= 10) {
      receiveGold(d, [b.ownerId], reward, `${b.name}'s aid to a local leader`);
      log(d, `${b.name} sends ${n} defender(s): ${rolls.join(' + ')} = ${total}. The problem is solved; reward ${reward} GP.`, 'good');
    } else {
      receiveGold(d, [b.ownerId], reward / 2, `${b.name}'s aid to a local leader`);
      log(d, `${b.name} sends ${n} defender(s): ${rolls.join(' + ')} = ${total}. Solved, but the reward is halved (${reward / 2} GP).`, 'warn');
      loseDefenders(d, b, 1, 'the request for aid');
    }
  }
});

export const disbandArmy = act((d, _ctx, bastionId: string) => {
  const b = d.bastions.find((x) => x.id === bastionId);
  if (!b?.army) return;
  b.army = null;
  log(d, `${b.name}'s army disbands.`);
});

export const dismissGuest = act((d, _ctx, bastionId: string, guestId: string) => {
  const b = d.bastions.find((x) => x.id === bastionId);
  if (!b) return;
  const g = (b.guests ?? []).find((x) => x.id === guestId);
  b.guests = (b.guests ?? []).filter((x) => x.id !== guestId);
  if (g) log(d, `${b.name}: ${g.label.split(' (')[0]} departs.`);
});

/** Each midnight: feed the army, see guests off. */
function bastionDaily(s: State): void {
  for (const b of s.bastions) {
    if (b.abandoned) continue;
    const necro = b.facilities.find((f) => f.name === 'Red Wizard Necropolis' && f.built);
    if ((b.undeadReturning ?? []).length && necro && !(necro.shutTurns ?? 0)) {
      const back = b.undeadReturning!.filter((d) => d <= s.dayIndex).length;
      if (back) {
        b.undeadReturning = b.undeadReturning!.filter((d) => d > s.dayIndex);
        b.undead = Math.min(NECROPOLIS_ROOM, (b.undead ?? 0) + back);
        log(s, `${b.name}: ${back} destroyed Undead defender${back > 1 ? 's' : ''} rise again in the Necropolis.`);
      }
    }
    if (b.army) {
      const owner = charById(s, b.ownerId);
      const cost = b.army.guards + b.army.horses;
      if (!owner || owner.gp < cost) {
        log(s, `${b.name}'s army goes a day unfed (${cost} GP needed) and disbands.`, 'bad');
        b.army = null;
      } else payGold(s, [b.ownerId], cost, `feeding ${b.name}'s army`);
    }
    for (const g of [...(b.guests ?? [])]) {
      if (g.untilDay != null && s.dayIndex >= g.untilDay) {
        b.guests = b.guests!.filter((x) => x.id !== g.id);
        if (g.kind === 'renown') {
          stashAdd(s, b, 'Letter of recommendation', 1);
          log(s, `${b.name}: the renowned guest departs, leaving a letter of recommendation.`, 'good');
        } else log(s, `${b.name}: ${g.label.split(' (')[0]} departs.`);
      }
    }
  }
}

/** A Long Rest at the Bastion: Charms from facilities, Demiplane and Sanctum Temporary HP. */
function bastionLongRest(s: State): void {
  s.travel.paceBoost = false;
  for (const b of s.bastions) {
    if (b.abandoned) continue;
    const owner = charById(s, b.ownerId);
    const lvl = owner?.level ?? 5;
    if (owner && alive(owner) && b.distanceMiles === 0) {
      for (const f of b.facilities.filter((x) => x.kind === 'special' && x.built)) {
        const charm = BASTION_CHARMS[f.name];
        if (!charm) continue;
        const name = charm.split(':')[0];
        if (s.effects.some((e) => e.name === name && e.targetIds.includes(owner.id))) continue;
        grantCharm(s, owner, name, 1, absNow(s) + 7 * MIN_PER_DAY, charm.split(': ')[1] + '. Lasts 7 days or until used.');
        log(s, `${owner.name} wakes in ${b.name} with a ${name} (${charm.split(': ')[1]}; 7 days or until used).`, 'good');
      }
      if (b.facilities.some((x) => x.name === "Lords' Alliance Noble Residence" && x.built) && !owner.resources.some((r) => r.name === 'Heroic Inspiration' && r.current > 0)) {
        owner.resources = owner.resources.filter((r) => r.name !== 'Heroic Inspiration');
        owner.resources.push({ id: uid(), name: 'Heroic Inspiration', max: 1, current: 1, recharge: 'manual' });
        log(s, `${owner.name} wakes refreshed in the Noble Residence with Heroic Inspiration.`, 'good');
      }
      const museum = b.facilities.find((x) => x.name === 'Museum' && x.built && x.studied);
      if (museum) {
        museum.studied = false;
        grantCharm(s, owner, `Charm of ${museum.guild ?? MUSEUM_ORIGINS[0]}`, 1, absNow(s) + 7 * MIN_PER_DAY, 'From the Museum’s treasure. Lasts 7 days or until used; see Eberron: Forge of the Artificer for its effect.');
        log(s, `${owner.name} gains the Charm of ${museum.guild ?? MUSEUM_ORIGINS[0]} from the Museum's treasure.`, 'good');
      }
      if (b.facilities.some((x) => x.name === 'Zhentarim Travel Station' && x.built)) {
        s.travel.paceBoost = true;
        log(s, `Rested at the Zhentarim Travel Station, the party's maximum travel pace is one step faster until their next Long Rest elsewhere.`, 'good');
      }
      if ((b.demiplaneUntilDay ?? -1) >= s.dayIndex && b.facilities.some((x) => x.name === 'Demiplane' && x.built)) {
        owner.tempHp = Math.max(owner.tempHp, 5 * lvl);
        log(s, `${owner.name} rests in the Demiplane among glowing runes: ${5 * lvl} Temporary HP.`, 'good');
      }
    }
    if (b.rites && b.rites.untilDay >= s.dayIndex) {
      const c = charById(s, b.rites.charId);
      if (c && alive(c)) {
        c.tempHp = Math.max(c.tempHp, lvl);
        log(s, `Rites in ${b.name}'s Sanctum fortify ${c.name}: ${lvl} Temporary HP.`, 'good');
      }
    }
  }
}

export const resolveBastionTurn = act((d, ctx, bastionId: string) => {
  const b = d.bastions.find((x) => x.id === bastionId);
  if (!b || b.abandoned || turnsDue(d, b) < 1) return;
  b.lastTurnDay += BASTION_TURN_DAYS;
  b.turns += 1;
  const working = b.facilities.filter((f) => f.kind === 'special' && f.built);
  // Work already under way moves on a turn, whatever the new orders are.
  for (const f of working) {
    if (!f.work) continue;
    if ((f.shutTurns ?? 0) > 0) continue;
    f.work.daysLeft -= BASTION_TURN_DAYS;
    if (f.work.daysLeft <= 0) {
      const w = f.work;
      f.work = null;
      finishWork(d, ctx, b, f, w);
    } else log(d, `${b.name}, ${f.name}: ${f.work.label} continues (${f.work.daysLeft} more days).`);
  }
  // An absent owner's orders only count if they arrived in time; otherwise the hirelings Maintain (DMG).
  const away = b.distanceMiles > 0;
  const maintain = b.maintain || (away && !b.ordersArrived);
  if (away && !b.ordersArrived && !b.maintain) log(d, `No new orders reached ${b.name} before this turn, so its hirelings Maintain.`, 'warn');
  // Neglect: an owner who is dead, or away with no orders arriving, issues no orders this turn.
  const owner = charById(d, b.ownerId);
  const noOrders = !owner || !alive(owner) || (away && !b.ordersArrived);
  b.neglectedTurns = noOrders ? (b.neglectedTurns ?? 0) + 1 : 0;
  b.ordersArrived = false;
  const limit = neglectLimit(owner?.level ?? 1);
  if (noOrders && b.neglectedTurns >= limit) {
    b.abandoned = true;
    log(d, `${b.name} has had no orders for ${b.neglectedTurns} turns in a row (the owner's level is ${owner?.level ?? '?'}). The hirelings abandon it, and the site will be looted. A new Bastion can be founded later, perhaps amid the ruins (2024 DMG).`, 'bad');
    return;
  }
  if (noOrders && b.neglectedTurns >= limit - 1) log(d, `${b.name}: ${b.neglectedTurns} turn(s) without orders. One more and the hirelings walk away.`, 'warn');
  const started: string[] = [];
  if (!maintain) {
    for (const f of working) {
      if ((f.shutTurns ?? 0) > 0) {
        started.push(`${f.name}: shut down this turn`);
        continue;
      }
      if (f.order === 'Maintain') continue;
      if (f.work) {
        started.push(`${f.name}: busy with ${f.work.label}`);
        continue;
      }
      const w = startWork(d, ctx, b, f);
      if (w) {
        f.work = w;
        started.push(`${f.name}: ${w.label} (${w.daysLeft} days)`);
      }
    }
  }
  for (const f of working) if ((f.shutTurns ?? 0) > 0) f.shutTurns! -= 1;
  log(d, `${b.name}, Bastion turn ${b.turns}. Orders: ${maintain ? 'Maintain (the whole Bastion)' : started.join('; ') || 'none'}.`);
  if (maintain || !working.length) bastionEvent(d, ctx, b);
  else b.lastEvent = `Turn ${b.turns}: ${started.length} order(s) under way`;
  // The owner hears about it only when the report reaches them.
  if (away) {
    const delay = commDelay(b.reportMethod, b.distanceMiles) ?? commDelay('courier', b.distanceMiles)!;
    const now = absNow(d);
    d.dispatches.push({ id: uid(), bastionId: b.id, direction: 'report', method: b.reportMethod, sentAt: now, arrivesAt: now + delay, costGp: 0, delivered: false, report: (b.reports ?? []).slice(0, 4).join(' ') || b.lastEvent });
    log(d, `${b.name} sends its report by ${COMMS[b.reportMethod].label.toLowerCase()}; it should reach ${charById(d, b.ownerId)?.name ?? 'the owner'} in ${formatDuration(Math.max(1, delay))}.`);
  }
});

/** Sends the drafted orders to a distant Bastion. They take effect when they arrive. */
export const sendBastionOrders = act((d, ctx, bastionId: string, method: CommMethod, helperId: string | null) => {
  const b = d.bastions.find((x) => x.id === bastionId);
  if (!b) return;
  const info = COMMS[method];
  const delay = commDelay(method, b.distanceMiles);
  if (delay == null) {
    log(d, `${info.label} can't reach ${b.name}: it's ${b.distanceMiles} miles away (at most ${info.maxMiles}).`, 'warn');
    return;
  }
  let hirelingId: string | undefined;
  if (info.needs === 'messenger') {
    const h = d.hirelings.find((x) => x.id === helperId && x.active && x.role === 'messenger');
    if (!h) {
      log(d, 'Choose an employed messenger hireling to carry the orders.', 'warn');
      return;
    }
    if (h.busyUntil && h.busyUntil > absNow(d)) {
      log(d, `${h.name} is still out on another errand (back in ${formatDuration(h.busyUntil - absNow(d))}).`, 'warn');
      return;
    }
    hirelingId = h.id;
    h.busyUntil = absNow(d) + delay * 2;
  } else if (info.needs) {
    const caster = helperId ? charById(d, helperId) : undefined;
    const knows = caster?.spells.find((x) => x.name.toLowerCase() === info.needs!.toLowerCase());
    if (!caster || !knows) {
      log(d, `Someone who knows ${info.needs} has to cast it.`, 'warn');
      return;
    }
    const ritual = method === 'animal';
    if (!ritual && info.slotLevel && !useSlot(d, caster, info.slotLevel, info.needs!)) return;
    advanceMut(d, ctx, ritual ? 11 : 1, 'camp');
  }
  const cost = commCost(method, b.distanceMiles);
  const now = absNow(d);
  const working = b.facilities.filter((f) => f.kind === 'special' && f.built);
  const maintain = b.draftMaintain ?? b.maintain;
  d.dispatches.push({
    id: uid(),
    bastionId: b.id,
    direction: 'orders',
    method,
    sentAt: now,
    arrivesAt: now + delay,
    costGp: cost,
    delivered: false,
    maintain,
    orders: working.map((f) => ({ facilityId: f.id, order: f.draftOrder ?? f.order, note: f.draftNote ?? f.orderNote, plan: f.draftPlan ?? f.plan })),
    hirelingId,
  });
  if (cost > 0) payGold(d, [b.ownerId], cost, `sending orders to ${b.name}`);
  log(d, `Orders for ${b.name} go out by ${info.label.toLowerCase()} (${b.distanceMiles} miles). ${delay === 0 ? 'They arrive at once.' : `They should arrive in ${formatDuration(delay)}.`}`);
  deliverDispatches(d);
});

/** Messages that have reached their destination take effect. */
function deliverDispatches(s: State): void {
  const now = absNow(s);
  for (const m of s.dispatches) {
    if (m.delivered || m.arrivesAt > now) continue;
    m.delivered = true;
    const b = s.bastions.find((x) => x.id === m.bastionId);
    if (!b) continue;
    if (m.direction === 'orders') {
      b.maintain = !!m.maintain;
      b.draftMaintain = undefined;
      for (const o of m.orders ?? []) {
        const f = b.facilities.find((x) => x.id === o.facilityId);
        if (f) Object.assign(f, { order: o.order, orderNote: o.note, plan: o.plan ?? f.plan, draftOrder: undefined, draftNote: undefined, draftPlan: undefined });
      }
      b.ordersArrived = true;
      log(s, `Orders reach ${b.name} by ${COMMS[m.method].label.toLowerCase()}, ${formatDuration(Math.max(1, now - m.sentAt))} after they were sent: ${m.maintain ? 'Maintain' : (m.orders ?? []).map((o) => `${b.facilities.find((f) => f.id === o.facilityId)?.name}: ${o.order}`).join('; ')}.`, 'good');
    } else {
      log(s, `Word from ${b.name} arrives by ${COMMS[m.method].label.toLowerCase()}: ${m.report}.`, 'good');
    }
  }
  s.dispatches = s.dispatches.filter((m) => !m.delivered || now - m.arrivesAt < 30 * MIN_PER_DAY);
}

// ---------------------------------------------------------------- HP, Hit Point Dice, items

export const spendHitDie = act((d, ctx, charId: string) => {
  const c = charById(d, charId);
  if (!c || !alive(c)) return;
  if (c.hitDiceSpent >= c.level) {
    log(d, `${c.name} has no Hit Point Dice left.`, 'warn');
    return;
  }
  const roll = die(c.hitDie, ctx.rng);
  const mod = abilityMod(c.conScore);
  const weak = sewerWeakened(c);
  const healed = Math.max(1, weak ? Math.floor((roll + mod) / 2) : roll + mod);
  if (weak) log(d, `${c.name} has Sewer Plague and is Exhausted: Hit Point Dice heal only half.`, 'warn');
  const before = c.hp;
  c.hp = Math.min(c.maxHp, c.hp + healed);
  c.hitDiceSpent += 1;
  status(d, c, 'hitDie', `${c.name} spends a Hit Point Die: d${c.hitDie} = ${roll} ${signed(mod)} = ${healed}. HP ${before} → ${c.hp}/${c.maxHp} (${c.level - c.hitDiceSpent} dice left).`, 'good');
});

export const changeHp = act((d, ctx, charId: string, amount: number) => {
  const c = charById(d, charId);
  if (!c) return;
  if (amount < 0) {
    let dmg = -amount;
    const absorbed = Math.min(c.tempHp, dmg);
    c.tempHp -= absorbed;
    dmg -= absorbed;
    const wasUp = c.hp > 0;
    const leftover = dmg - c.hp;
    c.hp = Math.max(0, c.hp - dmg);
    status(d, c, 'hurt', `${c.name} takes ${-amount} damage${absorbed ? ` (${absorbed} absorbed by Temporary HP)` : ''}. HP ${c.hp}/${c.maxHp}.`, c.hp === 0 ? 'bad' : 'warn');
    if (wasUp && c.hp === 0) {
      if (leftover >= c.maxHp) {
        killOutright(d, c, `massive damage (${leftover} beyond 0 HP, at least their HP maximum)`);
      } else {
        Object.assign(c, { dying: true, stable: false, deathSuccesses: 0, deathFailures: 0, wakesAt: null });
        status(d, c, 'dying', `${c.name} falls Unconscious and is dying. Roll death saves.`, 'bad');
        if (d.settings.lingeringInjuries) addInjuryMut(d, c, injuryFor(die(20, ctx.rng)), 'dropping to 0 HP');
      }
    } else if (!wasUp && dmg > 0 && c.diedAt == null) {
      // Damage at 0 HP: a death save failure (the stable stop being stable).
      addDeathFailures(d, c, 1, 'taking damage at 0 HP');
    }
  } else {
    const wasDown = c.hp === 0;
    c.hp = Math.min(c.maxHp, c.hp + amount);
    status(d, c, 'heal', `${c.name} heals ${amount}. HP ${c.hp}/${c.maxHp}.`, 'good');
    if (wasDown && c.hp > 0) wakeUp(d, c, 'healing');
  }
});

function wakeUp(s: State, c: Character, why: string): void {
  const was = c.dying || c.stable;
  Object.assign(c, { dying: false, stable: false, deathSuccesses: 0, deathFailures: 0, wakesAt: null });
  if (was) status(s, c, 'wakesFromStable', `${c.name} regains consciousness from ${why}.`, 'good');
}

function killOutright(s: State, c: Character, why: string): void {
  Object.assign(c, { dying: false, stable: false, wakesAt: null, diedAt: absNow(s), reposeMinutes: 0, hp: 0 });
  status(s, c, 'death', `${c.name} dies: ${why}.`, 'bad');
}

function makeStable(s: State, ctx: Ctx, c: Character, how: string): void {
  const hours = die(STABLE_WAKE_DIE, ctx.rng);
  Object.assign(c, { dying: false, stable: true, deathSuccesses: 0, deathFailures: 0, wakesAt: absNow(s) + hours * 60 });
  status(s, c, 'stable', `${c.name} is stable (${how}). Still Unconscious, they regain 1 HP in ${hours} hour${hours > 1 ? 's' : ''} (1d4).`, 'good');
}

function addDeathFailures(s: State, c: Character, n: number, why: string): void {
  if (c.stable) Object.assign(c, { stable: false, dying: true, wakesAt: null, deathSuccesses: 0, deathFailures: 0 });
  c.deathFailures = Math.min(3, c.deathFailures + n);
  log(s, `${c.name} suffers ${n} death save failure${n > 1 ? 's' : ''} from ${why} (${c.deathFailures}/3).`, 'bad');
  if (c.deathFailures >= 3) killOutright(s, c, 'three death save failures');
}

/** A death saving throw: 10 or higher succeeds, a 1 counts as two failures, a 20 brings them back with 1 HP. */
export const deathSave = act((d, ctx, charId: string) => {
  const c = charById(d, charId);
  if (c) rollDeathSave(d, ctx, c);
});

function rollDeathSave(d: State, ctx: Ctx, c: Character): void {
  if (!c.dying || c.diedAt != null) return;
  const r = die(20, ctx.rng);
  if (r === 20) {
    c.hp = 1;
    wakeUp(d, c, 'a natural 20 on a death save');
    status(d, c, 'wakesFromStable', `${c.name} rolls a 20 on the death save and is back on their feet with 1 HP!`, 'good');
    return;
  }
  // 2014 DMG lingering injuries: failing a death save by 5 or more (a roll of 4 or lower against DC 10).
  if (r <= 4 && d.settings.lingeringInjuries) addInjuryMut(d, c, injuryFor(die(20, ctx.rng)), `failing a death save by ${10 - r}`);
  if (r === 1) return addDeathFailures(d, c, 2, 'a natural 1 on a death save');
  if (r >= 10) {
    c.deathSuccesses += 1;
    log(d, `${c.name} death save: ${r}, a success (${c.deathSuccesses}/3).`, 'good');
    if (c.deathSuccesses >= 3) makeStable(d, ctx, c, 'three death save successes');
  } else addDeathFailures(d, c, 1, `a death save of ${r}`);
}

/** Table rule: time can't move on while someone is dying, so their remaining death saves are rolled now. */
function resolveDying(s: State, ctx: Ctx): void {
  for (const c of s.characters) {
    if (!c.dying || c.diedAt != null) continue;
    log(s, `${c.name} is dying and time moves on, so their remaining death saves are rolled now (table rule).`, 'warn');
    for (let i = 0; i < 10 && c.dying && c.diedAt == null; i++) rollDeathSave(s, ctx, c);
  }
}

/** Uses left in the Healer's Kits someone carries (ten per kit, 2024 PHB). */
export function healerKitUses(c: Character): number {
  return c.inventory.filter((i) => HEALERS_KIT.test(i.name) && i.qty > 0).reduce((a, i) => a + (i.uses ?? HEALERS_KIT_USES) + (i.qty - 1) * HEALERS_KIT_USES, 0);
}

/**
 * Spends one use of a Healer's Kit, from the helper's own kit first. Returns a note for the log, or null
 * (and logs why) when nobody has a kit with uses left.
 */
function useHealersKit(s: State, helperId: string | null): string | null {
  if (!s.settings.trackGearUse || !inventoriesKept(s)) return '';
  const got = carrierOf(s, helperId ? [helperId] : [], HEALERS_KIT);
  if (!got) {
    log(s, "Nobody has a Healer's Kit with uses left.", 'warn');
    return null;
  }
  const { c, it } = got;
  it.uses = (it.uses ?? HEALERS_KIT_USES) - 1;
  if (it.uses <= 0) {
    useUpOne(c, it);
    if (it.qty > 0) it.uses = HEALERS_KIT_USES;
    return ` ${c.name}'s Healer's Kit is used up${it.qty > 0 ? `; they open another (${it.qty} left)` : ''}.`;
  }
  return ` ${c.name}'s Healer's Kit has ${it.uses} use${it.uses === 1 ? '' : 's'} left.`;
}

/** Stabilize with a Wisdom (Medicine) check, with a Healer's Kit (one of its ten uses), or automatically (Spare the Dying). */
export const stabilize = act((d, ctx, charId: string, helperId: string | null, method: 'medicine' | 'kit' | 'sure', medicineBonus?: number) => {
  const c = charById(d, charId);
  if (!c || !c.dying || c.diedAt != null) return;
  const helper = helperId ? actorById(d, helperId) : undefined;
  if (method === 'kit') {
    const note = useHealersKit(d, helperId && !helperId.startsWith('h:') ? helperId : null);
    if (note === null) return;
    const me = charById(d, charId)!;
    makeStable(d, ctx, me, `${helper ? `${helper.name} used ` : ''}a Healer's Kit`);
    if (note) log(d, note.trim());
    return;
  }
  if (method === 'medicine') {
    const mod = (medicineBonus ?? helper?.wisMod ?? 0) - 2 * (helper?.exhaustion ?? 0);
    const r = d20('normal', ctx.rng);
    const total = r.value + mod;
    if (total < STABILIZE_DC) {
      log(d, `${helper?.name ?? 'Someone'} tries to stabilize ${c.name}: Wisdom (Medicine) ${r.value} ${signed(mod)} = ${total} against DC ${STABILIZE_DC}. It doesn't work.`, 'warn');
      return;
    }
    makeStable(d, ctx, c, `${helper?.name ?? 'someone'} succeeded on a DC ${STABILIZE_DC} Wisdom (Medicine) check with ${total}`);
  } else {
    makeStable(d, ctx, c, `${helper ? `${helper.name} used ` : ''}Spare the Dying or another sure means`);
  }
});

export const setRestFocus = act((d, _ctx, charId: string, focus: Character['restFocus']) => {
  const c = charById(d, charId);
  if (c) c.restFocus = focus;
});

/** The Identify spell: 1 minute, or 11 as a ritual. */
export const identifyBySpell = act((d, ctx, ownerId: string, itemId: string, casterId: string | null, ritual: boolean) => {
  const owner = charById(d, ownerId);
  const it = owner?.items.find((x) => x.id === itemId);
  if (!owner || !it) return;
  const caster = casterId ? charById(d, casterId) : undefined;
  if (caster) {
    const sp = caster.spells.find((x) => x.name.toLowerCase() === 'identify');
    const ok = sp && (sp.prepared || sp.alwaysPrepared || (ritual && caster.className === 'Wizard'));
    if (!ok) {
      log(d, `${caster.name} needs Identify prepared${ritual ? ' (or a Wizard spellbook for the ritual)' : ''}.`, 'warn');
      return;
    }
  }
  advanceMut(d, ctx, IDENTIFY_MINUTES + (ritual ? RITUAL_EXTRA_MINUTES : 0), 'camp');
  revealAll(d, it, 'identify');
  log(d, `${caster ? caster.name : 'A scroll'} casts Identify${ritual ? ' as a ritual' : ''} on the ${it.name}: its properties, charges and any attunement are revealed.`, 'good');
});

export const leaveItem = act((d, _ctx, ownerId: string, itemId: string, away: boolean) => {
  const it = charById(d, ownerId)?.items.find((x) => x.id === itemId);
  if (!it) return;
  it.awaySince = away ? absNow(d) : null;
  if (away && it.attuned) log(d, `The ${it.name} is left more than 100 feet behind. Attunement ends in 24 hours unless it's recovered.`, 'warn');
});

// ---------------------------------------------------------------- active effects, exploration, frigid water

const effectChars = (s: State, e: ActiveEffect): Character[] =>
  [...e.targetIds, ...(e.casterId ? [e.casterId] : [])].map((id) => charById(s, id)).filter((c, i, a): c is Character => !!c && a.indexOf(c) === i);

const effectWho = (s: State, e: ActiveEffect): string => {
  const names = e.targetIds.map((id) => charById(s, id)?.name).filter(Boolean);
  return names.length ? ` (${names.join(', ')})` : '';
};

function tickEffects(s: State, before: number): void {
  const now = absNow(s);
  for (const e of s.effects) {
    if (!/gentle repose/i.test(e.name)) continue;
    for (const id of e.targetIds) {
      const c = charById(s, id);
      if (c && c.diedAt != null) c.reposeMinutes += now - before;
    }
  }
  const ended: ActiveEffect[] = [];
  for (const e of s.effects) {
    if (e.endsAt == null) continue;
    if (e.kind === 'light' && e.endsAt - e.startedAt > LIGHT_WARNING_MINUTES) {
      const warn = e.endsAt - LIGHT_WARNING_MINUTES;
      if (before < warn && now >= warn && now < e.endsAt) noticed(s, 'lightLow', effectChars(s, e), `${e.name}${effectWho(s, e)} is burning low: ${LIGHT_WARNING_MINUTES} minutes left.`, 'warn');
    }
    if (now >= e.endsAt) ended.push(e);
  }
  if (!ended.length) return;
  s.effects = s.effects.filter((e) => !ended.includes(e));
  for (const e of ended) {
    noticed(s, e.kind === 'light' ? 'lightOut' : e.shelter ? 'shelterEnds' : 'effectEnds', effectChars(s, e), e.kind === 'light' ? `${e.name}${effectWho(s, e)} goes out.` : `${e.name}${effectWho(s, e)} ends.`, e.kind === 'light' || e.shelter ? 'warn' : 'info');
  }
}

export interface NewEffect {
  preset: EffectPreset;
  minutes: number | null;
  targetIds: string[];
  casterId: string | null;
  /** Light sources: take the Torch, Candle or flask of Oil from the inventory (default true when gear use is tracked). */
  useGear?: boolean;
}

/** Whether anyone in the party has an inventory recorded, so missing gear can be told apart from an empty list. */
const inventoriesKept = (s: State): boolean => s.characters.some((c) => c.kind === 'pc' && c.inventory.length > 0);

/** Who carries a matching item, looking at these people first, then the rest of the party and the mounts. */
function carrierOf(s: State, preferIds: string[], match: RegExp): { c: Character; it: InventoryItem } | null {
  const order = [...preferIds.map((id) => charById(s, id)).filter((c): c is Character => !!c), ...s.characters];
  for (const c of order) {
    const it = c.inventory.find((i) => i.qty > 0 && !i.scattered && match.test(i.name.trim()));
    if (it) return { c, it };
  }
  return null;
}

/** Uses up one of an item: drops the line when the last one is gone. */
function useUpOne(c: Character, it: InventoryItem): number {
  it.qty -= 1;
  if (it.qty <= 0) c.inventory = c.inventory.filter((x) => x.id !== it.id);
  return Math.max(0, it.qty);
}

/**
 * Takes the fuel for a light source (2024 PHB: a Torch or Candle burns 1 hour; a flask of Oil burns 6 hours in a Lamp or Lantern).
 * Returns a note for the log, or null (and logs why) when the fuel or the lamp is missing.
 */
function takeLightFuel(s: State, presetName: string, preferIds: string[]): string | null | '' {
  const fuel = fuelFor(presetName);
  if (!fuel || !s.settings.trackGearUse || !inventoriesKept(s)) return '';
  if (fuel === 'oil') {
    const vessel = VESSEL_MATCH.find((v) => v.preset.test(presetName));
    if (vessel && !carrierOf(s, preferIds, vessel.item)) {
      log(s, `Nobody carries ${vessel.label} to burn the Oil in. Add one to someone's inventory first.`, 'warn');
      return null;
    }
  }
  const got = carrierOf(s, preferIds, FUEL_MATCH[fuel]);
  if (!got) {
    log(s, `Nobody has ${FUEL_LABEL[fuel]} left. Buy more, or add them to an inventory.`, 'warn');
    return null;
  }
  const left = useUpOne(got.c, got.it);
  return ` ${got.c.name} uses ${FUEL_LABEL[fuel]} (${left} left).`;
}

/**
 * Something to light a torch, candle or lamp with: a Tinderbox (a Bonus Action, 2024 PHB), the campfire, or a spell.
 * Without any, friction takes 10 minutes (table rule, under the improvised switch). Null (and a log line) when it can't be lit.
 */
function ignition(s: State, presetName: string, preferIds: string[]): { minutes: number; note: string } | null {
  if (!fuelFor(presetName) || !s.settings.trackGearUse || !inventoriesKept(s)) return { minutes: 0, note: '' };
  if (carrierOf(s, preferIds, TINDERBOX)) return { minutes: 0, note: '' };
  if (s.fire.lit) return { minutes: 0, note: ' Lit from the campfire.' };
  const caster = s.characters.find((c) => alive(c) && c.spells.some((x) => /^(prestidigitation|produce flame|elementalism|druidcraft|fire bolt)$/i.test(x.name)));
  if (caster) return { minutes: 0, note: ` ${caster.name} lights it with a spark of magic.` };
  if (!s.settings.improvised) {
    log(s, 'Nobody has a Tinderbox, and there is no fire to light it from.', 'warn');
    return null;
  }
  return { minutes: FRICTION_LIGHT_MINUTES, note: ` With no Tinderbox, it takes ${FRICTION_LIGHT_MINUTES} minutes of striking flint or working a bow drill to get a flame (table rule).` };
}

export const addEffect = act((d, _ctx, ne: NewEffect) => {
  let fuelNote = '';
  if (ne.preset.kind === 'light' && ne.useGear !== false) {
    const who = [...ne.targetIds, ...(ne.casterId ? [ne.casterId] : [])];
    const spark = ignition(d, ne.preset.name, who);
    if (spark === null) return;
    const took = takeLightFuel(d, ne.preset.name, who);
    if (took === null) return;
    fuelNote = took + spark.note;
    if (spark.minutes) advanceMut(d, _ctx, spark.minutes, 'camp');
  }
  const now = absNow(d);
  const conc = !!ne.preset.concentration;
  if (conc && ne.casterId) {
    const caster = charById(d, ne.casterId);
    if (caster) dropConcentration(d, caster, '');
  }
  const e: ActiveEffect = {
    id: uid(),
    name: ne.preset.name,
    kind: ne.preset.kind,
    targetIds: ne.targetIds,
    casterId: ne.casterId,
    concentration: conc,
    shelter: !!ne.preset.shelter,
    startedAt: now,
    endsAt: ne.minutes == null ? null : now + Math.max(1, Math.round(ne.minutes)),
    notes: ne.preset.note ?? '',
  };
  d.effects.push(e);
  const caster = ne.casterId ? charById(d, ne.casterId) : undefined;
  log(d, `${caster ? `${caster.name}: ` : ''}${e.name}${effectWho(d, e)} begins${e.endsAt == null ? ' (until ended)' : `, lasting ${formatDuration(e.endsAt - now)}`}${conc ? ' (Concentration)' : ''}.${fuelNote}`);
});

/** Tops up a Lamp or Lantern with a fresh flask of Oil: 6 more hours (2024 PHB). */
export const refuelLight = act((d, _ctx, effectId: string) => {
  const e = d.effects.find((x) => x.id === effectId);
  if (!e || !isOilLight(e.name)) return;
  let note = '';
  if (d.settings.trackGearUse && inventoriesKept(d)) {
    const got = carrierOf(d, e.targetIds, FUEL_MATCH.oil);
    if (!got) return void log(d, 'Nobody has a flask of Oil left.', 'warn');
    note = ` ${got.c.name} uses a flask of Oil (${useUpOne(got.c, got.it)} left).`;
  }
  if (e.pausedLeft != null) e.pausedLeft += OIL_MINUTES;
  else if (e.endsAt != null) e.endsAt += OIL_MINUTES;
  log(d, `${e.name}${effectWho(d, e)} gets a fresh flask of Oil: ${formatDuration(OIL_MINUTES)} more.${note}`);
});

/** Puts out a Lamp or Lantern, keeping the Oil left in it for later (2024 PHB: Oil burns 6 hours in all, not necessarily at once). */
export const snuffLight = act((d, _ctx, effectId: string) => {
  const e = d.effects.find((x) => x.id === effectId);
  if (!e || !isOilLight(e.name) || e.endsAt == null) return;
  e.pausedLeft = Math.max(0, e.endsAt - absNow(d));
  e.endsAt = null;
  noticed(d, 'lightOut', effectChars(d, e), `${e.name}${effectWho(d, e)} is put out, with ${formatDuration(e.pausedLeft)} of Oil left in it.`);
});

/** Relights a Lamp or Lantern that was put out (lighting it with a Tinderbox takes a Bonus Action). */
export const relightLight = act((d, _ctx, effectId: string) => {
  const e = d.effects.find((x) => x.id === effectId);
  if (!e || e.pausedLeft == null) return;
  const now = absNow(d);
  e.startedAt = now;
  e.endsAt = now + Math.max(1, e.pausedLeft);
  delete e.pausedLeft;
  log(d, `${e.name}${effectWho(d, e)} is lit again: ${formatDuration(e.endsAt - now)} of Oil left.`);
});

/** Lowers or raises a Hooded Lantern's hood (2024 PHB: lowered, it sheds only Dim Light in a 5-foot radius). */
export const setHood = act((d, _ctx, effectId: string, lowered: boolean) => {
  const e = d.effects.find((x) => x.id === effectId);
  if (!e || !isHooded(e.name)) return;
  e.dimmed = lowered;
  log(d, lowered ? `The hood of the ${e.name.split(' (')[0]} is lowered: only Dim Light in a 5-foot radius now.` : `The hood of the ${e.name.split(' (')[0]} is raised: Bright Light 30 ft, Dim Light 30 ft more.`);
});

export const endEffect = act((d, _ctx, effectId: string) => {
  const e = d.effects.find((x) => x.id === effectId);
  if (!e) return;
  d.effects = d.effects.filter((x) => x.id !== effectId);
  log(d, `${e.name}${effectWho(d, e)} is ended early.`);
});

export const extendEffect = act((d, _ctx, effectId: string, minutes: number) => {
  const e = d.effects.find((x) => x.id === effectId);
  if (!e || e.endsAt == null) return;
  e.endsAt += minutes;
  log(d, `${e.name}${effectWho(d, e)} gets ${formatDuration(minutes)} more (e.g. a fresh flask of oil).`);
});

/** A 10-minute exploration turn: searching, checking for traps, listening at doors. */
export const explorationTurn = act((d, ctx, what: string) => {
  log(d, `Exploration turn (${EXPLORATION_TURN_MINUTES} min)${what ? `: ${what}` : ''}.`);
  advanceMut(d, ctx, EXPLORATION_TURN_MINUTES, 'camp', { exploring: true });
  if (d.settings.encounters) {
    d.exploreTurns += 1;
    const every = DANGER[d.place.danger].everyTurns;
    if (d.exploreTurns >= every) {
      d.exploreTurns = 0;
      encounterCheck(d, ctx, 'explore', false);
    }
  } else if (d.settings.exploreEncounterOn > 0) {
    const r = die(20, ctx.rng);
    if (r >= d.settings.exploreEncounterOn) log(d, `Wandering monster check: d20 = ${r}. Something finds the party!`, 'warn');
  }
});

/** Frigid water: safe for minutes equal to the Con score, then a DC 10 Con save each minute or 1 Exhaustion level. */
export const frigidWater = act((d, ctx, charId: string, minutes: number) => {
  const c = charById(d, charId);
  if (!c) return;
  const safe = c.conScore;
  const resistant = c.coldResist !== 'none' || c.coldWaterAdapted;
  log(d, `${c.name} spends ${minutes} minute(s) in frigid water (${resistant ? (c.coldWaterAdapted ? 'unaffected: they are adapted to icy water' : 'unaffected thanks to their Cold ' + (c.coldResist === 'immunity' ? 'Immunity' : 'Resistance')) : `safe for ${safe} minutes, their Constitution score`}).`);
  for (let m = 1; m <= minutes; m++) {
    advanceMut(d, ctx, 1, 'camp');
    if (m > safe && alive(c) && !resistant) requestSave(d, ctx, c, 'frigid', 10, 'normal', `frigid water (minute ${m})`);
  }
});

// ---------------------------------------------------------------- money, projects, mounts

/** Starts a downtime project and pays for its materials up front (buying and selling settle on completion). */
export const startProject = act((d, _ctx, p: Project) => {
  // Arms training: everyone on the course must be ready for it (Light before Medium before Heavy, and so on).
  if (p.armsKind) {
    const blocked = p.charIds
      .map((id) => charById(d, id))
      .filter((c): c is Character => !!c)
      .map((c) => ({ c, r: canTrainArms(c.armsProfs, p.armsKind!, p.learn) }))
      .filter((x) => !x.r.ok);
    if (blocked.length) return void log(d, `Can't start ${p.name}: ${blocked.map((x) => `${x.c.name} ${x.r.reason}`).join('; ')}.`, 'warn');
  }
  // Take the chosen materials out of the stash; their value counts toward the cost.
  const used: NonNullable<Project['materialsUsed']> = [];
  for (const u of p.materialsUsed ?? []) {
    const m = d.materials.find((x) => x.id === u.materialId);
    if (!m || m.qty <= 0) continue;
    const qty = Math.min(m.qty, u.qty);
    m.qty = Math.round((m.qty - qty) * 100) / 100;
    used.push({ materialId: m.id, name: m.name, qty, valueGp: m.valueGp });
  }
  d.materials = d.materials.filter((m) => m.qty > 0);
  p.materialsUsed = used;
  d.projects.push(p);
  const covered = used.reduce((a, u) => a + u.qty * u.valueGp, 0);
  log(
    d,
    `New downtime project: ${p.name} (${p.daysRequired} workdays${p.costGp ? `, ${fmtGp(p.costGp)}` : ''})${used.length ? `, using ${used.map((u) => `${u.qty} × ${u.name}`).join(', ')} from the stash (worth ${fmtGp(covered)})` : ''}.`,
  );
  const owed = Math.max(0, Math.round((p.costGp - covered) * 100) / 100);
  if (p.kind !== 'buyMagic' && p.kind !== 'sellMagic' && owed > 0) payGold(d, p.charIds, owed, `${used.length ? 'the rest of the ' : ''}materials for ${p.name}`);
});

export interface ButcherOpts {
  creature: Creature;
  count: number;
  butcherId: string | null;
}

/** Field-dressing a kill: raw meat by size goes to the camp stores, and big beasts leave hides for the materials stash. */
export const butcher = act((d, ctx, o: ButcherOpts) => {
  const { creature: cr, count } = o;
  if (!isEdible(cr)) {
    log(d, `There is no edible meat on ${count > 1 ? `${count} × ` : 'a '}${cr.name} (${cr.type}).`, 'warn');
    return;
  }
  const who = o.butcherId ? charById(d, o.butcherId) : undefined;
  advanceMut(d, ctx, BUTCHER_MINUTES[cr.size] * count, 'camp');
  let meat = MEAT_LB[cr.size] * count;
  let checkTxt = '';
  let clean = true;
  if (who) {
    const r = d20('normal', ctx.rng);
    const total = r.value + who.survival - 2 * who.exhaustion;
    const ok = total >= BUTCHER_DC;
    clean = ok;
    if (!ok) meat = Math.round(meat / 2);
    checkTxt = ` ${who.name} butchers: Wisdom (Survival) ${r.value} ${signed(who.survival - 2 * who.exhaustion)} = ${total} against DC ${BUTCHER_DC}, ${ok ? 'a clean job' : 'half the meat is wasted'}.`;
  }
  d.stores.foodRawLb = Math.round((d.stores.foodRawLb + meat) * 100) / 100;
  let hide = '';
  if (yieldsHide(cr)) {
    const name = `Hide (${cr.name})`;
    const m = d.materials.find((x) => x.name === name);
    if (m) m.qty += count;
    else d.materials.push({ id: uid(), name, qty: count, unit: 'hide', valueGp: HIDE_GP[cr.size] ?? 5 });
    hide = ` ${count} hide${count > 1 ? 's go' : ' goes'} into the materials stash, worth ${fmtGp(HIDE_GP[cr.size] ?? 5)} each to a tanner or toward leatherwork.`;
  }
  // Table rule: a clean job keeps the trophy parts whole, for selling or mounting.
  const trophy = clean ? trophyFor(cr) : null;
  let trophyTxt = '';
  if (trophy) {
    const keeper = (who && alive(who) ? who : undefined) ?? d.characters.find((x) => x.kind === 'pc' && alive(x));
    if (keeper) {
      const have = keeper.inventory.find((i) => i.name === trophy.name && !i.containerId);
      if (have) have.qty += count;
      else keeper.inventory.push({ id: uid(), name: trophy.name, qty: count, weight: trophy.weight, source: 'manual', valueGp: trophy.valueGp, container: null, ammo: null });
      trophyTxt = ` The ${trophy.parts} come away whole: ${count > 1 ? `${count} trophies` : 'a trophy'} worth ${fmtGp(trophy.valueGp)} each, carried by ${keeper.name} (table rule).`;
    }
  }
  const strange = STRANGE_TYPES.includes(cr.type.toLowerCase()) ? ` ${cr.type[0].toUpperCase()}${cr.type.slice(1)} meat is strange fare, and the DM may add effects.` : '';
  log(d, `Butchered ${count} × ${cr.name} (${cr.size} ${cr.type}): ${meat} lb of raw meat added to the camp stores.${checkTxt}${hide}${trophyTxt}${strange}`, 'good');
});

/** What the research is about: the project's name after "Research" (e.g. "Research: the Sunless Citadel"). */
const researchTopic = (p: Project): string => p.name.replace(/^research\b[:\s-]*/i, '').trim() || 'the topic';

/**
 * Table rules on top of Xanathar's Research: each piece of lore is an insight (Advantage on one Intelligence check
 * about the topic), a strong result brings a scholar who becomes an allied contact, and research into an unidentified
 * magic item the party holds identifies it.
 */
function researchPayoff(d: State, c: Character, p: Project, lore: number, best: number): void {
  const topic = researchTopic(p);
  const name = `Research insight: ${topic}`;
  const had = d.effects.find((e) => e.name.startsWith(name) && e.targetIds.includes(c.id));
  const uses = lore + Number(/×(\d+)/.exec(had?.name ?? '')?.[1] ?? 0);
  d.effects = d.effects.filter((e) => e !== had);
  d.effects.push({ id: uid(), name: `${name} ×${uses}`, kind: 'other', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(d), endsAt: null, notes: `Table rule: Advantage on ${uses} Intelligence check${uses > 1 ? 's' : ''} about ${topic} (History, Arcana, Religion, Nature or Investigation). Lower the count as each is used.` });
  log(d, `${c.name}'s notes on ${topic} are worth having: Advantage on ${uses} Intelligence check${uses > 1 ? 's' : ''} about it (table rule).`, 'good');
  if (best >= RESEARCH_LEAD_AT) {
    addContactMut(d, { name: `A scholar of ${topic}`, role: 'Sage', place: d.place.name, bond: 1, knownBy: [c.id], notes: `Met while researching ${topic}. Knows more, and might share it for a favor.` });
    log(d, `Along the way ${c.name} strikes up a friendship with a scholar who knows ${topic} well: a new allied contact (table rule).`, 'good');
  }
  if (best >= RESEARCH_IDENTIFY_AT && topic !== 'the topic') {
    const t = topic.toLowerCase();
    for (const holder of d.characters) {
      const it = holder.items.find((x) => !x.identified && [x.name, x.partyName ?? ''].some((n) => n.trim() && (n.toLowerCase().includes(t) || t.includes(n.toLowerCase()))));
      if (!it) continue;
      it.identified = true;
      it.magicKnown = true;
      addFinding(d, it, 'experiment', `Identified through research by ${c.name}.`);
      log(d, `In an old catalogue ${c.name} finds a description that matches ${holder.name}'s ${it.partyName?.trim() || 'unknown item'} exactly: it is ${it.name} (table rule: identified by research).`, 'good');
      break;
    }
  }
}

/** Eases Stress and Fear (never below 0) and tells the player what their character feels. */
function easeMind(s: State, c: Character, stress: number, fear: number, feel: string): void {
  const st = Math.min(c.stress, stress);
  const fe = Math.min(c.fear, fear);
  if (!st && !fe) return;
  c.stress -= st;
  c.fear -= fe;
  const parts = [st && `Stress −${st}, now ${c.stress}`, fe && `Fear −${fe}, now ${c.fear}`].filter(Boolean).join('; ');
  status(s, c, st ? 'stressDown' : 'fearDown', `${c.name} ${feel} (${parts}; table rule).`, 'good');
}

export type Track = 'renown' | 'fear' | 'stress';
const TRACK_LABEL: Record<Track, string> = { renown: 'Renown', fear: 'Fear', stress: 'Stress' };

export const adjustTrack = act((d, ctx, charId: string, track: Track, delta: number, reason: string) => {
  const c = charById(d, charId);
  if (!c || !delta) return;
  c[track] = track === 'renown' ? c[track] + delta : Math.max(0, c[track] + delta);
  const tone: Tone = track === 'renown' ? (delta > 0 ? 'good' : 'warn') : delta > 0 ? 'warn' : 'good';
  status(d, c, (`${track}${delta > 0 ? 'Up' : 'Down'}` as SenseKey), `${c.name}'s ${TRACK_LABEL[track]} ${delta > 0 ? 'rises' : 'falls'} by ${Math.abs(delta)} to ${c[track]}${reason ? ` (${reason})` : ''}.`, tone);
  const before = c[track] - delta;
  if (d.settings.madness && track !== 'renown' && delta > 0 && before < MADNESS_THRESHOLD && c[track] >= MADNESS_THRESHOLD) madnessCheck(d, ctx, c, `${TRACK_LABEL[track]} reaching ${c[track]}`);
});

export const addMount = act((d, _ctx, preset: MountPreset, name: string, buyerId: string | null) => {
  const m = newCharacter({
    kind: 'mount',
    name: name || preset.name,
    className: 'Other',
    size: preset.size,
    speed: preset.speed,
    tasks: [],
    bedroll: false,
    rationsLb: 0,
    waterPints: 0,
    waterCapacityPints: 0,
    gp: 0,
    conScore: 14,
    carryCapacity: MOUNT_CAPACITY[preset.name] ?? null,
  });
  d.characters.push(m);
  log(d, `${m.name} (${preset.name}, ${preset.size}, Speed ${preset.speed} ft) joins the party. It needs food and water every day like everyone else.`);
  if (buyerId !== null) payGold(d, buyerId ? [buyerId] : [], preset.gp, `a ${preset.name}`);
});

/** Buys animal feed for every mount: a full day's food each per day bought. */
export const buyFeed = act((d, _ctx, days: number) => {
  const mounts = d.characters.filter((c) => c.kind === 'mount' && alive(c));
  if (!mounts.length) return;
  for (const m of mounts) m.rationsLb = Math.round((m.rationsLb + foodNeedLb(m) * days) * 100) / 100;
  log(d, `Bought ${days} day(s) of feed for ${mounts.map((m) => m.name).join(', ')}.`);
  payGold(d, [], FEED_GP_PER_DAY * days * mounts.length, `${days} day(s) of animal feed`);
});

export const adjustGold = act((d, _ctx, charId: string, amount: number, reason: string) => {
  const c = charById(d, charId);
  if (!c || !amount) return;
  if (amount > 0) gainWealth(c, amount);
  else spendWealth(c, -amount);
  log(d, `${c.name} ${amount > 0 ? 'gains' : 'spends'} ${fmtGp(Math.abs(amount))}${reason ? ` (${reason})` : ''}. Now ${fmtGp(c.gp)}.`, amount > 0 ? 'good' : 'info');
});

// ---------------------------------------------------------------- long-term magic, death, divination

/** At midnight: a ritual that wasn't cast during the day that just ended loses its streak. */
function checkRituals(s: State): void {
  for (const r of s.rituals) {
    if (r.permanent || r.streak === 0) continue;
    if (r.lastCastDay !== s.dayIndex) {
      log(s, `${r.spell} at ${r.place || 'its site'} was not cast today, so the ${r.streak}-day streak is lost. It starts again from day 1.`, 'warn');
      r.streak = 0;
    }
  }
}

export const castRitual = act((d, _ctx, ritualId: string) => {
  const r = d.rituals.find((x) => x.id === ritualId);
  if (!r || r.permanent) return;
  if (r.lastCastDay === d.dayIndex) {
    log(d, `${r.spell} has already been cast today.`, 'warn');
    return;
  }
  r.streak += 1;
  r.lastCastDay = d.dayIndex;
  const caster = r.casterId ? charById(d, r.casterId)?.name : null;
  if (r.streak >= r.requiredDays) {
    r.permanent = true;
    log(d, `${caster ? `${caster} casts` : 'Cast:'} ${r.spell} at ${r.place || 'its site'} for the ${r.requiredDays}th day in a row. The effect is now permanent!`, 'good');
  } else {
    log(d, `${caster ? `${caster} casts` : 'Cast:'} ${r.spell} at ${r.place || 'its site'}: day ${r.streak} of ${r.requiredDays}.`);
  }
});

export const addRitual = act((d, _ctx, spell: string, days: number, place: string, casterId: string | null) => {
  d.rituals.push({ id: uid(), spell, place, casterId, requiredDays: days, streak: 0, lastCastDay: null, permanent: false } satisfies Ritual);
  log(d, `Started a daily casting of ${spell}${place ? ` at ${place}` : ''}: ${days} days in a row makes it permanent.`);
});

export const markDead = act((d, _ctx, charId: string, dead: boolean) => {
  const c = charById(d, charId);
  if (!c) return;
  if (dead) {
    c.diedAt = absNow(d);
    c.reposeMinutes = 0;
    c.hp = 0;
    Object.assign(c, { dying: false, stable: false, wakesAt: null });
    status(d, c, 'death', `${c.name} has died.`, 'bad');
  } else {
    c.diedAt = null;
    c.reposeMinutes = 0;
    Object.assign(c, { dying: false, stable: false, wakesAt: null, deathSuccesses: 0, deathFailures: 0 });
    if (c.exhaustion >= 6) {
      c.exhaustion = 5;
      c.exhaustionCauses = causesOf(c);
    }
    c.hp = Math.max(1, c.hp);
    status(d, c, 'revived', `${c.name} is brought back to life!`, 'good');
  }
});

/** Minutes dead that count toward resurrection limits (Gentle Repose time doesn't). */
export function deadFor(s: State, c: Character): number | null {
  return c.diedAt == null ? null : Math.max(0, absNow(s) - c.diedAt - c.reposeMinutes);
}

/** Casting Augury, Divination or Commune: each extra casting before a Long Rest adds a 25% chance it fails. */
export const castDivination = act((d, ctx, charId: string, spell: string) => {
  const c = charById(d, charId);
  if (!c) return;
  const before = c.divinationCasts[spell] ?? 0;
  const chance = divinationFailChance(before);
  c.divinationCasts = { ...c.divinationCasts, [spell]: before + 1 };
  if (chance === 0) {
    log(d, `${c.name} casts ${spell} (first time since their last Long Rest): the answer comes normally.`, 'good');
    return;
  }
  const roll = die(100, ctx.rng);
  const failed = roll <= chance;
  log(
    d,
    `${c.name} casts ${spell} again before a Long Rest: ${chance}% chance it goes wrong, d100 = ${roll}. ${failed ? 'It fails or gives a random reading (see the spell).' : 'The answer comes normally.'}`,
    failed ? 'warn' : 'good',
  );
});

/** Replacing a lost spellbook: 1 hour and 10 GP per level of each prepared spell. */
export const replaceSpellbook = act((d, ctx, charId: string) => {
  const c = charById(d, charId);
  if (!c) return;
  const levels = c.spells.filter((x) => (x.prepared || x.alwaysPrepared) && x.level > 0).reduce((a, x) => a + x.level, 0);
  if (!levels) {
    log(d, `${c.name} has no prepared spells to rewrite.`, 'warn');
    return;
  }
  advanceMut(d, ctx, levels * SPELLBOOK_REPLACE.hoursPerLevel * 60, 'work');
  payGold(d, [c.id], levels * SPELLBOOK_REPLACE.gpPerLevel, 'a replacement spellbook');
  log(d, `${c.name} rewrites their prepared spells into a new spellbook (${levels} hours).`, 'good');
});

/** Table rule: damage types the weather favors or hinders right now, or none when the rule is off. */
export function currentAffinities(s: State): Affinity[] {
  if (!s.settings.weatherDamage) return [];
  const indoors = s.place.shelter === 'building' || s.place.shelter === 'cave' || s.effects.some((e) => e.shelter);
  return weatherDamageAffinities({ weather: s.weather, tempNow: tempNow(s), minutes: s.minutes, sheltered: indoors });
}

// ---------------------------------------------------------------- navigation helpers and reading the sky

/** Someone in the party carries a map of the current place (2024 PHB Map: +5 to Wisdom (Survival) checks to find the way there). */
export function partyHasMapHere(s: State): boolean {
  return s.characters.some((c) => c.inventory.some((i) => isMapOf(i.name, s.place.name)));
}

/** The map that helps find the way right now: of the current place, or of the journey stage being travelled. */
function mapHereName(s: State): string | null {
  for (const where of [s.place.name, s.travel.stageName]) {
    if (where == null) continue;
    const item = s.characters.flatMap((c) => c.inventory).find((i) => isMapOf(i.name, where));
    if (item) return item.name;
  }
  return null;
}

/** Someone in the party carries a map of this journey stage. */
export function partyHasMapOf(s: State, place: string): boolean {
  return s.characters.some((c) => c.inventory.some((i) => isMapOf(i.name, place)));
}

/** Whether the stars can be seen right now: night, no precipitation, not underground. */
export function starsVisible(s: State): boolean {
  if (CLIMATES[s.weather.climate].noWeather) return false;
  return lightAt(s.minutes % MIN_PER_DAY, seasonOf(s)).phase === 'Night' && s.weather.precip === 'none';
}

/**
 * Lost: finding the party's position from the stars. Navigator's Tools, Wisdom DC 15 (2024 PHB);
 * without them, Wisdom (Survival) at DC 20 and twice as long (table rule). Needs a clear night.
 */
export const stargaze = act((d, ctx, charId: string, useTools: boolean, bonus: number) => {
  const c = actorById(d, charId);
  if (!c || !d.travel.lost) return;
  if (!starsVisible(d)) return void log(d, `${c.name} can't see the stars: it takes a clear night above ground.`, 'warn');
  if (useTools && !c.inventory.some((i) => NAVIGATOR.test(i.name))) return void log(d, `${c.name} has no Navigator's Tools.`, 'warn');
  if (!useTools && !d.settings.improvised) return void log(d, `${c.name} needs Navigator's Tools to fix a position by the stars (improvised attempts are off).`, 'warn');
  advanceMut(d, ctx, STARGAZE_MINUTES * (useTools ? 1 : IMPROVISED_TIME), 'camp');
  const dc = useTools ? STARGAZE_DC : IMPROVISED_STARGAZE_DC;
  const mod = (useTools ? bonus : c.survival) - 2 * c.exhaustion;
  const r = d20('normal', ctx.rng);
  const roll = `${useTools ? "Wisdom with Navigator's Tools" : 'Wisdom (Survival), by eye'} ${r.value} ${signed(mod)} = ${r.value + mod} against DC ${dc}`;
  if (r.value + mod < dc) return void log(d, `${c.name} studies the night sky (${roll}) but can't fix the party's position.`, 'warn');
  log(d, `${c.name} takes sightings on the stars (${roll}) and works out where the party is, ${+d.travel.milesOffCourse.toFixed(1)} miles off course.`, 'good');
  d.travel.lost = false;
  d.travel.milesOffCourse = 0;
  d.travel.lostRecheckIn = 0;
});

/**
 * Drafting a map of the current small area. Cartographer's Tools, Wisdom DC 15 (2024 PHB), an hour (table rule);
 * without them, paper and charcoal at DC 20 and two hours (table rule). The map gives +5 on navigation here (2024 PHB Map).
 */
export const draftMap = act((d, ctx, charId: string, useTools: boolean, bonus: number) => {
  const c = charById(d, charId);
  if (!c) return;
  if (useTools && !c.inventory.some((i) => CARTOGRAPHER.test(i.name))) return void log(d, `${c.name} has no Cartographer's Tools.`, 'warn');
  if (!useTools && !d.settings.improvised) return void log(d, `${c.name} needs Cartographer's Tools to draft a map (improvised attempts are off).`, 'warn');
  const name = mapName(d.place.name);
  if (partyHasMapHere(d)) return void log(d, `The party already has a ${name}.`);
  advanceMut(d, ctx, MAP_MINUTES * (useTools ? 1 : IMPROVISED_TIME), 'camp');
  const dc = useTools ? MAP_DC : IMPROVISED_MAP_DC;
  const mod = bonus - 2 * c.exhaustion;
  const r = d20('normal', ctx.rng);
  const roll = `${useTools ? "Wisdom with Cartographer's Tools" : 'Wisdom, with paper and charcoal'} ${r.value} ${signed(mod)} = ${r.value + mod} against DC ${dc}`;
  if (r.value + mod < dc) return void log(d, `${c.name} sketches the lay of the land (${roll}), but the result is too muddled to steer by.`, 'warn');
  const me = charById(d, charId)!;
  me.inventory.push({ id: uid(), name, qty: 1, weight: 0, source: 'manual', valueGp: ROUTE_MAP_GP, container: null, ammo: null });
  log(d, `${me.name} drafts a ${name} (${roll}). Navigating here now gets +5 (2024 PHB Map).`, 'good');
});

/**
 * Repairing a damaged item. Mending fixes any single break or tear up to 1 foot (no roll, 1 minute).
 * Weaver's Tools mend a tear in cloth, Dexterity DC 10 (2024 PHB); improvised sewing at DC 15, twice as long (table rule).
 */
export const mendItem = act((d, ctx, ownerId: string, itemId: string, menderId: string, method: 'mending' | 'tools' | 'improvised', bonus: number) => {
  const owner = charById(d, ownerId);
  const it = owner?.inventory.find((i) => i.id === itemId);
  const m = charById(d, menderId);
  if (!owner || !it || !m || !it.damaged) return;
  const fixed = () => {
    const x = charById(d, ownerId)!.inventory.find((i) => i.id === itemId);
    if (x) delete x.damaged;
  };
  if (method === 'mending') {
    if (!m.spells.some((sp) => sp.name.toLowerCase() === 'mending')) return void log(d, `${m.name} doesn't know Mending.`, 'warn');
    advanceMut(d, ctx, 1, 'camp');
    fixed();
    const x = charById(d, ownerId)!.inventory.find((i) => i.id === itemId);
    if (x) delete x.wear;
    return void log(d, `${m.name} casts Mending and the ${it.name} knits itself whole, leaving no trace of the damage or wear.`, 'good');
  }
  if (!CLOTH.test(it.name)) return void log(d, `The ${it.name} isn't cloth: it needs Mending, or a smith or other crafter in town.`, 'warn');
  if (method === 'tools' && !m.inventory.some((i) => WEAVER.test(i.name))) return void log(d, `${m.name} has no Weaver's Tools.`, 'warn');
  if (method === 'improvised' && !d.settings.improvised) return void log(d, `${m.name} needs Weaver's Tools (improvised attempts are off).`, 'warn');
  const tools = method === 'tools';
  advanceMut(d, ctx, MEND_MINUTES * (tools ? 1 : IMPROVISED_TIME), 'camp');
  const dc = tools ? MEND_DC : IMPROVISED_MEND_DC;
  const mod = bonus - 2 * m.exhaustion;
  const r = d20('normal', ctx.rng);
  const roll = `${tools ? "Dexterity with Weaver's Tools" : 'Dexterity, with needle and thread'} ${r.value} ${signed(mod)} = ${r.value + mod} against DC ${dc}`;
  if (r.value + mod < dc) return void log(d, `${m.name} works at the tear in the ${it.name} (${roll}), but the stitching won't hold.`, 'warn');
  fixed();
  // Table rule: a sound mend clears the wear too; an expert one reinforces the seams against the next knock.
  const x = charById(d, ownerId)!.inventory.find((i) => i.id === itemId);
  const expert = r.value + mod >= dc + REINFORCE_MARGIN;
  if (x) {
    delete x.wear;
    if (expert) x.reinforced = true;
  }
  log(d, `${m.name} mends the ${it.name} (${roll}): the tear is closed${tools ? ' neatly' : ', a little lumpy but sound'}, and the wear is gone.${expert ? ' The stitching is better than new: it will shrug off the next wear it would take (table rule).' : ''}`, 'good');
});

/** Marks an inventory item damaged or sound. */
export const setDamaged = act((d, _ctx, ownerId: string, itemId: string, damaged: boolean) => {
  const it = charById(d, ownerId)?.inventory.find((i) => i.id === itemId);
  if (!it) return;
  if (damaged) it.damaged = true;
  else delete it.damaged;
  log(d, damaged ? `The ${it.name} is damaged: torn, cracked or broken.` : `The ${it.name} is sound again.`, damaged ? 'warn' : 'good');
});

/**
 * Making out a short text in a language nobody reads: Intelligence (Investigation) at DC 20 for the gist (table rule).
 * Knowing the language, an interpreter or Comprehend Languages reads it properly with no roll.
 */
export const decipherText = act((d, ctx, charId: string, bonus: number, language: string, gist: string) => {
  const c = charById(d, charId);
  if (!c) return;
  const interp = d.hirelings.find((h) => h.active && h.role === 'interpreter');
  if (interp) {
    advanceMut(d, ctx, DECIPHER_MINUTES, 'camp');
    return void log(d, `${interp.name}, the party's interpreter, reads the text in ${language.trim() || 'the unknown language'} aloud and properly${gist.trim() ? `: ${gist.trim()}` : ''}. No guesswork needed.`, 'good');
  }
  if (!d.settings.improvised) return void log(d, `Nobody can make sense of the ${language || 'unknown'} text without knowing the language (improvised attempts are off).`, 'warn');
  advanceMut(d, ctx, DECIPHER_MINUTES, 'camp');
  const mod = bonus - 2 * c.exhaustion;
  const r = d20('normal', ctx.rng);
  const roll = `Intelligence (Investigation) ${r.value} ${signed(mod)} = ${r.value + mod} against DC ${DECIPHER_DC}`;
  const lang = language.trim() || 'an unknown language';
  if (r.value + mod < DECIPHER_DC) return void log(d, `${c.name} pores over the text in ${lang} (${roll}) and can't make it out.`, 'warn');
  log(d, `${c.name} pieces together the gist of the text in ${lang} from shared roots, numbers and pictures (${roll})${gist.trim() ? `: ${gist.trim()}` : ''}. The details stay unclear.`, 'good');
});

export const foundTheWay = act((d) => {
  if (!d.travel.lost) return;
  log(d, `The party finds the way again after ${+d.travel.milesOffCourse.toFixed(1)} miles off course.`, 'good');
  d.travel.lost = false;
  d.travel.milesOffCourse = 0;
  d.travel.lostRecheckIn = 0;
});

/** Judging the hour from the sun, stars and nature: Wisdom (Survival) check (table rule). */
export const readTheSky = act((d, ctx, charId: string) => {
  const c = charById(d, charId);
  if (!c) return;
  const underground = !!CLIMATES[d.weather.climate].noWeather;
  const sky = readSky(d.minutes % MIN_PER_DAY, seasonOf(d), d.weather, underground);
  const dc = SKY_DC[sky.view];
  const r = d20('normal', ctx.rng);
  const total = r.value + c.survival - 2 * c.exhaustion;
  const trueHour = Math.round(d.minutes / 60) % 24;
  const guess = total >= dc ? trueHour : (trueHour + (ctx.rng() < 0.5 ? -1 : 1) * die(4, ctx.rng) + 24) % 24;
  log(
    d,
    `${c.name} reads the ${underground ? 'darkness' : 'sky'}: Wisdom (Survival) ${r.value} ${signed(c.survival - 2 * c.exhaustion)} = ${total} against DC ${dc}. They reckon it's about ${String(guess).padStart(2, '0')}:00${total >= dc ? ' (right to within the hour)' : ` (wrong: it's really about ${String(trueHour).padStart(2, '0')}:00)`}.`,
    total >= dc ? 'good' : 'warn',
  );
  // Table rule: a good read of clouds, wind and animals also tells tomorrow's weather. Tomorrow will hold to it.
  if (underground || total < dc) return;
  const tomorrow = d.dayIndex + 1;
  if (!d.forecast || d.forecast.dayIndex !== tomorrow || d.forecast.climate !== d.place.climate) {
    const next = { ...d, dayIndex: tomorrow, minutes: d.minutes } as State;
    d.forecast = rollWeather({ dayIndex: tomorrow, season: seasonOf(next), climate: d.place.climate, altitudeFt: d.place.altitudeFt, climateAdjustedPrecip: d.settings.climateAdjustedPrecip }, ctx.rng);
  }
  const f = d.forecast;
  const wet = f.precip === 'none' ? 'a dry day' : `${f.precip} ${f.high <= 32 ? 'snow' : 'rain'}`;
  if (total >= dc + FORECAST_MARGIN) log(d, `${c.name} reads tomorrow in the sky: ${wet}, ${f.wind === 'none' ? 'still air' : `${f.wind} wind`}, a high near ${f.high}°F and a low near ${f.low}°F (table rule).`, 'good');
  else log(d, `${c.name} smells the air and watches the clouds: tomorrow looks like ${f.precip === 'none' ? 'a dry day' : 'wet weather'}${f.wind === 'strong' ? ', with strong wind' : ''} (table rule).`, 'good');
});

// ---------------------------------------------------------------- casting spells (normally or as rituals)

export function canCastAsRitual(c: Character, sp: CharacterSpell): { ok: boolean; reason: string } {
  if (!sp.ritual) return { ok: false, reason: `${sp.name} doesn't have the Ritual tag.` };
  if (sp.prepared || sp.alwaysPrepared) return { ok: true, reason: '' };
  if (c.className === 'Wizard') return { ok: true, reason: '' }; // Ritual Adept: straight from the spellbook
  return { ok: false, reason: `${c.name} needs ${sp.name} prepared to cast it as a ritual.` };
}

/** A circle casting (Heroes of Faerûn): the secondary casters and the one Circle casting option used. */
export interface CircleCast {
  helperIds: string[];
  option: CircleOptionId;
}

/** Lowest tracked spell slot of at least this level with a use left; null if none; undefined if slots aren't tracked. */
function findSlot(c: Character, level: number): Character['resources'][number] | null | undefined {
  if (!c.resources.some((r) => /(spell|pact) slots/i.test(r.name))) return undefined;
  return (
    c.resources
      .filter((r) => /(spell|pact) slots \(level (\d)\)/i.test(r.name))
      .map((r) => ({ r, lvl: Number(/level (\d)/i.exec(r.name)![1]) }))
      .filter((x) => x.lvl >= level && x.r.current > 0)
      .sort((a, b) => a.lvl - b.lvl)[0]?.r ?? null
  );
}

/** Ends whatever this character is concentrating on. A spell shared through Distribute lasts while anyone else still holds it. */
function dropConcentration(d: State, c: Character, why: string): void {
  const held = d.effects.filter((e) => e.concentration && concentrators(e).includes(c.id));
  if (!held.length) return;
  const ended: ActiveEffect[] = [];
  const kept: ActiveEffect[] = [];
  for (const e of held) {
    const rest = concentrators(e).filter((id) => id !== c.id);
    if (e.concentrationIds?.length && rest.length) {
      e.concentrationIds = rest;
      kept.push(e);
    } else ended.push(e);
  }
  d.effects = d.effects.filter((e) => !ended.includes(e));
  if (ended.length) log(d, `${c.name} stops concentrating on ${ended.map((e) => e.name).join(', ')}${why}.`, 'warn', { charIds: [c.id] });
  if (kept.length) log(d, `${c.name} lets go of ${kept.map((e) => e.name).join(', ')}${why}; the others in the circle still hold it.`, 'info', { charIds: [c.id] });
}

/** One caster loses Concentration on an effect (damage, a failed save, incapacitation). */
export const loseConcentration = act((d, _ctx, effectId: string, charId: string) => {
  const e = d.effects.find((x) => x.id === effectId);
  const c = charById(d, charId);
  if (!e || !c || !concentrators(e).includes(c.id)) return;
  const rest = concentrators(e).filter((id) => id !== c.id);
  if (e.concentrationIds?.length && rest.length) {
    e.concentrationIds = rest;
    log(d, `${c.name} loses Concentration on ${e.name}; ${rest.map((id) => charById(d, id)?.name ?? '?').join(', ')} still hold${rest.length > 1 ? '' : 's'} it.`, 'warn', { charIds: [c.id] });
  } else {
    d.effects = d.effects.filter((x) => x !== e);
    log(d, `${c.name} loses Concentration and ${e.name} ends.`, 'warn', { charIds: [c.id] });
  }
});

/** Counts random encounters with creatures, so a long casting can tell whether one turned up mid-casting. */
let encounterSerial = 0;

/**
 * Casts a known spell: as a ritual (+10 minutes, no slot) or normally (uses a tracked slot of its level or higher).
 * A casting time of 1 minute or longer needs Concentration the whole time, so it ends other Concentration, and
 * a creature encounter or a caster going down breaks it off: the spell fails, no slot is spent and no Material
 * component is consumed. With `circle` (Heroes of Faerûn Circle Magic, optional), secondary casters join in.
 */
export const castSpell = act((d, ctx, charId: string, spellName: string, mode: 'ritual' | 'slot', targetId: string | null = null, circle: CircleCast | null = null) => {
  const c = charById(d, charId);
  const own = c?.spells.find((x) => x.name === spellName);
  if (!c || !own || !alive(c)) return;
  let sp = { ...own, ...spellInfo(own, d.spellLibrary) } as CharacterSpell;
  // Circle magic: check everything before anything is spent.
  const helpers: Character[] = [];
  let need: HelperSlot = { kind: 'none' };
  let discount = 0;
  if (circle) {
    if (!d.settings.circleMagic) return void log(d, 'Circle Magic is switched off in Settings.', 'warn');
    if (mode === 'ritual') return void log(d, `A Circle spell is cast with a spell slot, so ${sp.name} can't be cast as a ritual and a Circle spell at once.`, 'warn');
    const ok = circleEligible(sp);
    if (!ok.ok) return void log(d, ok.reason, 'warn');
    need = circleOption(circle.option).helperSlot(sp);
    for (const id of [...new Set(circle.helperIds)].filter((x) => x !== c.id)) {
      const h = charById(d, id);
      if (!h) continue;
      const problem = helperProblem(h, need);
      if (problem) return void log(d, `${problem} The circle casting of ${sp.name} doesn't begin.`, 'warn');
      helpers.push(h);
    }
    if (!helpers.length) return void log(d, `A Circle spell needs at least one secondary caster besides ${c.name}.`, 'warn');
    const bad = optionProblem(sp, circle.option, helpers.length);
    if (bad) return void log(d, bad, 'warn');
    if (circle.option === 'spell') {
      const sc = spellCircle(sp.name)!;
      sp = { ...sp, ...(sc.castMinutes !== undefined ? { castMinutes: sc.castMinutes, castTime: sc.castTime } : {}), ...(sc.durationMinutes !== undefined ? { durationMinutes: sc.durationMinutes, permanent: sc.durationMinutes === null } : {}), ...(sc.concentration !== undefined ? { concentration: sc.concentration } : {}) };
    }
    if (circle.option === 'supplant') discount = supplantDiscount(helpers.length);
  }
  const base = sp.castMinutes ?? 0;
  let slot: ReturnType<typeof findSlot>;
  if (mode === 'ritual') {
    const check = canCastAsRitual(c, sp);
    if (!check.ok) return void log(d, check.reason, 'warn');
  } else if (sp.level > 0) {
    if (!sp.prepared && !sp.alwaysPrepared) return void log(d, `${c.name} doesn't have ${sp.name} prepared.`, 'warn');
    slot = findSlot(c, sp.level);
    if (slot === null) return void log(d, `${c.name} has no spell slots of level ${sp.level} or higher left for ${sp.name}.`, 'warn');
  }
  if (!useComponent(d, c, own.name, { discount, checkOnly: true })) return;
  const minutes = base + (mode === 'ritual' ? RITUAL_TAG_MINUTES : 0);
  const casters = [c, ...helpers];
  const names = casters.map((x) => x.name);
  const opt = circle ? circleOption(circle.option) : null;
  const optTxt = circle?.option === 'spell' ? `its own circle effect (${spellCircle(sp.name)!.note})` : opt ? `${opt.label}: ${opt.summary}` : '';
  const timeTxt = mode === 'ritual' ? `as a ritual (${sp.castTime ?? 'its casting time'} + 10 minutes = ${formatDuration(Math.max(1, Math.round(minutes)))}, no spell slot)` : `(${sp.castTime ?? 'its casting time'}${sp.level > 0 ? ', using a spell slot' : ''})`;
  if (minutes >= 1) {
    // Longer casting times: the Magic action every turn and Concentration until the spell is cast.
    for (const x of casters) dropConcentration(d, x, ` to hold ${sp.name} together while casting it`);
    if (helpers.length)
      log(
        d,
        `${c.name} begins ${sp.name} as a Circle spell ${timeTxt} with ${helpers.map((h) => h.name).join(', ')} as secondary caster${helpers.length > 1 ? 's' : ''}, using ${optTxt} Each secondary caster contributes from within ${CIRCLE_RANGE_FT} feet of ${c.name}; everyone takes the Magic action each turn and keeps Concentration until it's done, and if anyone's Concentration breaks, the spell fails.`,
        'info',
        { charIds: casters.map((x) => x.id), sense: circleBeginsText(sp.name, helpers.length) },
      );
    let left = Math.round(minutes);
    const startSerial = encounterSerial;
    while (left > 0) {
      const step = Math.min(left, 60);
      advanceMut(d, ctx, step, 'camp');
      left -= step;
      const fallen = casters.filter((x) => !alive(x) || x.hp <= 0 || x.dying);
      if (encounterSerial !== startSerial || fallen.length) {
        const spent = Math.round(minutes) - left;
        const why = fallen.length ? `${fallen.map((x) => x.name).join(', ')} can't keep casting` : 'creatures turn up mid-casting';
        log(
          d,
          `${names.join(', ')} ${casters.length > 1 ? 'break' : 'breaks'} off casting ${sp.name} after ${formatDuration(Math.max(1, spent))}: ${why}. ${sp.name} fails: no spell slot is spent and no Material component is consumed. If the DM rules the casting went on undisturbed, cast it again; otherwise it starts over.`,
          'warn',
          { charIds: casters.map((x) => x.id), sense: helpers.length ? circleBrokenText(sp.name) : `The half-woven spell unravels and its gathered power drains away harmlessly.` },
        );
        return;
      }
    }
  }
  if (!useComponent(d, c, own.name, { discount })) return;
  if (slot) slot.current -= 1;
  for (const h of helpers) {
    if (need.kind === 'none') continue;
    const hs = findSlot(h, need.kind === 'any' ? 1 : need.level);
    if (hs) hs.current -= 1;
  }
  if (helpers.length) {
    log(d, `${c.name} completes ${sp.name} as a Circle spell with ${optTxt.replace(/\.$/, '')}. ${helpers.map((h) => h.name).join(', ')} spend${helpers.length > 1 ? '' : 's'} ${slotNeedText(need)}${helpers.length > 1 && need.kind !== 'none' ? ' each' : ''}.`, 'good', { charIds: casters.map((x) => x.id), sense: circleEndsText(sp.name) });
  } else log(d, `${c.name} casts ${sp.name} ${timeTxt}.`, 'good');
  if (targetId && TARGET_SPELLS[sp.name]) applySpellTo(d, ctx, sp.name, targetId);
  const extra = circle?.option === 'prolong' ? prolongMinutes(helpers.length) : 0;
  if (sp.durationMinutes || sp.permanent) {
    const minutesLong = sp.permanent ? null : (sp.durationMinutes ?? 0) + extra;
    const concentration = !!sp.concentration;
    const shared = concentration && circle?.option === 'distribute' ? casters.map((x) => x.id) : undefined;
    if (concentration) for (const x of shared ? casters : [c]) dropConcentration(d, x, '');
    const now = absNow(d);
    d.effects.push({
      id: uid(),
      name: sp.name,
      kind: 'spell',
      targetIds: [],
      casterId: c.id,
      concentration,
      ...(shared ? { concentrationIds: shared } : {}),
      shelter: /tiny hut|rope trick|magnificent mansion/i.test(sp.name),
      startedAt: now,
      endsAt: minutesLong == null ? null : now + minutesLong,
      notes: helpers.length ? `Circle spell (${opt!.label}) with ${helpers.map((h) => h.name).join(', ')}.${extra ? ` Prolonged by ${formatDuration(extra)}.` : ''}${shared ? ' Any of the casters can hold its Concentration.' : ''}` : '',
    });
    log(d, `${sp.name} lasts ${minutesLong == null ? 'until dispelled' : formatDuration(minutesLong)}${extra ? ` (${formatDuration(extra)} longer with Prolong)` : ''}${concentration ? (shared ? ` (Concentration, held by ${names.join(', ')})` : ' (Concentration)') : ''}. Its timer is on the Effects & Ailments tab.`);
  }
});

// ---------------------------------------------------------------- hirelings at work

/** A character, or a hireling standing in for one (guide, cook, healer), for rolls the tracker makes. */
export function actorById(s: State, id: string): Character | undefined {
  if (!id.startsWith('h:')) return charById(s, id);
  const h = s.hirelings.find((x) => `h:${x.id}` === id && x.active);
  if (!h) return undefined;
  return newCharacter({ id, name: `${h.name} (hireling)`, survival: h.bonus, wisMod: h.bonus, passivePerception: h.passivePerception, needsFood: false, needsWater: false, tasks: [] });
}

export const sendMessage = act((d, _ctx, hirelingId: string, miles: number, payer: string) => {
  const h = d.hirelings.find((x) => x.id === hirelingId);
  if (!h || miles <= 0) return;
  log(d, `${h.name} sets off to deliver a message ${miles} mile(s) away.`);
  payGold(d, payer === 'party' ? [] : [payer], Math.round(miles * MESSENGER_GP_PER_MILE * 100) / 100, `a message carried ${miles} mile(s)`);
});

export const torchbearerLights = act((d, _ctx, hirelingId: string) => {
  const h = d.hirelings.find((x) => x.id === hirelingId);
  if (!h) return;
  const now = absNow(d);
  d.effects.push({ id: uid(), name: `Torch (carried by ${h.name})`, kind: 'light', targetIds: [], casterId: null, concentration: false, shelter: false, startedAt: now, endsAt: now + 60, notes: 'Bright Light 20 ft, Dim Light 20 ft more.' });
  log(d, `${h.name} lights a torch and holds it high.`);
});

/** A groom feeds and waters every mount at the end of the day. */
function groomTheMounts(s: State): void {
  // A teamster handles draft animals and tends them like a groom (table rule).
  const groom = s.hirelings.find((h) => h.active && h.role === 'groom') ?? s.hirelings.find((h) => h.active && h.role === 'teamster');
  if (!groom) return;
  const tended: string[] = [];
  for (const m of s.characters.filter((c) => c.kind === 'mount' && alive(c))) {
    const food = Math.max(0, foodNeedLb(m) - m.ateLbToday);
    const fromFeed = Math.min(food, m.rationsLb);
    m.rationsLb = Math.round((m.rationsLb - fromFeed) * 100) / 100;
    m.ateLbToday += fromFeed;
    const water = Math.max(0, waterNeedPints(m, false, false) - m.drankPintsToday);
    let got = 0;
    if (s.place.waterSource) got = water;
    else {
      got = Math.min(water, s.stores.waterGal * PINTS_PER_GALLON);
      s.stores.waterGal = Math.round((s.stores.waterGal - got / PINTS_PER_GALLON) * 100) / 100;
    }
    m.drankPintsToday += got;
    tended.push(`${m.name}${fromFeed < food ? ' (short of feed)' : ''}${got < water ? ' (short of water)' : ''}`);
  }
  if (tended.length) log(s, `${groom.name} feeds and waters the animals: ${tended.join(', ')}.`, tended.some((t) => t.includes('short')) ? 'warn' : 'info');
}

// ---------------------------------------------------------------- camp gear: tents, shovels, traps, alarms, caltrops

/** Small and Medium people who'd sleep in tents tonight (living adventurers). */
const tentSleepers = (s: State): Character[] => s.characters.filter((c) => c.kind !== 'mount' && alive(c) && (c.size === 'Small' || c.size === 'Medium' || c.size === 'Tiny'));

/** Places in the party's tents: two Small or Medium creatures each (2024 PHB). */
export function tentSpaces(s: State): number {
  const tents = s.characters.reduce((a, c) => a + c.inventory.filter((i) => TENT.test(i.name.trim()) && !i.scattered).reduce((n, i) => n + i.qty, 0), 0);
  return tents * TENT_SLEEPS + (s.place.leanTos ?? 0) * LEAN_TO.sleeps;
}

/** Camping in tents without enough of them: who sleeps in the open. Empty when inventories aren't kept or the rule is off. */
export function tentShortfall(s: State): Character[] {
  if (!s.settings.tentSpace || s.place.shelter !== 'tent' || !inventoriesKept(s)) return [];
  const sleepers = tentSleepers(s);
  const spaces = tentSpaces(s);
  return sleepers.slice(spaces);
}

/** Digs with Shovels (2024 PHB: an hour per 5-foot hole each), or by hand at four times the time (table rule). */
export const dig = act((d, ctx, diggerIds: string[], kind: DigKind) => {
  const diggers = diggerIds.map((id) => charById(d, id)).filter((c): c is Character => !!c && alive(c));
  if (!diggers.length) return;
  const job = DIG_LABEL[kind];
  if (kind === 'snowCave' && (d.place.ground?.snowIn ?? 0) < 24) return void log(d, 'There isn’t enough snow here for a snow cave (it takes drifts 2 feet deep or more).', 'warn');
  const shovels = s_count(d, SHOVEL);
  const withShovel = Math.min(diggers.length, shovels);
  if (!withShovel && !d.settings.improvised) return void log(d, 'Nobody has a Shovel, and improvised attempts are off.', 'warn');
  // Each digger with a shovel moves one 5-foot hole an hour; one without, a quarter of that.
  const rate = withShovel + (diggers.length - withShovel) / DIG_BY_HAND;
  const minutes = Math.ceil((job.holes * SHOVEL_MINUTES) / rate);
  advanceMut(d, ctx, minutes, 'work');
  const place = d.place;
  place.dug = [...(place.dug ?? []).filter((x) => x !== job.label), job.label];
  if (kind === 'firePit') d.fire.sheltered = true;
  if (kind === 'snowCave') place.shelter = 'cave';
  log(
    d,
    `${diggers.map((c) => c.name).join(', ')} dig${diggers.length > 1 ? '' : 's'} ${job.label.toLowerCase()} in ${formatDuration(minutes)}${withShovel ? ` with ${withShovel} Shovel${withShovel > 1 ? 's' : ''}` : ' by hand (table rule: four times as long)'}. ${job.note}`,
    'good',
  );
  if (die(20, ctx.rng) >= DIG_FIND_ON) grantFind(d, ctx, charById(d, diggers[0].id)!, 'dig');
});

const s_count = (s: State, re: RegExp): number => s.characters.reduce((a, c) => a + c.inventory.filter((i) => re.test(i.name.trim()) && !i.scattered).reduce((n, i) => n + i.qty, 0), 0);

/** Sets Hunting Traps on game trails near camp (2024 PHB: a Utilize action each, chained to a tree or spike). */
export const setTraps = act((d, ctx, charId: string, qty: number, snare: boolean = false, bonus: number = 0) => {
  const c = charById(d, charId);
  if (!c) return;
  if (snare) {
    if (!d.settings.improvised) return void log(d, 'Snares are an improvised attempt, and those are off.', 'warn');
    const lines = c.inventory.filter((i) => SNARE_LINE.test(i.name.trim()) && i.qty > 0).reduce((a, i) => a + i.qty, 0);
    const n = Math.min(lines, Math.max(1, Math.round(qty)));
    if (!n) return void log(d, `${c.name} needs String or Rope (or vine cord) to make a snare.`, 'warn');
    advanceMut(d, ctx, 15 * n, 'camp');
    const me = charById(d, charId)!;
    const r = d20('normal', ctx.rng);
    const mod = bonus - 2 * me.exhaustion;
    const roll = `Wisdom (Survival) ${r.value} ${signed(mod)} = ${r.value + mod} against DC ${SNARE.dc}`;
    if (r.value + mod < SNARE.dc) return void log(d, `${me.name} tries to rig ${n > 1 ? `${n} snares` : 'a snare'} on a game trail (${roll}), but the loops won't sit right; anything would brush past (table rule).`, 'warn');
    d.place.trapsSet = [...(d.place.trapsSet ?? []), { charId, qty: n, setAt: absNow(d), snare: true }];
    return void log(d, `${me.name} rigs ${n > 1 ? `${n} snares` : 'a snare'} of cord along a game trail (${roll}, ${15 * n} min, table rule). Check after a night: each catches on a d20 roll of ${SNARE.catchOn}+.`, 'good');
  }
  const have = c.inventory.filter((i) => HUNTING_TRAP.test(i.name) && i.qty > 0);
  const total = have.reduce((a, i) => a + i.qty, 0);
  const n = Math.min(total, Math.max(1, Math.round(qty)));
  if (!n) return void log(d, `${c.name} has no Hunting Trap.`, 'warn');
  let left = n;
  for (const it of have) {
    const take = Math.min(left, it.qty);
    it.qty -= take;
    left -= take;
  }
  c.inventory = c.inventory.filter((i) => !(HUNTING_TRAP.test(i.name) && i.qty <= 0));
  advanceMut(d, ctx, 10 * n, 'camp');
  d.place.trapsSet = [...(d.place.trapsSet ?? []), { charId, qty: n, setAt: absNow(d) }];
  log(d, `${c.name} sets ${n} Hunting Trap${n > 1 ? 's' : ''} along game trails near camp (${10 * n} min, table rule). Check them after a night: a creature that steps on one makes a DC ${TRAP_SAVE_DC} Dexterity save or is caught.`);
});

/** Checks and collects the traps. Table rule: each one left 8 hours or more catches small game on a d20 roll of 13+, worth 1d4 + 1 lb of raw meat. */
function collectTraps(d: State, ctx: Ctx): void {
  const traps = d.place.trapsSet ?? [];
  if (!traps.length) return;
  const now = absNow(d);
  let meat = 0;
  let caught = 0;
  let early = 0;
  let pelts = 0;
  let furs = 0;
  for (const t of traps) {
    const c = charById(d, t.charId) ?? d.characters.find((x) => x.kind === 'pc');
    for (let i = 0; i < t.qty; i++) {
      if (now - t.setAt < 8 * 60) early++;
      else if (die(20, ctx.rng) >= (t.snare ? SNARE.catchOn : TRAP_CATCH_ON)) {
        caught++;
        meat += rollExpr(TRAP_MEAT_DICE, ctx.rng) ?? 2;
        // Table rule: every catch leaves a pelt; one in six is a prized fur.
        const fur = die(FINE_FUR_ODDS, ctx.rng) === 1 ? FINE_FUR : SMALL_PELT;
        if (fur === FINE_FUR) furs++;
        else pelts++;
        if (c) addLine(d, c, fur.name, 1, { valueGp: fur.valueGp, weight: fur.weight }, null, false);
      }
    }
    if (c && !t.snare) addLine(d, c, 'Hunting Trap', t.qty, {}, null, false);
  }
  d.place.trapsSet = [];
  if (meat) d.stores.foodRawLb += meat;
  const n = traps.reduce((a, t) => a + t.qty, 0);
  log(
    d,
    caught
      ? `The traps are checked and gathered: ${caught} of ${n} caught something, ${meat} lb of raw meat for the stores${pelts ? `, ${pelts} small pelt${pelts > 1 ? 's' : ''} (2 SP each)` : ''}${furs ? `, and ${furs} fine fur${furs > 1 ? 's' : ''} worth 2 GP${furs > 1 ? ' each' : ''}` : ''} (table rule).`
      : `The traps are checked and gathered: nothing caught${early ? ` (${early} hadn't been out a full night)` : ''}.`,
    caught ? 'good' : 'info',
  );
}

export const checkTraps = act((d, ctx) => {
  if (!(d.place.trapsSet ?? []).length) return;
  advanceMut(d, ctx, 10, 'camp');
  collectTraps(d, ctx);
});

/** Hangs a Bell on a String or Rope around the camp (table rule): anything that crosses it rings the bell and wakes the camp. */
export const rigAlarm = act((d, ctx, charId: string) => {
  const c = charById(d, charId);
  if (!c) return;
  const bell = carrierOf(d, [charId], BELL);
  const line = carrierOf(d, [charId], ALARM_LINE);
  const pots = carrierOf(d, [charId], POTS);
  if (!line) return void log(d, 'An alarm line needs a length of String, Rope, Chain or vine cord.', 'warn');
  if (!bell) {
    if (!pots || !d.settings.improvised) return void log(d, `An alarm needs a Bell${d.settings.improvised ? ', or an Iron Pot, Bucket or cans to rattle,' : ''} on the line.`, 'warn');
    advanceMut(d, ctx, ALARM_MINUTES, 'camp');
    d.place.alarm = 'pots';
    return void log(d, `${c.name} strings a line around the camp and hangs the ${pots.it.name.toLowerCase()} and anything else that rattles on it (${ALARM_MINUTES} min, table rule). A careless intruder will set it clanking; a careful one (Stealth ${POT_ALARM_DC}+) might not.`, 'good');
  }
  advanceMut(d, ctx, ALARM_MINUTES, 'camp');
  d.place.alarm = true;
  log(d, `${c.name} strings a line around the camp at ankle height and hangs a Bell on it (${ALARM_MINUTES} min, table rule). Anything that crosses it will ring it, heard up to 60 feet away.`, 'good');
});

/** Spreads Caltrops or Ball Bearings as a Utilize action (2024 PHB). They stay on the ground until gathered up. */
export const scatterItem = act((d, _ctx, charId: string, itemId: string) => {
  const c = charById(d, charId);
  const it = c?.inventory.find((i) => i.id === itemId);
  if (!c || !it || it.scattered || !SCATTERABLE.test(it.name.trim())) return;
  if (it.qty > 1) {
    it.qty -= 1;
    c.inventory.push({ ...it, id: uid(), qty: 1, scattered: true, containerId: null });
  } else {
    it.scattered = true;
    it.containerId = null;
  }
  log(d, /caltrops/i.test(it.name)
    ? `${c.name} spreads Caltrops over a 5-foot square: a creature entering it makes a DC 15 Dexterity save or takes 1 Piercing damage and stops.`
    : `${c.name} spills Ball Bearings over a 10-foot square: a creature entering it makes a DC 10 Dexterity save or falls Prone.`);
});

/** Gathers up spread Caltrops and Ball Bearings: 10 minutes (2024 PHB). */
export const gatherScattered = act((d, ctx, charIds: string[]) => {
  const who = charIds.length ? charIds : d.characters.map((c) => c.id);
  const items = d.characters.filter((c) => who.includes(c.id)).flatMap((c) => c.inventory.filter((i) => i.scattered).map((i) => ({ c, i })));
  if (!items.length) return;
  advanceMut(d, ctx, GATHER_MINUTES, 'camp');
  for (const { c, i } of items) {
    const me = charById(d, c.id)!;
    me.inventory = me.inventory.filter((x) => x.id !== i.id);
    addLine(d, me, i.name, i.qty, { valueGp: i.valueGp }, null, false);
  }
  log(d, `It takes ${GATHER_MINUTES} minutes to gather up ${items.map(({ i }) => i.name).join(' and ')} (2024 PHB).`);
});

/** Leaving camp: traps are checked and taken along, the alarm comes down, and anything still spread on the ground is left behind. */
function breakCamp(d: State, ctx: Ctx): void {
  if ((d.place.trapsSet ?? []).length) collectTraps(d, ctx);
  if (d.place.alarm) d.place.alarm = false;
  if (d.place.dug?.length) d.place.dug = [];
  if (d.place.leanTos) d.place.leanTos = 0;
  for (const c of d.characters) if (c.bedding) c.bedding = false;
  const lost: string[] = [];
  for (const c of d.characters) {
    const left = c.inventory.filter((i) => i.scattered);
    if (left.length) {
      lost.push(...left.map((i) => `${c.name}'s ${i.name}`));
      c.inventory = c.inventory.filter((i) => !i.scattered);
    }
  }
  if (lost.length) log(d, `Left behind on the ground: ${lost.join(', ')}.`, 'warn');
  const unsaddled = d.characters.filter((m) => m.kind === 'mount' && alive(m) && needsExoticSaddle(m));
  if (unsaddled.length) log(d, `${unsaddled.map((m) => m.name).join(', ')} can't be ridden without an Exotic Saddle (2024 PHB): flying and swimming mounts need one.`, 'warn');
}

// ---------------------------------------------------------------- doing without: makeshift gear (table rules)

export type MakeshiftKind = 'torch' | 'leanTo' | 'bedding' | 'waterskin' | 'cord';

/** What a makeshift job needs here: its DC and time, or why it can't be done. */
export function makeshiftJob(s: State, kind: MakeshiftKind): { dc: number; minutes: number; label: string } | { why: string } {
  const veg = MAKESHIFT_DC[s.place.terrain];
  const t = TERRAIN[s.place.terrain].label.toLowerCase();
  switch (kind) {
    case 'torch':
      return veg == null ? { why: `there's nothing to make a torch from in ${t} terrain` } : { dc: MAKESHIFT_TORCH.dc, minutes: MAKESHIFT_TORCH.minutes, label: 'a makeshift torch' };
    case 'leanTo': {
      const dc = leanToDC(s.place.terrain, s.place.ground?.snowIn ?? 0);
      return dc == null ? { why: `there's nothing to build a shelter from in ${t} terrain` } : { dc, minutes: LEAN_TO.minutes, label: (s.place.ground?.snowIn ?? 0) >= LEAN_TO.snowInches ? 'a snow trench' : 'a lean-to' };
    }
    case 'bedding':
      return veg == null ? { why: `there are no boughs or leaves to sleep on in ${t} terrain` } : { dc: BEDDING.dc, minutes: BEDDING.minutes, label: 'a bed of boughs and leaves' };
    case 'cord':
      return veg == null ? { why: `there are no vines or bark to twist into cord in ${t} terrain` } : { dc: VINE_CORD.dc, minutes: VINE_CORD.minutes, label: '10 feet of vine cord' };
    case 'waterskin':
      return s.materials.some((m) => /^hide\b/i.test(m.name) && m.qty > 0) ? { dc: HIDE_WATERSKIN.dc, minutes: HIDE_WATERSKIN.minutes, label: 'a waterskin from a hide' } : { why: 'there is no hide to work (butcher a hunted animal first)' };
  }
}

/**
 * Making do without the proper gear (table rules, under the improvised switch): a Wisdom (Survival) check to make a
 * makeshift torch, a lean-to, a bed of boughs, a hide waterskin or vine cord from what's around.
 */
export const makeshift = act((d, ctx, charId: string, kind: MakeshiftKind, bonus: number) => {
  const c = charById(d, charId);
  if (!c) return;
  if (!d.settings.improvised) return void log(d, 'Makeshift gear is an improvised attempt, and those are off.', 'warn');
  const job = makeshiftJob(d, kind);
  if ('why' in job) return void log(d, `${c.name} can't: ${job.why}.`, 'warn');
  advanceMut(d, ctx, job.minutes, 'camp');
  const me = charById(d, charId)!;
  const r = d20('normal', ctx.rng);
  const mod = bonus - 2 * me.exhaustion;
  const roll = `Wisdom (Survival) ${r.value} ${signed(mod)} = ${r.value + mod} against DC ${job.dc}, ${formatDuration(job.minutes)}`;
  if (r.value + mod < job.dc) {
    if (kind === 'waterskin') {
      const hide = d.materials.find((m) => /^hide\b/i.test(m.name) && m.qty > 0)!;
      hide.qty -= 1;
      d.materials = d.materials.filter((m) => m.qty > 0);
    }
    return void log(d, `${me.name} works at ${job.label} (${roll}) but it won't hold together${kind === 'waterskin' ? ', and the hide is spoiled' : ''} (table rule).`, 'warn');
  }
  switch (kind) {
    case 'torch':
      addLine(d, me, MAKESHIFT_TORCH.name, 1, {}, null, false);
      return void log(d, `${me.name} binds dry grass and rags to a stout branch: a makeshift torch that will burn about ${MAKESHIFT_TORCH.burns} minutes (${roll}, table rule).`, 'good');
    case 'leanTo':
      d.place.leanTos = (d.place.leanTos ?? 0) + 1;
      if (d.place.shelter === 'none') d.place.shelter = 'tent';
      return void log(d, `${me.name} builds ${job.label}, room for ${LEAN_TO.sleeps} (${roll}, table rule). It counts as a Tent until the party moves on.`, 'good');
    case 'bedding':
      me.bedding = true;
      return void log(d, `${me.name} heaps up a springy bed of boughs and leaves (${roll}, table rule): it counts as a Blanket tonight.`, 'good');
    case 'waterskin': {
      const hide = d.materials.find((m) => /^hide\b/i.test(m.name) && m.qty > 0)!;
      hide.qty -= 1;
      d.materials = d.materials.filter((m) => m.qty > 0);
      me.waterCapacityPints += WATERSKIN_PINTS;
      return void log(d, `${me.name} scrapes and sews the ${hide.name.toLowerCase()} into a rough waterskin (${roll}, table rule): ${WATERSKIN_PINTS} more pints to fill.`, 'good');
    }
    case 'cord':
      addLine(d, me, VINE_CORD.name, 1, {}, null, false);
      return void log(d, `${me.name} twists vines and bark strips into 10 feet of cord (${roll}, table rule). It bursts at Strength DC 15, not Rope's 20.`, 'good');
  }
});

// ---------------------------------------------------------------- tool checks, perfume, signals and writing

/** Liquid the party's barrels, jugs and pots can hold, in gallons (2024 PHB capacities), counting stashes and vehicles. */
export function waterContainers(s: State): number {
  return liquidCapacity([...s.characters.flatMap((c) => c.inventory), ...s.stashes.flatMap((x) => x.items)]);
}

/**
 * A tool's Utilize use (2024 PHB): ability check against the tool's DC, with the Proficiency Bonus if proficient and
 * Advantage if a skill also applies. Without the tool, an improvised try at DC +5 and twice the time (table rule).
 */
export const useTool = act((d, ctx, charId: string, toolName: string, useIndex: number, bonus: number, advantage: boolean, what: string) => {
  const c = charById(d, charId);
  const tool = toolNamed(toolName);
  const use = tool?.uses[useIndex];
  if (!c || !tool || !use) return;
  const has = carriesTool(c, tool.name);
  if (!has && !d.settings.improvised) return void log(d, `${c.name} has no ${tool.name} (improvised attempts are off).`, 'warn');
  const dc = use.dc + (has ? 0 : IMPROVISED_DC);
  const minutes = (use.minutes ?? 0) * (has ? 1 : IMPROVISED_TIME);
  if (minutes) advanceMut(d, ctx, minutes, 'camp');
  const me = charById(d, charId)!;
  const mode = advantage && has ? 'advantage' : 'normal';
  const r = d20(mode, ctx.rng);
  const mod = bonus - 2 * me.exhaustion;
  const total = r.value + mod;
  const on = what.trim() ? ` (${what.trim()})` : '';
  const roll = `${ABILITY_LABEL[tool.ability]}${has ? ` with ${tool.name}` : `, improvised without ${tool.name}`} ${r.rolls.join('/')}${mode === 'advantage' ? ' with Advantage' : ''} ${signed(mod)} = ${total} against DC ${dc}${minutes ? `, ${formatDuration(minutes)}` : ''}`;
  if (total >= dc) {
    log(d, `${me.name} tries to ${use.text.charAt(0).toLowerCase()}${use.text.slice(1)}${on} and ${use.success}: ${roll}.`, 'good');
    if (use.effect) {
      const now = absNow(d);
      d.effects.push({ id: uid(), name: `${use.effect.name} (${me.name})`, kind: 'other', targetIds: [me.id], casterId: null, concentration: false, shelter: false, startedAt: now, endsAt: now + use.effect.minutes, notes: use.effect.note });
    }
  } else log(d, `${me.name} tries to ${use.text.charAt(0).toLowerCase()}${use.text.slice(1)}${on}, but ${use.failure}: ${roll}.`, 'warn');
});

/** Dabs on Perfume: for 1 hour, Advantage on Charisma (Persuasion) checks to influence an Indifferent Humanoid within 5 feet (2024 PHB). */
export const applyPerfume = act((d, _ctx, charId: string) => {
  const c = charById(d, charId);
  const it = c?.inventory.find((i) => PERFUME.test(i.name) && i.qty > 0);
  if (!c || !it) return void log(d, `${c?.name ?? 'They'} has no Perfume.`, 'warn');
  useUpOne(c, it);
  const now = absNow(d);
  d.effects.push({ id: uid(), name: `Perfume (${c.name})`, kind: 'other', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: now, endsAt: now + PERFUME_MINUTES, notes: 'Advantage on Charisma (Persuasion) checks to influence an Indifferent Humanoid within 5 feet.' });
  noticed(d, 'effectEnds', [c], `${c.name} dabs on Perfume; a pleasant scent lingers around them for the next hour.`, 'good');
});

/** Sounds a Signal Whistle (heard up to 600 feet) or a Bell (60 feet), 2024 PHB. */
export const soundSignal = act((d, _ctx, charId: string, kind: 'whistle' | 'bell') => {
  const c = charById(d, charId);
  if (!c) return;
  const re = kind === 'whistle' ? SIGNAL_WHISTLE : BELL;
  if (!c.inventory.some((i) => re.test(i.name.trim()))) return void log(d, `${c.name} has no ${kind === 'whistle' ? 'Signal Whistle' : 'Bell'}.`, 'warn');
  log(d, kind === 'whistle' ? `${c.name} blows a Signal Whistle: a shrill blast anyone within 600 feet can hear.` : `${c.name} rings a Bell, clear enough to be heard 60 feet away.`);
});

/**
 * Writes pages: each sheet of Paper or Parchment holds about 250 words, and a bottle of Ink writes about 500 pages (2024 PHB).
 * Table rule: a page takes about 10 minutes to write out by hand.
 */
export const writePages = act((d, ctx, charId: string, pages: number, what: string) => writePagesMut(d, ctx, charId, pages, what));

function writePagesMut(d: State, ctx: Ctx, charId: string, pages: number, what: string, takesTime = true): void {
  const c = charById(d, charId);
  const n = Math.max(1, Math.round(pages));
  if (!c) return;
  const sheets = c.inventory.filter((i) => PAPER.test(i.name.trim()) && i.qty > 0);
  const have = sheets.reduce((a, i) => a + i.qty, 0);
  const ink = c.inventory.find((i) => INK.test(i.name.trim()) && i.qty > 0);
  const pen = c.inventory.some((i) => /ink pen|quill/i.test(i.name));
  if (have < n || !ink || !pen) {
    // Table rule: charcoal on bark or hide, a short note at most.
    if (!d.settings.improvised) return void log(d, `${c.name} needs ${n} sheet${n > 1 ? 's' : ''} of Paper or Parchment (has ${have}), Ink and an Ink Pen.`, 'warn');
    advanceMut(d, ctx, 10, 'camp');
    const missing = [have < n && 'paper', !ink && 'ink', !pen && 'a pen'].filter(Boolean).join(', ');
    return void log(d, `With no ${missing}, ${c.name} scratches a short note${what.trim() ? ` (${what.trim()})` : ''} in charcoal on bark: a few lines, about ${CHARCOAL_WORDS} words at most, that rain will smudge (table rule).`);
  }
  if (takesTime) advanceMut(d, ctx, n * 10, 'camp');
  const me = charById(d, charId)!;
  let left = n;
  for (const it of me.inventory.filter((i) => PAPER.test(i.name.trim()) && i.qty > 0)) {
    while (left > 0 && it.qty > 0) (it.qty -= 1), (left -= 1);
  }
  me.inventory = me.inventory.filter((i) => !(PAPER.test(i.name.trim()) && i.qty <= 0));
  const bottle = me.inventory.find((i) => INK.test(i.name.trim()) && i.qty > 0)!;
  let pagesLeft = (bottle.uses ?? INK_PAGES) - n;
  let note = `${pagesLeft} pages of Ink left in the bottle`;
  while (pagesLeft <= 0) {
    if (useUpOne(me, bottle) <= 0) {
      note = 'the Ink has run dry';
      break;
    }
    pagesLeft += INK_PAGES;
    note = `one bottle of Ink used up; ${pagesLeft} pages left in the next`;
  }
  bottle.uses = pagesLeft;
  log(d, `${me.name} writes ${n} page${n > 1 ? 's' : ''}${what.trim() ? ` (${what.trim()})` : ''} in ${formatDuration(n * 10)}: about ${n * 250} words, ${note}.`);
}

/**
 * Table rule: an evening's performance at an inn, tavern or market square (2 hours, in a settlement). Charisma
 * (Performance), or Charisma with an instrument. Coin by the total; a good night brings supper and a room, a great one an admirer.
 */
export const perform = act((d, ctx, charId: string, bonus: number) => {
  const c = charById(d, charId);
  if (!c || !alive(c)) return;
  if (!d.place.settlement) return void log(d, `${c.name} needs an audience: performing for coin takes an inn, tavern or market in a settlement.`, 'warn');
  advanceMut(d, ctx, PERFORM_MINUTES, 'work');
  const me = charById(d, charId)!;
  const mod = bonus - 2 * me.exhaustion;
  const r = d20('normal', ctx.rng);
  const total = r.value + mod;
  const t = performTake(total);
  const q = rollExpr(t.dice, ctx.rng) ?? 1;
  gainWealth(me, q * (t.unit === 'gp' ? 1 : t.unit === 'sp' ? 0.1 : 0.01));
  const extras: string[] = [];
  if (t.meal) {
    me.ateLbToday = round2(me.ateLbToday + foodNeedLb(me) / MEALS_PER_DAY);
    me.drankPintsToday = round2(me.drankPintsToday + waterNeedPints(me, false, false) / MEALS_PER_DAY);
    extras.push('a meal');
  }
  if (t.room) {
    me.lodging = { tier: 'comfortable', until: Math.max(me.lodging?.until ?? 0, (d.dayIndex + 1) * MIN_PER_DAY + 12 * 60) };
    extras.push('a comfortable room tonight');
  }
  if (t.admirer) addContactMut(d, { name: `An admirer from ${d.place.name || 'the crowd'}`, role: 'Noble', place: d.place.name, bond: 2, knownBy: [me.id], notes: `Charmed by ${me.name}'s performance.` });
  log(d, `${me.name} performs for two hours (Charisma ${r.value} ${signed(mod)} = ${total}): ${t.text}. ${q} ${t.unit.toUpperCase()}${extras.length ? `, plus ${extras.join(' and ')}` : ''}${t.admirer ? ', and a new allied contact' : ''} (table rule).`, total >= 10 ? 'good' : 'info');
});

/** Table rule: a fair copy of a map someone holds. 1 hour, a sheet of Paper or Parchment, Intelligence with Cartographer's Tools at DC 10. */
export const copyMap = act((d, ctx, charId: string, mapItemId: string, bonus: number) => {
  const c = charById(d, charId);
  const holder = d.characters.find((x) => x.inventory.some((i) => i.id === mapItemId));
  const map = holder?.inventory.find((i) => i.id === mapItemId);
  if (!c || !map) return;
  if (!c.inventory.some((i) => CARTOGRAPHER.test(i.name))) return void log(d, `${c.name} needs Cartographer's Tools to copy a map.`, 'warn');
  const sheet = c.inventory.find((i) => PAPER.test(i.name.trim()) && i.qty > 0);
  if (!sheet) return void log(d, `${c.name} needs a sheet of Paper or Parchment to copy the map onto.`, 'warn');
  advanceMut(d, ctx, COPY_MAP_MINUTES, 'camp');
  const me = charById(d, charId)!;
  const paper = me.inventory.find((i) => i.id === sheet.id)!;
  paper.qty -= 1;
  me.inventory = me.inventory.filter((i) => i.qty > 0);
  const mod = bonus - 2 * me.exhaustion;
  const r = d20('normal', ctx.rng);
  const roll = `Intelligence with Cartographer's Tools ${r.value} ${signed(mod)} = ${r.value + mod} against DC ${COPY_MAP_DC}`;
  if (r.value + mod < COPY_MAP_DC) return void log(d, `${me.name} copies the ${map.name} (${roll}), but a slip of the pen spoils the sheet.`, 'warn');
  addLine(d, me, map.name, 1, { valueGp: map.valueGp ?? ROUTE_MAP_GP, weight: 0 }, null, false);
  log(d, `${me.name} makes a fair copy of the ${map.name} (${roll}): worth ${fmtGp(map.valueGp ?? ROUTE_MAP_GP)} to a guide, trader or caravan master (table rule).`, 'good');
});

/** Table rule: a fair copy of a Book someone carries: 50 sheets of Paper or Parchment and 50 pages of Ink. The copy is worth a Book's price and sells as the copyist's own work. */
export const copyBook = act((d, ctx, charId: string, bookName: string, byScribe: boolean = false) => {
  const c = charById(d, charId);
  if (!c) return;
  // A hired scribe does the copying from the party's paper and ink while the party gets on with other things.
  const now = absNow(d);
  const scribe = byScribe ? d.hirelings.find((h) => h.active && h.role === 'scribe' && !(h.busyUntil && h.busyUntil > now)) : undefined;
  if (byScribe && !scribe) return void log(d, 'No hired scribe is free to copy a Book right now.', 'warn');
  const sheets = c.inventory.filter((i) => PAPER.test(i.name.trim()) && i.qty > 0).reduce((a, i) => a + i.qty, 0);
  if (sheets < BOOK_PAGES) return void log(d, `A fair copy of a Book takes ${BOOK_PAGES} sheets of Paper or Parchment; ${c.name} has ${sheets}.`, 'warn');
  if (!c.inventory.some((i) => INK.test(i.name.trim()) && i.qty > 0) || !c.inventory.some((i) => /ink pen|quill/i.test(i.name))) return void log(d, `${c.name} needs Ink and an Ink Pen to copy a Book.`, 'warn');
  writePagesMut(d, ctx, charId, BOOK_PAGES, `a fair copy of ${bookName || 'a Book'}${scribe ? `, set down by ${scribe.name}` : ''}`, !scribe);
  const me = charById(d, charId)!;
  addLine(d, me, `Book (copy of ${bookName.trim() || 'a Book'})`, 1, { valueGp: BOOK_GP, crafted: true, weight: 5 }, null, false);
  if (scribe) scribe.busyUntil = now + BOOK_PAGES * 10;
  log(d, scribe ? `${scribe.name} copies and binds the Book over the next ${formatDuration(BOOK_PAGES * 10)} while the party is free: worth ${fmtGp(BOOK_GP)}, sold as the party's own work (table rule).` : `${me.name} binds the pages into a Book, worth ${fmtGp(BOOK_GP)} and sold as their own work (table rule).`, 'good');
});

// ---------------------------------------------------------------- learning what magic items do

function addFinding(s: State, it: MagicItem, method: StudyMethod, text: string): void {
  it.findings = [{ id: uid(), stamp: stamp(s), method, text }, ...(it.findings ?? [])];
}

const itemLabel = (it: MagicItem) => (it.identified ? it.name : it.partyName?.trim() || 'the unknown item');

/** Reveals every hidden fact except curses (Identify, or a Short Rest spent studying the item). */
function revealAll(s: State, it: MagicItem, method: StudyMethod): void {
  const before = itemLabel(it);
  const revealed = (it.clues ?? []).filter((c) => !c.known && c.kind !== 'curse');
  for (const c of revealed) c.known = true;
  it.magicKnown = true;
  it.identified = true;
  // Table rule: identifying also reveals rarity, and with it the item's DMG price.
  const worth = it.rarity ? magicItemValue(it.name, it.rarity) : null;
  const value = worth && it.rarity ? ` ${RARITY_LABEL[it.rarity]}: worth about ${fmtGp(worth.gp)} (DMG price${worth.note ? `; ${worth.note}` : ''}).` : ' Its rarity isn’t set yet (DM).';
  addFinding(s, it, method, `Identified as ${it.name}.${revealed.length ? ` Learned: ${revealed.map((c) => c.text).join('; ')}.` : ''}${value}`);
  log(s, `${before !== it.name ? `${before[0].toUpperCase()}${before.slice(1)} turns out to be ${it.name}.` : `${it.name} is identified.`}${value}`, 'good');
}

/** Studying an unknown item: Detect Magic, an Arcana check, or experimenting with it. */
export const studyItem = act((d, ctx, ownerId: string, itemId: string, method: 'detect' | 'arcana' | 'experiment', studierId: string | null, bonus: number) => {
  const owner = charById(d, ownerId);
  const it = owner?.items.find((x) => x.id === itemId);
  if (!owner || !it) return;
  const who = studierId ? actorById(d, studierId) : undefined;
  const label = itemLabel(it);
  if (method === 'detect') {
    advanceMut(d, ctx, 1, 'camp');
    it.magicKnown = true;
    const txt = `${who ? `${who.name}'s ` : ''}Detect Magic shows ${label} has a magical aura${it.school ? ` of ${it.school}` : ''}.`;
    addFinding(d, it, 'detect', txt);
    log(d, txt, 'good');
    return;
  }
  advanceMut(d, ctx, STUDY_MINUTES, 'camp');
  const next = (it.clues ?? []).find((c) => !c.known && c.kind !== 'curse');
  if (method === 'arcana') {
    const dc = ARCANA_DC[it.rarity || 'unknown'];
    const r = d20('normal', ctx.rng);
    const total = r.value + bonus - 2 * (who?.exhaustion ?? 0);
    if (total < dc) {
      const txt = `${who?.name ?? 'Someone'} studies ${label}: Intelligence (Arcana) ${r.value} ${signed(bonus)} = ${total} against DC ${dc}. They can't make sense of it.`;
      addFinding(d, it, 'arcana', txt);
      log(d, txt, 'warn');
      return;
    }
    if (!next) {
      const txt = `${who?.name ?? 'Someone'} studies ${label} (Arcana ${total} against DC ${dc}) but learns nothing new.`;
      addFinding(d, it, 'arcana', txt);
      log(d, txt);
      return;
    }
    next.known = true;
    const txt = `${who?.name ?? 'Someone'} studies ${label} (Arcana ${total} against DC ${dc}) and works out: ${next.text}.`;
    addFinding(d, it, 'arcana', txt);
    log(d, txt, 'good');
  } else {
    if (!next) {
      const txt = `${who?.name ?? 'Someone'} experiments with ${label} but discovers nothing new.`;
      addFinding(d, it, 'experiment', txt);
      log(d, txt);
      return;
    }
    next.known = true;
    const txt = `${who?.name ?? 'Someone'} experiments with ${label} and discovers: ${next.text}.`;
    addFinding(d, it, 'experiment', txt);
    log(d, txt, 'good');
  }
  if ((it.clues ?? []).every((c) => c.known || c.kind === 'curse') && (it.clues ?? []).length) revealAll(d, it, method);
});

/** The DM reveals or hides a single fact by hand. */
export const setClueKnown = act((d, _ctx, ownerId: string, itemId: string, clueId: string, known: boolean) => {
  const it = charById(d, ownerId)?.items.find((x) => x.id === itemId);
  const c = it?.clues?.find((x) => x.id === clueId);
  if (!it || !c) return;
  c.known = known;
  if (known) addFinding(d, it, 'dm', `Learned: ${c.text}.`);
});

// ---------------------------------------------------------------- carried weight

export interface Load {
  gear: number;
  food: number;
  water: number;
  coins: number;
  magic: number;
  total: number;
  capacity: number;
  level: LoadLevel;
}

/** Everything a character carries, in pounds, with the estimate broken down. */
export function carriedLoad(s: State, c: Character): Load {
  // Things packed in a weightless container (Bag of Holding and the like) don't count, but the container does.
  const weightless = new Set(c.inventory.filter((i) => i.container?.weightless).map((i) => i.id));
  const gear = c.inventory.filter((i) => !(i.containerId && weightless.has(i.containerId))).reduce((a, i) => a + i.weight * i.qty, 0);
  // Rations weigh 2 lb per day; a day of animal feed weighs 10 lb.
  const food = c.kind === 'mount' ? (c.rationsLb / Math.max(0.25, foodNeedLb(c))) * FEED_LB_PER_DAY : c.rationsLb * RATION_WEIGHT;
  const skins = c.waterCapacityPints > 0 ? Math.ceil(c.waterCapacityPints / 4) : 0;
  const water = c.waterPints + skins; // a pint of water weighs about a pound; each empty skin about a pound
  const coins = s.settings.coinWeight ? coinCount(c.purse) / COINS_PER_LB : 0;
  const listed = new Set(c.inventory.map((i) => i.name.toLowerCase()));
  // Magic items count once: skip any that also appear in the pasted inventory.
  const magic = c.items.filter((it) => !listed.has(it.name.toLowerCase()) && !listed.has((it.partyName ?? '').toLowerCase())).reduce((a, it) => a + estimateWeight(it.name).weight, 0);
  const total = Math.round((gear + food + water + coins + magic) * 10) / 10;
  const capacity = c.carryCapacity ?? carryingCapacity(c.strScore, c.size);
  return { gear, food, water, coins, magic, total, capacity, level: s.settings.encumbrance ? loadLevel(total, capacity, c.kind === 'mount' ? 0 : c.strScore, s.settings.variantEncumbrance) : 'light' };
}

export const addInventory = act((d, _ctx, charId: string, text: string) => {
  const c = charById(d, charId);
  if (!c) return;
  const parsed = parseInventory(text);
  const notes: string[] = [];
  for (const p of parsed) notes.push(...stowItem(d, c, p.name, p.qty, p, true));
  if (parsed.length) log(d, `${c.name}'s inventory: added ${parsed.length} line(s), ${parsed.filter((p) => p.source === 'guess').length} with guessed weights.${notes.length ? ` ${notes.join(' ')}` : ''}`);
});

/**
 * Puts an item in a character's inventory. An equipment pack is opened into its contents (2024 PHB), packed in its
 * Backpack. With `supplies`, Rations and Waterskins go to the food and water trackers instead of the item list.
 * A Bedroll or Blanket ticks the character's cold-night cover. Returns notes for the log.
 */
function stowItem(s: State, c: Character, name: string, qty: number, extra: Partial<InventoryItem> = {}, supplies = false, inside: string | null = null): string[] {
  const notes: string[] = [];
  const pack = packNamed(name);
  if (pack) {
    for (let n = 0; n < qty; n++) {
      const bag = PACKS[pack].find((x) => /^backpack$/i.test(x.name)) ? addLine(s, c, 'Backpack', 1, {}, null, true) : null;
      for (const x of PACKS[pack]) if (!/^backpack$/i.test(x.name)) notes.push(...stowItem(s, c, x.name, x.qty, {}, supplies, bag?.id ?? null));
    }
    notes.unshift(`Opened ${qty > 1 ? `${qty} × ` : ''}${pack} into its contents.`);
    return notes;
  }
  if (/^bedroll/i.test(name) && !c.bedroll) ((c.bedroll = true), notes.push(`${c.name} now has a Bedroll for cold nights.`));
  if (/^blanket/i.test(name) && !c.blanket) ((c.blanket = true), notes.push(`${c.name} now has a Blanket for cold nights.`));
  if (supplies && c.kind !== 'mount' && RATIONS.test(name.trim())) {
    c.rationsLb = Math.round((c.rationsLb + qty * foodNeedLb(c)) * 100) / 100;
    notes.push(`${qty} day${qty > 1 ? 's' : ''} of Rations go to ${c.name}'s food.`);
    return notes;
  }
  if (supplies && c.kind !== 'mount' && WATERSKIN.test(name.trim())) {
    c.waterCapacityPints += qty * WATERSKIN_PINTS;
    c.waterPints += qty * WATERSKIN_PINTS;
    notes.push(`${qty > 1 ? `${qty} full Waterskins go` : 'A full Waterskin goes'} to ${c.name}'s water.`);
    return notes;
  }
  addLine(s, c, name, qty, extra, inside, false);
  return notes;
}

function addLine(_s: State, c: Character, name: string, qty: number, extra: Partial<InventoryItem>, inside: string | null, fresh: boolean): InventoryItem {
  const same = !fresh && c.inventory.find((i) => sameStack(i, { name, valueGp: extra.valueGp }) && !!i.crafted === !!extra.crafted && (i.containerId ?? null) === inside && !i.scattered && !i.damaged);
  if (same) {
    same.qty += qty;
    return same;
  }
  const est = estimateWeight(name);
  const it: InventoryItem = { id: uid(), name, qty, weight: est.weight, source: est.source, ...extra, containerId: inside, container: detectContainer(name), ammo: isAmmo(name) ? { spent: 0 } : null };
  c.inventory.push(it);
  return it;
}

/** Moves Rations and Waterskins listed in the inventory (from D&D Beyond, say) to the food and water trackers. */
export const suppliesToTrackers = act((d, _ctx, charId: string) => {
  const c = charById(d, charId);
  if (!c || c.kind === 'mount') return;
  const notes: string[] = [];
  for (const it of [...c.inventory]) {
    if (!RATIONS.test(it.name.trim()) && !WATERSKIN.test(it.name.trim())) continue;
    c.inventory = c.inventory.filter((x) => x.id !== it.id);
    notes.push(...stowItem(d, c, it.name, it.qty, {}, true));
  }
  log(d, notes.length ? notes.join(' ') : `${c.name} has no Rations or Waterskins listed in the inventory.`, notes.length ? 'good' : 'info');
});

// ---------------------------------------------------------------- suffocation

/** Out of breath: 1 Exhaustion level at the end of each turn without air. */
export const suffocate = act((d, _ctx, charId: string, turns: number) => {
  const c = charById(d, charId);
  if (!c || turns <= 0) return;
  gainExhaustion(d, c, Math.min(turns, 6), `suffocating for ${turns} turn${turns > 1 ? 's' : ''}, ${SUFFOCATION_NOTE}`, 'suffocation');
});

/** Breathing again removes every Exhaustion level gained from suffocating. */
export const breatheAgain = act((d, _ctx, charId: string) => {
  const c = charById(d, charId);
  if (!c) return;
  const causes = causesOf(c);
  const kept = causes.filter((x) => x !== 'suffocation');
  const removed = causes.length - kept.length;
  if (!removed) return;
  c.exhaustionCauses = kept;
  c.exhaustion = kept.length;
  status(d, c, 'exhaustionEases', `${c.name} can breathe again, and the ${removed} Exhaustion level${removed > 1 ? 's' : ''} from suffocating go away.`, 'good');
});

// ---------------------------------------------------------------- coins, containers, stashes

/** Is this ammunition (arrows, bolts, sling bullets, needles, firearm bullets)? */
export const isAmmo = (name: string): boolean => /\b(arrows?|bolts?|sling bullets?|blowgun needles?|needles?|firearm bullets?|bullets?)\b/i.test(name) && !/case|quiver|pouch/i.test(name);

export const setPurse = act((d, _ctx, charId: string, purse: Purse) => {
  const c = charById(d, charId);
  if (!c) return;
  c.purse = purse;
  c.gp = purseValue(purse);
});

/** Swaps coins at a moneychanger (table-rule fee). */
export const exchangeCoins = act((d, _ctx, charId: string, from: Denom, to: Denom, count: number) => {
  const c = charById(d, charId);
  if (!c) return;
  const r = exchange(c.purse, from, to, count, d.settings.moneychangerFee);
  if (!r) {
    log(d, `${c.name} doesn't have ${count} ${from} to exchange.`, 'warn');
    return;
  }
  c.purse = r.purse;
  c.gp = Math.round((c.gp - r.fee) * 100) / 100;
  log(d, `${c.name} exchanges ${count} ${from} for ${r.received} ${to}${r.fee ? ` (fee ${fmtGp(r.fee)})` : ''}.`);
});

/** Who holds something: a character ("c:id") or a stash or vehicle ("s:id"). */
export type Holder = string;

function holderOf(s: State, ref: Holder): { name: string; items: InventoryItem[]; purse: Purse; char?: Character; stash?: Stash } | null {
  if (ref.startsWith('c:')) {
    const c = charById(s, ref.slice(2));
    return c ? { name: c.name, items: c.inventory, purse: c.purse, char: c } : null;
  }
  const st = s.stashes.find((x) => `s:${x.id}` === ref);
  return st ? { name: st.name, items: st.items, purse: st.purse, stash: st } : null;
}

/** Moves items (and anything packed inside them) between characters, stashes and vehicles. */
export const moveItem = act((d, _ctx, from: Holder, to: Holder, itemId: string, qty: number) => {
  const a = holderOf(d, from);
  const b = holderOf(d, to);
  if (!a || !b || from === to) return;
  const it = a.items.find((i) => i.id === itemId);
  if (!it || qty <= 0) return;
  const n = Math.min(qty, it.qty);
  const contents = it.container ? a.items.filter((i) => i.containerId === it.id) : [];
  if (n === it.qty) {
    a.items.splice(a.items.indexOf(it), 1);
    b.items.push({ ...it, containerId: null });
    for (const x of contents) {
      a.items.splice(a.items.indexOf(x), 1);
      b.items.push(x);
    }
  } else {
    it.qty -= n;
    const same = b.items.find((i) => sameStack(i, it) && !i.containerId);
    if (same) same.qty += n;
    else b.items.push({ ...it, id: uid(), qty: n, containerId: null, ammo: it.ammo ? { spent: 0 } : null });
  }
  log(d, `${n} × ${it.name}${contents.length ? ` (with ${contents.length} item${contents.length > 1 ? 's' : ''} inside)` : ''} moved from ${a.name} to ${b.name}.`);
});

/** Moves coins between purses (depositing in a vault, loading a strongbox on the wagon). */
export const moveCoins = act((d, _ctx, from: Holder, to: Holder, denom: Denom, count: number) => {
  const a = holderOf(d, from);
  const b = holderOf(d, to);
  if (!a || !b || from === to || count <= 0) return;
  const n = Math.min(count, a.purse[denom]);
  if (!n) return;
  a.purse[denom] -= n;
  b.purse[denom] += n;
  if (a.char) a.char.gp = Math.round((a.char.gp - n * COIN_GP[denom]) * 100) / 100;
  if (b.char) b.char.gp = Math.round((b.char.gp + n * COIN_GP[denom]) * 100) / 100;
  log(d, `${n} ${denom} moved from ${a.name} to ${b.name}.`);
});

export const createStash = act((d, _ctx, name: string, kind: Stash['kind'], location: string, capacityLb: number | null, speedMph?: number) => {
  d.stashes.push({ id: uid(), name, kind, location, capacityLb, items: [], purse: emptyPurse(), notes: '', speedMph });
  log(d, `New ${kind === 'vehicle' ? 'vehicle' : kind === 'bank' ? 'bank vault' : 'stash'}: ${name}${location ? `, at ${location}` : ''}.`);
});

/** Weight stored in a stash or vehicle. */
export function stashLoad(st: Stash, coinWeight: boolean): number {
  const weightless = new Set(st.items.filter((i) => i.container?.weightless).map((i) => i.id));
  const gear = st.items.filter((i) => !(i.containerId && weightless.has(i.containerId))).reduce((a, i) => a + i.weight * i.qty, 0);
  return Math.round((gear + (coinWeight ? coinCount(st.purse) / COINS_PER_LB : 0)) * 10) / 10;
}

/** What a container holds, by weight (weightless containers still have a limit). */
export function containerLoad(items: InventoryItem[], containerId: string): number {
  return Math.round(items.filter((i) => i.containerId === containerId).reduce((a, i) => a + i.weight * i.qty, 0) * 10) / 10;
}

/** What the coins and items are worth as far as the party knows (items of unknown value count as nothing). */
export const holderValue = (items: InventoryItem[], purse: Purse): number => Math.round((purseValue(purse) + items.reduce((a, i) => a + (knownValue(i) ?? 0) * i.qty, 0)) * 100) / 100;

// ---------------------------------------------------------------- appraisal

export type { AppraiseMethod } from '../rules/appraise';

/** Someone who can appraise: a character, or an active appraiser hireling (who brings their own tools and bonus). */
function appraiserOf(d: State, id: string): { id: string; name: string; tools: boolean; bonus: number | null; exhaustion: number } | undefined {
  if (id.startsWith('h:')) {
    const h = d.hirelings.find((x) => `h:${x.id}` === id && x.active);
    return h ? { id, name: `${h.name} (hireling)`, tools: h.role === 'appraiser', bonus: h.bonus, exhaustion: 0 } : undefined;
  }
  const c = charById(d, id);
  return c ? { id, name: c.name, tools: c.inventory.some((i) => JEWELER_TOOLS.test(i.name)), bonus: null, exhaustion: c.exhaustion ?? 0 } : undefined;
}

/** A rest gives everyone a fresh try at appraising (optional one-try rule). */
function clearAppraiseTries(d: State): void {
  for (const c of d.characters) for (const i of c.inventory) delete i.appraiseTried;
}

/**
 * Learning what an item of unknown value is worth (or re-checking a value the party may have misjudged).
 * - tools: Jeweler's Tools discern a gem's value, Intelligence DC 15 (2024 PHB); jewelry too under the crafts table rule.
 * - eye: art by Intelligence (History) at DC 15 (crafts table rule), anything else by eye at DC 20 (table rule).
 * - merchant: a merchant in a settlement names a price (table rule). dm: the DM simply says.
 * Advantage when proficient in both a skill and a tool that apply (2024 PHB). `trueGp` records the DM's value if none was set.
 */
export const appraiseItem = act((d, ctx, ownerId: string, itemId: string, method: AppraiseMethod, appraiserId: string | null, bonus: number, trueGp?: number, advantage = false) => {
  const c = charById(d, ownerId);
  const it = c?.inventory.find((i) => i.id === itemId);
  if (!c || !it || !valueSecret(it)) return;
  const st = d.settings;
  if (trueGp != null && trueGp > 0 && it.valueGp == null) {
    it.valueGp = trueGp;
    it.valueHidden = true;
  }
  const each = it.qty > 1 ? ' each' : '';
  const reveal = (how: string) => {
    if (it.valueGp == null) return void log(d, `${how}, but no value has been set for the ${it.name}. DM: enter what it's worth.`, 'warn');
    const was = it.valueBelieved;
    delete it.valueHidden;
    delete it.valueBelieved;
    delete it.appraiseTried;
    log(d, `${how}: the ${it.name} is worth ${fmtGp(it.valueGp)}${each}${was != null && was !== it.valueGp ? `, not the ${fmtGp(was)} the party thought` : ''}.`, 'good');
  };
  if (method === 'dm') return reveal('The DM reveals it');
  if (method === 'merchant') {
    if (!d.place.settlement) return void log(d, `There's no merchant out here to value the ${it.name}. Find a town or city.`, 'warn');
    return reveal('A merchant turns it over and names a price');
  }
  const who = appraiserId ? appraiserOf(d, appraiserId) : undefined;
  if (!who) return;
  const check = appraiseCheck(it.name, method, st);
  if (!check.ok) return void log(d, `${check.why}. For the ${it.name}, try another way, ask a merchant, or the DM.`, 'warn');
  if (method === 'tools' && !who.tools) return void log(d, `${who.name} needs Jeweler's Tools to appraise the ${it.name}.`, 'warn');
  if (st.appraiseOneTry && it.appraiseTried?.includes(who.id)) return void log(d, `${who.name} has already tried to value the ${it.name}. They need a rest before trying again (table rule), or someone else can try.`, 'warn');
  if (st.appraiseTime) advanceMut(d, ctx, APPRAISE_MINUTES, 'camp');
  const mod = who.bonus ?? bonus;
  // 2024 PHB: a Magnifying Glass gives Advantage on checks to appraise or inspect a highly detailed item.
  const glass = !who.id.startsWith('h:') && !!charById(d, who.id)?.inventory.some((i) => MAGNIFYING_GLASS.test(i.name));
  const mode = (advantage && check.canAdvantage) || glass ? 'advantage' : 'normal';
  const r = d20(mode, ctx.rng);
  const total = r.value + mod - 2 * who.exhaustion;
  const secret = st.appraiseMisjudge;
  const roll = secret ? '' : ` (${check.label}${glass ? ', with a Magnifying Glass' : ''}: ${r.rolls.join('/')}${mode === 'advantage' ? ' with Advantage' : ''} ${signed(mod)}${who.exhaustion ? ` −${2 * who.exhaustion} Exhaustion` : ''} = ${total} against DC ${check.dc})`;
  const studies = method === 'tools' ? `${who.name} studies the ${it.name} through a loupe${roll}` : `${who.name} looks the ${it.name} over carefully${roll}`;
  if (total >= check.dc) return reveal(`${studies} and judges its worth`);
  if (secret && total <= check.dc - 5 && it.valueGp != null) {
    const guess = misjudgedValue(it.valueGp, valuableKind(it.name), ctx.rng() >= 0.5);
    it.valueHidden = true;
    it.valueBelieved = guess;
    delete it.appraiseTried;
    // Reads exactly like a success: the party can't tell.
    return void log(d, `${studies} and judges its worth: the ${it.name} is worth ${fmtGp(guess)}${each}.`, 'good');
  }
  if (st.appraiseOneTry) it.appraiseTried = [...(it.appraiseTried ?? []), who.id];
  log(d, `${studies} and can't tell ${method === 'tools' ? 'a fine stone from a flawed one' : 'what it would fetch'}.`, 'warn');
});


// ---------------------------------------------------------------- ammunition and crafted goods

/** Fires (or throws) ammunition: the count drops and the spent ones can be looked for after the fight. */
export const fireAmmo = act((d, _ctx, charId: string, itemId: string, n: number) => {
  const c = charById(d, charId);
  const it = c?.inventory.find((i) => i.id === itemId);
  if (!c || !it || n <= 0) return;
  const shot = Math.min(n, it.qty);
  it.qty -= shot;
  it.ammo = { spent: (it.ammo?.spent ?? 0) + shot };
  if (it.qty === 0) log(d, `${c.name} is out of ${it.name}!`, 'warn');
});

/**
 * After a fight, a minute of searching recovers half the spent ammunition, rounded down (2024 PHB). Table rule: each
 * searcher also rolls Wisdom (Perception or Survival, whichever is better) at DC 10: a success finds three quarters,
 * beating it by 5 nine in ten.
 */
export const recoverAmmo = act((d, ctx, charIds: string[], search: boolean = true) => {
  const lines: string[] = [];
  for (const id of charIds) {
    const c = charById(d, id);
    if (!c) continue;
    const spentAny = c.inventory.some((it) => (it.ammo?.spent ?? 0) > 0);
    if (!spentAny) continue;
    let total: number | null = null;
    let how = '';
    if (search && alive(c)) {
      const bonus = Math.max(c.survival, c.passivePerception - 10) - 2 * c.exhaustion;
      const r = d20('normal', ctx.rng);
      total = r.value + bonus;
      how = ` (Wisdom ${r.value} ${signed(bonus)} = ${total} against DC ${AMMO_SEARCH_DC})`;
    }
    for (const it of c.inventory) {
      const spent = it.ammo?.spent ?? 0;
      if (!spent) continue;
      const back = ammoRecovered(spent, total);
      it.qty += back;
      it.ammo = { spent: 0 };
      lines.push(`${c.name} recovers ${back} of ${spent} ${it.name} (${it.qty} now)${how}`);
      how = '';
    }
  }
  if (!lines.length) return;
  advanceMut(d, ctx, 1, 'camp');
  log(d, `After a minute of searching the area: ${lines.join('; ')}.`, 'good');
});

/** A finished crafting project puts what was made into the first crafter's hands. */
function deliverProduct(s: State, p: Project): void {
  if (!p.product) return;
  const c = charById(s, p.charIds[0]) ?? s.characters.find((x) => x.kind !== 'mount');
  if (!c) return;
  const { name, qty, magic, valueGp } = p.product;
  if (magic) {
    c.items.push({ id: uid(), name, requiresAttunement: false, attuned: false, identified: true, charges: null, maxCharges: null, regain: 'all', regainAt: 'never', awaySince: null, notes: 'Crafted', magicKnown: true, clues: [], findings: [] });
  } else {
    const crafted = p.kind !== 'buyMagic' && p.kind !== 'sellMagic' ? { crafted: true } : {};
    const notes = stowItem(s, c, name, qty, { ...(valueGp != null ? { valueGp } : {}), ...crafted }, true);
    if (notes.length) log(s, notes.join(' '));
  }
  log(s, `${c.name} now has ${qty > 1 ? `${qty} × ` : ''}${name}${magic ? ' (with their magic items)' : ' (in their inventory)'}.`, 'good');
}

// ---------------------------------------------------------------- D&D Beyond import

export interface DdbParts {
  stats: boolean;
  inventory: boolean;
  spells: boolean;
  resources: boolean;
  conditions: boolean;
}

/** Imports or re-syncs a character from D&D Beyond, keeping everything the tracker owns (food, water, knowledge, history). */
export const importDdb = act((d, _ctx, imp: DdbImport, parts: DdbParts) => {
  let c = d.characters.find((x) => x.ddbId === imp.ddbId && imp.ddbId) ?? d.characters.find((x) => x.name.toLowerCase() === imp.name.toLowerCase() && x.kind !== 'mount');
  const isNew = !c;
  if (!c) {
    c = newCharacter({ name: imp.name, className: imp.className, level: imp.level, tasks: [] });
    d.characters.push(c);
  }
  c.ddbId = imp.ddbId || undefined;
  c.ddbSyncedAt = stamp(d);
  c.name = imp.name;
  if (parts.stats) {
    Object.assign(c, {
      className: imp.className,
      level: imp.level,
      size: imp.size,
      strScore: imp.strScore,
      conScore: imp.conScore,
      conSave: imp.conSave,
      wisMod: imp.wisMod,
      survival: imp.survival,
      passivePerception: imp.passivePerception,
      darkvision: imp.darkvision,
      coldResist: imp.coldResist,
      fireResist: imp.fireResist,
      maxHp: imp.maxHp,
      hp: imp.hp,
      tempHp: imp.tempHp,
      hitDie: imp.hitDie,
      hitDiceSpent: imp.hitDiceSpent,
      species: imp.species || c.species,
      subclass: imp.subclass || c.subclass,
      feats: imp.feats.length ? imp.feats : c.feats,
      chef: imp.feats.length ? imp.feats.some((f) => /^chef\b/i.test(f)) : c.chef,
      features: imp.features.length ? imp.features : c.features,
      toolProfs: imp.toolProfs,
      skillProfs: imp.skillProfs,
      // Keep arms learned in downtime here even if D&D Beyond doesn't list them yet.
      armsProfs: [...new Set([...(c.armsProfs ?? []), ...(imp.armsProfs ?? [])])],
      abilities: { str: imp.stats.strength, dex: imp.stats.dexterity, con: imp.stats.constitution, int: imp.stats.intelligence, wis: imp.stats.wisdom, cha: imp.stats.charisma },
    });
  }
  if (parts.inventory) {
    // Replace what came from D&D Beyond last time; keep anything added by hand in the tracker.
    const keepSpent = new Map(c.inventory.filter((i) => i.ammo).map((i) => [i.id, i.ammo!.spent]));
    c.inventory = [...c.inventory.filter((i) => !i.id.startsWith('ddb-')), ...imp.inventory.map((i) => (i.ammo ? { ...i, ammo: { spent: keepSpent.get(i.id) ?? 0 } } : i))];
    c.purse = imp.purse;
    c.gp = purseValue(imp.purse);
    for (const m of imp.items) {
      const old = c.items.find((x) => x.id === m.id || (x.name.toLowerCase() === m.name.toLowerCase() && !x.id.startsWith('ddbm-')));
      if (old) Object.assign(old, { ...m, id: old.id, clues: old.clues, findings: old.findings, partyName: old.partyName, identified: old.identified || m.identified });
      else c.items.push(m);
    }
  }
  if (parts.spells) {
    const known = new Map(c.spells.map((sp) => [sp.name.toLowerCase(), sp]));
    c.spells = imp.spells.map((sp) => ({ ...known.get(sp.name.toLowerCase()), ...sp }));
  }
  if (parts.resources) {
    c.resources = [...c.resources.filter((r) => !r.id.startsWith('ddb-')), ...imp.resources];
  }
  if (parts.conditions) {
    if (imp.exhaustion !== c.exhaustion) {
      c.exhaustion = imp.exhaustion;
      c.exhaustionCauses = causesOf(c);
    }
    if (c.hp === 0 && imp.deathSaves.stable) Object.assign(c, { dying: false, stable: true });
    else if (c.hp === 0) Object.assign(c, { dying: true, deathSuccesses: imp.deathSaves.successes, deathFailures: imp.deathSaves.failures });
  }
  if (isNew && isCaster(c.className)) c.tasks = [{ id: uid(), label: 'Prepare spells', done: false, daily: true }, ...c.tasks];
  log(
    d,
    `${isNew ? 'Imported' : 'Synced'} ${c.name} from D&D Beyond: ${[
      parts.stats && `${imp.className} ${imp.level}, ${imp.hp}/${imp.maxHp} HP`,
      parts.inventory && `${imp.inventory.length} inventory lines, ${imp.items.length} magic items, ${fmtPurse(imp.purse)}`,
      parts.spells && `${imp.spells.length} spells`,
      parts.resources && `${imp.resources.length} limited uses and slots`,
    ]
      .filter(Boolean)
      .join('; ')}.${imp.warnings.length ? ` Note: ${imp.warnings.join(' ')}` : ''}`,
    'good',
  );
});

// ---------------------------------------------------------------- hazards, walls, gifts

/** Deep water: after each hour of swimming, a DC 10 Con save or 1 Exhaustion level (unless it has a Swim Speed). */
export const deepWater = act((d, ctx, charId: string, hours: number) => {
  const c = charById(d, charId);
  if (!c) return;
  log(d, `${c.name} swims through deep water for ${hours} hour(s)${c.swimSpeed ? ', untroubled thanks to their Swim Speed' : ''}.`);
  for (let h = 0; h < hours; h++) {
    advanceMut(d, ctx, 60, 'camp');
    if (!c.swimSpeed && alive(c)) requestSave(d, ctx, c, 'deepWater', 10, 'normal', `deep water (hour ${h + 1})`);
  }
});

/** Thin ice: rolls how much weight a 10-foot square holds. */
export const thinIce = act((d, ctx, weightLb: number) => {
  const holds = rollDice(3, 10, ctx.rng) * 10;
  const breaks = weightLb > holds;
  log(d, `The ice here holds ${holds} lb per 10-foot square, and ${weightLb} lb is on it. ${breaks ? 'It cracks and gives way: everyone on it falls into frigid water!' : 'It holds.'}`, breaks ? 'bad' : 'good');
});

/** A save against a hazard, with damage rolled and applied on a failure (or half on a success where the hazard allows it). */
export const hazardSave = act((d, ctx, charId: string, id: HazardId, bonus: number) => {
  const c = charById(d, charId);
  const hz = HAZARDS[id];
  if (!c || !hz.save) return;
  const r = d20('normal', ctx.rng);
  const total = r.value + bonus - 2 * c.exhaustion;
  const ok = total >= hz.save.dc;
  let dmgTxt = '';
  if (hz.save.damage) {
    const dmg = rollExpr(hz.save.damage, ctx.rng) ?? 0;
    const taken = ok ? (hz.save.halfOnSave ? Math.floor(dmg / 2) : 0) : dmg;
    if (taken > 0) {
      dmgTxt = ` Takes ${taken} ${hz.save.damageType} damage.`;
      Object.assign(d, changeHp(d, ctx, c.id, -taken));
    }
  }
  log(d, `${c.name} vs ${hz.name}: ${hz.save.ability} save ${r.value} ${signed(bonus - 2 * c.exhaustion)} = ${total} against DC ${hz.save.dc}. ${ok ? 'Success.' : `Failure: ${c.name} ${hz.save.onFail}.`}${dmgTxt}`, ok ? 'good' : 'warn');
});

/** Bastion defensive walls: 250 GP and 10 days per 5-foot square. */
export const buildWalls = act((d, _ctx, bastionId: string, squares: number) => {
  const b = d.bastions.find((x) => x.id === bastionId);
  if (!b || squares <= 0) return;
  const days = squares * 10;
  const gp = squares * 250;
  b.facilities.push({ id: uid(), name: `Defensive walls (${squares} squares)`, kind: 'basic', size: 'cramped', order: 'Maintain', orderNote: '', built: false, building: { what: `Defensive walls (${squares} five-foot squares)`, daysLeft: days, totalDays: days, costGp: gp, toSize: 'cramped' } });
  b.goldSpent += gp;
  payGold(d, [b.ownerId], gp, `${squares} squares of defensive wall`);
  log(d, `${b.name}: work starts on ${squares} squares of defensive wall (${gp.toLocaleString()} GP, ${days} days).`);
});

/** A supernatural gift or curse: a lasting effect on the character, and limited uses for a Charm. */
export const grantGift = act((d, _ctx, charId: string, type: GiftType, name: string, uses: number, notes: string) => {
  grantGiftMut(d, charId, type, name, uses, notes);
});

/** Adds a supernatural gift or curse as a long effect (Charms also get limited uses); returns the effect id. */
function grantGiftMut(d: State, charId: string, type: GiftType, name: string, uses: number, notes: string): string | null {
  const c = charById(d, charId);
  if (!c || !name.trim()) return null;
  const id = uid();
  d.effects.push({ id, name: `${type}: ${name}`, kind: type === 'Curse' ? 'curse' : 'gift', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(d), endsAt: null, notes });
  if (type === 'Charm' && uses > 0) c.resources.push({ id: uid(), name: `Charm: ${name}`, max: uses, current: uses, recharge: 'manual' });
  log(d, `${c.name} ${type === 'Curse' ? 'is cursed' : 'receives a supernatural gift'}: ${type} of ${name}${type === 'Charm' && uses ? ` (${uses} use${uses > 1 ? 's' : ''})` : ''}.`, type === 'Curse' ? 'bad' : 'good');
  return id;
}

// ---------------------------------------------------------------- random encounters

/** Creatures available to the random encounter tables: the SRD list plus any imported bestiary entries with a CR and environment. */
export function encounterPool(s: State): EncounterCreature[] {
  const byName = new Map<string, EncounterCreature>();
  if (s.settings.srdEncounters) for (const c of SRD_POOL) byName.set(c.name.toLowerCase(), c);
  const off = new Set(s.encounterSourcesOff);
  for (const src of s.settings.encounterBooks) if (!off.has(src)) for (const c of BOOK_POOL[src] ?? []) byName.set(c.name.toLowerCase(), c);
  for (const c of s.bestiary) {
    if (!c.cr || !c.env?.length || off.has(c.source ?? '?')) continue;
    byName.set(c.name.toLowerCase(), { name: c.name, cr: c.cr, size: c.size, type: c.type.toLowerCase(), align: c.align ?? 'N', env: c.env, source: c.source, flags: c.flags });
  }
  const out = new Set(s.encounterExclude.map((n) => n.toLowerCase()));
  return [...byName.values()].filter((c) => !out.has(c.name.toLowerCase()));
}

/** Party level (average, rounded) and size, from the living player characters. */
export function encounterParty(s: State): Party {
  const pcs = s.characters.filter((c) => c.kind !== 'mount' && alive(c));
  if (!pcs.length) return { level: 1, size: 1 };
  return { level: Math.max(1, Math.min(20, Math.round(pcs.reduce((a, c) => a + c.level, 0) / pcs.length))), size: pcs.length };
}

export function encounterTable(s: State, terrain: TerrainType = s.place.terrain, danger: Danger = s.place.danger): EncounterTable {
  return buildTable(encounterPool(s), terrain, danger, encounterParty(s));
}

const isNight = (s: State): boolean => lightAt(s.minutes % MIN_PER_DAY, seasonOf(s)).phase === 'Night';
const isUnderground = (s: State): boolean => !!CLIMATES[s.weather.climate].noWeather || s.place.terrain === 'underdark';

/** The conditions that shift the encounter check right now. */
export function encounterConditions(s: State, activity: CheckConditions['activity']): CheckConditions {
  const now = absNow(s);
  const lightOn = s.fire.lit || s.effects.some((e) => e.kind === 'light' && e.pausedLeft == null && (e.endsAt == null || e.endsAt > now));
  const shelterSpell = s.effects.some((e) => e.shelter && (e.endsAt == null || e.endsAt > now));
  return {
    activity,
    night: isNight(s),
    lightAtNight: lightOn,
    pace: s.travel.pace,
    goodRoad: s.place.onRoute && s.place.goodRoad,
    foulWeather: s.weather.precip === 'heavy' || s.weather.wind === 'strong',
    sheltered: s.place.shelter === 'building' || s.place.shelter === 'cave' || shelterSpell,
    underground: isUnderground(s),
    bigGroup: s.characters.filter(alive).length + s.hirelings.length > 6,
  };
}

/** Accumulates overland time and rolls a check each time the danger level's interval passes. */
function overlandEncounterClock(s: State, ctx: Ctx, step: number, activity: Activity): void {
  const every = DANGER[s.place.danger].everyHours * 60;
  s.encounterClock = Math.min(s.encounterClock, every) + step;
  while (s.encounterClock >= every) {
    s.encounterClock -= every;
    encounterCheck(s, ctx, activity === 'rest' ? 'rest' : activity === 'travel' ? 'travel' : 'camp', false);
  }
}

/** Who is on watch right now, if the party is in a Long Rest. */
function onWatchNow(s: State): Character[] {
  if (s.restStart == null) return [];
  const len = watchMinutes(s.watchPlan.count);
  const slot = Math.min(s.watchPlan.count - 1, Math.max(0, Math.floor((absNow(s) - s.restStart) / len)));
  return (s.watchPlan.slots[slot] ?? []).map((id) => actorById(s, id)).filter((c): c is Character => !!c && alive(c));
}

/** One random encounter check: d20 plus the conditions, against the danger level's number. Returns true on an encounter. */
export function encounterCheck(s: State, ctx: Ctx, activity: CheckConditions['activity'], announce: boolean): boolean {
  const info = DANGER[s.place.danger];
  const mods = checkModifiers(encounterConditions(s, activity));
  const mod = mods.reduce((a, m) => a + m.value, 0);
  const r = die(20, ctx.rng);
  const total = r + mod;
  const detail = `d20 ${r}${mod ? ` ${signed(mod)} (${mods.map((m) => `${m.label} ${signed(m.value)}`).join(', ')}) = ${total}` : ''}, encounter on ${info.on}+ or a natural 20 (${info.label} danger)`;
  if (total < info.on && r < 20) {
    if (announce) log(s, `Random encounter check: ${detail}. Nothing comes.`);
    return false;
  }
  resolveEncounter(s, ctx, activity, detail);
  return true;
}

const ACTIVITY_WHEN: Record<CheckConditions['activity'], string> = { travel: 'on the road', camp: 'in camp', rest: 'during the Long Rest', explore: 'while exploring' };

/** Rolls on the location's table and logs what turns up, with what the characters notice first. */
/** Table rule: a creature's Stealth bonus estimated from its challenge rating (proficiency plus a typical Dexterity). */
export function estimatedStealth(cr: string): number {
  const n = cr.includes('/') ? 0 : Number(cr) || 0;
  return n >= 17 ? 6 : n >= 11 ? 5 : n >= 5 ? 4 : n >= 2 ? 3 : 2;
}

/**
 * Who notices whom (2024 rules): the creatures' Dexterity (Stealth) against the party's best passive Perception.
 * Fast pace means Disadvantage on Perception (−5 passive), Slow means Advantage (+5). Asleep, nobody but the watch notices.
 * Only Hostile creatures try to ambush; a surprised party has Disadvantage on Initiative.
 */
function surpriseCheck(s: State, ctx: Ctx, cr: string, hostile: boolean, activity: CheckConditions['activity'], watchers: Character[]): string {
  if (!hostile) return ' They aren’t hiding: both sides see each other at that distance.';
  const awake = activity === 'rest' ? watchers : s.characters.filter((c) => c.kind !== 'mount' && alive(c) && !c.dying && !c.stable);
  const pace = activity === 'travel' ? s.travel.pace : null;
  const stealth = d20('normal', ctx.rng).value + estimatedStealth(cr);
  if (activity === 'rest' && s.place.alarm === true) return ' As they creep closer, someone or something crosses the alarm line and the Bell jangles: the camp wakes, and nobody is surprised (table rule).';
  if (activity === 'rest' && s.place.alarm === 'pots' && stealth < POT_ALARM_DC) return ` As they creep closer (Stealth ${stealth}), they blunder into the line of pots and set it clanking: the camp wakes, and nobody is surprised (table rule).`;
  if (!awake.length) return ` With nobody awake to notice, they approach unseen: the party is surprised (Disadvantage on Initiative).`;
  // Sight (light, Darkvision, heavy rain or snow) and pace each give Advantage or Disadvantage, which cancel and don't stack.
  const paceMode: RollMode = pace === 'fast' ? 'disadvantage' : pace === 'slow' ? 'advantage' : 'normal';
  const where = activity === 'travel' ? 'travel' : activity === 'explore' ? 'explore' : 'camp';
  const seen = awake.map((c) => {
    const sight = sightNow(s, c, where);
    const mode = combineModes(sight.mode, paceMode);
    return { c, sight, mode, passive: c.passivePerception + passiveMod(mode) };
  });
  const top = seen.reduce((a, b) => (b.passive > a.passive ? b : a));
  const why = [top.sight.mode !== 'normal' ? top.sight.note : '', paceMode !== 'normal' ? `${pace} pace` : ''].filter(Boolean);
  const cancel = top.mode === 'normal' && why.length > 1 ? ': Advantage and Disadvantage cancel' : '';
  const best = `${top.c.name}'s passive Perception ${top.passive}${why.length ? ` (${why.join('; ')}${cancel})` : ''}`;
  return stealth > top.passive
    ? ` They try to ambush: Stealth ${stealth} beats ${best}. The party is surprised (Disadvantage on Initiative).`
    : ` They try to sneak up: Stealth ${stealth} against ${best}. The party spots them in time, no surprise.`;
}

export function resolveEncounter(s: State, ctx: Ctx, activity: CheckConditions['activity'], checkDetail?: string): void {
  const table = encounterTable(s);
  const res = rollOnTable(table, ctx.rng);
  if (!res) {
    log(s, 'Random encounter, but the table is empty: switch on the SRD creatures or more books in the Encounters tab.', 'warn');
    return;
  }
  const night = isNight(s) || isUnderground(s);
  const watchers = activity === 'rest' ? onWatchNow(s) : [];
  const when = `${ACTIVITY_WHEN[activity]} at ${formatClock(s.minutes % MIN_PER_DAY)}`;
  const watchNote = activity === 'rest' ? (watchers.length ? ` On watch: ${watchers.map((c) => `${c.name} (passive Perception ${c.passivePerception})`).join(', ')}.` : ' Nobody is on watch.') : '';
  const head = `Random encounter ${when}${checkDetail ? ` (${checkDetail})` : ''}. d100 = ${res.roll}:`;
  // Table rule: in daylight outdoors, someone awake with a Spyglass spots them at twice the distance.
  const lookouts = (activity === 'rest' ? watchers : s.characters.filter((x) => x.kind !== 'mount' && alive(x) && !x.dying && !x.stable)).filter((x) => x.inventory.some((i) => SPYGLASS.test(i.name)));
  if (lookouts.length && !night && !isUnderground(s)) {
    res.distanceFt *= 2;
    res.distanceExpr = `${res.distanceExpr}, doubled: ${lookouts[0].name} spots them through a Spyglass (table rule)`;
  }
  if (res.row.kind === 'peaceful' || !res.row.creature) {
    log(s, `${head} ${res.row.text}. About ${res.distanceFt} feet away.${watchNote}`, 'info');
    return;
  }
  encounterSerial += 1; // creatures, not just signs: enough to break off a long casting
  const c = res.row.creature;
  const party = table.party;
  const dm = `${head} ${res.summary} (CR ${c.cr}${res.row.followers ? ` and ${res.row.followers.creature.cr}` : ''}, rolled ${res.row.count}${res.row.followers ? ` and ${res.row.followers.count}` : ''}; ${res.xp} XP total, ${DIFFICULTY_LABEL[res.difficulty ?? 'low']} for ${party.size} level-${party.level} characters). Starting attitude: ${res.attitude?.attitude} (d20 ${res.attitude?.roll}). They are ${res.distanceFt} feet away (${res.distanceExpr}).${watchNote}${surpriseCheck(s, ctx, c.cr, res.attitude?.attitude === 'Hostile', activity, watchers)}${res.attitude?.attitude !== 'Hostile' ? ' They can be parleyed with: an Influence check (DC 15 or the creature’s Intelligence score, whichever is higher) can shift an Indifferent creature.' : ''}`;
  const predicate = firstSign(c.type, night);
  log(s, dm, res.attitude?.attitude === 'Hostile' ? 'bad' : 'warn', { charIds: watchers.map((w) => w.id), status: false, sense: predicate });
  for (const w of watchers) s.statusLog.unshift({ id: uid(), stamp: stamp(s), at: absNow(s), charId: w.id, kind: 'encounter', text: `On watch, ${w.name} spots ${res.summary}.`, sense: predicate, tone: 'warn' });
}

/** Roll a random encounter check by hand, using what the party is doing now. */
export const checkForEncounter = act((d, ctx, activity: CheckConditions['activity'] = 'camp') => {
  encounterCheck(d, ctx, activity, true);
});

/** Skip the check: something turns up. Roll on the table. */
export const rollRandomEncounter = act((d, ctx, activity: CheckConditions['activity'] = 'camp') => {
  resolveEncounter(d, ctx, activity);
});

// ---------------------------------------------------------------- marks of prestige (2024 DMG)

/** DMG special training: 30 days with the trainer for a skill, a tool or a language. */
function finishSpecialTraining(s: State, p: Project): void {
  const learn = (p.learn ?? '').trim();
  if (!learn || !p.learnKind) {
    log(s, `${p.name} is done. Record what was learned on the character sheet.`);
    return;
  }
  for (const id of p.charIds) {
    const c = charById(s, id);
    if (!c) continue;
    const add = (list: string[] | undefined) => [...new Set([...(list ?? []), learn])];
    if (p.learnKind === 'skill') c.skillProfs = add(c.skillProfs);
    else if (p.learnKind === 'tool') c.toolProfs = add(c.toolProfs);
    else c.trainedProficiencies = add(c.trainedProficiencies);
    log(s, `${c.name} finishes a month of rare training and ${p.learnKind === 'language' ? `can now speak and read ${learn}` : `is now proficient ${p.learnKind === 'skill' ? 'in' : 'with'} ${learn}`} (${TRAINING_KIND_LABEL[p.learnKind]}).`, 'good');
  }
}

/** Arms training (table rule): the course is over and the body has learned it. */
function finishArmsTraining(s: State, p: Project, ctx?: Ctx): void {
  const kind = p.armsKind!;
  const entry = armsEntry(kind, p.learn);
  if (!entry) return void log(s, `${p.name} is done. Record the weapon learned on the character sheet.`);
  for (const id of p.charIds) {
    const c = charById(s, id);
    if (!c) continue;
    c.armsProfs = [...new Set([...(c.armsProfs ?? []), entry])];
    log(s, `${c.name} finishes ${p.name} and now has ${kind === 'One martial weapon' ? `proficiency with ${entry}` : ARMS_COURSES[kind].grants} (table rule). ${c.name} notices ${armsCue(kind, p.learn)}.`, 'good', { charIds: [c.id] });
  }
  // Xanathar's training complication: 10% for each ten workweeks.
  if (ctx && s.settings.downtimeOutcomes) {
    for (let i = 0; i < Math.floor(p.daysRequired / 50); i++) {
      if (die(10, ctx.rng) !== 1) continue;
      const comp = COMPLICATIONS.Training[die(COMPLICATIONS.Training.length, ctx.rng) - 1];
      const c = charById(s, p.charIds[0]);
      if (c) applyComplication(s, ctx, c, comp);
      break;
    }
  }
}

const nameMatches = (a: string, b: string): boolean => sameCommunity(a, b);
const activeMark = (m: Mark): boolean => !m.revoked && !m.bastionId;
const holderNames = (s: State, m: Mark): string =>
  m.holderIds
    .map((id) => charById(s, id)?.name)
    .filter(Boolean)
    .join(' and ') || 'the holders';

/** Free room and board granted by special rights covers this character here. */
export function freeLodging(s: State, c: Character): boolean {
  return s.place.settlement && s.marks.some((m) => activeMark(m) && m.kind === 'rights' && m.right === 'lodging' && m.holderIds.includes(c.id) && sameCommunity(m.community ?? '', s.place.name));
}

/** What a fortification costs the holders today (0 while the grantor pays). */
export function fortUpkeepToday(s: State, m: Mark): number {
  if (m.kind !== 'fortification' || !m.fort || !activeMark(m)) return 0;
  return s.dayIndex < (m.sponsoredUntilDay ?? 0) ? 0 : FORT_UPKEEP[m.fort].gpPerDay;
}

/** Table rule: a mark taken back for disloyalty costs this much renown with the faction that granted it. */
export const REVOKE_RENOWN_LOSS = 2;

function takeBack(s: State, m: Mark, why: string, tone: Tone = 'bad', disgrace = false): void {
  if (m.revoked) return;
  m.revoked = { day: s.dayIndex, why };
  const f = disgrace && s.settings.prestigeRules && m.factionId ? s.factions.find((x) => x.id === m.factionId) : null;
  if (f) loseRenown(s, f, REVOKE_RENOWN_LOSS, `${m.name} was taken back`, false);
  if (m.hirelingIds?.length) {
    s.hirelings = s.hirelings.filter((h) => !m.hirelingIds!.includes(h.id));
    log(s, `The soldiers sworn to ${holderNames(s, m)} under “${m.name}” return to their posts.`);
  }
  const verb = m.kind === 'title' ? 'is stripped from' : m.kind === 'rights' ? 'no longer applies to' : 'is taken back from';
  log(s, `${m.name} ${verb} ${holderNames(s, m)}: ${why}.`, tone);
  const linked = s.marks.filter((x) => x.id !== m.id && (x.id === m.landId || x.titleId === m.id));
  for (const x of linked) takeBack(s, x, `it came with the title ${m.name}`, tone);
}

function loseTrust(s: State, m: Mark, why: string): void {
  m.trust = Math.max(0, m.trust - 1);
  if (m.trust <= 0) takeBack(s, m, `${m.grantor || 'the grantor'} has lost all faith (${why})`, 'bad', true);
  else log(s, `${m.grantor || 'The grantor'}'s trust in ${holderNames(s, m)} over ${m.name} slips to ${TRUST_LABEL[m.trust]} (${m.trust}/${TRUST_MAX}): ${why}.`, 'warn');
}

/** Runs at the start of each day: fortification upkeep, rights that expire, and the monthly land and title checks. */
function prestigeDaily(s: State, ctx: Ctx): void {
  for (const m of s.marks) {
    if (!activeMark(m)) continue;
    if (m.kind === 'fortification' && m.fort) {
      if (m.sponsoredUntilDay != null && s.dayIndex === m.sponsoredUntilDay) log(s, `${m.grantor || 'The grantor'} no longer pays for ${m.name}: from today its upkeep of ${fmtGp(FORT_UPKEEP[m.fort].gpPerDay)} a day falls to ${holderNames(s, m)}.`, 'warn');
      const cost = fortUpkeepToday(s, m);
      if (cost > 0) {
        payGold(s, m.holderIds, cost, `a day's upkeep on ${m.name} (garrison, servants and repairs)`);
        const broke = s.settings.chargeCosts && m.holderIds.some((id) => (charById(s, id)?.gp ?? 0) < 0);
        if (s.settings.prestigeRules && broke) {
          m.neglectDays = (m.neglectDays ?? 0) + 1;
          if (m.neglectDays % 7 === 0 && m.neglectDays < FORT_NEGLECT_DAYS) log(s, `Unpaid at ${m.name}: guards drift away and repairs wait (${m.neglectDays} days).`, 'warn');
          if (m.neglectDays >= FORT_NEGLECT_DAYS) {
            m.neglectDays = 0;
            loseTrust(s, m, `${FORT_NEGLECT_DAYS} days of unpaid upkeep`);
          }
        } else m.neglectDays = 0;
      }
    }
    if (m.kind === 'rights' && m.untilDay != null && s.dayIndex >= m.untilDay) takeBack(s, m, 'the term in the document has run out', 'info');
    if (!s.settings.prestigeRules || !monthDue(m.grantedDay, s.dayIndex)) continue;
    if (m.kind === 'land' && m.land) {
      if (m.trouble) {
        log(s, `Word reaches ${m.grantor || 'the ruler'} that trouble on ${m.name} has gone unanswered for a month, and the land yields nothing (${m.trouble.text.replace(/\.$/, '')}).`, 'bad');
        loseTrust(s, m, 'trouble on the land left unanswered');
        if (m.revoked) continue;
      } else {
        const gp = rollLandIncome(m.land, ctx.rng);
        if (gp > 0) receiveGold(s, m.holderIds, gp, `a month of rents and dues from ${m.name}`);
      }
      const trouble = rollLandTrouble(ctx.rng);
      if (trouble) {
        m.trouble = { text: trouble, sinceDay: s.dayIndex };
        log(s, `A rider brings word from ${m.name}: ${trouble} Deal with it within 30 days.`, 'warn');
      }
    }
    if (m.kind === 'title' && m.rank) {
      const need = TITLE_RANK[m.rank].lifestyle;
      if (!need) continue;
      const shabby = m.holderIds.map((id) => charById(s, id)).filter((c): c is Character => !!c && alive(c) && lifestyleBelow(c.lifestyle, need));
      if (shabby.length) loseTrust(s, m, `${shabby.map((c) => c.name).join(' and ')} live${shabby.length > 1 ? '' : 's'} below what a ${TITLE_RANK[m.rank].label.toLowerCase()} must keep up (${LIFESTYLE_LABEL[need]} or better)`);
    }
  }
}

export interface MarkGrant {
  kind: Mark['kind'];
  name: string;
  holderIds: string[];
  grantor: string;
  notes?: string;
  fort?: Mark['fort'];
  /** Months the grantor pays the fortification's upkeep. */
  sponsorMonths?: number;
  land?: Mark['land'];
  right?: Mark['right'];
  community?: string;
  /** Days the rights last (none: for life). */
  days?: number | null;
  soldiers?: number;
  rank?: Mark['rank'];
  heir?: string;
  /** A title that comes with land of this kind. */
  withLand?: Mark['land'] | null;
  /** A faction in the tracker that grants it. */
  factionId?: string | null;
  /** With no faction chosen: track the grantor (a monarch, a court, a city) as a faction, reusing one of the same name. */
  rulerAsFaction?: boolean;
}

/** The faction standing for a ruler or ruling body: one already tracked under that name, or a new one at renown 0. */
function rulerFaction(s: State, name: string): Faction | null {
  const n = name.trim();
  if (!n) return null;
  const found = s.factions.find((f) => f.name.trim().toLowerCase() === n.toLowerCase());
  if (found) return found;
  const f: Faction = { id: uid(), name: n, renown: 0, notes: 'A ruler tracked as a faction: standing at court.' };
  s.factions.push(f);
  log(s, `${n} is now tracked as a faction (renown 0): the party's standing with this ruler and their court.`);
  return f;
}

export const grantMark = act((d, _ctx, g: MarkGrant) => {
  // Table rule: a faction (or ruler) won't grant a title or fortification below the renown its members expect.
  if (d.settings.prestigeRenownMin) {
    const named = g.factionId ? d.factions.find((x) => x.id === g.factionId) : g.rulerAsFaction && g.grantor.trim() ? d.factions.find((f) => f.name.trim().toLowerCase() === g.grantor.trim().toLowerCase()) : undefined;
    const tracked = !!named || (!g.factionId && !!g.rulerAsFaction && !!g.grantor.trim());
    const need = renownMinimum(g.kind, g.rank);
    const have = named?.renown ?? 0;
    if (tracked && need > have) {
      log(d, `${named?.name ?? g.grantor.trim()} will not grant ${g.name.trim() || MARK_LABEL[g.kind]} yet: that takes renown ${need}, and the party has ${have} (table rule).`, 'warn');
      return;
    }
  }
  const fac = (g.factionId ? d.factions.find((x) => x.id === g.factionId) : undefined) ?? (g.rulerAsFaction ? rulerFaction(d, g.grantor) ?? undefined : undefined);
  const base = { id: uid(), name: g.name.trim() || MARK_LABEL[g.kind], holderIds: g.holderIds, grantor: g.grantor.trim() || fac?.name || '', grantedDay: d.dayIndex, trust: TRUST_MAX, notes: g.notes ?? '', ...(fac ? { factionId: fac.id } : {}) };
  const m: Mark = { ...base, kind: g.kind };
  const who = holderNames(d, m);
  const from = m.grantor ? ` by ${m.grantor}` : '';
  if (g.kind === 'fortification') {
    m.fort = g.fort ?? 'keep';
    m.sponsoredUntilDay = d.dayIndex + Math.max(0, Math.round(g.sponsorMonths ?? 0)) * 30;
    m.neglectDays = 0;
    const up = FORT_UPKEEP[m.fort];
    log(d, `${who} ${m.holderIds.length > 1 ? 'are' : 'is'} given custody of ${m.name}${from}: ${up.label.toLowerCase()}, ${fmtGp(up.gpPerDay)} a day to maintain${g.sponsorMonths ? `, paid by the grantor for the first ${g.sponsorMonths} month${g.sponsorMonths > 1 ? 's' : ''}` : ''}. The land beneath it stays the crown's.`, 'good');
  } else if (g.kind === 'land') {
    m.land = g.land ?? 'farmland';
    m.trouble = null;
    log(d, `${who} receive${m.holderIds.length > 1 ? '' : 's'} a sealed letter${from} granting ${m.name}: ${LAND[m.land].label.toLowerCase()}. It may be built on and inherited, but not sold or traded without leave.`, 'good');
  } else if (g.kind === 'rights') {
    m.right = g.right ?? 'other';
    m.community = g.community?.trim() || undefined;
    m.untilDay = g.days ? d.dayIndex + Math.round(g.days) : null;
    if (m.right === 'soldiers') {
      m.soldiers = Math.max(1, Math.round(g.soldiers ?? 2));
      m.hirelingIds = [];
      for (let i = 0; i < m.soldiers; i++) {
        const h = { id: uid(), name: `Sworn soldier ${i + 1}`, role: 'guard' as const, bonus: 0, passivePerception: 10, skilled: false, wageGp: 0, payer: 'party', active: true };
        d.hirelings.push(h);
        m.hirelingIds.push(h.id);
      }
    }
    log(d, `A proclamation${from} grants ${who} ${RIGHTS[m.right].label.toLowerCase()}${m.community ? ` (${m.community})` : ''}${m.untilDay != null ? ` for ${g.days} days` : ''}.${m.right === 'soldiers' ? ` ${m.soldiers} soldiers swear to serve them.` : ''}`, 'good');
  } else {
    m.rank = g.rank ?? 'knight';
    m.heir = g.heir?.trim() || undefined;
    log(d, `${who} kneel${m.holderIds.length > 1 ? '' : 's'} and rise${m.holderIds.length > 1 ? '' : 's'} as ${m.name}${from}.${TITLE_RANK[m.rank].lifestyle ? ` People now expect them to live ${LIFESTYLE_LABEL[TITLE_RANK[m.rank].lifestyle!]} or better.` : ' Archfey titles may come with a minor supernatural gift instead of land.'}`, 'good');
    if (g.withLand) {
      const land: Mark = { ...base, id: uid(), kind: 'land', name: `Lands of ${m.name}`, land: g.withLand, trouble: null, titleId: m.id };
      m.landId = land.id;
      d.marks.push(land);
      log(d, `With the title come its lands: ${LAND[g.withLand].label.toLowerCase()}.`, 'good');
    }
  }
  d.marks.push(m);
});

const markById = (s: State, id: string) => s.marks.find((m) => m.id === id);

/** Tracks a mark's grantor as a faction, and links every other mark from the same grantor that has none. */
export const markRulerAsFaction = act((d, _ctx, id: string) => {
  const m = markById(d, id);
  if (!m || m.factionId || !m.grantor.trim()) return;
  const f = rulerFaction(d, m.grantor)!;
  const linked = d.marks.filter((x) => !x.factionId && x.grantor.trim().toLowerCase() === m.grantor.trim().toLowerCase());
  for (const x of linked) x.factionId = f.id;
  log(d, `${linked.map((x) => x.name).join(', ')} now count${linked.length > 1 ? '' : 's'} as granted by the faction ${f.name}.`);
});

export const revokeMark = act((d, _ctx, id: string, why: string) => {
  const m = markById(d, id);
  if (m) takeBack(d, m, why || 'by decree', 'bad', true);
});

/** Table rule: the grantor's trust goes up (service, loyalty) or down (abuse, disloyalty, conduct unbecoming). */
export const adjustMarkTrust = act((d, _ctx, id: string, delta: 1 | -1, why: string) => {
  const m = markById(d, id);
  if (!m || !activeMark(m)) return;
  if (delta < 0) loseTrust(d, m, why || 'conduct that displeases the grantor');
  else if (m.trust < TRUST_MAX) {
    m.trust += 1;
    log(d, `${m.grantor || 'The grantor'}'s trust in ${holderNames(d, m)} over ${m.name} grows to ${TRUST_LABEL[m.trust]} (${m.trust}/${TRUST_MAX})${why ? `: ${why}` : ''}.`, 'good');
  }
  const f = m.factionId ? d.factions.find((x) => x.id === m.factionId) : null;
  if (delta > 0 && f) gainRenown(d, f, 1, why || `service tied to ${m.name}`);
});

export const resolveLandTrouble = act((d, _ctx, id: string) => {
  const m = markById(d, id);
  if (!m?.trouble) return;
  log(d, `${holderNames(d, m)} put the trouble on ${m.name} to rest, and the people there breathe easier.`, 'good');
  m.trouble = null;
});

/** Letter of marque: the crown takes its share of a prize from its enemies, the rest goes to the holders. */
export const claimPrize = act((d, _ctx, id: string, gp: number) => {
  const m = markById(d, id);
  if (!m || !activeMark(m) || m.right !== 'marque' || gp <= 0) return;
  const crown = Math.round(gp * PRIZE_CROWN_SHARE * 100) / 100;
  log(d, `A prize worth ${fmtGp(gp)} taken from the crown's enemies is declared under ${m.name}: ${fmtGp(crown)} goes to ${m.grantor || 'the crown'}.`);
  receiveGold(d, m.holderIds, Math.round((gp - crown) * 100) / 100, `their share of a lawful prize`);
});

/** The DMG lets a gifted fortification become the reason a character gets a Bastion. */
export const fortToBastion = act((d, ctx, id: string) => {
  const m = markById(d, id);
  if (!m || !activeMark(m) || m.kind !== 'fortification' || !m.holderIds[0]) return;
  Object.assign(d, foundBastion(d, ctx, m.holderIds[0], m.name));
  const nm = markById(d, id)!;
  nm.bastionId = d.bastions.at(-1)?.id;
  log(d, `${nm.name} becomes ${holderNames(d, nm)}'s Bastion. Its upkeep now follows the Bastion rules instead.`, 'good');
});

export const removeMark = act((d, _ctx, id: string) => {
  const m = markById(d, id);
  if (!m) return;
  if (m.hirelingIds?.length) d.hirelings = d.hirelings.filter((h) => !m.hirelingIds!.includes(h.id));
  d.marks = d.marks.filter((x) => x.id !== id && x.titleId !== id);
});

// ---------------------------------------------------------------- taming wild creatures (table rule)

/** What a character brings to taming, read from their sheet. */
export function tamerFacts(c: Character): TamerFacts {
  const cha = c.abilities?.cha;
  return {
    wisMod: c.wisMod,
    chaMod: typeof cha === 'number' ? abilityMod(cha) : null,
    pb: proficiencyBonus(c.level),
    exhaustion: c.exhaustion,
    animalHandling: !!hasSkill(c, 'Animal Handling'),
    persuasion: !!hasSkill(c, 'Persuasion'),
    performance: !!hasSkill(c, 'Performance'),
    feats: c.feats ?? [],
    species: c.species ?? '',
    level: c.level,
  };
}

/** Who can take the Help action for a taming check: proficient in Animal Handling (2024 PHB), or a groom hireling. */
export function tameHelpers(s: State, tamerId: string): { id: string; name: string }[] {
  const pcs = s.characters.filter((c) => c.id !== tamerId && c.kind !== 'mount' && alive(c) && hasSkill(c, 'Animal Handling')).map((c) => ({ id: c.id, name: c.name }));
  const grooms = s.hirelings.filter((h) => h.active && h.role === 'groom').map((h) => ({ id: `h:${h.id}`, name: `${h.name} (groom)` }));
  return [...pcs, ...grooms];
}

export interface NewTame {
  name: string;
  creature: string;
  type: string;
  size: Character['size'];
  int: number;
  cr: string;
  speed: number;
  movement: 'land' | 'fly' | 'swim';
}

function tameRoll(ctx: Ctx, tamer: Character, c: { type: string; int: number; movement: 'land' | 'fly' | 'swim' }, a: TameAids, dc: number) {
  const chk = tameCheck(tamerFacts(tamer), c, a);
  if (!chk.ok) return { ok: false as const, why: chk.why! };
  const r = d20(chk.mode, ctx.rng);
  const extra = chk.dice.map((n) => die(n, ctx.rng));
  const total = r.value + chk.bonus + extra.reduce((x, y) => x + y, 0);
  const dice = chk.dice.map((n, i) => ` + ${extra[i]} (d${n})`).join('');
  const text = `${chk.skill} ${r.rolls.join('/')}${chk.mode !== 'normal' ? ` with ${chk.mode === 'advantage' ? 'Advantage' : 'Disadvantage'}` : ''} ${signed(chk.bonus)}${dice} = ${total} against DC ${dc}${chk.notes.length ? ` (${chk.notes.join('; ')})` : ''}`;
  return { ok: true as const, natural: r.value, total, text };
}

/** First contact: the Influence action to coax a wild Beast or Monstrosity into letting the tamer near (2024 PHB). */
export const approachCreature = act((d, ctx, o: NewTame, tamerId: string, a: TameAids) => {
  if (!d.settings.taming) return void log(d, 'Taming wild creatures is switched off in Settings.', 'warn');
  const tamer = charById(d, tamerId);
  if (!tamer || tamer.kind === 'mount' || !alive(tamer)) return;
  const ok = canTame(o.type, o.int);
  if (!ok.ok) return void log(d, `${tamer.name} can't tame the ${o.creature}: ${ok.why}.`, 'warn');
  d.taming ??= [];
  const old = d.taming.find((t) => t.stage === 'wary' && t.creature === o.creature && t.tamerId === tamerId);
  const now = absNow(d);
  if (old?.retryAt && old.retryAt > now) return void log(d, `The ${old.name} won't let ${tamer.name} near again yet: try after ${formatDuration(old.retryAt - now)} (2024 PHB Influence: 24 hours after a failed check), or try a different way.`, 'warn');
  const dc = tameDC(o.int, o.cr);
  const r = tameRoll(ctx, tamer, o, { ...a, stable: false }, dc);
  if (!r.ok) return void log(d, `The ${o.creature} won't be coaxed: ${r.why}.`, 'warn');
  advanceMut(d, ctx, 10, 'camp');
  const name = o.name.trim() || o.creature;
  const base: TameTarget = { id: uid(), ...o, name, tamerId, stage: 'bonding', trust: 0, needed: trustNeeded(o.cr, o.int), fails: 0, lastSessionDay: null, startedDay: d.dayIndex, retryAt: null, trained: [] };
  if (old) d.taming = d.taming.filter((t) => t !== old);
  if (r.total >= dc) {
    d.taming.push(base);
    return void log(d, `${tamer.name} edges toward the ${o.creature}, slow and low: ${r.text}. It stops, sniffs the air, and doesn't run. Taming has begun: about ${base.needed} good days of patient work (an hour a day) will win it over.`, 'good', { charIds: [tamer.id] });
  }
  if (r.total <= dc - 5) return void log(d, `${tamer.name} misjudges the ${o.creature}: ${r.text}. It bares its teeth and lashes out or bolts (table rule; DM decides which). It won't let anyone tame it now.`, 'bad', { charIds: [tamer.id] });
  d.taming.push({ ...base, stage: 'wary', retryAt: absNow(d) + TAME_RETRY_MINUTES });
  log(d, `${tamer.name} gets too close too fast: ${r.text}. The ${o.creature} backs off to a safe distance and watches. ${tamer.name} can try the same way again in 24 hours (2024 PHB Influence).`, 'warn', { charIds: [tamer.id] });
});

/** Raising a creature from an egg or a newborn: no approach, and it bonds in half the time (table rule after Monster Manual lore). */
export const raiseYoung = act((d, _ctx, o: NewTame, tamerId: string) => {
  if (!d.settings.taming) return void log(d, 'Taming wild creatures is switched off in Settings.', 'warn');
  const tamer = charById(d, tamerId);
  if (!tamer || tamer.kind === 'mount' || !alive(tamer)) return;
  const ok = canTame(o.type, o.int);
  if (!ok.ok) return void log(d, `${tamer.name} can't raise the ${o.creature}: ${ok.why}.`, 'warn');
  const name = o.name.trim() || o.creature;
  const t: TameTarget = { id: uid(), ...o, name, tamerId, stage: 'bonding', trust: 0, needed: trustNeeded(o.cr, o.int, true), fails: 0, lastSessionDay: null, startedDay: d.dayIndex, retryAt: null, trained: [], raised: true };
  (d.taming ??= []).push(t);
  log(d, `${tamer.name} takes on a young ${o.creature} and names it ${name}. It imprints on whoever feeds it: about ${t.needed} good days of care will bond it (table rule). The DM decides how long until it is grown enough to ride: Monster Manual lore says griffons, hippogriffs, wyverns and hadrosauruses are trained this way.`, 'good', { charIds: [tamer.id] });
});

function tamedMount(d: State, t: TameTarget): Character {
  const m = newCharacter({
    kind: 'mount',
    name: t.name,
    species: t.creature,
    className: 'Other',
    size: t.size,
    speed: t.speed,
    movement: t.movement,
    saddle: 'none',
    tasks: [],
    bedroll: false,
    rationsLb: 0,
    waterPints: 0,
    waterCapacityPints: 0,
    gp: 0,
    conScore: 12,
    swimSpeed: t.movement === 'swim',
    carryCapacity: null,
    tamed: { tamerId: t.tamerId, trained: [] },
  });
  d.characters.push(m);
  return m;
}

/** An hour's daily session with a creature being tamed or trained, with any co-trainers. Feeds it from the camp stores (raw meat first). */
export const tameSession = act((d, ctx, id: string, a: Omit<TameAids, 'attitude' | 'food' | 'unwilling'>, coTrainerIds: string[] = []) => {
  const t = d.taming?.find((x) => x.id === id);
  if (!t || t.stage === 'wary') return;
  const tamer = charById(d, t.tamerId);
  if (!tamer || !alive(tamer)) return void log(d, `${t.name}'s tamer can't work with it right now.`, 'warn');
  if (t.stage === 'tamed' && !t.training) return void log(d, `${t.name} is tamed. Choose something to train it for first.`, 'warn');
  if (t.lastSessionDay === d.dayIndex) return void log(d, `${tamer.name} has already worked with ${t.name} today (table rule: one session a day).`, 'warn');
  if (t.stage === 'bonding') {
    const missed = missedDays(t.lastSessionDay ?? t.startedDay, d.dayIndex);
    if (missed) {
      t.trust -= missed;
      if (t.trust < 0) {
        d.taming = d.taming!.filter((x) => x !== t);
        return void log(d, `${t.name} was left alone too long (${missed} day${missed > 1 ? 's' : ''} without a session) and has gone back to the wild.`, 'bad');
      }
      log(d, `${t.name} was left alone for ${missed} day${missed > 1 ? 's' : ''} and is warier again (table rule: −1 trust a day).`, 'warn');
    }
  }
  // Feed it a day's food from the camp stores: raw meat first, then other food.
  const need = FOOD_LB_PER_DAY[t.size];
  const fromRaw = Math.min(need, d.stores.foodRawLb);
  const fromFood = Math.min(need - fromRaw, d.stores.foodLb);
  const fed = fromRaw + fromFood >= need - 1e-9;
  if (fed) {
    d.stores.foodRawLb = Math.round((d.stores.foodRawLb - fromRaw) * 100) / 100;
    d.stores.foodLb = Math.round((d.stores.foodLb - fromFood) * 100) / 100;
    const m = t.mountId ? charById(d, t.mountId) : undefined;
    if (m) m.ateLbToday = Math.max(m.ateLbToday, need);
  }
  advanceMut(d, ctx, TAME_SESSION_MINUTES, 'camp');
  t.lastSessionDay = d.dayIndex;
  const progress = t.training?.progress ?? 0;
  const dc = currentDC(t.int, t.cr, t.trust, progress);
  const startDC = tameDC(t.int, t.cr);
  const attitude = sessionAttitude(t.trust, t.needed, t.stage === 'tamed');
  const shared = { attitude, food: fed, unwilling: false, stable: a.stable, threatened: a.threatened };
  // The tamer gets their own spells and helpers; co-trainers roll with only what the whole group shares (table rule).
  const team = [tamer, ...coTrainerIds.map((cid) => charById(d, cid)).filter((c): c is Character => !!c && c.id !== tamer.id && c.kind !== 'mount' && alive(c))];
  const rolls = team
    .map((c, i) => ({ c, r: tameRoll(ctx, c, t, i === 0 ? { ...a, ...shared } : { ...NO_AIDS, ...shared }, dc) }))
    .filter((x): x is { c: Character; r: Extract<ReturnType<typeof tameRoll>, { ok: true }> } => x.r.ok);
  if (!rolls.length) return;
  const results = rolls.map((x) => sessionResult(x.r.natural, x.r.total, dc));
  const day = dayOutcome(results);
  const word = { great: 'a breakthrough', success: 'success', fail: 'no progress', setback: 'a setback' } as const;
  const rollTxt = rolls.map((x, i) => `${x.c.name}: ${x.r.text}, ${word[results[i]]}`).join('. ');
  const who = rolls.map((x) => x.c.name).join(', ');
  const ids = rolls.map((x) => x.c.id);
  const feedTxt = fed ? ` It eats ${fmtLb(need)} from the camp stores.` : ` There was no food to offer (${fmtLb(need)} needed), so no Advantage from food.`;
  const capped = rolls.length > 1 && results.reduce((n, r) => n + resultGain(r), 0) > TRUST_PER_DAY_MAX ? ` (it can only take in ${TRUST_PER_DAY_MAX} a day, table rule)` : '';
  if (day.bad) t.fails += 1;
  else t.fails = 0;
  const gain = day.gain;

  if (t.stage === 'bonding') {
    t.trust = Math.max(0, t.trust + gain);
    if (t.fails >= TAME_MAX_FAILS) {
      d.taming = d.taming!.filter((x) => x !== t);
      return void log(d, `${who} work${rolls.length > 1 ? '' : 's'} with ${t.name}. ${rollTxt}.${feedTxt} After ${TAME_MAX_FAILS} bad days in a row it slips away in the night and doesn't come back (table rule).`, 'bad', { charIds: ids });
    }
    if (t.trust >= t.needed) {
      t.stage = 'tamed';
      const m = tamedMount(d, t);
      t.mountId = m.id;
      const sidekick = canBeSidekick(t.cr) ? ` Optional rule (Tasha's Cauldron): at CR ${t.cr} it can join as a sidekick with the Warrior or Expert class, at the party's average level.` : '';
      return void log(d, `${who} work${rolls.length > 1 ? '' : 's'} with ${t.name}. ${rollTxt}.${feedTxt} ${trustCue(t.creature, t.trust, t.needed)} ${t.name} is tamed and joins the party: it needs food and water every day like any mount. Untrained, it acts on its own in a fight and can only be ridden as an independent mount.${sidekick}`, 'good', { charIds: ids });
    }
    const next = currentDC(t.int, t.cr, t.trust);
    const dcTxt = next !== dc ? ` Trust ${gain > 0 ? '+' : ''}${gain}${capped}: the next session is DC ${next} (it started at ${startDC}).` : gain ? ` Trust ${gain > 0 ? '+' : ''}${gain}${capped}.` : '';
    const friendly = attitude === 'indifferent' && t.trust * 2 >= t.needed ? ` It now counts as Friendly, so later sessions have Advantage (2024 PHB attitudes).` : '';
    return void log(d, `${who} work${rolls.length > 1 ? '' : 's'} with ${t.name}. ${rollTxt}.${feedTxt}${dcTxt} ${trustCue(t.creature, t.trust, t.needed)}${friendly}${t.fails ? ` (${t.fails} bad day${t.fails > 1 ? 's' : ''} in a row)` : ''}`, gain > 0 ? 'good' : 'warn', { charIds: ids });
  }

  // Training a tamed creature: failures never undo it, they just waste the day.
  const tr = t.training!;
  if (t.fails >= TAME_MAX_FAILS) {
    tr.progress = Math.max(0, tr.progress - 1);
    t.fails = 0;
  }
  tr.progress = Math.max(0, tr.progress + Math.max(0, gain));
  if (tr.progress >= tr.needed) {
    t.trained = [...new Set([...t.trained, tr.kind])];
    delete t.training;
    const m = t.mountId ? charById(d, t.mountId) : undefined;
    if (m) m.tamed = { tamerId: t.tamerId, trained: [...t.trained] };
    const what =
      tr.kind === 'mount'
        ? `${t.name} now accepts a rider and can be a controlled mount (2024 PHB).${t.movement !== 'land' ? ' A flying or swimming mount needs an Exotic Saddle.' : ''}`
        : `${t.name} now follows simple commands from ${tamer.name}: come, stay, guard, attack, fetch (table rule).`;
    return void log(d, `${who} train${rolls.length > 1 ? '' : 's'} ${t.name}. ${rollTxt}.${feedTxt} ${what}`, 'good', { charIds: ids });
  }
  const next = currentDC(t.int, t.cr, t.trust, tr.progress);
  log(d, `${who} train${rolls.length > 1 ? '' : 's'} ${t.name} ${TRAINING_LABEL[tr.kind]}. ${rollTxt}: ${gain > 0 ? `it learns a little more${capped}` : 'a wasted day'}.${feedTxt} About ${tr.needed - tr.progress} more good session${tr.needed - tr.progress === 1 ? '' : 's'} to go${next !== dc ? `; next session DC ${next}` : ''}.`, gain > 0 ? 'good' : 'warn', { charIds: ids });
});

/** Starts training a tamed creature to accept a rider or follow commands. */
export const startTraining = act((d, _ctx, id: string, kind: TameTraining) => {
  const t = d.taming?.find((x) => x.id === id);
  if (!t || t.stage !== 'tamed' || t.trained.includes(kind)) return;
  const tamer = charById(d, t.tamerId);
  if (kind === 'mount' && tamer && !bigEnoughToRide(t.size, tamer.size)) return void log(d, `A ${t.size} ${t.creature} is too small to carry ${tamer.name} (2024 PHB: a mount must be at least one size larger than its rider). Someone smaller could ride it.`, 'warn');
  t.training = { kind, progress: 0, needed: trainingNeeded(t.cr, t.int) };
  log(d, `${tamer?.name ?? 'Its tamer'} begins training ${t.name} ${TRAINING_LABEL[kind]}: about ${t.training.needed} good sessions, an hour a day (table rule).${kind === 'mount' ? " It must also have the right shape to carry a rider: DM's call." : ''}`);
});

/** Lets the creature go, or stops tracking it once it is tamed and trained. */
export const releaseTame = act((d, _ctx, id: string) => {
  const t = d.taming?.find((x) => x.id === id);
  if (!t) return;
  d.taming = d.taming!.filter((x) => x !== t);
  if (t.stage !== 'tamed') log(d, `The party leaves the ${t.creature} to the wild.`);
});

// ---------------------------------------------------------------- lingering injuries (2014 DMG optional rule)

function addInjuryMut(s: State, c: Character, kind: InjuryKind, why: string): void {
  const info = INJURIES[kind];
  (c.injuries ??= []).push({ id: uid(), kind, at: absNow(s), why, restDays: 0, medicine: 0, hpLost: 0 });
  status(s, c, 'injured', `${c.name} suffers a lingering injury from ${why}: ${info.label}. ${info.effect} ${info.cureText}`, kind === 'minorScar' ? 'info' : 'bad');
}

/** A lingering injury, rolled on the d20 table or chosen. */
export const addInjury = act((d, ctx, charId: string, kind: InjuryKind | null, why: string) => {
  const c = charById(d, charId);
  if (!c) return;
  if (!d.settings.lingeringInjuries) return void log(d, 'Lingering injuries are switched off (Settings → Level of detail).', 'warn');
  addInjuryMut(d, c, kind ?? injuryFor(die(20, ctx.rng)), why || 'a critical hit');
});

function endInjury(s: State, c: Character, id: string, how: string): void {
  const x = (c.injuries ?? []).find((i) => i.id === id);
  if (!x) return;
  c.injuries = (c.injuries ?? []).filter((i) => i.id !== id);
  if (x.hpLost) {
    c.maxHp += x.hpLost;
    c.hp = Math.min(c.maxHp, c.hp);
  }
  status(s, c, 'injuryHeals', `${c.name}'s ${INJURIES[x.kind].label.toLowerCase()} heals (${how})${x.hpLost ? `, and their HP maximum is restored by ${x.hpLost}` : ''}.`, 'good');
}

function healInjuriesBySpell(s: State, c: Character, spell: string): void {
  const how = INJURY_SPELLS[spell];
  if (!how) return;
  for (const x of [...(c.injuries ?? [])]) if (healsInjury(x.kind, how)) endInjury(s, c, x.id, spell);
}

/** Ends an injury by magic, a prosthetic, or the DM's say-so. */
export const healInjury = act((d, _ctx, charId: string, injuryId: string, how: 'magic' | 'heal' | 'regenerate' | 'dm') => {
  const c = charById(d, charId);
  const x = c?.injuries?.find((i) => i.id === injuryId);
  if (!c || !x) return;
  if (how !== 'dm' && !healsInjury(x.kind, how)) return void log(d, `${INJURIES[x.kind].label} needs stronger magic: ${INJURIES[x.kind].cureText}`, 'warn');
  endInjury(d, c, x.id, how === 'magic' ? 'magical healing' : how === 'heal' ? 'Heal' : how === 'regenerate' ? 'Regenerate' : 'the DM rules it healed');
});

/** A Long Rest after a day without travel counts as a day of rest toward internal injuries and broken ribs. */
function injuryRestDay(s: State, rested: boolean): void {
  for (const c of s.characters) {
    if (!alive(c)) continue;
    for (const x of [...(c.injuries ?? [])]) {
      if (INJURIES[x.kind].cure !== 'magicOrRest') continue;
      if (!rested) {
        if (x.restDays > 0) log(s, `${c.name} travelled today, so the rest toward healing their ${INJURIES[x.kind].label.toLowerCase()} starts over.`, 'warn');
        x.restDays = 0;
        continue;
      }
      x.restDays += 1;
      if (x.restDays >= INJURY_REST_DAYS) endInjury(s, c, x.id, `${INJURY_REST_DAYS} days of rest`);
    }
  }
}

/** A festering wound costs 1 HP maximum every 24 hours. */
function festeringWounds(s: State): void {
  for (const c of s.characters) {
    if (!alive(c)) continue;
    for (const x of c.injuries ?? []) {
      if (x.kind !== 'festering') continue;
      x.hpLost += 1;
      c.maxHp = Math.max(0, c.maxHp - 1);
      c.hp = Math.min(c.hp, c.maxHp);
      if (c.maxHp <= 0) return void killOutright(s, c, 'a festering wound');
      status(s, c, 'injuryWorse', `${c.name}'s festering wound worsens: HP maximum −1 (now ${c.maxHp}). ${x.medicine}/${INJURY_MEDICINE_SUCCESSES} Medicine successes so far.`, 'warn');
    }
  }
}

/** Tending a festering wound: a DC 15 Wisdom (Medicine) check once a day; ten successes heal it. */
export const treatInjury = act((d, ctx, charId: string, injuryId: string, healerId: string, bonus: number) => {
  const c = charById(d, charId);
  const x = c?.injuries?.find((i) => i.id === injuryId);
  const h = charById(d, healerId);
  if (!c || !x || !h || x.kind !== 'festering') return;
  if (x.lastTreatedDay === d.dayIndex) return void log(d, `${c.name}'s wound has already been tended today.`, 'warn');
  x.lastTreatedDay = d.dayIndex;
  advanceMut(d, ctx, 10, 'camp');
  const r = d20('normal', ctx.rng);
  const total = r.value + bonus - 2 * h.exhaustion;
  if (total >= FESTERING_MEDICINE_DC) {
    x.medicine += 1;
    log(d, `${h.name} cleans and dresses ${c.name}'s wound: Wisdom (Medicine) ${total} against DC ${FESTERING_MEDICINE_DC}, a success (${x.medicine}/${INJURY_MEDICINE_SUCCESSES}).`, 'good');
    if (x.medicine >= INJURY_MEDICINE_SUCCESSES) endInjury(d, c, x.id, `${INJURY_MEDICINE_SUCCESSES} days of good care`);
  } else log(d, `${h.name} tends ${c.name}'s wound but it stays angry: Wisdom (Medicine) ${total} against DC ${FESTERING_MEDICINE_DC}.`, 'warn');
});

// ---------------------------------------------------------------- madness (2014 DMG optional rule)

function addMadnessMut(s: State, ctx: Ctx, c: Character, tier: MadnessTier, why: string, effect?: string): void {
  const info = MADNESS[tier];
  const now = absNow(s);
  // Short: 1d10 minutes. Long: 1d10 × 10 hours.
  const length = tier === 'short' ? die(10, ctx.rng) : tier === 'long' ? die(10, ctx.rng) * 10 * 60 : null;
  const text = effect || madnessEffect(tier, die(100, ctx.rng));
  (c.madness ??= []).push({ id: uid(), tier, effect: text, at: now, endsAt: length == null ? null : now + length, why });
  status(s, c, 'madness', `${c.name} is gripped by ${info.label.toLowerCase()} (${why}) ${length == null ? 'until cured' : `for ${formatDuration(length)}`}: ${text}`, 'bad');
}

export const addMadness = act((d, ctx, charId: string, tier: MadnessTier, why: string, effect?: string) => {
  const c = charById(d, charId);
  if (!d.settings.madness) return void log(d, 'Madness is switched off (Settings → Level of detail).', 'warn');
  if (c) addMadnessMut(d, ctx, c, tier, why || 'something no mind should face', effect);
});

/** Table rule: Stress or Fear reaches the threshold, so a DC 15 Wisdom save or long-term madness. */
function madnessCheck(s: State, ctx: Ctx, c: Character, why: string): void {
  const r = d20('normal', ctx.rng);
  const total = r.value + c.wisMod - 2 * c.exhaustion;
  if (total >= MADNESS_SAVE_DC) return void log(s, `${c.name} holds on to their wits after ${why}: Wisdom save ${total} against DC ${MADNESS_SAVE_DC} (table rule).`, 'good');
  log(s, `${c.name} breaks under ${why}: Wisdom save ${total} against DC ${MADNESS_SAVE_DC} (table rule).`, 'bad');
  addMadnessMut(s, ctx, c, 'long', why);
}

function endMadness(s: State, c: Character, id: string, why: string): void {
  const m = (c.madness ?? []).find((x) => x.id === id);
  if (!m) return;
  c.madness = (c.madness ?? []).filter((x) => x.id !== id);
  status(s, c, 'madnessEnds', `${c.name}'s ${MADNESS[m.tier].label.toLowerCase()} ends: ${why}.`, 'good');
}

function madnessBySpell(s: State, c: Character, spell: string): void {
  const sp = MADNESS_SPELLS[spell];
  if (!sp) return;
  for (const m of [...(c.madness ?? [])]) {
    if (sp.ends.includes(m.tier)) endMadness(s, c, m.id, spell);
    else if (sp.suppress) {
      m.suppressedUntil = absNow(s) + 1;
      log(s, `${spell} holds ${c.name}'s madness at bay for as long as the caster concentrates (up to 1 minute).`, 'good');
    }
  }
}

export const cureMadness = act((d, _ctx, charId: string, madnessId: string, why: string) => {
  const c = charById(d, charId);
  if (c) endMadness(d, c, madnessId, why || 'the DM rules it over');
});

// ---------------------------------------------------------------- ages and birthdays

/** A character's age, life stage and lifespan right now, or null if their birth isn't recorded. */
export function characterAge(s: State, c: Character) {
  if (c.birthYear == null) return null;
  const date = dateFromIndex(s.calendar, s.startYear, s.dayIndex);
  const bd = c.birthday ?? { monthIndex: 0, day: 1 };
  const passed = date.monthIndex > bd.monthIndex || (date.monthIndex === bd.monthIndex && date.day >= bd.day);
  const age = bodyAge({ birthYear: c.birthYear, magicYears: c.magicYears, slowSinceYear: c.slowAgingSince, slowFactor: SLOW_AGING_FACTOR }, date.year, passed);
  const base = lifespanFor(c.species);
  const life = c.lifespanOverride ? { ...base, span: c.lifespanOverride, guessed: false } : base;
  return { age, stage: ageStage(age, life), life, birthdayToday: date.monthIndex === bd.monthIndex && date.day === bd.day };
}

/** Records a character's age today and their birthday. */
export const setBirth = act((d, _ctx, charId: string, age: number, monthIndex: number, day: number) => {
  const c = charById(d, charId);
  if (!c) return;
  const date = dateFromIndex(d.calendar, d.startYear, d.dayIndex);
  const passed = date.monthIndex > monthIndex || (date.monthIndex === monthIndex && date.day >= day);
  c.birthday = { monthIndex, day };
  c.birthYear = date.year - Math.max(0, Math.round(age)) - (passed ? 0 : 1) - (c.magicYears ?? 0);
  c.slowAgingSince = c.slowAgingSince ?? null;
  log(d, `${c.name} is ${Math.round(age)}, with a birthday on ${day} ${d.calendar.months[monthIndex]?.name ?? ''}.`);
});

function birthdays(s: State): void {
  for (const c of s.characters) {
    if (c.kind === 'mount' || !alive(c)) continue;
    const a = characterAge(s, c);
    if (!a?.birthdayToday) continue;
    const before = ageStage(a.age - 1, a.life);
    status(s, c, 'birthday', `It is ${c.name}'s birthday: they turn ${a.age}${c.slowAgingSince != null ? ' in years, though their body barely changes' : ''}.`, 'good');
    if (before !== a.stage) noticed(s, 'birthday', [c], `${c.name} is now ${STAGE_LABEL[a.stage].toLowerCase()} for a ${a.life.name.toLowerCase()} (lifespan about ${a.life.span}): ${c.name} ${STAGE_SENSE[a.stage]}.`, 'info');
  }
}

/** Magical aging or rejuvenation. */
export const ageByMagic = act((d, ctx, charId: string, kind: string, customYears: number) => {
  const c = charById(d, charId);
  const preset = MAGIC_AGING.find((m) => m.id === kind);
  if (!c || !preset) return;
  let years = kind === 'custom' ? Math.round(customYears) : 0;
  if (kind === 'visage') years = (rollExpr('1d4', ctx.rng) ?? 2) * 10;
  if (kind === 'longevity') {
    const earlier = c.longevityPotions ?? 0;
    c.longevityPotions = earlier + 1;
    const amount = rollExpr('1d6+6', ctx.rng) ?? 9;
    const backfire = ctx.rng() < longevityBackfire(earlier);
    years = backfire ? amount : -amount;
    if (backfire) log(d, `The Potion of Longevity turns on ${c.name} (${Math.round(longevityBackfire(earlier) * 100)}% chance after ${earlier} earlier potion${earlier > 1 ? 's' : ''}).`, 'bad');
  }
  if (!years) return;
  c.magicYears = (c.magicYears ?? 0) + years;
  const a = characterAge(d, c);
  status(d, c, years > 0 ? 'agedByMagic' : 'youngerByMagic', `${preset.label}: ${c.name} ${years > 0 ? 'ages' : 'grows younger by'} ${Math.abs(years)} year${Math.abs(years) > 1 ? 's' : ''}${a ? `, and is now ${a.age} in body (${STAGE_LABEL[a.stage].toLowerCase()})` : ''}.`, years > 0 ? 'bad' : 'good');
});

/** Starts or stops slowed aging (Archdruid: a year per ten). */
export const setSlowAging = act((d, _ctx, charId: string, on: boolean) => {
  const c = charById(d, charId);
  if (!c) return;
  if (on && c.birthYear != null) {
    // Fold the years so far into the birth year so the age doesn't jump.
    const year = dateFromIndex(d.calendar, d.startYear, d.dayIndex).year;
    c.slowAgingSince = year;
  } else if (!on && c.slowAgingSince != null && c.birthYear != null) {
    const year = dateFromIndex(d.calendar, d.startYear, d.dayIndex).year;
    const lost = (year - c.slowAgingSince) * (1 - SLOW_AGING_FACTOR);
    c.birthYear = Math.round(c.birthYear + lost);
    c.slowAgingSince = null;
  } else c.slowAgingSince = on ? dateFromIndex(d.calendar, d.startYear, d.dayIndex).year : null;
  log(d, on ? `${c.name} now ages only a year for every ten that pass.` : `${c.name} ages normally again.`);
});

// ---------------------------------------------------------------- wear and repair (table rule)

/** Gear on the body, not packed away: what weather and hard going get at. */
function exposedGear(c: Character): InventoryItem[] {
  return c.inventory.filter((i) => !i.containerId && !i.damaged && !i.scattered && i.qty > 0 && materialOf(i.name) != null);
}

function isWorn(c: Character, i: InventoryItem): boolean {
  if (c.armorWorn && c.armorName && i.name.toLowerCase().includes(c.armorName.toLowerCase())) return true;
  if (c.shieldWorn && /shield/i.test(i.name)) return true;
  return /boots|cloth|cloak|robe|tunic|garb|gloves|belt|pack/i.test(i.name);
}

function addWear(s: State, c: Character, it: InventoryItem): boolean {
  if (it.reinforced) {
    delete it.reinforced; // an expert mend takes the first knock (table rule)
    return false;
  }
  it.wear = (it.wear ?? 0) + 1;
  if (it.wear < WEAR_LIMIT) return false;
  it.wear = 0;
  if (it.qty > 1) {
    it.qty -= 1;
    c.inventory.push({ ...it, id: uid(), qty: 1, damaged: true, wear: 0 });
  } else it.damaged = true;
  void s;
  return true;
}

/** Hard travel, rain and salt water wear down the gear that suffers from them (table rule). */
function wearFromTravel(s: State, hours: number, atSea: boolean): void {
  if (!s.settings.gearWear || hours <= 0) return;
  const causes = wearCauses({ terrain: atSea ? 'waterborne' : s.place.terrain, precip: s.weather.precip, atSea: atSea || s.place.terrain === 'waterborne' });
  if (!causes.length) return;
  s.travel.wearHours = (s.travel.wearHours ?? 0) + hours;
  while ((s.travel.wearHours ?? 0) >= WEAR_HOURS) {
    s.travel.wearHours = (s.travel.wearHours ?? 0) - WEAR_HOURS;
    for (const c of s.characters) {
      if (c.kind === 'mount' || !alive(c)) continue;
      if ((c.gearKeptUntil ?? 0) > absNow(s)) continue; // freshly kept gear holds up (table rule)
      const broke: string[] = [];
      const worn: string[] = [];
      for (const it of exposedGear(c)) {
        const mat = materialOf(it.name)!;
        if (!causes.some((k) => k.materials.includes(mat) && (!k.wornOnly || isWorn(c, it)))) continue;
        if (addWear(s, c, it)) broke.push(it.name);
        else if ((it.wear ?? 0) >= WEAR_LIMIT - 1) worn.push(it.name);
      }
      if (broke.length) status(s, c, 'gearWorn', `${causes.map((k) => k.label).join(' and ')} take their toll on ${c.name}'s gear: ${broke.join(', ')} ${broke.length > 1 ? 'are' : 'is'} now damaged (table rule; repair on the Characters tab (HP & gear)).`, 'warn');
      else if (worn.length) status(s, c, 'gearWorn', `${c.name}'s ${worn.join(', ')} ${worn.length > 1 ? 'are' : 'is'} badly worn from ${causes.map((k) => k.label).join(' and ')}: an hour of upkeep would save ${worn.length > 1 ? 'them' : 'it'}.`, 'info');
    }
  }
}

/** An hour of cleaning, oiling and patching clears the wear on the characters' gear. */
export const maintainGear = act((d, ctx, charIds: string[]) => {
  const who = charIds.map((id) => charById(d, id)).filter((c): c is Character => !!c && alive(c));
  if (!who.length) return;
  advanceMut(d, ctx, MAINTAIN_MINUTES, 'camp');
  for (const c of who) {
    for (const i of c.inventory) if (i.wear) delete i.wear;
    c.gearKeptUntil = absNow(d) + KEPT_GEAR_MINUTES;
  }
  const ids = who.map((c) => c.id);
  d.effects = d.effects.filter((e) => !(e.name === 'Well-kept gear' && e.targetIds.every((t) => ids.includes(t))));
  d.effects.push({ id: uid(), name: 'Well-kept gear', kind: 'other', targetIds: ids, casterId: null, concentration: false, shelter: false, startedAt: absNow(d), endsAt: absNow(d) + KEPT_GEAR_MINUTES, notes: KEPT_GEAR_NOTE });
  log(d, `${who.map((c) => c.name).join(', ')} spend${who.length > 1 ? '' : 's'} an hour cleaning, oiling and patching their gear: ${d.settings.gearWear ? 'the wear is gone, ' : ''}edges are keen and straps supple. For the next 24 hours: +1 to the first weapon damage roll in each fight${d.settings.gearWear ? ', and the gear takes no wear' : ''} (table rule).`, 'good');
});

/**
 * Repairing a damaged item: with the right artisan's tools (DC 10, 1 hour; improvised DC 15, 2 hours) or by paying
 * a smith or other artisan in a settlement a tenth of its price (table rule).
 */
export const repairItem = act((d, ctx, ownerId: string, itemId: string, method: 'tools' | 'improvised' | 'artisan', repairerId: string, bonus: number) => {
  const owner = charById(d, ownerId);
  const it = owner?.inventory.find((i) => i.id === itemId);
  if (!owner || !it || !it.damaged) return;
  const mat = materialOf(it.name) ?? 'metal';
  const tool = REPAIR_TOOL[mat];
  const done = () => {
    delete it.damaged;
    delete it.wear;
  };
  if (method === 'artisan') {
    if (!d.place.settlement) return void log(d, 'There is no smith or artisan here: repairs for hire need a settlement.', 'warn');
    const gp = repairCost(it.name, it.valueGp);
    payGold(d, [ownerId], gp, `repairing the ${it.name}`);
    done();
    return void log(d, `A local artisan repairs the ${it.name} for ${fmtGp(gp)}, ready by the end of the day.`, 'good');
  }
  const m = charById(d, repairerId);
  if (!m) return;
  if (method === 'tools' && !m.inventory.some((i) => tool.match.test(i.name))) return void log(d, `${m.name} has no ${tool.label}.`, 'warn');
  if (method === 'improvised' && !d.settings.improvised) return void log(d, `${m.name} needs ${tool.label} (improvised attempts are off).`, 'warn');
  const proper = method === 'tools';
  advanceMut(d, ctx, REPAIR_MINUTES * (proper ? 1 : IMPROVISED_TIME), 'camp');
  const dc = REPAIR_DC + (proper ? 0 : IMPROVISED_DC);
  const r = d20('normal', ctx.rng);
  const total = r.value + bonus - 2 * m.exhaustion;
  const roll = `${proper ? tool.label : 'makeshift tools'} ${r.value} ${signed(bonus - 2 * m.exhaustion)} = ${total} against DC ${dc}`;
  if (total < dc) return void log(d, `${m.name} works on the ${it.name} (${roll}), but the repair won't hold.`, 'warn');
  done();
  log(d, `${m.name} repairs the ${it.name} (${roll}).`, 'good');
});

/** Storms and long voyages wear a ship's hull; enough wear leaves it damaged (half speed) until docked and repaired. */
function hullWear(s: State, v: Stash, hours: number, storm: boolean): void {
  if (!s.settings.gearWear || /airship/i.test(v.name)) return;
  const before = Math.floor(v.hullWear ?? 0);
  // Table rule: hired sailors keep up the ship underway, halving the slow wear of a long voyage.
  const tended = s.hirelings.some((h) => h.active && h.role === 'sailor') ? 0.5 : 1;
  v.hullWear = Math.round(((v.hullWear ?? 0) + (hours / 72) * tended + (storm ? 1 : 0)) * 100) / 100;
  if (!v.hullDamaged && v.hullWear >= HULL_LIMIT) {
    v.hullDamaged = true;
    log(s, `The ${v.name} is taking water and her rigging is frayed: she makes half speed until repaired at a dock (table rule).`, 'bad');
  } else if (Math.floor(v.hullWear) > before) log(s, `The ${v.name} shows the strain of the voyage (hull wear ${Math.floor(v.hullWear)}/${HULL_LIMIT}).`, 'warn');
}

export const repairHull = act((d, _ctx, stashId: string, payerIds: string[]) => {
  const v = d.stashes.find((x) => x.id === stashId);
  if (!v) return;
  if (!d.place.settlement) return void log(d, `The ${v.name} needs a dock or shipyard: repairs happen in a settlement.`, 'warn');
  const pts = Math.ceil(v.hullWear ?? 0);
  if (pts <= 0 && !v.hullDamaged) return void log(d, `The ${v.name} is sound.`);
  const { gp, days } = hullRepair(v.name, pts);
  payGold(d, payerIds, gp, `repairing the ${v.name}`);
  v.hullWear = 0;
  v.hullDamaged = false;
  log(d, `Shipwrights work on the ${v.name} for ${days} day${days > 1 ? 's' : ''} and she is sound again.`, 'good');
});

// ---------------------------------------------------------------- taxes, tithes and dues (table rule)

export const addDue = act((d, _ctx, o: { kind: DueKind; label: string; payerId: string; gp: number; share?: number; period: DuePeriod; firstInDays: number; collector: string; notes: string }) => {
  (d.dues ??= []).push({ id: uid(), kind: o.kind, label: o.label || DUE_PRESETS[o.kind].label, payerId: o.payerId, gp: Math.max(0, o.gp), share: o.share, period: o.period, nextDay: d.dayIndex + Math.max(1, Math.round(o.firstInDays)), collector: o.collector || DUE_PRESETS[o.kind].collector, missed: 0, active: true, notes: o.notes });
  log(d, `${o.label || DUE_PRESETS[o.kind].label} set up: ${o.share ? `${Math.round(o.share * 100)}% of income` : fmtGp(o.gp)} every ${o.period}, first due in ${Math.max(1, Math.round(o.firstInDays))} day(s).`);
});

export const removeDue = act((d, _ctx, id: string) => {
  d.dues = (d.dues ?? []).filter((x) => x.id !== id);
});

function duesDaily(s: State): void {
  if (!s.settings.duesAndTaxes) return;
  const today = s.dayIndex + 1;
  for (const due of s.dues ?? []) {
    if (!due.active || due.nextDay > today) continue;
    due.nextDay += PERIOD_DAYS[due.period];
    const payers = due.payerId === 'party' ? adventurers(s) : [charById(s, due.payerId)].filter((c): c is Character => !!c && alive(c));
    if (!payers.length) continue;
    const earned = payers.reduce((a, c) => a + (c.earnedGp ?? 0), 0);
    const amount = dueAmount(due, earned);
    if (due.share) for (const c of payers) c.earnedGp = 0;
    if (amount <= 0) {
      log(s, `${due.label} falls due, but there's nothing owed this time.`);
      continue;
    }
    if (!s.settings.chargeCosts) {
      log(s, `${due.label} falls due: ${fmtGp(amount)} to ${due.collector}.`);
      continue;
    }
    const share = Math.round((amount / payers.length) * 100) / 100;
    let short = false;
    for (const c of payers) {
      const can = Math.min(share, Math.max(0, c.gp));
      if (can > 0) spendWealth(c, can);
      if (can < share) {
        short = true;
        addDebtMut(s, c.id, due.collector, DUE_PRESETS[due.kind].creditor, Math.round((share - can) * 100) / 100);
      }
    }
    if (due.kind === 'tithe' && s.settings.piety) for (const c of payers) titheKept(s, c, !short, due.collector);
    if (!short) {
      due.missed = 0;
      log(s, `${payers.map((c) => c.name).join(', ')} pay${payers.length > 1 ? '' : 's'} ${due.label.toLowerCase()}: ${fmtGp(amount)} to ${due.collector} (table rule).`);
      continue;
    }
    due.missed += 1;
    log(s, `${due.label} can't be paid in full: the rest is owed to ${due.collector}. ${DUE_PRESETS[due.kind].missed}`, 'warn');
    if (due.kind === 'guild' && due.missed >= GUILD_EXPULSION) {
      due.active = false;
      log(s, `${due.collector} expels ${payers.map((c) => c.name).join(', ')} after ${GUILD_EXPULSION} missed payments: the guild's perks are lost.`, 'bad');
    }
  }
}

// ---------------------------------------------------------------- notoriety with the law (table rule)

function addHeatMut(s: State, place: string, severity: CrimeSeverity, charIds: string[], why: string): void {
  const name = place.trim() || 'this place';
  const crime = CRIMES[severity];
  let rec = (s.notoriety ??= []).find((n) => samePlace(n.place, name));
  if (!rec) {
    rec = { id: uid(), place: name, heat: 0, bountyGp: 0, charIds: [], lastCrimeDay: s.dayIndex, lastDecayDay: s.dayIndex, crimes: [] };
    s.notoriety.push(rec);
  }
  const before = heatLevel(rec.heat).level;
  rec.heat += crime.heat;
  rec.bountyGp += crime.bountyGp;
  rec.lastCrimeDay = s.dayIndex;
  rec.lastDecayDay = s.dayIndex;
  rec.crimes.unshift(`${stamp(s)}: ${why} (${crime.label.toLowerCase()})`);
  for (const id of charIds) if (!rec.charIds.includes(id)) rec.charIds.push(id);
  const lvl = heatLevel(rec.heat);
  log(s, `The law in ${name} wants answers for ${why}: heat ${rec.heat} (${lvl.label}), bounty ${fmtGp(rec.bountyGp)} (table rule). ${lvl.level !== before ? lvl.text : ''}`, lvl.level === 'hunted' || lvl.level === 'wanted' ? 'bad' : 'warn');
}

export const addCrime = act((d, _ctx, place: string, severity: CrimeSeverity, charIds: string[], why: string) => {
  addHeatMut(d, place, severity, charIds, why || CRIMES[severity].label.toLowerCase() + ' crime');
});

function wantedChars(s: State, n: { charIds: string[] }): Character[] {
  return n.charIds.length ? n.charIds.map((id) => charById(s, id)).filter((c): c is Character => !!c && alive(c)) : adventurers(s);
}

function notorietyDaily(s: State, ctx: Ctx): void {
  if (!s.settings.notoriety) return;
  const today = s.dayIndex + 1;
  for (const n of s.notoriety ?? []) {
    const here = s.place.settlement && samePlace(n.place, s.place.name);
    const every = here ? 7 : 4;
    if (n.heat > 0 && today - n.lastCrimeDay >= 7 && today - n.lastDecayDay >= every) {
      n.lastDecayDay = today;
      n.heat = Math.max(0, n.heat - HEAT_DECAY_PER_WEEK);
      if (n.heat === 0) {
        n.bountyGp = 0;
        log(s, `The law in ${n.place} has moved on to other troubles: the party is no longer sought there.`, 'good');
      } else log(s, `Heat in ${n.place} cools to ${n.heat} (${heatLevel(n.heat).label}).`);
    }
    if (!here || n.heat <= 0) continue;
    const lvl = heatLevel(n.heat);
    const roll = n.disguised ? Math.max(die(20, ctx.rng), die(20, ctx.rng)) : die(20, ctx.rng);
    if (roll > RECOGNISE_ON[lvl.level]) continue;
    const who = wantedChars(s, n);
    noticed(s, 'recognised', who, `${who.map((c) => c.name).join(', ')} ${who.length > 1 ? 'are' : 'is'} recognised in ${n.place} (${lvl.label}). ${lvl.level === 'suspected' ? 'A patrol stops and questions them for an hour.' : lvl.level === 'wanted' ? 'The watch moves to arrest them: surrender, pay the bounty as a fine, talk their way out or run.' : 'Bounty hunters are closing in: a hostile encounter on their terms.'}`, lvl.level === 'suspected' ? 'warn' : 'bad');
  }
  s.notoriety = (s.notoriety ?? []).filter((n) => n.heat > 0);
}

/** Bribing officials: 25 GP per point of current heat removes one point (table rule). */
export const bribeOfficials = act((d, _ctx, id: string, payerIds: string[]) => {
  const n = (d.notoriety ?? []).find((x) => x.id === id);
  if (!n || n.heat <= 0) return;
  const gp = BRIBE_GP_PER_HEAT * n.heat;
  payGold(d, payerIds, gp, `bribes in ${n.place}`);
  n.heat -= 1;
  n.lastDecayDay = d.dayIndex;
  log(d, `Coin changes hands in ${n.place}: heat falls to ${n.heat} (${heatLevel(n.heat).label}).`, 'good');
  if (n.heat <= 0) d.notoriety = (d.notoriety ?? []).filter((x) => x.id !== id);
});

/** Paying the bounty as a fine clears the party's name there. */
export const payBounty = act((d, _ctx, id: string, payerIds: string[]) => {
  const n = (d.notoriety ?? []).find((x) => x.id === id);
  if (!n) return;
  payGold(d, payerIds, n.bountyGp, `fines in ${n.place}`);
  d.notoriety = (d.notoriety ?? []).filter((x) => x.id !== id);
  log(d, `The fines are paid and the magistrate of ${n.place} considers the matter closed.`, 'good');
});

/** Surrendering: a day in jail per 10 GP of bounty, and the slate is clean. */
export const surrender = act((d, _ctx, id: string) => {
  const n = (d.notoriety ?? []).find((x) => x.id === id);
  if (!n) return;
  const days = jailDaysFor(n.bountyGp);
  const who = wantedChars(d, n);
  for (const c of who) {
    d.effects.push({ id: uid(), name: 'In jail', kind: 'other', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(d), endsAt: absNow(d) + days * MIN_PER_DAY, notes: `Serving time in ${n.place}.` });
    status(d, c, 'jailed', `${c.name} surrenders to the watch in ${n.place}: ${days} day${days > 1 ? 's' : ''} in the cells, then a clean slate (table rule).`, 'bad');
  }
  d.notoriety = (d.notoriety ?? []).filter((x) => x.id !== id);
});

// ---------------------------------------------------------------- contacts and relationships

function addContactMut(d: State, o: { name: string; role: string; place: string; bond: number; knownBy: string[]; notes: string; distanceMiles?: number }): void {
  (d.contacts ??= []).push({ id: uid(), name: o.name || 'Someone', role: o.role, place: o.place, distanceMiles: o.distanceMiles ?? 0, bond: clampBond(o.bond), knownBy: o.knownBy, lastHeardDay: d.dayIndex, owesParty: 0, partyOwes: 0, notes: o.notes });
}

export const addContact = act((d, _ctx, o: { name: string; role: string; place: string; bond: number; knownBy: string[]; notes: string; distanceMiles: number }) => {
  addContactMut(d, o);
  log(d, `${o.name || 'A new contact'} (${o.role}${o.place ? `, ${o.place}` : ''}) joins the party's acquaintances.`);
});

function contactsDaily(s: State): void {
  if (!s.settings.contactsFade) return;
  const today = s.dayIndex + 1;
  for (const k of s.contacts ?? []) {
    if (k.bond >= 1 && today - k.lastHeardDay >= NEGLECT_DAYS) {
      k.bond -= 1;
      k.lastHeardDay = today;
      const knowers = k.knownBy.map((id) => charById(s, id)).filter((c): c is Character => !!c);
      noticed(s, 'contactCools', knowers, `${k.name} hasn't heard from the party in ${NEGLECT_DAYS} days and cools toward them: now ${attitudeOf(k.bond)} (table rule).`, 'warn');
    }
  }
}

/** A visit, a drink or a letter delivered: the contact has heard from the party. */
export const keepInTouch = act((d, _ctx, id: string) => {
  const k = (d.contacts ?? []).find((x) => x.id === id);
  if (!k) return;
  k.lastHeardDay = d.dayIndex;
  // Table rule: time spent together warms the bond, once a month.
  const warm = k.bond < BOND_MAX && (k.lastWarmedDay == null || d.dayIndex - k.lastWarmedDay >= CATCH_UP_WARMS_EVERY_DAYS);
  if (warm) {
    k.bond = clampBond(k.bond + 1);
    k.lastWarmedDay = d.dayIndex;
  }
  log(d, `The party catches up with ${k.name}${warm ? `, and the time together counts: now ${attitudeOf(k.bond)} (bond ${signed(k.bond)}; table rule)` : ''}.`, warm ? 'good' : 'info');
});

/** Doing something for a contact: the bond grows and they owe the party a favor. */
export const doFavorFor = act((d, _ctx, id: string) => {
  const k = (d.contacts ?? []).find((x) => x.id === id);
  if (!k) return;
  if (k.partyOwes > 0) k.partyOwes -= 1;
  else k.owesParty += 1;
  k.bond = clampBond(k.bond + 1);
  k.lastHeardDay = d.dayIndex;
  log(d, `The party does ${k.name} a good turn: now ${attitudeOf(k.bond)}${k.owesParty ? `, owing the party ${k.owesParty} favor${k.owesParty > 1 ? 's' : ''}` : ''}.`, 'good');
});

export const adjustBond = act((d, _ctx, id: string, delta: number) => {
  const k = (d.contacts ?? []).find((x) => x.id === id);
  if (!k) return;
  k.bond = clampBond(k.bond + delta);
  log(d, `${k.name} is now ${attitudeOf(k.bond)} (bond ${signed(k.bond)}).`);
});

/**
 * Calling in a favor: automatic if they owe one, otherwise an Influence check (2024 DMG DCs: 10 Friendly,
 * 15 Indifferent, +5 for a big ask; Hostile contacts refuse). Afterward they won't help again for 30 days (table rule).
 */
export const callFavor = act((d, ctx, id: string, askerId: string, bonus: number, big: boolean, what: string) => {
  const k = (d.contacts ?? []).find((x) => x.id === id);
  const c = charById(d, askerId);
  if (!k || !c) return;
  const ask = what || 'a favor';
  if (d.settings.contactsFade && k.cooldownUntilDay != null && k.cooldownUntilDay > d.dayIndex) return void log(d, `${k.name} helped only recently and won't stick their neck out again for ${k.cooldownUntilDay - d.dayIndex} more day(s) (table rule).`, 'warn');
  const cool = () => {
    k.lastHeardDay = d.dayIndex;
    if (d.settings.contactsFade) k.cooldownUntilDay = d.dayIndex + FAVOR_COOLDOWN_DAYS;
  };
  if (k.owesParty > 0) {
    k.owesParty -= 1;
    cool();
    return void log(d, `${k.name} repays a favor owed: ${ask}.`, 'good');
  }
  const attitude = attitudeOf(k.bond);
  const dc = favorDC(attitude, big);
  if (dc == null) return void log(d, `${k.name} is Hostile and won't help ${c.name}.`, 'warn');
  const r = d20('normal', ctx.rng);
  const total = r.value + bonus - 2 * c.exhaustion;
  if (total >= dc) {
    k.partyOwes += 1;
    cool();
    return void log(d, `${k.name} agrees to ${ask} (Influence ${total} against DC ${dc}). The party now owes them one.`, 'good');
  }
  if (total <= dc - 5) k.bond = clampBond(k.bond - 1);
  log(d, `${k.name} won't help with ${ask} (Influence ${total} against DC ${dc})${total <= dc - 5 ? `, and is put out by the asking: now ${attitudeOf(k.bond)}` : ''}.`, 'warn');
});

// ---------------------------------------------------------------- letters and news

export const sendLetter = act((d, ctx, o: { charId: string; contactId: string | null; correspondent: string; miles: number; method: CommMethod; text: string; expectsReply: boolean }) => {
  const c = charById(d, o.charId);
  if (!c) return;
  const k = o.contactId ? (d.contacts ?? []).find((x) => x.id === o.contactId) : undefined;
  const to = k?.name ?? (o.correspondent.trim() || 'a friend');
  const miles = Math.max(0, o.miles);
  const info = COMMS[o.method];
  const delay = commDelay(o.method, miles);
  if (delay == null) return void log(d, `${info.label} can't carry a letter ${miles} miles (at most ${info.maxMiles}).`, 'warn');
  if (info.needs && info.needs !== 'messenger') {
    if (!c.spells.some((x) => x.name.toLowerCase() === info.needs!.toLowerCase())) return void log(d, `${c.name} doesn't know ${info.needs}.`, 'warn');
    const ritual = o.method === 'animal';
    if (!ritual && info.slotLevel && !useSlot(d, c, info.slotLevel, info.needs)) return;
    advanceMut(d, ctx, ritual ? 11 : 1, 'camp');
  }
  // Without a messenger of their own, a letter goes with a paid carrier at the messenger rate.
  const gp = o.method === 'courier' ? commCost('messenger', miles) : commCost(o.method, miles);
  const now = absNow(d);
  (d.letters ??= []).push({ id: uid(), direction: 'out', contactId: k?.id ?? null, correspondent: to, charId: c.id, method: o.method, miles, sentAt: now, arrivesAt: now + delay, costGp: gp, text: o.text, delivered: false, expectsReply: o.expectsReply });
  if (gp > 0) payGold(d, [c.id], gp, `a letter to ${to}`);
  log(d, `${c.name} sends a letter to ${to} by ${info.label.toLowerCase()} (${miles} miles): ${delay === 0 ? 'it arrives at once' : `it should arrive in ${formatDuration(delay)}`}.`);
  deliverLetters(d, ctx);
});

function deliverLetters(s: State, ctx: Ctx): void {
  const now = absNow(s);
  for (const l of [...(s.letters ?? [])]) {
    if (l.delivered || l.arrivesAt > now) continue;
    l.delivered = true;
    const k = l.contactId ? (s.contacts ?? []).find((x) => x.id === l.contactId) : undefined;
    const c = charById(s, l.charId);
    if (k) k.lastHeardDay = s.dayIndex;
    if (l.direction === 'out') {
      log(s, `${c?.name ?? 'The party'}'s letter reaches ${l.correspondent}${l.method === 'sending' || l.method === 'dream' ? '' : ` after ${formatDuration(Math.max(1, now - l.sentAt))}`}.`);
      if (l.expectsReply) {
        const back = commDelay(l.method === 'animal' || l.method === 'dream' ? 'courier' : l.method, l.miles) ?? 0;
        const writing = l.method === 'sending' ? 0 : die(REPLY_DIE, ctx.rng) * MIN_PER_DAY;
        (s.letters ??= []).push({ id: uid(), direction: 'in', contactId: l.contactId, correspondent: l.correspondent, charId: l.charId, method: l.method === 'animal' || l.method === 'dream' ? 'courier' : l.method, miles: l.miles, sentAt: now + writing, arrivesAt: now + writing + back, costGp: 0, text: '', delivered: false });
      }
    } else if (c) {
      status(s, c, 'letterArrives', `A letter from ${l.correspondent} reaches ${c.name}${l.text ? `: ${l.text}` : ' (the DM writes what it says)'}.`, 'good');
    }
  }
  s.letters = (s.letters ?? []).filter((l) => !l.delivered || now - l.arrivesAt < 60 * MIN_PER_DAY);
}

/** Something happened far away: word of it travels toward the party (table rule speed). */
export const addNews = act((d, _ctx, o: { text: string; place: string; miles: number; route: NewsRoute; daysAgo: number }) => {
  const now = absNow(d);
  const happenedAt = now - Math.max(0, o.daysAgo) * MIN_PER_DAY;
  const arrivesAt = d.settings.newsTravels ? happenedAt + newsDelay(o.route, Math.max(0, o.miles)) : happenedAt;
  (d.news ??= []).push({ id: uid(), text: o.text, place: o.place, miles: Math.max(0, o.miles), route: o.route, happenedAt, arrivesAt, delivered: false });
  if (arrivesAt > now) log(d, `DM note: news from ${o.place || 'afar'} will reach the party in ${formatDuration(arrivesAt - now)}.`);
  deliverNews(d);
});

function deliverNews(s: State): void {
  const now = absNow(s);
  for (const n of s.news ?? []) {
    if (n.delivered || n.arrivesAt > now) continue;
    n.delivered = true;
    const age = now - n.happenedAt;
    noticed(s, 'newsArrives', [], `News from ${n.place || 'afar'}${age >= MIN_PER_DAY ? `, ${formatDuration(age)} old` : ''}: ${n.text}`, 'info');
  }
  s.news = (s.news ?? []).filter((n) => !n.delivered || now - n.arrivesAt < 60 * MIN_PER_DAY);
}

// ---------------------------------------------------------------- settlements

/** The settlement the party is in, if it has been rolled up or set up. */
export const currentTown = (s: State): Town | undefined => (s.place.settlement ? (s.towns ?? []).find((t) => samePlace(t.name, s.place.name)) : undefined);

const townNamed = (d: State, name: string): Town | undefined => (d.towns ?? []).find((t) => samePlace(t.name, name));

/** Rolls up the settlement the party is in (2024 DMG Settlement Tables), replacing any earlier roll for it. */
export const rollTown = act((d, ctx, size: Settlement, water: boolean) => {
  const name = d.place.name.trim() || 'the settlement';
  const town = generateTown(name, size, water, ctx.rng);
  d.towns = [...(d.towns ?? []).filter((t) => !samePlace(t.name, name)), town];
  d.place.settlement = true;
  log(d, `${arrivalLine(town)} ${town.buildings.length} places of note.`, 'info');
});

/** Re-rolls one of a settlement's details on its DMG table. */
export const rerollTownDetail = act((d, ctx, townName: string, field: 'trait' | 'fame' | 'leader' | 'calamity' | 'noCalamity') => {
  const t = townNamed(d, townName);
  if (!t) return;
  if (field === 'trait') t.trait = rollTrait(ctx.rng);
  else if (field === 'fame') t.fame = rollFame(ctx.rng);
  else if (field === 'leader') {
    t.leader = rollLeader(ctx.rng);
    t.ruler = rollRuler(t.leader, t.size, ctx.rng);
  }
  else if (field === 'calamity') {
    t.calamity = rollCalamity(ctx.rng);
    log(d, `Trouble in ${t.name}: ${t.calamity}`, 'warn');
  } else {
    if (t.calamity) log(d, `${t.name} is past its troubles (${t.calamity.replace(/\.$/, '').toLowerCase()}).`, 'good');
    t.calamity = null;
  }
});

/** Changes a settlement's size; its buildings stay as they are. */
export const setTownSize = act((d, _ctx, townName: string, size: Settlement) => {
  const t = townNamed(d, townName);
  if (t) t.size = size;
});

/** Adds a building of a kind to a settlement, named and with a keeper. */
export const addTownBuilding = act((d, ctx, townName: string, type: string) => {
  const t = townNamed(d, townName);
  if (!t || !buildingType(type)) return;
  const b = newBuilding(type, ctx.rng, new Set(t.buildings.map((x) => x.name)), t.size);
  t.buildings = sortBuildings([...t.buildings, b]);
  log(d, `${t.name}: ${b.name} (${buildingType(type)!.label.toLowerCase()}, run by ${b.keeper.name}).`, 'info');
});

/** Removes a building: it burned down, closed, or the DM doesn't want it. */
export const removeTownBuilding = act((d, _ctx, townName: string, id: string) => {
  const t = townNamed(d, townName);
  const b = t?.buildings.find((x) => x.id === id);
  if (!t || !b) return;
  t.buildings = t.buildings.filter((x) => x.id !== id);
  log(d, `${t.name}: ${b.name} is gone.`, 'info');
});

/** Renames a building or its keeper. */
export const editTownBuilding = act((d, _ctx, townName: string, id: string, patch: { name?: string; keeper?: string }) => {
  const b = townNamed(d, townName)?.buildings.find((x) => x.id === id);
  if (!b) return;
  if (patch.name != null) b.name = patch.name;
  if (patch.keeper != null) b.keeper = { ...b.keeper, name: patch.keeper };
});

/** Forgets a settlement's roll. */
export const forgetTown = act((d, _ctx, townName: string) => {
  d.towns = (d.towns ?? []).filter((t) => !samePlace(t.name, townName));
});

/** Which NPC in a settlement: a building's keeper, the ruler, or an officer of the watch. */
export type TownNpcRef = { building: string } | { ruler: true } | { officer: number };

function townNpc(t: Town, ref: TownNpcRef): Npc | undefined {
  if ('building' in ref) return t.buildings.find((b) => b.id === ref.building)?.keeper;
  if ('ruler' in ref) return t.ruler;
  return t.security?.officers[ref.officer];
}

/** Rolls a new person for the job (2024 DMG Detailed NPCs), keeping the role and stat block. */
export const rerollTownNpc = act((d, ctx, townName: string, ref: TownNpcRef) => {
  const t = townNamed(d, townName);
  const old = t && townNpc(t, ref);
  if (!t || !old) return;
  const fresh: Npc = 'building' in ref ? rollKeeper(t.buildings.find((b) => b.id === ref.building)!.type, t.size, ctx.rng) : rollNpc(old.role ?? 'Townsfolk', old.stat ?? 'Commoner', 'any', ctx.rng);
  if ('building' in ref) t.buildings.find((b) => b.id === ref.building)!.keeper = fresh;
  else if ('ruler' in ref) t.ruler = rollRuler(t.leader, t.size, ctx.rng);
  else if (t.security) t.security.officers[ref.officer] = { ...fresh, role: old.role, stat: old.stat };
});

/** The party gets to know a townsperson: they join the contacts, with what the party can see (not their secret). */
export const townNpcToContact = act((d, _ctx, townName: string, ref: TownNpcRef) => {
  const t = townNamed(d, townName);
  const n = t && townNpc(t, ref);
  if (!t || !n) return;
  if ((d.contacts ?? []).some((k) => k.name === n.name && samePlace(k.place, t.name))) return void log(d, `${n.name} is already among the party's contacts.`, 'info');
  const where = 'building' in ref ? t.buildings.find((b) => b.id === ref.building)?.name : '';
  const role = [n.role, where].filter(Boolean).join(', ');
  addContactMut(d, { name: n.name, role, place: t.name, bond: 0, knownBy: [], notes: [n.appearance, n.traits?.join(', ')].filter(Boolean).join('. '), distanceMiles: 0 });
  log(d, `${n.name} (${role}, ${t.name}) joins the party's acquaintances.`);
});

/** A short description of an NPC, for the DM. */
export const describeNpc = (n: Npc): string => npcLine(n);


// ---------------------------------------------------------------- piety (table rule)

/** Changes a character's piety, logging what they feel and any change of rank. */
function pietyChange(s: State, c: Character, delta: number, why: string): void {
  const dv = c.devotion;
  if (!dv || !delta) return;
  const before = Piety.pietyRank(dv.piety);
  const fresh = Piety.giftRanksReached(dv.best, dv.piety + delta);
  dv.piety += delta;
  dv.best = Math.max(dv.best, dv.piety);
  if (delta > 0) dv.lastDevotionDay = s.dayIndex;
  dv.history = [`${stamp(s)}: ${signed(delta)}, ${why}`, ...dv.history].slice(0, 30);
  const after = Piety.pietyRank(dv.piety);
  const score = `piety ${signed(delta)}, now ${dv.piety}, ${after.label}; table rule`;
  if (after.id === 'estranged' && before.id !== 'estranged') {
    const gifts = s.effects.filter((e) => (dv.giftIds ?? []).includes(e.id)).map((e) => e.name);
    status(s, c, 'estranged', `${dv.deity} turns away from ${c.name}: ${why} (${score}). ${after.boon}${gifts.length ? ` The DM may withdraw the god’s gifts until they atone: ${gifts.join(', ')}.` : ''}${dv.office ? ` ${c.name}'s office as ${Priest.officeTitle(dv.office.rank, dv.office.path)} is suspended: no stipend and no say until they atone.` : ''}`, 'bad');
  } else if (after.min > before.min && after.id !== 'faithful') {
    status(s, c, 'pietyRankUp', `${c.name} is now ${after.label} in the eyes of ${dv.deity}: ${why} (${score}). ${after.boon}`, 'good');
  } else if (after.min !== before.min) {
    status(s, c, delta > 0 ? 'atoned' : 'pietyDown', `${c.name} is now ${after.label} in the eyes of ${dv.deity}: ${why} (${score}).`, delta > 0 ? 'good' : 'warn');
  } else {
    status(s, c, delta > 0 ? 'pietyUp' : 'pietyDown', `${dv.deity} ${delta > 0 ? 'is pleased with' : 'is displeased with'} ${c.name}: ${why} (${score}).`, delta > 0 ? 'good' : 'warn');
  }
  if (!s.settings.piety) return;
  for (const r of fresh) {
    dv.giftsDue = [...(dv.giftsDue ?? []).filter((x) => x !== r), r];
    log(s, `${dv.deity} offers ${c.name} ${Piety.RANK_GIFT[r].text} for becoming ${Piety.PIETY_RANKS.find((x) => x.id === r)!.label} (table rule). Grant it from the Piety card.`, 'good');
  }
}

/** The faith's faction, when the devotion is tied to one. */
function faithOf(s: State, c: Character): Faction | undefined {
  return c.devotion?.factionId ? s.factions.find((f) => f.id === c.devotion!.factionId) : undefined;
}

/** Ties a devotion to a tracked faction (the god's temple or church), or unties it. */
export const linkFaith = act((d, _ctx, charId: string, factionId: string | null) => {
  const c = charById(d, charId);
  if (!c?.devotion) return;
  c.devotion.factionId = factionId && d.factions.some((f) => f.id === factionId) ? factionId : null;
  const f = faithOf(d, c);
  if (f) log(d, `${c.name}'s deeds for ${c.devotion.deity} now count toward renown with ${f.name} (table rule).`);
});

/** Starts tracking the god's faith as a faction. Clerics, Paladins and acolytes are already members (renown 1). */
export const trackFaith = act((d, _ctx, charId: string, name: string) => {
  const c = charById(d, charId);
  if (!c?.devotion) return;
  const tie = Piety.divineTie(c);
  const renown = tie === 'cleric' || tie === 'paladin' || tie === 'acolyte' ? 1 : 0;
  const f: Faction = { id: uid(), name: name.trim() || `The faith of ${c.devotion.deity}`, renown, notes: `The church of ${c.devotion.deity}.` };
  d.factions.push(f);
  c.devotion.factionId = f.id;
  log(d, `${f.name} is tracked as a faction (renown ${renown}); ${c.name}'s deeds for ${c.devotion.deity} count toward it (table rule).`);
});

/** Grants the gift a rank earned: a Charm or Blessing on the Gifts card, remembered as the god's. */
export const grantPietyGift = act((d, _ctx, charId: string, rank: Piety.GiftRank, name: string, notes: string, type?: 'Charm' | 'Blessing') => {
  const c = charById(d, charId);
  const dv = c?.devotion;
  if (!c || !dv || !(dv.giftsDue ?? []).includes(rank) || !name.trim()) return;
  const g = Piety.RANK_GIFT[rank];
  const kind = type ?? g.type;
  const id = grantGiftMut(d, c.id, kind, name.trim(), kind === 'Charm' ? Math.max(1, g.uses) : 0, [`From ${dv.deity}.`, notes.trim()].filter(Boolean).join(' '));
  if (!id) return;
  dv.giftIds = [...(dv.giftIds ?? []), id];
  dv.giftsDue = (dv.giftsDue ?? []).filter((x) => x !== rank);
  dv.history = [`${stamp(d)}: ${kind} of ${name.trim()} from ${dv.deity}`, ...dv.history].slice(0, 30);
});

/** The DM settles a rank's gift another way (for the Chosen, the god acting directly once). */
export const settlePietyGift = act((d, _ctx, charId: string, rank: Piety.GiftRank, how: string) => {
  const c = charById(d, charId);
  const dv = c?.devotion;
  if (!c || !dv || !(dv.giftsDue ?? []).includes(rank)) return;
  dv.giftsDue = (dv.giftsDue ?? []).filter((x) => x !== rank);
  const what = how.trim() || 'a guaranteed Divine Intervention, once';
  dv.history = [`${stamp(d)}: ${what} from ${dv.deity}`, ...dv.history].slice(0, 30);
  log(d, `${dv.deity} grants ${c.name} ${what} (table rule).`, 'good');
});

/** Starts (or edits) a character's devotion to a god. A new devotion starts where the table rule says unless a score is given. */
export const setDevotion = act((d, _ctx, charId: string, o: { deity: string; ideals?: string; anathema?: string; piety?: number }) => {
  const c = charById(d, charId);
  const deity = o.deity.trim();
  if (!c || !deity) return;
  if (c.devotion) {
    Object.assign(c.devotion, { deity, ideals: o.ideals ?? c.devotion.ideals, anathema: o.anathema ?? c.devotion.anathema });
    return;
  }
  const piety = o.piety ?? Piety.startingPiety(Piety.divineTie(c));
  c.devotion = { deity, ideals: o.ideals?.trim() ?? '', anathema: o.anathema?.trim() ?? '', piety, best: piety, lastDevotionDay: d.dayIndex, history: [`${stamp(d)}: devoted to ${deity}, piety ${piety}`] };
  log(d, `${c.name} serves ${deity}: piety ${piety} (${Piety.pietyRank(piety).label}; table rule).`);
});

export const removeDevotion = act((d, _ctx, charId: string) => {
  const c = charById(d, charId);
  if (!c?.devotion) return;
  log(d, `${c.name} no longer tracks piety with ${c.devotion.deity}.`);
  c.devotion = null;
});

/** A deed for or against the god (the DM's call), weighed like DMG renown. */
export const pietyDeed = act((d, _ctx, charId: string, delta: number, why: string) => {
  const c = charById(d, charId);
  if (!c?.devotion || !delta) return;
  const text = why.trim() || (delta > 0 ? 'a deed in the god’s name' : 'a deed against the god’s ideals');
  pietyChange(d, c, Math.round(delta), text);
  const f = d.settings.piety ? faithOf(d, c) : undefined;
  const r = Piety.faithRenownDelta(Math.round(delta));
  if (f && r > 0) gainRenown(d, f, r, `${c.name}: ${text}`);
  if (f && r < 0) loseRenown(d, f, -r, `${c.name}: ${text}`, true);
});

/** Why a costly offering can't be made now, or null if it can. */
export function offeringBlocked(s: State, c: Character): string | null {
  const dv = c.devotion;
  if (!dv) return 'No god chosen.';
  if (dv.lastOfferingDay != null && s.dayIndex - dv.lastOfferingDay < Piety.OFFERING_EVERY_DAYS) return `The last offering was ${s.dayIndex - dv.lastOfferingDay} day(s) ago; the god expects devotion, not a stream of coin (once each ${Piety.OFFERING_EVERY_DAYS} days).`;
  if (c.gp < Piety.offeringGp(c.level)) return `An offering worth notice costs ${fmtGp(Piety.offeringGp(c.level))} (${Piety.OFFERING_GP_PER_LEVEL} GP per level).`;
  return null;
}

/** A costly offering at the god's altar: 25 GP per level, once each 30 days, worth +1 piety up to Devoted. */
export const makeOffering = act((d, _ctx, charId: string) => {
  const c = charById(d, charId);
  const dv = c?.devotion;
  if (!c || !dv || offeringBlocked(d, c)) return;
  const gp = Piety.offeringGp(c.level);
  payGold(d, [c.id], gp, `an offering to ${dv.deity}`);
  dv.lastOfferingDay = d.dayIndex;
  dv.lastDevotionDay = d.dayIndex;
  const gain = Piety.cappedGain(dv.piety, 1, Piety.OFFERING_PIETY_CAP);
  if (gain) pietyChange(d, c, gain, `a costly offering of ${fmtGp(gp)}`);
  else log(d, `${c.name} lays ${fmtGp(gp)} on the altar of ${dv.deity}. The priests are grateful, but gold alone won’t raise ${c.name} higher in the god’s eyes (table rule: offerings count up to piety ${Piety.OFFERING_PIETY_CAP}).`);
});

/** Atonement (a penance or quest the DM set) is done: an estranged character is welcomed back at piety 0. */
export const atone = act((d, _ctx, charId: string, why: string) => {
  const c = charById(d, charId);
  const dv = c?.devotion;
  if (!c || !dv || dv.piety >= 0) return;
  pietyChange(d, c, Piety.ATONED_PIETY - dv.piety, why.trim() || 'atonement completed');
});

/** Religious Service downtime: +1 piety a week, up to Favored; after that, the service still counts as devotion. */
function templeServicePiety(s: State, c: Character, weeks: number): void {
  const dv = c.devotion;
  if (!dv) return;
  dv.lastDevotionDay = s.dayIndex;
  const gain = Piety.cappedGain(dv.piety, Piety.SERVICE_PIETY_PER_WEEK * weeks, Piety.SERVICE_PIETY_CAP);
  if (gain) pietyChange(s, c, gain, `${weeks} week${weeks > 1 ? 's' : ''} of service in the temple`);
  // DMG group involvement: with renown 1+, days among the faith's members count toward the next point.
  if (dv.office) dv.office.dutyDays += Piety.SERVICE_INVOLVEMENT_DAYS_PER_WEEK * weeks;
  faithInvolvement(s, c, Piety.SERVICE_INVOLVEMENT_DAYS_PER_WEEK * weeks, `${c.name}'s weeks of service in the temple`);
}

/** DMG group involvement with the faith's faction: with renown 1+, days among its members count toward the next point. */
function faithInvolvement(s: State, c: Character, days: number, why: string): void {
  const f = faithOf(s, c);
  if (!f || f.renown < 1) return;
  f.involvementDays = (f.involvementDays ?? 0) + days;
  while (f.involvementDays >= involvementDaysNeeded(f)) {
    f.involvementDays -= involvementDaysNeeded(f);
    gainRenown(s, f, 1, why);
  }
}

/** A tithe paid counts as devotion; one missed costs piety. */
function titheKept(s: State, c: Character, paid: boolean, collector: string): void {
  if (!c.devotion) return;
  if (paid) c.devotion.lastDevotionDay = s.dayIndex;
  else pietyChange(s, c, -Piety.MISSED_TITHE_PIETY, `the tithe to ${collector} went unpaid`);
}

/** Neglect: 60 days with nothing done for the god costs 1 piety, but never takes it below 0. */
function pietyDaily(s: State): void {
  if (!s.settings.piety) return;
  const today = s.dayIndex + 1;
  for (const c of s.characters) {
    const dv = c.devotion;
    if (dv?.office && !s.place.settlement) dv.office.lastCheckDay += 1; // duties pause away from settlements (table rule)
    else if (dv?.office && alive(c) && today - dv.office.lastCheckDay >= Priest.OFFICE_MONTH) officeMonth(s, c);
    if (!dv || !alive(c) || today - dv.lastDevotionDay < Piety.NEGLECT_DAYS) continue;
    dv.lastDevotionDay = today;
    if (dv.piety > 0) pietyChange(s, c, -1, `${Piety.NEGLECT_DAYS} days with nothing done for the god`);
  }
}

// ---------------------------------------------------------------- rising in the priesthood (table rule)

/** What a character brings to a petition for the next rank. */
export function officeStanding(s: State, c: Character): Priest.Standing {
  const dv = c.devotion;
  return { renown: faithOf(s, c)?.renown ?? 0, piety: dv?.piety ?? 0, level: c.level, daysInRank: dv?.office ? s.dayIndex - dv.office.sinceDay : 0 };
}

/** Why the next rank can't be petitioned for now, or an empty list if it can. */
export function petitionBlocked(s: State, c: Character): string[] {
  const dv = c.devotion;
  if (!dv) return ['No god chosen.'];
  if (!faithOf(s, c)) return ['The faith must be tracked as a faction (for renown).'];
  if (dv.piety < 0) return ['Estranged: the hierarchy won’t hear them until they atone.'];
  const next = (dv.office?.rank ?? 0) + 1;
  if (next > Priest.TOP_RANK) return ['There is no higher office.'];
  const miss = Priest.missingFor(next, officeStanding(s, c));
  if (next === 1) return miss;
  if (Priest.OFFICES[next].dc === 0) return [...miss, 'This seat is filled only when it falls vacant: the DM decides.'];
  if (dv.office?.nextPetitionDay != null && dv.office.nextPetitionDay > s.dayIndex) miss.push(`the hierarchy will hear them again in ${dv.office.nextPetitionDay - s.dayIndex} day(s)`);
  return miss;
}

/** Suggested petition bonus: the better of Intelligence (Religion) and Charisma (Persuasion), when the sheet says. */
export function petitionBonus(c: Character): number {
  const pb = proficiencyBonus(c.level);
  const mod = (k: 'int' | 'cha') => {
    const sc = abilityScore(c, k);
    return sc == null ? 0 : abilityMod(sc);
  };
  const has = (sk: string) => (c.skillProfs ?? []).some((x) => x.toLowerCase() === sk);
  return Math.max(mod('int') + (has('religion') ? pb : 0), mod('cha') + (has('persuasion') ? pb : 0));
}

function setOfficeMut(s: State, c: Character, rank: number, path: Priest.OfficePath): void {
  const dv = c.devotion!;
  const today = s.dayIndex;
  dv.office = rank <= 0 ? null : { rank, path, sinceDay: today, dutyDays: 0, lastCheckDay: today, strikes: 0 };
  dv.history = [`${stamp(s)}: ${rank <= 0 ? 'left the hierarchy' : Priest.officeTitle(rank, path)}`, ...dv.history].slice(0, 30);
}

/** Joins the faith's hierarchy as an acolyte (or a squire of a holy order): renown 1 with the faith is enough. */
export const joinPriesthood = act((d, _ctx, charId: string, path: Priest.OfficePath) => {
  const c = charById(d, charId);
  const dv = c?.devotion;
  if (!c || !dv || dv.office || petitionBlocked(d, c).length) return;
  setOfficeMut(d, c, 1, path);
  log(d, `${c.name} takes vows as ${Priest.officeTitle(1, path)} of ${dv.deity} (table rule). ${Priest.OFFICES[1].does}`, 'good');
});

/** Petitions the hierarchy for the next rank: Intelligence (Religion) or Charisma (Persuasion) against the rank's DC. */
export const petitionOffice = act((d, ctx, charId: string, bonus: number) => {
  const c = charById(d, charId);
  const dv = c?.devotion;
  const o = dv?.office;
  if (!c || !dv || !o || petitionBlocked(d, c).length) return;
  const next = Priest.OFFICES[o.rank + 1];
  const adv = Priest.petitionAdvantage(o.rank + 1, dv.piety);
  const r = d20(adv ? 'advantage' : 'normal', ctx.rng);
  const total = r.value + bonus;
  const roll = `${r.rolls.join(' / ')}${adv ? ' with Advantage (piety)' : ''} ${signed(bonus)} = ${total} vs DC ${next.dc}`;
  if (total >= next.dc) {
    setOfficeMut(d, c, next.rank, o.path);
    status(d, c, 'pietyRankUp', `${c.name} is raised to ${next.title[o.path]} of ${dv.deity} (${roll}; table rule). ${next.does}`, 'good');
    return;
  }
  o.nextPetitionDay = d.dayIndex + Priest.PETITION_WAIT_DAYS;
  log(d, `The elders of ${dv.deity}'s faith are not yet persuaded that ${c.name} is ready to be ${next.title[o.path]} (${roll}). They will hear the petition again in ${Priest.PETITION_WAIT_DAYS} days.`, 'warn');
});

/** The DM places a character in an office directly (a vacancy filled, an omen, a demotion). 0 leaves the hierarchy. */
export const setOffice = act((d, _ctx, charId: string, rank: number, path?: Priest.OfficePath) => {
  const c = charById(d, charId);
  const dv = c?.devotion;
  if (!c || !dv) return;
  const r = Math.max(0, Math.min(Priest.TOP_RANK, Math.round(rank)));
  const p = path ?? dv.office?.path ?? 'clergy';
  setOfficeMut(d, c, r, p);
  log(d, r ? `${c.name} is now ${Priest.officeTitle(r, p)} of ${dv.deity}. ${Priest.OFFICES[r].does}` : `${c.name} leaves the hierarchy of ${dv.deity}'s faith.`, r ? 'good' : 'info');
});

/** Days of temple duty (or service to the order) as downtime: they count toward the month's duties and the faith's renown. */
export const templeDuty = act((d, ctx, charId: string, days: number) => {
  const c0 = charById(d, charId);
  if (!c0?.devotion?.office) return;
  const n = Math.max(1, Math.round(days));
  for (let i = 0; i < n; i++) {
    const o = charById(d, charId)?.devotion?.office;
    if (o) o.dutyDays += 1;
    Object.assign(d, downtimeDay(d, ctx, []));
  }
  const c = charById(d, charId)!;
  const dv = c.devotion!;
  if (!dv.office) return;
  dv.lastDevotionDay = d.dayIndex;
  log(d, `${c.name} spends ${n} day${n > 1 ? 's' : ''} at temple duties as ${Priest.officeTitle(dv.office!.rank, dv.office!.path)}: ${dv.office!.dutyDays}/${Priest.OFFICES[dv.office!.rank].dutyDays} this month.`);
  faithInvolvement(d, c, n, `${c.name}'s days of temple duty`);
});

/** The monthly reckoning: duties kept pay the stipend; three months missed in a row cost a step. */
function officeMonth(s: State, c: Character): void {
  const dv = c.devotion!;
  const o = dv.office!;
  const office = Priest.OFFICES[o.rank];
  const title = office.title[o.path];
  o.lastCheckDay = s.dayIndex + 1;
  const served = o.dutyDays;
  o.dutyDays = 0;
  if (dv.piety < 0) {
    log(s, `${c.name}'s office as ${title} stays suspended while ${dv.deity} is turned away: no stipend this month.`, 'warn');
    return;
  }
  if (served >= office.dutyDays) {
    o.strikes = 0;
    if (office.stipendGp > 0) {
      gainWealth(c, office.stipendGp);
      log(s, `${c.name} receives a ${title.toLowerCase()}'s stipend from the faith of ${dv.deity}: ${fmtGp(office.stipendGp)} (table rule).`, 'good');
    }
    return;
  }
  o.strikes += 1;
  if (o.strikes < Priest.STRIKES_TO_DEMOTE) {
    log(s, `${c.name} kept ${served} of ${office.dutyDays} days of duty as ${title} this month: no stipend, and the elders notice (${o.strikes}/${Priest.STRIKES_TO_DEMOTE}; table rule).`, 'warn');
    return;
  }
  const lower = o.rank - 1;
  setOfficeMut(s, c, Math.max(1, lower), o.path);
  log(s, `After ${Priest.STRIKES_TO_DEMOTE} months of neglected duties, the faith of ${dv.deity} takes ${c.name}'s office: ${title} no more, now ${Priest.officeTitle(Math.max(1, lower), o.path)} (table rule).`, 'bad');
}

// ---------------------------------------------------------------- paths to power: court and guild (table rule)

export const ladderPos = (c: Character, ladder: Ladder.LadderId): LadderPos | undefined => (c.ladders ?? []).find((p) => p.ladder === ladder);
const ladderFaction = (s: State, p: LadderPos): Faction | undefined => s.factions.find((f) => f.id === p.factionId);
const posTitle = (p: LadderPos, rank = p.rank): string => Ladder.rungTitle(p.ladder, rank, p.civic);

/** Guild masters' businesses do better: the bonus to Running a Business rolls (table rule). */
function guildBusinessBonus(s: State, c: Character): { bonus: number; title: string } | null {
  const p = ladderPos(c, 'guild');
  const bonus = s.settings.pathsToPower && p ? Ladder.LADDERS.guild.rungs[p.rank].businessBonus ?? 0 : 0;
  return bonus && p ? { bonus, title: posTitle(p) } : null;
}

/** The highest rank a character holds on any ladder, the priesthood included, and the social tier it gives. */
export function socialRank(c: Character): { rank: number; tier: (typeof Ladder.SOCIAL_TIER)[number]; from: string } {
  const opts: { rank: number; from: string }[] = [{ rank: 0, from: '' }];
  for (const p of c.ladders ?? []) opts.push({ rank: p.rank, from: posTitle(p) });
  if (c.devotion?.office && c.devotion.piety >= 0) opts.push({ rank: c.devotion.office.rank, from: Priest.officeTitle(c.devotion.office.rank, c.devotion.office.path) });
  const best = opts.reduce((a, b) => (b.rank > a.rank ? b : a));
  return { rank: best.rank, tier: Ladder.socialTier(best.rank), from: best.from };
}

/** Wealth for standing: gold on hand plus what the character's finished businesses are worth (table rule). */
export function ladderWealth(s: State, c: Character): number {
  return Math.round(c.gp + s.businesses.filter((b) => b.ownerId === c.id && !b.building).reduce((a, b) => a + businessValue(b), 0));
}

export function ladderStanding(s: State, c: Character, ladder: Ladder.LadderId): Ladder.LadderStanding {
  const p = ladderPos(c, ladder);
  return {
    renown: p ? ladderFaction(s, p)?.renown ?? 0 : 0,
    level: c.level,
    daysInRank: p ? s.dayIndex - p.sinceDay : 0,
    hasTool: p?.trade ? proficientWith(c, p.trade) : null,
    businesses: s.businesses.filter((b) => b.ownerId === c.id && !b.building).length,
    wealth: ladderWealth(s, c),
  };
}

/** Why the next rank can't be petitioned for now (empty: it can). Award-only ranks always say so. */
export function ladderBlocked(s: State, c: Character, ladder: Ladder.LadderId): string[] {
  const p = ladderPos(c, ladder);
  if (!p) return ['Not yet on this ladder.'];
  const next = Ladder.LADDERS[ladder].rungs[p.rank + 1];
  if (!next) return ['There is no higher rank.'];
  const miss = Ladder.ladderMissing(ladder, p.rank + 1, ladderStanding(s, c, ladder));
  if (next.way === 'award') miss.push(`${posTitle(p, next.rank)} is only ever granted: the DM awards it`);
  if (p.nextPetitionDay != null && p.nextPetitionDay > s.dayIndex) miss.push(`a new petition in ${p.nextPetitionDay - s.dayIndex} day(s)`);
  return miss;
}

/** Suggested petition bonus: Persuasion or History at court; the trade's tool (or Persuasion for elections) in the guild. */
export function ladderBonus(c: Character, ladder: Ladder.LadderId): number {
  const pb = proficiencyBonus(c.level);
  const mod = (k: 'int' | 'cha' | 'dex' | 'wis') => {
    const sc = abilityScore(c, k);
    return sc == null ? 0 : abilityMod(sc);
  };
  const has = (sk: string) => (c.skillProfs ?? []).some((x) => x.toLowerCase() === sk);
  const persuasion = mod('cha') + (has('persuasion') ? pb : 0);
  if (ladder === 'court') return Math.max(persuasion, mod('int') + (has('history') ? pb : 0));
  const p = ladderPos(c, 'guild');
  if (p && p.rank >= 3) return persuasion;
  const tool = p?.trade && proficientWith(c, p.trade) ? pb : 0;
  return Math.max(mod('int'), mod('dex'), mod('wis')) + tool;
}

/**
 * Puts a character on a rank. At court one title (a Mark of Prestige) grows with the rank: granted at Knight, raised
 * in place to Lord and Duke, lowered on a fall, and taken back below Knight. Each rank's lands come with it.
 */
function setRungMut(s: State, c: Character, p: LadderPos, rank: number, disgrace = false): void {
  const from = p.rank;
  Object.assign(p, { rank, sinceDay: s.dayIndex, lastCheckDay: s.dayIndex, dutyDays: 0, strikes: 0, nextPetitionDay: undefined });
  if (p.ladder !== 'court' || rank === from) return;
  const f = ladderFaction(s, p);
  const rungs = Ladder.LADDERS.court.rungs;
  // Lands of ranks no longer held go back.
  for (const l of (p.lands ?? []).filter((x) => x.rank > rank)) {
    const m = markById(s, l.id);
    if (m) takeBack(s, m, `no longer ${rungs[l.rank].title}`, 'bad', disgrace);
  }
  p.lands = (p.lands ?? []).filter((x) => x.rank <= rank);
  const title = p.titleId ? markById(s, p.titleId) : undefined;
  const r = rungs[rank];
  if (!r.titleRank) {
    if (title) takeBack(s, title, `no longer a ${rungs[3].title.toLowerCase()}`, 'bad', disgrace);
    p.titleId = undefined;
    return;
  }
  const name = `${r.title} (${f?.name ?? 'the court'})`;
  if (title && !title.revoked) {
    title.rank = r.titleRank;
    title.name = name;
    if (rank > from) title.trust = TRUST_MAX;
    log(s, `${c.name}'s title is ${rank > from ? 'raised' : 'lowered'} to ${name}.${TITLE_RANK[r.titleRank].lifestyle ? ` People now expect them to live ${LIFESTYLE_LABEL[TITLE_RANK[r.titleRank].lifestyle!]} or better.` : ''}`, rank > from ? 'good' : 'bad');
  } else {
    const m: Mark = { id: uid(), kind: 'title', name, holderIds: [c.id], grantor: f?.name ?? '', grantedDay: s.dayIndex, trust: TRUST_MAX, notes: '', rank: r.titleRank, ...(f ? { factionId: f.id } : {}) };
    s.marks.push(m);
    p.titleId = m.id;
    const life = TITLE_RANK[r.titleRank].lifestyle;
    log(s, `${c.name} kneels and rises as ${name}${f ? ` by ${f.name}` : ''}.${life ? ` People now expect them to live ${LIFESTYLE_LABEL[life]} or better.` : ''}`, 'good');
  }
  if (rank < from || !p.titleId) return;
  // Each rank climbed brings its own lands, tied to the title.
  for (let k = from + 1; k <= rank; k++) {
    const land = rungs[k].land;
    if (!land || p.lands!.some((x) => x.rank === k)) continue;
    const m: Mark = { id: uid(), kind: 'land', name: `Lands of the ${rungs[k].title.toLowerCase()} ${c.name}`, holderIds: [c.id], grantor: f?.name ?? '', grantedDay: s.dayIndex, trust: TRUST_MAX, notes: '', land, trouble: null, titleId: p.titleId, ...(f ? { factionId: f.id } : {}) };
    s.marks.push(m);
    p.lands!.push({ rank: k, id: m.id });
    log(s, `With the rank of ${rungs[k].title} come lands: ${LAND[land].label.toLowerCase()}.`, 'good');
  }
}

/** Tracks a court (a ruler) or a guild as a faction for a ladder, reusing one of the same name. */
export const trackInstitution = act((d, _ctx, name: string) => {
  rulerFaction(d, name);
});

/** Joins a ladder: presented at court, or indentured to a guild master. Joining makes them a member (renown at least 1). */
export const joinLadder = act((d, _ctx, charId: string, ladder: Ladder.LadderId, factionId: string, trade?: string) => {
  const c = charById(d, charId);
  const f = d.factions.find((x) => x.id === factionId);
  if (!c || !f || ladderPos(c, ladder)) return;
  (c.ladders ??= []).push({ ladder, factionId, rank: 1, sinceDay: d.dayIndex, dutyDays: 0, lastCheckDay: d.dayIndex, strikes: 0, trade: trade?.trim() || undefined });
  if (f.renown < 1) {
    log(d, `Renown with ${f.name} rises ${f.renown} → 1: ${c.name} is now a member.`, 'good');
    f.renown = 1;
  }
  const r = Ladder.LADDERS[ladder].rungs[1];
  log(d, ladder === 'court' ? `${c.name} is presented at ${f.name} as a ${r.title.toLowerCase()} (table rule). ${r.does}` : `${c.name} is indentured as an apprentice of ${f.name}${trade ? ` (${trade})` : ''} (table rule). ${r.does}`, 'good');
});

/** Petitions for the next rank: a check against its DC (Advantage when renown already meets the rank above). */
export const petitionLadder = act((d, ctx, charId: string, ladder: Ladder.LadderId, bonus: number) => {
  const c = charById(d, charId);
  const p = c && ladderPos(c, ladder);
  if (!c || !p || ladderBlocked(d, c, ladder).length) return;
  const next = Ladder.LADDERS[ladder].rungs[p.rank + 1];
  const f = ladderFaction(d, p);
  const adv = Ladder.ladderAdvantage(ladder, p.rank + 1, f?.renown ?? 0);
  const roll = d20(adv ? 'advantage' : 'normal', ctx.rng);
  const total = roll.value + bonus;
  const line = `${roll.rolls.join(' / ')}${adv ? ' with Advantage (renown)' : ''} ${signed(bonus)} = ${total} vs DC ${next.dc}`;
  const title = posTitle(p, next.rank);
  if (total >= next.dc) {
    setRungMut(d, c, p, next.rank);
    log(d, `${c.name} rises to ${title} of ${f?.name ?? LADDERS_INST(ladder)} (${line}; table rule). ${next.does}`, 'good');
    return;
  }
  p.nextPetitionDay = d.dayIndex + Ladder.LADDER_PETITION_WAIT_DAYS;
  log(d, `${f?.name ?? 'The institution'} is not yet ready to make ${c.name} ${title} (${line}). They may ask again in ${Ladder.LADDER_PETITION_WAIT_DAYS} days.`, 'warn');
});

const LADDERS_INST = (ladder: Ladder.LadderId) => Ladder.LADDERS[ladder].institution;

/** Awards a rank directly (a battlefield knighthood, an honorary mastership, a vacant seat): no requirements, no check. */
export const awardLadder = act((d, _ctx, charId: string, ladder: Ladder.LadderId, rank: number, why: string) => {
  const c = charById(d, charId);
  const p = c && ladderPos(c, ladder);
  if (!c || !p) return;
  const r = Math.max(1, Math.min(Ladder.TOP, Math.round(rank)));
  if (r === p.rank) return;
  const up = r > p.rank;
  setRungMut(d, c, p, r);
  const f = ladderFaction(d, p);
  const rung = Ladder.LADDERS[ladder].rungs[r];
  log(d, up ? `${f?.name ?? 'The powers that be'} award${f ? 's' : ''} ${c.name} the rank of ${posTitle(p)}${why.trim() ? `: ${why.trim()}` : ''} (table rule). ${rung.does}` : `${c.name} is reduced to ${posTitle(p)}${why.trim() ? `: ${why.trim()}` : ''}.`, up ? 'good' : 'bad');
});

/** Leaves a ladder (court titles from it are given up). */
export const leaveLadder = act((d, _ctx, charId: string, ladder: Ladder.LadderId) => {
  const c = charById(d, charId);
  const p = c && ladderPos(c, ladder);
  if (!c || !p) return;
  setRungMut(d, c, p, 0);
  c.ladders = (c.ladders ?? []).filter((x) => x !== p);
  log(d, `${c.name} leaves ${ladderFaction(d, p)?.name ?? LADDERS_INST(ladder)}.`);
});

/** Guild: switches between the guild's own offices and the town council (ranks 4 and 5). */
export const setCivic = act((d, _ctx, charId: string, civic: boolean) => {
  const p = charById(d, charId) && ladderPos(charById(d, charId)!, 'guild');
  if (p) p.civic = civic;
});

/** Days of duty (court attendance, guild business, council sittings) as downtime; they also count as time among the members. */
export const ladderDuty = act((d, ctx, charId: string, ladder: Ladder.LadderId, days: number) => {
  const c0 = charById(d, charId);
  if (!c0 || !ladderPos(c0, ladder)) return;
  const n = Math.max(1, Math.round(days));
  for (let i = 0; i < n; i++) {
    const p = ladderPos(charById(d, charId)!, ladder);
    if (p) p.dutyDays += 1;
    Object.assign(d, downtimeDay(d, ctx, []));
  }
  const c = charById(d, charId)!;
  const p = ladderPos(c, ladder);
  if (!p) return;
  const f = ladderFaction(d, p);
  log(d, `${c.name} spends ${n} day${n > 1 ? 's' : ''} on duties as ${posTitle(p)}: ${p.dutyDays}/${Ladder.LADDERS[ladder].rungs[p.rank].dutyDays} this month.`);
  if (f && f.renown >= 1) {
    f.involvementDays = (f.involvementDays ?? 0) + n;
    while (f.involvementDays >= involvementDaysNeeded(f)) {
      f.involvementDays -= involvementDaysNeeded(f);
      gainRenown(d, f, 1, `${c.name}'s days of service`);
    }
  }
});

/** Monthly duties, and a court rank lost when its title is taken back (trust gone). */
function laddersDaily(s: State): void {
  if (!s.settings.pathsToPower) return;
  const today = s.dayIndex + 1;
  for (const c of s.characters) {
    if (!alive(c)) continue;
    for (const p of c.ladders ?? []) {
      const title = p.titleId ? markById(s, p.titleId) : undefined;
      if (title?.revoked) {
        const was = posTitle(p);
        p.titleId = undefined;
        for (const l of p.lands ?? []) {
          const m = markById(s, l.id);
          if (m) takeBack(s, m, 'the title is gone', 'bad');
        }
        p.lands = [];
        Object.assign(p, { rank: 2, sinceDay: today, dutyDays: 0, lastCheckDay: today, strikes: 0 });
        log(s, `Stripped of the title, ${c.name} is ${was} no more: only an ${posTitle(p)} at court now (table rule).`, 'bad');
        continue;
      }
      // Table rule: days away from any settlement (on the road, in the wilds, below ground) don't count toward the month.
      if (!s.place.settlement) {
        p.lastCheckDay += 1;
        continue;
      }
      if (today - p.lastCheckDay < Ladder.LADDER_MONTH) continue;
      p.lastCheckDay = today;
      const rung = Ladder.LADDERS[p.ladder].rungs[p.rank];
      const need = rung.dutyDays;
      const served = p.dutyDays;
      p.dutyDays = 0;
      if (!need || served >= need) {
        p.strikes = 0;
        if (rung.incomeGp) {
          gainWealth(c, rung.incomeGp);
          log(s, `${c.name} collects the fees and tolls of a ${posTitle(p).toLowerCase()}: ${fmtGp(rung.incomeGp)} (table rule).`, 'good');
        }
        continue;
      }
      p.strikes += 1;
      const f = ladderFaction(s, p);
      if (p.strikes < Ladder.LADDER_STRIKES) {
        log(s, `${c.name} gave ${served} of ${need} days to duties as ${posTitle(p)} this month, and ${f?.name ?? 'their peers'} noticed (${p.strikes}/${Ladder.LADDER_STRIKES}; table rule).`, 'warn');
        continue;
      }
      const was = posTitle(p);
      setRungMut(s, c, p, Math.max(1, p.rank - 1), true);
      p.lastCheckDay = today;
      log(s, `After ${Ladder.LADDER_STRIKES} months of neglected duties, ${c.name} is ${was} no more: now ${posTitle(p)} (table rule).`, 'bad');
    }
  }
}

/** The DM awards an office in the faith directly (a vacancy, an omen, a reward), with no petition or requirements. */
export const awardOffice = act((d, _ctx, charId: string, rank: number, why: string) => {
  const c = charById(d, charId);
  const dv = c?.devotion;
  if (!c || !dv) return;
  const r = Math.max(1, Math.min(Priest.TOP_RANK, Math.round(rank)));
  const path = dv.office?.path ?? (c.className === 'Paladin' ? 'order' : 'clergy');
  setOfficeMut(d, c, r, path);
  log(d, `The faith of ${dv.deity} names ${c.name} ${Priest.officeTitle(r, path)}${why.trim() ? `: ${why.trim()}` : ''} (table rule). ${Priest.OFFICES[r].does}`, 'good');
});

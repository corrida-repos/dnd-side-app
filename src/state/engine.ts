import type { ActiveEffect, Activity, CharacterSpell, InventoryItem, LogEntry, Ritual, Stash, Bastion, Business, Character, FacilityWork, ExhaustionCause, Facility, MagicItem, Pace, PendingSave, Project, SaveKind, State, Tone } from './types';
import { BASIC_BUILD, BASTION_TURN_DAYS, defaultSize, ENLARGE, rollBastionEvent, SIZE_LABEL, SPECIAL_FACILITIES, type FacilitySize } from '../rules/bastion';
import { d20, die, combineModes, rollDice, rollExpr, signed, type Rng, type RollMode } from '../rules/dice';
import { dateFromIndex, formatClock, formatDate, formatDuration, lightAt, sunriseMinutes } from '../rules/calendar';
import { EXPLORATION_TURN_MINUTES, LIGHT_WARNING_MINUTES, type EffectPreset } from '../rules/effects';
import { divinationFailChance, SPELLBOOK_REPLACE } from '../rules/longterm';
import { LOST_RECHECK_DIE, navigationDC } from '../rules/navigation';
import { TERRAIN, clampPace } from '../rules/terrain';
import { readSky, SKY_DC } from '../rules/skyclock';
import { MESSENGER_GP_PER_MILE } from '../rules/hirelings';
import { COMMS, commCost, commDelay, type CommMethod } from '../rules/comms';
import { CONTAGIONS, RECUPERATE_DAYS, RECUPERATE_DC, SIGHT_ROT_CURE_HOURS, type ContagionKind } from '../rules/contagion';
import { neglectLimit } from '../rules/bastion';
import { magicItemCrafting, nonmagicalCrafting, SCROLL_CRAFTING, type Rarity } from '../rules/crafting';
import { ALL_IS_WELL, BARRACK_ROOM, BASTION_CHARMS, CREATURE_ROOM, EVENT_PREFERENCE, FACILITY_OPTIONS, GARDEN_PRODUCTS, GUILDS, MENAGERIE_CREATURES, MENAGERIE_ROOM, SHIPS, TRAINERS, TREASURE_TABLE, facilityHirelings, stableMarkup, storehouseLimit, storehouseMarkup, type GardenType } from '../rules/bastionOrders';
import { POISONS, poisonByName, poisonItemName } from '../rules/poisons';
import { POISON_HARVEST_DC, POTION_MISCIBILITY } from '../rules/potions';
import { AWAY_PROGRESS, BUILD_SPELLS, BUSINESS_DEBT_PENALTY, BUSINESS_MAX_DAYS, CREW_COST_SHARE, MAX_EXTRA_CREWS, buildPace, rollBusiness } from '../rules/business';
import { HAZARDS, type GiftType, type HazardId } from '../rules/hazards';
import { ARCANA_DC, STUDY_MINUTES, type StudyMethod } from '../rules/identify';
import { FEED_LB_PER_DAY, MOUNT_CAPACITY, carryingCapacity, COINS_PER_LB, estimateWeight, loadLevel, parseInventory, RATION_WEIGHT, type LoadLevel } from '../rules/encumbrance';
import { BUTCHER_DC, BUTCHER_MINUTES, isEdible, MEAT_LB, STRANGE_TYPES, yieldsHide, type Creature } from '../rules/hunting';
import { addCoins, COIN_GP, coinCount, coinsFor, emptyPurse, exchange, fmtPurse, purseValue, spend, type Denom, type Purse } from '../rules/coins';
import { detectContainer } from '../rules/containers';
import type { DdbImport } from '../rules/ddb';
import { FEED_GP_PER_DAY, HIRELING_WAGE, fmtGp, LIFESTYLE_GP, LIFESTYLE_LABEL, type MountPreset } from '../rules/money';
import { STABLE_WAKE_DIE, STABILIZE_DC } from '../rules/upkeep';
import { RITUAL_EXTRA_MINUTES as RITUAL_TAG_MINUTES, spellInfo } from '../rules/rituals';
import { maxWatchMinutes, slotTimes, watchMinutes, watchSight, type Sight } from '../rules/watch';
import { abilityMod, ATTUNE_AWAY_MINUTES, IDENTIFY_MINUTES, MAX_ATTUNED, RITUAL_EXTRA_MINUTES } from '../rules/upkeep';
import { fireThreat, rollWeather, temperatureAt, CLIMATES, weatherDamageAffinities, type Affinity } from '../rules/weather';
import {
  exhaustionSummary,
  foodNeedLb,
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
  TAINTED_POISON_MINUTES,
  BOIL_MINUTES,
} from '../rules/survival';
import { isCaster, PREP_RULE, preparedCount, preparedLimit } from '../rules/spells';
import { newCharacter, uid } from './defaults';
import { sense, type SenseKey } from '../rules/senses';
import { buildTable, checkModifiers, DANGER, DIFFICULTY_LABEL, firstSign, rollOnTable, SRD_POOL, type CheckConditions, type Danger, type EncounterCreature, type EncounterTable, type Party } from '../rules/encounters';
import type { TerrainType } from '../rules/terrain';

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
}

/** Charges gold to one or more characters, split evenly. Does nothing when charging costs is switched off. */
export function payGold(s: State, payerIds: string[], amount: number, what: string): void {
  if (!s.settings.chargeCosts || amount <= 0) return;
  let payers = payerIds.map((id) => charById(s, id)).filter((c): c is Character => !!c && c.kind !== 'mount');
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
  s.weather = rollWeather(
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

export function exposure(s: State, activity: Activity): Exposure {
  const magicShelter = activity !== 'travel' && s.effects.find((e) => e.shelter);
  if (magicShelter) return { cold: false, heat: false, reason: `Inside ${magicShelter.name}` };
  const indoors = s.place.shelter === 'building' || s.place.shelter === 'cave';
  if (activity !== 'travel' && indoors) return { cold: false, heat: false, reason: s.place.shelter === 'cave' ? 'Sheltered in a cave' : 'Indoors' };
  if (activity !== 'travel' && s.fire.lit && s.settings.fireWarmsCamp) return { cold: false, heat: true, reason: 'Warmed by the campfire' };
  return { cold: true, heat: true, reason: activity === 'travel' ? 'On the road' : s.place.shelter === 'tent' ? 'In a tent (still exposed to temperature)' : 'In the open' };
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
export const hasWarmCover = (c: Character): boolean => !!coldProtection(c, 'rest', true) || c.blanket;

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

function applySaveResult(s: State, c: Character, p: Omit<PendingSave, 'id' | 'stamp'>, passed: boolean, detail: string): void {
  log(s, `${c.name}: Constitution save, DC ${p.dc}, against ${p.reason}. ${detail}${passed ? 'Success.' : 'Failure.'}`, passed ? 'good' : 'warn');
  if (!passed) {
    if (p.kind === 'tainted') {
      c.poisonedUntil = absNow(s) + TAINTED_POISON_MINUTES;
      status(s, c, 'waterIllness', `${c.name} has a Waterborne illness from ${p.reason}: Poisoned for an hour (Disadvantage on attack rolls and ability checks).`, 'bad');
      return;
    }
    if (p.kind === 'raw') {
      c.sick = true;
      status(s, c, 'foodPoisoning', `${c.name} has Food poisoning from ${p.reason}: Poisoned (Disadvantage on attack rolls and ability checks) until they finish a Long Rest.`, 'bad');
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
  return { passed: total >= dc, detail: `Rolled ${r.rolls.join('/')}${modeTxt} ${signed(mod)}${exhTxt} = ${total}. ` };
}

function requestSave(s: State, ctx: Ctx, c: Character, kind: SaveKind, dc: number, mode: RollMode, reason: string): void {
  const spec = { charId: c.id, kind, dc, mode, reason };
  if (s.settings.autoRollSaves) {
    const r = rollSave(c, dc, mode, ctx.rng);
    applySaveResult(s, c, spec, r.passed, r.detail);
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
    applySaveResult(d, c, p, r.passed, r.detail);
  } else applySaveResult(d, c, p, outcome === 'pass', 'Entered by hand. ');
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

  const exp = exposure(s, activity);
  for (const c of s.characters) {
    if (!alive(c)) continue;
    if (exp.cold && temp <= 0 && !coldProtection(c, activity, s.settings.coldGear2014)) {
      const wrapped = c.blanket && activity === 'rest';
      requestSave(s, ctx, c, 'cold', 10, wrapped ? 'advantage' : 'normal', `extreme cold (${temp}°F)${wrapped ? ', wrapped in a Blanket' : ''}`);
    } else if (activity === 'rest' && exp.cold && s.settings.coldNights && temp <= s.settings.coldNightF && !hasWarmCover(c)) {
      c.nightChill = c.nightChill == null ? temp : Math.min(c.nightChill, temp);
    }
    if (exp.heat && temp >= 100) {
      if (!heatProtection(c, hasDrinkableWater(s, c, activity))) {
        c.heatHours += 1;
        requestSave(s, ctx, c, 'heat', 4 + c.heatHours, heatDisadvantage(c, s.settings.heavyClothing2014) ? 'disadvantage' : 'normal', `extreme heat (${temp}°F), hour ${c.heatHours}`);
      } else c.heatHours = 0;
    } else c.heatHours = 0;
  }
}

function dailyCosts(s: State): void {
  if (s.place.settlement) {
    const fed: string[] = [];
    for (const c of adventurers(s)) {
      if (c.lifestyle !== 'wretched') {
        c.ateLbToday = Math.max(c.ateLbToday, foodNeedLb(c));
        c.drankPintsToday = Math.max(c.drankPintsToday, waterNeedPints(c, false, false));
        fed.push(c.name);
      }
      const cost = LIFESTYLE_GP[c.lifestyle];
      const next = dateFromIndex(s.calendar, s.startYear, s.dayIndex + 1);
      const period = s.settings.lifestylePeriod;
      if (cost > 0) {
        if (period === 'day') payGold(s, [c.id], cost, `a day of ${LIFESTYLE_LABEL[c.lifestyle]} living`);
        else if (period === 'week' && (s.dayIndex + 1) % 7 === 0) payGold(s, [c.id], cost * 7, `a week of ${LIFESTYLE_LABEL[c.lifestyle]} living`);
        else if (period === 'month' && next.day === 1) payGold(s, [c.id], cost * next.month.days, `a month of ${LIFESTYLE_LABEL[c.lifestyle]} living`);
      }
    }
    if (fed.length) log(s, `Town living covers meals and lodging for ${fed.join(', ')}.`);
  }
  for (const h of s.hirelings) {
    if (h.active && h.wageGp > 0) payGold(s, h.payer === 'party' ? [] : [h.payer], h.wageGp, `${h.name}'s daily wage`);
  }
}

function endOfDay(s: State, ctx: Ctx): void {
  dailyCosts(s);
  groomTheMounts(s);
  checkRituals(s);
  const hotDay = s.weather.high >= 100;
  for (const c of s.characters) {
    if (!alive(c)) continue;
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
  log(s, `A new day begins: ${formatDate(s.calendar, s.startYear, s.dayIndex)}.`);
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
    it.attuned = false;
    status(s, c, 'attunementEnds', `${c.name} ends their attunement to the ${it.name}.`);
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
  return s.effects.some((e) => e.kind === 'light' && (e.endsAt == null || e.endsAt >= now + endsIn));
}

export interface WatchSlotInfo {
  from: number;
  to: number;
  watchers: { c: Character; sight: Sight; passive: number }[];
}

/** The watch plan as it would play out if the Long Rest started now. */
export function planWatches(s: State): WatchSlotInfo[] {
  const start = s.minutes % MIN_PER_DAY;
  const underground = !!CLIMATES[s.weather.climate].noWeather;
  const season = seasonOf(s);
  return slotTimes(start, s.watchPlan.count).map((t, i) => {
    const mid = ((t.from + t.to) / 2) % MIN_PER_DAY;
    const phase = lightAt(mid, season).phase;
    const lit = campLitFor(s, t.to - start);
    const ids = s.watchPlan.slots[i] ?? [];
    const watchers = ids
      .map((id) => actorById(s, id))
      .filter((c): c is Character => !!c && alive(c))
      .map((c) => {
        const sight = watchSight(phase, lit, c.darkvision, underground);
        return { c, sight, passive: c.passivePerception + (sight.blind ? 0 : sight.penalty) };
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
    if (c.poisonedUntil != null && now >= c.poisonedUntil) {
      c.poisonedUntil = null;
      status(s, c, 'waterIllnessEnds', `${c.name} recovers from the Waterborne illness and is no longer Poisoned.`, 'good');
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
export function advanceMut(s: State, ctx: Ctx, minutes: number, activity: Activity, opts: { exploring?: boolean } = {}): void {
  let remaining = Math.max(0, Math.round(minutes));
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
    tickContagions(s);
    if (s.minutes % 60 === 0) tickHour(s, ctx, activity);
    if (s.minutes >= MIN_PER_DAY) endOfDay(s, ctx);
    if (s.settings.encounters && activity !== 'work' && !opts.exploring) overlandEncounterClock(s, ctx, step, activity);
  }
}

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
  const check = canLongRest(d);
  if (!check.ok && !force) {
    log(d, check.reason ?? 'Cannot Long Rest yet.', 'warn');
    return;
  }
  log(d, 'The party settles in for a Long Rest (8 hours: at least 6 asleep, no more than 2 of light activity).');
  const watched = standWatches(d, ctx);
  d.restStart = absNow(d);
  advanceMut(d, ctx, 8 * 60, 'rest');
  d.restStart = null;
  completeLongRest(d, ctx, watched);
});

/** Everything that happens when a Long Rest finishes. */
function completeLongRest(d: State, ctx: Ctx, watched: Record<string, number>): void {
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
    if (c.exhaustion > 0 && !armorSpoiled && !restless) {
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
      status(d, c, 'foodPoisoningEnds', `${c.name} sleeps off the Food poisoning and is no longer Poisoned.`, 'good');
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
  return { mph: Math.round(mph * 10) / 10, note: notes.join('; ') };
}

/** The navigation DC right now, or null when following a road, river or coast. */
export function currentNavigationDC(s: State) {
  const dark = lightAt(s.minutes % MIN_PER_DAY, seasonOf(s)).phase === 'Night' || !!CLIMATES[s.weather.climate].noWeather;
  return navigationDC(s.place.onRoute ? null : TERRAIN[s.place.terrain].navigationDC, { heavyPrecip: s.weather.precip === 'heavy', dark, poorVisibilityRule: s.settings.poorVisibilityNav });
}

/** The navigator's Wisdom (Survival) check. Slow pace gives Advantage, Fast pace Disadvantage. */
function navigate(s: State, ctx: Ctx, nav: Character, pace: Pace): boolean | null {
  const { dc, reasons } = currentNavigationDC(s);
  if (dc == null) return null;
  const mode = combineModes(pace === 'slow' ? 'advantage' : 'normal', pace === 'fast' ? 'disadvantage' : 'normal');
  const r = d20(mode, ctx.rng);
  const mod = nav.survival - 2 * nav.exhaustion;
  const ok = r.value + mod >= dc;
  log(s, `${nav.name} navigates: Wisdom (Survival) ${r.rolls.join('/')} ${signed(mod)} = ${r.value + mod} against DC ${dc} (${reasons.join(', ')}). ${ok ? 'On course.' : 'The party strays off course without realising it.'}`, ok ? 'good' : 'warn');
  return ok;
}

export const travel = act((d, ctx, o: TravelOpts) => travelMut(d, ctx, o));

function travelMut(d: State, ctx: Ctx, o: TravelOpts): number {
  const vessel = o.vesselId ? d.stashes.find((x) => x.id === o.vesselId && x.speedMph) : undefined;
  if (vessel) return sail(d, ctx, vessel, o);
  if (o.flying && o.difficult) o = { ...o, difficult: false };
  const slow = slowTravelers(d);
  const allowed = slow.length ? 'slow' : o.flying ? o.pace : clampPace(o.pace, d.place.terrain, d.place.goodRoad);
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
  const nav = navId ? actorById(d, navId) : undefined;
  if (nav && alive(nav) && !d.travel.lost && navigate(d, ctx, nav, o.pace) === false) {
    d.travel.lost = true;
    d.travel.lostRecheckIn = die(LOST_RECHECK_DIE, ctx.rng);
  }
  const mounts = d.characters.filter((c) => c.kind === 'mount' && alive(c)).length;
  const riders = d.characters.filter((c) => c.kind !== 'mount' && alive(c)).length;
  let gallop = !!o.gallop;
  if (gallop && (mounts < riders || d.travel.gallopUsed)) {
    log(d, mounts < riders ? 'Not everyone has a mount, so the party can’t gallop.' : 'The mounts need a Short or Long Rest before they can gallop again.', 'warn');
    gallop = false;
  }
  for (let i = 0; i < o.hours; i++) {
    advanceMut(d, ctx, 60, 'travel');
    d.travel.hoursToday += altitude ? 2 : 1;
    const burst = gallop && i === 0 ? 2 : 1;
    if (burst === 2) {
      d.travel.gallopUsed = true;
      log(d, 'The mounts gallop for an hour, covering twice the distance.');
    }
    const step = p.mph * (o.difficult ? 0.5 : 1) * burst;
    miles += step;
    if (d.travel.lost) {
      offCourse += step;
      d.travel.lostRecheckIn -= 1;
      if (d.travel.lostRecheckIn <= 0 && nav && alive(nav)) {
        if (navigate(d, ctx, nav, o.pace) !== false) {
          d.travel.lost = false;
          log(d, `${nav.name} realises the party has gone astray and finds the way again, ${+(d.travel.milesOffCourse + offCourse).toFixed(1)} miles off course.`, 'good');
          d.travel.milesOffCourse = 0;
          offCourse = 0;
        } else d.travel.lostRecheckIn = die(LOST_RECHECK_DIE, ctx.rng);
      }
    }
    if (d.travel.hoursToday > 8) {
      const dc = 10 + (d.travel.hoursToday - 8);
      for (const c of d.characters) {
        if (alive(c)) requestSave(d, ctx, c, 'march', dc, 'normal', `a forced march (hour ${d.travel.hoursToday})`);
      }
    }
  }
  d.travel.milesToday += miles;
  if (d.travel.lost) d.travel.milesOffCourse += offCourse;
  if (offCourse > 0 && d.travel.lost) log(d, `${+offCourse.toFixed(1)} of those miles went the wrong way. The party is still lost.`, 'warn');
  log(d, `Covered ${+miles.toFixed(1)} miles. That makes ${+d.travel.milesToday.toFixed(1)} miles and ${d.travel.hoursToday} travel hour(s) since the last Long Rest.`);
  const stageDays = Math.max(1, Math.round(o.hours / 8));
  for (const id of o.foragerIds) {
    const c = charById(d, id);
    if (c) doForage(d, ctx, c, o.pace, stageDays);
  }
  return d.travel.lost ? 0 : miles;
}

/** Travel aboard a vessel: its own speed, no travel pace, and no forced march (the crew works in shifts). */
function sail(d: State, ctx: Ctx, v: Stash, o: TravelOpts): number {
  const { mph, note } = vesselSpeed(d, v, o);
  if (mph <= 0) {
    log(d, `The ${v.name} goes nowhere: ${note}.`, 'warn');
    return 0;
  }
  log(d, `Aboard the ${v.name}, the party travels for ${o.hours} hour(s) at ${mph} mph${note ? ` (${note})` : ''}.`);
  advanceMut(d, ctx, o.hours * 60, 'camp');
  const miles = Math.round(mph * o.hours * 10) / 10;
  d.travel.milesToday += miles;
  log(d, `The ${v.name} covers ${miles} miles.`);
  return miles;
}

/** Search or track: Wisdom (Perception) or Wisdom (Survival) against the terrain's search DC. */
export const searchCheck = act((d, ctx, charId: string, what: 'search' | 'track', bonus: number) => {
  const c = actorById(d, charId);
  if (!c) return;
  const dc = TERRAIN[d.place.terrain].searchDC;
  const r = d20('normal', ctx.rng);
  const total = r.value + bonus - 2 * c.exhaustion;
  log(d, `${c.name} ${what === 'track' ? 'looks for tracks: Wisdom (Survival)' : 'searches: Wisdom (Perception)'} ${r.value} ${signed(bonus - 2 * c.exhaustion)} = ${total} against DC ${dc} (${TERRAIN[d.place.terrain].label}). ${total >= dc ? 'Found!' : 'Nothing.'}`, total >= dc ? 'good' : 'warn');
});

/** Runs a planned journey stage day by day: travel up to 8 hours, then (optionally) eat, drink and Long Rest overnight. */
export const runStage = act((d, ctx, stageId: string, o: Omit<TravelOpts, 'hours' | 'difficult'>, camp: boolean) => {
  // Look the stage up afresh each day: resting swaps in a new copy of the state.
  const stage = () => d.journey.find((x) => x.id === stageId);
  const first = stage();
  if (!first || first.done) return;
  Object.assign(d.place, { terrain: first.terrain, onRoute: first.onRoute, goodRoad: first.goodRoad });
  log(d, `Journey stage: ${first.name} (${first.miles - first.milesDone} miles to go, ${TERRAIN[first.terrain].label}).`);
  for (let day = 0; day < 60 && stage()!.milesDone < stage()!.miles; day++) {
    const st = stage()!;
    const vessel = o.vesselId ? d.stashes.find((x) => x.id === o.vesselId && x.speedMph) : undefined;
    const pace = clampPace(o.pace, st.terrain, st.goodRoad);
    const mph = vessel ? Math.max(0.1, vesselSpeed(d, vessel, o).mph) : PACES[pace].mph * (st.difficult ? 0.5 : 1);
    const hours = Math.max(1, Math.min(vessel ? 24 : 8, Math.ceil((st.miles - st.milesDone) / mph)));
    const covered = travelMut(d, ctx, { ...o, pace, hours, difficult: st.difficult });
    st.milesDone = Math.min(st.miles, Math.round((st.milesDone + covered) * 10) / 10);
    if (st.milesDone >= st.miles || !camp) break;
    const eaten = partyEat(d, ctx, 'topup');
    Object.assign(d, partyDrink(eaten, ctx, 'topup'));
    if (d.minutes % MIN_PER_DAY < 22 * 60) advanceMut(d, ctx, 22 * 60 - (d.minutes % MIN_PER_DAY), 'camp');
    Object.assign(d, longRest(d, ctx, false));
    if (d.minutes % MIN_PER_DAY < 7 * 60) advanceMut(d, ctx, 7 * 60 - (d.minutes % MIN_PER_DAY), 'camp');
  }
  const done = stage()!;
  if (done.milesDone >= done.miles) {
    done.done = true;
    log(d, `Stage complete: ${done.name}.`, 'good');
  }
});

// ---------------------------------------------------------------- foraging, fire, food

function doForage(s: State, ctx: Ctx, c: Character, pace: Pace | null, days = 1): void {
  if (!alive(c)) return;
  const dc = TERRAIN[s.place.terrain].forageDC;
  const mode = combineModes(pace === 'slow' ? 'advantage' : 'normal', pace === 'fast' ? 'disadvantage' : 'normal');
  const r = d20(mode, ctx.rng);
  const total = r.value + c.survival - 2 * c.exhaustion;
  if (total >= dc) {
    // Food and water found per day of the journey stage.
    const food = Math.max(0, die(6, ctx.rng) + c.wisMod) * days;
    const water = Math.max(0, die(6, ctx.rng) + c.wisMod) * days;
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

export const lightFire = act((d, ctx) => {
  if (d.fire.lit) return;
  if (d.fire.fuelHours <= 0) {
    log(d, 'There is no fuel to light a fire. Gather wood first.', 'warn');
    return;
  }
  const threat = fireThreat(d.weather, tempNow(d));
  const indoors = d.place.shelter === 'building' || d.place.shelter === 'cave';
  if (threat && !d.fire.sheltered && !indoors) {
    log(d, `The ${threat} keeps putting the flame out. Shelter the fire pit first.`, 'warn');
    return;
  }
  advanceMut(d, ctx, 1, 'camp');
  d.fire.lit = true;
  log(d, 'You light a campfire with a Tinderbox (1 minute).', 'good');
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
});

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
 * Unpurified water: DC 10 Con save or Poisoned for an hour.
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
  let cookedUnsafe = 0;
  for (const c of d.characters) {
    if (!alive(c) || !c.needsFood) continue;
    const got = takeFood(d, c, foodNeedLb(c) / 2, 'cook');
    cookedUnsafe += got.unsafe;
    if (got.amount > 0) eaters.push(c.name);
  }
  let flavor = '';
  if (cook) {
    const bonus = cook.wisMod + (cook.cooksUtensils ? proficiencyBonus(cook.level) : 0) - 2 * cook.exhaustion;
    const r = d20('normal', ctx.rng);
    const ok = r.value + bonus >= 10;
    flavor = ` ${cook.name} cooks: Wisdom with Cook's Utensils ${r.value} ${signed(bonus)} = ${r.value + bonus} against DC 10, ${ok ? 'a delicious meal' : 'edible, at least'}.`;
  }
  const dish = d.recipeNames.length ? ` On the menu: ${d.recipeNames[absNow(d) % d.recipeNames.length]}.` : '';
  const purified = cookedUnsafe > 0 ? ` Cooking makes the ${fmtLb(round2(cookedUnsafe))} of raw food safe to eat.` : '';
  log(d, eaters.length ? `A hot meal at the campfire for ${eaters.join(', ')} (half a day's food each).${dish}${purified}${flavor}` : `Nothing to cook: the stores and rations are empty.${flavor}`, eaters.length ? 'good' : 'warn');
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

export const boilWater = act((d, ctx) => {
  if (!d.fire.lit) {
    log(d, 'You need a lit fire and a pot to boil water.', 'warn');
    return;
  }
  const water = d.stores.waterUnsafeGal;
  const skins = d.characters.filter((c) => c.waterUnsafe).length;
  if (!water && !skins) {
    log(d, 'There is no unpurified water to boil.');
    return;
  }
  advanceMut(d, ctx, BOIL_MINUTES, 'camp');
  d.stores.waterGal = round2(d.stores.waterGal + water);
  d.stores.waterUnsafeGal = 0;
  for (const c of d.characters) c.waterUnsafe = false;
  log(d, `The party boils water over the campfire (${BOIL_MINUTES} minutes, table rule): ${water ? `${water} gal of stores` : ''}${water && skins ? ' and ' : ''}${skins ? `${skins} waterskin(s)` : ''} now safe to drink.`, 'good');
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
  advanceMut(d, ctx, 8 * 60, 'work');
  for (const p of projects) progress(d, p);
});

/** Project kinds that are hands-on work hired artisans can help with. */
export const ARTISAN_KINDS: Project['kind'][] = ['nonmagical', 'potion'];

function progress(s: State, p: Project): void {
  const hired = ARTISAN_KINDS.includes(p.kind) ? (p.hiredArtisans ?? 0) : 0;
  const crafters =
    p.charIds.filter((id) => {
      const c = charById(s, id);
      return c && alive(c);
    }).length + hired;
  if (hired > 0) payGold(s, p.charIds, hired * HIRELING_WAGE.skilled, `${hired} hired artisan${hired > 1 ? 's' : ''} on ${p.name}`);
  // Normally only one other character can help (the DM can allow more).
  const amount = Math.max(1, s.settings.extraCraftHelpers ? crafters : Math.min(2, crafters));
  p.daysDone = Math.min(p.daysRequired, p.daysDone + amount);
  if (p.daysDone >= p.daysRequired) progressFinish(s, p);
  else log(s, `A day's work on ${p.name}: ${p.daysDone}/${p.daysRequired} workdays.`);
}

function progressFinish(s: State, p: Project): void {
  {
    p.done = true;
    log(s, `Downtime project complete: ${p.name}.`, 'good');
    if (p.kind === 'activity' && p.notes) log(s, `${p.name} is done. Make the check: ${p.notes}. The DM decides the outcome.`);
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
  progressFinish(d, np);
});

/** One full downtime day: work 8 hours, eat and drink, then Long Rest from 23:00. */
export const downtimeDay = act((d, ctx, projectIds: string[]) => {
  const projects = d.projects.filter((p) => projectIds.includes(p.id) && !p.done);
  advanceMut(d, ctx, 8 * 60, 'work');
  for (const p of projects) progress(d, p);
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
export const harvestPoison = act((d, ctx, charId: string, bonus: number, creature: string) => {
  const c = charById(d, charId);
  if (!c || !alive(c)) return;
  const mins = die(6, ctx.rng);
  advanceMut(d, ctx, mins, 'camp');
  const r = d20('normal', ctx.rng);
  const total = r.value + bonus - 2 * c.exhaustion;
  const name = creature || 'the creature';
  const me = charById(d, charId)!;
  if (total >= POISON_HARVEST_DC) {
    me.inventory.push({ id: uid(), name: `Poison dose (${name})`, qty: 1, weight: 0, source: 'manual', valueGp: 0, container: null, ammo: null });
    log(d, `${me.name} works over ${name} for ${mins} min with a Poisoner's Kit: Int (Nature) ${r.value} ${signed(bonus - 2 * c.exhaustion)} = ${total} vs DC ${POISON_HARVEST_DC}. One dose harvested; nothing more can be taken from it.`, 'good');
  } else if (total <= POISON_HARVEST_DC - 5) {
    log(d, `${me.name} botches the harvest from ${name} (${total} vs DC ${POISON_HARVEST_DC}, failed by 5 or more) and is exposed to its poison. Apply the creature's poison effect.`, 'bad');
  } else {
    log(d, `${me.name} spends ${mins} min on ${name} but can't extract any poison (${total} vs DC ${POISON_HARVEST_DC}).`, 'warn');
  }
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
export const exposeContagion = act((d, ctx, charId: string, kind: ContagionKind, rollToResist: boolean) => {
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
});

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
export const applySightRotOintment = act((d, ctx, charId: string, makerId: string) => {
  const c = charById(d, charId);
  const maker = charById(d, makerId);
  const x = c?.contagions.find((k) => k.kind === 'sightRot');
  if (!c || !x || !maker) return;
  advanceMut(d, ctx, 60, 'camp');
  const nx = charById(d, charId)!.contagions.find((k) => k.id === x.id);
  if (!nx) return;
  const now = absNow(d);
  // Reapplying early: credit the hours the last dose has already covered.
  if (nx.suppressedUntil) nx.suppressedHours = (nx.suppressedHours ?? 0) + Math.floor((now - (nx.suppressedUntil - 24 * 60)) / 60);
  nx.suppressedUntil = now + 24 * 60;
  log(d, `${maker.name} spends an hour with an Herbalism Kit and applies the ointment to ${c.name}'s eyes. Sight returns for 24 hours (${nx.suppressedHours ?? 0}/72 hours treated so far).`, 'good');
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
  if (r.passed) c.recuperatedUntil = absNow(d) + 24 * 60;
});

// ---------------------------------------------------------------- businesses

export const addBusiness = act((d, _ctx, name: string, ownerId: string, gpPerDay: number, build?: { what: string; costGp: number; days: number; landGp: number }) => {
  const b: Business = { id: uid(), name: name || 'Business', ownerId, gpPerDay: Math.max(0, gpPerDay), daysWorked: 0, debts: 0, unpaidGp: 0, netGp: 0, lastResult: '', notes: '' };
  if (build) {
    b.building = { what: build.what, costGp: build.costGp, totalDays: Math.max(1, Math.round(build.days)), daysDone: 0 };
    b.overseeing = true;
    const total = build.costGp + build.landGp;
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
  const r = rollBusiness(ctx.rng, days, b.gpPerDay, b.debts);
  const penalty = b.debts ? ` − ${b.debts * BUSINESS_DEBT_PENALTY} for unpaid debts` : '';
  log(d, `${b.name}: d100 ${r.roll} + ${days} days${penalty} = ${r.total}. ${r.text}.`, r.payGp > 0 ? 'warn' : r.profitGp > 0 ? 'good' : 'info');
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
  return (b.defenders ?? 0) + (b.menagerie ?? []).filter((m) => m.defends).length + (b.guests ?? []).filter((g) => g.kind === 'mercenary').length;
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
    case 'Workshop/magic': {
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
      if (bastionDefenders(b) - (b.menagerie ?? []).filter((m) => m.defends).length >= barrackRoom(b)) {
        log(s, `${b.name}: the Barracks are full (${barrackRoom(b)}), so the Recruit order can't be given.`, 'warn');
        return null;
      }
      break;
    case 'Menagerie/creature': {
      const c = MENAGERIE_CREATURES.find((x) => (plan.choice ?? '').startsWith(x.name)) ?? MENAGERIE_CREATURES[0];
      const used = (b.menagerie ?? []).reduce((a, m) => a + CREATURE_ROOM[m.size], 0);
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
      days = 14;
      break;
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
      return done(`the animals are bought and stabled. Add them on the Money & Mounts tab when they join the party.`);
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
      return done(`the archivist has found what Legend Lore would reveal about "${p.text || 'the topic'}". Ask the DM.`);
    case 'Pub/spies':
      return done(`the spies report on events within 10 miles${p.text ? ` and on ${p.text}'s whereabouts over the last 7 days (if within 50 miles and not hidden by magic)` : ''}. Ask the DM.`);
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
      const rolls = Array.from({ length: 6 }, () => die(sides, ctx.rng));
      const ones = rolls.filter((r) => r === 1).length;
      const had = bastionDefenders(b);
      if (b.armoryStocked) b.armoryStocked = false;
      if (had === 0) {
        const f = randomFacility();
        if (f) f.shutTurns = 1;
        return say(`A hostile force attacks and is beaten off, but with no defenders the ${f?.name ?? 'Bastion'} is damaged and shut down for the next turn (repaired free after).`, 'bad');
      }
      say(`A hostile force attacks and is defeated. 6d${sides}: ${rolls.join(', ')}${sides === 8 ? ' (stocked Armory, now used up)' : ''}.`, ones ? 'bad' : 'warn');
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

export const changeHp = act((d, _ctx, charId: string, amount: number) => {
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
  if (!c || !c.dying || c.diedAt != null) return;
  const r = die(20, ctx.rng);
  if (r === 20) {
    c.hp = 1;
    wakeUp(d, c, 'a natural 20 on a death save');
    status(d, c, 'wakesFromStable', `${c.name} rolls a 20 on the death save and is back on their feet with 1 HP!`, 'good');
    return;
  }
  if (r === 1) return addDeathFailures(d, c, 2, 'a natural 1 on a death save');
  if (r >= 10) {
    c.deathSuccesses += 1;
    log(d, `${c.name} death save: ${r}, a success (${c.deathSuccesses}/3).`, 'good');
    if (c.deathSuccesses >= 3) makeStable(d, ctx, c, 'three death save successes');
  } else addDeathFailures(d, c, 1, `a death save of ${r}`);
});

/** Stabilize with a Wisdom (Medicine) check, or automatically (Healer's Kit, Spare the Dying). */
export const stabilize = act((d, ctx, charId: string, helperId: string | null, method: 'medicine' | 'sure', medicineBonus?: number) => {
  const c = charById(d, charId);
  if (!c || !c.dying || c.diedAt != null) return;
  const helper = helperId ? actorById(d, helperId) : undefined;
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
    makeStable(d, ctx, c, `${helper ? `${helper.name} used ` : ''}a Healer's Kit or Spare the Dying`);
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
}

export const addEffect = act((d, _ctx, ne: NewEffect) => {
  const now = absNow(d);
  const conc = !!ne.preset.concentration;
  if (conc && ne.casterId) {
    const dropped = d.effects.filter((e) => e.concentration && e.casterId === ne.casterId);
    if (dropped.length) {
      d.effects = d.effects.filter((e) => !dropped.includes(e));
      const caster = charById(d, ne.casterId);
      log(d, `${caster?.name ?? 'The caster'} stops concentrating on ${dropped.map((e) => e.name).join(', ')}.`, 'warn');
    }
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
  log(d, `${caster ? `${caster.name}: ` : ''}${e.name}${effectWho(d, e)} begins${e.endsAt == null ? ' (until ended)' : `, lasting ${formatDuration(e.endsAt - now)}`}${conc ? ' (Concentration)' : ''}.`);
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
  if (who) {
    const r = d20('normal', ctx.rng);
    const total = r.value + who.survival - 2 * who.exhaustion;
    const ok = total >= BUTCHER_DC;
    if (!ok) meat = Math.round(meat / 2);
    checkTxt = ` ${who.name} butchers: Wisdom (Survival) ${r.value} ${signed(who.survival - 2 * who.exhaustion)} = ${total} against DC ${BUTCHER_DC}, ${ok ? 'a clean job' : 'half the meat is wasted'}.`;
  }
  d.stores.foodRawLb = Math.round((d.stores.foodRawLb + meat) * 100) / 100;
  let hide = '';
  if (yieldsHide(cr)) {
    const name = `Hide (${cr.name})`;
    const m = d.materials.find((x) => x.name === name);
    if (m) m.qty += count;
    else d.materials.push({ id: uid(), name, qty: count, unit: 'hide', valueGp: cr.size === 'Medium' ? 1 : cr.size === 'Large' ? 5 : 20 });
    hide = ` ${count} hide${count > 1 ? 's go' : ' goes'} into the materials stash.`;
  }
  const strange = STRANGE_TYPES.includes(cr.type.toLowerCase()) ? ` ${cr.type[0].toUpperCase()}${cr.type.slice(1)} meat is strange fare, and the DM may add effects.` : '';
  log(d, `Butchered ${count} × ${cr.name} (${cr.size} ${cr.type}): ${meat} lb of raw meat added to the camp stores.${checkTxt}${hide}${strange}`, 'good');
});

export type Track = 'renown' | 'fear' | 'stress';
const TRACK_LABEL: Record<Track, string> = { renown: 'Renown', fear: 'Fear', stress: 'Stress' };

export const adjustTrack = act((d, _ctx, charId: string, track: Track, delta: number, reason: string) => {
  const c = charById(d, charId);
  if (!c || !delta) return;
  c[track] = track === 'renown' ? c[track] + delta : Math.max(0, c[track] + delta);
  const tone: Tone = track === 'renown' ? (delta > 0 ? 'good' : 'warn') : delta > 0 ? 'warn' : 'good';
  status(d, c, (`${track}${delta > 0 ? 'Up' : 'Down'}` as SenseKey), `${c.name}'s ${TRACK_LABEL[track]} ${delta > 0 ? 'rises' : 'falls'} by ${Math.abs(delta)} to ${c[track]}${reason ? ` (${reason})` : ''}.`, tone);
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
});

// ---------------------------------------------------------------- casting spells (normally or as rituals)

export function canCastAsRitual(c: Character, sp: CharacterSpell): { ok: boolean; reason: string } {
  if (!sp.ritual) return { ok: false, reason: `${sp.name} doesn't have the Ritual tag.` };
  if (sp.prepared || sp.alwaysPrepared) return { ok: true, reason: '' };
  if (c.className === 'Wizard') return { ok: true, reason: '' }; // Ritual Adept: straight from the spellbook
  return { ok: false, reason: `${c.name} needs ${sp.name} prepared to cast it as a ritual.` };
}

/** Casts a known spell: as a ritual (+10 minutes, no slot) or normally (uses a tracked slot of its level or higher). */
export const castSpell = act((d, ctx, charId: string, spellName: string, mode: 'ritual' | 'slot') => {
  const c = charById(d, charId);
  const own = c?.spells.find((x) => x.name === spellName);
  if (!c || !own || !alive(c)) return;
  const sp = { ...own, ...spellInfo(own, d.spellLibrary) } as CharacterSpell;
  const base = sp.castMinutes ?? 0;
  if (mode === 'ritual') {
    const check = canCastAsRitual(c, sp);
    if (!check.ok) {
      log(d, check.reason, 'warn');
      return;
    }
  } else if (sp.level > 0) {
    if (!sp.prepared && !sp.alwaysPrepared) {
      log(d, `${c.name} doesn't have ${sp.name} prepared.`, 'warn');
      return;
    }
    const slots = c.resources
      .filter((r) => /(spell|pact) slots \(level (\d)\)/i.test(r.name))
      .map((r) => ({ r, lvl: Number(/level (\d)/i.exec(r.name)![1]) }))
      .filter((x) => x.lvl >= sp.level)
      .sort((a, b) => a.lvl - b.lvl);
    if (slots.length) {
      const free = slots.find((x) => x.r.current > 0);
      if (!free) {
        log(d, `${c.name} has no spell slots of level ${sp.level} or higher left for ${sp.name}.`, 'warn');
        return;
      }
      free.r.current -= 1;
    }
  }
  const minutes = base + (mode === 'ritual' ? RITUAL_TAG_MINUTES : 0);
  if (minutes > 0) advanceMut(d, ctx, minutes, 'camp');
  const timeTxt = mode === 'ritual' ? `as a ritual (${sp.castTime ?? 'its casting time'} + 10 minutes = ${formatDuration(Math.max(1, Math.round(minutes)))}, no spell slot)` : `(${sp.castTime ?? 'its casting time'}${sp.level > 0 ? ', using a spell slot' : ''})`;
  log(d, `${c.name} casts ${sp.name} ${timeTxt}.`, 'good');
  if (sp.durationMinutes || sp.permanent) {
    const preset = { name: sp.name, kind: 'spell' as const, minutes: sp.permanent ? null : sp.durationMinutes ?? null, concentration: !!sp.concentration, shelter: /tiny hut|rope trick|magnificent mansion/i.test(sp.name) };
    if (preset.concentration) {
      const dropped = d.effects.filter((e) => e.concentration && e.casterId === c.id);
      if (dropped.length) {
        d.effects = d.effects.filter((e) => !dropped.includes(e));
        log(d, `${c.name} stops concentrating on ${dropped.map((e) => e.name).join(', ')}.`, 'warn');
      }
    }
    const now = absNow(d);
    d.effects.push({
      id: uid(),
      name: sp.name,
      kind: 'spell',
      targetIds: [],
      casterId: c.id,
      concentration: preset.concentration,
      shelter: preset.shelter,
      startedAt: now,
      endsAt: preset.minutes == null ? null : now + preset.minutes,
      notes: '',
    });
    log(d, `${sp.name} lasts ${preset.minutes == null ? 'until dispelled' : formatDuration(preset.minutes)}${preset.concentration ? ' (Concentration)' : ''}. Its timer is on the Effects & Lights tab.`);
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
  const groom = s.hirelings.find((h) => h.active && h.role === 'groom');
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
  addFinding(s, it, method, `Identified as ${it.name}.${revealed.length ? ` Learned: ${revealed.map((c) => c.text).join('; ')}.` : ''}`);
  if (before !== it.name) log(s, `${before[0].toUpperCase()}${before.slice(1)} turns out to be ${it.name}.`, 'good');
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
  return { gear, food, water, coins, magic, total, capacity, level: loadLevel(total, capacity, c.kind === 'mount' ? 0 : c.strScore, true) };
}

export const addInventory = act((d, _ctx, charId: string, text: string) => {
  const c = charById(d, charId);
  if (!c) return;
  const parsed = parseInventory(text);
  for (const p of parsed) {
    const same = c.inventory.find((i) => i.name.toLowerCase() === p.name.toLowerCase() && !i.containerId);
    if (same) same.qty += p.qty;
    else c.inventory.push({ id: uid(), ...p, container: detectContainer(p.name), ammo: isAmmo(p.name) ? { spent: 0 } : null });
  }
  if (parsed.length) log(d, `${c.name}'s inventory: added ${parsed.length} line(s), ${parsed.filter((p) => p.source === 'guess').length} with guessed weights.`);
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
    const same = b.items.find((i) => i.name.toLowerCase() === it.name.toLowerCase() && !i.containerId);
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

export const holderValue = (items: InventoryItem[], purse: Purse): number => Math.round((purseValue(purse) + items.reduce((a, i) => a + (i.valueGp ?? 0) * i.qty, 0)) * 100) / 100;


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

/** After a fight, a minute of searching recovers half the spent ammunition, rounded down. */
export const recoverAmmo = act((d, ctx, charIds: string[]) => {
  const lines: string[] = [];
  for (const id of charIds) {
    const c = charById(d, id);
    if (!c) continue;
    for (const it of c.inventory) {
      const spent = it.ammo?.spent ?? 0;
      if (!spent) continue;
      const back = Math.floor(spent / 2);
      it.qty += back;
      it.ammo = { spent: 0 };
      lines.push(`${c.name} recovers ${back} of ${spent} ${it.name} (${it.qty} now)`);
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
    const same = c.inventory.find((i) => i.name.toLowerCase() === name.toLowerCase() && !i.containerId);
    if (same) same.qty += qty;
    else {
      const est = estimateWeight(name);
      c.inventory.push({ id: uid(), name, qty, weight: est.weight, source: est.source, valueGp, container: detectContainer(name), ammo: isAmmo(name) ? { spent: 0 } : null });
    }
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
  const c = charById(d, charId);
  if (!c || !name.trim()) return;
  d.effects.push({ id: uid(), name: `${type}: ${name}`, kind: type === 'Curse' ? 'curse' : 'gift', targetIds: [c.id], casterId: null, concentration: false, shelter: false, startedAt: absNow(d), endsAt: null, notes });
  if (type === 'Charm' && uses > 0) c.resources.push({ id: uid(), name: `Charm: ${name}`, max: uses, current: uses, recharge: 'manual' });
  log(d, `${c.name} ${type === 'Curse' ? 'is cursed' : 'receives a supernatural gift'}: ${type} of ${name}${type === 'Charm' && uses ? ` (${uses} use${uses > 1 ? 's' : ''})` : ''}.`, type === 'Curse' ? 'bad' : 'good');
});

// ---------------------------------------------------------------- random encounters

/** Creatures available to the random encounter tables: the SRD list plus any imported bestiary entries with a CR and environment. */
export function encounterPool(s: State): EncounterCreature[] {
  const byName = new Map<string, EncounterCreature>();
  if (s.settings.srdEncounters) for (const c of SRD_POOL) byName.set(c.name.toLowerCase(), c);
  for (const c of s.bestiary) {
    if (!c.cr || !c.env?.length) continue;
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
  const lightOn = s.fire.lit || s.effects.some((e) => e.kind === 'light' && (e.endsAt == null || e.endsAt > now));
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
export function resolveEncounter(s: State, ctx: Ctx, activity: CheckConditions['activity'], checkDetail?: string): void {
  const table = encounterTable(s);
  const res = rollOnTable(table, ctx.rng);
  if (!res) {
    log(s, 'Random encounter, but the table is empty: import a bestiary or turn on the SRD creatures in the Encounters tab.', 'warn');
    return;
  }
  const night = isNight(s) || isUnderground(s);
  const watchers = activity === 'rest' ? onWatchNow(s) : [];
  const when = `${ACTIVITY_WHEN[activity]} at ${formatClock(s.minutes % MIN_PER_DAY)}`;
  const watchNote = activity === 'rest' ? (watchers.length ? ` On watch: ${watchers.map((c) => `${c.name} (passive Perception ${c.passivePerception})`).join(', ')}.` : ' Nobody is on watch.') : '';
  const head = `Random encounter ${when}${checkDetail ? ` (${checkDetail})` : ''}. d100 = ${res.roll}:`;
  if (res.row.kind === 'peaceful' || !res.row.creature) {
    log(s, `${head} ${res.row.text}. About ${res.distanceFt} feet away.${watchNote}`, 'info');
    return;
  }
  const c = res.row.creature;
  const party = table.party;
  const dm = `${head} ${res.summary} (CR ${c.cr}${res.row.followers ? ` and ${res.row.followers.creature.cr}` : ''}, rolled ${res.row.count}${res.row.followers ? ` and ${res.row.followers.count}` : ''}; ${res.xp} XP total, ${DIFFICULTY_LABEL[res.difficulty ?? 'low']} for ${party.size} level-${party.level} characters). Starting attitude: ${res.attitude?.attitude} (d20 ${res.attitude?.roll}). They are ${res.distanceFt} feet away (${res.distanceExpr}).${watchNote} Compare their Dexterity (Stealth) with the party's passive Perception for surprise.`;
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

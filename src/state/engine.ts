import type { Activity, Bastion, Character, Facility, Pace, PendingSave, Project, SaveKind, State, Tone } from './types';
import { BASIC_BUILD, BASTION_TURN_DAYS, ENLARGE, rollBastionEvent, SIZE_LABEL, SPECIAL_FACILITIES, type FacilitySize } from '../rules/bastion';
import { d20, die, combineModes, signed, type Rng, type RollMode } from '../rules/dice';
import { dateFromIndex, formatClock, formatDate, formatDuration } from '../rules/calendar';
import { fireThreat, rollWeather, temperatureAt, CLIMATES } from '../rules/weather';
import {
  exhaustionSummary,
  foodNeedLb,
  FORAGE_DC,
  PACES,
  PINTS_PER_GALLON,
  proficiencyBonus,
  waterNeedPints,
  fmtLb,
  fmtWater,
  heatDisadvantage,
  wearsBulkyArmor,
  armorTime,
  ARMOR_LABEL,
  PURIFY_SPELL,
  TAINTED_DC,
  TAINTED_POISON_MINUTES,
  BOIL_MINUTES,
} from '../rules/survival';
import { isCaster, PREP_RULE, preparedCount, preparedLimit } from '../rules/spells';
import { uid } from './defaults';

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
const alive = (c: Character) => c.exhaustion < 6;

export function log(s: State, text: string, tone: Tone = 'info'): void {
  s.log.unshift({ id: uid(), stamp: stamp(s), text, tone });
  if (s.log.length > LOG_MAX) s.log.length = LOG_MAX;
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
  const indoors = s.place.shelter === 'building' || s.place.shelter === 'cave';
  if (activity !== 'travel' && indoors) return { cold: false, heat: false, reason: s.place.shelter === 'cave' ? 'Sheltered in a cave' : 'Indoors' };
  if (activity !== 'travel' && s.fire.lit && s.settings.fireWarmsCamp) return { cold: false, heat: true, reason: 'Warmed by the campfire' };
  return { cold: true, heat: true, reason: activity === 'travel' ? 'On the road' : s.place.shelter === 'tent' ? 'In a tent (still exposed to temperature)' : 'In the open' };
}

export function coldProtection(c: Character): string | null {
  if (c.coldResist === 'immunity') return 'Cold Immunity';
  if (c.coldResist === 'resistance') return 'Cold Resistance';
  if (c.coldWeatherGear) return 'Cold weather gear';
  return null;
}

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

export function gainExhaustion(s: State, c: Character, n: number, why: string): void {
  if (!alive(c)) return;
  c.exhaustion = Math.min(6, c.exhaustion + n);
  log(s, `${c.name} gains ${n} Exhaustion level${n > 1 ? 's' : ''} (${why}). Now level ${c.exhaustion}: ${exhaustionSummary(c.exhaustion)}.`, 'bad');
  if (c.exhaustion >= 6) log(s, `${c.name} dies of exhaustion.`, 'bad');
}

function applySaveResult(s: State, c: Character, p: Omit<PendingSave, 'id' | 'stamp'>, passed: boolean, detail: string): void {
  log(s, `${c.name}: Constitution save, DC ${p.dc}, against ${p.reason}. ${detail}${passed ? 'Success.' : 'Failure.'}`, passed ? 'good' : 'warn');
  if (!passed) {
    if (p.kind === 'tainted') {
      c.poisonedUntil = absNow(s) + TAINTED_POISON_MINUTES;
      log(s, `${c.name} is Poisoned for an hour by ${p.reason} (Disadvantage on attack rolls and ability checks).`, 'bad');
      return;
    }
    if (p.kind === 'raw') {
      c.sick = true;
      log(s, `${c.name} falls Sick from ${p.reason}: Poisoned (Disadvantage on attack rolls and ability checks) until they finish a Long Rest.`, 'bad');
      return;
    }
    if (p.kind === 'malnutrition') c.malnourished = true;
    gainExhaustion(s, c, 1, p.reason);
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
      log(s, `The ${threat} puts out the campfire.`, 'warn');
    } else if (s.fire.fuelHours <= 0) {
      s.fire.lit = false;
      log(s, 'The campfire burns down to embers and goes out.', 'warn');
    }
  }

  const exp = exposure(s, activity);
  for (const c of s.characters) {
    if (!alive(c)) continue;
    if (exp.cold && temp <= 0 && !coldProtection(c)) {
      requestSave(s, ctx, c, 'cold', 10, 'normal', `extreme cold (${temp}°F)`);
    }
    if (exp.heat && temp >= 100) {
      if (!heatProtection(c, hasDrinkableWater(s, c, activity))) {
        c.heatHours += 1;
        requestSave(s, ctx, c, 'heat', 4 + c.heatHours, heatDisadvantage(c) ? 'disadvantage' : 'normal', `extreme heat (${temp}°F), hour ${c.heatHours}`);
      } else c.heatHours = 0;
    } else c.heatHours = 0;
  }
}

function endOfDay(s: State, ctx: Ctx): void {
  const hotDay = s.weather.high >= 100;
  for (const c of s.characters) {
    if (!alive(c)) continue;
    if (c.needsWater) {
      const need = waterNeedPints(c, hotDay, s.settings.doubleWaterInHeat);
      if (c.drankPintsToday < need / 2) {
        c.dehydrated = true;
        gainExhaustion(s, c, 1, `dehydration: drank ${fmtWater(c.drankPintsToday)} of ${fmtWater(need)}`);
      } else if (c.drankPintsToday >= need && c.dehydrated) {
        c.dehydrated = false;
        log(s, `${c.name} is fully rehydrated, so dehydration Exhaustion can be removed again.`, 'good');
      }
    }
    if (c.needsFood) {
      const need = foodNeedLb(c);
      if (c.ateLbToday <= 0) {
        c.daysWithoutFood += 1;
        if (c.daysWithoutFood >= 5) {
          c.malnourished = true;
          gainExhaustion(s, c, 1, `malnutrition: day ${c.daysWithoutFood} without food`);
        } else log(s, `${c.name} ate nothing today (${c.daysWithoutFood} day${c.daysWithoutFood > 1 ? 's' : ''} without food).`, 'warn');
      } else {
        c.daysWithoutFood = 0;
        if (c.ateLbToday < need / 2) {
          requestSave(s, ctx, c, 'malnutrition', 10, 'normal', `malnutrition: ate ${fmtLb(c.ateLbToday)} of ${fmtLb(need)}`);
        } else if (c.ateLbToday >= need && c.malnourished) {
          c.malnourished = false;
          log(s, `${c.name} ate a full day's food, so malnutrition Exhaustion can be removed again.`, 'good');
        }
      }
    }
    c.ateLbToday = 0;
    c.drankPintsToday = 0;
  }
  s.dayIndex += 1;
  s.minutes = 0;
  progressBastions(s);
  log(s, `A new day begins: ${formatDate(s.calendar, s.startYear, s.dayIndex)}.`);
  newWeather(s, ctx);
}

function expireConditions(s: State): void {
  const now = absNow(s);
  for (const c of s.characters) {
    if (c.poisonedUntil != null && now >= c.poisonedUntil) {
      c.poisonedUntil = null;
      log(s, `${c.name} is no longer Poisoned.`, 'good');
    }
  }
}

/** Moves the clock forward, firing the hourly and end-of-day checks along the way. */
export function advanceMut(s: State, ctx: Ctx, minutes: number, activity: Activity): void {
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
    if (s.minutes % 60 === 0) tickHour(s, ctx, activity);
    if (s.minutes >= MIN_PER_DAY) endOfDay(s, ctx);
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
  advanceMut(d, ctx, 8 * 60, 'rest');
  d.lastLongRestEnd = absNow(d);
  d.travel.hoursToday = 0;
  d.travel.milesToday = 0;
  for (const c of d.characters) {
    if (!alive(c)) continue;
    const armorSpoiled = d.settings.sleepInArmorPenalty && wearsBulkyArmor(c);
    if (armorSpoiled) {
      log(d, `${c.name} slept in ${c.armorKind} armor: only a quarter of spent Hit Point Dice come back, and no Exhaustion is removed (optional rule).`, 'warn');
    } else if (c.armorKind !== 'none' && !c.armorWorn) {
      log(d, `${c.name} wakes with their armor off. Putting it on takes ${armorTime(c, 'don')} min.`);
    }
    if (c.exhaustion > 0 && !armorSpoiled) {
      if (c.malnourished || c.dehydrated) {
        log(d, `${c.name} can't shed Exhaustion yet: still ${c.malnourished ? 'malnourished' : 'dehydrated'}.`, 'warn');
      } else {
        c.exhaustion -= 1;
        log(d, `${c.name} recovers 1 Exhaustion level. Now level ${c.exhaustion}.`, 'good');
      }
    }
    if (c.sick) {
      c.sick = false;
      log(d, `${c.name} sleeps off the sickness and is no longer Poisoned.`, 'good');
    }
    for (const t of c.tasks) if (t.daily) t.done = false;
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
});

// ---------------------------------------------------------------- travel

export interface TravelOpts {
  hours: number;
  pace: Pace;
  difficult: boolean;
  foragerIds: string[];
}

export const travel = act((d, ctx, o: TravelOpts) => {
  d.travel.pace = o.pace;
  if (d.fire.lit) {
    d.fire.lit = false;
    log(d, 'The party puts out the campfire and breaks camp.');
  }
  const p = PACES[o.pace];
  const altitude = d.place.altitudeFt >= 10000;
  let miles = 0;
  log(d, `The party sets out at a ${o.pace} pace for ${o.hours} hour(s)${o.difficult ? ' over Difficult Terrain' : ''}. ${p.note}.`);
  for (let i = 0; i < o.hours; i++) {
    advanceMut(d, ctx, 60, 'travel');
    d.travel.hoursToday += altitude ? 2 : 1;
    miles += p.mph * (o.difficult ? 0.5 : 1);
    if (d.travel.hoursToday > 8) {
      const dc = 10 + (d.travel.hoursToday - 8);
      for (const c of d.characters) {
        if (alive(c)) requestSave(d, ctx, c, 'march', dc, 'normal', `a forced march (hour ${d.travel.hoursToday})`);
      }
    }
  }
  d.travel.milesToday += miles;
  log(d, `Covered ${+miles.toFixed(1)} miles. That makes ${+d.travel.milesToday.toFixed(1)} miles and ${d.travel.hoursToday} travel hour(s) since the last Long Rest.`);
  for (const id of o.foragerIds) {
    const c = charById(d, id);
    if (c) doForage(d, ctx, c, o.pace);
  }
});

// ---------------------------------------------------------------- foraging, fire, food

function doForage(s: State, ctx: Ctx, c: Character, pace: Pace | null): void {
  if (!alive(c)) return;
  const dc = FORAGE_DC[s.place.forage];
  const mode = combineModes(pace === 'slow' ? 'advantage' : 'normal', pace === 'fast' ? 'disadvantage' : 'normal');
  const r = d20(mode, ctx.rng);
  const total = r.value + c.survival - 2 * c.exhaustion;
  if (total >= dc) {
    const food = Math.max(0, die(6, ctx.rng) + c.wisMod);
    const water = Math.max(0, die(6, ctx.rng) + c.wisMod);
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
  const dc = FORAGE_DC[d.place.forage];
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
  const cook = cookId ? charById(d, cookId) : undefined;
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
  const purified = cookedUnsafe > 0 ? ` Cooking makes the ${fmtLb(round2(cookedUnsafe))} of raw food safe to eat.` : '';
  log(d, eaters.length ? `A hot meal at the campfire for ${eaters.join(', ')} (half a day's food each).${purified}${flavor}` : `Nothing to cook: the stores and rations are empty.${flavor}`, eaters.length ? 'good' : 'warn');
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

function progress(s: State, p: Project): void {
  const crafters = p.charIds.filter((id) => {
    const c = charById(s, id);
    return c && alive(c);
  }).length;
  const amount = Math.max(1, crafters);
  p.daysDone = Math.min(p.daysRequired, p.daysDone + amount);
  if (p.daysDone >= p.daysRequired) {
    p.done = true;
    log(s, `Downtime project complete: ${p.name}.`, 'good');
  } else {
    log(s, `A day's work on ${p.name}: ${p.daysDone}/${p.daysRequired} workdays.`);
  }
}

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
      f.building.daysLeft -= 1;
      if (f.building.daysLeft <= 0) {
        log(s, `${b.name}: ${f.building.what} is finished (${f.building.totalDays} days).`, 'good');
        f.size = f.building.toSize;
        f.built = true;
        f.building = null;
      }
    }
    if ((s.dayIndex - b.lastTurnDay) % BASTION_TURN_DAYS === 0 && s.dayIndex > b.lastTurnDay) {
      log(s, `${b.name}: a Bastion turn is due. Give your special facilities their orders.`, 'warn');
    }
  }
}

export const foundBastion = act((d, _ctx, ownerId: string, name: string) => {
  const owner = charById(d, ownerId);
  if (!owner) return;
  d.bastions.push({ id: uid(), name: name || `${owner.name}'s Bastion`, ownerId, facilities: [], lastTurnDay: d.dayIndex, turns: 0, lastEvent: '', goldSpent: 0, notes: '' });
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
    size: nf.size,
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
  log(d, `${b.name}: work starts enlarging the ${f.name} to ${SIZE_LABEL[step.to].toLowerCase()} (${step.gp.toLocaleString()} GP, ${step.days} days).`);
});

/** Resolves one Bastion turn: logs each order, and rolls a Bastion event if every special facility was told to Maintain. */
export const resolveBastionTurn = act((d, ctx, bastionId: string) => {
  const b = d.bastions.find((x) => x.id === bastionId);
  if (!b || turnsDue(d, b) < 1) return;
  b.lastTurnDay += BASTION_TURN_DAYS;
  b.turns += 1;
  const working = b.facilities.filter((f) => f.kind === 'special' && f.built);
  const orders = working.map((f) => `${f.name}: ${f.order}${f.orderNote ? ` (${f.orderNote})` : ''}`);
  log(d, `${b.name}, Bastion turn ${b.turns}. Orders: ${orders.join('; ') || 'none'}.`);
  if (working.every((f) => f.order === 'Maintain')) {
    const e = rollBastionEvent(ctx.rng);
    b.lastEvent = `Turn ${b.turns}: ${e.event} (d100 = ${e.roll})`;
    log(d, `${b.name}: every facility was maintained, so roll a Bastion event. d100 = ${e.roll}: ${e.event}. See the DMG for what happens.`, e.event === 'Attack' || e.event === 'Criminal Hireling' || e.event === 'Lost Hirelings' ? 'warn' : 'info');
  } else {
    b.lastEvent = `Turn ${b.turns}: orders carried out`;
  }
});

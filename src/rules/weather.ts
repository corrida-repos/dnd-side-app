import type { Season, Shelter, Fire, Place } from '../state/types';
import { die, type Rng } from './dice';
import { lightAt } from './calendar';

export type ClimateId =
  | 'arctic'
  | 'subarctic'
  | 'temperate'
  | 'coastal'
  | 'grassland'
  | 'highland'
  | 'desert'
  | 'tropical'
  | 'swamp'
  | 'underdark';

export interface Climate {
  label: string;
  /** "Normal for the season" [high, low] in °F at sea level. The DMG leaves these to the DM; these are table defaults. */
  temps: Record<Season, [number, number]>;
  /** Optional nudge to the precipitation d20 (only used when climate-adjusted precipitation is on). */
  precipAdj: number;
  noWeather?: boolean;
  sandy?: boolean;
}

export const CLIMATES: Record<ClimateId, Climate> = {
  arctic: { label: 'Arctic / tundra', temps: { winter: [-5, -30], spring: [25, 0], summer: [50, 33], autumn: [20, -5] }, precipAdj: -2 },
  subarctic: { label: 'Subarctic / taiga', temps: { winter: [12, -12], spring: [45, 22], summer: [70, 48], autumn: [40, 22] }, precipAdj: 0 },
  temperate: { label: 'Temperate forest / farmland', temps: { winter: [38, 22], spring: [60, 40], summer: [82, 60], autumn: [62, 42] }, precipAdj: 1 },
  coastal: { label: 'Temperate coast', temps: { winter: [46, 36], spring: [58, 45], summer: [72, 58], autumn: [60, 48] }, precipAdj: 2 },
  grassland: { label: 'Grassland / steppe', temps: { winter: [36, 14], spring: [65, 40], summer: [88, 62], autumn: [64, 40] }, precipAdj: -1 },
  highland: { label: 'Hills / highlands', temps: { winter: [32, 16], spring: [52, 34], summer: [72, 52], autumn: [54, 36] }, precipAdj: 1 },
  desert: { label: 'Hot desert', temps: { winter: [66, 40], spring: [88, 60], summer: [110, 80], autumn: [88, 60] }, precipAdj: -6, sandy: true },
  tropical: { label: 'Tropical jungle', temps: { winter: [86, 72], spring: [88, 73], summer: [90, 75], autumn: [88, 73] }, precipAdj: 4 },
  swamp: { label: 'Subtropical swamp', temps: { winter: [64, 46], spring: [80, 62], summer: [92, 75], autumn: [80, 62] }, precipAdj: 3 },
  underdark: { label: 'Underdark / deep caves', temps: { winter: [56, 52], spring: [56, 52], summer: [56, 52], autumn: [56, 52] }, precipAdj: 0, noWeather: true },
};

export type Wind = 'none' | 'light' | 'strong';
export type Precip = 'none' | 'light' | 'heavy';

export interface Weather {
  dayIndex: number;
  climate: ClimateId;
  season: Season;
  baseHigh: number;
  baseLow: number;
  altitudeAdj: number;
  tempRoll: number;
  tempShift: number;
  windRoll: number;
  wind: Wind;
  precipRoll: number;
  precipAdj: number;
  precip: Precip;
  high: number;
  low: number;
  edited?: boolean;
}

/** Roughly the standard lapse rate: about 3.5 °F cooler per 1,000 ft. */
export const altitudeAdjustment = (altitudeFt: number): number => -Math.round((Math.max(0, altitudeFt) / 1000) * 3.5);

export const windFromRoll = (r: number): Wind => (r <= 12 ? 'none' : r <= 17 ? 'light' : 'strong');
export const precipFromRoll = (r: number): Precip => (r <= 12 ? 'none' : r <= 17 ? 'light' : 'heavy');

/**
 * DMG weather procedure: d20 each for temperature, wind and precipitation.
 * Temperature: 1–14 normal for the season, 15–17 colder by 1d4×10 °F, 18–20 warmer by 1d4×10 °F.
 * Wind: 1–12 none, 13–17 light, 18–20 strong. Precipitation: 1–12 none, 13–17 light, 18–20 heavy.
 */
export function rollWeather(
  opts: { dayIndex: number; season: Season; climate: ClimateId; altitudeFt: number; climateAdjustedPrecip: boolean },
  rng: Rng,
): Weather {
  const c = CLIMATES[opts.climate];
  const [baseHigh, baseLow] = c.temps[opts.season];
  const altitudeAdj = c.noWeather ? 0 : altitudeAdjustment(opts.altitudeFt);

  const tempRoll = die(20, rng);
  let tempShift = 0;
  if (!c.noWeather) {
    if (tempRoll >= 15 && tempRoll <= 17) tempShift = -die(4, rng) * 10;
    else if (tempRoll >= 18) tempShift = die(4, rng) * 10;
  }
  const windRoll = die(20, rng);
  const precipRoll = die(20, rng);
  const precipAdj = opts.climateAdjustedPrecip ? c.precipAdj : 0;
  const effPrecip = Math.min(20, Math.max(1, precipRoll + precipAdj));

  return {
    dayIndex: opts.dayIndex,
    climate: opts.climate,
    season: opts.season,
    baseHigh,
    baseLow,
    altitudeAdj,
    tempRoll,
    tempShift,
    windRoll,
    wind: c.noWeather ? 'none' : windFromRoll(windRoll),
    precipRoll,
    precipAdj,
    precip: c.noWeather ? 'none' : precipFromRoll(effPrecip),
    high: baseHigh + altitudeAdj + tempShift,
    low: baseLow + altitudeAdj + tempShift,
  };
}

/** Daily curve: coldest around 05:00, warmest around 15:00. */
export function temperatureAt(w: Weather, minutes: number): number {
  let h = minutes / 60;
  let f: number;
  if (h >= 5 && h <= 15) f = (1 - Math.cos((Math.PI * (h - 5)) / 10)) / 2;
  else {
    if (h < 5) h += 24;
    f = (1 + Math.cos((Math.PI * (h - 15)) / 14)) / 2;
  }
  return Math.round(w.low + (w.high - w.low) * f);
}

export type PrecipKind = 'rain' | 'sleet' | 'snow';
export const precipKind = (tempF: number): PrecipKind => (tempF <= 32 ? 'snow' : tempF <= 35 ? 'sleet' : 'rain');

export function weatherSummary(w: Weather, tempNow: number): string {
  if (CLIMATES[w.climate].noWeather) return 'Still, cool air underground';
  const parts: string[] = [];
  if (w.precip === 'none') parts.push(w.wind === 'none' ? 'Calm and dry' : 'Dry');
  else parts.push(`${w.precip === 'heavy' ? 'Heavy' : 'Light'} ${precipKind(tempNow)}`);
  if (w.wind === 'light') parts.push('light wind');
  if (w.wind === 'strong') parts.push('strong wind');
  return parts.join(', ');
}

/** Returns why the weather would put out an open flame right now, or null. */
export function fireThreat(w: Weather, tempNow: number): string | null {
  if (w.wind === 'strong') return 'strong wind';
  if (w.precip === 'heavy' && precipKind(tempNow) !== 'snow') return 'heavy rain';
  return null;
}

export interface Effect {
  id: string;
  title: string;
  detail: string;
  tone: 'info' | 'warn' | 'bad' | 'good';
}

const covered = (shelter: Shelter) => shelter === 'building' || shelter === 'cave';

export function environmentEffects(args: { weather: Weather; tempNow: number; place: Place; fire: Fire; minutes: number; coldNightF?: number | null; uncovered?: string[] }): Effect[] {
  const { weather: w, tempNow, place, fire, minutes, coldNightF, uncovered = [] } = args;
  const out: Effect[] = [];
  const clim = CLIMATES[w.climate];
  const indoors = covered(place.shelter);
  const underCover = indoors || place.shelter === 'tent';

  if (clim.noWeather) {
    out.push({ id: 'dark', title: 'Darkness', detail: 'No sunlight underground. Bring light or rely on Darkvision.', tone: 'info' });
  } else {
    const l = lightAt(minutes, w.season);
    out.push({ id: 'light', title: `${l.phase}: ${l.light}`, detail: `Sunrise around ${fmtH(l.sunrise)}, sunset around ${fmtH(l.sunset)}.`, tone: 'info' });
  }

  if (w.wind === 'strong') {
    const sand = clim.sandy ? ' In the desert it whips up a sandstorm: Disadvantage on Wisdom (Perception) checks.' : '';
    out.push({
      id: 'wind',
      title: indoors ? 'Strong wind outside' : 'Strong wind',
      detail:
        'Disadvantage on ranged attack rolls with weapons. Puts out open flames and disperses fog. A creature flying by nonmagical means must land at the end of its turn or fall.' +
        sand,
      tone: indoors ? 'info' : 'warn',
    });
  } else if (w.wind === 'light') {
    out.push({ id: 'wind', title: 'Light wind', detail: 'No mechanical effect.', tone: 'info' });
  }

  if (w.precip !== 'none') {
    const kind = precipKind(tempNow);
    if (w.precip === 'heavy') {
      out.push({
        id: 'precip',
        title: `Heavy ${kind}${underCover ? ' (you are under cover)' : ''}`,
        detail:
          'The area is Lightly Obscured, and creatures in it have Disadvantage on Wisdom (Perception) checks.' +
          (kind === 'snow' ? ' Deep snow may count as Difficult Terrain (DM’s call).' : ' Heavy rain also puts out open flames.'),
        tone: underCover ? 'info' : 'warn',
      });
    } else {
      out.push({
        id: 'precip',
        title: `Light ${kind}`,
        detail: kind === 'snow' ? 'No direct effect. Snow that builds up may become Difficult Terrain (DM’s call).' : 'No mechanical effect.',
        tone: 'info',
      });
    }
  }

  if (tempNow <= 0) {
    out.push({
      id: 'cold',
      title: `Extreme cold (${tempNow}°F)`,
      detail:
        'Creatures exposed to the cold make a DC 10 Constitution save at the end of each hour, gaining 1 Exhaustion level on a failure. Cold Resistance or Immunity, or cold weather gear, means an automatic success.',
      tone: 'bad',
    });
  } else if (w.low <= 0) {
    out.push({
      id: 'cold-soon',
      title: 'Extreme cold expected',
      detail: `Today's low is ${w.low}°F. Plan for shelter, a fire, cold weather gear, or a Bedroll (automatic success while sleeping in it) or Blanket (Advantage).`,
      tone: 'warn',
    });
  }
  if (coldNightF != null && !clim.noWeather && w.low <= coldNightF && w.low > 0 && tempNow > 0 && !indoors) {
    out.push({
      id: 'cold-night',
      title: `Cold night ahead (low ${w.low}°F)`,
      detail:
        `Anyone who sleeps out at ${coldNightF}°F or colder without a Bedroll, Blanket, cold weather gear, a campfire or shelter makes a DC 10 Con save when the Long Rest ends, or gains 1 Exhaustion level (table rule).` +
        (uncovered.length ? ` No warm cover: ${uncovered.join(', ')}.` : ' Everyone has warm cover.'),
      tone: uncovered.length ? 'warn' : 'info',
    });
  }

  if (tempNow >= 100) {
    out.push({
      id: 'heat',
      title: `Extreme heat (${tempNow}°F)`,
      detail:
        'Exposed creatures with no drinkable water make a Constitution save at the end of each hour: DC 5 for the first hour, +1 for each hour after. A failure gives 1 Exhaustion level. Medium or Heavy armor or heavy clothing gives Disadvantage. Fire Resistance or Immunity means an automatic success.',
      tone: 'bad',
    });
  } else if (w.high >= 100) {
    out.push({ id: 'heat-soon', title: 'Extreme heat expected', detail: `Today's high is ${w.high}°F. Keep drinkable water on hand.`, tone: 'warn' });
  }

  if (place.altitudeFt >= 10000) {
    out.push({
      id: 'altitude',
      title: `High altitude (${place.altitudeFt.toLocaleString()} ft)`,
      detail:
        'For creatures that breathe, each hour of travel counts as 2 hours toward how long they can travel. Spending 30 days at this height acclimatizes you, but nobody acclimatizes above 20,000 ft unless they are native to it.',
      tone: 'warn',
    });
  }

  if (fire.lit) {
    const threat = fireThreat(w, tempNow);
    if (threat && !fire.sheltered && !indoors) {
      out.push({ id: 'fire', title: 'Campfire at risk', detail: `The ${threat} will put out the fire at the end of the hour unless it is sheltered.`, tone: 'warn' });
    } else {
      out.push({ id: 'fire', title: 'Campfire burning', detail: `About ${fire.fuelHours} hour(s) of fuel left.`, tone: 'good' });
    }
  }
  return out;
}

const fmtH = (h: number) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

// ---------------------------------------------------------------- weather and damage (table rule)

export type DamageType = 'Cold' | 'Fire' | 'Lightning' | 'Thunder' | 'Radiant' | 'Necrotic' | 'Poison';

export interface Affinity {
  type: DamageType;
  /** +1: favored (+1 damage per die). -1: hindered (-1 per die, minimum 1 per die). */
  dir: 1 | -1;
  why: string;
}

/**
 * Table rule: which damage types the weather favors or hinders right now. Only applies outdoors
 * (the Underdark has its own). Opposite pulls on the same type cancel out.
 */
export function weatherDamageAffinities(args: { weather: Weather; tempNow: number; minutes: number; sheltered: boolean }): Affinity[] {
  const { weather: w, tempNow, minutes, sheltered } = args;
  const clim = CLIMATES[w.climate];
  const raw: Affinity[] = [];
  if (clim.noWeather) {
    raw.push({ type: 'Necrotic', dir: 1, why: 'the lightless depths' });
    raw.push({ type: 'Radiant', dir: -1, why: 'the lightless depths' });
  } else if (!sheltered) {
    const kind = precipKind(tempNow);
    if (w.precip === 'heavy' && kind !== 'snow') {
      raw.push({ type: 'Lightning', dir: 1, why: 'heavy rain' });
      raw.push({ type: 'Fire', dir: -1, why: 'heavy rain' });
      if (w.wind === 'strong') raw.push({ type: 'Thunder', dir: 1, why: 'a thunderstorm' });
    }
    if (w.precip !== 'none' && kind === 'snow') {
      raw.push({ type: 'Cold', dir: 1, why: 'falling snow' });
      if (w.precip === 'heavy') raw.push({ type: 'Fire', dir: -1, why: 'heavy snow' });
    }
    if (tempNow <= 0) {
      raw.push({ type: 'Cold', dir: 1, why: 'extreme cold' });
      raw.push({ type: 'Fire', dir: -1, why: 'extreme cold' });
    }
    if (tempNow >= 100) {
      raw.push({ type: 'Fire', dir: 1, why: 'extreme heat' });
      raw.push({ type: 'Cold', dir: -1, why: 'extreme heat' });
    }
    const light = lightAt(minutes, w.season);
    if (light.phase === 'Day' && w.precip === 'none') raw.push({ type: 'Radiant', dir: 1, why: 'clear daylight' });
    if (light.phase === 'Night') raw.push({ type: 'Necrotic', dir: 1, why: 'the dark of night' });
    if (w.climate === 'swamp' && tempNow >= 75) raw.push({ type: 'Poison', dir: 1, why: 'humid swamp air' });
  }
  // Merge by type: sum the pulls, keep the reasons.
  const byType = new Map<DamageType, { sum: number; whys: string[] }>();
  for (const a of raw) {
    const cur = byType.get(a.type) ?? { sum: 0, whys: [] };
    cur.sum += a.dir;
    if (!cur.whys.includes(a.why)) cur.whys.push(a.why);
    byType.set(a.type, cur);
  }
  const out: Affinity[] = [];
  for (const [type, v] of byType) {
    if (v.sum === 0) continue;
    out.push({ type, dir: v.sum > 0 ? 1 : -1, why: v.whys.join(', ') });
  }
  return out.sort((a, b) => b.dir - a.dir || a.type.localeCompare(b.type));
}

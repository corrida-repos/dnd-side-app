import type { LightPhase } from './calendar';
import { illumination, sightFor, type Sight, type Vision } from './sight';

/** A Long Rest is 8 hours. */
export const REST_MINUTES = 8 * 60;
/** How the night can be split into watches. */
export const WATCH_COUNTS = [2, 3, 4, 8];
export const watchMinutes = (count: number): number => REST_MINUTES / count;

/**
 * A Long Rest allows at most 2 hours of light activity such as standing watch.
 * Characters who Trance (4 hours of rest) can watch for 4.
 */
export const maxWatchMinutes = (trance: boolean): number => (trance ? 4 * 60 : 2 * 60);

/** Clock times (minutes after midnight, may run past 1440) for each watch if the rest starts at `start`. */
export function slotTimes(start: number, count: number): { from: number; to: number }[] {
  const len = watchMinutes(count);
  return Array.from({ length: count }, (_, i) => ({ from: start + i * len, to: start + (i + 1) * len }));
}

export type { Sight } from './sight';

/**
 * What a watcher can see (see sight.ts): Dim Light, heavy rain or snow, and Darkness seen through Darkvision each
 * give −5 to passive Perception (Disadvantage doesn't stack); in Darkness without Darkvision only hearing works, also −5.
 * A light source or a roof overhead lights the camp.
 */
export function watchSight(
  phase: LightPhase,
  lit: boolean,
  vision: number | Vision,
  underground: boolean,
  o: { fullMoon?: boolean; obscured?: string | null } = {},
): Sight {
  const v: Vision = typeof vision === 'number' ? { darkvision: vision, seesInDark: false } : vision;
  const light = illumination({ phase, underground, lit, fullMoon: !!o.fullMoon });
  return sightFor(light.level, light.why, v, o.obscured ?? null);
}

/**
 * Shares the watches out round-robin, `perWatch` people at a time. `capacity` caps how many watches
 * each person may take (so nobody loses their Long Rest); a watch is left empty rather than overload anyone.
 */
export function autoAssign(ids: string[], count: number, perWatch: number, capacity?: Record<string, number>): string[][] {
  const out: string[][] = Array.from({ length: count }, () => []);
  if (!ids.length) return out;
  const used: Record<string, number> = {};
  let k = 0;
  for (let i = 0; i < count; i++) {
    for (let tries = 0; out[i].length < Math.min(perWatch, ids.length) && tries < ids.length; tries++) {
      const id = ids[k % ids.length];
      k++;
      if (out[i].includes(id)) continue;
      if (capacity && (used[id] ?? 0) >= (capacity[id] ?? Infinity)) continue;
      out[i].push(id);
      used[id] = (used[id] ?? 0) + 1;
    }
  }
  return out;
}

/** How many watches of a given length a character can stand and still finish a Long Rest. */
export const watchCapacity = (count: number, trance: boolean): number => Math.floor(maxWatchMinutes(trance) / watchMinutes(count));

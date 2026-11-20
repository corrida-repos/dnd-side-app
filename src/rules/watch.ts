import type { LightPhase } from './calendar';

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

export interface Sight {
  /** Penalty to passive Perception for sight (Disadvantage counts as −5). */
  penalty: number;
  /** In Darkness without Darkvision: sight fails and only hearing works. */
  blind: boolean;
  note: string;
}

/** What a watcher can see: Dim Light gives −5 to passive Perception, and Darkness leaves only hearing. */
export function watchSight(phase: LightPhase, lit: boolean, darkvisionFt: number, underground: boolean): Sight {
  if (lit) return { penalty: 0, blind: false, note: 'firelight or a light source' };
  const dark = underground || phase === 'Night';
  const dim = !underground && (phase === 'Dawn' || phase === 'Dusk');
  if (!dark && !dim) return { penalty: 0, blind: false, note: 'daylight' };
  if (dim) return darkvisionFt > 0 ? { penalty: 0, blind: false, note: 'dim light, but Darkvision' } : { penalty: -5, blind: false, note: 'dim light (−5)' };
  return darkvisionFt > 0 ? { penalty: -5, blind: false, note: 'Darkvision in darkness counts as dim light (−5)' } : { penalty: -5, blind: true, note: 'darkness: hearing only' };
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

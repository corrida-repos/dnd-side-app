import type { LightPhase } from './calendar';
import type { RollMode } from './dice';

/**
 * Vision and light (2024 PHB "Vision and Light", rules glossary):
 * - Bright Light is normal. Dim Light (twilight, dawn, a full moon) is Lightly Obscured: Disadvantage on
 *   Wisdom (Perception) checks that rely on sight. Darkness (night, underground) is Heavily Obscured: you're
 *   Blinded when trying to see into it.
 * - Darkvision: Dim Light counts as Bright and Darkness as Dim, within its range.
 * - Devil's Sight: see normally in Darkness, magical or not, within 120 feet.
 * - A light source lights its surroundings. A creature sneaking up on a lit camp has to come into the light.
 * - Heavy rain or snow (and a desert sandstorm) give Disadvantage on Perception whatever the light, and neither
 *   Darkvision nor a light helps. Disadvantage doesn't stack: dim light in the rain is still one Disadvantage.
 *
 * Passive Perception counts Disadvantage as −5. A watcher who can't see at all still hears; that's counted as
 * Disadvantage too, so Darkvision never leaves a watcher worse off than no Darkvision.
 */
export type Illumination = 'bright' | 'dim' | 'dark';

export const ILLUMINATION_LABEL: Record<Illumination, string> = { bright: 'Bright Light', dim: 'Dim Light', dark: 'Darkness' };

/** How lit the surroundings are, before anyone's special senses. */
export function illumination(o: { phase: LightPhase; underground: boolean; lit: boolean; fullMoon: boolean }): { level: Illumination; why: string } {
  if (o.lit) return { level: 'bright', why: 'a light source' };
  if (o.underground) return { level: 'dark', why: 'no light underground' };
  if (o.phase === 'Day') return { level: 'bright', why: 'daylight' };
  if (o.phase === 'Dawn' || o.phase === 'Dusk') return { level: 'dim', why: 'twilight' };
  if (o.fullMoon) return { level: 'dim', why: 'the full moon' };
  return { level: 'dark', why: 'night' };
}

export interface Vision {
  /** Darkvision range in feet (0 = none). */
  darkvision: number;
  /** Sees normally in Darkness (Devil's Sight). */
  seesInDark: boolean;
}

export interface Sight {
  /** Penalty to passive Perception for sight (Disadvantage counts as −5). */
  penalty: number;
  /** Sight fails (Darkness without Darkvision): only hearing works, and searching by sight fails. */
  blind: boolean;
  /** Disadvantage on Wisdom (Perception) checks that rely on sight, or normal. */
  mode: RollMode;
  note: string;
}

/** What one creature can see, given the light, its senses and anything obscuring the area (heavy rain, a sandstorm). */
export function sightFor(level: Illumination, lightWhy: string, v: Vision, obscured: string | null): Sight {
  let seen = level;
  let how = lightWhy;
  if (level !== 'bright' && v.seesInDark) {
    seen = 'bright';
    how = `${lightWhy}, but Devil's Sight`;
  } else if (level !== 'bright' && v.darkvision > 0) {
    seen = level === 'dim' ? 'bright' : 'dim';
    how = `${lightWhy}, but Darkvision${level === 'dark' ? ' (as Dim Light)' : ''}`;
  }
  const extra = obscured ? `; ${obscured}` : '';
  if (seen === 'dark') return { penalty: -5, blind: true, mode: 'disadvantage', note: `${how}: can't see, hearing only (−5)${extra}` };
  if (seen === 'dim' || obscured) return { penalty: -5, blind: false, mode: 'disadvantage', note: `${seen === 'dim' ? `${how} (−5)` : `${how}, but ${obscured} (−5)`}${seen === 'dim' ? extra : ''}` };
  return { penalty: 0, blind: false, mode: 'normal', note: how };
}

/** What obscures the open air right now, whatever the light: heavy rain or snow, or a sandstorm. Null under a roof. */
export function weatherObscures(o: { precip: string; wind: string; sandy: boolean; snow: boolean; indoors: boolean }): string | null {
  if (o.indoors) return null;
  if (o.precip === 'heavy') return `heavy ${o.snow ? 'snow' : 'rain'} (Lightly Obscured)`;
  if (o.wind === 'strong' && o.sandy) return 'a sandstorm';
  return null;
}

/** Passive Perception modifier for a roll mode: Advantage +5, Disadvantage −5. */
export const passiveMod = (mode: RollMode): number => (mode === 'advantage' ? 5 : mode === 'disadvantage' ? -5 : 0);

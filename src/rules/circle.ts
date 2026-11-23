import type { Character, SpellRef } from '../state/types';

/**
 * Circle Magic (Forgotten Realms: Heroes of Faerûn, optional rule).
 * The app tracks circle castings only for spells with a casting time of 1 minute or longer:
 * shorter ones resolve on combat's timescale.
 */
export const CIRCLE_MIN_CAST_MINUTES = 1;
/** Secondary casters stay within this distance of the primary caster for the whole casting. */
export const CIRCLE_RANGE_FT = 30;

const SLOT_RE = /(spell|pact) slots \(level (\d)\)/i;
const slotLevel = (name: string) => Number(SLOT_RE.exec(name)?.[2] ?? 0);

/** Can this spell be tracked as a Circle spell: uses a spell slot and takes 1 minute or longer to cast. */
export function circleEligible(sp: SpellRef): { ok: boolean; reason: string } {
  if (sp.level < 1) return { ok: false, reason: 'Cantrips use no spell slot, so they can’t be Circle spells.' };
  if (sp.castMinutes === undefined) return { ok: false, reason: `${sp.name}'s casting time is unknown: import a 5etools spell file.` };
  if (sp.castMinutes < CIRCLE_MIN_CAST_MINUTES) return { ok: false, reason: `${sp.name} takes ${sp.castTime ?? 'an action'} to cast: a circle casting that quick happens on combat's timescale, so it isn't tracked here.` };
  return { ok: true, reason: '' };
}

/** Has the Spellcasting or Pact Magic feature, judged from tracked slots or leveled spells. */
export function hasSpellcasting(c: Character): boolean {
  return c.resources.some((r) => SLOT_RE.test(r.name)) || c.spells.some((s) => s.level > 0);
}

/** Tracks spell slots at all (characters who don't can always contribute, as elsewhere in the app). */
export function tracksSlots(c: Character): boolean {
  return c.resources.some((r) => SLOT_RE.test(r.name));
}

/** Spell slots of at least this level the character has left (Infinity if they don't track slots). */
export function slotsLeft(c: Character, level: number): number {
  if (!tracksSlots(c)) return Infinity;
  return c.resources.filter((r) => SLOT_RE.test(r.name) && slotLevel(r.name) >= level).reduce((a, r) => a + r.current, 0);
}

/** Why this character can't join a circle casting of a spell of this level, or '' if they can. */
export function helperProblem(c: Character, level: number): string {
  if (c.diedAt != null) return `${c.name} is dead.`;
  if (c.hp <= 0 || c.dying || c.stable) return `${c.name} is unconscious.`;
  if (!hasSpellcasting(c)) return `${c.name} has no Spellcasting or Pact Magic feature.`;
  if (slotsLeft(c, level) < 1) return `${c.name} has no spell slot of level ${level} or higher left.`;
  return '';
}

/** What the characters see and feel as a circle casting begins. */
export function circleBeginsText(spell: string, names: string[]): string {
  const n = names.length + 1;
  return `${n} casters stand within a few strides of one another for ${spell}. One voice leads; the others fall in under it, hands and words keeping time, and the air between them tightens like a drawn breath.`;
}

/** What the characters notice when a circle casting is completed. */
export function circleEndsText(spell: string): string {
  return `The joined voices close on the last word together. A shiver passes through every caster in the circle as their magic pours into one spell, and ${spell} takes hold, stronger for it.`;
}

/** What the characters notice when a circle casting falls apart. */
export function circleBrokenText(spell: string): string {
  return `The rhythm breaks. Voices stumble out of step and the gathered power drains away harmlessly before ${spell} can take hold.`;
}

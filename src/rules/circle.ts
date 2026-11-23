import type { Character, SpellRef } from '../state/types';
import { componentFor } from './components';

/**
 * Circle Magic (Forgotten Realms: Heroes of Faerûn, optional rule), checked against the 5etools FRHoF data.
 * The app tracks circle castings only for spells whose casting time is 1 minute or longer:
 * a circle spell cast with an action resolves on combat's timescale.
 */
export const CIRCLE_MIN_CAST_MINUTES = 1;
/** A secondary caster contributes only while within 30 feet of the primary caster. */
export const CIRCLE_RANGE_FT = 30;

/** What each secondary caster must expend: nothing, any spell slot, or one of at least a given level. */
export type HelperSlot = { kind: 'none' } | { kind: 'any' } | { kind: 'atLeast'; level: number };

export type CircleOptionId = 'augment' | 'distribute' | 'expand' | 'prolong' | 'safeguard' | 'supplant' | 'spell';

/** A spell's own "Casting as a Circle Spell" section, as numbers only (no book text is stored). */
export interface SpellCircle {
  minHelpers: number;
  helperSlotLevel: number;
  /** Casting time when cast as a Circle spell, if it changes. */
  castMinutes?: number;
  castTime?: string;
  /** Duration when cast as a Circle spell, if it changes (null = until dispelled). */
  durationMinutes?: number | null;
  concentration?: boolean;
  /** Short reminder of what changes, in the app's own words. */
  note: string;
}

/** FRHoF spells with their own circle section. Only Songal's takes 1 minute or longer that way; the rest stay at an action. */
export const SPELL_CIRCLES: Record<string, SpellCircle> = {
  "Songal's Elemental Suffusion": { minHelpers: 1, helperSlotLevel: 2, castMinutes: 1, castTime: '1 minute', durationMinutes: 10, concentration: true, note: 'lasts up to 10 minutes; one more creature shares the benefits per secondary caster, up to nine' },
  Dirge: { minHelpers: 2, helperSlotLevel: 4, durationMinutes: 10, concentration: true, note: 'lasts up to 10 minutes; failed saves also give Exhaustion that a Long Rest won’t clear' },
  Doomtide: { minHelpers: 5, helperSlotLevel: 3, durationMinutes: null, concentration: false, note: 'needs a string of three black pearls from Pandemonium (consumed); 1-mile range; lasts until dispelled' },
  'Spellfire Storm': { minHelpers: 1, helperSlotLevel: 3, concentration: false, note: 'needs a blue star sapphire worth 25,000+ GP (consumed); 1-mile range; no Concentration' },
};

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").trim();
export function spellCircle(name: string): SpellCircle | undefined {
  const key = norm(name);
  return Object.entries(SPELL_CIRCLES).find(([k]) => norm(k) === key || norm(k).replace(/^\w+'s /, '') === key)?.[1];
}

export interface CircleOption {
  id: CircleOptionId;
  label: string;
  helperSlot: (sp: SpellRef) => HelperSlot;
  /** What the option does, in short. */
  summary: string;
}

export const CIRCLE_OPTIONS: CircleOption[] = [
  { id: 'augment', label: 'Augment', helperSlot: () => ({ kind: 'none' }), summary: 'Range +1,000 feet per secondary caster (up to +1 mile); the spell needs a range of at least 5 feet.' },
  { id: 'distribute', label: 'Distribute', helperSlot: () => ({ kind: 'none' }), summary: 'Every caster can hold the spell’s Concentration; it lasts while any one of them does.' },
  { id: 'expand', label: 'Expand', helperSlot: () => ({ kind: 'any' }), summary: 'One dimension of the area of effect +10 feet per secondary caster.' },
  { id: 'prolong', label: 'Prolong', helperSlot: () => ({ kind: 'any' }), summary: 'Duration +1 hour (1–3 secondary casters), +8 hours (4–6) or +24 hours (7+).' },
  { id: 'safeguard', label: 'Safeguard', helperSlot: () => ({ kind: 'none' }), summary: 'A safe zone of 5-foot Cubes (spellcasting modifier + secondary casters, minimum 1) inside the area.' },
  { id: 'supplant', label: 'Supplant', helperSlot: (sp) => ({ kind: 'atLeast', level: sp.level }), summary: 'A consumed costly component’s minimum cost −50 GP per secondary caster.' },
  { id: 'spell', label: 'The spell’s own circle effect', helperSlot: (sp) => ({ kind: 'atLeast', level: spellCircle(sp.name)?.helperSlotLevel ?? sp.level }), summary: '' },
];
export const circleOption = (id: CircleOptionId) => CIRCLE_OPTIONS.find((o) => o.id === id)!;

/** Casting time in minutes when cast as a Circle spell with this option. */
export function circleCastMinutes(sp: SpellRef, option: CircleOptionId): number | undefined {
  return option === 'spell' ? spellCircle(sp.name)?.castMinutes ?? sp.castMinutes : sp.castMinutes;
}

/** Could this spell be cast as a Circle spell that takes 1 minute or longer, with some option? */
export function circleEligible(sp: SpellRef): { ok: boolean; reason: string } {
  if (sp.level < 1) return { ok: false, reason: 'A Circle spell is cast with a spell slot, so cantrips can’t be.' };
  const own = spellCircle(sp.name);
  const mins = Math.max(sp.castMinutes ?? -1, own?.castMinutes ?? -1);
  if (mins < 0) return { ok: false, reason: `${sp.name}'s casting time is unknown: import a 5etools spell file.` };
  if (mins < CIRCLE_MIN_CAST_MINUTES) return { ok: false, reason: `${sp.name} takes ${sp.castTime ?? 'an action'} to cast: a circle casting that quick happens on combat's timescale, so it isn't tracked here.` };
  return { ok: true, reason: '' };
}

/** Why this option can't be used for this spell, or '' if it can (only what the app knows is checked). */
export function optionProblem(sp: SpellRef, option: CircleOptionId, helpers: number): string {
  const casting = circleCastMinutes(sp, option) ?? 0;
  if (casting < CIRCLE_MIN_CAST_MINUTES) return `With ${circleOption(option).label}, ${sp.name} takes ${sp.castTime ?? 'an action'} to cast, which isn't tracked here.`;
  if (option === 'distribute' && !sp.concentration) return `Distribute is for spells that need Concentration, and ${sp.name} doesn't.`;
  if (option === 'prolong' && (sp.permanent || !sp.durationMinutes || sp.durationMinutes < 1)) return `Prolong is for spells that last 1 minute or longer, and ${sp.name} doesn't.`;
  if (option === 'supplant') {
    const comp = componentFor(sp.name);
    if (!comp?.consumed) return `Supplant is for spells that consume a Material component with a cost, and ${sp.name} doesn't.`;
  }
  if (option === 'spell') {
    const own = spellCircle(sp.name);
    if (!own) return `${sp.name} has no circle effect of its own.`;
    if (helpers < own.minHelpers) return `${sp.name} as a Circle spell needs at least ${own.minHelpers} secondary caster${own.minHelpers > 1 ? 's' : ''}.`;
  }
  return '';
}

/** Prolong: extra minutes of duration for this many secondary casters. */
export function prolongMinutes(helpers: number): number {
  return helpers >= 7 ? 24 * 60 : helpers >= 4 ? 8 * 60 : helpers >= 1 ? 60 : 0;
}

/** Supplant: GP off a consumed component's minimum cost. */
export const supplantDiscount = (helpers: number): number => 50 * helpers;

const SLOT_RE = /(spell|pact) slots \(level (\d)\)/i;
const slotLevel = (name: string) => Number(SLOT_RE.exec(name)?.[2] ?? 0);

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

export const slotNeedText = (need: HelperSlot): string => (need.kind === 'none' ? 'no spell slot' : need.kind === 'any' ? 'a spell slot' : `a level ${need.level}+ spell slot`);

/** Why this character can't be a secondary caster, or '' if they can. */
export function helperProblem(c: Character, need: HelperSlot): string {
  if (c.diedAt != null) return `${c.name} is dead.`;
  if (c.hp <= 0 || c.dying || c.stable) return `${c.name} is unconscious.`;
  if (!hasSpellcasting(c)) return `${c.name} has no Spellcasting or Pact Magic feature.`;
  if (need.kind !== 'none' && slotsLeft(c, need.kind === 'any' ? 1 : need.level) < 1) return `${c.name} has no ${need.kind === 'any' ? 'spell slot' : `spell slot of level ${need.level} or higher`} left.`;
  return '';
}

/** What the characters see and feel as a circle casting begins. */
export function circleBeginsText(spell: string, helpers: number): string {
  return `${helpers + 1} casters stand within a few strides of one another for ${spell}. One voice leads; the others fall in under it, hands and words keeping time, and the air between them tightens like a drawn breath.`;
}

/** What the characters notice when a circle casting is completed. */
export function circleEndsText(spell: string): string {
  return `The joined voices close on the last word together. A shiver passes through every caster in the circle as their magic pours into one spell, and ${spell} takes hold, stronger for it.`;
}

/** What the characters notice when a circle casting falls apart. */
export function circleBrokenText(spell: string): string {
  return `The rhythm breaks. Voices stumble out of step and the gathered power drains away harmlessly before ${spell} can take hold.`;
}

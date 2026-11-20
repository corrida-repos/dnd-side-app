import type { CasterClass, Character, ClassName, SpellRef } from '../state/types';

export const CLASSES: ClassName[] = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard', 'Other'];
export const CASTERS: CasterClass[] = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];
export const isCaster = (c: ClassName): c is CasterClass => (CASTERS as string[]).includes(c);

/** Prepared spells by class level (index 0 = level 1), from the 2024 class tables. You can override per character. */
export const PREPARED_TABLE: Record<CasterClass, number[]> = {
  Bard: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  Cleric: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  Druid: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  Paladin: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
  Ranger: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
  Sorcerer: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  Warlock: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  Wizard: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
};

export type PrepRule = 'longRestAll' | 'longRestOne' | 'levelUpOne';

export const PREP_RULE: Record<CasterClass, PrepRule> = {
  Cleric: 'longRestAll',
  Druid: 'longRestAll',
  Wizard: 'longRestAll',
  Paladin: 'longRestOne',
  Ranger: 'longRestOne',
  Bard: 'levelUpOne',
  Sorcerer: 'levelUpOne',
  Warlock: 'levelUpOne',
};

export const PREP_RULE_TEXT: Record<PrepRule, string> = {
  longRestAll: 'After a Long Rest you can change any of your prepared spells.',
  longRestOne: 'After a Long Rest you can replace one prepared spell with another spell from your class list.',
  levelUpOne: 'You change spells only when you gain a level (replace one). Use setup mode for that.',
};

export function preparedLimit(c: Character): number | null {
  if (c.preparedOverride != null) return c.preparedOverride;
  if (!isCaster(c.className)) return null;
  return PREPARED_TABLE[c.className][Math.min(20, Math.max(1, c.level)) - 1];
}

export const preparedCount = (c: Character): number => c.spells.filter((s) => s.prepared && !s.alwaysPrepared).length;

export const SCHOOLS: Record<string, string> = {
  A: 'Abjuration',
  C: 'Conjuration',
  D: 'Divination',
  E: 'Enchantment',
  V: 'Evocation',
  I: 'Illusion',
  N: 'Necromancy',
  T: 'Transmutation',
};

export const levelLabel = (l: number): string => (l === 0 ? 'Cantrip' : `Level ${l}`);

/**
 * Reads 5etools-style spell JSON (`{ "spell": [...] }` or a plain array) that you supply yourself.
 * Only keeps short fields (name, level, school, source, ritual, concentration). Nothing is bundled with the app.
 */
export function parse5eToolsSpells(json: unknown): SpellRef[] {
  const arr: unknown[] = Array.isArray(json)
    ? json
    : json && typeof json === 'object' && Array.isArray((json as { spell?: unknown }).spell)
      ? ((json as { spell: unknown[] }).spell)
      : [];
  const out: SpellRef[] = [];
  const seen = new Set<string>();
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.name !== 'string' || typeof r.level !== 'number') continue;
    const source = typeof r.source === 'string' ? r.source : undefined;
    const key = `${r.name}|${source ?? ''}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const meta = r.meta as { ritual?: boolean } | undefined;
    const duration = Array.isArray(r.duration) ? (r.duration as { concentration?: boolean }[]) : [];
    out.push({
      name: r.name,
      level: r.level,
      school: typeof r.school === 'string' ? (SCHOOLS[r.school] ?? r.school) : undefined,
      source,
      ritual: !!meta?.ritual,
      concentration: duration.some((d) => !!d?.concentration),
      ...readCastTime(r.time),
      ...readDuration(r.duration),
    });
  }
  return out.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

const UNIT_MINUTES: Record<string, number> = { action: 0, bonus: 0, reaction: 0, round: 0.1, minute: 1, hour: 60, day: 1440 };

/** 5etools `time: [{ number, unit }]` → a label and minutes. */
export function readCastTime(time: unknown): { castTime?: string; castMinutes?: number } {
  const t = Array.isArray(time) ? (time[0] as { number?: number; unit?: string } | undefined) : undefined;
  if (!t || typeof t.unit !== 'string') return {};
  const n = typeof t.number === 'number' ? t.number : 1;
  const unit = t.unit === 'bonus' ? 'bonus action' : t.unit;
  return { castTime: `${n} ${unit}${n > 1 ? 's' : ''}`, castMinutes: (UNIT_MINUTES[t.unit] ?? 0) * n };
}

/** 5etools `duration: [{ type, duration: { type, amount } }]` → minutes, instantaneous (null) or until dispelled. */
export function readDuration(duration: unknown): { durationMinutes?: number | null; permanent?: boolean } {
  const d = Array.isArray(duration) ? (duration[0] as { type?: string; duration?: { type?: string; amount?: number } } | undefined) : undefined;
  if (!d || typeof d.type !== 'string') return {};
  if (d.type === 'instant') return { durationMinutes: null };
  if (d.type === 'permanent') return { durationMinutes: null, permanent: true };
  if (d.type === 'timed' && d.duration && typeof d.duration.type === 'string') {
    return { durationMinutes: Math.max(1, Math.round((UNIT_MINUTES[d.duration.type] ?? 1) * (d.duration.amount ?? 1))) };
  }
  return {};
}

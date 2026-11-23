/**
 * Madness. The 2024 books leave it to the DM; this follows the optional madness rule of the 2014 DMG
 * (short-term, long-term and indefinite madness with their durations and cures), switchable as a table rule.
 * The effect lists are the app's own, written to fit the same three tiers.
 */
export type MadnessTier = 'short' | 'long' | 'indefinite';

export interface MadnessTierInfo {
  label: string;
  /** How long it lasts, as dice: minutes for short, hours for long. */
  duration: string;
  durationText: string;
  cure: string;
  effects: string[];
}

export const MADNESS: Record<MadnessTier, MadnessTierInfo> = {
  short: {
    label: 'Short-term madness',
    duration: '1d10',
    durationText: '1d10 minutes',
    cure: 'Ends on its own; Lesser Restoration ends it, Calm Emotions suppresses it.',
    effects: [
      'Withdraws into their own mind: Paralyzed. Taking any damage snaps them out of it.',
      'Becomes Incapacitated and spends the time screaming, laughing or weeping.',
      'Becomes Frightened and must spend each turn moving away from whatever caused it.',
      'Starts babbling and can’t speak coherently or cast spells with Verbal components.',
      'Must use their action each round to attack the nearest creature.',
      'Experiences vivid hallucinations: Disadvantage on ability checks.',
      'Does whatever anyone tells them that isn’t obviously self-destructive.',
      'Overwhelmed by a craving to eat something strange: dirt, slime, offal.',
      'Stunned.',
      'Falls Unconscious.',
    ],
  },
  long: {
    label: 'Long-term madness',
    duration: '1d10*10',
    durationText: '1d10 × 10 hours',
    cure: 'Ends on its own; Lesser Restoration ends it, Calm Emotions suppresses it.',
    effects: [
      'Compelled to repeat a small ritual (washing hands, counting steps, touching doorframes); Disadvantage on checks until it is done.',
      'Hears whispers no one else can: Disadvantage on Wisdom (Perception) checks.',
      'Hallucinates constantly: Disadvantage on ability checks.',
      'Can’t bear to be touched or crowded; recoils from anyone within 5 feet.',
      'Suffers a strange tremor: Disadvantage on attack rolls and Dexterity checks.',
      'Loses part of their memory: forgets who the other party members are, though they still act on instinct.',
      'Whenever they take damage, a DC 15 Wisdom save or be affected as by short-term madness.',
      'Can’t stop talking, often about the thing that broke them.',
      'Deeply suspicious: will not accept help, food or healing from anyone without a DC 10 Wisdom save.',
      'Convinced they are someone else and acts the part.',
    ],
  },
  indefinite: {
    label: 'Indefinite madness',
    duration: '',
    durationText: 'until cured',
    cure: 'Greater Restoration or more powerful magic; Remove Curse or Dispel Evil and Good may work, depending on the cause. Calm Emotions suppresses it.',
    effects: [
      '“Being drunk keeps me sane.”',
      '“I keep whatever I find.”',
      '“I try to become more like someone I know, copying their speech and habits.”',
      '“I have to bend the truth, exaggerate or lie to be interesting.”',
      '“Achieving my goal is the only thing that matters, and I’ll do anything for it.”',
      '“I find it hard to care about anything that goes on around me.”',
      '“I don’t like the way people judge me all the time.”',
      '“I am the smartest, wisest, strongest, fastest and most beautiful person I know.”',
      '“Someone powerful is hunting me, and their agents are everywhere.”',
      '“There’s only one person I trust, and only I can see this special friend.”',
    ],
  },
};

/** Spells and what they do to madness. */
export const MADNESS_SPELLS: Record<string, { ends: MadnessTier[]; suppress?: boolean; note: string }> = {
  'Calm Emotions': { ends: [], suppress: true, note: 'Suppresses the madness for the spell’s duration (Concentration, up to 1 minute).' },
  'Lesser Restoration': { ends: ['short', 'long'], note: 'Ends short-term and long-term madness.' },
  'Greater Restoration': { ends: ['short', 'long', 'indefinite'], note: 'Ends any madness.' },
  'Remove Curse': { ends: ['indefinite'], note: 'Ends indefinite madness if a curse caused it (the DM decides).' },
  'Dispel Evil and Good': { ends: ['indefinite'], note: 'Ends indefinite madness caused by a fiend, fey, undead or similar influence (the DM decides).' },
  Heal: { ends: ['short', 'long', 'indefinite'], note: 'Powerful enough to end any madness (table rule).' },
};

/** The effect a d10 (1–10) roll gives for a tier. */
export function madnessEffect(tier: MadnessTier, roll: number): string {
  const list = MADNESS[tier].effects;
  return list[Math.min(list.length, Math.max(1, Math.round(roll))) - 1];
}

/** Stress or Fear at or above this calls for a madness check (table rule, 0 = never). */
export const DEFAULT_MADNESS_THRESHOLD = 6;
/** The Wisdom save against madness when Stress or Fear hits the threshold (table rule). */
export const MADNESS_SAVE_DC = 15;

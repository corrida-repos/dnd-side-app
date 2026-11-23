/**
 * Madness, as the 5e rules give it (2014 DMG; the same rules and tables are in the System Reference Document 5.1,
 * CC BY 4.0). The 2024 books have no madness rules, so the whole feature is an optional rule behind a switch.
 * The DM decides when madness strikes, usually after a failed save against a madness-inducing effect.
 * Durations, effect tables (d100) and cures follow the source. Two table rules sit on top: Stress or Fear
 * reaching a threshold calls for a Wisdom save, and Heal is strong enough to end any madness.
 */
export type MadnessTier = 'short' | 'long' | 'indefinite';

export interface MadnessEffect {
  /** d100 range. */
  range: [number, number];
  text: string;
}

export interface MadnessTierInfo {
  label: string;
  /** How long it lasts, as dice: minutes for short, hours for long. */
  duration: string;
  durationText: string;
  cure: string;
  effects: MadnessEffect[];
}

const e = (lo: number, hi: number, text: string): MadnessEffect => ({ range: [lo, hi], text });

export const MADNESS: Record<MadnessTier, MadnessTierInfo> = {
  short: {
    label: 'Short-term madness',
    duration: '1d10',
    durationText: '1d10 minutes',
    cure: 'Lesser Restoration ends it; Calm Emotions suppresses it.',
    effects: [
      e(1, 20, 'The character retreats into their mind and becomes Paralyzed. The effect ends if they take any damage.'),
      e(21, 30, 'The character becomes Incapacitated and spends the duration screaming, laughing or weeping.'),
      e(31, 40, 'The character becomes Frightened and must use their action and movement each round to flee from the source of the fear.'),
      e(41, 50, 'The character begins babbling and is incapable of normal speech or spellcasting.'),
      e(51, 60, 'The character must use their action each round to attack the nearest creature.'),
      e(61, 70, 'The character experiences vivid hallucinations and has Disadvantage on ability checks.'),
      e(71, 75, 'The character does whatever anyone tells them to do that isn’t obviously self-destructive.'),
      e(76, 80, 'The character experiences an overpowering urge to eat something strange, such as dirt, slime or offal.'),
      e(81, 90, 'The character is Stunned.'),
      e(91, 100, 'The character falls Unconscious.'),
    ],
  },
  long: {
    label: 'Long-term madness',
    duration: '1d10*10',
    durationText: '1d10 × 10 hours',
    cure: 'Lesser Restoration ends it; Calm Emotions suppresses it.',
    effects: [
      e(1, 10, 'The character feels compelled to repeat a specific activity over and over, such as washing hands, touching things, praying or counting coins.'),
      e(11, 20, 'The character experiences vivid hallucinations and has Disadvantage on ability checks.'),
      e(21, 30, 'The character suffers extreme paranoia and has Disadvantage on Wisdom and Charisma checks.'),
      e(31, 40, 'The character regards something (usually the source of the madness) with intense revulsion, as if affected by the antipathy effect of the Antipathy/Sympathy spell.'),
      e(41, 45, 'The character experiences a powerful delusion and imagines they are under the effect of a potion of the DM’s choice.'),
      e(46, 55, 'The character becomes attached to a “lucky charm”, such as a person or an object, and has Disadvantage on attack rolls, ability checks and saving throws while more than 30 feet from it.'),
      e(56, 65, 'The character is Blinded (25%) or Deafened (75%).'),
      e(66, 75, 'The character experiences uncontrollable tremors or tics, which impose Disadvantage on attack rolls, ability checks and saving throws that involve Strength or Dexterity.'),
      e(76, 85, 'The character suffers from partial amnesia: they know who they are and retain racial traits and class features, but don’t recognize other people or remember anything that happened before the madness took effect.'),
      e(86, 90, 'Whenever the character takes damage, they must succeed on a DC 15 Wisdom saving throw or be affected as though they failed a saving throw against the Confusion spell, for 1 minute.'),
      e(91, 95, 'The character loses the ability to speak.'),
      e(96, 100, 'The character falls Unconscious. No amount of jostling or damage can wake them.'),
    ],
  },
  indefinite: {
    label: 'Indefinite madness',
    duration: '',
    durationText: 'until cured',
    cure: 'Greater Restoration or more powerful magic ends it; depending on the source, Remove Curse or Dispel Evil and Good may also work. Calm Emotions suppresses it.',
    effects: [
      e(1, 15, '“Being drunk keeps me sane.”'),
      e(16, 25, '“I keep whatever I find.”'),
      e(26, 30, '“I try to become more like someone else I know, adopting their style of dress, mannerisms and name.”'),
      e(31, 35, '“I must bend the truth, exaggerate or outright lie to be interesting to other people.”'),
      e(36, 45, '“Achieving my goal is the only thing of interest to me, and I’ll ignore everything else to pursue it.”'),
      e(46, 50, '“I find it hard to care about anything that goes on around me.”'),
      e(51, 55, '“I don’t like the way people judge me all the time.”'),
      e(56, 70, '“I am the smartest, wisest, strongest, fastest and most beautiful person I know.”'),
      e(71, 80, '“I am convinced that powerful enemies are hunting me, and their agents are everywhere I go. I am sure they’re watching me all the time.”'),
      e(81, 85, '“There’s only one person I can trust. And only I can see this special friend.”'),
      e(86, 95, '“I can’t take anything seriously. The more serious the situation, the funnier I find it.”'),
      e(96, 100, '“I’ve discovered that I really like killing people.”'),
    ],
  },
};

/** Spells and what they do to madness (5e rules: "Curing Madness"). */
export const MADNESS_SPELLS: Record<string, { ends: MadnessTier[]; suppress?: boolean; note: string }> = {
  'Calm Emotions': { ends: [], suppress: true, note: 'Suppresses the effects of madness while it lasts.' },
  'Lesser Restoration': { ends: ['short', 'long'], note: 'Rids a character of short-term or long-term madness.' },
  'Greater Restoration': { ends: ['short', 'long', 'indefinite'], note: 'Rids a character of indefinite madness (and any lesser madness).' },
  'Remove Curse': { ends: ['indefinite'], note: 'May be effective, depending on the source of the madness (the DM decides).' },
  'Dispel Evil and Good': { ends: ['indefinite'], note: 'May be effective, depending on the source of the madness (the DM decides).' },
  Heal: { ends: ['short', 'long', 'indefinite'], note: 'Table rule: powerful enough to end any madness.' },
};

/** Table rule: Stress or Fear reaching this calls for a Wisdom save against long-term madness. */
export const MADNESS_THRESHOLD = 6;
export const MADNESS_SAVE_DC = 15;

/** The effect a d100 roll gives for a tier. */
export function madnessEffect(tier: MadnessTier, roll: number): string {
  const r = Math.min(100, Math.max(1, Math.round(roll)));
  return MADNESS[tier].effects.find((x) => r >= x.range[0] && r <= x.range[1])!.text;
}

/** Spells whose curing power depends on the madness's source: the app ends it, and notes the DM's call. */
export const DEPENDS_ON_SOURCE = ['Remove Curse', 'Dispel Evil and Good'];

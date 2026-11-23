/** Spells with Material components that have a cost (2024 PHB). A focus or component pouch can't replace these. */
export interface CostlyComponent {
  spell: string;
  gp: number;
  /** Word an inventory item's name must contain, e.g. "diamond". */
  match: string;
  what: string;
  consumed: boolean;
}

export const COSTLY_COMPONENTS: CostlyComponent[] = [
  { spell: 'Find Familiar', gp: 10, match: 'incense', what: 'burning incense worth 10+ GP', consumed: true },
  { spell: 'Identify', gp: 100, match: 'pearl', what: 'a pearl worth 100+ GP', consumed: false },
  { spell: 'Chromatic Orb', gp: 50, match: 'diamond', what: 'a diamond worth 50+ GP', consumed: false },
  { spell: 'Arcane Lock', gp: 25, match: 'gold dust', what: 'gold dust worth 25+ GP', consumed: true },
  { spell: 'Augury', gp: 25, match: 'sticks', what: 'specially marked sticks, bones or cards worth 25+ GP', consumed: false },
  { spell: 'Continual Flame', gp: 50, match: 'ruby', what: 'ruby dust worth 50+ GP', consumed: true },
  { spell: 'Magic Mouth', gp: 10, match: 'jade', what: 'jade dust worth 10+ GP', consumed: true },
  { spell: 'Warding Bond', gp: 50, match: 'ring', what: 'a pair of platinum rings worth 50+ GP each', consumed: false },
  { spell: 'Glyph of Warding', gp: 200, match: 'diamond', what: 'powdered diamond worth 200+ GP', consumed: true },
  { spell: 'Nondetection', gp: 25, match: 'diamond', what: 'diamond dust worth 25+ GP', consumed: true },
  { spell: 'Revivify', gp: 300, match: 'diamond', what: 'a diamond worth 300+ GP', consumed: true },
  { spell: 'Divination', gp: 25, match: 'incense', what: 'incense worth 25+ GP', consumed: true },
  { spell: 'Stoneskin', gp: 100, match: 'diamond', what: 'diamond dust worth 100+ GP', consumed: true },
  { spell: 'Greater Restoration', gp: 100, match: 'diamond', what: 'diamond dust worth 100+ GP', consumed: true },
  { spell: 'Legend Lore', gp: 250, match: 'incense', what: 'incense worth 250+ GP', consumed: true },
  { spell: 'Raise Dead', gp: 500, match: 'diamond', what: 'a diamond worth 500+ GP', consumed: true },
  { spell: 'Reincarnate', gp: 1000, match: 'oil', what: 'rare oils worth 1,000+ GP', consumed: true },
  { spell: 'Scrying', gp: 1000, match: 'focus', what: 'a focus worth 1,000+ GP', consumed: false },
  { spell: 'Teleportation Circle', gp: 50, match: 'chalk', what: 'rare chalks and inks worth 50+ GP', consumed: true },
  { spell: "Heroes' Feast", gp: 1000, match: 'bowl', what: 'a gem-encrusted bowl worth 1,000+ GP', consumed: true },
  { spell: 'True Seeing', gp: 25, match: 'mushroom', what: 'mushroom powder worth 25+ GP', consumed: true },
  { spell: 'Forbiddance', gp: 1000, match: 'ruby', what: 'ruby dust worth 1,000+ GP', consumed: true },
  { spell: 'Hallow', gp: 1000, match: 'incense', what: 'incense worth 1,000+ GP', consumed: true },
  { spell: 'Resurrection', gp: 1000, match: 'diamond', what: 'a diamond worth 1,000+ GP', consumed: true },
  { spell: 'Simulacrum', gp: 1500, match: 'ruby', what: 'powdered ruby worth 1,500+ GP', consumed: true },
  { spell: 'Clone', gp: 1000, match: 'diamond', what: 'a diamond worth 1,000+ GP (plus a sealable vessel worth 2,000+ GP)', consumed: true },
  { spell: 'Astral Projection', gp: 1000, match: 'jacinth', what: 'a jacinth worth 1,000+ GP per traveler', consumed: true },
  { spell: 'True Resurrection', gp: 25000, match: 'diamond', what: 'diamonds worth 25,000+ GP', consumed: true },
];

export const componentFor = (spell: string): CostlyComponent | undefined => COSTLY_COMPONENTS.find((c) => c.spell.toLowerCase() === spell.toLowerCase());

/** Spells this tracker can apply to a target, with what they do (2024 PHB). */
export const TARGET_SPELLS: Record<string, string> = {
  'Lesser Restoration': 'Ends Blinded, Deafened, Paralyzed or Poisoned (here: Poisoned, then Blinded); also cures Sight Rot.',
  'Greater Restoration': 'Removes 1 Exhaustion level, or ends a curse, Charmed or Petrified (here: Exhaustion first, else a curse).',
  'Remove Curse': 'Ends every curse on the target; attunement to a cursed item can then be ended.',
  Heal: 'Restores 70 HP and ends Blinded, Deafened and Poisoned; as magical healing of 6th level it also ends lingering injuries and scars, and (table rule) any madness.',
  'Cure Wounds': 'Restores HP; as magical healing it ends a limp, internal injury, broken ribs or a festering wound (lingering injuries).',
  'Healing Word': 'Restores HP; as magical healing it ends a limp, internal injury, broken ribs or a festering wound (lingering injuries).',
  Regenerate: 'Restores lost limbs and eyes and ends every lingering injury.',
  'Calm Emotions': 'Suppresses madness while the caster concentrates.',
  'Dispel Evil and Good': 'May end indefinite madness, depending on its source (the DM decides).',
  Revivify: 'Returns a creature dead no longer than 1 minute with 1 HP.',
  'Raise Dead': 'Returns a creature dead no longer than 10 days with 1 HP and a −4 penalty to D20 Tests that drops by 1 each Long Rest.',
  Reincarnate: 'Returns a creature dead no longer than 10 days in a new body (roll its species), with all HP.',
  Resurrection: 'Returns a creature dead no longer than 100 years with all HP and the −4 penalty of Raise Dead.',
  'True Resurrection': 'Returns a creature dead no longer than 200 years with all HP, no penalty.',
};

/** Revival spells: the most minutes since death they can bridge. */
export const REVIVAL_LIMIT: Record<string, number> = {
  Revivify: 1,
  'Raise Dead': 10 * 24 * 60,
  Reincarnate: 10 * 24 * 60,
  Resurrection: 100 * 365 * 24 * 60,
  'True Resurrection': 200 * 365 * 24 * 60,
};

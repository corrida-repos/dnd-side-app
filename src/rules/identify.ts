import type { Rarity } from './crafting';

export type ClueKind = 'property' | 'attunement' | 'charges' | 'curse';
export const CLUE_KIND_LABEL: Record<ClueKind, string> = { property: 'Property', attunement: 'Attunement', charges: 'Charges', curse: 'Curse' };

/** How the party learns about an unknown item. */
export type StudyMethod = 'detect' | 'arcana' | 'experiment' | 'identify' | 'attune' | 'dm';
export const STUDY_LABEL: Record<StudyMethod, string> = {
  detect: 'Detect Magic',
  arcana: 'Arcana check',
  experiment: 'Experimenting',
  identify: 'Identify or a Short Rest of study',
  attune: 'Attuning',
  dm: 'Revealed by the DM',
};

/** Table rule: Intelligence (Arcana) DC to work out one property of an unknown item, by rarity. */
export const ARCANA_DC: Record<Rarity | 'unknown', number> = { common: 10, uncommon: 15, rare: 20, veryRare: 25, legendary: 30, unknown: 15 };
/** Table rule: minutes spent studying or experimenting with an item. */
export const STUDY_MINUTES = 10;

export const SCHOOLS_OF_MAGIC = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];

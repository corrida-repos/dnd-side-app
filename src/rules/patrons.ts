import type { Lifestyle } from './money';

/** Group patrons (Tasha's Cauldron of Everything). Perks are short paraphrases; what the tracker automates is listed per patron. */
export type PatronKind = 'academy' | 'ancient' | 'aristocrat' | 'syndicate' | 'guild' | 'military' | 'religious' | 'sovereign';

export interface PatronInfo {
  label: string;
  /** GP per day paid to each member. */
  salaryGp?: number;
  /** Lodging the patron provides for free, up to this lifestyle. */
  freeLifestyle?: Lifestyle;
  /** Guild rooms: a comfortable lifestyle at this daily price. */
  comfortableAt?: number;
  /** Shop discount on everything, or on weapons and armor only. */
  discountAll?: number;
  discountArms?: number;
  /** Better prices selling legal goods (guild). */
  saleBonus?: number;
  trainingHalfCost?: boolean;
  trainingHalfTime?: boolean;
  /** Free spellcasting up to this level, components provided (religious order). */
  freeSpellLevel?: number;
  /** Share of an assignment's fee passed to the party (syndicate). */
  assignmentShare?: number;
  /** Common magic items for 2d4 × 10 GP, half for consumables (ancient being). */
  commonItems?: boolean;
  /** Two weeks a year of aristocratic living for free (aristocrat). */
  luxuryWeeks?: number;
  perks: string[];
}

export const PATRONS: Record<PatronKind, PatronInfo> = {
  academy: { label: 'Academy', salaryGp: 1, trainingHalfCost: true, perks: ['Pay of 1 GP a day each (or bounties of 250+ GP for discoveries)', 'Papers and letters of introduction that open scholarly doors', 'Delegate research to colleagues', 'Access to restricted collections and faculty expertise', 'Training at half cost in subjects the academy teaches'] },
  ancient: { label: 'Ancient Being', freeLifestyle: 'modest', commonItems: true, perks: ['Buy Common magic items for 2d4 × 10 GP (half for consumables)', 'Advantage on research checks tied to the patron’s interests', 'Modest living in hidden sanctuaries for free, if you guard them', 'A supernatural gift at level 5 and again at 13'] },
  aristocrat: { label: 'Aristocrat', salaryGp: 1, luxuryWeeks: 2, perks: ['Pay of 1 GP a day each', 'Reasonable expenses reimbursed', 'Near immunity to prosecution within the aristocrat’s reach while on their business', 'Up to two weeks a year of aristocratic hospitality for free'] },
  syndicate: { label: 'Criminal Syndicate', freeLifestyle: 'poor', discountAll: 0.05, assignmentShare: 0.85, perks: ['Assignments pay you 85% of the client’s fee', 'Contraband (poisons and worse) can always be bought', 'Fences sell stolen goods, art and magic items for you', 'Poor living in safe houses for free (betray one and lose favor)', '5% off at syndicate-owned businesses'] },
  guild: { label: 'Guild', comfortableAt: 0.5, saleBonus: 0.1, trainingHalfTime: true, perks: ['Comfortable rooms at the guildhall for 5 SP a day', 'Guild equipment doubles your proficiency bonus with artisan’s tools there', 'Contacts find exotic materials and buyers; prices tip in your favor (table rule: 10%)', 'Training takes half as long in the guild’s specialties'] },
  military: { label: 'Military Force', salaryGp: 1, discountArms: 0.2, perks: ['Pay and at least a modest living (table rule: 1 GP a day)', '20% off nonmagical weapons and armor at military facilities', 'Answer to your officers, not the local watch', 'Access to installations off limits to civilians', 'Clear orders from a commanding officer'] },
  religious: { label: 'Religious Order', freeSpellLevel: 5, perks: ['Priests cast spells up to level 5 for you for free, components included, when the need serves the faith', 'A holy symbol or druidic focus and a book of scripture each', 'Proficiency in Religion for everyone'] },
  sovereign: { label: 'Sovereign', salaryGp: 1, perks: ['Pay of 1 GP a day each', 'Access to the halls of power and state secrets, with permission', 'Reasonable expenses reimbursed', 'Near immunity to prosecution within the realm while on royal business'] },
};

/** Tasha's: every member can grant Advantage to an ally's check, attack or save once, then not again until a Long Rest. */
export const GROUP_ASSISTANCE = 'Group Assistance';

import type { Size } from '../state/types';
import { proficiencyBonus } from './survival';

/**
 * Sidekicks (optional rule, Tasha's Cauldron of Everything, pp. 142–146). A creature of CR 1/2 or lower that is a
 * friend of at least one adventurer gains levels in one of three simple classes. It starts at the party's average
 * level and gains a level whenever that average goes up, rolling its Hit Die (plus Constitution modifier, minimum 1)
 * each time. Hiring one as a paid co-adventurer is a table rule: the pay makes the friendship.
 */
export type SidekickClass = 'expert' | 'spellcaster' | 'warrior';
export type SidekickRole = 'attacker' | 'defender' | 'mage' | 'healer' | 'prodigy';

export const SIDEKICK_CLASS_LABEL: Record<SidekickClass, string> = { expert: 'Expert', spellcaster: 'Spellcaster', warrior: 'Warrior' };
export const SIDEKICK_ROLES: Record<SidekickClass, SidekickRole[]> = { expert: [], spellcaster: ['mage', 'healer', 'prodigy'], warrior: ['attacker', 'defender'] };
export const ROLE_LABEL: Record<SidekickRole, string> = {
  attacker: 'Attacker (+2 to all attack rolls)',
  defender: 'Defender (reaction: Disadvantage on an attack against an ally within 5 ft)',
  mage: 'Mage (Wizard spells, Intelligence)',
  healer: 'Healer (Cleric and Druid spells, Wisdom)',
  prodigy: 'Prodigy (Bard and Warlock spells, Charisma)',
};

/** The Expert and Spellcaster classes need a creature that speaks at least one language. */
export const NEEDS_LANGUAGE: Record<SidekickClass, boolean> = { expert: true, spellcaster: true, warrior: false };

/** Creature types that are animals, not people: they can't be hired or talked round, only tamed (Camp tab) and then made sidekicks. */
export const ANIMAL_TYPES = ['beast', 'monstrosity'];
export const isAnimal = (type: string | undefined): boolean => !!type && ANIMAL_TYPES.includes(type.toLowerCase());
export const ANIMAL_NOTE = 'an animal isn’t hired or talked round: tame it on the Camp tab, then make it a sidekick there';

/** Tasha's: the stat block's challenge rating must be 1/2 or lower. */
export const SIDEKICK_MAX_CR = 0.5;

/** 2024 Monster Manual: a creature's Hit Die by size. */
export const HIT_DIE_BY_SIZE: Record<Size, number> = { Tiny: 4, Small: 6, Medium: 8, Large: 10, Huge: 12, Gargantuan: 20 };

export interface SidekickFeature {
  level: number;
  name: string;
  text: string;
}

const ASI = (lv: number): SidekickFeature => ({ level: lv, name: 'Ability Score Improvement', text: 'One ability score +2, or two +1 (max 20); a feat instead if the DM allows. Adjust the stat block’s attacks and DCs.' });

export const SIDEKICK_FEATURES: Record<SidekickClass, SidekickFeature[]> = {
  expert: [
    { level: 1, name: 'Bonus Proficiencies', text: 'One saving throw (Dex, Int or Cha), five skills and light armor; a humanoid or armed creature also gets simple weapons and two tools.' },
    { level: 1, name: 'Helpful', text: 'The Help action as a Bonus Action.' },
    { level: 2, name: 'Cunning Action', text: 'Dash, Disengage or Hide as a Bonus Action.' },
    { level: 3, name: 'Expertise', text: 'Double proficiency on two chosen skills.' },
    ASI(4),
    { level: 6, name: 'Coordinated Strike', text: 'Helping an ally attack works on a target up to 30 ft away, and the sidekick deals 2d6 extra damage to it on its next hit this turn.' },
    { level: 7, name: 'Evasion', text: 'Dex saves for half damage: no damage on a success, half on a failure.' },
    ASI(8),
    ASI(10),
    { level: 11, name: 'Inspiring Help', text: 'The creature it Helps adds 1d6 to the d20 roll (or to the damage, for an attack).' },
    ASI(12),
    { level: 14, name: 'Reliable Talent', text: 'On ability checks with its whole proficiency bonus, a d20 roll of 9 or lower counts as 10.' },
    { level: 15, name: 'Expertise', text: 'Two more skills with double proficiency.' },
    ASI(16),
    { level: 18, name: 'Sharp Mind', text: 'Proficiency in Intelligence, Wisdom or Charisma saving throws.' },
    ASI(19),
    { level: 20, name: 'Inspiring Help Improvement', text: 'Inspiring Help adds 2d6.' },
  ],
  spellcaster: [
    { level: 1, name: 'Bonus Proficiencies', text: 'One saving throw (Wis, Int or Cha), two skills from Arcana, History, Insight, Investigation, Medicine, Performance, Persuasion and Religion, light armor; a humanoid or armed creature also gets simple weapons.' },
    { level: 1, name: 'Spellcasting', text: 'Casts spells from its role’s list; regains all slots on a Long Rest. Replaces any Spellcasting trait.' },
    ASI(4),
    { level: 6, name: 'Potent Cantrips', text: 'Adds its spellcasting ability modifier to cantrip damage.' },
    ASI(8),
    ASI(12),
    { level: 14, name: 'Empowered Spells', text: 'Adds its spellcasting modifier to the damage or healing of slot spells of one chosen school.' },
    ASI(16),
    ASI(18),
    { level: 20, name: 'Focused Casting', text: 'Taking damage can’t break its Concentration.' },
  ],
  warrior: [
    { level: 1, name: 'Bonus Proficiencies', text: 'One saving throw (Str, Dex or Con), two skills from Acrobatics, Animal Handling, Athletics, Intimidation, Nature, Perception and Survival, all armor; a humanoid or armed creature also gets shields and simple and martial weapons.' },
    { level: 1, name: 'Martial Role', text: 'Attacker (+2 to attack rolls) or Defender (reaction: Disadvantage on an attack against someone else within 5 ft).' },
    { level: 2, name: 'Second Wind', text: 'Bonus Action: regain 1d10 + level HP, once per Short or Long Rest.' },
    { level: 3, name: 'Improved Critical', text: 'Critical hits on a 19 or 20.' },
    ASI(4),
    { level: 6, name: 'Extra Attack', text: 'Two attacks with the Attack action (not with Multiattack on the same turn).' },
    { level: 7, name: 'Battle Readiness', text: 'Advantage on Initiative.' },
    ASI(8),
    { level: 10, name: 'Improved Defense', text: '+1 AC.' },
    { level: 11, name: 'Indomitable', text: 'Reroll a failed saving throw, once per Long Rest.' },
    ASI(12),
    ASI(14),
    { level: 15, name: 'Extra Attack Improvement', text: 'Three attacks with the Attack action.' },
    ASI(16),
    { level: 18, name: 'Indomitable Improvement', text: 'Indomitable twice per Long Rest.' },
    ASI(19),
    { level: 20, name: 'Second Wind Improvement', text: 'Second Wind twice between rests.' },
  ],
};

/** Spellcaster sidekick: cantrips known, spells known and slots of levels 1–5, by level (index 0 = level 1). */
export const CASTER_CANTRIPS = [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
export const CASTER_SPELLS = [1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11];
export const CASTER_SLOTS: number[][] = [
  [2, 0, 0, 0, 0], [2, 0, 0, 0, 0], [3, 0, 0, 0, 0], [3, 0, 0, 0, 0], [4, 2, 0, 0, 0],
  [4, 2, 0, 0, 0], [4, 3, 0, 0, 0], [4, 3, 0, 0, 0], [4, 3, 2, 0, 0], [4, 3, 2, 0, 0],
  [4, 3, 3, 0, 0], [4, 3, 3, 0, 0], [4, 3, 3, 1, 0], [4, 3, 3, 1, 0], [4, 3, 3, 2, 0],
  [4, 3, 3, 2, 0], [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2],
];

/** Features gained at exactly this level. */
export const featuresAt = (cls: SidekickClass, level: number): SidekickFeature[] => SIDEKICK_FEATURES[cls].filter((f) => f.level === level);

/** Resources the class gives at a level: Second Wind and Indomitable for Warriors, spell slots for Spellcasters. */
export function sidekickResources(cls: SidekickClass, level: number): { name: string; max: number; recharge: 'short' | 'long' }[] {
  if (cls === 'warrior') {
    const out: { name: string; max: number; recharge: 'short' | 'long' }[] = [];
    if (level >= 2) out.push({ name: 'Second Wind', max: level >= 20 ? 2 : 1, recharge: 'short' });
    if (level >= 11) out.push({ name: 'Indomitable', max: level >= 18 ? 2 : 1, recharge: 'long' });
    return out;
  }
  if (cls === 'spellcaster') {
    const row = CASTER_SLOTS[Math.min(20, Math.max(1, level)) - 1];
    return row.map((n, i) => ({ name: `Spell slots (level ${i + 1})`, max: n, recharge: 'long' as const })).filter((r) => r.max > 0);
  }
  return [];
}

/** Tasha's: a sidekick's level is the party's average level (rounded down, at least 1). */
export function sidekickLevelFor(pcLevels: number[]): number {
  if (!pcLevels.length) return 1;
  return Math.min(20, Math.max(1, Math.floor(pcLevels.reduce((a, b) => a + b, 0) / pcLevels.length)));
}

/** HP gained on reaching a level: the Hit Die roll plus Constitution modifier, at least 1. */
export const hpForLevel = (roll: number, conMod: number): number => Math.max(1, roll + conMod);

/** Table rule: a hired co-adventurer's daily pay, the 2024 PHB rate for a skilled hireling. */
export const SIDEKICK_WAGE_GP = 2;

export const sidekickProficiency = (level: number): number => proficiencyBonus(level);

// ---------------------------------------------------------------- the kinds of people who can be hired or won over

export type SidekickKind = 'sellsword' | 'bodyguard' | 'scout' | 'mage' | 'healer' | 'minstrel';

export interface SidekickKindInfo {
  label: string;
  /** Who they are, in a few words. */
  blurb: string;
  cls: SidekickClass;
  role: SidekickRole | null;
  /** The 2024 Monster Manual stat block they're built on (CR 1/2 or lower). */
  creature: string;
  cr: string;
  hp: number;
  con: number;
  int: number;
  passivePerception: number;
}

/**
 * A sidekick comes with their class: hire (or win over) a warrior, an expert or a spellcaster, built on a fitting
 * 2024 Monster Manual stat block of CR 1/2 or lower. The Mage uses the Noble (Int 12, three languages), since the
 * Mage Apprentice is CR 2; the Spellcaster class replaces any spellcasting the stat block has (Tasha's).
 */
export const SIDEKICK_KINDS: Record<SidekickKind, SidekickKindInfo> = {
  sellsword: { label: 'Sellsword', blurb: 'a hard-bitten fighter who hits first', cls: 'warrior', role: 'attacker', creature: 'Tough', cr: '1/2', hp: 32, con: 14, int: 10, passivePerception: 10 },
  bodyguard: { label: 'Bodyguard', blurb: 'a trained guard who keeps others safe', cls: 'warrior', role: 'defender', creature: 'Guard', cr: '1/8', hp: 11, con: 12, int: 10, passivePerception: 12 },
  scout: { label: 'Scout', blurb: 'a skilled guide, tracker and lookout', cls: 'expert', role: null, creature: 'Scout', cr: '1/2', hp: 16, con: 12, int: 11, passivePerception: 15 },
  mage: { label: 'Mage', blurb: 'a learned spellcaster with a wizard’s spells', cls: 'spellcaster', role: 'mage', creature: 'Noble', cr: '1/8', hp: 9, con: 11, int: 12, passivePerception: 12 },
  healer: { label: 'Healer', blurb: 'a priest or druid who mends wounds', cls: 'spellcaster', role: 'healer', creature: 'Priest Acolyte', cr: '1/4', hp: 11, con: 12, int: 10, passivePerception: 12 },
  minstrel: { label: 'Minstrel', blurb: 'a performer with a bard’s magic', cls: 'spellcaster', role: 'prodigy', creature: 'Performer', cr: '1/2', hp: 27, con: 12, int: 13, passivePerception: 12 },
};

export const SIDEKICK_KIND_IDS = Object.keys(SIDEKICK_KINDS) as SidekickKind[];

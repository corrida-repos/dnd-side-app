export const CREATURE_SPELLS = {
  'animate dead': 'Animate Dead',
  'create undead': 'Create Undead',
  'planar binding': 'Planar Binding',
  'find familiar': 'Find Familiar',
  'find steed': 'Find Steed',
  awaken: 'Awaken',
} as const;

export type CreatureSpell = keyof typeof CREATURE_SPELLS;
export type SpiritType = 'Celestial' | 'Fey' | 'Fiend';
export type CreatureStatus = 'present' | 'dismissed' | 'gone' | 'uncontrolled' | 'independent';

export interface SpellCreature {
  id: string;
  spell: CreatureSpell;
  casterId: string;
  name: string;
  form: string;
  spirit?: SpiritType;
  slotLevel: number;
  status: CreatureStatus;
  until?: number;
  summonId?: string;
  order: string;
}

export interface CreatureCast {
  name?: string;
  form?: string;
  spirit?: SpiritType;
  count?: number;
  renewIds?: string[];
  summonId?: string;
  saveFailed?: boolean;
}

export function creatureSpell(key: string): CreatureSpell | undefined {
  return Object.hasOwn(CREATURE_SPELLS, key) ? key as CreatureSpell : undefined;
}

export function undeadLimits(spell: CreatureSpell, slotLevel: number, renewing: boolean): Record<string, number> {
  if (spell === 'animate dead') {
    const limit = (renewing ? 4 : 1) + 2 * Math.max(0, slotLevel - 3);
    return { Skeleton: limit, Zombie: limit };
  }
  if (spell !== 'create undead') return {};
  const limits: Record<string, number> = { Ghoul: Math.min(6, slotLevel - 3) };
  if (slotLevel >= 8) Object.assign(limits, { Ghast: slotLevel - 6, Wight: slotLevel - 6 });
  if (slotLevel >= 9) limits.Mummy = 2;
  return limits;
}

export const PLANAR_BINDING_DAYS: Readonly<Record<number, number>> = { 5: 1, 6: 10, 7: 30, 8: 180, 9: 366 };

const BINDABLE_SUMMONS = /^(summon (?:celestial|elemental|fey|fiend|greater demon|lesser demons)|infernal calling)$/i;

export function bindableSummon(name: string): boolean {
  return BINDABLE_SUMMONS.test(name);
}

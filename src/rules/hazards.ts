/** Environmental hazards from the 2024 DMG, summarised in a few words each. */
export type HazardId = 'deepWater' | 'thinIce' | 'slipperyIce' | 'webs' | 'razorvine' | 'poisonGas' | 'rockslide' | 'quicksand';

export interface Hazard {
  name: string;
  summary: string;
  save?: { ability: string; dc: number; damage?: string; damageType?: string; halfOnSave?: boolean; onFail: string };
}

export const HAZARDS: Record<HazardId, Hazard> = {
  deepWater: { name: 'Deep water', summary: 'Swimming more than 100 feet down: after each hour, a creature without a Swim Speed makes a DC 10 Constitution save or gains 1 Exhaustion level.' },
  thinIce: { name: 'Thin ice', summary: 'Each 10-foot square holds 3d10 × 10 pounds. More weight than that and it breaks, dropping everyone on it into frigid water.' },
  slipperyIce: { name: 'Slippery ice', summary: 'Difficult Terrain. Moving onto it or starting a turn on it calls for a save.', save: { ability: 'Dexterity', dc: 10, onFail: 'falls Prone' } },
  webs: { name: 'Webs', summary: 'Difficult Terrain. Escaping takes an action and a DC 12 Strength (Athletics) or Dexterity (Acrobatics) check. Each 10-foot cube has AC 10, 15 HP, and is Vulnerable to fire.', save: { ability: 'Dexterity', dc: 12, onFail: 'is Restrained' } },
  razorvine: { name: 'Razorvine', summary: 'Bladed thorns in hedges and walls (AC 11, 25 HP per section). Touching it for the first time on a turn calls for a save.', save: { ability: 'Dexterity', dc: 10, damage: '1d10', damageType: 'Slashing', onFail: 'is cut' } },
  poisonGas: { name: 'Poisonous gas', summary: 'Fills enclosed spaces; a strong wind disperses it for a minute. Creatures in it also have Disadvantage on death saves.', save: { ability: 'Constitution', dc: 12, damage: '1d10', damageType: 'Poison', halfOnSave: true, onFail: 'chokes on the gas' } },
  rockslide: { name: 'Rockslide', summary: 'Everyone in its path saves. On a failure they are knocked Prone, carried along and buried (Restrained); digging out takes an action and a DC 15 Strength (Athletics) check.', save: { ability: 'Dexterity', dc: 15, damage: '2d10', damageType: 'Bludgeoning', halfOnSave: true, onFail: 'is knocked Prone and buried' } },
  quicksand: { name: 'Quicksand pit', summary: 'A creature entering it sinks 1d4 + 1 feet and is Restrained, sinking 1d4 feet more each turn. Escaping takes an action and a Strength (Athletics) check of 10 + the feet sunk. Fully under, it risks suffocation.' },
};

/** Supernatural gifts and curses (DMG), tracked as long effects; Charms also have limited uses. */
export type GiftType = 'Blessing' | 'Boon' | 'Charm' | 'Curse' | 'Other';
export const GIFT_TYPES: GiftType[] = ['Blessing', 'Boon', 'Charm', 'Curse', 'Other'];

/** 5etools rewards file: names and types only. */
export function parse5eToolsRewards(json: unknown): { name: string; type: string }[] {
  const list = Array.isArray((json as { reward?: unknown })?.reward) ? ((json as { reward: unknown[] }).reward as { name?: unknown; type?: unknown }[]) : [];
  const seen = new Set<string>();
  return list
    .filter((r) => typeof r.name === 'string')
    .map((r) => ({ name: r.name as string, type: typeof r.type === 'string' ? (r.type as string) : 'Other' }))
    .filter((r) => !seen.has(r.name) && seen.add(r.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface ItemRef {
  name: string;
  rarity: string;
  attunement: boolean;
  charges: number | null;
  regain: string;
  regainAt: 'dawn' | 'longRest' | 'shortRest' | 'never';
  weight: number | null;
}

/** 5etools items file: magic items only, with rarity, attunement, charges and recharge (no rules text). */
export function parse5eToolsItems(json: unknown): ItemRef[] {
  const list = Array.isArray((json as { item?: unknown })?.item) ? ((json as { item: unknown[] }).item as Record<string, unknown>[]) : [];
  const out = new Map<string, ItemRef>();
  for (const r of list) {
    if (typeof r.name !== 'string' || !r.rarity || r.rarity === 'none') continue;
    const amount = typeof r.rechargeAmount === 'number' ? String(r.rechargeAmount) : typeof r.rechargeAmount === 'string' ? (r.rechargeAmount.match(/\d*d\d+(?:\s*[+-]\s*\d+)?|\d+/)?.[0] ?? 'all').replace(/\s/g, '') : 'all';
    const rec = r.recharge === 'dawn' || r.recharge === 'dusk' || r.recharge === 'midnight' ? 'dawn' : r.recharge === 'restLong' ? 'longRest' : r.recharge === 'restShort' ? 'shortRest' : 'never';
    out.set(r.name.toLowerCase(), {
      name: r.name,
      rarity: String(r.rarity),
      attunement: !!r.reqAttune,
      charges: typeof r.charges === 'number' ? r.charges : null,
      regain: amount,
      regainAt: typeof r.charges === 'number' ? rec : 'never',
      weight: typeof r.weight === 'number' ? r.weight : null,
    });
  }
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** 5etools spell source lookup: spell name → classes that can learn it. */
export function parse5eToolsSpellClasses(json: unknown): Record<string, string[]> {
  const out: Record<string, Set<string>> = {};
  for (const bySpell of Object.values((json ?? {}) as Record<string, Record<string, { class?: Record<string, Record<string, unknown>> }>>)) {
    if (!bySpell || typeof bySpell !== 'object') continue;
    for (const [spell, info] of Object.entries(bySpell)) {
      for (const bySource of Object.values(info?.class ?? {})) {
        for (const cls of Object.keys(bySource ?? {})) (out[spell.toLowerCase()] ??= new Set()).add(cls);
      }
    }
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v].sort()]));
}

/** 5etools recipes file: just the dish names, for campfire flavor. */
export function parse5eToolsRecipes(json: unknown): string[] {
  const list = Array.isArray((json as { recipe?: unknown })?.recipe) ? ((json as { recipe: unknown[] }).recipe as { name?: unknown }[]) : [];
  return [...new Set(list.map((r) => r.name).filter((n): n is string => typeof n === 'string'))].sort();
}

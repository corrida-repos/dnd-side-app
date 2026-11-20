/**
 * Reads a D&D Beyond character JSON (the character service's "v5" format) that the user pastes in.
 * D&D Beyond has no public API, so this is deliberately forgiving: anything missing is simply skipped.
 */
import type { CharacterSpell, ClassName, InventoryItem, MagicItem, Resource, Size } from '../state/types';
import type { Purse } from './coins';
import type { Recharge } from './upkeep';
import { CLASSES } from './spells';
import { detectContainer } from './containers';

type J = Record<string, unknown>;
const obj = (v: unknown): J => (v && typeof v === 'object' ? (v as J) : {});
const arr = (v: unknown): J[] => (Array.isArray(v) ? (v as J[]) : []);
const num = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);

const SIZE_BY_ID: Record<number, Size> = { 2: 'Tiny', 3: 'Small', 4: 'Medium', 5: 'Large', 6: 'Huge', 7: 'Gargantuan' };
const STAT_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const RESET: Record<number, Recharge> = { 1: 'short', 2: 'long', 3: 'dawn', 4: 'manual' };
const ACTIVATION_MIN: Record<number, number> = { 1: 0, 3: 0, 4: 0, 6: 1, 7: 60, 8: 0 };
const UNIT_MIN: Record<string, number> = { Round: 0.1, Minute: 1, Hour: 60, Day: 1440 };
const RARITY: Record<string, MagicItem['rarity']> = { Common: 'common', Uncommon: 'uncommon', Rare: 'rare', 'Very Rare': 'veryRare', Legendary: 'legendary' };

export interface DdbImport {
  ddbId: number;
  name: string;
  className: ClassName;
  level: number;
  size: Size;
  stats: Record<string, number>;
  strScore: number;
  conScore: number;
  conSave: number;
  wisMod: number;
  survival: number;
  passivePerception: number;
  darkvision: number;
  coldResist: 'none' | 'resistance' | 'immunity';
  fireResist: 'none' | 'resistance' | 'immunity';
  maxHp: number;
  hp: number;
  tempHp: number;
  hitDie: number;
  hitDiceSpent: number;
  inventory: InventoryItem[];
  items: MagicItem[];
  purse: Purse;
  spells: CharacterSpell[];
  resources: Resource[];
  exhaustion: number;
  deathSaves: { successes: number; failures: number; stable: boolean };
  feats: string[];
  warnings: string[];
}

const mod = (score: number) => Math.floor((score - 10) / 2);
const profBonus = (level: number) => Math.ceil(Math.max(1, level) / 4) + 1;

/** All modifiers from race, class, background, items and feats, flattened. */
function modifiers(d: J): J[] {
  const m = obj(d.modifiers);
  return Object.values(m).flatMap((v) => arr(v));
}

export function parseDdbCharacter(raw: unknown): DdbImport {
  const root = obj(raw);
  const d = root.data ? obj(root.data) : root;
  const warnings: string[] = [];
  if (!d.name && !d.stats) throw new Error('This doesn’t look like a D&D Beyond character. Paste the JSON from the character-service link.');
  const mods = modifiers(d);

  // Ability scores: base + bonus modifiers + bonus stats, unless overridden.
  const stats: Record<string, number> = {};
  STAT_KEYS.forEach((key, i) => {
    const id = i + 1;
    const base = num(arr(d.stats).find((x) => num(x.id) === id)?.value, 10);
    const bonus = num(arr(d.bonusStats).find((x) => num(x.id) === id)?.value, 0);
    const over = arr(d.overrideStats).find((x) => num(x.id) === id)?.value;
    const fromMods = mods.filter((m) => str(m.type) === 'bonus' && str(m.subType) === `${key}-score`).reduce((a, m) => a + num(m.value), 0);
    stats[key] = typeof over === 'number' ? over : base + bonus + fromMods;
  });

  const classes = arr(d.classes);
  const level = classes.reduce((a, c) => a + num(c.level), 0) || 1;
  const main = [...classes].sort((a, b) => num(b.level) - num(a.level) || (b.isStartingClass ? 1 : -1))[0] ?? {};
  const mainName = str(obj(main.definition).name, 'Other');
  const className = (CLASSES.includes(mainName as ClassName) ? mainName : 'Other') as ClassName;
  if (classes.length > 1) warnings.push(`Multiclass: tracked as a ${mainName} of level ${level} (${classes.map((c) => `${str(obj(c.definition).name)} ${num(c.level)}`).join(' / ')}).`);
  const hitDie = num(obj(main.definition).hitDice, 8);
  const hitDiceSpent = classes.reduce((a, c) => a + num(c.hitDiceUsed), 0);

  const has = (type: string, sub: string) => mods.some((m) => str(m.type) === type && str(m.subType) === sub);
  const pb = profBonus(level);
  const skill = (sub: string, ability: string) => mod(stats[ability]) + (has('expertise', sub) ? 2 * pb : has('proficiency', sub) ? pb : 0);
  const conSave = mod(stats.constitution) + (has('proficiency', 'constitution-saving-throws') ? pb : 0);
  const darkvision = Math.max(0, ...mods.filter((m) => str(m.subType) === 'darkvision').map((m) => num(m.value)));
  const resist = (dmg: string): DdbImport['coldResist'] => (has('immunity', dmg) ? 'immunity' : has('resistance', dmg) ? 'resistance' : 'none');

  const race = obj(d.race);
  const size = SIZE_BY_ID[num(race.sizeId, 4)] ?? 'Medium';

  const maxHp = typeof d.overrideHitPoints === 'number' ? (d.overrideHitPoints as number) : num(d.baseHitPoints) + num(d.bonusHitPoints) + mod(stats.constitution) * level;
  const hp = Math.max(0, maxHp - num(d.removedHitPoints));

  // Inventory: ordinary gear goes to the inventory; magic items also go to the magic item tracker.
  const inventory: InventoryItem[] = [];
  const items: MagicItem[] = [];
  const idMap = new Map<number, string>();
  const rawInv = arr(d.inventory);
  for (const it of rawInv) {
    const def = obj(it.definition);
    const name = str(def.name, 'Item');
    const id = `ddb-${num(it.id)}`;
    idMap.set(num(it.id), id);
    const qty = Math.max(1, num(it.quantity, 1));
    const bundle = Math.max(1, num(def.bundleSize, 1));
    const weight = num(def.weight) * num(def.weightMultiplier, 1) / bundle;
    const cost = typeof def.cost === 'number' ? (def.cost as number) : undefined;
    const isContainer = !!def.isContainer;
    inventory.push({
      id,
      name,
      qty,
      weight: Math.round(weight * 1000) / 1000,
      source: 'pasted',
      valueGp: cost,
      containerId: null,
      container: isContainer ? (detectContainer(name) ?? { capacityLb: num(def.capacityWeight) || null, weightless: !!def.weightMultiplier && num(def.weightMultiplier) === 0 }) : null,
      ammo: str(def.filterType) === 'Ammunition' || /arrow|bolt|bullet|needle/i.test(name) ? { spent: 0 } : null,
    });
    if (def.magic) {
      const lu = obj(it.limitedUse);
      const max = typeof lu.maxUses === 'number' ? (lu.maxUses as number) : null;
      items.push({
        id: `ddbm-${num(it.id)}`,
        name,
        requiresAttunement: !!def.canAttune,
        attuned: !!it.isAttuned,
        identified: true,
        charges: max != null ? Math.max(0, max - num(lu.numberUsed)) : null,
        maxCharges: max,
        regain: str(lu.resetTypeDescription).match(/\d*d\d+(?:\s*\+\s*\d+)?/)?.[0]?.replace(/\s/g, '') ?? 'all',
        regainAt: num(lu.resetType) === 3 ? 'dawn' : num(lu.resetType) === 1 ? 'shortRest' : num(lu.resetType) === 2 ? 'longRest' : max != null ? 'dawn' : 'never',
        awaySince: null,
        notes: 'From D&D Beyond',
        rarity: RARITY[str(def.rarity)] ?? '',
        magicKnown: true,
        clues: [],
        findings: [],
      });
    }
  }
  // Nest items in their containers (top-level items point at the character itself).
  for (const it of rawInv) {
    const parent = idMap.get(num(it.containerEntityId));
    const me = inventory.find((x) => x.id === idMap.get(num(it.id)));
    if (me && parent && parent !== me.id) me.containerId = parent;
  }

  const cur = obj(d.currencies);
  const purse: Purse = { cp: num(cur.cp), sp: num(cur.sp), ep: num(cur.ep), gp: num(cur.gp), pp: num(cur.pp) };

  // Spells from every class, plus innate ones from species, feats and items.
  const spells: CharacterSpell[] = [];
  const seen = new Set<string>();
  const addSpell = (sp: J, always: boolean) => {
    const def = obj(sp.definition);
    const name = str(def.name);
    if (!name || seen.has(name.toLowerCase())) return;
    seen.add(name.toLowerCase());
    const act = obj(def.activation);
    const dur = obj(def.duration);
    const durType = str(dur.durationType);
    const castMinutes = (ACTIVATION_MIN[num(act.activationType, 1)] ?? 0) * Math.max(1, num(act.activationTime, 1));
    spells.push({
      name,
      level: num(def.level),
      school: str(def.school) || undefined,
      ritual: !!def.ritual,
      concentration: !!def.concentration || durType === 'Concentration',
      castMinutes,
      castTime: num(act.activationType, 1) === 6 ? `${num(act.activationTime, 1)} minute${num(act.activationTime, 1) > 1 ? 's' : ''}` : num(act.activationType, 1) === 7 ? `${num(act.activationTime, 1)} hour${num(act.activationTime, 1) > 1 ? 's' : ''}` : num(act.activationType, 1) === 3 ? '1 bonus action' : num(act.activationType, 1) === 4 ? '1 reaction' : '1 action',
      durationMinutes: durType === 'Instantaneous' ? null : UNIT_MIN[str(dur.durationUnit)] ? Math.max(1, Math.round(UNIT_MIN[str(dur.durationUnit)] * num(dur.durationInterval, 1))) : null,
      permanent: durType === 'Until Dispelled' || undefined,
      prepared: !!sp.prepared || always || num(def.level) === 0,
      alwaysPrepared: !!sp.alwaysPrepared || always,
    });
  };
  for (const cs of arr(d.classSpells)) for (const sp of arr(cs.spells)) addSpell(sp, false);
  for (const group of Object.values(obj(d.spells))) for (const sp of arr(group)) addSpell(sp, true);

  // Spell slots, pact slots, and limited-use features.
  const resources: Resource[] = [];
  for (const sl of arr(d.spellSlots)) {
    const max = num(sl.available);
    if (max > 0) resources.push({ id: `ddb-slot-${num(sl.level)}`, name: `Spell slots (level ${num(sl.level)})`, max, current: Math.max(0, max - num(sl.used)), recharge: 'long' });
  }
  for (const sl of arr(d.pactMagic)) {
    const max = num(sl.available);
    if (max > 0) resources.push({ id: `ddb-pact-${num(sl.level)}`, name: `Pact slots (level ${num(sl.level)})`, max, current: Math.max(0, max - num(sl.used)), recharge: 'short' });
  }
  for (const group of Object.values(obj(d.actions))) {
    for (const a of arr(group)) {
      const lu = obj(a.limitedUse);
      const max = num(lu.maxUses);
      if (!max) continue;
      const name = str(a.name, 'Feature');
      const oneBack = /rage|channel divinity|wild shape|second wind/i.test(name);
      resources.push({ id: `ddb-act-${str(a.id) || name}`, name, max, current: Math.max(0, max - num(lu.numberUsed)), recharge: oneBack ? 'shortOne' : RESET[num(lu.resetType)] ?? 'long' });
    }
  }

  const exhaustion = Math.min(6, num(arr(d.conditions).find((c) => num(c.id) === 4)?.level));
  const ds = obj(d.deathSaves);
  const feats = arr(d.feats).map((f) => str(obj(f.definition).name)).filter(Boolean);

  return {
    ddbId: num(d.id),
    name: str(d.name, 'Imported character'),
    className,
    level,
    size,
    stats,
    strScore: stats.strength,
    conScore: stats.constitution,
    conSave,
    wisMod: mod(stats.wisdom),
    survival: skill('survival', 'wisdom'),
    passivePerception: 10 + skill('perception', 'wisdom'),
    darkvision,
    coldResist: resist('cold'),
    fireResist: resist('fire'),
    maxHp,
    hp,
    tempHp: num(d.temporaryHitPoints),
    hitDie,
    hitDiceSpent,
    inventory,
    items,
    purse,
    spells,
    resources,
    exhaustion,
    deathSaves: { successes: num(ds.successCount), failures: num(ds.failCount), stable: !!ds.isStabilized },
    feats,
    warnings,
  };
}

/** The link to open in a browser to get a public character's JSON. */
export function ddbJsonUrl(input: string): string | null {
  const id = input.match(/(\d{5,})/)?.[1];
  return id ? `https://character-service.dndbeyond.com/character/v5/character/${id}` : null;
}

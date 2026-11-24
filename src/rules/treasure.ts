import { coinsFor, emptyPurse, type Purse } from './coins';
import { RARITY_LABEL, SCROLL_CRAFTING, type Rarity } from './crafting';
import { die, rollDice, type Rng } from './dice';
import { priceOf } from './shop';
import { MAGIC_DETAILS, MAGIC_TABLES, VALUABLE_TABLES } from './treasureData';

export const TREASURE_THEMES = ['Arcana', 'Armaments', 'Implements', 'Relics'] as const;
export type TreasureTheme = (typeof TREASURE_THEMES)[number];
export type TreasureKind = 'gem' | 'art' | 'bar' | 'magic';

export interface TreasureItem {
  name: string;
  kind: TreasureKind;
  valueGp: number;
  qty: number;
  weight?: number;
  rarity?: Rarity;
  attunement?: string | boolean;
  consumable?: boolean;
}

export interface TreasureRoll {
  coins: Purse;
  items: TreasureItem[];
}

export type TreasureRequest =
  | { kind: 'individual'; cr: number }
  | { kind: 'hoard'; cr: number; theme: TreasureTheme; rarity: Rarity; monetary: 'coins' | 'gem' | 'art' | 'bar'; unitValue: number }
  | { kind: 'gem' | 'art' | 'bar'; value: number }
  | { kind: 'magic'; theme: TreasureTheme; rarity: Rarity };

export const TRADE_BARS = [
  { name: '2-pound silver bar', valueGp: 10, weight: 2 },
  { name: '5-pound silver bar', valueGp: 25, weight: 5 },
  { name: '5-pound gold bar', valueGp: 250, weight: 5 },
];

const MAGIC_VALUE: Record<Rarity, number> = { common: 100, uncommon: 400, rare: 4000, veryRare: 40000, legendary: 200000 };

function valuable(kind: 'gem' | 'art' | 'bar', valueGp: number, rng: Rng): TreasureItem | undefined {
  if (kind === 'bar') {
    const bar = TRADE_BARS.find((b) => b.valueGp === valueGp);
    return bar && { ...bar, kind, qty: 1 };
  }
  const table = VALUABLE_TABLES[`${valueGp.toLocaleString('en-US')} GP ${kind === 'gem' ? 'Gemstones' : 'Art Objects'}`];
  return table && { name: table[die(table.length, rng) - 1], kind, valueGp, qty: 1 };
}

function magicItem(theme: TreasureTheme, rarity: Rarity, rng: Rng): TreasureItem {
  const roll = die(100, rng);
  const [, ...names] = MAGIC_TABLES[`${theme} - ${RARITY_LABEL[rarity]}`].find(([end]) => roll <= end)!;
  const name = names.length === 1 ? names[0] : names[die(names.length, rng) - 1];
  const details = MAGIC_DETAILS[name];
  const itemRarity = details?.rarity ?? rarity;
  const baseCost = details?.baseItem ? (priceOf(details.baseItem) ?? 0) : 0;
  const scroll = /^Spell Scroll \((?:Level (\d)|Cantrip)\)$/i.exec(name);
  const valueGp = scroll
    ? SCROLL_CRAFTING[Number(scroll[1] ?? 0)].gp * 2
    : details?.valueGp ?? MAGIC_VALUE[itemRarity] / (details?.consumable ? 2 : 1) + baseCost;
  return { name, rarity: itemRarity, weight: details?.weight, attunement: details?.attunement, consumable: details?.consumable, kind: 'magic', valueGp, qty: 1 };
}

function crBand(cr: number): number {
  return cr < 5 ? 0 : cr < 11 ? 1 : cr < 17 ? 2 : 3;
}

const INDIVIDUAL = [
  { count: 3, sides: 6, multiplier: 1, denom: 'gp' },
  { count: 2, sides: 8, multiplier: 10, denom: 'gp' },
  { count: 2, sides: 10, multiplier: 10, denom: 'pp' },
  { count: 2, sides: 8, multiplier: 100, denom: 'pp' },
] as const;

const HOARD = [
  { count: 2, sides: 4, multiplier: 100, magicDie: 4, magicAdjust: -1 },
  { count: 8, sides: 10, multiplier: 100, magicDie: 3, magicAdjust: 0 },
  { count: 8, sides: 8, multiplier: 1000, magicDie: 4, magicAdjust: 0 },
  { count: 6, sides: 10, multiplier: 10000, magicDie: 6, magicAdjust: 0 },
] as const;

export function rollTreasure(request: TreasureRequest, rng: Rng): TreasureRoll {
  const result: TreasureRoll = { coins: emptyPurse(), items: [] };
  if (request.kind === 'individual') {
    const { count, sides, multiplier, denom } = INDIVIDUAL[crBand(request.cr)];
    result.coins[denom] = rollDice(count, sides, rng) * multiplier;
  } else if (request.kind === 'hoard') {
    const { count, sides, multiplier, magicDie, magicAdjust } = HOARD[crBand(request.cr)];
    const gold = rollDice(count, sides, rng) * multiplier;
    const magicCount = die(magicDie, rng) + magicAdjust;
    const unit = request.monetary !== 'coins' && request.unitValue <= gold ? valuable(request.monetary, request.unitValue, rng) : undefined;
    if (unit) {
      unit.qty = Math.floor(gold / unit.valueGp);
      result.items.push(unit);
    }
    result.coins = coinsFor(gold - (unit ? unit.qty * unit.valueGp : 0));
    for (let i = 0; i < magicCount; i++) result.items.push(magicItem(request.theme, request.rarity, rng));
  } else if (request.kind === 'magic') {
    result.items.push(magicItem(request.theme, request.rarity, rng));
  } else {
    const item = valuable(request.kind, request.value, rng);
    if (item) result.items.push(item);
  }
  return result;
}

/** The Bastion event determines the art value or magic rarity. Choose a theme at random. */
export function rollBastionTreasure(rng: Rng): TreasureItem {
  const roll = die(100, rng);
  if (roll <= 75) {
    const value = roll <= 40 ? 25 : roll <= 63 ? 250 : roll <= 73 ? 750 : 2500;
    return valuable('art', value, rng)!;
  }
  const rarity = roll <= 90 ? 'common' : roll <= 98 ? 'uncommon' : 'rare';
  return magicItem(TREASURE_THEMES[die(TREASURE_THEMES.length, rng) - 1], rarity, rng);
}

import type { Size } from '../state/types';
import { ITEM_WEIGHTS } from './itemWeights';

export type WeightSource = 'pasted' | 'book' | 'guess' | 'manual';

export interface ParsedItem {
  name: string;
  qty: number;
  /** Weight of one item in pounds. */
  weight: number;
  source: WeightSource;
}

/** Carrying capacity multiplier by size: Strength × 15 lb for Small or Medium (PHB). */
export const CARRY_MULT: Record<Size, number> = { Tiny: 7.5, Small: 15, Medium: 15, Large: 30, Huge: 60, Gargantuan: 120 };
export const carryingCapacity = (str: number, size: Size): number => Math.round(str * CARRY_MULT[size]);

/** Mount carrying capacities (PHB). */
export const MOUNT_CAPACITY: Record<string, number> = {
  Camel: 450,
  Elephant: 1320,
  'Draft Horse': 540,
  'Riding Horse': 480,
  Mastiff: 195,
  Mule: 420,
  Pony: 225,
  Warhorse: 540,
};

/** A day's Rations weighs 2 lb (PHB), though a Medium creature needs only 1 lb of food a day. */
export const RATION_WEIGHT = 2;
/** Fifty coins weigh a pound. */
export const COINS_PER_LB = 50;

/** Keyword guesses for things the equipment table doesn't list, most specific first. */
const GUESSES: [RegExp, number][] = [
  [/\bfull plate|\bplate (armor|mail)\b/, 65],
  [/\bhalf plate\b/, 40],
  [/\bsplint\b/, 60],
  [/\bchain mail\b/, 55],
  [/\bscale mail\b/, 45],
  [/\bring mail\b/, 40],
  [/\bchain shirt\b|\bbreastplate\b/, 20],
  [/\bstudded\b/, 13],
  [/\bhide armor\b/, 12],
  [/\bleather armor\b/, 10],
  [/\bpadded\b/, 8],
  [/\bshield\b/, 6],
  [/\bgreatsword|greataxe|\bmaul\b|halberd|glaive|pike\b/, 6],
  [/\bheavy crossbow\b/, 18],
  [/\bcrossbow\b/, 5],
  [/\blongbow|shortbow|\bbow\b/, 2],
  [/\bwarhammer|battleaxe|\baxe\b|morningstar|flail/, 4],
  [/\bsword|scimitar|rapier|blade\b/, 3],
  [/\bspear|trident|javelin/, 3],
  [/\bdagger|knife|dart\b/, 1],
  [/\bstaff\b|\bquarterstaff\b/, 4],
  [/\borb\b/, 3],
  [/\brod\b|\bsceptre|\bscepter/, 2],
  [/\bwand\b/, 1],
  [/\bring\b|\bgem|\bjewel|\bpearl|\bdiamond|\bruby|\bemerald|\bsapphire|\bcoin\b|\bearring|\bbrooch|\bfigurine|\bfeather|\bdust\b/, 0],
  [/\bscroll|\bletter|\bmap\b|\bnote\b|\bdeed\b|\bcard\b/, 0],
  [/\bpotion|\bvial|\belixir|\bphilter|\boil of|\btincture|\bflask\b/, 0.5],
  [/\bamulet|necklace|pendant|periapt|medallion|talisman|holy symbol/, 1],
  [/\bcloak|cape|mantle\b/, 1],
  [/\brobe/, 4],
  [/\bboots|slippers|shoes/, 1],
  [/\bgloves|gauntlets|bracers|belt|girdle|circlet|crown|hat|cap\b|headband|goggles|lenses|eyes of/, 1],
  [/\bhelm\b|\bhelmet/, 3],
  [/\bbag of holding|handy haversack|portable hole/, 5],
  [/\bbag\b|\bsack\b|\bpouch\b|purse/, 0.5],
  [/\bbook|tome|manual|journal|codex|grimoire|spellbook/, 3],
  [/\binstrument|lute|flute|drum|horn\b|lyre|harp|fiddle|viol/, 3],
  [/\btools?\b|\bkit\b|supplies|utensils/, 5],
  [/\bcandle|chalk|ink|quill|pen\b|paper|parchment|string|twine|thread|soap|whistle|key\b|dice|deck/, 0],
  [/\btorch/, 1],
  [/\blantern|lamp/, 2],
  [/\brope|chain\b/, 5],
  [/\bchest|trunk|crate/, 25],
  [/\btent\b/, 20],
  [/\bbedroll|sleeping roll/, 7],
  [/\bblanket/, 3],
  [/\bfood|ration|jerky|bread|cheese|apple|meat/, 1],
  [/\bstatue|idol|anvil|barrel/, 10],
];

const SINGULAR = (s: string) => s.replace(/(ies)$/, 'y').replace(/(ches|shes|sses|xes)$/, (m) => m.slice(0, -2)).replace(/([^s])s$/, '$1');

/** Weight of one item by name: the PHB table first, then keyword guesses, then 1 lb. */
export function estimateWeight(rawName: string): { weight: number; source: WeightSource } {
  const name = rawName.toLowerCase().replace(/\s+/g, ' ').trim();
  const plain = name.replace(/^\+\d\s+/, '').replace(/,\s*\+\d$/, '').trim();
  const tries = [name, plain, SINGULAR(plain), plain.replace(/\s*\(.*\)$/, ''), SINGULAR(plain.replace(/\s*\(.*\)$/, ''))];
  // "Cloak of Protection" → "cloak", "Rope, hempen" → "rope"
  const base = plain.split(/ of | \(|,/)[0].trim();
  tries.push(base, SINGULAR(base));
  for (const t of tries) if (t in ITEM_WEIGHTS) return { weight: ITEM_WEIGHTS[t], source: 'book' };
  for (const [re, w] of GUESSES) if (re.test(name)) return { weight: w, source: 'guess' };
  return { weight: 1, source: 'guess' };
}

/**
 * Reads one inventory line as players might paste it (from D&D Beyond or typed by hand):
 * "2 Torches", "Torch x3", "Torch (3)", "3× Torch", "Longsword 3 lb", "Rope, hempen (50 feet)".
 */
export function parseInventoryLine(line: string): ParsedItem | null {
  let text = line.replace(/\t+/g, ' ').replace(/•|·/g, ' ').trim();
  if (!text) return null;
  let qty = 1;
  let weight: number | null = null;
  const lb = text.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs|pounds?)\.?/i);
  if (lb) {
    weight = Number(lb[1]);
    text = text.replace(lb[0], ' ');
  }
  text = text.replace(/\b\d[\d,]*(?:\.\d+)?\s*(?:gp|sp|cp|pp|ep)\b/gi, ' '); // drop prices
  text = text.replace(/\s+/g, ' ').trim();
  const lead = text.match(/^(\d+)\s*[x×]?\s+(.+)$/i);
  // "x3", "(3)", or a bare count left over from a D&D Beyond row (name, weight, quantity, cost).
  const trail = text.match(/^(.+?)\s*(?:[x×]\s*(\d+)|\((\d+)\)|\s(\d+))\s*$/i);
  if (lead) {
    qty = Number(lead[1]);
    text = lead[2];
  } else if (trail) {
    qty = Number(trail[2] ?? trail[3] ?? trail[4]);
    text = trail[1];
  }
  const name = text.replace(/\s+/g, ' ').replace(/[,;:\-–]\s*$/, '').trim();
  if (!name || /^(name|item|weight|qty|quantity|cost|equipment|inventory)$/i.test(name)) return null;
  if (weight != null) return { name, qty: Math.max(1, qty), weight: qty > 1 && /total/i.test(line) ? weight / qty : weight, source: 'pasted' };
  const est = estimateWeight(name);
  return { name, qty: Math.max(1, qty), weight: est.weight, source: est.source };
}

export const parseInventory = (text: string): ParsedItem[] => text.split(/\r?\n/).map(parseInventoryLine).filter((x): x is ParsedItem => !!x);

export type LoadLevel = 'light' | 'encumbered' | 'heavy' | 'over';

/**
 * 2024 rules: you can carry up to your capacity; beyond it you can only drag, at a Speed of 5 ft at most.
 * Optional older variant: over 5 × Strength is Encumbered (−10 ft), over 10 × Strength is Heavily Encumbered (−20 ft, Disadvantage).
 */
export function loadLevel(load: number, capacity: number, str: number, variant: boolean): LoadLevel {
  if (load > capacity) return 'over';
  if (variant && str > 0) {
    if (load > str * 10) return 'heavy';
    if (load > str * 5) return 'encumbered';
  }
  return 'light';
}

export const LOAD_LABEL: Record<LoadLevel, string> = {
  light: 'Unencumbered',
  encumbered: 'Encumbered (Speed −10 ft)',
  heavy: 'Heavily Encumbered (Speed −20 ft, Disadvantage on Str/Dex/Con checks, attacks and saves)',
  over: 'Over capacity (can only drag it, Speed 5 ft)',
};

/** A day of animal feed weighs 10 lb (PHB). */
export const FEED_LB_PER_DAY = 10;

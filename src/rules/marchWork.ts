import type { Project } from '../state/types';
import { COBB, GEAR_CATALOG, LEATH, WEAV, WOOD, type GearItem } from './crafting';
import { ITEM_WEIGHTS } from './itemWeights';
import { toolNamed } from './gear';
import { activityOf } from './downtimeOutcomes';

/**
 * Table rule: which downtime work can go on while walking, held in the hands.
 *
 * Hand work that needs no bench, fire, water or flat surface: whittling (Woodcarver's Tools), knitting, braiding and
 * small weaving (Weaver's Tools), and stitching leather or shoes (Leatherworker's and Cobbler's Tools), on items light
 * enough to hold while walking. Practising a language with someone walking alongside, or a musical instrument, works
 * too. Anything needing a forge, kiln, still, fire, ink on a flat page, a library, a workshop or a town does not.
 */
export const HAND_TOOLS = [WOOD, WEAV, LEATH, COBB];

/** Heaviest finished item someone can keep working on in their hands while walking, in pounds. */
export const HAND_ITEM_MAX_LB = 5;

export interface MarchWork {
  ok: boolean;
  /** Why it can or can't be worked on the march, in a few words. */
  why: string;
}

/** The catalog item a crafting project makes, if it can be told from the project. */
export function gearFor(p: Pick<Project, 'name' | 'product'>): GearItem | undefined {
  const names = [p.product?.name, p.name].filter(Boolean).map((n) => n!.toLowerCase().trim());
  return GEAR_CATALOG.find((g) => names.includes(g.name.toLowerCase())) ?? GEAR_CATALOG.find((g) => names.some((n) => n.includes(g.name.toLowerCase())));
}

const weightOf = (g: GearItem): number | null => {
  const k = g.name.toLowerCase();
  return k in ITEM_WEIGHTS ? ITEM_WEIGHTS[k] : (ITEM_WEIGHTS[k.replace(/\s*\(\d+\)$/, '')] ?? null);
};

const toolOk = (tool: string): MarchWork => {
  const t = toolNamed(tool);
  if (t?.category === 'instrument') return { ok: true, why: `${t.name} can be practised while walking` };
  if (t && HAND_TOOLS.includes(t.name)) return { ok: true, why: `${t.name} are hand work` };
  return { ok: false, why: `${t?.name ?? tool} need a bench or workshop` };
};

export function marchWork(p: Pick<Project, 'kind' | 'name' | 'product' | 'learn' | 'learnKind'>): MarchWork {
  switch (p.kind) {
    case 'nonmagical': {
      const g = gearFor(p);
      if (!g) return { ok: false, why: 'the item and its tool aren’t known' };
      const tool = g.tools.find((t) => HAND_TOOLS.includes(t));
      if (!tool) return { ok: false, why: `${g.tools.join(' or ')} need a bench, fire or workshop` };
      const lb = weightOf(g);
      if (lb != null && lb > HAND_ITEM_MAX_LB) return { ok: false, why: `${g.name} is too big to work while walking (${lb} lb)` };
      return { ok: true, why: `${g.name} is hand work with ${tool}` };
    }
    case 'scroll':
    case 'spellcopy':
      return { ok: false, why: 'ink needs a steady, flat page' };
    case 'potion':
      return { ok: false, why: 'brewing needs a fire and a still' };
    case 'magic':
      return { ok: false, why: 'magic item crafting needs a workshop' };
    case 'buyMagic':
    case 'sellMagic':
      return { ok: false, why: 'deals are struck in town' };
    case 'activity': {
      const learn = (p.learn ?? '').trim();
      if (p.learnKind === 'language') return { ok: true, why: 'a language can be practised with a teacher walking alongside' };
      if (p.learnKind === 'tool') return learn ? toolOk(learn) : { ok: false, why: 'the tool isn’t named' };
      if (p.learnKind === 'skill') return { ok: false, why: 'skill training needs a proper place to train' };
      if (activityOf(p.name) === 'Training' && learn) {
        if (toolNamed(learn)) return toolOk(learn);
        return { ok: true, why: `${learn} can be practised with a teacher walking alongside` };
      }
      return { ok: false, why: 'this activity happens in a settlement' };
    }
  }
}

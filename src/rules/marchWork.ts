import type { Project } from '../state/types';
import { CALL, COBB, GEAR_CATALOG, LEATH, WEAV, WOOD, type GearItem } from './crafting';
import { ITEM_WEIGHTS } from './itemWeights';
import { toolNamed } from './gear';
import { activityOf } from './downtimeOutcomes';

/**
 * Table rule: which downtime work can go on while walking, held in the hands.
 *
 * Hand work that needs no bench, fire, water or flat surface: whittling (Woodcarver's Tools), knitting, braiding and
 * small weaving (Weaver's Tools), and stitching leather or shoes (Leatherworker's and Cobbler's Tools), on items light
 * enough to hold while walking, at a normal or slow pace (not a fast one). Practising a language with someone walking alongside, or a musical instrument, works
 * too. Writing (scribing a scroll, copying a spell, calligraphy) goes on only at a slow pace, if the writer keeps their concentration: no
 * Concentration spell held at the same time, and a Constitution save each leg, as for Concentration, or the leg's
 * lines come out spoiled. Anything needing a forge, kiln, still, fire, a library, a workshop or a town does not.
 */
export const HAND_TOOLS = [WOOD, WEAV, LEATH, COBB];

/** Heaviest finished item someone can keep working on in their hands while walking, in pounds. */
export const HAND_ITEM_MAX_LB = 5;

/** The Constitution save a writer makes each leg of the march to keep their concentration (as for Concentration). */
export const MARCH_WRITING_DC = 10;

export interface MarchWork {
  ok: boolean;
  /** Writing: the worker must keep their concentration (no Concentration spell, and a save each leg). */
  concentration?: boolean;
  /** Talk, not hand work (language practice): it goes on even at a fast pace. */
  talk?: boolean;
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
  if (t?.name === CALL) return { ok: true, concentration: true, why: 'calligraphy can be practised at a slow walk, keeping concentration' };
  if (t?.category === 'instrument') return { ok: true, why: `${t.name} can be practised while walking` };
  if (t && HAND_TOOLS.includes(t.name)) return { ok: true, why: `${t.name} are hand work` };
  return { ok: false, why: `${t?.name ?? tool} need a bench or workshop` };
};

export function marchWork(p: Pick<Project, 'kind' | 'name' | 'product' | 'learn' | 'learnKind' | 'physicalTraining'>): MarchWork {
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
      return { ok: true, concentration: true, why: 'scribing can go on at a slow walk, keeping concentration' };
    case 'spellcopy':
      return { ok: true, concentration: true, why: 'copying a spell can go on at a slow walk, keeping concentration' };
    case 'potion':
      return { ok: false, why: 'brewing needs a fire and a still' };
    case 'magic':
      return { ok: false, why: 'magic item crafting needs a workshop' };
    case 'buyMagic':
    case 'sellMagic':
      return { ok: false, why: 'deals are struck in town' };
    case 'activity': {
      if (p.physicalTraining) return { ok: false, why: 'physical training needs dedicated practice time' };
      const learn = (p.learn ?? '').trim();
      if (p.learnKind === 'language') return { ok: true, talk: true, why: 'a language can be practised with a teacher walking alongside' };
      if (p.learnKind === 'tool') return learn ? toolOk(learn) : { ok: false, why: 'the tool isn’t named' };
      if (p.learnKind === 'skill') return { ok: false, why: 'skill training needs a proper place to train' };
      if (activityOf(p.name) === 'Training' && learn) {
        if (toolNamed(learn)) return toolOk(learn);
        return { ok: true, talk: true, why: `${learn} can be practised with a teacher walking alongside` };
      }
      return { ok: false, why: 'this activity happens in a settlement' };
    }
  }
}

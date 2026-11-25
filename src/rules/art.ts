import type { Character } from '../state/types';
import { CALL, PAINT } from './crafting';
import { TOOLS } from './gear';

export const ART = {
  song: { label: 'Song', hours: 1, gp: 1, tool: CALL, buyers: ['inn', 'tavern', 'market'] },
  poem: { label: 'Poem', hours: 1, gp: 1, tool: CALL, buyers: ['inn', 'tavern', 'market'] },
  sketch: { label: 'Sketch', hours: 1, gp: 1, tool: PAINT, buyers: ['market', 'jeweler'] },
  painting: { label: 'Painting', hours: 4, gp: 5, tool: PAINT, buyers: ['market', 'jeweler'] },
  book: { label: 'Short book', hours: 12, gp: 15, tool: CALL, buyers: ['market', 'library'] },
} as const;

export type ArtKind = keyof typeof ART;
export const ART_INSTRUMENTS = TOOLS.filter((t) => t.category === 'instrument');

export interface ArtProject {
  id: string;
  artistId: string;
  kind: ArtKind;
  title: string;
  subject: string;
  tool: string;
  gp: number | null;
  hours: number;
  requiredHours: number;
  itemId?: string;
  shared?: boolean;
}

export function hasMusician(c: Character): boolean {
  return c.feats.some((feat) => /^musician\b/i.test(feat.trim()));
}

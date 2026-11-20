import { describe, expect, it } from 'vitest';
import { playerSummary } from './ItemKnowledge';
import type { MagicItem } from '../state/types';

const base: MagicItem = {
  id: 'r', name: 'Ring of Protection', partyName: 'silver ring', rarity: 'rare', school: 'Abjuration', requiresAttunement: true, attuned: false, identified: false,
  charges: null, maxCharges: null, regain: 'all', regainAt: 'never', awaySince: null, notes: '',
  clues: [{ id: 'a', kind: 'property', text: '+1 to AC', known: true }, { id: 'c', kind: 'curse', text: 'whispers at night', known: false }],
};

describe('item knowledge for players', () => {
  it('shows only what has been learned', () => {
    const p = playerSummary(base);
    expect(p.title).toBe('silver ring');
    expect(p.lines.join(' ')).toContain('+1 to AC');
    expect(JSON.stringify(p)).not.toContain('Ring of Protection');
    expect(JSON.stringify(p)).not.toContain('whispers');
    expect(JSON.stringify(p)).not.toContain('Abjuration');
    expect(p.moreToLearn).toBe(true);
  });
  it('adds the aura once Detect Magic has been cast, and the name once identified', () => {
    expect(playerSummary({ ...base, magicKnown: true }).lines[0]).toContain('aura of Abjuration');
    const done = playerSummary({ ...base, identified: true, clues: base.clues!.map((c) => ({ ...c, known: true })) });
    expect(done.title).toBe('Ring of Protection');
    expect(done.moreToLearn).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { createDefaultState, newCharacter } from '../state/defaults';
import { playerItems } from './playerChecklist';

describe('player checklists', () => {
  it('lists conditions with fixes and upkeep, marking secrets as DM-only', () => {
    const s = createDefaultState(() => 0);
    const c = newCharacter({ name: 'A', exhaustion: 2, exhaustionCauses: ['malnutrition', 'malnutrition'], malnourished: true, hp: 5, maxHp: 20, rationsLb: 0, armorKind: 'medium', armorWorn: false });
    c.contagions = [{ id: 'x', kind: 'sewer', infectedAt: 0, onsetAt: 99999, onset: false, successes: 0 }];
    s.characters = [c];
    const items = playerItems(s, c);
    const exh = items.find((i) => i.text.startsWith('Exhaustion ×2'))!;
    expect(exh.kind).toBe('status');
    expect(exh.fix).toMatch(/full day’s food/);
    expect(items.some((i) => i.kind === 'upkeep' && /Food for 0 day/.test(i.text))).toBe(true);
    expect(items.some((i) => i.kind === 'upkeep' && /isn’t on/.test(i.text))).toBe(true);
    expect(items.find((i) => i.text.startsWith('Carrying Sewer Plague'))?.dmOnly).toBe(true);
  });
});

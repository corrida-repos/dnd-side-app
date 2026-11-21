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
    expect(items.find((i) => i.text.startsWith('Carrying Sewer Plague'))?.dmOnly).toBe(true);
  });

  it('warns about inventory with consequences and drops chores that have none', () => {
    const s = createDefaultState(() => 0);
    const c = newCharacter({ name: 'B', className: 'Cleric', level: 5, armorKind: 'heavy', armorWorn: false });
    c.spells = [{ name: 'Revivify', level: 3, prepared: true, alwaysPrepared: false }];
    c.inventory = [
      { id: 'pack', name: 'Backpack', qty: 1, weight: 5, source: 'book', container: { capacityLb: 30, weightless: false }, ammo: null },
      { id: 'rope', name: 'Rope', qty: 1, weight: 40, source: 'manual', containerId: 'pack', container: null, ammo: null },
      { id: 'boh', name: 'Bag of Holding', qty: 1, weight: 15, source: 'book', container: { capacityLb: 500, weightless: true }, ammo: null },
      { id: 'ph', name: 'Portable Hole', qty: 1, weight: 0, source: 'book', containerId: 'boh', container: { capacityLb: null, weightless: true }, ammo: null },
      { id: 'arr', name: 'Arrows', qty: 6, weight: 0.05, source: 'book', container: null, ammo: { spent: 3 } },
    ];
    c.tasks = [{ id: 't', label: 'Sharpen sword', done: false, daily: true }];
    s.characters = [c];
    const t = playerItems(s, c).map((i) => i.text);
    expect(t.some((x) => /Backpack is overfilled/.test(x))).toBe(true);
    expect(t.some((x) => /Portable Hole is packed inside Bag of Holding/.test(x))).toBe(true);
    expect(t.some((x) => /Only 3 Arrows left/.test(x))).toBe(true);
    expect(t.some((x) => /Can’t cast Revivify/.test(x))).toBe(true);
    expect(t.some((x) => /Sharpen|isn’t on/.test(x))).toBe(false);
  });
});

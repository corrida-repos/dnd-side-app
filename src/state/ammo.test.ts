import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function fresh(): State {
  const s = createDefaultState(() => 0);
  s.characters = [newCharacter({ name: 'Archer' }), newCharacter({ name: 'Smith', gp: 500 })];
  s.log = [];
  return E.addInventory(s, ctx(), s.characters[0].id, 'Arrows (20)\nLongbow\nCrossbow Bolt Case');
}

describe('ammunition', () => {
  it('recognises ammunition and counts arrows one by one', () => {
    const s = fresh();
    const arrows = s.characters[0].inventory.find((i) => i.name === 'Arrows')!;
    expect(arrows).toMatchObject({ qty: 20, ammo: { spent: 0 } });
    expect(s.characters[0].inventory.find((i) => i.name === 'Crossbow Bolt Case')!.ammo).toBeNull();
  });

  it('fires, then recovers half the spent ammunition after a minute of searching', () => {
    let s = fresh();
    const id = s.characters[0].id;
    const arrows = () => s.characters[0].inventory.find((i) => i.name === 'Arrows')!;
    s = E.fireAmmo(s, ctx(), id, arrows().id, 7);
    expect(arrows()).toMatchObject({ qty: 13, ammo: { spent: 7 } });
    const before = s.minutes;
    s = E.recoverAmmo(s, ctx(), [id], false);
    expect(arrows()).toMatchObject({ qty: 16, ammo: { spent: 0 } });
    expect(s.minutes).toBe(before + 1);
  });

  it('a good search finds three quarters, or nine in ten (table rule)', () => {
    let s = fresh();
    const id = s.characters[0].id;
    const arrows = () => s.characters[0].inventory.find((i) => i.name === 'Arrows')!;
    s = E.fireAmmo(s, ctx(), id, arrows().id, 12);
    const searched = E.recoverAmmo(s, ctx(0.99), [id]);
    expect(searched.characters[0].inventory.find((i) => i.name === 'Arrows')!.qty).toBe(8 + 10);
    const sloppy = E.recoverAmmo(s, ctx(0.01), [id]);
    expect(sloppy.characters[0].inventory.find((i) => i.name === 'Arrows')!.qty).toBe(8 + 6);
  });
});

describe('crafted goods', () => {
  it('puts the finished product in the crafter’s inventory', () => {
    let s = fresh();
    s.minutes = 8 * 60;
    const smith = s.characters[1].id;
    s = E.startProject(s, ctx(), { id: 'p', name: 'Longsword', kind: 'nonmagical', charIds: [smith], daysRequired: 1, daysDone: 0, costGp: 7, notes: '', done: false, product: { name: 'Longsword', qty: 1, valueGp: 15 } });
    s = E.workOnProjects(s, ctx(), ['p']);
    expect(s.characters[1].inventory).toMatchObject([{ name: 'Longsword', qty: 1, weight: 3, valueGp: 15 }]);
    s = E.startProject(s, ctx(), { id: 'q', name: 'Wand', kind: 'magic', charIds: [smith], daysRequired: 1, daysDone: 0, costGp: 0, notes: '', done: false, product: { name: 'Wand of Web', qty: 1, magic: true } });
    s = E.workOnProjects(s, ctx(), ['q']);
    expect(s.characters[1].items[0]).toMatchObject({ name: 'Wand of Web', identified: true });
  });
});

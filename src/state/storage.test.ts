import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { coinsFor, exchange, purseValue, spend } from '../rules/coins';
import { detectContainer } from '../rules/containers';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.characters = [newCharacter({ name: 'A', gp: 0, purse: { pp: 1, gp: 2, ep: 0, sp: 5, cp: 30 } })];
  s.characters[0].gp = purseValue(s.characters[0].purse);
  s.log = [];
  patch(s);
  return s;
}

describe('coins', () => {
  it('values a purse and pays with change', () => {
    expect(purseValue({ pp: 1, gp: 2, ep: 0, sp: 5, cp: 30 })).toBe(12.8);
    expect(spend({ pp: 1, gp: 0, ep: 0, sp: 0, cp: 0 }, 1)).toEqual({ purse: { pp: 0, gp: 9, ep: 0, sp: 0, cp: 0 }, short: 0 });
    expect(spend({ pp: 0, gp: 1, ep: 0, sp: 0, cp: 50 }, 0.3).purse).toEqual({ pp: 0, gp: 1, ep: 0, sp: 0, cp: 20 });
    expect(spend(coinsFor(1), 5).short).toBe(4);
  });

  it('exchanges coins, taking any moneychanger fee', () => {
    const r = exchange({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 200 }, 'cp', 'gp', 200, 0)!;
    expect(r.purse.gp).toBe(2);
    expect(r.purse.cp).toBe(0);
    const fee = exchange({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 200 }, 'cp', 'gp', 200, 10)!;
    expect(fee.received).toBe(1);
    expect(purseValue(fee.purse)).toBe(1.8);
  });

  it('keeps wealth and coins in step when paying, with debt when short', () => {
    const s = fresh();
    const c = s.characters[0];
    const paid = E.adjustGold(s, ctx(), c.id, -3, 'boots');
    expect(paid.characters[0].gp).toBe(9.8);
    expect(purseValue(paid.characters[0].purse)).toBe(9.8);
    const broke = E.adjustGold(s, ctx(), c.id, -20, 'a horse');
    expect(broke.characters[0].gp).toBe(-7.2);
    expect(purseValue(broke.characters[0].purse)).toBe(0);
    const repaid = E.adjustGold(broke, ctx(), c.id, 10, 'reward');
    expect(repaid.characters[0].gp).toBe(2.8);
    expect(purseValue(repaid.characters[0].purse)).toBe(2.8);
  });

  it('weighs coins by count, 50 to the pound', () => {
    const s = fresh((d) => (d.characters[0].purse = { pp: 0, gp: 100, ep: 0, sp: 0, cp: 0 }));
    expect(E.carriedLoad(s, s.characters[0]).coins).toBe(2);
  });
});

describe('containers, stashes and vehicles', () => {
  it('recognises containers and leaves out what is inside a Bag of Holding', () => {
    expect(detectContainer('Backpack')).toMatchObject({ capacityLb: 30, weightless: false });
    expect(detectContainer('Bag of Holding')).toMatchObject({ weightless: true });
    let s = fresh((d) => (d.characters[0].purse = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 }));
    const id = s.characters[0].id;
    s = E.addInventory(s, ctx(), id, 'Bag of Holding\nPlate Armor');
    const inv = s.characters[0].inventory;
    const bag = inv.find((i) => i.name === 'Bag of Holding')!;
    expect(E.carriedLoad(s, s.characters[0]).gear).toBe(70); // 5 lb bag + 65 lb armor
    inv.find((i) => i.name === 'Plate Armor')!.containerId = bag.id;
    expect(E.carriedLoad(s, s.characters[0]).gear).toBe(5);
    expect(E.containerLoad(s.characters[0].inventory, bag.id)).toBe(65);
  });

  it('moves items (with their contents) and coins in and out of storage', () => {
    let s = fresh();
    const id = s.characters[0].id;
    s = E.addInventory(s, ctx(), id, 'Backpack\n2 Torches\nRuby 500 GP');
    const pack = s.characters[0].inventory.find((i) => i.name === 'Backpack')!;
    s.characters[0].inventory.find((i) => i.name === 'Torches')!.containerId = pack.id;
    s = E.createStash(s, ctx(), 'Wagon', 'vehicle', 'the road', 3000);
    const ref = `s:${s.stashes[0].id}`;
    s = E.moveItem(s, ctx(), `c:${id}`, ref, pack.id, 1);
    expect(s.stashes[0].items.map((i) => i.name).sort()).toEqual(['Backpack', 'Torches']);
    expect(s.characters[0].inventory.map((i) => i.name)).toEqual(['Ruby']);
    s = E.moveCoins(s, ctx(), `c:${id}`, ref, 'gp', 2);
    expect(s.stashes[0].purse.gp).toBe(2);
    expect(s.characters[0].gp).toBe(10.8);
    expect(E.holderValue(s.characters[0].inventory, s.characters[0].purse)).toBe(510.8);
    expect(E.stashLoad(s.stashes[0], true)).toBe(7); // 5 lb pack + 2 torches + 2 coins, to one decimal
  });
});

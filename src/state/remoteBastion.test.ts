import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { commCost, commDelay } from '../rules/comms';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function withBastion(miles: number): State {
  let s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'Lord', gp: 100, level: 5, needsFood: false, needsWater: false })];
  s.log = [];
  s = E.foundBastion(s, ctx(), s.characters[0].id, 'Keep');
  const b = s.bastions[0];
  b.distanceMiles = miles;
  b.facilities.push({ id: 'f', name: 'Workshop', kind: 'special', size: 'roomy', order: 'Craft', orderNote: '', building: null, built: true });
  s.hirelings = [{ id: 'm', name: 'Pip', role: 'messenger', bonus: 0, passivePerception: 10, skilled: false, wageGp: 0.2, payer: 'party', active: true }];
  return s;
}

describe('communication delays', () => {
  it('times couriers by distance and spells by their own rules', () => {
    expect(commDelay('messenger', 48)).toBe(48 * 60);
    expect(commDelay('sending', 500)).toBe(0);
    expect(commDelay('animal', 60)).toBeNull();
    expect(commCost('messenger', 50)).toBe(1);
  });
});

describe('managing a Bastion from afar', () => {
  it('without new orders the hirelings Maintain, and the report travels back', () => {
    let s = withBastion(24);
    s.bastions[0].lastTurnDay = s.dayIndex - 7;
    s = E.resolveBastionTurn(s, ctx(), s.bastions[0].id);
    expect(s.log.some((l) => /Maintain/.test(l.text) && /No new orders/.test(l.text))).toBe(true);
    expect(s.dispatches).toHaveLength(1);
    expect(s.dispatches[0].direction).toBe('report');
    s = E.advance(s, ctx(), 25 * 60);
    expect(s.dispatches[0].delivered).toBe(true);
    expect(s.log.some((l) => /Word from Keep/.test(l.text))).toBe(true);
  });

  it('messenger orders take effect only when they arrive', () => {
    let s = withBastion(24);
    s.bastions[0].facilities[2].draftOrder = 'Trade';
    s = E.sendBastionOrders(s, ctx(), s.bastions[0].id, 'messenger', 'm');
    expect(s.characters[0].gp).toBeCloseTo(100 - 0.48);
    expect(s.bastions[0].facilities[2].order).toBe('Craft');
    expect(s.hirelings[0].busyUntil).toBe(E.absNow(s) + 2 * 24 * 60);
    s = E.advance(s, ctx(), 24 * 60);
    expect(s.bastions[0].facilities[2].order).toBe('Trade');
    expect(s.bastions[0].ordersArrived).toBe(true);
  });
});

describe('Bastion neglect', () => {
  it('hirelings abandon a Bastion after as many order-less turns as the owner’s level', () => {
    let s = withBastion(24);
    s.characters[0].level = 2;
    for (let i = 0; i < 2; i++) {
      s.bastions[0].lastTurnDay = s.dayIndex - 7;
      s = E.resolveBastionTurn(s, ctx(), s.bastions[0].id);
    }
    expect(s.bastions[0].abandoned).toBe(true);
    const turns = s.bastions[0].turns;
    s.bastions[0].lastTurnDay = s.dayIndex - 7;
    expect(E.resolveBastionTurn(s, ctx(), s.bastions[0].id).bastions[0].turns).toBe(turns);
  });

  it('orders that arrive reset the count', () => {
    let s = withBastion(24);
    s.bastions[0].neglectedTurns = 3;
    s.bastions[0].ordersArrived = true;
    s.bastions[0].lastTurnDay = s.dayIndex - 7;
    s = E.resolveBastionTurn(s, ctx(), s.bastions[0].id);
    expect(s.bastions[0].neglectedTurns).toBe(0);
  });
});

describe('potions and poison', () => {
  it('rolls potion miscibility and harvests poison against DC 20', () => {
    let s = withBastion(0);
    s = E.mixPotions(s, ctx(0.995), 'Healing and Speed');
    expect(s.log[0].text).toMatch(/d100 = 100.*permanent/);
    s = E.harvestPoison(s, ctx(0.99), s.characters[0].id, 2, 'Giant Spider');
    expect(s.characters[0].inventory.some((i) => i.name === 'Poison: Basic Poison (Giant Spider venom)' && i.valueGp === 100)).toBe(true);
    s = E.harvestPoison(s, ctx(0.1), s.characters[0].id, 2, 'Wyvern');
    expect(s.log[0].text).toMatch(/exposed to its poison/);
  });
});

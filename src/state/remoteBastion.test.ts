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

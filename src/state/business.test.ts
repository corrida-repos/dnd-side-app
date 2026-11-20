import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import { rollBusiness } from '../rules/business';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

describe('Running a Business table', () => {
  it('adds days (at most 30) and subtracts 10 per debt', () => {
    // rng 0.1 → d100 11; +10 days = 21 → full maintenance for 10 days at 2 GP
    expect(rollBusiness(() => 0.1, 10, 2, 0)).toMatchObject({ roll: 11, total: 21, payGp: 20, profitGp: 0 });
    expect(rollBusiness(() => 0.1, 50, 2, 0).total).toBe(41);
    expect(rollBusiness(() => 0.1, 10, 2, 1)).toMatchObject({ total: 11, payGp: 30 });
    // 0.99 → 100 → 3d10 (each 10) × 5 = 150
    expect(rollBusiness(() => 0.99, 5, 2, 0).profitGp).toBe(150);
  });
});

describe('running a business', () => {
  function shop() {
    let s = createDefaultState(() => 0);
    s.settings.sleepDeprivation = false;
    s.characters = [newCharacter({ name: 'Owner', gp: 5 })];
    s.log = [];
    s = E.addBusiness(s, ctx(), 'Shop', s.characters[0].id, 2);
    return s;
  }

  it('counts downtime days, then pays a profit and resets the count', () => {
    let s = shop();
    const day = s.dayIndex;
    s = E.runBusiness(s, ctx(), s.businesses[0].id, 3);
    expect(s.businesses[0].daysWorked).toBe(3);
    expect(s.dayIndex - day).toBeGreaterThanOrEqual(3);
    const gp = s.characters[0].gp;
    s = E.settleBusiness(s, ctx(0.99), s.businesses[0].id);
    expect(s.characters[0].gp).toBeCloseTo(gp + 150);
    expect(s.businesses[0].daysWorked).toBe(0);
  });

  it('an unaffordable cost becomes a debt that penalizes later rolls until paid', () => {
    let s = shop();
    s.businesses[0].daysWorked = 10;
    s.businesses[0].gpPerDay = 10;
    s = E.settleBusiness(s, ctx(0.05), s.businesses[0].id);
    expect(s.businesses[0]).toMatchObject({ debts: 1, unpaidGp: 150 });
    expect(s.characters[0].gp).toBe(5);
    s = E.payBusinessDebts(s, ctx(), s.businesses[0].id);
    expect(s.businesses[0].debts).toBe(0);
    expect(s.characters[0].gp).toBe(-145);
  });

  it('builds a business: pays up front, takes the listed days while overseen, slower while away', () => {
    let s = createDefaultState(() => 0);
    s.settings.sleepDeprivation = false;
    s.characters = [newCharacter({ name: 'Owner', gp: 2000, needsFood: false, needsWater: false })];
    s = E.addBusiness(s, ctx(), 'The Gilded Mug', s.characters[0].id, 5, { what: 'Tavern', costGp: 1000, days: 3, landGp: 200 });
    expect(s.characters[0].gp).toBe(800);
    expect(E.buildDaysLeft(s.businesses[0])).toBe(3);
    s = E.runBusiness(s, ctx(), s.businesses[0].id, 1);
    expect(s.businesses[0].daysWorked).toBe(0);
    s.businesses[0].overseeing = false;
    expect(E.buildDaysLeft(s.businesses[0])).toBe(9);
    s = E.advance(s, ctx(), 24 * 60);
    expect(s.businesses[0].building!.daysDone).toBeCloseTo(1 / 3);
    s.businesses[0].overseeing = true;
    s = E.advance(s, ctx(), 3 * 24 * 60);
    expect(s.businesses[0].building).toBeUndefined();
  });
});

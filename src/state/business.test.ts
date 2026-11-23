import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import { rollBusiness } from '../rules/business';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

describe('Running a Business table', () => {
  it('adds days (at most 30), +20 for a well-run business, and subtracts 10 per debt', () => {
    // rng 0.1 → d100 11; +10 days +20 = 41 → covers its maintenance
    expect(rollBusiness(() => 0.1, 10, 2, 0)).toMatchObject({ roll: 11, total: 41, payGp: 0, profitGp: 0 });
    expect(rollBusiness(() => 0.1, 50, 2, 0).total).toBe(61);
    // one debt: 31 → half the maintenance for 10 days at 2 GP
    expect(rollBusiness(() => 0.1, 10, 2, 1)).toMatchObject({ total: 31, payGp: 10 });
    // 0.99 → 100 → 3d10 (each 10) × 5 = 150, ×1 for 5 days and ×3 for 30
    expect(rollBusiness(() => 0.99, 5, 2, 0).profitGp).toBe(150);
    expect(rollBusiness(() => 0.99, 30, 2, 0).profitGp).toBe(450);
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
    // d100 6 + 10 days + 20 = 36: half the maintenance, 50 GP the owner can't pay.
    expect(s.businesses[0]).toMatchObject({ debts: 1, unpaidGp: 50 });
    expect(s.characters[0].gp).toBe(5);
    s = E.payBusinessDebts(s, ctx(), s.businesses[0].id);
    expect(s.businesses[0].debts).toBe(0);
    expect(s.characters[0].gp).toBe(-45);
  });

  it('builds a business: pays up front, takes the listed days while overseen, slower while away', () => {
    let s = createDefaultState(() => 0);
    s.settings.sleepDeprivation = false;
    s.characters = [newCharacter({ name: 'Owner', gp: 2000, needsFood: false, needsWater: false })];
    s = E.addBusiness(s, ctx(), 'The Gilded Mug', s.characters[0].id, 5, { what: 'Tavern', costGp: 1000, days: 3, landGp: 200 });
    expect(s.characters[0].gp).toBe(800);
    expect(E.buildDaysLeft(s, s.businesses[0])).toBe(3);
    s = E.runBusiness(s, ctx(), s.businesses[0].id, 1);
    expect(s.businesses[0].daysWorked).toBe(0);
    s.businesses[0].overseeing = false;
    expect(E.buildDaysLeft(s, s.businesses[0])).toBe(9);
    s = E.advance(s, ctx(), 24 * 60);
    expect(s.businesses[0].building!.daysDone).toBeCloseTo(1 / 3);
    s.businesses[0].overseeing = true;
    s = E.advance(s, ctx(), 3 * 24 * 60);
    expect(s.businesses[0].building).toBeUndefined();
  });

  it('extra crews, helpers and spells speed construction up', () => {
    let s = createDefaultState(() => 0);
    s.settings.sleepDeprivation = false;
    s.characters = [
      newCharacter({ name: 'Owner', gp: 10000, needsFood: false, needsWater: false }),
      newCharacter({ name: 'Mage', gp: 0, needsFood: false, needsWater: false, spells: [{ name: 'Wall of Stone', level: 5, prepared: true, alwaysPrepared: false }], resources: [{ id: 'r', name: 'Spell slots (level 5)', max: 1, current: 1, recharge: 'long' }] }),
    ];
    s = E.addBusiness(s, ctx(), 'Inn', s.characters[0].id, 5, { what: 'Inn', costGp: 4000, days: 40, landGp: 0 });
    const id = s.businesses[0].id;
    s = E.hireBuildCrews(s, ctx(), { kind: 'business', id }, 2);
    expect(s.characters[0].gp).toBe(10000 - 4000 - 4000);
    expect(E.buildDaysLeft(s, s.businesses[0])).toBe(20);
    s.businesses[0].helpers = [{ charId: s.characters[1].id, skilled: true }];
    expect(E.businessPace(s, s.businesses[0])).toBeCloseTo(2.1);
    s = E.castBuildSpell(s, ctx(), { kind: 'business', id }, s.characters[1].id, 'Wall of Stone');
    expect(s.businesses[0].building!.daysDone).toBe(5);
    expect(s.characters[1].resources[0].current).toBe(0);
    s = E.castBuildSpell(s, ctx(), { kind: 'business', id }, s.characters[1].id, 'Wall of Stone');
    expect(s.businesses[0].building!.daysDone).toBe(5);
  });
});

describe('speeding up other manual work', () => {
  it('Bastion construction takes crews and finishes sooner', () => {
    let s = createDefaultState(() => 0);
    s.settings.sleepDeprivation = false;
    s.characters = [newCharacter({ name: 'Lord', gp: 5000, level: 5, needsFood: false, needsWater: false })];
    s = E.foundBastion(s, ctx(), s.characters[0].id, 'Keep');
    const b = s.bastions[0];
    b.facilities.push({ id: 'f', name: 'Storehouse', kind: 'basic', size: 'roomy', order: 'Maintain', orderNote: '', built: false, building: { what: 'Storehouse', daysLeft: 10, totalDays: 10, costGp: 1000, toSize: 'roomy' } });
    const ref = { kind: 'facility' as const, bastionId: b.id, facilityId: 'f' };
    s = E.hireBuildCrews(s, ctx(), ref, 2);
    expect(s.characters[0].gp).toBe(4000);
    expect(E.jobDaysLeft(s, ref)).toBe(5);
    s = E.advance(s, ctx(), 5 * 24 * 60);
    expect(s.bastions[0].facilities.find((f) => f.id === 'f')!.built).toBe(true);
  });

  it('hired artisans assist crafting for wages, and Fabricate finishes a nonmagical item', () => {
    let s = createDefaultState(() => 0);
    s.settings.sleepDeprivation = false;
    const smith = newCharacter({ name: 'Smith', gp: 100, needsFood: false, needsWater: false, spells: [{ name: 'Fabricate', level: 4, prepared: true, alwaysPrepared: false }] });
    s.characters = [smith];
    s.projects = [
      { id: 'p', name: 'Shield', kind: 'nonmagical', charIds: [smith.id], daysRequired: 4, daysDone: 0, costGp: 0, notes: '', done: false, hiredArtisans: 1 },
      { id: 'q', name: 'Plate', kind: 'nonmagical', charIds: [smith.id], daysRequired: 150, daysDone: 0, costGp: 0, notes: '', done: false },
    ];
    s = E.workOnProjects(s, ctx(), ['p']);
    expect(s.projects[0].daysDone).toBe(2);
    expect(s.characters[0].gp).toBe(98);
    s = E.fabricateProject(s, ctx(), 'q', smith.id);
    expect(s.projects[1].done).toBe(true);
  });
});

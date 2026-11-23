import { describe, expect, it } from 'vitest';
import { buyBonus, buyTotalNeeded, offerShare, researchBonus, resolveActivity, resolveBuying, resolveSelling, sheetBonuses, weeksIn } from './downtimeOutcomes';
import { newCharacter } from '../state/defaults';

/** A fixed sequence of random numbers, repeating the last. */
const seq = (...v: number[]) => {
  let i = 0;
  return () => v[Math.min(i++, v.length - 1)];
};

describe("Xanathar's downtime activities", () => {
  it('research: +1 for every 50 GP beyond the first 50, max +6', () => {
    expect([50, 99, 100, 200, 350, 2000].map(researchBonus)).toEqual([0, 0, 1, 3, 6, 6]);
  });

  it('rolls each workweek on its own', () => {
    expect(weeksIn(4)).toBe(1);
    expect(weeksIn(10)).toBe(2);
    const r = resolveActivity('Pit fighting', { bonuses: [20, 20, 20], weeks: 3 }, () => 0.99);
    expect(r.gp).toBe(600);
    expect(r.text).toMatch(/week 1.*week 2.*week 3/);
  });

  it('pit fighting adds a roll of the largest Hit Die to the Constitution check', () => {
    // d20 rolls of 1 and DCs of 7 (5 + 1 + 1): only the Hit Die can carry the third check.
    const noDie = resolveActivity('Pit fighting', { bonuses: [0, 0, 0] }, () => 0);
    expect(noDie.gp).toBe(0);
    const withDie = resolveActivity('Pit fighting', { bonuses: [0, 0, 5], hitDie: 12 }, seq(0, 0, 0, 0, 0, 0, 0, 0, 0, 0.99, 0.5));
    expect(withDie.gp).toBe(50);
  });

  it('carousing and research report their weekly cost', () => {
    expect(resolveActivity('Carousing', { bonuses: [0], circle: 'upper', weeks: 2 }, () => 0.5).spent).toBe(500);
    expect(resolveActivity('Research', { bonuses: [0], gp: 300, weeks: 2 }, () => 0.5).spent).toBe(600);
  });

  it('crime: a complication on exactly one success, none on a clean job', () => {
    expect(resolveActivity('Crime', { bonuses: [100, 100, 100], dc: 10 }, () => 0.5).complication).toBeUndefined();
    expect(resolveActivity('Crime', { bonuses: [100, 0, 0], dc: 25 }, () => 0.5).complication).toBeDefined();
  });

  it('a reputation for laziness gives Disadvantage at work for the weeks that follow', () => {
    const r = resolveActivity('Working a trade', { bonuses: [0], weeks: 2, lazyWeeks: 6 }, () => 0.5);
    expect(r.lazyWeeks).toBe(4);
    expect(r.text).toMatch(/Disadvantage/);
  });

  it('a crime that ends in jail ends the stretch', () => {
    const r = resolveActivity('Crime', { bonuses: [0, 0, 0], dc: 25, weeks: 4 }, () => 0);
    expect(r.jailDays).toBe(280);
    expect(r.text).toMatch(/remaining 3 weeks/);
  });

  it('buying a magic item: rarity sets the total needed, and the asking price is rolled', () => {
    expect([buyTotalNeeded('common'), buyTotalNeeded('rare'), buyTotalNeeded('legendary')]).toEqual([10, 20, 30]);
    expect(buyBonus(3, 400)).toBe(5);
    expect(buyBonus(20, 2000)).toBe(10);
    // d20 = 11, +5 = 16: an uncommon item is for sale at 1d6 × 100 (4 × 100), halved for a consumable.
    const found = resolveBuying({ bonus: 5, weeks: 1, rarity: 'uncommon', consumable: true }, () => 0.5);
    expect(found.offers[0].gp).toBe(200);
    expect(found.spent).toBe(100);
    expect(found.text).toMatch(/Table D/);
    expect(resolveBuying({ bonus: 0, weeks: 1, rarity: 'rare', consumable: false }, () => 0.5).offers).toEqual([]);
    expect(resolveBuying({ bonus: 0, weeks: 1, rarity: 'rare', consumable: false, magic: 'high' }, () => 0.5).offers.length).toBe(1);
  });

  it('selling a magic item: Persuasion sets the offer at 50%, 100% or 150% of the base price', () => {
    expect([1, 10, 11, 20, 21].map(offerShare)).toEqual([0.5, 0.5, 1, 1, 1.5]);
    const sold = resolveSelling({ bonus: 5, weeks: 2, rarity: 'rare', consumable: false }, () => 0.5);
    expect(sold.offers.map((o) => o.gp)).toEqual([4000, 4000]);
    expect(sold.spent).toBe(50);
  });

  it('reads check bonuses from the character sheet', () => {
    const c = newCharacter({ name: 'A', level: 5 });
    c.abilities = { cha: 16, dex: 14 };
    c.skillProfs = ['Persuasion'];
    expect(sheetBonuses(c, 'Carousing')[0].bonus).toBe(6);
    expect(sheetBonuses(c, 'Crime')[0].bonus).toBe(2);
  });
});

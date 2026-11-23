import { describe, expect, it } from 'vitest';
import { buyTotalNeeded, researchBonus, resolveActivity, resolveBuying, resolveSelling, sellOffers, sheetBonuses, weeksIn } from './downtimeOutcomes';
import { newCharacter } from '../state/defaults';

/** A fixed sequence of random numbers, repeating the last. */
const seq = (...v: number[]) => {
  let i = 0;
  return () => v[Math.min(i++, v.length - 1)];
};

describe("Xanathar's downtime activities", () => {
  it('research: +1 for every 100 GP beyond the first 100, max +6', () => {
    expect([50, 100, 199, 200, 350, 2000].map(researchBonus)).toEqual([0, 0, 0, 1, 2, 6]);
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

  it('a crime that ends in jail ends the stretch', () => {
    const r = resolveActivity('Crime', { bonuses: [0, 0, 0], dc: 25, weeks: 4 }, () => 0);
    expect(r.jailDays).toBe(280);
    expect(r.text).toMatch(/remaining 3 weeks/);
  });

  it('buying a magic item: the total decides what can be found, and low totals pay half again', () => {
    expect(buyTotalNeeded('rare', true)).toBe(11);
    expect(buyTotalNeeded('rare', false)).toBe(31);
    const found = resolveBuying({ bonus: 3, weeks: 1, rarity: 'uncommon', consumable: true }, () => 0.5);
    expect(found.offers[0].gp).toBe(300);
    expect(found.spent).toBe(100);
    const none = resolveBuying({ bonus: 0, weeks: 1, rarity: 'rare', consumable: false }, () => 0.5);
    expect(none.offers).toEqual([]);
    const longSearch = resolveBuying({ bonus: 10, weeks: 20, rarity: 'rare', consumable: false }, () => 0.99);
    expect(longSearch.offers[0].gp).toBe(4000);
    expect(longSearch.spent).toBe(2000);
  });

  it('selling a magic item: DC 20 to find a buyer, then the offer table', () => {
    expect(sellOffers(15, 400).map((o) => o.gp)).toEqual([40]);
    expect(sellOffers(60, 400).map((o) => o.gp)).toEqual([200, 400]);
    expect(sellOffers(95, 400)[0]).toMatchObject({ gp: 600, shady: true });
    expect(resolveSelling({ findBonus: 0, offerBonus: 0, weeks: 2, rarity: 'rare', consumable: false }, () => 0.1).offers).toEqual([]);
    const sold = resolveSelling({ findBonus: 5, offerBonus: 0, weeks: 1, rarity: 'rare', consumable: false }, () => 0.9);
    expect(sold.offers.length).toBeGreaterThan(0);
    expect(sold.spent).toBe(25);
  });

  it('reads check bonuses from the character sheet', () => {
    const c = newCharacter({ name: 'A', level: 5 });
    c.abilities = { cha: 16, dex: 14 };
    c.skillProfs = ['Persuasion'];
    expect(sheetBonuses(c, 'Carousing')[0].bonus).toBe(6);
    expect(sheetBonuses(c, 'Crime')[0].bonus).toBe(2);
  });
});

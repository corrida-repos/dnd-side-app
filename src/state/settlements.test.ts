import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import { BUILDINGS, CALAMITIES, DEFINING_TRAITS, LEADERS, SETTLEMENT_SIZE, buildingType, countFor, generateTown, groupsOf, hasBuilding, rollTrait, townSells, townSpecials } from '../rules/settlements';
import { ITEM_PRICES } from '../rules/itemPrices';
import { STOCK_LIMIT } from '../rules/shop';

/** A seeded generator, so rolls vary but tests repeat. */
const seeded = (seed = 1) => {
  let x = seed;
  return () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646;
};
const item = (name: string) => ITEM_PRICES.find((p) => p.name === name)!;

describe('settlements (2024 DMG)', () => {
  it('uses the DMG sizes and tables', () => {
    expect(SETTLEMENT_SIZE.village.maxGp).toBe(20);
    expect(SETTLEMENT_SIZE.town.maxGp).toBe(2000);
    expect(SETTLEMENT_SIZE.city.maxGp).toBe(200000);
    expect(STOCK_LIMIT).toEqual({ village: 20, town: 2000, city: 200000 });
    expect(DEFINING_TRAITS.at(-1)![0]).toBe(20);
    expect(CALAMITIES).toHaveLength(12);
    expect(LEADERS).toHaveLength(12);
    expect(rollTrait(() => 0)).toBe('Fortified outer wall');
    expect(rollTrait(() => 0.999)).toMatch(/^Impressive structure/);
  });

  it('every building type has a game function, and ids are unique', () => {
    expect(new Set(BUILDINGS.map((b) => b.id)).size).toBe(BUILDINGS.length);
    for (const b of BUILDINGS) expect(b.does.length).toBeGreaterThan(10);
    // All 20 DMG Random Shops are covered.
    expect(BUILDINGS.filter((b) => b.dmgShop)).toHaveLength(20);
  });

  it('a city has everything a town always has, and more', () => {
    for (let seed = 1; seed < 30; seed++) {
      const city = generateTown('Greyport', 'city', true, seeded(seed));
      for (const t of ['inn', 'tavern', 'temple', 'cathedral', 'general', 'market', 'smithy', 'armorer', 'stable', 'docks', 'courier', 'watch', 'hall', 'guildhall', 'bank', 'library', 'fence', 'jeweler']) {
        expect(hasBuilding(city, t), `${t} (seed ${seed})`).toBe(true);
      }
      expect(city.buildings.length).toBeGreaterThan(70);
      const town = generateTown('Millford', 'town', false, seeded(seed));
      expect(hasBuilding(town, 'docks', 'shipwright')).toBe(false);
      expect(hasBuilding(town, 'cathedral')).toBe(false);
      expect(town.buildings.length).toBeGreaterThan(25);
      expect(town.buildings.length).toBeLessThan(city.buildings.length);
      const village = generateTown('Oakhollow', 'village', false, seeded(seed));
      expect(hasBuilding(village, 'inn', 'shrine', 'general')).toBe(true);
      expect(village.buildings.length).toBeLessThan(15);
    }
  });

  it('names taverns from the DMG table and nothing twice', () => {
    const city = generateTown('Greyport', 'city', true, seeded(7));
    const inns = city.buildings.filter((b) => b.type === 'inn');
    for (const i of inns) expect(i.name).toMatch(/^The /);
    expect(new Set(city.buildings.map((b) => b.name)).size).toBe(city.buildings.length);
    expect(groupsOf(city)[0].group).toBe('Food and lodging');
  });

  it('counts by size: fixed, ranges and chances', () => {
    const inn = buildingType('inn')!;
    expect(countFor(inn, 'village', false, () => 0.99)).toBe(1);
    expect(countFor(inn, 'city', false, () => 0)).toBe(3);
    expect(countFor(inn, 'city', false, () => 0.999)).toBe(5);
    expect(countFor(buildingType('docks')!, 'city', false, () => 0)).toBe(0);
    expect(countFor(buildingType('tavern')!, 'village', false, () => 0.1)).toBe(1);
    expect(countFor(buildingType('tavern')!, 'village', false, () => 0.9)).toBe(0);
  });

  it('the shop sells what the buildings stock, up to the size limit', () => {
    const village = generateTown('Oakhollow', 'village', false, seeded(3));
    village.buildings = village.buildings.filter((b) => ['inn', 'shrine', 'general'].includes(b.type));
    expect(townSells(village, item('Rope')).ok).toBe(true);
    expect(townSells(village, item('Longsword')).ok).toBe(false);
    expect(townSells(village, item('Longsword')).why).toMatch(/No shop/);
    const town = generateTown('Millford', 'town', false, seeded(3));
    town.buildings = town.buildings.filter((b) => b.type !== 'armorer');
    expect(townSells(town, item('Plate Armor')).ok).toBe(false);
    town.buildings.push({ id: 'x', type: 'armorer', name: 'Ironfist’s Armorer', keeper: 'Adrik Ironfist' });
    expect(townSells(town, item('Chain Mail')).ok).toBe(true);
    expect(townSells(town, item('Chain Mail')).at[0].name).toBe('Ironfist’s Armorer');
    town.buildings.push({ id: 'y', type: 'shipwright', name: 'Wren’s Shipwright', keeper: 'Lily Wren' });
    expect(townSells(town, item('Sailing Ship')).why).toMatch(/Too costly/);
  });

  it('an apothecary has Potions of Healing even in a village; a jeweler sells costly components', () => {
    const village = generateTown('Oakhollow', 'village', false, seeded(3));
    village.buildings.push({ id: 'p', type: 'apothecary', name: 'Wren’s Apothecary', keeper: 'Lily Wren' });
    const potion = townSpecials(village).find((x) => x.item.name === 'Potion of Healing')!;
    expect(potion.ok).toBe(true);
    const town = generateTown('Millford', 'town', false, seeded(3));
    town.buildings.push({ id: 'j', type: 'jeweler', name: 'Garrick’s Jeweler', keeper: 'Nissa Garrick' });
    const specials = townSpecials(town);
    expect(specials.find((x) => x.item.name === 'Diamond (300 GP)')?.ok).toBe(true);
    expect(specials.find((x) => x.item.name === 'Powdered ruby (1,500 GP)')?.ok).toBe(true);
    village.buildings.push({ id: 'j2', type: 'jeweler', name: 'Garrick’s Jeweler', keeper: 'Nissa Garrick' });
    expect(townSpecials(village).find((x) => x.item.name === 'Diamond (300 GP)')?.ok).toBe(false);
  });
});

describe('settlements in the game state', () => {
  it('rolls up the current place, keeps it by name, and edits it', () => {
    let s = createDefaultState(() => 0);
    s.place.name = 'Greyport';
    s.place.settlement = false;
    s = E.rollTown(s, { rng: seeded(5) }, 'city', true);
    expect(s.place.settlement).toBe(true);
    const town = E.currentTown(s)!;
    expect(town.name).toBe('Greyport');
    expect(s.log[0].text).toMatch(/City of Greyport/);
    const before = town.buildings.length;
    s = E.addTownBuilding(s, { rng: seeded(6) }, 'greyport', 'gunsmith');
    expect(E.currentTown(s)!.buildings.length).toBe(before + 1);
    const gone = E.currentTown(s)!.buildings[0];
    s = E.removeTownBuilding(s, { rng: seeded(6) }, 'Greyport', gone.id);
    expect(E.currentTown(s)!.buildings.some((b) => b.id === gone.id)).toBe(false);
    s = E.rerollTownDetail(s, { rng: () => 0 }, 'Greyport', 'calamity');
    expect(E.currentTown(s)!.calamity).toBe(CALAMITIES[0]);
    s = E.rerollTownDetail(s, { rng: () => 0 }, 'Greyport', 'noCalamity');
    expect(E.currentTown(s)!.calamity).toBeNull();
    // Leaving and coming back finds the same town.
    s.place.name = 'The King’s Road';
    s.place.settlement = false;
    expect(E.currentTown(s)).toBeUndefined();
    s.place.name = 'Greyport';
    s.place.settlement = true;
    expect(E.currentTown(s)!.buildings.length).toBe(before);
    s = E.forgetTown(s, { rng: () => 0 }, 'Greyport');
    expect(E.currentTown(s)).toBeUndefined();
  });

  it('buying a specialty good lands it in the inventory with its value', () => {
    let s = createDefaultState(() => 0);
    s.characters = [newCharacter({ name: 'A', gp: 500 })];
    const c = s.characters[0];
    s = E.buyItem(s, { rng: () => 0.9 }, c.id, 'Diamond (300 GP)', 1, 300, 0);
    const d = s.characters[0].inventory.find((i) => i.name === 'Diamond (300 GP)')!;
    expect(d.valueGp).toBe(300);
  });
});

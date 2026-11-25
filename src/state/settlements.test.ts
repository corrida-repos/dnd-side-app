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
    town.buildings.push({ id: 'x', type: 'armorer', name: 'Ironfist’s Armorer', keeper: { name: 'Adrik Ironfist' } });
    expect(townSells(town, item('Chain Mail')).ok).toBe(true);
    expect(townSells(town, item('Chain Mail')).at[0].name).toBe('Ironfist’s Armorer');
    town.buildings.push({ id: 'y', type: 'shipwright', name: 'Wren’s Shipwright', keeper: { name: 'Lily Wren' } });
    expect(townSells(town, item('Sailing Ship')).why).toMatch(/Too costly/);
  });

  it('an apothecary has Potions of Healing even in a village; a jeweler sells costly components', () => {
    const village = generateTown('Oakhollow', 'village', false, seeded(3));
    village.buildings.push({ id: 'p', type: 'apothecary', name: 'Wren’s Apothecary', keeper: { name: 'Lily Wren' } });
    const potion = townSpecials(village).find((x) => x.item.name === 'Potion of Healing')!;
    expect(potion.ok).toBe(true);
    const town = generateTown('Millford', 'town', false, seeded(3));
    town.buildings.push({ id: 'j', type: 'jeweler', name: 'Garrick’s Jeweler', keeper: { name: 'Nissa Garrick' } });
    const specials = townSpecials(town);
    expect(specials.find((x) => x.item.name === 'Diamond (300 GP)')?.ok).toBe(true);
    expect(specials.find((x) => x.item.name === 'Powdered ruby (1,500 GP)')?.ok).toBe(true);
    village.buildings.push({ id: 'j2', type: 'jeweler', name: 'Garrick’s Jeweler', keeper: { name: 'Nissa Garrick' } });
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

describe('townsfolk and the watch (2024 DMG Detailed NPCs, Greyhawk City Watch)', () => {
  it('rolls NPCs from the DMG tables with a PHB trait per alignment part', async () => {
    const { rollNpc, NAME_TABLES, ALIGNMENT_TRAITS, APPEARANCE, SECRETS, rollTraits } = await import('../rules/npcs');
    for (let seed = 1; seed < 40; seed++) {
      const n = rollNpc('Smith', 'Commoner', 'any', seeded(seed));
      const [given, surname] = n.name.split(' ');
      expect(NAME_TABLES.some((t) => t.given.includes(given) && t.surname.includes(surname))).toBe(true);
      expect(APPEARANCE).toContain(n.appearance);
      expect(SECRETS).toContain(n.secret);
      const parts = n.align === 'N' ? ['N', 'N'] : n.align!.split('');
      parts.forEach((p, i) => expect(ALIGNMENT_TRAITS[p as 'L'][0] !== undefined && ALIGNMENT_TRAITS[p as 'L'].includes(n.traits![i])).toBe(true));
    }
    const t = rollTraits('N', () => 0);
    expect(t).toHaveLength(2);
    expect(t[0]).not.toBe(t[1]);
  });

  it('every building has a keeper with a Monster Manual stat block, and staff where the DMG examples have them', async () => {
    const { STAT_BLOCKS } = await import('../rules/npcs');
    const { PEOPLE } = await import('../rules/settlements');
    for (const b of BUILDINGS) expect(PEOPLE[b.id], b.id).toBeTruthy();
    const city = generateTown('Greyport', 'city', true, seeded(11));
    for (const b of city.buildings) {
      expect(STAT_BLOCKS[b.keeper.stat!], `${b.type}: ${b.keeper.stat}`).toBeTruthy();
      for (const g of b.staff ?? []) expect(STAT_BLOCKS[g.stat], g.stat).toBeTruthy();
    }
    expect(city.buildings.find((b) => b.type === 'cathedral')!.keeper.stat).toBe('Archpriest');
    expect(city.buildings.find((b) => b.type === 'temple')!.staff!.find((g) => g.stat === 'Priest Acolyte')!.count).toBeGreaterThan(0);
    expect(city.buildings.find((b) => b.type === 'thieves')!.keeper.stat).toBe('Bandit Crime Lord');
    const village = generateTown('Oakhollow', 'village', false, seeded(11));
    expect(village.buildings.find((b) => b.type === 'shrine')!.keeper.stat).toBe('Priest Acolyte');
  });

  it('raises a watch scaled to the settlement, modelled on Greyhawk’s', () => {
    for (let seed = 1; seed < 25; seed++) {
      const city = generateTown('Greyport', 'city', false, seeded(seed));
      const sec = city.security!;
      expect(sec.walls).toBe(true);
      expect(sec.officers.map((o) => o.stat)).toEqual(['Warrior Veteran', 'Priest']);
      const guards = sec.forces.find((f) => f.stat === 'Guard')!.count;
      expect(guards % 20).toBe(0);
      expect(guards).toBeGreaterThanOrEqual(80);
      expect(guards).toBeLessThanOrEqual(480);
      expect(sec.forces.find((f) => f.stat === 'Warrior Veteran')!.count).toBe(Math.round(guards / 4));
      expect(sec.forces.some((f) => f.stat === 'Mage')).toBe(true);
      expect(sec.militia!.count % 100).toBe(0);
      expect(sec.gates).toBe(city.buildings.filter((b) => b.type === 'gate').length);
      expect(city.ruler?.name).toBeTruthy();

      const town = generateTown('Millford', 'town', false, seeded(seed));
      expect(town.security!.officers[0].stat).toBe('Guard Captain');
      const tg = town.security!.forces.find((f) => f.stat === 'Guard')!.count;
      expect(tg).toBeGreaterThanOrEqual(9);
      expect(tg).toBeLessThanOrEqual(24);

      const village = generateTown('Oakhollow', 'village', false, seeded(seed));
      expect(village.security!.forces).toEqual([]);
      expect(village.security!.officers[0].role).toBe('Constable');
      expect(village.security!.militia!.stat).toBe('Warrior Infantry');
      if (village.security!.walls) expect(hasBuilding(village, 'gate')).toBe(true);
    }
  });

  it('a new person for a job keeps the job; a townsperson becomes a contact without their secret', () => {
    let s = createDefaultState(() => 0);
    s.place.name = 'Greyport';
    s = E.rollTown(s, { rng: seeded(5) }, 'city', true);
    const inn = E.currentTown(s)!.buildings.find((b) => b.type === 'inn')!;
    s = E.rerollTownNpc(s, { rng: seeded(99) }, 'Greyport', { building: inn.id });
    const after = E.currentTown(s)!.buildings.find((b) => b.id === inn.id)!.keeper;
    expect(after.role).toBe('Innkeeper');
    expect(after.stat).toBe('Commoner');
    s = E.townNpcToContact(s, { rng: () => 0 }, 'Greyport', { building: inn.id });
    const k = s.contacts!.find((c) => c.name === after.name)!;
    expect(k.place).toBe('Greyport');
    expect(k.role).toMatch(/Innkeeper/);
    expect(k.notes).not.toContain(after.secret!);
    s = E.townNpcToContact(s, { rng: () => 0 }, 'Greyport', { building: inn.id });
    expect(s.contacts!.filter((c) => c.name === after.name)).toHaveLength(1);
    const captain = E.currentTown(s)!.security!.officers[0];
    s = E.rerollTownNpc(s, { rng: seeded(7) }, 'Greyport', { officer: 0 });
    expect(E.currentTown(s)!.security!.officers[0].role).toBe(captain.role);
    expect(E.currentTown(s)!.security!.officers[0].stat).toBe('Warrior Veteran');
  });
});

describe('one name per person', () => {
  it('nobody in a city shares a full name', () => {
    for (let seed = 1; seed < 15; seed++) {
      const city = generateTown('Greyport', 'city', true, seeded(seed));
      const names = [city.ruler!.name, ...city.security!.officers.map((o) => o.name), ...city.buildings.map((b) => b.keeper.name)];
      expect(new Set(names).size).toBe(names.length);
    }
  });
});

describe('local settlement workflows', () => {
  const ctx = { rng: () => 0.9 };
  function atTown(...types: string[]) {
    const state = createDefaultState(ctx.rng);
    state.place = { ...state.place, name: 'Greyport', settlement: true };
    state.minutes = 12 * 60;
    state.characters = [newCharacter({ name: 'Ada', gp: 1000 })];
    state.log = [];
    const town = generateTown('Greyport', 'town', true, seeded(19));
    town.buildings = types.map((type) => ({ id: type, type, name: `Greyport ${type}`, keeper: { name: 'Morgan' } }));
    state.towns = [town];
    return state;
  }

  it('commissions a route survey and pays once for a copy while the party keeps its original', () => {
    let s = atTown('mapmaker');
    Object.assign(s.settings, { encounters: false, navigation: false, townOpeningHours: false });
    const c = s.characters[0];
    c.toolProfs = ["Cartographer's Tools"];
    c.inventory = [
      { id: 'tools', name: "Cartographer's Tools", qty: 1, weight: 6, source: 'manual' },
      { id: 'paper', name: 'Paper', qty: 2, weight: 0, source: 'manual' },
    ];
    s.journey = [{ id: 'ridge', name: 'Pine Ridge', notes: '', terrain: 'hill', onRoute: true, goodRoad: true, difficult: false, miles: 3, milesDone: 0, done: false }];
    s = E.acceptMapCommission(s, ctx, 'Pine Ridge');
    const order = s.mapCommissions[0];
    expect(E.acceptMapCommission(s, ctx, 'pine ridge').mapCommissions).toHaveLength(1);
    expect(E.deliverMapCommission(s, ctx, order.id, c.id, 2).characters[0].gp).toBe(1000);
    s = E.runStage(s, ctx, 'ridge', { pace: 'normal', mapperId: c.id, foragerIds: [] }, false);
    expect(E.partyHasMapOf(s, 'Pine Ridge')).toBe(true);
    expect(E.deliverMapCommission({ ...s, place: { ...s.place, settlement: false } }, ctx, order.id, c.id, 2).characters[0].gp).toBe(1000);
    s = E.deliverMapCommission(s, { rng: () => 0 }, order.id, c.id, 2);
    expect(s.mapCommissions[0].delivered).toBe(false);
    expect(s.characters[0].inventory.find((i) => i.id === 'paper')?.qty).toBe(1);
    s = E.deliverMapCommission(s, ctx, order.id, c.id, 2);
    expect(s.mapCommissions[0].delivered).toBe(true);
    expect(s.characters[0].gp).toBe(1025);
    expect(s.characters[0].inventory.filter((i) => i.name === 'Map of Pine Ridge')).toMatchObject([{ qty: 1 }]);
    expect(E.deliverMapCommission(s, ctx, order.id, c.id, 2).characters[0].gp).toBe(1025);
  });

  it('checks open local fare and casting providers before charging', () => {
    let s = atTown('docks', 'magic');
    const id = s.characters[0].id;
    const request = { spell: 'Identify', level: 1, tradition: 'arcane' as const, here: 'town' as const, payerIds: [id], targetId: '' };
    s = E.bookPassage(s, ctx, 'coach', [id], 100, 1);
    expect(s.characters[0].gp).toBe(1000);
    s = E.bookPassage(s, ctx, 'ship', [id], 100, 1);
    s = E.buySpellcasting(s, ctx, request);
    expect(s.characters[0].gp).toBe(840);
    s.minutes = 0;
    expect(E.buySpellcasting(s, ctx, request).characters[0].gp).toBe(840);
    s.settings.townOpeningHours = false;
    expect(E.buySpellcasting(s, ctx, request).characters[0].gp).toBe(690);
  });

  it('requires a local buyer for valuables and keeps the PHB sale rate', () => {
    let s = atTown('general');
    const id = s.characters[0].id;
    s = E.addInventory(s, ctx, id, 'Ruby 500 GP');
    const ruby = s.characters[0].inventory.find((entry) => entry.name === 'Ruby')!;
    expect(E.sellItem(s, ctx, id, ruby.id, 1).characters[0].inventory).toContainEqual(ruby);
    s = E.addTownBuilding(s, ctx, 'Greyport', 'jeweler');
    s = E.sellItem(s, ctx, id, ruby.id, 1);
    expect(s.characters[0].gp).toBe(1500);
    expect(s.characters[0].inventory).not.toContainEqual(ruby);
  });

  it('charges a named inn rate and ties the room to the booked town', () => {
    let s = atTown('inn');
    s.towns![0].buildings[0].roomRates = [0.1, 0.3, 1];
    const id = s.characters[0].id;
    s.minutes = 0;
    s = E.rentRooms(s, ctx, [id], 'modest', 2, 'inn');
    expect(s.characters[0].gp).toBe(999.4);
    expect(s.characters[0].lodging).toMatchObject({ innId: 'inn', innName: 'Greyport inn', place: 'Greyport' });
    expect(E.hasRoom(s, s.characters[0])).toBe(true);
    s.place.name = 'Wroat';
    expect(E.hasRoom(s, s.characters[0])).toBe(false);
  });

  it('leaves boarded mounts with the stable and settles the bill only on local collection', () => {
    let s = atTown('stable');
    s.characters.push(newCharacter({ name: 'Clover', kind: 'mount', hp: 1, maxHp: 10, exhaustion: 1 }));
    const id = s.characters[1].id;
    s = E.boardMount(s, ctx, id, 'stable');
    expect(E.mountWithParty(s.characters[1])).toBe(false);
    s.place = { ...s.place, name: 'The forest', settlement: false };
    s = E.advance(s, ctx, 12 * 60);
    expect(s.characters[1]).toMatchObject({ hp: 10, exhaustion: 0, mountBoarding: { nights: 1, owedGp: 0.55 } });
    expect(s.characters[0].gp).toBe(1000);
    expect(E.collectMount(s, ctx, id).characters[1].mountBoarding).toBeDefined();
    s.place = { ...s.place, name: 'Greyport', settlement: true };
    s = E.collectMount(s, ctx, id);
    expect(s.characters[0].gp).toBe(999.45);
    expect(E.mountWithParty(s.characters[1])).toBe(true);
  });

  it('blocks deposits and withdrawals away from a vault or after it closes', () => {
    let s = atTown('bank');
    const id = s.characters[0].id;
    s = E.createStash(s, ctx, 'Vault', 'bank', '', null);
    const ref = `s:${s.stashes[0].id}`;
    s = E.moveCoins(s, ctx, `c:${id}`, ref, 'gp', 1);
    expect(s.stashes[0].purse.gp).toBe(1);
    s.minutes = 0;
    expect(E.moveCoins(s, ctx, ref, `c:${id}`, 'gp', 1).stashes[0].purse.gp).toBe(1);
    s.place.name = 'Elsewhere';
    s.minutes = 12 * 60;
    expect(E.moveCoins(s, ctx, `c:${id}`, ref, 'gp', 1).stashes[0].purse.gp).toBe(1);
    s.place.name = 'Greyport';
    expect(E.moveCoins(s, ctx, ref, `c:${id}`, 'gp', 1).stashes[0].purse.gp).toBe(0);
  });

  it('holds posted replies until the party picks them up in the right town', () => {
    let s = atTown('courier');
    const id = s.characters[0].id;
    s = E.sendLetter(s, ctx, { charId: id, contactId: null, correspondent: 'Sam', miles: 1, method: 'courier', text: 'News?', expectsReply: true });
    s = E.advance(s, ctx, 60);
    const reply = s.letters!.find((letter) => letter.direction === 'in')!;
    expect(reply.pickupTown).toBe('Greyport');
    s.dayIndex = Math.floor(reply.arrivesAt / 1440) + 1;
    s.place.name = 'Elsewhere';
    expect(E.collectLetter(s, ctx, reply.id).letters!.find((letter) => letter.id === reply.id)?.delivered).toBe(false);
    s.place.name = 'Greyport';
    expect(E.collectLetter(s, ctx, reply.id).letters!.find((letter) => letter.id === reply.id)?.delivered).toBe(true);
  });

  it('recruits hirelings through the matching local provider', () => {
    let s = atTown('inn');
    expect(E.employHireling(s, ctx, 'guard', 'Ari', 'party').hirelings).toHaveLength(0);
    s = E.employHireling(s, ctx, 'porter', 'Fen', 'party');
    expect(s.hirelings[0]).toMatchObject({ name: 'Fen', hiredAt: 'Greyport inn', hiredIn: 'Greyport' });
  });
});

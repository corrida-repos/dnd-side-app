import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { InventoryItem } from './types';
import { EFFECT_PRESETS } from '../rules/effects';
import { GEAR_CATALOG, batchCrafting, craftableWith, gearByName } from '../rules/crafting';
import { PACKS, liquidCapacity, packNamed, proficientWith, toolCheck, toolNamed, TOOLS } from '../rules/gear';
import { isMapOf as isMapOfPlace } from '../rules/tools';
import { parseDdbCharacter } from '../rules/ddb';
import { BOIL_MINUTES } from '../rules/survival';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const HIGH = ctx(0.999);
const item = (name: string, qty = 1, extra: Partial<InventoryItem> = {}): InventoryItem => ({ id: `${name}-${qty}`, name, qty, weight: 1, source: 'manual', container: null, ammo: null, ...extra });

function camp() {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.settings.encounters = false;
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.place.shelter = 'none';
  s.characters = [
    newCharacter({ name: 'Ana', needsFood: false, needsWater: false, inventory: [item('Torch', 2), item('Oil', 1), item('Hooded Lantern')] }),
    newCharacter({ name: 'Bo', needsFood: false, needsWater: false, inventory: [item('Rope')] }),
  ];
  s.log = [];
  return s;
}
const said = (s: ReturnType<typeof camp>, t: string) => s.log.some((l) => l.text.includes(t));
const preset = (name: string) => EFFECT_PRESETS.find((p) => p.name.startsWith(name))!;
const qty = (s: ReturnType<typeof camp>, who: number, name: string) => s.characters[who].inventory.filter((i) => i.name === name).reduce((a, i) => a + i.qty, 0);

describe('light sources use up their fuel (2024 PHB)', () => {
  it('lighting a Torch takes one from the inventory, and fails when none are left', () => {
    let s = camp();
    const a = s.characters[0].id;
    s = E.addEffect(s, ctx(), { preset: preset('Torch'), minutes: 60, targetIds: [a], casterId: null });
    expect(qty(s, 0, 'Torch')).toBe(1);
    s = E.addEffect(s, ctx(), { preset: preset('Torch'), minutes: 60, targetIds: [a], casterId: null });
    s = E.addEffect(s, ctx(), { preset: preset('Torch'), minutes: 60, targetIds: [a], casterId: null });
    expect(s.effects.filter((e) => e.name === 'Torch')).toHaveLength(2);
    expect(said(s, 'Nobody has a Torch left')).toBe(true);
  });

  it('can be told not to take from the inventory, and does nothing when the rule is off', () => {
    let s = camp();
    s = E.addEffect(s, ctx(), { preset: preset('Torch'), minutes: 60, targetIds: [], casterId: null, useGear: false });
    expect(qty(s, 0, 'Torch')).toBe(2);
    s.settings.trackGearUse = false;
    s = E.addEffect(s, ctx(), { preset: preset('Torch'), minutes: 60, targetIds: [], casterId: null });
    expect(qty(s, 0, 'Torch')).toBe(2);
  });

  it('an oil lamp needs the lamp itself, and a lantern burns a flask of Oil that can be put out and relit', () => {
    let s = camp();
    s = E.addEffect(s, ctx(), { preset: preset('Lamp'), minutes: 360, targetIds: [], casterId: null });
    expect(said(s, 'Nobody carries a Lamp')).toBe(true);
    s = E.addEffect(s, ctx(), { preset: preset('Hooded Lantern'), minutes: 360, targetIds: [], casterId: null });
    expect(qty(s, 0, 'Oil')).toBe(0);
    const id = s.effects[0].id;
    s = E.advance(s, ctx(), 60, 'camp');
    s = E.snuffLight(s, ctx(), id);
    expect(s.effects[0].pausedLeft).toBe(300);
    expect(s.effects[0].endsAt).toBeNull();
    s = E.advance(s, ctx(), 600, 'camp');
    expect(s.effects).toHaveLength(1);
    s = E.relightLight(s, ctx(), id);
    expect(s.effects[0].endsAt! - E.absNow(s)).toBe(300);
    s = E.setHood(s, ctx(), id, true);
    expect(s.effects[0].dimmed).toBe(true);
    s = E.refuelLight(s, ctx(), id);
    expect(said(s, 'Nobody has a flask of Oil left')).toBe(true);
  });
});

describe("Healer's Kit has ten uses (2024 PHB)", () => {
  it('stabilizing spends a use, and the last use empties the kit', () => {
    let s = camp();
    s.characters[1].inventory.push(item("Healer's Kit", 1, { uses: 1 }));
    s.characters[0].hp = 0;
    s.characters[0].dying = true;
    const [a, b] = s.characters.map((c) => c.id);
    s = E.stabilize(s, ctx(), a, b, 'kit');
    expect(s.characters[0].stable).toBe(true);
    expect(qty(s, 1, "Healer's Kit")).toBe(0);
    s.characters[0].stable = false;
    s.characters[0].dying = true;
    s = E.stabilize(s, ctx(), a, b, 'kit');
    expect(s.characters[0].dying).toBe(true);
    expect(said(s, "Nobody has a Healer's Kit")).toBe(true);
  });

  it('counts the uses across a stack', () => {
    const c = newCharacter({ inventory: [item("Healer's Kit", 3, { uses: 4 })] });
    expect(E.healerKitUses(c)).toBe(24);
  });
});

describe('equipment packs open into their contents', () => {
  it("an Explorer's Pack: Rations and Waterskin to food and water, a Bedroll for cold nights, the rest in its Backpack", () => {
    let s = camp();
    const b = s.characters[1];
    b.rationsLb = 0;
    b.waterCapacityPints = 0;
    b.waterPints = 0;
    b.bedroll = false;
    s = E.addInventory(s, ctx(), b.id, "Explorer's Pack");
    const c = s.characters[1];
    expect(c.rationsLb).toBe(10);
    expect(c.waterCapacityPints).toBe(4);
    expect(c.waterPints).toBe(4);
    expect(c.bedroll).toBe(true);
    const bag = c.inventory.find((i) => i.name === 'Backpack')!;
    expect(c.inventory.find((i) => i.name === 'Torch')).toMatchObject({ qty: 10, containerId: bag.id });
    expect(c.inventory.some((i) => i.name === "Explorer's Pack")).toBe(false);
  });

  it('every pack is listed with its 2024 contents, and names are matched loosely', () => {
    expect(Object.keys(PACKS)).toHaveLength(7);
    expect(packNamed('explorers pack')).toBe("Explorer's Pack");
    expect(PACKS["Dungeoneer's Pack"].find((x) => x.name === 'Torch')?.qty).toBe(10);
  });

  it('Rations listed as gear (from D&D Beyond) can be moved to the trackers', () => {
    let s = camp();
    s.characters[1].inventory.push(item('Rations', 5), item('Waterskin', 2));
    s.characters[1].rationsLb = 0;
    s = E.suppliesToTrackers(s, ctx(), s.characters[1].id);
    expect(s.characters[1].rationsLb).toBe(5);
    expect(s.characters[1].inventory.some((i) => i.name === 'Rations')).toBe(false);
  });

  it('a D&D Beyond pack with nothing in it is opened, and tool and skill proficiencies come through', () => {
    const r = parseDdbCharacter({
      data: {
        id: 1,
        name: 'Kit',
        stats: [1, 2, 3, 4, 5, 6].map((id) => ({ id, value: 12 })),
        classes: [{ level: 1, definition: { name: 'Rogue', hitDice: 8 } }],
        modifiers: { background: [{ type: 'proficiency', subType: 'thieves-tools', friendlySubtypeName: "Thieves' Tools" }, { type: 'proficiency', subType: 'sleight-of-hand' }, { type: 'proficiency', subType: 'dice-set', friendlySubtypeName: 'Dice Set' }] },
        inventory: [{ id: 5, quantity: 1, definition: { name: "Burglar's Pack", weight: 42 } }],
      },
    });
    expect(r.toolProfs).toEqual(["Thieves' Tools", 'Dice Set']);
    expect(r.skillProfs).toEqual(['Sleight of Hand']);
    expect(r.inventory.find((i) => i.name === 'Candle')?.qty).toBe(10);
    expect(r.inventory.some((i) => i.name === "Burglar's Pack")).toBe(false);
  });
});

describe('tool proficiency (2024 PHB)', () => {
  it('names tools by their 2024 names and aliases', () => {
    expect(toolNamed('thieves tools')?.name).toBe("Thieves' Tools");
    expect(toolNamed('Playing Card Set')?.name).toBe('Playing Cards');
    expect(TOOLS.filter((t) => t.category === 'instrument')).toHaveLength(10);
  });

  it('proficiency adds the Proficiency Bonus, and a skill that also applies gives Advantage', () => {
    const c = newCharacter({ level: 5, abilities: { dex: 16 }, toolProfs: ["Thieves' Tools"], skillProfs: ['Sleight of Hand'] });
    const t = toolCheck(c, "Thieves' Tools", 'dex', 'Sleight of Hand');
    expect(t).toMatchObject({ bonus: 6, proficient: true, advantage: true });
    expect(proficientWith(c, 'Lute')).toBe(false);
    expect(proficientWith(newCharacter({}), 'Lute')).toBeNull();
    expect(proficientWith(newCharacter({ trainedProficiencies: ['lute'] }), 'Lute')).toBe(true);
  });
});

describe('crafting lists from the 2024 tools', () => {
  it('fixes: Manacles need Tinker’s Tools, a Shield has no named tool, Rations come from Cook’s Utensils', () => {
    expect(gearByName('Manacles')?.tools).toEqual(["Tinker's Tools"]);
    expect(gearByName('Shield')?.dmAssigned).toBe(true);
    expect(craftableWith("Cook's Utensils").map((g) => g.name)).toEqual(['Rations']);
    expect(gearByName('Holy Water')).toBeUndefined();
    expect(GEAR_CATALOG.length).toBeGreaterThan(120);
    expect(GEAR_CATALOG.every((g) => g.gp > 0 && g.tools.length > 0)).toBe(true);
  });

  it('a batch of cheap items counts as one item worth the total (table rule)', () => {
    expect(batchCrafting(0.5, 20, true)).toEqual({ days: 1, gp: 5 });
    expect(batchCrafting(0.5, 20, false).days).toBe(20);
  });
});

describe('maps (2024 PHB: +5 to find the way)', () => {
  it('recognizes a map of the place in several spellings', () => {
    expect(isMapOfPlace('Map of Greyhollow', 'Greyhollow')).toBe(true);
    expect(isMapOfPlace('Map (Greyhollow)', 'greyhollow')).toBe(true);
    expect(isMapOfPlace('Greyhollow map', 'Greyhollow')).toBe(true);
    expect(isMapOfPlace('Map', 'Greyhollow')).toBe(false);
  });
});

describe('camp gear', () => {
  it('a Tent sleeps two: the rest sleep in the open', () => {
    const s = camp();
    s.place.shelter = 'tent';
    s.characters.push(newCharacter({ name: 'Cy', needsFood: false, needsWater: false }));
    s.characters[0].inventory.push(item('Tent'));
    expect(E.tentSpaces(s)).toBe(2);
    expect(E.tentShortfall(s).map((c) => c.name)).toEqual(['Cy']);
    s.settings.tentSpace = false;
    expect(E.tentShortfall(s)).toEqual([]);
  });

  it('a Shovel digs a fire pit in an hour, which shelters the fire; by hand takes four', () => {
    let s = camp();
    s.characters[0].inventory.push(item('Shovel'));
    const t0 = E.absNow(s);
    s = E.dig(s, ctx(), [s.characters[0].id], 'firePit');
    expect(E.absNow(s) - t0).toBe(60);
    expect(s.fire.sheltered).toBe(true);
    s = camp();
    const t1 = E.absNow(s);
    s = E.dig(s, ctx(), [s.characters[1].id], 'latrine');
    expect(E.absNow(s) - t1).toBe(240);
  });

  it('Hunting Traps set overnight can catch game, and are packed up when the party moves on', () => {
    let s = camp();
    s.characters[1].inventory.push(item('Hunting Trap', 2));
    s = E.setTraps(s, ctx(), s.characters[1].id, 2);
    expect(qty(s, 1, 'Hunting Trap')).toBe(0);
    s = E.advance(s, ctx(), 8 * 60, 'camp');
    const raw = s.stores.foodRawLb;
    s = E.checkTraps(s, HIGH);
    expect(s.stores.foodRawLb).toBeGreaterThan(raw);
    expect(qty(s, 1, 'Hunting Trap')).toBe(2);
    s = E.setTraps(s, ctx(), s.characters[1].id, 1);
    s = E.travel(s, ctx(0), { hours: 1, pace: 'normal', difficult: false, foragerIds: [] });
    expect(qty(s, 1, 'Hunting Trap')).toBe(2);
  });

  it('Caltrops take 10 minutes to gather up, and are left behind if the party moves on', () => {
    let s = camp();
    s.characters[1].inventory.push(item('Caltrops', 2));
    const id = s.characters[1].inventory.find((i) => i.name === 'Caltrops')!.id;
    s = E.scatterItem(s, ctx(), s.characters[1].id, id);
    expect(s.characters[1].inventory.filter((i) => i.scattered)).toHaveLength(1);
    const t0 = E.absNow(s);
    s = E.gatherScattered(s, ctx(), []);
    expect(E.absNow(s) - t0).toBe(10);
    expect(qty(s, 1, 'Caltrops')).toBe(2);
    s = E.scatterItem(s, ctx(), s.characters[1].id, s.characters[1].inventory.find((i) => i.name === 'Caltrops')!.id);
    s = E.travel(s, ctx(0), { hours: 1, pace: 'normal', difficult: false, foragerIds: [] });
    expect(qty(s, 1, 'Caltrops')).toBe(1);
    expect(said(s, 'Left behind on the ground')).toBe(true);
  });

  it('a Bell on a line wakes the whole camp when something creeps in', () => {
    let s = camp();
    s.characters[1].inventory.push(item('Bell'));
    s = E.rigAlarm(s, ctx(), s.characters[1].id);
    expect(s.place.alarm).toBe(true);
    s = E.interruptedRest(s, ctx(), { kind: 'long', after: 60, reason: 'disturbance', noise: 'quiet', dc: 30, resume: false });
    expect(said(s, 'alarm line jangles')).toBe(true);
    expect(said(s, 'sleeps on')).toBe(false);
  });

  it('mounts in a settlement are stabled and fed for 5 SP and 5 CP a day', () => {
    let s = camp();
    s.place.settlement = true;
    s.characters.push(newCharacter({ name: 'Nag', kind: 'mount', size: 'Large' }));
    s.characters[0].gp = 10;
    s.characters[1].gp = 10;
    s = E.advance(s, ctx(), 24 * 60, 'camp');
    expect(said(s, 'stabling and feed for Nag')).toBe(true);
  });
});

describe('handy gear', () => {
  it('a Magnifying Glass lights a fire only in bright sunlight', () => {
    let s = camp();
    s.characters[0].inventory.push(item('Magnifying Glass'));
    s.minutes = 12 * 60;
    s = E.lightFire(s, ctx(), s.characters[0].id, 'magnifier');
    expect(s.fire.lit).toBe(true);
    s = camp();
    s.characters[0].inventory.push(item('Magnifying Glass'));
    s.minutes = 1 * 60;
    s = E.lightFire(s, ctx(), s.characters[0].id, 'magnifier');
    expect(s.fire.lit).toBe(false);
  });

  it("a tool's Utilize use rolls against its DC, and Cobbler's Tools leave an effect behind", () => {
    let s = camp();
    s.characters[1].inventory.push(item("Cobbler's Tools"));
    s = E.useTool(s, ctx(0.45), s.characters[1].id, "Cobbler's Tools", 0, 0, false, 'boots'); // 10 vs 10
    expect(s.effects.some((e) => e.name.startsWith('Reworked boots'))).toBe(true);
    s = E.useTool(s, ctx(0.45), s.characters[1].id, "Thieves' Tools", 0, 0, false, 'the lock'); // improvised: 10 vs 20
    expect(said(s, 'improvised without')).toBe(true);
  });

  it('Perfume is used up for an hour of charm; writing uses Paper and Ink', () => {
    let s = camp();
    s.characters[1].inventory.push(item('Perfume'), item('Paper', 3), item('Ink'), item('Ink Pen'));
    s = E.applyPerfume(s, ctx(), s.characters[1].id);
    expect(qty(s, 1, 'Perfume')).toBe(0);
    expect(s.effects.find((e) => e.name.startsWith('Perfume'))!.endsAt! - E.absNow(s)).toBe(60);
    s = E.writePages(s, ctx(), s.characters[1].id, 2, 'a letter');
    expect(qty(s, 1, 'Paper')).toBe(1);
    expect(s.characters[1].inventory.find((i) => i.name === 'Ink')?.uses).toBe(498);
  });

  it('barrels and jugs hold water: 40 gallons a Barrel', () => {
    expect(liquidCapacity([{ name: 'Barrel', qty: 2 }, { name: 'Jug', qty: 1 }])).toBe(81);
  });
});

describe('doing without the proper gear (table rules)', () => {
  const forest = () => {
    const s = camp();
    s.place.terrain = 'forest';
    return s;
  };

  it('lighting a torch: free with a Tinderbox or from the campfire, 10 minutes of friction without', () => {
    let s = forest();
    const t0 = E.absNow(s);
    s = E.addEffect(s, ctx(), { preset: preset('Torch'), minutes: 60, targetIds: [], casterId: null });
    expect(E.absNow(s) - t0).toBe(10);
    expect(said(s, 'bow drill')).toBe(true);
    s.characters[1].inventory.push(item('Tinderbox'));
    const t1 = E.absNow(s);
    s = E.addEffect(s, ctx(), { preset: preset('Torch'), minutes: 60, targetIds: [], casterId: null });
    expect(E.absNow(s) - t1).toBe(0);
    s = forest();
    s.settings.improvised = false;
    s = E.addEffect(s, ctx(), { preset: preset('Torch'), minutes: 60, targetIds: [], casterId: null });
    expect(s.effects).toHaveLength(0);
    expect(qty(s, 0, 'Torch')).toBe(2);
  });

  it('a makeshift torch is made from what grows here and burns 30 minutes', () => {
    let s = forest();
    s = E.makeshift(s, ctx(0.5), s.characters[1].id, 'torch', 0); // 11 vs 10
    expect(qty(s, 1, 'Makeshift Torch')).toBe(1);
    s.characters[1].inventory.push(item('Tinderbox'));
    s = E.addEffect(s, ctx(), { preset: preset('Makeshift Torch'), minutes: 30, targetIds: [s.characters[1].id], casterId: null });
    expect(qty(s, 1, 'Makeshift Torch')).toBe(0);
    s = camp();
    s.place.terrain = 'desert';
    s = E.makeshift(s, HIGH, s.characters[1].id, 'torch', 5);
    expect(said(s, 'nothing to make a torch from')).toBe(true);
  });

  it('a lean-to sleeps two like a Tent, and a bed of boughs counts as a Blanket, until the party moves on', () => {
    let s = forest();
    s = E.makeshift(s, HIGH, s.characters[0].id, 'leanTo', 0);
    expect(s.place.shelter).toBe('tent');
    expect(E.tentSpaces(s)).toBe(2);
    s = E.makeshift(s, HIGH, s.characters[1].id, 'bedding', 0);
    expect(E.hasWarmCover({ ...s.characters[1], bedroll: false, blanket: false, coldWeatherGear: false })).toBe(true);
    s = E.travel(s, ctx(0), { hours: 1, pace: 'normal', difficult: false, foragerIds: [] });
    expect(E.tentSpaces(s)).toBe(0);
    expect(s.characters[1].bedding).toBe(false);
  });

  it('a hide becomes a waterskin, and vines become cord', () => {
    let s = forest();
    s.materials.push({ id: 'h', name: 'Hide (Deer)', qty: 1, unit: 'hide', valueGp: 1 });
    const cap = s.characters[1].waterCapacityPints;
    s = E.makeshift(s, HIGH, s.characters[1].id, 'waterskin', 0);
    expect(s.characters[1].waterCapacityPints).toBe(cap + 4);
    expect(s.materials.some((m) => m.id === 'h')).toBe(false);
    s = E.makeshift(s, HIGH, s.characters[1].id, 'cord', 0);
    expect(s.characters[1].inventory.some((i) => i.name.startsWith('Vine cord'))).toBe(true);
  });

  it('snares of cord need a Survival check to set and catch on 16+', () => {
    let s = forest();
    s = E.setTraps(s, ctx(0.3), s.characters[1].id, 1, true, 0); // 7 vs 15
    expect(s.place.trapsSet ?? []).toHaveLength(0);
    s = E.setTraps(s, HIGH, s.characters[1].id, 1, true, 0);
    expect(s.place.trapsSet?.[0].snare).toBe(true);
    s = E.advance(s, ctx(), 8 * 60, 'camp');
    const raw = s.stores.foodRawLb;
    s = E.checkTraps(s, HIGH);
    expect(s.stores.foodRawLb).toBeGreaterThan(raw);
    expect(qty(s, 1, 'Hunting Trap')).toBe(0);
    expect(qty(s, 1, 'Rope')).toBe(1);
  });

  it('pots on a line catch only a careless intruder', () => {
    let s = forest();
    s.characters[1].inventory.push(item('Iron Pot'));
    s = E.rigAlarm(s, ctx(), s.characters[1].id);
    expect(s.place.alarm).toBe('pots');
    const loud = E.interruptedRest(s, ctx(), { kind: 'long', after: 60, reason: 'disturbance', noise: 'quiet', dc: 8, resume: false });
    expect(loud.log.some((l) => l.text.includes('Pots clatter'))).toBe(true);
    const sly = E.interruptedRest(s, ctx(), { kind: 'long', after: 60, reason: 'disturbance', noise: 'quiet', dc: 18, resume: false });
    expect(sly.log.some((l) => l.text.includes('without a sound'))).toBe(true);
  });

  it('without a pot, hot stones boil half the water in twice the time', () => {
    let s = forest();
    s.fire = { lit: true, fuelHours: 5, sheltered: false };
    s.stores.waterUnsafeGal = 4;
    const t0 = E.absNow(s);
    s = E.boilWater(s, ctx());
    expect(s.stores.waterUnsafeGal).toBe(2);
    expect(E.absNow(s) - t0).toBe(2 * BOIL_MINUTES);
    s.characters[0].inventory.push(item('Iron Pot'));
    s = E.boilWater(s, ctx());
    expect(s.stores.waterUnsafeGal).toBe(0);
  });

  it('charcoal notes need no paper or ink; bareback mounts can’t gallop', () => {
    let s = forest();
    s = E.writePages(s, ctx(), s.characters[1].id, 1, 'a warning');
    expect(said(s, 'in charcoal on bark')).toBe(true);
    s.characters.push(newCharacter({ name: 'Nag', kind: 'mount', size: 'Large', saddle: 'none' }));
    s = E.travel(s, ctx(0), { hours: 1, pace: 'normal', difficult: false, foragerIds: [], gallop: true });
    expect(said(s, "can't gallop")).toBe(true);
  });
});

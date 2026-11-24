import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { InventoryItem } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const LOW = ctx(0);
const HIGH = ctx(0.999);
const tool = (name: string): InventoryItem => ({ id: name, name, qty: 1, weight: 1, source: 'manual', container: null, ammo: null });

function camp() {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.place.shelter = 'none';
  s.characters = [
    newCharacter({ name: 'Alch', needsFood: false, needsWater: false, survival: 0, wisMod: 0, inventory: [tool("Alchemist's Supplies"), tool("Cook's Utensils")] }),
    newCharacter({ name: 'Bare', needsFood: false, needsWater: false, survival: 0, wisMod: 0 }),
  ];
  s.log = [];
  return s;
}
const said = (s: ReturnType<typeof camp>, t: string) => s.log.some((l) => l.text.includes(t));

describe("Alchemist's Supplies light a fire (2024 PHB, Int DC 15)", () => {
  it('needs the supplies and a DC 15 Intelligence check, even with the lighting check off', () => {
    let s = camp();
    s.settings.fireLightingCheck = false;
    s = E.lightFire(s, ctx(0.65), s.characters[0].id, 'alchemist', 0); // 14
    expect(s.fire.lit).toBe(false);
    s = E.lightFire(s, ctx(0.7), s.characters[0].id, 'alchemist', 0); // 15
    expect(s.fire.lit).toBe(true);
    s = camp();
    s = E.lightFire(s, HIGH, s.characters[1].id, 'alchemist', 10);
    expect(s.fire.lit).toBe(false);
    expect(said(s, "no Alchemist's Supplies")).toBe(true);
  });
});

describe('testing food, drink and plants', () => {
  it('uses the tool’s 2024 DC, and reveals the truth only on a success', () => {
    let s = camp();
    const a = s.characters[0].id;
    s = E.testSubstance(s, ctx(0.65), a, 'food', 'cook', 0, true, 'the stew'); // 14 vs 15
    expect(said(s, "can't tell either way")).toBe(true);
    s = E.testSubstance(s, ctx(0.7), a, 'food', 'cook', 0, true, 'the stew'); // 15
    expect(said(s, 'tampered with')).toBe(true);
    s = E.testSubstance(s, ctx(0.45), a, 'object', 'alchemist', 0, false, ''); // 10 vs 15
    expect(said(s, 'finds no trace')).toBe(false);
  });

  it('anyone can try without a tool at DC +5 (table rule), or not at all when it’s off', () => {
    let s = camp();
    const b = s.characters[1].id;
    s = E.testSubstance(s, ctx(0.9), b, 'drink', 'improvised', 0, true, ''); // 19 vs 20
    expect(said(s, 'poisoned')).toBe(false);
    s = E.testSubstance(s, HIGH, b, 'drink', 'improvised', 0, true, ''); // 20
    expect(said(s, 'it has been poisoned')).toBe(true);
    s = camp();
    s.settings.improvised = false;
    s = E.testSubstance(s, HIGH, s.characters[1].id, 'plant', 'improvised', 10, false, '');
    expect(said(s, 'improvised attempts are off')).toBe(true);
  });

  it('a tool the tester doesn’t carry can’t be used', () => {
    let s = camp();
    s = E.testSubstance(s, HIGH, s.characters[1].id, 'plant', 'herbalism', 5, false, '');
    expect(said(s, 'has no Herbalism Kit')).toBe(true);
  });
});

describe('improvised attempts elsewhere', () => {
  it('cooking with the party’s utensils is Wisdom DC 10 without proficiency; with none, Survival DC 15 or plain fare', () => {
    let s = camp();
    s.fire.lit = true;
    s = E.cookMeal(s, ctx(0.7), s.characters[1].id);
    expect(said(s, 'against DC 10')).toBe(true);
    s = camp();
    s.characters[0].inventory = [tool("Alchemist's Supplies")];
    s.fire.lit = true;
    s = E.cookMeal(s, ctx(0.7), s.characters[1].id);
    expect(said(s, 'against DC 15')).toBe(true);
    s = camp();
    s.characters[0].inventory = [tool("Alchemist's Supplies")];
    s.fire.lit = true;
    s.settings.improvised = false;
    s = E.cookMeal(s, ctx(), s.characters[1].id);
    expect(said(s, 'plain fare')).toBe(true);
  });

  it('harvesting poison without a kit is DC 25 and takes twice as long', () => {
    let s = camp();
    const t = E.absNow(s);
    s = E.harvestPoison(s, ctx(0), s.characters[1].id, 0, 'Giant Spider', false);
    expect(E.absNow(s) - t).toBe(2);
    expect(said(s, 'vs DC 25')).toBe(true);
    s = camp();
    s.settings.improvised = false;
    s = E.harvestPoison(s, HIGH, s.characters[1].id, 10, 'Giant Spider', false);
    expect(said(s, "needs a Poisoner's Kit")).toBe(true);
  });

  it('Sight Rot ointment without an Herbalism Kit: two hours and DC 15', () => {
    let s = camp();
    s = E.exposeContagion(s, ctx(), s.characters[0].id, 'sightRot', false);
    const t = E.absNow(s);
    s = E.applySightRotOintment(s, LOW, s.characters[0].id, s.characters[1].id, false, 0);
    expect(E.absNow(s) - t).toBe(120);
    expect(s.characters[0].contagions[0].suppressedUntil ?? null).toBeNull();
    s = E.applySightRotOintment(s, HIGH, s.characters[0].id, s.characters[1].id, false, 0);
    expect(s.characters[0].contagions[0].suppressedUntil).toBeGreaterThan(E.absNow(s));
  });
});

describe('navigation aids, maps, mending and languages', () => {
  const lost = () => {
    const s = camp();
    s.travel.lost = true;
    s.travel.milesOffCourse = 3;
    s.minutes = 23 * 60;
    s.weather = { ...s.weather, precip: 'none' };
    return s;
  };

  it("stargazing fixes the position: Navigator's Tools DC 15, by eye DC 20, only on a clear night", () => {
    let s = lost();
    s.characters[0].inventory.push(tool("Navigator's Tools"));
    s = E.stargaze(s, ctx(0.7), s.characters[0].id, true, 0); // 15
    expect(s.travel.lost).toBe(false);
    s = lost();
    s = E.stargaze(s, ctx(0.9), s.characters[1].id, false, 0); // 19 vs 20
    expect(s.travel.lost).toBe(true);
    s = E.stargaze(s, HIGH, s.characters[1].id, false, 0);
    expect(s.travel.lost).toBe(false);
    s = lost();
    s.weather = { ...s.weather, precip: 'light' };
    s = E.stargaze(s, HIGH, s.characters[1].id, false, 0);
    expect(s.travel.lost).toBe(true);
  });

  it('a drafted map lands in the inventory and counts for this place only', () => {
    let s = camp();
    s.place.name = 'Greyhollow';
    s.characters[0].inventory.push(tool("Cartographer's Tools"));
    s = E.draftMap(s, ctx(0.7), s.characters[0].id, true, 0); // 15
    expect(s.characters[0].inventory.some((i) => i.name === 'Map of Greyhollow')).toBe(true);
    expect(E.partyHasMapHere(s)).toBe(true);
    s.place.name = 'Elsewhere';
    expect(E.partyHasMapHere(s)).toBe(false);
    s = camp();
    s = E.draftMap(s, ctx(0.9), s.characters[1].id, false, 0); // 19 vs 20, 2 hours
    expect(E.partyHasMapHere(s)).toBe(false);
  });

  it('mending: Weaver’s Tools fix cloth at DC 10, the spell fixes anything, non-cloth needs the spell', () => {
    let s = camp();
    s.characters[1].inventory = [tool("Weaver's Tools"), { ...tool('Cloak'), damaged: true }, { ...tool('Shield'), damaged: true }];
    const b = s.characters[1].id;
    s = E.mendItem(s, ctx(0.45), b, 'Cloak', b, 'tools', 0); // 10
    expect(s.characters[1].inventory.find((i) => i.id === 'Cloak')?.damaged).toBeUndefined();
    s = E.mendItem(s, HIGH, b, 'Shield', b, 'improvised', 5);
    expect(s.characters[1].inventory.find((i) => i.id === 'Shield')?.damaged).toBe(true);
    s.characters[1].spells = [{ name: 'Mending', level: 0, prepared: true, alwaysPrepared: false }];
    s = E.mendItem(s, ctx(), b, 'Shield', b, 'mending', 0);
    expect(s.characters[1].inventory.find((i) => i.id === 'Shield')?.damaged).toBeUndefined();
  });

  it('the gist of an unknown language at DC 20, never with improvised attempts off', () => {
    let s = camp();
    s = E.decipherText(s, HIGH, s.characters[0].id, 0, 'Giant', 'the bridge is cursed');
    expect(said(s, 'the bridge is cursed')).toBe(true);
    s = camp();
    s.settings.improvised = false;
    s = E.decipherText(s, HIGH, s.characters[0].id, 10, 'Giant', 'secret');
    expect(said(s, 'secret')).toBe(false);
  });
});

it('uses DMG lock quality and complexity for Thieves’ Tools', () => {
  const state = camp();
  state.characters[0].inventory.push(tool("Thieves' Tools"));
  const id = state.characters[0].id;
  const simple = E.useTool(state, ctx(0.5), id, "Thieves' Tools", 0, 0, false, 'chest', { quality: 'Inferior', complexity: 'Simple' });
  expect(E.absNow(simple)).toBe(E.absNow(state));
  expect(said(simple, 'DC 10, 1 action')).toBe(true);
  const complex = E.useTool(simple, ctx(0.5), id, "Thieves' Tools", 0, 0, false, 'vault', { quality: 'Superior', complexity: 'Complex' });
  expect(E.absNow(complex)).toBe(E.absNow(simple) + 1);
  expect(said(complex, 'DC 20, 1 min')).toBe(true);
});

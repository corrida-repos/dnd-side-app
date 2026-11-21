import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import { playerItems } from '../components/playerChecklist';
import { parseInventoryLine } from '../rules/encumbrance';
import { knownValue, misjudged, sameStack, valueUnknown } from '../rules/shop';
import { appraiseCheck, misjudgedValue, valuableKind } from '../rules/appraise';
import type { InventoryItem } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const LOW = ctx(0);
const HIGH = ctx(0.999);
const seq = (...v: number[]): E.Ctx => {
  let n = 0;
  return { rng: () => v[Math.min(n++, v.length - 1)] };
};

const item = (p: Partial<InventoryItem>): InventoryItem => ({ id: p.name ?? 'x', name: 'Thing', qty: 1, weight: 0, source: 'manual', container: null, ammo: null, ...p });

function party() {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.characters = [
    newCharacter({
      name: 'Cleric',
      className: 'Cleric',
      level: 9,
      needsFood: false,
      needsWater: false,
      spells: [{ name: 'Revivify', level: 3, prepared: true, alwaysPrepared: false }],
      inventory: [item({ id: 'd', name: 'Diamond', valueGp: 300, valueHidden: true })],
    }),
    newCharacter({ name: 'Gemcutter', needsFood: false, needsWater: false, inventory: [item({ id: 't', name: "Jeweler's Tools", weight: 2 })] }),
    newCharacter({ name: 'Fallen', hp: 0, maxHp: 20, needsFood: false, needsWater: false }),
  ];
  s.log = [];
  return s;
}

describe('items of unknown value', () => {
  it('tags hidden values, and gems or art with no value or PHB price', () => {
    expect(valueUnknown(item({ name: 'Diamond', valueGp: 300, valueHidden: true }))).toBe(true);
    expect(valueUnknown(item({ name: 'Ruby' }))).toBe(true);
    expect(valueUnknown(item({ name: 'Silver statuette' }))).toBe(true);
    expect(valueUnknown(item({ name: 'Diamond', valueGp: 300 }))).toBe(false);
    expect(valueUnknown(item({ name: 'Letter from the Duke' }))).toBe(false);
    expect(knownValue(item({ name: 'Diamond', valueGp: 300, valueHidden: true }))).toBeUndefined();
  });

  it('reads "value unknown" in a pasted line and keeps any price as the secret value', () => {
    expect(parseInventoryLine('Diamond (300 GP, value unknown)')).toMatchObject({ name: 'Diamond', valueGp: 300, valueHidden: true });
    expect(parseInventoryLine('2 Pearls unappraised')).toMatchObject({ name: 'Pearls', qty: 2, valueHidden: true });
    expect(parseInventoryLine('Diamond (300 GP)')).toMatchObject({ name: 'Diamond', valueGp: 300 });
  });

  it('keeps unknown-value stones in their own stacks', () => {
    expect(sameStack(item({ name: 'Diamond', valueGp: 300 }), item({ name: 'Diamond', valueGp: 300, valueHidden: true }))).toBe(false);
    expect(sameStack(item({ name: 'Diamond', valueGp: 50, valueHidden: true }), item({ name: 'Diamond', valueGp: 300, valueHidden: true }))).toBe(false);
    expect(sameStack(item({ name: 'Torch', valueGp: 0.01 }), item({ name: 'Torch' }))).toBe(true);
    let s = party();
    s = E.addInventory(s, ctx(), s.characters[0].id, 'Diamond (300 GP)');
    expect(s.characters[0].inventory.filter((i) => i.name === 'Diamond')).toHaveLength(2);
  });

  it('Jeweler’s Tools reveal a gem’s value on DC 15; a failure leaves it unknown', () => {
    let s = party();
    const [cleric, cutter] = s.characters;
    s = E.appraiseItem(s, LOW, cleric.id, 'd', 'tools', cutter.id, 2);
    expect(s.characters[0].inventory[0].valueHidden).toBe(true);
    s = E.appraiseItem(s, HIGH, cleric.id, 'd', 'tools', cutter.id, 2);
    expect(s.characters[0].inventory[0].valueHidden).toBeUndefined();
    expect(s.log.some((l) => l.text.includes('worth 300 GP'))).toBe(true);
  });

  it('needs Jeweler’s Tools, and they only work on gems', () => {
    let s = party();
    s.characters[0].inventory.push(item({ id: 'a', name: 'Gold chalice', valueGp: 250, valueHidden: true }));
    s = E.appraiseItem(s, HIGH, s.characters[0].id, 'd', 'tools', s.characters[0].id, 5);
    expect(s.characters[0].inventory[0].valueHidden).toBe(true);
    s = E.appraiseItem(s, HIGH, s.characters[0].id, 'a', 'tools', s.characters[1].id, 5);
    expect(s.characters[0].inventory[1].valueHidden).toBe(true);
  });

  it('a merchant values it only in a settlement; the DM can set and reveal a value', () => {
    let s = party();
    s.characters[0].inventory.push(item({ id: 'r', name: 'Ruby' }));
    s.place.settlement = false;
    s = E.appraiseItem(s, ctx(), s.characters[0].id, 'd', 'merchant', null, 0);
    expect(s.characters[0].inventory[0].valueHidden).toBe(true);
    s.place.settlement = true;
    s = E.appraiseItem(s, ctx(), s.characters[0].id, 'd', 'merchant', null, 0);
    expect(s.characters[0].inventory[0].valueHidden).toBeUndefined();
    s = E.appraiseItem(s, ctx(), s.characters[0].id, 'r', 'dm', null, 0, 5000);
    expect(s.characters[0].inventory[1]).toMatchObject({ valueGp: 5000 });
    expect(valueUnknown(s.characters[0].inventory[1])).toBe(false);
  });

  it('a spell works off the true value, and the checklist says the party can’t be sure', () => {
    let s = party();
    expect(playerItems(s, s.characters[0]).find((p) => p.text.includes('Revivify'))?.text).toContain('Not sure the Diamond');
    s.characters[2].diedAt = E.absNow(s);
    s = E.castSpell(s, ctx(), s.characters[0].id, 'Revivify', 'slot', s.characters[2].id);
    expect(s.characters[2].hp).toBe(1);
    expect(s.log.some((l) => l.text.includes('worth enough after all'))).toBe(true);
  });

  it('a stone too cheap for the spell still fails, and one with no value set says so', () => {
    let s = party();
    s.characters[0].inventory[0].valueGp = 50;
    s.characters[2].diedAt = E.absNow(s);
    s = E.castSpell(s, ctx(), s.characters[0].id, 'Revivify', 'slot', s.characters[2].id);
    expect(s.characters[2].diedAt).not.toBeNull();
    s.characters[0].inventory[0].valueGp = undefined;
    s = E.castSpell(s, ctx(), s.characters[0].id, 'Revivify', 'slot', s.characters[2].id);
    expect(s.log.some((l) => l.text.includes('Nobody knows what the Diamond is worth'))).toBe(true);
  });

  it('stash value counts only what the party knows', () => {
    const s = party();
    expect(E.holderValue(s.characters[0].inventory, { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 })).toBe(0);
  });

  it('sorts valuables and picks the check each switch allows', () => {
    expect(valuableKind('Diamond')).toBe('gem');
    expect(valuableKind('Gold necklace')).toBe('jewelry');
    expect(valuableKind('Silver statuette')).toBe('art');
    const on = { appraiseCrafts: true, appraiseByEye: true };
    expect(appraiseCheck('Gold necklace', 'tools', on)).toMatchObject({ ok: true, dc: 15 });
    expect(appraiseCheck('Gold necklace', 'tools', { ...on, appraiseCrafts: false }).ok).toBe(false);
    expect(appraiseCheck('Silver statuette', 'eye', on)).toMatchObject({ ok: true, dc: 15, label: 'Intelligence (History)' });
    expect(appraiseCheck('Silver statuette', 'eye', { ...on, appraiseCrafts: false })).toMatchObject({ ok: true, dc: 20 });
    expect(appraiseCheck('Diamond', 'eye', on)).toMatchObject({ ok: true, dc: 20, canAdvantage: false });
    expect(appraiseCheck('Diamond', 'eye', { appraiseCrafts: false, appraiseByEye: false }).ok).toBe(false);
  });

  it('anyone can judge by eye, but at DC 20', () => {
    let s = party();
    const id = s.characters[0].id;
    s = E.appraiseItem(s, ctx(0.9), id, 'd', 'eye', id, 0); // 19
    expect(valueUnknown(s.characters[0].inventory[0])).toBe(true);
    s = E.appraiseItem(s, HIGH, id, 'd', 'eye', id, 0); // 20
    expect(valueUnknown(s.characters[0].inventory[0])).toBe(false);
    s = party();
    s.settings.appraiseByEye = false;
    s = E.appraiseItem(s, HIGH, id, 'd', 'eye', id, 10);
    expect(valueUnknown(s.characters[0].inventory[0])).toBe(true);
  });

  it('skill and tool proficiency together give Advantage (2024 PHB)', () => {
    let s = party();
    const [cleric, cutter] = s.characters;
    s = E.appraiseItem(s, seq(0, 0.999), cleric.id, 'd', 'tools', cutter.id, 0);
    expect(valueUnknown(s.characters[0].inventory[0])).toBe(true);
    s = E.appraiseItem(s, seq(0, 0.999), cleric.id, 'd', 'tools', cutter.id, 0, undefined, true);
    expect(valueUnknown(s.characters[0].inventory[0])).toBe(false);
    expect(s.log.some((l) => l.text.includes('with Advantage'))).toBe(true);
  });

  it('one try each until a rest, when that rule is on', () => {
    let s = party();
    s.settings.appraiseOneTry = true;
    const [cleric, cutter] = s.characters;
    s = E.appraiseItem(s, LOW, cleric.id, 'd', 'tools', cutter.id, 0);
    s = E.appraiseItem(s, HIGH, cleric.id, 'd', 'tools', cutter.id, 0);
    expect(valueUnknown(s.characters[0].inventory[0])).toBe(true);
    s = E.appraiseItem(s, HIGH, cleric.id, 'd', 'eye', cleric.id, 0);
    expect(valueUnknown(s.characters[0].inventory[0])).toBe(false);
    s = party();
    s.settings.appraiseOneTry = true;
    s = E.appraiseItem(s, LOW, cleric.id, 'd', 'tools', cutter.id, 0);
    s = E.shortRest(s, ctx());
    expect(s.characters[0].inventory[0].appraiseTried).toBeUndefined();
  });

  it('a careful appraisal takes 10 minutes, when that rule is on', () => {
    let s = party();
    const t = s.minutes;
    s = E.appraiseItem(s, LOW, s.characters[0].id, 'd', 'tools', s.characters[1].id, 0);
    expect(s.minutes).toBe(t);
    s.settings.appraiseTime = true;
    s = E.appraiseItem(s, LOW, s.characters[0].id, 'd', 'tools', s.characters[1].id, 0);
    expect(E.absNow(s) - E.absNow(party())).toBe(10);
  });

  it('misjudging: a secret roll failed by 5 or more gives a wrong value that selling corrects', () => {
    expect(misjudgedValue(300, 'gem', true)).toBe(500);
    expect(misjudgedValue(1000, 'gem', false)).toBe(500);
    expect(misjudgedValue(10, 'gem', false)).toBe(50);
    let s = party();
    s.settings.appraiseMisjudge = true;
    s.place.settlement = true;
    const [cleric, cutter] = s.characters;
    s = E.appraiseItem(s, ctx(0), cleric.id, 'd', 'tools', cutter.id, 0); // 1 vs 15; rng 0 → lower tier
    const d = s.characters[0].inventory[0];
    expect(misjudged(d)).toBe(true);
    expect(knownValue(d)).toBe(100);
    expect(s.log.some((l) => l.text.includes('DC'))).toBe(false);
    expect(playerItems(s, s.characters[0]).find((p) => p.text.includes('Revivify'))?.text).toContain('Can’t cast');
    s = E.sellItem(s, ctx(), cleric.id, 'd', 1);
    expect(s.log.some((l) => l.text.includes('not the 100 GP the party thought'))).toBe(true);
  });

  it('an appraiser hireling uses their own tools and bonus', () => {
    let s = party();
    s.hirelings = [{ id: 'h1', name: 'Odo', role: 'appraiser', bonus: 20, passivePerception: 10, skilled: true, wageGp: 2, payer: 'party', active: true }];
    s = E.appraiseItem(s, LOW, s.characters[0].id, 'd', 'tools', 'h:h1', 0);
    expect(valueUnknown(s.characters[0].inventory[0])).toBe(false);
  });

  it('a stone that isn’t worth enough says so instead of saying it’s missing', () => {
    let s = party();
    s.characters[0].inventory[0] = item({ id: 'd', name: 'Diamond', valueGp: 50 });
    s.characters[2].diedAt = E.absNow(s);
    s = E.castSpell(s, ctx(), s.characters[0].id, 'Revivify', 'slot', s.characters[2].id);
    expect(s.log.some((l) => l.text.includes('isn’t worth enough') || l.text.includes("isn't worth enough"))).toBe(true);
  });
});

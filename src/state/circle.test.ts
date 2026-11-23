import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { InventoryItem, State } from './types';
import { circleEligible, helperProblem, optionProblem, prolongMinutes, supplantDiscount } from '../rules/circle';

// Rules checked against the 5etools Forgotten Realms: Heroes of Faerûn data (Circle Magic).
const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const slots = (id: string, level: number, n: number) => ({ id, name: `Spell slots (level ${level})`, max: n, current: n, recharge: 'long' as const });
const item = (p: Partial<InventoryItem>): InventoryItem => ({ id: p.name ?? 'x', name: 'Thing', qty: 1, weight: 0, source: 'manual', container: null, ammo: null, ...p });

const SPELLS = [
  { name: 'Warding Glyphwork', level: 3, castTime: '10 minutes', castMinutes: 10, durationMinutes: 60 * 24 },
  { name: 'Long Weave', level: 2, castTime: '2 hours', castMinutes: 120, durationMinutes: null },
  { name: 'Mind Ward', level: 3, castTime: '10 minutes', castMinutes: 10, durationMinutes: 60, concentration: true },
  { name: 'Glyph of Warding', level: 3, castTime: '1 hour', castMinutes: 60, durationMinutes: null, permanent: true },
  { name: "Songal's Elemental Suffusion", level: 5, castTime: '1 action', castMinutes: 0, durationMinutes: 1, concentration: true },
  { name: 'Quick Bolt', level: 1, castTime: '1 action', castMinutes: 0, durationMinutes: null },
];

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.settings.encounters = false;
  s.spellLibrary = SPELLS;
  s.characters = [
    newCharacter({
      name: 'Lead',
      needsFood: false,
      needsWater: false,
      spells: SPELLS.map((x) => ({ name: x.name, level: x.level, prepared: true, alwaysPrepared: false })),
      resources: [slots('a3', 3, 2), slots('a5', 5, 1)],
      inventory: [item({ name: 'Diamond', valueGp: 100 })],
    }),
    newCharacter({ name: 'Second', needsFood: false, needsWater: false, spells: [{ name: 'Bless', level: 1, prepared: true, alwaysPrepared: false }], resources: [slots('b1', 1, 3), slots('b3', 3, 1)] }),
    newCharacter({ name: 'Third', needsFood: false, needsWater: false, resources: [slots('c4', 4, 1)] }),
    newCharacter({ name: 'Fighter', needsFood: false, needsWater: false }),
  ];
  s.minutes = 9 * 60;
  s.log = [];
  patch(s);
  return s;
}
const ids = (s: State, ...names: string[]) => names.map((n) => s.characters.find((c) => c.name === n)!.id);
const cur = (s: State, name: string) => s.characters.find((c) => c.name === name)!.resources.map((r) => r.current);
const lib = (name: string) => SPELLS.find((x) => x.name === name)!;

describe('Circle Magic rules (Heroes of Faerûn, optional)', () => {
  it('tracks leveled spells taking 1 minute or longer, including Songal’s, which a circle slows to 1 minute', () => {
    expect(circleEligible(lib('Quick Bolt')).ok).toBe(false);
    expect(circleEligible({ name: 'Light', level: 0, castMinutes: 0 }).ok).toBe(false);
    expect(circleEligible({ name: 'Mystery', level: 2 }).ok).toBe(false);
    expect(circleEligible(lib('Warding Glyphwork')).ok).toBe(true);
    expect(circleEligible(lib("Songal's Elemental Suffusion")).ok).toBe(true);
    expect(optionProblem(lib("Songal's Elemental Suffusion"), 'prolong', 1)).toMatch(/isn't tracked/);
    expect(optionProblem(lib("Songal's Elemental Suffusion"), 'spell', 1)).toBe('');
  });

  it('checks each option against what the app knows about the spell', () => {
    expect(optionProblem(lib('Warding Glyphwork'), 'distribute', 1)).toMatch(/Concentration/);
    expect(optionProblem(lib('Mind Ward'), 'distribute', 1)).toBe('');
    expect(optionProblem(lib('Long Weave'), 'prolong', 1)).toMatch(/1 minute or longer/);
    expect(optionProblem(lib('Warding Glyphwork'), 'supplant', 1)).toMatch(/consume a Material component/);
    expect(optionProblem(lib('Glyph of Warding'), 'supplant', 1)).toBe('');
    expect(optionProblem(lib('Warding Glyphwork'), 'spell', 1)).toMatch(/no circle effect/);
  });

  it('has the book’s Prolong table and Supplant discount', () => {
    expect([1, 3, 4, 6, 7, 12].map(prolongMinutes)).toEqual([60, 60, 480, 480, 1440, 1440]);
    expect(supplantDiscount(2)).toBe(100);
  });

  it('asks secondary casters for Spellcasting or Pact Magic, and a slot only when the option needs one', () => {
    const s = fresh();
    expect(helperProblem(s.characters[3], { kind: 'none' })).toMatch(/no Spellcasting/);
    expect(helperProblem(s.characters[1], { kind: 'atLeast', level: 4 })).toMatch(/level 4 or higher/);
    expect(helperProblem(s.characters[2], { kind: 'any' })).toBe('');
    const drained = { ...s.characters[1], resources: s.characters[1].resources.map((r) => ({ ...r, current: 0 })) };
    expect(helperProblem(drained, { kind: 'none' })).toBe('');
    expect(helperProblem(drained, { kind: 'any' })).toMatch(/no spell slot left/);
  });
});

describe('casting a Circle spell', () => {
  it('Prolong: each secondary caster spends any spell slot, and the timer runs 1 hour longer', () => {
    const s = fresh();
    const [lead, second, third] = ids(s, 'Lead', 'Second', 'Third');
    const n = E.castSpell(s, ctx(), lead, 'Warding Glyphwork', 'slot', null, { helperIds: [second, third], option: 'prolong' });
    expect(cur(n, 'Lead')).toEqual([1, 1]);
    expect(cur(n, 'Second')).toEqual([2, 1]); // any slot: the lowest, level 1
    expect(cur(n, 'Third')).toEqual([0]);
    expect(E.absNow(n) - E.absNow(s)).toBe(10);
    const eff = n.effects.find((e) => e.name === 'Warding Glyphwork')!;
    expect(eff.endsAt! - eff.startedAt).toBe(25 * 60);
    expect(eff.notes).toMatch(/Circle spell \(Prolong\) with Second, Third/);
    expect(n.log.some((l) => /completes Warding Glyphwork as a Circle spell/.test(l.text) && l.sense)).toBe(true);
  });

  it('Augment and Safeguard cost secondary casters no slot', () => {
    const s = fresh();
    const [lead, second] = ids(s, 'Lead', 'Second');
    const n = E.castSpell(s, ctx(), lead, 'Warding Glyphwork', 'slot', null, { helperIds: [second], option: 'augment' });
    expect(cur(n, 'Lead')).toEqual([1, 1]);
    expect(cur(n, 'Second')).toEqual([3, 1]);
  });

  it('Distribute: every caster holds Concentration, and the spell lasts while any of them does', () => {
    const s = fresh();
    const [lead, second] = ids(s, 'Lead', 'Second');
    const n = E.castSpell(s, ctx(), lead, 'Mind Ward', 'slot', null, { helperIds: [second], option: 'distribute' });
    const eff = n.effects.find((e) => e.name === 'Mind Ward')!;
    expect(eff.concentrationIds).toEqual([lead, second]);
    const one = E.loseConcentration(n, ctx(), eff.id, lead);
    expect(one.effects.find((e) => e.name === 'Mind Ward')!.concentrationIds).toEqual([second]);
    expect(E.holdsConcentration(one, one.characters[0])).toBe(false);
    expect(E.holdsConcentration(one, one.characters[1])).toBe(true);
    const both = E.loseConcentration(one, ctx(), eff.id, second);
    expect(both.effects.some((e) => e.name === 'Mind Ward')).toBe(false);
  });

  it('Supplant: the consumed component costs 50 GP less per secondary caster, who each spend a slot of the spell’s level', () => {
    const s = fresh();
    const [lead, second, third] = ids(s, 'Lead', 'Second', 'Third');
    expect(E.castSpell(s, ctx(), lead, 'Glyph of Warding', 'slot', null, { helperIds: [second], option: 'supplant' }).log[0].text).toMatch(/needs powdered diamond worth 200\+ GP, 50 GP less/);
    const n = E.castSpell(s, ctx(), lead, 'Glyph of Warding', 'slot', null, { helperIds: [second, third], option: 'supplant' });
    expect(n.characters[0].inventory.some((i) => i.name === 'Diamond')).toBe(false);
    expect(cur(n, 'Second')).toEqual([3, 0]);
    expect(cur(n, 'Third')).toEqual([0]);
  });

  it('a spell’s own circle effect: Songal’s takes 1 minute, needs level 2+ slots and lasts up to 10 minutes', () => {
    const s = fresh();
    const [lead, second] = ids(s, 'Lead', 'Second');
    const n = E.castSpell(s, ctx(), lead, "Songal's Elemental Suffusion", 'slot', null, { helperIds: [second], option: 'spell' });
    expect(E.absNow(n) - E.absNow(s)).toBe(1);
    expect(cur(n, 'Lead')).toEqual([2, 0]);
    expect(cur(n, 'Second')).toEqual([3, 0]);
    const eff = n.effects.find((e) => e.name === "Songal's Elemental Suffusion")!;
    expect(eff.endsAt! - eff.startedAt).toBe(10);
    expect(eff.concentration).toBe(true);
  });

  it('refuses before anything is spent when a caster or the option doesn’t fit', () => {
    const s = fresh();
    const [lead, second, fighter] = ids(s, 'Lead', 'Second', 'Fighter');
    const n = E.castSpell(s, ctx(), lead, 'Warding Glyphwork', 'slot', null, { helperIds: [fighter], option: 'augment' });
    expect(cur(n, 'Lead')).toEqual([2, 1]);
    expect(E.absNow(n)).toBe(E.absNow(s));
    expect(n.log[0].text).toMatch(/doesn't begin/);
    expect(E.castSpell(s, ctx(), lead, 'Warding Glyphwork', 'slot', null, { helperIds: [second], option: 'distribute' }).log[0].text).toMatch(/Distribute is for spells that need Concentration/);
    expect(E.castSpell(s, ctx(), lead, 'Quick Bolt', 'slot', null, { helperIds: [second], option: 'augment' }).log[0].text).toMatch(/combat's timescale/);
    expect(E.castSpell(s, ctx(), lead, 'Warding Glyphwork', 'ritual', null, { helperIds: [second], option: 'augment' }).log[0].text).toMatch(/can't be cast as a ritual/);
    const off = fresh((d) => (d.settings.circleMagic = false));
    expect(E.castSpell(off, ctx(), ids(off, 'Lead')[0], 'Warding Glyphwork', 'slot', null, { helperIds: ids(off, 'Second'), option: 'augment' }).log[0].text).toMatch(/switched off/);
  });

  it('ends what every caster in the circle was concentrating on', () => {
    const s = fresh((d) => d.effects.push({ id: 'x', name: 'Bless', kind: 'spell', targetIds: [], casterId: d.characters[1].id, concentration: true, shelter: false, startedAt: E.absNow(d), endsAt: E.absNow(d) + 60, notes: '' }));
    const [lead, second] = ids(s, 'Lead', 'Second');
    const n = E.castSpell(s, ctx(), lead, 'Warding Glyphwork', 'slot', null, { helperIds: [second], option: 'augment' });
    expect(n.effects.some((e) => e.name === 'Bless')).toBe(false);
    expect(n.log.some((l) => /Second stops concentrating on Bless/.test(l.text))).toBe(true);
  });

  it('breaks off when creatures turn up mid-casting: no slot spent and no component consumed', () => {
    const s = fresh((d) => {
      d.settings.encounters = true;
      d.place.danger = 'deadly';
      d.encounterClock = 0;
      d.characters[0].inventory = [item({ name: 'Diamond', valueGp: 200 })];
    });
    const [lead, second] = ids(s, 'Lead', 'Second');
    const n = E.castSpell(s, ctx(0.9), lead, 'Long Weave', 'slot', null, { helperIds: [second], option: 'expand' });
    expect(cur(n, 'Lead')).toEqual([2, 1]);
    expect(cur(n, 'Second')).toEqual([3, 1]);
    expect(E.absNow(n) - E.absNow(s)).toBe(60);
    expect(n.log.some((l) => /break off casting Long Weave after 1 h/.test(l.text) && l.sense)).toBe(true);
    const glyph = E.castSpell(s, ctx(0.9), lead, 'Glyph of Warding', 'slot');
    expect(glyph.characters[0].inventory.some((i) => i.name === 'Diamond')).toBe(true);
    expect(cur(glyph, 'Lead')).toEqual([2, 1]);
  });

  it('a solo casting of 1 minute or longer also needs Concentration throughout', () => {
    const s = fresh((d) => d.effects.push({ id: 'x', name: 'Detect Magic', kind: 'spell', targetIds: [], casterId: d.characters[0].id, concentration: true, shelter: false, startedAt: E.absNow(d), endsAt: E.absNow(d) + 10, notes: '' }));
    const n = E.castSpell(s, ctx(), ids(s, 'Lead')[0], 'Warding Glyphwork', 'slot');
    expect(n.effects.some((e) => e.name === 'Detect Magic')).toBe(false);
    expect(cur(n, 'Lead')).toEqual([1, 1]);
  });
});

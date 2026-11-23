import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { canTame, influenceDC, missedDays, sessionResult, tameDC, trainingNeeded, trustNeeded, bigEnoughToRide } from '../rules/taming';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const NAT20 = ctx(0.999);
const NAT1 = ctx(0);
const none = { food: false, charmed: false, speaking: false, threatened: false };
const wolf: E.NewTame = { name: 'Ash', creature: 'Wolf', type: 'beast', size: 'Medium', int: 3, cr: '1/4', speed: 40, movement: 'land' };
const griffon: E.NewTame = { name: 'Talon', creature: 'Griffon', type: 'monstrosity', size: 'Large', int: 2, cr: '2', speed: 30, movement: 'fly' };

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.encounters = false;
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'Ranger', wisMod: 2, level: 5, skillProfs: ['Animal Handling'], needsFood: false, needsWater: false, tasks: [] })];
  s.stores = { foodLb: 0, waterGal: 0, foodRawLb: 100, waterUnsafeGal: 0 };
  s.minutes = 8 * 60;
  s.log = [];
  patch(s);
  return s;
}
const nextDay = (s: State): State => ({ ...s, dayIndex: s.dayIndex + 1 });
const begin = (t: E.NewTame = wolf): State => {
  const s = fresh();
  return E.approachCreature(s, NAT20, t, s.characters[0].id, none, false);
};

describe('taming rules', () => {
  it('follows the 2024 Influence DC and limits taming to dim Beasts and Monstrosities', () => {
    expect(influenceDC(3)).toBe(15);
    expect(influenceDC(17)).toBe(17);
    expect(tameDC(3, '1/4')).toBe(15);
    expect(tameDC(2, '2')).toBe(17);
    expect(tameDC(2, '6')).toBe(20);
    expect(canTame('beast', 3).ok).toBe(true);
    expect(canTame('Monstrosity', 5).ok).toBe(true);
    expect(canTame('monstrosity', 6).ok).toBe(false);
    expect(canTame('dragon', 2).ok).toBe(false);
  });

  it('scales the work by Challenge Rating and cleverness', () => {
    expect(trustNeeded('1/4', 3)).toBe(3);
    expect(trustNeeded('1', 3)).toBe(5);
    expect(trustNeeded('2', 4)).toBe(9);
    expect(trainingNeeded('2', 2)).toBe(4);
  });

  it('reads results, missed days and rider size', () => {
    expect(sessionResult(20, 5, 15)).toBe('great');
    expect(sessionResult(12, 15, 15)).toBe('success');
    expect(sessionResult(8, 11, 15)).toBe('fail');
    expect(sessionResult(5, 10, 15)).toBe('setback');
    expect(missedDays(3, 4)).toBe(0);
    expect(missedDays(3, 6)).toBe(2);
    expect(bigEnoughToRide('Large', 'Medium')).toBe(true);
    expect(bigEnoughToRide('Medium', 'Medium')).toBe(false);
  });
});

describe('taming a wild creature', () => {
  it('starts bonding on a successful approach', () => {
    const s = fresh();
    const n = E.approachCreature(s, NAT20, wolf, s.characters[0].id, none, false);
    expect(n.taming).toMatchObject([{ name: 'Ash', stage: 'bonding', trust: 0, needed: 3 }]);
    expect(n.minutes).toBe(s.minutes + 10);
  });

  it('refuses a Hostile creature unless it is charmed', () => {
    const s = fresh();
    expect(E.approachCreature(s, NAT20, wolf, s.characters[0].id, none, true).taming ?? []).toHaveLength(0);
    expect(E.approachCreature(s, NAT20, wolf, s.characters[0].id, { ...none, charmed: true }, true).taming).toHaveLength(1);
  });

  it('makes the tamer wait a day after a near miss, and loses the creature on a bad miss', () => {
    const s = fresh((d) => (d.characters[0].wisMod = 4));
    // d20 = 7 + 4 + 3 = 14 against DC 15: a near miss.
    const near = E.approachCreature(s, ctx(0.3), wolf, s.characters[0].id, none, false);
    expect(near.taming).toMatchObject([{ stage: 'wary' }]);
    expect(E.approachCreature(near, NAT20, wolf, s.characters[0].id, none, false).taming).toMatchObject([{ stage: 'wary' }]);
    const later = nextDay(near);
    expect(E.approachCreature(later, NAT20, wolf, s.characters[0].id, none, false).taming).toMatchObject([{ stage: 'bonding' }]);
    expect(E.approachCreature(s, NAT1, wolf, s.characters[0].id, none, false).taming).toHaveLength(0);
  });

  it('wins it over with daily sessions, feeding it, and adds it to the party', () => {
    let s = begin();
    const id = s.taming![0].id;
    s = E.tameSession(s, ctx(0.7), id, none);
    expect(s.taming![0].trust).toBe(1);
    expect(s.stores.foodRawLb).toBe(99);
    // Only once a day.
    expect(E.tameSession(s, NAT20, id, none).taming![0].trust).toBe(1);
    s = E.tameSession(nextDay(s), NAT20, id, none);
    expect(s.taming![0]).toMatchObject({ stage: 'tamed', trust: 3 });
    const m = s.characters.find((c) => c.kind === 'mount')!;
    expect(m).toMatchObject({ name: 'Ash', species: 'Wolf', size: 'Medium', speed: 40, tamed: { trained: [] } });
    expect(s.taming![0].mountId).toBe(m.id);
  });

  it('loses trust for missed days and lets it go after three bad days', () => {
    let s = begin();
    const id = s.taming![0].id;
    s = E.tameSession(s, NAT20, id, none);
    expect(s.taming![0].trust).toBe(2);
    s = E.tameSession({ ...s, dayIndex: s.dayIndex + 2 }, ctx(0.3), id, none);
    expect(s.taming![0].trust).toBe(1);
    expect(E.tameSession({ ...s, dayIndex: s.dayIndex + 4 }, NAT20, id, none).taming).toHaveLength(0);
    let b = begin();
    const bid = b.taming![0].id;
    for (let i = 0; i < 2; i++) b = E.tameSession(nextDay(b), NAT1, bid, none);
    expect(b.taming![0].fails).toBe(2);
    b = E.tameSession(nextDay(b), NAT1, bid, none);
    expect(b.taming).toHaveLength(0);
  });

  it('trains a tamed creature to accept a rider if it is big enough', () => {
    let s = begin(griffon);
    const id = s.taming![0].id;
    s = { ...s, taming: [{ ...s.taming![0], trust: 6 }] };
    s = E.tameSession(s, NAT20, id, none);
    expect(s.taming![0].stage).toBe('tamed');
    s = E.startTraining(s, ctx(), id, 'mount');
    expect(s.taming![0].training).toMatchObject({ kind: 'mount', needed: 4 });
    for (let i = 0; i < 2; i++) s = E.tameSession(nextDay(s), NAT20, id, none);
    expect(s.taming![0].trained).toEqual(['mount']);
    expect(s.characters.find((c) => c.name === 'Talon')!.tamed!.trained).toEqual(['mount']);
    expect(s.log.some((l) => /Exotic Saddle/.test(l.text))).toBe(true);
    // A Medium wolf can't carry a Medium rider.
    let w = begin();
    w = { ...w, taming: [{ ...w.taming![0], stage: 'tamed' }] };
    expect(E.startTraining(w, ctx(), w.taming![0].id, 'mount').taming![0].training).toBeUndefined();
  });

  it('does nothing when switched off', () => {
    const s = fresh((d) => (d.settings.taming = false));
    expect(E.approachCreature(s, NAT20, wolf, s.characters[0].id, none, false).taming ?? []).toHaveLength(0);
  });
});

import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { MagicItem, State } from './types';
import { spellSlotsFor } from '../rules/upkeep';
import { rollExpr } from '../rules/dice';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const LOW = ctx(0);
const HIGH = ctx(0.999);

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'A', needsFood: false, needsWater: false })];
  s.log = [];
  patch(s);
  return s;
}

const item = (p: Partial<MagicItem> = {}): MagicItem => ({
  id: 'ring',
  name: 'Ring of Protection',
  requiresAttunement: true,
  attuned: false,
  identified: false,
  charges: null,
  maxCharges: null,
  regain: 'all',
  regainAt: 'never',
  awaySince: null,
  notes: '',
  ...p,
});

describe('dice expressions and slot tables', () => {
  it('rolls simple expressions', () => {
    expect(rollExpr('1d6+1', HIGH.rng)).toBe(7);
    expect(rollExpr('2d4', LOW.rng)).toBe(2);
    expect(rollExpr('3', LOW.rng)).toBe(3);
    expect(rollExpr('banana', LOW.rng)).toBeNull();
  });
  it('gives full, half and pact casters the right slots', () => {
    expect(spellSlotsFor('Wizard', 5).map((r) => r.count)).toEqual([4, 3, 2]);
    expect(spellSlotsFor('Paladin', 5).map((r) => r.count)).toEqual([4, 2]);
    expect(spellSlotsFor('Paladin', 1).map((r) => r.count)).toEqual([2]);
    expect(spellSlotsFor('Warlock', 5)).toEqual([{ spellLevel: 3, count: 2, recharge: 'short' }]);
    expect(spellSlotsFor('Cleric', 20).map((r) => r.count)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
  });
});

describe('attunement and identifying', () => {
  it('attunes during a Short Rest, up to 3 items', () => {
    const s = fresh((d) => {
      d.characters[0].items = [item(), item({ id: 'a' , attuned: true }), item({ id: 'b', attuned: true }), item({ id: 'c', attuned: true })];
      d.characters[0].restFocus = { itemId: 'ring', action: 'attune' };
    });
    expect(E.shortRest(s, ctx()).characters[0].items[0].attuned).toBe(false);
    s.characters[0].items = s.characters[0].items.slice(0, 2);
    const n = E.shortRest(s, ctx());
    expect(n.characters[0].items[0]).toMatchObject({ attuned: true, identified: true });
    expect(n.characters[0].restFocus).toBeNull();
  });

  it('identifies by a rest or the Identify spell', () => {
    const s = fresh((d) => {
      d.characters[0].items = [item()];
      d.characters[0].restFocus = { itemId: 'ring', action: 'identify' };
    });
    expect(E.shortRest(s, ctx()).characters[0].items[0].identified).toBe(true);
    const spell = E.identifyBySpell(s, ctx(), s.characters[0].id, 'ring', null, true);
    expect(spell.characters[0].items[0].identified).toBe(true);
    expect(spell.minutes).toBe(s.minutes + 11);
  });

  it('ends attunement after 24 hours more than 100 feet away', () => {
    const s = fresh((d) => void (d.characters[0].items = [item({ attuned: true, identified: true })]));
    const left = E.leaveItem(s, ctx(), s.characters[0].id, 'ring', true);
    expect(E.advance(left, ctx(), 23 * 60).characters[0].items[0].attuned).toBe(true);
    expect(E.advance(left, ctx(), 24 * 60).characters[0].items[0].attuned).toBe(false);
  });
});

describe('charges, resources, HP and Hit Point Dice', () => {
  it('regains item charges at dawn', () => {
    const s = fresh((d) => {
      d.minutes = 3 * 60;
      d.characters[0].items = [item({ requiresAttunement: false, charges: 1, maxCharges: 7, regain: '1d6+1', regainAt: 'dawn' })];
    });
    expect(E.advance(s, HIGH, 60).characters[0].items[0].charges).toBe(1);
    expect(E.advance(s, HIGH, 4 * 60).characters[0].items[0].charges).toBe(7);
  });

  it('refills resources by their recharge type', () => {
    const s = fresh((d) => {
      d.characters[0].resources = [
        { id: 'r1', name: 'Action Surge', max: 1, current: 0, recharge: 'short' },
        { id: 'r2', name: 'Second Wind', max: 3, current: 0, recharge: 'shortOne' },
        { id: 'r3', name: 'Spell slots', max: 4, current: 0, recharge: 'long' },
      ];
    });
    const short = E.shortRest(s, ctx());
    expect(short.characters[0].resources.map((r) => r.current)).toEqual([1, 1, 0]);
    const long = E.longRest(s, ctx(), false);
    expect(long.characters[0].resources.map((r) => r.current)).toEqual([1, 3, 4]);
  });

  it('spends Hit Point Dice and restores everything on a Long Rest', () => {
    const s = fresh((d) => {
      const c = d.characters[0];
      Object.assign(c, { level: 3, hitDie: 10, conScore: 14, maxHp: 30, hp: 10 });
    });
    const healed = E.spendHitDie(s, HIGH, s.characters[0].id);
    expect(healed.characters[0]).toMatchObject({ hp: 22, hitDiceSpent: 1 });
    const rested = E.longRest(healed, ctx(), false);
    expect(rested.characters[0]).toMatchObject({ hp: 30, hitDiceSpent: 0 });
    const down = E.changeHp(healed, ctx(), s.characters[0].id, -50);
    expect(down.characters[0].hp).toBe(0);
    expect(E.longRest(down, ctx(), false).characters[0].hp).toBe(0);
  });
});

describe('night watch', () => {
  it('rotates watchers and rolls encounter checks', () => {
    const s = fresh((d) => {
      d.characters.push(newCharacter({ name: 'B', needsFood: false, needsWater: false }));
      d.watchOrder = d.characters.map((c) => c.id);
      d.settings.encounterOn = 20;
    });
    const quiet = E.longRest(s, LOW, false);
    expect(quiet.log.find((l) => l.text.startsWith('Night watches'))?.text).toContain('watch 4: B');
    expect(quiet.log.some((l) => l.text.startsWith('Random encounter'))).toBe(false);
    const busy = E.longRest(s, HIGH, false);
    expect(busy.log.filter((l) => l.text.startsWith('Random encounter'))).toHaveLength(4);
  });
});

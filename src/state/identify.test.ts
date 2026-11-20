import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { MagicItem, State } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const LOW = ctx(0);
const HIGH = ctx(0.999);

const ring = (): MagicItem => ({
  id: 'r',
  name: 'Ring of Protection',
  partyName: 'silver ring',
  rarity: 'rare',
  school: 'Abjuration',
  requiresAttunement: true,
  attuned: false,
  identified: false,
  charges: null,
  maxCharges: null,
  regain: 'all',
  regainAt: 'never',
  awaySince: null,
  notes: '',
  clues: [
    { id: 'a', kind: 'property', text: '+1 to AC', known: false },
    { id: 'b', kind: 'property', text: '+1 to saving throws', known: false },
    { id: 'c', kind: 'curse', text: 'whispers to the wearer at night', known: false },
  ],
  findings: [],
});

function fresh(): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'Sage', needsFood: false, needsWater: false, items: [ring()] })];
  s.minutes = 10 * 60;
  s.log = [];
  return s;
}
const item = (s: State) => s.characters[0].items[0];

describe('learning what an item does', () => {
  it('Detect Magic reveals that it is magical and its school', () => {
    const s = fresh();
    const n = E.studyItem(s, ctx(), s.characters[0].id, 'r', 'detect', s.characters[0].id, 0);
    expect(item(n).magicKnown).toBe(true);
    expect(n.log[0].text).toContain('aura of Abjuration');
    expect(item(n).findings![0].method).toBe('detect');
  });

  it('Arcana checks reveal one fact at a time against a DC by rarity, never the curse', () => {
    let s = fresh();
    const id = s.characters[0].id;
    expect(item(E.studyItem(s, LOW, id, 'r', 'arcana', id, 5)).clues!.every((c) => !c.known)).toBe(true); // 1 + 5 < 20
    s = E.studyItem(s, HIGH, id, 'r', 'arcana', id, 5);
    expect(item(s).clues!.map((c) => c.known)).toEqual([true, false, false]);
    s = E.studyItem(s, HIGH, id, 'r', 'experiment', id, 0);
    expect(item(s).clues!.map((c) => c.known)).toEqual([true, true, false]);
    expect(item(s).identified).toBe(true); // everything but the curse is known
  });

  it('Identify reveals everything except curses, and attuning reveals the curse', () => {
    const s = fresh();
    const id = s.characters[0].id;
    const ided = E.identifyBySpell(s, ctx(), id, 'r', null, false);
    expect(item(ided).clues!.map((c) => c.known)).toEqual([true, true, false]);
    expect(item(ided).identified).toBe(true);
    ided.characters[0].restFocus = { itemId: 'r', action: 'attune' };
    const attuned = E.shortRest(ided, ctx());
    expect(item(attuned).clues![2].known).toBe(true);
    expect(attuned.log.some((l) => l.text.includes('a curse makes itself known'))).toBe(true);
  });
});

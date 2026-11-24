import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { recruitDC, sessionTrust } from '../rules/recruiting';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
function party(): State {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.settings.encounters = false;
  s.characters = [newCharacter({ name: 'Bard', level: 3, gp: 50, needsFood: false, needsWater: false }), newCharacter({ name: 'Fighter', level: 3, needsFood: false, needsWater: false })];
  s.log = [];
  return s;
}
const scout = (s: State, extra = {}) => ({ name: 'Wren', creature: 'Scout', cr: '1/2', size: 'Medium' as const, int: 11, baseHp: 16, conScore: 12, passivePerception: 15, darkvision: 0, speaks: true, attitude: 'indifferent' as const, cls: 'expert' as const, role: null, recruiterId: s.characters[0].id, ...extra });
const noAid = { giftGp: 0, sharedDanger: false };

describe('winning someone over', () => {
  it('uses the 2024 Influence DCs and trust by margin', () => {
    expect(recruitDC('indifferent', 11)).toBe(15);
    expect(recruitDC('indifferent', 17)).toBe(17);
    expect(recruitDC('friendly', 11)).toBe(10);
    expect(sessionTrust(20, 15)).toEqual({ gain: 2, bad: false });
    expect(sessionTrust(9, 15)).toEqual({ gain: 0, bad: true });
  });

  it('days of good company win them over, and they join as a sidekick', () => {
    let s = party();
    s = E.startRecruit(s, ctx(), scout(s));
    const id = s.recruits![0].id;
    s = E.recruitSession(s, ctx(0.99), id, s.characters[0].id, 5, noAid); // 25 vs 15: +2
    expect(s.recruits![0].trust).toBe(2);
    s = E.recruitSession(s, ctx(0.99), id, s.characters[0].id, 5, noAid); // same day: refused
    expect(s.recruits![0].trust).toBe(2);
    s = E.advance(s, ctx(), 24 * 60);
    s = E.recruitSession(s, ctx(0.99), id, s.characters[0].id, 5, noAid);
    expect(s.recruits![0]).toMatchObject({ willing: true, attitude: 'friendly' });
    s = E.recruitJoin(s, ctx(0.5), id, 0, 'party');
    expect(s.recruits).toHaveLength(0);
    const k = s.characters.find((c) => c.sidekick)!;
    expect(k).toMatchObject({ name: 'Wren', level: 3 });
    expect(k.sidekick?.cls).toBe('expert');
  });

  it('a gift costs gold and gives Advantage; three bad days send the party away', () => {
    let s = party();
    s = E.startRecruit(s, ctx(), scout(s));
    const id = s.recruits![0].id;
    s = E.recruitSession(s, ctx(0.5), id, s.characters[0].id, 0, { giftGp: 10, sharedDanger: false });
    expect(s.characters[0].gp).toBe(40);
    for (let i = 0; i < 3; i++) {
      s = E.advance(s, ctx(), 24 * 60);
      s = E.recruitSession(s, ctx(0.01), id, s.characters[0].id, 0, noAid);
    }
    expect(s.recruits ?? []).toHaveLength(0);
  });

  it('a friendly contact can be asked straight away, and helping is worth trust', () => {
    let s = party();
    s.contacts = [{ id: 'k', name: 'Old Bren', role: 'Innkeeper', place: 'Here', distanceMiles: 0, bond: 2, knownBy: [], lastHeardDay: 0, owesParty: 0, partyOwes: 0, notes: '' }];
    s = E.startRecruit(s, ctx(), scout(s, { name: 'Old Bren', contactId: 'k' }));
    expect(s.recruits![0].willing).toBe(true);
    let t = party();
    t = E.startRecruit(t, ctx(), scout(t, { attitude: 'hostile' }));
    t = E.recruitHelped(t, ctx(), t.recruits![0].id, 'pulling them out of the river');
    expect(t.recruits![0]).toMatchObject({ attitude: 'indifferent', trust: 2 });
  });

  it('won’t court anyone above CR 1/2', () => {
    let s = party();
    s = E.startRecruit(s, ctx(), scout(s, { cr: '2' }));
    expect(s.recruits ?? []).toHaveLength(0);
  });
});

import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';
import { sidekickLevelFor, sidekickResources } from '../rules/sidekicks';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
function party(levels: number[]): State {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.settings.encounters = false;
  s.characters = levels.map((level, i) => newCharacter({ name: `PC${i}`, level, gp: 100, needsFood: false, needsWater: false }));
  s.log = [];
  return s;
}
const guard = { name: 'Tamsin', creature: 'Guard', cr: '1/8', size: 'Medium' as const, baseHp: 11, conScore: 12, passivePerception: 12, darkvision: 0, speaks: true, cls: 'warrior' as const, role: 'attacker' as const, wageGp: 2, payerId: 'party' };

describe('sidekicks (Tasha’s)', () => {
  it('levels from the party average and the class tables', () => {
    expect(sidekickLevelFor([3, 4, 6])).toBe(4);
    expect(sidekickResources('warrior', 11).map((r) => r.name)).toEqual(['Second Wind', 'Indomitable']);
    expect(sidekickResources('spellcaster', 9).map((r) => r.max)).toEqual([4, 3, 2]);
  });

  it('a hired Warrior joins at the party’s average level with rolled HP and features', () => {
    let s = party([5, 5, 6]);
    s = E.hireSidekick(s, ctx(0.5), guard); // d8 rolls 5, +1 Con each level
    const k = s.characters.find((c) => c.sidekick)!;
    expect(k.level).toBe(5);
    expect(k.maxHp).toBe(11 + 5 * 6);
    expect(k.features.some((f) => f.startsWith('Improved Critical'))).toBe(true);
    expect(k.resources.find((r) => r.name === 'Second Wind')?.max).toBe(1);
  });

  it('gains a level when the party’s average rises', () => {
    let s = party([2, 2]);
    s = E.hireSidekick(s, ctx(0.5), guard);
    s.characters.filter((c) => !c.sidekick).forEach((c) => (c.level = 3));
    s = E.advance(s, ctx(0.5), 10);
    const k = s.characters.find((c) => c.sidekick)!;
    expect(k.level).toBe(3);
    expect(k.features.some((f) => f.startsWith('Improved Critical (level 3)'))).toBe(true);
  });

  it('is paid daily into their own purse by the party, not by themselves', () => {
    let s = party([1, 1]);
    s = E.hireSidekick(s, ctx(), guard);
    s = E.advance(s, ctx(), 24 * 60);
    const k = s.characters.find((c) => c.sidekick)!;
    expect(k.gp).toBe(2);
    expect(s.characters.filter((c) => !c.sidekick).reduce((a, c) => a + c.gp, 0)).toBeLessThanOrEqual(198);
  });

  it('won’t take a creature above CR 1/2, or a mute Expert', () => {
    let s = party([1]);
    s = E.hireSidekick(s, ctx(), { ...guard, cr: '1' });
    expect(s.characters.some((c) => c.sidekick)).toBe(false);
    s = E.hireSidekick(s, ctx(), { ...guard, cls: 'expert', role: null, speaks: false });
    expect(s.characters.some((c) => c.sidekick)).toBe(false);
  });

  it('an animal can’t be hired or talked round, only tamed', () => {
    let s = party([2]);
    s = E.hireSidekick(s, ctx(), { ...guard, name: 'Rex', creature: 'Mastiff', type: 'beast', cls: 'warrior', role: 'attacker' });
    expect(s.characters.some((c) => c.sidekick)).toBe(false);
    s = E.hireSidekick(s, ctx(), { ...guard, speaks: false });
    expect(s.characters.some((c) => c.sidekick)).toBe(false);
    s = E.startRecruit(s, ctx(), { name: 'Rex', creature: 'Mastiff', cr: '1/8', size: 'Medium', type: 'beast', int: 3, baseHp: 5, conScore: 12, passivePerception: 13, darkvision: 0, speaks: false, attitude: 'indifferent', recruiterId: s.characters[0].id });
    expect(s.recruits ?? []).toHaveLength(0);
  });

  it('a tamed companion can become a sidekick', () => {
    let s = party([4]);
    s.characters.push(newCharacter({ kind: 'mount', name: 'Fang', species: 'Wolf', size: 'Medium', conScore: 12, hp: 11, maxHp: 11 }));
    s = E.makeSidekick(s, ctx(), s.characters[1].id, 'warrior', 'defender', '1/4', false);
    expect(s.characters[1]).toMatchObject({ level: 4 });
    expect(s.characters[1].sidekick?.cls).toBe('warrior');
  });
});

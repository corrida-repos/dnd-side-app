import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { Project, State } from './types';
import { GAME_ANIMALS, parse5eToolsBestiary } from '../rules/hunting';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const LOW = ctx(0);
const HIGH = ctx(0.999);
const animal = (n: string) => GAME_ANIMALS.find((a) => a.name === n)!;

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'A', gp: 100, survival: 0, needsFood: false, needsWater: false })];
  s.stores = { foodLb: 0, waterGal: 0, foodRawLb: 0, waterUnsafeGal: 0 };
  s.log = [];
  patch(s);
  return s;
}

describe('hunting and butchering', () => {
  it('turns a kill into raw meat by size and keeps the hide', () => {
    const s = fresh();
    const n = E.butcher(s, ctx(), { creature: animal('Deer'), count: 2, butcherId: null });
    expect(n.stores.foodRawLb).toBe(100);
    expect(n.minutes).toBe(s.minutes + 120);
    expect(n.materials).toMatchObject([{ name: 'Hide (Deer)', qty: 2 }]);
    expect(E.butcher(s, ctx(), { creature: animal('Rabbit or hare'), count: 3, butcherId: null }).materials).toHaveLength(0);
  });

  it('wastes half the meat on a failed Survival check', () => {
    const s = fresh();
    const id = s.characters[0].id;
    expect(E.butcher(s, LOW, { creature: animal('Elk'), count: 1, butcherId: id }).stores.foodRawLb).toBe(100);
    expect(E.butcher(s, HIGH, { creature: animal('Elk'), count: 1, butcherId: id }).stores.foodRawLb).toBe(200);
  });

  it('gets nothing from inedible creatures', () => {
    const s = fresh();
    const n = E.butcher(s, ctx(), { creature: { name: 'Zombie', size: 'Medium', type: 'undead' }, count: 1, butcherId: null });
    expect(n.stores.foodRawLb).toBe(0);
    expect(n.minutes).toBe(s.minutes);
  });

  it('reads 5etools bestiary JSON', () => {
    const out = parse5eToolsBestiary({
      monster: [
        { name: 'Owlbear', size: ['L'], type: 'monstrosity', source: 'XMM', trait: [{ entries: ['long text'] }] },
        { name: 'Wolf', size: ['M'], type: { type: 'beast' }, source: 'XMM' },
        { name: 'Bad' },
      ],
    });
    expect(out).toEqual([
      { name: 'Owlbear', size: 'Large', type: 'monstrosity', source: 'XMM' },
      { name: 'Wolf', size: 'Medium', type: 'beast', source: 'XMM' },
    ]);
  });
});

describe('crafting materials', () => {
  it('takes materials from the stash and pays only the rest in gold', () => {
    const s = fresh((d) => {
      d.materials = [{ id: 'iron', name: 'Iron', qty: 10, unit: 'ingot', valueGp: 5 }];
    });
    const p: Project = {
      id: 'p',
      name: 'Chain Mail',
      kind: 'nonmagical',
      charIds: [s.characters[0].id],
      daysRequired: 8,
      daysDone: 0,
      costGp: 37.5,
      notes: '',
      done: false,
      materialsUsed: [{ materialId: 'iron', name: 'Iron', qty: 6, valueGp: 5 }],
    };
    const n = E.startProject(s, ctx(), p);
    expect(n.materials[0].qty).toBe(4);
    expect(n.characters[0].gp).toBe(92.5);
    const all = E.startProject(s, ctx(), { ...p, materialsUsed: [{ materialId: 'iron', name: 'Iron', qty: 10, valueGp: 5 }] });
    expect(all.materials).toHaveLength(0);
    expect(all.characters[0].gp).toBe(100);
  });
});

describe('renown, fear and stress', () => {
  it('tracks the values and lets a Long Rest ease fear and stress', () => {
    let s = fresh();
    const id = s.characters[0].id;
    s = E.adjustTrack(s, ctx(), id, 'stress', 3, 'ambush');
    s = E.adjustTrack(s, ctx(), id, 'fear', 2, 'the lich');
    s = E.adjustTrack(s, ctx(), id, 'renown', -1, '');
    expect(s.characters[0]).toMatchObject({ stress: 3, fear: 2, renown: -1 });
    expect(E.adjustTrack(s, ctx(), id, 'stress', -10, '').characters[0].stress).toBe(0);
    const rested = E.longRest(s, ctx(), false);
    expect(rested.characters[0]).toMatchObject({ stress: 2, fear: 1, renown: -1 });
  });
});

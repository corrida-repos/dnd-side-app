import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { Facility, State } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function keep(level = 9): State {
  let s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'Lord', gp: 5000, level, needsFood: false, needsWater: false })];
  s.log = [];
  s = E.foundBastion(s, ctx(), s.characters[0].id, 'Keep');
  return s;
}
const fac = (name: string, extra: Partial<Facility> = {}): Facility => ({ id: name, name, kind: 'special', size: 'roomy', order: 'Craft', orderNote: '', building: null, built: true, ...extra });
function turn(s: State, rng = 0.5): State {
  s.bastions[0].lastTurnDay = s.dayIndex - 7;
  return E.resolveBastionTurn(s, ctx(rng), s.bastions[0].id);
}
const stash = (s: State) => s.stashes.find((x) => x.id === `bastion-${s.bastions[0].id}`)?.items ?? [];

describe('Bastion orders', () => {
  it('a Barrack recruits four defenders on the following turn', () => {
    let s = keep();
    s.bastions[0].facilities.push(fac('Barrack', { order: 'Recruit', plan: { option: 'recruit' } }));
    s = turn(s);
    expect(s.bastions[0].facilities.find((f) => f.name === 'Barrack')!.work?.daysLeft).toBe(7);
    s = turn(s);
    expect(E.bastionDefenders(s.bastions[0])).toBe(4);
  });

  it('a Smithy crafts gear by PHB rules with its two hirelings sharing the work', () => {
    let s = keep();
    s.bastions[0].facilities.push(fac('Smithy', { plan: { option: 'gear', text: 'Longsword', gp: 15 } }));
    s = turn(s);
    expect(s.characters[0].gp).toBe(5000 - 7);
    s = turn(s);
    expect(stash(s).some((i) => i.name === 'Longsword')).toBe(true);
  });

  it('a Garden harvests its chosen product, and a Gaming Hall pays out', () => {
    let s = keep();
    s.bastions[0].facilities.push(fac('Garden', { order: 'Harvest', plan: { option: 'harvest' }, gardens: [{ type: 'Herb', product: 'potion' }] }));
    s.bastions[0].facilities.push(fac('Gaming Hall', { size: 'vast', order: 'Trade', plan: { option: 'gamble' } }));
    s = turn(s);
    const gp = s.characters[0].gp;
    s = turn(s, 0.1);
    expect(stash(s).find((i) => i.name === 'Potion of Healing')?.qty).toBe(1);
    expect(s.characters[0].gp).toBeGreaterThan(gp);
  });

  it('magic item crafting needs level 9', () => {
    let s = keep(5);
    s.bastions[0].facilities.push(fac('Arcane Study', { plan: { option: 'magic', text: 'Wand of Magic Detection', rarity: 'Uncommon' } }));
    s = turn(s);
    expect(s.bastions[0].facilities.find((f) => f.name === 'Arcane Study')!.work).toBeFalsy();
  });
});

describe('Bastion events', () => {
  it('an attack kills a defender for each 1 on 6d6', () => {
    let s = keep();
    s.bastions[0].defenders = 5;
    s.bastions[0].maintain = true;
    // d100 roll from rng 0.52 → 53 (Attack); then six d6 at the same rng → 4s, no losses
    s = turn(s, 0.52);
    expect(s.bastions[0].lastEvent).toMatch(/Attack/);
    expect(E.bastionDefenders(s.bastions[0])).toBe(5);
  });

  it('a criminal hireling asks for a bribe, and paying it costs gold', () => {
    let s = keep();
    s.bastions[0].maintain = true;
    s = turn(s, 0.565);
    expect(s.bastions[0].decision?.kind).toBe('bribe');
    const gp = s.characters[0].gp;
    s = E.resolveBastionDecision(s, ctx(), s.bastions[0].id, true);
    expect(s.characters[0].gp).toBeLessThan(gp);
    expect(s.bastions[0].decision).toBeNull();
  });

  it('treasure lands in the Bastion stores', () => {
    let s = keep();
    s.bastions[0].maintain = true;
    s = turn(s, 0.995);
    expect(stash(s).length).toBe(1);
  });

  it('a Long Rest at the Bastion grants facility Charms', () => {
    let s = keep();
    s.bastions[0].facilities.push(fac('Sanctuary'));
    s.minutes = 22 * 60;
    s = E.longRest(s, ctx(), true);
    expect(s.characters[0].resources.some((r) => r.name === 'Sanctuary Charm')).toBe(true);
  });
});

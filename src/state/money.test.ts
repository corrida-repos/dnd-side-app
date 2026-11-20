import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { Project, State } from './types';
import { MOUNT_PRESETS, fmtGp } from '../rules/money';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'none', precip: 'none' };
  s.settings.sleepDeprivation = false;
  s.characters = [newCharacter({ name: 'A', gp: 10, lifestyle: 'modest' }), newCharacter({ name: 'B', gp: 10, lifestyle: 'poor' })];
  s.minutes = 23 * 60;
  s.log = [];
  patch(s);
  return s;
}

const project = (p: Partial<Project>): Project => ({ id: 'p', name: 'Job', kind: 'activity', charIds: [], daysRequired: 1, daysDone: 0, costGp: 0, notes: '', done: false, ...p });

describe('gold, lifestyle and wages', () => {
  it('formats small amounts in silver and copper', () => {
    expect([fmtGp(2), fmtGp(0.2), fmtGp(0.05), fmtGp(-1.5)]).toEqual(['2 GP', '2 SP', '5 CP', '−1.5 GP']);
  });

  it('charges lifestyle in town and feeds everyone', () => {
    const s = fresh((d) => void (d.place.settlement = true));
    const n = E.advance(s, ctx(), 60);
    expect(n.characters.map((c) => c.gp)).toEqual([9, 9.8]);
    expect(n.characters.every((c) => c.exhaustion === 0)).toBe(true);
    const wild = E.advance(fresh(), ctx(), 60);
    expect(wild.characters.map((c) => c.gp)).toEqual([10, 10]);
    expect(wild.characters[0].exhaustion).toBe(1); // dehydration out in the wild
  });

  it('pays hireling wages, split across the party or by one payer', () => {
    const s = fresh((d) => {
      d.place.settlement = false;
      d.characters.forEach((c) => ((c.needsFood = false), (c.needsWater = false)));
      d.hirelings = [
        { id: 'h1', name: 'Guide', skilled: true, wageGp: 2, payer: 'party', active: true },
        { id: 'h2', name: 'Porter', skilled: false, wageGp: 0.2, payer: d.characters[1].id, active: true },
        { id: 'h3', name: 'Off duty', skilled: true, wageGp: 2, payer: 'party', active: false },
      ];
    });
    expect(E.advance(s, ctx(), 60).characters.map((c) => c.gp)).toEqual([9, 8.8]);
  });

  it('charges materials on start, and settles magic item deals on completion', () => {
    const s = fresh((d) => (d.minutes = 8 * 60));
    const a = s.characters[0].id;
    const craft = E.startProject(s, ctx(), project({ kind: 'nonmagical', charIds: [a], costGp: 7.5 }));
    expect(craft.characters[0].gp).toBe(2.5);
    const sell = E.startProject(s, ctx(), project({ kind: 'sellMagic', charIds: [a], dealGp: 200, rarity: 'uncommon' }));
    expect(sell.characters[0].gp).toBe(10);
    expect(E.workOnProjects(sell, ctx(), ['p']).characters[0].gp).toBe(210);
    s.settings.chargeCosts = false;
    expect(E.startProject(s, ctx(), project({ kind: 'nonmagical', charIds: [a], costGp: 7.5 })).characters[0].gp).toBe(10);
  });

  it('copies a spell into the spellbook when the project finishes', () => {
    const s = fresh((d) => {
      d.minutes = 8 * 60;
      d.characters[0].className = 'Wizard';
    });
    const n = E.workOnProjects(
      E.startProject(s, ctx(), project({ kind: 'spellcopy', charIds: [s.characters[0].id], costGp: 150, spell: { name: 'Fireball', level: 3 } })),
      ctx(),
      ['p'],
    );
    expect(n.characters[0].spells.map((x) => x.name)).toEqual(['Fireball']);
  });
});

describe('mounts', () => {
  it('joins the party, gets charged for, eats feed and suffers without water', () => {
    const s = fresh((d) => {
      d.minutes = 8 * 60;
      d.place.waterSource = false;
      d.stores = { foodLb: 0, waterGal: 0, foodRawLb: 0, waterUnsafeGal: 0 };
    });
    const horse = MOUNT_PRESETS.find((m) => m.name === 'Riding Horse')!;
    const n = E.addMount(s, ctx(), horse, 'Clover', s.characters[0].id);
    const m = n.characters[2];
    expect(m).toMatchObject({ kind: 'mount', name: 'Clover', size: 'Large' });
    expect(n.characters[0].gp).toBe(10 - 75);
    const fed = E.buyFeed(n, ctx(), 2);
    expect(fed.characters[2].rationsLb).toBe(8);
    const ate = E.partyEat(fed, ctx(), 'day');
    expect(ate.characters[2].ateLbToday).toBe(4);
    expect(ate.characters[2].rationsLb).toBe(4);
  });
});

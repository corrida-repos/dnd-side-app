import { describe, expect, it } from 'vitest';
import { BRELAND } from '../rules/eberron';
import { newCharacter, createDefaultState, createEberronState } from './defaults';
import * as E from './engine';
import type { State } from './types';

const ctx = { rng: () => 0.8 };

describe('Breland campaign', () => {
  it('starts in Sharn on 1 Zarantyr with saved ward providers', () => {
    const s = createEberronState(ctx.rng);
    expect(createDefaultState(ctx.rng).setting).toBeUndefined();
    expect(E.stamp(s)).toContain('1 Zarantyr, 998 YK');
    expect(E.brelishLocality(s)).toBe('middle-menthis');
    expect(E.currentTown(s)?.buildings.some((b) => b.name === 'Ghallanda guesthouse')).toBe(true);
    expect(s.characters).toHaveLength(0);
  });

  it('uses the same party clock and preserves the ward directory after travel and save reload', () => {
    let s = createEberronState(ctx.rng);
    s.characters.push(newCharacter({ name: 'Sal', gp: 100 }));
    const inn = E.currentTown(s)?.buildings.find((b) => b.type === 'inn');
    s = E.bookBrelishRoute(s, ctx, 'menthis-terminus');
    expect(s.passage?.departure).toBe(8 * 60);
    expect(s.characters[0].gp).toBe(99.7);
    s = E.rideBrelishRoute(JSON.parse(JSON.stringify(s)) as State, ctx);
    expect(s.place.name).toBe(BRELAND.terminus.name);
    expect(s.minutes).toBe(8 * 60 + 30);
    expect(s.travel.hoursToday).toBe(0);
    expect(s.passage).toBeUndefined();
    s = E.bookBrelishRoute(s, ctx, 'sharn-wroat');
    s = E.rideBrelishRoute(s, ctx);
    expect(s.place.name).toBe('Wroat');
    expect(E.absNow(s)).toBe(1440);
    expect(s.characters[0].gp).toBe(79.7);
    expect(s.towns?.find((town) => town.name === BRELAND['middle-menthis'].name)?.buildings.find((b) => b.type === 'inn')).toEqual(inn);
  });

  it('dispatches a Sivis message only when the local station is open', () => {
    let s = createEberronState(ctx.rng);
    s.characters.push(newCharacter({ name: 'Sal', gp: 10 }));
    const order = { charId: s.characters[0].id, contactId: null, correspondent: 'Fin', method: 'sivis' as const, miles: 0, text: 'On the way.', expectsReply: true };
    s.minutes = 0;
    expect(E.sendLetter(s, ctx, order).characters[0].gp).toBe(10);
    s.minutes = 12 * 60;
    s = E.sendLetter(s, ctx, order);
    expect(s.characters[0].gp).toBe(8);
    expect(s.letters?.[0].pickupTown).toBe(BRELAND['middle-menthis'].name);
  });
});

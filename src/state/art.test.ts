import { describe, expect, it } from 'vitest';
import { PAINT } from '../rules/crafting';
import { createDefaultState, newCharacter } from './defaults';
import * as E from './engine';

const ctx: E.Ctx = { rng: () => 0.5 };
const tool = (name: string) => ({ id: name, name, qty: 1, weight: 1, source: 'book' as const });

function party() {
  const s = createDefaultState(ctx.rng);
  Object.assign(s.settings, { campArt: true, encounters: false, sleepDeprivation: false, navigation: false });
  s.place.settlement = false;
  s.characters = [
    newCharacter({ id: 'artist', name: 'Artist', gp: 10, toolProfs: [PAINT, 'Lute'], feats: ['Musician'], inventory: [tool(PAINT), tool('Lute')] }),
    newCharacter({ id: 'ally', name: 'Ally' }),
  ];
  return s;
}

describe('art projects', () => {
  it('requires proficiency and supplies for a saleable project and sells the finished object only in a settlement', () => {
    let s = party();
    const start = (id: string) => E.startArt(s, ctx, id, 'painting', 'The Beacon', 'Our rescue', PAINT, true);
    expect(start('ally').artProjects).toHaveLength(0);
    s = start('artist');
    expect(s.characters[0].gp).toBe(8);
    expect(s.artProjects[0].requiredHours).toBe(8);
    const id = s.artProjects[0].id;
    for (let i = 0; i < 8; i++) s = E.workOnArt(s, ctx, id);
    const item = s.characters[0].inventory.find((i) => i.artKind === 'painting')!;
    expect(item).toMatchObject({ name: 'The Beacon', valueGp: 5, qty: 1 });
    expect(E.sellItem(s, ctx, 'artist', item.id, 1).characters[0].gp).toBe(8);
    s.place.settlement = true;
    s = E.sellItem(s, ctx, 'artist', item.id, 1);
    expect(s.characters[0].gp).toBe(13);
    expect(s.characters[0].inventory.find((i) => i.id === item.id)).toBeUndefined();
  });

  it('advances a casual song on a travel leg only when its artist is free and tracks one morale die', () => {
    let s = E.startArt(party(), ctx, 'artist', 'song', 'Home Again', 'Our journey', 'Lute', false);
    const id = s.artProjects[0].id;
    const leg: E.TravelOpts = { hours: 1, pace: 'normal', difficult: false, foragerIds: [], artProjectId: id };
    expect(E.travel(s, ctx, { ...leg, foragerIds: ['artist'] }).artProjects[0].hours).toBe(0);
    s = E.travel(s, ctx, leg);
    expect(s.artProjects[0].hours).toBe(1);
    s = E.shareArt(s, ctx, id, 'ally');
    const effect = s.effects.find((e) => e.artMorale)!;
    expect(effect.targetIds).toEqual(['ally']);
    s = E.useArtMorale(s, ctx, effect.id);
    expect(s.effects.some((e) => e.artMorale)).toBe(false);
    expect(E.shareArt(s, ctx, id, 'ally').effects.some((e) => e.artMorale)).toBe(false);
  });

  it('offers Encouraging Song only immediately after a completed rest and only once per musician', () => {
    let s = party();
    const play = (state: typeof s, instrument = 'Lute') => E.encouragingSong(state, ctx, 'artist', instrument, ['ally']);
    expect(play(s).characters[1].resources).toHaveLength(0);
    s = E.shortRest(s, ctx);
    expect(play(s, 'Flute').characters[1].resources).toHaveLength(0);
    expect(play(E.advance(s, ctx, 1)).characters[1].resources).toHaveLength(0);
    s = play(s);
    expect(s.characters[1].resources).toContainEqual(expect.objectContaining({ name: 'Heroic Inspiration', current: 1 }));
    expect(play(s).musicianRest?.performed).toEqual(['artist']);
  });
});

import { describe, expect, it } from 'vitest';
import { newCharacter } from '../state/defaults';
import type { CharacterSpell } from '../state/types';
import { SPELL_FACTS } from './shortcutSpells';
import { matchParty, maxSpellLevel, normalizeSpellName, rankWays, searchWays, TOPIC_BY_ID, TOPICS, wayKey, wayLabel, type Way } from './shortcuts';

const spellRef = (name: string, prepared: boolean, level = 1): CharacterSpell => ({ name, level, prepared, alwaysPrepared: false });
const way = (topic: keyof typeof TOPIC_BY_ID, name: string): Way => {
  const w = TOPIC_BY_ID[topic].ways.find((x) => x.name === name);
  if (!w) throw new Error(`${name} not in ${topic}`);
  return w;
};

describe('ways around catalog', () => {
  it('has unique topics, each with options and a problem statement', () => {
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TOPICS) {
      expect(t.ways.length, t.id).toBeGreaterThan(0);
      expect(t.problem.length, t.id).toBeGreaterThan(20);
      const names = t.ways.map((w) => wayKey(w));
      expect(new Set(names).size, `duplicate way in ${t.id}`).toBe(names.length);
    }
  });

  it('knows the level, lists and cost of every spell it mentions', () => {
    for (const t of TOPICS)
      for (const w of t.ways.filter((x) => x.kind === 'spell')) {
        const f = SPELL_FACTS[w.name];
        expect(f, w.name).toBeDefined();
        expect(w.level).toBe(f.level);
        expect(f.classes.length, w.name).toBeGreaterThan(0);
      }
  });

  it('records 2024 facts that differ from 2014', () => {
    expect(SPELL_FACTS['Rope Trick'].ritual).toBeFalsy();
    expect(SPELL_FACTS["Leomund's Tiny Hut"].ritual).toBe(true);
    expect(SPELL_FACTS['Lesser Restoration'].castTime).toBe('Bonus Action');
    expect(SPELL_FACTS['Revivify'].cost).toMatch(/300 GP/);
    expect(SPELL_FACTS['Phantom Steed'].ritual).toBe(true);
  });

  it('labels ways by kind', () => {
    expect(wayLabel(way('cold', "Leomund's Tiny Hut"))).toBe('Level 3 spell · ritual');
    expect(wayLabel(way('food', 'Self-Restoration'))).toBe('Monk 10');
    expect(wayLabel(way('attunement', 'Use Magic Device'))).toBe('Rogue (Thief) 13');
  });

  it('searches names, descriptions and edge cases', () => {
    expect(searchWays('goodberry').length).toBeGreaterThan(2);
    expect(searchWays('interrupts the rest').length).toBeGreaterThan(0);
    expect(searchWays('')).toEqual([]);
  });
});

describe('matching the party', () => {
  it('ignores a wizard’s name in spell names', () => {
    expect(normalizeSpellName("Leomund's Tiny Hut")).toBe(normalizeSpellName('Tiny Hut'));
    expect(normalizeSpellName('Tenser’s Floating Disk')).toBe('floating disk');
  });

  it('works out the highest spell level by class', () => {
    expect(maxSpellLevel('Cleric', 5)).toBe(3);
    expect(maxSpellLevel('Wizard', 20)).toBe(9);
    expect(maxSpellLevel('Paladin', 9)).toBe(3);
    expect(maxSpellLevel('Ranger', 1)).toBe(1);
    expect(maxSpellLevel('Warlock', 11)).toBe(6);
    expect(maxSpellLevel('Fighter', 20)).toBe(0);
  });

  it('tells prepared, ritual-from-book, known and on-the-list spells apart', () => {
    const wiz = newCharacter({ id: 'w', name: 'Wiz', className: 'Wizard', level: 5, spells: [spellRef('Tiny Hut', false, 3)] });
    const cleric = newCharacter({ id: 'c', name: 'Cleo', className: 'Cleric', level: 5, spells: [spellRef('Purify Food and Drink', true)] });
    const lowCleric = newCharacter({ id: 'l', name: 'Low', className: 'Cleric', level: 4, spells: [] });
    const bard = newCharacter({ id: 'b', name: 'Bard', className: 'Bard', level: 5, spells: [spellRef("Leomund's Tiny Hut", false, 3)] });
    expect(matchParty(way('cold', "Leomund's Tiny Hut"), [wiz, bard]).map((m) => m.status)).toEqual(['ritual', 'known']);
    expect(matchParty(way('tainted', 'Purify Food and Drink'), [cleric])[0].status).toBe('ready');
    const cfw = way('food', 'Create Food and Water');
    expect(matchParty(cfw, [cleric])[0].status).toBe('list');
    expect(matchParty(cfw, [lowCleric])).toEqual([]);
  });

  it('matches class features by level and subclass features as a maybe', () => {
    const monk9 = newCharacter({ id: 'm9', name: 'Nine', className: 'Monk', level: 9 });
    const monk10 = newCharacter({ id: 'm10', name: 'Ten', className: 'Monk', level: 10 });
    expect(matchParty(way('food', 'Self-Restoration'), [monk9, monk10]).map((m) => m.name)).toEqual(['Ten']);
    const rogue = newCharacter({ id: 'r', name: 'Rog', className: 'Rogue', level: 13 });
    expect(matchParty(way('attunement', 'Use Magic Device'), [rogue])[0].status).toBe('maybe');
    rogue.notes = 'Thief subclass, has Use Magic Device';
    expect(matchParty(way('attunement', 'Use Magic Device'), [rogue])[0].status).toBe('has');
  });

  it('finds species, feats and items in names and notes, and skips mounts', () => {
    const g = newCharacter({ id: 'g', name: 'Gol', notes: 'Goliath fighter' });
    expect(matchParty(way('carrying', 'Goliath (Powerful Build)'), [g])[0].status).toBe('has');
    const carrier = newCharacter({ id: 'h', name: 'Hob', inventory: [{ id: 'i1', name: 'Bag of Holding', qty: 1, weight: 5 } as never] });
    expect(matchParty(way('carrying', 'Bag of Holding'), [carrier])[0].status).toBe('has');
    const horse = newCharacter({ id: 'x', name: 'Horse', kind: 'mount', notes: 'Goliath' });
    expect(matchParty(way('carrying', 'Goliath (Powerful Build)'), [horse])).toEqual([]);
  });

  it('puts what the party can use now first', () => {
    const druid = newCharacter({ id: 'd', name: 'Dru', className: 'Druid', level: 3, spells: [spellRef('Goodberry', true)] });
    const rows = rankWays(TOPIC_BY_ID.food.ways, [druid]);
    expect(rows[0].way.name).toBe('Goodberry');
    expect(rows[0].matches[0].status).toBe('ready');
  });
});

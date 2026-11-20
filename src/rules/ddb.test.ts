import { describe, expect, it } from 'vitest';
import { ddbJsonUrl, parseDdbCharacter } from './ddb';
import * as E from '../state/engine';
import { createDefaultState } from '../state/defaults';

/** A trimmed character in D&D Beyond's v5 shape. */
const sample = {
  success: true,
  data: {
    id: 87654321,
    name: 'Vex',
    race: { fullName: 'Wood Elf', sizeId: 4 },
    stats: [1, 2, 3, 4, 5, 6].map((id) => ({ id, value: [10, 16, 14, 12, 14, 8][id - 1] })),
    bonusStats: [],
    overrideStats: [],
    classes: [{ level: 5, isStartingClass: true, hitDiceUsed: 1, definition: { name: 'Ranger', hitDice: 10 } }],
    baseHitPoints: 34,
    bonusHitPoints: 0,
    overrideHitPoints: null,
    removedHitPoints: 4,
    temporaryHitPoints: 3,
    modifiers: {
      race: [{ type: 'set-base', subType: 'darkvision', value: 60 }],
      class: [
        { type: 'proficiency', subType: 'survival' },
        { type: 'proficiency', subType: 'perception' },
        { type: 'proficiency', subType: 'strength-saving-throws' },
      ],
      item: [{ type: 'resistance', subType: 'cold' }],
    },
    inventory: [
      { id: 1, quantity: 1, containerEntityId: 87654321, definition: { name: 'Backpack', weight: 5, isContainer: true, cost: 2 } },
      { id: 2, quantity: 20, containerEntityId: 87654321, definition: { name: 'Arrows', weight: 1, bundleSize: 20, filterType: 'Ammunition', cost: 1 } },
      { id: 3, quantity: 1, containerEntityId: 1, definition: { name: 'Rope, Hempen (50 feet)', weight: 10 } },
      { id: 4, quantity: 1, containerEntityId: 87654321, isAttuned: true, limitedUse: { maxUses: 7, numberUsed: 2, resetType: 3, resetTypeDescription: 'regains 1d6+1 charges daily at dawn' }, definition: { name: 'Wand of Web', weight: 1, magic: true, canAttune: true, rarity: 'Uncommon' } },
    ],
    currencies: { cp: 12, sp: 30, ep: 0, gp: 45, pp: 1 },
    classSpells: [
      { spells: [{ prepared: true, definition: { name: 'Goodberry', level: 1, ritual: false, concentration: false, activation: { activationTime: 1, activationType: 1 }, duration: { durationInterval: 24, durationUnit: 'Hour', durationType: 'Time' } } }] },
      { spells: [{ prepared: false, definition: { name: 'Alarm', level: 1, ritual: true, activation: { activationTime: 1, activationType: 6 }, duration: { durationInterval: 8, durationUnit: 'Hour', durationType: 'Time' } } }] },
    ],
    spells: { race: [{ definition: { name: 'Druidcraft', level: 0, activation: { activationTime: 1, activationType: 1 }, duration: { durationType: 'Instantaneous' } } }] },
    spellSlots: [{ level: 1, used: 1, available: 4 }, { level: 2, used: 0, available: 2 }],
    pactMagic: [],
    actions: { class: [{ id: 'fe', name: "Favored Enemy", limitedUse: { maxUses: 3, numberUsed: 1, resetType: 2 } }] },
    conditions: [{ id: 4, level: 1 }],
    deathSaves: { failCount: 0, successCount: 0, isStabilized: false },
    feats: [{ definition: { name: 'Alert' } }],
  },
};

describe('D&D Beyond import', () => {
  it('reads stats, senses, HP and skills', () => {
    const r = parseDdbCharacter(sample);
    expect(r).toMatchObject({ ddbId: 87654321, name: 'Vex', className: 'Ranger', level: 5, size: 'Medium', maxHp: 44, hp: 40, tempHp: 3, hitDie: 10, hitDiceSpent: 1 });
    expect(r).toMatchObject({ conSave: 2, survival: 5, passivePerception: 15, darkvision: 60, coldResist: 'resistance', fireResist: 'none', exhaustion: 1 });
  });

  it('reads inventory with real weights, containers, coins, magic items and ammunition', () => {
    const r = parseDdbCharacter(sample);
    const rope = r.inventory.find((i) => i.name.startsWith('Rope'))!;
    expect(rope.containerId).toBe('ddb-1');
    expect(r.inventory.find((i) => i.name === 'Arrows')).toMatchObject({ qty: 20, weight: 0.05, ammo: { spent: 0 } });
    expect(r.purse).toEqual({ cp: 12, sp: 30, ep: 0, gp: 45, pp: 1 });
    expect(r.items[0]).toMatchObject({ name: 'Wand of Web', attuned: true, charges: 5, maxCharges: 7, regain: '1d6+1', regainAt: 'dawn', rarity: 'uncommon' });
  });

  it('reads spells with ritual, timing and duration, and slots and limited uses', () => {
    const r = parseDdbCharacter(sample);
    expect(r.spells.find((s) => s.name === 'Alarm')).toMatchObject({ ritual: true, castMinutes: 1, durationMinutes: 480, prepared: false });
    expect(r.spells.find((s) => s.name === 'Druidcraft')).toMatchObject({ alwaysPrepared: true, durationMinutes: null });
    expect(r.resources.map((x) => [x.name, x.current, x.max, x.recharge])).toEqual([
      ['Spell slots (level 1)', 3, 4, 'long'],
      ['Spell slots (level 2)', 2, 2, 'long'],
      ['Favored Enemy', 2, 3, 'long'],
    ]);
  });

  it('adds a new character and re-syncs without losing tracker data', () => {
    let s = createDefaultState(() => 0);
    const parts = { stats: true, inventory: true, spells: true, resources: true, conditions: false };
    s = E.importDdb(s, { rng: () => 0.5 }, parseDdbCharacter(sample), parts);
    const vex = s.characters.find((c) => c.name === 'Vex')!;
    expect(vex).toMatchObject({ ddbId: 87654321, gp: 58.12, darkvision: 60 }); // 1 pp + 45 gp + 30 sp + 12 cp
    vex.ateLbToday = 1;
    vex.inventory.push({ id: 'mine', name: 'Lucky stone', qty: 1, weight: 0, source: 'manual' });
    vex.items[0].partyName = 'sticky wand';
    s = E.importDdb(s, { rng: () => 0.5 }, parseDdbCharacter({ ...sample, data: { ...sample.data, removedHitPoints: 0 } }), parts);
    const again = s.characters.filter((c) => c.name === 'Vex');
    expect(again).toHaveLength(1);
    expect(again[0]).toMatchObject({ hp: 44, ateLbToday: 1 });
    expect(again[0].inventory.some((i) => i.id === 'mine')).toBe(true);
    expect(again[0].items[0].partyName).toBe('sticky wand');
  });

  it('builds the data link from a sheet URL or id', () => {
    expect(ddbJsonUrl('https://www.dndbeyond.com/characters/87654321')).toBe('https://character-service.dndbeyond.com/character/v5/character/87654321');
    expect(ddbJsonUrl('not a link')).toBeNull();
  });
});

describe('species, subclass, feats and class choices', () => {
  it('reads them from the D&D Beyond JSON', () => {
    const d = structuredClone(sample);
    Object.assign(d.data, {
      classes: [{ ...d.data.classes[0], subclassDefinition: { name: 'Gloom Stalker' } }],
      feats: [{ definition: { name: 'Alert' } }],
      options: { class: [{ definition: { name: "Devil's Sight" } }, { definition: { name: "Devil's Sight" } }], race: [], feat: [] },
    });
    const imp = parseDdbCharacter(d);
    expect(imp.species).toBe('Wood Elf');
    expect(imp.subclass).toBe('Gloom Stalker');
    expect(imp.feats).toEqual(['Alert']);
    expect(imp.features).toEqual(["Devil's Sight"]);
  });
});

import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { State } from './types';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
const LOW = ctx(0); // every die rolls 1
const HIGH = ctx(0.999); // every die rolls max

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.characters = [newCharacter({ name: 'A', conSave: 0 })];
  s.log = [];
  patch(s);
  return s;
}

const calm = (s: State, high: number, low: number) => {
  s.weather = { ...s.weather, high, low, wind: 'none', precip: 'none', dayIndex: s.dayIndex };
};

describe('clock', () => {
  it('rolls into a new day and new weather at midnight', () => {
    const s = fresh((d) => (d.minutes = 23 * 60));
    const n = E.advance(s, ctx(), 120);
    expect(n.dayIndex).toBe(s.dayIndex + 1);
    expect(n.minutes).toBe(60);
    expect(n.weather.dayIndex).toBe(n.dayIndex);
  });
});

describe('end-of-day survival', () => {
  it('gives Exhaustion for drinking less than half your water', () => {
    const s = fresh((d) => {
      d.minutes = 23 * 60;
      d.characters[0].ateLbToday = 1;
      d.characters[0].drankPintsToday = 3;
    });
    const n = E.advance(s, ctx(), 60);
    expect(n.characters[0].exhaustion).toBe(1);
    expect(n.characters[0].dehydrated).toBe(true);
    expect(n.characters[0].drankPintsToday).toBe(0);
  });

  it('adds Exhaustion from the fifth day without food', () => {
    const s = fresh((d) => {
      d.place.waterSource = true;
      d.characters[0].daysWithoutFood = 4;
      d.characters[0].drankPintsToday = 8;
      d.minutes = 23 * 60;
    });
    const n = E.advance(s, ctx(), 60);
    expect(n.characters[0].daysWithoutFood).toBe(5);
    expect(n.characters[0].exhaustion).toBe(1);
    expect(n.characters[0].malnourished).toBe(true);
  });

  it('calls for a DC 10 save after eating less than half', () => {
    const s = fresh((d) => {
      d.minutes = 23 * 60;
      d.characters[0].ateLbToday = 0.25;
      d.characters[0].drankPintsToday = 8;
    });
    expect(E.advance(s, LOW, 60).characters[0].exhaustion).toBe(1);
    expect(E.advance(s, HIGH, 60).characters[0].exhaustion).toBe(0);
  });

  it('can queue saves for players to roll instead', () => {
    const s = fresh((d) => {
      d.settings.autoRollSaves = false;
      d.minutes = 23 * 60;
      d.characters[0].ateLbToday = 0.25;
      d.characters[0].drankPintsToday = 8;
    });
    const n = E.advance(s, ctx(), 60);
    expect(n.pending).toHaveLength(1);
    const r = E.resolvePending(n, ctx(), n.pending[0].id, 'fail');
    expect(r.pending).toHaveLength(0);
    expect(r.characters[0].exhaustion).toBe(1);
    expect(r.characters[0].malnourished).toBe(true);
  });
});

describe('extreme temperatures', () => {
  it('makes exposed characters save each hour in extreme cold, unless protected', () => {
    const s = fresh((d) => {
      d.minutes = 10 * 60;
      calm(d, -10, -20);
      d.characters.push(newCharacter({ name: 'Furry', coldWeatherGear: true }));
    });
    const n = E.advance(s, LOW, 120);
    expect(n.characters[0].exhaustion).toBe(2);
    expect(n.characters[1].exhaustion).toBe(0);
  });

  it('lets a campfire or building protect from cold (table rule)', () => {
    const s = fresh((d) => {
      d.minutes = 10 * 60;
      calm(d, -10, -20);
      d.fire = { lit: true, fuelHours: 10, sheltered: false };
    });
    expect(E.advance(s, LOW, 60).characters[0].exhaustion).toBe(0);
    const t = fresh((d) => {
      d.minutes = 10 * 60;
      calm(d, -10, -20);
      d.place.shelter = 'building';
    });
    expect(E.advance(t, LOW, 60).characters[0].exhaustion).toBe(0);
  });

  it('raises the heat DC by 1 each hour without water', () => {
    const s = fresh((d) => {
      d.minutes = 12 * 60;
      calm(d, 115, 112);
      d.place.waterSource = false;
      d.stores.waterGal = 0;
      d.characters[0].waterPints = 0;
      d.characters[0].conSave = 3;
    });
    // d20 = 2 (rng 0.06) + 3 = 5: passes DC 5 in hour 1, fails DC 6 in hour 2
    const n = E.advance(s, ctx(0.06), 120);
    expect(n.characters[0].heatHours).toBe(2);
    expect(n.characters[0].exhaustion).toBe(1);
    const withWater = fresh((d) => {
      d.minutes = 12 * 60;
      calm(d, 115, 112);
      d.place.waterSource = false;
      d.characters[0].waterPints = 2;
    });
    expect(E.advance(withWater, LOW, 120).characters[0].exhaustion).toBe(0);
  });
});

describe('campfire', () => {
  it('burns fuel and is put out by strong wind unless sheltered', () => {
    const s = fresh((d) => {
      calm(d, 60, 40);
      d.fire = { lit: true, fuelHours: 3, sheltered: false };
    });
    const burned = E.advance(s, ctx(), 120);
    expect(burned.fire.fuelHours).toBe(1);
    expect(burned.fire.lit).toBe(true);
    const out = E.advance(burned, ctx(), 60);
    expect(out.fire.lit).toBe(false);

    const windy = fresh((d) => {
      d.weather = { ...d.weather, wind: 'strong', precip: 'none', high: 60, low: 40 };
      d.fire = { lit: true, fuelHours: 5, sheltered: false };
    });
    expect(E.advance(windy, ctx(), 60).fire.lit).toBe(false);
    windy.fire.sheltered = true;
    expect(E.advance(windy, ctx(), 60).fire.lit).toBe(true);
    expect(E.lightFire({ ...windy, fire: { lit: false, fuelHours: 5, sheltered: false } }, ctx()).fire.lit).toBe(false);
  });

  it('needs a lit fire to cook, and feeds the party from stores', () => {
    const s = fresh((d) => {
      calm(d, 60, 40);
      d.stores.foodLb = 5;
    });
    expect(E.cookMeal(s, ctx(), null).characters[0].ateLbToday).toBe(0);
    s.fire = { lit: true, fuelHours: 4, sheltered: false };
    const n = E.cookMeal(s, ctx(), s.characters[0].id);
    expect(n.characters[0].ateLbToday).toBe(0.5);
    expect(n.stores.foodLb).toBe(4.5);
  });
});

describe('rests', () => {
  it('removes 1 Exhaustion on a Long Rest unless malnourished', () => {
    const s = fresh((d) => {
      calm(d, 60, 40);
      d.characters[0].exhaustion = 2;
      d.characters.push(newCharacter({ name: 'B', exhaustion: 2, exhaustionCauses: ['malnutrition', 'malnutrition'], malnourished: true }));
      d.minutes = 8 * 60;
    });
    const n = E.longRest(s, ctx(), false);
    expect(n.characters[0].exhaustion).toBe(1);
    expect(n.characters[1].exhaustion).toBe(2);
    expect(n.minutes).toBe(16 * 60);
  });

  it('allows only one Long Rest per 24 hours', () => {
    const s = fresh((d) => calm(d, 60, 40));
    const a = E.longRest(s, ctx(), false);
    expect(E.canLongRest(a).ok).toBe(false);
    const b = E.longRest(a, ctx(), false);
    expect(b.minutes).toBe(a.minutes);
    const later = E.advance(a, ctx(), 16 * 60);
    expect(E.canLongRest(later).ok).toBe(true);
  });

  it('opens spell preparation by class after a Long Rest and resets daily tasks', () => {
    const s = fresh((d) => {
      calm(d, 60, 40);
      d.characters = [newCharacter({ name: 'W', className: 'Wizard' }), newCharacter({ name: 'P', className: 'Paladin' }), newCharacter({ name: 'S', className: 'Sorcerer' })];
      d.characters.forEach((c) => c.tasks.forEach((t) => (t.done = true)));
    });
    const n = E.longRest(s, ctx(), false);
    expect(n.characters.map((c) => [c.prepOpen, c.swapsLeft])).toEqual([
      [true, 0],
      [false, 1],
      [false, 0],
    ]);
    expect(n.characters[0].tasks.every((t) => !t.done)).toBe(true);
  });
});

describe('travel and foraging', () => {
  it('covers miles by pace and forces saves past 8 hours', () => {
    const s = fresh((d) => {
      calm(d, 60, 40);
      d.minutes = 6 * 60;
      d.place.waterSource = true;
    });
    const n = E.travel(s, LOW, { hours: 10, pace: 'normal', difficult: false, foragerIds: [] });
    expect(n.travel.milesToday).toBe(30);
    expect(n.characters[0].exhaustion).toBe(2); // DC 11 and DC 12 failed on 1s
  });

  it('adds foraged food and water to the stores', () => {
    const s = fresh((d) => {
      calm(d, 60, 40);
      d.stores = { foodLb: 0, waterGal: 0, foodRawLb: 0, waterUnsafeGal: 0 };
      d.characters[0].wisMod = 1;
    });
    const n = E.forage(s, HIGH, s.characters[0].id);
    expect(n.stores).toMatchObject({ foodLb: 0, waterGal: 0, foodRawLb: 7, waterUnsafeGal: 7 });
    s.settings.wildNeedsPurifying = false;
    s.settings.rawFoodRisk = false;
    expect(E.forage(s, HIGH, s.characters[0].id).stores).toMatchObject({ foodLb: 7, waterGal: 7 });
  });
});

describe('spell preparation', () => {
  it('only lets you change spells when the rules allow', () => {
    const s = fresh((d) => {
      d.characters = [
        newCharacter({
          name: 'P',
          className: 'Paladin',
          swapsLeft: 1,
          prepOpen: false,
          spells: [
            { name: 'Bless', level: 1, prepared: true, alwaysPrepared: false },
            { name: 'Heroism', level: 1, prepared: false, alwaysPrepared: false },
          ],
        }),
      ];
    });
    const id = s.characters[0].id;
    expect(E.togglePrepared(s, ctx(), id, 'Heroism', false).characters[0].spells[1].prepared).toBe(false);
    const swapped = E.replaceSpell(s, ctx(), id, 'Bless', 'Heroism');
    expect(swapped.characters[0].spells.map((x) => x.prepared)).toEqual([false, true]);
    expect(swapped.characters[0].swapsLeft).toBe(0);
    expect(E.togglePrepared(s, ctx(), id, 'Heroism', true).characters[0].spells[1].prepared).toBe(true);
  });
});

describe('downtime', () => {
  it('progresses projects by the number of crafters', () => {
    const s = fresh((d) => {
      calm(d, 60, 40);
      d.characters.push(newCharacter({ name: 'B' }));
      d.projects = [{ id: 'p', name: 'Plate', kind: 'nonmagical', charIds: d.characters.map((c) => c.id), daysRequired: 3, daysDone: 0, costGp: 750, notes: '', done: false }];
    });
    const a = E.workOnProjects(s, ctx(), ['p']);
    expect(a.projects[0].daysDone).toBe(2);
    const b = E.workOnProjects(a, ctx(), ['p']);
    expect(b.projects[0]).toMatchObject({ daysDone: 3, done: true });
  });
});

describe('purifying food and water', () => {
  const wild = (d: State) => {
    calm(d, 60, 40);
    d.place.waterSource = true;
    d.place.waterQuality = 'questionable';
    d.stores = { foodLb: 0, waterGal: 0, foodRawLb: 3, waterUnsafeGal: 2 };
  };

  it('fills waterskins with tainted water from a questionable source', () => {
    const s = fresh((d) => {
      wild(d);
      d.characters[0].waterPints = 1;
    });
    const n = E.refillWater(s, ctx());
    expect(n.characters[0]).toMatchObject({ waterPints: 4, waterUnsafe: true });
    s.place.waterQuality = 'clean';
    expect(E.refillWater(s, ctx()).characters[0].waterUnsafe).toBe(false);
  });

  it('makes you save or fall Sick after eating raw food, until a Long Rest', () => {
    const s = fresh(wild);
    const n = E.eat(s, LOW, s.characters[0].id, 0.5, 'stores');
    expect(n.characters[0].sick).toBe(true);
    expect(E.eat(s, HIGH, s.characters[0].id, 0.5, 'stores').characters[0].sick).toBe(false);
    expect(E.advance(n, ctx(), 6 * 60).characters[0].sick).toBe(true);
    expect(E.longRest(n, ctx(), false).characters[0].sick).toBe(false);
  });

  it('uses the raw food DC from Settings, and can be switched off', () => {
    const s = fresh((d) => {
      wild(d);
      d.settings.rawFoodDC = 15;
      d.characters[0].conSave = 4;
    });
    // d20 = 11 (rng 0.5) + 4 = 15: passes DC 15, fails DC 16
    expect(E.eat(s, ctx(0.5), s.characters[0].id, 0.5, 'stores').characters[0].sick).toBe(false);
    s.settings.rawFoodDC = 16;
    expect(E.eat(s, ctx(0.5), s.characters[0].id, 0.5, 'stores').characters[0].sick).toBe(true);
    s.settings.rawFoodRisk = false;
    expect(E.eat(s, LOW, s.characters[0].id, 0.5, 'stores').characters[0].sick).toBe(false);
  });

  it('still gives an hour of Poisoned for unpurified water', () => {
    const s = fresh((d) => {
      wild(d);
      d.characters[0].waterPints = 0;
    });
    const n = E.drink(s, LOW, s.characters[0].id, 2, 'stores');
    expect(n.characters[0].poisonedUntil).toBe(E.absNow(n) + 60);
    expect(n.characters[0].sick).toBe(false);
    expect(E.advance(n, ctx(), 60).characters[0].poisonedUntil).toBeNull();
  });

  it('prefers safe water and only risks the questionable stream when it has to', () => {
    const s = fresh((d) => {
      wild(d);
      d.characters[0].waterPints = 8;
    });
    const n = E.partyDrink(s, LOW, 'day');
    expect(n.characters[0].waterPints).toBe(0);
    expect(n.characters[0].poisonedUntil).toBeNull();
  });

  it('purifies everything with the spell, as a ritual or with a slot', () => {
    const s = fresh((d) => {
      wild(d);
      d.characters[0] = newCharacter({ name: 'Cleric', className: 'Cleric', waterUnsafe: true, spells: [{ name: 'Purify Food and Drink', level: 1, prepared: false, alwaysPrepared: false }] });
    });
    const id = s.characters[0].id;
    expect(E.canCastPurify(s.characters[0], 'ritual').ok).toBe(false);
    expect(E.purifySpell(s, ctx(), id, 'ritual').stores.foodRawLb).toBe(3);
    s.characters[0].spells[0].prepared = true;
    const n = E.purifySpell(s, ctx(), id, 'ritual');
    expect(n.stores).toEqual({ foodLb: 3, waterGal: 2, foodRawLb: 0, waterUnsafeGal: 0 });
    expect(n.characters[0].waterUnsafe).toBe(false);
    expect(n.minutes).toBe(s.minutes + 10);
    expect(E.purifySpell(s, ctx(), id, 'slot').minutes).toBe(s.minutes);
    const wiz = newCharacter({ className: 'Wizard', spells: [{ name: 'Purify Food and Drink', level: 1, prepared: false, alwaysPrepared: false }] });
    expect(E.canCastPurify(wiz, 'ritual').ok).toBe(true);
    expect(E.canCastPurify(wiz, 'slot').ok).toBe(false);
  });

  it('boils water over a lit fire, and cooking makes foraged food safe', () => {
    const s = fresh(wild);
    expect(E.boilWater(s, ctx()).stores.waterUnsafeGal).toBe(2);
    s.fire = { lit: true, fuelHours: 5, sheltered: false };
    const boiled = E.boilWater(s, ctx());
    expect(boiled.stores).toMatchObject({ waterGal: 2, waterUnsafeGal: 0 });
    const cooked = E.cookMeal(s, LOW, null);
    expect(cooked.stores.foodRawLb).toBe(2.5);
    expect(cooked.characters[0].poisonedUntil).toBeNull();
  });
});

describe('armor', () => {
  it('takes the right time to don and doff, and the party waits for the slowest', () => {
    const s = fresh((d) => {
      calm(d, 60, 40);
      d.characters = [
        newCharacter({ name: 'Tank', armorKind: 'heavy', armorWorn: true, hasShield: true, shieldWorn: true }),
        newCharacter({ name: 'Scout', armorKind: 'light', armorWorn: true }),
      ];
    });
    const off = E.partyArmor(s, ctx(), 'doff');
    expect(off.minutes).toBe(s.minutes + 5);
    expect(off.characters.map((c) => [c.armorWorn, c.shieldWorn])).toEqual([
      [false, false],
      [false, false],
    ]);
    const on = E.setArmor(off, ctx(), off.characters[0].id, 'don');
    expect(on.minutes).toBe(off.minutes + 10);
    expect(on.characters[0].armorWorn).toBe(true);
  });

  it('gives Disadvantage on heat saves in Medium or Heavy armor', () => {
    const s = fresh((d) => {
      d.minutes = 12 * 60;
      calm(d, 115, 112);
      d.place.waterSource = false;
      d.stores.waterGal = 0;
      d.characters[0] = newCharacter({ name: 'Tank', waterPints: 0, conSave: 10, armorKind: 'medium', armorWorn: true });
      d.settings.autoRollSaves = false;
    });
    expect(E.advance(s, ctx(), 60).pending[0].mode).toBe('disadvantage');
  });

  it('optionally spoils the Long Rest for anyone who sleeps in Medium or Heavy armor', () => {
    const s = fresh((d) => {
      calm(d, 60, 40);
      d.characters = [newCharacter({ name: 'Tank', exhaustion: 2, armorKind: 'heavy', armorWorn: true })];
    });
    expect(E.longRest(s, ctx(), false).characters[0].exhaustion).toBe(1);
    s.settings.sleepInArmorPenalty = true;
    expect(E.longRest(s, ctx(), false).characters[0].exhaustion).toBe(2);
  });
});

describe('bastions', () => {
  const withBastion = () => {
    const s = fresh((d) => {
      calm(d, 60, 40);
      d.characters[0].level = 5;
    });
    return E.foundBastion(s, ctx(), s.characters[0].id, 'Keep');
  };

  it('builds basic facilities day by day and enlarges them', () => {
    let s = withBastion();
    const id = s.bastions[0].id;
    s = E.addFacility(s, ctx(), id, { kind: 'basic', name: 'Kitchen', size: 'cramped', alreadyBuilt: false });
    expect(s.bastions[0].goldSpent).toBe(500);
    expect(s.bastions[0].facilities[0]).toMatchObject({ built: false, building: { daysLeft: 20 } });
    s = E.advance(s, ctx(), 19 * 1440);
    expect(s.bastions[0].facilities[0].building?.daysLeft).toBe(1);
    s = E.advance(s, ctx(), 1440);
    expect(s.bastions[0].facilities[0]).toMatchObject({ built: true, building: null, size: 'cramped' });
    s = E.enlargeFacility(s, ctx(), id, s.bastions[0].facilities[0].id);
    expect(s.bastions[0].goldSpent).toBe(1000);
    s = E.advance(s, ctx(), 25 * 1440);
    expect(s.bastions[0].facilities[0].size).toBe('roomy');
  });

  it('adds special facilities free and starting basics without cost', () => {
    let s = withBastion();
    const id = s.bastions[0].id;
    s = E.addFacility(s, ctx(), id, { kind: 'special', name: 'Smithy', size: 'roomy', alreadyBuilt: true });
    s = E.addFacility(s, ctx(), id, { kind: 'basic', name: 'Bedroom', size: 'roomy', alreadyBuilt: true });
    expect(s.bastions[0].goldSpent).toBe(0);
    expect(s.bastions[0].facilities[0]).toMatchObject({ order: 'Craft', built: true });
  });

  it('comes due every 7 days and rolls an event only when everything is maintained', () => {
    let s = withBastion();
    const id = s.bastions[0].id;
    s = E.addFacility(s, ctx(), id, { kind: 'special', name: 'Garden', size: 'roomy', alreadyBuilt: true });
    expect(E.turnsDue(s, s.bastions[0])).toBe(0);
    expect(E.resolveBastionTurn(s, ctx(), id).bastions[0].turns).toBe(0);
    s = E.advance(s, ctx(), 7 * 1440);
    expect(E.turnsDue(s, s.bastions[0])).toBe(1);
    const worked = E.resolveBastionTurn(s, ctx(), id);
    expect(worked.bastions[0]).toMatchObject({ turns: 1, lastEvent: 'Turn 1: orders carried out' });
    expect(E.turnsDue(worked, worked.bastions[0])).toBe(0);
    s.bastions[0].facilities[0].order = 'Maintain';
    expect(E.resolveBastionTurn(s, ctx(0), id).bastions[0].lastEvent).toBe('Turn 1: All Is Well (d100 = 1)');
    expect(E.resolveBastionTurn(s, ctx(0.999), id).bastions[0].lastEvent).toBe('Turn 1: Treasure (d100 = 100)');
  });
});

describe('long rest countdown', () => {
  it('counts down 16 hours after a Long Rest ends and logs when one is possible again', () => {
    const s = fresh((d) => calm(d, 60, 40));
    expect(E.minutesUntilLongRest(s)).toBe(0);
    expect(E.minutesSinceLongRest(s)).toBeNull();
    const rested = E.longRest(s, ctx(), false);
    expect(E.minutesUntilLongRest(rested)).toBe(16 * 60);
    const later = E.advance(rested, ctx(), 10 * 60 + 30);
    expect(E.minutesUntilLongRest(later)).toBe(5 * 60 + 30);
    expect(E.canLongRest(later).reason).toContain('5 h 30 min');
    const ready = E.advance(later, ctx(), 5 * 60 + 30);
    expect(E.minutesUntilLongRest(ready)).toBe(0);
    expect(ready.log.some((l) => l.text.startsWith('A Long Rest is possible again'))).toBe(true);
    expect(later.log.some((l) => l.text.startsWith('A Long Rest is possible again'))).toBe(false);
  });
});

describe('cold nights, bedrolls and blankets', () => {
  // These sleepers don't eat or drink, so crossing midnight doesn't add dehydration Exhaustion.
  const nc = (p: Parameters<typeof newCharacter>[0]) => newCharacter({ needsFood: false, needsWater: false, ...p });
  const night = (d: State) => {
    calm(d, 40, 20);
    d.minutes = 22 * 60;
    d.place.shelter = 'none';
    d.fire.lit = false;
  };

  it('makes sleepers without warm cover save when they wake from a cold night', () => {
    const s = fresh((d) => {
      night(d);
      d.characters = [nc({ name: 'Bare', bedroll: false, blanket: false }), nc({ name: 'Snug', bedroll: true }), nc({ name: 'Wrapped', bedroll: false, blanket: true })];
    });
    const n = E.longRest(s, LOW, false);
    expect(n.characters.map((c) => c.exhaustion)).toEqual([1, 0, 0]);
    expect(n.characters.every((c) => c.nightChill === null)).toBe(true);
    expect(E.longRest(s, HIGH, false).characters[0].exhaustion).toBe(0);
  });

  it('leaves warm nights, fires, shelter and the switch alone', () => {
    const bare = () => [nc({ name: 'Bare', bedroll: false })];
    const mild = fresh((d) => {
      night(d);
      calm(d, 70, 50);
      d.characters = bare();
    });
    expect(E.longRest(mild, LOW, false).characters[0].exhaustion).toBe(0);
    const fire = fresh((d) => {
      night(d);
      d.characters = bare();
      d.fire = { lit: true, fuelHours: 12, sheltered: true };
    });
    expect(E.longRest(fire, LOW, false).characters[0].exhaustion).toBe(0);
    const off = fresh((d) => {
      night(d);
      d.characters = bare();
      d.settings.coldNights = false;
    });
    expect(E.longRest(off, LOW, false).characters[0].exhaustion).toBe(0);
  });

  it('a Bedroll means automatic success against extreme cold while resting, and a Blanket gives Advantage', () => {
    const s = fresh((d) => {
      night(d);
      calm(d, -10, -20);
      d.settings.autoRollSaves = false;
      d.characters = [nc({ name: 'Snug', bedroll: true }), nc({ name: 'Wrapped', bedroll: false, blanket: true })];
    });
    const n = E.longRest(s, ctx(), false);
    // 23:00 and 24:00 are below 0 °F; the next day's weather is rolled fresh.
    const snug = n.pending.filter((p) => p.charId === n.characters[0].id && p.kind === 'cold');
    const wrapped = n.pending.filter((p) => p.charId === n.characters[1].id && p.kind === 'cold');
    expect(snug).toHaveLength(0);
    expect(wrapped.length).toBe(2);
    expect(wrapped.every((p) => p.mode === 'advantage')).toBe(true);
    // Out of bed, the Bedroll doesn't help
    const awake = E.advance(s, ctx(), 60, 'camp');
    expect(awake.pending.some((p) => p.charId === s.characters[0].id)).toBe(true);
  });
});

describe('labelled debuffs', () => {
  it('records the cause of every Exhaustion level', () => {
    const s = fresh((d) => {
      d.minutes = 23 * 60;
      calm(d, -10, -20);
      d.characters[0].daysWithoutFood = 4;
      d.characters[0].drankPintsToday = 0;
    });
    // Hour of extreme cold (fails on a 1), then midnight: dehydration and the fifth day without food.
    const n = E.advance(s, LOW, 60);
    expect(n.characters[0].exhaustionCauses).toEqual(['cold', 'dehydration', 'malnutrition']);
    expect(n.characters[0].exhaustion).toBe(3);
    expect(n.log.some((l) => l.text.includes('from Extreme cold'))).toBe(true);
    expect(n.log.some((l) => l.text.includes('from Dehydration'))).toBe(true);
    expect(n.log.some((l) => l.text.includes('from Malnutrition'))).toBe(true);
  });

  it('only removes levels that are not locked by malnutrition or dehydration', () => {
    const c = newCharacter({ exhaustion: 3, exhaustionCauses: ['malnutrition', 'cold', 'dehydration'], malnourished: true, dehydrated: true });
    expect(E.recoverExhaustion(c)).toBe('cold');
    expect(c.exhaustionCauses).toEqual(['malnutrition', 'dehydration']);
    expect(E.recoverExhaustion(c)).toBeNull();
    c.dehydrated = false;
    expect(E.recoverExhaustion(c)).toBe('dehydration');
    expect(c).toMatchObject({ exhaustion: 1, exhaustionCauses: ['malnutrition'] });
  });

  it('labels the forced march and cold night levels, and pads older saves with "other"', () => {
    const s = fresh((d) => {
      calm(d, 60, 40);
      d.minutes = 6 * 60;
      d.place.waterSource = true;
    });
    const n = E.travel(s, LOW, { hours: 9, pace: 'normal', difficult: false, foragerIds: [] });
    expect(n.characters[0].exhaustionCauses).toEqual(['march']);
    const legacy = newCharacter({ exhaustion: 2, exhaustionCauses: undefined as unknown as [] });
    expect(E.recoverExhaustion(legacy)).toBe('other');
  });
});

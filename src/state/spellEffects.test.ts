import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });
function party() {
  const s = createDefaultState(() => 0);
  s.settings.sleepDeprivation = false;
  s.characters = [
    newCharacter({ name: 'Cleric', className: 'Cleric', level: 9, needsFood: false, needsWater: false, spells: [{ name: 'Revivify', level: 3, prepared: true, alwaysPrepared: false }, { name: 'Raise Dead', level: 5, prepared: true, alwaysPrepared: false }], inventory: [{ id: 'd', name: 'Diamond', qty: 2, weight: 0, source: 'manual', valueGp: 300, container: null, ammo: null }] }),
    newCharacter({ name: 'Fallen', hp: 0, maxHp: 20, needsFood: false, needsWater: false }),
  ];
  return s;
}

describe('costly components and spells on a target', () => {
  it('Revivify within a minute uses a 300 GP diamond and returns the fallen with 1 HP', () => {
    let s = party();
    s.characters[1].diedAt = E.absNow(s);
    s = E.castSpell(s, ctx(), s.characters[0].id, 'Revivify', 'slot', s.characters[1].id);
    expect(s.characters[1].diedAt).toBeNull();
    expect(s.characters[1].hp).toBe(1);
    expect(s.characters[0].inventory[0].qty).toBe(1);
  });

  it('Raise Dead without a 500 GP diamond fails; with one it revives with a −4 penalty that eases on Long Rests', () => {
    let s = party();
    s.characters[1].diedAt = E.absNow(s) - 3 * 24 * 60;
    s.characters[0].inventory[0].qty = 1;
    s = E.castSpell(s, ctx(), s.characters[0].id, 'Raise Dead', 'slot', s.characters[1].id);
    expect(s.characters[1].diedAt).not.toBeNull();
    s.characters[0].inventory.push({ id: 'big', name: 'Diamond (large)', qty: 1, weight: 0, source: 'manual', valueGp: 500, container: null, ammo: null });
    s = E.castSpell(s, ctx(), s.characters[0].id, 'Raise Dead', 'slot', s.characters[1].id);
    expect(s.characters[1].revivalPenalty).toBe(4);
    s.minutes = 22 * 60;
    s = E.longRest(s, ctx(), true);
    expect(s.characters[1].revivalPenalty).toBe(3);
  });

  it('a hired Lesser Restoration ends Poisoned', () => {
    let s = party();
    s = E.exposePoison(s, ctx(0.05), s.characters[0].id, 'Malice', null);
    expect(s.effects.some((e) => e.name.startsWith('Poisoned'))).toBe(true);
    s = E.spellOnTarget(s, ctx(), 'Lesser Restoration', s.characters[0].id);
    expect(s.effects.some((e) => e.name.startsWith('Poisoned'))).toBe(false);
  });
});

describe('persistent spell bookkeeping', () => {
  function casters() {
    const s = createDefaultState(() => 0);
    s.settings.encounters = false;
    s.settings.sleepDeprivation = false;
    s.characters = [
      newCharacter({
        name: 'Caster', hp: 4, maxHp: 20,
        spells: [{ name: 'Goodberry', level: 1 }, { name: 'Prayer of Healing', level: 2 }, { name: 'Aid', level: 2 }]
          .map((spell) => ({ ...spell, prepared: true, alwaysPrepared: false })),
      }),
      newCharacter({ name: 'Ally', hp: 4, maxHp: 20 }),
      newCharacter({ name: 'Bystander', hp: 4, maxHp: 20 }),
    ];
    return { s, caster: s.characters[0].id, ally: s.characters[1].id };
  }

  it('Goodberry feeds another creature and each batch vanishes on its own clock', () => {
    const { s, caster, ally } = casters();
    let next = E.castSpell(s, ctx(), caster, 'Goodberry', 'slot');
    const first = next.characters[0].inventory[0];
    next = E.eatGoodberry(next, ctx(), caster, first.id, ally);
    expect(next.characters[0].inventory[0].qty).toBe(9);
    expect(next.characters[1].hp).toBe(5);
    expect(next.characters[1].ateLbToday).toBeGreaterThan(0);
    next = E.advance(next, ctx(), 60);
    next = E.castSpell(next, ctx(), caster, 'Goodberry', 'slot');
    next = E.advance(next, ctx(), 23 * 60);
    expect(next.characters[0].inventory.map((i) => i.qty)).toEqual([10]);
  });

  it('Prayer of Healing takes ten minutes, heals selected targets and locks each out until a Long Rest', () => {
    const { s, caster, ally } = casters();
    let next = E.castSpell(s, ctx(), caster, 'Prayer of Healing', 'slot', null, null, [caster, ally]);
    expect(E.absNow(next) - E.absNow(s)).toBe(10);
    expect(next.characters.map((c) => c.hp)).toEqual([14, 14, 4]);
    expect(next.characters.map((c) => !!c.prayerOfHealingUsed)).toEqual([true, true, false]);
    const denied = E.castSpell(next, ctx(), caster, 'Prayer of Healing', 'slot', null, null, [ally]);
    expect(E.absNow(denied)).toBe(E.absNow(next));
    next = E.longRest(next, ctx(), true);
    expect(next.characters[1].prayerOfHealingUsed).toBe(false);
  });

  it('Aid can spend a chosen higher-level slot while a lower slot remains available', () => {
    const { s, caster, ally } = casters();
    s.characters[0].resources = [
      { id: 'low', name: 'Spell slots (level 2)', current: 1, max: 1, recharge: 'long' },
      { id: 'high', name: 'Spell slots (level 3)', current: 1, max: 1, recharge: 'long' },
    ];
    const next = E.castSpell(s, ctx(), caster, 'Aid', 'slot', null, null, [ally], 3);
    expect(next.characters[0].resources.map((r) => r.current)).toEqual([1, 0]);
    expect(next.characters[1].maxHp).toBe(30);
  });

  it('Aid uses the strongest active bonus and restores HP values after the last effect ends', () => {
    const { s, caster, ally } = casters();
    let next = E.castSpell(s, ctx(), caster, 'Aid', 'slot', null, null, [caster, ally]);
    expect(next.characters.map((c) => [c.hp, c.maxHp])).toEqual([[9, 25], [9, 25], [4, 20]]);
    next = E.castSpell(next, ctx(), caster, 'Aid', 'slot', null, null, [ally]);
    expect(next.characters[1].maxHp).toBe(25);
    next = E.endEffect(next, ctx(), next.effects.find((e) => e.aidHp)!.id);
    expect(next.characters.map((c) => c.maxHp)).toEqual([20, 25, 20]);
    next = E.advance(next, ctx(), 8 * 60);
    expect(next.characters[1].maxHp).toBe(20);
    expect(next.effects.some((e) => e.aidHp)).toBe(false);
  });
});

describe('conjured food and protective spells', () => {
  function adventurers() {
    const s = party();
    s.settings.encounters = false;
    s.settings.trackComponents = false;
    s.stores.foodLb = 5;
    s.stores.waterGal = 0;
    const [caster, ally] = s.characters;
    ally.hp = 4;
    caster.spells.push(
      { name: 'Create Food and Water', level: 3, prepared: true, alwaysPrepared: false },
      { name: "Heroes' Feast", level: 6, prepared: true, alwaysPrepared: false },
      { name: 'Death Ward', level: 4, prepared: true, alwaysPrepared: false },
    );
    return { s, caster: caster.id, ally: ally.id };
  }

  it('spends conjured food first and spoils only the unused batch, leaving the water', () => {
    const { s, caster, ally } = adventurers();
    let next = E.castSpell(s, ctx(), caster, 'Create Food and Water', 'slot');
    expect(next.stores.foodLb).toBe(50);
    next = E.eat(next, ctx(), ally, 2, 'stores');
    expect(next.stores.conjuredFood?.[0].lb).toBe(43);
    next = E.advance(next, ctx(), 60);
    next = E.castSpell(next, ctx(), caster, 'Create Food and Water', 'slot');
    next = E.advance(next, ctx(), 23 * 60);
    expect(next.stores.foodLb).toBe(50);
    expect(next.stores.conjuredFood?.map((batch) => batch.lb)).toEqual([45]);
    expect(next.stores.waterGal).toBe(60);
  });

  it("starts Heroes' Feast benefits after the meal and expires them after 24 hours", () => {
    const { s, caster, ally } = adventurers();
    let next = E.castSpell(s, ctx(), caster, "Heroes' Feast", 'slot', null, null, [ally]);
    expect(E.absNow(next) - E.absNow(s)).toBe(10);
    expect(next.characters[1].maxHp).toBe(20);
    next = E.advance(next, ctx(), 59);
    expect(next.characters[1].hp).toBe(4);
    next = E.advance(next, ctx(), 1);
    expect(next.characters[1].maxHp).toBe(32);
    expect(next.characters[1].hp).toBe(16);
    next = E.exposePoison(next, ctx(0), ally, "Assassin's Blood", null);
    expect(next.characters[1].hp).toBe(16);
    expect(next.effects.some((e) => e.name.startsWith('Poisoned'))).toBe(false);
    next = E.changeHp(next, ctx(), ally, -6, 'poison');
    expect(next.characters[1].hp).toBe(13);
    next = E.advance(next, ctx(), 24 * 60);
    expect(next.characters[1].maxHp).toBe(20);
    expect(next.characters[1].hp).toBe(13);
  });

  it('consumes Death Ward once for damage or an adjudicated instant-death effect', () => {
    const { s, caster, ally } = adventurers();
    let next = E.castSpell(s, ctx(), caster, 'Death Ward', 'slot', ally);
    next = E.changeHp(next, ctx(), ally, -24);
    expect(next.characters[1].hp).toBe(1);
    expect(next.characters[1].diedAt).toBeNull();
    expect(next.effects.some((e) => e.name === 'Death Ward')).toBe(false);
    next = E.changeHp(next, ctx(), ally, -1);
    expect(next.characters[1].dying).toBe(true);
    next = E.castSpell(s, ctx(), caster, 'Death Ward', 'slot', ally);
    next = E.negateInstantDeath(next, ctx(), ally);
    expect(next.characters[1].hp).toBe(4);
    expect(next.effects.some((e) => e.name === 'Death Ward')).toBe(false);
  });
});

describe('travel and weather spells', () => {
  function travelers() {
    const s = createDefaultState(() => 0);
    s.minutes = 12 * 60;
    s.place.shelter = 'none';
    s.place.onRoute = true;
    s.place.goodRoad = true;
    s.settings.encounters = false;
    s.settings.sleepDeprivation = false;
    s.weather.wind = 'none';
    s.weather.precip = 'none';
    const caster = newCharacter({ name: 'Caster', className: 'Wizard', hp: 10, maxHp: 10, spells: [
      { name: 'Phantom Steed', level: 3, prepared: false, alwaysPrepared: false },
      { name: 'Wind Walk', level: 6, prepared: true, alwaysPrepared: false },
      { name: 'Control Weather', level: 8, prepared: true, alwaysPrepared: false },
    ] });
    s.characters = [caster];
    return { s, caster: caster.id };
  }

  it('casts Phantom Steed as a ritual, splits pace at expiry and reports dismounting', () => {
    const { s, caster } = travelers();
    let next = E.castSpell(s, ctx(), caster, 'Phantom Steed', 'ritual');
    expect(E.absNow(next) - E.absNow(s)).toBe(11);
    next = E.advance(next, ctx(), 30);
    next = E.travel(next, ctx(), { hours: 1, pace: 'normal', difficult: false, foragerIds: [], spellTravel: true });
    expect(next.travel.milesToday).toBe(8);
    expect(next.effects.some((e) => e.phantomSteed)).toBe(false);
    expect(next.log.some((item) => item.text.includes('minute to dismount'))).toBe(true);
  });

  it('includes the Wind Walk caster and requires every traveler to be in cloud form for group flight', () => {
    const { s, caster } = travelers();
    const ally = newCharacter({ name: 'Ally', hp: 10, maxHp: 10 });
    s.characters.push(ally);
    let next = E.castSpell(s, ctx(), caster, 'Wind Walk', 'slot', null, null, [ally.id]);
    expect(E.spellTravelSpeed(next)?.mph).toBe(30);
    const effect = next.effects.find((e) => e.windWalk)!;
    next = E.setWindWalkForm(next, ctx(), effect.id, ally.id);
    expect(E.absNow(next) - E.absNow(s)).toBe(2);
    expect(E.spellTravelSpeed(next)).toBeUndefined();
    next = E.setWindWalkForm(next, ctx(), effect.id, ally.id);
    next = E.travel(next, ctx(), { hours: 1, pace: 'normal', difficult: true, foragerIds: [], spellTravel: true });
    expect(next.travel.milesToday).toBe(30);
  });

  it('delays each weather change and restores natural weather when the caster goes inside', () => {
    const { s, caster } = travelers();
    let next = E.castSpell(s, ctx(), caster, 'Control Weather', 'slot');
    const control = next.controlledWeather!;
    next = E.changeControlledWeather(next, ctx(0.5), { ...control.stages, wind: control.stages.wind + 1 }, 'west');
    expect(next.controlledWeather?.pending?.at).toBe(E.absNow(next) + 30);
    next = E.advance(next, ctx(), 29);
    expect(next.weather.wind).toBe('none');
    next = E.advance(next, ctx(), 1);
    expect(next.weather.wind).toBe('light');
    expect(next.controlledWeather?.direction).toBe('west');
    next = E.setTravelShelter(next, ctx(), 'building');
    expect(next.effects.some((e) => e.name === 'Control Weather')).toBe(false);
    expect(next.weather.wind).toBe('light');
    next = E.advance(next, ctx(), 10);
    expect(next.controlledWeather).toBeUndefined();
    expect(next.weather.wind).toBe('none');
  });

  it('cancels a queued change when the caster loses concentration', () => {
    const { s, caster } = travelers();
    let next = E.castSpell(s, ctx(), caster, 'Control Weather', 'slot');
    const control = next.controlledWeather!;
    const illegal = E.changeControlledWeather(next, ctx(), { ...control.stages, wind: 2 }, '');
    expect(illegal.controlledWeather?.pending).toBeUndefined();
    next = E.changeControlledWeather(next, ctx(), { ...control.stages, wind: 1 }, '');
    next = E.loseConcentration(next, ctx(), control.effectId, caster);
    expect(next.controlledWeather).toBeUndefined();
    expect(next.weather.wind).toBe('none');
  });

});

describe('spell creature roster', () => {
  function conjurer() {
    const s = createDefaultState(() => 0);
    s.minutes = 60;
    s.settings.encounters = false;
    s.settings.sleepDeprivation = false;
    s.settings.trackComponents = false;
    const caster = newCharacter({ name: 'Conjurer', className: 'Wizard', hp: 20, maxHp: 20, needsFood: false, needsWater: false,
      spells: [
        { name: 'Animate Dead', level: 3 }, { name: 'Create Undead', level: 6 }, { name: 'Planar Binding', level: 5 },
        { name: 'Find Familiar', level: 1 }, { name: 'Find Steed', level: 2 }, { name: 'Awaken', level: 5 },
      ].map((spell) => ({ ...spell, prepared: true, alwaysPrepared: false })) });
    s.characters = [caster];
    return { s, caster: caster.id };
  }

  it('renews only selected undead and retains creatures whose control lapses', () => {
    const { s, caster } = conjurer();
    let next = E.castSpell(s, ctx(), caster, 'Animate Dead', 'slot', null, null, [], 4, { count: 2, form: 'Zombie' });
    const [first, second] = next.spellCreatures!;
    next = E.setSpellCreatureOrder(next, ctx(), first.id, 'Guard the road');
    next = E.advance(next, ctx(), 23 * 60);
    next = E.castSpell(next, ctx(), caster, 'Animate Dead', 'slot', null, null, [], 3, { renewIds: [first.id] });
    next = E.advance(next, ctx(), 60);
    expect(next.spellCreatures?.map((c) => [c.id, c.status, c.order])).toEqual([
      [first.id, 'present', 'Guard the road'], [second.id, 'uncontrolled', ''],
    ]);
    const retry = E.castSpell(next, ctx(), caster, 'Animate Dead', 'slot', null, null, [], 3, { renewIds: [second.id] });
    expect(E.absNow(retry)).toBe(E.absNow(next));
    expect(retry.spellCreatures).toHaveLength(2);
  });

  it('requires night, valid slot choices, and reusable onyx for each corpse', () => {
    const { s, caster } = conjurer();
    s.settings.trackComponents = true;
    s.characters[0].inventory.push({ id: 'onyx', name: 'Black onyx', qty: 2, valueGp: 150, weight: 0, source: 'manual' });
    const input = { form: 'Wight', count: 2 };
    expect(E.castSpell(s, ctx(), caster, 'Create Undead', 'slot', null, null, [], 6, input).spellCreatures).toBeUndefined();
    const night = E.castSpell(s, ctx(), caster, 'Create Undead', 'slot', null, null, [], 8, input);
    expect(night.spellCreatures?.map((c) => c.form)).toEqual(['Wight', 'Wight']);
    expect(night.characters[0].inventory[0].qty).toBe(2);
    const day = E.advance(s, ctx(), 11 * 60);
    expect(E.castSpell(day, ctx(), caster, 'Create Undead', 'slot', null, null, [], 8, input).spellCreatures).toBeUndefined();
  });

  it('binds a linked summon for the chosen slot duration only on a failed save', () => {
    const { s, caster } = conjurer();
    const summoner = newCharacter({ name: 'Summoner', hp: 10, maxHp: 10 });
    s.characters.push(summoner);
    s.effects.push({ id: 'summon', name: 'Summon Fey', kind: 'spell', casterId: summoner.id, targetIds: [],
      concentration: true, shelter: false, startedAt: E.absNow(s), endsAt: E.absNow(s) + 61, notes: '' });
    const input = { name: 'Briar', summonId: 'summon' };
    const resists = E.castSpell(s, ctx(), caster, 'Planar Binding', 'slot', null, null, [], 6, { ...input, saveFailed: false });
    expect(resists.spellCreatures ?? []).toHaveLength(0);
    expect(resists.effects[0].endsAt).toBe(s.effects[0].endsAt);
    const bound = E.castSpell(s, ctx(), caster, 'Planar Binding', 'slot', null, null, [], 6, { ...input, saveFailed: true });
    expect(bound.spellCreatures?.[0].until).toBe(E.absNow(bound) + 10 * 1440);
    expect(bound.effects[0].endsAt).toBe(bound.spellCreatures?.[0].until);
    expect(E.loseConcentration(bound, ctx(), 'summon', summoner.id).spellCreatures?.[0].status).toBe('gone');
  });

  it('tracks familiar recall, steed replacement and early loss of the Awaken charm', () => {
    const { s, caster } = conjurer();
    let next = E.castSpell(s, ctx(), caster, 'Find Familiar', 'ritual', null, null, [], undefined, { form: 'Cat' });
    const familiar = next.spellCreatures![0].id;
    next = E.setSpellCreatureStatus(next, ctx(), familiar, 'dismiss');
    expect(next.spellCreatures![0].status).toBe('dismissed');
    next = E.setSpellCreatureStatus(next, ctx(), familiar, 'recall');
    expect(next.spellCreatures![0].status).toBe('present');
    next = E.castSpell(next, ctx(), caster, 'Find Steed', 'slot', null, null, [], 2, { form: 'Horse' });
    next = E.castSpell(next, ctx(), caster, 'Find Steed', 'slot', null, null, [], 4, { form: 'Elk' });
    expect(next.spellCreatures?.filter((c) => c.spell === 'find steed').map((c) => [c.form, c.slotLevel])).toEqual([['Elk', 4]]);
    next = E.castSpell(next, ctx(), caster, 'Awaken', 'slot', null, null, [], 5, { name: 'Willow', form: 'Tree' });
    const awakened = next.spellCreatures!.find((c) => c.spell === 'awaken')!;
    expect(awakened.until).toBe(E.absNow(next) + 30 * 1440);
    next = E.setSpellCreatureStatus(next, ctx(), awakened.id, 'hurt');
    expect(next.spellCreatures?.find((c) => c.id === awakened.id)?.status).toBe('independent');
    next = E.markDead(next, ctx(), caster, true);
    expect(next.spellCreatures?.find((c) => c.spell === 'find steed')?.status).toBe('gone');
  });
});

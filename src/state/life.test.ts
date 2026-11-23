import { describe, expect, it } from 'vitest';
import * as E from './engine';
import { createDefaultState, newCharacter } from './defaults';
import type { InventoryItem, State } from './types';
import { injuryFor, healsInjury } from '../rules/injuries';
import { madnessEffect } from '../rules/madness';
import { ageStage, bodyAge, lifespanFor } from '../rules/aging';
import { materialOf, repairCost } from '../rules/wear';
import { heatLevel } from '../rules/notoriety';
import { attitudeOf, favorDC } from '../rules/contacts';
import { newsDelay } from '../rules/letters';
import { dueAmount } from '../rules/dues';
import { coinsFor } from '../rules/coins';
import { dateFromIndex } from '../rules/calendar';

const ctx = (v = 0.5): E.Ctx => ({ rng: () => v });

function fresh(patch: (s: State) => void = () => {}): State {
  const s = createDefaultState(() => 0);
  s.weather = { ...s.weather, high: 60, low: 45, wind: 'light', precip: 'none' };
  Object.assign(s.settings, { encounters: false, foodAndWater: false, extremeWeather: false, sleepDeprivation: false, coldNights: false, forcedMarch: false, navigation: false, lifestyleRisks: false, stabling: false, hirelingsEat: false });
  s.characters = [newCharacter({ id: 'a', name: 'Ash', tasks: [], maxHp: 20, hp: 20, gp: 100, purse: coinsFor(100) }), newCharacter({ id: 'b', name: 'Bree', tasks: [], maxHp: 20, hp: 20, gp: 100, purse: coinsFor(100) })];
  s.place = { ...s.place, name: 'Wilds', terrain: 'grassland', onRoute: true, settlement: false, waterSource: true, region: null };
  s.minutes = 8 * 60;
  s.log = [];
  patch(s);
  return s;
}

const item = (name: string, extra: Partial<InventoryItem> = {}): InventoryItem => ({ id: name, name, qty: 1, weight: 1, source: 'manual', ...extra });
const days = (s: State, n: number) => E.advance(s, ctx(0.99), n * 1440);

describe('lingering injuries', () => {
  it('rolls one on the d20 table when someone drops to 0 HP, if the rule is on', () => {
    expect(injuryFor(1)).toBe('eye');
    expect(injuryFor(11)).toBe('horribleScar');
    expect(injuryFor(20)).toBe('minorScar');
    const down = E.changeHp(fresh(), ctx(0.5), 'a', -25);
    expect(down.characters[0].injuries?.[0].kind).toBe('horribleScar');
    const off = E.changeHp(fresh((d) => (d.settings.lingeringInjuries = false)), ctx(0.5), 'a', -25);
    expect(off.characters[0].injuries ?? []).toHaveLength(0);
  });

  it('a festering wound eats HP maximum daily until magic heals it, which gives it back', () => {
    let s = E.addInjury(fresh(), ctx(), 'a', 'festering', 'a goblin’s rusty blade');
    s = days(s, 2);
    expect(s.characters[0].maxHp).toBe(18);
    s = E.spellOnTarget(s, ctx(), 'Cure Wounds', 'a');
    expect(s.characters[0].injuries).toHaveLength(0);
    expect(s.characters[0].maxHp).toBe(20);
  });

  it('ten Medicine successes heal a festering wound, one attempt a day', () => {
    let s = E.addInjury(fresh(), ctx(), 'a', 'festering', 'a bite');
    const id = s.characters[0].injuries![0].id;
    s = E.treatInjury(s, ctx(0.99), 'a', id, 'b', 3);
    s = E.treatInjury(s, ctx(0.99), 'a', id, 'b', 3);
    expect(s.characters[0].injuries![0].medicine).toBe(1);
    for (let i = 0; i < 9; i++) s = E.treatInjury(days(s, 1), ctx(0.99), 'a', id, 'b', 3);
    expect(s.characters[0].injuries).toHaveLength(0);
  });

  it('broken ribs heal after ten days of rest, and travel resets the count', () => {
    let s = E.addInjury(fresh(), ctx(), 'a', 'ribs', 'a fall');
    for (let i = 0; i < 9; i++) s = E.longRest(E.advance(s, ctx(), 16 * 60), ctx(), true);
    expect(s.characters[0].injuries![0].restDays).toBe(9);
    s = E.travel(s, ctx(), { pace: 'normal', difficult: false, foragerIds: [], hours: 2 });
    s = E.longRest(E.advance(s, ctx(), 14 * 60), ctx(), true);
    expect(s.characters[0].injuries![0].restDays).toBe(0);
  });

  it('failing a death save by 5 or more also leaves an injury', () => {
    const dying = fresh((d) => Object.assign(d.characters[0], { hp: 0, dying: true }));
    const bad = E.deathSave(dying, ctx(0.1), 'a');
    expect(bad.characters[0].injuries?.[0].why).toMatch(/by 7/);
    const near = E.deathSave(dying, ctx(0.3), 'a');
    expect(near.characters[0].injuries ?? []).toHaveLength(0);
  });

  it('only Regenerate restores a lost eye; Heal removes a horrible scar', () => {
    expect(healsInjury('eye', 'heal')).toBe(false);
    expect(healsInjury('eye', 'regenerate')).toBe(true);
    expect(healsInjury('horribleScar', 'magic')).toBe(false);
    expect(healsInjury('horribleScar', 'heal')).toBe(true);
  });
});

describe('madness', () => {
  it('strikes only when the DM applies it, rolls d100 on the 5e tables, and runs its course', () => {
    expect(madnessEffect('short', 1)).toMatch(/Paralyzed/);
    expect(madnessEffect('long', 100)).toMatch(/Unconscious/);
    expect(madnessEffect('indefinite', 15)).toMatch(/drunk/);
    // Stress and Fear are separate trackers: no madness from them.
    const stressed = E.adjustTrack(fresh((d) => (d.characters[0].stress = 5)), ctx(0), 'a', 'stress', 3, 'the crypt');
    expect(stressed.characters[0].madness ?? []).toHaveLength(0);
    let s = E.addMadness(fresh(), ctx(0), 'a', 'long', 'the Far Realm');
    const m = s.characters[0].madness![0];
    expect(m.effect).toMatch(/repeat a specific activity/);
    expect(m.endsAt! - E.absNow(s)).toBe(10 * 60);
    s = E.advance(s, ctx(), 10 * 60);
    expect(s.characters[0].madness).toHaveLength(0);
    const off = E.addMadness(fresh((d) => (d.settings.madness = false)), ctx(), 'a', 'short', 'x');
    expect(off.characters[0].madness ?? []).toHaveLength(0);
  });

  it('Lesser Restoration ends long-term madness but not indefinite madness', () => {
    let s = E.addMadness(fresh(), ctx(), 'a', 'long', 'a vision');
    s = E.addMadness(s, ctx(), 'a', 'indefinite', 'the Far Realm');
    s = E.spellOnTarget(s, ctx(), 'Lesser Restoration', 'a');
    expect(s.characters[0].madness!.map((m) => m.tier)).toEqual(['indefinite']);
    s = E.spellOnTarget(s, ctx(), 'Greater Restoration', 'a');
    expect(s.characters[0].madness).toHaveLength(0);
  });
});

describe('ages and birthdays', () => {
  it('knows typical lifespans and life stages', () => {
    expect(lifespanFor('Wood Elf').span).toBe(750);
    expect(lifespanFor('Lizardfolk').guessed).toBe(true);
    expect(ageStage(30, lifespanFor('Human'))).toBe('adult');
    expect(ageStage(70, lifespanFor('Human'))).toBe('old');
    expect(ageStage(70, lifespanFor('Elf'))).toBe('child');
    // An Archdruid who started slowing at 50 and has lived 20 more years is 52 in body.
    expect(bodyAge({ birthYear: 900, slowSinceYear: 950, slowFactor: 0.1 }, 970, true)).toBe(52);
  });

  it('celebrates a birthday on the calendar and adds a year', () => {
    let s = fresh();
    const tomorrow = dateFromIndex(s.calendar, s.startYear, s.dayIndex + 1);
    s = E.setBirth(s, ctx(), 'a', 30, tomorrow.monthIndex, tomorrow.day);
    expect(E.characterAge(s, s.characters[0])?.age).toBe(30);
    s = E.advance(s, ctx(0.99), E.MIN_PER_DAY);
    expect(E.characterAge(s, s.characters[0])?.age).toBe(31);
    expect(s.log.some((l) => /birthday/.test(l.text))).toBe(true);
  });

  it('a Potion of Longevity takes years off, and the second one may backfire', () => {
    let s = E.setBirth(fresh(), ctx(), 'a', 60, 0, 1);
    s = E.ageByMagic(s, ctx(0.99), 'a', 'longevity', 0);
    expect(E.characterAge(s, s.characters[0])?.age).toBe(48);
    s = E.ageByMagic(s, ctx(0), 'a', 'longevity', 0);
    expect(E.characterAge(s, s.characters[0])?.age).toBe(55);
    s = E.ageByMagic(s, ctx(0.5), 'a', 'visage', 0);
    expect(E.characterAge(s, s.characters[0])?.age).toBe(85);
  });
});

describe('wear and repair', () => {
  it('knows what gear is made of and what a repair costs', () => {
    expect(materialOf('Chain Mail')).toBe('metal');
    expect(materialOf('Leather Armor')).toBe('leather');
    expect(materialOf("Traveler's Clothes")).toBe('cloth');
    expect(materialOf('Longbow')).toBe('wood');
    expect(materialOf('Potion of Healing')).toBeNull();
    expect(repairCost('Chain Mail')).toBe(7.5);
  });

  it('hard travel wears worn armor down until it is damaged, unless the gear is kept up', () => {
    const setup = (d: State) => {
      d.settings.gearWear = true;
      d.place.terrain = 'swamp';
      d.place.onRoute = true;
      Object.assign(d.characters[0], { armorKind: 'medium', armorName: 'Scale Mail', armorWorn: true, inventory: [item('Scale Mail'), item('Rations', { qty: 5 })] });
    };
    let s = E.travel(fresh(setup), ctx(), { pace: 'slow', difficult: false, foragerIds: [], hours: 8 });
    expect(s.characters[0].inventory[0].wear).toBe(1);
    s = E.maintainGear(s, ctx(), ['a']);
    expect(s.characters[0].inventory[0].wear).toBeUndefined();
    for (let i = 0; i < 3; i++) s = E.travel(s, ctx(), { pace: 'slow', difficult: false, foragerIds: [], hours: 8 });
    expect(s.characters[0].inventory[0].damaged).toBe(true);
    const off = E.travel(fresh((d) => (setup(d), (d.settings.gearWear = false))), ctx(), { pace: 'slow', difficult: false, foragerIds: [], hours: 24 });
    expect(off.characters[0].inventory[0].wear).toBeUndefined();
  });

  it('repairs with the right tools or by an artisan in town', () => {
    let s = fresh((d) => {
      d.characters[0].inventory = [item('Chain Mail', { damaged: true })];
      d.characters[1].inventory = [item("Smith's Tools")];
    });
    s = E.repairItem(s, ctx(0.99), 'a', 'Chain Mail', 'tools', 'b', 2);
    expect(s.characters[0].inventory[0].damaged).toBeUndefined();
    let t = fresh((d) => (d.characters[0].inventory = [item('Chain Mail', { damaged: true })]));
    t = E.repairItem(t, ctx(), 'a', 'Chain Mail', 'artisan', 'a', 0);
    expect(t.characters[0].inventory[0].damaged).toBe(true);
    t.place.settlement = true;
    t = E.repairItem(t, ctx(), 'a', 'Chain Mail', 'artisan', 'a', 0);
    expect(t.characters[0].inventory[0].damaged).toBeUndefined();
    expect(t.characters[0].gp).toBe(92.5);
  });
});

describe('taxes, tithes and dues', () => {
  it('charges a due when it falls, and what can’t be paid becomes a debt', () => {
    let s = E.addDue(fresh((d) => Object.assign(d.characters[1], { gp: 2, purse: coinsFor(2) })), ctx(), { kind: 'guild', label: '', payerId: 'a', gp: 5, period: 'month', firstInDays: 1, collector: '', notes: '' });
    s = E.addDue(s, ctx(), { kind: 'rent', label: '', payerId: 'b', gp: 5, period: 'week', firstInDays: 1, collector: 'Old Morra', notes: '' });
    s = days(s, 1);
    expect(s.characters[0].gp).toBe(95);
    expect(s.characters[1].gp).toBe(0);
    expect(s.debts.find((x) => x.debtorId === 'b')?.owed).toBe(3);
  });

  it('a tithe takes a tenth of the gold earned since the last one', () => {
    expect(dueAmount({ gp: 0, share: 0.1 }, 250)).toBe(25);
    let s = E.addDue(fresh(), ctx(), { kind: 'tithe', label: '', payerId: 'a', gp: 0, share: 0.1, period: 'month', firstInDays: 1, collector: '', notes: '' });
    s = E.adjustGold(s, ctx(), 'a', 200, 'a reward');
    s = days(s, 1);
    expect(s.characters[0].gp).toBe(280);
    expect(s.characters[0].earnedGp).toBe(0);
  });
});

describe('notoriety', () => {
  it('crimes raise heat and a bounty; the watch may recognise them there; heat cools with time away', () => {
    expect(heatLevel(0).level).toBe('clear');
    expect(heatLevel(3).level).toBe('wanted');
    let s = E.addCrime(fresh((d) => (d.place = { ...d.place, settlement: true, name: 'Sharn' })), ctx(), 'Sharn', 'serious', ['a'], 'a warehouse burglary');
    expect(s.notoriety![0]).toMatchObject({ heat: 3, bountyGp: 50 });
    s = E.advance(s, ctx(0), E.MIN_PER_DAY);
    expect(s.log.some((l) => /recognised in Sharn/.test(l.text))).toBe(true);
    s.place = { ...s.place, settlement: false, name: 'The road' };
    s = days(s, 8);
    expect(s.notoriety![0].heat).toBe(2);
    s = days(s, 12);
    expect(s.notoriety).toHaveLength(0);
  });

  it('paying the bounty clears their name; surrendering means jail', () => {
    let s = E.addCrime(fresh(), ctx(), 'Sharn', 'serious', [], 'a brawl');
    s = E.payBounty(s, ctx(), s.notoriety![0].id, ['a']);
    expect(s.notoriety).toHaveLength(0);
    expect(s.characters[0].gp).toBe(50);
    let t = E.addCrime(fresh(), ctx(), 'Sharn', 'minor', ['b'], 'pickpocketing');
    t = E.surrender(t, ctx(), t.notoriety![0].id);
    expect(t.effects.some((e) => e.name === 'In jail' && e.targetIds.includes('b'))).toBe(true);
  });
});

describe('contacts', () => {
  it('attitudes follow the bond, and favors use the 2024 DMG DCs', () => {
    expect(attitudeOf(2)).toBe('friendly');
    expect(attitudeOf(0)).toBe('indifferent');
    expect(favorDC('friendly', false)).toBe(10);
    expect(favorDC('indifferent', true)).toBe(20);
    expect(favorDC('hostile', false)).toBeNull();
  });

  it('a neglected Friendly contact cools; one who owes a favor helps at once, then needs time', () => {
    let s = E.addContact(fresh(), ctx(), { name: 'Vel the fence', role: 'Fence', place: 'Sharn', bond: 1, knownBy: [], notes: '', distanceMiles: 40 });
    const id = s.contacts![0].id;
    s = E.doFavorFor(s, ctx(), id);
    expect(s.contacts![0]).toMatchObject({ bond: 2, owesParty: 1 });
    s = E.callFavor(s, ctx(0), id, 'a', 0, true, 'a safe house');
    expect(s.contacts![0].owesParty).toBe(0);
    s.log = [];
    s = E.callFavor(s, ctx(0.99), id, 'a', 0, false, 'a rumor');
    expect(s.log[0].text).toMatch(/only recently/);
    s = days(s, 61);
    expect(s.contacts![0].bond).toBe(1);
    s = days(s, 61);
    expect(attitudeOf(s.contacts![0].bond)).toBe('indifferent');
  });
});

describe('letters and news', () => {
  it('a letter travels at the messenger rate, refreshes the contact, and the reply comes back', () => {
    let s = E.addContact(fresh(), ctx(), { name: 'Aunt Hessa', role: 'Family', place: 'Thrane', bond: 1, knownBy: ['a'], notes: '', distanceMiles: 48 });
    const id = s.contacts![0].id;
    s = days(s, 10);
    s = E.sendLetter(s, ctx(0), { charId: 'a', contactId: id, correspondent: '', miles: 48, method: 'messenger', text: 'All is well.', expectsReply: true });
    expect(s.characters[0].gp).toBeCloseTo(99.04);
    expect(s.letters![0].arrivesAt - E.absNow(s)).toBe(2 * E.MIN_PER_DAY);
    s = days(s, 2);
    expect(s.contacts![0].lastHeardDay).toBe(s.dayIndex);
    const reply = s.letters!.find((l) => l.direction === 'in')!;
    s = E.advance(s, ctx(), reply.arrivesAt - E.absNow(s));
    expect(s.log.some((l) => /letter from Aunt Hessa/.test(l.text))).toBe(true);
  });

  it('news of a distant event arrives as fast as word travels, or at once with the rule off', () => {
    expect(newsDelay('road', 40)).toBe(2 * E.MIN_PER_DAY);
    let s = E.addNews(fresh(), ctx(), { text: 'The king is dead.', place: 'the capital', miles: 40, route: 'road', daysAgo: 0 });
    expect(s.log.some((l) => /The king is dead/.test(l.text))).toBe(false);
    s = days(s, 2);
    expect(s.log.some((l) => /The king is dead/.test(l.text))).toBe(true);
    const off = E.addNews(fresh((d) => (d.settings.newsTravels = false)), ctx(), { text: 'War!', place: 'the border', miles: 400, route: 'remote', daysAgo: 0 });
    expect(off.log.some((l) => /War!/.test(l.text))).toBe(true);
  });
});

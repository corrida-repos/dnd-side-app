import { describe, expect, it } from 'vitest';
import { apportion, budget, buildTable, FOLLOWERS, checkChance, checkModifiers, countExpr, difficultyOf, encountersPerDay, habitat, maxGroup, maxOf, plural, rollOnTable, SRD_POOL, xpFor, DANGERS, type CheckConditions } from './encounters';
import { parse5eToolsBestiary } from './hunting';

const base: CheckConditions = { activity: 'travel', night: false, lightAtNight: false, pace: 'normal', goodRoad: false, foulWeather: false, sheltered: false, underground: false, bigGroup: false };
const find = (name: string) => SRD_POOL.find((c) => c.name === name)!;

describe('random encounter rules', () => {
  it('uses the 2024 XP budgets per character', () => {
    expect(budget({ level: 1, size: 4 }, 'low')).toBe(200);
    expect(budget({ level: 5, size: 4 }, 'high')).toBe(4400);
    expect(budget({ level: 20, size: 1 }, 'moderate')).toBe(13200);
    expect(difficultyOf(300, { level: 3, size: 4 })).toBe('low');
    expect(difficultyOf(1700, { level: 3, size: 4 })).toBe('beyond');
  });

  it('gets more frequent and likelier with danger', () => {
    const perDay = DANGERS.map((d) => encountersPerDay(d));
    for (let i = 1; i < perDay.length; i++) expect(perDay[i]).toBeGreaterThan(perDay[i - 1]);
    expect(checkChance(18, 0)).toBeCloseTo(0.15);
    expect(checkChance(18, 1)).toBeCloseTo(0.2);
  });

  it('turns conditions into modifiers', () => {
    expect(checkModifiers(base)).toEqual([]);
    const night = checkModifiers({ ...base, activity: 'camp', night: true, lightAtNight: true, sheltered: true });
    expect(night.map((m) => m.label)).toEqual(['Night', 'Light in the dark', 'Sheltered camp']);
    expect(checkModifiers({ ...base, pace: 'slow', goodRoad: true }).reduce((a, m) => a + m.value, 0)).toBe(-2);
    // Underground there is no day or night, and no weather.
    expect(checkModifiers({ ...base, night: true, foulWeather: true, underground: true })).toEqual([]);
  });

  it('places creatures in the terrains they live in', () => {
    expect(habitat(find('Brown Bear'), 'forest')).toBe(3);
    expect(habitat(find('Brown Bear'), 'desert')).toBe(0);
    expect(habitat(find('Bandit'), 'grassland')).toBe(1);
    expect(habitat(find('Guard'), 'urban')).toBe(3);
    expect(habitat(find('Iron Golem'), 'forest')).toBe(0);
    expect(habitat(find('Hunter Shark'), 'waterborne')).toBe(3);
  });

  it('keeps big creatures in small numbers', () => {
    expect(maxGroup(find('Adult Red Dragon'))).toBe(1);
    expect(maxGroup(find('Hill Giant'))).toBe(2);
    expect(maxGroup(find('Wolf'))).toBe(12);
    for (let n = 1; n <= 12; n++) for (const cap of [1, 2, 4, 6]) if (n <= cap) expect(maxOf(countExpr(n, cap))).toBeLessThanOrEqual(cap);
  });

  it('builds a full d100 table with no gaps', () => {
    for (const terrain of ['forest', 'urban', 'underdark', 'arctic', 'waterborne', 'mountain'] as const) {
      for (const danger of DANGERS) {
        for (const level of [1, 5, 11, 17]) {
          const t = buildTable(SRD_POOL, terrain, danger, { level, size: 4 });
          expect(t.rows[0].from).toBe(1);
          expect(t.rows[t.rows.length - 1].to).toBe(100);
          for (let i = 1; i < t.rows.length; i++) expect(t.rows[i].from).toBe(t.rows[i - 1].to + 1);
          for (const r of t.rows.filter((x) => x.creature)) expect(xpFor(r.creature!.cr)).toBeLessThanOrEqual(budget({ level, size: 4 }, 'beyond'));
        }
      }
    }
  });

  it('scales creatures with the party', () => {
    const low = buildTable(SRD_POOL, 'forest', 'moderate', { level: 1, size: 4 });
    const high = buildTable(SRD_POOL, 'forest', 'moderate', { level: 15, size: 4 });
    const maxXp = (t: typeof low) => Math.max(...t.rows.filter((r) => r.creature).map((r) => xpFor(r.creature!.cr)));
    expect(maxXp(high)).toBeGreaterThan(maxXp(low));
    expect(low.rows.some((r) => r.creature?.type === 'dragon' && /Adult|Ancient/.test(r.creature.name))).toBe(false);
  });

  it('safer places have more peaceful results', () => {
    const share = (d: 'safe' | 'deadly') => buildTable(SRD_POOL, 'forest', d, { level: 3, size: 4 }).rows.filter((r) => r.kind === 'peaceful').reduce((a, r) => a + r.to - r.from + 1, 0);
    expect(share('safe')).toBeGreaterThan(50);
    expect(share('deadly')).toBeLessThan(10);
  });

  it('rolls a row, group size, attitude and distance', () => {
    const t = buildTable(SRD_POOL, 'forest', 'moderate', { level: 3, size: 4 });
    const first = rollOnTable(t, () => 0)!;
    expect(first.roll).toBe(1);
    expect(first.row.kind).toBe('creature');
    expect(first.count).toBeGreaterThanOrEqual(1);
    expect(first.attitude?.attitude).toBe('Hostile');
    expect(first.distanceFt).toBe(20); // 2d8 × 10 feet, both dice 1
    const last = rollOnTable(t, () => 0.999)!;
    expect(last.roll).toBe(100);
    expect(last.row.kind).toBe('peaceful');
  });

  it('splits weights exactly', () => {
    expect(apportion([1, 1, 1], 100).reduce((a, b) => a + b)).toBe(100);
    expect(apportion([0.001, 10], 100)[0]).toBe(1);
  });

  it('writes plurals', () => {
    expect(plural('Wolf')).toBe('Wolves');
    expect(plural('Swarm of Bats')).toBe('Swarms of Bats');
    expect(plural('Harpy')).toBe('Harpies');
    expect(plural('Warrior Infantry')).toBe('Warrior Infantry');
  });

  it('reads CR, environment and alignment from imported bestiaries', () => {
    const [c] = parse5eToolsBestiary({ monster: [{ name: 'Owlbear', source: 'XMM', size: ['L'], type: 'monstrosity', cr: '3', environment: ['forest'], alignment: ['U'] }] });
    expect(c).toMatchObject({ cr: '3', env: ['forest'], align: 'U' });
    const [d] = parse5eToolsBestiary({ monster: [{ name: 'Lich', size: ['M'], type: 'undead', cr: { cr: '21', xpLair: 1 }, alignment: ['N', 'E'] }] });
    expect(d).toMatchObject({ cr: '21', align: 'E' });
  });
});

describe('natural 20', () => {
  it('always finds an encounter, however safe the conditions', () => {
    expect(checkChance(19, -3)).toBeCloseTo(0.05);
  });
});

describe('plausibility', () => {
  const all = (terrain: Parameters<typeof buildTable>[1]) =>
    DANGERS.flatMap((d) => [1, 3, 5, 8, 11, 15, 20].flatMap((level) => buildTable(SRD_POOL, terrain, d, { level, size: 4 }).rows.filter((r) => r.creature)));

  it('keeps city folk and tame animals out of the wilds', () => {
    const names = new Set(['forest', 'arctic', 'mountain', 'desert'].flatMap((t) => all(t as 'forest').map((r) => r.creature!.name)));
    for (const n of ['Spy', 'Noble', 'Gladiator', 'Archmage', 'Assassin', 'Mule', 'Riding Horse', 'Commoner']) expect(names.has(n)).toBe(false);
  });

  it('brings only swimmers, fliers and pirates to a ship', () => {
    for (const r of all('waterborne')) {
      const c = r.creature!;
      expect(c.env.includes('underwater') || /[sf]/.test(c.flags ?? '') || /^Pirate/.test(c.name)).toBe(true);
    }
  });

  it('sends leaders with followers and solitary creatures alone', () => {
    const rows = ['forest', 'grassland', 'hill', 'urban', 'underdark', 'waterborne'].flatMap((t) => all(t as 'forest'));
    for (const r of rows) {
      const c = r.creature!;
      if (FOLLOWERS[c.name] || maxGroup(c) === 1) expect(r.count).toBe('1');
      expect(maxOf(r.count!)).toBeLessThanOrEqual(Math.max(maxGroup(c), maxGroup(c) >= 12 ? 20 : 0));
    }
    expect(rows.some((r) => r.followers)).toBe(true);
    expect(maxGroup(find('Bulette'))).toBe(1);
    expect(maxGroup(find('Druid'))).toBe(3);
  });

  it('keeps legendary creatures rare and never leaves a table empty', () => {
    for (const t of ['arctic', 'grassland', 'forest'] as const) {
      const tb = buildTable(SRD_POOL, t, 'moderate', { level: 20, size: 4 });
      expect(tb.rows.some((r) => r.creature)).toBe(true);
    }
    const mid = buildTable(SRD_POOL, 'hill', 'moderate', { level: 11, size: 4 });
    const legendary = mid.rows.filter((r) => r.creature?.flags?.includes('L')).reduce((a, r) => a + r.to - r.from + 1, 0);
    expect(legendary).toBeLessThan(15);
  });

  it('keeps groups within the danger level budget outside deadly areas', () => {
    for (const d of ['low', 'moderate', 'high'] as const)
      for (const level of [1, 5, 11]) for (const r of buildTable(SRD_POOL, 'forest', d, { level, size: 4 }).rows) expect(r.difficulty).not.toBe('beyond');
  });
});

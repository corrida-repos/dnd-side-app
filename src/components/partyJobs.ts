import * as E from '../state/engine';
import type { Character, State } from '../state/types';
import { watchCapacity, watchMinutes } from '../rules/watch';
import { HUNTING_TRAP } from '../rules/gear';
import { NAVIGATOR } from '../rules/tools';
import { PROJECT_KIND_LABEL, isSoloWork } from '../rules/crafting';
import { MARCH_WRITING_DC, marchWork } from '../rules/marchWork';

/** Where the party is, which decides which jobs make sense right now. */
export type JobGroup = 'road' | 'camp' | 'town';

export const JOB_GROUP_LABEL: Record<JobGroup, string> = {
  road: 'On the road',
  camp: 'Making camp',
  town: 'Downtime in town',
};

export interface JobPick {
  id: string;
  name: string;
  /** Why they suit it, e.g. "Survival +6, Navigator's Tools". */
  note: string;
  /** Already doing another job. */
  busy: boolean;
}

export interface PartyJob {
  id: string;
  group: JobGroup;
  title: string;
  /** What it's for and the rule behind it. */
  what: string;
  source: '2024 PHB' | '2024 DMG' | 'Table rule';
  /** open: nobody has it and it matters; covered: someone has it; optional: worth doing if hands are free. */
  status: 'open' | 'covered' | 'optional';
  /** Several people can share it (the work splits, or each one adds to it). */
  shared: boolean;
  /** Who is on it now. */
  holders: { id: string; name: string }[];
  /** The best people to take it, free hands first. Empty when nobody can. */
  picks: JobPick[];
  /** Short progress, e.g. "3 of 4 watches covered". */
  progress?: string;
  /** Why nobody can do it, when that's the case. */
  blocked?: string;
  tab: string;
}

export interface Hand {
  id: string;
  name: string;
  /** What they're doing now. */
  duties: string[];
  /** Why they can't take a job at all (dying, imprisoned...). */
  unable?: string;
}

export interface JobBoard {
  /** Groups that apply right now, most relevant first. */
  groups: JobGroup[];
  jobs: PartyJob[];
  hands: Hand[];
}

const pcs = (s: State) => s.characters.filter((c) => c.kind === 'pc');

/** Why a character can't take on any job right now, or null when they can. */
export function unableReason(s: State, c: Character): string | null {
  if (c.diedAt != null) return 'dead';
  if (!E.alive(c)) return 'Exhaustion 6';
  if (c.dying) return 'dying';
  if (c.stable || c.hp <= 0) return 'unconscious';
  if (s.debts.some((d) => d.debtorId === c.id && d.imprisoned)) return "in debtors' prison";
  return null;
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
const survivalNote = (c: Character) => `Survival ${signed(c.survival - 2 * c.exhaustion)}`;

/**
 * The party's shared jobs right now: who has each one, whether it can be split, and who would do it best.
 * Each character's current duties come with it, so it's plain who has free hands.
 */
export function jobBoard(s: State): JobBoard {
  const able = pcs(s).filter((c) => !unableReason(s, c));
  // Duties by when they happen: travel by day, watches at night, downtime in town. Only same-time duties clash.
  const duties = new Map<string, { text: string; when: JobGroup | 'night' }[]>(pcs(s).map((c) => [c.id, []]));
  const addDuty = (id: string, text: string, when: JobGroup | 'night') => duties.get(id)?.push({ text, when });
  const name = (id: string) => E.charById(s, id)?.name ?? '?';
  const jobs: PartyJob[] = [];

  const town = s.place.settlement;
  const downtime = E.inDowntime(s);
  const journey = s.journey.some((j) => !j.done);
  const groups: JobGroup[] = town ? (downtime ? ['town'] : ['town', 'road']) : journey || s.restStart == null ? ['road', 'camp'] : ['camp', 'road'];

  // ---- road
  const navDC = E.currentNavigationDC(s).dc;
  const navId = s.travel.navigatorId && able.some((c) => c.id === s.travel.navigatorId) ? s.travel.navigatorId : null;
  if (navId) addDuty(navId, 'Navigating', 'road');
  const foragers = (s.travel.foragerIds ?? []).filter((id) => able.some((c) => c.id === id));
  for (const id of foragers) addDuty(id, 'Foraging on the road', 'road');

  // Hand-held projects worked on the march (table rule): only for those doing nothing but walking.
  const marching = s.settings.workWhileMarching && (!town || journey) ? s.projects.filter((p) => marchWork(p).ok && !p.done && !p.awaitingOutcome) : [];
  for (const p of marching) for (const c of E.marchWorkers(s, p, navId, foragers)) addDuty(c.id, `${p.name || PROJECT_KIND_LABEL[p.kind]} while marching${marchWork(p).concentration ? ' (keeping concentration)' : ''}`, 'road');

  // ---- camp: watches
  const load = E.watchLoad(s);
  const watchLen = watchMinutes(s.watchPlan.count);
  const slots = s.watchPlan.slots.slice(0, s.watchPlan.count);
  for (const c of able) {
    const n = slots.filter((sl) => sl.includes(c.id)).length;
    if (n) addDuty(c.id, `${n} watch${n > 1 ? 'es' : ''} tonight`, 'night');
  }

  // ---- town: projects, taming, rituals
  for (const p of s.projects.filter((x) => !x.done)) for (const id of p.charIds) addDuty(id, p.name || PROJECT_KIND_LABEL[p.kind], 'town');
  for (const t of (s.taming ?? []).filter((x) => x.stage !== 'tamed' || x.training)) addDuty(t.tamerId, `${t.stage === 'tamed' ? 'Training' : 'Taming'} ${t.name}`, 'town');
  for (const r of s.rituals.filter((x) => !x.permanent && x.casterId)) addDuty(r.casterId!, `Daily ${r.spell} at ${r.place}`, 'town');

  /** Busy with something at the same time as a job in this group (camp chores happen while the road jobs pause). */
  const busyIn = (id: string, g: JobGroup | 'night') => (duties.get(id) ?? []).some((d) => d.when === g);
  let when: JobGroup | 'night' = 'road';
  const busy = (id: string) => busyIn(id, when);
  /** Rank people for a job: free hands first, then by how well they suit it. */
  const rank = (who: Character[], score: (c: Character) => number, note: (c: Character) => string, n = 3): JobPick[] =>
    [...who]
      .sort((a, b) => Number(busy(a.id)) - Number(busy(b.id)) || score(b) - score(a))
      .slice(0, n)
      .map((c) => ({ id: c.id, name: c.name, note: note(c), busy: busy(c.id) }));
  const bySurvival = (who: Character[] = able, n = 3) => rank(who, (c) => c.survival - 2 * c.exhaustion, survivalNote, n);

  // ---- road jobs
  when = 'road';
  if (!town || journey) {
    if (s.settings.navigation && (navDC != null || journey)) {
      const tools = (c: Character) => c.inventory.some((i) => NAVIGATOR.test(i.name));
      jobs.push({
        id: 'navigate',
        group: 'road',
        title: 'Navigator',
        what:
          navDC != null
            ? `One character makes the Wisdom (Survival) check against DC ${navDC} to keep the party from getting lost. Slow pace gives Advantage, Fast pace Disadvantage.`
            : 'Following a road, river or coast: no check now, but someone should lead once the party leaves it.',
        source: '2024 DMG',
        status: navId ? 'covered' : navDC != null ? 'open' : 'optional',
        shared: false,
        holders: navId ? [{ id: navId, name: name(navId) }] : [],
        picks: rank(able, (c) => c.survival - 2 * c.exhaustion + (tools(c) ? 2 : 0), (c) => `${survivalNote(c)}${tools(c) ? ", Navigator's Tools" : ''}`),
        blocked: able.length ? undefined : 'Nobody is able to.',
        tab: 'travel',
      });
    }
    for (const p of marching) {
      const on = E.marchWorkers(s, p, navId, foragers);
      const writing = !!marchWork(p).concentration;
      const tooFast = writing && s.travel.pace !== 'slow';
      const away = tooFast || (isSoloWork(p.kind) && on.length) ? [] : p.charIds.filter((id) => !on.some((c) => c.id === id) && able.some((c) => c.id === id));
      jobs.push({
        id: `march-${p.id}`,
        group: 'road',
        title: `${p.name || PROJECT_KIND_LABEL[p.kind]} on the march`,
        what: `${marchWork(p).why[0].toUpperCase()}${marchWork(p).why.slice(1)}, so it goes on while walking: each marching hour counts as half an hour of work. ${p.daysDone}/${p.daysRequired} workdays${p.marchWorkHours ? ` and ${p.marchWorkHours} h toward the next` : ''}.${marchWork(p).concentration ? ` Only at a slow pace. The writer makes a DC ${MARCH_WRITING_DC} Constitution save per leg, as for Concentration, or that leg’s work is spoiled; nobody holding a Concentration spell can write.` : ''}${away.length ? ` ${away.map(name).join(', ')} can’t work it now (navigating, foraging${marchWork(p).concentration ? ' or concentrating on a spell' : ''}).` : ''}`,
        source: 'Table rule',
        status: on.length ? 'covered' : 'optional',
        shared: !p.learnKind && !isSoloWork(p.kind),
        holders: on.map((c) => ({ id: c.id, name: c.name })),
        picks: [],
        blocked: on.length ? undefined : tooFast ? `Writing needs a slow pace; the party is set to ${s.travel.pace}.` : 'Nobody on it is free to work while walking.',
        tab: 'downtime',
      });
    }
    if (s.settings.foodAndWater) {
      jobs.push({
        id: 'forage',
        group: 'road',
        title: 'Forage while travelling',
        what: 'Each forager makes a Wisdom (Survival) check against the terrain’s DC for food and water as the party moves. Anyone can join; every forager rolls separately.',
        source: '2024 DMG',
        status: foragers.length ? 'covered' : 'optional',
        shared: true,
        holders: foragers.map((id) => ({ id, name: name(id) })),
        picks: bySurvival(able.filter((c) => !foragers.includes(c.id))),
        tab: 'travel',
      });
    }
  }

  // ---- camp jobs: watches clash only with other watches; daytime camp chores clash with nothing tracked
  when = 'night';
  if (!town) {
    const filled = slots.filter((sl) => sl.some((id) => able.some((c) => c.id === id))).length;
    const spare = able.filter((c) => (load[c.id] ?? 0) + watchLen <= watchCapacity(s.watchPlan.count, c.trance) * watchLen);
    jobs.push({
      id: 'watch',
      group: 'camp',
      title: 'Night watches',
      what: `The Long Rest is split into ${s.watchPlan.count} watches of ${watchLen / 60} hour${watchLen === 60 ? '' : 's'}. A Long Rest allows up to 2 hours of light activity such as standing watch (4 for those who trance).`,
      source: '2024 PHB',
      status: filled >= s.watchPlan.count ? 'covered' : 'open',
      shared: true,
      progress: `${filled} of ${s.watchPlan.count} watches covered`,
      holders: [...new Set(slots.flat())].filter((id) => able.some((c) => c.id === id)).map((id) => ({ id, name: name(id) })),
      picks: rank(spare, (c) => c.passivePerception + (c.darkvision ? 3 : 0), (c) => `Passive Perception ${c.passivePerception}${c.darkvision ? `, Darkvision ${c.darkvision} ft` : ''}${c.trance ? ', trances' : ''}`),
      blocked: filled < s.watchPlan.count && !spare.length ? 'Everyone able already stands as long as a Long Rest allows.' : undefined,
      tab: 'camp',
    });

    when = 'camp';
    if (!s.fire.lit && s.fire.fuelHours < 8) {
      jobs.push({
        id: 'wood',
        group: 'camp',
        title: 'Gather firewood',
        what: `${s.fire.fuelHours} hour(s) of fuel on hand. Each gatherer spends an hour and makes a Wisdom (Survival) check; several can gather at once and each adds fuel.`,
        source: 'Table rule',
        status: s.fire.fuelHours <= 0 ? 'open' : 'optional',
        shared: true,
        holders: [],
        picks: bySurvival(),
        tab: 'camp',
      });
    }
    if (!s.fire.lit && s.fire.fuelHours > 0) {
      const casters = E.fireSpellCasters(s).filter((x) => able.some((c) => c.id === x.c.id));
      const tinder = (c: Character) => c.inventory.some((i) => /tinderbox/i.test(i.name));
      jobs.push({
        id: 'light',
        group: 'camp',
        title: 'Light the fire',
        what: casters.length ? `${casters.map((x) => `${x.c.name} (${x.spell})`).join(', ')} can light it at once with a spell.` : 'A Tinderbox lights it in an action; without one it takes longer.',
        source: '2024 PHB',
        status: 'optional',
        shared: false,
        holders: [],
        picks: rank(able, (c) => (casters.some((x) => x.c.id === c.id) ? 20 : 0) + (tinder(c) ? 10 : 0) + c.survival, (c) => {
          const sp = casters.find((x) => x.c.id === c.id)?.spell;
          return sp ?? (tinder(c) ? 'Tinderbox' : survivalNote(c));
        }),
        tab: 'camp',
      });
    }
    if (s.settings.foodAndWater) {
      const cooks = (c: Character) => c.chef || c.cooksUtensils || c.inventory.some((i) => /cook'?s utensils/i.test(i.name));
      jobs.push({
        id: 'cook',
        group: 'camp',
        title: 'Cook a hot meal',
        what: `An hour over a lit fire feeds everyone half a day’s food from the stores.${s.stores.foodRawLb > 0 ? ` ${s.stores.foodRawLb} lb of raw food also waits to be cooked (table rule).` : ''}`,
        source: 'Table rule',
        status: s.stores.foodRawLb > 0 ? 'open' : 'optional',
        shared: false,
        holders: [],
        picks: rank(able, (c) => (c.chef ? 2 : 0) + (cooks(c) ? 1 : 0), (c) => (c.chef ? 'Chef feat' : cooks(c) ? "Cook's Utensils" : 'Anyone can')),
        blocked: s.fire.lit ? undefined : 'Light the fire first.',
        tab: 'camp',
      });
    }
    const dirty = s.stores.waterUnsafeGal > 0 || s.characters.some((c) => c.waterUnsafe);
    if (dirty) {
      const purifiers = able.filter((c) => E.canCastPurify(c, 'ritual').ok);
      jobs.push({
        id: 'purify',
        group: 'camp',
        title: 'Purify the water',
        what: purifiers.length
          ? 'Purify Food and Drink, cast as a ritual in 10 minutes, cleans everything in a 5-foot Sphere without a spell slot.'
          : 'Nobody can cast Purify Food and Drink as a ritual: boil it over the fire instead (needs a pot).',
        source: purifiers.length ? '2024 PHB' : 'Table rule',
        status: 'open',
        shared: false,
        holders: [],
        picks: purifiers.length ? rank(purifiers, () => 0, () => 'Purify Food and Drink (ritual)') : rank(able, () => 0, () => 'Boil it', 1),
        blocked: !purifiers.length && !s.fire.lit ? 'Light the fire first to boil it.' : undefined,
        tab: 'camp',
      });
    }
    const short = E.tentShortfall(s);
    if (short.length) {
      const job = E.makeshiftJob(s, 'leanTo');
      jobs.push({
        id: 'shelter',
        group: 'camp',
        title: 'Build a lean-to',
        what: `${short.map((c) => c.name).join(', ')} ${short.length > 1 ? 'have' : 'has'} no tent space tonight. ${'why' in job ? `Can't build one: ${job.why}.` : `A lean-to sleeps two (Survival DC ${job.dc}, ${job.minutes} min); builders can split up to make more.`}`,
        source: 'Table rule',
        status: 'open',
        shared: true,
        holders: [],
        picks: 'why' in job ? [] : bySurvival(),
        blocked: 'why' in job ? job.why : undefined,
        tab: 'camp',
      });
    }
    const trappers = able.filter((c) => c.inventory.some((i) => HUNTING_TRAP.test(i.name) && i.qty > 0));
    if (trappers.length && !(s.place.trapsSet ?? []).length) {
      jobs.push({
        id: 'traps',
        group: 'camp',
        title: 'Set hunting traps',
        what: 'Traps set on game trails near camp are checked when the party breaks camp. Each carrier sets their own.',
        source: '2024 PHB',
        status: 'optional',
        shared: true,
        holders: [],
        picks: rank(trappers, (c) => c.survival, (c) => `${c.inventory.filter((i) => HUNTING_TRAP.test(i.name)).reduce((a, i) => a + i.qty, 0)} trap(s)`),
        tab: 'camp',
      });
    }
  }

  // ---- town jobs
  when = 'town';
  if (town) {
    for (const p of s.projects.filter((x) => !x.done)) {
      const sharable = p.kind === 'nonmagical' || p.kind === 'potion' || p.kind === 'magic';
      const on = p.charIds.filter((id) => duties.has(id));
      jobs.push({
        id: `proj-${p.id}`,
        group: 'town',
        title: p.name || PROJECT_KIND_LABEL[p.kind],
        what: `${p.daysDone} of ${p.daysRequired} days done.${sharable ? ' Other crafters with the right proficiency can join and split the remaining days.' : ''}`,
        source: '2024 PHB',
        status: p.awaitingOutcome ? 'open' : 'covered',
        shared: sharable,
        progress: p.awaitingOutcome ? 'Done: roll the outcome' : undefined,
        holders: on.map((id) => ({ id, name: name(id) })),
        picks: sharable ? rank(able.filter((c) => !on.includes(c.id) && !busy(c.id)), () => 0, () => 'Free') : [],
        tab: 'downtime',
      });
    }
    for (const t of (s.taming ?? []).filter((x) => x.stage !== 'tamed' || x.training)) {
      const helpers = E.tameHelpers(s, t.tamerId).filter((h) => able.some((c) => c.id === h.id));
      jobs.push({
        id: `tame-${t.id}`,
        group: 'town',
        title: `${t.stage === 'tamed' ? 'Train' : 'Tame'} ${t.name}`,
        what: 'The tamer holds a session each day; anyone proficient in Animal Handling can Help.',
        source: 'Table rule',
        status: 'covered',
        shared: helpers.length > 0,
        holders: [{ id: t.tamerId, name: name(t.tamerId) }],
        picks: helpers.map((h) => ({ id: h.id, name: h.name, note: 'Animal Handling', busy: busy(h.id) })),
        tab: 'downtime',
      });
    }
    const idle = able.filter((c) => !busy(c.id));
    if (downtime && idle.length) {
      jobs.push({
        id: 'idle',
        group: 'town',
        title: 'Free for a downtime activity',
        what: 'Crafting, training, research, carousing, work or faction service: each character picks their own.',
        source: '2024 PHB',
        status: 'optional',
        shared: true,
        holders: [],
        picks: idle.map((c) => ({ id: c.id, name: c.name, note: 'Free', busy: false })),
        tab: 'downtime',
      });
    }
  }

  const order = { open: 0, covered: 1, optional: 2 };
  jobs.sort((a, b) => groups.indexOf(a.group) - groups.indexOf(b.group) || order[a.status] - order[b.status]);
  const hands: Hand[] = pcs(s).map((c) => ({ id: c.id, name: c.name, duties: (duties.get(c.id) ?? []).map((d) => d.text), unable: unableReason(s, c) ?? undefined }));
  return { groups, jobs, hands };
}

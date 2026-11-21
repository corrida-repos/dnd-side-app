import * as E from '../state/engine';
import { containerLoad } from '../state/engine';
import type { Character, State } from '../state/types';
import { foodNeedLb, waterNeedPints, exhaustionBreakdown } from '../rules/survival';
import { CONTAGIONS } from '../rules/contagion';
import { preparedCount, preparedLimit, isCaster } from '../rules/spells';
import { ATTUNE_AWAY_MINUTES } from '../rules/upkeep';
import { componentFor } from '../rules/components';
import { RESURRECTION_SPELLS } from '../rules/longterm';
import { LOAD_LABEL } from '../rules/encumbrance';
import { fmtGp } from '../rules/money';
import { formatDuration } from '../rules/calendar';

export interface PlayerItem {
  id: string;
  /** Needs action (a condition they suffer) or upkeep (routine maintenance). */
  kind: 'status' | 'upkeep';
  tone: 'bad' | 'warn' | 'info';
  text: string;
  /** What fixes it, in a few words. */
  fix?: string;
  tab: string;
  dmOnly?: boolean;
}

/** Everything one character is suffering or should look after, outside the adventure itself. */
export function playerItems(s: State, c: Character): PlayerItem[] {
  const out: PlayerItem[] = [];
  const now = E.absNow(s);
  const add = (i: Omit<PlayerItem, 'id'> & { id?: string }) => out.push({ id: `${c.id}-${i.id ?? out.length}`, ...i });
  const status = (tone: PlayerItem['tone'], text: string, fix: string | undefined, tab: string, id?: string) => add({ kind: 'status', tone, text, fix, tab, id });
  const upkeep = (tone: PlayerItem['tone'], text: string, fix: string | undefined, tab: string, id?: string) => add({ kind: 'upkeep', tone, text, fix, tab, id });

  // ---- conditions
  if (c.diedAt != null) {
    const dead = E.deadFor(s, c) ?? 0;
    const still = RESURRECTION_SPELLS.filter((r) => dead <= r.limit).map((r) => r.spell);
    status('bad', `Dead for ${formatDuration(Math.max(1, dead))}`, still.length ? `Still possible: ${still.join(', ')}. Gentle Repose stops the clock.` : 'Beyond the reach of revival spells.', 'world', 'dead');
    return out;
  }
  if (c.dying) status('bad', `Dying (${c.deathSuccesses} successes, ${c.deathFailures} failures)`, 'Death saves each turn; Medicine DC 10 or any healing stabilizes.', 'party', 'dying');
  else if (c.stable) status('warn', 'Unconscious but stable', c.wakesAt != null ? `Wakes with 1 HP in ${formatDuration(Math.max(0, c.wakesAt - now))}, or with any healing.` : 'Any healing wakes them.', 'party', 'stable');
  for (const p of exhaustionBreakdown(c)) {
    status(c.exhaustion >= 4 ? 'bad' : 'warn', `Exhaustion ×${p.count} from ${p.label}`, p.locked ? (p.cause === 'malnutrition' ? 'Eat a full day’s food before a Long Rest can remove it.' : p.cause === 'dehydration' ? 'Drink a full day’s water before a Long Rest can remove it.' : 'Lasts until the disease ends.') : 'Each Long Rest removes one level; Greater Restoration removes one.', 'party', `exh-${p.cause}`);
  }
  if (c.exhaustion > 0) status('info', `Exhaustion level ${c.exhaustion}: −${2 * c.exhaustion} to D20 Tests, −${5 * c.exhaustion} ft Speed`, undefined, 'party', 'exh-total');
  if (c.poisonedUntil != null && c.poisonedUntil > now) status('warn', `Poisoned (${c.sickFrom ?? 'tainted water'}) for ${formatDuration(c.poisonedUntil - now)}`, 'Lesser Restoration, or wait it out.', 'effects', 'poisoned-water');
  if (c.sick) status('warn', `Sick${c.sickFrom ? ` from ${c.sickFrom}` : ''}`, 'Passes after the next Long Rest.', 'camp', 'sick');
  for (const x of c.contagions ?? []) {
    const info = CONTAGIONS[x.kind];
    if (!x.onset) status('info', `Carrying ${info.name} (no symptoms yet: ${formatDuration(Math.max(0, x.onsetAt - now))})`, 'The player doesn’t know yet.', 'effects', `inc-${x.id}`);
    else status('bad', `${info.name}${x.kind === 'cackle' ? ` (${x.successes}/3 saves)` : ''}${x.kind === 'sightRot' ? (x.suppressedUntil && x.suppressedUntil > now ? ' (held off by ointment)' : ': Blinded') : ''}`, info.fighting, 'effects', `con-${x.id}`);
    if (!x.onset) out[out.length - 1].dmOnly = true;
  }
  for (const t of c.poisonTimers ?? []) {
    if (t.name === 'Midnight Tears') add({ kind: 'status', tone: 'info', text: 'Midnight Tears waiting in their blood', fix: 'Strikes at midnight unless Poisoned is ended first.', tab: 'effects', dmOnly: true, id: `mt-${t.id}` });
    else status('bad', `${t.name}: ${t.successes}/7 daily saves`, 'Damage can’t be healed while Poisoned; Lesser Restoration ends it.', 'effects', `pt-${t.id}`);
  }
  for (const e of s.effects.filter((x) => x.targetIds.includes(c.id))) {
    const left = e.endsAt != null ? formatDuration(Math.max(0, e.endsAt - now)) : null;
    if (e.kind === 'curse') status('bad', `Cursed: ${e.name}`, 'Remove Curse or Greater Restoration.', 'effects', `fx-${e.id}`);
    else if (/jail|prison/i.test(e.name)) status('bad', e.name, e.endsAt ? `Free in ${left}.` : 'Free when the debt is paid.', 'money', `fx-${e.id}`);
    else if (/^Poisoned/.test(e.name)) status('warn', `${e.name}${left ? ` (${left})` : ''}`, 'Lesser Restoration ends it.', 'effects', `fx-${e.id}`);
    else if (e.kind === 'other' && e.endsAt == null) status('warn', e.name, e.notes || undefined, 'effects', `fx-${e.id}`);
  }
  if ((c.revivalPenalty ?? 0) > 0) status('warn', `Back from the dead: −${c.revivalPenalty} to D20 Tests`, 'Eases by 1 with each Long Rest.', 'party', 'revival');
  if (c.hp > 0 && c.hp < c.maxHp) status(c.hp <= c.maxHp / 3 ? 'warn' : 'info', `HP ${c.hp}/${c.maxHp}`, c.hitDiceSpent < c.level ? `Spend Hit Point Dice on a Short Rest (${c.level - c.hitDiceSpent} left), or Long Rest.` : 'No Hit Point Dice left: a Long Rest restores everything.', 'gear', 'hp');
  const load = E.carriedLoad(s, c);
  if (load.level !== 'light') status(load.level === 'over' || load.level === 'heavy' ? 'bad' : 'warn', `${LOAD_LABEL[load.level]}: ${Math.round(load.total)} lb carried`, 'Drop or stash gear, or hand it to a porter or mount.', 'gear', 'load');
  if (c.stress > 0 || c.fear > 0) status('info', [c.stress > 0 && `Stress ${c.stress}`, c.fear > 0 && `Fear ${c.fear}`].filter(Boolean).join(', '), 'Eases with Long Rests.', 'party', 'stress');

  // ---- upkeep
  const hot = s.weather.high >= 100;
  if (c.needsFood && c.ateLbToday < foodNeedLb(c)) upkeep(s.minutes % 1440 >= 18 * 60 ? 'warn' : 'info', `Hasn’t eaten enough today (${c.ateLbToday}/${foodNeedLb(c)} lb)`, c.rationsLb > 0 ? 'Eat from their rations.' : 'Out of rations: forage, hunt or buy food.', 'camp', 'food');
  const need = waterNeedPints(c, hot, s.settings.doubleWaterInHeat);
  if (c.needsWater && c.drankPintsToday < need) upkeep(s.minutes % 1440 >= 18 * 60 ? 'warn' : 'info', `Hasn’t drunk enough today (${c.drankPintsToday}/${need} pt)`, c.waterPints > 0 ? 'Drink from their waterskin.' : 'Empty waterskin: find or purify water.', 'camp', 'water');
  if (c.needsFood && c.rationsLb < foodNeedLb(c) * 2) upkeep(c.rationsLb <= 0 ? 'bad' : 'warn', `Food for ${Math.floor(c.rationsLb / foodNeedLb(c))} day(s) left (${c.rationsLb} lb)`, 'Buy rations, forage or hunt.', 'camp', 'rations');
  if (c.needsWater && c.waterPints < need / 2) upkeep(c.waterPints <= 0 ? 'bad' : 'warn', `Waterskin nearly empty (${c.waterPints}/${c.waterCapacityPints} pt)`, 'Refill at a water source.', 'camp', 'skin');
  if (c.waterUnsafe) upkeep('warn', 'Carrying unsafe water', 'Boil it or cast Purify Food and Drink before drinking.', 'camp', 'unsafe');
  if (s.settings.coldNights && s.weather.low <= s.settings.coldNightF && !E.hasWarmCover(c)) upkeep('warn', `No warm cover for a cold night (low ${s.weather.low}°F)`, 'A bedroll, blanket, cold weather gear or a fire.', 'camp', 'cold');
  if (isCaster(c.className)) {
    const lim = preparedLimit(c);
    const n = preparedCount(c);
    if (lim != null && n < lim) upkeep('warn', `Prepare spells: ${n}/${lim} prepared`, c.prepOpen ? 'Any prepared spell can be changed now, after the Long Rest.' : 'Prepare them on the Spells & Morning tab.', 'morning', 'unprep');
  }
  for (const it of c.items) {
    if (it.attuned && it.awaySince != null) upkeep('bad', `Attuned ${it.name} is out of reach`, `Attunement ends in ${formatDuration(Math.max(0, ATTUNE_AWAY_MINUTES - (now - it.awaySince)))} unless it’s within 100 ft.`, 'gear', `away-${it.id}`);
  }
  const ammo = c.inventory.filter((i) => (i.ammo?.spent ?? 0) > 0);
  if (ammo.length) upkeep('info', `Ammunition to recover: ${ammo.map((i) => `${i.ammo!.spent} ${i.name}`).join(', ')}`, 'Half can be found with a minute’s search after the fight.', 'gear', 'ammo');
  for (const e of s.effects.filter((x) => x.targetIds.includes(c.id) && x.kind === 'gift' && x.endsAt != null && x.endsAt - now < 24 * 60 && x.endsAt > now)) upkeep('info', `${e.name} fades in ${formatDuration(e.endsAt! - now)}`, 'Use it or lose it.', 'effects', `gift-${e.id}`);
  for (const d of s.debts.filter((x) => x.debtorId === c.id)) upkeep(d.dueDay < s.dayIndex ? 'bad' : 'warn', `Owes ${d.creditor} ${fmtGp(d.owed)}${d.dueDay < s.dayIndex ? ' (overdue)' : `, due in ${d.dueDay - s.dayIndex} day(s)`}`, 'Pay on the Money & Shop tab.', 'money', `debt-${d.id}`);
  for (const p of s.projects.filter((x) => x.charIds.includes(c.id) && x.awaitingOutcome)) upkeep('warn', `${p.name} is done: roll the outcome`, undefined, 'downtime', `proj-${p.id}`);

  // ---- inventory that needs dealing with
  for (const box of c.inventory.filter((i) => i.container && i.container.capacityLb != null)) {
    const held = containerLoad(c.inventory, box.id);
    if (held > box.container!.capacityLb!) upkeep('warn', `${box.name} is overfilled (${held}/${box.container!.capacityLb} lb)`, 'The excess won’t fit: repack it or carry it loose.', 'gear', `box-${box.id}`);
  }
  for (const box of c.inventory.filter((i) => i.container?.weightless)) {
    const parent = c.inventory.find((p2) => p2.id === box.containerId);
    if (parent?.container?.weightless) upkeep('bad', `${box.name} is packed inside ${parent.name}`, 'Putting one extradimensional space inside another destroys both and tears a gate to the Astral Plane (DMG). Take it out.', 'gear', `nest-${box.id}`);
  }
  for (const it of c.inventory.filter((i) => i.ammo)) {
    const left = it.qty - (it.ammo?.spent ?? 0);
    if (left <= 5) upkeep(left <= 0 ? 'bad' : 'warn', left <= 0 ? `Out of ${it.name}` : `Only ${left} ${it.name} left`, 'Recover spent ammunition, buy or craft more.', 'gear', `low-${it.id}`);
  }
  if (c.inventory.some((i) => /^reliquary talisman \(spent\)$/i.test(i.name))) upkeep('info', 'The Reliquary talisman is spent', 'Return it to the Reliquary and give a Harvest order to recharge it.', 'bastions', 'talisman');
  if (s.settings.trackComponents) {
    for (const sp of c.spells.filter((x) => x.prepared || x.alwaysPrepared)) {
      const comp = componentFor(sp.name);
      if (comp && E.componentValue(c, comp) < comp.gp && !c.inventory.some((i) => /^reliquary talisman$/i.test(i.name) && comp.gp <= 1000)) upkeep('warn', `Can’t cast ${sp.name}: needs ${comp.what}`, `Carrying ${fmtGp(E.componentValue(c, comp))} worth. Buy it (Money & Shop) and add it with its value.`, 'money', `comp-${sp.name}`);
    }
  }
  for (const it of c.items.filter((i) => i.attuned && (i.clues ?? []).some((k) => k.kind === 'curse' && !k.known))) add({ kind: 'status', tone: 'warn', text: `Attuned to a cursed ${it.name}`, fix: 'The curse isn’t known yet; attunement can’t be ended until Remove Curse.', tab: 'gear', dmOnly: true, id: `curse-${it.id}` });

  const rank = { bad: 0, warn: 1, info: 2 };
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]);
}

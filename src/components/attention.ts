import * as E from '../state/engine';
import type { State } from '../state/types';
import { foodNeedLb, waterNeedPints } from '../rules/survival';
import { CONTAGIONS } from '../rules/contagion';
import { fmtGp } from '../rules/money';
import { formatDuration } from '../rules/calendar';

export interface AttentionItem {
  id: string;
  tone: 'bad' | 'warn' | 'info';
  text: string;
  /** Where to handle it. */
  tab: string;
  /** Only the DM should know (hidden incubation, poisons waiting for midnight). */
  dmOnly?: boolean;
}

/** Everything waiting on the DM right now, most urgent first. */
export function attentionItems(s: State): AttentionItem[] {
  const out: AttentionItem[] = [];
  const now = E.absNow(s);
  const add = (i: AttentionItem) => out.push(i);

  if (s.pending.length) add({ id: 'saves', tone: 'bad', text: `${s.pending.length} saving throw${s.pending.length > 1 ? 's' : ''} to roll`, tab: 'overview' });
  for (const c of s.characters) {
    if (c.diedAt == null && c.dying) add({ id: `dying-${c.id}`, tone: 'bad', text: `${c.name} is dying: roll death saves`, tab: 'party' });
    else if (c.diedAt == null && c.stable) add({ id: `stable-${c.id}`, tone: 'info', text: `${c.name} is unconscious and stable${c.wakesAt != null ? `, wakes in ${formatDuration(Math.max(0, c.wakesAt - now))}` : ''}`, tab: 'party' });
    if (c.diedAt == null && c.exhaustion >= 3) add({ id: `exh-${c.id}`, tone: c.exhaustion >= 5 ? 'bad' : 'warn', text: `${c.name} is at Exhaustion ${c.exhaustion}`, tab: 'party' });
  }

  // Survival late in the day: anyone who still hasn't eaten or drunk enough.
  if (s.minutes % 1440 >= 18 * 60) {
    const hot = s.weather.high >= 100;
    const hungry = s.characters.filter((c) => c.diedAt == null && c.needsFood && c.ateLbToday < foodNeedLb(c)).map((c) => c.name);
    const thirsty = s.characters.filter((c) => c.diedAt == null && c.needsWater && c.drankPintsToday < waterNeedPints(c, hot, s.settings.doubleWaterInHeat)).map((c) => c.name);
    if (hungry.length) add({ id: 'food', tone: 'warn', text: `Not fed today: ${hungry.join(', ')}`, tab: 'camp' });
    if (thirsty.length) add({ id: 'water', tone: 'warn', text: `Not enough water today: ${thirsty.join(', ')}`, tab: 'camp' });
  }

  if (s.fire.lit && s.fire.fuelHours <= 1) add({ id: 'fire', tone: 'warn', text: `The campfire has ${s.fire.fuelHours} hour of fuel left`, tab: 'camp' });
  for (const e of s.effects) {
    if (e.kind === 'light' && e.endsAt != null && e.endsAt - now <= 30 && e.endsAt > now) add({ id: `light-${e.id}`, tone: 'warn', text: `${e.name} goes out in ${formatDuration(e.endsAt - now)}`, tab: 'effects' });
  }

  for (const st of s.journey) {
    const open = (st.obstacles ?? []).filter((o) => !o.resolved);
    if (!st.done && open.length) add({ id: `obst-${st.id}`, tone: 'warn', text: `${st.name}: ${open.length} obstacle(s) to resolve`, tab: 'travel' });
  }

  for (const b of s.bastions) {
    if (b.abandoned) continue;
    if (b.decision) add({ id: `dec-${b.id}`, tone: 'warn', text: `${b.name}: an event needs your decision`, tab: 'bastions' });
    const due = E.turnsDue(s, b);
    if (due > 0) add({ id: `turn-${b.id}`, tone: 'info', text: `${b.name}: ${due} Bastion turn${due > 1 ? 's' : ''} due`, tab: 'bastions' });
  }
  for (const m of s.dispatches) {
    if (!m.delivered && m.arrivesAt - now <= 6 * 60) add({ id: `msg-${m.id}`, tone: 'info', text: `${m.direction === 'orders' ? 'Orders reach' : 'A report from'} ${s.bastions.find((b) => b.id === m.bastionId)?.name ?? 'a Bastion'} in ${formatDuration(Math.max(1, m.arrivesAt - now))}`, tab: 'bastions' });
  }

  for (const p of s.projects) if (p.awaitingOutcome) add({ id: `act-${p.id}`, tone: 'warn', text: `${p.name} is done: roll its outcome`, tab: 'downtime' });
  for (const b of s.businesses) if (b.daysWorked >= 30) add({ id: `biz-${b.id}`, tone: 'info', text: `${b.name}: 30 days worked, roll for the period`, tab: 'downtime' });

  for (const d of s.debts) {
    const c = E.charById(s, d.debtorId);
    const left = d.dueDay - s.dayIndex;
    if (d.imprisoned) add({ id: `debt-${d.id}`, tone: 'bad', text: `${c?.name} is in debtors' prison (${fmtGp(d.owed)} owed)`, tab: 'money' });
    else if (left < 0) add({ id: `debt-${d.id}`, tone: 'bad', text: `${c?.name}'s debt to ${d.creditor} is overdue (${fmtGp(d.owed)})`, tab: 'money' });
    else if (left <= 3) add({ id: `debt-${d.id}`, tone: 'warn', text: `${c?.name}'s debt to ${d.creditor} is due in ${left} day(s)`, tab: 'money' });
  }

  for (const r of s.rivals) if (r.active && r.pressure >= 3) add({ id: `rival-${r.id}`, tone: r.pressure >= 6 ? 'bad' : 'warn', text: `${r.name} is ready to act in person (pressure ${r.pressure})`, tab: 'world' });

  // Secrets only the DM should see.
  for (const c of s.characters) {
    for (const x of c.contagions ?? []) if (!x.onset) add({ id: `inc-${x.id}`, tone: 'info', text: `${c.name} is incubating ${CONTAGIONS[x.kind].name}: symptoms in ${formatDuration(Math.max(0, x.onsetAt - now))}`, tab: 'effects', dmOnly: true });
    for (const t of c.poisonTimers ?? []) if (t.name === 'Midnight Tears') add({ id: `mt-${t.id}`, tone: 'info', text: `${c.name} has Midnight Tears in them: it strikes at midnight`, tab: 'effects', dmOnly: true });
  }

  const rank = { bad: 0, warn: 1, info: 2 };
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]);
}

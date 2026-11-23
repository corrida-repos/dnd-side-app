import * as E from '../state/engine';
import type { State } from '../state/types';
import { foodNeedLb, waterNeedPints } from '../rules/survival';
import { CONTAGIONS } from '../rules/contagion';
import { fmtGp } from '../rules/money';
import { formatDuration } from '../rules/calendar';
import { heatLevel } from '../rules/notoriety';
import { attitudeOf, NEGLECT_DAYS } from '../rules/contacts';

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
  if (s.settings.foodAndWater && s.minutes % 1440 >= 18 * 60) {
    const hot = s.weather.high >= 100;
    const hungry = s.characters.filter((c) => c.diedAt == null && c.needsFood && c.ateLbToday < foodNeedLb(c)).map((c) => c.name);
    const thirsty = s.characters.filter((c) => c.diedAt == null && c.needsWater && c.drankPintsToday < waterNeedPints(c, hot, s.settings.doubleWaterInHeat)).map((c) => c.name);
    if (hungry.length) add({ id: 'food', tone: 'warn', text: `Not fed today: ${hungry.join(', ')}`, tab: 'camp' });
    if (thirsty.length) add({ id: 'water', tone: 'warn', text: `Not enough water today: ${thirsty.join(', ')}`, tab: 'camp' });
  }

  if (s.settings.rawFoodRisk && s.stores.foodRawLb > 0) add({ id: 'raw', tone: 'warn', text: `${s.stores.foodRawLb} lb of raw food in the camp stores`, tab: 'camp' });
  if (s.stores.waterUnsafeGal > 0) add({ id: 'unsafe', tone: 'warn', text: `${s.stores.waterUnsafeGal} gal of unsafe water in the camp stores`, tab: 'camp' });
  for (const st of s.stashes) {
    if (st.capacityLb != null && E.stashLoad(st, s.settings.coinWeight) > st.capacityLb) add({ id: `stash-${st.id}`, tone: 'warn', text: `${st.name} is over capacity (${E.stashLoad(st, s.settings.coinWeight)}/${st.capacityLb} lb)`, tab: 'storage' });
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
  for (const p of s.projects) if (p.offers?.length) add({ id: `offer-${p.id}`, tone: 'warn', text: `${p.name}: an offer is waiting for an answer`, tab: 'downtime' });
  for (const b of s.businesses) if (b.daysWorked >= 30) add({ id: `biz-${b.id}`, tone: 'info', text: `${b.name}: 30 days worked, roll for the period`, tab: 'downtime' });

  for (const d of s.debts) {
    const c = E.charById(s, d.debtorId);
    const left = d.dueDay - s.dayIndex;
    if (d.imprisoned) add({ id: `debt-${d.id}`, tone: 'bad', text: `${c?.name} is in debtors' prison (${fmtGp(d.owed)} owed)`, tab: 'money' });
    else if (left < 0) add({ id: `debt-${d.id}`, tone: 'bad', text: `${c?.name}'s debt to ${d.creditor} is overdue (${fmtGp(d.owed)})`, tab: 'money' });
    else if (left <= 3) add({ id: `debt-${d.id}`, tone: 'warn', text: `${c?.name}'s debt to ${d.creditor} is due in ${left} day(s)`, tab: 'money' });
  }

  for (const c of s.characters) {
    if (c.diedAt != null) continue;
    for (const x of c.injuries ?? []) if (x.kind === 'festering' && x.lastTreatedDay !== s.dayIndex) add({ id: `fester-${x.id}`, tone: 'warn', text: `${c.name}'s festering wound hasn't been tended today (HP max −${x.hpLost})`, tab: 'effects' });
    for (const m of c.madness ?? []) if (m.tier === 'indefinite') add({ id: `mad-${m.id}`, tone: 'warn', text: `${c.name} suffers indefinite madness`, tab: 'effects' });
  }
  if (s.settings.duesAndTaxes) {
    for (const d of s.dues ?? []) if (d.active && d.nextDay - s.dayIndex <= 1) add({ id: `due-${d.id}`, tone: 'info', text: `${d.label} falls due at midnight`, tab: 'money' });
  }
  if (s.settings.notoriety) {
    for (const n of s.notoriety ?? []) {
      const here = s.place.settlement && n.place.trim().toLowerCase() === s.place.name.trim().toLowerCase();
      if (here && n.heat > 0) add({ id: `heat-${n.id}`, tone: 'bad', text: `The party is ${heatLevel(n.heat).label.toLowerCase()} here in ${n.place}`, tab: 'world' });
    }
  }
  if (s.settings.contactsFade) {
    for (const k of s.contacts ?? []) if (attitudeOf(k.bond) === 'friendly' && s.dayIndex - k.lastHeardDay >= NEGLECT_DAYS - 7) add({ id: `contact-${k.id}`, tone: 'info', text: `${k.name} hasn't heard from the party in ${s.dayIndex - k.lastHeardDay} days`, tab: 'world' });
  }
  for (const v of s.stashes) if (s.settings.gearWear && v.hullDamaged) add({ id: `hull-${v.id}`, tone: 'warn', text: `The ${v.name} is damaged: half speed until repaired at a dock`, tab: 'storage' });
  for (const n of s.news ?? []) if (!n.delivered && n.arrivesAt - now <= 24 * 60) add({ id: `news-${n.id}`, tone: 'info', text: `News from ${n.place || 'afar'} reaches the party in ${formatDuration(Math.max(1, n.arrivesAt - now))}`, tab: 'world', dmOnly: true });
  for (const r of s.rivals) if (r.active && r.pressure >= 3) add({ id: `rival-${r.id}`, tone: r.pressure >= 6 ? 'bad' : 'warn', text: `${r.name} is ready to act in person (pressure ${r.pressure})`, tab: 'world' });

  // Secrets only the DM should see.
  for (const c of s.characters) {
    for (const x of c.contagions ?? []) if (!x.onset) add({ id: `inc-${x.id}`, tone: 'info', text: `${c.name} is incubating ${CONTAGIONS[x.kind].name}: symptoms in ${formatDuration(Math.max(0, x.onsetAt - now))}`, tab: 'effects', dmOnly: true });
    for (const t of c.poisonTimers ?? []) if (t.name === 'Midnight Tears') add({ id: `mt-${t.id}`, tone: 'info', text: `${c.name} has Midnight Tears in them: it strikes at midnight`, tab: 'effects', dmOnly: true });
  }

  const rank = { bad: 0, warn: 1, info: 2 };
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]);
}

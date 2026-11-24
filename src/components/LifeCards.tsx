import { NpcProfile } from './NpcProfile';
import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { Card, Num, Pill, Select, Text, Toggle, Rule } from './common';
import type { Character, Stash } from '../state/types';
import { formatDuration } from '../rules/calendar';
import { fmtGp } from '../rules/money';
import { FESTERING_MEDICINE_DC, INJURIES, INJURY_MEDICINE_SUCCESSES, INJURY_REST_DAYS, type InjuryKind } from '../rules/injuries';
import { MADNESS, DEPENDS_ON_SOURCE, MADNESS_SAVE_DC, MADNESS_THRESHOLD, type MadnessTier } from '../rules/madness';
import { MAGIC_AGING, STAGE_LABEL } from '../rules/aging';
import { HULL_LIMIT, hullRepair } from '../rules/wear';
import { DUE_PRESETS, PERIOD_LABEL, type DueKind, type DuePeriod } from '../rules/dues';
import { BRIBE_GP_PER_HEAT, CRIMES, DISGUISE_NOTE, HEAT_LEVELS, RECOGNISED, heatLevel, jailDaysFor, type CrimeSeverity } from '../rules/notoriety';
import { ATTITUDE_LABEL, CONTACT_ROLES, FAVOR_COOLDOWN_DAYS, NEGLECT_DAYS, attitudeOf, favorDC } from '../rules/contacts';
import { COMMS, commCost, type CommMethod } from '../rules/comms';
import { LETTER_METHODS, NEWS_SPEED, POST_NOTE, type NewsRoute } from '../rules/letters';
import { WaysAround } from './WaysAround';

const pcsOf = (cs: Character[]) => cs.filter((c) => c.kind !== 'mount' && c.diedAt == null);
const toneOf = (a: string) => (a === 'friendly' ? 'good' : a === 'hostile' ? 'bad' : 'muted');

// ---------------------------------------------------------------- injuries

export function InjuryCard() {
  const s = useGame();
  const people = s.characters.filter((c) => E.alive(c));
  const [who, setWho] = useState('');
  const [kind, setKind] = useState<InjuryKind | 'roll'>('roll');
  const [why, setWhy] = useState('');
  const [healer, setHealer] = useState('');
  const [bonus, setBonus] = useState(0);
  const whoId = people.find((c) => c.id === who)?.id ?? people[0]?.id ?? '';
  const healerId = people.find((c) => c.id === healer)?.id ?? people[0]?.id ?? '';
  const hurt = people.filter((c) => (c.injuries ?? []).length > 0);
  return (
    <Card title="Lingering injuries">
      {hurt.length === 0 && <p className="muted small">No lingering injuries.</p>}
      <ul className="plain">
        {hurt.flatMap((c) =>
          (c.injuries ?? []).map((x) => {
            const info = INJURIES[x.kind];
            return (
              <li key={x.id} className="facility">
                <div className="armor-row">
                  <span>
                    <b>{c.name}</b>: {info.label} <span className="small muted">({x.why})</span>{' '}
                    {info.cure === 'magicOrRest' && <Pill tone="info">{x.restDays}/{INJURY_REST_DAYS} days of rest</Pill>}
                    {x.kind === 'festering' && <Pill tone="bad">HP max −{x.hpLost} · {x.medicine}/{INJURY_MEDICINE_SUCCESSES} Medicine</Pill>}
                  </span>
                </div>
                <p className="small">{info.effect}</p>
                <p className="small muted">{info.cureText}</p>
                <div className="btn-row tight">
                  {x.kind === 'festering' && (
                    <>
                      <Select label="Tended by" value={healerId} onChange={setHealer} options={people.map((p) => ({ value: p.id, label: p.name }))} />
                      <Num label="Wis (Medicine)" value={bonus} onChange={(v) => setBonus(Math.round(v))} width={2} />
                      <button className="small" disabled={x.lastTreatedDay === s.dayIndex} onClick={() => dispatch((st, cx) => E.treatInjury(st, cx, c.id, x.id, healerId, bonus))}>
                        {x.lastTreatedDay === s.dayIndex ? 'Tended today' : `Tend the wound (DC ${FESTERING_MEDICINE_DC})`}
                      </button>
                    </>
                  )}
                  {(info.cure === 'magic' || info.cure === 'magicOrRest' || info.cure === 'magicOrMedicine') && (
                    <button className="small" onClick={() => dispatch((st, cx) => E.healInjury(st, cx, c.id, x.id, 'magic'))}>
                      Magical healing
                    </button>
                  )}
                  {(info.cure === 'heal' || info.cure === 'none') && (
                    <button className="small" onClick={() => dispatch((st, cx) => E.healInjury(st, cx, c.id, x.id, 'heal'))}>
                      Heal
                    </button>
                  )}
                  <button className="small" onClick={() => dispatch((st, cx) => E.healInjury(st, cx, c.id, x.id, 'regenerate'))}>
                    Regenerate
                  </button>
                  <button className="small ghost" title="A prosthetic, a miracle, or the DM's ruling" onClick={() => dispatch((st, cx) => E.healInjury(st, cx, c.id, x.id, 'dm'))}>
                    Healed (DM)
                  </button>
                </div>
              </li>
            );
          }),
        )}
      </ul>
      <h3>New injury</h3>
      {!s.settings.lingeringInjuries && <p className="small warn-text">Lingering injuries are switched off (Settings → Level of detail).</p>}
      <div className="form-row">
        <Select label="Who" value={whoId} onChange={setWho} options={people.map((c) => ({ value: c.id, label: c.name }))} />
        <Select label="Injury" value={kind} onChange={setKind} options={[{ value: 'roll' as const, label: 'Roll d20' }, ...(Object.keys(INJURIES) as InjuryKind[]).map((k) => ({ value: k, label: `${INJURIES[k].range[0]}${INJURIES[k].range[1] !== INJURIES[k].range[0] ? `–${INJURIES[k].range[1]}` : ''}: ${INJURIES[k].label}` }))]} />
        <Text label="From" value={why} onChange={setWhy} placeholder="a critical hit" />
      </div>
      <button className="small" disabled={!whoId || !s.settings.lingeringInjuries} onClick={() => dispatch((st, cx) => E.addInjury(st, cx, whoId, kind === 'roll' ? null : kind, why.trim()))}>
        {kind === 'roll' ? 'Roll an injury' : 'Add injury'}
      </button>
      <Rule>
        Optional rule from the 2014 DMG (switch: {s.settings.lingeringInjuries ? 'on' : 'off'} in Settings → Level of detail). A creature gets a lingering injury when it takes a critical hit, drops to 0 HP, or fails a death save by 5 or more. Dropping to 0 HP and death saves of 4 or lower roll one automatically; roll a critical hit here. &quot;Ten days doing nothing but resting&quot; counts a day as a Long Rest after a day without travel. Cure Wounds, Healing Word and other healing spells cast on the character end the injuries that magical healing cures; Heal and Regenerate (6th level or higher) also remove scars, and Regenerate restores lost limbs and eyes.
      </Rule>
      <WaysAround topic="injuries" />
    </Card>
  );
}

// ---------------------------------------------------------------- madness

export function MadnessCard() {
  const s = useGame();
  const now = E.absNow(s);
  const people = s.characters.filter((c) => E.alive(c) && c.kind !== 'mount');
  const [who, setWho] = useState('');
  const [tier, setTier] = useState<MadnessTier>('long');
  const [why, setWhy] = useState('');
  const [effect, setEffect] = useState('');
  const whoId = people.find((c) => c.id === who)?.id ?? people[0]?.id ?? '';
  const mad = people.filter((c) => (c.madness ?? []).length > 0);
  return (
    <Card title="Madness">
      {mad.length === 0 && <p className="muted small">Everyone is in their right mind.</p>}
      <ul className="plain">
        {mad.flatMap((c) =>
          (c.madness ?? []).map((m) => (
            <li key={m.id} className="facility">
              <div className="armor-row">
                <span>
                  <b>{c.name}</b>: {MADNESS[m.tier].label} <span className="small muted">({m.why})</span> <Pill tone="bad">{m.endsAt == null ? 'until cured' : `${formatDuration(Math.max(0, m.endsAt - now))} left`}</Pill>
                </span>
              </div>
              <p className="small">{m.effect}</p>
              <p className="small muted">{MADNESS[m.tier].cure}</p>
              <div className="btn-row tight">
                {(m.tier === 'indefinite' ? ['Greater Restoration', 'Heal', 'Remove Curse', 'Dispel Evil and Good'] : ['Lesser Restoration', 'Greater Restoration']).map((sp) => (
                  <button key={sp} className={DEPENDS_ON_SOURCE.includes(sp) ? 'small ghost' : 'small'} title={DEPENDS_ON_SOURCE.includes(sp) ? 'Only if the source of the madness allows it (the DM decides)' : undefined} onClick={() => dispatch((st, cx) => E.spellOnTarget(st, cx, sp, c.id))}>
                    {sp}{DEPENDS_ON_SOURCE.includes(sp) ? ' (if the source allows)' : ''}
                  </button>
                ))}
                <button className="small ghost" onClick={() => dispatch((st, cx) => E.cureMadness(st, cx, c.id, m.id, ''))}>
                  Over (DM)
                </button>
              </div>
            </li>
          )),
        )}
      </ul>
      <h3>Madness strikes</h3>
      {!s.settings.madness && <p className="small warn-text">Madness is switched off (Settings → Level of detail).</p>}
      <div className="form-row">
        <Select label="Who" value={whoId} onChange={setWho} options={people.map((c) => ({ value: c.id, label: c.name }))} />
        <Select label="Kind" value={tier} onChange={setTier} options={(Object.keys(MADNESS) as MadnessTier[]).map((t) => ({ value: t, label: `${MADNESS[t].label} (${MADNESS[t].durationText})` }))} />
        <Text label="Cause" value={why} onChange={setWhy} placeholder="a glimpse of the Far Realm" />
      </div>
      <Text label="Effect (blank: roll d100 on the table)" value={effect} onChange={setEffect} wide placeholder={MADNESS[tier].effects[0].text} />
      <button className="small" disabled={!whoId || !s.settings.madness} onClick={() => (dispatch((st, cx) => E.addMadness(st, cx, whoId, tier, why.trim(), effect.trim() || undefined)), setEffect(''))}>
        Apply madness
      </button>
      <Rule>
        Optional rule from the 2014 DMG (also in the SRD 5.1), switch: {s.settings.madness ? 'on' : 'off'}. The DM decides when madness strikes, usually after a failed save against a madness-inducing effect. Short-term madness lasts 1d10 minutes, long-term madness 1d10 × 10 hours, indefinite madness until cured; effects are rolled on the d100 tables. Lesser Restoration ends short- and long-term madness, Greater Restoration ends indefinite madness, and Remove Curse or Dispel Evil and Good may work depending on the source. Calm Emotions suppresses madness while it lasts. Table rules: when Stress or Fear reaches {MADNESS_THRESHOLD}, the character makes a DC {MADNESS_SAVE_DC} Wisdom save or suffers long-term madness; Heal ends any madness.
      </Rule>
      <WaysAround topic="madness" />
    </Card>
  );
}

// ---------------------------------------------------------------- ages and birthdays

function AgeRow({ c }: { c: Character }) {
  const s = useGame();
  const a = E.characterAge(s, c);
  const [age, setAge] = useState(a?.age ?? 25);
  const [month, setMonth] = useState(String(c.birthday?.monthIndex ?? 0));
  const [day, setDay] = useState(c.birthday?.day ?? 1);
  const [magic, setMagic] = useState('longevity');
  const [years, setYears] = useState(10);
  const preset = MAGIC_AGING.find((m) => m.id === magic)!;
  return (
    <li className="facility">
      <div className="armor-row">
        <span>
          <b>{c.name}</b> <span className="small muted">({c.species || 'species not set'})</span>{' '}
          {a ? (
            <>
              <Pill tone="info">{a.age} years</Pill> <Pill tone={a.stage === 'old' || a.stage === 'venerable' ? 'warn' : 'muted'}>{STAGE_LABEL[a.stage]}</Pill>{' '}
              <span className="small muted">
                lifespan about {a.life.span} ({a.life.name}){c.birthday ? `, birthday ${c.birthday.day} ${s.calendar.months[c.birthday.monthIndex]?.name ?? ''}` : ''}
                {c.magicYears ? `, ${c.magicYears > 0 ? '+' : ''}${c.magicYears} years by magic` : ''}
                {c.slowAgingSince != null ? ', ages a year per ten' : ''}
              </span>
            </>
          ) : (
            <span className="small muted">Age not recorded.</span>
          )}
        </span>
      </div>
      <details>
        <summary className="small">Set age and birthday, magic aging</summary>
        <div className="form-row">
          <Num label="Age today" value={age} onChange={(v) => setAge(Math.max(0, Math.round(v)))} min={0} width={4} />
          <Select label="Birthday month" value={month} onChange={setMonth} options={s.calendar.months.map((m, i) => ({ value: String(i), label: m.name }))} />
          <Num label="Day" value={day} onChange={(v) => setDay(Math.max(1, Math.round(v)))} min={1} max={s.calendar.months[Number(month)]?.days ?? 30} width={2} />
          <button className="small" onClick={() => dispatch((st, cx) => E.setBirth(st, cx, c.id, age, Number(month), day))}>
            Save
          </button>
        </div>
        <div className="form-row">
          <Num label="Lifespan (0 = species default)" value={c.lifespanOverride ?? 0} onChange={(v) => edit((d) => void (E.charById(d, c.id)!.lifespanOverride = v > 0 ? Math.round(v) : null))} min={0} width={4} />
          <Toggle checked={c.slowAgingSince != null} onChange={(v) => dispatch((st, cx) => E.setSlowAging(st, cx, c.id, v))} label="Ages a year per ten (Archdruid)" />
        </div>
        <div className="form-row">
          <Select label="Magic" value={magic} onChange={setMagic} options={MAGIC_AGING.map((m) => ({ value: m.id, label: m.label }))} />
          {magic === 'custom' && <Num label="Years (+ older, − younger)" value={years} onChange={(v) => setYears(Math.round(v))} width={4} />}
          <button className="small" disabled={!a} title={a ? undefined : 'Record their age first'} onClick={() => dispatch((st, cx) => E.ageByMagic(st, cx, c.id, magic, years))}>
            Apply
          </button>
        </div>
        <p className="small muted">{preset.note}</p>
      </details>
    </li>
  );
}

export function AgeCard() {
  const s = useGame();
  const pcs = pcsOf(s.characters);
  return (
    <Card title="Ages and birthdays">
      <ul className="plain">
        {pcs.map((c) => (
          <AgeRow key={c.id} c={c} />
        ))}
      </ul>
      <Rule>
        Typical lifespans follow the 2024 PHB species descriptions (a human-like default where it says nothing); set your own per character. Birthdays come round on the campaign calendar, with a line when a character crosses into a new stage of life. Magical aging is kept apart from calendar years.
      </Rule>
    </Card>
  );
}

// ---------------------------------------------------------------- wear (Characters tab) and hulls (Storage tab)

export function MaintainGear({ c }: { c: Character }) {
  const s = useGame();
  const worn = c.inventory.filter((i) => (i.wear ?? 0) > 0);
  const kept = (c.gearKeptUntil ?? 0) > E.absNow(s);
  return (
    <div className="btn-row tight">
      <span className="small">
        {s.settings.gearWear ? (worn.length ? `Worn: ${worn.map((i) => `${i.name} (${i.wear}/3)`).join(', ')}. ` : 'No wear on their gear. ') : ''}
        {kept ? 'Gear freshly kept: +1 to the first weapon damage roll each fight.' : 'An hour of upkeep gives +1 to the first weapon damage roll each fight for 24 hours (table rule).'}
      </span>
      <button className="small" onClick={() => dispatch((st, cx) => E.maintainGear(st, cx, [c.id]))}>
        Keep gear up (1 h)
      </button>
      <button className="small ghost" onClick={() => dispatch((st, cx) => E.maintainGear(st, cx, pcsOf(st.characters).map((x) => x.id)))}>
        Whole party (1 h)
      </button>
    </div>
  );
}

export function HullBlock({ st }: { st: Stash }) {
  const s = useGame();
  if (st.kind !== 'vehicle' || !s.settings.gearWear || /airship|wagon|cart|carriage|sled|chariot/i.test(st.name)) return null;
  const wear = st.hullWear ?? 0;
  const { gp, days } = hullRepair(st.name, Math.ceil(wear));
  return (
    <div className="btn-row tight">
      <span className="small">
        Hull: {st.hullDamaged ? <Pill tone="bad">damaged, half speed</Pill> : <Pill tone={wear >= 2 ? 'warn' : 'muted'}>wear {Math.floor(wear)}/{HULL_LIMIT}</Pill>}
      </span>
      {(wear > 0 || st.hullDamaged) && (
        <button className="small" disabled={!s.place.settlement || !E.localServiceAvailable(s, ['docks', 'shipwright'])} title="Requires an open dock or shipyard" onClick={() => dispatch((x, cx) => E.repairHull(x, cx, st.id, []))}>
          Repair at a dock ({fmtGp(gp)}, {days} day{days > 1 ? 's' : ''})
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- dues

export function DuesCard() {
  const s = useGame();
  const pcs = pcsOf(s.characters);
  const [kind, setKind] = useState<DueKind>('guild');
  const p = DUE_PRESETS[kind];
  const [payer, setPayer] = useState('party');
  const [gp, setGp] = useState(p.gp);
  const [share, setShare] = useState((p.share ?? 0) * 100);
  const [period, setPeriod] = useState<DuePeriod>(p.period);
  const [first, setFirst] = useState(7);
  const [label, setLabel] = useState('');
  const [collector, setCollector] = useState('');
  const pick = (k: DueKind) => {
    setKind(k);
    setGp(DUE_PRESETS[k].gp);
    setShare((DUE_PRESETS[k].share ?? 0) * 100);
    setPeriod(DUE_PRESETS[k].period);
  };
  const dues = s.dues ?? [];
  return (
    <Card title="Taxes, tithes and dues">
      {dues.length === 0 && <p className="muted small">Nothing falls due regularly.</p>}
      <ul className="plain">
        {dues.map((d) => (
          <li key={d.id} className="facility">
            <div className="armor-row">
              <span>
                <b>{d.label}</b> to {d.collector}: {d.share ? `${Math.round(d.share * 100)}% of income` : fmtGp(d.gp)} {PERIOD_LABEL[d.period]}, paid by {d.payerId === 'party' ? 'the party' : E.charById(s, d.payerId)?.name}{' '}
                {d.active ? <Pill tone={d.nextDay - s.dayIndex <= 3 ? 'warn' : 'muted'}>due in {Math.max(0, d.nextDay - s.dayIndex)} day(s)</Pill> : <Pill tone="bad">lapsed</Pill>}
                {d.missed > 0 && <Pill tone="bad">{d.missed} missed</Pill>}
              </span>
            </div>
            <div className="btn-row tight">
              <Toggle checked={d.active} onChange={(v) => edit((x) => void ((x.dues ?? []).find((y) => y.id === d.id)!.active = v))} label="Active" />
              <button className="small ghost" onClick={() => dispatch((x, cx) => E.removeDue(x, cx, d.id))}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <h3>Add</h3>
      <div className="form-row">
        <Select label="Kind" value={kind} onChange={pick} options={(Object.keys(DUE_PRESETS) as DueKind[]).map((k) => ({ value: k, label: DUE_PRESETS[k].label }))} />
        <Text label="Name" value={label} onChange={setLabel} placeholder={p.label} />
        <Text label="Collector" value={collector} onChange={setCollector} placeholder={p.collector} />
        <Select label="Paid by" value={payer} onChange={setPayer} options={[{ value: 'party', label: 'The party (split)' }, ...pcs.map((c) => ({ value: c.id, label: c.name }))]} />
        {p.share ? <Num label="Share of income" value={share} onChange={(v) => setShare(Math.max(0, v))} suffix="%" width={3} /> : <Num label="Amount" value={gp} onChange={(v) => setGp(Math.max(0, v))} suffix="GP" width={5} />}
        <Select label="Every" value={period} onChange={setPeriod} options={[{ value: 'week' as const, label: 'Week' }, { value: 'month' as const, label: 'Month (30 days)' }, { value: 'year' as const, label: 'Year' }]} />
        <Num label="First due in" value={first} onChange={(v) => setFirst(Math.max(1, Math.round(v)))} min={1} suffix="days" width={3} />
      </div>
      <p className="small muted">
        {p.note} If missed: {p.missed}
      </p>
      <button className="small" onClick={() => dispatch((x, cx) => E.addDue(x, cx, { kind, label: label.trim(), payerId: payer, gp, share: p.share ? share / 100 : undefined, period, firstInDays: first, collector: collector.trim(), notes: '' }))}>
        Add {label.trim() || p.label.toLowerCase()}
      </button>
      <Rule>
        Table rule ({s.settings.duesAndTaxes ? 'on' : 'off'}): neither 2024 book sets recurring taxes or dues, so the amounts are suggestions. Each falls due at midnight and is paid from the payer&apos;s purse; whatever they can&apos;t cover becomes a debt to the collector and escalates like any other. A tithe takes its share of the gold earned since the last one.
      </Rule>
    </Card>
  );
}

// ---------------------------------------------------------------- notoriety

export function NotorietyCard() {
  const s = useGame();
  const pcs = pcsOf(s.characters);
  const [place, setPlace] = useState('');
  const [sev, setSev] = useState<CrimeSeverity>('minor');
  const [who, setWho] = useState('party');
  const [why, setWhy] = useState('');
  const recs = s.notoriety ?? [];
  return (
    <Card title="Wanted by the law">
      {recs.length === 0 && <p className="muted small">The party isn&apos;t wanted anywhere.</p>}
      <ul className="plain">
        {recs.map((n) => {
          const lvl = heatLevel(n.heat);
          const here = s.place.settlement && n.place.trim().toLowerCase() === s.place.name.trim().toLowerCase();
          const names = n.charIds.length ? n.charIds.map((id) => E.charById(s, id)?.name).filter(Boolean).join(', ') : 'the whole party';
          return (
            <li key={n.id} className="facility">
              <div className="armor-row">
                <span>
                  <b>{n.place}</b>: {names} <Pill tone={lvl.level === 'suspected' ? 'warn' : 'bad'}>{lvl.label} · heat {n.heat}</Pill> <Pill tone="muted">bounty {fmtGp(n.bountyGp)}</Pill> {here && <Pill tone="bad">here now</Pill>}
                </span>
              </div>
              <p className="small muted">
                {lvl.text} {lvl.level !== 'clear' ? `If recognised: ${RECOGNISED[lvl.level]}` : ''}
              </p>
              {n.crimes.length > 0 && <p className="small">{n.crimes.slice(0, 3).join(' · ')}</p>}
              <div className="btn-row tight">
                <Toggle checked={!!n.disguised} onChange={(v) => edit((d) => void ((d.notoriety ?? []).find((x) => x.id === n.id)!.disguised = v))} label="Disguised" title={DISGUISE_NOTE} />
                <button className="small" onClick={() => dispatch((d, cx) => E.bribeOfficials(d, cx, n.id, []))}>
                  Bribe officials ({fmtGp(BRIBE_GP_PER_HEAT * n.heat)}, −1 heat)
                </button>
                <button className="small" onClick={() => dispatch((d, cx) => E.payBounty(d, cx, n.id, n.charIds))}>
                  Pay the bounty as a fine
                </button>
                <button className="small ghost" onClick={() => dispatch((d, cx) => E.surrender(d, cx, n.id))}>
                  Surrender ({jailDaysFor(n.bountyGp)} day(s) in jail)
                </button>
                <button className="small ghost" onClick={() => dispatch((d, cx) => E.addCrime(d, cx, n.place, 'minor', n.charIds, 'running from the watch'))}>
                  They ran (+1)
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <h3>A crime</h3>
      <div className="form-row">
        <Text label="Where" value={place} onChange={setPlace} placeholder={s.place.name || 'Sharn'} />
        <Select label="Severity" value={sev} onChange={setSev} options={(Object.keys(CRIMES) as CrimeSeverity[]).map((k) => ({ value: k, label: `${CRIMES[k].label} (+${CRIMES[k].heat} heat, ${fmtGp(CRIMES[k].bountyGp)})` }))} />
        <Select label="Who" value={who} onChange={setWho} options={[{ value: 'party', label: 'The whole party' }, ...pcs.map((c) => ({ value: c.id, label: c.name }))]} />
        <Text label="What" value={why} onChange={setWhy} placeholder={CRIMES[sev].examples.split(',')[0]} />
      </div>
      <button className="small" onClick={() => (dispatch((d, cx) => E.addCrime(d, cx, place.trim() || s.place.name, sev, who === 'party' ? [] : [who], why.trim())), setWhy(''))}>
        Record the crime
      </button>
      <Rule>
        Table rule ({s.settings.notoriety ? 'on' : 'off'}). Levels: {HEAT_LEVELS.slice(1).map((h) => `${h.label} at ${h.min}+`).join(', ')}. Each day spent in a place where they&apos;re sought, the watch may recognise them (a 1 in 10 chance when Suspected, 1 in 4 when Wanted, 2 in 5 when Hunted; disguised, roll twice and keep the better). Heat falls by 1 a week after the last crime, or every 4 days while they&apos;re elsewhere. Getting caught at a crime in downtime adds serious heat where it happened.
      </Rule>
      <WaysAround topic="wanted" />
    </Card>
  );
}

// ---------------------------------------------------------------- contacts

function ContactRow({ id }: { id: string }) {
  const s = useGame();
  const k = (s.contacts ?? []).find((x) => x.id === id)!;
  const pcs = pcsOf(s.characters);
  const [asker, setAsker] = useState('');
  const [bonus, setBonus] = useState(0);
  const [big, setBig] = useState(false);
  const [what, setWhat] = useState('');
  const askerId = pcs.find((c) => c.id === asker)?.id ?? (k.knownBy.find((x) => pcs.some((c) => c.id === x)) || pcs[0]?.id || '');
  const att = attitudeOf(k.bond);
  const since = s.dayIndex - k.lastHeardDay;
  const cooling = s.settings.contactsFade && att === 'friendly' && since >= NEGLECT_DAYS - 14;
  const resting = s.settings.contactsFade && k.cooldownUntilDay != null && k.cooldownUntilDay > s.dayIndex;
  const dc = favorDC(att, big);
  return (
    <li className="facility">
      <div className="armor-row">
        <span>
          <b>{k.name}</b> <span className="small muted">({k.role}{k.place ? `, ${k.place}` : ''}{k.distanceMiles ? `, ${k.distanceMiles} mi` : ''})</span> <Pill tone={toneOf(att)}>{ATTITUDE_LABEL[att]} · bond {k.bond > 0 ? '+' : ''}{k.bond}</Pill>{' '}
          {k.owesParty > 0 && <Pill tone="good">owes {k.owesParty}</Pill>} {k.partyOwes > 0 && <Pill tone="warn">party owes {k.partyOwes}</Pill>} <Pill tone={cooling ? 'warn' : 'muted'}>last word {since} day(s) ago</Pill> {resting && <Pill tone="muted">no favors for {k.cooldownUntilDay! - s.dayIndex} day(s)</Pill>}
        </span>
      </div>
      <NpcProfile profile={k} />
      {k.notes && <p className="small muted">{k.notes}</p>}
      <div className="btn-row tight">
        <button className="small" title="Table rule: warms the bond by one step, once every 30 days" onClick={() => dispatch((d, cx) => E.keepInTouch(d, cx, k.id))}>
          Visited or wrote
        </button>
        <button className="small" onClick={() => dispatch((d, cx) => E.doFavorFor(d, cx, k.id))}>
          Did them a favor
        </button>
        <button className="small ghost" onClick={() => dispatch((d, cx) => E.adjustBond(d, cx, k.id, 1))}>
          Bond +1
        </button>
        <button className="small ghost" onClick={() => dispatch((d, cx) => E.adjustBond(d, cx, k.id, -1))}>
          Bond −1
        </button>
        <button className="small ghost" onClick={() => edit((d) => void (d.contacts = (d.contacts ?? []).filter((x) => x.id !== k.id)))}>
          Remove
        </button>
      </div>
      <div className="btn-row tight">
        <Select value={askerId} onChange={setAsker} options={pcs.map((c) => ({ value: c.id, label: c.name }))} />
        <Text value={what} onChange={setWhat} placeholder="what they're asked for" />
        <Num label="Cha bonus" value={bonus} onChange={(v) => setBonus(Math.round(v))} width={2} />
        <Toggle checked={big} onChange={setBig} label="Big ask" />
        <button className="small" disabled={!askerId || (dc == null && k.owesParty <= 0)} onClick={() => dispatch((d, cx) => E.callFavor(d, cx, k.id, askerId, bonus, big, what.trim()))}>
          {k.owesParty > 0 ? 'Call in the favor owed' : dc == null ? 'Hostile: won’t help' : `Ask a favor (DC ${dc})`}
        </button>
      </div>
    </li>
  );
}

export function ContactsCard() {
  const s = useGame();
  const pcs = pcsOf(s.characters);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Informant');
  const [place, setPlace] = useState('');
  const [miles, setMiles] = useState(0);
  const [bond, setBond] = useState(1);
  const [who, setWho] = useState('party');
  const contacts = s.contacts ?? [];
  return (
    <Card title="Contacts and relationships">
      {contacts.length === 0 && <p className="muted small">No contacts yet. Downtime outcomes that make allied or hostile contacts add them here.</p>}
      <ul className="plain">
        {contacts.map((k) => (
          <ContactRow key={k.id} id={k.id} />
        ))}
      </ul>
      <h3>Add a contact</h3>
      <div className="form-row">
        <Text label="Name" value={name} onChange={setName} placeholder="Leave blank to roll a name" />
        <Select label="Role" value={role} onChange={setRole} options={CONTACT_ROLES} />
        <Text label="Where" value={place} onChange={setPlace} placeholder={s.place.name} />
        <Num label="Miles away" value={miles} onChange={(v) => setMiles(Math.max(0, Math.round(v)))} min={0} width={4} />
        <Select label="Attitude" value={String(bond)} onChange={(v) => setBond(Number(v))} options={[{ value: '2', label: 'Friendly (close)' }, { value: '1', label: 'Friendly' }, { value: '0', label: 'Indifferent' }, { value: '-1', label: 'Hostile' }]} />
        <Select label="Known by" value={who} onChange={setWho} options={[{ value: 'party', label: 'Everyone' }, ...pcs.map((c) => ({ value: c.id, label: c.name }))]} />
      </div>
      <button className="small" onClick={() => (dispatch((d, cx) => E.addContact(d, cx, { name: name.trim(), role, place: place.trim() || s.place.name, bond, knownBy: who === 'party' ? [] : [who], notes: '', distanceMiles: miles })), setName(''))}>
        Add
      </button>
      <Rule>
        Attitudes and Influence checks follow the 2024 PHB and DMG: DC 10 for a Friendly contact, 15 for an Indifferent one, +5 for a big ask; a Hostile one won&apos;t help, and one who owes a favor helps without a roll. Asking for a favor not owed puts the party in their debt, and failing by 5 or more sours the bond. {s.settings.contactsFade ? `Table rule (on): a Friendly contact who hears nothing for ${NEGLECT_DAYS} days cools by one step, and after helping won't help again for ${FAVOR_COOLDOWN_DAYS} days. A letter that arrives counts as word from the party.` : ''}
      </Rule>
    </Card>
  );
}

// ---------------------------------------------------------------- letters and news

export function LettersCard() {
  const s = useGame();
  const now = E.absNow(s);
  const pcs = pcsOf(s.characters);
  const contacts = s.contacts ?? [];
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [name, setName] = useState('');
  const [miles, setMiles] = useState(50);
  const [method, setMethod] = useState<CommMethod>('messenger');
  const [text, setText] = useState('');
  const [reply, setReply] = useState(true);
  const [news, setNews] = useState('');
  const [nPlace, setNPlace] = useState('');
  const [nMiles, setNMiles] = useState(100);
  const [route, setRoute] = useState<NewsRoute>('road');
  const [ago, setAgo] = useState(0);
  const fromId = pcs.find((c) => c.id === from)?.id ?? pcs[0]?.id ?? '';
  const contact = contacts.find((k) => k.id === to);
  const dist = contact ? contact.distanceMiles : miles;
  const { delay, carrier } = E.letterRoute(s, method, dist);
  const gp = method === 'courier' ? commCost('messenger', dist) : commCost(method, dist);
  const letters = s.letters ?? [];
  const pending = letters.filter((l) => !l.delivered);
  const recentNews = (s.news ?? []).filter((n) => n.delivered).slice(-5).reverse();
  const coming = (s.news ?? []).filter((n) => !n.delivered);
  return (
    <Card title="Letters and news">
      {pending.length > 0 && (
        <ul className="plain">
          {pending.map((l) => (
            <li key={l.id} className="small">
              {l.direction === 'out' ? `${E.charById(s, l.charId)?.name ?? '?'} → ${l.correspondent}` : `${l.correspondent} → ${E.charById(s, l.charId)?.name ?? '?'} (reply)`} by {COMMS[l.method].label.toLowerCase()}:{' '}
              {l.direction === 'in' && l.pickupTown && l.arrivesAt <= now ? (
                <>
                  <span>Waiting at the post in {l.pickupTown}. </span>
                  <button className="small" disabled={!E.canCollectLetter(s, l.pickupTown)} onClick={() => dispatch((st, cx) => E.collectLetter(st, cx, l.id))}>Collect letter</button>
                </>
              ) : <Pill tone="muted">{l.direction === 'in' && l.sentAt > now ? `being written, ${formatDuration(l.arrivesAt - now)} to arrive` : `arrives in ${formatDuration(Math.max(1, l.arrivesAt - now))}`}</Pill>}
            </li>
          ))}
        </ul>
      )}
      <h3>Send a letter</h3>
      <div className="form-row">
        <Select label="From" value={fromId} onChange={setFrom} options={pcs.map((c) => ({ value: c.id, label: c.name }))} />
        <Select label="To" value={to} onChange={setTo} options={[{ value: '', label: 'Someone else' }, ...contacts.map((k) => ({ value: k.id, label: `${k.name}${k.distanceMiles ? ` (${k.distanceMiles} mi)` : ''}` }))]} />
        {!contact && <Text label="Name" value={name} onChange={setName} placeholder="Mother, Lord Brennick" />}
        {!contact && <Num label="Miles" value={miles} onChange={(v) => setMiles(Math.max(0, Math.round(v)))} min={0} width={4} />}
        <Select label="By" value={method} onChange={setMethod} options={LETTER_METHODS.map((m) => ({ value: m, label: COMMS[m].label }))} />
      </div>
      <Text label="Says" value={text} onChange={setText} wide placeholder="A few words, for the record" />
      <Toggle checked={reply} onChange={setReply} label="They will write back (1d4 days to write, then the same way home)" />
      <p className="small muted">
        {delay == null ? COMMS[method].maxMiles ? `${COMMS[method].label} can't reach ${dist} miles.` : carrier : `Arrives in ${delay === 0 ? 'moments' : formatDuration(delay)}${gp ? `, costs ${fmtGp(gp)}` : ''} via ${carrier}.`} {COMMS[method].note} {method === 'messenger' || method === 'courier' ? POST_NOTE : ''}
      </p>
      <button className="small" disabled={!fromId || delay == null || (!contact && !name.trim())} onClick={() => (dispatch((d, cx) => E.sendLetter(d, cx, { charId: fromId, contactId: contact?.id ?? null, correspondent: name.trim(), miles: dist, method, text: text.trim(), expectsReply: reply })), setText(''))}>
        Send
      </button>
      <h3>News from afar</h3>
      {recentNews.length > 0 && (
        <ul className="plain">
          {recentNews.map((n) => (
            <li key={n.id} className="small">
              <b>{n.place || 'Afar'}:</b> {n.text} <span className="muted">({formatDuration(Math.max(1, n.arrivesAt - n.happenedAt))} on the road)</span>
            </li>
          ))}
        </ul>
      )}
      {coming.length > 0 && (
        <p className="small muted">
          <Pill tone="muted" title="Only the DM knows">DM only</Pill> On its way: {coming.map((n) => `${n.text.slice(0, 40)}${n.text.length > 40 ? '…' : ''} (${formatDuration(n.arrivesAt - now)})`).join('; ')}
        </p>
      )}
      <div className="form-row">
        <Text label="What happened" value={news} onChange={setNews} placeholder="The Duke of Ardan has been murdered" />
        <Text label="Where" value={nPlace} onChange={setNPlace} placeholder="Ardan" />
        <Num label="Miles away" value={nMiles} onChange={(v) => setNMiles(Math.max(0, Math.round(v)))} min={0} width={4} />
        <Select label="Route" value={route} onChange={setRoute} options={(Object.keys(NEWS_SPEED) as NewsRoute[]).map((r) => ({ value: r, label: NEWS_SPEED[r].label }))} />
        <Num label="Days ago" value={ago} onChange={(v) => setAgo(Math.max(0, Math.round(v)))} min={0} width={3} />
      </div>
      <button className="small" disabled={!news.trim()} onClick={() => (dispatch((d, cx) => E.addNews(d, cx, { text: news.trim(), place: nPlace.trim(), miles: nMiles, route, daysAgo: ago })), setNews(''))}>
        Send the news on its way
      </button>
      <Rule>
        Letters go by the same means as Bastion orders: a messenger or paid carrier at 24 miles a day and 2 CP a mile (2024 PHB), Animal Messenger, Sending, Dream or a House Sivis station. {s.settings.newsTravels ? 'Table rule (on): news spreads about 40 miles a day along trade routes, 20 on ordinary roads and 8 through wild country; magic carries it the same day.' : 'News arrives as soon as it is entered (the travelling-news rule is off).'}
      </Rule>
    </Card>
  );
}

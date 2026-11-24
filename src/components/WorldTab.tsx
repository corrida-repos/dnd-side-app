import { useState } from 'react';
import { ContactsCard, LettersCard, NotorietyCard } from './LifeCards';
import { PietyCard } from './PietyCard';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { uid } from '../state/defaults';
import { dateFromIndex, formatDuration } from '../rules/calendar';
import { GIFT_TYPES, type GiftType } from '../rules/hazards';
import { DIVINATION_SPELLS, divinationFailChance, moonPhase, RESURRECTION_SPELLS, RITUAL_PRESETS } from '../rules/longterm';
import { Card, Meter, Num, Pill, Select, Text, Toggle, Rule } from './common';
import { useGate } from './gate';
import { RIVAL_IDEAS, RIVAL_ESCALATION } from '../rules/rivals';
import { PATRONS, type PatronKind } from '../rules/patrons';
import { REGIONS, type RegionKind } from '../rules/regions';
import { WaysAround } from './WaysAround';
import { DECIPHER_DC } from '../rules/tools';
import { LIFESTYLE_LABEL, fmtGp } from '../rules/money';
import { FORT_NEGLECT_DAYS, FORT_UPKEEP, LAND, LODGING_CAP, MARK_LABEL, PRIZE_CROWN_SHARE, RIGHTS, TITLE_RANK, TRUST_LABEL, TRUST_MAX, type FortType, type LandKind, type MarkKind, type RightKind, type TitleRank, renownMinimum } from '../rules/prestige';
import type { Mark, State } from '../state/types';

export function WorldTab() {
  const s = useGame();
  const gate = useGate([
    { name: 'Wanted by the law', idle: !s.settings.notoriety && !(s.notoriety ?? []).length },
    { name: 'Piety and the gods', idle: !s.settings.piety && !s.characters.some((c) => c.devotion) },
  ]);
  return (
    <div className="grid">
      <SkyCard />
      <FactionsCard />
      <MarksCard />
      {gate.show('Piety and the gods') && <PietyCard />}
      <RivalsCard />
      {gate.show('Wanted by the law') && <NotorietyCard />}
      <ContactsCard />
      <LettersCard />
      <PatronCard />
      <RegionCard />
      <RitualsCard />
      <DeathCard />
      <DivinationCard />
      <GiftsCard />
      <LanguageCard />
    </div>
  );
}

function SkyCard() {
  const s = useGame();
  const today = dateFromIndex(s.calendar, s.startYear, s.dayIndex);
  const moon = moonPhase(s.dayIndex, s.settings.moonOffset);
  const [name, setName] = useState('');
  const [month, setMonth] = useState(0);
  const [day, setDay] = useState(1);
  const yearLen = s.calendar.months.reduce((a, m) => a + m.days, 0);
  const builtIn = (s.calendar.holidays ?? []).map((h) => ({ id: `cal-${h.name}`, name: h.name, monthIndex: h.monthIndex, day: h.day, days: h.days ?? 1, builtIn: true }));
  const upcoming = [...builtIn, ...s.holidays.map((h) => ({ ...h, days: 1, builtIn: false }))]
    .map((h) => {
      const start = s.calendar.months.slice(0, h.monthIndex).reduce((a, m) => a + m.days, 0) + h.day - 1;
      const sinceStart = (today.dayOfYear - start + yearLen) % yearLen;
      const ongoing = sinceStart < h.days;
      const inDays = ongoing ? 0 : (start - today.dayOfYear + yearLen) % yearLen;
      return { ...h, inDays };
    })
    .sort((a, b) => a.inDays - b.inDays);
  const todays = [...(today.month.festival ? [today.month.name] : []), ...upcoming.filter((h) => h.inDays === 0).map((h) => h.name)];
  return (
    <Card title="Calendar, moon and holidays">
      <p>
        <span className="moon" style={{ ['--lit' as string]: `${Math.round((1 - Math.abs(moon.fraction - 0.5) * 2) * 100)}%` }} aria-hidden /> <b>{moon.name}</b>
        <span className="muted small"> · {moon.daysToFull === 0 ? 'full tonight' : `full moon in ${moon.daysToFull} day(s)`}</span>
      </p>
      {today.month.moon && (
        <p className="small">
          Eberron has twelve moons. This month belongs to <b>{today.month.moon}</b>. The phase above follows a single moon, so set the offset to match the one you care about.
        </p>
      )}
      <p className="small">
        Season: <b>{today.month.season}</b>
        {todays.length > 0 && (
          <>
            {' '}
            · Today: <Pill tone="good">{todays.join(', ')}</Pill>
          </>
        )}
      </p>
      <div className="form-row">
        <Num label="Moon offset (days)" value={s.settings.moonOffset} onChange={(v) => edit((d) => void (d.settings.moonOffset = Math.round(v)))} width={3} />
      </div>
      <h3>Holidays and events</h3>
      {upcoming.length === 0 && <p className="muted small">None added yet. Festival days in the calendar show up automatically.</p>}
      <ul className="plain small">
        {upcoming.map((h) => (
          <li key={h.id} className="armor-row">
            <span>
              <b>{h.name}</b> · {h.day}
              {h.days > 1 ? `–${h.day + h.days - 1}` : ''} {s.calendar.months[h.monthIndex]?.name} · {h.inDays === 0 ? 'today' : `in ${h.inDays} day(s)`}
            </span>
            {h.builtIn ? (
              <Pill tone="muted">calendar</Pill>
            ) : (
              <button className="ghost tiny" aria-label={`Remove ${h.name}`} onClick={() => edit((d) => void (d.holidays = d.holidays.filter((x) => x.id !== h.id)))}>
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="form-row">
        <Text label="Name" value={name} onChange={setName} placeholder="e.g. Harvest fair in Daggerford" />
        <Select label="Month" value={String(month)} onChange={(v) => setMonth(Number(v))} options={s.calendar.months.map((m, i) => ({ value: String(i), label: m.name }))} />
        <Num label="Day" value={day} onChange={(v) => setDay(Math.max(1, Math.round(v)))} min={1} max={s.calendar.months[month]?.days ?? 30} width={2} />
      </div>
      <button disabled={!name.trim()} onClick={() => (edit((d) => void d.holidays.push({ id: uid(), name: name.trim(), monthIndex: month, day })), setName(''))}>
        Add
      </button>
    </Card>
  );
}

function FactionRow({ f }: { f: State['factions'][number] }) {
  const s = useGame();
  const [gain, setGain] = useState(2);
  const [days, setDays] = useState(10);
  const marks = s.marks.filter((m) => m.factionId === f.id && !m.revoked && !m.bastionId);
  const need = E.involvementDaysNeeded(f);
  return (
    <li className="facility">
      <div className="armor-row">
        <span>
          <b>{f.name}</b> <Pill tone={f.renown > 0 ? 'good' : 'muted'}>Renown {f.renown}</Pill> {renownPerk(f.renown) && <span className="small muted">{renownPerk(f.renown)}</span>}
        </span>
        <span className="btn-row tight">
          <button className="small" disabled={f.renown <= 0} title="A serious offense against the group" onClick={() => dispatch((st, cx) => E.changeRenown(st, cx, f.id, -1, ''))}>
            −
          </button>
          <button className="small" onClick={() => dispatch((st, cx) => E.changeRenown(st, cx, f.id, 1, ''))}>
            +
          </button>
          <button className="ghost tiny" aria-label={`Remove ${f.name}`} onClick={() => edit((d) => void (d.factions = d.factions.filter((x) => x.id !== f.id)))}>
            ✕
          </button>
        </span>
      </div>
      {marks.length > 0 && <p className="small muted">Granted by {f.name}: {marks.map((m) => m.name).join(', ')}. Offenses against the faction cost trust on these.</p>}
      <div className="btn-row tight">
        <Select label="Mission" value={String(gain)} onChange={(v) => setGain(Number(v))} options={E.MISSION_RENOWN.map((m) => ({ value: String(m.gain), label: `${m.label} (+${m.gain})` }))} />
        <button className="small" onClick={() => dispatch((st, cx) => E.factionMission(st, cx, f.id, gain))}>
          Mission done
        </button>
        <Select
          label="Level-based renown"
          value={f.levelOf ?? ''}
          onChange={(v) => edit((d) => void (d.factions.find((x) => x.id === f.id)!.levelOf = v || null))}
          options={[{ value: '', label: 'Off' }, ...s.characters.filter((c) => c.kind !== 'mount').map((c) => ({ value: c.id, label: `Follows ${c.name}'s level` }))]}
        />
      </div>
      {f.renown >= 1 && (
        <div className="btn-row tight">
          <Num label="Downtime with the group" value={days} onChange={(v) => setDays(Math.max(1, Math.round(v)))} min={1} suffix="days" width={3} />
          <button className="small" onClick={() => dispatch((st, cx) => E.factionInvolvement(st, cx, f.id, days))}>
            Spend the days
          </button>
          <span className="small muted">
            {f.involvementDays ?? 0}/{need} days toward +1
          </span>
        </div>
      )}
      <Text value={f.notes} onChange={(v) => edit((d) => void (d.factions.find((x) => x.id === f.id)!.notes = v))} placeholder="Notes: contacts, favors owed, rumors" />
    </li>
  );
}

function FactionsCard() {
  const s = useGame();
  const [name, setName] = useState('');
  return (
    <Card title="Factions and renown">
      {s.factions.length === 0 && <p className="muted small">No factions tracked yet.</p>}
      <ul className="plain">
        {s.factions.map((f) => (
          <FactionRow key={f.id} f={f} />
        ))}
      </ul>
      <div className="btn-row">
        <Text value={name} onChange={setName} placeholder="e.g. Harpers, Zhentarim" />
        <button disabled={!name.trim()} onClick={() => (edit((d) => void d.factions.push({ id: uid(), name: name.trim(), renown: 0, notes: '' })), setName(''))}>
          Add faction
        </button>
      </div>
      <Rule>
        2024 DMG renown: +1 for advancing a group&apos;s interests, +2 for a mission it assigned or that directly benefits it, +3 or +4 for a hugely significant quest. With Renown 1+, downtime spent on minor tasks and among its members raises it by 1 after 10 × the current score in days. Level-based renown: level 1 → 1, 3 → 3, 5 → 10, 11 → 25, 17 → 50. 3+ means a respected member (Friendly members, lodging and food in dire need; perhaps a contact, safe house or gear discount). 10+ might open access to potions and scrolls, favors and backup. 50+ might mean a small army, a Rare magic item or a helpful spellcaster. Disagreements cost nothing; only serious offenses against the group cost renown (the − button), and it never drops below 0. Table rules: a serious offense also costs 1 trust on each mark of prestige the faction granted, and a mark taken back costs {E.REVOKE_RENOWN_LOSS} renown.
      </Rule>
    </Card>
  );
}

function RitualsCard() {
  const s = useGame();
  const [spell, setSpell] = useState(RITUAL_PRESETS[0].spell);
  const [place, setPlace] = useState('');
  const [caster, setCaster] = useState('');
  const preset = RITUAL_PRESETS.find((r) => r.spell === spell)!;
  return (
    <Card title="Spells cast every day">
      <p className="small muted">Some spells become permanent when cast in the same place every day. Missing a single day starts the count again.</p>
      <ul className="plain">
        {s.rituals.map((r) => (
          <li key={r.id} className="facility">
            <div className="armor-row">
              <span>
                <b>{r.spell}</b> <span className="muted small">{r.place}</span>{' '}
                {r.permanent ? <Pill tone="good">Permanent</Pill> : r.lastCastDay === s.dayIndex ? <Pill tone="good">Cast today</Pill> : <Pill tone="warn">Not cast today</Pill>}
              </span>
              <span className="btn-row tight">
                {!r.permanent && (
                  <button className="small primary" disabled={r.lastCastDay === s.dayIndex} onClick={() => dispatch((st, cx) => E.castRitual(st, cx, r.id))}>
                    Cast today
                  </button>
                )}
                <button className="ghost tiny" aria-label={`Remove ${r.spell}`} onClick={() => edit((d) => void (d.rituals = d.rituals.filter((x) => x.id !== r.id)))}>
                  ✕
                </button>
              </span>
            </div>
            {!r.permanent && (
              <div className="small">
                <Meter value={r.streak} max={r.requiredDays} tone="good" /> {r.streak}/{r.requiredDays} days in a row
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="form-row">
        <Select label="Spell" value={spell} onChange={setSpell} options={RITUAL_PRESETS.map((r) => ({ value: r.spell, label: `${r.spell} (${r.days} days)` }))} />
        <Text label="Place" value={place} onChange={setPlace} placeholder="e.g. the tower's top floor" />
        <Select label="Caster" value={caster} onChange={setCaster} options={[{ value: '', label: 'Anyone' }, ...s.characters.filter((c) => c.kind !== 'mount').map((c) => ({ value: c.id, label: c.name }))]} />
      </div>
      <button onClick={() => (dispatch((st, cx) => E.addRitual(st, cx, preset.spell, preset.days, place.trim(), caster || null)), setPlace(''))}>Start daily casting</button>
      <Rule>For long castings and slow magic, such as Clone growing for 120 days or a Geas lasting 30 days, use timers on the Effects & Lights tab.</Rule>
      <WaysAround topic={'dailyCasting'} />
    </Card>
  );
}

function DeathCard() {
  const s = useGame();
  const [who, setWho] = useState('');
  const living = s.characters.filter((c) => c.diedAt == null);
  const dead = s.characters.filter((c) => c.diedAt != null);
  return (
    <Card title="Death and resurrection">
      {dead.length === 0 && <p className="muted small">Everyone is alive.</p>}
      {dead.map((c) => {
        const t = E.deadFor(s, c) ?? 0;
        return (
          <div key={c.id} className="facility">
            <div className="armor-row">
              <span>
                <b>{c.name}</b> <Pill tone="bad">Dead {formatDuration(t)}</Pill>
                {c.reposeMinutes > 0 && <span className="muted small"> ({formatDuration(c.reposeMinutes)} under Gentle Repose, not counted)</span>}
              </span>
              <button className="small good" onClick={() => dispatch((st, cx) => E.markDead(st, cx, c.id, false))}>
                Brought back
              </button>
            </div>
            <ul className="plain small">
              {RESURRECTION_SPELLS.map((r) => (
                <li key={r.spell} className={t <= r.limit ? 'good-text' : 'muted'}>
                  {t <= r.limit ? '✓' : '✗'} {r.spell}: {r.note}
                  {t <= r.limit && r.limit - t < 24 * 60 * 365 ? ` ${formatDuration(r.limit - t)} left.` : ''}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <div className="btn-row">
        <Select value={who} onChange={setWho} options={[{ value: '', label: 'Who died?' }, ...living.map((c) => ({ value: c.id, label: c.name }))]} />
        <button className="bad" disabled={!who} onClick={() => (dispatch((st, cx) => E.markDead(st, cx, who, true)), setWho(''))}>
          Mark as dead
        </button>
      </div>
      <Rule>Put a Gentle Repose timer on the body (Effects & Lights tab) and the days it lasts won&apos;t count toward these limits.</Rule>
      <WaysAround topic={'death'} />
    </Card>
  );
}

function DivinationCard() {
  const s = useGame();
  const casters = s.characters.filter((c) => c.kind !== 'mount' && c.diedAt == null);
  const [who, setWho] = useState(casters[0]?.id ?? '');
  const [spell, setSpell] = useState(DIVINATION_SPELLS[0]);
  const c = casters.find((x) => x.id === who) ?? casters[0];
  if (!c) return null;
  const casts = c.divinationCasts[spell] ?? 0;
  return (
    <Card title="Divination limits">
      <div className="form-row">
        <Select label="Caster" value={c.id} onChange={setWho} options={casters.map((x) => ({ value: x.id, label: x.name }))} />
        <Select label="Spell" value={spell} onChange={setSpell} options={DIVINATION_SPELLS} />
      </div>
      <p className="small">
        Cast {casts} time(s) since the last Long Rest. The next casting has a <b>{divinationFailChance(casts)}%</b> chance of going wrong.
      </p>
      <button onClick={() => dispatch((st, cx) => E.castDivination(st, cx, c.id, spell))}>Cast {spell}</button>
      <Rule>Each extra casting before a Long Rest adds a cumulative 25% chance of a random or missing answer. Counts reset when the caster finishes a Long Rest. Check the exact wording of each spell.</Rule>
      <WaysAround topic={'divination'} />
    </Card>
  );
}

function GiftsCard() {
  const s = useGame();
  const [who, setWho] = useState(s.characters[0]?.id ?? '');
  const [type, setType] = useState<GiftType>('Blessing');
  const [name, setName] = useState('');
  const [uses, setUses] = useState(1);
  const [notes, setNotes] = useState('');
  const active = s.effects.filter((e) => e.kind === 'gift' || e.kind === 'curse');
  return (
    <Card title="Supernatural gifts and curses">
      {active.length === 0 && <p className="muted small">None yet.</p>}
      <ul className="plain small">
        {active.map((e) => (
          <li key={e.id} className="armor-row">
            <span>
              <b>{e.name}</b> <span className="muted">on {e.targetIds.map((id) => E.charById(s, id)?.name).join(', ')}</span>
              {e.notes && <span className="muted"> · {e.notes}</span>}
            </span>
            <button className="ghost small" onClick={() => dispatch((st, cx) => E.endEffect(st, cx, e.id))}>
              {e.kind === 'curse' ? 'Lift' : 'End'}
            </button>
          </li>
        ))}
      </ul>
      <div className="form-row">
        <Select label="Who" value={who} onChange={setWho} options={s.characters.map((c) => ({ value: c.id, label: c.name }))} />
        <Select label="Type" value={type} onChange={setType} options={GIFT_TYPES} />
        <label className="field">
          <span className="field-label">Name</span>
          <input list="gift-names" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Heroism, the Restless Dead" />
          <datalist id="gift-names">
            {s.giftLibrary.filter((g) => g.type === type || type === 'Other').map((g) => (
              <option key={g.name} value={g.name} />
            ))}
          </datalist>
        </label>
        {type === 'Charm' && <Num label="Uses" value={uses} onChange={(v) => setUses(Math.max(1, Math.round(v)))} min={1} width={2} />}
      </div>
      <Text label="What it does (notes)" value={notes} onChange={setNotes} wide />
      <button disabled={!name.trim()} onClick={() => (dispatch((st, cx) => E.grantGift(st, cx, who, type, name.trim(), uses, notes.trim())), setName(''), setNotes(''))}>
        {type === 'Curse' ? 'Curse them' : 'Grant'}
      </button>
      <Rule>Blessings and Boons last until the DM ends them. A Charm&apos;s uses appear with the character&apos;s limited uses on the Gear tab. Curses last until lifted, for example by Remove Curse.</Rule>
    </Card>
  );
}

function renownPerk(r: number): string {
  if (r >= 50) return 'Could call on a small army, a Rare item or a spellcaster';
  if (r >= 10) return 'Potions and scrolls, favors, backup';
  if (r >= 3) return 'Respected: Friendly members, shelter in need';
  return '';
}

function RivalsCard() {
  const s = useGame();
  const [name, setName] = useState('');
  const [idea, setIdea] = useState('');
  const set = (id: string, patch: Partial<(typeof s.rivals)[number]>) => edit((d) => void Object.assign(d.rivals.find((x) => x.id === id)!, patch));
  const active = s.rivals.filter((r) => r.active);
  return (
    <Card title="Rivals">
      {active.length === 0 && <p className="muted small">No active rivals. Xanathar's suggests two or three, at least one a villain.</p>}
      <ul className="plain">
        {s.rivals.map((r) => (
          <li key={r.id} className="facility">
            <div className="armor-row">
              <span>
                <b>{r.name}</b> <span className="small muted">{r.idea}</span>{' '}
                <Pill tone={r.pressure >= 6 ? 'bad' : r.pressure >= 3 ? 'warn' : 'muted'}>Pressure {r.pressure}</Pill> {!r.active && <Pill tone="good">Resolved</Pill>}
              </span>
              <span className="btn-row tight">
                <button className="ghost small" onClick={() => set(r.id, { active: !r.active })}>
                  {r.active ? 'Resolved' : 'Reactivate'}
                </button>
                <button className="ghost tiny" aria-label={`Remove ${r.name}`} onClick={() => edit((d) => void (d.rivals = d.rivals.filter((x) => x.id !== r.id)))}>
                  ✕
                </button>
              </span>
            </div>
            {r.active && (
              <>
                <div className="form-row">
                  <Text label="Goal" value={r.goal} onChange={(v) => set(r.id, { goal: v })} placeholder="What they want, and why the party is in the way" />
                  <Text label="Assets" value={r.assets} onChange={(v) => set(r.id, { assets: v })} placeholder="Money, allies, influence" />
                </div>
                <label className="field grow">
                  <span className="field-label">Plans (one per line)</span>
                  <textarea rows={2} value={r.plans.join('\n')} onChange={(e) => set(r.id, { plans: e.target.value.split('\n') })} />
                </label>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="form-row">
        <Text label="Name" value={name} onChange={setName} placeholder="e.g. Magistrate Orvane" />
        <Select label="Who they are" value={idea} onChange={setIdea} options={[{ value: '', label: 'Roll one' }, ...RIVAL_IDEAS.map((x) => ({ value: x, label: x }))]} />
      </div>
      <div className="btn-row">
        <button className="small" onClick={() => (dispatch((st, cx) => E.addRival(st, cx, name.trim(), idea)), setName(''))}>
          Add rival
        </button>
        <button className="small ghost" disabled={!active.length} onClick={() => dispatch((st, cx) => E.advanceRival(st, cx))}>
          A rival makes a move
        </button>
      </div>
      <Rule>
        Xanathar&apos;s: rivals work against the party between adventures. Each time downtime is resolved, a rival advances one of its plans (yours, or a generic move: rumors cost renown, sabotage hurts a business or Bastion facility, bribes make the next crime harder, toughs take coin, complaints become fines). Complications marked as rival-friendly name the rival. Pressure {Object.keys(RIVAL_ESCALATION).join(', ')} calls for the rival to act in person (table rule).
      </Rule>
    </Card>
  );
}

function PatronCard() {
  const s = useGame();
  const p = s.patron;
  const [kind, setKind] = useState<PatronKind>('guild');
  const [name, setName] = useState('');
  const [fee, setFee] = useState(500);
  const [item, setItem] = useState('Potion of Climbing');
  const [consumable, setConsumable] = useState(true);
  const [who, setWho] = useState('');
  const pcs = s.characters.filter((c) => c.kind !== 'mount');
  const whoId = pcs.find((c) => c.id === who)?.id ?? pcs[0]?.id ?? '';
  const info = p ? PATRONS[p.kind] : PATRONS[kind];
  return (
    <Card title="Group patron">
      {p ? (
        <>
          <p>
            <b>{p.name}</b> <Pill tone="info">{info.label}</Pill>
          </p>
          <div className="btn-row tight">
            {info.assignmentShare && (
              <>
                <Num label="Client fee" value={fee} onChange={(v) => setFee(Math.max(0, v))} min={0} suffix="GP" width={6} />
                <button className="small" onClick={() => dispatch((st, cx) => E.patronAssignment(st, cx, fee))}>
                  Assignment paid ({Math.round(info.assignmentShare * 100)}%)
                </button>
              </>
            )}
            {info.luxuryWeeks && (
              <button className="small" onClick={() => dispatch((st, cx) => E.patronLuxury(st, cx))}>
                Two weeks of luxury{p.luxuryUntilDay != null && s.dayIndex < p.luxuryUntilDay ? ` (${p.luxuryUntilDay - s.dayIndex} days left)` : ''}
              </button>
            )}
            {info.commonItems && (
              <>
                <Select value={whoId} onChange={setWho} options={pcs.map((c) => ({ value: c.id, label: c.name }))} />
                <Text value={item} onChange={setItem} placeholder="Common magic item" />
                <Toggle checked={consumable} onChange={setConsumable} label="Consumable" />
                <button className="small" onClick={() => dispatch((st, cx) => E.patronCommonItem(st, cx, whoId, item, consumable))}>
                  Buy (2d4 × 10 GP{consumable ? ', halved' : ''})
                </button>
              </>
            )}
            <button className="small ghost" onClick={() => dispatch((st, cx) => E.setPatron(st, cx, null, ''))}>
              Leave patron
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="form-row">
            <Select label="Patron type" value={kind} onChange={setKind} options={(Object.keys(PATRONS) as PatronKind[]).map((k) => ({ value: k, label: PATRONS[k].label }))} />
            <Text label="Name" value={name} onChange={setName} placeholder="e.g. The Gilded Quill Guild" />
          </div>
          <button className="small" onClick={() => dispatch((st, cx) => E.setPatron(st, cx, kind, name.trim()))}>
            Take service
          </button>
        </>
      )}
      <ul className="small">
        {info.perks.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <Rule>
        Tasha&apos;s group patrons. Automated here: daily pay, free or cheap lodging (applied to lifestyle costs), shop discounts and better sale prices, cheaper or faster training, free spellcasting from a religious order, syndicate assignment shares, an aristocrat&apos;s fortnight of luxury, an ancient being&apos;s Common items, and Group Assistance (each member can grant an ally Advantage once per Long Rest).
      </Rule>
    </Card>
  );
}

function RegionCard() {
  const s = useGame();
  const region = s.place.region ?? null;
  const [why, setWhy] = useState('');
  return (
    <Card title="Supernatural region">
      <Select
        label={`Is ${s.place.name} a supernatural region?`}
        value={region ?? ''}
        onChange={(v) => dispatch((st, cx) => E.setRegion(st, cx, (v || null) as RegionKind | null))}
        options={[{ value: '', label: 'No' }, ...(Object.keys(REGIONS) as RegionKind[]).map((k) => ({ value: k, label: REGIONS[k].name }))]}
      />
      {region && (
        <>
          <p className="small">
            <b>Roll when:</b> {REGIONS[region].triggers.join('; ')}.
          </p>
          <div className="btn-row tight">
            <Text value={why} onChange={setWhy} placeholder="What triggered it" />
            <button className="small" onClick={() => dispatch((st, cx) => E.rollRegionEffect(st, cx, why || 'a trigger'))}>
              Roll the region&apos;s effect
            </button>
          </div>
        </>
      )}
      <Rule>
        Tasha&apos;s supernatural regions: Blessed Radiance, Far Realm, Haunted, Infested, Mirror Zone, Psychic Resonance and Unraveling Magic. The tracker shows a short summary of each result and applies those that last (timed effects, no rest, lost hours, hourly Exhaustion, storms, disease); read Tasha&apos;s for the full text. Table rule: it also rolls once each dawn while you&apos;re there (Settings).
      </Rule>
    </Card>
  );
}

/** Reading a text in a language nobody in the party knows. */
function LanguageCard() {
  const s = useGame();
  const pcs = s.characters.filter((c) => c.kind !== 'mount' && E.alive(c));
  const [who, setWho] = useState('');
  const [bonus, setBonus] = useState(0);
  const [language, setLanguage] = useState('');
  const [gist, setGist] = useState('');
  const whoId = pcs.find((c) => c.id === who)?.id ?? pcs[0]?.id ?? '';
  const interpreters = s.hirelings.filter((h) => h.active && h.role === 'interpreter');
  const comprehend = pcs.filter((c) => c.spells.some((sp) => sp.name.toLowerCase() === 'comprehend languages'));
  return (
    <Card title="An unknown language">
      <p className="small">
        Reads it properly:{' '}
        {[...comprehend.map((c) => `${c.name} (Comprehend Languages, a ritual)`), ...interpreters.map((h) => `${h.name} (interpreter)`)].join(', ') || 'anyone who knows the language, an interpreter hireling, or Comprehend Languages'}.
      </p>
      {s.settings.improvised ? (
        <>
          <div className="form-row">
            <Select label="Who tries" value={whoId} onChange={setWho} options={pcs.map((c) => ({ value: c.id, label: c.name }))} />
            <Num label="Int (Investigation)" value={bonus} onChange={(v) => setBonus(Math.round(v))} width={2} />
            <Text label="Language" value={language} onChange={setLanguage} placeholder="e.g. Giant" />
          </div>
          <div className="form-row">
            <Text label="The gist (DM)" value={gist} onChange={setGist} placeholder="e.g. a warning: the bridge ahead is cursed" wide />
          </div>
          <button className="small" disabled={!whoId} onClick={() => dispatch((st, cx) => E.decipherText(st, cx, whoId, bonus, language, gist))}>
            Puzzle out the gist (DC {DECIPHER_DC}, 10 min)
          </button>
        </>
      ) : (
        <p className="small muted">Improvised attempts are off in Settings, so nobody else can make sense of it.</p>
      )}
      <Rule>
        The 2024 rules have no check for reading an unknown language. Table rule: anyone can puzzle out the gist of a short text from shared roots, numbers and pictures with Intelligence (Investigation) at DC {DECIPHER_DC}. A success gives
        the gist only, never exact wording; a failure gives nothing.
      </Rule>
    </Card>
  );
}

function MarkRow({ m }: { m: Mark }) {
  const s = useGame();
  const [prize, setPrize] = useState(0);
  const who = m.holderIds.map((id) => s.characters.find((c) => c.id === id)?.name).filter(Boolean).join(', ') || 'nobody';
  const live = !m.revoked && !m.bastionId;
  const rules = s.settings.prestigeRules;
  const upkeep = m.fort ? FORT_UPKEEP[m.fort] : null;
  const sponsorLeft = Math.max(0, (m.sponsoredUntilDay ?? 0) - s.dayIndex);
  const title = m.titleId ? s.marks.find((x) => x.id === m.titleId) : null;
  const lands = m.landId ? s.marks.find((x) => x.id === m.landId) : null;
  return (
    <li className="facility">
      <div className="armor-row">
        <span>
          <b>{m.name}</b> <Pill tone="muted">{MARK_LABEL[m.kind]}</Pill>{' '}
          {m.revoked ? <Pill tone="bad">Ended</Pill> : m.bastionId ? <Pill tone="good">Now a Bastion</Pill> : rules && <Pill tone={m.trust >= TRUST_MAX ? 'good' : m.trust > 1 ? 'warn' : 'bad'}>{TRUST_LABEL[m.trust]} {m.trust}/{TRUST_MAX}</Pill>}
        </span>
        <button className="ghost tiny" aria-label={`Remove ${m.name}`} onClick={() => dispatch((st, cx) => E.removeMark(st, cx, m.id))}>
          ✕
        </button>
      </div>
      <p className="small muted">
        Held by {who}
        {m.grantor ? `, granted by ${m.grantor}` : ''}
        {m.factionId && s.factions.some((f) => f.id === m.factionId) ? ` (faction, renown ${s.factions.find((f) => f.id === m.factionId)!.renown})` : ''}.
        {m.revoked ? ` Ended: ${m.revoked.why}.` : ''}
      </p>
      {m.kind === 'fortification' && upkeep && (
        <p className="small">
          {upkeep.label}: {fmtGp(upkeep.gpPerDay)} a day.{' '}
          {live && (sponsorLeft > 0 ? `The grantor pays for ${sponsorLeft} more day${sponsorLeft > 1 ? 's' : ''}.` : 'The holders pay, charged each day.')}
          {live && rules && (m.neglectDays ?? 0) > 0 ? ` Unpaid for ${m.neglectDays} of ${FORT_NEGLECT_DAYS} days.` : ''}
        </p>
      )}
      {m.kind === 'land' && m.land && (
        <>
          <p className="small">
            {LAND[m.land].label}. {rules ? LAND[m.land].note : 'Can be built on and inherited, not sold.'}
            {title ? ` Comes with the title ${title.name}.` : ''}
          </p>
          {live && m.trouble && (
            <div className="armor-row">
              <span className="small warn-text">
                Trouble ({s.dayIndex - m.trouble.sinceDay} of 30 days): {m.trouble.text}
              </span>
              <button className="small" onClick={() => dispatch((st, cx) => E.resolveLandTrouble(st, cx, m.id))}>
                Dealt with it
              </button>
            </div>
          )}
        </>
      )}
      {m.kind === 'rights' && m.right && (
        <>
          <p className="small">
            {RIGHTS[m.right].label}
            {m.community ? ` (${m.community})` : ''}: {RIGHTS[m.right].effect} {live && (m.untilDay != null ? `Ends in ${Math.max(0, m.untilDay - s.dayIndex)} days.` : 'For life.')}
            {live && m.right === 'lodging' && !m.community ? ' Name the community so it can apply.' : ''}
          </p>
          {live && m.right === 'marque' && (
            <div className="btn-row tight">
              <Num label="Prize" value={prize} onChange={(v) => setPrize(Math.max(0, v))} min={0} suffix="GP" width={7} />
              <button className="small" disabled={prize <= 0} onClick={() => (dispatch((st, cx) => E.claimPrize(st, cx, m.id, prize)), setPrize(0))}>
                Declare prize (crown takes {Math.round(PRIZE_CROWN_SHARE * 100)}%)
              </button>
            </div>
          )}
        </>
      )}
      {m.kind === 'title' && m.rank && (
        <>
          <p className="small">
            {TITLE_RANK[m.rank].label}.{' '}
            {TITLE_RANK[m.rank].lifestyle ? (rules ? `Must live ${LIFESTYLE_LABEL[TITLE_RANK[m.rank].lifestyle!]} or better, checked every 30 days.` : 'Expected to act in a manner befitting the title.') : 'No duties, but it may come with a minor supernatural gift (record it under Supernatural gifts).'}
            {lands ? ` Lands: ${lands.name}.` : ''}
          </p>
          <Text label="Heir" value={m.heir ?? ''} onChange={(v) => edit((d) => void (d.marks.find((x) => x.id === m.id)!.heir = v))} placeholder="Who inherits it" />
        </>
      )}
      {live && (
        <div className="btn-row tight">
          {rules && (
            <>
              <button className="small" disabled={m.trust >= TRUST_MAX} onClick={() => dispatch((st, cx) => E.adjustMarkTrust(st, cx, m.id, 1, 'loyal service'))}>
                Loyal service (+1)
              </button>
              <button className="small" onClick={() => dispatch((st, cx) => E.adjustMarkTrust(st, cx, m.id, -1, m.kind === 'rights' ? 'the right was abused' : 'conduct unbecoming'))}>
                {m.kind === 'rights' ? 'Abused (−1)' : 'Displeased (−1)'}
              </button>
            </>
          )}
          {!m.factionId && m.grantor.trim() && (
            <button className="small" onClick={() => dispatch((st, cx) => E.markRulerAsFaction(st, cx, m.id))}>
              Track {m.grantor} as a faction
            </button>
          )}
          {m.kind === 'fortification' && (
            <button className="small" onClick={() => dispatch((st, cx) => E.fortToBastion(st, cx, m.id))}>
              Make it a Bastion
            </button>
          )}
          <button className="small" onClick={() => dispatch((st, cx) => E.revokeMark(st, cx, m.id, m.kind === 'title' ? 'stripped by decree' : 'by decree'))}>
            {m.kind === 'title' ? 'Strip' : 'Revoke'}
          </button>
        </div>
      )}
      <Text value={m.notes} onChange={(v) => edit((d) => void (d.marks.find((x) => x.id === m.id)!.notes = v))} placeholder="Notes: duties, the document's wording, where it hangs" />
    </li>
  );
}

function MarksCard() {
  const s = useGame();
  const pcs = s.characters.filter((c) => c.kind !== 'mount');
  const [kind, setKind] = useState<MarkKind>('title');
  const [name, setName] = useState('');
  const [grantor, setGrantor] = useState('');
  const [holders, setHolders] = useState<string[]>([]);
  const [fort, setFort] = useState<FortType>('keep');
  const [sponsor, setSponsor] = useState(1);
  const [land, setLand] = useState<LandKind>('farmland');
  const [right, setRight] = useState<RightKind>('lodging');
  const [community, setCommunity] = useState('');
  const [days, setDays] = useState(0);
  const [soldiers, setSoldiers] = useState(2);
  const [rank, setRank] = useState<TitleRank>('knight');
  const [withLand, setWithLand] = useState<LandKind | ''>('');
  const [factionId, setFactionId] = useState('');
  const [rulerAsFaction, setRulerAsFaction] = useState(true);
  const fac = s.factions.find((f) => f.id === factionId);
  const rulerFac = !fac && rulerAsFaction && grantor.trim() ? s.factions.find((f) => f.name.trim().toLowerCase() === grantor.trim().toLowerCase()) : undefined;
  const judge = fac ?? rulerFac ?? (!fac && rulerAsFaction && grantor.trim() ? { name: grantor.trim(), renown: 0 } : undefined);
  const need = judge && s.settings.prestigeRenownMin ? renownMinimum(kind, rank) : 0;
  const refused = !!judge && need > judge.renown;
  const active = s.marks.filter((m) => !m.revoked && !m.bastionId);
  const past = s.marks.filter((m) => m.revoked || m.bastionId);
  return (
    <Card title="Marks of prestige">
      {s.marks.length === 0 && <p className="muted small">No fortifications, land, special rights or titles yet.</p>}
      <ul className="plain">
        {active.map((m) => (
          <MarkRow key={m.id} m={m} />
        ))}
      </ul>
      {past.length > 0 && (
        <details>
          <summary>Ended or turned into Bastions ({past.length})</summary>
          <ul className="plain">
            {past.map((m) => (
              <MarkRow key={m.id} m={m} />
            ))}
          </ul>
        </details>
      )}
      <details>
        <summary>Grant a mark of prestige</summary>
        <div className="row">
          <Select label="Kind" value={kind} onChange={(v: MarkKind) => setKind(v)} options={(Object.keys(MARK_LABEL) as MarkKind[]).map((k) => ({ value: k, label: MARK_LABEL[k] }))} />
          <Text label="Name" value={name} onChange={setName} placeholder={kind === 'title' ? TITLE_RANK[rank].example : kind === 'fortification' ? 'e.g. Thornwatch Keep' : kind === 'land' ? 'e.g. the Fenwick holding' : 'e.g. Freedom of Greywater'} />
          {s.factions.length > 0 && <Select label="Faction" value={factionId} onChange={setFactionId} options={[{ value: '', label: 'None' }, ...s.factions.map((f) => ({ value: f.id, label: `${f.name} (renown ${f.renown})` }))]} />}
          <Text label="Granted by" value={grantor} onChange={setGrantor} placeholder={fac ? fac.name : 'e.g. Queen Yolande'} />
        </div>
        <div className="row">
          {kind === 'fortification' && (
            <>
              <Select label="Fortification" value={fort} onChange={(v: FortType) => setFort(v)} options={(Object.keys(FORT_UPKEEP) as FortType[]).map((k) => ({ value: k, label: `${FORT_UPKEEP[k].label} (${fmtGp(FORT_UPKEEP[k].gpPerDay)}/day)` }))} />
              <Num label="Grantor pays upkeep for" value={sponsor} onChange={(v) => setSponsor(Math.max(0, Math.round(v)))} min={0} suffix="months" width={3} />
            </>
          )}
          {kind === 'land' && <Select label="Land" value={land} onChange={(v: LandKind) => setLand(v)} options={(Object.keys(LAND) as LandKind[]).map((k) => ({ value: k, label: LAND[k].label }))} />}
          {kind === 'rights' && (
            <>
              <Select label="Right" value={right} onChange={(v: RightKind) => setRight(v)} options={(Object.keys(RIGHTS) as RightKind[]).map((k) => ({ value: k, label: RIGHTS[k].label }))} />
              {(right === 'lodging' || right === 'rites' || right === 'soldiers') && <Text label="Community" value={community} onChange={setCommunity} placeholder={s.place.settlement ? s.place.name : 'Town or city'} />}
              {right === 'soldiers' && <Num label="Soldiers" value={soldiers} onChange={(v) => setSoldiers(Math.max(1, Math.round(v)))} min={1} width={3} />}
              <Num label="Lasts (0 = for life)" value={days} onChange={(v) => setDays(Math.max(0, Math.round(v)))} min={0} suffix="days" width={4} />
            </>
          )}
          {kind === 'title' && (
            <>
              <Select label="Rank" value={rank} onChange={(v: TitleRank) => setRank(v)} options={(Object.keys(TITLE_RANK) as TitleRank[]).map((k) => ({ value: k, label: TITLE_RANK[k].label }))} />
              <Select label="Comes with land" value={withLand} onChange={(v: LandKind | '') => setWithLand(v)} options={[{ value: '', label: 'No land' }, ...(Object.keys(LAND) as LandKind[]).map((k) => ({ value: k, label: LAND[k].label }))]} />
            </>
          )}
        </div>
        <div className="field">
          <span className="field-label">Granted to</span>
          <div className="chips">
            {pcs.map((c) => (
              <Toggle key={c.id} checked={holders.includes(c.id)} onChange={(v) => setHolders(v ? [...holders, c.id] : holders.filter((x) => x !== c.id))} label={c.name} />
            ))}
          </div>
        </div>
        {!fac && grantor.trim() && (
          <Toggle
            checked={rulerAsFaction}
            onChange={setRulerAsFaction}
            label={s.factions.some((f) => f.name.trim().toLowerCase() === grantor.trim().toLowerCase()) ? `Link to the faction ${grantor.trim()}` : `Track ${grantor.trim()} as a faction (standing at court, renown 0)`}
          />
        )}
        {kind === 'rights' && <p className="small muted">{RIGHTS[right].effect}</p>}
        {judge && refused && (
          <p className="small warn-text">
            Table rule: {judge.name} won&apos;t grant this below renown {need}; the party has {judge.renown}. Raise it with missions and time at court first, or untick the faction link to grant it as a one-off reward.
          </p>
        )}
        <button
          className="primary"
          disabled={!holders.length || refused}
          onClick={() => {
            dispatch((st, cx) =>
              E.grantMark(st, cx, {
                kind,
                name: name || (kind === 'rights' ? RIGHTS[right].label : kind === 'title' ? TITLE_RANK[rank].label : kind === 'fortification' ? FORT_UPKEEP[fort].label : LAND[land].label),
                holderIds: holders,
                grantor,
                fort,
                sponsorMonths: sponsor,
                land,
                right,
                community: community || (right === 'lodging' && s.place.settlement ? s.place.name : ''),
                days: days || null,
                soldiers,
                rank,
                withLand: withLand || null,
                factionId: factionId || null,
                rulerAsFaction,
              }),
            );
            setName('');
          }}
        >
          Grant
        </button>
      </details>
      <Rule>
        2024 DMG, Marks of Prestige: a fortification is governed by the holders, but its land stays the crown&apos;s. It costs {Object.values(FORT_UPKEEP).map((u) => `${fmtGp(u.gpPerDay)}`).join(', ')} a day (outpost, keep, castle), and the grantor may pay for the first months. Land can be built on and inherited but not sold. Special rights last as long as the document says. Titles can be passed down. Any of them can be taken away for disloyalty or abuse. Table rules ({s.settings.prestigeRules ? 'on' : 'off'}, Settings): the grantor&apos;s trust starts at {TRUST_MAX}, and it is gone (the mark taken back) at 0. Land pays rents monthly, but a 1 on a d6 brings trouble, and trouble left for 30 days costs trust and that month&apos;s income. Titles cost trust each month the holder lives below the rank&apos;s lifestyle. {FORT_NEGLECT_DAYS} days of unpaid fortification upkeep costs trust. Free room and board covers lifestyles up to {LIFESTYLE_LABEL[LODGING_CAP]}. A mark granted by a tracked faction ties into its renown: loyal service also gives +1 renown, a mark taken back for disloyalty costs {E.REVOKE_RENOWN_LOSS}, and serious offenses against the faction cost trust.{s.settings.prestigeRenownMin ? ' Factions and rulers tracked as factions refuse to grant a knighthood below renown 10, a lordship, county or fortification below 25, or a dukedom below 50.' : ''} The crown takes {Math.round(PRIZE_CROWN_SHARE * 100)}% of a prize.
      </Rule>
    </Card>
  );
}

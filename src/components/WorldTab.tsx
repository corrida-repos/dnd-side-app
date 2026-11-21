import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { uid } from '../state/defaults';
import { dateFromIndex, formatDuration } from '../rules/calendar';
import { GIFT_TYPES, type GiftType } from '../rules/hazards';
import { DIVINATION_SPELLS, divinationFailChance, moonPhase, RESURRECTION_SPELLS, RITUAL_PRESETS } from '../rules/longterm';
import { Card, Meter, Num, Pill, Select, Text, Toggle, Rule } from './common';
import { RIVAL_IDEAS, RIVAL_ESCALATION } from '../rules/rivals';
import { PATRONS, type PatronKind } from '../rules/patrons';
import { REGIONS, type RegionKind } from '../rules/regions';
import { WaysAround } from './WaysAround';

export function WorldTab() {
  return (
    <div className="grid">
      <SkyCard />
      <FactionsCard />
      <RivalsCard />
      <PatronCard />
      <RegionCard />
      <RitualsCard />
      <DeathCard />
      <DivinationCard />
      <GiftsCard />
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

function FactionsCard() {
  const s = useGame();
  const [name, setName] = useState('');
  const set = (id: string, fn: (f: (typeof s.factions)[number]) => void) => edit((d) => fn(d.factions.find((x) => x.id === id)!));
  return (
    <Card title="Factions and renown">
      {s.factions.length === 0 && <p className="muted small">No factions tracked yet.</p>}
      <ul className="plain">
        {s.factions.map((f) => (
          <li key={f.id} className="facility">
            <div className="armor-row">
              <span>
                <b>{f.name}</b> <Pill tone={f.renown > 0 ? 'good' : 'muted'}>Renown {f.renown}</Pill> {renownPerk(f.renown) && <span className="small muted">{renownPerk(f.renown)}</span>}
              </span>
              <span className="btn-row tight">
                <button className="small" disabled={f.renown <= 0} onClick={() => (set(f.id, (x) => void (x.renown = Math.max(0, x.renown - 1))), dispatch((st) => (E.log(st, `Renown with ${f.name} drops to ${Math.max(0, f.renown - 1)}.`, 'warn'), st)))}>
                  −
                </button>
                <button className="small" onClick={() => (set(f.id, (x) => void (x.renown += 1)), dispatch((st) => (E.log(st, `Renown with ${f.name} rises to ${f.renown + 1}.`, 'good'), st)))}>
                  +
                </button>
                <button className="ghost tiny" aria-label={`Remove ${f.name}`} onClick={() => edit((d) => void (d.factions = d.factions.filter((x) => x.id !== f.id)))}>
                  ✕
                </button>
              </span>
            </div>
            <div className="btn-row tight">
              <button className="small" onClick={() => dispatch((st, cx) => E.factionMission(st, cx, f.id))}>
                Mission done (+1)
              </button>
              <Select
                label="Level-based renown"
                value={f.levelOf ?? ''}
                onChange={(v) => edit((d) => void (d.factions.find((x) => x.id === f.id)!.levelOf = v || null))}
                options={[{ value: '', label: 'Off' }, ...s.characters.filter((c) => c.kind !== 'mount').map((c) => ({ value: c.id, label: `Follows ${c.name}'s level` }))]}
              />
            </div>
            <Text value={f.notes} onChange={(v) => set(f.id, (x) => void (x.notes = v))} placeholder="Notes: contacts, favors owed, rumors" />
          </li>
        ))}
      </ul>
      <div className="btn-row">
        <Text value={name} onChange={setName} placeholder="e.g. Harpers, Zhentarim" />
        <button disabled={!name.trim()} onClick={() => (edit((d) => void d.factions.push({ id: uid(), name: name.trim(), renown: 0, notes: '' })), setName(''))}>
          Add faction
        </button>
      </div>
      <Rule>
        2024 DMG renown: 3+ means a respected member (members are Friendly, and offer lodging and food in dire need; perhaps a contact, safe house or gear discount). 10+ might open access to potions and scrolls, favors and backup. 50+ might mean a small army, a Rare magic item or a helpful spellcaster. Only serious offenses against the group cost renown, and it never drops below 0. A common pace is +1 for a mission that serves the group, or +1 per level with level-based renown.
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

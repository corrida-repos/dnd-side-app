import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { uid } from '../state/defaults';
import { dateFromIndex, formatDuration } from '../rules/calendar';
import { GIFT_TYPES, type GiftType } from '../rules/hazards';
import { DIVINATION_SPELLS, divinationFailChance, moonPhase, RESURRECTION_SPELLS, RITUAL_PRESETS } from '../rules/longterm';
import { Card, Meter, Num, Pill, Select, Text, Rule } from './common';
import { WaysAround } from './WaysAround';

export function WorldTab() {
  return (
    <div className="grid">
      <SkyCard />
      <FactionsCard />
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

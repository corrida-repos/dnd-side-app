import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { checkChance, checkModifiers, naturalNeeded, DANGER, DANGERS, DIFFICULTY_LABEL, encountersPerDay, type CheckConditions, type Danger, type Difficulty } from '../rules/encounters';
import { TERRAIN, type TerrainType } from '../rules/terrain';
import { formatDuration } from '../rules/calendar';
import { Card, Pill, Rule, Select, Toggle } from './common';
import { senseText } from './senseView';
import { BookAdvice } from './SettingsTab';

type Act = CheckConditions['activity'];
const ACT_LABEL: Record<Act, string> = { travel: 'Travelling', camp: 'In camp', rest: 'Long Rest', explore: 'Exploring a dungeon' };
const DIFF_TONE: Record<Difficulty, 'muted' | 'good' | 'info' | 'warn' | 'bad'> = { trivial: 'muted', low: 'good', moderate: 'info', high: 'warn', beyond: 'bad' };
const pct = (n: number) => `${Math.round(n * 100)}%`;

export function EncountersTab() {
  const [act, setAct] = useState<Act>('travel');
  return (
    <div className="grid">
      <DangerCard />
      <ConditionsCard act={act} setAct={setAct} />
      <WhenCard />
      <TableCard act={act} />
      <RecentCard />
    </div>
  );
}

export const dangerOptions = DANGERS.map((d) => ({ value: d, label: `${DANGER[d].label}: ${DANGER[d].examples}` }));

function DangerCard() {
  const s = useGame();
  const info = DANGER[s.place.danger];
  const party = E.encounterParty(s);
  const nextIn = Math.max(0, info.everyHours * 60 - s.encounterClock);
  const turnsLeft = Math.max(1, info.everyTurns - s.exploreTurns);
  return (
    <Card title="Location danger">
      <div className="form-row">
        <Select label={`Danger at ${s.place.name || 'this place'}`} value={s.place.danger} onChange={(v: Danger) => edit((d) => void (d.place.danger = v))} options={dangerOptions} />
      </div>
      <p className="small">
        {TERRAIN[s.place.terrain].label}, <strong>{info.label}</strong> danger. Tables are built for {party.size} character{party.size === 1 ? '' : 's'} of level {party.level} (average of the living
        party), aiming at <strong>{DIFFICULTY_LABEL[info.builtFor]}</strong> difficulty.
      </p>
      {s.settings.encounters ? (
        <p className="small">
          Next overland check in <strong>{formatDuration(nextIn)}</strong> of travel, camp or rest. In a dungeon, next check after <strong>{turnsLeft}</strong> more exploration turn{turnsLeft === 1 ? '' : 's'}.
        </p>
      ) : (
        <p className="small warn-text">Automatic checks are off. Roll by hand below, or use the per-watch and per-turn numbers on the Camp and Effects tabs.</p>
      )}
      <div className="form-row">
        <Toggle checked={s.settings.encounters} onChange={(v) => edit((d) => void (d.settings.encounters = v))} label="Roll checks automatically as time passes" />
        <Toggle checked={s.settings.srdEncounters} onChange={(v) => edit((d) => void (d.settings.srdEncounters = v))} label="Use the built-in SRD 5.2 creatures" />
      </div>
      <p className="small muted">
        Imported bestiaries (Settings) with Challenge Ratings and environments are added to the tables automatically, and replace SRD creatures of the same name.
      </p>
      <SourceToggles />
      <BookAdvice />
    </Card>
  );
}

/** Switch whole imported books in or out of the tables, e.g. a horror book between arcs. */
function SourceToggles() {
  const s = useGame();
  const counts = new Map<string, number>();
  for (const c of s.bestiary) if (c.cr && c.env?.length && !c.flags?.includes('N')) counts.set(c.source ?? '?', (counts.get(c.source ?? '?') ?? 0) + 1);
  if (!counts.size) return null;
  return (
    <div className="form-row">
      <span className="small">Books in the tables:</span>
      {[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([src, n]) => (
          <Toggle
            key={src}
            checked={!s.encounterSourcesOff.includes(src)}
            onChange={(v) => edit((d) => void (d.encounterSourcesOff = v ? d.encounterSourcesOff.filter((x) => x !== src) : [...d.encounterSourcesOff, src]))}
            label={`${src} (${n})`}
          />
        ))}
    </div>
  );
}

function WhenCard() {
  const s = useGame();
  return (
    <Card title="When to roll" className="span-2">
      <div className="table-wrap">
        <table className="watch-table">
          <thead>
            <tr>
              <th>Danger</th>
              <th>Overland check</th>
              <th>Dungeon check</th>
              <th>Encounter on d20</th>
              <th>Per check</th>
              <th>About per day</th>
              <th>Tables built for</th>
            </tr>
          </thead>
          <tbody>
            {DANGERS.map((d) => {
              const i = DANGER[d];
              const here = d === s.place.danger;
              return (
                <tr key={d} style={here ? { fontWeight: 600 } : undefined}>
                  <td>
                    {here ? '▶ ' : ''}
                    {i.label}
                    <div className="small muted">{i.examples}</div>
                  </td>
                  <td>every {i.everyHours} h</td>
                  <td>
                    every {i.everyTurns} turn{i.everyTurns > 1 ? 's' : ''} ({i.everyTurns * 10} min)
                  </td>
                  <td>{i.on === 20 ? '20' : `${i.on}–20`}</td>
                  <td>{pct(checkChance(i.on, 0))}</td>
                  <td>{encountersPerDay(d).toFixed(1)}</td>
                  <td>
                    <Pill tone={DIFF_TONE[i.builtFor]}>{DIFFICULTY_LABEL[i.builtFor]}</Pill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Rule>
        Table rule. The 2024 DMG says to roll on a random encounter table but leaves how often to you; this uses the classic d20 check and scales it with danger. Overland checks run during travel, waiting in camp
        and Long Rests (each one names who is on watch), but not during downtime work. In a dungeon, use exploration turns on the Effects tab. Group sizes follow the 2024 DMG XP budget for the chosen difficulty;
        a Deadly area goes past High.
      </Rule>
    </Card>
  );
}

const ALL_MODS: { label: string; value: number; when: string }[] = [
  { label: 'Night', value: 1, when: 'outdoors after dark' },
  { label: 'Light in the dark', value: 1, when: 'campfire or light burning at night or underground, while stopped' },
  { label: 'Fast pace', value: 1, when: 'travelling fast' },
  { label: 'Large group', value: 1, when: 'more than 6 in the party, counting mounts and hirelings' },
  { label: 'Slow pace', value: -1, when: 'travelling slowly (stealthily)' },
  { label: 'Good road', value: -1, when: 'travelling on a good road' },
  { label: 'Foul weather', value: -1, when: 'heavy rain or snow, or strong wind' },
  { label: 'Sheltered camp', value: -1, when: 'in a building or cave, or under a shelter spell' },
];

function ConditionsCard({ act, setAct }: { act: Act; setAct: (a: Act) => void }) {
  const s = useGame();
  const info = DANGER[s.place.danger];
  const mods = checkModifiers(E.encounterConditions(s, act));
  const total = mods.reduce((a, m) => a + m.value, 0);
  const active = new Set(mods.map((m) => m.label));
  const need = naturalNeeded(info.on, total);
  return (
    <Card title="Rolling conditions">
      <div className="form-row">
        <Select label="The party is" value={act} onChange={(v: Act) => setAct(v)} options={(Object.keys(ACT_LABEL) as Act[]).map((k) => ({ value: k, label: ACT_LABEL[k] }))} />
      </div>
      <ul className="plain small">
        {ALL_MODS.map((m) => (
          <li key={m.label} className={active.has(m.label) ? '' : 'muted'}>
            {active.has(m.label) ? '✔' : '·'} <strong>{m.label}</strong> {m.value > 0 ? `+${m.value}` : m.value}: {m.when}
          </li>
        ))}
      </ul>
      <p className="small">
        Right now: d20 {total ? (total > 0 ? `+${total}` : total) : '+0'}. An encounter on a natural {need === 20 ? '20' : `${need}–20`} ({pct(checkChance(info.on, total))} a check).
      </p>
      <div className="btn-row">
        <button className="primary" onClick={() => dispatch((st, cx) => E.checkForEncounter(st, cx, act))}>
          Roll encounter check
        </button>
        <button onClick={() => dispatch((st, cx) => E.rollRandomEncounter(st, cx, act))} title="Skip the check: something turns up">
          Roll on the table
        </button>
      </div>
      <Rule>Table rule: + makes an encounter more likely, − less likely. The modifiers are added to the d20, and a natural 20 always brings an encounter.</Rule>
    </Card>
  );
}

function TableCard({ act }: { act: Act }) {
  const s = useGame();
  const [terrain, setTerrain] = useState<TerrainType | 'here'>('here');
  const [danger, setDanger] = useState<Danger | 'here'>('here');
  const t = E.encounterTable(s, terrain === 'here' ? s.place.terrain : terrain, danger === 'here' ? s.place.danger : danger);
  const isHere = (terrain === 'here' || terrain === s.place.terrain) && (danger === 'here' || danger === s.place.danger);
  return (
    <Card
      title={`Random encounters: ${TERRAIN[t.terrain].label}, ${DANGER[t.danger].label} (d100)`}
      className="span-2"
      actions={
        isHere && (
          <button className="ghost" onClick={() => dispatch((st, cx) => E.rollRandomEncounter(st, cx, act))}>
            Roll d100
          </button>
        )
      }
    >
      <div className="form-row">
        <Select
          label="Terrain"
          value={terrain}
          onChange={(v: TerrainType | 'here') => setTerrain(v)}
          options={[{ value: 'here' as const, label: `Here (${TERRAIN[s.place.terrain].label})` }, ...(Object.keys(TERRAIN) as TerrainType[]).map((k) => ({ value: k, label: TERRAIN[k].label }))]}
        />
        <Select
          label="Danger"
          value={danger}
          onChange={(v: Danger | 'here') => setDanger(v)}
          options={[{ value: 'here' as const, label: `Here (${DANGER[s.place.danger].label})` }, ...DANGERS.map((d) => ({ value: d, label: DANGER[d].label }))]}
        />
      </div>
      <div className="table-wrap">
        <table className="watch-table">
          <thead>
            <tr>
              <th>d100</th>
              <th>Encounter</th>
              <th>CR</th>
              <th>Type</th>
              <th>Average XP</th>
              <th>Difficulty</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r) => (
              <tr key={`${r.from}-${r.text}`}>
                <td>{r.from === r.to ? String(r.from).padStart(2, '0') : `${String(r.from).padStart(2, '0')}–${r.to === 100 ? '00' : String(r.to).padStart(2, '0')}`}</td>
                <td>
                  {r.text}
                  {r.creature?.source && r.creature.source !== 'SRD 5.2' && <span className="small muted"> ({r.creature.source})</span>}
                </td>
                <td>{r.creature?.cr ?? ''}</td>
                <td className="small">{r.creature ? `${r.creature.size} ${r.creature.type}` : 'no fight'}</td>
                <td>{r.xp ?? ''}</td>
                <td>{r.difficulty && <Pill tone={DIFF_TONE[r.difficulty]}>{DIFFICULTY_LABEL[r.difficulty]}</Pill>}</td>
                <td>
                  {r.creature && (
                    <button className="ghost small" title="Leave this creature out of every table" onClick={() => edit((d) => void d.encounterExclude.push(r.creature!.name))}>
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(() => {
        const triv = t.rows.filter((r) => r.difficulty === 'trivial').reduce((a, r) => a + r.to - r.from + 1, 0);
        const fights = t.rows.filter((r) => r.creature).reduce((a, r) => a + r.to - r.from + 1, 0);
        return fights > 0 && triv / fights > 0.3 && t.danger !== 'safe' ? (
          <p className="small warn-text">
            Few creatures that live here are a match for level {t.party.level}, so some rows are trivial filler. Importing a full bestiary (Settings) adds more, or treat this area as a legendary creature&apos;s domain.
          </p>
        ) : null;
      })()}
      {t.rows.every((r) => r.kind === 'peaceful') && <p className="small warn-text">No creatures fit this terrain and party. Turn on the SRD creatures or import a bestiary in Settings.</p>}
      {s.encounterExclude.length > 0 && (
        <p className="small">
          Left out:{' '}
          {s.encounterExclude.map((n) => (
            <button key={n} className="ghost small" title="Put back in the tables" onClick={() => edit((d) => void (d.encounterExclude = d.encounterExclude.filter((x) => x !== n)))}>
              {n} ↺
            </button>
          ))}
        </p>
      )}
      <Rule>
        Built from the creatures that live in this terrain (5etools environment tags), weighted toward natives over travellers, spread across Challenge Ratings, and sized to the danger level&apos;s XP budget.
        Leaders bring followers, solitary creatures come alone, only swimmers and fliers reach a ship, tame animals are left out, and legendary creatures are rare outside their lairs. When a
        creature turns up, the app rolls how many, their starting attitude (from alignment), and how far away they are (DMG Travel Terrain table). Creatures from the System Reference Document 5.2 (CC BY 4.0).
      </Rule>
    </Card>
  );
}

function RecentCard() {
  const s = useGame();
  const recent = s.log.filter((l) => l.text.startsWith('Random encounter')).slice(0, 6);
  return (
    <Card title="Recent encounters" className="span-2">
      {recent.length === 0 && <p className="muted small">No random encounters yet.</p>}
      <ul className="plain">
        {recent.map((l) => (
          <li key={l.id} className={`small ${l.tone === 'bad' ? 'bad-text' : ''}`}>
            <span className="muted">{l.stamp}</span> {l.text}
            {l.sense && (
              <div>
                <em>Players: {senseText(s, l.charIds ?? [], l.sense)}</em>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

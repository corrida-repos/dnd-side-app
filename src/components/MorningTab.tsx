import { useMemo, useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { uid } from '../state/defaults';
import { isCaster, levelLabel, PREP_RULE, PREP_RULE_TEXT, preparedCount, preparedLimit } from '../rules/spells';
import { Card, Num, Pill, Select, Text, Toggle, Rule } from './common';
import { armorTime, ARMOR_LABEL } from '../rules/survival';
import { spellInfo, RITUAL_EXTRA_MINUTES } from '../rules/rituals';
import { formatDuration } from '../rules/calendar';
import type { Character, CharacterSpell } from '../state/types';
import { WaysAround } from './WaysAround';

export function MorningTab() {
  const s = useGame();
  const done = s.characters.reduce((a, c) => a + c.tasks.filter((t) => t.done).length, 0);
  const total = s.characters.reduce((a, c) => a + c.tasks.length, 0);
  return (
    <div className="stack">
      <p className="muted">
        Daily tasks reset after every Long Rest. {done}/{total} done.
      </p>
      <Card>
        <WaysAround topic={['rituals', 'concentration']} />
      </Card>
      <div className="grid wide">
        {s.characters.filter((c) => c.kind !== 'mount').map((c) => (
          <MorningCard key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}

const setChar = (id: string, fn: (c: Character) => void) =>
  edit((d) => {
    const c = d.characters.find((x) => x.id === id);
    if (c) fn(c);
  });

function MorningCard({ c }: { c: Character }) {
  const [newTask, setNewTask] = useState('');
  return (
    <Card title={`${c.name} · ${c.className} ${c.level}`}>
      {c.armorKind !== 'none' && (
        <div className="armor-row">
          <span>
            {c.armorName || ARMOR_LABEL[c.armorKind]} {c.armorWorn ? <Pill tone="good">On</Pill> : <Pill tone="warn">Off</Pill>}
          </span>
          {!c.armorWorn && (
            <button className="small" onClick={() => dispatch((st, cx) => E.setArmor(st, cx, c.id, 'don'))}>
              Put on armor ({armorTime(c, 'don')} min)
            </button>
          )}
        </div>
      )}
      <ul className="tasks">
        {c.tasks.map((t) => (
          <li key={t.id}>
            <Toggle checked={t.done} onChange={(v) => setChar(c.id, (x) => void (x.tasks.find((y) => y.id === t.id)!.done = v))} label={t.label} />
            <span className="task-meta">
              <button
                className="ghost small"
                title={t.daily ? 'Resets every Long Rest' : 'One-off task'}
                onClick={() => setChar(c.id, (x) => void (x.tasks.find((y) => y.id === t.id)!.daily = !t.daily))}
              >
                {t.daily ? 'daily' : 'once'}
              </button>
              <button className="ghost small" aria-label="Remove task" onClick={() => setChar(c.id, (x) => void (x.tasks = x.tasks.filter((y) => y.id !== t.id)))}>
                ✕
              </button>
            </span>
          </li>
        ))}
      </ul>
      <form
        className="btn-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newTask.trim()) return;
          setChar(c.id, (x) => void x.tasks.push({ id: uid(), label: newTask.trim(), done: false, daily: true }));
          setNewTask('');
        }}
      >
        <Text value={newTask} onChange={setNewTask} placeholder="Add a task, e.g. cast Goodberry, attune ring" />
        <button type="submit">Add</button>
      </form>
      {(isCaster(c.className) || c.spells.length > 0) && <SpellPrep c={c} />}
    </Card>
  );
}

function CastPanel({ c }: { c: Character }) {
  const s = useGame();
  const known = c.spells.map((sp) => ({ sp, info: { ...sp, ...spellInfo(sp, s.spellLibrary) } as CharacterSpell }));
  const [name, setName] = useState('');
  if (!known.length) return null;
  const pick = known.find((k) => k.sp.name === name) ?? known[0];
  const info = pick.info;
  const ritualCheck = E.canCastAsRitual(c, info);
  const base = info.castMinutes ?? 0;
  const slots = c.resources.filter((r) => /(spell|pact) slots \(level (\d)\)/i.test(r.name) && Number(/level (\d)/i.exec(r.name)![1]) >= info.level);
  const slotLeft = slots.reduce((a, r) => a + r.current, 0);
  return (
    <div className="cast-panel">
      <h3>Cast a spell</h3>
      <div className="btn-row tight">
        <Select
          value={pick.sp.name}
          onChange={setName}
          options={known.map((k) => ({ value: k.sp.name, label: `${k.sp.name}${k.info.ritual ? ' (R)' : ''}${k.info.level ? ` · L${k.info.level}` : ' · cantrip'}` }))}
        />
        <button
          className="small"
          disabled={info.level > 0 && !info.prepared && !info.alwaysPrepared}
          title={info.level > 0 && !info.prepared && !info.alwaysPrepared ? 'Not prepared' : ''}
          onClick={() => dispatch((st, cx) => E.castSpell(st, cx, c.id, pick.sp.name, 'slot'))}
        >
          Cast ({info.castTime ?? 'casting time'}
          {info.level > 0 ? (slots.length ? `, slot: ${slotLeft} left` : ', uses a slot') : ''})
        </button>
        <button className="small primary" disabled={!ritualCheck.ok} title={ritualCheck.reason} onClick={() => dispatch((st, cx) => E.castSpell(st, cx, c.id, pick.sp.name, 'ritual'))}>
          As ritual ({formatDuration(Math.max(1, Math.round(base + RITUAL_EXTRA_MINUTES)))}, no slot)
        </button>
      </div>
      <p className="small muted">
        {info.ritual ? (ritualCheck.ok ? 'Ritual: casting time + 10 minutes, and no spell slot.' : ritualCheck.reason) : 'Not a ritual.'}{' '}
        {info.durationMinutes ? `Lasts ${formatDuration(info.durationMinutes)}${info.concentration ? ' (Concentration)' : ''}, and a timer starts on the Effects & Lights tab.` : info.permanent ? 'Lasts until dispelled.' : info.durationMinutes === null ? 'Instantaneous.' : ''}
        {info.castMinutes === undefined && ' Casting time unknown: import a 5etools spell file for exact times.'}
      </p>
    </div>
  );
}

function SpellPrep({ c }: { c: Character }) {
  const s = useGame();
  const [setup, setSetup] = useState(false);
  const [query, setQuery] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualLevel, setManualLevel] = useState(1);
  const [drop, setDrop] = useState('');
  const [add, setAdd] = useState('');
  const limit = preparedLimit(c);
  const count = preparedCount(c);
  const rule = isCaster(c.className) ? PREP_RULE[c.className] : null;
  const canToggle = setup || c.prepOpen;

  const byLevel = useMemo(() => {
    const m = new Map<number, CharacterSpell[]>();
    [...c.spells].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)).forEach((sp) => {
      if (!m.has(sp.level)) m.set(sp.level, []);
      m.get(sp.level)!.push(sp);
    });
    return [...m.entries()];
  }, [c.spells]);

  const [classOnly, setClassOnly] = useState(true);
  const hasClasses = Object.keys(s.spellClasses).length > 0;
  const onList = (name: string) => !hasClasses || !classOnly || (s.spellClasses[name.toLowerCase()] ?? []).includes(c.className);
  const libMatches = query.length >= 2 ? s.spellLibrary.filter((sp) => sp.name.toLowerCase().includes(query.toLowerCase()) && !c.spells.some((x) => x.name === sp.name) && onList(sp.name)).slice(0, 12) : [];

  const addSpell = (sp: { name: string; level: number; school?: string; source?: string; ritual?: boolean; concentration?: boolean }) =>
    setChar(c.id, (x) => {
      if (!x.spells.some((y) => y.name.toLowerCase() === sp.name.toLowerCase())) x.spells.push({ ...sp, prepared: sp.level === 0, alwaysPrepared: false });
    });

  return (
    <div className="spellprep">
      <h3>
        Spell preparation{' '}
        {limit != null && (
          <Pill tone={count > limit ? 'bad' : count === limit ? 'good' : 'warn'}>
            {count}/{limit} prepared
          </Pill>
        )}{' '}
        {c.prepOpen && <Pill tone="good">Can change spells now</Pill>}
        {c.swapsLeft > 0 && <Pill tone="good">{c.swapsLeft} swap left</Pill>}
      </h3>
      {rule && <Rule>{PREP_RULE_TEXT[rule]} Cantrips and always-prepared spells don&apos;t count toward the limit.</Rule>}
      <div className="form-row">
        <Num
          label="Limit override"
          value={c.preparedOverride ?? limit ?? 0}
          onChange={(v) => setChar(c.id, (x) => void (x.preparedOverride = Math.round(v)))}
          min={0}
          width={3}
        />
        {c.preparedOverride != null && (
          <button className="ghost small" onClick={() => setChar(c.id, (x) => void (x.preparedOverride = null))}>
            Use class table
          </button>
        )}
        <Toggle checked={setup} onChange={setSetup} label="Setup mode (edit freely)" title="For building the sheet, levelling up, or a DM ruling" />
      </div>

      {byLevel.length === 0 && <p className="muted small">No spells yet. Add them below, or import a spell list in Settings.</p>}
      {byLevel.map(([lvl, spells]) => (
        <div key={lvl} className="spell-level">
          <div className="spell-level-head">{levelLabel(lvl)}</div>
          <div className="spell-list">
            {spells.map((sp) => (
              <span key={sp.name} className={`spell ${sp.prepared ? 'prepared' : ''} ${sp.alwaysPrepared ? 'always' : ''}`}>
                <label>
                  <input
                    type="checkbox"
                    checked={sp.prepared || sp.alwaysPrepared}
                    disabled={sp.alwaysPrepared || (!canToggle && sp.level > 0)}
                    onChange={() => dispatch((st, cx) => E.togglePrepared(st, cx, c.id, sp.name, setup || sp.level === 0))}
                  />
                  {sp.name}
                  {(() => {
                    const info = spellInfo(sp, s.spellLibrary);
                    return (
                      <>
                        {info.ritual && <sup title={`Ritual: ${info.castTime ?? 'casting time'} + 10 minutes, no slot`}>R</sup>}
                        {info.concentration && <sup title="Concentration">C</sup>}
                      </>
                    );
                  })()}
                </label>
                {setup && (
                  <>
                    <button
                      className="ghost tiny"
                      title="Always prepared (subclass or feature)"
                      onClick={() =>
                        setChar(c.id, (x) => {
                          const y = x.spells.find((z) => z.name === sp.name)!;
                          y.alwaysPrepared = !y.alwaysPrepared;
                        })
                      }
                    >
                      {sp.alwaysPrepared ? '★' : '☆'}
                    </button>
                    <button className="ghost tiny" aria-label={`Remove ${sp.name}`} onClick={() => setChar(c.id, (x) => void (x.spells = x.spells.filter((z) => z.name !== sp.name)))}>
                      ✕
                    </button>
                  </>
                )}
              </span>
            ))}
          </div>
        </div>
      ))}

      <CastPanel c={c} />

      {c.swapsLeft > 0 && !setup && (
        <div className="btn-row">
          <Select
            value={drop}
            onChange={setDrop}
            options={[{ value: '', label: 'Replace…' }, ...c.spells.filter((x) => x.prepared && !x.alwaysPrepared && x.level > 0).map((x) => ({ value: x.name, label: x.name }))]}
          />
          <span>with</span>
          <Select value={add} onChange={setAdd} options={[{ value: '', label: 'New spell…' }, ...c.spells.filter((x) => !x.prepared && x.level > 0).map((x) => ({ value: x.name, label: x.name }))]} />
          <button disabled={!drop || !add} onClick={() => (dispatch((st, cx) => E.replaceSpell(st, cx, c.id, drop, add)), setDrop(''), setAdd(''))}>
            Swap
          </button>
        </div>
      )}

      <div className="btn-row">
        <button className="primary" onClick={() => dispatch((st, cx) => E.finishPreparation(st, cx, c.id))}>
          Finish preparing
        </button>
        {c.className === 'Wizard' && (
          <button className="ghost small" title="1 hour and 10 GP per level of each prepared spell" onClick={() => confirm('Rewrite all prepared spells into a new spellbook?') && dispatch((st, cx) => E.replaceSpellbook(st, cx, c.id))}>
            Replace a lost spellbook
          </button>
        )}
      </div>
      {c.className === 'Wizard' && <Rule>Copy new spells into the spellbook from the Downtime tab (2 hours and 50 GP per spell level).</Rule>}

      <details>
        <summary>Add spells to {c.className === 'Wizard' ? 'spellbook' : 'the list'}</summary>
        {s.spellLibrary.length > 0 ? (
          <>
            <Text value={query} onChange={setQuery} placeholder={`Search ${s.spellLibrary.length} imported spells`} />
            {hasClasses && <Toggle checked={classOnly} onChange={setClassOnly} label={`Only ${c.className} spells`} />}
            <div className="chips">
              {libMatches.map((sp) => (
                <button key={`${sp.name}|${sp.source}`} className="ghost small" onClick={() => addSpell(sp)}>
                  + {sp.name} <span className="muted">({sp.level === 0 ? 'C' : sp.level}{sp.source ? `, ${sp.source}` : ''})</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="muted small">Tip: import a 5etools spell JSON in Settings to search it here.</p>
        )}
        <form
          className="btn-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!manualName.trim()) return;
            addSpell({ name: manualName.trim(), level: manualLevel });
            setManualName('');
          }}
        >
          <Text value={manualName} onChange={setManualName} placeholder="Spell name" />
          <Num value={manualLevel} onChange={(v) => setManualLevel(Math.round(v))} min={0} max={9} width={2} />
          <button type="submit">Add by hand</button>
        </form>
      </details>
    </div>
  );
}

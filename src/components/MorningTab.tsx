import { BOOKKEEPING_TARGET_LIMIT } from '../rules/spellBookkeeping';
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
import { componentFor, TARGET_SPELLS } from '../rules/components';
import { fmtGp } from '../rules/money';
import { circleEligible, circleOption, CIRCLE_OPTIONS, CIRCLE_RANGE_FT, helperProblem, optionProblem, slotNeedText, slotsLeft, spellCircle, type CircleOptionId } from '../rules/circle';

const setChar = (id: string, fn: (c: Character) => void) =>
  edit((d) => {
    const c = d.characters.find((x) => x.id === id);
    if (c) fn(c);
  });

export function MorningCard({ c }: { c: Character }) {
  const [newTask, setNewTask] = useState('');
  return (
    <Card title={`${c.name} · spells & tasks`}>
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
  const [target, setTarget] = useState('');
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [slotLevel, setSlotLevel] = useState('');
  const [helperIds, setHelperIds] = useState<string[]>([]);
  const [option, setOption] = useState<CircleOptionId>('prolong');
  if (!known.length) return null;
  const pick = known.find((k) => k.sp.name === name) ?? known[0];
  const info = pick.info;
  const ritualCheck = E.canCastAsRitual(c, info);
  const base = info.castMinutes ?? 0;
  const slots = c.resources.filter((r) => /(spell|pact) slots \(level (\d)\)/i.test(r.name) && Number(/level (\d)/i.exec(r.name)![1]) >= info.level);
  const slotLeft = slots.reduce((a, r) => a + r.current, 0);
  const key = info.name.toLowerCase();
  const limit = BOOKKEEPING_TARGET_LIMIT[key];
  const eligible = s.characters.filter((x) => x.diedAt == null && E.mountWithParty(x)
    && (key !== 'prayer of healing' || !x.prayerOfHealingUsed));
  const availableLevels = [...new Set(slots.filter((r) => r.current > 0).map((r) => /level (\d)/i.exec(r.name)![1]))].sort();
  const chosenLevel = limit && availableLevels.includes(slotLevel) ? Number(slotLevel) : undefined;
  const selected = targetIds.filter((id) => eligible.some((x) => x.id === id));
  return (
    <div className="cast-panel">
      <h3>Cast a spell</h3>
      <div className="btn-row tight">
        <Select
          value={pick.sp.name}
          onChange={(value) => { setName(value); setTargetIds([]); setSlotLevel(''); }}
          options={known.map((k) => ({ value: k.sp.name, label: `${k.sp.name}${k.info.ritual ? ' (R)' : ''}${k.info.level ? ` · L${k.info.level}` : ' · cantrip'}` }))}
        />
        <button
          className="small"
          disabled={(info.level > 0 && !info.prepared && !info.alwaysPrepared) || (!!limit && !selected.length)}
          title={info.level > 0 && !info.prepared && !info.alwaysPrepared ? 'Not prepared' : ''}
          onClick={() => dispatch((st, cx) => E.castSpell(st, cx, c.id, pick.sp.name, 'slot', TARGET_SPELLS[pick.sp.name] ? target || null : null, null, selected, chosenLevel))}
        >
          Cast ({info.castTime ?? (key === 'prayer of healing' || key === "heroes' feast" ? '10 minutes' : 'casting time')}
          {info.level > 0 ? (slots.length ? `, slot: ${slotLeft} left` : ', uses a slot') : ''})
        </button>
        <button className="small primary" disabled={!ritualCheck.ok} title={ritualCheck.reason} onClick={() => dispatch((st, cx) => E.castSpell(st, cx, c.id, pick.sp.name, 'ritual'))}>
          As ritual ({formatDuration(Math.max(1, Math.round(base + RITUAL_EXTRA_MINUTES)))}, no slot)
        </button>
      </div>
      {!!limit && availableLevels.length > 1 && (
        <Select label="Spell slot" value={chosenLevel?.toString() ?? ''} onChange={setSlotLevel}
          options={[{ value: '', label: 'Lowest available' }, ...availableLevels.map((value) => ({ value, label: `Level ${value}` }))]} />
      )}
      {s.settings.circleMagic && circleEligible(info).ok && <CirclePanel c={c} info={info} helperIds={helperIds} setHelperIds={setHelperIds} option={option} setOption={setOption} target={TARGET_SPELLS[pick.sp.name] ? target || null : null} recipients={selected} requiresRecipients={!!limit} chosenSlotLevel={chosenLevel} />}
      {!!limit && (
        <fieldset>
          <legend>{limit === 1 ? 'Choose a recipient' : `Choose up to ${limit} recipients`}</legend>
          {eligible.map((x) => (
            <Toggle key={x.id} label={x.name} checked={selected.includes(x.id)}
              onChange={(checked) => setTargetIds(checked ? (limit === 1 ? [x.id] : [...selected, x.id].slice(0, limit)) : selected.filter((id) => id !== x.id))} />
          ))}
          {!eligible.length && <p className="small muted">No eligible recipients.</p>}
        </fieldset>
      )}
      {TARGET_SPELLS[pick.sp.name] && (
        <div className="btn-row tight">
          <Select label="Target" value={target} onChange={setTarget} options={[{ value: '', label: 'Choose…' }, ...s.characters.map((x) => ({ value: x.id, label: `${x.name}${x.diedAt != null ? ' (dead)' : ''}` }))]} />
          <span className="small muted">{TARGET_SPELLS[pick.sp.name]}</span>
        </div>
      )}
      {componentFor(pick.sp.name) && (
        <p className="small muted">
          Needs {componentFor(pick.sp.name)!.what}
          {componentFor(pick.sp.name)!.consumed ? ', used up' : ''}. {c.name} carries {fmtGp(E.componentKnownValue(c, componentFor(pick.sp.name)!))} worth
          {E.componentUnknown(c, componentFor(pick.sp.name)!).length ? `, plus ${E.componentUnknown(c, componentFor(pick.sp.name)!).map((i) => i.name).join(', ')} of unknown value` : ''}.
        </p>
      )}
      <p className="small muted">
        {info.ritual ? (ritualCheck.ok ? 'Ritual: casting time + 10 minutes, and no spell slot.' : ritualCheck.reason) : 'Not a ritual.'}{' '}
        {info.durationMinutes ? `Lasts ${formatDuration(info.durationMinutes)}${info.concentration ? ' (Concentration)' : ''}, and a timer starts on the Effects & Ailments tab.` : info.permanent ? 'Lasts until dispelled.' : info.durationMinutes === null ? 'Instantaneous.' : ''}
        {info.castMinutes === undefined && ' Casting time unknown: import a 5etools spell file for exact times.'}
      </p>
    </div>
  );
}

/** Circle Magic (Heroes of Faerûn): secondary casters join a spell that takes 1 minute or longer. */
function CirclePanel({ c, info, helperIds, setHelperIds, option: picked, setOption, target, recipients, requiresRecipients, chosenSlotLevel }: { c: Character; info: CharacterSpell; helperIds: string[]; setHelperIds: (v: string[]) => void; option: CircleOptionId; setOption: (v: CircleOptionId) => void; target: string | null; recipients: string[]; requiresRecipients: boolean; chosenSlotLevel?: number }) {
  const s = useGame();
  // Options this spell can use, as far as the app knows (range and area aren't stored, so those are left to the table).
  const usable = CIRCLE_OPTIONS.filter((o) => !optionProblem(info, o.id, 99));
  const option = usable.some((o) => o.id === picked) ? picked : usable[0]?.id ?? picked;
  const opt = circleOption(option);
  const need = opt.helperSlot(info);
  const others = s.characters.filter((x) => x.id !== c.id && x.diedAt == null && x.kind !== 'mount');
  const chosen = helperIds.filter((id) => others.some((x) => x.id === id && !helperProblem(x, need)));
  const problem = chosen.length ? optionProblem(info, option, chosen.length) : 'Pick at least one secondary caster';
  const prepared = info.prepared || info.alwaysPrepared;
  const own = spellCircle(info.name);
  const castTime = option === 'spell' && own?.castTime ? own.castTime : info.castTime;
  return (
    <div className="stack tight">
      <h4>Circle casting (optional rule)</h4>
      <Select label="Circle casting option" value={option} onChange={setOption} options={(usable.length ? usable : CIRCLE_OPTIONS).map((o) => ({ value: o.id, label: `${o.label} (helpers spend ${slotNeedText(o.helperSlot(info))})` }))} />
      <p className="small muted">{option === 'spell' && own ? `${info.name} as a Circle spell: ${own.note}; at least ${own.minHelpers} secondary caster${own.minHelpers > 1 ? 's' : ''}.` : opt.summary}</p>
      <div className="btn-row tight">
        {others.map((x) => {
          const why = helperProblem(x, need);
          const left = need.kind === 'none' ? Infinity : slotsLeft(x, need.kind === 'any' ? 1 : need.level);
          return (
            <Toggle
              key={x.id}
              checked={chosen.includes(x.id)}
              onChange={(v) => setHelperIds(v ? [...chosen, x.id] : chosen.filter((id) => id !== x.id))}
              label={`${x.name}${why || left === Infinity ? '' : ` (${left} slot${left === 1 ? '' : 's'})`}`}
              title={why || undefined}
            />
          );
        })}
      </div>
      <button className="small primary" disabled={!!problem || !prepared || (requiresRecipients && !recipients.length)} title={!prepared ? 'Not prepared' : problem} onClick={() => dispatch((st, cx) => E.castSpell(st, cx, c.id, info.name, 'slot', target, { helperIds: chosen, option }, recipients, chosenSlotLevel))}>
        Cast as a Circle spell ({castTime}, {chosen.length + 1} caster{chosen.length ? 's' : ''})
      </button>
      {problem && chosen.length > 0 && <p className="small muted">{problem}</p>}
      <Rule>
        {c.name} is the primary caster: they choose targets, provide the components, spend the spell's slot and hold its Concentration. Each secondary caster needs the Spellcasting or Pact Magic feature and contributes from within {CIRCLE_RANGE_FT} feet of {c.name}. For the whole casting time everyone takes the Magic action each turn and keeps Concentration, so anything else they concentrate on ends; if anyone's Concentration breaks, the spell fails, no slot is spent and no Material component is consumed. Only one option applies per casting. At the DM's discretion, spellcasting NPCs can spend a use of a spell of the same level or higher in place of a slot.
      </Rule>
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

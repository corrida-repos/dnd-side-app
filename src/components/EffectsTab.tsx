import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { EFFECT_KIND_LABEL, EFFECT_PRESETS, EXPLORATION_TURN_MINUTES, holdBreathSeconds, type EffectKind } from '../rules/effects';
import { abilityMod } from '../rules/upkeep';
import { formatClock, formatDuration } from '../rules/calendar';
import { Card, Meter, Num, Pill, Select, Text, Toggle, Rule } from './common';

export function EffectsTab() {
  return (
    <div className="grid">
      <ActiveCard />
      <AddEffectCard />
      <ExploreCard />
      <BreathCard />
    </div>
  );
}

function ActiveCard() {
  const s = useGame();
  const now = E.absNow(s);
  const sorted = [...s.effects].sort((a, b) => (a.endsAt ?? Infinity) - (b.endsAt ?? Infinity));
  const concentrating = s.characters.filter((c) => s.effects.some((e) => e.concentration && e.casterId === c.id));
  return (
    <Card title={`Active effects and lights (${s.effects.length})`} className="span-2">
      {sorted.length === 0 && <p className="muted">Nothing is burning or active. Light a torch or cast a spell on the right.</p>}
      <ul className="plain">
        {sorted.map((e) => {
          const left = e.endsAt == null ? null : e.endsAt - now;
          const total = e.endsAt == null ? 1 : e.endsAt - e.startedAt;
          const who = e.targetIds.map((id) => E.charById(s, id)?.name).filter(Boolean).join(', ');
          const caster = e.casterId ? E.charById(s, e.casterId)?.name : null;
          return (
            <li key={e.id} className="facility">
              <div className="armor-row">
                <span>
                  <b>{e.name}</b> <Pill tone="muted">{EFFECT_KIND_LABEL[e.kind]}</Pill>
                  {e.concentration && <Pill tone="info">Concentration{caster ? `: ${caster}` : ''}</Pill>}
                  {e.shelter && <Pill tone="good">Shelter</Pill>}
                  {who && <span className="muted small"> on {who}</span>}
                </span>
                <span className="btn-row tight">
                  {e.endsAt != null && (
                    <button className="ghost small" onClick={() => dispatch((st, cx) => E.extendEffect(st, cx, e.id, e.kind === 'light' ? (/lamp|lantern/i.test(e.name) ? 360 : 60) : 60))}>
                      {e.kind === 'light' && /lamp|lantern/i.test(e.name) ? '+ oil flask (6 h)' : '+1 h'}
                    </button>
                  )}
                  <button className="ghost small bad" onClick={() => dispatch((st, cx) => E.endEffect(st, cx, e.id))}>
                    End
                  </button>
                </span>
              </div>
              <div className="small">
                {left == null ? (
                  <span className="muted">Lasts until ended</span>
                ) : (
                  <>
                    <Meter value={left} max={total} tone={left <= 10 ? 'bad' : left * 4 <= total ? 'warn' : 'good'} />{' '}
                    <span className={left <= 10 ? 'bad-text' : ''}>
                      {formatDuration(left)} left · ends {formatClock(e.endsAt! % 1440)}
                      {e.endsAt! - now >= 1440 - (s.minutes % 1440) ? ` in ${Math.ceil((e.endsAt! - now) / 1440)} day(s)` : ''}
                    </span>
                  </>
                )}
                {e.notes && <span className="muted"> · {e.notes}</span>}
              </div>
            </li>
          );
        })}
      </ul>
      {concentrating.length > 0 && <p className="small muted">Concentrating: {concentrating.map((c) => c.name).join(', ')}. Starting another Concentration spell ends the first one.</p>}
    </Card>
  );
}

function AddEffectCard() {
  const s = useGame();
  const [kind, setKind] = useState<EffectKind>('light');
  const options = EFFECT_PRESETS.filter((p) => p.kind === kind);
  const [name, setName] = useState(options[0].name);
  const preset = options.find((p) => p.name === name) ?? options[0];
  const [custom, setCustom] = useState('');
  const [minutes, setMinutes] = useState<number | null>(preset.minutes);
  const [targets, setTargets] = useState<string[]>([]);
  const [caster, setCaster] = useState('');
  const pick = (k: EffectKind) => {
    setKind(k);
    const first = EFFECT_PRESETS.find((p) => p.kind === k)!;
    setName(first.name);
    setMinutes(first.minutes);
  };
  return (
    <Card title="Start something">
      <div className="form-row">
        <Select label="Type" value={kind} onChange={pick} options={(Object.keys(EFFECT_KIND_LABEL) as EffectKind[]).map((k) => ({ value: k, label: EFFECT_KIND_LABEL[k] }))} />
        {kind !== 'other' && (
          <Select
            label="What"
            value={preset.name}
            onChange={(v) => {
              setName(v);
              setMinutes(EFFECT_PRESETS.find((p) => p.name === v)!.minutes);
            }}
            options={options.map((p) => ({ value: p.name, label: `${p.name}${p.concentration ? ' (C)' : ''}` }))}
          />
        )}
      </div>
      {kind === 'other' && <Text label="Name" value={custom} onChange={setCustom} placeholder="e.g. Blessing of the river spirit" wide />}
      <div className="form-row">
        <Num label="Lasts (minutes)" value={minutes ?? 0} onChange={(v) => setMinutes(Math.max(1, Math.round(v)))} min={1} width={6} />
        <Toggle checked={minutes == null} onChange={(v) => setMinutes(v ? null : preset.minutes ?? 60)} label="Until ended" />
      </div>
      <p className="small muted">{minutes == null ? 'Lasts until you end it.' : `About ${formatDuration(minutes)}.`}</p>
      <div className="field">
        <span className="field-label">On or carried by</span>
        <div className="chips">
          {s.characters.map((c) => (
            <Toggle key={c.id} checked={targets.includes(c.id)} onChange={(v) => setTargets(v ? [...targets, c.id] : targets.filter((x) => x !== c.id))} label={c.name} />
          ))}
        </div>
      </div>
      {kind !== 'light' && (
        <Select label="Caster (for Concentration)" value={caster} onChange={setCaster} options={[{ value: '', label: 'None' }, ...s.characters.map((c) => ({ value: c.id, label: c.name }))]} />
      )}
      {preset.note && kind !== 'other' && <Rule>{preset.note}</Rule>}
      <div className="btn-row">
        <button
          className="primary"
          disabled={kind === 'other' && !custom.trim()}
          onClick={() =>
            dispatch((st, cx) =>
              E.addEffect(st, cx, {
                preset: kind === 'other' ? { name: custom.trim(), kind, minutes } : preset,
                minutes,
                targetIds: targets,
                casterId: caster || null,
              }),
            )
          }
        >
          Start
        </button>
      </div>
    </Card>
  );
}

function ExploreCard() {
  const s = useGame();
  const [what, setWhat] = useState('');
  const lights = s.effects.filter((e) => e.kind === 'light');
  return (
    <Card title="Exploration turns">
      <p className="small">
        Careful exploration passes in {EXPLORATION_TURN_MINUTES}-minute turns: searching a room, checking for traps, listening at a door. Each turn burns down lights and spells.
      </p>
      <div className="btn-row">
        <Text value={what} onChange={setWhat} placeholder="What the party does (optional)" />
        <button className="primary" onClick={() => (dispatch((st, cx) => E.explorationTurn(st, cx, what.trim())), setWhat(''))}>
          Explore {EXPLORATION_TURN_MINUTES} min
        </button>
      </div>
      <div className="form-row">
        <Num
          label="Wandering monster on d20 of (0 = off)"
          value={s.settings.exploreEncounterOn}
          onChange={(v) => edit((d) => void (d.settings.exploreEncounterOn = Math.max(0, Math.min(20, Math.round(v)))))}
          min={0}
          max={20}
          width={2}
        />
      </div>
      <p className={`small ${lights.length ? '' : 'warn-text'}`}>
        {lights.length ? `Light: ${lights.map((l) => l.name).join(', ')}.` : 'No light source is burning. Without Darkvision the party is in Darkness underground.'}
      </p>
    </Card>
  );
}

function BreathCard() {
  const s = useGame();
  const [who, setWho] = useState(s.characters[0]?.id ?? '');
  const [mins, setMins] = useState(5);
  const [turns, setTurns] = useState(1);
  const c = s.characters.find((x) => x.id === who) ?? s.characters[0];
  if (!c) return null;
  const breath = holdBreathSeconds(abilityMod(c.conScore));
  return (
    <Card title="Holding breath and frigid water">
      <Select label="Who" value={c.id} onChange={setWho} options={s.characters.map((x) => ({ value: x.id, label: x.name }))} />
      <p>
        <b>{c.name}</b> can hold their breath for <b>{breath >= 60 ? formatDuration(breath / 60) : `${breath} seconds`}</b> (1 + Con modifier minutes, at least 30 seconds).
      </p>
      <div className="btn-row tight">
        <Num value={turns} onChange={(v) => setTurns(Math.max(1, Math.round(v)))} min={1} suffix="turns" width={2} />
        <button className="small bad" onClick={() => dispatch((st, cx) => E.suffocate(st, cx, c.id, turns))}>
          Out of breath for {turns} turn{turns > 1 ? 's' : ''}
        </button>
        <button className="small good" onClick={() => dispatch((st, cx) => E.breatheAgain(st, cx, c.id))}>
          Can breathe again
        </button>
      </div>
      <Rule>When they run out of breath or are choking, they gain 1 Exhaustion level at the end of each of their turns. Once they can breathe again, every level from suffocating goes away.</Rule>
      <h3>Frigid water</h3>
      <p className="small">
        Safe for <b>{c.conScore} minutes</b> (their Constitution score). After that, a DC 10 Con save each minute, or 1 Exhaustion level from Frigid water.
        {c.coldResist !== 'none' && ' Their Cold Resistance or Immunity keeps them safe.'}
        {c.coldWaterAdapted && ' They are adapted to icy water and stay safe.'}
      </p>
      <div className="btn-row">
        <Num value={mins} onChange={(v) => setMins(Math.max(1, Math.round(v)))} min={1} max={240} suffix="min" width={3} />
        <button onClick={() => dispatch((st, cx) => E.frigidWater(st, cx, c.id, mins))}>In frigid water for {mins} min</button>
      </div>
    </Card>
  );
}

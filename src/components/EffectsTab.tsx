import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { EFFECT_KIND_LABEL, EFFECT_PRESETS, EXPLORATION_TURN_MINUTES, holdBreathSeconds, type EffectKind } from '../rules/effects';
import { abilityMod } from '../rules/upkeep';
import { HAZARDS, type HazardId } from '../rules/hazards';
import { DANGER } from '../rules/encounters';
import { formatClock, formatDuration } from '../rules/calendar';
import { Card, Meter, Num, Pill, Select, Text, Toggle, Rule } from './common';
import { POISONS, poisonByName } from '../rules/poisons';
import { CONTAGIONS, RECUPERATE_DAYS, RECUPERATE_DC, type ContagionKind } from '../rules/contagion';
import { WaysAround } from './WaysAround';
import { InjuryCard, MadnessCard } from './LifeCards';
import { useGate } from './gate';
import { FUEL_LABEL, fuelFor, isHooded, isOilLight } from '../rules/gear';

export function EffectsTab() {
  const s = useGame();
  const live = s.characters.filter((c) => E.alive(c));
  const gate = useGate([
    { name: 'Lingering injuries', idle: !s.settings.lingeringInjuries && !live.some((c) => (c.injuries ?? []).length) },
    { name: 'Madness', idle: !s.settings.madness && !live.some((c) => (c.madness ?? []).length) },
  ]);
  return (
    <div className="grid">
      <ActiveCard />
      <AddEffectCard />
      <ExploreCard />
      <BreathCard />
      <HazardCard />
      <ContagionCard />
      {gate.show('Lingering injuries') && <InjuryCard />}
      {gate.show('Madness') && <MadnessCard />}
      <PotionMixCard />
      <PoisonCard />
      {gate.note}
    </div>
  );
}

function ActiveCard() {
  const s = useGame();
  const now = E.absNow(s);
  const sorted = [...s.effects].sort((a, b) => (a.endsAt ?? Infinity) - (b.endsAt ?? Infinity));
  const concentrating = s.characters.filter((c) => s.effects.some((e) => e.concentration && E.concentrators(e).includes(c.id)));
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
                  {e.concentration && <Pill tone="info">Concentration{e.concentrationIds?.length ? `: ${e.concentrationIds.map((id) => E.charById(s, id)?.name ?? '?').join(', ')}` : caster ? `: ${caster}` : ''}</Pill>}
                  {e.concentration &&
                    (e.concentrationIds?.length ?? 0) > 1 &&
                    e.concentrationIds!.map((id) => (
                      <button key={id} className="ghost tiny" title="Damage, a failed save or being Incapacitated: the others keep the spell going" onClick={() => dispatch((st, cx) => E.loseConcentration(st, cx, e.id, id))}>
                        {E.charById(s, id)?.name ?? '?'} loses it
                      </button>
                    ))}
                  {e.shelter && <Pill tone="good">Shelter</Pill>}
                  {who && <span className="muted small"> on {who}</span>}
                </span>
                <span className="btn-row tight">
                  {e.kind === 'light' && isOilLight(e.name) ? (
                    <>
                      <button className="ghost small" onClick={() => dispatch((st, cx) => E.refuelLight(st, cx, e.id))}>
                        + oil flask (6 h)
                      </button>
                      {e.pausedLeft != null ? (
                        <button className="small" onClick={() => dispatch((st, cx) => E.relightLight(st, cx, e.id))}>
                          Relight
                        </button>
                      ) : (
                        <button className="ghost small" title="Keeps the Oil left in it for later" onClick={() => dispatch((st, cx) => E.snuffLight(st, cx, e.id))}>
                          Put out
                        </button>
                      )}
                      {isHooded(e.name) && e.pausedLeft == null && (
                        <button className="ghost small" onClick={() => dispatch((st, cx) => E.setHood(st, cx, e.id, !e.dimmed))}>
                          {e.dimmed ? 'Raise hood' : 'Lower hood'}
                        </button>
                      )}
                    </>
                  ) : (
                    e.endsAt != null && (
                      <button className="ghost small" onClick={() => dispatch((st, cx) => E.extendEffect(st, cx, e.id, 60))}>
                        +1 h
                      </button>
                    )
                  )}
                  {e.name.toLowerCase() === 'death ward' && e.targetIds.length === 1 && (
                    <button className="ghost small" onClick={() => dispatch((st, cx) => E.negateInstantDeath(st, cx, e.targetIds[0]))}>
                      Negate instant death
                    </button>
                  )}
                  <button className="ghost small bad" onClick={() => dispatch((st, cx) => E.endEffect(st, cx, e.id))}>
                    End
                  </button>
                </span>
              </div>
              <div className="small">
                {e.pausedLeft != null ? (
                  <span className="muted">Put out · {formatDuration(e.pausedLeft)} of Oil left in it</span>
                ) : left == null ? (
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
                {e.dimmed ? <span className="muted"> · Hood lowered: Dim Light in a 5-foot radius.</span> : e.notes && <span className="muted"> · {e.notes}</span>}
              </div>
            </li>
          );
        })}
      </ul>
      {concentrating.length > 0 && <p className="small muted">Concentrating: {concentrating.map((c) => c.name).join(', ')}. Starting another Concentration spell ends the first one.</p>}
      <WaysAround topic={['light', 'concentration']} />
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
  const [useGear, setUseGear] = useState(true);
  const fuel = kind === 'light' ? fuelFor(preset.name) : null;
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
      {fuel && s.settings.trackGearUse && (
        <Toggle
          checked={useGear}
          onChange={setUseGear}
          label={`Take ${FUEL_LABEL[fuel]} from the inventory (the people above first). Lit with a Tinderbox, from the campfire or a spell${s.settings.improvised ? ', or 10 minutes of friction without' : ''}.`}
        />
      )}
      {preset.note && kind !== 'other' && (
        <Rule>
          {preset.note}
          {fuel === 'oil' ? ' A flask of Oil burns 6 hours, and can be put out and relit until it has burned 6 hours in all (2024 PHB).' : ''}
        </Rule>
      )}
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
                useGear,
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
  const lights = s.effects.filter((e) => e.kind === 'light' && e.pausedLeft == null);
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
      {s.settings.encounters ? (
        <p className="small muted">
          Wandering monster checks follow this location&apos;s danger: every {DANGER[s.place.danger].everyTurns} turn{DANGER[s.place.danger].everyTurns > 1 ? 's' : ''} on {DANGER[s.place.danger].on}+ ({DANGER[s.place.danger].label}, Encounters tab).
        </p>
      ) : (
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
      )}
      <p className={`small ${lights.length ? '' : 'warn-text'}`}>
        {lights.length ? `Light: ${lights.map((l) => l.name).join(', ')}.` : 'No light source is burning. Without Darkvision the party is in Darkness underground.'}
      </p>
      <WaysAround topic={'exploration'} />
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
      <WaysAround topic={'breath'} />
    </Card>
  );
}

function HazardCard() {
  const s = useGame();
  const [id, setId] = useState<HazardId>('slipperyIce');
  const [who, setWho] = useState(s.characters[0]?.id ?? '');
  const [bonus, setBonus] = useState(0);
  const [hours, setHours] = useState(1);
  const [weight, setWeight] = useState(300);
  const hz = HAZARDS[id];
  return (
    <Card title="Hazards">
      <div className="form-row">
        <Select label="Hazard" value={id} onChange={setId} options={(Object.keys(HAZARDS) as HazardId[]).map((k) => ({ value: k, label: HAZARDS[k].name }))} />
        <Select label="Who" value={who} onChange={setWho} options={s.characters.map((c) => ({ value: c.id, label: c.name }))} />
      </div>
      <p className="small">{hz.summary}</p>
      {hz.save && (
        <div className="btn-row tight">
          <Num label={`${hz.save.ability} save bonus`} value={bonus} onChange={(v) => setBonus(Math.round(v))} width={2} />
          <button className="small" onClick={() => dispatch((st, cx) => E.hazardSave(st, cx, who, id, bonus))}>
            Roll the save (DC {hz.save.dc}){hz.save.damage ? `, ${hz.save.damage} ${hz.save.damageType}` : ''}
          </button>
        </div>
      )}
      {id === 'deepWater' && (
        <div className="btn-row tight">
          <Num value={hours} onChange={(v) => setHours(Math.max(1, Math.round(v)))} min={1} suffix="hours" width={2} />
          <button className="small" onClick={() => dispatch((st, cx) => E.deepWater(st, cx, who, hours))}>
            Swim through deep water
          </button>
        </div>
      )}
      {id === 'thinIce' && (
        <div className="btn-row tight">
          <Num value={weight} onChange={(v) => setWeight(Math.max(0, Math.round(v)))} min={0} suffix="lb on a square" width={4} />
          <button className="small" onClick={() => dispatch((st, cx) => E.thinIce(st, cx, weight))}>
            Test the ice
          </button>
        </div>
      )}
      <WaysAround topic={'hazards'} />
    </Card>
  );
}

function ContagionCard() {
  const s = useGame();
  const now = E.absNow(s);
  const people = s.characters.filter((c) => E.alive(c));
  const [who, setWho] = useState('');
  const [kind, setKind] = useState<ContagionKind>('sewer');
  const [resist, setResist] = useState(true);
  const [maker, setMaker] = useState('');
  const [herbBonus, setHerbBonus] = useState(0);
  const whoId = people.find((c) => c.id === who)?.id ?? people[0]?.id ?? '';
  const makerId = people.find((c) => c.id === maker)?.id ?? people[0]?.id ?? '';
  const sick = people.filter((c) => (c.contagions ?? []).length > 0);
  const info = CONTAGIONS[kind];
  return (
    <Card title="Diseases (magical contagions)">
      {sick.length === 0 && <p className="muted small">Nobody is infected.</p>}
      <ul className="plain">
        {sick.flatMap((c) =>
          c.contagions.map((x) => {
            const ci = CONTAGIONS[x.kind];
            return (
              <li key={x.id} className="facility">
                <div className="armor-row">
                  <span>
                    <b>{c.name}</b>: {ci.name}{' '}
                    {!x.onset ? (
                      <Pill tone="muted" title="Only the DM knows">Incubating · symptoms in {formatDuration(Math.max(0, x.onsetAt - now))}</Pill>
                    ) : (
                      <Pill tone="bad">Symptomatic</Pill>
                    )}
                    {x.kind === 'cackle' && <Pill tone="info">{x.successes}/3 Long Rest saves</Pill>}
                    {x.kind === 'sightRot' && <Pill tone="info">{x.suppressedHours ?? 0}/72 h treated{x.suppressedUntil && x.suppressedUntil > now ? `, ointment ${formatDuration(x.suppressedUntil - now)} left` : ''}</Pill>}
                    {c.recuperatedUntil && c.recuperatedUntil > now && <Pill tone="good">Advantage on saves ({formatDuration(c.recuperatedUntil - now)})</Pill>}
                  </span>
                </div>
                <p className="small muted">{ci.fighting}</p>
                <div className="btn-row tight">
                  {x.kind === 'sightRot' && (
                    <>
                      <Select label="Ointment by" value={makerId} onChange={setMaker} options={people.map((p) => ({ value: p.id, label: p.name }))} />
                      {(() => {
                        const kit = !!people.find((p) => p.id === makerId)?.inventory.some((i) => /herbalism kit/i.test(i.name));
                        if (kit)
                          return (
                            <button className="small" onClick={() => dispatch((st, cx) => E.applySightRotOintment(st, cx, c.id, makerId))}>
                              Make and apply ointment (1 h)
                            </button>
                          );
                        if (!s.settings.improvised) return <span className="small muted">Needs an Herbalism Kit.</span>;
                        return (
                          <>
                            <Num label="Int (Nature or Medicine)" value={herbBonus} onChange={(v) => setHerbBonus(Math.round(v))} width={2} />
                            <button className="small" title="Table rule: no Herbalism Kit, so foraged herbs, twice the time and a DC 15 check" onClick={() => dispatch((st, cx) => E.applySightRotOintment(st, cx, c.id, makerId, false, herbBonus))}>
                              Improvise ointment without a kit (2 h, DC 15)
                            </button>
                            <button className="small ghost" title="They have a kit that isn't listed in their inventory" onClick={() => dispatch((st, cx) => E.applySightRotOintment(st, cx, c.id, makerId))}>
                              Has a kit (1 h)
                            </button>
                          </>
                        );
                      })()}
                    </>
                  )}
                  <button className="small" title={`DC ${RECUPERATE_DC} Con save: Advantage against contagions for 24 hours; table rule: also lifts 1 Exhaustion level and eases Stress by 2`} onClick={() => dispatch((st, cx) => E.recuperate(st, cx, c.id))}>
                    Recuperate {RECUPERATE_DAYS} days
                  </button>
                  <button className="small ghost" onClick={() => dispatch((st, cx) => E.cureContagion(st, cx, c.id, x.id, x.kind === 'sightRot' ? 'Heal or Lesser Restoration' : 'magic or the DM'))}>
                    Cured by magic
                  </button>
                </div>
              </li>
            );
          }),
        )}
      </ul>
      <h3>Exposure</h3>
      <div className="form-row">
        <Select label="Who" value={whoId} onChange={setWho} options={people.map((c) => ({ value: c.id, label: c.name }))} />
        <Select label="Contagion" value={kind} onChange={setKind} options={(Object.keys(CONTAGIONS) as ContagionKind[]).map((k) => ({ value: k, label: CONTAGIONS[k].name }))} />
      </div>
      <Toggle checked={resist} onChange={setResist} label={`Roll a DC ${info.catchDC} Constitution save to resist (off: infected outright, e.g. a tainted potion)`} />
      <button className="small" disabled={!whoId} onClick={() => dispatch((st, cx) => E.exposeContagion(st, cx, whoId, kind, resist))}>
        Expose
      </button>
      <p className="small muted">
        <b>Caught from:</b> {info.source}
      </p>
      <p className="small muted">
        <b>Effects:</b> {info.effects}
      </p>
      {s.settings.wildNeedsPurifying && (s.settings.sewerPlagueAfter ?? 3) > 0 && s.characters.some((c) => (c.waterborneIllnesses ?? 0) > 0) && (
        <p className="small warn-text">
          Water-borne illnesses toward Sewer Plague:{' '}
          {s.characters
            .filter((c) => (c.waterborneIllnesses ?? 0) > 0)
            .map((c) => `${c.name} ${c.waterborneIllnesses}/${s.settings.sewerPlagueAfter ?? 3}`)
            .join(', ')}
          .
        </p>
      )}
      <Rule>
        2024 DMG. Table rule: Sewer Plague comes from repeated water-borne illness, not from a single bad drink. Unpurified water counts, and so does city water: living Squalid (DC 12) or Wretched (DC 14) in a settlement means a save every day, and each new bout from city water carries Sight Rot on a 1 in 6. Saves happen on their own: Sewer Plague at dawn, Cackle Fever after each Long Rest. Recuperating means {RECUPERATE_DAYS} days of nothing that would interrupt a Long Rest, then a DC {RECUPERATE_DC} Con save; success gives Advantage on saves against the contagion for 24 hours.
      </Rule>
      <WaysAround topic={'disease'} />
    </Card>
  );
}

function PotionMixCard() {
  const s = useGame();
  const [what, setWhat] = useState('');
  const [who, setWho] = useState('');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const people = s.characters.filter((c) => E.alive(c) && c.inventory.some((i) => /potion|elixir|philter/i.test(i.name)));
  const c = people.find((x) => x.id === who) ?? people[0];
  const potions = (c?.inventory ?? []).filter((i) => /potion|elixir|philter/i.test(i.name));
  const aId = potions.find((p) => p.id === a)?.id ?? potions[0]?.id ?? '';
  const bId = potions.find((p) => p.id === b && (p.id !== aId || p.qty > 1))?.id ?? potions.find((p) => p.id !== aId)?.id ?? (potions[0]?.qty > 1 ? potions[0].id : '');
  return (
    <Card title="Mixing potions">
      {c && potions.length > 0 && (
        <>
          <div className="form-row">
            <Select label="Who" value={c.id} onChange={setWho} options={people.map((x) => ({ value: x.id, label: x.name }))} />
            <Select label="First potion" value={aId} onChange={setA} options={potions.map((p) => ({ value: p.id, label: `${p.name} ×${p.qty}` }))} />
            <Select label="Second potion" value={bId} onChange={setB} options={potions.map((p) => ({ value: p.id, label: `${p.name} ×${p.qty}` }))} />
          </div>
          <button className="small" disabled={!aId || !bId} onClick={() => dispatch((st, cx) => E.mixInventoryPotions(st, cx, c.id, aId, bId))}>
            Mix and drink (uses both)
          </button>
          <p className="small muted">The result is applied: healing rolled, durations halved or doubled on the effect timers, a poison, or an explosion.</p>
        </>
      )}
      <Text label="Which potions" value={what} onChange={setWhat} placeholder="e.g. Healing and Invisibility" />
      <button className="small" onClick={() => dispatch((st, cx) => E.mixPotions(st, cx, what))}>
        Roll on the Potion Miscibility table
      </button>
      <Rule>
        2024 DMG: roll d100 whenever two potions are combined, whether poured together or drunk while another is still working. Roll again for each further potion. Unless the result is obvious, reveal it only when it shows. Drinking or giving a potion takes a Bonus Action, and a small taste reveals what a potion does.
      </Rule>
    </Card>
  );
}

function PoisonCard() {
  const s = useGame();
  const people = s.characters.filter((c) => E.alive(c));
  const [who, setWho] = useState('');
  const [poison, setPoison] = useState(POISONS[1].name);
  const [from, setFrom] = useState('');
  const whoId = people.find((c) => c.id === who)?.id ?? people[0]?.id ?? '';
  const p = POISONS.find((x) => x.name === poison)!;
  const holders = s.characters.filter((c) => c.inventory.some((i) => poisonByName(i.name)?.name === poison && i.qty > 0));
  const poisoned = people.filter((c) => c.sick || (c.poisonTimers ?? []).length > 0 || s.effects.some((e) => e.name.startsWith('Poisoned') && e.targetIds.includes(c.id)));
  return (
    <Card title="Poisons">
      <div className="form-row">
        <Select label="Who is exposed" value={whoId} onChange={setWho} options={people.map((c) => ({ value: c.id, label: c.name }))} />
        <Select label="Poison" value={poison} onChange={setPoison} options={POISONS.map((x) => ({ value: x.name, label: `${x.name} (${x.type}, ${x.gp} GP)` }))} />
        <Select label="Dose from" value={holders.some((h) => h.id === from) ? from : ''} onChange={setFrom} options={[{ value: '', label: 'Not tracked' }, ...holders.map((h) => ({ value: h.id, label: `${h.name}'s inventory` }))]} />
      </div>
      <div className="btn-row tight">
        <button className="small" disabled={!whoId} onClick={() => dispatch((st, cx) => E.exposePoison(st, cx, whoId, poison, holders.some((h) => h.id === from) ? from : null))}>
          Expose
        </button>
        <button className="small" disabled={!whoId} title="PHB: a Bonus Action for Advantage on saves to avoid or end the Poisoned condition for 1 hour. It cures nothing already in effect." onClick={() => dispatch((st, cx) => E.drinkAntitoxin(st, cx, whoId))}>
          Drink Antitoxin
        </button>
        {people.filter((c) => E.antitoxinActive(s, c)).map((c) => (
          <Pill key={c.id} tone="good">
            {c.name}: Antitoxin, {formatDuration(Math.max(1, (c.antitoxinUntil ?? 0) - E.absNow(s)))} left
          </Pill>
        ))}
      </div>
      <p className="small muted">{p.effect}</p>
      {poisoned.length > 0 && (
        <ul className="plain small">
          {poisoned.map((c) => (
            <li key={c.id}>
              <b>{c.name}</b>: {[...(c.sick ? [`Sick from ${c.sickFrom || 'raw food or water'} (until a Long Rest)`] : []), ...s.effects.filter((e) => e.name.startsWith('Poisoned') && e.targetIds.includes(c.id)).map((e) => `${e.name}${e.endsAt ? ` (${formatDuration(Math.max(0, e.endsAt - E.absNow(s)))})` : ''}`), ...(c.poisonTimers ?? []).map((t) => (t.name === 'Midnight Tears' ? 'Midnight Tears (strikes at midnight, hidden)' : `Pale Tincture ${t.successes}/7 saves`))].join(', ')}{' '}
              <button className="ghost tiny" title="Lesser Restoration, Protection from Poison, Lay on Hands (5 points), Heal and the like. Antitoxin doesn't end it." onClick={() => dispatch((st, cx) => E.curePoison(st, cx, c.id))}>
                Cured by magic
              </button>
            </li>
          ))}
        </ul>
      )}
      <Rule>2024 DMG poisons. Contact poisons work on touch, ingested ones in food or drink, inhaled ones as powder or gas, injury ones on a weapon or ammunition. Saves and lasting effects run on their own; Midnight Tears waits for midnight and Pale Tincture rechecks every 24 hours.</Rule>
      <WaysAround topic={'poison'} />
    </Card>
  );
}

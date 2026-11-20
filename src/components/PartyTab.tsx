import { useState } from 'react';
import { useGame, edit, dispatch } from '../state/store';
import { newCharacter, defaultTasks } from '../state/defaults';
import { CLASSES, isCaster } from '../rules/spells';
import { SIZES, exhaustionSummary, foodNeedLb, WATER_GAL_PER_DAY, proficiencyBonus, ARMOR_TIMES, ARMOR_LABEL, causesOf, EXHAUSTION_CAUSE_LABEL } from '../rules/survival';
import { Card, Num, Select, Text, Toggle, Rule } from './common';
import { Debuffs } from './Debuffs';
import type { ArmorKind, Character, ClassName, ExhaustionCause, Resist, Size } from '../state/types';
import * as E2 from '../state/engine';
import { absNow, log, type Track } from '../state/engine';

const RESIST = [
  { value: 'none', label: 'None' },
  { value: 'resistance', label: 'Resistance' },
  { value: 'immunity', label: 'Immunity' },
] as const;

export function PartyTab() {
  const s = useGame();
  return (
    <div className="stack">
      <div className="btn-row">
        <button className="primary" onClick={() => edit((d) => void d.characters.push(newCharacter()))}>
          + Add character
        </button>
        <span className="muted small">Enter save bonuses as they appear on the sheet. The tracker takes off Exhaustion penalties for you.</span>
      </div>
      <div className="grid">
        {s.characters.map((c) => (
          <CharacterCard key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}

function StatusHistory({ c }: { c: Character }) {
  const s = useGame();
  const [all, setAll] = useState(false);
  const mine = s.statusLog.filter((e) => e.charId === c.id);
  if (!mine.length) return null;
  return (
    <details className="status-history">
      <summary>
        Status history ({mine.length}) · latest: {mine[0].text.slice(0, 60)}
        {mine[0].text.length > 60 ? '…' : ''}
      </summary>
      <ul className="log">
        {(all ? mine : mine.slice(0, 8)).map((e) => (
          <li key={e.id} className={`log-${e.tone}`}>
            <span className="muted small">{e.stamp}</span> {e.text}
            <span className="sense">“{e.sense}”</span>
          </li>
        ))}
      </ul>
      {mine.length > 8 && (
        <button className="ghost small" onClick={() => setAll(!all)}>
          {all ? 'Show fewer' : `Show all ${mine.length}`}
        </button>
      )}
    </details>
  );
}

function Trackers({ c }: { c: Character }) {
  const [reason, setReason] = useState('');
  const row = (track: Track, label: string, hint: string) => (
    <span className="field">
      <span className="field-label" title={hint}>
        {label}
      </span>
      <span className="inline-group">
        <button aria-label={`Lower ${label}`} onClick={() => dispatch((st, cx) => E2.adjustTrack(st, cx, c.id, track, -1, reason.trim()))}>
          −
        </button>
        <b className="exh">{c[track]}</b>
        <button aria-label={`Raise ${label}`} onClick={() => dispatch((st, cx) => E2.adjustTrack(st, cx, c.id, track, 1, reason.trim()))}>
          +
        </button>
      </span>
    </span>
  );
  return (
    <>
      <h3>Renown, fear and stress</h3>
      <div className="form-row">
        {row('renown', 'Renown', 'Personal reputation. Faction renown lives on the World tab.')}
        {row('fear', 'Fear', 'Lasting dread from horrors faced')}
        {row('stress', 'Stress', 'Strain that builds up between rests')}
        <Text label="Why (optional)" value={reason} onChange={setReason} placeholder="e.g. saw the lich" />
      </div>
    </>
  );
}

function ExhaustionEditor({ c, set }: { c: Character; set: (patch: Partial<Character>) => void }) {
  const s = useGame();
  const [cause, setCause] = useState<ExhaustionCause>('other');
  const causes = causesOf(c);
  return (
    <div className="exh-editor">
      <div className="form-row">
        <span className="field">
          <span className="field-label">Exhaustion</span>
          <span className="inline-group">
            <button aria-label="Remove the newest Exhaustion level" onClick={() => set({ exhaustion: Math.max(0, c.exhaustion - 1), exhaustionCauses: causes.slice(0, -1) })}>
              −
            </button>
            <b className="exh">{c.exhaustion}</b>
            <button aria-label="Add an Exhaustion level" disabled={c.exhaustion >= 6} onClick={() => set({ exhaustion: c.exhaustion + 1, exhaustionCauses: [...causes, cause] })}>
              +
            </button>
          </span>
        </span>
        <Select
          label="Cause for +"
          value={cause}
          onChange={setCause}
          options={(Object.keys(EXHAUSTION_CAUSE_LABEL) as ExhaustionCause[]).map((k) => ({ value: k, label: EXHAUSTION_CAUSE_LABEL[k] }))}
        />
      </div>
      <div className="debuff-line">
        <Debuffs c={c} now={absNow(s)} />
      </div>
      <Rule>
        Exhaustion {c.exhaustion}: {exhaustionSummary(c.exhaustion)}. A Long Rest removes the newest level, except levels from Malnutrition or Dehydration (🔒), which stay until a full day&apos;s food or water.
      </Rule>
    </div>
  );
}

function CharacterCard({ c }: { c: Character }) {
  const set = (patch: Partial<Character>) =>
    edit((d) => {
      const t = d.characters.find((x) => x.id === c.id);
      if (t) Object.assign(t, patch);
    });
  const changeClass = (cls: ClassName) => {
    const hadPrep = c.tasks.some((t) => /prepare spells/i.test(t.label));
    const patch: Partial<Character> = { className: cls };
    if (isCaster(cls) && !hadPrep) patch.tasks = [{ id: Math.random().toString(36).slice(2), label: 'Prepare spells', done: false, daily: true }, ...c.tasks];
    set(patch);
  };
  return (
    <Card
      title={
        <span>
          {c.name}
        </span>
      }
      actions={
        <button
          className="ghost bad"
          onClick={() => {
            if (confirm(`Remove ${c.name}?`)) edit((d) => void (d.characters = d.characters.filter((x) => x.id !== c.id)));
          }}
        >
          Remove
        </button>
      }
    >
      <div className="form-row">
        <Text label="Name" value={c.name} onChange={(v) => set({ name: v })} wide />
        <Select label="Class" value={c.className} onChange={changeClass} options={CLASSES} />
        <Num label="Level" value={c.level} onChange={(v) => set({ level: Math.round(v) })} min={1} max={20} width={2} />
        <Select label="Size" value={c.size} onChange={(v: Size) => set({ size: v })} options={SIZES} />
      </div>
      <div className="form-row">
        <Num label="Con save" value={c.conSave} onChange={(v) => set({ conSave: v })} width={3} />
        <Num label="Wis mod" value={c.wisMod} onChange={(v) => set({ wisMod: v })} width={3} />
        <Num label="Survival" value={c.survival} onChange={(v) => set({ survival: v })} width={3} />
      </div>
      <ExhaustionEditor c={c} set={set} />

      <Trackers c={c} />

      <h3>Weathering the elements</h3>
      <div className="form-row">
        <Select label="Cold damage" value={c.coldResist} onChange={(v: Resist) => set({ coldResist: v })} options={RESIST} />
        <Select label="Fire damage" value={c.fireResist} onChange={(v: Resist) => set({ fireResist: v })} options={RESIST} />
      </div>
      <div className="chips">
        <Toggle checked={c.coldWeatherGear} onChange={(v) => set({ coldWeatherGear: v })} label="Cold weather gear" />
        <Toggle checked={c.bedroll} onChange={(v) => set({ bedroll: v })} label="Bedroll" title="Automatic success on extreme cold saves while sleeping in it" />
        <Toggle checked={c.blanket} onChange={(v) => set({ blanket: v })} label="Blanket" title="Advantage on extreme cold saves while wrapped in it" />
        <Toggle checked={c.heavyGarb} onChange={(v) => set({ heavyGarb: v })} label="Heavy clothing" title="Disadvantage on extreme heat saves" />
      </div>

      <Rule>A Bedroll means an automatic success on extreme cold saves while sleeping in it. A Blanket gives Advantage. Either one counts as warm cover on a cold night.</Rule>

      <h3>Armor</h3>
      <div className="form-row">
        <Select
          label="Type"
          value={c.armorKind}
          onChange={(v: ArmorKind) => set({ armorKind: v, armorWorn: v === 'none' ? false : c.armorWorn })}
          options={(Object.keys(ARMOR_LABEL) as ArmorKind[]).map((k) => ({ value: k, label: ARMOR_LABEL[k] }))}
        />
        {c.armorKind !== 'none' && <Text label="Name" value={c.armorName} onChange={(v) => set({ armorName: v })} placeholder="e.g. Chain Mail" />}
      </div>
      <div className="chips">
        {c.armorKind !== 'none' && <Toggle checked={c.armorWorn} onChange={(v) => set({ armorWorn: v })} label="Wearing it now" />}
        <Toggle checked={c.hasShield} onChange={(v) => set({ hasShield: v, shieldWorn: v && c.shieldWorn })} label="Has a shield" />
        {c.hasShield && <Toggle checked={c.shieldWorn} onChange={(v) => set({ shieldWorn: v })} label="Shield on arm" />}
      </div>
      {c.armorKind !== 'none' && (
        <Rule>
          Takes {ARMOR_TIMES[c.armorKind].don} min to put on and {ARMOR_TIMES[c.armorKind].doff} min to take off. A shield takes the Utilize action.
          {c.armorKind !== 'light' && ' Medium or Heavy armor gives Disadvantage on extreme heat saves.'} These ticks don&apos;t move the clock. Use the Camp tab for that.
        </Rule>
      )}

      <h3>Food and water</h3>
      <div className="form-row">
        <Num label="Rations" value={c.rationsLb} onChange={(v) => set({ rationsLb: v })} min={0} step={0.5} suffix="lb" width={4} />
        <Num label="Water" value={c.waterPints} onChange={(v) => set({ waterPints: v })} min={0} step={1} suffix="pt" width={3} />
        <Num label="Can carry" value={c.waterCapacityPints} onChange={(v) => set({ waterCapacityPints: v })} min={0} step={4} suffix="pt" width={3} />
      </div>
      <Rule>
        Needs {foodNeedLb(c)} lb of food and {WATER_GAL_PER_DAY[c.size]} gal ({WATER_GAL_PER_DAY[c.size] * 8} pt) of water a day. A Waterskin holds 4 pints, and a Ration is 1 lb.
      </Rule>
      <div className="chips">
        <Toggle checked={c.needsFood} onChange={(v) => set({ needsFood: v })} label="Needs food" />
        <Toggle checked={c.needsWater} onChange={(v) => set({ needsWater: v })} label="Needs water" />
        <Toggle checked={c.malnourished} onChange={(v) => set({ malnourished: v })} label="Malnourished" title="Exhaustion can't be removed until they eat a full day's food" />
        <Toggle checked={c.dehydrated} onChange={(v) => set({ dehydrated: v })} label="Dehydrated" title="Exhaustion can't be removed until they drink a full day's water" />
      </div>
      <div className="form-row">
        <Num label="Days without food" value={c.daysWithoutFood} onChange={(v) => set({ daysWithoutFood: Math.round(v) })} min={0} width={3} />
      </div>

      <h3>Camp skills</h3>
      <div className="chips">
        <Toggle checked={c.cooksUtensils} onChange={(v) => set({ cooksUtensils: v })} label="Proficient with Cook's Utensils" />
        <Toggle checked={c.chef} onChange={(v) => set({ chef: v })} label="Chef feat" />
      </div>
      {c.chef && (
        <div className="form-row">
          <Num label="Treats on hand" value={c.treats} onChange={(v) => set({ treats: Math.round(v) })} min={0} width={2} />
          <Rule>
            Chef: makes {proficiencyBonus(c.level)} treats after each Long Rest. A Short Rest meal gives up to {4 + proficiencyBonus(c.level)} creatures an extra 1d8 HP.
          </Rule>
        </div>
      )}
      <StatusHistory c={c} />
      <label className="field grow">
        <span className="field-label">Notes</span>
        <textarea value={c.notes} rows={2} onChange={(e) => set({ notes: e.target.value })} />
      </label>
      <div className="btn-row">
        <button
          className="ghost small"
          onClick={() =>
            edit((d) => {
              const t = d.characters.find((x) => x.id === c.id);
              if (t) {
                t.tasks = defaultTasks(isCaster(t.className));
                log(d, `${t.name}'s morning checklist reset to the defaults.`);
              }
            })
          }
        >
          Reset checklist to defaults
        </button>
      </div>
    </Card>
  );
}

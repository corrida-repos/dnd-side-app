import { useEffect, useState } from 'react';
import { bindableSummon, CREATURE_SPELLS, undeadLimits, type CreatureCast, type CreatureSpell, type SpellCreature, type SpiritType } from '../rules/spellCreatures';
import { formatDuration } from '../rules/calendar';
import { dispatch, useGame } from '../state/store';
import * as E from '../state/engine';
import { Card, Num, Pill, Select, Text, Toggle } from './common';

export function SpellCreatureCastFields({ spell, casterId, slotLevel, input, onChange }: {
  spell: CreatureSpell;
  casterId: string;
  slotLevel: number;
  input: CreatureCast;
  onChange: (input: CreatureCast) => void;
}) {
  const s = useGame();
  const undead = spell === 'animate dead' || spell === 'create undead';
  const [renew, setRenew] = useState(false);
  const limits = undeadLimits(spell, slotLevel, renew);
  const now = E.absNow(s);
  const candidates = (s.spellCreatures ?? []).filter((c) => c.spell === spell && c.casterId === casterId
    && c.status === 'present' && (c.until ?? now) > now);
  const defaultForm = spell === 'animate dead' ? 'Skeleton' : 'Ghoul';
  const form = input.form ?? defaultForm;
  const spiritOptions: SpiritType[] = ['Celestial', 'Fey', 'Fiend'];
  if (undead && renew) return (
    <fieldset>
      <legend>Renew control</legend>
      <Toggle label="Renew existing undead" checked onChange={() => { setRenew(false); onChange({}); }} />
      {candidates.map((c) => (
        <Toggle key={c.id} label={`${c.name} (${c.form}) · ${formatDuration(c.until! - now)} left`}
          checked={input.renewIds?.includes(c.id) ?? false} onChange={(checked) => {
            const ids = input.renewIds ?? [];
            onChange({ renewIds: checked ? [...ids, c.id] : ids.filter((id) => id !== c.id) });
          }} />
      ))}
      {!candidates.length && <p className="small">No undead under this caster’s control.</p>}
    </fieldset>
  );

  return (
    <fieldset>
      <legend>{undead ? 'Create undead' : 'Creature'}</legend>
      {undead && (
        <>
          {candidates.length > 0 && <Toggle label="Renew existing undead" checked={false} onChange={() => { setRenew(true); onChange({ renewIds: [] }); }} />}
          <Select label="Undead form" value={form} onChange={(value) => onChange({ ...input, form: value, count: 1 })}
            options={Object.keys(limits).map((value) => ({ value, label: value }))} />
          <Num label="Creatures" value={input.count ?? 1} onChange={(count) => onChange({ ...input, count })}
            min={1} max={limits[form] ?? 1} />
          {spell === 'create undead' && <p className="small">Cast at night. Each corpse needs a reusable black onyx stone worth 150+ GP.</p>}
        </>
      )}
      <Text label={spell === 'planar binding' || spell === 'awaken' ? 'Creature name' : 'Name (optional)'}
        value={input.name ?? ''} onChange={(name) => onChange({ ...input, name })} />
      {(spell === 'find familiar' || spell === 'find steed' || spell === 'awaken') && (
        <Text label={spell === 'find familiar' ? 'CR 0 Beast form' : 'Form'} value={input.form ?? ''}
          placeholder={spell === 'find familiar' ? 'Owl' : spell === 'find steed' ? 'Horse' : 'Beast or plant'}
          onChange={(value) => onChange({ ...input, form: value })} />
      )}
      {(spell === 'find familiar' || spell === 'find steed') && (
        <Select label="Spirit type" value={input.spirit ?? 'Celestial'} onChange={(spirit) => onChange({ ...input, spirit })}
          options={spiritOptions.map((value) => ({ value, label: value }))} />
      )}
      {spell === 'planar binding' && (
        <>
          <Select label="Linked summoning effect" value={input.summonId ?? ''} onChange={(value) => onChange({ ...input, summonId: value || undefined })}
            options={[{ value: '', label: 'Creature tracked by the DM' }, ...s.effects
              .filter((e) => bindableSummon(e.name) && e.pausedLeft == null && (e.endsAt == null || e.endsAt > now))
              .map((e) => ({ value: e.id, label: `${e.name} · ${s.characters.find((c) => c.id === e.casterId)?.name ?? 'Other caster'}` }))]} />
          <Select label="Target’s Charisma save" value={input.saveFailed == null ? '' : input.saveFailed ? 'failed' : 'passed'}
            onChange={(value) => onChange({ ...input, saveFailed: value === '' ? undefined : value === 'failed' })}
            options={[{ value: '', label: 'Choose result' }, { value: 'failed', label: 'Failed' }, { value: 'passed', label: 'Succeeded' }]} />
        </>
      )}
    </fieldset>
  );
}

const STATUS = { present: 'Present', dismissed: 'Pocket dimension', gone: 'Gone', uncontrolled: 'Control lapsed', independent: 'Independent' };

function SpellCreatureRow({ creature, caster, now }: { creature: SpellCreature; caster?: string; now: number }) {
  const [order, setOrder] = useState(creature.order);
  useEffect(() => setOrder(creature.order), [creature.order]);
  const { id, form, name, spell, status, spirit, until } = creature;
  const actOn = (action: Parameters<typeof E.setSpellCreatureStatus>[3]) =>
    dispatch((s, ctx) => E.setSpellCreatureStatus(s, ctx, id, action));
  return (
    <li className="facility">
      <div className="armor-row">
        <b>{name}</b>
        <Pill tone={status === 'present' ? 'good' : 'muted'}>{STATUS[status]}</Pill>
      </div>
      <p className="small">{CREATURE_SPELLS[spell]}{caster && ` · ${caster}`} · {form}{spirit && ` · ${spirit}`}
        {status === 'present' && until != null && ` · ${spell === 'awaken' ? 'Charmed for' : 'Control ends in'} ${formatDuration(Math.max(0, until - now))}`}</p>
      {spell === 'find steed' && status === 'present' && (
        <p className="small">AC {10 + creature.slotLevel} · Max HP {5 + 10 * creature.slotLevel} · Speed 60 ft.{creature.slotLevel >= 4 && ' · Fly 60 ft.'}</p>
      )}
      {status === 'present' && spell !== 'awaken' && (
        <form className="btn-row tight" onSubmit={(e) => { e.preventDefault(); dispatch((s, ctx) => E.setSpellCreatureOrder(s, ctx, id, order)); }}>
          <Text label="Current orders" value={order} onChange={setOrder} />
          <button className="small" disabled={order.trim() === creature.order} type="submit">Save order</button>
        </form>
      )}
      <div className="btn-row tight">
        {spell === 'find familiar' && status === 'present' && <button className="small" onClick={() => actOn('dismiss')}>Temporarily dismiss</button>}
        {spell === 'find familiar' && status === 'dismissed' && <button className="small" onClick={() => actOn('recall')}>Recall</button>}
        {spell === 'awaken' && status === 'present' && <button className="small" onClick={() => actOn('hurt')}>Damaged by caster or ally</button>}
        {status === 'present' && <button className="ghost small" onClick={() => actOn('gone')}>Mark gone</button>}
        <button className="ghost small" onClick={() => actOn('forget')}>{spell === 'find familiar' ? 'Dismiss permanently' : 'Remove record'}</button>
      </div>
    </li>
  );
}

export function SpellCreaturesCard() {
  const s = useGame();
  if (!s.spellCreatures?.length) return null;
  return (
    <Card title="Spell creatures">
      <ul className="plain">
        {s.spellCreatures.map((c) => (
          <SpellCreatureRow key={c.id} creature={c} caster={s.characters.find((x) => x.id === c.casterId)?.name} now={E.absNow(s)} />
        ))}
      </ul>
    </Card>
  );
}

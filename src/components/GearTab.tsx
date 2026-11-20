import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { uid } from '../state/defaults';
import { abilityMod, MAX_ATTUNED, RECHARGE_LABEL, RESOURCE_PRESETS, spellSlotsFor, type Recharge } from '../rules/upkeep';
import { isCaster } from '../rules/spells';
import { formatClock, formatDuration } from '../rules/calendar';
import { Card, Meter, Num, Pill, Select, Text, Toggle, Rule } from './common';
import type { Character, MagicItem, Resource } from '../state/types';

const setChar = (id: string, fn: (c: Character) => void) =>
  edit((d) => {
    const c = d.characters.find((x) => x.id === id);
    if (c) fn(c);
  });

export function GearTab() {
  const s = useGame();
  return (
    <div className="grid wide">
      {s.characters.map((c) => (
        <Card key={c.id} title={`${c.name} · ${c.className} ${c.level}`}>
          <HpBlock c={c} />
          {c.kind !== 'mount' && <ResourcesBlock c={c} />}
          {c.kind !== 'mount' && <ItemsBlock c={c} />}
        </Card>
      ))}
    </div>
  );
}

function HpBlock({ c }: { c: Character }) {
  const [amt, setAmt] = useState(5);
  const left = c.level - c.hitDiceSpent;
  return (
    <>
      <h3>Hit Points</h3>
      <div className="hp-line">
        <b className={c.hp === 0 ? 'bad-text' : ''}>
          {c.hp}/{c.maxHp} HP
        </b>
        {c.tempHp > 0 && <Pill tone="info">+{c.tempHp} temp</Pill>}
        <Meter value={c.hp} max={c.maxHp} tone={c.hp * 2 >= c.maxHp ? 'good' : c.hp > 0 ? 'warn' : 'bad'} />
      </div>
      <DyingBlock c={c} />
      <div className="btn-row">
        <Num value={amt} onChange={(v) => setAmt(Math.max(0, Math.round(v)))} min={0} width={3} />
        <button className="bad" onClick={() => dispatch((st, cx) => E.changeHp(st, cx, c.id, -amt))}>
          Damage
        </button>
        <button className="good" onClick={() => dispatch((st, cx) => E.changeHp(st, cx, c.id, amt))}>
          Heal
        </button>
        <button className="ghost small" onClick={() => setChar(c.id, (x) => void (x.tempHp = amt))}>
          Set temp HP
        </button>
      </div>
      <div className="form-row">
        <Num label="Max HP" value={c.maxHp} onChange={(v) => setChar(c.id, (x) => ((x.maxHp = Math.max(1, Math.round(v))), (x.hp = Math.min(x.hp, x.maxHp))))} min={1} width={3} />
        <Num label="Con score" value={c.conScore} onChange={(v) => setChar(c.id, (x) => void (x.conScore = Math.round(v)))} min={1} max={30} width={2} />
        <Select
          label="Hit Point Die"
          value={String(c.hitDie)}
          onChange={(v) => setChar(c.id, (x) => void (x.hitDie = Number(v)))}
          options={['6', '8', '10', '12'].map((v) => ({ value: v, label: `d${v}` }))}
        />
      </div>
      <div className="btn-row">
        <span>
          Hit Point Dice: <b>{left}</b>/{c.level} d{c.hitDie}
        </span>
        <button disabled={left <= 0 || c.hp >= c.maxHp} onClick={() => dispatch((st, cx) => E.spendHitDie(st, cx, c.id))}>
          Spend one (d{c.hitDie} {abilityMod(c.conScore) >= 0 ? '+' : ''}
          {abilityMod(c.conScore)})
        </button>
      </div>
      <Rule>Spend Hit Point Dice during a Short Rest. A Long Rest restores all HP and all spent Hit Point Dice, but only if you start it with at least 1 HP.</Rule>
    </>
  );
}

function DyingBlock({ c }: { c: Character }) {
  const s = useGame();
  const helpers = [
    ...s.characters.filter((x) => x.id !== c.id && x.kind !== 'mount' && x.hp > 0 && x.diedAt == null).map((x) => ({ id: x.id, name: x.name, wisMod: x.wisMod })),
    ...s.hirelings.filter((x) => x.active && x.role === 'healer').map((x) => ({ id: `h:${x.id}`, name: `${x.name} (hired healer)`, wisMod: x.bonus })),
  ];
  const [helper, setHelper] = useState(helpers[0]?.id ?? '');
  const h = helpers.find((x) => x.id === helper);
  const [bonus, setBonus] = useState<number | null>(null);
  const now = E.absNow(s);
  if (c.diedAt != null) return <p className="bad-text small">Dead. See the World tab for resurrection time limits.</p>;
  if (c.stable)
    return (
      <p className="small warn-text">
        Unconscious but <b>stable</b>. Regains 1 HP {c.wakesAt != null ? `in ${formatDuration(Math.max(0, c.wakesAt - now))} (at ${formatClock(c.wakesAt % 1440)})` : 'soon'}, or right away if healed. Taking damage makes them dying again.
      </p>
    );
  if (!c.dying) return null;
  const pips = (n: number, cls: string) => Array.from({ length: 3 }, (_, i) => <span key={i} className={`pip ${cls} ${i < n ? 'full' : ''}`} />);
  return (
    <div className="dying">
      <p className="small bad-text">
        <b>Unconscious and dying.</b> Successes <span className="pips">{pips(c.deathSuccesses, 'good-pip')}</span> Failures <span className="pips">{pips(c.deathFailures, 'bad-pip')}</span>
      </p>
      <div className="btn-row tight">
        <button className="small" onClick={() => dispatch((st, cx) => E.deathSave(st, cx, c.id))}>
          Roll death save
        </button>
      </div>
      <div className="btn-row tight">
        <Select value={helper} onChange={(v) => (setHelper(v), setBonus(null))} options={[{ value: '', label: 'Helper…' }, ...helpers.map((x) => ({ value: x.id, label: x.name }))]} />
        <Num value={bonus ?? h?.wisMod ?? 0} onChange={(v) => setBonus(Math.round(v))} width={2} label="Medicine bonus" />
        <button className="small" onClick={() => dispatch((st, cx) => E.stabilize(st, cx, c.id, helper || null, 'medicine', bonus ?? h?.wisMod ?? 0))}>
          Medicine check (DC 10)
        </button>
        <button className="small ghost" onClick={() => dispatch((st, cx) => E.stabilize(st, cx, c.id, helper || null, 'sure'))}>
          Healer&apos;s Kit / Spare the Dying
        </button>
      </div>
      <Rule>Death saves: 10 or higher is a success and a 1 counts as two failures. A 20 brings them back with 1 HP. Three successes make them stable, and three failures kill them. Damage at 0 HP adds a failure.</Rule>
    </div>
  );
}

function ResourcesBlock({ c }: { c: Character }) {
  const presets = RESOURCE_PRESETS.filter((p) => !p.cls || p.cls === c.className);
  const [preset, setPreset] = useState('');
  const [name, setName] = useState('');
  const [max, setMax] = useState(2);
  const [recharge, setRecharge] = useState<Recharge>('long');
  const set = (rid: string, fn: (r: Resource) => void) => setChar(c.id, (x) => fn(x.resources.find((r) => r.id === rid)!));
  return (
    <>
      <h3>Limited uses and spell slots</h3>
      {c.resources.length === 0 && <p className="muted small">Nothing tracked yet.</p>}
      <ul className="plain">
        {c.resources.map((r) => (
          <li key={r.id} className="armor-row">
            <span>
              <b>{r.name}</b>{' '}
              <span className="pips" aria-label={`${r.current} of ${r.max}`}>
                {Array.from({ length: Math.min(r.max, 30) }, (_, i) => (
                  <span key={i} className={`pip ${i < r.current ? 'full' : ''}`} />
                ))}
              </span>{' '}
              <span className="muted small">
                {r.current}/{r.max} · {RECHARGE_LABEL[r.recharge]}
              </span>
            </span>
            <span className="btn-row tight">
              <button className="small" disabled={r.current <= 0} onClick={() => set(r.id, (x) => void (x.current -= 1))}>
                Use
              </button>
              <button className="ghost small" disabled={r.current >= r.max} onClick={() => set(r.id, (x) => void (x.current += 1))}>
                +1
              </button>
              <button className="ghost small bad" aria-label={`Remove ${r.name}`} onClick={() => setChar(c.id, (x) => void (x.resources = x.resources.filter((y) => y.id !== r.id)))}>
                ✕
              </button>
            </span>
          </li>
        ))}
      </ul>
      <details>
        <summary>Add a resource</summary>
        <div className="form-row">
          <Select
            label="Preset"
            value={preset}
            onChange={(v) => {
              setPreset(v);
              const p = presets.find((x) => x.name === v);
              if (p) {
                setName(p.name);
                setRecharge(p.recharge);
              }
            }}
            options={[{ value: '', label: 'Custom…' }, ...presets.map((p) => ({ value: p.name, label: p.name }))]}
          />
          <Text label="Name" value={name} onChange={setName} />
          <Num label="Max" value={max} onChange={(v) => setMax(Math.max(1, Math.round(v)))} min={1} width={3} />
          <Select label="Comes back" value={recharge} onChange={setRecharge} options={(Object.keys(RECHARGE_LABEL) as Recharge[]).map((k) => ({ value: k, label: RECHARGE_LABEL[k] }))} />
        </div>
        {presets.find((p) => p.name === preset)?.note && <Rule>{presets.find((p) => p.name === preset)!.note}</Rule>}
        <div className="btn-row">
          <button disabled={!name.trim()} onClick={() => (setChar(c.id, (x) => void x.resources.push({ id: uid(), name: name.trim(), max, current: max, recharge })), setName(''), setPreset(''))}>
            Add
          </button>
          {isCaster(c.className) && (
            <button
              className="ghost"
              onClick={() =>
                setChar(c.id, (x) => {
                  x.resources = x.resources.filter((r) => !/spell slots|pact slots/i.test(r.name));
                  for (const row of spellSlotsFor(c.className as Parameters<typeof spellSlotsFor>[0], c.level)) {
                    const label = c.className === 'Warlock' ? `Pact slots (level ${row.spellLevel})` : `Spell slots (level ${row.spellLevel})`;
                    x.resources.push({ id: uid(), name: label, max: row.count, current: row.count, recharge: row.recharge });
                  }
                })
              }
            >
              Fill in {c.className} spell slots for level {c.level}
            </button>
          )}
        </div>
      </details>
    </>
  );
}

function ItemsBlock({ c }: { c: Character }) {
  const s = useGame();
  const now = E.absNow(s);
  const attuned = c.items.filter((i) => i.attuned).length;
  const [name, setName] = useState('');
  const [attune, setAttune] = useState(false);
  const [charges, setCharges] = useState(0);
  const [regain, setRegain] = useState('1d6+1');
  const [regainAt, setRegainAt] = useState<MagicItem['regainAt']>('dawn');
  const [identified, setIdentified] = useState(false);
  const [caster, setCaster] = useState('');
  const setItem = (iid: string, fn: (it: MagicItem) => void) => setChar(c.id, (x) => fn(x.items.find((i) => i.id === iid)!));
  return (
    <>
      <h3>
        Magic items <Pill tone={attuned >= MAX_ATTUNED ? 'warn' : 'muted'}>{attuned}/{MAX_ATTUNED} attuned</Pill>
      </h3>
      {c.items.length === 0 && <p className="muted small">No magic items yet.</p>}
      <ul className="plain">
        {c.items.map((it) => {
          const focus = c.restFocus?.itemId === it.id ? c.restFocus.action : null;
          return (
            <li key={it.id} className="facility">
              <div className="armor-row">
                <span>
                  <b>{it.identified ? it.name : `${it.name} (unidentified)`}</b>{' '}
                  {it.requiresAttunement && (it.attuned ? <Pill tone="good">Attuned</Pill> : <Pill tone="muted">Needs attunement</Pill>)}
                  {it.charges != null && it.maxCharges != null && (
                    <Pill tone="info">
                      {it.charges}/{it.maxCharges} charges
                    </Pill>
                  )}
                  {it.awaySince != null && (
                    <Pill tone="warn">
                      Left behind {formatDuration(now - it.awaySince)}
                      {it.attuned ? ` · attunement ends in ${formatDuration(Math.max(0, 1440 - (now - it.awaySince)))}` : ''}
                    </Pill>
                  )}
                  {focus && <Pill tone="good">Next rest: {focus === 'attune' ? 'attune' : focus === 'identify' ? 'identify' : 'end attunement'}</Pill>}
                </span>
                <button className="ghost small bad" aria-label={`Remove ${it.name}`} onClick={() => setChar(c.id, (x) => void (x.items = x.items.filter((y) => y.id !== it.id)))}>
                  ✕
                </button>
              </div>
              <div className="btn-row tight">
                {it.charges != null && (
                  <button className="small" disabled={it.charges <= 0} onClick={() => setItem(it.id, (x) => void (x.charges = (x.charges ?? 0) - 1))}>
                    Use a charge
                  </button>
                )}
                {!it.identified && (
                  <button className="small" onClick={() => dispatch((st, cx) => E.setRestFocus(st, cx, c.id, focus === 'identify' ? null : { itemId: it.id, action: 'identify' }))}>
                    {focus === 'identify' ? 'Cancel' : 'Identify during next rest'}
                  </button>
                )}
                {it.requiresAttunement && !it.attuned && (
                  <button className="small" disabled={attuned >= MAX_ATTUNED} onClick={() => dispatch((st, cx) => E.setRestFocus(st, cx, c.id, focus === 'attune' ? null : { itemId: it.id, action: 'attune' }))}>
                    {focus === 'attune' ? 'Cancel' : 'Attune during next rest'}
                  </button>
                )}
                {it.attuned && (
                  <button className="small ghost" onClick={() => dispatch((st, cx) => E.setRestFocus(st, cx, c.id, focus === 'unattune' ? null : { itemId: it.id, action: 'unattune' }))}>
                    {focus === 'unattune' ? 'Cancel' : 'End attunement during next rest'}
                  </button>
                )}
                <button className="small ghost" onClick={() => dispatch((st, cx) => E.leaveItem(st, cx, c.id, it.id, it.awaySince == null))}>
                  {it.awaySince == null ? 'Left behind' : 'Recovered'}
                </button>
              </div>
              {!it.identified && (
                <div className="btn-row tight">
                  <Select value={caster} onChange={setCaster} options={[{ value: '', label: 'Identify spell: scroll' }, ...s.characters.map((x) => ({ value: x.id, label: `Identify spell: ${x.name}` }))]} />
                  <button className="small" onClick={() => dispatch((st, cx) => E.identifyBySpell(st, cx, c.id, it.id, caster || null, false))}>
                    Cast (1 min)
                  </button>
                  <button className="small ghost" onClick={() => dispatch((st, cx) => E.identifyBySpell(st, cx, c.id, it.id, caster || null, true))}>
                    As ritual (11 min)
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <details>
        <summary>Add a magic item</summary>
        <div className="form-row">
          <Text label="Name" value={name} onChange={setName} placeholder="e.g. Wand of Magic Missiles" />
          <Num label="Charges" value={charges} onChange={(v) => setCharges(Math.max(0, Math.round(v)))} min={0} width={3} />
          {charges > 0 && (
            <>
              <Text label="Regains" value={regain} onChange={setRegain} placeholder="1d6+1 or all" />
              <Select
                label="When"
                value={regainAt}
                onChange={setRegainAt}
                options={[
                  { value: 'dawn', label: 'At dawn' },
                  { value: 'longRest', label: 'Long Rest' },
                  { value: 'shortRest', label: 'Short Rest' },
                  { value: 'never', label: 'Never' },
                ]}
              />
            </>
          )}
        </div>
        <div className="chips">
          <Toggle checked={attune} onChange={setAttune} label="Requires attunement" />
          <Toggle checked={identified} onChange={setIdentified} label="Already identified" />
        </div>
        <button
          disabled={!name.trim()}
          onClick={() => {
            setChar(c.id, (x) =>
              void x.items.push({
                id: uid(),
                name: name.trim(),
                requiresAttunement: attune,
                attuned: false,
                identified,
                charges: charges > 0 ? charges : null,
                maxCharges: charges > 0 ? charges : null,
                regain,
                regainAt,
                awaySince: null,
                notes: '',
              }),
            );
            setName('');
          }}
        >
          Add item
        </button>
      </details>
      <Rule>
        Attuning takes a Short Rest focused on the item while touching it, with a maximum of {MAX_ATTUNED} items. Identifying works the same way, or with the Identify spell. Attunement ends if the item is more
        than 100 feet away for 24 hours.
      </Rule>
    </>
  );
}

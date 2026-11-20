import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { uid } from '../state/defaults';
import {
  ACTIVITY_IDEAS,
  calendarDays,
  magicItemCrafting,
  nonmagicalCrafting,
  POTION_OF_HEALING,
  PROJECT_KIND_LABEL,
  RARITY_LABEL,
  SCROLL_CRAFTING,
  type ProjectKind,
  type Rarity,
} from '../rules/crafting';
import { Card, Meter, Num, Select, Text, Toggle, Rule } from './common';

export function DowntimeTab() {
  const s = useGame();
  const [selected, setSelected] = useState<string[]>([]);
  const active = s.projects.filter((p) => !p.done);
  const done = s.projects.filter((p) => p.done);
  const sel = selected.filter((id) => active.some((p) => p.id === id));
  return (
    <div className="grid">
      <NewProject />
      <Card title="Projects" className="span-2">
        {active.length === 0 && <p className="muted">No active projects. Start one on the left.</p>}
        <ul className="projects">
          {active.map((p) => (
            <li key={p.id}>
              <Toggle checked={sel.includes(p.id)} onChange={(v) => setSelected(v ? [...sel, p.id] : sel.filter((x) => x !== p.id))} label={<b>{p.name}</b>} />
              <div className="project-meta">
                <Meter value={p.daysDone} max={p.daysRequired} tone="good" />
                <span className="small">
                  {p.daysDone}/{p.daysRequired} workdays · {p.costGp.toLocaleString()} GP ·{' '}
                  {p.charIds.map((id) => E.charById(s, id)?.name).filter(Boolean).join(', ') || 'nobody assigned'} · about {calendarDays(p.daysRequired - p.daysDone, p.charIds.length)} more day(s)
                </span>
                {p.notes && <span className="muted small">{p.notes}</span>}
              </div>
              <span className="btn-row tight">
                <button className="ghost small" onClick={() => edit((d) => void (d.projects.find((x) => x.id === p.id)!.daysDone = Math.min(p.daysRequired, p.daysDone + 1)))}>
                  +1 day
                </button>
                <button
                  className="ghost small bad"
                  onClick={() => {
                    if (confirm(`Delete ${p.name}?`)) edit((d) => void (d.projects = d.projects.filter((x) => x.id !== p.id)));
                  }}
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
        {active.length > 0 && (
          <div className="btn-row">
            <button className="primary" disabled={!sel.length} onClick={() => dispatch((st, c) => E.workOnProjects(st, c, sel))}>
              Work 8 hours on selected
            </button>
            <button disabled={!sel.length} onClick={() => dispatch((st, c) => E.downtimeDay(st, c, sel))}>
              Full downtime day (work, eat, Long Rest at 23:00)
            </button>
          </div>
        )}
        <Rule>Each 8-hour workday adds one day of progress for every assigned crafter who is alive, because crafters who share the work divide the time between them.</Rule>
        {done.length > 0 && (
          <details>
            <summary>Completed ({done.length})</summary>
            <ul>
              {done.map((p) => (
                <li key={p.id}>
                  {p.name} <span className="muted small">({p.costGp} GP)</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Card>
    </div>
  );
}

function NewProject() {
  const s = useGame();
  const [kind, setKind] = useState<ProjectKind>('nonmagical');
  const [name, setName] = useState('');
  const [price, setPrice] = useState(50);
  const [scrollLevel, setScrollLevel] = useState(1);
  const [potions, setPotions] = useState(1);
  const [rarity, setRarity] = useState<Rarity>('uncommon');
  const [consumable, setConsumable] = useState(false);
  const [days, setDays] = useState(5);
  const [cost, setCost] = useState(0);
  const [crafters, setCrafters] = useState<string[]>([]);

  let calc: { days: number; gp: number; label: string; note: string };
  switch (kind) {
    case 'nonmagical': {
      const r = nonmagicalCrafting(price);
      calc = { ...r, label: name || `Item worth ${price} GP`, note: 'Needs proficiency with the right tool. Materials cost half the price.' };
      break;
    }
    case 'scroll': {
      const r = SCROLL_CRAFTING[scrollLevel];
      calc = { days: r.days, gp: r.gp, label: name || `Spell Scroll (level ${scrollLevel === 0 ? 'cantrip' : scrollLevel})`, note: 'Needs Arcana proficiency and the spell prepared each day of work.' };
      break;
    }
    case 'potion':
      calc = {
        days: POTION_OF_HEALING.days * potions,
        gp: POTION_OF_HEALING.gp * potions,
        label: name || `${potions} Potion${potions > 1 ? 's' : ''} of Healing`,
        note: `Needs proficiency with an ${POTION_OF_HEALING.tool}.`,
      };
      break;
    case 'magic': {
      const r = magicItemCrafting(rarity, consumable);
      calc = { ...r, label: name || `${RARITY_LABEL[rarity]} magic item`, note: 'Needs Arcana proficiency, the right tool and a formula. Consumables take half the time and cost.' };
      break;
    }
    default:
      calc = { days, gp: cost, label: name || 'Downtime activity', note: 'Set the time and cost with your DM.' };
  }
  const cal = calendarDays(calc.days, crafters.length);

  return (
    <Card title="New downtime project">
      <Select label="Type" value={kind} onChange={setKind} options={(Object.keys(PROJECT_KIND_LABEL) as ProjectKind[]).map((k) => ({ value: k, label: PROJECT_KIND_LABEL[k] }))} />
      <Text label="Name" value={name} onChange={setName} placeholder={kind === 'activity' ? ACTIVITY_IDEAS.join(', ') : 'Optional'} wide />
      <div className="form-row">
        {kind === 'nonmagical' && <Num label="Item price" value={price} onChange={setPrice} min={0} suffix="GP" width={6} />}
        {kind === 'scroll' && (
          <Select
            label="Spell level"
            value={String(scrollLevel)}
            onChange={(v) => setScrollLevel(Number(v))}
            options={SCROLL_CRAFTING.map((r) => ({ value: String(r.level), label: `${r.level === 0 ? 'Cantrip' : `Level ${r.level}`}: ${r.days} d, ${r.gp} GP` }))}
          />
        )}
        {kind === 'potion' && <Num label="How many" value={potions} onChange={(v) => setPotions(Math.max(1, Math.round(v)))} min={1} width={3} />}
        {kind === 'magic' && (
          <>
            <Select label="Rarity" value={rarity} onChange={setRarity} options={(Object.keys(RARITY_LABEL) as Rarity[]).map((r) => ({ value: r, label: RARITY_LABEL[r] }))} />
            <Toggle checked={consumable} onChange={setConsumable} label="Consumable" />
          </>
        )}
        {kind === 'activity' && (
          <>
            <Num label="Workdays" value={days} onChange={(v) => setDays(Math.max(1, Math.round(v)))} min={1} width={4} />
            <Num label="Cost" value={cost} onChange={setCost} min={0} suffix="GP" width={6} />
          </>
        )}
      </div>
      <div className="field">
        <span className="field-label">Who works on it</span>
        <div className="chips">
          {s.characters.map((c) => (
            <Toggle key={c.id} checked={crafters.includes(c.id)} onChange={(v) => setCrafters(v ? [...crafters, c.id] : crafters.filter((x) => x !== c.id))} label={c.name} />
          ))}
        </div>
      </div>
      <p className="calc">
        <b>{calc.days}</b> workday(s) · <b>{calc.gp.toLocaleString()} GP</b> · {cal} calendar day(s) with {Math.max(1, crafters.length)} crafter(s)
      </p>
      <Rule>{calc.note}</Rule>
      <button
        className="primary"
        onClick={() => {
          const p = { id: uid(), name: calc.label, kind, charIds: crafters, daysRequired: calc.days, daysDone: 0, costGp: calc.gp, notes: '', done: false };
          edit((d) => {
            d.projects.push(p);
            E.log(d, `New downtime project: ${p.name} (${p.daysRequired} workdays, ${p.costGp} GP).`);
          });
          setName('');
        }}
      >
        Start project
      </button>
    </Card>
  );
}

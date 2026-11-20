import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { uid } from '../state/defaults';
import {
  ACTIVITY_IDEAS,
  GEAR_CATALOG,
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
import { MAGIC_ITEM_VALUE, fmtGp } from '../rules/money';
import { SPELLBOOK_COPY, ACTIVITY_PRESETS } from '../rules/longterm';

export function DowntimeTab() {
  const s = useGame();
  const [selected, setSelected] = useState<string[]>([]);
  const active = s.projects.filter((p) => !p.done);
  const done = s.projects.filter((p) => p.done);
  const sel = selected.filter((id) => active.some((p) => p.id === id));
  return (
    <div className="grid">
      <NewProject />
      <MaterialsCard />
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
                {p.materialsUsed && p.materialsUsed.length > 0 && <span className="muted small">Materials: {p.materialsUsed.map((u) => `${u.qty} × ${u.name}`).join(', ')}</span>}
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

function MaterialsCard() {
  const s = useGame();
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState('lb');
  const [value, setValue] = useState(0.1);
  const set = (id: string, fn: (m: (typeof s.materials)[number]) => void) => edit((d) => fn(d.materials.find((x) => x.id === id)!));
  const total = s.materials.reduce((a, m) => a + m.qty * m.valueGp, 0);
  return (
    <Card title={`Crafting materials (${fmtGp(total)})`}>
      {s.materials.length === 0 && <p className="muted small">The stash is empty. Add materials, or butcher a big kill for hides.</p>}
      <ul className="plain">
        {s.materials.map((m) => (
          <li key={m.id} className="armor-row">
            <span>
              <b>{m.name}</b> <span className="muted small">{fmtGp(m.valueGp)} per {m.unit}</span>
            </span>
            <span className="btn-row tight">
              <Num value={m.qty} onChange={(v) => set(m.id, (x) => void (x.qty = Math.max(0, v)))} min={0} suffix={m.unit} width={4} />
              <button className="ghost tiny" aria-label={`Remove ${m.name}`} onClick={() => edit((d) => void (d.materials = d.materials.filter((x) => x.id !== m.id)))}>
                ✕
              </button>
            </span>
          </li>
        ))}
      </ul>
      <div className="form-row">
        <Text label="Material" value={name} onChange={setName} placeholder="e.g. Iron ingots, Leather, Herbs" />
        <Num label="Amount" value={qty} onChange={(v) => setQty(Math.max(0, v))} min={0} width={4} />
        <Text label="Unit" value={unit} onChange={setUnit} />
        <Num label="Value each" value={value} onChange={(v) => setValue(Math.max(0, v))} min={0} step={0.1} suffix="GP" width={5} />
      </div>
      <button
        disabled={!name.trim()}
        onClick={() => {
          edit((d) => {
            const existing = d.materials.find((m) => m.name.toLowerCase() === name.trim().toLowerCase());
            if (existing) existing.qty += qty;
            else d.materials.push({ id: uid(), name: name.trim(), qty, unit: unit.trim() || 'unit', valueGp: value });
          });
          setName('');
        }}
      >
        Add to stash
      </button>
      <Rule>Materials used for a project come out of the stash, and their value counts toward its cost. The rest is paid in gold.</Rule>
    </Card>
  );
}

function NewProject() {
  const s = useGame();
  const [kind, setKind] = useState<ProjectKind>('nonmagical');
  const [name, setName] = useState('');
  const [price, setPrice] = useState(50);
  const [gear, setGear] = useState('');
  const [scrollLevel, setScrollLevel] = useState(1);
  const [potions, setPotions] = useState(1);
  const [rarity, setRarity] = useState<Rarity>('uncommon');
  const [consumable, setConsumable] = useState(false);
  const [days, setDays] = useState(5);
  const [cost, setCost] = useState(0);
  const [crafters, setCrafters] = useState<string[]>([]);
  const [deal, setDeal] = useState<number | null>(null);
  const [dealDays, setDealDays] = useState(5);
  const [spellName, setSpellName] = useState('');
  const [spellLevel, setSpellLevel] = useState(1);
  const pcs = s.characters.filter((c) => c.kind !== 'mount');
  const [useMats, setUseMats] = useState<Record<string, number>>({});

  let calc: { days: number; gp: number; label: string; note: string };
  switch (kind) {
    case 'nonmagical': {
      const r = nonmagicalCrafting(price);
      const item = GEAR_CATALOG.find((g) => g.name === gear);
      calc = {
        ...r,
        label: name || item?.name || `Item worth ${price} GP`,
        note: `${item ? `Needs proficiency with ${item.tool}. ` : 'Needs proficiency with the right tool. '}Each 8-hour workday makes 10 GP of progress, and materials cost half the price.`,
      };
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
    case 'buyMagic':
    case 'sellMagic': {
      const value = MAGIC_ITEM_VALUE[rarity];
      const price = deal ?? (kind === 'sellMagic' ? value / 2 : value);
      calc = {
        days: dealDays,
        gp: price,
        label: name || `${kind === 'buyMagic' ? 'Buy' : 'Sell'} a ${RARITY_LABEL[rarity].toLowerCase()} magic item`,
        note:
          kind === 'buyMagic'
            ? `Finding a seller takes downtime. Typical value: ${fmtGp(value)}. The price is paid when the deal is done.`
            : `Finding a buyer takes downtime. Sellers usually get about half the value (${fmtGp(value / 2)}). The gold is received when the deal is done.`,
      };
      break;
    }
    case 'spellcopy': {
      const hours = SPELLBOOK_COPY.hoursPerLevel * spellLevel;
      calc = {
        days: Math.max(1, Math.ceil(hours / 8)),
        gp: SPELLBOOK_COPY.gpPerLevel * spellLevel,
        label: name || `Copy ${spellName || 'a spell'} into a spellbook`,
        note: `${hours} hours and ${SPELLBOOK_COPY.gpPerLevel * spellLevel} GP (2 hours and 50 GP per spell level). The first crafter's spellbook gets the spell when it's done.`,
      };
      break;
    }
    default:
      calc = {
        days,
        gp: cost,
        label: name || 'Downtime activity',
        note: (() => {
          const a = ACTIVITY_PRESETS.find((x) => x.name === name);
          return a ? `Check when it's done: ${a.check}. The DM decides the outcome. These times and costs are suggestions.` : 'Set the time and cost with your DM.';
        })(),
      };
  }
  const cal = calendarDays(calc.days, crafters.length);

  return (
    <Card title="New downtime project">
      <Select label="Type" value={kind} onChange={setKind} options={(Object.keys(PROJECT_KIND_LABEL) as ProjectKind[]).map((k) => ({ value: k, label: PROJECT_KIND_LABEL[k] }))} />
      <Text label="Name" value={name} onChange={setName} placeholder={kind === 'activity' ? ACTIVITY_IDEAS.join(', ') : 'Optional'} wide />
      <div className="form-row">
        {kind === 'nonmagical' && (
          <>
            <Select
              label="Gear"
              value={gear}
              onChange={(v) => {
                setGear(v);
                const item = GEAR_CATALOG.find((g) => g.name === v);
                if (item) setPrice(item.gp);
              }}
              options={[
                { value: '', label: 'Custom price…' },
                ...GEAR_CATALOG.map((g) => ({ value: g.name, label: `${g.name}: ${g.gp} GP, ${Math.max(1, Math.ceil(g.gp / 10))} d` })),
              ]}
            />
            <Num label="Item price" value={price} onChange={(v) => (setPrice(v), setGear(''))} min={0} suffix="GP" width={6} />
          </>
        )}
        {kind === 'scroll' && (
          <Select
            label="Spell level"
            value={String(scrollLevel)}
            onChange={(v) => setScrollLevel(Number(v))}
            options={SCROLL_CRAFTING.map((r) => ({ value: String(r.level), label: `${r.level === 0 ? 'Cantrip' : `Level ${r.level}`}: ${r.days} d, ${r.gp} GP` }))}
          />
        )}
        {kind === 'potion' && <Num label="How many" value={potions} onChange={(v) => setPotions(Math.max(1, Math.round(v)))} min={1} width={3} />}
        {(kind === 'buyMagic' || kind === 'sellMagic') && (
          <>
            <Select label="Rarity" value={rarity} onChange={(v: Rarity) => (setRarity(v), setDeal(null))} options={(Object.keys(RARITY_LABEL) as Rarity[]).map((r) => ({ value: r, label: RARITY_LABEL[r] }))} />
            <Num label="Price" value={calc.gp} onChange={(v) => setDeal(Math.max(0, v))} min={0} suffix="GP" width={7} />
            <Num label="Workdays" value={dealDays} onChange={(v) => setDealDays(Math.max(1, Math.round(v)))} min={1} width={3} />
          </>
        )}
        {kind === 'spellcopy' && (
          <>
            <Text label="Spell" value={spellName} onChange={setSpellName} placeholder="e.g. Fireball" />
            <Num label="Level" value={spellLevel} onChange={(v) => setSpellLevel(Math.max(1, Math.min(9, Math.round(v))))} min={1} max={9} width={2} />
          </>
        )}
        {kind === 'magic' && (
          <>
            <Select label="Rarity" value={rarity} onChange={setRarity} options={(Object.keys(RARITY_LABEL) as Rarity[]).map((r) => ({ value: r, label: RARITY_LABEL[r] }))} />
            <Toggle checked={consumable} onChange={setConsumable} label="Consumable" />
          </>
        )}
        {kind === 'activity' && (
          <>
            <Select
              label="Activity"
              value={ACTIVITY_PRESETS.some((a) => a.name === name) ? name : ''}
              onChange={(v) => {
                const a = ACTIVITY_PRESETS.find((x) => x.name === v);
                if (a) {
                  setName(a.name);
                  setDays(a.days);
                  setCost(a.gp);
                }
              }}
              options={[{ value: '', label: 'Custom…' }, ...ACTIVITY_PRESETS.map((a) => ({ value: a.name, label: a.name }))]}
            />
            <Num label="Workdays" value={days} onChange={(v) => setDays(Math.max(1, Math.round(v)))} min={1} width={4} />
            <Num label="Cost" value={cost} onChange={setCost} min={0} suffix="GP" width={6} />
          </>
        )}
      </div>
      <div className="field">
        <span className="field-label">Who works on it</span>
        <div className="chips">
          {pcs.map((c) => (
            <Toggle key={c.id} checked={crafters.includes(c.id)} onChange={(v) => setCrafters(v ? [...crafters, c.id] : crafters.filter((x) => x !== c.id))} label={c.name} />
          ))}
        </div>
      </div>
      {s.materials.length > 0 && kind !== 'buyMagic' && kind !== 'sellMagic' && (
        <details>
          <summary>Use materials from the stash</summary>
          <ul className="plain small">
            {s.materials.map((m) => (
              <li key={m.id} className="armor-row">
                <span>
                  {m.name} <span className="muted">({m.qty} {m.unit}, {fmtGp(m.valueGp)} each)</span>
                </span>
                <Num value={useMats[m.id] ?? 0} onChange={(v) => setUseMats({ ...useMats, [m.id]: Math.max(0, Math.min(m.qty, v)) })} min={0} max={m.qty} width={3} />
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="calc">
        <b>{calc.days}</b> workday(s) · <b>{calc.gp.toLocaleString()} GP</b>
        {(() => {
          const v = Object.entries(useMats).reduce((a, [id, q]) => a + q * (s.materials.find((m) => m.id === id)?.valueGp ?? 0), 0);
          return v > 0 ? ` (${fmtGp(v)} covered by materials, ${fmtGp(Math.max(0, calc.gp - v))} in gold)` : '';
        })()} · {cal} calendar day(s) with {Math.max(1, crafters.length)} crafter(s)
      </p>
      <Rule>{calc.note}</Rule>
      <button
        className="primary"
        onClick={() => {
          const trade = kind === 'buyMagic' || kind === 'sellMagic';
          const p = {
            id: uid(),
            name: calc.label,
            kind,
            charIds: crafters,
            daysRequired: calc.days,
            daysDone: 0,
            costGp: trade ? 0 : calc.gp,
            notes: kind === 'activity' ? (ACTIVITY_PRESETS.find((a) => a.name === name)?.check ?? '') : '',
            done: false,
            ...(trade ? { rarity, dealGp: calc.gp } : {}),
            ...(kind === 'spellcopy' ? { spell: { name: spellName.trim() || 'Unnamed spell', level: spellLevel } } : {}),
            materialsUsed: Object.entries(useMats)
              .filter(([, q]) => q > 0)
              .map(([materialId, qty]) => {
                const m = s.materials.find((x) => x.id === materialId)!;
                return { materialId, name: m.name, qty, valueGp: m.valueGp };
              }),
          };
          setUseMats({});
          dispatch((st, cx) => E.startProject(st, cx, p));
          setName('');
          setDeal(null);
        }}
      >
        Start project
      </button>
    </Card>
  );
}

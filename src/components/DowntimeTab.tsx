import { useState } from 'react';
import type { Project } from '../state/types';
import { SpeedUp } from './SpeedUp';
import { PATRONS } from '../rules/patrons';
import { ACTIVITY_CHECKS, activityOf, CAROUSING_COST, CRIME_TARGETS } from '../rules/downtimeOutcomes';
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
import { AWAY_PROGRESS, BUILDING_PRESETS, BUSINESS_DEBT_PENALTY, BUSINESS_MAX_DAYS, BUSINESS_PRESETS } from '../rules/business';
import { WaysAround } from './WaysAround';

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
      {s.settings.runningBusiness && <BusinessCard />}
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
                  {p.charIds.map((id) => E.charById(s, id)?.name).filter(Boolean).join(', ') || 'nobody assigned'} · about {calendarDays(p.daysRequired - p.daysDone, p.charIds.length + (E.ARTISAN_KINDS.includes(p.kind) ? (p.hiredArtisans ?? 0) : 0), s.settings.extraCraftHelpers)} more day(s)
                </span>
                {p.notes && <span className="muted small">{p.notes}</span>}
                {p.materialsUsed && p.materialsUsed.length > 0 && <span className="muted small">Materials: {p.materialsUsed.map((u) => `${u.qty} × ${u.name}`).join(', ')}</span>}
                {E.ARTISAN_KINDS.includes(p.kind) && <CraftSpeedUp p={p} />}
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
        {done.filter((p) => p.awaitingOutcome).map((p) => (
          <ActivityResolver key={p.id} p={p} />
        ))}
        {done.length > 0 && (
          <details>
            <summary>Completed ({done.length})</summary>
            <ul>
              {done.map((p) => (
                <li key={p.id}>
                  {p.name} <span className="muted small">({p.costGp} GP)</span>
                  {p.outcome && <span className="small"> · {p.outcome}</span>}
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
  const [learn, setLearn] = useState('');
  const [newLevel, setNewLevel] = useState(3);
  const [returning, setReturning] = useState(false);
  const [intMod, setIntMod] = useState(0);
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
  const cal = calendarDays(calc.days, crafters.length, s.settings.extraCraftHelpers);
  const productFor = (): { name: string; qty: number; magic?: boolean; valueGp?: number } | undefined => {
    if (kind === 'nonmagical') {
      const item = GEAR_CATALOG.find((g) => g.name === gear);
      return { name: name.trim() || item?.name || 'Crafted item', qty: 1, valueGp: price };
    }
    if (kind === 'potion') return { name: 'Potion of Healing', qty: potions };
    if (kind === 'scroll') return { name: `Spell Scroll (${scrollLevel === 0 ? 'cantrip' : `level ${scrollLevel}`})`, qty: 1 };
    if (kind === 'magic') return { name: name.trim() || `${RARITY_LABEL[rarity]} magic item`, qty: 1, magic: true };
    return undefined;
  };

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
            {name.startsWith('Change subclass') && (
              <>
                <Num
                  label="New class level"
                  value={newLevel}
                  onChange={(v) => {
                    const l = Math.max(1, Math.min(20, Math.round(v)));
                    setNewLevel(l);
                    setDays(returning ? l : 2 * l);
                    setCost(returning ? 0 : 100 * l);
                  }}
                  min={1}
                  max={20}
                  width={2}
                />
                <Toggle
                  checked={returning}
                  onChange={(v) => {
                    setReturning(v);
                    setDays(v ? newLevel : 2 * newLevel);
                    setCost(v ? 0 : 100 * newLevel);
                  }}
                  label="Returning to a subclass held before (half time, free)"
                />
              </>
            )}
            {name.startsWith('Training') && (
              <>
                <Text label="Language or tool" value={learn} onChange={setLearn} placeholder="e.g. Elvish, Thieves' Tools" />
                <Num
                  label="Int modifier"
                  value={intMod}
                  onChange={(v) => {
                    const m = Math.round(v);
                    const weeks = Math.max(1, 10 - m);
                    const p = s.patron ? PATRONS[s.patron.kind] : null;
                    setIntMod(m);
                    setDays(Math.ceil(weeks * 5 * (p?.trainingHalfTime ? 0.5 : 1)));
                    setCost(weeks * 25 * (p?.trainingHalfCost ? 0.5 : 1));
                  }}
                  width={3}
                />
              </>
            )}
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
            ...(kind === 'activity' && name.startsWith('Training') && learn.trim() ? { learn: learn.trim(), name: `Training: ${learn.trim()}` } : {}),
            product: productFor(),
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
      <WaysAround topic={['crafting', 'spellbook', 'downtime']} />
    </Card>
  );
}

function BusinessCard() {
  const s = useGame();
  const owners = s.characters.filter((c) => c.kind !== 'mount');
  const [preset, setPreset] = useState(BUSINESS_PRESETS[0].name);
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [cost, setCost] = useState(BUSINESS_PRESETS[0].gpPerDay);
  const [days, setDays] = useState(7);
  const [build, setBuild] = useState(false);
  const [building, setBuilding] = useState(BUILDING_PRESETS[1].name);
  const [buildGp, setBuildGp] = useState(BUILDING_PRESETS[1].gp);
  const [buildDays, setBuildDays] = useState(BUILDING_PRESETS[1].days);
  const [landGp, setLandGp] = useState(0);
  const pickBuilding = (v: string) => {
    const bp = BUILDING_PRESETS.find((x) => x.name === v);
    setBuilding(v);
    if (!bp) return;
    setBuildGp(bp.gp);
    setBuildDays(bp.days);
    const kind = BUSINESS_PRESETS.find((x) => x.name === bp.business);
    if (kind) {
      setPreset(kind.name);
      setCost(kind.gpPerDay);
    }
  };
  const bp = BUILDING_PRESETS.find((x) => x.name === building);
  const ownerId = owners.find((c) => c.id === owner)?.id ?? owners[0]?.id ?? '';
  return (
    <Card title="Running a business (optional rule)">
      {s.businesses.length === 0 && <p className="muted small">No businesses yet. Add one an adventurer owns, inherited or was given.</p>}
      <ul className="plain">
        {s.businesses.map((b) => {
          const counted = Math.min(BUSINESS_MAX_DAYS, b.daysWorked);
          return (
            <li key={b.id} className="facility">
              <div className="armor-row">
                <span>
                  <b>{b.name}</b> <span className="muted small">{E.charById(s, b.ownerId)?.name ?? 'no owner'} · {fmtGp(b.gpPerDay)}/day upkeep · net {fmtGp(b.netGp)}</span>
                </span>
                <button className="ghost small bad" aria-label={`Remove ${b.name}`} onClick={() => confirm(`Remove ${b.name}?`) && edit((d) => void (d.businesses = d.businesses.filter((x) => x.id !== b.id)))}>
                  ✕
                </button>
              </div>
              {b.building && (
                <div className="small">
                  <Meter value={b.building.daysDone} max={b.building.totalDays} tone="good" /> Building ({b.building.what}): {Math.floor(b.building.daysDone)}/{b.building.totalDays} days, about {E.buildDaysLeft(s, b)} more at this pace.
                  <Toggle checked={!!b.overseeing} onChange={(v) => edit((d) => void (d.businesses.find((x) => x.id === b.id)!.overseeing = v))} label="Owner is on site overseeing the work (away: each day away adds 3 days)" />
                  <SpeedUp target={{ kind: 'business', id: b.id }} />
                </div>
              )}
              {!b.building && <><p className="small">
                {b.daysWorked} day(s) worked since the last roll{b.daysWorked > BUSINESS_MAX_DAYS ? ` (only ${BUSINESS_MAX_DAYS} count)` : ''}. Roll: d100 + {counted}
                {b.debts > 0 && <> − {b.debts * BUSINESS_DEBT_PENALTY} for {b.debts} unpaid debt(s) ({fmtGp(b.unpaidGp)})</>}.
                {b.lastResult && <span className="muted"> Last: {b.lastResult}.</span>}
              </p>
              <div className="btn-row tight">
                <Num value={days} onChange={(v) => setDays(Math.max(1, Math.round(v)))} min={1} suffix="days" width={3} />
                <button className="small" onClick={() => dispatch((st, cx) => E.runBusiness(st, cx, b.id, days))}>
                  Spend {days} downtime day{days > 1 ? 's' : ''} running it
                </button>
                <button className="primary small" disabled={b.daysWorked < 1} onClick={() => dispatch((st, cx) => E.settleBusiness(st, cx, b.id))}>
                  Roll for the period
                </button>
                {b.unpaidGp > 0 && (
                  <button className="small" onClick={() => dispatch((st, cx) => E.payBusinessDebts(st, cx, b.id))}>
                    Pay debts ({fmtGp(b.unpaidGp)})
                  </button>
                )}
              </div></>}
            </li>
          );
        })}
      </ul>
      <details className="add-facility">
        <summary>Add a business</summary>
        <Toggle checked={build} onChange={setBuild} label="Build it from scratch (otherwise it's already owned: inherited, bought or a reward)" />
        {build && (
          <>
            <div className="form-row">
              <Select label="Building" value={building} onChange={pickBuilding} options={BUILDING_PRESETS.map((x) => ({ value: x.name, label: `${x.name}${x.official ? '' : ' (table rule)'}` }))} />
              <Num label="Construction" value={buildGp} onChange={(v) => setBuildGp(Math.max(0, Math.round(v)))} min={0} suffix="GP" width={7} />
              <Num label="Time" value={buildDays} onChange={(v) => setBuildDays(Math.max(1, Math.round(v)))} min={1} suffix="days" width={4} />
              <Num label="Land" value={landGp} onChange={(v) => setLandGp(Math.max(0, Math.round(v)))} min={0} suffix="GP" width={6} />
            </div>
            <p className="small muted">
              {bp?.official ? 'From the 2014 DMG Building a Stronghold table.' : 'Table-rule estimate: the DMG prices no shops, taverns, inns or farms.'} Land: a small plot 100–1,000 GP, a large estate 5,000 GP or more (leave 0 if already owned). Away from the site, the work goes at a third of the speed (about {Math.ceil(buildDays / AWAY_PROGRESS)} days).
            </p>
          </>
        )}
        <div className="form-row">
          <Select
            label="Kind"
            value={preset}
            onChange={(v) => {
              setPreset(v);
              setCost(BUSINESS_PRESETS.find((x) => x.name === v)?.gpPerDay ?? cost);
            }}
            options={BUSINESS_PRESETS.map((x) => x.name)}
          />
          <Text label="Name" value={name} onChange={setName} placeholder={`e.g. The Gilded ${preset.split(',')[0]}`} />
          <Select label="Owner" value={ownerId} onChange={setOwner} options={owners.map((c) => ({ value: c.id, label: c.name }))} />
          <Num label="Upkeep" value={cost} onChange={(v) => setCost(Math.max(0, v))} min={0} step={0.5} suffix="GP/day" width={4} />
        </div>
        <button className="small" disabled={!ownerId} onClick={() => dispatch((st, cx) => E.addBusiness(st, cx, name || (build ? building : preset), ownerId, cost, build ? { what: building, costGp: buildGp, days: buildDays, landGp } : undefined))}>
          {build ? `Start building (${(buildGp + landGp).toLocaleString()} GP)` : 'Add business'}
        </button>
      </details>
      <Rule>
        2014 DMG: each downtime day the owner spends running the business counts (at most 30). Then roll d100 + days on the Running a Business table: low rolls mean paying 1½×, full or half the maintenance for those days; middling rolls break even; high rolls add a profit of 1d6, 2d8 or 3d10 × 5 GP. An unpaid cost makes the business start to fail: −10 to later rolls for each debt until it&apos;s paid. Building one follows the DMG&apos;s Building a Stronghold rule: pay the cost up front, and work takes the listed days while the owner oversees it; each day away adds 3 days. The 2024 rules have no equivalent, so this can be switched off in Settings.
      </Rule>
      <WaysAround topic={'building'} />
    </Card>
  );
}


function CraftSpeedUp({ p }: { p: Project }) {
  const s = useGame();
  const [caster, setCaster] = useState('');
  const hired = p.hiredArtisans ?? 0;
  const workers = p.charIds.length + hired;
  const capped = !s.settings.extraCraftHelpers && workers > 2;
  const fabricators = s.characters.filter((c) => E.alive(c) && c.spells.some((x) => x.name.toLowerCase() === 'fabricate'));
  const casterId = fabricators.find((c) => c.id === caster)?.id ?? fabricators[0]?.id ?? '';
  return (
    <details className="add-facility">
      <summary className="small">Speed it up{hired ? ` · ${hired} hired artisan${hired > 1 ? 's' : ''}` : ''}</summary>
      <div className="btn-row tight">
        <Num label="Hired artisans" value={hired} onChange={(v) => edit((d) => void (d.projects.find((x) => x.id === p.id)!.hiredArtisans = Math.max(0, Math.round(v))))} min={0} width={2} />
        <span className="small muted">Skilled hirelings with the right tools, {fmtGp(2)} each per workday, charged as the work is done.</span>
      </div>
      {capped && <p className="small warn-text">Only one assistant normally helps (2024 PHB). Allow more in Settings, or the extra workers add nothing.</p>}
      {p.kind === 'nonmagical' && (
        <div className="btn-row tight">
          <Select label="Fabricate" value={casterId} onChange={setCaster} options={fabricators.length ? fabricators.map((c) => ({ value: c.id, label: c.name })) : [{ value: '', label: 'Nobody knows Fabricate' }]} />
          <button className="small" disabled={!casterId} onClick={() => dispatch((st, cx) => E.fabricateProject(st, cx, p.id, casterId))}>
            Cast (level 4, 10 min)
          </button>
        </div>
      )}
      <Rule>
        2024 PHB: helpers divide the crafting time. Normally one assistant can help; the DM may allow more. {p.kind === 'nonmagical' && 'Fabricate finishes a nonmagical object from its raw materials in 10 minutes (Large or smaller, Medium for metal or stone); weapons, armor and other skilled work need the caster to be proficient with the artisan\'s tools.'}
      </Rule>
    </details>
  );
}

function ActivityResolver({ p }: { p: Project }) {
  const s = useGame();
  const id = activityOf(p.name)!;
  const checks = ACTIVITY_CHECKS[id];
  const [bonuses, setBonuses] = useState<number[]>(checks.map(() => 0));
  const [gp, setGp] = useState(id === 'Gambling' ? 50 : id === 'Research' ? 50 : 0);
  const [dc, setDc] = useState(10);
  const [circle, setCircle] = useState<'lower' | 'middle' | 'upper'>('lower');
  const who = E.charById(s, p.charIds[0]);
  return (
    <div className="decision">
      <b>{p.name}</b> is done{who ? ` for ${who.name}` : ''}. Roll its checks:
      <div className="form-row">
        {checks.map((c, i) => (
          <Num key={c} label={c} value={bonuses[i] ?? 0} onChange={(v) => setBonuses(bonuses.map((b, k) => (k === i ? v : b)))} width={3} />
        ))}
        {id === 'Gambling' && <Num label="Stake" value={gp} onChange={(v) => setGp(Math.max(10, Math.min(1000, v)))} min={10} max={1000} suffix="GP" width={5} />}
        {id === 'Research' && <Num label="Spent" value={gp} onChange={(v) => setGp(Math.max(50, v))} min={50} suffix="GP" width={5} />}
        {id === 'Crime' && <Select label="Target" value={String(dc)} onChange={(v) => setDc(Number(v))} options={CRIME_TARGETS.map((t) => ({ value: String(t.dc), label: t.label }))} />}
        {id === 'Carousing' && <Select label="Circle" value={circle} onChange={setCircle} options={(['lower', 'middle', 'upper'] as const).map((c) => ({ value: c, label: `${c[0].toUpperCase()}${c.slice(1)} class (${CAROUSING_COST[c]} GP)` }))} />}
      </div>
      <button className="small primary" onClick={() => dispatch((st, cx) => E.resolveActivityProject(st, cx, p.id, { bonuses, gp, dc, circle }))}>
        Roll the outcome
      </button>
      <Rule>Optional rule from Xanathar&apos;s Guide (2014): the 2024 books have no outcome tables for these. Contacts, favors and lore go into the character&apos;s notes. Each week has a 10% chance of a complication.</Rule>
    </div>
  );
}

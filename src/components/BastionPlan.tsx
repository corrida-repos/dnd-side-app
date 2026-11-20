import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { FACILITY_OPTIONS, GARDEN_PRODUCTS, GARDEN_TYPES, GUILDS, PUB_SPECIALS, RARITIES_CRAFTABLE, SHIPS, TRAINERS, facilityHirelings, type GardenType } from '../rules/bastionOrders';
import { GEAR_CATALOG } from '../rules/crafting';
import { Num, Pill, Select, Text, Toggle, Rule } from './common';
import type { Bastion, Facility, OrderPlan } from '../state/types';

/** Order option and its details for one special facility (2024 DMG). */
export function FacilityPlan({ b, f }: { b: Bastion; f: Facility }) {
  const s = useGame();
  const away = b.distanceMiles > 0;
  const opts = FACILITY_OPTIONS[f.name] ?? [];
  const owner = E.charById(s, b.ownerId);
  const plan: OrderPlan = (away ? (f.draftPlan ?? f.plan) : f.plan) ?? { option: opts[0]?.id ?? '' };
  const opt = opts.find((x) => x.id === plan.option) ?? opts[0];
  const setF = (patch: Partial<Facility>) =>
    edit((d) => {
      const t = d.bastions.find((x) => x.id === b.id)?.facilities.find((x) => x.id === f.id);
      if (t) Object.assign(t, patch);
    });
  const setPlan = (patch: Partial<OrderPlan>) => {
    const next = { ...plan, ...patch };
    const o = opts.find((x) => x.id === next.option);
    setF(away ? { draftPlan: next, draftOrder: o?.order } : { plan: next, order: o?.order ?? f.order });
  };
  const people = s.characters.filter((c) => c.kind !== 'mount' && E.alive(c));
  if (!opts.length) return null;
  const gardens = f.gardens?.length ? f.gardens : [{ type: 'Food', product: 'rations' }];
  const gardenCount = f.size === 'vast' ? 2 : 1;
  return (
    <div className="plan">
      <div className="form-row">
        <Select label={away ? 'Draft order' : 'Order'} value={opt.id} onChange={(v) => setPlan({ option: v })} options={opts.map((x) => ({ value: x.id, label: `${x.label}${x.minLevel && (owner?.level ?? 0) < x.minLevel ? ` (level ${x.minLevel}+)` : ''}` }))} />
        {opt.input === 'item' && (
          <>
            <Select
              label="Item"
              value={GEAR_CATALOG.find((g) => g.name === plan.text)?.name ?? ''}
              onChange={(v) => {
                const g = GEAR_CATALOG.find((x) => x.name === v);
                setPlan(g ? { text: g.name, gp: g.gp } : { text: '' });
              }}
              options={[{ value: '', label: 'Custom…' }, ...GEAR_CATALOG.map((g) => ({ value: g.name, label: `${g.name} (${g.gp} GP)` }))]}
            />
            <Text label="Name" value={plan.text ?? ''} onChange={(v) => setPlan({ text: v })} />
            <Num label="Price" value={plan.gp ?? 10} onChange={(v) => setPlan({ gp: Math.max(0, v) })} min={0} suffix="GP" width={5} />
          </>
        )}
        {opt.input === 'magic' && (
          <>
            <Text label="Magic item" value={plan.text ?? ''} onChange={(v) => setPlan({ text: v })} placeholder="e.g. Bag of Holding" />
            <Select label="Rarity" value={plan.rarity ?? 'Common'} onChange={(v) => setPlan({ rarity: v })} options={RARITIES_CRAFTABLE} />
          </>
        )}
        {opt.input === 'text' && <Text label={opt.inputLabel ?? 'Details'} value={plan.text ?? ''} onChange={(v) => setPlan({ text: v })} />}
        {opt.input === 'choice' && <Select label={opt.inputLabel ?? 'Choice'} value={plan.choice ?? opt.choices![0]} onChange={(v) => setPlan({ choice: v })} options={opt.choices!} />}
        {(opt.input === 'gp' || opt.input === 'number') && <Num label={opt.inputLabel ?? 'Amount'} value={plan.gp ?? 0} onChange={(v) => setPlan({ gp: Math.max(0, v) })} min={0} width={6} />}
      </div>
      {opt.input === 'people' && (
        <div className="small">
          {people.map((c) => {
            const p = (plan.people ?? []).find((x) => x.charId === c.id);
            const single = f.name === 'Sanctum';
            return (
              <div key={c.id} className="btn-row tight">
                <Toggle
                  checked={!!p}
                  onChange={(v) => setPlan({ people: single ? (v ? [{ charId: c.id, bonus: 0 }] : []) : v ? [...(plan.people ?? []), { charId: c.id, bonus: 0 }] : (plan.people ?? []).filter((x) => x.charId !== c.id) })}
                  label={c.name}
                />
                {p && f.name === 'Theater' && <Num label="Performance" value={p.bonus} onChange={(v) => setPlan({ people: (plan.people ?? []).map((x) => (x.charId === c.id ? { ...x, bonus: v } : x)) })} width={3} />}
              </div>
            );
          })}
        </div>
      )}
      {f.name === 'Garden' &&
        Array.from({ length: gardenCount }, (_, i) => {
          const g = gardens[i] ?? { type: 'Food', product: 'rations' };
          const prods = GARDEN_PRODUCTS[(g.type as GardenType) in GARDEN_PRODUCTS ? (g.type as GardenType) : 'Food'];
          const setG = (patch: Partial<{ type: string; product: string }>) => {
            const next = Array.from({ length: gardenCount }, (_, k) => gardens[k] ?? { type: 'Food', product: 'rations' });
            next[i] = { ...next[i], ...patch };
            if (patch.type) next[i].product = GARDEN_PRODUCTS[patch.type as GardenType][0].id;
            setF({ gardens: next });
          };
          return (
            <div key={i} className="form-row">
              <Select label={gardenCount > 1 ? `Garden ${i + 1}` : 'Garden type'} value={g.type} onChange={(v) => setG({ type: v })} options={[...GARDEN_TYPES]} />
              <Select label="Harvest" value={g.product} onChange={(v) => setG({ product: v })} options={prods.map((p) => ({ value: p.id, label: p.label }))} />
            </div>
          );
        })}
      {f.name === 'Guildhall' && (
        <div className="form-row">
          <Select label="Guild" value={f.guild ?? GUILDS[0]} onChange={(v) => setF({ guild: v })} options={GUILDS} />
          {f.guild === "Shipbuilders' Guild" && <span className="small muted">Name a ship in Details: {SHIPS.map((x) => `${x.name} ${x.gp.toLocaleString()} GP`).join(', ')}.</span>}
          {f.guild === "Masons' Guild" && <span className="small muted">Put the number of wall squares in Details (1 day each, free).</span>}
        </div>
      )}
      {f.name === 'Training Area' && <Select label="Trainer" value={f.trainer ?? TRAINERS[0].name} onChange={(v) => setF({ trainer: v })} options={TRAINERS.map((t) => t.name)} />}
      {f.name === 'Pub' && <Select label="On tap" value={f.pubSpecial ?? PUB_SPECIALS[0]} onChange={(v) => setF({ pubSpecial: v })} options={PUB_SPECIALS} />}
      <p className="small muted">
        {opt.note} {facilityHirelings(f.name, f.size)} hireling(s).
      </p>
    </div>
  );
}

/** Work under way, or why a facility is idle. */
export function FacilityStatus({ f }: { f: Facility }) {
  if ((f.shutTurns ?? 0) > 0) return <Pill tone="bad">Shut down next turn</Pill>;
  if (f.work) return <Pill tone="info" title={f.work.label}>{f.work.label} · {Math.max(0, f.work.daysLeft)} days left</Pill>;
  return null;
}

/** Defenders, guests, the army, choices to make and reports. */
export function BastionPeople({ b }: { b: Bastion }) {
  const s = useGame();
  const [send, setSend] = useState(1);
  const defenders = E.bastionDefenders(b);
  const room = E.barrackRoom(b);
  const stash = s.stashes.find((x) => x.id === `bastion-${b.id}`);
  return (
    <div className="bastion-people">
      <div className="btn-row tight">
        <Pill tone={defenders ? 'good' : 'warn'}>{defenders} Bastion Defender{defenders === 1 ? '' : 's'}</Pill>
        {room > 0 && <Pill tone="muted">Barracks {b.defenders ?? 0}/{room}</Pill>}
        {b.armoryStocked && <Pill tone="good">Armory stocked</Pill>}
        {(b.lieutenants ?? 0) > 0 && <Pill tone="info">{b.lieutenants} lieutenant(s)</Pill>}
        {b.army && (
          <Pill tone="info">
            Army: {b.army.guards} Guards{b.army.horses ? ' (mounted)' : ''} · {b.army.guards + b.army.horses} GP/day
          </Pill>
        )}
        {b.army && (
          <button className="small ghost" onClick={() => dispatch((st, cx) => E.disbandArmy(st, cx, b.id))}>
            Disband
          </button>
        )}
        {b.innerPeace && <Pill tone="good">Next event rolled twice</Pill>}
        {stash && stash.items.length > 0 && <Pill tone="muted">{stash.items.reduce((a, i) => a + i.qty, 0)} item(s) in the stores (Storage tab)</Pill>}
      </div>
      {(b.menagerie ?? []).length > 0 && <p className="small">Menagerie: {b.menagerie!.map((m) => `${m.name}${m.defends ? '' : ' (not defending)'}`).join(', ')}</p>}
      {(b.guests ?? []).length > 0 && (
        <ul className="plain small">
          {b.guests!.map((g) => (
            <li key={g.id}>
              {g.label}
              {g.untilDay != null && ` · leaves in ${Math.max(0, g.untilDay - s.dayIndex)} day(s)`}{' '}
              <button className="ghost tiny" onClick={() => dispatch((st, cx) => E.dismissGuest(st, cx, b.id, g.id))}>
                Send away
              </button>
            </li>
          ))}
        </ul>
      )}
      {b.decision && (
        <div className="decision">
          {b.decision.kind === 'bribe' && (
            <div className="btn-row tight">
              <b>Criminal hireling:</b>
              <button className="small" onClick={() => dispatch((st, cx) => E.resolveBastionDecision(st, cx, b.id, true))}>
                Pay {b.decision.gp} GP bribe
              </button>
              <button className="small ghost" onClick={() => dispatch((st, cx) => E.resolveBastionDecision(st, cx, b.id, false))}>
                Let them be arrested
              </button>
            </div>
          )}
          {b.decision.kind === 'opportunity' && (
            <div className="btn-row tight">
              <b>Extraordinary opportunity:</b>
              <button className="small" onClick={() => dispatch((st, cx) => E.resolveBastionDecision(st, cx, b.id, true))}>
                Pay 500 GP and seize it
              </button>
              <button className="small ghost" onClick={() => dispatch((st, cx) => E.resolveBastionDecision(st, cx, b.id, false))}>
                Decline
              </button>
            </div>
          )}
          {b.decision.kind === 'aid' && (
            <div className="btn-row tight">
              <b>Request for aid:</b>
              <Num value={send} onChange={(v) => setSend(Math.max(1, Math.min(defenders, Math.round(v))))} min={1} max={defenders} suffix="defenders" width={3} />
              <button className="small" disabled={!defenders} onClick={() => dispatch((st, cx) => E.resolveBastionDecision(st, cx, b.id, true, send))}>
                Send them
              </button>
              <button className="small ghost" onClick={() => dispatch((st, cx) => E.resolveBastionDecision(st, cx, b.id, false))}>
                Refuse
              </button>
            </div>
          )}
        </div>
      )}
      {(b.reports ?? []).length > 0 && (
        <details>
          <summary className="small">Reports ({b.reports!.length})</summary>
          <ul className="plain small">
            {b.reports!.slice(0, 12).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </details>
      )}
      <Rule>
        2024 DMG: work takes 7 days (crafting can take longer) and its results arrive on a later Bastion turn. Finished goods wait in the Bastion stores on the Storage tab. A Long Rest at the Bastion grants each facility&apos;s Charm (7 days or until used).
      </Rule>
    </div>
  );
}

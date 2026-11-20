import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import {
  BASIC_BUILD,
  BASIC_FACILITIES,
  BASTION_MIN_LEVEL,
  BASTION_TURN_DAYS,
  ENLARGE,
  ORDERS,
  SIZE_LABEL,
  SIZE_SQUARES,
  SPECIAL_FACILITIES,
  specialSlots,
  neglectLimit,
  type FacilitySize,
  type Order,
} from '../rules/bastion';
import { Card, Meter, Num, Pill, Select, Text, Toggle, Rule } from './common';
import type { Bastion, Facility } from '../state/types';
import { COMMS, commCost, commDelay, type CommMethod } from '../rules/comms';
import { formatDuration } from '../rules/calendar';
import { SpeedUp } from './SpeedUp';

const ORDER_HINT: Record<Order, string> = {
  Craft: 'What is being made, e.g. Longsword',
  Empower: 'Who or what benefits',
  Harvest: 'What is gathered',
  Maintain: 'Nothing special this turn',
  Recruit: 'Who is recruited',
  Research: 'What is being looked into',
  Trade: 'What is bought or sold',
};

export function BastionTab() {
  const s = useGame();
  return (
    <div className="grid wide">
      <FoundCard />
      {s.bastions.map((b) => (
        <BastionCard key={b.id} b={b} />
      ))}
      <Card title="Bastion rules at a glance">
        <ul className="plain small rules-list">
          <li>
            A character gets a Bastion at level {BASTION_MIN_LEVEL}. A <b>Bastion turn</b> passes every {BASTION_TURN_DAYS} days. On each turn, give every finished special facility an order. If
            all of them are told to Maintain, roll on the Bastion Events table.
          </li>
          <li>
            <b>Special facilities</b> come with character levels at no cost: 2 at level 5, 4 at level 9, 5 at level 13, and 6 at level 17. Each facility&apos;s level is the minimum to take it.
          </li>
          <li>
            <b>Basic facilities</b> must be built: Cramped 500 GP and 20 days, Roomy 1,000 GP and 45 days, Vast 3,000 GP and 125 days.
          </li>
          <li>
            <b>Enlarging</b> a facility: Cramped to Roomy costs 500 GP and 25 days. Roomy to Vast costs 2,000 GP and 80 days.
          </li>
          <li>Construction moves forward every in-game day, even while the party is away adventuring.</li>
        </ul>
      </Card>
    </div>
  );
}

function FoundCard() {
  const s = useGame();
  const eligible = s.characters.filter((c) => c.kind !== 'mount' && c.level >= BASTION_MIN_LEVEL && !s.bastions.some((b) => b.ownerId === c.id));
  const [owner, setOwner] = useState('');
  const [name, setName] = useState('');
  const chosen = eligible.find((c) => c.id === owner) ? owner : eligible[0]?.id ?? '';
  return (
    <Card title="Found a Bastion">
      {eligible.length === 0 ? (
        <p className="muted small">
          No character can found one yet. Characters get a Bastion at level {BASTION_MIN_LEVEL}, and each can have only one.
        </p>
      ) : (
        <>
          <div className="form-row">
            <Select label="Owner" value={chosen} onChange={setOwner} options={eligible.map((c) => ({ value: c.id, label: `${c.name} (level ${c.level})` }))} />
            <Text label="Name" value={name} onChange={setName} placeholder="e.g. Thornwatch Keep" />
          </div>
          <button className="primary" onClick={() => (dispatch((st, cx) => E.foundBastion(st, cx, chosen, name.trim())), setName(''))}>
            Found Bastion
          </button>
        </>
      )}
    </Card>
  );
}

function BastionCard({ b }: { b: Bastion }) {
  const s = useGame();
  const owner = E.charById(s, b.ownerId);
  const slots = specialSlots(owner?.level ?? 0);
  const specials = b.facilities.filter((f) => f.kind === 'special');
  const basics = b.facilities.filter((f) => f.kind === 'basic');
  const due = E.turnsDue(s, b);
  const building = b.facilities.filter((f) => f.building);
  return (
    <Card
      title={
        <span>
          {b.name} {due > 0 ? <Pill tone="warn">{due} turn{due > 1 ? 's' : ''} due</Pill> : <Pill tone="muted">Next turn in {E.daysToNextTurn(s, b)} d</Pill>}
        </span>
      }
      actions={
        <button className="ghost bad" onClick={() => confirm(`Delete ${b.name}?`) && edit((d) => void (d.bastions = d.bastions.filter((x) => x.id !== b.id)))}>
          Delete
        </button>
      }
    >
      <p className="small muted">
        Owner: {owner ? `${owner.name}, level ${owner.level}` : 'unknown'} · {b.turns} turn(s) resolved · {b.goldSpent.toLocaleString()} GP spent on construction
        {b.lastEvent && <> · Last turn: {b.lastEvent}</>}
      </p>
      {b.abandoned && <p className="bad-text small">Abandoned: the hirelings left after {b.neglectedTurns} turns without orders. Delete it and found a new Bastion when ready (it starts with two basic facilities).</p>}
      {!b.abandoned && (b.neglectedTurns ?? 0) > 0 && (
        <p className="warn-text small">
          {b.neglectedTurns} turn(s) in a row without orders. At {neglectLimit(owner?.level ?? 1)} (the owner&apos;s level) the hirelings abandon it (2024 DMG).
        </p>
      )}

      <h3>
        Special facilities{' '}
        <Pill tone={specials.length > slots ? 'bad' : 'muted'}>
          {specials.length}/{slots}
        </Pill>
      </h3>
      {specials.length === 0 && <p className="muted small">None yet.</p>}
      <ul className="plain">
        {specials.map((f) => (
          <FacilityRow key={f.id} b={b} f={f} />
        ))}
      </ul>
      <Toggle
        checked={b.distanceMiles > 0 ? (b.draftMaintain ?? b.maintain) : b.maintain}
        onChange={(v) =>
          edit((d) => {
            const t = d.bastions.find((x) => x.id === b.id)!;
            if (t.distanceMiles > 0) t.draftMaintain = v;
            else t.maintain = v;
          })
        }
        label={b.distanceMiles > 0 ? 'Draft: Maintain order for the whole Bastion' : 'Maintain order for the whole Bastion (no other orders; roll a Bastion event)'}
      />
      <RemoteCard b={b} />
      <div className="btn-row">
        <button className="primary" disabled={due < 1 || !!b.abandoned} onClick={() => dispatch((st, cx) => E.resolveBastionTurn(st, cx, b.id))}>
          Resolve Bastion turn
        </button>
        <span className="muted small">
          {due < 1 ? `The next turn comes in ${E.daysToNextTurn(s, b)} day(s). Advance time or use a downtime day.` : 'Set the orders above, then resolve.'}
        </span>
      </div>

      <h3>Basic facilities</h3>
      {basics.length === 0 && <p className="muted small">None yet.</p>}
      <ul className="plain">
        {basics.map((f) => (
          <FacilityRow key={f.id} b={b} f={f} />
        ))}
      </ul>

      {building.length > 0 && (
        <>
          <h3>Under construction</h3>
          <ul className="plain">
            {building.map((f) => (
              <li key={f.id} className="facility">
                <div className="armor-row">
                <span>
                  {f.building!.what} <span className="muted small">({f.building!.costGp.toLocaleString()} GP)</span>
                </span>
                <span className="small">
                  <Meter value={f.building!.totalDays - f.building!.daysLeft} max={f.building!.totalDays} tone="good" /> {Math.ceil(f.building!.daysLeft)} workday(s) left
                </span>
                </div>
                <SpeedUp target={{ kind: 'facility', bastionId: b.id, facilityId: f.id }} />
              </li>
            ))}
          </ul>
        </>
      )}

      <AddFacility b={b} ownerLevel={owner?.level ?? 0} slotsLeft={slots - specials.length} />
      <WallsRow b={b} />
    </Card>
  );
}

function WallsRow({ b }: { b: Bastion }) {
  const [squares, setSquares] = useState(8);
  return (
    <details className="add-facility">
      <summary>Build defensive walls</summary>
      <div className="btn-row tight">
        <Num value={squares} onChange={(v) => setSquares(Math.max(1, Math.round(v)))} min={1} suffix="5-ft squares" width={3} />
        <button className="small" onClick={() => dispatch((st, cx) => E.buildWalls(st, cx, b.id, squares))}>
          Build ({(squares * 250).toLocaleString()} GP, {squares * 10} days)
        </button>
      </div>
      <Rule>Walls are 20 feet high, and each 5-foot square takes 10 days and 250 GP. A Bastion fully enclosed by walls fares better when it&apos;s attacked.</Rule>
    </details>
  );
}

function FacilityRow({ b, f }: { b: Bastion; f: Facility }) {
  const away = b.distanceMiles > 0;
  const maintain = away ? (b.draftMaintain ?? b.maintain) : b.maintain;
  const order = away ? (f.draftOrder ?? f.order) : f.order;
  const note = away ? (f.draftNote ?? f.orderNote) : f.orderNote;
  const step = ENLARGE[f.size];
  const set = (patch: Partial<Facility>) =>
    edit((d) => {
      const t = d.bastions.find((x) => x.id === b.id)?.facilities.find((x) => x.id === f.id);
      if (t) Object.assign(t, patch);
    });
  return (
    <li className="facility">
      <div className="armor-row">
        <span>
          <b>{f.name}</b> <span className="muted small">
            {SIZE_LABEL[f.size]} ({SIZE_SQUARES[f.size]} squares)
          </span>{' '}
          {!f.built && <Pill tone="warn">Being built</Pill>}
        </span>
        <span className="btn-row tight">
          {step && !f.building && (
            <button className="ghost small" onClick={() => dispatch((st, cx) => E.enlargeFacility(st, cx, b.id, f.id))}>
              Enlarge to {SIZE_LABEL[step.to]} ({step.gp.toLocaleString()} GP, {step.days} d)
            </button>
          )}
          <button
            className="ghost small bad"
            aria-label={`Remove ${f.name}`}
            onClick={() => confirm(`Remove the ${f.name}?`) && edit((d) => void (d.bastions.find((x) => x.id === b.id)!.facilities = d.bastions.find((x) => x.id === b.id)!.facilities.filter((x) => x.id !== f.id)))}
          >
            ✕
          </button>
        </span>
      </div>
      {f.kind === 'special' && f.built && !maintain && (
        <div className="form-row">
          <Select label={away ? 'Draft order' : 'Order'} value={order === 'Maintain' ? (SPECIAL_FACILITIES.find((x) => x.name === f.name)?.order ?? 'Craft') : order} onChange={(v: Order) => set(away ? { draftOrder: v } : { order: v })} options={ORDERS.filter((o) => o !== 'Maintain')} />
          <Text label="Details" value={note} onChange={(v) => set(away ? { draftNote: v } : { orderNote: v })} placeholder={ORDER_HINT[order]} />
          {away && f.draftOrder && f.draftOrder !== f.order && <span className="small muted">In force: {f.order}</span>}
        </div>
      )}
    </li>
  );
}

const METHODS = Object.keys(COMMS) as CommMethod[];

function RemoteCard({ b }: { b: Bastion }) {
  const s = useGame();
  const [method, setMethod] = useState<CommMethod>('messenger');
  const [helper, setHelper] = useState('');
  const away = b.distanceMiles > 0;
  const info = COMMS[method];
  const delay = commDelay(method, b.distanceMiles);
  const cost = commCost(method, b.distanceMiles);
  const now = E.absNow(s);
  const messengers = s.hirelings.filter((h) => h.active && h.role === 'messenger');
  const casters = s.characters.filter((c) => info.needs && c.spells.some((x) => x.name.toLowerCase() === info.needs!.toLowerCase()));
  const helpers = info.needs === 'messenger' ? messengers.map((h) => ({ value: h.id, label: `${h.name}${h.busyUntil && h.busyUntil > now ? ` (back in ${formatDuration(h.busyUntil - now)})` : ''}` })) : casters.map((c) => ({ value: c.id, label: c.name }));
  const helperId = helpers.find((x) => x.value === helper)?.value ?? helpers[0]?.value ?? '';
  const moving = s.dispatches.filter((m) => m.bastionId === b.id && !m.delivered);
  const set = (patch: Partial<Bastion>) => edit((d) => void Object.assign(d.bastions.find((x) => x.id === b.id)!, patch));
  return (
    <div className="add-facility">
      <div className="btn-row tight">
        <Num label="Owner's distance" value={b.distanceMiles} onChange={(v) => set({ distanceMiles: Math.max(0, Math.round(v)) })} min={0} suffix="miles" width={4} />
        {away ? <Pill tone="warn">Away: orders must be sent</Pill> : <Pill tone="good">At the Bastion: orders given in person</Pill>}
        {away && b.ordersArrived && <Pill tone="good">New orders arrived</Pill>}
      </div>
      {away && (
        <>
          <div className="btn-row tight">
            <Select label="Send orders by" value={method} onChange={setMethod} options={METHODS.map((m) => ({ value: m, label: COMMS[m].label }))} />
            {info.needs && <Select label={info.needs === 'messenger' ? 'Messenger' : 'Caster'} value={helperId} onChange={setHelper} options={helpers.length ? helpers : [{ value: '', label: info.needs === 'messenger' ? 'Hire a messenger first' : `Nobody knows ${info.needs}` }]} />}
            <button className="primary small" disabled={delay == null || (!!info.needs && !helperId)} onClick={() => dispatch((st, cx) => E.sendBastionOrders(st, cx, b.id, method, helperId || null))}>
              Send drafted orders
            </button>
          </div>
          <p className="small muted">
            {delay == null ? `Out of range (${info.maxMiles} miles at most).` : `Arrives in ${delay === 0 ? 'an instant' : formatDuration(delay)}${cost ? `, costs ${cost} GP` : ''}.`} {info.note}
          </p>
          <Select label="Reports come back by" value={b.reportMethod} onChange={(v: CommMethod) => set({ reportMethod: v })} options={METHODS.filter((m) => !COMMS[m].needs || m === 'sending').map((m) => ({ value: m, label: COMMS[m].label }))} />
          {moving.length > 0 && (
            <ul className="plain small">
              {moving.map((m) => (
                <li key={m.id}>
                  {m.direction === 'orders' ? '→ Orders' : '← Report'} by {COMMS[m.method].label.toLowerCase()}: arrives in {formatDuration(Math.max(1, m.arrivesAt - now))}
                </li>
              ))}
            </ul>
          )}
          <Rule>DMG: if you can&apos;t give new orders, your hirelings carry out the Maintain order. Orders count for a turn only if they reach the Bastion before it starts; reports travel back the same way.</Rule>
        </>
      )}
    </div>
  );
}

function AddFacility({ b, ownerLevel, slotsLeft }: { b: Bastion; ownerLevel: number; slotsLeft: number }) {
  const [kind, setKind] = useState<'basic' | 'special'>('basic');
  const [basic, setBasic] = useState(BASIC_FACILITIES[0]);
  const [size, setSize] = useState<FacilitySize>('cramped');
  const [special, setSpecial] = useState('');
  const [already, setAlready] = useState(false);
  const allowed = SPECIAL_FACILITIES.filter((f) => f.level <= ownerLevel && !b.facilities.some((x) => x.name === f.name));
  const specialChoice = allowed.find((f) => f.name === special)?.name ?? allowed[0]?.name ?? '';
  const cost = BASIC_BUILD[size];
  const specialSizes = SPECIAL_FACILITIES.find((f) => f.name === specialChoice)?.sizes ?? ['roomy'];
  const [specialSizePick, setSpecialSize] = useState<FacilitySize | ''>('');
  const specialSize: FacilitySize = specialSizePick && specialSizes.includes(specialSizePick) ? specialSizePick : specialSizes[0];
  return (
    <details className="add-facility">
      <summary>Add a facility</summary>
      <div className="form-row">
        <Select
          label="Kind"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'basic', label: 'Basic facility' },
            { value: 'special', label: 'Special facility' },
          ]}
        />
        {kind === 'basic' ? (
          <>
            <Select label="Facility" value={basic} onChange={setBasic} options={BASIC_FACILITIES} />
            <Select label="Size" value={size} onChange={setSize} options={(['cramped', 'roomy', 'vast'] as FacilitySize[]).map((x) => ({ value: x, label: `${SIZE_LABEL[x]}: ${BASIC_BUILD[x].gp.toLocaleString()} GP, ${BASIC_BUILD[x].days} d` }))} />
          </>
        ) : (
          <>
            <Select label="Facility" value={specialChoice} onChange={setSpecial} options={allowed.map((f) => ({ value: f.name, label: `${f.name} (level ${f.level}, ${f.order})` }))} />
            {specialSizes.length > 1 && <Select label="Size" value={specialSize} onChange={(v) => setSpecialSize(v as FacilitySize)} options={specialSizes.map((x) => ({ value: x, label: SIZE_LABEL[x] }))} />}
          </>
        )}
      </div>
      {kind === 'basic' && <Toggle checked={already} onChange={setAlready} label="Already built (starting facility, no cost or time)" />}
      <p className="calc small">
        {kind === 'basic'
          ? already
            ? 'Added as already built.'
            : `${cost.gp.toLocaleString()} GP and ${cost.days} days of construction. It's ready on day ${cost.days}.`
          : slotsLeft > 0
            ? `Free: special facilities come with level. ${slotsLeft} slot(s) left.`
            : 'No special facility slots left at this level.'}
      </p>
      <button
        disabled={kind === 'special' && (!specialChoice || slotsLeft <= 0)}
        onClick={() =>
          dispatch((st, cx) =>
            E.addFacility(st, cx, b.id, kind === 'basic' ? { kind, name: basic, size, alreadyBuilt: already } : { kind, name: specialChoice, size: specialSize, alreadyBuilt: true }),
          )
        }
      >
        Add
      </button>
      {kind === 'special' && <Rule>Special facilities use their DMG size: Cramped for the Meditation Chamber and Reliquary, Vast for the largest ones, and a choice of Roomy or Vast where the DMG allows it.</Rule>}
    </details>
  );
}

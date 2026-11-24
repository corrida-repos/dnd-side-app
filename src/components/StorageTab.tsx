import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { transportMode, TRANSPORT_MODES, TRANSPORT_STATUSES, EBERRON_AIRSHIPS_URL, VEHICLES, VEHICLE_RULES_URL } from '../rules/containers';
import { goTo } from './nav';
import { DENOMS, fmtPurse, type Denom } from '../rules/coins';
import { fmtGp } from '../rules/money';
import { misjudged, valueUnknown } from '../rules/shop';
import { Card, Meter, Num, Pill, Select, Text, Rule } from './common';
import type { Character, Stash, TransportMode, TransportStatus } from '../state/types';
import { WaysAround } from './WaysAround';
import { HullBlock } from './LifeCards';

const modeOptions = (Object.keys(TRANSPORT_MODES) as TransportMode[]).map((value) => ({ value, label: TRANSPORT_MODES[value] }));
const statusOptions = (Object.keys(TRANSPORT_STATUSES) as TransportStatus[]).map((value) => ({ value, label: TRANSPORT_STATUSES[value] }));

export function StorageTab() {
  const s = useGame();
  const [filter, setFilter] = useState<'all' | 'storage' | TransportMode>('all');
  const mounts = s.characters.filter((c) => c.kind === 'mount' && E.alive(c));
  const stashes = s.stashes.filter((st) => filter === 'all' || (filter === 'storage' ? st.kind !== 'vehicle' : st.kind === 'vehicle' && transportMode(st) === filter));
  const visibleMounts = mounts.filter((mount) => filter === 'all' ||
    (filter === 'air' && mount.movement === 'fly') ||
    (filter === 'sea' && mount.movement === 'swim') ||
    (filter === 'land' && (mount.movement ?? 'land') === 'land'));
  return (
    <div className="grid wide">
      <NewStash />
      <Card title="Party transport and storage" className="span-2">
        <div className="form-row">
          <Select label="Show" value={filter} onChange={setFilter} options={[
            { value: 'all', label: 'Everything' }, ...modeOptions, { value: 'storage', label: 'Stashes and vaults' },
          ]} />
          <button className="small" onClick={() => goTo('money')}>Manage mounts and fares</button>
        </div>
        {visibleMounts.map((mount) => <MountStation key={`${mount.id}:${mount.mountStation ?? ''}`} mount={mount} />)}
        {!visibleMounts.length && !stashes.length && <p className="small muted">Nothing recorded for this view.</p>}
      </Card>
      {stashes.map((st) => <StashCard key={st.id} st={st} />)}
      {!s.stashes.length && <WaysAround topic="carrying" />}
    </div>
  );
}

function MountStation({ mount }: { mount: Character }) {
  const [station, setStation] = useState(mount.mountStation ?? '');
  return (
    <form className="form-row" onSubmit={(event) => {
      event.preventDefault();
      dispatch((st, cx) => E.stationMount(st, cx, mount.id, station));
    }}>
      <Text label={`${mount.name}'s station`} value={station} onChange={setStation} placeholder="e.g. Sharn stables" />
      <button type="submit" className="small" disabled={station.trim() === (mount.mountStation ?? '')}>Save station</button>
    </form>
  );
}

function NewStash() {
  const [kind, setKind] = useState<Stash['kind']>('vehicle');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [preset, setPreset] = useState('Wagon');
  const [mode, setMode] = useState<TransportMode>('land');
  const [cap, setCap] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const vehicle = kind === 'vehicle';
  const rules = VEHICLES.find((entry) => entry.name === preset);
  const capacity = cap ?? (vehicle ? rules?.capacityLb ?? 0 : 0);
  const mph = vehicle ? speed ?? rules?.speedMph ?? 0 : 0;
  return (
    <Card title="Add transport or storage">
      <form onSubmit={(event) => {
        event.preventDefault();
        const label = name.trim() || (vehicle ? preset || 'Custom transport' : kind === 'bank' ? 'Vault' : 'Stash');
        const details = vehicle ? { mode: rules?.mode ?? mode, status: 'ready' as const, preset: rules?.name } : undefined;
        dispatch((st, cx) => E.createStash(st, cx, label, kind, location.trim(), capacity || null, mph || undefined, details));
        setName('');
        setLocation('');
        setCap(null);
        setSpeed(null);
      }}>
        <div className="form-row">
          <Select label="Kind" value={kind} onChange={(value) => { setKind(value); setCap(null); }} options={[
            { value: 'vehicle', label: 'Transport' },
            { value: 'stash', label: 'Stash or hiding place' },
            { value: 'bank', label: 'Bank vault or rented room' },
          ]} />
          {vehicle && <Select label="Preset" value={preset} onChange={(value) => { setPreset(value); setCap(null); setSpeed(null); }} options={[
            ...VEHICLES.map((entry) => ({ value: entry.name, label: `${entry.name} · ${TRANSPORT_MODES[entry.mode]}` })),
            { value: '', label: 'Custom transport' },
          ]} />}
          {vehicle && !rules && <Select label="Mode" value={mode} onChange={setMode} options={modeOptions} />}
        </div>
        <div className="form-row">
          <Text label="Name" value={name} onChange={setName} placeholder={vehicle ? preset || 'e.g. Lightning rail pass' : 'e.g. Kundarak vault'} />
          <Text label={vehicle ? 'Stationed at' : 'Where'} value={location} onChange={setLocation} placeholder="e.g. Sharn, Lyrandar Tower" />
          <Num label="Cargo limit (lb, 0 = no limit)" value={capacity} onChange={(value) => setCap(Math.max(0, Math.round(value)))} min={0} width={7} />
          {vehicle && <Num label="Fixed speed (mph, 0 = none)" value={mph} onChange={(value) => setSpeed(Math.max(0, value))} min={0} step={0.5} width={5} />}
        </div>
        {vehicle && rules && <p className="small muted">{rules.note}. {rules.source === EBERRON_AIRSHIPS_URL && 'The helm normally requires the Mark of Storm. '}<a href={rules.source ?? VEHICLE_RULES_URL} target="_blank" rel="noreferrer">5etools rules</a></p>}
        <button type="submit" className="primary">Add {vehicle ? 'transport' : 'storage'}</button>
      </form>
    </Card>
  );
}

function VehicleEditor({ st, close }: { st: Stash; close: () => void }) {
  const [name, setName] = useState(st.name);
  const [location, setLocation] = useState(st.location);
  const [notes, setNotes] = useState(st.notes);
  const [capacity, setCapacity] = useState(st.capacityLb ?? 0);
  const [speed, setSpeed] = useState(st.speedMph ?? 0);
  const [mode, setMode] = useState(transportMode(st));
  const [status, setStatus] = useState(st.vehicle?.status ?? 'ready');
  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      dispatch((state, cx) => E.updateVehicle(state, cx, st.id, {
        name, location, notes, capacityLb: capacity || null, speedMph: speed || undefined,
        vehicle: { mode, status, preset: st.vehicle?.preset ?? VEHICLES.find((entry) => st.name.toLowerCase() === entry.name.toLowerCase())?.name },
      }));
      close();
    }}>
      <div className="form-row">
        <Text label="Name" value={name} onChange={setName} />
        <Text label="Stationed at" value={location} onChange={setLocation} />
        <Select label="Mode" value={mode} onChange={setMode} options={modeOptions} />
        <Select label="Availability" value={status} onChange={setStatus} options={statusOptions} />
        <Num label="Cargo limit (lb, 0 = no limit)" value={capacity} onChange={(value) => setCapacity(Math.max(0, Math.round(value)))} min={0} width={7} />
        <Num label="Fixed speed (mph, 0 = none)" value={speed} onChange={(value) => setSpeed(Math.max(0, value))} min={0} step={0.5} width={5} />
        <Text label="Access or crew notes" value={notes} onChange={setNotes} />
      </div>
      <div className="btn-row">
        <button type="submit" className="small primary" disabled={!name.trim()}>Save transport</button>
        <button type="button" className="small" onClick={close}>Cancel</button>
      </div>
    </form>
  );
}

function StashCard({ st }: { st: Stash }) {
  const s = useGame();
  const ref = `s:${st.id}`;
  const [editing, setEditing] = useState(false);
  const vehicle = st.kind === 'vehicle';
  const rules = vehicle ? VEHICLES.find((entry) => entry.name === st.vehicle?.preset) : undefined;
  const load = E.stashLoad(st, s.settings.coinWeight);
  const value = E.holderValue(st.items, st.purse);
  const pcs = s.characters.filter((c) => c.diedAt == null);
  const [who, setWho] = useState(pcs[0]?.id ?? '');
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState(1);
  const [denom, setDenom] = useState<Denom>('gp');
  const [coins, setCoins] = useState(10);
  const giver = s.characters.find((c) => c.id === who);
  const giveItem = giver?.inventory.find((i) => i.id === itemId) ?? giver?.inventory.filter((i) => !i.containerId)[0];
  return (
    <Card
      title={
        <span>
          {st.name} <Pill tone="muted">{vehicle ? TRANSPORT_MODES[transportMode(st)] : st.kind === 'bank' ? 'Vault' : 'Stash'}</Pill>
        </span>
      }
      actions={
        <>
        {vehicle && <button className="ghost" onClick={() => setEditing(!editing)}>{editing ? 'Close editor' : 'Edit transport'}</button>}
        <button className="ghost bad" onClick={() => confirm(`Delete ${st.name} and everything in it?`) && edit((d) => void (d.stashes = d.stashes.filter((x) => x.id !== st.id)))}>
          Delete
        </button>
        </>
      }
    >
      {vehicle && <p className="small">
        <Pill tone={st.vehicle?.status && st.vehicle.status !== 'ready' ? 'warn' : 'good'}>{TRANSPORT_STATUSES[st.vehicle?.status ?? 'ready']}</Pill>
        {' · '}{st.location || 'Station unspecified'}{st.speedMph ? ` · ${st.speedMph} mph` : ''}
        {rules && <>{' · '}<a href={rules.source ?? VEHICLE_RULES_URL} target="_blank" rel="noreferrer">{rules.name} rules</a></>}
      </p>}
      {rules?.source === EBERRON_AIRSHIPS_URL && <p className="small muted">{rules.note}. The helm normally requires the Mark of Storm.</p>}
      {vehicle && st.notes && <p className="small muted">{st.notes}</p>}
      {vehicle && editing && <VehicleEditor st={st} close={() => setEditing(false)} />}
      <p className="small muted">
        {!vehicle && `${st.location || 'Somewhere in the world'} · `}{load} lb{st.capacityLb ? ` of ${st.capacityLb.toLocaleString()} lb` : ''} · worth about {fmtGp(value)} · {fmtPurse(st.purse)}
      </p>
      <HullBlock st={st} />
      {st.capacityLb ? <Meter value={load} max={st.capacityLb} tone={load > st.capacityLb ? 'bad' : 'good'} /> : null}
      {st.items.length === 0 && <p className="muted small">Empty.</p>}
      <ul className="plain small">
        {st.items.map((i) => (
          <li key={i.id} className="armor-row">
            <span>
              {i.name} {i.qty > 1 && <span className="muted">×{i.qty}</span>} <span className="muted">{Math.round(i.weight * i.qty * 10) / 10} lb</span>
              {i.damaged && <Pill tone="bad">damaged</Pill>} {valueUnknown(i) ? <Pill tone="warn" title="Nobody in the party knows what it's worth yet.">value unknown</Pill> : misjudged(i) ? <span className="muted" title={`DM: misjudged. Really ${fmtGp(i.valueGp ?? 0)} each.`}> · {fmtGp(i.valueBelieved! * i.qty)}</span> : i.valueGp ? <span className="muted"> · {fmtGp(i.valueGp * i.qty)}</span> : null}
            </span>
            <span className="btn-row tight">
              <Select value={who} onChange={setWho} options={pcs.map((c) => ({ value: c.id, label: `to ${c.name}` }))} />
              <button className="small" onClick={() => dispatch((st2, cx) => E.moveItem(st2, cx, ref, `c:${who}`, i.id, i.qty))}>
                Take
              </button>
            </span>
          </li>
        ))}
      </ul>
      <h3>Put something in</h3>
      <div className="btn-row tight">
        <Select value={who} onChange={(x) => (setWho(x), setItemId(''))} options={pcs.map((c) => ({ value: c.id, label: `From ${c.name}` }))} />
        <Select value={giveItem?.id ?? ''} onChange={setItemId} options={(giver?.inventory ?? []).filter((i) => !i.containerId).map((i) => ({ value: i.id, label: `${i.name}${i.qty > 1 ? ` (${i.qty})` : ''}` }))} />
        <Num value={qty} onChange={(x) => setQty(Math.max(1, Math.round(x)))} min={1} width={3} />
        <button className="small" disabled={!giveItem} onClick={() => giveItem && dispatch((st2, cx) => E.moveItem(st2, cx, `c:${who}`, ref, giveItem.id, qty))}>
          Store
        </button>
      </div>
      <h3>Coins</h3>
      <div className="btn-row tight">
        <Num value={coins} onChange={(x) => setCoins(Math.max(1, Math.round(x)))} min={1} width={5} />
        <Select value={denom} onChange={setDenom} options={DENOMS.map((d) => ({ value: d, label: d }))} />
        <button className="small" onClick={() => dispatch((st2, cx) => E.moveCoins(st2, cx, `c:${who}`, ref, denom, coins))}>
          Deposit from {giver?.name ?? '…'}
        </button>
        <button className="small ghost" onClick={() => dispatch((st2, cx) => E.moveCoins(st2, cx, ref, `c:${who}`, denom, coins))}>
          Withdraw to {giver?.name ?? '…'}
        </button>
      </div>
      <Rule>
        Things in storage don&apos;t count toward anyone&apos;s load. Containers keep their contents when moved. Coins weigh 50 to the pound. 2024 PHB vehicles: an animal pulling a cart, wagon or sled moves up to five times its carrying capacity, vehicle included (add several animals together). Ships bigger than a keelboat need a crew of skilled hirelings, can sail up to 24 hours a day, and move at half speed into a strong wind; in a dead calm, sails are useless and the ship must be rowed. Repairing a ship takes 1 day and 20 GP per Hit Point, halved in a well-supplied shipyard.
      </Rule>
    </Card>
  );
}

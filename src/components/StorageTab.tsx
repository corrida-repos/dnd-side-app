import { useState } from 'react';
import { useGame, dispatch, edit } from '../state/store';
import * as E from '../state/engine';
import { VEHICLES } from '../rules/containers';
import { DENOMS, fmtPurse, type Denom } from '../rules/coins';
import { fmtGp } from '../rules/money';
import { misjudged, valueUnknown } from '../rules/shop';
import { Card, Meter, Num, Pill, Select, Text, Rule } from './common';
import type { Stash } from '../state/types';
import { WaysAround } from './WaysAround';

export function StorageTab() {
  const s = useGame();
  return (
    <div className="grid wide">
      <NewStash />
      {s.stashes.map((st) => (
        <StashCard key={st.id} st={st} />
      ))}
      {!s.stashes.length && (
        <Card title="Stashes, vaults and vehicles">
          <p className="muted">Nothing stored yet. Create a stash (a cache in the woods, a room at the inn), a bank vault, or a vehicle (a wagon, a ship) to keep things the characters aren&apos;t carrying.</p>
          <WaysAround topic={'carrying'} />
        </Card>
      )}
    </div>
  );
}

function NewStash() {
  const [kind, setKind] = useState<Stash['kind']>('stash');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [vehicle, setVehicle] = useState(VEHICLES[1].name);
  const [cap, setCap] = useState<number | null>(null);
  const v = VEHICLES.find((x) => x.name === vehicle)!;
  return (
    <Card title="New storage">
      <div className="form-row">
        <Select
          label="Kind"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'stash', label: 'Stash or hiding place' },
            { value: 'bank', label: 'Bank vault or rented room' },
            { value: 'vehicle', label: 'Vehicle' },
          ]}
        />
        {kind === 'vehicle' && <Select label="Vehicle" value={vehicle} onChange={(x) => (setVehicle(x), setCap(null))} options={VEHICLES.map((x) => ({ value: x.name, label: `${x.name} (${x.capacityLb.toLocaleString()} lb)` }))} />}
      </div>
      <div className="form-row">
        <Text label="Name" value={name} onChange={setName} placeholder={kind === 'vehicle' ? `e.g. The ${vehicle}` : kind === 'bank' ? 'e.g. Kundarak vault, Sharn' : 'e.g. Hollow oak cache'} />
        <Text label="Where" value={location} onChange={setLocation} placeholder="e.g. Sharn, Middle Dura" />
        <Num label="Capacity (lb, 0 = no limit)" value={cap ?? (kind === 'vehicle' ? v.capacityLb : 0)} onChange={(x) => setCap(Math.max(0, Math.round(x)))} min={0} width={7} />
      </div>
      {kind === 'vehicle' && (
        <p className="small muted">
          {v.note}.{v.speedMph ? ` Speed ${v.speedMph} mph: travel aboard it from the Travel card or a journey stage.` : ''}
        </p>
      )}
      <button
        className="primary"
        onClick={() => {
          const capacity = cap ?? (kind === 'vehicle' ? v.capacityLb : 0);
          dispatch((st, cx) => E.createStash(st, cx, name.trim() || (kind === 'vehicle' ? vehicle : kind === 'bank' ? 'Vault' : 'Stash'), kind, location.trim(), capacity > 0 ? capacity : null, kind === 'vehicle' ? v.speedMph : undefined));
          setName('');
          setLocation('');
          setCap(null);
        }}
      >
        Create
      </button>
    </Card>
  );
}

function StashCard({ st }: { st: Stash }) {
  const s = useGame();
  const ref = `s:${st.id}`;
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
          {st.name} <Pill tone="muted">{st.kind === 'vehicle' ? 'Vehicle' : st.kind === 'bank' ? 'Vault' : 'Stash'}</Pill>
        </span>
      }
      actions={
        <button className="ghost bad" onClick={() => confirm(`Delete ${st.name} and everything in it?`) && edit((d) => void (d.stashes = d.stashes.filter((x) => x.id !== st.id)))}>
          Delete
        </button>
      }
    >
      <p className="small muted">
        {st.location || 'Somewhere in the world'} · {load} lb{st.capacityLb ? ` of ${st.capacityLb.toLocaleString()} lb` : ''} · worth about {fmtGp(value)} · {fmtPurse(st.purse)}
      </p>
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

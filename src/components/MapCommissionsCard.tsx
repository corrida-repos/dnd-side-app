import { useState } from 'react';
import { COPY_MAP_DC, COPY_MAP_MINUTES } from '../rules/chorePayoffs';
import { signed } from '../rules/dice';
import { carriesTool, PAPER, toolCheck, toolReadiness } from '../rules/gear';
import { CARTOGRAPHER_TOOL, MAP_COMMISSION_GP, commissionRoutes, commissionSource, type MapCommission } from '../rules/mapCommissions';
import { fmtGp } from '../rules/money';
import { samePlace } from '../rules/notoriety';
import { mapName } from '../rules/tools';
import * as E from '../state/engine';
import { dispatch, useGame } from '../state/store';
import { Card, Num, Pill, Rule, Select } from './common';

export function MapCommissionsCard({ offers = false }: { offers?: boolean }) {
  const s = useGame();
  const [route, setRoute] = useState('');
  const town = E.currentTown(s);
  const mapmaker = town?.buildings.find((b) => b.type === 'mapmaker');
  const open = E.townProviders(s, ['mapmaker']).length > 0;
  const routes = offers && town && mapmaker ? commissionRoutes(s, town.name) : [];
  const wanted = routes.includes(route) ? route : routes[0];
  const orders = s.mapCommissions.filter((order) => !order.delivered || (offers && town && samePlace(town.name, order.town)));
  if (!s.settings.mapCommissionWork || (!orders.length && !(offers && mapmaker))) return null;

  return (
    <Card title="Map commissions">
      {offers && mapmaker && (
        wanted ? <div className="form-row">
          <Select label={`Route requested in ${town?.name}`} value={wanted} onChange={setRoute}
            options={routes.map((r) => ({ value: r, label: `${r} · ${fmtGp(MAP_COMMISSION_GP)}` }))} />
          <button className="small" disabled={!open || !!s.tacticalEncounter}
            onClick={() => dispatch((st, cx) => E.acceptMapCommission(st, cx, wanted))}>Accept commission</button>
          {!open && <span className="small muted">The mapmaker is closed.</span>}
        </div> : <p className="small muted">Plan a journey stage or bring a regional map to find a commission.</p>
      )}
      {orders.length > 0 && <ul className="plain">{orders.map((order) => <CommissionRow key={order.id} order={order} />)}</ul>}
      <Rule>Table rule: a mapmaker pays {fmtGp(MAP_COMMISSION_GP)} once per route in their settlement. Bring an accurate original, then spend one sheet and {COPY_MAP_MINUTES} minutes for a DC {COPY_MAP_DC} Intelligence check with Cartographer&apos;s Tools. The party keeps its original.</Rule>
    </Card>
  );
}

function CommissionRow({ order }: { order: MapCommission }) {
  const s = useGame();
  const [artistId, setArtistId] = useState('');
  const [bonus, setBonus] = useState<number | null>(null);
  const artists = s.characters.filter(E.canWorkOnProject).sort((a, b) => toolReadiness(b, CARTOGRAPHER_TOOL) - toolReadiness(a, CARTOGRAPHER_TOOL));
  const artist = artists.find((c) => c.id === artistId) ?? artists[0];
  const check = artist && toolCheck(artist, CARTOGRAPHER_TOOL, 'int');
  const equipped = !!artist && carriesTool(artist, CARTOGRAPHER_TOOL);
  const hasPaper = artist?.inventory.some((item) => item.qty > 0 && PAPER.test(item.name.trim()));
  const source = commissionSource(s, order.route);
  const local = s.place.settlement && samePlace(s.place.name, order.town);
  const open = local && E.townProviders(s, ['mapmaker']).length > 0;
  const modifier = bonus ?? check?.bonus;
  return (
    <li className="facility">
      <b>{mapName(order.route)}</b> <span className="small muted">· {order.town} · {fmtGp(MAP_COMMISSION_GP)}</span>{' '}
      <Pill tone={order.delivered || source ? 'good' : 'info'}>{order.delivered ? 'Delivered' : source ? 'Original carried' : 'Needs original'}</Pill>
      {!order.delivered && (
        !source ? <p className="small muted">Chart the route or acquire an accurate map of it.</p>
        : !local ? <p className="small muted">Return to {order.town} to deliver the copy.</p>
        : !open ? <p className="small muted">An open mapmaker is needed in {order.town}.</p>
        : artist && <>
          <div className="form-row">
            <Select label="Cartographer" value={artist.id} onChange={(v) => { setArtistId(v); setBonus(null); }}
              options={artists.map((c) => {
                const sheet = toolCheck(c, CARTOGRAPHER_TOOL, 'int');
                return { value: c.id, label: `${c.name} · ${sheet.proficient ? 'proficient with Cartographer’s Tools' : 'proficiency needed'} · ${carriesTool(c, CARTOGRAPHER_TOOL) ? 'tools carried' : 'needs tools'}${sheet.bonus == null ? '' : ` · ${signed(sheet.bonus)}`}` };
              })} />
            <Num label="Intelligence check bonus" value={modifier ?? 0} onChange={(v) => setBonus(Math.round(v))} width={3} />
            <button className="small primary" disabled={!check?.proficient || !equipped || !hasPaper || modifier == null || !!s.tacticalEncounter}
              onClick={() => dispatch((st, cx) => E.deliverMapCommission(st, cx, order.id, artist.id, modifier ?? 0))}>Copy and deliver (1 h)</button>
          </div>
          {!hasPaper && <p className="small muted">{artist.name} needs one sheet of Paper or Parchment.</p>}
          {modifier == null && <p className="small muted">Enter the cartographer&apos;s bonus from their character sheet.</p>}
        </>
      )}
    </li>
  );
}

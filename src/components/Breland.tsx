import { formatClock, formatDuration } from '../rules/calendar';
import { BRELAND, BRELAND_ROUTES, nextDeparture } from '../rules/eberron';
import { fmtGp } from '../rules/money';
import * as E from '../state/engine';
import { dispatch, useGame } from '../state/store';
import { Card } from './common';
import { goTo } from './nav';

export function BrelandCard() {
  const s = useGame();
  const locality = E.brelishLocality(s);
  if (!locality) return null;
  const profile = BRELAND[locality];
  const routes = BRELAND_ROUTES.filter((route) => route.from === locality);
  const now = E.absNow(s);
  const ticket = s.passage;
  const booked = BRELAND_ROUTES.find((route) => route.id === ticket?.routeId);
  const canBook = s.characters.some((c) => c.kind !== 'mount' && E.alive(c));
  const when = (departure: number) => `${formatClock(departure % E.MIN_PER_DAY)}${departure >= (s.dayIndex + 1) * E.MIN_PER_DAY ? ' tomorrow' : ''}`;
  return (
    <Card title={profile.name} className="span-2">
      <p className="small muted">{profile.district} · {profile.authority}</p>
      <div className="btn-row">
        <button className="small" onClick={() => goTo('money')}>Ward directory</button>
        <button className="small" onClick={() => goTo('world')}>Letters and news</button>
      </div>
      <h3>Departures</h3>
      {ticket && booked && (
        <div className="decision">
          <b>{booked.label} to {BRELAND[booked.to].name}</b>
          <p className="small">{ticket.passengerIds.length} booked at {when(ticket.departure)}{now > ticket.departure ? ' · departed' : ''}</p>
          <div className="btn-row">
            <button className="small primary" disabled={!E.canRideBrelishRoute(s)} onClick={() => dispatch(E.rideBrelishRoute)}>
              {ticket.departure > now ? 'Wait and board' : 'Board now'}
            </button>
            <button className="small ghost" onClick={() => dispatch(E.cancelBrelishRoute)}>Give up tickets</button>
          </div>
        </div>
      )}
      <ul className="plain">
        {routes.map((route) => (
          <li className="armor-row" key={route.id}>
            <span>
              <b>{BRELAND[route.to].name}</b>{' '}
              <span className="muted small">{route.label} · {when(nextDeparture(route, now))} · {formatDuration(route.travelMinutes)} · {fmtGp(route.fareGp)} per passenger</span>
            </span>
            <button className="small" disabled={!canBook || !!ticket || (route.label === 'Orien lightning rail' && !E.localServiceAvailable(s, ['coaching']))} onClick={() => dispatch((st, ctx) => E.bookBrelishRoute(st, ctx, route.id))}>Book passage</button>
          </li>
        ))}
      </ul>
      {!canBook && <button className="small" onClick={() => goTo('party')}>Add travelers</button>}
    </Card>
  );
}

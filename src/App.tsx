import { useEffect, useState } from 'react';
import { useGame } from './state/store';
import * as E from './state/engine';
import { formatClock, formatDate, lightAt } from './rules/calendar';
import { weatherSummary } from './rules/weather';
import { Overview } from './components/Overview';
import { PartyTab } from './components/PartyTab';
import { CampTab } from './components/CampTab';
import { MorningTab } from './components/MorningTab';
import { DowntimeTab } from './components/DowntimeTab';
import { BastionTab } from './components/BastionTab';
import { LogTab } from './components/LogTab';
import { SettingsTab } from './components/SettingsTab';

const TABS = [
  { id: 'overview', label: 'Overview', el: Overview },
  { id: 'party', label: 'Party', el: PartyTab },
  { id: 'camp', label: 'Camp & Survival', el: CampTab },
  { id: 'morning', label: 'Morning & Spells', el: MorningTab },
  { id: 'downtime', label: 'Downtime', el: DowntimeTab },
  { id: 'bastions', label: 'Bastions', el: BastionTab },
  { id: 'log', label: 'Chronicle', el: LogTab },
  { id: 'settings', label: 'Settings', el: SettingsTab },
] as const;

type TabId = (typeof TABS)[number]['id'];

function readTab(): TabId {
  try {
    const t = localStorage.getItem('wayfarers-ledger:tab');
    if (t && TABS.some((x) => x.id === t)) return t as TabId;
  } catch {
    /* ignore */
  }
  return 'overview';
}

export function App() {
  const s = useGame();
  const [tab, setTab] = useState<TabId>(readTab);
  useEffect(() => {
    try {
      localStorage.setItem('wayfarers-ledger:tab', tab);
    } catch {
      /* ignore */
    }
  }, [tab]);
  const t = E.tempNow(s);
  const light = lightAt(s.minutes, E.seasonOf(s));
  const Active = TABS.find((x) => x.id === tab)!.el;
  const pending = s.pending.length;
  const danger = s.characters.filter((c) => c.exhaustion >= 3).length;
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">🔥</span>
          <span>
            <b>Wayfarer&apos;s Ledger</b>
            <small>{s.place.name}</small>
          </span>
        </div>
        <div className="status">
          <span className="status-item">
            <b>{formatClock(s.minutes)}</b> {light.phase}
          </span>
          <span className="status-item">{formatDate(s.calendar, s.startYear, s.dayIndex)}</span>
          <span className={`status-item ${t <= 0 ? 'cold' : t >= 100 ? 'hot' : ''}`}>
            <b>{t}°F</b> {weatherSummary(s.weather, t)}
          </span>
          {s.fire.lit && <span className="status-item good-text">🔥 {s.fire.fuelHours} h</span>}
          {danger > 0 && <span className="status-item bad-text">⚠ {danger} badly exhausted</span>}
        </div>
      </header>
      <nav className="tabs" role="tablist">
        {TABS.map((x) => (
          <button key={x.id} role="tab" aria-selected={tab === x.id} className={tab === x.id ? 'active' : ''} onClick={() => setTab(x.id)}>
            {x.label}
            {x.id === 'overview' && pending > 0 && <span className="badge">{pending}</span>}
          </button>
        ))}
      </nav>
      <main>
        <Active />
      </main>
      <footer className="foot muted small">
        Rules follow the 2024 Player&apos;s Handbook and Dungeon Master&apos;s Guide. Includes material from the System Reference Document 5.2 by Wizards of the Coast LLC, under the{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>{' '}
        license. Not affiliated with Wizards of the Coast or 5etools.
      </footer>
    </div>
  );
}

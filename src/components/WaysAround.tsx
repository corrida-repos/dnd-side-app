import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../state/store';
import {
  isReady,
  matchText,
  rankWays,
  searchWays,
  spellFact,
  TOPIC_BY_ID,
  TOPIC_GROUPS,
  TOPICS,
  WAY_SECTIONS,
  wayKey,
  wayLabel,
  type PartyMatch,
  type Topic,
  type TopicId,
  type Way,
  type WayKind,
} from '../rules/shortcuts';
import type { Character } from '../state/types';
import { Card, Pill, Toggle } from './common';
import { goTo, takePendingTopic } from './nav';

const KIND_ICON: Record<WayKind, string> = {
  spell: '✨',
  class: '⚔',
  subclass: '⚔',
  feat: '★',
  species: '🧬',
  invocation: '👁',
  gear: '🎒',
  'magic-item': '💎',
  bastion: '🏰',
};

/** Where each mechanic lives in the app, so the reference can send you there. */
export const TOPIC_PLACES: Record<TopicId, { tab: string; tabLabel: string; card: string }> = {
  food: { tab: 'camp', tabLabel: 'Camp & Survival', card: 'Camp stores' },
  water: { tab: 'camp', tabLabel: 'Camp & Survival', card: 'Camp stores' },
  foraging: { tab: 'camp', tabLabel: 'Camp & Survival', card: 'Foraging' },
  hunting: { tab: 'camp', tabLabel: 'Camp & Survival', card: 'Hunting and butchering' },
  taming: { tab: 'camp', tabLabel: 'Camp & Survival', card: 'Taming a wild creature' },
  tainted: { tab: 'camp', tabLabel: 'Camp & Survival', card: 'Raw food and dirty water' },
  poisonHarvest: { tab: 'camp', tabLabel: 'Camp & Survival', card: 'Harvesting poison' },
  disease: { tab: 'effects', tabLabel: 'Effects & Lights', card: 'Diseases' },
  poison: { tab: 'effects', tabLabel: 'Effects & Lights', card: 'Poisons' },
  shopping: { tab: 'money', tabLabel: 'Money & Mounts', card: 'Shop and loot' },
  cold: { tab: 'overview', tabLabel: 'Overview', card: 'Conditions right now' },
  heat: { tab: 'overview', tabLabel: 'Overview', card: 'Conditions right now' },
  weather: { tab: 'overview', tabLabel: 'Overview', card: 'Conditions right now' },
  altitude: { tab: 'overview', tabLabel: 'Overview', card: 'Conditions right now' },
  breath: { tab: 'effects', tabLabel: 'Effects & Lights', card: 'Holding breath and frigid water' },
  hazards: { tab: 'effects', tabLabel: 'Effects & Lights', card: 'Hazards' },
  shortRest: { tab: 'overview', tabLabel: 'Overview', card: 'Time' },
  longRest: { tab: 'overview', tabLabel: 'Overview', card: 'Time' },
  timekeeping: { tab: 'overview', tabLabel: 'Overview', card: 'Time' },
  watch: { tab: 'camp', tabLabel: 'Camp & Survival', card: 'Night watch' },
  exhaustion: { tab: 'overview', tabLabel: 'Overview', card: 'Party status' },
  saves: { tab: 'overview', tabLabel: 'Overview', card: 'Party status' },
  dying: { tab: 'overview', tabLabel: 'Overview', card: 'Party status' },
  fear: { tab: 'overview', tabLabel: 'Overview', card: 'Party status' },
  death: { tab: 'world', tabLabel: 'World', card: 'Death and resurrection' },
  march: { tab: 'overview', tabLabel: 'Overview', card: 'Travel' },
  lost: { tab: 'overview', tabLabel: 'Overview', card: 'Travel' },
  tracking: { tab: 'overview', tabLabel: 'Overview', card: 'Journey' },
  encounters: { tab: 'encounters', tabLabel: 'Encounters', card: 'Location danger' },
  exploration: { tab: 'effects', tabLabel: 'Effects & Lights', card: 'Exploration turns' },
  mounts: { tab: 'money', tabLabel: 'Money & Mounts', card: 'Mounts and animals' },
  fire: { tab: 'camp', tabLabel: 'Camp & Survival', card: 'Campfire' },
  light: { tab: 'effects', tabLabel: 'Effects & Lights', card: 'Active effects and lights' },
  concentration: { tab: 'effects', tabLabel: 'Effects & Lights', card: 'Active effects and lights' },
  armor: { tab: 'camp', tabLabel: 'Camp & Survival', card: 'Armor' },
  carrying: { tab: 'storage', tabLabel: 'Storage', card: 'Stashes, vaults and vehicles' },
  ammo: { tab: 'gear', tabLabel: 'Gear & Resources', card: 'top of the tab' },
  identify: { tab: 'gear', tabLabel: 'Gear & Resources', card: 'top of the tab' },
  attunement: { tab: 'gear', tabLabel: 'Gear & Resources', card: 'top of the tab' },
  rituals: { tab: 'morning', tabLabel: 'Morning & Spells', card: 'top of the tab' },
  divination: { tab: 'world', tabLabel: 'World', card: 'Divination limits' },
  dailyCasting: { tab: 'world', tabLabel: 'World', card: 'Spells cast every day' },
  lifestyle: { tab: 'money', tabLabel: 'Money & Mounts', card: 'Gold and lifestyle' },
  hirelings: { tab: 'money', tabLabel: 'Money & Mounts', card: 'Hirelings' },
  services: { tab: 'money', tabLabel: 'Money & Mounts', card: 'Services' },
  crafting: { tab: 'downtime', tabLabel: 'Downtime', card: 'New downtime project' },
  spellbook: { tab: 'downtime', tabLabel: 'Downtime', card: 'New downtime project' },
  downtime: { tab: 'downtime', tabLabel: 'Downtime', card: 'New downtime project' },
  building: { tab: 'downtime', tabLabel: 'Downtime', card: 'Running a business' },
  messages: { tab: 'bastions', tabLabel: 'Bastions', card: 'Running a Bastion from afar' },
  injuries: { tab: 'effects', tabLabel: 'Effects & Lights', card: 'Lingering injuries' },
  madness: { tab: 'effects', tabLabel: 'Effects & Lights', card: 'Madness' },
  wanted: { tab: 'world', tabLabel: 'World', card: 'Wanted by the law' },
  wear: { tab: 'gear', tabLabel: 'Gear & Resources', card: 'Damaged gear' },
  bastionEvents: { tab: 'bastions', tabLabel: 'Bastions', card: 'Bastion rules at a glance' },
};

function MatchPills({ matches }: { matches: PartyMatch[] }) {
  if (!matches.length) return null;
  return (
    <span className="way-party">
      {matches.map((m) => (
        <Pill key={m.charId} tone={isReady(m) ? 'good' : m.status === 'maybe' || m.status === 'list' ? 'muted' : 'info'}>
          {m.name}: {matchText(m)}
        </Pill>
      ))}
    </span>
  );
}

export function WayRow({ way, matches, topicTitle }: { way: Way; matches: PartyMatch[]; topicTitle?: string }) {
  const fact = way.kind === 'spell' ? spellFact(way.name) : undefined;
  const meta = [wayLabel(way)];
  if (fact) {
    meta.push(fact.classes.join(', '));
    meta.push(fact.castTime);
    if (fact.duration !== 'Instantaneous') meta.push(fact.duration);
  }
  if (way.source && way.kind !== 'gear') meta.push(way.source);
  return (
    <li className={`way ${matches.some(isReady) ? 'way-ready' : ''}`}>
      <div className="way-head">
        <span aria-hidden>{KIND_ICON[way.kind]}</span> <b>{way.name}</b> <span className="muted small">{meta.join(' · ')}</span>
        {fact?.cost && <Pill tone="warn">{fact.cost}</Pill>}
        {topicTitle && <Pill tone="muted">{topicTitle}</Pill>}
      </div>
      <div className="way-how">{way.how}</div>
      {way.catches && way.catches.length > 0 && (
        <ul className="way-catches small">
          {way.catches.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
      {way.ruling && (
        <div className="way-ruling small">
          <div>
            <b>⚖ Rules as written:</b> {way.ruling.raw}
          </div>
          {way.ruling.table && (
            <div className="muted">
              <b>Common table ruling:</b> {way.ruling.table}
            </div>
          )}
        </div>
      )}
      <MatchPills matches={matches} />
    </li>
  );
}

/** One topic's options: what the party can do now first, then the rest sorted into sections. */
function TopicBody({ topic, chars, partyOnly = false }: { topic: Topic; chars: Character[]; partyOnly?: boolean }) {
  const rows = rankWays(topic.ways, chars);
  const ready = rows.filter((r) => r.matches.some(isReady));
  const rest = rows.filter((r) => !r.matches.some(isReady));
  return (
    <>
      <p className="muted small ways-problem">{topic.problem}</p>
      {ready.length > 0 && (
        <section className="ways-section ways-now">
          <h4>✔ Your party can do this now</h4>
          <ul className="ways-list">
            {ready.map((r) => (
              <WayRow key={wayKey(r.way)} way={r.way} matches={r.matches} />
            ))}
          </ul>
        </section>
      )}
      {!partyOnly &&
        WAY_SECTIONS.map((sec) => {
          const list = rest.filter((r) => sec.kinds.includes(r.way.kind));
          if (!list.length) return null;
          return (
            <section key={sec.title} className="ways-section">
              <h4>
                {sec.title} <span className="muted">({list.length})</span>
              </h4>
              <ul className="ways-list">
                {list.map((r) => (
                  <WayRow key={wayKey(r.way)} way={r.way} matches={r.matches} />
                ))}
              </ul>
            </section>
          );
        })}
      {partyOnly && !ready.length && <p className="muted small">Nobody in the party has one of these ready right now.</p>}
    </>
  );
}

const readyCount = (topic: Topic, chars: Character[]): number => rankWays(topic.ways, chars).filter((r) => r.matches.some(isReady)).length;

/**
 * A collapsible "Ways around this" panel inside the card for a mechanic. With several topics, chips switch between them;
 * the first topic is shown first, so cards can put the most relevant one first.
 */
export function WaysAround({ topic, open }: { topic: TopicId | TopicId[]; open?: boolean }) {
  const s = useGame();
  const ids = Array.isArray(topic) ? topic : [topic];
  const [picked, setPicked] = useState<TopicId | null>(null);
  const current = picked && ids.includes(picked) ? picked : ids[0];
  const topics = ids.map((id) => TOPIC_BY_ID[id]);
  const total = topics.reduce((n, t) => n + t.ways.length, 0);
  const ready = useMemo(() => topics.reduce((n, t) => n + readyCount(t, s.characters), 0), [ids.join(','), s.characters]);
  return (
    <details className="ways" open={open}>
      <summary>
        🗝 Ways around this <span className="muted">· {total} options</span>
        {ready > 0 && <span className="good-text"> · {ready} the party can use now</span>}
      </summary>
      {ids.length > 1 && (
        <div className="chips ways-chips" role="tablist">
          {topics.map((t) => (
            <button key={t.id} role="tab" aria-selected={t.id === current} className={`chip ${t.id === current ? 'active' : ''}`} onClick={() => setPicked(t.id)}>
              {t.title}
            </button>
          ))}
        </div>
      )}
      <TopicBody topic={TOPIC_BY_ID[current]} chars={s.characters} />
      <button className="ghost small ways-more" onClick={() => goTo('ways', current)}>
        Open in the Ways Around reference →
      </button>
    </details>
  );
}

/** The full reference: every challenge, wait and cost, grouped, with what gets around it. */
export function WaysTab() {
  const s = useGame();
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState<TopicId | 'all'>(() => (takePendingTopic() as TopicId | null) ?? 'all');
  const [partyOnly, setPartyOnly] = useState(false);
  const searching = q.trim().length > 0;
  const hits = useMemo(() => searchWays(q), [q]);
  const pcs = s.characters.filter((c) => c.kind === 'pc');
  useEffect(() => {
    if (topic !== 'all') document.getElementById(`ways-${topic}`)?.scrollIntoView({ block: 'start' });
  }, []);
  const groups = TOPIC_GROUPS.map((g) => ({ ...g, topics: g.topics.filter((id) => topic === 'all' || id === topic) })).filter((g) => g.topics.length);
  return (
    <div className="stack">
      <Card title="Ways around it">
        <p className="small">
          Every mechanic in the tracker that challenges the party, makes them wait or costs them something, with the 2024 spells, class features, feats, species traits, Eldritch Invocations, items and
          Bastion facilities that shortcut or avoid it. ⚠ marks fine print; ⚖ settles questions tables argue about, giving the rules-as-written answer and, where many tables differ, the common table
          ruling.
        </p>
        <p className="small muted">
          Party matches use each character&apos;s spells, class, level, species, subclass, feats and invocations (set them on the Party tab or import from D&amp;D Beyond), plus the items they carry.
          {pcs.some((c) => !c.species && !c.subclass && !c.feats.length) && ' Some characters have no species, subclass or feats filled in yet, so those options show as “might have it”.'}
        </p>
        <div className="btn-row">
          <label className="field grow">
            <span className="field-label">Search</span>
            <input type="search" value={q} placeholder="e.g. Goodberry, cold, ritual, Ranger" onChange={(e) => setQ(e.target.value)} className="wide" />
          </label>
          <label className="field">
            <span className="field-label">Mechanic</span>
            <select value={topic} onChange={(e) => setTopic(e.target.value as TopicId | 'all')} disabled={searching}>
              <option value="all">All mechanics ({TOPICS.length})</option>
              {TOPIC_GROUPS.map((g) => (
                <optgroup key={g.title} label={g.title}>
                  {g.topics.map((id) => (
                    <option key={id} value={id}>
                      {TOPIC_BY_ID[id].title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <Toggle checked={partyOnly} onChange={setPartyOnly} label="Only what the party can use now" title={pcs.length ? undefined : 'Add characters on the Party tab first'} />
        </div>
        {!searching && topic === 'all' && (
          <nav className="ways-index small" aria-label="Jump to a mechanic">
            {TOPIC_GROUPS.map((g) => (
              <div key={g.title}>
                <b>{g.title}:</b>{' '}
                {g.topics.map((id, i) => (
                  <span key={id}>
                    {i > 0 && ' · '}
                    <a href={`#ways-${id}`} onClick={(e) => (e.preventDefault(), document.getElementById(`ways-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))}>
                      {TOPIC_BY_ID[id].title}
                    </a>
                  </span>
                ))}
              </div>
            ))}
          </nav>
        )}
        {topic !== 'all' && !searching && (
          <button className="ghost small" onClick={() => setTopic('all')}>
            ← Show all mechanics
          </button>
        )}
      </Card>
      {searching ? (
        <Card title={`Search results (${hits.length})`}>
          <ul className="ways-list">
            {hits.map(({ topic: t, way }) => {
              const matches = rankWays([way], s.characters)[0].matches;
              if (partyOnly && !matches.some(isReady)) return null;
              return <WayRow key={`${t.id}:${wayKey(way)}`} way={way} matches={matches} topicTitle={t.title} />;
            })}
          </ul>
          {hits.length === 0 && <p className="muted small">Nothing matches.</p>}
        </Card>
      ) : (
        groups.map((g) => (
          <section key={g.title} className="ways-group">
            <h2 className="ways-group-title">{g.title}</h2>
            <div className="grid wide">
              {g.topics.map((id) => {
                const t = TOPIC_BY_ID[id];
                if (partyOnly && !readyCount(t, s.characters)) return null;
                const place = TOPIC_PLACES[id];
                return (
                  <div key={id} id={`ways-${id}`} className="ways-anchor">
                    <Card
                      title={t.title}
                      actions={
                        <button className="ghost small" onClick={() => goTo(place.tab)} title={`Go to ${place.card} on the ${place.tabLabel} tab`}>
                          📍 {place.tabLabel}
                        </button>
                      }
                    >
                      <TopicBody topic={t} chars={s.characters} partyOnly={partyOnly} />
                    </Card>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

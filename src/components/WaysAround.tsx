import { useMemo, useState } from 'react';
import { useGame } from '../state/store';
import { isReady, rankWays, searchWays, spellFact, STATUS_TEXT, TOPIC_BY_ID, TOPICS, wayKey, wayLabel, type PartyMatch, type TopicId, type Way, type WayKind } from '../rules/shortcuts';
import { Card, Pill, Toggle } from './common';

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

function MatchPills({ matches }: { matches: PartyMatch[] }) {
  if (!matches.length) return null;
  return (
    <span className="way-party">
      {matches.map((m) => (
        <Pill key={m.charId} tone={isReady(m) ? 'good' : m.status === 'maybe' || m.status === 'list' ? 'muted' : 'info'} title={STATUS_TEXT[m.status]}>
          {m.name}: {STATUS_TEXT[m.status]}
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
      <MatchPills matches={matches} />
    </li>
  );
}

/** A collapsible "Ways around this" list for one or more topics, placed inside the card for that mechanic. */
export function WaysAround({ topic, open }: { topic: TopicId | TopicId[]; open?: boolean }) {
  const s = useGame();
  const ids = Array.isArray(topic) ? topic : [topic];
  const groups = useMemo(() => ids.map((id) => ({ topic: TOPIC_BY_ID[id], rows: rankWays(TOPIC_BY_ID[id].ways, s.characters) })), [ids.join(','), s.characters]);
  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  const ready = groups.reduce((n, g) => n + g.rows.filter((r) => r.matches.some(isReady)).length, 0);
  return (
    <details className="ways" open={open}>
      <summary>
        🗝 Ways around this <span className="muted">· {total} options</span>
        {ready > 0 && <span className="good-text"> · {ready} the party can use now</span>}
      </summary>
      {groups.map((g) => (
        <div key={g.topic.id}>
          {groups.length > 1 && <h3 className="ways-topic">{g.topic.title}</h3>}
          <p className="muted small ways-problem">{g.topic.problem}</p>
          <ul className="ways-list">
            {g.rows.map((r) => (
              <WayRow key={wayKey(r.way)} way={r.way} matches={r.matches} />
            ))}
          </ul>
        </div>
      ))}
    </details>
  );
}

/** The full reference: every challenge, wait and cost, with what gets around it. */
export function WaysTab() {
  const s = useGame();
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState<TopicId | 'all'>('all');
  const [partyOnly, setPartyOnly] = useState(false);
  const searching = q.trim().length > 0;
  const hits = useMemo(() => searchWays(q), [q]);
  const shown = TOPICS.filter((t) => topic === 'all' || t.id === topic);
  const pcs = s.characters.filter((c) => c.kind === 'pc');
  return (
    <div className="stack">
      <Card title="Ways around it">
        <p className="small">
          Every mechanic in the tracker that challenges the party, makes them wait or costs them something, with the 2024 spells, class features, feats, species traits, Eldritch Invocations, items and
          Bastion facilities that shortcut or avoid it, and the fine print that trips tables up. Party matches use each character&apos;s spells, class and level, and the names of their items,
          resources and notes (add a feat or species to a character&apos;s notes to have it matched).
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
              {TOPICS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <Toggle checked={partyOnly} onChange={setPartyOnly} label="Only what the party can use now" title={pcs.length ? undefined : 'Add characters on the Party tab first'} />
        </div>
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
        <div className="grid wide">
          {shown.map((t) => {
            const rows = rankWays(t.ways, s.characters).filter((r) => !partyOnly || r.matches.some(isReady));
            if (partyOnly && !rows.length) return null;
            return (
              <Card key={t.id} title={t.title}>
                <p className="muted small ways-problem">{t.problem}</p>
                <ul className="ways-list">
                  {rows.map((r) => (
                    <WayRow key={wayKey(r.way)} way={r.way} matches={r.matches} />
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

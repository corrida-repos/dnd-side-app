import { useState } from 'react';
import { ART, ART_INSTRUMENTS, hasMusician, type ArtKind, type ArtProject } from '../rules/art';
import { nonmagicalCrafting } from '../rules/crafting';
import { signed } from '../rules/dice';
import { abilityScore, carriesTool, hasSkill, proficientWith, toolCheck, toolReadiness } from '../rules/gear';
import { fmtGp } from '../rules/money';
import { proficiencyBonus } from '../rules/survival';
import { abilityMod } from '../rules/upkeep';
import * as E from '../state/engine';
import { dispatch, useGame } from '../state/store';
import { Card, Num, Pill, Rule, Select, Text, Toggle } from './common';

const kinds = Object.keys(ART) as ArtKind[];

export function ArtCard() {
  const s = useGame();
  const [kind, setKind] = useState<ArtKind>('song');
  const [instrument, setInstrument] = useState('');
  const [artistId, setArtistId] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [formal, setFormal] = useState(false);
  const recipe = ART[kind];
  const party = s.characters.filter(E.canWorkOnProject);
  const instrumentOptions = ART_INSTRUMENTS.map((t) => ({
    name: t.name,
    rank: Math.max(0, ...party.map((c) => toolReadiness(c, t.name))),
  })).sort((a, b) => b.rank - a.rank);
  const bestInstrument = instrumentOptions.find((t) => t.rank >= 2);
  const tool = kind === 'song' ? instrument || bestInstrument?.name || recipe.tool : recipe.tool;
  const artists = party.sort((a, b) => toolReadiness(b, tool) - toolReadiness(a, tool));
  const artist = artists.find((c) => c.id === artistId) ?? artists[0];
  const check = artist && toolCheck(artist, tool);
  const equipped = !!artist && carriesTool(artist, tool);
  const craft = nonmagicalCrafting(recipe.gp);
  const ready = !formal || (equipped && check?.proficient && (!s.settings.chargeCosts || artist!.gp >= craft.gp));
  const projects = s.artProjects.filter((p) => E.charById(s, p.artistId));
  if (!s.settings.campArt || (!artist && !projects.length)) return null;
  return (
    <Card title="Create art" className="span-2">
      {artist && (
        <>
          <div className="form-row">
            <Select label="Medium" value={kind} onChange={(v) => { setKind(v); setArtistId(''); }} options={kinds.map((k) => ({ value: k, label: ART[k].label }))} />
            {kind === 'song' && <Select label="Composition tool" value={tool} onChange={(v) => { setInstrument(v); setArtistId(''); }}
              options={[{ value: recipe.tool, label: recipe.tool }, ...instrumentOptions.map((t) => ({
                value: t.name, label: t.rank >= 2 ? `${t.name} · party proficiency` : t.name,
              }))]} />}
            <Select label="Artist" value={artist.id} onChange={setArtistId} options={artists.map((c) => {
              const prof = proficientWith(c, tool);
              return { value: c.id, label: `${c.name} · ${prof ? `proficient with ${tool}` : prof === null ? 'proficiency unrecorded' : 'casual work'} · ${carriesTool(c, tool) ? 'tool carried' : 'needs tool'}` };
            })} />
          </div>
          <p className="small">
            <Pill tone={check?.proficient ? 'good' : 'muted'}>{tool}</Pill>{' '}
            {check?.bonus != null && <strong>{signed(check.bonus)} · </strong>}{check?.why}.
            {(kind === 'song' || kind === 'poem') && <> Live performance uses Charisma (Performance){hasSkill(artist, 'Performance') ? ', which this artist is proficient in' : ''}.</>}
          </p>
          <div className="form-row">
            <Text label="Title" value={title} onChange={setTitle} />
            <Text label="Subject" value={subject} onChange={setSubject} />
            <Toggle checked={formal} onChange={setFormal} label="Make a saleable copy" />
          </div>
          <div className="btn-row">
            <button className="primary small" disabled={!title.trim() || !subject.trim() || !ready} onClick={() => {
              dispatch((st, cx) => E.startArt(st, cx, artist.id, kind, title, subject, tool, formal));
              setTitle('');
              setSubject('');
            }}>Start project</button>
            <span className="muted small">{formal
              ? `${craft.days * 8} h · ${fmtGp(recipe.gp)} market value${s.settings.chargeCosts ? ` · ${fmtGp(craft.gp)} in materials` : ''} · tool proficiency required`
              : `${recipe.hours} h · casual work`}</span>
          </div>
        </>
      )}
      {projects.length > 0 && <ul className="plain">{projects.map((p) => <ArtRow key={p.id} project={p} />)}</ul>}
      {s.effects.filter((e) => e.artMorale).map((e) => (
        <div key={e.id} className="btn-row tight">
          <span className="small">{E.charById(s, e.targetIds[0])?.name} · {e.notes}</span>
          <button className="small" onClick={() => dispatch((st, cx) => E.useArtMorale(st, cx, e.id))}>Roll and spend morale die</button>
        </div>
      ))}
      <Rule>Table rule: work in one-hour sessions between other activities, or choose a project before a suitable travel leg. Use the camp hour only when the artist has free time. Saleable artwork uses the 2024 nonmagical crafting rate and goes into the artist&apos;s inventory. For a recognizable sketch, use Painter&apos;s Supplies under Tools to make the published DC 10 check.</Rule>
    </Card>
  );
}

function ArtRow({ project: p }: { project: ArtProject }) {
  const s = useGame();
  const [listenerId, setListenerId] = useState('');
  const artist = E.charById(s, p.artistId);
  if (!artist) return null;
  const done = p.hours >= p.requiredHours;
  const carried = !p.itemId || p.kind === 'song' || p.kind === 'poem' || s.characters.some((c) => c.inventory.some((i) => i.id === p.itemId && i.qty > 0));
  const equipped = p.gp == null || (carriesTool(artist, p.tool) && proficientWith(artist, p.tool));
  const available = E.canWorkOnProject(artist) && !s.tacticalEncounter;
  const allies = s.characters.filter((c) => c !== artist && E.canWorkOnProject(c));
  const share = done && carried && available;
  return (
    <li className="facility">
      <b>{p.title}</b> <span className="small muted">· {ART[p.kind].label} by {artist.name} · {p.subject}</span>{' '}
      <Pill tone={done ? 'good' : 'info'}>{done ? 'Finished' : `${p.hours}/${p.requiredHours} h`}</Pill>
      <div className="btn-row tight">
        {!done && <button className="small" disabled={!available || !equipped} onClick={() => dispatch((st, cx) => E.workOnArt(st, cx, p.id))}>Work for 1 hour</button>}
        {share && !p.shared && !s.artMoraleUsed && allies.length > 0 && (
          <Select label="Morale recipient (shared party experience)" value={listenerId} onChange={setListenerId} options={[
            { value: '', label: 'Just share the piece' },
            ...allies.map((c) => ({ value: c.id, label: c.name })),
          ]} />
        )}
        {share && <button className="small" onClick={() => dispatch((st, cx) => E.shareArt(st, cx, p.id,
          !p.shared && !st.artMoraleUsed && allies.some((c) => c.id === listenerId) ? listenerId : undefined))}>Share at camp</button>}
        {!done && !equipped && <span className="small muted">Needs {p.tool} and its proficiency.</span>}
      </div>
    </li>
  );
}

export function MusicianCard() {
  const s = useGame();
  const [artistId, setArtistId] = useState('');
  const [instrument, setInstrument] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const rest = s.musicianRest;
  const musicians = s.characters.filter((c) => E.canWorkOnProject(c) && hasMusician(c));
  const eligible = musicians.filter((c) => rest?.at === E.absNow(s) && rest.eligible.includes(c.id) && !rest.performed.includes(c.id));
  const artist = eligible.find((c) => c.id === artistId) ?? eligible[0];
  const instruments = artist ? ART_INSTRUMENTS.filter((t) => proficientWith(artist, t.name) && carriesTool(artist, t.name)) : [];
  const tool = instruments.find((t) => t.name === instrument) ?? instruments[0];
  const allies = s.characters.filter((c) => c !== artist && E.canWorkOnProject(c));
  const recipients = allies.filter((c) => selected.includes(c.id));
  const limit = artist ? proficiencyBonus(artist.level) : 0;
  if (!musicians.length) return null;
  return (
    <Card title="Encouraging Song">
      {!artist ? <p className="small muted">A character with Musician can play at the end of a Short or Long Rest.</p> : <>
        <div className="form-row">
          <Select label="Musician" value={artist.id} onChange={(v) => { setArtistId(v); setSelected([]); }} options={eligible.map((c) => ({ value: c.id, label: c.name }))} />
          {tool && <Select label="Proficient instrument" value={tool.name} onChange={setInstrument} options={instruments.map((t) => t.name)} />}
        </div>
        {tool ? <>
          <p className="small">Give Heroic Inspiration to up to {limit} allies who hear the song.</p>
          <div className="chips">{allies.map((c) => <Toggle key={c.id} label={c.name} checked={selected.includes(c.id)}
            onChange={(checked) => setSelected(checked ? [...selected, c.id] : selected.filter((id) => id !== c.id))} />)}</div>
          <button className="small primary" disabled={!recipients.length || recipients.length > limit || !!s.tacticalEncounter}
            onClick={() => dispatch((st, cx) => E.encouragingSong(st, cx, artist.id, tool.name, recipients.map((c) => c.id)))}>Play Encouraging Song</button>
        </> : <p className="small muted">{artist.name} needs a carried instrument they&apos;re proficient with.</p>}
      </>}
    </Card>
  );
}

export function ArtMarketCard() {
  const s = useGame();
  const [pieceId, setPieceId] = useState('');
  const [bonus, setBonus] = useState<number | null>(null);
  const performances = s.artProjects.filter((p) => (p.kind === 'song' || p.kind === 'poem') && p.hours >= p.requiredHours &&
    s.characters.some((c) => c.id === p.artistId && E.canWorkOnProject(c)));
  const piece = performances.find((p) => p.id === pieceId) ?? performances[0];
  const performer = piece && E.charById(s, piece.artistId);
  const score = performer && abilityScore(performer, 'cha');
  const sheetBonus = performer && score != null ? abilityMod(score) + (hasSkill(performer, 'Performance') ? proficiencyBonus(performer.level) : 0) : null;
  const artworks = s.characters.flatMap((c) => c.inventory.filter((i) => i.artKind && i.qty > 0).map((item) => ({ c, item })));
  if (!s.place.settlement || (!artworks.length && (!piece || !s.settings.campArt))) return null;
  return (
    <Card title="Art and performances">
      {artworks.map(({ c, item }) => {
        const buyers = E.localBuyers(s, item);
        return <div className="btn-row tight" key={item.id}>
          <span>{item.name} · {c.name} · {fmtGp(item.valueGp ?? 0)}{buyers?.length ? ` · ${buyers[0].name}` : ''}</span>
          <button className="small" disabled={buyers?.length === 0} onClick={() => dispatch((st, cx) => E.sellItem(st, cx, c.id, item.id, 1))}>Sell original</button>
          {buyers?.length === 0 && <span className="muted small">No open buyer</span>}
        </div>;
      })}
      {s.settings.campArt && piece && performer && <div className="btn-row tight">
        <Select label="Piece to perform" value={piece.id} onChange={(v) => { setPieceId(v); setBonus(null); }}
          options={performances.map((p) => ({ value: p.id, label: `${p.title} · ${E.charById(s, p.artistId)?.name}` }))} />
        <Num label="Charisma (Performance) bonus" value={bonus ?? sheetBonus ?? 0} onChange={setBonus} width={3} />
        <button className="small" disabled={sheetBonus == null && bonus == null}
          onClick={() => dispatch((st, cx) => E.perform(st, cx, performer.id, bonus ?? sheetBonus ?? 0, piece.title))}>Perform for coin (2 h)</button>
      </div>}
    </Card>
  );
}

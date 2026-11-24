import { LOCK_DC, LOCK_MINUTES, type LockDetails } from '../rules/exploration';
import { useState } from 'react';
import { useGame, dispatch } from '../state/store';
import * as E from '../state/engine';
import { Card, Num, Pill, Select, Text, Toggle, Rule } from './common';
import { ABILITY_LABEL, BELL, INK, INK_PAGES, PAPER, PERFUME, SIGNAL_WHISTLE, TOOLS, carriesTool, proficientWith, toolCheck, type ToolCategory } from '../rules/gear';
import { CARTOGRAPHER, IMPROVISED_DC } from '../rules/tools';
import { BOOK_GP, BOOK_PAGES, COPY_MAP_DC } from '../rules/chorePayoffs';
import { fmtGp } from '../rules/money';

const CATEGORY_LABEL: Record<ToolCategory, string> = { artisan: "Artisan's Tools", other: 'Other tools', gaming: 'Gaming Sets', instrument: 'Musical Instruments' };

/** Every 2024 PHB tool's Utilize checks, with the sheet's bonus, plus Perfume, signals and writing. */
export function ToolsCard() {
  const s = useGame();
  const pcs = s.characters.filter((c) => c.kind !== 'mount' && E.alive(c));
  const [who, setWho] = useState('');
  const c = pcs.find((x) => x.id === who) ?? pcs[0];
  const carried = c ? TOOLS.filter((t) => carriesTool(c, t.name)) : [];
  const [toolName, setToolName] = useState('');
  const tool = TOOLS.find((t) => t.name === toolName) ?? carried[0] ?? TOOLS[0];
  const [useIdx, setUseIdx] = useState(0);
  const use = tool.uses[Math.min(useIdx, tool.uses.length - 1)];
  const sheet = c ? toolCheck(c, tool.name, tool.ability, use.skill) : null;
  const [bonus, setBonus] = useState<number | null>(null);
  const [adv, setAdv] = useState<boolean | null>(null);
  const [what, setWhat] = useState('');
  const [pages, setPages] = useState(1);
  const [writing, setWriting] = useState('');
  const [perfBonus, setPerfBonus] = useState(0);
  const [mapId, setMapId] = useState('');
  const [bookName, setBookName] = useState('');
  const [quality, setQuality] = useState<LockDetails['quality']>('Good');
  const [complexity, setComplexity] = useState<LockDetails['complexity']>('Complex');
  const lock = tool.name === "Thieves' Tools" && use === tool.uses[0] ? { quality, complexity } : undefined;
  const dc = lock ? LOCK_DC[lock.quality] : use.dc;
  const minutes = lock ? LOCK_MINUTES[lock.complexity] : use.minutes;
  if (!c) return null;
  const maps = c.inventory.filter((i) => /^map of /i.test(i.name));
  const mapPick = maps.find((m) => m.id === mapId) ?? maps[0];
  const cartographer = c.inventory.some((i) => CARTOGRAPHER.test(i.name));
  const has = carriesTool(c, tool.name);
  const prof = proficientWith(c, tool.name);
  const b = bonus ?? sheet?.bonus ?? 0;
  const a = adv ?? !!sheet?.advantage;
  const reset = () => (setBonus(null), setAdv(null));
  const paper = c.inventory.filter((i) => PAPER.test(i.name.trim())).reduce((n, i) => n + i.qty, 0);
  const ink = c.inventory.find((i) => INK.test(i.name.trim()));
  const options = (['artisan', 'other', 'gaming', 'instrument'] as ToolCategory[]).flatMap((cat) =>
    TOOLS.filter((t) => t.category === cat).map((t) => ({
      value: t.name,
      label: `${CATEGORY_LABEL[cat]}: ${t.name}${carriesTool(c, t.name) ? ' ✓' : ''}${proficientWith(c, t.name) ? ' (proficient)' : ''}`,
    })),
  );
  return (
    <Card title="Tools and handy gear" className="span-2">
      <div className="form-row">
        <Select label="Who" value={c.id} onChange={(v) => (setWho(v), setToolName(''), reset())} options={pcs.map((x) => ({ value: x.id, label: x.name }))} />
        <Select label="Tool" value={tool.name} onChange={(v) => (setToolName(v), setUseIdx(0), reset())} options={options} />
        <Select label="Use" value={String(Math.min(useIdx, tool.uses.length - 1))} onChange={(v) => (setUseIdx(Number(v)), reset())} options={tool.uses.map((u, i) => ({ value: String(i), label: `${u.text}${tool.name === "Thieves' Tools" && i === 0 ? '' : ` (DC ${u.dc})`}` }))} />
      </div>
      <div className="form-row">
        {lock && (
          <>
            <Select label="Lock quality" value={quality} onChange={setQuality} options={Object.keys(LOCK_DC) as LockDetails['quality'][]} />
            <Select label="Lock complexity" value={complexity} onChange={setComplexity} options={Object.keys(LOCK_MINUTES) as LockDetails['complexity'][]} />
          </>
        )}
        <Text label="On what (optional)" value={what} onChange={setWhat} placeholder="e.g. the strongbox, the captain's letter" />
        <Num label={`${ABILITY_LABEL[tool.ability]} bonus`} value={b} onChange={(v) => setBonus(Math.round(v))} width={2} />
        <Toggle checked={a} onChange={setAdv} label={`Advantage${use.skill ? ` (also proficient in ${use.skill})` : ' (a skill also applies)'}`} />
      </div>
      <p className="small muted">
        {has ? <Pill tone="good">has the tool</Pill> : <Pill tone="warn">no {tool.name} in the inventory</Pill>} {prof ? <Pill tone="good">proficient</Pill> : prof === false ? <Pill tone="muted">not proficient</Pill> : null} From the sheet: {sheet?.why}.
        {!has && (s.settings.improvised ? ` Improvised: DC ${dc + IMPROVISED_DC}, twice the time (table rule).` : ' Improvised attempts are off in Settings.')}
      </p>
      <div className="btn-row tight">
        <button className="small primary" disabled={!has && !s.settings.improvised} onClick={() => dispatch((st, cx) => E.useTool(st, cx, c.id, tool.name, Math.min(useIdx, tool.uses.length - 1), b, a, what, lock))}>
          Roll (DC {has ? dc : dc + IMPROVISED_DC}
          {minutes ? `, ${minutes * (has ? 1 : 2)} min` : lock ? `, ${has ? '1 action' : '2 actions'}` : ''})
        </button>
      </div>
      <div className="btn-row tight">
        {c.inventory.some((i) => PERFUME.test(i.name) && i.qty > 0) && (
          <button className="small ghost" onClick={() => dispatch((st, cx) => E.applyPerfume(st, cx, c.id))}>
            Apply Perfume (1 h)
          </button>
        )}
        {c.inventory.some((i) => SIGNAL_WHISTLE.test(i.name)) && (
          <button className="small ghost" onClick={() => dispatch((st, cx) => E.soundSignal(st, cx, c.id, 'whistle'))}>
            Blow the Signal Whistle
          </button>
        )}
        {c.inventory.some((i) => BELL.test(i.name.trim())) && (
          <button className="small ghost" onClick={() => dispatch((st, cx) => E.soundSignal(st, cx, c.id, 'bell'))}>
            Ring the Bell
          </button>
        )}
      </div>
      {(paper > 0 || ink || s.settings.improvised) && (
        <div className="btn-row tight">
          <Num label="Pages to write" value={pages} onChange={(v) => setPages(Math.max(1, Math.round(v)))} min={1} width={3} />
          <Text value={writing} onChange={setWriting} placeholder="A letter, a copy of the map notes…" />
          <button className="small" onClick={() => dispatch((st, cx) => E.writePages(st, cx, c.id, pages, writing))}>
            {paper >= pages && ink && c.inventory.some((i) => /ink pen|quill/i.test(i.name)) ? `Write (${pages * 10} min)` : s.settings.improvised ? 'Scratch a note in charcoal (10 min)' : `Write (${pages * 10} min)`}
          </button>
          <span className="small muted">
            {paper} sheet{paper === 1 ? '' : 's'} · {ink ? `Ink: ${ink.uses ?? INK_PAGES} pages left${ink.qty > 1 ? ` (+${ink.qty - 1} bottles)` : ''}` : 'no Ink'}
          </span>
        </div>
      )}
      {s.place.settlement && (
        <div className="btn-row tight">
          <Num label="Performance or instrument bonus" value={perfBonus} onChange={(v) => setPerfBonus(Math.round(v))} width={3} />
          <button className="small" onClick={() => dispatch((st, cx) => E.perform(st, cx, c.id, perfBonus))}>
            Perform for coin (2 h)
          </button>
          <span className="small muted">Table rule: coppers under 10; 3d6 SP and a meal at 10+; 2d6 GP, supper and a room at 15+; 4d6 GP at 20+; 6d6 GP and an admirer at 25+.</span>
        </div>
      )}
      {cartographer && mapPick && (
        <div className="btn-row tight">
          <Select label="Map" value={mapPick.id} onChange={setMapId} options={maps.map((m) => ({ value: m.id, label: `${m.name}${m.valueGp ? ` (${fmtGp(m.valueGp)})` : ''}` }))} />
          <button className="small" disabled={paper < 1} onClick={() => dispatch((st, cx) => E.copyMap(st, cx, c.id, mapPick.id, b))}>
            Copy it (1 h, a sheet, DC {COPY_MAP_DC})
          </button>
          <span className="small muted">Table rule: a route map is worth its value in full to guides and traders. Uses the bonus above with Cartographer&apos;s Tools selected.</span>
        </div>
      )}
      {paper >= BOOK_PAGES && ink && (
        <div className="btn-row tight">
          <Text value={bookName} onChange={setBookName} placeholder="Which Book to copy" />
          <button className="small" onClick={() => dispatch((st, cx) => E.copyBook(st, cx, c.id, bookName))}>
            Fair copy of a Book ({BOOK_PAGES} sheets, {Math.round((BOOK_PAGES * 10) / 60)} h)
          </button>
          {s.hirelings.some((h) => h.active && h.role === 'scribe' && !(h.busyUntil && h.busyUntil > E.absNow(s))) && (
            <button className="small" onClick={() => dispatch((st, cx) => E.copyBook(st, cx, c.id, bookName, true))}>
              Have the scribe copy it (no time for the party)
            </button>
          )}
          <span className="small muted">Table rule: worth {fmtGp(BOOK_GP)}, sold at full price as the copyist&apos;s own work.</span>
        </div>
      )}
      <Rule>
        2024 PHB: each tool lists an ability and what you can do with it as a Utilize action, with a DC. Proficiency with the tool adds your Proficiency Bonus, and Advantage if you&apos;re also proficient in a skill that applies (the
        skill shown is the usual one; the DM decides). Each gaming set and instrument is its own proficiency. Perfume gives Advantage on Persuasion with an Indifferent Humanoid within 5 feet for an hour; a Signal Whistle carries 600 feet and a
        Bell 60; a sheet of Paper or Parchment holds about 250 words, and a bottle of Ink writes about 500 pages (writing a page takes about 10 minutes, table rule).
      </Rule>
    </Card>
  );
}

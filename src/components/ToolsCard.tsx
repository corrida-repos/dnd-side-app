import { useState } from 'react';
import { useGame, dispatch } from '../state/store';
import * as E from '../state/engine';
import { Card, Num, Pill, Select, Text, Toggle, Rule } from './common';
import { ABILITY_LABEL, BELL, INK, INK_PAGES, PAPER, PERFUME, SIGNAL_WHISTLE, TOOLS, carriesTool, proficientWith, toolCheck, type ToolCategory } from '../rules/gear';
import { IMPROVISED_DC } from '../rules/tools';

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
  if (!c) return null;
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
        <Select label="Use" value={String(Math.min(useIdx, tool.uses.length - 1))} onChange={(v) => (setUseIdx(Number(v)), reset())} options={tool.uses.map((u, i) => ({ value: String(i), label: `${u.text} (DC ${u.dc})` }))} />
      </div>
      <div className="form-row">
        <Text label="On what (optional)" value={what} onChange={setWhat} placeholder="e.g. the strongbox, the captain's letter" />
        <Num label={`${ABILITY_LABEL[tool.ability]} bonus`} value={b} onChange={(v) => setBonus(Math.round(v))} width={2} />
        <Toggle checked={a} onChange={setAdv} label={`Advantage${use.skill ? ` (also proficient in ${use.skill})` : ' (a skill also applies)'}`} />
      </div>
      <p className="small muted">
        {has ? <Pill tone="good">has the tool</Pill> : <Pill tone="warn">no {tool.name} in the inventory</Pill>} {prof ? <Pill tone="good">proficient</Pill> : prof === false ? <Pill tone="muted">not proficient</Pill> : null} From the sheet: {sheet?.why}.
        {!has && (s.settings.improvised ? ` Improvised: DC ${use.dc + IMPROVISED_DC}, twice the time (table rule).` : ' Improvised attempts are off in Settings.')}
      </p>
      <div className="btn-row tight">
        <button className="small primary" disabled={!has && !s.settings.improvised} onClick={() => dispatch((st, cx) => E.useTool(st, cx, c.id, tool.name, Math.min(useIdx, tool.uses.length - 1), b, a, what))}>
          Roll (DC {has ? use.dc : use.dc + IMPROVISED_DC}
          {use.minutes ? `, ${use.minutes * (has ? 1 : 2)} min` : ''})
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
      {(paper > 0 || ink) && (
        <div className="btn-row tight">
          <Num label="Pages to write" value={pages} onChange={(v) => setPages(Math.max(1, Math.round(v)))} min={1} width={3} />
          <Text value={writing} onChange={setWriting} placeholder="A letter, a copy of the map notes…" />
          <button className="small" onClick={() => dispatch((st, cx) => E.writePages(st, cx, c.id, pages, writing))}>
            Write ({pages * 10} min)
          </button>
          <span className="small muted">
            {paper} sheet{paper === 1 ? '' : 's'} · {ink ? `Ink: ${ink.uses ?? INK_PAGES} pages left${ink.qty > 1 ? ` (+${ink.qty - 1} bottles)` : ''}` : 'no Ink'}
          </span>
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

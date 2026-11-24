import { useGame } from '../state/store';
import { isCaster } from '../rules/spells';
import { Card } from './common';
import { FocusBar, SHEET_SECTIONS, setSection, useFocus, useFocused, useSection } from './focus';
import { AddCharacter, CharacterCard } from './PartyTab';
import { AfterTheFight, GearCard, MysteryOverview } from './GearTab';
import { MorningCard } from './MorningTab';
import { ToolsCard } from './ToolsCard';
import { PartyKnowledgeCard } from './ItemKnowledge';
import { AgeCard } from './LifeCards';
import { DdbImportCard } from './DdbImport';
import { WaysAround } from './WaysAround';
import type { TopicId } from '../rules/shortcuts';

/**
 * Every character's whole sheet in one place: HP and gear, status and sheet, spells and daily tasks.
 * Pick one character to see all of them together, or one section to compare the whole party.
 */
export function CharactersTab() {
  const s = useGame();
  const section = useSection();
  const focus = useFocus();
  const shown = useFocused();
  const want = (x: 'gear' | 'sheet' | 'spells') => section === 'all' || section === x;
  const casts = (c: (typeof shown)[number]) => c.kind !== 'mount' && (isCaster(c.className) || c.spells.length > 0 || c.tasks.length > 0);
  const tasksDone = s.characters.reduce((a, c) => a + c.tasks.filter((t) => t.done).length, 0);
  const tasksTotal = s.characters.reduce((a, c) => a + c.tasks.length, 0);
  const topics: TopicId[] = [...(want('gear') ? (['attunement', 'identify', 'ammo', 'shortRest'] as const) : []), ...(want('spells') ? (['rituals', 'concentration'] as const) : [])];
  const several = shown.length > 1;
  return (
    <div className="stack">
      <FocusBar />
      <div className="focus-bar section-bar" role="radiogroup" aria-label="Show which part of the sheet">
        {SHEET_SECTIONS.map((x) => (
          <button key={x.id} role="radio" aria-checked={section === x.id} className={section === x.id ? 'active' : ''} onClick={() => setSection(x.id)}>
            {x.label}
          </button>
        ))}
        {want('spells') && tasksTotal > 0 && (
          <span className="muted small">
            Daily tasks reset after every Long Rest: {tasksDone}/{tasksTotal} done.
          </span>
        )}
        {focus === 'all' && section === 'all' && several && <span className="muted small">Pick a character above to see one whole sheet.</span>}
      </div>
      {want('gear') && (
        <div className="grid wide">
          <MysteryOverview />
          <AfterTheFight />
        </div>
      )}
      {shown.map((c) => (
        <section key={c.id} className="char-group" aria-label={c.name}>
          {several && (
            <h2 className="group-title">
              {c.name} <span className="muted small">{c.kind === 'mount' ? 'mount' : `${c.className} ${c.level}`}</span>
            </h2>
          )}
          <div className="grid wide">
            {want('gear') && <GearCard c={c} />}
            {want('sheet') && <CharacterCard c={c} />}
            {want('spells') && casts(c) && <MorningCard c={c} />}
          </div>
        </section>
      ))}
      {want('spells') && !want('gear') && !want('sheet') && !shown.some(casts) && <p className="muted small">No spells or daily tasks for {several ? 'anyone here' : shown[0]?.name ?? 'anyone'}.</p>}
      {(want('sheet') || want('gear')) && <h2 className="group-title">Whole party</h2>}
      <div className="grid wide">
        {want('sheet') && <AddCharacterCard />}
        {want('gear') && <ToolsCard />}
        {want('gear') && <PartyKnowledgeCard />}
        {want('sheet') && <AgeCard />}
        {want('sheet') && <DdbImportCard />}
      </div>
      {topics.length > 0 && (
        <Card>
          <WaysAround topic={topics} />
        </Card>
      )}
    </div>
  );
}

function AddCharacterCard() {
  return (
    <Card title="New character">
      <AddCharacter />
    </Card>
  );
}

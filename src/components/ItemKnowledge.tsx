import { useState } from 'react';
import type { Character, MagicItem } from '../state/types';
import { CLUE_KIND_LABEL, STUDY_LABEL } from '../rules/identify';
import { RARITY_LABEL } from '../rules/crafting';
import { fmtGp, magicItemValue } from '../rules/money';
import { Card, Pill } from './common';
import { useGame } from '../state/store';

/** What the players know about an item, and nothing more. */
export function playerSummary(it: MagicItem): { title: string; lines: string[]; moreToLearn: boolean } {
  const title = it.identified ? it.name : it.partyName?.trim() || 'An unidentified item';
  const lines: string[] = [];
  if (it.identified) lines.push(`Identified: ${it.name}.`);
  else if (it.magicKnown) lines.push(`Magical${it.school ? `, with an aura of ${it.school}` : ''}.`);
  else lines.push('Nobody knows yet whether it is magical.');
  for (const c of (it.clues ?? []).filter((x) => x.known)) lines.push(`${CLUE_KIND_LABEL[c.kind]}: ${c.text}.`);
  if (it.identified && it.rarity) {
    const w = magicItemValue(it.name, it.rarity);
    lines.push(`${RARITY_LABEL[it.rarity]}: worth about ${fmtGp(w.gp)} (DMG price${w.note ? `; ${w.note}` : ''}; selling usually fetches about half).`);
  }
  if (it.identified && it.requiresAttunement) lines.push('Requires attunement.');
  if (it.identified && it.maxCharges != null) lines.push(`Holds up to ${it.maxCharges} charges.`);
  const moreToLearn = !it.identified || (it.clues ?? []).some((c) => !c.known);
  return { title, lines, moreToLearn };
}

export function playerText(c: Character, it: MagicItem): string {
  const p = playerSummary(it);
  return [`${p.title} (carried by ${c.name})`, ...p.lines.map((l) => `• ${l}`), p.moreToLearn ? '• There may be more to learn.' : '• Fully understood.'].join('\n');
}

/** One item as the players see it, with how they learned each thing. */
export function PlayerItemView({ c, it }: { c: Character; it: MagicItem }) {
  const p = playerSummary(it);
  const [copied, setCopied] = useState(false);
  return (
    <div className="player-item">
      <div className="armor-row">
        <b>{p.title}</b>
        <button
          className="ghost tiny"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(playerText(c, it));
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard may be blocked */
            }
          }}
        >
          {copied ? 'Copied' : 'Copy for players'}
        </button>
      </div>
      <ul className="plain small">
        {p.lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
        <li className="muted">{p.moreToLearn ? 'There may be more to learn.' : 'Fully understood.'}</li>
      </ul>
      {(it.findings ?? []).length > 0 && (
        <details>
          <summary className="small">How we learned it</summary>
          <ul className="log small">
            {[...(it.findings ?? [])].reverse().map((f) => (
              <li key={f.id}>
                <span className="muted">{f.stamp}</span> <b>{STUDY_LABEL[f.method]}:</b> {f.text.replace(/\(really:[^)]*\)/g, '')}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/** Every magic item in the party, as the players see them. */
export function PartyKnowledgeCard() {
  const s = useGame();
  const items = s.characters.flatMap((c) => c.items.map((it) => ({ c, it })));
  const [copied, setCopied] = useState(false);
  if (!items.length) return null;
  return (
    <Card
      title="What we know about our items (player view)"
      className="span-2"
      actions={
        <button
          className="ghost small"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(items.map(({ c, it }) => playerText(c, it)).join('\n\n'));
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard may be blocked */
            }
          }}
        >
          {copied ? 'Copied' : 'Copy all for players'}
        </button>
      }
    >
      <div className="grid">
        {items.map(({ c, it }) => (
          <div key={it.id}>
            <p className="small muted">
              {c.name} {!it.identified && <Pill tone="warn">Unidentified</Pill>}
            </p>
            <PlayerItemView c={c} it={it} />
          </div>
        ))}
      </div>
      <p className="small muted">Only what the characters have learned is shown here: no true names, rarities or hidden facts.</p>
    </Card>
  );
}


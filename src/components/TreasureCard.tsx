import { useState } from 'react';
import { ART_TIERS, GEM_TIERS } from '../rules/appraise';
import { fmtPurse } from '../rules/coins';
import { RARITY_LABEL, type Rarity } from '../rules/crafting';
import { fmtGp } from '../rules/money';
import { TRADE_BARS, TREASURE_THEMES, type TreasureKind, type TreasureRequest, type TreasureTheme } from '../rules/treasure';
import { claimTreasure, discardTreasure, previewTreasure, storageAccessProblem } from '../state/engine';
import { dispatch, useGame } from '../state/store';
import { Card, Select } from './common';

const TYPES = { individual: 'Individual treasure', hoard: 'Treasure hoard', gem: 'Gemstone', art: 'Art object', bar: 'Trade bar', magic: 'Magic item' };
const CR_BANDS = [{ value: '0', label: '0–4' }, { value: '5', label: '5–10' }, { value: '11', label: '11–16' }, { value: '17', label: '17+' }];
const MONETARY = { coins: 'Coins', gem: 'Gemstones', art: 'Art objects', bar: 'Trade bars' };
const VALUE_TIERS = { gem: GEM_TIERS, art: ART_TIERS, bar: TRADE_BARS.map((bar) => bar.valueGp) };

export function TreasureCard() {
  const s = useGame();
  const [kind, setKind] = useState<TreasureRequest['kind']>('individual');
  const [cr, setCr] = useState('0');
  const [theme, setTheme] = useState<TreasureTheme>('Arcana');
  const [rarity, setRarity] = useState<Rarity>('common');
  const [monetary, setMonetary] = useState<keyof typeof MONETARY>('coins');
  const [tier, setTier] = useState('0');
  const [recipient, setRecipient] = useState('');
  const holders = [
    ...s.characters.filter((c) => c.kind !== 'mount').map((c) => ({ value: `c:${c.id}`, label: c.name })),
    ...s.stashes.filter((stash) => !storageAccessProblem(s, stash)).map((stash) => ({ value: `s:${stash.id}`, label: stash.name })),
  ];
  const destination = holders.find((holder) => holder.value === recipient)?.value ?? holders[0]?.value ?? '';
  const valueKind = kind === 'hoard' ? monetary : kind;
  const values = valueKind === 'gem' || valueKind === 'art' || valueKind === 'bar' ? VALUE_TIERS[valueKind] : [];
  const value = values[Number(tier)] ?? values[0] ?? 0;
  const request: TreasureRequest = kind === 'hoard'
    ? { kind, cr: Number(cr), theme, rarity, monetary, unitValue: value }
    : kind === 'individual' ? { kind, cr: Number(cr) }
      : kind === 'magic' ? { kind, theme, rarity } : { kind, value };
  const preview = s.treasurePreview;

  return (
    <Card title="Treasure generator" className="span-2">
      {preview ? (
        <>
          <p><strong>Roll result</strong> · {fmtPurse(preview.coins)}</p>
          {preview.items.length > 0 && (
            <ul>
              {preview.items.map((item, i) => (
                <li key={i}>
                  {item.qty > 1 ? `${item.qty} × ` : ''}{item.name} · {fmtGp(item.valueGp)}{item.qty > 1 ? ' each' : ''}
                  {item.rarity && ` · ${RARITY_LABEL[item.rarity]}`}
                  {item.attunement && ` · Attunement${typeof item.attunement === 'string' ? ` ${item.attunement}` : ''}`}
                </li>
              ))}
            </ul>
          )}
          <div className="form-row">
            {holders.length ? <Select label="Recipient" value={destination} onChange={setRecipient} options={holders} /> : <p>Add a character or stash to claim this roll.</p>}
            <button disabled={!destination} onClick={() => dispatch((state, ctx) => claimTreasure(state, ctx, preview.id, destination))}>Claim treasure</button>
            <button className="ghost" onClick={() => dispatch((state, ctx) => discardTreasure(state, ctx, preview.id))}>Discard roll</button>
          </div>
        </>
      ) : (
        <div className="form-row">
          <Select label="Table" value={kind} onChange={(next) => { setKind(next); setTier('0'); }} options={Object.entries(TYPES).map(([value, label]) => ({ value: value as TreasureKind | 'individual' | 'hoard', label }))} />
          {(kind === 'individual' || kind === 'hoard') && <Select label="Challenge Rating" value={cr} onChange={setCr} options={CR_BANDS} />}
          {(kind === 'magic' || kind === 'hoard') && (
            <>
              <Select label="Treasure theme" value={theme} onChange={setTheme} options={TREASURE_THEMES} />
              <Select label="Magic item rarity" value={rarity} onChange={setRarity} options={Object.entries(RARITY_LABEL).map(([value, label]) => ({ value: value as Rarity, label }))} />
            </>
          )}
          {kind === 'hoard' && (
            <Select label="Monetary treasure" value={monetary} onChange={(next) => { setMonetary(next); setTier('0'); }} options={Object.entries(MONETARY).map(([value, label]) => ({ value: value as keyof typeof MONETARY, label }))} />
          )}
          {values.length > 0 && <Select label="Value per item" value={tier} onChange={setTier} options={values.map((gp, i) => ({ value: String(i), label: fmtGp(gp) }))} />}
          <button onClick={() => dispatch((state, ctx) => previewTreasure(state, ctx, request))}>Roll treasure</button>
        </div>
      )}
    </Card>
  );
}

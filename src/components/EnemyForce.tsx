import { useState } from 'react';
import { THREAT_PRESETS, THREAT_STAGES } from '../rules/campaignThreat';
import * as E from '../state/engine';
import { dispatch, useGame } from '../state/store';
import { campaignTime } from './CampaignDeadlines';
import { Card, Meter, Num, Select, Text } from './common';

export function EnemyForceCard() {
  const s = useGame();
  const [presetId, setPresetId] = useState('');
  const [name, setName] = useState('');
  const [intervention, setIntervention] = useState('');
  const [endgame, setEndgame] = useState('');
  const [days, setDays] = useState(7);
  const [setback, setSetback] = useState(7);
  const [signs, setSigns] = useState<string[]>([]);
  const [consequences, setConsequences] = useState<string[]>([]);
  const threat = s.campaignThreat;
  const stages = (s.campaignDeadlines ?? []).filter((item) => item.threatStage != null);
  const final = stages.find((item) => item.threatStage === THREAT_STAGES.length);
  const now = E.absNow(s);
  const next = stages.find((item) => !item.ruling);
  const canDelay = next || final?.ruling === 'scene';
  const danger = threat?.stage ?? 0;
  const change = (values: string[], index: number, value: string) =>
    THREAT_STAGES.map((_, i) => i === index ? value : values[i] ?? '');
  const applyPreset = (id: string) => {
    setPresetId(id);
    const preset = THREAT_PRESETS[id];
    setEndgame(preset?.endgame ?? '');
    setIntervention(preset?.intervention ?? '');
    setSigns(preset ? [...preset.operations.map(([warning]) => warning), preset.endgameWarning] : []);
    setConsequences(preset ? preset.operations.map(([, consequence]) => consequence) : []);
  };

  return (
    <Card title="Enemy force">
      {threat ? (
        <>
          <p><b>{threat.name}</b> · {threat.stopped ? 'Stopped' : THREAT_STAGES[danger - 1]?.name ?? 'Plans underway'}</p>
          <Meter value={danger} max={THREAT_STAGES.length} tone={danger >= 4 ? 'bad' : 'warn'} />
          <p className="small">{threat.stopped ? 'Peak danger' : 'Danger'} {danger} / {THREAT_STAGES.length}</p>
          {next && next.at > now && <p className="small">Next escalation on {campaignTime(s, next.at)}.</p>}
          <details>
            <summary>Operations and consequences (DM)</summary>
            {threat.intervention && <p className="small">Ways to intervene: {threat.intervention}</p>}
            <ol>
              {stages.map((item) => (
                <li key={item.id}>
                  <b>{THREAT_STAGES[(item.threatStage ?? 1) - 1]?.name}</b> · {item.ruling === 'foiled' ? 'Foiled' : campaignTime(s, item.at)}
                  <div className="small">{item.warning}</div>
                  <div className="small muted">{item.outcome}</div>
                </li>
              ))}
            </ol>
          </details>
          {final && final.at <= now && !final.ruling && (
            <div className="decision">
              <b>The endgame is due</b>
              <p>{final.warning}</p>
              <div className="btn-row">
                <button onClick={() => dispatch((st, cx) => E.resolveCampaignDeadline(st, cx, final.id, 'scene'), 'opening the endgame scene')}>Play endgame scene</button>
                <button onClick={() => dispatch((st, cx) => E.resolveCampaignDeadline(st, cx, final.id, 'offscreen'), 'accepting the endgame outcome')}>Accept offscreen outcome</button>
              </div>
            </div>
          )}
          {final?.ruling === 'scene' && !threat.stopped && <p className="small">Endgame scene underway.</p>}
          {final?.ruling === 'offscreen' && <p className="small">Endgame outcome accepted.</p>}
          {!threat.stopped && (
            <div className="btn-row">
              {canDelay && <>
                <Num label="Setback" suffix="days" value={setback} onChange={setSetback} min={1} max={366} width={3} />
                <button onClick={() => dispatch((st, cx) => E.delayCampaignThreat(st, cx, Math.round(setback)), 'delaying the enemy plan')}>Delay enemy plan</button>
              </>}
              <button className="small" onClick={() => dispatch(E.stopCampaignThreat, 'stopping the enemy plan')}>Mark enemy force stopped</button>
            </div>
          )}
        </>
      ) : (
        <form onSubmit={(event) => {
          event.preventDefault();
          dispatch((st, cx) => E.startCampaignThreat(st, cx, name, endgame, Math.round(days), signs, consequences, intervention), 'starting the enemy plan');
        }}>
          <p className="small muted">The enemy advances one stage per interval of in-game time. Use a setback when the party disrupts the plan.</p>
          <div className="form-row">
            <Select label="Enemy type" value={presetId} onChange={applyPreset} options={[
              { value: '', label: 'Custom' },
              ...Object.entries(THREAT_PRESETS).map(([value, entry]) => ({ value, label: entry.label })),
            ]} />
            <Text label="Enemy force" value={name} onChange={setName} placeholder="The Ashen Order" />
            <Num label="Days per stage" value={days} onChange={setDays} min={1} max={366} width={3} />
          </div>
          {intervention && <p className="small">Ways to intervene (DM): {intervention}</p>}
          <Text label="Endgame consequence (DM only)" value={endgame} onChange={setEndgame} placeholder="The Order seizes the capital." wide />
          <details>
            <summary>Customize warning signs and consequences</summary>
            <Text label="Ways to intervene (DM only)" value={intervention} onChange={setIntervention} wide />
            {THREAT_STAGES.map((stage, index) => (
              <div key={stage.name} className="facility">
                <b>{stage.name}</b>
                <Text label="Public warning" value={signs[index] ?? ''} onChange={(v) => setSigns(change(signs, index, v))} placeholder={stage.warning} wide />
                {stage.outcome && <Text label="Private consequence" value={consequences[index] ?? ''} onChange={(v) => setConsequences(change(consequences, index, v))} placeholder={stage.outcome} wide />}
              </div>
            ))}
          </details>
          <div className="btn-row">
            <button className="primary" disabled={!name.trim() || !endgame.trim()}>Start enemy clock</button>
            <a href="https://5e.tools/book.html#xdmg,4,flavors%20of%20fantasy,0" target="_blank" rel="noreferrer">DMG conflict examples</a>
          </div>
        </form>
      )}
    </Card>
  );
}

import type { FightOrFlight, OpeningPosition, TacticalEncounter, TacticalVitals } from './butler';
import type { ActiveEffect, Shelter } from '../state/types';
import type { CheckConditions, EncounterResult } from './encounters';
import type { TerrainType } from './terrain';
import type { Illumination } from './sight';
import type { Weather } from './weather';

export interface HandoffParticipant {
  id: string;
  side: 'party' | 'encounter';
  influencedAlly?: boolean;
  kind: 'character' | 'sidekick' | 'mount' | 'hireling' | 'creature';
  name: string;
  ddbId?: number;
  creature?: { name: string; source?: string };
  hp?: number;
  maxHp?: number;
  tempHp?: number;
  exhaustion?: number;
  dying?: boolean;
  stable?: boolean;
  vitals?: TacticalVitals;
  surprised: boolean;
  roadNetRestrained?: boolean;
  openingPosition?: OpeningPosition;
  watching?: boolean;
  resting?: boolean;
}

export interface EncounterSurprise {
  partySurprised: boolean;
  stealth?: number;
  passivePerception?: number;
  noticedBy?: string;
  alarm?: 'bell' | 'pots';
  partyNoticed: boolean;
  trapNoticedBy?: string;
  trapTriggeredBy?: string;
  roadNetRestrainedId?: string;
  narrative: string;
}

export interface EncounterHandoff {
  format: 'life-manager.encounter';
  version: 1;
  campaignId: string;
  encounterId: string;
  revision: 1;
  rulesEdition: '2024';
  minute: number;
  summary: string;
  encounterRoll: number;
  checkDetail?: string;
  attitude: EncounterResult['attitude'];
  fightOrFlight?: FightOrFlight;
  surprise: EncounterSurprise;
  environment: {
    place: string;
    activity: CheckConditions['activity'];
    terrain: TerrainType;
    shelter: Shelter;
    light: Illumination;
    weather: Pick<Weather, 'precip' | 'wind'>;
    distanceFt: number;
    distanceExpression: string;
  };
  participants: HandoffParticipant[];
  effects: (Pick<ActiveEffect, 'id' | 'name' | 'kind' | 'targetIds' | 'casterId' | 'concentration' | 'concentrationIds'> & {
    remainingMinutes: number | null;
    paused: boolean;
  })[];
}

export function encounterHandoffJson(handoff: EncounterHandoff, selected: ReadonlySet<string>): string {
  const effects = handoff.effects.flatMap((effect) => {
    const targetIds = effect.targetIds.filter((id) => selected.has(id));
    const casterId = effect.casterId && selected.has(effect.casterId) ? effect.casterId : null;
    const concentrationIds = effect.concentrationIds?.filter((id) => selected.has(id));
    if (effect.targetIds.length && !targetIds.length && !casterId && !concentrationIds?.length) return [];
    return [{ ...effect, targetIds, casterId, concentrationIds }];
  });
  return JSON.stringify({ ...handoff, participants: handoff.participants.filter((p) => selected.has(p.id)), effects }, null, 2);
}


/** Convert a saved roll to the Butler interchange format without rerolling any encounter detail. */
export function tacticalFromHandoff(handoff: EncounterHandoff, context?: string): TacticalEncounter {
  const e = handoff.environment;
  const summary = `Lighting: ${e.light}. Terrain: ${e.terrain}. Shelter: ${e.shelter}. Weather: ${e.weather.precip} precipitation, ${e.weather.wind} wind.`;
  const effects = handoff.effects.length
    ? ` Active effects to review: ${handoff.effects.map((effect) => effect.name).join(', ')}.` : '';
  return {
    schema: 'life-manager/encounter@1', rules: handoff.rulesEdition, campaignId: handoff.campaignId,
    id: handoff.encounterId, at: handoff.minute, title: handoff.summary,
    activity: e.activity, place: e.place || e.terrain, distanceFt: e.distanceFt,
    attitude: handoff.attitude?.attitude, fightOrFlight: handoff.fightOrFlight,
    context: `${context ?? handoff.surprise.narrative.trim()} ${summary}${effects}`.slice(0, 4000),
    participants: handoff.participants.map((p) => ({
      id: p.id, name: p.name, side: p.side, ddbId: p.ddbId, influencedAlly: p.influencedAlly,
      source: p.creature?.source, creatureName: p.creature?.name,
      surprised: p.surprised, asleep: p.resting, roadNetRestrained: p.roadNetRestrained, openingPosition: p.openingPosition, vitals: p.vitals,
    })),
  };
}

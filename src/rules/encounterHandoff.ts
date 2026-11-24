import type { ActiveEffect, Shelter } from '../state/types';
import type { CheckConditions, EncounterResult } from './encounters';
import type { TerrainType } from './terrain';
import type { Illumination } from './sight';
import type { Weather } from './weather';

export interface HandoffParticipant {
  id: string;
  side: 'party' | 'encounter';
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
  surprised: boolean;
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

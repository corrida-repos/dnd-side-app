import { describe, expect, it } from 'vitest';
import { attentionItems } from '../components/attention';
import { createDefaultState, newCharacter } from './defaults';
import * as E from './engine';
import { dispatch, getState, importState, undo } from './store';
import type { State } from './types';

const ctx = { rng: () => 0.5 };
const day = E.MIN_PER_DAY;

function town() {
  const state = createDefaultState(ctx.rng);
  state.place.settlement = true;
  state.settings.encounters = false;
  state.settings.lifestyleRisks = false;
  state.characters = [newCharacter({ name: 'A', level: 5, gp: 500, lifestyle: 'modest' })];
  return state;
}

function ferry(state: State, minutes: number, rivalId?: string, pause = true) {
  return E.addCampaignDeadline(state, ctx, {
    warning: 'The last ferry departs',
    outcome: 'The rival has bribed the ferry captain',
    at: E.absNow(state) + minutes,
    pause,
    rivalId,
  });
}

describe('campaign deadlines', () => {
  it('pauses a seven-day downtime skip on day four and resumes parallel projects once', () => {
    let state = E.addRival(town(), ctx, 'The ferryman', '');
    const start = E.absNow(state);
    state.projects = ['repairs', 'supplies'].map((id) => ({
      id, name: id, kind: 'activity', charIds: [state.characters[0].id], daysRequired: 7, daysDone: 0,
      costGp: 0, notes: '', done: false,
    }));
    state = ferry(state, 4 * day, state.rivals[0].id);
    const ids = state.projects.map((p) => p.id);
    expect(E.downtimePreview(state, 7, ids).finishes.map((p) => p.id)).toEqual(ids);
    state = E.startDowntimeSkip(state, ctx, 7, ids);
    expect(E.absNow(state)).toBe(start + 4 * day);
    expect(state.downtimeSkip?.until).toBe(start + 7 * day);
    expect(state.projects.map((p) => p.daysDone)).toEqual([4, 4]);
    expect(attentionItems(state).find((i) => i.id.startsWith('deadline-'))?.text).toBe('Campaign deadline: The last ferry departs');
    expect(E.absNow(E.resumeDowntimeSkip(state, ctx))).toBe(start + 4 * day);

    const id = E.campaignDeadlines(state)[0].id;
    const paused = state;
    for (const ruling of ['scene', 'offscreen'] as const) {
      state = E.resolveCampaignDeadline(paused, ctx, id, ruling);
      if (ruling === 'scene') expect(state.townMode).toBe('active');
      state = E.resumeDowntimeSkip(state, ctx);
      expect(E.absNow(state)).toBe(start + 7 * day);
      expect(state.projects.every((p) => p.done)).toBe(true);
      expect(state.rivals[0].pressure).toBe(1);
      expect(state.downtimeSkip).toBeUndefined();
    }
    expect(E.campaignDeadlines(paused)).toHaveLength(1);
    expect(paused.projects.every((p) => !p.done)).toBe(true);
  });

  it('stops travel between hours and credits only distance covered', () => {
    const start = town();
    start.minutes = 10 * 60;
    start.place.goodRoad = true;
    const state = ferry(start, 90);
    const deadline = E.campaignDeadlines(state)[0];
    const result = E.travel(state, ctx, { hours: 4, pace: 'normal', difficult: false, foragerIds: [] });
    expect(E.absNow(result)).toBe(deadline.at);
    expect(result.travel.hoursToday).toBe(1.5);
    expect(result.travel.milesToday).toBeGreaterThan(0);
    expect(result.travel.milesToday).toBeLessThan(6);
  });

  it('keeps a clock skip target through deferral and a live scene', () => {
    let state = E.addRival(town(), ctx, 'The ferryman', '');
    state = ferry(state, 60, state.rivals[0].id);
    const until = E.absNow(state) + 240;
    state = E.advance(state, ctx, 240);
    const id = E.campaignDeadlines(state)[0].id;
    state = E.resolveCampaignDeadline(state, ctx, id, 'defer', 30);
    state = E.resumeClockSkip(state, ctx);
    expect(E.absNow(state)).toBe(until - 150);
    expect(state.rivals[0].pressure).toBe(1);
    state = E.resolveCampaignDeadline(state, ctx, id, 'scene');
    state = E.advance(state, ctx, 30);
    expect(state.clockSkipUntil).toBe(until);
    state = E.resumeClockSkip(state, ctx);
    expect(E.absNow(state)).toBe(until);
    expect(state.clockSkipUntil).toBeUndefined();
  });

  it('preserves a partially worked shift through a live scene and undo', () => {
    const state = ferry(town(), 4 * 60);
    const id = E.campaignDeadlines(state)[0].id;
    state.projects = [{
      id: 'repairs', name: 'Repairs', kind: 'activity', charIds: [state.characters[0].id],
      daysRequired: 1, daysDone: 0, costGp: 0, notes: '', done: false,
    }];
    importState(state);
    dispatch((s, c) => E.startDowntimeSkip(s, c, 1, ['repairs']));
    expect(getState().downtimeSkip?.phaseMinutes).toBe(240);
    dispatch((s, c) => E.resolveCampaignDeadline(s, c, id, 'scene'));
    undo();
    expect(E.waitingForDeadline(getState())).toBe(true);
    dispatch((s, c) => E.resolveCampaignDeadline(s, c, id, 'scene'));
    dispatch((s, c) => E.advance(s, c, 30));
    expect(getState().townMode).toBe('active');
    expect(getState().projects[0].daysDone).toBe(0);
    dispatch(E.resumeDowntimeSkip);
    expect(getState().projects[0].done).toBe(true);
    expect(E.absNow(getState())).toBe(E.absNow(state) + day);
    expect(getState().log.filter((entry) => entry.text.startsWith('Opened a live scene'))).toHaveLength(1);
  });

  it('processes a quiet month of upkeep and Bastion turns', () => {
    let state = town();
    const start = E.absNow(state);
    state = E.foundBastion(state, ctx, state.characters[0].id, 'Watchtower');
    const before = state.characters[0].gp;
    state = E.startDowntimeSkip(state, ctx, 30, []);
    expect(E.absNow(state)).toBe(start + 30 * day);
    expect(state.characters[0].gp).toBeLessThan(before);
    expect(E.turnsDue(state, state.bastions[0])).toBe(4);
    expect(state.downtimeSkip).toBeUndefined();
  });

  it('surfaces a non-blocking milestone without shortening an advance', () => {
    const state = ferry(town(), 15, undefined, false);
    const result = E.advance(state, ctx, 60);
    expect(E.absNow(result)).toBe(E.absNow(state) + 60);
    expect(E.waitingForDeadline(result)).toBe(false);
    expect(result.log.some((entry) => entry.text.includes('The last ferry departs'))).toBe(true);
    expect(result.log.some((entry) => entry.text.includes('bribed'))).toBe(false);
  });
});

describe('enemy force', () => {
  const startThreat = (s: State) => E.startCampaignThreat(s, ctx, 'The Ashen Order', 'The Order seizes the capital.', 2,
    ['Agents come to town.'], ['The Order gains informants.']);

  it('advances automatically with elapsed time and pauses a downtime skip at the endgame', () => {
    let state = startThreat(town());
    const start = E.absNow(state);
    state = E.startDowntimeSkip(state, ctx, 14, []);
    expect(E.absNow(state)).toBe(start + 10 * day);
    expect(state.campaignThreat?.stage).toBe(5);
    expect(state.downtimeSkip?.until).toBe(start + 14 * day);
    expect(E.campaignDeadlines(state)).toHaveLength(1);
    expect(attentionItems(state).some((item) => item.text.startsWith('Enemy endgame:'))).toBe(true);
    expect(state.log.filter((entry) => entry.text === 'Agents come to town.')).toHaveLength(1);
    expect(state.log.some((entry) => entry.text.includes('seizes the capital'))).toBe(false);
    state = E.resolveCampaignDeadline(state, ctx, E.campaignDeadlines(state)[0].id, 'scene');
    state = E.resumeDowntimeSkip(state, ctx);
    expect(E.absNow(state)).toBe(start + 14 * day);
    expect(state.campaignThreat?.stage).toBe(5);
  });

  it('pushes remaining operations back by the setback without repeating past advances', () => {
    let state = startThreat(town());
    const start = E.absNow(state);
    state = E.advance(state, ctx, 3 * day, 'work');
    expect(state.campaignThreat?.stage).toBe(1);
    state = E.delayCampaignThreat(state, ctx, 3);
    expect(E.campaignDeadlines(state)[0].at).toBe(start + 7 * day);
    expect(state.campaignThreat?.stage).toBe(1);
    state = E.advance(state, ctx, 4 * day, 'work');
    expect(state.campaignThreat?.stage).toBe(2);
    expect(state.log.filter((entry) => entry.text === 'Agents come to town.')).toHaveLength(1);
  });

  it('lets the party delay or stop a due endgame while keeping unrelated deadlines', () => {
    let state = ferry(startThreat(town()), 20 * day);
    state = E.advance(state, ctx, 12 * day, 'work');
    expect(E.waitingForDeadline(state)).toBe(true);
    state = E.delayCampaignThreat(state, ctx, 1);
    expect(E.waitingForDeadline(state)).toBe(false);
    state = E.advance(state, ctx, day, 'work');
    expect(E.waitingForDeadline(state)).toBe(true);
    state = E.stopCampaignThreat(state, ctx);
    expect(state.campaignThreat?.stopped).toBe(true);
    expect(E.waitingForDeadline(state)).toBe(false);
    expect(E.campaignDeadlines(state).map((item) => item.warning)).toEqual(['The last ferry departs']);
    expect(state.log.filter((entry) => entry.text === 'The enemy is ready to make its decisive move.')).toHaveLength(1);
  });
});

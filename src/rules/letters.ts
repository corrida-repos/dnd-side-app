/**
 * Letters and news. The ways to send word reuse the Bastion message methods (2024 PHB messenger rates and
 * the Sending, Animal Messenger and Dream spells). How fast news and rumor spread on their own is a table rule.
 */
import type { CommMethod } from './comms';

export type NewsRoute = 'road' | 'trade' | 'remote' | 'magic';

/** How far word of an event spreads in a day, by the route between there and the party (table rule). */
export const NEWS_SPEED: Record<NewsRoute, { label: string; milesPerDay: number | null; note: string }> = {
  trade: { label: 'Trade route or river', milesPerDay: 40, note: 'Merchants, barges and coaches carry it quickly.' },
  road: { label: 'Ordinary roads', milesPerDay: 20, note: 'Travellers on foot and the odd rider.' },
  remote: { label: 'Wilderness or a closed border', milesPerDay: 8, note: 'Word trickles through with the rare traveller.' },
  magic: { label: 'Magic or a message station', milesPerDay: null, note: 'Heralds with Sending, House Sivis stones: it arrives the same day.' },
};

/** Minutes until news of something that happened this far away reaches the party. */
export function newsDelay(route: NewsRoute, miles: number): number {
  const speed = NEWS_SPEED[route].milesPerDay;
  if (speed == null) return 4 * 60;
  return Math.max(60, Math.round((miles / speed) * 24 * 60));
}

/** Days a contact takes to write back once a letter reaches them (table rule): 1d4, then the reply travels back. */
export const REPLY_DIE = 4;

/** Methods that suit a personal letter. */
export const LETTER_METHODS: CommMethod[] = ['messenger', 'courier', 'animal', 'sending', 'dream', 'sivis'];

/** A paid letter carrier for those without a messenger hireling: 2 CP a mile like a messenger (2024 PHB), at 24 miles a day. */
export const POST_NOTE = 'Without a messenger hireling, a letter goes with travellers or a paid carrier at the messenger rate.';

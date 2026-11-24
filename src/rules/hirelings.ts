/** Common jobs for hirelings, and what each one does for the party. */
export type HirelingRole =
  | 'torchbearer'
  | 'porter'
  | 'laborer'
  | 'guard'
  | 'guide'
  | 'cook'
  | 'groom'
  | 'healer'
  | 'artisan'
  | 'scribe'
  | 'appraiser'
  | 'interpreter'
  | 'teamster'
  | 'sailor'
  | 'messenger'
  | 'other';

export interface RoleInfo {
  label: string;
  skilled: boolean;
  /** What they do for the party, in a sentence. */
  does: string;
  /** The skill or tool their bonus applies to. */
  skill?: string;
  /** How this role plugs into the tracker. */
  hook?: string;
}

export const HIRELING_ROLES: Record<HirelingRole, RoleInfo> = {
  torchbearer: { label: 'Torchbearer', skilled: false, does: 'Carries a light so the adventurers keep their hands free.', hook: 'Light a torch from their row; it shows on the Effects & Ailments tab.' },
  porter: { label: 'Porter', skilled: false, does: 'Carries gear, supplies and treasure (a typical porter carries about 150 lb).' },
  laborer: { label: 'Laborer', skilled: false, does: 'Digs, hauls, clears rubble, sets up camp and gathers firewood.' },
  guard: { label: 'Guard or mercenary', skilled: true, does: 'Keeps watch at night and protects the camp, the mounts and the gear.', skill: 'Perception', hook: 'Can stand watches in the Night watch planner.' },
  guide: { label: 'Guide', skilled: true, does: 'Knows the land and keeps the party on course.', skill: 'Survival', hook: 'Can be picked as the navigator on the Travel card.' },
  cook: { label: 'Cook', skilled: true, does: 'Turns rations and game into hot meals.', skill: "Cook's Utensils", hook: 'Can make the check when cooking a hot meal.' },
  groom: { label: 'Groom or animal handler', skilled: true, does: 'Feeds, waters and cares for the mounts.', skill: 'Animal Handling', hook: 'Waters and feeds every mount at the end of each day, from their feed and the camp stores or a water source.' },
  healer: { label: 'Healer', skilled: true, does: 'Binds wounds and stabilizes the dying.', skill: 'Medicine', hook: 'Can stabilize a dying character with their Medicine bonus.' },
  artisan: { label: 'Artisan', skilled: true, does: 'Helps with crafting (must have proficiency with the tool).', skill: 'a tool' },
  scribe: { label: 'Scribe', skilled: true, does: 'Copies documents and letters, and helps scribe scrolls.', skill: "Calligrapher's Supplies" },
  appraiser: { label: 'Appraiser (table rule)', skilled: true, does: 'Judges what gems, jewelry and art are worth, with their own Jeweler’s Tools.', skill: "Jeweler's Tools", hook: 'Can appraise items of unknown value on the Characters tab (HP & gear).' },
  interpreter: { label: 'Interpreter', skilled: true, does: 'Translates languages the party doesn’t speak.' },
  teamster: { label: 'Teamster or driver', skilled: true, does: 'Drives wagons and carts and handles draft animals.', skill: 'Land Vehicles' },
  sailor: { label: 'Sailor', skilled: true, does: 'Crews a boat or ship (larger ships need a crew of skilled hirelings).', skill: 'Water Vehicles' },
  messenger: { label: 'Messenger', skilled: false, does: 'Delivers a message for 2 CP per mile.', hook: 'Send a message from their row; the cost is charged.' },
  other: { label: 'Other', skilled: false, does: 'Whatever job you agree on.' },
};

/** Messengers charge 2 CP per mile (PHB). */
export const MESSENGER_GP_PER_MILE = 0.02;
export const hirelingKey = (id: string): string => `h:${id}`;

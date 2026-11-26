export const THREAT_STAGES = [
  {
    name: 'First signs',
    warning: 'Unfamiliar agents are asking questions and buying supplies.',
    outcome: 'The enemy establishes a network of agents and can learn about the party’s plans.',
  },
  {
    name: 'Growing threat',
    warning: 'Supplies disappear from local markets as convoys leave under guard.',
    outcome: 'The enemy secures supplies and allies for its next operation.',
  },
  {
    name: 'Widening impact',
    warning: 'Travelers report new checkpoints and routes closing.',
    outcome: 'The enemy takes a strategic position and can restrict travel or access to an ally.',
  },
  {
    name: 'Critical danger',
    warning: 'Scouts report the enemy gathering its forces for a decisive move.',
    outcome: 'The enemy brings its key assets together. The party has a final window to disrupt the plan.',
  },
  {
    name: 'Endgame',
    warning: 'The enemy is ready to make its decisive move.',
    outcome: '',
  },
] as const;

export interface ThreatPreset {
  label: string;
  endgame: string;
  operations: ReadonlyArray<readonly [warning: string, consequence: string]>;
  endgameWarning: string;
  intervention: string;
}

// Original escalation sequences inspired by the 2024 DMG's campaign conflict examples.
export const THREAT_PRESETS: Readonly<Record<string, ThreatPreset>> = {
  conquest: {
    label: 'Conquest and occupation',
    endgame: 'The enemy takes a decisive position and can impose its rule on the surrounding region.',
    operations: [
      ['Scouts report unfamiliar activity on the frontier.', 'The enemy identifies weak points and valuable routes.'],
      ['Supplies and reinforcements converge near a vulnerable position.', 'The enemy establishes a base it can resupply.'],
      ['Travelers arrive from a position the enemy has taken.', 'The enemy holds a foothold and can push farther into the region.'],
      ['Allies report that key routes are closing.', 'The enemy isolates its main objective from relief.'],
    ],
    endgameWarning: 'The enemy moves on the position that anchors the region’s defense.',
    intervention: 'Cut supply lines, reinforce a threatened position, or unite its defenders.',
  },
  influence: {
    label: 'Infiltration and subversion',
    endgame: 'The enemy gains control of an institution whose authority it can turn against its opponents.',
    operations: [
      ['The same unfamiliar names surface among several trusted circles.', 'The enemy recruits insiders and learns how decisions are made.'],
      ['Trusted contacts start giving unusually similar explanations.', 'The enemy acquires leverage over key insiders.'],
      ['People with influence are removed, replaced, or silenced.', 'The enemy controls enough gatekeepers to obstruct an investigation.'],
      ['An important decision is called without the usual safeguards.', 'The enemy has the support it needs to make its control official.'],
    ],
    endgameWarning: 'A decisive vote, appointment, or transfer of authority is underway.',
    intervention: 'Protect a witness, expose a compromised insider, or secure an independent decision-maker.',
  },
  coercion: {
    label: 'Coercion and exploitation',
    endgame: 'The enemy controls a service or resource that others must depend on and can dictate its terms.',
    operations: [
      ['The enemy tests what people will give up to avoid trouble.', 'The enemy identifies a need it can exploit.'],
      ['Several people agree to the same one-sided terms.', 'Early concessions give the enemy resources and credibility.'],
      ['Independent suppliers or routes start to disappear.', 'The enemy gains leverage over access to an essential resource.'],
      ['Allies report that their last reliable alternative is threatened.', 'The enemy is ready to demand a lasting concession.'],
    ],
    endgameWarning: 'The enemy moves to close the last alternative and impose its terms.',
    intervention: 'Create an alternate supply, break the monopoly, or help communities bargain together.',
  },
  power: {
    label: 'Seizing or unleashing power',
    endgame: 'The enemy activates, claims, or releases the power it has been pursuing, changing what it can threaten.',
    operations: [
      ['Agents seek old records, witnesses, or unusual components.', 'The enemy learns where to find the power it seeks.'],
      ['Something needed to gain access goes missing.', 'The enemy obtains a key, ally, or piece of knowledge.'],
      ['The enemy secures the site or closes off its rivals’ access.', 'The enemy can begin preparations with few interruptions.'],
      ['Scouts report that the last prerequisite is being brought into place.', 'The enemy is ready to claim or unleash the power.'],
    ],
    endgameWarning: 'The last preparations are complete and the decisive attempt is underway.',
    intervention: 'Remove a key component, reach the site first, or deny the enemy a necessary ally.',
  },
  calamity: {
    label: 'Spreading calamity',
    endgame: 'The threat crosses a major boundary, affecting a wider region and requiring a new response.',
    operations: [
      ['Unusual effects are reported in one isolated place.', 'The threat takes hold around its source.'],
      ['The same signs appear in a second community or habitat.', 'The threat finds a dependable way to spread.'],
      ['Local containment measures begin to fail.', 'The threat disrupts travel, supplies, or services.'],
      ['The warning signs appear at a major junction or population center.', 'The threat is poised to reach beyond the places already affected.'],
    ],
    endgameWarning: 'The last effective barrier is failing.',
    intervention: 'Contain the source, interrupt the route of spread, or evacuate people and resources ahead of it.',
  },
  pursuit: {
    label: 'Pursuit and vendetta',
    endgame: 'The enemy corners its main target and can carry out its revenge, capture, or theft.',
    operations: [
      ['Someone has been asking about the target’s habits and associates.', 'The enemy identifies the target and learns where to start looking.'],
      ['Safe contacts report that strangers are watching them.', 'The enemy traces the target’s support network.'],
      ['One refuge or escape route becomes unsafe.', 'The enemy narrows where the target can retreat.'],
      ['The target’s last reliable contact sends an urgent warning.', 'The enemy knows where to intercept the target.'],
    ],
    endgameWarning: 'The enemy reaches the target before help can arrive.',
    intervention: 'Move the target, misdirect the search, or confront the pursuers on ground the party chooses.',
  },
};

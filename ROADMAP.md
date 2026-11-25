# Roadmap

Everything in D&D 5.5e (2024 *Player's Handbook* and *Dungeon Master's Guide*) that takes time or repeats on a schedule, outside combat. Each item says what the rule is, what clock it runs on, and whether the tracker covers it yet.

**Status:** ✅ done · 🔜 next up · 📋 planned · 💭 maybe later

> Phases 1–4 were written from memory. Phase 5 lists the places where the 2024 rules data (as published by 5etools) disagrees with the tracker, and the "Verified correct" list shows what already matches.

---

## Already tracked ✅

| Feature | Clock |
| --- | --- |
| In-game clock and calendar (Harptos, Gregorian, simple), daylight by season | Minutes → days |
| Daily weather (DMG d20 tables), hourly temperature curve | Daily roll, hourly curve |
| Extreme cold and heat saves, strong wind, heavy precipitation, high altitude | Every hour |
| Cold nights: Bedroll and Blanket, sleeping out below freezing without warm cover | Each Long Rest |
| Food and water by size, dehydration and malnutrition, 5 days without food | End of each day |
| Exhaustion (2024: −2 per level to D20 Tests, −5 ft Speed) | Long Rest removes 1 |
| Raw food (Con save or Sick until a Long Rest), unpurified water (Poisoned for 1 hour), purifying by spell, boiling or cooking | Per meal and drink, 1 hour, Long Rest |
| Campfire fuel, lighting, weather putting it out, cooking, Chef treats | Hourly fuel burn |
| Short Rest (1 h) and Long Rest (8 h), one Long Rest per 24 hours with a countdown | Rest timers |
| Staying awake too long (Xanathar's: DC 10 Con, +5 per extra day without a Long Rest) | Every 24 hours awake |
| Travel pace, miles, forced march saves after 8 hours, foraging | Hourly |
| Putting armor on and taking it off (Light 1/1, Medium 5/1, Heavy 10/5 minutes) | Minutes |
| Morning checklist and spell preparation by class rules | After each Long Rest |
| Crafting gear, Spell Scrolls, Potions of Healing, magic items | 8-hour workdays |
| Bastions: construction, enlarging, 7-day Bastion turns, orders, events | Daily build progress, weekly turns |

---

## Phase 1: Rest-driven upkeep ✅

These all happen during Short and Long Rests or at dawn, so they fit straight into the existing rest engine. They're the most useful at the table.

### Attunement ✅
- Attuning to a magic item takes a **Short Rest** spent focused on that item while touching it.
- A creature can be attuned to at most **3 items**.
- Attunement ends if the creature stops meeting the prerequisites, if the item is **more than 100 feet away for 24 hours**, if the creature dies, or if someone spends another Short Rest focused on the item to end it on purpose.
- **To build:** an attuned-items list per character with a 3-item cap, an "attune during this Short Rest" choice, and a 24-hour timer when an item is left behind.

### Identifying magic items ✅
- Use the *Identify* spell (1 minute, or 11 minutes as a ritual), or spend a **Short Rest** focused on the item while touching it.
- *Detect Magic* (ritual, concentration up to 10 minutes) shows that something is magical.
- **To build:** an inventory of unidentified items with "identify by Short Rest" and "identify by spell" buttons, which hand off to the attunement list.

### Class and feat resources ✅
- Most limited features come back on a **Short Rest**, a **Long Rest** or **at dawn**. Examples:
  - **Short Rest:** Warlock Pact Magic slots, Monk Focus Points, Fighter Action Surge and Second Wind uses, a Channel Divinity use, Bardic Inspiration (from level 5).
  - **Long Rest:** spell slots, Rage, Lay on Hands, Sorcery Points, Lucky feat points, Heroic Inspiration for humans.
  - **Once per day:** Wizard Arcane Recovery after a Short Rest.
- **To build:** per character, resources with a max, current uses and a recharge type (Short Rest, Long Rest, dawn, or a custom number of uses back). Rests refill them automatically.

### Hit Points and Hit Point Dice ✅
- **Short Rest:** spend Hit Point Dice to heal.
- **Long Rest:** all HP and all spent Hit Point Dice come back. A character must have at least 1 HP to start one.
- **To build:** HP and Hit Point Dice per character, a "spend Hit Point Dice" roller on Short Rests, and the Chef bonus die.

### Magic item charges and dawn recharges ✅
- Many items regain charges **at dawn** (wands, staves), and some uses are "once per day" or "until the next dawn".
- **To build:** a list of items with charges and their regain roll (for example 1d6 + 1 at dawn), applied when the clock passes sunrise.

### Keeping watch ✅
- A Long Rest allows up to 2 hours of light activity, such as standing watch.
- **To build:** a watch rota during Long Rests (who watches which 2-hour block, with their passive Perception), and an optional random encounter check per watch.

---

## Phase 2: Things that burn down ✅

### Light sources ✅
- **Torch:** 1 hour. **Candle:** 1 hour. **Lamp and Hooded Lantern:** 6 hours per flask of oil.
- **Spells:** *Light* lasts 1 hour, *Continual Flame* is permanent, *Daylight* lasts 1 hour.
- **To build:** light sources with burn time left, ticked by the clock, with a warning before they go dark. This matters most underground.

### Spell durations and concentration ✅
- Long buffs to track: *Mage Armor* 8 h, *Aid* 8 h, *Darkvision* 8 h, *Longstrider* 1 h, *Heroes' Feast* 24 h.
- Camp spells: *Leomund's Tiny Hut* 8 h, *Rope Trick* 1 h, *Alarm* 8 h.
- *Goodberry* berries last 24 h.
- Concentration: one concentration spell per caster at a time.
- Ritual casting adds 10 minutes.
- **To build:** active effects with an end time on the clock, a concentration flag per caster, expiry alerts, and camp spells that count as shelter (*Tiny Hut* blocks the weather).

### Potions and consumables with durations ✅
- Examples: *Potion of Invisibility*, *Flying* and *Water Breathing* (1 hour each), *Heroism*, *Giant Strength*.
- **To build:** reuse the active-effects timer from spell durations.

### Exploration turns ✅
- Dungeon time passes in ~10-minute blocks of careful exploration: searching a room, checking for traps, listening at doors.
- **To build:** an "exploration turn" button (10 minutes) that ticks lights and spells and can roll a random encounter check.

### Holding breath and frigid water ✅
- **Holding breath:** 1 + Constitution modifier minutes (minimum 30 seconds).
- **Frigid water:** a creature can stay in it for minutes equal to its Constitution score, then makes a DC 10 Con save each minute or gains Exhaustion.
- **To build:** small timers, triggered by hand.

---

## Phase 3: Money and living costs ✅

### Lifestyle expenses ✅
- Daily cost by lifestyle: Wretched, Squalid, Poor, Modest, Comfortable, Wealthy, Aristocratic.
- **To build:** a gold ledger per character, with lifestyle charged each day spent in town.

### Lodging, meals and services ✅
- Inn stays and meals by quality.
- Hirelings: skilled about 2 GP a day, untrained about 2 SP a day.
- **To build:** hireling wages and lodging charged to the gold ledger.

### Mounts and animals ✅
- Mounts need food and water every day (by size), plus feed, tack, stabling and carrying capacity.
- A mount can travel faster for short stretches.
- **To build:** mounts as party members that need food and water, with mounted travel pace.

### Selling and buying magic items ✅
- Finding a buyer or seller takes days of downtime and a check. DMG tables set how long it takes and the price.
- **To build:** downtime activities with time and outcome rolls.

---

## Phase 4: Long downtime and the wider world ✅

### Wizard spellbook ✅
- **Copying a spell** into a spellbook takes **2 hours and 50 GP per spell level**.
- **Replacing a lost book**, for spells you already have prepared, takes 1 hour and 10 GP per spell level.
- **To build:** a downtime project type that adds the spell to the Wizard's book when it finishes.

### Other downtime activities ✅
- Carousing, crime, gambling, pit fighting, relaxation, religious service, research, and training for a tool or language.
- Most of these take a set number of days and end with a check and a table roll.
- **To build:** activity presets with their own time, cost and outcome tables, sitting next to crafting.

### Daily casting streaks ✅
- *Teleportation Circle*, *Guards and Wards*, *Mordenkainen's Private Sanctum*: permanent if cast in the same place every day for a year.
- *Forbiddance*: permanent if cast every day for 30 days.
- The World tab tracks consecutive days and warns when a missed day resets the streak.

### PHB 2024 spell bookkeeping

Use the existing effect clock and concentration tracking. Add mechanics when a spell changes supplies, rests, HP, travel, or world state. Include lasting consequences of Instantaneous spells. Resolve encounter triggers through the encounter handoff or a DM action. [5etools PHB 2024 spell data](https://5e.tools/data/spells/spells-xphb.json)

| Order | Spells | Roadmap work |
|---|---|---|
| 1 ✅ | *Goodberry* | Create a batch of ten berries per cast. Each use removes a berry, heals 1 HP, and supplies one day of nourishment. Remove unused berries after 24 hours. |
| 2 ✅ | *Prayer of Healing* | Apply Short Rest benefits and slot-scaled healing to up to five recipients. Track eligibility per recipient and reset it on their next Long Rest. |
| 3 ✅ | *Aid* | Apply the slot-scaled increase to current and maximum HP for up to three recipients. Remove the bonus when the effect ends and handle recasts under the same-spell rule. |
| 4 ✅ | *Create Food and Water*, *Heroes' Feast*, *Death Ward* | Reuse supply batches for food that spoils after 24 hours and clean water tracked separately. Start feast benefits after the one-hour meal and expire them after 24 hours. Spend a ward on the first qualifying drop to 0 HP or instant-death effect. |
| Follow-up | *Wind Walk*, *Phantom Steed*, *Control Weather* | Track cloud form by traveler, recalculate travel when a steed disappears, and schedule weather stage changes after their rolled delays. Restore normal weather gradually when the spell ends. |
| Follow-up | *Animate Dead*, *Create Undead*, *Planar Binding*, *Find Familiar*, *Find Steed*, *Awaken* | Track creatures with their caster, current orders, and conditions for disappearance or loss of control. Support renewing undead control before its per-creature 24-hour deadline. Extend a linked summon when binding succeeds. Track *Awaken*'s charm and leave the creature's later attitude to the DM. |
| Follow-up | *Befuddlement*, *Contagion*, *Geas* | Track *Befuddlement*'s casting restriction and 30-day repeat saves. Carry *Contagion*'s seven-day outcome over from the encounter and handle saves against poison removal. Record *Geas* commands, slot-dependent duration, and the once-per-day breach limit. |
| Follow-up | *Clone*, *Simulacrum*, *Leomund's Secret Chest* | Track clone vessels and 120-day maturity, with a prompt on death. Track simulacrum HP, replacement, and paid repairs during the caster's Long Rest. Link a secret chest and its inventory to the replica and resolve its escalating daily loss chance after 60 days. |
| Follow-up | *Contingency*, *Glyph of Warding*, *Creation*, *Tasha's Bubbling Cauldron* | Record stored spells and DM-resolved triggers. For *Contingency*, spend both slots at setup and track the ten-day deadline and component requirement. Track created objects by material-dependent expiry and remove unused cauldron potions when the caster casts it again. |
| Follow-up | *Nystul's Magic Aura*, *Hallow*, *Teleportation Circle*, *Guards and Wards*, *Mordenkainen's Private Sanctum*, *Forbiddance* | Reuse the streak tracker for 30 daily casts of *Nystul's Magic Aura* on the same target. Record completed circles and wards with their location and selected effects. |
| Follow-up | *Animal Messenger*, *Sending*, *Dream*, *Resurrection* | Extend letters with ground and flying messenger speeds, upcast deadlines, and the optional eight-hour *Sending* block. Track *Dream* waiting for sleep and its failed-save rest consequence. For *Resurrection* after 365 days or more, block the caster's spellcasting and apply Disadvantage on D20 Tests until their next Long Rest. |

### Supplemental spell bookkeeping

Build these alongside the PHB mechanics they reuse. Use the 2024 version where a legacy spell was revised. Keep older spell options labeled with their source.

| Source | Spells | Roadmap work |
|---|---|---|
| [Forgotten Realms: Heroes of Faerûn](https://5e.tools/data/spells/spells-frhof.json) | *Deryan's Helpful Homunculi*, circle-cast *Dirge*, *Simbul's Synostodweomer* | Add one qualified crafting assistant for up to eight hours. Carry *Dirge*'s Exhaustion and Long Rest restrictions over from encounters. Give the target of *Synostodweomer* the option to spend Hit Point Dice for healing when they cast a slotted spell. |
| [Eberron: Forge of the Artificer](https://5e.tools/data/spells/spells-efa.json) | *Homunculus Servant* | Reuse the persistent companion record. Record the caster and slot-dependent statistics, and replace the previous servant on recast. |
| [Xanathar's Guide to Everything](https://5e.tools/data/spells/spells-xge.json) | *Catnap*, *Ceremony* | Reuse per-recipient rest eligibility for a full ten-minute *Catnap*, with damage and waking interrupting individual recipients. Record *Ceremony* rites, timed benefits, and lifetime or widowhood restrictions. Link Funeral Rite to the corpse record. |
| [Xanathar's Guide to Everything](https://5e.tools/data/spells/spells-xge.json) | *Druid Grove*, *Temple of the Gods*, *Mighty Fortress*, *Snare* | Reuse site wards and recast schedules. Support daily recasts for a year for the grove and temple, and a seven-day cadence with expiry for the fortress. Track *Snare* at its site until expiry or trigger and hand off resolution to the DM. |
| [Xanathar's Guide to Everything](https://5e.tools/data/spells/spells-xge.json) | *Create Homunculus*, *Tiny Servant*, *Danse Macabre* | Use the companion record for the legacy homunculus's optional Hit Point Dice transfer at Long Rest and for temporary servants or undead tied to spell expiry. |
| [Tasha's Cauldron of Everything](https://5e.tools/data/spells/spells-tce.json) | *Dream of the Blue Veil*, legacy summon spells | Track the destination and travelers during the six-hour trance. Damage interrupts the affected traveler, or everyone if it hits the caster. Use the shared summon record for legacy spells still used at the table, including *Summon Shadowspawn*, with cleanup on expiry or loss of concentration. |

### Resurrection windows ✅
- Time since death decides which spell still works: *Revivify* within 1 minute, *Raise Dead* and *Reincarnate* within 10 days, *Resurrection* within 100 years.
- *Gentle Repose* (10 days) stops the clock.
- **To build:** time of death on the character, with a list of which spells still work.

### Divination limits ✅
- *Augury*, *Commune* and *Divination* become unreliable when cast more than once before a Long Rest.
- **To build:** cast counts that reset on a Long Rest, with the extra failure chance shown.

### Curses and long effects ✅
- *Geas* (30 days), *Bestow Curse*, lycanthropy and similar.
- **To build:** long timers in the same active-effects list.

### World clock ✅
- Moon phases (Selûne), festivals and holy days, tides, and the changing seasons.
- Faction renown and standing that change over weeks, news and rumors arriving on a schedule.

---

## Phase 5: Fixes from the 5etools review ✅

Checked against the 2024 *Player's Handbook* and *Dungeon Master's Guide* data that 5etools publishes. Each item below is a place where the tracker doesn't match the book yet.

### Travel and foraging
- ✅ **Terrain types from the DMG Travel Terrain table.** Replace the separate "foraging abundance" and "finding the way" settings with one terrain choice. Each terrain sets the maximum pace, encounter distance, foraging DC, navigation DC and search DC:

  | Terrain | Max pace | Foraging DC | Navigation DC | Search DC |
  | --- | --- | --- | --- | --- |
  | Arctic | Fast | 20 | 10 | 10 |
  | Coastal | Normal | 10 | 5 | 15 |
  | Desert | Normal | 20 | 10 | 10 |
  | Forest | Normal | 10 | 15 | 15 |
  | Grassland | Fast | 15 | 5 | 15 |
  | Hill | Normal | 15 | 10 | 15 |
  | Mountain | Slow | 20 | 15 | 20 |
  | Swamp | Slow | 10 | 15 | 20 |
  | Underdark | Normal | 20 | 10 | 20 |
  | Urban | Normal | 20 | 15 | 15 |
  | Waterborne | Special | 15 | 10 | 15 |

- ✅ **A good road raises the maximum pace by one step** (Slow to Normal, Normal to Fast).
- ✅ **Fast pace also gives Disadvantage on Dexterity (Stealth)** checks, not only Perception and Survival.
- ✅ **Foraging** is one Wisdom (Survival) check per journey stage, or per day if the stage is shorter. A success finds 1d6 + Wisdom modifier pounds of food **per day of the stage**, then the same roll again in gallons of water.

### Hazards
- ✅ **Extreme cold:** in 2024, only Cold Resistance or Immunity means an automatic success. Make cold weather gear an optional 2014 rule, off by default. The Bedroll still means an automatic success while sleeping in it.
- ✅ **Extreme heat:** in 2024, Disadvantage comes from Medium or Heavy armor only. Make heavy clothing an optional 2014 rule.
- ✅ **Frigid water:** creatures naturally adapted to icy water also succeed automatically. Add this per character.
- ✅ **Suffocation:** track the Exhaustion levels gained from suffocating, and remove all of them once the creature can breathe again.

### Rests
- ✅ **A Short Rest needs at least 1 HP to start**, just like a Long Rest. Characters at 0 HP get no Short Rest benefits.
- ✅ **Interrupting a rest:** rolling Initiative, casting a spell other than a cantrip, taking damage, or 1 hour of walking or other exertion.
  - An interrupted Short Rest gives no benefits.
  - A Long Rest interrupted after at least 1 hour gives Short Rest benefits instead.
  - The party can resume a Long Rest, which then takes 1 more hour per interruption.

### Crafting and money
- ✅ **Raw materials cost half the price, rounded down**: 37 GP for Chain Mail, not 37.5.
- ✅ **Normally only one other character can help with crafting.** The DM can allow more. Limit crafters to two, with an override.
- ✅ **Lifestyle is paid at the start of each week or month** (DM's choice). Offer that alongside the current daily charge.
- ✅ **Animal feed weighs 10 lb per day** (5 CP). Encumbrance exists now, so count feed carried by mounts at 10 lb per day.
- ✅ **Rations weigh 2 lb per day** in 2024. Carried food now counts at 2 lb per day of Rations.

### Bastions
- ✅ **A new Bastion starts with two free basic facilities** (one Cramped, one Roomy) and two special facilities.
- ✅ **Special facility sizes from the DMG:**
  - Cramped: Meditation Chamber, Reliquary.
  - Vast: Gaming Hall, Theater, Training Area, Menagerie, Demiplane, Guildhall, War Room.
  - Roomy or Vast, your choice: Archive, Barrack, Garden, Pub, Stable, Workshop.
  - Everything else: Roomy.
- ✅ **Maintain is an order for the whole Bastion.** It blocks all other orders, and the event roll happens right after it's given. Characters who are away for 7 days are assumed to give Maintain.

---

## Phase 6: New features suggested by 5etools ✅

### Journeys
- ✅ **Journey stages:** plan a trip in stages (distance, terrain, weather), with one navigation and foraging check per stage, food and water used per stage, and an encounter distance roll when something turns up.
- ✅ **Galloping mounts:** a mounted party can move twice the normal distance for 1 hour. After that the mounts need a Short or Long Rest before they can do it again.
- ✅ **Ships and other vessels** from the 2024 PHB:
  - Speeds: Airship 8 mph, Galley 4, Longship 3, Warship 2½, Sailing Ship 2, Rowboat 1½, Keelboat 1.
  - Each ship's crew, passengers and cargo.
  - Ships don't use travel pace, and can sail around the clock with crew shifts.
- ✅ **Searching and tracking** DCs by terrain.

### Load and gear
- ✅ **Encumbrance:**
  - Carrying capacity is Strength × 15 lb for Small or Medium creatures, ×7.5 for Tiny, ×30 for Large, ×60 for Huge, ×120 for Gargantuan.
  - Mount capacities: Camel 450 lb, Elephant 1,320, Draft Horse 540, Riding Horse 480, Mastiff 195, Mule 420, Pony 225, Warhorse 540.
  - Weights: rations 1 lb, water 8 lb per gallon, feed 10 lb per day.
- ✅ **Magic item import from 5etools:** rarity, attunement, charges and how they recharge (for example "1d6 + 1 at dawn") fill in the item tracker automatically.
- ✅ **Spell class lists from 5etools** (its spell source lookup file), to filter imported spells by class.

### Class features
- ✅ **Ranger Tireless** (level 10): a Short Rest removes 1 Exhaustion level.
- ✅ **Bard Font of Inspiration** (level 5): Bardic Inspiration switches to coming back on a Short Rest automatically.

### More hazards and the wider world
- ✅ **Hazard timers and rollers:**
  - Deep water: DC 10 Con save each hour of swimming without a Swim Speed, or 1 Exhaustion level.
  - Thin ice: holds 3d10 × 10 lb per 10-foot square.
  - Slippery ice, quicksand pits, poisonous gas, webs, razorvine and rockslides.
- ✅ **Bastion defensive walls:** 250 GP and 10 days per 5-foot square, as a construction project.
- ✅ **Supernatural gifts and curses:** Blessings, Boons and Charms (Charms have limited uses) as trackable effects, optionally imported from the 5etools rewards file.
- ✅ **Campfire recipes:** optionally import recipe names from 5etools (the *Heroes' Feast* cookbook) to give hot meals some flavor.

---

### Random encounters by location danger ✅
- Every place has a danger level (Safe, Low, Moderate, High, Deadly). Danger sets how often to check (every 12/8/4/2/1 hours overland, every 6/6/3/2/1 exploration turns in a dungeon) and the d20 number that brings an encounter (20, 19+, then 18+). A natural 20 always does. *Table rule:* the 2024 DMG leaves the frequency to the DM.
- Rolling conditions add to or take from the d20: night, a light in the dark, fast pace, a large group (+1); slow pace, a good road, foul weather, a sheltered camp (−1).
- d100 tables for each terrain are built from the 2024 Monster Manual's SRD 5.2 creatures (CC BY 4.0, taken from 5etools with `scripts/build-encounter-data.mjs`) plus any imported bestiary. Group sizes follow the 2024 DMG XP budget for the danger level's difficulty, and big creatures stay in small numbers.
- Built in and on by default: the rest of the 2024 Monster Manual (136), *Monsters of the Multiverse* (227) and *Adventures in Faerûn* (32), as names, CRs and environments only (`scripts/build-book-data.mjs`). *Ravenloft: The Horrors Within* (47) and *Arcana Unleashed* (18) are built in but off.
- Other 5etools books can be imported (several files at once) and switched in or out per book. Checked for usefulness: the rest of the 2024 Monster Manual, *Monsters of the Multiverse* and *Adventures in Faerûn* fill nearly every gap; *Ravenloft: The Horrors Within* and *Arcana Unleashed* suit particular campaigns; 2014 reprints and named NPCs are skipped, and adventure books have no environment tags.
- An encounter rolls the group size, a starting attitude from alignment, and the distance (Travel Terrain table). It names who is on watch during a Long Rest, and tells the players what their characters notice first.

## Phase 7: Firming up vague mechanics ✅

An audit of the gameplay flow for places where the tracker stops at "make the check", "the DM decides" or a logged roll with no result. Each item says what happens **now**, which **rules** cover it, and what **to build**. Items are ordered by how often they come up at the table.

### Bastion orders that produce something ✅
- **Now:** resolving a turn logs "orders carried out". A Smithy told to Craft, a Garden told to Harvest or a Library told to Research produce nothing, and the order details are free text.
- **Rules (2024 DMG, chapter 8):** each of the 70 facilities lists its order options and exact results, e.g. Garden harvests (healing herbs, poisons, rations), Smithy crafts with Smith's Tools or makes Common/Uncommon armaments at level 9+, Storehouse trades goods for profit, Barrack recruits Bastion Defenders, Library researches a topic. The 5etools `bastions.json` has all of them.
- **To build:** pick an order option per facility from the data. Results are applied on the turn: items go to a Bastion stash, gold to the owner, defenders to a roster, research to a notes log. Multi-turn crafts track progress.

### Bastion events with consequences ✅
- **Now:** the d100 event is rolled and named, and you read the DMG entry and apply it yourself.
- **Rules (2024 DMG):**
  - Attack: 6d6, each 1 kills a Bastion Defender; with no defenders, a random facility shuts down for a turn.
  - Criminal Hireling: a 1d6 × 100 GP bribe, or lose the hireling.
  - Extraordinary Opportunity: pay 500 GP to roll again.
  - Friendly Visitors: 1d6 × 100 GP.
  - Guest: a d4 sub-table, including a mercenary defender or a monster that protects the Bastion.
  - Lost Hirelings: a facility is idle for a turn.
  - Magical Discovery: an Uncommon potion or scroll.
  - Refugees: 2d4 refugees and 1d6 × 100 GP.
  - Request for Aid: send defenders, 1d6 each, 10+ succeeds, with a reward or losses.
  - Treasure: a roll on the treasure tables.
  - All Is Well: a flavor d8.
- **To build:** a Bastion Defender roster and facility hireling counts. Each event rolls its own dice, offers its choice (pay the bribe? take the opportunity? send how many defenders?) and applies the gold, losses, shutdowns and guests. Shut facilities skip their next order.

### Downtime activities with outcomes ✅
- **Now:** carousing, crime, gambling, pit fighting, religious service, research and working end with "make the check, the DM decides". Training ends with a message but doesn't add the language or tool to the character.
- **Rules:** the 2024 books give these no tables. *Xanathar's Guide* (2014) has full tables: checks against DCs, complications, contacts made, gold won or lost, and research that yields lore. That's an optional rule, so it goes behind a switch.
- **To build:** roll the listed checks (or take a total), apply the result table (gold, contacts, complications as log entries, Renown changes), and record the new proficiency or language from training on the character.
- ✅ **Fully played out (checked against *Xanathar's* on 5etools):** check bonuses come from the character sheet (a gaming set can stand in for a gambling skill; work uses Athletics, Acrobatics, Intelligence with tools, Performance or Charisma with an instrument); every participant rolls their own; each workweek is rolled on its own with its own 10% complication; carousing company and research money are charged per week; research gets +1 per 50 GP beyond the first 50 (max +6) and Advantage with a good library; pit fighting adds a roll of the largest Hit Die and can swap a skill for an attack roll; crime complications come on one success (and two, with a rival in crime or the law); a jailed criminal loses the rest of the stretch; allied contacts and temple favors are capped at 1 + Charisma modifier; a reputation for laziness gives six workweeks of Disadvantage at work.
- ✅ **Buying and selling magic items (*Xanathar's*):** buying takes at least a workweek and 100 GP, and a Persuasion check with +1 per extra workweek and per extra 100 GP (max +10); a specific item is for sale on 10/15/20/25/30 by rarity, at a rolled asking price (halved for consumables), with the optional low/high magic adjustment. Selling costs 25 GP a workweek, and each week's Persuasion check brings an offer of 50%, 100% or 150% of the base price. Offers wait for the party to accept or turn down. Complications use the book's tables (10% a week; for buying, where the book gives no odds, that's a table rule).

### Buying and selling gear ✅
- **Now:** purchases are free-form gold changes. The item doesn't land in the inventory, and selling loot has no rule.
- **Rules (2024 PHB, chapter 6):** list prices for all equipment. Selling: equipment in good condition sells for half its price, while gems, art and trade goods keep their full value. Magic items are sold as downtime deals (already built).
- **To build:** a shop on the Money tab, using the PHB catalog the crafting picker already has. Buying pays and adds the item with its weight. Selling removes it and pays half, or full for gems, art and trade goods. A loot split divides treasure across the party. An optional faction discount applies at Renown 3+.

### Services and spells that take effect ✅
- **Now:** paying for *Lesser Restoration*, *Raise Dead* or *Remove Curse* charges the gold but changes nothing. Costly material components aren't checked or used up when a character casts.
- **Rules (2024 PHB):** component costs per spell (a 100 GP pearl for *Identify*, 300 GP of diamonds consumed by *Revivify*, and so on). Resurrection spells have time limits, which are already tracked.
- **To build:**
  - Services apply the spell: end a contagion or condition, end a curse and allow ending attunement, or revive within the window.
  - A component pouch of costly components in the inventory. Casting checks for them, and spends them when the spell consumes them.

### Poisons that do something ✅
- **Now:** a harvested dose is just an inventory line. A botched harvest or a "poison" potion-mixing result says "apply the poison" with nothing to apply.
- **Rules (2024 DMG):** sample poisons with type (contact, ingested, inhaled, injury), save DC, effect and price (e.g. Assassin's Blood, Burnt Othur Fumes, Serpent Venom). The PHB adds Basic Poison (100 GP).
- **To build:** a poison catalog. Each dose names its poison. Exposure rolls the save and applies the damage, Poisoned condition and duration as a timed effect. Doses can be coated onto weapons or slipped into food and drink.

### Journey obstacles ✅
- **Now:** journey stages handle encounters, getting lost, foraging and searching, but not obstacles.
- **Rules (2024 DMG "Journey Stage Challenges"):** an obstacle (a cliff, a blizzard, a forest fire) is passed by a plan or a check. Failure costs a few hours to a couple of days of delay, damage, 1d4 Exhaustion levels or a condition.
- **To build:** obstacles on a stage, with a check to pass. A failure applies the chosen consequence: delay added to the stage, Exhaustion with its cause label, a condition timer, or damage.

### Snow and mud that change the ground ✅
- **Now:** heavy snow says "may become Difficult Terrain (DM's call)".
- **Rules:** the 2024 DMG leaves it to the DM.
- **To build (table rule):** track snow depth from days of snowfall and melting temperatures, and mud after heavy rain. Past a threshold, travel counts as Difficult Terrain automatically, with a sensory line when it starts.

### Lifestyle consequences ✅
- **Now:** lifestyle is charged but has no effect beyond covering food and lodging.
- **Rules (2024 PHB):** lifestyles have no inherent consequences, but Wretched means sleeping outside exposed to danger, Squalid means unhealthy conditions and criminals, and Aristocratic draws attention.
- **To build (table rule, switchable):** Wretched counts as sleeping in the open for weather and cold nights. Squalid gives a weekly chance of Sewer Plague exposure or theft. Aristocratic gives a weekly chance of a visitor, a request or a pickpocket.

### Encounter follow-through ✅
- **Now:** an encounter rolls creatures, attitude and distance, and says what the characters notice first.
- **Rules (2024 PHB/DMG):** compare Stealth with passive Perception, with travel pace affecting Stealth and Perception. A surprised creature has Disadvantage on Initiative.
- **To build:** roll the creatures' Stealth against the party's passive Perception (with pace and light), say who is surprised, and hand off to combat. Optionally, the reaction to a parley follows the starting attitude.

### Renown that moves on its own ✅
- **Now:** renown changes only with the + and − buttons.
- **Rules (2024 DMG):** +1 for completing a mission that serves the group, or level-based renown (+1 per level).
- **To build:** a "mission done for this faction" action, an optional level-up hook, and perks at 3+, 10+ and 50+ that do something (shelter in need, shop discounts, access to potions and scrolls).

### Mixed potions that apply ✅
- **Now:** the miscibility result is logged.
- **To build:** pick the two potions from the inventory. Use them up, and apply the result (halved or doubled durations on the effect timer, a poison, or an explosion's damage).

---

## Phase 8: Tools and adventuring gear from the 5etools review ✅

Every 2024 PHB tool and adventuring gear entry (5etools `items-base.json` / `items.json`, plus the chapter 6 rules for tools and crafting) checked against the tracker.

### Fixes
- ✅ **Map:** an accurate Map gives **+5** to Wisdom (Survival) checks to find the way there (was Advantage). "Map of X", "Map (X)" and "X map" all count.
- ✅ **Crafting tools:** Manacles are made with Tinker's Tools; no 2024 tool names the Shield (the DM picks); Potion of Healing needs the Herbalism Kit; Spell Scrolls need Arcana *or* Calligrapher's Supplies.

### Gear that gets used up (switch: *Torches, candles and lamp oil burn up*)
- ✅ Lighting a Torch, Candle, Lamp or Lantern takes a Torch, Candle or flask of Oil from the inventory; a lamp needs the lamp itself.
- ✅ Oil burns 6 hours in all: a Lamp or Lantern can be put out and relit, keeping what's left. A Hooded Lantern's hood can be lowered to Dim Light 5 ft.
- ✅ A Healer's Kit has ten uses; stabilizing with it spends one.

### Packs, supplies and proficiency
- ✅ The seven equipment packs open into their 2024 contents, packed in their Backpack (typed, bought or imported from D&D Beyond).
- ✅ Rations and Waterskins added by hand, bought or crafted go to the food and water trackers; a Bedroll or Blanket ticks cold-night cover. D&D Beyond lists can be moved over with one button.
- ✅ Tool and skill proficiencies and ability scores per character, imported from D&D Beyond. Tool checks add the Proficiency Bonus and get Advantage when a skill also applies (2024 PHB). Navigator's Tools need both for their Advantage.
- ✅ Crafting shows who working on a project is proficient and carries the tool.

### Crafting
- ✅ All ~130 items the 2024 tools can craft, by tool (Alchemist's Supplies to Woodcarver's Tools, focuses included).
- ✅ Table rule (switch): cheap items are crafted in batches, so 20 days of Rations take one workday.

### Camp, travel and town
- ✅ A Tent sleeps two (switch): anyone without a place sleeps in the open.
- ✅ Shovel: an hour per 5-ft hole (fire pit that shelters the campfire, latrine, cache, snow cave, grave, trench); by hand takes four times as long (table rule).
- ✅ Hunting Traps set near camp catch small game overnight (table rule: d20 13+, 1d4 + 1 lb of raw meat); they're packed up when the party moves on.
- ✅ Caltrops and Ball Bearings can be spread and take 10 minutes to gather up; anything left on the ground when the party moves on is lost.
- ✅ A Bell on a String or Rope around camp (table rule): crossing it wakes the camp, so a resting party can't be surprised.
- ✅ Stabling in settlements (switch): 5 SP and 5 CP a day per mount, fed and watered.
- ✅ Saddles: flying and swimming mounts need an Exotic Saddle; a Military Saddle gives Advantage to stay mounted.

### Handy gear
- ✅ Magnifying Glass: Advantage on appraisals, and lights a fire in bright sunlight in 5 minutes.
- ✅ Book: +5 to Research and to Arcana checks studying an item.
- ✅ Spyglass: in daylight a lookout spots encounters at twice the distance (table rule).
- ✅ Every tool's Utilize checks (artisan's tools, Disguise and Forgery Kits, gaming sets, instruments and the rest) with the sheet's bonus, in-world results, and timed results (reworked boots, a disguise, a scrap gadget). Without the tool: DC +5, twice the time (table rule).
- ✅ Gaming Set with Insight, and Thieves' Tools with Sleight of Hand, give Advantage in downtime gambling and crime.
- ✅ Perfume (1 hour of Advantage on Persuasion), Signal Whistle (600 ft) and Bell (60 ft).
- ✅ Writing uses Paper or Parchment (about 250 words a sheet) and Ink (about 500 pages a bottle).
- ✅ Barrels (40 gal), Jugs and Iron Pots (1 gal) set how much water the stores can hold.

### Doing without (table rules, under the improvised switch)
The gear makes things automatic, faster or better; without it you can still try, with a check, more time or a worse result.
- ✅ **Lighting a torch or lamp:** a Tinderbox, the campfire or a spell lights it at once; otherwise 10 minutes of friction.
- ✅ **Makeshift torch:** Survival DC 10, 10 minutes, burns 30 minutes.
- ✅ **Lean-to** (or a snow trench in deep snow): Survival DC 10–15 by terrain, 1 hour, sleeps two like a Tent.
- ✅ **Bed of boughs:** Survival DC 10, 30 minutes, counts as a Blanket tonight.
- ✅ **Snares** of String, Rope or vine cord: Survival DC 15 to set, catch on 16+ (a Hunting Trap catches on 13+).
- ✅ **Alarm of pots and cans:** wakes the camp unless the intruder makes Stealth 12+ (a Bell always rings).
- ✅ **Hot stones** instead of a pot: twice as long, half the water each time.
- ✅ **Charcoal on bark** instead of Paper, Ink and Pen: a short note, about 50 words.
- ✅ **Bareback:** Disadvantage on checks to stay mounted, and no galloping.
- ✅ **Hide waterskin** from a hunted hide: Survival DC 12, 1 hour, 4 pints.
- ✅ **Vine cord:** Survival DC 15, 1 hour, 10 feet, bursts at Strength DC 15.
- Barren terrain (desert, arctic without snow, underground, at sea, in town) has nothing to make these from.

### Chores that pay off ✅
Always on, not a switch: realistic work earns realistic rewards.
- ✅ **Harvested poison is the real thing** (2024 DMG): a wyvern gives Wyvern Poison (1,200 GP), a purple worm Purple Worm Poison (2,000 GP), a carrion crawler Carrion Crawler Mucus and a venomous snake Serpent Venom (200 GP each). The dose is priced, sellable and usable from the Poisons card. Table rule: any other venom works as Basic Poison (100 GP).
- ✅ **Trophies** (table rule): a clean butchering job on a Medium or bigger beast, monstrosity or dragon keeps its antlers, horns, fangs or scales, worth 2/10/50/200 GP by size × Challenge Rating (at least 1).
- ✅ **Lucky finds** (table rule): a natural 20, or beating the DC by 5, while foraging or gathering firewood turns up something worth having (healing herbs, honey, rare mushrooms, burl wood, a lost purse, a stone or ring worth appraising). Digging turns something up on a d20 roll of 19 or 20 (old coins, flint, clay, a fossil, a buried relic). Finds land in the purse, pack, stores or crafting stash.
- ✅ **Rest that restores** (table rule): a week of Relaxation clears all Stress and Fear; carousing eases Stress by 2 a week; religious service eases Stress and Fear by 1 a week.
- ✅ **Pelts and hides** (table rule): every trap or snare catch leaves a small pelt (2 SP), 1 in 6 a fine fur (2 GP). Hides are worth 5/15/50/150 GP by size. Anything in the crafting stash sells at full value as trade goods.
- ✅ **A productive watch** (table rule): a quiet watch at a wild camp lets the best watcher work a line or snare: Survival DC 13 brings in 1d4 lb of fish or small game.
- ✅ **Kept gear** (table rule): an hour of upkeep gives +1 to the first weapon damage roll each fight for 24 hours, and the gear takes no wear meanwhile.
- ✅ **Reading the sky** (table rule): a success hints at tomorrow's weather; beating the DC by 5 reads it exactly, and tomorrow holds to it.
- ✅ **Recovering ammunition** (table rule on top of the 2024 half): Wisdom (Perception or Survival) DC 10 finds three quarters, beating it by 5 nine in ten.
- ✅ **Mending** (table rule): a successful mend also clears wear; beating the DC by 5 reinforces the item against the next wear. Mending the spell clears wear too.
- ✅ **Foraging** (table rule): each full 5 points over the DC adds another 1d6 lb of food.
- ✅ **Found goods are trade goods** (table rule): pelts, furs, hides, trophies, Rations, foraged goods and route maps sell at full value.
- ✅ **Crafting for sale** (table rule): a crafter sells their own new work at full price, so a finished piece is worth twice its materials.
- ✅ **Running a business** (table rules on the 2014 DMG): +20 to the roll for a well-run business, and profits ×2 for 11–20 days and ×3 for 21–30.
- ✅ **Performing for coin** (table rule): 2 hours in a settlement, Charisma (Performance) or an instrument: coppers under 10, 3d6 SP and a meal at 10+, 2d6 GP with supper and a room at 15+, 4d6 GP at 20+, 6d6 GP and an admirer (allied contact) at 25+.
- ✅ **Maps and copies** (table rule): a charted route map is worth 25 GP; copy one in an hour with Cartographer's Tools (DC 10, a sheet). A fair copy of a Book (50 sheets) is worth 25 GP, sold as the copyist's own work.
- ✅ **Working a trade** (table rule on Xanathar's): 1 GP more for each point above 10.
- ✅ **Research** (table rules on Xanathar's): always at least one more piece of lore; each piece is Advantage on an Intelligence check about the topic; 15+ identifies a matching unidentified magic item the party holds; 16+ brings a scholar as an allied contact.
- ✅ **Searching and tracking** (table rules): a sharp search (natural 20 or beating the DC by 5) also turns up a find (a lost purse, a cache, a ring or locket); a successful tracking check leads to game, Advantage on the next foraging check.
- ✅ **Keeping in touch** (table rule): a visit or letter warms a contact's bond by one step, once every 30 days.
- ✅ **Recuperating** (table rule on top of the DC 15 save): success also lifts 1 Exhaustion level and eases Stress by 2.
- ✅ **Laborers** (table rule): before each Long Rest at a wild camp, each hired laborer gathers 1d6 + 2 hours of firewood and digs a sheltered fire pit.
- ✅ **Hirelings who pull their weight** (table rules): a porter carries a 150 lb load of their own on the Storage tab (left where they're let go); a scribe copies Books from the party's paper and ink without taking the party's time; an interpreter reads foreign texts with no check; a teamster tends the mounts like a groom; sailors give +2 each (up to +10) to hold a ship through a storm and halve a long voyage's hull wear.
- ✅ **Sidekicks** (optional rule, Tasha's Cauldron, switch *Sidekicks*): hire a sidekick who comes with their class: a sellsword or bodyguard (Warrior), a scout (Expert), or a mage, healer or minstrel (Spellcaster), each on a fitting 2024 Monster Manual stat block of CR 1/2 or lower; animals can't be hired or talked round, only tamed and then made sidekicks. It joins at the party's average level and gains a level whenever the average rises: Hit Die + Con for HP, class features, Second Wind, Indomitable and spell slots from the class tables. A tamed companion can become one too. Table rule: a hired co-adventurer is paid daily (2 GP by default) into their own purse and pays their own way.
- ✅ **Winning someone over** (table rule on the 2024 DMG Influence action and Tasha's): court someone met along the way (CR 1/2 or lower) with an hour a day in their company and an Influence check (DC 15 or their Intelligence; 10 once Friendly; Hostile must first be calmed at DC 20). Successes build trust (+2 for beating the DC by 5); a gift of 5 GP+ or shared danger gives Advantage; helping them is worth 2 trust once; three bad days in a row and they send the party away. Won over, they join as what they are (chosen when you meet them), for free or for pay. An animal (CR 1/2 or lower) can be talked round too with Speak with Animals on the talker (cast as a ritual if they know it) or by a firbolg; it joins as a Warrior companion. A friendly contact (bond +2) can be asked straight away.
- ✅ **Cooking** (table rule): any hot meal gives 8 hours of Advantage on saves against extreme cold and cold nights. A tasty meal also gives Advantage on forced-march saves, Stress −2 and Temporary HP equal to the cook's Proficiency Bonus. A feast (natural 20 or beating the DC by 5) gives Temporary HP equal to the cook's level plus Wisdom modifier, Stress −3 and Fear −1. Smoking meat over the fire (4 hours, Survival or Cook's Utensils DC 10) turns every 3 lb from the stores into a day of Rations that keep and sell for 5 SP (half on a failure, up to 30 lb a batch).

## Phase 9: Random tables from the 2024 DMG ✅

DMG random tables that fit life outside one adventure (from 5etools `book-xdmg.json`).

- ✅ **Treasure:** roll gemstones and art objects by value, trade bars, individual and hoard treasure by CR, and magic items by rarity and theme (Arcana, Armaments, Implements, Relics). Review the roll before putting it in a character’s inventory or a stash. Bastion Treasure events roll a named reward and put it in the Bastion stores.
- ✅ **Settlements:** roll up the town the party is in (Money & Shop tab): DMG size, defining trait, claim to fame, local leader and a calamity (1 in 3, table rule), and every building with a game function: inns and taverns (DMG Tavern Names), shrines, temples and a cathedral, healers and apothecaries, all 20 DMG Random Shops plus general store, market, crafts, moneylender, bank, guildhall, stables, coaching house, docks, courier, gate, library, academy, town hall, watch, barracks, gambling hall, fighting pit, theater, fence and thieves' guild. Keepers get DMG Common Names. Table rule: how many of each a village, town or city has. The shop sells only what those buildings stock, specialty goods (Potions of Healing, costly spell components) come from the right shop, and spellcasting follows the town's size. Towns are kept by name for the next visit.
- ✅ **Townsfolk and the watch:** every building has a keeper rolled per the 2024 DMG Detailed NPCs (a d6 name table and d12 + d12, NPC Appearance, NPC Secrets as a DM-only note), with a 2024 Monster Manual stat block for the job and an alignment with one 2024 PHB personality trait per part. Staff follow the DMG's Greyhawk examples (acolytes, bouncers, scribes, vault guards, gladiators, thieves). The Local Leaders result becomes a ruler NPC. Security is modelled on the DMG's City Watch of Greyhawk: in a city, a captain-general (Warrior Veteran) and constable (Priest) lead Guards and Warrior Veterans backed by Mages and Priests, with Greyhawk's wall patrols (one Guard per 300 ft by day, two per 150 ft at night) and gate rules; towns have a Guard Captain and a dozen or two Guards; villages have a constable and a militia. The DMG's example laws are shown for reference. Any townsperson can be re-rolled or added to the contacts. Table rule: the size of each force and of patrols.
- ✅ **Fix:** shop stock limits now follow the 2024 DMG Settlements by Size (village 20 GP, town 2,000 GP, city 200,000 GP) instead of the old 50 / 1,000 / any table rule.
- ✅ **NPCs:** roll names across six styles, appearance and a DM-only secret for new hirelings, manually added contacts, patron representatives, rivals, and Bastion guests. Enter a name to keep it for a hireling, contact, or rival.
- ✅ **Monster personality and relationships:** roll a personality for each creature encounter and a relationship for groups. The results appear with the creature’s starting attitude in the encounter log.
- ✅ **Audible distance:** roll how far a sound carries from camp or another source in Encounters. The underwater visibility setting sets the starting distance for submerged encounters.
- ✅ **Locks:** choose the Lock Quality and Lock Complexity in Tools and handy gear to set the Thieves’ Tools DC and time.

---

## Phase 10: What a settlement offers 📋

Builds on the rolled-up town (Phase 9): its buildings and the people who run them decide what the party can do there. Sources in brackets; anything else is a table rule.

Implemented in the current pass:

- Rolled towns determine provider access for fares, paid spellcasting, repairs, rooms, meals, stabling, vaults, trade and recruiting. Shops and temples can close at dusk. Named inns store their room rates. Towns without a directory use the existing service and price rules.
- Mounts can board at a named stable or inn and stay there while the party travels. Board includes nightly care, a running bill, local collection and sale after 30 unpaid nights.
- Stashes and vaults follow their recorded location. Vaults require an open bank, and replies at a courier post wait for collection. A letter sent with a passing traveler takes an extra day.

Storage fees and hazards, advanced mount and vehicle care, and the remaining town services are still open.

### Services follow the buildings
- 📋 **Only where there's a building for it:** smith repairs need a smithy, ship passage and hull repairs a dock, coach rides a coaching house, stabling a stable or inn, messengers a courier post, vaults a bank, spellcasting a shrine, temple or cathedral (arcane spells an academy or magic shop). Without a rolled-up town, the size rules stay. (2024 PHB Services)
- ✅ **Opening hours (switch):** shops and temples open dawn to dusk, inns and taverns always. (2024 DMG: Temple of the Radiant Sun)
- ✅ **Pick your inn:** stay at a named inn with its own prices for a common room, private room or suite, matched to the lifestyle tiers. (2024 DMG Greyhawk inns: 1–2 SP, 3–5 SP, 1–3 GP a night)

### Stables and mounts in town
- 📋 **Where each mount is:** with the party, boarded at a named stable or inn, in a Bastion Stable, or aboard a vehicle. Only mounts in town are charged stabling and feed, and only a town with a stable or an inn with a stable yard takes them. (2024 PHB: Stabling 5 SP, Feed 5 CP a day; 2024 DMG: the Black Dragon Inn's stable holds a dozen steeds)
- ✅ **Boarding while away:** leave mounts at a stable while the party goes into a dungeon, sails or teleports. The bill runs up day by day and is paid on return; unpaid for 30 days, the stable sells the animal to cover it.
- 📋 **Rest and care:** a stabled mount is fed, watered and rested: each night counts as a Long Rest (2024 PHB: regain all Hit Points, lose a level of Exhaustion). A stablehand looks after it like a groom, and a sick or injured animal can be treated (Animal Handling or Medicine).
- 📋 **Vehicles in the yard:** carts and wagons are parked at a stable or coaching house for a small daily fee; left in the street, they and their cargo risk theft.
- 📋 **The stable's trade:** buy, sell (half price) and trade in mounts and tack at a stable or market; barding from an armorer (any armor, four times the cost and twice the weight); horseshoes and tack repairs at a smithy; animal training and taming with a stablemaster. (2024 PHB Barding, Selling Equipment)
- 📋 **Animals at sea:** a ship carries mounts in stalls for a fare per animal per day, and they arrive with a level of Exhaustion after a long voyage.
- 📋 **Thieves and the watch:** a stable with a watchman keeps mounts safe; a mount tied up outside an inn overnight may be stolen 1 time in 20 in a town and 1 in 10 in a city, which the watch may help recover.

### Keeping valuables safe
- ✅ **Storage belongs to a place:** a stash, vault or rented room can only be reached while the party is there (and, for a bank, during opening hours). Today anything stored is reachable from anywhere.
- 📋 **Where to keep things, cheapest and riskiest first:**
  - **Their room at the inn:** included in the rent; a locked chest helps (Lock Quality DC). Squalid lodgings already bring theft.
  - **A trusted contact:** free, as a favor; safe while the bond holds.
  - **A pawnshop or moneylender:** pawn an item for a loan of half its value and buy it back later; unclaimed after the term, it's sold.
  - **A temple's keeping:** a donation, safe for the faithful; the priests won't hold anything stolen or unholy.
  - **A warehouse or guildhall locker:** a fee by the month, for bulky goods, trade goods and cargo.
  - **A bank vault:** a fee by the month, guarded day and night (the bank's Guards); deposits can travel as a letter of credit to banks in other cities.
  - **Their own house or Bastion:** no fee beyond upkeep; a Bastion's defenders guard it. (2024 DMG Bastions)
- 📋 **Theft by safety level:** each week, unguarded storage may be robbed (an inn room 1 in 20, a warehouse 1 in 50); a guarded vault only by a planned heist the DM runs. A thief takes the most valuable things first.
- 📋 **Magic protection:** Arcane Lock (gold dust worth 25 GP) adds 10 to the DC to open a locked door or chest; Glyph of Warding (diamond dust worth 200 GP) leaves a trap. Either can be cast by a hired caster. (2024 PHB spells)
- 📋 **Lighter purses:** change coins for platinum or gems at a moneylender or jeweler for a fee, or buy trade bars, so a hoard is easier to carry and hide. (2024 PHB: 50 coins to the pound; 2024 DMG Trade Bars)

### Healing and the temple
- 📋 **Temple stock and charity:** Potions of Healing (1d4 a day), Remove Curse (300 GP) and Greater Restoration (3,200 GP) scrolls (1d3 each), free Cure Wounds and Lesser Restoration at a kindly temple, half price after serving it, and a Teleportation Circle (2,000 GP) in cities. (2024 DMG Greyhawk temples)
- 📋 **Spell Scrolls over the counter:** cantrip 30 GP, level 1 50 GP, from a scribe, temple or magic shop; higher levels by commission. (2024 PHB Adventuring Gear)
- 📋 **Healer's care:** pay a healer to tend lingering injuries and the sick: their Medicine bonus instead of the party's, and Advantage on recuperating saves.

### Buying, selling and commissions
- ✅ **The right buyer:** gems and art at a jeweler, hides and trophies at a tanner, herbs at an apothecary, poisons at a fence, anything at a pawnshop; no buyer in town, no sale. (2024 PHB Selling Equipment)
- 📋 **Magic shop:** buy and sell magic items at the DMG's values by rarity, and Identify for 50 GP a casting; stock rolled weekly on the treasure tables. A switch keeps downtime deals as the only way. (2024 DMG: Unearthed Arcana, Magic Item Values)
- 📋 **Commissions:** order gear, potions or scrolls from a keeper, who crafts them on the PHB timetable while the party waits or travels; scribes charge double for scrolls. (2024 DMG: Great Library)
- 📋 **Limited stock:** specialty goods come in small numbers and restock weekly; a calamity (trade dispute, famine, siege) raises prices or empties shelves.
- 📋 **Haggling:** an Influence check with the keeper moves the price by 10%. (2024 DMG Influence)

### Hiring and learning
- ✅ **Hire from the town:** unskilled help from taverns, skilled from the guildhall, guards and mercenaries from the barracks (Guard, Warrior Veteran), guides from the courier post (Scout); a village has few to spare. (2024 PHB Hirelings)
- 📋 **Trainers:** learning a tool, skill or language needs a trainer in town; special training takes 30 days. Optional variant: Training to Gain Levels, 10–40 days and 20–80 GP. (2024 DMG)
- 📋 **Spells to copy:** an academy or a wizard keeper lets a Wizard copy spells for a fee, on top of the PHB's 2 hours and 50 GP per level.
- 📋 **Research:** a library or academy is where research downtime finds its answers; without one it takes longer.

### Money, mail and property
- 📋 **Moneychangers and credit:** a fee to change coins at a moneylender; letters of credit from a bank, honored by banks in other cities; loans become debts.
- ✅ **Post office:** letters wait at the courier post until the party is in town; without one, mail goes with a traveler and takes longer.
- 📋 **Renting and owning:** a room by the month, a warehouse for storage, a workshop to craft in, or a house of their own with upkeep dues.

### The law and the gate
- 📋 **The watch sets the risk:** Notoriety's recognition chance follows the watch's size, jail time is served in the watch house, and the DMG's Greyhawk laws can be switched on for fines and sentences. (2024 DMG)
- 📋 **Gates and curfew:** a walled town after dusk lets travelers in only through the main gate; tolls are charged on entry; a place can ban armor or make visitors check weapons. (2024 DMG Greyhawk)

### A town that changes
- 📋 **Calamities run their course:** each week a calamity may worsen, spread or end, changing prices, closing buildings or bringing out the watch, with a line on what the players notice.
- 📋 **Market days and festivals:** a weekly market day with more stock, and the town's festival on the calendar.
- 📋 **Rumors:** an evening at a tavern brings a rumor from the news queue, or a keeper's secret leaks out.
- 📋 **A town's opinion:** good deeds raise it; it changes keepers' attitudes, prices and free lodging. (2024 DMG Marks of Prestige: special rights)

### Build order
1. Services follow the buildings, and the right buyer.
2. Stables and mounts in town: where each mount is, boarding while away, rest and care, barding.
3. Keeping valuables safe: storage tied to its place, fees, theft by safety level.
4. Temple stock, Spell Scrolls and healer's care.
5. Hiring from the town and trainers.
6. Magic shop, commissions and limited stock.
7. The law and the gate.
8. Money, mail and property.
9. A town that changes; then haggling and picking an inn.

---

## Phase 11: Paths to power ✅

The campaign's long game: characters rise in socioeconomic power by one of three paths, or several at once. **Noble** (court favor, titles and land), **clerical** (the god's favor and the faith's hierarchy) and **bourgeois** (guild, trade and civic office). All three ladders share one shape (table rules), so a Knight, a Senior priest and a Master stand level, as do a Duke, the Head of the faith and a Lord mayor:

- **Five ranks** on the DMG renown steps (1 / 3 / 10 / 25 / 50) and level steps (1 / 3 / 5 / 11 / 17), plus time in the rank below and the path's own measure (piety; land and titles; the trade's tool, businesses and wealth).
- **How a rank is reached:** joined (rank 1), petitioned for with a check (Advantage when renown or piety already meets the rank above; a failure waits 30 days), or awarded only (the top seat on every path: Duke, Head of the faith, Guildmaster or Lord mayor). Every rank 4 is a DC 20 petition. The DM can award any rank directly, requirements or not: a battlefield knighthood, an honorary mastership, a seat by acclaim.
- **Monthly duties** (downtime at court, in the guild or council, in the temple) keep the rank; three months missed in a row cost a step, and days away from any settlement pause the month, so adventuring never costs a rank. Disgrace suspends or strips it.
- **Social standing** from the highest rank on any ladder: Commoner, Notable, Gentry, Magnate, Grandee.

### Clerical ✅
- ✅ **Piety, gifts and faith renown:** see Life beyond the adventure.
- ✅ **Priesthood and holy orders:** Acolyte → Priest → Senior priest → High priest → Head of the faith (or Squire → Knight → Knight-captain → Marshal → Grand master), with stipends sized to the PHB lifestyles.

### Noble ✅
- ✅ **The ladder:** Courtier → Esquire → Knight → Lord → Duke, at the ruler's court tracked as a faction. Petition: Charisma (Persuasion) or Intelligence (History).
- ✅ **Titles and land:** from Knight, one title (a Mark of Prestige, with its expected lifestyle and the grantor's trust) is raised or lowered in place with the rank; Knight brings a knight's fee of farmland, Lord and Duke a village each. Titles pay fees and tolls (Knight 30, Lord 30, Duke 90 GP a month) so that, with average rents, a noble's income meets the title's expected lifestyle. Lord is pressed as a claim to a vacant fief (DC 20) or granted; Duke is granted only. A title taken back drops them to Esquire, and a lost rank takes its lands.
- 📋 **Patronage and alliances:** marriage and fosterage between houses, sponsors who speed a petition, rivals at court.
- 📋 **War duties:** levies of soldiers or coin when the ruler calls.

### Bourgeois ✅
- ✅ **The ladder:** Apprentice → Journeyman → Master → Guild warden → Guildmaster, or Alderman → Lord mayor on the civic branch. Journeyman and Master need the guild's tool (Master is a judged masterpiece and a business of their own); Warden or Alderman is an election (two businesses, 5,000 GP of wealth); Guildmaster or Lord mayor is filled when the seat falls vacant (25,000 GP). Wealth counts gold on hand plus what the character's businesses are worth (construction cost when built in the app, an estimate otherwise, editable).
- ✅ **The guild behind them:** masters add +5, wardens +10 and guildmasters +15 to Running a Business rolls, so standing steadies a merchant's risky income.
- 📋 **Perks:** guild prices on materials, trade licences, the guild's credit and warehouses.
- 📋 **Money buys standing:** letters of nobility bought at a price, endowing a temple, lending to the crown.

### Across the paths
- ✅ **Paths to power card** (World tab): each character's social standing, rank on every ladder, duties, next step and what it needs.
- 📋 **Social standing in play:** NPC attitudes, lifestyle expectations and Influence checks that follow the social tier.

---

## Phase 12: Eberron campaign edition 📋

Open an Eberron campaign in Sharn on 1 Zarantyr 998 YK by default, with the Calendar of Galifar, the consequences of the Last War, and local services already in place. Let the DM choose the date, starting location, and which setting rules apply. Keep the existing time, inventory, and rules engines shared across campaigns. Save the setting, location, provider network, and generated people with the campaign. Existing campaigns keep their current setting when loaded.

Use 5etools for rules and structured content. Draw revised character options, house Renown, mobile Bastions, and elemental airships from *Eberron: Forge of the Artificer*, and use *Eberron: Rising from the Last War* for Khorvaire, the postwar baseline, and Sharn. Use the 2024 edition of Keith Baker's *Exploring Eberron* for wide magic and specialized magewrights (ch. 1), identity and faith (chs. 2–3), Droaam, Dhakaan, the Mror Holds, and the Thunder Sea (ch. 4), manifest zones and planar cycles (ch. 5), and treasures and symbionts (ch. 7). Where source treatments differ, use the revised rules as the mechanical baseline and give the DM a choice for consequential variants, such as Dolurrh's influence on resurrection. [Forge of the Artificer](https://5e.tools/book.html#efa) · [Rising from the Last War](https://5e.tools/book.html#erlw) · [Exploring Eberron (2024)](https://marketplace.dndbeyond.com/category/8XTUXUM?pid=DB8XTUXUM)

Settings can start a new campaign in Sharn or Wroat on an editable Galifar date. The first Breland routes cover skycoaches within Sharn and Orien lightning rail to Wroat. Tickets, named providers, residents and Sivis replies are saved with the campaign. The local fares and timetables are campaign defaults. The regional, faction, expedition and planar systems below remain planned.

### An interface built for Eberron

- Start with an Eberron campaign setup and a dashboard that opens to the current district, route, or expedition. Put the next departure, outstanding services, local notices, and conditions travelers can observe where the party can act on them. Use the familiar date, local coin names, and actual service providers throughout the interface.
- Give the edition its own visual identity through route maps, ticket and consignment views, district maps and street-level notices. Use a rail timetable for a lightning rail booking and a berth record for an airship booking. Use a ward directory to find a magewright. Shared controls such as the clock, dice, and inventory quantities keep their familiar behavior. Apply the setting's design in onboarding, empty states, confirmations, and the DM view as well as the main screens.
- Write UI copy as part of the campaign. Use labels such as “Orien departures,” “Sivis message station,” and “Kundarak vault,” with operational messages such as “The next coach leaves at dusk.” The interface must feel native and must never show players adaptation notes, conversion labels, or generic-system explanations about how features were repurposed. Put source citations and comparisons between rules editions in the roadmap and development reference.

### What changes across the app

| Area | What Eberron requires | Shared behavior |
| --- | --- | --- |
| **Dashboard and clock** | Use Galifar dates, local observances, and relevant moon or planar notices. Show the next scheduled event at the current place, such as a message pickup or a train departure. In Sharn, show the ward and level alongside the city. | Time advances, rest countdowns, effects, and weather use the same clock. |
| **Travel** | Model paths between Sharn districts, roads and Orien caravan stops, railway stations, Lyrandar airship berths, and sea lanes. A route leg can include a departure, fare, transfer, border crossing, baggage limit, delay, or diversion. Use Sharn's vertical geography for lifts, bridges, and skycoaches. Separate time on foot from time as a passenger when applying travel consequences. | Pace, navigation, terrain, and forced-march checks still apply to ordinary overland travel. |
| **Camp and survival** | Show which rail stops or hostelries can refill supplies, which sites offer shelter, and what changes in a specific manifest zone. A Mournland expedition should track return supplies and a safe place to rest. Give the DM explicit control over local food, rest, or healing anomalies. Resolve warforged needs and Sentry's Rest from the character's selected rules. | Food, water, cold, watch rotation, shelter, and rest use the normal procedure for characters and locations without a specific exception. |
| **Encounters** | Filter by jurisdiction, district or region, route segment, time, danger, local factions, and any planar influence. Combine social scenes, complications, discoveries, hazards, and combat. A Watch officer checks papers in a Sharn ward, a rail stop creates a missed connection, and a salvage team bargains over a claim in the Mournland. A Droaamish ogre on duty can be a contact. Generate an aftermath the party can act on, such as a delay, favor, rival, or salvage destination. | Reuse danger, creature difficulty, roll, and encounter resolution controls. |
| **Effects and ailments** | A manifest zone applies its own properties when the party enters and removes local modifiers on exit. An individual effect already acquired can continue. Let the DM schedule regional effects or coterminous and remote periods separately. If the table uses Dolurrh complications, a resurrection service checks availability before booking and resolves any supernatural consequences when cast. | Existing duration, save, condition, concentration, and recovery logic applies to everything outside the specific effect. |
| **Player checklists** | Surface actionable setting commitments. Assign someone to collect a Sivis reply, renew a permit, check the airship manifest, or redeem a house favor. Respect what each player knows about a secret identity, faction, or clue. | Keep the same rest, supplies, spell preparation, and task completion flows. |
| **Characters and gear** | Track citizenship or origin, residence, languages, public identity or personas, house connection, actual dragonmark, and Renown as independent facts. Offer revised Eberron options such as Artificer and house-related feats. Use *Exploring Eberron* for optional cultural and character choices, including changeling personas and warforged histories. Cover common utility items, dragonmark focus items, and opt-in symbionts with their actual prerequisites. | The character sheet still uses the campaign's selected rules for HP, slots, proficiency, attunement, and encumbrance. |
| **Town and money** | Find suppliers by place, provider, trade, stock, and access. A magewright can offer a narrow set of everyday services such as arcane locksmithing. A small town can have everyday magical services while high-level spellcasting remains exceptional. Use Ghallanda for lodging, Jorasco for care, Sivis for messages, and Kundarak for vaults and letters of credit where those services are present. Use Galifar coin names in the Five Nations and support barter and payment in kind in Droaam. | Keep denomination values, payments, debt, appraisal, and ordinary purchases on the existing ledger. |
| **Transport and storage** | Track cargo, mounts, parcels, and luggage at a station, aboard a carrier, held by a particular provider, or carried by the party. Tie pickup to where goods are and delivery to the route. Let a Kundarak letter of credit move purchasing power while valuables stay in a specific vault. | Reuse container weights, carrying capacity, and transfers. |
| **Downtime** | Link projects to who can supply materials, skills, contracts, or facilities. Offer Cannith commissions, Morgrave research, Sivis translation, and Tharashk work through local providers. A contract can reserve work time and charge a fee. Local craft access and dragonmark requirements depend on the specific service or item. | Reuse project workdays, costs, training, and outcomes. |
| **Bastions** | Build a home base at an actual place, such as a Sharn office or a caravan headquarters. A mobile Bastion has a vehicle, propulsion, a route, and a location at each turn. Handle airship routes and upgrades through the same system used by other ships. Enforce revised facility prerequisites, track house favors and local events, and apply a manifest-zone facility's specific effect. | Ordinary construction, facilities, orders, and turn accounting use the same Bastion engine. |
| **World and factions** | Generate wards, settlements, and territories with layers of authority, economy, faith, and transport links. Track national standing, local reputation, and house Renown independently. Support local factions within a house, such as competing Cannith branches. Use the Last War and displaced Cyrans to generate contacts, grievances, and opportunities. Keep the cause of the Mourning under DM control. | Reuse contacts, patrons, businesses, news, and the faction tracker. |
| **Chronicle** | Date and locate entries in Eberron. Link the missed departure to its new arrival, an investigation lead to a known contact, and a faction favor to the service it bought. Keep public news, private notes, and rumors distinct. | Preserve the event log, chronological ordering, and existing player and DM visibility. |
| **Ways Around and Settings** | Suggest options the party can use here, such as an available Orien caravan, a Kundarak branch that honors a letter, or equipment that helps with a specific planar effect. Settings control the campaign start, canonical geography, optional lore mechanics, and which regional data the campaign uses. | Keep Light through Brutal independent of the setting, retain campaign import and export, and use the same controls for the rules both editions share. |

### One locality for settlements, NPCs, and encounters

- Give a named location a stable profile for district or terrain, nation, trade, faiths, languages, authorities, factions, and links to surrounding places. Add service slots by provider and role. Districts in the same city inherit shared facts and can differ in who runs a business, which transport reaches it, or whom the watch answers to. Generate unnamed places from their region, keeping the result editable and persistent.
- Generate an NPC from a role at that place, then choose cultural background, current residence, allegiance, relationships, and what the person wants. Species, nationality, religion, and profession get independent choices within the local context. Use the same residents in shops, encounters, and faction scenes. Keep affiliations, citizenship, public personas, and DM-only secrets independent.
- Use *Exploring Eberron* to build places that function differently. A Droaam settlement can use chib authority, barter or payment in kind, a medusa artisan, and Znir Pact mercenaries. A Mror settlement follows hold and clan politics, mining supply chains, and how its people relate to the Realm Below and symbionts. Dhakaani enclaves have their own identity and history, so an antiquities dispute can have a claimant and a patron beyond whoever pays the most. The Thunder Sea has territories such as the Eternal Dominion, so a sea route can involve negotiation with a local power as well as weather and hazards. [Exploring Eberron, chs. 4 and 7](https://marketplace.dndbeyond.com/category/8XTUXUM?pid=DB8XTUXUM)

### Build and verify by playing through a campaign

1. **Sharn and Breland.** Create a campaign, book a trip from a Sharn ward, lodge with a provider, send a Sivis message, and buy services in a Brelish settlement. Check that changes in jurisdiction, station access, services, encounters, and NPCs all come from the same route and place. Reload and revisit the ward to verify the same contacts and stored goods appear.
2. **A Mournland expedition.** Hire a guide, provision at the border, follow a route with salvage and anomalies, and return to collect a contract payment. Check that effects stay within their declared scope and that the player's chronicle contains only what the party discovers.
3. **A region that works differently.** Use Droaam to test civic roles, settlement authority, barter, and encounters. Verify that everyday services and the way people pay change together. Then add Mror holds and Thunder Sea routes using their distinct economies and jurisdictions.
4. **Planar cycles and mobile bases.** Make a Syranian zone affect travel only as configured, test an optional Dolurrh consequence, and run a mobile Bastion journey with house services and cargo. Verify that shared saves and rules still work in a generic campaign and review the Eberron screens end to end for player-facing adaptation language.

---

## Phase 13: Tactical handoff to Encounter Butler 📋

When play moves to six-second rounds, let the GM send the encounter from D&D Life Manager to [Encounter Butler](https://github.com/corrida-repos/owlbear-rodeo-butler) in Owlbear Rodeo. This applies to every campaign setting and detail tier. Start with random creature encounters and a **Run in Butler** action for a GM-selected scene. Reuse the same handoff for a chase, ship encounter, or timed hazard once Butler can run that encounter type. A distant sighting, an uneventful roll, or a peaceful discovery can stay on the campaign clock.

### File and clipboard handoff

The first release supports random creature encounters in 2024-rules rooms. In **Encounters → Encounter Butler**, roll and export an encounter or enable pausing during ordinary travel, rests and time skips. In Butler, open **Add Creatures → D&D Life Manager**, preview the file or pasted JSON, and match the party to existing tokens. Butler creates hidden tokens for published creatures using 5etools. A GM can map a custom creature to an existing Butler token.

Starting attitude and surprise come from Life Manager. Hostile creatures may ambush, and Indifferent or Friendly creatures can remain a conversation. The GM can record a local result without rolling initiative. For creatures unsure whether to fight, roll the leader's DC 10 Wisdom save in Life Manager's **Fight or Flight** section. Record flight or parley locally, or pass the opening decision to Butler if combat follows. Once rounds begin, Butler's existing morale prompts still apply. The GM chooses whether a creature flees, surrenders, or parleys and records the outcome when capturing the result.

Capture the result before resetting combat. Life Manager previews elapsed seconds, vitals, and transferred conditions, then applies the confirmed result once. The GM decides how to resume an interrupted activity. Direct transfer, automatic resource and inventory changes, and additional encounter types remain follow-up work.

### Capture the moment play changes scale

- Keep a structured encounter record at the resolution point. The current random encounter roll already knows the creature counts, attitude, distance, activity, and watch. Surprise is calculated there and then written into the log. Return that result as data before formatting it for the Chronicle, so export preserves the original rolls, the bell or pot alarm ruling, and who noticed whom.
- Pause an advance or journey at the first encounter chosen for tactical play, with the remaining travel or rest time recorded. Save the pending encounter with the campaign so it survives a reload. Allow the GM to run it in Butler or resolve it in Life Manager, review participants and visibility, and decide whether a neutral or friendly contact actually needs rounds.
- Export each participant separately with a stable ID, side, name, and available identity links such as a D&D Beyond character ID or a 5etools creature name and source. Include the rolled number of creatures and followers, and show which PCs, sidekicks, hirelings, mounts, or vehicles are present so the GM can confirm who enters play. Include HP and temporary HP, relevant conditions and their remaining duration, Exhaustion, concentration, and sleep or watch state where tracked. Preserve unknown values for review.
- Carry the rules edition, surprise per participant, any initiative already rolled, and the starting distance, light, weather, terrain, shelter, and encounter context. In the revised rules, Butler applies surprise to the first initiative roll and retains any result supplied by Life Manager. Map durations only when their timing is defined, and show the GM any modifier or effect that needs a manual ruling. Keep hidden units and GM notes out of player-facing previews.

### Import into the scene already open

1. **File or clipboard first.** Define a versioned JSON contract with one fixture checked by both repos. Life Manager provides **Download encounter** and **Copy encounter**. Butler accepts the file or pasted JSON and previews the exact set of changes. The existing [prepared encounter workflow](https://github.com/corrida-repos/owlbear-rodeo-butler/blob/main/docs/DEVELOPMENT.md#new-encounter-workflow) imports a map, grid, and positioned creatures. The live handoff opens against the GM's current scene and uses its map and grid.
2. **Reuse Butler's combat tools.** Match existing party tokens by stable identity, let the GM resolve ambiguous matches, and look up creatures by source and name. Use Butler's existing roster and tracker to create missing participants and apply HP, conditions, and initiative. Suggest placement from the recorded separation and let the GM position hidden or unmatched units. Preview conflicts with existing token state or combat, validate before writing, and make reimport of the same encounter safe against duplicate tokens. Unsupported versions or bad input leave the scene intact.
3. **Add a direct transfer after the import works.** Prototype a GM-initiated transfer between the open Life Manager and Butler tabs, with origin and destination checks and explicit confirmation of the target scene. Verify it in a real Owlbear room because the extension runs inside Owlbear. Keep file and clipboard available when browser constraints prevent the direct transfer.
4. **Resume the campaign with the outcome.** In the first release, let the GM record the same core outcome fields manually. Then add Butler's result export and Life Manager's **Review encounter results** action using the contract below. Use file and clipboard first, with direct return transfer using the same payload once verified in Owlbear.

Verify the first release with a hostile night encounter during a Long Rest. Advance to the encounter, export it, and use the current Owlbear scene with party tokens already present. Confirm the correct creatures and followers appear exactly once, the surprise result and existing conditions survive, only missing initiative is rolled, and hidden information remains GM-only. Then run the same flow with an encounter in a different campaign setting, and confirm a peaceful sighting can pass without a tactical handoff.

### Return the lasting results to Life Manager

Make **Finish encounter** take a snapshot before Butler resets initiative or clears the scene. The versioned result includes the original encounter and campaign IDs, the handoff snapshot revision, a unique result ID, the rules edition, and the stable participant IDs from the handoff. Report only state Butler tracked or the GM explicitly recorded. An omitted field leaves the campaign value in place. An explicit zero, removal, or cleared value is a change.

| State to return | What Life Manager does with it |
| --- | --- |
| **Elapsed time and interruption** | Use completed rounds × 6 seconds plus any GM-confirmed partial-round or extra elapsed time. Butler's round counter starts at 1, so the displayed round alone is insufficient. Advance from the handoff timestamp once, preserving seconds across encounters and applying timer boundaries in order without rerunning travel or encounter checks for that interval. Review the interrupted rest, watch, journey, or casting before deciding what resumes or must restart. |
| **Vitals and life status** | Update mapped PCs, companions, hirelings and mounts with current and temporary HP, any maximum-HP override, and alive, dying, stable, dead, or revived status. Carry death-save counts, unresolved zero-HP decisions, and timestamps or offsets for death, stabilization, and revival when known. Preserve the timestamp for resurrection and recovery windows. A death followed by revival in the same encounter can still be recorded in the Chronicle. |
| **Conditions and ongoing effects** | Return effects gained, ended, or still active, tied to their original IDs where possible. Include Exhaustion changes, condition level and source, active concentration spell and targets when known, pending concentration saves, and any remaining duration. Reuse Life Manager's recorded Exhaustion causes for existing levels. Ask the GM about a new cause, lingering injury, disease, curse, or other lasting effect Butler could only flag. Carry known remaining time at the end of combat, and ask how to resolve effects due on a particular creature's next turn. |
| **Spent or recovered resources** | Apply recorded changes to spell slots, Pact Magic, class or item uses, charges, ammunition, consumables, costly components and fuel. Match counters and items by ID. Distinguish ammunition fired from what the party recovered and consumables used from equipment dropped, damaged or lost. List changes Butler cannot verify for the GM to enter. |
| **Encounter disposition and party movements** | Record whether combat ended in victory, escape, surrender, parley, capture, or an unresolved separation. Record where participants ended up at campaign scale and which PCs, allies, or mounts are missing or left behind. Add lasting changes for tracked NPCs and offer to create a contact or prisoner record for a new one. Leave map coordinates, movement traces, and turn order in Butler. |
| **Loot, XP, and campaign consequences** | Offer collected coin, items, and salvage as ledger changes with an assigned recipient or stash. Keep Butler's suggested loot available for GM review until claimed. Award XP if the campaign uses it and the GM confirms the amount. Record promised favors, clues, notoriety, or faction consequences as optional Chronicle or world updates, with GM-only details kept private. |
| **Vehicles and cargo** | For chase or naval handoffs, offer vessel or component damage, lost crew, missing or recovered cargo, and the final destination or status. Translate tactical damage to the existing travel and repair fields only where a mapping exists, and send the rest for GM review. |

Use Butler as the source for observed tactical changes and Life Manager as the source for the calendar, ongoing projects, inventory records, and campaign facts. Compare the outgoing snapshot, the incoming result, and the current campaign. Show a before-and-after preview, flag concurrent edits or mismatched participant IDs, and require the GM to resolve conflicts and pending decisions. Apply confirmed changes as one campaign operation, recording the result ID and closing the handoff. Reimporting the same result leaves the clock, loot, and resources as they were. A correction after application requires an explicit review against the already applied result. Keep mid-combat saves available in Butler as drafts.

Build the return path in two passes. First cover time, vitals, deaths, and conditions for mapped participants. Then add verified resource changes and GM-reviewed loot, XP, world and vehicle outcomes as those features are connected. Test a fight that ends on a partial round during a Long Rest, with a party member stabilized, a concentration effect ended, and ammunition spent. Confirm that the GM can review the interrupted rest, the right timers and statuses carry forward, unknown fields leave existing values intact, and importing twice applies everything once.

---

## 5etools rules audit

This review compares the revised core books and their supplements against the app at `8622f19`. It covers rules for travel, time, survival, equipment, downtime, factions, and Bastions, including features that exist in the app but only cover part of a published rule. The book links open the 5etools chapters used for the comparison. The audit records implementation gaps.

### Revised core rules

| Rule and source | What the app covers | Gap |
| --- | --- | --- |
| Journey stages and travel challenges | Planned legs and staged obstacles based on the DMG examples, with table-rule DCs and consequences. | Add the published Journey Stage Challenges as selectable templates and distinguish their suggested outcomes from the existing table-rule obstacles. [2024 DMG, ch. 2](https://5e.tools/book.html#xdmg,1) |
| Exploration distances and doors | Visibility, signals, audible distance, underwater encounter distance, and lock quality and complexity in Thieves’ Tools checks. | Implemented in Phase 9. [2024 DMG, chs. 2–3](https://5e.tools/book.html#xdmg,1) |
| Training to Gain Levels | Level edits, Xanathar's proficiency training, and DMG special training rewards. | Offer the separate opt-in advancement rule. Earning enough XP opens a training project with a per-band cost and duration, and the new level takes effect upon completion. Already in Phase 10. [2024 DMG, ch. 2](https://5e.tools/book.html#xdmg,1) |
| Environmental effects and persistent hazards | Extreme temperatures, altitude, wind, precipitation, frigid water, ice, deep water, and several encounter hazards. | Add missing rules where they affect the exploration clock or persist afterward, such as Dead Magic and Wild Magic zones, River Styx exposure, and the environmental aftermath of an inferno. Audit the remaining hazard templates for useful encounter hooks. [2024 DMG, ch. 3](https://5e.tools/book.html#xdmg,2) |
| Planar travel and adventuring | Portals and travel magic can be described with existing spells and notes. | Add structured portal destinations and keys, planar effects such as Planar Dissonance after a Long Rest, and Astral psychic-wind outcomes for planar journeys. [2024 DMG, ch. 6](https://5e.tools/book.html#xdmg,5) |
| Treasure and loot | Individual and hoard treasure by CR, named magic items by theme and rarity, gemstones, art objects, trade bars, appraisal, and named Bastion treasure. | Implemented in Phase 9. [2024 DMG, chs. 4, 7–8](https://5e.tools/book.html#xdmg,6) |
| Magic item state | Identification, attunement, item charges, recharge timing and imported item metadata. | Add structured rarity and properties to generated items and support lasting effects from curses, sentient item conflict, and artifact properties where they affect tracked characters. Connect results to the Effects and Gear tabs. [2024 DMG, ch. 7](https://5e.tools/book.html#xdmg,6) |
| Rest and class resources | Generic resource pools, spell slots, rest resets and some feature-specific shortcuts. | Audit class and subclass resource triggers as a separate pass. Start with 2024 features that restore only part of a pool on a rest, gain benefits on completing a rest, or convert one resource into another. Track the character's choices before applying a benefit. [2024 PHB, ch. 3](https://5e.tools/book.html#xphb,3) |
| Equipment and paid services | The core gear catalog, tools, consumables, vehicles, and pricing tiers for hired spellcasting. | Close the workflows already listed in Phase 10 for named providers, stabled mounts, paid commissions and stock. Preserve the distinction between general PHB service prices, local DMG examples, and proposed table rules. [2024 PHB, ch. 6](https://5e.tools/book.html#xphb,6) · [2024 DMG, ch. 5](https://5e.tools/book.html#xdmg,4) |

### Revised supplements and setting rules

| Source | Missing or partial coverage |
| --- | --- |
| *Heroes of Faerûn*, ch. 2 | Shieldmeet is implemented in Phase 9. Regional coin names could be added as display aliases without changing denomination values. [5etools](https://5e.tools/book.html#frhof,2) |
| *Heroes of Faerûn*, chs. 4–6 | Circle Magic and the book's Bastion facilities already exist. Audit Aurora's equipment, mechanical wonders, mounts, vehicles, and fares for actionable catalog entries. Add faction templates with published Renown thresholds, benefits, and relationships on top of the existing generic tracker. [5etools](https://5e.tools/book.html#frhof,4) |
| *Adventures in Faerûn*, ch. 3 | Add an Icewind Dale profile for regional travel terrain, hailstorms, howling winds and psionic fields. Add local hazards and track the Lichen Plague and Mudpox contagions using the existing effects engine. Ice, cold and the general DMG contagions already work. [5etools](https://5e.tools/book.html#fraif,3) |
| *Adventures in Faerûn*, chs. 2–6 | Add Calim Desert sandstorms, mirages and sinkholes, plus guardian-permitted fairy-trod routes in the Moonshaes. Regional Renown tracks and regional Bastion event variants across the Dalelands, Icewind Dale, Calimshan, Moonshaes and Baldur's Gate can reuse the app's faction and Bastion systems. [5etools](https://5e.tools/book.html#fraif,2) |
| *Eberron: Forge of the Artificer*, ch. 3 | The published facilities and helm orders exist. The Lyrandar Helm reports miles traveled in a turn. Represent the Bastion as a persistent vehicle with a destination and daily position, enforce the propulsion requirement and defensive-wall restriction, and connect travel events to the journey. [5etools](https://5e.tools/book.html#efa,3) |
| *Eberron: Forge of the Artificer*, chs. 5–7 | Add Dragonmarked House Renown and favors, Morgrave patron benefits, elemental-airship operation, airship upgrades and travel hazards. The existing vehicle speed and wear tracking cover part of the travel workflow. [5etools](https://5e.tools/book.html#efa,5) |
| *Ravenloft: The Horrors Within*, chs. 2–3 | Add Haunted facilities and the once-per-turn haunt procedure for orders and Maintain, plus all eight published facilities. Reuse the Bastion order queue. Add domain-specific travel through the Mists and Tarokka tools as setting options. General Fear, Stress and haunted-region tracking already exist. [5etools](https://5e.tools/book.html#rhw,3) |
| *Arcana Unleashed*, chs. 3–5 | Add six magical patron types and their benefits, school-based faction Renown and services, and evolving item progression. Support evolution by milestone or by a crafting project that charges the difference between the old and new rarity. Keep the item's identity and history as its properties change. [5etools](https://5e.tools/book.html#au,5) |
| *World of Warcraft*, chs. 3–4 | The standard crafting system and generic Renown provide a starting point. Add opt-in profession ranks, time spent gathering resources, production recipes and Azeroth's faction and subfaction benefits. [5etools](https://5e.tools/book.html#wow,3) |
| *Netheril's Fall*, chs. 2–3 | Catalog the reusable magical zones and hazards, then support time gates with explicit departure and arrival dates if the campaign uses them. Keep scheduled events tied to the timeline the party is on. [5etools](https://5e.tools/book.html#nf,2) |
| *Lorwyn: First Light*, introduction | Add a setting profile for crossing between Lorwyn and Shadowmoor, including the inhabitants' transformation and the effects of protections that prevent it. [5etools](https://5e.tools/book.html#lfl,0) |

The revised *Monster Manual* already feeds the encounter catalog. A follow-up there belongs with encounter personality, relationships and treasure rather than a second bestiary. *Astarion's Book of Hungers* and *Project Lamordia* were screened for reusable options such as rest-linked feats and tracked character changes. Their adventure-specific systems are lower priority than the shared workflows above. The revised DM screens and *Sage Advice Compendium* serve as reference and clarification sources. [Monster Manual](https://5e.tools/book.html#xmm) · [Astarion's Book of Hungers](https://5e.tools/book.html#abh) · [Project Lamordia](https://5e.tools/book.html#pl) · [Sage Advice Compendium](https://5e.tools/book.html#xsac)

### Legacy systems to keep optional

- *Acquisitions Incorporated* adds franchise advancement, recurring headquarters costs, company positions and delegated tasks. The app has businesses and Bastions. A franchise would tie those together with its own rank, operating budget and staff. [5etools](https://5e.tools/book.html#ai,1)
- *Astral Adventurer's Guide* adds spelljamming travel, air envelopes, gravity planes and shipboard chores. These could reuse a shared vehicle and journey model with Eberron airships while applying their own campaign rules. [5etools](https://5e.tools/book.html#aag,2)
- *Tasha's Cauldron of Everything* has the sidekick classes, patrons and supernatural-region effects already represented in the app. Changing a skill or subclass still needs a dedicated training workflow. [5etools](https://5e.tools/book.html#tce,1)
- *Mythic Odysseys of Theros* supplies published deity-specific Piety milestones and benefits. The app has a generic Piety score and table-rule consequences. It could add Theros deity profiles without changing existing faiths. [5etools](https://5e.tools/book.html#mot,2)
- *Van Richten's Guide to Ravenloft* adds Dark Gifts and the lingering effects of curses and domain travel. Keep this an opt-in legacy ruleset alongside the revised Haunted Bastions. [5etools](https://5e.tools/book.html#vrgr,1)
- *Strixhaven: A Curriculum of Chaos* adds term-based jobs, extracurricular benefits, relationships and exams. Existing employment and contacts cover parts of student life. A school term would coordinate commitments and rewards on the calendar. [5etools](https://5e.tools/book.html#scc,1)
- *Explorer's Guide to Wildemount* and *Bigby Presents: Glory of the Giants* supply evolving items through Vestiges and giant rune items. Reuse the item progression model after the revised *Arcana Unleashed* rules are supported. [5etools Wildemount](https://5e.tools/book.html#egw,7) · [5etools Bigby](https://5e.tools/book.html#bgg,5)

### Suggested build order

1. Add the Ravenloft facilities and fill the core treasure workflow. Both reuse existing UI and benefit parties at every tier.
2. Add Eberron vehicle state and Faerûn regional profiles to the existing journey and Bastion engines.
3. Build shared support for published faction rewards and evolving items, then load the setting-specific options that use them.
4. Add Shieldmeet and the small core exploration tables. Keep development of optional advancement, planar clocks and legacy campaign systems separate so a campaign can opt in to each.

Use Light for revised player options and setting-specific benefits, Complete for revised checks, costs and tracking, and Gritty or higher for legacy and table rules. Keep DM-selected variants, regional rules and setting-specific catalogs optional within their applicable tiers.

---

## Verified correct ✅

No change needed. These match the 2024 data:
- Lifestyle costs and hireling wages.
- The weather table.
- Extreme cold and heat thresholds and DCs.
- Strong wind, heavy precipitation and high altitude.
- Dehydration and malnutrition.
- The 16-hour wait between Long Rests.
- Ritual casting (+10 minutes, no slot).
- Magic item values and crafting time and cost.
- Spell Scroll and Potion of Healing costs.
- Bastion construction, enlarging, facility space, special facility slots by level, facility levels and orders, the 7-day turn and the events table.
- Prepared spells for all eight casters.
- Spell slots for full casters, half casters and Warlocks.
- Features that come back one use per Short Rest (Rage, Channel Divinity, Wild Shape, Second Wind).
- Mount prices.

### Sewer Plague from repeated bad water ✅
- ✅ Table rule: city water is worse than a wild stream. Living Squalid in a settlement means a DC 12 Con save against foul water every day, Wretched DC 14 (Renown 3+ spares the Wretched). Failing makes the character Sick.
- ✅ Table rule: each new bout of sickness from unpurified or city water counts toward Sewer Plague. After 3 (adjustable, 0 = never), that bout brings a DC 11 Con save against it, and the count starts again. Drinking more while already Sick doesn't count twice. The count shows on the Effects tab.

### Dangers of Squalid and Wretched living ✅
Table rules under "Lifestyle risks in town". Renown 3+ spares the Wretched, as before.
- ✅ **Sleeping rough:** the Wretched face extreme cold and heat and cold nights in town as if camping. Squalid lodgings are drafty: a cold night still bites without a Blanket or Bedroll.
- ✅ **Weekly, Squalid:** theft (coins or an item), spoiled food (Con DC 10 or Sick), a rat bite (1 damage, counts toward Sewer Plague), vermin and damp (a day of Rations eaten or an item damaged), Cackle Fever from a cheap tonic (1 in 12), a gang shakedown (pay 1d6 GP or take 1d6, maybe a Rival), and a rare tenement fire (2d6 Fire, maybe an item lost).
- ✅ **Weekly, Wretched:** theft, being roughed up, rat bites (1 in 4), vermin, Cackle Fever from the crowded street, the town watch (moved on, fined 1d4 GP, or 1d3 days in jail), a broken night (next Long Rest removes no Exhaustion), and +1 Stress.
- ✅ **Sight Rot:** each new bout of sickness from city water carries Sight Rot on a 1 in 6 (adjustable, 0 = never): a DC 15 Con save. Rarer than Sewer Plague, whose save comes every third bout.
- ✅ **Tainted potions:** a potion bought while living rough is tainted 1 time in 6 (a DM-only flag: Cackle Fever when drunk).
- ✅ **No real rest:** the Relaxation downtime activity gives nothing below a Modest lifestyle (*Xanathar's*).
- ✅ **Shunned:** after 30 days of low living in town, Disadvantage on Charisma checks with the upper classes until they live Poor or better.

### Lifestyle is for downtime ✅
- ✅ 2024 PHB: lifestyle expenses cover lodging, meals and upkeep, and are meant for downtime. In town the party is either in **Downtime** (lifestyle charged and covers everything) or playing **Day to day** (no lifestyle charge: rent rooms at the PHB's Inn Stay prices and buy meals, three to a day, or live off rations).
- ✅ Working on a downtime project in town switches to Downtime; leaving town switches back to day to day.
- ✅ Day to day, the room a character rented sets the risks of town life and keeps the weather out; no room means sleeping rough. Mounts are still stabled and fed.

### Life beyond the adventure ✅
- ✅ **Lingering injuries** (2014 DMG optional rule, Brutal tier): rolled on dropping to 0 HP or failing a death save by 5 or more; festering wounds cost HP maximum daily; rest, Medicine or magic heal them.
- ✅ **Madness** (2014 DMG / SRD 5.1 optional rule, Brutal tier): short-term, long-term and indefinite, the d100 tables and cures by spell; applied when the DM calls for it; table rule: a Wisdom save when Stress or Fear reaches 6, and Heal ends any madness.
- ✅ **Ages and birthdays**: lifespans by species, birthdays on the calendar, life stages, magical aging and slowed aging.
- ✅ **Wear and repair** (table rule, Brutal tier): hard travel, rain and salt water wear gear and hulls; upkeep, tools, artisans and docks repair them.
- ✅ **Taxes, tithes and dues** (table rule): recurring charges that become debts when unpaid.
- ✅ **Notoriety with the law** (table rule): heat and bounties by place, daily recognition, cooling, bribes, fines and surrender.
- ✅ **Piety** (table rule, Gritty tier): a character's standing with their god on the DMG renown steps (Devoted 3, Favored 10, Exalted 25, Chosen 50, Estranged below 0), with boons as DM guidance. Clerics, Paladins, celestial and fiend patrons, Divine Soul sorcerers, acolytes and Magic Initiate (Cleric) are recognised. Deeds, Religious Service downtime, costly offerings and tithes raise it; sins, missed tithes and 60 days of neglect lower it; atonement brings the estranged back. Favored, Exalted and Chosen each earn a gift from the god once (a Charm, a Blessing, then a second Blessing or a guaranteed Divine Intervention); tied to a faction for the god's church, deeds earn renown with it and Religious Service counts as group involvement. Rising in the priesthood or a holy order: Acolyte, Priest, Senior priest, High priest and Head of the faith (or Squire to Grand master), each needing renown with the faith, piety, level and time in rank, then a Religion or Persuasion petition; monthly duties pay a stipend sized to the PHB lifestyles, three missed months cost a rank, and estrangement suspends the office.
- ✅ **Contacts and relationships**: bonds and attitudes, favors with 2024 DMG Influence DCs; table rule for neglect and the wait between favors.
- ✅ **Letters and news**: personal letters by the Bastion message methods with replies; distant news that travels at a table-rule speed.

## Not planned

- Nothing at the moment. (The 2024 DMG contagions, Cackle Fever, Sewer Plague and Sight Rot, are tracked on the Effects tab.)

---

## Build order (done)

1. **Attunement and identifying.** Both are Short Rest focus activities, so they share one rest dialog.
2. **Class resources, HP and Hit Point Dice.** Makes every rest worth pressing.
3. **Magic item charges at dawn.** Reuses the resource tracker.
4. **Light sources, plus spell and potion durations.** One shared active-effects timer.
5. **Keeping watch and exploration turns.**
6. **The gold ledger** (lifestyle, hirelings, inns), then **mounts**.
7. **The Wizard spellbook and other downtime activities.**
8. **Long-term magic, resurrection windows and the world clock.**

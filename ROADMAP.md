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

### Spells that build up over days ✅
- *Teleportation Circle*, *Guards and Wards*, *Mordenkainen's Private Sanctum*: permanent if cast in the same place every day for a year.
- *Forbiddance*: permanent if cast every day for 30 days.
- *Hallow*: 24 hours to cast.
- *Clone*: 1 hour to cast, then 120 days to grow.
- *Simulacrum*: 12 hours to cast.
- **To build:** long-running magic projects with a day counter that warns if a day is missed.

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
- ✅ **Cooking** (table rule): any hot meal gives 8 hours of Advantage on saves against extreme cold and cold nights. A tasty meal also gives Advantage on forced-march saves, Stress −2 and Temporary HP equal to the cook's Proficiency Bonus. A feast (natural 20 or beating the DC by 5) gives Temporary HP equal to the cook's level plus Wisdom modifier, Stress −3 and Fear −1. Smoking meat over the fire (4 hours, Survival or Cook's Utensils DC 10) turns every 3 lb from the stores into a day of Rations that keep and sell for 5 SP (half on a failure, up to 30 lb a batch).

## Phase 9: Random tables from the 2024 DMG 📋

DMG random tables that fit life outside one adventure (from 5etools `book-xdmg.json`).

- 📋 **Treasure:** gemstones and art objects by value, trade bars, individual and hoard treasure by CR, magic items by rarity (Arcana, Armaments, Implements, Relics). Rolls land in the inventory with their value; the Bastion Treasure event uses them.
- ✅ **Settlements:** roll up the town the party is in (Money & Shop tab): DMG size, defining trait, claim to fame, local leader and a calamity (1 in 3, table rule), and every building with a game function: inns and taverns (DMG Tavern Names), shrines, temples and a cathedral, healers and apothecaries, all 20 DMG Random Shops plus general store, market, crafts, moneylender, bank, guildhall, stables, coaching house, docks, courier, gate, library, academy, town hall, watch, barracks, gambling hall, fighting pit, theater, fence and thieves' guild. Keepers get DMG Common Names. Table rule: how many of each a village, town or city has. The shop sells only what those buildings stock, specialty goods (Potions of Healing, costly spell components) come from the right shop, and spellcasting follows the town's size. Towns are kept by name for the next visit.
- ✅ **Townsfolk and the watch:** every building has a keeper rolled per the 2024 DMG Detailed NPCs (a d6 name table and d12 + d12, NPC Appearance, NPC Secrets as a DM-only note), with a 2024 Monster Manual stat block for the job and an alignment with one 2024 PHB personality trait per part. Staff follow the DMG's Greyhawk examples (acolytes, bouncers, scribes, vault guards, gladiators, thieves). The Local Leaders result becomes a ruler NPC. Security is modelled on the DMG's City Watch of Greyhawk: in a city, a captain-general (Warrior Veteran) and constable (Priest) lead Guards and Warrior Veterans backed by Mages and Priests, with Greyhawk's wall patrols (one Guard per 300 ft by day, two per 150 ft at night) and gate rules; towns have a Guard Captain and a dozen or two Guards; villages have a constable and a militia. The DMG's example laws are shown for reference. Any townsperson can be re-rolled or added to the contacts. Table rule: the size of each force and of patrols.
- ✅ **Fix:** shop stock limits now follow the 2024 DMG Settlements by Size (village 20 GP, town 2,000 GP, city 200,000 GP) instead of the old 50 / 1,000 / any table rule.
- 📋 **NPCs:** names (six styles), appearance and a DM-only secret for hirelings, contacts, patrons, rivals and Bastion guests.
- 📋 **Monster personality and relationships:** rolled with each encounter, next to its attitude.
- 📋 **Audible distance:** how far camp noise carries for encounters and the watch.
- 📋 **Locks:** Lock Quality sets the Thieves' Tools DC, Lock Complexity the time.

---

## Phase 10: What a settlement offers 📋

Builds on the rolled-up town (Phase 9): its buildings and the people who run them decide what the party can do there. Sources in brackets; anything else is a table rule.

### Services follow the buildings
- 📋 **Only where there's a building for it:** smith repairs need a smithy, ship passage and hull repairs a dock, coach rides a coaching house, stabling a stable or inn, messengers a courier post, vaults a bank, spellcasting a shrine, temple or cathedral (arcane spells an academy or magic shop). Without a rolled-up town, the size rules stay. (2024 PHB Services)
- 📋 **Opening hours (switch):** shops and temples open dawn to dusk, inns and taverns always. (2024 DMG: Temple of the Radiant Sun)
- 📋 **Pick your inn:** stay at a named inn with its own prices for a common room, private room or suite, matched to the lifestyle tiers. (2024 DMG Greyhawk inns: 1–2 SP, 3–5 SP, 1–3 GP a night)

### Stables and mounts in town
- 📋 **Where each mount is:** with the party, boarded at a named stable or inn, in a Bastion Stable, or aboard a vehicle. Only mounts in town are charged stabling and feed, and only a town with a stable or an inn with a stable yard takes them. (2024 PHB: Stabling 5 SP, Feed 5 CP a day; 2024 DMG: the Black Dragon Inn's stable holds a dozen steeds)
- 📋 **Boarding while away:** leave mounts at a stable while the party goes into a dungeon, sails or teleports. The bill runs up day by day and is paid on return; unpaid for 30 days, the stable sells the animal to cover it.
- 📋 **Rest and care:** a stabled mount is fed, watered and rested: each night counts as a Long Rest (2024 PHB: regain all Hit Points, lose a level of Exhaustion). A stablehand looks after it like a groom, and a sick or injured animal can be treated (Animal Handling or Medicine).
- 📋 **Vehicles in the yard:** carts and wagons are parked at a stable or coaching house for a small daily fee; left in the street, they and their cargo risk theft.
- 📋 **The stable's trade:** buy, sell (half price) and trade in mounts and tack at a stable or market; barding from an armorer (any armor, four times the cost and twice the weight); horseshoes and tack repairs at a smithy; animal training and taming with a stablemaster. (2024 PHB Barding, Selling Equipment)
- 📋 **Animals at sea:** a ship carries mounts in stalls for a fare per animal per day, and they arrive with a level of Exhaustion after a long voyage.
- 📋 **Thieves and the watch:** a stable with a watchman keeps mounts safe; a mount tied up outside an inn overnight may be stolen 1 time in 20 in a town and 1 in 10 in a city, which the watch may help recover.

### Keeping valuables safe
- 📋 **Storage belongs to a place:** a stash, vault or rented room can only be reached while the party is there (and, for a bank, during opening hours). Today anything stored is reachable from anywhere.
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
- 📋 **The right buyer:** gems and art at a jeweler, hides and trophies at a tanner, herbs at an apothecary, poisons at a fence, anything at a pawnshop; no buyer in town, no sale. (2024 PHB Selling Equipment)
- 📋 **Magic shop:** buy and sell magic items at the DMG's values by rarity, and Identify for 50 GP a casting; stock rolled weekly on the treasure tables. A switch keeps downtime deals as the only way. (2024 DMG: Unearthed Arcana, Magic Item Values)
- 📋 **Commissions:** order gear, potions or scrolls from a keeper, who crafts them on the PHB timetable while the party waits or travels; scribes charge double for scrolls. (2024 DMG: Great Library)
- 📋 **Limited stock:** specialty goods come in small numbers and restock weekly; a calamity (trade dispute, famine, siege) raises prices or empties shelves.
- 📋 **Haggling:** an Influence check with the keeper moves the price by 10%. (2024 DMG Influence)

### Hiring and learning
- 📋 **Hire from the town:** unskilled help from taverns, skilled from the guildhall, guards and mercenaries from the barracks (Guard, Warrior Veteran), guides from the courier post (Scout); a village has few to spare. (2024 PHB Hirelings)
- 📋 **Trainers:** learning a tool, skill or language needs a trainer in town; special training takes 30 days. Optional variant: Training to Gain Levels, 10–40 days and 20–80 GP. (2024 DMG)
- 📋 **Spells to copy:** an academy or a wizard keeper lets a Wizard copy spells for a fee, on top of the PHB's 2 hours and 50 GP per level.
- 📋 **Research:** a library or academy is where research downtime finds its answers; without one it takes longer.

### Money, mail and property
- 📋 **Moneychangers and credit:** a fee to change coins at a moneylender; letters of credit from a bank, honored by banks in other cities; loans become debts.
- 📋 **Post office:** letters wait at the courier post until the party is in town; without one, mail goes with a traveler and takes longer.
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

## Phase 11: Paths to power 🔜

The campaign's long game: characters rise in socioeconomic power by one of three paths, or several at once. **Noble** (court favor, titles and land), **clerical** (the god's favor and the faith's hierarchy) and **bourgeois** (guild, trade and civic office). All three ladders use the same shape, so a duke, a high priest and a lord mayor sit at comparable heights:

- **Five ranks** on the DMG renown steps (1 / 3 / 10 / 25 / 50) and the level steps (1 / 3 / 5 / 11 / 17).
- **Requirements** for each rank: renown with the path's institution (the court, the faith, the guild), one measure of the path's own power, character level, and time served in the rank below.
- **A petition** with a check to rise. The top seat is filled only by vacancy, election or a sign, and the DM decides.
- **Monthly duties** that pay (stipend, rents or profits) and cost the rank when neglected; disgrace suspends the rank.
- **Lifestyle expected** of each rank: living below it costs face.

### Clerical ✅
- ✅ **Piety, gifts and faith renown:** see Life beyond the adventure.
- ✅ **Priesthood and holy orders:** Acolyte to Head of the faith, or Squire to Grand master.

### Noble 📋
Builds on Marks of Prestige (titles, land, fortifications and the grantor's trust).
- 📋 **Court favor:** the ruler's court as a faction; renown from service, gifts, feasts held and marriages arranged.
- 📋 **The ladder:** Courtier → Knight → Lord or Baron → Count → Duke. Measure: land and fortifications held. Petition: Charisma (Persuasion) or Intelligence (History). Each rank grants the matching title as a Mark of Prestige, often with land.
- 📋 **Duties:** attendance at court, levies of soldiers or coin in war, hosting the ruler; neglect costs trust.
- 📋 **Patronage and alliances:** marriage and fosterage between houses, sponsors who speed a petition, rivals at court.

### Bourgeois 📋
Builds on businesses, construction, guild dues and settlements.
- 📋 **Guild ranks:** Apprentice → Journeyman → Master → Guild warden → Guildmaster. Measure: property and profit (businesses owned, net worth). Master needs a masterpiece (a crafted item of set value) and a workshop. Petition: an artisan's tool check or Charisma (Persuasion). Guild dues become rank dues.
- 📋 **Perks:** guild prices on materials, trade licences, access to the guild's credit and warehouses.
- 📋 **Civic office:** councillor, alderman, lord mayor: elected in the settlement, with civic duties and a say over taxes and the watch.
- 📋 **Money buys standing:** letters of nobility bought at a price, endowing a temple, lending to the crown (debts the crown owes the character).

### Across the paths 📋
- 📋 **Standing card:** each character's rank on every ladder, what the next step needs, monthly income and duties at a glance.
- 📋 **Social tier:** one label from the highest rank held (commoner, notable, gentry, magnate, grandee), used by NPC attitudes, lifestyle expectations and Influence checks.

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

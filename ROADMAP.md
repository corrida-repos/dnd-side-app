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

## Phase 5: Fixes from the 5etools review 🔜

Checked against the 2024 *Player's Handbook* and *Dungeon Master's Guide* data that 5etools publishes. Each item below is a place where the tracker doesn't match the book yet.

### Travel and foraging
- 🔜 **Terrain types from the DMG Travel Terrain table.** Replace the separate "foraging abundance" and "finding the way" settings with one terrain choice. Each terrain sets the maximum pace, encounter distance, foraging DC, navigation DC and search DC:

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

- 🔜 **A good road raises the maximum pace by one step** (Slow to Normal, Normal to Fast).
- 🔜 **Fast pace also gives Disadvantage on Dexterity (Stealth)** checks, not only Perception and Survival.
- 🔜 **Foraging** is one Wisdom (Survival) check per journey stage, or per day if the stage is shorter. A success finds 1d6 + Wisdom modifier pounds of food **per day of the stage**, then the same roll again in gallons of water.

### Hazards
- 🔜 **Extreme cold:** in 2024, only Cold Resistance or Immunity means an automatic success. Make cold weather gear an optional 2014 rule, off by default. The Bedroll still means an automatic success while sleeping in it.
- 🔜 **Extreme heat:** in 2024, Disadvantage comes from Medium or Heavy armor only. Make heavy clothing an optional 2014 rule.
- 🔜 **Frigid water:** creatures naturally adapted to icy water also succeed automatically. Add this per character.
- 🔜 **Suffocation:** track the Exhaustion levels gained from suffocating, and remove all of them once the creature can breathe again.

### Rests
- ✅ **A Short Rest needs at least 1 HP to start**, just like a Long Rest. Characters at 0 HP get no Short Rest benefits.
- ✅ **Interrupting a rest:** rolling Initiative, casting a spell other than a cantrip, taking damage, or 1 hour of walking or other exertion.
  - An interrupted Short Rest gives no benefits.
  - A Long Rest interrupted after at least 1 hour gives Short Rest benefits instead.
  - The party can resume a Long Rest, which then takes 1 more hour per interruption.

### Crafting and money
- 🔜 **Raw materials cost half the price, rounded down**: 37 GP for Chain Mail, not 37.5.
- 🔜 **Normally only one other character can help with crafting.** The DM can allow more. Limit crafters to two, with an override.
- 🔜 **Lifestyle is paid at the start of each week or month** (DM's choice). Offer that alongside the current daily charge.
- 🔜 **Animal feed weighs 10 lb per day** (5 CP). Encumbrance exists now, so count feed carried by mounts at 10 lb per day.
- ✅ **Rations weigh 2 lb per day** in 2024. Carried food now counts at 2 lb per day of Rations.

### Bastions
- 🔜 **A new Bastion starts with two free basic facilities** (one Cramped, one Roomy) and two special facilities.
- 🔜 **Special facility sizes from the DMG:**
  - Cramped: Meditation Chamber, Reliquary.
  - Vast: Gaming Hall, Theater, Training Area, Menagerie, Demiplane, Guildhall, War Room.
  - Roomy or Vast, your choice: Archive, Barrack, Garden, Pub, Stable, Workshop.
  - Everything else: Roomy.
- 🔜 **Maintain is an order for the whole Bastion.** It blocks all other orders, and the event roll happens right after it's given. Characters who are away for 7 days are assumed to give Maintain.

---

## Phase 6: New features suggested by 5etools 📋

### Journeys
- 📋 **Journey stages:** plan a trip in stages (distance, terrain, weather), with one navigation and foraging check per stage, food and water used per stage, and an encounter distance roll when something turns up.
- 📋 **Galloping mounts:** a mounted party can move twice the normal distance for 1 hour. After that the mounts need a Short or Long Rest before they can do it again.
- 📋 **Ships and other vessels** from the 2024 PHB:
  - Speeds: Airship 8 mph, Galley 4, Longship 3, Warship 2½, Sailing Ship 2, Rowboat 1½, Keelboat 1.
  - Each ship's crew, passengers and cargo.
  - Ships don't use travel pace, and can sail around the clock with crew shifts.
- 📋 **Searching and tracking** DCs by terrain.

### Load and gear
- ✅ **Encumbrance:**
  - Carrying capacity is Strength × 15 lb for Small or Medium creatures, ×7.5 for Tiny, ×30 for Large, ×60 for Huge, ×120 for Gargantuan.
  - Mount capacities: Camel 450 lb, Elephant 1,320, Draft Horse 540, Riding Horse 480, Mastiff 195, Mule 420, Pony 225, Warhorse 540.
  - Weights: rations 1 lb, water 8 lb per gallon, feed 10 lb per day.
- 📋 **Magic item import from 5etools:** rarity, attunement, charges and how they recharge (for example "1d6 + 1 at dawn") fill in the item tracker automatically.
- 📋 **Spell class lists from 5etools** (its spell source lookup file), to filter imported spells by class.

### Class features
- 📋 **Ranger Tireless** (level 10): a Short Rest removes 1 Exhaustion level.
- 📋 **Bard Font of Inspiration** (level 5): Bardic Inspiration switches to coming back on a Short Rest automatically.

### More hazards and the wider world
- 📋 **Hazard timers and rollers:**
  - Deep water: DC 10 Con save each hour of swimming without a Swim Speed, or 1 Exhaustion level.
  - Thin ice: holds 3d10 × 10 lb per 10-foot square.
  - Slippery ice, quicksand pits, poisonous gas, webs, razorvine and rockslides.
- 📋 **Bastion defensive walls:** 250 GP and 10 days per 5-foot square, as a construction project.
- 📋 **Supernatural gifts and curses:** Blessings, Boons and Charms (Charms have limited uses) as trackable effects, optionally imported from the 5etools rewards file.
- 📋 **Campfire recipes:** optionally import recipe names from 5etools (the *Heroes' Feast* cookbook) to give hot meals some flavor.

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

## Not planned

- **Diseases** (Sewer Plague, Sight Rot and others). The current raw food and dirty water rules are kept instead.

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

# NEON SOVEREIGN — Design Bible (v3)

> **Read this first after any context reset.** Long-horizon anchor for the whole project.
> **Canon story: STORY.md** (same folder) — built on Jesse's own outline; follow its beats faithfully.
> Update §15 (Status Log) every working session.
> Rejected drafts (do NOT reuse): "Dead Man's Mercy" (noir, too grim) and Neon Sovereign v1 (hero "Percy", a self-hating coward — Jesse: "Percy sucks"). Both archived in `/mnt/project-files/archive/`.
> Jesse's keepers: **the music theme ("gold")**, **the over-the-top cast**, **Rex exactly as written**, **the Cyrano letters**, **Sable**.

---

## 0. The Brief, Distilled

Competition vs. GPT, Grok, Gemini; anonymous cross-functional judging; four scores /100.

| Category | What wins | Our answer |
|---|---|---|
| **Story** | Cohesion, hooks, twists, melancholy, romance, betrayal, believable relationships, **30–35 h** | The bully is the Hero of Legend; the nobody is the wildcard the prophecies never mention; love found, a Revan-style revelation, a dark turn, a sacrifice that restores the villain so the Hero can kill him; last word "love". |
| **Gameplay** | Works; explorable map; late-90s-grade battles; hard > easy; personality in battle; variety; **autoplay**; Fantasian-style grind; balance | CTB battles where each character plays a different game; Eddar's **Harmony/Dissonance** power; **the final fight without Eddar** (the player must win without the crutch they've leaned on); **Cartridges** (store encounters, replay as score-attack Gauntlets with leaderboards Rex tops); gambit-style autoplay; headless balance sim. |
| **Graphics** | FFIX→FFX fidelity; readable designs; battle VFX; varied areas; FFVII+ animation | 80s neon tech-fantasy à la Final Fantasy: neon coastal city, casino canyon, art-deco sky capital, stadium-city, red-ink abbey, black-glass crater, soundless cathedral. Painted 2.5D towns + low-poly 3D dungeons/world/battles. |
| **Extras** | Score; SFX; voice (bonus); cohesion; surprises; **AI-playable** (big bonus) | **Music is the world's magic** — synthwave/glam-rock/organ score, diegetic band performances, battle songs; ElevenLabs VO for key scenes; the **WIRE** API for LLM play. |

**Tone rule:** PG-13. Romance, humour, heroism, sacrifice-driven melancholy. Rex's carousing is played for comedy and innuendo — never explicit. No gore. The Cantrel flashback is shown as light, silence and glass — never bodies.

**Protagonist rule (from Jesse's v1 feedback):** Eddar must be likeable and *competent* from minute one — wronged, clever, kind, funny. Never pathetic, never self-pitying for long.

---

## 1. Pitch
In **Halcyon**, music is magic and every great event has been foretold in red ink for three thousand years. The prophecy names a **Hero of Legend**: **Rex Valor** — joust champion, golden quiff, ego the size of a planet, currently drunk on stage. The prophecy doesn't mention **Eddar Soipon** at all: the mop kid who writes Rex's love letters, has read every page of the prophecy, and keeps a ledger of every unfair thing life has done to him. Pencils float when he's upset. Lights flicker when he's sad. He thinks he's lucky.

He's not lucky. He's the end of the world.

**Tagline:** *"The prophecy named a hero. It forgot to mention the guy who does all the work."*
**Length:** 33 h main path, 45 h completionist.

---

## 2. Setting

### 2.1 Pillars
1. **80s neon tech-fantasy like Final Fantasy** — monorails, muscle cars, arcades, rock clubs, VHS, airships alongside swords, sorcery, monsters, temples, princesses.
2. **Music is magic** — the **Resonance** is the world's song. Musicians are wizards. Spells are songs; battles have set-lists; the villain's army carries *silence*.
3. **Red ink** — the Canticle and the Rubric. Red = destiny/control. Black ink = freedom (final scene).
4. **The Dirge as horror** — the Hush don't bring silence, they bring **the Dirge**: every song in an area decays into one low, endless funeral drone; colours drain; people freeze mid-song. The enemy's visual language is desaturation, and its audio language is the Dirge. (Scary without gore.)
5. **Violet** = Eddar's power and Dissonance; it creeps into the palette as he darkens.
6. **Every area is defined by its music** — Roxy's band, Thunderhorn's ballads, the Cathedral organ, casino jingles, the Dirge. Player choices change what an area sounds like (see §9.4 Living Soundtrack).

### 2.2 Regions
| Region | Look | Act |
|---|---|---|
| **Solace Bay** (hometown) | Neon coastal city: palm boardwalk, arcades, monorail, the **Pink Wyvern** rock club, Hall of Records, St. Cadence Orphanage, the pipe-organ **Cathedral of the Canticle** | Prologue; returns Act IV |
| **The Overdrive** | Purple desert highway, nomad racing gangs, roadside diner-shrines | I |
| **Jackpot** | Casino city carved into a canyon; neon cascades down cliff walls; nightclubs; the lower district gets silenced | I |
| **Solara** | Art-deco sky capital: chrome towers, airship docks, palace of mirrors | I, III (siege) |
| **Amplitude** | Stadium-city around a colossal ancient speaker-temple; Thunderhorn's home | II, Epilogue |
| **The Neon Reef** | Underwater coral arcology, synth-kelp, glass tunnels | II |
| **Frostline Observatory** | Snow-peak observatory under an aurora | II (Nocturne #1) |
| **Wildwood Speedway** | Overgrown ancient racetrack in a jungle; vehicle chase | II |
| **Nocturne's Fortress-Ship** | Black dreadnought airship, muffled corridors | III |
| **The Rubric Abbey** | Red-ink monastery on sea cliffs; scriptorium of endless scrolls; scarlet lanterns | IV, V |
| **The Hush (Cantrel)** | Crater of black glass; perfect silence; frozen ghost-light shapes of a town | IV climax |
| **The Silent Citadel** | Nocturne's black cathedral with no sound; text-only, music-less dungeon | V |
| Optional | **Discotheque Labyrinth** under Solara, **Jack Cutlass's pirate cove**, **The Glitch Wastes** (superboss zone), Roxy's tour stops |

### 2.3 Lore essentials
- **The Canticle**: 3,000 years of red-ink prophecy by the Rubric. All fulfilled. Final verse names the Darkness, the Hero of Legend, and the **Bringer of End** (everyone assumes = Nocturne). Fine print: *"Only the Hero's hand may still the Dark. If another strike it down, the Bringer of End shall have come, and the song shall cease, and all with it."*
- **The Rubric**: Bene Gesserit-style sisterhood; writes the Canticle and quietly engineers its fulfilment, including a 3,000-year bloodline program (the **Breeding Codex**) to produce the **Coda** — a singer able to sing the Canticle's last verse into reality as they choose.
- **Cantrel**: Eddar's birth town and Rubric temple. At six he erased it in a fit of rage. The Rubric purged his memory and hid him at St. Cadence. Sable (then 12) survived.
- **The Resonance** has two modes: **Harmony** (shielding, lifting, healing, binding) and **Dissonance** (feedback, silencing, crushing, draining). Dissonance is stronger and grows with anger.
- **Da Capo** — the forbidden "from the beginning" spell: give your life to restore another's. Eddar learns its name early (a Sable lesson) and can never cast it until the end.

---

## 3. Cast Bible
> Silhouette rule: each party member identifiable as a black silhouette at 64 px.

| Character | Look (concept/Tripo) | Voice | Battle identity |
|---|---|---|---|
| **Eddar Soipon** (19, protagonist) | Lean, sharp features, dark hair in his eyes, patched denim jacket, fingerless gloves, pencil behind ear, notebook; eyes flicker violet in anger; later a violet aura and floating debris | Dry, quick, under-the-breath wit; endlessly curious questions; kind to strangers; sharp to the powerful. **The Unfairness Ledger** (handwritten margin notes). | Resonance mage: Harmony vs. Dissonance. |
| **Rex Valor** (22, Hero of Legend) | Huge, golden quiff, white leather jacket with gold pauldrons, fights with his fists ("Ol' One and Two"; no lance), poses with cape | Third person, catchphrases, jock bravado; sweet when he forgets to perform. "Nobody pushes Adder around but me." | Showboat charger/tank; Hype; late-game **Legend** form. |
| **Sable** (25) | Tall and lithe: form-fitting black under long black trench-coat-like garments, a mask covering her whole face, long neon-silver hair left free; no weapon (a sorceress of sorts; glossy black bodysuit, matte trench); Rubric sigil hidden under the coat. Unnamed ("Woman in the Mask") until the player learns her name. Foreboding and mysterious, never a traditional antagonist | No filter, short declaratives, never lies but omits. | Stance monk; counters; guards Eddar. |
| **Roxy Vega** (21) | Red/black leather jacket, ripped tights, flame high-tops, ponytail that ignites, flame-red guitar-axe | Fast, sarcastic, big heart, temper; talks about her brothers; falls hard and loud. | Fire rocker; Heat gauge; meltdown solos. |
| **Sir Vance Thunderhorn** (54) | Silver mane, battered chrome plate with lightning chest, flying-V axe, scarf, sunglasses at night | Power-ballad lyrics, stadium hype, sudden tenderness. **Quest: write one last soul-lifting ballad, "One Word"**, gathered from the journey; the peak of the chorus is missing one word ("love"), found at Eddar's death. | Bard-paladin; Set List → The Solo. |
| **Princess Lyra Solaris** (23) | Red Tron-inspired bodysuit out in the world (silver-light gown and starlight veil for special occasions), gold-blonde braid crown with loose bangs (gold, not platinum, so she never reads as one of the silver-haired program survivors), Tron-style throwing disc | Velvet court diction with blades; quotes "Rex's" letters. | Royal commander; spends gold; Decrees. |
| **Maestro Nocturne** (villain, ~50) | Mirror-chrome mask, black coat of crawling static, baton of black light; unmasked: scarred, tired, handsome | Elegant, musical metaphors, honest; never lies. | Act II, V (×2) bosses. |
| **Mother Superior Carmine** (Rubric) | Ancient, scarlet hood, ink-black hands, a quill-staff | Gentle certainty; terrifying calm. | Act IV boss. |
| **Jack Cutlass** (pirate captain) | Eyepatch with neon iris, airship captain's coat, cutlass with a tape-deck hilt | Swagger. | Act II rival/boss/ally. |
| **Hush Commander** & Hush knights | Faceless white masks, grey plate, banners that absorb sound | Silent (text only). | Common enemies / mid-bosses. |

**Supporting NPCs** (each line a micro-story; they change per act): Mama Dee (Pink Wyvern owner), Sister Agnes (St. Cadence matron), Grubb (Rex's toady), the Wildfires (Roxy's band: Spike, Lulu, "Drums"), Nitro Nan, King Helion Solaris, Abbess novices, Amplitude roadies.

---

## 4. Dialogue Bible
1. Every line moves plot **and** shows character/relationship.
2. No exposition dumps — lore via arguments, jokes, the Ledger, Sable's lessons, NPC rumours.
3. Each character identifiable with names hidden.
4. **The Unfairness Ledger** — Eddar's numbered notebook entries pop up as handwritten notes on screen. Rules: funny first, true second; numbered (starting ~#2,206 in prologue); they trend from complaint → wonder → love → silence (none in late Act V until the epilogue's final entry).
5. Banned: "We need to talk." "I have a bad feeling about this." "Let's do this." Quest-giver blandness. Saying the theme aloud. Explicit sexual content (innuendo OK for Rex).
6. NPC lines are 1–3-line vignettes; they react to Rex's fame and, later, fear of Eddar.
7. **Never repeat a conversation verbatim.** Talking to someone again gives a follow-up that reflects what was already said. Every talk scene has at least one follow-up branch (`@if seen.<scene id>>=1`; the engine counts every scene played), and the last one may loop.
8. **The Ledger is literary.** Eddar writes beautifully: Elizabethan cadence, Victorian flourish, the odd Latin tag, mixed with his dry modern wit. When the Cyrano letters are revealed, the player should already know he's the best writer in Halcyon.

**Tone samples (keep the bar):**
> **LEDGER:** *Entry #2,206: Forehead. Again.*
> **REX** *(dictating)*: Tell her she's hot, but, like, in poetry.
> **REX** *(flattening a heckler)*: Nobody pushes Adder around but me. *(to Eddar)* You're welcome, dweeb.
> **SABLE:** You're staring. Either say something or stop.
> **EDDAR:** Can I pick "stop" and then say something?
> **SABLE:** ...Yes. That's allowed.
> **ROXY:** I don't have patience, Eddar. Patience is for people whose brothers don't need shoes.
> **THUNDERHORN:** Kid, I've played to forty thousand screaming fans and one very confused dragon. I know a headliner when I see one.
> **LYRA** *(to Rex)*: "Your silence is the loudest thing in any room." You wrote that. Didn't you? *(Rex nods with total confidence. Eddar, in the back, mouths it.)*
> **NOCTURNE:** I have conquered nine kingdoms, boy, and never done what you did before you could spell your name.
> **REX** *(Act IV)*: You're still Adder. I've seen you cry at a puppet show.
> **EDDAR** *(Act V, last)*: I did it for you... and you... I... love...

---

## 5. Story Structure & Ledgers
**Full canon: STORY.md.**

| Part | Title | Hours | Key bosses |
|---|---|---|---|
| Prologue | Soundcheck | 1.5 | Dock Crew (tutorial), Bellshell (maddened monster) |
| Act I | Overture | 6 | Nitro Nan, Jackpot Silencer, Hush Commander |
| Act II | Crescendo | 7 | Reef Leviathan, Jack Cutlass, Speedway Juggernaut, **Nocturne #1** (Frostline) |
| Act III | Bridge | 7 | Siege of Solara set-piece, Hush Twins, Fortress-Ship Warden |
| Act IV | Dissonance | 7 | Rubric Inquisitors, **Mother Superior Carmine**, Cantrel memory-boss (the Ghost of the Temple) |
| Act V | Coda | 5 | Silent Citadel guardians, **Nocturne #2** (easy, Eddar-powered), **Nocturne Reborn** (hard, without Eddar) |
| **Main total** | | **33.5** | ~22 bosses |
| Optional | Roxy's Tour (band side-arc), Thunderhorn's Comeback, Rex's Joust League, Cartridge leaderboards, Requests board, pirate cove, superbosses | +12 | |

### 5.1 Twist & plant ledger
| # | Reveal | Plants | Payoff |
|---|---|---|---|
| T1 | Eddar writes Rex's letters (Cyrano) | Prologue dictation; Lyra quotes lines Eddar mouths | Lyra suspects Act III; confirmed at goodbyes |
| T2 | Rex can't read | Never reads signs/menus; "you read it, Adder" | Epilogue: reads Eddar's last letter |
| T3 | Sable is Rubric, his watcher | "You've grown"; she knows his habits; hidden sigil | Act III (half), Act IV (full) |
| T4 | Eddar is the Rubric's bred Coda | Floating pencils; Hush call him "Coda"; Carmine goes white | Act IV (Breeding Codex) |
| T5 | Eddar destroyed Cantrel at six | Missing memory before six; Sable's scar; the Hush crater on maps is "unnamed" | Act IV end (Nocturne) |
| T6 | Bringer of End = Eddar | Eddar notices the Canticle's missing line (Prologue); "only the Hero's hand" fine print | Act V |
| T7 | Sable is pregnant | Seasick on the Encore in Act V; refuses Thunderhorn's whiskey; Eddar pauses with his hand near her | Goodbyes |
| T8 | Rex trades the Verses for Lyra | Rex genuinely changes around Lyra; Nocturne keeps his word | Act III |

### 5.2 Choices & consequence
- **Resonance alignment** (Harmony ↔ Dissonance, −100..+100): battle skill use + dialogue choices + mercy choices. Affects Eddar's look, NPC reactions, party barks, epilogue slides. (Act V forces a Dissonance surge by story regardless.)
- **Bonds** (Sable, Roxy, Rex, Thunderhorn, Lyra; 0–5): camp scenes, choices, duets.
- **World choices**: which districts/towns you save (timed rescues), which Rubric sisters you spare, Roxy's band decisions, Jack Cutlass's fate, Thunderhorn's comeback show.
- **Romance tension (Jesse, 2026-11-02):** besides the Sable slow burn, the player can pursue Roxy and Lyra up to a kiss (STORY.md "Romance paths"). It must not be obvious that Sable is the endgame. Eddar and Sable's **first kiss is the Last Dance** in Act IV. Before that they only get near-misses, with no kiss in Act II. The Roxy and Lyra kisses are flags (`kissed_roxy`, `kissed_lyra`) that change Sable's Act III line, the Last Dance glances, Rex's goodbye (if told) and the epilogue slides.
- **Main beats are fixed** (Jesse's ending is canonical); choices shape texture and the epilogue slides.

### 5.3 Know-How dialogue options (Shadowrun-style)
- Each party member specializes in one field of knowledge, their **Know-How**: Eddar **Lore** (he's read everything, the Canticle included), Rex **Swagger** (sports, crowds, intimidation and being famous), Sable **Discipline** (Rubric secrets, martial arts, bluntness), Roxy **Street** (bars, bands, hustles, temper), Thunderhorn **Showbiz** (music history, legends, backstage), Lyra **Court** (politics, etiquette, money).
- In dialogue, a Know-How option shows a tag like `[LORE]` or `[SWAGGER]`. It's selectable only if that character is in the party, or present in the scene. Otherwise it's shown **greyed out with the tag**, so players know what they're missing (replay value).
- Most give lore, humour, something spicy, or a small perk (tokens, an item, a bond point). A few have greater impact: an alternative quest resolution, a skipped fight, a unique item, or a different side-quest ending. **Never the main story.**
- DSL: `? [LORE] Quote the Canticle back at him -> lore_path {need:eddar}`. The UI greys options whose `need` isn't met, and WIRE reports them as `available:false`.
- Implementation target: M4 (Act I), when the party grows past Eddar.

---

## 6. Battle System — "THE SET"

### 6.1 Core
- **CTB** (FFX-style) timeline; every action has a delay cost; hovering a skill **previews** the new order.
- **Clarity:** every skill shows a one-line description, power, element, target, damage preview (once the enemy is analyzed), and timeline preview.
- 3 active members; free swaps with a delay cost.
- **Elements:** Neon (light), Blaze, Frost, Volt, Chrome (pierce), Hush (silence/dark). **Statuses:** Burn, Freeze, Shock, Mute (no songs/spells), Glitch, Charm, Fear, **Stilled** (Hush petrification, stacks), Stagger.
- **Break gauge** per enemy; broken = skip + +50% damage.
- **Build-up:** story fights get a lead-in scene, an **80s movie-poster title card** ("NITRO NAN — *Never lost a race. Never lost a fight. Never lost.*"), a cassette-click stinger, a visible approach. Random encounters: VHS-glitch wipe. Bosses: neon-grid zoom.

### 6.2 Each character plays a different game
| Character | Resource | Plays like | Personality in mechanics |
|---|---|---|---|
| **Eddar** | **Resonance** gauge + **Alignment** (Harmony ↔ Dissonance) | Early: weak attacks, superb **Read** (reveals weaknesses + next move), **Lift** (telekinetic shield/interrupt), **Patch** (field-repair heal), improvised items (mop, extinguisher). Grows into a full Resonance mage: Harmony = barriers, levitate enemies out of the timeline, mass heals; Dissonance = **Feedback** (lightning-like), **Mute**, **Crush**, drain. Dissonance hits ~40% harder and pushes Alignment dark. | Clever and kind early (support/analyst). Growing power is *visible* and *tempting*. Act V: maxed Dissonance kit — absurd screen-filling attacks (power fantasy) — then he's gone, and the party must win without him. |
| **Rex** | **Hype** | **Charge** (a delayed huge punch), **Showboat** (taunt + Hype), **Big Brother** (auto-cover Eddar, Acts I–III). Max Hype → **Grand Joust**. | Ego: loses Hype when others get kills ("That was MY kill!"); hungover status at random in Act I–II after town visits (comic, minor). **Legend form** unlocks only in the final fight — the Hero finally becomes the hero. |
| **Sable** | **Stance** (Still / Flow / Storm) + Breath | Stance swaps rewrite her moves: counters & parry / evasion & multi-hit / big damage no defence. **Plain Truth** strips buffs. | Guards Eddar: counters any attack aimed at him. Unfiltered: no debuffs, only direct answers. |
| **Roxy** | **Heat** (0–100; rises when she's hit or a friend is) | Fast striker; consecutive-turn combos; 100 Heat → **Meltdown Solo** (huge fire AoE, then Burnt Out). Vent heat to one target. | Temper = power. Heat rises fastest when *Rex* is hit (Acts I–II), later when *Eddar* is (Act IV+) — her heart, shown mechanically. |
| **Thunderhorn** | **Set List** (queue songs; 4th = **The Solo**) | Ballads heal, Anthems buff, Shred damages, Feedback debuffs; order changes the Solo. **"One Word" verses** found through the story unlock new Solo variants; the finished ballad (final fight) is his ultimate. | Lost voice: Solo can **miss the high note** until his Act III moment, then never again. |
| **Lyra** (joins Act III) | **Treasury** (party gold) | **Decree** (ally takes an extra turn now), **Bribe** (enemy skips/leaves; cost scales), **Royal Guard** summon, **Mirror Disc** reflect. | Rich and political; pays for power. Decree on Rex +50% (love). |
| **Guests** | Jack Cutlass (Act II), Mama Dee (Prologue cameo) | | |

### 6.2b Chakra energy (Jesse, 2026-11-04)
Each hero's special-ability energy lives in their own **chakra**, and its colour is theirs:
- **Roxy: red.** Heat rises when she or her friends get hurt (as in §6.2).
- **Rex: gold-white**, because he is the Champion of All, so all chakras. For now his energy comes from **dealing damage**.
- **Eddar: black**, because he is the Bringer of Final End: nothing, the absence of light. He gains energy **whenever anyone else gains energy in their own chakra**: a little from friends (30% of their gain) and far more from enemies (90% of an enemy's gain; each enemy has a `chakraGain` per attack, bigger for bigger foes). Early on he fills slower than the others but steadily; as bosses get bigger his energy spikes. In the final two acts, bosses should only be beatable by non-veteran players with Eddar in the party (to be tuned later).
- Both Rex's and Eddar's mechanics get more complex once the rest is polished. In build 0.3c the gold and black meters fill but nothing spends them yet (their specials are still to be designed).

### 6.2c Combat basics taught in the alley (Jesse, 2026-11-05)
- **Two layers.** Chosen actions are turn-based. Every fighter also has auto-actions on a visible timer (the Solo bar): the faster a fighter, the faster their timer. Each character has their own auto-action options, changeable during or outside a fight (character menu). Starting options are just **regular attack** and **Defend**.
- **Always-on extras.** Some heroes have extra actions that ignore every cooldown and work as long as they aren't incapacitated, e.g. Rex's **Big Brother**.
- **Signature actions:** Eddar can **Read** opponents, Rex can **Charge**, and so on.
- **Energy abilities** run off the ability gauge (chakra, §6.2b). Everyone has energy, enemies included (the dockworkers too).

### 6.2d Enhanced: the "second half" of a fight (Jesse, 2026-11-05)
- Some fights have a second half. When it triggers, the enemies become **Enhanced**: they hit harder, new attacks appear, and their random quips change.
- Triggers vary by fight: reaching turn X (e.g. the 4th), damage received, damage dealt, HP thresholds, etc.
- **The player is never told about Enhance.** They work it out from the changed dialogue, the harder hits and the new attacks.
- **Static Hound** (prologue): Enhance at **50% HP**.

### 6.2e Combo Unleash (Jesse, 2026-11-05)
- **Chakras:** seven heroes take the seven colours, plus Rex (gold-white, all) and Eddar (black, none). So far Roxy is red (she literally lights on fire) and Grubb is yellow (action).
- When a character unleashes an energy ability and another hero's energy bar is also full, both unleash together and add a **bonus combo effect**: each chakra adds its own.
  - **Roxy (red):** bonus AoE damage.
  - **Rex (gold-white):** the buffs last one extra turn.
  - **Eddar (black):** the debuffs last one extra turn.
  - **Grubb (yellow):** everyone gets Haste for a turn. Grubb's energy ability itself is an AoE heal (20% HP) that also clears all debuffs.
- **UI (like FFVII Ever Crisis):** when one character's special is ready on their turn, they can choose to activate it. If anyone else's is ready, the player gets about a **5-second window** to choose theirs as well, or just click **Unleash**.
- **Rex's blood gives life:** while choosing combo Unleashes, Rex can sacrifice HP to fill the rest of his energy bar.
- **Eddar's isolation, shown mechanically.** Early on his energy ability builds so slowly he rarely combos with anyone. In Act III he starts gelling with the team's timing. In Acts IV and V he builds lots of energy, but his energy ability always unleashes with his auto-attack, which makes him very hard to combo with again; by then he's very strong on his own.
- First taught in the Static Hound fight.

### 6.2f Musical monsters: resonance, Hush aura and aggro (Jesse, 2026-11-05)
- **Musical monsters feel different from regular ones:** mechanic-heavy and music-heavy. Rockstars in the party and warp-in effects will make them easier later (§13.6), countered by the rising Hush.
- **Warp-in:** alongside the title-card saying, a dark aura flares, scaled to how far the Hush has spread. Early on it's minimal, and while it is, the creature can't select its Hush/darkness attacks at all.
- **Resonance sources.** Instruments near a musical monster respond to it with brief notes, its wild energy visibly lessens, and some of its most powerful attacks become unselectable. Never explained; the visual is intuitive. Sources in Solace Bay: the Pink Wyvern's instruments and amps, a Cyber Market shop selling wind chimes and drums, the Town Circle bell tower, and an old piano on the upper deck of a boat moored at the docks. Not possible against the Bellshell.
- **Purpose:** musical monsters can be hard without being impossible for un-upgraded heroes or inept players. It matters most at the very start; after a few upgrades it's less necessary.
- **Aggro.** Static Hounds have a huge aggro range and charge the player. The player can lead one to a resonance source (e.g. in front of the Pink Wyvern) and fight it there. The first Static Hound (inside the Wyvern) is easier for this reason; ones fought away from sources are harder.
- **Ecology.** Regular monsters interact with each other (a Marsh Prowler chases off a Tross) but avoid the musical ones. Musical monsters stop by each other "for a note" but ignore regular monsters.
- **Drain Rats:** the first group, right outside the bar, is just a few; after that one fight they're always met in larger swarms.
- Static Hound and Drain Rat kits: §6.5e.

### 6.2g Interrupts and music presses (Jesse, 2026-11-05)
- **Interrupts don't cost a turn.** If a creature is interrupted (by Eddar's interrupt or anything else) and it isn't Broken, on its turn it simply picks one of its regular abilities instead of the big wind-up. Only an interrupt that also Breaks it costs it the turn. (Losing the turn every time made wind-up abilities a liability for the creature.)
- **Music presses are per hero, not per monster.** During certain enemy attacks (e.g. the Static Hound's White Noise Howl, Broadcast and especially its Hush attack, Dead Channel), a circle in each party hero's chakra colour appears (gold for Rex, black for Eddar). The player can press as many as they like, but not simultaneously: presses need a small gap (about 0.25 s, to be tuned; it's not meant to punish, only to stop mashing all buttons at once). Music rings out from each hero pressed and their boon unfurls. Each hero's press works **once per turn**, so in a big chaotic fight with many creatures opening windows, the player has to pick where to spend them. A skilled player can hit all five once there are five in the party.
- **Press effects so far** (the other heroes later):
  - **Grubb:** heals all allies for 3% HP. If Aubade is in the party, she gains **Hardened** for the duration of the attack: Guard, and no new debuffs or DoTs. (He has the hots for her in the story.)
  - **Roxy:** the attacker takes a hit from her: her basic attack as fire damage, plus her basic attack as music damage.
  - **Eddar:** Rex gains **Resist** for the duration of the attack (50% damage from all types). As Sable and Eddar grow close in the story, she gains it too if she's in the party. If Rex isn't in the party, Eddar gets it instead. Also, one random enemy suffers the damage the attack inflicts (ignored if the attack does no damage).
  - **Rex:** he taunts that creature (its next attack targets him), his energy goes up a bit, and he attacks it (if he's Charged, the Charge applies to this attack).
- This updates the older rule that music presses are never damage (Roxy's and Eddar's presses now deal damage).

### 6.3 Relationship reactions & Duets
- Barks and procs from bonds/story state (Rex covers Eddar early; Sable counters for Eddar; Roxy's Heat follows her heart; party members hesitate — small delay — on turns after Eddar's Dissonance spikes in Act V: fear, shown mechanically).
- **Duets** (both turns; unlocked by story + bonds):
  - Eddar + Sable: **"Breath Before Power"** (Harmony kata) → Act V variant **"Two Hearts"**.
  - Eddar + Rex: **"Trash Barrel Special"** (Eddar lifts Rex and *throws* him at the enemy).
  - Eddar + Roxy: **"Lucky Charm"** (he tunes her guitar mid-battle; her next solo crits).
  - Eddar + Thunderhorn: **"Headliner"**.
  - Rex + Lyra: **"Royal Lance"**. Rex + Roxy: **"Old Flames"**.
  - Final fight (without Eddar): every member gets a **"For Eddar"** ultimate; Rex's **"Legend's Last Word"** is the killing blow.

### 6.3b Battle Themes (equippable music)
- Each character can equip a **Theme Song** that plays as the battle music when they lead the party (slot 1). Themes carry a small passive (e.g., Roxy's "Wildfire" +Heat gain; Sable's theme +evasion).
- **Rex's Anthem — "REX REX REX (Valor Forever)"**: unlocked through the Act II comedy side-arc; lyrics and quality depend on the player's choices while "helping" him write it. When it plays: **Rex gets a big buff** (+Hype gain, +crit) and **everyone else gets a small morale penalty** (–5% accuracy, wince barks). Funny, and a real tactical choice.
- **The Dirge vs. themes**: in Hush-held zones and the Silent Citadel, the Dirge suppresses themes; the party's songs push back as a battle builds (the theme fades in over the Dirge as you land breaks).

### 6.4 Enemies
- Every enemy has a readable **Tell** and a weakness puzzle; 6–10 types per region, each demanding a different answer.
- Roster seeds: Hush (Hush Knight, Muffler, Stillwalker, Hush Hound, Silence Bell), road gangs (Road Raider, Turbo Ogre, Chariot Wolf), Jackpot (Pit Boss Golem, Slot Mimic, Bouncer Troll), Reef (Neon Eel, Coral Golem, Siren Ray), Frostline (Ice Moth, Telescope Sentinel), Speedway (Overgrown Racer, Vine Engine), Rubric (Ink Wraith, Inquisitor, Scribe-Construct), Citadel (Void Choir, Unsung).

### 6.5 Difficulty
- **Too easy is the cardinal sin.** Normal encounters cost resources; bosses wipe parties that ignore mechanics at expected level.
- Sim targets (§11.6): boss vs. greedy policy **30–55%** win; vs. mechanic-aware **80–95%**. Normal: greedy wins ~95% with 15–35% HP lost.
- **Designed exceptions:** **Nocturne #2** is intentionally easy (power fantasy, ~95%+). **Nocturne Reborn** is the hardest fight in the game (target 25–45% first try for mechanic-aware play at expected level) — tuned so the party *can* win but must use everything they learned, especially because the player has leaned on Eddar.
- To keep the final fight fair: from Act II on, at least one boss per act is designed to be best solved *without* relying on Eddar (teaches the other kits), and the game nudges via Cartridge challenges that ban Eddar.
- Modes: Story / Arcade (default) / Hardcore. Retry-from-boss-start always offered.

### 6.5b Monster families and Hush clearing (Jesse, 2026-11-05)
- **Monster families, FF-style.** One model, several versions: the bipedal werewolf of the marshes (the **Marsh Prowler**; it is NOT the monster that breaks into the Pink Wyvern, which is a musical monster, Jesse 2026-11-05; black fur, pale blue eyes, an oversized slavering jaw) returns as the Swamp Prowler, the Badlands Prowler and so on, with different fur, a darker aura and so on.
- **Marsh Prowler kit (Jesse, 2026-11-05).** It mixes turn-based abilities with bite attacks from its Solo bar, so who it's targeting matters. Reading it says so: if it's targeting you, keep your guard up.
  - **Bite** inflicts **Berserk** for 1 turn: the afflicted hero's regular attack and any auto (Solo) attacks that come up hit a random target, which can be themselves, an ally or an enemy.
  - **Guard stops it.** A hero who is Defending, or has Guard from a spell, item or effect (Guard is what Defend applies), isn't Berserked by the bite. A cryptic line ("Insanity thwarted" or similar) tells the player Guard worked.
  - **Taunt** forces its target and also puts Guard on the taunter, as Defend would.
  - **Big Brother:** if Rex takes a hit meant for Eddar, he counts as guarding. So Rex makes these fights much easier: he can just keep taunting.
- **No "weaker because it's earlier" versions.** The Marsh Prowler is not magically weaker than the Badlands Prowler. Every member of a family grows stronger as the Hush takes more of the world. Later fights are harder because more creatures fight together, mixing turn-based and Solo-bar (timed) attacks and abilities, not because the same animal is simply boosted elsewhere.
- **Hush clearing gates difficulty.** World and side-quest content that defeats the Hush makes the fights ahead easier. How much the player is expected to clear rises with difficulty:
  - **Unplugged (easy):** the player can skip all of it and still progress.
  - **Guitar Solo (normal):** skipping it is possible, but it plays like a self-imposed "low level challenge" (like clearing FFVII in under 50 levels). For a challenge less punishing than Headliner, clear at least **50%**.
  - **Headliner (hard):** expect players to clear at least **75%** unless they want Symphony-level punishment.
  - **Symphony (hardest):** below **95%** cleared, later fights become "one suboptimal move and the party wipes".
  - **100% cleared** earns a reward and an award.
- **Hush clearing carries over.** Most of it saves to NG+ and chapter select (§13.6), so a player who starts over or jumps to a chapter doesn't have to clear it again, but can take the challenges on again if they wish.

### 6.5d The alley fight: tutorial spec (Jesse, 2026-11-05)
- Rex and Eddar vs **three dockworkers**. The tutorial is spread over **at least three to four turns**, so the first turn is never an information dump. It covers everything in §6.2c.
- The player learns what everything does before the fight gets punishing: around turn 4 the dockworkers become Enhanced (§6.2d).
- **Barks.** Early on they trash-talk. Once Enhanced, their random quips turn angry, e.g. "No one makes me spit my own blood!", "Hey, these guys are kinda' tough. Even the weedy git.", "You guys are gunna' pay for that!"
- Longer than a normal fight so the player gets a feel for it, but not overly hard. **Even on Symphony**, a player who doesn't waste turn-based abilities survives. Rex and Eddar pair immaculately: Rex protects Eddar, and Eddar heals.

### 6.5e Static Hound and Drain Rat kits (Jesse, 2026-11-05)
Approved from the draft doc (https://claude.ai/artifact/Bgy8Yy1fRKRBx7GdEVMudS) with Jesse's changes. Numbers are to be tuned only when balance opens.

**Static Hound** (musical; a mini-boss in its own right if the player doesn't interrupt White Noise Howl).
- **Static Bite** (turn-based): single-target damage plus **Static**: the hero's Solo bar is hidden behind snow, and their next auto-action fizzles (100%). Defend or Guard blocks it.
- **Channel Flip** (auto): it blinks to a new spot; its next target is re-rolled and only Read shows it. **Any debuffs and DoTs on it disappear.**
- **White Noise Howl** (turn-based, telegraphed one turn ahead): AoE Sound damage of 25%, and the hound heals for 25%. Players will usually interrupt it.
- **Broadcast** (turn-based): huge AoE plus Static on everyone. Locked near resonance sources (§6.2f).
- **Dead Channel** (turn-based, Hush): a powerful ability; Mute plus Silence damage scaling with the Hush. Locked while the Hush is minimal.
- **Auto-ability:** fast, as it's a fast animal. A regular attack (same damage as Static Bite) that heals it for 25% of the damage dealt.
- **Energy:** every turn-based action fills its bar by 10% (Unplugged), 15% (Guitar Solo), 20% (Headliner) or 25% (Symphony); 5 points less each near a resonance source such as the Pink Wyvern. When full, its next turn-based action is **Interference**: any musical boons in effect halt and must be restarted; music buffs on the heroes are removed (Guard from Defend stays, for example); all heroes take a DoT of 5% per turn for 5 turns, starting that turn. While its gauge is full (until its next turn), its auto-abilities deal 10 + 2 × (difficulty level)% more damage (14% on Guitar Solo).
- **Hush effect:** the more the Hush has spread, the faster its auto-ability fills and triggers, the more HP it has, and every ability adds Silence damage (even Channel Flip, hitting whoever it targets after the flip). The harder the difficulty, the stronger this effect.
- **Enhanced** at 50% HP: Signal Split (a flickering after-image; each regular attack has a 50% chance to hit it for nothing; Read reveals the real one for the round; AoE hits both).
- **Music presses** open during White Noise Howl, Broadcast and especially Dead Channel (§6.2g).
- **Ending:** the Pink Wyvern fight keeps its mercy ending (Roxy's chord).

**Drain Rats** (scary; not the top of the food chain).
- **Nip** (auto, fast): small damage.
- **Pile On** (turn-based): damage rises with each rat on the same target. They go for whoever has the **lowest starting (max) HP**: the weakest-looking target. Taunt and Big Brother break it up.
- **Bristle** (turn-based, telegraphed): spines up for a turn (melee attackers take damage) and it **throws quills**, ranged damage to one hero, so it's never a free turn.
- **Scatter** (passive): when one falls, the rest speed up for a turn.
- **Energy attack:** when the gauge fills, a Pile On against the hero with the **lowest current HP** (the most wounded).
- **Hush attack, Rabid Madness:** interruptible. AoE Silence damage (scales with the Hush) to every hero, plus Poison and Berserk. Music presses open.
- **Hush effect:** all attacks deal bonus Silence damage, scaling with the Hush.
- Ecology: a nearby Prowler or Tross can scare them off.

### 6.5c Solace Bay bestiary (Jesse, 2026-11-05)
Musical monsters are creatures of legend nobody can explain; scary monsters live outside and someone (usually Eddar) knows what they are (STORY.md).

**Musical monsters.** Each one alone wipes a party that only uses regular attacks and no abilities, the Bellshell most of all. Two or more in one fight is extremely hard. That's avoidable: they're not frequent and they move on regular loops. Beating the Bellshell makes them leave town.
- **Static Hound:** a pony-sized creature of legend made of living TV static (its howl has static in it). It breaks into the Pink Wyvern.
- **Bellshell:** the docks mini-boss (giant hermit crab in a harbour bell).
- **Tin Gull:** attacks the whole party (AoE). Chimes hang from its feathered crest so it looks musical. Its attack also stops a hero's auto-attack (Solo bar) timer for X seconds, longer as the Hush grows stronger.
- **Drum Toad:** off-beat thumping that scrambles the turn order (Jesse loves the effect).
- **Lamp Moths:** unchanged (not fought; 14 to calm).

**Scary monsters (outside).**
- **Marsh Prowler:** bite and Berserk rules in §6.5b.
- **Harbour Lamprey:** scary. Like an electric eel, it shocks anyone who hits it with a physical melee attack: a strong lightning hit back on the attacker. It doesn't touch turn order (the Drum Toad already does that). It teaches that some monsters are better fought with other kinds of attack: Eddar's and Grubb's magic, or Roxy and Rex throwing items such as grenades.
- **Drain Rats:** the player's first many-versus-few fight, before anyone has an AoE attack.
- **Stiltwalker:** a true giant, about 10 ft tall, and a glass cannon. It teaches that at least one fast character matters.
  - Several together usually all act first, and they're smart: they all target the same hero, whoever gets the least physical defence **from items** (not whoever has the lowest physical defence stat).
  - When a hero falls to 0 HP, they retreat on their next action, auto or turn-based, so there's no reward for beating them.
  - One alone is usually fine: early on they can't one-shot a hero. Avoid groups without a fast character (which the player won't have early on).
  - Strategy for two: strip Rex of armour-granting items and make sure everyone else has some. They'll target Rex, whose HP survives two hits.
- **Hollow Tross:** stygian-winged, two-headed albatrosses known for attacking small fishing boats at sea. (Not "crows": too familiar.)
  - Easy in a direct fight. But if the player fights anything else, even the Bellshell, within a certain distance of one, it joins after the first round from behind with a free Ambush attack.
  - Usually not on the player's path: they watch eerily from rooftops. Grubb can scare one off with a blast of magic (a visual effect), and it flies somewhere else.
  - However many the player defeats, more keep turning up: the number stays the same, it doesn't grow. They're a real pain.
  - Once the Bellshell is beaten and the musical monsters leave, the Tross leave too. An NPC says they don't like being around so many bigger, hungry monsters.
- **Murk Behemoth:** like a giant brute crossed with a swamp creature: hunched, oversized muscles, festooned with weeds and dead plants, about 20 ft tall.
  - It stands just outside the front entrance (the side facing the marsh). Optional, and very challenging.
  - It's nearly impossible before the Bellshell is beaten, because Hollow Tross keep joining the fight.
  - There's a reward and award for beating it, and another for beating it before the Bellshell.
  - Looking at it, Eddar breaks the fourth wall in one brief prosaic line, roughly: "Sometimes things are best left for The Encore."

### 6.6 Autoplay
- **Tactics** per character (up to 6 if/then rules, presets). **AUTO** (A) and **1×/2×/4×** speed (S). Auto runs normal fights and Cartridge runs; bosses allowed with warning.
- **Attract Mode** on the field: auto-walk a loop and auto-fight until a stop condition (level, HP, item, alignment change risk).

### 6.7 Grinding — **CARTRIDGES** (Fantasian-inspired)
- When a random encounter triggers, **CART IT**: store it on a blank arcade cartridge (holds 12). Keep exploring.
- At an arcade cabinet (save point), **play the cartridge**: all stored encounters run as one score-attack Gauntlet. Arrange wave order first (strategy); score = speed + style (weakness hits, breaks, duets, no-damage waves) → combo multiplier on XP/money/drops (≤×3); resources and Hype/Heat/Set List carry over; two identical carts merge into an elite "2-Player" wave.
- **Leaderboards** on every cabinet — **REX** tops them all in Act I (he's a champion; or did he pay the arcade owner?). Beating his scores unlocks gear, comic scenes, and a side arc. **Challenge carts** (e.g., "No Eddar", "Rex Solo", "Silent Run") teach kits and prep for the finale.

### 6.8 Progression & Items
- **No levels (Jesse, 2026-11-05).** Levels are great for RPG mechanics but take away from immersion. Heroes grow through four paths instead. Stats: HP, MP ("Tone"), Power, Spirit, Guard, Will, Speed, Luck.
  1. **Destiny.** Like FFX's Sphere Grid or FFVII Remake's weapon nodes: nodes on a 2D map, unlocked with points earned in battle (a music-themed name, still to be chosen). The player shapes each hero's advancement. **Look: cassette-themed** (Jesse, 2026-11-05), but laid out as a free, Sphere Grid-style web for maximum customisation, never fixed A-side/B-side paths. It works much like levels (extra HP and so on) and unlocks some passive and active abilities, though most abilities come from path 4.
  2. **Items and equipment.** Disposable items are potent, but they aren't "grenades" or "Molotov cocktails". Some scale simply because they affect stronger foes equally, e.g. **Flash Stun** (stuns 1 enemy for 1 round; physical, ranged). Others are chakra-related, e.g. **Ruby Ray** (more fire damage the greater the user's energy limit; it does nothing special when Roxy uses it).
  3. **Music.** Unlocking and finding songs for the jukebox, and improving songs (like Rex's Anthem). Later it gets potent, if chaotic: several heroes have musical boons, triggers switch the battle music, and tracks sometimes combine (which is really just a different track).
  4. **Abilities,** learned and improved through exploration, and very modular, like a workshop crafting system but more forgiving: they can be reset at places with musical reverence, including the Pink Wyvern.
     - Kinds: turn-based, energy-bar, auto-attack, and off-cooldown abilities. Off-cooldown abilities generally come only from the story, e.g. Rex's Big Brother grows more potent as his bond with Eddar improves.
     - Sources: magazines bought in shops (e.g. a vinyl record shop), teachers (e.g. Three-Clear Fixer), and so on.
     - **Notes.** Upgrades sit on an ability as Notes, up to **5 Notes per ability** for now. A new Note costs X points plus 5 more for every Note already on that ability. Example: Rex's Charge has one Note (3× damage instead of 2×). From a magazine he learns an upgrade that makes the bonus last 2 rounds instead of 1. He adds a second Note and puts it there, so Charge now does 3× and lasts 2 turns.
     - Very customisable, and abusable, which is recommended for Symphony.
- **Auto options, one per path.** For players who don't want to experiment, or who want the battles as intended (on Normal): **Optimal** for equipment (the best available item for that hero is equipped) and **Predestined** for Destiny, Music and Abilities (upgrades follow each hero's character as expressed in the story).
- Gear: Weapon, Armor (jacket/robe/plate), Accessory, **Charm** (upside + downside).
- Items: Cola / Diet Cola / Turbo Cola (HP), Glowstick (MP), **1-Up** (revive), Static Filter (cure Glitch/Mute), Earplugs (resist Stilled), Flash Bomb, Mirror Ball, Mixtape (camp rest).
- Weapons (8 tiers + ultimate each): Eddar: Mop → **"The Ledger"** (a floating notebook that cuts like a blade); Rex: no weapon, just his fists, "Ol' One and Two" (glove/knuckle upgrades TBD; "jousting" is named for the opening straight-armed fist bump, Jesse 2026-11-05); Sable: no weapon, ever (sorcery; her upgrade path is TBD); Roxy: Flame Guitar → **"Wildfire"**; Thunderhorn: Flying-V → **"The High Note"**; Lyra: Throwing Disc → **"Solara's Heart"**; Aubade: **electrostaff** (not a sorcerer like Sable: she slows, stuns and counters enemies; Jesse 2026-11-05).
- Currency: **Tokens**. Shops: pawnshop, smith, tailor, record store (songs/spells), Cola stands.

---

## 7. Exploration
- **Towns/interiors:** painted 2.5D backgrounds (FFIX) with 3D characters on walkmeshes; occluders; animated neon, crowds, steam, sea spray.
- **Dungeons:** low-poly real-time 3D with fixed/rail cameras; one signature puzzle per dungeon (casino vault tumblers in Jackpot, current-routing in the Reef, telescope light in Frostline, racing chase in the Speedway, ink-scroll puzzles in the Abbey, text-only navigation by vibration in the Silent Citadel).
- **World map:** 3D overworld of Halcyon at golden hour. Vehicles: on foot → **Rex's convertible "the Valor-ette"** (Act I, Overdrive) → **airship *The Encore*** (Act II+).
- **Interaction:** Talk, Examine (Ledger comments on hotspots — this is where the writing sings), **Read** in field (Eddar's sense reveals secrets; Resonance lifts objects for puzzles), Requests board.
- **Encounter indicator:** cassette spool icon spinning faster as an encounter nears.
- **Save:** arcade cabinets + autosave at scene boundaries; 3 slots + export/import.
- **Quest log = the Ledger's back pages** ("To Do" in Eddar's hand); also feeds the AI player.

---

## 8. Graphics & Art Direction

### 8.1 Target
FFIX/FFX fidelity with synthwave lighting: emissive neon, bloom, rim light, golden-hour gradients. Low-poly characters (3–8k tris), painterly 512–1024 px textures. Hush = desaturation + muffled post-process. Eddar's Dissonance = violet chromatic aberration.

### 8.2 Colour script
Prologue: magenta/cyan neon on night sea. Act I: purple-orange desert, gold casino neon, silver-white Solara. Act II: teal Reef, aurora greens at Frostline, jungle green + neon at the Speedway, stadium magenta at Amplitude. Act III: Solara under grey Hush, fire-orange siege. Act IV: scarlet Abbey; black glass and white silence at Cantrel; violet creeping into every scene with Eddar. Act V: monochrome Citadel; colour floods back at the end; epilogue warm daylight. Final scroll: parchment, red ink, black ink.

### 8.3 Asset pipeline
| Asset | Tool | Notes |
|---|---|---|
| Concept sheets, portraits | Image-gen API (**fal.ai** FLUX etc., or OpenAI image) | Consistent style prefix (§8.4). Turnarounds → Tripo. Portraits: 3–4 expressions. |
| 3D characters & monsters | **Tripo** (image→3D, auto-rig, animation) | Decimate to budget; GLB. |
| Animation | Tripo presets / Mixamo retarget + procedural secondary (hair, coats, capes) | Party: idle, walk, run, battle idle, attack, 2+ skills, hit, KO, victory. Monsters: idle, attack, hit, die. |
| Painted backgrounds | Image-gen 1920×1080+, depth maps for occlusion | Walkmesh/occluders authored in my editor tool. |
| 3D environments | Low-poly in code / Blender CLI + generated textures | Dungeons, world, battle arenas. |
| VFX | Custom Three.js shaders/particles | §8.5 |
| UI | HTML/CSS: chrome bevels, neon outlines, cassette/arcade motifs; the Ledger in handwriting font | 80s chrome-script titles, pixel arcade numbers, clean sans dialogue, handwriting for Ledger. |

### 8.4 Style prompt prefix
`1980s synthwave tech-fantasy in the style of Final Fantasy, neon-lit, golden-hour and magenta sky gradient, chrome, palm trees, airships and ancient temples, painted like a late-1990s Squaresoft prerendered background, cinematic lighting, highly detailed, no text` (+ region notes). Characters: `full-body character turnaround sheet, front/side/back, A-pose, plain background, PS2-era JRPG character design, 1980s fashion fused with fantasy armor, ...`.

### 8.5 Battle VFX (simple, mastered)
Neon slash arcs with hitstop; Roxy's flames + ember + heat shimmer and Meltdown fire ring; Rex's fist-impact flashes and charge glow; Thunderhorn's equalizer bars and sound rings, lighter flames on The Solo; Sable's afterimage dashes; Lyra's arcing gold coins and mirror shimmer; **Hush** = colour drains from the hit area, audio muffles, crack-of-silence; **Eddar Harmony** = soft white-violet rings, floating debris, slow-motion lift; **Eddar Dissonance** = violet lightning, chromatic tearing, screen-shake, debris orbit; **Da Capo** = time-reverse effect, white light, petals of paper with red ink turning black. Damage numbers in arcade pixel font; "BREAK!" neon sign flicker.

### 8.6 Animation
FFVII+: idles, walk/run, wind-ups, hit reacts, KOs, unique victory poses (Eddar jots in the Ledger and pockets the pencil; Rex flexes and points at camera; Sable bows; Roxy power-chord with flaming hair; Thunderhorn knee-slide; Lyra catches her returning disc and sighs at gold spent).

---

## 9. Music, Sound & Voice — the crown jewel

### 9.1 Score (AI music: Suno/Udio via Jesse with my prompt sheet)
**Music is magic in this world, so the score is the world.** Styles: synthwave/outrun, 80s glam-rock and power ballads, cathedral organ and choir (Rubric), muffled/sparse drones (Hush), chiptune (arcades).
**Leitmotifs:**
- **"The Ledger"** — Eddar's theme: a curious, slightly lopsided piano/synth melody (lopsided = unfair).
- **"Valor!"** — Rex's theme: brass-and-guitar fanfare, gloriously cheesy; becomes noble in the final fight.
- **Sable's theme** — slow koto-synth over a breath-like pad; becomes the love theme.
- **"The Canticle"** — organ hymn in a minor key; inverted into Eddar's Dissonance theme.
- **Nocturne's Symphony** — beautiful, broken; the silence between notes is part of it.
- **"Always There"** — Roxy's vocal song for Eddar (epilogue, credits).
**Diegetic performances:** Roxy & the Wildfires sets (Prologue, refugee show Act IV, Amplitude stadium epilogue), Thunderhorn's comeback, the Cathedral organ, **Rex's Anthem** at the Amplitude Grand Joust, and **"One Word"** at the Last Dance.
**Centrepiece songs (vocal, AI-produced, full length):**
- **"One Word"** — Thunderhorn's last ballad; mega soul-lifting 80s power ballad. Version A (Act IV Last Dance): the peak of the chorus is hummed where the word should be. Version B (credits): complete, the word is "love". **The Last Dance cutscene is choreographed to Version A** (beat-mapped timeline).
- **"Always There"** — Roxy's song for Eddar (epilogue).
- **"REX REX REX (Valor Forever)"** — gloriously terrible; 2–3 variants depending on the player's songwriting choices.
- **"Mercy of the Red Ink"** — the Rubric hymn (Abbey).
**Track list (~32):** Title; Solace Bay; Pink Wyvern (live band); Proclamation (organ); Overdrive; Jackpot; Solara; Solara Gala (synth waltz); Amplitude; Neon Reef; Frostline; Wildwood Speedway; The Encore (airship/world map); Siege of Solara; Fortress-Ship; Rubric Abbey (choir); Cantrel (the oldest Dirge + a music box); Silent Citadel (pure Dirge; party themes push through in battle); The Dirge (stem that every town theme can decay into); Last Dance ("One Word" vocal A); Battle; Cartridge Gauntlet (layered by combo); Boss; Nocturne's Symphony; Nocturne Reborn (all motifs collide); Victory fanfare; Game Over; Campfire; Sable love theme; Roxy rock ballad; Rex & Lyra waltz; "Da Capo" (Eddar's death — Ledger theme played backwards to forwards); Goodbyes; "Always There" (vocal); "One Word" (vocal B, credits); Rex's Anthem variants; Credits.
Implementation: Web Audio; vertical layering; ducking under voice; tempo-synced battle stingers.

### 9.4 Living Soundtrack (music = mood, shaped by choices)
- **Every town theme has stems** (base, band, festive, Dirge). State drives the mix: a town you saved gets its festive layer and a live band in the square; a town you failed decays toward the Dirge; a town mid-attack audibly *loses instruments* as the Hush advance.
- **Choices change music:** which band plays at Solace Bay's festival (Roxy's choices), whether the Wildfires make it, whether Rex's Anthem becomes the joust stadium's walk-on music, Eddar's alignment (Dissonance adds detuned violet undertones to his theme and the field music around him in Acts IV–V).
- **Proximity music (built in 0.2):** in-world bands are positional layers. In the Pink Wyvern, Roxy's band practicing is faint at the door and louder near the stage. In the alley it's muffled through the wall (low-pass filtered). Sources are map data (`MapDef.sounds`), so the same system works for buskers, jukeboxes, the Cathedral organ, and the Dirge spreading through a town.
- **Comedy through music:** jukeboxes, buskers who play requests (badly), NPCs humming Rex's Anthem after the Joust, Thunderhorn's napkin lyrics as collectibles.
- **Implementation:** Web Audio stem mixer with per-area state; crossfades on state changes; all stems from the same AI-generated master, split with a stem-separation tool if the music service doesn't export stems.

- **Lamp Moths (prologue onward):** maddened moths circle each area's neon. They're harmless and can't be fought. Roxy's music calms them, Rex's does nothing, and Eddar's maddens them again. That's an unnoticed hint of his Dissonance. Calming every moth in an area flips its music to a Roxy-inspired theme, Calming them all unlocks a jukebox song. Much later, on the party's return, areas with the friendly music unlock new civilian lines. This is the player's first lesson that they can change the world's mood.

### 9.2 SFX
ElevenLabs SFX API or synth + curated CC0. Signatures: coin insert (save), cassette click (battle start), VHS glitch (encounter), the **Hush** (music sucked down into the low Dirge drone — reverse-reverb into a funeral note), pencil scratch (Ledger), guitar-spell stings, light-cycle whine.

### 9.3 Voice
ElevenLabs Voice Design: Eddar (young, warm, dry), Rex (big, bro, booming), Sable (low, even), Roxy (husky, fast), Thunderhorn (raspy rock tenor), Lyra (crystalline), Nocturne (deep, melancholy, slightly filtered), Carmine (soft, old, absolute). Scope: prologue, act climaxes, romance scenes, the reveal, the goodbyes and the epilogue (~40 scenes, ~1,200 lines) + battle barks (~15/char). Unvoiced lines use per-character synth voice blips.

---

## 10. AI-Playability — "THE WIRE"
- `window.WIRE` JS API, WebSocket bridge, headless Node mode (same logic, no renderer).
- `WIRE.observe()` → JSON: mode, location, objective (Ledger "To Do"), party, inventory, interactables (ids, positions), exits, dialogue/choices, battle state (timeline, enemies, known weaknesses/Tells, legal actions with descriptions and previews).
- `WIRE.act({...})` → move_to, interact, choose, battle_action, menu ops, cart/play cartridge, save/load.
- `WIRE.describe()` → prose summary for LLMs.
- `tools/agent-player/` — sample LLM harness that plays end to end and logs the run.
- Seeded RNG; action-log replays (regression tests + balance sim).

---

## 11. Technical Architecture
### 11.1 Stack
TypeScript + Vite + Three.js (WebGL2); HTML/CSS UI overlay; Web Audio; localStorage saves + export/import; Vitest (core), Playwright (render smoke tests/screenshots). Playtest via `npm run dev` or GitHub Pages build.

### 11.2 Repo layout
```
/core      pure logic: state, battle engine, enemy AI, items, progression, alignment/bonds, scene runner, RNG
/game      Three.js renderer: field, world, battle, VFX, camera, input
/ui        HTML/CSS UI: dialogue, Ledger notes, menus, battle HUD, Mixtape board, Cartridge screen
/content   DATA: characters, enemies, skills, items, encounters, maps, scenes (*.scene), music cues
/assets    glb models, textures, backgrounds, portraits, audio, voice
/tools     walkmesh editor, scene linter, balance-sim, agent-player, asset scripts (tripo, image-gen, tts)
/docs      DESIGN.md + STORY.md (mirrored), WIRE.md, CONTENT_STATUS.md
```
### 11.3 Content-as-data — schema-validated; adding content = adding data.
### 11.4 Scene DSL
```
@scene prologue.the_letter
# PLOT: Establish the Cyrano letters + Rex's protectiveness. CHARACTER: Eddar's wit and talent; Rex's ego and secret.
@bgm pink_wyvern_alley  @location solace_bay.wyvern_alley
REX [smug]: Okay, Adder. Write this down. "Dear Princess. You're hot."
EDDAR: Inspiring. Can I make one tiny suggestion?
REX: Is it "but in poetry"? Because Rex was getting there.
LEDGER: Entry #2,205: Paid 3 tokens to write love poetry for the guy who will shove me in that barrel in ninety seconds.
? Write it beautifully -> beautiful   {harmony:+2}
? Write it beautifully, but sneak in a joke at Rex's expense -> joke   {bond_rex:-1}
@flag prologue.letter_written
```
Linter: undefined speakers, missing portraits, banned phrases, line length, voice IDs, PG-13 word filter.
### 11.5 Performance — 60 fps mid laptop @1080p; ≤60k tris/scene; ≤120 draw calls; lazy-load per area; <400 MB download (Opus audio).
### 11.6 Balance simulator — `tools/balance-sim`, N=500 per fight, policies: random, greedy, mechanic-aware, autoplay-tactics, "eddar-carry". Expected level/gear from `content/progression.ts`. CI fails if a boss leaves its band (§6.5).

---

## 12. External Services (ask Jesse)
| Need | Recommendation | Use | Priority |
|---|---|---|---|
| GitHub repo | `neon-sovereign` (or new title) | Code; Pages playtest builds | Now |
| Image gen API | **fal.ai** (or OpenAI) — `FAL_KEY` | Concept art, portraits, backgrounds, textures | Now |
| 3D | **Tripo** — `TRIPO_API_KEY` | Characters/monsters, rigging, animation | Now/soon |
| Voice + SFX | **ElevenLabs** — `ELEVENLABS_API_KEY` | VO, barks, SFX | Soon |
| Music | **Suno Pro** (Jesse runs my prompt sheet) | Score + vocal songs | Soon |
Keys go in a cloud environment (Project settings → Cloud environment → Add cloud environment), never in chat or the repo.

---

## 13. Milestones
| M | Name | Exit criteria |
|---|---|---|
| M0 | Bible & pitch | Jesse greenlights story v3 |
| M1 | Engine skeleton | Walk, talk (scene DSL + Ledger UI), save; headless core test; WIRE stubs |
| M2 | Battle core | CTB + preview; kits for Eddar (early), Rex, Roxy, Sable; Break, statuses, Tells; VFX v1; autoplay & speed; Cartridges; balance sim green for 3 test fights |
| M3 | Vertical slice: Prologue | Solace Bay, Pink Wyvern, SAVE THE WORLD night, Leagues names the Champion, monster attack (no Hush, no Nocturne); first Tripo models & painted BGs; real music incl. a Wildfires song; voiced opening; Jesse plays 60–90 min |
| M4 | Act I | ~7.5 h playable |
| M5 | Act II | Encore airship, Thunderhorn, Verses, Nocturne #1; ~14.5 h |
| M6 | Act III | Rex's betrayal, Siege of Solara, Lyra joins; ~21.5 h |
| M7 | Act IV | Rubric, Codex, Cantrel reveal + flashback; ~28.5 h |
| M8 | Act V + epilogue | Citadel, both Nocturne fights, Da Capo, goodbyes, scroll; ~33.5 h |
| M9 | Optional & polish | Side content, superbosses, VO pass, balance pass, full AI-player run |

Working rules: read §0, §15 and the current milestone first. Never ship placeholder dialogue. Every boss: title card, lead-in, mechanic, sim band. Commit small; push often; update §15.

---

## 13.5 Ideas Backlog (from playtests)
From Jesse's 0.3 playtest (2026-11-04), not built yet:
- **Environmental weapons:** Eddar's bin lid is the first; later towns get more, e.g. a baseball bat leaning on a wall.
- **Choice-reflective battle entry FX:** the warp-in reflects choices, e.g. Rex's anthem maxed gives a golden concentric ring and an anthem riff.
- **Early patrons** in the Wyvern's cold open once real assets exist.
- **Muffled screams and monster roars** through the walls during the screams scene, once real audio exists.

## 13.6 Recorded for later: Rockstars, Bouncers and Eddar (Jesse, 2026-11-05)
Jesse recorded this for later. It is not scheduled work.

- **The cast is nine:** Eddar, Rex, Roxy, Sable, Leagues, Grubb, Thunderhorn, Lyra and Aubade.
- **Three hidden hero types:**
  - **Rockstars:** Roxy, Thunderhorn, Aubade (vocalist) and Leagues.
  - **Bouncers:** Rex, Grubb, Lyra and Sable.
  - **Other:** Eddar alone.
- **Never explained to the player.** A Rockstar in the battle party triggers certain effects: visual, audio and battle-related. Bouncers trigger their own. Eddar is a can of whoop-ass by himself but provides no group effect, which fits how he sits outside the system and the Canticle.
- **Full-type parties:**
  - Four Bouncers: they all get combat lines, and their stacked effects transcend into something else, like a phalanx.
  - Four Rockstars: the same, but the opposite, like a nuclear explosion.
- **Why:** it's a cool feature in itself. It drives home how different Eddar is from everyone in the Canticle, and it gives the player different ways to experience battles.
- **After the credits:**
  - Chapter select.
  - Awards and unlocks for beating things with certain members in the group. They tend to align with Rockstars and Bouncers, and include winning without Eddar, especially in NG+.
- **NG+ is called The Encore** (Jesse, 2026-11-05):
  - The whole story is about 95% the same, with tougher foes and a few extras here and there.
  - Most fights let the player pick any fighters, not just the current group.
  - Part of the extra 5% is humorous fourth-wall-breaking lines, as if the characters notice ("Wait... why is the princess here helping us fight the Bellshell?").

## 14. Open Questions for Jesse
1. Rex calls Eddar **"Adder"** (twist of his name; snake joke that turns ominous). Is that what you meant, or is "Adder" his real name?
2. Title: keep **Neon Sovereign** or something tied to the new story (e.g., **"Red Ink"**, **"Da Capo"**, **"The Unsung"**)?
3. "Da Capo" as the name of the sacrifice spell (musical "from the beginning") — or something else?
4. Rex's betrayal (trading the Verses for Lyra) — keep?
5. Rubric breeding program shown as old records & lineages only (PG-13) — OK?

---

## 15. Status Log
| Date | What changed | Next |
|---|---|---|
| 2026-11-03 | **Build 0.3: the opening, inception to Bellshell**, from the approved storyboard v2. Scenes rewritten: cold open, the stranger (Leagues, "Piss off" twice, then a refrain), Roxy's hum, the punch, trash call, Rex's letter in the Zuko voice, the dock crew, the Champion reveal, "Burn Forever" with the Canticle vision (Verse 1 of 2), the screams, Sable, the Bellshell and its mercy ending. Ledger #2,204 to #2,209. Nine discoverables. **M2 battle core (THE SET)**: CTB timeline with action previews, Read / Tells / Lift interrupts, Break, Big Brother, Roxy's Heat and Meltdown, Mute, mercy endings; battle screen with 80s title cards, barks with tutorial tips, Auto and 1×/2×/4× speed. Balance bands in content and tests (Bellshell: ignore the Toll and lose about one run in ten). Staging commands (`enter_npc`, `move_npc`, `exit_npc` with a direction) and cutscene FX (gold threads, eye flash, vision, window shatter). Placeholder models for Leagues, Sable, Brick, Moss and the Bellshell crab; placeholder music for both fights, the song, the monster pulse and five jukebox songs. 29 tests; headless playthrough runs both fights. | Jesse playtest 0.3; then the side room, the stairs and the Main Drag (Lamp Moths, Static Hounds, Tin Gulls, Drum Toads) as the next storyboard; real assets once keys land. |
| 2026-11-04 | **Build 0.3b: Jesse's 0.3 playtest notes.** Cold open rewritten to Jesse's lines ("shut F-sharp up"). Ledger #2,206 spells out the forehead. After the alley fight there's no warp: Rex goes in first and the player walks back, with new inspectables (a cardboard box someone lives in, and a black cat who watched the whole fight and didn't care). The masked woman stays unnamed and described, with a new model (mask, trench, long neon-silver hair). Screams scene: Rex's "Hero of Princess's hearts", the bow shown not explained, an incredulous "You're... the one?", then Eddar screams and runs, Roxy's confession, the "undiscovered country" (Hamlet), the "I love you"s, and the lunge. Mercy: no Ledger, no "first in weeks", new celebration with Rex taking the lead. **Battle:** turning points (`BattleDef.turn`): barks stay frightened until the boss is under 50% HP, then `key+` flair variants take over. Break fixed: a broken foe now really loses a turn, and its +50% shows as "BROKEN +50%". **Balance:** the Bellshell is now a real boss (smart ~87%, ignoring the Toll ~25%, mashing ~0%). The dock crew are unchanged (a softer crew was tried and reverted at Jesse's request: balance work waits until the section is polished). 32 tests. | Jesse playtest 0.3b; then the side room, the stairs and the Main Drag. |
| 2026-11-04 | **Direction reset (paper, plus a Godot animatic).** No more contest: the game is a ~35 h RPG for Steam, built in **Godot 4** (desktop). Combat core is Jesse's **Solo bar** (turn-based choices plus automatic Solo actions on visible timers; enemies and bosses have them too). Specials, stacking, the difficulty names (Unplugged, Guitar Solo, Headliner, Symphony) and the music presses are settled in the combat doc (https://claude.ai/artifact/WUJ6EEAhq8JujQ1aAw28Tf). Monsters are scary by default, musical ones only in set places, the Bellshell is an optional docks mini-boss, and a werewolf breaks into the Wyvern (STORY.md). Shot list and grey-box animatic of the first two minutes are on branch `godot-wyvern-animatic`. | Jesse reviews the animatic and the asset pitch; then the combat sandbox in Godot. |
| 2026-11-04 | **Build 0.3c: Jesse's 0.3b notes.** The alley fight is back to its 0.3 numbers (the harder Bellshell stays). **Q cycles** between overlapping interactables (the alley back door sat under the EXIT sign). **Test warps** on the title screen, the pause menu and `?at=<id>`: eleven checkpoints from the cold open to after the Bellshell, built by a real headless playthrough (`content/checkpoints.ts`, `core/autoplay.ts`). **Chakra energy** (§6.2b): Rex's gold meter fills by dealing damage, and Eddar's black meter fills whenever anyone else gains energy, much more from enemies. **Cold open, draft 2:** speech bubbles (`MapDef.chatter`) carry the band's pep talk and four heckling patrons while the player mops; Eddar says almost nothing; the stranger walks in once the main puddles are done; patrons keep spilling, and mopping those achieves nothing; Lulu's spill by the stage gets "You're a saint, Eddar." / "A saint who mops floors."; only then does Roxy yell for him and the amp quest start. 35 tests. | Jesse playtest 0.3c; what Rex's and Eddar's specials do at 100. |
| 2026-11-02 | **M1 build 0.2** (Jesse's playtest): NPCs never repeat (`seen.<scene>` counter + follow-up lines for everyone); objectives derived from flags so chores work in any order; back door needs floor + amp and says which is missing; visible back door with EXIT sign and floor chevrons; amp redesign (ground lift holds three bars, hum returns, Roxy ignites, Eddar punches the transformer, unnoticed violet flare via `@fx violet`); Ledger rewritten in the literary voice; proximity band layer (louder at the stage, muffled in the alley); grid path-finding for WIRE auto-walk; Mama Dee reachable across the bar. 13 tests. | Jesse playtest 0.2; keys; Know-How options (M4); M2 battle core. |
| 2026-11-02 | **M1 build 0.1** in repo `rhapsodic-legacy/neon-sovereign` (branch `m1-engine-skeleton`): TS/Vite/Three.js, headless core, scene DSL (docs/SCENES.md), field movement, save/load, WIRE AI API (docs/WIRE.md), dialogue + Ledger UI, title, placeholder procedural sets/characters/synth music. Playable: Pink Wyvern opening → Rex's letter → Sable glimpse. 11 tests incl. full headless playthrough. | Jesse playtest; keys for fal/Tripo/ElevenLabs; M2 battle core. |
| 2026-11-02 | Jesse approved v3 ("everything else is mint"). Added: Thunderhorn's last-ballad quest "One Word" (missing word = love), the Last Dance cutscene to an AI vocal track, the Hush as a low Dirge (not silence), Living Soundtrack (choices change music), Rex's terrible Anthem with in-battle buff. | Repo + keys; M1. |
| 2026-11-02 | Concept #1 (noir) rejected. Neon Sovereign v1 (Percy) partly rejected. v3 rebuilt on Jesse's outline: Eddar Soipon protagonist, Rex as Hero of Legend, Rubric/Canticle, Act IV Revan reveal, Act V dark turn + Da Capo sacrifice + final fight without Eddar. STORY.md + this bible rewritten. | Jesse feedback; repo + keys; M1. |

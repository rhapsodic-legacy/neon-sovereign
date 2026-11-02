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
| **Rex Valor** (22, Hero of Legend) | Huge, golden quiff, white leather jacket with gold pauldrons, lightning lance, poses with cape | Third person, catchphrases, jock bravado; sweet when he forgets to perform. "Nobody pushes Adder around but me." | Showboat charger/tank; Hype; late-game **Legend** form. |
| **Sable** (25) | Lithe, black/violet monk wraps, black visor, cropped silver hair, twin neon blade-staff, wrapped ankles; Rubric sigil hidden under wraps | No filter, short declaratives, never lies but omits. | Stance monk; counters; guards Eddar. |
| **Roxy Vega** (21) | Red/black leather jacket, ripped tights, flame skates, side-pony that ignites, flame-red guitar-axe | Fast, sarcastic, big heart, temper; talks about her brothers; falls hard and loud. | Fire rocker; Heat gauge; meltdown solos. |
| **Sir Vance Thunderhorn** (54) | Silver mane, battered chrome plate with lightning chest, flying-V axe, scarf, sunglasses at night | Power-ballad lyrics, stadium hype, sudden tenderness. **Quest: write one last soul-lifting ballad, "One Word"**, gathered from the journey; the peak of the chorus is missing one word ("love"), found at Eddar's death. | Bard-paladin; Set List → The Solo. |
| **Princess Lyra Solaris** (23) | Silver-light gown, starlight veil, white-gold braid crown, mirror-parasol | Velvet court diction with blades; quotes "Rex's" letters. | Royal commander; spends gold; Decrees. |
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
| Prologue | Soundcheck | 1.5 | Hush Vanguard (tutorial) |
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
| **Rex** | **Hype** | Lance **Charge** (delayed huge hit), **Showboat** (taunt + Hype), **Big Brother** (auto-cover Eddar, Acts I–III). Max Hype → **Grand Joust**. | Ego: loses Hype when others get kills ("That was MY kill!"); hungover status at random in Act I–II after town visits (comic, minor). **Legend form** unlocks only in the final fight — the Hero finally becomes the hero. |
| **Sable** | **Stance** (Still / Flow / Storm) + Breath | Stance swaps rewrite her moves: counters & parry / evasion & multi-hit / big damage no defence. **Plain Truth** strips buffs. | Guards Eddar: counters any attack aimed at him. Unfiltered: no debuffs, only direct answers. |
| **Roxy** | **Heat** (0–100; rises when she's hit or a friend is) | Fast skater striker; consecutive-turn combos; 100 Heat → **Meltdown Solo** (huge fire AoE, then Burnt Out). Vent heat to one target. | Temper = power. Heat rises fastest when *Rex* is hit (Acts I–II), later when *Eddar* is (Act IV+) — her heart, shown mechanically. |
| **Thunderhorn** | **Set List** (queue songs; 4th = **The Solo**) | Ballads heal, Anthems buff, Shred damages, Feedback debuffs; order changes the Solo. **"One Word" verses** found through the story unlock new Solo variants; the finished ballad (final fight) is his ultimate. | Lost voice: Solo can **miss the high note** until his Act III moment, then never again. |
| **Lyra** (joins Act III) | **Treasury** (party gold) | **Decree** (ally takes an extra turn now), **Bribe** (enemy skips/leaves; cost scales), **Royal Guard** summon, **Mirror Parasol** reflect. | Rich and political; pays for power. Decree on Rex +50% (love). |
| **Guests** | Jack Cutlass (Act II), Mama Dee (Prologue cameo) | | |

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

### 6.6 Autoplay
- **Tactics** per character (up to 6 if/then rules, presets). **AUTO** (A) and **1×/2×/4×** speed (S). Auto runs normal fights and Cartridge runs; bosses allowed with warning.
- **Attract Mode** on the field: auto-walk a loop and auto-fight until a stop condition (level, HP, item, alignment change risk).

### 6.7 Grinding — **CARTRIDGES** (Fantasian-inspired)
- When a random encounter triggers, **CART IT**: store it on a blank arcade cartridge (holds 12). Keep exploring.
- At an arcade cabinet (save point), **play the cartridge**: all stored encounters run as one score-attack Gauntlet. Arrange wave order first (strategy); score = speed + style (weakness hits, breaks, duets, no-damage waves) → combo multiplier on XP/money/drops (≤×3); resources and Hype/Heat/Set List carry over; two identical carts merge into an elite "2-Player" wave.
- **Leaderboards** on every cabinet — **REX** tops them all in Act I (he's a champion; or did he pay the arcade owner?). Beating his scores unlocks gear, comic scenes, and a side arc. **Challenge carts** (e.g., "No Eddar", "Rex Solo", "Silent Run") teach kits and prep for the finale.

### 6.8 Progression & Items
- Levels 1–60. Stats: HP, MP ("Tone"), Power, Spirit, Guard, Will, Speed, Luck.
- **Mixtapes** (skill boards): cassette-shaped, A-side/B-side branches, ~40 nodes; cost **Tracks** from battle. Eddar's Mixtape has a **Harmony side** and a **Dissonance side**.
- Gear: Weapon, Armor (jacket/robe/plate), Accessory, **Charm** (upside + downside).
- Items: Cola / Diet Cola / Turbo Cola (HP), Glowstick (MP), **1-Up** (revive), Static Filter (cure Glitch/Mute), Earplugs (resist Stilled), Flash Bomb, Mirror Ball, Mixtape (camp rest).
- Weapons (8 tiers + ultimate each): Eddar: Mop → **"The Ledger"** (a floating notebook that cuts like a blade); Rex: Volt Lance → **"Lance of Legend"**; Sable: twin-staff → **"Dusk & Dawn"**; Roxy: Flame Guitar → **"Wildfire"**; Thunderhorn: Flying-V → **"The High Note"**; Lyra: Parasol → **"Solara's Heart"**.
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
Neon slash arcs with hitstop; Roxy's flames + ember + heat shimmer and Meltdown fire ring; Rex's procedural lightning lance and charge glow; Thunderhorn's equalizer bars and sound rings, lighter flames on The Solo; Sable's afterimage dashes; Lyra's arcing gold coins and mirror shimmer; **Hush** = colour drains from the hit area, audio muffles, crack-of-silence; **Eddar Harmony** = soft white-violet rings, floating debris, slow-motion lift; **Eddar Dissonance** = violet lightning, chromatic tearing, screen-shake, debris orbit; **Da Capo** = time-reverse effect, white light, petals of paper with red ink turning black. Damage numbers in arcade pixel font; "BREAK!" neon sign flicker.

### 8.6 Animation
FFVII+: idles, walk/run, wind-ups, hit reacts, KOs, unique victory poses (Eddar jots in the Ledger and pockets the pencil; Rex flexes and points at camera; Sable bows; Roxy power-chord with flaming hair; Thunderhorn knee-slide; Lyra opens parasol and sighs at gold spent).

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
| M3 | Vertical slice: Prologue | Solace Bay, Pink Wyvern, Proclamation, Hush attack; first Tripo models & painted BGs; real music incl. a Wildfires song; voiced opening; Jesse plays 60–90 min |
| M4 | Act I | ~7.5 h playable |
| M5 | Act II | Encore airship, Thunderhorn, Verses, Nocturne #1; ~14.5 h |
| M6 | Act III | Rex's betrayal, Siege of Solara, Lyra joins; ~21.5 h |
| M7 | Act IV | Rubric, Codex, Cantrel reveal + flashback; ~28.5 h |
| M8 | Act V + epilogue | Citadel, both Nocturne fights, Da Capo, goodbyes, scroll; ~33.5 h |
| M9 | Optional & polish | Side content, superbosses, VO pass, balance pass, full AI-player run |

Working rules: read §0, §15 and the current milestone first. Never ship placeholder dialogue. Every boss: title card, lead-in, mechanic, sim band. Commit small; push often; update §15.

---

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
| 2026-11-02 | **M1 build 0.2** (Jesse's playtest): NPCs never repeat (`seen.<scene>` counter + follow-up lines for everyone); objectives derived from flags so chores work in any order; back door needs floor + amp and says which is missing; visible back door with EXIT sign and floor chevrons; amp redesign (ground lift holds three bars, hum returns, Roxy ignites, Eddar punches the transformer, unnoticed violet flare via `@fx violet`); Ledger rewritten in the literary voice; proximity band layer (louder at the stage, muffled in the alley); grid path-finding for WIRE auto-walk; Mama Dee reachable across the bar. 13 tests. | Jesse playtest 0.2; keys; Know-How options (M4); M2 battle core. |
| 2026-11-02 | **M1 build 0.1** in repo `rhapsodic-legacy/neon-sovereign` (branch `m1-engine-skeleton`): TS/Vite/Three.js, headless core, scene DSL (docs/SCENES.md), field movement, save/load, WIRE AI API (docs/WIRE.md), dialogue + Ledger UI, title, placeholder procedural sets/characters/synth music. Playable: Pink Wyvern opening → Rex's letter → Sable glimpse. 11 tests incl. full headless playthrough. | Jesse playtest; keys for fal/Tripo/ElevenLabs; M2 battle core. |
| 2026-11-02 | Jesse approved v3 ("everything else is mint"). Added: Thunderhorn's last-ballad quest "One Word" (missing word = love), the Last Dance cutscene to an AI vocal track, the Hush as a low Dirge (not silence), Living Soundtrack (choices change music), Rex's terrible Anthem with in-battle buff. | Repo + keys; M1. |
| 2026-11-02 | Concept #1 (noir) rejected. Neon Sovereign v1 (Percy) partly rejected. v3 rebuilt on Jesse's outline: Eddar Soipon protagonist, Rex as Hero of Legend, Rubric/Canticle, Act IV Revan reveal, Act V dark turn + Da Capo sacrifice + final fight without Eddar. STORY.md + this bible rewritten. | Jesse feedback; repo + keys; M1. |

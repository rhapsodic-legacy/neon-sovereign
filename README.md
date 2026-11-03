# Neon Sovereign

An 80s neon tech-fantasy JRPG where music is magic. *The prophecy named a hero. It forgot to mention the guy who does all the work.*

- **Story canon:** [docs/STORY.md](docs/STORY.md)
- **Design bible:** [docs/DESIGN.md](docs/DESIGN.md)
- **Scene script format:** [docs/SCENES.md](docs/SCENES.md)
- **AI-player interface (THE WIRE):** [docs/WIRE.md](docs/WIRE.md)

## Play it

Requires Node 20+.

```bash
npm install
npm run dev        # then open http://localhost:5173
```

Controls: **WASD / arrows** move · **E / Enter / Space** talk, examine and advance · **number keys** pick replies · **Esc** menu (save, load, Ledger) · **M** sound.

A hosted build is published to GitHub Pages on every push to `main` (once Pages is enabled with "GitHub Actions" as the source).

## Develop

```bash
npm test              # core logic + a full headless playthrough
npm run typecheck
npm run lint:scenes   # speakers, banned phrases, PG-13 filter, line length
npm run play:headless # an AI-style policy plays the build through THE WIRE
npm run build
```

## Status

Build 0.3: the opening of the Prologue, from the mop to the Bellshell: the Pink Wyvern, the stranger, Rex's letter, the dock crew fight, the Champion reveal and "Burn Forever", the screams, Sable, and the Bellshell fight with its mercy ending. Battles run on THE SET (CTB timeline, Tells, Break, Auto; `npm run sim` prints the balance bands). Art and music are placeholders (procedural sets, primitive characters, synthesized score) until the asset pipeline lands. See DESIGN.md §13 for milestones.

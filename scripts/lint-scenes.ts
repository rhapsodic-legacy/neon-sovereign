/**
 * Scene linter: parses every scene, checks speakers, banned phrases (DESIGN.md §4), line length and PG-13 words.
 * Usage: npm run lint:scenes
 */
import { loadContent } from '../src/content';

const BANNED = [/we need to talk/i, /i have a bad feeling about this/i, /let'?s do this/i];
const PG13 = [/\bf+u+c+k/i, /\bs+h+i+t/i, /\bc+u+n+t/i, /\bbitch/i];
const MAX_LINE = 220;

const content = loadContent();
let problems = 0;
for (const s of Object.values(content.scenes)) {
  if (!s.notes.some((n) => /PLOT|CHARACTER/.test(n)) && !/\.(puddle|spike|lulu|gil|jukebox|front_door|back_door|vinnie|barrel|cat|exit_sign|alley_mouth)/.test(s.id)) {
    console.warn(`note: ${s.id} has no PLOT/CHARACTER header`);
  }
  for (const i of s.instrs) {
    if (i.op !== 'line') continue;
    const where = `${s.id} (line ${i.src})`;
    if (!content.speakers[i.speaker]) { console.error(`${where}: unknown speaker ${i.speaker}`); problems++; }
    for (const b of BANNED) if (b.test(i.text)) { console.error(`${where}: banned phrase ${b}`); problems++; }
    for (const b of PG13) if (b.test(i.text)) { console.error(`${where}: PG-13 filter ${b}`); problems++; }
    if (i.text.length > MAX_LINE) { console.error(`${where}: line is ${i.text.length} chars (max ${MAX_LINE})`); problems++; }
  }
}
console.log(`${Object.keys(content.scenes).length} scenes checked, ${problems} problem(s).`);
process.exit(problems ? 1 : 0);

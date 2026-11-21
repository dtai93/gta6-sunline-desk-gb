/**
 * Check app/data/trophies.json and app/data/sources.json.
 * Expects 55 trophies, grades 1/2/6/46, a non-blank text guide on each,
 * cited steps under walkthrough, and cite ids that exist.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const expectedGrades = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
const problems = [];

function loadJson(rel) {
  const path = join(root, rel);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    problems.push(`${rel}: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

const sources = loadJson('app/data/sources.json');
const trophies = loadJson('app/data/trophies.json');

const sourceIds = new Set();
if (!Array.isArray(sources)) {
  if (sources !== null) problems.push('sources.json must be an array');
} else {
  sources.forEach((source, index) => {
    const id = source && typeof source.id === 'string' ? source.id.trim() : '';
    if (!id) {
      problems.push(`sources[${index}] has no id`);
      return;
    }
    if (sourceIds.has(id)) problems.push(`duplicate source id ${id}`);
    sourceIds.add(id);
  });
}

const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
const trophyIds = new Set();
let steps = 0;
let cited = 0;

if (!Array.isArray(trophies)) {
  if (trophies !== null) problems.push('trophies.json must be an array');
} else {
  if (trophies.length !== 55) problems.push(`expected 55 trophies, found ${trophies.length}`);
  trophies.forEach((trophy, index) => {
    const where = `trophies[${index}]`;
    const id = trophy && typeof trophy.id === 'string' ? trophy.id.trim() : '';
    if (!id) problems.push(`${where} has no id`);
    else if (trophyIds.has(id)) problems.push(`duplicate trophy id ${id}`);
    else trophyIds.add(id);

    const grade = trophy && trophy.grade;
    if (!Object.hasOwn(expectedGrades, grade)) problems.push(`${where} (${id || '?'}) grade ${JSON.stringify(grade)}`);
    else grades[grade] += 1;

    const guide = trophy && trophy.guide;
    if (typeof guide !== 'string' || guide.trim() === '') {
      problems.push(`${where} (${id || '?'}) guide must be a non-blank string`);
    }

    const list = trophy && trophy.walkthrough && trophy.walkthrough.steps;
    if (!Array.isArray(list) || list.length === 0) {
      problems.push(`${where} (${id || '?'}) has no walkthrough steps`);
      return;
    }
    list.forEach((step, stepIndex) => {
      steps += 1;
      const text = step && typeof step.text === 'string' ? step.text.trim() : '';
      const cites = step && step.cites;
      if (!text) problems.push(`${where} step ${stepIndex} is blank`);
      if (!Array.isArray(cites) || cites.length === 0) {
        problems.push(`${where} (${id || '?'}) step ${stepIndex} has no cites`);
        return;
      }
      let ok = true;
      for (const cite of cites) {
        if (typeof cite !== 'string' || !sourceIds.has(cite)) {
          problems.push(`${where} (${id || '?'}) step ${stepIndex} cites unknown id ${JSON.stringify(cite)}`);
          ok = false;
        }
      }
      if (ok) cited += 1;
    });
  });
}

for (const [grade, count] of Object.entries(expectedGrades)) {
  if (grades[grade] !== count) problems.push(`grade ${grade}: expected ${count}, found ${grades[grade]}`);
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  console.error(`check failed (${problems.length})`);
  process.exit(1);
}

console.log(
  `ok: ${trophies.length} trophies, 1 platinum, 2 gold, 6 silver, 46 bronze, ${cited}/${steps} steps cited, ${sourceIds.size} sources`,
);

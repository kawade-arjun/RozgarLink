/**
 * OFFLINE LEARNING PATHWAYS.
 * Reads only server/data/learningResources.json. No network calls.
 * Prerequisites are resolved recursively and ordered before the skills that need them.
 */
const catalogue = require("../data/learningResources.json");
const { canonical, matchSkills } = require("./skillMatcher");

const LEVEL_ORDER = catalogue.levels;

function buildPathway(candidateSkills, missingSkills) {
  const steps = [];
  const visited = new Set();
  const notInCatalogue = [];

  const have = (skill) => matchSkills(candidateSkills, [skill]).matched.length > 0;

  function visit(skill, reason) {
    const canon = canonical(skill);
    if (visited.has(canon)) return;
    visited.add(canon);

    const entry = catalogue.skills[canon];
    if (!entry) { notInCatalogue.push(skill); return; }

    for (const pre of entry.prerequisites || []) {
      if (!have(pre)) visit(pre, `prerequisite for ${skill}`);
    }
    const courses = [...entry.courses].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
    for (const c of courses) steps.push({ ...c, skill: canon, reason });
  }

  missingSkills.forEach((s) => visit(s, `closes your gap in ${s}`));

  const numbered = steps.map((s, i) => ({ step: i + 1, ...s }));
  return { steps: numbered, totalHours: numbered.reduce((h, s) => h + s.hours, 0), notInCatalogue };
}

module.exports = { buildPathway };

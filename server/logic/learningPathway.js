/**
 * LEARNING PATHWAYS backed by MongoDB LearningResource collection.
 * No static JSON files needed.
 */
const LearningResource = require("../models/LearningResource");
const { canonical, matchSkills } = require("./skillMatcher");

const LEVEL_ORDER = ["beginner", "intermediate", "advanced"];
let cachedCatalogue = null;

async function getCatalogue() {
  if (cachedCatalogue) return cachedCatalogue;
  try {
    const docs = await LearningResource.find({}).lean();
    const skillsMap = {};
    docs.forEach((doc) => {
      skillsMap[doc.skill.toLowerCase().trim()] = {
        prerequisites: doc.prerequisites || [],
        courses: doc.courses || []
      };
    });
    cachedCatalogue = { skills: skillsMap, levels: LEVEL_ORDER };
    return cachedCatalogue;
  } catch (err) {
    console.error("Error loading learning resources from MongoDB:", err.message);
    return { skills: {}, levels: LEVEL_ORDER };
  }
}

function buildPathwayWithCatalogue(candidateSkills, missingSkills, catalogue) {
  const steps = [];
  const visited = new Set();
  const notInCatalogue = [];
  const skillsMap = catalogue?.skills || {};
  const levels = catalogue?.levels || LEVEL_ORDER;

  const have = (skill) => matchSkills(candidateSkills, [skill]).matched.length > 0;

  function visit(skill, reason) {
    const canon = canonical(skill);
    if (visited.has(canon)) return;
    visited.add(canon);

    const entry = skillsMap[canon];
    if (!entry) {
      notInCatalogue.push(skill);
      return;
    }

    for (const pre of entry.prerequisites || []) {
      if (!have(pre)) visit(pre, `prerequisite for ${skill}`);
    }
    const courses = [...(entry.courses || [])].sort(
      (a, b) => levels.indexOf(a.level) - levels.indexOf(b.level)
    );
    for (const c of courses) steps.push({ ...c, skill: canon, reason });
  }

  missingSkills.forEach((s) => visit(s, `closes your gap in ${s}`));

  const numbered = steps.map((s, i) => ({ step: i + 1, ...s }));
  return { steps: numbered, totalHours: numbered.reduce((h, s) => h + s.hours, 0), notInCatalogue };
}

function buildPathway(candidateSkills, missingSkills, customCatalogue = null) {
  const catalogue = customCatalogue || cachedCatalogue || { skills: {}, levels: LEVEL_ORDER };
  return buildPathwayWithCatalogue(candidateSkills, missingSkills, catalogue);
}

module.exports = {
  getCatalogue,
  buildPathway
};

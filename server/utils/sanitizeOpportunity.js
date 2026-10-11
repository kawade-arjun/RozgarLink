const { QUALIFICATION_LEVELS } = require("../logic/eligibility");

/**
 * Trims strings, removes empty items, and removes duplicates ignoring case.
 * Preserves the casing of the first occurrence.
 */
function toCleanUniqueList(v) {
  const items = Array.isArray(v)
    ? v
    : typeof v === "string"
      ? v.split(",")
      : [];
  const result = [];
  const seen = new Set();
  for (const item of items) {
    const trimmed = String(item ?? "").trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(trimmed);
    }
  }
  return result;
}

function sanitizeOpportunity(p = {}) {
  const criteria = p.criteria || {};

  // Work Modes: ["Offline", "Online"]
  let workModes = [];
  const rawModes = Array.isArray(p.workModes)
    ? p.workModes
    : typeof p.workModes === "string"
    ? p.workModes.split(",")
    : [];

  rawModes.forEach((w) => {
    const s = String(w ?? "").trim().toLowerCase();
    if (s === "offline") workModes.push("Offline");
    if (s === "online") workModes.push("Online");
  });
  workModes = [...new Set(workModes)];

  // If workModes is empty, infer from remote or default
  if (workModes.length === 0) {
    if (p.remote === true || String(p.location).toLowerCase() === "remote") {
      workModes = ["Online"];
    } else {
      workModes = ["Offline"];
    }
  }

  const isRemote = workModes.includes("Online") && !workModes.includes("Offline");

  let rawMinExp = criteria.minExperienceYears !== undefined ? criteria.minExperienceYears : p.minExperienceYears;
  let minExp;
  if (rawMinExp !== undefined && rawMinExp !== null && String(rawMinExp).trim() !== "") {
    minExp = Number(rawMinExp);
  } else {
    minExp = undefined;
  }

  const rawMinQual = criteria.minQualification !== undefined ? criteria.minQualification : p.minQualification;
  const minQual = String(rawMinQual ?? "").trim().toLowerCase();

  const rawAllowedLocs = criteria.allowedLocations !== undefined ? criteria.allowedLocations : p.allowedLocations;
  const rawReqCerts = criteria.requiredCertifications !== undefined ? criteria.requiredCertifications : p.requiredCertifications;

  const result = {
    title: String(p.title || "").trim(),
    company: String(p.company || "").trim(),
    location: String(p.location || "").trim(),
    workModes,
    remote: isRemote,
    criteria: {
      minQualification: minQual,
      minExperienceYears: minExp,
      allowedLocations: isRemote ? [] : toCleanUniqueList(rawAllowedLocs),
      requiredCertifications: toCleanUniqueList(rawReqCerts)
    },
    requiredSkills: toCleanUniqueList(p.requiredSkills),
    preferredSkills: toCleanUniqueList(p.preferredSkills)
  };

  if (p.id) {
    result.id = String(p.id);
  }

  return result;
}

function validateOpportunity(opp) {
  if (!opp.title) {
    return "Title is required";
  }
  if (!opp.company) {
    return "Company is required";
  }
  if (!opp.location) {
    return "Location is required";
  }
  if (!opp.workModes || opp.workModes.length === 0) {
    return "At least one Work Mode (Offline or Online) must be selected";
  }
  if (!QUALIFICATION_LEVELS.includes(opp.criteria.minQualification)) {
    return "Invalid minimum qualification";
  }
  if (
    opp.criteria.minExperienceYears === undefined ||
    typeof opp.criteria.minExperienceYears !== "number" ||
    isNaN(opp.criteria.minExperienceYears) ||
    opp.criteria.minExperienceYears < 0
  ) {
    return "Minimum experience years must be a non-negative number";
  }
  if (!opp.requiredSkills || opp.requiredSkills.length === 0) {
    return "At least one required skill is required";
  }
  return null;
}

module.exports = {
  sanitizeOpportunity,
  validateOpportunity,
  toCleanUniqueList
};

/**
 * STAGE 1: HARD ELIGIBILITY AND EXPLAINABILITY.
 * Pure deterministic rules. NO AI / NLP / fuzzy matching in this file.
 * The opportunity's `criteria` object is the single source of truth.
 */
const { matchSkills } = require("./skillMatcher");

const QUALIFICATION_LEVELS = ["10th", "12th", "diploma", "bachelor", "master", "phd"];
const LABELS = {
  "10th": "10th pass", "12th": "12th pass", diploma: "Diploma",
  bachelor: "Bachelor's degree", master: "Master's degree", phd: "PhD"
};

const norm = (s) => String(s ?? "").trim().toLowerCase();
const levelIndex = (q) => QUALIFICATION_LEVELS.indexOf(norm(q));

function mapEducationLevel(lvl) {
  const s = norm(lvl);
  if (s.includes("phd") || s.includes("doc")) return "phd";
  if (s.includes("master")) return "master";
  if (s.includes("bachelor")) return "bachelor";
  if (s.includes("diploma")) return "diploma";
  if (s.includes("12") || s.includes("higher secondary")) return "12th";
  if (s.includes("10") || s.includes("secondary")) return "10th";
  return s;
}

function getCandidateHighestQualification(candidate) {
  let highestIdx = -1;
  let highestLabel = "";

  if (Array.isArray(candidate?.education) && candidate.education.length > 0) {
    for (const edu of candidate.education) {
      const canonLvl = mapEducationLevel(edu.level);
      const idx = levelIndex(canonLvl);
      if (idx > highestIdx) {
        highestIdx = idx;
        highestLabel = edu.degree ? `${edu.degree} (${edu.level})` : (LABELS[canonLvl] || edu.level);
      }
    }
  }

  if (candidate?.qualification) {
    const canonLvl = mapEducationLevel(candidate.qualification);
    const idx = levelIndex(canonLvl);
    if (idx > highestIdx) {
      highestIdx = idx;
      highestLabel = LABELS[canonLvl] || candidate.qualification;
    }
  }

  return { highestIdx, highestLabel };
}

function checkEligibility(candidate, opportunity) {
  const c = opportunity.criteria || {};
  const failures = [];

  // 1. Qualification / Education
  if (c.minQualification) {
    const need = levelIndex(c.minQualification);
    const { highestIdx, highestLabel } = getCandidateHighestQualification(candidate);
    if (highestIdx === -1 || highestIdx < need) {
      failures.push({
        criterion: "qualification",
        required: c.minQualification,
        actual: highestLabel || "no qualification listed",
        message: `Requires ${LABELS[norm(c.minQualification)] || c.minQualification} or higher; you have ${highestLabel || "no qualification listed"}.`
      });
    }
  }

  // 2. Experience
  if (typeof c.minExperienceYears === "number" && c.minExperienceYears > 0) {
    const have = Number(candidate?.experienceYears) || 0;
    if (have < c.minExperienceYears) {
      failures.push({
        criterion: "experience",
        required: c.minExperienceYears,
        actual: have,
        message: `Requires ${c.minExperienceYears}+ years of experience; you have ${have}.`
      });
    }
  }

  // 3. Location (remote roles and roles with no location list are open)
  const allowed = (c.allowedLocations || []).map(norm);
  if (!opportunity.remote && allowed.length > 0) {
    const inCity = allowed.includes(norm(candidate?.location));
    const isWilling = candidate?.willingToRelocate !== false;
    if (!inCity && !isWilling) {
      failures.push({
        criterion: "location",
        required: c.allowedLocations,
        actual: candidate?.location || "not provided",
        message: `Requires you to be in ${c.allowedLocations.join(" or ")}; you are in ${candidate?.location || "an unspecified location"} and not open to relocating.`
      });
    }
  }

  // 4. Mandatory certifications (exact match after trimming/lowercasing)
  const haveCerts = new Set((candidate?.certifications || []).map(norm));
  for (const cert of c.requiredCertifications || []) {
    if (!haveCerts.has(norm(cert))) {
      failures.push({
        criterion: "certification",
        required: cert,
        actual: "missing",
        message: `Requires the "${cert}" certification, which is not on your profile.`
      });
    }
  }

  return { eligible: failures.length === 0, failures };
}

/**
 * EXPLAINABLE ELIGIBILITY
 * Returns transparent explanations:
 * - eligibilityStatus: "Eligible" | "Partially Matching" | "Not Eligible" | "Eligibility Unknown"
 * - eligibleReasons: Why the candidate qualifies
 * - ineligibleReasons: Why the candidate does not qualify
 * - requiredSkills, matchingSkills, missingSkills
 * - skillCoverage
 * - improvements: Actionable suggestions
 */
function explainEligibility(candidate, opportunity) {
  const c = opportunity.criteria || {};
  const { eligible, failures } = checkEligibility(candidate, opportunity);

  const eligibleReasons = [];
  const ineligibleReasons = failures.map((f) => f.message);
  const improvements = [];

  // Candidate Data Completeness check
  const hasBasicProfile = Boolean(candidate?.name && candidate?.location);
  const hasEducationData = (Array.isArray(candidate?.education) && candidate.education.length > 0) || Boolean(candidate?.qualification);

  // 1. Education Analysis
  if (c.minQualification) {
    const need = levelIndex(c.minQualification);
    const { highestIdx, highestLabel } = getCandidateHighestQualification(candidate);
    if (highestIdx >= need) {
      eligibleReasons.push(
        `Your education (${highestLabel}) satisfies the required minimum of ${LABELS[norm(c.minQualification)] || c.minQualification}.`
      );
    } else {
      improvements.push(
        `Update or acquire qualifications meeting ${LABELS[norm(c.minQualification)] || c.minQualification}.`
      );
    }
  } else {
    eligibleReasons.push("No minimum education level is required for this role.");
  }

  // 2. Experience Analysis
  const haveExp = Number(candidate?.experienceYears) || 0;
  const minExp = c.minExperienceYears || 0;
  if (minExp > 0) {
    if (haveExp >= minExp) {
      eligibleReasons.push(
        `You meet the experience requirement (${haveExp} years provided; role requires ${minExp}+ years).`
      );
    } else {
      const gap = minExp - haveExp;
      improvements.push(`Gain ${gap} more year${gap > 1 ? "s" : ""} of relevant professional experience.`);
    }
  } else {
    eligibleReasons.push("No minimum years of experience required.");
  }

  // 3. Location & Work Mode Analysis
  const oppWorkModes = opportunity.workModes || (opportunity.remote ? ["Online"] : ["Offline"]);
  const candWorkModes = candidate?.preferredWorkModes || [];

  let workModeMatches = false;
  if (candWorkModes.length === 0) {
    workModeMatches = true;
    eligibleReasons.push(`Open to role's work mode: ${oppWorkModes.join(", ")}.`);
  } else {
    const hasOverlap = candWorkModes.some((m) => oppWorkModes.includes(m));
    if (hasOverlap) {
      workModeMatches = true;
      eligibleReasons.push(
        `Your preferred work mode matches the role (${oppWorkModes.filter((m) => candWorkModes.includes(m)).join(", ")}).`
      );
    } else {
      improvements.push(
        `Role requires ${oppWorkModes.join(" or ")} work mode; your profile currently specifies ${candWorkModes.join(" or ")}.`
      );
    }
  }

  // Location
  const allowed = (c.allowedLocations || []).map(norm);
  if (!opportunity.remote && allowed.length > 0) {
    const inCity = allowed.includes(norm(candidate?.location));
    if (inCity) {
      eligibleReasons.push(`Your location (${candidate?.location}) is among the allowed locations.`);
    } else if (candidate?.willingToRelocate !== false) {
      eligibleReasons.push(`You are open to opportunities in ${c.allowedLocations.join(", ")}.`);
    }
  }

  // 4. Certifications
  const reqCerts = c.requiredCertifications || [];
  const haveCerts = new Set((candidate?.certifications || []).map(norm));
  for (const cert of reqCerts) {
    if (haveCerts.has(norm(cert))) {
      eligibleReasons.push(`You possess the required certification: "${cert}".`);
    } else {
      improvements.push(`Obtain the required certification: "${cert}".`);
    }
  }

  // 5. Skills Breakdown
  const reqSkills = opportunity.requiredSkills || [];
  const { matched, missing } = matchSkills(candidate?.skills || [], reqSkills);
  const matchingSkills = matched.map((m) => m.skill);
  const missingSkills = missing;
  const totalRequired = reqSkills.length;
  const skillCoverage = totalRequired === 0 ? 100 : Math.round((matchingSkills.length / totalRequired) * 100);

  if (matchingSkills.length > 0) {
    eligibleReasons.push(
      `You match ${matchingSkills.length} of ${totalRequired} required skills (${matchingSkills.join(", ")}).`
    );
  }

  if (missingSkills.length > 0) {
    missingSkills.forEach((s) => {
      improvements.push(`Learn the missing required skill: ${s}.`);
    });
  }

  // 6. Determine Eligibility Status: Strictly "Eligible" or "Not Eligible"
  let eligibilityStatus = "Eligible";
  let isFinalEligible = true;

  if (!hasBasicProfile || !hasEducationData) {
    eligibilityStatus = "Not Eligible";
    isFinalEligible = false;
    ineligibleReasons.push("Profile information is incomplete. Add your education and location to verify eligibility.");
  } else if (!eligible) {
    eligibilityStatus = "Not Eligible";
    isFinalEligible = false;
  } else {
    eligibilityStatus = "Eligible";
    isFinalEligible = true;
  }

  return {
    eligibilityStatus,
    eligible: isFinalEligible,
    eligibleReasons,
    ineligibleReasons,
    requiredSkills: reqSkills,
    matchingSkills,
    missingSkills,
    skillCoverage,
    improvements,
    failures
  };
}

module.exports = {
  checkEligibility,
  explainEligibility,
  QUALIFICATION_LEVELS,
  LABELS,
  mapEducationLevel,
  getCandidateHighestQualification
};

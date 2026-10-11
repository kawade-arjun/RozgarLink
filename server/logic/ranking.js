/**
 * GATE 2: MASTER RANKING ENGINE (0 to 100 Score)
 * Applied ONLY to pairs that pass Gate 1 (Boolean Eligibility Filter).
 *
 * Implements:
 * 1. Perspective 1: Candidate Ranking Jobs (Job Feed)
 * 2. Perspective 2: Recruiter Ranking Applicants (Applicant Shortlist)
 * 3. Dynamic Slider Flexibility and Normalisation:
 *    W_i = u_i / sum(u) such that sum(W_i) = 1.0
 * 4. Component Sub-Formulas:
 *    - S_skill: Sum(mu(k)) / |K_job| * 100 (mu: 1.0 exact/alias, 0.5 foundational, 0 none)
 *    - S_salary: Piecewise offer vs ask ratio
 *    - S_distance: Remote/D_max linear dropoff
 *    - S_mode: 100 exact, 70 compatible, 0 incompatible
 *    - S_shift / S_availability: Flexible/Exact vs Conflicting
 */

const { matchSkills } = require("./skillMatcher");

// 1. SKILL SCORE (S_skill)
function computeSkillScore(candidateSkills, requiredSkills) {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { score: 100, matched: [], missing: [], muTotal: 0 };
  }

  const { matched, missing } = matchSkills(candidateSkills || [], requiredSkills);
  const muTotal = matched.reduce((sum, item) => sum + (item.mu !== undefined ? item.mu : 1.0), 0);
  const score = Math.round((muTotal / requiredSkills.length) * 100);

  return {
    score: Math.min(100, Math.max(0, score)),
    matched,
    missing,
    muTotal
  };
}

// 2. SALARY FIT (S_salary)
function computeSalaryFit(pOffer, pAsk) {
  const offer = Number(pOffer) || 0;
  const ask = Number(pAsk) || 0;

  if (ask <= 0 || offer <= 0) return 100; // missing / flexible -> 100%

  if (offer >= ask) return 100;
  if (offer >= 0.8 * ask) {
    return Math.round(100 * (offer / ask));
  }
  return 0;
}

// 3. DISTANCE FIT (S_distance)
function computeDistanceFit(candidate, opp) {
  if (opp.remote) return 100;

  const dMax = Number(candidate?.maxCommuteKm) || 25;

  let dJob = opp.commuteDistanceKm;
  if (dJob === undefined || dJob === null) {
    const candLoc = String(candidate?.location || "").trim().toLowerCase();
    const oppLoc = String(opp?.location || "").trim().toLowerCase();

    if (candLoc && oppLoc && candLoc === oppLoc) {
      dJob = 10;
    } else if (
      Array.isArray(candidate?.preferredLocations) &&
      candidate.preferredLocations.some((l) => String(l).trim().toLowerCase() === oppLoc)
    ) {
      dJob = 20;
    } else if (candidate?.willingToRelocate) {
      dJob = 25;
    } else {
      dJob = 60;
    }
  }

  dJob = Number(dJob) || 0;

  if (dJob <= dMax) return 100;
  if (dJob <= 2 * dMax) {
    return Math.round(100 * (1 - (dJob - dMax) / dMax));
  }
  return 0;
}

// 4. WORK MODE FIT (S_mode)
function computeWorkModeFit(candModes, oppModes, isRemote) {
  const cModes = (candModes || []).map((m) => String(m).trim().toLowerCase());
  let oModes = (oppModes || []).map((m) => String(m).trim().toLowerCase());

  if (oModes.length === 0) {
    oModes = isRemote ? ["remote"] : ["on-site"];
  }

  if (cModes.length === 0) return 100; // flexible

  // Check exact match
  const hasExact = cModes.some((cm) =>
    oModes.some((om) => om === cm || (cm === "offline" && om === "on-site") || (cm === "online" && om === "remote"))
  );
  if (hasExact) return 100;

  // Compatible (e.g., candidate wants hybrid, job is remote)
  const isHybridCand = cModes.includes("hybrid");
  const isRemoteJob = oModes.includes("remote") || oModes.includes("online") || isRemote;
  if (isHybridCand && isRemoteJob) return 70;
  if (cModes.includes("offline") && oModes.includes("hybrid")) return 70;
  if (cModes.includes("online") && oModes.includes("hybrid")) return 70;

  // Incompatible
  if ((cModes.includes("remote") || cModes.includes("online")) && (oModes.includes("on-site") || oModes.includes("offline"))) {
    return 0;
  }

  return 70;
}

// 5. SHIFT FIT (S_shift)
function computeShiftFit(candShift, oppShift) {
  const c = String(candShift || "Flexible").trim().toLowerCase();
  const o = String(oppShift || "Flexible").trim().toLowerCase();

  if (c === "flexible" || o === "flexible") return 100;
  if (c === o) return 100;
  return 0; // Conflicting hours
}

// 6. AVAILABILITY FIT (for Recruiter Perspective)
function computeAvailabilityFit(candNoticeDays, oppTimelineDays) {
  const notice = Number(candNoticeDays) || 0;
  const timeline = Number(oppTimelineDays) || 30;

  if (notice <= timeline) return 100;
  if (notice <= timeline * 1.5) return 70;
  return 0;
}

// DYNAMIC NORMALISATION HELPER
function normalizeWeights(raw) {
  const u = [
    Math.max(0, Number(raw.u1 ?? raw.u_skill ?? raw.u_competence ?? 70)),
    Math.max(0, Number(raw.u2 ?? raw.u_salary ?? 10.5)),
    Math.max(0, Number(raw.u3 ?? raw.u_distance ?? raw.u_commute ?? 10.5)),
    Math.max(0, Number(raw.u4 ?? raw.u_mode_shift ?? raw.u_availability ?? 9.0))
  ];
  const sum = u[0] + u[1] + u[2] + u[3];
  if (sum === 0) return [0.70, 0.105, 0.105, 0.09];
  return u.map((val) => val / sum);
}

// ==========================================
// PERSPECTIVE 1: CANDIDATE RANKING JOBS
// ==========================================
function scoreJobForCandidate(candidate, opp, weights = {}) {
  // S_skill
  const skillResult = computeSkillScore(candidate.skills, opp.requiredSkills);
  const sSkill = skillResult.score;

  // S_salary
  const sSalary = computeSalaryFit(opp.salary, candidate.expectedSalary);

  // S_distance
  const sDistance = computeDistanceFit(candidate, opp);

  // S_mode
  const sMode = computeWorkModeFit(candidate.preferredWorkModes, opp.workModes, opp.remote);

  // S_shift
  const sShift = computeShiftFit(candidate.preferredShift, opp.shift);

  // Combine mode and shift for Slider 4
  const sModeShift = Math.round((sMode * 0.5) + (sShift * 0.5));

  // S_pref (35% salary, 35% distance, 15% mode, 15% shift)
  const sPref = Math.round((sSalary * 0.35) + (sDistance * 0.35) + (sMode * 0.15) + (sShift * 0.15));

  // Dynamic weights
  const [wSkill, wSalary, wDistance, wModeShift] = normalizeWeights(weights);

  const totalScore = Math.round(
    (sSkill * wSkill) + (sSalary * wSalary) + (sDistance * wDistance) + (sModeShift * wModeShift)
  );

  return {
    totalScore: Math.min(100, Math.max(0, totalScore)),
    sSkill,
    sPref,
    breakdown: {
      skill: sSkill,
      salary: sSalary,
      distance: sDistance,
      mode: sMode,
      shift: sShift,
      modeShift: sModeShift,
      pref: sPref
    },
    weights: {
      skillPct: Math.round(wSkill * 100),
      salaryPct: Math.round(wSalary * 100),
      distancePct: Math.round(wDistance * 100),
      modeShiftPct: Math.round(wModeShift * 100)
    },
    matchedSkills: skillResult.matched,
    missingSkills: skillResult.missing
  };
}

function rankJobsForCandidate(candidate, eligibleOpps, weights = {}) {
  const scored = eligibleOpps
    .map((opp) => ({ opp, ...scoreJobForCandidate(candidate, opp, weights) }))
    .sort((a, b) => b.totalScore - a.totalScore || a.opp.title.localeCompare(b.opp.title));

  return scored.map((item, idx) => ({
    ...item.opp,
    rank: idx + 1,
    score: item.totalScore,
    breakdown: item.breakdown,
    weights: item.weights,
    matchedSkills: item.matchedSkills,
    missingSkills: item.missingSkills,
    reason: `Ranked #${idx + 1}: ${item.totalScore}% overall match (${item.weights.skillPct}% skill match score: ${item.sSkill}%, ${100 - item.weights.skillPct}% preference fit: ${item.sPref}%).`
  }));
}

// ==========================================
// PERSPECTIVE 2: RECRUITER RANKING APPLICANTS
// ==========================================
function scoreApplicantForJob(opp, candidate, weights = {}) {
  // S_competence (Candidate verified skills)
  const skillResult = computeSkillScore(candidate.skills, opp.requiredSkills);
  const sCompetence = skillResult.score;

  // S_salary (Budget fit vs student's ask)
  const sSalary = computeSalaryFit(opp.salary, candidate.expectedSalary);

  // S_commute (Office commute radius fit)
  const sCommute = computeDistanceFit(candidate, opp);

  // S_availability (Student notice period vs company timeline)
  const sAvailability = computeAvailabilityFit(candidate.noticePeriodDays, opp.timelineDays);

  // 30% Joining Likelihood
  const joiningLikelihood = Math.round(
    (sSalary * 0.35) + (sCommute * 0.35) + (sAvailability * 0.30)
  );

  // Recruiter dynamic weights
  const [wCompetence, wSalary, wCommute, wAvailability] = normalizeWeights(weights);

  const totalScore = Math.round(
    (sCompetence * wCompetence) + (sSalary * wSalary) + (sCommute * wCommute) + (sAvailability * wAvailability)
  );

  return {
    totalScore: Math.min(100, Math.max(0, totalScore)),
    sCompetence,
    joiningLikelihood,
    breakdown: {
      competence: sCompetence,
      salary: sSalary,
      commute: sCommute,
      availability: sAvailability,
      joiningLikelihood
    },
    weights: {
      competencePct: Math.round(wCompetence * 100),
      salaryPct: Math.round(wSalary * 100),
      commutePct: Math.round(wCommute * 100),
      availabilityPct: Math.round(wAvailability * 100)
    },
    matchedSkills: skillResult.matched,
    missingSkills: skillResult.missing
  };
}

function rankApplicantsForJob(opp, applicantsList, candidatesStoreList, weights = {}) {
  const { explainEligibility } = require("./eligibility");

  const applicantsWithProfiles = applicantsList
    .map((app) => {
      const candidateId = app.candidateId || app.id;
      const profile = candidatesStoreList.find((c) => c.id === candidateId);
      if (!profile) return null;

      // GATE 1 HARD ELIGIBILITY CHECK:
      // If an applicant is not eligible for this opportunity, they MUST NOT be listed in the applicant list
      const eligibility = explainEligibility(profile, opp);
      if (!eligibility.eligible) return null;

      return {
        ...profile,
        appliedAt: app.appliedAt,
        applicationStatus: app.status || "Applied",
        ...scoreApplicantForJob(opp, profile, weights)
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));

  return applicantsWithProfiles.map((app, idx) => ({
    ...app,
    rank: idx + 1,
    score: app.totalScore,
    reason: `Ranked #${idx + 1} with ${app.totalScore}% overall fit: Competence ${app.sCompetence}% and Joining Likelihood ${app.joiningLikelihood}%.`
  }));
}

// Backward-compatibility adapter for existing endpoints
function rankEligible(candidate, eligibleOpps, weights = {}) {
  return rankJobsForCandidate(candidate, eligibleOpps, weights);
}

module.exports = {
  computeSkillScore,
  computeSalaryFit,
  computeDistanceFit,
  computeWorkModeFit,
  computeShiftFit,
  computeAvailabilityFit,
  normalizeWeights,
  scoreJobForCandidate,
  rankJobsForCandidate,
  scoreApplicantForJob,
  rankApplicantsForJob,
  rankEligible
};

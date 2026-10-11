/**
 * STAGE 2: PREFERENCE RANKING.
 * Only ever receives opportunities that already PASSED eligibility.
 * Skill relevance (semantic) is scored here; it can never change eligibility.
 */
const { matchSkills } = require("./skillMatcher");

const WEIGHTS = { required: 0.55, preferred: 0.15, experience: 0.15, location: 0.15 };
const LABEL = {
  required: "required-skill coverage",
  preferred: "nice-to-have skills",
  experience: "experience above the minimum",
  location: "location & work-mode preference"
};

const pct = (n) => `${Math.round(n * 100)}%`;
const coverage = (m, total) => (total === 0 ? 1 : m.reduce((s, x) => s + x.score, 0) / total);

function scoreOne(candidate, opp) {
  const req = matchSkills(candidate.skills, opp.requiredSkills || []);
  const pref = matchSkills(candidate.skills, opp.preferredSkills || []);

  const minExp = opp.criteria?.minExperienceYears || 0;
  const surplus = Math.max(0, (Number(candidate.experienceYears) || 0) - minExp);

  const preferredLocs = (candidate.preferredLocations || []).map((l) => l.toLowerCase());
  const locationMatch = opp.remote || preferredLocs.includes(String(opp.location).toLowerCase()) ? 1 : 0.4;

  // Work mode preference (Offline / Online)
  const modes = (candidate.preferredWorkModes || []).map((m) => String(m).toLowerCase());
  let workModeScore = 1;
  const oppMode = opp.remote ? "online" : "offline";
  if (modes.length === 1) {
    if (modes[0] === oppMode) {
      workModeScore = 1;
    } else {
      workModeScore = 0.4;
    }
  }

  const location = Math.min(1, locationMatch * 0.6 + workModeScore * 0.4);

  const parts = {
    required: coverage(req.matched, (opp.requiredSkills || []).length),
    preferred: coverage(pref.matched, (opp.preferredSkills || []).length),
    experience: Math.min(1, surplus / 3),
    location
  };
  const score = Object.keys(WEIGHTS).reduce((s, k) => s + WEIGHTS[k] * parts[k], 0);
  return { score, parts, required: req, preferred: pref, surplus, workModeScore };
}

function describe(opp, r, rank, prev, candidate) {
  const reqTotal = (opp.requiredSkills || []).length;
  let first = `You meet every hard requirement and match ${r.required.matched.length} of ${reqTotal} required skills`;
  const viaAlias = r.required.matched.filter((m) => m.type !== "exact");
  if (viaAlias.length) first += ` (${viaAlias.map((m) => `"${m.candidateSkill}" counted as ${m.skill}`).join(", ")})`;

  const bits = [first];
  if (r.required.missing.length) bits.push(`still missing ${r.required.missing.join(", ")}`);
  if (r.preferred.matched.length) bits.push(`also has nice-to-have ${r.preferred.matched.map((m) => m.skill).join(", ")}`);
  if (r.surplus > 0) bits.push(`${r.surplus} yr above the minimum experience`);
  if (opp.remote) bits.push("remote role");
  else if (r.parts.location === 1) bits.push("in a preferred location");

  const modes = (candidate?.preferredWorkModes || []).map((m) => String(m).toLowerCase());
  if (modes.length === 1 && r.workModeScore === 1) {
    bits.push(`matches your ${modes[0]} work mode preference`);
  }

  let text = `Ranked #${rank}: ${bits.join("; ")}.`;
  if (prev) {
    let worst = null;
    for (const k of Object.keys(WEIGHTS)) {
      const d = WEIGHTS[k] * (prev.parts[k] - r.parts[k]);
      if (!worst || d > worst.d) worst = { k, d };
    }
    if (worst.d > 0)
      text += ` Sits below "${prev.opp.title}" mainly on ${LABEL[worst.k]} (${pct(r.parts[worst.k])} vs ${pct(prev.parts[worst.k])}).`;
    else text += ` Ties with "${prev.opp.title}" on the scored factors.`;
  }
  return text;
}

/** @param eligibleOpps already filtered by eligibility.js */
function rankEligible(candidate, eligibleOpps) {
  const scored = eligibleOpps
    .map((opp) => ({ opp, ...scoreOne(candidate, opp) }))
    .sort((a, b) => b.score - a.score || a.opp.title.localeCompare(b.opp.title));

  return scored.map((r, i) => ({
    ...r.opp,
    rank: i + 1,
    score: Math.round(r.score * 100),
    breakdown: Object.fromEntries(Object.entries(r.parts).map(([k, v]) => [k, Math.round(v * 100)])),
    matchedSkills: r.required.matched,
    missingSkills: r.required.missing,
    matchedPreferred: r.preferred.matched,
    reason: describe(r.opp, r, i + 1, i ? scored[i - 1] : null, candidate)
  }));
}

module.exports = { scoreOne, rankEligible };

const express = require("express");
const opportunityStore = require("../data/opportunityStore");
const { explainEligibility, QUALIFICATION_LEVELS, LABELS } = require("../logic/eligibility");
const { rankEligible } = require("../logic/ranking");
const { buildPathway } = require("../logic/learningPathway");
const { sanitize } = require("../utils/sanitize");
const candidatesRouter = require("./candidates");
const opportunitiesRouter = require("./opportunities");

const router = express.Router();

// Mount child routers under /api
router.use("/candidates", candidatesRouter);
router.use("/opportunities", opportunitiesRouter);

router.get("/meta", (_req, res) =>
  res.json({ qualifications: QUALIFICATION_LEVELS.map((v) => ({ value: v, label: LABELS[v] })) }));

/**
 * Pure-ish matching runner that loads opportunities from the store on every request.
 */
async function runMatch(rawCandidate) {
  const candidate = sanitize(rawCandidate);
  const opportunities = await opportunityStore.getAll();

  // STAGE 1: explainable eligibility checks
  const eligibleOpps = [];
  const ineligible = [];

  for (const opp of opportunities) {
    const explanation = explainEligibility(candidate, opp);
    const enrichedOpp = {
      ...opp,
      ...explanation
    };

    if (explanation.eligible) {
      eligibleOpps.push(enrichedOpp);
    } else {
      ineligible.push(enrichedOpp);
    }
  }

  // STAGE 2: rank eligible only
  const ranked = rankEligible(candidate, eligibleOpps).map((o) => {
    const orig = eligibleOpps.find((e) => e.id === o.id);
    return {
      ...o,
      ...orig
    };
  });

  // Skill gaps for opportunities the candidate is interested in
  const skillGaps = (candidate.interestedOpportunityIds || [])
    .map((id) => opportunities.find((o) => o.id === id))
    .filter(Boolean)
    .map((opp) => {
      const explanation = explainEligibility(candidate, opp);
      return {
        opportunityId: opp.id,
        title: opp.title,
        company: opp.company,
        eligible: explanation.eligible,
        eligibilityStatus: explanation.eligibilityStatus,
        blockedBy: explanation.ineligibleReasons,
        requiredSkills: opp.requiredSkills || [],
        matchedSkills: explanation.matchingSkills,
        missingSkills: explanation.missingSkills,
        skillCoverage: explanation.skillCoverage,
        totalRequired: (opp.requiredSkills || []).length,
        pathway: buildPathway(candidate.skills || [], explanation.missingSkills)
      };
    });

  const top = ranked[0];
  const recommendation = opportunities.length === 0
    ? "No opportunities have been added yet."
    : !top
      ? "No opportunity currently passes all hard requirements. Review the failed conditions below; they come straight from each opportunity's criteria."
      : top.missingSkills.length === 0
        ? `Strongest match: ${top.title} at ${top.company}. You meet every requirement, so it is worth applying.`
        : `Best available: ${top.title} at ${top.company}. You are eligible, but closing ${top.missingSkills.length} skill gap(s) would strengthen your application.`;

  return { recommendation, eligible: ranked, ineligible, skillGaps };
}

// Stateless: every profile edit re-posts here and gets a fresh result.
router.post("/match", async (req, res, next) => {
  try {
    const result = await runMatch(req.body?.candidate);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.runMatch = runMatch;


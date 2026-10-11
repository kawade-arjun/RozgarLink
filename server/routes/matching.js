const express = require("express");
const opportunityStore = require("../data/opportunityStore");
const candidateStore = require("../data/candidateStore");
const { explainEligibility, QUALIFICATION_LEVELS, LABELS } = require("../logic/eligibility");
const { rankEligible } = require("../logic/ranking");
const { buildPathway, getCatalogue } = require("../logic/learningPathway");
const { sanitize } = require("../utils/sanitize");
const candidatesRouter = require("./candidates");
const opportunitiesRouter = require("./opportunities");
const authRouter = require("./auth");

const router = express.Router();

// Mount child routers under /api
router.use("/auth", authRouter);
router.use("/candidates", candidatesRouter);
router.use("/opportunities", opportunitiesRouter);

router.get("/meta", (_req, res) =>
  res.json({ qualifications: QUALIFICATION_LEVELS.map((v) => ({ value: v, label: LABELS[v] })) }));

/**
 * Pure-ish matching runner that loads opportunities from the store on every request.
 */
async function runMatch(rawCandidate, rawWeights = {}) {
  const candidate = sanitize(rawCandidate);
  const opportunities = await opportunityStore.getAll();
  const allCandidates = await candidateStore.getAll();
  const catalogue = await getCatalogue();

  const countApplicants = (opp) => {
    const list = [...(opp.applicants || [])];
    allCandidates.forEach((c) => {
      if (Array.isArray(c.appliedOpportunityIds) && c.appliedOpportunityIds.includes(opp.id)) {
        if (!list.some((a) => (a.candidateId || a.id) === c.id)) {
          list.push({ candidateId: c.id });
        }
      }
    });
    return list.filter((app) => {
      const c = allCandidates.find((cand) => cand.id === app.candidateId);
      return c && explainEligibility(c, opp).eligible;
    }).length;
  };

  // STAGE 1: explainable eligibility checks
  const eligibleOpps = [];
  const ineligible = [];

  for (const opp of opportunities) {
    const explanation = explainEligibility(candidate, opp);
    const applicantsCount = countApplicants(opp);
    const enrichedOpp = {
      ...opp,
      ...explanation,
      applicantsCount
    };

    if (explanation.eligible) {
      eligibleOpps.push(enrichedOpp);
    } else {
      ineligible.push(enrichedOpp);
    }
  }

  // STAGE 2: rank eligible only using Master Ranking Formula (Gate 2)
  const ranked = rankEligible(candidate, eligibleOpps, rawWeights).map((o) => {
    const orig = eligibleOpps.find((e) => e.id === o.id);
    const hasApplied = (candidate.appliedOpportunityIds || []).includes(o.id) ||
      (o.applicants || []).some((a) => a.candidateId === candidate.id);
    return {
      ...o,
      ...orig,
      score: o.score,
      breakdown: o.breakdown,
      weights: o.weights,
      matchedSkills: o.matchedSkills,
      missingSkills: o.missingSkills,
      applicantsCount: orig?.applicantsCount ?? countApplicants(o),
      hasApplied
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
        pathway: buildPathway(candidate.skills || [], explanation.missingSkills, catalogue)
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
    const result = await runMatch(req.body?.candidate, req.body?.weights);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.runMatch = runMatch;


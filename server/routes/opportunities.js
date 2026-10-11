const express = require("express");
const opportunityStore = require("../data/opportunityStore");
const candidateStore = require("../data/candidateStore");
const { sanitizeOpportunity, validateOpportunity } = require("../utils/sanitizeOpportunity");

const router = express.Router();

// GET /api/opportunities
router.get("/", async (_req, res, next) => {
  try {
    const list = await opportunityStore.getAll();
    const allCandidates = await candidateStore.getAll();

    const enriched = list.map((opp) => {
      const applicantsList = [...(opp.applicants || [])];
      allCandidates.forEach((c) => {
        if (Array.isArray(c.appliedOpportunityIds) && c.appliedOpportunityIds.includes(opp.id)) {
          if (!applicantsList.some((a) => (a.candidateId || a.id) === c.id)) {
            applicantsList.push({
              candidateId: c.id,
              candidateName: c.name,
              appliedAt: c.updatedAt || new Date().toISOString(),
              status: "Applied"
            });
          }
        }
      });

      const { explainEligibility } = require("../logic/eligibility");
      const eligibleApplicants = applicantsList.filter((app) => {
        const candidateId = app.candidateId || app.id;
        const profile = allCandidates.find((c) => c.id === candidateId);
        return profile && explainEligibility(profile, opp).eligible;
      });

      return {
        ...opp,
        applicants: eligibleApplicants,
        applicantsCount: eligibleApplicants.length
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

// GET /api/opportunities/:id
router.get("/:id", async (req, res, next) => {
  try {
    const opp = await opportunityStore.getById(req.params.id);
    if (!opp) {
      return res.status(404).json({ error: "Opportunity not found" });
    }
    const allCandidates = await candidateStore.getAll();
    const applicantsList = [...(opp.applicants || [])];
    allCandidates.forEach((c) => {
      if (Array.isArray(c.appliedOpportunityIds) && c.appliedOpportunityIds.includes(opp.id)) {
        if (!applicantsList.some((a) => (a.candidateId || a.id) === c.id)) {
          applicantsList.push({
            candidateId: c.id,
            candidateName: c.name,
            appliedAt: c.updatedAt || new Date().toISOString(),
            status: "Applied"
          });
        }
      }
    });

    const { explainEligibility } = require("../logic/eligibility");
    const eligibleApplicants = applicantsList.filter((app) => {
      const candidateId = app.candidateId || app.id;
      const profile = allCandidates.find((c) => c.id === candidateId);
      return profile && explainEligibility(profile, opp).eligible;
    });

    res.json({
      ...opp,
      applicants: eligibleApplicants,
      applicantsCount: eligibleApplicants.length
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/opportunities
router.post("/", async (req, res, next) => {
  try {
    const sanitized = sanitizeOpportunity(req.body);
    // Never trust client-supplied id on POST
    delete sanitized.id;

    const error = validateOpportunity(sanitized);
    if (error) {
      return res.status(400).json({ error });
    }

    const created = await opportunityStore.create(sanitized);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/opportunities/:id
router.put("/:id", async (req, res, next) => {
  try {
    const sanitized = sanitizeOpportunity(req.body);
    delete sanitized.id;

    const error = validateOpportunity(sanitized);
    if (error) {
      return res.status(400).json({ error });
    }

    const updated = await opportunityStore.update(req.params.id, sanitized);
    if (!updated) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/opportunities/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const removed = await opportunityStore.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    // When an opportunity is deleted, also remove its id from every stored candidate's interestedOpportunityIds
    await candidateStore.removeOpportunityInterest(req.params.id);

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// POST /api/opportunities/:id/apply
router.post("/:id/apply", async (req, res, next) => {
  try {
    const oppId = req.params.id;
    const { candidateId, candidateName } = req.body;
    if (!candidateId) {
      return res.status(400).json({ error: "candidateId is required" });
    }

    const opp = await opportunityStore.getById(oppId);
    if (!opp) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    const candidate = await candidateStore.getById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Gate 1 check: Verify eligibility
    const { explainEligibility } = require("../logic/eligibility");
    const explanation = explainEligibility(candidate, opp);
    if (!explanation.eligible) {
      return res.status(400).json({
        error: "Candidate is not eligible for this opportunity",
        reasons: explanation.ineligibleReasons
      });
    }

    await opportunityStore.addApplicant(oppId, {
      candidateId,
      candidateName: candidateName || candidate.name
    });

    await candidateStore.addAppliedOpportunity(candidateId, oppId);

    res.json({
      success: true,
      message: "Application submitted successfully",
      opportunityId: oppId,
      candidateId
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/opportunities/:id/applicants
router.get("/:id/applicants", async (req, res, next) => {
  try {
    const opp = await opportunityStore.getById(req.params.id);
    if (!opp) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    const allCandidates = await candidateStore.getAll();
    const applicantsList = [...(opp.applicants || [])];

    // Ensure candidates with appliedOpportunityIds are included
    allCandidates.forEach((c) => {
      if (Array.isArray(c.appliedOpportunityIds) && c.appliedOpportunityIds.includes(opp.id)) {
        if (!applicantsList.some((a) => (a.candidateId || a.id) === c.id)) {
          applicantsList.push({
            candidateId: c.id,
            candidateName: c.name,
            appliedAt: c.updatedAt || new Date().toISOString(),
            status: "Applied"
          });
        }
      }
    });
    const { rankApplicantsForJob } = require("../logic/ranking");

    const weights = {
      u_competence: req.query.u_competence,
      u_salary: req.query.u_salary,
      u_commute: req.query.u_commute,
      u_availability: req.query.u_availability
    };

    const rankedApplicants = rankApplicantsForJob(opp, applicantsList, allCandidates, weights);
    res.json({
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      company: opp.company,
      totalApplicants: rankedApplicants.length,
      applicants: rankedApplicants
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

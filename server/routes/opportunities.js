const express = require("express");
const opportunityStore = require("../data/opportunityStore");
const candidateStore = require("../data/candidateStore");
const { sanitizeOpportunity, validateOpportunity } = require("../utils/sanitizeOpportunity");

const router = express.Router();

// GET /api/opportunities
router.get("/", async (_req, res, next) => {
  try {
    const list = await opportunityStore.getAll();
    res.json(list);
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
    res.json(opp);
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

module.exports = router;

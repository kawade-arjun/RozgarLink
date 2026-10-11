const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const candidateStore = require("../data/candidateStore");
const { sanitize, validateCandidate } = require("../utils/sanitize");

const router = express.Router();

const RESUMES_DIR = path.join(__dirname, "../data/resumes");
if (!fs.existsSync(RESUMES_DIR)) {
  fs.mkdirSync(RESUMES_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, RESUMES_DIR);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || ".pdf";
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: function (_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".pdf" || file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  }
});

// POST /api/candidates/upload-resume
router.post("/upload-resume", (req, res) => {
  upload.single("resume")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File size must not exceed 5MB" });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message || "Failed to upload file" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No resume file provided" });
    }
    res.status(201).json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    });
  });
});

// GET /api/candidates/resume/:filename
router.get("/resume/:filename", (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(RESUMES_DIR, safeFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Resume file not found" });
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${safeFilename}"`);
  fs.createReadStream(filePath).pipe(res);
});

// DELETE /api/candidates/resume/:filename
router.delete("/resume/:filename", (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(RESUMES_DIR, safeFilename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {}
  }
  res.status(204).end();
});

// GET /api/candidates/by-email/:email
router.get("/by-email/:email", async (req, res, next) => {
  try {
    const email = req.params.email ? req.params.email.toLowerCase().trim() : "";
    const all = await candidateStore.getAll();
    const found = all.find((c) => c.email && c.email.toLowerCase().trim() === email);
    if (!found) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(found);
  } catch (err) {
    next(err);
  }
});

// GET /api/candidates
router.get("/", async (_req, res, next) => {
  try {
    const list = await candidateStore.getAll();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/candidates/:id
router.get("/:id", async (req, res, next) => {
  try {
    const candidate = await candidateStore.getById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    res.json(candidate);
  } catch (err) {
    next(err);
  }
});

// POST /api/candidates
router.post("/", async (req, res, next) => {
  try {
    const sanitized = sanitize(req.body);
    // Never trust client-supplied id on POST
    delete sanitized.id;

    const error = validateCandidate(sanitized);
    if (error) {
      return res.status(400).json({ error });
    }

    const created = await candidateStore.create(sanitized);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/candidates/:id
router.put("/:id", async (req, res, next) => {
  try {
    const sanitized = sanitize(req.body);
    delete sanitized.id;

    const error = validateCandidate(sanitized);
    if (error) {
      return res.status(400).json({ error });
    }

    const updated = await candidateStore.update(req.params.id, sanitized);
    if (!updated) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

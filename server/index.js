const express = require("express");
const cors = require("cors");
const matching = require("./routes/matching");

const app = express();
app.use(cors());
app.use(express.json({ limit: "100kb" }));

// Handle JSON parsing errors so invalid JSON returns 400, not a stack trace
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  next(err);
});

const path = require("path");

app.use("/api", matching);
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use(express.static(path.join(__dirname, "../client/dist")));

// General error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "127.0.0.1", () => console.log(`RozgarLink server running on http://127.0.0.1:${PORT}`));

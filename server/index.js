const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./config/db");
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

app.use("/api", matching);
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use(express.static(path.join(__dirname, "../client/dist")));

// Fallback all other GET requests to index.html for client-side routing
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// General error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";

connectDB()
  .then(() => {
    app.listen(PORT, HOST, () => console.log(`RozgarLink server running on http://${HOST}:${PORT}`));
  })
  .catch((err) => {
    console.error("Starting server with MongoDB connection warning:", err.message);
    app.listen(PORT, HOST, () => console.log(`RozgarLink server running on http://${HOST}:${PORT} (Waiting for MongoDB)`));
  });

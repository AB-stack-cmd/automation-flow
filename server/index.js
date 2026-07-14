// Express backend for the workspace project
import express from "express";

const app = express();
const PORT = process.env.PORT || 4001;

// Simple health‑check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Example API route
app.get("/api/message", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Express server listening on http://localhost:${PORT}`);
});

// Express backend for the workspace project
import express from "express";
import { env } from "../env.js";

const app = express();
const PORT = env.EXPRESS_PORT || env.PORT || 4001;

// Base route & health-check endpoints
app.get("/", (req, res) => {
  res.json({ service: "Companion Express API", status: "ok", timestamp: new Date() });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

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

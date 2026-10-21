const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();
const api = express();

api.disable("x-powered-by");

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || [
    "https://holeinthewall-13f6a.web.app",
    "https://holeinthewall-13f6a.firebaseapp.com",
    "http://localhost:5000"
  ].join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

api.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "no-referrer");
  res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

api.use(cors({
  origin: (origin, callback) => {
    // Requests without an Origin header include same-origin and server-side calls.
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin is not allowed."));
  }
}));
api.use(express.json({ limit: "32kb" }));

api.get("/projects", async (_req, res) => {
  try {
    const snapshot = await db.collection("projects").get();
    const projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    projects.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    res.json(projects);
  } catch (error) {
    logger.error("Unable to list projects", error);
    res.status(500).json({ error: "Unable to load projects." });
  }
});

api.post("/projects", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "Request body must be a JSON object." });
  }

  const submittedFields = Object.keys(req.body);
  if (submittedFields.some((field) => !["title", "description"].includes(field))) {
    return res.status(400).json({ error: "Only title and description are accepted." });
  }

  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body.description === "string" ? req.body.description.trim() : "";

  if (!title || !description || title.length > 120 || description.length > 2000) {
    return res.status(400).json({ error: "Title and description are required and must be within the length limits." });
  }

  try {
    const project = {
      title,
      description,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    const reference = await db.collection("projects").add(project);
    res.status(201).json({ id: reference.id, title, description });
  } catch (error) {
    logger.error("Unable to create project", error);
    res.status(500).json({ error: "Unable to save the project." });
  }
});

api.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Request body must contain valid JSON." });
  }
  if (error.message === "Origin is not allowed.") {
    return res.status(403).json({ error: "Request origin is not allowed." });
  }
  logger.error("Unhandled API error", error);
  return res.status(500).json({ error: "Unexpected server error." });
});

exports.api = onRequest({ region: "us-central1" }, api);

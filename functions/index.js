const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();
const api = express();

api.use(cors({ origin: true }));
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

exports.api = onRequest({ region: "us-central1" }, api);

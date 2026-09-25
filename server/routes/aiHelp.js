// server/routes/aiHelp.js
//
// CHANGED from your original: now accepts an optional `history` array in
// the request body so the AI Help chat can handle follow-up questions
// with context. Everything else — auth, validation, error handling — is
// unchanged.

import express from "express";
import User from "../models/User.js";
import { generateHelpAnswer, isAiContentEnabled } from "../services/aiContent.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /api/ai-help  (Authorization: Bearer <token>)
// body: { question, history? }
// history: [{ role: "user" | "assistant", text }, ...] — the conversation
// so far, sent by the frontend on each call, so Gemini has context for
// follow-up questions. Omit it (or send []) for a fresh question.
router.post("/", requireAuth, async (req, res) => {
  try {
    const { question, history } = req.body || {};
    if (!question || !question.trim()) {
      return res.status(400).json({ error: "question is required." });
    }

    if (!isAiContentEnabled()) {
      return res.json({ aiEnabled: false, answer: null });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const answer = await generateHelpAnswer({
      question,
      targetLanguage: user.targetLanguage,
      preferredLanguage: user.preferredLanguage,
      history: Array.isArray(history) ? history.slice(-20) : [], // cap context sent to Gemini
    });

    res.json({ aiEnabled: true, answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get an answer." });
  }
});

export default router;

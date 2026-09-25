// server/routes/assessment.js
//
// CHANGED from your original: VOCAB_BANK/UNIT_WORD_INDEXES now come from
// getMergedCurriculum() (static units 1-6 + admin-created units) instead
// of a static top-level import — so quizzes can include admin-added
// content. Everything else (AI question generation, submit logic,
// history) is untouched.

import express from "express";
import { getMergedCurriculum } from "../data/mergedCurriculum.js";
import { generateAssessmentQuestions, isAiContentEnabled } from "../services/aiContent.js";
import { computeBenchmarkLevel, predictNextProficiency } from "../services/proficiency.js";
import { requireAuth } from "../middleware/auth.js";
import Progress from "../models/Progress.js";

const router = express.Router();

// GET /api/assessment/:targetLanguage?unit=1 — public.
// Omit `unit` for the full certification bank. If ANTHROPIC_API_KEY is
// configured, tries AI-generated questions first and falls back to the
// curriculum bank (static + admin-added) if that fails.
router.get("/:targetLanguage", async (req, res) => {
  try {
    const { targetLanguage } = req.params;
    const { unit } = req.query;

    const { unitWordIndexes, vocabBank } = await getMergedCurriculum();
    const bank = vocabBank[targetLanguage] || vocabBank.English;
    const indexes = unit ? (unitWordIndexes[unit] || []) : bank.map((_, i) => i);
    const questions = indexes.map((i) => bank[i]).filter(Boolean);

    if (isAiContentEnabled()) {
      const aiQuestions = await generateAssessmentQuestions({ targetLanguage, count: questions.length || 5 });
      if (aiQuestions) return res.json({ source: "ai", questions: aiQuestions });
    }

    res.json({ source: "curriculum", questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load assessment." });
  }
});

// GET /api/assessment/history  (Authorization: Bearer <token>)
// Full attempt history for the "results review" screen.
router.get("/history/all", requireAuth, async (req, res) => {
  try {
    const progress = await Progress.findOne({ userId: req.userId });
    const attempts = progress?.attempts || [];

    const history = attempts
      .map((a) => ({
        unitId: a.unitId ?? null,
        assessmentType: a.assessmentType,
        score: a.score,
        total: a.total,
        percent: a.total ? Math.round((a.score / a.total) * 100) : 0,
        passed: a.total ? a.score / a.total >= 0.75 : false,
        date: a.date,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      history,
      xpTotal: progress?.xpTotal || 0,
      proficiencyLevel: progress?.proficiencyLevel || "Beginner",
      completedUnits: progress?.completedUnits || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load assessment history." });
  }
});

// POST /api/assessment/submit  (Authorization: Bearer <token>)
// body: { unitId?, assessmentType, score, total, weakWords? }
router.post("/submit", requireAuth, async (req, res) => {
  try {
    const { unitId, assessmentType = "vocabulary", score, total, weakWords = [] } = req.body || {};

    if (typeof score !== "number" || typeof total !== "number") {
      return res.status(400).json({ error: "score and total are required numbers." });
    }

    let progress = await Progress.findOne({ userId: req.userId });
    if (!progress) progress = new Progress({ userId: req.userId });

    progress.attempts.push({ unitId, assessmentType, score, total });
    progress.xpTotal += score * 5;

    if (unitId && total > 0 && score / total >= 0.75 && !progress.completedUnits.includes(unitId)) {
      progress.completedUnits.push(unitId);
    }

    progress.weakWords = Array.from(new Set([...(progress.weakWords || []), ...weakWords]));
    progress.proficiencyLevel = computeBenchmarkLevel(progress.attempts);

    await progress.save();

    res.json({
      xpTotal: progress.xpTotal,
      completedUnits: progress.completedUnits,
      proficiencyLevel: progress.proficiencyLevel,
      predictedNextLevel: predictNextProficiency(progress.attempts),
      weakWords: progress.weakWords,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save assessment result." });
  }
});

export default router;

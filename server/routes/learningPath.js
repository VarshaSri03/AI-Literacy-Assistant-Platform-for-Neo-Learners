// server/routes/learningPath.js
//
// CHANGED from your original: CURRICULUM_UNITS now comes from
// getMergedCurriculum() (static + admin-created units), so the "next
// recommended unit" can include admin-added content. Everything else
// (AI lesson generation, proficiency prediction) is untouched.

import express from "express";
import Progress from "../models/Progress.js";
import User from "../models/User.js";
import { getMergedCurriculum } from "../data/mergedCurriculum.js";
import { generatePersonalizedLesson, isAiContentEnabled } from "../services/aiContent.js";
import { predictNextProficiency } from "../services/proficiency.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/learning-path  (Authorization: Bearer <token>)
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const progress = await Progress.findOne({ userId: req.userId });
    const completedUnits = progress?.completedUnits || [];
    const weakWords = progress?.weakWords || [];
    const attempts = progress?.attempts || [];

    const { units } = await getMergedCurriculum();

    const recommendedUnit =
      units.find((u) => !completedUnits.includes(u.id)) || units[units.length - 1];

    const predictedLevel = predictNextProficiency(attempts);

    let aiLesson = null;
    if (isAiContentEnabled()) {
      aiLesson = await generatePersonalizedLesson({
        targetLanguage: user.targetLanguage,
        preferredLanguage: user.preferredLanguage,
        level: predictedLevel,
        weakWords,
      });
    }

    res.json({
      recommendedUnit,
      predictedLevel,
      currentLevel: progress?.proficiencyLevel || user.level || "Beginner",
      xpTotal: progress?.xpTotal || 0,
      completedUnits,
      weakWords,
      aiLesson,
      aiEnabled: isAiContentEnabled(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load learning path." });
  }
});

export default router;

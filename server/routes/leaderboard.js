// server/routes/leaderboard.js
import express from "express";
import Progress from "../models/Progress.js";
import User from "../models/User.js";

const router = express.Router();

// GET /api/leaderboard — public. Top 20 learners by total XP.
// Names only (no email/password); fine to be public for a learning app.
router.get("/", async (_req, res) => {
  try {
    const top = await Progress.find({})
      .sort({ xpTotal: -1 })
      .limit(20)
      .populate("userId", "name username")
      .lean();

    const leaderboard = top
      .filter((p) => p.userId) // guard against orphaned progress docs
      .map((p, i) => ({
        rank: i + 1,
        name: p.userId.name,
        username: p.userId.username,
        xpTotal: p.xpTotal,
        proficiencyLevel: p.proficiencyLevel,
      }));

    res.json({ leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load leaderboard." });
  }
});

export default router;

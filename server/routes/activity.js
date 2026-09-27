// server/routes/activity.js
//
// NEW route file — powers Daily Activities, Streak, Calendar, Weekly
// Report, Achievements, and Daily Goal. Mounted at /api/activity in
// index.js. All endpoints require auth (a learner's own activity only).
//
// Design choice: streak/calendar/weekly numbers are computed fresh from
// DailyActivity on every request rather than cached on the User/Progress
// doc — slightly more DB work, but guarantees the numbers can never drift
// out of sync with the underlying daily records.

import express from "express";
import DailyActivity from "../models/Activity.js";
import Progress from "../models/Progress.js";
import { requireAuth } from "../middleware/auth.js";
import { getMergedCurriculum } from "../data/mergedCurriculum.js";

const router = express.Router();

const XP_MAP = { vocabulary: 5, lesson: 10, speaking: 8, listening: 8, quiz: 15, aiHelp: 3 };
const ACTIVITY_TYPES = Object.keys(XP_MAP);

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD", UTC
}

function addDays(dateStr, delta) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Longest run + current run (walking back from today) over a Set of "YYYY-MM-DD" strings. */
function computeStreaks(dateSet) {
  if (dateSet.size === 0) return { current: 0, longest: 0, lastActiveDate: null };

  const sorted = [...dateSet].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (addDays(sorted[i - 1], 1) === sorted[i]) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak: walk backward from today. If today has no activity
  // yet, the streak isn't broken until yesterday is also missing — so
  // start from yesterday in that case (a learner shouldn't lose their
  // streak just because they haven't opened the app yet today).
  const today = todayStr();
  let cursor = dateSet.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (dateSet.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, longest, lastActiveDate: sorted[sorted.length - 1] };
}

// POST /api/activity/record  { type: "vocabulary"|"lesson"|"speaking"|"listening"|"quiz"|"aiHelp", minutes? }
// Marks today's checklist item done, adds minutes, awards XP (also
// reflected on Progress.xpTotal so the existing XP badge stays accurate).
router.post("/record", requireAuth, async (req, res) => {
  try {
    const { type, minutes = 0 } = req.body || {};
    if (!ACTIVITY_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${ACTIVITY_TYPES.join(", ")}` });
    }

    const date = todayStr();
    const xp = XP_MAP[type];

    const doc = await DailyActivity.findOneAndUpdate(
      { userId: req.userId, date },
      {
        $set: { [`activities.${type}`]: true },
        $inc: { minutes: Math.max(0, Number(minutes) || 0), xpEarned: xp },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Progress.findOneAndUpdate(
      { userId: req.userId },
      { $inc: { xpTotal: xp } },
      { upsert: true }
    );

    res.json({ activity: doc, xpEarned: xp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to record activity." });
  }
});

// GET /api/activity/today — checklist + goal progress + simple recommendations
router.get("/today", requireAuth, async (req, res) => {
  try {
    const date = todayStr();
    const [today, progress] = await Promise.all([
      DailyActivity.findOne({ userId: req.userId, date }).lean(),
      Progress.findOne({ userId: req.userId }).lean(),
    ]);

    const activities = today?.activities || Object.fromEntries(ACTIVITY_TYPES.map((t) => [t, false]));
    const completedCount = Object.values(activities).filter(Boolean).length;
    const goalMinutes = progress?.dailyGoalMinutes || 15;
    const minutesToday = today?.minutes || 0;

    // Simple, honest, rule-based recommendations — no AI call needed.
    const recommendations = [];
    if (!progress || (progress.attempts || []).length === 0) {
      recommendations.push({ icon: "🎯", text: "Take your first assessment", action: "assessment" });
    }
    if ((progress?.weakWords || []).length > 0) {
      recommendations.push({ icon: "🔁", text: `Review ${progress.weakWords.length} word(s) you found tricky`, action: "review" });
    }
    if (!activities.lesson) {
      recommendations.push({ icon: "📖", text: "Continue your lesson", action: "path" });
    }
    if (!activities.speaking) {
      recommendations.push({ icon: "🎤", text: "Practice speaking", action: "voice" });
    }
    if (!recommendations.length) {
      recommendations.push({ icon: "🎉", text: "You're all caught up today — great work!", action: null });
    }

    res.json({
      date,
      activities,
      completedCount,
      totalCount: ACTIVITY_TYPES.length,
      minutesToday,
      goalMinutes,
      goalMet: minutesToday >= goalMinutes,
      recommendations: recommendations.slice(0, 4),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load today's activity." });
  }
});

// PATCH /api/activity/goal  { dailyGoalMinutes: 10|15|20|30 }
router.patch("/goal", requireAuth, async (req, res) => {
  try {
    const { dailyGoalMinutes } = req.body || {};
    if (![10, 15, 20, 30].includes(Number(dailyGoalMinutes))) {
      return res.status(400).json({ error: "dailyGoalMinutes must be 10, 15, 20, or 30." });
    }
    const progress = await Progress.findOneAndUpdate(
      { userId: req.userId },
      { dailyGoalMinutes: Number(dailyGoalMinutes) },
      { upsert: true, new: true }
    );
    res.json({ dailyGoalMinutes: progress.dailyGoalMinutes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update daily goal." });
  }
});

// GET /api/activity/streak
router.get("/streak", requireAuth, async (req, res) => {
  try {
    const docs = await DailyActivity.find({ userId: req.userId }).select("date").lean();
    const dateSet = new Set(docs.map((d) => d.date));
    const { current, longest, lastActiveDate } = computeStreaks(dateSet);
    res.json({ currentStreak: current, longestStreak: longest, activeDays: dateSet.size, lastActiveDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load streak." });
  }
});

// GET /api/activity/calendar?month=2026-09  (defaults to current month)
router.get("/calendar", requireAuth, async (req, res) => {
  try {
    const month = /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : todayStr().slice(0, 7);
    const docs = await DailyActivity.find({
      userId: req.userId,
      date: { $gte: `${month}-01`, $lte: `${month}-31` },
    }).lean();

    const byDate = Object.fromEntries(docs.map((d) => [d.date, d]));
    const [year, mon] = month.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const dateStr = `${month}-${String(i + 1).padStart(2, "0")}`;
      const d = byDate[dateStr];
      const activeCount = d ? Object.values(d.activities).filter(Boolean).length : 0;
      const level = !d ? "none" : activeCount >= 3 ? "active" : "low";
      return { date: dateStr, level, minutes: d?.minutes || 0 };
    });

    res.json({ month, days });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load calendar." });
  }
});

// GET /api/activity/weekly — last 7 days
router.get("/weekly", requireAuth, async (req, res) => {
  try {
    const start = addDays(todayStr(), -6);
    const docs = await DailyActivity.find({ userId: req.userId, date: { $gte: start } }).lean();

    const activeDays = docs.length;
    const learningMinutes = docs.reduce((s, d) => s + (d.minutes || 0), 0);
    const lessonsCompleted = docs.filter((d) => d.activities.lesson).length;
    const wordsSessions = docs.filter((d) => d.activities.vocabulary).length;
    const speakingSessions = docs.filter((d) => d.activities.speaking).length;
    const aiQuestions = docs.filter((d) => d.activities.aiHelp).length;

    const days = Array.from({ length: 7 }, (_, i) => {
      const dateStr = addDays(start, i);
      const d = docs.find((x) => x.date === dateStr);
      return { date: dateStr, minutes: d?.minutes || 0, active: !!d };
    });

    res.json({ activeDays, learningMinutes, lessonsCompleted, wordsSessions, speakingSessions, aiQuestions, days });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load weekly report." });
  }
});

// GET /api/activity/achievements — computed from real data, nothing invented
router.get("/achievements", requireAuth, async (req, res) => {
  try {
    const [progress, activityDocs, { unitWordIndexes }] = await Promise.all([
      Progress.findOne({ userId: req.userId }).lean(),
      DailyActivity.find({ userId: req.userId }).lean(),
      getMergedCurriculum(),
    ]);

    const completedUnits = progress?.completedUnits || [];
    const wordsLearned = completedUnits.reduce((sum, id) => sum + (unitWordIndexes[id]?.length || 0), 0);
    const dateSet = new Set(activityDocs.map((d) => d.date));
    const { current: currentStreak } = computeStreaks(dateSet);
    const everSpoken = activityDocs.some((d) => d.activities.speaking);
    const everListened = activityDocs.some((d) => d.activities.listening);
    const everAskedAi = activityDocs.some((d) => d.activities.aiHelp);

    const achievements = [
      { id: "firstLesson", icon: "🏆", title: "First Lesson", unlocked: completedUnits.length > 0 || activityDocs.some((d) => d.activities.lesson) },
      { id: "streak7", icon: "🔥", title: "7 Day Streak", unlocked: currentStreak >= 7 },
      { id: "words100", icon: "📚", title: "100 Words", unlocked: wordsLearned >= 100, progress: `${wordsLearned}/100` },
      { id: "speaking", icon: "🎤", title: "Speaking Practice", unlocked: everSpoken },
      { id: "listening", icon: "👂", title: "Listening Practice", unlocked: everListened },
      { id: "aiExplorer", icon: "🤖", title: "AI Explorer", unlocked: everAskedAi },
    ];

    res.json({ achievements, wordsLearned, currentStreak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load achievements." });
  }
});

export default router;

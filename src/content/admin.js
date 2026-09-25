// server/routes/admin.js
//
// Backs the admin dashboard (src/AdminDashboard.jsx via src/adminApi.js).
// Every route here is double-gated: requireAuth confirms the JWT is valid,
// requireAdmin confirms role === "admin" — exactly what AdminDashboard.jsx's
// own comment says ("the real protection is server-side").

import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// Every route below requires a signed-in admin.
router.use(requireAuth, requireAdmin);

/* ------------------------------------------------------------------ */
/*  GET /api/admin/stats — platform overview (AdminDashboard OverviewTab) */
/* ------------------------------------------------------------------ */
router.get("/stats", async (_req, res) => {
  try {
    const users = await User.find(
      {},
      "role isActive xpTotal attempts preferredLanguage targetLanguage proficiencyLevel createdAt"
    ).lean();

    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.isActive !== false).length;
    const suspendedUsers = totalUsers - activeUsers;
    const admins = users.filter((u) => u.role === "admin").length;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newThisWeek = users.filter((u) => u.createdAt && new Date(u.createdAt) >= oneWeekAgo).length;

    const totalXp = users.reduce((sum, u) => sum + (u.xpTotal || 0), 0);

    const allAttempts = users.flatMap((u) => u.attempts || []);
    const totalAttempts = allAttempts.length;
    const passCount = allAttempts.filter((a) => a.passed).length;
    const passRate = totalAttempts ? Math.round((passCount / totalAttempts) * 100) : 0;
    const avgScore = totalAttempts
      ? Math.round(allAttempts.reduce((sum, a) => sum + (a.percent || 0), 0) / totalAttempts)
      : 0;

    const tally = (key) => {
      const counts = {};
      for (const u of users) {
        const val = u[key];
        if (!val) continue;
        counts[val] = (counts[val] || 0) + 1;
      }
      return counts;
    };

    res.json({
      totalUsers,
      activeUsers,
      suspendedUsers,
      newThisWeek,
      admins,
      totalXp,
      totalAttempts,
      passRate,
      avgScore,
      byPreferredLanguage: tally("preferredLanguage"),
      byTargetLanguage: tally("targetLanguage"),
      byLevel: tally("proficiencyLevel"),
    });
  } catch (err) {
    console.error("GET /api/admin/stats failed:", err);
    res.status(500).json({ error: "Failed to load admin stats" });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/admin/users — paginated, searchable learner list          */
/* ------------------------------------------------------------------ */
router.get("/users", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const search = (req.query.search || "").trim();

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const users = rows.map((u) => ({
      id: u._id,
      name: u.name,
      username: u.username,
      targetLanguage: u.targetLanguage,
      preferredLanguage: u.preferredLanguage,
      proficiencyLevel: u.proficiencyLevel,
      xpTotal: u.xpTotal || 0,
      attempts: (u.attempts || []).length,
      role: u.role,
      isActive: u.isActive !== false,
    }));

    res.json({ users, total, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    console.error("GET /api/admin/users failed:", err);
    res.status(500).json({ error: "Failed to load users" });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/admin/users/:id — one learner + full attempt history      */
/* ------------------------------------------------------------------ */
router.get("/users/:id", async (req, res) => {
  try {
    const u = await User.findById(req.params.id).lean();
    if (!u) return res.status(404).json({ error: "User not found" });

    res.json({
      user: {
        id: u._id,
        name: u.name,
        username: u.username,
        email: u.email,
        age: u.age,
        targetLanguage: u.targetLanguage,
        preferredLanguage: u.preferredLanguage,
        proficiencyLevel: u.proficiencyLevel,
        xpTotal: u.xpTotal || 0,
        completedUnits: (u.completedUnits || []).length,
        joinedAt: u.createdAt,
      },
      goals: u.goals || [],
      weakWords: u.weakWords || [],
      attempts: (u.attempts || [])
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((a) => ({
          unitId: a.unitId ?? null,
          assessmentType: a.assessmentType,
          score: a.score,
          total: a.total,
          percent: a.percent,
          passed: a.passed,
          date: a.date,
        })),
    });
  } catch (err) {
    console.error("GET /api/admin/users/:id failed:", err);
    res.status(500).json({ error: "Failed to load user" });
  }
});

/* ------------------------------------------------------------------ */
/*  PATCH /api/admin/users/:id — change role or active/suspended status */
/* ------------------------------------------------------------------ */
router.patch("/users/:id", async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ error: "You can't change your own account here" });
    }

    const patch = {};
    if (req.body.role !== undefined) {
      if (!["learner", "admin"].includes(req.body.role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      patch.role = req.body.role;
    }
    if (req.body.isActive !== undefined) {
      patch.isActive = !!req.body.isActive;
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const u = await User.findByIdAndUpdate(req.params.id, patch, { new: true }).lean();
    if (!u) return res.status(404).json({ error: "User not found" });

    res.json({
      user: {
        id: u._id,
        name: u.name,
        username: u.username,
        targetLanguage: u.targetLanguage,
        preferredLanguage: u.preferredLanguage,
        proficiencyLevel: u.proficiencyLevel,
        xpTotal: u.xpTotal || 0,
        attempts: (u.attempts || []).length,
        role: u.role,
        isActive: u.isActive !== false,
      },
    });
  } catch (err) {
    console.error("PATCH /api/admin/users/:id failed:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

/* ------------------------------------------------------------------ */
/*  DELETE /api/admin/users/:id — permanently remove a learner          */
/* ------------------------------------------------------------------ */
router.delete("/users/:id", async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ error: "You can't delete your own account here" });
    }
    const u = await User.findByIdAndDelete(req.params.id);
    if (!u) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/admin/users/:id failed:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/admin/content — read-only curriculum summary               */
/* ------------------------------------------------------------------ */
router.get("/content", async (_req, res) => {
  try {
    // Curriculum lives in code (per AdminDashboard.jsx's own note), not the
    // database — this tries to read it from server/data/curriculum.js.
    // Since that file wasn't available while writing this route, it
    // defensively supports a couple of likely export shapes. If the numbers
    // below look wrong for your real curriculum file, share it and this
    // block just needs its field names adjusted.
    let curriculum;
    try {
      curriculum = (await import("../data/curriculum.js")).default;
    } catch {
      curriculum = null;
    }

    let languages = [];
    let unitCount = 0;
    let wordsPerLanguage = {};
    let units = [];

    if (curriculum && Array.isArray(curriculum.units)) {
      // Shape A: { units: [{id, skills}], vocabulary: { Hindi: [...], ... } }
      units = curriculum.units;
      unitCount = curriculum.units.length;
      const vocab = curriculum.vocabulary || {};
      languages = Object.keys(vocab);
      wordsPerLanguage = Object.fromEntries(
        Object.entries(vocab).map(([lang, words]) => [lang, Array.isArray(words) ? words.length : 0])
      );
    } else if (curriculum && typeof curriculum === "object") {
      // Shape B: keyed by language — { Hindi: { units: [...], words: [...] }, ... }
      languages = Object.keys(curriculum);
      const first = curriculum[languages[0]] || {};
      unitCount = Array.isArray(first.units) ? first.units.length : 0;
      units = Array.isArray(first.units) ? first.units : [];
      wordsPerLanguage = Object.fromEntries(
        languages.map((lang) => [lang, Array.isArray(curriculum[lang]?.words) ? curriculum[lang].words.length : 0])
      );
    } else {
      // No curriculum module found — fall back to what's on user records
      // so the tab still shows something rather than erroring out.
      const distinctTargets = await User.distinct("targetLanguage");
      languages = distinctTargets.filter(Boolean);
    }

    res.json({ languages, unitCount, wordsPerLanguage, units });
  } catch (err) {
    console.error("GET /api/admin/content failed:", err);
    res.status(500).json({ error: "Failed to load content summary" });
  }
});

export default router;

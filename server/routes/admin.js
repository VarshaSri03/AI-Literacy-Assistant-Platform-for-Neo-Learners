// server/routes/admin.js
//
// ADMIN API — every route here is behind requireAdmin.
//
// ─── PROMOTING YOUR FIRST ADMIN ───────────────────────────────────────
// No self-promotion endpoint exists on purpose. Use scripts/makeAdmin.js
// or promote directly in MongoDB.
// ──────────────────────────────────────────────────────────────────────
//
// CHANGED from your original:
//   - PATCH /users/:id accepts proficiencyLevel (from earlier)
//   - GET /activity, GET /users/export.csv, GET /ai-status (from earlier)
//   - NEW: POST /units — admin creates a new unit (title, skills, words)
//   - NEW: DELETE /units/:id — removes an admin-created unit (static
//     units 1-6 can't be deleted this way — see note on that route)
//   - GET /content now shows the MERGED curriculum (static + custom),
//     each unit flagged custom:true/false so the UI knows what's deletable

import express from "express";
import User from "../models/User.js";
import Progress from "../models/Progress.js";
import CustomUnit from "../models/CustomUnit.js";
import { requireAdmin } from "../middleware/auth.js";
import { getMergedCurriculum } from "../data/mergedCurriculum.js";
import { isAiContentEnabled } from "../services/aiContent.js";

const router = express.Router();

router.use(requireAdmin);

function toAdminUserRow(user, progress) {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    age: user.age,
    preferredLanguage: user.preferredLanguage,
    targetLanguage: user.targetLanguage,
    level: user.level,
    role: user.role,
    isActive: user.isActive !== false,
    joinedAt: user.createdAt,
    xpTotal: progress?.xpTotal || 0,
    completedUnits: progress?.completedUnits?.length || 0,
    attempts: progress?.attempts?.length || 0,
    proficiencyLevel: progress?.proficiencyLevel || user.level || "Beginner",
  };
}

// ---------------------------------------------------------------------
// STATS / ACTIVITY / AI STATUS / EXPORT (unchanged from earlier rounds)
// ---------------------------------------------------------------------

router.get("/stats", async (_req, res) => {
  try {
    const [totalUsers, activeUsers, admins, progressDocs] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ role: "admin" }),
      Progress.find({}).lean(),
    ]);

    const totalXp = progressDocs.reduce((sum, p) => sum + (p.xpTotal || 0), 0);
    const allAttempts = progressDocs.flatMap((p) => p.attempts || []);
    const totalAttempts = allAttempts.length;

    const passed = allAttempts.filter((a) => a.total > 0 && a.score / a.total >= 0.75).length;
    const passRate = totalAttempts ? Math.round((passed / totalAttempts) * 100) : 0;

    const avgScore = totalAttempts
      ? Math.round((allAttempts.reduce((s, a) => s + (a.total ? a.score / a.total : 0), 0) / totalAttempts) * 100)
      : 0;

    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const newThisWeek = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    const users = await User.find({}).select("preferredLanguage targetLanguage level").lean();
    const tally = (field) =>
      users.reduce((acc, u) => {
        const key = u[field] || "Unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

    res.json({
      totalUsers, activeUsers, suspendedUsers: totalUsers - activeUsers, admins, newThisWeek,
      totalXp, totalAttempts, passRate, avgScore,
      byPreferredLanguage: tally("preferredLanguage"),
      byTargetLanguage: tally("targetLanguage"),
      byLevel: tally("level"),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load admin stats." });
  }
});

router.get("/ai-status", (_req, res) => {
  res.json({ enabled: isAiContentEnabled() });
});

router.get("/activity", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const [recentSignups, recentLogins, progressDocs] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }).limit(limit).select("name username createdAt").lean(),
      User.find({ lastLogin: { $ne: null } }).sort({ lastLogin: -1 }).limit(limit).select("name username lastLogin").lean(),
      Progress.find({}).populate("userId", "name username").lean(),
    ]);

    const recentTests = progressDocs
      .flatMap((p) => (p.attempts || []).map((a) => ({
        name: p.userId?.name || "Unknown",
        username: p.userId?.username || "unknown",
        unitId: a.unitId ?? null,
        assessmentType: a.assessmentType,
        percent: a.total ? Math.round((a.score / a.total) * 100) : 0,
        date: a.date,
      })))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    res.json({
      recentSignups: recentSignups.map((u) => ({ name: u.name, username: u.username, date: u.createdAt })),
      recentLogins: recentLogins.map((u) => ({ name: u.name, username: u.username, date: u.lastLogin })),
      recentTests,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load activity." });
  }
});

router.get("/users/export.csv", async (_req, res) => {
  try {
    const users = await User.find({}).lean();
    const progressDocs = await Progress.find({}).lean();
    const progressByUser = Object.fromEntries(progressDocs.map((p) => [String(p.userId), p]));

    const headers = ["Name", "Username", "Email", "Age", "Preferred Language", "Learning Language", "Level", "Role", "Status", "XP", "Units Completed", "Tests Taken", "Joined", "Last Login"];
    const escapeCsv = (val) => {
      const s = val === null || val === undefined ? "" : String(val);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const rows = users.map((u) => {
      const p = progressByUser[String(u._id)];
      return [
        u.name, u.username, u.email, u.age, u.preferredLanguage, u.targetLanguage,
        p?.proficiencyLevel || u.proficiencyLevel || "Beginner", u.role, u.isActive !== false ? "active" : "suspended",
        p?.xpTotal || 0, p?.completedUnits?.length || 0, p?.attempts?.length || 0,
        u.createdAt ? new Date(u.createdAt).toISOString() : "",
        u.lastLogin ? new Date(u.lastLogin).toISOString() : "",
      ].map(escapeCsv).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="learnly-users-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export users." });
  }
});

// ---------------------------------------------------------------------
// USERS (unchanged from earlier rounds)
// ---------------------------------------------------------------------

router.get("/users", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const search = (req.query.search || "").trim();

    const filter = search
      ? { $or: [{ name: { $regex: search, $options: "i" } }, { username: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    const progressDocs = await Progress.find({ userId: { $in: users.map((u) => u._id) } }).lean();
    const progressByUser = Object.fromEntries(progressDocs.map((p) => [String(p.userId), p]));

    res.json({
      users: users.map((u) => toAdminUserRow(u, progressByUser[String(u._id)])),
      total, page, pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load users." });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: "User not found." });

    const progress = await Progress.findOne({ userId: user._id }).lean();

    res.json({
      user: toAdminUserRow(user, progress),
      goals: user.goals || [],
      weakWords: progress?.weakWords || [],
      attempts: (progress?.attempts || [])
        .map((a) => ({
          unitId: a.unitId ?? null, assessmentType: a.assessmentType, score: a.score, total: a.total,
          percent: a.total ? Math.round((a.score / a.total) * 100) : 0,
          passed: a.total ? a.score / a.total >= 0.75 : false, date: a.date,
        }))
        .sort((x, y) => new Date(y.date) - new Date(x.date)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load user." });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const { role, isActive, proficiencyLevel } = req.body || {};
    const updates = {};

    if (role !== undefined) {
      if (!["learner", "admin"].includes(role)) return res.status(400).json({ error: "Role must be 'learner' or 'admin'." });
      updates.role = role;
    }
    if (isActive !== undefined) updates.isActive = !!isActive;
    if (proficiencyLevel !== undefined) {
      if (!["Beginner", "Intermediate", "Advanced"].includes(proficiencyLevel)) {
        return res.status(400).json({ error: "Level must be Beginner, Intermediate or Advanced." });
      }
      updates.proficiencyLevel = proficiencyLevel;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ error: "Nothing to update." });

    if (String(req.params.id) === String(req.userId)) {
      if (updates.role === "learner" || updates.isActive === false) {
        return res.status(400).json({ error: "You can't demote or suspend your own account." });
      }
    }
    if (updates.role === "learner") {
      const adminCount = await User.countDocuments({ role: "admin" });
      const target = await User.findById(req.params.id).select("role");
      if (target?.role === "admin" && adminCount <= 1) {
        return res.status(400).json({ error: "Can't remove the last remaining admin." });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!user) return res.status(404).json({ error: "User not found." });

    if (updates.proficiencyLevel) {
      await Progress.findOneAndUpdate({ userId: user._id }, { proficiencyLevel: updates.proficiencyLevel }, { upsert: true });
    }

    const progress = await Progress.findOne({ userId: user._id }).lean();
    res.json({ user: toAdminUserRow(user, progress) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user." });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    if (String(req.params.id) === String(req.userId)) {
      return res.status(400).json({ error: "You can't delete your own account." });
    }
    const target = await User.findById(req.params.id).select("role");
    if (!target) return res.status(404).json({ error: "User not found." });

    if (target.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) return res.status(400).json({ error: "Can't delete the last remaining admin." });
    }

    await Promise.all([User.findByIdAndDelete(req.params.id), Progress.deleteOne({ userId: req.params.id })]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user." });
  }
});

// ---------------------------------------------------------------------
// CONTENT / UNITS
// ---------------------------------------------------------------------

// GET /api/admin/content — now shows the MERGED curriculum (static + custom)
router.get("/content", async (_req, res) => {
  try {
    const { units, vocabBank } = await getMergedCurriculum();
    const languages = Object.keys(vocabBank);
    res.json({
      languages,
      unitCount: units.length,
      units,
      wordsPerLanguage: Object.fromEntries(languages.map((l) => [l, vocabBank[l].length])),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load content." });
  }
});

const VALID_SKILLS = ["reading", "writing", "listening", "speaking"];
const LANGUAGES = ["English", "Hindi", "Telugu", "Tamil", "Malayalam", "Kannada"];

// NEW — POST /api/admin/units — create a new unit
router.post("/units", async (req, res) => {
  try {
    const { title, skills, words } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Title is required." });
    }
    if (!Array.isArray(skills) || !skills.length || !skills.every((s) => VALID_SKILLS.includes(s))) {
      return res.status(400).json({ error: `Skills must be a non-empty list from: ${VALID_SKILLS.join(", ")}.` });
    }
    if (!Array.isArray(words) || !words.length) {
      return res.status(400).json({ error: "At least one word is required." });
    }

    for (const [i, w] of words.entries()) {
      if (!Array.isArray(w.options) || w.options.length !== 4 || w.options.some((o) => !o || !String(o).trim())) {
        return res.status(400).json({ error: `Word ${i + 1}: exactly 4 non-empty options are required.` });
      }
      if (!Number.isInteger(w.correct) || w.correct < 0 || w.correct > 3) {
        return res.status(400).json({ error: `Word ${i + 1}: correct must be an index 0-3.` });
      }
      for (const lang of LANGUAGES) {
        if (!w.translations?.[lang] || !String(w.translations[lang]).trim()) {
          return res.status(400).json({ error: `Word ${i + 1}: missing the ${lang} translation.` });
        }
      }
    }

    const unit = await CustomUnit.create({
      title: title.trim(),
      skills,
      words,
      createdBy: req.userId,
    });

    res.status(201).json({ unit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create unit." });
  }
});

// NEW — DELETE /api/admin/units/:id — remove an admin-created unit.
// Static units (1-6, defined in code) aren't in this collection at all,
// so this can only ever delete something an admin actually created —
// there's no way to accidentally delete the built-in curriculum this way.
router.delete("/units/:id", async (req, res) => {
  try {
    const unit = await CustomUnit.findByIdAndDelete(req.params.id);
    if (!unit) return res.status(404).json({ error: "Unit not found (it may be a built-in unit, which can't be deleted here)." });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete unit." });
  }
});

export default router;

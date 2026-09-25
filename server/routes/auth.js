// server/routes/auth.js
//
// CHANGED from your original: the /login route now records lastLogin —
// needed for the admin activity log. Everything else is exactly what you
// uploaded, untouched.

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET || "dev-secret-change-me-in-production";

// ----------------------------------------------------
// Convert MongoDB User document into safe public object
// ----------------------------------------------------
function toPublicProfile(user) {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    age: user.age,

    preferredLanguage: user.preferredLanguage,
    targetLanguage: user.targetLanguage,

    // Frontend uses "level"
    level: user.proficiencyLevel,

    // Registration assessment score
    assessmentScore: user.assessmentScore || 0,

    goals: user.goals || [],

    role: user.role || "learner",

    isActive: user.isActive !== false,

    xpTotal: user.xpTotal || 0,

    completedUnits: user.completedUnits || [],

    weakWords: user.weakWords || [],
  };
}

// ----------------------------------------------------
// Verify JWT token
// ----------------------------------------------------
function verifyToken(req) {
  const authHeader = req.headers.authorization || "";

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ====================================================
// REGISTER
// POST /api/auth/register
// ====================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      password,
      age,
      preferredLanguage,
      targetLanguage,
      level,
      assessmentScore,
      goals,
    } = req.body || {};

    // ------------------------------------------------
    // Validate required fields
    // ------------------------------------------------
    if (
      !name ||
      !username ||
      !email ||
      !password ||
      age === undefined ||
      age === null ||
      !preferredLanguage ||
      !targetLanguage
    ) {
      return res.status(400).json({
        error: "Missing required fields.",
      });
    }

    // ------------------------------------------------
    // Validate password
    // ------------------------------------------------
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters.",
      });
    }

    // ------------------------------------------------
    // Make sure preferred and target languages differ
    // ------------------------------------------------
    if (preferredLanguage === targetLanguage) {
      return res.status(400).json({
        error:
          "Learning language must differ from your comfortable language.",
      });
    }

    // ------------------------------------------------
    // Check whether username/email already exists
    // ------------------------------------------------
    const existing = await User.findOne({
      $or: [
        { username: username.trim() },
        { email: email.trim().toLowerCase() },
      ],
    });

    if (existing) {
      return res.status(409).json({
        error: "That username or email is already registered.",
      });
    }

    // ------------------------------------------------
    // Hash password
    // ------------------------------------------------
    const passwordHash = await bcrypt.hash(password, 10);

    // ------------------------------------------------
    // Create user
    //
    // IMPORTANT:
    // User.js expects "password", not "passwordHash"
    // User.js expects "proficiencyLevel", not "level"
    // ------------------------------------------------
    const user = await User.create({
      name: name.trim(),

      username: username.trim(),

      email: email.trim().toLowerCase(),

      password: passwordHash,

      age: Number(age),

      preferredLanguage,

      targetLanguage,

      proficiencyLevel: level || "Beginner",

      assessmentScore: Number(assessmentScore) || 0,

      goals: Array.isArray(goals) ? goals : [],

      // Nobody can register directly as admin
      role: "learner",

      isActive: true,

      xpTotal: 0,

      completedUnits: [],

      weakWords: [],

      attempts: [],
    });

    // ------------------------------------------------
    // Create JWT token
    // ------------------------------------------------
    const token = jwt.sign(
      {
        userId: user._id,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // ------------------------------------------------
    // Send response
    // ------------------------------------------------
    return res.status(201).json({
      user: toPublicProfile(user),
      token,
    });
  } catch (err) {
    console.error("REGISTRATION ERROR:", err);

    // Mongoose validation error
    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: Object.values(err.errors)
          .map((item) => item.message)
          .join(", "),
      });
    }

    // Duplicate username/email
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Username or email is already registered.",
      });
    }

    return res.status(500).json({
      error: "Registration failed.",
    });
  }
});

// ====================================================
// LOGIN
// POST /api/auth/login
// ====================================================

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    // ------------------------------------------------
    // Validate input
    // ------------------------------------------------
    if (!identifier || !password) {
      return res.status(400).json({
        error: "Username/email and password are required.",
      });
    }

    // ------------------------------------------------
    // Find user by username OR email
    // ------------------------------------------------
    const identifierTrimmed = identifier.trim();

    const user = await User.findOne({
      $or: [
        {
          username: identifierTrimmed,
        },
        {
          email: identifierTrimmed.toLowerCase(),
        },
      ],
    });

    // ------------------------------------------------
    // User not found
    // ------------------------------------------------
    if (!user) {
      return res.status(401).json({
        error: "Invalid username/email or password.",
      });
    }

    // ------------------------------------------------
    // Check account status
    // ------------------------------------------------
    if (user.isActive === false) {
      return res.status(403).json({
        error: "This account has been suspended.",
      });
    }

    // ------------------------------------------------
    // Compare password
    //
    // IMPORTANT:
    // User.js stores the bcrypt hash in "password"
    // ------------------------------------------------
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        error: "Invalid username/email or password.",
      });
    }

    // ------------------------------------------------
    // NEW: record this login for the admin activity log.
    // Fire-and-forget-ish but awaited so it's reliably saved; a failure
    // here shouldn't block login, so it's wrapped separately.
    // ------------------------------------------------
    try {
      user.lastLogin = new Date();
      await user.save();
    } catch (logErr) {
      console.warn("Failed to record lastLogin (non-fatal):", logErr.message);
    }

    // ------------------------------------------------
    // Create JWT token
    // ------------------------------------------------
    const token = jwt.sign(
      {
        userId: user._id,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // ------------------------------------------------
    // Successful login
    // ------------------------------------------------
    return res.json({
      user: toPublicProfile(user),
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      error: "Login failed.",
    });
  }
});

// ====================================================
// GET CURRENT USER
// GET /api/auth/me
// ====================================================

router.get("/me", async (req, res) => {
  const decoded = verifyToken(req);

  if (!decoded) {
    return res.status(401).json({
      error: "No token provided or session expired.",
    });
  }

  try {
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        error: "This account has been suspended.",
      });
    }

    return res.json({
      user: toPublicProfile(user),
    });
  } catch (err) {
    console.error("GET USER ERROR:", err);

    return res.status(401).json({
      error: "Invalid or expired session.",
    });
  }
});

// ====================================================
// UPDATE CURRENT USER
// PATCH /api/auth/me
// ====================================================

router.patch("/me", async (req, res) => {
  const decoded = verifyToken(req);

  if (!decoded) {
    return res.status(401).json({
      error: "No token provided or session expired.",
    });
  }

  try {
    const {
      preferredLanguage,
      targetLanguage,
      name,
      age,
      goals,
    } = req.body || {};

    const updates = {};

    if (preferredLanguage) {
      updates.preferredLanguage = preferredLanguage;
    }

    if (targetLanguage) {
      updates.targetLanguage = targetLanguage;
    }

    if (name) {
      updates.name = name;
    }

    if (age !== undefined && age !== null) {
      updates.age = Number(age);
    }

    if (goals) {
      updates.goals = goals;
    }

    // ------------------------------------------------
    // Prevent same preferred and target language
    // ------------------------------------------------
    if (
      updates.preferredLanguage &&
      updates.targetLanguage &&
      updates.preferredLanguage === updates.targetLanguage
    ) {
      return res.status(400).json({
        error:
          "Learning language must differ from your comfortable language.",
      });
    }

    // ------------------------------------------------
    // Update user
    // ------------------------------------------------
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    return res.json({
      user: toPublicProfile(user),
    });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);

    return res.status(500).json({
      error: "Failed to update profile.",
    });
  }
});

export default router;

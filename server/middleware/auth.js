// server/middleware/auth.js
//
// Contract this matches (confirmed against your real routes/auth.js,
// aiHelp.js, assessment.js, learningPath.js, admin.js):
//   - routes/auth.js signs tokens as jwt.sign({ userId: user._id }, ...)
//   - every protected route reads req.userId directly (a plain id),
//     NOT req.user as a full document
//   - admin.js calls `router.use(requireAdmin)` alone, with no separate
//     requireAuth first — so requireAdmin must verify the token AND check
//     the role by itself, not assume something upstream already ran.

import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Must match routes/auth.js's fallback exactly, or tokens signed under
// one fallback won't verify under the other. Better long-term: set
// JWT_SECRET in server/.env so neither fallback is actually used.
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me-in-production";

function readToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

/** Verifies the Bearer token and sets req.userId. Used by routes that just need "who is this". */
export async function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: "No token provided or session expired." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

/**
 * Self-contained admin gate — verifies the token, loads the user, and
 * checks role === "admin", all in one step (routes/admin.js relies on
 * this running with nothing else in front of it). Sets req.userId on
 * success, same as requireAuth, so admin.js's self-protection checks work.
 */
export async function requireAdmin(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: "No token provided or session expired." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(401).json({ error: "Invalid or expired session." });
    if (user.isActive === false) {
      return res.status(403).json({ error: "This account has been suspended." });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required." });
    }

    req.userId = String(user._id);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

// server/index.js
// Run with: node index.js  (Node 18+ required for global fetch)
//
// CHANGED from your original for production deployment:
//   - CORS now allowlists specific origins instead of allowing all (*)
//   - /health now reports real MongoDB connection status
// Everything else — routes, middleware order, connectDB() — is unchanged.

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";

import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import translateRoutes from "./routes/translate.js";
import curriculumRoutes from "./routes/curriculum.js";
import assessmentRoutes from "./routes/assessment.js";
import learningPathRoutes from "./routes/learningPath.js";
import aiHelpRoutes from "./routes/aiHelp.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import speechRoutes from "./routes/speech.js";
import adminRoutes from "./routes/admin.js";
import activityRoutes from "./routes/activity.js";

const app = express();

// CHANGED: allowlist instead of open CORS. Always allows localhost:5173
// (dev) plus whatever FRONTEND_URL is set to in production (your Vercel
// domain). Add FRONTEND_URL to Render's environment variables once you
// have your Vercel URL.
const allowedOrigins = ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow tools with no origin (curl, server-to-server health checks).
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/translate", translateRoutes);
app.use("/api/curriculum", curriculumRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/learning-path", learningPathRoutes);
app.use("/api/ai-help", aiHelpRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/speech", speechRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/activity", activityRoutes);

// CHANGED: now reports real MongoDB status instead of just {ok: true}.
// readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting.
app.get("/health", (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "ok" : "degraded",
    database: dbConnected ? "connected" : "disconnected",
  });
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

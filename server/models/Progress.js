// server/models/Progress.js
//
// Durable, per-learner tracking of quiz attempts, XP, completed units and
// weak words — the data source for proficiency benchmarking (see
// services/proficiency.js) and adaptive recommendations (see
// routes/learningPath.js). One document per User, linked by userId.

import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    unitId: Number,
    assessmentType: {
      type: String,
      enum: ["vocabulary", "reading", "writing", "listening", "speaking"],
      default: "vocabulary",
    },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    xpTotal: { type: Number, default: 0 },
    completedUnits: { type: [Number], default: [] },
    weakWords: { type: [String], default: [] },
    attempts: { type: [attemptSchema], default: [] },
    proficiencyLevel: { type: String, default: "Beginner" },
  },
  { timestamps: true }
);

export default mongoose.model("Progress", progressSchema);

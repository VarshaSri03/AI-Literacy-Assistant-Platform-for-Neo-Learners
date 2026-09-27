// server/models/Activity.js
//
// One document per learner per calendar day. Everything else (streak,
// calendar heatmap, weekly report, "today's progress") is COMPUTED from
// this collection at request time — nothing else is stored redundantly,
// so there's no risk of streak/XP getting out of sync with reality.
//
// date is stored as "YYYY-MM-DD" (not a Date) deliberately — comparing
// calendar days should be about the day itself, not a timestamp, which
// avoids timezone-boundary bugs when checking "is this the same day as
// last time."

import mongoose from "mongoose";

const DailyActivitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    activities: {
      vocabulary: { type: Boolean, default: false },
      lesson: { type: Boolean, default: false },
      speaking: { type: Boolean, default: false },
      listening: { type: Boolean, default: false },
      quiz: { type: Boolean, default: false },
      aiHelp: { type: Boolean, default: false },
    },
    minutes: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One doc per user per day — upserts target this directly.
DailyActivitySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.DailyActivity || mongoose.model("DailyActivity", DailyActivitySchema);

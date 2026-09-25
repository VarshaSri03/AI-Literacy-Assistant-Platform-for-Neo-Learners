// server/models/User.js
//
// CHANGED from your original: added lastLogin (Date, null until first
// login) — needed for the admin activity log. Nothing else touched.

import mongoose from "mongoose";

// One record for each quiz/test attempt
const AttemptSchema = new mongoose.Schema(
  {
    unitId: {
      type: Number,
      default: null,
    },

    assessmentType: {
      type: String,
      required: true,
    },

    score: {
      type: Number,
      required: true,
    },

    total: {
      type: Number,
      required: true,
    },

    percent: {
      type: Number,
      required: true,
    },

    passed: {
      type: Boolean,
      required: true,
    },

    proficiencyLevel: {
      type: String,
    },

    xpTotal: {
      type: Number,
    },

    weakWords: [
      {
        type: String,
      },
    ],

    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const UserSchema = new mongoose.Schema(
  {
    // Basic account information
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Stores the bcrypt password hash
    password: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
    },

    // Language the learner wants to learn
    targetLanguage: {
      type: String,
      required: true,
    },

    // Language used to explain the learning content/UI
    preferredLanguage: {
      type: String,
      required: true,
    },

    // Beginner | Intermediate | Advanced
    proficiencyLevel: {
      type: String,
      default: "Beginner",
    },

    // Score obtained during registration assessment
    assessmentScore: {
      type: Number,
      default: 0,
    },

    // Learning goals
    goals: [
      {
        type: String,
      },
    ],

    // Account role
    role: {
      type: String,
      enum: ["learner", "admin"],
      default: "learner",
    },

    // Admin can suspend/activate account
    isActive: {
      type: Boolean,
      default: true,
    },

    // NEW: set on every successful login — powers the admin activity log
    lastLogin: {
      type: Date,
      default: null,
    },

    // Learning progress
    xpTotal: {
      type: Number,
      default: 0,
    },

    completedUnits: [
      {
        type: Number,
      },
    ],

    weakWords: [
      {
        type: String,
      },
    ],

    // Assessment history
    attempts: [AttemptSchema],
  },
  {
    timestamps: true,
  }
);

// Prevent "Cannot overwrite User model" errors
export default mongoose.models.User ||
  mongoose.model("User", UserSchema);

// server/models/CustomUnit.js
//
// Units created by admins through the dashboard UI. Kept completely
// separate from server/data/curriculum.js (units 1-6, unchanged) — this
// collection is merged with the static units at request time (see
// data/mergedCurriculum.js), never mutating the static file.
//
// Design note: every existing word in curriculum.js shares the SAME
// options/correct across all 6 languages — only the prompt (the word's
// own script) differs per language. So instead of duplicating options
// per language, each word here stores options/correct ONCE plus a
// translations map — much simpler for an admin form to fill in.

import mongoose from "mongoose";

const WordSchema = new mongoose.Schema(
  {
    options: { type: [String], required: true, validate: (v) => v.length === 4 },
    correct: { type: Number, required: true, min: 0, max: 3 },
    translations: {
      English: { type: String, required: true },
      Hindi: { type: String, required: true },
      Telugu: { type: String, required: true },
      Tamil: { type: String, required: true },
      Malayalam: { type: String, required: true },
      Kannada: { type: String, required: true },
    },
  },
  { _id: false }
);

const CustomUnitSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    skills: { type: [String], default: [] }, // subset of: reading, writing, listening, speaking
    words: { type: [WordSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.CustomUnit || mongoose.model("CustomUnit", CustomUnitSchema);

// server/routes/curriculum.js
//
// CHANGED from your original: now serves the MERGED curriculum (static
// units 1-6 + any admin-created units) via data/mergedCurriculum.js,
// instead of only the static file. Route shapes are unchanged.

import express from "express";
import { getMergedCurriculum } from "../data/mergedCurriculum.js";

const router = express.Router();

// Get complete curriculum
router.get("/", async (req, res) => {
  try {
    const { units, unitWordIndexes, vocabBank } = await getMergedCurriculum();
    res.json({ units, unitWordIndexes, vocabBank });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load curriculum" });
  }
});

// Get a specific unit
router.get("/unit/:id", async (req, res) => {
  try {
    const unitId = Number(req.params.id);
    const { units, unitWordIndexes } = await getMergedCurriculum();

    const unit = units.find((item) => item.id === unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const wordIndexes = unitWordIndexes[unitId] || [];
    res.json({ unit, wordIndexes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load unit" });
  }
});

export default router;

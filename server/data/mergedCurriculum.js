// server/data/mergedCurriculum.js
//
// Combines the static curriculum (server/data/curriculum.js, units 1-6 —
// untouched) with admin-created units (models/CustomUnit.js) into the
// same shape routes already expect: { units, unitWordIndexes, vocabBank }.
//
// Custom units get ids continuing after the highest static id (so if
// static units are 1-6, the first custom unit is 7, etc.) and their words
// are appended to each language's word list in VOCAB_BANK, with indexes
// computed fresh each call — no static file is ever mutated.
//
// curriculum.js, assessment.js, and learningPath.js all call this instead
// of importing CURRICULUM_UNITS/UNIT_WORD_INDEXES/VOCAB_BANK directly, so
// admin-added content shows up everywhere those routes already work.

import {
  CURRICULUM_UNITS as STATIC_UNITS,
  UNIT_WORD_INDEXES as STATIC_INDEXES,
  VOCAB_BANK as STATIC_BANK,
} from "./curriculum.js";
import CustomUnit from "../models/CustomUnit.js";

const LANGUAGES = Object.keys(STATIC_BANK);

export async function getMergedCurriculum() {
  const customUnits = await CustomUnit.find({}).sort({ createdAt: 1 }).lean();

  const maxStaticId = Math.max(...STATIC_UNITS.map((u) => u.id));
  const vocabBank = Object.fromEntries(LANGUAGES.map((l) => [l, [...STATIC_BANK[l]]]));
  const unitWordIndexes = { ...STATIC_INDEXES };
  const units = [...STATIC_UNITS];

  customUnits.forEach((cu, i) => {
    const unitId = maxStaticId + 1 + i;
    const startIndex = vocabBank[LANGUAGES[0]].length;
    const indexes = [];

    cu.words.forEach((word, wi) => {
      indexes.push(startIndex + wi);
      LANGUAGES.forEach((lang) => {
        vocabBank[lang].push({
          prompt: word.translations[lang] || word.translations.English,
          options: word.options,
          correct: word.correct,
        });
      });
    });

    units.push({
      id: unitId,
      title: cu.title, // custom units use a plain title, not an i18n titleKey
      skills: cu.skills,
      custom: true,
      customId: String(cu._id), // needed by the admin UI to call DELETE /api/admin/units/:id
    });
    unitWordIndexes[unitId] = indexes;
  });

  return { units, unitWordIndexes, vocabBank };
}

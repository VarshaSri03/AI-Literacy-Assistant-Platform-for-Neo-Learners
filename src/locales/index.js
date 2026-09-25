// src/locales/index.js
//
// Central i18n registry. This replaces the old live-translation approach
// (Azure/MyMemory via /api/translate) for UI text with STATIC, bundled
// dictionaries — so the interface language switches instantly, works
// offline, needs no API key, and can never silently fall back to English
// because of a network or billing problem.
//
// NOTE: this covers UI TEXT ONLY. Learning content (the vocabulary the
// learner is studying) is separate and still comes from the curriculum —
// see the LANGUAGE_CODES / VOCAB data in personalization.js. Changing the
// UI language must never change the learning words themselves.

import en from "./en.js";
import hi from "./hi.js";
import te from "./te.js";
import ta from "./ta.js";
import ml from "./ml.js";
import kn from "./kn.js";

export const LOCALES = { en, hi, te, ta, ml, kn };

// Maps the display names used throughout the app (and stored in MongoDB)
// to locale codes.
export const LANGUAGE_TO_CODE = {
  English: "en",
  Hindi: "hi",
  Telugu: "te",
  Tamil: "ta",
  Malayalam: "ml",
  Kannada: "kn",
};

export const CODE_TO_LANGUAGE = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  ta: "Tamil",
  ml: "Malayalam",
  kn: "Kannada",
};

// Native names, for language pickers where the learner should recognise
// their own language in its own script.
export const NATIVE_NAMES = {
  English: "English",
  Hindi: "हिन्दी",
  Telugu: "తెలుగు",
  Tamil: "தமிழ்",
  Malayalam: "മലയാളം",
  Kannada: "ಕನ್ನಡ",
};

/**
 * Returns the full string table for a language, with English as a
 * per-key fallback so a missing/incomplete translation shows readable
 * English rather than `undefined`.
 *
 * Accepts either a display name ("Telugu") or a code ("te").
 */
export function getStrings(language) {
  const code = LANGUAGE_TO_CODE[language] || (LOCALES[language] ? language : "en");
  const table = LOCALES[code] || en;
  return { ...en, ...table };
}

/**
 * Convenience translator. Usage:
 *   const t = makeT("Telugu");
 *   t("navPath")  ->  "నేర్చుకునే మార్గం"
 * Unknown keys return the key itself, so a typo is visible in the UI
 * rather than rendering as blank space.
 */
export function makeT(language) {
  const strings = getStrings(language);
  return (key) => (key in strings ? strings[key] : key);
}

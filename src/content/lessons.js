// src/content/lessons.js
//
// LEARNING PATH STRUCTURE — basic → advanced.
// Nine lessons across three levels. Each lesson teaches a small set of
// words (a "teach" phase where the learner sees/hears each word with its
// meaning), then tests them on exactly those words.
//
// Word indexes refer to src/content/vocabulary.js, so lessons work in any
// learning language without duplication.

export const LESSONS = [
  // ---- Beginner ----
  { id: 1, level: "Beginner",     titleKey: "lesson1Title",  wordIndexes: [0, 1, 2],    icon: "📘" },
  { id: 2, level: "Beginner",     titleKey: "lesson2Title",  wordIndexes: [3, 4, 5],    icon: "🏠" },
  { id: 3, level: "Beginner",     titleKey: "lesson3Title",  wordIndexes: [6, 7, 8, 9], icon: "🌤️" },
  // ---- Intermediate ----
  { id: 4, level: "Intermediate", titleKey: "lesson4Title",  wordIndexes: [10, 11, 12], icon: "🛒" },
  { id: 5, level: "Intermediate", titleKey: "lesson5Title",  wordIndexes: [13, 14, 15], icon: "🧭" },
  { id: 6, level: "Intermediate", titleKey: "lesson6Title",  wordIndexes: [16, 17, 18, 19], icon: "💬" },
  // ---- Advanced ----
  { id: 7, level: "Advanced",     titleKey: "lesson7Title",  wordIndexes: [20, 21, 22], icon: "🎓" },
  { id: 8, level: "Advanced",     titleKey: "lesson8Title",  wordIndexes: [23, 24, 25], icon: "🌍" },
  { id: 9, level: "Advanced",     titleKey: "lesson9Title",  wordIndexes: [26, 27, 28, 29], icon: "🏆" },
];

/** Lessons at or above the learner's level start unlocked-eligible; earlier ones are review. */
export function lessonsForLevel(level) {
  return LESSONS.filter((l) => l.level === level);
}

/** The lesson a learner should begin at, based on their assessed level. */
export function startingLessonId(level) {
  const first = LESSONS.find((l) => l.level === level);
  return first ? first.id : 1;
}

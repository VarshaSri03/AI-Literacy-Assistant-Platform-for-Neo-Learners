// src/content/achievements.js
//
// ACHIEVEMENTS + SKILL BREAKDOWN for the Profile tab.
// All evaluated client-side from stats the app already tracks, so no new
// backend storage is required.

export const ACHIEVEMENTS = [
  { id: "firstLesson",  icon: "🌱", titleKey: "achFirstLesson",  descKey: "achFirstLessonDesc",  test: (s) => s.lessonsCompleted >= 1 },
  { id: "streak3",      icon: "🔥", titleKey: "achStreak3",      descKey: "achStreak3Desc",      test: (s) => s.streak >= 3 },
  { id: "streak7",      icon: "⚡", titleKey: "achStreak7",      descKey: "achStreak7Desc",      test: (s) => s.streak >= 7 },
  { id: "xp100",        icon: "⭐", titleKey: "achXp100",        descKey: "achXp100Desc",        test: (s) => s.xpTotal >= 100 },
  { id: "xp500",        icon: "💫", titleKey: "achXp500",        descKey: "achXp500Desc",        test: (s) => s.xpTotal >= 500 },
  { id: "perfectTest",  icon: "🎯", titleKey: "achPerfectTest",  descKey: "achPerfectTestDesc",  test: (s) => s.hasPerfectScore },
  { id: "voicePro",     icon: "🎙️", titleKey: "achVoicePro",     descKey: "achVoiceProDesc",     test: (s) => s.bestVoiceScore >= 85 },
  { id: "certified",    icon: "🏅", titleKey: "achCertified",    descKey: "achCertifiedDesc",    test: (s) => s.isCertified },
  { id: "allUnits",     icon: "👑", titleKey: "achAllUnits",     descKey: "achAllUnitsDesc",     test: (s) => s.lessonsCompleted >= 9 },
];

/** Returns each achievement with an `unlocked` flag, given the learner's stats. */
export function evaluateAchievements(stats) {
  const safe = {
    lessonsCompleted: 0,
    streak: 0,
    xpTotal: 0,
    hasPerfectScore: false,
    bestVoiceScore: 0,
    isCertified: false,
    ...stats,
  };
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: !!a.test(safe) }));
}

/**
 * Per-skill proficiency (0–100), derived from the learner's assessment
 * history by assessmentType. Used for the "improve skills" / "best at"
 * breakdown in the Profile tab.
 */
export const SKILLS = [
  { id: "vocabulary", icon: "🔤", labelKey: "goalVocabulary" },
  { id: "reading",    icon: "📖", labelKey: "goalReading" },
  { id: "listening",  icon: "👂", labelKey: "goalListening" },
  { id: "speaking",   icon: "🗣️", labelKey: "goalSpeaking" },
  { id: "writing",    icon: "✍️", labelKey: "goalWriting" },
];

export function computeSkillScores(history = [], bestVoiceScore = 0) {
  const byType = {};
  for (const entry of history) {
    const t = entry.assessmentType || "vocabulary";
    if (!byType[t]) byType[t] = { score: 0, total: 0 };
    byType[t].score += entry.score;
    byType[t].total += entry.total;
  }

  return SKILLS.map((skill) => {
    if (skill.id === "speaking") {
      return { ...skill, percent: Math.round(bestVoiceScore), attempted: bestVoiceScore > 0 };
    }
    const agg = byType[skill.id];
    const percent = agg && agg.total ? Math.round((agg.score / agg.total) * 100) : 0;
    return { ...skill, percent, attempted: !!agg };
  });
}

/** The strongest and weakest attempted skills, for "best at" / "improve". */
export function skillHighlights(skillScores) {
  const attempted = skillScores.filter((s) => s.attempted);
  if (!attempted.length) return { best: null, weakest: null };

  const sorted = [...attempted].sort((a, b) => b.percent - a.percent);
  return {
    best: sorted[0],
    weakest: sorted.length > 1 ? sorted[sorted.length - 1] : null,
  };
}

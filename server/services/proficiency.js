// server/services/proficiency.js
//
// LEARNER PROFICIENCY BENCHMARKS + PREDICTION
// -----------------------------------------------------------------
// IMPORTANT — honesty about what this is: predictNextProficiency() is a
// documented heuristic (a recency-weighted moving average over past quiz
// accuracy), NOT a trained machine-learning model. There's no labeled
// dataset or training pipeline in this project. It's a transparent,
// swappable stand-in — reasonable for a small app, and easy to replace
// with a real trained model later once you have enough attempt data
// logged in the Progress collection to train on.

export const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

function levelFromAccuracy(accuracy) {
  if (accuracy >= 0.75) return "Advanced";
  if (accuracy >= 0.4) return "Intermediate";
  return "Beginner";
}

/** Benchmark: proficiency level based on the learner's 5 most recent attempts. */
export function computeBenchmarkLevel(attempts = []) {
  if (!attempts.length) return "Beginner";
  const recent = attempts.slice(-5);
  const totalCorrect = recent.reduce((sum, a) => sum + a.score, 0);
  const totalQuestions = recent.reduce((sum, a) => sum + a.total, 0);
  return levelFromAccuracy(totalQuestions ? totalCorrect / totalQuestions : 0);
}

/**
 * Recency-weighted accuracy trend across ALL attempts — later attempts
 * count more than earlier ones, so a learner who's been improving gets
 * credit for the trend even if their all-time average is still low.
 */
export function predictNextProficiency(attempts = []) {
  if (attempts.length < 2) return computeBenchmarkLevel(attempts);

  const weights = attempts.map((_, i) => i + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const weightedAccuracy =
    attempts.reduce((sum, a, i) => {
      const acc = a.total ? a.score / a.total : 0;
      return sum + acc * weights[i];
    }, 0) / weightSum;

  return levelFromAccuracy(weightedAccuracy);
}

// learningApi.js
// Frontend client for server/routes/curriculum.js, assessment.js and
// learningPath.js. Uses the same saved JWT as api.js (getToken()) — no
// separate auth system.
//
// CHANGED from your original: askAiHelp now accepts an optional `history`
// array for follow-up questions in the AI Help chat. Everything else is
// exactly what you had.

import { getToken } from "./api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** The multilingual content repository for a given target language. */
export async function fetchCurriculum(targetLanguage) {
  const res = await fetch(`${API_URL}/api/curriculum/${encodeURIComponent(targetLanguage)}`);
  if (!res.ok) throw new Error("Failed to load curriculum");
  return res.json();
}

/** Questions for one unit (unitId) or the full certification bank (omit unitId). */
export async function fetchAssessment(targetLanguage, unitId) {
  const url = new URL(`${API_URL}/api/assessment/${encodeURIComponent(targetLanguage)}`);
  if (unitId) url.searchParams.set("unit", unitId);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load assessment");
  return res.json();
}

/** Records a quiz attempt server-side — updates XP, completed units, proficiency. */
export async function submitAssessment({ unitId, assessmentType, score, total, weakWords }) {
  const res = await fetch(`${API_URL}/api/assessment/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ unitId, assessmentType, score, total, weakWords }),
  });
  if (!res.ok) throw new Error("Failed to submit assessment");
  return res.json();
}

/** The adaptive recommendation: next unit, predicted level, weak words, AI micro-lesson. */
export async function fetchLearningPath() {
  const res = await fetch(`${API_URL}/api/learning-path`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load learning path");
  return res.json();
}

/** Full history of past quiz attempts, for the results review screen. */
export async function fetchAssessmentHistory() {
  const res = await fetch(`${API_URL}/api/assessment/history/all`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load assessment history");
  return res.json();
}

/**
 * Asks the AI helper a free-text question, answered in the learner's
 * preferred language. Pass `history` (an array of { role: "user"|"assistant",
 * text }) for follow-up questions so the AI has conversation context.
 */
export async function askAiHelp(question, history = []) {
  const res = await fetch(`${API_URL}/api/ai-help`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ question, history }),
  });
  if (!res.ok) throw new Error("Failed to get an answer");
  return res.json();
}

/** Updates the signed-in learner's own profile (used by the top-bar language switcher). */
export async function updateProfile(patch) {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(patch),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to update profile");
  return data;
}

/** Top learners by total XP — public, no auth required. */
export async function fetchLeaderboard() {
  const res = await fetch(`${API_URL}/api/leaderboard`);
  if (!res.ok) throw new Error("Failed to load leaderboard");
  return res.json();
}

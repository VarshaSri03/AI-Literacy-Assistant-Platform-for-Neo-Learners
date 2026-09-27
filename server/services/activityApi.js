// src/activityApi.js
// Client for server/routes/activity.js. Uses the same saved JWT as api.js.

import { getToken } from "./api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function activityRequest(path, options = {}) {
  const res = await fetch(`${API_URL}/api/activity${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/** Marks a daily activity type done (vocabulary/lesson/speaking/listening/quiz/aiHelp). */
export function recordActivity(type, minutes = 0) {
  return activityRequest("/record", { method: "POST", body: JSON.stringify({ type, minutes }) });
}

/** Today's checklist, goal progress, and simple recommendations. */
export function fetchTodayActivity() {
  return activityRequest("/today");
}

/** Sets the learner's daily goal (10/15/20/30 minutes). */
export function setDailyGoal(dailyGoalMinutes) {
  return activityRequest("/goal", { method: "PATCH", body: JSON.stringify({ dailyGoalMinutes }) });
}

/** Current streak, longest streak, total active days. */
export function fetchStreak() {
  return activityRequest("/streak");
}

/** Monthly calendar heatmap. month: "YYYY-MM", omit for current month. */
export function fetchCalendar(month) {
  return activityRequest(`/calendar${month ? `?month=${month}` : ""}`);
}

/** Last 7 days summary. */
export function fetchWeeklyReport() {
  return activityRequest("/weekly");
}

/** Achievement badges, computed from real progress/activity data. */
export function fetchAchievements() {
  return activityRequest("/achievements");
}

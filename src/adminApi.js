// src/adminApi.js
// Client for server/routes/admin.js. Uses the same saved JWT as api.js —
// the backend re-checks the admin role on every request.
//
// CHANGED from your original: added fetchAdminActivity, fetchAiStatus, and
// downloadUsersCsv. Everything else is exactly what you had.

import { getToken } from "./api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function adminRequest(path, options = {}) {
  const res = await fetch(`${API_URL}/api/admin${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/** Headline platform numbers for the admin overview. */
export function fetchAdminStats() {
  return adminRequest("/stats");
}

/** Paginated, searchable learner list. */
export function fetchAdminUsers({ search = "", page = 1, limit = 25 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return adminRequest(`/users?${params.toString()}`);
}

/** One learner with their full attempt history. */
export function fetchAdminUser(id) {
  return adminRequest(`/users/${id}`);
}

/** Change a learner's role, level, or suspend/reactivate their account. */
export function updateAdminUser(id, patch) {
  return adminRequest(`/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

/** Permanently remove a learner and their progress. */
export function deleteAdminUser(id) {
  return adminRequest(`/users/${id}`, { method: "DELETE" });
}

/** Read-only view of the curriculum currently in use. */
export function fetchAdminContent() {
  return adminRequest("/content");
}

/** NEW — whether the Claude/Anthropic API key is configured server-side. */
export function fetchAiStatus() {
  return adminRequest("/ai-status");
}

/** NEW — recent signups, logins, and test attempts across all learners. */
export function fetchAdminActivity(limit = 10) {
  return adminRequest(`/activity?limit=${limit}`);
}

/** NEW — create a new curriculum unit. */
export function createUnit({ title, skills, words }) {
  return adminRequest("/units", { method: "POST", body: JSON.stringify({ title, skills, words }) });
}

/** NEW — delete an admin-created unit (built-in units can't be deleted this way). */
export function deleteUnit(customId) {
  return adminRequest(`/units/${customId}`, { method: "DELETE" });
}

/**
 * NEW — downloads a CSV of all users. Can't use a plain <a href> for this
 * one, since the export route needs the admin's Bearer token — so this
 * fetches it with auth, then triggers the browser download manually via a
 * blob URL.
 */
export async function downloadUsersCsv() {
  const res = await fetch(`${API_URL}/api/admin/users/export.csv`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Export failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `learnly-users-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

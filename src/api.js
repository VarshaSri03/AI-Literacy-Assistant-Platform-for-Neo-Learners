// api.js
// Frontend client for the backend's auth endpoints (server/routes/auth.js).
// Handles registration, login, and restoring a session from a saved token.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";
const TOKEN_KEY = "learnly_token";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Creates a new account in the database. Returns { user, token }. */
export function registerUser(profile) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

/** Logs in with a username/email + password. Returns { user, token }. */
export function loginUser(identifier, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

/** Restores a session from a saved token (e.g. on page reload). Returns { user }. */
export function fetchCurrentUser(token) {
  return request("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

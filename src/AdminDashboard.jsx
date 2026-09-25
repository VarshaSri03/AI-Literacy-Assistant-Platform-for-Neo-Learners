// src/AdminDashboard.jsx
//
// Admin area. Uses the SAME app-shell / app-sidebar / app-topbar /
// app-content classes from App.css as the learner Dashboard.jsx.
//
// CHANGED from the previous version:
//   - OverviewTab: added an AI status card (is Claude configured?)
//   - NEW ActivityTab: recent signups, logins, test attempts
//   - UsersTab: added a CSV export button, and checkbox-based bulk
//     suspend/reactivate/delete (loops the existing single-item
//     endpoints client-side — no new bulk API needed)

import { useEffect, useState } from "react";
import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminUser,
  updateAdminUser,
  deleteAdminUser,
  fetchAdminContent,
  fetchAiStatus,
  fetchAdminActivity,
  downloadUsersCsv,
  createUnit,
  deleteUnit,
} from "./adminApi";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

function StatCard({ icon, value, label, tone }) {
  return (
    <div className={`admin-stat ${tone || ""}`}>
      <span className="admin-stat-icon">{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

function Distribution({ title, data }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? Math.max(...entries.map((e) => e[1])) : 0;
  if (!entries.length) return null;

  return (
    <div className="admin-dist">
      {title && <h3>{title}</h3>}
      {entries.map(([label, count]) => (
        <div className="admin-dist-row" key={label}>
          <span className="admin-dist-label">{label}</span>
          <div className="admin-dist-track">
            <div className="admin-dist-fill" style={{ width: max ? `${(count / max) * 100}%` : "0%" }} />
          </div>
          <span className="admin-dist-count">{count}</span>
        </div>
      ))}
    </div>
  );
}

function LanguageBarChart({ title, data }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return <p className="plan-note">No data yet.</p>;

  const max = Math.max(...entries.map(([, v]) => v));
  const barHeight = 34;
  const gap = 14;
  const chartHeight = entries.length * (barHeight + gap);
  const labelWidth = 110;
  const chartWidth = 520;
  const plotWidth = chartWidth - labelWidth - 50;

  return (
    <div className="admin-chart">
      {title && <h3>{title}</h3>}
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" style={{ maxWidth: chartWidth }} role="img" aria-label={title || "Language distribution chart"}>
        {entries.map(([lang, count], i) => {
          const barW = max ? (count / max) * plotWidth : 0;
          const y = i * (barHeight + gap);
          return (
            <g key={lang}>
              <text x={labelWidth - 10} y={y + barHeight / 2 + 5} textAnchor="end" fontSize="13" fontWeight="700" fill="var(--ink-soft)">{lang}</text>
              <rect x={labelWidth} y={y} width={plotWidth} height={barHeight} rx="8" fill="var(--surface-sunk)" />
              <rect x={labelWidth} y={y} width={barW} height={barHeight} rx="8" fill={i === 0 ? "var(--primary)" : "var(--primary-light)"} />
              <text x={labelWidth + barW + 10} y={y + barHeight / 2 + 5} fontSize="13" fontWeight="800" fill="var(--ink)">{count}</text>
            </g>
          );
        })}
      </svg>
      {entries[0] && (
        <p className="plan-note" style={{ marginTop: "0.6rem" }}>
          Most chosen: <strong>{entries[0][0]}</strong> ({entries[0][1]} learner{entries[0][1] === 1 ? "" : "s"})
        </p>
      )}
    </div>
  );
}

/** NEW: small status card — is the Claude API key configured server-side? */
function AiStatusCard() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchAiStatus().then(setStatus).catch(() => setStatus({ enabled: false }));
  }, []);

  if (!status) return null;

  return (
    <div className={`admin-stat ${status.enabled ? "good" : "warn"}`} style={{ textAlign: "left" }}>
      <span className="admin-stat-icon">{status.enabled ? "🤖" : "⚠️"}</span>
      <strong style={{ fontSize: "0.95rem" }}>{status.enabled ? "AI features active" : "AI features off"}</strong>
      <small>{status.enabled ? "ANTHROPIC_API_KEY is configured" : "ANTHROPIC_API_KEY missing in server/.env"}</small>
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-message">⚠️ {error}</div>;
  if (!stats) return <p className="plan-note">Loading…</p>;

  return (
    <>
      <div className="admin-stat-grid">
        <StatCard icon="👥" value={stats.totalUsers} label="Total learners" />
        <StatCard icon="✅" value={stats.activeUsers} label="Active" tone="good" />
        <StatCard icon="🚫" value={stats.suspendedUsers} label="Suspended" tone={stats.suspendedUsers ? "warn" : ""} />
        <StatCard icon="🆕" value={stats.newThisWeek} label="New this week" />
        <StatCard icon="🛡️" value={stats.admins} label="Admins" />
        <StatCard icon="⭐" value={stats.totalXp.toLocaleString()} label="Total XP earned" />
        <StatCard icon="📝" value={stats.totalAttempts} label="Tests taken" />
        <StatCard icon="🎯" value={`${stats.passRate}%`} label="Pass rate (75%+)" tone={stats.passRate >= 50 ? "good" : ""} />
        <StatCard icon="📊" value={`${stats.avgScore}%`} label="Average score" />
        <AiStatusCard />
      </div>

      <h4 className="admin-subhead">Most chosen learning language</h4>
      <LanguageBarChart data={stats.byTargetLanguage} />

      <h4 className="admin-subhead">Other breakdowns</h4>
      <div className="admin-dist-grid">
        <Distribution title="Explanation language" data={stats.byPreferredLanguage} />
        <Distribution title="Level" data={stats.byLevel} />
      </div>
    </>
  );
}

/** NEW: recent signups, logins, and test attempts. */
function ActivityTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminActivity(10).then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-message">⚠️ {error}</div>;
  if (!data) return <p className="plan-note">Loading…</p>;

  const timeAgo = (d) => new Date(d).toLocaleString();

  return (
    <>
      <h4 className="admin-subhead">Recent signups</h4>
      {data.recentSignups.length ? (
        <div className="review-list">
          {data.recentSignups.map((s, i) => (
            <div className="review-row" key={i}>
              <div className="review-row-main">
                <strong>{s.name} <span className="admin-muted">@{s.username}</span></strong>
                <span className="review-date">{timeAgo(s.date)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="plan-note">No signups yet.</p>}

      <h4 className="admin-subhead">Recent logins</h4>
      {data.recentLogins.length ? (
        <div className="review-list">
          {data.recentLogins.map((s, i) => (
            <div className="review-row" key={i}>
              <div className="review-row-main">
                <strong>{s.name} <span className="admin-muted">@{s.username}</span></strong>
                <span className="review-date">{timeAgo(s.date)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="plan-note">No logins recorded yet — this only tracks logins from now on.</p>}

      <h4 className="admin-subhead">Recent tests taken</h4>
      {data.recentTests.length ? (
        <div className="review-list">
          {data.recentTests.map((t, i) => (
            <div className="review-row" key={i}>
              <div className="review-row-main">
                <strong>{t.name} <span className="admin-muted">@{t.username}</span> — {t.unitId ? `Unit ${t.unitId}` : "Certification"}</strong>
                <span className="review-date">{timeAgo(t.date)}</span>
              </div>
              <div className="review-row-score">
                <span>{t.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="plan-note">No tests taken yet.</p>}
    </>
  );
}

function UserDetail({ userId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [savingLevel, setSavingLevel] = useState(false);

  const load = () => {
    fetchAdminUser(userId).then(setData).catch((e) => setError(e.message));
  };

  useEffect(load, [userId]);

  const changeLevel = async (e) => {
    const proficiencyLevel = e.target.value;
    setSavingLevel(true);
    setError("");
    try {
      await updateAdminUser(userId, { proficiencyLevel });
      load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingLevel(false);
    }
  };

  if (error) return <div className="error-message">⚠️ {error}</div>;
  if (!data) return <p className="plan-note">Loading…</p>;

  const u = data.user;

  return (
    <div>
      <div className="admin-detail-head">
        <h3>{u.name} <span className="admin-muted">@{u.username}</span></h3>
        <button className="back-button" onClick={onClose}>← Back to list</button>
      </div>

      <div className="profile-grid">
        <div><small>Email</small><strong>{u.email}</strong></div>
        <div><small>Age</small><strong>{u.age}</strong></div>
        <div><small>Learning</small><strong>{u.targetLanguage}</strong></div>
        <div><small>Explained via</small><strong>{u.preferredLanguage}</strong></div>
        <div>
          <small>Level</small>
          <select value={u.proficiencyLevel} onChange={changeLevel} disabled={savingLevel} style={{ fontWeight: 700 }}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div><small>Total XP</small><strong>{u.xpTotal}</strong></div>
        <div><small>Units done</small><strong>{u.completedUnits}</strong></div>
        <div><small>Joined</small><strong>{new Date(u.joinedAt).toLocaleDateString()}</strong></div>
      </div>

      {data.goals?.length > 0 && (
        <>
          <h4 className="admin-subhead">Goals</h4>
          <div className="focus-tags">{data.goals.map((g) => <span className="tag" key={g}>{g}</span>)}</div>
        </>
      )}

      {data.weakWords?.length > 0 && (
        <>
          <h4 className="admin-subhead">Words to review</h4>
          <div className="focus-tags">{data.weakWords.map((w) => <span className="tag" key={w}>{w}</span>)}</div>
        </>
      )}

      <h4 className="admin-subhead">Test history ({data.attempts.length})</h4>
      {data.attempts.length ? (
        <div className="review-list">
          {data.attempts.map((a, i) => (
            <div className="review-row" key={i}>
              <div className="review-row-main">
                <strong>{a.unitId ? `Unit ${a.unitId}` : "Certification"} · {a.assessmentType}</strong>
                <span className="review-date">{new Date(a.date).toLocaleString()}</span>
              </div>
              <div className="review-row-score">
                <span>{a.score}/{a.total} ({a.percent}%)</span>
                <span className={`review-badge ${a.passed ? "pass" : "fail"}`}>{a.passed ? "Pass" : "Not yet"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="plan-note">No tests taken yet.</p>}
    </div>
  );
}

function UsersTab({ currentUserId }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [checked, setChecked] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    fetchAdminUsers({ search: query, page })
      .then((d) => {
        setRows(d.users);
        setTotal(d.total);
        setPages(d.pages);
        setChecked(new Set());
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [query, page]);

  const applySearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  const patch = async (id, body) => {
    setBusyId(id);
    setError("");
    try {
      const { user } = await updateAdminUser(id, body);
      setRows((rs) => rs.map((r) => (r.id === id ? user : r)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Permanently delete ${name} and all their progress? This can't be undone.`)) return;
    setBusyId(id);
    setError("");
    try {
      await deleteAdminUser(id);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleCheck = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const selectable = rows.filter((u) => String(u.id) !== String(currentUserId));
    setChecked((prev) => (prev.size === selectable.length ? new Set() : new Set(selectable.map((u) => u.id))));
  };

  const selectedIds = [...checked].filter((id) => String(id) !== String(currentUserId));

  const bulkSuspend = async (isActive) => {
    setBulkBusy(true);
    setError("");
    try {
      for (const id of selectedIds) {
        await updateAdminUser(id, { isActive });
      }
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.length} learner(s) and all their progress? This can't be undone.`)) return;
    setBulkBusy(true);
    setError("");
    try {
      for (const id of selectedIds) {
        await deleteAdminUser(id);
      }
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBulkBusy(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    setError("");
    try {
      await downloadUsersCsv();
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  };

  if (selectedId) {
    return <UserDetail userId={selectedId} onClose={() => setSelectedId(null)} onChanged={load} />;
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
        <form className="ai-help-form" onSubmit={applySearch} style={{ marginBottom: 0 }}>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, username or email" />
          <button type="submit" className="primary-button">Search</button>
          {query && (
            <button type="button" className="back-button" onClick={() => { setSearch(""); setQuery(""); setPage(1); }}>Clear</button>
          )}
        </form>
        <button type="button" className="back-button" onClick={exportCsv} disabled={exporting}>
          {exporting ? "Exporting…" : "⬇️ Export CSV"}
        </button>
      </div>

      {error && <div className="error-message" style={{ marginBottom: "0.6rem" }}>⚠️ {error}</div>}

      {selectedIds.length > 0 && (
        <div className="admin-actions" style={{ marginBottom: "0.8rem" }}>
          <span className="plan-note" style={{ margin: 0 }}>{selectedIds.length} selected:</span>
          <button className="admin-mini" disabled={bulkBusy} onClick={() => bulkSuspend(false)}>Suspend selected</button>
          <button className="admin-mini" disabled={bulkBusy} onClick={() => bulkSuspend(true)}>Reactivate selected</button>
          <button className="admin-mini danger" disabled={bulkBusy} onClick={bulkDelete}>Delete selected</button>
        </div>
      )}

      <p className="plan-note">{total} learner{total === 1 ? "" : "s"}{query ? ` matching "${query}"` : ""}</p>

      {loading ? (
        <p className="plan-note">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="plan-note">No learners found.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selectedIds.length === rows.filter((u) => String(u.id) !== String(currentUserId)).length}
                    onChange={toggleAll}
                  />
                </th>
                <th>Name</th>
                <th>Languages</th>
                <th>Level</th>
                <th>XP</th>
                <th>Tests</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const isSelf = String(u.id) === String(currentUserId);
                return (
                  <tr key={u.id} className={u.isActive ? "" : "row-suspended"}>
                    <td>
                      <input type="checkbox" checked={checked.has(u.id)} disabled={isSelf} onChange={() => toggleCheck(u.id)} />
                    </td>
                    <td>
                      <button className="admin-link" onClick={() => setSelectedId(u.id)}>{u.name}</button>
                      <small className="admin-muted"> @{u.username}</small>
                    </td>
                    <td className="admin-nowrap">{u.targetLanguage} <span className="admin-muted">via</span> {u.preferredLanguage}</td>
                    <td>{u.proficiencyLevel}</td>
                    <td>{u.xpTotal}</td>
                    <td>{u.attempts}</td>
                    <td><span className={`admin-pill ${u.role === "admin" ? "admin" : ""}`}>{u.role}</span></td>
                    <td><span className={`admin-pill ${u.isActive ? "active" : "suspended"}`}>{u.isActive ? "active" : "suspended"}</span></td>
                    <td className="admin-actions">
                      <button className="admin-mini" disabled={busyId === u.id || isSelf} title={isSelf ? "You can't change your own role" : ""} onClick={() => patch(u.id, { role: u.role === "admin" ? "learner" : "admin" })}>
                        {u.role === "admin" ? "Demote" : "Make admin"}
                      </button>
                      <button className="admin-mini" disabled={busyId === u.id || isSelf} title={isSelf ? "You can't suspend your own account" : ""} onClick={() => patch(u.id, { isActive: !u.isActive })}>
                        {u.isActive ? "Suspend" : "Reactivate"}
                      </button>
                      <button className="admin-mini danger" disabled={busyId === u.id || isSelf} onClick={() => remove(u.id, u.name)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="admin-pager">
          <button className="back-button" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="back-button" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </>
  );
}

const SKILL_OPTIONS = ["reading", "writing", "listening", "speaking"];
const LANGS = ["English", "Hindi", "Telugu", "Tamil", "Malayalam", "Kannada"];

function emptyWord() {
  return { options: ["", "", "", ""], correct: 0, translations: Object.fromEntries(LANGS.map((l) => [l, ""])) };
}

/** NEW: form for admins to add a unit — options/correct entered once, per-language prompts below. */
function AddUnitForm({ onCreated, onCancel }) {
  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState([]);
  const [words, setWords] = useState([emptyWord()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleSkill = (s) => setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const updateWord = (i, patch) => setWords((prev) => prev.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));
  const updateOption = (i, oi, value) =>
    setWords((prev) => prev.map((w, idx) => (idx === i ? { ...w, options: w.options.map((o, x) => (x === oi ? value : o)) } : w)));
  const updateTranslation = (i, lang, value) =>
    setWords((prev) => prev.map((w, idx) => (idx === i ? { ...w, translations: { ...w.translations, [lang]: value } } : w)));

  const addWord = () => setWords((prev) => [...prev, emptyWord()]);
  const removeWord = (i) => setWords((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createUnit({ title: title.trim(), skills, words });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="admin-unit-form">
      {error && <div className="error-message">⚠️ {error}</div>}

      <div className="form-group">
        <label>Unit title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Numbers & Counting" required />
      </div>

      <div className="form-group">
        <label>Skills</label>
        <div className="admin-actions">
          {SKILL_OPTIONS.map((s) => (
            <label key={s} className={`admin-pill admin-skill-toggle ${skills.includes(s) ? "active" : ""}`}>
              <input type="checkbox" checked={skills.includes(s)} onChange={() => toggleSkill(s)} style={{ marginRight: "0.3rem" }} />
              {s}
            </label>
          ))}
        </div>
      </div>

      <h4 className="admin-subhead">Words</h4>
      {words.map((w, i) => (
        <div className="admin-word-card" key={i}>
          <div className="admin-detail-head">
            <strong>Word {i + 1}</strong>
            {words.length > 1 && <button type="button" className="admin-mini danger" onClick={() => removeWord(i)}>Remove</button>}
          </div>

          <div className="form-group">
            <label>4 answer choices (English), and mark the correct one</label>
            {w.options.map((opt, oi) => (
              <div key={oi} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
                <input type="radio" name={`correct-${i}`} checked={w.correct === oi} onChange={() => updateWord(i, { correct: oi })} />
                <input type="text" value={opt} onChange={(e) => updateOption(i, oi, e.target.value)} placeholder={`Option ${oi + 1}`} required style={{ flex: 1 }} />
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>The word itself, in each language</label>
            <div className="admin-translations-grid">
              {LANGS.map((lang) => (
                <div key={lang}>
                  <small className="admin-muted">{lang}</small>
                  <input type="text" value={w.translations[lang]} onChange={(e) => updateTranslation(i, lang, e.target.value)} required />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="back-button" onClick={addWord} style={{ marginBottom: "1rem" }}>+ Add another word</button>

      <div className="admin-actions">
        <button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving…" : "Create unit"}</button>
        <button type="button" className="back-button" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}

function ContentTab() {
  const [content, setContent] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    fetchAdminContent().then(setContent).catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const remove = async (customId, title) => {
    if (!window.confirm(`Delete unit "${title}"? This can't be undone.`)) return;
    setBusyId(customId);
    try {
      await deleteUnit(customId);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <div className="error-message">⚠️ {error}</div>;
  if (!content) return <p className="plan-note">Loading…</p>;

  return (
    <>
      <div className="admin-stat-grid">
        <StatCard icon="🌍" value={content.languages.length} label="Languages" />
        <StatCard icon="📚" value={content.unitCount} label="Curriculum units" />
        <StatCard icon="🔤" value={Object.values(content.wordsPerLanguage)[0] || 0} label="Words per language" />
      </div>

      <div className="admin-detail-head">
        <h4 className="admin-subhead" style={{ margin: 0 }}>Units</h4>
        {!showForm && <button className="primary-button" onClick={() => setShowForm(true)}>+ Add unit</button>}
      </div>

      {showForm && (
        <AddUnitForm
          onCreated={() => { setShowForm(false); load(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="review-list">
        {content.units.map((u) => (
          <div className="review-row" key={u.id}>
            <div className="review-row-main">
              <strong>
                {u.custom ? u.title : `Unit ${u.id}`}
                {u.custom && <span className="admin-pill admin" style={{ marginLeft: "0.5rem" }}>custom</span>}
              </strong>
              <span className="review-date">{(u.skills || []).join(", ")}</span>
            </div>
            {u.custom && (
              <button className="admin-mini danger" disabled={busyId === u.customId} onClick={() => remove(u.customId, u.title)}>
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      <h4 className="admin-subhead">Vocabulary coverage</h4>
      <Distribution title="" data={content.wordsPerLanguage} />

      <p className="plan-note" style={{ marginTop: "1rem" }}>
        Built-in units (1–6) are defined in code and can't be deleted here — only units you add through this form can be removed.
      </p>
    </>
  );
}

const ADMIN_TABS = [
  { id: "overview", icon: "📊", label: "Overview" },
  { id: "activity", icon: "🕒", label: "Activity" },
  { id: "users", icon: "👥", label: "Users" },
  { id: "content", icon: "📚", label: "Content" },
];

function AdminDashboard({ user, onLogout, onExitAdmin }) {
  const [tab, setTab] = useState("overview");

  return (
    <div className="app-shell admin-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="learnly-logo-icon">🛡️</div>
          <span>Learnly Admin</span>
        </div>

        <nav className="sidebar-nav">
          {ADMIN_TABS.map((t) => (
            <button key={t.id} type="button" className={`sidebar-nav-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span className="sidebar-nav-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{(user.name || "?")[0]?.toUpperCase()}</div>
            <div><strong>{user.name}</strong><small>admin</small></div>
          </div>
          <button type="button" className="sidebar-logout" style={{ marginBottom: "0.5rem" }} onClick={onExitAdmin}>← Learner view</button>
          <button type="button" className="sidebar-logout" onClick={onLogout}>⎋ Log Out</button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <h1 className="admin-title">{ADMIN_TABS.find((t) => t.id === tab)?.label}</h1>
          <span className="admin-badge-chip">🛡️ Admin</span>
        </header>

        <main className="app-content">
          <section className="plan-card">
            {tab === "overview" && <OverviewTab />}
            {tab === "activity" && <ActivityTab />}
            {tab === "users" && <UsersTab currentUserId={user.id} />}
            {tab === "content" && <ContentTab />}
          </section>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;

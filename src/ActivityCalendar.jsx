// src/ActivityCalendar.jsx
//
// Monthly heatmap: 🟢 active (3+ activity types that day), 🟡 low
// activity (1-2 types), ⚪ no activity. Pulls from GET /api/activity/calendar.

import { useEffect, useState } from "react";
import { fetchCalendar, fetchStreak } from "./activityApi";

function monthLabel(month) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
}

const DOT = { active: "🟢", low: "🟡", none: "⚪" };

function ActivityCalendar() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState(null);
  const [streak, setStreak] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCalendar(month).then(setData).catch((e) => setError(e.message));
  }, [month]);

  useEffect(() => {
    fetchStreak().then(setStreak).catch(() => setStreak(null));
  }, []);

  const shiftMonth = (delta) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    setMonth(d.toISOString().slice(0, 7));
  };

  if (error) return <div className="error-message">⚠️ {error}</div>;

  return (
    <section className="plan-card">
      <h2>📅 Activity Calendar</h2>

      {streak && (
        <p className="plan-note">
          🔥 {streak.currentStreak} day streak · 🏆 {streak.longestStreak} best · {streak.activeDays} active days total
        </p>
      )}

      <div className="calendar-nav">
        <button className="back-button" onClick={() => shiftMonth(-1)}>← Prev</button>
        <strong>{monthLabel(month)}</strong>
        <button className="back-button" onClick={() => shiftMonth(1)}>Next →</button>
      </div>

      {!data ? (
        <p className="plan-note">Loading…</p>
      ) : (
        <div className="calendar-grid">
          {data.days.map((d) => (
            <div key={d.date} className="calendar-cell" title={`${d.date}: ${d.minutes} min`}>
              <span>{DOT[d.level]}</span>
              <small>{Number(d.date.slice(-2))}</small>
            </div>
          ))}
        </div>
      )}

      <p className="plan-note" style={{ marginTop: "0.8rem" }}>
        🟢 Active &nbsp; 🟡 Low activity &nbsp; ⚪ No activity
      </p>
    </section>
  );
}

export default ActivityCalendar;

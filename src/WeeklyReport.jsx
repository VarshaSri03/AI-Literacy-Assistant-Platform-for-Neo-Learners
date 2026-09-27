// src/WeeklyReport.jsx
//
// Last-7-days summary + a small inline SVG bar chart (no new charting
// dependency, same approach as the admin language chart).

import { useEffect, useState } from "react";
import { fetchWeeklyReport } from "./activityApi";

function WeeklyReport() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWeeklyReport().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-message">⚠️ {error}</div>;
  if (!data) return <p className="plan-note">Loading…</p>;

  const max = Math.max(1, ...data.days.map((d) => d.minutes));
  const barW = 36;
  const gap = 14;
  const chartW = data.days.length * (barW + gap);
  const chartH = 100;

  return (
    <section className="plan-card">
      <h2>📈 Weekly Report</h2>

      <div className="admin-stat-grid">
        <div className="admin-stat"><strong>{data.activeDays}</strong><small>Active days</small></div>
        <div className="admin-stat"><strong>{data.learningMinutes}</strong><small>Learning minutes</small></div>
        <div className="admin-stat"><strong>{data.lessonsCompleted}</strong><small>Lessons</small></div>
        <div className="admin-stat"><strong>{data.wordsSessions}</strong><small>Vocabulary sessions</small></div>
        <div className="admin-stat"><strong>{data.speakingSessions}</strong><small>Speaking sessions</small></div>
        <div className="admin-stat"><strong>{data.aiQuestions}</strong><small>AI questions</small></div>
      </div>

      <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} width="100%" style={{ maxWidth: chartW }} role="img" aria-label="Minutes learned per day this week">
        {data.days.map((d, i) => {
          const h = (d.minutes / max) * chartH;
          const x = i * (barW + gap);
          return (
            <g key={d.date}>
              <rect x={x} y={chartH - h} width={barW} height={h} rx="6" fill={d.active ? "var(--primary)" : "var(--border)"} />
              <text x={x + barW / 2} y={chartH + 16} textAnchor="middle" fontSize="11" fill="var(--ink-faint)">
                {new Date(d.date + "T00:00:00Z").toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" })}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

export default WeeklyReport;

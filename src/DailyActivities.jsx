// src/DailyActivities.jsx
//
// "Today's Progress: X / Y activities completed" checklist + daily goal
// (10/15/20/30 min). Call recordActivity(type) from wherever those
// actions already happen (e.g. after a lesson finishes, after a Voice
// Studio session, after an AI Help question) to check items off — this
// component only displays state, it doesn't record it, so it doesn't
// need to know how lessons/voice/AI Help work internally.

import { useEffect, useState } from "react";
import { fetchTodayActivity, setDailyGoal } from "./activityApi";

const LABELS = {
  vocabulary: { icon: "📝", label: "Daily vocabulary" },
  lesson: { icon: "📖", label: "Daily lesson" },
  speaking: { icon: "🎤", label: "Speaking practice" },
  listening: { icon: "👂", label: "Listening practice" },
  quiz: { icon: "❓", label: "Daily quiz" },
  aiHelp: { icon: "🤖", label: "AI Help" },
};

const GOAL_OPTIONS = [10, 15, 20, 30];

function DailyActivities({ ui }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  const load = () => {
    fetchTodayActivity().then(setData).catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const changeGoal = async (minutes) => {
    setSavingGoal(true);
    try {
      await setDailyGoal(minutes);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingGoal(false);
    }
  };

  if (error) return <div className="error-message">⚠️ {error}</div>;
  if (!data) return <p className="plan-note">Loading…</p>;

  const pct = Math.round((data.completedCount / data.totalCount) * 100);

  return (
    <section className="plan-card">
      <h2>✅ {ui?.dailyActivitiesTitle || "Today's Activities"}</h2>
      <p className="plan-note">
        {ui?.todaysProgressLabel || "Today's Progress"}: {data.completedCount} / {data.totalCount}
      </p>
      <div className="progress-track" style={{ marginBottom: "1rem" }}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="daily-activity-grid">
        {Object.entries(LABELS).map(([key, { icon, label }]) => (
          <div key={key} className={`daily-activity-item ${data.activities[key] ? "done" : ""}`}>
            <span className="daily-activity-icon">{data.activities[key] ? "✅" : icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="daily-goal-row">
        <span className="plan-note" style={{ margin: 0 }}>
          Today's Goal: {data.minutesToday} / {data.goalMinutes} min {data.goalMet && "🎉"}
        </span>
        <div className="admin-actions">
          {GOAL_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              className={`admin-mini ${data.goalMinutes === m ? "active-goal" : ""}`}
              disabled={savingGoal}
              onClick={() => changeGoal(m)}
            >
              {m} min
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DailyActivities;

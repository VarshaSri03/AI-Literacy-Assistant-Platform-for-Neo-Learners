// src/AchievementsPanel.jsx
//
// New standalone achievements display, computed from GET
// /api/activity/achievements. Kept separate from your existing
// ProfilePanel.jsx (which I've never seen) rather than risk editing it
// blind — both can coexist, or you can fold this into ProfilePanel later.

import { useEffect, useState } from "react";
import { fetchAchievements } from "./activityApi";

function AchievementsPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAchievements().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-message">⚠️ {error}</div>;
  if (!data) return <p className="plan-note">Loading…</p>;

  const unlockedCount = data.achievements.filter((a) => a.unlocked).length;

  return (
    <section className="plan-card">
      <h2>🏅 Achievements</h2>
      <p className="plan-note">{unlockedCount} / {data.achievements.length} unlocked</p>
      <div className="achievement-grid">
        {data.achievements.map((a) => (
          <div key={a.id} className={`achievement-card ${a.unlocked ? "unlocked" : "locked"}`}>
            <div className="achievement-icon">{a.unlocked ? a.icon : "🔒"}</div>
            <strong>{a.title}</strong>
            {a.progress && <small>{a.progress}</small>}
          </div>
        ))}
      </div>
    </section>
  );
}

export default AchievementsPanel;

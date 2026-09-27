// src/RecommendedForYou.jsx
//
// Replaces the old giant "YOUR PERSONALIZED PLAN" hero. Compact card,
// rule-based recommendations from GET /api/activity/today — no AI call
// needed for this, keeps it fast and predictable.

import { useEffect, useState } from "react";
import { fetchTodayActivity } from "./activityApi";

function RecommendedForYou({ ui, onAction }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTodayActivity().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return null; // non-critical widget — fail quietly rather than break the dashboard
  if (!data) return null;

  return (
    <section className="plan-card recommended-card">
      <h2>✨ {ui?.recommendedTitle || "Recommended for You"}</h2>
      <div className="recommended-list">
        {data.recommendations.map((r, i) => (
          <button
            key={i}
            type="button"
            className="recommended-item"
            disabled={!r.action}
            onClick={() => r.action && onAction?.(r.action)}
          >
            <span className="recommended-icon">{r.icon}</span>
            <span>{r.text}</span>
            {r.action && <span className="recommended-arrow">→</span>}
          </button>
        ))}
      </div>
    </section>
  );
}

export default RecommendedForYou;

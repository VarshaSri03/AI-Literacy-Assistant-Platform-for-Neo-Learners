// src/StreakXpBar.jsx
//
// Compact "Streak + XP + Active Days" stat row (spec section 13, right
// under the welcome section). XP total comes from Progress (existing,
// unchanged); streak/active days are new, from /api/activity/streak.

import { useEffect, useState } from "react";
import { fetchStreak } from "./activityApi";

function StreakXpBar({ xpTotal }) {
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    fetchStreak().then(setStreak).catch(() => setStreak(null));
  }, []);

  return (
    <div className="streak-xp-bar">
      <div className="streak-xp-item">
        <span className="streak-xp-icon">🔥</span>
        <div>
          <strong>{streak ? streak.currentStreak : "—"}</strong>
          <small>Day streak</small>
        </div>
      </div>
      <div className="streak-xp-item">
        <span className="streak-xp-icon">⭐</span>
        <div>
          <strong>{xpTotal ?? 0}</strong>
          <small>Total XP</small>
        </div>
      </div>
      <div className="streak-xp-item">
        <span className="streak-xp-icon">📅</span>
        <div>
          <strong>{streak ? streak.activeDays : "—"}</strong>
          <small>Active days</small>
        </div>
      </div>
      {streak?.longestStreak > 0 && (
        <div className="streak-xp-item">
          <span className="streak-xp-icon">🏆</span>
          <div>
            <strong>{streak.longestStreak}</strong>
            <small>Best streak</small>
          </div>
        </div>
      )}
    </div>
  );
}

export default StreakXpBar;

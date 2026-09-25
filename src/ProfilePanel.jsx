// src/ProfilePanel.jsx
//
// Profile tab: learner details, achievement badges, and a per-skill
// breakdown with "best at" / "room to improve" highlights.

import { evaluateAchievements, computeSkillScores, skillHighlights } from "./content/achievements";

function ProfilePanel({
  ui,
  displayName,
  age,
  targetLanguage,
  preferredLanguage,
  level,
  streak,
  xpTotal,
  lessonsCompleted,
  history,
  bestVoiceScore,
  isCertified,
}) {
  const hasPerfectScore = (history || []).some((h) => h.total > 0 && h.score === h.total);

  const achievements = evaluateAchievements({
    lessonsCompleted,
    streak,
    xpTotal,
    hasPerfectScore,
    bestVoiceScore,
    isCertified,
  });

  const skills = computeSkillScores(history || [], bestVoiceScore);
  const { best, weakest } = skillHighlights(skills);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <>
      <section className="plan-card">
        <h2>👤 {ui.profileTitle}</h2>
        <div className="profile-grid">
          <div><small>{ui.profileNameLabel}</small><strong>{displayName}</strong></div>
          <div><small>{ui.profileAgeLabel}</small><strong>{age}</strong></div>
          <div><small>{ui.profileTargetLabel}</small><strong>{targetLanguage}</strong></div>
          <div><small>{ui.profileBridgeLabel}</small><strong>{preferredLanguage}</strong></div>
          <div><small>{ui.profileLevelLabel}</small><strong>{level}</strong></div>
          <div><small>{ui.streakLabel}</small><strong>🔥 {streak}</strong></div>
          <div><small>{ui.totalXpLabel}</small><strong>⭐ {xpTotal}</strong></div>
          <div><small>{ui.lessonsCompletedLabel}</small><strong>{lessonsCompleted} / 9</strong></div>
        </div>
      </section>

      <section className="plan-card">
        <h2>🏆 {ui.achievementsTitle}</h2>
        <p className="plan-note">
          {ui.achievementsSubtitle} ({unlockedCount} / {achievements.length})
        </p>
        <div className="achievement-grid">
          {achievements.map((a) => (
            <div key={a.id} className={`achievement-card ${a.unlocked ? "unlocked" : "locked"}`}>
              <div className="achievement-icon">{a.unlocked ? a.icon : "🔒"}</div>
              <strong>{ui[a.titleKey]}</strong>
              <small>{a.unlocked ? ui[a.descKey] : ui.lockedLabel}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="plan-card">
        <h2>📊 {ui.skillsTitle}</h2>
        <p className="plan-note">{ui.skillsSubtitle}</p>

        {skills.some((s) => s.attempted) ? (
          <>
            <div className="skill-list">
              {skills.map((s) => (
                <div className="skill-row" key={s.id}>
                  <span className="skill-label">{s.icon} {ui[s.labelKey]}</span>
                  <div className="skill-track">
                    <div
                      className={`skill-fill ${s.percent >= 75 ? "high" : s.percent >= 40 ? "mid" : "low"}`}
                      style={{ width: `${s.percent}%` }}
                    />
                  </div>
                  <span className="skill-percent">{s.attempted ? `${s.percent}%` : "—"}</span>
                </div>
              ))}
            </div>

            <div className="skill-highlights">
              {best && (
                <div className="skill-highlight good">
                  <small>{ui.bestAtLabel}</small>
                  <strong>{best.icon} {ui[best.labelKey]} — {best.percent}%</strong>
                </div>
              )}
              {weakest && (
                <div className="skill-highlight warn">
                  <small>{ui.improveLabel}</small>
                  <strong>{weakest.icon} {ui[weakest.labelKey]} — {weakest.percent}%</strong>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="plan-note">{ui.noSkillDataNote}</p>
        )}
      </section>
    </>
  );
}

export default ProfilePanel;

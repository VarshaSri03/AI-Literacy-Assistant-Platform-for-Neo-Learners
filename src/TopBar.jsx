// TopBar.jsx
// Language switcher (target + bridge/preferred language) and the
// streak/XP/units/goal badge row, pinned above the scrolling content area.

const LANGUAGE_OPTIONS = ["English", "Hindi", "Telugu", "Tamil", "Malayalam", "Kannada"];

function TopBar({
  targetLanguage,
  preferredLanguage,
  onChangeTarget,
  onChangePreferred,
  streak,
  xpTotal,
  unitsCompleted,
  dailyGoalPercent,
  ui,
  switching,
}) {
  return (
    <header className="app-topbar">
      <div className="lang-switchers">
        <label className="lang-switcher">
          <span className="lang-switcher-label">{ui.targetLabel}</span>
          <select
            value={targetLanguage}
            disabled={switching}
            onChange={(e) => onChangeTarget(e.target.value)}
          >
            {LANGUAGE_OPTIONS.filter((l) => l !== preferredLanguage).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>

        <span className="lang-switcher-via">via</span>

        <label className="lang-switcher">
          <span className="lang-switcher-label">{ui.bridgeLabel}</span>
          <select
            value={preferredLanguage}
            disabled={switching}
            onChange={(e) => onChangePreferred(e.target.value)}
          >
            {LANGUAGE_OPTIONS.filter((l) => l !== targetLanguage).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="header-badges">
        <span className="header-badge" title={ui.streakLabel}>
          <span className="badge-icon">🔥</span>{streak}
        </span>
        <span className="header-badge" title={ui.totalXpLabel}>
          <span className="badge-icon">⭐</span>{xpTotal} XP
        </span>
        <span className="header-badge" title={ui.unitsBadgeLabel}>
          <span className="badge-icon">💎</span>{unitsCompleted}
        </span>
        <span className="header-badge" title={ui.dailyGoalLabel}>
          <span className="badge-icon">🎯</span>{dailyGoalPercent}%
        </span>
      </div>
    </header>
  );
}

export default TopBar;

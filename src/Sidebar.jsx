// Sidebar.jsx
// Fixed left navigation for the dashboard shell. Purely presentational —
// Dashboard.jsx owns which tab is active and what each tab renders.

const NAV_ITEMS = [
  { id: "path", icon: "🗺️", labelKey: "navPath" },
  { id: "assessment", icon: "🎯", labelKey: "navAssessment" },
  { id: "voice", icon: "🎙️", labelKey: "navVoiceStudio" },
  { id: "leaderboard", icon: "🏆", labelKey: "navLeaderboard" },
  { id: "progress", icon: "📊", labelKey: "navProgress" },
  { id: "profile", icon: "👤", labelKey: "navProfile" },
];

function Sidebar({ activeTab, onSelectTab, displayName, targetLanguage, ui, onLogout, onEnterAdmin }) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="learnly-logo-icon">📚</div>
        <span>Learnly</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => onSelectTab(item.id)}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {ui[item.labelKey]}
          </button>
        ))}

        {/* Only rendered for admins — App.jsx passes onEnterAdmin as null
            for everyone else. The admin APIs are authorized server-side
            regardless, so this is a convenience link, not a gate. */}
        {onEnterAdmin && (
          <button
            type="button"
            className="sidebar-nav-item admin-nav-item"
            onClick={onEnterAdmin}
          >
            <span className="sidebar-nav-icon">🛡️</span>
            Admin
          </button>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{(displayName || "?")[0]?.toUpperCase()}</div>
          <div>
            <strong>{displayName}</strong>
            <small>{targetLanguage}</small>
          </div>
        </div>
        <button type="button" className="sidebar-logout" onClick={onLogout}>
          ⎋ {ui.navLogout}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

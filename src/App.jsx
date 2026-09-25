import { useState, useEffect } from "react";
import "./App.css";

import LandingPage from "./LandingPage";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import AdminDashboard from "./AdminDashboard";
import InstallPrompt from "./InstallPrompt";
import { getToken, clearToken, fetchCurrentUser } from "./api";
import { savePreferredLanguage } from "./personalization";

function App() {
  // Which screen is showing: "landing" | "login" | "register" | "dashboard" | "admin"
  const [page, setPage] = useState("landing");

  // The signed-in learner's profile, as returned by the backend
  // (server/routes/auth.js) — name, age, preferredLanguage, targetLanguage,
  // level, goals, role. This is what personalization.js turns into a plan.
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Admins land on the admin dashboard by default, but can switch to the
  // learner view (and back) without logging out.
  const landingPageFor = (profile) =>
    profile?.role === "admin" ? "admin" : "dashboard";

  // On first load, if a login token was saved earlier, try to restore that
  // session automatically instead of sending the learner back to the
  // landing page every time they refresh.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }
    fetchCurrentUser(token)
      .then(({ user: restoredUser }) => {
        savePreferredLanguage(restoredUser.preferredLanguage);
        setUser(restoredUser);
        setPage(landingPageFor(restoredUser));
      })
      .catch(() => {
        clearToken(); // token expired, invalid, or account suspended
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const goToLogin = () => setPage("login");
  const goToRegister = () => setPage("register");

  // Called by Register once the account is created in the database.
  const handleRegisterComplete = (profile) => {
    savePreferredLanguage(profile.preferredLanguage);
    setUser(profile);
    setPage(landingPageFor(profile));
  };

  // Called by Login once the database confirms the credentials.
  const handleLoginSuccess = (profile) => {
    savePreferredLanguage(profile.preferredLanguage);
    setUser(profile);
    setPage(landingPageFor(profile));
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setPage("landing");
  };

  if (checkingSession) {
    return null; // avoids a flash of the landing page while we check for a saved session
  }

  // NEW: rendered once at the top level regardless of which page is
  // showing, so "Install Learnly" can appear whether someone's on the
  // landing page, logged in, or in the admin dashboard.
  const installPrompt = <InstallPrompt />;

  if (page === "login") {
    return (
      <>
        <Login goToRegister={goToRegister} onLoginSuccess={handleLoginSuccess} />
        {installPrompt}
      </>
    );
  }

  if (page === "register") {
    return (
      <>
        <Register goToLogin={goToLogin} onRegisterComplete={handleRegisterComplete} />
        {installPrompt}
      </>
    );
  }

  // The role check here only decides what to RENDER. Every admin API call is
  // independently authorized server-side (middleware/auth.js requireAdmin),
  // so editing this in devtools grants no actual access.
  if (page === "admin" && user?.role === "admin") {
    return (
      <>
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          onExitAdmin={() => setPage("dashboard")}
        />
        {installPrompt}
      </>
    );
  }

  if (page === "dashboard" && user) {
    return (
      <>
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onEnterAdmin={user.role === "admin" ? () => setPage("admin") : null}
        />
        {installPrompt}
      </>
    );
  }

  return (
    <>
      <LandingPage onLogin={goToLogin} onRegister={goToRegister} />
      {installPrompt}
    </>
  );
}

export default App;

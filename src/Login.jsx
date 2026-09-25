import React, { useState, useEffect } from "react";
import { loginUser, saveToken } from "./api";
import { SOURCE_UI_STRINGS, getUiStrings, getSavedPreferredLanguage } from "./personalization";

function Login({ goToRegister, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If this browser has logged in/registered before, we already know the
  // learner's preferred language (saved by App.jsx) — so even the Login
  // screen itself can greet a returning learner in their own language.
  const [ui, setUi] = useState(SOURCE_UI_STRINGS);

  useEffect(() => {
    const saved = getSavedPreferredLanguage();
    if (!saved || saved === "English") return;
    let cancelled = false;
    getUiStrings(saved).then((strings) => {
      if (!cancelled) setUi(strings);
    });
    return () => { cancelled = true; };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError(ui.enterCredentialsError);
      return;
    }

    setSubmitting(true);
    try {
      // Checks the credentials against the database (server/routes/auth.js).
      const { user, token } = await loginUser(username, password);
      saveToken(token);
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      setError(err.message || ui.invalidCredentialsError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    alert("Google login will be connected using Google OAuth.");
  };

  return (
    <div className="auth-container">
      <div className="auth-card login-card">

        <div className="brand">
          <div className="brand-icon">📚</div>

          <div>
            <h1>Learnly</h1>
            <p>AI Literacy Assistant</p>
          </div>
        </div>

        <div className="login-icon">
          👋
        </div>

        <h2>{ui.welcomeBack}</h2>

        <p className="subtitle">
          {ui.continueJourney}
        </p>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <div className="form-group">
            <label>{ui.usernameOrEmailLabel}</label>

            <input
              type="text"
              placeholder={ui.usernameOrEmailPlaceholder}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
            />
          </div>

          <div className="form-group">
            <div className="password-label">
              <label>{ui.passwordLabel}</label>

              <button
                type="button"
                className="forgot-button"
                onClick={() => alert(ui.passwordRecoverySoon)}
              >
                {ui.forgotPassword}
              </button>
            </div>

            <div className="password-input">
              <input
                type={
                  showPassword ? "text" : "password"
                }
                placeholder={ui.enterPasswordPlaceholder}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            className="primary-button login-button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? ui.loggingIn : `${ui.loginBtn} →`}
          </button>
        </form>

        <div className="divider">
          <span>{ui.orLabel}</span>
        </div>

        <button
          className="google-button"
          onClick={handleGoogleLogin}
        >
          <span>G</span>
          {ui.googleContinue}
        </button>

        <div className="switch-page">
          {ui.dontHaveAccount}
          <button onClick={goToRegister}>
            {ui.createAccountLink}
          </button>
        </div>

      </div>
    </div>
  );
}

export default Login;

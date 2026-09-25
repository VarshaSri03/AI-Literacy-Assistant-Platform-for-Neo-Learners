import React, { useState, useEffect } from "react";
import {
  ASSESSMENT_QUESTIONS,
  SOURCE_UI_STRINGS,
  GOAL_DEFS,
  getUiStrings,
  scoreToLevel,
} from "./personalization";
import { registerUser, saveToken } from "./api";

const languages = [
  { name: "English", native: "English", icon: "🇬🇧" },
  { name: "Hindi", native: "हिन्दी", icon: "🇮🇳" },
  { name: "Telugu", native: "తెలుగు", icon: "🇮🇳" },
  { name: "Tamil", native: "தமிழ்", icon: "🇮🇳" },
  { name: "Malayalam", native: "മലയാളം", icon: "🇮🇳" },
  { name: "Kannada", native: "ಕನ್ನಡ", icon: "🇮🇳" },
];

const TOTAL_STEPS = 6;

function Register({ goToLogin, onRegisterComplete }) {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    preferredLanguage: "",   // language the learner is comfortable in
    targetLanguage: "",      // language the learner wants to learn
    name: "",
    age: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    goals: [],                // stable keys, e.g. ["reading", "speaking"]
    level: "",                // set automatically by the assessment below
  });

  // Assessment (step 5) local state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [assessmentDone, setAssessmentDone] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(null);

  // UI text, translated live via Azure Translator (through personalization.js).
  // Starts as the English source so the form never shows blanks while the
  // real translation is in flight. Every step (2 onward) reads from `ui`
  // once the learner has picked their comfortable language in step 1.
  const [ui, setUi] = useState(SOURCE_UI_STRINGS);
  const [uiLoading, setUiLoading] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const quizQuestions =
    ASSESSMENT_QUESTIONS[formData.targetLanguage] || ASSESSMENT_QUESTIONS.English;

  // Fetch translated UI strings whenever the learner's comfortable language
  // changes. This is the actual Azure Translator call — from this point on,
  // every step of the wizard (2–6) renders in that language.
  useEffect(() => {
    if (!formData.preferredLanguage) {
      setUi(SOURCE_UI_STRINGS);
      return;
    }
    let cancelled = false;
    setUiLoading(true);
    getUiStrings(formData.preferredLanguage).then((strings) => {
      if (!cancelled) {
        setUi(strings);
        setUiLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [formData.preferredLanguage]);

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError("");
  };

  const toggleGoal = (goalKey) => {
    if (formData.goals.includes(goalKey)) {
      updateField("goals", formData.goals.filter((item) => item !== goalKey));
    } else {
      updateField("goals", [...formData.goals, goalKey]);
    }
  };

  const handleAnswer = (optionIndex) => {
    const isCorrect = optionIndex === quizQuestions[quizIndex].correct;
    const newScore = quizScore + (isCorrect ? 1 : 0);
    setLastAnswerCorrect(isCorrect);

    setTimeout(() => {
      setLastAnswerCorrect(null);
      if (quizIndex + 1 < quizQuestions.length) {
        setQuizScore(newScore);
        setQuizIndex(quizIndex + 1);
      } else {
        setQuizScore(newScore);
        updateField("level", scoreToLevel(newScore));
        setAssessmentDone(true);
      }
    }, 500);
  };

  const nextStep = () => {
    setError("");

    if (step === 1 && !formData.preferredLanguage) {
      setError(ui.errSelectPreferred);
      return;
    }

    if (step === 2) {
      if (!formData.targetLanguage) {
        setError(ui.errSelectTarget);
        return;
      }
      if (formData.targetLanguage === formData.preferredLanguage) {
        setError(ui.errSameLanguage);
        return;
      }
    }

    if (step === 3) {
      if (!formData.name || !formData.age || !formData.email || !formData.username) {
        setError(ui.errFillRequired);
        return;
      }
      if (Number(formData.age) < 5 || Number(formData.age) > 100) {
        setError(ui.errInvalidAge);
        return;
      }
    }

    if (step === 4 && formData.goals.length === 0) {
      setError(ui.errSelectGoal);
      return;
    }

    if (step === 5 && !assessmentDone) {
      setError(ui.errFinishAssessment);
      return;
    }

    setStep(step + 1);
  };

  const previousStep = () => {
    setError("");
    setStep(step - 1);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      setError(ui.errPasswordLength);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(ui.errPasswordMismatch);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Actually saves the account to the database (server/routes/auth.js).
      const { user, token } = await registerUser({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        age: Number(formData.age),
        preferredLanguage: formData.preferredLanguage,
        targetLanguage: formData.targetLanguage,
        level: formData.level,
        assessmentScore: quizScore,
        goals: formData.goals,
      });

      saveToken(token);

      if (onRegisterComplete) {
        onRegisterComplete(user);
      }
    } catch (err) {
      setError(err.message || ui.errRegistrationFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">

        <div className="brand">
          <div className="brand-icon">📚</div>
          <div>
            <h1>Learnly</h1>
            <p>AI Literacy Assistant</p>
          </div>
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>

        <div className="step-count">{ui.stepLabel} {step} {ui.ofLabel} {TOTAL_STEPS}</div>

        {/* STEP 1 — comfortable / preferred language (always shown in English,
            since we don't know the learner's language preference yet) */}
        {step === 1 && (
          <div className="step-content">
            <h2>🗣️ {SOURCE_UI_STRINGS.step1Title}</h2>
            <p className="subtitle">{SOURCE_UI_STRINGS.step1Subtitle}</p>

            <div className="language-grid">
              {languages.map((language) => (
                <button
                  type="button"
                  key={language.name}
                  className={`language-card ${
                    formData.preferredLanguage === language.name ? "selected" : ""
                  }`}
                  onClick={() => updateField("preferredLanguage", language.name)}
                >
                  <span className="language-icon">{language.icon}</span>
                  <strong>{language.native}</strong>
                  <small>{language.name}</small>
                  {formData.preferredLanguage === language.name && (
                    <span className="check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 onward — translated live into formData.preferredLanguage */}
        {step === 2 && (
          <div className="step-content">
            <h2>🌍 {ui.step2Title}{uiLoading ? " …" : ""}</h2>
            <p className="subtitle">
              {ui.step2SubtitlePrefix}{" "}
              <strong>{formData.preferredLanguage}</strong>.
            </p>

            <div className="language-grid">
              {languages.map((language) => {
                const isDisabled = language.name === formData.preferredLanguage;
                return (
                  <button
                    type="button"
                    key={language.name}
                    disabled={isDisabled}
                    className={`language-card ${
                      formData.targetLanguage === language.name ? "selected" : ""
                    } ${isDisabled ? "disabled" : ""}`}
                    onClick={() => !isDisabled && updateField("targetLanguage", language.name)}
                  >
                    <span className="language-icon">{language.icon}</span>
                    <strong>{language.native}</strong>
                    <small>{isDisabled ? ui.comfortableLanguageLabel : language.name}</small>
                    {formData.targetLanguage === language.name && (
                      <span className="check">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <h2>👋 {ui.step3Title}{uiLoading ? " …" : ""}</h2>
            <p className="subtitle">{ui.step3Subtitle}</p>

            <div className="form-group">
              <label>{ui.fullNameLabel} *</label>
              <input
                type="text"
                placeholder={ui.namePlaceholder}
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>{ui.ageLabel} *</label>
              <input
                type="number"
                placeholder={ui.agePlaceholder}
                min="5"
                max="100"
                value={formData.age}
                onChange={(e) => updateField("age", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>{ui.emailLabel} *</label>
              <input
                type="email"
                placeholder={ui.emailPlaceholder}
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>{ui.usernameLabel} *</label>
              <input
                type="text"
                placeholder={ui.usernamePlaceholder}
                value={formData.username}
                onChange={(e) => updateField("username", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-content">
            <h2>🎯 {ui.step4Title}{uiLoading ? " …" : ""}</h2>
            <p className="subtitle">{ui.step4Subtitle}</p>

            <div className="goal-grid">
              {GOAL_DEFS.map((goal) => (
                <button
                  type="button"
                  key={goal.key}
                  className={`goal-card ${formData.goals.includes(goal.key) ? "selected" : ""}`}
                  onClick={() => toggleGoal(goal.key)}
                >
                  {goal.emoji} {ui[goal.stringKey]}
                  {formData.goals.includes(goal.key) && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="step-content">
            <h2>{ui.assessmentTitle}{uiLoading ? " …" : ""}</h2>
            <p className="subtitle">
              {ui.assessmentSubtitle} {formData.targetLanguage} — {(ui.explainedNote || "").toLowerCase()}.
            </p>

            {!assessmentDone ? (
              <div className="assessment-quiz">
                <div className="quiz-progress">
                  {ui.questionLabel} {quizIndex + 1} {ui.ofLabel} {quizQuestions.length}
                </div>

                <div className="quiz-question">
                  <span className="quiz-word">{quizQuestions[quizIndex].prompt}</span>
                  <small>{ui.meaningLabel}?</small>
                </div>

                <div className="quiz-options">
                  {quizQuestions[quizIndex].options.map((opt, i) => (
                    <button
                      type="button"
                      key={i}
                      className="quiz-option"
                      onClick={() => handleAnswer(i)}
                      disabled={lastAnswerCorrect !== null}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {lastAnswerCorrect !== null && (
                  <div className={`quiz-feedback ${lastAnswerCorrect ? "good" : "bad"}`}>
                    {lastAnswerCorrect ? `✅ ${ui.correct}` : `❌ ${ui.incorrect}`}
                  </div>
                )}
              </div>
            ) : (
              <div className="quiz-result">
                <span className="level-badge">
                  {ui.yourLevelIs}: {formData.level}
                </span>
                <p>{quizScore} / {quizQuestions.length} {ui.correctSuffix}</p>
                <small>{ui.resultNote}</small>
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <form className="step-content" onSubmit={handleRegister}>
            <h2>🔐 {ui.step6Title}{uiLoading ? " …" : ""}</h2>
            <p className="subtitle">{ui.step6Subtitle}</p>

            <div className="form-group">
              <label>{ui.passwordLabel} *</label>
              <input
                type="password"
                placeholder={ui.passwordPlaceholder}
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>{ui.confirmPasswordLabel} *</label>
              <input
                type="password"
                placeholder={ui.confirmPasswordPlaceholder}
                value={formData.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
              />
            </div>

            <div className="google-button">
              <span>G</span>
              {ui.googleContinue}
            </div>

            <p className="terms">{ui.termsText}</p>
          </form>
        )}

        {error && <div className="error-message">⚠️ {error}</div>}

        <div className="navigation-buttons">
          {step > 1 && (
            <button className="back-button" onClick={previousStep} type="button">
              ← {ui.backBtn}
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button className="primary-button" onClick={nextStep} type="button">
              {ui.continueBtn} →
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={handleRegister}
              type="button"
              disabled={submitting}
            >
              {submitting ? ui.creatingAccount : `${ui.createAccountBtn} 🚀`}
            </button>
          )}
        </div>

        <div className="switch-page">
          {ui.alreadyHaveAccount}
          <button onClick={goToLogin}>{ui.loginLinkBtn}</button>
        </div>
      </div>
    </div>
  );
}

export default Register;

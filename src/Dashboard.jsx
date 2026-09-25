import { useEffect, useState } from "react";
import {
  getPersonalizedPlan,
  GOAL_DEFS,
  HEARTS_START,
  XP_PER_CORRECT,
  isPassing,
  scoreToLevel,
  updateStreak,
  getXp,
  addXp,
  getDailyXp,
  addDailyXp,
  getCompletedUnits,
  savePreferredLanguage,
} from "./personalization";
import { speak, isSpeechSupported, listenOnce, isRecognitionSupported, isCloseMatch } from "./pronounce";
import { buildQuestions } from "./content/vocabulary";
import { LESSONS } from "./content/lessons";
import Lesson from "./Lesson";
import VoiceStudio from "./VoiceStudio";
import ProfilePanel from "./ProfilePanel";
import {
  fetchLearningPath,
  submitAssessment,
  fetchAssessmentHistory,
  askAiHelp,
  updateProfile,
  fetchLeaderboard,
} from "./learningApi";
import LearningGames from "./LearningGames";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

/** A single vocabulary word with a "listen" (TTS) and "speak" (STT practice) button. */
function WordChip({ word, targetLanguage, ui }) {
  const [micState, setMicState] = useState("idle"); // idle | listening | good | bad
  const [voiceMissing, setVoiceMissing] = useState(false);

  const handleListen = async () => {
    setVoiceMissing(false);
    const ok = await speak(word, targetLanguage);
    if (!ok) setVoiceMissing(true);
  };

  const handleListenBack = () => {
    setMicState("listening");
    listenOnce(targetLanguage, {
      onResult: (transcript) => setMicState(isCloseMatch(transcript, word) ? "good" : "bad"),
      onError: () => setMicState("idle"),
    });
  };

  return (
    <div className="unit-word-chip">
      <span>{word}</span>
      {isSpeechSupported() && (
        <button type="button" className="icon-btn" title={ui.listenBtn} onClick={handleListen}>
          🔊
        </button>
      )}
      {isRecognitionSupported() && (
        <button
          type="button"
          className={`icon-btn ${micState === "listening" ? "listening" : ""}`}
          title={ui.speakBtn}
          onClick={handleListenBack}
        >
          🎤
        </button>
      )}
      {micState === "good" && <span className="mic-feedback good">✓</span>}
      {micState === "bad" && <span className="mic-feedback bad">↻</span>}
      {voiceMissing && <span className="mic-feedback bad" title={ui.noVoiceNote}>🔇</span>}
    </div>
  );
}

/** Listening comprehension check: hears the word (audio only), picks the meaning. */
function ListeningCheck({ words, targetLanguage, ui }) {
  const [word] = useState(() => words[Math.floor(Math.random() * words.length)]);
  const [answered, setAnswered] = useState(null); // null | true | false
  const [voiceMissing, setVoiceMissing] = useState(false);

  if (!isSpeechSupported()) return null;

  const handleListen = async () => {
    const ok = await speak(word.prompt, targetLanguage);
    setVoiceMissing(!ok);
  };

  return (
    <div className="mini-check">
      <p className="mini-check-label">🎧 {ui.listeningCheckTitle}</p>
      <button type="button" className="icon-btn" title={ui.listenBtn} onClick={handleListen}>
        🔊
      </button>
      {voiceMissing && <p className="mic-feedback bad">{ui.noVoiceNote}</p>}
      <div className="quiz-options" style={{ marginTop: "0.6rem" }}>
        {word.options.map((opt, i) => (
          <button
            type="button"
            key={i}
            className="quiz-option"
            disabled={answered !== null}
            onClick={() => setAnswered(i === word.correct)}
          >
            {opt}
          </button>
        ))}
      </div>
      {answered !== null && (
        <p className={`mic-feedback ${answered ? "good" : "bad"}`}>
          {answered ? `✅ ${ui.correct}` : `❌ ${ui.incorrect}`}
        </p>
      )}
    </div>
  );
}

/** Writing check: sees the target-language word, types its meaning in their own language. */
function WritingCheck({ words, ui }) {
  const [word] = useState(() => words[Math.floor(Math.random() * words.length)]);
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null); // null | "good" | "bad"
  const expected = word.options[word.correct];

  const check = () => {
    setResult(isCloseMatch(value, expected) ? "good" : "bad");
  };

  return (
    <div className="mini-check">
      <p className="mini-check-label">
        ✍️ {ui.writingCheckTitle}: <strong>{word.prompt}</strong>
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => { setValue(e.target.value); setResult(null); }}
        placeholder={ui.writingPlaceholder}
      />
      <button type="button" className="back-button" onClick={check} disabled={!value.trim()}>
        {ui.checkBtn}
      </button>
      {result === "good" && <p className="mic-feedback good">✅ {ui.correct}</p>}
      {result === "bad" && <p className="mic-feedback bad">❌ {expected}</p>}
    </div>
  );
}

/**
 * Shared quiz engine used by both the certification test and every unit
 * test. Tracks hearts (lives) Duolingo-style — 3 wrong answers ends the
 * attempt early. Calls onComplete(score, total, ranOutOfHearts, wrongPrompts).
 */
function QuizRunner({ questions, ui, targetLanguage, onComplete }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(HEARTS_START);
  const [lastCorrect, setLastCorrect] = useState(null);
  const [outOfHearts, setOutOfHearts] = useState(false);
  const [wrongPrompts, setWrongPrompts] = useState([]);
  const [voiceMissing, setVoiceMissing] = useState(false);

  const current = questions[index];

  const handleListen = async () => {
    const ok = await speak(current.prompt, targetLanguage);
    setVoiceMissing(!ok);
  };

  const answer = (optionIndex) => {
    const isCorrect = optionIndex === current.correct;
    const newScore = score + (isCorrect ? 1 : 0);
    const newHearts = isCorrect ? hearts : hearts - 1;
    const newWrong = isCorrect ? wrongPrompts : [...wrongPrompts, current.prompt];
    setLastCorrect(isCorrect);

    setTimeout(() => {
      setLastCorrect(null);
      setWrongPrompts(newWrong);
      setVoiceMissing(false);

      if (!isCorrect && newHearts <= 0) {
        setHearts(0);
        setOutOfHearts(true);
        onComplete(newScore, questions.length, true, newWrong);
        return;
      }

      setHearts(newHearts);
      if (index + 1 < questions.length) {
        setScore(newScore);
        setIndex(index + 1);
      } else {
        setScore(newScore);
        onComplete(newScore, questions.length, false, newWrong);
      }
    }, 500);
  };

  if (outOfHearts) {
    return (
      <div className="quiz-result">
        <span className="level-badge">💔 {ui.outOfHearts}</span>
      </div>
    );
  }

  return (
    <div className="assessment-quiz">
      <div className="hearts-row">
        {Array.from({ length: HEARTS_START }).map((_, i) => (
          <span key={i} className={i < hearts ? "" : "heart-lost"}>❤️</span>
        ))}
      </div>

      <div className="quiz-progress">
        {ui.questionLabel} {index + 1} {ui.ofLabel} {questions.length}
      </div>

      <div className="quiz-question">
        <span className="quiz-word-row">
          <span className="quiz-word">{current.prompt}</span>
          {isSpeechSupported() && (
            <button type="button" className="icon-btn" title={ui.listenBtn} onClick={handleListen}>
              🔊
            </button>
          )}
        </span>
        <small>{ui.meaningLabel}?</small>
        {voiceMissing && <p className="mic-feedback bad">{ui.noVoiceNote}</p>}
      </div>

      <div className="quiz-options">
        {current.options.map((opt, i) => (
          <button
            type="button"
            key={i}
            className="quiz-option"
            onClick={() => answer(i)}
            disabled={lastCorrect !== null}
          >
            {opt}
          </button>
        ))}
      </div>

      {lastCorrect !== null && (
        <div className={`quiz-feedback ${lastCorrect ? "good" : "bad"}`}>
          {lastCorrect ? `✅ ${ui.correct}` : `❌ ${ui.incorrect}`}
        </div>
      )}
    </div>
  );
}

function Dashboard({ user, onLogout, onEnterAdmin }) {
  const [activeTab, setActiveTab] = useState("path");

  // ---- live language switching (top-bar dropdowns) ----
  const [targetOverride, setTargetOverride] = useState(user.targetLanguage);
  const [preferredOverride, setPreferredOverride] = useState(user.preferredLanguage);
  const [switching, setSwitching] = useState(false);
  const effectiveUser = { ...user, targetLanguage: targetOverride, preferredLanguage: preferredOverride };

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---- gamification: streak, XP, daily goal, unit progress (localStorage) ----
  const [streak, setStreak] = useState(0);
  const [xpTotal, setXpTotal] = useState(0);
  const [dailyXp, setDailyXp] = useState(0);
  const [completedUnits, setCompletedUnits] = useState([]);

  // ---- certification test state ----
  const [certActive, setCertActive] = useState(false);
  const [certResult, setCertResult] = useState(null);

  // ---- AI-based personalized learning engine ----
  const [learningPath, setLearningPath] = useState(null);
  const [pathLoading, setPathLoading] = useState(true);

  // ---- results review ----
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ---- ask AI for help ----
  const [helpQuestion, setHelpQuestion] = useState("");
  const [helpAnswer, setHelpAnswer] = useState(null);
  const [helpLoading, setHelpLoading] = useState(false);
  const [helpError, setHelpError] = useState("");

  // ---- leaderboard ----
  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  // ---- profile tab ----
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // ---- lesson path (teach -> test) ----
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [lessonResult, setLessonResult] = useState(null);

  // ---- best pronunciation score from Voice Studio ----
  const [bestVoiceScore, setBestVoiceScore] = useState(0);

  // getPersonalizedPlan is async — it calls Azure Translator (via
  // personalization.js -> translateService.js) before it can return.
  // Re-runs whenever the language switcher changes targetOverride/preferredOverride.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPersonalizedPlan(effectiveUser).then((result) => {
      if (!cancelled) {
        setPlan(result);
        setLoading(false);
        setSwitching(false);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetOverride, preferredOverride]);

  // Local (non-DB) progress tracking, keyed to the signed-in username.
  useEffect(() => {
    if (!user?.username) return;
    setStreak(updateStreak(user.username));
    setXpTotal(getXp(user.username));
    setDailyXp(getDailyXp(user.username));
    setCompletedUnits(getCompletedUnits(user.username));
    try {
      const raw = localStorage.getItem(`learnly_lessons_${user.username}`);
      setCompletedLessons(raw ? JSON.parse(raw) : []);
      setBestVoiceScore(Number(localStorage.getItem(`learnly_voice_${user.username}`)) || 0);
    } catch {
      setCompletedLessons([]);
    }
  }, [user]);

  const refreshLearningPath = () => {
    setPathLoading(true);
    fetchLearningPath()
      .then((data) => setLearningPath(data))
      .catch(() => setLearningPath(null))
      .finally(() => setPathLoading(false));
  };

  const refreshHistory = () => {
    setHistoryLoading(true);
    fetchAssessmentHistory()
      .then((data) => setHistory(data))
      .catch(() => setHistory(null))
      .finally(() => setHistoryLoading(false));
  };

  const refreshLeaderboard = () => {
    setLeaderboardLoading(true);
    fetchLeaderboard()
      .then((data) => setLeaderboard(data))
      .catch(() => setLeaderboard(null))
      .finally(() => setLeaderboardLoading(false));
  };

  // Loads the adaptive recommendation, history, and leaderboard once known.
  useEffect(() => {
    if (!user?.username) return;
    refreshLearningPath();
    refreshHistory();
    refreshLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleChangeTarget = (newTarget) => {
    setSwitching(true);
    setTargetOverride(newTarget);
    updateProfile({ targetLanguage: newTarget }).catch(() => {});
  };

  const handleChangePreferred = (newPreferred) => {
    setSwitching(true);
    setPreferredOverride(newPreferred);
    savePreferredLanguage(newPreferred);
    updateProfile({ preferredLanguage: newPreferred }).catch(() => {});
  };

  if (loading || !plan) {
    return (
      <div className="app-shell">
        <div className="dashboard-loading" style={{ flex: 1 }}>
          <span className="spinner" />
          <p>Translating your lessons…</p>
        </div>
      </div>
    );
  }

  const { ageTrack, content, ui, focusAreas, startingUnit, level, displayName,
    preferredLanguage, targetLanguage, translationOk } = plan;

  // Level-aware question bank: words are drawn from the learner's assessed
  // level, prompts are in the LEARNING language and options are meanings in
  // the PREFERRED language. Regenerated per render of the plan, so options
  // shuffle rather than being identical every time.
  const bank = buildQuestions({
    targetLanguage,
    preferredLanguage,
    level,
    count: 10,
  });

  const activeLesson = LESSONS.find((l) => l.id === activeLessonId) || null;

  const persistLessons = (list) => {
    setCompletedLessons(list);
    try {
      localStorage.setItem(`learnly_lessons_${user.username}`, JSON.stringify(list));
    } catch { /* storage unavailable — session-only progress */ }
  };

  const handleVoiceScore = (score) => {
    setBestVoiceScore((prev) => {
      const next = Math.max(prev, score);
      try {
        localStorage.setItem(`learnly_voice_${user.username}`, String(next));
      } catch { /* ignore */ }
      return next;
    });
  };

  const handleLessonComplete = (score, total, wrongPrompts) => {
    const passed = total > 0 && score / total >= 0.75;
    setLessonResult({ lessonId: activeLessonId, score, total, passed });

    setXpTotal(addXp(user.username, score * XP_PER_CORRECT));
    setDailyXp(addDailyXp(user.username, score * XP_PER_CORRECT));

    if (passed && !completedLessons.includes(activeLessonId)) {
      persistLessons([...completedLessons, activeLessonId]);
    }

    submitAssessment({
      unitId: activeLessonId,
      assessmentType: "vocabulary",
      score,
      total,
      weakWords: wrongPrompts,
    })
      .then(() => { refreshLearningPath(); refreshHistory(); refreshLeaderboard(); })
      .catch(() => { /* offline — local progress still recorded */ });

    setActiveLessonId(null);
  };
  const goalDefsByKey = Object.fromEntries(GOAL_DEFS.map((g) => [g.key, g]));
  const dailyGoalPercent = Math.min(100, Math.round((dailyXp / (ageTrack.dailyXP || 20)) * 100));

  const startCertTest = () => {
    setCertResult(null);
    setCertActive(true);
  };

  const handleCertComplete = (score, total, ranOutOfHearts, wrongPrompts = []) => {
    setCertActive(false);
    setCertResult({ score, total, passed: !ranOutOfHearts && isPassing(score, total) });
    setXpTotal(addXp(user.username, score * XP_PER_CORRECT));
    setDailyXp(addDailyXp(user.username, score * XP_PER_CORRECT));

    submitAssessment({
      assessmentType: "reading",
      score,
      total,
      weakWords: wrongPrompts,
    })
      .then(() => { refreshLearningPath(); refreshHistory(); refreshLeaderboard(); })
      .catch(() => { /* offline or backend unavailable — local progress still works */ });
  };

  const handleAskAi = async (e) => {
    e.preventDefault();
    if (!helpQuestion.trim()) return;

    setHelpLoading(true);
    setHelpError("");
    setHelpAnswer(null);

    try {
      const { aiEnabled, answer } = await askAiHelp(helpQuestion.trim());
      if (!aiEnabled) setHelpError(ui.aiHelpUnavailable);
      else if (answer) setHelpAnswer(answer);
      else setHelpError(ui.aiHelpError);
    } catch {
      setHelpError(ui.aiHelpError);
    } finally {
      setHelpLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        displayName={displayName}
        targetLanguage={targetLanguage}
        ui={ui}
        onLogout={onLogout}
        onEnterAdmin={onEnterAdmin}
      />

      <div className="app-main">
        <TopBar
          targetLanguage={targetLanguage}
          preferredLanguage={preferredLanguage}
          onChangeTarget={handleChangeTarget}
          onChangePreferred={handleChangePreferred}
          streak={streak}
          xpTotal={xpTotal}
          unitsCompleted={completedUnits.length}
          dailyGoalPercent={dailyGoalPercent}
          ui={ui}
          switching={switching}
        />

        <main className="app-content">
          {!translationOk && preferredLanguage !== "English" && (
            <div className="translation-warning">⚠️ {ui.translationWarning}</div>
          )}

          {activeTab === "path" && (
            <>
              <section className="dashboard-hero">
                <div className="dashboard-hero-text">
                  <span className="dashboard-eyebrow">{(ui.personalizedPlanEyebrow || "").toUpperCase()}</span>
                  <h1>{ui.greeting}, {displayName}!</h1>
                  <p>
                    {ui.learningIntro} <strong>{targetLanguage}</strong>, {ui.explainedThrough}{" "}
                    <strong>{preferredLanguage}</strong> — {ui.comfortableLanguageNote}{" "}
                    {ui.assessmentIntro} <strong>{ui.unitLabel} {startingUnit}</strong> ({level}).
                  </p>
                </div>
                <div className="dashboard-hero-badge">🦉</div>
              </section>

              <section className="ai-companion-box">
                <div className="ai-companion-icon">🌱</div>
                <div>
                  <div className="ai-companion-head">
                    <strong>{ui.aiCompanionTitle}</strong>
                    {learningPath?.aiLesson && <span className="ai-badge">{ui.aiGeneratedBadge}</span>}
                  </div>
                  {pathLoading ? (
                    <p>…</p>
                  ) : learningPath?.aiLesson ? (
                    <p>{learningPath.aiLesson.explanation}</p>
                  ) : (
                    <p>{ui.aiPathFallback}</p>
                  )}
                </div>
              </section>

              <div className="focus-tags" style={{ margin: "0.9rem 0" }}>
                {focusAreas.map((goalKey) => {
                  const goal = goalDefsByKey[goalKey];
                  const label = goal ? `${goal.emoji} ${ui[goal.stringKey]}` : goalKey;
                  return <span className="tag" key={goalKey}>{label}</span>;
                })}
              </div>

              {activeLesson ? (
                <Lesson
                  lesson={activeLesson}
                  targetLanguage={targetLanguage}
                  preferredLanguage={preferredLanguage}
                  ui={ui}
                  onComplete={handleLessonComplete}
                  onBack={() => setActiveLessonId(null)}
                />
              ) : (
                <div className="path-list">
                  {LESSONS.map((lsn, idx) => {
                    const isCompleted = completedLessons.includes(lsn.id);
                    const isLocked = idx > 0 && !completedLessons.includes(LESSONS[idx - 1].id);
                    const levelKey =
                      lsn.level === "Beginner" ? "levelBeginner"
                      : lsn.level === "Intermediate" ? "levelIntermediate"
                      : "levelAdvanced";

                    return (
                      <div className="stage-block" key={lsn.id}>
                        <button
                          type="button"
                          className={`stage-banner ${isLocked ? "locked" : ""} ${isCompleted ? "done" : ""}`}
                          onClick={() => !isLocked && setActiveLessonId(lsn.id)}
                          disabled={isLocked}
                        >
                          <div>
                            <h3>{lsn.icon} {ui[lsn.titleKey]}</h3>
                            <p>{isLocked ? ui.lessonLockedNote : ui.pathIntro}</p>
                          </div>
                          <span className="stage-pill">{ui[levelKey]}</span>
                        </button>

                        <div className="stage-node-row">
                          <div className={`stage-node ${isCompleted ? "done" : ""} ${isLocked ? "locked" : ""}`}>
                            {isLocked ? "\u{1F512}" : isCompleted ? "\u2713" : "\u25B6"}
                          </div>
                        </div>

                        {lessonResult?.lessonId === lsn.id && (
                          <p className={`mic-feedback ${lessonResult.passed ? "good" : "bad"}`}>
                            {lessonResult.score}/{lessonResult.total} — {lessonResult.passed ? ui.greatJob : ui.keepPracticing}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === "assessment" && (
            <>
            <LearningGames bank={bank} ui={ui} targetLanguage={targetLanguage} />

            <section className="plan-card">
              <h2>🧩 {ui.practiceTabLabel}</h2>
              <p className="plan-note">{ui.skillsSubtitle}</p>
              <div className="unit-word-grid">
                {bank.slice(0, 6).map((q, i) => (
                  <WordChip key={i} word={q.prompt} targetLanguage={targetLanguage} ui={ui} />
                ))}
              </div>
              <ListeningCheck words={bank} targetLanguage={targetLanguage} ui={ui} />
              <WritingCheck words={bank} ui={ui} />
            </section>
            <section className="plan-card">
              <h2>🏅 {ui.certificationTitle}</h2>
              <p className="plan-note">{ui.certificationSubtitle}</p>
              <p className="plan-note"><strong>{ui.passingCriteria}</strong></p>

              {!certActive && !certResult && (
                <button className="primary-button" onClick={startCertTest}>{ui.startTestBtn} →</button>
              )}

              {certActive && (
                <QuizRunner questions={bank} ui={ui} targetLanguage={targetLanguage} onComplete={handleCertComplete} />
              )}

              {certResult && !certActive && (
                <>
                  <div className="quiz-result">
                    <span className="level-badge">{ui.yourScoreLabel}: {certResult.score} / {certResult.total}</span>
                    <p>{certResult.passed ? ui.certificatePassed : ui.certificateFailed}</p>
                    <div className="xp-banner">
                      <div><strong>+{certResult.score * XP_PER_CORRECT} XP</strong><small>{ui.xpEarnedLabel}</small></div>
                      <div><strong>{scoreToLevel(certResult.score, certResult.total)}</strong><small>{ui.newLevelLabel}</small></div>
                    </div>
                    <button className="back-button" style={{ marginTop: "1rem", width: "100%" }} onClick={startCertTest}>
                      {ui.retakeTestBtn}
                    </button>
                  </div>

                  {certResult.passed && (
                    <div className="certificate-card">
                      <h3>🏅 {ui.certificateHeading}</h3>
                      <p>{ui.certificateIntro}</p>
                      <p className="certificate-name">{displayName}</p>
                      <p className="certificate-meta">
                        {ui.certificateBody} <strong>{targetLanguage}</strong> {ui.certificateCourseWord}{" "}
                        {ui.certificateScoreLabel} <strong>{Math.round((certResult.score / certResult.total) * 100)}%</strong>.
                        <br />
                        {ui.certificateDateLabel}: {new Date().toLocaleDateString()}
                      </p>
                      <button className="primary-button" style={{ marginTop: "1rem" }} onClick={() => window.print()}>
                        {ui.certificatePrintBtn}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
            </>
          )}

          {activeTab === "voice" && (
            <VoiceStudio
              targetLanguage={targetLanguage}
              preferredLanguage={preferredLanguage}
              level={level}
              ui={ui}
              onScore={handleVoiceScore}
            />
          )}

          {activeTab === "leaderboard" && (
            <section className="plan-card">
              <h2>🏆 {ui.leaderboardTitle}</h2>
              <p className="plan-note">{ui.leaderboardSubtitle}</p>

              {leaderboardLoading ? (
                <p className="plan-note">…</p>
              ) : leaderboard?.leaderboard?.length ? (
                <div className="review-list">
                  {leaderboard.leaderboard.map((entry) => (
                    <div className="review-row" key={entry.username}>
                      <div className="review-row-main">
                        <strong>#{entry.rank} {entry.username === user.username ? ui.leaderboardYou : entry.name}</strong>
                        <span className="review-date">{entry.proficiencyLevel}</span>
                      </div>
                      <div className="review-row-score"><span>{entry.xpTotal} XP</span></div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="plan-note">{ui.leaderboardEmpty}</p>
              )}
            </section>
          )}

          {activeTab === "progress" && (
            <>
              <section className="plan-card">
                <h2>📊 {ui.reviewTitle}</h2>
                <p className="plan-note">{ui.reviewSubtitle}</p>

                {historyLoading ? (
                  <p className="plan-note">…</p>
                ) : history?.history?.length ? (
                  <div className="review-list">
                    {history.history.map((entry, i) => (
                      <div className="review-row" key={i}>
                        <div className="review-row-main">
                          <strong>{entry.unitId ? `${ui.reviewUnitLabel} ${entry.unitId}` : ui.reviewCertLabel}</strong>
                          <span className="review-date">{new Date(entry.date).toLocaleDateString()}</span>
                        </div>
                        <div className="review-row-score">
                          <span>{entry.score}/{entry.total} ({entry.percent}%)</span>
                          <span className={`review-badge ${entry.passed ? "pass" : "fail"}`}>
                            {entry.passed ? ui.reviewPassBadge : ui.reviewFailBadge}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="plan-note">{ui.reviewEmpty}</p>
                )}

                <button className="back-button" style={{ marginTop: "0.8rem" }} onClick={refreshHistory}>
                  {ui.reviewRefreshBtn}
                </button>
              </section>

              <section className="plan-card">
                <h2>🤖 {ui.aiHelpTitle}</h2>
                <p className="plan-note">{ui.aiHelpSubtitle}</p>
                <form onSubmit={handleAskAi} className="ai-help-form">
                  <input
                    type="text"
                    value={helpQuestion}
                    onChange={(e) => setHelpQuestion(e.target.value)}
                    placeholder={ui.aiHelpPlaceholder}
                  />
                  <button type="submit" className="primary-button" disabled={helpLoading || !helpQuestion.trim()}>
                    {helpLoading ? ui.aiHelpThinking : ui.aiHelpBtn}
                  </button>
                </form>
                {helpAnswer && <div className="mini-check"><p className="plan-note">{helpAnswer}</p></div>}
                {helpError && <div className="error-message" style={{ marginTop: "0.6rem" }}>⚠️ {helpError}</div>}
              </section>
            </>
          )}

          {activeTab === "profile" && (
            <ProfilePanel
              ui={ui}
              displayName={displayName}
              age={user.age}
              targetLanguage={targetLanguage}
              preferredLanguage={preferredLanguage}
              level={level}
              streak={streak}
              xpTotal={xpTotal}
              lessonsCompleted={completedLessons.length}
              history={history?.history || []}
              bestVoiceScore={bestVoiceScore}
              isCertified={!!certResult?.passed}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

// src/Lesson.jsx
//
// A single lesson, in two phases:
//   1. TEACH  — step through each word: see it, hear it, read its meaning
//               in the preferred language, optionally say it back.
//   2. TEST   — multiple-choice on exactly the words just taught.
//
// This is the "teach before you test" flow: the learner never meets a word
// in a test they weren't shown first.

import { useState } from "react";
import {
  speak,
  isSpeechSupported,
  listenOnce,
  isRecognitionSupported,
  isCloseMatch,
} from "./pronounce";
import { getWord, getMeaning, buildQuestions } from "./content/vocabulary";

function TeachPhase({ lesson, targetLanguage, preferredLanguage, ui, onDone, onBack }) {
  const [pos, setPos] = useState(0);
  const [micState, setMicState] = useState("idle");
  const [voiceMissing, setVoiceMissing] = useState(false);

  const idx = lesson.wordIndexes[pos];
  const word = getWord(targetLanguage, idx);
  const meaning = getMeaning(preferredLanguage, idx);
  const isLast = pos === lesson.wordIndexes.length - 1;

  const listen = async () => {
    setVoiceMissing(false);
    const ok = await speak(word, targetLanguage);
    if (!ok) setVoiceMissing(true);
  };

  const sayBack = () => {
    setMicState("listening");
    listenOnce(targetLanguage, {
      onResult: (t) => setMicState(isCloseMatch(t, word) ? "good" : "bad"),
      onError: () => setMicState("idle"),
    });
  };

  const advance = () => {
    setMicState("idle");
    setVoiceMissing(false);
    if (isLast) onDone();
    else setPos(pos + 1);
  };

  return (
    <div className="lesson-stage">
      <p className="plan-note">{ui.lessonTeachIntro}</p>
      <div className="lesson-progress-track">
        <div
          className="lesson-progress-fill"
          style={{ width: `${((pos + 1) / lesson.wordIndexes.length) * 100}%` }}
        />
      </div>
      <p className="voice-counter">
        {ui.lessonWordOf} {pos + 1} / {lesson.wordIndexes.length}
      </p>

      <div className="lesson-word-card">
        <h3 className="voice-target">{word}</h3>
        <p className="voice-meaning">{ui.meaningLabel}: {meaning}</p>

        <div className="voice-controls">
          {isSpeechSupported() && (
            <button type="button" className="voice-btn listen" onClick={listen}>
              🔊 {ui.listenBtn}
            </button>
          )}
          {isRecognitionSupported() && (
            <button
              type="button"
              className={`voice-btn mic ${micState === "listening" ? "listening" : ""}`}
              onClick={sayBack}
            >
              🎤 {micState === "listening" ? ui.micListening : ui.speakBtn}
            </button>
          )}
        </div>

        {voiceMissing && <p className="voice-note bad">{ui.noVoiceNote}</p>}
        {micState === "good" && <div className="voice-verdict good">✅ {ui.micWellDone}</div>}
        {micState === "bad" && <div className="voice-verdict bad">↻ {ui.micTryAgain}</div>}
      </div>

      <div className="voice-actions">
        <button className="back-button" onClick={onBack}>← {ui.backToPathBtn}</button>
        <button className="primary-button" onClick={advance}>
          {isLast ? ui.beginTestBtn : ui.nextBtn} →
        </button>
      </div>
    </div>
  );
}

function TestPhase({ lesson, targetLanguage, preferredLanguage, ui, onComplete, onBack }) {
  const [questions] = useState(() =>
    buildQuestions({
      targetLanguage,
      preferredLanguage,
      indexes: lesson.wordIndexes,
    })
  );

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [wrong, setWrong] = useState([]);

  const current = questions[index];

  const choose = (i) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === current.correct;
    const nextScore = score + (ok ? 1 : 0);
    const nextWrong = ok ? wrong : [...wrong, current.prompt];

    setTimeout(() => {
      setPicked(null);
      setScore(nextScore);
      setWrong(nextWrong);
      if (index + 1 < questions.length) setIndex(index + 1);
      else onComplete(nextScore, questions.length, nextWrong);
    }, 700);
  };

  return (
    <div className="lesson-stage">
      <div className="game-topline">
        <span>{ui.questionLabel} {index + 1} {ui.ofLabel} {questions.length}</span>
        <span className="game-score-pill">{ui.scoreLabel}: {score}</span>
      </div>
      <div className="game-progress-track">
        <div className="game-progress-fill" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>

      <div className="game-prompt">
        <h3>
          {ui.whatIsLabel} <span className="game-target-word">{current.prompt}</span>?
          {isSpeechSupported() && (
            <button
              type="button"
              className="icon-btn"
              title={ui.listenBtn}
              onClick={() => speak(current.prompt, targetLanguage)}
            >
              🔊
            </button>
          )}
        </h3>
      </div>

      <div className="game-options">
        {current.options.map((opt, i) => {
          let cls = "game-option";
          if (picked !== null) {
            if (i === current.correct) cls += " correct";
            else if (i === picked) cls += " wrong";
          }
          return (
            <button key={i} className={cls} onClick={() => choose(i)} disabled={picked !== null}>
              {opt}
            </button>
          );
        })}
      </div>

      <button className="back-button game-close" onClick={onBack}>← {ui.backToPathBtn}</button>
    </div>
  );
}

function Lesson({ lesson, targetLanguage, preferredLanguage, ui, onComplete, onBack }) {
  const [phase, setPhase] = useState("teach");

  return (
    <section className="plan-card">
      <h2>{lesson.icon} {ui[lesson.titleKey]}</h2>

      <div className="lesson-phase-tabs">
        <span className={`lesson-phase ${phase === "teach" ? "active" : ""}`}>{ui.learnTabLabel}</span>
        <span className="lesson-phase-arrow">→</span>
        <span className={`lesson-phase ${phase === "test" ? "active" : ""}`}>{ui.testTabLabel}</span>
      </div>

      {phase === "teach" ? (
        <TeachPhase
          lesson={lesson}
          targetLanguage={targetLanguage}
          preferredLanguage={preferredLanguage}
          ui={ui}
          onDone={() => setPhase("test")}
          onBack={onBack}
        />
      ) : (
        <TestPhase
          lesson={lesson}
          targetLanguage={targetLanguage}
          preferredLanguage={preferredLanguage}
          ui={ui}
          onComplete={onComplete}
          onBack={onBack}
        />
      )}
    </section>
  );
}

export default Lesson;

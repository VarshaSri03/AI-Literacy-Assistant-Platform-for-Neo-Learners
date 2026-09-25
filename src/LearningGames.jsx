// src/LearningGames.jsx
//
// Four practice games, matching the "Learning Games" row in the reference
// design. All surrounding UI text comes from `ui` (the learner's
// PREFERRED language); the vocabulary being practised stays in the
// LEARNING language, with its meaning shown in the preferred language.
//
// These are practice-only: they don't consume hearts and don't submit to
// /api/assessment, so they can be replayed freely without affecting the
// learner's certification record.

import { useState, useEffect, useMemo } from "react";
import { speak, isSpeechSupported } from "./pronounce";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Game 1 & 4 share a multiple-choice engine; game 4 adds audio-first prompting. */
function ChoiceGame({ questions, ui, targetLanguage, audioMode, onClose }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [done, setDone] = useState(false);

  const current = questions[index];

  // In audio mode, play the word automatically when the question changes.
  useEffect(() => {
    if (audioMode && current && isSpeechSupported()) {
      speak(current.prompt, targetLanguage);
    }
  }, [index, audioMode, current, targetLanguage]);

  const choose = (i) => {
    if (picked !== null) return;
    setPicked(i);
    const isCorrect = i === current.correct;
    if (isCorrect) setScore((s) => s + 1);

    setTimeout(() => {
      setPicked(null);
      if (index + 1 < questions.length) setIndex(index + 1);
      else setDone(true);
    }, 900);
  };

  const restart = () => {
    setIndex(0); setScore(0); setPicked(null); setDone(false);
  };

  if (done) {
    return (
      <div className="game-panel">
        <h3>{ui.gameCompleteTitle}</h3>
        <p className="game-score-big">{score} / {questions.length}</p>
        <div className="game-actions">
          <button className="primary-button" onClick={restart}>{ui.playAgainBtn}</button>
          <button className="back-button" onClick={onClose}>{ui.closeGameBtn}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <div className="game-topline">
        <span>{ui.questionLabel} {index + 1} {ui.ofLabel} {questions.length}</span>
        <span className="game-score-pill">{ui.scoreLabel}: {score}</span>
      </div>
      <div className="game-progress-track">
        <div className="game-progress-fill" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>

      <div className="game-prompt">
        {audioMode ? (
          <>
            <p className="game-prompt-hint">{ui.tapToListenLabel}</p>
            {isSpeechSupported() && (
              <button
                type="button"
                className="game-audio-btn"
                onClick={() => speak(current.prompt, targetLanguage)}
              >
                🔊
              </button>
            )}
          </>
        ) : (
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
        )}
      </div>

      {picked !== null && (
        <div className={`game-feedback ${picked === current.correct ? "good" : "bad"}`}>
          {picked === current.correct ? `✅ ${ui.correctFeedback}` : `❌ ${ui.incorrectFeedback}`}
        </div>
      )}

      <div className="game-options">
        {current.options.map((opt, i) => {
          let cls = "game-option";
          if (picked !== null) {
            if (i === current.correct) cls += " correct";
            else if (i === picked) cls += " wrong";
          }
          return (
            <button key={i} type="button" className={cls} onClick={() => choose(i)} disabled={picked !== null}>
              {opt}
            </button>
          );
        })}
      </div>

      <button className="back-button game-close" onClick={onClose}>{ui.closeGameBtn}</button>
    </div>
  );
}

/** Game 2: unscramble the letters of a target-language word. */
function ScrambleGame({ questions, ui, targetLanguage, onClose }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null);
  const [done, setDone] = useState(false);

  const current = questions[index];
  // Array.from handles multi-byte Indic characters correctly (split("")
  // would break combining marks apart).
  const scrambled = useMemo(
    () => (current ? shuffle(Array.from(current.prompt)).join(" ") : ""),
    [current]
  );

  const submit = () => {
    if (result !== null) return;
    const ok = value.trim() === current.prompt;
    setResult(ok);
    if (ok) setScore((s) => s + 1);
  };

  const next = () => {
    setValue(""); setResult(null);
    if (index + 1 < questions.length) setIndex(index + 1);
    else setDone(true);
  };

  const restart = () => {
    setIndex(0); setScore(0); setValue(""); setResult(null); setDone(false);
  };

  if (done) {
    return (
      <div className="game-panel">
        <h3>{ui.gameCompleteTitle}</h3>
        <p className="game-score-big">{score} / {questions.length}</p>
        <div className="game-actions">
          <button className="primary-button" onClick={restart}>{ui.playAgainBtn}</button>
          <button className="back-button" onClick={onClose}>{ui.closeGameBtn}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-panel">
      <div className="game-topline">
        <span>{ui.questionLabel} {index + 1} {ui.ofLabel} {questions.length}</span>
        <span className="game-score-pill">{ui.scoreLabel}: {score}</span>
      </div>

      <div className="game-prompt">
        <p className="game-prompt-hint">{ui.unscrambleLabel}</p>
        <h3 className="game-scrambled">{scrambled}</h3>
        <p className="game-prompt-hint">
          {ui.meaningLabel}: {current.options[current.correct]}
        </p>
      </div>

      <div className="game-answer-row">
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setResult(null); }}
          placeholder={ui.yourAnswerPlaceholder}
          disabled={result !== null}
        />
        {result === null ? (
          <button className="primary-button" onClick={submit} disabled={!value.trim()}>
            {ui.submitBtn}
          </button>
        ) : (
          <button className="primary-button" onClick={next}>{ui.nextBtn}</button>
        )}
      </div>

      {result === true && <div className="game-feedback good">✅ {ui.correctFeedback}</div>}
      {result === false && (
        <div className="game-feedback bad">
          ❌ {ui.incorrectFeedback} — <strong>{current.prompt}</strong>
        </div>
      )}

      <button className="back-button game-close" onClick={onClose}>{ui.closeGameBtn}</button>
    </div>
  );
}

/** Game 3: memory pairs — match each target word to its meaning. */
function MemoryGame({ questions, ui, targetLanguage, onClose }) {
  const pairs = questions.slice(0, 4);

  const buildDeck = () =>
    shuffle(
      pairs.flatMap((q, i) => [
        { id: `w${i}`, pairId: i, label: q.prompt, isWord: true },
        { id: `m${i}`, pairId: i, label: q.options[q.correct], isWord: false },
      ])
    );

  const [deck, setDeck] = useState(buildDeck);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);

  const flip = (card) => {
    if (flipped.length === 2 || matched.includes(card.pairId)) return;
    if (flipped.find((c) => c.id === card.id)) return;
    if (card.isWord && isSpeechSupported()) speak(card.label, targetLanguage);

    const next = [...flipped, card];
    setFlipped(next);

    if (next.length === 2) {
      const isMatch = next[0].pairId === next[1].pairId && next[0].id !== next[1].id;
      setTimeout(() => {
        if (isMatch) setMatched((m) => [...m, next[0].pairId]);
        setFlipped([]);
      }, 800);
    }
  };

  const restart = () => {
    setDeck(buildDeck()); setFlipped([]); setMatched([]);
  };

  const allFound = matched.length === pairs.length;

  return (
    <div className="game-panel">
      <div className="game-topline">
        <span>{ui.matchesFoundLabel}: {matched.length} / {pairs.length}</span>
      </div>

      {allFound ? (
        <>
          <h3>{ui.gameCompleteTitle}</h3>
          <div className="game-actions">
            <button className="primary-button" onClick={restart}>{ui.playAgainBtn}</button>
            <button className="back-button" onClick={onClose}>{ui.closeGameBtn}</button>
          </div>
        </>
      ) : (
        <>
          <div className="memory-grid">
            {deck.map((card) => {
              const isUp = matched.includes(card.pairId) || flipped.find((c) => c.id === card.id);
              return (
                <button
                  key={card.id}
                  type="button"
                  className={`memory-card ${isUp ? "up" : ""} ${matched.includes(card.pairId) ? "matched" : ""}`}
                  onClick={() => flip(card)}
                >
                  {isUp ? card.label : "?"}
                </button>
              );
            })}
          </div>
          <button className="back-button game-close" onClick={onClose}>{ui.closeGameBtn}</button>
        </>
      )}
    </div>
  );
}

const GAME_DEFS = [
  { id: "match",    icon: "🎯", titleKey: "gameWordMatchTitle", descKey: "gameWordMatchDesc", countKey: "questionsCount", count: 5, accent: "accent-red" },
  { id: "scramble", icon: "🔀", titleKey: "gameScrambleTitle",  descKey: "gameScrambleDesc",  countKey: "questionsCount", count: 5, accent: "accent-blue" },
  { id: "memory",   icon: "🧠", titleKey: "gameMemoryTitle",    descKey: "gameMemoryDesc",    countKey: "roundsCount",    count: 4, accent: "accent-pink" },
  { id: "listen",   icon: "🔊", titleKey: "gameListenTitle",    descKey: "gameListenDesc",    countKey: "questionsCount", count: 5, accent: "accent-teal" },
];

function LearningGames({ bank, ui, targetLanguage }) {
  const [activeGame, setActiveGame] = useState(null);

  // A fresh random slice each time a game starts, so replays differ.
  const [questions, setQuestions] = useState([]);

  const startGame = (gameId) => {
    const count = GAME_DEFS.find((g) => g.id === gameId)?.count || 5;
    setQuestions(shuffle(bank).slice(0, count));
    setActiveGame(gameId);
  };

  const close = () => setActiveGame(null);

  return (
    <section className="plan-card">
      <h2>🎮 {ui.gamesTitle}</h2>
      <p className="plan-note">{ui.gamesSubtitle}</p>

      <div className="games-row">
        {GAME_DEFS.map((g) => (
          <div className={`game-card ${g.accent}`} key={g.id}>
            <div className="game-card-icon">{g.icon}</div>
            <h3>{ui[g.titleKey]}</h3>
            <p>{ui[g.descKey]}</p>
            <span className="game-count-pill">{g.count} {ui[g.countKey]}</span>
            <button className="primary-button" onClick={() => startGame(g.id)}>
              {ui.startGameBtn}
            </button>
          </div>
        ))}
      </div>

      {activeGame === "match" && (
        <ChoiceGame questions={questions} ui={ui} targetLanguage={targetLanguage} onClose={close} />
      )}
      {activeGame === "listen" && (
        <ChoiceGame questions={questions} ui={ui} targetLanguage={targetLanguage} audioMode onClose={close} />
      )}
      {activeGame === "scramble" && (
        <ScrambleGame questions={questions} ui={ui} targetLanguage={targetLanguage} onClose={close} />
      )}
      {activeGame === "memory" && (
        <MemoryGame questions={questions} ui={ui} targetLanguage={targetLanguage} onClose={close} />
      )}
    </section>
  );
}

export default LearningGames;

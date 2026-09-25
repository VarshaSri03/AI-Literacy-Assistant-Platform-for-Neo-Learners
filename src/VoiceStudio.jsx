// src/VoiceStudio.jsx
//
// Pronunciation practice with scoring. Four modes now:
//   Words     — every word in the learner's current level (unchanged)
//   Sentences — graded sentences, spoken aloud and rated 0–100 (unchanged)
//   Numbers   — NEW: counting 1-20 in the target language (content/numbers.js)
//   Letters   — NEW: the target language's alphabet, vowels then consonants
//               (content/letters.js)
//
// Numbers/Letters reuse the exact same speak()/listenOnce()/isCloseMatch()
// pronunciation plumbing as Words — nothing changed in pronounce.js.
//
// Scoring compares the SPEECH-RECOGNITION TRANSCRIPT to the expected text
// (see scoreSpeech in content/sentences.js). That means it measures which
// words the recognizer detected, not accent or tone — the UI says so
// explicitly rather than implying it's judging pronunciation quality.

import { useState } from "react";
import {
  speak,
  isSpeechSupported,
  listenOnce,
  isRecognitionSupported,
  isCloseMatch,
} from "./pronounce";
import { getSentences, scoreSpeech, scoreBand } from "./content/sentences";
import { getWord, getMeaning, indexesForLevel } from "./content/vocabulary";
import { getNumbers } from "./content/numbers";
import { getLetters } from "./content/letters";

const BAND_LABEL_KEY = {
  excellent: "rateExcellent",
  good: "rateGood",
  fair: "rateFair",
  again: "rateAgain",
};

/** One word: hear it, say it, get a pass/retry verdict. */
function WordPractice({ targetLanguage, preferredLanguage, level, ui }) {
  const indexes = indexesForLevel(level);
  const [pos, setPos] = useState(0);
  const [micState, setMicState] = useState("idle");
  const [heard, setHeard] = useState("");
  const [voiceMissing, setVoiceMissing] = useState(false);

  const idx = indexes[pos];
  const word = getWord(targetLanguage, idx);
  const meaning = getMeaning(preferredLanguage, idx);

  const listen = async () => {
    setVoiceMissing(false);
    const ok = await speak(word, targetLanguage);
    if (!ok) setVoiceMissing(true);
  };

  const record = () => {
    setMicState("listening");
    setHeard("");
    listenOnce(targetLanguage, {
      onResult: (t) => {
        setHeard(t);
        setMicState(isCloseMatch(t, word) ? "good" : "bad");
      },
      onError: () => setMicState("idle"),
    });
  };

  const next = () => {
    setPos((p) => (p + 1) % indexes.length);
    setMicState("idle");
    setHeard("");
    setVoiceMissing(false);
  };

  return (
    <div className="voice-stage">
      <p className="voice-counter">{pos + 1} / {indexes.length}</p>
      <h3 className="voice-target">{word}</h3>
      <p className="voice-meaning">{ui.meaningLabel}: {meaning}</p>

      <div className="voice-controls">
        {isSpeechSupported() && (
          <button type="button" className="voice-btn listen" onClick={listen}>
            🔊 {ui.listenBtn}
          </button>
        )}
        {isRecognitionSupported() ? (
          <button
            type="button"
            className={`voice-btn mic ${micState === "listening" ? "listening" : ""}`}
            onClick={record}
            disabled={micState === "listening"}
          >
            🎤 {micState === "listening" ? ui.micListening : ui.speakBtn}
          </button>
        ) : (
          <p className="voice-note">{ui.micNotSupported}</p>
        )}
      </div>

      {voiceMissing && <p className="voice-note bad">{ui.noVoiceNote}</p>}

      {heard && (
        <p className="voice-heard">
          {ui.yourSpeechLabel}: <strong>{heard}</strong>
        </p>
      )}
      {micState === "good" && <div className="voice-verdict good">✅ {ui.micWellDone}</div>}
      {micState === "bad" && <div className="voice-verdict bad">↻ {ui.micTryAgain}</div>}

      <button className="back-button" onClick={next}>{ui.nextBtn} →</button>
    </div>
  );
}

/** One sentence: hear it, read it aloud, get a 0–100 score. */
function SentencePractice({ targetLanguage, preferredLanguage, level, ui, onScore }) {
  const sentences = getSentences({ targetLanguage, preferredLanguage, level });
  const [pos, setPos] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [score, setScore] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [best, setBest] = useState(0);
  const [voiceMissing, setVoiceMissing] = useState(false);

  const current = sentences[pos];

  const listen = async () => {
    setVoiceMissing(false);
    const ok = await speak(current.text, targetLanguage);
    if (!ok) setVoiceMissing(true);
  };

  const record = () => {
    setListening(true);
    setHeard("");
    setScore(null);
    listenOnce(targetLanguage, {
      onResult: (t) => {
        const s = scoreSpeech(t, current.text);
        setHeard(t);
        setScore(s);
        setAttempts((a) => a + 1);
        setBest((b) => {
          const nb = Math.max(b, s);
          if (onScore) onScore(nb);
          return nb;
        });
      },
      onError: () => setListening(false),
      onEnd: () => setListening(false),
    });
  };

  const next = () => {
    setPos((p) => (p + 1) % sentences.length);
    setHeard("");
    setScore(null);
    setVoiceMissing(false);
  };

  const band = score !== null ? scoreBand(score) : null;

  return (
    <div className="voice-stage">
      <p className="voice-counter">{pos + 1} / {sentences.length}</p>
      <h3 className="voice-sentence">{current.text}</h3>
      <p className="voice-meaning">{current.meaning}</p>

      <div className="voice-controls">
        {isSpeechSupported() && (
          <button type="button" className="voice-btn listen" onClick={listen}>
            🔊 {ui.listenBtn}
          </button>
        )}
        {isRecognitionSupported() ? (
          <button
            type="button"
            className={`voice-btn mic ${listening ? "listening" : ""}`}
            onClick={record}
            disabled={listening}
          >
            🎤 {listening ? ui.micListening : ui.speakBtn}
          </button>
        ) : (
          <p className="voice-note">{ui.micNotSupported}</p>
        )}
      </div>

      {voiceMissing && <p className="voice-note bad">{ui.noVoiceNote}</p>}
      {!heard && !listening && <p className="voice-note">{ui.micPermissionNote}</p>}

      {score !== null && (
        <div className={`voice-result band-${band}`}>
          <div className="voice-score-ring">{score}</div>
          <strong>{ui[BAND_LABEL_KEY[band]]}</strong>
          <p className="voice-heard">
            {ui.yourSpeechLabel}: <em>{heard || "—"}</em>
          </p>
          <p className="voice-heard">
            {ui.expectedLabel}: <em>{current.text}</em>
          </p>
        </div>
      )}

      <div className="voice-stats">
        <span>{ui.voiceBestLabel}: <strong>{best}</strong></span>
        <span>{ui.voiceAttemptsLabel}: <strong>{attempts}</strong></span>
      </div>

      <div className="voice-actions">
        {score !== null && (
          <button className="back-button" onClick={record}>{ui.tryAgainBtn}</button>
        )}
        <button className="primary-button" onClick={next}>{ui.nextSentenceBtn} →</button>
      </div>

      <p className="voice-caveat">{ui.voiceScoreCaveat}</p>
    </div>
  );
}

/** NEW: one number: hear it, say it, get a pass/retry verdict. Same shape as WordPractice. */
function NumberPractice({ targetLanguage, ui }) {
  const numbers = getNumbers(targetLanguage);
  const [pos, setPos] = useState(0);
  const [micState, setMicState] = useState("idle");
  const [heard, setHeard] = useState("");
  const [voiceMissing, setVoiceMissing] = useState(false);

  const current = numbers[pos];

  const listen = async () => {
    setVoiceMissing(false);
    const ok = await speak(current.word, targetLanguage);
    if (!ok) setVoiceMissing(true);
  };

  const record = () => {
    setMicState("listening");
    setHeard("");
    listenOnce(targetLanguage, {
      onResult: (t) => {
        setHeard(t);
        setMicState(isCloseMatch(t, current.word) ? "good" : "bad");
      },
      onError: () => setMicState("idle"),
    });
  };

  const next = () => {
    setPos((p) => (p + 1) % numbers.length);
    setMicState("idle");
    setHeard("");
    setVoiceMissing(false);
  };

  return (
    <div className="voice-stage">
      <p className="voice-counter">{pos + 1} / {numbers.length}</p>
      <h3 className="voice-target">{current.value}</h3>
      <p className="voice-meaning">{current.word}</p>

      <div className="voice-controls">
        {isSpeechSupported() && (
          <button type="button" className="voice-btn listen" onClick={listen}>
            🔊 {ui.listenBtn}
          </button>
        )}
        {isRecognitionSupported() ? (
          <button
            type="button"
            className={`voice-btn mic ${micState === "listening" ? "listening" : ""}`}
            onClick={record}
            disabled={micState === "listening"}
          >
            🎤 {micState === "listening" ? ui.micListening : ui.speakBtn}
          </button>
        ) : (
          <p className="voice-note">{ui.micNotSupported}</p>
        )}
      </div>

      {voiceMissing && <p className="voice-note bad">{ui.noVoiceNote}</p>}
      {heard && <p className="voice-heard">{ui.yourSpeechLabel}: <strong>{heard}</strong></p>}
      {micState === "good" && <div className="voice-verdict good">✅ {ui.micWellDone}</div>}
      {micState === "bad" && <div className="voice-verdict bad">↻ {ui.micTryAgain}</div>}

      <button className="back-button" onClick={next}>{ui.nextBtn} →</button>
    </div>
  );
}

/** NEW: one letter (vowel or consonant): hear it, say it. */
function LetterPractice({ targetLanguage, ui }) {
  const { vowels, consonants } = getLetters(targetLanguage);
  const all = [...vowels.map((l) => ({ letter: l, group: "Vowel" })), ...consonants.map((l) => ({ letter: l, group: "Consonant" }))];
  const [pos, setPos] = useState(0);
  const [micState, setMicState] = useState("idle");
  const [heard, setHeard] = useState("");
  const [voiceMissing, setVoiceMissing] = useState(false);

  const current = all[pos];

  const listen = async () => {
    setVoiceMissing(false);
    const ok = await speak(current.letter, targetLanguage);
    if (!ok) setVoiceMissing(true);
  };

  const record = () => {
    setMicState("listening");
    setHeard("");
    listenOnce(targetLanguage, {
      onResult: (t) => {
        setHeard(t);
        setMicState(isCloseMatch(t, current.letter) ? "good" : "bad");
      },
      onError: () => setMicState("idle"),
    });
  };

  const next = () => {
    setPos((p) => (p + 1) % all.length);
    setMicState("idle");
    setHeard("");
    setVoiceMissing(false);
  };

  return (
    <div className="voice-stage">
      <p className="voice-counter">{pos + 1} / {all.length} · {current.group}</p>
      <h3 className="voice-target">{current.letter}</h3>

      <div className="voice-controls">
        {isSpeechSupported() && (
          <button type="button" className="voice-btn listen" onClick={listen}>
            🔊 {ui.listenBtn}
          </button>
        )}
        {isRecognitionSupported() ? (
          <button
            type="button"
            className={`voice-btn mic ${micState === "listening" ? "listening" : ""}`}
            onClick={record}
            disabled={micState === "listening"}
          >
            🎤 {micState === "listening" ? ui.micListening : ui.speakBtn}
          </button>
        ) : (
          <p className="voice-note">{ui.micNotSupported}</p>
        )}
      </div>

      {voiceMissing && <p className="voice-note bad">{ui.noVoiceNote}</p>}
      {heard && <p className="voice-heard">{ui.yourSpeechLabel}: <strong>{heard}</strong></p>}
      {micState === "good" && <div className="voice-verdict good">✅ {ui.micWellDone}</div>}
      {micState === "bad" && <div className="voice-verdict bad">↻ {ui.micTryAgain}</div>}

      <button className="back-button" onClick={next}>{ui.nextBtn} →</button>
    </div>
  );
}

function VoiceStudio({ targetLanguage, preferredLanguage, level, ui, onScore }) {
  const [mode, setMode] = useState("words");

  return (
    <section className="plan-card">
      <h2>🎙️ {ui.voiceStudioTitle}</h2>
      <p className="plan-note">{ui.voiceStudioSubtitle}</p>

      <div className="voice-tabs">
        <button type="button" className={`voice-tab ${mode === "words" ? "active" : ""}`} onClick={() => setMode("words")}>
          {ui.voiceWordsTab}
        </button>
        <button type="button" className={`voice-tab ${mode === "sentences" ? "active" : ""}`} onClick={() => setMode("sentences")}>
          {ui.voiceSentencesTab}
        </button>
        <button type="button" className={`voice-tab ${mode === "numbers" ? "active" : ""}`} onClick={() => setMode("numbers")}>
          {ui.voiceNumbersTab || "🔢 Numbers"}
        </button>
        <button type="button" className={`voice-tab ${mode === "letters" ? "active" : ""}`} onClick={() => setMode("letters")}>
          {ui.voiceLettersTab || "🔤 Letters"}
        </button>
      </div>

      {mode === "words" && (
        <WordPractice targetLanguage={targetLanguage} preferredLanguage={preferredLanguage} level={level} ui={ui} />
      )}
      {mode === "sentences" && (
        <SentencePractice targetLanguage={targetLanguage} preferredLanguage={preferredLanguage} level={level} ui={ui} onScore={onScore} />
      )}
      {mode === "numbers" && (
        <NumberPractice targetLanguage={targetLanguage} ui={ui} />
      )}
      {mode === "letters" && (
        <LetterPractice targetLanguage={targetLanguage} ui={ui} />
      )}
    </section>
  );
}

export default VoiceStudio;

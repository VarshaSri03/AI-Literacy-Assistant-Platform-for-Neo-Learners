// pronounce.js
// Two browser-native speech features — no external APIs, no keys, no cost:
//   1. Text-to-speech (speak): reads a word aloud in the right language.
//   2. Speech-to-text (listenOnce): the learner speaks it back, and we
//      check if it matches.
//
// IMPORTANT — voices are NOT guaranteed to exist for every language.
// speechSynthesis only speaks a language if the OS/browser has a voice
// installed for it. Windows in particular does NOT ship Telugu or
// Kannada voices at all — no language pack fixes this. So speak() now
// works in two tiers:
//   1. Try the device's own installed voice first (instant, free, offline).
//   2. If there isn't one, fall back to server/routes/speech.js, which
//      calls Azure Speech Services (a real cloud voice) — IF the backend
//      has AZURE_SPEECH_KEY/AZURE_SPEECH_REGION configured. If that's not
//      configured either, speak() returns false and the caller shows a
//      "no voice" message, same graceful-degradation pattern as the rest
//      of this app.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

const SPEECH_LOCALES = {
  English: "en-US",
  Hindi: "hi-IN",
  Telugu: "te-IN",
  Tamil: "ta-IN",
  Malayalam: "ml-IN",
  Kannada: "kn-IN",
};

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Voices often load asynchronously — getVoices() can return an empty list
// on the very first call. This caches the result and waits for the
// 'voiceschanged' event (with a timeout fallback for browsers that never
// fire it).
let voicesCache = null;
let voicesPromise = null;

function loadVoices() {
  if (!isSpeechSupported()) return Promise.resolve([]);
  if (voicesCache) return Promise.resolve(voicesCache);
  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing && existing.length > 0) {
      voicesCache = existing;
      resolve(existing);
      return;
    }

    const onVoicesChanged = () => {
      voicesCache = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(voicesCache || []);
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);

    // Some browsers never fire voiceschanged — don't hang forever.
    setTimeout(() => {
      if (!voicesCache) {
        voicesCache = window.speechSynthesis.getVoices();
        resolve(voicesCache || []);
      }
    }, 1000);
  });

  return voicesPromise;
}

function findVoice(voices, locale) {
  if (!voices || !voices.length) return null;
  const exact = voices.find((v) => (v.lang || "").toLowerCase() === locale.toLowerCase());
  if (exact) return exact;
  const langPrefix = locale.split("-")[0].toLowerCase();
  return voices.find((v) => (v.lang || "").toLowerCase().startsWith(langPrefix)) || null;
}

/** Checks (asynchronously) whether THIS DEVICE has a local voice installed for `languageName`. */
export async function hasVoiceFor(languageName) {
  if (!isSpeechSupported()) return false;
  const locale = SPEECH_LOCALES[languageName] || "en-US";
  const voices = await loadVoices();
  return !!findVoice(voices, locale);
}

// Currently-playing cloud audio, so a second click cancels the first.
let cloudAudio = null;

/** Cloud fallback: asks server/routes/speech.js for real audio and plays it. */
async function speakViaCloud(text, languageName) {
  try {
    const res = await fetch(`${API_URL}/api/speech/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language: languageName }),
    });
    if (!res.ok) return false;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    if (cloudAudio) cloudAudio.pause();
    cloudAudio = new Audio(url);
    await cloudAudio.play();
    return true;
  } catch (err) {
    console.warn("Cloud speech playback failed:", err.message);
    return false;
  }
}

/**
 * Speaks `text` in `languageName`. Tries the device's own voice first; if
 * there isn't one, tries the cloud fallback (Azure Speech, if configured
 * server-side). Returns a Promise<boolean> — true if audio actually played
 * by either method, false if neither worked (caller should show a
 * "no voice available" message).
 */
export async function speak(text, languageName) {
  if (!text) return false;

  if (isSpeechSupported()) {
    const locale = SPEECH_LOCALES[languageName] || "en-US";
    const voices = await loadVoices();
    const voice = findVoice(voices, locale);

    if (voice) {
      window.speechSynthesis.cancel(); // stop anything currently playing
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale;
      utterance.rate = 0.9; // slightly slower — easier for learners to follow
      utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
      return true;
    }
  }

  // No local voice for this language — try the cloud fallback.
  return speakViaCloud(text, languageName);
}

function getRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isRecognitionSupported() {
  return !!getRecognitionCtor();
}

/**
 * Listens for a single spoken phrase in `languageName` and reports the
 * transcript. Returns the recognition instance (so callers can `.stop()`
 * it early) or null if the browser doesn't support speech recognition.
 *
 * callbacks: { onResult(transcript), onError(message), onEnd() }
 */
export function listenOnce(languageName, callbacks = {}) {
  const { onResult, onError, onEnd } = callbacks;
  const RecognitionCtor = getRecognitionCtor();

  if (!RecognitionCtor) {
    if (onError) onError("not-supported");
    return null;
  }

  const recognition = new RecognitionCtor();
  recognition.lang = SPEECH_LOCALES[languageName] || "en-US";
  recognition.maxAlternatives = 3;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    if (onResult) onResult(transcript);
  };
  recognition.onerror = (event) => {
    if (onError) onError(event.error || "unknown-error");
  };
  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  try {
    recognition.start();
  } catch {
    if (onError) onError("start-failed");
    return null;
  }

  return recognition;
}

function normalize(text) {
  return (text || "").trim().toLowerCase().normalize("NFC");
}

/** Loose match: exact, or one contains the other (helps with STT noise). */
export function isCloseMatch(spoken, target) {
  const a = normalize(spoken);
  const b = normalize(target);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

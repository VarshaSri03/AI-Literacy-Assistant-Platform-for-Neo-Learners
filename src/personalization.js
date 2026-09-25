// personalization.js
import { getStrings } from "./locales/index.js";

export const LANGUAGE_CODES = {
  English: "en",
  Hindi: "hi",
  Telugu: "te",
  Tamil: "ta",
  Malayalam: "ml",
  Kannada: "kn",
};

const SCRIPT_SAMPLES = {
  Hindi: "अ आ इ ई",
  Telugu: "అ ఆ ఇ ఈ",
  Tamil: "அ ஆ இ ஈ",
  Malayalam: "അ ആ ഇ ഈ",
  Kannada: "ಅ ಆ ಇ ಈ",
  English: "A B C D",
};

export const GOAL_DEFS = [
  { key: "reading", emoji: "📖", stringKey: "goalReading" },
  { key: "writing", emoji: "✍️", stringKey: "goalWriting" },
  { key: "speaking", emoji: "🗣️", stringKey: "goalSpeaking" },
  { key: "listening", emoji: "👂", stringKey: "goalListening" },
  { key: "vocabulary", emoji: "🔤", stringKey: "goalVocabulary" },
  { key: "communication", emoji: "💬", stringKey: "goalCommunication" },
];

// =====================================================================
// LOCAL PERSISTENCE — preferred language, XP, streak, unit progress.
// All keyed to the signed-in username so multiple learners on the same
// browser don't collide. Pure client-side (localStorage); nothing here
// touches MongoDB. See the note at the end of the chat reply for how to
// move this server-side later if you want it to follow the learner
// across devices.
// =====================================================================
const LANG_STORAGE_KEY = "learnly_preferred_language";

export function getSavedPreferredLanguage() {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function savePreferredLanguage(languageName) {
  try {
    if (languageName) localStorage.setItem(LANG_STORAGE_KEY, languageName);
  } catch {
    /* localStorage unavailable — ignore */
  }
}

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

export function getXp(username) {
  return Number(safeGet(`learnly_xp_${username}`)) || 0;
}
export function addXp(username, amount) {
  const total = getXp(username) + amount;
  safeSet(`learnly_xp_${username}`, String(total));
  return total;
}

/** Updates and returns the learner's daily-visit streak. Call once per Dashboard mount. */
export function updateStreak(username) {
  const key = `learnly_streak_${username}`;
  const today = new Date().toDateString();
  let streak = 1;

  const raw = safeGet(key);
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      if (saved.lastVisit === today) {
        streak = saved.streak; // already visited today, no change
      } else {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        streak = saved.lastVisit === yesterday ? saved.streak + 1 : 1;
      }
    } catch {
      streak = 1;
    }
  }

  safeSet(key, JSON.stringify({ streak, lastVisit: today }));
  return streak;
}

/** XP earned TODAY only (resets at midnight) — used for the daily-goal badge. */
export function getDailyXp(username) {
  const key = `learnly_daily_xp_${username}`;
  const today = new Date().toDateString();
  const raw = safeGet(key);
  if (!raw) return 0;
  try {
    const saved = JSON.parse(raw);
    return saved.date === today ? saved.xp : 0;
  } catch {
    return 0;
  }
}
export function addDailyXp(username, amount) {
  const key = `learnly_daily_xp_${username}`;
  const today = new Date().toDateString();
  const current = getDailyXp(username);
  const next = current + amount;
  safeSet(key, JSON.stringify({ date: today, xp: next }));
  return next;
}

export function getCompletedUnits(username) {
  const raw = safeGet(`learnly_units_${username}`);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
export function markUnitCompleted(username, unitId) {
  const completed = getCompletedUnits(username);
  if (!completed.includes(unitId)) {
    completed.push(unitId);
    safeSet(`learnly_units_${username}`, JSON.stringify(completed));
  }
  return completed;
}

// =====================================================================
// UI STRINGS — the single source of truth for every piece of English
// copy on the site. getUiStrings() translates the whole set into the
// learner's preferred language in one batched call.
// =====================================================================
export const SOURCE_UI_STRINGS = {
  continueBtn: "Continue",
  backBtn: "Back",

  // ---- landing navbar ----
  navHome: "Home",
  navHow: "How It Works",
  navLanguages: "Languages",
  navAbout: "About",
  navLogin: "Log In",
  navGetStarted: "Get Started",

  // ---- login page ----
  welcomeBack: "Welcome Back!",
  continueJourney: "Continue your learning journey.",
  usernameOrEmailLabel: "Username or Email",
  usernameOrEmailPlaceholder: "Enter username or email",
  forgotPassword: "Forgot Password?",
  enterPasswordPlaceholder: "Enter password",
  loginBtn: "Login",
  loggingIn: "Logging in…",
  orLabel: "OR",
  dontHaveAccount: "Don't have an account?",
  createAccountLink: "Create Account",
  enterCredentialsError: "Please enter your username and password.",
  invalidCredentialsError: "Invalid username or password.",
  passwordRecoverySoon: "Password recovery page coming soon.",

  // ---- register: step 1 ----
  step1Title: "What language are you comfortable in?",
  step1Subtitle: "We'll use this to explain lessons, instructions and feedback to you.",

  // ---- register: step 2 ----
  step2Title: "What language do you want to learn?",
  step2SubtitlePrefix: "We'll teach this language, explained through",
  comfortableLanguageLabel: "Your comfortable language",

  // ---- register: step 3 ----
  step3Title: "Tell us about yourself",
  step3Subtitle: "Your age helps us set the right pace.",
  fullNameLabel: "Full Name",
  ageLabel: "Age",
  emailLabel: "Email",
  usernameLabel: "Username",
  namePlaceholder: "Enter your name",
  agePlaceholder: "e.g. 34",
  emailPlaceholder: "example@gmail.com",
  usernamePlaceholder: "Create a username",

  // ---- register: step 4 ----
  step4Title: "What do you want to learn?",
  step4Subtitle: "Select everything that interests you.",
  goalReading: "Reading",
  goalWriting: "Writing",
  goalSpeaking: "Speaking",
  goalListening: "Listening",
  goalVocabulary: "Vocabulary",
  goalCommunication: "Communication",

  // ---- register: step 5 — assessment ----
  assessmentTitle: "Quick check-in",
  assessmentSubtitle: "Answer a few questions in",
  explainedNote: "Explained in your comfortable language",
  questionLabel: "Question",
  ofLabel: "of",
  meaningLabel: "Meaning",
  correct: "Correct!",
  incorrect: "Not quite.",
  yourLevelIs: "Your level is",
  correctSuffix: "correct",
  resultNote: "This sets your starting unit — you can always move up or down later.",

  // ---- register: step 6 ----
  step6Title: "Secure your account",
  step6Subtitle: "Create your login credentials.",
  passwordLabel: "Password",
  confirmPasswordLabel: "Confirm Password",
  passwordPlaceholder: "Create password",
  confirmPasswordPlaceholder: "Confirm password",
  googleContinue: "Continue with Google",
  termsText: "By creating an account, you agree to our Terms & Privacy Policy.",
  creatingAccount: "Creating account…",
  createAccountBtn: "Create Account",

  // ---- register: validation errors ----
  errSelectPreferred: "Please select the language you're most comfortable in.",
  errSelectTarget: "Please select the language you want to learn.",
  errSameLanguage: "Pick a different language to learn from your comfortable language.",
  errFillRequired: "Please fill in all required fields, including your age.",
  errInvalidAge: "Please enter a valid age between 5 and 100.",
  errSelectGoal: "Please select at least one learning goal.",
  errFinishAssessment: "Please finish the quick assessment to continue.",
  errPasswordLength: "Password must contain at least 6 characters.",
  errPasswordMismatch: "Passwords do not match.",
  errRegistrationFailed: "Registration failed. Please try again.",

  alreadyHaveAccount: "Already have an account?",
  loginLinkBtn: "Login",
  stepLabel: "Step",

  // ---- dashboard: header / hero ----
  hiGreeting: "Hi",
  logoutBtn: "Log out",
  personalizedPlanEyebrow: "Your personalized plan",
  greeting: "Hello",
  learningIntro: "You're learning",
  explainedThrough: "explained through",
  comfortableLanguageNote: "the language you're already comfortable in.",
  assessmentIntro: "Based on your quick assessment, you're starting at",
  unitLabel: "Unit",
  recommendedPace: "Recommended pace",
  dailyGoal: "Daily goal",
  levelLabel: "Your level",
  toStart: "to start",
  streakLabel: "Day streak",
  totalXpLabel: "Total XP",

  // ---- dashboard: today's lesson ----
  todaysLessonTitle: "Today's first lesson",
  meaningOfFirstWord: "book",
  explainedInComfortLang: "Explained in your comfortable language",
  startLessonBtn: "Start Lesson",
  startingUnitAlert: "Starting Unit",
  focusAreasTitle: "Your focus areas",
  focusAreasNote: "Picked during sign-up — every unit leans into these.",

  // ---- dashboard: pronunciation (audio + mic) ----
  listenBtn: "Listen",
  speakBtn: "Speak",
  micListening: "Listening…",
  micNotSupported: "Speech recognition isn't supported in this browser.",
  micWellDone: "🎉 That sounded right!",
  micTryAgain: "Not quite — tap Listen, then try again.",
  ttsNotSupported: "Audio isn't supported in this browser.",

  // ---- dashboard: course / units ----
  courseTitle: "Your course",
  courseSubtitle: "Complete each unit's test to unlock the next one.",
  unit1Title: "Unit 1 · Everyday words",
  unit2Title: "Unit 2 · People & places",
  unit3Title: "Unit 3 · Sky & school",
  unit4Title: "Unit 4 · Review",
  lockedNote: "Complete the previous unit to unlock",
  unitTestBtn: "Take Unit Test",
  unitCompleteBadge: "Completed",
  retakeBtn: "Retake",

  // ---- dashboard: quiz (shared engine) ----
  heartsLabel: "Hearts",
  outOfHearts: "Out of hearts — take a breath and try again!",
  yourScoreLabel: "Your score",
  xpEarnedLabel: "XP earned",
  greatJob: "Great job!",
  keepPracticing: "Keep practicing — you'll get there!",
  newLevelLabel: "Updated level",
  retakeTestBtn: "Retake Test",
  startTestBtn: "Start Test",

  // ---- dashboard: reading / writing / listening mini-checks ----
  listeningCheckTitle: "Listening check",
  writingCheckTitle: "Writing check",
  writingPlaceholder: "Type the meaning in your language",
  checkBtn: "Check",

  // ---- dashboard: AI-based personalized learning engine ----
  aiPathTitle: "Your recommended next step",
  aiPathSubtitle: "Based on your quiz results so far.",
  predictedLevelLabel: "Predicted level",
  recommendedUnitLabel: "Recommended next unit",
  weakWordsLabel: "Words to review",
  aiPathFallback: "Take a unit test to get a personalized recommendation here.",
  aiGeneratedBadge: "AI",

  // ---- dashboard: results review ----
  reviewTitle: "Results review",
  reviewSubtitle: "Every test you've taken, with pass/fail against the 75% benchmark.",
  reviewEmpty: "No tests taken yet — your results will show up here.",
  reviewPassBadge: "Pass",
  reviewFailBadge: "Not yet",
  reviewUnitLabel: "Unit",
  reviewCertLabel: "Certification",
  reviewRefreshBtn: "Refresh",

  // ---- dashboard: ask AI for help ----
  aiHelpTitle: "Ask AI for help",
  aiHelpSubtitle: "Stuck on a word, a rule, or how to say something? Ask here.",
  aiHelpPlaceholder: "e.g. How do I say \"thank you\"?",
  aiHelpBtn: "Ask",
  aiHelpThinking: "Thinking…",
  aiHelpUnavailable: "AI help isn't turned on yet for this app — ask the site owner to add an API key.",
  aiHelpError: "Something went wrong — please try again.",

  // ---- app shell: sidebar ----
  navPath: "Learning Path",
  navDashboard: "Dashboard",
  navLeaderboard: "Leaderboard",
  navAssessment: "Assessment",
  navVoiceStudio: "Voice Studio",
  navProgress: "Progress Feed",
  navProfile: "Profile",
  navLogout: "Log Out",

  // ---- app shell: top bar ----
  targetLabel: "Learning",
  bridgeLabel: "Explained via",
  dailyGoalLabel: "Goal",
  unitsBadgeLabel: "Units",

  // ---- translation health warning ----
  translationWarning: "Translation service is unavailable right now, so some text is showing in English. This usually means the Azure Translator key isn't set in server/.env.",

  // ---- learning path tab ----
  pathIntro: "Tap a stage to practice its words or take its test.",
  stageLabel: "Stage",
  aiCompanionTitle: "Lingo AI Companion",
  aiCompanionBadge: "Guide",

  // ---- voice studio tab ----
  voiceStudioTitle: "Voice Studio",
  voiceStudioSubtitle: "Practice listening and pronunciation for every word in your course.",
  noVoiceNote: "No voice installed for this language on this device — you may need to add a language pack in your OS settings.",

  // ---- leaderboard tab ----
  leaderboardTitle: "Leaderboard",
  leaderboardSubtitle: "Top learners by total XP.",
  leaderboardYou: "You",
  leaderboardEmpty: "No learners yet — be the first to earn XP!",

  // ---- profile tab ----
  profileTitle: "Profile",
  profileNameLabel: "Name",
  profileAgeLabel: "Age",
  profileTargetLabel: "Learning",
  profileBridgeLabel: "Explained via",
  profileLevelLabel: "Level",
  profileSaveBtn: "Save changes",
  profileSaved: "Saved!",
  profileSaveError: "Couldn't save — please try again.",

  // ---- dashboard: certification ----
  certificationTitle: "Certification test",
  certificationSubtitle: "Score at least 75% across 10 questions to get certified.",
  passingCriteria: "Passing score: 75%",
  certificatePassed: "Congratulations — you passed!",
  certificateFailed: "Almost there — you need 75% to pass. Try again!",
  certificateHeading: "Certificate of Completion",
  certificateIntro: "This certifies that",
  certificateBody: "has successfully completed the",
  certificateCourseWord: "course",
  certificateScoreLabel: "with a score of",
  certificateDateLabel: "Date",
  certificatePrintBtn: "Print / Save Certificate",
};

/**
 * UI strings for a language — now read from the STATIC bundled
 * dictionaries in src/locales/ instead of a live translation API.
 * Instant, offline, no API key, and English-fallback per key so nothing
 * can render as `undefined`.
 *
 * Still declared `async` so every existing caller (Dashboard.jsx,
 * Register.jsx, Login.jsx, LandingPage.jsx) keeps working unchanged.
 */
export async function getUiStrings(languageName) {
  return getStrings(languageName);
}

// The learner's first vocabulary word per LEARNING language. This is
// learning CONTENT, not UI text — it stays in the target language and is
// deliberately independent of the UI language.
const FIRST_WORDS = {
  English: "book",
  Hindi: "किताब",
  Telugu: "పుస్తకం",
  Tamil: "புத்தகம்",
  Malayalam: "പുസ്തകം",
  Kannada: "ಪುಸ್ತಕ",
};

export async function getLessonContent(languageName) {
  return {
    script: SCRIPT_SAMPLES[languageName] || "…",
    firstWord: FIRST_WORDS[languageName] || FIRST_WORDS.English,
  };
}

// =====================================================================
// VOCABULARY / ASSESSMENT BANK — 10 words per language, in a FIXED,
// aligned order across every language (same index = same word meaning).
// COURSE_UNITS below slices this same array into unit-sized chunks, so
// unit vocabulary and the certification test always stay in sync.
//   0 book   1 water   2 friend   3 house   4 teacher
//   5 food   6 sun     7 moon     8 school  9 family
// =====================================================================
export const ASSESSMENT_QUESTIONS = {
  English: [
    { prompt: "book", options: ["a fruit", "a set of pages with writing", "a type of shoe", "a color"], correct: 1 },
    { prompt: "water", options: ["a liquid we drink", "a kind of stone", "a musical instrument", "a season"], correct: 0 },
    { prompt: "friend", options: ["a type of food", "someone you like and trust", "a number", "a place"], correct: 1 },
    { prompt: "house", options: ["a place where you live", "a fruit", "a color", "a season"], correct: 0 },
    { prompt: "teacher", options: ["someone who teaches", "a type of animal", "a fruit", "a river"], correct: 0 },
    { prompt: "food", options: ["something you eat", "a musical instrument", "a color", "a type of shoe"], correct: 0 },
    { prompt: "sun", options: ["the star that lights our day", "a night light", "a kind of tree", "a bird"], correct: 0 },
    { prompt: "moon", options: ["Earth's natural satellite", "a type of fruit", "a river", "a musical note"], correct: 0 },
    { prompt: "school", options: ["a place where you learn", "a place where you sleep", "a type of food", "a season"], correct: 0 },
    { prompt: "family", options: ["your parents, siblings and relatives", "a type of job", "a season", "a color"], correct: 0 },
  ],
  Hindi: [
    { prompt: "आम", options: ["a mango", "a book", "a chair", "a river"], correct: 0 },
    { prompt: "पानी", options: ["fire", "water", "air", "earth"], correct: 1 },
    { prompt: "दोस्त", options: ["enemy", "stranger", "friend", "teacher"], correct: 2 },
    { prompt: "घर", options: ["house", "sky", "food", "book"], correct: 0 },
    { prompt: "शिक्षक", options: ["student", "teacher", "doctor", "farmer"], correct: 1 },
    { prompt: "भोजन", options: ["food", "water", "fire", "house"], correct: 0 },
    { prompt: "सूरज", options: ["sun", "moon", "star", "cloud"], correct: 0 },
    { prompt: "चाँद", options: ["sun", "moon", "star", "cloud"], correct: 1 },
    { prompt: "स्कूल", options: ["school", "house", "market", "hospital"], correct: 0 },
    { prompt: "परिवार", options: ["family", "friend", "job", "city"], correct: 0 },
  ],
  Telugu: [
    { prompt: "పుస్తకం", options: ["book", "water", "friend", "house"], correct: 0 },
    { prompt: "నీరు", options: ["fire", "water", "sun", "moon"], correct: 1 },
    { prompt: "స్నేహితుడు", options: ["stranger", "friend", "teacher", "doctor"], correct: 1 },
    { prompt: "ఇల్లు", options: ["house", "sky", "food", "book"], correct: 0 },
    { prompt: "గురువు", options: ["student", "teacher", "doctor", "farmer"], correct: 1 },
    { prompt: "భోజనం", options: ["food", "water", "fire", "house"], correct: 0 },
    { prompt: "సూర్యుడు", options: ["sun", "moon", "star", "cloud"], correct: 0 },
    { prompt: "చంద్రుడు", options: ["sun", "moon", "star", "cloud"], correct: 1 },
    { prompt: "పాఠశాల", options: ["school", "house", "market", "hospital"], correct: 0 },
    { prompt: "కుటుంబం", options: ["family", "friend", "job", "city"], correct: 0 },
  ],
  Tamil: [
    { prompt: "புத்தகம்", options: ["book", "water", "friend", "house"], correct: 0 },
    { prompt: "தண்ணீர்", options: ["fire", "water", "sun", "moon"], correct: 1 },
    { prompt: "நண்பன்", options: ["stranger", "friend", "teacher", "doctor"], correct: 1 },
    { prompt: "வீடு", options: ["house", "sky", "food", "book"], correct: 0 },
    { prompt: "ஆசிரியர்", options: ["student", "teacher", "doctor", "farmer"], correct: 1 },
    { prompt: "உணவு", options: ["food", "water", "fire", "house"], correct: 0 },
    { prompt: "சூரியன்", options: ["sun", "moon", "star", "cloud"], correct: 0 },
    { prompt: "சந்திரன்", options: ["sun", "moon", "star", "cloud"], correct: 1 },
    { prompt: "பள்ளி", options: ["school", "house", "market", "hospital"], correct: 0 },
    { prompt: "குடும்பம்", options: ["family", "friend", "job", "city"], correct: 0 },
  ],
  Malayalam: [
    { prompt: "പുസ്തകം", options: ["book", "water", "friend", "house"], correct: 0 },
    { prompt: "വെള്ളം", options: ["fire", "water", "sun", "moon"], correct: 1 },
    { prompt: "സുഹൃത്ത്", options: ["stranger", "friend", "teacher", "doctor"], correct: 1 },
    { prompt: "വീട്", options: ["house", "sky", "food", "book"], correct: 0 },
    { prompt: "അധ്യാപകൻ", options: ["student", "teacher", "doctor", "farmer"], correct: 1 },
    { prompt: "ഭക്ഷണം", options: ["food", "water", "fire", "house"], correct: 0 },
    { prompt: "സൂര്യൻ", options: ["sun", "moon", "star", "cloud"], correct: 0 },
    { prompt: "ചന്ദ്രൻ", options: ["sun", "moon", "star", "cloud"], correct: 1 },
    { prompt: "സ്കൂൾ", options: ["school", "house", "market", "hospital"], correct: 0 },
    { prompt: "കുടുംബം", options: ["family", "friend", "job", "city"], correct: 0 },
  ],
  Kannada: [
    { prompt: "ಪುಸ್ತಕ", options: ["book", "water", "friend", "house"], correct: 0 },
    { prompt: "ನೀರು", options: ["fire", "water", "sun", "moon"], correct: 1 },
    { prompt: "ಸ್ನೇಹಿತ", options: ["stranger", "friend", "teacher", "doctor"], correct: 1 },
    { prompt: "ಮನೆ", options: ["house", "sky", "food", "book"], correct: 0 },
    { prompt: "ಶಿಕ್ಷಕ", options: ["student", "teacher", "doctor", "farmer"], correct: 1 },
    { prompt: "ಆಹಾರ", options: ["food", "water", "fire", "house"], correct: 0 },
    { prompt: "ಸೂರ್ಯ", options: ["sun", "moon", "star", "cloud"], correct: 0 },
    { prompt: "ಚಂದ್ರ", options: ["sun", "moon", "star", "cloud"], correct: 1 },
    { prompt: "ಶಾಲೆ", options: ["school", "house", "market", "hospital"], correct: 0 },
    { prompt: "ಕುಟುಂಬ", options: ["family", "friend", "job", "city"], correct: 0 },
  ],
};

// Groups the 10-word bank above into 4 progressive units. Unit N is locked
// until unit N-1's test has been passed (tracked via markUnitCompleted).
export const COURSE_UNITS = [
  { id: 1, titleKey: "unit1Title", wordIndexes: [0, 1, 2] },
  { id: 2, titleKey: "unit2Title", wordIndexes: [3, 4, 5] },
  { id: 3, titleKey: "unit3Title", wordIndexes: [6, 7] },
  { id: 4, titleKey: "unit4Title", wordIndexes: [8, 9] },
];

export const HEARTS_START = 3;
export const XP_PER_CORRECT = 5;
export const PASS_THRESHOLD = 0.75; // 75% required to pass / certify

export function isPassing(score, total) {
  return total > 0 && score / total >= PASS_THRESHOLD;
}

export function scoreToLevel(correctCount, total = 10) {
  const ratio = correctCount / total;
  if (ratio >= 0.75) return "Advanced";
  if (ratio >= 0.4) return "Intermediate";
  return "Beginner";
}

const LEVEL_TO_UNIT = { Beginner: 1, Basic: 2, Intermediate: 3, Advanced: 4 };

function getAgeTrack(age) {
  const n = Number(age);
  if (!n || Number.isNaN(n)) {
    return { track: "Balanced Track", pace: "Medium sessions (10 min/day)", dailyXP: 20,
      note: "A balanced mix of reading, writing and listening practice." };
  }
  if (n < 13) return { track: "Playful Explorer", pace: "Short, game-like bursts (5–8 min/day)", dailyXP: 15,
    note: "Lessons lean on pictures, sounds and quick rewards to hold attention." };
  if (n < 20) return { track: "Fast-Track Foundations", pace: "Focused sessions (10–15 min/day)", dailyXP: 25,
    note: "Denser vocabulary and short writing prompts to build speed." };
  if (n < 60) return { track: "Practical Literacy", pace: "Everyday sessions (10 min/day)", dailyXP: 20,
    note: "Real-life reading — forms, messages, notices — alongside core lessons." };
  return { track: "Steady Pace", pace: "Slower, repeat-friendly sessions (8–12 min/day)", dailyXP: 15,
    note: "Larger text, more repetition, and audio support at every step." };
}

export async function getPersonalizedPlan({ preferredLanguage, targetLanguage, age, level, goals = [], name }) {
  const ageTrack = getAgeTrack(age);
  const target = targetLanguage || "English";
  const preferred = preferredLanguage || "English";

  const [ui, content] = await Promise.all([
    getUiStrings(preferred),
    getLessonContent(target),
  ]);

  return {
    displayName: name || "Learner",
    preferredLanguage: preferred,
    targetLanguage: target,
    ui,
    content,
    ageTrack,
    startingUnit: LEVEL_TO_UNIT[level] || 1,
    level: level || "Beginner",
    focusAreas: goals && goals.length ? goals : ["reading"],
    // Always true now: UI strings come from static bundled dictionaries
    // (src/locales/), so there is no network call that can fail and no
    // silent English fallback. Kept in the returned object so Dashboard.jsx
    // keeps working without changes.
    translationOk: true,
  };
}

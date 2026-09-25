// src/content/vocabulary.js
//
// LEVEL-AWARE MULTILINGUAL VOCABULARY BANK
// ---------------------------------------------------------------
// 30 words per language, split into three difficulty tiers of 10.
// Words are ALIGNED BY INDEX across every language — index 0 is "book"
// in all six languages, index 12 is "market", and so on. That alignment
// is what lets the app swap the learning language without rebuilding
// lessons, tests or games.
//
// `meanings` gives each word's gloss in all six languages, so the
// explanation can be shown in the learner's PREFERRED language while the
// word itself stays in the LEARNING language.

export const LEVELS = ["Beginner", "Intermediate", "Advanced"];

// Index ranges per level.
export const LEVEL_RANGES = {
  Beginner: [0, 10],      // 0–9
  Intermediate: [10, 20], // 10–19
  Advanced: [20, 30],     // 20–29
};

// Meanings for each of the 30 concepts, in all six languages.
// Index matches WORDS[<language>][index].
export const MEANINGS = {
  English: [
    "book", "water", "friend", "house", "teacher", "food", "sun", "moon", "school", "family",
    "market", "money", "morning", "evening", "journey", "language", "question", "answer", "work", "health",
    "experience", "opportunity", "responsibility", "knowledge", "society", "environment", "decision", "development", "relationship", "achievement",
  ],
  Hindi: [
    "किताब", "पानी", "दोस्त", "घर", "शिक्षक", "भोजन", "सूरज", "चाँद", "स्कूल", "परिवार",
    "बाज़ार", "पैसा", "सुबह", "शाम", "यात्रा", "भाषा", "प्रश्न", "उत्तर", "काम", "स्वास्थ्य",
    "अनुभव", "अवसर", "ज़िम्मेदारी", "ज्ञान", "समाज", "पर्यावरण", "निर्णय", "विकास", "रिश्ता", "उपलब्धि",
  ],
  Telugu: [
    "పుస్తకం", "నీరు", "స్నేహితుడు", "ఇల్లు", "గురువు", "భోజనం", "సూర్యుడు", "చంద్రుడు", "పాఠశాల", "కుటుంబం",
    "మార్కెట్", "డబ్బు", "ఉదయం", "సాయంత్రం", "ప్రయాణం", "భాష", "ప్రశ్న", "సమాధానం", "పని", "ఆరోగ్యం",
    "అనుభవం", "అవకాశం", "బాధ్యత", "జ్ఞానం", "సమాజం", "పర్యావరణం", "నిర్ణయం", "అభివృద్ధి", "సంబంధం", "సాధన",
  ],
  Tamil: [
    "புத்தகம்", "தண்ணீர்", "நண்பன்", "வீடு", "ஆசிரியர்", "உணவு", "சூரியன்", "சந்திரன்", "பள்ளி", "குடும்பம்",
    "சந்தை", "பணம்", "காலை", "மாலை", "பயணம்", "மொழி", "கேள்வி", "பதில்", "வேலை", "ஆரோக்கியம்",
    "அனுபவம்", "வாய்ப்பு", "பொறுப்பு", "அறிவு", "சமூகம்", "சுற்றுச்சூழல்", "முடிவு", "வளர்ச்சி", "உறவு", "சாதனை",
  ],
  Malayalam: [
    "പുസ്തകം", "വെള്ളം", "സുഹൃത്ത്", "വീട്", "അധ്യാപകൻ", "ഭക്ഷണം", "സൂര്യൻ", "ചന്ദ്രൻ", "സ്കൂൾ", "കുടുംബം",
    "മാർക്കറ്റ്", "പണം", "രാവിലെ", "വൈകുന്നേരം", "യാത്ര", "ഭാഷ", "ചോദ്യം", "ഉത്തരം", "ജോലി", "ആരോഗ്യം",
    "അനുഭവം", "അവസരം", "ഉത്തരവാദിത്തം", "അറിവ്", "സമൂഹം", "പരിസ്ഥിതി", "തീരുമാനം", "വികസനം", "ബന്ധം", "നേട്ടം",
  ],
  Kannada: [
    "ಪುಸ್ತಕ", "ನೀರು", "ಸ್ನೇಹಿತ", "ಮನೆ", "ಶಿಕ್ಷಕ", "ಆಹಾರ", "ಸೂರ್ಯ", "ಚಂದ್ರ", "ಶಾಲೆ", "ಕುಟುಂಬ",
    "ಮಾರುಕಟ್ಟೆ", "ಹಣ", "ಬೆಳಿಗ್ಗೆ", "ಸಂಜೆ", "ಪ್ರಯಾಣ", "ಭಾಷೆ", "ಪ್ರಶ್ನೆ", "ಉತ್ತರ", "ಕೆಲಸ", "ಆರೋಗ್ಯ",
    "ಅನುಭವ", "ಅವಕಾಶ", "ಜವಾಬ್ದಾರಿ", "ಜ್ಞಾನ", "ಸಮಾಜ", "ಪರಿಸರ", "ನಿರ್ಧಾರ", "ಅಭಿವೃದ್ಧಿ", "ಸಂಬಂಧ", "ಸಾಧನೆ",
  ],
};

// The word list in a language IS its meanings list — a word in Kannada is
// just the Kannada entry at that index. This alias makes intent clearer
// at call sites that want "the word to learn" vs "the gloss to show".
export const WORDS = MEANINGS;

/** The word at `index` in the learner's LEARNING language. */
export function getWord(language, index) {
  return (WORDS[language] || WORDS.English)[index];
}

/** That word's meaning in the learner's PREFERRED language. */
export function getMeaning(preferredLanguage, index) {
  return (MEANINGS[preferredLanguage] || MEANINGS.English)[index];
}

/** All word indexes belonging to a difficulty level. */
export function indexesForLevel(level) {
  const [start, end] = LEVEL_RANGES[level] || LEVEL_RANGES.Beginner;
  return Array.from({ length: end - start }, (_, i) => start + i);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds multiple-choice questions dynamically:
 *   prompt  = the word in `targetLanguage`
 *   options = 4 meanings in `preferredLanguage` (1 correct + 3 distractors
 *             drawn from the SAME difficulty level, so wrong answers are
 *             plausible rather than obviously easier/harder)
 *
 * Because options are generated fresh each call, the learner doesn't see
 * the same four choices in the same order every time.
 */
export function buildQuestions({ targetLanguage, preferredLanguage, level, count, indexes }) {
  const pool = indexes && indexes.length ? indexes : indexesForLevel(level);
  const chosen = count ? shuffle(pool).slice(0, count) : pool;

  return chosen.map((idx) => {
    const distractorPool = pool.filter((i) => i !== idx);
    const distractors = shuffle(distractorPool).slice(0, 3);
    const optionIndexes = shuffle([idx, ...distractors]);

    return {
      wordIndex: idx,
      prompt: getWord(targetLanguage, idx),
      options: optionIndexes.map((i) => getMeaning(preferredLanguage, i)),
      correct: optionIndexes.indexOf(idx),
    };
  });
}

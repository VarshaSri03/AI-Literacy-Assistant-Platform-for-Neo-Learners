// src/content/sentences.js
//
// SPOKEN PRACTICE SENTENCES — used by Voice Studio.
// Nine sentences per language (3 Beginner, 3 Intermediate, 3 Advanced),
// aligned by index across languages so switching the learning language
// keeps the same meaning progression.
//
// Sentences get progressively longer, which matters for speech scoring:
// a beginner should be rated on a 2-word greeting, not a 12-word clause.

export const SENTENCES = {
  English: [
    "Hello, how are you?",
    "My name is Ravi.",
    "I am learning a new language.",
    "I go to the market every morning.",
    "Could you please speak a little slower?",
    "My family lives in a small town near the river.",
    "Learning a new language takes patience and daily practice.",
    "I believe education creates opportunities for everyone in society.",
    "The environment is our shared responsibility, and small decisions matter.",
  ],
  Hindi: [
    "नमस्ते, आप कैसे हैं?",
    "मेरा नाम रवि है।",
    "मैं एक नई भाषा सीख रहा हूँ।",
    "मैं हर सुबह बाज़ार जाता हूँ।",
    "क्या आप थोड़ा धीरे बोल सकते हैं?",
    "मेरा परिवार नदी के पास एक छोटे शहर में रहता है।",
    "नई भाषा सीखने में धैर्य और रोज़ अभ्यास लगता है।",
    "मेरा मानना है कि शिक्षा समाज में सबके लिए अवसर बनाती है।",
    "पर्यावरण हमारी साझा ज़िम्मेदारी है, और छोटे निर्णय भी मायने रखते हैं।",
  ],
  Telugu: [
    "నమస్కారం, మీరు ఎలా ఉన్నారు?",
    "నా పేరు రవి.",
    "నేను కొత్త భాష నేర్చుకుంటున్నాను.",
    "నేను ప్రతి ఉదయం మార్కెట్‌కి వెళ్తాను.",
    "మీరు కొంచెం నెమ్మదిగా మాట్లాడగలరా?",
    "మా కుటుంబం నది దగ్గర ఒక చిన్న ఊరిలో నివసిస్తుంది.",
    "కొత్త భాష నేర్చుకోవడానికి ఓపిక మరియు రోజువారీ అభ్యాసం అవసరం.",
    "విద్య సమాజంలో అందరికీ అవకాశాలను సృష్టిస్తుందని నేను నమ్ముతాను.",
    "పర్యావరణం మన ఉమ్మడి బాధ్యత, చిన్న నిర్ణయాలు కూడా ముఖ్యం.",
  ],
  Tamil: [
    "வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?",
    "என் பெயர் ரவி.",
    "நான் ஒரு புதிய மொழியைக் கற்றுக்கொண்டிருக்கிறேன்.",
    "நான் ஒவ்வொரு காலையும் சந்தைக்குச் செல்கிறேன்.",
    "நீங்கள் கொஞ்சம் மெதுவாகப் பேச முடியுமா?",
    "என் குடும்பம் ஆற்றின் அருகே ஒரு சிறிய ஊரில் வசிக்கிறது.",
    "புதிய மொழியைக் கற்க பொறுமையும் தினசரி பயிற்சியும் தேவை.",
    "கல்வி சமூகத்தில் அனைவருக்கும் வாய்ப்புகளை உருவாக்குகிறது என்று நான் நம்புகிறேன்.",
    "சுற்றுச்சூழல் நமது கூட்டுப் பொறுப்பு, சிறிய முடிவுகளும் முக்கியம்.",
  ],
  Malayalam: [
    "നമസ്കാരം, സുഖമാണോ?",
    "എന്റെ പേര് രവി.",
    "ഞാൻ ഒരു പുതിയ ഭാഷ പഠിക്കുകയാണ്.",
    "ഞാൻ എല്ലാ രാവിലെയും മാർക്കറ്റിൽ പോകുന്നു.",
    "നിങ്ങൾക്ക് അല്പം പതുക്കെ സംസാരിക്കാമോ?",
    "എന്റെ കുടുംബം പുഴയ്ക്കടുത്തുള്ള ഒരു ചെറിയ പട്ടണത്തിലാണ് താമസിക്കുന്നത്.",
    "പുതിയ ഭാഷ പഠിക്കാൻ ക്ഷമയും ദിവസേനയുള്ള പരിശീലനവും വേണം.",
    "വിദ്യാഭ്യാസം സമൂഹത്തിൽ എല്ലാവർക്കും അവസരങ്ങൾ സൃഷ്ടിക്കുന്നുവെന്ന് ഞാൻ വിശ്വസിക്കുന്നു.",
    "പരിസ്ഥിതി നമ്മുടെ പൊതു ഉത്തരവാദിത്തമാണ്, ചെറിയ തീരുമാനങ്ങളും പ്രധാനമാണ്.",
  ],
  Kannada: [
    "ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಿ?",
    "ನನ್ನ ಹೆಸರು ರವಿ.",
    "ನಾನು ಹೊಸ ಭಾಷೆಯನ್ನು ಕಲಿಯುತ್ತಿದ್ದೇನೆ.",
    "ನಾನು ಪ್ರತಿ ಬೆಳಿಗ್ಗೆ ಮಾರುಕಟ್ಟೆಗೆ ಹೋಗುತ್ತೇನೆ.",
    "ನೀವು ಸ್ವಲ್ಪ ನಿಧಾನವಾಗಿ ಮಾತನಾಡಬಹುದೇ?",
    "ನನ್ನ ಕುಟುಂಬ ನದಿಯ ಹತ್ತಿರದ ಸಣ್ಣ ಊರಿನಲ್ಲಿ ವಾಸಿಸುತ್ತದೆ.",
    "ಹೊಸ ಭಾಷೆ ಕಲಿಯಲು ತಾಳ್ಮೆ ಮತ್ತು ದೈನಂದಿನ ಅಭ್ಯಾಸ ಬೇಕು.",
    "ಶಿಕ್ಷಣವು ಸಮಾಜದಲ್ಲಿ ಎಲ್ಲರಿಗೂ ಅವಕಾಶಗಳನ್ನು ಸೃಷ್ಟಿಸುತ್ತದೆ ಎಂದು ನಾನು ನಂಬುತ್ತೇನೆ.",
    "ಪರಿಸರವು ನಮ್ಮ ಸಾಮೂಹಿಕ ಜವಾಬ್ದಾರಿ, ಸಣ್ಣ ನಿರ್ಧಾರಗಳೂ ಮುಖ್ಯ.",
  ],
};

export const SENTENCE_LEVEL_RANGES = {
  Beginner: [0, 3],
  Intermediate: [3, 6],
  Advanced: [6, 9],
};

/** Sentences for a level in the learner's LEARNING language, with preferred-language glosses. */
export function getSentences({ targetLanguage, preferredLanguage, level }) {
  const [start, end] = SENTENCE_LEVEL_RANGES[level] || SENTENCE_LEVEL_RANGES.Beginner;
  const target = SENTENCES[targetLanguage] || SENTENCES.English;
  const gloss = SENTENCES[preferredLanguage] || SENTENCES.English;

  return Array.from({ length: end - start }, (_, i) => ({
    index: start + i,
    text: target[start + i],
    meaning: gloss[start + i],
  }));
}

// ---------------------------------------------------------------
// SPEECH SCORING
// ---------------------------------------------------------------

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFC")
    // strip punctuation that speech-to-text won't produce anyway
    .replace(/[.,!?;:"'`()\-—–]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance, used for the character-level similarity score. */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

/**
 * Rates a spoken attempt against the expected sentence, 0–100.
 *
 * Blends two signals so neither dominates unfairly:
 *   - word overlap (60%): did they say roughly the right words?
 *   - character similarity (40%): how close is the overall shape?
 *
 * IMPORTANT CAVEAT: this scores the speech-recognition TRANSCRIPT, not the
 * audio itself. It cannot judge accent, tone or fluency — only whether the
 * recognizer heard approximately the right words. Recognition quality for
 * Indian languages varies a lot by browser, so treat a low score as
 * "try again / check your mic" rather than a verdict on pronunciation.
 */
export function scoreSpeech(spoken, expected) {
  const a = normalize(spoken);
  const b = normalize(expected);
  if (!a || !b) return 0;

  const aWords = a.split(" ");
  const bWords = b.split(" ");

  const remaining = [...bWords];
  let hits = 0;
  for (const w of aWords) {
    const at = remaining.indexOf(w);
    if (at !== -1) { hits++; remaining.splice(at, 1); }
  }
  const wordScore = bWords.length ? hits / bWords.length : 0;

  const dist = levenshtein(a, b);
  const charScore = Math.max(0, 1 - dist / Math.max(a.length, b.length));

  return Math.round((wordScore * 0.6 + charScore * 0.4) * 100);
}

/** Maps a 0–100 score to a rating band the UI can label and colour. */
export function scoreBand(score) {
  if (score >= 85) return "excellent";
  if (score >= 65) return "good";
  if (score >= 40) return "fair";
  return "again";
}

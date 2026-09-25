// server/data/curriculum.js
//
// LITERACY CURRICULUM STRUCTURE + MULTILINGUAL CONTENT REPOSITORY
// -----------------------------------------------------------------
// CHANGED from your original: added units 5-6 and 5 new words (mother,
// father, child, river, tree) across all 6 languages — first batch toward
// the 15-lesson goal. Units 1-4 and words 0-9 are exactly what you had.
//
//   CURRICULUM_UNITS  — ordered list of units, tagged with literacy skills.
//   VOCAB_BANK        — the multilingual repository: words aligned by
//                        index across every language.
//   UNIT_WORD_INDEXES — maps each unit to which VOCAB_BANK entries it uses.

export const CURRICULUM_UNITS = [
  { id: 1, titleKey: "unit1Title", skills: ["reading", "listening"] },
  { id: 2, titleKey: "unit2Title", skills: ["reading", "writing", "listening"] },
  { id: 3, titleKey: "unit3Title", skills: ["listening", "speaking"] },
  { id: 4, titleKey: "unit4Title", skills: ["reading", "writing", "speaking"] },
  { id: 5, titleKey: "unit5Title", skills: ["reading", "listening", "speaking"] },
  { id: 6, titleKey: "unit6Title", skills: ["reading", "writing", "listening", "speaking"] },
];

export const UNIT_WORD_INDEXES = {
  1: [0, 1, 2],
  2: [3, 4, 5],
  3: [6, 7],
  4: [8, 9],
  5: [10, 11, 12],
  6: [13, 14],
};

// 0 book, 1 water, 2 friend, 3 house, 4 teacher,
// 5 food, 6 sun, 7 moon, 8 school, 9 family,
// 10 mother, 11 father, 12 child, 13 river, 14 tree
export const VOCAB_BANK = {
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
    { prompt: "mother", options: ["a female parent", "a teacher", "a friend", "a season"], correct: 0 },
    { prompt: "father", options: ["a male parent", "a teacher", "a friend", "a season"], correct: 0 },
    { prompt: "child", options: ["a young person", "a type of food", "a place", "a season"], correct: 0 },
    { prompt: "river", options: ["a flowing body of water", "a mountain", "a type of tree", "a season"], correct: 0 },
    { prompt: "tree", options: ["a tall plant with a trunk and branches", "a type of animal", "a river", "a season"], correct: 0 },
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
    { prompt: "माँ", options: ["mother", "father", "child", "teacher"], correct: 0 },
    { prompt: "पिता", options: ["mother", "father", "child", "teacher"], correct: 1 },
    { prompt: "बच्चा", options: ["mother", "father", "child", "teacher"], correct: 2 },
    { prompt: "नदी", options: ["river", "mountain", "tree", "sky"], correct: 0 },
    { prompt: "पेड़", options: ["river", "mountain", "tree", "sky"], correct: 2 },
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
    { prompt: "అమ్మ", options: ["mother", "father", "child", "teacher"], correct: 0 },
    { prompt: "నాన్న", options: ["mother", "father", "child", "teacher"], correct: 1 },
    { prompt: "పిల్లవాడు", options: ["mother", "father", "child", "teacher"], correct: 2 },
    { prompt: "నది", options: ["river", "mountain", "tree", "sky"], correct: 0 },
    { prompt: "చెట్టు", options: ["river", "mountain", "tree", "sky"], correct: 2 },
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
    { prompt: "அம்மா", options: ["mother", "father", "child", "teacher"], correct: 0 },
    { prompt: "அப்பா", options: ["mother", "father", "child", "teacher"], correct: 1 },
    { prompt: "குழந்தை", options: ["mother", "father", "child", "teacher"], correct: 2 },
    { prompt: "ஆறு", options: ["river", "mountain", "tree", "sky"], correct: 0 },
    { prompt: "மரம்", options: ["river", "mountain", "tree", "sky"], correct: 2 },
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
    { prompt: "അമ്മ", options: ["mother", "father", "child", "teacher"], correct: 0 },
    { prompt: "അച്ഛൻ", options: ["mother", "father", "child", "teacher"], correct: 1 },
    { prompt: "കുട്ടി", options: ["mother", "father", "child", "teacher"], correct: 2 },
    { prompt: "നദി", options: ["river", "mountain", "tree", "sky"], correct: 0 },
    { prompt: "മരം", options: ["river", "mountain", "tree", "sky"], correct: 2 },
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
    { prompt: "ಅಮ್ಮ", options: ["mother", "father", "child", "teacher"], correct: 0 },
    { prompt: "ಅಪ್ಪ", options: ["mother", "father", "child", "teacher"], correct: 1 },
    { prompt: "ಮಗು", options: ["mother", "father", "child", "teacher"], correct: 2 },
    { prompt: "ನದಿ", options: ["river", "mountain", "tree", "sky"], correct: 0 },
    { prompt: "ಮರ", options: ["river", "mountain", "tree", "sky"], correct: 2 },
  ],
};

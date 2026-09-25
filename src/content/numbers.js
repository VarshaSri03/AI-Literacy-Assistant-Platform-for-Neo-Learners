// src/content/numbers.js
//
// Number-words for the new "Numbers" mode in VoiceStudio.jsx. Standalone
// module — doesn't depend on the existing (unseen) content/vocabulary.js,
// so it can't accidentally break anything there.
//
// Each entry: { value: 1, word: "<number word in that language's script>" }.
// Pronunciation is handled by the existing pronounce.js speak()/listenOnce()
// functions, which already cover all 6 languages via SPEECH_LOCALES — no
// changes needed there.

export const NUMBERS = {
  English: [
    { value: 1, word: "one" }, { value: 2, word: "two" }, { value: 3, word: "three" },
    { value: 4, word: "four" }, { value: 5, word: "five" }, { value: 6, word: "six" },
    { value: 7, word: "seven" }, { value: 8, word: "eight" }, { value: 9, word: "nine" },
    { value: 10, word: "ten" }, { value: 11, word: "eleven" }, { value: 12, word: "twelve" },
    { value: 13, word: "thirteen" }, { value: 14, word: "fourteen" }, { value: 15, word: "fifteen" },
    { value: 16, word: "sixteen" }, { value: 17, word: "seventeen" }, { value: 18, word: "eighteen" },
    { value: 19, word: "nineteen" }, { value: 20, word: "twenty" },
  ],
  Hindi: [
    { value: 1, word: "एक" }, { value: 2, word: "दो" }, { value: 3, word: "तीन" },
    { value: 4, word: "चार" }, { value: 5, word: "पाँच" }, { value: 6, word: "छह" },
    { value: 7, word: "सात" }, { value: 8, word: "आठ" }, { value: 9, word: "नौ" },
    { value: 10, word: "दस" }, { value: 11, word: "ग्यारह" }, { value: 12, word: "बारह" },
    { value: 13, word: "तेरह" }, { value: 14, word: "चौदह" }, { value: 15, word: "पंद्रह" },
    { value: 16, word: "सोलह" }, { value: 17, word: "सत्रह" }, { value: 18, word: "अठारह" },
    { value: 19, word: "उन्नीस" }, { value: 20, word: "बीस" },
  ],
  Telugu: [
    { value: 1, word: "ఒకటి" }, { value: 2, word: "రెండు" }, { value: 3, word: "మూడు" },
    { value: 4, word: "నాలుగు" }, { value: 5, word: "అయిదు" }, { value: 6, word: "ఆరు" },
    { value: 7, word: "ఏడు" }, { value: 8, word: "ఎనిమిది" }, { value: 9, word: "తొమ్మిది" },
    { value: 10, word: "పది" }, { value: 11, word: "పదకొండు" }, { value: 12, word: "పన్నెండు" },
    { value: 13, word: "పదమూడు" }, { value: 14, word: "పద్నాలుగు" }, { value: 15, word: "పదిహేను" },
    { value: 16, word: "పదహారు" }, { value: 17, word: "పదిహేడు" }, { value: 18, word: "పద్దెనిమిది" },
    { value: 19, word: "పంతొమ్మిది" }, { value: 20, word: "ఇరవై" },
  ],
  Tamil: [
    { value: 1, word: "ஒன்று" }, { value: 2, word: "இரண்டு" }, { value: 3, word: "மூன்று" },
    { value: 4, word: "நான்கு" }, { value: 5, word: "ஐந்து" }, { value: 6, word: "ஆறு" },
    { value: 7, word: "ஏழு" }, { value: 8, word: "எட்டு" }, { value: 9, word: "ஒன்பது" },
    { value: 10, word: "பத்து" }, { value: 11, word: "பதினொன்று" }, { value: 12, word: "பன்னிரண்டு" },
    { value: 13, word: "பதிமூன்று" }, { value: 14, word: "பதினான்கு" }, { value: 15, word: "பதினைந்து" },
    { value: 16, word: "பதினாறு" }, { value: 17, word: "பதினேழு" }, { value: 18, word: "பதினெட்டு" },
    { value: 19, word: "பத்தொன்பது" }, { value: 20, word: "இருபது" },
  ],
  Malayalam: [
    { value: 1, word: "ഒന്ന്" }, { value: 2, word: "രണ്ട്" }, { value: 3, word: "മൂന്ന്" },
    { value: 4, word: "നാല്" }, { value: 5, word: "അഞ്ച്" }, { value: 6, word: "ആറ്" },
    { value: 7, word: "ഏഴ്" }, { value: 8, word: "എട്ട്" }, { value: 9, word: "ഒമ്പത്" },
    { value: 10, word: "പത്ത്" }, { value: 11, word: "പതിനൊന്ന്" }, { value: 12, word: "പന്ത്രണ്ട്" },
    { value: 13, word: "പതിമൂന്ന്" }, { value: 14, word: "പതിനാല്" }, { value: 15, word: "പതിനഞ്ച്" },
    { value: 16, word: "പതിനാറ്" }, { value: 17, word: "പതിനേഴ്" }, { value: 18, word: "പതിനെട്ട്" },
    { value: 19, word: "പത്തൊമ്പത്" }, { value: 20, word: "ഇരുപത്" },
  ],
  Kannada: [
    { value: 1, word: "ಒಂದು" }, { value: 2, word: "ಎರಡು" }, { value: 3, word: "ಮೂರು" },
    { value: 4, word: "ನಾಲ್ಕು" }, { value: 5, word: "ಐದು" }, { value: 6, word: "ಆರು" },
    { value: 7, word: "ಏಳು" }, { value: 8, word: "ಎಂಟು" }, { value: 9, word: "ಒಂಬತ್ತು" },
    { value: 10, word: "ಹತ್ತು" }, { value: 11, word: "ಹನ್ನೊಂದು" }, { value: 12, word: "ಹನ್ನೆರಡು" },
    { value: 13, word: "ಹದಿಮೂರು" }, { value: 14, word: "ಹದಿನಾಲ್ಕು" }, { value: 15, word: "ಹದಿನೈದು" },
    { value: 16, word: "ಹದಿನಾರು" }, { value: 17, word: "ಹದಿನೇಳು" }, { value: 18, word: "ಹದಿನೆಂಟು" },
    { value: 19, word: "ಹತ್ತೊಂಬತ್ತು" }, { value: 20, word: "ಇಪ್ಪತ್ತು" },
  ],
};

export function getNumbers(targetLanguage) {
  return NUMBERS[targetLanguage] || NUMBERS.English;
}

// src/content/letters.js
//
// ⚠️ ACCURACY NOTE: these are the standard vowel/consonant sequences for
// each script, from general linguistic reference — but for a literacy app
// specifically, I'd strongly recommend having a native speaker of each
// language review this list before it goes live. A wrong character in an
// alphabet lesson actively teaches something false, which is worse than
// most other content bugs. Treat this as a solid first draft, not a
// verified-correct final version.
//
// Standalone module — doesn't touch the existing (unseen) content/vocabulary.js.

export const LETTERS = {
  English: {
    vowels: ["A", "E", "I", "O", "U"],
    consonants: ["B","C","D","F","G","H","J","K","L","M","N","P","Q","R","S","T","V","W","X","Y","Z"],
  },
  Hindi: {
    vowels: ["अ","आ","इ","ई","उ","ऊ","ऋ","ए","ऐ","ओ","औ"],
    consonants: ["क","ख","ग","घ","ङ","च","छ","ज","झ","ञ","ट","ठ","ड","ढ","ण","त","थ","द","ध","न","प","फ","ब","भ","म","य","र","ल","व","श","ष","स","ह"],
  },
  Telugu: {
    vowels: ["అ","ఆ","ఇ","ఈ","ఉ","ఊ","ఋ","ఎ","ఏ","ఐ","ఒ","ఓ","ఔ"],
    consonants: ["క","ఖ","గ","ఘ","ఙ","చ","ఛ","జ","ఝ","ఞ","ట","ఠ","డ","ఢ","ణ","త","థ","ద","ధ","న","ప","ఫ","బ","భ","మ","య","ర","ల","వ","శ","ష","స","హ","ళ"],
  },
  Tamil: {
    vowels: ["அ","ஆ","இ","ஈ","உ","ஊ","எ","ஏ","ஐ","ஒ","ஓ","ஔ"],
    consonants: ["க","ங","ச","ஞ","ட","ண","த","ந","ப","ம","ய","ர","ல","வ","ழ","ள","ற","ன"],
  },
  Malayalam: {
    vowels: ["അ","ആ","ഇ","ഈ","ഉ","ഊ","ഋ","എ","ഏ","ഐ","ഒ","ഓ","ഔ"],
    consonants: ["ക","ഖ","ഗ","ഘ","ങ","ച","ഛ","ജ","ഝ","ഞ","ട","ഠ","ഡ","ഢ","ണ","ത","ഥ","ദ","ധ","ന","പ","ഫ","ബ","ഭ","മ","യ","ര","ല","വ","ശ","ഷ","സ","ഹ","ള","ഴ","റ"],
  },
  Kannada: {
    vowels: ["ಅ","ಆ","ಇ","ಈ","ಉ","ಊ","ಋ","ಎ","ಏ","ಐ","ಒ","ಓ","ಔ"],
    consonants: ["ಕ","ಖ","ಗ","ಘ","ಙ","ಚ","ಛ","ಜ","ಝ","ಞ","ಟ","ಠ","ಡ","ಢ","ಣ","ತ","ಥ","ದ","ಧ","ನ","ಪ","ಫ","ಬ","ಭ","ಮ","ಯ","ರ","ಲ","ವ","ಶ","ಷ","ಸ","ಹ","ಳ"],
  },
};

export function getLetters(targetLanguage) {
  return LETTERS[targetLanguage] || LETTERS.English;
}

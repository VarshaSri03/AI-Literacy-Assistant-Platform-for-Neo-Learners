// translateService.js
// Frontend helper for translation. This calls OUR OWN backend proxy
// (server/index.js), never Azure directly — the Azure key must stay
// server-side only.

const PROXY_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5174"}/api/translate`;

// In-memory cache so the same text isn't re-translated into the same
// language on every render/navigation. Keyed by `${langCode}::${text}`.
const cache = new Map();

// Tracks whether the MOST RECENT translation call actually succeeded, so
// the UI can show a warning instead of silently displaying English text
// when the Azure Translator key is missing/invalid in server/.env.
let lastCallSucceeded = true;

export function isTranslationHealthy() {
  return lastCallSucceeded;
}

/**
 * Translates a batch of English strings into `langCode` (e.g. "hi", "te").
 * Falls back to the original English text for any string that fails to
 * translate (network error, missing Azure key, etc.) so the UI never
 * breaks — it just shows English instead of the target language. Check
 * isTranslationHealthy() afterward to know whether that fallback happened.
 */
export async function translateBatch(texts, langCode) {
  if (!langCode || langCode === "en") return texts;

  const uncached = texts.filter((t) => !cache.has(`${langCode}::${t}`));

  if (uncached.length > 0) {
    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: uncached, to: langCode }),
      });

      if (!res.ok) throw new Error(`Translate proxy responded ${res.status}`);

      const { translations } = await res.json();
      uncached.forEach((t, i) => cache.set(`${langCode}::${t}`, translations[i]));
      lastCallSucceeded = true;
    } catch (err) {
      console.warn("Translation failed, falling back to English:", err);
      uncached.forEach((t) => cache.set(`${langCode}::${t}`, t));
      lastCallSucceeded = false;
    }
  }

  return texts.map((t) => cache.get(`${langCode}::${t}`));
}


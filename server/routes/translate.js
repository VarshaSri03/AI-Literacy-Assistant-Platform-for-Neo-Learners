// server/routes/translate.js
//
// Tries Azure Translator first (better quality, higher limits, needs a
// key). If Azure isn't configured OR the Azure call fails for any reason,
// automatically falls back to MyMemory (https://mymemory.translated.net) —
// a free translation API that needs NO API key at all. This means the app
// translates correctly even if you never set up Azure.
//
// MyMemory's free tier is rate-limited (roughly 5,000 words/day per IP,
// or 50,000/day if you set MYMEMORY_EMAIL below) and has no batch endpoint,
// so it's a solid fallback for a small app but not a scale replacement for
// Azure. If Azure is configured and working, it's always used first.

import express from "express";

const router = express.Router();

const {
  AZURE_TRANSLATOR_KEY,
  AZURE_TRANSLATOR_REGION,
  AZURE_TRANSLATOR_ENDPOINT = "https://api.cognitive.microsofttranslator.com",
  MYMEMORY_EMAIL, // optional — raises MyMemory's free daily limit, see mymemory.translated.net
} = process.env;

/** Returns translated strings, or null if Azure isn't configured/fails (so the caller can fall back). */
async function translateWithAzure(texts, to) {
  if (!AZURE_TRANSLATOR_KEY || !AZURE_TRANSLATOR_REGION) return null;

  try {
    const url = `${AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&from=en&to=${encodeURIComponent(to)}`;

    const azureRes = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY,
        "Ocp-Apim-Subscription-Region": AZURE_TRANSLATOR_REGION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(texts.map((text) => ({ Text: text }))),
    });

    if (!azureRes.ok) {
      const detail = await azureRes.text().catch(() => "");
      console.warn("Azure Translator failed, falling back to MyMemory:", azureRes.status, detail);
      return null;
    }

    const data = await azureRes.json();
    return data.map((entry) => entry.translations[0].text);
  } catch (err) {
    console.warn("Azure Translator request failed, falling back to MyMemory:", err.message);
    return null;
  }
}

/** MyMemory has no batch endpoint, so this translates one string at a time. */
async function translateWithMyMemory(texts, to) {
  const results = [];

  for (const text of texts) {
    try {
      const emailParam = MYMEMORY_EMAIL ? `&de=${encodeURIComponent(MYMEMORY_EMAIL)}` : "";
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(to)}${emailParam}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`MyMemory responded ${res.status}`);

      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      // MyMemory returns status 200 even for low-confidence matches; only
      // trust it if it actually gave back translated text.
      results.push(translated && data.responseStatus === 200 ? translated : text);
    } catch (err) {
      console.warn("MyMemory translation failed for one string, using English:", err.message);
      results.push(text); // fail soft — this one word stays English, not the whole page
    }
  }

  return results;
}

// POST /api/translate  { texts: string[], to: "hi" }
// -> { translations: string[], provider: "azure" | "mymemory" }
router.post("/", async (req, res) => {
  const { texts, to } = req.body || {};

  if (!Array.isArray(texts) || texts.length === 0 || !to) {
    return res.status(400).json({ error: "Body must include { texts: string[], to: string }" });
  }

  try {
    const azureResult = await translateWithAzure(texts, to);
    if (azureResult) {
      return res.json({ translations: azureResult, provider: "azure" });
    }

    const fallbackResult = await translateWithMyMemory(texts, to);
    res.json({ translations: fallbackResult, provider: "mymemory" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Translation request failed." });
  }
});

export default router;

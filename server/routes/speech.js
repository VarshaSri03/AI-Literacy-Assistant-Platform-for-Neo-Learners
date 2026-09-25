// server/routes/speech.js
//
// Cloud text-to-speech fallback for languages your OS doesn't have a voice
// for (very common for Telugu/Kannada on Windows — Microsoft's built-in
// Windows voices don't include them at all, regardless of language packs
// installed via Settings).
//
// Uses Azure Speech Services (a DIFFERENT Azure resource than Azure
// Translator, though you can create one "Cognitive Services" multi-service
// resource that covers both). Needs its own key:
//
//   1. portal.azure.com -> Create a resource -> search "Speech"
//   2. Create it on the free F0 tier (500,000 characters/month free)
//   3. Copy its Key and Region into server/.env:
//        AZURE_SPEECH_KEY=...
//        AZURE_SPEECH_REGION=...   (e.g. "centralindia", "eastus")
//
// If these aren't set, isCloudSpeechEnabled() returns false and the
// frontend's pronounce.js simply keeps behaving as before (🔇 note) —
// same graceful-degradation pattern as everywhere else in this app.

import express from "express";

const router = express.Router();
const { AZURE_SPEECH_KEY, AZURE_SPEECH_REGION } = process.env;

// Neural voice per language. (Azure's Indian-language coverage is broad —
// this is the one part of the stack that reliably covers Telugu/Kannada.)
const VOICE_MAP = {
  English: "en-US-JennyNeural",
  Hindi: "hi-IN-SwaraNeural",
  Telugu: "te-IN-ShrutiNeural",
  Tamil: "ta-IN-PallaviNeural",
  Malayalam: "ml-IN-SobhanaNeural",
  Kannada: "kn-IN-SapnaNeural",
};

const LOCALE_MAP = {
  English: "en-US", Hindi: "hi-IN", Telugu: "te-IN",
  Tamil: "ta-IN", Malayalam: "ml-IN", Kannada: "kn-IN",
};

export function isCloudSpeechEnabled() {
  return !!(AZURE_SPEECH_KEY && AZURE_SPEECH_REGION);
}

function escapeSsml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// POST /api/speech/tts  { text, language }  -> audio/mpeg binary
router.post("/tts", async (req, res) => {
  const { text, language } = req.body || {};

  if (!text || !language) {
    return res.status(400).json({ error: "text and language are required." });
  }

  if (!isCloudSpeechEnabled()) {
    return res.status(503).json({
      error: "Cloud speech isn't configured. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in server/.env.",
    });
  }

  const voice = VOICE_MAP[language] || VOICE_MAP.English;
  const locale = LOCALE_MAP[language] || "en-US";
  const ssml =
    `<speak version='1.0' xml:lang='${locale}'>` +
    `<voice xml:lang='${locale}' name='${voice}'>${escapeSsml(text)}</voice>` +
    `</speak>`;

  try {
    const ttsRes = await fetch(
      `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-64kbitrate-mono-mp3",
        },
        body: ssml,
      }
    );

    if (!ttsRes.ok) {
      const detail = await ttsRes.text().catch(() => "");
      console.error("Azure Speech TTS failed:", ttsRes.status, detail);
      return res.status(502).json({ error: "Cloud speech request failed." });
    }

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
    res.set("Content-Type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cloud speech request failed." });
  }
});

export default router;

// server/services/aiContent.js
//
// Google Gemini integration (switched from Claude/Anthropic). Implements
// the exact same exports your routes already import:
//   aiHelp.js       -> generateHelpAnswer, isAiContentEnabled
//   assessment.js   -> generateAssessmentQuestions, isAiContentEnabled
//   learningPath.js -> generatePersonalizedLesson, isAiContentEnabled
//
// SETUP — server/.env needs:
//   GEMINI_API_KEY=...
// (you confirmed this is already set and working)
// Optional: GEMINI_MODEL to override the default.
//
// CHANGED: generateHelpAnswer now accepts an optional `history` array —
// [{ role: "user" | "assistant", text }, ...] — so the AI Help chat can
// maintain conversation context across follow-up questions, per the spec.
// Every call is still stateless server-side: the frontend resends the
// history each time (same pattern the rest of this app already uses for
// translation caching etc.) — no new database table needed for this.

const { GEMINI_API_KEY, GEMINI_MODEL } = process.env;
const MODEL = GEMINI_MODEL || "gemini-2.0-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export function isAiContentEnabled() {
  return !!GEMINI_API_KEY;
}

/** Low-level call. Throws on failure — callers decide whether to catch or propagate. */
async function callGemini({ system, contents, maxTokens = 600 }) {
  const res = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini API responded ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();

  // Gemini can decline to answer (safety filters) without an HTTP error —
  // finishReason "SAFETY"/"RECITATION"/etc with no candidates/parts.
  const parts = data.candidates?.[0]?.content?.parts;
  const text = parts?.map((p) => p.text).filter(Boolean).join("\n").trim();

  if (!text) {
    const reason = data.candidates?.[0]?.finishReason || "unknown reason";
    throw new Error(`Gemini returned no usable text (${reason})`);
  }

  return text;
}

/**
 * Answers a learner's question, with optional conversation history for
 * follow-ups. Used by POST /api/ai-help. Throws on failure — aiHelp.js's
 * own try/catch turns that into a clean error response instead of a
 * silent {answer: null}.
 */
export async function generateHelpAnswer({ question, targetLanguage, preferredLanguage, history = [] }) {
  const system =
    `You are a friendly, patient language tutor inside "Learnly", a literacy app. ` +
    `The learner is learning ${targetLanguage}, and is most comfortable in ${preferredLanguage}. ` +
    `Answer clearly and briefly by default (2-4 sentences), but give a fuller explanation, examples, or ` +
    `practice questions when the learner asks for them or the question needs it. ` +
    `Explain primarily in ${preferredLanguage} so a beginner can follow along, and keep ${targetLanguage} ` +
    `words/example sentences in ${targetLanguage}'s own script. You can: explain grammar and vocabulary, ` +
    `correct sentences the learner writes, give practice questions, and translate or explain words. ` +
    `Keep a warm, encouraging, simple tone — this learner may be a beginner reader. This is a multi-turn ` +
    `conversation; use the earlier messages for context on follow-up questions.`;

  // Gemini's roles are "user" and "model" (not "assistant").
  const contents = [
    ...history
      .filter((m) => m?.text)
      .map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] })),
    { role: "user", parts: [{ text: question }] },
  ];

  return callGemini({ system, contents, maxTokens: 500 });
}

/**
 * Generates multiple-choice vocabulary questions in the target language.
 * Used by GET /api/assessment/:targetLanguage. Returns null on any
 * failure so the route falls back to the static/merged curriculum bank —
 * never throws.
 */
export async function generateAssessmentQuestions({ targetLanguage, count = 5 }) {
  const system =
    `You write vocabulary quiz questions for a beginner-to-intermediate literacy app. ` +
    `Respond with ONLY a JSON array, no prose, no markdown fences. Each item: ` +
    `{"prompt": "<word in ${targetLanguage}>", "options": ["<4 short English meanings>"], "correct": <index 0-3>}. ` +
    `Words should be common, everyday vocabulary appropriate for a beginner.`;

  try {
    const raw = await callGemini({
      system,
      contents: [{ role: "user", parts: [{ text: `Generate exactly ${count} questions for someone learning ${targetLanguage}.` }] }],
      maxTokens: 800,
    });

    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const questions = JSON.parse(cleaned);

    const valid = Array.isArray(questions) && questions.every(
      (q) => q.prompt && Array.isArray(q.options) && q.options.length === 4 &&
        Number.isInteger(q.correct) && q.correct >= 0 && q.correct <= 3
    );

    return valid ? questions : null;
  } catch (err) {
    console.warn("AI assessment generation failed, falling back to curriculum bank:", err.message);
    return null;
  }
}

/**
 * A short personalized micro-lesson tip based on level/weak words — powers
 * the "Lingo AI Companion" box / "Recommended for You" section. Used by
 * GET /api/learning-path. Returns null on failure — never throws.
 */
export async function generatePersonalizedLesson({ targetLanguage, preferredLanguage, level, weakWords }) {
  const system =
    `You are a language-learning coach. Write ONE short, warm, encouraging tip (2-3 sentences, plain text, ` +
    `no markdown) in ${preferredLanguage} for a ${level}-level learner of ${targetLanguage}. ` +
    `If weak words are given, focus the tip on practicing those specific words.`;

  const prompt = weakWords?.length
    ? `Words they're struggling with: ${weakWords.join(", ")}.`
    : `They haven't taken a test yet — give a general encouraging tip to get started.`;

  try {
    const text = await callGemini({
      system,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      maxTokens: 200,
    });
    return text || null;
  } catch (err) {
    console.warn("AI personalized lesson generation failed:", err.message);
    return null;
  }
}

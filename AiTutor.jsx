// src/AiTutor.jsx
//
// Chat-style AI tutor for learner doubts. Uses the EXISTING backend —
// askAiHelp() in learningApi.js already calls POST /api/ai-help, which
// your real aiHelp.js route answers via services/aiContent.js (your
// existing Claude/Anthropic integration, gated by ANTHROPIC_API_KEY).
// Nothing on the backend needed to change for this component to work.
//
// If ANTHROPIC_API_KEY isn't configured server-side, aiHelp.js already
// returns { aiEnabled: false, answer: null } — this component shows a
// clear "not available right now" message in that case rather than
// erroring, matching the graceful-degradation pattern used everywhere
// else in this app (pronounce.js, translateService.js).

import { useState, useRef, useEffect } from "react";
import { askAiHelp } from "./learningApi";

function AiTutor({ ui, targetLanguage }) {
  const [messages, setMessages] = useState([]); // { role: "user" | "tutor", text }
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [disabled, setDisabled] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || sending) return;

    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setSending(true);
    setError("");

    try {
      const { aiEnabled, answer } = await askAiHelp(question);
      if (!aiEnabled) {
        setDisabled(true);
        setMessages((m) => [
          ...m,
          { role: "tutor", text: "The AI tutor isn't available right now — ask your teacher or try again later." },
        ]);
      } else {
        setMessages((m) => [...m, { role: "tutor", text: answer }]);
      }
    } catch (err) {
      setError(err.message || "Couldn't reach the AI tutor.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="plan-card">
      <h2>🤖 {ui?.aiTutorTitle || "AI Tutor"}</h2>
      <p className="plan-note">
        {ui?.aiTutorSubtitle || `Ask a question about ${targetLanguage} and get a quick explanation.`}
      </p>

      <div className="ai-tutor-thread">
        {messages.length === 0 && (
          <p className="plan-note">
            {ui?.aiTutorEmpty || "Try asking something like “what does this word mean?” or “how do I say hello?”"}
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`ai-tutor-msg ${m.role}`}>
            <span className="ai-tutor-badge">{m.role === "user" ? "You" : "🤖"}</span>
            <p>{m.text}</p>
          </div>
        ))}

        {sending && (
          <div className="ai-tutor-msg tutor">
            <span className="ai-tutor-badge">🤖</span>
            <p className="ai-tutor-typing">…</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      <form className="ai-help-form" onSubmit={send}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={ui?.aiTutorPlaceholder || "Type your question…"}
          disabled={disabled}
        />
        <button type="submit" className="primary-button" disabled={disabled || sending || !input.trim()}>
          {sending ? "…" : "Ask"}
        </button>
      </form>
    </section>
  );
}

export default AiTutor;

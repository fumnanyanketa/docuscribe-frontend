// App.jsx — DocuScribe Frontend
// Document intelligence tool — by Fumnanya

import { useState, useRef } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

// ── Upload states ──────────────────────────────────────────────────
const STATES = {
  IDLE: "idle",
  UPLOADING: "uploading",
  READY: "ready",
  ASKING: "asking",
  ERROR: "error",
};

export default function App() {
  const [appState, setAppState] = useState(STATES.IDLE);
  const [sessionId, setSessionId] = useState(null);
  const [wordCount, setWordCount] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // ── Upload handler ───────────────────────────────────────────────
  const handleUpload = async (file) => {
    if (!file) return;

    // Validate file type before sending
    if (!file.name.endsWith(".pdf") && !file.name.endsWith(".docx")) {
      setError("Please upload a PDF or DOCX file.");
      setAppState(STATES.ERROR);
      return;
    }

    setFileName(file.name);
    setAppState(STATES.UPLOADING);
    setError("");
    setAnswer("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed.");
      }

      setSessionId(data.session_id);
      setWordCount(data.word_count);
      setAppState(STATES.READY);
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
      setAppState(STATES.ERROR);
    }
  };

  // ── Question handler ─────────────────────────────────────────────
  const handleAsk = async () => {
    if (!question.trim() || !sessionId) return;

    setAppState(STATES.ASKING);
    setAnswer("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to get answer.");
      }

      setAnswer(data.answer);
      setAppState(STATES.READY);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setAppState(STATES.ERROR);
    }
  };

  // ── Drag and drop handlers ───────────────────────────────────────
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  // ── Reset to start fresh ─────────────────────────────────────────
  const handleReset = () => {
    setAppState(STATES.IDLE);
    setSessionId(null);
    setWordCount(null);
    setFileName(null);
    setQuestion("");
    setAnswer("");
    setError("");
  };

  // ── Format answer — converts markdown-style to readable text ─────
  const formatAnswer = (text) => {
    return text
      .replace(/^#{1,3}\s+(.+)$/gm, "<strong>$1</strong>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^-\s+(.+)$/gm, "• $1")
      .replace(/\n\n/g, "<br/><br/>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <div className="app">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo-block">
            <h1 className="logo">DocuScribe</h1>
            <span className="byline">by Fumnanya</span>
          </div>
          <p className="tagline">
            Upload any legal document. Ask anything. Get plain-language answers.
          </p>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="main">

        {/* ── IDLE STATE — Upload area ─────────────────────────── */}
        {(appState === STATES.IDLE || appState === STATES.ERROR) && (
          <div className="upload-section">
            <div
              className={`drop-zone ${dragOver ? "drag-active" : ""}`}
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="drop-icon">⬆</div>
              <p className="drop-primary">Drop your document here</p>
              <p className="drop-secondary">
                or click to browse — PDF and DOCX supported
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                style={{ display: "none" }}
                onChange={(e) => handleUpload(e.target.files[0])}
              />
            </div>

            {appState === STATES.ERROR && (
              <div className="error-banner">
                <span>⚠ {error}</span>
                <button className="reset-btn" onClick={handleReset}>
                  Try again
                </button>
              </div>
            )}

            <div className="use-cases">
              <span>Good for:</span>
              <span className="tag">Contracts</span>
              <span className="tag">NDAs</span>
              <span className="tag">Service agreements</span>
              <span className="tag">Grant documents</span>
              <span className="tag">Terms of service</span>
            </div>
          </div>
        )}

        {/* ── UPLOADING STATE ──────────────────────────────────── */}
        {appState === STATES.UPLOADING && (
          <div className="status-section">
            <div className="spinner" />
            <p className="status-text">Reading your document...</p>
            <p className="status-sub">{fileName}</p>
          </div>
        )}

        {/* ── READY STATE — Q&A interface ──────────────────────── */}
        {(appState === STATES.READY || appState === STATES.ASKING) && (
          <div className="qa-section">
            {/* Document info bar */}
            <div className="doc-bar">
              <div className="doc-info">
                <span className="doc-icon">📄</span>
                <span className="doc-name">{fileName}</span>
                <span className="doc-words">{wordCount?.toLocaleString()} words</span>
              </div>
              <button className="new-doc-btn" onClick={handleReset}>
                New document
              </button>
            </div>

            {/* Question input */}
            <div className="question-block">
              <textarea
                className="question-input"
                placeholder="Ask anything about this document — in plain language..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                disabled={appState === STATES.ASKING}
                rows={3}
              />
              <button
                className="ask-btn"
                onClick={handleAsk}
                disabled={
                  appState === STATES.ASKING || !question.trim()
                }
              >
                {appState === STATES.ASKING ? (
                  <span className="btn-loading">Analysing...</span>
                ) : (
                  "Ask"
                )}
              </button>
            </div>

            {/* Suggested questions */}
            {!answer && appState !== STATES.ASKING && (
              <div className="suggestions">
                <p className="suggestions-label">Try asking:</p>
                <div className="suggestion-chips">
                  {[
                    "What is this document about?",
                    "Who are the parties involved?",
                    "What are the key obligations?",
                    "Are there any termination clauses?",
                    "What are the payment terms?",
                    "Are there any unusual clauses I should know about?",
                  ].map((q) => (
                    <button
                      key={q}
                      className="chip"
                      onClick={() => setQuestion(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Asking state */}
            {appState === STATES.ASKING && (
              <div className="thinking-block">
                <div className="thinking-dots">
                  <span /><span /><span />
                </div>
                <p>DocuScribe is reading the relevant sections...</p>
              </div>
            )}

            {/* Answer */}
            {answer && appState === STATES.READY && (
              <div className="answer-block">
                <div className="answer-label">Answer</div>
                <div
                  className="answer-text"
                  dangerouslySetInnerHTML={{
                    __html: formatAnswer(answer),
                  }}
                />
                <button
                  className="copy-btn"
                  onClick={() => navigator.clipboard.writeText(answer)}
                >
                  Copy answer
                </button>
              </div>
            )}

            {/* Error in QA state */}
            {appState === STATES.ERROR && (
              <div className="error-banner">
                <span>⚠ {error}</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="footer">
        <p>
          DocuScribe does not store your documents permanently. 
          Always seek qualified legal advice for important decisions.
        </p>
      </footer>
    </div>
  );
}
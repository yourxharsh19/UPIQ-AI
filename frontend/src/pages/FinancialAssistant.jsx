import { useEffect, useRef, useState } from "react";
import { AlertTriangle, BadgeCheck, Bot, Send, UserRound, Info } from "lucide-react";
import FinancialChatService from "../services/financial-chat.service";

const EXAMPLES = [
  "How much did I spend this month?",
  "What was my largest expense?",
  "How much did I spend on Food?",
  "Compare my expenses with last month",
];

const formatValue = (value) => {
  if (value == null) return "Not available";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export default function FinancialAssistant() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const sendQuestion = async (submittedQuestion = question) => {
    const text = submittedQuestion.trim();
    if (!text || loading) return;

    setQuestion("");
    setRequestError("");
    setMessages((current) => [...current, { role: "user", text }]);
    setLoading(true);
    try {
      const envelope = await FinancialChatService.ask(text);
      const result = envelope?.data;
      setMessages((current) => [...current, {
        role: "assistant",
        text: result?.answer || "I couldn't prepare a response. Please try again.",
        result,
      }]);
    } catch {
      setRequestError("The financial assistant is unavailable right now. Your dashboard is still available.");
      setMessages((current) => [...current, {
        role: "assistant",
        text: "I couldn't reach the financial assistant. Please try again in a moment.",
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-4xl flex-col gap-4">
      <header className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Bot size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-main)]">Financial Assistant</h1>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
              Ask about income, expenses, category spending, monthly comparisons, trends, net balance, and your largest transactions. Answers use verified calculations from your ledger.
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-200 flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800 dark:text-amber-300">Financial Assistant Limits & Supported Intents</p>
          <p className="text-[11px] text-amber-700/90 dark:text-amber-200/90 mt-0.5">
            Only supported ledger intents are answered (income, expenses, category spending, monthly comparisons, spending trends, net balance, and largest transactions). AI explanations require the backend server and a local Ollama instance.
          </p>
        </div>
      </div>

      <section className="flex min-h-[26rem] flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] shadow-xs" aria-label="Financial assistant conversation">
        <div className="flex items-center justify-between border-b border-[var(--border-base)] px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600"><BadgeCheck size={16} /></span>
            <div><p className="text-xs font-semibold text-[var(--text-main)]">Verified Ledger Flow</p><p className="text-[11px] text-[var(--text-muted)]">Deterministic calculations with AI explanation</p></div>
          </div>
          <span className="hidden rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 sm:inline-flex">Private to your account</span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite" aria-relevant="additions">
          {messages.length === 0 ? (
            <div className="mx-auto flex min-h-64 max-w-lg flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-surface)] text-blue-600 dark:text-blue-400 border border-[var(--border-base)]"><Bot size={20} /></div>
              <h2 className="text-sm font-semibold text-[var(--text-main)]">What would you like to explore?</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Choose a sample question or type your own below.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {EXAMPLES.map((example) => (
                  <button key={example} type="button" onClick={() => sendQuestion(example)} disabled={loading}
                    className="rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-main)] hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 cursor-pointer">
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : messages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`flex gap-2.5 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${message.role === "user" ? "bg-blue-600 text-white" : message.error || message.result?.error ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                {message.role === "user" ? <UserRound size={15} /> : message.error || message.result?.error ? <AlertTriangle size={15} /> : <Bot size={15} />}
              </div>
              <div className={`max-w-[85%] min-w-0 ${message.role === "user" ? "text-right" : ""}`}>
                <p className={`inline-block whitespace-pre-wrap break-words rounded-lg px-3.5 py-2.5 text-left text-xs sm:text-sm leading-relaxed ${message.role === "user" ? "bg-blue-600 text-white" : "border border-[var(--border-base)] bg-[var(--bg-surface)] text-[var(--text-main)]"}`}>
                  {message.text}
                </p>
                {message.role === "assistant" && message.result && (
                  <div className="mt-2 space-y-1.5 text-left">
                    {message.result.calculationType && <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Verified calculation · {message.result.calculationType.replaceAll("_", " ")}</p>}
                    {message.result.financialContext?.facts && (
                      <details className="rounded-lg border border-[var(--border-base)] bg-[var(--bg-card)] p-2.5">
                        <summary className="cursor-pointer text-xs font-medium text-[var(--text-muted)]">View verified facts</summary>
                        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                          {Object.entries(message.result.financialContext.facts).map(([key, value]) => (
                            <div key={key} className="min-w-0"><dt className="text-[10px] font-medium text-[var(--text-muted)] uppercase">{key.replaceAll("_", " ")}</dt><dd className="break-words text-xs font-semibold text-[var(--text-main)]">{formatValue(value)}</dd></div>
                          ))}
                        </dl>
                        <p className="mt-2 text-[10px] text-[var(--text-muted)]">Source: deterministic financial calculation</p>
                      </details>
                    )}
                    {message.result.model && <p className="text-[10px] text-[var(--text-muted)]">Explained by {message.result.model}{message.result.latencyMs != null ? ` · ${message.result.latencyMs} ms` : ""}</p>}
                    {message.result.error && <p role="alert" className="text-xs text-amber-700 dark:text-amber-400">AI explanation unavailable; verified facts are still shown above.</p>}
                  </div>
                )}
              </div>
            </article>
          ))}
          {loading && (
            <div className="flex items-center gap-2.5" role="status" aria-live="polite">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><Bot size={15} /></span>
              <div className="rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs text-[var(--text-muted)]">
                <span className="animate-pulse">Checking verified financial data and preparing an explanation…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {requestError && <p role="alert" className="border-t border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">{requestError}</p>}
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-[var(--border-base)] px-4 py-2.5">
            {EXAMPLES.slice(1, 3).map((example) => (
              <button key={example} type="button" onClick={() => sendQuestion(example)} disabled={loading} className="rounded-md border border-[var(--border-base)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-blue-600 disabled:opacity-50 cursor-pointer">
                {example}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={(event) => { event.preventDefault(); sendQuestion(); }} className="flex items-end gap-2.5 border-t border-[var(--border-base)] p-3 sm:p-4">
          <label htmlFor="financial-question" className="sr-only">Ask a financial question</label>
          <textarea id="financial-question" value={question} onChange={(event) => setQuestion(event.target.value)} rows={1} maxLength={500}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendQuestion(); } }}
            placeholder="Ask about your income, spending, or transactions…" disabled={loading}
            className="max-h-28 min-h-10 flex-1 resize-y rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] px-3 py-2 text-xs sm:text-sm text-[var(--text-main)] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:opacity-60" />
          <button type="submit" disabled={!question.trim() || loading} aria-label="Send question"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"><Send size={16} /></button>
        </form>
      </section>
    </div>
  );
}

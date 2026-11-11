import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Volume2, Info } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { QuickPromptPills } from '../components/ai/QuickPromptPills';
import { Button } from '../components/common/Button';
import { FinancialChatService } from '../services/financial-chat.service';
import { requestFinancialChatAnswer } from '../utils/financialChat.js';

export const AIAssistant = () => {
  const { aiPromptQuery, setAiPromptQuery, transactions } = useFinancial();

  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Hello! I am your UPIQ Finance Assistant. I can answer questions on supported financial ledger intents: income, expenses, category spending, monthly summaries, period comparisons, spending trends, net balance, and largest transactions. AI-generated answers require the backend server and Ollama to be running.',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle incoming query from search bar or header
  useEffect(() => {
    if (aiPromptQuery) {
      handleSend(aiPromptQuery);
      setAiPromptQuery('');
    }
  }, [aiPromptQuery]);

  const generateAiResponse = async (userMsg, appendUserMessage = true) => {
    if (isTyping || !userMsg.trim()) return;
    setIsTyping(true);
    if (appendUserMessage) {
      setMessages((prev) => [...prev, {
        id: `usr-${Date.now()}`,
        sender: 'user',
        text: userMsg,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }]);
      if (userMsg === inputText) setInputText('');
    }
    try {
      const result = await requestFinancialChatAnswer(FinancialChatService.ask, userMsg);
      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.success ? result.answer : result.error,
        retryQuestion: result.success ? undefined : userMsg,
        isError: !result.success,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (textToSend = inputText) => {
    if (!textToSend.trim()) return;
    generateAiResponse(textToSend);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] shadow-xs overflow-hidden transition-colors">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[var(--border-base)] bg-[var(--bg-card)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-1.5">
              Financial Assistant
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">Conversational analysis of your financial ledger</p>
          </div>
        </div>
      </div>

      {/* Financial Assistant Limits Banner */}
      <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-700 dark:text-amber-200 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-800 dark:text-amber-300">Financial Assistant Limits & Supported Intents</p>
          <p className="text-[11px] text-amber-700/90 dark:text-amber-200/90 mt-0.5">
            Supports financial ledger queries only (income, expenses, category spending, period comparisons, summaries, spending trends, and net balance). AI answers require the backend server and Ollama to be running.
          </p>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 max-w-2xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-base)]'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`rounded-lg p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-main)]'
              }`}
            >
              <div className="whitespace-pre-line" role={msg.isError ? 'alert' : undefined}>{msg.text}</div>
              {msg.retryQuestion && (
                <button
                  type="button"
                  onClick={() => generateAiResponse(msg.retryQuestion, false)}
                  disabled={isTyping}
                  className="mt-2 underline underline-offset-2 text-xs font-medium disabled:opacity-50 cursor-pointer"
                >
                  Retry query
                </button>
              )}
              <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-[var(--border-base)] text-[10px] opacity-70">
                <span>{msg.timestamp}</span>
                {msg.sender === 'ai' && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="hover:underline flex items-center gap-1 cursor-pointer"
                    title="Read response aloud"
                  >
                    <Volume2 className="w-3 h-3" /> Listen
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-base)] px-3 py-2 rounded-lg max-w-xs">
            <span className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span role="status" aria-live="polite">Preparing verified answer...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="px-5 py-2 border-t border-[var(--border-base)] bg-[var(--bg-surface)]">
        {!transactions.length && (
          <p className="mb-1.5 text-xs text-[var(--text-muted)]">
            Import transactions to query your spending ledger. General finance education queries are also supported.
          </p>
        )}
        <QuickPromptPills transactions={transactions} onSelectPrompt={(p) => handleSend(p)} />
      </div>

      {/* Bottom Input Field */}
      <div className="p-3 border-t border-[var(--border-base)] bg-[var(--bg-card)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            disabled={isTyping}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question about your ledger... (e.g. 'How much did I spend this month?')"
            className="flex-1 px-3.5 py-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-colors"
          />
          <Button type="submit" variant="primary" size="md" icon={Send} disabled={isTyping}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};

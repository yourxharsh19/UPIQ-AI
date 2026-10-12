import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Sparkles, Volume2 } from 'lucide-react';
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
      text: 'Hello! I am your UPIQ Finance Assistant. Ask general financial education questions, or ask about your recorded income, expenses, category spending, monthly summaries, period comparisons, spending trends, net balance, or largest expenses.',
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
    <div className="h-[calc(100vh-140px)] flex flex-col rounded-2xl glass-panel border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 light:bg-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 light:text-slate-900 flex items-center gap-2">
              UPIQ Finance Intelligence
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h3>
            <p className="text-xs text-slate-400">Conversational Financial Analytics</p>
          </div>
        </div>

      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 max-w-2xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`rounded-2xl p-4 text-xs md:text-sm leading-relaxed shadow-lg ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 light:bg-white light:border-slate-200 light:text-slate-800 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-line" role={msg.isError ? 'alert' : undefined}>{msg.text}</div>
              {msg.retryQuestion && (
                <button
                  type="button"
                  onClick={() => generateAiResponse(msg.retryQuestion, false)}
                  disabled={isTyping}
                  className="mt-3 underline underline-offset-2 disabled:opacity-50"
                >
                  Retry
                </button>
              )}
              <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-white/10 text-[10px] opacity-70">
                <span>{msg.timestamp}</span>
                {msg.sender === 'ai' && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="hover:text-white flex items-center gap-1"
                    title="Read response aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Listen
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-4 py-2.5 rounded-xl max-w-xs animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span role="status" aria-live="polite">Waiting for a verified answer...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="px-6 py-2 border-t border-slate-800/40 bg-slate-950/40 light:bg-slate-50">
      {!transactions.length && <p className="mb-2 text-xs text-slate-400">Import transactions to ask about your personal spending. General financial education questions remain available.</p>}
        <QuickPromptPills transactions={transactions} onSelectPrompt={(p) => handleSend(p)} />
      </div>

      {/* Bottom Input Field */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80 light:bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={inputText}
            disabled={isTyping}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask anything about your money... (e.g. 'Did I overspend on shopping?')"
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs md:text-sm text-slate-100 placeholder:text-slate-500 light:bg-slate-100 light:border-slate-300 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button type="submit" variant="ai" icon={Send} disabled={isTyping}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};

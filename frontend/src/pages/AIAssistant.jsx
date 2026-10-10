import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Sparkles, Volume2 } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { VoiceRipple } from '../components/ai/VoiceRipple';
import { QuickPromptPills } from '../components/ai/QuickPromptPills';
import { Button } from '../components/common/Button';
import { FinancialChatService } from '../services/financial-chat.service';

export const AIAssistant = () => {
  const { aiPromptQuery, setAiPromptQuery, transactions, kpi, formatCurrency } = useFinancial();

  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'ai',
      text: "Hello ! I am your UPIQ AI Finance Assistant. Ask me anything about your cash flow, recurring bills, budget limits, or suspicious charges.",
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const { isListening, transcript, startListening, stopListening } = useVoiceInput((finalSpeech) => {
    handleSend(finalSpeech);
  });

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

  const generateAiResponse = async (userMsg) => {
    const lower = userMsg.toLowerCase();
    setIsTyping(true);

    try {
      const res = await FinancialChatService.ask(userMsg);
      const answerText = res?.data?.answer || res?.data?.data?.answer || res?.data?.response || res?.data?.message;
      if (answerText) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: answerText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setIsTyping(false);
        return;
      }
    } catch {
      // Backend unavailable; use client-side heuristic response engine
    }

    setTimeout(() => {
      let replyText = "";

      if (lower.includes('dining') || lower.includes('food') || lower.includes('eat')) {
        const diningTotal = transactions
          .filter((t) => t.category === 'Food & Dining')
          .reduce((acc, t) => acc + t.amount, 0);
        replyText = `Based on your recent transactions, you have spent **${formatCurrency(diningTotal)}** on **Food & Dining** this month across ${
          transactions.filter((t) => t.category === 'Food & Dining').length
        } transactions (including Starbucks, Whole Foods). You are at **86.3%** of your ${formatCurrency(1100)} dining budget.`;
      } else if (lower.includes('budget') || lower.includes('track') || lower.includes('limit')) {
        replyText = `Here is your AI Budget Analysis:\n\n• **Total Spent:** ${formatCurrency(kpi.monthlyExpense)} of ${formatCurrency(6500)} budgeted.\n• **Warning Category:** Shopping is currently **Over Budget** by ${formatCurrency(120)}.\n• **On Track:** Bills, Transport, and Entertainment are well within standard variance boundaries.`;
      } else if (lower.includes('irregular') || lower.includes('fraud') || lower.includes('suspicious') || lower.includes('anomaly')) {
        replyText = `I have detected **2 irregular activities**:\n1. **${formatCurrency(1850)}** transfer to CryptoEx Global (Offshore IP, Risk Score 94%).\n2. **${formatCurrency(19.99)}** duplicate charge from Netflix within 12 minutes.\n\nYou can review and freeze these from the **Suspicious Activity Center**.`;
      } else if (lower.includes('summarize') || lower.includes('week') || lower.includes('month')) {
        replyText = `**September Financial Summary:**\n- **Net Savings:** ${formatCurrency(kpi.projectedSavings)} (${kpi.savingsChange} vs Aug)\n- **Top Expense:** Rent & Housing (${formatCurrency(1800)})\n- **Financial Health Score:** 94/100 (Optimal liquidity and debt management).`;
      } else {
        replyText = `I've analyzed your financial ledger regarding "${userMsg}". Your current total balance is **${formatCurrency(kpi.totalBalance)}**, with a healthy monthly savings rate of **58.7%**. Would you like me to generate a full breakdown or forecast next month's cash flow?`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 600);
  };

  const handleSend = (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (textToSend === inputText) setInputText('');
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
            <p className="text-xs text-slate-400">Conversational Web Speech & Financial Analytics</p>
          </div>
        </div>

        <VoiceRipple
          isListening={isListening}
          onToggle={() => (isListening ? stopListening() : startListening())}
        />
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
              <div className="whitespace-pre-line">{msg.text}</div>
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
            <span>UPIQ AI is analyzing cash flow...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="px-6 py-2 border-t border-slate-800/40 bg-slate-950/40 light:bg-slate-50">
        <QuickPromptPills onSelectPrompt={(p) => handleSend(p)} />
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
            value={isListening ? transcript || 'Listening to your voice...' : inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask anything about your money... (e.g. 'Did I overspend on shopping?')"
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs md:text-sm text-slate-100 placeholder:text-slate-500 light:bg-slate-100 light:border-slate-300 light:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button type="submit" variant="ai" icon={Send}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};

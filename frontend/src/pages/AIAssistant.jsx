import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Volume2, VolumeX, Info, Mic, MicOff } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { QuickPromptPills } from '../components/ai/QuickPromptPills';
import { Button } from '../components/common/Button';
import { FinancialChatService } from '../services/financial-chat.service';
import { requestFinancialChatAnswer } from '../utils/financialChat.js';
import { getAuthSessionMode } from '../utils/authFlow.js';
import {
  createVoiceRecognition,
  getSpeechCapabilities,
  getSpeechErrorMessage,
  isVoiceChatAuthenticated,
  startSpeechPlayback,
  stopSpeechPlayback,
  submitVoiceTranscript,
} from '../utils/voiceAssistant.js';

export const AIAssistant = () => {
  const { aiPromptQuery, setAiPromptQuery, transactions, chatMessages: messages, appendChatMessage } = useFinancial();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [speechCapabilities] = useState(() => getSpeechCapabilities(
    typeof window === 'undefined' ? null : window,
  ));
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const recognitionSessionRef = useRef(0);
  const speechRequestRef = useRef(0);
  const speakingMessageRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => () => {
    recognitionSessionRef.current += 1;
    try { recognitionRef.current?.stop(); } catch {}
    stopSpeechPlayback(typeof window === 'undefined' ? null : window);
  }, []);

  // Handle incoming query from search bar or header
  useEffect(() => {
    if (aiPromptQuery) {
      handleSend(aiPromptQuery);
      setAiPromptQuery('');
    }
  }, [aiPromptQuery]);

  const stopListening = () => {
    recognitionSessionRef.current += 1;
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    setIsListening(false);
  };

  const generateAiResponse = async (userMsg, appendUserMessage = true) => {
    if (isTyping || !userMsg.trim()) return;
    setIsTyping(true);
    if (appendUserMessage) {
      appendChatMessage({
        id: `usr-${Date.now()}`,
        sender: 'user',
        text: userMsg,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
      if (userMsg === inputText) setInputText('');
    }
    try {
      const result = await requestFinancialChatAnswer(FinancialChatService.ask, userMsg);
      appendChatMessage({
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.success ? result.answer : result.error,
        retryQuestion: result.success ? undefined : userMsg,
        isError: !result.success,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (textToSend = inputText) => {
    if (!textToSend.trim()) return;
    if (recognitionRef.current) stopListening();
    generateAiResponse(textToSend);
  };

  const startListening = () => {
    setVoiceError('');
    if (isTyping) return;
    if (!isVoiceChatAuthenticated(getAuthSessionMode())) {
      setVoiceError('Sign in to a backend account before sending voice questions to the assistant.');
      return;
    }
    const browser = typeof window === 'undefined' ? null : window;
    const sessionId = recognitionSessionRef.current + 1;
    recognitionSessionRef.current = sessionId;
    const recognition = createVoiceRecognition(browser, {
      onTranscript: (transcript) => {
        if (recognitionSessionRef.current !== sessionId) return;
        recognitionRef.current = null;
        setIsListening(false);
        const submitted = submitVoiceTranscript(transcript, (recognizedText) => handleSend(recognizedText));
        if (!submitted) setVoiceError(getSpeechErrorMessage('empty'));
      },
      onError: (error) => {
        if (recognitionSessionRef.current === sessionId) setVoiceError(getSpeechErrorMessage(error));
      },
      onEnd: () => {
        if (recognitionSessionRef.current === sessionId) {
          recognitionRef.current = null;
          setIsListening(false);
        }
      },
    });
    if (!recognition) {
      setVoiceError('Voice input is not supported in this browser. You can still type your question.');
      return;
    }
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch (error) {
      recognitionSessionRef.current += 1;
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceError(getSpeechErrorMessage(error));
    }
  };

  const stopSpeaking = () => {
    speechRequestRef.current += 1;
    speakingMessageRef.current = null;
    stopSpeechPlayback(typeof window === 'undefined' ? null : window);
    setSpeakingMessageId(null);
  };

  const speakText = (text, messageId) => {
    if (speakingMessageRef.current === messageId) {
      stopSpeaking();
      return;
    }
    const browser = typeof window === 'undefined' ? null : window;
    const requestId = speechRequestRef.current + 1;
    speechRequestRef.current = requestId;
    const utterance = startSpeechPlayback(browser, text, {
      onStart: () => {
        if (speechRequestRef.current === requestId) {
          speakingMessageRef.current = messageId;
          setSpeakingMessageId(messageId);
          setVoiceError('');
        }
      },
      onEnd: () => {
        if (speechRequestRef.current === requestId) {
          speakingMessageRef.current = null;
          setSpeakingMessageId(null);
        }
      },
      onError: () => {
        if (speechRequestRef.current === requestId) {
          speakingMessageRef.current = null;
          setSpeakingMessageId(null);
          setVoiceError('Speech playback stopped unexpectedly.');
        }
      },
    });
    if (!utterance) setVoiceError('Speech playback is not supported in this browser.');
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
                    type="button"
                    onClick={() => speakText(msg.text, msg.id)}
                    disabled={!speechCapabilities.speechPlayback}
                    className="hover:underline flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={speakingMessageId === msg.id ? 'Stop speech playback' : 'Read response aloud'}
                    title={speechCapabilities.speechPlayback ? 'Read response aloud or stop playback' : 'Speech playback is not supported in this browser'}
                  >
                    {speakingMessageId === msg.id ? <><VolumeX className="w-3 h-3" /> Stop</> : <><Volume2 className="w-3 h-3" /> Listen</>}
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
        {voiceError && <p role="alert" className="px-1 pb-2 text-xs text-rose-600 dark:text-rose-400">{voiceError}</p>}
        {isListening && <p role="status" aria-live="polite" className="px-1 pb-2 text-xs text-blue-600 dark:text-blue-400">Listening… speak your question. Recording stops when speech ends.</p>}
        {!speechCapabilities.speechToText && <p role="status" className="px-1 pb-2 text-xs text-[var(--text-muted)]">Voice input is unavailable in this browser. You can still type your question.</p>}
        {!speechCapabilities.speechPlayback && <p role="status" className="px-1 pb-2 text-xs text-[var(--text-muted)]">Speech playback is unavailable in this browser.</p>}
        <p className="px-1 pb-2 text-[10px] text-[var(--text-muted)]">Voice recognition uses your browser’s speech service; its audio processing is subject to that browser’s privacy settings.</p>
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
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={!speechCapabilities.speechToText || isTyping}
            aria-label={isListening ? 'Stop voice recording' : 'Start voice recording'}
            aria-pressed={isListening}
            title={!speechCapabilities.speechToText ? 'Voice input is not supported in this browser' : isListening ? 'Stop recording' : 'Start voice input'}
            className={`rounded-lg border px-3 py-2 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isListening ? 'border-rose-500/40 bg-rose-500/10 text-rose-600' : 'border-[var(--border-base)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'}`}
          >
            {isListening ? <><MicOff className="inline h-4 w-4" aria-hidden="true" /> <span className="sr-only">Stop recording</span></>
              : <><Mic className="inline h-4 w-4" aria-hidden="true" /> <span className="sr-only">Start recording</span></>}
          </button>
          <Button type="submit" variant="primary" size="md" icon={Send} disabled={isTyping}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};

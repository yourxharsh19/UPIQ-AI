export const getSpeechCapabilities = (browser) => ({
  speechToText: Boolean(browser?.SpeechRecognition || browser?.webkitSpeechRecognition),
  speechPlayback: Boolean(browser?.speechSynthesis && browser?.SpeechSynthesisUtterance),
});

export const getSpeechRecognitionConstructor = (browser) =>
  browser?.SpeechRecognition || browser?.webkitSpeechRecognition || null;

export const isVoiceChatAuthenticated = (sessionMode) => sessionMode === 'authenticated';

export const getSpeechErrorMessage = (error) => {
  const code = typeof error === 'string' ? error : error?.error || error?.name;
  const messages = {
    'not-allowed': 'Microphone permission was denied. Allow microphone access in your browser to use voice input.',
    'service-not-allowed': 'The browser speech recognition service is unavailable or not allowed.',
    NotAllowedError: 'Microphone permission was denied. Allow microphone access in your browser to use voice input.',
    'audio-capture': 'No usable microphone was found. Check your microphone and try again.',
    'no-speech': 'No speech was detected. Try speaking closer to your microphone.',
    network: 'Browser speech recognition could not connect. Check your connection and try again.',
    'language-not-supported': 'This browser does not support the selected recognition language.',
    empty: 'No words were recognized. Please try again.',
  };
  return messages[code] || 'Voice input could not be started. Please try again or type your question.';
};

export const extractVoiceTranscript = (event) => {
  const results = event?.results;
  if (!results || typeof results.length !== 'number') return '';
  let transcript = '';
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    if (result?.isFinal === false) continue;
    const text = result?.[0]?.transcript;
    if (typeof text === 'string') transcript += `${transcript ? ' ' : ''}${text}`;
  }
  return transcript.trim();
};

export const submitVoiceTranscript = (transcript, sendMessage) => {
  const text = typeof transcript === 'string' ? transcript.trim() : '';
  if (!text || typeof sendMessage !== 'function') return false;
  sendMessage(text);
  return true;
};

export const createVoiceRecognition = (browser, callbacks = {}) => {
  const Recognition = getSpeechRecognitionConstructor(browser);
  if (!Recognition) return null;
  const recognition = new Recognition();
  recognition.lang = 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const transcript = extractVoiceTranscript(event);
    if (transcript) callbacks.onTranscript?.(transcript);
    else callbacks.onError?.('empty');
  };
  recognition.onerror = (event) => {
    if (event?.error !== 'aborted') callbacks.onError?.(event?.error || 'unknown');
  };
  recognition.onend = () => callbacks.onEnd?.();
  return recognition;
};

export const startSpeechPlayback = (browser, text, callbacks = {}) => {
  const Utterance = browser?.SpeechSynthesisUtterance;
  if (!browser?.speechSynthesis || !Utterance || typeof text !== 'string' || !text.trim()) return false;
  const utterance = new Utterance(text.replace(/[*#]/g, ''));
  utterance.onstart = callbacks.onStart;
  utterance.onend = callbacks.onEnd;
  utterance.onerror = callbacks.onError;
  browser.speechSynthesis.cancel();
  browser.speechSynthesis.speak(utterance);
  return utterance;
};

export const stopSpeechPlayback = (browser) => {
  if (!browser?.speechSynthesis) return false;
  browser.speechSynthesis.cancel();
  return true;
};

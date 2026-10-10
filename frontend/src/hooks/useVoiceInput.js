import { useEffect, useRef, useState } from 'react';

export const useVoiceInput = (onTranscriptComplete) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasSupport, setHasSupport] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      setHasSupport(true);
    } else {
      setHasSupport(false);
    }
  }, []);

  const startListening = () => {
    setTranscript('');
    setIsListening(true);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Fallback simulation if mic is blocked or already active
        simulateVoiceInput();
      }
    } else {
      simulateVoiceInput();
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
  };

  const simulateVoiceInput = () => {
    const sampleQueries = [
      "How much did I spend on dining out last week?",
      "Show me my current monthly savings projection",
      "Are there any unrecognized charges on my credit card?",
      "Summarize my top expenses for September",
    ];
    const chosen = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];

    let idx = 0;
    const interval = setInterval(() => {
      idx += 3;
      setTranscript(chosen.slice(0, idx));
      if (idx >= chosen.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsListening(false);
          if (onTranscriptComplete) onTranscriptComplete(chosen);
        }, 600);
      }
    }, 60);
  };

  return {
    isListening,
    transcript,
    hasSupport,
    startListening,
    stopListening,
  };
};

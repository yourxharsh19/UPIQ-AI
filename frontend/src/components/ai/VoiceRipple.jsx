import React from 'react';
import { Mic, MicOff } from 'lucide-react';

export const VoiceRipple = ({ isListening, onToggle }) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Ripple Rings */}
      {isListening && (
        <>
          <div className="absolute w-24 h-24 rounded-full bg-indigo-500/20 animate-ping pointer-events-none" />
          <div className="absolute w-16 h-16 rounded-full bg-purple-500/30 animate-pulse pointer-events-none" />
        </>
      )}

      <button
        onClick={onToggle}
        className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl ${
          isListening
            ? 'bg-rose-600 text-white shadow-rose-600/40 animate-bounce'
            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-purple-600/30 hover:scale-105'
        }`}
        title={isListening ? "Listening... click to stop" : "Start Voice Input"}
      >
        {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>
    </div>
  );
};

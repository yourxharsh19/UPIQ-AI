import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createVoiceRecognition,
  getSpeechCapabilities,
  getSpeechErrorMessage,
  isVoiceChatAuthenticated,
  startSpeechPlayback,
  stopSpeechPlayback,
  submitVoiceTranscript,
} from '../src/utils/voiceAssistant.js';

test('detects standard and prefixed browser speech APIs and reports unsupported capability', () => {
  class Recognition {}
  assert.deepEqual(getSpeechCapabilities({ SpeechRecognition: Recognition, speechSynthesis: {}, SpeechSynthesisUtterance: class {} }), {
    speechToText: true,
    speechPlayback: true,
  });
  assert.deepEqual(getSpeechCapabilities({ webkitSpeechRecognition: Recognition }), {
    speechToText: true,
    speechPlayback: false,
  });
  assert.deepEqual(getSpeechCapabilities({}), { speechToText: false, speechPlayback: false });
});

test('recognition configures one-shot English India input and forwards final transcript to chat', () => {
  class Recognition {}
  const events = [];
  const recognition = createVoiceRecognition({ SpeechRecognition: Recognition }, {
    onTranscript: (text) => events.push(text),
  });
  assert.equal(recognition.lang, 'en-IN');
  assert.equal(recognition.continuous, false);
  assert.equal(recognition.interimResults, false);
  recognition.onresult({ results: [Object.assign([{ transcript: '  How much did I spend?  ' }], { isFinal: true })] });

  const sent = [];
  assert.equal(submitVoiceTranscript(events[0], (text) => sent.push(text)), true);
  assert.deepEqual(sent, ['How much did I spend?']);
});

test('empty transcripts, microphone permission, missing hardware, and network failures have useful messages', () => {
  class Recognition {}
  let error;
  const recognition = createVoiceRecognition({ webkitSpeechRecognition: Recognition }, {
    onError: (value) => { error = value; },
  });
  recognition.onresult({ results: [] });
  assert.match(getSpeechErrorMessage(error), /No words were recognized/);
  assert.match(getSpeechErrorMessage('not-allowed'), /permission was denied/);
  assert.match(getSpeechErrorMessage('audio-capture'), /microphone was found/);
  assert.match(getSpeechErrorMessage('network'), /connection/);
  assert.equal(submitVoiceTranscript('   ', () => assert.fail('empty voice input must not send')), false);
});

test('voice chat is authenticated-only and the assistant routes recognized text to the existing send handler', () => {
  assert.equal(isVoiceChatAuthenticated('authenticated'), true);
  assert.equal(isVoiceChatAuthenticated('demo'), false);
  assert.equal(isVoiceChatAuthenticated('unauthenticated'), false);
  const source = readFileSync(resolve(process.cwd(), 'src/pages/AIAssistant.jsx'), 'utf8');
  assert.match(source, /submitVoiceTranscript\(transcript, \(recognizedText\) => handleSend\(recognizedText\)\)/);
  assert.match(source, /FinancialChatService\.ask/);
  assert.match(source, /appendChatMessage/);
});

test('speech playback can be started, stopped, and reports unavailable browser APIs', () => {
  const calls = [];
  class Utterance {
    constructor(text) { this.text = text; }
  }
  const browser = { SpeechSynthesisUtterance: Utterance, speechSynthesis: {
    cancel: () => calls.push('cancel'),
    speak: (utterance) => calls.push(utterance.text),
  } };
  const utterance = startSpeechPlayback(browser, '**Hello** assistant');
  assert.equal(utterance.text, 'Hello assistant');
  assert.deepEqual(calls, ['cancel', 'Hello assistant']);
  assert.equal(stopSpeechPlayback(browser), true);
  assert.equal(calls.at(-1), 'cancel');
  assert.equal(startSpeechPlayback({}, 'Hello'), false);
  assert.equal(stopSpeechPlayback({}), false);
});

test('assistant exposes accessible microphone and stop controls', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/pages/AIAssistant.jsx'), 'utf8');
  assert.match(source, /aria-label=\{isListening \? 'Stop voice recording' : 'Start voice recording'\}/);
  assert.match(source, /aria-label=\{speakingMessageId === msg\.id \? 'Stop speech playback' : 'Read response aloud'\}/);
  assert.match(source, /recognition\.start\(\)/);
  assert.match(source, /recognitionRef\.current\?\.stop\(\)/);
});

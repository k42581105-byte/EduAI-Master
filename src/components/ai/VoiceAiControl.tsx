import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Globe,
  Sparkles,
  BookMarked,
  HelpCircle as QuizIcon,
  AlertCircle,
  X,
  CheckCircle2,
  RefreshCw,
  Send
} from 'lucide-react';
import { VoiceService } from '../../services/voiceService';

interface VoiceAiControlProps {
  onTranscriptReady?: (transcript: string) => void;
  onVoiceAskAi?: (prompt: string) => void;
  onVoiceCreateNote?: (prompt: string) => void;
  onVoiceCreateQuiz?: (prompt: string) => void;
  latestAiResponse?: string;
  className?: string;
  compact?: boolean;
}

export const VoiceAiControl: React.FC<VoiceAiControlProps> = ({
  onTranscriptReady,
  onVoiceAskAi,
  onVoiceCreateNote,
  onVoiceCreateQuiz,
  latestAiResponse,
  className = '',
  compact = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState<'en-US' | 'hi-IN'>('en-US');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(VoiceService.isSpeechRecognitionSupported());
  }, []);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      VoiceService.stopListening();
      VoiceService.stopSpeaking();
    };
  }, []);

  // Toggle Microphone Recording
  const handleToggleListening = () => {
    setErrorMessage(null);

    if (isListening) {
      VoiceService.stopListening();
      setIsListening(false);
      return;
    }

    if (!VoiceService.isSpeechRecognitionSupported()) {
      setErrorMessage('Speech Recognition is not supported in this browser. Try Google Chrome, Edge, or Safari.');
      return;
    }

    VoiceService.startListening({
      lang: selectedLang,
      onStart: () => {
        setIsListening(true);
        setErrorMessage(null);
      },
      onResult: (text, isFinal) => {
        setTranscript(text);
        if (onTranscriptReady) {
          onTranscriptReady(text);
        }
      },
      onError: (msg) => {
        setIsListening(false);
        setErrorMessage(msg);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  // Speaker Controls (Text-to-Speech)
  const handleToggleSpeak = () => {
    if (!latestAiResponse) {
      setErrorMessage('No AI response available to speak out loud.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    if (isSpeaking && !isPaused) {
      VoiceService.pauseSpeaking();
      setIsPaused(true);
      return;
    }

    if (isSpeaking && isPaused) {
      VoiceService.resumeSpeaking();
      setIsPaused(false);
      return;
    }

    VoiceService.speakText(latestAiResponse, {
      lang: selectedLang,
      onStart: () => {
        setIsSpeaking(true);
        setIsPaused(false);
      },
      onEnd: () => {
        setIsSpeaking(false);
        setIsPaused(false);
      },
      onError: () => {
        setIsSpeaking(false);
        setIsPaused(false);
      }
    });
  };

  const handleStopSpeak = () => {
    VoiceService.stopSpeaking();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const handleClearTranscript = () => {
    setTranscript('');
    if (onTranscriptReady) onTranscriptReady('');
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Language Selector Pill */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs">
          <Globe className="w-3.5 h-3.5 text-indigo-500" />
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as any)}
            className="bg-transparent font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="en-US">English</option>
            <option value="hi-IN">हिंदी (Hindi)</option>
          </select>
        </div>

        {/* Animated Microphone Button */}
        <button
          type="button"
          onClick={handleToggleListening}
          className={`relative flex items-center justify-center p-2 rounded-xl border-2 transition-all active:scale-95 ${
            isListening
              ? 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/60 shadow-md shadow-rose-500/20'
              : 'border-indigo-600/70 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 hover:border-indigo-600 hover:bg-indigo-100/60'
          }`}
          title={isListening ? 'Stop Recording' : 'Start Voice Input'}
        >
          {isListening && (
            <span className="absolute -inset-1 rounded-xl bg-rose-500/30 animate-ping opacity-75" />
          )}
          {isListening ? <MicOff className="w-4 h-4 text-rose-600 relative z-10" /> : <Mic className="w-4 h-4 relative z-10" />}
        </button>

        {/* Speaker Button */}
        {latestAiResponse && (
          <button
            type="button"
            onClick={handleToggleSpeak}
            className={`flex items-center justify-center p-2 rounded-xl border-2 transition-all active:scale-95 ${
              isSpeaking
                ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-500'
            }`}
            title={isSpeaking ? (isPaused ? 'Resume Audio' : 'Pause Audio') : 'Listen to Answer'}
          >
            {isSpeaking && !isPaused ? (
              <Pause className="w-4 h-4 text-emerald-600" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 p-4 dark:border-slate-800 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-800/80 shadow-md space-y-3.5 ${className}`}>
      {/* Voice Bar Top Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Voice AI Tutor & Speech Assistant</span>
              {isListening && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  Listening...
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Speak your question in English or Hindi • Convert speech to AI answer, Notes or Quiz
            </p>
          </div>
        </div>

        {/* Language Selection */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
          <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase">Lang:</span>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as any)}
            className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="en-US">English (US/IN)</option>
            <option value="hi-IN">हिंदी (Hindi)</option>
          </select>
        </div>
      </div>

      {/* Error / Permission Banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-start justify-between text-rose-700 dark:text-rose-300 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Controls & Transcript Area */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Animated Outlined Microphone Button */}
          <button
            type="button"
            onClick={handleToggleListening}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-xs transition-all active:scale-95 ${
              isListening
                ? 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/60 shadow-lg shadow-rose-500/20'
                : 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60'
            }`}
          >
            {isListening && (
              <span className="absolute -inset-1 rounded-xl bg-rose-500/30 animate-ping opacity-75" />
            )}
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 text-rose-600 relative z-10" />
                <span className="relative z-10">Stop Recording</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Start Recording Voice</span>
              </>
            )}
          </button>

          {/* Text-To-Speech Play / Pause Controls */}
          {latestAiResponse && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleSpeak}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-all active:scale-95 ${
                  isSpeaking
                    ? 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                }`}
              >
                {isSpeaking ? (
                  isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Resume AI Speech</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      <span>Pause AI Speech</span>
                    </>
                  )
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Listen to AI Answer</span>
                  </>
                )}
              </button>

              {isSpeaking && (
                <button
                  type="button"
                  onClick={handleStopSpeak}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800"
                  title="Stop Audio"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
            </div>
          )}

          {transcript && (
            <button
              type="button"
              onClick={handleClearTranscript}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline ml-auto"
            >
              Clear Transcript
            </button>
          )}
        </div>

        {/* Live Spoken Transcript Input Field */}
        <div className="relative">
          <textarea
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              if (onTranscriptReady) onTranscriptReady(e.target.value);
            }}
            placeholder={
              isListening
                ? 'Listening... Speak your question now in English or हिंदी...'
                : 'Click "Start Recording Voice" or type your spoken topic here...'
            }
            rows={2}
            className="w-full resize-none rounded-xl border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Voice Action Shortcuts Bar */}
        {transcript.trim() && (
          <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Voice Direct Actions:
            </span>

            {onVoiceAskAi && (
              <button
                type="button"
                onClick={() => onVoiceAskAi(transcript)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask AI Teacher</span>
              </button>
            )}

            {onVoiceCreateNote && (
              <button
                type="button"
                onClick={() => onVoiceCreateNote(transcript)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-transform active:scale-95"
              >
                <BookMarked className="w-3.5 h-3.5 text-emerald-600" />
                <span>Convert to AI Note</span>
              </button>
            )}

            {onVoiceCreateQuiz && (
              <button
                type="button"
                onClick={() => onVoiceCreateQuiz(transcript)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold text-xs hover:bg-purple-100 transition-transform active:scale-95"
              >
                <QuizIcon className="w-3.5 h-3.5 text-purple-600" />
                <span>Generate Quiz</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

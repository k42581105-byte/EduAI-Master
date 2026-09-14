import { detectLanguage, getSpeechLanguageTag } from '../utils/languageDetector';

// Voice Service providing Speech-to-Text and Text-to-Speech using Web Speech API

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface VoiceRecognitionOptions {
  lang?: 'en-US' | 'hi-IN' | 'en-IN' | string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMsg: string, errorType: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface VoiceSynthesisOptions {
  lang?: 'en-US' | 'hi-IN' | 'en-IN' | string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

let activeRecognition: any = null;

export const VoiceService = {
  // Check browser support for Speech Recognition (STT)
  isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },

  // Check browser support for Speech Synthesis (TTS)
  isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  // Clean markdown tags for clear Text-to-Speech reading
  cleanMarkdownForSpeech(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ') // remove code blocks
      .replace(/`([^`]+)`/g, '$1') // inline code
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1') // italic
      .replace(/#+\s/g, '') // headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/[\n\r]+/g, '. ') // line breaks as pauses
      .trim();
  },

  // Start Speech-To-Text Listening
  startListening(options: VoiceRecognitionOptions): { stop: () => void } {
    if (!this.isSpeechRecognitionSupported()) {
      if (options.onError) {
        options.onError('Speech Recognition is not supported on this browser or device. Try Chrome, Edge, or Safari.', 'unsupported');
      }
      return { stop: () => {} };
    }

    if (activeRecognition) {
      try {
        activeRecognition.stop();
      } catch (e) {
        // ignore
      }
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    activeRecognition = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    // Default to Indian English / Hindi capable recognition
    recognition.lang = options.lang || 'en-IN';

    recognition.onstart = () => {
      if (options.onStart) options.onStart();
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      const combined = finalTranscript || interimTranscript;
      if (options.onResult && combined.trim()) {
        options.onResult(combined, !!finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      let errorMsg = 'Speech recognition error occurred.';
      const type = event.error;

      switch (type) {
        case 'not-allowed':
          errorMsg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
          break;
        case 'no-speech':
          errorMsg = 'No speech was detected. Please try speaking again.';
          break;
        case 'audio-capture':
          errorMsg = 'No microphone device was found on your device.';
          break;
        case 'network':
          errorMsg = 'Network error occurred during speech recognition. Check internet connection.';
          break;
        case 'aborted':
          errorMsg = 'Speech listening was cancelled.';
          break;
        default:
          errorMsg = `Speech recognition error: ${type}`;
          break;
      }

      if (options.onError) options.onError(errorMsg, type);
    };

    recognition.onend = () => {
      activeRecognition = null;
      if (options.onEnd) options.onEnd();
    };

    try {
      recognition.start();
    } catch (err: any) {
      if (options.onError) {
        options.onError(`Failed to start microphone: ${err.message || 'Permission denied'}`, 'start_failed');
      }
    }

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  },

  // Stop active speech recognition
  stopListening(): void {
    if (activeRecognition) {
      try {
        activeRecognition.stop();
      } catch (e) {
        // ignore
      }
      activeRecognition = null;
    }
  },

  // Text-To-Speech Output with automatic language detection
  speakText(text: string, options: VoiceSynthesisOptions = {}): void {
    if (!this.isSpeechSynthesisSupported()) {
      if (options.onError) options.onError('Speech Synthesis (Text-to-Speech) is not supported in this browser.');
      return;
    }

    // Stop current speech
    window.speechSynthesis.cancel();

    const cleanedText = this.cleanMarkdownForSpeech(text);
    if (!cleanedText) return;

    // Detect language of the text to select optimal TTS voice
    const detected = detectLanguage(cleanedText, 'en');
    const speechLangTag = options.lang || getSpeechLanguageTag(detected);

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = speechLangTag;
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;

    // Try finding matching voice for language
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const matchPrefix = speechLangTag.slice(0, 2);
      const targetVoice = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(matchPrefix.toLowerCase())) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];
      if (targetVoice) utterance.voice = targetVoice;
    }

    utterance.onstart = () => {
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (err) => {
      if (options.onError) options.onError(err);
    };

    window.speechSynthesis.speak(utterance);
  },

  // Pause speech synthesis
  pauseSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.pause();
    }
  },

  // Resume speech synthesis
  resumeSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.resume();
    }
  },

  // Stop speech synthesis completely
  stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  },

  // Check if currently speaking
  isSpeaking(): boolean {
    return this.isSpeechSynthesisSupported() && window.speechSynthesis.speaking;
  },

  // Direct convenience helpers with auto language detection
  speak(text: string, lang?: string, onEnd?: () => void): void {
    const detected = detectLanguage(text, lang || 'en');
    const speechLang = getSpeechLanguageTag(detected);
    this.speakText(text, {
      lang: speechLang,
      onEnd,
    });
  },

  stop(): void {
    this.stopSpeaking();
    this.stopListening();
  },
};

export const voiceService = VoiceService;


/**
 * Language Detector & Adaptation Utility
 * Automatically detects whether text or speech is Hindi, Hinglish, or English.
 * Provides student-friendly language descriptions, TTS language mappings, and AI prompts.
 */

export type SupportedAiLanguage = 'en' | 'hi' | 'hinglish';

// Common Hinglish keywords (Hindi words written in Latin/English alphabet)
const HINGLISH_KEYWORDS = new Set([
  'kya', 'kyu', 'kyun', 'kaise', 'kaisa', 'kaisi', 'kare', 'karein', 'karo', 'karna', 'karke', 'kar', 'karu', 'karoon',
  'hai', 'hain', 'ho', 'hu', 'hoon', 'tha', 'thi', 'the', 'hoga', 'hogi', 'hoge', 'hote', 'hota', 'hoti',
  'yeh', 'ye', 'woh', 'wo', 'iska', 'iski', 'iske', 'usko', 'uska', 'uski', 'uske', 'unka', 'unki', 'unke',
  'mera', 'meri', 'mere', 'tera', 'teri', 'tere', 'hamara', 'hamari', 'hamare', 'apna', 'apni', 'apne',
  'mujhe', 'tujhe', 'hume', 'humein', 'unhe', 'aap', 'tum', 'bhai', 'sir', 'mam', 'didi', 'bhaiya',
  'nahi', 'nhi', 'mat', 'batao', 'bataiye', 'bataye', 'batayein', 'bata', 'batao na', 'bata do',
  'samjhao', 'samjhana', 'samjhaye', 'samjho', 'samajh', 'samjha', 'samjhi', 'samjha do', 'samajh me',
  'padhai', 'padho', 'padhna', 'seekho', 'seekhna', 'likho', 'likhna', 'banao', 'bana', 'banaiye',
  'kuch', 'kuchh', 'thoda', 'thodi', 'zyada', 'jyada', 'bohot', 'bahut', 'kam',
  'ache', 'acche', 'achha', 'accha', 'theek', 'thik', 'sahi', 'galat', 'aasan', 'kathin', 'mushkil',
  'pehle', 'phir', 'bad', 'baad', 'lekin', 'par', 'aur', 'ya', 'kyunki', 'isliye', 'agar', 'toh',
  'dijiye', 'dijie', 'do', 'de', 'dena', 'lena', 'lo', 'lijiye',
  'raha', 'rahi', 'rahe', 'wali', 'wala', 'wale',
  'chahiye', 'zaruri', 'zaroori', 'jaruri', 'tarika', 'tareeka', 'sawaal', 'sawal', 'jawaab', 'jawab', 'uttar',
  'kripya', 'shukriya', 'dhanyawad', 'shuru', 'khatam', 'madad', 'help karo', 'solve karo',
  'batao', 'sikhaye', 'sikhao', 'samjhao'
]);

// Multi-word Hinglish patterns (strong indicator of Hinglish)
const HINGLISH_PATTERNS = [
  /\b(kaise\s+(karein|karo|hoga|karna|solve))\b/i,
  /\b(kya\s+(hai|hota|hogi|hoga))\b/i,
  /\b(mujhe\s+(samjhao|batao|chahiye|madad))\b/i,
  /\b(bata\s+do|samjha\s+do|solve\s+karo|solve\s+karke)\b/i,
  /\b(samajh\s+nahi|samajh\s+nhi|nahi\s+aaya|nhi\s+aaya)\b/i,
  /\b(hindi\s+me|hinglish\s+me|english\s+me)\b/i,
  /\b(acche\s+se|thoda\s+aur|ek\s+baar)\b/i,
  /\b(padhna\s+hai|seekhna\s+hai|karna\s+hai)\b/i,
  /\b(kya\s+kare|kya\s+karein)\b/i,
  /\b(ye\s+question|yeh\s+question|ye\s+sawaal)\b/i,
];

/**
 * Detect language of a given text string.
 * Returns 'hi' (Hindi Devanagari), 'hinglish' (Hindi in Latin script), or 'en' (English).
 */
export function detectLanguage(text: string, defaultLanguage: string = 'en'): SupportedAiLanguage {
  if (!text || typeof text !== 'string') {
    return normalizeLanguageCode(defaultLanguage);
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return normalizeLanguageCode(defaultLanguage);
  }

  // 1. Check for Devanagari characters (Hindi script: U+0900 to U+097F)
  const devanagariMatches = trimmed.match(/[\u0900-\u097F]/g);
  if (devanagariMatches && devanagariMatches.length >= 2) {
    return 'hi';
  }

  // 2. Check for Hinglish strong regex patterns
  for (const pattern of HINGLISH_PATTERNS) {
    if (pattern.test(trimmed)) {
      return 'hinglish';
    }
  }

  // 3. Count Hinglish keywords in Latin-script tokens
  const words = trimmed
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  let hinglishCount = 0;
  for (const word of words) {
    if (HINGLISH_KEYWORDS.has(word)) {
      hinglishCount++;
    }
  }

  // If 2 or more Hinglish words exist, or 1 Hinglish word in a short query (<= 4 words), classify as Hinglish
  if (hinglishCount >= 2 || (hinglishCount >= 1 && words.length <= 4 && words.some(w => ['kya', 'kaise', 'batao', 'samjhao', 'karein', 'karo', 'nhi', 'nahi', 'mujhe'].includes(w)))) {
    return 'hinglish';
  }

  // 4. If mainly mathematical formulas/numbers without linguistic words, use fallback default
  const nonMathWords = words.filter((w) => !/^[0-9a-z]$/i.test(w) && !/^(sin|cos|tan|log|lim|dx|dy|xy|ab)$/i.test(w));
  if (nonMathWords.length === 0 && defaultLanguage) {
    return normalizeLanguageCode(defaultLanguage);
  }

  // Default to English
  return 'en';
}

/**
 * Normalize any language code or label into standard 'en' | 'hi' | 'hinglish'
 */
export function normalizeLanguageCode(lang?: string | null): SupportedAiLanguage {
  if (!lang) return 'en';
  const lower = lang.toLowerCase().trim();
  if (lower === 'hi' || lower === 'hindi' || lower === 'हिंदी') return 'hi';
  if (lower === 'hinglish' || lower === 'हिंग्लिश') return 'hinglish';
  return 'en';
}

/**
 * Get human-readable language label
 */
export function getLanguageLabel(lang: SupportedAiLanguage | string): string {
  const norm = normalizeLanguageCode(lang);
  switch (norm) {
    case 'hi':
      return 'Hindi (हिंदी)';
    case 'hinglish':
      return 'Hinglish (Hindi + English)';
    case 'en':
    default:
      return 'English';
  }
}

/**
 * Return Web Speech API BCP 47 language code for TTS / STT
 */
export function getSpeechLanguageTag(lang: SupportedAiLanguage | string): string {
  const norm = normalizeLanguageCode(lang);
  switch (norm) {
    case 'hi':
    case 'hinglish':
      return 'hi-IN';
    case 'en':
    default:
      return 'en-IN'; // Indian English accent fits school curriculum naturally
  }
}

/**
 * Build system prompt mandate for language compliance
 */
export function getLanguageSystemPromptInstruction(lang: SupportedAiLanguage | string): string {
  const norm = normalizeLanguageCode(lang);
  switch (norm) {
    case 'hi':
      return `LANGUAGE MANDATE (Hindi / हिंदी):
- Explain your entire answer in simple, polite, student-friendly Hindi (हिंदी) in Devanagari script.
- Keep standard mathematical expressions ($x^2 + 5x + 6 = 0$), chemical formulas ($H_2O$, $CO_2$), and SI units in standard notations.
- Avoid overly difficult Sanskritized pure words; use natural, everyday conversational Hindi that Class 6-12 school students easily understand.`;

    case 'hinglish':
      return `LANGUAGE MANDATE (Hinglish / हिंग्लिश):
- Explain your entire answer in simple, warm, conversational Hinglish (Hindi written in Roman/Latin script, e.g. "Is question ko solve karne ke liye pehle hum formula apply karenge...").
- Keep core subject technical terms in English (e.g. "Photosynthesis", "Quadratic Formula", "Velocity", "Newton's Law").
- Tone should be like a friendly Indian school teacher speaking naturally to a student.`;

    case 'en':
    default:
      return `LANGUAGE MANDATE (English):
- Explain your entire answer in simple, clear, student-friendly English appropriate for school curriculum.
- Keep explanations engaging, concise, and easy to follow.`;
  }
}

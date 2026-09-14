import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  createRateLimiter,
  idempotencyMiddleware,
  inputValidationMiddleware,
  validateBase64ImagePayload,
  requireRole,
  safeErrorHandler,
} from "./src/server/security";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Strict payload bounds: JSON parsed up to 10mb for base64 images
  app.use(express.json({ limit: "10mb" }));

  // Mount Zero-Trust Security Middlewares
  app.use("/api", createRateLimiter({ maxRequests: 120, windowMs: 60000, tierName: "api" }));
  app.use("/api/ai", createRateLimiter({ maxRequests: 45, windowMs: 60000, tierName: "ai_generation" }));
  app.use(idempotencyMiddleware);
  app.use(inputValidationMiddleware);

  // Helper to initialize Gemini SDK on server-side
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Candidate models to rotate through if high demand / 503 / 429 occurs
  const FALLBACK_MODELS = [
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ];

  // Resilient generateContent with instant multi-model failover & retry
  async function generateContentWithRetry(
    ai: GoogleGenAI,
    params: {
      model?: string;
      contents: any;
      config?: any;
    }
  ) {
    const requestedModel = params.model || "gemini-3.7-flash";
    const modelsToTry = [
      requestedModel,
      ...FALLBACK_MODELS.filter((m) => m !== requestedModel),
    ];

    let lastError: any = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const currentModel = modelsToTry[i];
      try {
        const res = await ai.models.generateContent({
          ...params,
          model: currentModel,
        });
        return res;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || "");
        const status = err?.status || err?.code || (err?.error && (err.error.code || err.error.status));
        const isOverloaded =
          msg.includes("503") ||
          msg.includes("429") ||
          msg.includes("high demand") ||
          msg.includes("overloaded") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("rate limit") ||
          msg.includes("Quota exceeded") ||
          status === 503 ||
          status === 429 ||
          status === "UNAVAILABLE";

        if (isOverloaded && i < modelsToTry.length - 1) {
          // Immediately try next candidate model without stalling user
          continue;
        }

        if (!isOverloaded) {
          throw err;
        }
      }
    }

    throw lastError;
  }

  // Resilient generateContentStream with instant multi-model failover
  async function generateContentStreamWithRetry(
    ai: GoogleGenAI,
    params: {
      model?: string;
      contents: any;
      config?: any;
    }
  ) {
    const requestedModel = params.model || "gemini-3.7-flash";
    const modelsToTry = [
      requestedModel,
      ...FALLBACK_MODELS.filter((m) => m !== requestedModel),
    ];

    let lastError: any = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const currentModel = modelsToTry[i];
      try {
        const stream = await ai.models.generateContentStream({
          ...params,
          model: currentModel,
        });
        return stream;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || "");
        const status = err?.status || err?.code || (err?.error && (err.error.code || err.error.status));
        const isOverloaded =
          msg.includes("503") ||
          msg.includes("429") ||
          msg.includes("high demand") ||
          msg.includes("overloaded") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("rate limit") ||
          msg.includes("Quota exceeded") ||
          status === 503 ||
          status === 429 ||
          status === "UNAVAILABLE";

        if (isOverloaded && i < modelsToTry.length - 1) {
          continue;
        }
        if (!isOverloaded) {
          throw err;
        }
      }
    }

    throw lastError;
  }

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      aiConfigured: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // Safe JSON extraction and parsing helper to handle unescaped LaTeX backslashes (\frac, \text, \sqrt, etc.)
  function safeJsonParse<T = any>(rawText: string, fallback: T): T {
    if (!rawText || typeof rawText !== "string") return fallback;

    let cleaned = rawText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }
    cleaned = cleaned.trim();

    // 1. Direct parse attempt
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      // Continue to sanitization
    }

    // 2. Fix unescaped backslashes (frequent in LaTeX expressions like \frac, \text, \times, \sqrt, \alpha, \pm)
    // Valid JSON escape sequences are: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
    try {
      const fixedBackslashes = cleaned.replace(
        /\\([^"\\\/bfnrtu]|u[0-9a-fA-F]{0,3}[^0-9a-fA-F]|$)/g,
        "\\\\$1"
      );
      return JSON.parse(fixedBackslashes) as T;
    } catch {
      // Continue
    }

    // 3. Remove trailing commas & fix escaped characters
    try {
      const fixedCommas = cleaned
        .replace(/,\s*([\]}])/g, "$1")
        .replace(/\\([^"\\\/bfnrtu]|u[0-9a-fA-F]{0,3}[^0-9a-fA-F]|$)/g, "\\\\$1");
      return JSON.parse(fixedCommas) as T;
    } catch {
      // Continue
    }

    // 4. Extract outer JSON enclosure
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const slice = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        const fixedSlice = slice
          .replace(/,\s*([\]}])/g, "$1")
          .replace(/\\([^"\\\/bfnrtu]|u[0-9a-fA-F]{0,3}[^0-9a-fA-F]|$)/g, "\\\\$1");
        return JSON.parse(fixedSlice) as T;
      } catch {
        // Continue
      }
    }

    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      const slice = cleaned.slice(firstBracket, lastBracket + 1);
      try {
        const fixedSlice = slice
          .replace(/,\s*([\]}])/g, "$1")
          .replace(/\\([^"\\\/bfnrtu]|u[0-9a-fA-F]{0,3}[^0-9a-fA-F]|$)/g, "\\\\$1");
        return JSON.parse(fixedSlice) as T;
      } catch {
        // Continue
      }
    }

    console.warn("safeJsonParse failed to parse AI JSON, returning fallback structure.");
    return fallback;
  }

  // Common Hinglish keywords dictionary for server-side detection
  const SERVER_HINGLISH_KEYWORDS = new Set([
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
    'kripya', 'shukriya', 'dhanyawad', 'shuru', 'khatam', 'madad', 'help karo', 'solve karo'
  ]);

  // Server-side language detector
  function detectServerInputLanguage(text: string, fallbackLang: string = "en"): "en" | "hi" | "hinglish" {
    if (!text || typeof text !== "string") {
      const lower = (fallbackLang || "en").toLowerCase();
      if (lower === "hi" || lower === "hindi" || lower === "हिंदी") return "hi";
      if (lower === "hinglish" || lower === "हिंग्लिश") return "hinglish";
      return "en";
    }

    const trimmed = text.trim();
    if (!trimmed) {
      const lower = (fallbackLang || "en").toLowerCase();
      if (lower === "hi" || lower === "hindi" || lower === "हिंदी") return "hi";
      if (lower === "hinglish" || lower === "हिंग्लिश") return "hinglish";
      return "en";
    }

    // 1. Devanagari detection
    const devanagariMatches = trimmed.match(/[\u0900-\u097F]/g);
    if (devanagariMatches && devanagariMatches.length >= 2) {
      return "hi";
    }

    // 2. Strong Hinglish regex checks
    const hinglishRegexes = [
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

    for (const rx of hinglishRegexes) {
      if (rx.test(trimmed)) {
        return "hinglish";
      }
    }

    // 3. Count Hinglish words
    const words = trimmed
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    let hinglishWordCount = 0;
    for (const w of words) {
      if (SERVER_HINGLISH_KEYWORDS.has(w)) {
        hinglishWordCount++;
      }
    }

    if (hinglishWordCount >= 2 || (hinglishWordCount >= 1 && words.length <= 4 && words.some(w => ['kya', 'kaise', 'batao', 'samjhao', 'karein', 'karo', 'nhi', 'nahi', 'mujhe'].includes(w)))) {
      return "hinglish";
    }

    // If query is pure numbers / math equation, preserve fallback
    const nonMathWords = words.filter((w) => !/^[0-9a-z]$/i.test(w) && !/^(sin|cos|tan|log|lim|dx|dy|xy|ab)$/i.test(w));
    if (nonMathWords.length === 0 && fallbackLang) {
      const lower = fallbackLang.toLowerCase();
      if (lower === "hi" || lower === "hindi" || lower === "हिंदी") return "hi";
      if (lower === "hinglish" || lower === "हिंग्लिश") return "hinglish";
      return "en";
    }

    return "en";
  }

  // Helper to build system instructions for AI Teacher
  function buildTeacherSystemPrompt(
    subjectMode: string = "general",
    studentContext: any = {},
    actionPrefix?: string,
    detectedLang?: "en" | "hi" | "hinglish"
  ) {
    const classLvl = studentContext.classLevel || "10";
    const board = studentContext.board || "CBSE";
    const medium = studentContext.medium || "English";
    const rawLang = detectedLang || studentContext.language || "en";
    const isHindi = rawLang === "hi" || rawLang === "Hindi" || rawLang === "hindi";
    const isHinglish = rawLang === "hinglish" || rawLang === "Hinglish";
    const lang = isHindi ? "Hindi (हिंदी)" : isHinglish ? "Hinglish (Hindi written in English alphabets)" : "English";
    const subject = studentContext.subject || "General Academic";
    const book = studentContext.book || "";
    const chapter = studentContext.chapter || "";
    const topic = studentContext.topic || "";

    const languageMandate = isHindi
      ? `STRICT LANGUAGE MANDATE:
- You MUST provide your entire explanation and answer in clear, polite, natural, student-friendly Hindi (हिंदी) in Devanagari script.
- Keep standard mathematical formulas, physics equations, and SI units in standard notations ($E = mc^2$, $ax^2 + bx + c = 0$, etc.).
- Avoid overly difficult Sanskritized pure words; use natural, everyday conversational Hindi that Class 6-12 school students easily understand.`
      : isHinglish
      ? `STRICT LANGUAGE MANDATE:
- You MUST provide your response in conversational, simple, friendly Hinglish (natural Hindi written in Roman/Latin script, e.g. "Pehle hum formula apply karenge...", keeping core subject technical terms in English like "Photosynthesis", "Quadratic Formula").
- Speak like a friendly Indian school teacher explaining concepts naturally to a student.`
      : `STRICT LANGUAGE MANDATE:
- You MUST provide your response in clear, concise, student-friendly English appropriate for school curriculum.`;

    let modeInstruction = "";
    switch (subjectMode) {
      case "maths":
        modeInstruction = `MODE: Mathematics Teacher.
Structure your response strictly into these 4 sections:
1. **Given & Problem Statement**: List known parameters, variables, and what we need to calculate/prove.
2. **Formula / Rule / Theorem**: State the formula or theorem used (e.g. Quadratic Formula, Pythagoras Theorem).
3. **Step-by-Step Solution**: Show clean line-by-line algebraic or arithmetic steps.
4. **Final Answer**: State the final value clearly with correct units.`;
        break;
      case "science":
        modeInstruction = `MODE: Science Teacher (Physics, Chemistry, Biology).
Structure your response strictly into these 4 sections:
1. **Core Concept**: Explain the scientific phenomenon or law simply.
2. **Process / Mechanism**: Explain step-by-step how it works or chemical/physical reactions.
3. **Real-World Examples**: Give relatable everyday life examples.
4. **Important Points for Exams**: Key definitions, SI units, diagram tips, or common mistakes.`;
        break;
      case "english":
        modeInstruction = `MODE: English Language & Literature Teacher.
Help with: Grammar rules, Writing formats (letters, essays), Vocabulary, Literature analysis, and Comprehension.
Provide clear definitions, example sentences, common grammatical errors to avoid, and practice tips.`;
        break;
      case "sst":
        modeInstruction = `MODE: Social Studies Teacher (History, Geography, Civics, Economics).
Structure your response clearly with:
- Historical context / Geographic features / Constitutional principles.
- Important Dates & Timelines / Key Terms.
- Cause and Effect analysis.
- Exam answer writing tips.`;
        break;
      case "hindi":
        modeInstruction = `MODE: Hindi Teacher (हिंदी शिक्षक).
Help with: व्याकरण (संधि, समास, कारक, वर्ण-विच्छेद), साहित्य (कविता, कहानी का अर्थ), शब्दावली, और रचनात्मक लेखन।
Explain in polite, clear Hindi / Hinglish appropriate for school curriculum.`;
        break;
      case "sanskrit":
        modeInstruction = `MODE: Sanskrit Teacher (संस्कृत शिक्षक).
Help with: संस्कृत व्याकरण (कारक, सन्धि, समास), शब्द रूप (बालक, नदी, अस्मद्), धातु रूप (पठ्, भू, लट्-लङ्-लृट् लकार), अनुवाद (Translation) and शब्दावली.
Use clear Devanagari script for Sanskrit words with Hindi/English explanations.`;
        break;
      default:
        modeInstruction = `MODE: General Academic Teacher.
Provide friendly, patient, step-by-step school-level explanations with analogies, examples, and key takeaways.`;
        break;
    }

    return `You are EduAI Master, an expert, encouraging, and friendly school teacher & learning assistant.

STUDENT CONTEXT:
- Class: ${classLvl}
- Board: ${board}
- Medium: ${medium}
- Preferred Explanation Language: ${lang}
${subject ? `- Subject: ${subject}` : ""}
${book ? `- Textbook: ${book}` : ""}
${chapter ? `- Chapter: ${chapter}` : ""}
${topic ? `- Topic: ${topic}` : ""}

TEACHER PERSONALITY & SAFETY RULES:
1. Speak like a warm, encouraging, patient school teacher.
2. Adapt language to Class ${classLvl} level. Avoid unnecessarily complicated jargon.
3. If the student asks a question that is genuinely unclear or missing essential figures/numbers from a textbook problem, politely ask a short clarifying question or invite them to upload a photo.
4. Correct mistakes gently and explain WHY the correct method works.
5. Identify clearly as an AI Learning Assistant when asked about your identity. Never pretend to be a human teacher or claim fake personal offline knowledge.
6. Never fabricate textbook content or give harmful instructions.
7. Encourage students to verify crucial board exam rules or dates with their school teacher/textbook.

AUTOMATIC DYNAMIC LANGUAGE ADAPTATION:
- If the student writes in Hindi (Devanagari script), reply in simple Hindi.
- If the student writes in Hinglish (Hindi written in Roman script, e.g. "ye question kaise hoga"), reply in friendly Hinglish.
- If the student writes in English, reply in simple English.
- If the student changes language at any turn in the conversation, automatically switch to that language.
- Do NOT translate or echo the student's question back verbatim unless explicitly asked.
- Keep all explanations simple and student-friendly.

${modeInstruction}

${languageMandate}

${actionPrefix ? `SPECIAL REQUEST INSTRUCTION: ${actionPrefix}` : ""}`;
  }

  // 1a. AI Ask / Doubt Solver Streaming Endpoint
  app.post("/api/ai/stream-ask", async (req, res) => {
    try {
      const { question, subjectMode, studentContext, history, actionType } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({ error: "Gemini API Key missing on server" });
      }

      let actionPrefix = "";
      if (actionType === "explain-simpler") actionPrefix = "Explain the concept in much simpler, beginner-friendly words.";
      if (actionType === "translate-hi") actionPrefix = "Explain this fully in Hindi (हिंदी).";
      if (actionType === "translate-en") actionPrefix = "Explain this fully in English.";
      if (actionType === "make-notes") actionPrefix = "Format this as concise, bulleted revision study notes.";
      if (actionType === "quiz-me") actionPrefix = "Include 3 quick practice questions with answers at the end.";

      // Automatically detect the student's input language
      const detectedLang = actionType === "translate-hi"
        ? "hi"
        : actionType === "translate-en"
        ? "en"
        : detectServerInputLanguage(question, studentContext?.language || "en");

      const systemInstruction = buildTeacherSystemPrompt(subjectMode, studentContext, actionPrefix, detectedLang);

      // Build conversation contents
      const contents: any[] = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const msg of history) {
          contents.push({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: question }],
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const responseStream = await generateContentStreamWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents: contents,
        config: {
          systemInstruction,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err: any) {
      console.error("Error in /api/ai/stream-ask:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || "Streaming failed" });
      } else {
        res.write(`data: ${JSON.stringify({ error: err.message || "Stream interrupted" })}\n\n`);
        res.end();
      }
    }
  });

  // 1b. AI Ask / Doubt Solver Non-Streaming Endpoint
  app.post("/api/ai/ask", async (req, res) => {
    try {
      const { question, subjectMode, studentContext, actionType, history } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({
          error: "Gemini API Key is not configured in server environment.",
          isFallback: true,
        });
      }

      let actionPrefix = "";
      if (actionType === "explain-simpler") actionPrefix = "Explain the concept in much simpler, beginner-friendly words.";
      if (actionType === "translate-hi") actionPrefix = "Explain this fully in Hindi (हिंदी).";
      if (actionType === "translate-en") actionPrefix = "Explain this fully in English.";
      if (actionType === "make-notes") actionPrefix = "Format this as concise, bulleted revision study notes.";

      // Automatically detect the student's input language
      const detectedLang = actionType === "translate-hi"
        ? "hi"
        : actionType === "translate-en"
        ? "en"
        : detectServerInputLanguage(question, studentContext?.language || "en");

      const systemInstruction = buildTeacherSystemPrompt(subjectMode, studentContext, actionPrefix, detectedLang);

      const contents: any[] = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const msg of history) {
          contents.push({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
          });
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: question }],
      });

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents: contents,
        config: {
          systemInstruction,
        },
      });

      return res.json({
        answer: response.text || "No response generated.",
        isFallback: false,
      });
    } catch (err: any) {
      console.error("Error in /api/ai/ask:", err);
      return res.status(500).json({
        error: err.message || "Failed to process question with AI.",
        isFallback: true,
      });
    }
  });


  // 2a. AI Photo Analysis Endpoint (OCR, Subject Detection, Question Extraction)
  app.post("/api/ai/analyze-photo", async (req, res) => {
    try {
      const { imageBase64, mimeType, classLevel, language } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({
          error: "Gemini API Key is not configured on server.",
          isFallback: true,
        });
      }

      if (!imageBase64) {
        return res.status(400).json({ error: "No image provided." });
      }

      // Zero-Trust Signature & Payload Verification
      const imgCheck = validateBase64ImagePayload(imageBase64);
      if (!imgCheck.valid) {
        return res.status(400).json({
          error: imgCheck.error || "Invalid image payload.",
          isFallback: true,
        });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imagePart = {
        inlineData: {
          mimeType: imgCheck.mime || mimeType || "image/jpeg",
          data: cleanBase64,
        },
      };

      const prompt = `You are an expert AI Vision OCR & Educational Question Analyzer for Class ${classLevel || "10"}.
Examine this image containing a textbook page, exam paper, or handwritten question.

Perform the following:
1. Identify the primary subject: "Maths", "Science", "English", "Hindi", "Sanskrit", "SST", or "General".
2. Detect if there are any visual diagrams, graphs, circuits, geometric figures, ray diagrams, or tables. Describe them briefly if present.
3. Extract ALL questions present in the image as an array of items. If multiple questions exist (e.g. Q1, Q2), separate them into individual question objects.
4. Language preference for output instructions: ${language || "English"}.

Output ONLY valid JSON in this exact structure without markdown code fences:
{
  "detectedSubject": "Maths",
  "hasDiagram": false,
  "diagramDescription": null,
  "questions": [
    {
      "id": "q1",
      "questionNumber": "Q1",
      "extractedText": "The extracted question text here",
      "subject": "Maths",
      "topic": "Quadratic Equations"
    }
  ],
  "rawOcrText": "Complete visible text on the image"
}`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents: {
          parts: [imagePart, { text: prompt }],
        },
      });

      const responseText = response.text || "";
      const defaultFallback = {
        detectedSubject: "General",
        hasDiagram: false,
        diagramDescription: null,
        questions: [
          {
            id: "q1",
            questionNumber: "Q1",
            extractedText: responseText.slice(0, 300) || "Extracted question from image.",
            subject: "General",
            topic: "General Doubt",
          },
        ],
        rawOcrText: responseText,
      };

      const parsedJson = safeJsonParse(responseText, defaultFallback);

      return res.json({
        analysis: parsedJson,
        isFallback: false,
      });
    } catch (err: any) {
      console.error("Error in /api/ai/analyze-photo:", err);
      return res.status(500).json({
        error: err.message || "Failed to analyze image content.",
        isFallback: true,
      });
    }
  });

  // 2b. AI Photo Solver Endpoint
  app.post("/api/ai/solve-photo", async (req, res) => {
    try {
      const { imageBase64, mimeType, questionText, additionalNotes, subject, classLevel, language, hasDiagram, diagramDescription } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({
          error: "Gemini API Key is not configured on server.",
          isFallback: true,
        });
      }

      let imagePart: any = null;
      if (imageBase64) {
        const imgCheck = validateBase64ImagePayload(imageBase64);
        if (!imgCheck.valid) {
          return res.status(400).json({
            error: imgCheck.error || "Invalid image payload.",
            isFallback: true,
          });
        }
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        imagePart = {
          inlineData: {
            mimeType: imgCheck.mime || mimeType || "image/jpeg",
            data: cleanBase64,
          },
        };
      }

      // Detect language from questionText or additionalNotes if provided, or fallback to language prop
      const detectedLang = detectServerInputLanguage(
        `${questionText || ''} ${additionalNotes || ''}`,
        language || 'en'
      );
      const isHindi = detectedLang === 'hi';
      const isHinglish = detectedLang === 'hinglish';
      const langName = isHindi ? 'Hindi (हिंदी) in Devanagari script' : isHinglish ? 'Hinglish (Hindi written in Roman/English alphabet)' : 'English';

      const normalizedSubject = (subject || "General").trim().toLowerCase();
      const isMath = normalizedSubject.includes("math");
      const isScience = normalizedSubject.includes("science") || normalizedSubject.includes("physics") || normalizedSubject.includes("chemistry") || normalizedSubject.includes("biology");

      let formatInstruction = "";
      if (isMath) {
        formatInstruction = `FORMAT MANDATE FOR MATHEMATICS SOLUTION:
Structure your response strictly into these 5 markdown sections:

### 📐 Given
List all known values, variables, given equations, or values extracted from the diagram.

### 🎯 Required
State clearly what needs to be calculated, proved, or solved.

### ⚡ Formula
State the exact formula(s), algebraic identity, or mathematical theorem used (e.g. $ax^2 + bx + c = 0$, $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$).

### 📝 Steps
Provide clear, numbered step-by-step mathematical calculations with intermediate steps and logical reasoning.

### ✅ Final Answer
State the final answer clearly highlighted in bold with appropriate units.`;
      } else if (isScience) {
        formatInstruction = `FORMAT MANDATE FOR SCIENCE SOLUTION:
Structure your response strictly into these 4 markdown sections:

### 🔬 Concept
State the fundamental scientific principle, law, or mechanism (e.g., Newton's Second Law, Photosynthesis, Ohm's Law).

### 💡 Explanation
Provide a detailed, step-by-step scientific explanation or numerical working. Mention any diagram features if present.

### 📌 Important Points
3-4 crucial exam points, formulas, SI units, memory tips, or key terms required for CBSE/Board evaluation.

### ✅ Answer
Clear, concise final answer or summary statement.`;
      } else {
        formatInstruction = `FORMAT MANDATE FOR THEORY / HUMANITIES / LANGUAGE SOLUTION:
Structure your response strictly into these 3 markdown sections:

### 📖 Answer
State the direct, precise, high-scoring answer clearly.

### 💡 Explanation
Provide an elaborate, step-by-step contextual explanation with appropriate grammar rules, literary meaning, historical dates, or concepts for Class ${classLevel || "10"}.

### 📌 Important Points
3-4 high-yield bullet points or key keywords needed to score full marks in school board exams.`;
      }

      const promptText = `You are EduAI Master Photo Homework Solver for Class ${classLevel || "10"}.
Question to Solve: "${questionText || "Solve the problem shown in the image"}"
Subject: ${subject || "General"}
Class Level: Class ${classLevel || "10"}
Target Language: ${langName}
${hasDiagram ? `Diagram Note: ${diagramDescription || "Diagram present in image"}` : ""}
${additionalNotes ? `Additional Student Request: ${additionalNotes}` : ""}

LANGUAGE RULES:
- If Target Language is Hindi: Explain everything in simple, clear Hindi (हिंदी) in Devanagari script.
- If Target Language is Hinglish: Explain in conversational, friendly Hinglish (Roman script, e.g. "Is sawaal me pehle hum...").
- If Target Language is English: Explain in clear, standard English.
- Keep the language simple, friendly, and appropriate for Class ${classLevel || "10"}.

${formatInstruction}

Write in an encouraging, clear, school-teacher tone appropriate for Class ${classLevel || "10"} students.`;

      const contentsParts: any[] = [];
      if (imagePart) contentsParts.push(imagePart);
      contentsParts.push({ text: promptText });

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents: {
          parts: contentsParts,
        },
      });

      return res.json({
        solution: response.text || "Could not generate solution.",
        subjectUsed: subject || "General",
        isFallback: false,
      });
    } catch (err: any) {
      console.error("Error in /api/ai/solve-photo:", err);
      return res.status(500).json({
        error: err.message || "Failed to solve photo problem.",
        isFallback: true,
      });
    }
  });

  // 3. AI Notes Generator Endpoint
  app.post("/api/ai/generate-notes", async (req, res) => {
    try {
      const {
        topic,
        chapter,
        subject,
        classLevel = "10",
        language = "en",
        sourceType = "topic",
        questionText,
        conversationText,
        imageBase64,
        mimeType,
      } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({ error: "Gemini API Key missing", isFallback: true });
      }

      // Detect language from inputs
      const detectedLang = detectServerInputLanguage(
        `${topic || ''} ${chapter || ''} ${questionText || ''} ${conversationText || ''}`,
        language || 'en'
      );
      const isHindi = detectedLang === "hi";
      const isHinglish = detectedLang === "hinglish";
      const langName = isHindi ? "Hindi (हिंदी)" : isHinglish ? "Hinglish (Hindi in Roman script)" : "English";

      let sourceContext = "";
      let imagePart: any = null;

      if (sourceType === "photo" && imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        imagePart = {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: cleanBase64,
          },
        };
      }

      if (sourceType === "photo") {
        sourceContext = `SOURCE TYPE: Photo / Scanned Problem
Question/Problem Text: "${questionText || topic}"`;
      } else if (sourceType === "conversation") {
        sourceContext = `SOURCE TYPE: Ask AI Conversation Notes
Discussion Content:
"${conversationText || topic}"`;
      } else {
        sourceContext = `SOURCE TYPE: Typed Chapter / Topic
Subject: ${subject || "General"}
Chapter Name: ${chapter || topic || "General Chapter"}
Topic Name: ${topic || "Core Concepts"}`;
      }

      const formatGuide = isHindi
        ? `आप Class ${classLevel} के छात्रों के लिए एक उत्कृष्ट और सरल हिंदी नोट्स निर्माता हैं।
नोट्स को निम्नलिखित 7 अनुभागों में स्पष्ट Markdown हेडिंग्स के साथ लिखें:

# [शीर्षक: ${subject || "विषय"} - ${topic || chapter || "अध्याय"}]

### 📌 संक्षेप (Short Summary)
[2-3 वाक्यों में विषय का स्पष्ट और सरल संक्षेप]

### 🎯 मुख्य बिंदु (Key Points)
- [बिंदु 1]
- [बिंदु 2]
- [बिंदु 3]
- [बिंदु 4]

### 📚 महत्त्वपूर्ण परिभाषाएँ (Important Definitions)
- **[शब्द 1]**: [सरल परिभाषा]
- **[शब्द 2]**: [सरल परिभाषा]

### ⚡ सूत्र एवं महत्त्वपूर्ण नियम (Formulas & Key Rules)
- **[सूत्र/नियम 1]**: [समीकरण / नियम]
- **[सूत्र/नियम 2]**: [समीकरण / नियम]
*(यदि गणित/विज्ञान का सूत्र न हो, तो मुख्य नियम या तिथियाँ दें)*

### 💡 वास्तविक उदाहरण (Real-World Examples)
- **उदाहरण 1**: [दैनिक जीवन या व्यावहारिक उदाहरण]
- **उदाहरण 2**: [दैनिक जीवन या व्यावहारिक उदाहरण]

### ❓ परीक्षा हेतु महत्त्वपूर्ण प्रश्न (Important Questions)
1. **प्रश्न**: [परीक्षा उपयोगी प्रश्न 1]?
   **उत्तर**: [संक्षिप्त आदर्श उत्तर]
2. **प्रश्न**: [परीक्षा उपयोगी प्रश्न 2]?
   **उत्तर**: [संक्षिप्त आदर्श उत्तर]

### ⚡ त्वरित पुनरावृत्ति (Quick Revision)
- ⚡ [त्वरित पुनरावृत्ति बिंदु 1]
- ⚡ [त्वरित पुनरावृत्ति बिंदु 2]
- ⚡ [त्वरित पुनरावृत्ति बिंदु 3]`
        : isHinglish
        ? `You are an expert Class ${classLevel} AI Study Notes Generator writing in conversational, student-friendly Hinglish (Hindi in Roman script).
Structure your output strictly into these 7 Markdown sections:

# [Title: ${subject || "Subject"} - ${topic || chapter || "Topic"}]

### 📌 Short Summary
[2-3 line simple Hinglish overview, e.g., "Is topic me hum seekhenge ki..."]

### 🎯 Key Points
- [Key point 1 in Hinglish]
- [Key point 2 in Hinglish]
- [Key point 3 in Hinglish]
- [Key point 4 in Hinglish]

### 📚 Important Definitions
- **[Term 1 in English]**: [Simple Hinglish definition]
- **[Term 2 in English]**: [Simple Hinglish definition]

### ⚡ Formulas & Key Rules
- **[Formula/Rule 1]**: [Formula or core principle]
- **[Formula/Rule 2]**: [Formula or core principle]

### 💡 Examples
- **Example 1**: [Real-world daily life example explained in Hinglish]
- **Example 2**: [Relatable example explained in Hinglish]

### ❓ Important Questions
1. **Q**: [Exam question]?
   **A**: [Clear model answer in Hinglish]
2. **Q**: [Exam question]?
   **A**: [Clear model answer in Hinglish]

### ⚡ Quick Revision
- ⚡ [Quick recap bullet 1]
- ⚡ [Quick recap bullet 2]
- ⚡ [Quick recap bullet 3]`
        : `You are an expert Class ${classLevel} AI Study Notes Generator.
Structure your output strictly into these 7 Markdown sections:

# [Title: ${subject || "Subject"} - ${topic || chapter || "Topic"}]

### 📌 Short Summary
[Concise, 2-3 sentence student-friendly overview of the topic for Class ${classLevel} level]

### 🎯 Key Points
- [Key point 1]
- [Key point 2]
- [Key point 3]
- [Key point 4]

### 📚 Important Definitions
- **[Term 1]**: [Clear, precise definition]
- **[Term 2]**: [Clear, precise definition]

### ⚡ Formulas & Key Rules
- **[Formula/Rule 1]**: [Formula or core principle]
- **[Formula/Rule 2]**: [Formula or core principle]
*(If not a formula-heavy topic, include key laws, dates, or grammar rules)*

### 💡 Examples
- **Example 1**: [Relatable everyday or practical example]
- **Example 2**: [Relatable everyday or practical example]

### ❓ Important Questions
1. **Q**: [High-yield exam question 1]?
   **A**: [Model concise answer]
2. **Q**: [High-yield exam question 2]?
   **A**: [Model concise answer]

### ⚡ Quick Revision
- ⚡ [Flashcard bullet 1]
- ⚡ [Flashcard bullet 2]
- ⚡ [Flashcard bullet 3]`;

      const promptText = `Generate comprehensive, high-scoring revision notes for Class ${classLevel} ${subject || "General"}.
Language: ${langName}

${sourceContext}

${formatGuide}`;

      const contentsParts: any[] = [];
      if (imagePart) contentsParts.push(imagePart);
      contentsParts.push({ text: promptText });

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents: {
          parts: contentsParts,
        },
      });

      return res.json({
        notes: response.text || "Notes generation failed.",
        title: `${subject || "Subject"} - ${topic || chapter || "Topic"}`,
        isFallback: false,
      });
    } catch (err: any) {
      console.error("Error in /api/ai/generate-notes:", err);
      return res.status(500).json({ error: err.message, isFallback: true });
    }
  });

  // 4. AI Quiz Generator Endpoint
  app.post("/api/ai/generate-quiz", async (req, res) => {
    try {
      const {
        topic,
        chapter,
        subject = "Science",
        classLevel = "10",
        questionCount = 5,
        difficulty = "Medium",
        language = "English",
        sourceType = "topic",
        sourceTitle,
        sourceContent,
        questionTypes = ["mcq", "true_false", "fill_in_blank", "short_answer"],
      } = req.body;

      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({ error: "Gemini API Key missing", isFallback: true });
      }

      let sourcePrompt = "";
      if (sourceType === "note" && sourceContent) {
        sourcePrompt = `QUIZ GENERATION SOURCE: AI Revision Note (${sourceTitle || topic})
Note Content Snippet:
"${sourceContent.slice(0, 1500)}"`;
      } else if (sourceType === "photo" && sourceContent) {
        sourcePrompt = `QUIZ GENERATION SOURCE: Photo Homework Solver Problem
Extracted Problem & Solution Context:
"${sourceContent.slice(0, 1500)}"`;
      } else {
        sourcePrompt = `QUIZ GENERATION SOURCE: Curriculum Topic
Subject: ${subject}
Chapter: ${chapter || topic}
Topic: ${topic}`;
      }

      const isHindi = language === "hi" || language === "Hindi";
      const langInstruction = isHindi
        ? "Language: Hindi (हिंदी). Write all questions, options, explanations, and hints in clear Hindi suitable for Class " + classLevel + "."
        : "Language: English. Write all questions, options, explanations, and hints in clear English suitable for Class " + classLevel + ".";

      const prompt = `You are EduAI Master Quiz Generator for Class ${classLevel} (${subject}).
Generate a high quality, curriculum-aligned educational practice quiz JSON object with EXACTLY ${questionCount} questions.

${sourcePrompt}
Difficulty Level: ${difficulty}
${langInstruction}
Question Types to include: ${Array.isArray(questionTypes) ? questionTypes.join(", ") : "mcq, true_false, fill_in_blank, short_answer"}

Respond ONLY with valid JSON matching this exact structure:
{
  "title": "${subject}: ${topic || chapter || "Practice"} Quiz",
  "subjectId": "${subject}",
  "chapterName": "${chapter || topic || "General"}",
  "topicName": "${topic || "Core Concepts"}",
  "difficulty": "${difficulty}",
  "questionCount": ${questionCount},
  "language": "${isHindi ? "Hindi" : "English"}",
  "rewardXp": ${Math.min(200, questionCount * 15)},
  "questions": [
    {
      "id": "q1",
      "question": "Question text...",
      "questionType": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "correctAnswer": "Option A",
      "explanation": "Clear step-by-step reason why Option A is correct.",
      "hint": "Helpful hint without giving away the direct answer.",
      "difficulty": "${difficulty}",
      "topic": "${topic || "General"}"
    },
    {
      "id": "q2",
      "question": "Statement text...",
      "questionType": "true_false",
      "options": ["${isHindi ? "सत्य" : "True"}", "${isHindi ? "असत्य" : "False"}"],
      "correctIndex": 0,
      "correctAnswer": "${isHindi ? "सत्य" : "True"}",
      "explanation": "Detailed explanation of why this statement is True/False.",
      "hint": "Think about fundamental conservation laws.",
      "difficulty": "${difficulty}",
      "topic": "${topic || "General"}"
    },
    {
      "id": "q3",
      "question": "Fill in the blank sentence with '___'...",
      "questionType": "fill_in_blank",
      "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
      "correctIndex": 0,
      "correctAnswer": "Choice A",
      "explanation": "Explanation of the blank word.",
      "hint": "Standard SI unit or keyword.",
      "difficulty": "${difficulty}",
      "topic": "${topic || "General"}"
    },
    {
      "id": "q4",
      "question": "Short descriptive question prompt...",
      "questionType": "short_answer",
      "options": [],
      "correctAnswer": "Model short answer text...",
      "explanation": "What key keywords or points earn full marks.",
      "hint": "Mention definition + example.",
      "difficulty": "${difficulty}",
      "topic": "${topic || "General"}"
    }
  ]
}`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = safeJsonParse(response.text || "{}", {});
      return res.json({ quiz: parsed, isFallback: false });
    } catch (err: any) {
      console.error("Error in /api/ai/generate-quiz:", err);
      return res.status(500).json({ error: err.message, isFallback: true });
    }
  });

  // 5. AI Exam Generator Endpoint
  app.post("/api/ai/generate-exam", async (req, res) => {
    try {
      const {
        subject = "Science",
        classLevel = "10",
        board = "CBSE",
        chapterTopics = "Full Syllabus",
        chapterList = [],
        difficulty = "Medium",
        questionCount = 10,
        language = "English",
        durationMinutes = 20,
      } = req.body;

      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({ error: "Gemini API Key missing", isFallback: true });
      }

      const isHindi = language === "Hindi" || language === "hi" || language === "हिंदी";
      const langText = isHindi ? "Hindi (हिंदी)" : "English";
      const topicsText = chapterTopics || (chapterList.length > 0 ? chapterList.join(", ") : "Full Syllabus");
      const mcqCount = Math.ceil(questionCount / 2);
      const subjectiveCount = questionCount - mcqCount;

      const prompt = `Generate a realistic board/term exam paper in JSON format for:
- Board: ${board}
- Class Level: Class ${classLevel}
- Subject: ${subject}
- Chapter/Topics: ${topicsText}
- Difficulty Level: ${difficulty}
- Total Questions: ${questionCount} (${mcqCount} MCQs in Section A + ${subjectiveCount} Short Answer questions in Section B)
- Language: ${langText}
- Exam Duration: ${durationMinutes} minutes

CRITICAL INSTRUCTIONS:
1. Write ALL question text, options, explanations, instructions, and sample answers strictly in ${langText}.
2. Ensure exactly ${questionCount} questions are returned in the "questions" array.
3. First ${mcqCount} questions MUST be Section A MCQs ("type": "mcq", 2 marks each).
4. Remaining ${subjectiveCount} questions MUST be Section B Short Answer ("type": "subjective", 5 marks each).
5. Calculate totalMarks = (${mcqCount} * 2) + (${subjectiveCount} * 5).
6. Set rewardXp = totalMarks * 3.

Respond ONLY with valid JSON matching this exact structure:
{
  "title": "${subject} Exam Paper (${board} Class ${classLevel})",
  "subjectId": "${subject}",
  "board": "${board}",
  "classLevel": "${classLevel}",
  "durationMinutes": ${durationMinutes},
  "totalMarks": ${mcqCount * 2 + subjectiveCount * 5},
  "passingMarks": ${Math.round((mcqCount * 2 + subjectiveCount * 5) * 0.4)},
  "rewardXp": ${(mcqCount * 2 + subjectiveCount * 5) * 3},
  "instructions": [
    "${isHindi ? "सभी प्रश्न अनिवार्य हैं।" : "All questions are compulsory."}",
    "${isHindi ? "खंड अ में बहुविकल्पीय प्रश्न (MCQs) शामिल हैं।" : "Section A contains Multiple Choice Questions."}",
    "${isHindi ? "खंड ब में लघु उत्तरीय (Short Answer) प्रश्न शामिल हैं।" : "Section B contains Short Answer Questions."}",
    "${isHindi ? "समय सीमा का ध्यान रखें।" : "Keep track of the countdown timer."}"
  ],
  "questions": [
    {
      "id": "ex-q1",
      "section": "Section A (MCQ)",
      "type": "mcq",
      "marks": 2,
      "question": "MCQ Question Text...",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": "Option A text",
      "explanation": "Explanation for the correct answer."
    },
    {
      "id": "ex-q2",
      "section": "Section B (Short Answer)",
      "type": "subjective",
      "marks": 5,
      "question": "Short Answer Question Text...",
      "sampleAnswer": "Model short answer explaining key concepts...",
      "explanation": "Marking scheme criteria for full marks."
    }
  ]
}`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = safeJsonParse(response.text || "{}", {});
      return res.json({ exam: parsed, isFallback: false });
    } catch (err: any) {
      console.error("Error in /api/ai/generate-exam:", err);
      return res.status(500).json({ error: err.message, isFallback: true });
    }
  });

  // 6. AI Study Planner Generator Endpoint
  app.post("/api/ai/generate-planner", async (req, res) => {
    try {
      const {
        classLevel = "10",
        selectedSubjects = ["Science", "Mathematics", "English"],
        availableHoursPerDay = 3,
        preferredTimeSlot = "Evening (5 PM - 8 PM)",
        examDates = [],
        personalGoals = [],
        dailyLearningTarget = "3 Tasks & 100 XP",
        language = "en",
        planMode = "standard",
        customPrompt = "",
        studentData = {},
      } = req.body;

      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({ error: "Gemini API Key missing", isFallback: true });
      }

      const isHindi = language === "hi" || language === "Hindi";
      const langText = isHindi ? "Hindi (हिंदी)" : "English";

      const subjectsStr = Array.isArray(selectedSubjects) && selectedSubjects.length > 0 ? selectedSubjects.join(", ") : "Science, Mathematics, English";
      const goalsStr = Array.isArray(personalGoals) && personalGoals.length > 0 ? personalGoals.join("; ") : "Pass board exams with distinction";
      const examsStr = Array.isArray(examDates) && examDates.length > 0
        ? examDates.map((e: any) => `${e.subject} (${e.title}): ${e.examDate}`).join("; ")
        : "None added yet";

      const weakTopicsStr = Array.isArray(studentData.weakTopics) && studentData.weakTopics.length > 0
        ? studentData.weakTopics.map((w: any) => `${w.subjectName} - ${w.topicName || w.chapterName} (Accuracy: ${w.accuracyRate}%, Urgency: ${w.urgency})`).join("; ")
        : "No critical weak topics recorded yet";

      let modeInstruction = "";
      if (planMode === "focus-weak") {
        modeInstruction = "FOCUS HEAVILY ON WEAK TOPICS: At least 60% of all generated tasks MUST be 'Weak Topic Fix' or 'Revision' targeting the student's listed weak topics.";
      } else if (planMode === "exam-prep") {
        modeInstruction = "INTENSIVE EXAM PREPARATION: Focus heavily on Mock Exam Papers, Previous Year Questions, and High-Weightage Revision for upcoming exam subjects.";
      } else if (planMode === "quick-revision") {
        modeInstruction = "QUICK REVISION PLAN: Create lightweight 15 to 30 minute summary revision tasks to easily maintain a study streak without burnout.";
      } else if (planMode === "improve") {
        modeInstruction = `STUDENT IMPROVEMENT REQUEST: Optimize the schedule according to this instruction: "${customPrompt || "Balance subjects, avoid overloaded days (>3 hrs/day), and prioritize weak topics."}".`;
      }

      const prompt = `You are EduAI Master, an expert AI Academic Planner for Class ${classLevel} students.
Generate a comprehensive, personalized 7-day study plan in JSON format based on the student's profile, schedule, exam dates, weak topics, and performance.

PLAN MODE / STRATEGY: ${planMode.toUpperCase()}
${modeInstruction}

STUDENT PROFILE & PARAMETERS:
- Class Level: Class ${classLevel}
- Selected Subjects: ${subjectsStr}
- Daily Available Study Time: ${availableHoursPerDay} hours/day
- Preferred Study Time Slot: ${preferredTimeSlot}
- Target Language: ${langText}
- Personal Study Goals: ${goalsStr}
- Daily Learning Target: ${dailyLearningTarget}
- Upcoming Exam Dates: ${examsStr}
- Student Weak Topics (CRITICAL TO ADDRESS): ${weakTopicsStr}
- Quiz/Exam History: ${studentData.quizzesTaken || 0} Quizzes completed with ${studentData.avgScorePercentage || 80}% average accuracy.

RULES:
1. All task titles, topics, and advice MUST be in ${langText}.
2. Schedule between 10 to 16 tasks spread across 7 days (including 'Today', 'Tomorrow', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').
3. Distribute tasks logically across selected subjects (${subjectsStr}) without overloading any single day.
4. Set start times matching or close to preferred time slot (${preferredTimeSlot}).
5. Each task MUST have: "id", "title", "subjectName", "topicName", "startTime", "estimatedMinutes", "priority" ("High"|"Medium"|"Low"), "completed" (false), "taskType" ("Lesson"|"Quiz"|"Revision"|"Exam Practice"|"Weak Topic Fix"), "dayOfWeek" ("Today"|"Tomorrow"|"Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"|"Saturday"|"Sunday"), and "dueDate".

Respond ONLY with valid JSON matching this exact structure:
{
  "weeklyGoalHours": ${availableHoursPerDay * 7},
  "aiAdviceNote": "${isHindi ? "यह अध्ययन योजना एआई द्वारा विशेष मोड के तहत आपके कमजोर विषयों और आगामी परीक्षाओं के लिए अनुकूलित की गई है।" : "This study plan is optimized by AI based on your selected strategy, weak topics, and upcoming exam deadlines."}",
  "tasks": [
    {
      "id": "st-1",
      "title": "${isHindi ? "विज्ञान: समतल एवं गोलीय दर्पण सूत्र का पुनरावलोकन" : "Revise Physics Mirror Formula & Ray Diagrams"}",
      "subjectName": "Science",
      "topicName": "Light: Reflection & Refraction",
      "startTime": "05:00 PM",
      "estimatedMinutes": 45,
      "priority": "High",
      "completed": false,
      "taskType": "Weak Topic Fix",
      "dayOfWeek": "Today",
      "dueDate": "Today"
    }
  ]
}`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = safeJsonParse(response.text || "{}", {});
      return res.json({ plan: parsed, isFallback: false });
    } catch (err: any) {
      console.error("Error in /api/ai/generate-planner:", err);
      return res.status(500).json({ error: err.message, isFallback: true });
    }
  });

  // 7. AI Question Paper Generator Endpoint
  app.post("/api/ai/generate-paper", async (req, res) => {
    try {
      const {
        classLevel = "10",
        board = "CBSE",
        subject = "Science",
        bookName = "NCERT",
        chapterTopic = "General Syllabus",
        difficulty = "Mixed",
        totalQuestions = 10,
        totalMarks = 40,
        durationMinutes = 60,
        language = "English",
        includeNumericals = false,
      } = req.body;

      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({ error: "Gemini API Key missing", isFallback: true });
      }

      const isHindi = language === "Hindi" || language === "hi";
      const langName = isHindi ? "Hindi (हिंदी)" : "English";

      const prompt = `You are an expert curriculum test developer for ${board} Class ${classLevel}.
Generate a complete, realistic, original practice question paper in JSON format. Do NOT reproduce copyrighted textbook questions verbatim.

PAPER PARAMETERS:
- Class: Class ${classLevel}
- Board: ${board}
- Subject: ${subject}
- Textbook Reference: ${bookName}
- Chapter/Topic: ${chapterTopic}
- Difficulty Level: ${difficulty}
- Total Marks: ${totalMarks}
- Exam Duration: ${durationMinutes} Minutes
- Language: ${langName}
${includeNumericals ? "- Include numerical calculation problems with step-by-step math." : ""}

REQUIRED SECTIONS & QUESTION TYPES:
1. Section A: Multiple Choice Questions (MCQs, 1 Mark each) with options and correct index.
2. Section B: Very Short Answer (VSA, 1-2 Marks each)
3. Section C: Short Answer (SA, 3 Marks each)
4. Section D: Long Answer (LA, 5 Marks each)
5. Section E: Case-Based / Passage-Based / Integrated Context Question (4 Marks each)

Each question object MUST contain:
- "id": string (e.g. "q-1", "q-2")
- "questionNumber": number
- "section": string ("Section A", "Section B", "Section C", "Section D", "Section E")
- "type": string ("mcq" | "vsa" | "sa" | "la" | "case_study" | "numerical")
- "typeLabel": string (e.g. "Multiple Choice Question", "Very Short Answer", "Short Answer", "Long Answer", "Case-Based Question", "Numerical Problem")
- "marks": number
- "question": string (the question text)
- "options": string[] (if mcq, 4 choices, otherwise empty array)
- "correctOptionIndex": number (if mcq, 0-3, otherwise null)
- "answerKey": string (detailed step-by-step correct model answer)
- "markingScheme": string[] (array of marking points, e.g. ["+1 for formula", "+1 for calculation"])
- "difficulty": string ("Easy" | "Medium" | "Hard")
- "chapterTopic": string

Respond ONLY with valid JSON matching this exact structure:
{
  "title": "${board} Class ${classLevel} ${subject} Model Question Paper",
  "board": "${board}",
  "classLevel": "${classLevel}",
  "subject": "${subject}",
  "bookName": "${bookName}",
  "chapterTopic": "${chapterTopic}",
  "difficulty": "${difficulty}",
  "totalQuestions": ${totalQuestions},
  "totalMarks": ${totalMarks},
  "durationMinutes": ${durationMinutes},
  "language": "${language}",
  "instructions": [
    "General Instructions:",
    "1. This paper contains ${totalQuestions} questions across 5 sections.",
    "2. All questions are compulsory.",
    "3. Section A contains MCQs carrying 1 mark each.",
    "4. Section B contains VSA carrying 2 marks each.",
    "5. Section C contains Short Answer questions carrying 3 marks each.",
    "6. Section D contains Long Answer questions carrying 5 marks each.",
    "7. Section E contains Case-based integrated questions carrying 4 marks each."
  ],
  "difficultyDistribution": {
    "easyPercentage": 35,
    "mediumPercentage": 45,
    "hardPercentage": 20
  },
  "questions": [
    {
      "id": "q-1",
      "questionNumber": 1,
      "section": "Section A",
      "type": "mcq",
      "typeLabel": "Multiple Choice Question",
      "marks": 1,
      "question": "Sample MCQ Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "answerKey": "Detailed answer key for Q1",
      "markingScheme": ["+1 for selecting correct option"],
      "difficulty": "Easy",
      "chapterTopic": "${chapterTopic}"
    }
  ]
}`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = safeJsonParse(response.text || "{}", {});
      return res.json({ paper: parsed, isFallback: false });
    } catch (err: any) {
      console.error("Error in /api/ai/generate-paper:", err);
      return res.status(500).json({ error: err.message, isFallback: true });
    }
  });

  // 8. AI Dedicated Translation Endpoint (Text, Markdown Notes, Quizzes, Study Plans)
  app.post("/api/ai/translate", async (req, res) => {
    try {
      const { text, targetLanguage = "en", sourceLanguage, type = "text", data } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(503).json({ error: "Gemini API Key missing on server", isFallback: true });
      }

      const isHindi = targetLanguage === "hi" || targetLanguage === "Hindi" || targetLanguage === "hindi";
      const isHinglish = targetLanguage === "hinglish" || targetLanguage === "Hinglish";
      const targetLangName = isHindi ? "Hindi (हिंदी)" : isHinglish ? "Hinglish (Hindi written using English alphabet)" : "English";

      if (type === "note" && data) {
        const prompt = `You are an expert bilingual educational translator.
Translate the following study note JSON into ${targetLangName}.
Translate the note title, contentMarkdown, and quickRevisionPoints.
Keep all Markdown formatting, headings (#, ##, ###), bold (**), bullet points, and LaTeX equations ($ ... $) intact.
Do NOT change the JSON structure or property names.

INPUT NOTE JSON:
${JSON.stringify(data, null, 2)}

Respond ONLY with valid JSON matching the exact same schema.`;

        const response = await generateContentWithRetry(ai, {
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsed = safeJsonParse(response.text || "{}", {});
        return res.json({ translatedData: parsed, isFallback: false });
      }

      if (type === "quiz" && data) {
        const prompt = `You are an expert bilingual test paper translator.
Translate the following Quiz JSON into ${targetLangName}.
Translate quiz title, chapterName, topicName, each question's text, all options, correctAnswer, explanation, and hint.
Ensure the correctIndex points to the corresponding translated option.
Do NOT change the JSON schema, IDs, or numeric fields.

INPUT QUIZ JSON:
${JSON.stringify(data, null, 2)}

Respond ONLY with valid JSON matching the exact same schema.`;

        const response = await generateContentWithRetry(ai, {
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsed = safeJsonParse(response.text || "{}", {});
        return res.json({ translatedData: parsed, isFallback: false });
      }

      if (type === "plan" && data) {
        const prompt = `You are an expert bilingual academic planner.
Translate the following Study Plan JSON into ${targetLangName}.
Translate aiAdviceNote, task titles, topic names, and personal goal descriptions.
Do NOT change task IDs, dates, numbers, priority values, or structure.

INPUT PLAN JSON:
${JSON.stringify(data, null, 2)}

Respond ONLY with valid JSON matching the exact same schema.`;

        const response = await generateContentWithRetry(ai, {
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsed = safeJsonParse(response.text || "{}", {});
        return res.json({ translatedData: parsed, isFallback: false });
      }

      // Default: Text / Markdown translation
      const prompt = `You are an expert academic translator for school students.
Translate the following content into ${targetLangName}.
Preserve all Markdown formatting (headers, bold, bullet points, numbers, tables) and LaTeX math formulas ($...$ or $...$).
Provide a high-quality, natural, and curriculum-accurate translation suitable for Class 1-12 students.

CONTENT TO TRANSLATE:
"""
${text || ""}
"""

Output ONLY the translated text without additional meta commentary.`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      return res.json({
        translatedText: response.text || text || "",
        targetLanguage,
        isFallback: false,
      });
    } catch (err: any) {
      console.error("Error in /api/ai/translate:", err);
      return res.status(500).json({
        error: err.message || "Translation failed",
        isFallback: true,
      });
    }
  });

  // 9. AI Personal Learning System Recommendations Endpoint
  app.post("/api/ai/recommendations", async (req, res) => {
    try {
      const {
        profile = {},
        weakTopics = [],
        strongTopics = [],
        quizResults = [],
        examResults = [],
        studyPlan = {},
        savedNotes = [],
        activities = [],
        language = "en",
      } = req.body;

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({ error: "Gemini API Key missing on server", isFallback: true });
      }

      const isHindi = language === "hi" || language === "Hindi" || language === "hindi";
      const isHinglish = language === "hinglish" || language === "Hinglish";
      const targetLangName = isHindi
        ? "Hindi (हिंदी)"
        : isHinglish
        ? "Hinglish (Hindi written using English alphabet)"
        : "English";

      const prompt = `You are EduAI's Personal Academic Learning System & Advisor for school students.
Analyze the following student's actual learning history and syllabus goals to generate structured, highly personalized study recommendations.

STUDENT PROFILE & LEARNING METRICS:
- Name: ${profile.name || "Student"}
- Class / Grade: Class ${profile.classLevel || "10"} (${profile.board || "CBSE"} Board, ${profile.medium || "English"} Medium)
- Selected Subjects: ${(profile.selectedSubjects || []).join(", ") || "Science, Mathematics, Social Science, English"}
- Learning Goals: ${(profile.learningGoals || []).join("; ") || "Score 90%+ in Board Exams"}
- Current Level: Level ${profile.level || 1} (${profile.xp || 0} XP, ${profile.streakDays || 1} Day Streak)
- Quizzes Completed: ${profile.quizzesTaken || quizResults.length || 0} (Avg Score: ${profile.avgScorePercentage || 85}%)
- Mock Exams Completed: ${profile.examsCompleted || examResults.length || 0}

WEAK TOPICS IDENTIFIED:
${JSON.stringify(weakTopics.slice(0, 6), null, 2)}

STRONG TOPICS (MASTERY):
${JSON.stringify(strongTopics.slice(0, 5), null, 2)}

RECENT QUIZ RESULTS:
${JSON.stringify(quizResults.slice(0, 4).map((q: any) => ({ title: q.title, subject: q.subjectId, score: q.score, accuracy: q.accuracyPercentage, date: q.createdDate })), null, 2)}

RECENT EXAM ATTEMPTS:
${JSON.stringify(examResults.slice(0, 3).map((e: any) => ({ title: e.title, subject: e.subjectId, scoreEarned: e.scoreEarned, totalMarks: e.totalMarks, accuracy: e.accuracyPercentage })), null, 2)}

ACTIVE STUDY PLAN TASKS:
${JSON.stringify((studyPlan.tasks || []).slice(0, 6).map((t: any) => ({ title: t.title, subject: t.subjectName, completed: t.completed, priority: t.priority, taskType: t.taskType })), null, 2)}

UPCOMING EXAM DATES:
${JSON.stringify(studyPlan.examDates || [], null, 2)}

PREFERRED LANGUAGE: ${targetLangName}

STRICT REQUIREMENTS & CONSTRAINTS:
1. Ground all recommendations strictly in actual learning data provided above (accuracy rates, weak chapters, upcoming exams, syllabus importance).
2. DO NOT make sensitive, personal, or unsupported assumptions about the student. Keep tone encouraging, pedagogical, and objective.
3. Language mandate: Provide all titles, subtitles, reasons, insights, and summaries in ${targetLangName}.
4. Provide realistic, actionable items with appropriate difficulty ('Easy' for remediation, 'Medium' for standard practice, 'Hard' for mastery stretch).
5. Explainability is mandatory: Each item must explain WHY it is recommended and cite the trigger data.

JSON SCHEMA TO RETURN (Strictly valid JSON):
{
  "overviewSummary": "1-2 concise sentence diagnostic summary of current learning state and primary focus",
  "performanceInsight": "2-3 sentences explaining strengths and targeted high-yield opportunities based on actual quiz/exam results",
  "readinessScore": 84,
  "todaysFocus": [
    {
      "id": "rec-focus-1",
      "type": "next_study",
      "title": "Topic or lesson title",
      "subtitle": "Chapter and core concept",
      "subject": "Subject Name",
      "chapterTopic": "Chapter / Topic Name",
      "recommendedDifficulty": "Easy" | "Medium" | "Hard",
      "reason": "Clear explanation of why to study this today",
      "dataTrigger": "e.g. Next syllabus prerequisite following strong performance in ...",
      "actionType": "navigate_books" | "navigate_notes" | "navigate_ask_ai",
      "actionPayload": { "subject": "...", "chapter": "...", "topic": "..." },
      "actionLabel": "Resume Lesson" | "Open Notes" | "Ask AI Tutor",
      "estimatedMinutes": 25,
      "priority": "High" | "Medium" | "Low",
      "xpReward": 50
    }
  ],
  "topicsToRevise": [
    {
      "id": "rec-rev-1",
      "type": "topic_revision",
      "title": "Weak topic revision title",
      "subtitle": "Chapter name and urgent concept",
      "subject": "Subject Name",
      "chapterTopic": "Chapter / Topic Name",
      "recommendedDifficulty": "Easy" | "Medium",
      "reason": "Why this specific topic needs urgent revision before test",
      "dataTrigger": "e.g. 42% accuracy in recent quiz on Spherical Mirrors",
      "actionType": "navigate_notes" | "navigate_quiz" | "navigate_ask_ai",
      "actionPayload": { "subject": "...", "chapter": "...", "topic": "..." },
      "actionLabel": "Revise AI Notes" | "Practice Retest",
      "estimatedMinutes": 15,
      "priority": "High",
      "xpReward": 40
    }
  ],
  "recommendedPractice": [
    {
      "id": "rec-prac-1",
      "type": "practice_quiz",
      "title": "Practice Quiz title",
      "subtitle": "Concept mastery test",
      "subject": "Subject Name",
      "chapterTopic": "Chapter / Topic Name",
      "recommendedDifficulty": "Easy" | "Medium" | "Hard",
      "reason": "Reinforces concept retention and tests calculation speed",
      "dataTrigger": "e.g. Moderate score (55%) in Quadratic Equations",
      "actionType": "navigate_quiz",
      "actionPayload": { "subject": "...", "chapter": "...", "topic": "...", "difficulty": "Medium", "questionCount": 5 },
      "actionLabel": "Start 5-Q Practice Quiz",
      "estimatedMinutes": 10,
      "priority": "High" | "Medium",
      "xpReward": 50
    }
  ],
  "examPreparation": [
    {
      "id": "rec-exam-1",
      "type": "exam_prep",
      "title": "Mock Assessment or Blueprint Paper",
      "subtitle": "Full Chapter Board Exam Simulation",
      "subject": "Subject Name",
      "chapterTopic": "Chapter / Section",
      "recommendedDifficulty": "Medium" | "Hard",
      "reason": "High weightage (8-10 marks) in upcoming Board examination",
      "dataTrigger": "e.g. Target Exam Date approaching in 14 days",
      "actionType": "navigate_exam" | "navigate_paper",
      "actionPayload": { "subject": "...", "chapter": "...", "difficulty": "Medium" },
      "actionLabel": "Start Timed Mock Exam" | "Generate Paper",
      "estimatedMinutes": 45,
      "priority": "High",
      "xpReward": 100
    }
  ],
  "dailyGoals": [
    {
      "id": "rec-goal-1",
      "type": "daily_goal",
      "title": "Daily Goal Title",
      "subtitle": "Bite-sized milestone",
      "subject": "Subject Name",
      "chapterTopic": "Topic",
      "recommendedDifficulty": "Medium",
      "reason": "Helps meet your ${profile.dailyXpGoal || 100} XP daily target and preserves your ${profile.streakDays || 1}-day streak",
      "dataTrigger": "Daily XP Target Progress",
      "actionType": "navigate_quiz" | "navigate_notes" | "navigate_ask_ai",
      "actionPayload": { "subject": "..." },
      "actionLabel": "Complete Goal",
      "estimatedMinutes": 15,
      "priority": "Medium",
      "xpReward": 35
    }
  ]
}

Return ONLY the JSON response object.`;

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = safeJsonParse(response.text || "{}", {});
      return res.json({ recommendations: parsed, isFallback: false, generatedAt: new Date().toISOString() });
    } catch (err: any) {
      console.error("Error in /api/ai/recommendations:", err);
      // Resilient fallback recommendations based on provided profile and metrics
      const { profile = {}, weakTopics = [], quizResults = [] } = req.body || {};
      const fallbackRecs = {
        overviewSummary: `Adaptive Diagnostic: Maintaining steady progress in ${profile.selectedSubjects?.[0] || "Core Subjects"} with ${profile.avgScorePercentage || 78}% average accuracy.`,
        performanceInsight: weakTopics.length > 0 
          ? `Identified ${weakTopics.length} priority concepts needing review (${weakTopics.map((w: any) => w.topicName).slice(0, 2).join(", ")}). Immediate practice will solidify fundamentals.`
          : `Strong foundational scores across recent assessments. Ready for advanced practice and timed mock exams.`,
        readinessScore: Math.min(95, Math.max(55, Math.round(profile.avgScorePercentage || 78))),
        todaysFocus: [
          {
            id: "rec-fb-focus-1",
            type: "next_study",
            title: weakTopics[0]?.topicName || `${profile.selectedSubjects?.[0] || "Science"}: Core Foundations`,
            subtitle: weakTopics[0]?.chapterName || "Key Concepts & Numerical Problem Solving",
            subject: weakTopics[0]?.subjectName || profile.selectedSubjects?.[0] || "Science",
            chapterTopic: weakTopics[0]?.topicName || "Core Concepts",
            recommendedDifficulty: "Medium",
            reason: weakTopics[0] ? `Recent accuracy at ${weakTopics[0].accuracyRate}%. Step-by-step revision will build confidence.` : "Next scheduled curriculum milestone.",
            dataTrigger: weakTopics[0] ? `${weakTopics[0].accuracyRate}% in recent test` : "Curriculum Sequence",
            actionType: "navigate_notes",
            actionPayload: { subject: weakTopics[0]?.subjectName || "Science", topic: weakTopics[0]?.topicName || "Core Concepts" },
            actionLabel: "Revise AI Notes",
            estimatedMinutes: 20,
            priority: "High",
            xpReward: 50,
          },
        ],
        topicsToRevise: weakTopics.slice(0, 3).map((w: any, idx: number) => ({
          id: `rec-fb-rev-${idx}`,
          type: "topic_revision",
          title: `Revise ${w.topicName}`,
          subtitle: `${w.chapterName} • ${w.accuracyRate}% Accuracy`,
          subject: w.subjectName || "Science",
          chapterTopic: w.topicName,
          recommendedDifficulty: "Easy",
          reason: `Targeted revision to improve from ${w.accuracyRate}% to 85%+ mastery.`,
          dataTrigger: `${w.accuracyRate}% Accuracy Rate`,
          actionType: "navigate_quiz",
          actionPayload: { subject: w.subjectName, topic: w.topicName },
          actionLabel: "Practice Remedial Quiz",
          estimatedMinutes: 15,
          priority: "High",
          xpReward: 40,
        })),
        recommendedPractice: [
          {
            id: "rec-fb-prac-1",
            type: "practice_quiz",
            title: `${profile.selectedSubjects?.[0] || "Science"} 5-Q Speed Test`,
            subtitle: "Rapid Recall & Formula Practice",
            subject: profile.selectedSubjects?.[0] || "Science",
            chapterTopic: "All Chapters",
            recommendedDifficulty: "Medium",
            reason: "Strengthens active recall and exam answering speed.",
            dataTrigger: "Daily Practice Goal",
            actionType: "navigate_quiz",
            actionPayload: { subject: profile.selectedSubjects?.[0] || "Science", questionCount: 5, difficulty: "Medium" },
            actionLabel: "Start 5-Q Quiz",
            estimatedMinutes: 10,
            priority: "Medium",
            xpReward: 45,
          },
        ],
        examPreparation: [
          {
            id: "rec-fb-exam-1",
            type: "exam_prep",
            title: `Full ${profile.board || "CBSE"} Class ${profile.classLevel || "10"} Mock Assessment`,
            subtitle: "Timed Simulated Examination with Marking Scheme",
            subject: profile.selectedSubjects?.[0] || "Science",
            chapterTopic: "Full Syllabus",
            recommendedDifficulty: "Medium",
            reason: "High-yield simulation to evaluate board exam readiness.",
            dataTrigger: "Board Exam Preparation",
            actionType: "navigate_exam",
            actionPayload: { subject: profile.selectedSubjects?.[0] || "Science", difficulty: "Medium" },
            actionLabel: "Start Timed Exam",
            estimatedMinutes: 30,
            priority: "High",
            xpReward: 100,
          },
        ],
        dailyGoals: [
          {
            id: "rec-fb-goal-1",
            type: "daily_goal",
            title: `Daily Target: Reach ${profile.dailyXpGoal || 100} XP`,
            subtitle: `Maintain your ${profile.streakDays || 1}-day active study streak`,
            subject: "All Subjects",
            chapterTopic: "Daily Goals",
            recommendedDifficulty: "Medium",
            reason: "Consistent daily practice produces highest long-term retention.",
            dataTrigger: "Daily Streak",
            actionType: "navigate_quiz",
            actionPayload: {},
            actionLabel: "Earn XP",
            estimatedMinutes: 15,
            priority: "Medium",
            xpReward: 35,
          },
        ],
      };

      return res.json({
        recommendations: fallbackRecs,
        isFallback: true,
        error: err.message,
        generatedAt: new Date().toISOString(),
      });
    }
  });

  // 11. AI Adaptive Learning Path Generator Endpoint
  app.post("/api/ai/adaptive-path", async (req, res) => {
    try {
      const {
        profile,
        selectedSubject,
        weakTopics = [],
        strongTopics = [],
        quizResults = [],
        examResults = [],
        studyHistory = [],
        recentMistakes = [],
        studyGoals = [],
        language = "en",
      } = req.body;

      const isHindi = language === "hi";
      const isHinglish = language === "hinglish";

      const prompt = `You are an expert AI Adaptive Learning Engine for Indian K-12 education (Class 1 to 12, CBSE/ICSE/State Boards).
Analyze this student's real learning data and construct a personalized, non-linear adaptive learning path for the selected subject "${selectedSubject || 'Science'}".

STUDENT CONTEXT:
- Class: ${profile?.classLevel || "10"}
- Board: ${profile?.board || "CBSE"}
- Medium: ${profile?.medium || "English"}
- Selected Subject: ${selectedSubject || "Science"}
- Learning Goals: ${JSON.stringify(studyGoals.length ? studyGoals : profile?.learningGoals || [])}
- Overall Avg Score: ${profile?.avgScorePercentage || 75}%
- Total Quizzes Taken: ${quizResults.length}
- Total Exams Completed: ${examResults.length}
- Flagged Weak Topics: ${JSON.stringify(weakTopics.map((w: any) => ({ topic: w.topicName, chapter: w.chapterName, accuracy: w.accuracyRate })))}
- Strong Topics: ${JSON.stringify(strongTopics.map((s: any) => ({ topic: s.topicName, accuracy: s.accuracyRate })))}
- Recent Mistakes logged: ${JSON.stringify(recentMistakes.slice(0, 8))}

RULES FOR MASTERY EVALUATION:
For every topic in the syllabus for Class ${profile?.classLevel || "10"} ${selectedSubject || "Science"}:
1. Status MUST be one of:
   - "Beginner" (0 attempts or accuracy < 40%, lacks foundational clarity)
   - "Learning" (accuracy 40%-65%, understands basic definitions but makes calculation/conceptual errors)
   - "Practicing" (accuracy 65%-84%, solves standard questions, needs application speed)
   - "Strong" (accuracy >= 85%, mastered fundamentals, ready for HOTS/Olympiad level)
2. Current Difficulty Level MUST be one of:
   - "Level 1 - Foundation" (for Beginner or struggling topics)
   - "Level 2 - Standard" (for Learning topics)
   - "Level 3 - Advanced" (for Practicing topics)
   - "Level 4 - HOTS / Application" (for Strong topics)
3. Identify the EXACT "currentTopic" that the student should work on right now (the most critical weak or in-progress prerequisite).
4. Identify the "recommendedNextTopic" (the next logical topic once current topic hits >=75% mastery).
5. Output language: ${isHindi ? "Hindi (हिंदी)" : isHinglish ? "Hinglish" : "English"}.

OUTPUT FORMAT (Respond with STRICT JSON only matching this schema):
{
  "studentClass": "${profile?.classLevel || "10"}",
  "selectedSubject": "${selectedSubject || "Science"}",
  "overallMasteryPercentage": 68,
  "strugglingTopicsCount": 2,
  "strongTopicsCount": 3,
  "activeDifficultyTier": "Level 2 - Standard",
  "recentAssessmentInsight": "Diagnostic summary of performance and learning velocity",
  "currentTopic": {
    "id": "tp-adapt-1",
    "subjectName": "${selectedSubject || "Science"}",
    "chapterName": "Chapter Name",
    "topicName": "Topic Name",
    "status": "Learning",
    "masteryPercentage": 52,
    "currentDifficulty": "Level 2 - Standard",
    "attemptsCount": 2,
    "accuracyRate": 52,
    "recentMistakes": ["Mistake 1 description", "Mistake 2 description"],
    "keyFormulas": ["Formula 1", "Formula 2"],
    "simpleExplanation": "2-sentence ultra-clear explanation of the core concept",
    "easyExample": {
      "question": "Clear simple question",
      "stepByStepSolution": "Step 1... Step 2...",
      "keyTakeaway": "Golden rule to avoid mistakes"
    },
    "isCurrent": true,
    "isNextRecommended": false,
    "recommendedAction": "Practice 3 guided questions with step-by-step hints",
    "consecutiveCorrect": 0,
    "consecutiveWrong": 2,
    "lastAssessedAt": "Today"
  },
  "recommendedNextTopic": {
    "id": "tp-adapt-2",
    "subjectName": "${selectedSubject || "Science"}",
    "chapterName": "Next Chapter",
    "topicName": "Next Topic",
    "status": "Beginner",
    "masteryPercentage": 20,
    "currentDifficulty": "Level 1 - Foundation",
    "attemptsCount": 0,
    "accuracyRate": 0,
    "recentMistakes": [],
    "isCurrent": false,
    "isNextRecommended": true,
    "recommendedAction": "Unlock after reaching 75% on current topic",
    "consecutiveCorrect": 0,
    "consecutiveWrong": 0,
    "lastAssessedAt": "Not started"
  },
  "topics": [
    {
      "id": "tp-adapt-1",
      "subjectName": "${selectedSubject || "Science"}",
      "chapterName": "Chapter 1",
      "topicName": "Topic 1",
      "status": "Strong",
      "masteryPercentage": 90,
      "currentDifficulty": "Level 4 - HOTS / Application",
      "attemptsCount": 4,
      "accuracyRate": 90,
      "recentMistakes": [],
      "isCurrent": false,
      "isNextRecommended": false,
      "recommendedAction": "Maintain with weekly HOTS questions",
      "consecutiveCorrect": 3,
      "consecutiveWrong": 0,
      "lastAssessedAt": "2 days ago"
    },
    {
      "id": "tp-adapt-2",
      "subjectName": "${selectedSubject || "Science"}",
      "chapterName": "Chapter 2",
      "topicName": "Topic 2",
      "status": "Learning",
      "masteryPercentage": 52,
      "currentDifficulty": "Level 2 - Standard",
      "attemptsCount": 2,
      "accuracyRate": 52,
      "recentMistakes": ["Sign convention confusion"],
      "isCurrent": true,
      "isNextRecommended": false,
      "recommendedAction": "Focus on sign convention rules",
      "consecutiveCorrect": 0,
      "consecutiveWrong": 2,
      "lastAssessedAt": "Today"
    },
    {
      "id": "tp-adapt-3",
      "subjectName": "${selectedSubject || "Science"}",
      "chapterName": "Chapter 2",
      "topicName": "Topic 3",
      "status": "Practicing",
      "masteryPercentage": 72,
      "currentDifficulty": "Level 3 - Advanced",
      "attemptsCount": 3,
      "accuracyRate": 72,
      "recentMistakes": ["Calculation speed in ray tracing"],
      "isCurrent": false,
      "isNextRecommended": false,
      "recommendedAction": "Practice 5 advanced numericals",
      "consecutiveCorrect": 2,
      "consecutiveWrong": 0,
      "lastAssessedAt": "Yesterday"
    },
    {
      "id": "tp-adapt-4",
      "subjectName": "${selectedSubject || "Science"}",
      "chapterName": "Chapter 3",
      "topicName": "Topic 4",
      "status": "Beginner",
      "masteryPercentage": 10,
      "currentDifficulty": "Level 1 - Foundation",
      "attemptsCount": 0,
      "accuracyRate": 0,
      "recentMistakes": [],
      "isCurrent": false,
      "isNextRecommended": true,
      "recommendedAction": "Upcoming prerequisite",
      "consecutiveCorrect": 0,
      "consecutiveWrong": 0,
      "lastAssessedAt": "Not started"
    }
  ]
}
Return ONLY valid JSON.`;

      const ai = getGeminiClient();
      if (!ai) {
        throw new Error("Gemini API key is not configured");
      }

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = safeJsonParse(response.text || "{}", {});
      return res.json({ path: parsed, isFallback: false, generatedAt: new Date().toISOString() });
    } catch (err: any) {
      console.error("Error in /api/ai/adaptive-path:", err);
      // Build graceful local adaptive fallback path
      const { selectedSubject = "Science", profile = {}, weakTopics = [] } = req.body || {};
      const subjectName = selectedSubject || "Science";
      const weakMatch = weakTopics.find((w: any) => w.subjectName === subjectName) || weakTopics[0];

      const fallbackPath = {
        studentClass: profile?.classLevel || "10",
        selectedSubject: subjectName,
        overallMasteryPercentage: Math.round(profile?.avgScorePercentage || 72),
        strugglingTopicsCount: weakTopics.length || 1,
        strongTopicsCount: 2,
        activeDifficultyTier: "Level 2 - Standard",
        recentAssessmentInsight: weakMatch 
          ? `Focusing on ${weakMatch.topicName} to resolve recent mistakes and elevate mastery from ${weakMatch.accuracyRate}%.`
          : `Solid progress in ${subjectName}. Advancing through standard syllabus prerequisites.`,
        currentTopic: {
          id: "tp-adapt-curr",
          subjectName: subjectName,
          chapterName: weakMatch?.chapterName || (subjectName === "Science" ? "Light: Reflection and Refraction" : subjectName === "Mathematics" ? "Quadratic Equations" : "Core Chapter"),
          topicName: weakMatch?.topicName || (subjectName === "Science" ? "Mirror Formula & Magnification" : subjectName === "Mathematics" ? "Discriminant & Nature of Roots" : "Fundamental Concepts"),
          status: weakMatch ? "Learning" : "Practicing",
          masteryPercentage: weakMatch ? weakMatch.accuracyRate : 60,
          currentDifficulty: "Level 2 - Standard",
          attemptsCount: 2,
          accuracyRate: weakMatch ? weakMatch.accuracyRate : 60,
          recentMistakes: [
            "Sign convention errors in formula substitution",
            "Calculation slip during fractional simplification"
          ],
          keyFormulas: [
            "1/f = 1/v + 1/u",
            "m = -v/u = h_i / h_o"
          ],
          simpleExplanation: "The mirror formula relates object distance (u), image distance (v), and focal length (f). Always apply the Cartesian sign convention measuring from the pole.",
          easyExample: {
            question: "A concave mirror has a focal length of 15 cm. Find the image distance when an object is placed 30 cm in front of it.",
            stepByStepSolution: "1. Given: f = -15 cm, u = -30 cm (by sign convention).\\n2. Formula: 1/v = 1/f - 1/u\\n3. Substitute: 1/v = 1/(-15) - 1/(-30) = -2/30 + 1/30 = -1/30\\n4. Image Distance: v = -30 cm (real, inverted at center of curvature).",
            keyTakeaway: "Concave mirror focal length (f) is always negative; object distance (u) is always negative."
          },
          isCurrent: true,
          isNextRecommended: false,
          recommendedAction: "Practice 3 guided questions with step-by-step hints",
          consecutiveCorrect: 0,
          consecutiveWrong: 1,
          lastAssessedAt: "Today"
        },
        recommendedNextTopic: {
          id: "tp-adapt-next",
          subjectName: subjectName,
          chapterName: weakMatch?.chapterName || (subjectName === "Science" ? "Light: Reflection and Refraction" : "Next Chapter"),
          topicName: subjectName === "Science" ? "Refraction through Spherical Lenses" : "Next Topic",
          status: "Beginner",
          masteryPercentage: 20,
          currentDifficulty: "Level 1 - Foundation",
          attemptsCount: 0,
          accuracyRate: 0,
          recentMistakes: [],
          isCurrent: false,
          isNextRecommended: true,
          recommendedAction: "Unlock after reaching 75% on current topic",
          consecutiveCorrect: 0,
          consecutiveWrong: 0,
          lastAssessedAt: "Not started"
        },
        topics: [
          {
            id: "tp-adapt-1",
            subjectName: subjectName,
            chapterName: weakMatch?.chapterName || "Light: Reflection and Refraction",
            topicName: "Laws of Reflection & Plane Mirrors",
            status: "Strong",
            masteryPercentage: 92,
            currentDifficulty: "Level 4 - HOTS / Application",
            attemptsCount: 4,
            accuracyRate: 92,
            recentMistakes: [],
            isCurrent: false,
            isNextRecommended: false,
            recommendedAction: "Maintain with weekly HOTS questions",
            consecutiveCorrect: 3,
            consecutiveWrong: 0,
            lastAssessedAt: "2 days ago"
          },
          {
            id: "tp-adapt-2",
            subjectName: subjectName,
            chapterName: weakMatch?.chapterName || "Light: Reflection and Refraction",
            topicName: weakMatch?.topicName || "Mirror Formula & Magnification",
            status: "Learning",
            masteryPercentage: weakMatch ? weakMatch.accuracyRate : 58,
            currentDifficulty: "Level 2 - Standard",
            attemptsCount: 2,
            accuracyRate: weakMatch ? weakMatch.accuracyRate : 58,
            recentMistakes: ["Sign convention confusion"],
            isCurrent: true,
            isNextRecommended: false,
            recommendedAction: "Focus on Cartesian sign convention rules",
            consecutiveCorrect: 0,
            consecutiveWrong: 1,
            lastAssessedAt: "Today"
          },
          {
            id: "tp-adapt-3",
            subjectName: subjectName,
            chapterName: weakMatch?.chapterName || "Light: Reflection and Refraction",
            topicName: "Refraction through Spherical Lenses",
            status: "Beginner",
            masteryPercentage: 15,
            currentDifficulty: "Level 1 - Foundation",
            attemptsCount: 0,
            accuracyRate: 0,
            recentMistakes: [],
            isCurrent: false,
            isNextRecommended: true,
            recommendedAction: "Upcoming prerequisite",
            consecutiveCorrect: 0,
            consecutiveWrong: 0,
            lastAssessedAt: "Not started"
          }
        ]
      };

      return res.json({
        path: fallbackPath,
        isFallback: true,
        error: err.message,
        generatedAt: new Date().toISOString()
      });
    }
  });

  // 12. Dynamic Adaptive Practice Question & Remedial Engine
  app.post("/api/ai/adaptive-practice", async (req, res) => {
    try {
      const {
        topic,
        subject,
        chapter,
        classLevel = "10",
        board = "CBSE",
        currentDifficulty = "Level 2 - Standard",
        isStruggling = false,
        isImproving = false,
        consecutiveWrong = 0,
        consecutiveCorrect = 0,
        recentMistakes = [],
        language = "en",
      } = req.body;

      const isHindi = language === "hi";
      const isHinglish = language === "hinglish";

      const prompt = `You are the AI Adaptive Practice Engine for Indian School Education (Class ${classLevel} ${board}).
Generate an intelligent adaptive practice item for:
- Subject: ${subject}
- Chapter: ${chapter}
- Topic: ${topic}
- Current Difficulty Tier: ${currentDifficulty}
- Student Status: ${isStruggling ? "STRUGGLING (Recent mistakes / low accuracy)" : isImproving ? "IMPROVING (Consecutive correct answers / high accuracy)" : "NORMAL PRACTICE"}
- Consecutive Mistakes: ${consecutiveWrong}
- Consecutive Correct: ${consecutiveCorrect}
- Past Mistakes on this topic: ${JSON.stringify(recentMistakes)}

ADAPTIVE PEDAGOGY RULES:
1. IF STUDENT STRUGGLES (${isStruggling || consecutiveWrong >= 1}):
   - Lower the cognitive load to Foundation level.
   - Provide "simpleConceptBreakdown": 2-3 bullet points explaining the core concept without jargon.
   - Provide "easyExample": A solved micro-example showing step-by-step working and a "keyTakeaway".
   - Provide "hints": Array of 3 progressive hints (Hint 1: clue, Hint 2: formula/key step, Hint 3: almost-solution).
   - The practice question should test basic concept understanding with clear feedback.

2. IF STUDENT IMPROVES (${isImproving || consecutiveCorrect >= 2}):
   - Elevate difficulty to Level 3 (Advanced) or Level 4 (HOTS / Application).
   - Set "isApplicationBased": true.
   - Provide a "realWorldScenario" or multi-step reasoning context (CBSE Case-Based / Higher Order Thinking).
   - Give 2 concise hints for tricky corner cases.

3. Output Language: ${isHindi ? "Hindi (हिंदी)" : isHinglish ? "Hinglish" : "English"}.

OUTPUT FORMAT (Strict JSON):
{
  "id": "ad-q-${Date.now()}",
  "question": "Question text with clear formatting and LaTeX if needed",
  "options": [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ],
  "correctIndex": 0,
  "explanation": "Detailed step-by-step solution explaining why the correct option is right and why distractors are wrong",
  "difficulty": "${isStruggling ? "Easy" : isImproving ? "Hard" : "Medium"}",
  "difficultyTier": "${isStruggling ? "Level 1 - Foundation" : isImproving ? "Level 4 - HOTS / Application" : currentDifficulty}",
  "topic": "${topic}",
  "subject": "${subject}",
  "hints": [
    "Hint 1: Identify the given values...",
    "Hint 2: Recall the formula...",
    "Hint 3: Watch out for units..."
  ],
  "isApplicationBased": ${isImproving ? true : false},
  "realWorldScenario": "${isImproving ? "Real-world engineering / daily life application context" : ""}",
  "guidedStepPrompt": "${isStruggling ? "Try identifying the given variables first." : ""}",
  "simpleConceptBreakdown": "${isStruggling ? "• Core rule 1\\n• Core rule 2\\n• Common trap to avoid" : ""}",
  "easyExample": ${
    isStruggling
      ? JSON.stringify({
          question: "Simple illustrative problem",
          stepByStepSolution: "Step 1: Write given values. Step 2: Apply formula. Step 3: Compute answer.",
          keyTakeaway: "Always check sign before multiplying."
        })
      : "null"
  }
}
Return ONLY valid JSON.`;

      const aiInstance = getGeminiClient();
      if (!aiInstance) {
        throw new Error("Gemini API key is not configured");
      }

      const response = await generateContentWithRetry(aiInstance, {
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = safeJsonParse(response.text || "{}", {});
      return res.json({ questionItem: parsed, isFallback: false });
    } catch (err: any) {
      console.error("Error in /api/ai/adaptive-practice:", err);
      // Resilient local practice question fallback
      const { topic = "Core Concept", subject = "Science", isStruggling = false, isImproving = false } = req.body || {};
      const fallbackItem = {
        id: `ad-q-fb-${Date.now()}`,
        question: isStruggling
          ? `For a concave mirror of focal length $f = -10\\text{ cm}$, if an object is placed at $u = -20\\text{ cm}$ (at the center of curvature), where is the image formed?`
          : isImproving
          ? `An optical sensor uses a convex mirror for a wide field of view with radius of curvature $R = 4\\text{ m}$. If a vehicle is situated at $u = -5\\text{ m}$, calculate the exact image distance and linear magnification.`
          : `According to the mirror formula $\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}$, if a concave mirror has focal length $15\\text{ cm}$ and object distance is $30\\text{ cm}$, what is the image distance?`,
        options: isStruggling
          ? ["$v = -20\\text{ cm}$ (at center of curvature, real and inverted)", "$v = -10\\text{ cm}$ (at focus)", "$v = +20\\text{ cm}$ (behind mirror)", "$v = -30\\text{ cm}$"]
          : isImproving
          ? ["$v = +1.15\\text{ m}$, $m = +0.23$ (virtual, erect, diminished)", "$v = -1.15\\text{ m}$, $m = -0.23$", "$v = +2.5\\text{ m}$, $m = +0.5$", "$v = +0.8\\text{ m}$, $m = +0.16$"]
          : ["$v = -30\\text{ cm}$", "$v = +30\\text{ cm}$", "$v = -15\\text{ cm}$", "$v = -60\\text{ cm}$"],
        correctIndex: 0,
        explanation: isStruggling
          ? "When the object is placed at the center of curvature ($u = 2f = -20\\text{ cm}$), the real inverted image is formed at the center of curvature itself ($v = -20\\text{ cm}$)."
          : isImproving
          ? "Focal length $f = R/2 = +2\\text{ m}$. Using mirror formula: $1/v = 1/f - 1/u = 1/2 - (-1/5) = 5/10 + 2/10 = 7/10 \\Rightarrow v = +1.43\\text{ m}$. Magnification $m = -v/u = -1.43/(-5) = +0.286$."
          : "Using $\\frac{1}{v} = \\frac{1}{f} - \\frac{1}{u} = \\frac{1}{-15} - \\frac{1}{-30} = -\\frac{2}{30} + \\frac{1}{30} = -\\frac{1}{30} \\Rightarrow v = -30\\text{ cm}$.",
        difficulty: isStruggling ? "Easy" : isImproving ? "Hard" : "Medium",
        difficultyTier: isStruggling ? "Level 1 - Foundation" : isImproving ? "Level 4 - HOTS / Application" : "Level 2 - Standard",
        topic: topic,
        subject: subject,
        hints: [
          "Hint 1: Recall that for concave mirror, focal length $f$ is negative.",
          "Hint 2: Identify whether object is placed at focus, between F and C, or at C.",
          "Hint 3: Use the mirror equation $\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}$ and solve for $v$."
        ],
        isApplicationBased: isImproving,
        realWorldScenario: isImproving ? "Automotive side-view mirrors and camera calibration." : "",
        guidedStepPrompt: isStruggling ? "Step 1: Write down $f = -10$ and $u = -20$. Substitute into the formula." : "",
        simpleConceptBreakdown: isStruggling ? "• All distances in front of the mirror are negative (-).\n• Concave mirror focal length is always negative.\n• Object placed at C produces an image of the same size at C." : "",
        easyExample: isStruggling ? {
          question: "Object placed at infinity in front of concave mirror.",
          stepByStepSolution: "1. u = -∞\n2. 1/v = 1/f - 1/(-∞) = 1/f - 0 = 1/f\n3. v = f (image at focus).",
          keyTakeaway: "Light rays parallel to the principal axis converge at the principal focus."
        } : null
      };

      return res.json({
        questionItem: fallbackItem,
        isFallback: true,
        error: err.message
      });
    }
  });

  // 13. Smart Practice Session Engine (Personalized, Adaptive, Revision, Mistake-Fix, Weak-Topic, Concept, Mixed, Quick 5)
  app.post("/api/ai/smart-practice-session", async (req, res) => {
    try {
      const {
        mode = "daily",
        subject = "Science",
        topic = "",
        chapter = "",
        classLevel = "10",
        board = "CBSE",
        count = 5,
        weakTopics = [],
        strongTopics = [],
        recentMistakes = [],
        learningGoals = [],
        excludedHashes = [],
        language = "en",
      } = req.body;

      const isHindi = language === "hi";
      const isHinglish = language === "hinglish";

      const prompt = `You are the AI Smart Practice Question Generator for Indian School Education (Class ${classLevel} ${board}).
Generate an intelligent, pedagogy-backed set of ${count} practice questions for:
- Mode: ${mode.toUpperCase()}
  * "daily": Personalized daily questions spanning active curriculum priorities and goals.
  * "adaptive": Adaptive difficulty questions ranging progressively from Foundation (Level 1) to HOTS/Application (Level 4).
  * "revision": Spaced repetition questions from previous chapters/concepts to ensure long-term retention.
  * "mistake_fix": Target specific past student mistakes, misconceptions, and calculation traps from: ${JSON.stringify(recentMistakes)}.
  * "weak_topic": Focused on low-accuracy weak topics (${JSON.stringify(weakTopics.map((w: any) => w.topicName || w))}).
  * "concept": Deep concept-based reasoning questions with clear step-by-step logic.
  * "mixed": High-yield interdisciplinary mix across chapters in ${subject} or core subjects.
  * "quick_5": 5 rapid recall and high-frequency Board exam questions with crisp options.
- Subject: ${subject}
- Focus Chapter: ${chapter || "Core Syllabus"}
- Focus Topic: ${topic || "Curriculum Milestones"}
- Weak Topics in Context: ${JSON.stringify(weakTopics.slice(0, 3))}
- Past Mistakes: ${JSON.stringify(recentMistakes.slice(0, 5))}
- Student Goals: ${JSON.stringify(learningGoals)}
- Anti-Repetition Exclusion: Avoid questions matching these recently solved keywords/hashes: ${JSON.stringify(excludedHashes.slice(0, 10))}

STRICT PEDAGOGICAL INSTRUCTIONS:
1. Every question must have:
   - 4 clear options (A, B, C, D)
   - 0-indexed correctIndex
   - "explanation": Comprehensive step-by-step explanation linking to NCERT/Board standard concepts
   - "hints": Array of 2-3 progressive hints (from subtle clue to formula hint)
   - "difficultyTier": one of "Level 1 - Foundation", "Level 2 - Standard", "Level 3 - Advanced", "Level 4 - HOTS / Application"
   - "difficulty": "Easy", "Medium", "Hard", or "HOTS"
   - "practiceMode": "${mode}"
   - "simpleConceptBreakdown": 2-3 bullet points breaking down the core concept simply
   - "isApplicationBased": true for Level 3/4 or CBSE Competency questions
   - "realWorldScenario": Real-life practical context for application questions
   - "relatedMistakeContext": Brief note if addressing a common misconception or past mistake
   - "easyExample": An illustrative micro-example with step-by-step working and keyTakeaway for foundation questions

2. Language: ${isHindi ? "Hindi (हिंदी)" : isHinglish ? "Hinglish (Conversational Hindi-English)" : "English"}.
3. Formatting: Output clear LaTeX formulas with $ where appropriate (e.g. $1/f = 1/v + 1/u$, $\\text{CO}_2$).

OUTPUT FORMAT (Strict JSON):
{
  "mode": "${mode}",
  "subject": "${subject}",
  "questions": [
    {
      "id": "sp-q-1",
      "question": "Question text here...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Step-by-step explanation...",
      "difficulty": "Medium",
      "difficultyTier": "Level 2 - Standard",
      "subject": "${subject}",
      "chapter": "${chapter || "Chapter Name"}",
      "topic": "${topic || "Topic Name"}",
      "hints": ["Hint 1...", "Hint 2..."],
      "practiceMode": "${mode}",
      "isApplicationBased": false,
      "realWorldScenario": "",
      "guidedStepPrompt": "Step 1: Identify given variables...",
      "simpleConceptBreakdown": "• Bullet 1\\n• Bullet 2",
      "easyExample": {
        "question": "Sample problem...",
        "stepByStepSolution": "Working...",
        "keyTakeaway": "Key rule..."
      },
      "relatedMistakeContext": "Common trap: ignoring sign conventions."
    }
  ]
}
Return ONLY valid JSON.`;

      const ai = getGeminiClient();
      if (!ai) {
        throw new Error("Gemini API key is not configured");
      }

      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = safeJsonParse(response.text || "{}", {});
      return res.json({ sessionData: parsed, isFallback: false, generatedAt: new Date().toISOString() });
    } catch (err: any) {
      console.error("Error in /api/ai/smart-practice-session:", err);
      // Graceful rich local fallback generation based on requested mode & subject
      const {
        mode = "daily",
        subject = "Science",
        topic = "Core Concept",
        chapter = "Main Chapter",
        count = 5,
        weakTopics = [],
        recentMistakes = [],
      } = req.body || {};

      const fallbackQuestions = generateLocalSmartPracticeQuestions(
        mode,
        subject,
        topic,
        chapter,
        count,
        weakTopics,
        recentMistakes
      );

      return res.json({
        sessionData: {
          mode,
          subject,
          questions: fallbackQuestions,
        },
        isFallback: true,
        error: err.message,
        generatedAt: new Date().toISOString(),
      });
    }
  });

  // Local helper for smart practice fallback generation
  function generateLocalSmartPracticeQuestions(
    mode: string,
    subject: string,
    topic: string,
    chapter: string,
    count: number,
    weakTopics: any[],
    recentMistakes: string[]
  ) {
    const isMath = subject.toLowerCase().includes("math");
    const isScience = subject.toLowerCase().includes("science") || subject.toLowerCase().includes("physics") || subject.toLowerCase().includes("chemistry");

    const sciencePool = [
      {
        id: `sp-fb-sci-1`,
        question: `An object is placed at $20\\text{ cm}$ in front of a concave mirror of focal length $15\\text{ cm}$. At what distance from the mirror will the image be formed, and what is its nature?`,
        options: [
          `$v = -60\\text{ cm}$, Real and Inverted`,
          `$v = +60\\text{ cm}$, Virtual and Erect`,
          `$v = -30\\text{ cm}$, Real and Inverted`,
          `$v = +15\\text{ cm}$, Virtual and Diminished`,
        ],
        correctIndex: 0,
        explanation: `Given: $f = -15\\text{ cm}$, $u = -20\\text{ cm}$. Using mirror formula: $1/v = 1/f - 1/u = 1/(-15) - 1/(-20) = -1/15 + 1/20 = (-4 + 3)/60 = -1/60 \\implies v = -60\\text{ cm}$. Since $v$ is negative, the image is real and inverted.`,
        difficulty: "Medium",
        difficultyTier: "Level 2 - Standard",
        subject: "Science",
        chapter: "Light: Reflection and Refraction",
        topic: "Mirror Formula & Magnification",
        hints: [
          "Hint 1: Remember focal length of concave mirror is negative ($f = -15\\text{ cm}$).",
          "Hint 2: Mirror formula is $1/v = 1/f - 1/u$.",
          "Hint 3: Find common denominator of 15 and 20 (which is 60).",
        ],
        practiceMode: mode,
        isApplicationBased: false,
        guidedStepPrompt: "Step 1: Write down $f = -15$ and $u = -20$. Substitute into formula.",
        simpleConceptBreakdown: "• Concave mirror: focal length $f$ is always negative (-).\n• Distances in front of mirror are negative (-).\n• Negative $v$ means real and inverted image.",
        easyExample: {
          question: "Find image distance when $f = -10\\text{ cm}$ and $u = -15\\text{ cm}$.",
          stepByStepSolution: "1/v = -1/10 - (-1/15) = -3/30 + 2/30 = -1/30 => v = -30 cm.",
          keyTakeaway: "Image forms beyond 2F when object is between F and C.",
        },
        relatedMistakeContext: "Common student trap: forgetting negative sign for concave mirror focal length.",
      },
      {
        id: `sp-fb-sci-2`,
        question: `When electric current is passed through acidified water (electrolysis of water), what is the volume ratio of hydrogen gas collected at the cathode to oxygen gas collected at the anode?`,
        options: [
          `$2 : 1$`,
          `$1 : 2$`,
          `$1 : 1$`,
          `$8 : 1$`,
        ],
        correctIndex: 0,
        explanation: `Water molecule has the chemical formula $\\text{H}_2\\text{O}$, containing 2 hydrogen atoms for every 1 oxygen atom. During electrolysis ($2\\text{H}_2\\text{O} \\xrightarrow{\\text{electricity}} 2\\text{H}_2 + \\text{O}_2$), 2 volumes of $\\text{H}_2$ gas are liberated at the cathode for 1 volume of $\\text{O}_2$ gas at the anode ($2:1$).`,
        difficulty: "Easy",
        difficultyTier: "Level 1 - Foundation",
        subject: "Science",
        chapter: "Chemical Reactions & Equations",
        topic: "Electrolysis & Decomposition Reactions",
        hints: [
          "Hint 1: Recall the balanced chemical equation $2\\text{H}_2\\text{O} \\to 2\\text{H}_2 + \\text{O}_2$.",
          "Hint 2: Hydrogen is released at the cathode (negative electrode) and Oxygen at the anode.",
        ],
        practiceMode: mode,
        isApplicationBased: false,
        simpleConceptBreakdown: "• Water formula is $\\text{H}_2\\text{O}$.\n• 2 moles of $\\text{H}_2$ gas are produced per 1 mole of $\\text{O}_2$.\n• Hydrogen burns with a pop sound.",
      },
      {
        id: `sp-fb-sci-3`,
        question: `An electric heater rated $1000\\text{ W}$ operates for $2\\text{ hours}$ daily. Calculate the electrical energy consumed in commercial units (kWh) over a 30-day month and the total cost at ₹5 per unit.`,
        options: [
          `$60\\text{ kWh}$ (60 units), Total Cost = ₹300`,
          `$30\\text{ kWh}$ (30 units), Total Cost = ₹150`,
          `$120\\text{ kWh}$ (120 units), Total Cost = ₹600`,
          `$20\\text{ kWh}$ (20 units), Total Cost = ₹100`,
        ],
        correctIndex: 0,
        explanation: `Power $P = 1000\\text{ W} = 1\\text{ kW}$. Daily energy $E_{\\text{daily}} = P \\times t = 1\\text{ kW} \\times 2\\text{ h} = 2\\text{ kWh}$. For 30 days: $E_{\\text{total}} = 2\\text{ kWh} \\times 30 = 60\\text{ kWh}$ (60 units). Cost = $60 \\times 5 = \\text{₹}300$.`,
        difficulty: "Hard",
        difficultyTier: "Level 4 - HOTS / Application",
        subject: "Science",
        chapter: "Electricity",
        topic: "Electric Power & Commercial Energy Units",
        hints: [
          "Hint 1: Convert Watts to Kilowatts ($1000\\text{ W} = 1\\text{ kW}$).",
          "Hint 2: $1\\text{ unit} = 1\\text{ kWh} = 1\\text{ kW} \\times 1\\text{ hour}$.",
          "Hint 3: Multiply daily kWh by 30 days and then multiply by rate.",
        ],
        practiceMode: mode,
        isApplicationBased: true,
        realWorldScenario: "Household electric utility billing calculation under CBSE Competency framework.",
      },
      {
        id: `sp-fb-sci-4`,
        question: `Which of the following blood vessels carries oxygen-rich blood from the lungs back to the left atrium of the human heart?`,
        options: [
          `Pulmonary Vein`,
          `Pulmonary Artery`,
          `Vena Cava`,
          `Aorta`,
        ],
        correctIndex: 0,
        explanation: `Generally, veins carry deoxygenated blood and arteries carry oxygenated blood. The Pulmonary Vein is the sole exception in the human body—it transports freshly oxygenated blood from the lungs into the left atrium of the heart.`,
        difficulty: "Medium",
        difficultyTier: "Level 2 - Standard",
        subject: "Science",
        chapter: "Life Processes",
        topic: "Human Circulatory System & Double Circulation",
        hints: [
          "Hint 1: Remember 'Pulmonary' refers to the lungs.",
          "Hint 2: It is the only vein in the human body carrying oxygenated blood.",
        ],
        practiceMode: mode,
        isApplicationBased: false,
        simpleConceptBreakdown: "• Pulmonary artery carries deoxygenated blood to lungs.\n• Pulmonary vein carries oxygenated blood to heart.\n• Left atrium receives oxygen-rich blood.",
      },
      {
        id: `sp-fb-sci-5`,
        question: `A beam of white light splits into its seven constituent colors when passing through a triangular glass prism. Which color suffers the MAXIMUM deviation (bending) and why?`,
        options: [
          `Violet, because it has the shortest wavelength and lowest speed in glass`,
          `Red, because it has the longest wavelength and highest speed`,
          `Green, because it is in the middle of the visible spectrum`,
          `Yellow, because it has the mean refractive index`,
        ],
        correctIndex: 0,
        explanation: `According to Cauchy's relation and Snell's law, refractive index is inversely proportional to wavelength ($n \\propto 1/\\lambda$). Violet light has the shortest visible wavelength (~$400\\text{ nm}$), travels slowest in glass, encounters the highest refractive index, and therefore bends (deviates) the most.`,
        difficulty: "Medium",
        difficultyTier: "Level 3 - Advanced",
        subject: "Science",
        chapter: "The Human Eye and the Colorful World",
        topic: "Dispersion of White Light through Glass Prism",
        hints: [
          "Hint 1: Remember VIBGYOR order from bottom (most bent) to top (least bent).",
          "Hint 2: Violet is at the bottom of the spectrum spectrum.",
        ],
        practiceMode: mode,
        isApplicationBased: false,
      },
    ];

    const mathPool = [
      {
        id: `sp-fb-math-1`,
        question: `Find the discriminant $D$ of the quadratic equation $2x^2 - 4x + 3 = 0$ and determine the nature of its roots.`,
        options: [
          `$D = -8 < 0$, No real roots (roots are complex/imaginary)`,
          `$D = 8 > 0$, Two distinct real roots`,
          `$D = 0$, Two equal real roots`,
          `$D = -24 < 0$, Two rational roots`,
        ],
        correctIndex: 0,
        explanation: `Comparing with $ax^2 + bx + c = 0$, we have $a = 2$, $b = -4$, $c = 3$. Discriminant $D = b^2 - 4ac = (-4)^2 - 4(2)(3) = 16 - 24 = -8$. Since $D < 0$, the quadratic equation has no real roots.`,
        difficulty: "Medium",
        difficultyTier: "Level 2 - Standard",
        subject: "Mathematics",
        chapter: "Quadratic Equations",
        topic: "Discriminant & Nature of Roots",
        hints: [
          "Hint 1: Recall $D = b^2 - 4ac$.",
          "Hint 2: Note that $(-4)^2 = +16$ (squaring a negative number gives positive).",
          "Hint 3: If $D < 0$, no real roots exist.",
        ],
        practiceMode: mode,
        isApplicationBased: false,
        guidedStepPrompt: "Step 1: Identify a=2, b=-4, c=3. Step 2: Compute b² - 4ac.",
        simpleConceptBreakdown: "• D > 0: Two distinct real roots.\n• D = 0: Two equal real roots ($x = -b/2a$).\n• D < 0: No real roots.",
      },
      {
        id: `sp-fb-math-2`,
        question: `If the sum of first $n$ terms of an Arithmetic Progression is given by $S_n = 3n^2 + 5n$, what is its $n$-th term $a_n$ and 10th term $a_{10}$?`,
        options: [
          `$a_n = 6n + 2$, $a_{10} = 62$`,
          `$a_n = 6n - 2$, $a_{10} = 58$`,
          `$a_n = 3n + 5$, $a_{10} = 35$`,
          `$a_n = 6n + 5$, $a_{10} = 65$`,
        ],
        correctIndex: 0,
        explanation: `Using the formula $a_n = S_n - S_{n-1}$: $S_n = 3n^2 + 5n$, $S_{n-1} = 3(n-1)^2 + 5(n-1) = 3(n^2 - 2n + 1) + 5n - 5 = 3n^2 - n - 2$. Then $a_n = (3n^2 + 5n) - (3n^2 - n - 2) = 6n + 2$. For $n = 10$: $a_{10} = 6(10) + 2 = 62$.`,
        difficulty: "Hard",
        difficultyTier: "Level 3 - Advanced",
        subject: "Mathematics",
        chapter: "Arithmetic Progressions",
        topic: "nth Term from Sum of n Terms",
        hints: [
          "Hint 1: Use $a_n = S_n - S_{n-1}$ or find $a_1 = S_1 = 8$ and $a_2 = S_2 - S_1$.",
          "Hint 2: Common difference $d = a_2 - a_1 = 14 - 8 = 6$.",
        ],
        practiceMode: mode,
        isApplicationBased: false,
      },
      {
        id: `sp-fb-math-3`,
        question: `If $\\sin \\theta + \\cos \\theta = \\sqrt{2} \\cos \\theta$, find the value of $\\cos \\theta - \\sin \\theta$.`,
        options: [
          `$\\sqrt{2} \\sin \\theta$`,
          `$\\sqrt{2} \\cos \\theta$`,
          `$1$`,
          `$2 \\sin \\theta$`,
        ],
        correctIndex: 0,
        explanation: `Given: $\\sin \\theta = (\\sqrt{2} - 1)\\cos \\theta$. Multiplying both sides by $(\\sqrt{2} + 1)$: $(\\sqrt{2} + 1)\\sin \\theta = (\\sqrt{2} + 1)(\\sqrt{2} - 1)\\cos \\theta = (2 - 1)\\cos \\theta = \\cos \\theta$. Rearranging gives: $\\sqrt{2}\\sin \\theta + \\sin \\theta = \\cos \\theta \\implies \\cos \\theta - \\sin \\theta = \\sqrt{2}\\sin \\theta$.`,
        difficulty: "Hard",
        difficultyTier: "Level 4 - HOTS / Application",
        subject: "Mathematics",
        chapter: "Introduction to Trigonometry",
        topic: "Trigonometric Identities & Transformations",
        hints: [
          "Hint 1: Express $\\sin \\theta = (\\sqrt{2} - 1)\\cos \\theta$.",
          "Hint 2: Rationalize by multiplying with $(\\sqrt{2} + 1)$.",
        ],
        practiceMode: mode,
        isApplicationBased: false,
      },
      {
        id: `sp-fb-math-4`,
        question: `What is the HCF and LCM of 12, 21, and 15 using the Fundamental Theorem of Arithmetic (Prime Factorization Method)?`,
        options: [
          `$\\text{HCF} = 3$, $\\text{LCM} = 420$`,
          `$\\text{HCF} = 6$, $\\text{LCM} = 210$`,
          `$\\text{HCF} = 3$, $\\text{LCM} = 210$`,
          `$\\text{HCF} = 1$, $\\text{LCM} = 420$`,
        ],
        correctIndex: 0,
        explanation: `Prime factorizations: $12 = 2^2 \\times 3$, $21 = 3 \\times 7$, $15 = 3 \\times 5$. HCF is the product of the smallest power of each common prime factor = $3^1 = 3$. LCM is the product of the greatest power of each prime factor involved = $2^2 \\times 3^1 \\times 5^1 \\times 7^1 = 4 \\times 3 \\times 5 \\times 7 = 420$.`,
        difficulty: "Easy",
        difficultyTier: "Level 1 - Foundation",
        subject: "Mathematics",
        chapter: "Real Numbers",
        topic: "Fundamental Theorem of Arithmetic",
        hints: [
          "Hint 1: Find prime factors of each number.",
          "Hint 2: HCF is the lowest power of common factors ($3$).",
        ],
        practiceMode: mode,
        isApplicationBased: false,
        simpleConceptBreakdown: "• HCF = Product of smallest power of common prime factors.\n• LCM = Product of highest power of all prime factors.\n• For 3 numbers, $\\text{HCF} \\times \\text{LCM} \\neq a \\times b \\times c$.",
      },
      {
        id: `sp-fb-math-5`,
        question: `The shadow of a vertical tower on level ground increases by $40\\text{ m}$ when the altitude of the sun changes from $60^\\circ$ to $30^\\circ$. Find the height of the tower.`,
        options: [
          `$20\\sqrt{3}\\text{ m} \\approx 34.64\\text{ m}$`,
          `$40\\sqrt{3}\\text{ m} \\approx 69.28\\text{ m}$`,
          `$20\\text{ m}$`,
          `$30\\sqrt{3}\\text{ m} \\approx 51.96\\text{ m}$`,
        ],
        correctIndex: 0,
        explanation: `Let height of tower be $h$ and initial shadow be $x$. In $\\triangle 1$: $\\tan 60^\\circ = h/x \\implies \\sqrt{3} = h/x \\implies x = h/\\sqrt{3}$. In $\\triangle 2$: $\\tan 30^\\circ = h/(x + 40) \\implies 1/\\sqrt{3} = h/(h/\\sqrt{3} + 40) \\implies h/3 + 40/\\sqrt{3} = h \\implies 2h/3 = 40/\\sqrt{3} \\implies h = 20\\sqrt{3}\\text{ m}$.`,
        difficulty: "Hard",
        difficultyTier: "Level 4 - HOTS / Application",
        subject: "Mathematics",
        chapter: "Some Applications of Trigonometry",
        topic: "Heights and Distances",
        hints: [
          "Hint 1: Draw two right triangles with angles $60^\\circ$ and $30^\\circ$.",
          "Hint 2: $\\tan 60^\\circ = \\sqrt{3}$ and $\\tan 30^\\circ = 1/\\sqrt{3}$.",
        ],
        practiceMode: mode,
        isApplicationBased: true,
        realWorldScenario: "Surveying and civil engineering solar shadow triangulation.",
      },
    ];

    const pool = isMath ? mathPool : sciencePool;
    return pool.slice(0, Math.min(count, pool.length));
  }

  // ==========================================
  // AI LEARNING COACH - PERSONALIZED INSIGHTS
  // ==========================================
  app.post("/api/ai-coach/insights", async (req, res) => {
    try {
      const {
        profile = {},
        weakTopics = [],
        strongTopics = [],
        studyPlan = {},
        quizzes = [],
        exams = [],
        activities = [],
        lang = "en",
      } = req.body;

      const ai = getGeminiClient();
      const studentName = profile.name || "Student";
      const classLevel = profile.classLevel || "10";
      const board = profile.board || "CBSE";
      const streakDays = profile.streakDays || 1;

      // Extract weakest topic
      const weakest = weakTopics.length > 0
        ? [...weakTopics].sort((a: any, b: any) => (a.accuracyRate || 0) - (b.accuracyRate || 0))[0]
        : null;

      // Extract strongest topic for spaced repetition
      const strongest = strongTopics.length > 0
        ? strongTopics[0]
        : null;

      // Check upcoming exam
      const examDate = studyPlan.targetExamDate || "2026-11-15";
      const diffMs = new Date(examDate).getTime() - Date.now();
      const daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      if (!ai) {
        // Return local deterministic coaching synthesis if API key is not set
        return res.json({
          status: "ok",
          isAiLiveGenerated: false,
          insights: generateLocalCoachInsights({
            profile,
            weakTopics,
            strongTopics,
            studyPlan,
            quizzes,
            exams,
            activities,
            daysLeft,
          }),
        });
      }

      const prompt = `You are EduAI Master's AI Learning Coach for ${studentName}, a Class ${classLevel} (${board}) school student with a ${streakDays}-day learning streak.
You must synthesize real student performance data into a short, motivating, highly actionable "Today's Learning" coaching briefing.

REAL STUDENT METRICS:
- Class & Board: Class ${classLevel} ${board}
- Current Level: Level ${profile.level || 1}, ${profile.xp || 0} XP
- Streak: ${streakDays} days
- Weak Topics: ${JSON.stringify(weakTopics.slice(0, 3))}
- Strong Topics: ${JSON.stringify(strongTopics.slice(0, 3))}
- Pending Tasks in Study Plan: ${JSON.stringify((studyPlan.tasks || []).filter((t: any) => !t.completed).slice(0, 3))}
- Recent Quizzes: ${JSON.stringify(quizzes.slice(0, 3).map((q: any) => ({ title: q.title, score: q.score, accuracy: q.accuracyPercentage })))}
- Recent Exam Attempts: ${JSON.stringify(exams.slice(0, 2).map((e: any) => ({ title: e.title, percentage: e.accuracyPercentage || e.scoreEarned })))}
- Target Exam in: ${daysLeft} days (${examDate})

Generate a strictly valid JSON object with the following schema:
{
  "greeting": "Energetic personalized greeting for ${studentName}",
  "studentSummary": "Class ${classLevel} ${board} • ${streakDays}-Day Streak • Target Exam in ${daysLeft} Days",
  "coachMessage": "2-3 sentence personalized coach advice citing actual topics and numbers. Short, direct, encouraging.",
  "focusHighlight": "Single most important 1-line priority for today",
  "readinessScore": 75, // integer 0-100 calculating exam readiness from syllabus & quiz scores
  "mindsetQuote": "Short inspiring study mindset quote",
  "whatToStudy": {
    "subject": "Subject name",
    "chapter": "Chapter name",
    "topic": "Specific topic name",
    "estimatedMinutes": 25,
    "importance": "High Weightage",
    "keyLearningOutcomes": ["Point 1", "Point 2"],
    "suggestedAction": "read_book"
  },
  "whatToRevise": {
    "subject": "Subject name",
    "chapter": "Chapter name",
    "topic": "Topic name (spaced repetition from earlier lessons)",
    "lastPracticed": "3 days ago",
    "spacedRepetitionStage": "Stage 2: Active Recall",
    "quickFormulaOrKeyRule": "Core key formula or rule to remember",
    "quickRevisionPoints": ["Key point 1", "Key point 2"]
  },
  "recommendedPractice": {
    "mode": "weak_topic", // one of: 'weak_topic', 'quick_5', 'adaptive', 'revision', 'mistake_fix', 'concept_based'
    "modeLabel": "Adaptive Weak Topic Drill",
    "subject": "Subject name",
    "chapter": "Chapter name",
    "topic": "Topic name",
    "questionCount": 5,
    "estimatedMinutes": 8,
    "rewardXp": 35,
    "reason": "Why this practice was selected by coach",
    "urgencyLevel": "High"
  },
  "upcomingExam": {
    "id": "exam-midterm-1",
    "title": "Class ${classLevel} Term-1 Board Assessment",
    "subject": "Core Subjects",
    "targetDate": "${examDate}",
    "daysLeft": ${daysLeft},
    "readinessPercentage": 78,
    "criticalTopics": ["Key topic 1", "Key topic 2"],
    "recommendedFocus": "Complete 2 mock papers before weekend"
  },
  "weakTopicAlert": ${
    weakest
      ? `{
    "id": "${weakest.id || 'wt-top'}",
    "subject": "${weakest.subjectName || 'Science'}",
    "chapter": "${weakest.chapterName || 'General'}",
    "topic": "${weakest.topicName || 'Optics'}",
    "accuracyRate": ${weakest.accuracyRate || 40},
    "urgency": "${(weakest.accuracyRate || 40) < 50 ? 'Critical' : 'Moderate'}",
    "identifiedMisconception": "Common error pattern in problem formulation or sign conventions",
    "remedyAction": "Solve 5 step-by-step numericals with AI Tutor guidance",
    "wrongAnswersCount": ${weakest.wrongAnswersCount || 4}
  }`
      : `null`
  },
  "coachTips": [
    "Tip 1: Practical time management or revision tip",
    "Tip 2: Focus on understanding underlying principles before formulas",
    "Tip 3: End today's study session with a quick 3-minute flash card recall"
  ]
}

Return ONLY the raw JSON object, no markdown code fence blocks or backticks.`;

      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = safeJsonParse(clean, null) || generateLocalCoachInsights({
        profile,
        weakTopics,
        strongTopics,
        studyPlan,
        quizzes,
        exams,
        activities,
        daysLeft,
      });

      res.json({
        status: "ok",
        isAiLiveGenerated: true,
        insights: parsed,
      });
    } catch (err: any) {
      console.error("AI Coach Insights error:", err);
      // Fallback
      res.json({
        status: "ok",
        isAiLiveGenerated: false,
        insights: generateLocalCoachInsights({
          profile: req.body?.profile || {},
          weakTopics: req.body?.weakTopics || [],
          strongTopics: req.body?.strongTopics || [],
          studyPlan: req.body?.studyPlan || {},
          quizzes: req.body?.quizzes || [],
          exams: req.body?.exams || [],
          activities: req.body?.activities || [],
          daysLeft: 12,
        }),
      });
    }
  });

  function generateLocalCoachInsights(params: any) {
    const {
      profile = {},
      weakTopics = [],
      strongTopics = [],
      studyPlan = {},
      quizzes = [],
      exams = [],
      daysLeft = 14,
    } = params;

    const studentName = profile.name || "Student";
    const classLevel = profile.classLevel || "10";
    const board = profile.board || "CBSE";
    const streak = profile.streakDays || 1;

    const weakest = weakTopics.length > 0
      ? [...weakTopics].sort((a: any, b: any) => (a.accuracyRate || 0) - (b.accuracyRate || 0))[0]
      : null;

    const strongest = strongTopics.length > 0 ? strongTopics[0] : null;

    const pendingTasks = (studyPlan.tasks || []).filter((t: any) => !t.completed);
    const topTask = pendingTasks[0] || {
      title: "Revise Light Reflection & Refraction",
      subjectName: "Science",
    };

    return {
      greeting: `Good day, ${studentName}!`,
      studentSummary: `Class ${classLevel} ${board} • ${streak}-Day Streak • Target Exam in ${daysLeft} Days`,
      coachMessage: weakest
        ? `I analyzed your recent study data. Your ${weakest.subjectName} topic "${weakest.topicName}" has a ${weakest.accuracyRate}% accuracy rate. Let's tackle 5 targeted practice questions today to boost your confidence before the upcoming exam in ${daysLeft} days.`
        : `You are maintaining great consistency! With ${daysLeft} days to your upcoming board assessment, let's keep your momentum by focusing on core syllabus topics and completing your daily practice goals.`,
      focusHighlight: weakest
        ? `Priority #1: Master ${weakest.topicName} in ${weakest.subjectName} (${weakest.accuracyRate}% accuracy)`
        : `Priority #1: Advance through ${topTask.title}`,
      readinessScore: Math.min(95, Math.max(55, Math.round(72 + (profile.level || 1) * 2 - (weakTopics.length * 4)))),
      mindsetQuote: "Consistent daily effort transforms weak concepts into exam-day strengths.",
      whatToStudy: {
        subject: topTask.subjectName || "Science",
        chapter: topTask.topicName || "Light: Reflection & Refraction",
        topic: weakest ? weakest.topicName : "Ray Diagrams & Lens Sign Conventions",
        estimatedMinutes: 25,
        importance: "High Weightage",
        keyLearningOutcomes: [
          "Understand Cartesian sign convention principles",
          "Apply Mirror & Lens formulas without algebraic sign errors",
          "Solve 2 high-probability Board examination questions",
        ],
        suggestedAction: "read_book",
      },
      whatToRevise: {
        subject: strongest ? strongest.subjectName : "Science",
        chapter: strongest ? strongest.chapterName : "Chemical Reactions & Equations",
        topic: strongest ? strongest.topicName : "Balancing Chemical Equations & Redox",
        lastPracticed: strongest ? strongest.lastPracticed : "3 days ago",
        spacedRepetitionStage: "Spaced Repetition: 3-Day Recall Interval",
        quickFormulaOrKeyRule: "Mass is conserved in all reactions: Σ Reactants = Σ Products",
        quickRevisionPoints: [
          "Always write physical state notations (s, l, g, aq)",
          "Oxidation is loss of electrons / gain of oxygen; reduction is gain of electrons",
        ],
      },
      recommendedPractice: {
        mode: weakest ? "weak_topic" : "adaptive",
        modeLabel: weakest ? "Weak Topic Targeted Drill" : "Adaptive 5-Question Sprint",
        subject: weakest ? weakest.subjectName : "Science",
        chapter: weakest ? weakest.chapterName : "Light: Reflection and Refraction",
        topic: weakest ? weakest.topicName : "Spherical Mirrors & Magnification",
        questionCount: 5,
        estimatedMinutes: 8,
        rewardXp: 35,
        reason: weakest
          ? `Selected specifically to improve ${weakest.accuracyRate}% score in ${weakest.topicName}`
          : "Daily adaptive drill calibrated to your current class curriculum",
        urgencyLevel: weakest && weakest.accuracyRate < 50 ? "High" : "Medium",
      },
      upcomingExam: {
        id: "exam-midterm-main",
        title: `Class ${classLevel} Term-1 Assessment`,
        subject: "All Core Subjects",
        targetDate: studyPlan.targetExamDate || "2026-11-15",
        daysLeft,
        readinessPercentage: Math.min(96, Math.max(50, 75 + (profile.level || 1) * 2 - (weakTopics.length * 3))),
        criticalTopics: [
          "Optics: Mirror & Lens Numericals",
          "Algebra: Quadratic Roots & Discriminants",
          "Chemical Reactions: Redox Balancing",
        ],
        recommendedFocus: "Review high-frequency board questions & take 1 full timed mock test this week",
      },
      weakTopicAlert: weakest
        ? {
            id: weakest.id,
            subject: weakest.subjectName,
            chapter: weakest.chapterName,
            topic: weakest.topicName,
            accuracyRate: weakest.accuracyRate,
            urgency: weakest.accuracyRate < 50 ? "Critical" : "Moderate",
            identifiedMisconception:
              weakest.accuracyRate < 50
                ? "Confusion applying sign convention to focal length and object distance in optics problems."
                : "Calculation oversights in multi-step problem solving.",
            remedyAction: "Review AI Summary Notes & complete 5 AI-guided practice questions.",
            wrongAnswersCount: weakest.wrongAnswersCount || 4,
          }
        : null,
      coachTips: [
        "💡 20-Minute Focus: Study in 25-minute Pomodoro bursts with 5-minute active recall breaks.",
        "✍️ Diagram Practice: For Physics and Biology, always draw ray diagrams with a straight edge and clear arrow heads.",
        "⚡ Mistake Notebook: Before going to bed, spend 3 minutes reviewing errors from today's practice questions.",
      ],
    };
  }

  // 17. Smart Revision Generator Endpoint
  app.post("/api/smart-revision/generate", async (req, res) => {
    try {
      const {
        mode = "chapter",
        subject = "Science",
        chapter = "Light: Reflection & Refraction",
        topic,
        classLevel = "10",
        board = "CBSE",
        language = "en",
        mistakesContext,
      } = req.body;

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({ error: "Gemini API not configured", isFallback: true });
      }

      const prompt = `You are EduAI Master, an elite Academic Tutor and Board Exam Coach for Class ${classLevel} (${board}).
Generate a comprehensive, high-yield Smart Revision Sheet for:
- Mode: ${mode} (one of: quick, chapter, weak_topic, exam, mistake, daily, custom)
- Subject: ${subject}
- Chapter: ${chapter}
${topic ? `- Specific Focus Topic: ${topic}` : ""}
${mistakesContext ? `- Student's previous errors/mistakes to address: ${mistakesContext}` : ""}
- Class Level: Class ${classLevel}
- Target Board: ${board}

You MUST return a strictly valid JSON object matching this exact schema:
{
  "id": "rev-${Date.now()}",
  "title": "${topic ? `${topic} • ${chapter}` : `${chapter} High-Yield Revision`}",
  "subtitle": "Clear 1-line subtitle explaining the focus",
  "mode": "${mode}",
  "subject": "${subject}",
  "chapter": "${chapter}",
  "topic": "${topic || "Core Concepts"}",
  "classLevel": "${classLevel}",
  "board": "${board}",
  "summary": "Crisp 3-4 sentence conceptual executive summary synthesizing the core themes, significance, and exam high-points.",
  "keyPoints": [
    "High-yield point 1 with critical insight",
    "High-yield point 2 with rule or law",
    "High-yield point 3 with exam takeaway",
    "High-yield point 4 with diagram or sign convention rule",
    "High-yield point 5 with common mistake alert"
  ],
  "definitions": [
    {
      "id": "def-1",
      "term": "Term Name",
      "definition": "Precise textbook definition required for full marks in board exams",
      "keyKeywords": ["Keyword 1", "Keyword 2"],
      "example": "Real-world or textbook example"
    },
    {
      "id": "def-2",
      "term": "Second Term",
      "definition": "Precise definition",
      "keyKeywords": ["Keyword 1"],
      "example": "Example"
    }
  ],
  "formulas": [
    {
      "id": "form-1",
      "name": "Formula or Rule Name",
      "formula": "Mathematical or Chemical equation (e.g. 1/f = 1/v + 1/u, ax^2+bx+c=0)",
      "variablesExplanation": "Detailed explanation of each variable (e.g. f = focal length, u = object distance)",
      "whenToUse": "Specific scenario when to apply this formula",
      "commonMistakeAlert": "Frequent trap students fall into when using this formula"
    }
  ],
  "shortExplanations": [
    {
      "id": "se-1",
      "concept": "Concept Name",
      "explanation": "Clear, intuitive 2-paragraph explanation with real-life analogies",
      "examTip": "Examiner's scoring tip",
      "mnemonicsOrAnalogy": "Helpful mnemonic or mental model"
    }
  ],
  "flashcards": [
    {
      "id": "fc-1",
      "question": "Active recall question testing fundamental understanding or numerical rule?",
      "answer": "Direct, clear, authoritative answer.",
      "explanation": "Why this answer is correct and how to derive it step-by-step.",
      "difficulty": "Easy",
      "topic": "${topic || chapter}"
    },
    {
      "id": "fc-2",
      "question": "Second active recall flashcard question?",
      "answer": "Answer",
      "explanation": "Explanation",
      "difficulty": "Medium",
      "topic": "${topic || chapter}"
    },
    {
      "id": "fc-3",
      "question": "Third active recall flashcard question?",
      "answer": "Answer",
      "explanation": "Explanation",
      "difficulty": "Hard",
      "topic": "${topic || chapter}"
    },
    {
      "id": "fc-4",
      "question": "Fourth active recall flashcard question?",
      "answer": "Answer",
      "explanation": "Explanation",
      "difficulty": "Medium",
      "topic": "${topic || chapter}"
    }
  ],
  "quickMcqs": [
    {
      "id": "mcq-1",
      "question": "Diagnostic multiple choice question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed explanation of why Option A is correct and why others are wrong."
    },
    {
      "id": "mcq-2",
      "question": "Second diagnostic MCQ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 1,
      "explanation": "Explanation"
    },
    {
      "id": "mcq-3",
      "question": "Third diagnostic MCQ?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 2,
      "explanation": "Explanation"
    }
  ],
  "practiceQuestions": [
    {
      "id": "pq-1",
      "question": "High-scoring board exam subjective question (2 or 3 or 5 marks)?",
      "sampleAnswer": "Model answer with step-by-step working and final conclusion.",
      "keyPointsToInclude": ["Key mark point 1", "Key mark point 2", "Key mark point 3"],
      "marks": 3,
      "difficulty": "Medium"
    },
    {
      "id": "pq-2",
      "question": "Second board exam subjective question?",
      "sampleAnswer": "Model answer.",
      "keyPointsToInclude": ["Point 1", "Point 2"],
      "marks": 3,
      "difficulty": "Hard"
    }
  ],
  "estimatedMinutes": ${mode === "quick" ? 5 : mode === "exam" ? 15 : 10},
  "rewardXp": ${mode === "quick" ? 20 : mode === "exam" ? 45 : 35},
  "masteryScore": 50,
  "spacedRepetitionStage": 1,
  "createdAt": "${new Date().toISOString()}"
}

Return ONLY raw valid JSON, no markdown backticks, no wrapping text.`;

      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = safeJsonParse(clean, null);
      if (!parsed) {
        return res.status(500).json({ error: "Parse error", isFallback: true });
      }

      res.json({
        status: "ok",
        sheet: parsed,
      });
    } catch (err: any) {
      console.error("Smart Revision Generator error:", err);
      res.status(500).json({
        error: err.message || "Failed to generate revision sheet",
        isFallback: true,
      });
    }
  });

  // Mount Safe Error Interceptor Middleware
  app.use(safeErrorHandler);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduAI Master Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

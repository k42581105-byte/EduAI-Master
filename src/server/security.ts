import { Request, Response, NextFunction } from "express";

// -------------------------------------------------------------
// 1. Sliding Window Rate Limiter Middleware
// -------------------------------------------------------------

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

// Periodic cleanup of stale rate limiter buckets
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export function createRateLimiter(options: {
  maxRequests: number;
  windowMs: number;
  tierName?: string;
}) {
  const { maxRequests, windowMs, tierName = "general" } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const sessionToken = req.header("X-Session-Token") || "";
    const clientKey = `${tierName}:${sessionToken || ip}`;
    const now = Date.now();

    let bucket = rateLimitStore.get(clientKey);
    if (!bucket || bucket.resetAt <= now) {
      bucket = {
        count: 1,
        resetAt: now + windowMs,
      };
      rateLimitStore.set(clientKey, bucket);
    } else {
      bucket.count += 1;
    }

    const remaining = Math.max(0, maxRequests - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    // Set standard rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > maxRequests) {
      res.setHeader("Retry-After", resetSeconds);
      return res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Too many requests for ${tierName}. Please wait ${resetSeconds}s before retrying.`,
          retryAfterSeconds: resetSeconds,
        },
        status: "error",
      });
    }

    next();
  };
}

// -------------------------------------------------------------
// 2. Idempotency & Duplicate Request Protection Middleware
// -------------------------------------------------------------

const idempotencyCache = new Map<string, { timestamp: number; response?: any }>();

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only apply to stateful or generative methods (POST, PUT, DELETE)
  if (req.method === "GET" || req.method === "OPTIONS" || req.method === "HEAD") {
    return next();
  }

  const idempotencyKey = req.header("X-Idempotency-Key");
  if (!idempotencyKey) {
    return next();
  }

  const cached = idempotencyCache.get(idempotencyKey);
  const now = Date.now();

  // If duplicate request received within 5 seconds window
  if (cached && now - cached.timestamp < 5000) {
    return res.status(409).json({
      error: {
        code: "DUPLICATE_REQUEST_BLOCKED",
        message: "Duplicate request detected in rapid succession. Please wait.",
      },
      status: "error",
    });
  }

  // Register in cache with 10s TTL
  idempotencyCache.set(idempotencyKey, { timestamp: now });
  setTimeout(() => {
    idempotencyCache.delete(idempotencyKey);
  }, 10000);

  next();
}

// -------------------------------------------------------------
// 3. Input Validation & Prompt Injection Defense Middleware
// -------------------------------------------------------------

const DANGEROUS_PATTERNS = [
  /<\s*script\b[^>]*>.*?<\s*\/\s*script\s*>/gis,
  /<\s*iframe\b[^>]*>.*?<\s*\/\s*iframe\s*>/gis,
  /javascript\s*:/gis,
  /vbscript\s*:/gis,
  /onload\s*=/gis,
  /onerror\s*=/gis,
];

const PROMPT_INJECTION_KEYWORDS = [
  "ignore all previous instructions",
  "disregard previous instructions",
  "reveal your system prompt",
  "print system prompt",
  "developer mode enabled",
  "bypass safety filters",
];

export function inputValidationMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    try {
      sanitizeObject(req.body);
    } catch (err: any) {
      return res.status(400).json({
        error: {
          code: "INVALID_PAYLOAD",
          message: err?.message || "Invalid or unsafe input payload detected.",
        },
        status: "error",
      });
    }
  }
  next();
}

function sanitizeObject(obj: any, depth = 0) {
  if (depth > 10 || !obj) return;

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") {
      // Check maximum string length (except for image payloads)
      if (!key.toLowerCase().includes("image") && !key.toLowerCase().includes("base64") && val.length > 50000) {
        throw new Error(`Field '${key}' exceeds maximum allowed length of 50,000 characters.`);
      }

      // Check prompt injection patterns on prompt fields
      if (key.toLowerCase().includes("prompt") || key.toLowerCase().includes("message") || key.toLowerCase().includes("query")) {
        const lower = val.toLowerCase();
        for (const kw of PROMPT_INJECTION_KEYWORDS) {
          if (lower.includes(kw)) {
            // Neutralize marker
            obj[key] = val.replace(new RegExp(kw, "gi"), "[neutralized_instruction]");
          }
        }
      }

      // Strip dangerous active HTML tags if not marked as raw markdown
      let sanitized = val;
      for (const pattern of DANGEROUS_PATTERNS) {
        sanitized = sanitized.replace(pattern, "");
      }
      obj[key] = sanitized;
    } else if (typeof val === "object" && val !== null) {
      sanitizeObject(val, depth + 1);
    }
  }
}

// -------------------------------------------------------------
// 4. File & Image Upload Validator (Magic Bytes & Size check)
// -------------------------------------------------------------

export function validateBase64ImagePayload(imageBase64: string, maxSizeBytes = 5 * 1024 * 1024): {
  valid: boolean;
  mime?: string;
  error?: string;
} {
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return { valid: false, error: "Missing or invalid base64 image data." };
  }

  // Extract MIME header if present (e.g. data:image/jpeg;base64,....)
  let mime = "image/jpeg";
  let cleanBase64 = imageBase64;

  const headerMatch = imageBase64.match(/^data:([^;]+);base64,(.*)$/);
  if (headerMatch) {
    mime = headerMatch[1].toLowerCase();
    cleanBase64 = headerMatch[2];
  }

  const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
  if (!ALLOWED_MIMES.includes(mime)) {
    return {
      valid: false,
      error: `Disallowed image MIME type '${mime}'. Allowed types: JPG, PNG, WEBP, GIF.`,
    };
  }

  // Approximate size from base64 length
  const approxSize = Math.round((cleanBase64.length * 3) / 4);
  if (approxSize > maxSizeBytes) {
    return {
      valid: false,
      error: `Image payload size (~${(approxSize / (1024 * 1024)).toFixed(2)} MB) exceeds 5MB limit.`,
    };
  }

  // Verify magic bytes header
  try {
    const rawBuffer = Buffer.from(cleanBase64.slice(0, 32), "base64");
    const hex = rawBuffer.toString("hex");

    let magicOk = false;
    if (hex.startsWith("ffd8ff")) {
      magicOk = true; // JPEG
    } else if (hex.startsWith("89504e47")) {
      magicOk = true; // PNG
    } else if (hex.startsWith("52494646") && hex.includes("57454250")) {
      magicOk = true; // WEBP
    } else if (hex.startsWith("47494638")) {
      magicOk = true; // GIF
    }

    if (!magicOk) {
      return {
        valid: false,
        error: "File signature validation failed. Header does not match declared image type.",
      };
    }
  } catch (err: any) {
    return { valid: false, error: "Failed to decode base64 image buffer." };
  }

  return { valid: true, mime };
}

// -------------------------------------------------------------
// 5. Server-Side Authorization Guard Middleware
// -------------------------------------------------------------

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req.header("X-User-Role") || "student").toLowerCase();

    if (allowedRoles.includes(userRole) || userRole === "admin") {
      return next();
    }

    return res.status(403).json({
      error: {
        code: "FORBIDDEN_ROLE_ACCESS",
        message: `Access denied. Required role: [${allowedRoles.join(", ")}]. Current role: '${userRole}'.`,
      },
      status: "error",
    });
  };
}

// -------------------------------------------------------------
// 6. Safe Error Handling Middleware
// -------------------------------------------------------------

export function safeErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Log full error on server console, sanitizing any environment keys
  const safeMessage = (err?.message || "Internal server error")
    .replace(new RegExp(process.env.GEMINI_API_KEY || "INVALID_DUMMY_KEY", "g"), "[REDACTED_API_KEY]");

  console.error(`[SERVER_ERROR] [${req.method} ${req.path}]:`, safeMessage);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err?.status || err?.statusCode || 500;

  // Return clean, safe payload to client without internal stack traces
  res.status(statusCode).json({
    error: {
      code: err?.code || "INTERNAL_ERROR",
      message: statusCode === 500 ? "A server error occurred while processing your request." : safeMessage,
    },
    status: "error",
    timestamp: new Date().toISOString(),
  });
}

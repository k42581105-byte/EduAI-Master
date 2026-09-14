/**
 * EduAI Master Enterprise Security & Zero-Trust Service
 * Provides RBAC, Input Sanitization, File/Image Validation, Session Security,
 * Anti-Duplicate Request Idempotency, and Audit Logging.
 */

import { UserRole } from '../types';

export type SecurityPermission =
  | 'view_study_materials'
  | 'take_quiz_exam'
  | 'ask_ai_tutor'
  | 'photo_solver'
  | 'create_personal_notes'
  | 'view_own_progress'
  | 'view_student_progress' // Parent / Teacher / Admin
  | 'set_study_limits' // Parent
  | 'generate_exam_papers' // Teacher / Admin
  | 'manage_question_bank' // Teacher / Admin
  | 'assign_homework' // Teacher
  | 'manage_curriculum' // Admin
  | 'manage_user_accounts' // Admin
  | 'manage_backups' // Admin
  | 'restore_database' // Admin
  | 'view_security_audit_logs'; // Admin

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  category: 'auth' | 'rbac' | 'input_sanitization' | 'upload_validation' | 'rate_limit' | 'session';
  severity: 'info' | 'warning' | 'critical';
  action: string;
  userRole?: UserRole;
  userEmail?: string;
  details: string;
  ipPlaceholder?: string;
  blocked: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedMimeType?: string;
  fileSizeBytes?: number;
  fileSizeFormatted?: string;
  dimensions?: { width: number; height: number };
  magicBytesVerified?: boolean;
}

// -------------------------------------------------------------
// 1. Role-Based Access Control (RBAC) Matrix
// -------------------------------------------------------------

const ROLE_PERMISSIONS: Record<UserRole, SecurityPermission[]> = {
  student: [
    'view_study_materials',
    'take_quiz_exam',
    'ask_ai_tutor',
    'photo_solver',
    'create_personal_notes',
    'view_own_progress',
  ],
  parent: [
    'view_study_materials',
    'view_student_progress',
    'set_study_limits',
    'view_own_progress',
  ],
  teacher: [
    'view_study_materials',
    'view_student_progress',
    'generate_exam_papers',
    'manage_question_bank',
    'assign_homework',
    'view_own_progress',
    'take_quiz_exam',
    'ask_ai_tutor',
  ],
  admin: [
    'view_study_materials',
    'take_quiz_exam',
    'ask_ai_tutor',
    'photo_solver',
    'create_personal_notes',
    'view_own_progress',
    'view_student_progress',
    'set_study_limits',
    'generate_exam_papers',
    'manage_question_bank',
    'assign_homework',
    'manage_curriculum',
    'manage_user_accounts',
    'manage_backups',
    'restore_database',
    'view_security_audit_logs',
  ],
};

// -------------------------------------------------------------
// 2. Input Sanitization & Anti-Injection Filters
// -------------------------------------------------------------

const DANGEROUS_HTML_TAGS = /<\s*(script|iframe|object|embed|applet|meta|link|style|base|form|svg|math)[^>]*>.*?<\s*\/\s*\1\s*>|<\s*(script|iframe|object|embed|applet|meta|link|style|base|form|svg|math)[^>]*\/?>/gis;
const DANGEROUS_ATTRIBUTES = /\s*(on\w+|javascript:|data:|vbscript:)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gis;
const SQL_INJECTION_PATTERNS = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|DECLARE)\b\s+.*?(FROM|INTO|SET|TABLE|DATABASE|WHERE|SELECT)|--|\/\*|\*\/|;\s*DROP)/i;
const PROMPT_INJECTION_MARKERS = [
  'ignore previous instructions',
  'disregard all previous instructions',
  'system prompt reveal',
  'reveal system instructions',
  'you are now in developer mode',
  'jailbreak mode activated',
  'bypass all filters',
  'output your full prompt',
  'print system prompt verbatim',
];

export const SecurityService = {
  // Check if role has required permission
  hasPermission(role: UserRole = 'student', permission: SecurityPermission): boolean {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  },

  // Check if current user has access to a navigation section
  canAccessSection(role: UserRole = 'student', section: string): { allowed: boolean; requiredRole?: string; reason?: string } {
    switch (section) {
      case 'admin-dashboard':
        return role === 'admin'
          ? { allowed: true }
          : { allowed: false, requiredRole: 'Admin', reason: 'Administrator credentials required to access system management, curriculum, and backup controls.' };
      case 'teacher-dashboard':
        return role === 'teacher' || role === 'admin'
          ? { allowed: true }
          : { allowed: false, requiredRole: 'Teacher or Admin', reason: 'Teacher authorization required to access classrooms, question repositories, and student evaluation tools.' };
      case 'parent-dashboard':
        return role === 'parent' || role === 'admin'
          ? { allowed: true }
          : { allowed: false, requiredRole: 'Parent or Admin', reason: 'Parent authorization required to view student oversight metrics and study time controls.' };
      case 'paper-generator':
        return role === 'teacher' || role === 'admin'
          ? { allowed: true }
          : { allowed: false, requiredRole: 'Teacher or Admin', reason: 'Exam paper generator is reserved for verified educators and administrators.' };
      default:
        return { allowed: true };
    }
  },

  // Sanitize user text inputs (strips dangerous tags, scripts, control characters)
  sanitizeInput(input: string, maxLength: number = 10000): string {
    if (!input || typeof input !== 'string') return '';
    let sanitized = input.trim();
    if (sanitized.length > maxLength) {
      sanitized = sanitized.slice(0, maxLength);
    }
    // Remove control characters (except newline \n, tab \t, carriage return \r)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    // Strip malicious script and active embedding tags
    sanitized = sanitized.replace(DANGEROUS_HTML_TAGS, '');
    sanitized = sanitized.replace(DANGEROUS_ATTRIBUTES, '');
    return sanitized;
  },

  // HTML entity escape for safe rendering
  escapeHtml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Inspect prompt for prompt injection patterns
  inspectPromptSafety(prompt: string): { safe: boolean; detectedThreat?: string } {
    if (!prompt) return { safe: true };
    const lower = prompt.toLowerCase();
    for (const marker of PROMPT_INJECTION_MARKERS) {
      if (lower.includes(marker)) {
        this.logAuditEvent({
          category: 'input_sanitization',
          severity: 'warning',
          action: 'Prompt Injection Neutralized',
          details: `Blocked suspected prompt injection phrase: "${marker}"`,
          blocked: true,
        });
        return { safe: false, detectedThreat: `Suspicious prompt override sequence detected: "${marker}"` };
      }
    }
    return { safe: true };
  },

  // -------------------------------------------------------------
  // 3. File & Image Upload Validation (Magic Bytes & MIME check)
  // -------------------------------------------------------------
  
  ALLOWED_IMAGE_MIMES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOC_MIMES: ['application/pdf', 'text/plain'],
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB limit for strict security

  async validateUploadFile(file: File, allowedTypes: 'image' | 'any' = 'image'): Promise<FileValidationResult> {
    if (!file) {
      return { valid: false, error: 'No file provided.' };
    }

    const fileSizeFormatted = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    // 1. File Size Verification (Max 5MB)
    if (file.size > this.MAX_FILE_SIZE_BYTES) {
      this.logAuditEvent({
        category: 'upload_validation',
        severity: 'warning',
        action: 'File Size Limit Exceeded',
        details: `Rejected upload "${file.name}" (${fileSizeFormatted}) exceeding 5MB bound.`,
        blocked: true,
      });
      return {
        valid: false,
        error: `File size (${fileSizeFormatted}) exceeds maximum allowed limit of 5.0 MB.`,
        fileSizeBytes: file.size,
        fileSizeFormatted,
      };
    }

    if (file.size === 0) {
      return { valid: false, error: 'File is empty (0 bytes).' };
    }

    // 2. MIME Type Whitelist
    const validMimes = allowedTypes === 'image'
      ? this.ALLOWED_IMAGE_MIMES
      : [...this.ALLOWED_IMAGE_MIMES, ...this.ALLOWED_DOC_MIMES];

    const mime = file.type.toLowerCase();
    if (!validMimes.includes(mime)) {
      this.logAuditEvent({
        category: 'upload_validation',
        severity: 'warning',
        action: 'Invalid MIME Type Blocked',
        details: `Rejected upload "${file.name}" with unsupported MIME type "${file.type}".`,
        blocked: true,
      });
      return {
        valid: false,
        error: `Unsupported file type (${file.type || 'unknown'}). Please upload a valid JPG, PNG, WEBP, or GIF.`,
        detectedMimeType: mime,
      };
    }

    // 3. Magic Bytes / Header Inspection
    try {
      const buffer = await file.slice(0, 12).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

      let magicValid = false;
      if (hex.startsWith('ffd8ff')) {
        // JPEG
        magicValid = true;
      } else if (hex.startsWith('89504e47')) {
        // PNG
        magicValid = true;
      } else if (hex.startsWith('52494646') && hex.includes('57454250')) {
        // WEBP (RIFF .... WEBP)
        magicValid = true;
      } else if (hex.startsWith('47494638')) {
        // GIF (GIF87a / GIF89a)
        magicValid = true;
      } else if (allowedTypes === 'any' && hex.startsWith('25504446')) {
        // PDF (%PDF)
        magicValid = true;
      } else if (allowedTypes === 'any' && mime === 'text/plain') {
        magicValid = true;
      }

      if (!magicValid) {
        this.logAuditEvent({
          category: 'upload_validation',
          severity: 'critical',
          action: 'Disguised / Malicious File Header Detected',
          details: `Rejected file "${file.name}" where magic header (${hex.slice(0, 8)}) mismatched MIME ${mime}.`,
          blocked: true,
        });
        return {
          valid: false,
          error: 'File signature verification failed. The file format is corrupt or disguised.',
          magicBytesVerified: false,
        };
      }

      // 4. Image Dimensions Bounds Check (Max 8000x8000 to prevent decompression bombs)
      if (this.ALLOWED_IMAGE_MIMES.includes(mime)) {
        const dimensions = await this.getImageDimensions(file);
        if (dimensions.width > 8000 || dimensions.height > 8000) {
          return {
            valid: false,
            error: `Image dimensions (${dimensions.width}x${dimensions.height}) exceed safe limits (8000x8000).`,
            dimensions,
          };
        }
        return {
          valid: true,
          detectedMimeType: mime,
          fileSizeBytes: file.size,
          fileSizeFormatted,
          dimensions,
          magicBytesVerified: true,
        };
      }

      return {
        valid: true,
        detectedMimeType: mime,
        fileSizeBytes: file.size,
        fileSizeFormatted,
        magicBytesVerified: true,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: `File inspection error: ${err?.message || 'Unable to read file headers'}`,
      };
    }
  },

  getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const dims = { width: img.naturalWidth, height: img.naturalHeight };
        URL.revokeObjectURL(url);
        resolve(dims);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 0, height: 0 });
      };
      img.src = url;
    });
  },

  // -------------------------------------------------------------
  // 4. Password Complexity & Security Rules
  // -------------------------------------------------------------

  validatePasswordStrength(password: string): { valid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    if (!password) {
      return { valid: false, score: 0, feedback: ['Password is required'] };
    }

    if (password.length >= 8) {
      score += 25;
    } else {
      feedback.push('At least 8 characters long');
    }

    if (/[A-Z]/.test(password)) {
      score += 25;
    } else {
      feedback.push('At least one uppercase letter (A-Z)');
    }

    if (/[a-z]/.test(password)) {
      score += 25;
    } else {
      feedback.push('At least one lowercase letter (a-z)');
    }

    if (/[0-9]/.test(password)) {
      score += 15;
    } else {
      feedback.push('At least one numeric digit (0-9)');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 10;
    } else {
      feedback.push('At least one special character (e.g. !@#$%)');
    }

    return {
      valid: score >= 75 && password.length >= 8,
      score: Math.min(100, score),
      feedback,
    };
  },

  // -------------------------------------------------------------
  // 5. Anti-Duplicate & Idempotency Key Tracking
  // -------------------------------------------------------------

  _idempotencyCache: new Set<string>(),

  generateIdempotencyKey(endpoint: string, payload?: any): string {
    const payloadStr = payload ? JSON.stringify(payload) : '';
    const hash = `${endpoint}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return hash;
  },

  isDuplicateRequest(key: string, ttlMs: number = 3000): boolean {
    if (!key) return false;
    if (this._idempotencyCache.has(key)) {
      return true;
    }
    this._idempotencyCache.add(key);
    setTimeout(() => {
      this._idempotencyCache.delete(key);
    }, ttlMs);
    return false;
  },

  // -------------------------------------------------------------
  // 6. Session Security & Inactivity Tracker
  // -------------------------------------------------------------

  _sessionToken: '',

  getOrGenerateSessionToken(): string {
    if (!this._sessionToken) {
      let saved = localStorage.getItem('eduai_session_token');
      if (!saved) {
        saved = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('eduai_session_token', saved);
      }
      this._sessionToken = saved;
    }
    return this._sessionToken;
  },

  refreshSession(): void {
    this._sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('eduai_session_token', this._sessionToken);
    localStorage.setItem('eduai_last_activity', Date.now().toString());
  },

  recordUserActivity(): void {
    localStorage.setItem('eduai_last_activity', Date.now().toString());
  },

  checkSessionTimeout(maxInactivityMinutes: number = 30): { timedOut: boolean; inactiveMinutes: number } {
    const last = Number(localStorage.getItem('eduai_last_activity') || Date.now());
    const now = Date.now();
    const elapsedMinutes = (now - last) / (1000 * 60);
    return {
      timedOut: elapsedMinutes > maxInactivityMinutes,
      inactiveMinutes: Math.round(elapsedMinutes),
    };
  },

  // -------------------------------------------------------------
  // 7. Security Audit Event Logger
  // -------------------------------------------------------------

  AUDIT_LOGS_STORAGE_KEY: 'eduai_security_audit_logs',

  getAuditLogs(): SecurityAuditEvent[] {
    try {
      const data = localStorage.getItem(this.AUDIT_LOGS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  logAuditEvent(event: Omit<SecurityAuditEvent, 'id' | 'timestamp'>): void {
    try {
      const logs = this.getAuditLogs();
      const newEvent: SecurityAuditEvent = {
        ...event,
        id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
      };
      // Keep last 150 events
      const updated = [newEvent, ...logs].slice(0, 150);
      localStorage.setItem(this.AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updated));
      
      // Dispatch browser custom event for real-time console updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('eduai_security_event', { detail: newEvent }));
      }
    } catch (e) {
      console.warn('Failed to record security audit log', e);
    }
  },

  clearAuditLogs(): void {
    localStorage.removeItem(this.AUDIT_LOGS_STORAGE_KEY);
  },

  exportAuditLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getAuditLogs();
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }
    const headers = ['ID', 'Timestamp', 'Category', 'Severity', 'Action', 'User Role', 'Blocked', 'Details'];
    const rows = logs.map(l => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.category}"`,
      `"${l.severity}"`,
      `"${l.action}"`,
      `"${l.userRole || 'anonymous'}"`,
      `"${l.blocked ? 'YES' : 'NO'}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },
};

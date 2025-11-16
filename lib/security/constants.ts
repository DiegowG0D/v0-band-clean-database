// Security configuration constants

export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 60000, // 1 minute
    MAX_REQUESTS: 10,
  },

  // Session
  SESSION: {
    MAX_AGE: 3600000, // 1 hour
    REFRESH_THRESHOLD: 300000, // 5 minutes
  },

  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false,
  },

  // Input limits
  INPUT_LIMITS: {
    MAX_TEXT_LENGTH: 500,
    MAX_NAME_LENGTH: 100,
    MAX_EMAIL_LENGTH: 255,
  },

  // CSRF token
  CSRF: {
    TOKEN_EXPIRY: 3600000, // 1 hour
  },
} as const;

// Allowed file types for uploads (if implemented)
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

// Maximum file size (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Security event types for logging
export const SECURITY_EVENTS = {
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  INVALID_INPUT: 'invalid_input',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  FAILED_LOGIN: 'failed_login',
  PERMISSION_DENIED: 'permission_denied',
} as const;

/**
 * Application-wide constants for consistent configuration
 */

// Debounce timings (standardized across the app)
export const DEBOUNCE_TIMES = {
  AUTO_SAVE: 2000,       // Auto-save debounce
  SEARCH: 300,           // Search debounce  
  RESIZE: 100,           // Window resize debounce
  INPUT_VALIDATION: 500, // Input validation debounce
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  MARKDOWN_MAX_SIZE: 100,
  MARKDOWN_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  QUERY_CACHE_TIME: 5 * 60 * 1000, // 5 minutes
} as const;

// File size limits
export const FILE_LIMITS = {
  MAX_AVATAR_SIZE: 5 * 1024 * 1024,     // 5MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,     // 10MB
  MAX_NOTE_SIZE: 50000,                 // 50k characters
  MAX_TITLE_SIZE: 200,                  // 200 characters
  MAX_TAG_SIZE: 50,                     // 50 characters
} as const;

// Rate limiting
export const RATE_LIMITS = {
  API_REQUESTS: { max: 100, window: 60 * 1000 },      // 100 per minute
  AUTH_ATTEMPTS: { max: 5, window: 15 * 60 * 1000 },  // 5 per 15 minutes
  UPLOADS: { max: 20, window: 60 * 1000 },            // 20 per minute
} as const;

// Performance thresholds
export const PERFORMANCE = {
  LARGE_DOCUMENT_THRESHOLD: 10000,      // Characters
  VIRTUALIZATION_THRESHOLD: 1000,       // Items
  LAZY_LOAD_THRESHOLD: 2000,           // Pixels from viewport
} as const;

// UI Constants
export const UI = {
  MOBILE_BREAKPOINT: 768,               // px
  SIDEBAR_WIDTH: 320,                   // px
  HEADER_HEIGHT: 60,                    // px
  FOOTER_HEIGHT: 40,                    // px
} as const;
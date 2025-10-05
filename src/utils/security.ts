
import { User } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Security utilities for input validation and sanitization

export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous HTML characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim()
    .substring(0, maxLength);
};

export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/&/g, '&amp;');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validateTaskTitle = (title: string): { isValid: boolean; error?: string } => {
  if (!title || title.trim().length === 0) {
    return { isValid: false, error: 'Title is required' };
  }
  
  if (title.length > 200) {
    return { isValid: false, error: 'Title must be 200 characters or less' };
  }
  
  return { isValid: true };
};

export const validateTaskDescription = (description: string): { isValid: boolean; error?: string } => {
  if (description && description.length > 50000) {
    return { isValid: false, error: 'Description must be 50,000 characters or less' };
  }
  
  return { isValid: true };
};

export const validateTagName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Tag name is required' };
  }
  
  if (name.length > 50) {
    return { isValid: false, error: 'Tag name must be 50 characters or less' };
  }
  
  // Prevent special characters that could cause issues
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    return { isValid: false, error: 'Tag name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }
  
  return { isValid: true };
};

export const validateUrl = (url: string, allowedDomains?: string[]): boolean => {
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Prevent localhost and internal IP access (security)
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.20.') ||
        hostname.startsWith('172.21.') ||
        hostname.startsWith('172.22.') ||
        hostname.startsWith('172.23.') ||
        hostname.startsWith('172.24.') ||
        hostname.startsWith('172.25.') ||
        hostname.startsWith('172.26.') ||
        hostname.startsWith('172.27.') ||
        hostname.startsWith('172.28.') ||
        hostname.startsWith('172.29.') ||
        hostname.startsWith('172.30.') ||
        hostname.startsWith('172.31.') ||
        hostname.startsWith('169.254.') ||
        hostname.startsWith('fe80:') ||
        hostname === '::1') {
      return false;
    }
    
    // Block file:// and other dangerous protocols
    const dangerousProtocols = ['file:', 'ftp:', 'javascript:', 'data:', 'vbscript:'];
    if (dangerousProtocols.some(protocol => url.toLowerCase().includes(protocol))) {
      return false;
    }
    
    // Validate URL length
    if (url.length > 2048) {
      return false;
    }
    
    // If allowed domains are specified, check against them
    if (allowedDomains && allowedDomains.length > 0) {
      return allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    }
    
    return true;
  } catch {
    return false;
  }
};

// Enhanced security logging
export const logSecurityEvent = (event: string, details: Record<string, any>) => {
  const logEntry = {
    event,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...details
  };
  
  // Use centralized logging for security events
  logger.security(logEntry.event, logEntry);
};

export const rateLimitTracker = new Map<string, { count: number; lastReset: number }>();

export const checkRateLimit = (key: string, maxRequests: number, windowMs: number): boolean => {
  const now = Date.now();
  const tracker = rateLimitTracker.get(key);
  
  if (!tracker || now - tracker.lastReset > windowMs) {
    rateLimitTracker.set(key, { count: 1, lastReset: now });
    return true;
  }
  
  if (tracker.count >= maxRequests) {
    return false;
  }
  
  tracker.count++;
  return true;
};

/**
 * Validates password strength against security requirements.
 * Ensures passwords meet minimum complexity standards.
 * @param password The password to validate
 * @returns Object with isValid boolean and array of error messages
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { isValid: errors.length === 0, errors };
};

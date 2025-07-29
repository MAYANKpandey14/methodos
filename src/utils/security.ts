
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
  if (description && description.length > 2000) {
    return { isValid: false, error: 'Description must be 2000 characters or less' };
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
        hostname.startsWith('169.254.')) {
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
  
  // In production, this should be sent to a secure logging service
  console.warn('SECURITY EVENT:', logEntry);
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

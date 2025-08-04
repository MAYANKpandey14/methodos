/**
 * Centralized logging utility for consistent error handling and debugging
 */

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: string,
    data?: any
  ): LogEntry {
    return {
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private log(entry: LogEntry): void {
    const prefix = `[${entry.level.toUpperCase()}]${entry.context ? ` [${entry.context}]` : ''}`;
    
    switch (entry.level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(prefix, entry.message, entry.data || '');
        }
        break;
      case 'info':
        console.info(prefix, entry.message, entry.data || '');
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.data || '');
        break;
      case 'error':
        console.error(prefix, entry.message, entry.data || '');
        // In production, you could send this to an error tracking service
        break;
    }
  }

  debug(message: string, context?: string, data?: any): void {
    this.log(this.createLogEntry('debug', message, context, data));
  }

  info(message: string, context?: string, data?: any): void {
    this.log(this.createLogEntry('info', message, context, data));
  }

  warn(message: string, context?: string, data?: any): void {
    this.log(this.createLogEntry('warn', message, context, data));
  }

  error(message: string, context?: string, data?: any): void {
    this.log(this.createLogEntry('error', message, context, data));
  }

  // Security logging with special handling
  security(event: string, details?: any): void {
    const entry = this.createLogEntry('warn', `SECURITY EVENT: ${event}`, 'SECURITY', details);
    this.log(entry);
    
    // In production, this should be sent to a secure logging service
    if (!this.isDevelopment) {
      // TODO: Send to security monitoring service
    }
  }

  // Markdown rendering specific logging
  markdownError(message: string, error?: any): void {
    this.error(`Markdown rendering failed: ${message}`, 'MARKDOWN', error);
  }

  markdownWarn(message: string, error?: any): void {
    this.warn(`Markdown rendering warning: ${message}`, 'MARKDOWN', error);
  }
}

export const logger = new Logger();
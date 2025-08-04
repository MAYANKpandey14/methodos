import { useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useToast } from './use-toast';

interface ErrorBoundaryOptions {
  fallbackMessage?: string;
  logContext?: string;
  showToast?: boolean;
}

export function useErrorBoundary(options: ErrorBoundaryOptions = {}) {
  const { toast } = useToast();
  const {
    fallbackMessage = 'An unexpected error occurred',
    logContext = 'APP',
    showToast = true
  } = options;

  const handleError = useCallback((error: Error | unknown, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullContext = context ? `${logContext}:${context}` : logContext;
    
    logger.error(errorMessage, fullContext, error);
    
    if (showToast) {
      toast({
        title: "Error",
        description: fallbackMessage,
        variant: "destructive",
      });
    }
  }, [fallbackMessage, logContext, showToast, toast]);

  const wrapAsync = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return async (...args: T): Promise<R | void> => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error, context);
      }
    };
  }, [handleError]);

  const wrapSync = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    context?: string
  ) => {
    return (...args: T): R | void => {
      try {
        return fn(...args);
      } catch (error) {
        handleError(error, context);
      }
    };
  }, [handleError]);

  return {
    handleError,
    wrapAsync,
    wrapSync,
  };
}
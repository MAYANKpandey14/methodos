
import { useState, useEffect, useRef, useCallback } from 'react';

interface TimerState {
  isRunning: boolean;
  timeRemaining: number;
  startTime: number | null;
  duration: number;
  sessionId: string | null;
}

const TIMER_STORAGE_KEY = 'pomodoro-timer-state';

export const usePersistentTimer = (initialDuration: number) => {
  const [timerState, setTimerState] = useState<TimerState>(() => {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved) as TimerState;
      // Calculate actual time remaining based on elapsed time
      if (state.isRunning && state.startTime) {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        const remaining = Math.max(0, state.duration - elapsed);
        return {
          ...state,
          timeRemaining: remaining,
        };
      }
      return state;
    }
    return {
      isRunning: false,
      timeRemaining: initialDuration,
      startTime: null,
      duration: initialDuration,
      sessionId: null,
    };
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
  }, [timerState]);

  // Timer tick function
  const tick = useCallback(() => {
    setTimerState(prev => {
      if (!prev.isRunning || !prev.startTime) return prev;
      
      const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
      const remaining = Math.max(0, prev.duration - elapsed);
      
      if (remaining === 0) {
        // Timer completed
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
        return {
          ...prev,
          isRunning: false,
          timeRemaining: 0,
        };
      }
      
      return {
        ...prev,
        timeRemaining: remaining,
      };
    });
  }, []);

  // Set up interval when timer is running
  useEffect(() => {
    if (timerState.isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, tick]);

  // Handle page visibility change to ensure accurate timing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && timerState.isRunning) {
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timerState.isRunning, tick]);

  const startTimer = useCallback((sessionId: string, onComplete?: () => void) => {
    const now = Date.now();
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      startTime: now,
      sessionId,
      timeRemaining: prev.duration,
    }));
    onCompleteRef.current = onComplete || null;
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  const resumeTimer = useCallback(() => {
    const now = Date.now();
    const elapsed = timerState.startTime ? Math.floor((Date.now() - timerState.startTime) / 1000) : 0;
    const newStartTime = now - (elapsed * 1000);
    
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      startTime: newStartTime,
    }));
  }, [timerState.startTime]);

  const resetTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false,
      timeRemaining: prev.duration,
      startTime: null,
      sessionId: null,
    }));
    localStorage.removeItem(TIMER_STORAGE_KEY);
  }, []);

  const setDuration = useCallback((newDuration: number) => {
    setTimerState(prev => ({
      ...prev,
      duration: newDuration,
      timeRemaining: prev.isRunning ? prev.timeRemaining : newDuration,
    }));
  }, []);

  return {
    isRunning: timerState.isRunning,
    timeRemaining: timerState.timeRemaining,
    sessionId: timerState.sessionId,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setDuration,
  };
};

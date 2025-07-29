
import { create } from 'zustand';
import { PomodoroSession, Task } from '../types';

interface PomodoroState {
  workDuration: number;
  breakDuration: number;
  setDurations: (workDuration: number, breakDuration: number) => void;
}

export const usePomodoroStore = create<PomodoroState>((set) => ({
  workDuration: 25 * 60,
  breakDuration: 5 * 60,

  setDurations: (workDuration: number, breakDuration: number) => {
    set({ 
      workDuration: workDuration * 60, 
      breakDuration: breakDuration * 60,
    });
  }
}));

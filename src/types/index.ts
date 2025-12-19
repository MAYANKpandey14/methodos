
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  dueDate?: Date;
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PomodoroSession {
  id: string;
  userId: string;
  taskId: string;
  duration: number;
  sessionType: 'work' | 'break';
  startedAt: Date;
  completedAt?: Date;
  isCompleted: boolean;
}

export interface TaskFilters {
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  status?: 'completed' | 'pending';
  search?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  pomodoroDuration: number;
  breakDuration: number;
}

export interface Bookmark {
  id: string;
  userId: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  isPinned: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

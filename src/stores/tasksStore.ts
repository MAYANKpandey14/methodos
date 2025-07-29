
import { create } from 'zustand';
import { Task, TaskFilters } from '../types';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks';

interface TasksState {
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  getTasksByTag: (tag: string, tasks: Task[]) => Task[];
  getTasksByPriority: (priority: string, tasks: Task[]) => Task[];
}

export const useTasksStore = create<TasksState>((set, get) => ({
  filters: {},

  setFilters: (filters: TaskFilters) => {
    set({ filters });
  },

  getTasksByTag: (tag: string, tasks: Task[]) => {
    return tasks.filter(task => task.tags.includes(tag));
  },

  getTasksByPriority: (priority: string, tasks: Task[]) => {
    return tasks.filter(task => task.priority === priority);
  }
}));

// Export the hooks for use in components
export { useTasks, useCreateTask, useUpdateTask, useDeleteTask };

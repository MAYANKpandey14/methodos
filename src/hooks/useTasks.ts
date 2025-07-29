import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Task, TaskFilters } from '@/types';
import { sanitizeInput, validateTaskTitle, validateTaskDescription } from '@/utils/security';

interface DbTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  estimated_pomodoros: number;
  completed_pomodoros: number;
  is_completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  task_tags: {
    tags: {
      id: string;
      name: string;
      color: string;
    };
  }[];
}

const transformTask = (dbTask: DbTask): Task => ({
  id: dbTask.id,
  userId: dbTask.user_id,
  title: dbTask.title,
  description: dbTask.description,
  priority: dbTask.priority,
  tags: dbTask.task_tags.map(tt => tt.tags.name),
  dueDate: dbTask.due_date ? new Date(dbTask.due_date) : undefined,
  estimatedPomodoros: dbTask.estimated_pomodoros,
  completedPomodoros: dbTask.completed_pomodoros,
  isCompleted: dbTask.is_completed,
  createdAt: new Date(dbTask.created_at),
  updatedAt: new Date(dbTask.updated_at)
});

export const useTasks = (filters?: TaskFilters) => {
  const user = useAuthStore(state => state.user);
  
  return useQuery({
    queryKey: ['tasks', user?.id, filters],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('tasks')
        .select(`
          *,
          task_tags(
            tags(id, name, color)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.status === 'completed') {
        query = query.eq('is_completed', true);
      } else if (filters?.status === 'pending') {
        query = query.eq('is_completed', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      let tasks = (data as DbTask[]).map(transformTask);

      // Apply client-side filters with sanitization
      if (filters?.search) {
        const sanitizedSearch = sanitizeInput(filters.search.toLowerCase(), 100);
        tasks = tasks.filter(task => 
          task.title.toLowerCase().includes(sanitizedSearch) || 
          task.description?.toLowerCase().includes(sanitizedSearch)
        );
      }

      if (filters?.tags && filters.tags.length > 0) {
        tasks = tasks.filter(task => 
          filters.tags!.some(tag => task.tags.includes(tag))
        );
      }

      return tasks;
    },
    enabled: !!user,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  return useMutation({
    mutationFn: async (taskData: {
      title: string;
      description?: string;
      priority: 'high' | 'medium' | 'low';
      estimatedPomodoros: number;
      dueDate?: Date;
      tags: string[];
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Security: Validate and sanitize inputs
      const sanitizedTitle = sanitizeInput(taskData.title, 200);
      const sanitizedDescription = taskData.description ? sanitizeInput(taskData.description, 2000) : undefined;

      const titleValidation = validateTaskTitle(sanitizedTitle);
      if (!titleValidation.isValid) {
        throw new Error(titleValidation.error);
      }

      if (sanitizedDescription) {
        const descValidation = validateTaskDescription(sanitizedDescription);
        if (!descValidation.isValid) {
          throw new Error(descValidation.error);
        }
      }

      // Validate estimated pomodoros
      if (taskData.estimatedPomodoros < 1 || taskData.estimatedPomodoros > 50) {
        throw new Error('Estimated pomodoros must be between 1 and 50');
      }

      // Sanitize and validate tags
      const sanitizedTags = taskData.tags
        .map(tag => sanitizeInput(tag, 50))
        .filter(tag => tag.length > 0)
        .slice(0, 10); // Limit to 10 tags max

      // Create task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: sanitizedTitle,
          description: sanitizedDescription,
          priority: taskData.priority,
          estimated_pomodoros: taskData.estimatedPomodoros,
          due_date: taskData.dueDate?.toISOString(),
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Handle tags
      for (const tagName of sanitizedTags) {
        // Create or get tag
        const { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', tagName)
          .single();

        let tagId: string;

        if (existingTag) {
          tagId = existingTag.id;
        } else {
          const { data: newTag, error: tagError } = await supabase
            .from('tags')
            .insert({
              user_id: user.id,
              name: tagName
            })
            .select('id')
            .single();

          if (tagError) throw tagError;
          tagId = newTag.id;
        }

        // Link tag to task
        const { error: linkError } = await supabase
          .from('task_tags')
          .insert({
            task_id: task.id,
            tag_id: tagId
          });

        if (linkError) throw linkError;
      }

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      if (!user) throw new Error('User not authenticated');

      const dbUpdates: any = {};
      
      // Security: Validate and sanitize updates
      if (updates.title !== undefined) {
        const sanitizedTitle = sanitizeInput(updates.title, 200);
        const titleValidation = validateTaskTitle(sanitizedTitle);
        if (!titleValidation.isValid) {
          throw new Error(titleValidation.error);
        }
        dbUpdates.title = sanitizedTitle;
      }
      
      if (updates.description !== undefined) {
        const sanitizedDescription = updates.description ? sanitizeInput(updates.description, 2000) : null;
        if (sanitizedDescription) {
          const descValidation = validateTaskDescription(sanitizedDescription);
          if (!descValidation.isValid) {
            throw new Error(descValidation.error);
          }
        }
        dbUpdates.description = sanitizedDescription;
      }
      
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.estimatedPomodoros !== undefined) {
        if (updates.estimatedPomodoros < 1 || updates.estimatedPomodoros > 50) {
          throw new Error('Estimated pomodoros must be between 1 and 50');
        }
        dbUpdates.estimated_pomodoros = updates.estimatedPomodoros;
      }
      if (updates.completedPomodoros !== undefined) {
        if (updates.completedPomodoros < 0 || updates.completedPomodoros > 100) {
          throw new Error('Completed pomodoros must be between 0 and 100');
        }
        dbUpdates.completed_pomodoros = updates.completedPomodoros;
      }
      if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate?.toISOString();

      const { data, error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

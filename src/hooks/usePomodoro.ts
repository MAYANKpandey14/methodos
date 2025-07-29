
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { PomodoroSession } from '@/types';

interface DbPomodoroSession {
  id: string;
  user_id: string;
  task_id: string | null;
  session_type: 'work' | 'short_break' | 'long_break';
  duration_minutes: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const transformSession = (dbSession: DbPomodoroSession): PomodoroSession => ({
  id: dbSession.id,
  userId: dbSession.user_id,
  taskId: dbSession.task_id || '',
  duration: dbSession.duration_minutes * 60, // Convert to seconds for compatibility
  sessionType: dbSession.session_type === 'work' ? 'work' : 'break',
  startedAt: new Date(dbSession.started_at),
  completedAt: dbSession.completed_at ? new Date(dbSession.completed_at) : undefined,
  isCompleted: dbSession.status === 'completed'
});

export const usePomodoroSessions = () => {
  const user = useAuthStore(state => state.user);
  
  return useQuery({
    queryKey: ['pomodoro-sessions', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return (data as DbPomodoroSession[]).map(transformSession);
    },
    enabled: !!user,
  });
};

export const useCreatePomodoroSession = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  return useMutation({
    mutationFn: async (sessionData: {
      taskId?: string;
      durationMinutes: number;
      sessionType: 'work' | 'short_break' | 'long_break';
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .insert({
          user_id: user.id,
          task_id: sessionData.taskId || null,
          session_type: sessionData.sessionType,
          duration_minutes: sessionData.durationMinutes,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
    },
  });
};

export const useUpdatePomodoroSession = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      completedAt 
    }: { 
      id: string; 
      status?: 'active' | 'paused' | 'completed' | 'cancelled';
      completedAt?: Date;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const updates: any = {};
      if (status) updates.status = status;
      if (completedAt) updates.completed_at = completedAt.toISOString();

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
    },
  });
};

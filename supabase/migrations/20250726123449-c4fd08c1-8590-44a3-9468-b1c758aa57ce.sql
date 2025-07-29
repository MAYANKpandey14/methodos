-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  estimated_pomodoros INTEGER NOT NULL DEFAULT 1,
  completed_pomodoros INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create task_tags junction table for many-to-many relationship
CREATE TABLE public.task_tags (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, tag_id)
);

-- Create pomodoro_sessions table
CREATE TABLE public.pomodoro_sessions (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('work', 'short_break', 'long_break')),
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'cancelled')) DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tasks
CREATE POLICY "Users can view their own tasks" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
ON public.tasks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for tags
CREATE POLICY "Users can view their own tags" 
ON public.tags 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" 
ON public.tags 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" 
ON public.tags 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" 
ON public.tags 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for task_tags
CREATE POLICY "Users can view their own task_tags" 
ON public.task_tags 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_tags.task_id 
    AND tasks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own task_tags" 
ON public.task_tags 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_tags.task_id 
    AND tasks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own task_tags" 
ON public.task_tags 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_tags.task_id 
    AND tasks.user_id = auth.uid()
  )
);

-- Create RLS policies for pomodoro_sessions
CREATE POLICY "Users can view their own pomodoro_sessions" 
ON public.pomodoro_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pomodoro_sessions" 
ON public.pomodoro_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pomodoro_sessions" 
ON public.pomodoro_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pomodoro_sessions" 
ON public.pomodoro_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pomodoro_sessions_updated_at
  BEFORE UPDATE ON public.pomodoro_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_is_completed ON public.tasks(is_completed);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

CREATE INDEX idx_tags_user_id ON public.tags(user_id);
CREATE INDEX idx_tags_name ON public.tags(name);

CREATE INDEX idx_task_tags_task_id ON public.task_tags(task_id);
CREATE INDEX idx_task_tags_tag_id ON public.task_tags(tag_id);

CREATE INDEX idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX idx_pomodoro_sessions_task_id ON public.pomodoro_sessions(task_id);
CREATE INDEX idx_pomodoro_sessions_status ON public.pomodoro_sessions(status);
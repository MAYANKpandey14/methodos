-- ============================================================================
-- METHODOS - Consolidated Database Schema
-- ============================================================================
-- This is the complete database schema for the Methodos productivity app.
-- Updated: 2025-12-19 to be idempotent (safe to run on existing DB)
-- 
-- Tables: profiles, tasks, tags, task_tags, pomodoro_sessions, bookmarks, notes
-- Storage Buckets: avatars, note-images
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- Stores user preferences and profile information
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name text,
  avatar_url text,
  theme text CHECK (theme IN ('light', 'dark')) DEFAULT 'light',
  pomodoro_duration integer NOT NULL DEFAULT 25,
  short_break_duration integer NOT NULL DEFAULT 5,
  long_break_duration integer NOT NULL DEFAULT 15,
  long_break_interval integer NOT NULL DEFAULT 4,
  notifications_enabled boolean NOT NULL DEFAULT true,
  sound_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================================================
-- TASKS TABLE
-- Core task management with priority and pomodoro tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  estimated_pomodoros integer NOT NULL DEFAULT 1,
  completed_pomodoros integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  due_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================================================
-- TAGS TABLE
-- User-defined tags with colors for task categorization
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_tag_name UNIQUE (user_id, name)
);

-- ============================================================================
-- TASK_TAGS JUNCTION TABLE
-- Many-to-many relationship between tasks and tags
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_tags (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_task_tag UNIQUE (task_id, tag_id)
);

-- ============================================================================
-- POMODORO_SESSIONS TABLE
-- Tracks pomodoro work and break sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  session_type text NOT NULL CHECK (session_type IN ('work', 'short_break', 'long_break')),
  duration_minutes integer NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'cancelled')) DEFAULT 'active',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================================================
-- BOOKMARKS TABLE
-- User bookmarks with tags stored as array
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================================================
-- NOTES TABLE
-- Markdown notes with pinning support
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tasks policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
CREATE POLICY "Users can view their own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
CREATE POLICY "Users can create their own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Tags policies
DROP POLICY IF EXISTS "Users can view their own tags" ON public.tags;
CREATE POLICY "Users can view their own tags" ON public.tags
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own tags" ON public.tags;
CREATE POLICY "Users can create their own tags" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tags" ON public.tags;
CREATE POLICY "Users can update their own tags" ON public.tags
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tags" ON public.tags;
CREATE POLICY "Users can delete their own tags" ON public.tags
  FOR DELETE USING (auth.uid() = user_id);

-- Task_tags policies
DROP POLICY IF EXISTS "Users can view their own task_tags" ON public.task_tags;
CREATE POLICY "Users can view their own task_tags" ON public.task_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create their own task_tags" ON public.task_tags;
CREATE POLICY "Users can create their own task_tags" ON public.task_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own task_tags" ON public.task_tags;
CREATE POLICY "Users can update their own task_tags" ON public.task_tags
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete their own task_tags" ON public.task_tags;
CREATE POLICY "Users can delete their own task_tags" ON public.task_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_tags.task_id AND tasks.user_id = auth.uid())
  );

-- Pomodoro sessions policies
DROP POLICY IF EXISTS "Users can view their own pomodoro_sessions" ON public.pomodoro_sessions;
CREATE POLICY "Users can view their own pomodoro_sessions" ON public.pomodoro_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own pomodoro_sessions" ON public.pomodoro_sessions;
CREATE POLICY "Users can create their own pomodoro_sessions" ON public.pomodoro_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pomodoro_sessions" ON public.pomodoro_sessions;
CREATE POLICY "Users can update their own pomodoro_sessions" ON public.pomodoro_sessions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own pomodoro_sessions" ON public.pomodoro_sessions;
CREATE POLICY "Users can delete their own pomodoro_sessions" ON public.pomodoro_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks policies
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can create their own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can update their own bookmarks" ON public.bookmarks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Notes policies
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
CREATE POLICY "Users can view their own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
CREATE POLICY "Users can create their own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
CREATE POLICY "Users can update their own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
CREATE POLICY "Users can delete their own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Function to normalize tag names (capitalize first letter)
CREATE OR REPLACE FUNCTION public.normalize_tag_name(tag_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN INITCAP(LOWER(TRIM(tag_name)));
END;
$$;

-- Function to get user tag statistics
CREATE OR REPLACE FUNCTION public.get_user_tag_stats()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  color text,
  created_at timestamp with time zone,
  usage_count bigint,
  last_used_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.user_id,
    t.name,
    t.color,
    t.created_at,
    count(tt.id) AS usage_count,
    max(tt.created_at) AS last_used_at
  FROM tags t
  LEFT JOIN task_tags tt ON t.id = tt.tag_id
  WHERE t.user_id = auth.uid()
  GROUP BY t.id, t.user_id, t.name, t.color, t.created_at
  ORDER BY usage_count DESC, t.name ASC;
$$;

-- Grant execute permission for get_user_tag_stats
REVOKE ALL ON FUNCTION public.get_user_tag_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_tag_stats() TO authenticated;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_pomodoro_sessions_updated_at ON public.pomodoro_sessions;
CREATE TRIGGER update_pomodoro_sessions_updated_at
  BEFORE UPDATE ON public.pomodoro_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookmarks_updated_at ON public.bookmarks;
CREATE TRIGGER update_bookmarks_updated_at
  BEFORE UPDATE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON public.tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_user_normalized_name ON public.tags(user_id, LOWER(name));

-- Task_tags indexes
CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON public.task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON public.task_tags(tag_id);

-- Pomodoro sessions indexes
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON public.pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_task_id ON public.pomodoro_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_status ON public.pomodoro_sessions(status);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_started_at ON public.pomodoro_sessions(started_at DESC);

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON public.bookmarks USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at DESC);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON public.notes(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON public.notes(updated_at DESC);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Tag usage statistics view
CREATE OR REPLACE VIEW public.tag_usage_stats WITH (security_invoker = true) AS
SELECT
  t.id,
  t.user_id,
  t.name,
  t.color,
  t.created_at,
  COUNT(tt.id) as usage_count,
  MAX(tt.created_at) as last_used_at
FROM public.tags t
LEFT JOIN public.task_tags tt ON t.id = tt.tag_id
GROUP BY t.id, t.user_id, t.name, t.color, t.created_at;

GRANT SELECT ON public.tag_usage_stats TO authenticated;

COMMENT ON VIEW public.tag_usage_stats IS 'Tag usage statistics - filtered by user_id through underlying table RLS policies';

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Note images bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-images', 'note-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects if not already enabled
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STORAGE POLICIES - AVATARS
-- ============================================================================

-- Public read access for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- STORAGE POLICIES - NOTE IMAGES
-- ============================================================================

-- Public read access for note images
DROP POLICY IF EXISTS "Note images are publicly accessible" ON storage.objects;
CREATE POLICY "Note images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'note-images');

-- Authenticated users can upload images
DROP POLICY IF EXISTS "Authenticated users can upload note images" ON storage.objects;
CREATE POLICY "Authenticated users can upload note images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'note-images');

-- Users can update their own images
DROP POLICY IF EXISTS "Users can update own note images" ON storage.objects;
CREATE POLICY "Users can update own note images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'note-images' AND owner = auth.uid());

-- Users can delete their own images
DROP POLICY IF EXISTS "Users can delete own note images" ON storage.objects;
CREATE POLICY "Users can delete own note images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'note-images' AND owner = auth.uid());

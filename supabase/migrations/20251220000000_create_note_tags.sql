-- ============================================================================
-- PHASE 3: ORGANIZATION & METADATA
-- Create note_tags junction table and RLS policies
-- ============================================================================

-- NOTE_TAGS JUNCTION TABLE
-- Many-to-many relationship between notes and tags
CREATE TABLE IF NOT EXISTS public.note_tags (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_note_tag UNIQUE (note_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own note_tags (via note ownership)
CREATE POLICY "Users can view their own note_tags" ON public.note_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
  );

-- Users can create their own note_tags
CREATE POLICY "Users can create their own note_tags" ON public.note_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
  );

-- Users can update their own note_tags
CREATE POLICY "Users can update their own note_tags" ON public.note_tags
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
  );

-- Users can delete their own note_tags
CREATE POLICY "Users can delete their own note_tags" ON public.note_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON public.note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON public.note_tags(tag_id);

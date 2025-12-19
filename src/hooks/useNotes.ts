import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Note } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Helper to sync tags
async function syncTags(noteId: string, userId: string, tags: string[]) {
  if (!tags || tags.length === 0) {
    // If no tags, remove all existing associations
    await supabase.from('note_tags').delete().eq('note_id', noteId);
    return;
  }

  // 1. Ensure all tags exist in the `tags` table
  const tagIds: string[] = [];
  for (const tagName of tags) {
    // Normalized tag name
    const name = tagName.trim();

    // Try to find existing tag
    let { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name) // We rely on DB case-insensitive unique index or strict matching
      .single();

    if (!existingTag) {
      // Create new tag
      const { data: newTag, error } = await supabase
        .from('tags')
        .insert({ user_id: userId, name, color: '#3B82F6' })
        .select('id')
        .single();

      if (error) {
        // If error (race condition), try fetching again
        const { data: retryTag } = await supabase
          .from('tags')
          .select('id')
          .eq('user_id', userId)
          .eq('name', name)
          .single();
        if (retryTag) existingTag = retryTag;
      } else {
        existingTag = newTag;
      }
    }

    if (existingTag) {
      tagIds.push(existingTag.id);
    }
  }

  // 2. Sync associations in `note_tags`
  // Get existing associations
  const { data: existingLinks } = await supabase
    .from('note_tags')
    .select('tag_id')
    .eq('note_id', noteId);

  const existingTagIds = existingLinks?.map(l => l.tag_id) || [];

  // Tags to add
  const toAdd = tagIds.filter(id => !existingTagIds.includes(id));
  // Tags to remove
  const toRemove = existingTagIds.filter(id => !tagIds.includes(id));

  if (toRemove.length > 0) {
    await supabase
      .from('note_tags')
      .delete()
      .eq('note_id', noteId)
      .in('tag_id', toRemove);
  }

  if (toAdd.length > 0) {
    await supabase
      .from('note_tags')
      .insert(toAdd.map(tagId => ({ note_id: noteId, tag_id: tagId })));
  }
}

export const useNotes = () => {
  return useQuery({
    queryKey: ['notes'],
    queryFn: async (): Promise<Note[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          note_tags (
            tags (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map(note => ({
        id: note.id,
        userId: note.user_id,
        title: note.title,
        content: note.content,
        isPinned: note.is_pinned,
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at),
        tags: note.note_tags?.map((nt: any) => nt.tags?.name).filter(Boolean) || []
      }));
    },
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: note.title,
          content: note.content,
          is_pinned: note.isPinned,
        })
        .select()
        .single();

      if (error) throw error;

      // Sync tags if provided
      if (note.tags) {
        await syncTags(data.id, user.id, note.tags);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Note> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser(); // Need user id for tag sync
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notes')
        .update({
          title: updates.title,
          content: updates.content,
          is_pinned: updates.isPinned,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Sync tags if provided
      if (updates.tags) {
        await syncTags(id, user.id, updates.tags);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    },
  });
};
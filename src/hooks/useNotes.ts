
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Note } from '@/types';
import { notesRepo } from '@/lib/notes/notesRepo';
import { useMutation } from '@/hooks/useMutation';

export const useNotes = () => {
  return useQuery({
    queryKey: ['notes'],
    queryFn: async (): Promise<Note[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      return notesRepo.getNotes(user.id);
    },
  });
};

export const useCreateNote = () => {
  return useMutation(
    async (note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      return notesRepo.createNote(user.id, note);
    },
    {
      invalidateKeys: [['notes']],
      successMessage: "Note saved successfully",
      errorMessage: "Failed to save note"
    }
  );
};

export const useUpdateNote = () => {
  return useMutation(
    async ({ id, ...updates }: Partial<Note> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      return notesRepo.updateNote(user.id, { id, ...updates });
    },
    {
      invalidateKeys: [['notes']],
      successMessage: "Note saved successfully",
      errorMessage: "Failed to update note"
    }
  );
};

export const useDeleteNote = () => {
  return useMutation(
    async (id: string) => {
      return notesRepo.deleteNote(id);
    },
    {
      invalidateKeys: [['notes']],
      successMessage: "Note deleted successfully",
      errorMessage: "Failed to delete note"
    }
  );
};
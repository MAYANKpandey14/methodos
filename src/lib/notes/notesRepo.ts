
import { supabase } from '@/integrations/supabase/client';
import { Note } from '@/types';

// Helper to sync tags (extracted from original useNotes.ts)
async function syncTags(noteId: string, userId: string, tags: string[]) {
    if (!tags) return;

    // If empty array, remove all associations
    if (tags.length === 0) {
        await supabase.from('note_tags').delete().eq('note_id', noteId);
        return;
    }

    // 1. Ensure all tags exist in the `tags` table
    const tagIds: string[] = [];
    for (const tagName of tags) {
        const name = tagName.trim();

        // Try to find existing tag
        let { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('user_id', userId)
            .ilike('name', name)
            .maybeSingle();

        if (!existingTag) {
            // Create new tag
            const { data: newTag, error } = await supabase
                .from('tags')
                .insert({ user_id: userId, name: name.toLowerCase(), color: '#3B82F6' })
                .select('id')
                .single();

            if (error) {
                // If error (race condition), try fetching again
                const { data: retryTag } = await supabase
                    .from('tags')
                    .select('id')
                    .eq('user_id', userId)
                    .ilike('name', name)
                    .maybeSingle();
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

export const notesRepo = {
    async getNotes(userId: string): Promise<Note[]> {
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
            .eq('user_id', userId)
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

    async createNote(userId: string, note: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
        const { data, error } = await supabase
            .from('notes')
            .insert({
                user_id: userId,
                title: note.title,
                content: note.content,
                is_pinned: note.isPinned,
            })
            .select()
            .single();

        if (error) throw error;

        if (note.tags) {
            await syncTags(data.id, userId, note.tags);
        }

        // Return partial note data, caller might need to refetch to get everything perfectly or just trust the cache invalidation
        return data;
    },

    async updateNote(userId: string, { id, ...updates }: Partial<Note> & { id: string }) {
        const { data, error } = await supabase
            .from('notes')
            .update({
                title: updates.title,
                content: updates.content,
                is_pinned: updates.isPinned,
                updated_at: new Date().toISOString(), // Ensure updated_at is bumped
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (updates.tags) {
            await syncTags(id, userId, updates.tags);
        }

        return data;
    },

    async deleteNote(id: string) {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

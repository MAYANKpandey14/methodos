
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { sanitizeInput, validateTagName } from '@/utils/security';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagWithStats extends Tag {
  usage_count: number;
  last_used_at: string | null;
}

// Normalize tag name to match database function (capitalize first letter)
const normalizeTagName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

export const useTags = () => {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  return useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async () => {
      if (!user || !isAuthenticated) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tags')
        .select('id, name, color')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user && isAuthenticated,
  });
};

// Fetch tags with usage statistics using secure function
export const useTagsWithStats = () => {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  return useQuery({
    queryKey: ['tags-stats', user?.id],
    queryFn: async () => {
      if (!user || !isAuthenticated) throw new Error('User not authenticated');

      // Use the secure function instead of querying the view directly
      // This enforces proper access control at the database level
      const { data, error } = await supabase
        .rpc('get_user_tag_stats');

      if (error) throw error;
      return data as TagWithStats[];
    },
    enabled: !!user && isAuthenticated,
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useMutation({
    mutationFn: async (tagData: { name: string; color?: string }) => {
      if (!user || !isAuthenticated) throw new Error('User not authenticated');

      // Security: Validate and sanitize tag input
      const sanitizedName = sanitizeInput(tagData.name, 50);
      const nameValidation = validateTagName(sanitizedName);
      
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.error);
      }

      // Normalize the tag name (capitalize first letter)
      const normalizedName = normalizeTagName(sanitizedName);

      // Validate color if provided
      const color = tagData.color || '#3B82F6';
      if (!/^#[0-9A-F]{6}$/i.test(color)) {
        throw new Error('Invalid color format');
      }

      const { data, error } = await supabase
        .from('tags')
        .insert({
          user_id: user.id,
          name: normalizedName,
          color: color
        })
        .select()
        .single();

      if (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
          throw new Error('Tag already exists (case-insensitive)');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tags-stats'] });
    },
  });
};

// Delete a tag
export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return useMutation({
    mutationFn: async (tagId: string) => {
      if (!user || !isAuthenticated) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tags-stats'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

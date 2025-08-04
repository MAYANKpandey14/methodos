
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { sanitizeInput, validateTagName } from '@/utils/security';

interface Tag {
  id: string;
  name: string;
  color: string;
}

export const useTags = () => {
  const { user, isAuthenticated } = useAuthStore(state => ({ 
    user: state.user, 
    isAuthenticated: state.isAuthenticated 
  }));
  
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

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore(state => ({ 
    user: state.user, 
    isAuthenticated: state.isAuthenticated 
  }));

  return useMutation({
    mutationFn: async (tagData: { name: string; color?: string }) => {
      if (!user || !isAuthenticated) throw new Error('User not authenticated');

      // Security: Validate and sanitize tag input
      const sanitizedName = sanitizeInput(tagData.name, 50);
      const nameValidation = validateTagName(sanitizedName);
      
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.error);
      }

      // Validate color if provided
      const color = tagData.color || '#3B82F6';
      if (!/^#[0-9A-F]{6}$/i.test(color)) {
        throw new Error('Invalid color format');
      }

      const { data, error } = await supabase
        .from('tags')
        .insert({
          user_id: user.id,
          name: sanitizedName,
          color: color
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};

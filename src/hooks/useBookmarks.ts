import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bookmark } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useBookmarks = () => {
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: async (): Promise<Bookmark[]> => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(bookmark => ({
        ...bookmark,
        userId: bookmark.user_id,
        createdAt: new Date(bookmark.created_at),
        updatedAt: new Date(bookmark.updated_at),
      }));
    },
  });
};

export const useCreateBookmark = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (bookmark: Omit<Bookmark, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          title: bookmark.title,
          url: bookmark.url,
          description: bookmark.description,
          tags: bookmark.tags,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast({
        title: "Bookmark saved",
        description: "Your bookmark has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save bookmark. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateBookmark = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Bookmark> & { id: string }) => {
      const { data, error } = await supabase
        .from('bookmarks')
        .update({
          title: updates.title,
          url: updates.url,
          description: updates.description,
          tags: updates.tags,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast({
        title: "Bookmark updated",
        description: "Your bookmark has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteBookmark = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast({
        title: "Bookmark deleted",
        description: "Your bookmark has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete bookmark. Please try again.",
        variant: "destructive",
      });
    },
  });
};
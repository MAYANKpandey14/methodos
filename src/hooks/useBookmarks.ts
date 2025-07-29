import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bookmark } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { validateUrl, sanitizeInput } from '@/utils/security';

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

      // Validate URL
      if (!validateUrl(bookmark.url)) {
        throw new Error('Invalid or dangerous URL provided');
      }
      
      // Sanitize inputs
      const sanitizedBookmark = {
        title: sanitizeInput(bookmark.title, 200),
        url: bookmark.url, // URL is already validated
        description: bookmark.description ? sanitizeInput(bookmark.description, 1000) : undefined,
        tags: bookmark.tags?.map(tag => sanitizeInput(tag, 50)).slice(0, 10) || [],
      };

      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          ...sanitizedBookmark,
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
      // Validate URL if provided
      if (updates.url && !validateUrl(updates.url)) {
        throw new Error('Invalid or dangerous URL provided');
      }
      
      // Sanitize inputs
      const sanitizedUpdates = {
        title: updates.title ? sanitizeInput(updates.title, 200) : undefined,
        url: updates.url, // URL is already validated
        description: updates.description ? sanitizeInput(updates.description, 1000) : undefined,
        tags: updates.tags?.map(tag => sanitizeInput(tag, 50)).slice(0, 10),
      };
      
      const { data, error } = await supabase
        .from('bookmarks')
        .update(sanitizedUpdates)
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
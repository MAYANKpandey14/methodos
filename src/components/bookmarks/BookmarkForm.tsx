import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useCreateBookmark, useUpdateBookmark } from '@/hooks/useBookmarks';
import { Bookmark } from '@/types';

const bookmarkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Please enter a valid URL'),
  description: z.string().optional(),
});

type BookmarkFormData = z.infer<typeof bookmarkSchema>;

interface BookmarkFormProps {
  bookmark?: Bookmark;
  onSuccess: () => void;
}

export function BookmarkForm({ bookmark, onSuccess }: BookmarkFormProps) {
  const [tags, setTags] = useState<string[]>(bookmark?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const createBookmark = useCreateBookmark();
  const updateBookmark = useUpdateBookmark();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookmarkFormData>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: {
      title: bookmark?.title || '',
      url: bookmark?.url || '',
      description: bookmark?.description || '',
    },
  });

  // Auto-fetch title from URL
  const fetchPageTitle = async (url: string) => {
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      const title = doc.querySelector('title')?.textContent;
      if (title && !bookmark) {
        setValue('title', title.trim());
      }
    } catch (error) {
      // Silently fail - user can manually enter title
    }
  };

  const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const url = e.target.value;
    if (url && !bookmark) {
      fetchPageTitle(url);
    }
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: BookmarkFormData) => {
    const bookmarkData = {
      title: data.title,
      url: data.url,
      description: data.description,
      tags,
    };

    if (bookmark) {
      await updateBookmark.mutateAsync({ id: bookmark.id, ...bookmarkData });
    } else {
      await createBookmark.mutateAsync(bookmarkData);
    }
    
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com"
          {...register('url')}
          onBlur={handleUrlBlur}
        />
        {errors.url && (
          <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Enter bookmark title"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Add a description..."
          rows={3}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="Type a tag and press Enter"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : bookmark ? 'Update' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
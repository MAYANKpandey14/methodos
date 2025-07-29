import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Eye, Edit3, Pin } from 'lucide-react';
import { useCreateNote, useUpdateNote } from '@/hooks/useNotes';
import { useDebounce } from '@/hooks/useDebounce';
import { Note } from '@/types';

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string(),
  isPinned: z.boolean().default(false),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface NoteEditorProps {
  note?: Note;
  onSuccess: () => void;
}

export function NoteEditor({ note, onSuccess }: NoteEditorProps) {
  const [activeTab, setActiveTab] = useState('edit');
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: note?.title || '',
      content: note?.content || '',
      isPinned: note?.isPinned || false,
    },
  });

  const content = watch('content');
  const isPinned = watch('isPinned');
  const debouncedContent = useDebounce(content, 1000);

  // Auto-save for existing notes
  useEffect(() => {
    if (note && debouncedContent !== note.content) {
      updateNote.mutate({
        id: note.id,
        content: debouncedContent,
      });
    }
  }, [debouncedContent, note, updateNote]);

  const onSubmit = async (data: NoteFormData) => {
    const noteData = {
      title: data.title,
      content: data.content,
      isPinned: data.isPinned,
    };

    if (note) {
      await updateNote.mutateAsync({ id: note.id, ...noteData });
    } else {
      await createNote.mutateAsync(noteData);
    }
    
    onSuccess();
  };

  // Simple markdown renderer
  const renderMarkdown = (text: string) => {
    return text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`(.*)`/gim, '<code>$1</code>')
      .replace(/\n/gim, '<br>');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Enter note title"
            {...register('title')}
          />
          {errors.title && (
            <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Pin className={`w-4 h-4 ${isPinned ? 'text-primary' : 'text-muted-foreground'}`} />
          <Switch
            checked={isPinned}
            onCheckedChange={(checked) => setValue('isPinned', checked)}
          />
          <Label className="text-sm">Pin note</Label>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="mt-4">
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your note in Markdown..."
              rows={15}
              {...register('content')}
              className="font-mono"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Supports Markdown: # Headers, **bold**, *italic*, `code`
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-4">
          <div className="border rounded-md p-4 min-h-[360px] prose prose-sm max-w-none">
            {content ? (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: renderMarkdown(content) 
                }} 
              />
            ) : (
              <div className="text-muted-foreground italic">
                No content to preview. Switch to Edit tab to start writing.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : note ? 'Update' : 'Save'}
        </Button>
      </div>
      
      {note && (
        <div className="text-xs text-muted-foreground text-center">
          Changes are auto-saved as you type
        </div>
      )}
    </form>
  );
}
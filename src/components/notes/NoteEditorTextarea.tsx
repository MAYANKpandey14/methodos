import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface NoteEditorTextareaProps {
  content: string;
  onContentChange: (content: string) => void;
}

export function NoteEditorTextarea({ content, onContentChange }: NoteEditorTextareaProps) {
  return (
    <div className="h-full flex flex-col">
      <Textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Start writing your note..."
        className="h-full resize-none border-0 rounded-none shadow-none focus-visible:ring-0 text-sm leading-relaxed font-mono"
        style={{ minHeight: '100%' }}
      />
    </div>
  );
}
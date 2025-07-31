import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { EnhancedNoteEditorTextarea } from './EnhancedNoteEditorTextarea';
import { EnhancedNoteEditorPreview } from './EnhancedNoteEditorPreview';

interface NoteEditorLayoutProps {
  content: string;
  onContentChange: (content: string) => void;
  viewMode: 'edit' | 'preview' | 'split';
  title: string;
  onSelectionChange?: (start: number, end: number) => void;
}

export function NoteEditorLayout({ 
  content, 
  onContentChange, 
  viewMode, 
  title,
  onSelectionChange
}: NoteEditorLayoutProps) {
  if (viewMode === 'edit') {
    return (
      <div className="h-full">
        <EnhancedNoteEditorTextarea
          content={content}
          onContentChange={onContentChange}
          onSelectionChange={onSelectionChange}
        />
      </div>
    );
  }

  if (viewMode === 'preview') {
    return (
      <div className="h-full">
        <EnhancedNoteEditorPreview
          content={content}
          title={title}
        />
      </div>
    );
  }

  // Split view
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={50} minSize={30}>
        <EnhancedNoteEditorTextarea
          content={content}
          onContentChange={onContentChange}
          onSelectionChange={onSelectionChange}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={30}>
        <EnhancedNoteEditorPreview
          content={content}
          title={title}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
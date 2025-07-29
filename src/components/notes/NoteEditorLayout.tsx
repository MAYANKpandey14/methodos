import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { NoteEditorTextarea } from './NoteEditorTextarea';
import { NoteEditorPreview } from './NoteEditorPreview';

interface NoteEditorLayoutProps {
  content: string;
  onContentChange: (content: string) => void;
  viewMode: 'edit' | 'preview' | 'split';
  title: string;
}

export function NoteEditorLayout({ 
  content, 
  onContentChange, 
  viewMode, 
  title 
}: NoteEditorLayoutProps) {
  if (viewMode === 'edit') {
    return (
      <div className="h-full">
        <NoteEditorTextarea
          content={content}
          onContentChange={onContentChange}
        />
      </div>
    );
  }

  if (viewMode === 'preview') {
    return (
      <div className="h-full">
        <NoteEditorPreview
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
        <NoteEditorTextarea
          content={content}
          onContentChange={onContentChange}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={30}>
        <NoteEditorPreview
          content={content}
          title={title}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
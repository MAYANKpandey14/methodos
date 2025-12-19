import React, { useState, useCallback } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { EnhancedNoteEditorTextarea } from './EnhancedNoteEditorTextarea';
import { MarkdownPreview } from './MarkdownPreview';

interface NoteEditorLayoutProps {
  content: string;
  onContentChange: (content: string) => void;
  viewMode: 'edit' | 'preview' | 'split';
  title: string;
  onSelectionChange?: (start: number, end: number) => void;
  onWikiLinkClick?: (noteTitle: string) => void;
  isTypewriterMode?: boolean;
}

export function NoteEditorLayout({
  content,
  onContentChange,
  viewMode,
  title,
  onSelectionChange,
  onWikiLinkClick,
  isTypewriterMode
}: NoteEditorLayoutProps) {
  const [editorScrollTop, setEditorScrollTop] = useState(0);
  const [previewScrollTop, setPreviewScrollTop] = useState(0);
  const [enableScrollSync, setEnableScrollSync] = useState(true);

  // Handle scroll synchronization between editor and preview
  const handleEditorScroll = useCallback((scrollTop: number, scrollHeight: number) => {
    if (enableScrollSync && viewMode === 'split') {
      const scrollRatio = scrollTop / scrollHeight;
      setPreviewScrollTop(scrollRatio);
    }
  }, [enableScrollSync, viewMode]);

  const handlePreviewScroll = useCallback((scrollTop: number, scrollHeight: number) => {
    if (enableScrollSync && viewMode === 'split') {
      const scrollRatio = scrollTop / scrollHeight;
      setEditorScrollTop(scrollRatio);
    }
  }, [enableScrollSync, viewMode]);

  if (viewMode === 'edit') {
    return (
      <div className="h-full">
        <EnhancedNoteEditorTextarea
          content={content}
          onContentChange={onContentChange}
          onSelectionChange={onSelectionChange}
          isTypewriterMode={isTypewriterMode}
        />
      </div>
    );
  }

  if (viewMode === 'preview') {
    return (
      <div className="h-full">
        <MarkdownPreview
          content={content}
          title={title}
          onWikiLinkClick={onWikiLinkClick}
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
          onScroll={handleEditorScroll}
          scrollSyncTarget={editorScrollTop}
          isTypewriterMode={isTypewriterMode}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={30}>
        <MarkdownPreview
          content={content}
          title={title}
          onScroll={handlePreviewScroll}
          scrollSyncTarget={previewScrollTop}
          className="border-l"
          onWikiLinkClick={onWikiLinkClick}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
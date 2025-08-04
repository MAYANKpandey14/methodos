import React, { useRef, useEffect, useState } from 'react';
import { markdownService } from '@/lib/markdown';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EnhancedNoteEditorPreviewProps {
  content: string;
  title: string;
}

export function EnhancedNoteEditorPreview({ content, title }: EnhancedNoteEditorPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!content.trim()) {
      setRenderedHtml('');
      return;
    }

    setIsLoading(true);
    markdownService.render(content)
      .then(html => {
        setRenderedHtml(html);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Failed to render markdown:', error);
        setRenderedHtml('<p class="text-red-500">Failed to render markdown</p>');
        setIsLoading(false);
      });
  }, [content]);

  // Get document statistics
  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharCount = (text: string): number => {
    return text.length;
  };

  const getReadingTime = (text: string): number => {
    const wordsPerMinute = 200;
    const words = getWordCount(text);
    return Math.ceil(words / wordsPerMinute);
  };

  const wordCount = getWordCount(content);
  const charCount = getCharCount(content);
  const readingTime = getReadingTime(content);

  return (
    <div className="h-full bg-background border-l flex flex-col">
      {/* Document Statistics */}
      <div className="border-b border-border p-4 bg-muted/30">
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span>{readingTime} min read</span>
        </div>
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-none">
          {title && (
            <h1 className="text-3xl font-bold mb-6 text-foreground">{title}</h1>
          )}
          
          {isLoading ? (
            <div className="text-muted-foreground">Rendering markdown...</div>
          ) : renderedHtml ? (
            <div 
              ref={previewRef}
              className="prose prose-slate dark:prose-invert max-w-none 
                         prose-headings:text-foreground prose-p:text-foreground 
                         prose-strong:text-foreground prose-code:text-foreground 
                         prose-blockquote:text-muted-foreground prose-li:text-foreground
                         prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                         prose-pre:bg-muted prose-pre:text-foreground
                         prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                         prose-table:border prose-th:border prose-td:border
                         prose-img:rounded-lg prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          ) : (
            <div className="text-muted-foreground italic">
              Start writing to see the preview...
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
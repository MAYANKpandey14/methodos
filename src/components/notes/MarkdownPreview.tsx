import React, { useEffect, useState, useRef, useCallback } from 'react';
import { markdownService } from '@/lib/markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logger } from '@/lib/logger';

interface MarkdownPreviewProps {
  content: string;
  title?: string;
  onScroll?: (scrollTop: number, scrollHeight: number) => void;
  scrollSyncTarget?: number;
  className?: string;
  onWikiLinkClick?: (noteTitle: string) => void;
}

export function MarkdownPreview({
  content,
  title,
  onScroll,
  scrollSyncTarget,
  className = "",
  onWikiLinkClick
}: MarkdownPreviewProps) {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Render markdown with caching and performance optimization
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
        logger.markdownError('Failed to render markdown in preview', error);
        setRenderedHtml('<p class="text-red-500">Failed to render markdown</p>');
        setIsLoading(false);
      });
  }, [content]);

  // Handle scroll synchronization
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (onScroll) {
      const target = event.target as HTMLDivElement;
      onScroll(target.scrollTop, target.scrollHeight);
    }
  }, [onScroll]);

  // Sync scroll position from external source
  useEffect(() => {
    if (scrollSyncTarget !== undefined && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (scrollElement) {
        scrollElement.scrollTop = scrollSyncTarget;
      }
    }
  }, [scrollSyncTarget]);

  // Handle click events for wiki links
  const handleContentClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const wikiLink = target.closest('[data-wikilink]');

    if (wikiLink && onWikiLinkClick) {
      event.preventDefault();
      const noteTitle = wikiLink.getAttribute('data-wikilink');
      if (noteTitle) {
        onWikiLinkClick(noteTitle);
      }
    }
  }, [onWikiLinkClick]);

  // Document statistics
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
    <div className={`h-full bg-background flex flex-col ${className}`}>
      {/* Document Statistics Header */}
      {content && (
        <div className="border-b border-border p-4 bg-muted/30">
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
            <span>{readingTime} min read</span>
          </div>
        </div>
      )}

      {/* Content Area */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1"
        onScrollCapture={handleScroll}
      >
        <div ref={contentRef} className="p-6 max-w-none">
          {title && (
            <h1 className="text-3xl font-bold mb-6 text-foreground">{title}</h1>
          )}

          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
              Rendering markdown...
            </div>
          ) : renderedHtml ? (
            <div
              onClick={handleContentClick}
              className="prose prose-slate dark:prose-invert max-w-none 
                         prose-headings:text-foreground prose-p:text-foreground 
                         prose-strong:text-foreground prose-code:text-foreground 
                         prose-blockquote:text-muted-foreground prose-li:text-foreground
                         prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                         prose-pre:bg-muted prose-pre:text-foreground prose-pre:border
                         prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                         prose-table:border prose-th:border prose-th:bg-muted prose-td:border
                         prose-img:rounded-lg prose-img:shadow-md prose-img:max-w-full
                         prose-hr:border-border prose-blockquote:border-l-primary
                         prose-ul:list-disc prose-ol:list-decimal"
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
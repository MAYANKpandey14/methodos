import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NoteEditorPreviewProps {
  content: string;
  title: string;
}

export function NoteEditorPreview({ content, title }: NoteEditorPreviewProps) {
  const renderMarkdown = (text: string) => {
    if (!text.trim()) return '';
    
    // Configure marked options for better rendering
    marked.setOptions({
      breaks: true, // Convert line breaks to <br>
      gfm: true, // GitHub Flavored Markdown
    });
    
    const rawHtml = marked(text) as string;
    return DOMPurify.sanitize(rawHtml);
  };

  return (
    <div className="h-full bg-background border-l">
      <ScrollArea className="h-full">
        <div className="p-6 max-w-none">
          {title && (
            <h1 className="text-3xl font-bold mb-6 text-foreground">{title}</h1>
          )}
          <div 
            className="prose prose-slate dark:prose-invert max-w-none 
                       prose-headings:text-foreground prose-p:text-foreground 
                       prose-strong:text-foreground prose-code:text-foreground 
                       prose-blockquote:text-muted-foreground prose-li:text-foreground
                       prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                       prose-pre:bg-muted prose-pre:text-foreground
                       prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                       prose-table:border prose-th:border prose-td:border
                       prose-img:rounded-lg prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
          {!content && (
            <div className="text-muted-foreground italic">
              Start writing to see the preview...
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
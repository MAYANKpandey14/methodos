import React, { useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ScrollArea } from '@/components/ui/scroll-area';
import Prism from 'prismjs';

// Import Prism themes and languages
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';

interface EnhancedNoteEditorPreviewProps {
  content: string;
  title: string;
}

export function EnhancedNoteEditorPreview({ content, title }: EnhancedNoteEditorPreviewProps) {
  const renderMarkdown = (text: string) => {
    if (!text.trim()) return '';
    
    // Configure marked for GitHub Flavored Markdown
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    // Custom renderer for code blocks with syntax highlighting
    const renderer = new marked.Renderer();
    
    renderer.code = function(token) {
      const code = token.text;
      const language = token.lang;
      if (language && Prism.languages[language]) {
        try {
          const highlighted = Prism.highlight(code, Prism.languages[language], language);
          return `<pre class="language-${language}"><code class="language-${language}">${highlighted}</code></pre>`;
        } catch (e) {
          console.warn('Syntax highlighting failed:', e);
        }
      }
      return `<pre><code>${code}</code></pre>`;
    };

    // Enhanced table rendering
    renderer.table = function(token) {
      const header = token.header.map(cell => `<th class="px-4 py-2 font-semibold">${cell.text}</th>`).join('');
      const body = token.rows.map(row => 
        `<tr class="border-b border-border hover:bg-muted/30">${row.map(cell => `<td class="px-4 py-2">${cell.text}</td>`).join('')}</tr>`
      ).join('');
      
      return `
        <div class="table-container overflow-x-auto">
          <table class="min-w-full border-collapse border border-border">
            <thead class="bg-muted/50">
              <tr>${header}</tr>
            </thead>
            <tbody>
              ${body}
            </tbody>
          </table>
        </div>
      `;
    };

    // Enhanced blockquote rendering
    renderer.blockquote = function(token) {
      return `
        <blockquote class="border-l-4 border-primary/30 pl-4 py-2 my-4 bg-muted/20 italic">
          ${token.text}
        </blockquote>
      `;
    };

    // Enhanced list rendering
    renderer.list = function(token) {
      const tag = token.ordered ? 'ol' : 'ul';
      const startAttr = token.ordered && token.start !== 1 ? ` start="${token.start}"` : '';
      const className = token.ordered ? 'list-decimal list-inside space-y-1' : 'list-disc list-inside space-y-1';
      return `<${tag} class="${className}"${startAttr}>\n${token.items.map(item => `<li>${item.text}</li>`).join('\n')}</${tag}>\n`;
    };

    marked.use({ renderer });
    
    const rawHtml = marked(text) as string;
    return DOMPurify.sanitize(rawHtml);
  };

  // Re-run Prism highlighting after content updates
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const getCharCount = (text: string) => {
    return text.length;
  };

  const getReadingTime = (text: string) => {
    const words = getWordCount(text);
    const readingTime = Math.ceil(words / 200); // Average reading speed: 200 WPM
    return readingTime;
  };

  return (
    <div className="h-full bg-background border-l flex flex-col">
      {/* Document Stats */}
      <div className="px-6 py-3 border-b bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>{getWordCount(content)} words</span>
          <span>{getCharCount(content)} characters</span>
          <span>{getReadingTime(content)} min read</span>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-none">
          {title && (
            <h1 className="text-3xl font-bold mb-6 text-foreground border-b pb-4">{title}</h1>
          )}
          <div 
            className="prose prose-slate dark:prose-invert max-w-none 
                       prose-headings:text-foreground prose-p:text-foreground 
                       prose-strong:text-foreground prose-code:text-foreground 
                       prose-blockquote:text-muted-foreground prose-li:text-foreground
                       prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                       prose-pre:bg-muted prose-pre:text-foreground prose-pre:border
                       prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                       prose-table:border prose-th:border prose-td:border
                       prose-img:rounded-lg prose-img:shadow-md prose-img:border
                       prose-hr:border-border prose-hr:my-8
                       prose-h1:border-b prose-h1:pb-2 prose-h1:mb-4
                       prose-h2:border-b prose-h2:pb-1 prose-h2:mb-3
                       prose-ol:space-y-1 prose-ul:space-y-1"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
          {!content && (
            <div className="text-muted-foreground italic text-center py-12">
              <div className="space-y-2">
                <p>Start writing to see the preview...</p>
                <p className="text-xs">Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+K for links</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
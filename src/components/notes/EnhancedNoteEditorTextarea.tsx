import React, { useRef, useCallback, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EnhancedNoteEditorTextareaProps {
  content: string;
  onContentChange: (content: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
  onScroll?: (scrollTop: number, scrollHeight: number) => void;
  scrollSyncTarget?: number;
}

export function EnhancedNoteEditorTextarea({ 
  content, 
  onContentChange, 
  onSelectionChange,
  onScroll,
  scrollSyncTarget 
}: EnhancedNoteEditorTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Handle scroll events for synchronization
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    if (onScroll) {
      const viewport = event.target as HTMLDivElement;
      const scrollElement = viewport.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (scrollElement) {
        onScroll(scrollElement.scrollTop, scrollElement.scrollHeight);
      }
    }
  }, [onScroll]);

  // Sync scroll position from external source
  useEffect(() => {
    if (scrollSyncTarget !== undefined && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (scrollElement) {
        scrollElement.scrollTop = scrollSyncTarget * scrollElement.scrollHeight;
      }
    }
  }, [scrollSyncTarget]);

  const handleSelectionChange = useCallback(() => {
    if (textareaRef.current && onSelectionChange) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      onSelectionChange(selectionStart, selectionEnd);
    }
  }, [onSelectionChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Only handle keyboard shortcuts with Ctrl/Cmd - avoid interfering with normal typing
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          insertMarkdownAtSelection('**', '**', 'bold text');
          break;
        case 'i':
          e.preventDefault();
          insertMarkdownAtSelection('*', '*', 'italic text');
          break;
        case 'k':
          e.preventDefault();
          insertMarkdownAtSelection('[', '](url)', 'link text');
          break;
        case '`':
          e.preventDefault();
          insertMarkdownAtSelection('`', '`', 'code');
          break;
      }
      return; // Early return to avoid other processing
    }

    // Tab handling for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      insertText('  '); // 2 spaces for indentation
      return;
    }

    // Enter key handling for smart list continuation
    if (e.key === 'Enter') {
      const { selectionStart } = textarea;
      const lines = content.slice(0, selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];
      
      // Check for numbered list
      const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)$/);
      if (numberedMatch) {
        const [, indent, number, text] = numberedMatch;
        if (text.trim() === '') {
          // Empty list item - remove it and exit list
          e.preventDefault();
          const newContent = content.slice(0, selectionStart - currentLine.length) + 
                           content.slice(selectionStart);
          onContentChange(newContent);
          setTimeout(() => {
            const newPos = selectionStart - currentLine.length;
            textarea.setSelectionRange(newPos, newPos);
          }, 0);
        } else {
          // Continue numbered list
          e.preventDefault();
          const nextNumber = parseInt(number) + 1;
          const continuation = `\n${indent}${nextNumber}. `;
          insertText(continuation);
        }
        return;
      }
      
      // Check for bullet list
      const bulletMatch = currentLine.match(/^(\s*)(-|\*|\+)\s(.*)$/);
      if (bulletMatch) {
        const [, indent, bullet, text] = bulletMatch;
        if (text.trim() === '') {
          // Empty list item - remove it and exit list
          e.preventDefault();
          const newContent = content.slice(0, selectionStart - currentLine.length) + 
                           content.slice(selectionStart);
          onContentChange(newContent);
          setTimeout(() => {
            const newPos = selectionStart - currentLine.length;
            textarea.setSelectionRange(newPos, newPos);
          }, 0);
        } else {
          // Continue bullet list
          e.preventDefault();
          const continuation = `\n${indent}${bullet} `;
          insertText(continuation);
        }
        return;
      }
      
      // Check for task list
      const taskMatch = currentLine.match(/^(\s*)(-|\*|\+)\s\[([ x])\]\s(.*)$/);
      if (taskMatch) {
        const [, indent, bullet, , text] = taskMatch;
        if (text.trim() === '') {
          // Empty task item - remove it and exit list
          e.preventDefault();
          const newContent = content.slice(0, selectionStart - currentLine.length) + 
                           content.slice(selectionStart);
          onContentChange(newContent);
          setTimeout(() => {
            const newPos = selectionStart - currentLine.length;
            textarea.setSelectionRange(newPos, newPos);
          }, 0);
        } else {
          // Continue task list
          e.preventDefault();
          const continuation = `\n${indent}${bullet} [ ] `;
          insertText(continuation);
        }
        return;
      }
    }

    // Auto-closing brackets and quotes - only when not holding modifier keys
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const { selectionStart, selectionEnd } = textarea;
      if (selectionStart === selectionEnd) {
        switch (e.key) {
          case '(':
            e.preventDefault();
            const parenContent = content.slice(0, selectionStart) + '()' + content.slice(selectionEnd);
            onContentChange(parenContent);
            setTimeout(() => textarea.setSelectionRange(selectionStart + 1, selectionStart + 1), 0);
            break;
          case '[':
            e.preventDefault();
            const bracketContent = content.slice(0, selectionStart) + '[]' + content.slice(selectionEnd);
            onContentChange(bracketContent);
            setTimeout(() => textarea.setSelectionRange(selectionStart + 1, selectionStart + 1), 0);
            break;
          case '{':
            e.preventDefault();
            const braceContent = content.slice(0, selectionStart) + '{}' + content.slice(selectionEnd);
            onContentChange(braceContent);
            setTimeout(() => textarea.setSelectionRange(selectionStart + 1, selectionStart + 1), 0);
            break;
          case '"':
            e.preventDefault();
            const quoteContent = content.slice(0, selectionStart) + '""' + content.slice(selectionEnd);
            onContentChange(quoteContent);
            setTimeout(() => textarea.setSelectionRange(selectionStart + 1, selectionStart + 1), 0);
            break;
          case "'":
            e.preventDefault();
            const apostropheContent = content.slice(0, selectionStart) + "''" + content.slice(selectionEnd);
            onContentChange(apostropheContent);
            setTimeout(() => textarea.setSelectionRange(selectionStart + 1, selectionStart + 1), 0);
            break;
        }
      }
    }
  }, [content, onContentChange]);

  const insertText = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const newContent = content.slice(0, selectionStart) + text + content.slice(selectionEnd);
    onContentChange(newContent);

    // Set cursor position after the inserted text
    setTimeout(() => {
      const newCursorPos = selectionStart + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  }, [content, onContentChange]);

  const insertMarkdownAtSelection = useCallback((prefix: string, suffix: string, placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = content.slice(selectionStart, selectionEnd);
    
    // Check if the selected text already has this formatting
    const hasFormatting = selectedText.startsWith(prefix) && selectedText.endsWith(suffix);
    
    let newContent: string;
    let newSelectionStart: number;
    let newSelectionEnd: number;

    if (hasFormatting) {
      // Remove the formatting
      const unformattedText = selectedText.slice(prefix.length, -suffix.length);
      newContent = content.slice(0, selectionStart) + unformattedText + content.slice(selectionEnd);
      newSelectionStart = selectionStart;
      newSelectionEnd = selectionStart + unformattedText.length;
    } else {
      // Add the formatting
      const textToFormat = selectedText || placeholder;
      const formattedText = `${prefix}${textToFormat}${suffix}`;
      newContent = content.slice(0, selectionStart) + formattedText + content.slice(selectionEnd);
      
      if (selectedText) {
        // Keep the original text selected (without the formatting markers)
        newSelectionStart = selectionStart + prefix.length;
        newSelectionEnd = selectionStart + prefix.length + selectedText.length;
      } else {
        // Select the placeholder text
        newSelectionStart = selectionStart + prefix.length;
        newSelectionEnd = selectionStart + prefix.length + placeholder.length;
      }
    }
    
    onContentChange(newContent);

    // Set cursor/selection position
    setTimeout(() => {
      textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
      textarea.focus();
    }, 0);
  }, [content, onContentChange]);

  // Expose methods for toolbar and external use
  useEffect(() => {
    if (textareaRef.current) {
      (textareaRef.current as any).insertMarkdown = insertMarkdownAtSelection;
      (textareaRef.current as any).insertText = insertText;
      (textareaRef.current as any).getSelectedText = () => {
        const { selectionStart, selectionEnd } = textareaRef.current!;
        return content.slice(selectionStart, selectionEnd);
      };
      (textareaRef.current as any).getSelection = () => {
        const { selectionStart, selectionEnd } = textareaRef.current!;
        return { start: selectionStart, end: selectionEnd };
      };
    }
  }, [insertMarkdownAtSelection, insertText, content]);

  return (
    <ScrollArea 
      ref={scrollAreaRef}
      className="h-full" 
      onScrollCapture={handleScroll}
    >
      <div className="min-h-full p-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onSelect={handleSelectionChange}
          onKeyDown={handleKeyDown}
          placeholder="Start writing your note..."
          className="w-full min-h-[calc(100vh-300px)] resize-none border-0 bg-transparent focus:outline-none focus:ring-0 text-sm leading-relaxed font-mono"
          style={{ minHeight: 'calc(100vh - 300px)' }}
        />
      </div>
    </ScrollArea>
  );
}
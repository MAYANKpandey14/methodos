import React, { useRef, useCallback, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface EnhancedNoteEditorTextareaProps {
  content: string;
  onContentChange: (content: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
}

export function EnhancedNoteEditorTextarea({ 
  content, 
  onContentChange, 
  onSelectionChange 
}: EnhancedNoteEditorTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    // Auto-closing brackets and quotes - only when not holding modifier keys
    if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const { selectionStart, selectionEnd } = textarea;
      if (selectionStart === selectionEnd) {
        switch (e.key) {
          case '(':
            e.preventDefault();
            insertText('()');
            textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
            break;
          case '[':
            e.preventDefault();
            insertText('[]');
            textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
            break;
          case '{':
            e.preventDefault();
            insertText('{}');
            textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
            break;
          case '"':
            e.preventDefault();
            insertText('""');
            textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
            break;
          case "'":
            e.preventDefault();
            insertText("''");
            textarea.setSelectionRange(selectionStart + 1, selectionStart + 1);
            break;
        }
      }
    }
  }, []);

  const insertText = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const newContent = content.slice(0, selectionStart) + text + content.slice(selectionEnd);
    onContentChange(newContent);

    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.setSelectionRange(selectionStart + text.length, selectionStart + text.length);
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
    <div className="h-full flex flex-col">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        onSelect={handleSelectionChange}
        onKeyDown={handleKeyDown}
        placeholder="Start writing your note..."
        className="h-full resize-none border-0 rounded-none shadow-none focus-visible:ring-0 text-sm leading-relaxed font-mono"
        style={{ minHeight: '100%' }}
      />
    </div>
  );
}
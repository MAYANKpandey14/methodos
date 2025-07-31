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

    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
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
    }

    // Auto-closing brackets and quotes
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

    // Tab handling for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      insertText('  '); // 2 spaces for indentation
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
    const textToInsert = selectedText || placeholder;
    const markdownText = `${prefix}${textToInsert}${suffix}`;
    
    const newContent = content.slice(0, selectionStart) + markdownText + content.slice(selectionEnd);
    onContentChange(newContent);

    // Set cursor position
    setTimeout(() => {
      if (selectedText) {
        textarea.setSelectionRange(selectionStart + prefix.length, selectionStart + prefix.length + selectedText.length);
      } else {
        textarea.setSelectionRange(selectionStart + prefix.length, selectionStart + prefix.length + placeholder.length);
      }
      textarea.focus();
    }, 0);
  }, [content, onContentChange]);

  // Expose methods for toolbar to use
  useEffect(() => {
    if (textareaRef.current) {
      (textareaRef.current as any).insertMarkdown = insertMarkdownAtSelection;
      (textareaRef.current as any).insertText = insertText;
    }
  }, [insertMarkdownAtSelection, insertText]);

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
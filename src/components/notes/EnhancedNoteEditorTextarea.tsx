import React, { useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SlashCommandMenu } from './SlashCommandMenu';
import { TableControls } from './TableControls';
import { getCaretCoordinates } from '@/utils/caretCoordinates';
import { isCursorInTable, processTableAction } from '@/utils/tableUtils';

export interface NoteEditorHandle {
  insertMarkdown: (prefix: string, suffix: string, placeholder: string) => void;
  insertText: (text: string) => void;
  getSelectedText: () => string;
  getSelection: () => { start: number; end: number };
}

interface EnhancedNoteEditorTextareaProps {
  content: string;
  onContentChange: (content: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
  onScroll?: (scrollTop: number, scrollHeight: number) => void;
  scrollSyncTarget?: number;
  isTypewriterMode?: boolean;
}

export const EnhancedNoteEditorTextarea = forwardRef<NoteEditorHandle, EnhancedNoteEditorTextareaProps>(({
  content,
  onContentChange,
  onSelectionChange,
  onScroll,
  scrollSyncTarget,
  isTypewriterMode = false,
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showSlashMenu, setShowSlashMenu] = React.useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = React.useState({ top: 0, left: 0 });
  const [slashCommandIndex, setSlashCommandIndex] = React.useState<number | null>(null);
  const [showTableControls, setShowTableControls] = React.useState(false);
  const [tableControlsPosition, setTableControlsPosition] = React.useState({ top: 0, left: 0 });

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
    if (textareaRef.current) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      if (onSelectionChange) {
        onSelectionChange(selectionStart, selectionEnd);
      }

      // Typewriter Scrolling Logic
      if (isTypewriterMode) {
        const textarea = textareaRef.current;
        const coordinates = getCaretCoordinates(textarea, selectionStart);
        const viewportHeight = textarea.clientHeight;

        // Calculate target scroll position (center the caret)
        // coordinates.top is relative to the top of the content
        const targetScrollTop = coordinates.top - (viewportHeight / 2) + (parseInt(getComputedStyle(textarea).lineHeight) / 2);

        // Smooth scroll to position
        textarea.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }

      // Table Controls Logic
      if (isCursorInTable(textareaRef.current.value, selectionStart)) {
        const textarea = textareaRef.current;
        const coordinates = getCaretCoordinates(textarea, selectionStart);
        const rect = textarea.getBoundingClientRect();
        setTableControlsPosition({
          top: rect.top + coordinates.top - textarea.scrollTop,
          left: rect.left + coordinates.left - textarea.scrollLeft
        });
        setShowTableControls(true);
      } else {
        setShowTableControls(false);
      }
    }
  }, [onSelectionChange, isTypewriterMode]);

  const handleTableAction = useCallback((action: 'addRow' | 'addCol' | 'deleteRow' | 'deleteCol' | 'format') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart } = textarea;
    const newContent = processTableAction(content, selectionStart, action);
    onContentChange(newContent);
    // Keep focus
    setTimeout(() => textarea.focus(), 0);
  }, [content, onContentChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // ... Copy existing keyDown logic ...
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

    // Slash command trigger
    if (e.key === '/') {
      const { selectionStart } = textarea;
      // Only trigger if at start of line or preceded by whitespace
      const precedingChar = content.charAt(selectionStart - 1);
      if (selectionStart === 0 || /\s/.test(precedingChar)) {
        const coordinates = getCaretCoordinates(textarea, selectionStart);
        const rect = textarea.getBoundingClientRect();

        setSlashMenuPosition({
          top: rect.top + coordinates.top - textarea.scrollTop,
          left: rect.left + coordinates.left - textarea.scrollLeft + 20, // Offset for visibility
        });
        setSlashCommandIndex(selectionStart);
        setShowSlashMenu(true);
        // Don't prevent default, let the '/' be typed so we can delete it later or let user see it
      }
    }
  }, [content, onContentChange]);

  const handleSlashCommandSelect = useCallback((command: string) => {
    // ... Copy existing slash command logic ...
    const textarea = textareaRef.current;
    if (!textarea || slashCommandIndex === null) return;

    setShowSlashMenu(false);

    // Calculate range to replace: from the slash to current position (if they kept typing in textarea, which they shouldn't since focus moves, but handle it anyway)
    // Actually, since focus moves to popover, the textarea content stays as ".... /"
    // So we just need to replace the "/" at slashCommandIndex.

    const { selectionStart } = textarea;
    // We want to remove the '/' that triggered this.
    // It should be at slashCommandIndex.

    const beforeSlash = content.slice(0, slashCommandIndex);
    const afterSlash = content.slice(slashCommandIndex + 1); // +1 to skip the '/'

    // We need to construct the new content based on command
    let insert = '';
    let cursorOffset = 0;

    switch (command) {
      case 'heading1': insert = '# '; break;
      case 'heading2': insert = '## '; break;
      case 'heading3': insert = '### '; break;
      case 'unordered-list': insert = '- '; break;
      case 'ordered-list': insert = '1. '; break;
      case 'task-list': insert = '- [ ] '; break;
      case 'blockquote': insert = '> '; break;
      case 'code-block':
        insert = '```\n\n```';
        cursorOffset = 4; // Position inside the block
        break;
      case 'table':
        insert = '| Col 1 | Col 2 |\n|---|---|\n| Val 1 | Val 2 |';
        break;
      case 'horizontal-rule': insert = '---\n'; break;
      case 'image':
        insert = '![Alt](url)';
        cursorOffset = 2;
        break;
      case 'link':
        insert = '[Link](url)';
        cursorOffset = 1;
        break;
    }

    const newContent = beforeSlash + insert + afterSlash;
    onContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      const newPos = slashCommandIndex + insert.length - (command === 'code-block' || command === 'image' || command === 'link' ? (insert.length - cursorOffset) : 0);
      textarea.setSelectionRange(newPos, newPos);
    }, 0);

    setSlashCommandIndex(null);
  }, [content, onContentChange, slashCommandIndex]);

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

  // Use useImperativeHandle instead of monkey patching
  useImperativeHandle(ref, () => ({
    insertMarkdown: insertMarkdownAtSelection,
    insertText: insertText,
    getSelectedText: () => {
      const textarea = textareaRef.current;
      if (!textarea) return '';
      const { selectionStart, selectionEnd } = textarea;
      return content.slice(selectionStart, selectionEnd);
    },
    getSelection: () => {
      const textarea = textareaRef.current;
      if (!textarea) return { start: 0, end: 0 };
      const { selectionStart, selectionEnd } = textarea;
      return { start: selectionStart, end: selectionEnd };
    }
  }));

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
        <SlashCommandMenu
          open={showSlashMenu}
          onOpenChange={(open) => {
            setShowSlashMenu(open);
            if (!open) {
              textareaRef.current?.focus();
            }
          }}
          onSelect={handleSlashCommandSelect}
          position={slashMenuPosition}
        />
        {showTableControls && (
          <TableControls
            position={tableControlsPosition}
            onAddRow={() => handleTableAction('addRow')}
            onAddCol={() => handleTableAction('addCol')}
            onDeleteRow={() => handleTableAction('deleteRow')}
            onDeleteCol={() => handleTableAction('deleteCol')}
            onFormat={() => handleTableAction('format')}
          />
        )}
      </div>
    </ScrollArea>
  );
});

EnhancedNoteEditorTextarea.displayName = 'EnhancedNoteEditorTextarea';
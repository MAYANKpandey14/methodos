import React from 'react';
import { 
  Bold, 
  Italic, 
  Heading, 
  Link, 
  Code, 
  List, 
  Quote,
  Table,
  Image,
  Strikethrough,
  ListOrdered,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface NoteEditorToolbarProps {
  onFormat: (format: string) => void;
}

export function NoteEditorToolbar({ onFormat }: NoteEditorToolbarProps) {
  const textFormatItems = [
    { icon: Bold, action: 'bold', tooltip: 'Bold (Ctrl+B)' },
    { icon: Italic, action: 'italic', tooltip: 'Italic (Ctrl+I)' },
    { icon: Strikethrough, action: 'strikethrough', tooltip: 'Strikethrough' },
    { icon: Code, action: 'code', tooltip: 'Inline Code' },
  ];

  const headingItems = [
    { icon: Heading1, action: 'h1', tooltip: 'Heading 1' },
    { icon: Heading2, action: 'h2', tooltip: 'Heading 2' },
    { icon: Heading3, action: 'h3', tooltip: 'Heading 3' },
  ];

  const listItems = [
    { icon: List, action: 'unordered-list', tooltip: 'Bullet List' },
    { icon: ListOrdered, action: 'ordered-list', tooltip: 'Numbered List' },
    { icon: CheckSquare, action: 'task-list', tooltip: 'Task List' },
  ];

  const insertItems = [
    { icon: Link, action: 'link', tooltip: 'Link' },
    { icon: Image, action: 'image', tooltip: 'Image' },
    { icon: Table, action: 'table', tooltip: 'Table' },
    { icon: Code2, action: 'code-block', tooltip: 'Code Block' },
    { icon: Quote, action: 'quote', tooltip: 'Quote' },
    { icon: Minus, action: 'hr', tooltip: 'Horizontal Rule' },
  ];

  return (
    <div className="border-b px-4 py-2 bg-muted/30 flex items-center gap-1 overflow-x-auto">
      {/* Text formatting */}
      {textFormatItems.map((item) => (
        <Button
          key={item.action}
          variant="ghost"
          size="sm"
          onClick={() => onFormat(item.action)}
          title={item.tooltip}
          className="h-8 w-8 p-0"
        >
          <item.icon className="w-4 h-4" />
        </Button>
      ))}
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      {/* Headings */}
      {headingItems.map((item) => (
        <Button
          key={item.action}
          variant="ghost"
          size="sm"
          onClick={() => onFormat(item.action)}
          title={item.tooltip}
          className="h-8 w-8 p-0"
        >
          <item.icon className="w-4 h-4" />
        </Button>
      ))}
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      {/* Lists */}
      {listItems.map((item) => (
        <Button
          key={item.action}
          variant="ghost"
          size="sm"
          onClick={() => onFormat(item.action)}
          title={item.tooltip}
          className="h-8 w-8 p-0"
        >
          <item.icon className="w-4 h-4" />
        </Button>
      ))}
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      {/* Insert items */}
      {insertItems.map((item) => (
        <Button
          key={item.action}
          variant="ghost"
          size="sm"
          onClick={() => onFormat(item.action)}
          title={item.tooltip}
          className="h-8 w-8 p-0"
        >
          <item.icon className="w-4 h-4" />
        </Button>
      ))}
    </div>
  );
}
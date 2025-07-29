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
  Strikethrough
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface NoteEditorToolbarProps {
  onFormat: (format: string) => void;
}

export function NoteEditorToolbar({ onFormat }: NoteEditorToolbarProps) {
  const toolbarItems = [
    { icon: Bold, action: 'bold', tooltip: 'Bold (Ctrl+B)' },
    { icon: Italic, action: 'italic', tooltip: 'Italic (Ctrl+I)' },
    { icon: Strikethrough, action: 'strikethrough', tooltip: 'Strikethrough' },
    { icon: Code, action: 'code', tooltip: 'Inline Code' },
  ];

  const structureItems = [
    { icon: Heading, action: 'heading', tooltip: 'Heading' },
    { icon: List, action: 'list', tooltip: 'Bullet List' },
    { icon: Quote, action: 'quote', tooltip: 'Quote' },
    { icon: Link, action: 'link', tooltip: 'Link' },
  ];

  return (
    <div className="border-b px-4 py-2 bg-muted/30 flex items-center gap-1 overflow-x-auto">
      {/* Text formatting */}
      {toolbarItems.map((item) => (
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
      
      {/* Structure */}
      {structureItems.map((item) => (
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
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Code,
  Link,
  Image,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Table,
  Minus,
  CheckSquare,
  Eye,
  EyeOff,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MoreHorizontal,
  Search,
  Hash,
  BarChart3
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface EnhancedNoteEditorToolbarProps {
  onFormat: (format: string) => void;
  onInsertImage?: () => void;
  onTogglePreview?: () => void;
  onToggleFindReplace?: () => void;
  onToggleOutline?: () => void;
  onToggleStats?: () => void;
  showPreview?: boolean;
  isMobile?: boolean;
}

interface ToolbarItem {
  icon: React.ComponentType<any>;
  action: string;
  tooltip: string;
  shortcut?: string;
  category: 'format' | 'insert' | 'structure' | 'advanced';
}

export function EnhancedNoteEditorToolbar({ 
  onFormat, 
  onInsertImage, 
  onTogglePreview,
  onToggleFindReplace,
  onToggleOutline,
  onToggleStats,
  showPreview = false,
  isMobile = false
}: EnhancedNoteEditorToolbarProps) {
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  const toolbarItems: ToolbarItem[] = [
    // Text formatting
    { icon: Bold, action: 'bold', tooltip: 'Bold', shortcut: 'Ctrl+B', category: 'format' },
    { icon: Italic, action: 'italic', tooltip: 'Italic', shortcut: 'Ctrl+I', category: 'format' },
    { icon: Underline, action: 'underline', tooltip: 'Underline', shortcut: 'Ctrl+U', category: 'format' },
    { icon: Strikethrough, action: 'strikethrough', tooltip: 'Strikethrough', category: 'format' },
    { icon: Code, action: 'inline-code', tooltip: 'Inline Code', shortcut: 'Ctrl+`', category: 'format' },
    
    // Headings and structure
    { icon: Heading1, action: 'heading1', tooltip: 'Heading 1', category: 'structure' },
    { icon: Heading2, action: 'heading2', tooltip: 'Heading 2', category: 'structure' },
    { icon: Heading3, action: 'heading3', tooltip: 'Heading 3', category: 'structure' },
    
    // Lists and organization
    { icon: List, action: 'unordered-list', tooltip: 'Bullet List', category: 'structure' },
    { icon: ListOrdered, action: 'ordered-list', tooltip: 'Numbered List', category: 'structure' },
    { icon: CheckSquare, action: 'task-list', tooltip: 'Task List', category: 'structure' },
    { icon: Quote, action: 'blockquote', tooltip: 'Blockquote', category: 'structure' },
    
    // Insert elements
    { icon: Link, action: 'link', tooltip: 'Insert Link', shortcut: 'Ctrl+K', category: 'insert' },
    { icon: Image, action: 'image', tooltip: 'Insert Image', category: 'insert' },
    { icon: Table, action: 'table', tooltip: 'Insert Table', category: 'insert' },
    { icon: Minus, action: 'horizontal-rule', tooltip: 'Horizontal Rule', category: 'insert' },
    
    // Advanced
    { icon: Code, action: 'code-block', tooltip: 'Code Block', category: 'advanced' },
  ];

  const primaryItems = toolbarItems.filter(item => 
    ['bold', 'italic', 'heading1', 'heading2', 'unordered-list', 'ordered-list', 'link', 'image'].includes(item.action)
  );

  const secondaryItems = toolbarItems.filter(item => 
    !primaryItems.some(primary => primary.action === item.action)
  );

  const handleAction = (action: string) => {
    if (action === 'image' && onInsertImage) {
      onInsertImage();
      return;
    }
    onFormat(action);
  };

  const renderToolbarItem = (item: ToolbarItem, isActive = false) => (
    <Tooltip key={item.action}>
      <TooltipTrigger asChild>
        <Button
          variant={isActive ? "default" : "ghost"}
          size="sm"
          onClick={() => handleAction(item.action)}
          className={`h-8 w-8 p-0 ${isActive ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <item.icon size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="flex flex-col items-center">
          <span>{item.tooltip}</span>
          {item.shortcut && <span className="text-muted-foreground">{item.shortcut}</span>}
        </div>
      </TooltipContent>
    </Tooltip>
  );

  if (isMobile) {
    return (
      <TooltipProvider>
        <div className="flex items-center justify-between p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center space-x-1 overflow-x-auto">
            {primaryItems.slice(0, 6).map(item => renderToolbarItem(item))}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {secondaryItems.map(item => (
                  <DropdownMenuItem key={item.action} onClick={() => handleAction(item.action)}>
                    <item.icon size={16} className="mr-2" />
                    <span>{item.tooltip}</span>
                    {item.shortcut && (
                      <span className="ml-auto text-xs text-muted-foreground">{item.shortcut}</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {onTogglePreview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePreview}
              className="h-8 w-8 p-0 ml-2"
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-1">
          {/* Text Formatting */}
          <div className="flex items-center space-x-1">
            {primaryItems.slice(0, 5).map(item => renderToolbarItem(item))}
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Headings */}
          <div className="flex items-center space-x-1">
            {renderToolbarItem(toolbarItems.find(item => item.action === 'heading1')!)}
            {renderToolbarItem(toolbarItems.find(item => item.action === 'heading2')!)}
            {renderToolbarItem(toolbarItems.find(item => item.action === 'heading3')!)}
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Lists */}
          <div className="flex items-center space-x-1">
            {renderToolbarItem(toolbarItems.find(item => item.action === 'unordered-list')!)}
            {renderToolbarItem(toolbarItems.find(item => item.action === 'ordered-list')!)}
            {renderToolbarItem(toolbarItems.find(item => item.action === 'task-list')!)}
            {renderToolbarItem(toolbarItems.find(item => item.action === 'blockquote')!)}
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Insert Elements */}
          <div className="flex items-center space-x-1">
            {renderToolbarItem(toolbarItems.find(item => item.action === 'link')!)}
            {renderToolbarItem(toolbarItems.find(item => item.action === 'image')!)}
            {renderToolbarItem(toolbarItems.find(item => item.action === 'table')!)}
            {renderToolbarItem(toolbarItems.find(item => item.action === 'code-block')!)}
          </div>
        </div>

        {onTogglePreview && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onTogglePreview}
                className="h-8 w-8 p-0"
              >
                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
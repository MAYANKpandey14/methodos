import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeadingItem {
  id: string;
  text: string;
  level: number;
  line: number;
}

interface DocumentOutlineProps {
  content: string;
  onHeadingClick?: (line: number) => void;
  className?: string;
}

export function DocumentOutline({ content, onHeadingClick, className }: DocumentOutlineProps) {
  const [isOpen, setIsOpen] = useState(true);

  const headings = useMemo(() => {
    const lines = content.split('\n');
    const headingItems: HeadingItem[] = [];
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        headingItems.push({
          id,
          text,
          level,
          line: index + 1
        });
      }
    });
    
    return headingItems;
  }, [content]);

  const handleHeadingClick = (line: number) => {
    onHeadingClick?.(line);
  };

  if (headings.length === 0) {
    return (
      <div className={cn("p-4 border rounded-lg bg-muted/50", className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Hash className="h-4 w-4" />
          <span>No headings found</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg bg-background", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-3 h-auto">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span className="font-medium">Document Outline</span>
              <span className="text-xs text-muted-foreground">({headings.length})</span>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <ScrollArea className="max-h-96">
            <div className="px-3 pb-3 space-y-1">
              {headings.map((heading) => (
                <Button
                  key={`${heading.id}-${heading.line}`}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left h-auto py-2 px-2 text-sm",
                    "hover:bg-muted/50"
                  )}
                  style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
                  onClick={() => handleHeadingClick(heading.line)}
                >
                  <span className="truncate" title={heading.text}>
                    {heading.text}
                  </span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
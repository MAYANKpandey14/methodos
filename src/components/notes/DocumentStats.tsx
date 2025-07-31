import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Hash, Type, Eye } from 'lucide-react';

interface DocumentStatsProps {
  content: string;
  title: string;
  className?: string;
}

export function DocumentStats({ content, title, className }: DocumentStatsProps) {
  const stats = useMemo(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const characters = content.length;
    const charactersNoSpaces = content.replace(/\s/g, '').length;
    const lines = content.split('\n').length;
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    
    // Count headings
    const headings = (content.match(/^#{1,6}\s/gm) || []).length;
    
    // Estimate reading time (average 200 words per minute)
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
    
    // Count different markdown elements
    const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
    const inlineCode = (content.match(/`[^`\n]+`/g) || []).length;
    const links = (content.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length;
    const images = (content.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length;
    const tables = (content.match(/\|.*\|/g) || []).length > 0 ? (content.match(/\|.*\|\n\|[-:\s\|]+\|/g) || []).length : 0;
    const lists = (content.match(/^[\s]*[-*+]\s/gm) || []).length + (content.match(/^[\s]*\d+\.\s/gm) || []).length;
    
    return {
      words,
      characters,
      charactersNoSpaces,
      lines,
      paragraphs,
      headings,
      readingTimeMinutes,
      codeBlocks,
      inlineCode,
      links,
      images,
      tables,
      lists
    };
  }, [content]);

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min read`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m read`;
  };

  return (
    <Card className={className}>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <h3 className="font-medium">Document Statistics</h3>
        </div>
        
        {/* Primary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-semibold text-primary">{stats.words.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Words</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-semibold text-primary">{stats.characters.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Characters</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-semibold text-primary">{stats.paragraphs.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Paragraphs</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-lg font-semibold text-primary">
              <Clock className="h-4 w-4" />
              {stats.readingTimeMinutes}
            </div>
            <div className="text-xs text-muted-foreground">Min Read</div>
          </div>
        </div>

        {/* Structure Stats */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Document Structure</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Headings
              </span>
              <Badge variant="secondary" className="text-xs">{stats.headings}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1">
                <Type className="h-3 w-3" />
                Lines
              </span>
              <Badge variant="secondary" className="text-xs">{stats.lines}</Badge>
            </div>
          </div>
        </div>

        {/* Content Elements */}
        {(stats.codeBlocks > 0 || stats.links > 0 || stats.images > 0 || stats.tables > 0 || stats.lists > 0) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Content Elements</h4>
            <div className="flex flex-wrap gap-2">
              {stats.codeBlocks > 0 && (
                <Badge variant="outline" className="text-xs">
                  Code blocks: {stats.codeBlocks}
                </Badge>
              )}
              {stats.inlineCode > 0 && (
                <Badge variant="outline" className="text-xs">
                  Inline code: {stats.inlineCode}
                </Badge>
              )}
              {stats.links > 0 && (
                <Badge variant="outline" className="text-xs">
                  Links: {stats.links}
                </Badge>
              )}
              {stats.images > 0 && (
                <Badge variant="outline" className="text-xs">
                  Images: {stats.images}
                </Badge>
              )}
              {stats.tables > 0 && (
                <Badge variant="outline" className="text-xs">
                  Tables: {stats.tables}
                </Badge>
              )}
              {stats.lists > 0 && (
                <Badge variant="outline" className="text-xs">
                  Lists: {stats.lists}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Detailed Stats */}
        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Characters (no spaces)</span>
            <span>{stats.charactersNoSpaces.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Reading time</span>
            <span>{formatReadingTime(stats.readingTimeMinutes)}</span>
          </div>
          {title && (
            <div className="flex justify-between">
              <span>Title length</span>
              <span>{title.length} chars</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
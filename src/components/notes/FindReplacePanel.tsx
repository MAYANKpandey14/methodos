import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Replace, X, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useHotkeys } from 'react-hotkeys-hook';

interface FindReplaceOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

interface FindReplaceResult {
  matches: number;
  currentMatch: number;
}

interface FindReplacePanelProps {
  content: string;
  onContentChange: (content: string) => void;
  onClose: () => void;
  onFindNext?: () => void;
  onFindPrevious?: () => void;
  className?: string;
}

export function FindReplacePanel({ 
  content, 
  onContentChange, 
  onClose,
  onFindNext,
  onFindPrevious,
  className 
}: FindReplacePanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<FindReplaceOptions>({
    caseSensitive: false,
    wholeWord: false,
    regex: false
  });
  const [result, setResult] = useState<FindReplaceResult>({ matches: 0, currentMatch: 0 });

  // Find matches in content
  const findMatches = useCallback(() => {
    if (!searchTerm) {
      setResult({ matches: 0, currentMatch: 0 });
      return [];
    }

    try {
      let pattern = searchTerm;
      let flags = 'g';

      if (!options.caseSensitive) {
        flags += 'i';
      }

      if (options.wholeWord && !options.regex) {
        pattern = `\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`;
      } else if (!options.regex) {
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

      const regex = new RegExp(pattern, flags);
      const matches = [...content.matchAll(regex)];
      
      setResult({ 
        matches: matches.length, 
        currentMatch: matches.length > 0 ? 1 : 0 
      });
      
      return matches;
    } catch (error) {
      // Invalid regex
      setResult({ matches: 0, currentMatch: 0 });
      return [];
    }
  }, [searchTerm, content, options]);

  // Replace single occurrence
  const handleReplace = useCallback(() => {
    if (!searchTerm || !replaceTerm) return;

    const matches = findMatches();
    if (matches.length === 0) return;

    // Replace first match
    const firstMatch = matches[0];
    const before = content.substring(0, firstMatch.index);
    const after = content.substring((firstMatch.index || 0) + firstMatch[0].length);
    const newContent = before + replaceTerm + after;
    
    onContentChange(newContent);
  }, [searchTerm, replaceTerm, content, onContentChange, findMatches]);

  // Replace all occurrences
  const handleReplaceAll = useCallback(() => {
    if (!searchTerm) return;

    try {
      let pattern = searchTerm;
      let flags = 'g';

      if (!options.caseSensitive) {
        flags += 'i';
      }

      if (options.wholeWord && !options.regex) {
        pattern = `\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`;
      } else if (!options.regex) {
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

      const regex = new RegExp(pattern, flags);
      const newContent = content.replace(regex, replaceTerm);
      
      onContentChange(newContent);
    } catch (error) {
      // Invalid regex - do nothing
    }
  }, [searchTerm, replaceTerm, content, onContentChange, options]);

  // Update matches when search term or options change
  useEffect(() => {
    findMatches();
  }, [findMatches]);

  // Keyboard shortcuts
  useHotkeys('ctrl+f', (e) => {
    e.preventDefault();
    // Focus is handled by parent component
  });

  useHotkeys('escape', (e) => {
    e.preventDefault();
    onClose();
  });

  useHotkeys('f3', (e) => {
    e.preventDefault();
    onFindNext?.();
  });

  useHotkeys('shift+f3', (e) => {
    e.preventDefault();
    onFindPrevious?.();
  });

  useHotkeys('ctrl+h', (e) => {
    e.preventDefault();
    setShowReplace(true);
  });

  return (
    <Card className={className}>
      <div className="p-4 space-y-3">
        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Find in document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-20"
              autoFocus
            />
            {result.matches > 0 && (
              <Badge variant="secondary" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs">
                {result.currentMatch}/{result.matches}
              </Badge>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onFindPrevious}
            disabled={result.matches === 0}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onFindNext}
            disabled={result.matches === 0}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Replace Input */}
        <Collapsible open={showReplace} onOpenChange={setShowReplace}>
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <Replace className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <span className="text-sm text-muted-foreground">Replace</span>
          </div>
          
          <CollapsibleContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Replace with..."
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleReplace}
                disabled={result.matches === 0}
              >
                Replace
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReplaceAll}
                disabled={result.matches === 0}
              >
                Replace All
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Options */}
        <Collapsible open={showOptions} onOpenChange={setShowOptions}>
          <CollapsibleContent className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="case-sensitive"
                  checked={options.caseSensitive}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, caseSensitive: !!checked }))
                  }
                />
                <label htmlFor="case-sensitive" className="text-sm">
                  Case sensitive
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whole-word"
                  checked={options.wholeWord}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, wholeWord: !!checked }))
                  }
                />
                <label htmlFor="whole-word" className="text-sm">
                  Whole word
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="regex"
                  checked={options.regex}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, regex: !!checked }))
                  }
                />
                <label htmlFor="regex" className="text-sm">
                  Regex
                </label>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
}
import { useState, useEffect, useCallback } from 'react';

interface SearchResult {
  matches: Array<{
    index: number;
    length: number;
    line: number;
    column: number;
    context: string;
  }>;
  currentMatch: number;
  total: number;
}

interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
}

export function useDebounceSearch(
  content: string,
  searchTerm: string,
  options: SearchOptions = {},
  delay: number = 300
) {
  const [result, setResult] = useState<SearchResult>({
    matches: [],
    currentMatch: 0,
    total: 0
  });

  const findMatches = useCallback((term: string, text: string, opts: SearchOptions): SearchResult => {
    if (!term.trim()) {
      return { matches: [], currentMatch: 0, total: 0 };
    }

    try {
      let pattern = term;
      let flags = 'g';

      if (!opts.caseSensitive) {
        flags += 'i';
      }

      if (opts.wholeWord && !opts.regex) {
        pattern = `\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`;
      } else if (!opts.regex) {
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }

      const regex = new RegExp(pattern, flags);
      const lines = text.split('\n');
      const matches: SearchResult['matches'] = [];

      lines.forEach((line, lineIndex) => {
        let match;
        const lineRegex = new RegExp(pattern, flags);
        
        while ((match = lineRegex.exec(line)) !== null) {
          const globalIndex = lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0) + match.index;
          
          matches.push({
            index: globalIndex,
            length: match[0].length,
            line: lineIndex + 1,
            column: match.index + 1,
            context: line
          });

          // Prevent infinite loop for zero-length matches
          if (match[0].length === 0) {
            lineRegex.lastIndex++;
          }
        }
      });

      return {
        matches,
        currentMatch: matches.length > 0 ? 1 : 0,
        total: matches.length
      };
    } catch (error) {
      // Invalid regex
      return { matches: [], currentMatch: 0, total: 0 };
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newResult = findMatches(searchTerm, content, options);
      setResult(newResult);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, content, options, delay, findMatches]);

  const goToNext = useCallback(() => {
    setResult(prev => ({
      ...prev,
      currentMatch: prev.total > 0 ? (prev.currentMatch % prev.total) + 1 : 0
    }));
  }, []);

  const goToPrevious = useCallback(() => {
    setResult(prev => ({
      ...prev,
      currentMatch: prev.total > 0 ? ((prev.currentMatch - 2 + prev.total) % prev.total) + 1 : 0
    }));
  }, []);

  const getCurrentMatch = useCallback(() => {
    if (result.matches.length === 0 || result.currentMatch === 0) {
      return null;
    }
    return result.matches[result.currentMatch - 1];
  }, [result]);

  return {
    result,
    goToNext,
    goToPrevious,
    getCurrentMatch,
    hasMatches: result.total > 0
  };
}
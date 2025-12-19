import { marked, Marked, Renderer } from 'marked';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';
import katex from 'katex';
import mermaid from 'mermaid';
import { logger } from './logger';

// Import additional Prism language components
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import { CACHE_CONFIG } from './constants';

export interface FrontmatterData {
  title?: string;
  tags?: string[];
  pinned?: boolean;
  [key: string]: any;
}

export interface ParsedContent {
  content: string;
  frontmatter: FrontmatterData;
  hashtags: string[];
}

interface MarkdownCache {
  content: string;
  html: string;
  timestamp: number;
}

interface MarkdownOptions {
  enableMath?: boolean;
  enableDiagrams?: boolean;
  enableSyntaxHighlighting?: boolean;
  maxCacheSize?: number;
  cacheTimeout?: number;
}

class MarkdownService {
  private cache: Map<string, MarkdownCache> = new Map();
  private marked: Marked;
  private options: Required<MarkdownOptions>;

  constructor(options: MarkdownOptions = {}) {
    this.options = {
      enableMath: true,
      enableDiagrams: true,
      enableSyntaxHighlighting: true,
      maxCacheSize: CACHE_CONFIG.MARKDOWN_MAX_SIZE,
      cacheTimeout: CACHE_CONFIG.MARKDOWN_TIMEOUT,
      ...options,
    };

    // Initialize mermaid
    if (this.options.enableDiagrams) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'strict',
      });
    }

    this.marked = this.createMarkedInstance();
  }

  private createMarkedInstance(): Marked {
    const instance = new Marked();

    // Configure basic options
    instance.use({
      gfm: true,
      breaks: true,
      pedantic: false,
    });

    // Create custom renderer
    const renderer = new Renderer();

    // Enhanced code block rendering with syntax highlighting
    renderer.code = (token) => {
      const { text: code, lang: language } = token;

      if (!this.options.enableSyntaxHighlighting || !language) {
        return `<pre class="bg-muted text-foreground p-4 rounded-lg overflow-x-auto"><code>${this.escapeHtml(code)}</code></pre>`;
      }

      // Handle mermaid diagrams
      if (this.options.enableDiagrams && language === 'mermaid') {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        return `<div class="mermaid" id="${id}" data-mermaid="${this.escapeHtml(code)}">${this.escapeHtml(code)}</div>`;
      }

      // Syntax highlighting for code
      if (Prism.languages[language]) {
        try {
          const highlighted = Prism.highlight(code, Prism.languages[language], language);
          return `<pre class="bg-muted text-foreground p-4 rounded-lg overflow-x-auto language-${language}"><code class="language-${language}">${highlighted}</code></pre>`;
        } catch (error) {
          logger.markdownWarn(`Syntax highlighting failed for language: ${language}`, error);
        }
      }

      return `<pre class="bg-muted text-foreground p-4 rounded-lg overflow-x-auto"><code class="language-${language}">${this.escapeHtml(code)}</code></pre>`;
    };

    // Enhanced table rendering
    renderer.table = (token) => {
      const header = token.header
        .map(cell => `<th class="border border-border px-4 py-2 bg-muted font-semibold text-left">${cell.text}</th>`)
        .join('');

      const body = token.rows
        .map(row => {
          const cells = row.map(cell => `<td class="border border-border px-4 py-2">${cell.text}</td>`).join('');
          return `<tr class="hover:bg-muted/50">${cells}</tr>`;
        })
        .join('');

      return `<div class="overflow-x-auto my-6">
        <table class="w-full border-collapse border border-border rounded-lg">
          <thead class="bg-muted">
            <tr>${header}</tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
    };

    // Enhanced blockquote rendering
    renderer.blockquote = (token) => {
      const text = token.text;
      return `<blockquote class="border-l-4 border-primary pl-6 py-2 my-6 bg-muted/30 italic text-muted-foreground">${text}</blockquote>`;
    };

    // Enhanced list rendering with task list support
    renderer.list = (token) => {
      const type = token.ordered ? 'ol' : 'ul';
      const start = token.start && token.start > 1 ? ` start="${token.start}"` : '';
      const className = token.ordered ? 'list-decimal' : 'list-disc';

      const body = token.items.map(item => {
        let itemText = item.text;

        // Handle task list items
        const taskMatch = itemText.match(/^\[([ x])\]\s+(.*)$/);
        if (taskMatch) {
          const [, checked, text] = taskMatch;
          const isChecked = checked === 'x';
          return `<li class="mb-2 flex items-start space-x-2 list-none">
            <input type="checkbox" ${isChecked ? 'checked' : ''} class="mt-1 rounded border-border" disabled />
            <span class="${isChecked ? 'line-through text-muted-foreground' : ''}">${text}</span>
          </li>`;
        }

        return `<li class="mb-2">${itemText}</li>`;
      }).join('');

      // For task lists, don't add list styling
      const hasTaskItems = token.items.some(item => /^\[([ x])\]\s+/.test(item.text));
      if (hasTaskItems) {
        return `<ul class="space-y-2 my-4 text-foreground">${body}</ul>`;
      }

      return `<${type}${start} class="${className} list-inside space-y-2 my-4 text-foreground">${body}</${type}>`;
    };

    // Enhanced heading rendering with anchor links
    renderer.heading = (token) => {
      const level = token.depth;
      const text = token.text;
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');

      const sizes = {
        1: 'text-4xl font-bold',
        2: 'text-3xl font-semibold',
        3: 'text-2xl font-semibold',
        4: 'text-xl font-semibold',
        5: 'text-lg font-semibold',
        6: 'text-base font-semibold'
      };

      const className = `${sizes[level as keyof typeof sizes]} text-foreground mt-8 mb-4 first:mt-0`;

      return `<h${level} id="${id}" class="${className}">
        <a href="#${id}" class="group flex items-center no-underline text-foreground hover:text-primary">
          ${text}
          <span class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">#</span>
        </a>
      </h${level}>`;
    };

    // Enhanced link rendering - ALL links open in new tabs
    renderer.link = (token) => {
      const href = token.href;
      const title = token.title ? ` title="${token.title}"` : '';
      const text = token.text;

      // Force ALL links to open in new tabs
      const target = ' target="_blank" rel="noopener noreferrer"';

      return `<a href="${href}"${title}${target} class="text-primary hover:underline">${text}</a>`;
    };

    // Enhanced image rendering
    renderer.image = (token) => {
      const src = token.href;
      const alt = token.text || '';
      const title = token.title ? ` title="${token.title}"` : '';

      return `<img src="${src}" alt="${alt}"${title} class="max-w-full h-auto rounded-lg shadow-md my-6" loading="lazy" />`;
    };

    instance.use({ renderer });

    return instance;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private parseMathExpressions(content: string): string {
    if (!this.options.enableMath) return content;

    // Parse inline math: $...$
    content = content.replace(/\$([^$\n]+)\$/g, (match, math) => {
      try {
        const rendered = katex.renderToString(math.trim(), {
          throwOnError: false,
          displayMode: false
        });
        return `<span class="katex-inline">${rendered}</span>`;
      } catch (error) {
        logger.markdownWarn('KaTeX inline rendering failed', error);
        return match;
      }
    });

    // Parse block math: $$...$$
    content = content.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
      try {
        const rendered = katex.renderToString(math.trim(), {
          throwOnError: false,
          displayMode: true
        });
        return `<div class="katex-block my-6">${rendered}</div>`;
      } catch (error) {
        logger.markdownWarn('KaTeX block rendering failed', error);
        return match;
      }
    });

    return content;
  }

  private parseWikiLinks(content: string): string {
    return content.replace(/\[\[([^|\]]+)(\|([^\]]+))?\]\]/g, (match, note, _, label) => {
      const display = label || note;
      return `<a href="#" data-wikilink="${note.trim()}" class="wiki-link text-primary font-medium hover:underline decoration-primary/50">${display.trim()}</a>`;
    });
  }

  parseFrontmatter(content: string): ParsedContent {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return { content, frontmatter: {}, hashtags: [] };
    }

    const yamlBlock = match[1];
    const frontmatter: FrontmatterData = {};

    // Simple YAML parser (since we don't want to add a heavy dependency like js-yaml just for this)
    yamlBlock.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join(':').trim();

        // Handle array syntax [a, b]
        if (value.startsWith('[') && value.endsWith(']')) {
          const arrayValues = value.slice(1, -1).split(',').map(v => v.trim());
          frontmatter[key] = arrayValues;
        } else if (value === 'true') {
          frontmatter[key] = true;
        } else if (value === 'false') {
          frontmatter[key] = false;
        } else {
          // Strip quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          frontmatter[key] = value;
        }
      }
    });

    const bodyContent = content.replace(frontmatterRegex, '');
    const hashtags = this.parseHashtags(bodyContent);

    return {
      content: bodyContent,
      frontmatter,
      hashtags
    };
  }

  private parseHashtags(content: string): string[] {
    const hashtags = new Set<string>();
    // Regex to match hashtags that are not part of a link or code
    // This is a simplified regex; detecting tags reliably in markdown complex without a full parser
    // For now we look for #tag preceded by whitespace or start of line
    const regex = /(?:^|\s)#([a-zA-Z0-9_]+)/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
      hashtags.add(match[1]);
    }

    return Array.from(hashtags);
  }

  private async renderMermaidDiagrams(): Promise<void> {
    if (!this.options.enableDiagrams) return;

    const mermaidElements = document.querySelectorAll('.mermaid[data-mermaid]');

    for (const element of mermaidElements) {
      const code = element.getAttribute('data-mermaid');
      if (!code) continue;

      try {
        const { svg } = await mermaid.render(element.id, code);
        element.innerHTML = svg;
        element.removeAttribute('data-mermaid');
      } catch (error) {
        logger.markdownWarn('Mermaid rendering failed', error);
        element.innerHTML = `<pre class="bg-muted text-foreground p-4 rounded-lg">${this.escapeHtml(code)}</pre>`;
      }
    }
  }

  private cleanZeroWidthCharacters(content: string): string {
    // Remove zero-width characters that can interfere with parsing
    return content.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, '');
  }

  private getCacheKey(content: string): string {
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private cleanCache(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.options.cacheTimeout) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));

    // If cache is still too large, remove oldest entries
    if (this.cache.size > this.options.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(0, this.cache.size - this.options.maxCacheSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  async render(content: string): Promise<string> {
    if (!content.trim()) return '';

    const cleanContent = this.cleanZeroWidthCharacters(content);
    const cacheKey = this.getCacheKey(cleanContent);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached.html;
    }

    // Clean cache periodically
    if (this.cache.size > this.options.maxCacheSize * 1.5) {
      this.cleanCache();
    }

    try {
      // Parse math expressions first
      let parsedContent = this.parseMathExpressions(cleanContent);

      // Parse wiki links
      parsedContent = this.parseWikiLinks(parsedContent);

      // Render markdown
      const rawHtml = this.marked.parse(parsedContent) as string;

      // Sanitize HTML
      const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ['mermaid'],
        ADD_ATTR: ['data-mermaid', 'id', 'data-wikilink'],
      });

      // Cache the result
      this.cache.set(cacheKey, {
        content: cleanContent,
        html: sanitizedHtml,
        timestamp: Date.now(),
      });

      // Render mermaid diagrams after DOM update
      setTimeout(() => this.renderMermaidDiagrams(), 0);

      return sanitizedHtml;
    } catch (error) {
      logger.markdownError('Async markdown rendering failed', error);
      return `<p class="text-red-500">Failed to render markdown</p>`;
    }
  }

  renderSync(content: string): string {
    if (!content.trim()) return '';

    const cleanContent = this.cleanZeroWidthCharacters(content);
    const cacheKey = this.getCacheKey(cleanContent);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached.html;
    }

    try {
      // Parse math expressions first
      let parsedContent = this.parseMathExpressions(cleanContent);

      // Parse wiki links
      parsedContent = this.parseWikiLinks(parsedContent);

      // Render markdown synchronously
      const rawHtml = this.marked.parse(parsedContent);

      // Sanitize HTML
      const sanitizedHtml = DOMPurify.sanitize(rawHtml as string, {
        ADD_TAGS: ['mermaid'],
        ADD_ATTR: ['data-mermaid', 'id', 'data-wikilink'],
      });

      // Cache the result
      this.cache.set(cacheKey, {
        content: cleanContent,
        html: sanitizedHtml,
        timestamp: Date.now(),
      });

      return sanitizedHtml;
    } catch (error) {
      logger.markdownError('Sync markdown rendering failed', error);
      return `<p class="text-red-500">Failed to render markdown</p>`;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.options.maxCacheSize,
      cacheTimeout: this.options.cacheTimeout,
    };
  }
}

// Create and export a default instance
export const markdownService = new MarkdownService();

// Export the class for custom instances
export { MarkdownService };
export type { MarkdownOptions };
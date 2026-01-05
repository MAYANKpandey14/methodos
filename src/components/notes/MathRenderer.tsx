import React, { useEffect, useRef } from 'react';

interface MathRendererProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

export function MathRenderer({ math, displayMode = false, className }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && math) {
      try {
        Promise.all([
          import('katex'),
          import('katex/dist/katex.min.css')
        ]).then(([{ default: katex }]) => {
          if (containerRef.current) {
            katex.render(math, containerRef.current, {
              displayMode,
              throwOnError: false,
              errorColor: '#cc0000',
              macros: {
                "\\RR": "\\mathbb{R}",
                "\\NN": "\\mathbb{N}",
                "\\ZZ": "\\mathbb{Z}",
                "\\QQ": "\\mathbb{Q}",
                "\\CC": "\\mathbb{C}",
              }
            });
          }
        });
      } catch (error) {
        if (containerRef.current) {
          containerRef.current.innerHTML = `<span style="color: #cc0000;">Math Error: ${math}</span>`;
        }
      }
    }
  }, [math, displayMode]);

  return <div ref={containerRef} className={className} />;
}

// Helper function to parse math expressions from markdown
export function parseMathExpressions(content: string): string {
  // Replace block math ($$...$$)
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    return `<div class="math-display" data-math="${encodeURIComponent(math.trim())}" data-display="true"></div>`;
  });

  // Replace inline math ($...$)
  content = content.replace(/\$([^$\n]+?)\$/g, (match, math) => {
    return `<span class="math-inline" data-math="${encodeURIComponent(math.trim())}" data-display="false"></span>`;
  });

  return content;
}

// Component to render math in HTML content
export function renderMathInElement(element: HTMLElement) {
  // Render display math
  const displayMathElements = element.querySelectorAll('.math-display');
  displayMathElements.forEach((el) => {
    const math = decodeURIComponent(el.getAttribute('data-math') || '');
    try {
      Promise.all([
        import('katex'),
        import('katex/dist/katex.min.css')
      ]).then(([{ default: katex }]) => {
        katex.render(math, el as HTMLElement, {
          displayMode: true,
          throwOnError: false,
          errorColor: '#cc0000',
        });
      });
    } catch (error) {
      (el as HTMLElement).innerHTML = `<span style="color: #cc0000;">Math Error: ${math}</span>`;
    }
  });

  // Render inline math
  const inlineMathElements = element.querySelectorAll('.math-inline');
  inlineMathElements.forEach((el) => {
    const math = decodeURIComponent(el.getAttribute('data-math') || '');
    try {
      Promise.all([
        import('katex'),
        import('katex/dist/katex.min.css')
      ]).then(([{ default: katex }]) => {
        katex.render(math, el as HTMLElement, {
          displayMode: false,
          throwOnError: false,
          errorColor: '#cc0000',
        });
      });
    } catch (error) {
      (el as HTMLElement).innerHTML = `<span style="color: #cc0000;">Math Error: ${math}</span>`;
    }
  });
}
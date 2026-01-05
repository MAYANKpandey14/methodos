import React, { useEffect, useRef, useState } from 'react';


interface DiagramRendererProps {
  code: string;
  className?: string;
}

export function DiagramRenderer({ code, className }: DiagramRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Initialize mermaid
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit',
      });
    });
  }, []);

  useEffect(() => {
    if (containerRef.current && code) {
      setIsError(false);

      // Clear previous content
      containerRef.current.innerHTML = '';

      // Generate unique ID for this diagram
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create a temporary div for rendering
      const tempDiv = document.createElement('div');
      tempDiv.id = id;

      import('mermaid').then(({ default: mermaid }) => {
        mermaid.render(id, code)
          .then((result) => {
            if (containerRef.current) {
              containerRef.current.innerHTML = result.svg;
            }
          })
          .catch((error) => {
            console.error('Mermaid rendering error:', error);
            setIsError(true);
            if (containerRef.current) {
              containerRef.current.innerHTML = `
                <div class="p-4 border-2 border-dashed border-destructive/50 rounded-lg bg-destructive/10 text-destructive">
                  <p class="font-medium">Diagram Error</p>
                  <p class="text-sm opacity-75">Invalid mermaid syntax</p>
                  <pre class="text-xs mt-2 opacity-60">${code}</pre>
                </div>
              `;
            }
          });
      });
    }
  }, [code]);

  return (
    <div
      ref={containerRef}
      className={`mermaid-diagram ${className || ''} ${isError ? 'error' : ''}`}
    />
  );
}

// Helper function to parse mermaid diagrams from markdown
export function parseMermaidDiagrams(content: string): string {
  // Replace mermaid code blocks
  return content.replace(/```mermaid\n([\s\S]*?)```/g, (match, code) => {
    return `<div class="mermaid-diagram-container" data-mermaid="${encodeURIComponent(code.trim())}"></div>`;
  });
}

// Component to render mermaid diagrams in HTML content
// Component to render mermaid diagrams in HTML content
export function renderMermaidInElement(element: HTMLElement) {
  const diagramElements = element.querySelectorAll('.mermaid-diagram-container');

  diagramElements.forEach((el, index) => {
    const code = decodeURIComponent(el.getAttribute('data-mermaid') || '');
    const id = `mermaid-container-${Date.now()}-${index}`;

    // Create container for the diagram
    const container = document.createElement('div');
    container.className = 'mermaid-diagram my-4';
    container.id = id;

    // Replace the placeholder with the container
    el.parentNode?.replaceChild(container, el);

    // Render the diagram
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.render(`mermaid-${id}`, code)
        .then((result) => {
          container.innerHTML = result.svg;
        })
        .catch((error) => {
          console.error('Mermaid rendering error:', error);
          container.innerHTML = `
            <div class="p-4 border-2 border-dashed border-destructive/50 rounded-lg bg-destructive/10 text-destructive">
              <p class="font-medium">Diagram Error</p>
              <p class="text-sm opacity-75">Invalid mermaid syntax</p>
              <pre class="text-xs mt-2 opacity-60">${code}</pre>
            </div>
          `;
        });
    });
  });
}
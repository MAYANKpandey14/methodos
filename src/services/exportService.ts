import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { markdownService } from '@/lib/markdown';

export interface ExportOptions {
  title?: string;
  format: 'pdf' | 'docx';
  includeTitle?: boolean;
  pageSize?: 'a4' | 'letter';
  margins?: number;
}

export class ExportService {
  static async exportToPDF(content: string, options: ExportOptions): Promise<void> {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: options.pageSize || 'a4'
      });

      const margin = options.margins || 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (margin * 2);

      let yPosition = margin;

      // Add title if provided
      if (options.includeTitle && options.title) {
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(options.title, margin, yPosition);
        yPosition += 15;
      }

      // Convert markdown to plain text with basic formatting
      const lines = content.split('\n');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');

      for (const line of lines) {
        if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        if (line.startsWith('# ')) {
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          pdf.text(line.substring(2), margin, yPosition);
          yPosition += 12;
        } else if (line.startsWith('## ')) {
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text(line.substring(3), margin, yPosition);
          yPosition += 10;
        } else if (line.startsWith('### ')) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(line.substring(4), margin, yPosition);
          yPosition += 8;
        } else if (line.trim()) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          
          // Handle basic text wrapping
          const splitText = pdf.splitTextToSize(line, contentWidth);
          pdf.text(splitText, margin, yPosition);
          yPosition += splitText.length * 6;
        } else {
          yPosition += 6;
        }
      }

      // Save the PDF
      const fileName = options.title ? `${options.title}.pdf` : 'note.pdf';
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('Failed to export PDF');
    }
  }

  static async exportToDOCX(content: string, options: ExportOptions): Promise<void> {
    try {
      const paragraphs: any[] = [];

      // Add title if provided
      if (options.includeTitle && options.title) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: options.title,
                bold: true,
                size: 32
              })
            ],
            heading: HeadingLevel.TITLE,
            spacing: { after: 300 }
          })
        );
      }

      // Process content line by line
      const lines = content.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('# ')) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line.substring(2), bold: true })],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 200 }
            })
          );
        } else if (line.startsWith('## ')) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line.substring(3), bold: true })],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 160, after: 160 }
            })
          );
        } else if (line.startsWith('### ')) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line.substring(4), bold: true })],
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 120, after: 120 }
            })
          );
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: line.substring(2) })],
              bullet: { level: 0 },
              spacing: { after: 100 }
            })
          );
        } else if (line.match(/^\d+\. /)) {
          const text = line.replace(/^\d+\. /, '');
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text })],
              numbering: { reference: "default-numbering", level: 0 },
              spacing: { after: 100 }
            })
          );
        } else if (line.trim()) {
          // Process inline formatting
          let processedText = line;
          const textRuns: TextRun[] = [];
          
          // Simple bold/italic processing
          const parts = processedText.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/);
          
          for (const part of parts) {
            if (part.startsWith('**') && part.endsWith('**')) {
              textRuns.push(new TextRun({ text: part.slice(2, -2), bold: true }));
            } else if (part.startsWith('*') && part.endsWith('*')) {
              textRuns.push(new TextRun({ text: part.slice(1, -1), italics: true }));
            } else if (part.startsWith('`') && part.endsWith('`')) {
              textRuns.push(new TextRun({ text: part.slice(1, -1), font: 'Courier New' }));
            } else if (part.trim()) {
              textRuns.push(new TextRun({ text: part }));
            }
          }
          
          if (textRuns.length > 0) {
            paragraphs.push(
              new Paragraph({
                children: textRuns,
                spacing: { after: 120 }
              })
            );
          }
        } else {
          // Empty line for spacing
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: "" })],
              spacing: { after: 120 }
            })
          );
        }
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = options.title ? `${options.title}.docx` : 'note.docx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('DOCX export failed:', error);
      throw new Error('Failed to export DOCX');
    }
  }

  static async print(content: string, title?: string): Promise<void> {
    try {
      const renderedContent = await markdownService.render(content);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Could not open print window. Please allow popups for this site.');
      }

      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${title || 'Note'}</title>
            <style>
              * {
                box-sizing: border-box;
              }
              
              @page {
                margin: 2cm;
                size: A4;
              }
              
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #000;
                background: #fff;
                margin: 0;
                padding: 20px;
                font-size: 12pt;
              }
              
              @media print {
                body {
                  padding: 0;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
              }
              
              h1, h2, h3, h4, h5, h6 {
                break-after: avoid;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                color: #000;
                font-weight: 600;
              }
              
              h1 { 
                font-size: 20pt; 
                border-bottom: 2px solid #000;
                padding-bottom: 0.5em;
              }
              h2 { 
                font-size: 16pt; 
                margin-top: 2em;
              }
              h3 { 
                font-size: 14pt; 
              }
              
              p, li {
                break-inside: avoid;
                margin-bottom: 0.5em;
              }
              
              code {
                background: #f5f5f5;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
              }
              
              pre {
                background: #f5f5f5;
                padding: 1em;
                border-radius: 5px;
                overflow-wrap: break-word;
                white-space: pre-wrap;
              }
              
              blockquote {
                border-left: 4px solid #ddd;
                padding-left: 1em;
                margin-left: 0;
                font-style: italic;
              }
              
              table {
                border-collapse: collapse;
                width: 100%;
                margin: 1em 0;
              }
              
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              
              th {
                background: #f5f5f5;
                font-weight: bold;
              }
              
              img {
                max-width: 100%;
                height: auto;
                break-inside: avoid;
              }
              
              .page-break {
                page-break-before: always;
              }
            </style>
          </head>
          <body>
            ${title ? `<h1 style="margin-top: 0;">${title}</h1>` : ''}
            ${renderedContent}
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          
          // Only close after print dialog is handled
          printWindow.onafterprint = () => {
            printWindow.close();
          };
          
          // Fallback: close after a delay if onafterprint doesn't fire
          setTimeout(() => {
            if (!printWindow.closed) {
              printWindow.close();
            }
          }, 1000);
        }, 100);
      };
    } catch (error) {
      console.error('Print failed:', error);
      throw new Error('Failed to print note');
    }
  }
}
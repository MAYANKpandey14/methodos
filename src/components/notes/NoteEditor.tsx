import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Eye, Edit3, Pin, Download, FileText, Printer } from 'lucide-react';
import { useCreateNote, useUpdateNote } from '@/hooks/useNotes';
import { useDebounce } from '@/hooks/useDebounce';
import { Note } from '@/types';
import { validateTaskTitle, validateTaskDescription } from '@/utils/security';

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  content: z.string().max(50000, 'Content must be 50,000 characters or less'),
  isPinned: z.boolean().default(false),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface NoteEditorProps {
  note?: Note;
  onSuccess: () => void;
}

export function NoteEditor({ note, onSuccess }: NoteEditorProps) {
  const [activeTab, setActiveTab] = useState('edit');
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: note?.title || '',
      content: note?.content || '',
      isPinned: note?.isPinned || false,
    },
  });

  const content = watch('content');
  const isPinned = watch('isPinned');
  const debouncedContent = useDebounce(content, 1000);

  // Auto-save for existing notes
  useEffect(() => {
    if (note && debouncedContent !== note.content) {
      updateNote.mutate({
        id: note.id,
        content: debouncedContent,
      });
    }
  }, [debouncedContent, note, updateNote]);

  const onSubmit = async (data: NoteFormData) => {
    // Validate input length and content
    const titleValidation = validateTaskTitle(data.title);
    const contentValidation = validateTaskDescription(data.content);
    
    if (!titleValidation.isValid) {
      throw new Error(titleValidation.error);
    }
    
    if (!contentValidation.isValid) {
      throw new Error(contentValidation.error);
    }
    
    const noteData = {
      title: data.title.trim(),
      content: data.content.trim(),
      isPinned: data.isPinned,
    };

    if (note) {
      await updateNote.mutateAsync({ id: note.id, ...noteData });
    } else {
      await createNote.mutateAsync(noteData);
    }
    
    onSuccess();
  };

  // Secure markdown renderer with sanitization
  const renderMarkdown = (text: string) => {
    try {
      // Configure marked options
      marked.setOptions({
        gfm: true,
        breaks: true,
      });
      
      const rawHtml = marked.parse(text) as string;
      
      // Sanitize HTML with DOMPurify
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote'],
        ALLOWED_ATTR: [],
        ALLOW_DATA_ATTR: false,
      });
      
      return cleanHtml;
    } catch (error) {
      console.error('Markdown rendering error:', error);
      return DOMPurify.sanitize(text.replace(/\n/g, '<br>'));
    }
  };

  // Export functions
  const exportToPDF = async () => {
    const content = watch('content');
    const title = watch('title');
    
    const pdf = new jsPDF();
    pdf.setFontSize(20);
    pdf.text(title, 20, 20);
    
    // Convert markdown to plain text for PDF
    const plainText = content.replace(/[#*`]/g, '').replace(/\n/g, '\n');
    const lines = pdf.splitTextToSize(plainText, 170);
    
    pdf.setFontSize(12);
    pdf.text(lines, 20, 40);
    pdf.save(`${title}.pdf`);
  };

  const exportToDocx = async () => {
    const content = watch('content');
    const title = watch('title');
    
    // Convert markdown to plain text
    const plainText = content.replace(/[#*`]/g, '');
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: plainText,
                size: 24,
              }),
            ],
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.docx`;
    link.click();
  };

  const handlePrint = () => {
    const content = watch('content');
    const title = watch('title');
    
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; margin-bottom: 20px; }
            .content { line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="content">${renderMarkdown(content)}</div>
        </body>
      </html>
    `;
    
    printWindow?.document.write(htmlContent);
    printWindow?.document.close();
    printWindow?.print();
  };

  return (
    <div className="h-full flex flex-col">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter note title"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Pin className={`w-4 h-4 ${isPinned ? 'text-primary' : 'text-muted-foreground'}`} />
            <Switch
              checked={isPinned}
              onCheckedChange={(checked) => setValue('isPinned', checked)}
            />
            <Label className="text-sm">Pin note</Label>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={exportToDocx}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export DOCX</span>
            <span className="sm:hidden">DOCX</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
            <span className="sm:hidden">Print</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="flex-1 flex flex-col">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your note in Markdown..."
                {...register('content')}
                className="font-mono flex-1 resize-none min-h-0"
              />
              <div className="text-xs text-muted-foreground mt-1 flex-shrink-0">
                Supports Markdown: # Headers, **bold**, *italic*, `code`
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="border rounded-md p-4 flex-1 prose prose-sm max-w-none overflow-y-auto">
              {content ? (
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: renderMarkdown(content) 
                  }} 
                />
              ) : (
                <div className="text-muted-foreground italic">
                  No content to preview. Switch to Edit tab to start writing.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 flex-shrink-0">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : note ? 'Update' : 'Save'}
          </Button>
        </div>
        
        {note && (
          <div className="text-xs text-muted-foreground text-center flex-shrink-0">
            Changes are auto-saved as you type
          </div>
        )}
      </form>
    </div>
  );
}
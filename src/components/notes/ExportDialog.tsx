import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExportService, ExportOptions } from '@/services/exportService';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Loader2 } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  defaultTitle?: string;
}

export function ExportDialog({ isOpen, onClose, content, defaultTitle = '' }: ExportDialogProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    title: '',
    format: 'pdf',
    includeTitle: true,
    pageSize: 'a4',
    margins: 20
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Update title when defaultTitle changes
  useEffect(() => {
    setExportOptions(prev => ({ ...prev, title: defaultTitle }));
  }, [defaultTitle]);

  const handleExport = async () => {
    if (!content.trim()) {
      toast({
        title: "Export Error",
        description: "Cannot export empty content",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      if (exportOptions.format === 'pdf') {
        await ExportService.exportToPDF(content, exportOptions);
        toast({
          title: "Export Successful",
          description: "PDF has been downloaded successfully"
        });
      } else if (exportOptions.format === 'docx') {
        await ExportService.exportToDOCX(content, exportOptions);
        toast({
          title: "Export Successful", 
          description: "DOCX file has been downloaded successfully"
        });
      } else if (exportOptions.format === 'md') {
        await ExportService.exportToMarkdown(content, exportOptions);
        toast({
          title: "Export Successful",
          description: "Markdown file has been downloaded successfully"
        });
      }
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An error occurred during export",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download size={20} />
            Export Note
          </DialogTitle>
          <DialogDescription>
            Choose your export format and options
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              value={exportOptions.title}
              onChange={(e) =>
                setExportOptions(prev => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter document title..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={exportOptions.format}
              onValueChange={(value: 'pdf' | 'docx' | 'md') =>
                setExportOptions(prev => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText size={16} />
                    PDF Document
                  </div>
                </SelectItem>
                <SelectItem value="docx">
                  <div className="flex items-center gap-2">
                    <FileText size={16} />
                    Word Document (DOCX)
                  </div>
                </SelectItem>
                <SelectItem value="md">
                  <div className="flex items-center gap-2">
                    <FileText size={16} />
                    Markdown (.md)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pageSize">Page Size</Label>
            <Select
              value={exportOptions.pageSize}
              onValueChange={(value: 'a4' | 'letter') =>
                setExportOptions(prev => ({ ...prev, pageSize: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4</SelectItem>
                <SelectItem value="letter">Letter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeTitle"
              checked={exportOptions.includeTitle}
              onCheckedChange={(checked) =>
                setExportOptions(prev => ({ ...prev, includeTitle: !!checked }))
              }
            />
            <Label htmlFor="includeTitle" className="text-sm">
              Include title in document
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {exportOptions.format === 'md' ? 'Markdown' : exportOptions.format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
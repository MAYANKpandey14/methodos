import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Download, Printer, Eye, Edit, Split } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotes, useCreateNote, useUpdateNote } from '@/hooks/useNotes';
import { useDebounce } from '@/hooks/useDebounce';
import { NoteEditorToolbar } from '@/components/notes/NoteEditorToolbar';
import { NoteEditorLayout } from '@/components/notes/NoteEditorLayout';
import { Note } from '@/types';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'edit' | 'preview' | 'split';

export default function NoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { data: notes = [] } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const isNewNote = id === 'new';
  const currentNote = isNewNote ? null : notes.find(note => note.id === id);

  // Debounced auto-save for existing notes
  const debouncedTitle = useDebounce(title, 2000);
  const debouncedContent = useDebounce(content, 2000);

  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
      setIsPinned(currentNote.isPinned);
    }
  }, [currentNote]);

  // Auto-save for existing notes
  useEffect(() => {
    if (!isNewNote && currentNote && (debouncedTitle || debouncedContent)) {
      if (debouncedTitle !== currentNote.title || debouncedContent !== currentNote.content) {
        handleAutoSave();
      }
    }
  }, [debouncedTitle, debouncedContent, isNewNote, currentNote]);

  const handleAutoSave = async () => {
    if (!currentNote || isSaving) return;
    
    setIsSaving(true);
    try {
      await updateNote.mutateAsync({
        id: currentNote.id,
        title: title || 'Untitled',
        content,
        isPinned,
      });
      setLastSaved(new Date());
    } catch (error) {
      // Silent fail for auto-save
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isNewNote) {
        await createNote.mutateAsync({
          title: title.trim(),
          content,
          isPinned,
        });
        navigate('/notes');
      } else if (currentNote) {
        await updateNote.mutateAsync({
          id: currentNote.id,
          title: title.trim(),
          content,
          isPinned,
        });
        setLastSaved(new Date());
        toast({
          title: "Note saved",
          description: "Your note has been saved successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/notes');
  };

  const insertMarkdown = (markdown: string) => {
    setContent(prev => prev + markdown);
  };

  const formatSelection = (format: string) => {
    switch (format) {
      case 'bold':
        insertMarkdown('**bold text**');
        break;
      case 'italic':
        insertMarkdown('*italic text*');
        break;
      case 'strikethrough':
        insertMarkdown('~~strikethrough text~~');
        break;
      case 'code':
        insertMarkdown('`inline code`');
        break;
      case 'h1':
        insertMarkdown('\n# Heading 1\n');
        break;
      case 'h2':
        insertMarkdown('\n## Heading 2\n');
        break;
      case 'h3':
        insertMarkdown('\n### Heading 3\n');
        break;
      case 'unordered-list':
        insertMarkdown('\n- List item\n- Another item\n');
        break;
      case 'ordered-list':
        insertMarkdown('\n1. First item\n2. Second item\n');
        break;
      case 'task-list':
        insertMarkdown('\n- [ ] Task item\n- [x] Completed task\n');
        break;
      case 'link':
        insertMarkdown('[link text](https://example.com)');
        break;
      case 'image':
        insertMarkdown('![alt text](image-url)');
        break;
      case 'table':
        insertMarkdown('\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n');
        break;
      case 'code-block':
        insertMarkdown('\n```\ncode block\n```\n');
        break;
      case 'quote':
        insertMarkdown('\n> This is a quote\n> It can span multiple lines\n');
        break;
      case 'hr':
        insertMarkdown('\n---\n');
        break;
      default:
        break;
    }
  };

  // Character and word count
  const charCount = content.length;
  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Back</span>
          </Button>
          
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="border-none shadow-none text-lg font-medium bg-transparent px-0 focus-visible:ring-0 flex-1 min-w-0"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View Mode Toggle */}
          <div className="hidden md:flex border rounded-md">
            <Button
              variant={viewMode === 'edit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('edit')}
              className="rounded-r-none"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'split' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('split')}
              className="rounded-none border-x"
            >
              <Split className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('preview')}
              className="rounded-l-none"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <NoteEditorToolbar onFormat={formatSelection} />

      {/* Editor Layout */}
      <div className="flex-1 overflow-hidden">
        <NoteEditorLayout
          content={content}
          onContentChange={setContent}
          viewMode={viewMode}
          title={title}
        />
      </div>

      {/* Status Bar */}
      <div className="border-t px-4 py-2 bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>{charCount} characters</span>
          <span>{wordCount} words</span>
          {!isNewNote && lastSaved && (
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          )}
          {isSaving && <span className="text-primary">Auto-saving...</span>}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Download, Printer, Eye, Edit, Split, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotes, useCreateNote, useUpdateNote } from '@/hooks/useNotes';
import { markdownService } from '@/lib/markdown';
import { useDebounce } from '@/hooks/useDebounce';
import { DEBOUNCE_TIMES } from '@/lib/constants';
import { useIsMobile } from '@/hooks/use-mobile';
import { EnhancedNoteEditorToolbar } from '@/components/notes/EnhancedNoteEditorToolbar';
import { NoteEditorLayout } from '@/components/notes/NoteEditorLayout';
import { DocumentOutline } from '@/components/notes/DocumentOutline';
import { FindReplacePanel } from '@/components/notes/FindReplacePanel';
import { DocumentStats } from '@/components/notes/DocumentStats';
import { ImageUploadHandler } from '@/components/notes/ImageUploadHandler';
import { ExportDialog } from '@/components/notes/ExportDialog';
import { ExportService } from '@/services/exportService';
import { TagsList } from '@/components/notes/TagsList';
import { Note } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type ViewMode = 'edit' | 'preview' | 'split';

export default function NoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isTypewriterMode, setIsTypewriterMode] = useState(false);

  const isMobile = useIsMobile();

  const { data: notes = [] } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const isNewNote = id === 'new';
  const currentNote = isNewNote ? null : notes.find(note => note.id === id);

  // Debounced auto-save for existing notes
  const debouncedTitle = useDebounce(title, DEBOUNCE_TIMES.AUTO_SAVE);
  const debouncedContent = useDebounce(content, DEBOUNCE_TIMES.AUTO_SAVE);

  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
      setIsPinned(currentNote.isPinned);
    }
  }, [currentNote]);

  // Pre-fill title from URL for new notes
  useEffect(() => {
    if (isNewNote && !title) {
      const initialTitle = searchParams.get('title');
      if (initialTitle) {
        setTitle(initialTitle);
      }
    }
  }, [isNewNote, searchParams]);

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

    const { frontmatter, hashtags } = markdownService.parseFrontmatter(content);
    const saveTitle = frontmatter.title || title || 'Untitled';
    const savePinned = frontmatter.pinned !== undefined ? frontmatter.pinned : isPinned;
    const fmTags = (frontmatter.tags as string[]) || [];
    const derivedTags = Array.from(new Set([...fmTags, ...hashtags]));

    setIsSaving(true);
    try {
      await updateNote.mutateAsync({
        id: currentNote.id,
        title: String(saveTitle),
        content,
        isPinned: Boolean(savePinned),
        tags: derivedTags,
      });
      setLastSaved(new Date());
    } catch (error) {
      // Silent fail for auto-save
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    // Prevent duplicate saves
    if (isSaving) return;

    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save notes.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    const { frontmatter, hashtags } = markdownService.parseFrontmatter(content);

    // Determine final title - frontmatter takes precedence, fallback to state, then 'Untitled'
    const saveTitle = frontmatter.title || title?.trim() || 'Untitled';
    const savePinned = frontmatter.pinned !== undefined ? frontmatter.pinned : isPinned;
    const fmTags = (frontmatter.tags as string[]) || [];
    const derivedTags = Array.from(new Set([...fmTags, ...hashtags]));

    // Validate: require at least some content or a meaningful title
    if (!content.trim() && saveTitle === 'Untitled') {
      toast({
        title: "Cannot save empty note",
        description: "Please add a title or some content before saving.",
        variant: "destructive",
      });
      return;
    }

    // Update local state if frontmatter overrides
    if (frontmatter.title && frontmatter.title !== title) setTitle(String(frontmatter.title));
    if (frontmatter.pinned !== undefined && frontmatter.pinned !== isPinned) setIsPinned(Boolean(frontmatter.pinned));

    setIsSaving(true);
    try {
      if (isNewNote) {
        const newNote = await createNote.mutateAsync({
          title: String(saveTitle),
          content,
          isPinned: Boolean(savePinned),
          tags: derivedTags,
        });

        // Ensure we have the note ID before navigating
        if (!newNote?.id) {
          throw new Error('Failed to create note - no ID returned');
        }

        toast({
          title: "Note created",
          description: "Your note has been saved successfully.",
        });

        // Navigate to the new note's URL so we can continue editing it
        navigate(`/notes/${newNote.id}`, { replace: true });

      } else if (currentNote) {
        await updateNote.mutateAsync({
          id: currentNote.id,
          title: String(saveTitle),
          content,
          isPinned: Boolean(savePinned),
          tags: derivedTags,
        });
        setLastSaved(new Date());
        toast({
          title: "Note saved",
          description: "Your note has been saved successfully.",
        });
      }
    } catch (error: any) {
      // Content remains on screen - we don't clear it
      console.error('Save failed:', error);
      toast({
        title: "Save failed",
        description: error?.message || "Failed to save your note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/notes');
  };

  const insertMarkdown = useCallback((markdown: string) => {
    setContent(prev => prev + markdown);
  }, []);

  const formatSelection = useCallback((type: string) => {
    // Get reference to the textarea through the layout component
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    // Use the enhanced textarea's built-in formatting methods
    const textareaEnhanced = textarea as any;

    switch (type) {
      case 'bold':
        if (textareaEnhanced.insertMarkdown) {
          textareaEnhanced.insertMarkdown('**', '**', 'bold text');
        }
        break;
      case 'italic':
        if (textareaEnhanced.insertMarkdown) {
          textareaEnhanced.insertMarkdown('*', '*', 'italic text');
        }
        break;
      case 'underline':
        if (textareaEnhanced.insertMarkdown) {
          textareaEnhanced.insertMarkdown('<u>', '</u>', 'underlined text');
        }
        break;
      case 'strikethrough':
        if (textareaEnhanced.insertMarkdown) {
          textareaEnhanced.insertMarkdown('~~', '~~', 'strikethrough text');
        }
        break;
      case 'inline-code':
        if (textareaEnhanced.insertMarkdown) {
          textareaEnhanced.insertMarkdown('`', '`', 'code');
        }
        break;
      case 'heading1':
        if (textareaEnhanced.insertMarkdown) {
          textareaEnhanced.insertMarkdown('# ', '', 'Heading 1');
        }
        break;
      case 'heading2':
        if (textareaEnhanced.insertMarkdown) {
          textareaEnhanced.insertMarkdown('## ', '', 'Heading 2');
        }
        break;
      case 'heading3':
        if (textareaEnhanced.insertMarkdown) {
          textareaEnhanced.insertMarkdown('### ', '', 'Heading 3');
        }
        break;
      case 'unordered-list':
        if (textareaEnhanced.insertMarkdown) {
          textareaEnhanced.insertMarkdown('- ', '', 'List item');
        }
        break;
      case 'ordered-list':
        if (textareaEnhanced.insertMarkdown) {
          textareaEnhanced.insertMarkdown('1. ', '', 'List item');
        }
        break;
      case 'task-list':
        if (textareaEnhanced.insertMarkdown) {
          textareaEnhanced.insertMarkdown('- [ ] ', '', 'Task item');
        }
        break;
      case 'blockquote':
        if (textareaEnhanced.insertMarkdown) {
          textareaEnhanced.insertMarkdown('> ', '', 'Quote text');
        }
        break;
      case 'link':
        if (textareaEnhanced.insertMarkdown) {
          textareaEnhanced.insertMarkdown('[', '](https://example.com)', 'link text');
        }
        break;
      case 'image':
        if (textareaEnhanced.insertMarkdown) {
          textareaEnhanced.insertMarkdown('![', '](image-url)', 'alt text');
        }
        break;
      case 'table':
        if (textareaEnhanced.insertText) {
          textareaEnhanced.insertText('\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n');
        }
        break;
      case 'code-block':
        if (textareaEnhanced.insertText) {
          textareaEnhanced.insertText('\n```javascript\n// Your code here\nconsole.log("Hello, World!");\n```\n');
        }
        break;
      case 'horizontal-rule':
        if (textareaEnhanced.insertText) {
          textareaEnhanced.insertText('\n---\n');
        }
        break;
      default:
        break;
    }
  }, []);

  const handleWikiLinkClick = useCallback((noteTitle: string) => {
    const targetNote = notes.find(n => n.title.toLowerCase() === noteTitle.toLowerCase());

    if (targetNote) {
      navigate(`/notes/${targetNote.id}`);
    } else {
      navigate(`/notes/new?title=${encodeURIComponent(noteTitle)}`);
    }
  }, [notes, navigate]);

  const handleExport = () => {
    setShowExportDialog(true);
  };

  const handlePrint = async () => {
    try {
      await ExportService.print(content, title || 'Untitled');
    } catch (error) {
      toast({
        title: "Print Error",
        description: "Failed to print the note",
        variant: "destructive"
      });
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
      <div className="border-b">
        <EnhancedNoteEditorToolbar
          onFormat={formatSelection}
          onInsertImage={() => setShowImageUpload(true)}
          onTogglePreview={() => setViewMode(viewMode === 'preview' ? 'edit' : 'preview')}
          onToggleFindReplace={() => setShowFindReplace(!showFindReplace)}
          onToggleOutline={() => setShowOutline(!showOutline)}
          onToggleStats={() => setShowStats(!showStats)}
          onExport={handleExport}
          onPrint={handlePrint}
          showPreview={viewMode === 'preview'}
          isMobile={isMobile}
          isTypewriterMode={isTypewriterMode}
          onToggleTypewriter={() => setIsTypewriterMode(!isTypewriterMode)}
        />

        {showFindReplace && (
          <FindReplacePanel
            content={content}
            onContentChange={setContent}
            onClose={() => setShowFindReplace(false)}
          />
        )}
      </div>

      {/* Main Content with Side Panels */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentNote?.tags && currentNote.tags.length > 0 && (
            <div className="px-4 py-2 border-b bg-muted/10">
              <TagsList tags={currentNote.tags} />
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <NoteEditorLayout
              content={content}
              onContentChange={setContent}
              viewMode={viewMode}
              title={title}
              onWikiLinkClick={handleWikiLinkClick}
              isTypewriterMode={isTypewriterMode}
            />
          </div>
        </div>

        {/* Side Panels */}
        {(showOutline || showStats) && (
          <div className="w-80 border-l bg-muted/20 overflow-y-auto">
            {showOutline && (
              <DocumentOutline
                content={content}
                className="m-4"
              />
            )}
            {showStats && (
              <DocumentStats
                content={content}
                title={title}
                className="m-4"
              />
            )}
          </div>
        )}

        {/* Image Upload Overlay */}
        {showImageUpload && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <ImageUploadHandler
              onImageInsert={(markdown) => {
                setContent(prev => prev + '\n' + markdown);
                setShowImageUpload(false);
              }}
              onClose={() => setShowImageUpload(false)}
              className="w-full max-w-lg"
            />
          </div>
        )}

        {/* Export Dialog */}
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          content={content}
          defaultTitle={title || 'Untitled'}
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

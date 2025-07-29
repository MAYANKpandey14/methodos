import React, { useState } from 'react';
import { Plus, Search, Pin, Edit, Trash2, Eye, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { NoteDeleteDialog } from '@/components/notes/NoteDeleteDialog';
import { useNotes, useDeleteNote, useUpdateNote } from '@/hooks/useNotes';
import { Note } from '@/types';

export default function NotesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: notes = [], isLoading } = useNotes();
  const deleteNote = useDeleteNote();
  const updateNote = useUpdateNote();

  // Filter notes based on search
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Separate pinned and unpinned notes
  const pinnedNotes = filteredNotes.filter(note => note.isPinned);
  const unpinnedNotes = filteredNotes.filter(note => !note.isPinned);

  const handleDeleteNote = (note: Note) => {
    setDeletingNote(note);
  };

  const confirmDelete = () => {
    if (deletingNote) {
      deleteNote.mutate(deletingNote.id);
      setDeletingNote(null);
    }
  };

  const togglePin = (note: Note) => {
    updateNote.mutate({
      id: note.id,
      isPinned: !note.isPinned,
    });
  };

  const renderNoteCard = (note: Note) => (
    <Card key={note.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg leading-tight truncate" title={note.title}>
                {note.title}
              </CardTitle>
              {note.isPinned && (
                <Pin className="w-4 h-4 text-primary" />
              )}
            </div>
            <CardDescription className="mt-1">
              {note.updatedAt.toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => togglePin(note)}
              title={note.isPinned ? "Unpin note" : "Pin note"}
            >
              <Pin className={`w-4 h-4 ${note.isPinned ? 'text-primary' : 'text-muted-foreground'}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingNote(note)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteNote(note)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="prose prose-sm max-w-none">
          <div className="text-sm text-muted-foreground line-clamp-4">
            {note.content.substring(0, 200)}
            {note.content.length > 200 && '...'}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Create and organize your thoughts with Markdown support</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <NoteEditor onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground text-center">
              {notes.length === 0 ? (
                <>
                  <Edit3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No notes yet</h3>
                  <p>Start capturing your thoughts by creating your first note.</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-2">No notes found</h3>
                  <p>Try adjusting your search criteria.</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Pin className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Pinned Notes</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedNotes.map(renderNoteCard)}
              </div>
            </div>
          )}

          {/* Regular Notes */}
          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <h2 className="text-xl font-semibold mb-4">Notes</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpinnedNotes.map(renderNoteCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Note Full Screen */}
      {editingNote && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full flex flex-col">
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Edit Note</h2>
                <Button
                  variant="outline"
                  onClick={() => setEditingNote(null)}
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-hidden">
              <NoteEditor
                note={editingNote}
                onSuccess={() => setEditingNote(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <NoteDeleteDialog
        note={deletingNote}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingNote(null)}
      />
    </div>
  );
}
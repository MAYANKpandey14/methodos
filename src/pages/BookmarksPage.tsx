import React, { useState } from 'react';
import { Plus, Search, Tag, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookmarkForm } from '@/components/bookmarks/BookmarkForm';
import { BookmarkDeleteDialog } from '@/components/bookmarks/BookmarkDeleteDialog';
import { useBookmarks, useDeleteBookmark } from '@/hooks/useBookmarks';
import { Bookmark } from '@/types';

export default function BookmarksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [deletingBookmark, setDeletingBookmark] = useState<Bookmark | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: bookmarks = [], isLoading } = useBookmarks();
  const deleteBookmark = useDeleteBookmark();

  // Extract unique tags from all bookmarks
  const allTags = Array.from(
    new Set(bookmarks.flatMap(bookmark => bookmark.tags))
  ).filter(Boolean);

  // Filter bookmarks based on search and selected tag
  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (bookmark.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesTag = !selectedTag || bookmark.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  const handleDeleteBookmark = (bookmark: Bookmark) => {
    setDeletingBookmark(bookmark);
  };

  const confirmDelete = () => {
    if (deletingBookmark) {
      deleteBookmark.mutate(deletingBookmark.id);
      setDeletingBookmark(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading bookmarks...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookmarks</h1>
          <p className="text-muted-foreground">Save and organize your important links</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Bookmark
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Bookmark</DialogTitle>
            </DialogHeader>
            <BookmarkForm onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search bookmarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(null)}
            >
              <Tag className="w-4 h-4 mr-1" />
              All
            </Button>
            {allTags.map(tag => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Bookmarks Grid */}
      {filteredBookmarks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground text-center">
              {bookmarks.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium mb-2">No bookmarks yet</h3>
                  <p>Start saving your important links by adding your first bookmark.</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-2">No bookmarks found</h3>
                  <p>Try adjusting your search or filter criteria.</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookmarks.map(bookmark => (
            <Card key={bookmark.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight truncate" title={bookmark.title}>
                      {bookmark.title}
                    </CardTitle>
                    <CardDescription className="mt-1 truncate" title={bookmark.url}>
                      {bookmark.url}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingBookmark(bookmark)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBookmark(bookmark)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 space-y-3">
                {bookmark.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {bookmark.description}
                  </p>
                )}
                
                {bookmark.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {bookmark.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    {bookmark.createdAt.toLocaleDateString()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(bookmark.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Visit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingBookmark && (
        <Dialog open={true} onOpenChange={() => setEditingBookmark(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Bookmark</DialogTitle>
            </DialogHeader>
            <BookmarkForm
              bookmark={editingBookmark}
              onSuccess={() => setEditingBookmark(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog */}
      <BookmarkDeleteDialog
        bookmark={deletingBookmark}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingBookmark(null)}
      />
    </div>
  );
}
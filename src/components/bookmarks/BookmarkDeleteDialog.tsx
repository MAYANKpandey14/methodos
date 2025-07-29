import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Bookmark } from '@/types';

interface BookmarkDeleteDialogProps {
  bookmark: Bookmark | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BookmarkDeleteDialog({ bookmark, onConfirm, onCancel }: BookmarkDeleteDialogProps) {
  return (
    <AlertDialog open={!!bookmark} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Bookmark</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{bookmark?.title}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
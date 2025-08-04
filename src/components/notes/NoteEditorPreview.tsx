import React, { useEffect, useState } from 'react';
import { MarkdownPreview } from './MarkdownPreview';

interface NoteEditorPreviewProps {
  content: string;
  title: string;
}

export function NoteEditorPreview({ content, title }: NoteEditorPreviewProps) {
  return <MarkdownPreview content={content} title={title} />;
}
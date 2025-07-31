import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { compressImage } from '@/utils/imageCompression';

interface ImageUploadHandlerProps {
  onImageInsert: (imageMarkdown: string) => void;
  onClose: () => void;
  className?: string;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  error?: string;
}

export function ImageUploadHandler({ onImageInsert, onClose, className }: ImageUploadHandlerProps) {
  const [uploadState, setUploadState] = useState<UploadState>({ uploading: false, progress: 0 });

  const handleImageUpload = useCallback(async (file: File) => {
    setUploadState({ uploading: true, progress: 0 });

    try {
      // Compress image if needed
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 100);

      // Create object URL for local preview
      const imageUrl = URL.createObjectURL(compressedFile);
      
      // In a real app, you would upload to a storage service here
      // For now, we'll use the local object URL
      const imageMarkdown = `![${file.name}](${imageUrl})`;
      
      clearInterval(progressInterval);
      setUploadState({ uploading: false, progress: 100 });
      
      // Insert the image markdown
      onImageInsert(imageMarkdown);
      
      // Close the upload handler after a short delay
      setTimeout(() => {
        onClose();
      }, 500);

    } catch (error) {
      setUploadState({ 
        uploading: false, 
        progress: 0, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      });
    }
  }, [onImageInsert, onClose]);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleImageUpload(acceptedFiles[0]);
      }
    },
    onDropRejected: (rejectedFiles) => {
      const error = rejectedFiles[0]?.errors[0];
      let errorMessage = 'Upload failed';
      
      if (error?.code === 'file-too-large') {
        errorMessage = 'File size must be less than 10MB';
      } else if (error?.code === 'file-invalid-type') {
        errorMessage = 'Please upload a valid image file';
      }
      
      setUploadState({ uploading: false, progress: 0, error: errorMessage });
    }
  });

  const handleUrlInsert = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      const imageMarkdown = `![Image](${url})`;
      onImageInsert(imageMarkdown);
      onClose();
    }
  };

  const getDropzoneStyles = () => {
    if (isDragAccept) return 'border-primary bg-primary/5';
    if (isDragReject) return 'border-destructive bg-destructive/5';
    if (isDragActive) return 'border-muted-foreground bg-muted/50';
    return 'border-dashed border-muted-foreground/50 hover:border-muted-foreground';
  };

  return (
    <Card className={className}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Insert Image
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {uploadState.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadState.error}</AlertDescription>
          </Alert>
        )}

        {uploadState.uploading ? (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Uploading image...</div>
            <Progress value={uploadState.progress} className="w-full" />
          </div>
        ) : (
          <>
            {/* Drag and Drop Area */}
            <div
              {...getRootProps()}
              className={`
                border-2 rounded-lg p-8 text-center cursor-pointer transition-colors
                ${getDropzoneStyles()}
              `}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              
              {isDragActive ? (
                <p className="text-lg font-medium">
                  {isDragAccept ? 'Drop the image here' : 'Invalid file type'}
                </p>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">
                    Drag & drop an image here
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse files
                  </p>
                  <Button variant="outline">
                    Choose File
                  </Button>
                </>
              )}
            </div>

            {/* URL Input Option */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleUrlInsert}
            >
              Insert from URL
            </Button>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Supported formats: JPEG, PNG, GIF, WebP, SVG</p>
              <p>• Maximum file size: 10MB</p>
              <p>• Images will be compressed automatically</p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage, validateImageFile } from '@/utils/imageCompression';

interface AvatarUploadProps {
  size?: 'sm' | 'md' | 'lg';
  showUploadButton?: boolean;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ 
  size = 'md', 
  showUploadButton = true 
}) => {
  const { user, profile, updateProfile, loadProfile } = useAuthStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  const getAvatarUrl = () => {
    if (!profile?.avatar_url || imageError) return null;
    
    if (profile.avatar_url.startsWith('http')) {
      return profile.avatar_url;
    }
    
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(profile.avatar_url);
    
    return data.publicUrl;
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;

    setUploading(true);
    try {
      // Enhanced security validation
      if (!file) {
        throw new Error('No file selected');
      }
      
      // File size validation (max 5MB)
      const maxSizeInBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        throw new Error('File size must be less than 5MB');
      }
      
      // MIME type validation
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimeTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
      }
      
      // File extension validation
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        throw new Error('Invalid file extension');
      }
      
      // File header validation for security
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Check for common image file signatures
      const isValidImage = 
        (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8) || // JPEG
        (uint8Array[0] === 0x89 && uint8Array[1] === 0x50) || // PNG
        (uint8Array[0] === 0x52 && uint8Array[1] === 0x49) || // WebP (RIFF)
        (uint8Array[0] === 0x47 && uint8Array[1] === 0x49);   // GIF
      
      if (!isValidImage) {
        throw new Error('Invalid image file format');
      }
      
      // Validate and compress image
      validateImageFile(file);
      
      toast({
        title: 'Compressing image...',
        description: 'Optimizing your image for upload.',
      });

      const compressedBlob = await compressImage(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.8,
        format: 'webp'
      });

      // Sanitized file path
      const sanitizedFilePath = `${user.id}/avatar_${Date.now()}.webp`;

      // Delete existing avatar if it exists
      if (profile?.avatar_url && !profile.avatar_url.startsWith('http')) {
        await supabase.storage
          .from('avatars')
          .remove([profile.avatar_url]);
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(sanitizedFilePath, compressedBlob, { 
          upsert: true,
          contentType: 'image/webp'
        });

      if (uploadError) throw uploadError;

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: sanitizedFilePath });
      
      // Reload profile to ensure UI updates
      await loadProfile();
      
      setImageError(false);

      toast({
        title: 'Avatar uploaded',
        description: 'Your profile picture has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload avatar.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
      uploadAvatar(file);
    } catch (error: any) {
      toast({
        title: 'Invalid file',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const initials = profile?.display_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex items-center space-x-4">
      <Avatar className={sizeClasses[size]} role="img">
        <AvatarImage 
          src={getAvatarUrl() || undefined} 
          alt={`${profile?.display_name || 'User'}'s profile picture`}
          onError={handleImageError}
        />
        <AvatarFallback 
          className="text-lg font-medium bg-primary/10 text-primary"
          aria-label={`Profile initials: ${initials}`}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {showUploadButton && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="sr-only"
            aria-label="Upload profile picture"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-describedby="avatar-upload-description"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Change Avatar</span>
              </>
            )}
          </Button>
          <div id="avatar-upload-description" className="sr-only">
            Upload a new profile picture. Supported formats: JPG, PNG, GIF. Maximum size: 5MB.
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Check, AlertCircle, Image as ImageIcon, Film } from 'lucide-react';
import type { VideoMode, VideoImageRole } from '@/types/video-api';
import { getMaxImagesForMode, getMinImagesForMode, validateImageCount } from '@/constants/video-parameters';

// ============================================================================
// Types
// ============================================================================

export interface VideoImageFile {
  id: string;
  file: File;
  previewUrl: string; // Object URL for preview
  role?: VideoImageRole; // Role for this image
  validationStatus: 'pending' | 'valid' | 'invalid';
  validationError?: string;
}

interface VideoUploadZoneProps {
  mode: VideoMode;
  images: VideoImageFile[];
  onImagesChange: (images: VideoImageFile[]) => void;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff', 'image/gif'];
const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB
const MIN_DIMENSION = 300;
const MAX_DIMENSION = 6000;
const MIN_ASPECT_RATIO = 0.4;
const MAX_ASPECT_RATIO = 2.5;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate single image file
 */
async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File exceeds 30 MB limit' };
  }

  // Check format
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return { valid: false, error: 'Unsupported format. Use JPEG, PNG, WebP, BMP, TIFF, or GIF' };
  }

  // Load image to check dimensions and aspect ratio
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width, height } = img;
      const aspectRatio = width / height;

      // Check dimensions
      if (Math.min(width, height) < MIN_DIMENSION) {
        resolve({ valid: false, error: `Minimum dimension is ${MIN_DIMENSION}px` });
        return;
      }

      if (Math.max(width, height) > MAX_DIMENSION) {
        resolve({ valid: false, error: `Maximum dimension is ${MAX_DIMENSION}px` });
        return;
      }

      // Check aspect ratio
      if (aspectRatio < MIN_ASPECT_RATIO || aspectRatio > MAX_ASPECT_RATIO) {
        resolve({ valid: false, error: `Aspect ratio must be between ${MIN_ASPECT_RATIO} and ${MAX_ASPECT_RATIO}` });
        return;
      }

      resolve({ valid: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: 'Failed to load image' });
    };

    img.src = url;
  });
}

/**
 * Assign roles to images based on mode
 */
function assignRoles(images: VideoImageFile[], mode: VideoMode): VideoImageFile[] {
  if (mode === 'image-to-video-frames' && images.length === 2) {
    // First + Last Frame mode
    return images.map((img, idx) => ({
      ...img,
      role: idx === 0 ? ('first_frame' as const) : ('last_frame' as const),
    }));
  } else if (mode === 'image-to-video-ref') {
    // Reference Images mode
    return images.map(img => ({
      ...img,
      role: 'reference_image' as const,
    }));
  } else if (mode === 'image-to-video-first') {
    // First Frame only (role optional)
    return images.map(img => ({
      ...img,
      role: 'first_frame' as const,
    }));
  }
  return images;
}

// ============================================================================
// Component
// ============================================================================

export function VideoUploadZone({ mode, images, onImagesChange, className = '' }: VideoUploadZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const maxImages = getMaxImagesForMode(mode);
  const minImages = getMinImagesForMode(mode);
  const canAddMore = images.length < maxImages;

  // Handle file selection
  const handleFiles = React.useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const newImages: VideoImageFile[] = [];
      const filesToAdd = Math.min(files.length, maxImages - images.length);

      for (let i = 0; i < filesToAdd; i++) {
        const file = files[i];
        const previewUrl = URL.createObjectURL(file);

        // Initial validation
        const validation = await validateImageFile(file);

        newImages.push({
          id: crypto.randomUUID(),
          file,
          previewUrl,
          validationStatus: validation.valid ? 'valid' : 'invalid',
          validationError: validation.error,
        });
      }

      const updatedImages = assignRoles([...images, ...newImages], mode);
      onImagesChange(updatedImages);
    },
    [images, maxImages, mode, onImagesChange]
  );

  // Drag & drop handlers
  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  // File input change handler
  const handleFileInput = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input value so same file can be selected again
      e.target.value = '';
    },
    [handleFiles]
  );

  // Remove image handler
  const handleRemove = React.useCallback(
    (id: string) => {
      const imageToRemove = images.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      const updatedImages = assignRoles(
        images.filter(img => img.id !== id),
        mode
      );
      onImagesChange(updatedImages);
    },
    [images, mode, onImagesChange]
  );

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  // Get mode-specific instructions
  const getInstructions = () => {
    switch (mode) {
      case 'text-to-video':
        return 'No images needed for text-to-video mode';
      case 'image-to-video-first':
        return 'Upload 1 image to use as the first frame';
      case 'image-to-video-frames':
        return 'Upload 2 images (first frame and last frame)';
      case 'image-to-video-ref':
        return 'Upload 1-4 reference images';
      default:
        return 'Upload images';
    }
  };

  // Don't show upload zone for text-to-video mode
  if (mode === 'text-to-video') {
    return null;
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Upload zone */}
        {canAddMore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative rounded-xl border-2 border-dashed transition-all ${
              isDragging
                ? 'border-green-500 bg-green-500/5 scale-[1.02]'
                : 'border-border hover:border-green-500/50 bg-card'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_FORMATS.join(',')}
              multiple={maxImages > 1}
              onChange={handleFileInput}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-8 flex flex-col items-center gap-4 transition-colors hover:bg-accent/5"
            >
              <div className="p-3 rounded-full bg-gradient-to-br from-green-500/10 to-teal-500/5">
                <Upload className={`w-8 h-8 ${isDragging ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {getInstructions()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click to browse
                </p>
                {images.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    {images.length} / {maxImages} uploaded
                  </p>
                )}
              </div>

              {/* Format badges */}
              <div className="flex flex-wrap gap-1.5 justify-center">
                {['JPEG', 'PNG', 'WebP', 'GIF', 'BMP', 'TIFF'].map(format => (
                  <span
                    key={format}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </button>
          </motion.div>
        )}

        {/* Image previews */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="relative group"
                >
                  {/* Image container */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border-2 border-border">
                    <img
                      src={image.previewUrl}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handleRemove(image.id)}
                        className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>

                    {/* Index badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
                      #{index + 1}
                    </div>

                    {/* Role badge */}
                    {image.role && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-green-500 text-white text-xs font-medium">
                        {image.role === 'first_frame' && 'First'}
                        {image.role === 'last_frame' && 'Last'}
                        {image.role === 'reference_image' && 'Ref'}
                      </div>
                    )}

                    {/* Validation status */}
                    <div className="absolute bottom-2 right-2">
                      {image.validationStatus === 'valid' && (
                        <div className="p-1 rounded-full bg-green-500">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {image.validationStatus === 'invalid' && (
                        <div className="p-1 rounded-full bg-red-500">
                          <AlertCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File info */}
                  <div className="mt-1.5 space-y-0.5">
                    <p className="text-xs font-medium text-foreground truncate">
                      {image.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(image.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    {image.validationError && (
                      <p className="text-xs text-red-500 font-medium">
                        {image.validationError}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Helper text */}
        <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
          <div className="flex items-start gap-2">
            <Film className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-medium text-green-600 dark:text-green-400">Image requirements:</span>{' '}
                JPEG, PNG, WebP, BMP, TIFF, or GIF • Max 30 MB • {MIN_DIMENSION}-{MAX_DIMENSION}px • Aspect ratio {MIN_ASPECT_RATIO}-{MAX_ASPECT_RATIO}
              </p>
              {mode === 'image-to-video-frames' && (
                <p className="text-[11px]">
                  💡 The first and last frame can be the same image. If aspect ratios differ, the first frame will be used as reference.
                </p>
              )}
              {mode === 'image-to-video-ref' && (
                <p className="text-[11px]">
                  💡 For reference images, use natural language or specify [Image 1], [Image 2], etc. in your prompt to reference specific images.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';
import { PARAMETER_CONSTRAINTS } from '@/constants/parameters';

export interface ImageFile {
  file: File;
  preview: string; // Object URL for fast preview
  id: string;
  validation: {
    valid: boolean;
    error?: string;
  };
}

interface ImageUploadZoneProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  maxImages?: number;
  mode?: 'single' | 'multi';
}

export function ImageUploadZone({
  images,
  onChange,
  maxImages = 14,
  mode = 'multi',
}: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Validate image file
  const validateImageFile = React.useCallback((file: File): { valid: boolean; error?: string } => {
    const constraints = PARAMETER_CONSTRAINTS.imageUrl;

    // Check file size
    if (file.size > constraints.maxSize) {
      return { valid: false, error: `File too large (max ${constraints.maxSize / 2048 / 2048}MB)` };
    }

    // Check format
    const ext = file.name.toLowerCase().split('.').pop();
    if (!ext || !constraints.formats.includes(ext as any)) {
      return {
        valid: false,
        error: `Invalid format (supported: ${constraints.formats.join(', ')})`,
      };
    }

    return { valid: true };
  }, []);

  // Process files
  const processFiles = React.useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remainingSlots = maxImages - images.length;
      const filesToProcess = fileArray.slice(0, remainingSlots);

      const newImages: ImageFile[] = await Promise.all(
        filesToProcess.map(async (file) => {
          const validation = validateImageFile(file);
          const preview = URL.createObjectURL(file); // Fast object URL for preview

          return {
            file,
            preview,
            id: `${Date.now()}-${Math.random()}`,
            validation,
          };
        })
      );

      onChange([...images, ...newImages]);
    },
    [images, maxImages, onChange, validateImageFile]
  );

  // Handle file input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Handle remove
  const handleRemove = (id: string) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview); // Clean up object URL
    }
    onChange(images.filter((img) => img.id !== id));
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []);

  const hasImages = images.length > 0;
  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-ocean-500/10 to-dream-500/10">
            <ImageIcon className="w-4 h-4 text-ocean-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              {mode === 'single' ? 'Reference Image' : 'Reference Images'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {images.length} of {maxImages} {mode === 'single' ? 'image' : 'images'}
            </p>
          </div>
        </div>

        {hasImages && canAddMore && (
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-ocean-500/10 to-dream-500/10 hover:from-ocean-500/20 hover:to-dream-500/20 text-sm font-medium text-ocean-500 transition-all border border-ocean-500/20"
          >
            Add More
          </motion.button>
        )}
      </div>

      {/* Upload Zone */}
      {canAddMore && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
            isDragging
              ? 'border-ocean-500 bg-ocean-500/10 scale-[1.02]'
              : 'border-border hover:border-ocean-500/50 hover:bg-ocean-500/5'
          }`}
        >
          <div className="p-8 text-center">
            <motion.div
              animate={{ y: isDragging ? -4 : 0 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-ocean-500/10 to-dream-500/10 mb-4"
            >
              <Upload
                className={`w-8 h-8 transition-colors ${isDragging ? 'text-ocean-500' : 'text-muted-foreground'}`}
              />
            </motion.div>

            <h4 className="text-sm font-semibold mb-1">
              {isDragging ? 'Drop images here' : 'Upload Images'}
            </h4>
            <p className="text-xs text-muted-foreground mb-3">Drag & drop or click to browse</p>

            <div className="flex flex-wrap justify-center gap-2 text-[10px] text-muted-foreground/70">
              <span className="px-2 py-1 rounded bg-muted">JPG</span>
              <span className="px-2 py-1 rounded bg-muted">PNG</span>
              <span className="px-2 py-1 rounded bg-muted">WEBP</span>
              <span className="px-2 py-1 rounded bg-muted">GIF</span>
              <span className="px-2 py-1 rounded bg-muted">BMP</span>
              <span className="px-2 py-1 rounded bg-muted">TIFF</span>
            </div>

            <p className="text-[10px] text-muted-foreground/50 mt-3">
              Max 20MB per image • Up to {maxImages} images
            </p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff"
            multiple={mode === 'multi'}
            onChange={handleFileInput}
            className="hidden"
          />
        </motion.div>
      )}

      {/* Preview Grid */}
      {hasImages && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        >
          <AnimatePresence mode="popLayout">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                {/* Preview Image */}
                <div
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    image.validation.valid
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <img
                    src={image.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(image.id);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-full bg-red-500 text-white"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Validation badge */}
                  <div className="absolute top-2 right-2">
                    {image.validation.valid ? (
                      <div className="p-1 rounded-full bg-green-500 text-white">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="p-1 rounded-full bg-red-500 text-white">
                        <AlertCircle className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Index badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-medium">
                    #{index + 1}
                  </div>
                </div>

                {/* File info */}
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-[10px] font-medium truncate" title={image.file.name}>
                    {image.file.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {(image.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {!image.validation.valid && (
                    <p className="text-[9px] text-red-500">{image.validation.error}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Convert File to base64 data URI for Seedream API
 * Only called when generating, not on upload (for performance)
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert array of Files to base64 strings
 */
export async function filesToBase64(files: File[]): Promise<string[]> {
  return Promise.all(files.map(fileToBase64));
}

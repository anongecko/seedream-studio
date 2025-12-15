'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Download, Copy, Clock, ImageIcon, ChevronLeft, ChevronRight, Grid3X3, Layers, Images } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { cn, downloadBase64Image, copyImageToClipboard, formatFileSize, formatGenerationTime, estimateBase64Size } from '@/lib/utils';

interface GenerationOutputProps {
  images: Array<{
    base64: string;
    size: string;
  }>;
  generationTimeMs?: number;
  prompt?: string;
  className?: string;
  onSaveAsPreset?: () => void;
  // For cURL export
  mode?: string;
  size?: string;
  quality?: string;
  batchMode?: boolean;
  maxImages?: number;
  referenceImageUrls?: string[];
}

/**
 * Displays generated images with slideshow for batch generations
 * Single image: Standard display with actions
 * Batch images: Main slideshow + thumbnail grid navigation
 */
export function GenerationOutput({
  images,
  generationTimeMs,
  prompt,
  className,
  onSaveAsPreset,
  mode,
  size,
  quality,
  batchMode,
  maxImages,
  referenceImageUrls = [],
}: GenerationOutputProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [copyingIndex, setCopyingIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [curlCopied, setCurlCopied] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'slideshow' | 'grid'>('slideshow');

  const isBatch = images.length > 1;

  // Embla carousel for slideshow
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'center',
  });

  // Handle image load
  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set([...prev, index]));
  }, []);

  // Handle download
  const handleDownload = useCallback((index: number) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = isBatch
      ? `seedream-${timestamp}-${index + 1}.png`
      : `seedream-${timestamp}.png`;
    downloadBase64Image(images[index].base64, filename);
  }, [images, isBatch]);

  // Handle download all (for batch)
  const handleDownloadAll = useCallback(async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    // Download each image with a small delay to avoid overwhelming the browser
    for (let i = 0; i < images.length; i++) {
      const filename = `seedream-${timestamp}-${i + 1}.png`;
      downloadBase64Image(images[i].base64, filename);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }, [images]);

  // Handle copy
  const handleCopy = useCallback(async (index: number) => {
    setCopyingIndex(index);
    setCopiedIndex(null);

    try {
      await copyImageToClipboard(images[index].base64);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy image:', error);
    } finally {
      setCopyingIndex(null);
    }
  }, [images]);

  // Total estimated size
  const totalEstimatedSize = useMemo(() => {
    return images.reduce((sum, img) => sum + estimateBase64Size(img.base64), 0);
  }, [images]);

  // Sync embla with selected index
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // Navigation
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const canScrollPrev = emblaApi?.canScrollPrev() ?? false;
  const canScrollNext = emblaApi?.canScrollNext() ?? false;

  // Generate cURL command
  const curlCommand = useMemo(() => {
    if (!prompt) return '';

    const apiUrl = process.env.NEXT_PUBLIC_SEEDREAM_API_URL || 'https://ark.ap-southeast.bytepluses.com/api/v3';
    const requestBody: any = {
      model: 'seedream-4-0-250828',
      prompt,
      sequential_image_generation: batchMode ? 'auto' : 'disabled',
      response_format: 'b64_json',
      stream: false,
      watermark: false,
    };

    if (batchMode && maxImages) {
      requestBody.sequential_image_generation_options = { max_images: maxImages };
    }

    if (referenceImageUrls && referenceImageUrls.length > 0) {
      requestBody.image = referenceImageUrls.length === 1 ? referenceImageUrls[0] : referenceImageUrls;
    }

    if (size && size !== '2048x2048') requestBody.size = size;
    if (quality && quality !== 'standard') requestBody.quality = quality;

    const jsonBody = JSON.stringify(requestBody, null, 2);
    return `curl -X POST ${apiUrl}/images/generations \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer $SEEDREAM_API_KEY" \\\n  -d '${jsonBody}'`;
  }, [prompt, size, quality, batchMode, maxImages, referenceImageUrls]);

  const handleCopyCurl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCurlCopied(true);
      setTimeout(() => setCurlCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy cURL:', error);
    }
  }, [curlCommand]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Batch header with controls */}
      {isBatch && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Info */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Layers className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  Batch Generation Complete
                </h3>
                <p className="text-xs text-muted-foreground">
                  {images.length} image{images.length > 1 ? 's' : ''} generated
                  {maxImages && ` (requested ${maxImages})`}
                </p>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg bg-muted/50 p-1">
                <button
                  onClick={() => setViewMode('slideshow')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    viewMode === 'slideshow'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Images className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Slideshow</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    viewMode === 'grid'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
              </div>

              {/* Download All Button */}
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-ocean-500 to-dream-500 text-white text-xs font-medium hover:opacity-90 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {isBatch ? (
        /* Batch: Slideshow or Grid view */
        <AnimatePresence mode="wait">
          {viewMode === 'slideshow' ? (
            <motion.div
              key="slideshow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Main slideshow */}
              <div className="relative group">
                <div className="overflow-hidden rounded-lg border border-border" ref={emblaRef}>
                  <div className="flex">
                    {images.map((image, index) => {
                      const isLoaded = loadedImages.has(index);
                      const imageDataUri = image.base64.startsWith('data:')
                        ? image.base64
                        : `data:image/png;base64,${image.base64}`;

                      return (
                        <div key={index} className="flex-[0_0_100%] min-w-0">
                          <div className="relative w-full bg-muted" style={{ aspectRatio: '16/9' }}>
                            {!isLoaded && (
                              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted" />
                            )}
                            <img
                              src={imageDataUri}
                              alt={`Generated image ${index + 1}`}
                              className={cn(
                                'w-full h-full object-contain transition-opacity duration-300',
                                isLoaded ? 'opacity-100' : 'opacity-0'
                              )}
                              onLoad={() => handleImageLoad(index)}
                              loading="lazy"
                            />
                            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-sm font-medium">
                              {index + 1} / {images.length}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation buttons */}
                <button
                  onClick={scrollPrev}
                  disabled={!canScrollPrev}
                  className={cn(
                    'absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full',
                    'bg-black/70 backdrop-blur-sm text-white flex items-center justify-center',
                    'transition-all hover:bg-black/90 hover:scale-110',
                    'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100',
                    'opacity-0 group-hover:opacity-100'
                  )}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={scrollNext}
                  disabled={!canScrollNext}
                  className={cn(
                    'absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full',
                    'bg-black/70 backdrop-blur-sm text-white flex items-center justify-center',
                    'transition-all hover:bg-black/90 hover:scale-110',
                    'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100',
                    'opacity-0 group-hover:opacity-100'
                  )}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Thumbnail strip */}
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                {images.map((image, index) => {
                  const imageDataUri = image.base64.startsWith('data:')
                    ? image.base64
                    : `data:image/png;base64,${image.base64}`;

                  return (
                    <button
                      key={index}
                      onClick={() => scrollTo(index)}
                      className={cn(
                        'relative aspect-square rounded-md overflow-hidden border-2 transition-all',
                        selectedIndex === index
                          ? 'border-ocean-500 ring-2 ring-ocean-500/50 scale-105'
                          : 'border-border hover:border-ocean-300'
                      )}
                    >
                      <img
                        src={imageDataUri}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] text-center py-0.5">
                        #{index + 1}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected image actions */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Image #{selectedIndex + 1}:</span>{' '}
                  {images[selectedIndex].size}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(selectedIndex)}
                    disabled={copyingIndex === selectedIndex}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm',
                      'border border-input hover:bg-accent transition-colors',
                      copiedIndex === selectedIndex && 'bg-green-500/10 text-green-600 border-green-500/50'
                    )}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedIndex === selectedIndex ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => handleDownload(selectedIndex)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border border-input hover:bg-accent transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Grid view */
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {images.map((image, index) => {
                const isLoaded = loadedImages.has(index);
                const imageDataUri = image.base64.startsWith('data:')
                  ? image.base64
                  : `data:image/png;base64,${image.base64}`;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted">
                      {!isLoaded && (
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted" />
                      )}
                      <img
                        src={imageDataUri}
                        alt={`Generated image ${index + 1}`}
                        className={cn(
                          'w-full h-full object-cover transition-all duration-300',
                          isLoaded ? 'opacity-100' : 'opacity-0',
                          'group-hover:scale-105'
                        )}
                        onLoad={() => handleImageLoad(index)}
                        loading="lazy"
                      />

                      {/* Index badge */}
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-medium">
                        #{index + 1}
                      </div>

                      {/* Hover overlay with actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(index)}
                            disabled={copyingIndex === index}
                            className={cn(
                              'p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all',
                              copiedIndex === index && 'bg-green-500/50'
                            )}
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(index)}
                            className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Size label */}
                    <p className="mt-2 text-xs text-muted-foreground text-center">
                      {image.size}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        /* Single image display */
        <div className="space-y-4">
          {(() => {
            const image = images[0];
            const isLoaded = loadedImages.has(0);
            const imageDataUri = image.base64.startsWith('data:')
              ? image.base64
              : `data:image/png;base64,${image.base64}`;

            const match = image.size.match(/^(\d+)x(\d+)$/);
            const width = match ? parseInt(match[1], 10) : 0;
            const height = match ? parseInt(match[2], 10) : 0;
            const aspectRatio = width && height ? width / height : 1;

            return (
              <div
                className="relative w-full overflow-hidden rounded-lg border border-border bg-muted"
                style={{
                  aspectRatio: aspectRatio > 0 ? aspectRatio : undefined,
                  minHeight: aspectRatio > 0 ? undefined : '400px',
                }}
              >
                {!isLoaded && (
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted" />
                )}
                <img
                  src={imageDataUri}
                  alt="Generated image"
                  className={cn(
                    'h-full w-full object-contain transition-opacity duration-300',
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={() => handleImageLoad(0)}
                  loading="lazy"
                />
              </div>
            );
          })()}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{images[0].size}</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(0)}
                disabled={copyingIndex === 0}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm',
                  'border border-input hover:bg-accent transition-colors',
                  copiedIndex === 0 && 'bg-green-500/10 text-green-600 border-green-500/50'
                )}
              >
                <Copy className="h-4 w-4" />
                {copiedIndex === 0 ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => handleDownload(0)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border border-input hover:bg-accent transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global metadata and actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4" />
            <span>{images.length} image{images.length > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>{formatFileSize(totalEstimatedSize)}</span>
          </div>
          {generationTimeMs !== undefined && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{formatGenerationTime(generationTimeMs)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopyCurl}
            disabled={!curlCommand}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
              'border border-input hover:bg-accent transition-colors',
              'disabled:opacity-50 disabled:pointer-events-none',
              curlCopied && 'bg-green-500/10 text-green-600 border-green-500/50'
            )}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {curlCopied ? 'Copied!' : 'Copy cURL'}
          </button>

          {onSaveAsPreset && (
            <button
              onClick={onSaveAsPreset}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Save as Preset
            </button>
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
        <div className="flex items-start gap-2">
          <svg className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Backup your work:</span> Download your {isBatch ? 'images' : 'image'} or copy the cURL command to recreate {isBatch ? 'them' : 'it'} later. Images are not stored in the database.
          </p>
        </div>
      </div>

      {/* Optional prompt display */}
      {prompt && (
        <div className="rounded-md border border-border bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Prompt:</span> {prompt}
          </p>
        </div>
      )}
    </div>
  );
}

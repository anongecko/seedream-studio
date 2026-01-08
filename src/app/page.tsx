'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { ModeTabs, mapModeOnModelSwitch } from '@/components/studio/mode-tabs';
import { ApiKeySetup } from '@/components/studio/api-key-setup';
import { LoadingState } from '@/components/studio/loading-snake';
import { PromptInput } from '@/components/studio/prompt-input';
import { SizeSelector } from '@/components/studio/size-selector';
import { QualityToggle } from '@/components/studio/quality-toggle';
import { BatchModeToggle } from '@/components/studio/batch-mode-toggle';
import { ApiPreviewPanel } from '@/components/studio/api-preview-panel';
import { GenerationOutput } from '@/components/studio/generation-output';
import { ImageUploadZone, filesToBase64, type ImageFile } from '@/components/studio/image-upload-zone';
import { useApiKey } from '@/hooks/use-api-key';
import { useGeneration } from '@/hooks/use-generation';
import { useVideoGeneration } from '@/hooks/use-video-generation';
import { useModelSelection } from '@/hooks/use-model';
import type { GenerationMode, Quality, UnifiedMode } from '@/types/api';
import type { VideoDuration, VideoResolution, VideoRatio, VideoServiceTier, VideoMode, MediaType } from '@/types/video-api';
import { getMediaType, isVideoModel, isVideoMode } from '@/types/api';

// Video components
import { VideoSizeSelector } from '@/components/studio/video/video-size-selector';
import { DurationSelector } from '@/components/studio/video/duration-selector';
import { AudioToggle } from '@/components/studio/video/audio-toggle';
import { AdvancedOptions } from '@/components/studio/video/advanced-options';
import { VideoUploadZone, type VideoImageFile } from '@/components/studio/video/video-upload-zone';
import { VideoOutput } from '@/components/studio/video/video-output';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

// Size options for stats display (image)
const SIZE_OPTIONS = [
  { dimensions: '2048×2048', ratio: 'Square' },
  { dimensions: '2560×1440', ratio: 'Wide' },
  { dimensions: '2304×1728', ratio: 'Landscape' },
  { dimensions: '2496×1664', ratio: 'Classic' },
  { dimensions: '3024×1296', ratio: 'Ultrawide' },
  { dimensions: '1440×2560', ratio: 'Tall' },
  { dimensions: '1728×2304', ratio: 'Portrait' },
  { dimensions: '1664×2496', ratio: 'Photo' },
];

export default function Home() {
  // Use custom hooks
  const { apiKey, setApiKey, hasApiKey } = useApiKey();
  const { selectedModel, setSelectedModel } = useModelSelection();

  // Image generation hooks
  const {
    generate: generateImage,
    isGenerating: isGeneratingImage,
    error: imageError,
    result: imageResult,
    clearResult: clearImageResult
  } = useGeneration();

  // Video generation hooks
  const {
    generate: generateVideo,
    isGenerating: isGeneratingVideo,
    taskStatus: videoTaskStatus,
    progress: videoProgress,
    error: videoError,
    result: videoResult,
    clearResult: clearVideoResult,
  } = useVideoGeneration();

  // Determine media type from selected model
  const mediaType: MediaType = getMediaType(selectedModel);
  const isVideo = isVideoModel(selectedModel);

  // UI state - unified mode that works for both image and video
  const [mode, setMode] = React.useState<UnifiedMode>('text');

  // Image generation parameters
  const [prompt, setPrompt] = React.useState('');
  const [size, setSize] = React.useState('2048×2048');
  const [quality, setQuality] = React.useState<Quality>('standard');
  const [batchMode, setBatchMode] = React.useState(false);
  const [maxImages, setMaxImages] = React.useState(15);
  const [referenceImages, setReferenceImages] = React.useState<ImageFile[]>([]);

  // Video generation parameters
  const [videoDuration, setVideoDuration] = React.useState<VideoDuration>(-1); // Auto
  const [videoResolution, setVideoResolution] = React.useState<VideoResolution>('720p');
  const [videoRatio, setVideoRatio] = React.useState<VideoRatio>('adaptive');
  const [audioEnabled, setAudioEnabled] = React.useState(true);
  const [serviceTier, setServiceTier] = React.useState<VideoServiceTier>('default');
  const [returnLastFrame, setReturnLastFrame] = React.useState(false);
  const [videoImages, setVideoImages] = React.useState<VideoImageFile[]>([]);
  const [videoModelId, setVideoModelId] = React.useState<string | undefined>(undefined); // Optional custom model ID

  // Calculate reference image count for batch constraints
  const referenceImageCount = referenceImages.filter(img => img.validation.valid).length;
  const videoImageCount = videoImages.filter(img => img.validationStatus === 'valid').length;

  // Handle model switch - map mode and clear state
  React.useEffect(() => {
    const newMediaType = getMediaType(selectedModel);
    const newMode = mapModeOnModelSwitch(mode, newMediaType);

    if (newMode !== mode) {
      setMode(newMode);
    }

    // Clear results when switching models
    clearImageResult();
    clearVideoResult();
  }, [selectedModel]);

  // Clear uploaded images and reset batch settings when switching modes
  React.useEffect(() => {
    if (isVideo) {
      // Cleanup video image URLs
      videoImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
      setVideoImages([]);
    } else {
      // Cleanup image URLs
      referenceImages.forEach(img => URL.revokeObjectURL(img.preview));
      setReferenceImages([]);

      // For multi-batch mode, batch is always enabled
      if (mode === 'multi-batch') {
        setBatchMode(true);
        setMaxImages(3);
      } else {
        setBatchMode(false);
      }
    }
  }, [mode, isVideo]);

  // Handle image generation
  const handleImageGenerate = async () => {
    if (!prompt || !hasApiKey) return;

    let images: string[] | undefined;
    const validImages = referenceImages.filter(img => img.validation.valid);

    if (validImages.length > 0) {
      const base64Images = await filesToBase64(validImages.map(img => img.file));
      images = base64Images;
    }

    const apiSize = size.replace('×', 'x');

    await generateImage({
      apiKey,
      prompt,
      mode: mode as GenerationMode,
      model: selectedModel as any,
      images,
      size: apiSize,
      quality,
      batchMode,
      maxImages: batchMode ? maxImages : undefined,
    });
  };

  // Handle video generation
  const handleVideoGenerate = async () => {
    if (!prompt || !hasApiKey) return;

    // Convert video images to base64
    const validImages = videoImages.filter(img => img.validationStatus === 'valid');
    const videoImageInputs = await Promise.all(
      validImages.map(async (img) => {
        const reader = new FileReader();
        return new Promise<{ url: string; role?: any }>((resolve) => {
          reader.onload = () => {
            resolve({
              url: reader.result as string,
              role: img.role,
            });
          };
          reader.readAsDataURL(img.file);
        });
      })
    );

    await generateVideo({
      apiKey,
      prompt,
      mode: mode as VideoMode,
      images: videoImageInputs.length > 0 ? videoImageInputs : undefined,
      duration: videoDuration,
      resolution: videoResolution,
      ratio: videoRatio,
      generateAudio: audioEnabled,
      serviceTier,
      returnLastFrame,
      modelId: videoModelId,
    });
  };

  const handleGenerate = isVideo ? handleVideoGenerate : handleImageGenerate;
  const isGenerating = isVideo ? isGeneratingVideo : isGeneratingImage;
  const error = isVideo ? videoError : imageError;
  const result = isVideo ? videoResult : imageResult;
  const clearResult = isVideo ? clearVideoResult : clearImageResult;

  return (
    <div className="min-h-screen flex flex-col">
      <Header selectedModel={selectedModel} onModelChange={setSelectedModel} />

      {/* API Preview Panel - Floating on the right */}
      <ApiPreviewPanel
        mode={mode}
        prompt={prompt}
        size={size}
        quality={quality}
        batchMode={batchMode}
        maxImages={maxImages}
        referenceImageUrls={
          isVideo
            ? videoImages.filter(img => img.validationStatus === 'valid').map(() => '[base64 image data]')
            : referenceImages.filter(img => img.validation.valid).map(() => '[base64 image data]')
        }
        model={selectedModel}
      />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto space-y-8"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center space-y-4 py-8">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              {isVideo ? 'Create Amazing Videos' : 'Create Amazing Images'}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your ideas into stunning {isVideo ? 'videos' : 'visuals'} with{' '}
              <span className={`bg-gradient-to-r ${isVideo ? 'from-green-500 to-teal-500' : 'from-ocean-500 to-dream-500'} bg-clip-text text-transparent font-semibold`}>
                {isVideo ? 'Seedance 1.5 Pro' : `Seedream ${selectedModel === 'seedream-4-0' ? '4.0' : '4.5'}`}
              </span>
            </p>
          </motion.div>

          {/* API Key Setup */}
          <motion.div variants={itemVariants}>
            <ApiKeySetup
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
              model={selectedModel}
              onVideoModelIdChange={setVideoModelId}
            />
          </motion.div>

          {/* Mode Tabs */}
          <motion.div variants={itemVariants}>
            <ModeTabs mode={mode} onModeChange={setMode} mediaType={mediaType} />
          </motion.div>

          {/* Content Area - Mode-specific components */}
          <motion.div
            variants={itemVariants}
            className="rounded-xl border border-border bg-card p-6 sm:p-8"
          >
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {isGenerating ? (
                <LoadingState />
              ) : result ? (
                <div className="space-y-8">
                  {isVideo && videoResult ? (
                    <VideoOutput result={videoResult} onGenerateAnother={clearResult} />
                  ) : imageResult ? (
                    <>
                      <GenerationOutput
                        images={imageResult.images}
                        generationTimeMs={0}
                        prompt={imageResult.prompt}
                        mode={imageResult.mode}
                        model={imageResult.model}
                        size={imageResult.parameters.size}
                        quality={imageResult.parameters.quality}
                        batchMode={imageResult.parameters.batchMode}
                        maxImages={imageResult.parameters.maxImages}
                        referenceImageUrls={imageResult.referenceImageUrls}
                      />
                      <motion.button
                        onClick={clearResult}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full rounded-xl border-2 border-ocean-500/30 bg-gradient-to-r from-ocean-500/10 to-dream-500/10 px-8 py-4 text-base font-semibold hover:border-ocean-500/50 transition-all"
                      >
                        Generate Another
                      </motion.button>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Upload zones - conditional based on media type */}
                  {isVideo && isVideoMode(mode) ? (
                    <VideoUploadZone
                      mode={mode}
                      images={videoImages}
                      onImagesChange={setVideoImages}
                    />
                  ) : (
                    <>
                      {(mode === 'image' || mode === 'multi-image' || mode === 'multi-batch') && (
                        <ImageUploadZone
                          images={referenceImages}
                          onChange={setReferenceImages}
                          maxImages={mode === 'image' ? 1 : undefined}
                          mode={mode === 'image' ? 'single' : 'multi'}
                          model={selectedModel as any}
                        />
                      )}

                      {mode === 'multi-batch' && (
                        <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400">Multi-Image to Batch Generation</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Upload 2-14 reference images, then describe what variations to generate.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Batch Mode Toggle - only for image generation */}
                  {!isVideo && mode !== 'multi-batch' && (
                    <BatchModeToggle
                      mode={mode as GenerationMode}
                      referenceImageCount={referenceImageCount}
                      batchEnabled={batchMode}
                      maxImages={maxImages}
                      onBatchEnabledChange={setBatchMode}
                      onMaxImagesChange={setMaxImages}
                    />
                  )}

                  {/* Prompt Input */}
                  <PromptInput value={prompt} onChange={setPrompt} mode={mode} model={selectedModel} />

                  {/* Parameters - conditional based on media type */}
                  {isVideo ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <VideoSizeSelector
                          resolution={videoResolution}
                          ratio={videoRatio}
                          onResolutionChange={setVideoResolution}
                          onRatioChange={setVideoRatio}
                        />
                        <DurationSelector value={videoDuration} onChange={setVideoDuration} />
                      </div>
                      <AudioToggle enabled={audioEnabled} onChange={setAudioEnabled} />
                      <AdvancedOptions
                        serviceTier={serviceTier}
                        returnLastFrame={returnLastFrame}
                        onServiceTierChange={setServiceTier}
                        onReturnLastFrameChange={setReturnLastFrame}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <SizeSelector value={size} onChange={setSize} model={selectedModel as any} />
                      <div className="space-y-8">
                        <QualityToggle value={quality} onChange={setQuality} />
                      </div>
                    </div>
                  )}

                  {/* Generate Button */}
                  <div className="pt-4 space-y-3">
                    {(() => {
                      const needsImages = !isVideo && (
                        (mode === 'multi-batch' && referenceImageCount < 2) ||
                        ((mode === 'image' || mode === 'multi-image') && referenceImageCount < (mode === 'image' ? 1 : 2))
                      );

                      const needsVideoImages = isVideo && (
                        (mode === 'image-to-video-first' && videoImageCount < 1) ||
                        (mode === 'image-to-video-frames' && videoImageCount < 2) ||
                        (mode === 'image-to-video-ref' && videoImageCount < 1)
                      );

                      const isDisabled = !prompt || !hasApiKey || needsImages || needsVideoImages;

                      return (
                        <>
                          <motion.button
                            onClick={handleGenerate}
                            disabled={isDisabled}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full rounded-xl bg-gradient-to-r ${isVideo ? 'from-green-500 to-teal-500' : 'from-ocean-500 to-dream-500'} px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group`}
                          >
                            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            <span className="relative flex items-center justify-center gap-2">
                              <span>
                                {isVideo ? 'Generate Video' : mode === 'multi-batch' || batchMode ? `Generate ${maxImages} Image${maxImages > 1 ? 's' : ''}` : 'Generate Image'}
                              </span>
                              {prompt && hasApiKey && !isDisabled && (
                                <motion.span
                                  initial={{ rotate: 0 }}
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                  className="inline-block"
                                >
                                  ✨
                                </motion.span>
                              )}
                            </span>
                          </motion.button>

                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                            >
                              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                {error}
                              </p>
                            </motion.div>
                          )}

                          {!error && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-center text-muted-foreground"
                            >
                              {!hasApiKey
                                ? 'Enter your API key above to get started'
                                : needsImages || needsVideoImages
                                  ? 'Upload required images for this mode'
                                  : !prompt
                                    ? 'Write a prompt to begin'
                                    : null}
                            </motion.p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Stats/Info Section */}
          {!isVideo && (
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {[
                {
                  label: 'Quality',
                  value: quality === 'standard' ? 'Standard' : 'Fast',
                  description: quality === 'standard' ? 'Higher quality' : 'Faster generation',
                  gradient: 'from-purple-500/10 to-purple-500/5'
                },
                {
                  label: 'Size',
                  value: size,
                  description: SIZE_OPTIONS.find(opt => opt.dimensions === size)?.ratio || 'Custom',
                  gradient: 'from-ocean-500/10 to-ocean-500/5'
                },
                {
                  label: 'Mode',
                  value: batchMode ? 'Batch' : 'Single',
                  description: batchMode ? `Up to ${maxImages} images` : 'One image',
                  gradient: 'from-dream-500/10 to-dream-500/5'
                },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${stat.gradient} p-5 text-center cursor-default`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-ocean-500/0 to-dream-500/0 group-hover:from-ocean-500/5 group-hover:to-dream-500/5 transition-all duration-300" />
                  <div className="relative">
                    <div className="text-sm font-medium text-muted-foreground mb-2">{stat.label}</div>
                    <div className="text-2xl font-bold mb-1 bg-gradient-to-r from-ocean-500 to-dream-500 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-xs text-muted-foreground/80">{stat.description}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="border-t border-border/40 py-8 mt-auto bg-muted/30"
      >
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                Powered by{' '}
                <motion.a
                  href="https://www.byteplus.com/en/product/seedream-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 ${isVideo ? 'text-green-500 hover:text-teal-500' : 'text-ocean-500 hover:text-dream-500'} font-medium transition-colors`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {isVideo ? 'BytePlus Seedance 1.5 Pro' : `BytePlus Seedream ${selectedModel === 'seedream-4-0' ? '4.0' : '4.5'}`}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </motion.a>
              </p>

              <div className="flex items-center gap-4">
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-muted border border-border rounded">
                  <span className="text-[10px]">⌘</span>
                  <span>K</span>
                </kbd>
                <p className="flex items-center gap-2">
                  Built with{' '}
                  <motion.span
                    className="text-red-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    ❤
                  </motion.span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
              <span>v1.0.0</span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

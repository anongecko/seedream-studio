'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { ModeTabs } from '@/components/studio/mode-tabs';
import { ApiKeySetup } from '@/components/studio/api-key-setup';
import { LoadingState } from '@/components/studio/loading-snake';
import { PromptInput } from '@/components/studio/prompt-input';
import { SizeSelector } from '@/components/studio/size-selector';
import { QualityToggle } from '@/components/studio/quality-toggle';
import { BatchModeToggle } from '@/components/studio/batch-mode-toggle';
import { ApiPreviewPanel } from '@/components/studio/api-preview-panel';
import { ImageUrlInput, MultiImageInput } from '@/components/studio/image-url-input';
import { GenerationOutput } from '@/components/studio/generation-output';
import { useApiKey } from '@/hooks/use-api-key';
import { useGeneration } from '@/hooks/use-generation';
import type { GenerationMode, Quality } from '@/types/api';

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

// Size options for stats display
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
  const { generate, isGenerating, error, result, clearResult } = useGeneration();

  // UI state
  const [mode, setMode] = React.useState<GenerationMode>('text');

  // Generation parameters
  const [prompt, setPrompt] = React.useState('');
  const [size, setSize] = React.useState('2048×2048');
  const [quality, setQuality] = React.useState<Quality>('standard');
  const [batchMode, setBatchMode] = React.useState(false);
  const [maxImages, setMaxImages] = React.useState(15);
  const [referenceImageUrl, setReferenceImageUrl] = React.useState(''); // For Image to Image mode
  const [referenceImageUrls, setReferenceImageUrls] = React.useState(['', '']); // For Multi-Image mode

  // Calculate reference image count for batch constraints
  const referenceImageCount = mode === 'image' ? (referenceImageUrl ? 1 : 0) :
                               mode === 'multi-image' ? referenceImageUrls.filter(u => u).length :
                               0;

  // Handle image generation
  const handleGenerate = async () => {
    if (!prompt || !hasApiKey) return;

    // Prepare reference images based on mode
    let images: string[] | undefined;
    if (mode === 'image' && referenceImageUrl) {
      images = [referenceImageUrl];
    } else if (mode === 'multi-image') {
      const urls = referenceImageUrls.filter(url => url.trim().length > 0);
      if (urls.length > 0) {
        images = urls;
      }
    }

    // Convert size from display format (×) to API format (x)
    const apiSize = size.replace('×', 'x');

    await generate({
      apiKey,
      prompt,
      mode,
      images,
      size: apiSize,
      quality,
      batchMode,
      maxImages: batchMode ? maxImages : undefined,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* API Preview Panel - Floating on the right */}
      <ApiPreviewPanel
        mode={mode}
        prompt={prompt}
        size={size}
        quality={quality}
        batchMode={batchMode}
        maxImages={maxImages}
        referenceImageUrls={
          mode === 'image' ? (referenceImageUrl ? [referenceImageUrl] : []) :
          mode === 'multi-image' ? referenceImageUrls.filter(url => url) :
          []
        }
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
              Create Amazing Images
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your ideas into stunning visuals with{' '}
              <span className="bg-gradient-to-r from-ocean-500 to-dream-500 bg-clip-text text-transparent font-semibold">
                Seedream 4.0
              </span>
            </p>
          </motion.div>

          {/* API Key Setup */}
          <motion.div variants={itemVariants}>
            <ApiKeySetup apiKey={apiKey} onApiKeyChange={setApiKey} />
          </motion.div>

          {/* Mode Tabs */}
          <motion.div variants={itemVariants}>
            <ModeTabs mode={mode} onModeChange={setMode} />
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
                // Loading state with cute snake
                <LoadingState />
              ) : result ? (
                // Show generation result
                <div className="space-y-8">
                  <GenerationOutput
                    images={result.images}
                    generationTimeMs={0}
                    prompt={result.prompt}
                    mode={result.mode}
                    size={result.parameters.size}
                    quality={result.parameters.quality}
                    batchMode={result.parameters.batchMode}
                    maxImages={result.parameters.maxImages}
                    referenceImageUrls={
                      mode === 'image' ? (referenceImageUrl ? [referenceImageUrl] : []) :
                      mode === 'multi-image' ? referenceImageUrls.filter(url => url) :
                      []
                    }
                  />

                  {/* Generate another button */}
                  <motion.button
                    onClick={clearResult}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-xl border-2 border-ocean-500/30 bg-gradient-to-r from-ocean-500/10 to-dream-500/10 px-8 py-4 text-base font-semibold hover:border-ocean-500/50 transition-all"
                  >
                    Generate Another
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Image URL Input - Mode-specific */}
                  {mode === 'image' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-ocean-500/10 to-dream-500/10">
                          <svg className="w-4 h-4 text-ocean-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">Reference Image</h3>
                          <p className="text-xs text-muted-foreground">
                            Direct link ending in .jpg, .jpeg, or .png
                          </p>
                        </div>
                      </div>
                      <ImageUrlInput
                        value={referenceImageUrl}
                        onChange={setReferenceImageUrl}
                      />
                    </div>
                  )}

                  {mode === 'multi-image' && (
                    <MultiImageInput
                      urls={referenceImageUrls}
                      onChange={setReferenceImageUrls}
                      minImages={2}
                      maxImages={10}
                    />
                  )}

                  {/* Batch Mode Toggle */}
                  <BatchModeToggle
                    mode={mode}
                    referenceImageCount={referenceImageCount}
                    batchEnabled={batchMode}
                    maxImages={maxImages}
                    onBatchEnabledChange={setBatchMode}
                    onMaxImagesChange={setMaxImages}
                  />

                  {/* Prompt Input */}
                  <PromptInput value={prompt} onChange={setPrompt} mode={mode} />

                  {/* Parameters Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Size Selector */}
                    <SizeSelector value={size} onChange={setSize} />

                    {/* Quality Only */}
                    <div className="space-y-8">
                      <QualityToggle value={quality} onChange={setQuality} />
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="pt-4 space-y-3">
                    <motion.button
                      onClick={handleGenerate}
                      disabled={!prompt || !hasApiKey}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-xl bg-gradient-to-r from-ocean-500 to-dream-500 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
                    >
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                      <span className="relative flex items-center justify-center gap-2">
                        <span>Generate Image</span>
                        {prompt && hasApiKey && (
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

                    {/* Error message */}
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

                    {/* Helper text */}
                    {(!prompt || !hasApiKey) && !error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-center text-muted-foreground"
                      >
                        {!hasApiKey ? 'Enter your API key above to get started' : 'Write a prompt to begin'}
                      </motion.p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Stats/Info Section - Live parameter display */}
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
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ scale: 1.03, y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${stat.gradient} p-5 text-center cursor-default`}
              >
                {/* Hover gradient effect */}
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
            {/* Main footer content */}
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                Powered by{' '}
                <motion.a
                  href="https://www.byteplus.com/en/product/seedream-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-ocean-500 hover:text-dream-500 font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  BytePlus Seedream 4.0
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

            {/* Version and status */}
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

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { UnifiedMode, Quality, SeedreamRequest, SeaDreamModel } from '@/types/api';

interface ApiPreviewPanelProps {
  mode: UnifiedMode;
  prompt: string;
  size: string;
  quality: Quality;
  batchMode: boolean;
  maxImages: number;
  referenceImageUrls?: string[];
  model: SeaDreamModel;
}

export function ApiPreviewPanel({
  mode,
  prompt,
  size,
  quality,
  batchMode,
  maxImages,
  referenceImageUrls = [],
  model,
}: ApiPreviewPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Build the API request object based on selected model
  const apiRequest = React.useMemo(() => {
    const modelVersion = model === 'seedream-4-0' ? 'seedream-4-0-250828' : 'seedream-4-5-251128';
    const request: Partial<SeedreamRequest> = {
      model: modelVersion,
      prompt: prompt || '',
      sequential_image_generation: batchMode ? 'auto' : 'disabled',
      response_format: 'b64_json',
      stream: false,
      watermark: false,
    };

    // Add batch options if batch mode enabled
    if (batchMode) {
      request.sequential_image_generation_options = {
        max_images: maxImages,
      };
    }

    // Add image field based on mode
    if (mode === 'image' && referenceImageUrls.length > 0) {
      request.image = referenceImageUrls[0];
    } else if ((mode === 'multi-image' || mode === 'multi-batch') && referenceImageUrls.length > 1) {
      request.image = referenceImageUrls;
    }

    // Add optional parameters only if they differ from defaults
    if (size !== '2048x2048') {
      request.size = size.replace('×', 'x'); // Convert display format to API format
    }

    // Model-specific quality parameter handling
    if (model === 'seedream-4-0') {
      // Seedream 4.0 uses 'quality' parameter
      request.quality = quality;
    } else {
      // Seedream 4.5 uses 'optimize_prompt_options'
      request.optimize_prompt_options = {
        mode: quality,
      };
    }

    return request;
  }, [mode, prompt, size, quality, batchMode, maxImages, referenceImageUrls, model]);

  // Format JSON with custom syntax highlighting
  const formattedJson = React.useMemo(() => {
    return JSON.stringify(apiRequest, null, 2);
  }, [apiRequest]);

  // Copy to clipboard with feedback
  const handleCopy = React.useCallback(async () => {
    try {
      // Replace the placeholder with actual instruction
      const copyText = formattedJson.replace(
        '"SEEDREAM_API_KEY"',
        'process.env.SEEDREAM_API_KEY'
      );
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [formattedJson]);

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 30 }}
        whileHover={{ scale: 1.05, x: isOpen ? 0 : -4 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ${
          isOpen ? 'right-80 sm:right-96' : 'right-0'
        }`}
      >
        <div className="flex items-center gap-2 rounded-l-xl bg-gradient-to-br from-ocean-500 to-dream-500 px-3 py-3 sm:px-4 sm:py-4 text-white shadow-lg hover:shadow-xl">
          <Code2 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline text-sm font-medium">API</span>
          {isOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </div>
      </motion.button>

      {/* Sliding Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="fixed top-0 right-0 bottom-0 w-80 sm:w-96 bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl z-30 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-br from-ocean-500/5 to-dream-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-ocean-500/10 to-dream-500/10">
                    <Code2 className="w-4 h-4 text-ocean-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">API Request</h3>
                    <p className="text-xs text-muted-foreground">
                      Live preview
                    </p>
                  </div>
                </div>

                {/* Copy Button */}
                <motion.button
                  onClick={handleCopy}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 rounded-lg bg-gradient-to-br from-ocean-500/10 to-dream-500/10 hover:from-ocean-500/20 hover:to-dream-500/20 transition-all"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </motion.button>
              </div>

              {/* Code Block */}
              <div className="flex-1 overflow-auto p-6">
                <div className="rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-ocean-500/20 shadow-lg overflow-hidden">
                  {/* Code header with endpoint */}
                  <div className="px-4 py-3 bg-gradient-to-r from-ocean-500/10 to-dream-500/10 border-b border-ocean-500/20">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-mono font-semibold">
                        POST
                      </span>
                      <span className="text-muted-foreground font-mono truncate">
                        /api/v3/images/generations
                      </span>
                    </div>
                  </div>

                  {/* Syntax-highlighted JSON */}
                  <pre className="p-4 text-xs sm:text-sm overflow-x-auto">
                    <code className="font-mono leading-relaxed">
                      {formatJsonWithSyntaxHighlighting(formattedJson, prompt)}
                    </code>
                  </pre>
                </div>

                {/* Helper info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 p-4 rounded-lg bg-gradient-to-br from-ocean-500/5 to-dream-500/5 border border-border/50"
                >
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-semibold text-foreground">
                      Authorization:
                    </span>{' '}
                    Bearer token required. Set{' '}
                    <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-ocean-500">
                      SEEDREAM_API_KEY
                    </code>{' '}
                    in your environment.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Format JSON with syntax highlighting using inline styles
 * This creates beautiful, brand-themed syntax highlighting
 */
function formatJsonWithSyntaxHighlighting(json: string, prompt: string): React.ReactNode {
  const lines = json.split('\n');

  return lines.map((line, index) => {
    const trimmed = line.trim();
    let formattedLine: React.ReactNode = line;
    const indent = line.match(/^(\s*)/)?.[0] || '';

    // Brackets and braces
    if (trimmed === '{' || trimmed === '}' || trimmed === '[' || trimmed === ']' || trimmed === '},') {
      formattedLine = (
        <>
          {indent}
          <span className="text-slate-400 font-bold">{trimmed}</span>
        </>
      );
    }
    // String values (keys and values)
    else if (line.includes(': "')) {
      const match = line.match(/^(\s*)(".*?"):\s*(".*?"),?\s*$/);
      if (match) {
        const [, spaces, key, value] = match;
        const hasComma = line.trim().endsWith(',');
        formattedLine = (
          <>
            {spaces}
            <span className="text-ocean-400 font-medium">{key}</span>
            <span className="text-slate-500">: </span>
            <span className="text-emerald-400">{value}</span>
            {hasComma && <span className="text-slate-500">,</span>}
          </>
        );
      }
    }
    // String array values
    else if (line.includes('": [')) {
      const match = line.match(/^(\s*)(".*?"):\s*(\[.*?\]),?\s*$/);
      if (match) {
        const [, spaces, key, value] = match;
        const hasComma = line.trim().endsWith(',');
        formattedLine = (
          <>
            {spaces}
            <span className="text-ocean-400 font-medium">{key}</span>
            <span className="text-slate-500">: </span>
            <span className="text-amber-400">{value}</span>
            {hasComma && <span className="text-slate-500">,</span>}
          </>
        );
      }
    }
    // Boolean values
    else if (line.includes(': true') || line.includes(': false')) {
      const match = line.match(/^(\s*)(".*?"):\s*(true|false),?\s*$/);
      if (match) {
        const [, spaces, key, value] = match;
        const hasComma = line.trim().endsWith(',');
        formattedLine = (
          <>
            {spaces}
            <span className="text-ocean-400 font-medium">{key}</span>
            <span className="text-slate-500">: </span>
            <span className="text-purple-400 font-semibold">{value}</span>
            {hasComma && <span className="text-slate-500">,</span>}
          </>
        );
      }
    }
    // Number values (including negative)
    else if (line.match(/: -?\d+/)) {
      const match = line.match(/^(\s*)(".*?"):\s*(-?\d+),?\s*$/);
      if (match) {
        const [, spaces, key, value] = match;
        const hasComma = line.trim().endsWith(',');
        formattedLine = (
          <>
            {spaces}
            <span className="text-ocean-400 font-medium">{key}</span>
            <span className="text-slate-500">: </span>
            <span className="text-cyan-400 font-semibold">{value}</span>
            {hasComma && <span className="text-slate-500">,</span>}
          </>
        );
      }
    }

    return (
      <div
        key={index}
        className="hover:bg-white/5 px-2 -mx-2 rounded transition-colors duration-150"
      >
        {formattedLine}
      </div>
    );
  });
}

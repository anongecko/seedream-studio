'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Sparkles } from 'lucide-react';
import type { GenerationMode } from '@/types/api';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  mode: GenerationMode;
  className?: string;
}

const WORD_WARNING_THRESHOLD = 500;
const WORD_LIMIT_THRESHOLD = 600;

const MODE_PLACEHOLDERS = {
  text: 'Describe the image you want to create in vivid detail...',
  image: 'Describe how you want to transform the reference image...',
  'multi-image': 'Describe how you want to blend these images together...',
};

const MODE_EXAMPLES = {
  text: 'A serene mountain landscape at golden hour, with misty valleys and snow-capped peaks reflecting warm sunlight',
  image: 'Transform into a vibrant watercolor painting with soft edges and flowing colors',
  'multi-image': 'Seamlessly blend the subjects into a cohesive scene with harmonious lighting and composition',
};

export function PromptInput({ value, onChange, mode, className = '' }: PromptInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Calculate stats
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  // Warning states
  const isNearLimit = wordCount >= WORD_WARNING_THRESHOLD && wordCount < WORD_LIMIT_THRESHOLD;
  const isOverLimit = wordCount >= WORD_LIMIT_THRESHOLD;

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleInsertExample = () => {
    onChange(MODE_EXAMPLES[mode]);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Label and example button */}
        <div className="flex items-center justify-between">
          <motion.label
            htmlFor="prompt-input"
            className="flex items-center gap-2 text-sm font-semibold"
            animate={{
              color: isFocused ? 'var(--ocean-500)' : 'var(--foreground)',
            }}
            transition={{ duration: 0.2 }}
          >
            <Sparkles className={`h-4 w-4 transition-colors ${isFocused ? 'text-ocean-500' : 'text-muted-foreground'}`} />
            Your Vision
          </motion.label>

          {!value && (
            <button
              type="button"
              onClick={handleInsertExample}
              className="text-xs text-muted-foreground hover:text-ocean-500 transition-colors"
            >
              Try an example
            </button>
          )}
        </div>

        {/* Textarea container with gradient border */}
        <div className="relative">
          {/* Gradient border effect when focused */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute -inset-[1px] bg-gradient-to-r from-ocean-500 via-dream-500 to-ocean-500 rounded-xl -z-10"
                style={{
                  background: 'linear-gradient(90deg, var(--ocean-500), var(--dream-500), var(--ocean-500))',
                  backgroundSize: '200% 100%',
                }}
              />
            )}
          </AnimatePresence>

          {/* Subtle glow when focused */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                exit={{ opacity: 0 }}
                className="absolute -inset-4 bg-gradient-to-r from-ocean-500/20 to-dream-500/20 rounded-2xl blur-xl -z-20"
              />
            )}
          </AnimatePresence>

          <div className="relative rounded-xl border border-border bg-card overflow-hidden">
            {/* Background gradient on focus */}
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-br from-ocean-500/5 via-transparent to-dream-500/5 -z-10"
                />
              )}
            </AnimatePresence>

            <textarea
              ref={textareaRef}
              id="prompt-input"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={MODE_PLACEHOLDERS[mode]}
              className="w-full resize-none bg-transparent px-6 py-4 text-base leading-relaxed outline-none placeholder:text-muted-foreground/60 min-h-[120px] max-h-[400px]"
              rows={4}
            />

            {/* Stats and warnings footer */}
            <div className="flex items-center justify-between border-t border-border/50 bg-muted/30 px-6 py-3">
              <div className="flex items-center gap-4">
                {/* Warning message */}
                <AnimatePresence mode="wait">
                  {isOverLimit && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span className="font-medium">Consider shortening your prompt</span>
                    </motion.div>
                  )}
                  {isNearLimit && !isOverLimit && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Approaching recommended limit</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Counters */}
              <div className="flex items-center gap-4 text-xs">
                {/* Word counter */}
                <motion.div
                  animate={{
                    color: isOverLimit
                      ? 'rgb(234, 88, 12)'
                      : isNearLimit
                      ? 'rgb(234, 179, 8)'
                      : 'var(--muted-foreground)',
                  }}
                  className="flex items-center gap-1.5 font-medium"
                >
                  <span>{wordCount}</span>
                  <span className="text-muted-foreground/60">
                    {wordCount === 1 ? 'word' : 'words'}
                  </span>
                </motion.div>

                <span className="text-muted-foreground/40">•</span>

                {/* Character counter */}
                <div className="text-muted-foreground/80">
                  <span className="font-medium">{charCount}</span>
                  <span className="text-muted-foreground/60 ml-1">
                    {charCount === 1 ? 'char' : 'chars'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Helper text */}
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xs text-muted-foreground/80 flex items-center gap-1.5"
        >
          <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/40" />
          Seedream 4.0 works best with prompts under 600 words
        </motion.p>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Check, AlertCircle, Link as LinkIcon, X, Plus } from 'lucide-react';

interface ImageUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  index?: number;
  totalCount?: number;
  autoFocus?: boolean;
}

export function ImageUrlInput({
  value,
  onChange,
  onRemove,
  showRemove = false,
  index = 0,
  autoFocus = false,
}: ImageUrlInputProps) {
  const [isValidating, setIsValidating] = React.useState(false);
  const [validationState, setValidationState] = React.useState<'valid' | 'invalid' | 'idle'>('idle');

  // Validate URL format
  const validateUrl = React.useCallback((url: string) => {
    if (!url) {
      setValidationState('idle');
      return;
    }

    setIsValidating(true);

    // Check if it's a valid URL
    try {
      const urlObj = new URL(url);
      const lowerUrl = url.toLowerCase();

      // Extract pathname without query parameters
      const pathname = urlObj.pathname.toLowerCase();

      // Seedream 4.5: Expanded format support - jpeg, jpg, png, webp, bmp, tiff, gif
      const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif', '.gif'];
      const isDirectImage = supportedFormats.some(ext =>
        pathname.endsWith(ext) || lowerUrl.includes(ext)
      );

      if (isDirectImage) {
        setValidationState('valid');
      } else {
        setValidationState('invalid');
      }
    } catch {
      setValidationState('invalid');
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Debounced validation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      validateUrl(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value, validateUrl]);

  // Open preview in new tab
  const handlePreview = () => {
    if (value && validationState === 'valid') {
      window.open(value, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      <div className="flex items-center gap-2">
        {/* URL Input */}
        <div className="flex-1 relative">
          <div className={`relative rounded-xl border-2 transition-all duration-300 ${
            validationState === 'valid'
              ? 'border-green-500/50 bg-green-500/5'
              : validationState === 'invalid'
              ? 'border-red-500/50 bg-red-500/5'
              : 'border-border bg-background hover:border-ocean-500/30'
          }`}>
            {/* Link icon */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <LinkIcon className={`w-4 h-4 transition-colors ${
                validationState === 'valid'
                  ? 'text-green-500'
                  : validationState === 'invalid'
                  ? 'text-red-500'
                  : 'text-muted-foreground'
              }`} />
            </div>

            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              autoFocus={autoFocus}
              className="w-full pl-10 pr-12 py-3 bg-transparent text-sm placeholder:text-muted-foreground/50 outline-none"
            />

            {/* Validation indicator */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AnimatePresence mode="wait">
                {isValidating && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="w-4 h-4 border-2 border-ocean-500 border-t-transparent rounded-full animate-spin"
                  />
                )}
                {!isValidating && validationState === 'valid' && (
                  <motion.div
                    key="valid"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Check className="w-4 h-4 text-green-500" />
                  </motion.div>
                )}
                {!isValidating && validationState === 'invalid' && (
                  <motion.div
                    key="invalid"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {validationState === 'invalid' && value && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs text-red-500 mt-1.5 ml-1 space-y-0.5"
              >
                <p className="font-medium">⚠️ Direct image link required</p>
                <p className="text-red-400">URL must contain .jpg, .jpeg, .png, .webp, .bmp, .tiff, or .gif (not a webpage)</p>
                <p className="text-red-400/80 text-[10px]">Tip: Use direct links like image.png or image.png?raw=1</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview button */}
        <motion.button
          onClick={handlePreview}
          disabled={validationState !== 'valid'}
          whileHover={{ scale: validationState === 'valid' ? 1.05 : 1 }}
          whileTap={{ scale: validationState === 'valid' ? 0.95 : 1 }}
          className={`p-3 rounded-xl border-2 transition-all ${
            validationState === 'valid'
              ? 'border-ocean-500/50 bg-gradient-to-br from-ocean-500/10 to-dream-500/10 hover:from-ocean-500/20 hover:to-dream-500/20 text-ocean-500'
              : 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
          }`}
          title="Preview image"
        >
          <Eye className="w-4 h-4" />
        </motion.button>

        {/* Remove button */}
        {showRemove && onRemove && (
          <motion.button
            onClick={onRemove}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-xl border-2 border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-all"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

interface MultiImageInputProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  minImages?: number;
  maxImages?: number;
}

export function MultiImageInput({
  urls,
  onChange,
  minImages = 2,
  maxImages = 14, // Seedream 4.5: Max 14 reference images (was 10)
}: MultiImageInputProps) {
  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    onChange(newUrls);
  };

  const handleRemove = (index: number) => {
    if (urls.length > minImages) {
      const newUrls = urls.filter((_, i) => i !== index);
      onChange(newUrls);
    }
  };

  const handleAdd = () => {
    if (urls.length < maxImages) {
      onChange([...urls, '']);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-ocean-500/10 to-dream-500/10">
            <LinkIcon className="w-4 h-4 text-ocean-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Reference Images</h3>
            <p className="text-xs text-muted-foreground">
              {urls.length} of {maxImages} images
            </p>
          </div>
        </div>

        {/* Add button */}
        {urls.length < maxImages && (
          <motion.button
            onClick={handleAdd}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-ocean-500/10 to-dream-500/10 hover:from-ocean-500/20 hover:to-dream-500/20 text-sm font-medium text-ocean-500 transition-all border border-ocean-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Image
          </motion.button>
        )}
      </div>

      {/* Important notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"
      >
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-amber-500/20 mt-0.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 space-y-1.5">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
              ⚠️ Direct Image Links Required (Not Webpages!)
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-200/80 leading-relaxed">
              URLs must contain image extensions: <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono">.jpg</code>,{' '}
              <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono">.png</code>,{' '}
              <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono">.webp</code>,{' '}
              <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono">.bmp</code>,{' '}
              <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono">.tiff</code>, or{' '}
              <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono">.gif</code>
              <span className="text-amber-700 dark:text-amber-300"> (query params like ?raw=1 are OK)</span>
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300/70 leading-relaxed">
              💡 <strong>Examples:</strong> image.png, image.jpg?raw=1, cdn.com/photo.jpeg
            </p>
          </div>
        </div>
      </motion.div>

      {/* URL inputs */}
      <div className="space-y-3">
        {urls.map((url, index) => (
          <ImageUrlInput
            key={index}
            value={url}
            onChange={(value) => handleUrlChange(index, value)}
            onRemove={() => handleRemove(index)}
            showRemove={urls.length > minImages}
            index={index}
            totalCount={urls.length}
            autoFocus={index === urls.length - 1 && index > 0}
          />
        ))}
      </div>
    </div>
  );
}

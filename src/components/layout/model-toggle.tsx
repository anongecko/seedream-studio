'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import type { SeedreamModel } from '@/types/api';

interface ModelToggleProps {
  selectedModel: SeedreamModel;
  onModelChange: (model: SeedreamModel) => void;
}

export function ModelToggle({ selectedModel, onModelChange }: ModelToggleProps) {
  const models = [
    {
      id: 'seedream-4-5' as const,
      label: '4.5',
      description: 'Censored',
      color: 'from-blue-500 to-purple-500',
      badgeColor: 'border-blue-500/50 text-blue-600 dark:text-blue-400',
      isDefault: true,
    },
    {
      id: 'seedream-4-0' as const,
      label: '4.0',
      description: 'Uncensored',
      color: 'from-red-500 to-orange-500',
      badgeColor: 'border-orange-500/50 text-orange-600 dark:text-orange-400',
      isDefault: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex items-center gap-3"
    >
      <div className="flex items-center rounded-xl bg-muted/50 border border-border/50 p-1.5 shadow-sm backdrop-blur-sm">
        {models.map((model) => (
          <motion.div
            key={model.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant={selectedModel === model.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onModelChange(model.id)}
              className={`relative px-5 py-2.5 text-xs font-medium transition-all duration-200 rounded-lg ${
                selectedModel === model.id
                  ? `bg-gradient-to-r ${model.color} text-white shadow-lg border-0`
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <div className="flex flex-col items-center gap-1 min-w-[48px]">
                <span className="text-sm font-bold leading-none">v{model.label}</span>
                <span className="text-[10px] opacity-75 leading-none">{model.description}</span>
              </div>
              {selectedModel === model.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 rounded-lg bg-white/10"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Dynamic badge showing current model status */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedModel}
          initial={{ opacity: 0, scale: 0.8, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 10 }}
          transition={{ duration: 0.2 }}
        >
          <Badge
            variant="outline"
            className={`text-xs px-3 py-1 font-medium ${
              models.find(m => m.id === selectedModel)?.badgeColor
            } border backdrop-blur-sm bg-background/50`}
          >
            {selectedModel === 'seedream-4-0' ? 'No restrictions' : 'Content filtered'}
          </Badge>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
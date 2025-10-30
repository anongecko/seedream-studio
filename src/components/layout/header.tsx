'use client';

import * as React from 'react';
import { Waves, Sparkles } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { motion } from 'framer-motion';

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3 cursor-default select-none"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="relative">
            {/* Glow effect on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-ocean-500 to-dream-500 rounded-lg blur-lg opacity-0"
              whileHover={{ opacity: 0.4 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-ocean-500 to-dream-500 shadow-lg"
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Waves className="h-5 w-5 text-white" />
            </motion.div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-none tracking-tight">
              Sea<span className="bg-gradient-to-r from-ocean-500 to-dream-500 bg-clip-text text-transparent">Dream</span>
            </h1>
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">Studio</p>
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-3 w-3 text-dream-500" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Right side - Theme Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}

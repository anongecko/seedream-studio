'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Determine actual theme (resolve 'system')
  const actualTheme = React.useMemo(() => {
    if (!mounted) return 'light';
    if (theme !== 'system') return theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-lg border border-input bg-transparent" />
    );
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="Toggle theme"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        initial={false}
        animate={{
          scale: actualTheme === 'dark' ? 0 : 1,
          rotate: actualTheme === 'dark' ? 90 : 0,
          opacity: actualTheme === 'dark' ? 0 : 1,
        }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Sun className="h-4 w-4" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          scale: actualTheme === 'dark' ? 1 : 0,
          rotate: actualTheme === 'dark' ? 0 : -90,
          opacity: actualTheme === 'dark' ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Moon className="h-4 w-4" />
      </motion.div>
    </motion.button>
  );
}

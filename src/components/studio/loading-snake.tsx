'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface LoadingSnakeProps {
  size?: number;
  className?: string;
}

/**
 * Cute snake chasing its tail - branded loading animation
 * Uses ocean-500 and dream-500 gradient colors
 */
export function LoadingSnake({ size = 120, className = '' }: LoadingSnakeProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Rotating container */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {/* Snake body - circular path */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Glow effect */}
          <defs>
            <linearGradient id="snakeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0087ff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#00b8d4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00e6b8" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Snake tail (thinner end) */}
          <motion.path
            d="M 60 10 Q 90 15 100 40"
            stroke="url(#snakeGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            filter="url(#glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />

          {/* Snake body (main circular path) */}
          <motion.circle
            cx="60"
            cy="60"
            r="40"
            stroke="url(#snakeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="251.2"
            strokeDashoffset="62.8" // Shows 3/4 of the circle
            filter="url(#glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />

          {/* Snake head */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6, type: 'spring', stiffness: 200 }}
          >
            {/* Head circle with gradient */}
            <circle cx="60" cy="15" r="8" fill="url(#snakeGradient)" filter="url(#glow)" />

            {/* Eyes */}
            <circle cx="57" cy="13" r="1.5" fill="white" />
            <circle cx="63" cy="13" r="1.5" fill="white" />

            {/* Pupils */}
            <motion.circle
              cx="57"
              cy="13"
              r="0.8"
              fill="#1a1a1a"
              animate={{ cx: [57, 57.5, 57] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            <motion.circle
              cx="63"
              cy="13"
              r="0.8"
              fill="#1a1a1a"
              animate={{ cx: [63, 63.5, 63] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />

            {/* Tongue (playful detail) */}
            <motion.path
              d="M 60 18 L 58 22 M 60 18 L 62 22"
              stroke="#ff6b9d"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.g>
        </svg>
      </motion.div>

      {/* Center text (optional) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-xs font-medium text-muted-foreground"
        >
          {/* Can add text here if needed */}
        </motion.div>
      </div>
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * Full loading state component with snake and message
 */
export function LoadingState({ message = 'Creating your masterpiece...', className = '' }: LoadingStateProps) {
  const messages = [
    'Creating your masterpiece...',
    'Mixing colors and dreams...',
    'Bringing pixels to life...',
    'Weaving digital magic...',
    'Almost there...',
  ];

  const [currentMessage, setCurrentMessage] = React.useState(message);

  React.useEffect(() => {
    // Cycle through messages every 4 seconds
    const interval = setInterval(() => {
      setCurrentMessage((prev) => {
        const currentIndex = messages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % messages.length;
        return messages[nextIndex];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center gap-6 py-12 ${className}`}>
      <LoadingSnake size={120} />
      <motion.p
        key={currentMessage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
        className="text-base font-medium text-muted-foreground text-center max-w-xs"
      >
        {currentMessage}
      </motion.p>
    </div>
  );
}

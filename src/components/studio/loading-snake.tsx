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
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Main gradient for snake body */}
            <linearGradient id="snakeBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0087ff" />
              <stop offset="50%" stopColor="#00b8d4" />
              <stop offset="100%" stopColor="#00e6b8" />
            </linearGradient>

            {/* Head gradient (brighter) */}
            <linearGradient id="snakeHeadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00a3ff" />
              <stop offset="100%" stopColor="#00ffcc" />
            </linearGradient>

            {/* Glow effect */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Stronger glow for head */}
            <filter id="headGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Snake body segments - segmented circular path */}
          <motion.circle
            cx="60"
            cy="60"
            r="35"
            stroke="url(#snakeBodyGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="15 8"
            filter="url(#glow)"
            initial={{ opacity: 0, strokeDashoffset: 0 }}
            animate={{
              opacity: 1,
              strokeDashoffset: [0, 23],
            }}
            transition={{
              opacity: { duration: 0.5 },
              strokeDashoffset: { duration: 1.5, repeat: Infinity, ease: 'linear' }
            }}
          />

          {/* Tail taper - gets thinner at the end */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Tail segment 1 (thinnest) */}
            <motion.path
              d="M 60 25 A 35 35 0 0 1 85.71 39.29"
              stroke="url(#snakeBodyGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              filter="url(#glow)"
              opacity="0.7"
            />

            {/* Tail segment 2 */}
            <motion.path
              d="M 85.71 39.29 A 35 35 0 0 1 95.71 60"
              stroke="url(#snakeBodyGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
              filter="url(#glow)"
              opacity="0.85"
            />
          </motion.g>

          {/* Snake head - positioned clearly ahead of body */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.4,
              type: 'spring',
              stiffness: 260,
              damping: 20
            }}
          >
            {/* Neck connector for smooth transition */}
            <motion.circle
              cx="60"
              cy="25"
              r="6"
              fill="url(#snakeBodyGradient)"
              filter="url(#glow)"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Head - larger and positioned above the body */}
            <motion.ellipse
              cx="60"
              cy="15"
              rx="10"
              ry="11"
              fill="url(#snakeHeadGradient)"
              filter="url(#headGlow)"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Head outline for depth */}
            <ellipse
              cx="60"
              cy="15"
              rx="10"
              ry="11"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity="0.3"
            />

            {/* Eye whites */}
            <ellipse cx="56" cy="14" rx="2.5" ry="3" fill="white" />
            <ellipse cx="64" cy="14" rx="2.5" ry="3" fill="white" />

            {/* Pupils with animation */}
            <motion.circle
              cx="56"
              cy="14.5"
              r="1.2"
              fill="#1a1a1a"
              animate={{
                cx: [56, 56.5, 56],
                cy: [14.5, 14.2, 14.5]
              }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.5 }}
            />
            <motion.circle
              cx="64"
              cy="14.5"
              r="1.2"
              fill="#1a1a1a"
              animate={{
                cx: [64, 64.5, 64],
                cy: [14.5, 14.2, 14.5]
              }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.5 }}
            />

            {/* Eye highlights for life */}
            <circle cx="56.5" cy="13.5" r="0.6" fill="white" opacity="0.8" />
            <circle cx="64.5" cy="13.5" r="0.6" fill="white" opacity="0.8" />

            {/* Nostrils */}
            <circle cx="57" cy="17.5" r="0.8" fill="#006acc" opacity="0.4" />
            <circle cx="63" cy="17.5" r="0.8" fill="#006acc" opacity="0.4" />

            {/* Forked tongue with animation */}
            <motion.g
              animate={{
                y: [0, 1, 0],
                opacity: [1, 0.7, 1]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M 60 20 L 60 24 L 58 26 M 60 24 L 62 26"
                stroke="#ff6b9d"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />
            </motion.g>

            {/* Cute smile/mouth detail */}
            <path
              d="M 56 18 Q 60 19 64 18"
              stroke="#006acc"
              strokeWidth="0.8"
              strokeLinecap="round"
              fill="none"
              opacity="0.3"
            />
          </motion.g>

          {/* Body pattern details - scales */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {/* Scale pattern circles along the body */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x = 60 + 35 * Math.cos(rad - Math.PI / 2);
              const y = 60 + 35 * Math.sin(rad - Math.PI / 2);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2"
                  fill="white"
                  opacity="0.2"
                />
              );
            })}
          </motion.g>
        </svg>
      </motion.div>

      {/* Center text (optional) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
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

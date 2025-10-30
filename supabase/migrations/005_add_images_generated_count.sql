-- Migration: Add images_generated count column
-- Date: 2025-10-28
-- Description: Track how many images were generated without storing the actual images

-- Add column to track image count
ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS images_generated INTEGER NOT NULL DEFAULT 1;

-- Add check constraint to ensure positive count
ALTER TABLE generations
  ADD CONSTRAINT check_images_generated_positive
  CHECK (images_generated > 0);

-- Add comment
COMMENT ON COLUMN generations.images_generated IS
  'Number of images generated (1 for single, 2+ for batch). Images themselves are NOT stored.';

-- Migration: Add batch generation support and remove seed parameter
-- Date: 2025-10-27
-- Description:
--   1. Remove seed column (not supported by Seedream 4.0)
--   2. Remove output_size and image_data (replaced with output_images)
--   3. Add batch_mode boolean
--   4. Add max_images for batch constraints
--   5. Add output_images JSONB array to store multiple images

-- Drop old columns
ALTER TABLE generations
  DROP COLUMN IF EXISTS seed,
  DROP COLUMN IF EXISTS output_size,
  DROP COLUMN IF EXISTS image_data;

-- Add new columns for batch support
ALTER TABLE generations
  ADD COLUMN batch_mode BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN max_images INTEGER,
  ADD COLUMN output_images JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add index for batch queries
CREATE INDEX IF NOT EXISTS idx_generations_batch_mode ON generations(batch_mode);

-- Add check constraint: max_images only relevant when batch_mode is true
ALTER TABLE generations
  ADD CONSTRAINT check_max_images_with_batch
  CHECK (
    (batch_mode = false AND max_images IS NULL) OR
    (batch_mode = true AND max_images IS NOT NULL AND max_images >= 1 AND max_images <= 15)
  );

-- Add comment explaining output_images structure
COMMENT ON COLUMN generations.output_images IS
  'JSON array of generated images. Each element: {b64_json: string, size: string}';

-- Update existing records to have empty output_images array if needed
UPDATE generations SET output_images = '[]'::jsonb WHERE output_images IS NULL;

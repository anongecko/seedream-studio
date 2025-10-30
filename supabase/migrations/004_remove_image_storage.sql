-- Migration: Remove image storage from database
-- Date: 2025-10-28
-- Description: Drop output_images column to stop storing base64 image data
-- Images are displayed immediately in the UI and can be downloaded, no need to store them

-- Drop the output_images column
ALTER TABLE generations
  DROP COLUMN IF EXISTS output_images;

-- Add comment to clarify this table stores metadata only
COMMENT ON TABLE generations IS
  'Stores generation metadata only. Images are NOT stored in database - they are displayed immediately from API response and users can download them.';

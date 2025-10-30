-- Add image_data column to store base64 encoded images
-- This allows us to build a showcase/gallery page later
ALTER TABLE generations ADD COLUMN image_data TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN generations.image_data IS 'Base64 encoded image data for showcase/gallery features. Large field (~5-15MB per 4K image).';

-- Create index on created_at for efficient gallery queries
CREATE INDEX IF NOT EXISTS idx_generations_created_desc ON generations(created_at DESC);

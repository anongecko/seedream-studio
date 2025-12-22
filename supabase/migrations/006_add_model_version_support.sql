-- Migration: Add model_version support for Seedream 4.0 and 4.5
-- Date: 2025-12-18
-- Description: Add model_version column to support both Seedream 4.0 (uncensored) and 4.5 (censored)

-- Add model_version column
ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS model_version TEXT NOT NULL DEFAULT 'seedream-4-5';

-- Add check constraint for valid model versions
ALTER TABLE generations
  ADD CONSTRAINT check_valid_model_version
  CHECK (model_version IN ('seedream-4-0', 'seedream-4-5'));

-- Add index for model queries
CREATE INDEX IF NOT EXISTS idx_generations_model_version ON generations(model_version);

-- Update existing records to specify they were generated with 4.5 (since that's what was previously used)
UPDATE generations SET model_version = 'seedream-4-5' WHERE model_version = 'seedream-4-5';

-- Add comment
COMMENT ON COLUMN generations.model_version IS
  'Model version used for generation: seedream-4-0 (uncensored) or seedream-4-5 (censored)';
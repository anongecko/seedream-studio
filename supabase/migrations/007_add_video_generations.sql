-- Migration: Add video_generations table for Seedance 1.5 Pro
-- Date: 2026-01-07
-- Status: CURRENTLY UNUSED - Videos are session-only (no persistence)
-- Description: Create separate table for video generation metadata
--              Video URLs expire in 24 hours - NOT stored permanently
--              Supports video editing iterations via parent_task_id
--
-- NOTE: This table exists but is not currently used. Video generations
--       are kept in React state only for privacy and 24-hour URL expiry.
--       May be enabled in future for authenticated users with file storage.

-- ============================================================================
-- Create video_generations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Task tracking
  task_id TEXT NOT NULL UNIQUE, -- API task ID
  parent_task_id TEXT REFERENCES video_generations(task_id), -- For editing iterations

  -- Request metadata
  prompt TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN (
    'text-to-video',
    'image-to-video-first',
    'image-to-video-frames',
    'image-to-video-ref'
  )),
  reference_image_urls TEXT[], -- Reference images used (base64 or URLs)

  -- Video parameters
  duration INTEGER NOT NULL CHECK (duration >= 4 AND duration <= 12),
  resolution TEXT NOT NULL CHECK (resolution IN ('480p', '720p')),
  ratio TEXT NOT NULL,
  framespersecond INTEGER NOT NULL DEFAULT 24 CHECK (framespersecond = 24),
  generate_audio BOOLEAN NOT NULL DEFAULT TRUE,
  service_tier TEXT NOT NULL DEFAULT 'default' CHECK (service_tier IN ('default', 'flex')),
  return_last_frame BOOLEAN NOT NULL DEFAULT FALSE,

  -- Response metadata (URLs valid for 24 hours - NOT stored long-term)
  video_url TEXT, -- Download URL (24-hour expiry)
  last_frame_url TEXT, -- Optional last frame URL (24-hour expiry)

  -- Generation metadata
  seed INTEGER NOT NULL,
  generation_time_ms INTEGER,
  model_version TEXT NOT NULL DEFAULT 'seedance-1-5-pro',

  -- Usage tracking
  completion_tokens INTEGER,
  total_tokens INTEGER
);

-- ============================================================================
-- Indexes for efficient queries
-- ============================================================================

-- Primary query: Recent videos
CREATE INDEX IF NOT EXISTS idx_video_generations_created
  ON video_generations(created_at DESC);

-- Query by mode
CREATE INDEX IF NOT EXISTS idx_video_generations_mode
  ON video_generations(mode);

-- Query by task ID (for polling and editing)
CREATE INDEX IF NOT EXISTS idx_video_generations_task_id
  ON video_generations(task_id);

-- Query iterations (parent-child relationships)
CREATE INDEX IF NOT EXISTS idx_video_generations_parent
  ON video_generations(parent_task_id)
  WHERE parent_task_id IS NOT NULL;

-- Query by model version (for analytics)
CREATE INDEX IF NOT EXISTS idx_video_generations_model_version
  ON video_generations(model_version);

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE video_generations IS
  'Stores video generation metadata only. Video URLs expire after 24 hours - users must download. Separate from image generations table due to different structure.';

COMMENT ON COLUMN video_generations.task_id IS
  'Unique task ID from video generation API. Used for polling status and linking iterations.';

COMMENT ON COLUMN video_generations.parent_task_id IS
  'Links to parent video for iteration tracking (edit & regenerate feature). NULL for original videos.';

COMMENT ON COLUMN video_generations.video_url IS
  'Temporary download URL valid for 24 hours. NOT stored permanently - users must download to save.';

COMMENT ON COLUMN video_generations.last_frame_url IS
  'Optional last frame image URL (24-hour expiry). Used for chaining multiple videos together.';

COMMENT ON COLUMN video_generations.duration IS
  'Actual duration of generated video in seconds. May differ from requested duration if auto (-1) was used.';

COMMENT ON COLUMN video_generations.ratio IS
  'Actual aspect ratio of generated video. May differ from request if adaptive was used.';

COMMENT ON COLUMN video_generations.reference_image_urls IS
  'Array of reference image URLs or base64 data used in generation. NOT the video itself.';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS (prepared for future authentication)
ALTER TABLE video_generations ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (no auth yet)
-- When auth is added, these policies should be updated
CREATE POLICY "Public access for now" ON video_generations
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- Utility Functions
-- ============================================================================

/**
 * Get iteration chain for a video (all edits)
 */
CREATE OR REPLACE FUNCTION get_video_iteration_chain(root_task_id TEXT)
RETURNS TABLE (
  task_id TEXT,
  parent_task_id TEXT,
  iteration_depth INTEGER,
  prompt TEXT,
  created_at TIMESTAMPTZ
) AS $$
WITH RECURSIVE iteration_tree AS (
  -- Base case: root video
  SELECT
    vg.task_id,
    vg.parent_task_id,
    0 AS iteration_depth,
    vg.prompt,
    vg.created_at
  FROM video_generations vg
  WHERE vg.task_id = root_task_id

  UNION ALL

  -- Recursive case: children
  SELECT
    vg.task_id,
    vg.parent_task_id,
    it.iteration_depth + 1,
    vg.prompt,
    vg.created_at
  FROM video_generations vg
  INNER JOIN iteration_tree it ON vg.parent_task_id = it.task_id
)
SELECT * FROM iteration_tree ORDER BY iteration_depth, created_at;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION get_video_iteration_chain IS
  'Returns the complete iteration chain for a video, showing all edits and re-generations.';

-- ============================================================================
-- Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 007 completed: video_generations table created';
  RAISE NOTICE '⚠️  Remember: Video URLs expire in 24 hours - implement download prompts!';
  RAISE NOTICE '📊 Table supports iteration tracking for video editing feature';
END $$;

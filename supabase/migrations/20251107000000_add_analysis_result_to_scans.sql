/*
  # Add Analysis Result Storage to Scans

  ## Overview
  Adds a new column to store the complete JSON response from n8n workflow analysis.
  This enables tracking of nutritional data and other analysis results over time.

  ## Changes

  1. New Column
    - `analysis_result` (jsonb) - Stores the complete n8n webhook response
      * Contains items array with individual food analysis
      * Contains totals object with aggregated nutritional data
      * Nullable to support legacy scans without analysis

  2. Indexes
    - Add GIN index on analysis_result for efficient JSON queries
    - Add index on created_at for historical queries

  ## Example Analysis Result Structure
  {
    "items": [
      {
        "name": "Food item name",
        "kcal": 250,
        "protein_g": 10,
        "carb_g": 30,
        "fat_g": 8
      }
    ],
    "totals": {
      "kcal": 500,
      "protein_g": 20,
      "carb_g": 60,
      "fat_g": 16
    }
  }

  ## Security
  - No RLS policy changes needed (inherits from existing scan policies)
  - Users can only access their own scan analysis results
*/

-- Add analysis_result column to scans table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'analysis_result'
  ) THEN
    ALTER TABLE scans ADD COLUMN analysis_result jsonb DEFAULT NULL;
  END IF;
END $$;

-- Add GIN index for efficient JSON queries on analysis results
CREATE INDEX IF NOT EXISTS idx_scans_analysis_result_gin
ON scans USING GIN (analysis_result);

-- Add index on created_at for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_scans_created_at
ON scans(created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN scans.analysis_result IS 'Complete JSON response from n8n workflow containing nutritional analysis data';

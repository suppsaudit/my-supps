-- Add string_id column to supplements table
ALTER TABLE supplements ADD COLUMN IF NOT EXISTS string_id TEXT;

-- Create index for string_id
CREATE INDEX IF NOT EXISTS idx_supplements_string_id ON supplements(string_id);
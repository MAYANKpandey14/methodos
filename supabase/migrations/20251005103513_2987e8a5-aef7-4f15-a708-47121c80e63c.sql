-- Function to normalize tag names (capitalize first letter)
CREATE OR REPLACE FUNCTION normalize_tag_name(tag_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN INITCAP(LOWER(TRIM(tag_name)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- First, merge duplicate tags by updating task_tags references
-- We'll keep the oldest tag (using ORDER BY created_at)
WITH duplicate_tags AS (
  SELECT 
    user_id,
    LOWER(name) as normalized_name,
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id, LOWER(name) ORDER BY created_at) as rn
  FROM tags
)
UPDATE task_tags tt
SET tag_id = dt_keep.id
FROM duplicate_tags dt_delete
INNER JOIN duplicate_tags dt_keep ON 
  dt_keep.user_id = dt_delete.user_id AND 
  dt_keep.normalized_name = dt_delete.normalized_name AND
  dt_keep.rn = 1
WHERE tt.tag_id = dt_delete.id
  AND dt_delete.rn > 1;

-- Delete duplicate tags (keep only the first one)
DELETE FROM tags
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (PARTITION BY user_id, LOWER(name) ORDER BY created_at) as rn
    FROM tags
  ) sub
  WHERE rn > 1
);

-- Normalize existing tag names
UPDATE tags
SET name = normalize_tag_name(name);

-- Add unique constraint on user_id and normalized name
CREATE UNIQUE INDEX idx_tags_user_normalized_name 
ON tags (user_id, LOWER(name));

-- Create a view for tag usage statistics
CREATE OR REPLACE VIEW tag_usage_stats AS
SELECT 
  t.id,
  t.user_id,
  t.name,
  t.color,
  t.created_at,
  COUNT(tt.id) as usage_count,
  MAX(tt.created_at) as last_used_at
FROM tags t
LEFT JOIN task_tags tt ON t.id = tt.tag_id
GROUP BY t.id, t.user_id, t.name, t.color, t.created_at;

-- Grant access to the view for authenticated users
GRANT SELECT ON tag_usage_stats TO authenticated;

-- Comment on the view to explain its purpose
COMMENT ON VIEW tag_usage_stats IS 'Provides tag usage statistics including usage count and last used timestamp';
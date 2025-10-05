-- Drop the view and recreate without security definer
DROP VIEW IF EXISTS tag_usage_stats;

-- Create the view with security invoker (default and secure)
CREATE VIEW tag_usage_stats WITH (security_invoker = true) AS
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

-- Grant access to the view
GRANT SELECT ON tag_usage_stats TO authenticated;

-- Add RLS policy for the view (views inherit RLS from underlying tables)
-- Users can only see their own tag stats
COMMENT ON VIEW tag_usage_stats IS 'Tag usage statistics - filtered by user_id through underlying table RLS policies';
-- Create a secure function to access tag usage stats
-- This function enforces that users can only see their own tag statistics
CREATE OR REPLACE FUNCTION public.get_user_tag_stats()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  color text,
  created_at timestamp with time zone,
  usage_count bigint,
  last_used_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id,
    t.user_id,
    t.name,
    t.color,
    t.created_at,
    count(tt.id) AS usage_count,
    max(tt.created_at) AS last_used_at
  FROM tags t
  LEFT JOIN task_tags tt ON t.id = tt.tag_id
  WHERE t.user_id = auth.uid()
  GROUP BY t.id, t.user_id, t.name, t.color, t.created_at
  ORDER BY usage_count DESC, t.name ASC;
$$;

-- Grant execute permission to authenticated users only
REVOKE ALL ON FUNCTION public.get_user_tag_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_tag_stats() TO authenticated;

-- Add comment explaining the security measure
COMMENT ON FUNCTION public.get_user_tag_stats() IS 
'Securely returns tag usage statistics for the authenticated user only. Uses SECURITY DEFINER to bypass RLS on the view while still enforcing user-level access control.';
-- Fix 1: Since tag_usage_stats is a view, we need to ensure RLS is properly enforced on underlying tables
-- The view already filters by user_id through the JOIN, so we just need to ensure the base tables have proper RLS

-- Fix 2: Update normalize_tag_name function to include search_path for security
CREATE OR REPLACE FUNCTION public.normalize_tag_name(tag_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN INITCAP(LOWER(TRIM(tag_name)));
END;
$function$;
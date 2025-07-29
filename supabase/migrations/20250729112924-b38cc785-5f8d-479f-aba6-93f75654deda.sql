-- Fix Function Search Path Mutable issue
-- Update existing functions to include proper search_path setting

-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update the handle_new_user_profile function  
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Add missing UPDATE policy for task_tags table
CREATE POLICY "Users can update their own task_tags" 
ON public.task_tags 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1
  FROM tasks
  WHERE ((tasks.id = task_tags.task_id) AND (tasks.user_id = auth.uid()))
));
-- Add new profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS gender text;

-- Update the handle_new_user function to include new fields from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, age, gender)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    (NEW.raw_user_meta_data ->> 'age')::integer,
    NEW.raw_user_meta_data ->> 'gender'
  );
  
  -- Create default subjects for new users
  INSERT INTO public.subjects (user_id, name, color) VALUES
    (NEW.id, 'Mathematics', 'hsl(173 58% 39%)'),
    (NEW.id, 'Physics', 'hsl(38 92% 50%)'),
    (NEW.id, 'Chemistry', 'hsl(262 83% 58%)'),
    (NEW.id, 'Biology', 'hsl(152 69% 40%)'),
    (NEW.id, 'English', 'hsl(0 72% 51%)');
  
  RETURN NEW;
END;
$$;
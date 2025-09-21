-- Add face_encoding and profile_photo_url columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN face_encoding TEXT,
ADD COLUMN profile_photo_url TEXT;

-- Create index for faster face encoding queries
CREATE INDEX IF NOT EXISTS idx_profiles_face_encoding ON public.profiles(face_encoding) WHERE face_encoding IS NOT NULL;
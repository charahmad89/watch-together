-- 1. Add the missing movie_title column
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS movie_title TEXT NOT NULL DEFAULT 'Untitled';

-- 2. Force a schema cache reload (helps if Supabase is stuck)
NOTIFY pgrst, 'reload schema';

-- 3. Verify the column exists (Optional, just for your confirmation)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rooms';

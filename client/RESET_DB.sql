-- WARNING: This will delete all existing rooms and participants!
-- Use this if the previous fix didn't work.

-- 1. Drop existing tables (order matters due to foreign keys)
DROP TABLE IF EXISTS reactions;
DROP TABLE IF EXISTS participants;
DROP TABLE IF EXISTS rooms;

-- 2. Re-create rooms table with ALL columns correctly
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  host_id TEXT NOT NULL,
  movie_url TEXT NOT NULL,
  movie_title TEXT NOT NULL DEFAULT 'Untitled', -- Ensuring this column exists
  playback_time FLOAT DEFAULT 0,
  is_playing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Re-create participants table
CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  is_online BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Re-create reactions table
CREATE TABLE reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  timestamp FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;

-- 6. Disable RLS (Row Level Security) for public access
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access for rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for participants" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for reactions" ON reactions FOR ALL USING (true) WITH CHECK (true);

-- 7. Force schema reload
NOTIFY pgrst, 'reload schema';

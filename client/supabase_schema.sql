-- Run this in your Supabase SQL Editor to set up the database

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  host_id TEXT NOT NULL, -- Storing userName as host_id for this simple app
  movie_url TEXT NOT NULL,
  movie_title TEXT NOT NULL,
  playback_time FLOAT DEFAULT 0,
  is_playing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  is_online BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  timestamp FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;

-- Disable RLS for simple demo purposes (OR create policies if you prefer security)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Allow public access (since we are not using Supabase Auth for this demo)
CREATE POLICY "Public access for rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for participants" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for reactions" ON reactions FOR ALL USING (true) WITH CHECK (true);

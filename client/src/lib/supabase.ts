import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Room {
  id: string;
  name: string;
  host_id: string;
  movie_url: string;
  movie_title: string;
  subtitles_url?: string;
  playback_time: number;
  is_playing: boolean;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  room_id: string;
  user_name: string;
  is_online: boolean;
  joined_at: string;
  last_seen: string;
}

export interface Reaction {
  id: string;
  room_id: string;
  user_name: string;
  emoji: string;
  timestamp: number;
  created_at: string;
}

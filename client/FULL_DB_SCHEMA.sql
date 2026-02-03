-- ============================================ 
 -- USERS TABLE (Extended from Supabase Auth) 
 -- ============================================ 
 CREATE TABLE public.users ( 
   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, 
   email TEXT UNIQUE NOT NULL, 
   full_name TEXT, 
   avatar_url TEXT, 
   created_at TIMESTAMPTZ DEFAULT NOW(), 
   updated_at TIMESTAMPTZ DEFAULT NOW(), 
   subscription_type TEXT DEFAULT 'free', -- free, premium 
   total_spent DECIMAL(10,2) DEFAULT 0.00 
 ); 
  
 -- Enable RLS 
 ALTER TABLE public.users ENABLE ROW LEVEL SECURITY; 
  
 -- RLS Policies 
 CREATE POLICY "Users can view own profile" ON public.users 
   FOR SELECT USING (auth.uid() = id); 
  
 CREATE POLICY "Users can update own profile" ON public.users 
   FOR UPDATE USING (auth.uid() = id); 
  
 -- ============================================ 
 -- MOVIES TABLE 
 -- ============================================ 
 CREATE TABLE public.movies ( 
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
   title TEXT NOT NULL, 
   description TEXT, 
   thumbnail_url TEXT, 
   video_url TEXT, -- Supabase Storage URL 
   duration_seconds INTEGER, 
   genre TEXT[], 
   release_year INTEGER, 
   one_time_price DECIMAL(10,2) DEFAULT 75.00, 
   lifetime_price DECIMAL(10,2) DEFAULT 300.00, 
   one_time_original_price DECIMAL(10,2) DEFAULT 150.00, 
   lifetime_original_price DECIMAL(10,2) DEFAULT 500.00, 
   created_at TIMESTAMPTZ DEFAULT NOW(), 
   is_active BOOLEAN DEFAULT true, 
   view_count INTEGER DEFAULT 0 
 ); 
  
 ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY; 
  
 CREATE POLICY "Anyone can view active movies" ON public.movies 
   FOR SELECT USING (is_active = true); 
  
 -- Index for performance 
 CREATE INDEX idx_movies_genre ON public.movies USING GIN(genre); 
 CREATE INDEX idx_movies_created_at ON public.movies(created_at DESC); 
  
 -- ============================================ 
 -- PURCHASES TABLE 
 -- ============================================ 
 CREATE TABLE public.purchases ( 
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
   user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, 
   movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE, 
   purchase_type TEXT NOT NULL, -- 'one_time' or 'lifetime' 
   amount_paid DECIMAL(10,2) NOT NULL, 
   payment_method TEXT, -- 'easypaisa', 'jazzcash', 'card', 'razorpay' 
   payment_id TEXT, 
   access_token TEXT UNIQUE NOT NULL, 
   purchased_at TIMESTAMPTZ DEFAULT NOW(), 
   expires_at TIMESTAMPTZ, -- NULL for lifetime access 
   is_active BOOLEAN DEFAULT true, 
   UNIQUE(user_id, movie_id, purchase_type) 
 ); 
  
 ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY; 
  
 CREATE POLICY "Users can view own purchases" ON public.purchases 
   FOR SELECT USING (auth.uid() = user_id); 
  
 CREATE INDEX idx_purchases_user_movie ON public.purchases(user_id, movie_id); 
 CREATE INDEX idx_purchases_token ON public.purchases(access_token); 
  
 -- ============================================ 
 -- WATCH ROOMS TABLE 
 -- ============================================ 
 CREATE TABLE public.watch_rooms ( 
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
   room_code TEXT UNIQUE NOT NULL, 
   host_id UUID REFERENCES public.users(id) ON DELETE CASCADE, 
   movie_id UUID REFERENCES public.movies(id) ON DELETE SET NULL, 
   custom_video_url TEXT, -- For host-uploaded videos 
   is_active BOOLEAN DEFAULT true, 
   created_at TIMESTAMPTZ DEFAULT NOW(), 
   max_participants INTEGER DEFAULT 10, 
   current_participants INTEGER DEFAULT 1 
 ); 
  
 ALTER TABLE public.watch_rooms ENABLE ROW LEVEL SECURITY; 
  
 CREATE POLICY "Anyone can view active rooms" ON public.watch_rooms 
   FOR SELECT USING (is_active = true); 
  
 CREATE POLICY "Host can manage own rooms" ON public.watch_rooms 
   FOR ALL USING (auth.uid() = host_id); 
  
 CREATE INDEX idx_rooms_code ON public.watch_rooms(room_code); 
 CREATE INDEX idx_rooms_host ON public.watch_rooms(host_id); 
  
 -- ============================================ 
 -- ROOM PARTICIPANTS TABLE 
 -- ============================================ 
 CREATE TABLE public.room_participants ( 
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
   room_id UUID REFERENCES public.watch_rooms(id) ON DELETE CASCADE, 
   user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, 
   joined_at TIMESTAMPTZ DEFAULT NOW(), 
   is_muted BOOLEAN DEFAULT false, 
   is_online BOOLEAN DEFAULT true, 
   UNIQUE(room_id, user_id) 
 ); 
  
 ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY; 
  
 CREATE POLICY "Participants can view room members" ON public.room_participants 
   FOR SELECT USING ( 
     room_id IN ( 
       SELECT room_id FROM public.room_participants WHERE user_id = auth.uid() 
     ) 
   ); 
  
 -- ============================================ 
 -- PLAYBACK STATE TABLE (For Sync) 
 -- ============================================ 
 CREATE TABLE public.playback_state ( 
   room_id UUID PRIMARY KEY REFERENCES public.watch_rooms(id) ON DELETE CASCADE, 
   current_time DECIMAL(10,2) DEFAULT 0.00, 
   is_playing BOOLEAN DEFAULT false, 
   playback_speed DECIMAL(3,2) DEFAULT 1.00, 
   last_updated TIMESTAMPTZ DEFAULT NOW(), 
   updated_by UUID REFERENCES public.users(id) 
 ); 
  
 ALTER TABLE public.playback_state ENABLE ROW LEVEL SECURITY; 
  
 CREATE POLICY "Participants can view playback state" ON public.playback_state 
   FOR SELECT USING ( 
     room_id IN ( 
       SELECT room_id FROM public.room_participants WHERE user_id = auth.uid() 
     ) 
   );

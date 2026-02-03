# Deployment Checklist

## 1. Environment Variables
Ensure all these are set in your Vercel (Frontend) and Render/Railway (Backend) dashboards.

### Frontend (.env)
- `VITE_SUPABASE_URL`: Your Supabase Project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
- `VITE_SOCKET_URL`: URL of your deployed backend (e.g., `https://watch-together-api.onrender.com`)

### Backend (.env)
- `PORT`: 3001 (or provided by host)
- `DATABASE_URL`: Postgres Connection String (Supabase Transaction Pooler recommended)
- `JWT_SECRET`: Strong random string
- `RAZORPAY_KEY_ID`: From Razorpay Dashboard
- `RAZORPAY_KEY_SECRET`: From Razorpay Dashboard
- `AWS_ACCESS_KEY_ID`: For S3/R2 Storage
- `AWS_SECRET_ACCESS_KEY`: For S3/R2 Storage
- `AWS_BUCKET_NAME`: Bucket name
- `AWS_REGION`: Region (e.g., `us-east-1` or `auto` for R2)
- `AWS_ENDPOINT`: Endpoint URL (if using Cloudflare R2)

## 2. Database Setup
1. Go to Supabase SQL Editor.
2. Run the content of `client/FULL_DB_SCHEMA.sql`.
3. Go to Supabase Project Settings -> API.
4. Ensure "Enable Realtime" is checked for: `watch_rooms`, `room_participants`, `playback_state`.

## 3. Backend Deployment (Render/Railway/Heroku)
1. **Build Command**: `npm install`
2. **Start Command**: `node index.js`
3. **Health Check**: Ensure `/` or `/health` returns 200 OK.
4. **CORS**: Update `index.js` `cors` configuration to allow your Vercel frontend domain.

## 4. Frontend Deployment (Vercel)
1. **Framework Preset**: Vite
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Rewrites**: If using client-side routing, ensure Vercel handles SPA routing (usually automatic with Vite preset).

## 5. Verification
- [ ] User can sign up/login.
- [ ] Payment modal opens and mock payment works (or Razorpay test mode).
- [ ] Room creation redirects to Watch Room.
- [ ] Video syncs between two browser windows (Test in Incognito).
- [ ] Chat messages appear instantly.

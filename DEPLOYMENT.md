# Deployment Guide

This project is a monorepo containing two parts:
1. **Client**: A React frontend (deploy to **Vercel**) - located in `client/` folder.
2. **Server**: A Node.js backend (deploy to **Render**) - located in `server/` folder.

> **CRITICAL**: Because the code is in subfolders (`client` and `server`), you MUST specify the **Root Directory** in your deployment settings.

## Part 1: Deploy Server to Render

1. Create a GitHub repository and push your code.
2. Log in to [Render](https://render.com/).
3. Click **New +** > **Web Service**.
4. Connect your GitHub repository.
5. **IMPORTANT**: Scroll down to **Root Directory** and type: `server`
   *(If you miss this, the build will fail!)*
6. Configure the rest:
   - **Name**: `watch-together-server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Free
7. Click **Create Web Service**.
8. Copy the **Service URL** (e.g., `https://watch-together-server.onrender.com`).

## Part 2: Set up Supabase

1. Go to [Supabase](https://supabase.com/) and create a project.
2. Go to **SQL Editor** -> **New Query**.
3. Copy the content of `client/supabase_schema.sql` and run it.
4. Go to **Project Settings > API**.
5. Copy the **Project URL** and **anon / public** key.

## Part 3: Deploy Client to Vercel

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository.
4. **IMPORTANT**: In the "Framework Preset" section, click **Edit** next to **Root Directory** and select `client`.
5. **Environment Variables**:
   Add the following variables:
   - `VITE_SOCKET_URL`: Your Render URL from Part 1.
   - `VITE_SUPABASE_URL`: Your Supabase URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Key.
6. Click **Deploy**.

## Local Development

To run locally, you need two terminals:

**Terminal 1 (Server):**
```bash
cd server
npm install
npm start
```

**Terminal 2 (Client):**
```bash
cd client
npm install
npm run dev
```

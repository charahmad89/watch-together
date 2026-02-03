# How to Fix "Invalid API Key" Error

This error means the **URL** or **Anon Key** stored in Vercel is incorrect, has extra spaces, or belongs to a different project.

## 1. Get Correct Credentials
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project.
3. Go to **Settings** (Gear icon) > **API**.
4. You will see:
   - **Project URL**: (e.g., `https://xyz...supabase.co`)
   - **Project API Keys**:
     - `anon` / `public` (Use this one!)
     - `service_role` (Do NOT use this one)

## 2. Check Vercel Variables
1. Go to your [Vercel Dashboard](https://vercel.com).
2. Open your project > **Settings** > **Environment Variables**.
3. Check `VITE_SUPABASE_URL`:
   - Must start with `https://`
   - Must NOT have a trailing slash `/` at the end.
   - Must NOT have spaces at the beginning or end.
4. Check `VITE_SUPABASE_ANON_KEY`:
   - It is a long string starting with `ey...`
   - Make sure you copied the `anon` key, NOT the `service_role` key.
   - **Check for spaces** at the start or end of the string. (This is the most common error!)

## 3. Redeploy (CRITICAL)
Updating the variables **DOES NOT** update the live website automatically.
1. Go to the **Deployments** tab in Vercel.
2. Click the **three dots** (...) next to the top deployment.
3. Select **Redeploy**.
4. Click **Redeploy**.

## 4. Verify in Browser
Once the redeploy finishes:
1. Open the app.
2. Open Developer Tools (F12) > **Network**.
3. Try to create a room.
4. If it fails, click the request.
   - Look at the `apikey` header in the request headers.
   - Does it match what you see in Supabase?

# Deployment Environment Variables Checklist

## Server (.env)
Create a `.env` file in the `server` directory with the following variables:

```env
# Port for the server to run on (default: 3001)
PORT=3001

# Allowed Client URL for CORS (Required for production)
# Example: https://myapp.vercel.app
CLIENT_URL=http://localhost:5173

# Database Connection URL (PostgreSQL/Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# JWT Secret for Auth (if applicable)
JWT_SECRET=your_super_secret_jwt_key

# Payment Gateway Keys (if applicable)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

## Client (.env)
Create a `.env` file in the `client` directory (or set in Vercel/Netlify dashboard):

```env
# Backend Socket URL
# Development: http://localhost:3001
# Production: https://your-backend-service.onrender.com
VITE_SOCKET_URL=http://localhost:3001

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Build & Deploy Notes
1. **Node Version**: Ensure your host runs Node.js 18+
2. **Build Command (Client)**: `npm run build`
3. **Start Command (Server)**: `npm start`
4. **WebSocket Support**: Ensure your hosting provider supports WebSockets (e.g., Render, Railway, Heroku). Serverless functions (Vercel API routes) do NOT support persistent WebSockets. You must deploy the `server` folder to a persistent Node.js host.

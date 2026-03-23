# Setup Instructions

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
APP_URL=http://localhost:3000
REDIRECT_URL=http://localhost:3000/auth/callback

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000` (or your production URL)
   - Authorized redirect URIs: `http://localhost:3000/auth/callback` (or your production callback URL)
6. Copy the Client ID and Client Secret to your `.env.local` file

## Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy the following:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

## Database Schema

Make sure your Supabase database has the following tables:

### `users` table
- `id` (uuid, primary key, references auth.users)
- `created_at` (timestamptz)
- `full_name` (text)
- `username` (text)
- `avatar_url` (text, nullable)
- `plan` (text)
- `onboarding_done` (text)

### `feedback` table
- `id` (bigint, primary key)
- `created_at` (timestamptz)
- `user_id` (uuid, references users.id)
- `occasion` (text)
- `outfit_hash` (text) - stores full outfit JSON
- `item_ids` (text) - comma-separated item IDs
- `vote` (text) - 'saved' for saved outfits

### `items` table (for future use)
- `id` (bigint, primary key)
- `created_at` (timestamptz)
- `user_id` (uuid, references users.id)
- `category` (text)
- `type` (text)
- `color_family` (text)
- `image_url` (text)

## Enable Google OAuth in Supabase

1. Go to Authentication → Providers in your Supabase dashboard
2. Enable Google provider
3. Add your Google OAuth Client ID and Client Secret (from Google Cloud Console)
4. The redirect URL is automatically handled by Supabase
5. Make sure your Google OAuth redirect URI in Google Cloud Console includes:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - You can find your project reference in Supabase dashboard → Settings → API

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your `.env.local` file with all required variables

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Features

- ✅ Google OAuth authentication
- ✅ Email/password authentication
- ✅ User account creation
- ✅ Database integration with Supabase
- ✅ Protected routes (requires authentication for `/app`)
- ✅ Login/Signup pages
- ✅ User session management

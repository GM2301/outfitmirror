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

# AI features - required, app is broken without these
# Wardrobe photo tagging (analyze-photo) - platform.openai.com/account/api-keys
OPENAI_API_KEY=your_openai_api_key_here
# AI Style Coach / Support chat (style-assistant) - console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here
# Wardrobe photo background removal (remove-bg) - replicate.com/account/api-tokens
# Needs an active payment method with credit on the Replicate account, not just a token.
REPLICATE_API_TOKEN=your_replicate_api_token_here
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
- `top_id`, `bottom_id`, `shoes_id` (text) - the saved outfit's item IDs
  (verified against the live schema 2026-09-22 - this replaces the
  `item_ids` comma-separated-string column previously documented here,
  which storage.ts never actually used)
- `legacy_item_id` (text, nullable) - present in the live schema but not
  read or written anywhere in the current code; likely safe to drop,
  not touched here since dropping a column is a one-way DB change
- `vote` (text) - 'saved' for saved outfits

### `items` table (for future use)
- `id` (bigint, primary key)
- `created_at` (timestamptz)
- `user_id` (uuid, references users.id)
- `category` (text)
- `type` (text)
- `color_family` (text)
- `image_url` (text)

### `couples` table (Couple Mode)
- `id`, `code` (text, unique) - the 6-character code shared between partners
- `user_id` (uuid, references users.id)
- `gender` (text)
- `created_at` (timestamptz)

Confirmed present in the live schema 2026-09-22, with exactly these
columns - CoupleMode's "table doesn't exist" fallback path shouldn't
trigger in practice.

**Security issue found and fixed (2026-09-22):** tested the live API
directly with the anon key - `couples` had no RLS at all, so anyone
could read every user's code and user_id without logging in
(confirmed: an unauthenticated request returned real rows). `items`
was properly protected (unauthenticated reads returned nothing).

Run `supabase-fix-couples-rls.sql` (repo root) in the Supabase SQL
Editor to fix this. It locks `couples` down to "you can only see your
own row" and adds two SECURITY DEFINER functions -
`lookup_couple_by_code` and `get_partner_items` - that do the one
legitimate cross-user lookup this feature needs (find a partner by
the exact code they shared with you) without exposing the whole
table or opening `items` up to any-authenticated-user reads.
CoupleMode.tsx already calls these functions instead of querying the
tables directly - until this SQL is run, "Connect with Partner" will
fail that RPC call and fall back to demo mode (same as it always did
when the table lookup failed), not break.

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

## Production (Vercel) environment variables

Every variable above also needs to be set in Vercel → Project Settings → Environment
Variables, separately from `.env.local` (Vercel never reads that file). If
`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `REPLICATE_API_TOKEN` are missing there,
photo tagging, the AI Style Coach/Support chat, and background removal will be
broken in production even though the rest of the app works fine.

## Features

- ✅ Google OAuth authentication
- ✅ Email/password authentication
- ✅ User account creation
- ✅ Database integration with Supabase
- ✅ Protected routes (requires authentication for `/app`)
- ✅ Login/Signup pages
- ✅ User session management

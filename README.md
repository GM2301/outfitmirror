# Occaswear

AI wardrobe and outfit app: upload photos of your clothes, get outfits for an occasion, the weather, or a trip.

- **Web app:** Next.js (App Router) on Vercel
- **Data, auth, photo storage:** Supabase
- **AI:** OpenAI (photo tagging, chat), Replicate (background removal)
- **iOS:** Capacitor shell that loads the production site (`capacitor.config.ts`)

## Run locally

```bash
npm install
npm run dev
```

The app runs on http://localhost:8000. It needs a `.env.local` with the Supabase URL/keys and the AI provider keys (never commit it).

## Database changes

SQL that must be run by hand in Supabase → SQL Editor lives in [`supabase/`](supabase/), named by date.

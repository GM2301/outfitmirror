import type { CapacitorConfig } from '@capacitor/cli';

// This app runs on Next.js with server-side logic (Supabase, OpenAI, Stripe
// webhooks, etc.), so it cannot be statically exported into the native
// bundle like a plain single-page app. Instead the native iOS shell loads
// the live production site directly, the same pattern used by many
// server-backed apps that ship through Capacitor.
//
// IMPORTANT: update `server.url` to the final production domain before
// building for App Store submission.
const config: CapacitorConfig = {
  appId: 'com.occaswear.app',
  appName: 'Occaswear',
  webDir: 'public',
  server: {
    url: 'https://outfitmirror-kappa.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;

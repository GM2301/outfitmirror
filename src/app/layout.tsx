import "./globals.css";
import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { AuthProvider } from "@/lib/auth/context";

export const metadata: Metadata = {
  title: "OutfitMirror – Closet OS",
  description: "Upload your wardrobe, pick an occasion, get 2 outfits in seconds.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OutfitMirror",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  openGraph: {
    title: "OutfitMirror – Closet OS",
    description: "Upload your wardrobe, pick an occasion, get 2 outfits in seconds.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="OutfitMirror" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-white text-black">
        <AuthProvider>
          <SiteNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
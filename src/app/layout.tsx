import "./globals.css";
import type { Metadata, Viewport } from "next";
import { SiteNav } from "@/components/SiteNav";
import { AuthProvider } from "@/lib/auth/context";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  metadataBase: new URL("https://outfitmirror-kappa.vercel.app"),
  title: {
    default: "Occaswear — AI Personal Stylist",
    template: "%s · Occaswear",
  },
  description: "Your AI personal stylist. Upload your wardrobe, pick an occasion, get styled in seconds.",
  applicationName: "Occaswear",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Occaswear",
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/logo.svg",
  },
  openGraph: {
    type: "website",
    title: "Occaswear — AI Personal Stylist",
    description: "Your AI personal stylist. Upload your wardrobe, get styled in seconds.",
    url: "https://outfitmirror-kappa.vercel.app",
    siteName: "Occaswear",
    images: [{ url: "/logo.svg", width: 512, height: 512, alt: "Occaswear" }],
  },
  twitter: {
    card: "summary",
    title: "Occaswear — AI Personal Stylist",
    description: "Your AI personal stylist. Get styled in seconds.",
    images: ["/logo.svg"],
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A1A" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-title" content="Occaswear" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.openai.com" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
      </head>
      <body className="antialiased" style={{ background: "#FAF8F5", color: "#1A1A1A" }}>
        <AuthProvider>
          <SiteNav />
          {children}
          <PWAInstallPrompt />
          <ServiceWorkerRegistration />
        </AuthProvider>
      </body>
    </html>
  );
}

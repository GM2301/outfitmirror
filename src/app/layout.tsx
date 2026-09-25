import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans, Cormorant } from "next/font/google";
import { SiteNav } from "@/components/SiteNav";
import { AuthProvider } from "@/lib/auth/context";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

// Self-hosted at build time: no request to Google and no render-blocking
// stylesheet on each visit. Each exposes a CSS variable used in globals.css
// and in inline styles.
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-playfair", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-dmsans", display: "swap" });
const cormorant = Cormorant({ subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });

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
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${cormorant.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-title" content="Occaswear" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="antialiased" style={{ background: "#FAF8F5", color: "#1A1A1A" }}>
        <AuthProvider>
          <SiteNav />
          {children}
          <ServiceWorkerRegistration />
        </AuthProvider>
      </body>
    </html>
  );
}

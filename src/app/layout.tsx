import "./globals.css";
import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { AuthProvider } from "@/lib/auth/context";

export const metadata: Metadata = {
  title: "OutfitMirror",
  description: "Closet OS for men",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-gray-900 text-black dark:text-white transition-colors">
        <AuthProvider>
          <SiteNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

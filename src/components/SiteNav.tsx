"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/try", label: "Try it" },
  { href: "/app", label: "App" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="border-b border-black/8 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xs tracking-widest text-neutral-400 uppercase">OutfitMirror</span>
          <span className="text-neutral-200">|</span>
          <span className="text-sm font-semibold">Closet OS</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <nav className="flex gap-1">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link key={l.href} href={l.href}
                  className={["rounded-full px-4 py-2 text-sm font-medium transition",
                    active ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-50"].join(" ")}>
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {!loading && (
            <div className="ml-2 flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-xs text-neutral-400 hidden lg:inline">{user.email?.split("@")[0]}</span>
                  <button onClick={handleSignOut}
                    className="rounded-full border border-black/15 px-4 py-2 text-sm hover:bg-neutral-50 transition">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login"
                    className="rounded-full border border-black/15 px-4 py-2 text-sm hover:bg-neutral-50 transition">
                    Sign in
                  </Link>
                  <Link href="/signup"
                    className="rounded-full bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-black/85 transition">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg border border-black/10 hover:bg-neutral-50 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-black/8 px-4 py-4 flex flex-col gap-2">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link key={l.href} href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className={["rounded-xl px-4 py-3 text-sm font-medium transition",
                  active ? "bg-black text-white" : "border border-black/8 hover:bg-neutral-50"].join(" ")}>
                {l.label}
              </Link>
            );
          })}

          {!loading && (
            <div className="pt-2 flex flex-col gap-2 border-t border-black/8 mt-1">
              {user ? (
                <>
                  <p className="text-xs text-neutral-400 px-1">{user.email?.split("@")[0]}</p>
                  <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                    className="rounded-xl border border-black/10 px-4 py-3 text-sm text-left hover:bg-neutral-50 transition">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-black/10 px-4 py-3 text-sm text-center hover:bg-neutral-50 transition">
                    Sign in
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-black text-white px-4 py-3 text-sm font-semibold text-center hover:bg-black/85 transition">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
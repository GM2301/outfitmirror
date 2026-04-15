"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import InstallButton from "@/components/InstallButton";

const PUBLIC_LINKS = [
  { href: "/", label: "Home" },
  { href: "/try", label: "Try it" },
  { href: "/pricing", label: "Pricing" },
];

const PRIVATE_LINKS = [
  { href: "/app", label: "App" },
  { href: "/settings", label: "Settings" },
];

export function SiteNav() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const links = user ? PRIVATE_LINKS : PUBLIC_LINKS;

  // Fshih navbar brenda app-it (ka bottom nav)
  if (pathname === "/app") return null;

  return (
    <header className={`sticky top-0 z-40 transition-all duration-200 ${
      scrolled ? "bg-white/95 backdrop-blur-sm border-b border-black/6 shadow-sm" : "bg-white border-b border-black/6"
    }`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 h-14">

        {/* Logo */}
        <Link href={user ? "/app" : "/"} className="flex items-center gap-2 group">
          <span className="text-xs tracking-[0.2em] text-neutral-400 uppercase font-semibold group-hover:text-neutral-600 transition">OutfitMirror</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link key={l.href} href={l.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  active ? "bg-black text-white" : "text-neutral-500 hover:text-black hover:bg-neutral-50"
                }`}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          {!loading && (
            <>
              <InstallButton />
              {user ? (
                <>
                  <span className="text-xs text-neutral-400 hidden lg:inline">{user.email?.split("@")[0]}</span>
                  <button onClick={handleSignOut}
                    className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium hover:bg-neutral-50 transition">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login"
                    className="rounded-full px-4 py-2 text-sm font-medium text-neutral-600 hover:text-black transition">
                    Sign in
                  </Link>
                  <Link href="/signup"
                    className="rounded-full bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-black/85 transition btn-press">
                    Get Started
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-50 transition">
          <div className="flex flex-col gap-1.5">
            <span className={`block h-0.5 bg-black transition-all ${mobileMenuOpen ? "w-5 rotate-45 translate-y-2" : "w-5"}`} />
            <span className={`block h-0.5 bg-black transition-all ${mobileMenuOpen ? "opacity-0" : "w-3.5"}`} />
            <span className={`block h-0.5 bg-black transition-all ${mobileMenuOpen ? "w-5 -rotate-45 -translate-y-2" : "w-5"}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-black/6 px-4 py-4 flex flex-col gap-1 animate-fade-in">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link key={l.href} href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active ? "bg-black text-white" : "hover:bg-neutral-50 text-neutral-700"
                }`}>
                {l.label}
              </Link>
            );
          })}

          <div className="pt-2 mt-1 border-t border-black/6 flex flex-col gap-2">
            <InstallButton />
            {!loading && (
              user ? (
                <>
                  <p className="text-xs text-neutral-400 px-1 pt-1">{user.email}</p>
                  <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                    className="rounded-xl border border-black/10 px-4 py-3 text-sm font-medium text-left hover:bg-neutral-50 transition">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-black/10 px-4 py-3 text-sm font-medium text-center hover:bg-neutral-50 transition">
                    Sign in
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-black text-white px-4 py-3 text-sm font-bold text-center hover:bg-black/85 transition">
                    Get Started Free
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
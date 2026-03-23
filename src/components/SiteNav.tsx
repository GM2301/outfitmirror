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

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="border-b border-black/20 dark:border-gray-700">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-xs sm:text-sm tracking-widest text-neutral-500 dark:text-gray-400">
            OUTFITMIRROR
          </div>
          <div className="hidden sm:block text-sm text-neutral-800 dark:text-gray-300">|</div>
          <div className="text-lg sm:text-xl font-semibold dark:text-white">Closet OS</div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          <nav className="flex gap-2 lg:gap-3">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={[
                    "rounded-full border px-3 lg:px-5 py-3 sm:py-2 text-xs sm:text-sm transition",
                    active
                      ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                      : "border-black/40 dark:border-gray-600 hover:bg-black/5 dark:hover:bg-white/10",
                  ].join(" ")}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {!loading && (
            <div className="ml-3 flex items-center gap-2">
              {user ? (
                <>
                  <span className="text-xs sm:text-sm text-neutral-600 dark:text-gray-300 hidden lg:inline">
                    {user.email?.split("@")[0]}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="rounded-full border border-black/40 dark:border-gray-600 dark:text-gray-300 px-3 sm:px-4 py-3 sm:py-2 text-xs sm:text-sm transition hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full border border-black/40 dark:border-gray-600 dark:text-gray-300 px-3 sm:px-4 py-3 sm:py-2 text-xs sm:text-sm transition hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-full bg-black dark:bg-white px-3 sm:px-4 py-3 sm:py-2 text-xs sm:text-sm text-white dark:text-black transition hover:bg-black/90 dark:hover:bg-gray-100"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-3 rounded-lg border border-black/20 dark:border-gray-700 hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-black/20 dark:border-gray-700 px-4 py-4 space-y-3">
          <nav className="flex flex-col gap-2">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={[
                    "rounded-lg border px-4 py-3.5 text-sm transition",
                    active
                      ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                      : "border-black/40 dark:border-gray-600 hover:bg-black/5 dark:hover:bg-white/10",
                  ].join(" ")}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {!loading && (
            <div className="pt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-neutral-600 dark:text-gray-300">
                    {user.email?.split("@")[0]}
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="rounded-lg border border-black/40 dark:border-gray-600 dark:text-gray-300 px-4 py-3.5 text-sm transition hover:bg-black/5 dark:hover:bg-white/10 text-left"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg border border-black/40 dark:border-gray-600 dark:text-gray-300 px-4 py-3.5 text-sm transition hover:bg-black/5 dark:hover:bg-white/10 text-center"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg bg-black dark:bg-white px-4 py-3.5 text-sm text-white dark:text-black transition hover:bg-black/90 dark:hover:bg-gray-100 text-center"
                  >
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
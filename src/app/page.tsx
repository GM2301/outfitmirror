"use client";

import Link from "next/link";
import { ScrollAnimation } from "@/components/ScrollAnimation";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-20">
      {/* Hero Section - Compact */}
      <ScrollAnimation>
        <div className="text-center mb-16 sm:mb-20">
          <p className="text-xs tracking-widest text-neutral-500 dark:text-gray-400 uppercase mb-3">
            OUTFITMIRROR
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight dark:text-white mb-4">
            Never wonder what to wear
            <span className="block mt-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              ever again.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-neutral-600 dark:text-gray-300">
            Upload your wardrobe, pick an occasion, get <span className="font-semibold text-gray-900 dark:text-white">3 outfits</span> in seconds.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/demo"
              className="w-full sm:w-auto rounded-full bg-black dark:bg-white px-6 py-3.5 text-sm font-semibold text-white dark:text-black transition-all hover:scale-105 shadow-lg"
            >
              Try Demo →
            </Link>
            <Link
              href="/signup"
              className="w-full sm:w-auto rounded-full border border-gray-300 dark:border-gray-600 px-6 py-3.5 text-sm font-semibold text-gray-900 dark:text-white transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </ScrollAnimation>

      {/* Compact How It Works */}
      <ScrollAnimation delay={100}>
        <div className="mb-12 sm:mb-16">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 mx-auto mb-3 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                1
              </div>
              <h3 className="text-base font-semibold dark:text-white mb-1">Upload</h3>
              <p className="text-sm text-neutral-600 dark:text-gray-400">
                Add your wardrobe photos
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500 mx-auto mb-3 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                2
              </div>
              <h3 className="text-base font-semibold dark:text-white mb-1">Pick Occasion</h3>
              <p className="text-sm text-neutral-600 dark:text-gray-400">
                Work, date, casual, or more
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 dark:from-pink-400 dark:to-pink-500 mx-auto mb-3 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                3
              </div>
              <h3 className="text-base font-semibold dark:text-white mb-1">Get Outfits</h3>
              <p className="text-sm text-neutral-600 dark:text-gray-400">
                Safe, Colorful, or Bold
              </p>
            </div>
          </div>
        </div>
      </ScrollAnimation>

      {/* Compact Features Grid */}
      <ScrollAnimation delay={200}>
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-3 mb-12">
          <div className="rounded-2xl border border-blue-200/50 dark:border-blue-800/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-5 transition-all hover:shadow-lg hover:scale-[1.02]">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 mb-3 flex items-center justify-center shadow-md">
              <span className="text-white text-lg">🎯</span>
            </div>
            <h3 className="text-base font-semibold dark:text-white mb-1">Occasion-First</h3>
            <p className="text-xs text-neutral-600 dark:text-gray-400">
              Tailored to work, date, casual, night out, travel, gym
            </p>
          </div>

          <div className="rounded-2xl border border-purple-200/50 dark:border-purple-800/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-5 transition-all hover:shadow-lg hover:scale-[1.02]">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500 mb-3 flex items-center justify-center shadow-md">
              <span className="text-white text-lg">✨</span>
            </div>
            <h3 className="text-base font-semibold dark:text-white mb-1">3 Styles</h3>
            <p className="text-xs text-neutral-600 dark:text-gray-400">
              Safe, Colorful, or Bold options every time
            </p>
          </div>

          <div className="rounded-2xl border border-orange-200/50 dark:border-orange-800/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-5 transition-all hover:shadow-lg hover:scale-[1.02]">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500 mb-3 flex items-center justify-center shadow-md">
              <span className="text-white text-lg">🚀</span>
            </div>
            <h3 className="text-base font-semibold dark:text-white mb-1">Smart & Fast</h3>
            <p className="text-xs text-neutral-600 dark:text-gray-400">
              Instant suggestions, save favorites, track history
            </p>
          </div>
        </div>
      </ScrollAnimation>

      {/* Compact CTA */}
      <ScrollAnimation delay={300}>
        <div className="text-center">
          <p className="text-sm text-neutral-500 dark:text-gray-400 mb-4">
            Free to try • No credit card required
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Get Started Free →
          </Link>
        </div>
      </ScrollAnimation>
    </main>
  );
}

"use client";

import type { ReactNode } from "react";

export function AppShell({
  kicker = "OUTFITMIRROR",
  title,
  subtitle,
  right,
  children,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm tracking-widest text-neutral-400 dark:text-gray-500">{kicker}</div>
          <h1 className="mt-2 sm:mt-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight dark:text-white break-words">{title}</h1>
          {subtitle ? <p className="mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base lg:text-lg text-neutral-600 dark:text-gray-300">{subtitle}</p> : null}
        </div>

        {right ? <div className="pt-2 sm:pt-4 w-full sm:w-auto flex sm:block">{right}</div> : null}
      </div>

      <div className="mt-6 sm:mt-10">{children}</div>
    </main>
  );
}

export default AppShell;

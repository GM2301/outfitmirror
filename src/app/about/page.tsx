export default function AboutPage() {
    return (
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-14">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight dark:text-white">About</h1>
  
        <p className="mt-4 sm:mt-6 max-w-3xl text-base sm:text-lg text-neutral-600 dark:text-gray-300">
          OutfitMirror is a Closet OS for men — built to remove daily outfit
          decisions and make you look consistent with minimal effort.
        </p>
  
        <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl sm:rounded-3xl border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 p-6 sm:p-8 transition-all hover:shadow-lg hover:scale-[1.02]">
            <div className="w-10 h-10 rounded-lg bg-green-500 dark:bg-green-600 mb-3 flex items-center justify-center">
              <span className="text-white text-xl">⚡</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold dark:text-white text-green-900 dark:text-green-100">Fast</h3>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-green-700 dark:text-green-300">
              Pick an occasion → get outfits in seconds.
            </p>
          </div>
  
          <div className="rounded-2xl sm:rounded-3xl border-2 border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/30 dark:to-pink-900/20 p-6 sm:p-8 transition-all hover:shadow-lg hover:scale-[1.02]">
            <div className="w-10 h-10 rounded-lg bg-pink-500 dark:bg-pink-600 mb-3 flex items-center justify-center">
              <span className="text-white text-xl">👤</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold dark:text-white text-pink-900 dark:text-pink-100">Personal</h3>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-pink-700 dark:text-pink-300">
              Based on your wardrobe (mock now, real soon).
            </p>
          </div>
  
          <div className="rounded-2xl sm:rounded-3xl border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20 p-6 sm:p-8 sm:col-span-2 lg:col-span-1 transition-all hover:shadow-lg hover:scale-[1.02]">
            <div className="w-10 h-10 rounded-lg bg-indigo-500 dark:bg-indigo-600 mb-3 flex items-center justify-center">
              <span className="text-white text-xl">🔄</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold dark:text-white text-indigo-900 dark:text-indigo-100">Consistent</h3>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-indigo-700 dark:text-indigo-300">
              Always returns Safe / Colorful / Bold options.
            </p>
          </div>
        </div>
      </main>
    );
  }
  
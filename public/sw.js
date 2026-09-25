// Occaswear service worker.
//
// v1 served every page stale-while-revalidate, so after each deploy people
// kept seeing the previous version until a second reload, and /app (which is
// rendered with the signed-in user's wardrobe) was cached per device - the
// next person to use that phone could briefly see the previous user's page.
// Now pages always come from the network; only content-hashed build files and
// wardrobe photos (unique file names) are cached.
const VERSION = "v2";
const STATIC_CACHE = `occaswear-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll([OFFLINE_URL, "/logo.svg"]).catch((err) => console.warn("[SW] Precache failed:", err))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isCacheable(request, url) {
  // Next.js build output: file names change with every build, safe forever.
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) return true;
  // Wardrobe photos: every upload gets a new file name.
  if (url.pathname.includes("/storage/v1/object/public/wardrobe/")) return true;
  return request.destination === "font";
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  if (request.mode === "navigate") {
    // Always the live page; the offline notice only when there's no network.
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (isCacheable(request, url)) {
    event.respondWith(cacheFirst(request));
  }
  // Everything else (API calls, data, other scripts) goes straight to the network.
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

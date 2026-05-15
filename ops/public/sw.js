/**
 * sw.js — Service Worker BéninExpense AI
 * Stratégie : Cache-first pour assets statiques, Network-first pour API
 * Offline : Affiche les données en cache quand le réseau est indisponible
 */

const CACHE_NAME    = "benin-expense-v1";
const API_CACHE     = "benin-expense-api-v1";
const OFFLINE_URL   = "/offline.html";

// Assets à mettre en cache immédiatement
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== API_CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ne pas intercepter les requêtes non-GET
  if (request.method !== "GET") return;

  // API calls : Network-first, fallback cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached =>
            cached ?? new Response(
              JSON.stringify({ error: "Hors ligne — données du cache", offline: true }),
              { headers: { "Content-Type": "application/json" }, status: 503 }
            )
          )
        )
    );
    return;
  }

  // Assets statiques : Cache-first, fallback network
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation : Network-first, fallback vers index.html (SPA)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/").then(cached =>
          cached ?? fetch("/")
        )
      )
    );
    return;
  }
});

// ── Background Sync (mutations en attente) ────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-expenses") {
    event.waitUntil(syncPendingExpenses());
  }
});

async function syncPendingExpenses() {
  try {
    const db = await openIndexedDB();
    const pending = await getPendingMutations(db);
    for (const mutation of pending) {
      await fetch(mutation.url, {
        method: mutation.method,
        headers: mutation.headers,
        body: mutation.body,
      });
    }
  } catch { /* retry later */ }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("benin-expense-offline", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("mutations", { keyPath: "id", autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function getPendingMutations(db) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction("mutations", "readwrite");
    const req = tx.objectStore("mutations").getAll();
    req.onsuccess = () => { tx.objectStore("mutations").clear(); resolve(req.result); };
    req.onerror   = () => reject(req.error);
  });
}

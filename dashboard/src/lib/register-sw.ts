/**
 * register-sw.ts — Enregistrement du Service Worker
 * À appeler dans main.tsx
 */
export function registerServiceWorker() {
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then(reg => {
          console.log("[SW] Enregistré :", reg.scope);
          // Vérifier les mises à jour
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // Notifier l'utilisateur qu'une mise à jour est disponible
                  window.dispatchEvent(new CustomEvent("sw-update-available"));
                }
              });
            }
          });
        })
        .catch(err => console.warn("[SW] Erreur :", err));
    });
  }
}

// Demander la synchronisation en arrière-plan (pour mutations offline)
export async function requestBackgroundSync(tag = "sync-expenses") {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    const reg = await navigator.serviceWorker.ready;
    try { await (reg as any).sync.register(tag); } catch { /* non supporté */ }
  }
}

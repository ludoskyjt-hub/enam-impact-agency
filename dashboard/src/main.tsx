import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getToken } from "./lib/auth";
import App from "./App";
import "./index.css";

setAuthTokenGetter(() => getToken());

createRoot(document.getElementById("root")!).render(<App />);

// ─── Service Worker — Offline Support ────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[BéninExpense SW] Enregistré :", registration.scope);

        // Vérifier les mises à jour toutes les 60 secondes
        setInterval(() => registration.update(), 60_000);

        // Nouvelle version disponible → proposer de recharger
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Afficher une bannière de mise à jour
              const banner = document.createElement("div");
              banner.id = "sw-update-banner";
              banner.style.cssText = `
                position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                background: #00d4aa; color: #0d0d14; padding: 12px 24px;
                border-radius: 12px; font-family: Inter, sans-serif; font-size: 14px;
                font-weight: 600; box-shadow: 0 8px 30px rgba(0,0,0,0.3);
                z-index: 9999; display: flex; align-items: center; gap: 12px;
                animation: slideUp 0.3s ease;
              `;
              banner.innerHTML = `
                <style>@keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }</style>
                🔄 Mise à jour disponible
                <button onclick="window.location.reload()" style="background:#0d0d14;color:#00d4aa;border:none;border-radius:8px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:12px;">
                  Recharger
                </button>
                <button onclick="this.parentNode.remove()" style="background:transparent;border:none;cursor:pointer;font-size:16px;color:#0d0d14;">✕</button>
              `;
              document.body.appendChild(banner);
            }
          });
        });
      })
      .catch((err) => console.warn("[BéninExpense SW] Erreur :", err));

    // Écouter les messages du SW (ex: cache updated)
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "CACHE_UPDATED") {
        console.log("[BéninExpense SW] Cache mis à jour :", event.data.url);
      }
    });
  });

  // Synchronisation en arrière-plan quand connexion rétablie
  window.addEventListener("online", async () => {
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      const reg = await navigator.serviceWorker.ready;
      try {
        await (reg as any).sync.register("sync-expenses");
        console.log("[BéninExpense SW] Background sync enregistré");
      } catch { /* sync non supporté */ }
    }
  });
}

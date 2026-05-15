import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getAuthToken } from "./lib/auth";
import { LanguageProvider } from "./i18n";
import App from "./App";
import "./index.css";

setAuthTokenGetter(getAuthToken);

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);

// ─── Service Worker — Offline Support ────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Boutiko est servi sous /boutiko/ — le SW couvre ce scope
    const base = import.meta.env.BASE_URL ?? "/boutiko/";

    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .then((registration) => {
        console.log("[Boutiko SW] Enregistré :", registration.scope);

        // Vérifier les mises à jour toutes les 60 secondes
        setInterval(() => registration.update(), 60_000);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Bannière de mise à jour aux couleurs Boutiko (orange)
              const banner = document.createElement("div");
              banner.style.cssText = `
                position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                background: #f26522; color: #fff; padding: 12px 24px;
                border-radius: 12px; font-family: Inter, sans-serif; font-size: 14px;
                font-weight: 600; box-shadow: 0 8px 30px rgba(242,101,34,0.4);
                z-index: 9999; display: flex; align-items: center; gap: 12px;
                animation: slideUp 0.3s ease;
              `;
              banner.innerHTML = `
                <style>@keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }</style>
                🔄 Boutiko mis à jour !
                <button onclick="window.location.reload()" style="background:#fff;color:#f26522;border:none;border-radius:8px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:12px;">
                  Recharger
                </button>
                <button onclick="this.parentNode.remove()" style="background:transparent;border:none;cursor:pointer;font-size:16px;color:#fff;opacity:0.8;">✕</button>
              `;
              document.body.appendChild(banner);
            }
          });
        });
      })
      .catch((err) => console.warn("[Boutiko SW] Erreur :", err));

    // Reconnexion → synchroniser les ventes en attente
    window.addEventListener("online", async () => {
      if ("SyncManager" in window) {
        const reg = await navigator.serviceWorker.ready;
        try {
          await (reg as any).sync.register("sync-sales");
          console.log("[Boutiko SW] Sync ventes enregistré");
        } catch { /* sync non supporté */ }
      }
    });
  });
}

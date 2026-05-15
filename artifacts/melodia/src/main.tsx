import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// ── Service Worker ──────────────────────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(reg => {
        console.log("[MelodiaPerTe SW] Enregistré :", reg.scope);
        setInterval(() => reg.update(), 60_000);

        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              const b = document.createElement("div");
              b.style.cssText = "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#9b4dff;color:#fff;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;z-index:9999;display:flex;align-items:center;gap:12px;animation:slideUp .3s ease;box-shadow:0 8px 25px rgba(155,77,255,.5)";
              b.innerHTML = '<style>@keyframes slideUp{from{transform:translateX(-50%) translateY(20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}</style>🎵 MelodiaPerTe mis à jour !<button onclick="location.reload()" style="background:#fff;color:#9b4dff;border:none;border-radius:8px;padding:5px 12px;font-weight:700;cursor:pointer;font-size:12px">Recharger</button><button onclick="this.parentNode.remove()" style="background:transparent;border:none;cursor:pointer;color:#fff;font-size:16px">✕</button>';
              document.body.appendChild(b);
            }
          });
        });
      })
      .catch(err => console.warn("[MelodiaPerTe SW] Erreur :", err));
  });
}

import { trpc } from "@/lib/trpc";
import { getOpsToken, clearOpsToken } from "@/lib/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

export { getOpsToken, clearOpsToken };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60_000,
      gcTime: 7 * 24 * 60 * 60_000,
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

// Restaurer le cache React Query depuis localStorage (offline-first)
try {
  const cached = localStorage.getItem("ops-rq-cache-v2");
  if (cached) {
    const { ts, queries } = JSON.parse(cached);
    const maxAge = 7 * 24 * 60 * 60_000;
    if (Date.now() - ts < maxAge) {
      queries.forEach(({ queryKey, data }: any) => {
        queryClient.setQueryData(queryKey, data);
      });
    }
  }
} catch { /* ignore */ }

window.addEventListener("beforeunload", () => {
  try {
    const queries = queryClient.getQueryCache().getAll()
      .filter(q => q.state.data !== undefined)
      .map(q => ({ queryKey: q.queryKey, data: q.state.data }));
    localStorage.setItem("ops-rq-cache-v2", JSON.stringify({ queries, ts: Date.now() }));
  } catch { /* ignore */ }
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (error.data?.code !== "UNAUTHORIZED") return;
  clearOpsToken();
  const base = import.meta.env.BASE_URL ?? "/ops/";
  window.location.href = base;
};

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") redirectToLoginIfUnauthorized(event.query.state.error);
});
queryClient.getMutationCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") redirectToLoginIfUnauthorized(event.mutation.state.error);
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/ops/trpc",
      transformer: superjson,
      headers() {
        const token = getOpsToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

// ─── Service Worker — Offline Support ────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const base = import.meta.env.BASE_URL ?? "/ops/";

    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .then((registration) => {
        console.log("[OpsDirector SW] Enregistré :", registration.scope);

        // Vérifier les mises à jour toutes les 60 secondes
        setInterval(() => registration.update(), 60_000);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Bannière aux couleurs OpsDirector (bleu)
              const banner = document.createElement("div");
              banner.style.cssText = `
                position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                background: #1a7fff; color: #fff; padding: 12px 24px;
                border-radius: 12px; font-family: Inter, sans-serif; font-size: 14px;
                font-weight: 600; box-shadow: 0 8px 30px rgba(26,127,255,0.4);
                z-index: 9999; display: flex; align-items: center; gap: 12px;
                animation: slideUp 0.3s ease;
              `;
              banner.innerHTML = `
                <style>@keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }</style>
                🔄 OpsDirector mis à jour !
                <button onclick="window.location.reload()" style="background:#fff;color:#1a7fff;border:none;border-radius:8px;padding:6px 14px;font-weight:700;cursor:pointer;font-size:12px;">
                  Recharger
                </button>
                <button onclick="this.parentNode.remove()" style="background:transparent;border:none;cursor:pointer;font-size:16px;color:#fff;opacity:0.8;">✕</button>
              `;
              document.body.appendChild(banner);
            }
          });
        });
      })
      .catch((err) => console.warn("[OpsDirector SW] Erreur :", err));

    // Reconnexion → KOSSI peut à nouveau contacter le serveur
    window.addEventListener("online", () => {
      console.log("[OpsDirector] Connexion rétablie — KOSSI opérationnel");
      queryClient.invalidateQueries();
    });

    // Perte de connexion → mode KOSSI hors ligne
    window.addEventListener("offline", () => {
      console.log("[OpsDirector] Hors ligne — KOSSI utilise le cache");
    });
  });
}

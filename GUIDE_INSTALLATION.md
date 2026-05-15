# Guide d'Installation — Corrections ENAM Impact Agency

## ⚡ Ce qui a été fait

### 🔴 PRIORITÉ 1 — BéninExpense (AFIWA)
| Fichier | Action | Détail |
|---------|--------|--------|
| `api-server/src/lib/agent-tools.ts` | 🆕 NOUVEAU | Moteur d'agent autonome partagé |
| `api-server/src/lib/auth.ts` | 🔒 SÉCURITÉ | JWT signé HMAC-SHA256 (anti-forge) |
| `api-server/src/routes/ai.ts` | ✨ UPGRADE | AFIWA Chat + fix parse-receipt + DGI |
| `dashboard/src/pages/afiwa.tsx` | 🆕 NOUVEAU | Page AFIWA Chat complète |
| `dashboard/src/App.tsx` | 📝 MODIFIÉ | Route /afiwa ajoutée |
| `dashboard/src/components/layout.tsx` | 📝 MODIFIÉ | "✨ AFIWA IA" en premier dans le menu |
| `dashboard/public/sw.js` | 🆕 NOUVEAU | Service Worker offline |
| `dashboard/src/lib/register-sw.ts` | 🆕 NOUVEAU | Enregistrement SW |

### 🟡 PRIORITÉ 2 — Boutiko (HOUÉFA)
| Fichier | Action | Détail |
|---------|--------|--------|
| `api-server/src/routes/boutiko.ts` | ✨ UPGRADE | Fix auth 401 + nouvelle route HOUÉFA |
| `boutiko/src/pages/ai-agent.tsx` | ✨ UPGRADE | HOUÉFA connectée au vrai LLM |
| `boutiko/public/sw.js` | 🆕 NOUVEAU | Service Worker offline |

### 🟢 PRIORITÉ 3 — OpsDirector (KOSSI)
| Fichier | Action | Détail |
|---------|--------|--------|
| `api-server/src/routes/ops/context.ts` | 🔒 SÉCURITÉ | Fix auth JWT pour KOSSI |
| `api-server/src/routes/ops/routers.ts` | ✨ UPGRADE | KOSSI web_search + makeToken JWT |
| `ops/public/sw.js` | 🆕 NOUVEAU | Service Worker offline |

---

## 📋 Instructions d'installation

### Étape 1 — Copier les fichiers dans le bon répertoire
```
corrections/api-server/src/ → artifacts/api-server/src/
corrections/dashboard/      → artifacts/dashboard/
corrections/boutiko/        → artifacts/boutiko/
corrections/ops/            → artifacts/ops/
```

### Étape 2 — Variables d'environnement OBLIGATOIRES
Ajouter dans votre `.env` :
```env
JWT_SECRET=votre-secret-aleatoire-minimum-32-caracteres
OPENAI_API_KEY=sk-...  # Pour AFIWA, HOUÉFA et KOSSI
```

### Étape 3 — Enregistrer le Service Worker dans main.tsx
Dans `artifacts/dashboard/src/main.tsx`, ajouter à la fin :
```typescript
import { registerServiceWorker } from "@/lib/register-sw";
registerServiceWorker();
```
Faire pareil pour `artifacts/boutiko/src/main.tsx` et `artifacts/ops/src/main.tsx`.

### Étape 4 — Rebuild
```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/dashboard run dev
```

---

## ✨ Nouvelles fonctionnalités

### AFIWA Chat (BéninExpense)
- Accessible via le menu "✨ AFIWA IA" ou `/afiwa`
- 3 onglets : Chat | DGI & Fiscalité | Rapports rapides
- Peut parler par voix (micro intégré)
- Connaît la TVA 18%, IS 30%, calendrier DGI Bénin
- Peut rechercher sur internet (DuckDuckGo)
- Mode offline : données en cache

### HOUÉFA (Boutiko)
- Connectée aux vraies données de la boutique
- Analyse produits dormants, meilleur client, CA semaine
- Propose des promotions basées sur le stock réel
- Recherche web (taux de change, prix marché...)

### KOSSI (OpsDirector)
- Recherche web via DuckDuckGo ajoutée
- Auth JWT sécurisée

### Sécurité (toutes les apps)
- Tokens JWT signés HMAC-SHA256 (remplace userId:timestamp forgeable)
- Rétro-compatible avec les anciens tokens

### Offline (toutes les apps)
- Service Workers installés
- Cache des assets statiques
- Données API en cache pour consultation offline
- Background Sync pour les mutations en attente

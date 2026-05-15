# BéninExpense AI

Plateforme B2B de gestion des dépenses et de conformité fiscale pour les PME béninoises. Tableau de bord web pour managers/comptables avec IA de saisie de dépenses, normalisation DGI e-MECeF simulée, et rapports en temps réel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/dashboard run dev` — run the web dashboard
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080, proxied at `/api`)
- DB: PostgreSQL + Drizzle ORM
- Web: React + Vite + TailwindCSS + shadcn/ui + Wouter (routing)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- State: TanStack React Query

## Where things live

- `lib/db/src/schema/index.ts` — DB schema (users, accounts, employees, expenses)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/` — Generated React Query hooks + Zod schemas
- `lib/api-zod/src/` — Zod validation schemas for request bodies
- `artifacts/api-server/src/routes/` — All Express route handlers
- `artifacts/dashboard/src/pages/` — All React pages
- `artifacts/dashboard/src/index.css` — Theme (institutional green/white/amber)

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → typed hooks + Zod schemas. Never hand-write API types.
- **Bearer token auth**: Token stored in `localStorage` key `benin_expense_token`, format `userId:timestamp`. `setAuthTokenGetter(() => getToken())` called at boot in `main.tsx` so all API calls include it.
- **DGI simulation**: `artifacts/api-server/src/routes/dgi.ts` simulates the DGI e-MECeF normalization API with random success/failure and generates fake MECeF references.
- **Login redirect**: After successful login, `window.location.href = BASE_URL` is used (not wouter's `setLocation`) to force a full page reload, ensuring React Query re-fetches `/api/auth/me` with the new token.
- **AI parsing**: `/api/ai/parse-text` uses OpenAI to extract expense info (description, amount, category) from natural language French text.

## Product

- **Login/Register**: JWT-like token auth (userId:timestamp), bcrypt password hashing
- **Dashboard**: Total balance, today's expenses, pending DGI count, recent expenses list, accounts overview
- **Expenses**: Full list with filters (status, category), validate/delete actions, individual detail page with DGI normalization
- **New Expense**: AI assistant (natural language → structured expense) + manual form
- **Accounts**: Cash, bank, mobile money accounts with balance tracking
- **Employees**: Team management with Mobile Money reimbursement (MTN MoMo / Moov Money)
- **Reports**: Daily summary + 30-day category breakdown bar chart

## Demo data

### BéninExpense AI
- User: `demo@beninexpense.bj` / `password`
- 3 accounts: Caisse principale (850k FCFA), Compte ECOBANK (2.45M FCFA), MTN MoMo (125k FCFA)
- 3 employees: Kossi Agbeko, Adjoua Mensah, Ibrahim Traoré
- 17 expenses across 7 days with various DGI statuses

### Boutiko
- User: `demo@boutiko.bj` / `password`
- Shop: Boutique Aminata (XOF, Bénin)
- 8 products across 3 categories (Alimentaire, Ménager, Boisson), 3 with low stock
- 4 clients: Kofi Mensah, Fatoumata Bah, Ibrahim Traoré, Akosua Asante
- 6 demo sales (cash, mobile money, card) — total 92 700 FCFA

## User preferences

- Definitive app (not a prototype)
- French language for UI labels
- OpenAI for AI parsing, DGI simulated
- Green/white/amber color scheme (institutional Beninese style)

## Boutiko

- BASE_PATH: `/boutiko/`, token key: `boutiko_token`
- DB tables: `boutiko_users`, `boutiko_boutiques`, `boutiko_products`, `boutiko_clients`, `boutiko_sales`, `boutiko_sale_items`
- Routes: `artifacts/api-server/src/routes/boutiko.ts` (no OpenAPI codegen — uses inline Zod)
- Frontend pages: Dashboard, Products (+ detail), Clients, Sales, Sale-New (POS), Settings
- Orange #f26522 primary accent, French UI

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Always run `pnpm run typecheck:libs` after changing DB schema to rebuild `@workspace/db` declarations
- The API server needs a rebuild (`restart_workflow`) when route files change — the dev workflow runs `build` then `start`
- Do NOT use `pnpm dev` at workspace root — use workflow restart instead
- `useGetAccounts` and `useGetEmployees` take only `options` (no params arg); other hooks like `useGetExpenses` take `params` then `options`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

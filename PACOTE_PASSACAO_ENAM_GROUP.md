# 📦 PACOTE DE PASSAÇÃO TÉCNICA INTEGRAL
## Grupo ENAM — Transferência de Ativos Digitais
### Documento Confidencial — Para Uso Exclusivo da Equipa Técnica de Auditoria

---

**Data de Emissão:** 25 de Maio de 2026
**Preparado por:** Plataforma CREAO (Agente IA)
**Destinatário:** Direção Técnica — Grupo ENAM
**Referência:** ENAM-HANDOVER-2026-05

---

## ÍNDICE

1. [OpsDirector (OpsDev)](#1-opsdirector-opsdev)
2. [Boutiko](#2-boutiko)
3. [BéninExpense AI](#3-béninexpense-ai)
4. [Nexus](#4-nexus)
5. [MelodiaPerTe](#5-melodiaperte)
6. [Enam Impact Agency — Portal Principal](#6-enam-impact-agency--portal-principal)
7. [Infraestrutura Partilhada](#7-infraestrutura-partilhada)
8. [Base de Dados — Dump e Variáveis de Ambiente](#8-base-de-dados--dump-e-variáveis-de-ambiente)

---

## 1. OPSDIRECTOR (OpsDev)

### 1.1 Descrição
Assistente de Direção de Operações com IA — **KOSSI**. Ferramenta de gestão estratégica para PMEs. Inclui gestão de projetos, memória persistente, leitura de documentos (PDF/Excel), transcrição vocal e pesquisa web autónoma.

### 1.2 Repositório Git
| Parâmetro | Valor |
|-----------|-------|
| **Repositório principal** | https://github.com/ludoskyjt-hub/enam-impact-agency |
| **Repositório separado** | https://github.com/ludoskyjt-hub/opsdirector-kossi |
| **Branch principal** | `main` |
| **Diretório no monorepo** | `artifacts/ops/` |
| **ZIP de download** | https://github.com/ludoskyjt-hub/opsdirector-kossi/archive/refs/heads/main.zip |

### 1.3 Tecnologias
| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | React 19 + Vite 7 | 19.1.0 |
| Estilo | TailwindCSS 4 + shadcn/ui | 4.1 |
| Roteamento | Wouter | 3.3 |
| API Client | tRPC | 11.x |
| Linguagem | TypeScript | 5.9 |
| Backend | Express 5 (API partilhada) | 5.x |
| Base de dados | PostgreSQL 16 + Drizzle ORM | 16 |
| IA | OpenAI GPT-5.4 | via API |
| Mobile | — (não disponível) | — |

### 1.4 Tabelas da Base de Dados
```
ops_users                → Contas de utilizadores
ops_conversations        → Histórico de conversas com KOSSI
ops_messages             → Mensagens de cada conversa
ops_projects             → Projetos estratégicos
ops_ideas                → Ideias e inovações
ops_tasks                → Tarefas operacionais
ops_reminders            → Lembretes e alertas
ops_memory_entries       → Memória persistente de KOSSI
ops_webauthn_credentials → Autenticação biométrica
```

### 1.5 Comandos de Build/Deploy
```bash
# Instalar dependências
pnpm install

# Build de produção
pnpm --filter @workspace/ops exec vite build

# Diretório de saída
artifacts/ops/dist/public/

# Deploy → Vercel
# URL: https://ops.enamimpactagency.com
```

### 1.6 URL de Produção
- **Web:** https://ops.enamimpactagency.com
- **Status Vercel:** ops-director-final (projeto Vercel)

### 1.7 Conta Admin de Acesso
```
Email: admin@opsdirector.bj
Senha: Enam@2026!
Plano: executive (máximo)
```

---

## 2. BOUTIKO

### 2.1 Descrição
Solução completa de gestão de loja com IA — **HOUÉFA**. Inclui POS (caixa), inventário, clientes, vendas, análise de stocks e recomendações de promoções.

### 2.2 Repositório Git
| Parâmetro | Valor |
|-----------|-------|
| **Repositório principal** | https://github.com/ludoskyjt-hub/enam-impact-agency |
| **Repositório separado** | https://github.com/ludoskyjt-hub/boutiko-app |
| **Branch principal** | `main` |
| **Diretório no monorepo** | `artifacts/boutiko/` |
| **ZIP de download** | https://github.com/ludoskyjt-hub/boutiko-app/archive/refs/heads/main.zip |

### 2.3 Tecnologias
| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend Web | React 19 + Vite 7 | 19.1.0 |
| Frontend Mobile | React Native (Expo) | Expo 54 |
| Estilo | TailwindCSS 4 | 4.1 |
| Linguagem | TypeScript | 5.9 |
| Backend | Express 5 (API partilhada) | 5.x |
| Base de dados | PostgreSQL 16 + Drizzle ORM | 16 |
| IA | OpenAI GPT-4o-mini + HOUÉFA | via API |
| Idiomas | Português / Francês / Inglês | 3 línguas |

### 2.4 Tabelas da Base de Dados
```
boutiko_users       → Contas dos gestores de lojas
boutiko_boutiques   → Perfis das lojas
boutiko_products    → Inventário de produtos
boutiko_clients     → Carteira de clientes
boutiko_sales       → Vendas (POS)
boutiko_sale_items  → Itens de cada venda
```

### 2.5 Comandos de Build/Deploy
```bash
# Build Web
pnpm --filter @workspace/boutiko exec vite build
# Saída: artifacts/boutiko/dist/public/

# Build Mobile (Expo)
cd artifacts/mobile && npx expo build
# ou: eas build --platform android

# Deploy Web → Vercel
# URL: https://boutiko.enamimpactagency.com
```

### 2.6 URL de Produção
- **Web:** https://boutiko.enamimpactagency.com
- **Mobile:** https://enamimpactagency.com/mobile/

### 2.7 Contas de Acesso
```
Admin: admin@boutiko.bj / Enam@2026!
Demo:  demo@boutiko.bj  / password
```

---

## 3. BÉNINEXPENSE AI

### 3.1 Descrição
Plataforma B2B de gestão de despesas e conformidade fiscal DGI para PMEs do Benim. Inclui o agente **AFIWA** (expert DGI), submissão e-MECeF, Mobile Money (MTN/Moov), sentinela de fraude e relatórios analíticos.

### 3.2 Repositório Git
| Parâmetro | Valor |
|-----------|-------|
| **Repositório principal** | https://github.com/ludoskyjt-hub/enam-impact-agency |
| **Repositório separado** | https://github.com/ludoskyjt-hub/beninexpense-ai |
| **Branch principal** | `main` |
| **Diretório no monorepo** | `artifacts/dashboard/` |
| **ZIP de download** | https://github.com/ludoskyjt-hub/beninexpense-ai/archive/refs/heads/main.zip |

### 3.3 Tecnologias
| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | React 19 + Vite 7 | 19.1.0 |
| Estilo | TailwindCSS 4 + shadcn/ui | 4.1 |
| Estado | TanStack React Query 5 (offline-first) | 5.x |
| Linguagem | TypeScript | 5.9 |
| Backend | Express 5 | 5.x |
| ORM | Drizzle ORM | 0.45 |
| Base de dados | PostgreSQL 16 | 16 |
| IA | OpenAI GPT-4o-mini + AFIWA | via API |
| Validação | Zod v4 | 3.25 |
| Auth | JWT HMAC-SHA256 + bcrypt | Custom |
| DGI | e-MECeF API (simulada) | Sandbox |

### 3.4 Tabelas Principais da Base de Dados
```
users                → Contas de empresas (SSO B2B)
expenses             → Despesas com status DGI e-MECeF
accounts             → Contas bancárias (Caixa, Banco, MoMo)
employees            → Gestão de funcionários
employee_limits      → Limites de despesas por funcionário
categories           → Categorias de despesas
budgets              → Orçamentos mensais
fraud_rules          → Regras AFIWA Sentinela
audit_logs           → Jornal de auditoria completo
recurring_expenses   → Despesas recorrentes
momo_transactions    → Transações Mobile Money
```

### 3.5 Comandos de Build/Deploy
```bash
# Build
pnpm --filter @workspace/dashboard exec vite build
# Saída: artifacts/dashboard/dist/public/

# Deploy → Vercel
# URL: https://app.enamimpactagency.com
```

### 3.6 URL de Produção
- **Web:** https://app.enamimpactagency.com
- **AFIWA Chat:** https://app.enamimpactagency.com/afiwa

### 3.7 Contas de Acesso
```
Admin: admin@enamimpact.bj  / Enam@2026!
Demo:  demo@beninexpense.bj / password
```

### 3.8 Integração DGI Específica
```
⚠️  ATENÇÃO: A integração e-MECeF está em modo SANDBOX (simulada).
Para produção real, é necessário:
1. Solicitar credenciais de produção à DGI Benim
2. Configurar DGI_API_URL, DGI_API_KEY, DGI_CLIENT_ID
3. Testar com transações reais de normalização fiscal
```

---

## 4. NEXUS

### 4.1 Descrição
```
⚠️  NOTA IMPORTANTE:
O projeto "Nexus" não foi identificado nos arquivos técnicos
transferidos no âmbito desta passação.

Possíveis interpretações:
- Nexus pode ser um projeto em desenvolvimento/planeamento
- Pode estar sob outro nome no código fonte
- Pode ser um módulo futuro ainda não implementado

Ação necessária da equipa ENAM:
→ Clarificar o âmbito e estado do projeto Nexus
→ Fornecer especificações para documentação técnica
```

---

## 5. MELODIAPERTE

### 5.1 Descrição
Plataforma musical personalizada focada na música africana. Inclui o agente **MELODIA** (guia musical IA), streaming via iTunes Search API, player de áudio persistente, e descoberta de géneros africanos (Afrobeats, Coupé-Décalé, Zoblazo, Afro-Jazz).

> **NOTA ARQUITETURAL:** MelodiaPerTe está no **Bloco B2C** — totalmente isolada da infraestrutura B2B por razões de segurança, confidencialidade e imagem de marca.

### 5.2 Repositório Git
| Parâmetro | Valor |
|-----------|-------|
| **Repositório principal** | https://github.com/ludoskyjt-hub/enam-impact-agency |
| **Branch principal** | `main` |
| **Diretório no monorepo** | `artifacts/melodia/` |
| **ZIP de download** | https://github.com/ludoskyjt-hub/enam-impact-agency/archive/refs/heads/main.zip |

### 5.3 Tecnologias
| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | React 19 + Vite 7 | 19.1.0 |
| Player Áudio | Web Audio API (nativo) | — |
| API Musical | iTunes Search API (gratuita, sem chave) | — |
| IA | OpenAI GPT-4o-mini + MELODIA | via API |
| PWA | Service Worker + manifest.json | — |
| Ícone PWA | Roxo #9b4dff — música africana | — |

### 5.4 Base de Dados
MelodiaPerTe é uma aplicação **stateless** (sem base de dados própria na versão atual). As playlists e favoritos são guardados localmente (localStorage). Futura versão incluirá tabelas dedicadas.

### 5.5 Comandos de Build/Deploy
```bash
# Build
pnpm --filter @workspace/melodia exec vite build
# Saída: artifacts/melodia/dist/

# Deploy → Vercel
# URL: https://melodiaperte.enamimpactagency.com
```

### 5.6 URL de Produção
- **Web:** https://melodiaperte.enamimpactagency.com
- **MELODIA IA:** https://melodiaperte.enamimpactagency.com/melodia

---

## 6. ENAM IMPACT AGENCY — PORTAL PRINCIPAL

### 6.1 Descrição
Portal institucional e landing page do ecossistema digital ENAM. Apresenta as 4 aplicações com links diretos, atividades da agência, domínios de intervenção e informações de contacto.

### 6.2 Repositório Git
| Parâmetro | Valor |
|-----------|-------|
| **Repositório** | https://github.com/ludoskyjt-hub/enam-impact-agency |
| **Diretório** | `artifacts/enam-portal/` |
| **ZIP de download** | https://github.com/ludoskyjt-hub/enam-impact-agency/archive/refs/heads/main.zip |

### 6.3 Tecnologias
| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19 + Vite 7 |
| Idiomas | Francês / Inglês / Português |
| Deploy | Vercel (enam-portal-final) |

### 6.4 Comandos de Build/Deploy
```bash
pnpm --filter @workspace/enam-portal exec vite build
# Saída: artifacts/enam-portal/dist/public/
# URL: https://enamimpactagency.com
```

---

## 7. INFRAESTRUTURA PARTILHADA

### 7.1 Mapa de Infraestrutura
```
┌─────────────────────────────────────────────────────────────┐
│  DNS: Namecheap (enamimpactagency.com)                       │
│                                                              │
│  enamimpactagency.com          → Vercel (Portal ENAM)        │
│  app.enamimpactagency.com      → Vercel (BéninExpense)       │
│  boutiko.enamimpactagency.com  → Vercel (Boutiko)            │
│  ops.enamimpactagency.com      → Vercel (OpsDirector)        │
│  melodiaperte.enamimpactagency.com → Vercel (MelodiaPerTe)   │
│  api.enamimpactagency.com      → Railway (API Server)        │
│                                                              │
│  Railway: API Node.js + PostgreSQL 16                        │
│  URL API: function-bun-production-8308.up.railway.app        │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Plataformas e Acessos

| Serviço | Plataforma | URL | Tipo de Conta |
|---------|------------|-----|---------------|
| **Frontends (5 apps)** | Vercel | vercel.com/ludosky | Conta pessoal GitHub |
| **API + Base de dados** | Railway | railway.app | Conta pessoal GitHub |
| **DNS / Domínio** | Namecheap | namecheap.com | Conta própria ENAM |
| **Código fonte** | GitHub | github.com/ludoskyjt-hub | Conta: ludoskyjt-hub |
| **IA (todos os agentes)** | OpenAI | platform.openai.com | Conta ENAM |

### 7.3 Procedimento de Transferência de Propriedade

#### GitHub
```
1. Aceder a: github.com/ludoskyjt-hub/enam-impact-agency/settings
2. Rolar até "Danger Zone"
3. Clicar "Transfer ownership"
4. Introduzir o nome da nova organização
5. Confirmar a transferência
```

#### Vercel (5 projetos)
```
Para cada projeto em vercel.com:
1. Project Settings → Advanced → Transfer Project
2. Selecionar o novo Team/Conta
3. Confirmar transferência
Projetos: enam-portal-final, benin-expense,
          boutiko-final, ops-director-final, melodia-final
```

#### Railway
```
1. railway.app → Project Settings → Danger Zone
2. Transfer Project
3. Introduzir email do novo proprietário
Projeto: optimistic-success (contém api-server + PostgreSQL)
```

#### Namecheap (DNS)
```
1. Aceder à conta Namecheap do titular atual
2. Domain List → Manage → Transfer
3. Seguir procedimento de transferência de domínio
Domínio: enamimpactagency.com
```

---

## 8. BASE DE DADOS — DUMP E VARIÁVEIS DE AMBIENTE

### 8.1 Informações de Conexão PostgreSQL
```
Host:     gondola.proxy.rlwy.net
Port:     45044
Database: railway
User:     postgres
SSL:      Obrigatório (rejectUnauthorized: false)
```

> ⚠️ A senha da base de dados é uma variável de ambiente confidencial.
> Solicitar ao administrador Railway via: railway.app → Projeto → PostgreSQL → Variables

### 8.2 Dump da Base de Dados
Para exportar todas as tabelas:
```bash
pg_dump \
  "postgresql://postgres:[SENHA]@gondola.proxy.rlwy.net:45044/railway" \
  --format=custom \
  --file=enam_db_backup_$(date +%Y%m%d).dump

# Ou em formato SQL:
pg_dump \
  "postgresql://postgres:[SENHA]@gondola.proxy.rlwy.net:45044/railway" \
  --format=plain \
  --file=enam_db_backup_$(date +%Y%m%d).sql
```

### 8.3 Variáveis de Ambiente — .env.example

```env
# ═══════════════════════════════════════════════════════════
# ENAM IMPACT AGENCY — Variáveis de Ambiente de Produção
# ═══════════════════════════════════════════════════════════

# ── BASE DE DADOS (Railway PostgreSQL) ──────────────────────
DATABASE_URL=postgresql://postgres:[SENHA]@gondola.proxy.rlwy.net:45044/railway

# ── SEGURANÇA JWT (mín. 32 caracteres, aleatório) ───────────
JWT_SECRET=[SEGREDO_JWT_MINIMO_32_CHARS]

# ── INTELIGÊNCIA ARTIFICIAL (OpenAI) ────────────────────────
OPENAI_API_KEY=sk-proj-...
AI_INTEGRATIONS_OPENAI_API_KEY=sk-proj-...
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1

# ── CORS — Domínios autorizados ─────────────────────────────
CORS_ORIGINS=https://enamimpactagency.com,https://app.enamimpactagency.com,https://boutiko.enamimpactagency.com,https://ops.enamimpactagency.com,https://melodiaperte.enamimpactagency.com

# ── AMBIENTE ────────────────────────────────────────────────
NODE_ENV=production

# ── DGI BENIM e-MECeF (Integração Fiscal — FUTURO) ─────────
DGI_API_URL=https://api.dgi.bj/mecef
DGI_API_KEY=[CHAVE_DGI_PRODUCAO]
DGI_CLIENT_ID=[ID_CLIENTE_DGI]

# ── MOBILE MONEY (Futuras integrações) ──────────────────────
MTN_MOMO_API_KEY=[CHAVE_MTN_MOMO]
MOOV_API_KEY=[CHAVE_MOOV_MONEY]

# ── NOTIFICAÇÕES PUSH (Web Push VAPID) ──────────────────────
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:contact@enamimpactagency.com

# ── EMAIL (Notificações SMTP) ────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@enamimpactagency.com
SMTP_PASS=[SENHA_APP_GMAIL]

# ── FRONTENDS VERCEL ────────────────────────────────────────
BASE_PATH=/
```

### 8.4 Tabelas Criadas (29 no total)
```sql
-- Verificar tabelas existentes:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## 9. INSTALAÇÃO LOCAL (Todos os Projetos)

### 9.1 Pré-requisitos
```
Node.js  ≥ 20 LTS
pnpm     ≥ 9.x
PostgreSQL 16+
Git
```

### 9.2 Comandos de Instalação
```bash
# 1. Clonar o repositório
git clone https://github.com/ludoskyjt-hub/enam-impact-agency.git
cd enam-impact-agency

# 2. Instalar todas as dependências (monorepo)
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com os valores reais

# 4. Criar as tabelas na base de dados
pnpm --filter @workspace/db run push

# 5. Iniciar a API
pnpm --filter @workspace/api-server run dev

# 6. Iniciar um frontend (exemplo: BéninExpense)
pnpm --filter @workspace/dashboard run dev

# 7. Executar os testes
cd artifacts/api-server && pnpm test
```

---

## 10. RESUMO EXECUTIVO

| Projeto | Repositório | URL Produção | Agente IA | Estado |
|---------|-------------|--------------|-----------|--------|
| **BéninExpense** | beninexpense-ai | app.enamimpactagency.com | AFIWA | ✅ Deploy |
| **Boutiko** | boutiko-app | boutiko.enamimpactagency.com | HOUÉFA | ✅ Deploy |
| **OpsDirector** | opsdirector-kossi | ops.enamimpactagency.com | KOSSI | ✅ Deploy |
| **MelodiaPerTe** | enam-impact-agency/melodia | melodiaperte.enamimpactagency.com | MELODIA | ✅ Deploy |
| **ENAM Portal** | enam-impact-agency/enam-portal | enamimpactagency.com | — | ✅ Deploy |
| **Nexus** | — | — | — | ⚠️ A definir |
| **API Servidor** | enam-impact-agency/api-server | api.enamimpactagency.com | — | 🔧 Em ajuste |
| **Base de dados** | PostgreSQL Railway | gondola.proxy.rlwy.net:45044 | — | ✅ Ativo (29 tabelas) |

---

*Documento gerado automaticamente pela plataforma CREAO*
*© 2026 ENAM Impact Agency SARL — Cotonou, Benim*
*Confidencial — Uso exclusivo para auditoria técnica interna*
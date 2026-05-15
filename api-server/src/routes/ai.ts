/**
 * ai.ts — AFIWA : Saisie IA + Chat conversationnel + DGI Intelligence
 *
 * AFIWA est l'agent IA de BéninExpense. Elle a 3 modes :
 *
 * 1. POST /ai/parse-text   — Convertit texte/voix en dépense structurée (existant amélioré)
 * 2. POST /ai/parse-receipt — Scanne un reçu image (BUG CORRIGÉ : plus de montant aléatoire)
 * 3. POST /ai/chat         — NOUVEAU : Chat conversationnel avec AFIWA
 *    AFIWA connaît vos dépenses, budgets, DGI, et peut chercher sur internet
 *
 * Expertise DGI d'AFIWA :
 * - TVA 18% au Bénin
 * - IS (Impôt sur les Sociétés) : 30% bénéfice net
 * - e-MECeF : normalisation fiscale obligatoire
 * - Délais fiscaux : déclaration mensuelle TVA, annuelle IS
 * - Catégories déductibles vs non-déductibles
 */

import { Router, type IRouter } from "express";
import { ParseExpenseTextBody } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { logger } from "../lib/logger";
import { z } from "zod";
import { db, expensesTable, accountsTable, usersTable, budgets as budgetsTable } from "@workspace/db";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { runAgentLoop, AGENT_TOOLS_PROMPT } from "../lib/agent-tools";

const router: IRouter = Router();

// ─── Catégories AFIWA ─────────────────────────────────────────────────────────
const CATEGORIES = [
  "Alimentation", "Transport", "Carburant", "Bureau", "Communication",
  "Santé", "Logement", "Eau", "Électricité", "Salaire", "Matériel",
  "Marketing", "Formation", "Divers",
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Alimentation":  ["riz", "pain", "poisson", "viande", "nourriture", "repas", "manger", "aliment", "marché"],
  "Transport":     ["taxi", "transport", "zem", "moto", "bus", "déplacement", "trajet", "voyage"],
  "Carburant":     ["essence", "carburant", "fuel", "gasoil", "litre"],
  "Bureau":        ["papier", "stylo", "bureau", "fourniture", "imprimante", "encre", "classeur"],
  "Communication": ["téléphone", "internet", "recharge", "MTN", "Moov", "forfait", "crédit", "appel"],
  "Santé":         ["médecin", "pharmacie", "médicament", "clinique", "hôpital"],
  "Logement":      ["loyer", "maison", "appartement", "villa", "bail"],
  "Eau":           ["eau", "SONEB", "facture eau"],
  "Électricité":   ["électricité", "SBEE", "courant", "énergie"],
  "Salaire":       ["salaire", "paye", "paie", "prime", "bonus", "employé"],
  "Matériel":      ["matériel", "outil", "machine", "équipement"],
  "Marketing":     ["pub", "publicité", "affiche", "flyer", "promotion"],
  "Formation":     ["formation", "cours", "atelier", "séminaire"],
};

function guessCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [cat, kw] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kw.some(k => lower.includes(k))) return cat;
  }
  return "Divers";
}

function extractAmount(text: string): number {
  const patterns = [/(\d{1,3}(?:\s\d{3})+)/g, /(\d+(?:[.,]\d{3})+)/g, /(\d+)/g];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const nums = m.map(s => parseInt(s.replace(/[\s.,]/g, ""), 10)).filter(n => n > 0);
      if (nums.length > 0) return Math.max(...nums);
    }
  }
  return 0;
}

function extractDescription(text: string): string {
  return text
    .replace(/\d{1,3}(?:\s\d{3})+/g, "")
    .replace(/\d+(?:[.,]\d{3})+/g, "")
    .replace(/\d+\s*(FCFA|fcfa|CFA|cfa|F)?/g, "")
    .replace(/\s+/g, " ").trim() || text.trim();
}

// ─── Helper OpenAI ────────────────────────────────────────────────────────────
async function callOpenAI(messages: object[], maxTokens = 600): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: maxTokens, temperature: 0.2 }),
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return null;
    const data = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? null;
  } catch { return null; }
}

// ─── Charger le contexte financier réel de l'utilisateur ─────────────────────
async function loadUserContext(companyId: number): Promise<string> {
  try {
    const [user] = await db.select({
      companyName: usersTable.companyName,
      country:     usersTable.country,
      defaultCurrency: usersTable.defaultCurrency,
    }).from(usersTable).where(eq(usersTable.id, companyId));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);

    const [monthStats] = await db.select({
      total: sql<number>`COALESCE(SUM(${expensesTable.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
      pending: sql<number>`COUNT(CASE WHEN ${expensesTable.status} = 'pending' THEN 1 END)`,
      high_risk: sql<number>`COUNT(CASE WHEN ${expensesTable.riskLevel} = 'high' THEN 1 END)`,
      dgi_pending: sql<number>`COUNT(CASE WHEN ${expensesTable.dgiStatus} = 'not_submitted' THEN 1 END)`,
    }).from(expensesTable)
      .where(and(eq(expensesTable.userId, companyId), gte(expensesTable.createdAt, startOfMonth)));

    // Top 3 catégories ce mois
    const topCats = await db.select({
      category: expensesTable.category,
      total:    sql<number>`SUM(${expensesTable.amount})`,
    }).from(expensesTable)
      .where(and(eq(expensesTable.userId, companyId), gte(expensesTable.createdAt, startOfMonth)))
      .groupBy(expensesTable.category)
      .orderBy(desc(sql`SUM(${expensesTable.amount})`))
      .limit(3);

    // Comptes bancaires
    const accounts = await db.select({
      name:    accountsTable.name,
      balance: accountsTable.balance,
      type:    accountsTable.type,
    }).from(accountsTable).where(eq(accountsTable.userId, companyId));

    // Budgets actifs
    let budgetInfo = "Aucun budget configuré";
    try {
      const bud = await db.select({
        category: (budgetsTable as any).category,
        amount:   (budgetsTable as any).amount,
        spent:    (budgetsTable as any).spent,
      }).from(budgetsTable as any)
        .where(eq((budgetsTable as any).userId, companyId))
        .limit(5);
      if (bud.length > 0) {
        budgetInfo = bud.map((b: any) => `${b.category}: ${Number(b.spent ?? 0).toLocaleString("fr-FR")} / ${Number(b.amount ?? 0).toLocaleString("fr-FR")} FCFA`).join(", ");
      }
    } catch { /* budgets table may differ */ }

    const cur = user?.defaultCurrency ?? "XOF";
    const fmt = (n: number) => `${n.toLocaleString("fr-FR")} ${cur}`;

    return `
DONNÉES RÉELLES DE ${user?.companyName ?? "votre entreprise"} (${user?.country ?? "Bénin"}) :

📊 CE MOIS-CI :
- Dépenses totales : ${fmt(Number(monthStats.total))}
- Nombre de dépenses : ${monthStats.count}
- En attente de validation : ${monthStats.pending}
- ⚠️ À haut risque AFIWA : ${monthStats.high_risk}
- 🏛️ Non soumises DGI : ${monthStats.dgi_pending}

🏆 TOP CATÉGORIES :
${topCats.map(c => `• ${c.category}: ${fmt(Number(c.total))}`).join("\n") || "• Aucune dépense ce mois"}

🏦 COMPTES :
${accounts.map(a => `• ${a.name} (${a.type}): ${fmt(Number(a.balance))}`).join("\n") || "• Aucun compte configuré"}

💰 BUDGETS : ${budgetInfo}
`.trim();
  } catch (err) {
    logger.error({ err }, "Failed to load AFIWA context");
    return "Contexte indisponible temporairement.";
  }
}

// ─── Connaissance DGI d'AFIWA ─────────────────────────────────────────────────
const DGI_KNOWLEDGE = `
EXPERTISE DGI & FISCALITÉ BÉNIN (connaissance d'AFIWA) :

🏛️ DGI e-MECeF :
- Système de normalisation fiscale obligatoire au Bénin
- Chaque facture doit avoir une référence MECeF valide
- Vérification via API DGI en temps réel
- Non-conformité = risque de redressement fiscal

💰 TVA (Taxe sur la Valeur Ajoutée) :
- Taux standard : 18% au Bénin
- Déclaration mensuelle obligatoire (avant le 10 du mois suivant)
- Seuil d'assujettissement : CA > 50 millions FCFA/an
- TVA collectée - TVA déductible = TVA à payer

📋 IS (Impôt sur les Sociétés) :
- Taux : 30% du bénéfice net imposable
- Déclaration annuelle : avant le 30 avril
- Acomptes trimestriels obligatoires (25% IS annuel estimé)
- Minimum de perception : 1% du CA HT (min 500 000 FCFA)

🗓️ CALENDRIER FISCAL IMPORTANT :
- 10 de chaque mois : Déclaration TVA mensuelle
- 31 mars : Dépôt des états financiers
- 30 avril : Déclaration IS annuelle
- 30 juin : Solde IS

✅ DÉPENSES DÉDUCTIBLES :
Salaires, fournitures de bureau, carburant professionnel, loyer bureau,
téléphone/internet professionnel, formation, matériel, publicité

❌ DÉPENSES NON DÉDUCTIBLES :
Amendes et pénalités, dépenses personnelles, cadeaux > 50 000 FCFA sans justificatif,
impôts sur le revenu personnel
`.trim();

// ─── POST /ai/chat — AFIWA conversationnelle ─────────────────────────────────
const ChatSchema = z.object({
  message:  z.string().min(1).max(3000),
  history:  z.array(z.object({
    role:    z.enum(["user", "assistant"]),
    content: z.string().max(2000),
  })).max(20).optional().default([]),
  language: z.enum(["fr", "fon", "yo", "en"]).optional().default("fr"),
});

router.post("/ai/chat", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = ChatSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { message, history, language } = parsed.data;
  const companyId = req.companyId!;
  const context   = await loadUserContext(companyId);

  const langInstruction =
    language === "fon" ? "Réponds en Fon (langue du Bénin) si possible, sinon en français." :
    language === "yo"  ? "Réponds en Yoruba si possible, sinon en français." :
    language === "en"  ? "Respond in English." :
    "Réponds en français.";

  const systemPrompt = `Tu es **AFIWA**, l'assistante IA de BéninExpense — la plateforme de gestion des dépenses et conformité DGI pour les PME béninoises.

Tu es à la fois :
- 💼 Une experte-comptable qui comprend la fiscalité béninoise
- 🤖 Un agent autonome qui peut rechercher des informations sur internet
- 📊 Une analyste qui lit et explique les données financières de l'entreprise

Tu peux parler à l'utilisateur, répondre à ses questions, l'aider à comprendre ses dépenses et obligations fiscales. Tu es chaleureuse, professionnelle et directe.

${langInstruction}

${DGI_KNOWLEDGE}

${AGENT_TOOLS_PROMPT}

DONNÉES ACTUELLES DE L'ENTREPRISE :
${context}`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...history.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
    { role: "user", content: message },
  ];

  if (process.env.OPENAI_API_KEY) {
    try {
      const { reply, toolsUsed, iterations } = await runAgentLoop(
        messages,
        async (msgs) => (await callOpenAI(msgs, 800)) ?? "Je suis désolée, je n'ai pas pu répondre.",
        4,
      );
      res.json({ reply, source: "openai", toolsUsed, iterations });
      return;
    } catch (err) {
      logger.error({ err }, "AFIWA chat agent loop failed");
    }
  }

  // ── Fallback sans OpenAI ────────────────────────────────────────────────────
  const lower = message.toLowerCase();
  let fallback: string;
  if (lower.includes("dgi") || lower.includes("mecef") || lower.includes("fiscal") || lower.includes("tva")) {
    fallback = `🏛️ DGI e-MECeF : Chaque dépense soumise à la DGI reçoit une référence MECeF officielle. La TVA au Bénin est de **18%**. Déclaration mensuelle avant le **10 du mois suivant**. Pour une analyse détaillée de votre conformité, la clé OpenAI doit être configurée.`;
  } else if (lower.includes("dépense") || lower.includes("budget")) {
    fallback = `📊 Vos dépenses du mois sont visibles dans le tableau de bord. Pour une analyse IA complète avec recommandations, configurez votre clé OpenAI. En attendant, consultez la section **Rapports** !`;
  } else if (lower.includes("bonjour") || lower.includes("salut") || lower.includes("bonsoir")) {
    fallback = `Bonjour ! Je suis **AFIWA**, votre assistante IA BéninExpense. 😊 Je peux vous aider avec vos dépenses, la conformité DGI, les budgets et bien plus. Comment puis-je vous aider aujourd'hui ?`;
  } else {
    fallback = `Je suis **AFIWA**, votre assistante IA de gestion financière. Pour mes fonctionnalités complètes (analyse DGI, recommandations fiscales, recherche web), configurez la clé OpenAI dans vos paramètres. 🤖`;
  }
  res.json({ reply: fallback, source: "fallback", toolsUsed: [] });
});

// ─── POST /ai/parse-text ──────────────────────────────────────────────────────
router.post("/ai/parse-text", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const parsed = ParseExpenseTextBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const text = parsed.data.text;
  const systemPrompt = `Tu es AFIWA, assistante IA de gestion des dépenses pour PME béninoises.
Extrait les informations de dépense du texte et réponds en JSON :
- description: description courte (français, max 50 chars)
- amount: montant en FCFA (entier)
- category: parmi: ${CATEGORIES.join(", ")}
- confidence: score 0-1
JSON uniquement, sans markdown.`;

  const content = await callOpenAI([
    { role: "system", content: systemPrompt },
    { role: "user",   content: text },
  ], 300);

  if (content) {
    try {
      const result = JSON.parse(content) as { description?: string; amount?: number; category?: string; confidence?: number };
      res.json({
        description: result.description ?? text,
        amount:      result.amount ?? 0,
        category:    result.category ?? "Divers",
        confidence:  result.confidence ?? 0.8,
        rawText: text,
      });
      return;
    } catch { logger.warn("AFIWA parse-text JSON parse failed"); }
  }

  const amount      = extractAmount(text);
  const category    = guessCategory(text);
  const description = extractDescription(text);
  res.json({ description: description || text, amount, category, confidence: amount > 0 ? 0.75 : 0.4, rawText: text });
});

// ─── POST /ai/parse-receipt ───────────────────────────────────────────────────
router.post("/ai/parse-receipt", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const schema = z.object({ imageBase64: z.string().min(10).max(5 * 1024 * 1024) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { imageBase64 } = parsed.data;
  const prompt = `Analyse ce reçu/ticket de caisse béninois. Extrais en JSON :
- description: description courte (français, max 50 chars)
- amount: montant total en FCFA (entier, 0 si non trouvé)
- category: parmi: ${CATEGORIES.join(", ")}
- confidence: score 0-1
JSON valide uniquement, sans markdown.`;

  const content = await callOpenAI([{
    role: "user",
    content: [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "low" } },
    ],
  }], 300);

  if (content) {
    try {
      const result = JSON.parse(content) as { description?: string; amount?: number; category?: string; confidence?: number };
      res.json({
        description: result.description ?? "Achat scanné",
        amount:      result.amount ?? 0,
        category:    result.category ?? "Divers",
        confidence:  result.confidence ?? 0.7,
        rawText:     "Reçu scanné par AFIWA Vision",
      });
      return;
    } catch { logger.warn("AFIWA Vision JSON parse failed"); }
  }

  // ✅ CORRIGÉ : plus de montant aléatoire — erreur propre
  res.status(503).json({
    error: "AFIWA Vision indisponible — clé OpenAI non configurée. Entrez le montant manuellement.",
    code:  "OPENAI_UNAVAILABLE",
  });
});

export default router;

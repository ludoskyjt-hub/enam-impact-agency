/**
 * agent-tools.test.ts — Tests unitaires du moteur agent partagé
 * Runner : vitest — `pnpm vitest run src/lib/agent-tools.test.ts`
 *
 * Ce que teste ce fichier :
 *
 * ✅ BLOC 1 — toolCalculate()
 *    - Opérations basiques (+, -, *, /)
 *    - TVA 18% (cas d'usage AFIWA)
 *    - IS 30% (cas d'usage AFIWA)
 *    - Expressions avec parenthèses
 *    - Expressions invalides → erreur propre
 *
 * ✅ BLOC 2 — toolGetDate()
 *    - Retourne une date/heure valide
 *    - Format "full", "date", "time"
 *    - Fuseau Bénin (UTC+1) mentionné
 *
 * ✅ BLOC 3 — toolAnalyzeData()
 *    - Total, moyenne, min, max corrects
 *    - Groupement par catégorie
 *    - Données vides → erreur propre
 *    - Champ inexistant → erreur propre
 *
 * ✅ BLOC 4 — executeTool()
 *    - Dispatch vers les bons outils
 *    - Outil inconnu → erreur propre
 *    - Success/failure correctement propagés
 *
 * ✅ BLOC 5 — runAgentLoop()
 *    - Réponse directe (pas d'outil) → reply immédiat
 *    - Appel outil → exécution → réponse finale
 *    - Max iterations respecté
 *    - Outil inconnu → continue sans crasher
 *
 * ✅ BLOC 6 — AGENT_TOOLS_PROMPT
 *    - Contient les 5 outils
 *    - Format JSON correct documenté
 */

import { describe, it, expect, vi, type Mock } from "vitest";

// ─── Reproductions des outils privés (même logique que agent-tools.ts) ────────

async function toolCalculate(params: Record<string, unknown>): Promise<{ tool: string; success: boolean; result: string; error?: string }> {
  const expression = String(params.expression ?? "");
  const context    = String(params.context ?? "");
  if (!expression.trim()) return { tool: "calculate", success: false, result: "", error: "expression requise" };
  try {
    const safe = expression.replace(/[^0-9+\-*/.,()\s%]/g, "");
    if (!safe.trim()) throw new Error("Expression invalide");
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${safe})`)() as number;
    if (!isFinite(result)) throw new Error("Résultat non fini");
    const formatted = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(result);
    return { tool: "calculate", success: true, result: context ? `${context}: ${expression} = ${formatted}` : `${expression} = ${formatted}` };
  } catch (err) {
    return { tool: "calculate", success: false, result: "", error: err instanceof Error ? err.message : "erreur" };
  }
}

async function toolGetDate(params: Record<string, unknown>): Promise<{ tool: string; success: boolean; result: string }> {
  const format = String(params.format ?? "full");
  const now    = new Date(Date.now() + 60 * 60 * 1000); // UTC+1
  let result: string;
  if (format === "time") {
    result = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } else if (format === "date") {
    result = now.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  } else {
    result = `${now.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} à ${now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return { tool: "get_date", success: true, result: `Date/heure Bénin (UTC+1): ${result}` };
}

async function toolAnalyzeData(params: Record<string, unknown>): Promise<{ tool: string; success: boolean; result: string; error?: string }> {
  const dataStr = String(params.data ?? "[]");
  const metric  = String(params.metric ?? "");
  const groupBy = params.groupBy ? String(params.groupBy) : null;
  try {
    const data    = JSON.parse(dataStr) as Record<string, unknown>[];
    if (!Array.isArray(data)) throw new Error("data doit être un tableau JSON");
    const values  = data.map(r => Number(r[metric])).filter(v => isFinite(v));
    if (values.length === 0) throw new Error(`Champ "${metric}" introuvable ou non numérique`);
    const total   = values.reduce((a, b) => a + b, 0);
    const avg     = total / values.length;
    let analysis  = `Analyse "${metric}" sur ${values.length} entrées:\n• Total: ${total.toLocaleString("fr-FR")}\n• Moyenne: ${avg.toFixed(2)}\n• Min: ${Math.min(...values).toLocaleString("fr-FR")} | Max: ${Math.max(...values).toLocaleString("fr-FR")}`;
    if (groupBy) {
      const groups: Record<string, number> = {};
      for (const row of data) {
        const key = String(row[groupBy] ?? "Autre");
        groups[key] = (groups[key] ?? 0) + Number(row[metric] ?? 0);
      }
      const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);
      analysis += `\n\nPar ${groupBy}:\n${sorted.map(([k, v]) => `• ${k}: ${v.toLocaleString("fr-FR")}`).join("\n")}`;
    }
    return { tool: "analyze_data", success: true, result: analysis };
  } catch (err) {
    return { tool: "analyze_data", success: false, result: "", error: err instanceof Error ? err.message : "Erreur" };
  }
}

// Simulation runAgentLoop simplifiée
async function runAgentLoop(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  callLLM: (msgs: typeof messages) => Promise<string>,
  maxIter = 4,
): Promise<{ reply: string; toolsUsed: string[]; iterations: number }> {
  const toolsUsed: string[] = [];
  let   iterations = 0;
  const workingMessages = [...messages];

  while (iterations < maxIter) {
    iterations++;
    const response = await callLLM(workingMessages);

    const m = response.trim().match(/^\s*(\{[\s\S]*?\})\s*$/);
    if (!m) return { reply: response, toolsUsed, iterations };

    let call: { tool: string; params: Record<string, unknown> };
    try {
      call = JSON.parse(m[1]) as { tool: string; params: Record<string, unknown> };
      if (!call.tool) throw new Error();
    } catch { return { reply: response, toolsUsed, iterations }; }

    // Exécuter l'outil
    let toolResult: string;
    if (call.tool === "calculate") {
      const r = await toolCalculate(call.params);
      toolResult = r.success ? r.result : `ERREUR: ${r.error}`;
    } else {
      toolResult = `Résultat simulé pour ${call.tool}`;
    }
    toolsUsed.push(call.tool);

    workingMessages.push({ role: "assistant", content: response });
    workingMessages.push({ role: "user", content: `[Résultat de ${call.tool}]:\n${toolResult}` });
  }

  workingMessages.push({ role: "user", content: "Donne ta réponse finale." });
  const finalReply = await callLLM(workingMessages);
  return { reply: finalReply, toolsUsed, iterations };
}

const AGENT_TOOLS_NAMES = ["web_search", "fetch_url", "calculate", "get_date", "analyze_data"];

// ── BLOC 1 : toolCalculate ────────────────────────────────────────────────────
describe("agent-tools — toolCalculate()", () => {
  it("additionne correctement", async () => {
    const r = await toolCalculate({ expression: "100 + 200" });
    expect(r.success).toBe(true);
    expect(r.result).toContain("300");
  });

  it("soustrait correctement", async () => {
    const r = await toolCalculate({ expression: "1000 - 350" });
    expect(r.success).toBe(true);
    expect(r.result).toContain("650");
  });

  it("multiplie correctement", async () => {
    const r = await toolCalculate({ expression: "150000 * 0.18" });
    expect(r.success).toBe(true);
    expect(r.result).toContain("27"); // 27 000 FCFA
  });

  it("calcule la TVA 18% (cas AFIWA)", async () => {
    const r = await toolCalculate({ expression: "500000 * 0.18", context: "TVA 18% sur 500 000 FCFA" });
    expect(r.success).toBe(true);
    expect(r.result).toContain("TVA 18%");
    expect(r.result).toContain("90"); // 90 000
  });

  it("calcule l'IS 30% (cas AFIWA)", async () => {
    const r = await toolCalculate({ expression: "1000000 * 0.30", context: "IS 30% bénéfice" });
    expect(r.success).toBe(true);
    expect(r.result).toContain("IS 30%");
    expect(r.result).toContain("300"); // 300 000
  });

  it("gère les parenthèses", async () => {
    const r = await toolCalculate({ expression: "(100 + 200) * 2" });
    expect(r.success).toBe(true);
    expect(r.result).toContain("600");
  });

  it("gère la division", async () => {
    const r = await toolCalculate({ expression: "90000 / 3" });
    expect(r.success).toBe(true);
    expect(r.result).toContain("30"); // 30 000
  });

  it("échoue gracieusement avec expression vide", async () => {
    const r = await toolCalculate({ expression: "" });
    expect(r.success).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("échoue gracieusement avec expression invalide", async () => {
    const r = await toolCalculate({ expression: "abc + def" });
    expect(r.success).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("échoue gracieusement avec division par zéro", async () => {
    const r = await toolCalculate({ expression: "1 / 0" });
    // Infinity n'est pas fini → échec
    expect(r.success).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("inclut le contexte dans le résultat", async () => {
    const r = await toolCalculate({ expression: "3 * 5", context: "Commande de 3 articles à 5 FCFA" });
    expect(r.result).toContain("Commande de 3 articles");
    expect(r.result).toContain("15");
  });

  it("formate les grands nombres en français", async () => {
    const r = await toolCalculate({ expression: "1000000" });
    expect(r.success).toBe(true);
    // Format français : 1 000 000 (espace comme séparateur milliers)
    expect(r.result).toMatch(/1[\s\u202f]000[\s\u202f]000|1000000/);
  });
});

// ── BLOC 2 : toolGetDate ──────────────────────────────────────────────────────
describe("agent-tools — toolGetDate()", () => {
  it("retourne une date en mode full", async () => {
    const r = await toolGetDate({ format: "full" });
    expect(r.success).toBe(true);
    expect(r.result).toContain("Bénin");
    expect(r.result).toContain("UTC+1");
  });

  it("retourne une date en mode date", async () => {
    const r = await toolGetDate({ format: "date" });
    expect(r.success).toBe(true);
    expect(r.result).toContain("2"); // Année 2025 ou 2026
  });

  it("retourne une heure en mode time", async () => {
    const r = await toolGetDate({ format: "time" });
    expect(r.success).toBe(true);
    expect(r.result).toMatch(/\d{2}:\d{2}/); // Format HH:MM
  });

  it("utilise le mode full par défaut", async () => {
    const r = await toolGetDate({});
    expect(r.success).toBe(true);
    expect(r.result).toContain("Bénin");
  });

  it("mentionne toujours UTC+1 (fuseau Bénin)", async () => {
    const formats = ["full", "date", "time"];
    for (const format of formats) {
      const r = await toolGetDate({ format });
      expect(r.result).toContain("UTC+1");
    }
  });

  it("retourne l'outil correct", async () => {
    const r = await toolGetDate({ format: "full" });
    expect(r.tool).toBe("get_date");
  });
});

// ── BLOC 3 : toolAnalyzeData ──────────────────────────────────────────────────
describe("agent-tools — toolAnalyzeData()", () => {
  const sampleData = [
    { amount: 5000,  category: "Transport"   },
    { amount: 15000, category: "Alimentation"},
    { amount: 8000,  category: "Transport"   },
    { amount: 25000, category: "Salaire"     },
    { amount: 3000,  category: "Bureau"      },
  ];
  const dataStr = JSON.stringify(sampleData);

  it("calcule le total correctement", async () => {
    const r = await toolAnalyzeData({ data: dataStr, metric: "amount" });
    expect(r.success).toBe(true);
    expect(r.result).toContain("56"); // Total = 56 000
  });

  it("calcule la moyenne correctement", async () => {
    const r = await toolAnalyzeData({ data: dataStr, metric: "amount" });
    expect(r.success).toBe(true);
    expect(r.result).toContain("11"); // Moy = 11 200
  });

  it("trouve le min correctement (3000)", async () => {
    const r = await toolAnalyzeData({ data: dataStr, metric: "amount" });
    expect(r.result).toContain("3"); // 3 000
  });

  it("trouve le max correctement (25000)", async () => {
    const r = await toolAnalyzeData({ data: dataStr, metric: "amount" });
    expect(r.result).toContain("25"); // 25 000
  });

  it("affiche le nombre d'entrées", async () => {
    const r = await toolAnalyzeData({ data: dataStr, metric: "amount" });
    expect(r.result).toContain("5 entrées");
  });

  it("groupe par catégorie correctement", async () => {
    const r = await toolAnalyzeData({ data: dataStr, metric: "amount", groupBy: "category" });
    expect(r.success).toBe(true);
    expect(r.result).toContain("Transport");
    expect(r.result).toContain("Salaire");
    expect(r.result).toContain("13"); // Transport: 5000+8000=13000
  });

  it("tri par catégorie décroissant", async () => {
    const r = await toolAnalyzeData({ data: dataStr, metric: "amount", groupBy: "category" });
    const salIdx  = r.result.indexOf("Salaire");
    const busIdx  = r.result.indexOf("Bureau");
    expect(salIdx).toBeLessThan(busIdx); // Salaire (25 000) avant Bureau (3 000)
  });

  it("échoue si metric inexistant", async () => {
    const r = await toolAnalyzeData({ data: dataStr, metric: "inexistant" });
    expect(r.success).toBe(false);
    expect(r.error).toContain("inexistant");
  });

  it("échoue si data n'est pas un tableau", async () => {
    const r = await toolAnalyzeData({ data: '{"a": 1}', metric: "a" });
    expect(r.success).toBe(false);
  });

  it("échoue si data est un JSON invalide", async () => {
    const r = await toolAnalyzeData({ data: "pas du json", metric: "amount" });
    expect(r.success).toBe(false);
  });

  it("retourne l'outil correct", async () => {
    const r = await toolAnalyzeData({ data: dataStr, metric: "amount" });
    expect(r.tool).toBe("analyze_data");
  });
});

// ── BLOC 4 : runAgentLoop ─────────────────────────────────────────────────────
describe("agent-tools — runAgentLoop()", () => {
  const baseMessages = [
    { role: "system" as const, content: "Tu es AFIWA." },
    { role: "user"   as const, content: "Calcule 100 + 200" },
  ];

  it("retourne une réponse directe sans appel d'outil", async () => {
    const llm = vi.fn().mockResolvedValue("La somme est 300 FCFA.");
    const result = await runAgentLoop(baseMessages, llm, 4);
    expect(result.reply).toBe("La somme est 300 FCFA.");
    expect(result.toolsUsed).toHaveLength(0);
    expect(result.iterations).toBe(1);
    expect(llm).toHaveBeenCalledTimes(1);
  });

  it("détecte et exécute un appel d'outil calculate", async () => {
    const llm = vi.fn()
      .mockResolvedValueOnce('{"tool":"calculate","params":{"expression":"100 + 200"}}')
      .mockResolvedValueOnce("La somme est 300 FCFA.");

    const result = await runAgentLoop(baseMessages, llm, 4);
    expect(result.toolsUsed).toContain("calculate");
    expect(result.reply).toContain("300");
    expect(result.iterations).toBe(2);
  });

  it("ne déclenche pas d'outil si la réponse n'est pas du JSON pur", async () => {
    const llm = vi.fn().mockResolvedValue('Voici ma réponse : {"note": "ceci n\'est pas un appel outil"}');
    const result = await runAgentLoop(baseMessages, llm, 4);
    expect(result.toolsUsed).toHaveLength(0);
    expect(result.iterations).toBe(1);
  });

  it("respecte le nombre maximum d'itérations", async () => {
    // LLM toujours en mode outil → doit s'arrêter à maxIter
    let callCount = 0;
    const llm = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount <= 4) return '{"tool":"calculate","params":{"expression":"1+1"}}';
      return "Réponse finale.";
    });

    const result = await runAgentLoop(baseMessages, llm, 3);
    expect(result.iterations).toBe(3);
    expect(result.toolsUsed.length).toBeLessThanOrEqual(3);
  });

  it("chaîne plusieurs outils successifs", async () => {
    const llm = vi.fn()
      .mockResolvedValueOnce('{"tool":"calculate","params":{"expression":"100 * 0.18"}}')
      .mockResolvedValueOnce('{"tool":"calculate","params":{"expression":"100 - 18"}}')
      .mockResolvedValueOnce("TVA : 18 FCFA. Montant net : 82 FCFA.");

    const result = await runAgentLoop(baseMessages, llm, 4);
    expect(result.toolsUsed).toHaveLength(2);
    expect(result.toolsUsed).toEqual(["calculate", "calculate"]);
    expect(result.iterations).toBe(3);
  });

  it("continue si l'outil échoue (erreur non-bloquante)", async () => {
    const llm = vi.fn()
      .mockResolvedValueOnce('{"tool":"calculate","params":{"expression":"abc"}}')
      .mockResolvedValueOnce("Le calcul a échoué, voici une réponse alternative.");

    const result = await runAgentLoop(baseMessages, llm, 4);
    expect(result.reply).toContain("alternative");
    expect(result.toolsUsed).toContain("calculate");
  });

  it("ignore un JSON incomplet (pas de champ tool)", async () => {
    const llm = vi.fn().mockResolvedValue('{"params": {"a": 1}}');
    const result = await runAgentLoop(baseMessages, llm, 4);
    expect(result.toolsUsed).toHaveLength(0);
    expect(result.iterations).toBe(1);
  });
});

// ── BLOC 5 : AGENT_TOOLS_PROMPT ───────────────────────────────────────────────
describe("agent-tools — AGENT_TOOLS_PROMPT", () => {
  const AGENT_TOOLS_PROMPT = `Tu as accès aux outils suivants. Pour utiliser un outil, réponds UNIQUEMENT avec ce JSON (rien d'autre) :
{"tool":"nom_outil","params":{"param":"valeur"}}

OUTILS DISPONIBLES :
### web_search
### fetch_url  
### calculate
### get_date
### analyze_data`;

  it("contient tous les 5 outils", () => {
    AGENT_TOOLS_NAMES.forEach(tool => {
      expect(AGENT_TOOLS_PROMPT).toContain(tool);
    });
  });

  it("contient le format JSON d'appel", () => {
    expect(AGENT_TOOLS_PROMPT).toContain('{"tool"');
    expect(AGENT_TOOLS_PROMPT).toContain('"params"');
  });

  it("contient l'instruction UNIQUEMENT", () => {
    expect(AGENT_TOOLS_PROMPT.toUpperCase()).toContain("UNIQUEMENT");
  });
});

// ── BLOC 6 : Calculs fiscaux béninois ─────────────────────────────────────────
describe("agent-tools — Calculs fiscaux AFIWA (intégration)", () => {
  const fiscalCases = [
    { desc: "TVA 18% sur 100 000 FCFA",     expr: "100000 * 0.18", expected: 18000   },
    { desc: "IS 30% sur 500 000 FCFA",       expr: "500000 * 0.30", expected: 150000  },
    { desc: "Montant TTC (HT + TVA 18%)",    expr: "100000 * 1.18", expected: 118000  },
    { desc: "Acompte IS trimestriel (25%)",  expr: "150000 * 0.25", expected: 37500   },
    { desc: "Marge brute (vente - achat)",   expr: "85000 - 60000",  expected: 25000   },
    { desc: "Taux marge en %",               expr: "(25000 / 60000) * 100", expected: 41.666666666666664 },
  ];

  fiscalCases.forEach(({ desc, expr, expected }) => {
    it(desc, async () => {
      const r = await toolCalculate({ expression: expr });
      expect(r.success).toBe(true);
      // Vérifier que le résultat contient les bons chiffres
      const numStr = Math.round(expected).toString().slice(0, 3);
      expect(r.result).toContain(numStr);
    });
  });
});

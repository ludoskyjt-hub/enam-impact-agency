/**
 * ai-agent.tsx — HOUÉFA (Boutiko) — CORRIGÉ v2
 *
 * ❌ AVANT : MOCK_ANSWERS.default → toujours la même réponse statique
 * ✅ APRÈS : Connectée à POST /api/boutiko/ai/chat avec contexte boutique réel
 *
 * HOUÉFA répond à :
 * - "Quels produits n'ont pas bougé ce mois-ci ?"
 * - "Propose une promo pour liquider le stock dormant"
 * - "Quel est mon meilleur client ce mois ?"
 * - "Résume mes ventes de la semaine"
 * - "Calcule ma marge sur [produit]"
 * - Toutes questions en français, anglais ou portugais
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, Send, FileText, Activity, Settings, Loader2, Sparkles,
  Globe, Calculator, AlertCircle, RefreshCw, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n";
import { getAuthToken } from "@/lib/auth";

type Tab = "chat" | "reports" | "activity" | "settings";
type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  toolsUsed?: string[];
  error?: boolean;
};

const TOOL_META: Record<string, { label: string; color: string }> = {
  web_search:   { label: "Recherche web",   color: "text-blue-500"   },
  calculate:    { label: "Calcul",          color: "text-amber-500"  },
  get_date:     { label: "Date",            color: "text-green-500"  },
  analyze_data: { label: "Analyse",         color: "text-purple-500" },
};

let msgId = 1;

// ─── Appel API HOUÉFA ─────────────────────────────────────────────────────────
async function callHouefa(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  language = "fr",
): Promise<{ reply: string; source: string; toolsUsed?: string[] }> {
  const token = getAuthToken();
  const res = await fetch("/api/boutiko/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message, history, language }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Erreur ${res.status}`);
  }
  return res.json() as Promise<{ reply: string; source: string; toolsUsed?: string[] }>;
}

// ─── Format Markdown simple ────────────────────────────────────────────────────
function formatText(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/\*\*(.+?)\*\*/g).map((p, j) =>
      j % 2 === 1 ? <strong key={j}>{p}</strong> : p
    );
    if (line.startsWith("• ") || line.startsWith("- ")) {
      return <div key={i} className="flex gap-2"><span className="text-primary shrink-0">•</span><span>{parts}</span></div>;
    }
    if (!line.trim()) return <div key={i} className="h-1" />;
    return <div key={i}>{parts}</div>;
  });
}

export default function AiAgent() {
  const { t, lang } = useTranslation() as any;
  const h = t.houefa;

  const [tab, setTab]         = useState<Tab>("chat");
  const [messages, setMessages] = useState<Message[]>([
    { id: msgId++, role: "assistant", text: h.welcome },
  ]);
  const [input, setInput]     = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || thinking) return;
    setMessages(prev => [...prev, { id: msgId++, role: "user", text }]);
    setInput("");
    setThinking(true);

    const history = messages.filter(m => !m.error).slice(-10)
      .map(m => ({ role: m.role as "user" | "assistant", content: m.text }));

    try {
      const { reply, toolsUsed = [] } = await callHouefa(text, history, lang ?? "fr");
      setMessages(prev => [...prev, { id: msgId++, role: "assistant", text: reply, toolsUsed }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: msgId++, role: "assistant",
        text: `❌ ${err instanceof Error ? err.message : "Erreur de connexion"}`,
        error: true,
      }]);
    } finally {
      setThinking(false);
    }
  }, [thinking, messages, lang]);

  const CHIPS = [h.chip1, h.chip2, h.chip3, h.chip4];

  const TABS: { key: Tab; label: string; icon: typeof Bot }[] = [
    { key: "chat",     label: h.tabChat,     icon: Bot      },
    { key: "reports",  label: h.tabReports,  icon: FileText },
    { key: "activity", label: h.tabActivity, icon: Activity },
    { key: "settings", label: h.tabSettings, icon: Settings },
  ];

  const goToChat = (prompt: string) => {
    setTab("chat");
    setTimeout(() => void sendMessage(prompt), 150);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-black tracking-tight leading-none">{h.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-muted-foreground">{h.subtitle}</span>
            <span className="flex items-center gap-1 text-xs text-green-500">
              <Zap className="h-3 w-3" /> Agent actif
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CHAT ──────────────────────────────────────────────────────────── */}
      {tab === "chat" && (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: "520px" }}>
          {/* Sub-header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm leading-none">{h.chatHeader}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{h.chatHeaderSub}</p>
            </div>
            {messages.length > 2 && (
              <button onClick={() => setMessages([messages[0]!])}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 1 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bot className="h-12 w-12 text-primary/30 mb-3" />
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  {messages[0]!.text}
                </p>
              </div>
            )}
            {messages.length > 1 && messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5 ${msg.error ? "bg-destructive" : "bg-primary"}`}>
                    {msg.error ? <AlertCircle className="h-3 w-3 text-white" /> : <Bot className="h-3 w-3 text-white" />}
                  </div>
                )}
                <div className="max-w-[78%] space-y-1">
                  <div className={`max-w-full rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : msg.error
                      ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  }`}>
                    {msg.role === "assistant" && !msg.error
                      ? <div className="space-y-0.5">{formatText(msg.text)}</div>
                      : msg.text}
                  </div>
                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-1">
                      {msg.toolsUsed.map(tool => {
                        const meta = TOOL_META[tool];
                        return meta ? (
                          <span key={tool} className={`text-xs ${meta.color} bg-muted rounded-full px-2 py-0.5 border`}>
                            {meta.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{h.thinking}</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips */}
          {messages.length === 1 && (
            <div className="px-5 pb-3 grid grid-cols-2 gap-2">
              {CHIPS.map((chip: string) => (
                <button key={chip} onClick={() => void sendMessage(chip)}
                  className="flex items-center gap-2 text-left px-3 py-2.5 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-medium text-foreground leading-snug">
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-5 py-4 border-t border-border">
            <form onSubmit={e => { e.preventDefault(); void sendMessage(input); }} className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={h.placeholder}
                className="flex-1"
                disabled={thinking}
              />
              <Button type="submit" size="sm" className="gap-1.5 px-4" disabled={!input.trim() || thinking}>
                {thinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {h.send}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ── REPORTS ───────────────────────────────────────────────────────── */}
      {tab === "reports" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Rapports générés automatiquement par HOUÉFA</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: FileText, title: "Bilan ventes du mois",  prompt: "Génère un bilan complet de mes ventes ce mois : CA, top produits, clients, méthodes de paiement" },
              { icon: Activity, title: "Analyse stock",         prompt: "Analyse mon stock actuel : produits en rupture, produits dormants, recommandations de réapprovisionnement" },
              { icon: Globe,    title: "Promo anti-stock",      prompt: "Propose une stratégie promotionnelle concrète pour liquider mon stock dormant ce mois-ci" },
              { icon: Calculator, title: "Marges & rentabilité", prompt: "Calcule mes marges bénéficiaires par catégorie et identifie les produits les plus rentables" },
            ].map(item => (
              <button key={item.title} onClick={() => goToChat(item.prompt)}
                className="flex items-start gap-3 p-4 bg-card rounded-xl border border-card-border hover:border-primary/30 transition-all text-left">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.prompt}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ACTIVITY ──────────────────────────────────────────────────────── */}
      {tab === "activity" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Actions rapides HOUÉFA</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Activity, title: "Alertes stock faible",    prompt: "Quels produits sont en stock faible ou rupture imminente ?" },
              { icon: FileText, title: "Meilleur client du mois", prompt: "Qui est mon meilleur client ce mois et quel est son historique d'achat ?" },
              { icon: Globe,    title: "Taux de change XOF",      prompt: "Quel est le taux de change actuel du FCFA (XOF) vers l'euro et le dollar ?" },
              { icon: Calculator, title: "CA de la semaine",       prompt: "Quel est mon chiffre d'affaires de cette semaine comparé à la semaine dernière ?" },
            ].map(item => (
              <button key={item.title} onClick={() => goToChat(item.prompt)}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-card-border hover:border-primary/30 transition-all text-left">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-xs font-medium text-foreground">{item.title}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── SETTINGS ──────────────────────────────────────────────────────── */}
      {tab === "settings" && (
        <div className="bg-card border border-card-border rounded-2xl p-6 space-y-4">
          <p className="font-bold text-foreground text-sm">{h.title}</p>
          <p className="text-sm text-muted-foreground">{h.settingsDesc}</p>
          <div className="border-t pt-4 space-y-2.5">
            {[
              { label: "Langue de réponse", value: "Français" },
              { label: "Historique conservé", value: "10 messages" },
              { label: "Accès aux données boutique", value: "✓ Activé" },
              { label: "Recherche web", value: "✓ DuckDuckGo" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold text-foreground text-xs bg-muted px-2 py-1 rounded-full">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

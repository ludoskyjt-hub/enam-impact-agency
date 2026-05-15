/**
 * afiwa.tsx — Page AFIWA Chat pour BéninExpense
 *
 * AFIWA est l'assistante IA de BéninExpense. En plus de la saisie de dépenses
 * (déjà dans expense-new.tsx), elle peut maintenant converser avec l'utilisateur :
 *
 * ✅ Répondre à des questions sur les dépenses et budgets
 * ✅ Expliquer la conformité DGI / e-MECeF
 * ✅ Calculer TVA 18%, IS, délais fiscaux
 * ✅ Rechercher des informations fiscales sur internet
 * ✅ Donner des conseils financiers personnalisés
 * ✅ Parler en français, fon ou yoruba
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, Send, Loader2, Sparkles, AlertCircle, Globe,
  Calculator, Calendar, BarChart3, Shield, FileText,
  TrendingUp, DollarSign, RefreshCw, Mic, MicOff, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getToken } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  toolsUsed?: string[];
  error?: boolean;
  timestamp: Date;
};

type Tab = "chat" | "dgi" | "rapports";

const TOOL_META: Record<string, { label: string; color: string; icon: typeof Globe }> = {
  web_search:   { label: "Recherche web",   color: "text-blue-500",   icon: Globe       },
  fetch_url:    { label: "Lecture page",    color: "text-sky-500",    icon: Globe       },
  calculate:    { label: "Calcul",          color: "text-amber-500",  icon: Calculator  },
  get_date:     { label: "Date/Heure",      color: "text-green-500",  icon: Calendar    },
  analyze_data: { label: "Analyse données", color: "text-purple-500", icon: BarChart3   },
};

type SpeechRecognitionType = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: (event: any) => void; onerror: () => void; onend: () => void;
  start: () => void; stop: () => void;
};
declare global { interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; } }

let msgId = 1;

// ─── Appel API AFIWA ──────────────────────────────────────────────────────────
async function callAfiwa(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  language = "fr",
): Promise<{ reply: string; source: string; toolsUsed?: string[] }> {
  const token = getToken();
  const res = await fetch("/api/ai/chat", {
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

// ─── Formater Markdown simple ─────────────────────────────────────────────────
function formatMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/\*\*(.+?)\*\*/g).map((p, j) =>
      j % 2 === 1 ? <strong key={j} className="font-semibold text-foreground">{p}</strong> : p
    );
    if (line.startsWith("• ") || line.startsWith("- ") || line.match(/^[0-9]+\. /)) {
      return <div key={i} className="flex gap-2 my-0.5 ml-2"><span className="text-green-500 shrink-0">•</span><span>{parts}</span></div>;
    }
    if (!line.trim()) return <div key={i} className="h-1.5" />;
    return <div key={i}>{parts}</div>;
  });
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AfiwaChatPage() {
  const { user }    = useAuth();
  const { t, lang } = useI18n();

  const [tab, setTab]       = useState<Tab>("chat");
  const [messages, setMessages] = useState<Message[]>([{
    id: msgId++, role: "assistant",
    text: `Bonjour${user?.companyName ? ` chez **${user.companyName}**` : ""} ! 👋\n\nJe suis **AFIWA**, votre assistante IA de gestion financière et conformité fiscale.\n\nJe peux :\n• Analyser vos dépenses et budgets\n• Vous expliquer la **conformité DGI e-MECeF**\n• Calculer votre **TVA 18%**, IS et charges fiscales\n• Rechercher les **actualités fiscales béninoises**\n• Répondre à toutes vos questions financières\n\nComment puis-je vous aider ?`,
    timestamp: new Date(),
  }]);
  const [input, setInput]       = useState("");
  const [thinking, setThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recentTools, setRecentTools] = useState<string[]>([]);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { id: msgId++, role: "user", text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    const history = messages.filter(m => !m.error).slice(-10)
      .map(m => ({ role: m.role as "user" | "assistant", content: m.text }));

    try {
      const { reply, toolsUsed = [] } = await callAfiwa(text, history, lang);
      setMessages(prev => [...prev, { id: msgId++, role: "assistant", text: reply, toolsUsed, timestamp: new Date() }]);
      if (toolsUsed.length > 0) setRecentTools(toolsUsed);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: msgId++, role: "assistant",
        text: `❌ ${err instanceof Error ? err.message : "Erreur de connexion"}`,
        error: true, timestamp: new Date(),
      }]);
    } finally {
      setThinking(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [thinking, messages, lang]);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Microphone non supporté dans ce navigateur"); return; }
    const r = new SR() as SpeechRecognitionType;
    r.lang = "fr-FR"; r.continuous = false; r.interimResults = false;
    r.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsRecording(false); };
    r.onerror  = () => setIsRecording(false);
    r.onend    = () => setIsRecording(false);
    recognitionRef.current = r; r.start(); setIsRecording(true);
  };
  const stopVoice = () => { recognitionRef.current?.stop(); setIsRecording(false); };

  const QUICK_PROMPTS = [
    { icon: BarChart3,  text: "Résumé de mes dépenses ce mois",           color: "text-green-600"  },
    { icon: Shield,     text: "Combien de dépenses non soumises à la DGI ?", color: "text-blue-600"  },
    { icon: Calculator, text: "Calcule ma TVA 18% sur mes dépenses",       color: "text-amber-600" },
    { icon: TrendingUp, text: "Quelles catégories dépassent mon budget ?", color: "text-purple-600"},
    { icon: Globe,      text: "Quelles sont les dernières actualités fiscales au Bénin ?", color: "text-sky-600"},
    { icon: DollarSign, text: "Explique-moi le fonctionnement de l'IS au Bénin", color: "text-orange-600"},
  ];

  const DGI_FICHE = [
    { title: "TVA Bénin", value: "18%", sub: "Déclaration avant le 10/mois", icon: "💰" },
    { title: "IS",        value: "30%", sub: "du bénéfice net imposable",     icon: "🏢" },
    { title: "e-MECeF",   value: "Obligatoire", sub: "Référence sur chaque facture", icon: "🏛️" },
    { title: "Décl. TVA", value: "Mensuelle", sub: "Avant le 10 du mois",   icon: "📅" },
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg flex-shrink-0">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight">AFIWA</h1>
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-xs shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse inline-block" />
              Agent IA · DGI Expert
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            Assistante financière & conformité fiscale béninoise — recherche web, calculs, DGI
          </p>
        </div>
        {recentTools.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
            {recentTools.slice(0, 2).map(tool => {
              const meta = TOOL_META[tool]; if (!meta) return null;
              const Icon = meta.icon;
              return (
                <span key={tool} className={`flex items-center gap-1 text-xs font-medium ${meta.color} bg-muted rounded-full px-2 py-0.5`}>
                  <Icon className="h-3 w-3" />{meta.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b">
        {([
          { key: "chat",     label: "💬 Chat AFIWA" },
          { key: "dgi",      label: "🏛️ DGI & Fiscalité" },
          { key: "rapports", label: "📊 Rapports rapides" },
        ] as const).map(tab_item => (
          <button key={tab_item.key} onClick={() => setTab(tab_item.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === tab_item.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab_item.label}
          </button>
        ))}
      </div>

      {/* ── CHAT TAB ────────────────────────────────────────────────────── */}
      {tab === "chat" && (
        <Card className="border-border/60">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm">AFIWA — Assistante financière & DGI</CardTitle>
                  <p className="text-xs text-muted-foreground">Posez vos questions, elle recherche et calcule en temps réel</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {thinking ? <><Loader2 className="h-3 w-3 animate-spin" /><span>AFIWA analyse…</span></> : <><Zap className="h-3 w-3 text-green-500" /><span>Prête</span></>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages */}
            <div className="h-[400px] overflow-y-auto p-5 space-y-4">
              {messages.length === 1 && (
                <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                    {formatMarkdown(messages[0]!.text)}
                  </div>
                </div>
              )}
              {messages.length > 1 && messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.error ? "bg-destructive" : "bg-gradient-to-br from-emerald-500 to-teal-700"}`}>
                      {msg.error ? <AlertCircle className="h-3.5 w-3.5 text-white" /> : <Bot className="h-3.5 w-3.5 text-white" />}
                    </div>
                  )}
                  <div className="max-w-[78%] space-y-1">
                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : msg.error
                        ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm"
                        : "bg-muted text-foreground rounded-tl-sm"
                    }`}>
                      {msg.role === "assistant" && !msg.error
                        ? <div className="space-y-0.5">{formatMarkdown(msg.text)}</div>
                        : msg.text}
                    </div>
                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1 px-1">
                        {msg.toolsUsed.map(tool => {
                          const meta = TOOL_META[tool]; if (!meta) return null;
                          const Icon = meta.icon;
                          return (
                            <span key={tool} className={`flex items-center gap-1 text-xs ${meta.color} bg-muted rounded-full px-2 py-0.5 border`}>
                              <Icon className="h-2.5 w-2.5" />{meta.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground px-1">
                      {msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex gap-3">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </div>
                    <span className="text-xs text-muted-foreground">AFIWA analyse votre demande…</span>
                  </div>
                </div>
              )}
              {/* Quick prompts */}
              {messages.length === 1 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {QUICK_PROMPTS.map(({ icon: Icon, text, color }) => (
                    <button key={text} onClick={() => void sendMessage(text)}
                      className="flex items-center gap-2 text-left px-3 py-2.5 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-medium text-foreground group">
                      <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
                      <span className="line-clamp-2">{text}</span>
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-background/50 space-y-2">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(input); } }}
                  placeholder="Posez votre question à AFIWA… (peut chercher sur internet, calculer, analyser)"
                  className="flex-1 min-h-[44px] max-h-[120px] resize-none"
                  disabled={thinking}
                  rows={1}
                />
                <div className="flex flex-col gap-1">
                  <Button size="sm" onClick={() => void sendMessage(input)} disabled={!input.trim() || thinking} className="flex-1">
                    {thinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </Button>
                  <button onClick={isRecording ? stopVoice : startVoice}
                    className={`h-8 w-8 rounded-md flex items-center justify-center transition-all border ${isRecording ? "bg-red-500 text-white animate-pulse border-red-500" : "bg-muted text-muted-foreground hover:text-primary hover:border-primary border-border"}`}>
                    {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  AFIWA peut rechercher sur internet · calculer TVA/IS · analyser vos données DGI
                </p>
                {messages.length > 2 && (
                  <button onClick={() => { setMessages([messages[0]!]); setRecentTools([]); }}
                    className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" /> Nouvelle conversation
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── DGI TAB ─────────────────────────────────────────────────────── */}
      {tab === "dgi" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DGI_FICHE.map(item => (
              <Card key={item.title} className="border-border/60">
                <CardContent className="pt-4 pb-4">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-black text-lg text-foreground">{item.value}</div>
                  <div className="font-semibold text-sm text-primary">{item.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Shield,     title: "Qu'est-ce que l'e-MECeF ?",         prompt: "Explique-moi en détail ce qu'est le système e-MECeF de la DGI béninoise et comment il affecte mon entreprise" },
              { icon: Calculator, title: "Calculer ma TVA du mois",            prompt: "Calcule ma TVA à payer ce mois-ci basée sur mes dépenses actuelles avec un taux de 18%" },
              { icon: Calendar,   title: "Calendrier fiscal Bénin 2026",       prompt: "Donne-moi le calendrier fiscal complet du Bénin pour 2026 avec toutes les échéances importantes" },
              { icon: FileText,   title: "Dépenses déductibles vs non déductibles", prompt: "Liste-moi les catégories de dépenses déductibles et non déductibles selon la fiscalité béninoise" },
              { icon: Globe,      title: "Actualités DGI Bénin",               prompt: "Recherche les dernières actualités et changements réglementaires de la DGI au Bénin en 2025-2026" },
              { icon: TrendingUp, title: "Optimisation fiscale PME",           prompt: "Quels sont les principaux leviers d'optimisation fiscale légale pour une PME béninoise ?" },
            ].map(item => (
              <button key={item.title}
                onClick={() => { setTab("chat"); setTimeout(() => void sendMessage(item.prompt), 200); }}
                className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group">
                <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="h-5 w-5 text-primary" />
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

      {/* ── RAPPORTS TAB ──────────────────────────────────────────────── */}
      {tab === "rapports" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">AFIWA génère ces rapports automatiquement en analysant vos données</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: BarChart3,  title: "Rapport mensuel complet",       prompt: "Génère un rapport complet de mes finances du mois en cours : dépenses par catégorie, conformité DGI, risques détectés",                      color: "bg-emerald-50 border-emerald-200" },
              { icon: Shield,     title: "Rapport conformité DGI",        prompt: "Analyse ma conformité DGI : combien de dépenses sont soumises, combien sont en attente, lesquelles risquent un redressement fiscal ?",          color: "bg-blue-50 border-blue-200"     },
              { icon: TrendingUp, title: "Tendances 3 mois",              prompt: "Analyse les tendances de mes dépenses sur les 3 derniers mois et donne-moi des recommandations concrètes",                                      color: "bg-purple-50 border-purple-200" },
              { icon: Calculator, title: "Simulation charges fiscales",   prompt: "Simule mes charges fiscales (TVA 18%, IS 30%) basées sur mes dépenses actuelles et donne-moi les montants à provisionner",                    color: "bg-amber-50 border-amber-200"   },
              { icon: AlertCircle,title: "Dépenses à risque",             prompt: "Identifie toutes mes dépenses marquées comme risquées par AFIWA Sentinelle et explique pourquoi elles sont suspectes",                          color: "bg-red-50 border-red-200"       },
              { icon: Globe,      title: "Veille réglementaire",          prompt: "Recherche sur internet les dernières évolutions réglementaires et fiscales au Bénin qui pourraient impacter mon entreprise en 2026",            color: "bg-teal-50 border-teal-200"     },
            ].map(item => (
              <button key={item.title}
                onClick={() => { setTab("chat"); setTimeout(() => void sendMessage(item.prompt), 200); }}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left hover:shadow-md transition-all group ${item.color}`}>
                <div className="h-9 w-9 rounded-lg bg-white/80 flex items-center justify-center shrink-0 shadow-sm">
                  <item.icon className="h-5 w-5 text-foreground/70" />
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
    </div>
  );
}

/**
 * Agent.tsx — MELODIA, l'IA musicale de MelodiaPerTe
 *
 * MELODIA est une guide musicale passionnée qui :
 * - Recommande de la musique selon l'humeur, le contexte
 * - Explique les genres africains (Afrobeats, Coupé-Décalé, Zoblazo...)
 * - Raconte l'histoire des artistes africains
 * - Cherche des infos sur internet (web_search)
 * - Parle en français, anglais, portugais
 * - Propose des playlists thématiques
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Music, Send, Loader2, Sparkles, Globe, RefreshCw,
  Headphones, Mic, MicOff, AlertCircle, Zap,
} from "lucide-react";
import { chatWithMelodia } from "@/lib/api";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  toolsUsed?: string[];
  suggestions?: string[];
  error?: boolean;
};

let msgId = 1;

const TOOL_META: Record<string, { label: string; color: string }> = {
  web_search:   { label: "🌐 Recherche web",  color: "text-blue-400"   },
  calculate:    { label: "🧮 Calcul",         color: "text-amber-400"  },
  get_date:     { label: "📅 Date",           color: "text-green-400"  },
  analyze_data: { label: "📊 Analyse",        color: "text-purple-400" },
};

const QUICK_PROMPTS = [
  { icon: "😊", text: "Je suis heureux, propose-moi de la musique" },
  { icon: "🌍", text: "Explique-moi le genre Coupé-Décalé du Bénin" },
  { icon: "🎤", text: "Qui est Angélique Kidjo et pourquoi est-elle unique ?" },
  { icon: "🌙", text: "Une playlist pour travailler tard le soir" },
  { icon: "💃", text: "Top artistes Afrobeats à écouter en 2025" },
  { icon: "🎷", text: "Explique le Zoblazo et ses origines béninoises" },
];

type SpeechRecognitionType = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: (e: any) => void; onerror: () => void; onend: () => void;
  start: () => void; stop: () => void;
};
declare global { interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; } }

function formatText(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/\*\*(.+?)\*\*/g).map((p, j) =>
      j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{p}</strong> : p
    );
    if (line.startsWith("• ") || line.startsWith("- ")) {
      return <div key={i} className="flex gap-2 my-0.5"><span style={{ color: "var(--purple)" }} className="shrink-0">•</span><span>{parts}</span></div>;
    }
    if (!line.trim()) return <div key={i} className="h-1.5" />;
    return <div key={i}>{parts}</div>;
  });
}

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([{
    id: msgId++, role: "assistant",
    text: `Bonjour ! Je suis **MELODIA** 🎵\n\nVotre guide musicale IA — spécialiste de la musique africaine et mondiale.\n\nJe peux :\n• Vous recommander de la musique selon votre **humeur**\n• Expliquer les genres africains (**Afrobeats, Coupé-Décalé, Zoblazo, Afro-Jazz**...)\n• Raconter l'histoire de vos **artistes préférés**\n• Créer des **playlists thématiques**\n• Rechercher les **dernières sorties musicales** sur internet\n\nQu'est-ce que vous voulez écouter aujourd'hui ?`,
    suggestions: QUICK_PROMPTS.slice(0, 3).map(p => p.text),
  }]);
  const [input,       setInput]       = useState("");
  const [thinking,    setThinking]    = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const recognRef    = useRef<SpeechRecognitionType | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || thinking) return;
    setMessages(prev => [...prev, { id: msgId++, role: "user", text }]);
    setInput("");
    setThinking(true);

    const history = messages.filter(m => !m.error).slice(-10)
      .map(m => ({ role: m.role as "user" | "assistant", content: m.text }));

    try {
      const { reply, toolsUsed = [], suggestions = [] } = await chatWithMelodia(text, history);
      setMessages(prev => [...prev, { id: msgId++, role: "assistant", text: reply, toolsUsed, suggestions }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: msgId++, role: "assistant",
        text: `❌ ${err instanceof Error ? err.message : "Erreur de connexion"}\n\nEssayons sans serveur — **que voulez-vous écouter ?**`,
        error: true,
      }]);
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [thinking, messages]);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR() as SpeechRecognitionType;
    r.lang = "fr-FR"; r.continuous = false; r.interimResults = false;
    r.onresult = (e: any) => { setInput(e.results[0][0].transcript); setIsRecording(false); };
    r.onerror  = () => setIsRecording(false);
    r.onend    = () => setIsRecording(false);
    recognRef.current = r; r.start(); setIsRecording(true);
  };

  return (
    <div className="flex flex-col animate-in" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
             style={{ background: "linear-gradient(135deg, rgba(155,77,255,0.3), rgba(107,33,212,0.2))", border: "1px solid rgba(155,77,255,0.3)" }}>
          🎵
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white">MELODIA</h1>
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(155,77,255,0.15)", border: "1px solid rgba(155,77,255,0.3)", color: "var(--purple)" }}>
              <Zap className="w-3 h-3" /> Guide IA Musical
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Spécialiste musique africaine · Recherche web · Multi-langue
          </p>
        </div>
        {messages.length > 2 && (
          <button onClick={() => setMessages([messages[0]!])}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all"
                  style={{ border: "1px solid rgba(155,77,255,0.2)", color: "var(--muted)" }}>
            <RefreshCw className="w-3 h-3" /> Nouvelle
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                   style={{ background: msg.error ? "rgba(239,68,68,0.2)" : "linear-gradient(135deg, rgba(155,77,255,0.4), rgba(107,33,212,0.3))" }}>
                {msg.error ? "❌" : "🎵"}
              </div>
            )}
            <div className="max-w-[80%] space-y-2">
              <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                   style={{
                     background:   msg.role === "user" ? "linear-gradient(135deg, #9b4dff, #6b21d4)" : msg.error ? "rgba(239,68,68,0.1)" : "rgba(155,77,255,0.1)",
                     border:       `1px solid ${msg.role === "user" ? "transparent" : msg.error ? "rgba(239,68,68,0.3)" : "rgba(155,77,255,0.15)"}`,
                     color:        msg.error ? "#f87171" : "var(--text)",
                     borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                   }}>
                {msg.role === "assistant" && !msg.error
                  ? <div className="space-y-0.5">{formatText(msg.text)}</div>
                  : msg.text}
              </div>
              {/* Outils utilisés */}
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-1">
                  {msg.toolsUsed.map(tool => {
                    const m = TOOL_META[tool];
                    return m ? (
                      <span key={tool} className={`text-xs ${m.color} rounded-full px-2 py-0.5`}
                            style={{ background: "rgba(155,77,255,0.1)", border: "1px solid rgba(155,77,255,0.2)" }}>
                        {m.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              {/* Suggestions de l'IA */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-col gap-1.5 px-1">
                  {msg.suggestions.map((s, i) => (
                    <button key={i} onClick={() => void sendMessage(s)}
                            className="text-left text-xs px-3 py-2 rounded-xl transition-all hover:scale-[1.01]"
                            style={{ background: "rgba(155,77,255,0.08)", border: "1px solid rgba(155,77,255,0.2)", color: "var(--purple)" }}>
                      💬 {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                 style={{ background: "linear-gradient(135deg, rgba(155,77,255,0.4), rgba(107,33,212,0.3))" }}>
              🎵
            </div>
            <div className="rounded-2xl px-4 py-3 flex items-center gap-2"
                 style={{ background: "rgba(155,77,255,0.1)", border: "1px solid rgba(155,77,255,0.15)" }}>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: "var(--purple)", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-xs" style={{ color: "var(--muted)" }}>MELODIA compose une réponse…</span>
            </div>
          </div>
        )}

        {/* Quick prompts (seulement au début) */}
        {messages.length === 1 && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {QUICK_PROMPTS.map(({ icon, text }) => (
              <button key={text} onClick={() => void sendMessage(text)}
                      className="flex items-start gap-2 text-left px-3 py-3 rounded-xl text-xs transition-all hover:scale-[1.02]"
                      style={{ background: "rgba(155,77,255,0.08)", border: "1px solid rgba(155,77,255,0.15)" }}>
                <span className="text-base flex-shrink-0">{icon}</span>
                <span style={{ color: "var(--text)" }}>{text}</span>
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 mt-4 space-y-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") void sendMessage(input); }}
            placeholder="Demandez à MELODIA… (cherche sur internet, connaît la musique africaine)"
            className="flex-1 px-4 py-3 rounded-2xl text-sm text-white outline-none"
            style={{ background: "rgba(155,77,255,0.08)", border: "1px solid rgba(155,77,255,0.2)" }}
            disabled={thinking}
          />
          <button onClick={isRecording ? () => { recognRef.current?.stop(); setIsRecording(false); } : startVoice}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${isRecording ? "animate-pulse" : ""}`}
                  style={{ background: isRecording ? "rgba(239,68,68,0.2)" : "rgba(155,77,255,0.1)", border: `1px solid ${isRecording ? "rgba(239,68,68,0.4)" : "rgba(155,77,255,0.2)"}` }}>
            {isRecording ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" style={{ color: "var(--muted)" }} />}
          </button>
          <button onClick={() => void sendMessage(input)}
                  disabled={!input.trim() || thinking}
                  className="px-4 py-2 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #9b4dff, #6b21d4)", boxShadow: "0 4px 15px rgba(155,77,255,0.3)" }}>
            {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-center text-xs" style={{ color: "rgba(155,77,255,0.4)" }}>
          MELODIA peut rechercher sur internet · connaît la musique africaine · répond en FR / EN / PT
        </p>
      </div>
    </div>
  );
}

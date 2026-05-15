import { useState, useRef, useEffect } from "react";
import { Bot, Send, FileText, Activity, Settings, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n";

type Tab = "chat" | "reports" | "activity" | "settings";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

const MOCK_ANSWERS: Record<string, string> = {
  default: "Je suis HOUÉFA, votre assistante IA. Pour l'instant, je fonctionne en mode démo. Bientôt je serai connectée à vos vraies données.",
};

let msgId = 1;

export default function AiAgent() {
  const { t } = useTranslation();
  const h = t.houefa;
  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<Message[]>([
    { id: msgId++, role: "assistant", text: h.welcome },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { id: msgId++, role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const reply = MOCK_ANSWERS.default;
      setMessages(prev => [...prev, { id: msgId++, role: "assistant", text: reply }]);
      setThinking(false);
    }, 1200);
  };

  const CHIPS = [h.chip1, h.chip2, h.chip3, h.chip4];

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: "chat", label: h.tabChat, icon: Bot },
    { key: "reports", label: h.tabReports, icon: FileText },
    { key: "activity", label: h.tabActivity, icon: Activity },
    { key: "settings", label: h.tabSettings, icon: Settings },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none">{h.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{h.subtitle}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat tab */}
      {tab === "chat" && (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: "520px" }}>
          {/* Chat sub-header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none">{h.chatHeader}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{h.chatHeaderSub}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 1 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bot className="h-12 w-12 text-primary/30 mb-3" />
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  {messages[0].text}
                </p>
              </div>
            )}
            {messages.length > 1 && messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                }`}>
                  {msg.text}
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

          {/* Suggestion chips — only when no conversation yet */}
          {messages.length === 1 && (
            <div className="px-5 pb-3 grid grid-cols-2 gap-2">
              {CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="flex items-center gap-2 text-left px-3 py-2.5 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-medium text-foreground leading-snug"
                >
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-5 py-4 border-t border-border">
            <form
              onSubmit={e => { e.preventDefault(); sendMessage(input); }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={h.placeholder}
                className="flex-1"
                disabled={thinking}
              />
              <Button type="submit" size="sm" className="gap-1.5 px-4" disabled={!input.trim() || thinking}>
                <Send className="h-3.5 w-3.5" />
                {h.send}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Reports tab */}
      {tab === "reports" && (
        <div className="bg-card border border-card-border rounded-2xl p-16 flex flex-col items-center text-center text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 opacity-20" />
          <p className="font-semibold">{h.reportsEmpty}</p>
        </div>
      )}

      {/* Activity tab */}
      {tab === "activity" && (
        <div className="bg-card border border-card-border rounded-2xl p-16 flex flex-col items-center text-center text-muted-foreground">
          <Activity className="h-12 w-12 mb-4 opacity-20" />
          <p className="font-semibold">{h.activityEmpty}</p>
        </div>
      )}

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="bg-card border border-card-border rounded-2xl p-8 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-2">{h.title}</p>
          <p>{h.settingsDesc}</p>
        </div>
      )}
    </div>
  );
}

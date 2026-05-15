import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateExpense, useParseExpenseText, useGetAccounts, getGetExpensesQueryKey, getGetDashboardSummaryQueryKey, getGetAccountsQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { formatFCFA } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Sparkles, ArrowLeft, Check, Loader2, AlertCircle, Camera } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";


type SpeechRecognitionType = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
  onerror: () => void; onend: () => void; start: () => void; stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionType;
    webkitSpeechRecognition: new () => SpeechRecognitionType;
  }
}

export default function ExpenseNew() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [aiText, setAiText] = useState("");
  const [parsedExpense, setParsedExpense] = useState<{ description: string; amount: number; category: string; confidence: number } | null>(null);
  const [aiConfirmed, setAiConfirmed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isParsingImage, setIsParsingImage] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const parseText = useParseExpenseText();
  const createExpense = useCreateExpense();
  const { data: accounts } = useGetAccounts({ query: { queryKey: getGetAccountsQueryKey() } } as any);
  const { t } = useI18n();
  const token = getToken();
  const { data: categories = [] } = useQuery<{ id: number; name: string; color: string }[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Voix non supportée", description: "Votre navigateur ne supporte pas la reconnaissance vocale.", variant: "destructive" });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      setAiText(event.results[0][0].transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => { setIsRecording(false); toast({ title: "Erreur micro", variant: "destructive" }); };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setIsRecording(false); };

  const handleAiParse = () => {
    if (!aiText.trim()) return;
    parseText.mutate({ data: { text: aiText } }, {
      onSuccess: (result) => { setParsedExpense(result); setAiConfirmed(false); },
      onError: () => toast({ title: t.expenseNew.aiError, variant: "destructive" }),
    });
  };

  const handleAiConfirm = () => {
    if (!parsedExpense) return;
    setDescription(parsedExpense.description);
    setAmount(String(parsedExpense.amount));
    setCategory(parsedExpense.category);
    setAiConfirmed(true);
    setParsedExpense(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsingImage(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const token = getToken();
      const res = await fetch("/api/ai/parse-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      if (!res.ok) throw new Error("Parse failed");
      const result = await res.json() as { description: string; amount: number; category: string; confidence: number };
      setParsedExpense(result);
      setAiConfirmed(false);
    } catch {
      toast({ title: t.expenseNew.aiError, description: "Impossible d'analyser l'image.", variant: "destructive" });
    } finally {
      setIsParsingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) {
      toast({ title: "Remplissez tous les champs obligatoires", variant: "destructive" });
      return;
    }
    const parsedAmount = parseFloat(amount);
    const selectedAccount = accountId ? accounts?.find(a => a.id === parseInt(accountId, 10)) : null;

    createExpense.mutate({
      data: {
        description,
        amount: parsedAmount,
        category,
        ...(accountId ? { accountId: parseInt(accountId, 10) } : {}),
        ...(notes ? { notes } : {}),
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
        toast({ title: "Dépense ajoutée avec succès" });

        if (selectedAccount) {
          const newBalance = selectedAccount.balance - parsedAmount;
          if (newBalance <= 0) {
            setTimeout(() => {
              toast({
                title: t.balanceWarning.title,
                description: `« ${selectedAccount.name} » ${t.balanceWarning.desc} ${t.balanceWarning.critical}`,
                variant: "destructive",
              });
            }, 600);
          }
        }
        setLocation("/expenses");
      },
      onError: () => toast({ title: t.expenseNew.error, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/expenses")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.expenseNew.title}</h1>
          <p className="text-muted-foreground text-sm">{t.expenseNew.afiwaTip}</p>
        </div>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* AFIWA AI Card */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#0f1a2e] via-[#1e3a5f] to-[#0d3b6e] p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-[#0f1a2e]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-base">AFIWA</h3>
                <Badge className="bg-yellow-400 text-[#0f1a2e] text-[10px] font-bold px-1.5 py-0 h-4">IA</Badge>
              </div>
              <p className="text-white/60 text-xs">Votre assistante intelligente</p>
            </div>
          </div>
          <p className="text-white/80 text-sm mt-3">
            Dites ou tapez votre dépense, ou scannez un reçu avec l'appareil photo.
            <br />
            <span className="text-yellow-300 text-xs">Ex : "Carburant moto 5000 FCFA" ou "Riz et tomates 7 500"</span>
          </p>
        </div>

        <CardContent className="pt-4 pb-5 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder='Tapez ou dictez votre dépense...'
                value={aiText}
                onChange={e => setAiText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAiParse()}
                className={`pr-10 transition-all ${isRecording ? "border-red-400 ring-2 ring-red-200" : ""}`}
                data-testid="input-ai-text"
              />
              <button
                type="button"
                onClick={isRecording ? stopVoice : startVoice}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isRecording ? "bg-red-500 text-white animate-pulse" : "bg-muted hover:bg-primary hover:text-white text-muted-foreground"
                }`}
                title={isRecording ? "Arrêter" : t.expenseNew.afiwaMicTip}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              className="px-3"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingImage}
              title="Scanner un reçu (photo)"
              data-testid="button-scan-receipt"
            >
              {isParsingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleAiParse}
              disabled={parseText.isPending || !aiText.trim()}
              className="bg-[#0f1a2e] hover:bg-[#1e3a5f] text-white"
              data-testid="button-ai-parse"
            >
              {parseText.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.expenseNew.analyze}
            </Button>
          </div>

          {isRecording && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              AFIWA vous écoute... Parlez maintenant
            </div>
          )}

          {isParsingImage && (
            <div className="flex items-center gap-2 text-blue-500 text-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              AFIWA analyse votre reçu...
            </div>
          )}

          {parsedExpense && !aiConfirmed && (
            <Alert className="border-yellow-300 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-sm text-yellow-800">AFIWA a compris ceci — est-ce correct ?</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-yellow-600 text-xs">Description</span>
                      <p className="font-medium" data-testid="text-ai-description">{parsedExpense.description}</p>
                    </div>
                    <div>
                      <span className="text-yellow-600 text-xs">Montant</span>
                      <p className="font-bold text-[#0f1a2e]" data-testid="text-ai-amount">{formatFCFA(parsedExpense.amount)}</p>
                    </div>
                    <div>
                      <span className="text-yellow-600 text-xs">Catégorie</span>
                      <p className="font-medium" data-testid="text-ai-category">{parsedExpense.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={handleAiConfirm} className="gap-1 bg-[#0f1a2e] hover:bg-[#1e3a5f]" data-testid="button-ai-confirm">
                      <Check className="w-3 h-3" /> Oui, confirmer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setParsedExpense(null)} data-testid="button-ai-reject">
                      Non, modifier
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {aiConfirmed && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 text-sm">
                AFIWA a rempli le formulaire. Vérifiez et enregistrez.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Manual Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formulaire de saisie</CardTitle>
          <CardDescription>Complétez ou modifiez les informations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description" placeholder="Ex: Achat sac de riz 50kg"
                value={description} onChange={e => setDescription(e.target.value)}
                required data-testid="input-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (FCFA) *</Label>
                <Input
                  id="amount" type="number" placeholder="Ex: 25000"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  required min="1" data-testid="input-amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger data-testid="select-category"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.name}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Compte à débiter</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger data-testid="select-account">
                  <SelectValue placeholder="Sélectionner un compte (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name} — {formatFCFA(a.balance)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes" placeholder="Notes optionnelles..."
                value={notes} onChange={e => setNotes(e.target.value)}
                rows={2} data-testid="input-notes"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createExpense.isPending} className="flex-1" data-testid="button-submit-expense">
                {createExpense.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t.expenseNew.submit}
              </Button>
              <Button type="button" variant="outline" onClick={() => setLocation("/expenses")} data-testid="button-cancel">
                {t.common.cancel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

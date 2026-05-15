import { useState } from "react";
import { useGetMomoTransactions, useSimulateMomoTransaction, getGetMomoTransactionsQueryKey } from "@workspace/api-client-react";
import { formatFCFA } from "@/lib/format";
import { usePush } from "@/hooks/use-push";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, Smartphone, ArrowDownLeft, ArrowUpRight, RefreshCw, Zap } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useI18n } from "@/lib/i18n";

const PROVIDERS = [
  { value: "mtn_momo", label: "MTN MoMo", color: "bg-yellow-400 text-yellow-900" },
  { value: "moov_money", label: "Moov Money", color: "bg-blue-500 text-white" },
  { value: "orange_money", label: "Orange Money", color: "bg-orange-500 text-white" },
];

function ProviderBadge({ provider }: { provider: string }) {
  const p = PROVIDERS.find(p => p.value === provider);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${p?.color ?? "bg-muted"}`}>
      {p?.label ?? provider}
    </span>
  );
}

export default function MomoPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { data: transactions, isLoading, refetch } = useGetMomoTransactions({
    query: { queryKey: getGetMomoTransactionsQueryKey() }
  });
  const simulate = useSimulateMomoTransaction();
  const { state: pushState, subscribe, unsubscribe } = usePush();

  const [form, setForm] = useState({
    provider: "mtn_momo",
    phone: "229 97000000",
    amount: "",
    type: "debit" as "debit" | "credit",
    description: "",
  });

  const handleSimulate = () => {
    if (!form.amount || !form.description) {
      toast({ title: t.common.error, description: `${t.momo.amount} ${t.common.and} ${t.momo.description}`, variant: "destructive" });
      return;
    }
    simulate.mutate(
      {
        data: {
          provider: form.provider as "mtn_momo" | "moov_money" | "orange_money",
          phone: form.phone,
          amount: parseFloat(form.amount),
          type: form.type,
          description: form.description,
        },
      },
      {
        onSuccess: (result) => {
          toast({
            title: `✅ ${t.momo.simSuccess} — ${result.providerLabel}`,
            description: `${t.momo.simSuccessDesc} · Réf: ${result.reference}`,
          });
          queryClient.invalidateQueries({ queryKey: getGetMomoTransactionsQueryKey() });
          setForm(f => ({ ...f, amount: "", description: "" }));
          refetch();
        },
        onError: () => toast({ title: t.momo.simError, variant: "destructive" }),
      }
    );
  };

  const debits = transactions?.filter(t => t.type === "debit") ?? [];
  const credits = transactions?.filter(t => t.type === "credit") ?? [];
  const totalDebit = debits.reduce((s, t) => s + t.amount, 0);
  const totalCredit = credits.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Smartphone className="w-7 h-7 text-yellow-500" />
            {t.momo.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t.momo.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            {t.common.refresh}
          </Button>
          {pushState === "unsupported" ? null : pushState === "granted" ? (
            <Button variant="outline" size="sm" onClick={unsubscribe} className="gap-1.5 text-green-600 border-green-300">
              <Bell className="w-4 h-4" />
              {t.momo.pushActive}
            </Button>
          ) : (
            <Button size="sm" onClick={subscribe}
              disabled={pushState === "loading" || pushState === "denied"}
              className="gap-1.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold">
              <Bell className="w-4 h-4" />
              {pushState === "denied" ? t.momo.pushBlocked : t.momo.enablePush}
            </Button>
          )}
        </div>
      </div>

      {pushState === "denied" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <BellOff className="w-4 h-4 shrink-0" />
          {t.momo.pushBlockedDesc}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-red-50 to-red-100/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownLeft className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t.momo.debits}</span>
            </div>
            <p className="text-xl font-bold text-red-600">{formatFCFA(totalDebit)}</p>
            <p className="text-xs text-muted-foreground">{debits.length} {t.momo.debitsReceived}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t.momo.credits}</span>
            </div>
            <p className="text-xl font-bold text-green-600">{formatFCFA(totalCredit)}</p>
            <p className="text-xs text-muted-foreground">{credits.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t.momo.autoExpenses}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{debits.filter(t => t.expenseId).length}</p>
            <p className="text-xs text-muted-foreground">{t.momo.onDebit} {debits.length} {t.momo.debitsReceived}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              {t.momo.simulate}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{t.momo.simulateDesc}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">{t.momo.operator}</Label>
              <Select value={form.provider} onValueChange={v => setForm(f => ({ ...f, provider: v }))}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t.momo.phone}</Label>
              <Input className="mt-1 h-9" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">{t.momo.type}</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as "debit" | "credit" }))}>
                <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">{t.momo.typeDebit}</SelectItem>
                  <SelectItem value="credit">{t.momo.typeCredit}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t.momo.amount}</Label>
              <Input className="mt-1 h-9" type="number" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="5000" />
            </div>
            <div>
              <Label className="text-xs">{t.momo.description}</Label>
              <Input className="mt-1 h-9" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={t.momo.descPlaceholder} />
            </div>
            <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold gap-2"
              onClick={handleSimulate} disabled={simulate.isPending}>
              <Smartphone className="w-4 h-4" />
              {simulate.isPending ? t.momo.simulating : t.momo.simulateBtn}
            </Button>
            {pushState !== "granted" && (
              <p className="text-[11px] text-muted-foreground text-center">{t.momo.pushHint}</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              {t.momo.transactionFeed}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : !transactions?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Smartphone className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">{t.momo.noTransactions}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.momo.noTransactionsDesc}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === "debit" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                    }`}>
                      {tx.type === "debit" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ProviderBadge provider={tx.provider} />
                        {tx.expenseId && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-green-600 border-green-300">
                            ✓ {t.momo.expense} #{tx.expenseId}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate mt-0.5">{tx.description}</p>
                      <p className="text-[11px] text-muted-foreground">{tx.phone} · {tx.reference}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${tx.type === "debit" ? "text-red-600" : "text-green-600"}`}>
                        {tx.type === "debit" ? "−" : "+"}{formatFCFA(tx.amount)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(tx.createdAt), "d MMM HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

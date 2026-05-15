import { useState } from "react";
import { useGetAccounts, useCreateAccount, getGetAccountsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { CEDEAO_CURRENCIES } from "@/lib/currencies";
import { useQueryClient } from "@tanstack/react-query";
import { formatAmount } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Wallet, Building2, Smartphone, Banknote, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const ACCOUNT_TYPE_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="w-6 h-6" />,
  bank: <Building2 className="w-6 h-6" />,
  mobile_money: <Smartphone className="w-6 h-6" />,
};

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  cash: "bg-green-100 text-green-700",
  bank: "bg-blue-100 text-blue-700",
  mobile_money: "bg-yellow-100 text-yellow-700",
};

export default function Accounts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("XOF");

  const { data: accounts, isLoading } = useGetAccounts({ query: { queryKey: getGetAccountsQueryKey() } } as any);
  const createAccount = useCreateAccount();
  const totalBalance = accounts?.reduce((sum, a) => sum + a.balance, 0) ?? 0;
  const defaultCurrency = accounts?.[0]?.currency ?? "XOF";

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createAccount.mutate({
      data: { name, type: type as "cash" | "bank" | "mobile_money", balance: parseFloat(balance), currency }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: `"${name}" ${t.accounts.createdSuccess}` });
        setAddOpen(false);
        setName(""); setType(""); setBalance(""); setCurrency("XOF");
      },
      onError: () => toast({ title: t.accounts.createError, variant: "destructive" })
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.accounts.title}</h1>
          <p className="text-muted-foreground mt-1">{t.accounts.totalBalance} <span className="font-bold text-foreground">{formatAmount(totalBalance, defaultCurrency)}</span></p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-account">
              <Plus className="w-4 h-4" />
              {t.accounts.addNew}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.accounts.createAccount}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>{t.accounts.accountName}</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder={t.accounts.accountNamePlaceholder} required data-testid="input-account-name" />
              </div>
              <div className="space-y-2">
                <Label>{t.accounts.accountType}</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger data-testid="select-account-type">
                    <SelectValue placeholder={t.accounts.typePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t.accounts.types.cashLong}</SelectItem>
                    <SelectItem value="bank">{t.accounts.types.bank}</SelectItem>
                    <SelectItem value="mobile_money">{t.accounts.types.mobile_money}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.accounts.initialBalance}</Label>
                <Input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder={t.accounts.balancePlaceholder} required min="0" data-testid="input-account-balance" />
              </div>
              <div className="space-y-2">
                <Label>Devise</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CEDEAO_CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="font-mono font-medium mr-2">{c.code}</span>
                        <span className="text-muted-foreground text-xs">{c.symbol}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={createAccount.isPending || !type} className="w-full" data-testid="button-submit-account">
                {createAccount.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t.accounts.creating}</> : t.accounts.createBtn}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance warning banner */}
      {accounts && accounts.some(a => a.balance <= 0) && (
        <Alert variant="destructive" className="border-red-300 bg-red-50 text-red-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            {t.balanceWarning.banner}
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-primary text-primary-foreground overflow-hidden relative">
        <div className="absolute right-4 top-4 opacity-10">
          <Wallet className="w-32 h-32" />
        </div>
        <CardHeader>
          <CardTitle className="text-primary-foreground/80 text-sm font-medium">{t.accounts.consolidatedBalance}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tracking-tight" data-testid="text-total-balance">{formatAmount(totalBalance, defaultCurrency)}</p>
          <p className="text-primary-foreground/70 text-sm mt-1">{accounts?.length ?? 0} {t.accounts.active}</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : !accounts || accounts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground font-medium">{t.accounts.noAccounts}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map(account => {
            const pct = totalBalance > 0 ? (account.balance / totalBalance) * 100 : 0;
            return (
              <Card
                key={account.id}
                className={`hover:shadow-md transition-shadow ${account.balance <= 0 ? "border-red-300 bg-red-50/40" : ""}`}
                data-testid={`card-account-${account.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${account.balance <= 0 ? "bg-red-100 text-red-600" : ACCOUNT_TYPE_COLORS[account.type]}`}>
                      {account.balance <= 0 ? <AlertTriangle className="w-5 h-5" /> : ACCOUNT_TYPE_ICONS[account.type]}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {t.accounts.types[account.type as keyof typeof t.accounts.types] ?? account.type}
                    </span>
                  </div>
                  <CardTitle className="text-base mt-2" data-testid={`text-account-name-${account.id}`}>{account.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${account.balance <= 0 ? "text-red-600" : ""}`} data-testid={`text-account-balance-${account.id}`}>{formatAmount(account.balance, account.currency ?? "XOF")}</p>
                  {account.balance <= 0 && (
                    <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {t.balanceWarning.critical}
                    </p>
                  )}
                  <CardDescription className="mt-1 text-xs">{pct.toFixed(1)}{t.accounts.ofTotal}</CardDescription>
                  <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

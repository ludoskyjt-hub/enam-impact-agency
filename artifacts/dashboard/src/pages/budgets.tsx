import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, Plus, Trash2, AlertTriangle, CheckCircle2, TrendingUp, Loader2 } from "lucide-react";
import { formatFCFA } from "@/lib/format";

interface Budget {
  id: number;
  category: string;
  amount: number;
  period: "monthly" | "yearly";
  year: number;
  month: number | null;
  spent: number;
  remaining: number;
  percentage: number;
  overBudget: boolean;
  isCurrent: boolean;
}

const CATEGORIES = [
  "Alimentation", "Transport", "Carburant", "Bureau", "Communication",
  "Santé", "Logement", "Eau", "Électricité", "Salaire", "Matériel",
  "Marketing", "Formation", "Divers",
];

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const apiCall = async (path: string, options: RequestInit = {}) => {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erreur" }));
    throw new Error((err as { error?: string }).error ?? "Erreur");
  }
  return res.status === 204 ? null : res.json();
};

function BudgetCard({ budget, onDelete, isDeleting }: { budget: Budget; onDelete: (id: number) => void; isDeleting: boolean }) {
  const progressColor = budget.percentage >= 100
    ? "bg-red-500"
    : budget.percentage >= 80
      ? "bg-amber-500"
      : "bg-primary";

  const statusIcon = budget.overBudget
    ? <AlertTriangle className="w-4 h-4 text-red-500" />
    : budget.percentage >= 80
      ? <TrendingUp className="w-4 h-4 text-amber-500" />
      : <CheckCircle2 className="w-4 h-4 text-green-500" />;

  const periodLabel = budget.period === "monthly"
    ? `${MONTH_NAMES[(budget.month ?? 1) - 1]} ${budget.year}`
    : `Annuel ${budget.year}`;

  return (
    <Card className={`relative overflow-hidden transition-all ${budget.overBudget ? "border-red-200 bg-red-50/30" : budget.isCurrent ? "border-primary/20" : ""}`}>
      {budget.isCurrent && (
        <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-bl">
          En cours
        </div>
      )}
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-sm">{budget.category}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{periodLabel}</p>
          </div>
          <div className="flex items-center gap-1">
            {statusIcon}
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(budget.id)}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatFCFA(budget.spent)} dépensé</span>
            <span>{formatFCFA(budget.amount)} budget</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
              style={{ width: `${Math.min(100, budget.percentage)}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-xs font-semibold ${budget.overBudget ? "text-red-600" : "text-muted-foreground"}`}>
              {budget.overBudget
                ? `Dépassement de ${formatFCFA(budget.spent - budget.amount)}`
                : `Restant: ${formatFCFA(budget.remaining)}`}
            </span>
            <span className={`text-xs font-bold ${
              budget.percentage >= 100 ? "text-red-600"
                : budget.percentage >= 80 ? "text-amber-600"
                  : "text-primary"
            }`}>
              {budget.percentage}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BudgetsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const now = new Date();

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));

  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: () => apiCall("/budgets"),
  });

  const createMutation = useMutation({
    mutationFn: () => apiCall("/budgets", {
      method: "POST",
      body: JSON.stringify({
        category,
        amount: parseFloat(amount),
        period,
        year: parseInt(year, 10),
        ...(period === "monthly" ? { month: parseInt(month, 10) } : {}),
      }),
    }),
    onSuccess: () => {
      toast({ title: t.budgets.createdSuccess });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      setAmount(""); setShowForm(false);
    },
    onError: (e: Error) => toast({ title: t.budgets.createError, description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiCall(`/budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: t.budgets.removedSuccess });
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (e: Error) => toast({ title: t.budgets.removeError, description: e.message, variant: "destructive" }),
  });

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overCount = budgets.filter(b => b.overBudget).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-primary" />
            {t.budgets.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t.budgets.subtitle}</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} className="gap-2">
          <Plus className="w-4 h-4" />{t.budgets.addBudget}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total budgété</p>
            <p className="text-xl font-bold mt-1">{formatFCFA(totalBudgeted)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total dépensé</p>
            <p className="text-xl font-bold mt-1">{formatFCFA(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className={overCount > 0 ? "border-red-200 bg-red-50/30" : ""}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Dépassements</p>
            <p className={`text-xl font-bold mt-1 ${overCount > 0 ? "text-red-600" : "text-green-600"}`}>
              {overCount === 0 ? "Aucun ✓" : `${overCount} budget(s)`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t.budgets.addBudget}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t.budgets.category}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.budgets.amount}</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex: 500000" min="1" />
              </div>
              <div className="space-y-2">
                <Label>{t.budgets.period}</Label>
                <Select value={period} onValueChange={v => setPeriod(v as "monthly" | "yearly")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t.budgets.monthly}</SelectItem>
                    <SelectItem value="yearly">{t.budgets.yearly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.budgets.year}</Label>
                <Input type="number" value={year} onChange={e => setYear(e.target.value)} min="2020" max="2100" />
              </div>
              {period === "monthly" && (
                <div className="space-y-2">
                  <Label>{t.budgets.month}</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTH_NAMES.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => createMutation.mutate()} disabled={!amount || createMutation.isPending}>
                {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{t.budgets.creating}</> : t.budgets.createBtn}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>{t.common.cancel}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> {t.common.loading}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <PiggyBank className="w-12 h-12 mx-auto mb-3 opacity-25" />
            <p className="font-medium">{t.budgets.noBudgets}</p>
            <p className="text-sm mt-1">{t.budgets.noBudgetsDesc}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgets.map(budget => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onDelete={id => deleteMutation.mutate(id)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getToken } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp,
  Users, RefreshCcw, Plus, Trash2, Eye, ChevronRight,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  "Alimentation", "Transport", "Carburant", "Bureau", "Communication",
  "Santé", "Logement", "Eau", "Électricité", "Salaire", "Matériel",
  "Marketing", "Formation", "Divers",
];

type RiskLevel = "low" | "medium" | "high";

type ComplianceStats = {
  flaggedThisMonth: number;
  riskAmountThisMonth: number;
  highRiskThisMonth: number;
  employeesWithFlags: number;
  totalFlaggedAllTime: number;
};

type ComplianceAlert = {
  id: number;
  description: string;
  amount: number;
  category: string;
  status: string;
  riskLevel: RiskLevel;
  flagReason: string | null;
  submittedBy: number | null;
  submittedByName: string | null;
  createdAt: string;
  employeeName: string | null;
};

type FraudRule = {
  id: number;
  companyId: number;
  category: string;
  maxAmount: number;
  isActive: boolean;
  createdAt: string;
};

function RiskBadge({ level, t }: { level: RiskLevel; t: Record<string, string> }) {
  if (level === "high") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
        <AlertTriangle className="w-3 h-3" />
        {t.riskHigh}
      </span>
    );
  }
  if (level === "medium") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/20">
        <TrendingUp className="w-3 h-3" />
        {t.riskMedium}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-500 border border-yellow-500/20">
      <ShieldAlert className="w-3 h-3" />
      {t.riskLow}
    </span>
  );
}

export default function CompliancePage() {
  const { t } = useI18n();
  const s = t.sentinelle;
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const token = getToken();

  const [activeTab, setActiveTab] = useState<"alerts" | "rules">("alerts");
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");
  const [newCategory, setNewCategory] = useState("");
  const [newMaxAmount, setNewMaxAmount] = useState("");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const { data: stats, isLoading: statsLoading } = useQuery<ComplianceStats>({
    queryKey: ["compliance-stats"],
    queryFn: async () => {
      const res = await fetch("/api/compliance/stats", { headers });
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<ComplianceAlert[]>({
    queryKey: ["compliance-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/compliance/alerts", { headers });
      if (!res.ok) throw new Error("Failed to load alerts");
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: rules = [], isLoading: rulesLoading } = useQuery<FraudRule[]>({
    queryKey: ["compliance-rules"],
    queryFn: async () => {
      const res = await fetch("/api/compliance/rules", { headers });
      if (!res.ok) throw new Error("Failed to load rules");
      return res.json();
    },
    staleTime: 30_000,
  });

  const reanalyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/compliance/reanalyze", { method: "POST", headers });
      if (!res.ok) throw new Error("Reanalysis failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance-alerts"] });
      qc.invalidateQueries({ queryKey: ["compliance-stats"] });
      qc.invalidateQueries({ queryKey: ["approval-pending-badge"] });
      toast({ title: s.reanalyzed });
    },
    onError: () => toast({ title: s.reanalyzed, variant: "destructive" }),
  });

  const addRuleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/compliance/rules", {
        method: "POST",
        headers,
        body: JSON.stringify({ category: newCategory, maxAmount: Number(newMaxAmount) }),
      });
      if (!res.ok) throw new Error("Failed to add rule");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance-rules"] });
      setNewCategory("");
      setNewMaxAmount("");
      toast({ title: s.ruleAdded });
    },
    onError: () => toast({ title: s.ruleAdded, variant: "destructive" }),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/compliance/rules/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Failed to delete rule");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compliance-rules"] });
      toast({ title: s.ruleRemoved });
    },
  });

  const filteredAlerts = riskFilter === "all"
    ? alerts
    : alerts.filter(a => a.riskLevel === riskFilter);

  const fmtAmount = (n: number) =>
    new Intl.NumberFormat("fr-BJ", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-BJ", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">{s.title}</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">{s.subtitle}</p>
        </div>
        <Button
          onClick={() => reanalyzeMutation.mutate()}
          disabled={reanalyzeMutation.isPending}
          variant="outline"
          className="gap-2"
        >
          <RefreshCcw className={`w-4 h-4 ${reanalyzeMutation.isPending ? "animate-spin" : ""}`} />
          {reanalyzeMutation.isPending ? s.reanalyzing : s.reanalyze}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.statsAlerts}</p>
                <p className="text-2xl font-bold mt-1">
                  {statsLoading ? "…" : (stats?.flaggedThisMonth ?? 0)}
                </p>
              </div>
              <ShieldAlert className="w-5 h-5 text-red-400 mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.statsRisk}</p>
                <p className="text-lg font-bold mt-1 leading-tight">
                  {statsLoading ? "…" : fmtAmount(stats?.riskAmountThisMonth ?? 0)}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-orange-400 mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.statsEmployees}</p>
                <p className="text-2xl font-bold mt-1">
                  {statsLoading ? "…" : (stats?.employeesWithFlags ?? 0)}
                </p>
              </div>
              <Users className="w-5 h-5 text-yellow-500 mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.statsHigh}</p>
                <p className="text-2xl font-bold mt-1 text-red-400">
                  {statsLoading ? "…" : (stats?.highRiskThisMonth ?? 0)}
                </p>
              </div>
              <AlertTriangle className="w-5 h-5 text-red-400 mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["alerts", "rules"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "alerts" ? s.alertsTab : s.rulesTab}
            {tab === "alerts" && alerts.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {alerts.length > 99 ? "99+" : alerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts Tab */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "high", "medium", "low"] as const).map(f => (
              <button
                key={f}
                onClick={() => setRiskFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  riskFilter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? s.filterAll : f === "high" ? s.filterHigh : f === "medium" ? s.filterMedium : s.filterLow}
              </button>
            ))}
          </div>

          {alertsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                <ShieldCheck className="w-12 h-12 text-green-400" />
                <p className="font-semibold text-lg">{s.noAlerts}</p>
                <p className="text-sm text-muted-foreground text-center max-w-sm">{s.noAlertsDesc}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{s.colRisk}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{s.colExpense}</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">{s.colAmount}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">{s.colCategory}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">{s.colEmployee}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">{s.colDate}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{s.colReason}</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map((alert, idx) => (
                      <tr
                        key={alert.id}
                        className={`border-b last:border-b-0 transition-colors hover:bg-muted/20 ${
                          idx % 2 === 0 ? "" : "bg-muted/5"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <RiskBadge level={alert.riskLevel} t={s as unknown as Record<string, string>} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium truncate max-w-[160px]">{alert.description}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {fmtAmount(alert.amount)}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">{alert.category}</Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                          {alert.employeeName ?? "—"}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                          {fmtDate(alert.createdAt)}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="text-xs text-muted-foreground truncate">{alert.flagReason ?? "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setLocation(`/expenses/${alert.id}`)}
                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title={s.viewDetail}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          {/* Add rule form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {s.addRule}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={s.ruleCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  placeholder={s.ruleMax}
                  className="flex-1"
                  value={newMaxAmount}
                  onChange={e => setNewMaxAmount(e.target.value)}
                />
                <Button
                  onClick={() => addRuleMutation.mutate()}
                  disabled={addRuleMutation.isPending || !newCategory || !newMaxAmount}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {addRuleMutation.isPending ? s.ruleAdding : s.ruleAdd}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rules list */}
          {rulesLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <ShieldCheck className="w-10 h-10 text-muted-foreground" />
                <p className="font-medium">{s.noRules}</p>
                <p className="text-sm text-muted-foreground text-center max-w-sm">{s.noRulesDesc}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="divide-y">
                {rules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs shrink-0">{rule.category}</Badge>
                      <span className="text-sm font-semibold tabular-nums">{fmtAmount(rule.maxAmount)}</span>
                      <span className={`text-xs ${rule.isActive ? "text-green-500" : "text-muted-foreground"}`}>
                        {rule.isActive ? s.ruleActive : s.ruleInactive}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteRuleMutation.mutate(rule.id)}
                      disabled={deleteRuleMutation.isPending}
                      className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

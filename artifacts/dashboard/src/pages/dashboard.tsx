import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatFCFA } from "@/lib/format";
import { getCountry } from "@/lib/countries";
import { getToken } from "@/lib/auth";
import { DgiStatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Receipt, Wallet, Banknote, Mic, ScanLine, BarChart3, ArrowDownRight, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import beninMap from "@/assets/benin-flag-map-nobg.png";
import { useI18n } from "@/lib/i18n";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const country = getCountry(user?.country ?? "BJ");
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const h = new Date().getHours();
  const greeting = h < 12 ? t.greeting.morning : h < 18 ? t.greeting.afternoon : t.greeting.evening;
  const token = getToken();
  const { data: budgets = [] } = useQuery<{ id: number; category: string; amount: number; spent: number; percentage: number; overBudget: boolean; isCurrent: boolean }[]>({
    queryKey: ["budgets-widget"],
    queryFn: async () => {
      const res = await fetch("/api/budgets", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return [];
      const all = await res.json();
      return (all as { id: number; category: string; amount: number; spent: number; percentage: number; overBudget: boolean; isCurrent: boolean }[])
        .filter((b: { isCurrent: boolean }) => b.isCurrent)
        .slice(0, 5);
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── HERO BANNER ── */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#0d6e2e] via-[#16a34a] to-[#15803d] text-white relative">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute top-4 right-24 w-16 h-16 rounded-full bg-yellow-400/20" />

        <div className="relative p-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <img src={beninMap} alt={country.name} className="w-10 h-10 object-contain drop-shadow" />
              <div>
                <p className="text-xs text-white/70 uppercase tracking-widest font-medium">{country.appName}</p>
                <p className="text-xs text-yellow-300 font-semibold">{t.dashboard.slogan}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">{format(new Date(), "EEEE d MMM")}</p>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">👋</span>
                <h1 className="text-2xl font-bold">{greeting} !</h1>
              </div>
              <p className="text-white/80 text-sm max-w-xs">
                {user?.companyName ? <span className="font-semibold text-yellow-300">{user.companyName}</span> : ""}
                {t.dashboard.readyPrompt}
              </p>
            </div>
            <div className="text-6xl select-none mr-2 mb-1 hidden sm:block">🏪</div>
          </div>

          <div className="mt-4 inline-flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
            <Wallet className="w-5 h-5 text-yellow-300" />
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">{t.dashboard.totalBalance}</p>
              {isLoading ? (
                <Skeleton className="h-6 w-32 bg-white/20" />
              ) : (
                <p className="text-xl font-bold tracking-tight" data-testid="dashboard-total-balance">
                  {formatFCFA(summary?.totalBalance ?? 0)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3 ACTION TILES ── */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/expenses/new">
          <div className="group cursor-pointer rounded-2xl bg-[#0d6e2e] hover:bg-[#0a5c25] active:scale-95 transition-all duration-150 p-4 flex flex-col items-center gap-3 min-h-[140px] justify-between shadow-lg shadow-green-900/20">
            <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center border-2 border-white/20">
              <Mic className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              {t.dashboard.quickEntry.split("\n").map((line, i) => (
                <p key={i} className="text-white font-black text-sm uppercase tracking-wider leading-tight">{line}</p>
              ))}
              <p className="text-white/70 text-[10px] mt-1 leading-tight">{t.dashboard.quickEntryDesc}</p>
            </div>
          </div>
        </Link>

        <Link href="/expenses/new">
          <div className="group cursor-pointer rounded-2xl bg-[#d97706] hover:bg-[#b45309] active:scale-95 transition-all duration-150 p-4 flex flex-col items-center gap-3 min-h-[140px] justify-between shadow-lg shadow-amber-900/20">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 relative">
              <ScanLine className="w-7 h-7 text-white" />
              <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-white rounded-tl" />
              <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-white rounded-tr" />
              <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-white rounded-bl" />
              <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-white rounded-br" />
            </div>
            <div className="text-center">
              {t.dashboard.scanReceipt.split("\n").map((line, i) => (
                <p key={i} className="text-white font-black text-sm uppercase tracking-wider leading-tight">{line}</p>
              ))}
              <p className="text-white/80 text-[10px] mt-1 leading-tight">{t.dashboard.scanDesc}</p>
            </div>
          </div>
        </Link>

        <Link href="/reports">
          <div className="group cursor-pointer rounded-2xl bg-[#15803d] hover:bg-[#166534] active:scale-95 transition-all duration-150 p-4 flex flex-col items-center gap-3 min-h-[140px] justify-between shadow-lg shadow-green-900/20">
            <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center border-2 border-white/20">
              <BarChart3 className="w-7 h-7 text-yellow-300" />
            </div>
            <div className="text-center">
              {t.dashboard.dailyReport.split("\n").map((line, i) => (
                <p key={i} className="text-white font-black text-sm uppercase tracking-wider leading-tight">{line}</p>
              ))}
              <p className="text-white/70 text-[10px] mt-1 leading-tight">{t.dashboard.dailyReportDesc}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* ── STAT MINI-CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-0 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600 font-medium">{t.dashboard.todayExpenses}</span>
            </div>
            {isLoading ? <Skeleton className="h-6 w-24" /> : (
              <p className="text-lg font-bold text-red-700" data-testid="dashboard-today-expenses">
                {formatFCFA(summary?.todayExpenses ?? 0)}
              </p>
            )}
            {!isLoading && (
              <p className="text-[11px] text-red-400 mt-0.5">{summary?.todayCount ?? 0} {t.dashboard.transactions}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-amber-600 font-medium">{t.dashboard.pendingDgi}</span>
            </div>
            {isLoading ? <Skeleton className="h-6 w-12" /> : (
              <p className="text-lg font-bold text-amber-700" data-testid="dashboard-pending-dgi">
                {summary?.pendingCount ?? 0}
              </p>
            )}
            <p className="text-[11px] text-amber-400 mt-0.5">{t.dashboard.toNormalize}</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-green-50 col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">{t.dashboard.activeAccounts}</span>
            </div>
            {isLoading ? <Skeleton className="h-6 w-8" /> : (
              <p className="text-lg font-bold text-green-800">{summary?.accounts.length ?? 0}</p>
            )}
            <p className="text-[11px] text-green-500 mt-0.5">{t.dashboard.connectedSources}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── RECENT EXPENSES + ACCOUNTS ── */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">{t.dashboard.recentExpenses}</CardTitle>
              <CardDescription className="text-xs">{t.dashboard.lastTransactions}</CardDescription>
            </div>
            <Link href="/expenses">
              <Button variant="outline" size="sm" className="text-xs">{t.common.seeAll}</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !summary || summary.recentExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t.dashboard.noRecent}</p>
              </div>
            ) : (
              <div className="divide-y">
                {summary.recentExpenses.slice(0, 6).map((expense) => (
                  <Link key={expense.id} href={`/expenses/${expense.id}`}>
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Receipt className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{expense.description}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{expense.category}</span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(expense.createdAt), 'd MMM, HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className="font-bold text-sm whitespace-nowrap">{formatFCFA(expense.amount)}</p>
                        <DgiStatusBadge status={expense.dgiStatus} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">{t.dashboard.myAccounts}</CardTitle>
              <CardDescription className="text-xs">{t.dashboard.balanceByAccount}</CardDescription>
            </div>
            <Link href="/accounts">
              <Button variant="outline" size="sm" className="text-xs">{t.common.manage}</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {summary?.accounts.map((account) => {
                  const total = summary.totalBalance;
                  const pct = total > 0 ? (account.balance / total) * 100 : 0;
                  const icons: Record<string, string> = { cash: "💵", bank: "🏦", mobile_money: "📱" };
                  return (
                    <div key={account.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span>{icons[account.type] ?? "💳"}</span>
                          <span className="text-sm font-medium">{account.name}</span>
                        </div>
                        <span className="font-bold text-sm font-mono">{formatFCFA(account.balance)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Health Widget */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              {t.dashboard.budgetTitle}
            </CardTitle>
          </div>
          <Link href="/budgets">
            <Button variant="outline" size="sm" className="text-xs">{t.dashboard.budgetSeeAll}</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <TrendingUp className="w-7 h-7 mx-auto mb-2 opacity-20" />
              <p className="text-sm font-medium">{t.dashboard.noBudgets}</p>
              <p className="text-xs mt-0.5">{t.dashboard.noBudgetsDesc}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.map(b => (
                <div key={b.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{b.category}</span>
                    <div className="flex items-center gap-2">
                      {b.overBudget && (
                        <span className="text-[10px] font-bold text-destructive">{t.dashboard.overBudget}</span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatFCFA(b.spent)} {t.dashboard.budgetOf} {formatFCFA(b.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${b.overBudget ? "bg-destructive" : b.percentage > 75 ? "bg-amber-500" : "bg-primary"}`}
                      style={{ width: `${b.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

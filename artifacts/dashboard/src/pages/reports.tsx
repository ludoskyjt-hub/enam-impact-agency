import { useState, useMemo } from "react";
import {
  useGetDailyReport,
  useGetCategoryBreakdown,
  useGetMonthlyTrend,
  getGetDailyReportQueryKey,
  getGetCategoryBreakdownQueryKey,
  getGetMonthlyTrendQueryKey,
} from "@workspace/api-client-react";
import { formatFCFA } from "@/lib/format";
import { ExpenseStatusBadge, DgiStatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area, Legend,
} from "recharts";
import { BarChart3, Calendar, Wallet, Receipt, TrendingDown, TrendingUp, FileDown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/auth";

const COLORS = ["#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#be185d", "#15803d"];
const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function formatAmount(val: number) {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
  return String(val);
}

function formatMonthLabel(month: string) {
  const [year, m] = month.split("-");
  return `${MONTH_LABELS[parseInt(m) - 1]} ${year.slice(2)}`;
}

export default function Reports() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const { t } = useI18n();
  const token = getToken();

  const currentMonth = today.slice(0, 7);
  const [pdfMonth, setPdfMonth] = useState(currentMonth);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  async function downloadPdf() {
    if (!token) return;
    setPdfDownloading(true);
    try {
      const res = await fetch(`/api/reports/pdf?month=${pdfMonth}&token=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-${pdfMonth}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfDownloading(false);
    }
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: dailyReport, isLoading: dailyLoading } = useGetDailyReport(
    { date: selectedDate },
    { query: { queryKey: getGetDailyReportQueryKey({ date: selectedDate }) } }
  );

  const { data: categoryStats, isLoading: catLoading } = useGetCategoryBreakdown(
    { from: thirtyDaysAgo.toISOString().split("T")[0], to: today },
    { query: { queryKey: getGetCategoryBreakdownQueryKey({ from: thirtyDaysAgo.toISOString().split("T")[0], to: today }) } }
  );

  const { data: monthlyTrend, isLoading: monthlyLoading } = useGetMonthlyTrend(
    { months: 12 },
    { query: { queryKey: getGetMonthlyTrendQueryKey({ months: 12 }) } }
  );

  const topCategories = useMemo(() => {
    if (!monthlyTrend?.length) return [];
    const totals: Record<string, number> = {};
    monthlyTrend.forEach(m => {
      if (m.byCategory) {
        Object.entries(m.byCategory).forEach(([cat, val]) => {
          totals[cat] = (totals[cat] || 0) + val;
        });
      }
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat]) => cat);
  }, [monthlyTrend]);

  const areaChartData = useMemo(() =>
    (monthlyTrend || []).map(m => ({
      monthLabel: formatMonthLabel(m.month),
      total: m.total,
      count: m.count,
    })),
    [monthlyTrend]
  );

  const stackedChartData = useMemo(() =>
    (monthlyTrend || []).map(m => ({
      monthLabel: formatMonthLabel(m.month),
      ...(m.byCategory || {}),
    })),
    [monthlyTrend]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.reports.title}</h1>
          <p className="text-muted-foreground mt-1">{t.reports.subtitle}</p>
        </div>
        <Card className="flex items-center gap-3 px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">{t.reports.pdfMonth}</label>
            <input
              type="month"
              value={pdfMonth}
              onChange={e => setPdfMonth(e.target.value)}
              className="h-8 rounded-md border border-input px-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button onClick={downloadPdf} disabled={pdfDownloading} className="shrink-0 self-end">
            {pdfDownloading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.reports.downloadingPdf}</>
              : <><FileDown className="w-4 h-4 mr-2" />{t.reports.downloadPdf}</>}
          </Button>
        </Card>
      </div>

      {/* Monthly trend charts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {t.reports.monthlyTrend}
          </CardTitle>
          <CardDescription>{t.reports.monthlySubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : areaChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={areaChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatAmount} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number) => [formatFCFA(val), t.reports.totalMonthly]}
                  labelStyle={{ fontWeight: 600 }}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  fill="url(#colorTotal)"
                  dot={{ fill: "#16a34a", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t.reports.noMonthlyData}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly breakdown by category */}
      {topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t.reports.categoryBreakdown}
            </CardTitle>
            <CardDescription>{t.reports.monthlySubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stackedChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={formatAmount} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number, name: string) => [formatFCFA(val), name]}
                    labelStyle={{ fontWeight: 600 }}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  {topCategories.map((cat, i) => (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      stackId="a"
                      fill={COLORS[i % COLORS.length]}
                      radius={i === topCategories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Daily report date picker */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div className="space-y-1">
              <Label className="text-sm">{t.reports.dailyReport}</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                max={today}
                className="w-44"
                data-testid="input-report-date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {dailyLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : dailyReport ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" /> {t.reports.totalExpenses}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="text-daily-total">{formatFCFA(dailyReport.totalExpenses)}</p>
              <p className="text-xs text-muted-foreground mt-1">{dailyReport.expenseCount} {t.reports.transactions}</p>
            </CardContent>
          </Card>
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> {t.reports.balance}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="text-remaining-balance">{formatFCFA(dailyReport.remainingBalance)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="w-4 h-4 text-muted-foreground" /> {t.reports.transactions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold" data-testid="text-transaction-count">{dailyReport.expenseCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{format(new Date(selectedDate), "d MMMM yyyy")}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* 30-day category chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t.reports.categoryChart}
          </CardTitle>
          <CardDescription>{t.reports.last30days}</CardDescription>
        </CardHeader>
        <CardContent>
          {catLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : categoryStats && categoryStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryStats} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tickFormatter={formatAmount} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number) => [formatFCFA(val), t.reports.amount]}
                  labelStyle={{ fontWeight: 600 }}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {categoryStats.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t.reports.noCategories}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {dailyReport && dailyReport.expenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.reports.transactions}</CardTitle>
            <CardDescription>{format(new Date(selectedDate), "d MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {dailyReport.expenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors" data-testid={`row-report-expense-${expense.id}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">{expense.category}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(expense.createdAt), "HH:mm")}</span>
                      <ExpenseStatusBadge status={expense.status} />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    <span className="font-bold text-sm">{formatFCFA(expense.amount)}</span>
                    <DgiStatusBadge status={expense.dgiStatus} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

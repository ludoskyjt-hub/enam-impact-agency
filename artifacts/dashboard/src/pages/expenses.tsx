import { useState } from "react";
import { Link } from "wouter";
import { useGetExpenses, useDeleteExpense, useValidateExpense, getGetExpensesQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatFCFA } from "@/lib/format";
import { ExpenseStatusBadge, DgiStatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Receipt, Trash2, CheckCircle, XCircle, Filter, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { getToken } from "@/lib/auth";

export default function Expenses() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const { user } = useAuth();
  const canApprove = user?.role === "admin" || user?.role === "accountant";

  const params = {
    ...(statusFilter !== "all" ? { status: statusFilter as "pending" | "validated" | "rejected" | "synced" } : {}),
    ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
  };

  const { data: expenses, isLoading } = useGetExpenses(params, {
    query: { queryKey: getGetExpensesQueryKey(params) }
  });

  const deleteExpense = useDeleteExpense();
  const validateExpense = useValidateExpense();
  const categories = expenses ? [...new Set(expenses.map(e => e.category))].sort() : [];

  const rejectExpense = useMutation({
    mutationFn: async (id: number) => {
      const token = getToken();
      const res = await fetch(`/api/expenses/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Reject failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      toast({ title: t.expenses.rejectSuccess });
    },
    onError: () => toast({ title: t.expenses.rejectSuccess, variant: "destructive" }),
  });

  const handleDelete = (id: number) => {
    deleteExpense.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() });
        toast({ title: t.expenses.deleted });
      },
    });
  };

  const handleValidate = (id: number) => {
    validateExpense.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        toast({ title: t.expenses.validated });
      },
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter !== "all") query.set("status", statusFilter);
      if (categoryFilter !== "all") query.set("category", categoryFilter);

      const token = getToken();
      const res = await fetch(`/api/expenses/export?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `depenses-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t.common.error, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const pendingCount = expenses?.filter(e => e.status === "pending").length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            {t.expenses.title}
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-600 border border-amber-400/30 text-sm font-semibold">
                {pendingCount} {t.expenses.pendingApproval}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {expenses ? `${expenses.length} ${t.expenses.found}` : t.expenses.loading}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm" onClick={handleExport}
            disabled={isExporting || !expenses || expenses.length === 0}
            className="gap-2" title={t.export.tooltip} data-testid="button-export-csv"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {t.export.btn}
          </Button>
          <Link href="/expenses/new">
            <Button className="gap-2" data-testid="button-add-expense">
              <Plus className="w-4 h-4" />{t.expenses.addNew}
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />{t.common.filter}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44" data-testid="select-status-filter">
                <SelectValue placeholder={t.expenses.filterStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.expenses.status.all}</SelectItem>
                <SelectItem value="pending">{t.expenses.status.pending}</SelectItem>
                <SelectItem value="validated">{t.expenses.status.validated}</SelectItem>
                <SelectItem value="rejected">{t.expenses.status.rejected}</SelectItem>
                <SelectItem value="synced">{t.expenses.status.synced}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44" data-testid="select-category-filter">
                <SelectValue placeholder={t.expenses.filterCategory} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.expenses.allCategories}</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {(statusFilter !== "all" || categoryFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); }}>
                ✕ Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expense list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !expenses || expenses.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{t.expenses.noExpenses}</p>
              <p className="text-sm mt-1">{t.expenses.noExpensesDesc}</p>
            </div>
          ) : (
            <div className="divide-y">
              {expenses.map((expense, idx) => (
                <div
                  key={expense.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                  style={{ animationDelay: `${idx * 30}ms` }}
                  data-testid={`row-expense-${expense.id}`}
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/expenses/${expense.id}`}>
                      <p className="font-medium text-sm hover:text-primary cursor-pointer truncate" data-testid={`text-expense-desc-${expense.id}`}>
                        {expense.description}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-xs">{expense.category}</Badge>
                      {expense.employeeName && (
                        <span className="text-xs text-muted-foreground">{expense.employeeName}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(expense.createdAt), "d MMM, HH:mm")}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <ExpenseStatusBadge status={expense.status} />
                    <DgiStatusBadge status={expense.dgiStatus} />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm" data-testid={`text-expense-amount-${expense.id}`}>
                      {formatFCFA(expense.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {expense.status === "pending" && canApprove && (
                      <>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleValidate(expense.id)}
                          title={t.expenses.approve}
                          data-testid={`button-validate-${expense.id}`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                          onClick={() => rejectExpense.mutate(expense.id)}
                          title={t.expenses.reject}
                          data-testid={`button-reject-${expense.id}`}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {canApprove && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(expense.id)}
                        data-testid={`button-delete-${expense.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
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

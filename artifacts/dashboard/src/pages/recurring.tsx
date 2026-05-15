import { useState } from "react";
import {
  useGetRecurring,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
  useGenerateRecurring,
  useGetAccounts,
  useGetDgiSettings,
  getGetRecurringQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { getToken } from "@/lib/auth";
import { formatAmount } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Loader2,
  CalendarClock,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

const FREQUENCY_COLORS: Record<string, string> = {
  daily:   "bg-red-100 text-red-700",
  weekly:  "bg-yellow-100 text-yellow-800",
  monthly: "bg-blue-100 text-blue-700",
  yearly:  "bg-purple-100 text-purple-700",
};

type RecurringForm = {
  description: string;
  amount: string;
  category: string;
  frequency: string;
  nextDueDate: string;
  accountId: string;
  active: boolean;
  notes: string;
};

const EMPTY_FORM: RecurringForm = {
  description: "",
  amount: "",
  category: "",
  frequency: "monthly",
  nextDueDate: new Date().toISOString().slice(0, 10),
  accountId: "",
  active: true,
  notes: "",
};

export default function RecurringPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<RecurringForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: rules = [], isLoading } = useGetRecurring(
    { query: { queryKey: getGetRecurringQueryKey() } } as any
  );
  const { data: accounts = [] } = useGetAccounts(
    { query: { queryKey: ["accounts"] } } as any
  );
  const { data: dgiSettings } = useGetDgiSettings();
  const defaultCurrency = dgiSettings?.defaultCurrency ?? "XOF";
  const token = getToken();
  const { data: cats = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!token,
  });

  const createMut = useCreateRecurring();
  const updateMut = useUpdateRecurring();
  const deleteMut = useDeleteRecurring();
  const generateMut = useGenerateRecurring();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetRecurringQueryKey() });

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (rule: typeof rules[0]) => {
    setEditId(rule.id);
    setForm({
      description: rule.description,
      amount: String(rule.amount),
      category: rule.category,
      frequency: rule.frequency,
      nextDueDate: rule.nextDueDate.slice(0, 10),
      accountId: rule.accountId ? String(rule.accountId) : "",
      active: rule.active,
      notes: rule.notes ?? "",
    });
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      frequency: form.frequency as "daily" | "weekly" | "monthly" | "yearly",
      nextDueDate: new Date(form.nextDueDate).toISOString(),
      accountId: form.accountId ? parseInt(form.accountId) : undefined,
      active: form.active,
      notes: form.notes || undefined,
    };

    if (editId !== null) {
      updateMut.mutate(
        { id: editId, data: payload },
        {
          onSuccess: () => {
            invalidate();
            toast({ title: t.recurring.savedSuccess });
            setFormOpen(false);
          },
          onError: () => toast({ title: t.common.error, variant: "destructive" }),
        }
      );
    } else {
      createMut.mutate(
        { data: payload },
        {
          onSuccess: () => {
            invalidate();
            toast({ title: t.recurring.createdSuccess });
            setFormOpen(false);
          },
          onError: () => toast({ title: t.recurring.createError, variant: "destructive" }),
        }
      );
    }
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    deleteMut.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: t.recurring.deletedSuccess });
          setDeleteId(null);
        },
      }
    );
  };

  const handleGenerate = () => {
    generateMut.mutate(undefined, {
      onSuccess: (data) => {
        invalidate();
        queryClient.invalidateQueries({ queryKey: ["expenses"] });
        if ((data as any).generated > 0) {
          toast({ title: t.recurring.generateSuccess.replace("{n}", String((data as any).generated)) });
        } else {
          toast({ title: t.recurring.generateNone });
        }
      },
    });
  };

  const now = new Date();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.recurring.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.recurring.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={generateMut.isPending}
            className="gap-2"
            data-testid="button-generate-recurring"
          >
            {generateMut.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />}
            {generateMut.isPending ? t.recurring.generating : t.recurring.generateBtn}
          </Button>
          <Button onClick={openCreate} className="gap-2" data-testid="button-add-recurring">
            <Plus className="w-4 h-4" />
            {t.recurring.addNew}
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-muted-foreground">{t.recurring.noRules}</p>
            <p className="text-sm text-muted-foreground mt-1">{t.recurring.noRulesDesc}</p>
            <Button className="mt-6 gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              {t.recurring.addNew}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rules.map(rule => {
            const due = new Date(rule.nextDueDate);
            const overdue = due < now && rule.active;
            const dueToday = due.toDateString() === now.toDateString() && rule.active;
            return (
              <Card
                key={rule.id}
                className={`relative transition-shadow hover:shadow-md ${
                  !rule.active ? "opacity-60" : overdue ? "border-amber-400 bg-amber-50/40" : ""
                }`}
                data-testid={`card-recurring-${rule.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{rule.description}</CardTitle>
                      <p className="text-2xl font-bold text-primary mt-1">{formatAmount(rule.amount, defaultCurrency)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge className={`text-[11px] ${FREQUENCY_COLORS[rule.frequency] ?? ""}`}>
                        {t.recurring.frequency[rule.frequency as keyof typeof t.recurring.frequency] ?? rule.frequency}
                      </Badge>
                      {!rule.active && (
                        <Badge variant="secondary" className="text-[11px] gap-1">
                          <XCircle className="w-3 h-3" />
                          {t.recurring.inactive}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {overdue ? (
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : dueToday ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    ) : (
                      <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className={overdue ? "text-amber-600 font-medium" : dueToday ? "text-green-600 font-medium" : ""}>
                      {t.recurring.nextDue} : {due.toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.expenses.filterCategory} : <span className="font-medium">{rule.category}</span>
                  </p>
                  {rule.lastGeneratedAt && (
                    <p className="text-xs text-muted-foreground">
                      {t.recurring.lastGenerated} : {new Date(rule.lastGeneratedAt).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 flex-1"
                      onClick={() => openEdit(rule)}
                      data-testid={`button-edit-recurring-${rule.id}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {t.common.edit}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(rule.id)}
                      data-testid={`button-delete-recurring-${rule.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId !== null ? t.recurring.editTitle : t.recurring.createTitle}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>{t.recurring.description}</Label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Loyer bureau, Abonnement internet…"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t.recurring.amount}</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="150000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t.recurring.frequencyLabel}</Label>
                <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t.recurring.frequency.daily}</SelectItem>
                    <SelectItem value="weekly">{t.recurring.frequency.weekly}</SelectItem>
                    <SelectItem value="monthly">{t.recurring.frequency.monthly}</SelectItem>
                    <SelectItem value="yearly">{t.recurring.frequency.yearly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t.expenseNew.category}</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Catégorie…" /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c: { id: number; name: string }) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.recurring.nextDueDate}</Label>
                <Input
                  type="date"
                  value={form.nextDueDate}
                  onChange={e => setForm(f => ({ ...f, nextDueDate: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.expenseNew.account}</Label>
              <Select value={form.accountId} onValueChange={v => setForm(f => ({ ...f, accountId: v }))}>
                <SelectTrigger><SelectValue placeholder={t.expenseNew.noAccount} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t.expenseNew.noAccount}</SelectItem>
                  {(accounts as { id: number; name: string }[]).map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t.recurring.notes}</Label>
              <Input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder={t.recurring.notesPlaceholder}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.active}
                onCheckedChange={v => setForm(f => ({ ...f, active: v }))}
                id="active-switch"
              />
              <Label htmlFor="active-switch">{t.recurring.active}</Label>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createMut.isPending || updateMut.isPending || !form.category}
            >
              {createMut.isPending || updateMut.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{editId !== null ? t.recurring.saving : t.recurring.creating}</>
                : editId !== null ? t.recurring.saveBtn : t.recurring.createBtn}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.common.delete} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette règle récurrente sera supprimée définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

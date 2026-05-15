import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  useGetExpense, useNormalizeExpense, useUpdateExpense, useValidateExpense, useGetAccounts,
  getGetExpensesQueryKey, getGetDashboardSummaryQueryKey, getGetExpenseQueryKey, getGetAccountsQueryKey,
} from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatFCFA } from "@/lib/format";
import { ExpenseStatusBadge, DgiStatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft, Shield, QrCode, Loader2, Calendar, Tag, Wallet, Pencil, X, Check,
  CheckCircle, XCircle, FileDown, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/auth";

const CATEGORIES = [
  "Alimentation", "Transport", "Carburant", "Bureau", "Communication",
  "Santé", "Logement", "Eau", "Électricité", "Salaire", "Matériel",
  "Marketing", "Formation", "Divers"
];

export default function ExpenseDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const id = parseInt(params.id, 10);
  const canApprove = user?.role === "admin" || user?.role === "accountant";

  const [editMode, setEditMode] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const { data: expense, isLoading } = useGetExpense(id, {
    query: { queryKey: getGetExpenseQueryKey(id), enabled: !!id }
  });

  const { data: accounts } = useGetAccounts({ query: { queryKey: getGetAccountsQueryKey() } } as any);

  const normalizeExpense = useNormalizeExpense();
  const updateExpense = useUpdateExpense();
  const validateExpense = useValidateExpense();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetExpenseQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };

  const handleApprove = () => {
    validateExpense.mutate({ id }, {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "Dépense approuvée ✓" });
      },
      onError: () => toast({ title: "Erreur lors de l'approbation", variant: "destructive" }),
    });
  };

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      const token = getToken();
      const res = await fetch(`/api/expenses/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: reason || undefined }),
      });
      if (!res.ok) throw new Error("Reject failed");
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Dépense rejetée" });
      setShowRejectForm(false);
      setRejectReason("");
    },
    onError: () => toast({ title: "Erreur lors du rejet", variant: "destructive" }),
  });

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/expenses/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recu-depense-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Erreur lors du téléchargement PDF", variant: "destructive" });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const openEdit = () => {
    if (!expense) return;
    setEditDesc(expense.description);
    setEditAmount(String(expense.amount));
    setEditCategory(expense.category);
    setEditNotes(expense.notes ?? "");
    setEditMode(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateExpense.mutate(
      { id, data: { description: editDesc, amount: parseFloat(editAmount), category: editCategory, notes: editNotes || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetExpenseQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast({ title: "Dépense modifiée avec succès" });
          setEditMode(false);
        },
        onError: () => toast({ title: "Erreur lors de la modification", variant: "destructive" }),
      }
    );
  };

  const handleNormalize = () => {
    normalizeExpense.mutate({ expenseId: id }, {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getGetExpensesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        if (result.status === "normalized") {
          toast({ title: "Dépense normalisée par la DGI", description: `Référence: ${result.reference}` });
        } else {
          toast({ title: "Échec de normalisation DGI", variant: "destructive" });
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Dépense introuvable</p>
        <Button className="mt-4" onClick={() => setLocation("/expenses")}>Retour</Button>
      </div>
    );
  }

  const rejectionReason = (expense as any).rejectionReason as string | null | undefined;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/expenses")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{expense.description}</h1>
          <p className="text-muted-foreground text-sm">Détail de la dépense #{expense.id}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!editMode && expense.status === "pending" && (
            <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5" data-testid="button-edit-expense">
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </Button>
          )}
          <Button
            variant="outline" size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="gap-1.5"
            data-testid="button-download-pdf"
          >
            {isDownloadingPdf
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <FileDown className="w-3.5 h-3.5" />}
            PDF
          </Button>
        </div>
      </div>

      {/* Rejection reason banner */}
      {expense.status === "rejected" && rejectionReason && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Motif de rejet :</strong> {rejectionReason}
          </AlertDescription>
        </Alert>
      )}

      {/* Approval actions */}
      {expense.status === "pending" && canApprove && !editMode && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium text-amber-800 mb-3">⏳ Cette dépense est en attente de validation</p>
            {!showRejectForm ? (
              <div className="flex gap-2">
                <Button
                  size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={validateExpense.isPending}
                  data-testid="button-approve"
                >
                  {validateExpense.isPending
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <CheckCircle className="w-3.5 h-3.5" />}
                  Approuver
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => setShowRejectForm(true)}
                  data-testid="button-show-reject"
                >
                  <XCircle className="w-3.5 h-3.5" /> Rejeter
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Motif de rejet (optionnel)</Label>
                  <Textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Expliquez pourquoi cette dépense est rejetée…"
                    rows={2}
                    data-testid="input-reject-reason"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-red-600 hover:bg-red-700"
                    onClick={() => rejectMutation.mutate(rejectReason)}
                    disabled={rejectMutation.isPending}
                    data-testid="button-confirm-reject"
                  >
                    {rejectMutation.isPending
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <XCircle className="w-3.5 h-3.5" />}
                    Confirmer le rejet
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowRejectForm(false)}>Annuler</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit mode */}
      {editMode ? (
        <Card className="border-primary/30 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" /> Modifier la dépense
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} required data-testid="input-edit-description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Montant (FCFA) *</Label>
                  <Input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} required min="1" data-testid="input-edit-amount" />
                </div>
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger data-testid="select-edit-category"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} data-testid="input-edit-notes" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateExpense.isPending} className="gap-1.5" data-testid="button-save-edit">
                  {updateExpense.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Enregistrer
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditMode(false)} className="gap-1.5" data-testid="button-cancel-edit">
                  <X className="w-4 h-4" /> Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm flex items-center gap-2"><Wallet className="w-4 h-4" /> Montant</span>
              <span className="text-2xl font-bold" data-testid="text-expense-amount">{formatFCFA(expense.amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm flex items-center gap-2"><Tag className="w-4 h-4" /> Catégorie</span>
              <span className="font-medium" data-testid="text-expense-category">{expense.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</span>
              <span className="font-medium">{format(new Date(expense.createdAt), "d MMMM yyyy, HH:mm")}</span>
            </div>
            {expense.accountId && accounts && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Compte</span>
                <span className="font-medium">{accounts.find(a => a.id === expense.accountId)?.name ?? `#${expense.accountId}`}</span>
              </div>
            )}
            {expense.employeeName && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Employé</span>
                <span className="font-medium">{expense.employeeName}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Statut</span>
              <ExpenseStatusBadge status={expense.status} />
            </div>
            {expense.notes && (
              <div>
                <span className="text-muted-foreground text-sm">Notes</span>
                <p className="mt-1 text-sm border rounded p-2 bg-muted/30">{expense.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* DGI Section */}
      <Card className={expense.dgiStatus === "normalized" ? "border-green-200 bg-green-50/50" : "border-amber-200 bg-amber-50/30"}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className={`w-4 h-4 ${expense.dgiStatus === "normalized" ? "text-green-600" : "text-amber-600"}`} />
            Conformité DGI (e-MECeF)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Statut DGI</span>
            <DgiStatusBadge status={expense.dgiStatus} />
          </div>

          {expense.dgiReference && (
            <div>
              <span className="text-muted-foreground text-sm">Référence MECeF</span>
              <p className="font-mono text-sm mt-1 bg-muted/50 rounded p-2" data-testid="text-dgi-reference">
                {expense.dgiReference}
              </p>
            </div>
          )}

          {expense.dgiQrCode && (
            <div>
              <span className="text-muted-foreground text-sm flex items-center gap-1 mb-2">
                <QrCode className="w-4 h-4" /> Code QR de vérification
              </span>
              <div className="border rounded p-3 bg-white flex flex-col items-center gap-2">
                <div className="w-24 h-24 bg-muted/30 rounded border-2 border-dashed flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <a href={expense.dgiQrCode} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary underline break-all text-center" data-testid="link-dgi-qr">
                  {expense.dgiQrCode}
                </a>
              </div>
            </div>
          )}

          {(expense.dgiStatus === "not_submitted" || expense.dgiStatus === "failed") && (
            <Button onClick={handleNormalize} disabled={normalizeExpense.isPending} className="w-full gap-2" data-testid="button-normalize-dgi">
              {normalizeExpense.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {normalizeExpense.isPending ? "Envoi à la DGI..." : "Envoyer à la DGI"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

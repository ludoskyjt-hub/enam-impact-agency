import { useState, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useGetAccounts } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle2, AlertCircle, Download, X } from "lucide-react";

interface PreviewRow {
  index: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  notes: string;
  valid: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  food: "Alimentation", transport: "Transport", accommodation: "Hébergement",
  office: "Bureau", telecom: "Télécom", salary: "Salaire", tax: "Taxes",
  utilities: "Services", marketing: "Marketing", other: "Autre",
};

const CSV_TEMPLATE = `description,amount,category,date,notes\nRepas client,12000,food,2026-01-15,Déjeuner d'affaires\nTransport bureau,3500,transport,2026-01-16,Taxi centre-ville\nFournitures bureau,8500,office,2026-01-17,`;

function formatAmount(n: number) {
  return new Intl.NumberFormat("fr-BJ").format(n) + " FCFA";
}

export default function ImportPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { data: accounts } = useGetAccounts();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [stats, setStats] = useState<{ total: number; valid: number; skipped: number } | null>(null);
  const [accountId, setAccountId] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null);

  const token = getToken();

  const parseFile = useCallback(async (f: File) => {
    setIsParsing(true);
    setPreview(null);
    setStats(null);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", f);
      const res = await fetch("/api/import/preview", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur de parsing");
      setPreview(data.rows);
      setStats({ total: data.total, valid: data.valid, skipped: data.skipped });
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsParsing(false);
    }
  }, [token, toast]);

  const handleFileSelect = (f: File) => {
    setFile(f);
    parseFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, []);

  const handleConfirm = async () => {
    if (!preview || !accountId) return;
    setIsImporting(true);
    try {
      const res = await fetch("/api/import/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rows: preview.map(r => ({
            description: r.description,
            amount: r.amount,
            category: r.category,
            date: r.date,
            notes: r.notes,
          })),
          accountId: parseInt(accountId),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur d'import");
      setImportResult({ imported: data.imported });
      setPreview(null);
      setFile(null);
      setStats(null);
      toast({ title: "Import réussi", description: `${data.imported} dépense(s) importée(s)` });
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-import-depenses.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStats(null);
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Importer des dépenses</h1>
          <p className="text-muted-foreground mt-1">
            Importez vos dépenses depuis un fichier CSV
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
          <Download className="w-4 h-4" />
          Télécharger le modèle CSV
        </Button>
      </div>

      {importResult ? (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-8 flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
          <div>
            <p className="text-2xl font-bold text-green-400">{importResult.imported} dépense(s) importée(s)</p>
            <p className="text-muted-foreground mt-1">Toutes les dépenses ont été ajoutées avec le statut "En attente".</p>
          </div>
          <Button onClick={reset} variant="outline">Nouvel import</Button>
        </div>
      ) : (
        <>
          {!file ? (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-xl border-2 border-dashed p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
              <Upload className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-lg font-semibold">Glissez votre fichier CSV ici</p>
                <p className="text-muted-foreground text-sm mt-1">ou cliquez pour sélectionner — max 5 Mo</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 px-4 py-2 rounded-lg bg-muted/50">
                <FileText className="w-4 h-4 shrink-0" />
                Colonnes requises : <code className="font-mono mx-1">description</code> et <code className="font-mono mx-1">amount</code>.
                Colonnes optionnelles : <code className="font-mono mx-1">category</code>, <code className="font-mono mx-1">date</code>, <code className="font-mono mx-1">notes</code>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} Ko</p>
              </div>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {isParsing && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Analyse du fichier en cours…
            </div>
          )}

          {stats && preview && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border bg-card p-4 text-center">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground mt-1">Lignes lues</p>
                </div>
                <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.valid}</p>
                  <p className="text-sm text-muted-foreground mt-1">Lignes valides</p>
                </div>
                <div className={`rounded-xl border p-4 text-center ${stats.skipped > 0 ? "border-yellow-500/30 bg-yellow-500/5" : "bg-card"}`}>
                  <p className={`text-2xl font-bold ${stats.skipped > 0 ? "text-yellow-400" : ""}`}>{stats.skipped}</p>
                  <p className="text-sm text-muted-foreground mt-1">Lignes ignorées</p>
                </div>
              </div>

              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <p className="font-semibold">Aperçu des données ({preview.length} lignes)</p>
                  {stats.skipped > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-yellow-500">
                      <AlertCircle className="w-4 h-4" />
                      {stats.skipped} ligne(s) ignorée(s) — description ou montant manquant
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Montant</th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Catégorie</th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Date</th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 50).map((row, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 max-w-[200px] truncate">{row.description}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-medium text-primary">{formatAmount(row.amount)}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-md bg-muted text-xs">
                              {CATEGORY_LABELS[row.category] ?? row.category}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs">
                            {new Date(row.date).toLocaleDateString("fr-BJ")}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs max-w-[160px] truncate">{row.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 50 && (
                    <p className="px-4 py-3 text-sm text-muted-foreground border-t">
                      … et {preview.length - 50} autre(s) lignes (toutes seront importées)
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium mb-1">Compte de destination</p>
                  <p className="text-sm text-muted-foreground">Toutes les dépenses seront débitées de ce compte</p>
                </div>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Sélectionnez un compte…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(accounts ?? []).map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <Button variant="outline" onClick={reset}>Annuler</Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!accountId || isImporting}
                  className="gap-2 min-w-[180px]"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Import en cours…
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Importer {preview.length} dépense(s)
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

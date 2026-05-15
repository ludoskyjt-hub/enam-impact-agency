import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AuditEntry {
  id: number;
  action: string;
  entityType: string | null;
  entityId: number | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  userEmail: string | null;
  userId: number | null;
}

const ACTION_LABELS: Record<string, string> = {
  "expense.create": "Dépense créée",
  "expense.validate": "Dépense validée",
  "expense.reject": "Dépense rejetée",
  "expense.delete": "Dépense supprimée",
  "dgi.sync": "Sync DGI",
  "auth.login": "Connexion",
  "auth.register": "Inscription",
  "account.create": "Compte créé",
  "account.delete": "Compte supprimé",
  "employee.create": "Employé ajouté",
  "employee.delete": "Employé supprimé",
  "settings.update": "Paramètres modifiés",
  "notifications.update": "Notifications modifiées",
};

const ACTION_COLORS: Record<string, string> = {
  "expense.create": "bg-blue-100 text-blue-800 border-blue-200",
  "expense.validate": "bg-green-100 text-green-800 border-green-200",
  "expense.reject": "bg-red-100 text-red-800 border-red-200",
  "expense.delete": "bg-orange-100 text-orange-800 border-orange-200",
  "dgi.sync": "bg-purple-100 text-purple-800 border-purple-200",
  "auth.login": "bg-gray-100 text-gray-700 border-gray-200",
  "auth.register": "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

function ActionBadge({ action }: { action: string }) {
  const label = ACTION_LABELS[action] ?? action;
  const color = ACTION_COLORS[action] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
}

export default function AuditPage() {
  const { t } = useI18n();
  const [filterAction, setFilterAction] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const token = getToken();

  const { data, isLoading, refetch, isFetching } = useQuery<AuditEntry[]>({
    queryKey: ["audit", filterAction, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (filterAction !== "all") params.set("action", filterAction);
      const res = await fetch(`/api/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
    enabled: !!token,
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            {t.audit.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.audit.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          {t.common.refresh}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">{t.audit.colAction}</CardTitle>
            <Select value={filterAction} onValueChange={v => { setFilterAction(v); setPage(0); }}>
              <SelectTrigger className="w-52 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.audit.filterAll}</SelectItem>
                {ALL_ACTIONS.map(a => (
                  <SelectItem key={a} value={a}>{ACTION_LABELS[a] ?? a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">{t.audit.empty}</p>
              <p className="text-sm mt-1">{t.audit.emptyDesc}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">{t.audit.colDate}</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">{t.audit.colAction}</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">{t.audit.colUser}</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">{t.audit.colEntity}</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">{t.audit.colDetails}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.map(entry => (
                      <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.createdAt), "dd/MM/yy HH:mm", { locale: fr })}
                        </td>
                        <td className="px-4 py-3">
                          <ActionBadge action={entry.action} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {entry.userEmail ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {entry.entityType ? (
                            <span>{entry.entityType}{entry.entityId ? ` #${entry.entityId}` : ""}</span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                          {entry.details
                            ? Object.entries(entry.details)
                                .slice(0, 2)
                                .map(([k, v]) => `${k}: ${String(v)}`)
                                .join(" · ")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
                <p className="text-xs text-muted-foreground">{data.length} entrée(s)</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    ← Précédent
                  </Button>
                  <Button variant="outline" size="sm" disabled={data.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>
                    Suivant →
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

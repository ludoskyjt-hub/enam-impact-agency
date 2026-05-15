import { useBoutikoGetSales } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, Receipt, ShoppingCart, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import SellModal from "@/components/sell-modal";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
  card: "Carte",
  credit: "Crédit",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Complète",
  pending: "En attente",
  cancelled: "Annulée",
};

export default function Sales() {
  const { data: sales, isLoading } = useBoutikoGetSales();
  const [sellOpen, setSellOpen] = useState(false);

  const totalRevenue = sales?.filter(s => s.status === "completed")
    .reduce((sum, s) => sum + Number(s.totalAmount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Ventes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sales?.length || 0} vente{(sales?.length || 0) > 1 ? "s" : ""} — {totalRevenue.toLocaleString("fr-FR")} FCFA au total
          </p>
        </div>
        <Button className="gap-2" onClick={() => setSellOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle vente
        </Button>
      </div>

      {/* Sales list */}
      <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sales && sales.length > 0 ? (
          <>
            {/* Table header — desktop only */}
            <div className="hidden md:grid grid-cols-5 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/40 border-b border-border">
              <span>Date</span>
              <span>Client</span>
              <span>Montant</span>
              <span>Paiement</span>
              <span>Statut</span>
            </div>
            <div className="divide-y divide-border">
              {sales.map((sale) => (
                <div key={sale.id} className="px-6 py-4 hover:bg-muted/20 transition-colors">
                  {/* Mobile */}
                  <div className="flex items-center justify-between md:hidden">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{sale.clientName || "Client de passage"}</p>
                        <p className="text-xs text-muted-foreground">
                          {sale.createdAt ? format(new Date(sale.createdAt), "d MMM yyyy", { locale: fr }) : ""}
                          {" · "}{PAYMENT_LABELS[sale.paymentMethod || ""] || sale.paymentMethod}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary text-sm">{Number(sale.totalAmount).toLocaleString("fr-FR")} FCFA</p>
                      <Badge variant={sale.status === "completed" ? "default" : "secondary"} className="text-[10px] mt-0.5">
                        {STATUS_LABELS[sale.status || ""] || sale.status}
                      </Badge>
                    </div>
                  </div>
                  {/* Desktop */}
                  <div className="hidden md:grid grid-cols-5 items-center text-sm">
                    <span className="text-muted-foreground">
                      {sale.createdAt ? format(new Date(sale.createdAt), "d MMM yyyy HH:mm", { locale: fr }) : ""}
                    </span>
                    <span className="font-medium">{sale.clientName || "Client de passage"}</span>
                    <span className="font-black text-primary">{Number(sale.totalAmount).toLocaleString("fr-FR")} FCFA</span>
                    <span>
                      <Badge variant="outline" className="text-xs">
                        {PAYMENT_LABELS[sale.paymentMethod || ""] || sale.paymentMethod}
                      </Badge>
                    </span>
                    <span>
                      <Badge variant={sale.status === "completed" ? "default" : "secondary"} className="text-xs">
                        {STATUS_LABELS[sale.status || ""] || sale.status}
                      </Badge>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
            <Receipt className="h-12 w-12 mb-4 opacity-20" />
            <p className="font-medium">Aucune vente enregistrée</p>
            <p className="text-sm mt-1">Commencez par créer votre première vente</p>
            <Button className="mt-4 gap-2" onClick={() => setSellOpen(true)}>
              <Plus className="h-4 w-4" />
              Enregistrer une vente
            </Button>
          </div>
        )}
      </div>

      {sellOpen && <SellModal onClose={() => setSellOpen(false)} />}
    </div>
  );
}

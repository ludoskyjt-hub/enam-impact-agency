import { useState } from "react";
import { useBoutikoGetDashboard, useBoutikoGetShop } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2, ShoppingCart, Users, Package, TrendingUp,
  ArrowRight, DollarSign, CalendarDays, BarChart2,
  Bot, Shield, Plus,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState as useLocalState } from "react";
import SellModal from "@/components/sell-modal";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
  card: "Carte",
  credit: "Crédit",
};

function StatCard({
  label, value, sub, icon: Icon, badge, iconBg = "bg-muted", iconColor = "text-muted-foreground",
}: {
  label: string; value: React.ReactNode; sub?: string; icon: any;
  badge?: { text: string; variant?: "default" | "secondary" | "destructive" | "outline" };
  iconBg?: string; iconColor?: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground leading-tight">{label}</p>
        <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-black leading-none">{value}</p>
        {badge && (
          <Badge variant={badge.variant || "default"} className="mb-0.5 text-[10px]">{badge.text}</Badge>
        )}
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-1.5 leading-tight">{sub}</p>}
    </div>
  );
}

function RevenueChart({ dashboard }: { dashboard: any }) {
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");

  return (
    <div className="bg-card border border-card-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm">Revenus</h3>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {(["7", "30", "90"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                period === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}j
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-[120px] flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-xl">
        {dashboard?.totalRevenue > 0
          ? <p className="text-center">
              <span className="block text-2xl font-black text-primary">
                {Number(dashboard.totalRevenue).toLocaleString("fr-FR")} FCFA
              </span>
              <span className="text-xs mt-1 block">{dashboard.totalSales} ventes au total</span>
            </p>
          : "Aucune vente enregistrée dans la période."
        }
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: dashboard, isLoading } = useBoutikoGetDashboard();
  const { data: shop } = useBoutikoGetShop();
  const [sellOpen, setSellOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const shopName = shop?.name?.toUpperCase() || "MA BOUTIQUE";
  const totalStock = dashboard?.totalProducts ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{shopName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bienvenue sur votre tableau de bord
          </p>
        </div>
        <Button className="gap-2" onClick={() => setSellOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle vente
        </Button>
      </div>

      {/* Row 1: Subscription / Products / Clients */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Abonnement"
          value="Négoces"
          badge={{ text: "Actif", variant: "default" }}
          sub="Gérer la facturation →"
          icon={Shield}
          iconBg="bg-primary/10"
          iconColor="text-primary"
        />
        <StatCard
          label="Total de produits"
          value={totalStock}
          sub={`Valeur du stock : ${Number(dashboard?.totalRevenue ?? 0).toLocaleString("fr-FR")}`}
          icon={Package}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Clients"
          value={dashboard?.totalClients ?? 0}
          sub="Gérez votre portefeuille clients"
          icon={Users}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Row 2: CA today / week / month */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Chiffre d'affaires aujourd'hui"
          value={`${Number(dashboard?.todayRevenue ?? 0).toLocaleString("fr-FR")} FCFA`}
          sub={`${dashboard?.todaySales ?? 0} transaction(s)`}
          icon={DollarSign}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="CA cette semaine"
          value={`${Number(dashboard?.todayRevenue ?? 0).toLocaleString("fr-FR")} FCFA`}
          sub={`${dashboard?.todaySales ?? 0} transaction(s)`}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="CA ce mois"
          value={`${Number(dashboard?.totalRevenue ?? 0).toLocaleString("fr-FR")} FCFA`}
          sub="30 derniers jours"
          icon={CalendarDays}
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
        />
      </div>

      {/* Chart + Activity row */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RevenueChart dashboard={dashboard} />
        </div>

        {/* Agent IA activities */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm">Agent IA</h3>
            </div>
            <Link href="/ai-agent">
              <span className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                Voir tout <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[120px] text-center text-sm text-muted-foreground">
            <Bot className="h-8 w-8 mb-2 opacity-20" />
            <p>Aucune activité récente</p>
            <p className="text-xs mt-1">L'agent IA vous aidera à automatiser vos tâches</p>
          </div>
        </div>
      </div>

      {/* Inventory quick view */}
      <div className="bg-card border border-card-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm">Inventaire</h3>
          </div>
          <Link href="/inventory">
            <span className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
              Voir tout <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
        {dashboard?.topProducts && dashboard.topProducts.length > 0 ? (
          <div className="divide-y divide-border/50">
            {dashboard.topProducts.slice(0, 5).map((p: any, i: number) => (
              <div key={p.productId || i} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium truncate">{p.productName}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-primary">{Number(p.revenue).toLocaleString("fr-FR")} FCFA</p>
                  <p className="text-xs text-muted-foreground">{p.totalSold} vendus</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Aucun produit enregistré
          </div>
        )}
      </div>

      {/* Recent sales */}
      <div className="bg-card border border-card-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm">Ventes récentes</h3>
          </div>
          <Link href="/sales">
            <span className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
              Voir tout <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
        {dashboard?.recentSales && dashboard.recentSales.length > 0 ? (
          <div className="divide-y divide-border/50">
            {dashboard.recentSales.map((sale: any) => (
              <div key={sale.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{sale.clientName || "Client de passage"}</p>
                    <p className="text-xs text-muted-foreground">{PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-primary shrink-0 ml-4">
                  {Number(sale.totalAmount).toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Aucune vente enregistrée.
          </div>
        )}
      </div>

      {sellOpen && <SellModal onClose={() => setSellOpen(false)} />}
    </div>
  );
}

import { Shield, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Subscription() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Abonnement</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gérez votre abonnement et votre facturation</p>
      </div>
      <div className="bg-card border border-card-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold">Plan Négoces</p>
              <p className="text-xs text-muted-foreground">Boutique complète</p>
            </div>
          </div>
          <Badge>Actif</Badge>
        </div>
        <div className="space-y-2 mt-4">
          {["Inventaire illimité", "Gestion des clients", "Caisse POS", "Agent IA", "Rapports avancés"].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              {f}
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-6">Gérer la facturation</Button>
      </div>
    </div>
  );
}

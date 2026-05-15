import { Layers } from "lucide-react";

export default function Pricing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Tarification</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Consultez nos formules et tarifs</p>
      </div>
      <div className="bg-card border border-card-border rounded-2xl p-16 flex flex-col items-center text-center text-muted-foreground">
        <Layers className="h-14 w-14 mb-4 opacity-20" />
        <p className="font-semibold">Tarification bientôt disponible</p>
        <p className="text-sm mt-1">Contactez-nous pour connaître nos offres</p>
      </div>
    </div>
  );
}

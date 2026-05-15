import { UserCog } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gérez les accès et les permissions</p>
      </div>
      <div className="bg-card border border-card-border rounded-2xl p-16 flex flex-col items-center text-center text-muted-foreground">
        <UserCog className="h-14 w-14 mb-4 opacity-20" />
        <p className="font-semibold">Gestion des utilisateurs bientôt disponible</p>
        <p className="text-sm mt-1">Cette fonctionnalité sera disponible prochainement</p>
      </div>
    </div>
  );
}

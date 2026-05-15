import { useState } from "react";
import { useBoutikoGetClients, useBoutikoCreateClient } from "@workspace/api-client-react";
import { getBoutikoGetClientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Search, UserCircle2, Phone, Mail, MapPin, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import SellModal from "@/components/sell-modal";

export default function Customers() {
  const { data: clients, isLoading } = useBoutikoGetClients();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [sellClientId, setSellClientId] = useState<string | null>(null);


  const filteredClients = clients?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {clients?.length || 0} client{(clients?.length || 0) > 1 ? "s" : ""} enregistré{(clients?.length || 0) > 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un client</DialogTitle>
            </DialogHeader>
            <ClientForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un client..." className="pl-9"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map(client => (
            <div key={client.id} className="bg-card border border-card-border rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-primary uppercase">
                    {client.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm leading-tight truncate">{client.name}</h3>
                  <div className="mt-2 space-y-1">
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" />{client.phone}
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{client.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total achats</p>
                      <p className="text-sm font-black text-primary">
                        {Number(client.totalPurchases || 0).toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => setSellClientId(String(client.id))}
                    >
                      <ShoppingCart className="h-3 w-3" />
                      Vente
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredClients.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed rounded-2xl">
              <UserCircle2 className="mx-auto h-10 w-10 mb-3 opacity-30" />
              <p className="font-medium">Aucun client trouvé</p>
              <p className="text-sm mt-1">Ajoutez votre premier client</p>
            </div>
          )}
        </div>
      )}

      {sellClientId && (
        <SellModal
          defaultClientId={sellClientId}
          onClose={() => setSellClientId(null)}
        />
      )}
    </div>
  );
}

function ClientForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createClient = useBoutikoCreateClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClient.mutate({
      data: { name, phone: phone || undefined, email: email || undefined, address: address || undefined }
    }, {
      onSuccess: () => {
        toast({ title: "Client ajouté avec succès" });
        queryClient.invalidateQueries({ queryKey: getBoutikoGetClientsQueryKey() });
        onSuccess();
      },
      onError: (err: any) => {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>Nom complet *</Label>
        <Input required placeholder="Ex : Kofi Mensah" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Téléphone (optionnel)</Label>
        <Input type="tel" placeholder="+229 90 00 00 00" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Email (optionnel)</Label>
        <Input type="email" placeholder="client@exemple.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Adresse (optionnel)</Label>
        <Input placeholder="Ex : Cotonou, Akpakpa" value={address} onChange={e => setAddress(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={createClient.isPending}>
        {createClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enregistrer le client
      </Button>
    </form>
  );
}

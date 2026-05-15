import { useState, useEffect } from "react";
import { useBoutikoGetShop, useBoutikoUpdateShop } from "@workspace/api-client-react";
import { getBoutikoGetShopQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Store, Globe, DollarSign, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBoutikoGetMe } from "@workspace/api-client-react";

export default function Settings() {
  const { data: shop, isLoading } = useBoutikoGetShop();
  const { data: me } = useBoutikoGetMe();
  const updateShop = useBoutikoUpdateShop();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    currency: "XOF",
    country: "BJ",
  });

  useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name || "",
        description: shop.description || "",
        currency: shop.currency || "XOF",
        country: shop.country || "BJ",
      });
    }
  }, [shop]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateShop.mutate({
      data: {
        name: formData.name,
        description: formData.description,
        currency: formData.currency,
        country: formData.country,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Paramètres enregistrés", description: "Votre boutique a été mise à jour." });
        queryClient.invalidateQueries({ queryKey: getBoutikoGetShopQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gérez le profil et les préférences de votre boutique</p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" />
            Compte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Nom</p>
              <p className="font-semibold">{me?.name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Email</p>
              <p className="font-semibold">{me?.email || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shop profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4 text-primary" />
            Profil de la boutique
          </CardTitle>
          <CardDescription>
            Ces informations apparaissent sur vos tickets et rapports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Nom de la boutique *</Label>
              <Input required placeholder="Ex : Boutique Aminata"
                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Décrivez brièvement ce que vous vendez..."
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  Devise *
                </Label>
                <Input required placeholder="XOF, EUR, USD..."
                  value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} />
                <p className="text-xs text-muted-foreground">XOF pour le Bénin, Côte d'Ivoire, Sénégal</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Code pays *
                </Label>
                <Input required placeholder="BJ, CI, SN, GH..."
                  value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                <p className="text-xs text-muted-foreground">BJ = Bénin, CI = Côte d'Ivoire</p>
              </div>
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={updateShop.isPending}>
                {updateShop.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

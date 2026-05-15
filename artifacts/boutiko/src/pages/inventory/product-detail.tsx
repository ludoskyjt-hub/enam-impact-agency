import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useBoutikoGetProduct, useBoutikoUpdateProduct, useBoutikoDeleteProduct } from "@workspace/api-client-react";
import { getBoutikoGetProductsQueryKey, getBoutikoGetProductQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Trash2, Package, TrendingUp, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import SellModal from "@/components/sell-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProductDetail() {
  const [, params] = useRoute("/inventory/:id");
  const [, setLocation] = useLocation();
  const idStr = params?.id;
  const id = idStr ? Number(idStr) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sellOpen, setSellOpen] = useState(false);

  const { data: product, isLoading } = useBoutikoGetProduct(id, {
    query: { enabled: !!idStr, queryKey: [] as any }
  });

  const updateProduct = useBoutikoUpdateProduct();
  const deleteProduct = useBoutikoDeleteProduct();

  const [formData, setFormData] = useState({
    name: "", price: "", costPrice: "", stock: "", category: "", unit: "pcs",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        price: product.price?.toString() || "",
        costPrice: product.costPrice?.toString() || "",
        stock: product.stock?.toString() || "",
        category: product.category || "",
        unit: product.unit || "pcs",
      });
    }
  }, [product]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!product) return (
    <div className="text-center py-16 text-muted-foreground">
      <Package className="mx-auto h-10 w-10 mb-3 opacity-30" />
      <p>Produit introuvable</p>
    </div>
  );

  const margin = product.costPrice && product.price
    ? (((Number(product.price) - Number(product.costPrice)) / Number(product.price)) * 100).toFixed(0)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProduct.mutate({
      id,
      data: {
        name: formData.name,
        price: Number(formData.price),
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        stock: Number(formData.stock),
        category: formData.category || undefined,
        unit: formData.unit || "pcs",
      }
    }, {
      onSuccess: () => {
        toast({ title: "Produit mis à jour" });
        queryClient.invalidateQueries({ queryKey: getBoutikoGetProductQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getBoutikoGetProductsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Produit supprimé" });
        queryClient.invalidateQueries({ queryKey: getBoutikoGetProductsQueryKey() });
        setLocation("/inventory");
      },
      onError: (err: any) => {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setLocation("/inventory")} className="-ml-2 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour à l'inventaire
        </Button>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="gap-2"
            disabled={product.stock <= 0}
            onClick={() => setSellOpen(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            Vendre
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le produit <strong>{product.name}</strong> sera définitivement supprimé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteProduct.isPending}>
                  {deleteProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Supprimer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Prix vente", value: `${Number(product.price).toLocaleString("fr-FR")}`, sub: "FCFA", color: "text-primary" },
          { label: "Stock actuel", value: String(product.stock), sub: product.unit || "pcs", color: product.stock <= 5 ? "text-destructive" : "" },
          { label: "Marge", value: margin ? `${margin}%` : "—", sub: "bénéfice", color: "text-emerald-600", icon: TrendingUp },
        ].map(s => (
          <div key={s.label} className="bg-card border border-card-border rounded-2xl p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {product.stock <= 5 && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
          <span>⚠️</span>
          <span>Stock faible — pensez à réapprovisionner ce produit</span>
        </div>
      )}

      {/* Edit form */}
      <div className="bg-card border border-card-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold">{product.name}</h2>
            {product.category && <Badge variant="outline" className="text-[10px] mt-1">{product.category}</Badge>}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du produit *</Label>
            <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prix de vente (FCFA) *</Label>
              <Input type="number" step="1" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Prix d'achat (optionnel)</Label>
              <Input type="number" step="1" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stock *</Label>
              <Input type="number" required value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Unité</Label>
              <Input placeholder="pcs, kg, L..." value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Input placeholder="Ex : Alimentaire..." value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
          </div>
          <Button type="submit" disabled={updateProduct.isPending}>
            {updateProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les modifications
          </Button>
        </form>
      </div>

      {sellOpen && <SellModal product={product} onClose={() => setSellOpen(false)} />}
    </div>
  );
}

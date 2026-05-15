import { useState } from "react";
import { useBoutikoGetProducts, useBoutikoCreateProduct } from "@workspace/api-client-react";
import { getBoutikoGetProductsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Search, AlertTriangle, Package, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import SellModal from "@/components/sell-modal";

export default function Inventory() {
  const { data: products, isLoading } = useBoutikoGetProducts();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [sellProduct, setSellProduct] = useState<any>(null);

  const filteredProducts = products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  const lowStockCount = products?.filter(p => p.stock <= 5).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Inventaire</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {products?.length || 0} article{(products?.length || 0) > 1 ? "s" : ""} au catalogue
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau produit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un produit</DialogTitle>
            </DialogHeader>
            <ProductForm onSuccess={() => setIsAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span><strong>{lowStockCount} produit{lowStockCount > 1 ? "s" : ""}</strong> en stock faible (≤ 5 unités)</span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un produit..." className="pl-9"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-card border border-card-border rounded-2xl p-5 hover:shadow-md transition-all group">
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  {product.stock <= 5 && (
                    <Badge variant="destructive" className="text-[10px]">Stock faible</Badge>
                  )}
                </div>
              </div>

              {/* Name + category */}
              <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
              {product.category && (
                <Badge variant="outline" className="w-fit text-[10px] mb-3">{product.category}</Badge>
              )}

              {/* Price / stock */}
              <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Prix vente</p>
                  <p className="text-sm font-black text-primary mt-0.5">
                    {Number(product.price).toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Stock</p>
                  <p className={`text-sm font-bold mt-0.5 ${product.stock <= 5 ? "text-destructive" : ""}`}>
                    {product.stock} {product.unit || "pcs"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 h-8 text-xs"
                  disabled={product.stock <= 0}
                  onClick={() => setSellProduct(product)}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Vendre
                </Button>
                <Link href={`/inventory/${product.id}`}>
                  <Button size="sm" variant="outline" className="h-8 text-xs px-3">
                    Détails
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed rounded-2xl">
              <Package className="mx-auto h-10 w-10 mb-3 opacity-30" />
              <p className="font-medium">Aucun produit trouvé</p>
              <p className="text-sm mt-1">Essayez une autre recherche ou ajoutez un produit</p>
            </div>
          )}
        </div>
      )}

      {/* Sell Modal */}
      {sellProduct && (
        <SellModal
          product={sellProduct}
          onClose={() => setSellProduct(null)}
        />
      )}
    </div>
  );
}

function ProductForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createProduct = useBoutikoCreateProduct();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("pcs");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct.mutate({
      data: {
        name,
        price: Number(price),
        costPrice: costPrice ? Number(costPrice) : undefined,
        stock: Number(stock),
        category: category || undefined,
        unit: unit || "pcs",
        active: true,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Produit créé avec succès" });
        queryClient.invalidateQueries({ queryKey: getBoutikoGetProductsQueryKey() });
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
        <Label>Nom du produit *</Label>
        <Input required placeholder="Ex : Savon Lux 150g" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Prix de vente (FCFA) *</Label>
          <Input type="number" step="1" required placeholder="0" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Prix d'achat (optionnel)</Label>
          <Input type="number" step="1" placeholder="0" value={costPrice} onChange={e => setCostPrice(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Stock initial *</Label>
          <Input type="number" required placeholder="0" value={stock} onChange={e => setStock(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Unité</Label>
          <Input placeholder="pcs, kg, L..." value={unit} onChange={e => setUnit(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Catégorie</Label>
        <Input placeholder="Ex : Alimentaire, Ménager..." value={category} onChange={e => setCategory(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={createProduct.isPending}>
        {createProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enregistrer le produit
      </Button>
    </form>
  );
}

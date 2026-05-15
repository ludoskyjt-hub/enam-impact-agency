import { useState } from "react";
import { useBoutikoGetProducts, useBoutikoGetClients, useBoutikoCreateSale } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Minus, Plus, Trash2, ShoppingCart, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getBoutikoGetSalesQueryKey, getBoutikoGetDashboardQueryKey, getBoutikoGetProductsQueryKey } from "@workspace/api-client-react";

type CartItem = { product: any; quantity: number };

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Espèces" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "card", label: "Carte bancaire" },
  { value: "credit", label: "Crédit (payer plus tard)" },
];

interface SellModalProps {
  product?: any;
  defaultClientId?: string;
  onClose: () => void;
}

export default function SellModal({ product: initialProduct, defaultClientId, onClose }: SellModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: products } = useBoutikoGetProducts();
  const { data: clients } = useBoutikoGetClients();
  const createSale = useBoutikoCreateSale();

  const [cart, setCart] = useState<CartItem[]>(
    initialProduct ? [{ product: initialProduct, quantity: 1 }] : []
  );
  const [clientId, setClientId] = useState<string>(defaultClientId ? String(defaultClientId) : "");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money" | "card" | "credit">("cash");
  const [search, setSearch] = useState("");
  const [showProducts, setShowProducts] = useState(!initialProduct);

  const addToCart = (p: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === p.id);
      if (existing) return prev.map(i => i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product: p, quantity: 1 }];
    });
    setShowProducts(false);
    setSearch("");
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => i.product.id === productId
      ? { ...i, quantity: Math.max(1, i.quantity + delta) }
      : i
    ));
  };

  const removeItem = (productId: string) => setCart(prev => prev.filter(i => i.product.id !== productId));

  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const filteredProducts = products?.filter(p =>
    p.active && p.stock > 0 &&
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    !cart.find(c => c.product.id === p.id)
  ) || [];

  const handleSubmit = () => {
    if (cart.length === 0) {
      toast({ title: "Panier vide", variant: "destructive" });
      return;
    }
    createSale.mutate({
      data: {
        clientId: clientId ? Number(clientId) : undefined,
        totalAmount: total,
        paymentMethod,
        items: cart.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.product.price,
        })),
      }
    }, {
      onSuccess: () => {
        toast({ title: "Vente enregistrée !" });
        queryClient.invalidateQueries({ queryKey: getBoutikoGetSalesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getBoutikoGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getBoutikoGetProductsQueryKey() });
        onClose();
      },
      onError: (err: any) => {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Nouvelle vente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Cart items */}
          {cart.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Panier</p>
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 bg-muted/40 rounded-xl px-3 py-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Number(item.product.price).toLocaleString("fr-FR")} FCFA × {item.quantity} = <strong>{(item.product.price * item.quantity).toLocaleString("fr-FR")}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center bg-background border border-border rounded-lg">
                      <button onClick={() => updateQty(item.product.id, -1)} className="h-6 w-6 flex items-center justify-center hover:bg-muted rounded-l-lg transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product.id, 1)} className="h-6 w-6 flex items-center justify-center hover:bg-muted rounded-r-lg transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.product.id)} className="h-6 w-6 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add product */}
          {showProducts ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Rechercher un produit..."
                  className="pl-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredProducts.slice(0, 8).map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-sm font-medium">{p.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px]">{p.stock} {p.unit || "pcs"}</Badge>
                      <span className="text-sm font-bold text-primary">{Number(p.price).toLocaleString("fr-FR")}</span>
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">Aucun produit disponible</p>
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setShowProducts(false)}>
                Fermer la recherche
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setShowProducts(true)}>
              <Plus className="h-4 w-4" />
              Ajouter un produit
            </Button>
          )}

          {/* Client + payment */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Client (optionnel)</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Client de passage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Client de passage</SelectItem>
                  {clients?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mode de paiement</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Total + submit */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-black text-primary">{total.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <Button
              className="w-full h-12 text-base font-bold gap-2"
              disabled={cart.length === 0 || createSale.isPending}
              onClick={handleSubmit}
            >
              {createSale.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
              {paymentMethod === "credit" ? "Enregistrer (crédit)" : "Valider la vente"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

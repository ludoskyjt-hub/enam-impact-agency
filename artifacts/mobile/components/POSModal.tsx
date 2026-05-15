import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/i18n";
import {
  useBoutikoGetProducts,
  useBoutikoGetClients,
  useBoutikoCreateSale,
  getBoutikoGetSalesQueryKey,
  getBoutikoGetDashboardQueryKey,
  getBoutikoGetProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

function fmt(n: number) { return new Intl.NumberFormat("fr-FR").format(n) + " F"; }

type CartItem = { productId: number; productName: string; quantity: number; unitPrice: number };

interface POSModalProps {
  visible: boolean;
  onClose: () => void;
  initialProductId?: number;
  initialClientId?: number;
  insets: { top: number; bottom: number };
}

const PAYMENT_ICONS: Record<string, string> = { cash: "dollar-sign", mobile_money: "smartphone", card: "credit-card", credit: "clock" };

export function POSModal({ visible, onClose, initialProductId, initialClientId, insets }: POSModalProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const S = t.sales;
  const queryClient = useQueryClient();

  const { data: products = [] } = useBoutikoGetProducts();
  const { data: clients = [] } = useBoutikoGetClients();
  const createSale = useBoutikoCreateSale();

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (initialProductId) {
      const p = products.find((x: any) => x.id === initialProductId);
      if (p) return [{ productId: p.id, productName: p.name, quantity: 1, unitPrice: Number(p.price) }];
    }
    return [];
  });
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money" | "card" | "credit">("cash");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(initialClientId ?? null);
  const [search, setSearch] = useState("");

  const PAYMENT_LABELS: Record<string, string> = {
    cash: S.payment.cash, mobile_money: S.payment.mobile_money,
    card: S.payment.card, credit: S.payment.credit,
  };

  const filtered = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) && p.active
  );
  const total = cart.reduce((s: number, i: CartItem) => s + i.quantity * i.unitPrice, 0);

  const addToCart = (product: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev: CartItem[]) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, productName: product.name, quantity: 1, unitPrice: Number(product.price) }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev: CartItem[]) => prev.filter((i) => i.productId !== productId));
  };

  const handleCheckout = () => {
    if (!cart.length) return;
    const client = selectedClientId ? (clients as any[]).find((c: any) => c.id === selectedClientId) : null;
    createSale.mutate({
      data: {
        totalAmount: total,
        paymentMethod,
        clientId: selectedClientId ?? undefined,
        clientName: client?.name ?? undefined,
        items: cart.map((i: CartItem) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
      }
    }, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.invalidateQueries({ queryKey: getBoutikoGetSalesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getBoutikoGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getBoutikoGetProductsQueryKey() });
        setCart([]);
        setSearch("");
        setSelectedClientId(initialClientId ?? null);
        onClose();
      },
    });
  };

  const styles = makeStyles(colors, insets);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={[styles.posHeader, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.posTitle}>{S.pos_title}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={S.search_product}
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {/* Products grid */}
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => String(item.id)}
          numColumns={2}
          contentContainerStyle={{ padding: 12, gap: 8, paddingBottom: 300 }}
          columnWrapperStyle={{ gap: 8 }}
          renderItem={({ item }: any) => {
            const inCart = cart.find((c) => c.productId === item.id);
            return (
              <TouchableOpacity
                style={[styles.productTile, inCart && { borderColor: colors.primary, borderWidth: 2 }]}
                onPress={() => addToCart(item)}
                activeOpacity={0.85}
              >
                <Text style={styles.tilePrice}>{fmt(Number(item.price))}</Text>
                <Text style={styles.tileName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.tileBottom}>
                  <Text style={[styles.tileStock, { color: item.stock <= 5 ? "#ef4444" : colors.mutedForeground }]}>
                    {item.stock}
                  </Text>
                  {inCart ? (
                    <View style={[styles.qtyBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.qtyText}>{inCart.quantity}</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {cart.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              {cart.map((item) => (
                <View key={item.productId} style={styles.cartChip}>
                  <Text style={styles.cartChipText} numberOfLines={1}>{item.quantity}× {item.productName}</Text>
                  <TouchableOpacity onPress={() => removeFromCart(item.productId)} style={{ marginLeft: 4 }}>
                    <Feather name="x" size={12} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.paymentRow}>
            {(["cash", "mobile_money", "card", "credit"] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.payChip, paymentMethod === m && { backgroundColor: colors.primary }]}
                onPress={() => setPaymentMethod(m)}
              >
                <Text style={[styles.payChipText, paymentMethod === m && { color: "#fff" }]}>
                  {PAYMENT_LABELS[m]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.checkoutBtn, { backgroundColor: cart.length ? colors.primary : colors.muted }]}
            onPress={handleCheckout}
            disabled={!cart.length || createSale.isPending}
            activeOpacity={0.85}
          >
            {createSale.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.checkoutText, { color: cart.length ? "#fff" : colors.mutedForeground }]}>
                {S.checkout} · {fmt(total)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: any, insets: any) => StyleSheet.create({
  posHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  posTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.foreground },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.muted, borderRadius: 12, marginHorizontal: 12, marginBottom: 8, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" },
  productTile: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  tilePrice: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.primary, marginBottom: 4 },
  tileName: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground, marginBottom: 8 },
  tileBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tileStock: { fontSize: 11, fontFamily: "Inter_400Regular" },
  qtyBadge: { width: 22, height: 22, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  qtyText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingTop: 12, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8 },
  paymentRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  payChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.muted, alignItems: "center" },
  payChipText: { fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
  cartChip: { flexDirection: "row", alignItems: "center", backgroundColor: colors.secondary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6 },
  cartChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.foreground, maxWidth: 100 },
  checkoutBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  checkoutText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});

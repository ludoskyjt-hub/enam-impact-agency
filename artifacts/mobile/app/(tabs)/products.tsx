import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Platform, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/i18n";
import { POSModal } from "@/components/POSModal";
import {
  useBoutikoGetProducts, useBoutikoCreateProduct, useBoutikoDeleteProduct,
  getBoutikoGetProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

function fmt(n: number) { return new Intl.NumberFormat("fr-FR").format(n) + " F"; }

export default function ProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const P = t.inventory;

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [posProductId, setPosProductId] = useState<number | null>(null);

  const { data: products = [], isLoading, refetch, isRefetching } = useBoutikoGetProducts();
  const deleteProduct = useBoutikoDeleteProduct();

  const filtered = (products as any[]).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const lowStockCount = (products as any[]).filter((p: any) => p.stock <= 5).length;

  const handleDelete = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteProduct.mutate({ id } as any, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getBoutikoGetProductsQueryKey() }),
    });
  };

  const s = makeStyles(colors, insets);

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>{P.title}</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
            {products.length} {products.length > 1 ? P.subtitle_many : P.subtitle_one}
          </Text>
        </View>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAdd(true)}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <View style={[s.alert, { backgroundColor: "#fef2f2", borderColor: "#fecaca" }]}>
          <Feather name="alert-triangle" size={14} color="#ef4444" />
          <Text style={{ color: "#ef4444", fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 }}>
            <Text style={{ fontFamily: "Inter_700Bold" }}>{lowStockCount}</Text> {P.low_stock_alert}
          </Text>
        </View>
      )}

      <View style={s.searchWrap}>
        <Feather name="search" size={16} color={colors.mutedForeground} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={P.search}
          placeholderTextColor={colors.mutedForeground}
        />
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="package" size={40} color={colors.border} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>{P.no_products}</Text>
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>{P.no_products_sub}</Text>
            </View>
          }
          renderItem={({ item }: any) => (
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Top row: icon + badges */}
              <View style={s.cardTop}>
                <View style={[s.productIcon, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="package" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }} />
                {item.stock <= 5 && (
                  <View style={[s.lowStockBadge, { backgroundColor: "#fef2f2", borderColor: "#fecaca" }]}>
                    <Text style={{ color: "#ef4444", fontSize: 10, fontFamily: "Inter_600SemiBold" }}>{P.low_stock_badge}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={s.deleteBtn}>
                  <Feather name="trash-2" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              {/* Name */}
              <Text style={[s.cardName, { color: colors.foreground }]} numberOfLines={2}>{item.name}</Text>
              {item.category ? (
                <View style={[s.categoryBadge, { borderColor: colors.border }]}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, fontFamily: "Inter_500Medium" }}>{item.category}</Text>
                </View>
              ) : null}

              {/* Price / Stock */}
              <View style={[s.cardMeta, { borderTopColor: colors.border }]}>
                <View>
                  <Text style={{ fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 }}>{P.sale_price}</Text>
                  <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: colors.primary, marginTop: 2 }}>
                    {fmt(Number(item.price))}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 }}>{P.stock}</Text>
                  <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: item.stock <= 5 ? "#ef4444" : colors.foreground, marginTop: 2 }}>
                    {item.stock} {item.unit || "pcs"}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={s.cardActions}>
                <TouchableOpacity
                  style={[s.sellBtn, { backgroundColor: item.stock <= 0 ? colors.muted : colors.primary }]}
                  onPress={() => { if (item.stock > 0) setPosProductId(item.id); }}
                  disabled={item.stock <= 0}
                  activeOpacity={0.85}
                >
                  <Feather name="shopping-cart" size={13} color={item.stock <= 0 ? colors.mutedForeground : "#fff"} />
                  <Text style={{ color: item.stock <= 0 ? colors.mutedForeground : "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" }}>{P.sell}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
        />
      )}

      {showAdd && (
        <AddProductModal colors={colors} insets={insets} labels={P} onClose={() => setShowAdd(false)} />
      )}

      <POSModal
        visible={posProductId !== null}
        onClose={() => setPosProductId(null)}
        initialProductId={posProductId ?? undefined}
        insets={insets}
      />
    </View>
  );
}

function AddProductModal({ colors, insets, labels, onClose }: { colors: any; insets: any; labels: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const createProduct = useBoutikoCreateProduct();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("pcs");
  const s = makeStyles(colors, insets);

  const handleSave = () => {
    if (!name.trim() || !price) return;
    createProduct.mutate(
      { data: { name, price: Number(price), costPrice: costPrice ? Number(costPrice) : undefined, stock: Number(stock) || 0, category: category || undefined, unit, active: true } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getBoutikoGetProductsQueryKey() });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onClose();
        },
      }
    );
  };

  return (
    <View style={s.modalOverlay}>
      <ScrollView style={[s.modal, { backgroundColor: colors.card }]} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={s.modalHeader}>
          <Text style={[s.modalTitle, { color: colors.foreground }]}>{labels.new_product}</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={colors.mutedForeground} /></TouchableOpacity>
        </View>
        {[
          { label: labels.field_name, value: name, onChange: setName, placeholder: labels.placeholder_name, keyboardType: "default" as const },
          { label: labels.field_price, value: price, onChange: setPrice, placeholder: labels.placeholder_price, keyboardType: "numeric" as const },
          { label: labels.field_cost, value: costPrice, onChange: setCostPrice, placeholder: "0", keyboardType: "numeric" as const },
          { label: labels.field_stock, value: stock, onChange: setStock, placeholder: "0", keyboardType: "numeric" as const },
          { label: labels.field_category, value: category, onChange: setCategory, placeholder: labels.placeholder_category, keyboardType: "default" as const },
          { label: labels.field_unit, value: unit, onChange: setUnit, placeholder: "pcs", keyboardType: "default" as const },
        ].map((f) => (
          <View key={f.label} style={s.modalField}>
            <Text style={[s.modalLabel, { color: colors.foreground }]}>{f.label}</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              value={f.value}
              onChangeText={f.onChange}
              placeholder={f.placeholder}
              placeholderTextColor={colors.mutedForeground}
              keyboardType={f.keyboardType}
            />
          </View>
        ))}
        <TouchableOpacity
          style={[s.addBtnFull, { backgroundColor: colors.primary, opacity: createProduct.isPending ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={createProduct.isPending}
        >
          {createProduct.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.addBtnText}>{labels.save}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: any, insets: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), paddingHorizontal: 16, paddingBottom: 10 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: colors.foreground },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  alert: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.muted, borderRadius: 12, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  empty: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  card: { flex: 1, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  productIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  lowStockBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, marginLeft: 8 },
  deleteBtn: { padding: 6, marginLeft: 4 },
  cardName: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20, marginBottom: 6 },
  categoryBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 10 },
  cardMeta: { flexDirection: "row", justifyContent: "space-between", paddingTop: 10, marginTop: 8, borderTopWidth: 1 },
  cardActions: { flexDirection: "row", marginTop: 10, gap: 8 },
  sellBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, paddingVertical: 9 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalField: { marginBottom: 14 },
  modalLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular" },
  addBtnFull: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  addBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});

import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/i18n";
import { POSModal } from "@/components/POSModal";
import { useBoutikoGetSales } from "@workspace/api-client-react";

function fmt(n: number) { return new Intl.NumberFormat("fr-FR").format(n) + " F"; }

const PAYMENT_ICONS: Record<string, string> = { cash: "dollar-sign", mobile_money: "smartphone", card: "credit-card", credit: "clock" };

export default function SalesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const S = t.sales;

  const [showPOS, setShowPOS] = useState(false);
  const { data: sales = [], isLoading, refetch, isRefetching } = useBoutikoGetSales();

  const PAYMENT_LABELS: Record<string, string> = {
    cash: S.payment.cash, mobile_money: S.payment.mobile_money,
    card: S.payment.card, credit: S.payment.credit,
  };
  const STATUS_LABELS: Record<string, string> = {
    completed: S.status_completed, pending: S.status_pending, cancelled: S.status_cancelled,
  };

  const totalRevenue = (sales as any[])
    .filter((s: any) => s.status === "completed")
    .reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0);

  const s = makeStyles(colors, insets);

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>{S.title}</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
            {sales.length} {S.subtitle} — {totalRevenue.toLocaleString("fr-FR")} F
          </Text>
        </View>
        <TouchableOpacity style={[s.posBtn, { backgroundColor: colors.primary }]} onPress={() => setShowPOS(true)}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={s.posBtnText}>{S.new_sale}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={sales as any[]}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          scrollEnabled={!!sales.length}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="shopping-cart" size={40} color={colors.border} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>{S.no_sales}</Text>
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>{S.no_sales_sub}</Text>
              <TouchableOpacity style={[s.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => setShowPOS(true)}>
                <Feather name="plus" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" }}>{S.record_sale}</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }: any) => (
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[s.payIcon, { backgroundColor: colors.primary + "18" }]}>
                <Feather name={(PAYMENT_ICONS[item.paymentMethod] ?? "dollar-sign") as any} size={18} color={colors.primary} />
              </View>
              <View style={s.cardInfo}>
                <Text style={[s.cardClient, { color: colors.foreground }]}>{item.clientName ?? S.client_passage}</Text>
                <Text style={[s.cardMeta, { color: colors.mutedForeground }]}>
                  {PAYMENT_LABELS[item.paymentMethod] ?? item.paymentMethod} · {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                </Text>
              </View>
              <View style={s.cardRight}>
                <Text style={[s.cardAmount, { color: colors.primary }]}>{fmt(Number(item.totalAmount))}</Text>
                <View style={[s.statusBadge, {
                  backgroundColor: item.status === "completed" ? "#dcfce7" : item.status === "cancelled" ? "#fef2f2" : colors.muted
                }]}>
                  <Text style={[s.statusText, {
                    color: item.status === "completed" ? "#16a34a" : item.status === "cancelled" ? "#ef4444" : colors.mutedForeground
                  }]}>
                    {STATUS_LABELS[item.status] ?? item.status}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <POSModal visible={showPOS} onClose={() => setShowPOS(false)} insets={insets} />
    </View>
  );
}

const makeStyles = (colors: any, insets: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: colors.foreground },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  posBtn: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, gap: 6 },
  posBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, gap: 12 },
  payIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  cardClient: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardRight: { alignItems: "flex-end", gap: 4 },
  cardAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontFamily: "Inter_500Medium" },
});

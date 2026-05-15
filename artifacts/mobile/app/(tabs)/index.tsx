import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useTranslation, LANG_OPTIONS } from "@/i18n";
import { POSModal } from "@/components/POSModal";
import {
  useBoutikoGetDashboard, useBoutikoGetMe, useBoutikoGetShop,
} from "@workspace/api-client-react";

function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " F";
}

function StatCard({ label, value, sub, iconName, iconBg, iconColor, colors }: {
  label: string; value: React.ReactNode; sub?: string;
  iconName: string; iconBg: string; iconColor: string;
  colors: any;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIconRow]}>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <View style={[styles.statIconBox, { backgroundColor: iconBg }]}>
          <Feather name={iconName as any} size={14} color={iconColor} />
        </View>
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      {sub ? <Text style={[styles.statSub, { color: colors.mutedForeground }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1 },
  statIconRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  statIconBox: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5, flex: 1, marginRight: 4 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 24 },
  statSub: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 3, lineHeight: 14 },
});

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { t, lang, setLang } = useTranslation();
  const D = t.dashboard;

  const { data: user } = useBoutikoGetMe();
  const { data: shop } = useBoutikoGetShop();
  const { data: dashboard, isLoading, refetch, isRefetching } = useBoutikoGetDashboard();
  const [posOpen, setPosOpen] = useState(false);

  const PAYMENT_LABELS: Record<string, string> = {
    cash: t.sales.payment.cash,
    mobile_money: t.sales.payment.mobile_money,
    card: t.sales.payment.card,
    credit: t.sales.payment.credit,
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const s = makeStyles(colors, insets);

  if (isLoading) {
    return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  const shopNameDisplay = (shop?.name || "Ma Boutique").toUpperCase();

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.shopName}>{shopNameDisplay}</Text>
            <Text style={s.userName}>{D.welcome}</Text>
          </View>
          <View style={s.headerRight}>
            <View style={s.langRow}>
              {LANG_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setLang(opt.value)}
                  style={[s.langBtn, lang === opt.value && { backgroundColor: colors.primary }]}
                >
                  <Text style={s.langText}>{opt.flag}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
              <Feather name="log-out" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* "Nouvelle vente" button */}
        <TouchableOpacity style={[s.newSaleBtn, { backgroundColor: colors.primary }]} onPress={() => setPosOpen(true)} activeOpacity={0.85}>
          <Feather name="plus" size={16} color="#fff" />
          <Text style={s.newSaleBtnText}>{D.new_sale}</Text>
        </TouchableOpacity>

        {/* Row 1: Abonnement / Total produits / Clients */}
        <View style={s.statRow}>
          <StatCard
            label={D.stat_sub}
            value="Négoces"
            sub={D.stat_sub_active}
            iconName="shield"
            iconBg={colors.primary + "18"}
            iconColor={colors.primary}
            colors={colors}
          />
          <StatCard
            label={D.stat_products}
            value={String(dashboard?.totalProducts ?? 0)}
            iconName="package"
            iconBg="#eff6ff"
            iconColor="#2563eb"
            colors={colors}
          />
        </View>
        <View style={[s.statRow, { marginBottom: 8 }]}>
          <StatCard
            label={D.stat_clients}
            value={String(dashboard?.totalClients ?? 0)}
            sub={D.stat_clients_sub}
            iconName="users"
            iconBg="#f5f3ff"
            iconColor="#7c3aed"
            colors={colors}
          />
        </View>

        {/* Row 2: CA aujourd'hui / CA semaine / CA mois */}
        <View style={s.statRow}>
          <StatCard
            label={D.stat_today}
            value={fmt(dashboard?.todayRevenue ?? 0)}
            sub={`${dashboard?.todaySales ?? 0} ${D.stat_transactions}`}
            iconName="dollar-sign"
            iconBg="#fffbeb"
            iconColor="#d97706"
            colors={colors}
          />
          <StatCard
            label={D.stat_week}
            value={fmt(dashboard?.todayRevenue ?? 0)}
            sub={`${dashboard?.todaySales ?? 0} ${D.stat_transactions}`}
            iconName="trending-up"
            iconBg="#f0fdf4"
            iconColor="#16a34a"
            colors={colors}
          />
        </View>
        <View style={[s.statRow, { marginBottom: 16 }]}>
          <StatCard
            label={D.stat_month}
            value={fmt(dashboard?.totalRevenue ?? 0)}
            sub={D.last_30_days}
            iconName="calendar"
            iconBg="#fff1f2"
            iconColor="#e11d48"
            colors={colors}
          />
        </View>

        {/* HOUÉFA activity */}
        <View style={[s.section, { marginBottom: 12 }]}>
          <View style={s.sectionHeader}>
            <Feather name="cpu" size={15} color={colors.primary} />
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>HOUÉFA</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/houefa")} style={{ marginLeft: "auto" }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontFamily: "Inter_500Medium" }}>{D.view_all}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <Feather name="cpu" size={28} color={colors.border} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>{D.no_agent_activity}</Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 }}>{D.agent_help}</Text>
          </View>
        </View>

        {/* Inventaire (top products) */}
        <View style={[s.section, { marginBottom: 12 }]}>
          <View style={s.sectionHeader}>
            <Feather name="package" size={15} color={colors.primary} />
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>{D.inventory}</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/products")} style={{ marginLeft: "auto" }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontFamily: "Inter_500Medium" }}>{D.view_all}</Text>
            </TouchableOpacity>
          </View>
          {!dashboard?.topProducts?.length ? (
            <View style={s.emptyRow}>
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>{D.no_products}</Text>
            </View>
          ) : (
            (dashboard.topProducts as any[]).slice(0, 5).map((p: any, i: number) => (
              <View key={p.productId ?? i} style={[s.listRow, { borderTopColor: colors.border }]}>
                <View style={[s.listIconBox, { backgroundColor: colors.muted }]}>
                  <Feather name="package" size={14} color={colors.mutedForeground} />
                </View>
                <Text style={[s.listTitle, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>{p.productName}</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primary }}>
                    {Number(p.revenue || 0).toLocaleString("fr-FR")} F
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                    {p.totalSold} {D.sold}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Ventes récentes */}
        <View style={[s.section, { marginBottom: 12 }]}>
          <View style={s.sectionHeader}>
            <Feather name="shopping-cart" size={15} color={colors.primary} />
            <Text style={[s.sectionTitle, { color: colors.foreground }]}>{D.recent_sales}</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/sales")} style={{ marginLeft: "auto" }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontFamily: "Inter_500Medium" }}>{D.view_all}</Text>
            </TouchableOpacity>
          </View>
          {!dashboard?.recentSales?.length ? (
            <View style={s.emptyRow}>
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>{D.no_sales}</Text>
            </View>
          ) : (
            (dashboard.recentSales as any[]).slice(0, 5).map((sale: any) => (
              <View key={sale.id} style={[s.listRow, { borderTopColor: colors.border }]}>
                <View style={[s.listIconBox, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="shopping-cart" size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.listTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {sale.clientName || D.client_passage}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                    {PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primary }}>
                  {Number(sale.totalAmount).toLocaleString("fr-FR")} F
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <POSModal visible={posOpen} onClose={() => setPosOpen(false)} insets={insets} />
    </View>
  );
}

const makeStyles = (colors: any, insets: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  headerRight: { alignItems: "flex-end", gap: 8 },
  langRow: { flexDirection: "row", gap: 4 },
  langBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
  langText: { fontSize: 14 },
  shopName: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground, letterSpacing: 0.5 },
  userName: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 },
  logoutBtn: { padding: 8, borderRadius: 10, backgroundColor: colors.muted },
  newSaleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 13, marginBottom: 16, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  newSaleBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  statRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  section: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  listRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, gap: 10 },
  listIconBox: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  listTitle: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyRow: { paddingVertical: 16, alignItems: "center" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});

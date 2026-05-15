import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Modal, Platform, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useTranslation } from "@/i18n";
import { POSModal } from "@/components/POSModal";
import { useBoutikoGetClients, useBoutikoCreateClient } from "@workspace/api-client-react";
import { getBoutikoGetClientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

function fmt(n: number) { return new Intl.NumberFormat("fr-FR").format(n) + " F"; }

export default function ClientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const C = t.customers;

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [posClientId, setPosClientId] = useState<number | null>(null);
  const { data: clients = [], isLoading, refetch, isRefetching } = useBoutikoGetClients();

  const filtered = (clients as any[]).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? "").includes(search)
  );

  const s = makeStyles(colors, insets);

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>{C.title}</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
            {clients.length} {clients.length > 1 ? C.subtitle_many : C.subtitle_one}
          </Text>
        </View>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAdd(true)}>
          <Feather name="user-plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <Feather name="search" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch} placeholder={C.search} placeholderTextColor={colors.mutedForeground} />
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          scrollEnabled={!!filtered.length}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="users" size={40} color={colors.border} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>{C.no_customers}</Text>
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>{C.no_customers_sub}</Text>
            </View>
          }
          renderItem={({ item }: any) => (
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.cardTop}>
                <View style={[s.avatar, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[s.avatarText, { color: colors.primary }]}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={[s.cardName, { color: colors.foreground }]}>{item.name}</Text>
                  {item.phone ? (
                    <View style={s.cardRow}>
                      <Feather name="phone" size={11} color={colors.mutedForeground} />
                      <Text style={[s.cardMeta, { color: colors.mutedForeground }]}>{item.phone}</Text>
                    </View>
                  ) : null}
                  {item.email ? (
                    <View style={s.cardRow}>
                      <Feather name="mail" size={11} color={colors.mutedForeground} />
                      <Text style={[s.cardMeta, { color: colors.mutedForeground }]} numberOfLines={1}>{item.email}</Text>
                    </View>
                  ) : null}
                  {item.address ? (
                    <View style={s.cardRow}>
                      <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                      <Text style={[s.cardMeta, { color: colors.mutedForeground }]} numberOfLines={1}>{item.address}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={[s.cardFooter, { borderTopColor: colors.border }]}>
                <View>
                  <Text style={{ fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 }}>{C.total_purchases}</Text>
                  <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: colors.primary, marginTop: 2 }}>
                    {fmt(Number(item.totalPurchases || 0))}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[s.saleBtn, { borderColor: colors.border }]}
                  onPress={() => setPosClientId(item.id)}
                >
                  <Feather name="shopping-cart" size={13} color={colors.foreground} />
                  <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.foreground }}>{C.sale_btn}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={showAdd} animationType="slide" presentationStyle="formSheet">
        <AddClientModal colors={colors} insets={insets} labels={C} onClose={() => setShowAdd(false)} />
      </Modal>

      <POSModal
        visible={posClientId !== null}
        onClose={() => setPosClientId(null)}
        initialClientId={posClientId ?? undefined}
        insets={insets}
      />
    </View>
  );
}

function AddClientModal({ colors, insets, labels, onClose }: any) {
  const queryClient = useQueryClient();
  const createClient = useBoutikoCreateClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    createClient.mutate({ data: { name, phone: phone || undefined, email: email || undefined, address: address || undefined } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getBoutikoGetClientsQueryKey() });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      },
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 24, paddingTop: insets.top + 24 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <Text style={{ fontSize: 20, fontFamily: "Inter_700Bold", color: colors.foreground }}>{labels.new_customer}</Text>
        <TouchableOpacity onPress={onClose}><Feather name="x" size={24} color={colors.mutedForeground} /></TouchableOpacity>
      </View>
      {[
        { label: labels.field_name, value: name, onChange: setName, placeholder: labels.placeholder_name, autoCapitalize: "words" as const },
        { label: labels.field_phone, value: phone, onChange: setPhone, placeholder: "+229 90 000 000", keyboardType: "phone-pad" as const },
        { label: labels.field_email, value: email, onChange: setEmail, placeholder: "client@email.com", keyboardType: "email-address" as const, autoCapitalize: "none" as const },
        { label: labels.field_address, value: address, onChange: setAddress, placeholder: "Ex : Cotonou, Akpakpa", autoCapitalize: "sentences" as const },
      ].map((f) => (
        <View key={f.label} style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground, marginBottom: 6 }}>{f.label}</Text>
          <TextInput
            style={{ backgroundColor: colors.muted, borderRadius: 10, padding: 12, fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" }}
            value={f.value}
            onChangeText={f.onChange}
            placeholder={f.placeholder}
            placeholderTextColor={colors.mutedForeground}
            keyboardType={f.keyboardType}
            autoCapitalize={f.autoCapitalize}
          />
        </View>
      ))}
      <TouchableOpacity
        style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
        onPress={handleSave}
        disabled={createClient.isPending}
      >
        {createClient.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" }}>{labels.save}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const makeStyles = (colors: any, insets: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: colors.foreground },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.muted, borderRadius: 12, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  empty: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardTop: { flexDirection: "row", gap: 14, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  cardMeta: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1 },
  saleBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
});

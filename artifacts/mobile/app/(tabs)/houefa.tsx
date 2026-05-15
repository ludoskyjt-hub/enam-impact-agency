import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Platform, KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useTranslation, LANG_OPTIONS } from "@/i18n";
import {
  useBoutikoGetShop, useBoutikoGetMe, useBoutikoUpdateShop,
  getBoutikoGetShopQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "chat" | "reports" | "activity" | "settings";
type Message = { id: number; role: "user" | "assistant"; text: string };

let msgId = 1;
const MOCK_REPLY = "Je suis HOUÉFA, votre assistante IA. Je fonctionne en mode démo. Bientôt connectée à vos vraies données boutique !";

export default function HouefaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, lang, setLang } = useTranslation();
  const H = t.houefa;

  const [tab, setTab] = useState<Tab>("chat");
  const [messages, setMessages] = useState<Message[]>([
    { id: msgId++, role: "assistant", text: H.welcome },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim() || thinking) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages(prev => [...prev, { id: msgId++, role: "user", text }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: msgId++, role: "assistant", text: MOCK_REPLY }]);
      setThinking(false);
    }, 1200);
  };

  const CHIPS = [H.chip1, H.chip2, H.chip3, H.chip4];
  const TABS: { key: Tab; icon: string; label: string }[] = [
    { key: "chat", icon: "message-circle", label: H.tab_chat },
    { key: "reports", icon: "file-text", label: H.tab_reports },
    { key: "activity", icon: "activity", label: H.tab_activity },
    { key: "settings", icon: "settings", label: H.tab_settings },
  ];

  const s = makeStyles(colors, insets);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <View style={[s.headerIcon, { backgroundColor: colors.primary }]}>
          <Feather name="cpu" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.foreground }]}>{H.full_title}</Text>
          <Text style={[s.headerSub, { color: colors.mutedForeground }]}>{H.tagline}</Text>
        </View>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[s.tabBar, { borderBottomColor: colors.border }]} contentContainerStyle={s.tabBarContent}>
        {TABS.map(({ key, icon, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setTab(key)}
            style={[s.tabBtn, tab === key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Feather name={icon as any} size={14} color={tab === key ? colors.primary : colors.mutedForeground} />
            <Text style={[s.tabLabel, { color: tab === key ? colors.primary : colors.mutedForeground }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chat */}
      {tab === "chat" && (
        <>
          <View style={[s.chatHeader, { borderBottomColor: colors.border }]}>
            <View style={[s.chatIcon, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="cpu" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.chatTitle, { color: colors.foreground }]}>{H.chat_header}</Text>
              <Text style={[s.chatSub, { color: colors.mutedForeground }]}>{H.chat_sub}</Text>
            </View>
          </View>

          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={[s.messages, { flexGrow: 1 }]} showsVerticalScrollIndicator={false}>
            {messages.length === 1 && (
              <View style={s.welcomeBlock}>
                <View style={[s.botAvatar, { backgroundColor: colors.primary }]}>
                  <Feather name="cpu" size={28} color="#fff" />
                </View>
                <Text style={[s.welcomeText, { color: colors.mutedForeground }]}>{messages[0].text}</Text>
              </View>
            )}
            {messages.length > 1 && messages.map(msg => (
              <View key={msg.id} style={[s.msgRow, msg.role === "user" ? s.msgRowUser : s.msgRowBot]}>
                {msg.role === "assistant" && (
                  <View style={[s.msgAvatar, { backgroundColor: colors.primary }]}>
                    <Feather name="cpu" size={12} color="#fff" />
                  </View>
                )}
                <View style={[s.msgBubble, msg.role === "user"
                  ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                  : { backgroundColor: colors.muted, borderBottomLeftRadius: 4 }
                ]}>
                  <Text style={[s.msgText, { color: msg.role === "user" ? "#fff" : colors.foreground }]}>{msg.text}</Text>
                </View>
              </View>
            ))}
            {thinking && (
              <View style={s.msgRowBot}>
                <View style={[s.msgAvatar, { backgroundColor: colors.primary }]}>
                  <Feather name="cpu" size={12} color="#fff" />
                </View>
                <View style={[s.msgBubble, { backgroundColor: colors.muted }]}>
                  <ActivityIndicator size="small" color={colors.mutedForeground} />
                  <Text style={[s.msgText, { color: colors.mutedForeground, marginLeft: 8 }]}>{H.thinking}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {messages.length === 1 && (
            <View style={s.chips}>
              {CHIPS.map(chip => (
                <TouchableOpacity key={chip} style={[s.chip, { borderColor: colors.border }]} onPress={() => sendMessage(chip)}>
                  <Feather name="zap" size={12} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[s.chipText, { color: colors.foreground }]} numberOfLines={2}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={[s.inputRow, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border }]}>
            <TextInput
              style={[s.input, { backgroundColor: colors.muted, color: colors.foreground }]}
              value={input}
              onChangeText={setInput}
              placeholder={H.placeholder}
              placeholderTextColor={colors.mutedForeground}
              onSubmitEditing={() => sendMessage(input)}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[s.sendBtn, { backgroundColor: input.trim() && !thinking ? colors.primary : colors.muted }]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || thinking}
            >
              <Feather name="send" size={18} color={input.trim() && !thinking ? "#fff" : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {tab === "reports" && (
        <View style={s.emptyTab}>
          <Feather name="file-text" size={48} color={colors.border} />
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>{H.tab_reports}</Text>
          <Text style={[s.emptyText, { color: colors.mutedForeground }]}>{H.no_reports}</Text>
        </View>
      )}

      {tab === "activity" && (
        <View style={s.emptyTab}>
          <Feather name="activity" size={48} color={colors.border} />
          <Text style={[s.emptyTitle, { color: colors.foreground }]}>{H.tab_activity}</Text>
          <Text style={[s.emptyText, { color: colors.mutedForeground }]}>{H.no_activity}</Text>
        </View>
      )}

      {tab === "settings" && (
        <SettingsTab colors={colors} insets={insets} />
      )}
    </KeyboardAvoidingView>
  );
}

function SettingsTab({ colors, insets }: { colors: any; insets: any }) {
  const { t, lang, setLang } = useTranslation();
  const S = t.settings;
  const { data: me } = useBoutikoGetMe();
  const { data: shop } = useBoutikoGetShop();
  const updateShop = useBoutikoUpdateShop();
  const queryClient = useQueryClient();

  const [shopName, setShopName] = useState(shop?.name || "");
  const [description, setDescription] = useState(shop?.description || "");
  const [currency, setCurrency] = useState(shop?.currency || "XOF");
  const [country, setCountry] = useState(shop?.country || "BJ");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (shop) {
      setShopName(shop.name || "");
      setDescription(shop.description || "");
      setCurrency(shop.currency || "XOF");
      setCountry(shop.country || "BJ");
    }
  }, [shop]);

  const handleSave = () => {
    updateShop.mutate({ data: { name: shopName, description, currency, country } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getBoutikoGetShopQueryKey() });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      },
    });
  };

  const s = makeStyles(colors, insets);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
      <Text style={[s.settingsTitle, { color: colors.foreground }]}>{S.title}</Text>
      <Text style={[s.settingsSub, { color: colors.mutedForeground }]}>{S.subtitle}</Text>

      {/* Account */}
      <View style={[s.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[s.cardSectionTitle, { color: colors.foreground }]}>
          <Feather name="info" size={14} color={colors.primary} />{"  "}{S.account}
        </Text>
        <View style={s.settingsRow}>
          <Text style={[s.settingsLabel, { color: colors.mutedForeground }]}>{S.name_label}</Text>
          <Text style={[s.settingsValue, { color: colors.foreground }]}>{me?.name || "—"}</Text>
        </View>
        <View style={s.settingsRow}>
          <Text style={[s.settingsLabel, { color: colors.mutedForeground }]}>{S.email_label}</Text>
          <Text style={[s.settingsValue, { color: colors.foreground }]}>{me?.email || "—"}</Text>
        </View>
      </View>

      {/* Shop profile */}
      <View style={[s.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[s.cardSectionTitle, { color: colors.foreground }]}>
          <Feather name="shopping-bag" size={14} color={colors.primary} />{"  "}{S.shop_profile}
        </Text>
        <Text style={[s.cardSectionDesc, { color: colors.mutedForeground }]}>{S.shop_profile_desc}</Text>
        {[
          { label: S.field_shop_name, value: shopName, onChange: setShopName, placeholder: S.placeholder_shop_name },
          { label: S.field_description, value: description, onChange: setDescription, placeholder: S.placeholder_description },
          { label: S.field_currency, value: currency, onChange: setCurrency, placeholder: "XOF" },
          { label: S.field_country, value: country, onChange: setCountry, placeholder: "BJ" },
        ].map(f => (
          <View key={f.label} style={{ marginBottom: 14 }}>
            <Text style={[s.settingsLabel, { color: colors.foreground, marginBottom: 6 }]}>{f.label}</Text>
            <TextInput
              style={[s.settingsInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              value={f.value}
              onChangeText={f.onChange}
              placeholder={f.placeholder}
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        ))}
        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: colors.primary, opacity: updateShop.isPending ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={updateShop.isPending}
        >
          {updateShop.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnText}>{saved ? S.saved + " ✓" : S.save}</Text>}
        </TouchableOpacity>
      </View>

      {/* Language */}
      <View style={[s.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[s.cardSectionTitle, { color: colors.foreground }]}>
          <Feather name="globe" size={14} color={colors.primary} />{"  "}{S.language}
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
          {LANG_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setLang(opt.value)}
              style={[s.langBtn, { backgroundColor: lang === opt.value ? colors.primary : colors.muted }]}
            >
              <Text style={[s.langBtnText, { color: lang === opt.value ? "#fff" : colors.mutedForeground }]}>
                {opt.flag} {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: any, insets: any) => StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  tabBar: { borderBottomWidth: 1, flexGrow: 0 },
  tabBarContent: { paddingHorizontal: 8 },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  chatIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  chatTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  chatSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  messages: { padding: 16, gap: 12 },
  welcomeBlock: { alignItems: "center", justifyContent: "center", flex: 1, paddingVertical: 32, gap: 16 },
  botAvatar: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  welcomeText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, maxWidth: 280 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "85%" },
  msgRowUser: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  msgRowBot: { alignSelf: "flex-start" },
  msgAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  msgBubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", flexShrink: 1 },
  msgText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  chips: { paddingHorizontal: 12, paddingBottom: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, maxWidth: "48%" },
  chipText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 16 },
  inputRow: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 8, gap: 8, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular" },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  emptyTab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  settingsTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  settingsSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 16 },
  settingsCard: { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1 },
  cardSectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  cardSectionDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 12 },
  settingsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  settingsLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.4 },
  settingsValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  settingsInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  langBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  langBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useBoutikoLogin, useBoutikoRegister } from "@workspace/api-client-react";
import { useTranslation, LANG_OPTIONS } from "@/i18n";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setToken } = useAuth();
  const { t, lang, setLang } = useTranslation();
  const L = t.login;

  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useBoutikoLogin();
  const registerMutation = useBoutikoRegister();
  const isPending = loginMutation.isPending || registerMutation.isPending;

  const styles = makeStyles(colors, insets);

  const handleSubmit = async () => {
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (tab === "login") {
        const res = await loginMutation.mutateAsync({ data: { email, password } });
        await setToken(res.token);
      } else {
        if (!name.trim()) { setError(L.error_name); return; }
        const res = await registerMutation.mutateAsync({ data: { email, password, name } });
        await setToken(res.token);
      }
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.message || L.error_default);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Lang switcher */}
        <View style={styles.langRow}>
          {LANG_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setLang(opt.value)}
              style={[styles.langBtn, lang === opt.value && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.langText, lang === opt.value && { color: "#fff" }]}>
                {opt.flag} {opt.value.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>🛍️</Text>
          </View>
          <Text style={styles.brand}>Boutiko</Text>
          <Text style={styles.tagline}>{L.brand_tagline}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabs}>
            {(["login", "register"] as const).map((tabKey) => (
              <TouchableOpacity key={tabKey} style={[styles.tabBtn, tab === tabKey && styles.tabBtnActive]} onPress={() => { setTab(tabKey); setError(""); }}>
                <Text style={[styles.tabText, tab === tabKey && styles.tabTextActive]}>
                  {tabKey === "login" ? L.tab_login : L.tab_register}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === "register" && (
            <View style={styles.field}>
              <Text style={styles.label}>{L.name}</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={L.placeholder_name} placeholderTextColor={colors.mutedForeground} autoCapitalize="words" />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>{L.email}</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder={L.placeholder_email} placeholderTextColor={colors.mutedForeground} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{L.password}</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={colors.mutedForeground} secureTextEntry />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={[styles.submitBtn, isPending && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={isPending} activeOpacity={0.85}>
            {isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>{tab === "login" ? L.submit_login : L.submit_register}</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>{L.footer}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: any, insets: any) => StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
  langRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  langBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: colors.muted },
  langText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
  header: { alignItems: "center", marginBottom: 32 },
  logoBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 16, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  logoText: { fontSize: 32 },
  brand: { fontSize: 32, fontFamily: "Inter_700Bold", color: colors.foreground },
  tagline: { fontSize: 14, color: colors.mutedForeground, marginTop: 6, fontFamily: "Inter_400Regular" },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4, borderWidth: 1, borderColor: colors.border },
  tabs: { flexDirection: "row", backgroundColor: colors.muted, borderRadius: 10, padding: 4, marginBottom: 24 },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 8 },
  tabBtnActive: { backgroundColor: colors.card, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
  tabTextActive: { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground, marginBottom: 6 },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" },
  error: { color: colors.destructive, fontSize: 13, marginBottom: 12, fontFamily: "Inter_400Regular" },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  footer: { textAlign: "center", color: colors.mutedForeground, fontSize: 12, marginTop: 24, fontFamily: "Inter_400Regular" },
});

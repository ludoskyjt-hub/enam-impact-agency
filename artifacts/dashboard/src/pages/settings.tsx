import { useState, useEffect } from "react";
import { useUpdateProfile, useGetDgiSettings, useUpdateDgiSettings } from "@workspace/api-client-react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, Lock, Loader2, Settings, Fingerprint, ShieldCheck, ShieldOff, Tag, X, Bell, Globe, Landmark, CheckCircle2, AlertCircle } from "lucide-react";
import { CEDEAO_CURRENCIES } from "@/lib/currencies";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useBiometricSupport,
  useBiometricRegister,
  useBiometricDelete,
  fetchBiometricStatus,
  type BiometricCredentialInfo,
} from "@/hooks/use-biometric";

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const updateProfile = useUpdateProfile();

  const [company, setCompany] = useState(user?.companyName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const token = getToken();
  const canManageCats = user?.role === "admin" || user?.role === "accountant";
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#16a34a");

  const catHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const notifHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const { data: notifSettings } = useQuery<{ emailNotificationsEnabled: boolean }>({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/settings", { headers: notifHeaders });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!token,
  });

  const notifMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: notifHeaders,
        body: JSON.stringify({ emailNotificationsEnabled: enabled }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
      toast({ description: t.settings.emailNotifSaved });
    },
  });

  const { data: categories = [], refetch: refetchCats } = useQuery<{ id: number; name: string; color: string; isDefault: boolean }[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories", { headers: catHeaders });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    enabled: canManageCats,
  });

  const addCatMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/categories", { method: "POST", headers: catHeaders, body: JSON.stringify({ name: newCatName, color: newCatColor }) });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: () => { refetchCats(); setNewCatName(""); toast({ title: t.settings.categoryAdded }); },
  });

  const deleteCatMut = useMutation({
    mutationFn: async (id: number) => { await fetch(`/api/categories/${id}`, { method: "DELETE", headers: catHeaders }); },
    onSuccess: () => { refetchCats(); toast({ title: t.settings.categoryRemoved }); },
  });

  const resetCatMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/categories/reset", { method: "POST", headers: catHeaders });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: () => { refetchCats(); toast({ title: t.settings.resetDone }); },
  });

  const { data: dgiSettings, refetch: refetchDgi } = useGetDgiSettings({
    query: { queryKey: ["dgi-settings"] },
  } as any);
  const updateDgi = useUpdateDgiSettings();

  const [dgiToken, setDgiToken] = useState("");
  const [dgiSecret, setDgiSecret] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("XOF");

  useEffect(() => {
    if (dgiSettings) {
      setDefaultCurrency((dgiSettings as any).defaultCurrency ?? "XOF");
    }
  }, [dgiSettings]);

  const handleDgiSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateDgi.mutate(
      { data: { dgiToken: dgiToken || undefined, dgiSecret: dgiSecret || undefined } },
      {
        onSuccess: () => {
          refetchDgi();
          toast({ title: t.settings.dgiSaved });
          setDgiToken("");
          setDgiSecret("");
        },
        onError: () => toast({ title: t.common.error, variant: "destructive" }),
      }
    );
  };

  const handleCurrencySave = () => {
    updateDgi.mutate(
      { data: { defaultCurrency } },
      {
        onSuccess: () => {
          refetchDgi();
          toast({ title: t.settings.currencySaved });
        },
        onError: () => toast({ title: t.common.error, variant: "destructive" }),
      }
    );
  };

  const { available: biometricAvailable, supported: biometricSupported, isHttps } = useBiometricSupport();
  const { register: biometricRegister, loading: registerLoading } = useBiometricRegister();
  const { remove: biometricRemove, loading: removeLoading } = useBiometricDelete();
  const [biometricStatus, setBiometricStatus] = useState<BiometricCredentialInfo | null>(null);
  const [biometricStatusLoading, setBiometricStatusLoading] = useState(false);

  useEffect(() => {
    if (biometricAvailable) {
      setBiometricStatusLoading(true);
      fetchBiometricStatus()
        .then(setBiometricStatus)
        .catch(() => setBiometricStatus(null))
        .finally(() => setBiometricStatusLoading(false));
    }
  }, [biometricAvailable]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      { data: { companyName: company, email, phone } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getMe"] });
          toast({ title: t.settings.profileSaved });
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "";
          if (msg.includes("Email already")) {
            toast({ title: t.settings.emailInUse, variant: "destructive" });
          } else {
            toast({ title: t.common.error, variant: "destructive" });
          }
        },
      }
    );
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: t.settings.passwordMismatch, variant: "destructive" });
      return;
    }
    updateProfile.mutate(
      { data: { currentPassword, newPassword } },
      {
        onSuccess: () => {
          toast({ title: t.settings.passwordSaved });
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "";
          if (msg.includes("incorrect")) {
            toast({ title: t.settings.wrongPassword, variant: "destructive" });
          } else {
            toast({ title: t.common.error, variant: "destructive" });
          }
        },
      }
    );
  };

  const handleBiometricActivate = async () => {
    const ok = await biometricRegister();
    if (ok) {
      toast({ title: t.webauthn.activated });
      const status = await fetchBiometricStatus();
      setBiometricStatus(status);
    } else {
      toast({ title: t.webauthn.activateError, variant: "destructive" });
    }
  };

  const handleBiometricDelete = async () => {
    const ok = await biometricRemove();
    if (ok) {
      toast({ title: t.webauthn.deleted });
      setBiometricStatus({ registered: false, count: 0, devices: [] });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.settings.title}</h1>
          <p className="text-muted-foreground text-sm">{t.settings.subtitle}</p>
        </div>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            {t.settings.sectionProfile}
          </CardTitle>
          <CardDescription className="text-xs">
            IFU : <span className="font-mono font-medium">{user?.ifu}</span>
            {" · "}
            {user?.country}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">{t.settings.company}</Label>
              <Input
                id="company"
                value={company}
                onChange={e => setCompany(e.target.value)}
                required
                minLength={2}
                data-testid="input-company"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.settings.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t.settings.phone}</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+229 97 00 00 00"
                  data-testid="input-phone"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={updateProfile.isPending}
              data-testid="button-save-profile"
            >
              {updateProfile.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t.settings.saving}</>
                : t.settings.saveProfile}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            {t.settings.sectionPassword}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t.settings.currentPassword}</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                data-testid="input-current-password"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t.settings.newPassword}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t.settings.confirmPassword}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  data-testid="input-confirm-password"
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={updateProfile.isPending}
              data-testid="button-save-password"
            >
              {updateProfile.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t.settings.saving}</>
                : t.settings.changePassword}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Biometric Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-primary" />
            {t.webauthn.sectionTitle}
          </CardTitle>
          <CardDescription className="text-xs">{t.webauthn.sectionDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {!biometricSupported && (
            <p className="text-sm text-muted-foreground">{t.webauthn.notSupported}</p>
          )}
          {biometricSupported && !isHttps && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <ShieldOff className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">{t.webauthn.httpsWarning}</p>
            </div>
          )}
          {biometricAvailable && (
            <div className="space-y-4">
              {biometricStatusLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.common.loading}
                </div>
              ) : biometricStatus?.registered ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">{t.webauthn.registered}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {biometricStatus.count} {t.webauthn.deviceCount}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {biometricStatus.devices.map(d => (
                      <div key={d.id} className="text-xs text-muted-foreground flex items-center gap-2">
                        <Fingerprint className="w-3 h-3" />
                        {d.deviceType ?? "platform"} — {new Date(d.createdAt).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={handleBiometricDelete}
                    disabled={removeLoading}
                    data-testid="button-disable-biometric"
                  >
                    {removeLoading
                      ? <><Loader2 className="w-3 h-3 animate-spin mr-2" />{t.webauthn.deleting}</>
                      : <><ShieldOff className="w-3 h-3 mr-2" />{t.webauthn.deleteBtn}</>
                    }
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t.webauthn.notRegistered}</p>
                  <Button
                    onClick={handleBiometricActivate}
                    disabled={registerLoading}
                    className="gap-2"
                    data-testid="button-enable-biometric"
                  >
                    {registerLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" />{t.webauthn.activating}</>
                      : <><Fingerprint className="w-4 h-4" />{t.webauthn.activateBtn}</>
                    }
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {canManageCats && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                {t.settings.categoriesTitle}
              </CardTitle>
              <CardDescription className="text-xs">{t.settings.categoriesDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.settings.noCategoriesDesc}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <span key={cat.id} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                      <button
                        className="text-muted-foreground hover:text-destructive ml-0.5 transition-colors"
                        onClick={() => deleteCatMut.mutate(cat.id)}
                        disabled={deleteCatMut.isPending}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={newCatColor}
                  onChange={e => setNewCatColor(e.target.value)}
                  className="h-9 w-9 rounded border cursor-pointer p-0.5 shrink-0"
                  title={t.settings.categoryColor}
                />
                <Input
                  placeholder={t.settings.categoryName}
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && newCatName.trim()) addCatMut.mutate(); }}
                  className="flex-1"
                />
                <Button
                  onClick={() => addCatMut.mutate()}
                  disabled={!newCatName.trim() || addCatMut.isPending}
                >
                  {addCatMut.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t.settings.categoryAdding}</>
                    : t.settings.categoryAdd}
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => resetCatMut.mutate()}
                disabled={resetCatMut.isPending}
              >
                {resetCatMut.isPending ? t.settings.resetting : t.settings.resetDefaults}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Default currency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="w-4 h-4 text-primary" />
            {t.settings.sectionCurrency}
          </CardTitle>
          <CardDescription className="text-xs">{t.settings.sectionCurrencyDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.settings.currencyLabel}</Label>
            <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CEDEAO_CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-mono font-medium mr-2">{c.code}</span>
                    <span className="text-muted-foreground">{c.name} ({c.symbol})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCurrencySave} disabled={updateDgi.isPending} className="gap-2">
            {updateDgi.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {t.settings.currencySave}
          </Button>
        </CardContent>
      </Card>

      {/* DGI e-MECeF settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark className="w-4 h-4 text-primary" />
            {t.settings.sectionDgi}
          </CardTitle>
          <CardDescription className="text-xs">{t.settings.sectionDgiDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dgiSettings ? (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              (dgiSettings as any).configured
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}>
              {(dgiSettings as any).configured
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertCircle className="w-4 h-4 shrink-0" />}
              <div>
                <p className="font-medium">
                  {(dgiSettings as any).configured ? t.settings.dgiModeReal : t.settings.dgiModeSimulation}
                </p>
                {!(dgiSettings as any).configured && (
                  <p className="text-xs mt-0.5">{t.settings.dgiModeSimulationDesc}</p>
                )}
              </div>
            </div>
          ) : null}
          <form onSubmit={handleDgiSave} className="space-y-4">
            <div className="space-y-2">
              <Label>{t.settings.dgiToken}</Label>
              <Input
                type="password"
                value={dgiToken}
                onChange={e => setDgiToken(e.target.value)}
                placeholder={t.settings.dgiTokenPlaceholder}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.settings.dgiSecret}</Label>
              <Input
                type="password"
                value={dgiSecret}
                onChange={e => setDgiSecret(e.target.value)}
                placeholder={t.settings.dgiSecretPlaceholder}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">{t.settings.dgiClearHint}</p>
            </div>
            <Button type="submit" disabled={updateDgi.isPending} className="gap-2">
              {updateDgi.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" />{t.settings.dgiSaving}</>
                : <><Landmark className="w-4 h-4" />{t.settings.dgiSave}</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Email notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-4 h-4 text-primary" />
            {t.settings.sectionNotifications}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t.settings.emailNotifTitle}</p>
              <p className="text-sm text-muted-foreground">{t.settings.emailNotifDesc}</p>
            </div>
            <button
              onClick={() => notifMutation.mutate(!(notifSettings?.emailNotificationsEnabled ?? false))}
              disabled={notifMutation.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                notifSettings?.emailNotificationsEnabled ? "bg-primary" : "bg-input"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  notifSettings?.emailNotificationsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {notifSettings?.emailNotificationsEnabled ? t.settings.emailNotifEnabled : t.settings.emailNotifDisabled}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

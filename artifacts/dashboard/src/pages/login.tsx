import { useState } from "react";
import { Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import beninMap from "@/assets/benin-flag-map-nobg.png";
import { useI18n, LANG_META, type Lang } from "@/lib/i18n";
import { useBiometricLogin, useBiometricSupport } from "@/hooks/use-biometric";
import { Fingerprint, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default function Login() {
  const { toast } = useToast();
  const loginMutation = useLogin();
  const { t, lang, setLang } = useI18n();
  const { available: biometricAvailable } = useBiometricSupport();
  const { login: biometricLogin, loading: biometricLoading } = useBiometricLogin();
  const [biometricEmail, setBiometricEmail] = useState("");
  const [showBiometricInput, setShowBiometricInput] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        setToken(res.token);
        window.location.href = import.meta.env.BASE_URL;
      },
      onError: () => {
        toast({ title: t.login.error, variant: "destructive" });
      }
    });
  };

  const handleBiometricLogin = async () => {
    const email = biometricEmail || form.getValues("email");
    if (!email) {
      setShowBiometricInput(true);
      return;
    }
    const ok = await biometricLogin(email);
    if (ok) {
      window.location.href = import.meta.env.BASE_URL;
    } else {
      toast({ title: t.webauthn.loginError, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(224 50% 10%)" }}>
      {/* Left panel — decorative, hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12" style={{ background: "hsl(224 55% 8%)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <img src="/enam-impact-logo.png" alt="Enam Impact Agency" className="h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <img src={beninMap} alt="Logo" className="w-10 h-10 object-contain drop-shadow-lg" />
            <span className="font-bold text-xl">
              <span className="text-yellow-400">Bénin</span>
              <span className="text-white">Expense</span>
            </span>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Gérez vos dépenses<br />
              <span className="text-yellow-400">avec intelligence</span>
            </h1>
            <p className="mt-4 text-white/50 text-sm leading-relaxed">
              Plateforme B2B de gestion des dépenses et de conformité fiscale pour les PME béninoises.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: "✦", text: "Saisie IA en langue naturelle" },
              { icon: "✦", text: "Normalisation DGI e-MECeF" },
              { icon: "✦", text: "Rapports en temps réel" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-yellow-400 text-xs">{item.icon}</span>
                <span className="text-white/60 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs">© 2026 BéninExpense AI · Conforme DGI Bénin</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        {/* Lang switcher */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          {(["fr", "en", "pt"] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-2 py-1 rounded text-sm font-medium transition-all ${
                lang === l
                  ? "bg-yellow-400/20 text-yellow-300 ring-1 ring-yellow-400/40"
                  : "text-white/40 hover:text-white/70"
              }`}>
              {LANG_META[l].flag}
            </button>
          ))}
        </div>

        <div className="w-full max-w-sm">
          {/* Logo — mobile only */}
          <div className="flex lg:hidden flex-col items-center mb-8">
            <img src={beninMap} alt="Logo" className="w-16 h-16 object-contain drop-shadow-lg mb-2" />
            <span className="font-bold text-2xl">
              <span className="text-yellow-400">Bénin</span>
              <span className="text-white">Expense</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">{t.login.title}</h2>
            <p className="mt-1 text-white/45 text-sm">{t.login.subtitle ?? "Accédez à votre tableau de bord"}</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-6 space-y-5" style={{ background: "hsl(224 45% 14%)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 text-sm">{t.login.email}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin@company.bj"
                          {...field}
                          data-testid="input-email"
                          className="bg-white/6 border-white/12 text-white placeholder:text-white/25 focus-visible:ring-yellow-400/40 focus-visible:border-yellow-400/40"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 text-sm">{t.login.password}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          data-testid="input-password"
                          className="bg-white/6 border-white/12 text-white placeholder:text-white/25 focus-visible:ring-yellow-400/40 focus-visible:border-yellow-400/40"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold bg-yellow-400 hover:bg-yellow-300 text-[hsl(224,50%,10%)]"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? t.login.submitting : t.login.submit}
                </Button>
              </form>
            </Form>

            {biometricAvailable && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-white/30 uppercase tracking-wider">{t.webauthn.orSeparator}</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {showBiometricInput && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">{t.login.email}</label>
                    <Input
                      type="email"
                      placeholder="admin@company.bj"
                      value={biometricEmail}
                      onChange={e => setBiometricEmail(e.target.value)}
                      data-testid="input-biometric-email"
                      className="bg-white/6 border-white/12 text-white placeholder:text-white/25"
                    />
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 border-white/15 text-white/60 hover:border-yellow-400/40 hover:text-yellow-300 bg-transparent hover:bg-yellow-400/8"
                  onClick={handleBiometricLogin}
                  disabled={biometricLoading}
                  data-testid="button-biometric-login"
                >
                  {biometricLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{t.webauthn.loggingIn}</>
                    : <><Fingerprint className="w-4 h-4" />{t.webauthn.loginBtn}</>
                  }
                </Button>
              </>
            )}
          </div>

          <div className="mt-5 text-center text-sm">
            <span className="text-white/35">{t.login.noAccount} </span>
            <Link href="/register">
              <span className="font-medium text-yellow-400 hover:text-yellow-300 cursor-pointer">{t.login.register}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

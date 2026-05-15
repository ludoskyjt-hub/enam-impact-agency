import { useState } from "react";
import { setAuthToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBoutikoLogin, useBoutikoRegister } from "@workspace/api-client-react";
import { Store, Loader2, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");

  const loginMutation = useBoutikoLogin();
  const registerMutation = useBoutikoRegister();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } }, {
      onSuccess: (res) => {
        setAuthToken(res.token);
        window.location.href = import.meta.env.BASE_URL;
      },
      onError: (err: any) => {
        toast({
          title: "Connexion échouée",
          description: err.message || "Email ou mot de passe incorrect",
          variant: "destructive",
        });
      }
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ data: { email, password, name } }, {
      onSuccess: (res) => {
        setAuthToken(res.token);
        window.location.href = import.meta.env.BASE_URL;
      },
      onError: (err: any) => {
        toast({
          title: "Inscription échouée",
          description: err.message || "Impossible de créer le compte",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex bg-muted/30">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border-2 border-white"
              style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          ))}
        </div>
        <div className="relative z-10 text-center space-y-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur mx-auto shadow-lg">
            <ShoppingBag className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">Boutiko</h1>
            <p className="text-xl text-white/80 mt-2">Votre assistant boutique intelligent</p>
          </div>
          <div className="grid grid-cols-1 gap-3 text-left mt-8 max-w-xs mx-auto">
            {["Gestion des stocks en temps réel", "Caisse enregistreuse intuitive", "Suivi clients et fidélisation", "Rapports de ventes détaillés"].map(f => (
              <div key={f} className="flex items-center gap-3 text-sm text-white/90">
                <div className="w-2 h-2 rounded-full bg-white shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex flex-col items-center text-center lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white mb-3 shadow-lg">
              <Store className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black">Boutiko</h1>
            <p className="text-muted-foreground text-sm mt-1">Votre assistant boutique intelligent</p>
          </div>

          <div className="bg-card rounded-2xl shadow-xl border p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {mode === "login" ? "Bon retour !" : "Créer un compte"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "login" ? "Connectez-vous à votre boutique" : "Démarrez votre boutique gratuite"}
              </p>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required placeholder="boutique@exemple.bj"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input id="password" type="password" required
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full h-11 font-semibold" disabled={loginMutation.isPending}>
                  {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Se connecter
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => setMode("register")}
                    className="text-sm text-primary hover:underline font-medium">
                    Pas encore de compte ? S'inscrire
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nom complet</Label>
                  <Input id="reg-name" required placeholder="Aminata Koné"
                    value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" required placeholder="boutique@exemple.bj"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Téléphone</Label>
                  <Input id="reg-phone" type="tel" required placeholder="+229 90 00 00 00"
                    value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Mot de passe</Label>
                  <Input id="reg-password" type="password" required
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full h-11 font-semibold" disabled={registerMutation.isPending}>
                  {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer mon compte
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => setMode("login")}
                    className="text-sm text-primary hover:underline font-medium">
                    Déjà un compte ? Se connecter
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Démo : <span className="font-mono">demo@boutiko.bj</span> / <span className="font-mono">password</span>
          </p>
        </div>
      </div>
    </div>
  );
}

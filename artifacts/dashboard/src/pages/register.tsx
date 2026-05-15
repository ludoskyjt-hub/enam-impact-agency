import { Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import beninMap from "@/assets/benin-flag-map-nobg.png";
import { useI18n, LANG_META, type Lang } from "@/lib/i18n";

const registerSchema = z.object({
  country: z.string().optional().default("BJ"),
  companyName: z.string().min(2),
  ifu: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(6),
});

export default function Register() {
  const { toast } = useToast();
  const registerMutation = useRegister();
  const { t, lang, setLang } = useI18n();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { country: "BJ", companyName: "", ifu: "", email: "", phone: "", password: "" },
  });

  const selectedCountryCode = form.watch("country");
  const selectedCountry = COUNTRIES.find(c => c.code === selectedCountryCode) ?? COUNTRIES[0];

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        setToken(res.token);
        window.location.href = import.meta.env.BASE_URL;
        toast({ title: t.register.successTitle, description: t.register.successDesc });
      },
      onError: () => {
        toast({ title: t.register.errorTitle, description: t.register.errorDesc, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: "hsl(224 50% 10%)" }}>
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

      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <img src={beninMap} alt="Logo" className="w-14 h-14 object-contain drop-shadow-lg mb-3" />
        <span className="font-bold text-2xl">
          <span className="text-yellow-400">{selectedCountry.appName.split("Expense")[0]}</span>
          <span className="text-white">Expense</span>
        </span>
        <p className="mt-1 text-white/45 text-sm">{t.register.title}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-xl rounded-2xl p-6 md:p-8" style={{ background: "hsl(224 45% 14%)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">{t.register.country}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 bg-white/6 border-white/12 text-white focus:ring-yellow-400/40" data-testid="select-country">
                        <SelectValue placeholder={t.register.countryPlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{c.flag}</span>
                            <span>{c.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">{t.register.company}</FormLabel>
                    <FormControl>
                      <Input placeholder="SARL Acme" {...field} data-testid="input-company-name"
                        className="bg-white/6 border-white/12 text-white placeholder:text-white/25 focus-visible:ring-yellow-400/40 focus-visible:border-yellow-400/40" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ifu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">{selectedCountry.ifu}</FormLabel>
                    <FormControl>
                      <Input placeholder={selectedCountry.ifu} {...field} data-testid="input-ifu"
                        className="bg-white/6 border-white/12 text-white placeholder:text-white/25 focus-visible:ring-yellow-400/40 focus-visible:border-yellow-400/40" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">{t.register.email}</FormLabel>
                    <FormControl>
                      <Input placeholder={`admin@company.${selectedCountryCode.toLowerCase()}`} {...field} data-testid="input-email"
                        className="bg-white/6 border-white/12 text-white placeholder:text-white/25 focus-visible:ring-yellow-400/40 focus-visible:border-yellow-400/40" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/70">{t.register.phone}</FormLabel>
                    <FormControl>
                      <Input placeholder={`${selectedCountry.dialCode} 97000000`} {...field} data-testid="input-phone"
                        className="bg-white/6 border-white/12 text-white placeholder:text-white/25 focus-visible:ring-yellow-400/40 focus-visible:border-yellow-400/40" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">{t.register.password}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} data-testid="input-password"
                      className="bg-white/6 border-white/12 text-white placeholder:text-white/25 focus-visible:ring-yellow-400/40 focus-visible:border-yellow-400/40" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Country compliance note */}
            <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(250,204,21,0.07)", border: "1px solid rgba(250,204,21,0.15)" }}>
              <span className="text-2xl">{selectedCountry.flag}</span>
              <div>
                <p className="text-xs font-semibold text-yellow-400">{selectedCountry.appName}</p>
                <p className="text-xs text-white/40">{t.register.taxCompliance} : {selectedCountry.dgi}</p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold bg-yellow-400 hover:bg-yellow-300 text-[hsl(224,50%,10%)]"
              disabled={registerMutation.isPending}
              data-testid="button-register"
            >
              {registerMutation.isPending ? t.register.submitting : t.register.submit}
            </Button>
          </form>
        </Form>

        <div className="mt-5 text-center text-sm">
          <span className="text-white/35">{t.register.hasAccount} </span>
          <Link href="/login">
            <span className="font-medium text-yellow-400 hover:text-yellow-300 cursor-pointer">{t.register.login}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

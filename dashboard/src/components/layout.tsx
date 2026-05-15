import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@workspace/api-client-react";
import { removeToken, getToken } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Receipt, BarChart3, Users, Wallet, LogOut,
  Building2, Menu, Smartphone, Settings, UserCog, Shield, BookOpen,
  User, PiggyBank, ShieldAlert, ClipboardList, CalendarClock, FileUp, Bot,
} from "lucide-react";
import beninMap from "@/assets/benin-flag-map-nobg.png";
import { getCountry } from "@/lib/countries";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useI18n, LANG_META, type Lang } from "@/lib/i18n";

function RolePill({ role }: { role: string }) {
  const { t } = useI18n();
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-yellow-400/15 text-yellow-400 border border-yellow-400/20 font-medium">
        <Shield className="w-2.5 h-2.5" />{t.team.adminBadge}
      </span>
    );
  }
  if (role === "accountant") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-blue-400/15 text-blue-400 border border-blue-400/20 font-medium">
        <BookOpen className="w-2.5 h-2.5" />{t.team.accountantBadge}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-green-400/15 text-green-400 border border-green-400/20 font-medium">
      <User className="w-2.5 h-2.5" />{t.team.employeeBadge}
    </span>
  );
}

type NavLinkItem = { href: string; label: string; icon: React.ElementType; badge?: number };

function NavLinks({ role, onClick, pendingCount = 0, highRiskCount = 0 }: { role?: string; onClick?: () => void; pendingCount?: number; highRiskCount?: number }) {
  const [location] = useLocation();
  const { t } = useI18n();

  const links: NavLinkItem[] = [
    { href: "/afiwa", label: "✨ AFIWA IA", icon: Bot },
    { href: "/", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/expenses", label: t.nav.expenses, icon: Receipt, ...(pendingCount > 0 ? { badge: pendingCount } : {}) },
    { href: "/momo", label: t.nav.momo, icon: Smartphone },
    { href: "/reports", label: t.nav.reports, icon: BarChart3 },
    { href: "/employees", label: t.nav.employees, icon: Users },
    { href: "/accounts", label: t.nav.accounts, icon: Wallet },
    ...(role === "admin" || role === "accountant"
      ? [{ href: "/budgets", label: t.nav.budgets, icon: PiggyBank } as NavLinkItem]
      : []),
    ...(role === "admin" || role === "accountant"
      ? [{ href: "/compliance", label: t.nav.sentinelle, icon: ShieldAlert, ...(highRiskCount > 0 ? { badge: highRiskCount } : {}) } as NavLinkItem]
      : []),
    { href: "/recurring", label: t.nav.recurring, icon: CalendarClock },
    { href: "/import", label: t.nav.import, icon: FileUp },
    { href: "/audit", label: t.nav.audit, icon: ClipboardList },
    { href: "/settings", label: t.settings.title, icon: Settings },
    ...(role === "admin" ? [{ href: "/team", label: t.nav.team, icon: UserCog } as NavLinkItem] : []),
  ];

  return (
    <nav className="space-y-1 mt-6">
      {links.map((link) => {
        const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href} onClick={onClick}>
            <span className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? "bg-yellow-400/15 text-yellow-300 font-semibold border border-yellow-400/20"
                : "text-white/55 hover:bg-white/8 hover:text-white"
            }`}>
              <Icon className="w-5 h-5 shrink-0" />
              {link.label}
              {link.badge && (
                <span className="ml-auto min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {link.badge > 99 ? "99+" : link.badge}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function LangSwitcher() {
  const { lang, setLang } = useI18n();
  const langs: Lang[] = ["fr", "en", "pt"];
  return (
    <div className="flex items-center gap-1 px-1 mt-2">
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          title={LANG_META[l].label}
          className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-base transition-all ${
            lang === l
              ? "bg-yellow-400/20 ring-1 ring-yellow-400/40"
              : "hover:bg-white/10 opacity-50 hover:opacity-80"
          }`}
        >
          {LANG_META[l].flag}
        </button>
      ))}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const logout = useLogout();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const country = getCountry(user?.country ?? "BJ");
  const appName = country.appName;
  const { t } = useI18n();
  const role = user?.role ?? "employee";

  const token = getToken();
  const { data: dashData } = useQuery({
    queryKey: ["approval-pending-badge"],
    queryFn: async () => {
      const res = await fetch("/api/reports/dashboard", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return res.json() as Promise<Record<string, unknown>>;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: !!user,
  });
  const approvalPendingCount = (dashData?.approvalPendingCount as number) ?? 0;
  const highRiskCount = (dashData?.highRiskCount as number) ?? 0;

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        removeToken();
        setLocation("/login");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b">
        <div className="flex items-center gap-2 text-primary font-bold text-lg">
          <img src={beninMap} alt={country.name} className="w-8 h-8 object-contain" />
          {appName}
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 text-primary font-bold text-lg">
                <img src={beninMap} alt={country.name} className="w-8 h-8 object-contain" />
                {appName}
              </div>
            </div>
            <div className="px-3 py-4">
              <NavLinks role={role} onClick={() => setIsMobileMenuOpen(false)} pendingCount={approvalPendingCount} highRiskCount={highRiskCount} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
              <LangSwitcher />
              <div className="mb-3 mt-2">
                <p className="text-sm font-medium truncate">{user?.companyName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                {t.nav.logout}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar — bleu nuit */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 z-10" style={{ background: "hsl(224 50% 10%)" }}>
        <div className="p-6 border-b border-white/10">
          <Link href="/">
            <span className="flex items-center gap-2 font-bold text-xl cursor-pointer text-white">
              <img src={beninMap} alt={country.name} className="w-9 h-9 object-contain" />
              <span>
                <span className="text-yellow-400">{appName.split("Expense")[0]}</span>
                <span className="text-white">Expense</span>
              </span>
            </span>
          </Link>
          <p className="text-white/40 text-[10px] mt-1 uppercase tracking-widest">{t.dashboard.slogan}</p>
        </div>

        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <NavLinks role={role} pendingCount={approvalPendingCount} highRiskCount={highRiskCount} />
        </div>

        <div className="p-4 border-t border-white/10">
          <LangSwitcher />

          <div className="flex items-center gap-3 mt-3 mb-2 px-1">
            <div className="w-9 h-9 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-white">{user?.companyName}</p>
              <p className="text-xs truncate text-white/40">{user?.email}</p>
            </div>
          </div>
          <div className="px-1 mb-2">
            <RolePill role={role} />
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors text-sm">
            <LogOut className="w-4 h-4" />
            {t.nav.logout}
          </button>
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-col gap-1">
            <img src="/enam-impact-logo.png" alt="Enam Impact Agency" className="h-9 w-auto object-contain opacity-75 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

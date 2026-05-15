import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { removeAuthToken } from "@/lib/auth";
import {
  LayoutDashboard, Package, Users, ShoppingCart, Settings,
  LogOut, Menu, X, Bot, CreditCard, Layers, BarChart2, UserCog, ChevronRight,
} from "lucide-react";
import { useBoutikoGetMe, useBoutikoGetShop } from "@workspace/api-client-react";
import { useTranslation, LANG_OPTIONS } from "@/i18n";

function NavItem({ href, label, icon: Icon, onClick }: { href: string; label: string; icon: any; onClick?: () => void }) {
  const [location] = useLocation();
  const isActive = location === href || (href !== "/" && location.startsWith(href));
  return (
    <Link href={href} onClick={onClick}>
      <div className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}>
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 leading-none">{label}</span>
        {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
      </div>
    </Link>
  );
}

function LangSwitcher() {
  const { lang, setLang } = useTranslation();
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {LANG_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => setLang(opt.value)}
          title={opt.label}
          className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${
            lang === opt.value
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }`}
        >
          {opt.flag} {opt.value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { data: user } = useBoutikoGetMe();
  const { data: shop } = useBoutikoGetShop();
  const { t } = useTranslation();
  const nav = t.nav;

  const NAV_SECTIONS = [
    {
      label: null,
      items: [{ href: "/", label: nav.dashboard, icon: LayoutDashboard }],
    },
    {
      label: nav.sections.boutique,
      items: [
        { href: "/inventory", label: nav.inventory, icon: Package },
        { href: "/customers", label: nav.customers, icon: Users },
        { href: "/sales", label: nav.sales, icon: ShoppingCart },
        { href: "/ai-agent", label: nav.houefa, icon: Bot },
      ],
    },
    {
      label: nav.sections.account,
      items: [
        { href: "/subscription", label: nav.subscription, icon: CreditCard },
        { href: "/pricing", label: nav.pricing, icon: Layers },
        { href: "/settings", label: nav.settings, icon: Settings },
      ],
    },
    {
      label: nav.sections.admin,
      items: [
        { href: "/stats", label: nav.stats, icon: BarChart2 },
        { href: "/users", label: nav.users, icon: UserCog },
      ],
    },
  ];

  const handleLogout = () => {
    removeAuthToken();
    window.location.href = `${import.meta.env.BASE_URL}login`;
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Brand header */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <img
          src={`${import.meta.env.BASE_URL}enam-logo.png`}
          alt="ENAM"
          className="h-8 w-8 rounded-md object-contain bg-white p-0.5 shrink-0"
        />
        <span className="font-black text-base tracking-tight">Boutiko</span>
        {onClose && (
          <button onClick={onClose} className="ml-auto opacity-60 hover:opacity-100 transition-opacity">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/35">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavItem key={item.href} {...item} onClick={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Language switcher */}
      <div className="border-t border-sidebar-border pt-2">
        <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/35">
          {t.settings.language}
        </p>
        <LangSwitcher />
      </div>

      {/* Footer: user + logout */}
      <div className="px-2 py-3 border-t border-sidebar-border space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="h-7 w-7 rounded-full bg-sidebar-primary flex items-center justify-center shrink-0 text-xs font-black text-sidebar-primary-foreground uppercase">
            {(user?.name || user?.email || "?").charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate leading-none">{user?.name || "Mon compte"}</p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate mt-0.5">{shop?.name || ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {nav.logout}
        </button>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[100dvh] w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col md:flex border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-56 shrink-0 shadow-2xl">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border md:hidden">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}enam-logo.png`} alt="ENAM" className="h-6 w-6 rounded object-contain bg-white p-0.5" />
          <span className="font-black text-sm text-sidebar-foreground">Boutiko</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14 min-w-0">
        <div className="mx-auto max-w-6xl p-5 md:p-7">
          {children}
        </div>
      </main>
    </div>
  );
}

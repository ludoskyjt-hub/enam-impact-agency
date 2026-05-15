import { Router, Route, Switch, Link, useLocation } from "wouter";
import { Home, Search, Sparkles, ListMusic } from "lucide-react";
import HomePage    from "@/pages/Home";
import DiscoverPage from "@/pages/Discover";
import AgentPage   from "@/pages/Agent";
import Player      from "@/components/Player";

const BASE = (import.meta.env.BASE_URL ?? "/melodia/").replace(/\/$/, "") || "/melodia";

function NavBar() {
  const [loc] = useLocation();
  const links = [
    { to: "/",        icon: Home,      label: "Accueil"  },
    { to: "/discover", icon: Search,   label: "Découvrir" },
    { to: "/melodia",  icon: Sparkles, label: "MELODIA"  },
  ];
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0"
             style={{ borderRight: "1px solid var(--border)", minHeight: "100vh", padding: "24px 16px" }}>
        <div className="flex items-center gap-3 mb-10 px-2">
          <span className="text-3xl">🎵</span>
          <div>
            <p className="font-black text-white text-lg leading-none">MelodiaPerTe</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(155,77,255,0.6)" }}>Musique africaine IA</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {links.map(({ to, icon: Icon, label }) => {
            const active = to === "/" ? loc === "/" : loc.startsWith(to);
            return (
              <Link key={to} href={to}>
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                   style={{
                     background: active ? "rgba(155,77,255,0.2)"  : "transparent",
                     color:      active ? "var(--purple)"          : "var(--muted)",
                     borderLeft: active ? "3px solid var(--purple)" : "3px solid transparent",
                   }}>
                  <Icon className="w-4 h-4" />
                  {label}
                </a>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-3 rounded-2xl text-xs text-center"
             style={{ background: "rgba(155,77,255,0.08)", border: "1px solid rgba(155,77,255,0.15)", color: "var(--muted)" }}>
          Enam Impact Agency<br />
          <span style={{ color: "rgba(155,77,255,0.5)" }}>made in Bénin 🇧🇯</span>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50"
           style={{ background: "rgba(10,0,16,0.97)", borderTop: "1px solid var(--border)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex">
          {links.map(({ to, icon: Icon, label }) => {
            const active = to === "/" ? loc === "/" : loc.startsWith(to);
            return (
              <Link key={to} href={to} className="flex-1">
                <a className="flex flex-col items-center py-3 gap-0.5 transition-all">
                  <Icon className="w-5 h-5" style={{ color: active ? "var(--purple)" : "var(--muted)" }} />
                  <span className="text-xs font-medium" style={{ color: active ? "var(--purple)" : "var(--muted)" }}>
                    {label}
                  </span>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router base={BASE}>
      <div className="flex min-h-screen" style={{ background: "var(--dark)" }}>
        <NavBar />
        <main className="flex-1 overflow-y-auto" style={{ maxHeight: "100vh" }}>
          <div className="max-w-5xl mx-auto px-4 py-8 pb-32 md:pb-8">
            <Switch>
              <Route path="/"         component={HomePage}    />
              <Route path="/discover" component={DiscoverPage} />
              <Route path="/melodia"  component={AgentPage}   />
              <Route>
                <div className="text-center py-20">
                  <p className="text-4xl mb-4">🎵</p>
                  <p className="text-white font-bold text-xl">Page introuvable</p>
                  <Link href="/"><a className="mt-4 inline-block" style={{ color: "var(--purple)" }}>← Accueil</a></Link>
                </div>
              </Route>
            </Switch>
          </div>
        </main>
      </div>
      {/* Lecteur audio persistant */}
      <Player />
    </Router>
  );
}

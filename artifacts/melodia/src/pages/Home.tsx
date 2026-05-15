/**
 * Home.tsx — Page d'accueil MelodiaPerTe
 * Genres mis en avant + appel à MELODIA IA
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Music, Sparkles, Globe, Headphones } from "lucide-react";
import TrackCard from "@/components/TrackCard";
import { searchMusic, AFRICAN_GENRES, type Track } from "@/lib/api";

const FEATURED_QUERIES = [
  { label: "🔥 En ce moment",       query: "afrobeats 2024"        },
  { label: "🇧🇯 Musique du Bénin",   query: "musique beninoise"     },
  { label: "🌙 Ambiance du soir",    query: "african jazz lounge"   },
  { label: "💃 Pour danser",         query: "coupé décalé afropop"  },
];

export default function Home() {
  const [, navigate] = useLocation();
  const [featured, setFeatured] = useState<Track[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [active,   setActive]   = useState(0);

  useEffect(() => {
    loadFeatured(0);
  }, []);

  const loadFeatured = async (idx: number) => {
    setActive(idx);
    setLoading(true);
    try {
      const res = await searchMusic(FEATURED_QUERIES[idx]!.query, 10);
      setFeatured(res);
    } catch { setFeatured([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="pb-32 animate-in">
      {/* Hero */}
      <div className="relative mb-10 rounded-3xl overflow-hidden p-8 text-center"
           style={{ background: "linear-gradient(135deg, rgba(155,77,255,0.2), rgba(107,33,212,0.15), rgba(10,0,16,0.9))", border: "1px solid rgba(155,77,255,0.2)" }}>
        <div className="absolute inset-0 opacity-30"
             style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(155,77,255,0.3) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(107,33,212,0.2) 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-4xl font-black text-white mb-3 leading-tight">
            MelodiaPerTe
          </h1>
          <p className="text-lg mb-2" style={{ color: "rgba(155,77,255,0.9)" }}>
            Votre musique africaine personnalisée
          </p>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "var(--muted)" }}>
            Afrobeats · Coupé-Décalé · Zoblazo · Afro-Jazz · Highlife · Mbalax et bien plus
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <button onClick={() => navigate("/discover")}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #9b4dff, #6b21d4)", boxShadow: "0 8px 25px rgba(155,77,255,0.4)" }}>
              <Headphones className="w-4 h-4" /> Découvrir
            </button>
            <button onClick={() => navigate("/melodia")}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all hover:scale-105"
                    style={{ background: "rgba(155,77,255,0.1)", border: "1px solid rgba(155,77,255,0.3)", color: "var(--purple)" }}>
              <Sparkles className="w-4 h-4" /> Parler à MELODIA
            </button>
          </div>
        </div>
      </div>

      {/* MELODIA CTA */}
      <div className="mb-8 p-5 rounded-2xl cursor-pointer group transition-all hover:scale-[1.01]"
           onClick={() => navigate("/melodia")}
           style={{ background: "linear-gradient(135deg, rgba(155,77,255,0.12), rgba(107,33,212,0.08))", border: "1px solid rgba(155,77,255,0.2)" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
               style={{ background: "rgba(155,77,255,0.15)" }}>
            🎵
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white">MELODIA — Votre Guide Musical IA</h3>
              <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(155,77,255,0.2)", color: "var(--purple)" }}>
                IA
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              "Je suis heureux, propose-moi de la musique" · "Explique-moi le Coupé-Décalé" · "Top Afrobeats 2025"
            </p>
          </div>
          <Sparkles className="w-5 h-5 flex-shrink-0 group-hover:text-purple-400 transition-colors" style={{ color: "var(--muted)" }} />
        </div>
      </div>

      {/* Genres africains */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">🌍 Genres Africains</h2>
          <button onClick={() => navigate("/discover")} className="text-sm" style={{ color: "var(--purple)" }}>
            Voir tout →
          </button>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {AFRICAN_GENRES.map(g => (
            <button key={g.id} onClick={() => navigate("/discover")}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all hover:scale-105"
                    style={{ background: `${g.color}18`, border: `1px solid ${g.color}30` }}>
              <span className="text-xl">{g.label.split(" ")[0]}</span>
              <span className="text-xs text-center font-medium leading-tight"
                    style={{ color: g.color }}>
                {g.label.split(" ").slice(1).join(" ")}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured music */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">🎧 Musique à écouter</h2>
        </div>
        <div className="scroll-x flex gap-3 mb-4 pb-1">
          {FEATURED_QUERIES.map((q, i) => (
            <button key={q.query} onClick={() => loadFeatured(i)}
                    className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: active === i ? "rgba(155,77,255,0.25)" : "rgba(155,77,255,0.08)",
                      border:     `1px solid ${active === i ? "rgba(155,77,255,0.5)" : "rgba(155,77,255,0.15)"}`,
                      color:      active === i ? "var(--purple)" : "var(--muted)",
                    }}>
              {q.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton aspect-square rounded-2xl mb-3" />
                <div className="skeleton h-3 w-3/4 mb-1.5" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {featured.map(t => <TrackCard key={t.trackId} track={t} queue={featured} />)}
          </div>
        )}
      </div>

      {/* Footer mini */}
      <div className="mt-10 flex items-center justify-center gap-2 text-xs" style={{ color: "rgba(155,77,255,0.4)" }}>
        <Globe className="w-3.5 h-3.5" />
        Données musicales · iTunes Search API · Apple Inc.
      </div>
    </div>
  );
}

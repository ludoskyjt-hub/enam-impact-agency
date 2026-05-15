/**
 * Discover.tsx — Page découverte musicale
 * Recherche iTunes + genres africains + top artistes
 */
import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Music, Globe } from "lucide-react";
import TrackCard from "@/components/TrackCard";
import { searchMusic, getAfricanGenre, AFRICAN_GENRES, TOP_AFRICAN_ARTISTS, type Track } from "@/lib/api";

export default function Discover() {
  const [query,    setQuery]    = useState("");
  const [tracks,   setTracks]   = useState<Track[]>([]);
  const [genre,    setGenre]    = useState(AFRICAN_GENRES[0]!);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);

  // Charger le genre par défaut
  useEffect(() => {
    loadGenre(AFRICAN_GENRES[0]!);
  }, []);

  const loadGenre = async (g: typeof AFRICAN_GENRES[0]) => {
    setGenre(g);
    setLoading(true);
    setSearched(false);
    try {
      const res = await getAfricanGenre(g.query, 20);
      setTracks(res);
    } catch { setTracks([]); }
    finally { setLoading(false); }
  };

  const doSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchMusic(query, 30);
      setTracks(res);
    } catch { setTracks([]); }
    finally { setLoading(false); }
  }, [query]);

  return (
    <div className="pb-32 animate-in">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(155,77,255,0.6)" }}>
          🌍 Découverte
        </p>
        <h1 className="text-3xl font-black text-white">Musique Africaine</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Afrobeats · Coupé-Décalé · Highlife · Afro-Jazz · et plus
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted)" }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && doSearch()}
          placeholder="Rechercher artiste, titre, album..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl text-white text-sm outline-none transition-all"
          style={{
            background: "rgba(155,77,255,0.08)",
            border: "1px solid rgba(155,77,255,0.2)",
          }}
        />
        <button
          onClick={doSearch}
          disabled={!query.trim() || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #9b4dff, #6b21d4)" }}>
          Chercher
        </button>
      </div>

      {/* Genres africains */}
      {!searched && (
        <>
          <div className="scroll-x flex gap-3 mb-8 pb-2">
            {AFRICAN_GENRES.map(g => (
              <button
                key={g.id}
                onClick={() => loadGenre(g)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  background:  genre.id === g.id ? g.color + "30" : "rgba(155,77,255,0.08)",
                  border:      `1px solid ${genre.id === g.id ? g.color : "rgba(155,77,255,0.15)"}`,
                  color:       genre.id === g.id ? g.color : "var(--muted)",
                }}>
                {g.label}
              </button>
            ))}
          </div>

          {/* Top Artistes */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4">🌟 Top Artistes Africains</h2>
            <div className="scroll-x flex gap-3 pb-2">
              {TOP_AFRICAN_ARTISTS.map(a => (
                <button
                  key={a.name}
                  onClick={() => { setQuery(a.name); setSearched(true); searchMusic(a.name, 20).then(setTracks); }}
                  className="flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl text-center transition-all hover:scale-105"
                  style={{ background: "rgba(155,77,255,0.08)", border: "1px solid rgba(155,77,255,0.12)", minWidth: 100 }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                       style={{ background: "linear-gradient(135deg, rgba(155,77,255,0.3), rgba(107,33,212,0.3))" }}>
                    {a.country}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white whitespace-nowrap">{a.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{a.genre}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Résultats */}
      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--purple)" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>Chargement depuis iTunes…</p>
        </div>
      ) : tracks.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              {searched ? `Résultats pour "${query}"` : genre.label}
            </h2>
            <span className="text-sm" style={{ color: "var(--muted)" }}>{tracks.length} titres</span>
          </div>
          {/* Vue grille */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            {tracks.slice(0, 10).map(t => (
              <TrackCard key={t.trackId} track={t} queue={tracks} />
            ))}
          </div>
          {/* Vue liste pour le reste */}
          {tracks.length > 10 && (
            <div className="flex flex-col gap-2">
              {tracks.slice(10).map(t => (
                <TrackCard key={t.trackId} track={t} queue={tracks} compact />
              ))}
            </div>
          )}
          <p className="text-center mt-6 text-xs flex items-center justify-center gap-1.5" style={{ color: "var(--muted)" }}>
            <Globe className="w-3.5 h-3.5" />
            Données et extraits 30s fournis par iTunes Search API · Apple
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center py-16 gap-3">
          <Music className="w-12 h-12" style={{ color: "rgba(155,77,255,0.3)" }} />
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {searched ? `Aucun résultat pour "${query}"` : "Sélectionnez un genre"}
          </p>
        </div>
      )}
    </div>
  );
}

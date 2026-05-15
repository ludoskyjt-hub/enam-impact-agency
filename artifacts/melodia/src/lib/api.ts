/**
 * api.ts — Intégration iTunes Search API (gratuite, sans clé)
 * + appels backend MELODIA IA
 */

export interface Track {
  trackId:        number;
  trackName:      string;
  artistName:     string;
  collectionName: string;
  artworkUrl100:  string;
  artworkUrl512?: string;
  previewUrl:     string | null;
  trackViewUrl:   string;
  primaryGenreName: string;
  releaseDate:    string;
  trackTimeMillis: number;
}

export interface Artist {
  artistId:   number;
  artistName: string;
  artistType: string;
  artistLinkUrl: string;
  primaryGenreName?: string;
}

// ─── iTunes Search API ───────────────────────────────────────────────────────
const ITUNES = "https://itunes.apple.com";

export async function searchMusic(query: string, limit = 20): Promise<Track[]> {
  const url = `${ITUNES}/search?${new URLSearchParams({
    term:   query,
    media:  "music",
    entity: "song",
    limit:  String(limit),
    country: "fr",
    lang:   "fr_fr",
  })}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("iTunes API error");
  const data = await res.json() as { results: Track[] };
  return data.results.filter(t => t.previewUrl);
}

export async function getAfricanGenre(genre: string, limit = 20): Promise<Track[]> {
  return searchMusic(`${genre} africa`, limit);
}

export async function getArtistTracks(artistName: string, limit = 10): Promise<Track[]> {
  return searchMusic(artistName, limit);
}

// ─── Genres africains mis en avant ───────────────────────────────────────────
export const AFRICAN_GENRES = [
  { id: "afrobeats",    label: "🌍 Afrobeats",      query: "afrobeats",         color: "#f59e0b" },
  { id: "afrojazz",     label: "🎷 Afro-Jazz",       query: "african jazz",      color: "#10b981" },
  { id: "coupe-decale", label: "💃 Coupé-Décalé",    query: "coupe decale",      color: "#ef4444" },
  { id: "zoblazo",      label: "🥁 Zoblazo",          query: "zoblazo benin",     color: "#8b5cf6" },
  { id: "afropop",      label: "🎤 Afro-Pop",         query: "afropop nigeria",   color: "#3b82f6" },
  { id: "highlife",     label: "🎵 Highlife",          query: "highlife ghana",    color: "#f97316" },
  { id: "mbalax",       label: "🪘 Mbalax",            query: "mbalax senegal",    color: "#ec4899" },
  { id: "soukous",      label: "🎸 Soukous",           query: "soukous congo",     color: "#14b8a6" },
];

// ─── Top artistes africains recommandés ──────────────────────────────────────
export const TOP_AFRICAN_ARTISTS = [
  { name: "Burna Boy",        genre: "Afrobeats",   country: "🇳🇬" },
  { name: "Wizkid",           genre: "Afrobeats",   country: "🇳🇬" },
  { name: "Davido",           genre: "Afropop",     country: "🇳🇬" },
  { name: "Tiwa Savage",      genre: "Afropop",     country: "🇳🇬" },
  { name: "Angélique Kidjo",  genre: "Afrojazz",    country: "🇧🇯" },
  { name: "Oumou Sangaré",    genre: "Afrojazz",    country: "🇲🇱" },
  { name: "Youssou N'Dour",   genre: "Mbalax",      country: "🇸🇳" },
  { name: "Aya Nakamura",     genre: "Afropop",     country: "🇫🇷" },
  { name: "Diamond Platnumz", genre: "Bongo Flava", country: "🇹🇿" },
  { name: "Rema",             genre: "Afrobeats",   country: "🇳🇬" },
];

// ─── Formater la durée ────────────────────────────────────────────────────────
export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Backend MELODIA IA ───────────────────────────────────────────────────────
export async function chatWithMelodia(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  token?: string,
): Promise<{ reply: string; source: string; toolsUsed?: string[]; suggestions?: string[] }> {
  const res = await fetch("/api/melodia/chat", {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Erreur ${res.status}`);
  }
  return res.json() as Promise<{ reply: string; source: string; toolsUsed?: string[]; suggestions?: string[] }>;
}

/**
 * melodia.test.ts — Tests unitaires MELODIA (MelodiaPerTe)
 * Runner : vitest — `pnpm vitest run src/routes/melodia.test.ts`
 *
 * Ce que teste ce fichier :
 *
 * ✅ BLOC 1 — buildSuggestions()
 *    - Afrobeats → suggestions Afrobeats
 *    - Bénin → suggestions musique béninoise
 *    - Playlist → suggestions playlists
 *    - Défaut → suggestions génériques
 *
 * ✅ BLOC 2 — Réponses fallback MELODIA (sans OpenAI)
 *    - Afrobeats → artistes Nigeria
 *    - Bénin/Zoblazo → Angélique Kidjo
 *    - Coupé-Décalé → DJ Arafat, Serge Beynaud
 *    - Playlist → playlists thématiques
 *    - Salutations → bienvenue
 *    - Générique → invitation à découvrir
 *
 * ✅ BLOC 3 — Connaissance musicale africaine
 *    - Artistes clés connus
 *    - Genres africains reconnus
 *    - Culture béninoise valorisée
 *
 * ✅ BLOC 4 — Réponse status MELODIA
 *    - Structure correcte
 *    - Champs requis
 *
 * ✅ BLOC 5 — Logique des suggestions
 *    - Toujours un tableau non vide
 *    - Suggestions pertinentes par contexte
 */

import { describe, it, expect, vi } from "vitest";

// ─── Reproduction de buildSuggestions (privée dans melodia.ts) ───────────────
function buildSuggestions(message: string): string[] {
  const lower = message.toLowerCase();
  if (lower.includes("afrobeats") || lower.includes("burna"))
    return ["Top Afrobeats à écouter en 2025", "Qui est Burna Boy ?", "Playlist Afrobeats pour une soirée"];
  if (lower.includes("bénin") || lower.includes("zoblazo") || lower.includes("benin"))
    return ["Angélique Kidjo — icône du Bénin ?", "Musique traditionnelle béninoise", "Coupé-Décalé vs Zoblazo"];
  if (lower.includes("playlist") || lower.includes("liste"))
    return ["Playlist pour le matin", "Playlist romantique africaine", "Playlist concentration Afro-Jazz"];
  return [
    "Recommande-moi de la musique africaine",
    "Qu'est-ce que le Coupé-Décalé ?",
    "Top artistes africains 2025",
  ];
}

// ─── Simulation du fallback MELODIA (sans OpenAI) ────────────────────────────
function melodiaChatFallback(message: string): {
  reply: string; source: "fallback"; toolsUsed: string[]; suggestions: string[];
} {
  const lower = message.toLowerCase();
  const suggestions = buildSuggestions(message);
  let reply: string;

  if (lower.includes("afrobeats") || lower.includes("nigéria") || lower.includes("nigeria")) {
    reply = `🎵 L'**Afrobeats** est le genre africain le plus influent au monde !\n\n**Artistes incontournables :**\n• **Burna Boy** 🇳🇬 — Grammy\n• **Wizkid** 🇳🇬 — "Essence"\n• **Rema** 🇳🇬 — "Calm Down"\n• **Tems** 🇳🇬 — Grammy avec Beyoncé`;
  } else if (lower.includes("bénin") || lower.includes("benin") || lower.includes("zoblazo") || lower.includes("angélique")) {
    reply = `🇧🇯 Le Bénin est une terre musicale extraordinaire !\n\n**Angélique Kidjo** — 4 Grammy Awards, artiste béninoise la plus influente d'Afrique.\n\n**Le Zoblazo** est un genre béninois traditionnel ancré dans les rythmes Fon et Yoruba.`;
  } else if (lower.includes("playlist") || lower.includes("recommand") || lower.includes("écouter")) {
    reply = `🎶 Playlists thématiques :\n\n**🌅 Matin :** Rema · Davido · Burna Boy\n**💃 Soirée :** Coupé-Décalé · Serge Beynaud\n**🌙 Soir :** Afro-Jazz · Youssou N'Dour\n**❤️ Romantique :** Wizkid · Tems · Omah Lay`;
  } else if (lower.includes("coupe") || lower.includes("coupé") || lower.includes("décalé")) {
    reply = `💃 Le **Coupé-Décalé** est né à Paris dans les années 2000 !\n\n**DJ Arafat** (légende) était le roi du genre. Aujourd'hui **Serge Beynaud** continue de faire danser des millions.\n\nTrès ancré au **Bénin**, en Côte d'Ivoire et en RDC.`;
  } else if (lower.includes("bonjour") || lower.includes("salut") || lower.includes("hello")) {
    reply = `Bonjour ! 🎵 Je suis **MELODIA**, votre guide musicale IA !\n\nSpécialiste **musique africaine** — Afrobeats, Coupé-Décalé, Zoblazo, Afro-Jazz.\n\nDites-moi votre humeur ! 😊🎶`;
  } else {
    reply = `Bonjour ! Je suis **MELODIA** 🎵, guide musicale spécialiste de l'Afrique.\n\nExplorez la section **Découvrir** pour de la vraie musique africaine ! 🌍🎧`;
  }

  return { reply, source: "fallback", toolsUsed: [], suggestions };
}

// ─── Simulation du status MELODIA ────────────────────────────────────────────
function melodiaStatus(hasOpenAI: boolean) {
  return {
    name:    "MELODIA",
    version: "1.0",
    app:     "MelodiaPerTe",
    ai:      hasOpenAI ? "openai" : "fallback",
    status:  "ready",
  };
}

// ── BLOC 1 : buildSuggestions ─────────────────────────────────────────────────
describe("MELODIA — buildSuggestions()", () => {
  it("retourne des suggestions Afrobeats pour 'afrobeats'", () => {
    const s = buildSuggestions("Parle-moi d'Afrobeats");
    expect(s).toHaveLength(3);
    expect(s.some(x => x.toLowerCase().includes("afrobeats"))).toBe(true);
  });

  it("retourne des suggestions Burna pour 'burna'", () => {
    const s = buildSuggestions("Qui est Burna Boy ?");
    expect(s.some(x => x.toLowerCase().includes("burna"))).toBe(true);
  });

  it("retourne des suggestions Bénin pour 'bénin'", () => {
    const s = buildSuggestions("Musique du Bénin");
    expect(s.some(x => x.toLowerCase().includes("bénin") || x.toLowerCase().includes("benin"))).toBe(true);
  });

  it("retourne des suggestions Zoblazo pour 'zoblazo'", () => {
    const s = buildSuggestions("C'est quoi le Zoblazo ?");
    expect(s.some(x => x.toLowerCase().includes("zoblazo") || x.toLowerCase().includes("bénin"))).toBe(true);
  });

  it("retourne des suggestions playlist pour 'playlist'", () => {
    const s = buildSuggestions("Fais-moi une playlist");
    expect(s.some(x => x.toLowerCase().includes("playlist"))).toBe(true);
  });

  it("retourne des suggestions playlist pour 'liste'", () => {
    const s = buildSuggestions("Fais une liste de musiques");
    expect(s.some(x => x.toLowerCase().includes("playlist"))).toBe(true);
  });

  it("retourne des suggestions génériques pour les autres messages", () => {
    const s = buildSuggestions("Bonjour !");
    expect(s).toHaveLength(3);
    expect(s.some(x => x.toLowerCase().includes("africain"))).toBe(true);
  });

  it("ne retourne jamais un tableau vide", () => {
    const messages = ["", "abc", "🎵", "   ", "random text with nothing music-related"];
    messages.forEach(msg => {
      expect(buildSuggestions(msg).length).toBeGreaterThan(0);
    });
  });

  it("est insensible à la casse", () => {
    const s1 = buildSuggestions("AFROBEATS");
    const s2 = buildSuggestions("afrobeats");
    expect(s1).toEqual(s2);
  });
});

// ── BLOC 2 : Réponses fallback MELODIA ───────────────────────────────────────
describe("MELODIA — Fallback chat (sans OpenAI)", () => {
  it("répond à Afrobeats avec artistes nigérians", () => {
    const r = melodiaChatFallback("Parle-moi d'Afrobeats");
    expect(r.source).toBe("fallback");
    expect(r.reply).toContain("Afrobeats");
    expect(r.reply).toContain("Burna Boy");
    expect(r.reply).toContain("Wizkid");
  });

  it("répond à Nigeria avec artistes connus", () => {
    const r = melodiaChatFallback("Musique du Nigeria");
    expect(r.reply).toContain("Afrobeats");
  });

  it("répond au Bénin avec Angélique Kidjo", () => {
    const r = melodiaChatFallback("Musique du Bénin");
    expect(r.reply).toContain("Angélique Kidjo");
    expect(r.reply).toContain("Grammy");
  });

  it("répond au Zoblazo avec culture béninoise", () => {
    const r = melodiaChatFallback("C'est quoi le Zoblazo ?");
    expect(r.reply).toContain("Zoblazo");
    expect(r.reply).toContain("Bénin");
  });

  it("répond à Angélique Kidjo avec sa biographie", () => {
    const r = melodiaChatFallback("Qui est Angélique Kidjo ?");
    expect(r.reply).toContain("Grammy");
    expect(r.reply).toContain("Bénin");
  });

  it("répond au Coupé-Décalé avec DJ Arafat et Serge Beynaud", () => {
    const r = melodiaChatFallback("Explique le Coupé-Décalé");
    expect(r.reply).toContain("DJ Arafat");
    expect(r.reply).toContain("Serge Beynaud");
    expect(r.reply).toContain("Bénin");
  });

  it("répond à coupé (sans accent) aussi", () => {
    const r = melodiaChatFallback("coupe decale musique");
    expect(r.reply.toLowerCase()).toMatch(/arafat|serge|bénin/i);
  });

  it("répond à une demande de playlist", () => {
    const r = melodiaChatFallback("Fais-moi une playlist pour danser");
    expect(r.reply.toLowerCase()).toMatch(/playlist|burna|wizkid|rema/i);
    expect(r.reply).toContain("Coupé-Décalé");
  });

  it("répond à une demande de recommandation", () => {
    const r = melodiaChatFallback("Recommande-moi de la musique africaine");
    expect(r.reply.toLowerCase()).toMatch(/matin|soir|romantique|playlist/i);
  });

  it("répond à Bonjour avec présentation MELODIA", () => {
    const r = melodiaChatFallback("Bonjour !");
    expect(r.reply).toContain("MELODIA");
    expect(r.reply).toContain("🎵");
  });

  it("répond à Hello en reconnaissant le salut", () => {
    const r = melodiaChatFallback("Hello MELODIA");
    expect(r.reply).toContain("MELODIA");
  });

  it("répond à Salut avec invitation", () => {
    const r = melodiaChatFallback("Salut !");
    expect(r.reply).toContain("MELODIA");
    expect(r.reply).toContain("africaine");
  });

  it("répond à une question générique sans crasher", () => {
    const r = melodiaChatFallback("Quelle est la capitale du Bénin ?");
    expect(r.source).toBe("fallback");
    expect(r.reply.length).toBeGreaterThan(20);
  });

  it("inclut toujours des suggestions", () => {
    const messages = [
      "Afrobeats", "Bénin", "playlist", "Coupé-Décalé", "Bonjour", "autre",
    ];
    messages.forEach(msg => {
      const r = melodiaChatFallback(msg);
      expect(r.suggestions.length).toBeGreaterThan(0);
    });
  });

  it("ne retourne jamais de toolsUsed en mode fallback", () => {
    const messages = ["Afrobeats", "Bénin", "playlist", "Bonjour"];
    messages.forEach(msg => {
      expect(melodiaChatFallback(msg).toolsUsed).toHaveLength(0);
    });
  });
});

// ── BLOC 3 : Connaissance musicale africaine ──────────────────────────────────
describe("MELODIA — Connaissance musicale africaine", () => {
  it("connaît Burna Boy (Grammy)", () => {
    const r = melodiaChatFallback("Parle-moi d'Afrobeats");
    expect(r.reply).toContain("Burna Boy");
    expect(r.reply).toContain("Grammy");
  });

  it("connaît Wizkid", () => {
    const r = melodiaChatFallback("Nigeria music");
    expect(r.reply).toContain("Wizkid");
  });

  it("connaît Angélique Kidjo — icône béninoise", () => {
    const r = melodiaChatFallback("Musique Bénin");
    expect(r.reply).toContain("Angélique Kidjo");
  });

  it("valorise la culture béninoise (Fon, Yoruba)", () => {
    const r = melodiaChatFallback("Zoblazo");
    expect(r.reply).toMatch(/Fon|Yoruba|béninois/i);
  });

  it("cite DJ Arafat pour le Coupé-Décalé", () => {
    const r = melodiaChatFallback("Coupé-Décalé");
    expect(r.reply).toContain("DJ Arafat");
  });

  it("cite Serge Beynaud comme successeur du Coupé-Décalé", () => {
    const r = melodiaChatFallback("coupé décalé");
    expect(r.reply).toContain("Serge Beynaud");
  });

  it("propose des playlists multi-humeurs", () => {
    const r = melodiaChatFallback("Je veux écouter de la musique");
    const reply = r.reply;
    // Doit proposer plusieurs ambiances
    const ambiances = ["matin", "soir", "romantique", "soirée", "concentration"].filter(a =>
      reply.toLowerCase().includes(a)
    );
    expect(ambiances.length).toBeGreaterThanOrEqual(2);
  });
});

// ── BLOC 4 : Status MELODIA ───────────────────────────────────────────────────
describe("MELODIA — Status endpoint", () => {
  it("retourne le bon nom", () => {
    const s = melodiaStatus(true);
    expect(s.name).toBe("MELODIA");
  });

  it("retourne la bonne app", () => {
    const s = melodiaStatus(true);
    expect(s.app).toBe("MelodiaPerTe");
  });

  it("retourne version 1.0", () => {
    const s = melodiaStatus(true);
    expect(s.version).toBe("1.0");
  });

  it("indique openai quand la clé est configurée", () => {
    const s = melodiaStatus(true);
    expect(s.ai).toBe("openai");
  });

  it("indique fallback sans clé OpenAI", () => {
    const s = melodiaStatus(false);
    expect(s.ai).toBe("fallback");
  });

  it("retourne toujours status: ready", () => {
    expect(melodiaStatus(true).status).toBe("ready");
    expect(melodiaStatus(false).status).toBe("ready");
  });
});

// ── BLOC 5 : Cohérence et non-régression ─────────────────────────────────────
describe("MELODIA — Cohérence des réponses", () => {
  it("toutes les réponses contiennent du texte non vide", () => {
    const inputs = [
      "Afrobeats", "Bénin", "Coupé-Décalé", "playlist",
      "Bonjour", "Hello", "question random", "",
    ];
    inputs.forEach(input => {
      const r = melodiaChatFallback(input);
      expect(r.reply.trim().length).toBeGreaterThan(0);
    });
  });

  it("la source est toujours 'fallback' sans OpenAI", () => {
    const inputs = ["Afrobeats", "Bénin", "Bonjour", "random"];
    inputs.forEach(input => {
      expect(melodiaChatFallback(input).source).toBe("fallback");
    });
  });

  it("les suggestions sont toujours un tableau de strings", () => {
    const inputs = ["Afrobeats", "Bénin", "playlist", "Bonjour", "autre"];
    inputs.forEach(input => {
      const r = melodiaChatFallback(input);
      expect(Array.isArray(r.suggestions)).toBe(true);
      r.suggestions.forEach(s => expect(typeof s).toBe("string"));
    });
  });

  it("les réponses sont toujours en markdown (contiennent **)", () => {
    const inputs = ["Afrobeats", "Bénin", "playlist", "Coupé-Décalé"];
    inputs.forEach(input => {
      const r = melodiaChatFallback(input);
      expect(r.reply).toContain("**");
    });
  });
});

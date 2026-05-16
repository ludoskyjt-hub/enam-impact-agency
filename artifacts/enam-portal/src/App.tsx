import React, { useState, useEffect, useRef, useCallback } from "react";
import "./index.css";
import { T, Lang } from "./translations";

/* ─── DATA ────────────────────────────────────────────────────────────── */
const HERO_SLIDES = [
  { img: "images/hero-1.png" },
  { img: "images/hero-2.png" },
  { img: "images/hero-3.png" },
];

const DOMAIN_META = [
  { abbr: "FM", color: "#f26522", img: "images/domain-formation.png" },
  { abbr: "EV", color: "#1a7fff", img: "images/domain-events.png" },
  { abbr: "CU", color: "#9b4dff", img: "images/domain-culture.png" },
  { abbr: "TK", color: "#00d4aa", img: "images/domain-tech.png" },
  { abbr: "IX", color: "#f26522", img: "images/domain-import.png" },
];

const APP_META = [
  {
    id: "be",
    emoji: "💳",
    name: "BéninExpense",
    color: "#00d4aa",
    webUrl: "https://app.enamimpactagency.com/login",
    mobileProject: "https://replit.com/@enamimpact/benin-expense-mobile",
    mobileComingSoon: false,
  },
  {
    id: "od",
    emoji: "🧠",
    name: "OpsDirector",
    color: "#1a7fff",
    webUrl: "https://ops.enamimpactagency.com/",
    mobileProject: "https://replit.com/@enamimpact/ops-mobile",
    mobileComingSoon: false,
  },
  {
    id: "bk",
    emoji: "🛍️",
    name: "Boutiko",
    color: "#f26522",
    webUrl: "https://boutiko.enamimpactagency.com/login",
    mobileProject: "https://boutiko.enamimpactagency.com/",
    mobileComingSoon: false,
  },
  {
    id: "mp",
    emoji: "🎵",
    name: "MelodiaPerTe",
    color: "#9b4dff",
    webUrl: "https://melodiaperte.enamimpactagency.com/",
    mobileProject: "https://replit.com/@enamimpact/melodia-mobile",
    mobileComingSoon: true,
  },
];

const NEWS_IMG = ["images/news-1.png", "images/news-2.png", "images/news-3.png"];
const NEWS_BIG = [true, false, false];

const STATS_DATA = [
  { value: 20, suffix: "+" },
  { value: 5,  suffix: "" },
  { value: 4,  suffix: "" },
  { value: 1,  suffix: "er" },
];

const LANG_FLAGS: Record<Lang, string> = { fr: "🇫🇷", en: "🇬🇧", pt: "🇧🇷" };
const LANG_LABELS: Record<Lang, string> = { fr: "FR", en: "EN", pt: "PT" };

/* ─── HOOKS ──────────────────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let val = 0;
    const step = Math.ceil(target / (duration / 16));
    const t = setInterval(() => {
      val += step;
      if (val >= target) { setCount(target); clearInterval(t); }
      else setCount(val);
    }, 16);
    return () => clearInterval(t);
  }, [active, target, duration]);
  return count;
}

function useMouse() {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  useEffect(() => {
    const h = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return pos;
}

/* ─── COMPONENTS ─────────────────────────────────────────────────────── */
function StatItem({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, visible } = useInView(0.5);
  const count = useCountUp(value, visible);
  return (
    <div ref={ref} className="stat-item">
      <div className="stat-number">{count}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function RevealBlock({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={`reveal-block ${visible ? "revealed" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateZ(6px)`;
  }, []);
  const onLeave = useCallback(() => {
    if (cardRef.current) cardRef.current.style.transform = "";
  }, []);
  return (
    <div ref={cardRef} className={`tilt-card ${className}`} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
}

function HeroSlider() {
  const base = import.meta.env.BASE_URL;
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCur(c => (c + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <div className="hero-slides">
        {HERO_SLIDES.map((s, i) => (
          <div key={i} className={`hero-slide ${i === cur ? "active" : ""}`} style={{ backgroundImage: `url(${base}${s.img})` }} />
        ))}
      </div>
      <div className="hero-indicators">
        {HERO_SLIDES.map((_, i) => (
          <button key={i} className={`hero-dot ${i === cur ? "active" : ""}`} onClick={() => setCur(i)} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
    </>
  );
}

function LangSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="lang-switcher">
      {(["fr", "en", "pt"] as Lang[]).map(l => (
        <button
          key={l}
          className={`lang-btn ${lang === l ? "lang-btn--active" : ""}`}
          onClick={() => setLang(l)}
          aria-label={l.toUpperCase()}
        >
          <span className="lang-flag">{LANG_FLAGS[l]}</span>
          <span className="lang-code">{LANG_LABELS[l]}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── APP CARD ────────────────────────────────────────────────────────── */
function AppCard({ app, t }: { app: typeof APP_META[number]; t: any; i: number }) {
  const idx = APP_META.findIndex(a => a.id === app.id);
  const appT = t.solutions.apps[idx];
  return (
    <TiltCard className="app-card app-card--expanded">
      <div className="app-card-top">
        <div className="app-icon" style={{ "--app-color": app.color } as React.CSSProperties}>
          {app.emoji}
        </div>
        <div className="app-info">
          <div className="app-name">{app.name}</div>
          <div className="app-sub" style={{ color: app.color }}>{appT.sub}</div>
          <div className="app-desc">{appT.desc}</div>
        </div>
      </div>
      <div className="app-platforms">
        <a
          href={app.webUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="app-platform-btn"
          style={{ "--app-color": app.color, background: app.color } as React.CSSProperties}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          {t.solutions.webApp}
        </a>
        <a
          href={app.mobileProject}
          target="_blank"
          rel="noopener noreferrer"
          className={`app-platform-btn app-platform-btn--mobile ${app.mobileComingSoon ? "app-platform-btn--soon" : ""}`}
          style={{ "--app-color": app.color } as React.CSSProperties}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
          {app.mobileComingSoon ? t.solutions.mobileSoon : t.solutions.mobileApp}
        </a>
      </div>
      <div className="app-glow" style={{ background: app.color }} />
    </TiltCard>
  );
}

/* ─── MAIN APP ───────────────────────────────────────────────────────── */
export default function App() {
  const base = import.meta.env.BASE_URL;
  const [lang, setLang] = useState<Lang>("fr");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("accueil");
  const mouse = useMouse();
  const t = T[lang];

  const NAV_ITEMS = [
    { label: t.nav.home, href: "#accueil" },
    { label: t.nav.about, href: "#a-propos" },
    { label: t.nav.activities, href: "#activites" },
    { label: t.nav.solutions, href: "#solutions" },
    { label: t.nav.news, href: "#actualites" },
    { label: t.nav.contact, href: "#contact" },
  ];

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const sections = NAV_ITEMS.map(n => n.href.slice(1));
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="site-root">
      {/* Cursor glow */}
      <div className="cursor-glow" style={{ left: mouse.x - 200, top: mouse.y - 200 }} />

      {/* ── NAV ── */}
      <header className={`site-nav ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="nav-inner">
          <a href="#accueil" className="nav-brand">
            <div className="brand-logo-wrap">
              <img src={`${base}enam-logo.png`} alt="Enam" className="brand-logo" />
            </div>
            <div className="brand-text">
              <span className="brand-name">Enam Impact Agency <em>SARL</em></span>
              <span className="brand-sub">Cotonou, Bénin</span>
            </div>
          </a>

          <nav className="nav-links">
            {NAV_ITEMS.map(l => (
              <a key={l.href} href={l.href} className={`nav-link ${activeSection === l.href.slice(1) ? "nav-link--active" : ""}`}>
                {l.label}
              </a>
            ))}
          </nav>

          <LangSwitcher lang={lang} setLang={setLang} />
          <a href="#contact" className="nav-cta">{t.nav.cta}</a>

          <button className="nav-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span className={menuOpen ? "open" : ""} />
            <span className={menuOpen ? "open" : ""} />
            <span className={menuOpen ? "open" : ""} />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? "mobile-menu--open" : ""}`}>
        {NAV_ITEMS.map(l => (
          <a key={l.href} href={l.href} className="mobile-link" onClick={() => setMenuOpen(false)}>
            {l.label}
          </a>
        ))}
        <LangSwitcher lang={lang} setLang={setLang} />
        <a href="#contact" className="btn-primary mt-8 self-start" onClick={() => setMenuOpen(false)}>
          {t.nav.cta}
        </a>
      </div>

      {/* ── HERO ── */}
      <section id="accueil" className="hero">
        <HeroSlider />
        <div className="hero-grid-bg" />
        <div className="hero-orb hero-orb--1" />
        <div className="hero-orb hero-orb--2" />
        <div className="hero-orb hero-orb--3" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            {t.hero.badge}
          </div>

          <h1 className="hero-title">
            <span className="hero-line" style={{ animationDelay: "0.1s" }}>
              <em className="hero-verb">{t.hero.v1}</em>
              <span className="hero-rest">{t.hero.rest1}</span>
            </span>
            <span className="hero-line" style={{ animationDelay: "0.35s" }}>
              <em className="hero-verb">{t.hero.v2}</em>
              <span className="hero-rest">{t.hero.rest2}</span>
            </span>
            <span className="hero-line" style={{ animationDelay: "0.6s" }}>
              <em className="hero-verb">{t.hero.v3}</em>
              <span className="hero-rest">{t.hero.rest3}</span>
            </span>
          </h1>

          <p className="hero-sub" style={{ animationDelay: "0.9s" }}>
            {t.hero.sub}
          </p>

          <div className="hero-actions" style={{ animationDelay: "1.1s" }}>
            <a href="#solutions" className="btn-primary">
              {t.hero.cta1}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#a-propos" className="btn-ghost">{t.hero.cta2}</a>
          </div>
        </div>

        <div className="hero-scroll-hint">
          <div className="scroll-mouse"><div className="scroll-wheel" /></div>
          <span>{t.hero.scroll}</span>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats-ribbon">
        <div className="stats-inner">
          {STATS_DATA.map((s, i) => (
            <StatItem key={i} value={s.value} suffix={s.suffix} label={t.stats[i].label} />
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="a-propos" className="section about-section">
        <div className="about-layout">
          <RevealBlock className="about-photo-col" delay={0}>
            <div className="founder-frame">
              <img src={`${base}julien-tomegah.png`} alt="Julien TOMEGAH" className="founder-photo" />
              <div className="founder-card">
                <div className="founder-card-name">Julien TOMEGAH</div>
                <div className="founder-card-title">{t.about.founderTitle}</div>
                <div className="founder-tags">
                  {t.about.tags.map((tag, i) => <span key={i}>{tag}</span>)}
                </div>
              </div>
              <div className="founder-accent" />
            </div>
          </RevealBlock>

          <div className="about-text-col">
            <RevealBlock delay={100}>
              <p className="section-eyebrow">{t.about.eyebrow}</p>
              <h2 className="section-title">
                {t.about.title1}<br /><span className="text-orange">{t.about.title2}</span>
              </h2>
              <p className="section-body">{t.about.body}</p>
            </RevealBlock>

            <div className="pillars-list">
              {t.pillars.map((p, i) => (
                <RevealBlock key={i} delay={150 + i * 80} className="pillar-item">
                  <div className="pillar-num">0{i + 1}</div>
                  <div className="pillar-body">
                    <div className="pillar-title">{p.title}</div>
                    <div className="pillar-desc">{p.desc}</div>
                  </div>
                </RevealBlock>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DOMAINS ── */}
      <section id="activites" className="section domains-section">
        <div className="section-container">
          <RevealBlock className="text-center mb-16">
            <p className="section-eyebrow">{t.domains.eyebrow}</p>
            <h2 className="section-title">
              {t.domains.title1}<br /><span className="text-orange">{t.domains.title2}</span>
            </h2>
          </RevealBlock>

          <div className="domains-grid">
            {DOMAIN_META.map((d, i) => (
              <RevealBlock key={i} delay={i * 80}>
                <TiltCard className="domain-card">
                  <img src={`${base}${d.img}`} alt={t.domains.items[i].label} className="domain-img" />
                  <div className="domain-abbr" style={{ color: d.color }}>{d.abbr}</div>
                  <div className="domain-line" style={{ background: d.color }} />
                  <div className="domain-label">{t.domains.items[i].label}</div>
                  <div className="domain-desc">{t.domains.items[i].desc}</div>
                  <div className="domain-glow" style={{ background: d.color }} />
                </TiltCard>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTIONS ── */}
      <section id="solutions" className="section solutions-section">
        <div className="section-container">
          <RevealBlock className="solutions-header">
            <div>
              <p className="section-eyebrow">{t.solutions.eyebrow}</p>
              <h2 className="section-title">
                {t.solutions.title1}<br /><span className="text-orange">{t.solutions.title2}</span>
              </h2>
            </div>
            <p className="solutions-sub">{t.solutions.sub}</p>
          </RevealBlock>

          <div className="apps-grid apps-grid--2col">
            {APP_META.map((app, i) => (
              <RevealBlock key={app.id} delay={i * 100}>
                <AppCard app={app} t={t} i={i} />
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWS ── */}
      <section id="actualites" className="section news-section">
        <div className="section-container">
          <RevealBlock className="text-center mb-16">
            <p className="section-eyebrow">{t.news.eyebrow}</p>
            <h2 className="section-title">
              {t.news.title1} <span className="text-orange">{t.news.title2}</span>
            </h2>
          </RevealBlock>

          <div className="news-grid">
            {t.news.items.map((n, i) => (
              <RevealBlock key={i} delay={i * 120} className={NEWS_BIG[i] ? "news-big" : ""}>
                <div className="news-card">
                  <img src={`${base}${NEWS_IMG[i]}`} alt={n.title} className="news-img-real"
                    style={{ height: NEWS_BIG[i] ? "280px" : "220px" }} />
                  <div className="news-body">
                    <div className="news-meta">
                      <span className="news-cat">{n.cat}</span>
                      <span className="news-date">{n.date}</span>
                    </div>
                    <div className="news-title">{n.title}</div>
                    <div className="news-desc">{n.desc}</div>
                    <span className="news-read">{t.news.readMore}</span>
                  </div>
                </div>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="section contact-section">
        <div className="contact-layout">
          <RevealBlock className="contact-left">
            <p className="section-eyebrow">{t.contact.eyebrow}</p>
            <h2 className="section-title">
              {t.contact.title1}<br /><span className="text-orange">{t.contact.title2}</span>
            </h2>
            <p className="section-body">{t.contact.body}</p>
            <div className="contact-info">
              {[
                { icon: "📍", label: t.contact.address, val: t.contact.addressVal },
                { icon: "✉️", label: t.contact.email, val: "contact@enamimpactagency.com" },
                { icon: "📱", label: t.contact.phone, val: "+229 00 00 00 00" },
              ].map((c, i) => (
                <div key={i} className="contact-row">
                  <div className="contact-icon">{c.icon}</div>
                  <div>
                    <div className="contact-label">{c.label}</div>
                    <div className="contact-val">{c.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </RevealBlock>

          <RevealBlock className="contact-right" delay={200}>
            <form className="contact-form" onSubmit={e => e.preventDefault()}>
              <h3 className="form-title">{t.contact.formTitle}</h3>
              <div className="form-row">
                <div className="form-field">
                  <label>{t.contact.name}</label>
                  <input type="text" placeholder={t.contact.namePh} />
                </div>
                <div className="form-field">
                  <label>{t.contact.email}</label>
                  <input type="email" placeholder={t.contact.emailPh} />
                </div>
              </div>
              <div className="form-field">
                <label>{t.contact.subject}</label>
                <input type="text" placeholder={t.contact.subjectPh} />
              </div>
              <div className="form-field">
                <label>{t.contact.message}</label>
                <textarea rows={4} placeholder={t.contact.messagePh} />
              </div>
              <button type="submit" className="btn-primary w-full justify-center">
                {t.contact.send}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </form>
          </RevealBlock>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-logo-wrap brand-logo-wrap--sm">
              <img src={`${base}enam-logo.png`} alt="Enam" className="brand-logo" style={{ height: "32px" }} />
            </div>
            <span>Enam Impact Agency <strong>SARL</strong></span>
          </div>
          <div className="footer-slogan">{t.footer.slogan}</div>
          <div className="footer-copy">© {new Date().getFullYear()} Enam Impact Agency SARL · {t.footer.rights}</div>
        </div>
      </footer>
    </div>
  );
}
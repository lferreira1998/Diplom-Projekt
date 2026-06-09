import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ToolPreview } from "./components/ToolPreview";
import { ToolLaunchModal } from "./components/ToolLaunchModal";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useNavigate, useLocation } from "react-router";
import { deleteNewTool, getAllNewTools, type NewToolData, type NewToolParams } from "./utils/storage";
import TopNav from "./components/TopNav";

const FONT_SERIF = "'az-serif', serif";
const FONT_CMP_SERIF = "'az-cond', serif";
const FONT_SANS = "'az-sans', sans-serif";

// Dotted-underline inline link used in the hero call-to-action sentence.
const HERO_LINK: CSSProperties = {
  textDecoration: "underline",
  textDecorationStyle: "dotted",
  textUnderlineOffset: "3px",
  cursor: "pointer",
};

type Theme = {
  bg: string;
  panelBg: string;
  toolBg: string;
  border: string;
  text: string;
  muted: string;
  headline: string;
  dotGrid: string;
};

function getTheme(dark: boolean): Theme {
  if (dark) {
    return {
      bg: "#1a1918",
      panelBg: "#252321",
      toolBg: "#252321",
      border: "rgba(240,232,220,0.18)",
      text: "#f0e8dc",
      muted: "rgba(240,232,220,0.5)",
      headline: "#f0e8dc",
      dotGrid: "radial-gradient(circle, rgba(240,232,220,0.10) 1px, transparent 1.2px)",
    };
  }
  return {
    bg: "#fcf6ef",
    panelBg: "#f3ebe0",
    toolBg: "#f9f1e8",
    border: "#a4a4a4",
    text: "#555555",
    muted: "#9a9daa",
    headline: "#302e2c",
    dotGrid: "radial-gradient(circle, rgba(164,164,164,0.7) 1px, transparent 1.2px)",
  };
}

const ThemeContext = createContext<Theme>(getTheme(false));
const DarkContext  = createContext(false);

function getSessionId(): string {
  const key = "diplom_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function ToolShape({ label, style, textStyle, href, videoLight, videoDark, bgLight, bgDark, videoFit = "cover" }: {
  label: string;
  style: CSSProperties;
  textStyle?: CSSProperties;
  href: string;
  videoLight: string;
  videoDark: string;
  bgLight?: string;
  bgDark?: string;
  videoFit?: "cover" | "contain";
}) {
  const dark = useContext(DarkContext);
  const theme = useContext(ThemeContext);
  const navigate = useNavigate();
  const videoName = dark ? videoDark : videoLight;
  const bg = dark ? (bgDark ?? theme.panelBg) : (bgLight ?? theme.panelBg);
  return (
    <button
      onClick={() => navigate(href)}
      style={{
        position: "absolute",
        border: `1px dashed ${theme.border}`,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        cursor: "pointer",
        outline: "none",
        padding: 0,
        boxSizing: "border-box",
        color: theme.text,
        ...style,
      }}
    >
      <ToolPreview
        videoName={videoName}
        dark={dark}
        style={{ position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.25s ease", objectFit: videoFit }}
      />
      <span style={{ position: "relative", zIndex: 1, fontFamily: FONT_SANS, fontSize: "17px", lineHeight: 1, color: theme.text, pointerEvents: "none", ...textStyle }}>{label}</span>
      <style>{`
        button:hover video { opacity: 1 !important; }
        button:hover span { opacity: 0; }
      `}</style>
    </button>
  );
}

type CardShape = "without-stopping" | "uninvited-thoughts" | "off-the-grid" | "blind-then-witness" | "visible-corrections" | "in-a-spiral";

const CARD_SHAPE_DEFS: Record<CardShape, { label: { en: string; de: string }; bgLight: string; bgDark: string; borderRadius: string; videoLight: string; videoDark: string; videoFit?: "cover" | "contain" }> = {
  "without-stopping": {
    label: { en: "...without stopping", de: "...ohne aufzuhören" },
    bgLight: "#fbf5eb", bgDark: "#3e3e3e", borderRadius: "999px",
    videoLight: "without-stopping-light", videoDark: "without-stopping-dark", videoFit: "cover",
  },
  "uninvited-thoughts": {
    label: { en: "...uninvited thoughts", de: "...ungefragte Gedanken" },
    bgLight: "#eaf8f5", bgDark: "#1f2f29", borderRadius: "4px",
    videoLight: "uninvited-thoughts-light", videoDark: "uninvited-thoughts-dark",
  },
  "off-the-grid": {
    label: { en: "...off the grid", de: "...außerhalb des Rasters" },
    bgLight: "#fff0f4", bgDark: "#37262d", borderRadius: "4px",
    videoLight: "off-the-grid-light", videoDark: "off-the-grid-dark",
  },
  "blind-then-witness": {
    label: { en: "...blind & then witness", de: "...blind und dann Zeuge" },
    bgLight: "#ecf7ee", bgDark: "#222d26", borderRadius: "999px",
    videoLight: "blind-then-witness-light", videoDark: "blind-then-witness-dark",
  },
  "visible-corrections": {
    label: { en: "...with visible corrections", de: "...mit sichtbaren Korrekturen" },
    bgLight: "#f5f6ea", bgDark: "#2f2836", borderRadius: "40px 4px 40px 4px",
    videoLight: "visible-corrections-light", videoDark: "visible-corrections-dark",
  },
  "in-a-spiral": {
    label: { en: "...in a spiral", de: "...in einer Spirale" },
    bgLight: "#ecf4fe", bgDark: "#242c38", borderRadius: "999px",
    videoLight: "in-a-spiral-light", videoDark: "in-a-spiral-dark", videoFit: "cover",
  },
};

const PRESET_META: { id: CardShape; desc: { en: string; de: string } }[] = [
  { id: "without-stopping", desc: { en: "Keep writing. The cursor does not wait for you.", de: "Schreib weiter. Der Cursor wartet nicht auf dich." } },
  { id: "uninvited-thoughts", desc: { en: "Follow the moving dot. Catch thoughts as they appear.", de: "Folge dem Punkt. Fang Gedanken, wenn sie auftauchen." } },
  { id: "off-the-grid", desc: { en: "Words leave the line and drift through the page.", de: "Wörter verlassen die Linie und treiben über die Seite." } },
  { id: "blind-then-witness", desc: { en: "Write without seeing. Watch yourself afterwards.", de: "Schreib ohne zu sehen. Beobachte dich danach selbst." } },
  { id: "visible-corrections", desc: { en: "Correcting leaves traces. Deleted text is covered, not removed.", de: "Korrigieren hinterlässt Spuren. Gelöschtes wird überdeckt, nicht entfernt." } },
  { id: "in-a-spiral", desc: { en: "Your text winds inward in a spiral.", de: "Dein Text windet sich nach innen." } },
];

const EXPLORE_SLOTS = [
  { left: 40, top: 197, width: 236, height: 233, rotate: 5.1, borderRadius: "999px" },
  { left: 420, top: 57, width: 241, height: 182, rotate: -9.25, borderRadius: "4px" },
  { left: 1220, top: 112, width: 251, height: 163, rotate: 4.18, borderRadius: "4px" },
  { left: 213, top: 579, width: 324, height: 163, rotate: 6.45, borderRadius: "999px" },
  { left: 774, top: 550, width: 363, height: 174, rotate: -2.5, borderRadius: "40px 4px 40px 4px" },
  { left: 1321, top: 414, width: 211, height: 309, rotate: 12.11, borderRadius: "999px" },
];

function inferCardShape(tool: NewToolData): CardShape {
  const shape = (tool.params as any)?.cardShape;
  if (shape && shape in CARD_SHAPE_DEFS) return shape;
  const key = `${tool.name} ${tool.description}`.toLowerCase();
  if (key.includes("spiral")) return "in-a-spiral";
  if (key.includes("visible") || key.includes("correction") || key.includes("tipp")) return "visible-corrections";
  if (key.includes("blind") || key.includes("witness")) return "blind-then-witness";
  if (key.includes("grid")) return "off-the-grid";
  if (key.includes("uninvited")) return "uninvited-thoughts";
  return "without-stopping";
}

function UserToolShape({ tool, style, textStyle, dark, onClick }: { tool: NewToolData; style: CSSProperties; textStyle?: CSSProperties; dark: boolean; onClick: () => void }) {
  const theme = useContext(ThemeContext);
  const shape = inferCardShape(tool);
  const def = CARD_SHAPE_DEFS[shape];
  const previewUrl = (tool.params as any)?.previewVideoUrl ?? (tool.params as any)?.preview_video_url ?? (tool.params as any)?.previewVideo;
  return (
    <button onClick={onClick} style={{ position: "absolute", border: `1px dashed ${theme.border}`, background: dark ? def.bgDark : def.bgLight, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", outline: "none", padding: 0, boxSizing: "border-box", color: theme.text, ...style }}>
      {previewUrl ? (
        <video src={previewUrl} autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0, transition: "opacity 0.25s ease" }} />
      ) : (
        <ToolPreview videoName={dark ? def.videoDark : def.videoLight} dark={dark} style={{ position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.25s ease", objectFit: def.videoFit ?? "cover" }} />
      )}
      <span style={{ position: "relative", zIndex: 1, fontFamily: FONT_SANS, fontSize: "17px", lineHeight: 1, color: theme.text, pointerEvents: "none", textAlign: "center", padding: "0 18px", ...textStyle }}>{tool.name}</span>
      <style>{`button:hover video { opacity: 1 !important; } button:hover span { opacity: 0; }`}</style>
    </button>
  );
}

function getAuthorSession(tool: NewToolData): string | undefined {
  const params: any = tool.params ?? {};
  return tool.userSession ?? tool.sessionId ?? tool.user_session ?? params.userSession ?? params.sessionId ?? params.user_session;
}

function usePersistentSessionId() {
  const [sessionId, setSessionId] = useState<string>(() => {
    try { return getSessionId(); } catch { return ""; }
  });
  useEffect(() => { if (!sessionId) setSessionId(getSessionId()); }, [sessionId]);
  return sessionId;
}

function usePlaygroundData() {
  const sessionId = usePersistentSessionId();
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<NewToolData[]>([]);
  const [lang, setLangState] = useState<"de" | "en">(() => (localStorage.getItem("appLang") as "de" | "en") ?? "en");
  const [dark, setDarkState] = useState<boolean>(() => localStorage.getItem("appTheme") === "dark");
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("favoriteTools") || "[]")); } catch { return new Set(); }
  });

  const setLang = (fn: (l: "de" | "en") => "de" | "en") => {
    setLangState(l => { const next = fn(l); localStorage.setItem("appLang", next); return next; });
  };
  const setDark = (fn: (d: boolean) => boolean) => {
    setDarkState(d => { const next = fn(d); localStorage.setItem("appTheme", next ? "dark" : "light"); return next; });
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const all = await getAllNewTools();
        if (alive) setTools(all);
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const myTools = useMemo(() => tools.filter(t => getAuthorSession(t) === sessionId), [tools, sessionId]);
  const favoriteTools = useMemo(() => tools.filter(t => favorites.has(t.id)), [tools, favorites]);
  const myToolsAll = useMemo(() => {
    const map = new Map<string, NewToolData>();
    [...myTools, ...favoriteTools].forEach(t => map.set(t.id, t));
    return Array.from(map.values());
  }, [myTools, favoriteTools]);
  const publicTools = useMemo(() => tools.filter(t => getAuthorSession(t) !== sessionId), [tools, sessionId]);

  useEffect(() => {
    localStorage.setItem("hasOwnTools", myToolsAll.length > 0 ? "true" : "false");
  }, [myToolsAll.length]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("favoriteTools", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const navigate = useNavigate();
  const navigateToTool = (id: string, minutes?: number) => {
    const suffix = minutes && minutes > 0 ? `&minutes=${minutes}` : "";
    navigate(`/create-tool?tool=${id}${suffix}`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this tool?")) return;
    await deleteNewTool(id);
    setTools(prev => prev.filter(t => t.id !== id));
    setFavorites(prev => { const next = new Set(prev); next.delete(id); localStorage.setItem("favoriteTools", JSON.stringify(Array.from(next))); return next; });
  };

  return { sessionId, loading, lang, setLang, dark, setDark, favorites, toggleFavorite, myToolsAll, publicTools, tools, navigateToTool, handleDelete };
}

function SkeletonGrid({ title, dark }: { title: string; dark: boolean }) {
  const theme = useContext(ThemeContext);
  return (
    <section>
      <h2 style={{ fontFamily: FONT_SERIF, fontSize: "34px", margin: "0 0 24px", color: theme.headline }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height: 260, border: `1px dashed ${theme.border}`, borderRadius: 16, background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.35)", opacity: 0.7 }} />
        ))}
      </div>
    </section>
  );
}

function ToolCard({ tool, onOpen, onDelete, sessionId, favorites, onToggleFavorite, DE }: {
  tool: NewToolData;
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
  sessionId: string;
  favorites: Set<string>;
  onToggleFavorite?: (id: string) => void;
  DE: boolean;
}) {
  const theme = useContext(ThemeContext);
  const dark = useContext(DarkContext);
  const shape = inferCardShape(tool);
  const def = CARD_SHAPE_DEFS[shape];
  const own = getAuthorSession(tool) === sessionId;
  const fav = favorites.has(tool.id);
  const previewUrl = (tool.params as any)?.previewVideoUrl ?? (tool.params as any)?.preview_video_url ?? (tool.params as any)?.previewVideo;
  return (
    <div style={{ position: "relative", minHeight: 340, paddingTop: 20, transform: `translateY(${(Math.abs(tool.id.charCodeAt(0) % 4) * 8)}px)` }}>
      <button onClick={() => onOpen(tool.id)} style={{ width: "100%", height: 260, border: `1px dashed ${theme.border}`, borderRadius: def.borderRadius, background: dark ? def.bgDark : def.bgLight, position: "relative", overflow: "hidden", cursor: "pointer", outline: "none", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        {previewUrl ? (
          <video src={previewUrl} autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0, transition: "opacity 0.25s ease" }} />
        ) : (
          <ToolPreview videoName={dark ? def.videoDark : def.videoLight} dark={dark} style={{ position: "absolute", inset: 0, opacity: 0, transition: "opacity 0.25s ease", objectFit: def.videoFit ?? "cover" }} />
        )}
        <span style={{ position: "relative", zIndex: 1, fontFamily: FONT_SANS, fontSize: 18, color: theme.text, textAlign: "center" }}>{tool.name || def.label.en}</span>
        <style>{`button:hover video { opacity: 1 !important; } button:hover span { opacity: 0; }`}</style>
      </button>
      <div style={{ marginTop: 14, padding: "0 4px" }}>
        <h3 style={{ margin: 0, fontFamily: FONT_SERIF, fontSize: 24, lineHeight: "28px", color: theme.headline }}>{tool.name || (DE ? "Unbenannt" : "Untitled")}</h3>
        {tool.description && <p style={{ margin: "7px 0 0", fontFamily: FONT_SANS, fontSize: 14, lineHeight: "19px", color: theme.muted }}>{tool.description}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
          {onToggleFavorite && <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(tool.id); }} style={{ border: `1px dashed ${theme.border}`, borderRadius: 999, background: "transparent", color: theme.text, padding: "6px 12px", fontFamily: FONT_SANS, cursor: "pointer" }}>{fav ? (DE ? "Gespeichert" : "Saved") : (DE ? "Merken" : "Add to My Tools")}</button>}
          {own && onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(tool.id); }} style={{ border: "none", background: "transparent", color: theme.muted, fontFamily: FONT_SANS, cursor: "pointer" }}>{DE ? "Löschen" : "Delete"}</button>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, tools, onOpen, onDelete, emptyMsg, sessionId, favorites, onToggleFavorite, showCreate, tab, onTabChange, onSeeAll, DE }: {
  title: string;
  tools: NewToolData[];
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
  emptyMsg: string;
  sessionId: string;
  favorites: Set<string>;
  onToggleFavorite?: (id: string) => void;
  showCreate?: boolean;
  tab?: "all" | "my";
  onTabChange?: (tab: "all" | "my") => void;
  onSeeAll?: () => void;
  DE: boolean;
}) {
  const theme = useContext(ThemeContext);
  const navigate = useNavigate();
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: "34px", margin: 0, color: theme.headline }}>{title}</h2>
        {tab && onTabChange && (
          <div style={{ display: "flex", gap: 4, border: `1px dashed ${theme.border}`, borderRadius: 999, padding: 4 }}>
            <button onClick={() => onTabChange("all")} style={{ border: "none", borderRadius: 999, padding: "8px 16px", background: tab === "all" ? theme.headline : "transparent", color: tab === "all" ? "#fcf6ef" : theme.muted, fontFamily: FONT_SANS, cursor: "pointer" }}>{DE ? "Alle Tools" : "All Tools"}</button>
            <button onClick={() => onTabChange("my")} style={{ border: "none", borderRadius: 999, padding: "8px 16px", background: tab === "my" ? theme.headline : "transparent", color: tab === "my" ? "#fcf6ef" : theme.muted, fontFamily: FONT_SANS, cursor: "pointer" }}>{DE ? "Meine Tools" : "My Tools"}</button>
          </div>
        )}
      </div>
      {tools.length === 0 ? (
        <p style={{ fontFamily: FONT_SANS, color: theme.muted }}>{emptyMsg}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", columnGap: 42, rowGap: 58 }}>
          {tools.map(t => <ToolCard key={t.id} tool={t} onOpen={onOpen} onDelete={onDelete} sessionId={sessionId} favorites={favorites} onToggleFavorite={onToggleFavorite} DE={DE} />)}
        </div>
      )}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 52 }}>
        {onSeeAll && <button onClick={onSeeAll} style={{ border: `1px dashed ${theme.border}`, background: theme.toolBg, color: theme.text, borderRadius: 999, padding: "10px 20px", fontFamily: FONT_SANS, cursor: "pointer" }}>{DE ? "Alle Tools ansehen" : "Explore all tools"}</button>}
        {showCreate && <button onClick={() => navigate("/create-tool")} style={{ border: `1px dashed ${theme.border}`, background: theme.toolBg, color: theme.text, borderRadius: 999, padding: "10px 20px", fontFamily: FONT_SANS, cursor: "pointer" }}>{DE ? "Tool erstellen" : "Create Tool"}</button>}
      </div>
    </section>
  );
}

function HeroHeading({ DE, theme }: { DE: boolean; theme: Theme }) {
  const line1 = DE ? "Writing Tools formen, wie wir denken & schreiben." : "Writing Tools shape how we think & write.";
  const line2 = DE ? "Brich ihre Regeln, um dein Denken zu verändern." : "Break their rules to change your thinking.";
  return (
    <h1 style={{ margin: 0, textAlign: "center", fontFamily: FONT_CMP_SERIF, fontWeight: 500, fontSize: "48px", lineHeight: 1.22, color: theme.headline, letterSpacing: "0px" }}>
      <style>{`
        @keyframes _heroIn { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: none; } }
        @keyframes _toolIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      {line1}<br />{line2}
    </h1>
  );
}

function PageNavFAB({ dark, myToolsAll, DE, theme, loading, bottom = 40 }: { dark: boolean; myToolsAll: NewToolData[]; DE: boolean; theme: Theme; loading: boolean; bottom?: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMyPage = location.pathname.includes("my-tools");

  // During loading, fall back to the cached flag so the FAB stays visible
  // across page navigations instead of flickering off and back on.
  const hasOwnTools = loading
    ? localStorage.getItem("hasOwnTools") === "true"
    : myToolsAll.length > 0;
  if (!hasOwnTools) return null;

  const active = isMyPage ? "/my-tools" : "/tool-collection";

  return (
    <div style={{ position: "fixed", bottom: `${bottom}px`, left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", gap: "4px", background: theme.toolBg, border: `1px dashed ${theme.border}`, borderRadius: "100px", padding: "4px" }}>
      {([
        { path: "/my-tools", label: DE ? "Meine Tools" : "My Tools" },
        { path: "/tool-collection", label: DE ? "Alle Tools" : "All Tools" },
      ]).map(({ path, label }) => (
        <button key={path} onClick={() => navigate(path)} style={{ border: "none", borderRadius: "100px", cursor: "pointer", outline: "none", padding: "9px 20px", fontFamily: FONT_SANS, fontSize: "14px", background: active === path ? (dark ? theme.text : theme.headline) : "transparent", color: active === path ? theme.bg : theme.muted, transition: "background 0.15s, color 0.15s" }}>
          {label}
        </button>
      ))}
    </div>
  );
}


// ── Scroll-synced text reveal ─────────────────────────────────
// The paragraph starts in a light state and darkens word by word as it scrolls
// through the viewport — the reveal is tied directly to scroll progress.
const REVEAL_TEXT: { de: string[]; en: string[] } = {
  en: [
    "Shaping Thoughts asks how much our thinking is shaped by the tools we use to write.",
    "It began from observing thoughts as movement and structure, and noticing how different this is from writing, which fixes, orders, and stabilizes them.",
    "This tension made me question how much writing tools influence thought, so I looked at existing tools with different rules and began changing those rules myself.",
    "The goal is to make interface behavior visible and open up new ways of writing and thinking.",
  ],
  de: [
    "Shaping Thoughts fragt, wie sehr unser Denken von den Werkzeugen geprägt wird, mit denen wir schreiben.",
    "Es begann damit, Gedanken als Bewegung und Struktur zu beobachten und zu bemerken, wie anders das vom Schreiben ist, das sie fixiert, ordnet und stabilisiert.",
    "Diese Spannung ließ mich fragen, wie stark Schreibwerkzeuge das Denken beeinflussen. Also betrachtete ich bestehende Werkzeuge mit anderen Regeln und begann, diese Regeln selbst zu verändern.",
    "Das Ziel ist, das Verhalten von Interfaces sichtbar zu machen und neue Wege des Schreibens und Denkens zu eröffnen.",
  ],
};

function RevealWord({ children, progress, range, color }: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  color: string;
}) {
  const opacity = useTransform(progress, range, [0.28, 1]);
  return <motion.span style={{ opacity, color }}>{children}</motion.span>;
}

function ScrollReveal({ paragraphs, color, containerRef }: {
  paragraphs: string[];
  color: string;
  containerRef: RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    container: containerRef,
    target: ref,
    offset: ["start 0.6", "end 0.45"],
  });
  const wordArrays = paragraphs.map((p) => p.split(" "));
  const total = wordArrays.reduce((sum, a) => sum + a.length, 0);
  let idx = 0;
  return (
    <p
      ref={ref}
      style={{ margin: 0, width: 739, maxWidth: "100%", textAlign: "center", fontFamily: FONT_CMP_SERIF, fontWeight: 500, fontSize: "34px", lineHeight: 1.3 }}
    >
      {wordArrays.map((words, pi) => (
        <span key={pi}>
          {pi > 0 && <><br /><br /></>}
          {words.map((w, wi) => {
            const start = idx / total;
            const end = (idx + 1) / total;
            idx += 1;
            return (
              <RevealWord key={`${pi}-${wi}`} progress={scrollYProgress} range={[start, end]} color={color}>
                {wi < words.length - 1 ? `${w} ` : w}
              </RevealWord>
            );
          })}
        </span>
      ))}
    </p>
  );
}

// Floating "Create Tool" FAB: stays fixed at the bottom-right the whole time and
// its width grows with scroll progress — from a small circle at the top to a
// full-width pill at the bottom. It never navigates on its own; only a click opens
// the Create Tool page.
function CreateToolButton({ mainRef, dark, theme, DE }: {
  mainRef: RefObject<HTMLElement | null>;
  dark: boolean; theme: Theme; DE: boolean;
}) {
  const navigate = useNavigate();
  const [vpW, setVpW] = useState(1200);
  useEffect(() => {
    const update = () => setVpW(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const { scrollYProgress } = useScroll({ container: mainRef });
  const width = useTransform(scrollYProgress, [0, 1], [104, Math.max(104, vpW - 48)]);
  return (
    <motion.button
      onClick={() => navigate("/create-tool")}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 50,
        width,
        height: 104,
        borderRadius: 52,
        border: `1px dashed ${theme.border}`,
        background: dark ? theme.toolBg : "#fcf6ef",
        cursor: "pointer",
        outline: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_SANS,
        fontSize: "15px",
        color: theme.text,
        letterSpacing: "-0.15px",
        whiteSpace: "nowrap",
        boxSizing: "border-box",
      }}
    >
      {DE ? "Tool erstellen" : "Create Tool"}
    </motion.button>
  );
}

export default function PlaygroundNew({ variant = "intro" }: { variant?: "intro" | "collection" }) {
  const collectionOnly = variant === "collection";
  const { sessionId, loading, lang, setLang, dark, setDark, favorites, toggleFavorite, myToolsAll, publicTools, tools, navigateToTool, handleDelete } = usePlaygroundData();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const [exploreMode, setExploreMode] = useState(false);
  const [launchTool, setLaunchTool] = useState<NewToolData | null>(null);
  const [tab, setTab] = useState<"all" | "my">("all");

  const DE = lang === "de";

  const openTool = (id: string) => {
    if (id.startsWith("preset:")) { navigate(`/create-tool?preset=${id.slice(7)}`); return; }
    const t = tools.find(x => x.id === id) ?? null;
    setLaunchTool(t);
  };

  // Synthesize the six official experiments as tool cards (shape + video come
  // from cardShape; name + description are localized here).
  const presetTools = useMemo<NewToolData[]>(
    () => PRESET_META.map((p) => ({
      id: `preset:${p.id}`,
      savedAt: "",
      name: DE ? CARD_SHAPE_DEFS[p.id].label.de : CARD_SHAPE_DEFS[p.id].label.en,
      description: DE ? p.desc.de : p.desc.en,
      params: { source: "new", cardShape: p.id } as unknown as NewToolParams,
    })),
    [DE],
  );

  const theme = getTheme(dark);
  const displayedTools = tab === "all" ? [...presetTools, ...publicTools] : myToolsAll;

  return (
    <ThemeContext.Provider value={theme}>
    <DarkContext.Provider value={dark}>
      <TopNav current={collectionOnly ? "Playground" : "Introduction"} dark={dark} setDark={setDark} lang={lang} setLang={setLang} />
      <main ref={mainRef} style={{ minHeight: "100vh", height: "100vh", width: "100vw", overflowX: "hidden", overflowY: exploreMode ? "hidden" : "auto", position: "relative", backgroundColor: theme.bg, color: theme.text, fontFamily: FONT_SANS, WebkitOverflowScrolling: "touch" }}>
        <style>{`html, body, #root { height: 100%; overflow: hidden; }`}</style>

        {!collectionOnly && (
        <section aria-label="Writing tools playground" style={{ position: "relative", minHeight: "100vh", overflow: exploreMode ? "visible" : "hidden", background: "transparent" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 1680, height: 858, transform: exploreMode ? "translate(-50%, -50%) scale(0.88)" : "translate(-50%, -50%)", transition: "transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}>
            <div style={{ position: "absolute", inset: 0, animation: "_toolIn 1.2s ease-out 0.8s both" }}>
              <ToolShape label="...without stopping"      href="/create-tool?preset=without-stopping"    videoLight="without-stopping-light"    videoDark="without-stopping-dark"    bgLight="#fbf5eb" bgDark="#3e3e3e" videoFit="cover" style={{ left: 40,   top: 197, width: 236, height: 233, transform: "rotate(5.1deg)",   borderRadius: 200 }} textStyle={{ transform: "rotate(-5.1deg)" }} />
              <ToolShape label="...uninvited thoughts"    href="/create-tool?preset=uninvited-thoughts"  videoLight="uninvited-thoughts-light"  videoDark="uninvited-thoughts-dark"  bgLight="#eaf8f5" bgDark="#1f2f29" style={{ left: 420,  top: 57,  width: 241, height: 182, transform: "rotate(-9.25deg)", borderRadius: 4 }} textStyle={{ transform: "rotate(9.25deg)" }} />
              <ToolShape label="...off the grid"          href="/create-tool?preset=off-the-grid"        videoLight="off-the-grid-light"        videoDark="off-the-grid-dark"        bgLight="#fff0f4" bgDark="#37262d" style={{ left: 1220, top: 112, width: 251, height: 163, transform: "rotate(4.18deg)",  borderRadius: 4, justifyContent: "flex-start", alignItems: "flex-end", padding: 12 }} textStyle={{ transform: "rotate(-4.18deg)", marginBottom: 0 }} />
              <ToolShape label="...blind & then witness"  href="/create-tool?preset=blind-then-witness"  videoLight="blind-then-witness-light"  videoDark="blind-then-witness-dark"  bgLight="#ecf7ee" bgDark="#222d26" style={{ left: 213,  top: 579, width: 324, height: 163, transform: "rotate(6.45deg)",  borderRadius: 100 }} textStyle={{ transform: "rotate(-6.45deg)" }} />
              <ToolShape label="...with visible corrections" href="/create-tool?preset=visible-corrections" videoLight="visible-corrections-light" videoDark="visible-corrections-dark" bgLight="#f5f6ea" bgDark="#2f2836" style={{ left: 774,  top: 550, width: 363, height: 174, borderRadius: "40px 4px 40px 4px" }} />
              <ToolShape label="...in a spiral"           href="/create-tool?preset=in-a-spiral"         videoLight="in-a-spiral-light"         videoDark="in-a-spiral-dark"         bgLight="#ecf4fe" bgDark="#242c38" videoFit="cover" style={{ left: 1321, top: 414, width: 211, height: 309, transform: "rotate(12.11deg)", borderRadius: 200 }} textStyle={{ transform: "rotate(-12.11deg)" }} />
            </div>
            <div style={{ position: "absolute", left: 456, top: 300, width: 768, opacity: exploreMode ? 0 : 1, transition: "opacity 0.35s ease", pointerEvents: exploreMode ? "none" : "auto" }}>
              <HeroHeading DE={DE} theme={theme} />
            </div>
            <div style={{ position: "absolute", left: 456, top: 408, width: 768, display: "flex", justifyContent: "center", opacity: exploreMode ? 0 : 1, transition: "opacity 0.35s ease", pointerEvents: exploreMode ? "none" : "auto", animation: "_heroIn 1s ease-out 0.4s both" }}>
              <p style={{ margin: 0, width: 540, textAlign: "center", fontFamily: FONT_SANS, fontWeight: 300, fontSize: "17px", lineHeight: 1.3, color: dark ? theme.text : "#484643", letterSpacing: "-0.01em" }}>
                <span onClick={() => navigate("/create-tool")} style={HERO_LINK}>{DE ? "Erstelle" : "Create"}</span>
                {DE ? " und teile dein eigenes Tool. " : " and share your own tool. "}
                <span onClick={() => toolsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} style={HERO_LINK}>{DE ? "Probiere" : "Try"}</span>
                {DE ? " Tools von anderen." : " tools made by others."}
                <br />
                <span onClick={() => navigate("/about-the-project")} style={HERO_LINK}>{DE ? "Lies" : "Read"}</span>
                {DE ? " über das Projekt." : " about the project."}
              </p>
            </div>
            {exploreMode && myToolsAll.slice(0, EXPLORE_SLOTS.length).map((tool, i) => {
              const slot = EXPLORE_SLOTS[i];
              return (
                <UserToolShape
                  key={tool.id}
                  tool={tool}
                  dark={dark}
                  onClick={() => { setExploreMode(false); openTool(tool.id); }}
                  style={{
                    left: slot.left, top: slot.top,
                    width: slot.width, height: slot.height,
                    borderRadius: slot.borderRadius,
                    transform: `rotate(${slot.rotate}deg)`,
                    animation: `_toolIn 0.5s ease-out ${0.08 + i * 0.04}s both`,
                  }}
                  textStyle={{ transform: `rotate(${-slot.rotate}deg)` }}
                />
              );
            })}
          </div>
        </section>
        )}

        {!collectionOnly && !exploreMode && (
          <section style={{ display: "flex", justifyContent: "center", padding: "140px 24px 160px", boxSizing: "border-box" }}>
            <ScrollReveal
              paragraphs={DE ? REVEAL_TEXT.de : REVEAL_TEXT.en}
              color={theme.headline}
              containerRef={mainRef}
            />
          </section>
        )}

        <div ref={toolsRef} style={{ width: "100%", boxSizing: "border-box", padding: "96px 96px 192px" }}>
          {loading ? (
            <SkeletonGrid title={DE ? "Tool-Sammlung" : "Tool Collection"} dark={dark} />
          ) : (
            <Section
              title={DE ? "Tool-Sammlung" : "Tool Collection"}
              tools={collectionOnly ? displayedTools : displayedTools.slice(0, 8)}
              onOpen={openTool}
              onDelete={tab === "my" ? handleDelete : undefined}
              emptyMsg={tab === "all" ? (DE ? "Noch keine öffentlichen Tools vorhanden." : "No public tools yet.") : (DE ? "Noch keine eigenen Tools." : "No tools yet.")}
              sessionId={sessionId}
              favorites={favorites}
              onToggleFavorite={tab === "all" ? toggleFavorite : undefined}
              showCreate
              tab={collectionOnly ? tab : undefined}
              onTabChange={collectionOnly ? setTab : undefined}
              onSeeAll={collectionOnly ? undefined : () => navigate("/tool-collection")}
              DE={DE}
            />
          )}
        </div>
        {exploreMode && (
          <button
            onClick={() => setExploreMode(false)}
            style={{ position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", alignItems: "center", gap: 8, background: theme.toolBg, border: `1px dashed ${theme.border}`, borderRadius: 100, cursor: "pointer", outline: "none", padding: "9px 22px", fontFamily: FONT_SANS, fontSize: 14, color: theme.text, animation: "_heroIn 0.4s ease-out both" }}
          >
            ← {DE ? "Zurück" : "Back"}
          </button>
        )}
        <ToolLaunchModal
          tool={launchTool}
          dark={dark}
          onConfirm={(id, mins) => { setLaunchTool(null); navigateToTool(id, mins); }}
          onClose={() => setLaunchTool(null)}
        />
        {!exploreMode && <CreateToolButton mainRef={mainRef} dark={dark} theme={theme} DE={DE} />}
      </main>
    </DarkContext.Provider>
    </ThemeContext.Provider>
  );
}

export function MyToolsPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/tool-collection", { replace: true }); }, [navigate]);
  return null;
}

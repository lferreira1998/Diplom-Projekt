import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ToolPreview } from "./components/ToolPreview";
import { ToolLaunchModal } from "./components/ToolLaunchModal";
import type { CSSProperties, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { deleteNewTool, getAllNewTools, type NewToolData } from "./utils/storage";
import TopNav from "./components/TopNav";

const FONT_SERIF = "'az-serif', serif";
const FONT_CMP_SERIF = "'az-cond', serif";
const FONT_SANS = "'az-sans', sans-serif";

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

function ToolShape({ label, style, textStyle, href, videoLight, videoDark, videoFit = "cover" }: {
  label: string;
  style: CSSProperties;
  textStyle?: CSSProperties;
  href: string;
  videoLight: string;
  videoDark: string;
  videoFit?: "cover" | "contain";
}) {
  const theme = useContext(ThemeContext);
  const dark  = useContext(DarkContext);
  const video = dark ? videoDark : videoLight;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  function prepareVideo(target: HTMLVideoElement) {
    target.muted = true;
    target.defaultMuted = true;
    target.playsInline = true;
    if (target.readyState === 0) target.load();
  }

  useEffect(() => {
    const target = videoRef.current;
    if (!target) return;
    prepareVideo(target);
    const play = () => target.play().catch(() => undefined);
    play();
    if (target.readyState < 2) target.addEventListener("canplay", play, { once: true });
  }, [video]);

  return (
    <a
      className="playground-tool-shape"
      href={href}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        position: "absolute",
        border: `1px dashed ${theme.border}`,
        color: theme.text,
        textDecoration: "none",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_SANS,
        fontSize: 17,
        fontWeight: 400,
        lineHeight: "normal",
        background: theme.toolBg,
        overflow: "hidden",
        transformOrigin: "center",
        ...style,
      }}
    >
      <video
        key={video}
        ref={videoRef}
        muted
        loop
        playsInline
        preload="auto"
        onLoadedMetadata={(event) => prepareVideo(event.currentTarget)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: videoFit,
          opacity: hovered ? 0 : 1,
          transition: "opacity 120ms ease",
          pointerEvents: "none",
          transform: "translateZ(0)",
          zIndex: 0,
        }}
      >
        <source src={`/videos/${video}.webm`} type="video/webm" />
      </video>
      <span
        className="playground-tool-label"
        style={{
          position: "relative",
          zIndex: 1,
          opacity: hovered ? 1 : 0,
          transition: "opacity 120ms ease",
          ...textStyle,
        }}
      >
        {label}
      </span>
    </a>
  );
}

function HeartIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22 L6.5 12.5 A5.5 5.5 0 1 0 12 7 A5.5 5.5 0 1 0 17.5 12.5 Z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function ToolCard({ tool, onClick, onDelete, isFavorite, onToggleFavorite }: {
  tool: NewToolData;
  onClick: () => void;
  onDelete?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const theme = useContext(ThemeContext);
  const [hovered, setHovered] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleMouseLeave = () => {
    setHovered(false);
    setConfirming(false);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        border: `1px dashed ${hovered ? theme.text : theme.border}`,
        borderRadius: "8px",
        overflow: "hidden",
        background: theme.bg,
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.15s, transform 0.15s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {onDelete && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s",
            zIndex: 2,
          }}
        >
          {confirming ? (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", background: theme.toolBg, border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "4px 6px", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: "11px", color: theme.text, whiteSpace: "nowrap" }}>Löschen?</span>
              <button onClick={(event) => { event.stopPropagation(); onDelete(); }} style={{ height: "22px", padding: "0 9px", background: "#b43c3c", border: "none", borderRadius: "4px", cursor: "pointer", outline: "none", fontFamily: FONT_SANS, fontSize: "11px", color: "#fff" }}>Ja</button>
              <button onClick={(event) => { event.stopPropagation(); setConfirming(false); }} style={{ height: "22px", padding: "0 9px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "4px", cursor: "pointer", outline: "none", fontFamily: FONT_SANS, fontSize: "11px", color: theme.text }}>Nein</button>
            </div>
          ) : (
            <button onClick={(event) => { event.stopPropagation(); setConfirming(true); }} title="Aus meinen Tools entfernen" style={{ width: "24px", height: "24px", background: theme.toolBg, border: `1px dashed ${theme.border}`, borderRadius: "50%", cursor: "pointer", outline: "none", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, fontSize: "13px", color: theme.muted, lineHeight: 1 }}>x</button>
          )}
        </div>
      )}
      {onToggleFavorite && (
        <button
          onClick={(event) => { event.stopPropagation(); onToggleFavorite(); }}
          title={isFavorite ? "Aus My Tools entfernen" : "Zu My Tools hinzufügen"}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            zIndex: 2,
            width: "28px",
            height: "28px",
            background: theme.toolBg,
            border: `1px dashed ${theme.border}`,
            borderRadius: "50%",
            cursor: "pointer",
            outline: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HeartIcon filled={!!isFavorite} color={isFavorite ? "#d4607a" : theme.muted} />
        </button>
      )}
      <div onClick={onClick} style={{ width: "100%", aspectRatio: "3 / 2", overflow: "hidden", flexShrink: 0, cursor: "pointer" }}>
        <ToolPreview tool={tool} active={hovered} dark={theme.bg === "#484848"} />
      </div>
      <div onClick={onClick} style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "5px", cursor: "pointer" }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: "19px", color: theme.text, lineHeight: "1.25", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {tool.name || "Unnamed Tool"}
        </span>
        <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: theme.muted, lineHeight: "1.45", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden", minHeight: "37px", visibility: tool.description ? "visible" : "hidden" }}>
          {tool.description || " "}
        </span>
      </div>
    </div>
  );
}

// Cross-fades each card in as it scrolls into view (subtle, once, no slide)
function Reveal({ children, index = 0 }: { children: ReactNode; index?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const delay = (index % 3) * 0.06;
  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transition: `opacity 0.5s ease ${delay}s`,
        willChange: "opacity",
      }}
    >
      {children}
    </div>
  );
}

function Section({ title, tools, onOpen, onDelete, emptyMsg, sessionId, favorites, onToggleFavorite, showCreate }: {
  title: string;
  tools: NewToolData[];
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
  emptyMsg: string;
  sessionId: string;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  showCreate?: boolean;
}) {
  const theme = useContext(ThemeContext);
  const navigate = useNavigate();
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", borderBottom: `1px dashed ${theme.border}`, paddingBottom: "12px" }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: "28px", color: theme.text }}>{title}</span>
        <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: theme.muted }}>{tools.length}</span>
        {showCreate && (
          <button
            onClick={() => navigate("/create-tool")}
            style={{
              marginLeft: "auto",
              alignSelf: "center",
              padding: "6px 14px",
              border: `1px dashed ${theme.border}`,
              borderRadius: "4px",
              background: "transparent",
              fontFamily: FONT_SANS, fontSize: "13px",
              color: theme.muted,
              cursor: "pointer", outline: "none",
              whiteSpace: "nowrap",
            }}
          >
            + Create your own tool
          </button>
        )}
      </div>
      {tools.length === 0 ? (
        <p style={{ fontFamily: FONT_SANS, fontSize: "14px", color: theme.muted, margin: 0 }}>{emptyMsg}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {tools.map((tool, i) => {
            const owned = tool.params.sessionId === sessionId;
            return (
              <Reveal key={tool.id} index={i}>
                <ToolCard
                  tool={tool}
                  onClick={() => onOpen(tool.id)}
                  onDelete={owned && onDelete ? () => onDelete(tool.id) : undefined}
                  isFavorite={favorites?.includes(tool.id)}
                  onToggleFavorite={!owned && onToggleFavorite ? () => onToggleFavorite(tool.id) : undefined}
                />
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Skeleton placeholders shown while tools load ──────────────────────────────
function SkeletonCard({ hue, dark, delay }: { hue: number; dark: boolean; delay: number }) {
  const theme = useContext(ThemeContext);
  // Very subtle, low-chroma tint of the Look & Feel hue
  const block = dark ? `oklch(40% 0.016 ${hue})` : `oklch(94.5% 0.016 ${hue})`;
  const bar   = dark ? `oklch(37% 0.010 ${hue})` : `oklch(93% 0.010 ${hue})`;
  return (
    <div
      style={{
        border: `1px dashed ${theme.border}`,
        borderRadius: "8px",
        overflow: "hidden",
        background: theme.bg,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        animation: `_skelIn 0.5s ease-out ${delay}s both, _skelPulse 1.9s ease-in-out ${delay + 0.5}s infinite`,
      }}
    >
      <div style={{ width: "100%", aspectRatio: "3 / 2", background: block, flexShrink: 0 }} />
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "9px" }}>
        <div style={{ height: "14px", width: "58%", borderRadius: "4px", background: bar }} />
        <div style={{ height: "11px", width: "86%", borderRadius: "4px", background: bar }} />
      </div>
    </div>
  );
}

function SkeletonGrid({ title, dark, rows = 3 }: { title: string; dark: boolean; rows?: number }) {
  const theme = useContext(ThemeContext);
  const gridRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(4);
  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      setCols(Math.max(1, Math.floor((w + 20) / (300 + 20))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Stable hue pool so colours don't reshuffle on resize
  const huePool = useMemo(() => Array.from({ length: 60 }, () => Math.floor(Math.random() * 360)), []);
  const count = cols * rows;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`@keyframes _skelPulse { 0%,100%{opacity:1} 50%{opacity:0.72} } @keyframes _skelIn { from{opacity:0} to{opacity:1} }`}</style>
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", borderBottom: `1px dashed ${theme.border}`, paddingBottom: "12px" }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: "28px", color: theme.text }}>{title}</span>
      </div>
      <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: "20px" }}>
        {Array.from({ length: count }, (_, i) => (
          <SkeletonCard key={i} hue={huePool[i % huePool.length]} dark={dark} delay={(i % cols) * 0.08} />
        ))}
      </div>
    </section>
  );
}

// ── Stale-while-revalidate cache for the tool list ────────────────────────────
// Shared across All Tools / My Tools navigations (module scope) and persisted
// to localStorage so repeat visits render instantly while we refresh in the bg.
const TOOLS_CACHE_KEY = "playgroundToolsCacheV1";
let toolsMemCache: NewToolData[] | null = null;

function readToolsCache(): NewToolData[] | null {
  if (toolsMemCache) return toolsMemCache;
  try {
    const raw = localStorage.getItem(TOOLS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) { toolsMemCache = parsed as NewToolData[]; return toolsMemCache; }
  } catch { /* ignore */ }
  return null;
}

function writeToolsCache(tools: NewToolData[]) {
  toolsMemCache = tools;
  try { localStorage.setItem(TOOLS_CACHE_KEY, JSON.stringify(tools)); } catch { /* ignore */ }
}

function getDeletedIds(): string[] {
  try { return JSON.parse(localStorage.getItem("deletedToolIds") ?? "[]") as string[]; }
  catch { return []; }
}

function usePlaygroundData() {
  const navigate = useNavigate();
  const sessionId = useMemo(() => getSessionId(), []);
  const cachedAll = useMemo(() => readToolsCache(), []);
  const [tools, setTools] = useState<NewToolData[]>(() => {
    if (!cachedAll) return [];
    const del = getDeletedIds();
    return cachedAll.filter((t) => !del.includes(t.id));
  });
  // Skeletons only on the very first visit (no cache yet)
  const [loading, setLoading] = useState(cachedAll === null);
  const [lang, setLang] = useState<"de" | "en">(() => (localStorage.getItem("appLang") as "de" | "en") ?? "de");
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem("appTheme") === "dark");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("favoriteToolIds") ?? "[]") as string[]; }
    catch { return []; }
  });

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      localStorage.setItem("favoriteToolIds", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => { localStorage.setItem("appTheme", dark ? "dark" : "light"); }, [dark]);

  useEffect(() => {
    const deletedIds = getDeletedIds();
    getAllNewTools()
      .then((all) => {
        writeToolsCache(all);
        setTools(all.filter((t) => !deletedIds.includes(t.id)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const myToolsRaw = tools.filter((tool) => tool.params.sessionId === sessionId);
  const myToolsMap = new Map<string, NewToolData>();
  for (const tool of myToolsRaw) {
    const key = tool.params.displayName || tool.name || tool.id;
    const existing = myToolsMap.get(key);
    if (!existing || tool.savedAt > existing.savedAt) myToolsMap.set(key, tool);
  }
  const myTools = Array.from(myToolsMap.values()).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  const favoriteTools = tools.filter((tool) => favorites.includes(tool.id) && tool.params.sessionId !== sessionId);
  const myToolsAll = [...myTools, ...favoriteTools];
  const publicTools = tools.filter((tool) => tool.params.isPublic !== false);

  useEffect(() => {
    if (!loading) localStorage.setItem("hasOwnTools", String(myToolsAll.length > 0));
  }, [loading, myToolsAll.length]);

  const navigateToTool = (id: string, timerMinutes: number | null) => {
    const timerParam = timerMinutes != null ? `&timer=${timerMinutes}` : "&timer=0";
    navigate(`/create-tool?tool=${id}${timerParam}`);
  };

  const handleDelete = (id: string) => {
    const target = tools.find((tool) => tool.id === id);
    const toDelete = target
      ? tools.filter((tool) => tool.params.sessionId === target.params.sessionId && (tool.params.displayName || tool.name) === (target.params.displayName || target.name))
      : tools.filter((tool) => tool.id === id);
    const ids = toDelete.map((tool) => tool.id);
    try {
      const existing = JSON.parse(localStorage.getItem("deletedToolIds") ?? "[]") as string[];
      localStorage.setItem("deletedToolIds", JSON.stringify(Array.from(new Set([...existing, ...ids]))));
    } catch { /* ignore */ }
    setTools((current) => current.filter((tool) => !ids.includes(tool.id)));
    Promise.all(ids.map(deleteNewTool)).catch(console.error);
  };

  return { sessionId, loading, lang, setLang, dark, setDark, favorites, toggleFavorite, myToolsAll, publicTools, tools, navigateToTool, handleDelete };
}

function HeroHeading({ DE, theme }: { DE: boolean; theme: Theme }) {
  const line1 = DE
    ? "Schreibwerkzeuge prägen, wie wir denken & schreiben."
    : "Writing Tools shape how we think & write.";
  const line2 = DE
    ? "Entdecke Schreibwerkzeuge, die ihre Regeln brechen."
    : "Explore Writing Tools that break their rules.";

  return (
    <h1 style={{ margin: 0, fontFamily: FONT_CMP_SERIF, fontSize: 36, lineHeight: "45px", fontWeight: 400, color: theme.headline, textAlign: "center", whiteSpace: "nowrap", animation: "_heroIn 1s ease-out both" }}>
      <style>{`
        @keyframes _heroIn { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: none; } }
        @keyframes _toolIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes _cursorBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
      `}</style>
      {line1}<br />{line2}
      <span style={{ display: "inline-block", width: "1.5px", height: "0.85em", background: theme.headline, marginLeft: "3px", verticalAlign: "middle", animation: "_cursorBlink 1s steps(1) infinite", animationDelay: "1s" }} />
    </h1>
  );
}

function PageNavFAB({ dark, myToolsAll, DE, theme, loading }: { dark: boolean; myToolsAll: NewToolData[]; DE: boolean; theme: Theme; loading: boolean }) {
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
    <div style={{ position: "fixed", bottom: "40px", left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", gap: "4px", background: theme.toolBg, border: `1px dashed ${theme.border}`, borderRadius: "100px", padding: "4px" }}>
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

export default function PlaygroundNew() {
  const { sessionId, loading, lang, setLang, dark, setDark, favorites, toggleFavorite, myToolsAll, publicTools, tools, navigateToTool, handleDelete } = usePlaygroundData();
  const toolsRef = useRef<HTMLDivElement>(null);
  const [exploreVisible, setExploreVisible] = useState(true);
  const [launchTool, setLaunchTool] = useState<NewToolData | null>(null);

  const openTool = (id: string) => {
    const t = tools.find(x => x.id === id) ?? null;
    setLaunchTool(t);
  };

  const DE = lang === "de";
  const theme = getTheme(dark);

  useEffect(() => {
    if (loading) return;
    const target = toolsRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setExploreVisible(!entry.isIntersecting), { threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [loading]);

  return (
    <ThemeContext.Provider value={theme}>
    <DarkContext.Provider value={dark}>
      <TopNav current="Playground" dark={dark} setDark={setDark} lang={lang} setLang={setLang} />
      <main style={{ minHeight: "100vh", height: "100vh", width: "100vw", overflowX: "hidden", overflowY: "auto", position: "relative", backgroundColor: theme.bg, backgroundImage: theme.dotGrid, backgroundSize: "42px 42px", color: theme.text, fontFamily: FONT_SANS, WebkitOverflowScrolling: "touch" }}>
        <style>{`html, body, #root { height: 100%; overflow: hidden; }`}</style>

        <section aria-label="Writing tools playground" style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "transparent" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 1680, height: 858, transform: "translate(-50%, -50%)" }}>
            <div style={{ position: "absolute", inset: 0, animation: "_toolIn 1.2s ease-out 0.8s both" }}>
              <ToolShape label="...without stopping" href="/create-tool?preset=without-stopping" videoLight="without-stopping-light" videoDark="without-stopping-dark" videoFit="cover" style={{ left: 40, top: 197, width: 236, height: 233, transform: "rotate(5.1deg)", borderRadius: 200 }} textStyle={{ transform: "rotate(-5.1deg)" }} />
              <ToolShape label="...uninvited thoughts" href="/create-tool?preset=uninvited-thoughts" videoLight="uninvited-thoughts-light" videoDark="uninvited-thoughts-dark" style={{ left: 420, top: 57, width: 241, height: 182, transform: "rotate(-9.25deg)", borderRadius: 4 }} textStyle={{ transform: "rotate(9.25deg)" }} />
              <ToolShape label="...off the grid" href="/create-tool?preset=off-the-grid" videoLight="off-the-grid-light" videoDark="off-the-grid-dark" style={{ left: 1220, top: 112, width: 251, height: 163, transform: "rotate(4.18deg)", borderRadius: 4, justifyContent: "flex-start", alignItems: "flex-end", padding: 12 }} textStyle={{ transform: "rotate(-4.18deg)", marginBottom: 0 }} />
              <ToolShape label="...blind & then witness" href="/create-tool?preset=blind-then-witness" videoLight="blind-then-witness-light" videoDark="blind-then-witness-dark" style={{ left: 213, top: 579, width: 324, height: 163, transform: "rotate(6.45deg)", borderRadius: 100 }} textStyle={{ transform: "rotate(-6.45deg)" }} />
              <ToolShape label="...with visible corrections" href="/create-tool?preset=visible-corrections" videoLight="visible-corrections-light" videoDark="visible-corrections-dark" style={{ left: 774, top: 526, width: 363, height: 174, borderRadius: "40px 4px 40px 4px" }} />
              <ToolShape label="...in a spiral" href="/create-tool?preset=in-a-spiral" videoLight="in-a-spiral-light" videoDark="in-a-spiral-dark" videoFit="cover" style={{ left: 1321, top: 414, width: 211, height: 309, transform: "rotate(12.11deg)", borderRadius: 200 }} textStyle={{ transform: "rotate(-12.11deg)" }} />
            </div>
            <div style={{ position: "absolute", left: 456, top: 300, width: 768 }}>
              <HeroHeading DE={DE} theme={theme} />
            </div>
          </div>
        </section>

        <div ref={toolsRef} style={{ width: "100%", boxSizing: "border-box", padding: "96px 100px 160px" }}>
          {loading ? (
            <SkeletonGrid title={DE ? "Alle Tools" : "All Tools"} dark={dark} />
          ) : (
            <Section
              title={DE ? "Alle Tools" : "All Tools"}
              tools={publicTools}
              onOpen={openTool}
              emptyMsg={DE ? "Noch keine öffentlichen Tools vorhanden." : "No public tools yet."}
              sessionId={sessionId}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              showCreate
            />
          )}
        </div>

        <PageNavFAB dark={dark} myToolsAll={myToolsAll} DE={DE} theme={theme} loading={loading} />
        {!loading && myToolsAll.length === 0 && exploreVisible && (
          <button
            onClick={() => toolsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            style={{ position: "fixed", bottom: "40px", left: "50%", transform: "translateX(-50%)", zIndex: 50, background: theme.toolBg, border: `1px dashed ${theme.border}`, borderRadius: "4px", cursor: "pointer", outline: "none", padding: "11px 22px", fontFamily: FONT_SANS, fontSize: "15px", color: theme.text }}
          >
            {DE ? "Alle Tools entdecken" : "Explore all tools"}
          </button>
        )}
        <ToolLaunchModal
          tool={launchTool}
          dark={dark}
          onConfirm={(id, mins) => { setLaunchTool(null); navigateToTool(id, mins); }}
          onClose={() => setLaunchTool(null)}
        />
      </main>
    </DarkContext.Provider>
    </ThemeContext.Provider>
  );
}

export function MyToolsPage() {
  const { sessionId, loading, lang, setLang, dark, setDark, favorites, toggleFavorite, myToolsAll, tools, navigateToTool, handleDelete } = usePlaygroundData();
  const [launchTool, setLaunchTool] = useState<NewToolData | null>(null);

  const openTool = (id: string) => {
    const t = tools.find(x => x.id === id) ?? null;
    setLaunchTool(t);
  };

  const DE = lang === "de";
  const theme = getTheme(dark);

  return (
    <ThemeContext.Provider value={theme}>
      <TopNav current="Playground" dark={dark} setDark={setDark} lang={lang} setLang={setLang} />
      <main style={{ minHeight: "100vh", height: "100vh", width: "100vw", overflowX: "hidden", overflowY: "auto", position: "relative", backgroundColor: theme.bg, backgroundImage: theme.dotGrid, backgroundSize: "42px 42px", color: theme.text, fontFamily: FONT_SANS, WebkitOverflowScrolling: "touch" }}>
        <style>{`html, body, #root { height: 100%; overflow: hidden; }`}</style>

        <div style={{ width: "100%", boxSizing: "border-box", padding: "96px 100px 160px" }}>
          {loading ? (
            <SkeletonGrid title={DE ? "Meine Tools" : "My Tools"} dark={dark} />
          ) : myToolsAll.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
              <span style={{ fontFamily: FONT_SERIF, fontSize: "28px", color: theme.muted }}>{DE ? "Noch keine eigenen Tools." : "No tools yet."}</span>
              <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: theme.muted, textAlign: "center" }}>{DE ? "Erstelle ein Tool oder markiere eines als Favorit." : "Create a tool or mark one as favourite."}</span>
            </div>
          ) : (
            <Section
              title={DE ? "Meine Tools" : "My Tools"}
              tools={myToolsAll}
              onOpen={openTool}
              onDelete={handleDelete}
              emptyMsg=""
              sessionId={sessionId}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          )}
        </div>

        <PageNavFAB dark={dark} myToolsAll={myToolsAll} DE={DE} theme={theme} loading={loading} />
        <ToolLaunchModal
          tool={launchTool}
          dark={dark}
          onConfirm={(id, mins) => { setLaunchTool(null); navigateToTool(id, mins); }}
          onClose={() => setLaunchTool(null)}
        />
      </main>
    </ThemeContext.Provider>
  );
}

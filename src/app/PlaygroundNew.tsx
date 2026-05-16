import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate, useLocation } from "react-router";
import { deleteNewTool, getAllNewTools, type NewToolData } from "./utils/storage";
import TopNav from "./components/TopNav";

const FONT_SERIF = "'freight-text-pro', 'EB Garamond', Georgia, serif";
const FONT_SANS = "'general-sans', 'Space Grotesk', sans-serif";

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
      bg: "#1f1e1c",
      panelBg: "#2d2b28",
      toolBg: "#2d2b28",
      border: "rgba(240,232,220,0.28)",
      text: "#f0e8dc",
      muted: "rgba(240,232,220,0.5)",
      headline: "#f0e8dc",
      dotGrid: "radial-gradient(circle, rgba(240,232,220,0.16) 1px, transparent 1.2px)",
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

function getSessionId(): string {
  const key = "diplom_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function ToolShape({ label, style, textStyle, href, video }: {
  label: string;
  style: CSSProperties;
  textStyle?: CSSProperties;
  href: string;
  video: string;
}) {
  const theme = useContext(ThemeContext);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  function prepareVideo(target: HTMLVideoElement) {
    target.muted = true;
    target.defaultMuted = true;
    target.playsInline = true;
    if (target.readyState === 0) target.load();
  }

  // Autoplay the video by default, on mount
  useEffect(() => {
    const target = videoRef.current;
    if (!target) return;
    prepareVideo(target);
    const play = () => target.play().catch(() => undefined);
    play();
    if (target.readyState < 2) target.addEventListener("canplay", play, { once: true });
  }, []);

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
          objectFit: "cover",
          opacity: hovered ? 0 : 1,
          transition: "opacity 120ms ease",
          pointerEvents: "none",
          transform: "translateZ(0)",
          zIndex: 0,
        }}
      >
        <source src={`/Diplom-Projekt/videos/${video}.mp4`} type="video/mp4" />
        <source src={`/Diplom-Projekt/videos/${video}.webm`} type="video/webm" />
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
      <div onClick={onClick} style={{ width: "100%", aspectRatio: "3 / 2", background: theme.panelBg, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        {tool.params.asciiImage ? (
          <img src={tool.params.asciiImage} alt={tool.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <span style={{ fontFamily: FONT_SERIF, fontSize: "36px", color: theme.border, userSelect: "none" }}>+</span>
        )}
      </div>
      <div onClick={onClick} style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "5px", cursor: "pointer" }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: "19px", color: theme.text, lineHeight: "1.25", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {tool.name || "Unnamed Tool"}
        </span>
        {tool.description && (
          <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: theme.muted, lineHeight: "1.45", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
            {tool.description}
          </span>
        )}
      </div>
    </div>
  );
}

function Section({ title, tools, onOpen, onDelete, emptyMsg, sessionId, favorites, onToggleFavorite }: {
  title: string;
  tools: NewToolData[];
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
  emptyMsg: string;
  sessionId: string;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
}) {
  const theme = useContext(ThemeContext);
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", borderBottom: `1px dashed ${theme.border}`, paddingBottom: "12px" }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: "28px", color: theme.text }}>{title}</span>
        <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: theme.muted }}>{tools.length}</span>
      </div>
      {tools.length === 0 ? (
        <p style={{ fontFamily: FONT_SANS, fontSize: "14px", color: theme.muted, margin: 0 }}>{emptyMsg}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {tools.map((tool) => {
            const owned = tool.params.sessionId === sessionId;
            return (
              <ToolCard
                key={tool.id}
                tool={tool}
                onClick={() => onOpen(tool.id)}
                onDelete={owned && onDelete ? () => onDelete(tool.id) : undefined}
                isFavorite={favorites?.includes(tool.id)}
                onToggleFavorite={!owned && onToggleFavorite ? () => onToggleFavorite(tool.id) : undefined}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function usePlaygroundData() {
  const navigate = useNavigate();
  const sessionId = useMemo(() => getSessionId(), []);
  const [tools, setTools] = useState<NewToolData[]>([]);
  const [loading, setLoading] = useState(true);
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
    let deletedIds: string[] = [];
    try { deletedIds = JSON.parse(localStorage.getItem("deletedToolIds") ?? "[]") as string[]; }
    catch { /* ignore */ }
    getAllNewTools()
      .then((all) => setTools(all.filter((t) => !deletedIds.includes(t.id))))
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
  const publicTools = tools.filter((tool) => tool.params.sessionId !== sessionId && tool.params.isPublic !== false);

  const openTool = (id: string) => navigate(`/new?tool=${id}`);

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

  return { sessionId, loading, lang, setLang, dark, setDark, favorites, toggleFavorite, myToolsAll, publicTools, openTool, handleDelete };
}

function PageNavFAB({ dark, myToolsAll, DE, theme }: { dark: boolean; myToolsAll: NewToolData[]; DE: boolean; theme: Theme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMyPage = location.pathname.includes("my-tools");

  if (myToolsAll.length === 0) return null;

  return (
    <div style={{ position: "fixed", bottom: "40px", left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", gap: "4px", background: theme.toolBg, border: `1px dashed ${theme.border}`, borderRadius: "4px", padding: "4px" }}>
      {([
        { path: "/my-tools", label: DE ? "Meine Tools" : "My Tools" },
        { path: "/playground", label: DE ? "Alle Tools" : "All Tools" },
      ]).map(({ path, label }) => {
        const active = isMyPage ? path === "/my-tools" : path === "/playground";
        return (
          <button key={path} onClick={() => navigate(path)} style={{ border: "none", borderRadius: "3px", cursor: "pointer", outline: "none", padding: "9px 18px", fontFamily: FONT_SANS, fontSize: "14px", background: active ? (dark ? theme.text : theme.headline) : "transparent", color: active ? theme.bg : theme.muted, transition: "background 0.15s, color 0.15s" }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function PlaygroundNew() {
  const { sessionId, loading, lang, setLang, dark, setDark, favorites, toggleFavorite, myToolsAll, publicTools, openTool, handleDelete } = usePlaygroundData();
  const toolsRef = useRef<HTMLDivElement>(null);
  const [exploreVisible, setExploreVisible] = useState(true);

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
      <TopNav current="Playground" dark={dark} setDark={setDark} lang={lang} setLang={setLang} />
      <main style={{ minHeight: "100vh", height: "100vh", width: "100vw", overflowX: "hidden", overflowY: "auto", position: "relative", backgroundColor: theme.bg, backgroundImage: theme.dotGrid, backgroundSize: "42px 42px", color: theme.text, fontFamily: FONT_SANS, WebkitOverflowScrolling: "touch" }}>
        <style>{`html, body, #root { height: 100%; overflow: hidden; }`}</style>

        <section aria-label="Writing tools playground" style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "transparent" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 1680, height: 858, transform: "translate(-50%, -50%)" }}>
            <ToolShape label="...without stopping" href="/Diplom-Projekt/dont-stop-writing" video="without-stopping" style={{ left: 40, top: 197, width: 236, height: 233, transform: "rotate(5.1deg)", borderRadius: 200 }} textStyle={{ transform: "rotate(-5.1deg)" }} />
            <ToolShape label="...uninvited thoughts" href="/Diplom-Projekt/uninvited-thoughts" video="uninvited-thoughts" style={{ left: 420, top: 57, width: 317, height: 155, transform: "rotate(-9.25deg)", borderRadius: 4 }} textStyle={{ transform: "rotate(9.25deg)" }} />
            <ToolShape label="...off the grid" href="/Diplom-Projekt/off-the-grid" video="off-the-grid" style={{ left: 1220, top: 112, width: 251, height: 163, transform: "rotate(4.18deg)", borderRadius: 4, justifyContent: "flex-start", alignItems: "flex-end", padding: 12 }} textStyle={{ transform: "rotate(-4.18deg)", marginBottom: 0 }} />
            <ToolShape label="...blind & then witness" href="/Diplom-Projekt/anonymously-in-public" video="blind-then-witness" style={{ left: 213, top: 579, width: 324, height: 163, transform: "rotate(6.45deg)", borderRadius: 100 }} textStyle={{ transform: "rotate(-6.45deg)" }} />
            <ToolShape label="...with visible corrections" href="/Diplom-Projekt/loschen-korrigieren" video="visible-corrections" style={{ left: 774, top: 526, width: 363, height: 174, borderRadius: "40px 4px 40px 4px" }} />
            <ToolShape label="...in a spiral" href="/Diplom-Projekt/in-a-spiral" video="in-a-spiral" style={{ left: 1321, top: 414, width: 211, height: 309, transform: "rotate(12.11deg)", borderRadius: 200 }} textStyle={{ transform: "rotate(-12.11deg)" }} />
            <div style={{ position: "absolute", left: 456, top: 300, width: 768 }}>
              <h1 style={{ margin: 0, fontFamily: FONT_SERIF, fontSize: 36, lineHeight: "45px", fontWeight: 400, color: theme.headline, textAlign: "center", whiteSpace: "nowrap" }}>
                {DE ? "Schreibwerkzeuge prägen, wie wir denken & schreiben." : "Writing Tools shape how we think & write."}<br />
                {DE ? "Entdecke Schreibwerkzeuge, die ihre Regeln brechen." : "Explore Writing Tools that break their rules."}
              </h1>
            </div>
          </div>
        </section>

        <div ref={toolsRef} style={{ width: "100%", boxSizing: "border-box", padding: "96px 100px 160px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: theme.muted }}>{DE ? "Lädt..." : "Loading..."}</span>
            </div>
          ) : (
            <Section
              title={DE ? "Alle Tools" : "All Tools"}
              tools={publicTools}
              onOpen={openTool}
              emptyMsg={DE ? "Noch keine öffentlichen Tools vorhanden." : "No public tools yet."}
              sessionId={sessionId}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          )}
        </div>

        {!loading && myToolsAll.length > 0 ? (
          <PageNavFAB dark={dark} myToolsAll={myToolsAll} DE={DE} theme={theme} />
        ) : (
          exploreVisible && (
            <button
              onClick={() => toolsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              style={{ position: "fixed", bottom: "40px", left: "50%", transform: "translateX(-50%)", zIndex: 50, background: theme.toolBg, border: `1px dashed ${theme.border}`, borderRadius: "4px", cursor: "pointer", outline: "none", padding: "11px 22px", fontFamily: FONT_SANS, fontSize: "15px", color: theme.text }}
            >
              {DE ? "Alle Tools entdecken" : "Explore all tools"}
            </button>
          )
        )}
      </main>
    </ThemeContext.Provider>
  );
}

export function MyToolsPage() {
  const { sessionId, loading, lang, setLang, dark, setDark, favorites, toggleFavorite, myToolsAll, openTool, handleDelete } = usePlaygroundData();

  const DE = lang === "de";
  const theme = getTheme(dark);

  return (
    <ThemeContext.Provider value={theme}>
      <TopNav current="Playground" dark={dark} setDark={setDark} lang={lang} setLang={setLang} />
      <main style={{ minHeight: "100vh", height: "100vh", width: "100vw", overflowX: "hidden", overflowY: "auto", position: "relative", backgroundColor: theme.bg, backgroundImage: theme.dotGrid, backgroundSize: "42px 42px", color: theme.text, fontFamily: FONT_SANS, WebkitOverflowScrolling: "touch" }}>
        <style>{`html, body, #root { height: 100%; overflow: hidden; }`}</style>

        <div style={{ width: "100%", boxSizing: "border-box", padding: "96px 100px 160px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: theme.muted }}>{DE ? "Lädt..." : "Loading..."}</span>
            </div>
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

        <PageNavFAB dark={dark} myToolsAll={myToolsAll} DE={DE} theme={theme} />
      </main>
    </ThemeContext.Provider>
  );
}

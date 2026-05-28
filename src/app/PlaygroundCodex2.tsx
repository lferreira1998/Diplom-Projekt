import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router";
import TopNav from "./components/TopNav";
import { MiniReplayPreview } from "./components/MiniReplayPreview";
import { deleteNewTool, getAllNewTools, type NewToolData } from "./utils/storage";

const FONT_SERIF = "'freight-text-pro', serif";
const FONT_SANS = "'general-sans', sans-serif";

const COLUMN_GAP = 650;
const LANE_GAP = 520;

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

type ViewMode = "all" | "mine";
type LayoutMode = "field" | "list";

type ShapePreset = {
  width: number;
  height: number;
  radius: string | number;
  previewFit?: "cover" | "contain";
};

type CanvasPlacement = ShapePreset & {
  left: number;
  top: number;
  rotate: number;
};

const SHAPE_PRESETS: ShapePreset[] = [
  { width: 368, height: 268, radius: 999, previewFit: "contain" },
  { width: 408, height: 250, radius: 7 },
  { width: 438, height: 226, radius: "110px 10px 110px 10px" },
  { width: 294, height: 386, radius: 180 },
  { width: 456, height: 260, radius: "10px 90px 10px 90px" },
  { width: 344, height: 306, radius: "150px 150px 18px 18px" },
  { width: 396, height: 300, radius: "26px 130px 26px 130px" },
  { width: 328, height: 328, radius: 999, previewFit: "contain" },
];

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

function HeartIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22 L6.5 12.5 A5.5 5.5 0 1 0 12 7 A5.5 5.5 0 1 0 17.5 12.5 Z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function seededRange(seed: number, min: number, max: number): number {
  const value = Math.sin(seed) * 10000;
  return min + (value - Math.floor(value)) * (max - min);
}

function getCanvasPlacement(tool: NewToolData, index: number): CanvasPlacement {
  const seed = hashString(`${tool.id}-${index}`);
  const lanes = [1, 0, 3, 2, 0, 2, 1, 3];
  const lane = lanes[index % lanes.length];
  const column = Math.floor(index / 4);
  const shape = SHAPE_PRESETS[(index + Math.floor(seededRange(seed + 9, 0, SHAPE_PRESETS.length))) % SHAPE_PRESETS.length];

  return {
    ...shape,
    left: 280 + column * COLUMN_GAP + seededRange(seed + 1, -120, 140),
    top: 235 + lane * LANE_GAP + (column % 2) * 72 + seededRange(seed + 2, -96, 112),
    rotate: seededRange(seed + 3, -8.5, 8.5),
  };
}

function toolActionButtonStyle(theme: Theme): CSSProperties {
  return {
    height: 30,
    padding: "0 11px",
    border: `1px dashed ${theme.border}`,
    borderRadius: 6,
    background: theme.toolBg,
    color: theme.text,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontFamily: FONT_SANS,
    fontSize: 12,
    lineHeight: 1,
    maxWidth: "100%",
  };
}

function ToolActions({ owned, favorite, onDelete, onToggleFavorite, compact = false }: {
  owned: boolean;
  favorite: boolean;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  compact?: boolean;
}) {
  const theme = useContext(ThemeContext);
  const [confirming, setConfirming] = useState(false);
  const actionStyle = toolActionButtonStyle(theme);

  if (owned && onDelete) {
    if (confirming) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, maxWidth: "100%" }}>
          <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: theme.text, whiteSpace: "nowrap" }}>Löschen?</span>
          <button onClick={(event) => { event.stopPropagation(); onDelete(); }} style={{ ...actionStyle, height: 26, padding: "0 9px", background: "#b43c3c", border: "none", color: "#fff" }}>Ja</button>
          <button onClick={(event) => { event.stopPropagation(); setConfirming(false); }} style={{ ...actionStyle, height: 26, padding: "0 9px" }}>Nein</button>
        </div>
      );
    }

    return (
      <button onClick={(event) => { event.stopPropagation(); setConfirming(true); }} title="Aus My Tools entfernen" style={actionStyle}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>x</span>
        {!compact && <span>Remove</span>}
      </button>
    );
  }

  if (!onToggleFavorite) return null;

  return (
    <button
      onClick={(event) => { event.stopPropagation(); onToggleFavorite(); }}
      title={favorite ? "Aus My Tools entfernen" : "Zu My Tools hinzufügen"}
      style={actionStyle}
    >
      <HeartIcon filled={favorite} color={favorite ? "#d4607a" : theme.muted} />
      {!compact && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{favorite ? "In My Tools" : "Add to My Tools"}</span>}
    </button>
  );
}

function ShapeTool({ tool, placement, owned, favorite, onOpen, onDelete, onToggleFavorite }: {
  tool: NewToolData;
  placement: CanvasPlacement;
  owned: boolean;
  favorite: boolean;
  onOpen: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
}) {
  const theme = useContext(ThemeContext);
  const [hovered, setHovered] = useState(false);
  const isDark = theme.bg === "#1f1e1c";

  return (
    <button
      data-tool-shape="true"
      onClick={onOpen}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        position: "absolute",
        left: placement.left,
        top: placement.top,
        width: placement.width,
        height: placement.height,
        padding: 0,
        border: `1px dashed ${hovered ? theme.text : theme.border}`,
        borderRadius: placement.radius,
        color: theme.text,
        background: theme.toolBg,
        cursor: "pointer",
        overflow: "hidden",
        transform: `rotate(${placement.rotate}deg)` + (hovered ? " translateY(-3px)" : ""),
        transformOrigin: "center",
        transition: "border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease",
        boxShadow: hovered ? "0 20px 48px rgba(0,0,0,0.10)" : "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: hovered ? 1 : 0.78,
          transition: "opacity 140ms ease",
        }}
      >
        <div style={{ width: "112%", minWidth: "112%", transform: placement.previewFit === "contain" ? "scale(0.92)" : "scale(1.12)" }}>
          <MiniReplayPreview params={tool.params} active={hovered} dark={isDark} toolId={tool.id} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 26,
          boxSizing: "border-box",
          background: hovered ? (isDark ? "rgba(31,30,28,0.78)" : "rgba(252,246,239,0.78)") : "transparent",
          opacity: hovered ? 1 : 0,
          transition: "opacity 140ms ease, background 140ms ease",
          pointerEvents: hovered ? "auto" : "none",
        }}
      >
        <span style={{ fontFamily: FONT_SERIF, fontSize: 23, color: theme.text, lineHeight: 1.16, textAlign: "center", overflowWrap: "anywhere" }}>
          {tool.name || "Unnamed Tool"}
        </span>
        {tool.description && (
          <span style={{ maxWidth: 260, fontFamily: FONT_SANS, fontSize: 12, color: theme.muted, lineHeight: 1.35, textAlign: "center", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {tool.description}
          </span>
        )}
        <ToolActions owned={owned} favorite={favorite} onDelete={onDelete} onToggleFavorite={onToggleFavorite} compact={placement.width < 330} />
      </div>
    </button>
  );
}

function CanvasField({ title, tools, sessionId, favorites, onOpen, onDelete, onToggleFavorite, emptyMessage }: {
  title: string;
  tools: NewToolData[];
  sessionId: string;
  favorites: string[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  emptyMessage: string;
}) {
  const theme = useContext(ThemeContext);
  const viewportRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ active: false, x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [panning, setPanning] = useState(false);
  const columnCount = Math.max(7, Math.ceil(tools.length / 4) + 2);
  const canvasWidth = Math.max(5200, 1040 + columnCount * COLUMN_GAP);
  const canvasHeight = Math.max(2860, 620 + 4 * LANE_GAP);

  useEffect(() => {
    const target = viewportRef.current;
    if (!target) return;
    target.scrollLeft = 320;
    target.scrollTop = 160;
  }, [tools.length, title]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-tool-shape='true']")) return;
    panRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: event.currentTarget.scrollLeft,
      scrollTop: event.currentTarget.scrollTop,
    };
    setPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!panRef.current.active) return;
    event.currentTarget.scrollLeft = panRef.current.scrollLeft - (event.clientX - panRef.current.x);
    event.currentTarget.scrollTop = panRef.current.scrollTop - (event.clientY - panRef.current.y);
  };

  const stopPanning = () => {
    panRef.current.active = false;
    setPanning(false);
  };

  return (
    <div
      ref={viewportRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopPanning}
      onPointerCancel={stopPanning}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "auto",
        WebkitOverflowScrolling: "touch",
        cursor: panning ? "grabbing" : "grab",
      }}
    >
      <div style={{ position: "relative", width: canvasWidth, height: canvasHeight, minWidth: "100%", minHeight: "100%" }}>
        <div style={{ position: "absolute", left: 250, top: 138, display: "flex", alignItems: "baseline", gap: 12, pointerEvents: "none" }}>
          <span style={{ fontFamily: FONT_SERIF, fontSize: 36, color: theme.text }}>{title}</span>
          <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: theme.muted }}>{tools.length}</span>
        </div>

        {tools.length === 0 ? (
          <p style={{ position: "absolute", left: 254, top: 214, margin: 0, fontFamily: FONT_SANS, fontSize: 14, color: theme.muted }}>{emptyMessage}</p>
        ) : (
          tools.map((tool, index) => {
            const owned = tool.params.sessionId === sessionId;
            const placement = getCanvasPlacement(tool, index);
            return (
              <ShapeTool
                key={tool.id}
                tool={tool}
                placement={placement}
                owned={owned}
                favorite={favorites.includes(tool.id)}
                onOpen={() => onOpen(tool.id)}
                onDelete={owned ? () => onDelete(tool.id) : undefined}
                onToggleFavorite={!owned ? () => onToggleFavorite(tool.id) : undefined}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function ListToolCard({ tool, owned, favorite, onOpen, onDelete, onToggleFavorite }: {
  tool: NewToolData;
  owned: boolean;
  favorite: boolean;
  onOpen: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
}) {
  const theme = useContext(ThemeContext);
  const [hovered, setHovered] = useState(false);
  const isDark = theme.bg === "#1f1e1c";

  return (
    <div
      data-tool-card="true"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(220px, 340px) minmax(0, 1fr) auto",
        gap: 22,
        alignItems: "center",
        border: `1px dashed ${hovered ? theme.text : theme.border}`,
        borderRadius: 8,
        background: theme.bg,
        padding: 14,
        boxSizing: "border-box",
        transition: "border-color 140ms ease, transform 140ms ease",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      <div onClick={onOpen} style={{ border: `1px dashed ${theme.border}`, borderRadius: 7, overflow: "hidden", cursor: "pointer", background: theme.panelBg }}>
        <MiniReplayPreview params={tool.params} active={hovered} dark={isDark} toolId={tool.id} />
      </div>
      <div onClick={onOpen} style={{ minWidth: 0, cursor: "pointer", display: "flex", flexDirection: "column", gap: 7 }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: 24, color: theme.text, lineHeight: 1.16, overflowWrap: "anywhere" }}>{tool.name || "Unnamed Tool"}</span>
        {tool.description && (
          <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: theme.muted, lineHeight: 1.45, maxWidth: 620 }}>{tool.description}</span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ToolActions owned={owned} favorite={favorite} onDelete={onDelete} onToggleFavorite={onToggleFavorite} />
      </div>
    </div>
  );
}

function ListView({ title, tools, sessionId, favorites, onOpen, onDelete, onToggleFavorite, emptyMessage }: {
  title: string;
  tools: NewToolData[];
  sessionId: string;
  favorites: string[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  emptyMessage: string;
}) {
  const theme = useContext(ThemeContext);

  return (
    <div style={{ position: "absolute", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "118px 96px 170px", boxSizing: "border-box" }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, borderBottom: `1px dashed ${theme.border}`, paddingBottom: 12 }}>
          <span style={{ fontFamily: FONT_SERIF, fontSize: 34, color: theme.text }}>{title}</span>
          <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: theme.muted }}>{tools.length}</span>
        </div>
        {tools.length === 0 ? (
          <p style={{ margin: 0, fontFamily: FONT_SANS, fontSize: 14, color: theme.muted }}>{emptyMessage}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {tools.map((tool) => {
              const owned = tool.params.sessionId === sessionId;
              return (
                <ListToolCard
                  key={tool.id}
                  tool={tool}
                  owned={owned}
                  favorite={favorites.includes(tool.id)}
                  onOpen={() => onOpen(tool.id)}
                  onDelete={owned ? () => onDelete(tool.id) : undefined}
                  onToggleFavorite={!owned ? () => onToggleFavorite(tool.id) : undefined}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function LayoutSwitch({ layoutMode, setLayoutMode, de, dark }: { layoutMode: LayoutMode; setLayoutMode: (mode: LayoutMode) => void; de: boolean; dark: boolean }) {
  const theme = useContext(ThemeContext);
  const items: Array<{ mode: LayoutMode; label: string }> = [
    { mode: "field", label: de ? "Feld" : "Field" },
    { mode: "list", label: de ? "Liste" : "List" },
  ];

  return (
    <div style={{ position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)", zIndex: 60, display: "flex", gap: 4, padding: 4, border: `1px dashed ${theme.border}`, borderRadius: 4, background: theme.toolBg }}>
      {items.map((item) => {
        const active = layoutMode === item.mode;
        return (
          <button key={item.mode} onClick={() => setLayoutMode(item.mode)} style={{ border: "none", borderRadius: 3, cursor: "pointer", outline: "none", padding: "8px 16px", fontFamily: FONT_SANS, fontSize: 13, background: active ? (dark ? theme.text : theme.headline) : "transparent", color: active ? theme.bg : theme.muted, transition: "background 140ms ease, color 140ms ease" }}>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function ViewSwitch({ mode, de, dark }: { mode: ViewMode; de: boolean; dark: boolean }) {
  const navigate = useNavigate();
  const theme = useContext(ThemeContext);
  const items: Array<{ mode: ViewMode; label: string; path: string }> = [
    { mode: "all", label: de ? "Alle Tools" : "All Tools", path: "/playgroundcodex2" },
    { mode: "mine", label: de ? "My Tools" : "My Tools", path: "/playgroundcodex2/my-tools" },
  ];

  return (
    <div style={{ position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 60, display: "flex", gap: 4, padding: 4, border: `1px dashed ${theme.border}`, borderRadius: 4, background: theme.toolBg }}>
      {items.map((item) => {
        const active = mode === item.mode;
        return (
          <button key={item.mode} onClick={() => navigate(item.path)} style={{ border: "none", borderRadius: 3, cursor: "pointer", outline: "none", padding: "9px 18px", fontFamily: FONT_SANS, fontSize: 14, background: active ? (dark ? theme.text : theme.headline) : "transparent", color: active ? theme.bg : theme.muted, transition: "background 140ms ease, color 140ms ease" }}>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function usePlaygroundTools() {
  const navigate = useNavigate();
  const sessionId = useMemo(() => getSessionId(), []);
  const [tools, setTools] = useState<NewToolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lang, setLang] = useState<"de" | "en">(() => (localStorage.getItem("appLang") as "de" | "en") ?? "de");
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem("appTheme") === "dark");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("favoriteToolIds") ?? "[]") as string[]; }
    catch { return []; }
  });

  useEffect(() => { localStorage.setItem("appTheme", dark ? "dark" : "light"); }, [dark]);

  useEffect(() => {
    let deletedIds: string[] = [];
    try { deletedIds = JSON.parse(localStorage.getItem("deletedToolIds") ?? "[]") as string[]; }
    catch { /* ignore */ }

    getAllNewTools()
      .then((all) => setTools(all.filter((tool) => !deletedIds.includes(tool.id))))
      .catch((err) => { console.error(err); setError(true); })
      .finally(() => setLoading(false));
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem("favoriteToolIds", JSON.stringify(next));
      return next;
    });
  };

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

  const ownToolsRaw = tools.filter((tool) => tool.params.sessionId === sessionId);
  const ownToolsMap = new Map<string, NewToolData>();
  for (const tool of ownToolsRaw) {
    const key = tool.params.displayName || tool.name || tool.id;
    const existing = ownToolsMap.get(key);
    if (!existing || tool.savedAt > existing.savedAt) ownToolsMap.set(key, tool);
  }

  const ownTools = Array.from(ownToolsMap.values()).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  const likedTools = tools.filter((tool) => favorites.includes(tool.id) && tool.params.sessionId !== sessionId);
  const myTools = [...ownTools, ...likedTools];
  const allTools = tools.filter((tool) => tool.params.sessionId !== sessionId && tool.params.isPublic !== false);

  return { sessionId, loading, error, lang, setLang, dark, setDark, favorites, toggleFavorite, openTool, handleDelete, myTools, allTools };
}

export default function PlaygroundCodex2({ mode = "all" }: { mode?: ViewMode }) {
  const { sessionId, loading, error, lang, setLang, dark, setDark, favorites, toggleFavorite, openTool, handleDelete, myTools, allTools } = usePlaygroundTools();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("field");
  const de = lang === "de";
  const theme = getTheme(dark);
  const shownTools = mode === "mine" ? myTools : allTools;
  const title = mode === "mine" ? (de ? "My Tools" : "My Tools") : (de ? "Alle Tools" : "All Tools");
  const emptyMessage = mode === "mine"
    ? (de ? "Noch keine eigenen oder gelikten Tools." : "No created or liked tools yet.")
    : (de ? "Noch keine öffentlichen Tools vorhanden." : "No public tools yet.");

  return (
    <ThemeContext.Provider value={theme}>
      <TopNav current="Playground" dark={dark} setDark={setDark} lang={lang} setLang={setLang} />
      <main style={{ minHeight: "100vh", height: "100vh", width: "100vw", overflow: "hidden", position: "relative", backgroundColor: theme.bg, backgroundImage: theme.dotGrid, backgroundSize: "42px 42px", color: theme.text, fontFamily: FONT_SANS }}>
        <style>{`html, body, #root { height: 100%; overflow: hidden; }`}</style>

        {loading ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: 14, color: theme.muted }}>{de ? "Lädt..." : "Loading..."}</span>
          </div>
        ) : error ? (
          <p style={{ position: "absolute", left: 172, top: 170, margin: 0, fontFamily: FONT_SANS, fontSize: 14, color: theme.muted }}>{de ? "Tools konnten gerade nicht geladen werden." : "Tools could not be loaded right now."}</p>
        ) : layoutMode === "field" ? (
          <CanvasField
            title={title}
            tools={shownTools}
            sessionId={sessionId}
            favorites={favorites}
            onOpen={openTool}
            onDelete={handleDelete}
            onToggleFavorite={toggleFavorite}
            emptyMessage={emptyMessage}
          />
        ) : (
          <ListView
            title={title}
            tools={shownTools}
            sessionId={sessionId}
            favorites={favorites}
            onOpen={openTool}
            onDelete={handleDelete}
            onToggleFavorite={toggleFavorite}
            emptyMessage={emptyMessage}
          />
        )}

        <LayoutSwitch layoutMode={layoutMode} setLayoutMode={setLayoutMode} de={de} dark={dark} />
        <ViewSwitch mode={mode} de={de} dark={dark} />
      </main>
    </ThemeContext.Provider>
  );
}

export function PlaygroundCodex2MyTools() {
  return <PlaygroundCodex2 mode="mine" />;
}

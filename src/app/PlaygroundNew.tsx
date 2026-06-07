import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ToolPreview } from "./components/ToolPreview";
import { ToolLaunchModal } from "./components/ToolLaunchModal";
import type { CSSProperties, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { deleteNewTool, getAllNewTools, type NewToolData, type NewToolParams } from "./utils/storage";
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
  const theme = useContext(ThemeContext);
  const dark  = useContext(DarkContext);
  const video = dark ? videoDark : videoLight;
  const bg    = dark ? (bgDark ?? theme.toolBg) : (bgLight ?? theme.toolBg);
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
        background: bg,
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

// Slot definitions for explore mode — positions outside the 1680×858 hero box
// plus two center slots that replace the heading
const EXPLORE_SLOTS: { left: number; top: number; width: number; height: number; borderRadius: string | number; rotate: number }[] = [
  // Center — replace the heading
  { left: 535, top: 262, width: 220, height: 210, borderRadius: 200, rotate: -3.5 },
  { left: 835, top: 272, width: 295, height: 163, borderRadius: 100, rotate: 4 },
  // Left outer
  { left: -292, top: 168, width: 236, height: 233, borderRadius: 200, rotate: 5.1 },
  { left: -280, top: 438, width: 241, height: 182, borderRadius: 4, rotate: -9.25 },
  { left: -268, top: 638, width: 251, height: 163, borderRadius: 4, rotate: 4.18 },
  // Right outer
  { left: 1718, top: 126, width: 251, height: 163, borderRadius: 4, rotate: 4.18 },
  { left: 1710, top: 372, width: 324, height: 163, borderRadius: 100, rotate: 6.45 },
  { left: 1706, top: 578, width: 211, height: 309, borderRadius: 200, rotate: 12.11 },
  // Top outer
  { left: 672, top: -196, width: 363, height: 174, borderRadius: "40px 4px 40px 4px", rotate: -2.4 },
  { left: 240, top: -198, width: 241, height: 182, borderRadius: 4, rotate: -9.25 },
  // Bottom outer
  { left: 176, top: 900, width: 241, height: 182, borderRadius: 4, rotate: -9.25 },
  { left: 952, top: 896, width: 236, height: 233, borderRadius: 200, rotate: 5.1 },
];

function UserToolShape({ tool, style, textStyle, onClick, dark }: {
  tool: NewToolData;
  style: CSSProperties;
  textStyle?: CSSProperties;
  onClick: () => void;
  dark: boolean;
}) {
  const theme = useContext(ThemeContext);
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = tool.params.previewVideo;

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;
    v.muted = true; v.playsInline = true;
    const play = () => v.play().catch(() => undefined);
    play();
    if (v.readyState < 2) v.addEventListener("canplay", play, { once: true });
  }, [videoUrl]);

  return (
    <div
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        border: `1px dashed ${theme.border}`,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {videoUrl ? (
        <video
          key={videoUrl}
          ref={videoRef}
          muted loop playsInline preload="auto"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover",
            opacity: hovered ? 0 : 1,
            transition: "opacity 120ms ease",
            pointerEvents: "none",
          }}
        >
          <source src={videoUrl} />
        </video>
      ) : (
        <div style={{ position: "absolute", inset: 0, opacity: hovered ? 0 : 1, transition: "opacity 120ms ease", pointerEvents: "none" }}>
          <ToolPreview tool={tool} active dark={dark} />
        </div>
      )}
      <span style={{
        position: "relative", zIndex: 1,
        fontFamily: FONT_SANS, fontSize: 15, color: theme.text,
        opacity: hovered ? 1 : 0,
        transition: "opacity 120ms ease",
        textAlign: "center", padding: "0 12px",
        ...textStyle,
      }}>
        {tool.name || "Unnamed Tool"}
      </span>
    </div>
  );
}

function HeartIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22 L6.5 12.5 A5.5 5.5 0 1 0 12 7 A5.5 5.5 0 1 0 17.5 12.5 Z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Shape definitions for the 6 preset presets — used in cards and the shape picker
export const CARD_SHAPE_DEFS: Record<string, {
  bgLight: string; bgDark: string;
  radius: string;
  circle: boolean;
  bottomLeft: boolean;
  label: { de: string; en: string };
  video: string;
}> = {
  "without-stopping":    { bgLight: "#fbf5eb", bgDark: "#3e3e3e",  radius: "200px",                 circle: true,  bottomLeft: false, label: { de: "...ohne anzuhalten",            en: "...without stopping" },          video: "without-stopping" },
  "uninvited-thoughts":  { bgLight: "#eaf8f5", bgDark: "#1f2f29",  radius: "4px",                   circle: false, bottomLeft: false, label: { de: "...ungebetene Gedanken",        en: "...uninvited thoughts" },        video: "uninvited-thoughts" },
  "off-the-grid":        { bgLight: "#fff4f6", bgDark: "#37262d",  radius: "4px",                   circle: false, bottomLeft: true,  label: { de: "...abseits des Rasters",        en: "...off the grid" },              video: "off-the-grid" },
  "blind-then-witness":  { bgLight: "#ecf7ee", bgDark: "#222d26",  radius: "100px",                 circle: false, bottomLeft: false, label: { de: "...blind & dann sehen",          en: "...blind & then witness" },      video: "blind-then-witness" },
  "visible-corrections": { bgLight: "#f6f8ed", bgDark: "#2f2836",  radius: "40px 4px 40px 4px",     circle: false, bottomLeft: false, label: { de: "...mit sichtbaren Korrekturen", en: "...with visible corrections" },  video: "visible-corrections" },
  "in-a-spiral":         { bgLight: "#eef7ff", bgDark: "#242c38",  radius: "24px 200px 24px 200px", circle: false, bottomLeft: false, label: { de: "...in einer Spirale",            en: "...in a spiral" },               video: "in-a-spiral" },
};

function getPresetShape(params: NewToolParams, dark: boolean, DE: boolean): {
  bg: string; radius: string; label: string; circle: boolean; bottomLeft: boolean; video: string | null;
} {
  // Explicit card shape override
  let shapeId = (params.cardShape as string | null | undefined) ?? null;
  // Infer from params if not set
  if (!shapeId) {
    if (params.positionMode === "spiral")       shapeId = "in-a-spiral";
    else if (params.visibility === "invisible") shapeId = "blind-then-witness";
    else if (params.correctionVisible)          shapeId = "visible-corrections";
    else if (params.positionMode === "random")  shapeId = "off-the-grid";
    else if (params.cursorRunning)              shapeId = "without-stopping";
    else if (params.textFliegtEnabled)          shapeId = "uninvited-thoughts";
  }
  if (shapeId && CARD_SHAPE_DEFS[shapeId]) {
    const d = CARD_SHAPE_DEFS[shapeId];
    return { bg: dark ? d.bgDark : d.bgLight, radius: d.radius, label: DE ? d.label.de : d.label.en, circle: d.circle, bottomLeft: d.bottomLeft, video: d.video };
  }
  // Fallback: hue-based
  const hL = (h: number) => `oklch(97.5% 0.015 ${h})`;
  const hD = (h: number) => `oklch(26% 0.025 ${h})`;
  const bgFor = (hue: number | null) =>
    hue !== null ? (dark ? hD(hue) : hL(hue)) : (dark ? "#2b2926" : "#fef8ee");
  const hue = params.bgHue;
  return { bg: bgFor(hue), radius: "100px", label: "...", circle: hue === null, bottomLeft: false, video: null };
}

function ToolCard({ tool, onClick, onDelete, isFavorite, onToggleFavorite, DE }: {
  tool: NewToolData;
  onClick: () => void;
  onDelete?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  DE?: boolean;
}) {
  const theme = useContext(ThemeContext);
  const dark = useContext(DarkContext);
  const [hovered, setHovered] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const shapeVideoRef = useRef<HTMLVideoElement>(null);

  const shape = getPresetShape(tool.params, dark, DE ?? false);
  const userVideoUrl = tool.params.previewVideo || null;
  const presetVideoName = shape.video ? `${shape.video}-${dark ? "dark" : "light"}` : null;
  const videoSrc = userVideoUrl || (presetVideoName ? `/videos/${presetVideoName}.webm` : null);

  useEffect(() => {
    const v = shapeVideoRef.current;
    if (!v || !videoSrc) return;
    v.muted = true; v.playsInline = true;
    const play = () => v.play().catch(() => undefined);
    play();
    if (v.readyState < 2) v.addEventListener("canplay", play, { once: true });
  }, [videoSrc]);

  const cardBg = hovered ? (dark ? "#232120" : "#fffdfa") : (dark ? theme.toolBg : "#fdf9f3");
  const cardBorder = hovered ? (dark ? "rgba(240,232,220,0.22)" : "#a8a8a8") : (dark ? theme.border : "#b4b3b3");
  const descColor = dark ? "rgba(240,232,220,0.45)" : "#7a7d89";
  const shapeTextColor = dark ? "rgba(240,232,220,0.6)" : "#555555";
  const shapeBorder = dark ? "rgba(240,232,220,0.2)" : "#a4a4a4";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirming(false); }}
      onClick={onClick}
      style={{
        background: cardBg,
        border: `1px dashed ${cardBorder}`,
        borderRadius: "8px",
        overflow: "hidden",
        aspectRatio: "1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px",
        boxSizing: "border-box",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      {/* Title */}
      <div style={{ width: "100%", flexShrink: 0 }}>
        <span style={{
          fontFamily: FONT_CMP_SERIF,
          fontSize: "18px",
          color: dark ? theme.text : "#302e2c",
          lineHeight: "normal",
          display: "block",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          paddingRight: (onDelete || onToggleFavorite) ? "36px" : "0",
        }}>
          {tool.name || "Unnamed Tool"}
        </span>
      </div>

      {/* Preset shape with video */}
      <div style={{
        flexShrink: 0,
        position: "relative",
        width: shape.circle ? "min(44%, 163px)" : "calc(100% - 16px)",
        height: "163px",
        background: shape.bg,
        border: `1px dashed ${shapeBorder}`,
        borderRadius: shape.radius,
        overflow: "hidden",
        display: "flex",
        alignItems: shape.bottomLeft ? "flex-end" : "center",
        justifyContent: shape.bottomLeft ? "flex-start" : "center",
        padding: shape.bottomLeft ? "12px" : "6px 12px",
        boxSizing: "border-box",
      }}>
        {videoSrc && (
          <video
            key={videoSrc}
            ref={shapeVideoRef}
            muted loop playsInline preload="auto"
            src={videoSrc}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              opacity: hovered ? 0 : 1,
              transition: "opacity 150ms ease",
              pointerEvents: "none",
              transform: "translateZ(0)",
            }}
          />
        )}
        <span style={{
          position: "relative",
          zIndex: 1,
          fontFamily: FONT_SANS,
          fontSize: "17px",
          color: shapeTextColor,
          letterSpacing: "-0.01em",
          textAlign: "center",
          lineHeight: "1.3",
          whiteSpace: "nowrap",
          opacity: videoSrc ? (hovered ? 1 : 0) : 1,
          transition: videoSrc ? "opacity 150ms ease" : undefined,
        }}>
          {shape.label}
        </span>
      </div>

      {/* Description */}
      <div style={{ width: "100%", flexShrink: 0 }}>
        <p style={{
          margin: 0,
          fontFamily: FONT_SANS,
          fontSize: "15px",
          color: descColor,
          letterSpacing: "-0.01em",
          lineHeight: "normal",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }}>
          {tool.description || "\u00a0"}
        </p>
      </div>

      {/* Delete button (My Tools) */}
      {onDelete && (
        <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", alignItems: "center", gap: "4px", zIndex: 2 }}>
          {confirming ? (
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "5px", background: dark ? theme.panelBg : "#fff", border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "4px 6px", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: "11px", color: theme.text, whiteSpace: "nowrap" }}>Löschen?</span>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ height: "22px", padding: "0 9px", background: "#b43c3c", border: "none", borderRadius: "4px", cursor: "pointer", outline: "none", fontFamily: FONT_SANS, fontSize: "11px", color: "#fff" }}>Ja</button>
              <button onClick={(e) => { e.stopPropagation(); setConfirming(false); }} style={{ height: "22px", padding: "0 9px", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: "4px", cursor: "pointer", outline: "none", fontFamily: FONT_SANS, fontSize: "11px", color: theme.text }}>Nein</button>
            </div>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); setConfirming(true); }} title="Aus meinen Tools entfernen" style={{ width: "24px", height: "24px", background: dark ? theme.panelBg : "#fef8ee", border: `1px dashed ${shapeBorder}`, borderRadius: "50%", cursor: "pointer", outline: "none", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, fontSize: "16px", color: theme.muted, lineHeight: 1 }}>×</button>
          )}
        </div>
      )}

      {/* Favorite button (All Tools) */}
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          title={isFavorite ? "Aus My Tools entfernen" : "Zu My Tools hinzufügen"}
          style={{ position: "absolute", top: "10px", right: "10px", zIndex: 2, width: "26px", height: "26px", background: dark ? theme.panelBg : "#fef8ee", border: `1px dashed ${shapeBorder}`, borderRadius: "50%", cursor: "pointer", outline: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <HeartIcon filled={!!isFavorite} color={isFavorite ? "#d4607a" : theme.muted} />
        </button>
      )}
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

function Section({ title, tools, onOpen, onDelete, emptyMsg, sessionId, favorites, onToggleFavorite, showCreate, tab, onTabChange, DE }: {
  title: string;
  tools: NewToolData[];
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
  emptyMsg: string;
  sessionId: string;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  showCreate?: boolean;
  tab?: "all" | "my";
  onTabChange?: (t: "all" | "my") => void;
  DE?: boolean;
}) {
  const theme = useContext(ThemeContext);
  const dark = useContext(DarkContext);
  const navigate = useNavigate();
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: `1px dashed ${theme.border}`, paddingBottom: "12px" }}>
        <span style={{ fontFamily: FONT_CMP_SERIF, fontSize: "32px", color: theme.headline, lineHeight: "normal" }}>{title}</span>
        {tab !== undefined && onTabChange && (
          <div style={{ display: "flex", gap: "8px" }}>
            {(["all", "my"] as const).map((t) => {
              const isActive = tab === t;
              const label = t === "all" ? (DE ? "Alle Tools" : "All Tools") : (DE ? "Meine Tools" : "My Tools");
              return (
                <button key={t} onClick={() => onTabChange(t)} style={{ height: "31px", padding: "0 12px", borderRadius: "4px", background: isActive ? theme.headline : "transparent", color: isActive ? (dark ? theme.bg : "#fcf6ef") : theme.muted, border: isActive ? "none" : `1px dashed ${theme.border}`, fontFamily: FONT_SANS, fontSize: "15px", letterSpacing: "-0.01em", cursor: "pointer", outline: "none" }}>{label}</button>
              );
            })}
          </div>
        )}
        {showCreate && (
          <button
            onClick={() => navigate("/create-tool")}
            style={{
              marginLeft: "auto",
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
            {DE ? "+ Eigenes Tool erstellen" : "+ Create your own tool"}
          </button>
        )}
      </div>
      {tools.length === 0 ? (
        <p style={{ fontFamily: FONT_SANS, fontSize: "14px", color: theme.muted, margin: 0 }}>{emptyMsg}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "32px" }}>
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


export default function PlaygroundNew() {
  const { sessionId, loading, lang, setLang, dark, setDark, favorites, toggleFavorite, myToolsAll, publicTools, tools, navigateToTool, handleDelete } = usePlaygroundData();
  const navigate = useNavigate();
  const toolsRef = useRef<HTMLDivElement>(null);
  const [exploreMode, setExploreMode] = useState(false);
  const [launchTool, setLaunchTool] = useState<NewToolData | null>(null);
  const [tab, setTab] = useState<"all" | "my">("all");

  const openTool = (id: string) => {
    const t = tools.find(x => x.id === id) ?? null;
    setLaunchTool(t);
  };

  const DE = lang === "de";
  const theme = getTheme(dark);
  const displayedTools = tab === "all" ? publicTools : myToolsAll;

  return (
    <ThemeContext.Provider value={theme}>
    <DarkContext.Provider value={dark}>
      <TopNav current="Playground" dark={dark} setDark={setDark} lang={lang} setLang={setLang} />
      <main style={{ minHeight: "100vh", height: "100vh", width: "100vw", overflowX: "hidden", overflowY: exploreMode ? "hidden" : "auto", position: "relative", backgroundColor: theme.bg, color: theme.text, fontFamily: FONT_SANS, WebkitOverflowScrolling: "touch" }}>
        <style>{`html, body, #root { height: 100%; overflow: hidden; }`}</style>

        <section aria-label="Writing tools playground" style={{ position: "relative", minHeight: "100vh", overflow: exploreMode ? "visible" : "hidden", background: "transparent" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 1680, height: 858, transform: exploreMode ? "translate(-50%, -50%) scale(0.88)" : "translate(-50%, -50%)", transition: "transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}>
            <div style={{ position: "absolute", inset: 0, animation: "_toolIn 1.2s ease-out 0.8s both" }}>
              <ToolShape label="...without stopping"      href="/create-tool?preset=without-stopping"    videoLight="without-stopping-light"    videoDark="without-stopping-dark"    bgLight="#fbf5eb" bgDark="#3e3e3e" videoFit="cover" style={{ left: 40,   top: 197, width: 236, height: 233, transform: "rotate(5.1deg)",   borderRadius: 200 }} textStyle={{ transform: "rotate(-5.1deg)" }} />
              <ToolShape label="...uninvited thoughts"    href="/create-tool?preset=uninvited-thoughts"  videoLight="uninvited-thoughts-light"  videoDark="uninvited-thoughts-dark"  bgLight="#eaf8f5" bgDark="#1f2f29" style={{ left: 420,  top: 57,  width: 241, height: 182, transform: "rotate(-9.25deg)", borderRadius: 4 }} textStyle={{ transform: "rotate(9.25deg)" }} />
              <ToolShape label="...off the grid"          href="/create-tool?preset=off-the-grid"        videoLight="off-the-grid-light"        videoDark="off-the-grid-dark"        bgLight="#fff0f4" bgDark="#37262d" style={{ left: 1220, top: 112, width: 251, height: 163, transform: "rotate(4.18deg)",  borderRadius: 4, justifyContent: "flex-start", alignItems: "flex-end", padding: 12 }} textStyle={{ transform: "rotate(-4.18deg)", marginBottom: 0 }} />
              <ToolShape label="...blind & then witness"  href="/create-tool?preset=blind-then-witness"  videoLight="blind-then-witness-light"  videoDark="blind-then-witness-dark"  bgLight="#ecf7ee" bgDark="#222d26" style={{ left: 213,  top: 579, width: 324, height: 163, transform: "rotate(6.45deg)",  borderRadius: 100 }} textStyle={{ transform: "rotate(-6.45deg)" }} />
              <ToolShape label="...with visible corrections" href="/create-tool?preset=visible-corrections" videoLight="visible-corrections-light" videoDark="visible-corrections-dark" bgLight="#f5f6ea" bgDark="#2f2836" style={{ left: 774,  top: 526, width: 363, height: 174, borderRadius: "40px 4px 40px 4px" }} />
              <ToolShape label="...in a spiral"           href="/create-tool?preset=in-a-spiral"         videoLight="in-a-spiral-light"         videoDark="in-a-spiral-dark"         bgLight="#ecf4fe" bgDark="#242c38" videoFit="cover" style={{ left: 1321, top: 414, width: 211, height: 309, transform: "rotate(12.11deg)", borderRadius: 200 }} textStyle={{ transform: "rotate(-12.11deg)" }} />
            </div>
            <div style={{ position: "absolute", left: 456, top: 300, width: 768, opacity: exploreMode ? 0 : 1, transition: "opacity 0.35s ease", pointerEvents: exploreMode ? "none" : "auto" }}>
              <HeroHeading DE={DE} theme={theme} />
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

        <div ref={toolsRef} style={{ width: "100%", boxSizing: "border-box", padding: "96px 100px 160px" }}>
          {loading ? (
            <SkeletonGrid title={DE ? "Tool-Sammlung" : "Tool Collection"} dark={dark} />
          ) : (
            <Section
              title={DE ? "Tool-Sammlung" : "Tool Collection"}
              tools={displayedTools}
              onOpen={openTool}
              onDelete={tab === "my" ? handleDelete : undefined}
              emptyMsg={tab === "all" ? (DE ? "Noch keine öffentlichen Tools vorhanden." : "No public tools yet.") : (DE ? "Noch keine eigenen Tools." : "No tools yet.")}
              sessionId={sessionId}
              favorites={favorites}
              onToggleFavorite={tab === "all" ? toggleFavorite : undefined}
              showCreate
              tab={tab}
              onTabChange={setTab}
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

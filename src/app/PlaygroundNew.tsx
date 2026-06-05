import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ToolPreview } from "./components/ToolPreview";
import { ToolLaunchModal } from "./components/ToolLaunchModal";
import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from "react";
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

// ── Explore field ─────────────────────────────────────────────────────────────
// The same six demo shapes from the hero, replicated across an evenly-spaced
// grid (with light jitter) so zooming out reveals more of them. The cell sizes
// vs. the shape sizes guarantee a minimum gap — cards never touch.
interface PresetShape {
  label: string; href: string;
  videoLight: string; videoDark: string;
  bgLight: string; bgDark: string;
  videoFit?: "cover" | "contain";
  w: number; h: number; radius: string | number;
}

const PRESET_SHAPES: PresetShape[] = [
  { label: "...without stopping",        href: "/create-tool?preset=without-stopping",    videoLight: "without-stopping-light",    videoDark: "without-stopping-dark",    bgLight: "#fbf5eb", bgDark: "#3e3e3e", videoFit: "cover", w: 236, h: 233, radius: 200 },
  { label: "...uninvited thoughts",      href: "/create-tool?preset=uninvited-thoughts",  videoLight: "uninvited-thoughts-light",  videoDark: "uninvited-thoughts-dark",  bgLight: "#eaf8f5", bgDark: "#1f2f29", w: 241, h: 182, radius: 4 },
  { label: "...off the grid",            href: "/create-tool?preset=off-the-grid",        videoLight: "off-the-grid-light",        videoDark: "off-the-grid-dark",        bgLight: "#fff0f4", bgDark: "#37262d", w: 251, h: 163, radius: 4 },
  { label: "...blind & then witness",    href: "/create-tool?preset=blind-then-witness",  videoLight: "blind-then-witness-light",  videoDark: "blind-then-witness-dark",  bgLight: "#ecf7ee", bgDark: "#222d26", w: 324, h: 163, radius: 100 },
  { label: "...with visible corrections", href: "/create-tool?preset=visible-corrections", videoLight: "visible-corrections-light", videoDark: "visible-corrections-dark", bgLight: "#f5f6ea", bgDark: "#2f2836", w: 363, h: 174, radius: "40px 4px 40px 4px" },
  { label: "...in a spiral",             href: "/create-tool?preset=in-a-spiral",         videoLight: "in-a-spiral-light",         videoDark: "in-a-spiral-dark",         bgLight: "#ecf4fe", bgDark: "#242c38", videoFit: "cover", w: 211, h: 309, radius: 200 },
];

const EXPLORE_SCALE = 0.9;
const FIELD_W = 3000, FIELD_H = 2600; // pannable domain around the hero
const POISSON_R = 420;                // min centre-to-centre distance (blue noise)

// Where the six hero shapes already sit (centre-relative world coords). They're
// seeded into the sampler so the originals stay put and new shapes keep clear.
const HERO_POSITIONS: [number, number][] = [
  [-682, -115.5], [-299.5, -281], [505.5, -235.5], [-465, 231.5], [115.5, 184], [586.5, 139.5],
];
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface FieldSlot {
  key: string;
  x: number; y: number; // offset from field centre
  rot: number;
  tpl: PresetShape;     // shape template (size/colour) + default preset content
}

// Poisson-disk (Bridson) sampling — places the extra shapes with a guaranteed
// minimum spacing: evenly spread, no clumping, no gaps (blue noise). Only the
// six hero shapes are seeded, so they stay exactly where they are and every new
// shape keeps its distance from them and from each other.
function buildField(): FieldSlot[] {
  const rng = mulberry32(0x9e3779b1);
  const R = POISSON_R, W = FIELD_W, H = FIELD_H, k = 30;
  const cell = R / Math.SQRT2;
  const gw = Math.ceil(W / cell), gh = Math.ceil(H / cell);
  const grid = new Array<number>(gw * gh).fill(-1);
  const pts: { x: number; y: number }[] = [];
  const active: number[] = [];

  const gi = (x: number, y: number) => Math.floor(x / cell) + Math.floor(y / cell) * gw;
  const inDom = (x: number, y: number) => x >= 0 && x < W && y >= 0 && y < H;
  const farEnough = (x: number, y: number) => {
    const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
    for (let yy = Math.max(0, gy - 2); yy <= Math.min(gh - 1, gy + 2); yy++)
      for (let xx = Math.max(0, gx - 2); xx <= Math.min(gw - 1, gx + 2); xx++) {
        const id = grid[xx + yy * gw];
        if (id >= 0) {
          const dx = pts[id].x - x, dy = pts[id].y - y;
          if (dx * dx + dy * dy < R * R) return false;
        }
      }
    return true;
  };
  const add = (x: number, y: number) => {
    const id = pts.length;
    pts.push({ x, y });
    grid[gi(x, y)] = id;
    active.push(id);
    return id;
  };

  // Seed only the six hero shapes (world -> domain coords) so they stay put.
  HERO_POSITIONS.forEach(([wx, wy]) => {
    const x = wx + W / 2, y = wy + H / 2;
    if (inDom(x, y)) add(x, y);
  });
  const FIRST = HERO_POSITIONS.length; // skip the hero seeds when rendering

  while (active.length > 0) {
    const ai = Math.floor(rng() * active.length);
    const p = pts[active[ai]];
    let placed = false;
    for (let t = 0; t < k; t++) {
      const a = rng() * Math.PI * 2;
      const rad = R * (1 + rng()); // annulus [R, 2R)
      const nx = p.x + Math.cos(a) * rad, ny = p.y + Math.sin(a) * rad;
      if (inDom(nx, ny) && farEnough(nx, ny)) { add(nx, ny); placed = true; break; }
    }
    if (!placed) active.splice(ai, 1);
  }

  const slots: FieldSlot[] = [];
  for (let id = FIRST; id < pts.length; id++) {
    slots.push({ key: `p-${id}`, x: pts[id].x - W / 2, y: pts[id].y - H / 2, rot: ((id * 73) % 15) - 7, tpl: PRESET_SHAPES[0] });
  }
  // Nearest the centre first, so created tools fill in from the middle outward.
  slots.sort((a, b) => (a.x * a.x + a.y * a.y) - (b.x * b.x + b.y * b.y));
  slots.forEach((s, i) => { s.tpl = PRESET_SHAPES[i % PRESET_SHAPES.length]; });
  return slots;
}

// One field card: a preset placeholder, or a user's created tool that has taken
// over that slot. Same shape template either way — only the content swaps.
function FieldShape({
  label, w, h, radius, bgLight, bgDark, videoFit = "cover",
  videoLight, videoDark, tool, style, textStyle, onClick,
}: {
  label: string;
  w: number; h: number; radius: string | number;
  bgLight?: string; bgDark?: string;
  videoFit?: "cover" | "contain";
  videoLight?: string; videoDark?: string;
  tool?: NewToolData;
  style: CSSProperties; textStyle?: CSSProperties;
  onClick: () => void;
}) {
  const theme = useContext(ThemeContext);
  const dark = useContext(DarkContext);
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideo = tool?.params.previewVideo;
  const src = previewVideo ?? (tool ? null : `/videos/${dark ? videoDark : videoLight}.webm`);
  const bg = dark ? (bgDark ?? theme.toolBg) : (bgLight ?? theme.toolBg);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    v.muted = true; v.playsInline = true;
    const play = () => v.play().catch(() => undefined);
    play();
    if (v.readyState < 2) v.addEventListener("canplay", play, { once: true });
  }, [src]);

  return (
    <div
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{
        position: "absolute", boxSizing: "border-box",
        width: w, height: h, borderRadius: radius,
        border: `1px dashed ${theme.border}`, background: bg,
        overflow: "hidden", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        ...style,
      }}
    >
      {src ? (
        <video key={src} ref={videoRef} muted loop playsInline preload="auto"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: videoFit, opacity: hovered ? 0 : 1, transition: "opacity 120ms ease", pointerEvents: "none" }}>
          <source src={src} />
        </video>
      ) : tool ? (
        <div style={{ position: "absolute", inset: 0, opacity: hovered ? 0 : 1, transition: "opacity 120ms ease", pointerEvents: "none" }}>
          <ToolPreview tool={tool} active={!hovered} dark={dark} />
        </div>
      ) : null}
      <span style={{ position: "relative", zIndex: 1, fontFamily: FONT_SANS, fontSize: 15, color: theme.text, opacity: hovered ? 1 : 0, transition: "opacity 120ms ease", textAlign: "center", padding: "0 12px", ...textStyle }}>
        {label}
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
  const sectionRef = useRef<HTMLElement>(null);
  const [exploreMode, setExploreMode] = useState(false);
  const [launchTool, setLaunchTool] = useState<NewToolData | null>(null);

  // ── Pannable explore field ──────────────────────────────────────────────
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [grabbing, setGrabbing] = useState(false);
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const movedRef = useRef(false);

  const exploreCards = useMemo(() => buildField(), []);

  const clampPan = (x: number, y: number) => {
    const maxX = Math.max(0, (FIELD_W * EXPLORE_SCALE) / 2 - window.innerWidth / 2 + 200);
    const maxY = Math.max(0, (FIELD_H * EXPLORE_SCALE) / 2 - window.innerHeight / 2 + 200);
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  };

  const openExplore = () => { setPan({ x: 0, y: 0 }); setExploreMode(true); };
  const closeExplore = () => { setExploreMode(false); setPan({ x: 0, y: 0 }); };

  const onFieldPointerDown = (e: ReactPointerEvent) => {
    if (!exploreMode) return;
    panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    movedRef.current = false;
    setGrabbing(true);
  };
  const onFieldPointerMove = (e: ReactPointerEvent) => {
    const s = panStart.current;
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedRef.current = true;
    setPan(clampPan(s.px + dx, s.py + dy));
  };
  const onFieldPointerUp = () => { panStart.current = null; setGrabbing(false); };

  // Trackpad / wheel panning (non-passive so we can preventDefault)
  useEffect(() => {
    if (!exploreMode) return;
    const el = sectionRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setPan((p) => clampPan(p.x - e.deltaX, p.y - e.deltaY));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [exploreMode]);

  const openTool = (id: string) => {
    const t = tools.find(x => x.id === id) ?? null;
    setLaunchTool(t);
  };

  const DE = lang === "de";
  const theme = getTheme(dark);

  // Newest-created public tools take over the field slots first (centre-out),
  // replacing the preset placeholders one after another.
  const fieldTools = useMemo(
    () => [...publicTools].sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || "")),
    [publicTools],
  );

  return (
    <ThemeContext.Provider value={theme}>
    <DarkContext.Provider value={dark}>
      <main style={{ minHeight: "100vh", height: "100vh", width: "100vw", overflowX: "hidden", overflowY: exploreMode ? "hidden" : "auto", position: "relative", backgroundColor: theme.bg, backgroundImage: exploreMode ? "none" : theme.dotGrid, backgroundSize: "42px 42px", color: theme.text, fontFamily: FONT_SANS, WebkitOverflowScrolling: "touch" }}>
        <style>{`html, body, #root { height: 100%; overflow: hidden; }`}</style>

        <section
          ref={sectionRef}
          aria-label="Writing tools playground"
          onPointerDown={onFieldPointerDown}
          onPointerMove={onFieldPointerMove}
          onPointerUp={onFieldPointerUp}
          onPointerLeave={onFieldPointerUp}
          onClickCapture={(e) => { if (movedRef.current) { e.preventDefault(); e.stopPropagation(); } }}
          style={{
            position: "relative", minHeight: "100vh", overflow: "hidden", background: "transparent",
            cursor: exploreMode ? (grabbing ? "grabbing" : "grab") : undefined,
            touchAction: exploreMode ? "none" : undefined,
            userSelect: exploreMode ? "none" : undefined,
          }}
        >
          {/* Pannable plane — zoom, dot grid & field all move together */}
          <div style={{ position: "absolute", inset: 0, transformOrigin: "center", transform: exploreMode ? `translate(${pan.x}px, ${pan.y}px) scale(${EXPLORE_SCALE})` : "none", transition: grabbing ? "none" : "transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}>
            {exploreMode && (
              <div style={{ position: "absolute", left: "50%", top: "50%", width: FIELD_W + 2400, height: FIELD_H + 2400, transform: "translate(-50%, -50%)", backgroundImage: theme.dotGrid, backgroundSize: "42px 42px", pointerEvents: "none" }} />
            )}
            <div style={{ position: "absolute", left: "50%", top: "50%", width: 1680, height: 858, transform: "translate(-50%, -50%)" }}>
              <div style={{ position: "absolute", inset: 0, animation: "_toolIn 1.2s ease-out 0.8s both" }}>
                <ToolShape label="...without stopping"      href="/create-tool?preset=without-stopping"    videoLight="without-stopping-light"    videoDark="without-stopping-dark"    bgLight="#fbf5eb" bgDark="#3e3e3e" videoFit="cover" style={{ left: 40,   top: 197, width: 236, height: 233, transform: "rotate(5.1deg)",   borderRadius: 200 }} textStyle={{ transform: "rotate(-5.1deg)" }} />
                <ToolShape label="...uninvited thoughts"    href="/create-tool?preset=uninvited-thoughts"  videoLight="uninvited-thoughts-light"  videoDark="uninvited-thoughts-dark"  bgLight="#eaf8f5" bgDark="#1f2f29" style={{ left: 420,  top: 57,  width: 241, height: 182, transform: "rotate(-9.25deg)", borderRadius: 4 }} textStyle={{ transform: "rotate(9.25deg)" }} />
                <ToolShape label="...off the grid"          href="/create-tool?preset=off-the-grid"        videoLight="off-the-grid-light"        videoDark="off-the-grid-dark"        bgLight="#fff0f4" bgDark="#37262d" style={{ left: 1220, top: 112, width: 251, height: 163, transform: "rotate(4.18deg)",  borderRadius: 4, justifyContent: "flex-start", alignItems: "flex-end", padding: 12 }} textStyle={{ transform: "rotate(-4.18deg)", marginBottom: 0 }} />
                <ToolShape label="...blind & then witness"  href="/create-tool?preset=blind-then-witness"  videoLight="blind-then-witness-light"  videoDark="blind-then-witness-dark"  bgLight="#ecf7ee" bgDark="#222d26" style={{ left: 213,  top: 579, width: 324, height: 163, transform: "rotate(6.45deg)",  borderRadius: 100 }} textStyle={{ transform: "rotate(-6.45deg)" }} />
                <ToolShape label="...with visible corrections" href="/create-tool?preset=visible-corrections" videoLight="visible-corrections-light" videoDark="visible-corrections-dark" bgLight="#f5f6ea" bgDark="#2f2836" style={{ left: 774,  top: 526, width: 363, height: 174, borderRadius: "40px 4px 40px 4px" }} />
                <ToolShape label="...in a spiral"           href="/create-tool?preset=in-a-spiral"         videoLight="in-a-spiral-light"         videoDark="in-a-spiral-dark"         bgLight="#ecf4fe" bgDark="#242c38" videoFit="cover" style={{ left: 1321, top: 414, width: 211, height: 309, transform: "rotate(12.11deg)", borderRadius: 200 }} textStyle={{ transform: "rotate(-12.11deg)" }} />
              </div>
              <div style={{ position: "absolute", left: 456, top: 340, width: 768, opacity: exploreMode ? 0 : 1, transition: "opacity 0.35s ease", pointerEvents: exploreMode ? "none" : "auto" }}>
                <HeroHeading DE={DE} theme={theme} />
              </div>
              {!exploreMode && (
                <div style={{ position: "absolute", left: 456, top: 460, width: 768, display: "flex", justifyContent: "center", gap: "12px", animation: "_heroIn 1s ease-out 0.5s both" }}>
                  <button
                    onClick={openExplore}
                    style={{ border: "none", borderRadius: "4px", cursor: "pointer", outline: "none", padding: "12px 24px", fontFamily: FONT_SANS, fontSize: "15px", background: dark ? theme.text : theme.headline, color: theme.bg }}
                  >
                    {DE ? "Alle Tools entdecken" : "Explore all tools"}
                  </button>
                  <button
                    onClick={() => navigate("/create-tool")}
                    style={{ background: theme.toolBg, border: `1px dashed ${theme.border}`, borderRadius: "4px", cursor: "pointer", outline: "none", padding: "12px 24px", fontFamily: FONT_SANS, fontSize: "15px", color: theme.text }}
                  >
                    {DE ? "Eigenes Tool erstellen" : "Create your tool"}
                  </button>
                </div>
              )}
            </div>

            {/* Extra shapes (blue-noise placed). User-created tools take over
                these slots one by one; empty slots show a preset placeholder. */}
            {exploreMode && exploreCards.map((slot, i) => {
              const tool = fieldTools[i];
              const t = slot.tpl;
              return (
                <FieldShape
                  key={slot.key}
                  tool={tool}
                  label={tool ? (tool.name || "Unnamed Tool") : t.label}
                  w={t.w} h={t.h} radius={t.radius}
                  bgLight={t.bgLight} bgDark={t.bgDark} videoFit={t.videoFit ?? "cover"}
                  videoLight={tool ? undefined : t.videoLight}
                  videoDark={tool ? undefined : t.videoDark}
                  onClick={() => { if (tool) { closeExplore(); openTool(tool.id); } else { navigate(t.href); } }}
                  style={{
                    left: "50%", top: "50%",
                    transform: `translate(-50%, -50%) translate(${slot.x}px, ${slot.y}px) rotate(${slot.rot}deg)`,
                    animation: `_toolIn 0.5s ease-out ${0.3 + (i % 10) * 0.03}s both`,
                  }}
                  textStyle={{ transform: `rotate(${-slot.rot}deg)` }}
                />
              );
            })}
          </div>
        </section>

        {!exploreMode && <PageNavFAB dark={dark} myToolsAll={myToolsAll} DE={DE} theme={theme} loading={loading} />}
        {exploreMode && (
          <button
            onClick={closeExplore}
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

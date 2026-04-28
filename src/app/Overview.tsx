import { useState, useRef, useEffect, memo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";

// ── Assets ────────────────────────────────────────────────────────────────────


// ── Constants ─────────────────────────────────────────────────────────────────

const FONT_UI      = "'Area Inktrap', 'Space Grotesk', sans-serif";
const FONT_UI_EXT  = "'Area Inktrap Extended', 'Area Inktrap', sans-serif";
const NAVY         = "#11112d";
const BORDER_NAVY  = "1px dashed #11112d";

const TOOLS = [
  { label: "...without stopping",         path: "/dont-stop-writing",           video: "without-stopping",       description: "Here, \"not writing\" is visualized, because the cursor keeps moving, whether you're keeping up or not." },
  { label: "...blind & then witness",     path: "/one-word-replay",             video: "blind-then-witness",     description: "You won't see what you're writing. And when you're done, you'll be able to watch yourself think and write." },
  { label: "...uninvited thoughts",       path: "/uninvited-thoughts",          video: "uninvited-thoughts",     description: "Focus on the moving dot and try not to think about anything. You won't be able to. Unwelcome thoughts will pop up. Write them down, send them off, and keep focusing on the dot." },
  { label: "...with visible corrections", path: "/loschen-korrigieren",         video: "visible-corrections",    description: "Everything you write remains visible. Every correction. Inspired by old typewriters." },
  { label: "...fleeting",                 path: "/drifting-following-words",    video: "fleeting",               description: "Wörter folgen dir nach und verschwinden, bevor sie ankern können." },
  { label: "...into thin air",            path: "/drifting-disappearing-words", video: "into-thin-air",          description: "Write down your thoughts and watch them disappear again… drifting away and fading." },
  { label: "...off the grid",             path: "/off-the-grid",               video: "off-the-grid",           description: "Don't write linearly on pre-drawn lines; instead, draw your own lines on which you can then write." },
  { label: "...in a spiral",              path: "/in-a-spiral",                video: "in-a-spiral",            description: "In this experiment, you write in a spiral; the old is rolled up, and the new is always in focus." },
  { label: "...randomly & spatially",     path: "/randomly-spatially",         video: "randomly-spatially",     description: "Words and sentences do not appear sequentially here, but are scattered throughout the space at varying distances. Inspired by our chaotic inner world." },
  { label: "...anonymously in public",    path: "/anonymously-in-public",       video: "anonymously-in-public",  description: "Write about your deepest secrets, or about the people next to you. They won't see it, because only the current letter is visible at any given time." },
  { label: "...against the clock",        path: "/visual-timer",                video: "against-the-clock",      description: "Here you can visually see time slowly running out, as the background gradually turns the same color as your text…until you can no longer see what you've written." },
];

// ── Drift physics ─────────────────────────────────────────────────────────────

const R_PERSP = 900;
const R_MIN_Z = -500;
const R_MAX_Z =  200;
const DAMP    = 0.985;

function rnd(min: number, max: number) { return Math.random() * (max - min) + min; }
function depthOpacity(z: number) { return 0.18 + ((z - R_MIN_Z) / (R_MAX_Z - R_MIN_Z)) * 0.55; }

interface Tool {
  label: string;
  path: string;
  video: string;
  description: string;
}

interface DriftChunk {
  id: number; label: string; path: string; video: string; description: string;
  x: number; y: number; z: number;
  rotateX: number; rotateY: number; rotateZ: number;
  vx: number; vy: number; vz: number;
  baseSpeed: number;
  wanderAngle: number; wanderAngleZ: number;
  baseFontSize: number; // rem
}

// ── DriftingToolNames ─────────────────────────────────────────────────────────

const DriftingToolNames = memo(function DriftingToolNames({ onWordClick, uiHoveredRef }: { onWordClick: (tool: Tool) => void; uiHoveredRef: React.MutableRefObject<boolean> }) {
  const wrapRef     = useRef<HTMLDivElement>(null);
  const chunksRef   = useRef<DriftChunk[]>([]);
  const elMapRef    = useRef<Map<number, HTMLDivElement>>(new Map());
  const hoveredRef   = useRef<number | null>(null);
  const cursorRef    = useRef<HTMLDivElement>(null);
  const mouseNormRef = useRef({ x: 0, y: 0 });
  const tiltRef      = useRef({ x: 0, y: 0 });
  const rafRef       = useRef(0);
  const lastTRef     = useRef(0);
  const hasMovedRef  = useRef(false);
  const [, tick]     = useState(0);
  const initRef      = useRef(false);

  // track mouse for custom cursor + tilt
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      hasMovedRef.current = true;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
      const wrap = wrapRef.current;
      if (wrap) {
        const { left, top, width, height } = wrap.getBoundingClientRect();
        mouseNormRef.current.x = ((e.clientX - left) / width)  * 2 - 1;
        mouseNormRef.current.y = ((e.clientY - top)  / height) * 2 - 1;
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // initialise chunks once the wrapper has dimensions
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || initRef.current) return;
    const ro = new ResizeObserver(() => {
      if (initRef.current) return;
      const { width: w, height: h } = wrap.getBoundingClientRect();
      if (!w || !h) return;
      initRef.current = true;

      const chunks: DriftChunk[] = [];
      let id = 0;
      for (let rep = 0; rep < 2; rep++) {
        for (const t of TOOLS) {
          const z      = rnd(R_MIN_Z * 0.6, R_MAX_Z * 0.75);
          const s      = R_PERSP / (R_PERSP - z);
          const xRange = w / s * 0.48;
          const yRange = h / s * 0.47;
          chunks.push({
            id:           id++,
            label:        t.label,
            path:         t.path,
            video:        t.video,
            description:  t.description,
            x:            rnd(-xRange, xRange),
            y:            rnd(-yRange, yRange),
            z,
            rotateX:      rnd(-9, 9),
            rotateY:      rnd(-14, 14),
            rotateZ:      rnd(-7, 7),
            vx: 0, vy: 0, vz: 0,
            baseSpeed:    rnd(0.4, 0.9),
            wanderAngle:  rnd(0, Math.PI * 2),
            wanderAngleZ: rnd(0, Math.PI * 2),
            baseFontSize: rnd(1.03, 1.8),
          });
        }
      }
      chunksRef.current = chunks;
      tick(n => n + 1);
      ro.disconnect();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // animation loop
  useEffect(() => {
    const loop = (time: number) => {
      if (!lastTRef.current) lastTRef.current = time;
      const dt = Math.min((time - lastTRef.current) / 1000, 0.1);
      lastTRef.current = time;

      const wrap = wrapRef.current;
      const w = wrap ? wrap.getBoundingClientRect().width  : 800;
      const h = wrap ? wrap.getBoundingClientRect().height : 600;
      const chunks = chunksRef.current;

      // smoothly lerp tilt toward mouse position
      tiltRef.current.x += (mouseNormRef.current.x - tiltRef.current.x) * 0.04;
      tiltRef.current.y += (mouseNormRef.current.y - tiltRef.current.y) * 0.04;

      // wander + boundary
      for (const c of chunks) {
        const hovered = hoveredRef.current === c.id;
        if (!hovered) {
          c.wanderAngle  += rnd(-0.3, 0.3) * dt;
          c.wanderAngleZ += rnd(-0.2, 0.2) * dt;
          const ws = c.baseSpeed * 1.1;
          c.vx += Math.cos(c.wanderAngle)  * ws * dt;
          c.vy += Math.sin(c.wanderAngle)  * ws * dt;
          c.vz += Math.sin(c.wanderAngleZ) * ws * 0.12 * dt;
          c.vx *= DAMP; c.vy *= DAMP; c.vz *= DAMP;
          c.x += c.vx * dt * 10; c.y += c.vy * dt * 10; c.z += c.vz * dt * 5;

          const s  = R_PERSP / (R_PERSP - c.z);
          const sx = c.x * s, sy = c.y * s;
          const mx = w * 0.48, my = h * 0.47;
          if (sx >  mx) c.vx -= (sx - mx) * 0.002;
          if (sx < -mx) c.vx -= (sx + mx) * 0.002;
          if (sy >  my) c.vy -= (sy - my) * 0.002;
          if (sy < -my) c.vy -= (sy + my) * 0.002;
          c.z = Math.max(R_MIN_Z, Math.min(R_MAX_Z, c.z));
          if (c.z <= R_MIN_Z) c.vz =  Math.abs(c.vz) * 0.3;
          if (c.z >= R_MAX_Z) c.vz = -Math.abs(c.vz) * 0.3;
        } else {
          c.vx *= 0.88; c.vy *= 0.88; c.vz *= 0.88;
          c.x += c.vx * dt * 6; c.y += c.vy * dt * 6;
        }
      }

      // repulsion — keep words from overlapping
      const MIN_DIST = 200;
      for (let i = 0; i < chunks.length; i++) {
        for (let j = i + 1; j < chunks.length; j++) {
          const a = chunks[i], b = chunks[j];
          const sa = R_PERSP / (R_PERSP - a.z);
          const sb = R_PERSP / (R_PERSP - b.z);
          const dx = a.x * sa - b.x * sb;
          const dy = a.y * sa - b.y * sb;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MIN_DIST && dist > 0.5) {
            const force = ((MIN_DIST - dist) / MIN_DIST) * 0.005;
            const nx = dx / dist, ny = dy / dist;
            a.vx += (nx * force) / sa;
            a.vy += (ny * force) / sa;
            b.vx -= (nx * force) / sb;
            b.vy -= (ny * force) / sb;
          }
        }
      }

      // update DOM
      for (const c of chunks) {
        const hovered = hoveredRef.current === c.id;
        const domEl = elMapRef.current.get(c.id);
        if (domEl) {
          const s   = R_PERSP / (R_PERSP - c.z);
          const sx  = c.x * s, sy = c.y * s;
          const op  = hovered ? 0.72 : depthOpacity(c.z);
          const blur = c.z < -200 ? ((-200 - c.z) / 200) * 1.5 : 0;
          const tRX = c.rotateX - tiltRef.current.y * 12;
          const tRY = c.rotateY + tiltRef.current.x * 16;
          domEl.style.transform = `translate(-50%,-50%) translate(${sx}px,${sy}px) scale(${s}) rotateX(${tRX}deg) rotateY(${tRY}deg) rotateZ(${c.rotateZ}deg)`;
          domEl.style.opacity   = `${op}`;
          domEl.style.filter    = blur > 0 ? `blur(${blur}px)` : "none";
          domEl.style.color     = hovered ? NAVY : `rgba(49,54,66,1)`;
        }
      }

      // show cursor always; hide only when over UI panels or before first mouse move
      if (cursorRef.current) {
        cursorRef.current.style.opacity = (hasMovedRef.current && !uiHoveredRef.current) ? "1" : "0";
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const chunks = chunksRef.current;

  return (
    <>
    {createPortal(
      <div
        ref={cursorRef}
        style={{
          position: "fixed", top: 0, left: 0,
          transform: "translate(-200px, -200px)",
          pointerEvents: "none", zIndex: 9999,
          opacity: 0, transition: "opacity 0.15s",
          userSelect: "none",
        }}
      >
        <div style={{ transform: "translate(-50%, -50%)" }}>
          <span style={{
            fontFamily: FONT_UI, fontSize: "11px", fontWeight: 600,
            color: NAVY, letterSpacing: "0.08em", whiteSpace: "nowrap",
          }}>
            think & write...
          </span>
        </div>
      </div>,
      document.body
    )}
    <div
      ref={wrapRef}
      style={{
        position: "absolute", inset: 0,
        perspective: `${R_PERSP}px`, perspectiveOrigin: "50% 50%",
        overflow: "hidden", pointerEvents: "none",
      }}
    >
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
        {chunks.map(c => (
          <div
            key={c.id}
            ref={el => { if (el) elMapRef.current.set(c.id, el); }}
            onMouseEnter={() => { hoveredRef.current = c.id; }}
            onMouseLeave={() => { hoveredRef.current = null; }}
            onClick={e => { e.stopPropagation(); onWordClick({ label: c.label, path: c.path, video: c.video, description: c.description }); }}
            style={{
              position: "absolute", left: "50%", top: "50%",
              fontFamily: "'Courier New', monospace",
              fontSize: `${c.baseFontSize}rem`,
              fontWeight: 400,
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              userSelect: "none",
              pointerEvents: "all",
              cursor: "none",
              willChange: "transform, opacity",
              transformStyle: "preserve-3d",
              color: "rgba(49,54,66,1)",
              transition: "color 0.2s ease",
            }}
          >
            {c.label}
          </div>
        ))}
      </div>
    </div>
    </>
  );
});

// ── Tool Preview Panel ────────────────────────────────────────────────────────

function ToolPreviewPanel({ tool, onClose, uiHoveredRef }: { tool: Tool; onClose: () => void; uiHoveredRef: React.MutableRefObject<boolean> }) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      key={tool.path}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.14 }}
      style={{
        position: "absolute",
        left: "50%", top: "50%",
        x: "-50%", y: "-50%",
        zIndex: 100,
        backgroundColor: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(4px)",
        border: BORDER_NAVY,
        padding: "24px",
        width: "669px",
        height: "286px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "row",
        gap: "24px",
        cursor: "default",
        pointerEvents: "all",
        flexShrink: 0,
      }}
      onMouseEnter={() => { uiHoveredRef.current = true; }}
      onMouseLeave={() => { uiHoveredRef.current = false; }}
      onClick={e => e.stopPropagation()}
    >
      {/* Left column — 238px tall, button always pinned to bottom */}
      <div style={{ flex: "1 0 0", minWidth: 0, height: "238px", position: "relative" }}>

        {/* Title + description — max 174px so button always fits below */}
        <div style={{ overflow: "hidden", maxHeight: "174px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{
            fontFamily: "'Courier Prime', 'Courier New', monospace",
            fontSize: "26px", fontWeight: 400,
            color: NAVY, margin: 0,
            letterSpacing: "-1.3px",
            textAlign: "center",
            lineHeight: "1.15",
          }}>
            {tool.label}
          </p>
          <p style={{
            fontFamily: FONT_UI, fontSize: "12px", fontWeight: 600,
            color: "#060613", margin: 0,
            lineHeight: "20px", letterSpacing: "0.1152px",
          }}>
            {tool.description}
          </p>
        </div>

        {/* Start button — pinned to bottom at y=190 */}
        <button
          onClick={() => { onClose(); navigate(tool.path); }}
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: "48px",
            backgroundColor: "rgba(255,255,255,0.5)",
            border: BORDER_NAVY,
            cursor: "pointer", fontFamily: FONT_UI,
            fontSize: "12px", fontWeight: 600,
            color: NAVY, letterSpacing: "0.1152px",
          }}
        >
          Start
        </button>
      </div>

      {/* Vertical divider */}
      <div style={{ width: "1px", alignSelf: "stretch", borderLeft: "1px dashed #11112d", flexShrink: 0 }} />

      {/* Right column — video fills full height */}
      <div style={{ flex: "1 0 0", minWidth: 0, alignSelf: "stretch", border: BORDER_NAVY, overflow: "hidden" }}>
        <video
          key={tool.video}
          autoPlay loop muted playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        >
          <source src={`${import.meta.env.BASE_URL}videos/${tool.video}.webm`} type="video/webm" />
          <source src={`${import.meta.env.BASE_URL}videos/${tool.video}.mp4`} type="video/mp4" />
        </video>
      </div>
    </motion.div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

export default function Overview() {
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const uiHoveredRef = useRef(false);

  return (
    <>
      <div
        style={{
          backgroundColor: "#f5f5f6",
          width: "100vw",
          height: "100vh",
          position: "relative",
          overflow: "hidden",
          cursor: "none",
        }}
        onClick={() => setSelectedTool(null)}
      >
        {/* ── Drifting tool names ── */}
        <DriftingToolNames onWordClick={setSelectedTool} uiHoveredRef={uiHoveredRef} />

        {/* ── Top-left panel ── */}
        <div
          onMouseEnter={() => { uiHoveredRef.current = true; }}
          onMouseLeave={() => { uiHoveredRef.current = false; }}
          style={{
            position: "absolute",
            top: 0, left: 0,
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            width: "307px",
            boxSizing: "border-box",
            zIndex: 10,
            cursor: "default",
          }}
        >
          {/* Logo card */}
          <div
            style={{
              backgroundColor: NAVY,
              border: BORDER_NAVY,
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 24px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "121.682px",
                overflow: "hidden",
              }}
            >
              <p style={{
                fontFamily: FONT_UI_EXT,
                fontSize: "15.87px",
                fontWeight: 700,
                letterSpacing: "-0.6348px",
                color: "#f2f3f6",
                margin: 0,
                lineHeight: "normal",
                whiteSpace: "nowrap",
                alignSelf: "flex-start",
              }}>
                Shaping
              </p>
              <p style={{
                fontFamily: FONT_UI_EXT,
                fontSize: "15.87px",
                fontWeight: 700,
                letterSpacing: "-0.6348px",
                color: "#f2f3f6",
                margin: 0,
                lineHeight: "normal",
                whiteSpace: "nowrap",
                alignSelf: "flex-end",
              }}>
                Thoughts
              </p>
            </div>
          </div>

          {/* Description card */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.5)",
              backdropFilter: "blur(4px)",
              border: BORDER_NAVY,
              padding: "16px 24px",
              boxSizing: "border-box",
            }}
          >
            <p style={{
              fontFamily: FONT_UI,
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.1152px",
              lineHeight: "20px",
              color: "black",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}>
              {"Schreibtools formen durch ihre Regeln, wie und was wir Denken. \n\nShaping Thought erforscht, was passiert, wenn wir diese Regeln verändern."}
            </p>
          </div>

          {/* About the Project button */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.5)",
              backdropFilter: "blur(4px)",
              border: BORDER_NAVY,
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 24px",
              boxSizing: "border-box",
              cursor: "pointer",
            }}
          >
            <p style={{
              fontFamily: FONT_UI,
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.1152px",
              lineHeight: "17.28px",
              color: NAVY,
              margin: 0,
              whiteSpace: "nowrap",
            }}>
              About the Project
            </p>
          </div>
        </div>

        {/* ── Tool preview panel (no overlay) ── */}
        <AnimatePresence>
          {selectedTool && (
            <ToolPreviewPanel
              key="tool-panel"
              tool={selectedTool}
              onClose={() => setSelectedTool(null)}
              uiHoveredRef={uiHoveredRef}
            />
          )}
        </AnimatePresence>

        {/* ── Bottom-right CTA ── */}
        <div
          onMouseEnter={() => { uiHoveredRef.current = true; }}
          onMouseLeave={() => { uiHoveredRef.current = false; }}
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            alignItems: "flex-start",
            zIndex: 10,
            cursor: "default",
          }}
        >
          {/* Create your own — grid overlay */}
          <div
            onClick={() => navigate("/parametrisches-tool")}
            style={{
              position: "relative",
              cursor: "pointer",
              width: "191px",
              height: "268.899px",
              flexShrink: 0,
            }}
          >
            {/* Dog-eared page shape */}
            <svg
              width="191" height="268.899"
              viewBox="0 0 191 268.899"
              fill="none"
              style={{ display: "block", position: "absolute", inset: 0 }}
            >
              {/* Card body — top-right corner cut off */}
              <path
                d="M 0.5,0.5 L 140.87,0.5 L 190.5,49.277 L 190.5,268.4 L 0.5,268.4 Z"
                fill="rgba(255,255,255,0.7)"
                stroke={NAVY}
                strokeWidth="1"
                strokeDasharray="5 4"
              />
              {/* Fold triangle — the bent-back corner */}
              <path
                d="M 140.87,0.5 L 140.87,49.277 L 190.5,49.277 Z"
                fill="rgba(0,0,0,0.05)"
                stroke={NAVY}
                strokeWidth="1"
                strokeDasharray="5 4"
              />
            </svg>

            {/* Text */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontFamily: FONT_UI,
                fontSize: "12px",
                fontWeight: 600,
                color: NAVY,
                textAlign: "center",
                lineHeight: "18px",
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              <p style={{ margin: 0 }}>Create your own</p>
              <p style={{ margin: 0 }}>Writing Interface</p>
            </div>
          </div>

          {/* See all tools button */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.5)",
              backdropFilter: "blur(4px)",
              border: BORDER_NAVY,
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 24px",
              boxSizing: "border-box",
              cursor: "pointer",
              width: "191px",
            }}
          >
            <p style={{
              fontFamily: FONT_UI,
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.1152px",
              lineHeight: "17.28px",
              color: NAVY,
              margin: 0,
              textAlign: "center",
              width: "109px",
            }}>
              See all tools
            </p>
          </div>
        </div>
      </div>

    </>
  );
}

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";

// ── Assets ────────────────────────────────────────────────────────────────────

const IMG_RECTANGLE = "https://www.figma.com/api/mcp/asset/2305d040-b7cb-4629-8012-61aeb2ff6761";
const IMG_VECTOR    = "https://www.figma.com/api/mcp/asset/4e65b27f-b35c-4131-a8a5-a53fea26f2f6";

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT_UI      = "'Area Inktrap', 'Space Grotesk', sans-serif";
const FONT_UI_EXT  = "'Area Inktrap Extended', 'Area Inktrap', sans-serif";
const NAVY         = "#11112d";
const BORDER_NAVY  = "1px dashed #11112d";

const TOOLS = [
  { label: "Don't Stop Writing",       path: "/dont-stop-writing"         },
  { label: "One-Word Replay",           path: "/one-word-replay"           },
  { label: "Uninvited Thoughts",        path: "/uninvited-thoughts"        },
  { label: "Löschen & Korrigieren",     path: "/loschen-korrigieren"       },
  { label: "Drifting Following Words",  path: "/drifting-following-words"  },
  { label: "Drifting Disappearing Words", path: "/drifting-disappearing-words" },
];

// ── Drift physics ─────────────────────────────────────────────────────────────

const R_PERSP = 900;
const R_MIN_Z = -500;
const R_MAX_Z =  200;
const DAMP    = 0.985;

function rnd(min: number, max: number) { return Math.random() * (max - min) + min; }
function depthOpacity(z: number) { return 0.18 + ((z - R_MIN_Z) / (R_MAX_Z - R_MIN_Z)) * 0.55; }

interface DriftChunk {
  id: number; label: string; path: string;
  x: number; y: number; z: number;
  rotateX: number; rotateY: number; rotateZ: number;
  vx: number; vy: number; vz: number;
  baseSpeed: number;
  wanderAngle: number; wanderAngleZ: number;
  baseFontSize: number; // rem
}

// ── DriftingToolNames ─────────────────────────────────────────────────────────

function DriftingToolNames({ onNavigate }: { onNavigate: (path: string) => void }) {
  const wrapRef     = useRef<HTMLDivElement>(null);
  const chunksRef   = useRef<DriftChunk[]>([]);
  const elMapRef    = useRef<Map<number, HTMLDivElement>>(new Map());
  const hoveredRef  = useRef<number | null>(null);
  const rafRef      = useRef(0);
  const lastTRef    = useRef(0);
  const [, tick]    = useState(0);
  const initRef     = useRef(false);

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
            x:            rnd(-xRange, xRange),
            y:            rnd(-yRange, yRange),
            z,
            rotateX:      rnd(-9, 9),
            rotateY:      rnd(-14, 14),
            rotateZ:      rnd(-7, 7),
            vx: 0, vy: 0, vz: 0,
            baseSpeed:    rnd(0.15, 0.45),
            wanderAngle:  rnd(0, Math.PI * 2),
            wanderAngleZ: rnd(0, Math.PI * 2),
            baseFontSize: rnd(0.72, 1.25),
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

      for (const c of chunksRef.current) {
        const hovered = hoveredRef.current === c.id;

        if (!hovered) {
          c.wanderAngle  += rnd(-0.3, 0.3) * dt;
          c.wanderAngleZ += rnd(-0.2, 0.2) * dt;
          const ws = c.baseSpeed * 0.4;
          c.vx += Math.cos(c.wanderAngle)  * ws * dt;
          c.vy += Math.sin(c.wanderAngle)  * ws * dt;
          c.vz += Math.sin(c.wanderAngleZ) * ws * 0.12 * dt;
          c.vx *= DAMP; c.vy *= DAMP; c.vz *= DAMP;
          c.x += c.vx * dt * 6; c.y += c.vy * dt * 6; c.z += c.vz * dt * 3;

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
          // brake quickly on hover
          c.vx *= 0.88; c.vy *= 0.88; c.vz *= 0.88;
          c.x += c.vx * dt * 6; c.y += c.vy * dt * 6;
        }

        const domEl = elMapRef.current.get(c.id);
        if (domEl) {
          const s   = R_PERSP / (R_PERSP - c.z);
          const sx  = c.x * s, sy = c.y * s;
          const op  = hovered ? 0.72 : depthOpacity(c.z);
          const blur = c.z < -200 ? ((-200 - c.z) / 200) * 1.5 : 0;
          domEl.style.transform = `translate(-50%,-50%) translate(${sx}px,${sy}px) scale(${s}) rotateX(${c.rotateX}deg) rotateY(${c.rotateY}deg) rotateZ(${c.rotateZ}deg)`;
          domEl.style.opacity   = `${op}`;
          domEl.style.filter    = blur > 0 ? `blur(${blur}px)` : "none";
          domEl.style.color     = hovered ? NAVY : `rgba(49,54,66,1)`;
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const chunks = chunksRef.current;

  return (
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
            onClick={() => onNavigate(c.path)}
            style={{
              position: "absolute", left: "50%", top: "50%",
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
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
  );
}

// ── Custom cursor ─────────────────────────────────────────────────────────────

function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (ref.current) {
        ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        transform: "translate(-200px, -200px)",
        pointerEvents: "none",
        zIndex: 9999,
        userSelect: "none",
      }}
    >
      {/* inner div centers the text on the exact cursor point */}
      <div style={{ transform: "translate(-50%, -50%)" }}>
        <span style={{
          fontFamily: FONT_UI,
          fontSize: "11px",
          fontWeight: 600,
          color: NAVY,
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}>
          Think & Write
        </span>
      </div>
    </div>,
    document.body
  );
}

// ── Start Modal ───────────────────────────────────────────────────────────────

function StartModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [name,        setName]        = useState("");
  const [prompt,      setPrompt]      = useState("");
  const [description, setDescription] = useState("");

  const inputStyle: React.CSSProperties = {
    backgroundColor: "#F4F5F7",
    border: "1px dashed #D0D1D6",
    borderRadius: "12px",
    height: "40px",
    width: "100%",
    padding: "0 12px",
    fontFamily: FONT_UI,
    fontSize: "10.88px",
    color: "#313642",
    letterSpacing: "0.3264px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: FONT_UI,
    fontSize: "11.52px",
    fontWeight: 600,
    letterSpacing: "0.1152px",
    lineHeight: "17.28px",
    color: "#313642",
    margin: 0,
  };

  const hintStyle: React.CSSProperties = {
    fontFamily: FONT_UI,
    fontSize: "9.6px",
    letterSpacing: "0.768px",
    lineHeight: "14.4px",
    color: "#7A7D89",
    margin: 0,
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(6,6,19,0.65)", backdropFilter: "blur(8px)",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        transition={{ duration: 0.24, delay: 0.06 }}
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: "#ECEDF0", border: "1px dashed #C3C4C8",
          borderRadius: "12px", padding: "24px",
          display: "flex", flexDirection: "column", gap: "24px",
          width: "100%", maxWidth: "420px", boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontFamily: FONT_UI, fontSize: "20px", fontWeight: 400, letterSpacing: "0.1152px", color: "#313642", margin: 0 }}>
            Erstelle dein eigenes Writing-Tool
          </p>
          <div style={{ borderTop: "1px dashed #C3C4C8" }} />
          <p style={{ fontFamily: FONT_UI, fontSize: "11.52px", letterSpacing: "0.1152px", lineHeight: "17.28px", color: "#313642", margin: 0 }}>
            Verändere die Parameter und erstelle dein eigenes Tool.<br />
            Wenn du fertig bist, kannst du es speichern und mit anderen teilen.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={labelStyle}>Name</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input type="text" placeholder="Name eingeben" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            <p style={hintStyle}>Du kannst den Namen jederzeit ändern.</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={labelStyle}>Schreibanstoß oder Aufgaben</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input type="text" placeholder="Beispiel: Schreibe etwas über dich..." value={prompt} onChange={e => setPrompt(e.target.value)} style={inputStyle} />
            <p style={hintStyle}>Das hilft Menschen beim Schreiben. Von allgemein bis sehr spezifisch.</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={labelStyle}>Beschreibung oder Regel</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <textarea
              placeholder="Beispiel: Dieses Tool hilft anonym in öffentlichen Plätzen zu schreiben..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{
                backgroundColor: "#F4F5F7", border: "1px dashed #D0D1D6",
                borderRadius: "12px", height: "120px", width: "100%",
                padding: "12px", fontFamily: FONT_UI, fontSize: "10.88px",
                color: "#313642", letterSpacing: "0.3264px", lineHeight: "16.32px",
                outline: "none", resize: "none", boxSizing: "border-box",
              }}
            />
            <p style={hintStyle}>Das hilft Menschen beim Schreiben.</p>
          </div>
        </div>

        <button
          onClick={() => navigate("/parametrisches-tool")}
          style={{
            width: "100%", height: "29px", backgroundColor: "#313642", color: "#ECEDF0",
            border: "none", borderRadius: "100px", cursor: "none",
            fontFamily: FONT_UI, fontSize: "10.88px", fontWeight: 600, letterSpacing: "0.3264px",
          }}
        >
          Loslegen
        </button>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

export default function Overview() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const handleNavigate = useCallback((path: string) => navigate(path), [navigate]);

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
      >
        {/* ── Drifting tool names ── */}
        <DriftingToolNames onNavigate={handleNavigate} />

        {/* ── Top-left panel ── */}
        <div
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
              backgroundColor: "white",
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
              backgroundColor: "white",
              border: BORDER_NAVY,
              height: "64px",
              display: "flex",
              alignItems: "center",
              padding: "16px 24px",
              boxSizing: "border-box",
              cursor: "none",
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

        {/* ── Bottom-right CTA ── */}
        <div
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
          }}
        >
          {/* Create your own — grid overlay */}
          <div
            onClick={() => setShowModal(true)}
            style={{
              position: "relative",
              cursor: "none",
              width: "175.574px",
              height: "238.844px",
              flexShrink: 0,
            }}
          >
            {/* Background image */}
            <img
              alt=""
              src={IMG_RECTANGLE}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                display: "block",
              }}
            />

            {/* Text overlay */}
            <div
              style={{
                position: "absolute",
                top: "101.42px",
                left: "36.29px",
                fontFamily: FONT_UI,
                fontSize: "12px",
                fontWeight: 600,
                color: NAVY,
                textAlign: "center",
                lineHeight: "18px",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              <p style={{ margin: 0 }}>Create your own</p>
              <p style={{ margin: 0 }}>Writing Interface</p>
            </div>

            {/* Vector arrow — top right */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "129.49px",
                width: "46.082px",
                height: "43.77px",
                pointerEvents: "none",
              }}
            >
              <img
                alt=""
                src={IMG_VECTOR}
                style={{
                  position: "absolute",
                  inset: "-0.83% -0.75% -1.14% -1.09%",
                  width: "101.84%",
                  height: "101.97%",
                  maxWidth: "none",
                }}
              />
            </div>
          </div>

          {/* See all tools button */}
          <div
            style={{
              backgroundColor: "white",
              border: BORDER_NAVY,
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 24px",
              boxSizing: "border-box",
              cursor: "none",
              width: "175.574px",
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

      <CustomCursor />

      <AnimatePresence>
        {showModal && <StartModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  );
}

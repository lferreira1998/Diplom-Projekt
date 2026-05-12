import { useRef, useEffect, useLayoutEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";

// ── Model ─────────────────────────────────────────────────────────────────────

export type Layer    = { type: "char"; char: string } | { type: "cover" };
export interface Position { layers: Layer[]; }

// ── Types ─────────────────────────────────────────────────────────────────────

type Visibility     = "visible" | "hidden" | "sentence" | "word" | "char";
type DeleteMode     = "deletable" | "no-delete" | "sentence" | "word";
type CorrectionMode = "hidden" | "tippex";

interface WritingZoneProps {
  positions: Position[];
  cursor: number;
  onUpdate: (positions: Position[], cursor: number) => void;
  lastKeyPressTimestamp: React.MutableRefObject<number>;
  panelOpen: boolean;
  textColor?: string;
  coverBgColor?: string;
  visibility?: Visibility;
  deleteMode?: DeleteMode;
  correctionMode?: CorrectionMode;
  cursorLaeuftWeiter?: boolean;
  driftet?: boolean;
  driftSaetze?: boolean;
  driftWoerter?: boolean;
  driftBuchstaben?: boolean;
  driftDelay?: number;
  driftSpeed?: number;   // 10–500, default 100
  verblasst?: boolean;
  fontSize?: number;
  verblassenDelay?: number;
  verblassenSpeed?: number; // 10–500, default 100
  spiralModus?: boolean;
  textAppearsRandom?: boolean;
  randomMode?: "words" | "sentences";
  writingPrompt?: string;
  fontFamily?: string;
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function getTopChar(pos: Position): string | null {
  for (let i = pos.layers.length - 1; i >= 0; i--) {
    const l = pos.layers[i];
    if (l.type === "char") return l.char;
  }
  return null;
}

function getVisibleChar(pos: Position): string | null {
  if (!pos.layers.length) return null;
  const top = pos.layers[pos.layers.length - 1];
  return top.type === "cover" ? null : top.char;
}

export function extractText(positions: Position[]): string {
  return positions
    .map(p => getVisibleChar(p))
    .filter((ch): ch is string => ch !== null)
    .join("");
}

function toRgba(color: string, alpha: number): string {
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `,${alpha})`);
  }
  return `rgba(242,243,246,${alpha})`;
}

// ── Boundary (deleteMode) ─────────────────────────────────────────────────────

const SENTENCE_TERM = new Set([".", "!", "?"]);

function computeBoundary(
  positions: Position[],
  cursor: number,
  deleteMode: DeleteMode
): number {
  if (deleteMode === "deletable") return 0;
  if (deleteMode === "no-delete") return Infinity;

  if (deleteMode === "word") {
    for (let i = cursor - 1; i >= 0; i--) {
      const ch = getVisibleChar(positions[i]);
      if (ch === null) continue;
      if (ch === " " || ch === "\n") return i + 1;
    }
    return 0;
  }

  if (deleteMode === "sentence") {
    for (let i = cursor - 1; i >= 0; i--) {
      const ch = getVisibleChar(positions[i]);
      if (ch === null) continue;
      if (SENTENCE_TERM.has(ch)) return i + 1;
    }
    return 0;
  }

  return 0;
}

// ── Visibility split ──────────────────────────────────────────────────────────

function visibilitySplit(
  positions: Position[],
  cursor: number,
  mode: Visibility
): number {
  if (mode === "visible") return 0;
  if (mode === "hidden") return cursor;
  if (mode === "char")   return Math.max(0, cursor - 1);

  if (mode === "word") {
    for (let i = cursor - 1; i >= 0; i--) {
      const ch = getVisibleChar(positions[i]);
      if (ch === " " || ch === "\n") return i + 1;
    }
    return 0;
  }

  if (mode === "sentence") {
    for (let i = cursor - 1; i >= 0; i--) {
      const ch = getVisibleChar(positions[i]);
      if (ch && SENTENCE_TERM.has(ch)) return i + 1;
    }
    return 0;
  }

  return 0;
}

// ── Layer renderer ────────────────────────────────────────────────────────────

function renderLayers(
  pos: Position,
  showTippex: boolean,
  coverBgColor: string
): React.ReactNode[] {
  if (!showTippex) {
    const topChar = getTopChar(pos);
    if (!topChar) return [];
    const disp = topChar === "\n" || topChar === " " ? "\u00A0" : topChar;
    return [
      <span key="c" style={{ position: "relative", display: "inline-block", textAlign: "center" }}>
        {disp}
      </span>,
    ];
  }

  const out: React.ReactNode[] = [];

  let lastCharIdx = -1;
  for (let i = pos.layers.length - 1; i >= 0; i--) {
    if (pos.layers[i].type === "char") { lastCharIdx = i; break; }
  }

  pos.layers.forEach((layer, idx) => {
    if (layer.type === "char") {
      const disp = layer.char === "\n" || layer.char === " " ? "\u00A0" : layer.char;
      const isLast = idx === lastCharIdx;
      out.push(
        <span
          key={`c${idx}`}
          style={{
            position:  isLast ? "relative" : "absolute",
            inset:     isLast ? undefined  : 0,
            display:   "inline-block",
            textAlign: "center",
            width:     isLast ? undefined  : "100%",
            zIndex:    idx,
          }}
        >
          {disp}
        </span>
      );
    } else if (layer.type === "cover" && showTippex) {
      let n = 0;
      for (let j = idx; j >= 0; j--) {
        if (pos.layers[j].type === "cover") n++;
        else break;
      }
      const alpha = n === 1 ? 0.91 : n === 2 ? 0.97 : 1.0;
      const tippexWhite = `rgba(255, 252, 244, ${alpha})`;
      out.push(
        <span
          key={`v${idx}`}
          style={{
            position:        "absolute",
            inset:           "-1px -0.5px",
            backgroundColor: tippexWhite,
            borderRadius:    "1px",
            boxShadow:       n === 1
              ? "0 0.5px 1px rgba(200,190,170,0.25)"
              : "0 0.5px 2px rgba(200,190,170,0.35)",
            zIndex: idx,
          }}
        />
      );
    }
  });

  return out;
}

// ── Drift helpers ─────────────────────────────────────────────────────────────

function groupDir(id: number) {
  const a = (id * 2.39996) % (Math.PI * 2);
  return { ax: Math.cos(a), ay: Math.sin(a) };
}

function computeGroups(pos: Position[]): { sid: number[]; wid: number[] } {
  const sid: number[] = [];
  const wid: number[] = [];
  let s = 0, w = 0;
  let inWord = false;
  for (let i = 0; i < pos.length; i++) {
    const ch = getTopChar(pos[i]);
    const isW = !!ch && ch !== " " && ch !== "\n";
    if (isW && !inWord) { w++; inWord = true; }
    else if (!isW)       { inWord = false; }
    sid[i] = s;
    wid[i] = w;
    if (ch === "." || ch === "!" || ch === "?" || ch === "\n") s++;
  }
  return { sid, wid };
}

// ── RandomTextZone ────────────────────────────────────────────────────────────

const FILLER_WORDS_SET = new Set([
  "wie","und","oder","aber","denn","weil","dass","als","wenn",
  "der","die","das","ein","eine","einer","einem","einen",
  "ist","sind","war","hat","haben","wird","werden","wurde",
  "ich","du","er","sie","es","wir","ihr","man",
  "in","an","auf","für","mit","von","zu","bei","nach",
  "so","da","ja","noch","auch","nur","schon","doch","mal",
  "the","a","is","are","was","were","be","been",
  "and","or","but","if","of","to","at","on","for",
  "it","he","she","we","they","i","you","my","his","her",
  "not","no","do","did","has","had","can","will",
  "this","that","then","than","just","also","very","really",
]);

interface FloatingChunk {
  id: number; text: string;
  x: number; y: number; z: number;
  rotateX: number; rotateY: number; rotateZ: number;
  vx: number; vy: number; vz: number;
  released: boolean;
  isFiller: boolean; fillerTimer: number; fillerMaxTime: number; fadeOut: number;
  baseSpeed: number;
  opacityPhase: number; opacitySpeed: number; opacityMin: number;
  ghostTimer: number; ghostCooldown: number; ghostDuration: number; isGhost: boolean;
  wanderAngle: number; wanderAngleZ: number;
}

const R_PERSP = 900;
const R_MIN_Z = -600;
const R_MAX_Z = 200;

function rnd(min: number, max: number) { return Math.random() * (max - min) + min; }
function rDepthOpacity(z: number) { return 0.25 + ((z - R_MIN_Z) / (R_MAX_Z - R_MIN_Z)) * 0.75; }

interface RandomTextZoneProps {
  textColor: string;
  randomMode: "words" | "sentences";
}

function RandomTextZone({ textColor, randomMode }: RandomTextZoneProps) {
  const wrapRef    = useRef<HTMLDivElement>(null);
  const chunksRef  = useRef<FloatingChunk[]>([]);
  const curChunkRef = useRef<FloatingChunk | null>(null);
  const curTextRef  = useRef("");
  const nextIdRef   = useRef(0);
  const rafRef      = useRef(0);
  const elMapRef    = useRef<Map<number, HTMLDivElement>>(new Map());
  const [, tick]    = useState(0);
  const lastTRef    = useRef(0);
  const modeRef     = useRef(randomMode);

  useLayoutEffect(() => { modeRef.current = randomMode; }, [randomMode]);

  const newChunk = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return null;
    const { width: w, height: h } = el.getBoundingClientRect();
    const z = rnd(R_MIN_Z * 0.4, R_MAX_Z * 0.6);
    const s = R_PERSP / (R_PERSP - z);
    const c: FloatingChunk = {
      id: nextIdRef.current++, text: "",
      x: rnd(-w / s * 0.35, w / s * 0.35),
      y: rnd(-h / s * 0.35, h / s * 0.35),
      z,
      rotateX: rnd(-8, 8), rotateY: rnd(-12, 12), rotateZ: rnd(-3, 3),
      vx: 0, vy: 0, vz: 0,
      released: false,
      isFiller: false, fillerTimer: 0, fillerMaxTime: rnd(5, 14), fadeOut: 1,
      baseSpeed: rnd(0.2, 0.6),
      opacityPhase: rnd(0, Math.PI * 2), opacitySpeed: rnd(0.08, 0.3), opacityMin: rnd(0.4, 0.75),
      ghostTimer: 0, ghostCooldown: rnd(10, 35), ghostDuration: rnd(1.5, 5), isGhost: false,
      wanderAngle: rnd(0, Math.PI * 2), wanderAngleZ: rnd(0, Math.PI * 2),
    };
    curChunkRef.current = c;
    chunksRef.current.push(c);
    tick(n => n + 1);
    return c;
  }, []);

  const releaseChunk = useCallback(() => {
    const c = curChunkRef.current;
    if (!c || !c.text.trim()) {
      if (c) chunksRef.current = chunksRef.current.filter(x => x.id !== c.id);
      curChunkRef.current = null;
      curTextRef.current  = "";
      return;
    }
    c.text     = c.text.trim();
    c.released = true;
    c.isFiller = FILLER_WORDS_SET.has(c.text.toLowerCase());
    curChunkRef.current = null;
    curTextRef.current  = "";
    tick(n => n + 1);
  }, []);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const mode = modeRef.current;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (mode === "sentences") {
          if (e.key === " ") {
            if (!curChunkRef.current) newChunk();
            if (curChunkRef.current) {
              curTextRef.current += "\u00A0";
              curChunkRef.current.text = curTextRef.current;
              tick(n => n + 1);
            }
          } else {
            releaseChunk();
          }
        } else {
          releaseChunk();
          if (e.key === " ") newChunk();
        }
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        if (curChunkRef.current && curTextRef.current.length > 0) {
          curTextRef.current = curTextRef.current.slice(0, -1);
          curChunkRef.current.text = curTextRef.current;
          tick(n => n + 1);
        }
        return;
      }

      if (e.key.length === 1) {
        e.preventDefault();
        if (!curChunkRef.current) newChunk();
        if (curChunkRef.current) {
          curTextRef.current += e.key;
          curChunkRef.current.text = curTextRef.current;
          tick(n => n + 1);
        }
        if (mode === "sentences" && (e.key === "." || e.key === "!" || e.key === "?")) {
          releaseChunk();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [newChunk, releaseChunk]);

  // animation loop
  useEffect(() => {
    const loop = (time: number) => {
      if (!lastTRef.current) lastTRef.current = time;
      const dt = Math.min((time - lastTRef.current) / 1000, 0.1);
      lastTRef.current = time;

      const wrap = wrapRef.current;
      const w = wrap ? wrap.getBoundingClientRect().width  : 800;
      const h = wrap ? wrap.getBoundingClientRect().height : 600;
      const DAMP = 0.985;
      let cleanup = false;

      for (const c of chunksRef.current) {
        if (!c.released) continue;
        c.wanderAngle  += rnd(-0.3, 0.3) * dt;
        c.wanderAngleZ += rnd(-0.2, 0.2) * dt;
        const ws = c.baseSpeed * 0.4;
        c.vx += Math.cos(c.wanderAngle)  * ws * dt;
        c.vy += Math.sin(c.wanderAngle)  * ws * dt;
        c.vz += Math.sin(c.wanderAngleZ) * ws * 0.15 * dt;
        c.vx *= DAMP; c.vy *= DAMP; c.vz *= DAMP;
        c.x += c.vx * dt * 6; c.y += c.vy * dt * 6; c.z += c.vz * dt * 3;

        const s  = R_PERSP / (R_PERSP - c.z);
        const sx = c.x * s, sy = c.y * s;
        const mx = w * 0.44, my = h * 0.42;
        if (sx >  mx) c.vx -= (sx - mx) * 0.002;
        if (sx < -mx) c.vx -= (sx + mx) * 0.002;
        if (sy >  my) c.vy -= (sy - my) * 0.002;
        if (sy < -my) c.vy -= (sy + my) * 0.002;
        c.z = Math.max(R_MIN_Z, Math.min(R_MAX_Z, c.z));
        if (c.z <= R_MIN_Z) c.vz =  Math.abs(c.vz) * 0.3;
        if (c.z >= R_MAX_Z) c.vz = -Math.abs(c.vz) * 0.3;

        c.opacityPhase += c.opacitySpeed * dt;
        const breathe = c.opacityMin + (1 - c.opacityMin) * (0.5 + 0.5 * Math.sin(c.opacityPhase));

        if (!c.isGhost) {
          c.ghostTimer += dt;
          if (c.ghostTimer >= c.ghostCooldown) { c.isGhost = true; c.ghostTimer = 0; }
        } else {
          c.ghostTimer += dt;
          if (c.ghostTimer >= c.ghostDuration) {
            c.isGhost = false; c.ghostTimer = 0;
            c.ghostCooldown = rnd(8, 30); c.ghostDuration = rnd(1.5, 5);
          }
        }
        const ghost = c.isGhost ? Math.max(0, 1 - c.ghostTimer / 0.8) : Math.min(1, c.ghostTimer / 0.8);

        if (c.isFiller) {
          c.fillerTimer += dt;
          if (c.fillerTimer > c.fillerMaxTime) {
            c.fadeOut -= dt * 0.3;
            if (c.fadeOut <= 0) { c.fadeOut = 0; cleanup = true; }
          }
        }

        const domEl = elMapRef.current.get(c.id);
        if (domEl) {
          const op = rDepthOpacity(c.z) * c.fadeOut * breathe * ghost;
          domEl.style.transform = `translate(-50%,-50%) translate(${sx}px,${sy}px) scale(${s}) rotateX(${c.rotateX}deg) rotateY(${c.rotateY}deg) rotateZ(${c.rotateZ}deg)`;
          domEl.style.opacity   = `${Math.max(0, op)}`;
          domEl.style.filter    = c.z < -200 ? `blur(${((-200 - c.z) / 200) * 1.5}px)` : "none";
        }
      }

      // current (not yet released)
      for (const c of chunksRef.current) {
        if (c.released) continue;
        const domEl = elMapRef.current.get(c.id);
        if (domEl) {
          const s  = R_PERSP / (R_PERSP - c.z);
          domEl.style.transform = `translate(-50%,-50%) translate(${c.x * s}px,${c.y * s}px) scale(${s}) rotateX(${c.rotateX}deg) rotateY(${c.rotateY}deg) rotateZ(${c.rotateZ}deg)`;
          domEl.style.opacity   = `${rDepthOpacity(c.z)}`;
          domEl.style.filter    = "none";
        }
      }

      if (cleanup) {
        const gone = chunksRef.current.filter(c => c.isFiller && c.fadeOut <= 0);
        for (const g of gone) elMapRef.current.delete(g.id);
        chunksRef.current = chunksRef.current.filter(c => !(c.isFiller && c.fadeOut <= 0));
        tick(n => n + 1);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const chunks = chunksRef.current;
  const [r, g, b] = parseRgb(textColor);

  return (
    <div
      ref={wrapRef}
      style={{ position: "absolute", inset: 0, perspective: `${R_PERSP}px`, perspectiveOrigin: "50% 50%", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
        {chunks.map(c => (
          <div
            key={c.id}
            ref={el => { if (el) elMapRef.current.set(c.id, el); }}
            style={{
              position: "absolute", left: "50%", top: "50%",
              color: `rgb(${r},${g},${b})`,
              fontFamily: fontFamily,
              fontSize: "clamp(0.9rem, 2vw, 1.15rem)",
              fontWeight: 400, letterSpacing: "0.02em",
              whiteSpace: "nowrap", userSelect: "none", pointerEvents: "none",
              willChange: "transform, opacity", transformStyle: "preserve-3d",
            }}
          >
            {c.text}
            {!c.released && (
              <span style={{
                display: "inline-block", width: "2px", height: "1.1em",
                background: `rgb(${r},${g},${b})`,
                marginLeft: "1px", verticalAlign: "text-bottom",
                animation: "cursorBlink 1s step-end infinite",
              }} />
            )}
          </div>
        ))}
      </div>
      {chunks.length === 0 && (
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)", pointerEvents: "none",
          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          fontSize: "clamp(0.9rem, 2vw, 1.15rem)",
          color: `rgb(${r},${g},${b})`, opacity: 0.25,
          letterSpacing: "0.1em", whiteSpace: "nowrap",
          fontStyle: "italic",
        }}>
          Fang einfach an zu schreiben…
        </div>
      )}
    </div>
  );
}

// ── SpiralCanvas ──────────────────────────────────────────────────────────────

function parseRgb(color: string): [number, number, number] {
  if (color.startsWith("#")) {
    return [
      parseInt(color.slice(1, 3), 16),
      parseInt(color.slice(3, 5), 16),
      parseInt(color.slice(5, 7), 16),
    ];
  }
  const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) return [+m[1], +m[2], +m[3]];
  return [49, 54, 66];
}

interface SpiralCanvasProps {
  positions: Position[];
  cursor: number;
  textColor: string;
  visibility: "visible" | "hidden" | "sentence" | "word" | "char";
  split: number;
  verblasst: boolean;
  posTimesRef: React.MutableRefObject<number[]>;
  verblassenDelay: number;
  verblassenSpeed: number;
  driftTick: number;
}

function SpiralCanvas({
  positions,
  cursor,
  textColor,
  visibility,
  split,
  verblasst,
  posTimesRef,
  verblassenDelay,
  verblassenSpeed,
  driftTick,
}: SpiralCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const [cursorOn, setCursorOn] = useState(true);
  const [size, setSize]         = useState({ w: 0, h: 0 });

  // cursor blink
  useEffect(() => {
    const id = setInterval(() => setCursorOn(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  // size observer
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // draw spiral
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = size.w || canvas.parentElement?.getBoundingClientRect().width || 800;
    const H = size.h || canvas.parentElement?.getBoundingClientRect().height || 600;
    if (!W || !H) return;

    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    // build char list with visibility info
    const isAllHidden = visibility === "hidden";
    const charInfos: { char: string; posIdx: number; shouldHide: boolean }[] = [];
    for (let i = 0; i < positions.length; i++) {
      const ch = getVisibleChar(positions[i]);
      if (ch === null) continue;
      const beforeCursor = i < cursor;
      const shouldHide =
        isAllHidden ||
        (visibility !== "visible" && beforeCursor && i < split);
      charInfos.push({
        char: ch === "\n" ? " " : ch,
        posIdx: i,
        shouldHide,
      });
    }

    const chars = charInfos.map(c => c.char);
    const N = chars.length;
    const [r, g, b] = parseRgb(textColor);

    const cx = W / 2;
    const cy = H / 2;
    const minR  = 24;
    const maxR  = Math.min(W, H) * 0.38;
    const minFs = 7;
    const maxFs = 28;
    // writing position: bottom (6 o'clock)
    const cursorAngle = Math.PI * 0.5;
    const curX = cx + maxR * Math.cos(cursorAngle);
    const curY = cy + maxR * Math.sin(cursorAngle);

    if (N === 0) {
      if (cursorOn) {
        ctx.save();
        ctx.translate(curX, curY);
        ctx.fillStyle = `rgba(${r},${g},${b},0.75)`;
        ctx.fillRect(-1.5, -maxFs * 0.55, 3, maxFs * 1.1);
        ctx.restore();
      }
      return;
    }

    // estimate total angular span for tightness
    let estAngle = 0;
    let tmpR = maxR;
    for (let i = N - 1; i >= 0; i--) {
      const prog = Math.max(0, (tmpR - minR) / (maxR - minR));
      const fs = minFs + (maxFs - minFs) * Math.pow(prog, 0.55);
      const aStep = (fs * 0.6 + fs * 0.08) / Math.max(tmpR, 4);
      estAngle += aStep;
      const tight = (maxR - minR) / Math.max(estAngle, Math.PI * 1.2);
      tmpR -= tight * aStep;
      tmpR = Math.max(tmpR, minR);
    }
    const spiralTightness = (maxR - minR) / Math.max(estAngle, Math.PI * 1.2);

    // compute char positions
    let curAngle = cursorAngle;
    let curRad   = maxR;
    const nowMs  = Date.now();

    interface CP {
      x: number; y: number; char: string;
      fs: number; opacity: number; rot: number; shouldHide: boolean;
    }
    const cps: CP[] = [];

    for (let i = N - 1; i >= 0; i--) {
      const radiusProg = Math.max(0, (curRad - minR) / (maxR - minR));
      const fs = minFs + (maxFs - minFs) * Math.pow(radiusProg, 0.55);
      let opacity = 0.1 + 0.9 * Math.pow(radiusProg, 0.35);

      // apply verblasst
      if (verblasst && charInfos[i]) {
        const t = posTimesRef.current[charInfos[i].posIdx];
        if (t) {
          const age = Math.max(0, (nowMs - t - verblassenDelay * 1000) / 1000);
          const dur = Math.max(1, 60 / (verblassenSpeed / 100));
          opacity *= Math.max(0, 1 - age / dur);
        }
      }

      ctx.font = `${fs}px ${fontFamily}`;
      const cw    = ctx.measureText(chars[i]).width;
      const aStep = (cw * 0.78 + fs * 0.1) / Math.max(curRad, 4);
      curAngle += aStep;
      curRad   -= spiralTightness * aStep;
      curRad    = Math.max(curRad, 2);

      const x   = cx + curRad * Math.cos(curAngle);
      const y   = cy + curRad * Math.sin(curAngle);
      const rot = curAngle - Math.PI / 2;

      cps.unshift({
        x, y, char: chars[i], fs, opacity, rot,
        shouldHide: charInfos[i]?.shouldHide ?? false,
      });
    }

    // draw oldest → newest
    for (const cp of cps) {
      if (cp.shouldHide) continue;
      ctx.save();
      ctx.translate(cp.x, cp.y);
      ctx.rotate(cp.rot);
      ctx.font = `${cp.fs}px 'IBM Plex Mono', monospace`;
      ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, cp.opacity)})`;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cp.char, 0, 0);
      ctx.restore();
    }

    // cursor line at writing position
    if (cursorOn) {
      ctx.save();
      ctx.translate(curX, curY);
      ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
      ctx.fillRect(-1.5, -maxFs * 0.55, 3, maxFs * 1.1);
      ctx.restore();
    }
  }, [positions, cursor, textColor, visibility, split, verblasst, posTimesRef,
      verblassenDelay, verblassenSpeed, cursorOn, size, driftTick]);

  return (
    <div ref={wrapRef} style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

// ── WritingZone ───────────────────────────────────────────────────────────────

export function WritingZone({
  positions,
  cursor,
  onUpdate,
  lastKeyPressTimestamp,
  panelOpen,
  textColor          = "#313642",
  coverBgColor       = "#F2F3F6",
  visibility         = "visible",
  deleteMode         = "deletable",
  correctionMode     = "hidden",
  cursorLaeuftWeiter = false,
  driftet            = false,
  driftSaetze        = false,
  driftWoerter       = false,
  driftBuchstaben    = false,
  driftDelay         = 120,
  driftSpeed         = 100,
  verblasst          = false,
  verblassenDelay    = 120,
  verblassenSpeed    = 100,
  spiralModus        = false,
  textAppearsRandom  = false,
  randomMode         = "words" as const,
  writingPrompt      = "",
  fontSize           = 20,
  fontFamily         = "'IBM Plex Mono', 'Courier New', monospace",
}: WritingZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorDomRef = useRef<HTMLSpanElement>(null);

  const posRef = useRef(positions);
  const curRef = useRef(cursor);
  const lkpt   = lastKeyPressTimestamp;
  const selectAllRef = useRef(false);
  const [selectAll, setSelectAll] = useState(false);

  // useLayoutEffect fires synchronously after commit, before the next rAF —
  // ensures the cursor rAF loop always reads up-to-date positions/cursor.
  useLayoutEffect(() => { posRef.current = positions; }, [positions]);
  useLayoutEffect(() => { curRef.current = cursor;    }, [cursor]);

  // ── Drift / Fade state ────────────────────────────────────────────────────
  type DE = { x: number; y: number; vx: number; vy: number };

  const posTimesRef  = useRef<number[]>([]);
  const sentDrift    = useRef<Map<number, DE>>(new Map());
  const wordDrift    = useRef<Map<number, DE>>(new Map());
  const charDrift    = useRef<DE[]>([]);
  const groupsRef    = useRef<{ sid: number[]; wid: number[] }>({ sid: [], wid: [] });

  // Per-char accumulated drift offset (sum of all layers)
  const charOffsets  = useRef<{ dx: number; dy: number }[]>([]);
  // Refs to inline char spans for measuring their rects (for wrapping clones)
  const charElsRef   = useRef<(HTMLElement | null)[]>([]);

  const [driftTick, setDriftTick] = useState(0);

  // Sync arrays with positions length
  useEffect(() => {
    const now = Date.now();
    while (posTimesRef.current.length < positions.length) {
      posTimesRef.current.push(now);
      charDrift.current.push({ x: 0, y: 0, vx: 0, vy: 0 });
      charOffsets.current.push({ dx: 0, dy: 0 });
      charElsRef.current.push(null);
    }
    if (positions.length < posTimesRef.current.length) {
      posTimesRef.current.length = positions.length;
      charDrift.current.length   = positions.length;
      charOffsets.current.length = positions.length;
      charElsRef.current.length  = positions.length;
    }
  }, [positions.length]);

  useEffect(() => {
    groupsRef.current = computeGroups(positions);
  }, [positions]);

  // Reset drift state when drift is turned off
  useEffect(() => {
    if (!driftet) {
      sentDrift.current.clear();
      wordDrift.current.clear();
      charDrift.current = charDrift.current.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }));
      charOffsets.current = charOffsets.current.map(() => ({ dx: 0, dy: 0 }));
    }
  }, [driftet]);

  // rAF physics loop
  useEffect(() => {
    if (!driftet && !verblasst) return;
    let animId: number;
    const spf = driftSpeed / 100;

    const loop = () => {
      const now         = Date.now();
      const pos         = posRef.current;
      const { sid, wid } = groupsRef.current;
      const delayMs     = driftDelay * 1000;

      // Group start times
      const sStart = new Map<number, number>();
      const wStart = new Map<number, number>();
      for (let i = 0; i < pos.length; i++) {
        const t = posTimesRef.current[i] ?? now;
        if (!sStart.has(sid[i])) sStart.set(sid[i], t);
        if (!wStart.has(wid[i])) wStart.set(wid[i], t);
      }

      let dirty = false;

      if (driftet) {
        // Sentence drift
        if (driftSaetze) {
          sStart.forEach((t, id) => {
            const age = Math.max(0, (now - t - delayMs) / 1000);
            if (age <= 0) return;
            dirty = true;
            if (!sentDrift.current.has(id)) sentDrift.current.set(id, { x:0, y:0, vx:0, vy:0 });
            const d   = sentDrift.current.get(id)!;
            const dir = groupDir(id);
            const spd = Math.min(age * 0.025, 2.5) * spf;
            d.vx += dir.ax * 0.08 * spd + (Math.random() - 0.5) * 0.015 * spd;
            d.vy += dir.ay * 0.05 * spd + (Math.random() - 0.5) * 0.015 * spd;
            d.vx *= 0.988;
            d.vy *= 0.988;
            d.x  += d.vx;
            d.y  += d.vy;
          });
        }

        // Word drift
        if (driftWoerter) {
          wStart.forEach((t, id) => {
            const age = Math.max(0, (now - t - delayMs) / 1000);
            if (age <= 0) return;
            dirty = true;
            if (!wordDrift.current.has(id)) wordDrift.current.set(id, { x:0, y:0, vx:0, vy:0 });
            const d   = wordDrift.current.get(id)!;
            const dir = groupDir(id + 1337);
            const spd = Math.min(age * 0.05, 3.0) * spf;
            d.vx += dir.ax * 0.12 * spd + (Math.random() - 0.5) * 0.02 * spd;
            d.vy += dir.ay * 0.08 * spd + (Math.random() - 0.5) * 0.02 * spd;
            d.vx *= 0.965;
            d.vy *= 0.965;
            d.x  += d.vx;
            d.y  += d.vy;
          });
        }

        // Char drift
        if (driftBuchstaben) {
          for (let i = 0; i < pos.length; i++) {
            const t = posTimesRef.current[i];
            if (!t) continue;
            const age = Math.max(0, (now - t - delayMs) / 1000);
            if (age <= 0) continue;
            dirty = true;
            const d = charDrift.current[i];
            if (!d) continue;
            const spd = Math.min(age * 0.03, 2.0) * spf;
            d.vx += (Math.random() - 0.5) * 0.15 * spd;
            d.vy += (Math.random() - 0.5) * 0.1 * spd;
            d.vx *= 0.94;
            d.vy *= 0.94;
            d.x  += d.vx;
            d.y  += d.vy;
          }
        }

        // Compute per-char total offset
        for (let i = 0; i < pos.length; i++) {
          let dx = 0, dy = 0;
          if (driftSaetze) {
            const sd = sentDrift.current.get(sid[i]);
            if (sd) { dx += sd.x; dy += sd.y; }
          }
          if (driftWoerter) {
            const wd = wordDrift.current.get(wid[i]);
            if (wd) { dx += wd.x; dy += wd.y; }
          }
          if (driftBuchstaben) {
            const cd = charDrift.current[i];
            if (cd) { dx += cd.x; dy += cd.y; }
          }
          if (charOffsets.current[i]) {
            charOffsets.current[i].dx = dx;
            charOffsets.current[i].dy = dy;
          }
        }
      }

      if (dirty || verblasst) setDriftTick(n => n + 1);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [driftet, driftSaetze, driftWoerter, driftBuchstaben, driftDelay, driftSpeed, verblasst, verblassenDelay, verblassenSpeed]);

  // Focus on mount
  useEffect(() => { containerRef.current?.focus(); }, []);

  // Keep cursor in view
  useEffect(() => {
    cursorDomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [cursor, positions.length]);

  // ── "Cursor läuft weiter" ─────────────────────────────────────────────────
  // Two-ref design eliminates the backward jump from `accum % 1`:
  //   visualPosRef  — monotonically increases at CHARS_PER_SEC; never resets
  //   spacesInserted — counts spaces committed so far
  //   frac = visualPos - spacesInserted  →  always moves forward, no snap
  //
  // useLayoutEffect (above) ensures posRef/curRef are current before any rAF
  // fires, preventing the race condition where a stale ref overwrites a typed char.

  const visualPosRef      = useRef(0);
  const spacesInsertedRef = useRef(0);
  const lastFrameRef      = useRef<number>(0);
  const onUpdateRef       = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  // Char-width measurement (IBM Plex Mono is monospace → one span suffices)
  const charWidthRef = useRef(10);
  const measSpanRef  = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const measure = () => {
      if (measSpanRef.current) {
        charWidthRef.current = measSpanRef.current.getBoundingClientRect().width;
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!cursorLaeuftWeiter) {
      visualPosRef.current      = 0;
      spacesInsertedRef.current = 0;
      lastFrameRef.current      = 0;
      if (cursorDomRef.current) cursorDomRef.current.style.transform = "";
      return;
    }

    // Reset on (re-)activation
    visualPosRef.current      = 0;
    spacesInsertedRef.current = 0;

    const CHARS_PER_SEC = 1.8;   // slower, smoother
    let animId: number;

    const loop = (timestamp: number) => {
      if (lastFrameRef.current === 0) lastFrameRef.current = timestamp;
      const dt = Math.min((timestamp - lastFrameRef.current) / 1000, 0.1);
      lastFrameRef.current = timestamp;

      visualPosRef.current += dt * CHARS_PER_SEC;

      // frac is the fractional position within the current character.
      // It grows from 0 → 1 → (slightly past 1) per cycle, then resets when
      // a space is committed. Because we set the transform BEFORE incrementing
      // spacesInserted, the value momentarily exceeds charW by at most one frame's
      // step (~0.03 chars), then recovers smoothly — no backward snap ever.
      const frac  = visualPosRef.current - spacesInsertedRef.current;
      const charW = charWidthRef.current;

      if (cursorDomRef.current) {
        cursorDomRef.current.style.transform = `translateX(${frac * charW}px)`;
      }

      // Commit a space when the visual position crosses the next char boundary
      if (frac >= 1) {
        spacesInsertedRef.current++;
        const pos = posRef.current;   // always current thanks to useLayoutEffect
        const cur = curRef.current;
        let next: Position[];
        if (cur < pos.length) {
          const updated = pos.map(p => ({ layers: [...p.layers] }));
          updated[cur]  = { layers: [...updated[cur].layers, { type: "char", char: " " }] };
          next = updated;
        } else {
          next = [...pos, { layers: [{ type: "char", char: " " }] }];
        }
        onUpdateRef.current(next, cur + 1);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      if (cursorDomRef.current) cursorDomRef.current.style.transform = "";
    };
  }, [cursorLaeuftWeiter]); // onUpdate/lkpt excluded intentionally – via ref

  // ── Backspace ─────────────────────────────────────────────────────────────

  const applyBackspace = useCallback(() => {
    if (deleteMode === "no-delete" || cursor === 0) return;
    const boundary = computeBoundary(positions, cursor, deleteMode);
    if (cursor - 1 < boundary) return;
    const tgt = cursor - 1;
    const pos = positions[tgt];
    if (correctionMode === "tippex") {
      if (getTopChar(pos) === " ") { onUpdate(positions, tgt); return; }
      const next = positions.map(p => ({ layers: [...p.layers] }));
      next[tgt]  = { layers: [...next[tgt].layers, { type: "cover" }] };
      onUpdate(next, tgt);
    } else {
      const next = [...positions.slice(0, tgt), ...positions.slice(tgt + 1)];
      onUpdate(next, tgt);
    }
  }, [positions, cursor, deleteMode, correctionMode, onUpdate]);

  // ── Key handler ───────────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (textAppearsRandom) return;
      if (e.key === "Tab") return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (positions.length > 0) { selectAllRef.current = true; setSelectAll(true); }
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      const now = performance.now();

      if (e.key === "Backspace" || e.key === "Delete") {
        if (selectAllRef.current) {
          selectAllRef.current = false; setSelectAll(false);
          onUpdate([], 0); return;
        }
        if (e.key === "Backspace") { applyBackspace(); lkpt.current = now; }
        return;
      }

      const ch = e.key === "Enter" ? "\n" : e.key.length === 1 ? e.key : null;
      if (!ch) { selectAllRef.current = false; setSelectAll(false); return; }

      if (selectAllRef.current) {
        selectAllRef.current = false; setSelectAll(false);
        onUpdate([{ layers: [{ type: "char", char: ch }] }], 1);
        return;
      }

      let newPos: Position[];
      if (cursor < positions.length) {
        const next   = positions.map(p => ({ layers: [...p.layers] }));
        next[cursor] = { layers: [...next[cursor].layers, { type: "char", char: ch }] };
        newPos = next;
      } else {
        newPos = [...positions, { layers: [{ type: "char", char: ch }] }];
      }
      lkpt.current = now;
      onUpdate(newPos, cursor + 1);
    },
    [positions, cursor, applyBackspace, onUpdate, lkpt, textAppearsRandom]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  const showTippex = correctionMode === "tippex" && visibility !== "hidden";
  const split      = visibilitySplit(positions, cursor, visibility);
  const isHidden   = visibility === "hidden";
  const nowMs      = Date.now();

  void driftTick; // read tick so render re-runs on each anim frame

  // ── Build wrap-around clones (portal) ─────────────────────────────────────
  const wrapClones: React.ReactNode[] = [];

  const buildNodes = (): React.ReactNode[] => {
    const els: React.ReactNode[] = [];
    const vW = typeof window !== "undefined" ? window.innerWidth : 1920;

    for (let i = 0; i <= positions.length; i++) {
      if (i === cursor) {
        els.push(
          <span
            key="csr"
            ref={cursorDomRef}
            className="inline-block"
            style={{
              width:           "2px",
              backgroundColor: textColor,
              height:          "1.15em",
              verticalAlign:   "text-bottom",
              marginLeft:      "-1px",
              marginRight:     "-1px",
              animation:       cursorLaeuftWeiter ? "none" : "cursorBlink 1s step-end infinite",
              opacity:         1,
              transition:      "background-color 1s linear",
            }}
          />
        );
      }

      if (i >= positions.length) break;

      const pos       = positions[i];
      const topChar   = getTopChar(pos);
      const topIsCov  = pos.layers.length > 0 &&
                        pos.layers[pos.layers.length - 1].type === "cover";
      const firstChar = pos.layers[0]?.type === "char"
        ? (pos.layers[0] as { type: "char"; char: string }).char
        : null;

      if (topIsCov && correctionMode !== "tippex") continue;

      const beforeCursor = i < cursor;
      const blurred = beforeCursor && !isHidden && visibility !== "visible" && i < split;
      const hidden  = isHidden;

      // Visibility effect
      const visStyle: React.CSSProperties = hidden
        ? { opacity: 0, userSelect: "none" }
        : blurred
          ? { filter: "blur(5px)", userSelect: "none" }
          : {};

      // Drift transform
      const offset = charOffsets.current[i];
      const hasDrift = driftet && offset && (Math.abs(offset.dx) > 0.01 || Math.abs(offset.dy) > 0.01);
      const dx = offset?.dx ?? 0;
      const dy = offset?.dy ?? 0;

      // Fade opacity
      let fadeOpacity = 1;
      if (verblasst) {
        const t = posTimesRef.current[i];
        if (t) {
          const fadeAge = Math.max(0, (nowMs - t - verblassenDelay * 1000) / 1000);
          const fadeDur = Math.max(1, 60 / (verblassenSpeed / 100));
          fadeOpacity = Math.max(0, 1 - fadeAge / fadeDur);
        }
      }

      const driftStyle: React.CSSProperties = hasDrift
        ? { transform: `translate(${dx}px, ${dy}px)`, zIndex: 10 }
        : {};

      // Newlines
      if (topChar === "\n" && !topIsCov) {
        els.push(<br key={`b${i}`} />);
        continue;
      }

      if (firstChar === "\n" && topIsCov) {
        els.push(
          <span
            key={`p${i}`}
            ref={el => { charElsRef.current[i] = el; }}
            className="relative inline-block"
            style={{
              width: "0.6em", height: "1.15em", verticalAlign: "text-bottom",
              ...visStyle,
              ...driftStyle,
              opacity: (visStyle.opacity ?? 1) as number * fadeOpacity,
            }}
          >
            {renderLayers(pos, showTippex, coverBgColor)}
          </span>
        );
        continue;
      }

      els.push(
        <span
          key={`p${i}`}
          ref={el => { charElsRef.current[i] = el; }}
          className="relative inline-block"
          style={{
            verticalAlign: "text-bottom",
            ...visStyle,
            ...driftStyle,
            opacity: (typeof visStyle.opacity === "number" ? visStyle.opacity : 1) * fadeOpacity,
          }}
        >
          {renderLayers(pos, showTippex, coverBgColor)}
        </span>
      );

      // Generate wrap-around clone if char drifted off-screen
      if (hasDrift) {
        const el = charElsRef.current[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the transformed element is partially or fully outside viewport horizontally,
          // render a clone on the opposite side
          if (rect.right < 0 || rect.left > vW) {
            const cloneX = rect.left < 0 ? rect.left + vW : rect.left - vW;
            wrapClones.push(
              <span
                key={`wc-${i}`}
                style={{
                  position: "fixed",
                  left: `${cloneX}px`,
                  top: `${rect.top}px`,
                  fontFamily: fontFamily,
                  fontSize: "clamp(0.9rem, 2vw, 1.15rem)",
                  lineHeight: 1.95,
                  color: textColor,
                  pointerEvents: "none",
                  opacity: fadeOpacity,
                  zIndex: 10,
                }}
              >
                {renderLayers(pos, showTippex, coverBgColor)}
              </span>
            );
          }
        }
      }
    }

    return els;
  };

  const nodes = spiralModus ? [] : buildNodes();

  // ── JSX ──────────────────────────────────────────────────────────────────

  if (textAppearsRandom) {
    return (
      <div
        className="flex-1 relative transition-all duration-300"
        style={{ paddingRight: panelOpen ? "343px" : "0px" }}
      >
        <div
          ref={containerRef}
          tabIndex={0}
          onClick={() => containerRef.current?.focus()}
          className="absolute inset-0 outline-none cursor-text"
          style={{ caretColor: "transparent" }}
        >
          <RandomTextZone
            textColor={textColor}
            randomMode={randomMode}
          />
        </div>
      </div>
    );
  }

  if (spiralModus) {
    return (
      <div
        className="flex-1 relative transition-all duration-300"
        style={{ paddingRight: panelOpen ? "343px" : "0px" }}
      >
        <div
          ref={containerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onBlur={() => { selectAllRef.current = false; setSelectAll(false); }}
          onClick={() => containerRef.current?.focus()}
          className="absolute inset-0 outline-none cursor-text"
          style={{ caretColor: "transparent", boxShadow: selectAll ? "inset 0 0 0 2px rgba(100,130,200,0.35)" : undefined }}
        >
          <SpiralCanvas
            positions={positions}
            cursor={cursor}
            textColor={textColor}
            visibility={visibility}
            split={split}
            verblasst={verblasst}
            posTimesRef={posTimesRef}
            verblassenDelay={verblassenDelay}
            verblassenSpeed={verblassenSpeed}
            driftTick={driftTick}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="flex-1 flex items-start pt-6 md:pt-12"
      >
        <div
          ref={containerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onBlur={() => { selectAllRef.current = false; setSelectAll(false); }}
          className="outline-none cursor-text min-h-[60vh] relative"
          style={{
            width:        "1010px",
            maxWidth:     "100%",
            marginLeft:   panelOpen ? "auto" : "0",
            marginRight:  "auto",
            color:        textColor,
            fontFamily:   "'IBM Plex Mono', 'Courier New', monospace",
            fontSize:     `${fontSize}px`,
            lineHeight:   1.6,
            caretColor:   "transparent",
            wordBreak:    "break-all",
            overflowWrap: "anywhere",
            transition:   "color 1s linear",
            overflow:     "visible",
            boxShadow:    selectAll ? "inset 0 0 0 2px rgba(100,130,200,0.35)" : undefined,
          }}
        >
          {positions.length === 0 && (
            <span
              className="select-none absolute top-0 left-0 pointer-events-none"
              style={{ color: "#C0C2CA", fontStyle: "italic" }}
            >
              {writingPrompt || "Fang einfach an zu schreiben…"}
            </span>
          )}
          {nodes}
        </div>
      </div>
      {/* Wrap-around clones rendered as portal so they're not clipped */}
      {wrapClones.length > 0 && createPortal(
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 5 }}>
          {wrapClones}
        </div>,
        document.body
      )}
      {/* Char-width measurement span */}
      <span
        ref={measSpanRef}
        className="absolute left-0 top-0 pointer-events-none"
        style={{
          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          fontSize: `${fontSize}px`,
          lineHeight: 1.6,
          visibility: "hidden",
          userSelect: "none",
          whiteSpace: "pre",
        }}
      >
        X
      </span>
    </>
  );
}
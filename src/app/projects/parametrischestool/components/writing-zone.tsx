import { useRef, useEffect, useLayoutEffect, useCallback, useState, useMemo } from "react";
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
  focusRef?: React.MutableRefObject<(() => void) | null>;
  textColor?: string;
  coverBgColor?: string;
  visibility?: Visibility;
  deleteMode?: DeleteMode;
  correctionMode?: CorrectionMode;
  textEditingEnabled?: boolean;
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
  runningLineModus?: boolean;
  textAppearsRandom?: boolean;
  boustrophedonModus?: boolean;
  randomMode?: "words" | "sentences";
  customPathModus?: boolean;
  customPath?: { x: number; y: number }[][];
  onCustomPathChange?: (updater: (prev: { x: number; y: number }[][]) => { x: number; y: number }[][]) => void;
  customPathDark?: boolean;
  customPathDe?: boolean;
  writingPrompt?: string;
  fontFamily?: string;
  centeredPrompt?: boolean;
  containerWidth?: string;
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

// ── Range deletion helper ──────────────────────────────────────────────────────

function deleteRange(
  positions: Position[],
  start: number,
  end: number,
  correctionMode: CorrectionMode
): Position[] {
  if (start >= end) return positions;
  if (correctionMode === "tippex") {
    const next = positions.map(p => ({ layers: [...p.layers] }));
    for (let i = start; i < end; i++) {
      if (getTopChar(positions[i]) !== " ") {
        next[i] = { layers: [...next[i].layers, { type: "cover" as const }] };
      }
    }
    return next;
  }
  return [...positions.slice(0, start), ...positions.slice(end)];
}

function wordLeft(positions: Position[], cursor: number): number {
  if (cursor === 0) return 0;
  let i = cursor - 1;
  while (i > 0 && (getVisibleChar(positions[i]) === " " || getVisibleChar(positions[i]) === "\n")) i--;
  while (i > 0 && getVisibleChar(positions[i - 1]) !== " " && getVisibleChar(positions[i - 1]) !== "\n") i--;
  return i;
}

function wordRight(positions: Position[], cursor: number): number {
  let i = cursor;
  while (i < positions.length && getVisibleChar(positions[i]) !== " " && getVisibleChar(positions[i]) !== "\n") i++;
  while (i < positions.length && (getVisibleChar(positions[i]) === " " || getVisibleChar(positions[i]) === "\n")) i++;
  return i;
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
      const tippexWhite = `rgba(255, 255, 255, ${alpha})`;
      out.push(
        <span
          key={`v${idx}`}
          style={{
            position:        "absolute",
            inset:           "-1px -0.5px",
            backgroundColor: tippexWhite,
            borderRadius:    "1px",
            boxShadow:       n === 1
              ? "0 1px 2px rgba(160,148,130,0.22), 0 0.5px 1px rgba(160,148,130,0.15)"
              : "0 1px 3px rgba(140,128,110,0.28), 0 0.5px 1px rgba(140,128,110,0.18)",
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

interface WordPhysics {
  x: number; y: number; z: number;
  rotateX: number; rotateY: number; rotateZ: number;
  vx: number; vy: number; vz: number;
  released: boolean;
  opacityPhase: number; opacitySpeed: number; opacityMin: number;
  baseSpeed: number;
  wanderAngle: number; wanderAngleZ: number;
  ghostTimer: number; ghostCooldown: number; ghostDuration: number; isGhost: boolean;
  isFiller: boolean; fillerTimer: number; fillerMaxTime: number; fadeOut: number;
}

const R_PERSP = 900;
const R_MIN_Z = -600;
const R_MAX_Z = 200;

function rnd(min: number, max: number) { return Math.random() * (max - min) + min; }
function rDepthOpacity(z: number) { return 0.25 + ((z - R_MIN_Z) / (R_MAX_Z - R_MIN_Z)) * 0.75; }

function extractWordGroups(positions: Position[], cursor: number): { ordinal: number; text: string; isActive: boolean }[] {
  const groups: { ordinal: number; text: string; isActive: boolean }[] = [];
  let wordStart = -1;
  let ordinal = 0;

  for (let i = 0; i <= positions.length; i++) {
    const ch = i < positions.length ? getVisibleChar(positions[i]) : null;
    const isDelim = !ch || ch === " " || ch === "\n";

    if (!isDelim && wordStart < 0) wordStart = i;

    if (isDelim && wordStart >= 0) {
      let text = "";
      for (let j = wordStart; j < i; j++) {
        const c = getVisibleChar(positions[j]);
        if (c) text += c;
      }
      if (text) {
        const isActive = cursor > wordStart && cursor <= i;
        groups.push({ ordinal: ordinal++, text, isActive });
      }
      wordStart = -1;
    }
  }

  // If no word is active (cursor between words or at start/end), add a ghost active entry for cursor display
  if (!groups.some(g => g.isActive)) {
    groups.push({ ordinal: ordinal, text: "", isActive: true });
  }

  return groups;
}

interface RandomTextZoneProps {
  textColor: string;
  fontFamily?: string;
  positions: Position[];
  cursor: number;
  fontSize?: number;
}

function RandomTextZone({ textColor, fontFamily = "'general-sans', sans-serif", positions, cursor, fontSize = 22 }: RandomTextZoneProps) {
  const wrapRef    = useRef<HTMLDivElement>(null);
  const rafRef     = useRef(0);
  const elMapRef   = useRef<Map<number, HTMLDivElement>>(new Map());
  const lastTRef   = useRef(0);
  const physicsRef = useRef<Map<number, WordPhysics>>(new Map());

  // Derive word groups purely from positions (recomputed each render)
  const wordGroups = extractWordGroups(positions, cursor);

  // Sync physics map after render (layout effect = after DOM mutations, before paint)
  useLayoutEffect(() => {
    const currentOrdinals = new Set(wordGroups.map(w => w.ordinal));

    // Remove physics for deleted words
    for (const ord of physicsRef.current.keys()) {
      if (!currentOrdinals.has(ord)) {
        physicsRef.current.delete(ord);
        elMapRef.current.delete(ord);
      }
    }

    const wrap = wrapRef.current;
    const { width: ww = 800, height: hh = 600 } = wrap?.getBoundingClientRect() ?? {};

    for (const w of wordGroups) {
      if (!physicsRef.current.has(w.ordinal)) {
        const z = rnd(R_MIN_Z * 0.4, R_MAX_Z * 0.6);
        const s = R_PERSP / (R_PERSP - z);
        physicsRef.current.set(w.ordinal, {
          x: rnd(-ww / s * 0.35, ww / s * 0.35),
          y: rnd(-hh / s * 0.35, hh / s * 0.35),
          z,
          rotateX: rnd(-8, 8), rotateY: rnd(-12, 12), rotateZ: rnd(-3, 3),
          vx: 0, vy: 0, vz: 0,
          released: !w.isActive,
          opacityPhase: rnd(0, Math.PI * 2), opacitySpeed: rnd(0.08, 0.3), opacityMin: rnd(0.4, 0.75),
          baseSpeed: rnd(0.2, 0.6),
          wanderAngle: rnd(0, Math.PI * 2), wanderAngleZ: rnd(0, Math.PI * 2),
          ghostTimer: 0, ghostCooldown: rnd(10, 35), ghostDuration: rnd(1.5, 5), isGhost: false,
          isFiller: FILLER_WORDS_SET.has(w.text.toLowerCase()),
          fillerTimer: 0, fillerMaxTime: rnd(5, 14), fadeOut: 1,
        });
      } else {
        const p = physicsRef.current.get(w.ordinal)!;
        if (!w.isActive && !p.released) {
          p.released = true;
          p.isFiller = FILLER_WORDS_SET.has(w.text.toLowerCase());
        } else if (w.isActive && p.released) {
          p.released = false;
        }
      }
    }
  }, [positions, cursor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animation loop — runs continuously, updates DOM transforms directly
  useEffect(() => {
    const loop = (time: number) => {
      if (!lastTRef.current) lastTRef.current = time;
      const dt = Math.min((time - lastTRef.current) / 1000, 0.1);
      lastTRef.current = time;

      const el = wrapRef.current;
      const w = el ? el.getBoundingClientRect().width  : 800;
      const h = el ? el.getBoundingClientRect().height : 600;
      const DAMP = 0.985;

      for (const [ord, p] of physicsRef.current) {
        const domEl = elMapRef.current.get(ord);

        if (!p.released) {
          if (domEl) {
            const s = R_PERSP / (R_PERSP - p.z);
            domEl.style.transform = `translate(-50%,-50%) translate(${p.x * s}px,${p.y * s}px) scale(${s}) rotateX(${p.rotateX}deg) rotateY(${p.rotateY}deg) rotateZ(${p.rotateZ}deg)`;
            domEl.style.opacity   = `${rDepthOpacity(p.z)}`;
            domEl.style.filter    = "none";
          }
          continue;
        }

        p.wanderAngle  += rnd(-0.3, 0.3) * dt;
        p.wanderAngleZ += rnd(-0.2, 0.2) * dt;
        const ws = p.baseSpeed * 0.4;
        p.vx += Math.cos(p.wanderAngle)  * ws * dt;
        p.vy += Math.sin(p.wanderAngle)  * ws * dt;
        p.vz += Math.sin(p.wanderAngleZ) * ws * 0.15 * dt;
        p.vx *= DAMP; p.vy *= DAMP; p.vz *= DAMP;
        p.x  += p.vx * dt * 6; p.y += p.vy * dt * 6; p.z += p.vz * dt * 3;

        const s  = R_PERSP / (R_PERSP - p.z);
        const sx = p.x * s, sy = p.y * s;
        const mx = w * 0.44, my = h * 0.42;
        if (sx >  mx) p.vx -= (sx - mx) * 0.002;
        if (sx < -mx) p.vx -= (sx + mx) * 0.002;
        if (sy >  my) p.vy -= (sy - my) * 0.002;
        if (sy < -my) p.vy -= (sy + my) * 0.002;
        p.z = Math.max(R_MIN_Z, Math.min(R_MAX_Z, p.z));
        if (p.z <= R_MIN_Z) p.vz =  Math.abs(p.vz) * 0.3;
        if (p.z >= R_MAX_Z) p.vz = -Math.abs(p.vz) * 0.3;

        p.opacityPhase += p.opacitySpeed * dt;
        const breathe = p.opacityMin + (1 - p.opacityMin) * (0.5 + 0.5 * Math.sin(p.opacityPhase));

        if (!p.isGhost) {
          p.ghostTimer += dt;
          if (p.ghostTimer >= p.ghostCooldown) { p.isGhost = true; p.ghostTimer = 0; }
        } else {
          p.ghostTimer += dt;
          if (p.ghostTimer >= p.ghostDuration) {
            p.isGhost = false; p.ghostTimer = 0;
            p.ghostCooldown = rnd(8, 30); p.ghostDuration = rnd(1.5, 5);
          }
        }
        const ghost = p.isGhost ? Math.max(0, 1 - p.ghostTimer / 0.8) : Math.min(1, p.ghostTimer / 0.8);

        if (p.isFiller) {
          p.fillerTimer += dt;
          if (p.fillerTimer > p.fillerMaxTime) {
            p.fadeOut -= dt * 0.3;
            if (p.fadeOut < 0) p.fadeOut = 0;
          }
        }

        if (domEl) {
          const op = rDepthOpacity(p.z) * p.fadeOut * breathe * ghost;
          domEl.style.transform = `translate(-50%,-50%) translate(${sx}px,${sy}px) scale(${s}) rotateX(${p.rotateX}deg) rotateY(${p.rotateY}deg) rotateZ(${p.rotateZ}deg)`;
          domEl.style.opacity   = `${Math.max(0, op)}`;
          domEl.style.filter    = p.z < -200 ? `blur(${((-200 - p.z) / 200) * 1.5}px)` : "none";
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const [r, g, b] = parseRgb(textColor);

  return (
    <div
      ref={wrapRef}
      style={{ position: "absolute", inset: 0, perspective: `${R_PERSP}px`, perspectiveOrigin: "50% 50%", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
        {wordGroups.map(w => (
          <div
            key={w.ordinal}
            ref={el => { if (el) elMapRef.current.set(w.ordinal, el); else elMapRef.current.delete(w.ordinal); }}
            style={{
              position: "absolute", left: "50%", top: "50%",
              color: `rgb(${r},${g},${b})`,
              fontFamily,
              fontSize: `${fontSize}px`,
              fontWeight: 400, letterSpacing: "0.02em",
              whiteSpace: "nowrap", userSelect: "none", pointerEvents: "none",
              willChange: "transform, opacity", transformStyle: "preserve-3d",
            }}
          >
            {w.text}
            {w.isActive && (
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
      {positions.length === 0 && (
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)", pointerEvents: "none",
          fontFamily,
          fontSize: `${fontSize}px`,
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
  coverBgColor?: string;
  visibility: "visible" | "hidden" | "sentence" | "word" | "char";
  split: number;
  verblasst: boolean;
  posTimesRef: React.MutableRefObject<number[]>;
  verblassenDelay: number;
  verblassenSpeed: number;
  driftTick: number;
  fontFamily?: string;
  fontSize?: number;
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
  fontFamily = "'general-sans', sans-serif",
  coverBgColor = "#f2f3f6",
  fontSize = 20,
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
    const charInfos: { char: string; posIdx: number; shouldHide: boolean; isCover: boolean }[] = [];
    for (let i = 0; i < positions.length; i++) {
      const visChar = getVisibleChar(positions[i]);
      const topChar = getTopChar(positions[i]);
      const isCover = visChar === null && topChar !== null;
      const ch = visChar ?? topChar;
      if (ch === null) continue;
      const beforeCursor = i < cursor;
      const shouldHide =
        isAllHidden ||
        (visibility !== "visible" && beforeCursor && i < split);
      charInfos.push({
        char: ch === "\n" ? " " : ch,
        posIdx: i,
        shouldHide,
        isCover,
      });
    }

    const chars = charInfos.map(c => c.char);
    const N = chars.length;
    const [r, g, b] = parseRgb(textColor);

    const cx = W / 2;
    const cy = H / 2;
    const minR  = 24;
    const maxR  = Math.min(W, H) * 0.38;
    const minFs = Math.max(6, fontSize * 0.28);
    const maxFs = fontSize;
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
      fs: number; opacity: number; rot: number; shouldHide: boolean; isCover: boolean;
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
        isCover: charInfos[i]?.isCover ?? false,
      });
    }

    // draw oldest → newest
    for (const cp of cps) {
      if (cp.shouldHide) continue;
      ctx.save();
      ctx.translate(cp.x, cp.y);
      ctx.rotate(cp.rot);
      ctx.font = `${cp.fs}px ${fontFamily}`;
      if (cp.isCover) {
        const cw = ctx.measureText(cp.char).width;
        ctx.fillStyle = coverBgColor;
        ctx.fillRect(-cw * 0.6, -cp.fs * 0.6, cw * 1.2, cp.fs * 1.2);
      } else {
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, cp.opacity)})`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cp.char, 0, 0);
      }
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
  }, [positions, cursor, textColor, coverBgColor, visibility, split, verblasst, posTimesRef,
      verblassenDelay, verblassenSpeed, cursorOn, size, driftTick, fontFamily, fontSize]);

  return (
    <div ref={wrapRef} style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

// ── RunningLineCanvas ─────────────────────────────────────────────────────────

interface RunningLineCanvasProps {
  positions: Position[];
  cursor: number;
  textColor: string;
  coverBgColor?: string;
  visibility: "visible" | "hidden" | "sentence" | "word" | "char";
  split: number;
  verblasst: boolean;
  posTimesRef: React.MutableRefObject<number[]>;
  verblassenDelay: number;
  verblassenSpeed: number;
  driftTick: number;
  fontFamily?: string;
  fontSize?: number;
}

function RunningLineCanvas({
  positions,
  cursor,
  textColor,
  coverBgColor = "#f2f3f6",
  visibility,
  split,
  verblasst,
  posTimesRef,
  verblassenDelay,
  verblassenSpeed,
  driftTick,
  fontFamily = "'general-sans', sans-serif",
  fontSize = 20,
}: RunningLineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const [cursorOn, setCursorOn] = useState(true);
  const [size, setSize]         = useState({ w: 0, h: 0 });

  useEffect(() => {
    const id = setInterval(() => setCursorOn(v => !v), 530);
    return () => clearInterval(id);
  }, []);

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

    const fs = fontSize;
    ctx.font = `${fs}px ${fontFamily}`;
    const [r, g, b] = parseRgb(textColor);
    const cy       = H / 2;
    const cx       = W / 2;
    const baseline = cy + fs * 0.35;
    const isAllHidden = visibility === "hidden";
    const nowMs = Date.now();

    // Build char list (same pattern as SpiralCanvas)
    const charInfos: { char: string; posIdx: number; shouldHide: boolean; isCover: boolean }[] = [];
    for (let i = 0; i < positions.length; i++) {
      const visChar = getVisibleChar(positions[i]);
      const topChar = getTopChar(positions[i]);
      const isCover = visChar === null && topChar !== null;
      const ch = visChar ?? topChar;
      if (ch === null) continue;
      const beforeCursor = i < cursor;
      const shouldHide = isAllHidden || (visibility !== "visible" && beforeCursor && i < split);
      charInfos.push({ char: ch === "\n" ? " " : ch, posIdx: i, shouldHide, isCover });
    }

    // Measure char widths
    const charWidths = charInfos.map(c => ctx.measureText(c.char).width);

    // Sum widths of all chars before cursor
    let preWidth = 0;
    for (let i = 0; i < charInfos.length; i++) {
      if (charInfos[i].posIdx < cursor) preWidth += charWidths[i];
      else break;
    }

    // Start x so cursor lands at cx
    let x = cx - preWidth;

    for (let i = 0; i < charInfos.length; i++) {
      const ci = charInfos[i];
      const w  = charWidths[i];
      const charX = x;
      x += w;

      if (charX + w < -200 || charX > W + 200) continue;

      if (ci.isCover) {
        ctx.fillStyle = coverBgColor;
        ctx.fillRect(charX, cy - fs * 0.75, w, fs * 1.1);
      } else if (!ci.shouldHide) {
        let alpha = 1;
        if (verblasst && ci.posIdx < cursor) {
          const age = (nowMs - (posTimesRef.current[ci.posIdx] ?? nowMs)) / 1000;
          const delay = verblassenDelay / 10;
          alpha = Math.max(0, 1 - Math.max(0, age - delay) * (verblassenSpeed / 100) * 0.5);
        }
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillText(ci.char, charX, baseline);
      }
    }

    // Cursor bar at cx
    if (cursorOn) {
      ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
      ctx.fillRect(cx, cy - fs * 0.55, 2, fs * 1.1);
    }
  }, [positions, cursor, textColor, coverBgColor, visibility, split, verblasst, posTimesRef,
      verblassenDelay, verblassenSpeed, driftTick, fontFamily, fontSize, size, cursorOn]);

  return (
    <div ref={wrapRef} style={{ position: "absolute", inset: 0 }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

// ── CustomPathSvg ─────────────────────────────────────────────────────────────

type CpPt = { x: number; y: number };

function cpSegLength(pts: CpPt[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    l += Math.sqrt(dx * dx + dy * dy);
  }
  return l;
}

function cpPtAtDist(pts: CpPt[], d: number): { x: number; y: number; angle: number } | null {
  if (pts.length < 2) return null;
  let gone = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-4) continue;
    if (gone + len >= d) {
      const t = (d - gone) / len;
      return {
        x: pts[i - 1].x + dx * t,
        y: pts[i - 1].y + dy * t,
        angle: Math.atan2(dy, dx),
      };
    }
    gone += len;
  }
  const n = pts.length;
  const dx = pts[n - 1].x - pts[n - 2].x;
  const dy = pts[n - 1].y - pts[n - 2].y;
  return { x: pts[n - 1].x, y: pts[n - 1].y, angle: Math.atan2(dy, dx) };
}

function cpSvgPathD(pts: CpPt[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = ((pts[i].x + pts[i + 1].x) / 2).toFixed(1);
    const my = ((pts[i].y + pts[i + 1].y) / 2).toFixed(1);
    d += ` Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

function cpSplitAt(pts: CpPt[], localOff: number, total: number): { used: CpPt[]; remaining: CpPt[] } {
  if (localOff <= 0) return { used: [], remaining: pts };
  if (localOff >= total) return { used: pts, remaining: [] };
  let gone = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (gone + len >= localOff) {
      const t = (localOff - gone) / len;
      const sp = { x: pts[i - 1].x + dx * t, y: pts[i - 1].y + dy * t };
      return { used: [...pts.slice(0, i), sp], remaining: [sp, ...pts.slice(i)] };
    }
    gone += len;
  }
  return { used: pts, remaining: [] };
}

const cpMeasCanvas: HTMLCanvasElement | null = typeof document !== "undefined" ? document.createElement("canvas") : null;
const cpMeasCtx = cpMeasCanvas?.getContext("2d") ?? null;

interface CustomPathSvgProps {
  positions: Position[];
  cursor: number;
  textColor: string;
  fontFamily?: string;
  fontSize?: number;
  customPath: CpPt[][];
  onCustomPathChange?: (updater: (prev: CpPt[][]) => CpPt[][]) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  dark?: boolean;
  isDe?: boolean;
}

function CustomPathSvg({
  positions,
  cursor,
  textColor,
  fontFamily = "'general-sans', sans-serif",
  fontSize = 20,
  customPath,
  onCustomPathChange,
  containerRef,
  dark = false,
  isDe = true,
}: CustomPathSvgProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [livePoints, setLivePoints] = useState<CpPt[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);
  const [fullWarn, setFullWarn] = useState(false);

  const livePointsRef = useRef<CpPt[]>([]);
  const isDrawingRef = useRef(false);
  const dimsRef = useRef(dims);
  const onChangeRef = useRef(onCustomPathChange);
  useEffect(() => { dimsRef.current = dims; }, [dims]);
  useEffect(() => { onChangeRef.current = onCustomPathChange; }, [onCustomPathChange]);

  useEffect(() => {
    const id = setInterval(() => setCursorOn(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setDims({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const charW = useCallback((ch: string): number => {
    if (!cpMeasCtx) return fontSize * 0.6;
    cpMeasCtx.font = `${fontSize}px ${fontFamily}`;
    return cpMeasCtx.measureText(ch).width;
  }, [fontFamily, fontSize]);

  const { segsPx, totalLen } = useMemo(() => {
    const segs = customPath
      .filter(s => s.length >= 2)
      .map(s => s.map(p => ({ x: p.x * dims.w, y: p.y * dims.h })));
    let acc = 0;
    const out = segs.map(pts => {
      const len = cpSegLength(pts);
      const r = { pts, length: len, startOffset: acc };
      acc += len;
      return r;
    });
    return { segsPx: out, totalLen: acc };
  }, [customPath, dims.w, dims.h]);

  const ptAtGlobal = useCallback((offset: number): { x: number; y: number; angle: number } | null => {
    if (totalLen === 0) return null;
    const o = Math.max(0, Math.min(offset, totalLen));
    for (const s of segsPx) {
      if (o >= s.startOffset && o <= s.startOffset + s.length + 0.1) {
        return cpPtAtDist(s.pts, Math.min(o - s.startOffset, s.length));
      }
    }
    const last = segsPx[segsPx.length - 1];
    return cpPtAtDist(last.pts, last.length);
  }, [segsPx, totalLen]);

  const charsPlaced = useMemo(() => {
    type Placed = { char: string; x: number; y: number; angle: number; posIdx: number };
    const placed: Placed[] = [];
    let off = 0;
    let cursorOff = -1;
    for (let i = 0; i < positions.length; i++) {
      if (i === cursor) cursorOff = off;
      const visCh = getVisibleChar(positions[i]);
      const topCh = getTopChar(positions[i]);
      const ch = visCh ?? topCh;
      if (ch === null) continue;
      const display = ch === "\n" ? " " : ch;
      const w = charW(display);
      if (totalLen > 0 && off + w <= totalLen + fontSize && display !== " ") {
        const pt = ptAtGlobal(off + w / 2);
        if (pt) placed.push({ char: display, x: pt.x, y: pt.y, angle: pt.angle, posIdx: i });
      }
      off += w;
    }
    if (cursorOff < 0) cursorOff = off;
    return { placed, cursorOffset: cursorOff, totalCharLen: off };
  }, [positions, cursor, totalLen, charW, fontSize, ptAtGlobal]);

  // Full-warn flash
  const prevLenRef = useRef(positions.length);
  useEffect(() => {
    if (positions.length > prevLenRef.current && totalLen > 0 && charsPlaced.totalCharLen > totalLen) {
      setFullWarn(true);
      const id = window.setTimeout(() => setFullWarn(false), 650);
      prevLenRef.current = positions.length;
      return () => clearTimeout(id);
    }
    prevLenRef.current = positions.length;
  }, [positions.length, totalLen, charsPlaced.totalCharLen]);

  const endDraw = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setIsDrawing(false);
    const pts = livePointsRef.current;
    livePointsRef.current = [];
    setLivePoints([]);
    const { w, h } = dimsRef.current;
    if (pts.length >= 2 && cpSegLength(pts) > 5 && w > 0 && h > 0 && onChangeRef.current) {
      let smoothed: CpPt[] = pts;
      if (pts.length > 80) {
        const step = pts.length / 80;
        smoothed = [];
        for (let i = 0; i < pts.length; i += step) smoothed.push(pts[Math.floor(i)]);
        const last = pts[pts.length - 1];
        if (smoothed[smoothed.length - 1] !== last) smoothed.push(last);
      }
      const norm = smoothed.map(p => ({ x: p.x / w, y: p.y / h }));
      onChangeRef.current(prev => [...prev, norm]);
    }
    containerRef.current?.focus();
  }, [containerRef]);

  useEffect(() => {
    const handler = () => endDraw();
    window.addEventListener("mouseup", handler);
    window.addEventListener("touchend", handler);
    window.addEventListener("touchcancel", handler);
    return () => {
      window.removeEventListener("mouseup", handler);
      window.removeEventListener("touchend", handler);
      window.removeEventListener("touchcancel", handler);
    };
  }, [endDraw]);

  const startDraw = (pt: CpPt) => {
    containerRef.current?.focus();
    isDrawingRef.current = true;
    setIsDrawing(true);
    livePointsRef.current = [pt];
    setLivePoints([pt]);
  };

  const continueDraw = (pt: CpPt) => {
    if (!isDrawingRef.current) return;
    const lp = livePointsRef.current;
    const last = lp[lp.length - 1];
    const dx = pt.x - last.x, dy = pt.y - last.y;
    if (dx * dx + dy * dy >= 9) {
      const next = [...lp, pt];
      livePointsRef.current = next;
      setLivePoints(next);
    }
  };

  const mouseXY = (e: React.MouseEvent<SVGSVGElement>): CpPt => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const touchXY = (e: React.TouchEvent<SVGSVGElement>): CpPt => {
    const r = svgRef.current!.getBoundingClientRect();
    const t = e.touches[0];
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };

  const usedColor   = dark ? "rgba(240,232,220,0.20)" : "rgba(85,85,85,0.20)";
  const availColor  = dark ? "rgba(240,232,220,0.42)" : "rgba(85,85,85,0.40)";
  const liveColor   = dark ? "rgba(240,232,220,0.60)" : "rgba(85,85,85,0.55)";
  const hintColor   = dark ? "rgba(240,232,220,0.32)" : "rgba(85,85,85,0.30)";
  const endColor    = dark ? "rgba(240,232,220,0.55)" : "rgba(120,110,100,0.65)";
  const warnColor   = "#c84a3a";

  const usedTotal = Math.min(charsPlaced.totalCharLen, totalLen);
  const isFull = totalLen > 0 && charsPlaced.totalCharLen >= totalLen - fontSize * 0.4;
  const hasContent = customPath.length > 0 || livePoints.length > 0;
  const showHint = !hasContent && !isDrawing;

  const endPt = useMemo(() => {
    if (segsPx.length === 0) return null;
    const last = segsPx[segsPx.length - 1].pts;
    return last[last.length - 1] ?? null;
  }, [segsPx]);

  const cursorPt = (!isFull && totalLen > 0)
    ? ptAtGlobal(charsPlaced.cursorOffset)
    : null;

  return (
    <div ref={wrapRef} style={{ position: "absolute", inset: 0, cursor: "crosshair", touchAction: "none" }}>
      <svg
        ref={svgRef}
        width={dims.w}
        height={dims.h}
        onMouseDown={e => { if (e.button === 0) { e.preventDefault(); startDraw(mouseXY(e)); } }}
        onMouseMove={e => { if (isDrawingRef.current) continueDraw(mouseXY(e)); }}
        onTouchStart={e => { e.preventDefault(); startDraw(touchXY(e)); }}
        onTouchMove={e => { e.preventDefault(); continueDraw(touchXY(e)); }}
        style={{ display: "block", userSelect: "none" }}
      >
        {segsPx.map((seg, idx) => {
          const segStart = seg.startOffset;
          const segEnd = seg.startOffset + seg.length;
          const segUsed = usedTotal >= segEnd ? seg.length
                        : usedTotal <= segStart ? 0
                        : usedTotal - segStart;
          const { used, remaining } = cpSplitAt(seg.pts, segUsed, seg.length);
          return (
            <g key={idx}>
              {used.length >= 2 && (
                <path d={cpSvgPathD(used)} fill="none" stroke={usedColor} strokeWidth={1} strokeLinecap="round" />
              )}
              {remaining.length >= 2 && (
                <path d={cpSvgPathD(remaining)} fill="none" stroke={availColor} strokeWidth={1} strokeDasharray="3 7" strokeLinecap="round" opacity={0.85} />
              )}
            </g>
          );
        })}

        {livePoints.length >= 2 && (
          <path d={cpSvgPathD(livePoints)} fill="none" stroke={liveColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {charsPlaced.placed.map((c, idx) => (
          <text
            key={`${c.posIdx}-${idx}`}
            transform={`translate(${c.x.toFixed(2)},${c.y.toFixed(2)}) rotate(${((c.angle * 180) / Math.PI).toFixed(2)})`}
            fontSize={fontSize}
            fontFamily={fontFamily}
            fill={textColor}
            dominantBaseline="alphabetic"
            textAnchor="middle"
            style={{ userSelect: "none", pointerEvents: "none" }}
          >
            {c.char}
          </text>
        ))}

        {cursorPt && !isFull && cursorOn && (
          <circle cx={cursorPt.x} cy={cursorPt.y} r={1.8} fill={textColor} opacity={0.85} />
        )}

        {endPt && isFull && (
          <g>
            {!fullWarn && (
              <circle cx={endPt.x} cy={endPt.y} r={6} fill="none" stroke={endColor} strokeWidth={1} opacity={0.4}>
                <animate attributeName="r" values="4;9;4" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2.2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={endPt.x} cy={endPt.y}
              r={fullWarn ? 4 : 2.5}
              fill={fullWarn ? warnColor : endColor}
              opacity={fullWarn ? 0.9 : 0.65}
              style={{ transition: "r 0.15s ease, fill 0.2s ease, opacity 0.2s ease" }}
            />
          </g>
        )}
      </svg>

      {showHint && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          pointerEvents: "none", flexDirection: "column", gap: 12,
        }}>
          <svg width={200} height={40} viewBox="0 0 200 40" opacity={0.45}>
            <path d="M 10 28 Q 40 10 70 24 Q 100 38 130 18 Q 160 6 190 22"
              fill="none" stroke={hintColor} strokeWidth={1.5} strokeDasharray="3 6" strokeLinecap="round" />
            <circle cx={190} cy={22} r={2.5} fill={hintColor}>
              <animate attributeName="opacity" values="0.8;0;0.8" dur="1.1s" repeatCount="indefinite" />
            </circle>
          </svg>
          <span style={{
            fontFamily, fontSize: 11,
            letterSpacing: "0.3em", textTransform: "uppercase",
            color: hintColor,
          }}>
            {isDe ? "Linie zeichnen · dann tippen" : "draw a line · then type"}
          </span>
        </div>
      )}

      {isFull && !showHint && (
        <div style={{
          position: "absolute", bottom: 32, left: 0, right: 0,
          display: "flex", justifyContent: "center", pointerEvents: "none",
        }}>
          <span style={{
            fontFamily, fontSize: 11,
            letterSpacing: "0.28em", textTransform: "uppercase",
            color: fullWarn ? warnColor : hintColor,
            transition: "color 0.25s ease",
          }}>
            {isDe ? "Zeichne weiter um fortzufahren" : "draw more to continue"}
          </span>
        </div>
      )}
    </div>
  );
}

// ── BoustrophedonZone ─────────────────────────────────────────────────────────
// Renders text in alternating left-to-right / right-to-left lines.
// Even lines (0, 2, 4…): normal direction.
// Odd lines  (1, 3, 5…): mirrored horizontally with scaleX(-1).

interface BoustrophedonZoneProps {
  positions: Position[];
  cursor: number;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  coverBgColor: string;
  showTippex: boolean;
  cursorDomRef: React.RefObject<HTMLSpanElement>;
  writingPrompt?: string;
}

function BoustrophedonZone({
  positions,
  cursor,
  textColor,
  fontFamily,
  fontSize,
  coverBgColor,
  showTippex,
  cursorDomRef,
  writingPrompt,
}: BoustrophedonZoneProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const measCtxRef    = useRef<CanvasRenderingContext2D | null>(null);
  const [lineW, setLineW] = useState(700);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) measCtxRef.current = ctx;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setLineW(e.contentRect.width || 700));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build lines: arrays of position indices; -1 = cursor slot
  const lines = useMemo(() => {
    const ctx = measCtxRef.current;
    if (!ctx || lineW <= 0) return [[-1]] as number[][];
    ctx.font = `${fontSize}px ${fontFamily}`;

    const result: number[][] = [];
    let currentLine: number[] = [];
    let lineUsed = 0;

    const pushLine = () => { result.push(currentLine); currentLine = []; lineUsed = 0; };

    for (let i = 0; i <= positions.length; i++) {
      if (i === cursor) currentLine.push(-1); // cursor slot — 0 width
      if (i >= positions.length) break;

      const pos = positions[i];
      const top = getTopChar(pos);
      if (!top) continue;

      if (top === "\n") { pushLine(); continue; }

      const visChar = getVisibleChar(pos) ?? top;
      const w = ctx.measureText(visChar === " " ? " " : visChar).width;

      if (lineUsed + w > lineW && currentLine.filter(x => x >= 0).length > 0) pushLine();
      currentLine.push(i);
      lineUsed += w;
    }
    if (currentLine.length > 0) result.push(currentLine);
    return result.length > 0 ? result : [[-1]];
  }, [positions, cursor, fontSize, fontFamily, lineW]);

  const [r, g, b] = parseRgb(textColor);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", fontFamily, fontSize: `${fontSize}px`, color: textColor, lineHeight: 1.6, position: "relative" }}
    >
      {positions.length === 0 && (
        <span style={{ position: "absolute", top: 0, left: 0, color: "#AAAAAA", pointerEvents: "none", userSelect: "none" }}>
          {writingPrompt || "Fang einfach an zu schreiben…"}
        </span>
      )}
      {lines.map((line, lineIdx) => {
        const isFlipped = lineIdx % 2 === 1;
        return (
          <div
            key={lineIdx}
            style={{
              display: "block",
              width: "100%",
              transform: isFlipped ? "scaleX(-1)" : undefined,
              transformOrigin: "center center",
              whiteSpace: "nowrap",
              minHeight: `${fontSize * 1.6}px`,
              lineHeight: 1.6,
            }}
          >
            {line.map((posIdx, j) => {
              if (posIdx === -1) {
                return (
                  <span
                    key={`csr-${j}`}
                    ref={cursorDomRef}
                    style={{
                      display: "inline-block",
                      width: "2px",
                      backgroundColor: textColor,
                      height: "1.15em",
                      verticalAlign: "text-bottom",
                      marginLeft: "-1px",
                      marginRight: "-1px",
                      animation: "cursorBlink 1s step-end infinite",
                    }}
                  />
                );
              }
              const pos = positions[posIdx];
              return (
                <span key={posIdx} style={{ display: "inline", color: `rgb(${r},${g},${b})` }}>
                  {renderLayers(pos, showTippex, coverBgColor)}
                </span>
              );
            })}
          </div>
        );
      })}
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
  focusRef,
  textColor          = "#313642",
  coverBgColor       = "#F2F3F6",
  visibility         = "visible",
  deleteMode         = "deletable",
  correctionMode     = "hidden",
  textEditingEnabled = true,
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
  runningLineModus   = false,
  textAppearsRandom  = false,
  boustrophedonModus = false,
  randomMode         = "words" as const,
  customPathModus    = false,
  customPath         = [] as { x: number; y: number }[][],
  onCustomPathChange,
  customPathDark     = false,
  customPathDe       = true,
  writingPrompt      = "",
  fontSize           = 20,
  fontFamily         = "'general-sans', sans-serif",
  centeredPrompt     = false,
  containerWidth     = "1010px",
}: WritingZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorDomRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (focusRef) focusRef.current = () => containerRef.current?.focus();
  });

  const posRef = useRef(positions);
  const curRef = useRef(cursor);
  const lkpt   = lastKeyPressTimestamp;
  const selectAllRef  = useRef(false);
  const [selectAll, setSelectAll]   = useState(false);
  const selAnchorRef  = useRef<number | null>(null);
  const [selAnchor, setSelAnchor]   = useState<number | null>(null);

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

  // Auto-focus when switching to spiral, random, or running line mode
  useEffect(() => {
    if (spiralModus || textAppearsRandom || runningLineModus || boustrophedonModus) {
      setTimeout(() => containerRef.current?.focus(), 0);
    }
  }, [spiralModus, textAppearsRandom, runningLineModus, boustrophedonModus]);

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
            const spd = spf;
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
            const spd = spf;
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

  // Document-level fallback: if user has a non-collapsed browser selection inside
  // the writing area, Backspace/Delete should clear that selection — even if the
  // currently focused element is not the writing container (e.g. <body>).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      const ae = document.activeElement as HTMLElement | null;
      if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.isContentEditable)) return;
      if (!containerRef.current) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) return;
      if (!textEditingEnabled || deleteMode === "no-delete") return;
      let lo = -1, hi = -1;
      for (let i = 0; i < charElsRef.current.length; i++) {
        const el = charElsRef.current[i];
        if (el && range.intersectsNode(el)) { if (lo === -1) lo = i; hi = i; }
      }
      if (lo < 0 || hi < lo) return;
      e.preventDefault();
      sel.removeAllRanges();
      selAnchorRef.current = null; setSelAnchor(null);
      const newPos = deleteRange(posRef.current, lo, hi + 1, correctionMode);
      onUpdateRef.current(newPos, lo);
      lkpt.current = performance.now();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [textEditingEnabled, deleteMode, correctionMode, lkpt]);

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
  const pendingSpacesRef  = useRef(0); // visual advances not yet committed to React state
  const lastFrameRef      = useRef<number>(0);
  const onUpdateRef       = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  // Char-width measurement for cursor-keeps-running spacing
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
      pendingSpacesRef.current  = 0;
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

      // frac: fractional offset within the current character cell (0..1).
      // We commit a space FIRST, then recalculate frac, so the transform is
      // always in [0, 1) — no backward snap on the commit frame.
      let frac = visualPosRef.current - spacesInsertedRef.current;
      const charW = charWidthRef.current;

      if (frac >= 1) {
        spacesInsertedRef.current++;
        // Cap pending at 300 chars to avoid huge flush on very long pauses
        pendingSpacesRef.current = Math.min(pendingSpacesRef.current + 1, 300);
        frac = visualPosRef.current - spacesInsertedRef.current;
        // Do NOT call onUpdate here — no React re-renders during animation.
        // Pending spaces are flushed synchronously on the next keypress.
      }

      if (cursorDomRef.current) {
        // Full offset: integer pending chars + fractional current char
        const totalOffset = (pendingSpacesRef.current + frac) * charW;
        cursorDomRef.current.style.transform = `translateX(${totalOffset}px)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      if (cursorDomRef.current) cursorDomRef.current.style.transform = "";
    };
  }, [cursorLaeuftWeiter]); // onUpdate/lkpt excluded intentionally – via ref

  // Flush pending spaces every ~1s so the cursor doesn't drift off-screen
  useEffect(() => {
    if (!cursorLaeuftWeiter) return;
    const id = setInterval(() => {
      const pending = pendingSpacesRef.current;
      if (pending === 0) return;
      pendingSpacesRef.current  = 0;
      visualPosRef.current      = 0;
      spacesInsertedRef.current = 0;
      lastFrameRef.current      = 0;
      let basePos = posRef.current;
      let baseCur = curRef.current;
      for (let pi = 0; pi < pending; pi++) {
        if (baseCur < basePos.length) {
          const upd = basePos.map((p: { layers: { type: string; char?: string }[] }) => ({ layers: [...p.layers] }));
          upd[baseCur] = { layers: [...upd[baseCur].layers, { type: "char", char: " " }] };
          basePos = upd;
        } else {
          basePos = [...basePos, { layers: [{ type: "char", char: " " }] }];
        }
        baseCur++;
      }
      onUpdateRef.current(basePos, baseCur);
    }, 900);
    return () => clearInterval(id);
  }, [cursorLaeuftWeiter]);

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
      if (e.key === "Tab") return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        if (positions.length > 0) { selectAllRef.current = true; setSelectAll(true); }
        return;
      }

      // Arrow key navigation (only when textEditingEnabled)
      if (
        textEditingEnabled &&
        (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End")
      ) {
        e.preventDefault();
        let newCursor = cursor;
        if (e.key === "ArrowLeft") {
          newCursor = (e.ctrlKey || e.metaKey) ? wordLeft(positions, cursor) : Math.max(0, cursor - 1);
        } else if (e.key === "ArrowRight") {
          newCursor = (e.ctrlKey || e.metaKey) ? wordRight(positions, cursor) : Math.min(positions.length, cursor + 1);
        } else if (e.key === "Home") {
          newCursor = 0;
        } else if (e.key === "End") {
          newCursor = positions.length;
        }
        if (e.shiftKey) {
          if (selAnchorRef.current === null) { selAnchorRef.current = cursor; setSelAnchor(cursor); }
        } else {
          selAnchorRef.current = null; setSelAnchor(null);
        }
        onUpdate(positions, newCursor);
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      const now = performance.now();

      if (e.key === "Backspace" || e.key === "Delete") {
        // Discard any pending visual-only cursor advance on backspace/delete
        pendingSpacesRef.current  = 0;
        visualPosRef.current      = 0;
        spacesInsertedRef.current = 0;
        lastFrameRef.current      = 0;
        if (selectAllRef.current) {
          selectAllRef.current = false; setSelectAll(false);
          selAnchorRef.current = null; setSelAnchor(null);
          if (deleteMode !== "no-delete") onUpdate([], 0);
          return;
        }
        // Browser/mouse selection (drag-selected via mouse): map DOM selection
        // to char indices via charElsRef, then delete that range.
        if (textEditingEnabled && deleteMode !== "no-delete" && containerRef.current) {
          const winSel = typeof window !== "undefined" ? window.getSelection() : null;
          if (winSel && winSel.rangeCount > 0 && !winSel.isCollapsed) {
            const range = winSel.getRangeAt(0);
            if (containerRef.current.contains(range.commonAncestorContainer)) {
              let lo = -1, hi = -1;
              for (let i = 0; i < charElsRef.current.length; i++) {
                const el = charElsRef.current[i];
                if (el && range.intersectsNode(el)) {
                  if (lo === -1) lo = i;
                  hi = i;
                }
              }
              if (lo >= 0 && hi >= lo) {
                winSel.removeAllRanges();
                selAnchorRef.current = null; setSelAnchor(null);
                const newPos = deleteRange(positions, lo, hi + 1, correctionMode);
                onUpdate(newPos, lo);
                lkpt.current = now;
                return;
              }
            }
          }
        }
        // Delete selection range — always allowed when free editing is on
        const anch = selAnchorRef.current;
        if (textEditingEnabled && anch !== null && anch !== cursor) {
          const start = Math.min(anch, cursor);
          const end   = Math.max(anch, cursor);
          selAnchorRef.current = null; setSelAnchor(null);
          const newPos = deleteRange(positions, start, end, correctionMode);
          onUpdate(newPos, start);
          lkpt.current = now;
          return;
        }
        selAnchorRef.current = null; setSelAnchor(null);
        if (e.key === "Backspace") { applyBackspace(); lkpt.current = now; }
        if (e.key === "Delete" && textEditingEnabled && cursor < positions.length && deleteMode !== "no-delete") {
          if (correctionMode === "tippex" && getTopChar(positions[cursor]) !== " ") {
            const next = positions.map(p => ({ layers: [...p.layers] }));
            next[cursor] = { layers: [...next[cursor].layers, { type: "cover" as const }] };
            onUpdate(next, cursor);
          } else if (correctionMode !== "tippex") {
            onUpdate([...positions.slice(0, cursor), ...positions.slice(cursor + 1)], cursor);
          }
          lkpt.current = now;
        }
        return;
      }

      const ch = e.key === "Enter" ? "\n" : e.key.length === 1 ? e.key : null;
      if (!ch) { selectAllRef.current = false; setSelectAll(false); selAnchorRef.current = null; setSelAnchor(null); return; }

      if (selectAllRef.current) {
        selectAllRef.current = false; setSelectAll(false);
        selAnchorRef.current = null; setSelAnchor(null);
        pendingSpacesRef.current  = 0;
        visualPosRef.current      = 0;
        spacesInsertedRef.current = 0;
        lastFrameRef.current      = 0;
        onUpdate([{ layers: [{ type: "char", char: ch }] }], 1);
        return;
      }

      // Delete selection before inserting
      const anch = selAnchorRef.current;
      selAnchorRef.current = null; setSelAnchor(null);
      let basePos = positions;
      let baseCur = cursor;
      if (textEditingEnabled && anch !== null && anch !== cursor) {
        const start = Math.min(anch, cursor);
        const end   = Math.max(anch, cursor);
        basePos = deleteRange(positions, start, end, correctionMode);
        baseCur = start;
      }

      // Flush pending cursor advances: insert all deferred spaces at once,
      // then append the typed char — only ONE React re-render total.
      const pending = pendingSpacesRef.current;
      pendingSpacesRef.current  = 0;
      visualPosRef.current      = 0;
      spacesInsertedRef.current = 0;
      lastFrameRef.current      = 0;
      for (let pi = 0; pi < pending; pi++) {
        if (baseCur < basePos.length) {
          const upd = basePos.map(p => ({ layers: [...p.layers] }));
          upd[baseCur] = { layers: [...upd[baseCur].layers, { type: "char", char: " " }] };
          basePos = upd;
        } else {
          basePos = [...basePos, { layers: [{ type: "char", char: " " }] }];
        }
        baseCur++;
      }

      let newPos: Position[];
      if (baseCur < basePos.length) {
        const next    = basePos.map(p => ({ layers: [...p.layers] }));
        next[baseCur] = { layers: [...next[baseCur].layers, { type: "char", char: ch }] };
        newPos = next;
      } else {
        newPos = [...basePos, { layers: [{ type: "char", char: ch }] }];
      }
      lkpt.current = now;
      onUpdate(newPos, baseCur + 1);
    },
    [positions, cursor, applyBackspace, onUpdate, lkpt, textEditingEnabled, deleteMode, correctionMode]
  );

  // ── Click-to-cursor ───────────────────────────────────────────────────────

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!textEditingEnabled) return;
      containerRef.current?.focus();
      const x = e.clientX;
      const y = e.clientY;
      let newCursor = positions.length;
      let minDist = Infinity;

      for (let i = 0; i < charElsRef.current.length; i++) {
        const el = charElsRef.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const midX = rect.left + rect.width / 2;
        const dy = Math.abs(y - midY);
        if (dy > rect.height * 1.5) continue;
        const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
        const dist = dx + dy * 2;
        if (dist < minDist) {
          minDist = dist;
          newCursor = x >= midX ? i + 1 : i;
        }
      }

      if (e.shiftKey) {
        if (selAnchorRef.current === null) { selAnchorRef.current = cursor; setSelAnchor(cursor); }
      } else {
        selAnchorRef.current = null; setSelAnchor(null);
      }
      onUpdate(positions, newCursor);
    },
    [positions, cursor, onUpdate, textEditingEnabled]
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
              animation:       "cursorBlink 1s step-end infinite",
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
        const inSel1 = selAnchorRef.current !== null && i >= Math.min(selAnchorRef.current, cursor) && i < Math.max(selAnchorRef.current, cursor);
        els.push(
          <span
            key={`p${i}`}
            ref={el => { charElsRef.current[i] = el; }}
            className="relative inline-block"
            style={{
              width: "0.6em", height: "1.15em", verticalAlign: "text-bottom",
              backgroundColor: inSel1 ? "rgba(100,130,200,0.28)" : undefined,
              borderRadius: inSel1 ? "2px" : undefined,
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

      const inSel = selAnchorRef.current !== null && i >= Math.min(selAnchorRef.current, cursor) && i < Math.max(selAnchorRef.current, cursor);
      els.push(
        <span
          key={`p${i}`}
          ref={el => { charElsRef.current[i] = el; }}
          className="relative inline-block"
          style={{
            verticalAlign: "text-bottom",
            backgroundColor: inSel ? "rgba(100,130,200,0.28)" : undefined,
            borderRadius: inSel ? "2px" : undefined,
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

  const nodes = (spiralModus || boustrophedonModus) ? [] : buildNodes();

  // ── JSX ──────────────────────────────────────────────────────────────────

  if (boustrophedonModus) {
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
          style={{ padding: "40px 48px", boxSizing: "border-box", caretColor: "transparent", overflowY: "auto" }}
        >
          <BoustrophedonZone
            positions={positions}
            cursor={cursor}
            textColor={textColor}
            fontFamily={fontFamily}
            fontSize={fontSize}
            coverBgColor={coverBgColor}
            showTippex={showTippex}
            cursorDomRef={cursorDomRef}
            writingPrompt={writingPrompt}
          />
        </div>
      </div>
    );
  }

  if (textAppearsRandom) {
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
          style={{ caretColor: "transparent" }}
        >
          <RandomTextZone
            textColor={textColor}
            fontFamily={fontFamily}
            positions={positions}
            cursor={cursor}
            fontSize={fontSize}
          />
        </div>
      </div>
    );
  }

  if (runningLineModus) {
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
          style={{ caretColor: "transparent" }}
        >
          <RunningLineCanvas
            positions={positions}
            cursor={cursor}
            textColor={textColor}
            coverBgColor={coverBgColor}
            visibility={visibility}
            split={split}
            verblasst={verblasst}
            posTimesRef={posTimesRef}
            verblassenDelay={verblassenDelay}
            verblassenSpeed={verblassenSpeed}
            driftTick={driftTick}
            fontFamily={fontFamily}
            fontSize={fontSize}
          />
        </div>
      </div>
    );
  }

  if (customPathModus) {
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
          className="absolute inset-0 outline-none"
          style={{ caretColor: "transparent" }}
        >
          <CustomPathSvg
            positions={positions}
            cursor={cursor}
            textColor={textColor}
            fontFamily={fontFamily}
            fontSize={fontSize}
            customPath={customPath}
            onCustomPathChange={onCustomPathChange}
            containerRef={containerRef}
            dark={customPathDark}
            isDe={customPathDe}
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
            coverBgColor={coverBgColor}
            visibility={visibility}
            split={split}
            verblasst={verblasst}
            posTimesRef={posTimesRef}
            verblassenDelay={verblassenDelay}
            verblassenSpeed={verblassenSpeed}
            driftTick={driftTick}
            fontFamily={fontFamily}
            fontSize={fontSize}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {centeredPrompt && positions.length === 0 && (
        <div style={{
          position: "fixed", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none", zIndex: 0,
        }}>
          <p style={{
            fontFamily: fontFamily,
            fontSize: "clamp(20px, 2.8vw, 56px)",
            lineHeight: "1.5",
            color: "#AAAAAA",
            textAlign: "center",
            width: "100%",
            padding: "0 48px",
            margin: 0,
          }}>
            {writingPrompt}
          </p>
        </div>
      )}
      <div
        className="flex-1 flex items-start"
      >
        <div
          ref={containerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onMouseDown={() => containerRef.current?.focus({ preventScroll: true })}
          onBlur={() => { selectAllRef.current = false; setSelectAll(false); selAnchorRef.current = null; setSelAnchor(null); }}
          className="outline-none cursor-text min-h-[60vh] relative"
          style={{
            width:        containerWidth,
            maxWidth:     "100%",
            marginLeft:   "auto",
            marginRight:  "auto",
            color:        textColor,
            fontFamily:   fontFamily,
            fontSize:     `${fontSize}px`,
            lineHeight:   1.6,
            caretColor:   "transparent",
            wordBreak:    "normal",
            overflowWrap: "break-word",
            transition:   "color 1s linear",
            overflow:     "visible",
            boxShadow:    selectAll ? "inset 0 0 0 2px rgba(100,130,200,0.35)" : undefined,
          }}
        >
          {positions.length === 0 && !centeredPrompt && (
            <span
              className="select-none absolute top-0 left-0 pointer-events-none"
              style={{ color: "#AAAAAA" }}
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
          fontFamily: fontFamily,
          fontSize: `${fontSize}px`,
          lineHeight: 1.6,
          visibility: "hidden",
          userSelect: "none",
          whiteSpace: "pre",
        }}
      >
        {" "}
      </span>
    </>
  );
}
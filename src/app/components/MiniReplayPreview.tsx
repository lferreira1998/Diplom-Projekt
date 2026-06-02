import { useEffect, useRef, useCallback, useMemo } from "react";
import type { NewToolParams } from "../utils/storage";

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function simpleHash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

interface CharData { x: number; y: number; vx: number; vy: number; opacity: number; }
interface CharPos  { px: number; py: number; } // % of container (0-100)

// Virtual canvas matching the 3:2 preview ratio
const VW = 300, VH = 200;

const TYPE_MS   = 40;
const EFFECT_MS = 2200;
const PAUSE_MS  = 400;
const DRIFT_SPD = 0.55;

function spiralPositions(n: number, fontSize: number): CharPos[] {
  if (n === 0) return [];
  const cx = VW / 2, cy = VH / 2;
  const minR = 12, maxR = Math.min(VW, VH) * 0.40;
  const avgFw = fontSize * 0.52;

  // estimate total sweep angle
  let estAngle = 0, tmpR = maxR;
  for (let k = 0; k < n; k++) {
    const step = avgFw / Math.max(tmpR, 4);
    estAngle += step;
    tmpR -= ((maxR - minR) / Math.max(estAngle, Math.PI * 1.2)) * step;
    tmpR = Math.max(tmpR, minR);
  }
  const tight = (maxR - minR) / Math.max(estAngle, Math.PI * 1.2);

  let angle = Math.PI * 0.5; // start bottom (newest char)
  let rad   = maxR;
  const raw: { x: number; y: number }[] = [];

  for (let i = n - 1; i >= 0; i--) {
    const step = avgFw / Math.max(rad, 4);
    angle += step;
    rad   -= tight * step;
    rad    = Math.max(rad, minR);
    raw.unshift({ x: cx + rad * Math.cos(angle), y: cy + rad * Math.sin(angle) });
  }
  return raw.map(p => ({ px: (p.x / VW) * 100, py: (p.y / VH) * 100 }));
}

function randomPositions(n: number, seed: number): CharPos[] {
  const r = mulberry32(seed + 4444);
  return Array.from({ length: n }, () => ({ px: 8 + r() * 84, py: 8 + r() * 84 }));
}

function customPositions(
  drawnPath: { x: number; y: number }[] | { x: number; y: number }[][] | undefined,
  n: number,
): CharPos[] | null {
  if (!drawnPath || drawnPath.length === 0) return null;
  let flat: { x: number; y: number }[];
  if (Array.isArray(drawnPath[0])) {
    flat = (drawnPath as { x: number; y: number }[][]).flat();
  } else {
    flat = drawnPath as { x: number; y: number }[];
  }
  if (flat.length < 2) return null;

  const xs = flat.map(p => p.x), ys = flat.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rX = maxX - minX || 1, rY = maxY - minY || 1;
  const PAD = 10;

  return Array.from({ length: n }, (_, i) => {
    const t   = n <= 1 ? 0 : i / (n - 1);
    const idx = Math.min(Math.round(t * (flat.length - 1)), flat.length - 1);
    return {
      px: PAD + ((flat[idx].x - minX) / rX) * (100 - PAD * 2),
      py: PAD + ((flat[idx].y - minY) / rY) * (100 - PAD * 2),
    };
  });
}

export function MiniReplayPreview({
  params, active, dark, toolId,
}: {
  params: NewToolParams;
  active: boolean;
  dark: boolean;
  toolId?: string;
}) {
  const text = useMemo(() =>
    (params as any).preview?.text
    || params.prompts?.[0]?.trim().slice(0, 38)
    || "I write differently.",
  [params]);

  const seed = useMemo(() =>
    (params as any).preview?.seed ?? simpleHash(toolId || "preview"),
  [params, toolId]);

  const bgColor = useMemo(() =>
    params.bgHue != null
      ? (dark ? `hsl(${params.bgHue},20%,15%)` : `hsl(${params.bgHue},35%,95%)`)
      : (dark ? "#1e1d1b" : "#f5f0ea"),
  [params.bgHue, dark]);

  const textColor = dark ? "#f0e8dc" : "#2a2a28";
  const fontSize  = Math.round(11 + (params.textSizeLevel / 100) * 11);
  const posMode   = (params.positionMode ?? "standard") as string;

  const tippexMask = useMemo(() => {
    if (!params.correctionVisible) return [] as boolean[];
    const r = mulberry32(seed + 8321);
    return text.split("").map(c => c !== " " && r() < 0.38);
  }, [text, seed, params.correctionVisible]);

  // Compute fixed char positions for non-standard layouts
  const charPositions = useMemo<CharPos[] | null>(() => {
    const n = text.length;
    if (posMode === "spiral")  return spiralPositions(n, fontSize);
    if (posMode === "random")  return randomPositions(n, seed);
    if (posMode === "custom")  return customPositions(params.drawnPath, n);
    if (posMode === "running") {
      // running line: chars in a horizontal marquee strip
      return Array.from({ length: n }, (_, i) => ({
        px: 5 + (i / Math.max(n - 1, 1)) * 90,
        py: 50,
      }));
    }
    return null;
  }, [posMode, text, fontSize, seed, params.drawnPath]);

  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const charData = useRef<CharData[]>([]);
  const rafRef   = useRef(0);
  const phaseRef = useRef<"typing" | "effect">("typing");

  const initChars = useCallback(() => {
    const r = mulberry32(seed);
    charData.current = text.split("").map(() => ({
      x: 0, y: 0,
      vx: (r() - 0.5) * 5,
      vy: (r() - 0.5) * 5,
      opacity: 0,
    }));
  }, [text, seed]);

  const visOpacity = useCallback((i: number, t: number): number => {
    const vis     = params.visibility;
    const lastSp  = text.lastIndexOf(" ");
    const lastEnd = Math.max(
      text.lastIndexOf(". "), text.lastIndexOf("? "), text.lastIndexOf("! ")
    );
    let hide = false;
    if (vis === "hidden" || vis === "invisible") hide = true;
    else if (vis === "word"     && lastSp  > 0 && i <= lastSp)      hide = true;
    else if (vis === "sentence" && lastEnd > 0 && i <= lastEnd + 1) hide = true;
    return hide ? Math.max(0, 1 - t * 1.6) : 1;
  }, [text, params.visibility]);

  const flush = useCallback((effectProg?: number) => {
    const isEff = phaseRef.current === "effect";
    const prog  = effectProg ?? 0;

    charData.current.forEach((d, i) => {
      const span = spanRefs.current[i];
      if (!span) return;

      let op = d.opacity;
      if (isEff) {
        op = Math.min(op, visOpacity(i, prog));
        if (params.textVerblassEnabled) op *= Math.max(0, 1 - prog);
      }

      span.style.opacity   = String(Math.max(0, Math.min(1, op)));
      span.style.transform = `translate(${d.x.toFixed(1)}px,${d.y.toFixed(1)}px)`;

      if (isEff && tippexMask[i] && d.opacity > 0.3) {
        span.style.color      = bgColor;
        span.style.background = bgColor;
      } else {
        span.style.color      = textColor;
        span.style.background = "transparent";
      }
    });
  }, [text, visOpacity, params.textVerblassEnabled, tippexMask, bgColor, textColor]);

  useEffect(() => {
    initChars();
    cancelAnimationFrame(rafRef.current);
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => {
      const id = setTimeout(() => { if (!cancelled) fn(); }, ms);
      timers.push(id);
    };

    if (!active) {
      phaseRef.current = "effect";
      charData.current.forEach(d => { d.opacity = 1; d.x = 0; d.y = 0; });
      if (params.textFliegtEnabled) {
        const r = mulberry32(seed + 777);
        charData.current.forEach((d, i) => {
          if (text[i] !== " ") { d.x = (r() - 0.5) * 18; d.y = (r() - 0.5) * 18; }
        });
      }
      flush(0.28);
      return () => { cancelled = true; timers.forEach(clearTimeout); };
    }

    charData.current.forEach(d => { d.opacity = 0; d.x = 0; d.y = 0; });
    phaseRef.current = "typing";
    flush();

    const startEffect = () => {
      if (cancelled) return;
      phaseRef.current = "effect";
      const start = performance.now();
      let last    = start;

      const tick = (now: number) => {
        if (cancelled) return;
        const dt   = Math.min((now - last) / 16.67, 3);
        last       = now;
        const prog = Math.min(1, (now - start) / EFFECT_MS);

        if (params.textFliegtEnabled) {
          charData.current.forEach((d, i) => {
            if (text[i] === " ") return;
            d.x += d.vx * DRIFT_SPD * dt;
            d.y += d.vy * DRIFT_SPD * dt;
          });
        }
        if (params.textVerblassEnabled) {
          charData.current.forEach(d => { d.opacity = Math.max(0, 1 - prog); });
        }

        flush(prog);

        if (prog < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          later(() => {
            initChars();
            charData.current.forEach(d => { d.opacity = 0; });
            phaseRef.current = "typing";
            flush();
            later(() => type(0), 180);
          }, PAUSE_MS);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const type = (idx: number) => {
      if (cancelled) return;
      if (idx >= text.length) { later(startEffect, 280); return; }
      charData.current[idx].opacity = 1;
      flush();
      later(() => type(idx + 1), TYPE_MS);
    };

    type(0);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, initChars, flush, text,
      params.textFliegtEnabled,
      params.textVerblassEnabled,
      params.visibility,
      seed]);

  const chars = text.split("");

  const spanStyle: React.CSSProperties = {
    display: "inline-block",
    fontSize: `${fontSize}px`,
    fontFamily: "'az-sans', sans-serif",
    color: textColor,
    opacity: 0,
    willChange: "transform, opacity",
    whiteSpace: "pre",
  };

  return (
    <div style={{
      width: "100%", aspectRatio: "3 / 2",
      background: bgColor,
      overflow: "hidden",
      position: "relative",
      cursor: "pointer",
    }}>
      {charPositions ? (
        /* ── Non-standard layouts: absolute positioning ── */
        <div style={{ position: "absolute", inset: 0 }}>
          {chars.map((char, i) => {
            const pos = charPositions[i];
            if (!pos) return null;
            return (
              /* outer div handles centering; inner span handles drift via transform */
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${pos.px}%`,
                  top:  `${pos.py}%`,
                  transform: "translate(-50%,-50%)",
                  pointerEvents: "none",
                }}
              >
                <span
                  ref={el => { spanRefs.current[i] = el; }}
                  style={spanStyle}
                >
                  {char}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Standard: inline flow ── */
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "12px 16px", boxSizing: "border-box",
        }}>
          <div style={{ lineHeight: 1.6, maxWidth: "90%", position: "relative" }}>
            {chars.map((char, i) => (
              <span
                key={i}
                ref={el => { spanRefs.current[i] = el; }}
                style={spanStyle}
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
